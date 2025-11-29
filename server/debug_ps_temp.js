const { exec } = require('child_process');

function testPsTemp() {
    console.log('Testing PowerShell Temperature...');
    exec('powershell "Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object CurrentTemperature"', (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error.message);
            return;
        }
        console.log('Output:', stdout);
    });
}

testPsTemp();
