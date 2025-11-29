import React from 'react';

function GpuWidget({ data }) {
    // Filter out Microsoft Remote Display Adapter or empty ones if needed
    // For now, take the first one that looks real (has VRAM or specific vendor)
    const gpu = data.find(g => (g.vendor && (g.vendor.includes('NVIDIA') || g.vendor.includes('Intel') || g.vendor.includes('AMD')))) || data[0];

    if (!gpu) return <div className="card">No GPU Detected</div>;

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">GPU</div>
                <div className="card-title" style={{ fontSize: '0.75rem' }}>{gpu.vendor}</div>
            </div>

            <div className="metric-value" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {gpu.model}
            </div>

            <div className="metric-sub">
                VRAM: {gpu.vram ? `${(gpu.vram / 1024).toFixed(1)} GB` : 'N/A'}
            </div>
            <div className="metric-sub">
                Temp: {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
            </div>

            <div style={{ marginTop: '1rem', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${gpu.load || 0}%`,
                    height: '100%',
                    backgroundColor: (gpu.load || 0) > 80 ? 'var(--danger)' : 'var(--accent)',
                    transition: 'width 0.5s ease-in-out'
                }}></div>
            </div>
            <div className="metric-sub" style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                {gpu.load ? `${gpu.load.toFixed(1)}%` : '0%'} Load
            </div>
        </div>
    );
}

export default GpuWidget;
