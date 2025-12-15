import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './index.css';

// Components (we will create these next)
import Dashboard from './Dashboard';

const socket = io();

function App() {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('metrics', (data) => {
      setMetrics(data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('metrics');
    };
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          Sentinel
        </div>
        <div className="status-badge">
          <div className="status-dot" style={{ backgroundColor: connected ? 'var(--success)' : 'var(--danger)' }}></div>
          {connected ? 'System Online' : 'Disconnected'}
        </div>
      </header>

      <main>
        {metrics ? (
          <Dashboard metrics={metrics} />
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Connecting to Sentinel Core...
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
