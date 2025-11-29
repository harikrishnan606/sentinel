const si = require('systeminformation');

async function testGpu() {
    console.log('Fetching GPU Info...');
    try {
        const graphics = await si.graphics();
        console.log('Controllers:', JSON.stringify(graphics.controllers, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testGpu();
