import React, { useRef, useEffect, useState } from 'react';

interface CalibrationVisualizerProps {
    activeFrequencies: number[];
    waveAmplitude: number;
    physicalMedium: 'AIR' | 'WATER' | 'METAL';
}

export const CalibrationVisualizer: React.FC<CalibrationVisualizerProps> = ({ 
    activeFrequencies,
    waveAmplitude,
    physicalMedium
}: CalibrationVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMasked, setIsMasked] = useState(false);
    const [viewMode, setViewMode] = useState<'GRAPH' | 'PARTICLE'>('PARTICLE');

    // Persistent PBD Particle Physics Engine
    // High-density particle count to fill complex inner resonant geometric nodes
    const numParticles = 15000;
    const R_sand = 0.002; // Slightly smaller sand grains for higher fidelity geometries
    const particleDataRef = useRef<Float32Array | null>(null); // [x, y, vx, vy]
    const predictedPosRef = useRef(new Float32Array(numParticles * 2));
    
    // 2D Spatial Hash Grid for O(n) collision lookups
    const cellSize = R_sand * 2.5;
    const gridW = Math.ceil(1.0 / cellSize);
    const gridH = Math.ceil(1.0 / cellSize);
    const numCells = gridW * gridH;
    const cellStartsRef = useRef(new Int32Array(numCells));
    const cellEntriesRef = useRef(new Int32Array(numParticles));

    // Initialize physical locations for the sand particles
    useEffect(() => {
        if (!particleDataRef.current) {
            particleDataRef.current = new Float32Array(numParticles * 4);
            const particles = particleDataRef.current;
            for (let i = 0; i < numParticles; i++) {
                particles[i * 4] = 0.02 + Math.random() * 0.96;     // px
                particles[i * 4 + 1] = 0.02 + Math.random() * 0.96; // py
                particles[i * 4 + 2] = 0; // vx
                particles[i * 4 + 3] = 0; // vy
            }
        }
    }, [numParticles]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.min(width, height) / 2 - 20;

            if (viewMode === 'PARTICLE') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(0, 0, width, height);

            // Background grid removed to isolate the 3D wave mesh

            const timeFloat = performance.now() * 0.001;
            const frequenciesToDraw = activeFrequencies.slice(0, 5);
            const simFreq = frequenciesToDraw.length > 0 ? frequenciesToDraw[0] : 0;
            
            // --- ANALYTICAL CHLADNI WAVE EQUATION ---
            // Generates true standing waves (nodes and antinodes) based on resonant frequency modes.
            // m and n represent the acoustic modal lines across the x and y axes.
            const getChladniZ = (nx: number, ny: number, freq: number, t: number) => {
                if (freq <= 0) return 0;
                
                // Map the raw Hz into physical modal integers (m, n)
                // This creates the geometric complexity of the standing wave
                const modeN = Math.floor(freq * 0.005) + 1;
                const modeM = Math.floor(freq * 0.008) + 1;
                
                // Chladni Plate Equation (eigenfunctions of the Laplacian on a square)
                // Z(x,y) = sin(n*pi*x)*sin(m*pi*y) + sin(m*pi*x)*sin(n*pi*y)
                const spatialPhase1 = Math.sin(modeN * Math.PI * nx) * Math.sin(modeM * Math.PI * ny);
                const spatialPhase2 = Math.sin(modeM * Math.PI * nx) * Math.sin(modeN * Math.PI * ny);
                
                // The standing wave amplitude breathing over time
                const standingWave = (spatialPhase1 + spatialPhase2) * Math.sin(t * freq * 0.1);
                return standingWave * waveAmplitude * 0.5;
            };

            // --- RENDER THE RESULTS ---
            
            // Shared geometry calculations
            const padding = 20;
            const plateSize = Math.min(width, height) - padding * 2;
            const plateLeft = width / 2 - plateSize / 2;
            const plateTop = height / 2 - plateSize / 2;
            
            if (viewMode === 'PARTICLE') {
                // Draw a solid, distinct square representing the physical 1'x1' metal plate
                ctx.fillStyle = '#f8fafc'; // Very light metallic silver
                ctx.fillRect(plateLeft, plateTop, plateSize, plateSize);
                
                // Add a structural bevel/border to the plate
                ctx.strokeStyle = '#cbd5e1'; // Darker metallic edge
                ctx.lineWidth = 4;
                ctx.strokeRect(plateLeft, plateTop, plateSize, plateSize);
                
                const particleData = particleDataRef.current;
                const predictedPos = predictedPosRef.current;
                const cellStarts = cellStartsRef.current;
                const cellEntries = cellEntriesRef.current;

                if (!particleData) return;

                // Physics Timestep Configuration
                const dt = 0.016; // 60fps simulation
                // Instead of a flat downward gravity, use a very subtle "dishing" gravity drawing sand towards the center
                // This prevents particles from migrating purely to the corners. We want them returning to inner nodes.
                const centerGravity = 0.4; 
                
                // === PBD PASS 1: INTEGRATE FORCES (Chladni Kinematics & Gravity) ===
                for (let i = 0; i < numParticles; i++) {
                    const offset = i * 4;
                    const px = particleData[offset];
                    const py = particleData[offset + 1];
                    let vx = particleData[offset + 2];
                    let vy = particleData[offset + 3];

                    // Gentle pull towards center (x=0.5, y=0.5)
                    vx += (0.5 - px) * centerGravity * dt;
                    vy += (0.5 - py) * centerGravity * dt;


                    if (simFreq > 0) {
                        // The sand sits ON the plate. We calculate the Chladni height at this exact (px, py) unit coordinate
                        const currentZ = getChladniZ(px, py, simFreq, timeFloat);
                        
                        // Look at the gradient (slope) of the wave underneath the sand to calculate lateral slide force
                        // We use a small epsilon to mathematically derive the local analytical gradient
                        const epsilon = 0.005;
                        const zRight = getChladniZ(px + epsilon, py, simFreq, timeFloat);
                        const zLeft = getChladniZ(px - epsilon, py, simFreq, timeFloat);
                        const zDown = getChladniZ(px, py + epsilon, simFreq, timeFloat);
                        const zUp = getChladniZ(px, py - epsilon, simFreq, timeFloat);
                        
                        // Calculate gradient of squared amplitude (energy). 
                        // This consistently creates a force vector pointing AWAY from vibrating antinodes and TOWARDS zero-energy nodes.
                        const gradX = (zRight * zRight) - (zLeft * zLeft);
                        const gradY = (zDown * zDown) - (zUp * zUp);
                        
                        // Acoustic Radiation Force: Sand is pushed down the energy gradient into the geometric nodes.
                        // We scale the force non-linearly to trap particles gently when they are close to a node.
                        // Tuned so that waveAmplitude = 1.0 provides a strong, stable lock without blowing past nodes.
                        const radiationForce = 50.0 * waveAmplitude;
                        
                        // Use exact analytical derivative direction (-grad)
                        vx -= (gradX / epsilon) * radiationForce * dt;
                        vy -= (gradY / epsilon) * radiationForce * dt;

                        // Add chaotic bouncing proportional to the absolute kinetic energy (height) of the plate
                        // This visually simulates the sand boiling on antinodes and prevents clustering in false points,
                        // forcing the sand to only settle permanently on the perfect (Z=0) nodal lines.
                        const kineticEnergy = Math.abs(currentZ);
                        
                        // If they are on a heavy vibration peak, they get kicked in a random direction
                        if (kineticEnergy > 0.05 * waveAmplitude) {
                            const jitterAngle = Math.random() * Math.PI * 2;
                            // Kick magnitude scales with how far up the wave they are
                            const jitterMag = kineticEnergy * 15.0;
                            vx += Math.cos(jitterAngle) * jitterMag * dt;
                            vy += Math.sin(jitterAngle) * jitterMag * dt;
                        } else {
                            // If they are resting purely in a node, apply strong friction so they stop sliding
                            vx *= 0.1;
                            vy *= 0.1;
                        }
                    }
                    
                    // Apply air resistance (Damping)
                    vx *= 0.85;
                    vy *= 0.85;
                    
                    // Simple Verlet Prediction Step
                    predictedPos[i * 2] = px + vx * dt;
                    predictedPos[i * 2 + 1] = py + vy * dt;
                }

                // === PBD PASS 2: SPATIAL HASH GRID CONSTRUCTION (O(N) Lookups) ===
                cellStarts.fill(-1);
                for (let i = 0; i < numParticles; i++) {
                    const px = predictedPos[i * 2];
                    const py = predictedPos[i * 2 + 1];
                    
                    if (isNaN(px) || isNaN(py)) continue;
                    
                    // Map [0, 1] bounds into the grid
                    const cx = Math.max(0, Math.min(gridW - 1, Math.floor(px / cellSize)));
                    const cy = Math.max(0, Math.min(gridH - 1, Math.floor(py / cellSize)));
                    const cIdx = cy * gridW + cx;

                    cellEntries[i] = cellStarts[cIdx];
                    cellStarts[cIdx] = i;
                }

                // === PBD PASS 3: DENSITY CONSTRAINT RESOLUTION (Solid Sand Collisions) ===
                const iterations = 3; // Solver iterations
                for (let iter = 0; iter < iterations; iter++) {
                    for (let i = 0; i < numParticles; i++) {
                        let px = predictedPos[i * 2];
                        let py = predictedPos[i * 2 + 1];

                        // Grid Collision
                        const cx = Math.floor(px / cellSize);
                        const cy = Math.floor(py / cellSize);
                        
                        if (cx >= 0 && cx < gridW && cy >= 0 && cy < gridH) {
                            for (let ny = Math.max(0, cy - 1); ny <= Math.min(gridH - 1, cy + 1); ny++) {
                                for (let nx = Math.max(0, cx - 1); nx <= Math.min(gridW - 1, cx + 1); nx++) {
                                    const nIdx = ny * gridW + nx;
                                    let j = cellStarts[nIdx];
                                    
                                    while (j !== -1) {
                                        if (j > i) {
                                            const pj_x = predictedPos[j * 2];
                                            const jy = predictedPos[j * 2 + 1];
                                            
                                            const dx = px - pj_x;
                                            const dy = py - jy;
                                            const distSq = dx*dx + dy*dy;
                                            const minDist = R_sand * 2;
                                            
                                                // Sand particles repel each other! This forces volume and thickness at the nodes.
                                                // We use a very soft resolution (0.1 instead of 0.5) to let sand pack densely into nodes
                                                // without creating massive outward explosion chains that blow everything to the edges.
                                                if (distSq > 0 && distSq < minDist*minDist) {
                                                    const dist = Math.sqrt(distSq);
                                                    const overlap = minDist - dist;
                                                    
                                                    const resolveDist = overlap * 0.1;
                                                    
                                                    const dirX = dx / dist;
                                                    const dirY = dy / dist;

                                                    px += dirX * resolveDist;
                                                    py += dirY * resolveDist;
                                                    predictedPos[j * 2] -= dirX * resolveDist;
                                                    predictedPos[j * 2 + 1] -= dirY * resolveDist;
                                                }
                                        }
                                        j = cellEntries[j];
                                    }
                                }
                            }
                        }

                        // Perfect Container Bounds [0, 1] square plate
                        if (px < R_sand) px = R_sand;
                        if (px > 1.0 - R_sand) px = 1.0 - R_sand;
                        if (py < R_sand) py = R_sand;
                        if (py > 1.0 - R_sand) py = 1.0 - R_sand;
                        
                        predictedPos[i * 2] = px;
                        predictedPos[i * 2 + 1] = py;
                    }
                }

                // === PBD PASS 4: APPLY KINEMATICS & RENDER ===
                ctx.fillStyle = '#1e293b'; 
                for (let i = 0; i < numParticles; i++) {
                    const offset = i * 4;
                    const px = predictedPos[i * 2];
                    const py = predictedPos[i * 2 + 1];
                    
                    // Finalize velocity based on where PBD pushed it
                    let calcVx = (px - particleData[offset]) / dt;
                    let calcVy = (py - particleData[offset + 1]) / dt;
                    
                    // Boundary bouncing reflection mapping (Wall friction)
                    if (px <= R_sand || px >= (1.0 - R_sand)) { calcVx = -particleData[offset+2] * 0.3; }
                    if (py <= R_sand || py >= (1.0 - R_sand)) { calcVy = -particleData[offset+3] * 0.3; }

                    particleData[offset] = px;
                    particleData[offset + 1] = py;
                    particleData[offset + 2] = calcVx;
                    particleData[offset + 3] = calcVy;
                    
                    // Render Particle
                    const screenYUnbound = plateTop + py * plateSize;
                    const isVisible = !isMasked || Math.abs(screenYUnbound - centerY) <= 30;

                    if (isVisible) {
                        const screenX = plateLeft + px * plateSize;
                        const screenY = plateTop + py * plateSize;
                        
                        ctx.fillStyle = frequenciesToDraw.length > 0 ? '#6366f1' : '#1e293b';
                        // Draw tangible physical sand radius relative to visual width
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, R_sand * plateSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

            } else {
                // GRAPH MODE 
                frequenciesToDraw.forEach(simFreq => {
                    ctx.strokeStyle = '#6366f1'; // Indigo color primarily
                    ctx.lineWidth = 1.5;

                    const speedOfSoundMap = {
                        'AIR': 343,     
                        'WATER': 1480,  
                        'METAL': 5000   
                    };
                    const waveVelocity = speedOfSoundMap[physicalMedium as keyof typeof speedOfSoundMap];
                    
                    const dynamicSimFreq = simFreq;
                    
                    const wavelength = waveVelocity / dynamicSimFreq;
                    const k = (2 * Math.PI) / wavelength;
                    
                    // Create a pseudo-3D cartesian wireframe of the square plate
                    // Phase oscillation is mapped radially inside the rendering loops
                    
                    const gridRes = 50; 
                    const startX = centerX - maxRadius;
                    const startY = centerY - maxRadius;
                    const plateSize = maxRadius * 2;

                    // Draw Horizontal Lines
                    for (let i = 0; i <= gridRes; i++) {
                        ctx.beginPath();
                        for (let j = 0; j <= gridRes * 2; j++) {
                            const pxGraph = j / (gridRes * 2);
                            const pyGraph = i / gridRes;
                            
                            // True Physical Chladni Plate
                            // The actual instantaneous geometric height at any point on the plate is read directly
                            // from the analytical Chladni equation
                            
                            const instantaneousZ = getChladniZ(pxGraph, pyGraph, simFreq, timeFloat);
                            // Scale visually for the 3D projection, removing the 'timeFloat' sine scale from the FDTD
                            const warpY = instantaneousZ * 60;
                            
                            const x = startX + pxGraph * plateSize;
                            const y = startY + pyGraph * plateSize - warpY;
                            
                            if (isMasked && Math.abs(y - centerY) > 30) {
                                if (j === 0) ctx.moveTo(x, startY + pyGraph * plateSize);
                                else ctx.lineTo(x, startY + pyGraph * plateSize);
                                continue;
                            }
                            
                            if (j === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }

                    // Draw Vertical Lines
                    for (let j = 0; j <= gridRes; j++) {
                        ctx.beginPath();
                        for (let i = 0; i <= gridRes * 2; i++) {
                            const pxGraph = j / gridRes;
                            const pyGraph = i / (gridRes * 2);

                            // True Physical Chladni Plate
                            const instantaneousZ = getChladniZ(pxGraph, pyGraph, simFreq, timeFloat);
                            const warpY = instantaneousZ * 60;
                            
                            const x = startX + pxGraph * plateSize;
                            const y = startY + pyGraph * plateSize - warpY;
                            
                            if (isMasked && Math.abs(y - centerY) > 30) {
                                if (i === 0) ctx.moveTo(x, startY + pyGraph * plateSize);
                                else ctx.lineTo(x, startY + pyGraph * plateSize);
                                continue;
                            }
                            
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1.0;
                });
            }

            // Draw center point
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
            ctx.fill();

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [activeFrequencies, viewMode, waveAmplitude, physicalMedium, isMasked]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={800} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    clipPath: isMasked ? 'polygon(0 calc(50% - 25px), 100% calc(50% - 25px), 100% calc(50% + 25px), 0 calc(50% + 25px))' : undefined
                }}
            />
            {/* Overlay for pure aesthetics */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                    FREQUENCY VISUALIZER
                </span>
                {activeFrequencies.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {activeFrequencies.slice(0, 5).map(freq => (
                            <div key={freq} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: `1px solid #6366f140`, backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontWeight: 800, color: '#6366f1', fontSize: '0.9rem' }}>{freq}Hz</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>RAW FREQ</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => setViewMode('GRAPH')}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: viewMode === 'GRAPH' ? '#3b82f6' : '#f8fafc', 
                        color: viewMode === 'GRAPH' ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: viewMode === 'GRAPH' ? '#2563eb' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: viewMode === 'GRAPH' ? '#fff' : '#cbd5e1' }}></div>
                    GRAPH SIMULATION
                </button>
                <button 
                    onClick={() => setViewMode('PARTICLE')}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: viewMode === 'PARTICLE' ? '#a855f7' : '#f8fafc', 
                        color: viewMode === 'PARTICLE' ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: viewMode === 'PARTICLE' ? '#9333ea' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: viewMode === 'PARTICLE' ? '#fff' : '#cbd5e1' }}></div>
                    PARTICLE SIMULATION
                </button>
                <button 
                    onClick={() => setIsMasked(!isMasked)}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: isMasked ? '#3b82f6' : '#f1f5f9', 
                        color: isMasked ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: isMasked ? '#2563eb' : '#cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isMasked ? '#fff' : '#cbd5e1' }}></div>
                    WAVEFORM MASK
                </button>
            </div>
        </div>
    );
};
