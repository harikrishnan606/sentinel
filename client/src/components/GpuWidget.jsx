import React from 'react';

function SingleGpuCard({ gpu }) {
    if (!gpu) return null;

    const isDedicated = gpu.isDedicated || (gpu.vendor && gpu.vendor.toLowerCase().includes('nvidia')) || (gpu.type === 'Dedicated');
    const typeLabel = isDedicated ? 'Dedicated' : 'Integrated';
    const typeBadgeColor = isDedicated ? 'var(--accent)' : 'var(--text-secondary)';

    const vramText = gpu.vramUsed !== undefined && gpu.vram
        ? `${(gpu.vramUsed / 1024).toFixed(1)} GB / ${(gpu.vram / 1024).toFixed(1)} GB`
        : (gpu.vram ? `${(gpu.vram / 1024).toFixed(1)} GB` : 'Shared / Dynamic');

    const loadPercent = Math.min(100, Math.max(0, gpu.load || 0));

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="card-title">GPU</div>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        backgroundColor: isDedicated ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: typeBadgeColor,
                        border: '1px solid var(--border)'
                    }}>
                        {typeLabel}
                    </span>
                </div>
                <div className="card-title" style={{ fontSize: '0.75rem' }}>{gpu.vendor}</div>
            </div>

            <div className="metric-value" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={gpu.model}>
                {gpu.model}
            </div>

            <div className="metric-sub">
                VRAM: {vramText}
            </div>
            <div className="metric-sub">
                Temp: {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
            </div>

            <div style={{ marginTop: '1rem', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${loadPercent}%`,
                    height: '100%',
                    backgroundColor: loadPercent > 80 ? 'var(--danger)' : (isDedicated ? 'var(--accent)' : 'var(--success)'),
                    transition: 'width 0.5s ease-in-out'
                }}></div>
            </div>
            <div className="metric-sub" style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                {gpu.load ? `${gpu.load.toFixed(1)}%` : '0%'} Load
            </div>
        </div>
    );
}

function GpuWidget({ data }) {
    if (!data) return <div className="card">No GPU Detected</div>;

    if (Array.isArray(data)) {
        // Filter out virtual display drivers (e.g. Microsoft Remote Display Adapter)
        const realGpus = data.filter(g => g.vendor && !g.vendor.includes('Microsoft') && g.model && !g.model.includes('Remote Display'));
        if (realGpus.length === 0) return <div className="card">No GPU Detected</div>;

        return (
            <>
                {realGpus.map((gpu, index) => (
                    <SingleGpuCard key={gpu.model || index} gpu={gpu} />
                ))}
            </>
        );
    }

    return <SingleGpuCard gpu={data} />;
}

export default GpuWidget;
