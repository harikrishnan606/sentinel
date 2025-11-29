const { exec } = require('child_process');

function getGpuLoad() {
    console.log('Fetching GPU Load via PowerShell...');
    const cmd = 'powershell "(Get-Counter \\"\\GPU Engine(*)\\Utilization Percentage\\").CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"';

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error.message);
            return;
        }
        console.log('Raw Output:', stdout.trim());
        console.log('Parsed:', parseFloat(stdout.trim()).toFixed(2) + '%');
    });
}

getGpuLoad();
