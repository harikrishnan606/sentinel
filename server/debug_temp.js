const si = require('systeminformation');

async function testTemp() {
    console.log('Fetching CPU Temperature...');
    try {
        const temp = await si.cpuTemperature();
        console.log('Full Temperature Object:', JSON.stringify(temp, null, 2));
        console.log(`Main Temp: ${temp.main}`);
        console.log(`Cores: ${temp.cores}`);
        console.log(`Max: ${temp.max}`);
    } catch (e) {
        console.error('Error:', e);
    }
}

testTemp();
