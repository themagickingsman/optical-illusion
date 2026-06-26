"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CosmicRecursionEngine } from '../../state/logic/CosmicRecursionEngine';
import { COSMIC_COMPASS_DATA } from './CosmicCompassData';
import { SnapshotAdapter } from '../../state/logic/SnapshotAdapter';
import { FractalGeometryVault } from './FractalGeometryVault';
import { SOLAR_SYSTEM_PLANETS, calculate3DPosition, getEclipticLongitude, deg2rad, calculateGeocentricLongitude, J2000_EPOCH } from '../../state/data/solar_system_jpl';

// --- STYLING CONSTANTS ---
export const COSMIC_THEME = {
  primary: '#0ea5e9', // Cyber blue
  secondary: '#38bdf8',
  accent: '#7dd3fc',
  background: '#040b16',
  surface: '#0c1a32',
  surfaceRgba: 'rgba(12, 26, 50, 0.7)',
  p0: '#ff3366', // Blocker Red
  p1: '#ff9900', // Warning Orange
  p2: '#00ccff', // Info Blue
  text: {
    main: '#f0f9ff',
    muted: '#94a3b8',
    highlight: '#ffffff'
  },
  border: 'rgba(14, 165, 233, 0.2)',
  glow: '0 0 20px rgba(14, 165, 233, 0.4)',
  
  // NEW: Multi-Octave Color Scale (0 to 14)
  octaveColors: [
      '#9ca3af', // 0: Void (Gray)
      '#a855f7', // 1: Quantum (Purple)
      '#d946ef', // 2: Subatomic (Magenta)
      '#ec4899', // 3: Nuclear (Pink)
      '#f43f5e', // 4: Atomic (Rose)
      '#ef4444', // 5: Molecular (Red)
      '#f97316', // 6: Cellular (Orange)
      '#eab308', // 7: Organism (Yellow)
      '#84cc16', // 8: Ecosystem (Lime)
      '#22c55e', // 9: Planetary (Green)
      '#10b981', // 10: Lunar (Emerald)
      '#14b8a6', // 11: Solar System (Teal)
      '#06b6d4', // 12: Stellar (Cyan) - Matches Sirius/Orion Target
      '#3b82f6', // 13: Galactic (Blue)
      '#6366f1', // 14: Universal (Indigo)
  ]
};

// --- PRESETS ---
type AlignmentPreset = 'ECLIPSE_2024' | 'BETHLEHEM_3AD' | 'GIZA_EPOCH' | 'LIVE' | 'PLANETARY_PARADE_2026' | 'SPRING_EQUINOX_2026';

// Preset Math Helpers
interface PresetAngles {
    [bodyName: string]: number; // Angle in Radians (0 to 2PI)
}

const ZODIAC_SPECTRUM_COLORS = [
    '#ef4444', // 0: Aries - Red
    '#f97316', // 1: Taurus - Orange
    '#eab308', // 2: Gemini - Yellow
    '#22c55e', // 3: Cancer - Green
    '#3b82f6', // 4: Leo - Blue
    '#6366f1', // 5: Virgo - Indigo
    '#a855f7', // 6: Libra - Violet
    '#d946ef', // 7: Scorpio - Magenta
    '#ec4899', // 8: Sagittarius - Pink
    '#94a3b8', // 9: Capricorn - Slate/Gray
    '#06b6d4', // 10: Aquarius - Cyan
    '#14b8a6', // 11: Pisces - Teal
];

const PRESET_ANGLES: Record<string, PresetAngles> = {
    // Exact Heliocentric Longitudes (Radians) for April 8, 2024 18:00 UTC (JPL Horizons data)
    'ECLIPSE_2024': {
        'Sun': 0, 
        'Mercury': 3.456, // ~198 deg (Inferior Conjunction)
        'Venus': 4.450,   // ~255 deg
        'Earth': 3.456,   // ~198 deg
        'Moon': 3.456,    // Roughly same as Earth heliocentrically
        'Mars': 5.759,    // ~330 deg
        'Jupiter': 1.047, // ~60 deg
        'Saturn': 6.021,  // ~345 deg
    },
    'BETHLEHEM_3AD': {
        'Jupiter': Math.PI / 4, 'Venus': (Math.PI / 4) + 0.05, 'Regulus': (Math.PI / 4) - 0.05, 'Earth': (Math.PI / 4) + Math.PI
    },
    'GIZA_EPOCH': {
        'Sirius A': Math.PI / 2, 'Rigel': (Math.PI / 2) + 0.3, 'Earth': (Math.PI / 2) + Math.PI
    },
    'LIVE': {} // Will just use random dispersal or current epoch math if built
};

// --- HELPER FUNCTIONS ---
function distToSegmentSquared(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return (px - projX) ** 2 + (py - projY) ** 2;
}
function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
        : '255, 255, 255';
}

function getPresetTime(preset: AlignmentPreset): number {
    switch(preset) {
        case 'ECLIPSE_2024': return new Date("2024-04-08T18:00:00Z").getTime();
        case 'PLANETARY_PARADE_2026': return new Date("2026-02-28T12:00:00Z").getTime();
        case 'SPRING_EQUINOX_2026': return new Date("2026-03-20T12:00:00Z").getTime();
        case 'BETHLEHEM_3AD': {
            const d = new Date("2000-01-01T12:00:00Z");
            d.setUTCFullYear(3, 7, 12); // Aug 12, 3 AD
            return d.getTime();
        }
        case 'GIZA_EPOCH': {
            const d = new Date("2000-01-01T12:00:00Z");
            d.setUTCFullYear(-10500, 0, 1);
            return d.getTime();
        }
        case 'LIVE':
        default:
            return new Date("2024-04-08T18:00:00Z").getTime();
    }
}

export const OrbitalFractalGenerator: React.FC = () => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState<'ORBITAL' | 'GEOMETRY'>('ORBITAL');
    const [activePreset, setActivePreset] = useState<AlignmentPreset>('LIVE');
    const [chartPerspective, setChartPerspective] = useState<'GEOCENTRIC' | 'HELIOCENTRIC'>('GEOCENTRIC');
    
    // Octave controls: an array of booleans tracking which octaves are visible
    // Defaulting to showing Octave 8 (Planetary) and Octave 13 (Galactic/Zodiac)
    const [visibleOctaves, setVisibleOctaves] = useState<boolean[]>(
        Array(15).fill(false).map((_, i) => i === 11) // Default to Octave 11
    );
    const [showStabilityNodes, setShowStabilityNodes] = useState<boolean>(false);
    const [activePattern, setActivePattern] = useState<'ATOMIC' | 'HEX' | 'ANTENNAE' | null>(null);

    // Critical Alignment Detector State
    const [alignmentDetectorActive, setAlignmentDetectorActive] = useState<boolean>(false);
    const [detectedAlignment, setDetectedAlignment] = useState<{ type: 'SYZYGY' | 'GOLDEN_RATIO', bodies: string[], angle: number } | null>(null);

    // Time Scrubber State
    const [simDate, setSimDate] = useState<Date>(new Date());
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // Days per 60fps frame
    const [showLabels, setShowLabels] = useState<boolean>(true);
    
    // WebGL-style stable timing reference to avoid state churn in requestAnimationFrame
    const simTimeRef = useRef<number>(Date.now());

    // Zoom and Pan State
    const currentTransformRef = useRef({ scale: 1.0, x: 0, y: 0 });
    const targetTransformRef = useRef({ scale: 1.0, x: 0, y: 0 });
    const [uiZoom, setUiZoom] = useState<number>(1.0);
    const [showUI, setShowUI] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const trailsRef = useRef<{ x1: number, y1: number, x2: number, y2: number, age: number }[]>([]);
    const frameCountRef = useRef<number>(0);
    const zodiacFadesRef = useRef<number[][]>(Array.from({length: 15}, () => Array(12).fill(0)));
    
    // Sidebar Object List Tracking 
    const sidebarObjectsRef = useRef<{name: string, color: string, octave: number}[]>([]);
    const [sidebarObjects, setSidebarObjects] = useState<{name: string, color: string, octave: number}[]>([]);

    // Alignment Detector Trailing Angle State (for fast-scrub crossover detection)
    const prevAnglesRef = useRef<{ [key: string]: number }>({});
    
    // Energy Translation Tracking
    const energyTranslationRef = useRef<{
        isLocked: boolean;
        sun: string; moon: string;
        mSun: string; vSun: string;
        mMoon: string; vMoon: string;
    }>({ 
        isLocked: false,
        sun: '', moon: '',
        mSun: '', vSun: '',
        mMoon: '', vMoon: ''
    });
    const [energyTranslation, setEnergyTranslation] = useState<{
        isLocked: boolean;
        sun: string; moon: string;
        mSun: string; vSun: string;
        mMoon: string; vMoon: string;
    }>({ 
        isLocked: false,
        sun: '', moon: '',
        mSun: '', vSun: '',
        mMoon: '', vMoon: ''
    });
    
    // Sync ref to state every 500ms to avoid re-render crashing
    useEffect(() => {
        const interval = setInterval(() => {
            setSidebarObjects([...sidebarObjectsRef.current]);
            setEnergyTranslation({...energyTranslationRef.current});
            setUiZoom(currentTransformRef.current.scale);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleExtractClick = (type: 'ATOMIC' | 'HEX' | 'ANTENNAE', targetOctave: number, targetZoom: number) => {
        // Isolate the view to the target octave and the base origin (O2 planetary for context usually helps, but let's strictly do target + O2 for context)
        const newVisible = Array(15).fill(false);
        newVisible[targetOctave] = true;
        if (targetOctave !== 2) newVisible[2] = true; // Always keep Solar System for visual anchor
        
        setVisibleOctaves(newVisible);
        setActivePattern(type);
        
        const canvas = canvasRef.current;
        if (canvas) {
            const { width, height } = canvas.getBoundingClientRect();
            const cx = width / 2;
            const cy = height / 2;
            const curT = targetTransformRef.current;
            // Adjust translation so the center remains fixed during zoom
            const newX = curT.x; // Panning stays the same, zooming handles the center offset automatically now
            const newY = curT.y;
            targetTransformRef.current = { x: newX, y: newY, scale: targetZoom };
        } else {
            targetTransformRef.current = { x: 0, y: 0, scale: targetZoom }; 
        }
        setShowStabilityNodes(true); // Always turn on alignments for extracts
    };

    // --- RENDER LOGIC ---
    useEffect(() => {
        let animationFrameId: number;

        const drawCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;

            // Smooth Transform Lerp (Animate Smoothly)
            const cT = currentTransformRef.current;
            const tT = targetTransformRef.current;
            cT.scale += (tT.scale - cT.scale) * 0.12; // 12% closer every frame
            cT.x += (tT.x - cT.x) * 0.12;
            cT.y += (tT.y - cT.y) * 0.12;
            
            // Assign to local transform variable for all drawing math
            const transform = cT;
            
            // BackgroundReset transform to apply DPI scale, then user pan/zoom
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            // Clear
            ctx.clearRect(0, 0, width, height);
            
            ctx.fillStyle = COSMIC_THEME.background;
            ctx.fillRect(0, 0, width, height);

            // Setup Grid Center
            const centerX = width / 2;
            const centerY = height / 2;

            // Apply User Transform (Zooming from the center of the screen)
            // Flipped Y-scale (-transform.scale) to align HTML Canvas (Y-Down) to Cartesian Math (Y-Up)
            ctx.translate(centerX + transform.x, centerY + transform.y);
            ctx.scale(transform.scale, -transform.scale); 
            ctx.translate(-centerX, -centerY);

            // --- MATH CONSTANTS ---
            const maxRadiusPx = Math.min(width, height) / 2 * 0.9;
            
            // --- DATA PREP ---
            const angles = PRESET_ANGLES[activePreset] || {};

            // Store lines for intersection calculation
            // Line format: { x1, y1, x2, y2 }
            const drawnLines: { x1: number, y1: number, x2: number, y2: number, isPillar: boolean }[] = [];

            const RING_ORDER = [
                'Moon',      // Ring 1
                'Mercury',   // Ring 2
                'Venus',     // Ring 3
                'Sun',       // Ring 4
                'Mars',      // Ring 5
                'Jupiter',   // Ring 6
                'Saturn'     // Ring 7
            ];

            const activeOctavesList = visibleOctaves.map((v, i) => v ? i : -1).filter(i => i !== -1);
            
            // Calculate pure Astrological boundaries (Single Wheel Style)
            const zodiacBandOuter = maxRadiusPx;
            const zodiacBandInner = maxRadiusPx * 0.9;
            const planetCircleRadius = maxRadiusPx * 0.85;

            // 1. Draw the Base Framework (Void + Zodiac Band)
            ctx.beginPath();
            ctx.arc(centerX, centerY, zodiacBandOuter, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(14, 165, 233, 0.4)`; // Outer Edge
            ctx.lineWidth = 2; 
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(centerX, centerY, zodiacBandInner, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(14, 165, 233, 0.1)`; // Inner Edge
            ctx.lineWidth = 1; 
            ctx.stroke();
            
            // Draw Center Observer
            const centerBody = chartPerspective === 'GEOCENTRIC' ? 'Earth' : 'Sun';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
            ctx.fillStyle = chartPerspective === 'GEOCENTRIC' ? COSMIC_THEME.p2 : '#eab308'; // Earth Blue or Sun Yellow
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = chartPerspective === 'GEOCENTRIC' ? COSMIC_THEME.p2 : '#eab308';
            ctx.fill();
            ctx.shadowBlur = 0;

            // DRAW CENTER TEXT (Y is inverted globally, so we must un-invert before drawing text)
            ctx.save();
            ctx.translate(centerX + 10, centerY + 3);
            ctx.scale(1, -1);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(centerBody, 0, 0);
            ctx.restore();

            // 2. Calculate coordinates for all bodies across ALL Octaves
            // PROXY EPHEMERIS: The 7 Classical Objects align structurally to Level 11 JPL Data
            const nodesByOctave: { [octave: number]: any[] } = {};
            const allNodes: any[] = [];
            
            // Earth serves as the geocentric camera anchor
            const earthPlanet = SOLAR_SYSTEM_PLANETS.find(p => p.name === 'Earth')!;
            
            // To ensure time-dilation runs smoothly without jumping when swapping presets,
            // we calculate the delta from when the user last hit play or changed the preset
            
            // SINGLE PATH ECLIPTIC MODEL:
            // All objects are plotted exactly on the inner edge of the Zodiac band
            const sharedOrbitRadius = zodiacBandInner;

            // --- UNIVERSAL ZODIAC STRUCTURAL PERIOD ---
            // The Zodiac's galactic drift is dynamically driven by the base period 
            // of the CURRENT Octave's structural model, not hardcoded.
            // (Calculation moved inside the loop so the grid scales to the correct physics depth).

            // We calculate ALL octaves from 14 down to 0
            for (let o = 14; o >= 0; o--) {
                nodesByOctave[o] = [];
                const isVisible = visibleOctaves[o];
                
                // If the octave is toggled OFF, we skip it entirely so it doesn't render or pollute the HUD arrays
                if (!isVisible) continue;

                // Gets exactly 7 objects (Indices 0, 85, 103, 112, 124, 160, 177)
                const activeBodies = SnapshotAdapter.getFoundationBodies(o);

                // The core fractal time-scalar:
                const timeDilation = Math.pow(1.618, (11 - o)); 
                
                // UNIVERSAL RELATIVISTIC EPOCH (J2000)
                // We dilate time strictly based on the elapsed time since J2000, 
                // so Octaves drift out of sync immediately based on their dilation multiplier
                const msSinceJ2000 = simTimeRef.current - J2000_EPOCH.getTime();
                const dilatedTimeMs = J2000_EPOCH.getTime() + (msSinceJ2000 * timeDilation);
                
                // The localized time for this Octave (Relative to J2000 anchor)
                const octaveSimDate = new Date(dilatedTimeMs);
                
                // Calculate Earth's heliocentric position for geocentric perspective math
                const earthPos3D = calculate3DPosition(earthPlanet, octaveSimDate);
                const earthHelioAngle = deg2rad(getEclipticLongitude(earthPos3D.x, earthPos3D.y));
                
                // --- PHYSICAL ZODIAC MECHANICS ---
                // In Geocentric view, the Earth is stationary and the sky (Zodiac) revolves around it 
                // exactly correlating to Earth's orbital position around the Sun.
                // In Heliocentric view, the Zodiac is mostly static, drifting based on a deep space reference frame.
                
                // CRITICAL FIX: The Heliocentric Zodiac drift was previously scaled to the *local* planetary base 
                // (e.g., 1 Year for Octave 11), causing the background sky to spin identically to the inner planets!
                // To anchor the Star Chart correctly, the Heliocentric background sky must drift at the true 
                // Galactic/Precessional rate relative to the dilated simulation time.
                const GALACTIC_PERIOD_MS = 250000000 * 365.25 * 24 * 60 * 60 * 1000;
                const octaveDiffMs = octaveSimDate.getTime() - J2000_EPOCH.getTime();
                
                // Heliocentric deep space drift is extremely slow, providing a stable geometric background.
                const zodiacHeliocentricDriftRad = (octaveDiffMs / GALACTIC_PERIOD_MS) * Math.PI * 2;
                
                // Because we flipped the entire Canvas Y-axis to be Cartesian (Counter-Clockwise = Positive),
                // drawing the Zodiac backwards (clockwise) in Geocentric mode means we must ADD Earth's angle,
                // and drawing the Zodiac forwards (counter-clockwise) in Heliocentric means ADDING galactic drift.
                const baseZodiacRotation = chartPerspective === 'GEOCENTRIC' ? earthHelioAngle : zodiacHeliocentricDriftRad; 
                const zodiacRotation = baseZodiacRotation;
                
                const zodiacNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                
                activeBodies.forEach((body: any, index: number) => {
                    let displayAngle = 0;
                    let plotRadius = 0;
                    
                    // EVERY object strictly orbits the absolute center of the canvas
                    const parentX = centerX;
                    const parentY = centerY;

                    // THE 7 CLASSICAL MAPPER
                    // Even if this is Octave 10, we proxy its geometry to the Level 11 Planets
                    // Ordered by the extraction indices: 0(Moon), 85(Mercury), 103(Venus), 112(Earth/Sun), 124(Mars), 160(Jupiter), 177(Saturn)
                    const classicalMapGeocentric = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn'];
                    const classicalMapHeliocentric = ['Moon', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn'];
                    const proxyPlanetName = chartPerspective === 'GEOCENTRIC' ? classicalMapGeocentric[index] : classicalMapHeliocentric[index];
                    
                    const lookupPlanetName = proxyPlanetName === 'Sun' ? 'Earth' : proxyPlanetName;
                    const realPlanet = SOLAR_SYSTEM_PLANETS.find(p => p.name === lookupPlanetName);
                    
                    let renderBody = body;
                    if (chartPerspective === 'GEOCENTRIC' && proxyPlanetName === 'Sun') {
                        // In Geocentric, the Earth equivalent is at the center. The "Sun" (Base) of that Octave orbits it.
                        const baseObj = SnapshotAdapter.getOctaveData(o).find((b: any) => b.isBase);
                        if (baseObj) {
                            renderBody = baseObj;
                        } else if (o === 11) {
                            renderBody = { ...body, name: 'Sun', color: '#facc15' };
                        }
                    }
                    
                    
                    if (o >= 12) {
                        // HYBRID SYSTEM: Deep Space Objects (O12, O13, O14) do NOT use NASA JPL math like planets do.
                        // They calculate their own pure mathematical orbit based on their specific Harmonic frequencies.
                        // However, because `octaveSimDate` has already been dilated by the `1.618^T` Cosmic Compass constant,
                        // their speeds will still scale symmetrically with the rest of the universe.
                        const nativeZodiacRad = renderBody.zodiac_angle !== undefined 
                            ? deg2rad(renderBody.zodiac_angle) 
                            : (renderBody.initial_phase || 0);
                        
                        // Deep Space drift based on their specific structural theoretical frequency
                        const octaveDiffMs = octaveSimDate.getTime() - J2000_EPOCH.getTime();
                        
                        // Default to their catalog freq, or calculate it from their true theoretical period
                        const freqHz = renderBody.orbital_freq || (renderBody.meta?.period_s ? (1 / renderBody.meta.period_s) : 0);
                        const orbitDrift = octaveDiffMs * freqHz * Math.PI * 2;
                        
                        // To maintain physical consistency with the Planets, these bodies use
                        // standard positive progression (counter-clockwise).
                        const pureHeliocentricStarAngle = nativeZodiacRad + orbitDrift;
                        
                        // If we are looking from Earth (Geocentric), the entire sky is offset by Earth's position.
                        if (chartPerspective === 'GEOCENTRIC') {
                             displayAngle = pureHeliocentricStarAngle + earthHelioAngle + Math.PI;
                        } else {
                             // Heliocentric: Just show their raw position
                             displayAngle = pureHeliocentricStarAngle;
                        }
                        
                        plotRadius = sharedOrbitRadius;
                    } else if (proxyPlanetName === 'Moon') {
                        const msSinceEpoch = octaveSimDate.getTime() - J2000_EPOCH.getTime();
                        const moonPhase = (msSinceEpoch / (27.32 * 24 * 60 * 60 * 1000)) * Math.PI * 2;
                        
                        // In a Star Chart, everything shares the identical path
                        displayAngle = chartPerspective === 'GEOCENTRIC' ? earthHelioAngle + Math.PI + moonPhase : earthHelioAngle + moonPhase;
                        plotRadius = sharedOrbitRadius;
                    } else if (realPlanet) {
                        if (chartPerspective === 'GEOCENTRIC') {
                            if (proxyPlanetName === 'Sun') {
                                displayAngle = earthHelioAngle + Math.PI;
                                plotRadius = sharedOrbitRadius;
                            } else if (proxyPlanetName === 'Earth') {
                                displayAngle = 0; // Earth is the focal point
                                plotRadius = 0;
                            } else {
                                const pPos3D = calculate3DPosition(realPlanet, octaveSimDate);
                                displayAngle = deg2rad(calculateGeocentricLongitude(pPos3D, earthPos3D));
                                plotRadius = sharedOrbitRadius;
                            }
                        } else {
                            // HELIOCENTRIC
                            if (proxyPlanetName === 'Earth') {
                                displayAngle = earthHelioAngle;
                                plotRadius = sharedOrbitRadius;
                            } else if (proxyPlanetName === 'Sun') {
                                displayAngle = 0; // Sun is the focal point
                                plotRadius = 0;
                            } else {
                                const pPos3D = calculate3DPosition(realPlanet, octaveSimDate);
                                displayAngle = deg2rad(getEclipticLongitude(pPos3D.x, pPos3D.y));
                                plotRadius = sharedOrbitRadius;
                            }
                        }
                    }

                    // Normalize angle
                    displayAngle = (displayAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                    // Skip the centered observer from being drawn as a satellite
                    // If we are looking from Geocentric, we don't draw Earth on the rings.
                    if (proxyPlanetName === centerBody) return;

                    const nx = parentX + Math.cos(displayAngle) * plotRadius;
                    const ny = parentY + Math.sin(displayAngle) * plotRadius;
                    
                    const displayColor = (proxyPlanetName === 'Moon' && o === 11) ? '#fff' : COSMIC_THEME.octaveColors[o];
                    const finalColor = (renderBody.color && renderBody.color !== '#ffffff') ? renderBody.color : displayColor;

                    const nodeData = {
                        body: renderBody, x: nx, y: ny, angle: displayAngle,
                        isPillar: true, color: finalColor, octaveLevel: o,
                        displayName: renderBody.name || `Level ${renderBody.level} Structure`,
                        proxyName: proxyPlanetName
                    };

                    nodesByOctave[o].push(nodeData);
                    allNodes.push(nodeData);
                });
                
                // Track occupied Zodiac Sectors for this Octave
                const sectorOccupancy = Array(12).fill(false);
                let sunSector = -1;
                let moonSector = -1;

                nodesByOctave[o].forEach(node => {
                    if (node.isPillar || node.body?.name === centerBody) { 
                        // The relative angle from Aries 0-point
                        const relAngle = zodiacRotation - node.angle;
                        const normalizedRel = ((relAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                        const sector = Math.floor(normalizedRel / (Math.PI / 6)); // 30 degrees
                        if (sector >= 0 && sector < 12) {
                            sectorOccupancy[sector] = true;
                            if (node.proxyName === 'Sun') sunSector = sector;
                            if (node.proxyName === 'Moon') moonSector = sector;
                        }
                    }
                });
                
                // Update Energy Translation Data if we found them (usually in planetary Octave 11)
                if ((sunSector !== -1 || moonSector !== -1) && !isPlaying) {
                    energyTranslationRef.current.isLocked = true;
                    const zodiacNamesList = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                    if (sunSector !== -1) {
                        const sign = zodiacNamesList[sunSector];
                        const signData = COSMIC_COMPASS_DATA.find(d => d.zodiac === sign);
                        if (signData) {
                            energyTranslationRef.current.sun = `Sun in ${sign} (${signData.element}): ${signData.personality_archetype} / ${signData.biological_archetype}`;
                            energyTranslationRef.current.mSun = `${signData.geometry}`;
                            energyTranslationRef.current.vSun = `${signData.element} & ${signData.pattern}`;
                        }
                    }
                    if (moonSector !== -1) {
                        const sign = zodiacNamesList[moonSector];
                        const signData = COSMIC_COMPASS_DATA.find(d => d.zodiac === sign);
                        if (signData) {
                            energyTranslationRef.current.moon = `Moon in ${sign} (${signData.element}): ${signData.personality_archetype} / ${signData.biological_archetype}`;
                            energyTranslationRef.current.mMoon = `${signData.geometry}`;
                            energyTranslationRef.current.vMoon = `${signData.element} & ${signData.pattern}`;
                        }
                    }
                } else if (isPlaying) {
                     energyTranslationRef.current.isLocked = false;
                     energyTranslationRef.current.sun = '';
                     energyTranslationRef.current.moon = '';
                     energyTranslationRef.current.mSun = '';
                     energyTranslationRef.current.vSun = '';
                     energyTranslationRef.current.mMoon = '';
                     energyTranslationRef.current.vMoon = '';
                }
                
                // All Octaves have a 12-Segment Zodiac Frame ("All levels should track the zodiac")
                for (let s = 0; s < 12; s++) {
                    const startAngle = zodiacRotation - (s * 30) * (Math.PI / 180);
                    const endAngle = zodiacRotation - ((s + 1) * 30) * (Math.PI / 180);
                    
                    // ZODIAC SPECTRUM HIGHLIGHT: Update fade state and draw if fading or occupied
                    if (sectorOccupancy[s]) {
                        zodiacFadesRef.current[o][s] = 1.0; // Instantly on
                    } else {
                        // Smoothly fade out (approx 50 frames to 0)
                        zodiacFadesRef.current[o][s] = Math.max(0, zodiacFadesRef.current[o][s] - 0.02);
                    }

                    const fade = zodiacFadesRef.current[o][s];
                    
                    if (fade > 0) {
                        const bandWidth = zodiacBandOuter - zodiacBandInner;
                        ctx.beginPath();
                        // Make panel 1/4 height and place it on the outer edge (effectively halving its previous 1/2 height)
                        ctx.arc(centerX, centerY, zodiacBandOuter - (bandWidth / 8), endAngle, startAngle);
                        ctx.lineWidth = bandWidth / 4;
                        // Use the fade value for opacity
                        ctx.strokeStyle = `rgba(${hexToRgb(ZODIAC_SPECTRUM_COLORS[s])}, ${0.6 * fade})`;
                        ctx.stroke();
                        
                        // Add glow
                        ctx.shadowBlur = 15 * fade;
                        ctx.shadowColor = `rgba(${hexToRgb(ZODIAC_SPECTRUM_COLORS[s])}, ${fade})`;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }

                    // Zodiac Segment Divider Line
                    ctx.beginPath();
                    ctx.moveTo(centerX + Math.cos(startAngle) * zodiacBandInner, centerY + Math.sin(startAngle) * zodiacBandInner);
                    ctx.lineTo(centerX + Math.cos(startAngle) * zodiacBandOuter, centerY + Math.sin(startAngle) * zodiacBandOuter);
                    ctx.strokeStyle = `rgba(${hexToRgb(COSMIC_THEME.octaveColors[o])}, 0.6)`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Render Curved Zodiac Text Labels
                    if (showLabels) {
                        const word = zodiacNames[s].toUpperCase();
                        
                        // Place text on the outside of the ring per user request
                        const textRadius = zodiacBandOuter + (10 / transform.scale);
                        
                        ctx.fillStyle = sectorOccupancy[s] ? '#fff' : `rgba(255, 255, 255, 0.4)`;
                        ctx.textBaseline = 'middle';
                        ctx.textAlign = 'center';

                        const midAngle = startAngle - (15 * Math.PI / 180); 
                        
                        // User Request: Keep all zodiac names the same letter spacing as the longest word for compact text
                        const maxWordLength = 11; // SAGITTARIUS (11 chars)
                        const maxArcSpan = 18 * (Math.PI / 180); // Span of the longest word (approx 18 degrees within a 30-deg sector)
                        const angleStep = maxArcSpan / (maxWordLength - 1); // Fixed angular gap between letters
                        
                        // Calculate total span for the *current* word based on the fixed gap
                        const wordArcSpan = angleStep * Math.max(1, word.length - 1);
                        let currentAngle = midAngle - wordArcSpan / 2;

                        ctx.font = `bold ${10 / transform.scale}px monospace`;
                        for (let i = 0; i < word.length; i++) {
                            const char = word[i];
                            const cx = centerX + Math.cos(currentAngle) * textRadius;
                            const cy = centerY + Math.sin(currentAngle) * textRadius;
                            
                            ctx.save();
                            ctx.translate(cx, cy);
                            
                            // Un-invert the Y scale just for the text render, and calculate rotation
                            // The canvas scale is (S, -S). We must flip Y to (1, -1) relative to current state.
                            ctx.scale(1, -1);
                            
                            // Now that text is upright, we rotate it naturally along the curve
                            // Note: Because Y was flipped globally, our mathematical tangency has changed
                            ctx.rotate(-currentAngle - Math.PI / 2);
                            
                            // If occupied, throw a massive neon shadow behind the white text for ultimate spectrum pop
                            if (sectorOccupancy[s]) {
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = ZODIAC_SPECTRUM_COLORS[s];
                            }
                            
                            ctx.fillText(char, 0, 0);
                            ctx.restore();
                            
                            currentAngle += angleStep;
                        }
                    }
                }
            }
            
            // Populate the Sidebar Reference for the React UI overlay
            sidebarObjectsRef.current = allNodes.map(n => ({ name: n.displayName, color: n.color, octave: n.octaveLevel }));

            // Trace lines and physics simulations have been removed to preserve the Star Chart purity

            // 3. Draft Dynamic Acoustic Interference (DAI) Tracers
            // Instead of a static matrix, planets act as active oscillators. 
            // We draw lines between them to represent constructive interference paths.
            ctx.strokeStyle = `rgba(${hexToRgb(COSMIC_THEME.secondary)}, 0.15)`;
            ctx.lineWidth = 1;
            
            // Render the resonant web: Connect nodes if their "frequencies" allow constructive interference
            // To prevent O(N^2) lag and visual clutter, we strictly limit connections based on:
            // 1. Proximity (Energy dissipates over distance squared)
            // 2. Phase Alignment (Nodes in similar quadrants resonate stronger)
            
            const MAX_CONNECTION_DIST = maxRadiusPx * 2; // Flat 2D allows wider bridging

            // (Removed clipping mask here so lines can successfully travel from inner to outer rings and connect directly to planets)

            for (let i = 0; i < allNodes.length; i++) {
                for (let j = i + 1; j < allNodes.length; j++) {
                    const n1 = allNodes[i];
                    const n2 = allNodes[j];
                    
                    // User Request: "Each octave is its own layer with its own lines. 
                    // Each object needs to have its lines connected for each individual octave"
                    if (n1.octaveLevel !== n2.octaveLevel) continue; 
                    
                    // Resonance check: Sacred Geometry / Harmonic Aspects
                    let phaseDiffDeg = Math.abs(n1.angle - n2.angle) * (180 / Math.PI);
                    phaseDiffDeg = phaseDiffDeg % 360;
                    if (phaseDiffDeg > 180) phaseDiffDeg = 360 - phaseDiffDeg;

                    const tolerance = activePattern ? 2 : 6; // Tighter tolerance (2°) for pattern lock extraction
                    let isResonant = false;
                    let isPolygonEdge = false;

                    if (activePattern === 'HEX') {
                        // Hexagon Perimeter (60 degrees apart)
                        isResonant = Math.abs(phaseDiffDeg - 60) < tolerance;
                        isPolygonEdge = true;
                    } else if (activePattern === 'ATOMIC') {
                        // Square Perimeter (90 degrees apart)
                        isResonant = Math.abs(phaseDiffDeg - 90) < tolerance;
                        isPolygonEdge = true;
                    } else if (activePattern === 'ANTENNAE') {
                        // Dodecagram / Trine Perimeter (30 or 120 degrees apart)
                        isResonant = Math.abs(phaseDiffDeg - 30) < tolerance || Math.abs(phaseDiffDeg - 120) < tolerance;
                        isPolygonEdge = true;
                    } else {
                        // General Harmonic Spiderweb (0, 60, 90, 120, 180)
                        const isConjunction = phaseDiffDeg < tolerance;
                        const isSextile = Math.abs(phaseDiffDeg - 60) < tolerance;
                        const isSquare = Math.abs(phaseDiffDeg - 90) < tolerance;
                        const isTrine = Math.abs(phaseDiffDeg - 120) < tolerance;
                        const isOpposition = Math.abs(phaseDiffDeg - 180) < tolerance;
                        
                        // Force lines between all 7 foundation Pillars to ensure the Octave Web is drawn
                        const isFoundationWeb = n1.isPillar && n2.isPillar;
                        
                        isResonant = isConjunction || isSextile || isSquare || isTrine || isOpposition || isFoundationWeb;
                    }
                    
                    const isPillarAlignment = n1.isPillar && n2.isPillar && phaseDiffDeg < tolerance;
                    
                    if (isResonant) {
                        
                        
                        // Simple spatial distance check for intensity fading
                        const dx = n2.x - n1.x;
                        const dy = n2.y - n1.y; 
                        const distSq = (dx * dx) + (dy * dy);
                        
                        const p1y = n1.y; 
                        const p2y = n2.y;

                        ctx.beginPath();
                        ctx.moveTo(n1.x, p1y);
                        ctx.lineTo(n2.x, p2y);
                        
                        // Solid styling
                        const intensity = activePattern ? 1.0 : 0.5;
                        
                        if (isPolygonEdge) {
                            // Explicit Polygon Blueprint Styling
                            let edgeColor = '255, 255, 255';
                            if (activePattern === 'ATOMIC') edgeColor = '244, 63, 94'; // Red for atomic
                            if (activePattern === 'HEX') edgeColor = '239, 68, 68'; // Red for Hex
                            if (activePattern === 'ANTENNAE') edgeColor = '234, 179, 8'; // Yellow for Antennae

                            ctx.strokeStyle = `rgba(${edgeColor}, ${intensity * 0.9})`;
                            ctx.lineWidth = 2.0;

                            // Add a soft glow behind the exact geometric locks
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = `rgba(${edgeColor}, 1)`;
                        } else {
                            // Astrological Aspect Coloring
                            let aspectRgb = hexToRgb(COSMIC_THEME.secondary);
                            if (Math.abs(phaseDiffDeg - 90) < tolerance || Math.abs(phaseDiffDeg - 180) < tolerance) {
                                aspectRgb = '239, 68, 68'; // Hard Aspect: Red
                            } else if (Math.abs(phaseDiffDeg - 60) < tolerance || Math.abs(phaseDiffDeg - 120) < tolerance) {
                                aspectRgb = '59, 130, 246'; // Soft Aspect: Blue
                            } else if (phaseDiffDeg < tolerance) {
                                aspectRgb = '234, 179, 8'; // Conjunction: Yellow
                            }

                            ctx.strokeStyle = `rgba(${aspectRgb}, ${intensity * 0.6})`;
                            if (n1.isPillar && n2.isPillar) {
                                ctx.lineWidth = 1.2;
                            } else {
                                ctx.lineWidth = 0.5;
                            }
                            ctx.shadowBlur = 0;
                        }
                        
                        ctx.stroke();
                        
                        // Reset shadow
                        ctx.shadowBlur = 0;
                        
                        // Track drawn lines for Alignment Detector
                        drawnLines.push({ x1: n1.x, y1: p1y, x2: n2.x, y2: p2y, isPillar: n1.isPillar && n2.isPillar });
                    }
                }
            }

            // 3. Draw Orbiting Nodes and Labels (On top of branches)
            Object.keys(nodesByOctave).map(Number).sort((a, b) => a - b).forEach(o => {
                nodesByOctave[o].forEach(node => {
                    const nodeSize = node.isPillar ? 5 : 3;
                    
                    let isAligned = false;
                    if (showStabilityNodes) {
                        for (const line of drawnLines) {
                            // If distance to acoustic branch < 3px
                            if (distToSegmentSquared(node.x, node.y, line.x1, line.y1, line.x2, line.y2) < 9) { 
                                isAligned = true;
                                break;
                            }
                        }
                    }

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, isAligned ? nodeSize * 1.5 : nodeSize, 0, Math.PI * 2);
                    ctx.fillStyle = isAligned ? '#ffffff' : node.color;
                    ctx.fill();

                    if (isAligned || node.isPillar) {
                        ctx.shadowBlur = isAligned ? 15 : 10;
                        ctx.shadowColor = isAligned ? '#ffffff' : node.color;
                        ctx.fill();
                        ctx.shadowBlur = 0; 
                    }

                    if (angles[node.body.name] !== undefined || (activePreset === 'LIVE' && ['Earth', 'Jupiter', 'Sirius A', 'Sun'].includes(node.body.name)) || node.isPillar || isAligned) {
                        ctx.fillStyle = isAligned ? '#ffffff' : (node.isPillar ? node.color : '#fff');
                        
                        // Inverse scale the font size so it remains readable regardless of zoom
                        const baseFontSize = node.isPillar ? 11 : 10;
                        const scaledFontSize = baseFontSize / transform.scale;

                        const displayNameToRender = node.displayName || node.body.name;
                        if (showLabels && displayNameToRender !== 'Predicted') {
                            ctx.save();
                            // Text anchor is slightly offset from the body core
                            ctx.translate(node.x + (8 / transform.scale), node.y + (8 / transform.scale));
                            ctx.scale(1, -1); // Un-invert canvas for upright text
                            ctx.font = `${node.isPillar ? 'bold ' : ''}${scaledFontSize}px monospace`;
                            ctx.fillText(displayNameToRender, 0, 0);
                            ctx.restore();
                        }
                    }
                });
            });
            
            // 4. Critical Alignment Detector Sweep
            if (alignmentDetectorActive) {
                
                // If we are already locked on an alignment, just draw it (don't sweep)
                if (detectedAlignment) {
                    const b1 = allNodes.find(n => (n.body?.name || n.proxyName || n.displayName) === detectedAlignment.bodies[0]);
                    const b2 = allNodes.find(n => (n.body?.name || n.proxyName || n.displayName) === detectedAlignment.bodies[1]);
                    
                    if (b1 && b2) {
                        const expectedAngle = detectedAlignment.angle; // 0, 180, or 137.5
                        
                        // Calculate their current raw difference
                        let rawDelta = (b1.angle * (180 / Math.PI)) - (b2.angle * (180 / Math.PI));
                        rawDelta = ((rawDelta % 360) + 360) % 360; // 0 to 360
                        if (rawDelta > 180) rawDelta -= 360; // -180 to 180
                        const currentAbs = Math.abs(rawDelta);
                        
                        // Check if they drifted out of phase (1.5 degrees tolerance)
                        if (Math.abs(currentAbs - expectedAngle) > 1.5) {
                            setDetectedAlignment(null);
                        } else {
                            const isSyzygy = detectedAlignment.type === 'SYZYGY';
                            
                            // Apply pan/zoom transform to the Center Origin so the lines anchor to the visual center
                            const transformedCenterX = (centerX * transform.scale) + transform.x;
                            const transformedCenterY = (centerY * transform.scale) + transform.y;
                            
                            ctx.beginPath();
                            ctx.moveTo(b1.x, b1.y);
                            if (!isSyzygy) ctx.lineTo(transformedCenterX, transformedCenterY);
                            ctx.lineTo(b2.x, b2.y);
                            ctx.strokeStyle = isSyzygy ? 'rgba(239, 68, 68, 0.8)' : 'rgba(234, 179, 8, 0.8)';
                            ctx.lineWidth = (isSyzygy ? 3 : 2) / transform.scale;
                            ctx.stroke();
                            ctx.shadowBlur = 15;
                            ctx.shadowColor = isSyzygy ? '#ef4444' : '#eab308';
                            ctx.stroke();
                            ctx.shadowBlur = 0;
                            
                            ctx.save();
                            ctx.translate(transformedCenterX, transformedCenterY - (120 / transform.scale));
                            ctx.scale(1, -1); // Un-invert Text
                            ctx.font = `bold ${24 / transform.scale}px monospace`;
                            ctx.fillStyle = isSyzygy ? '#ef4444' : '#eab308';
                            ctx.textAlign = 'center';
                            ctx.fillText('CRITICAL ALIGNMENT DETECTED', 0, 0);
                            
                            ctx.font = `${14 / transform.scale}px monospace`;
                            ctx.fillStyle = '#ffffff';
                            const label = isSyzygy ? (expectedAngle === 0 ? '0° CONJUNCTION' : '180° OPPOSITION') : '137.5° GOLDEN RATIO VECTOR';
                            // Note: Y drops *UP* relative to our inverted canvas, so we add positive values instead of negative for visual "down"
                            ctx.fillText(`${label}: ${b1.body?.name || b1.proxyName} ⟷ ${b2.body?.name || b2.proxyName}`, 0, 30 / transform.scale);
                            
                            // Draw Exact Degree Measurement near Center
                            const degreeText = `${currentAbs.toFixed(2)}°`;
                            ctx.font = `bold ${16 / transform.scale}px monospace`;
                            ctx.fillStyle = isSyzygy ? '#ef4444' : '#eab308';
                            ctx.fillText(degreeText, 0, -150 / transform.scale);
                            ctx.restore();
                        }
                    }
                } else {
                    // Find coordinates for major players
                    const trackedNames = ['Earth', 'Sun', 'Moon', 'Jupiter', 'Sirius A', 'Venus'];
                    const bodies = allNodes.filter(n => trackedNames.includes(n.body?.name || n.proxyName || n.displayName));
                
                let foundAlignment = false;

                for (let i = 0; i < bodies.length; i++) {
                    for (let j = i + 1; j < bodies.length; j++) {
                        const b1 = bodies[i];
                        const b2 = bodies[j];

                        const name1 = b1.body?.name || b1.proxyName || b1.displayName;
                        const name2 = b2.body?.name || b2.proxyName || b2.displayName;
                        const pairKey = `${name1}-${name2}`;

                        // STRICT MATHEMATICAL NORMALIZATION
                        // 1. Calculate the exact 0-360 degree position of each body on the circle
                        const a1 = ((b1.angle * (180 / Math.PI)) % 360 + 360) % 360;
                        const a2 = ((b2.angle * (180 / Math.PI)) % 360 + 360) % 360;

                        // 2. Calculate the shortest distance between them (-180 to 180)
                        let rawDelta = a1 - a2;
                        if (rawDelta > 180) rawDelta -= 360;
                        if (rawDelta < -180) rawDelta += 360;

                        const prevRaw = prevAnglesRef.current[pairKey];
                        const currentAbs = Math.abs(rawDelta);
                        
                        let triggeredSyzygy = false;
                        let triggeredGolden = false;
                        let lockedAngle = currentAbs;
                        
                        // TOLERANCE WINDOW
                        // At 100x playback speed, planets jump massive degrees per frame.
                        // We must expand the catch threshold to ensure fast-moving nodes don't teleport past the line undetected.
                        const tolerance = 2.5;

                        // 1. Direct Hit Check
                        if (currentAbs < tolerance) {
                            triggeredSyzygy = true;
                            lockedAngle = 0;
                        } else if (Math.abs(currentAbs - 180) < tolerance) {
                            triggeredSyzygy = true;
                            lockedAngle = 180;
                        } else if (prevRaw !== undefined) {
                            // 2. High-Speed Delta Crossover Check
                            // We check if the signs flipped between the previous frame and this frame,
                            // AND they didn't just wrap around the back of the circle (distance check < 90 deg)
                            
                            // Passing 0° (Conjunction) -> e.g., -5° to +5°
                            if ((prevRaw < 0 && rawDelta > 0) || (prevRaw > 0 && rawDelta < 0)) {
                                if (Math.abs(rawDelta - prevRaw) < 90) {
                                    triggeredSyzygy = true;
                                    lockedAngle = 0;
                                }
                            }
                            
                            // Passing 180° / -180° (Opposition) -> (+175° to -175°)
                            if ((prevRaw > 90 && rawDelta < -90) || (prevRaw < -90 && rawDelta > 90)) {
                                triggeredSyzygy = true;
                                lockedAngle = 180;
                            }
                        }
                        
                        // Golden Ratio (137.5 or -137.5)
                        if (Math.abs(currentAbs - 137.5) < tolerance) {
                            triggeredGolden = true;
                            lockedAngle = 137.5;
                        } else if (prevRaw !== undefined) {
                             // Crossover for Golden Ratio
                             // Passing +137.5
                             if ((prevRaw < 137.5 && rawDelta + tolerance >= 137.5) ||
                                 (prevRaw > 137.5 && rawDelta - tolerance <= 137.5)) {
                                  if (Math.abs(rawDelta - prevRaw) < 90) {
                                      triggeredGolden = true;
                                      lockedAngle = 137.5;
                                  }
                             }
                             // Passing -137.5
                             if ((prevRaw < -137.5 && rawDelta + tolerance >= -137.5) ||
                                 (prevRaw > -137.5 && rawDelta - tolerance <= -137.5)) {
                                  if (Math.abs(rawDelta - prevRaw) < 90) {
                                      triggeredGolden = true;
                                      lockedAngle = 137.5;
                                  }
                             }
                        }

                        // Store current delta for the next frame
                        prevAnglesRef.current[pairKey] = rawDelta;

                        if (triggeredSyzygy) {
                            setDetectedAlignment({ type: 'SYZYGY', bodies: [name1, name2], angle: lockedAngle });
                            if (isPlaying) setIsPlaying(false); // Pause Engine on lock
                            foundAlignment = true;
                            break;
                        }

                        if (triggeredGolden) {
                            setDetectedAlignment({ type: 'GOLDEN_RATIO', bodies: [name1, name2], angle: lockedAngle });
                            if (isPlaying) setIsPlaying(false); // Pause Engine on lock
                            foundAlignment = true;
                            break;
                        }
                    }
                    if (foundAlignment) break;
                }
                } // End else
            } // End alignmentDetectorActive
            // Draw Origin
            ctx.beginPath();
            ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 0;
            
            // Advance simulation time if playing (Any active preset or live view)
            if (isPlaying) {
                 // 60 frames roughly a second. playbackSpeed is days per real second (so / 60)
                 simTimeRef.current += (playbackSpeed * 1000 * 60 * 60 * 24) / 60;
                 // Avoid setting React state here 60 times a second to prevent lag
            }

            // Continue animation loop
            animationFrameId = requestAnimationFrame(drawCanvas);
        };

        // Start loop
        drawCanvas();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [activePreset, visibleOctaves, isPlaying, playbackSpeed, activePattern, showStabilityNodes, chartPerspective, showLabels, alignmentDetectorActive, detectedAlignment]);

    // Update Date state throttled for the UI
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlaying) {
                setSimDate(new Date(simTimeRef.current));
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isPlaying, activePreset]);

    // --- INTERACTIVITY HANDLERS ---
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        // Prevent default window scroll
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Zoom parameters
        const zoomSensitivity = 0.0004; // Smaller zoom increments
        const delta = -e.deltaY * zoomSensitivity;
        
        const t = targetTransformRef.current;
        let newScale = t.scale * Math.exp(delta);
        
        // Clamp scale
        newScale = Math.max(0.1, Math.min(newScale, 50)); 

        targetTransformRef.current = { scale: newScale, x: t.x, y: t.y };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Dismiss detector lock on click anywhere
        if (alignmentDetectorActive && detectedAlignment) {
            setDetectedAlignment(null);
            
            // Re-enable playback automatically when dismissing an alignment lock
            setIsPlaying(true);
            return;
        }

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        const t = targetTransformRef.current;
        targetTransformRef.current = { ...t, x: t.x + dx, y: t.y + dy };
        // Instantly snap current transform so panning 1:1 tracks the mouse without lag
        currentTransformRef.current.x += dx;
        currentTransformRef.current.y += dy;

        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => {
        const t = targetTransformRef.current;
        const newScale = Math.min(t.scale * 1.25, 50);
        targetTransformRef.current = { x: t.x, y: t.y, scale: newScale };
    };
    
    const handleZoomOut = () => {
        const t = targetTransformRef.current;
        const newScale = Math.max(t.scale / 1.25, 0.1);
        targetTransformRef.current = { x: t.x, y: t.y, scale: newScale };
    };
    
    // Attempt to prevent scroll lock on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const preventScroll = (e: WheelEvent) => {
            e.preventDefault();
        };
        canvas.addEventListener('wheel', preventScroll, { passive: false });
        return () => canvas.removeEventListener('wheel', preventScroll);
    }, []);

    const toggleOctave = (index: number) => {
        setVisibleOctaves(prev => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    return (
        <div ref={containerRef} style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: COSMIC_THEME.background,
            color: COSMIC_THEME.text.main,
            fontFamily: 'monospace',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', color: COSMIC_THEME.accent, fontWeight: 300 }}>Fractal Pattern Generator</h1>
                    <p style={{ margin: 0, color: COSMIC_THEME.text.muted, fontSize: '0.9rem' }}>
                        Multi-Octave Orbit Alignment Matrix — Simulating Phi-Ratio Spatiotemporal Resonance
                    </p>
                </div>
                <button 
                    onClick={toggleFullscreen}
                    style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: `1px solid ${COSMIC_THEME.primary}`,
                        color: COSMIC_THEME.primary,
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'}
                >
                    ⛶ FULLSCREEN
                </button>
            </div>

            {/* OCTAVES SHELF (TOP) */}
            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                marginBottom: '20px', 
                background: COSMIC_THEME.surfaceRgba, 
                border: `1px solid ${COSMIC_THEME.border}`, 
                borderRadius: '8px', 
                padding: '12px',
                justifyContent: 'center', // Center the octave badges
                alignItems: 'center'
            }}>
                <span style={{ color: COSMIC_THEME.text.muted, fontSize: '0.8rem', marginRight: '10px' }}>COSMIC OCTAVES:</span>
                {COSMIC_THEME.octaveColors.map((color, idx) => (
                    <OctaveBadge 
                        key={idx}
                        index={idx}
                        color={color}
                        active={visibleOctaves[idx]}
                        onToggle={() => toggleOctave(idx)}
                    />
                ))}
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div style={{ display: 'flex', gap: '20px', flexGrow: 1, minHeight: 0 }}> 

                {/* LEFT: CALIBRATION & CONTROLS */}
                <div style={{
                    minWidth: '350px',
                    width: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    overflowY: 'auto',
                    paddingRight: '5px' // scrollbar spacing
                }}>
                    
                    {/* PANEL 3: Discovery Tools (Moved to Top) */}
                    <div style={{
                        background: COSMIC_THEME.surfaceRgba,
                        border: `1px solid ${COSMIC_THEME.border}`,
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        
                        <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: `1px solid ${COSMIC_THEME.border}` }}>
                            <div style={{ fontSize: '0.8rem', color: COSMIC_THEME.accent, marginBottom: '10px' }}>ASTROLOGICAL TEMPORAL SCRUBBER</div>
                            <div style={{ marginBottom: '10px' }}>
                                <input 
                                    type="datetime-local" 
                                    value={simDate.toISOString().substring(0, 16)}
                                    onChange={(e) => {
                                        const d = new Date(e.target.value + 'Z');
                                        if (!isNaN(d.getTime())) {
                                            simTimeRef.current = d.getTime();
                                            setSimDate(d);
                                            setActivePreset('LIVE'); // Switch to live control if manually edited
                                            setIsPlaying(false); // Pause generation when a specific date is selected
                                        }
                                    }}
                                    style={{ 
                                        background: 'rgba(0,0,0,0.5)', 
                                        color: '#fff', 
                                        border: `1px solid ${COSMIC_THEME.primary}`, 
                                        padding: '8px', 
                                        borderRadius: '4px', 
                                        fontFamily: 'monospace', 
                                        fontSize: '1rem',
                                        width: '100%',
                                        colorScheme: 'dark' // Forces native dark mode widget icon
                                    }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                <button onClick={() => setPlaybackSpeed(s => Math.max(s - 5, -50))} style={{ cursor: 'pointer', background: '#333', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '0.8rem', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 0 1px #fff'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>&laquo; Slower</button>
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)} 
                                    style={{ flex: 1, cursor: 'pointer', background: isPlaying ? COSMIC_THEME.p0 : '#22c55e', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = `0 0 10px ${isPlaying ? COSMIC_THEME.p0 : '#22c55e'}`;
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {isPlaying ? 'PAUSE' : 'PLAY'}
                                </button>
                                <button onClick={() => setPlaybackSpeed(s => Math.min(s + 5, 50))} style={{ cursor: 'pointer', background: '#333', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', fontSize: '0.8rem', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 0 1px #fff'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>Faster &raquo;</button>
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                <button 
                                    onClick={() => {
                                        const newTime = simTimeRef.current - (24 * 60 * 60 * 1000); // Back 1 Day
                                        simTimeRef.current = newTime;
                                        setSimDate(new Date(newTime));
                                        setActivePreset('LIVE');
                                        setIsPlaying(false);
                                    }} 
                                    style={{ flex: 1, cursor: 'pointer', background: 'transparent', color: COSMIC_THEME.primary, border: `1px solid ${COSMIC_THEME.primary}`, padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 0 8px ${COSMIC_THEME.primary}`; }}
                                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => {
                                        const newTime = simTimeRef.current + (24 * 60 * 60 * 1000); // Forward 1 Day
                                        simTimeRef.current = newTime;
                                        setSimDate(new Date(newTime));
                                        setActivePreset('LIVE');
                                        setIsPlaying(false);
                                    }} 
                                    style={{ flex: 1, cursor: 'pointer', background: 'transparent', color: COSMIC_THEME.primary, border: `1px solid ${COSMIC_THEME.primary}`, padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 0 8px ${COSMIC_THEME.primary}`; }}
                                    onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    Forward
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: COSMIC_THEME.text.muted }}>Speed: {playbackSpeed}x</span>
                                <button 
                                    onClick={() => { simTimeRef.current = Date.now(); setSimDate(new Date()); setPlaybackSpeed(1); setActivePreset('LIVE'); setIsPlaying(false); }} 
                                    style={{ cursor: 'pointer', background: 'transparent', border: `1px solid ${COSMIC_THEME.border}`, color: COSMIC_THEME.primary, padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = COSMIC_THEME.primary; e.currentTarget.style.boxShadow = `0 0 4px ${COSMIC_THEME.primary}`; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = COSMIC_THEME.border; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    Reset to Now
                                </button>
                            </div>
                        </div>

                            {/* PERSPECTIVE / VIEW TOGGLES */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    onClick={() => { setViewMode('ORBITAL'); setChartPerspective('GEOCENTRIC'); }}
                                    style={{
                                        flex: 1,
                                        background: viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                        border: `1px solid ${viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC' ? COSMIC_THEME.primary : '#333'}`,
                                        color: viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC' ? '#fff' : COSMIC_THEME.text.muted,
                                        padding: '8px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.2s', fontSize: '0.8rem',
                                        boxShadow: viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC' ? `0 0 10px ${COSMIC_THEME.primary}` : 'none'
                                    }}
                                    onMouseOver={(e) => { if(!(viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC')) e.currentTarget.style.borderColor = '#fff' }}
                                    onMouseOut={(e) => { if(!(viewMode === 'ORBITAL' && chartPerspective === 'GEOCENTRIC')) e.currentTarget.style.borderColor = '#333' }}
                                >Earth Centric</button>
                                <button 
                                    onClick={() => { setViewMode('ORBITAL'); setChartPerspective('HELIOCENTRIC'); }}
                                    style={{
                                        flex: 1,
                                        background: viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                        border: `1px solid ${viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC' ? COSMIC_THEME.primary : '#333'}`,
                                        color: viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC' ? '#fff' : COSMIC_THEME.text.muted,
                                        padding: '8px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.2s', fontSize: '0.8rem',
                                        boxShadow: viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC' ? `0 0 10px ${COSMIC_THEME.primary}` : 'none'
                                    }}
                                    onMouseOver={(e) => { if(!(viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC')) e.currentTarget.style.borderColor = '#fff' }}
                                    onMouseOut={(e) => { if(!(viewMode === 'ORBITAL' && chartPerspective === 'HELIOCENTRIC')) e.currentTarget.style.borderColor = '#333' }}
                                >Sun Centric</button>
                                <button 
                                    onClick={() => setViewMode('GEOMETRY')}
                                    style={{
                                        flex: 1,
                                        background: viewMode === 'GEOMETRY' ? `rgba(${hexToRgb(COSMIC_THEME.accent)}, 0.2)` : 'transparent',
                                        border: `1px solid ${viewMode === 'GEOMETRY' ? COSMIC_THEME.accent : '#333'}`,
                                        color: viewMode === 'GEOMETRY' ? '#fff' : COSMIC_THEME.text.muted,
                                        padding: '8px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.2s', fontSize: '0.8rem',
                                        fontWeight: viewMode === 'GEOMETRY' ? 'bold' : 'normal',
                                        boxShadow: viewMode === 'GEOMETRY' ? `0 0 10px ${COSMIC_THEME.accent}` : 'none'
                                    }}
                                    onMouseOver={(e) => { if(viewMode !== 'GEOMETRY') e.currentTarget.style.borderColor = COSMIC_THEME.accent }}
                                    onMouseOut={(e) => { if(viewMode !== 'GEOMETRY') e.currentTarget.style.borderColor = '#333' }}
                                >
                                    GEOMETRY
                                </button>
                            </div>
                    </div>

                    {/* PANEL 0: Anchor Presets */}
                    <div style={{
                        background: COSMIC_THEME.surfaceRgba,
                        border: `1px solid ${COSMIC_THEME.border}`,
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: COSMIC_THEME.secondary, borderBottom: `1px solid ${COSMIC_THEME.border}`, paddingBottom: '8px' }}>
                            ANCHOR EPOCH
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <PresetButton 
                                active={activePreset === 'LIVE'} 
                                onClick={() => {
                                    // Live jumps to current real-world time by default
                                    simTimeRef.current = Date.now();
                                    setSimDate(new Date());
                                    setActivePreset('LIVE');
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; // Planetary Structural Default
                                    setVisibleOctaves(newVis);
                                }}
                                label="Live Temporal Data" 
                            />
                            <PresetButton 
                                active={activePreset === 'ECLIPSE_2024'} 
                                onClick={() => {
                                    simTimeRef.current = getPresetTime('ECLIPSE_2024');
                                    setSimDate(new Date(getPresetTime('ECLIPSE_2024')));
                                    setActivePreset('ECLIPSE_2024');
                                    setIsPlaying(false);
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; 
                                    setVisibleOctaves(newVis);
                                }}
                                label="April 8, 2024 (Solar Eclipse)" 
                            />
                            <PresetButton 
                                active={activePreset === 'PLANETARY_PARADE_2026'} 
                                onClick={() => {
                                    simTimeRef.current = getPresetTime('PLANETARY_PARADE_2026');
                                    setSimDate(new Date(getPresetTime('PLANETARY_PARADE_2026')));
                                    setActivePreset('PLANETARY_PARADE_2026');
                                    setIsPlaying(false);
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; 
                                    setVisibleOctaves(newVis);
                                }}
                                label="Feb 28, 2026 (Planetary Parade)" 
                            />
                            <PresetButton 
                                active={activePreset === 'SPRING_EQUINOX_2026'} 
                                onClick={() => {
                                    simTimeRef.current = getPresetTime('SPRING_EQUINOX_2026');
                                    setSimDate(new Date(getPresetTime('SPRING_EQUINOX_2026')));
                                    setActivePreset('SPRING_EQUINOX_2026');
                                    setIsPlaying(false);
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; 
                                    setVisibleOctaves(newVis);
                                }}
                                label="Mar 20, 2026 (Spring Equinox)" 
                            />
                            <PresetButton 
                                active={activePreset === 'BETHLEHEM_3AD'} 
                                onClick={() => {
                                    simTimeRef.current = getPresetTime('BETHLEHEM_3AD');
                                    setSimDate(new Date(getPresetTime('BETHLEHEM_3AD')));
                                    setActivePreset('BETHLEHEM_3AD');
                                    setIsPlaying(false);
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; 
                                    setVisibleOctaves(newVis);
                                }}
                                label="3 AD (Jup/Ven/Regulus Conjunction)" 
                            />
                            <PresetButton 
                                active={activePreset === 'GIZA_EPOCH'} 
                                onClick={() => {
                                    simTimeRef.current = getPresetTime('GIZA_EPOCH');
                                    setSimDate(new Date(getPresetTime('GIZA_EPOCH')));
                                    setActivePreset('GIZA_EPOCH');
                                    setIsPlaying(false);
                                    setViewMode('ORBITAL');
                                    setChartPerspective('GEOCENTRIC');
                                    
                                    // FLUSH GEOMETRY STATE
                                    setActivePattern(null);
                                    targetTransformRef.current = { x: 0, y: 0, scale: 1.0 };
                                    const newVis = Array(15).fill(false);
                                    newVis[11] = true; 
                                    setVisibleOctaves(newVis);
                                }}
                                label="Giza Epoch (Sirius/Orion)" 
                            />
                        </div>
                    </div>


                    {/* PANEL 2: Application Theory */}
                    <div style={{
                        background: COSMIC_THEME.surfaceRgba,
                        border: `1px solid ${COSMIC_THEME.border}`,
                        borderLeft: `3px solid ${COSMIC_THEME.p0}`, // Alert Red styling 
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: COSMIC_THEME.p0, borderBottom: `1px solid ${COSMIC_THEME.border}`, paddingBottom: '8px' }}>
                            PATTERN EXTRACTS
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: COSMIC_THEME.text.muted, margin: '0 0 15px 0' }}>
                            Apply macro-cosmic fractals to micro-technology blueprints.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <ApplicationButton 
                                title="Acoustic Atomic Lattices"
                                desc="Octave 4 Geometry → Crystal Prints"
                                color="#f43f5e"
                            />
                            <ApplicationButton 
                                title="Zero-Impedance Hex-Cells"
                                desc="Octave 5 Alignments → Battery Lattices"
                                color="#ef4444"
                            />
                            <ApplicationButton 
                                title="Omni-Directional Antennae"
                                desc="Octave 7 Web → Metamaterial Scopes"
                                color="#eab308"
                            />
                        </div>
                    </div>



                </div>

                {/* RIGHT: MAIN VISUALIZATION OR GEOMETRY VAULT */}
                {viewMode === 'ORBITAL' ? (
                    <div style={{
                        flexGrow: 1,
                        background: COSMIC_THEME.surface,
                        border: `1px solid ${COSMIC_THEME.border}`,
                        borderRadius: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <canvas 
                            ref={canvasRef} 
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'block',
                                cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                        />
                        
                        {/* HUD Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                        }}>
                            <div style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', border: `1px solid ${COSMIC_THEME.border}` }}>
                                <div style={{ color: COSMIC_THEME.accent, fontSize: '0.8rem', opacity: 0.8, marginBottom: '2px', pointerEvents: 'none' }}>
                                    ACTIVE LAYERS: {visibleOctaves.filter(Boolean).length}
                                </div>
                                <div style={{ color: COSMIC_THEME.accent, fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px', pointerEvents: 'none' }}>
                                    ZOOM: {(uiZoom * 100).toFixed(0)}%
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', width: '100%' }}>
                                    <button onClick={handleZoomOut} style={{ cursor: 'pointer', background: 'rgba(14, 165, 233, 0.2)', border: `1px solid ${COSMIC_THEME.primary}`, color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 0 10px ${COSMIC_THEME.primary}` }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none' }}>-</button>
                                    <button onClick={handleZoomIn} style={{ cursor: 'pointer', background: 'rgba(14, 165, 233, 0.2)', border: `1px solid ${COSMIC_THEME.primary}`, color: '#fff', padding: '6px 8px', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 0 10px ${COSMIC_THEME.primary}` }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none' }}>+</button>
                                </div>
                                <div style={{ marginTop: '8px' }}>
                                    <button 
                                        onClick={() => setShowLabels(!showLabels)} 
                                        style={{ 
                                            cursor: 'pointer', 
                                            background: showLabels ? 'rgba(14, 165, 233, 0.3)' : 'rgba(255,255,255,0.1)', 
                                            border: `1px solid ${showLabels ? COSMIC_THEME.primary : 'transparent'}`, 
                                            color: '#fff', 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.7rem',
                                            width: '100%',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {showLabels ? 'HIDE LABELS' : 'SHOW LABELS'}
                                    </button>
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                    <button 
                                        onClick={() => setShowUI(!showUI)} 
                                        style={{ 
                                            cursor: 'pointer', 
                                            background: showUI ? 'rgba(14, 165, 233, 0.3)' : 'rgba(255,255,255,0.1)', 
                                            border: `1px solid ${showUI ? COSMIC_THEME.primary : 'transparent'}`, 
                                            color: '#fff', 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.7rem',
                                            width: '100%',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {showUI ? 'HIDE INFO' : 'SHOW INFO'}
                                    </button>
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                    <button 
                                        onClick={() => {
                                            setAlignmentDetectorActive(!alignmentDetectorActive);
                                            if (alignmentDetectorActive) setDetectedAlignment(null);
                                        }}
                                        style={{ 
                                            cursor: 'pointer', 
                                            background: alignmentDetectorActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', 
                                            border: `1px solid ${alignmentDetectorActive ? '#ef4444' : 'transparent'}`, 
                                            color: alignmentDetectorActive ? '#ef4444' : '#fff', 
                                            padding: '4px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.7rem',
                                            width: '100%',
                                            fontFamily: 'monospace',
                                            transition: 'all 0.3s ease',
                                            boxShadow: alignmentDetectorActive ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
                                        }}
                                    >
                                        {alignmentDetectorActive ? 'DETECTING...' : 'HUNT ALIGNMENTS'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Active Objects Sidebar */}
                        {showUI && (
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                maxHeight: 'calc(100% - 150px)',
                                overflowY: 'auto',
                                padding: '10px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '4px',
                                border: `1px solid rgba(255,255,255,0.1)`,
                                backdropFilter: 'blur(4px)',
                                pointerEvents: 'none',
                                minWidth: '200px'
                            }}>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#fff', 
                                    letterSpacing: '0.1em', 
                                    marginBottom: '10px',
                                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                                    paddingBottom: '4px'
                                }}>
                                    TELEMETRY: ACTIVE NODES
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {sidebarObjects.map((obj, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                                            <span style={{ color: obj.color, fontSize: '0.9rem', textShadow: `0 0 5px ${obj.color}` }}>●</span>
                                            <span style={{ color: '#ccc', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                {obj.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Aspect Legend Overlay */}
                        {showUI && (
                            <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                right: '15px',
                            }}>
                                <div style={{ 
                                    padding: '10px', 
                                    background: 'rgba(0,0,0,0.6)', 
                                    borderRadius: '4px', 
                                    border: `1px solid rgba(255,255,255,0.1)`,
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '2px', background: '#eab308', boxShadow: '0 0 4px #eab308' }}></div>
                                        <span style={{ color: '#eab308', fontSize: '0.7rem', width: '28px', textAlign: 'center' }}>☌</span>
                                        <span style={{ color: '#ccc', fontSize: '0.7rem' }}>Conjunction (0°)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '2px', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }}></div>
                                        <span style={{ color: '#ef4444', fontSize: '0.7rem', width: '28px', textAlign: 'center' }}>□ / ☍</span>
                                        <span style={{ color: '#ccc', fontSize: '0.7rem' }}>Hard (90° / 180°)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '2px', background: '#3b82f6', boxShadow: '0 0 4px #3b82f6' }}></div>
                                        <span style={{ color: '#3b82f6', fontSize: '0.7rem', width: '28px', textAlign: 'center' }}>△ / ✱</span>
                                        <span style={{ color: '#ccc', fontSize: '0.7rem' }}>Soft (120° / 60°)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Energy Translation Overlay (Bottom-Left) */}
                        {showUI && (
                            <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                left: '15px',
                                padding: '15px',
                                background: 'rgba(0,0,0,0.65)',
                                border: `1px solid ${COSMIC_THEME.primary}`,
                                boxShadow: COSMIC_THEME.glow,
                                borderRadius: '6px',
                                backdropFilter: 'blur(8px)',
                                pointerEvents: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxWidth: '350px'
                            }}>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: COSMIC_THEME.accent, 
                                    letterSpacing: '0.15em', 
                                    borderBottom: `1px solid rgba(14, 165, 233, 0.3)`,
                                    paddingBottom: '4px',
                                    fontWeight: 'bold',
                                    marginBottom: '4px'
                                }}>
                                    REAL-TIME ENERGY TRANSLATION
                                </div>

                                {energyTranslation.isLocked ? (
                                    <>
                                        {/* Sun Block */}
                                        <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.4', marginBottom: '12px' }}>
                                            <div><span style={{ color: '#facc15', textShadow: '0 0 5px #facc15', marginRight: '6px' }}>●</span> {energyTranslation.sun}</div>
                                            {energyTranslation.mSun && (
                                                <div style={{ color: '#e2e8f0', marginTop: '6px', marginLeft: '16px' }}>
                                                    <span style={{color: '#38bdf8', marginRight: '6px'}}>•</span> 
                                                    <span style={{color: '#fff', fontWeight: 'bold'}}>Meroe Geometry:</span> {energyTranslation.mSun}
                                                </div>
                                            )}
                                            {energyTranslation.vSun && (
                                                <div style={{ color: '#e2e8f0', marginTop: '6px', marginLeft: '16px' }}>
                                                    <span style={{color: '#10b981', marginRight: '6px'}}>•</span> 
                                                    <span style={{color: '#fff', fontWeight: 'bold'}}>Voynich Formula:</span> {energyTranslation.vSun}
                                                </div>
                                            )}
                                        </div>

                                        {/* Moon Block */}
                                        <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.4' }}>
                                            <div><span style={{ color: '#e2e8f0', textShadow: '0 0 5px #e2e8f0', marginRight: '6px' }}>●</span> {energyTranslation.moon}</div>
                                            {energyTranslation.mMoon && (
                                                <div style={{ color: '#e2e8f0', marginTop: '6px', marginLeft: '16px' }}>
                                                    <span style={{color: '#38bdf8', marginRight: '6px'}}>•</span> 
                                                    <span style={{color: '#fff', fontWeight: 'bold'}}>Meroe Geometry:</span> {energyTranslation.mMoon}
                                                </div>
                                            )}
                                            {energyTranslation.vMoon && (
                                                <div style={{ color: '#e2e8f0', marginTop: '6px', marginLeft: '16px' }}>
                                                    <span style={{color: '#10b981', marginRight: '6px'}}>•</span> 
                                                    <span style={{color: '#fff', fontWeight: 'bold'}}>Voynich Formula:</span> {energyTranslation.vMoon}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                                        ⏸️ Pause simulation to lock and extract alignments
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* CRITICAL ALIGNMENT DETECTOR ALERT REMOVED - NOW DRAWN IN NATIVE CANVAS */}
                    </div>
                ) : (
                    <div style={{ flex: 1, overflow: 'hidden', borderRadius: '8px' }}>
                        <FractalGeometryVault 
                            activeOctaves={visibleOctaves.map((v, i) => v ? i : -1).filter(i => i !== -1)}
                            onClose={() => {
                                setViewMode('ORBITAL');
                                simTimeRef.current = Date.now();
                                setSimDate(new Date());
                                setActivePreset('LIVE');
                                setPlaybackSpeed(1);
                                setIsPlaying(true);
                                setChartPerspective('GEOCENTRIC');
                                setUiZoom(1.2);
                                targetTransformRef.current = { scale: 1.2, x: 0, y: 0 };
                                setVisibleOctaves(Array(15).fill(false).map((_, i) => i === 11)); // Reset to Solar
                            }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const PresetButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button 
        onClick={onClick}
        style={{
            background: active ? COSMIC_THEME.border : 'rgba(0,0,0,0.3)',
            border: `1px solid ${active ? COSMIC_THEME.primary : '#333'}`,
            color: active ? '#fff' : COSMIC_THEME.text.muted,
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            boxShadow: active ? `0 0 10px rgba(14, 165, 233, 0.2)` : 'none'
        }}
        onMouseOver={(e) => { if(!active) e.currentTarget.style.borderColor = '#fff' }}
        onMouseOut={(e) => { if(!active) e.currentTarget.style.borderColor = '#333' }}
    >
        {label}
    </button>
);

const ApplicationButton = ({ title, desc, color, onClick }: { title: string, desc: string, color: string, onClick?: () => void }) => (
    <button 
        onClick={onClick}
        style={{
            background: `rgba(${hexToRgb(color)}, 0.1)`,
            border: `1px solid rgba(${hexToRgb(color)}, 0.4)`,
            color: '#fff',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: onClick ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
            if(onClick) {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.boxShadow = `0 0 10px ${color}`;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }
        }}
        onMouseOut={(e) => {
            if(onClick) {
                e.currentTarget.style.borderColor = `rgba(${hexToRgb(color)}, 0.4)`;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }
        }}
    >
        <div style={{ color: color, fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>{title}</div>
        <div style={{ color: COSMIC_THEME.text.muted, fontSize: '0.75rem' }}>{desc}</div>
    </button>
);

const OctaveBadge = ({ index, color, active, onToggle }: { index: number, color: string, active: boolean, onToggle: () => void }) => {
    // We name the octaves aligning with the CosmicCompass / Framework standard
    const names = [
        'Void', 'Subatomic', 'Plasma', 'Nuclear', 'Atomic', 
        'Molecular', 'Biological', 'Tissue', 'Self-Awareness', 'Community', 
        'Planetary', 'Solar System', 'Galactic', 'Universal', 'Metaversal'
    ];

    return (
        <button 
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: active ? `rgba(${hexToRgb(color)}, 0.15)` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { if(!active) e.currentTarget.style.boxShadow = `0 0 0 1px ${color}` }}
            onMouseOut={(e) => { if(!active) e.currentTarget.style.boxShadow = 'none' }}
        >
            <div style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                background: active ? color : 'transparent', border: `1px solid ${color}` 
            }} />
            <span style={{ 
                color: active ? '#fff' : COSMIC_THEME.text.muted,
                fontWeight: active ? 'bold' : 'normal',
                fontSize: '0.75rem'
            }}>
                O{index} <span style={{ opacity: 0.6 }}>{names[index] || `Octave ${index}`}</span>
            </span>
        </button>
    );
};

export default OrbitalFractalGenerator;
