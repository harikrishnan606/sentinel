import React from 'react';

const ServiceCard = ({ name, url, icon, color }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="card service-card"
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            padding: '1.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            borderTop: `4px solid ${color}`,
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
        <div style={{ marginBottom: '1rem', color: color }}>
            {icon}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{name}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Port: {new URL(url).port}
        </div>
    </a>
);

const ServiceShortcuts = () => {
    const host = window.location.hostname;

    const services = [
        {
            name: 'Plex',
            url: `http://${host}:32400/web`,
            color: '#e5a00d',
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2v20l16-10L4 2z" />
                </svg>
            )
        },
        {
            name: 'Jellyfin',
            url: `http://${host}:8096`,
            color: '#00a4dc',
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V8h2v4zm4 4h-2v-2h2v2zm0-4h-2V8h2v4z" />
                </svg>
            )
        },
        {
            name: 'Netdata',
            url: `http://${host}:19999`,
            color: '#00ab44',
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                </svg>
            )
        }
    ];

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
            {services.map((service) => (
                <ServiceCard key={service.name} {...service} />
            ))}
        </div>
    );
};

export default ServiceShortcuts;
