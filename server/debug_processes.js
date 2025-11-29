const si = require('systeminformation');

async function checkProcessSort() {
    console.log('Fetching processes...');
    const data = await si.processes();
    const list = data.list;

    console.log('First 5 processes in raw list:');
    list.slice(0, 5).forEach(p => console.log(`${p.name}: ${p.cpu}%`));

    // Check if sorted
    const sortedByCpu = [...list].sort((a, b) => b.cpu - a.cpu);
    console.log('\nTop 5 processes by CPU (Manual Sort):');
    sortedByCpu.slice(0, 5).forEach(p => console.log(`${p.name}: ${p.cpu}%`));
}

checkProcessSort();
