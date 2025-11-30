import React, { useState, useEffect } from 'react';
import axios from 'axios';

function KillButton({ pid, name, onKill }) {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    const handleClick = () => {
        if (confirming) {
            onKill(pid, name);
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    return (
        <button
            className="btn"
            style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: confirming ? 'var(--danger)' : 'var(--bg-secondary)',
                color: confirming ? '#fff' : 'var(--text-primary)',
                border: confirming ? 'none' : '1px solid var(--border)',
                transition: 'all 0.2s ease',
                minWidth: '60px'
            }}
            onClick={handleClick}
        >
            {confirming ? 'Confirm?' : 'Kill'}
        </button>
    );
}

function ProcessTable({ processes }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'cpu', direction: 'descending' });

    const handleKill = async (pid, name) => {
        try {
            await axios.post(`http://${window.location.hostname}:3001/api/process/kill`, { pid });
            console.log(`Process ${name} terminated.`);
        } catch (error) {
            console.error(`Failed to kill process: ${error.response?.data?.error || error.message}`);
        }
    };

    const sortedProcesses = [...processes.all].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const filteredProcesses = sortedProcesses.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">Top Processes</div>
                <input
                    type="text"
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                    }}
                />
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('pid')} style={{ cursor: 'pointer' }}>PID</th>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>Name</th>
                            <th onClick={() => requestSort('cpu')} style={{ cursor: 'pointer' }}>CPU %</th>
                            <th onClick={() => requestSort('mem')} style={{ cursor: 'pointer' }}>Mem %</th>
                            <th onClick={() => requestSort('gpu')} style={{ cursor: 'pointer' }}>GPU %</th>
                            <th onClick={() => requestSort('disk')} style={{ cursor: 'pointer' }}>Disk</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProcesses.map(p => (
                            <tr key={p.pid}>
                                <td>{p.pid}</td>
                                <td>{p.name}</td>
                                <td>{p.cpu.toFixed(1)}%</td>
                                <td>{p.mem.toFixed(1)}%</td>
                                <td>{p.gpu ? p.gpu.toFixed(1) : '0.0'}%</td>
                                <td>{formatBytes(p.disk || 0)}/s</td>
                                <td>
                                    <KillButton pid={p.pid} name={p.name} onKill={handleKill} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProcessTable;
