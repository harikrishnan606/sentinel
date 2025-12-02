import React from 'react';
import CpuWidget from './components/CpuWidget';
import RamWidget from './components/RamWidget';
import NetworkWidget from './components/NetworkWidget';
import ProcessTable from './components/ProcessTable';
import HistoryCharts from './components/HistoryCharts';
import GpuWidget from './components/GpuWidget';
import ServiceShortcuts from './components/ServiceShortcuts';
import axios from 'axios';

function PowerButton({ action, label, color, textColor, onConfirm }) {
    const [confirming, setConfirming] = React.useState(false);

    React.useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    const handleClick = () => {
        if (confirming) {
            onConfirm(action);
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    return (
        <button
            className="btn"
            style={{
                backgroundColor: confirming ? 'var(--danger)' : color,
                color: confirming ? '#fff' : textColor,
                transition: 'all 0.2s ease',
                minWidth: '100px'
            }}
            onClick={handleClick}
        >
            {confirming ? 'Confirm?' : label}
        </button>
    );
}

function Dashboard({ metrics }) {
    const totalStorage = metrics.storage.reduce((acc, drive) => acc + drive.size, 0);
    const totalUsed = metrics.storage.reduce((acc, drive) => acc + drive.used, 0);
    const totalFree = totalStorage - totalUsed;

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handlePowerAction = async (action) => {
        try {
            console.log(`Sending power action: ${action}`);
            const response = await axios.post(`http://${window.location.hostname}:3001/api/system/power`, { action });
            console.log('Power action response:', response.data);
            alert(`Success: ${response.data.message}`);
        } catch (error) {
            console.error('Power action failed:', error);
            const errorMsg = error.response?.data?.error || error.message;
            const status = error.response?.status;
            alert(`Failed to ${action} (Status: ${status}): ${errorMsg}`);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <PowerButton
                    action="sleep"
                    label="Sleep"
                    color="var(--warning)"
                    textColor="#000"
                    onConfirm={handlePowerAction}
                />
                <PowerButton
                    action="hibernate"
                    label="Hibernate"
                    color="var(--accent)"
                    textColor="#fff"
                    onConfirm={handlePowerAction}
                />
                <PowerButton
                    action="shutdown"
                    label="Shutdown"
                    color="var(--danger)"
                    textColor="#fff"
                    onConfirm={handlePowerAction}
                />
            </div>

            <ServiceShortcuts />

            <div className="dashboard-grid">
                <CpuWidget data={metrics.cpu} />
                <RamWidget data={metrics.memory} />
                <NetworkWidget data={metrics.network} />
                {metrics.gpu && metrics.gpu.length > 0 && <GpuWidget data={metrics.gpu} />}
            </div>

            <div className="dashboard-grid dashboard-split">
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <div className="card-title">System History</div>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <HistoryCharts />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Storage</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {formatBytes(totalUsed)} / {formatBytes(totalStorage)} ({formatBytes(totalFree)} Free)
                        </div>
                    </div>
                    {metrics.storage.map((drive, i) => (
                        <div key={i} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                <span>{drive.label} ({drive.mount})</span>
                                <span>{Math.round(drive.use)}%</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${drive.use}%`,
                                    height: '100%',
                                    backgroundColor: drive.use > 90 ? 'var(--danger)' : 'var(--accent)'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{(drive.used / 1024 / 1024 / 1024).toFixed(1)} GB used of {(drive.size / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                                <span>{((drive.size - drive.used) / 1024 / 1024 / 1024).toFixed(1)} GB free</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProcessTable processes={metrics.processes} />
        </>
    );
}

export default Dashboard;
