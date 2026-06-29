"use client";

import React, { useRef, useEffect, useState } from "react";
import { DASHBOARD_THEME } from "./DashboardTheme";

export const GeometricDifferentiationSimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeTab, setActiveTab] = useState<"lens" | "stack" | "wire">("lens");
    
    // Animation refs
    const timeRef = useRef(0);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const midX = width / 2;

        const drawLensComparison = (t: number) => {
            // --- LEFT SIDE: Modern Tech (Fresnel Lens) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.text.primary;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Modern Tech: Fresnel Concentrator", midX / 2, 40);
            
            // Draw thick curved lens
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(midX / 2, 120, 100, Math.PI * 1.2, Math.PI * 1.8);
            ctx.stroke();

            // Draw target cell
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(midX / 2 - 20, 300, 40, 10);
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(midX / 2 - 15, 300, 30, 4);

            // Light rays coming straight down (optimal tracking)
            ctx.strokeStyle = "rgba(253, 224, 71, 0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Dynamic sun angle (shows failure if not tracking perfectly)
            const sunAngleOffset = Math.sin(t * 0.5) * 50; 
            
            for (let i = -60; i <= 60; i += 30) {
                const startX = midX / 2 + i + sunAngleOffset;
                const startY = 50;
                const hitX = midX / 2 + i;
                const hitY = 100 - Math.abs(i) * 0.2; // roughly hit the lens curve

                ctx.moveTo(startX, startY);
                ctx.lineTo(hitX, hitY);

                // If sun is straight on, it focuses. If off-angle, it scatters.
                if (Math.abs(sunAngleOffset) < 10) {
                    ctx.lineTo(midX / 2, 300); // Focus
                } else {
                    ctx.lineTo(hitX - sunAngleOffset, 300); // Miss the tiny target
                }
            }
            ctx.stroke();
            
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Requires heavy mechanical tracking.", midX / 2, 340);
            ctx.fillText("If sun angle is slightly off, energy misses target.", midX / 2, 360);

            // --- DIVIDER ---
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, height - 20); ctx.stroke();

            // --- RIGHT SIDE: Cosmic Compass (9.1 Geodetic Micro-Lens) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("Cosmic Compass: 9.1 Geodetic Trap", midX + midX / 2, 40);

            // Draw Geodetic V-shape surface
            ctx.strokeStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(midX + 50, 100);
            ctx.lineTo(midX + midX/2, 250); // Deep V
            ctx.lineTo(width - 50, 100);
            ctx.lineTo(width - 50, 300);
            ctx.lineTo(midX + 50, 300);
            ctx.fill();
            ctx.stroke();

            // Incoming light at an extreme angle (mimicking the off-angle sun)
            const rStartX = midX + 150 + sunAngleOffset; // same offset
            
            ctx.strokeStyle = "rgba(253, 224, 71, 0.8)";
            ctx.lineWidth = 2;
            
            // Ray 1
            ctx.beginPath();
            ctx.moveTo(rStartX, 50);
            const hitR1X = midX + 150;
            const hitR1Y = 150;
            ctx.lineTo(hitR1X, hitR1Y);
            // It hits the steep wall and bounces INWARD, not away
            ctx.lineTo(midX + 250, 200);
            ctx.lineTo(midX + midX/2, 250);
            ctx.stroke();

            // Highlight the trap mechanic
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.beginPath(); ctx.arc(midX + midX/2, 250, 6, 0, Math.PI*2); ctx.fill();

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Zero moving parts.", midX + midX / 2, 340);
            ctx.fillText("Steep 9.1 concavity forces extreme angles inward.", midX + midX / 2, 360);
        };

        const drawStackComparison = (t: number) => {
            // --- LEFT SIDE: Modern Tech (Bandgap Stacking) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.text.primary;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Modern Tech: Bandgap Matching", midX / 2, 40);

            // Draw rigid crystalline layers
            const layers = [
                { color: "#3b82f6", y: 150, h: 40, label: "InGaP (Top)" },
                { color: "#10b981", y: 195, h: 40, label: "GaAs (Middle)" },
                { color: "#ef4444", y: 240, h: 40, label: "Ge (Bottom)" },
            ];

            layers.forEach(layer => {
                ctx.fillStyle = layer.color + '40';
                ctx.fillRect(midX / 2 - 100, layer.y, 200, layer.h);
                ctx.strokeStyle = layer.color;
                ctx.strokeRect(midX / 2 - 100, layer.y, 200, layer.h);
                // Draw rigid crystal lattice grid inside
                ctx.strokeStyle = layer.color + 'aa';
                ctx.beginPath();
                for(let x = midX/2 - 90; x < midX/2 + 100; x+= 15) { ctx.moveTo(x, layer.y); ctx.lineTo(x, layer.y + layer.h); }
                for(let y = layer.y + 5; y < layer.y + layer.h; y+= 10) { ctx.moveTo(midX/2 - 100, y); ctx.lineTo(midX/2 + 100, y); }
                ctx.stroke();
                
                ctx.fillStyle = "#fff";
                ctx.font = "12px sans-serif";
                ctx.fillText(layer.label, midX / 2, layer.y + 25);
            });

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Restricted by lattice friction.", midX / 2, 320);
            ctx.fillText("Layers must physically 'fit' together, limiting options.", midX / 2, 340);

            // --- DIVIDER ---
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, height - 20); ctx.stroke();

            // --- RIGHT SIDE: Cosmic Compass (Phi-Scaled Harmonic Tuning) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.amber.base;
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("Cosmic Compass: Phi-Scaled Harmonics", midX + midX / 2, 40);

            // Draw Quantum Dots scaled by 1.618
            const qdLayers = [
                { color: "#3b82f6", y: 120, h: 50, dotSize: 4 },
                { color: "#10b981", y: 175, h: 50, dotSize: 4 * 1.618 },
                { color: "#fbbf24", y: 230, h: 50, dotSize: 4 * 1.618 * 1.618 },
                { color: "#ef4444", y: 285, h: 60, dotSize: 4 * 1.618 * 1.618 * 1.618 },
            ];

            qdLayers.forEach((layer, i) => {
                ctx.fillStyle = layer.color + '20';
                ctx.fillRect(midX + midX / 2 - 120, layer.y, 240, layer.h);
                
                // Draw floating QDs (no rigid lattice required)
                ctx.fillStyle = layer.color;
                for(let x = midX + midX / 2 - 100; x < midX + midX / 2 + 100; x += layer.dotSize * 3 + 5) {
                    ctx.beginPath();
                    ctx.arc(x, layer.y + layer.h/2 + Math.sin(t*2 + x)*5, layer.dotSize, 0, Math.PI*2);
                    ctx.fill();
                }
            });

            // Incoming wave
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let y = 60; y < 200; y+=2) {
                const waveX = (midX + midX/2) + Math.sin(y * 0.1 - t*5) * 20;
                if(y===60) ctx.moveTo(waveX, y);
                else ctx.lineTo(waveX, y);
            }
            ctx.stroke();

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Liquid suspension. No lattice matching needed.", midX + midX / 2, 360);
            ctx.fillText("Dot size mathematically matches the wavelength (Phi).", midX + midX / 2, 380);
        };

        const drawWireComparison = (t: number) => {
            // --- LEFT SIDE: Modern Tech (Silver Busbars) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.text.primary;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Modern Tech: Silver Busbars", midX / 2, 40);

            // Draw panel
            ctx.fillStyle = "#1e3a8a"; // Solar blue
            ctx.fillRect(midX / 2 - 100, 100, 200, 200);

            // Draw thick silver wires
            ctx.fillStyle = "#cbd5e1";
            for(let y = 120; y < 300; y += 40) {
                ctx.fillRect(midX / 2 - 100, y, 200, 4); // horizontal fingers
            }
            ctx.fillRect(midX / 2 - 40, 100, 8, 200); // vertical busbar 1
            ctx.fillRect(midX / 2 + 32, 100, 8, 200); // vertical busbar 2

            // Show shading loss
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            for(let y = 120; y < 300; y += 40) ctx.fillRect(midX / 2 - 100, y+4, 200, 4); // shadow

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Thick straight metal wires block sunlight.", midX / 2, 330);
            ctx.fillText("Requires electrons to travel long distances.", midX / 2, 350);

            // --- DIVIDER ---
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, height - 20); ctx.stroke();

            // --- RIGHT SIDE: Cosmic Compass (Fractal Nanowire) ---
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.cyan.base;
            ctx.font = "bold 16px sans-serif";
            ctx.fillText("Cosmic Compass: Fractal Copper Mesh", midX + midX / 2, 40);

            // Draw panel
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(midX + midX / 2 - 100, 100, 200, 200);

            // Draw fractal branching pattern
            ctx.strokeStyle = "rgba(234, 179, 8, 0.6)"; // Copper color
            
            const drawBranch = (x: number, y: number, len: number, angle: number, depth: number) => {
                if (depth === 0) return;
                
                const endX = x + Math.cos(angle) * len;
                const endY = y + Math.sin(angle) * len;
                
                ctx.lineWidth = depth * 0.5; // Thinner as it goes
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Add tiny pulse visual for electricity flowing
                if (Math.random() > 0.95) {
                    ctx.fillStyle = "#fff";
                    ctx.beginPath(); ctx.arc(endX, endY, depth*0.5+1, 0, Math.PI*2); ctx.fill();
                }

                drawBranch(endX, endY, len * 0.7, angle - 0.4, depth - 1);
                drawBranch(endX, endY, len * 0.7, angle + 0.4, depth - 1);
            };

            // Start fractal from center bottom
            drawBranch(midX + midX/2, 300, 60, -Math.PI/2, 6);

            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("Nanoscale branching is invisible to sunlight.", midX + midX / 2, 330);
            ctx.fillText("Infinite contact points. Zero travel distance.", midX + midX / 2, 350);
        };


        const renderFrame = () => {
            timeRef.current += 0.016;
            const t = timeRef.current;

            // Clear Background
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(0, 0, width, height);
            
            if (activeTab === "lens") drawLensComparison(t);
            if (activeTab === "stack") drawStackComparison(t);
            if (activeTab === "wire") drawWireComparison(t);
            
            requestRef.current = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [activeTab]);

    return (
        <div style={{
            background: '#0f172a',
            borderRadius: '24px',
            border: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
            overflow: 'hidden',
            marginBottom: '4rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            {/* Controls Header */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}` }}>
                <button 
                    onClick={() => setActiveTab("lens")}
                    style={{ flex: 1, padding: '1rem', background: activeTab === "lens" ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: activeTab === "lens" ? DASHBOARD_THEME.colors.accents.violet.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer' }}
                >
                    <div style={{ fontWeight: 600 }}>1. The Lens Geometry</div>
                </button>
                <button 
                    onClick={() => setActiveTab("stack")}
                    style={{ flex: 1, padding: '1rem', background: activeTab === "stack" ? 'rgba(234, 179, 8, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: activeTab === "stack" ? DASHBOARD_THEME.colors.accents.amber.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer' }}
                >
                    <div style={{ fontWeight: 600 }}>2. The Internal Structure</div>
                </button>
                <button 
                    onClick={() => setActiveTab("wire")}
                    style={{ flex: 1, padding: '1rem', background: activeTab === "wire" ? 'rgba(56, 189, 248, 0.1)' : 'transparent', border: 'none',
                    color: activeTab === "wire" ? DASHBOARD_THEME.colors.accents.cyan.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer' }}
                >
                    <div style={{ fontWeight: 600 }}>3. The Wiring Mesh</div>
                </button>
            </div>
            
            {/* Canvas Container */}
            <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                <canvas 
                    ref={canvasRef} 
                    width={900} 
                    height={400} 
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            </div>
        </div>
    );
};
