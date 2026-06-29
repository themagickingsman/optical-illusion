"use client";

import React, { useRef, useEffect, useState } from "react";
import { DASHBOARD_THEME } from "./DashboardTheme";

export const NonToxicQDSimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);
    
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

        const drawStage1 = (t: number) => {
            // Stage 1: Precursor Chemistry (Copper-Indium-Sulfide - CIS)
            const cx = width / 2;
            const cy = height / 2 + 20;
            
            // Draw beaker/flask
            ctx.strokeStyle = DASHBOARD_THEME.colors.glass.border;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 30, cy - 100);
            ctx.lineTo(cx - 30, cy - 30);
            ctx.lineTo(cx - 100, cy + 100);
            ctx.arc(cx, cy + 100, 100, Math.PI, 0, true);
            ctx.lineTo(cx + 100, cy + 100);
            ctx.lineTo(cx + 30, cy - 30);
            ctx.lineTo(cx + 30, cy - 100);
            ctx.stroke();

            // Fluid level
            ctx.fillStyle = "rgba(234, 179, 8, 0.2)"; // Amber tint for precursor solution
            ctx.beginPath();
            ctx.moveTo(cx - 80, cy + 50);
            // Wavy fluid surface
            for (let i = cx - 80; i <= cx + 80; i += 5) {
                ctx.lineTo(i, cy + 50 + Math.sin(t * 3 + i * 0.05) * 5);
            }
            ctx.arc(cx, cy + 100, 80, 0, Math.PI, false);
            ctx.fill();

            // Floating precursor atoms (Cu, In, S)
            const atoms = [
                { color: "#f59e0b", label: "Cu", count: 15 }, // Copper
                { color: "#e2e8f0", label: "In", count: 15 }, // Indium
                { color: "#fef08a", label: "S",  count: 30 }  // Sulfur
            ];

            atoms.forEach((atomGroup, gIdx) => {
                ctx.fillStyle = atomGroup.color;
                ctx.font = "10px monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                for (let i = 0; i < atomGroup.count; i++) {
                    const seed = i * 100 + gIdx * 50;
                    const px = cx + Math.cos(t + seed) * (30 + (seed % 40));
                    const py = cy + 100 + Math.sin(t * 1.5 + seed) * (20 + (seed % 30));
                    
                    ctx.beginPath();
                    ctx.arc(px, py, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = "#0f172a";
                    ctx.fillText(atomGroup.label, px, py);
                    ctx.fillStyle = atomGroup.color; // reset for next circle
                }
            });

            ctx.fillStyle = DASHBOARD_THEME.colors.accents.amber.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STAGE 1: NON-TOXIC PRECURSORS (CIS)", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Replacing toxic Lead/Cadmium with abundant Copper, Indium, and Sulfur salts dissolved in a solvent.", width/2, 60);
        };

        const drawStage2 = (t: number) => {
            // Stage 2: Microwave/Acoustic Nucleation
            const cx = width / 2;
            const cy = height / 2 + 20;

            // Draw Microwave Cavity / Acoustic Chamber
            ctx.strokeStyle = DASHBOARD_THEME.colors.accents.cyan.base;
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - 150, cy - 100, 300, 200);
            
            // Standing Waves (Microwave or Acoustic fields)
            ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
            ctx.beginPath();
            for (let y = cy - 80; y <= cy + 80; y += 20) {
                for (let x = cx - 150; x <= cx + 150; x += 5) {
                    const waveY = Math.sin(x * 0.05 + t * 5) * 10;
                    if (x === cx - 150) ctx.moveTo(x, y + waveY);
                    else ctx.lineTo(x, y + waveY);
                }
            }
            ctx.stroke();

            // Nucleating Crystals (Quantum Dots forming)
            const numCrystals = 12;
            for (let i = 0; i < numCrystals; i++) {
                const angle = (Math.PI * 2 / numCrystals) * i + t * 0.5;
                const dist = 50 + Math.sin(t * 2 + i) * 20;
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                
                // Growth pulse
                const size = 5 + Math.abs(Math.sin(t * 3 + i)) * 10;
                
                // Hexagonal crystalline structure forming
                ctx.fillStyle = `hsla(${30 + Math.sin(t+i)*20}, 90%, 60%, 0.8)`;
                ctx.beginPath();
                for (let s = 0; s < 6; s++) {
                    const hAngle = (Math.PI / 3) * s + t;
                    const hx = px + Math.cos(hAngle) * size;
                    const hy = py + Math.sin(hAngle) * size;
                    if (s === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.fillStyle = DASHBOARD_THEME.colors.accents.cyan.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STAGE 2: RAPID NUCLEATION (MICROWAVE/ACOUSTIC)", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Applying precise frequency (heat/sound) collapses the dissolved atoms into perfect crystalline nano-structures instantly.", width/2, 60);
        };

        const drawStage3 = (t: number) => {
            // Stage 3: Zinc-Sulfide Shelling (Passivation)
            const cx = width / 2;
            const cy = height / 2 + 30;

            // Draw a single massive Quantum Dot to show the Core/Shell structure
            const coreRadius = 60 + Math.sin(t * 2) * 2; // Slight breathing
            const shellRadius = coreRadius + 20;

            // Core (CIS)
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            gradient.addColorStop(0, "#fef08a");
            gradient.addColorStop(1, "#d97706");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fill();

            // Shell (ZnS) forming
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -t * 20;
            ctx.beginPath();
            ctx.arc(cx, cy, shellRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Zinc and Sulfur atoms locking onto the shell
            ctx.fillStyle = "#cbd5e1"; // Zn
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 / 20) * i - t;
                const attachDist = shellRadius + Math.max(0, 50 - (t * 50 % 100)); // Flying in
                const px = cx + Math.cos(angle) * attachDist;
                const py = cy + Math.sin(angle) * attachDist;
                
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI*2);
                ctx.fill();

                if (attachDist <= shellRadius + 5) {
                    // Impact burst
                    ctx.strokeStyle = "rgba(255,255,255,0.8)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(px, py, 8 + Math.random()*5, 0, Math.PI*2);
                    ctx.stroke();
                }
            }

            // Labels pointing to structures
            ctx.strokeStyle = DASHBOARD_THEME.colors.glass.border;
            ctx.lineWidth = 1;
            
            // Core Label
            ctx.beginPath(); ctx.moveTo(cx - coreRadius/2, cy); ctx.lineTo(cx - 150, cy - 50); ctx.stroke();
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("CIS CORE (Absorbs Light)", cx - 160, cy - 50);

            // Shell Label
            ctx.beginPath(); ctx.moveTo(cx + shellRadius, cy); ctx.lineTo(cx + 170, cy - 50); ctx.stroke();
            ctx.fillStyle = "#cbd5e1";
            ctx.textAlign = "left";
            ctx.fillText("ZnS SHELL (Traps Electrons)", cx + 180, cy - 50);

            ctx.fillStyle = DASHBOARD_THEME.colors.accents.violet.base;
            ctx.font = "bold 16px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("STAGE 3: PROTECTIVE SHELLING (PASSIVATION)", width/2, 40);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "13px sans-serif";
            ctx.fillText("Wrapping the core in a Zinc-Sulfide shell prevents oxidization and forces electrons to stay inside the crystal.", width/2, 60);
        };

        const renderFrame = () => {
            timeRef.current += 0.016;
            const t = timeRef.current;

            // Clear Background
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(0, 0, width, height);
            
            // Grid
            ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=0; i<width; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
            for(let i=0; i<height; i+=20) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
            ctx.stroke();

            if (activeStage === 1) drawStage1(t);
            if (activeStage === 2) drawStage2(t);
            if (activeStage === 3) drawStage3(t);
            
            requestRef.current = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [activeStage]);

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
                    onClick={() => setActiveStage(1)}
                    style={{ flex: 1, padding: '1.5rem', background: activeStage === 1 ? 'rgba(234, 179, 8, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: activeStage === 1 ? DASHBOARD_THEME.colors.accents.amber.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STAGE 1</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Precursor Mix</div>
                </button>
                <button 
                    onClick={() => setActiveStage(2)}
                    style={{ flex: 1, padding: '1.5rem', background: activeStage === 2 ? 'rgba(56, 189, 248, 0.1)' : 'transparent', border: 'none', borderRight: `1px solid ${DASHBOARD_THEME.colors.glass.border}`,
                    color: activeStage === 2 ? DASHBOARD_THEME.colors.accents.cyan.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STAGE 2</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rapid Nucleation</div>
                </button>
                <button 
                    onClick={() => setActiveStage(3)}
                    style={{ flex: 1, padding: '1.5rem', background: activeStage === 3 ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none',
                    color: activeStage === 3 ? DASHBOARD_THEME.colors.accents.violet.base : '#94a3b8', transition: 'all 0.3s', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>STAGE 3</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>ZnS Shelling</div>
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
            
            {/* Detailed Explanation Section */}
            <div style={{ padding: '2rem', borderTop: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, background: 'rgba(255,255,255,0.02)' }}>
                
                <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
                    1. Where do Quantum Dots come from?
                </h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                    You don't "mine" quantum dots, and you don't necessarily have to buy them pre-made (though you can buy them from chemical suppliers like Sigma-Aldrich for research). You <strong>synthesize</strong> (grow) them in a liquid solution. They start as simple salt powders (precursors) dissolved in a solvent (like a special oil). When you heat this liquid up very quickly, those dissolved atoms slam together and instantly form billions of microscopic crystals. Those crystals are the Quantum Dots. They float suspended in the liquid like microscopic glitter.
                </p>

                <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
                    2. Aren't they toxic?
                </h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                    <strong>The Industry Standard:</strong> Yes, the most famous and efficient ones (used in QLED TVs) are made from <strong>Cadmium</strong> or <strong>Lead</strong>. These are highly toxic. If you printed these on flexible plastic and it tore in the rain, it could poison the groundwater.<br/><br/>
                    <strong>The Cosmic Garage Solution:</strong> We use <strong>CIS (Copper-Indium-Sulfide)</strong>. Instead of toxic lead or cadmium, we dissolve abundant Copper salts, Indium salts, and Sulfur into the liquid. These are non-toxic. We then wrap that CIS crystal in a microscopic shell of <strong>Zinc-Sulfide (ZnS)</strong> to protect it. You could synthesize these in a well-ventilated garage using a microwave reactor or ultrasonic acoustics without needing a billion-dollar clean-room.
                </p>

                <h3 style={{ color: DASHBOARD_THEME.colors.text.primary, fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
                    3. How do you scale them to the Golden Ratio (Phi)?
                </h3>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                    This is the magic part. You control the size of a Quantum Dot entirely through <strong>Time and Temperature</strong>. When you heat the liquid and the crystals start forming (nucleation), they begin to grow larger and larger as long as the heat is applied.<br/><br/>
                    • If you stop the heat after 30 seconds, you get <strong>small dots</strong> (which absorb high-energy Ultraviolet/Blue light).<br/>
                    • If you let them cook for 3 minutes, you get <strong>large dots</strong> (which absorb low-energy Infrared heat).<br/><br/>
                    <strong>To achieve the Phi-Scaled Stack:</strong> You don't "carve" them to be 1.618. You simply run 7 different batches of the liquid in 7 different beakers. You calculate the exact mathematical growth rate of your CIS crystals.
                </p>
                <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                    <li><strong>Batch 1 (Octave 7):</strong> Cook for exactly enough seconds to hit Size X.</li>
                    <li><strong>Batch 2 (Octave 6):</strong> Cook longer until they hit Size X * 1.618.</li>
                    <li><strong>Batch 3 (Octave 5):</strong> Cook longer until they hit Size X * 1.618 * 1.618.</li>
                    <li>...and so on down the 7 octaves.</li>
                </ol>
                <p style={{ marginBottom: '0', fontSize: '0.95rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.6 }}>
                    Once you have your 7 different jars of quantum dot "ink" perfectly scaled to Phi, you just load them into a slot-die printer one by one and print them in 7 layers on top of each other. It is "Cosmic" math, but the actual physical application is just precise timing, heat, and printing.
                </p>
            </div>
        </div>
    );
};
