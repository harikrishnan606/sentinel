const { getFastStats, getSlowStats, getHardwareProcessUsage, getNvidiaStats } = require('./monitor');
const { saveMetrics, getHistory } = require('./db');

let fastInterval;
let slowInterval;
let processInterval;

let fullStats = {
    cpu: { load: 0, brand: 'Loading...', cores: 0, speed: 0, temp: {} },
    memory: { total: 0, used: 0, free: 0, active: 0 },
    network: [],
    storage: [],
    gpu: [],
    processes: { all: [], total: 0, running: 0 }
};

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('Client connected');

        getHistory(100, (data) => {
            socket.emit('history', data);
        });

        socket.emit('metrics', fullStats);

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    if (!fastInterval) {
        fastInterval = setInterval(async () => {
            const fast = await getFastStats();
            if (fast) {
                fullStats.cpu.load = fast.cpu.load;
                fullStats.memory = fast.memory;
                fullStats.network = fast.network;

                io.emit('metrics', fullStats);
                saveMetrics(fast.cpu.load, fast.memory);
            }
        }, 1000);
    }

    if (!processInterval) {
        processInterval = setInterval(async () => {
            const [hw, nvidiaStats] = await Promise.all([
                getHardwareProcessUsage(),
                getNvidiaStats()
            ]);

            if (hw) {
                fullStats.processes.all = hw.processes;
                fullStats.processes.total = hw.processes.length;

                const dedicatedStats = (nvidiaStats && nvidiaStats[0]) ? nvidiaStats[0] : null;

                if (fullStats.gpu && fullStats.gpu.length > 0) {
                    fullStats.gpu.forEach(g => {
                        const isDedicated = g.isDedicated || g.vendor?.toLowerCase().includes('nvidia');
                        if (isDedicated && dedicatedStats) {
                            g.load = dedicatedStats.load;
                            g.vramUsed = dedicatedStats.memoryUsed;
                            g.vram = dedicatedStats.memoryTotal || g.vram;
                            if (dedicatedStats.temperature) {
                                g.temperature = dedicatedStats.temperature;
                            }
                        } else if (!isDedicated) {
                            const dedicatedLoad = dedicatedStats ? dedicatedStats.load : 0;
                            g.load = Math.max(0, Math.min(100, hw.totalGpuLoad - dedicatedLoad));
                        }
                    });
                }
            }
        }, 2000);
    }

    if (!slowInterval) {
        updateSlowStats();
        slowInterval = setInterval(updateSlowStats, 15000);
    }
}

async function updateSlowStats() {
    const slow = await getSlowStats();
    if (slow) {
        fullStats.cpu = { ...fullStats.cpu, ...slow.cpu };
        fullStats.storage = slow.storage;
        
        const existingData = {};
        if (fullStats.gpu) {
            fullStats.gpu.forEach(g => {
                existingData[g.model] = {
                    load: g.load,
                    vramUsed: g.vramUsed,
                    temperature: g.temperature
                };
            });
        }

        fullStats.gpu = slow.gpu.map(g => ({
            ...g,
            load: existingData[g.model]?.load ?? 0,
            vramUsed: existingData[g.model]?.vramUsed,
            temperature: existingData[g.model]?.temperature ?? g.temperature
        }));
    }
}

module.exports = { setupSocket };
