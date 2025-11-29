import React from 'react';

function CpuWidget({ data }) {
    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">CPU Usage</div>
                <div className="card-title">{data.brand}</div>
            </div>

            <div className="metric-value">
                {data.load.toFixed(1)}%
            </div>
            <div className="metric-sub">
                {data.cores} Cores @ {data.speed} GHz
            </div>
            <div className="metric-sub">
                Temp: {data.temp && data.temp.main ? `${data.temp.main}°C` : 'N/A (Admin Req)'}
            </div>

            <div style={{ marginTop: '1rem', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${data.load}%`,
                    height: '100%',
                    backgroundColor: data.load > 80 ? 'var(--danger)' : 'var(--accent)',
                    transition: 'width 0.5s ease-in-out'
                }}></div>
            </div>
        </div>
    );
}

export default CpuWidget;
