'use client';

import React, { useRef, useEffect, useState } from 'react';

import { 
    TARGET_ELEMENTS, 
    FLUID_MEDIA, 
    calculateWavelength, 
    calculateGorkovContrast,
    calculateAcousticForceVector
} from '../../state/logic/HarvesterBlueprintEngine';

// We will use a high-performance Float32Array for particles to match Cymatics fidelity.
// Data structure per particle (6 floats): [x, y, vx, vy, mass, typeIndex]
// mass: 0.1 (nano) up to 1.0+ (macro/sediment). When >= 1.0 it is "caught" and falling.
// typeIndex: 0 (JUNK), > 0 (Specific element from ELEMENT_KEYS)

const ELEMENT_KEYS = Object.keys(TARGET_ELEMENTS);
const ELEMENT_INDICIES: Record<string, number> = {};
ELEMENT_KEYS.forEach((key, index) => {
    ELEMENT_INDICIES[key] = index + 1; // 0 is reserved for JUNK
});

const getParticleColor = (typeIndex: number, mass: number, targetElementSymbol: string) => {
    if (mass >= 1.0) return TARGET_ELEMENTS[targetElementSymbol].color;
    if (typeIndex === 0) return 'rgba(255, 255, 255, 0.4)'; // JUNK
    return TARGET_ELEMENTS[ELEMENT_KEYS[typeIndex - 1]].color;
};

export const AcousticHarvesterSimulator = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Engineering Controls State
    const [selectedElement, setSelectedElement] = useState('Au');
    const [selectedMedium, setSelectedMedium] = useState('SEAWATER');
    const [flowVelocity, setFlowVelocity] = useState(2.0); // m/s
    const [acousticPower, setAcousticPower] = useState(17.42); // kW
    
    // Physics Data
    const element = TARGET_ELEMENTS[selectedElement];
    const medium = FLUID_MEDIA[selectedMedium];

    // Refs for hot-loop access
    const selectedElementRef = useRef(selectedElement);
    const flowVelocityRef = useRef(flowVelocity);
    const acousticPowerRef = useRef(acousticPower);

    useEffect(() => {
        selectedElementRef.current = selectedElement;
        flowVelocityRef.current = flowVelocity;
        acousticPowerRef.current = acousticPower;
    }, [selectedElement, flowVelocity, acousticPower]);
    
    const baseFreqHz = 432 * Math.pow(1.618034, 17); // 1.54 MHz
    const wavelengthMeters = calculateWavelength(medium.speedOfSound, baseFreqHz);
    const wavelengthVisual = wavelengthMeters * 1000 * 50; // Scale up for visual
    
    // Default ui display for Gor'kov Contrast
    const displayPhiG = calculateGorkovContrast(element.density, medium.density, element.compressibility, medium.compressibility);

    // Canvas Simulation Loop
    const particleDataRef = useRef<Float32Array | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        const currentYieldCollected = 0;
        
        // Continuous Yield Tracking (Golden Ratio Splitter)
        let previousElement = selectedElementRef.current;

        const width = canvas.width;
        const height = canvas.height;
        
        // Physics Environment Constants (SI Units)
        const Lx = 2.0; // meters (length of simulated pipe section)
        const Ly = 0.5; // meters (height of pipe)
        const mu = 0.001002; // Pa*s (dynamic viscosity of seawater at 20C)
        const g = 9.81; // m/s^2 (gravity)
        const dt = 0.016; // 60fps time step (~16ms)
        const R_base = 0.012; // 1.2cm base radius
        
        // Setup True Fluid PBD Engine
        const numParticles = 900; // 45% volume fraction for smooth fluid flow
        // Grid for Spatial Hashing (Cell size = diameter of base)
        const cellSize = R_base * 2.5; 
        // Expand grid width to safely cover particles from -1.0 Lx to 1.5 Lx
        const gridW = Math.ceil((Lx * 2.5) / cellSize) + 5;
        const gridH = Math.ceil(1.5 / cellSize) + 5; 
        const numCells = gridW * gridH;
        
        // Instantiate Grid Arrays exactly once (Persisted in closure)
        const cellStarts = new Int32Array(numCells);
        const cellEntries = new Int32Array(numParticles);
        const predictedPos = new Float32Array(numParticles * 2);

        // Data structure: [x_m, y_m, vx_ms, vy_ms, R_m, typeIndex] 
        if (!particleDataRef.current) {
            particleDataRef.current = new Float32Array(numParticles * 6);
            
            const rows = 15;
            const cols = 60; // 15 * 60 = 900
            
            // 1. Uniform perfectly spaced grid spanning from the far left (-Lx) to the right (Lx)
            const startX = -Lx; 
            const endX = Lx;
            const spacingX = (endX - startX) / cols;
            const spacingY = Ly / (rows + 1);

            let i = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (i >= numParticles) break;
                    const offset = i * 6;
                    let typeIndex = 0; 
                    if (Math.random() < 0.10) {
                        typeIndex = Math.floor(Math.random() * ELEMENT_KEYS.length) + 1;
                    }
                    
                    const R_variation = R_base * (0.8 + Math.random() * 0.4); 
                    
                    // Spawn starting from the middle of the pipe
                    particleDataRef.current[offset] = startX + (c * spacingX) + (Math.random() * spacingX * 0.4); 
                    particleDataRef.current[offset + 1] = spacingY + (r * spacingY) + (Math.random() * spacingY * 0.4);
                    
                    // Assign exact target speed at spawn
                    const innateVariation = 0.8 + ((i * 137.5) % 1.0) * 0.4;
                    particleDataRef.current[offset + 2] = flowVelocity * innateVariation; 
                    particleDataRef.current[offset + 3] = (Math.random() - 0.5) * 0.2; // slight vertical drift
                    particleDataRef.current[offset + 4] = typeIndex > 0 ? R_base : R_variation; 
                    particleDataRef.current[offset + 5] = typeIndex; 
                    i++;
                }
            }
        }
        
        const particleData = particleDataRef.current;

        const render = () => {
            time += dt;
            
            // Motion trails effect (Cymatics style clearing)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
            ctx.fillRect(0, 0, width, height);

            // Read current reactive state via refs to avoid restarting the animation
            const activeElement = selectedElementRef.current;
            const activePower = acousticPowerRef.current;
            const activeFlow = flowVelocityRef.current;
            const activeElementData = activeElement ? TARGET_ELEMENTS[activeElement] : null;

            // Notice we do NOT reset the particle positions or clear the yields when switching targets anymore.
            // Switching targets just changes which acoustic resonance frequency the transducers output.
            if (activeElement !== previousElement) {
                previousElement = activeElement;
            }

            // Realistic Physical Pipe Height
            const visualPipeHeight = height * 0.7; 
            const verticalPaddingVisual = (height - visualPipeHeight) / 2; // Center the pipe vertically

            // Mute the background lines, let the cymatics graphics pop (drawn only within the pipe bounds)
            ctx.fillStyle = 'rgba(56, 189, 248, 0.02)';
            ctx.fillRect(0, verticalPaddingVisual, width, visualPipeHeight);
            
            // True Physics Acoustic Field
            // Map power to physical acoustic energy density (E_ac = Intensity / c)
            // Area = Ly * 1.0m (depth)
            const pipeArea = Ly * 1.0; 
            const Intensity = (activePower * 1000) / pipeArea; // W/m^2
            const E_ac = Intensity / medium.speedOfSound; // J/m^3
            const E_ac_dynamic = E_ac; // for inner loop

            const n = Math.floor(activePower / 5) + 1; 
            const m = 4; // fixed vertical pipe harmonics
            
            // Cosmic Compass Acoustic Parameters
            const PHI = 1.618034;
            const GOLDEN_ANGLE_RAD = 137.5 * (Math.PI / 180); 
            // The sweeping wave travels at Phi * fluid velocity
            const waveVelocity = activeFlow * PHI; 
            const phaseShift = time * waveVelocity;
            
            // Wave numbers (angled based on Golden Angle)
            const kx = Math.cos(GOLDEN_ANGLE_RAD) * 10.0; // Wavelength density arbitrary scale
            const ky = Math.sin(GOLDEN_ANGLE_RAD) * 10.0;

            // Render Mechanical Pipe Framework 
            
            // Draw glowing Transducer plates at top and bottom bounds of the active fluid channel
            const transducerEndX = width; 
            ctx.fillStyle = '#0ea5e9'; // bright cyan
            ctx.fillRect(0, verticalPaddingVisual, transducerEndX, 4);
            ctx.fillRect(0, verticalPaddingVisual + visualPipeHeight - 4, transducerEndX, 4);

            // Draw Pipe Floor Metal (Solid continuity) Below the channel
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(0, verticalPaddingVisual + visualPipeHeight, width, height - (verticalPaddingVisual + visualPipeHeight));
            // Draw Pipe Ceiling Metal Above the channel
            ctx.fillRect(0, 0, width, verticalPaddingVisual);
            
            ctx.globalCompositeOperation = 'source-over';

            // Render particles (handled within physical loop for speed)
            const phiG = activeElementData ? calculateGorkovContrast(activeElementData.density, medium.density, activeElementData.compressibility, medium.compressibility) : 0;
            const SIMULATION_ACCELERATION_FACTOR = 0.8; 

            // PBD Pass 1: Integrate Forces (Gravity, Acoustic, Pump)
            for (let i = 0; i < numParticles; i++) {
                const offset = i * 6;
                const px = particleData[offset];
                const py = particleData[offset + 1];
                let vx = particleData[offset + 2];
                let vy = particleData[offset + 3];
                const R = particleData[offset + 4];
                const typeIndex = particleData[offset + 5];

                if (px >= Lx) {
                    // Mark for wrap-around in Pass 4 to maintain continuous fluid volume
                    // Perfect spatial teleportation map: shift by exactly 2*Lx backward.
                    // This mathematically guarantees they drop into the exact hole left by the stream without overlapping.
                    predictedPos[i * 2] = px - (Lx * 2.0); 
                    predictedPos[i * 2 + 1] = py; // Do NOT randomize Y, keep the fluid structurally locked.
                    
                    // Maintain exact velocity as they wrap around.
                    particleData[offset + 2] = vx;
                    particleData[offset + 3] = vy;

                    // Only re-roll if it's water, OR if a target made it all the way through without being harvested (keep rare targets rare)
                    if (typeIndex === 0 && Math.random() < 0.05) {
                        particleData[offset + 5] = Math.floor(Math.random() * ELEMENT_KEYS.length) + 1; // Become target
                        particleData[offset + 4] = R_base;
                    } else if (typeIndex > 0 && Math.random() < 0.8) {
                        particleData[offset + 5] = 0; // Target escaped, turn back to water most of the time
                        particleData[offset + 4] = R_base * (0.7 + Math.random() * 0.6);
                    }
                    continue;
                }

                // Gravity (Disable strict gravity for targets in the main flow so they don't instasink, until acoustic force is added)
                // For now, let all particles flow neutrally so the user can see the fluid dynamics clearly.
                // const elDensity = typeIndex > 0 ? TARGET_ELEMENTS[ELEMENT_KEYS[typeIndex - 1]].density : medium.density;
                // const F_g_net = (elDensity - medium.density) * g; 
                // vy += F_g_net * dt * 0.01; 
                
                // Smooth uniform flow with slight noise, removing the parabolic constraints that caused erratic speed zones
                const innateVariation = 0.8 + ((i * 137.5) % 1.0) * 0.4; // 0.8x to 1.2x 
                const targetFlow = activeFlow * innateVariation;
                
                // Gently blend current velocity towards target flow
                vx += (targetFlow - vx) * 5.0 * dt; 
                vy += (Math.random() - 0.5) * 2.0 * dt; // Introduce trace thermal/turbulent jiggle
                vy *= 0.95; // Minor vertical viscosity damping

                predictedPos[i * 2] = px + vx * dt;
                predictedPos[i * 2 + 1] = py + vy * dt;
            }

            // PBD Pass 2: Spatial Hash Grid Construction
            cellStarts.fill(-1);
            for (let i = 0; i < numParticles; i++) {
                const px = predictedPos[i * 2];
                const py = predictedPos[i * 2 + 1];
                
                // Validate NaN or infinite
                if (isNaN(px) || isNaN(py)) continue;
                
                // Shift the grid origin by +Lx so that particles at x=-Lx fall into cx=0
                // This prevents all off-screen left particles from being crushed into the same column
                const cx = Math.max(0, Math.min(gridW - 1, Math.floor((px + Lx) / cellSize)));
                const cy = Math.max(0, Math.min(gridH - 1, Math.floor(py / cellSize)));
                const cIdx = cy * gridW + cx;

                cellEntries[i] = cellStarts[cIdx];
                cellStarts[cIdx] = i;
            }

            // PBD Pass 3: Density Repulsion & Boundaries
            const iterations = 3;
            for (let iter = 0; iter < iterations; iter++) {
                for (let i = 0; i < numParticles; i++) {
                    let px = predictedPos[i * 2];
                    if (px > Lx) continue; // It exited the pipe completely, skip constraint solving
                    let py = predictedPos[i * 2 + 1];
                    const Ri = particleData[i * 6 + 4];
                    const typeI = particleData[i * 6 + 5];
                    const densI = typeI > 0 ? TARGET_ELEMENTS[ELEMENT_KEYS[typeI - 1]].density : medium.density;

                    // Grid Collision
                    // Same origin shift mapping for lookups
                    const cx = Math.floor((px + Lx) / cellSize);
                    const cy = Math.floor(py / cellSize);
                    
                    if (cx >= 0 && cx < gridW && cy >= 0 && cy < gridH) {
                        for (let ny = Math.max(0, cy - 1); ny <= Math.min(gridH - 1, cy + 1); ny++) {
                            for (let nx = Math.max(0, cx - 1); nx <= Math.min(gridW - 1, cx + 1); nx++) {
                                const nIdx = ny * gridW + nx;
                                let j = cellStarts[nIdx];
                                
                                while (j !== -1) {
                                    if (j > i) {
                                        // Only push things still inside the active pipe
                                        const pj_x = predictedPos[j * 2];
                                        if (pj_x <= Lx) {
                                            const jy = predictedPos[j * 2 + 1];
                                            const Rj = particleData[j * 6 + 4];
                                            
                                            const dx = px - pj_x;
                                            const dy = py - jy;
                                            const distSq = dx*dx + dy*dy;
                                            const minDist = Ri + Rj;
                                            
                                            if (distSq > 0 && distSq < minDist*minDist) {
                                                const dist = Math.sqrt(distSq);
                                                const overlap = minDist - dist;
                                                
                                                // Mass ratio
                                                const typeJ = particleData[j * 6 + 5];
                                                const densJ = typeJ > 0 ? TARGET_ELEMENTS[ELEMENT_KEYS[typeJ - 1]].density : medium.density;
                                                const wI = 1.0 / densI;
                                                const wJ = 1.0 / densJ;
                                                const wTotal = wI + wJ;

                                                const resolveI = overlap * (wI / wTotal);
                                                const resolveJ = overlap * (wJ / wTotal);
                                                
                                                const dirX = dx / dist;
                                                const dirY = dy / dist;

                                                px += dirX * resolveI;
                                                py += dirY * resolveI;
                                                predictedPos[j * 2] -= dirX * resolveJ;
                                                predictedPos[j * 2 + 1] -= dirY * resolveJ;
                                            }
                                        }
                                    }
                                    j = cellEntries[j];
                                }
                            }
                        }
                    }

                    // Continuous Flow Boundaries (Pipe Floor, Ceiling)
                    
                    // Ceiling
                    if (py < Ri * 2) py = Ri * 2;
                    
                    // Flat Floor
                    if (py > Ly - Ri) py = Ly - Ri;
                    
                    predictedPos[i * 2] = px;
                    predictedPos[i * 2 + 1] = py;
                }
            }

            // PBD Pass 4: Apply Velocities, Wrap, & Render
            for (let i = 0; i < numParticles; i++) {
                const offset = i * 6;
                const px = predictedPos[i * 2];
                const py = predictedPos[i * 2 + 1];
                const typeI = particleData[offset + 5];

                // If the particle teleported from wrap-around, don't compute reverse speed or draw a massive stretch line
                // Because we wrap all the way to -Lx or more, the check condition has to be large enough
                if (px - particleData[offset] < -Lx * 0.5) {
                    // It wrapped around! Instantly update history so it doesn't leave a motion trail flying across the screen
                    particleData[offset] = px;
                    particleData[offset + 1] = py;
                } else {
                    // Compute true physical velocity from PBD displacement
                    particleData[offset + 2] = (px - particleData[offset]) / dt;
                    particleData[offset + 3] = (py - particleData[offset + 1]) / dt;
                    particleData[offset] = px;
                    particleData[offset + 1] = py;
                }

                // Render true physical boundaries centered vertically
                const R = particleData[offset + 4];
                const drawX = (px / Lx) * width;
                const drawY = (py / Ly) * visualPipeHeight + verticalPaddingVisual;
                const visualRadius = (R / Lx) * width;
                
                if (typeI > 0) {
                    const trueElementSymbol = ELEMENT_KEYS[typeI - 1];
                    ctx.fillStyle = TARGET_ELEMENTS[trueElementSymbol].color;
                    
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, visualRadius, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Outline targets so they don't get lost in the water visual
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)'; 
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, visualRadius, 0, Math.PI*2);
                    ctx.fill();
                }
            }

            // HUD Draw Overlay
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#f8fafc';
            ctx.font = '10px monospace';
            ctx.fillText(`Flow: ${activeFlow.toFixed(1)} m/s`, 10, 20);
            ctx.fillText(`ARF Power: ${activePower.toFixed(2)} kW`, 10, 35);
            ctx.fillText(`Cymatic Phase Mode (n: ${n}, m: ${m})`, 10, 50);
            
            // Render Live Telemetry Yield
            ctx.fillStyle = '#eab308';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`DREDGE YIELD: ${currentYieldCollected.toFixed(2)} μg`, 10, height - 15);
            
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
            <div style={{ background: '#0f172a', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Live Telemetry: Hull Cross-Section
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>TRAP ACTIVE</span>
                    </div>
                </div>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                    <canvas 
                        ref={canvasRef} 
                        style={{ width: '100%', height: '100%', display: 'block' }} 
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

                {/* Element Target */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Target Isotope Signature
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(TARGET_ELEMENTS).map(([symbol, el]) => (
                            <button
                                key={symbol}
                                onClick={() => setSelectedElement(symbol)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedElement === symbol ? el.color : '#e2e8f0'}`,
                                    background: selectedElement === symbol ? `${el.color}15` : '#fff',
                                    color: selectedElement === symbol ? el.color : '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Medium Selection */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Acoustic Medium
                    </label>
                    <select 
                        value={selectedMedium} 
                        onChange={(e) => setSelectedMedium(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
                    >
                        {Object.keys(FLUID_MEDIA).map(key => (
                            <option key={key} value={key}>{FLUID_MEDIA[key].name} (ρ: {FLUID_MEDIA[key].density})</option>
                        ))}
                    </select>
                </div>

                {/* Analytics Block */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gor'kov Factor (ΦG)</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{displayPhiG.toFixed(4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Wavelength (λ)</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{wavelengthMeters.toFixed(5)} m</span>
                    </div>
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '1rem 0' }}></div>
                    <div style={{ fontSize: '0.85rem', color: displayPhiG > 0 ? '#10b981' : '#ef4444', fontWeight: 600, lineHeight: 1.5 }}>
                        {displayPhiG > 0 
                            ? `Positive Contrast: ${element.name} atoms are dense enough to be forced into the trap nodes.` 
                            : `Negative/Low Contrast: Atoms will scatter.`}
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
        
        {/* PHYSICS EXPLANATION */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Real-World Physics: How It Works
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
                Ah, in the real world, this is driven by a phenomenon called <strong>Acoustic Agglomeration</strong> combined with <strong>Stokes&apos; Law</strong>!
                <br/><br/>
                Here is exactly how it works in a physical pipeline:
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Acoustic Trapping (Gor&apos;kov Potential):</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        The ultrasonic transducers create a standing wave inside the pipe. Because heavy elements like Gold (Au) are vastly denser than seawater and have a positive &quot;Acoustic Contrast Factor,&quot; the sound wave acts like an invisible broom, sweeping all the scattered nano-particles of gold into the exact center of the &quot;nodes&quot; (the quiet, low-pressure zones of the wave).
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #8b5cf6' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Flow Protection (Fluid Boundary Layers):</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        If heavy clumps just hit a flat floor, the rushing water would sweep them right out the exhaust. To solve this, the collection hoppers are recessed into the floor as V-shaped funnels. In fluid dynamics, when high-speed water in a pipe passes over a sharp recess or hole, it creates <strong>boundary layer separation</strong>. The fast-moving water essentially "skips" over the gap, bridging the opening. This leaves the water <i>inside</i> the recessed funnel perfectly still (a zero-velocity dead zone). 
                        <br/><br/>
                        Because the heavy gold clumps fall exactly over these dead zones, the moment they drop below the lip of the pipe floor into the funnel, they are completely shielded from the rushing water above and drop straight down into the collection chambers!
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #eab308' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Agglomeration (Clumping):</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Suddenly, millions of trace nano-particles that were spread out in the water are forced into the exact same microscopic space. They violently collide in these nodes. Because of physical collision and atomic forces (like Van der Waals forces), they start sticking together, growing from invisible nano-particles into larger, heavier flakes or &quot;flocs.&quot;
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Gravity Overcomes Levitation:</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        The acoustic wave has a maximum weight limit it can levitate. As the gold particles clump together, their mass grows exponentially (cubically). Eventually, the clump reaches a critical mass point where the Earth&apos;s downward gravity overcomes both the acoustic levitation force holding it up, and the drag of the flowing water pushing it forward.
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Sedimentation (The &quot;Fall&quot;):</h3>
                    <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Like a raindrop that finally gets too heavy for the cloud to hold, the agglomerated gold chunk instantly drops out of the acoustic standing wave and falls heavily to the bottom of the pipe relative to the flowing water.
                    </p>
                </div>
            </div>

            <p style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600, marginTop: '2rem', textAlign: 'center' }}>
                So, the sound waves don&apos;t just hold the gold—they force the gold to clump together until it&apos;s heavy enough to sink into your collection bed!
            </p>
        </div>
        </>
    );
};
