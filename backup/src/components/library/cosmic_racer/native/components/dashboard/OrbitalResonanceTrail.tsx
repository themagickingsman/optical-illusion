'use client';

import React, { useRef, useEffect, useMemo } from 'react';

interface TrailPoint {
    earthX_AU: number;
    earthY_AU: number;
    venusX_AU: number;
    venusY_AU: number;
    timestamp: number;
}

interface OrbitalResonanceTrailProps {
    earthPos: { x: number; y: number } | null;
    venusPos: { x: number; y: number } | null;
    scaledTime: number;
    enabled: boolean;
    center: number;      // NEW: Needed for normalization
    scaleFactor: number; // NEW: Needed for normalization
    maxPoints?: number;
    sampleRate?: number;
    cycleDuration?: number;
}

export const OrbitalResonanceTrail: React.FC<OrbitalResonanceTrailProps> = ({
    earthPos,
    venusPos,
    scaledTime,
    enabled,
    center,
    scaleFactor,
    maxPoints = 600,
    sampleRate = 86400 * 3,
    cycleDuration = 8 * 365.25 * 86400
}) => {
    const trailRef = useRef<TrailPoint[]>([]);
    const lastSampleTime = useRef<number>(0);
    
    // 1. CLEAR TRAIL ON TIME RESET or DISABLE
    useEffect(() => {
        // If time jumped backwards significantly (Rewind/Reset), clear trail
        if (scaledTime < lastSampleTime.current - 1000) {
            trailRef.current = [];
            lastSampleTime.current = scaledTime;
        }
    }, [scaledTime]);

    useEffect(() => {
        if (!enabled) {
            trailRef.current = [];
            lastSampleTime.current = 0;
        }
    }, [enabled]);

    // 2. RECORD POINTS (Normalized to AU)
    useEffect(() => {
        if (!enabled || !earthPos || !venusPos) return;
        
        // Sampling Rate Limiter
        if (Math.abs(scaledTime - lastSampleTime.current) < sampleRate) return;
        
        lastSampleTime.current = scaledTime;
        
        // NORMALIZE POSITIONS
        // Input pos is relative to center (0,0) due to how refs are set in Renderer? 
        // Wait, HarmonicSystemRenderer sets x,y where x = center + xLocal.
        // So we must subtract center first.
        const ex_AU = (earthPos.x - center) / scaleFactor;
        const ey_AU = (earthPos.y - center) / scaleFactor;
        const vx_AU = (venusPos.x - center) / scaleFactor;
        const vy_AU = (venusPos.y - center) / scaleFactor;

        trailRef.current.push({
            earthX_AU: ex_AU,
            earthY_AU: ey_AU,
            venusX_AU: vx_AU,
            venusY_AU: vy_AU,
            timestamp: scaledTime
        });
        
        if (trailRef.current.length > maxPoints) {
            trailRef.current.shift();
        }
    }, [scaledTime, earthPos, venusPos, enabled, maxPoints, sampleRate, center, scaleFactor]);
    
    // 3. RENDER (Apply Current Scale)
    const pathSegments = useMemo(() => {
        const points = trailRef.current;
        if (points.length < 2) return [];
        
        const now = scaledTime;
        const oldestTime = points[0]?.timestamp || now;
        const timeSpan = Math.max(now - oldestTime, 1);
        
        return points.map((point, index) => {
            const age = (now - point.timestamp) / timeSpan;
            // Prevent negative age (future points) from showing if we time-traveled
            if (age < 0) return null;

            const opacity = Math.max(0, 1 - age * 0.9);
            
            // PROJECT TO SCREEN
            const eX = center + point.earthX_AU * scaleFactor;
            const eY = center + point.earthY_AU * scaleFactor;
            const vX = center + point.venusX_AU * scaleFactor;
            const vY = center + point.venusY_AU * scaleFactor;

            return {
                x1: eX,
                y1: eY,
                x2: vX,
                y2: vY,
                opacity,
                index
            };
        }).filter((seg): seg is NonNullable<typeof seg> => seg !== null);
    }, [scaledTime, trailRef.current.length, center, scaleFactor]); // Re-calc when scale changes!
    
    if (!enabled || pathSegments.length === 0) return null;
    
    return (
        <g className="orbital-resonance-trail">
            {pathSegments.map((seg) => (
                <line
                    key={seg.index}
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke={`rgba(255, 215, 100, ${seg.opacity * 0.6})`}
                    strokeWidth={0.5} // Keep thin
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke" // Keep consistent width
                />
            ))}
            
            {/* Highlight newest connection */}
            {pathSegments.length > 0 && (() => {
                const newest = pathSegments[pathSegments.length - 1];
                return (
                    <line
                        x1={newest.x1}
                        y1={newest.y1}
                        x2={newest.x2}
                        y2={newest.y2}
                        stroke="rgba(255, 255, 255, 0.8)"
                        strokeWidth={1}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                );
            })()}
        </g>
    );
};

export default OrbitalResonanceTrail;

