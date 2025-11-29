import React from 'react';
import CpuWidget from './components/CpuWidget';
import RamWidget from './components/RamWidget';
import NetworkWidget from './components/NetworkWidget';
import ProcessTable from './components/ProcessTable';
import HistoryCharts from './components/HistoryCharts';
import GpuWidget from './components/GpuWidget';
import axios from 'axios';

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
        if (window.confirm(`Are you sure you want to ${action} the system?`)) {
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
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    className="btn"
                    style={{ backgroundColor: 'var(--warning)', color: '#000' }}
                    onClick={() => handlePowerAction('sleep')}
                >
                    Sleep
                </button>
                <button
                    className="btn"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    onClick={() => handlePowerAction('hibernate')}
                >
                    Hibernate
                </button>
                <button
                    className="btn btn-danger"
                    onClick={() => handlePowerAction('shutdown')}
                >
                    Shutdown
                </button>
            </div>
            <div className="dashboard-grid">
                <CpuWidget data={metrics.cpu} />
                <RamWidget data={metrics.memory} />
                <NetworkWidget data={metrics.network} />
                {metrics.gpu && metrics.gpu.length > 0 && <GpuWidget data={metrics.gpu} />}
            </div>

            <div className="dashboard-grid dashboard-split">
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">System History</div>
                    </div>
                    <HistoryCharts />
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
