async function testPowerApi() {
    try {
        console.log('Testing Power API...');
        const response = await fetch('http://localhost:3001/api/system/power', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'test' })
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPowerApi();
