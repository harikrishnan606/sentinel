const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const os = require('os');
const totalMem = os.totalmem();

let cachedGraphics = null;

async function getFastStats() {
    try {
        const [currentLoad, networkStdout] = await Promise.all([
            si.currentLoad(),
            execPromise('typeperf "\\Network Interface(*)\\Bytes Received/sec" "\\Network Interface(*)\\Bytes Sent/sec" -sc 1').then(res => res.stdout).catch(() => '')
        ]);

        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        let networkStats = [];
        if (networkStdout) {
            const lines = networkStdout.trim().split('\n');
            if (lines.length >= 2) {
                const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
                const values = lines[1].split(',').map(v => v.replace(/"/g, ''));
                
                let rxTotal = 0;
                let txTotal = 0;

                headers.forEach((header, i) => {
                    if (header.includes('Bytes Received/sec')) {
                        const val = parseFloat(values[i]);
                        if (!isNaN(val) && val >= 0) rxTotal += val;
                    }
                    if (header.includes('Bytes Sent/sec')) {
                        const val = parseFloat(values[i]);
                        if (!isNaN(val) && val >= 0) txTotal += val;
                    }
                });

                networkStats = [{
                    iface: 'All Interfaces',
                    ip4: '',
                    rx_sec: rxTotal,
                    tx_sec: txTotal,
                    operstate: 'up'
                }];
            }
        }

        return {
            cpu: {
                load: currentLoad.currentLoad,
            },
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                active: usedMem,
                available: freeMem
            },
            network: networkStats
        };
    } catch (error) {
        console.error('Error gathering fast stats:', error);
        return null;
    }
}

async function getHardwareProcessUsage() {
    try {
        const { stdout } = await execPromise('typeperf "\\Process(*)\\ID Process" "\\Process(*)\\% Processor Time" "\\Process(*)\\Working Set - Private" "\\Process(*)\\IO Data Bytes/sec" "\\GPU Engine(*)\\Utilization Percentage" -sc 1 -y', { maxBuffer: 1024 * 1024 * 10 });
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) return { processes: [], totalGpuLoad: 0 };

        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const values = lines[1].split(',').map(v => v.replace(/"/g, ''));

        const processMap = {};
        let totalGpuLoad = 0;

        // Pass 1
        const instanceToPid = {};
        headers.forEach((header, index) => {
            const match = header.match(/\\Process\(([^)]+)\)\\ID Process/);
            if (match && match[1] && match[1] !== '_Total' && match[1] !== 'Idle') {
                const pid = parseFloat(values[index]);
                if (!isNaN(pid) && pid > 0) {
                    const rawName = match[1];
                    const cleanName = rawName.split('#')[0];
                    instanceToPid[rawName] = pid;
                    
                    if (!processMap[pid]) {
                        processMap[pid] = {
                            pid: pid,
                            name: cleanName,
                            cpu: 0,
                            mem: 0,
                            gpu: 0,
                            disk: 0
                        };
                    }
                }
            }
        });

        // Pass 2
        headers.forEach((header, index) => {
            const cpuMatch = header.match(/\\Process\(([^)]+)\)\\\% Processor Time/);
            if (cpuMatch && cpuMatch[1] && instanceToPid[cpuMatch[1]]) {
                const pid = instanceToPid[cpuMatch[1]];
                const val = parseFloat(values[index]);
                if (!isNaN(val) && val >= 0) {
                    processMap[pid].cpu += Math.min(val / os.cpus().length, 100);
                }
            }

            const memMatch = header.match(/\\Process\(([^)]+)\)\\Working Set \- Private/);
            if (memMatch && memMatch[1] && instanceToPid[memMatch[1]]) {
                const pid = instanceToPid[memMatch[1]];
                const val = parseFloat(values[index]);
                if (!isNaN(val) && val >= 0) {
                    processMap[pid].mem = (val / totalMem) * 100;
                }
            }

            const ioMatch = header.match(/\\Process\(([^)]+)\)\\IO Data Bytes\/sec/);
            if (ioMatch && ioMatch[1] && instanceToPid[ioMatch[1]]) {
                const pid = instanceToPid[ioMatch[1]];
                const val = parseFloat(values[index]);
                if (!isNaN(val) && val >= 0) {
                    processMap[pid].disk += val;
                }
            }
            
            const gpuMatch = header.match(/pid_(\d+)_/);
            if (gpuMatch && gpuMatch[1]) {
                const pid = parseInt(gpuMatch[1], 10);
                const val = parseFloat(values[index]);
                if (!isNaN(val) && val > 0) {
                    if (processMap[pid]) processMap[pid].gpu += val;
                    totalGpuLoad += val;
                }
            }
        });

        const allProcesses = Object.values(processMap)
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 20);

        return { processes: allProcesses, totalGpuLoad: Math.min(totalGpuLoad, 100) };
    } catch (error) {
        return { processes: [], totalGpuLoad: 0 };
    }
}

async function getSlowStats() {
    try {
        if (!cachedGraphics) {
            cachedGraphics = await si.graphics();
        }

        const [cpu, fsSize, blockDevices] = await Promise.all([
            si.cpu(),
            si.fsSize(),
            si.blockDevices()
        ]);

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
                load: 0
            }))
        };
    } catch (error) {
        console.error('Error gathering slow stats:', error);
        return null;
    }
}

module.exports = { getFastStats, getHardwareProcessUsage, getSlowStats };
