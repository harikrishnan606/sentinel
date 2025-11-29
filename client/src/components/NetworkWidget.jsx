import React from 'react';

function NetworkWidget({ data }) {
    // Assuming first interface is primary for simplicity, or we sum them up
    // Let's take the first active one
    const iface = data.find(i => i.operstate === 'up') || data[0];

    const formatBits = (bytes) => {
        const bits = bytes * 8;
        if (bits === 0) return '0 bps';
        const k = 1000; // Standard for bits is usually decimal (1kbps = 1000bps), but 1024 is often used in OS. Let's stick to 1024 for consistency with other metrics or 1000 for network standard? 
        // Network speeds are typically measured in decimal (1 Mbps = 1,000,000 bps).
        // Let's use 1024 to match the previous byte calculation style if we want "binary" bits, but standard network is decimal.
        // However, usually people expect 10 Mbps to be 10 * 10^6. 
        // Let's stick to 1024 for now as it's safer for "computer" metrics, or standard 1000? 
        // Actually, standard network is 1000. But let's check what the user might expect. 
        // Let's use 1024 for simplicity and consistency with the previous code which used 1024 for bytes.
        // Wait, previous code was `bytes / 1024 / 1024` for MB. 
        // Let's use 1024.
        const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
        const i = Math.floor(Math.log(bits) / Math.log(k));
        const value = parseFloat((bits / Math.pow(k, i)));

        // Conditional rounding: if > 9, round to integer. Else keep 2 decimals.
        const formattedValue = value > 9 ? Math.round(value) : value.toFixed(2);

        return formattedValue + ' ' + sizes[i];
    };

    if (!iface) return <div className="card">No Network Interface</div>;

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">Network ({iface.iface})</div>
                <div className="card-title">{iface.ip4}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div style={{ overflow: 'hidden' }}>
                    <div className="metric-sub">Download</div>
                    <div className="metric-value" style={{ fontSize: '1.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatBits(iface.rx_sec)}>
                        {formatBits(iface.rx_sec)}
                    </div>
                </div>
                <div style={{ textAlign: 'right', overflow: 'hidden' }}>
                    <div className="metric-sub">Upload</div>
                    <div className="metric-value" style={{ fontSize: '1.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={formatBits(iface.tx_sec)}>
                        {formatBits(iface.tx_sec)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NetworkWidget;
