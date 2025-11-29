const si = require('systeminformation');

async function checkDiskInfo() {
    console.log('Checking Disk Layout...');
    try {
        const layout = await si.diskLayout();
        console.log('Disk Layout:', JSON.stringify(layout, null, 2));
    } catch (e) { console.error(e); }

    console.log('\nChecking Block Devices...');
    try {
        const blocks = await si.blockDevices();
        console.log('Block Devices:', JSON.stringify(blocks, null, 2));
    } catch (e) { console.error(e); }

    console.log('\nChecking FS Size...');
    try {
        const fs = await si.fsSize();
        console.log('FS Size:', JSON.stringify(fs, null, 2));
    } catch (e) { console.error(e); }
}

checkDiskInfo();
