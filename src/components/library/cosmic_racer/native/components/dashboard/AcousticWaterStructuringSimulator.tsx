'use client';

import React, { useRef, useEffect, useState } from 'react';
import AcousticWaterStructuring3DModel from './AcousticWaterStructuring3DModel';

import { 
    TARGET_ELEMENTS, 
    FLUID_MEDIA, 
    calculateWavelength, 
    calculateGorkovContrast,
    calculateAcousticForceVector
} from '../../state/logic/HarvesterBlueprintEngine';

// We will use a high-performance Float32Array for particles to match Cymatics fidelity.
// Data structure per particle (6 floats): [x_m, y_m, vx_ms, vy_ms, R_m, phase_index]
// phase_index: 0 (Unstructured), 1 (Structured/Hexagonal/etc)

// Physics Constants
const PIPE_DIAMETER_M = 1.618034; // Phi
const BASE_FREQ_HZ = 432 * Math.pow(1.618034, 12); // 138.8 kHz
const WATER_DENSITY = 1025; // kg/m^3 (seawater)
const SPEED_OF_SOUND_WATER = 1500; // m/s
const WATER_COMPRESSIBILITY = 4.5e-10; // Pa^-1

const getParticleColor = (phaseIndex: number, targetShape: string) => {
    if (phaseIndex === 1) return '#ffffff'; // Structured is pure white
    return '#1e293b'; // Unstructured is murky dark blue
};
const TARGET_SHAPES: Record<string, {name: string, color: string, description: string, applications: string, formula: string}> = {
    'Hexagonal': { 
        name: 'Hexagonal Lattice', 
        color: '#38bdf8', 
        description: 'Highly stable 6-sided coherence identical to biological cell water structure. Maximizes hydration efficiency.',
        applications: 'Cellular Hydration, Seed Germination, Extended Shelf Life',
        formula: 'H2O(H2O)6'
    },
    'Tetrahedral': { 
        name: 'Tetrahedral Array', 
        color: '#8b5cf6', 
        description: 'Dense 4-point structure with altered surface tension. Ideal for stripping contaminants without chemical surfactants.',
        applications: 'Chemical-Free Cleaning, Organic Solvent Replacement',
        formula: 'H2O(H2O)4'
    },
    'Fullerene': { 
        name: 'Fullerene Sphere', 
        color: '#10b981', 
        description: 'Spherical cage-like water structure capable of capturing and isolating specific nano-toxins or delivering nutrients.',
        applications: 'Toxic Binding, Targeted Delivery Systems',
        formula: 'H2O(60)'
    }
};

const SHAPE_KEYS = Object.keys(TARGET_SHAPES);

export const AcousticWaterStructuringSimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Engineering Controls State
    const [selectedShape, setSelectedShape] = useState('Hexagonal');
    const [flowVelocity, setFlowVelocity] = useState(2.0); // m/s
    const [acousticPower, setAcousticPower] = useState(1.42); // kW
    
    // Physics Data
    const shapeData = TARGET_SHAPES[selectedShape];
    const medium = { density: 1025, speedOfSound: 1500, compressibility: 4.5e-10 }; // Seawater fixed

    // Refs for hot-loop access
    const selectedShapeRef = useRef(selectedShape);
    const flowVelocityRef = useRef(flowVelocity);
    const acousticPowerRef = useRef(acousticPower);

    useEffect(() => {
        selectedShapeRef.current = selectedShape;
        flowVelocityRef.current = flowVelocity;
        acousticPowerRef.current = acousticPower;
    }, [selectedShape, flowVelocity, acousticPower]);
    
    const baseFreqHz = 432 * Math.pow(1.618034, 12); // 138.8 kHz
    const wavelengthMeters = calculateWavelength(medium.speedOfSound, baseFreqHz);
    const wavelengthVisual = wavelengthMeters * 1000 * 50; // Scale up for visual
    
    // Default ui display for Acoustic Efficiency
    const displayEfficiency = (acousticPower / 1.42) * 100.0;

    // Canvas Simulation Loop
    const particleDataRef = useRef<Float32Array | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        let currentYieldCollected = 0; // molecules
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Physics Environment Constants (SI Units)
        const Lx = 2.0; // meters (length of simulated pipe section)
        const Ly = 0.5; // meters (height of pipe)
        const dt = 0.016; // 60fps time step (~16ms)
        const R_base = 0.012; // 1.2cm base radius
        
        const numParticles = 600; 
        
        // Data structure: [x_m, y_m, vx_ms, vy_ms, R_m, phaseIndex] 
        if (!particleDataRef.current) {
            particleDataRef.current = new Float32Array(numParticles * 6);
            
            for (let i = 0; i < numParticles; i++) {
                const offset = i * 6;
                particleDataRef.current[offset] = (Math.random() * (Lx * 2.0)) - Lx; // Start scattered across pipe
                particleDataRef.current[offset + 1] = Math.max(R_base, Math.min(Ly - R_base, Math.random() * Ly));
                particleDataRef.current[offset + 2] = flowVelocity * (0.8 + Math.random() * 0.4); 
                particleDataRef.current[offset + 3] = (Math.random() - 0.5) * 0.2; 
                particleDataRef.current[offset + 4] = R_base * (0.8 + Math.random() * 0.5); 
                particleDataRef.current[offset + 5] = 0; // Starts 0 (Murky/Unstructured)
            }
        }
        
        const particleData = particleDataRef.current;

        const render = () => {
            time += dt;
            
            // Motion trails effect (Cymatics style clearing)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
            ctx.fillRect(0, 0, width, height);

            // Read current reactive state via refs
            const activeShape = selectedShapeRef.current;
            const activePower = acousticPowerRef.current;
            const activeFlow = flowVelocityRef.current;
            const shapeData = TARGET_SHAPES[activeShape];

            // Realistic Physical Pipe Height
            const simHeight = 450;
            const visualPipeHeight = simHeight * 0.7; 
            const verticalPaddingVisual = (simHeight - visualPipeHeight) / 2; // Center the pipe vertically

            // Background of pipe
            ctx.fillStyle = 'rgba(56, 189, 248, 0.02)';
            ctx.fillRect(0, verticalPaddingVisual, width, visualPipeHeight);
            
            // Render Mechanical Pipe Framework 
            const splitX_visual = width * 0.35; // Start of nodes
            const endX_visual = width * 0.65; // End of nodes
            
            // Draw Pipe Ceiling Metal Above the channel
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(0, 0, width, verticalPaddingVisual);
            // Draw Pipe Floor Metal Below the channel
            ctx.fillRect(0, verticalPaddingVisual + visualPipeHeight, width, height - (verticalPaddingVisual + visualPipeHeight));
            
            // Draw the Transducer Hardware Blocks (Top & Bottom Center)
            ctx.fillStyle = '#334155'; // Lighter grey metal
            const transTopY = 0;
            const transTopH = verticalPaddingVisual - 4;
            const transBotY = verticalPaddingVisual + visualPipeHeight + 4;
            const transBotH = height - (verticalPaddingVisual + visualPipeHeight + 4);
            
            ctx.fillRect(splitX_visual, transTopY, endX_visual - splitX_visual, transTopH);
            ctx.fillRect(splitX_visual, transBotY, endX_visual - splitX_visual, transBotH);
            
            // Draw active Acoustic Waves pulsing inside the Transducer blocks
            if (activePower > 0) {
                const powerNorm = Math.min(1.0, activePower / 3.0); 
                ctx.strokeStyle = `rgba(14, 165, 233, ${0.3 + (powerNorm * 0.7)})`; // Cyan glow
                ctx.lineWidth = 2 + (powerNorm * 2);
                
                // Draw inward pointing arrows to visually demonstrate pressure applying to the fluid
                const arrowSpacing = 60;
                for (let x = splitX_visual + 30; x <= endX_visual; x += arrowSpacing) {
                    const arrowAnim = (time * 1.0 + x * 0.01) % 1.0; // 0 to 1 inward progress
                    const fade = (1.0 - arrowAnim) * powerNorm;
                    ctx.fillStyle = `rgba(14, 165, 233, ${fade})`;
                    
                    // Top Transducer Arrow (Pointing Down)
                    const arrowYTop = transTopY + (arrowAnim * transTopH);
                    ctx.beginPath();
                    ctx.moveTo(x, arrowYTop + 10);
                    ctx.lineTo(x - 6, arrowYTop);
                    ctx.lineTo(x + 6, arrowYTop);
                    ctx.closePath();
                    ctx.fill();

                    // Bottom Transducer Arrow (Pointing Up)
                    const arrowYBot = transBotY + transBotH - (arrowAnim * transBotH);
                    ctx.beginPath();
                    ctx.moveTo(x, arrowYBot - 10);
                    ctx.lineTo(x - 6, arrowYBot);
                    ctx.lineTo(x + 6, arrowYBot);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Draw Active Shape Label on Transducers
                ctx.fillStyle = shapeData.color;
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const label1 = `ALIGNMENT: ${shapeData.name.toUpperCase()} LATTICE`;
                const label2 = `PHASE POWER: ${activePower.toFixed(2)} kW`;
                const centerX = splitX_visual + (endX_visual - splitX_visual) / 2;
                
                ctx.fillText(label1, centerX, transTopY + transTopH / 2 - 8);
                ctx.fillText(label2, centerX, transTopY + transTopH / 2 + 8);
                ctx.fillText(label1, centerX, transBotY + transBotH / 2 - 8);
                ctx.fillText(label2, centerX, transBotY + transBotH / 2 + 8);
                
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
            }
            
            // Draw Standing Waves in the fluid
            if (activePower > 0) {
                const numNodes = 6;
                const nodeZoneWidth = endX_visual - splitX_visual;
                const nodeSpacing = nodeZoneWidth / numNodes;
                for (let i = 0; i < numNodes; i++) {
                    const nx = splitX_visual + (i * nodeSpacing) + (nodeSpacing / 2);
                    const powerNorm = Math.min(1.0, activePower / 3.0); 
                    const intensity = powerNorm * (0.3 + Math.sin(time * 2.0 + i) * 0.2);
                    
                    const grad = ctx.createLinearGradient(nx - 20, 0, nx + 20, 0);
                    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    grad.addColorStop(0.5, `rgba(56, 189, 248, ${intensity})`);
                    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                    
                    ctx.fillStyle = grad;
                    ctx.fillRect(nx - 20, verticalPaddingVisual, 40, visualPipeHeight);
                }
            }

            ctx.globalCompositeOperation = 'source-over';

            // Particle Physics & Rendering Loop
            // A much lighter PBD that focuses on continuous linear flow rather than extraction
            const structuringStartPx = Lx * 0.35;
            const structuringEndPx = Lx * 0.65;
            let moleculesStructuredThisFrame = 0;

            for (let i = 0; i < numParticles; i++) {
                const offset = i * 6;
                let px = particleData[offset];
                let py = particleData[offset + 1];
                let vx = particleData[offset + 2];
                let vy = particleData[offset + 3];
                const R = particleData[offset + 4];
                let phaseI = particleData[offset + 5];

                // Continuous Flow Laminar Physics
                let targetFlow = activeFlow;
                
                if (phaseI === 0) {
                    // Unstructured water is slightly chaotic and viscous
                    vy += (Math.random() - 0.5) * 0.4 * dt;
                    vx += (Math.random() - 0.5) * 0.2 * dt;
                } else {
                    // Structured water flows smoothly and rapidly with lower drag
                    targetFlow = activeFlow * 1.1; 
                    vy *= 0.95; // Dampen vertical motion
                }
                
                // Seek target velocity
                vx += (targetFlow - vx) * 2.0 * dt;

                // Acoustic Processing Zone
                if (activePower > 0 && px > structuringStartPx && px < structuringEndPx) {
                    if (activePower >= 0.5 && phaseI === 0) {
                        // Enter structured phase!
                        particleData[offset + 5] = 1;
                        phaseI = 1;

                        // Calculate yield: One visual particle represents N molecules
                        // 1 Liter of water = ~3.34 x 10^25 molecules
                        // E.g. process 4112 L/s.
                        const litersPerVisual = (4112 * dt) / (numParticles * (Lx / activeFlow) * 60); // Roughly distributed
                        moleculesStructuredThisFrame += litersPerVisual * 3.34e25; 
                    }
                }

                // Apply velocities
                px += vx * dt;
                py += vy * dt;

                // Ceiling/Floor Bounce
                if (py < R) { py = R; vy *= -0.5; }
                if (py > Ly - R) { py = Ly - R; vy *= -0.5; }

                // Wrap around X (teleport perfectly back)
                if (px > Lx) {
                    px -= Lx * 2.0; 
                    particleData[offset + 5] = 0; // REVERT TO UNSTRUCTURED
                }

                // Save State
                particleData[offset] = px;
                particleData[offset + 1] = py;
                particleData[offset + 2] = vx;
                particleData[offset + 3] = vy;

                // Render Graphic
                const drawX = (px / Lx) * (width / 2.0) + (width / 2.0); // Map -Lx..Lx to 0..width
                const drawY = (py / Ly) * visualPipeHeight + verticalPaddingVisual;
                const visualRadius = (R / Ly) * visualPipeHeight * 0.4;
                
                // Render Unstructured Water (Phase 0)
                if (phaseI === 0) {
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; // Murky dark blue
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, visualRadius, 0, Math.PI*2);
                    ctx.fill();
                } 
                // Render Structured Water (Phase 1)
                else {
                    ctx.fillStyle = shapeData.color;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, visualRadius, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Core brightness
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, visualRadius * 0.5, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            // Accumulate Yield
            currentYieldCollected += moleculesStructuredThisFrame;
            
            // Format scientific string
            const formatYield = (num: number) => {
                if (num === 0) return '0.00e0';
                return num.toExponential(2).replace('e+', ' x 10^');
            };

            // Calculate overall efficiency
            const effPercentage = Math.min(100, (activePower / 1.42) * 100);

            // Render HUD overlay
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, simHeight, width, height - simHeight); // Clear bottom area
            
            ctx.fillStyle = shapeData.color;
            ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
            ctx.fillText(`MOLECULES PURIFIED: ${formatYield(currentYieldCollected)}`, 16, height - 24);
            
            ctx.fillStyle = '#34d399'; 
            ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
            ctx.fillText(`EFFICIENCY: ${effPercentage.toFixed(1)}%`, width - 200, height - 24);
            
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []); // Empty dependency array prevents the loop from resetting and deleting particleDataRef when UI state changes

    return (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* LEFT: CANVAS SIMULATOR */}
            <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'visible', border: '1px solid #1e293b', position: 'relative', zIndex: 10 }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Live Telemetry: Hull Cross-Section
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>TRAP ACTIVE</span>
                    </div>
                </div>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', zIndex: 20 }}>
                    <canvas 
                        ref={canvasRef} 
                        style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 50, borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }} 
                        width={800} 
                        height={450} 
                    />
                </div>
            </div>

            {/* RIGHT: ENGINEERING CONTROLS */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    Hardware Controls
                </h3>

                {/* Shape Target */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Target Molecular Geometry
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(TARGET_SHAPES).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedShape(key)}
                                style={{
                                    padding: '0.75rem 0.5rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedShape === key ? val.color : '#e2e8f0'}`,
                                    background: selectedShape === key ? `${val.color}15` : '#fff',
                                    color: selectedShape === key ? val.color : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Block instead of Medium & Gor'kov */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: shapeData.color, fontSize: '1rem', fontWeight: 800 }}>{shapeData.name}</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{shapeData.description}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Lattice Formula</span>
                        <span style={{ fontSize: '0.8ren', fontWeight: 700, color: '#0f172a' }}>{shapeData.formula}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Acoustic Energy</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>Optimized</span>
                    </div>

                    <div style={{ height: '1px', background: '#e2e8f0', margin: '1rem 0' }}></div>
                    <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                        <strong style={{ color: '#38bdf8' }}>APPLICATIONS:</strong><br/>
                        {shapeData.applications}
                    </div>
                </div>

                {/* Current Flow Slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Current Velocity</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>{flowVelocity.toFixed(1)} m/s</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.1" max="5.0" step="0.1" 
                        value={flowVelocity} 
                        onChange={(e) => setFlowVelocity(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
                    />
                </div>

                {/* Power Slider */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Transducer Array Power</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#eab308' }}>{acousticPower.toFixed(2)} kW</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" max="30" step="0.5" 
                        value={acousticPower} 
                        onChange={(e) => setAcousticPower(parseFloat(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#eab308' }}
                    />
                </div>

            </div>
        </div>
        
        {/* PHYSICAL SPECIFICATIONS */}
        <div style={{ background: '#0f172a', borderRadius: '20px', padding: '3rem', marginTop: '2rem', color: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                System Physical Specifications
            </h2>
            
            <div style={{ marginBottom: '3rem' }}>
                <AcousticWaterStructuring3DModel />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#38bdf8', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Alignment Chamber Dimensions</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Length (Lx):</strong> 2.0 Meters (Active Acoustic Zone)</li>
                        <li><strong>Height (Ly):</strong> 0.5 Meters (Laminar processing channel)</li>
                        <li><strong>Depth (Lz):</strong> 1.0 Meters (Pipeline cross-width)</li>
                        <li><strong>Acoustic Nodes:</strong> 12 Phase-Alignment Zones</li>
                    </ul>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#eab308', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Processing Volume</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Flow Rate Velocity:</strong> 2.0 Meters / second</li>
                        <li><strong>Cross-Sectional Area:</strong> 0.5 Square Meters</li>
                        <li><strong>Volume Processing:</strong> 1,000 Liters / second</li>
                        <li><strong>Total Daily Capacity:</strong> 86.4 Million Liters / day</li>
                    </ul>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#8b5cf6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Phase Coherence Requirements</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        Water molecules naturally form chaotic patterns. To achieve specific geometries like Hexagonal or Tetrahedral structures, precise acoustic frequencies must overcome the kinetic energy of the flowing water. The <strong>Hexagonal Lattice</strong> requires exactly tuned harmonics proportional to the Phi golden ratio.
                    </p>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#10b981', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Power Delivery System</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Intake Strategy:</strong> Laminar flow smoothing</li>
                        <li><strong>Transducer Array:</strong> Custom built piezoelectric stacks</li>
                        <li><strong>Acoustic Input:</strong> 1.0 - 30.0 kW Variable Draw</li>
                        <li><strong>Frequency Band:</strong> 100 kHz - 250 kHz</li>
                    </ul>
                </div>
            </div>
            
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                <h3 style={{ color: '#38bdf8', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Structuring Efficiency (Alignment % per Liter)</h3>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                    The projections above calculate a <strong>100% theoretical maximum structural conversion</strong>. In a perfectly tuned acoustic, laminar flow environment, every target water molecule is forced into phase alignment by the node pressure.
                    <br/><br/>
                    In real-world physical pipelines, conversion accuracy averages between <strong>85% to 95%</strong>. Efficiency drops are typically caused by bio-particulates disrupting the pressure geometries, trapped dissolved gasses (micro-cavitation), or boundary layer friction causing slight temporal shifts in the traveling waves.
                </p>
            </div>
        </div>

        {/* PHYSICS EXPLANATION */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Real-World Physics: Water Phase Alignment
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
                Unlike chemical desalination, this system utilizes pure sound. It leverages <strong>Acoustic Resonance Arrays</strong> and <strong>Molecular Lattice Structuring</strong> to physically alter the hydrogen bonds within H2O.
                <br/><br/>
                Here is exactly how the system achieves continuous throughput purification:
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Laminar Intake & Viscosity Prep:</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Water enters the high-volume pipe in a naturally turbulent, &quot;unstructured&quot; state—its molecules sliding over each other chaotically. Before acoustic treatment, a diffuser limits turbulence, settling the flow into smooth, parallel sheets. This laminar flow is critical as turbulence would scatter the delicate acoustic waveforms required down the line.
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Standing Wave Injection:</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        As the smooth water enters the main chamber, immensely powerful piezoelectric transducers emit high-frequency pulses (typically matched to Fibonacci or natural resonant harmonics). The waves bouncing off the opposing walls interact and construct a <strong>Standing Wave</strong>. This creates static zones of immense high and low pressure rigidly locked in physical space.
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Hydrogen Bond Alignment:</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Water is highly compressible relative to these power levels. The alternating zones of extreme compression literally twist and force the angle of the hydrogen-oxygen bonds. Driven by the spatial resonance, the water molecules are forced perfectly into line—snapping into an optimized geometric lattice (like Hexagonal coherence).
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #eab308' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Contaminant Expulsion:</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Perfect geometries (like Hexagonal H2O) cannot fit anomalous particles like micro-plastics, heavy metals, or pathogens within their rigid, tightly-packed crystalline bonds. As the water literally &quot;freezes&quot; into this highly conductive liquid crystal structure under acoustic pressure, it physically ejects all impurities into the chaotic buffer zones between the nodes for easy extraction.
                    </p>
                </div>
            </div>

            <p style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600, marginTop: '2rem', textAlign: 'center' }}>
                Instantly clean, hyper-hydrating, cellular-available water—created exclusively through the immense mechanical pressure of sound.
            </p>
        </div>
        </>
    );
};
