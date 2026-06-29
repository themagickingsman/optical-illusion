"use client";

import React, { useEffect, useRef } from 'react';
import { DASHBOARD_THEME } from '../DashboardTheme';

interface ChladniResonatorProps {
    n: number;
    m: number;
    frequency: number;
    amplitude: number;
}

export const ChladniResonator: React.FC<ChladniResonatorProps> = ({ n, m, frequency, amplitude }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particleCount = 6000;
    const particlesRef = useRef(new Float32Array(particleCount * 2)); // [x1, y1, x2, y2, ...]
    const speed = 0.5 * amplitude;

    // Initialize particles randomly within the circle
    useEffect(() => {
        const particles = particlesRef.current;
        for (let i = 0; i < particleCount; i++) {
            particles[i * 2] = 0.02 + Math.random() * 0.96;
            particles[i * 2 + 1] = 0.02 + Math.random() * 0.96;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            time += 0.05 * (frequency / 100);
            const width = canvas.width;
            const height = canvas.height;

            // Light theme background clear
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
            ctx.fillRect(0, 0, width, height);

            const particles = particlesRef.current;
            
            // "Sand" color (dark sleek slate) with theme accent hints
            ctx.fillStyle = '#1e293b'; 
            
            for (let i = 0; i < particleCount; i++) {
                let px = particles[i * 2];
                let py = particles[i * 2 + 1];

                // Shift origin to mathematically center the square plate calculation
                const cx = (px - 0.5) * 2;
                const cy = (py - 0.5) * 2;
                
                // Exact Paul Bourke formulation for resonant modes of a square plate
                const xPiN = n * Math.PI * cx;
                const yPiM = m * Math.PI * cy;
                const xPiM = m * Math.PI * cx;
                const yPiN = n * Math.PI * cy;
                
                // The primary nodal lines of a center-driven plate follow this exact integer formulation
                const z = Math.abs(
                    Math.cos(xPiN) * Math.cos(yPiM) + Math.cos(xPiM) * Math.cos(yPiN)
                );

                // True Chladni Physics:
                // Particles vibrate violently where Z is high (anti-nodes) 
                // and don't vibrate where Z is 0 (nodal lines).
                // They get kicked out of vibrating zones and trapped in the still zones.
                
                // The vibration strength (random walk step size) is proportional to the amplitude Z
                const vibrationStrength = z * speed * 0.05;
                
                // Add a constant minimum jitter so the sand never truly 'stops', allowing it to slide along the line
                const baseJitter = 0.0005 * amplitude;
                
                // Random displacement (brownian motion) scaled by vibration strength
                const angleJitter = Math.random() * 2 * Math.PI;
                const totalJitter = vibrationStrength + baseJitter;

                px += Math.cos(angleJitter) * totalJitter;
                py += Math.sin(angleJitter) * totalJitter;

                // 2% chance for a particle to get 'kicked' heavily so sand redistributes and fills out the entire line
                if (Math.random() < 0.02) {
                    px += (Math.random() - 0.5) * 0.05;
                    py += (Math.random() - 0.5) * 0.05;
                }

                // Keep particles bounded to the physical square plate
                if (px < 0.02) px = 0.02;
                if (px > 0.98) px = 0.98;
                if (py < 0.02) py = 0.02;
                if (py > 0.98) py = 0.98;

                particles[i * 2] = px;
                particles[i * 2 + 1] = py;

                // Draw tiny particle
                const screenX = px * width;
                const screenY = py * height;

                ctx.fillRect(screenX, screenY, 1.5, 1.5);
            }

            // Draw a subtle, large square representing the physical plate
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 1;
            const padding = 10;
            const size = Math.min(width, height) - padding * 2;
            const left = width / 2 - size / 2;
            const top = height / 2 - size / 2;
            ctx.strokeRect(left, top, size, size);

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [n, m, frequency, amplitude, speed]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={800} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* Overlay for pure aesthetics */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: DASHBOARD_THEME.colors.accents.cyan.base, background: DASHBOARD_THEME.colors.accents.cyan.bg, padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                    ACOUSTIC RESONATOR
                </span>
            </div>
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', fontFamily: 'monospace' }}>{frequency.toFixed(2)} Hz</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>n: {n.toFixed(1)} | m: {m.toFixed(1)}</div>
            </div>
        </div>
    );
};
