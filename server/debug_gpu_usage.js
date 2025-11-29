const si = require('systeminformation');

async function checkGpuLoad() {
    console.log('Checking GPU Load...');
    try {
        const graphics = await si.graphics();
        console.log('Graphics Controller 0:', JSON.stringify(graphics.controllers[0], null, 2));

        // Check if there's a specific load function or if it's in graphics()
        // si.currentLoad() is for CPU. 
        // Let's check if there is any other way.
    } catch (e) {
        console.error(e);
    }

    console.log('\nChecking Processes for GPU...');
    try {
        const processes = await si.processes();
        if (processes.list.length > 0) {
            console.log('First Process Keys:', Object.keys(processes.list[0]));
            // Check if any process has gpu usage
            const gpuProcess = processes.list.find(p => p.gpu || p.gpuUsage);
            if (gpuProcess) {
                console.log('Found process with GPU:', gpuProcess);
            } else {
                console.log('No GPU field found in processes.');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

checkGpuLoad();
