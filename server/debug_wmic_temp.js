const { exec } = require('child_process');

function testWmicTemp() {
    console.log('Testing WMIC Temperature...');
    exec('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature', (error, stdout, stderr) => {
        if (error) {
            console.error('Error:', error.message);
            return;
        }
        console.log('Output:', stdout);
    });
}

testWmicTemp();
