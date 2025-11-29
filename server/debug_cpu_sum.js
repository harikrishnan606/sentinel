const si = require('systeminformation');

async function testProcessSum() {
    console.log('Fetching processes...');
    const data = await si.processes();

    let totalProcessCpu = 0;
    let idleCpu = 0;

    data.list.forEach(p => {
        if (p.name === 'System Idle Process' || p.name === 'Idle') {
            idleCpu += p.cpu;
        } else {
            totalProcessCpu += p.cpu;
        }
    });

    console.log(`System Idle Process: ${idleCpu.toFixed(2)}%`);
    console.log(`Sum of other processes: ${totalProcessCpu.toFixed(2)}%`);
    console.log(`Calculated Load (Sum): ${totalProcessCpu.toFixed(2)}%`);
    console.log(`Calculated Load (100 - Idle): ${(100 - idleCpu).toFixed(2)}%`);
}

testProcessSum();
