"use client";

import React, { useEffect, useRef } from 'react';
import { getChladniModes } from './chladniMath';

interface ChladniIconProps {
    hz: number;
    size?: number;
    color?: string;
}

export const ChladniIcon: React.FC<ChladniIconProps> = ({ 
    hz, 
    size = 48,
    color = '#cbd5e1' 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const { n, m } = getChladniModes(hz);

        // Draw pure mathematics blueprint
        ctx.fillStyle = color;
        
        // Rendering a low-res pixel grid for the small icon
        const res = 2; // Pixel resolution
        for (let x = 0; x < width; x += res) {
            for (let y = 0; y < height; y += res) {
                // Normalize to -1 -> 1 (rigorous physical square plate formulation)
                const cx = (x / width) * 2 - 1;
                const cy = (y / height) * 2 - 1;
                
                const xPiN = n * Math.PI * cx;
                const yPiM = m * Math.PI * cy;
                const xPiM = m * Math.PI * cx;
                const yPiN = n * Math.PI * cy;
                
                const z = Math.abs(
                    Math.cos(xPiN) * Math.cos(yPiM) + Math.cos(xPiM) * Math.cos(yPiN)
                );

                // If Z is very close to 0, it's a structural node
                if (z < 0.15) {
                    ctx.fillRect(x, y, res, res);
                }
            }
        }
    }, [hz, color]);

    return (
        <canvas 
            ref={canvasRef}
            width={size * 2} // Double internal resolution for crispness
            height={size * 2}
            style={{ 
                width: size, 
                height: size, 
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
        />
    );
};
