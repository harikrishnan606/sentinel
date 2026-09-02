import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PRESET_ICONS = {
    plex: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 2v20l16-10L4 2z" />
        </svg>
    ),
    jellyfin: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V8h2v4zm4 4h-2v-2h2v2zm0-4h-2V8h2v4z" />
        </svg>
    ),
    netdata: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
        </svg>
    ),
    server: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    terminal: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    ),
    download: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    database: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    cloud: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
    ),
    dashboard: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    globe: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
};

const DEFAULT_ICON = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

function renderIcon(icon) {
    if (!icon) return DEFAULT_ICON;

    if (React.isValidElement(icon)) return icon;

    if (typeof icon === 'string') {
        const trimmed = icon.trim();
        const lowerKey = trimmed.toLowerCase();

        if (PRESET_ICONS[lowerKey]) {
            return PRESET_ICONS[lowerKey];
        }

        // Image URLs or data URIs
        if (
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('/') ||
            trimmed.endsWith('.png') ||
            trimmed.endsWith('.svg') ||
            trimmed.endsWith('.ico') ||
            trimmed.endsWith('.jpg')
        ) {
            return (
                <img
                    src={trimmed}
                    alt=""
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
            );
        }

        // Raw SVG markup
        if (trimmed.startsWith('<svg')) {
            return (
                <span
                    style={{ display: 'inline-flex', width: '48px', height: '48px' }}
                    dangerouslySetInnerHTML={{ __html: trimmed }}
                />
            );
        }

        // Raw SVG Path (d="...")
        if (trimmed.startsWith('M') || trimmed.startsWith('m')) {
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d={trimmed} />
                </svg>
            );
        }
    }

    return DEFAULT_ICON;
}

function resolveUrl(rawUrl, host) {
    if (!rawUrl) return '#';
    return rawUrl.replace(/\{host\}|\$\{host\}/g, host);
}

function extractPort(resolvedUrl, explicitPort) {
    if (explicitPort) return String(explicitPort);
    try {
        const parsed = new URL(resolvedUrl);
        return parsed.port || '';
    } catch {
        return '';
    }
}

const ServiceCard = ({ name, resolvedUrl, icon, color, port, statusInfo }) => {
    const status = statusInfo?.status || 'checking';
    const latency = statusInfo?.latency;
    const error = statusInfo?.error;

    let statusColor = 'var(--warning)';
    let statusBg = 'rgba(234, 179, 8, 0.15)';
    let statusLabel = 'Checking';
    let statusTooltip = 'Checking connectivity...';

    if (status === 'online') {
        statusColor = 'var(--success)';
        statusBg = 'rgba(34, 197, 94, 0.15)';
        statusLabel = 'Online';
        statusTooltip = latency ? `Online (${latency}ms)` : 'Online';
    } else if (status === 'offline') {
        statusColor = 'var(--danger)';
        statusBg = 'rgba(239, 68, 68, 0.15)';
        statusLabel = 'Offline';
        statusTooltip = error ? `Offline: ${error}` : 'Offline / Unreachable';
    }

    return (
        <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card service-card"
            title={statusTooltip}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                padding: '1.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                borderTop: `4px solid ${color || 'var(--accent)'}`,
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            }}
        >
            {/* Top-right Status Badge */}
            <div
                style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: statusBg,
                    color: statusColor,
                    letterSpacing: '0.02em',
                    transition: 'all 0.2s ease'
                }}
            >
                <span
                    style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                        boxShadow: status === 'online' ? '0 0 6px var(--success)' : 'none',
                        animation: status === 'checking' ? 'pulse 1.5s infinite' : 'none'
                    }}
                />
                <span>{statusLabel}</span>
            </div>

            {/* App Icon with anchored status indicator dot */}
            <div
                style={{
                    position: 'relative',
                    marginBottom: '1rem',
                    color: color || 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {renderIcon(icon)}
                <span
                    style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                        border: '2px solid var(--bg-primary)',
                        boxShadow: status === 'online' ? '0 0 8px var(--success)' : 'none',
                        transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
                    }}
                />
            </div>

            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}>{name}</div>
            {port ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Port: {port}
                </div>
            ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Link
                </div>
            )}
        </a>
    );
};

const ServiceShortcuts = () => {
    const host = window.location.hostname;
    const [services, setServices] = useState([
        {
            name: 'Plex',
            url: 'http://{host}:32400/web',
            color: '#e5a00d',
            icon: 'plex'
        },
        {
            name: 'Jellyfin',
            url: 'http://{host}:8096',
            color: '#00a4dc',
            icon: 'jellyfin'
        },
        {
            name: 'Netdata',
            url: 'http://{host}:19999',
            color: '#00ab44',
            icon: 'netdata'
        }
    ]);
    const [statuses, setStatuses] = useState({});

    useEffect(() => {
        let isMounted = true;
        axios.get('/api/shortcuts')
            .then((res) => {
                if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
                    setServices(res.data);
                }
            })
            .catch((err) => {
                console.warn('Failed to fetch /api/shortcuts, using defaults:', err.message);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchStatus = () => {
            axios.get('/api/shortcuts/status')
                .then((res) => {
                    if (isMounted && res.data && typeof res.data === 'object') {
                        setStatuses(res.data);
                    }
                })
                .catch((err) => {
                    console.warn('Failed to fetch /api/shortcuts/status:', err.message);
                });
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [services]);

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
            {services.map((service, idx) => {
                const resolved = resolveUrl(service.url, host);
                const port = extractPort(resolved, service.port);
                const statusInfo = statuses[service.name || service.url];
                return (
                    <ServiceCard
                        key={service.name || idx}
                        {...service}
                        resolvedUrl={resolved}
                        port={port}
                        statusInfo={statusInfo}
                    />
                );
            })}
        </div>
    );
};

export default ServiceShortcuts;
