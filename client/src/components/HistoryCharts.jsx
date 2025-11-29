import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';

const socket = io(`http://${window.location.hostname}:3001`);

function HistoryCharts() {
    const [data, setData] = useState([]);
    const [totalRam, setTotalRam] = useState(0);

    useEffect(() => {
        socket.on('history', (history) => {
            const formatted = history.map(h => ({
                ...h,
                time: new Date(h.timestamp).toLocaleTimeString(),
                ram_usage: (h.memory?.used || h.ram_usage) / 1024 / 1024 / 1024
            }));
            setData(formatted);

            // Try to set total RAM from history if available
            if (history.length > 0 && history[history.length - 1].memory?.total) {
                setTotalRam(Math.round(history[history.length - 1].memory.total / 1024 / 1024 / 1024));
            }
        });

        socket.on('metrics', (metric) => {
            // Update total RAM if not set
            if (metric.memory?.total) {
                setTotalRam(Math.round(metric.memory.total / 1024 / 1024 / 1024));
            }

            setData(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString(),
                    cpu_usage: metric.cpu.load,
                    ram_usage: metric.memory.used / 1024 / 1024 / 1024
                };

                const newData = [...prev, newPoint];
                if (newData.length > 100) newData.shift();

                return newData;
            });
        });

        return () => {
            socket.off('history');
            socket.off('metrics');
        };
    }, []);

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickFormatter={(t) => t.split(':')[0] + ':' + t.split(':')[1]}
                        minTickGap={30}
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
                            name === 'CPU %' ? `${value.toFixed(1)}%` : `${value.toFixed(2)} GB`,
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
                        dot={data.length < 2}
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
                        dot={data.length < 2}
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
