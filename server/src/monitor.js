const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

let cachedGraphics = null;

async function getFastStats() {
    try {
        const [currentLoad, mem, networkStats] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.networkStats()
        ]);

        return {
            cpu: {
                load: currentLoad.currentLoad,
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.total - mem.available, // Match Task Manager
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

async function getHardwareProcessUsage() {
    try {
        // Fetch GPU Utilization and Disk IO plus Process IDs in one pass
        const { stdout } = await execPromise('typeperf "\\Process(*)\\ID Process" "\\Process(*)\\IO Data Bytes/sec" "\\GPU Engine(*)\\Utilization Percentage" -sc 1 -y', { maxBuffer: 1024 * 1024 * 10 });
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) return { diskUsage: {}, gpuUsage: {}, totalGpuLoad: 0 };

        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const values = lines[1].split(',').map(v => v.replace(/"/g, ''));

        const diskUsage = {};
        const gpuUsage = {};
        let totalGpuLoad = 0;

        // Pass 1: Maps Instances to Process IDs
        const instanceToPid = {};
        headers.forEach((header, index) => {
            const match = header.match(/\\Process\(([^)]+)\)\\ID Process/);
            if (match && match[1]) {
                const pid = parseFloat(values[index]);
                if (!isNaN(pid)) {
                    instanceToPid[match[1]] = pid;
                }
            }
        });

        // Pass 2: Extract IO Data and GPU Engine Util
        headers.forEach((header, index) => {
            // Disk IO
            const ioMatch = header.match(/\\Process\(([^)]+)\)\\IO Data Bytes\/sec/);
            if (ioMatch && ioMatch[1]) {
                const pid = instanceToPid[ioMatch[1]];
                if (pid !== undefined) {
                    const val = parseFloat(values[index]);
                    if (!isNaN(val) && val > 0) {
                        diskUsage[pid] = (diskUsage[pid] || 0) + val;
                    }
                }
            }
            
            // GPU Util matches `pid_(\d+)_`
            const gpuMatch = header.match(/pid_(\d+)_/);
            if (gpuMatch && gpuMatch[1]) {
                const pid = parseInt(gpuMatch[1], 10);
                const val = parseFloat(values[index]);
                if (!isNaN(val) && val > 0) {
                    gpuUsage[pid] = (gpuUsage[pid] || 0) + val;
                    totalGpuLoad += val;
                }
            }
        });

        return { diskUsage, gpuUsage, totalGpuLoad: Math.min(totalGpuLoad, 100) };
    } catch (error) {
        // Failing silently to not disrupt normal reporting
        return { diskUsage: {}, gpuUsage: {}, totalGpuLoad: 0 };
    }
}

async function getSlowStats() {
    try {
        if (!cachedGraphics) {
            cachedGraphics = await si.graphics();
        }

        const [cpu, fsSize, processes, hwUsage, blockDevices] = await Promise.all([
            si.cpu(),
            si.fsSize(),
            si.processes(),
            getHardwareProcessUsage(),
            si.blockDevices()
        ]);

        const { diskUsage, gpuUsage, totalGpuLoad } = hwUsage;

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
            gpu: cachedGraphics.controllers.map(gpu => ({
                vendor: gpu.vendor,
                model: gpu.model,
                vram: gpu.vram,
                temperature: gpu.temperatureGpu,
                load: totalGpuLoad
            })),
            processes: {
                all: processes.list
                    .filter(p => p.name !== 'System Idle Process' && p.name !== 'Idle')
                    .map(p => ({
                        ...p,
                        gpu: gpuUsage[p.pid] || 0,
                        disk: diskUsage[p.pid] || 0
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
