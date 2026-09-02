import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function HistoryCharts({ socket }) {
    const [data, setData] = useState([]);
    const [totalRam, setTotalRam] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const processHistory = useCallback((history) => {
        if (!Array.isArray(history) || history.length === 0) return;

        const formatted = history.map(h => {
            let ts = h.timestamp;
            if (typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+')) {
                ts = ts.replace(' ', 'T') + 'Z';
            }
            const d = new Date(ts);
            const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString() : new Date().toLocaleTimeString();

            return {
                ...h,
                time: timeStr,
                cpu_usage: typeof h.cpu_usage === 'number' ? Math.max(0, Math.min(100, h.cpu_usage)) : 0,
                ram_usage: ((h.ram_usage || h.memory?.used || 0) / 1024 / 1024 / 1024)
            };
        });

        setData(prev => {
            if (prev.length === 0) return formatted;
            // Merge history with any newer live points that arrived during fetch
            const historyTimes = new Set(formatted.map(p => p.time));
            const newerLive = prev.filter(p => !historyTimes.has(p.time));
            return [...formatted, ...newerLive].slice(-60);
        });

        // Extract total RAM from historical row to prevent Y-axis scale jumps
        const last = history[history.length - 1];
        const total = last.ram_total || last.memory?.total;
        if (total) {
            setTotalRam(Math.round(total / 1024 / 1024 / 1024));
        }
    }, []);

    // 1. Immediately fetch history on component mount via REST API
    useEffect(() => {
        let isMounted = true;
        fetch('/api/history?limit=60')
            .then(res => res.json())
            .then(rows => {
                if (isMounted && Array.isArray(rows) && rows.length > 0) {
                    processHistory(rows);
                }
            })
            .catch(err => {
                console.warn('Failed to load initial history from API:', err.message);
            });

        return () => {
            isMounted = false;
        };
    }, [processHistory]);

    // 2. Real-time WebSocket updates and history fallback
    useEffect(() => {
        if (!socket) return;

        const handleHistory = (history) => {
            processHistory(history);
        };

        const handleMetrics = (metric) => {
            if (metric.memory?.total) {
                setTotalRam(Math.round(metric.memory.total / 1024 / 1024 / 1024));
            }

            setData(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString(),
                    cpu_usage: typeof metric.cpu?.load === 'number' ? Math.max(0, Math.min(100, metric.cpu.load)) : 0,
                    ram_usage: (metric.memory?.used || 0) / 1024 / 1024 / 1024
                };

                const newData = [...prev, newPoint];
                if (newData.length > 60) newData.shift();

                return newData;
            });
        };

        socket.on('history', handleHistory);
        socket.on('metrics', handleMetrics);

        // Explicitly request history over socket in case API was delayed
        socket.emit('getHistory', 60);

        return () => {
            socket.off('history', handleHistory);
            socket.off('metrics', handleMetrics);
        };
    }, [socket, processHistory]);

    const chartMargin = isMobile
        ? { top: 10, right: 0, left: -20, bottom: 0 }
        : { top: 20, right: 30, left: 20, bottom: 20 };

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        interval="preserveStartEnd"
                        minTickGap={45}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="var(--accent)"
                        fontSize={12}
                        unit="%"
                        domain={[0, 100]}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--success)"
                        fontSize={12}
                        unit=" GB"
                        domain={[0, totalRam || 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value, name) => [
                            name === 'CPU %' ? `${Number(value).toFixed(1)}%` : `${Number(value).toFixed(2)} GB`,
                            name
                        ]}
                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="cpu_usage"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="CPU %"
                        isAnimationActive={false}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ram_usage"
                        stroke="var(--success)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="RAM"
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default HistoryCharts;
