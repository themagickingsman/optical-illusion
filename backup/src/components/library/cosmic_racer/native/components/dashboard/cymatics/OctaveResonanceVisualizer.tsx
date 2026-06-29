import React, { useRef, useEffect, useState } from 'react';

import { ELEMENTS, CATEGORY_COLORS, calculateElementalFrequency, formatFrequency, PeriodicElement } from '../../../state/data/elements_data';

export interface CosmicOctave {
    id: number;
    name: string;
    levelRange: string;
    baseFrequency: number;
    color: string;
    description: string;
}

export const COSMIC_OCTAVES: CosmicOctave[] = [
    { id: 1, name: 'OCTAVE 1 (PRIMORDIAL VOID)', levelRange: 'Level 1-8', baseFrequency: 0.1, color: '#0f172a', description: 'Universal Base Frequency. The slowest oscillation.' },
    { id: 2, name: 'OCTAVE 2 (QUANTUM REALM)', levelRange: 'Level 9-16', baseFrequency: 0.2, color: '#312e81', description: 'Galactic superstructures and deep resonance.' },
    { id: 3, name: 'OCTAVE 3 (SUBATOMIC FIELD)', levelRange: 'Level 17-24', baseFrequency: 0.4, color: '#4c1d95', description: 'Stellar lifecycles and cosmic radiation.' },
    { id: 4, name: 'OCTAVE 4 (ATOMIC REALM)', levelRange: 'Level 25-32', baseFrequency: 0.8, color: '#701a75', description: 'Planetary orbital resonance and gravity wells.' },
    { id: 5, name: 'OCTAVE 5 (ELEMENTAL SYSTEMS)', levelRange: 'Level 33-40', baseFrequency: 1.6, color: '#be123c', description: 'Global ecosystem pulsing and atmospheric cycles.' },
    { id: 6, name: 'OCTAVE 6 (MOLECULAR SYSTEMS)', levelRange: 'Level 41-48', baseFrequency: 3.2, color: '#c2410c', description: 'Cellular division and organism lifecycle.' },
    { id: 7, name: 'OCTAVE 7 (GENETIC SYSTEMS)', levelRange: 'Level 49-56', baseFrequency: 6.4, color: '#b45309', description: 'Chemical bonding and molecular vibration.' },
    { id: 8, name: 'OCTAVE 8 (CELLULAR SYSTEMS)', levelRange: 'Level 57-64', baseFrequency: 12.8, color: '#0f766e', description: 'Atomic electron spin and structural coherence.' },
    { id: 9, name: 'OCTAVE 9 (BIOLOGICAL SYSTEMS)', levelRange: 'Level 65-72', baseFrequency: 25.6, color: '#0369a1', description: 'Quantum entanglement and Planck foam.' },
    { id: 10, name: 'OCTAVE 10 (ECOLOGICAL SYSTEMS)', levelRange: 'Level 73-80', baseFrequency: 51.2, color: '#2563eb', description: 'Geocentric orbiters, lunar and satellite resonance.' },
    { id: 11, name: 'OCTAVE 11 (PLANETARY REALMS)', levelRange: 'Level 81-88', baseFrequency: 102.4, color: '#eab308', description: 'Solar System structural anchor.' },
    { id: 12, name: 'OCTAVE 12 (SOLAR SYSTEMS)', levelRange: 'Level 89-96', baseFrequency: 204.8, color: '#059669', description: 'The Milky Way Zero Point and grand opposition.' },
    { id: 13, name: 'OCTAVE 13 (GALACTIC REALMS)', levelRange: 'Level 97-104', baseFrequency: 409.6, color: '#14b8a6', description: 'Deep galactic phasing networks.' },
    { id: 14, name: 'OCTAVE 14 (UNIVERSAL SYSTEMS)', levelRange: 'Level 105-112', baseFrequency: 819.2, color: '#10b981', description: 'Supercluster gravitational waves.' },
    { id: 15, name: 'OCTAVE 15 (METAVERSAL SOURCE)', levelRange: 'Level 113-120', baseFrequency: 1638.4, color: '#6366f1', description: 'Theoretical Harmonic Lock. The cosmic boundary.' },
];

interface OctaveResonanceVisualizerProps {
    activeOctaves: number[]; // Array of active octave IDs
    animationMode: 'STANDING' | 'FREQUENCY_PATTERNS';
    setAnimationMode: React.Dispatch<React.SetStateAction<'STANDING' | 'FREQUENCY_PATTERNS'>>;
    activeElements: number[];
    waveAmplitude: number;
    physicalMedium: 'AIR' | 'WATER' | 'METAL';
}

export const OctaveResonanceVisualizer: React.FC<OctaveResonanceVisualizerProps> = ({ 
    activeOctaves,
    animationMode,
    setAnimationMode,
    activeElements,
    waveAmplitude,
    physicalMedium
}: OctaveResonanceVisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMasked, setIsMasked] = useState(false);
    const [viewMode, setViewMode] = useState<'GRAPH' | 'PARTICLE'>('GRAPH');

    // Particle state for Chladni-style simulation
    const particleCount = 25000;
    const particlesRef = useRef(new Float32Array(particleCount * 4)); // [px, py, vx, vy]

    useEffect(() => {
        const particles = particlesRef.current;
        for (let i = 0; i < particleCount; i++) {
            const r = 0.48 * Math.sqrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            particles[i * 4] = 0.5 + r * Math.cos(theta);     // px
            particles[i * 4 + 1] = 0.5 + r * Math.sin(theta); // py
            particles[i * 4 + 2] = 0; // vx
            particles[i * 4 + 3] = 0; // vy
        }
    }, [particleCount]);

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

            // Clear background (light theme)
            if (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE') {
                // Fade effect for particles to leave trails
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            } else {
                ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(0, 0, width, height);

            // Draw grid logic (only for lines graph)
            if (!(animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE')) {
                ctx.strokeStyle = '#f1f5f9';
                ctx.lineWidth = 1;
                for (let i = 0; i < width; i += 40) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
                }
            }

            // Draw active octaves or elements
            const time = performance.now() * 0.001;
            const maxRadius = Math.min(width, height) / 2 - 20;
            const TOTAL_OCTAVES = 15;

            // --- ANALYTICAL CHLADNI WAVE EQUATION ---
            const getChladniZ = (nx: number, ny: number, freq: number, t: number) => {
                if (freq <= 0) return 0;
                const modeN = Math.floor(freq * 0.005) + 1;
                const modeM = Math.floor(freq * 0.008) + 1;
                const spatialPhase1 = Math.sin(modeN * Math.PI * nx) * Math.sin(modeM * Math.PI * ny);
                const spatialPhase2 = Math.sin(modeM * Math.PI * nx) * Math.sin(modeN * Math.PI * ny);
                const standingWave = (spatialPhase1 + spatialPhase2) * Math.sin(t * freq * 0.1);
                return standingWave * waveAmplitude * 0.5;
            };

            if (animationMode === 'STANDING') {
                const octavesToDraw = COSMIC_OCTAVES.filter(o => activeOctaves.includes(o.id));
                octavesToDraw.forEach(octave => {
                    const baseRadius = (TOTAL_OCTAVES + 1 - octave.id) * (maxRadius / TOTAL_OCTAVES);
                    
                    ctx.beginPath();
                    ctx.strokeStyle = octave.color;
                    ctx.lineWidth = 1.5;
                    
                    const numPoints = 800;
                    const harmonicMultiplier = octave.id * 1.618;

                    for (let i = 0; i <= numPoints; i++) {
                        const angle = (i / numPoints) * Math.PI * 2;
                        const ripple = Math.sin(angle * Math.floor(harmonicMultiplier * 4) + time * octave.id * 0.5) 
                                       * 6 * (TOTAL_OCTAVES + 1 - octave.id) / TOTAL_OCTAVES;
                        const r = baseRadius + ripple;
                        const x = centerX + Math.cos(angle) * r;
                        const y = centerY + Math.sin(angle) * r;
                        
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                });
            } else {
                // FREQUENCY_PATTERNS MODE
                // Performance Culling: Cap max active rendered elements to 5 to protect framerate
                const elementsToDraw = ELEMENTS.filter(e => activeElements.includes(e.number)).slice(0, 5);
                
                if (viewMode === 'PARTICLE') {
                    // --- PARTICLE SIMULATION (Chladni Logic) ---
                    const particles = particlesRef.current;
                    ctx.fillStyle = '#1e293b'; 

                    // Default variables if no elements selected
                    const compositeSpeed = 0.5;

                    for (let i = 0; i < particleCount; i++) {
                        let px = particles[i * 4];
                        let py = particles[i * 4 + 1];
                        let vx = particles[i * 4 + 2];
                        let vy = particles[i * 4 + 3];
                        
                        // Performance Culling: Skip heavy wave computation if particle is outside the 50px Masked viewport
                        const screenYUnbound = py * height;
                        const isVisible = !isMasked || Math.abs(screenYUnbound - centerY) <= 30;
                        
                        if (isVisible) {
                            if (elementsToDraw.length > 0) {
                                const primaryElement = elementsToDraw[0];
                                const elementFreqHz = calculateElementalFrequency(primaryElement);
                                let simFreq = elementFreqHz;
                                while (simFreq > 6000) {
                                    simFreq /= 2.0;
                                }
                                
                                const timeFloat = performance.now() * 0.001;
                                const dt = 0.016; 
                                const centerGravity = 0.4;
                                
                                // Gentle pull towards center
                                vx += (0.5 - px) * centerGravity * dt;
                                vy += (0.5 - py) * centerGravity * dt;

                                const currentZ = getChladniZ(px, py, simFreq, timeFloat);
                                
                                const epsilon = 0.005;
                                const zRight = getChladniZ(px + epsilon, py, simFreq, timeFloat);
                                const zLeft = getChladniZ(px - epsilon, py, simFreq, timeFloat);
                                const zDown = getChladniZ(px, py + epsilon, simFreq, timeFloat);
                                const zUp = getChladniZ(px, py - epsilon, simFreq, timeFloat);
                                
                                const gradX = (zRight * zRight) - (zLeft * zLeft);
                                const gradY = (zDown * zDown) - (zUp * zUp);
                                
                                const radiationForce = 50.0 * waveAmplitude;
                                
                                vx -= (gradX / epsilon) * radiationForce * dt;
                                vy -= (gradY / epsilon) * radiationForce * dt;

                                const kineticEnergy = Math.abs(currentZ);
                                
                                if (kineticEnergy > 0.05 * waveAmplitude) {
                                    const jitterAngle = Math.random() * Math.PI * 2;
                                    const jitterMag = kineticEnergy * 15.0;
                                    vx += Math.cos(jitterAngle) * jitterMag * dt;
                                    vy += Math.sin(jitterAngle) * jitterMag * dt;
                                } else {
                                    vx *= 0.1;
                                    vy *= 0.1;
                                }
                                
                                vx *= 0.85;
                                vy *= 0.85;
                                
                                px += vx * dt;
                                py += vy * dt;
                            }

                            // Keep inside the circular bounds
                            const dxCenter = px - 0.5;
                            const dyCenter = py - 0.5;
                            const dist = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
                            // If particles get pushed off the plate, respawn them back on the plate
                            // We also add a tiny 0.1% chance per frame to randomly respawn to keep the visual density flowing
                            if (dist > 0.48 || Math.random() < 0.001) { 
                                const randomR = 0.48 * Math.sqrt(Math.random());
                                const randomTheta = Math.random() * 2 * Math.PI;
                                px = 0.5 + randomR * Math.cos(randomTheta);
                                py = 0.5 + randomR * Math.sin(randomTheta);
                                vx = 0;
                                vy = 0;
                            }
                        } // End visibility cull block

                        particles[i * 4] = px;
                        particles[i * 4 + 1] = py;
                        particles[i * 4 + 2] = vx;
                        particles[i * 4 + 3] = vy;

                        // Draw Particle if visible
                        if (isVisible) {
                            const screenX = px * width;
                            const screenY = py * height;
                            
                            // Use the dominant element's color to shade the particles, defaulting to slate
                            ctx.fillStyle = elementsToDraw.length > 0 ? (CATEGORY_COLORS[elementsToDraw[0].category]?.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/)?.[0] || '#1e293b') : '#1e293b';
                            ctx.fillRect(screenX, screenY, 1.5, 1.5);
                        }
                    }

                    // Draw circular bounding plate
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(width/2, height/2, Math.min(width, height)/2 - 10, 0, Math.PI * 2);
                    ctx.stroke();

                } else {
                    // --- GRAPH SIMULATION (Chladni Wave Mesh) ---
                    elementsToDraw.forEach(element => {
                        const rawColor = CATEGORY_COLORS[element.category] || '#3b82f6';
                        const rgbMatch = rawColor.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/);
                        ctx.strokeStyle = rgbMatch ? rgbMatch[0] : '#3b82f6';
                        ctx.lineWidth = 1.5;

                        const elementFreqHz = calculateElementalFrequency(element);
                        let simFreq = elementFreqHz;
                        while (simFreq > 6000) {
                            simFreq /= 2.0;
                        }
                        
                        const timeFloat = performance.now() * 0.001;

                        const gridRes = 80; 
                        const startX = centerX - maxRadius;
                        const startY = centerY - maxRadius;
                        const plateSize = maxRadius * 2;

                        // Draw Horizontal Lines
                        for (let i = 0; i <= gridRes; i++) {
                            ctx.beginPath();
                            for (let j = 0; j <= gridRes; j++) {
                                const pxGraph = j / gridRes;
                                const pyGraph = i / gridRes;
                                
                                // Only draw within the circle
                                const dx = pxGraph - 0.5;
                                const dy = pyGraph - 0.5;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                
                                if (dist > 0.5) {
                                    // Move to next point but don't draw
                                    const x = startX + pxGraph * plateSize;
                                    const y = startY + pyGraph * plateSize;
                                    if (j === 0) ctx.moveTo(x, y);
                                    else ctx.moveTo(x, y);
                                    continue;
                                }

                                const instantaneousZ = getChladniZ(pxGraph, pyGraph, simFreq, timeFloat);
                                const warpY = instantaneousZ * 20 * waveAmplitude;
                                
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
                            for (let i = 0; i <= gridRes; i++) {
                                const pxGraph = j / gridRes;
                                const pyGraph = i / gridRes;
                                
                                const dx = pxGraph - 0.5;
                                const dy = pyGraph - 0.5;
                                const dist = Math.sqrt(dx * dx + dy * dy);
                                
                                if (dist > 0.5) {
                                    const x = startX + pxGraph * plateSize;
                                    const y = startY + pyGraph * plateSize;
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.moveTo(x, y);
                                    continue;
                                }

                                const instantaneousZ = getChladniZ(pxGraph, pyGraph, simFreq, timeFloat);
                                const warpY = instantaneousZ * 20 * waveAmplitude;
                                
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
                    });
                }
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
    }, [activeOctaves, animationMode, activeElements, viewMode, waveAmplitude, physicalMedium, particleCount, isMasked]);

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
                    COMPASS OCTAVE VISUALIZER
                </span>
                {animationMode === 'FREQUENCY_PATTERNS' && activeElements.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {ELEMENTS.filter(e => activeElements.includes(e.number)).slice(0, 5).map(element => {
                            const domColor = CATEGORY_COLORS[element.category]?.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/)?.[0] || '#1e293b';
                            return (
                                <div key={element.number} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: `1px solid ${domColor}40`, backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontWeight: 800, color: domColor, fontSize: '0.9rem' }}>{element.symbol}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>{formatFrequency(calculateElementalFrequency(element))}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => setAnimationMode('STANDING')}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: animationMode === 'STANDING' ? '#fbbf24' : '#f8fafc', 
                        color: animationMode === 'STANDING' ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: animationMode === 'STANDING' ? '#f59e0b' : '#cbd5e1',
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
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: animationMode === 'STANDING' ? '#fff' : '#cbd5e1' }}></div>
                    STATIC OCTAVES
                </button>
                <button 
                    onClick={() => { setAnimationMode('FREQUENCY_PATTERNS'); setViewMode('GRAPH'); }}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'GRAPH') ? '#3b82f6' : '#f8fafc', 
                        color: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'GRAPH') ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'GRAPH') ? '#2563eb' : '#cbd5e1',
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
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'GRAPH') ? '#fff' : '#cbd5e1' }}></div>
                    GRAPH SIMULATION
                </button>
                <button 
                    onClick={() => { setAnimationMode('FREQUENCY_PATTERNS'); setViewMode('PARTICLE'); }}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        borderRadius: '99px', 
                        background: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE') ? '#a855f7' : '#f8fafc', 
                        color: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE') ? '#fff' : '#64748b',
                        border: '1px solid',
                        borderColor: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE') ? '#9333ea' : '#cbd5e1',
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
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (animationMode === 'FREQUENCY_PATTERNS' && viewMode === 'PARTICLE') ? '#fff' : '#cbd5e1' }}></div>
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
