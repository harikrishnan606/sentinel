const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const { exec } = require('child_process');

// Middleware to check for authentication (Mocked for now)
const requireAuth = (req, res, next) => {
    // In a real app, check for token/session
    // For now, we assume local access is trusted or handled by frontend prompt
    next();
};

router.post('/process/kill', requireAuth, async (req, res) => {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: 'PID required' });

    try {
        // Using systeminformation to kill process is safer cross-platform
        // But si.processes().then... doesn't have kill.
        // We use process.kill for node, but that kills *node* processes.
        // We need to use OS command.

        // Windows: taskkill /PID <pid> /F
        // Linux/Mac: kill -9 <pid>

        const command = process.platform === 'win32'
            ? `taskkill /PID ${pid} /F`
            : `kill -9 ${pid}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).json({ error: 'Failed to kill process' });
            }
            res.json({ success: true, message: `Process ${pid} terminated` });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/system/power', requireAuth, (req, res) => {
    const { action } = req.body;
    // action: 'shutdown', 'restart', 'sleep'

    // CAUTION: This actually performs the action.
    // For safety in this demo, we might want to just log it or require a special flag.
    // But per requirements, it should work.

    // We will implement but maybe comment out the actual execution for safety during dev?
    // No, user asked for the app. I will implement it but maybe add a delay or log.

    console.log(`Received power action: ${action}`);

    let command;
    if (action === 'test') {
        return res.json({ success: true, message: 'Power API is reachable' });
    }

    if (process.platform === 'win32') {
        if (action === 'shutdown') command = 'shutdown /s /t 5';
        if (action === 'restart') command = 'shutdown /r /t 5';
        if (action === 'sleep') command = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState(\'Suspend\', $false, $false)"';
        if (action === 'hibernate') command = 'shutdown /h';
    } else {
        if (action === 'shutdown') command = 'shutdown -h now';
        if (action === 'restart') command = 'shutdown -r now';
        if (action === 'sleep') command = 'systemctl suspend';
        if (action === 'hibernate') command = 'systemctl hibernate';
    }

    if (!command) {
        console.error(`Invalid action: ${action}`);
        return res.status(400).json({ error: 'Invalid action or platform' });
    }

    // EXECUTE
    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Power command failed: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Failed to execute power command' });
        }
        console.log(`Command executed successfully: ${stdout}`);
        res.json({ success: true, message: `System will ${action} shortly` });
    });
});

module.exports = router;
