import React from 'react';

function NetworkWidget({ data }) {
    // Assuming first interface is primary for simplicity, or we sum them up
    // Let's take the first active one
    const iface = data.find(i => i.operstate === 'up') || data[0];

    if (!iface) return <div className="card">No Network Interface</div>;

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">Network ({iface.iface})</div>
                <div className="card-title">{iface.ip4}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                    <div className="metric-sub">Download</div>
                    <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                        {(iface.rx_sec / 1024 / 1024).toFixed(2)} <span style={{ fontSize: '1rem' }}>MB/s</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="metric-sub">Upload</div>
                    <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                        {(iface.tx_sec / 1024 / 1024).toFixed(2)} <span style={{ fontSize: '1rem' }}>MB/s</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NetworkWidget;
