const si = require('systeminformation');

async function getFastStats() {
    try {
        const [currentLoad, mem, networkStats] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.networkStats()
        ]);

        let load = currentLoad.currentLoad;

        // Fallback for Windows reporting 100% load incorrectly
        if (load > 99 && process.platform === 'win32') {
            const processes = await si.processes();
            const idleProcess = processes.list.find(p => p.name === 'System Idle Process' || p.name === 'Idle');
            if (idleProcess) {
                load = 100 - idleProcess.cpu;
            }
        }

        return {
            cpu: {
                load: load,
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.total - mem.available, // Match Task Manager (Total - Available)
                active: mem.total - mem.available, // Use same logic for consistency
                available: mem.available
            },
            network: networkStats.map(iface => ({
                iface: iface.iface,
                ip4: iface.ip4,
                rx_sec: iface.rx_sec,
                tx_sec: iface.tx_sec,
                operstate: iface.operstate
            }))
        };
    } catch (error) {
        console.error('Error gathering fast stats:', error);
        return null;
    }
}

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getGpuLoad() {
    try {
        const cmd = 'powershell "(Get-Counter \\"\\GPU Engine(*)\\Utilization Percentage\\").CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"';
        const { stdout } = await execPromise(cmd);
        const load = parseFloat(stdout.trim());
        return isNaN(load) ? 0 : load;
    } catch (error) {
        console.error('Error getting GPU load:', error.message);
        return 0;
    }
}



async function getDiskProcessUsage() {
    try {
        // Fetch both ID Process and IO Data Bytes/sec
        // We need a larger buffer for many processes
        const { stdout } = await execPromise('typeperf "\\Process(*)\\ID Process" "\\Process(*)\\IO Data Bytes/sec" -sc 1 -y', { maxBuffer: 1024 * 1024 * 10 });
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) return {};

        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const values = lines[1].split(',').map(v => v.replace(/"/g, ''));

        const pidMap = {}; // Index -> PID
        const diskUsage = {}; // PID -> Bytes/sec

        // First pass: Find PIDs
        headers.forEach((header, index) => {
            if (header.includes('\\ID Process')) {
                const val = parseFloat(values[index]);
                if (!isNaN(val)) {
                    pidMap[index] = val; // Store PID at this index
                }
            }
        });

        // Second pass: Find IO Data and map to PID
        // The counters are usually returned in blocks. 
        // We need to match the instance name.
        // A safer way is to parse the instance name from the header.

        // Let's build a map of InstanceName -> PID
        const instanceToPid = {};

        headers.forEach((header, index) => {
            // Header format: \\Machine\Process(Instance)\Counter
            const match = header.match(/\\Process\(([^)]+)\)\\ID Process/);
            if (match && match[1]) {
                const instance = match[1];
                const pid = parseFloat(values[index]);
                if (!isNaN(pid)) {
                    instanceToPid[instance] = pid;
                }
            }
        });

        headers.forEach((header, index) => {
            const match = header.match(/\\Process\(([^)]+)\)\\IO Data Bytes\/sec/);
            if (match && match[1]) {
                const instance = match[1];
                const pid = instanceToPid[instance];
                if (pid !== undefined) {
                    const val = parseFloat(values[index]);
                    if (!isNaN(val)) {
                        diskUsage[pid] = (diskUsage[pid] || 0) + val;
                    }
                }
            }
        });

        return diskUsage;
    } catch (error) {
        console.error('Error getting Disk usage:', error.message);
        return {};
    }
}

async function getGpuProcessUsage() {
    try {
        // Limit to 1 sample, CSV output
        const { stdout } = await execPromise('typeperf "\\GPU Engine(*)\\Utilization Percentage" -sc 1 -y');
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) return {};

        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const values = lines[1].split(',').map(v => v.replace(/"/g, ''));

        const processUsage = {};

        headers.forEach((header, index) => {
            // Header format: \GPU Engine(pid_1234_...)\Utilization Percentage
            const match = header.match(/pid_(\d+)_/);
            if (match && match[1]) {
                const pid = parseInt(match[1]);
                const val = parseFloat(values[index]);
                if (!isNaN(val)) {
                    processUsage[pid] = (processUsage[pid] || 0) + val;
                }
            }
        });

        return processUsage;
    } catch (error) {
        // typeperf might fail or be slow, return empty object gracefully
        return {};
    }
}

async function getSlowStats() {
    try {
        const [cpu, fsSize, graphics, processes, gpuLoad, gpuProcessUsage, diskProcessUsage, blockDevices] = await Promise.all([
            si.cpu(),
            si.fsSize(),
            si.graphics(),
            si.processes(),
            getGpuLoad(),
            getGpuProcessUsage(),
            getDiskProcessUsage(),
            si.blockDevices()
        ]);

        // Create a map of mount point -> label
        const driveLabels = {};
        blockDevices.forEach(device => {
            if (device.mount) {
                driveLabels[device.mount] = device.label || 'Local Disk';
            }
        });

        return {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                speed: cpu.speed,
                cores: cpu.cores,
                temp: await si.cpuTemperature()
            },
            storage: fsSize.map(drive => ({
                fs: drive.fs,
                type: drive.type,
                size: drive.size,
                used: drive.used,
                use: drive.use,
                mount: drive.mount,
                label: driveLabels[drive.mount] || 'Local Disk'
            })),
            gpu: graphics.controllers.map(gpu => ({
                vendor: gpu.vendor,
                model: gpu.model,
                vram: gpu.vram,
                temperature: gpu.temperatureGpu,
                load: gpuLoad // Assign total load to all controllers for now
            })),
            processes: {
                all: processes.list
                    .filter(p => p.name !== 'System Idle Process' && p.name !== 'Idle')
                    .map(p => ({
                        ...p,
                        gpu: gpuProcessUsage[p.pid] || 0,
                        disk: diskProcessUsage[p.pid] || 0
                    }))
                    .sort((a, b) => b.cpu - a.cpu)
                    .slice(0, 20)
                    .map(p => ({
                        pid: p.pid,
                        name: p.name,
                        cpu: p.cpu,
                        mem: p.mem,
                        gpu: p.gpu,
                        disk: p.disk
                    })),
                total: processes.all,
                running: processes.running,
                blocked: processes.blocked,
                sleeping: processes.sleeping
            }
        };
    } catch (error) {
        console.error('Error gathering slow stats:', error);
        return null;
    }
}

module.exports = { getFastStats, getSlowStats };
