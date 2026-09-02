const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { getHistory } = require('./db');

function checkServiceStatus(urlStr) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let parsed;
        try {
            const resolvedUrl = urlStr.replace(/\{host\}|\$\{host\}/g, '127.0.0.1');
            parsed = new URL(resolvedUrl);
        } catch {
            return resolve({ status: 'offline', latency: 0, error: 'Invalid URL' });
        }

        const host = parsed.hostname || '127.0.0.1';
        let port = parsed.port;
        if (!port) {
            port = parsed.protocol === 'https:' ? 443 : 80;
        } else {
            port = parseInt(port, 10);
        }

        const socket = new net.Socket();
        let isResolved = false;

        const cleanup = () => {
            if (!socket.destroyed) {
                socket.destroy();
            }
        };

        socket.setTimeout(2000);

        socket.on('connect', () => {
            if (!isResolved) {
                isResolved = true;
                const latency = Date.now() - startTime;
                cleanup();
                resolve({ status: 'online', latency });
            }
        });

        socket.on('timeout', () => {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                resolve({ status: 'offline', latency: 0, error: 'Timeout' });
            }
        });

        socket.on('error', (err) => {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                resolve({ status: 'offline', latency: 0, error: err.code || err.message });
            }
        });

        try {
            socket.connect(port, host);
        } catch (err) {
            if (!isResolved) {
                isResolved = true;
                cleanup();
                resolve({ status: 'offline', latency: 0, error: err.message });
            }
        }
    });
}

const DEFAULT_SHORTCUTS = [
    {
        name: 'Plex',
        url: 'http://{host}:32400/web',
        color: '#e5a00d',
        icon: 'plex'
    },
    {
        name: 'Jellyfin',
        url: 'http://{host}:8096',
        color: '#00a4dc',
        icon: 'jellyfin'
    },
    {
        name: 'Netdata',
        url: 'http://{host}:19999',
        color: '#00ab44',
        icon: 'netdata'
    }
];

router.get('/history', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 60;
    getHistory(Math.min(limit, 300), (rows) => {
        res.json(rows);
    });
});

router.get('/shortcuts', (req, res) => {
    const shortcutsPath = path.resolve(__dirname, '../shortcuts.json');
    const templatePath = path.resolve(__dirname, '../template.shortcuts.json');

    if (!fs.existsSync(shortcutsPath)) {
        try {
            if (fs.existsSync(templatePath)) {
                fs.copyFileSync(templatePath, shortcutsPath);
            } else {
                fs.writeFileSync(shortcutsPath, JSON.stringify(DEFAULT_SHORTCUTS, null, 2), 'utf-8');
            }
        } catch (err) {
            console.error('Error initializing shortcuts.json from template:', err);
            try {
                if (fs.existsSync(templatePath)) {
                    return res.json(JSON.parse(fs.readFileSync(templatePath, 'utf-8')));
                }
            } catch {}
            return res.json(DEFAULT_SHORTCUTS);
        }
    }

    fs.readFile(shortcutsPath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading shortcuts.json:', err);
            return res.json(DEFAULT_SHORTCUTS);
        }
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                return res.json(parsed);
            }
            return res.json(DEFAULT_SHORTCUTS);
        } catch (parseErr) {
            console.error('Error parsing shortcuts.json:', parseErr);
            return res.json(DEFAULT_SHORTCUTS);
        }
    });
});

router.get('/shortcuts/status', async (req, res) => {
    const shortcutsPath = path.resolve(__dirname, '../shortcuts.json');
    const templatePath = path.resolve(__dirname, '../template.shortcuts.json');

    let shortcuts = DEFAULT_SHORTCUTS;
    const targetPath = fs.existsSync(shortcutsPath) ? shortcutsPath : (fs.existsSync(templatePath) ? templatePath : null);

    if (targetPath) {
        try {
            const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
            if (Array.isArray(parsed)) {
                shortcuts = parsed;
            }
        } catch (err) {
            console.error('Error reading shortcuts for status check:', err);
        }
    }

    const results = {};
    await Promise.all(
        shortcuts.map(async (sc) => {
            const key = sc.name || sc.url;
            results[key] = await checkServiceStatus(sc.url);
        })
    );

    res.json(results);
});

// Middleware to check for authentication (Mocked for now)
const requireAuth = (req, res, next) => {
    // In a real app, check for token/session
    // For now, we assume local access is trusted or handled by frontend prompt
    next();
};

router.post('/process/kill', requireAuth, async (req, res) => {
    const { pid } = req.body;
    const numericPid = parseInt(pid, 10);
    if (!numericPid || isNaN(numericPid)) return res.status(400).json({ error: 'Valid numeric PID required' });

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
