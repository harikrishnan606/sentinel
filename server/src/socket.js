const { getFastStats, getSlowStats, getHardwareProcessUsage } = require('./monitor');
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
            const hw = await getHardwareProcessUsage();
            if (hw) {
                fullStats.processes.all = hw.processes;
                fullStats.processes.total = hw.processes.length;
                if (fullStats.gpu && fullStats.gpu.length > 0) {
                    fullStats.gpu.forEach(g => g.load = hw.totalGpuLoad);
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
        
        const currentLoad = (fullStats.gpu && fullStats.gpu[0]) ? fullStats.gpu[0].load : 0;
        fullStats.gpu = slow.gpu;
        if (fullStats.gpu) fullStats.gpu.forEach(g => g.load = currentLoad);
    }
}

module.exports = { setupSocket };
