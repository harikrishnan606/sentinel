import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import io from 'socket.io-client';

const socket = io(`http://${window.location.hostname}:3001`);

function HistoryCharts() {
    const [data, setData] = useState([]);
    const [range, setRange] = useState({ startIndex: 0, endIndex: 0 });
    const [totalRam, setTotalRam] = useState(0);
    const isAutoScrollRef = useRef(true);

    useEffect(() => {
        socket.on('history', (history) => {
            const formatted = history.map(h => ({
                ...h,
                time: new Date(h.timestamp).toLocaleTimeString(),
                ram_usage: (h.memory?.used || h.ram_usage) / 1024 / 1024 / 1024
            }));
            setData(formatted);
            // Initial zoom: last 60 points
            const start = Math.max(0, formatted.length - 60);
            setRange({ startIndex: start, endIndex: formatted.length - 1 });
            isAutoScrollRef.current = true;

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

                // Check if we are about to shift (limit is 100)
                const willShift = prev.length >= 100;

                const newData = [...prev, newPoint];
                if (newData.length > 100) newData.shift();

                // Update range
                setRange(prevRange => {
                    if (isAutoScrollRef.current) {
                        // Auto-scroll: keep window size, move to end
                        const newEnd = newData.length - 1;
                        const windowSize = prevRange.endIndex - prevRange.startIndex;
                        const newStart = Math.max(0, newEnd - windowSize);
                        return { startIndex: newStart, endIndex: newEnd };
                    } else if (willShift) {
                        // User panning + Data Shift: Decrement indices to follow data
                        const newStart = Math.max(0, prevRange.startIndex - 1);
                        const newEnd = Math.max(0, prevRange.endIndex - 1);
                        return { startIndex: newStart, endIndex: newEnd };
                    }
                    return prevRange;
                });

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
                    <Brush
                        dataKey="time"
                        height={25}
                        y={310}
                        stroke="var(--accent)"
                        fill="var(--bg-secondary)"
                        tickFormatter={() => ''}
                        startIndex={range.startIndex}
                        endIndex={range.endIndex}
                        onChange={(newRange) => {
                            setRange(newRange);
                            // If user scrolled to the end (or close to it), re-enable auto-scroll
                            if (newRange.endIndex >= data.length - 2) {
                                isAutoScrollRef.current = true;
                            } else {
                                isAutoScrollRef.current = false;
                            }
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default HistoryCharts;
