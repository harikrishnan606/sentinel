const os = require('os');

function getCpuLoad() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;

    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }

    return { user, nice, sys, idle, irq, total: user + nice + sys + idle + irq };
}

async function test() {
    console.log('Testing os.cpus()...');
    let start = getCpuLoad();

    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const end = getCpuLoad();

        const totalDiff = end.total - start.total;
        const idleDiff = end.idle - start.idle;
        const load = 100 - ((idleDiff / totalDiff) * 100);

        console.log(`Attempt ${i + 1}: ${load.toFixed(2)}% (Idle: ${idleDiff}, Total: ${totalDiff})`);
        start = end;
    }
}

test();
