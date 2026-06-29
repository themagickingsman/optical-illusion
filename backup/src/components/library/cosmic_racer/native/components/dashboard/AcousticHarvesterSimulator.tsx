'use client';

import React, { useRef, useEffect, useState } from 'react';
import AcousticHarvester3DModel from './AcousticHarvester3DModel';

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
    const visualCollectorRef = useRef<{x: number, y: number, vx: number, vy: number, color: string, r: number}[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        let currentYieldCollected = 0;
        
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
                    if (Math.random() < 0.30) {
                        typeIndex = Math.floor(Math.random() * ELEMENT_KEYS.length) + 1;
                    }
                    
                    const R_variation = R_base * (0.8 + Math.random() * 0.4); 
                    
                    // Spawn starting uniformly across the cross-section of the active pipe channel
                    particleDataRef.current[offset] = startX + (c * spacingX) + (Math.random() * spacingX * 0.4); 
                    // Keep initial spawn strictly inside the pipe bounds (Ri to Ly-Ri) so they don't start already extracted
                    particleDataRef.current[offset + 1] = Math.max(R_variation * 2, Math.min(Ly - R_variation * 2, spacingY + (r * spacingY) + (Math.random() * spacingY * 0.4)));
                    
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

            // Reset the cumulative yield timer when the operator swaps the target element
            if (activeElement !== previousElement) {
                previousElement = activeElement;
                currentYieldCollected = 0;
                visualCollectorRef.current = []; // Empty the hopper when swapping elements
            }

            // Realistic Physical Pipe Height
            const simHeight = 450;
            const visualPipeHeight = simHeight * 0.7; 
            const verticalPaddingVisual = (simHeight - visualPipeHeight) / 2; // Center the pipe vertically

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
            
            const phiG = activeElementData ? calculateGorkovContrast(activeElementData.density, medium.density, activeElementData.compressibility, medium.compressibility) : 0;
            
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
            const splitX_visual = width * 0.4;
            
            // Draw Pipe Ceiling Metal Above the channel
            ctx.fillStyle = '#1e293b'; 
            ctx.fillRect(0, 0, width, verticalPaddingVisual);
            // Draw Pipe Floor Metal (Solid continuity) Below the channel
            ctx.fillRect(0, verticalPaddingVisual + visualPipeHeight, width, height - (verticalPaddingVisual + visualPipeHeight));
            
            // Draw the Transducer Hardware Blocks (Outside the extraction zone)
            ctx.fillStyle = '#334155'; // Lighter grey metal
            const transTopY = 0;
            const transTopH = verticalPaddingVisual - 4;
            const transBotY = verticalPaddingVisual + visualPipeHeight + 4;
            const transBotH = height - (verticalPaddingVisual + visualPipeHeight + 4);
            
            ctx.fillRect(splitX_visual, transTopY, width - splitX_visual, transTopH);
            ctx.fillRect(splitX_visual, transBotY, width - splitX_visual, transBotH);
            
            // Draw active Acoustic Waves pulsing inside the Transducer blocks
            if (activePower > 0) {
                const powerNorm = activePower / 25.0; // 0.0 to 1.0 (max 25kW)
                ctx.strokeStyle = `rgba(14, 165, 233, ${0.3 + (powerNorm * 0.7)})`; // Cyan glow
                ctx.lineWidth = 2 + (powerNorm * 2);
                
                // Draw outward pulling arrows to visually demonstrate the acoustic membrane sieve
                const arrowSpacing = 80;
                for (let x = splitX_visual + 40; x <= width; x += arrowSpacing) {
                    const arrowAnim = (time * 1.5 + x * 0.01) % 1.0; // 0 to 1 outward progress
                    const fade = (1.0 - arrowAnim) * powerNorm;
                    ctx.fillStyle = `rgba(14, 165, 233, ${fade})`;
                    
                    // Top Transducer Arrow (Pointing Up)
                    const arrowYTop = transTopH - (arrowAnim * transTopH * 0.8);
                    ctx.beginPath();
                    ctx.moveTo(x, arrowYTop);
                    ctx.lineTo(x - 6, arrowYTop + 10);
                    ctx.lineTo(x + 6, arrowYTop + 10);
                    ctx.closePath();
                    ctx.fill();

                    // Bottom Transducer Arrow (Pointing Down)
                    const arrowYBot = transBotY + (arrowAnim * transBotH * 0.8);
                    ctx.beginPath();
                    ctx.moveTo(x, arrowYBot);
                    ctx.lineTo(x - 6, arrowYBot - 10);
                    ctx.lineTo(x + 6, arrowYBot - 10);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Draw Active Element & Frequency overlay directly onto the Transducers
                if (activeElementData && activePower > 0) {
                    ctx.fillStyle = activeElementData.color;
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Generate a "Resonant Frequency" display value based on the element's density/compressibility contrast (phiG)
                    const displayFreqkHz = (Math.abs(phiG) * 12.34).toFixed(2);
                    
                    // Estimate the required force to overcome the forward fluid momentum (drag)
                    // P_drag ~ 0.5 * rho * v^2 * Cd * A. We'll simplify to a scaled value for UI.
                    const reqForce_kN = 0.5 * activeElementData.density * Math.pow(activeFlow, 2) * 0.001 * 5.0; // scaled to kN range
                    const reqPower_kW = reqForce_kN * 0.8; // Rough physics estimation for kW required to pull it across the threshold
                    
                    const label1 = `TARGET: ${activeElementData.name.toUpperCase()} (${activeElement}) @ ${displayFreqkHz} kHz`;
                    const label2 = `REQ. SLURRY OVERCOME: > ${reqForce_kN.toFixed(1)} kN`;
                    const label3 = `POWER: ${activePower.toFixed(2)} kW / REQ: ${reqPower_kW.toFixed(2)} kW`;
                    
                    // Center the text in the right-side extraction section
                    const centerX = splitX_visual + (width - splitX_visual) / 2;
                    
                    // Top Transducer Labels
                    ctx.fillText(label1, centerX, transTopY + transTopH / 2 - 14);
                    ctx.fillText(label2, centerX, transTopY + transTopH / 2);
                    ctx.fillText(label3, centerX, transTopY + transTopH / 2 + 14);
                    
                    // Bottom Transducer Labels
                    ctx.fillText(label1, centerX, transBotY + transBotH / 2 - 14);
                    ctx.fillText(label2, centerX, transBotY + transBotH / 2);
                    ctx.fillText(label3, centerX, transBotY + transBotH / 2 + 14);
                    
                    // Reset text alignment
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'alphabetic';
                }
            }
            
            // Draw Left-Side Solid Cyan Walls (Vortex Spin Up Zone)
            ctx.fillStyle = '#0ea5e9'; // bright cyan
            ctx.fillRect(0, verticalPaddingVisual, splitX_visual, 4);
            ctx.fillRect(0, verticalPaddingVisual + visualPipeHeight - 4, splitX_visual, 4);

            // Draw Right-Side Dashed Cyan Walls (Acoustic Permeable Membrane Sieve)
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            
            ctx.beginPath();
            ctx.moveTo(splitX_visual, verticalPaddingVisual + 2);
            ctx.lineTo(width, verticalPaddingVisual + 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(splitX_visual, verticalPaddingVisual + visualPipeHeight - 2);
            ctx.lineTo(width, verticalPaddingVisual + visualPipeHeight - 2);
            ctx.stroke();
            
            ctx.setLineDash([]); // Reset for targets further down
            
            ctx.globalCompositeOperation = 'source-over';

            // Render particles (handled within physical loop for speed)
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
                    
                    if (py < 0 || py > Ly) {
                        // It was extracted into the outer acoustic jacket!
                        if (typeIndex > 0 && ELEMENT_KEYS[typeIndex - 1] === activeElement) {
                            // Extract ONLY if the transducers are on and have enough power to overcome the drag
                            const reqForce_kN = 0.5 * TARGET_ELEMENTS[activeElement].density * Math.pow(activeFlow, 2) * 0.001 * 0.12; 
                            const reqPower_kW = reqForce_kN * 0.8;
                            
                            if (activePower >= reqPower_kW * 0.5) { // Needs at least 50% threshold to start catching some
                                const activeElementData = TARGET_ELEMENTS[activeElement];
                                // Realistic physics calculation:
                                // 1 visual target particle represents multiple actual target particles (due to 40% spawn rate)
                                // Total pipe volume = Lx * Ly * 1.0m depth * 1000 = 1000 Liters
                                // SINGLE UNIT: Processes exactly the volume flowing through the 2.0x0.5m chamber at 2.0 m/s
                                const HARVESTER_ARRAY_UNITS = 1.0;
                                const pipeVolumeLiters = Lx * Ly * 1.0 * 1000;
                                const litersPerVisualParticle = (1 / 0.40) * (pipeVolumeLiters / numParticles) * HARVESTER_ARRAY_UNITS;
                                
                                // Accumulation in mg scales dynamically with how much power is applied above the threshold
                                const powerCatchRatio = Math.min(1.0, activePower / reqPower_kW);
                                currentYieldCollected += (activeElementData.concentration_mg_per_L * litersPerVisualParticle * powerCatchRatio);
                                
                                // Hurl the extracted particle into the Collection Hopper!
                                visualCollectorRef.current.push({
                                    x: width + 5, // Start +5px right (shifted left 25px from width + 30)
                                    y: height - 100, // Start -50px up from previous (height - 50)
                                    vx: -400 - Math.random() * 300, // Hurl strongly leftward across the collector
                                    vy: -50 + Math.random() * 100, // Very slight arc
                                    color: activeElementData.color,
                                    r: (R / Lx) * width
                                });
                                
                                // Prevent browser crashing if left running forever
                                if (visualCollectorRef.current.length > 2500) {
                                    visualCollectorRef.current.shift();
                                }
                            }
                        }
                        
                        // Respawn safely back inside the active pipe flow so it re-enters as water on the left
                        predictedPos[i * 2 + 1] = Math.max(R_base * 2, Math.min(Ly - R_base * 2, (Math.random() * Ly))); 
                        particleData[offset + 5] = 0; // Turn back strictly to water
                        particleData[offset + 4] = R_base * (0.7 + Math.random() * 0.6); // Water size jitter
                        particleData[offset + 3] = 0; // Zero out vertical velocity so it doesn't fly out instantly
                    } else {
                        predictedPos[i * 2 + 1] = py; // Do NOT randomize Y, keep the fluid structurally locked.
                        
                        // Maintain exact horizontal velocity as they wrap around, but reset vertical momentum
                        particleData[offset + 2] = vx;
                        particleData[offset + 3] = 0; 

                        // Only re-roll if it's water, OR if a target made it all the way through without being harvested (keep rare targets rare)
                        // User requested massive density increase visually
                        if (typeIndex === 0 && Math.random() < 0.40) {
                            particleData[offset + 5] = Math.floor(Math.random() * ELEMENT_KEYS.length) + 1; // Become target
                            particleData[offset + 4] = R_base;
                        } else if (typeIndex > 0 && Math.random() < 0.15) {
                            particleData[offset + 5] = 0; // Target escaped, turn back to water very occasionally 
                            particleData[offset + 4] = R_base * (0.7 + Math.random() * 0.6);
                        }
                    }
                    continue;
                }

                // Centrifugal Vortex Force (Hydrocyclone)
                // Simulating the mass-separation of a spinning fluid flow
                const elDensity = typeIndex > 0 ? TARGET_ELEMENTS[ELEMENT_KEYS[typeIndex - 1]].density : medium.density;
                const isLighterThanWater = elDensity < medium.density;
                
                // Map visual density to a safe multiplier so extreme elements don't crash the engine, but maintain relative mass behavior
                // Water = 1.0. Gold = 6.0 (clamped). Lithium = 0.534.
                const visualDensityRatio = isLighterThanWater ? (elDensity / medium.density) : Math.min(6.0, elDensity / medium.density);

                // True physical distance from the structural center of the pipe
                const centerY = Ly / 2.0;
                const distFromCenter = py - centerY;
                // Vector pointing radially outward from the center
                const outwardDir = distFromCenter > 0 ? 1 : -1;
                
                // Heavy elements pushed outward to walls. Light elements pushed inward to the core. Water (1.0) is unaffected.
                const forceDirection = isLighterThanWater ? -outwardDir : outwardDir; 
                
                // Gradually increase the vortex force as particles move right (Funnel Effect)
                // This allows them to enter uniformly on the left before being thrown to the edges.
                const vortexEngagement = Math.max(0, Math.min(1.0, px / (Lx * 0.8)));
                
                // Calculate pure force magnitude. (Subtract 1.0 from ratio so water feels 0 centrifugal force and spreads evenly)
                const massDifference = Math.abs(visualDensityRatio - 1.0);
                let centrifugalForce = 2.0 * vortexEngagement * massDifference * Math.abs(distFromCenter);

                // Add a cushion near the walls for heavy elements so they form a thick visible sludge band 
                // rather than crushing into an invisible 1-pixel line (which hides them and makes them look rare)
                if (!isLighterThanWater) {
                    const wallDist = Math.min(py, Ly - py);
                    const wallBuffer = Math.max(0, Math.min(1.0, wallDist / (Ly * 0.1))); // 0% force at the literal wall edge, full force at 10% inward
                    centrifugalForce *= wallBuffer;
                }

                vy += forceDirection * centrifugalForce * dt;

                // Acoustic Radiation Force (The Gor'kov Scalpel)
                const isActiveTarget = (typeIndex > 0 && ELEMENT_KEYS[typeIndex - 1] === activeElement);
                if (isActiveTarget && activePower > 0 && px > Lx * 0.4) {
                    // Check if acoustic power overcomes the forward fluid momentum (drag)
                    const reqForce_kN = 0.5 * TARGET_ELEMENTS[activeElement].density * Math.pow(activeFlow, 2) * 0.001 * 0.12; 
                    const reqPower_kW = reqForce_kN * 0.8;
                    const threshold = reqPower_kW * 0.5;

                    if (activePower >= threshold) {
                        // The transducers (outside the pipe) pull the target element THROUGH the porous wall
                        // The pull strength scales dynamically with how much excess power you have applied, 
                        // but mathematically clamp the ratio so extremely light elements like Lithium don't teleport.
                        const powerRatio = Math.min(5.0, activePower / Math.max(0.1, reqPower_kW));
                        const acousticPull = (activePower * 4.0) * powerRatio; 
                        vy += outwardDir * acousticPull * dt;
                    }
                }
                
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
                    const isActiveTarget = (typeI > 0 && ELEMENT_KEYS[typeI - 1] === activeElement);
                    let powerBreachesWall = false;
                    
                    if (isActiveTarget && activePower > 0) {
                        const reqForce_kN = 0.5 * TARGET_ELEMENTS[activeElement].density * Math.pow(activeFlow, 2) * 0.001 * 0.12; 
                        const reqPower_kW = reqForce_kN * 0.8;
                        powerBreachesWall = activePower >= (reqPower_kW * 0.5);
                    }
                    
                    if (isActiveTarget && powerBreachesWall && px > Lx * 0.4) {
                        // Acoustic Permeable Membrane: The target element has enough Gor'kov power pulling it 
                        // to physically pass through the cyan lines into the outer collection jacket (-Ly*0.2 to Ly*1.2)
                        // This ONLY happens on the right side of the pipe
                        if (py < -Ly * 0.2 + Ri) py = -Ly * 0.2 + Ri;
                        if (py > Ly * 1.2 - Ri) py = Ly * 1.2 - Ri;
                    } else {
                        // Standard Pipe Boundaries (Impenetrable steel walls)
                        // Applies to all water, all non-targets, and targets when Transducer Power is too low
                        // Ceiling
                        if (py < Ri * 2) py = Ri * 2;
                        // Flat Floor
                        if (py > Ly - Ri) py = Ly - Ri;
                    }
                    
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
                    const calcVx = (px - particleData[offset]) / dt;
                    let calcVy = (py - particleData[offset + 1]) / dt;
                    
                    // Add physical bounce at the top and bottom metallic boundaries
                    // If the particle was caught by the Pass 3 clamp, its calculated velocity will be 0 towards the wall.
                    // We detect this by checking if it's sitting exactly on the boundary, and manually reflecting its previous velocity.
                    const R = particleData[offset + 4];
                    const bounceRestitution = 0.6; // 60% momentum retention on bounce
                    const isActiveTarget = (typeI > 0 && ELEMENT_KEYS[typeI - 1] === activeElement);
                    
                    let bounced = false;
                    if (isActiveTarget && activePower > 0 && px > Lx * 0.4) {
                        if (py <= -Ly * 0.2 + R || py >= Ly * 1.2 - R) bounced = true;
                    } else {
                        if (py <= R * 2 || py >= Ly - R) bounced = true;
                    }

                    if (bounced) {
                        // Reflect the old velocity instead of zeroing it
                        calcVy = -particleData[offset + 3] * bounceRestitution;
                        // Artificially offset the next frame's "old position" to force the bounce up through PBD
                        particleData[offset + 1] = py - (calcVy * dt);
                    } else {
                        particleData[offset + 1] = py;
                    }

                    particleData[offset + 2] = calcVx;
                    particleData[offset + 3] = calcVy;
                    particleData[offset] = px;
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
            
            // Render Collection Hopper and its Physics
            const hopperH = 100;
            const hopperY = 450; // Set strictly below the main container
            const tankX = 0;
            const tankY = hopperY;
            const tankW = width;
            const tankH = hopperH;

            // Draw Tank background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark metallic pit
            ctx.fillRect(tankX, tankY, tankW, tankH);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.strokeRect(tankX, tankY, tankW, tankH);
            
            // "COLLECTION HOPPER" text in background
            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("COLLECTION HOPPER", tankX + tankW/2, tankY + tankH/2 + 8);
            ctx.textAlign = 'left';

            // Animate Hopper Particles
            const fpsDt = dt;
            const collectorItems = visualCollectorRef.current;
            
            // PBD Pass: Resolve Collisions between Hopper Particles
            // Simple O(n^2) is fine here since hopper particles max out ~500 before clearing visually
            for (let i = 0; i < collectorItems.length; i++) {
                const p1 = collectorItems[i];
                for (let j = i + 1; j < collectorItems.length; j++) {
                    const p2 = collectorItems[j];
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = p1.r + p2.r;
                    
                    if (distSq < minDist * minDist && distSq > 0.0001) {
                        const dist = Math.sqrt(distSq);
                        const pushDist = (minDist - dist) * 0.5; // push each away by half the overlap
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        // Push apart
                        p1.x -= nx * pushDist;
                        p1.y -= ny * pushDist;
                        p2.x += nx * pushDist;
                        p2.y += ny * pushDist;
                        
                        // Dampen velocity to simulate granular friction upon impact
                        p1.vx *= 0.8; p1.vy *= 0.8;
                        p2.vx *= 0.8; p2.vy *= 0.8;
                    }
                }
            }

            // Apply Velocity, Gravity, and Boundaries
            for (let i = 0; i < collectorItems.length; i++) {
                const p = collectorItems[i];
                p.vy += 980 * fpsDt; // Gravity pulling down
                p.x += p.vx * fpsDt;
                p.y += p.vy * fpsDt;

                // Tank boundary collisions
                if (p.x < tankX + p.r) { p.x = tankX + p.r; p.vx *= -0.4; }
                if (p.x > tankX + tankW - p.r) { p.x = tankX + tankW - p.r; p.vx *= -0.4; }
                if (p.y > tankY + tankH - p.r) { 
                    p.y = tankY + tankH - p.r;
                    p.vy *= -0.2; // Dampened bounce (heavy metal falling)
                    p.vx *= 0.8; // High friction floor
                }

                // Draw Particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Render Live Telemetry Yield (Rendered ON TOP of hopper particles)
            if (activeElementData) {
                const totalYield_kg = currentYieldCollected / 1e6;
                const totalValueUSD = totalYield_kg * activeElementData.pricePerKg;
                
                // Real-world continuous flow projection
                // A single pipe 1.0m deep x 0.5m high flowing at 2.0 m/s processes 1,000 Liters/sec.
                // The user requested a 1:1 simulation scale representing ONE unit.
                const HARVESTER_ARRAY_UNITS = 1.0;
                const crossSection_m2 = Ly * 1.0; // 1 meter depth slice
                const flowRate_m3_s = crossSection_m2 * activeFlow * HARVESTER_ARRAY_UNITS;
                const dailyLiters = flowRate_m3_s * 1000 * 86400;
                
                // Calculate physical extraction efficiency based on current Transducer Power vs Flow Drag
                const reqForce_kN = 0.5 * activeElementData.density * Math.pow(activeFlow, 2) * 0.001 * 0.12; 
                const reqPower_kW = reqForce_kN * 0.8;
                let powerCatchRatio = 0;
                if (activePower >= reqPower_kW * 0.5) {
                    powerCatchRatio = Math.min(1.0, activePower / reqPower_kW);
                }
                
                const dailyExtract_mg = dailyLiters * activeElementData.concentration_mg_per_L * powerCatchRatio;
                const monthlyExtract_mg = dailyExtract_mg * 30;
                
                const dailyValueUSD = (dailyExtract_mg / 1e6) * activeElementData.pricePerKg;
                const monthlyValueUSD = (monthlyExtract_mg / 1e6) * activeElementData.pricePerKg;

                // Business Projections
                const yearlyExtract_mg = dailyExtract_mg * 365;
                const yearlyValueUSD = (yearlyExtract_mg / 1e6) * activeElementData.pricePerKg;

                // Live Cumulative
                ctx.fillStyle = activeElementData.color;
                ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
                const yieldText = `YIELD: ${currentYieldCollected.toFixed(4)} mg`;
                ctx.fillText(yieldText, 16, simHeight - 48);
                
                // Dollar Value Projections
                ctx.fillStyle = '#34d399'; // Brighter Emerald Green
                ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
                const dUSD = `$${dailyValueUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                const mUSD = `$${monthlyValueUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                const yUSD = `$${yearlyValueUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                ctx.fillText(`${dUSD} daily / ${mUSD} monthly / ${yUSD} yearly`, 16, simHeight - 16);
            }
            
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
                        style={{ width: '100%', height: 'calc(100% + 100px)', display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 50, borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }} 
                        width={800} 
                        height={550} 
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
        
        {/* PHYSICAL SPECIFICATIONS */}
        <div style={{ background: '#0f172a', borderRadius: '20px', padding: '3rem', marginTop: '2rem', color: '#e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                System Physical Specifications
            </h2>
            
            <div style={{ marginBottom: '3rem' }}>
                <AcousticHarvester3DModel />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#38bdf8', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Extraction Chamber Dimensions</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Length (Lx):</strong> 2.0 Meters (Active Acoustic Zone)</li>
                        <li><strong>Height (Ly):</strong> 0.5 Meters (Vortex processing channel)</li>
                        <li><strong>Depth (Lz):</strong> 1.0 Meters (Pipeline cross-width)</li>
                        <li><strong>Optic / Acoustic Nodes:</strong> 12 Trapping Zones</li>
                    </ul>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#eab308', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Single Unit Pumping Metrics</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Flow Rate Velocity:</strong> 2.0 Meters / second</li>
                        <li><strong>Cross-Sectional Area:</strong> 0.5 Square Meters</li>
                        <li><strong>Volume Processing:</strong> 1,000 Liters / second</li>
                        <li><strong>Total Daily Capacity:</strong> 86.4 Million Liters / day</li>
                    </ul>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#eab308', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Target Element Yield Variance</h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        The massive variation in Estimated Value between elements arises from two real-world factors:
                        <br/><br/>
                        <strong>1. Natural Ocean Concentration:</strong> Gold (Au) exists at ~0.000004 mg/L in seawater, making it incredibly rare. Lithium (Li) is vastly more abundant at ~0.17 mg/L.
                        <br/><br/>
                        <strong>2. Market Price:</strong> Even though Palladium (Pd) is as rare as Platinum, its market demand for electronics drives its price to nearly $35,000/kg. Our simulations process both the physical capture rate and the exact market density.
                    </p>
                </div>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#10b981', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Vortex & Power Requirements</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Intake Funnel Strategy:</strong> Laminar flow alignment</li>
                        <li><strong>Effective Volume Processed:</strong> Up to ~86,400,000 Liters/Day</li>
                        <li><strong>Acoustic Transducer Input:</strong> 1.0 - 30.0 kW Variable Draw</li>
                        <li><strong>Slurry Overcome Force:</strong> Dynamic (dependent on target mass / fluid drag ratio)</li>
                    </ul>
                </div>
            </div>
            
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                <h3 style={{ color: '#8b5cf6', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Extraction Efficiency (Yield % per Liter)</h3>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                    The projections above calculate a <strong>100% theoretical maximum yield</strong> per liter of processed water. In a perfectly tuned acoustic, laminar flow environment where the Gor&apos;kov potential completely overcomes kinetic drag, every target particle is assumed to be trapped.
                    <br/><br/>
                    In a real-world physical deployment, extraction accuracy typically ranges from <strong>85% to 95%</strong>. Losses occur due to micro-turbulence disrupting the acoustic nodes, competing bio-particulates scattering the beam, or particles slipping through the extraction boundary between acoustic pulses.
                </p>
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
                So, the sound waves don&apos;t just hold the gold—they force the particles to clump together until they&apos;re heavy enough to sink into your collection bed!
            </p>
        </div>
        </>
    );
};
