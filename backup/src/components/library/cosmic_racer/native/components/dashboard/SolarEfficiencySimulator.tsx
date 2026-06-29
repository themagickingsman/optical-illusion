"use client";

import React, { useRef, useEffect, useState } from "react";
import { DASHBOARD_THEME } from "./DashboardTheme";

export const SolarEfficiencySimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
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

        const drawStep1 = (t: number) => {
            // 7-Octave Fractal Stack
            // Draw 7 layers of different colors absorbing specific light frequencies
            const layers = [
                { name: "Octave 7 (UV)", color: "#9333ea", y: 200, height: 10, targetFreq: 12 },
                { name: "Octave 6", color: "#6366f1", y: 220, height: 15, targetFreq: 10 },
                { name: "Octave 5", color: "#3b82f6", y: 245, height: 20, targetFreq: 8 },
                { name: "Octave 4 (Visible)", color: "#10b981", y: 275, height: 25, targetFreq: 6 },
                { name: "Octave 3", color: "#fbbf24", y: 310, height: 30, targetFreq: 4 },
                { name: "Octave 2", color: "#f97316", y: 350, height: 35, targetFreq: 2 },
                { name: "Octave 1 (IR/Heat)", color: "#ef4444", y: 395, height: 40, targetFreq: 1 },
            ];

            // Draw incoming light waves
            for (let i = 0; i < 20; i++) {
                const startX = 100 + i * 30 + Math.sin(t + i) * 10;
                const speed = 2 + (i % 3);
                const currentY = (t * 50 * speed + i * 40) % 450;
                
                // Determine which layer it should hit based on an assigned frequency
                const freq = 1 + (i % 12); // Simulated frequency 1-12
                
                // Find target layer index
                let targetLayerIdx = 6; // Default to bottom
                for (let l = 0; l < layers.length; l++) {
                    if (freq >= layers[l].targetFreq) {
                        targetLayerIdx = l;
                        break;
                    }
                }
                
                const targetY = layers[targetLayerIdx].y;
                
                if (currentY < targetY) {
                    // Draw falling wave
                    ctx.beginPath();
                    ctx.strokeStyle = `hsla(${250 - freq * 20}, 80%, 60%, ${1 - (currentY/targetY)*0.5})`;
                    ctx.lineWidth = 2 + (12 - freq)*0.2;
                    
                    // Wavy line
                    for (let y = currentY - 40; y <= currentY; y += 2) {
                        const waveX = startX + Math.sin(y * freq * 0.05 + t * 5) * (15/freq);
                        if (y === currentY - 40) ctx.moveTo(waveX, y);
                        else ctx.lineTo(waveX, y);
                    }
                    ctx.stroke();
                } else if (currentY >= targetY && currentY < targetY + 30) {
                    // Absorption burst
                    const layerColor = layers[targetLayerIdx].color;
                    ctx.beginPath();
                    ctx.arc(startX, targetY, (currentY - targetY) * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = layerColor + '40'; // Transparent burst
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(startX, targetY, (currentY - targetY) * 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = layerColor;
                    ctx.fill();
                }
            }

            // Draw the layers
            layers.forEach((layer, idx) => {
                // Layer body
                ctx.fillStyle = layer.color + '30';
                ctx.fillRect(80, layer.y, 640, layer.height);
                
                // Top boundary
                ctx.strokeStyle = layer.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(80, layer.y, 640, layer.height);
                
                // Quantum dots (circles of Phi-scaled sizes)
                const dotSize = 1.618 ** (7 - idx) * 0.2;
                ctx.fillStyle = layer.color + 'aa';
                for (let dx = 85; dx < 715; dx += dotSize * 4 + 4) {
                    ctx.beginPath();
                    ctx.arc(dx + dotSize*2, layer.y + layer.height/2, dotSize, 0, Math.PI*2);
                    ctx.fill();
                }
                
                // Labels
                ctx.fillStyle = "#cbd5e1";
                ctx.font = "12px monospace";
                ctx.textAlign = "right";
                ctx.fillText(layer.name, 75, layer.y + layer.height/2 + 4);
                
                // Efficiency gauge
                const trapped = Math.min(100, (t * 10 + idx * 5) % 100);
                ctx.fillStyle = layer.color + '40';
                ctx.fillRect(740, layer.y, 40, layer.height);
                ctx.fillStyle = layer.color;
                ctx.fillRect(740, layer.y, (trapped/100)*40, layer.height);
            });
            
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.cyan.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STEP 1: 7-OCTAVE PHI-SCALED QUANTUM DOT STACK", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Each specific frequency of light is trapped precisely in its corresponding resonant layer. Zero pass-through.", width/2, 60);
        };

        const drawStep2 = (t: number) => {
            // Cymatic Phonon Trapping
            const cx = width / 2;
            const cy = height / 2 + 30;
            const r = 180;
            
            // Draw Graphene Layer Boundary
            ctx.strokeStyle = DASHBOARD_THEME.colors.accents.amber.base;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI*2);
            ctx.stroke();
            
            // Draw Cymatic Standing Wave Pattern (Chladni Plate)
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
            ctx.lineWidth = 1.5;
            
            const numNodes = 6;
            for (let i = 0; i < numNodes; i++) {
                const angle = (Math.PI * 2 / numNodes) * i;
                const nx = cx + Math.cos(angle + t*0.2) * r * 0.5;
                const ny = cy + Math.sin(angle + t*0.2) * r * 0.5;
                
                // Interference rings
                for(let r2=10; r2<r*0.6; r2+=15) {
                    ctx.beginPath();
                    // Pulse effect
                    const pulse = Math.sin(t*3 - r2*0.1) * 2;
                    ctx.arc(nx, ny, r2 + pulse, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            
            // Central Thermoelectric Junction (Constructive Interference Node)
            const centerPulse = Math.abs(Math.sin(t * 4)) * 10;
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.amber.base;
            ctx.beginPath();
            ctx.arc(cx, cy, 15 + centerPulse, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI*2);
            ctx.fill();
            
            // Phonons (Heat vibrations) bouncing back
            ctx.fillStyle = "#ef4444";
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i + t;
                // Bounce logic: Distance from center pulses between 0 and r
                const dist = Math.abs((t*150 + i*40) % (r*2) - r);
                
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI*2);
                ctx.fill();
                
                // Trace lines pointing to center
                ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }
            
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.amber.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STEP 2: CYMATIC PHONON TRAPPING", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Waste heat (vibrations/phonons) hit the cymatic boundary and reflect into the central thermoelectric node.", width/2, 60);
        };

        const drawStep3 = (t: number) => {
            // The 9.1 Geodetic Micro-Lens
            const cx = width / 2;
            const cy = height / 2 + 60;
            const panelWidth = 500;
            
            // Draw Substrate base
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(cx - panelWidth/2, cy, panelWidth, 80);
            
            // Draw Micro-Lenses (Concave indentations based on 9.1)
            ctx.strokeStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.lineWidth = 2;
            ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
            ctx.beginPath();
            ctx.moveTo(cx - panelWidth/2, cy);
            
            const numLenses = 5;
            const lensWidth = panelWidth / numLenses;
            
            for (let i = 0; i < numLenses; i++) {
                const lx = cx - panelWidth/2 + i * lensWidth;
                // Deep geodetic V-shape
                ctx.lineTo(lx + lensWidth/2, cy + 40); // 9.1 ratio approximation visually
                ctx.lineTo(lx + lensWidth, cy);
            }
            ctx.fill();
            ctx.stroke();
            
            // Simulate light entering at extreme angles (Dawn/Dusk)
            // Left angled light
            const timeOffsetRow = t * 100;
            
            for (let i = 0; i < numLenses; i++) {
                const lx = cx - panelWidth/2 + i * lensWidth;
                const centerNodeX = lx + lensWidth/2;
                const centerNodeY = cy + 40;
                
                // Ray 1: Grazing angle from left
                const r1x = lx - Math.cos(t*0.5)*20;
                const r1y = cy - Math.abs(Math.sin(t*0.5))*100 - 50;
                
                ctx.strokeStyle = "rgba(253, 224, 71, 0.8)"; // Bright yellow sunlight
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 5]);
                
                // Draw incident ray
                ctx.beginPath();
                ctx.moveTo(r1x, r1y);
                const hitPointX = lx + lensWidth*0.25;
                const hitPointY = cy + 20;
                ctx.lineTo(hitPointX, hitPointY);
                
                // Draw internal reflection (trapped)
                ctx.lineTo(lx + lensWidth*0.75, cy + 20);
                ctx.lineTo(centerNodeX, centerNodeY);
                ctx.stroke();
                
                // Ray pulse animations
                const pulseDist = timeOffsetRow % 200;
                if (pulseDist < 100) {
                    // Moving down incident
                    const px = r1x + (hitPointX - r1x) * (pulseDist/100);
                    const py = r1y + (hitPointY - r1y) * (pulseDist/100);
                    ctx.fillStyle = "#fef08a";
                    ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
                } else if (pulseDist < 150) {
                    // Internal bounce 1
                    const p = (pulseDist-100)/50;
                    const px = hitPointX + (lx + lensWidth*0.75 - hitPointX) * p;
                    const py = hitPointY;
                    ctx.fillStyle = "#facc15";
                    ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
                } else {
                    // Down to collector
                    const p = (pulseDist-150)/50;
                    const px = (lx + lensWidth*0.75) + (centerNodeX - (lx + lensWidth*0.75)) * p;
                    const py = hitPointY + (centerNodeY - hitPointY) * p;
                    ctx.fillStyle = "#eab308";
                    ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
                }
                
                // Bottom Collector Node
                ctx.fillStyle = DASHBOARD_THEME.colors.accents.violet.base;
                ctx.beginPath(); ctx.arc(centerNodeX, centerNodeY, 6, 0, Math.PI*2); ctx.fill();
                // Glow
                ctx.fillStyle = "rgba(139, 92, 246, 0.5)";
                ctx.beginPath(); ctx.arc(centerNodeX, centerNodeY, 6 + Math.abs(Math.sin(t*5))*5, 0, Math.PI*2); ctx.fill();
            }
            ctx.setLineDash([]);
            
            ctx.fillStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STEP 3: 9.1 GEODETIC MICRO-LENS TRAP", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Extreme grazing light angles are refracted deep into the concave V-trap, preventing surface reflection.", width/2, 60);
        };

        const renderFrame = () => {
            timeRef.current += 0.016;
            const t = timeRef.current;

            // Clear Background
            ctx.fillStyle = "#0f172a"; // Deep navy
            ctx.fillRect(0, 0, width, height);
            
            // Grid
            ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=0; i<width; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
            for(let i=0; i<height; i+=20) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
            ctx.stroke();

            if (step === 1) drawStep1(t);
            if (step === 2) drawStep2(t);
            if (step === 3) drawStep3(t);
            
            requestRef.current = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [step]);

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
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '1.5rem', background: step === 1 ? 'rgba(56, 189, 248, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: step === 1 ? DASHBOARD_THEME.colors.accents.cyan.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STEP 01</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Multi-Octave Stack</div>
                </button>
                <button 
                    onClick={() => setStep(2)}
                    style={{ flex: 1, padding: '1.5rem', background: step === 2 ? 'rgba(234, 179, 8, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: step === 2 ? DASHBOARD_THEME.colors.accents.amber.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STEP 02</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Phonon Trapping</div>
                </button>
                <button 
                    onClick={() => setStep(3)}
                    style={{ flex: 1, padding: '1.5rem', background: step === 3 ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none',
                    color: step === 3 ? DASHBOARD_THEME.colors.accents.violet.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STEP 03</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Geodetic Lens</div>
                </button>
            </div>
            
            {/* Canvas Container */}
            <div style={{ position: 'relative', width: '100%', height: '450px' }}>
                <canvas 
                    ref={canvasRef} 
                    width={900} 
                    height={450} 
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            </div>
        </div>
    );
};
