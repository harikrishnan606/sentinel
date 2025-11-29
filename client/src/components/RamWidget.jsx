import React from 'react';

function RamWidget({ data }) {
    const usedPercent = (data.active / data.total) * 100;

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">Memory Usage</div>
            </div>

            <div className="metric-value">
                {usedPercent.toFixed(1)}%
            </div>
            <div className="metric-sub">
                {(data.active / 1024 / 1024 / 1024).toFixed(1)} GB / {(data.total / 1024 / 1024 / 1024).toFixed(1)} GB
            </div>

            <div style={{ marginTop: '1rem', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${usedPercent}%`,
                    height: '100%',
                    backgroundColor: usedPercent > 80 ? 'var(--warning)' : 'var(--success)',
                    transition: 'width 0.5s ease-in-out'
                }}></div>
            </div>
        </div>
    );
}

export default RamWidget;
