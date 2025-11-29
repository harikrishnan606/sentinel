const si = require('systeminformation');

async function checkBlockDevices() {
    try {
        const blocks = await si.blockDevices();
        console.log('Block Devices:', JSON.stringify(blocks.map(b => ({
            name: b.name,
            label: b.label,
            mount: b.mount,
            type: b.type,
            fstype: b.fstype
        })), null, 2));
    } catch (e) { console.error(e); }
}

checkBlockDevices();
