const si = require('systeminformation');

async function testCpu() {
    console.log('Testing CPU Load...');
    for (let i = 0; i < 5; i++) {
        const load = await si.currentLoad();
        console.log(`Attempt ${i + 1}: ${load.currentLoad.toFixed(2)}%`);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

testCpu();
