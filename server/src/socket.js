const { getFastStats, getSlowStats } = require('./monitor');
const { saveMetrics, getHistory } = require('./db');

let fastInterval;
let slowInterval;

// Cache to store the latest state
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

        // Send initial history
        getHistory(100, (data) => {
            socket.emit('history', data);
        });

        // Send immediate current stats if available
        socket.emit('metrics', fullStats);

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    // Fast loop (1s) - CPU load, Memory, Network
    if (!fastInterval) {
        fastInterval = setInterval(async () => {
            const fast = await getFastStats();
            if (fast) {
                // Merge fast stats into fullStats
                fullStats.cpu.load = fast.cpu.load;
                fullStats.memory = fast.memory;
                fullStats.network = fast.network;

                io.emit('metrics', fullStats);
                saveMetrics(fast.cpu.load, fast.memory);
            }
        }, 1000);
    }

    // Slow loop (5s) - Processes, Disk, Static Info
    if (!slowInterval) {
        // Run once immediately
        updateSlowStats();
        slowInterval = setInterval(updateSlowStats, 5000);
    }
}

async function updateSlowStats() {
    const slow = await getSlowStats();
    if (slow) {
        // Merge slow stats
        fullStats.cpu = { ...fullStats.cpu, ...slow.cpu }; // Keep load, update static
        fullStats.storage = slow.storage;
        fullStats.gpu = slow.gpu;
        fullStats.processes = slow.processes;
    }
}

module.exports = { setupSocket };
