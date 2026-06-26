'use client';
import React, { useEffect, useState, useRef } from 'react';
import { DecipherLog } from '../engine/DecipherEngine';
import { Activity, Terminal } from 'lucide-react';

interface DecipherTerminalProps {
    logs: DecipherLog[];
    onComplete: () => void;
}

export default function DecipherTerminal({ logs, onComplete }: DecipherTerminalProps) {
    const [visibleLogs, setVisibleLogs] = useState<DecipherLog[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!logs.length) return;

        // Instant display - No fake loading
        setVisibleLogs(logs);
        onComplete();

    }, [logs, onComplete]);

    return (
        <div style={{
            fontFamily: '"Fira Code", monospace',
            width: '100%',
            marginBottom: '1rem',
            position: 'relative',
        }}>
            {/* Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {visibleLogs.map((log, i) => {
                    if (!log) return null;
                    return (
                        <div key={i} style={{
                            opacity: 0,
                            animation: 'fadeIn 0.2s forwards',
                            color: '#334155', // Dark grey requested by user
                            fontSize: '0.9rem',
                            lineHeight: '1.4'
                        }}>
                            <span style={{ color: '#64748b', marginRight: '1rem', fontSize: '0.8rem' }}>
                                {new Date(log.timestamp).toISOString().split('T')[1].replace('Z', '')}
                            </span>
                            <span>{log.message}</span>
                        </div>
                    );
                })}
            </div>

            <div ref={bottomRef} />

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
