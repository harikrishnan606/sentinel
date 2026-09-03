import React from 'react';

function SingleGpuCard({ gpu, showTypeBadge = false }) {
    if (!gpu) return null;

    const isDedicated = Boolean(gpu.isDedicated || gpu.type === 'Dedicated');
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
                    {showTypeBadge && (
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
                    )}
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
    if (!data) return null;

    const gpus = Array.isArray(data) ? data : [data];

    // Filter out virtual/software display adapters
    const realGpus = gpus.filter(g => {
        if (!g || !g.model) return false;
        const name = `${g.vendor || ''} ${g.model || ''}`.toLowerCase();
        return !name.includes('microsoft') && 
               !name.includes('remote display') && 
               !name.includes('basic display') && 
               !name.includes('virtualbox') && 
               !name.includes('vmware') && 
               !name.includes('parsec');
    });

    if (realGpus.length === 0) return null;

    // Show [Integrated] and [Dedicated] badges only if multiple GPUs are present
    const showTypeBadge = realGpus.length > 1;

    return (
        <>
            {realGpus.map((gpu, index) => (
                <SingleGpuCard 
                    key={gpu.model || index} 
                    gpu={gpu} 
                    showTypeBadge={showTypeBadge} 
                />
            ))}
        </>
    );
}

export default GpuWidget;
