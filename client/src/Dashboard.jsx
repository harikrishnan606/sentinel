import React from 'react';
import CpuWidget from './components/CpuWidget';
import RamWidget from './components/RamWidget';
import NetworkWidget from './components/NetworkWidget';
import ProcessTable from './components/ProcessTable';
import HistoryCharts from './components/HistoryCharts';
import GpuWidget from './components/GpuWidget';
import ServiceShortcuts from './components/ServiceShortcuts';
import axios from 'axios';

function PowerButton({ action, label, color, textColor, icon, onConfirm }) {
    const [confirming, setConfirming] = React.useState(false);

    React.useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirming) {
            onConfirm(action);
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    return (
        <button
            type="button"
            className="power-btn"
            style={{
                backgroundColor: confirming ? 'var(--danger)' : color,
                color: confirming ? '#fff' : textColor,
                boxShadow: confirming ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
            }}
            onClick={handleClick}
        >
            {icon}
            <span>{confirming ? 'Confirm?' : label}</span>
        </button>
    );
}

function Dashboard({ metrics, socket }) {
    const [toast, setToast] = React.useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4000);
    };

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
            const response = await axios.post('/api/system/power', { action });
            showToast(response.data?.message || `System ${action} triggered`, 'success');
        } catch (error) {
            console.error('Power action failed:', error);
            const errorMsg = error.response?.data?.error || error.message;
            showToast(`Failed to ${action}: ${errorMsg}`, 'error');
        }
    };

    return (
        <>
            {/* Non-blocking Mobile-Friendly Toast Notification */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '1.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 2rem)',
                        maxWidth: '420px',
                        backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--bg-secondary)',
                        color: '#fff',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}
                >
                    <span>{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        style={{
                            background: 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            marginLeft: '0.5rem',
                            padding: '0 0.25rem'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="power-controls">
                <PowerButton
                    action="sleep"
                    label="Sleep"
                    color="var(--warning)"
                    textColor="#000"
                    icon={(
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                    onConfirm={handlePowerAction}
                />
                <PowerButton
                    action="hibernate"
                    label="Hibernate"
                    color="var(--accent)"
                    textColor="#fff"
                    icon={(
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M10 4v4" />
                            <path d="M2 8h20" />
                        </svg>
                    )}
                    onConfirm={handlePowerAction}
                />
                <PowerButton
                    action="restart"
                    label="Restart"
                    color="var(--success)"
                    textColor="#fff"
                    icon={(
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                    )}
                    onConfirm={handlePowerAction}
                />
                <PowerButton
                    action="shutdown"
                    label="Shutdown"
                    color="var(--danger)"
                    textColor="#fff"
                    icon={(
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                    )}
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
                        <HistoryCharts socket={socket} />
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
