import React, { useState } from 'react';
import axios from 'axios';

function ProcessTable({ processes }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'cpu', direction: 'descending' });

    const handleKill = async (pid, name) => {
        if (window.confirm(`Are you sure you want to kill process ${name} (PID: ${pid})?`)) {
            try {
                await axios.post(`http://${window.location.hostname}:3001/api/process/kill`, { pid });
                alert(`Process ${name} terminated.`);
            } catch (error) {
                alert(`Failed to kill process: ${error.response?.data?.error || error.message}`);
            }
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
                                <td>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                        onClick={() => handleKill(p.pid, p.name)}
                                    >
                                        Kill
                                    </button>
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
