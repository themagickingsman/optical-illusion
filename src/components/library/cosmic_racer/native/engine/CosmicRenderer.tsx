'use client';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { NewsFeedOverlay } from './components/NewsFeedOverlay';
import WebsiteThemeOverlay from './components/WebsiteThemeOverlay';
import SunEnvironment, { DEFAULT_SUN_CONFIG, drawSunLayers } from '../state/components/environments/SunEnvironment';
import { ENV_CONFIG } from '../config/env';
import { getShipAssetUrl } from '../config/ship_assets';

import { hydrateGameShips, setGlobalDbState, getGlobalDbState } from '../state/game-assets/ships';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { DEFAULT_SCREENSAVER_SETTINGS } from '../config/defaultScreensaverParams';




const SplashCursor = dynamic(() => import('../state/components/SplashCursor').then(m => m.SplashCursor), { ssr: false });
import { buildShipGeometryCache, createOptimizedTrailSystem, MathCache } from './FlightOptimizationEngine';
import { createHighFidelityShipGroup } from './FlightShipFactory';

const ProgressionProgressBar = () => {
    const [distance, setDistance] = useState(0);
    const [order, setOrder] = useState<string[]>([]);
    
    useEffect(() => {
        const handler = (e: any) => {
            setDistance(e.detail.distance);
            setOrder(e.detail.order);
        };
        window.addEventListener('arn_progression_update', handler);
        return () => window.removeEventListener('arn_progression_update', handler);
    }, []);

    // Calculate next tier based on shipOrder
    let currentTierMax = 0;
    let prevTierMax = 0;
    const numTiers = order.length > 0 ? order.length : 10;
    for (let i = 1; i < numTiers; i++) {
        // Use pure 267 AU base scale and Golden Ratio to match ship cards (5-day curve)
        const reqAu = 267 * Math.pow(1.618, i);
        if (distance < reqAu) {
            currentTierMax = reqAu;
            prevTierMax = i === 1 ? 0 : 267 * Math.pow(1.618, i - 1);
            break;
        }
    }
    
    if (currentTierMax === 0) {
        return (
            <div style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 8, border: '1px solid #4ade80' }}>
                <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 'bold', textAlign: 'center' }}>ALL SHIPS UNLOCKED</div>
            </div>
        );
    }
    
    const progress = Math.max(0, Math.min(1, (distance - prevTierMax) / (currentTierMax - prevTierMax)));
    const visualProgress = progress > 0 ? Math.pow(progress, 0.3) : 0; // Visual boost curve
    
    const remainingAu = currentTierMax - distance;
    const remainingHours = remainingAu / 18.0; // 18 AU/hour means 432 AU takes exactly 24 hours
    const totalH = Math.floor(remainingHours);
    const m = Math.floor((remainingHours - totalH) * 60);
    const s = Math.floor((((remainingHours - totalH) * 60) - m) * 60);
    const d = Math.floor(totalH / 24);
    const h = totalH % 24;
    const timeString = d > 0 
        ? `${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M` 
        : `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
    
    return (
        <div style={{ padding: '16px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#e2e8f0', marginBottom: 2, fontWeight: 'bold' }}>
                <span>Progression</span>
                <span style={{ color: '#FF8820' }}>{timeString}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 8, fontFamily: 'monospace' }}>
                <span>{((distance - prevTierMax) * 149597870).toLocaleString(undefined, { maximumFractionDigits: 0 })} KM Traveled</span>
                <span>/ {((currentTierMax - prevTierMax) * 149597870).toLocaleString(undefined, { maximumFractionDigits: 0 })} KM Req</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${visualProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #4ade80, #38bdf8)' }} />
            </div>
        </div>
    );
};

const BASE_DEFAULT_PARAMS: ShipDemoParams = {
  maxSpeed: 0.08,
  acceleration: 0.0008,
  driftFriction: 0.990,
  corneringDrift: 0.0,
  retroBrake: 2.0,
  turnSpeed: 0.014,
  maxBankDeg: 43,

  tiltSpeed: 0.04,
  modelScale: 0.1,
  planeSize: 0.2,
  modelPitch: 0,
  modelY: 0.3,
  texScaleX: 1.0,
  texScaleY: 1.0,
  texOffsetX: 0,
  texOffsetY: 0,
  texRotation: 0,
  showColorMap: true,
  showAlphaMap: true,
  showBumpMap: true,
  alphaTest: 0.05,
  texContrast: 1.0,
  texLuminance: 1.0,
  bumpScale: 1.0,
  showLightMap: true,
  lightMapIntensity: 2.0,
  lightMapGlow: 0.5,
  lightMapBloom: 1.0,
  lightMapFalloff: 2.0,
  lightMapSize: 1.0,
  lightMapHex: '#00ffff',
  ambientLight: 0.4,
  sunX: 20,
  showGrid: false,
  showTargetRings: false,
  autoPilot: false,
  cruiseMode: false,
  sunY: 40,
  sunZ: 20,
  cameraAngle: 'top',
  cinematicZoomScale: 0.68,
  cinematicZoomSpeed: 0.005,

  shadowOpacity: 0.6,
  shadowSize: 1.0,
  ambHex: '#334466',
  sunHex: '#ffc87a',
  edgeThreshold: 0.35,
  edgeIntensity: 1.0,
  rimHex: '#ff6600',
  edgeHex: '#1a99ff',
  bankSquashAmount: 0.25,
  bankSquashSpeed: 0.05,
  underbellyOffset: 2.0,
  underbellyDarkness: 0.2,
  showNodes: true,
  trailSize: 0.3,
  trailOpacity: 0.8,
  trailSpread: 0.4,
  trailWidth: 2.5,
  trailLength: 400,
  trailFalloff: 0.5,
  trailColor: '#ffffff',
  trailMountY: -2.0,
  navLightsX: 0.0,
  navLightsY: -62.0,
  navLightsSpread: 85.0,
  navLightsPortColor: '#ff0000',
  navLightsStbColor: '#00ff00',
  navLightsPortIntensity: 5.0,
  navLightsStbIntensity: 5.0,
  navLightsFalloff: 0.005,
  specularIntensity: 2.0,
  specularShininess: 110.0,
  specularAnisotropy: 0.85,
  centerSpecularIntensity: 1.5,
  centerSpecularWidth: 0.12,
  centerSpecularFalloff: 0.02,
  centerSpecularShininess: 110.0,
  centerSpecularAnisotropy: 0.1,
  shineStretch: 0.2,
  shineWidth: 0.1,
  shineIntensity: 1.5,
  globalShadowThreshold: 0.05,
  globalShadowSmoothness: 0.35,
  globalShadowOpacity: 0.85,
  globalShadowColor: '#0a1024',
  spotLightIntensity: 1.5,
  spotLightSize: 0.5,
  spotLightFalloff: 0.2,
  spotLightHex: '#ffffff',
  spotLightX: 0.0,
  spotLightY: -0.4,
  motionOpacity: 0.8,
  motionIntensity: 2.0,
  motionFalloff: 0.05,
  motionSpeed: 0.05,
  motionRotation: 0.0,
  motionFrequency: 15.0,
  motionWidth: 0.1,
  motionHex: '#00ffff',
  auraOpacity: 1.0,
  auraScaleX: 1.0,
  auraScaleY: 1.0,
  auraBlur: 0.5,
  auraHex: '#1a44ff',
  
  engineParticleColor1: '#ff0055',
  engineParticleColor2: '#00ffaa',
  engineParticleColor3: '#0088ff',
  engineParticleCycleSpeed: 1.0,
  autoTourTimeout: 10,
};

const OCTAVES = [
  {n:0,lbl:'VOID'},{n:1,lbl:'QNTM'},{n:2,lbl:'NUCL'},{n:3,lbl:'ATOM'},
  {n:4,lbl:'ELEC'},{n:5,lbl:'MOLC'},{n:6,lbl:'GENE'},{n:7,lbl:'CELL'},
  {n:8,lbl:'NEUR'},{n:9,lbl:'ECOL'},{n:10,lbl:'LNAR'},{n:11,lbl:'SOLR'},
  {n:12,lbl:'OORT'},{n:13,lbl:'CNST'},{n:14,lbl:'GLXY'},
];

const FACTION_COLOR: Record<number,string> = {
  0:'#0088ff', 1:'#f59e0b', 2:'#34d399', 3:'#c084fc', [-1]:'#4b5563',
};

const hexToRgb = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const int = parseInt(hex, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
};

const particleVertex = /* glsl */ `
  attribute vec4 random;
  attribute vec3 customColor;

  uniform float uTime;
  uniform float uCameraZoom;
  uniform vec2 uSpread;
  uniform float uPerspectiveDepth;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  uniform float uSpeedVariation;
  uniform vec2 uOffset;
  uniform vec2 uVelocity;

  varying vec4 vRandom;
  varying vec3 vColor;
  varying vec2 vVelocity;
  varying float vBaseSize;

  void main() {
    vRandom = random;
    vColor = customColor;

    vec3 pos = position;
    
    // Dynamically scale normalized particle initializations against the actual responsive frustum boundaries
    float spreadX = uSpread.x;
    float spreadY = uSpread.y;
    
    pos.x *= spreadX;
    pos.z *= spreadY;
    
    // Incorporate individual speed tracking natively scaling off random Y value to allow internal layer disparity
    float individualSpeed = 1.0 + uSpeedVariation * (random.y - 0.5);
    
    // Infinite Parallax Wrap-Around perfectly outside viewport bounds (Mapped to Top-Down Ortho View X/Z)
    pos.x = mod(pos.x + (uOffset.x * individualSpeed) + spreadX, spreadX * 2.0) - spreadX;
    pos.z = mod(pos.z + (uOffset.y * individualSpeed) + spreadY, spreadY * 2.0) - spreadY;

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.z += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.y += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

    vec4 mvPos = viewMatrix * mPos;
    
    // Counteract the OrthographicCamera zoom so the stars remain perfectly static and fill the screen
    mvPos.x /= max(0.001, uCameraZoom);
    mvPos.y /= max(0.001, uCameraZoom);
    float finalSize = uBaseSize;
    if (uSizeRandomness > 0.0) {
      finalSize = uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5));
    }
    // Geometrically simulate perspective subdivision natively against orthographic flatness using the dynamic Depth setting
    finalSize = finalSize / max(1.0, uPerspectiveDepth * 0.1);
    
    // Calculate the precise pixel-space physical streak vector for the capsule SDF!
    vec2 layerVelocity = uVelocity * individualSpeed / max(1.0, uPerspectiveDepth * 0.1);
    vVelocity = layerVelocity;
    vBaseSize = finalSize;
    
    // Expand the bounding box to perfectly contain the physical trajectory vector + the rounded radius caps
    gl_PointSize = finalSize + length(layerVelocity);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAlphaParticles;
  uniform float uOpacity;
  uniform float uTailFade;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  varying vec2 vVelocity;
  varying float vBaseSize;

  void main() {
    float speed = length(vVelocity);
    float boxSize = vBaseSize + speed;
    
    // Convert gl_PointCoord (0 to 1) into physical pixel space, centered at 0
    vec2 p = (gl_PointCoord - vec2(0.5)) * boxSize;
    
    // Capsule SDF segment points. Velocity points where it's going, so trail extends backwards.
    // However, since it's just a streak over a frame duration, we center the stroke around the coordinate.
    vec2 A = -vVelocity * 0.5;
    vec2 B = vVelocity * 0.5;
    
    vec2 pa = p - A;
    vec2 ba = B - A;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    float d = length(pa - ba * h);
    
    float radius = vBaseSize * 0.5;
    
    // Anti-alias against physical pixel boundary
    if (d > radius) discard;
    
    float edgeAlpha = 1.0 - smoothstep(radius - 1.0, radius, d);
    if (edgeAlpha <= 0.0) discard;
    
    // Calculate tail fading based on parameter (0.0 = solid capsule, 1.0 = heavy fade to tail)
    // h goes from 0.0 at point A to 1.0 at point B.
    // We multiply by min(speed, 1.0) so that if the star is completely stationary, it doesn't artificially dim the whole star!
    float streakFade = mix(1.0, smoothstep(0.0, 1.0, h), uTailFade * min(speed, 1.0));
    
    vec3 animatedColor = vColor + 0.2 * sin(p.yxx * 0.1 + uTime + vRandom.y * 6.28);
    float finalAlpha = edgeAlpha * uOpacity * streakFade;

    if(uAlphaParticles < 0.5) {
      gl_FragColor = vec4(animatedColor, finalAlpha);
    } else {
      // Retain the soft blurred core for the foreground particles
      float core = smoothstep(radius, radius * 0.2, d) * 0.8;
      gl_FragColor = vec4(animatedColor, core * uOpacity * streakFade);
    }
  }
`;

function getFormationOffset(index: number, formation: string): { x: number, z: number } {
    let x = 0, z = 0;
    const pairIndex = Math.floor(index / 2) + 1; // 1, 1, 2, 2, 3, 3...
    const isLeft = (index % 2 === 0);

    switch (formation) {
        case 'V_FORMATION':
            x = isLeft ? -8 * pairIndex : 8 * pairIndex;
            z = -8 * pairIndex;
            break;
        case 'WALL_FORMATION':
            x = isLeft ? -10 * pairIndex : 10 * pairIndex;
            z = 0;
            break;
        case 'ECHELON_RIGHT':
            x = 8 * (index + 1);
            z = -8 * (index + 1);
            break;
        case 'ECHELON_LEFT':
            x = -8 * (index + 1);
            z = -8 * (index + 1);
            break;
        case 'ARROWHEAD_FORMATION':
            x = isLeft ? -5 * pairIndex : 5 * pairIndex;
            z = -12 * pairIndex;
            break;
        case 'TWIN_COLUMN':
            x = isLeft ? -6 : 6;
            z = -12 * pairIndex;
            break;
        case 'X_CROSS_FORMATION':
            const quadIndex = Math.floor(index / 4) + 1;
            const quad = index % 4;
            if (quad === 0) { x = -12 * quadIndex; z = 12 * quadIndex; } // Front Left
            else if (quad === 1) { x = 12 * quadIndex; z = 12 * quadIndex; }  // Front Right
            else if (quad === 2) { x = -12 * quadIndex; z = -12 * quadIndex; } // Back Left
            else { x = 12 * quadIndex; z = -12 * quadIndex; }  // Back Right
            break;
        case 'DIAMOND_FORMATION':
            if (index === 0) { x = -8; z = -8; }
            else if (index === 1) { x = 8; z = -8; }
            else if (index === 2) { x = 0; z = -16; }
            else if (index === 3) { x = -16; z = -16; }
            else if (index === 4) { x = 16; z = -16; }
            else if (index === 5) { x = -8; z = -24; }
            else if (index === 6) { x = 8; z = -24; }
            else if (index === 7) { x = 0; z = -32; }
            else {
                x = isLeft ? -8 * (pairIndex - 1) : 8 * (pairIndex - 1);
                z = -8 * (pairIndex + 2);
            }
            break;
        default:
            x = isLeft ? -8 * pairIndex : 8 * pairIndex;
            z = -8 * pairIndex;
            break;
    }
    return { x, z };
}


const RangeWithArrows = ({ value, defaultValue, onChange, min, max, step, style, type, ...props }: any) => {
  const stepVal = parseFloat(step) || 1;
  const pVal = parseFloat(value);
  const pDef = parseFloat(defaultValue);
  const currentVal = !isNaN(pVal) ? pVal : (!isNaN(pDef) ? pDef : 0);
  
  const handleDec = (e: any) => {
    e.preventDefault();
    const minVal = min !== undefined ? parseFloat(min) : -Infinity;
    const newVal = Math.max(minVal, currentVal - stepVal);
    const decimals = step ? (step.toString().split('.')[1] || '').length : 0;
    const formatted = parseFloat(newVal.toFixed(decimals));
    if (onChange) onChange({ target: { value: formatted.toString() } });
  };
  
  const handleInc = (e: any) => {
    e.preventDefault();
    const maxVal = max !== undefined ? parseFloat(max) : Infinity;
    const newVal = Math.min(maxVal, currentVal + stepVal);
    const decimals = step ? (step.toString().split('.')[1] || '').length : 0;
    const formatted = parseFloat(newVal.toFixed(decimals));
    if (onChange) onChange({ target: { value: formatted.toString() } });
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: style?.width || '100%' }}>
      <button onClick={handleDec} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#aaa', cursor: 'pointer', padding: '2px 8px', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
      <input type="number" value={Number.isNaN(value) ? '' : value} defaultValue={defaultValue} onChange={onChange} min={min} max={max} step={step} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', color: style?.accentColor || '#38bdf8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 4px', textAlign: 'center', fontSize: 11, ...style, accentColor: undefined }} {...props} />
      <button onClick={handleInc} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#aaa', cursor: 'pointer', padding: '2px 8px', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
    </div>
  );
};

export default function CosmicRenderer({
 initialActiveMode = 'game', isCmsMode = false, isPlanetSystem = false, hidePreferences = false, onMapToggle, isCinematicMode = false, isUiHidden = false, flightGradientConfig, audioConfig, progressionShipOrder: propProgressionShipOrder, progressionModeEnabled: propProgressionModeEnabled, screensaverTitleConfig, trailSystemOverride, configNamespace, coordinateEngine, environmentState, solarBodies, onReady }: { initialActiveMode?: 'game' | 'demo' | 'website', isCmsMode?: boolean, isPlanetSystem?: boolean, hidePreferences?: boolean, onMapToggle?: (isOpen: boolean) => void, isCinematicMode?: boolean, isUiHidden?: boolean, flightGradientConfig?: any, audioConfig?: any, progressionShipOrder?: string[], progressionModeEnabled?: boolean, screensaverTitleConfig?: { size: number; opacity: number; shaderEnabled: boolean; }, trailSystemOverride?: { create: () => any, update: (optTrail: any, currentLeft: any, currentRight: any, lastLeft: any, lastRight: any, isMoving: boolean, p: any, nowTime: number, fx: any) => void }, configNamespace?: string, coordinateEngine: any, environmentState: any, solarBodies: any, onReady?: () => void } = {} as any) {

  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { state: coordState, worldToPhysics, physicsToWorld } = coordinateEngine;
  const worldToPhysicsRef = useRef(worldToPhysics);
  const physicsToWorldRef = useRef(physicsToWorld);
  useEffect(() => {
     worldToPhysicsRef.current = worldToPhysics;
     physicsToWorldRef.current = physicsToWorld;
  }, [worldToPhysics, physicsToWorld]);
  const [vectorPlanets, setVectorPlanets] = useState<any[]>([]);
  const vectorPlanetsRef = useRef<any[]>([]);
  const vectorNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const envTargetRefs = useRef<Record<string, React.MutableRefObject<{ x: number, y: number, r: number }>>>({});
  const isContextLostRef = useRef(false);

  useEffect(() => {
     // Vector gradients are now hydrated securely via /api/game-assets/config
     
     const handleUpdate = (e: any) => {
         setVectorPlanets(e.detail);
         vectorPlanetsRef.current = e.detail;
     };
     window.addEventListener('arn_splash_vectors_updated', handleUpdate);
     return () => window.removeEventListener('arn_splash_vectors_updated', handleUpdate);
  }, []);

  const vectorTexturesRef = useRef<Record<string, THREE.CanvasTexture>>({});
  const vectorGlowTexturesRef = useRef<Record<string, THREE.CanvasTexture>>({});
  const proceduralTexturesRef = useRef<Record<string, THREE.Texture>>({});

  useEffect(() => {
     if (typeof window === 'undefined') return;
     if (!isDbLoaded) return;
     const manager = (window as any).ARN_LOADING_MANAGER || undefined;
     const texLoader = new THREE.TextureLoader(manager);
     texLoader.setCrossOrigin('anonymous');
     solarBodies.forEach((sb: any) => {
        const key = sb.name.toUpperCase();
        if (!proceduralTexturesRef.current[key]) {
           texLoader.load(`/game_assets/planets/${sb.name}_Sprite.png?v=${Date.now()}`, (tex) => {
              if ((THREE as any).SRGBColorSpace) tex.colorSpace = (THREE as any).SRGBColorSpace;
              else (tex as any).encoding = 3001;
              tex.generateMipmaps = true;
              proceduralTexturesRef.current[key] = tex;
           }, undefined, () => { /* No custom baked sprite exists for this planet */ });
        }
     });
  }, [solarBodies, isDbLoaded]);
  
  useEffect(() => {
      if (typeof document === 'undefined') return;
      const newCache: Record<string, THREE.CanvasTexture> = {};
      const newGlowCache: Record<string, THREE.CanvasTexture> = {};
      
      vectorPlanets.forEach(vp => {
          if (vp.targetNode) {
              const key = vp.targetNode.toUpperCase();
              const cfg = { ...DEFAULT_SUN_CONFIG, ...(vp.sunConfig || {}) };
              
              // Clamp texture resolution to prevent GPU/browser memory crashes
              const W = Math.min(8192, cfg.textureResolution || 1024);
              const H = W;
              
              const userPct = Math.max(0.001, cfg.sunSizePct);
              const sunR_raw = userPct / 100;
              const g2R_raw = sunR_raw * (cfg.glow2Size || 0);
              const g3R_raw = sunR_raw * (cfg.glow3Size || 0);
              const g1R_raw = sunR_raw * Math.max(1.0, cfg.glow1Size || 0);
              const glare_raw = sunR_raw * 3;
              
              const max_raw = Math.max(sunR_raw, g2R_raw, g3R_raw, g1R_raw, glare_raw, 0.001);
              const glowScale = max_raw / sunR_raw;
              
              // ── GRADIENTS TEXTURE (MASSIVE BOUNDS) ──
              const gradientCanvas = document.createElement('canvas');
              gradientCanvas.width = W; gradientCanvas.height = H;
              const gradientCtx = gradientCanvas.getContext('2d');
              if (gradientCtx) {
                  // Scale sunSizePct down so the maximum glow exactly hits the canvas bounds W/2
                  const adjustedPct = 50 * (sunR_raw / max_raw);
                  drawSunLayers(gradientCtx, W, H, W/2, H/2, { ...cfg, sunSizePct: adjustedPct }, 'glow');
              }
              const gradientTex = new THREE.CanvasTexture(gradientCanvas);
              gradientTex.generateMipmaps = false;
              gradientTex.minFilter = THREE.LinearFilter;
              gradientTex.needsUpdate = true;
              if ((THREE as any).SRGBColorSpace) gradientTex.colorSpace = (THREE as any).SRGBColorSpace;
              else (gradientTex as any).encoding = 3001;
              gradientTex.userData.glowScale = glowScale;
              
              // ── PLANET BODY TEXTURE (TIGHT BOUNDS FOR PERFECT RES) ──
              const coreCanvas = document.createElement('canvas');
              coreCanvas.width = W; coreCanvas.height = H;
              const coreCtx = coreCanvas.getContext('2d');
              if (coreCtx) {
                  // Force sunSizePct to 50 so it exactly fills the W/2 radius
                  drawSunLayers(coreCtx, W, W, W/2, H/2, { ...cfg, sunSizePct: 50 }, 'core');
              }
              const coreTex = new THREE.CanvasTexture(coreCanvas);
              coreTex.generateMipmaps = false;
              coreTex.minFilter = THREE.LinearFilter;
              coreTex.needsUpdate = true;
              if ((THREE as any).SRGBColorSpace) coreTex.colorSpace = (THREE as any).SRGBColorSpace;
              else (coreTex as any).encoding = 3001;
              
              newCache[key] = coreTex;
              newGlowCache[key] = gradientTex;
          }
      });
      
      Object.values(vectorTexturesRef.current).forEach(t => t.dispose());
      Object.values(vectorGlowTexturesRef.current).forEach(t => t.dispose());
      vectorTexturesRef.current = newCache;
      vectorGlowTexturesRef.current = newGlowCache;
  }, [vectorPlanets]);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const startAudioRef = useRef<(() => void) | null>(null);

  const texturesFinishedRef = useRef(false);
  const audioFinishedRef = useRef(false);

  useEffect(() => {
    if (!isDbLoaded) return;

    const checkFinished = () => {
        if (texturesFinishedRef.current && audioFinishedRef.current && isDbLoaded) {
            setIsReady(true);
        }
    };

    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => {
        setLoadingProgress((loaded / total) * 0.9); // Reserve last 10% for audio decode
    };
    manager.onLoad = () => {
        texturesFinishedRef.current = true;
        checkFinished();
    };
    (window as any).ARN_LOADING_MANAGER = manager;
    
    // Explicitly load ambiance audio tracked by manager
    const audioLoader = new THREE.AudioLoader(manager);
    
    const hasAudioContext = typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext);
    const audioListener = hasAudioContext ? new THREE.AudioListener() : null;
    if (audioListener) {
        (window as any).ARN_GLOBAL_AUDIO_LISTENER = audioListener;
    }

    // Define baseline startAudioRef in case loading fails or is skipped
    startAudioRef.current = async () => {
         if (audioListener && audioListener.context.state === 'suspended') {
             await audioListener.context.resume().catch(()=>{});
         }
         setIsLoading(false);
         window.dispatchEvent(new CustomEvent('arn_screensaver_started'));
    };

    audioLoader.load('/game_assets/sounds/used/background_ambienc.wav', (buffer) => {
        if (!audioListener) {
            setLoadingProgress(1.0);
            audioFinishedRef.current = true;
            checkFinished();
            return;
        }

        const sound = new THREE.Audio(audioListener);
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        
        startAudioRef.current = async () => {
             if (audioListener.context.state === 'suspended') {
                 await audioListener.context.resume().catch(()=>{});
             }
             if (audioListener.context.state === 'running' && !sound.isPlaying) {
                 // sound.setVolume(0.0);
                 // sound.play();
                 // 
                 // let currentVol = 0.0;
                 // const fadeInterval = setInterval(() => {
                 //     currentVol += 0.01;
                 //     if (currentVol >= 0.5) {
                 //         sound.setVolume(0.5);
                 //         clearInterval(fadeInterval);
                 //     } else {
                 //         sound.setVolume(currentVol);
                 //     }
                 // }, 60); // Roughly 3 seconds to reach 0.5
             }
             setIsLoading(false);
             window.dispatchEvent(new CustomEvent('arn_screensaver_started'));
        };

        setLoadingProgress(1.0);
        audioFinishedRef.current = true;
        checkFinished();
    }, undefined, (err) => {
        console.warn("Audio failed to load, skipping audio gate:", err);
        setLoadingProgress(1.0);
        audioFinishedRef.current = true;
        checkFinished();
    });

    return () => {
      if (typeof window !== 'undefined' && window.Howler) { window.Howler.stop(); }
        (window as any).ARN_LOADING_MANAGER = null;
    };
  }, [isDbLoaded]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'game' | 'demo' | 'website'>(initialActiveMode);
  const activeThemeRef = useRef<'game' | 'demo' | 'website'>('game');
  useEffect(() => { activeThemeRef.current = activeTheme; }, [activeTheme]);
  const [isFeaturesMinimized, setIsFeaturesMinimized] = useState(false);
  const [isPushingConfig, setIsPushingConfig] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('arn_features_state', { detail: { showFeatures } }));
  }, [showFeatures]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleToggle = () => {
      setShowFeatures(prev => !prev);
    };
    const handleRequest = () => {
      window.dispatchEvent(new CustomEvent('arn_features_state', { detail: { showFeatures } }));
    };
    window.addEventListener('arn_toggle_features', handleToggle);
    window.addEventListener('arn_request_features_state', handleRequest);
    return () => {
      window.removeEventListener('arn_toggle_features', handleToggle);
      window.removeEventListener('arn_request_features_state', handleRequest);
    };
  }, [showFeatures]);
  


  useEffect(() => {
    if (activeTheme === 'website') {
      document.body.classList.add('theme-website');
    } else {
      document.body.classList.remove('theme-website');
    }
    return () => document.body.classList.remove('theme-website');
  }, [activeTheme]);

  const showNewsRef = useRef(false);
  useEffect(() => { showNewsRef.current = showNews; }, [showNews]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [mapSaveState, setMapSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSaveHovered, setIsSaveHovered] = useState(false);
  const showMapRef = useRef(false);
  const isLoadingRef = useRef(true);
  const mapEntryPhaseRef = useRef(false);
  const mapExitPhaseRef = useRef(false);
  const mapPanRef = useRef({ x: 0, y: 0 });
  const mapZoomRef = useRef(1.0);
  const mapZoomVelocityRef = useRef(0.0);
  const currentCameraZoomRef = useRef(1.0);
  const targetLayoutX = useRef(0.50);
  const targetLayoutY = useRef(0.50);
  const droneSwayWeightRef = useRef(0.0);
  const trackingStrengthRef = useRef(0.35);

  // Track cinematic mode specifically inside this component to trigger smooth physics alterations
  const isCinematicModeRef = useRef(isCinematicMode);
  useEffect(() => { isCinematicModeRef.current = isCinematicMode; }, [isCinematicMode]);
  
  const isUiHiddenRef = useRef(isUiHidden);
  useEffect(() => { isUiHiddenRef.current = isUiHidden; }, [isUiHidden]);
  
  const audioConfigRef = useRef(audioConfig);
  useEffect(() => { audioConfigRef.current = audioConfig; }, [audioConfig]);

  useEffect(() => {
      const handleAudioUpdate = (e: any) => {
          if (e.detail && typeof e.detail.masterVolume === 'number') {
              audioConfigRef.current = { ...audioConfigRef.current, masterVolume: e.detail.masterVolume };
          }
      };
      window.addEventListener('arn_audio_update', handleAudioUpdate);
      return () => window.removeEventListener('arn_audio_update', handleAudioUpdate);
  }, []);

  const fpsRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.Camera>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mapShipMarkerRef = useRef<HTMLDivElement>(null);
  const planetLabelRefs = useRef<Record<string, HTMLDivElement|null>>({});
  
  // ── Optimization Cache Refs ──
  const mapPlayerArrowRef = useRef<HTMLDivElement>(null);
  const hudWaypointDistRef = useRef<HTMLSpanElement>(null);
  const hudApproachLabelRef = useRef<HTMLDivElement>(null);
  const wingmanMarkerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wingmanArrowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wingmanLabelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cachedScreenSize = useRef({ 
      width:  typeof window !== 'undefined' ? window.innerWidth : 1200, 
      height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });
  
  // ── Native Map UI States ──
  const [activeOctave, setActiveOctave] = useState(11);
  const [hoveredPlanet, setHoveredPlanet] = useState<string|null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<any|null>(null);
  const [hoveredShipId, setHoveredShipId] = useState<string|null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string|null>(null);
  const isDraggingMap = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const mapPanVelocity = useRef({ x: 0, y: 0 });
  
  // Global mapped Store for Environment map control
  const hasLoadedConfigRef = useRef(false);
  const { planetPrefs, setPlanetPrefs } = environmentState;
  const planetPrefsRef = useRef(planetPrefs);
  useEffect(() => { 
      planetPrefsRef.current = planetPrefs; 
      needsOrbitRebuildRef.current = true;
  }, [planetPrefs]);

  const customTourWaypointsRef = useRef<any[] | null>(null);
  const activeFormationRef = useRef<string>('V_FORMATION');
  const shipPosRef = useRef({ x: 0, z: 0 });
  const dronesRef = useRef<Record<string, any>>({});
  const [activeFormationState, setActiveFormationState] = useState<string>('V_FORMATION');
  const [hangarTab, setHangarTab] = useState<'ships' | 'formations'>('ships');

  useEffect(() => {
      const loadCustomPath = () => {
          try {
              const saved = localStorage.getItem('arn_auto_tour_path');
              if (saved) {
                  const arr = JSON.parse(saved);
                  const wps = arr.map((name: string) => solarBodies.find((b: any) => b.name === name)).filter((b: any) => b && b.worldR > 0);
                  if (wps.length > 0) customTourWaypointsRef.current = wps;
              }
              const savedForm = localStorage.getItem('arn_ai_formation');
              if (savedForm) {
                  activeFormationRef.current = savedForm;
                  setActiveFormationState(savedForm);
              }
          } catch(e) {}
      };
      loadCustomPath();
      window.addEventListener('arn_tour_path_updated', loadCustomPath);
      return () => window.removeEventListener('arn_tour_path_updated', loadCustomPath);
  }, []);
  const [showPlanetPrefs, setShowPlanetPrefs] = useState(false);

  const startDragPos = useRef({ x: 0, y: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
     if (!showMap) return;
     isDraggingMap.current = true;
     lastPanPos.current = { x: e.clientX, y: e.clientY };
     startDragPos.current = { x: e.clientX, y: e.clientY };
     mapPanVelocity.current = { x: 0, y: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
     if (!showMap) return;

     if (cameraRef.current && sceneRoot && mountRef.current) {
        if (!isDraggingMap.current) {
            const rect = mountRef.current.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const mouseVec = new THREE.Vector3();
            let closestMesh = null;
            let closestDist = 30; // Reliable 30px map screen radius
            
            const pMeshes = Object.values((sceneRoot as any).userData.planetMeshes || {}) as THREE.Mesh[];
            for (const mesh of pMeshes) {
                mouseVec.setFromMatrixPosition(mesh.matrixWorld);
                mouseVec.project(cameraRef.current);
                const targetX = (mouseVec.x * 0.5 + 0.5) * rect.width;
                const targetY = -(mouseVec.y * 0.5 - 0.5) * rect.height;
                const screenDist = Math.hypot(mx - targetX, my - targetY);
                if (screenDist < closestDist) {
                    closestDist = screenDist;
                    closestMesh = mesh;
                }
            }
            if (closestMesh) {
                (sceneRoot as any).userData.hoveredPlanetName = closestMesh.userData.planetName;
            } else {
                (sceneRoot as any).userData.hoveredPlanetName = null;
            }
            return; // explicitly return since we're not dragging
        }
     }
     
     if (sceneRoot) {
         (sceneRoot as any).userData.hoveredPlanetName = null;
     }
     if (!isDraggingMap.current) return;

     const dx = e.clientX - lastPanPos.current.x;
     const dy = e.clientY - lastPanPos.current.y;
     
     // Pure constant drag scaling entirely independent of camera zoom
     const moveX = dx * planetPrefsRef.current.dragSpeed;
     const moveY = dy * planetPrefsRef.current.dragSpeed;
     
     mapPanRef.current.x += moveX;
     mapPanRef.current.y += moveY;
     
     mapPanVelocity.current = { x: moveX, y: moveY };
     lastPanPos.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
     isDraggingMap.current = false;
     if ((!showMap && !isPlanetSystem) || !cameraRef.current || !sceneRoot || !mountRef.current) return;
     const dist = Math.hypot(e.clientX - startDragPos.current.x, e.clientY - startDragPos.current.y);
     if (dist < 5) {
         // Process pure map click for Native Waypoint Targeting
         const rect = mountRef.current.getBoundingClientRect();
         const mx = e.clientX - rect.left;
         const my = e.clientY - rect.top;
         const mouseVec = new THREE.Vector3();
         let closestMesh = null;
         let closestDist = 30; // Reliable 30px map screen radius
         
         const pMeshes = Object.values((sceneRoot as any).userData.planetMeshes || {}) as THREE.Mesh[];
         for (const mesh of pMeshes) {
             mouseVec.setFromMatrixPosition(mesh.matrixWorld);
             mouseVec.project(cameraRef.current);
             const targetX = (mouseVec.x * 0.5 + 0.5) * rect.width;
             const targetY = -(mouseVec.y * 0.5 - 0.5) * rect.height;
             const screenDist = Math.hypot(mx - targetX, my - targetY);
             if (screenDist < closestDist) {
                 closestDist = screenDist;
                 closestMesh = mesh;
             }
         }
         
         if (closestMesh) {
             const hitName = closestMesh.userData.planetName;
             targetPlanetNameRef.current = hitName;
             setTargetPlanetName(hitName);
             
             const planetMatch = solarBodies.find(p => p.name === hitName);
             if (planetMatch) {
                 setSelectedPlanet(planetMatch);
                 if (typeof window !== 'undefined') {
                     window.dispatchEvent(new CustomEvent('arn_camera_focus_planet', { 
                        detail: { planetName: hitName } 
                     }));
                 }
             }
         } else {
             // The user clicked the deep void! Terminate all locks and flawlessly zero the map back to the true solar system center (0,0) natively
             setTargetPlanetName(null);
             targetPlanetNameRef.current = null;
             
             if (showMapRef.current) {
                 // Deep Map Mode: Sweep exactly to global center and expand bounds fully!
                 targetShipIdRef.current = null;
                 mapPanRef.current = { x: 0, y: 0 };
                 mapPanVelocity.current = { x: 0, y: 0 };
                 
                 // Natively execute zoom-bounds calculation identical to Map Toggle behavior
                 let maxBoundary = 0;
                 const scales = dynamicPaddedScalesRef.current || {};
                 Object.values(scales).forEach((r) => {
                      if (r > maxBoundary) maxBoundary = r;
                 });
                 const nativeViewW = window.innerWidth * 0.05;
                 const nativeViewH = window.innerHeight * 0.05;
                 const requiredViewBoundary = (maxBoundary * planetPrefsRef.current.orbitScale) * 2.0;
                 
                 if (requiredViewBoundary > 0) {
                      const bestZoomW = nativeViewW / (requiredViewBoundary * 1.05);
                      const bestZoomH = nativeViewH / (requiredViewBoundary * 1.05);
                      mapZoomRef.current = Math.min(bestZoomW, bestZoomH);
                 } else {
                      mapZoomRef.current = planetPrefsRef.current.mapOpenDistance;
                 }
             } else {
                 // Asteroids Game Space Flight: Safely break planet locking and snap tracking inherently back to Player Ship
                 targetShipIdRef.current = playerShipIdRef?.current || 'ship';
                 mapPanRef.current = { x: 0, y: 0 };
                 mapPanVelocity.current = { x: 0, y: 0 };
             }
         }
     }
  };


  useEffect(() => {
    if (isPlanetSystem && typeof window !== 'undefined') {
       window.dispatchEvent(new CustomEvent('arn_map_toggled', { detail: showMap }));
    }
  }, [showMap, isPlanetSystem]);

  const targetPlanetNameRef = useRef<string | null>(null);
  const targetShipIdRef = useRef<string | null>(null);
  const [targetPlanetName, setTargetPlanetName] = useState<string | null>(null);
  const isMapAutopilotActiveRef = useRef<boolean>(false);

  useEffect(() => {
     const focusHandler = (e: any) => {
        targetShipIdRef.current = null;
        mapPanRef.current = { x: 0, y: 0 };
        mapPanVelocity.current = { x: 0, y: 0 };
        if (e.detail?.planetName) {
           targetPlanetNameRef.current = e.detail.planetName;
           setTargetPlanetName(e.detail.planetName);
           // The mode needs to turn off so the ship can go to the planet selected!
           setParams(p => ({ ...p, autoTour: false }));
        } else {
           targetPlanetNameRef.current = null;
           setTargetPlanetName(null);
           isMapAutopilotActiveRef.current = false;
        }
     };
     const shipFocusHandler = (e: any) => {
        targetPlanetNameRef.current = null;
        setTargetPlanetName(null);
        mapPanRef.current = { x: 0, y: 0 };
        mapPanVelocity.current = { x: 0, y: 0 };
        if (e.detail?.shipId) {
           targetShipIdRef.current = e.detail.shipId;
           // Apply dynamic fleet zoom on ship selection
           if (planetPrefsRef.current.fleetClickZoom) {
               mapZoomRef.current = planetPrefsRef.current.fleetClickZoom;
           }
        } else {
           targetShipIdRef.current = null;
        }
     };
     window.addEventListener('arn_camera_focus_planet', focusHandler);
     window.addEventListener('arn_camera_focus_ship', shipFocusHandler);
     return () => {
         window.removeEventListener('arn_camera_focus_planet', focusHandler);
         window.removeEventListener('arn_camera_focus_ship', shipFocusHandler);
     };
  }, []);

  useEffect(() => { 
      onMapToggle?.(showMap);
      showMapRef.current = showMap; 
      // Trigger Autopilot exclusively when the map is visibly closed after a waypoint is chosen
      if (!showMap && targetPlanetNameRef.current) {
          isMapAutopilotActiveRef.current = true;
      }
  }, [showMap, onMapToggle]);

  const [isFullscreenMode, setIsFullscreenMode] = useState(true);
  const [showScreensaverSettings, setShowScreensaverSettings] = useState(false);
  const [isTitleScreenActive, setIsTitleScreenActive] = useState(true);

  useEffect(() => {
     const onFullscreenChange = () => {
         const doc = document as any;
         setIsFullscreenMode(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
     };
     document.addEventListener('fullscreenchange', onFullscreenChange);
     document.addEventListener('webkitfullscreenchange', onFullscreenChange);
     return () => {
         document.removeEventListener('fullscreenchange', onFullscreenChange);
         document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
     };
  }, []);

  const handleFullscreen = () => {
     const doc = document as any;
     const targetEl = containerRef.current || doc.documentElement;
     
     const currentFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
     
     if (!currentFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err: any) => console.error("Fullscreen err:", err));
        } else if ((targetEl as any)?.webkitRequestFullscreen) {
            (targetEl as any).webkitRequestFullscreen();
        } else if ((targetEl as any)?.msRequestFullscreen) {
            (targetEl as any).msRequestFullscreen();
        }

     } else {
        if (doc.exitFullscreen) {
            doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
     }
  };
  const sunPosRef = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 800, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 600 });
  const worldPosRef = useRef({ x: 0, y: 0 });
  const fleetPositionsRef = useRef<{id: string, x: number, y: number, color: string, isPlayer: boolean}[]>([]);
  const [sceneRoot, setSceneRoot] = useState<THREE.Scene | null>(null);
  const titleMeshRef = useRef<THREE.Mesh | null>(null);
  const parsedFontRef = useRef<Font | null>(null);
  const isTitleScreenActiveRef = useRef(true);

  const randomTargetZoomRef = useRef<number | null>(null);
  const randomZoomHoldTimerRef = useRef<number>(0);
  useEffect(() => { isTitleScreenActiveRef.current = isTitleScreenActive; }, [isTitleScreenActive]);

  // Auto-initiate flight after 15 seconds for screensaver mode
  useEffect(() => {
    const handleTitleEnd = () => setIsTitleScreenActive(false);
    window.addEventListener('arn_title_screen_end', handleTitleEnd);
    return () => window.removeEventListener('arn_title_screen_end', handleTitleEnd);
  }, []);

  const [textureRefreshKey, setTextureRefreshKey] = useState(() => Date.now());


  const loadShips = (key = textureRefreshKey) => {
     if (typeof window === 'undefined') return [];
     const s = hydrateGameShips(!isCmsMode);
     let configured = s.filter((ship: any) => !!ship.imagePath).map((ship: any) => {
         const buildUrl = (existingUrl: string | undefined, type: string) => {
             if (existingUrl) {
                 if (existingUrl.startsWith('data:')) return existingUrl;
                 return existingUrl + (existingUrl.includes('?') ? '&' : '?') + `t=${key}`;
             }
             const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
             const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
             const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
             const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

             if (isStandaloneMode) {
                 return getShipAssetUrl(ship.id, type as any);
             }
             return `/api/game-assets?ship=${ship.id}&type=${type}&t=${key}`;
         };
         return {
             ...ship,
             colorUrl: buildUrl(ship.colorUrl, 'color'),
             alphaUrl: buildUrl(ship.alphaUrl, 'alpha'),
             bumpUrl:  buildUrl(ship.bumpUrl, 'bump'),
             lightUrl: buildUrl(ship.lightUrl || ship.lightmap, 'lightmap'),
         };
     });
     
     if (progressionShipOrderRef.current && progressionShipOrderRef.current.length > 0) {
         const order = progressionShipOrderRef.current;
         configured.sort((a: any, b: any) => {
             const indexA = order.indexOf(a.id);
             const indexB = order.indexOf(b.id);
             if (indexA === -1 && indexB === -1) return 0;
             if (indexA === -1) return 1; // Put unlisted ships at the end
             if (indexB === -1) return -1;
             return indexA - indexB;
         });
     }
     
     return configured;
  };

  const [SHIPS, setSHIPS] = useState<any[]>([]);
  const shipGeometryCacheRef = useRef<Record<string, any>>({});
  useEffect(() => {
     shipGeometryCacheRef.current = buildShipGeometryCache(SHIPS);
  }, [SHIPS]);
  const shipsRef = useRef(SHIPS);
  
  useEffect(() => {
     shipsRef.current = SHIPS;
  }, [SHIPS]);

  useEffect(() => {
     const handleThumbUpdate = () => {
         const newKey = Date.now();
         setTextureRefreshKey(newKey);
         setSHIPS(loadShips(newKey));
     };
     window.addEventListener('ship-thumbnail-update', handleThumbUpdate);
     return () => window.removeEventListener('ship-thumbnail-update', handleThumbUpdate);
  }, []);

  useEffect(() => {
     // Fetch the central config DB to ensure data persistence across hard reloads
     
     const fetchConfig = async () => {
         try {
             const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
             const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.port === '3009' || window.location.hostname.includes('vercel.app'));
             const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
             const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

             let configUrl = isStandaloneMode 
                 ? '/game_assets/data/game_config.json' 
                 : `${ENV_CONFIG.API_BASE_URL}/api/master-config/`;
             
             let debugLocalState: any = { configUrl, timestamp: new Date().toISOString() };
             const r = await fetch(configUrl + (configUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
             const text = await r.text();
             let db;
             try {
                 const parsed = JSON.parse(text);
                 if (parsed.success === false) {
                     console.error("CosmicRenderer config fetch reported failure:", parsed.error || parsed);
                     db = null;
                     debugLocalState.status = "API Error";
                     debugLocalState.message = parsed.error;
                 } else {
                     db = parsed.success ? parsed.data : parsed;
                     debugLocalState.status = "Success";
                     debugLocalState.message = "Successfully parsed JSON";
                 }
             } catch (e: any) {
                 console.warn("CosmicRenderer config fetch returned non-JSON:", text.substring(0, 50));
                 db = { data: { screensaver_config: DEFAULT_SCREENSAVER_SETTINGS, website_config: DEFAULT_SCREENSAVER_SETTINGS, tour_racing_prefs: DEFAULT_SCREENSAVER_SETTINGS } };
                 debugLocalState.status = "Fetch Error (Fallback to Offline Settings)";
                 debugLocalState.message = e?.message;
             }
             
             if (db) {
                 setGlobalDbState(db);
                 
                 if (db.shipbank_state_per_ship) {
                     allShipParamsRef.current = db.shipbank_state_per_ship;
                     debugLocalState.hasShipbankStatePerShip = true;
                 }

                 // FIX: Always use the ship the engine is actually focused on, instead of falling back to a blind loadShips()
                 // FIX: db.lastEditedShip MUST take priority over stale cross-port localStorage!
                 const activeId = db.lastEditedShip 
                     ? db.lastEditedShip 
                     : (focusedShipIdRef.current && focusedShipIdRef.current !== 'ship' 
                         ? focusedShipIdRef.current 
                         : (loadShips()[0]?.id || 'ship'));
                         
                 debugLocalState.activeIdResolved = activeId;
                 
                 // CRITICAL: Ensure the visual model and auto-saver match the physics we just loaded!
                 if (activeId !== focusedShipIdRef.current && activeId !== 'ship') {
                     playerShipIdRef.current = activeId; // Force player ship to match active ship on load!
                     setPlayerShipId(activeId);
                     focusedShipIdRef.current = activeId;
                     setFocusedShipId(activeId);
                 }

                 // 1. Establish Baseline Physics/State
                 let mergedState = { ...BASE_DEFAULT_PARAMS, ...(db.shipbank_state || {}) };
                 debugLocalState.usedGlobalShipbankState = !!db.shipbank_state;
                 
                 // 1.5 Layer Specific Ship Physics (Crucial so UI sliders don't reset to baseline!)
                 if (db.shipbank_state_per_ship && db.shipbank_state_per_ship[activeId]) {
                     mergedState = { ...mergedState, ...db.shipbank_state_per_ship[activeId] };
                     debugLocalState.usedPerShipState = true;
                     debugLocalState.loadedSpeed = db.shipbank_state_per_ship[activeId].maxSpeed;
                 } else {
                     debugLocalState.usedPerShipState = false;
                     debugLocalState.loadedSpeed = mergedState.maxSpeed;
                 }

                 // 2. Layer UI/Cinematic Overrides directly
                 // 2. Layer UI/Cinematic Overrides directly
                 // We ONLY extract the presentation/camera properties from the experience config,
                 // preserving the core physical ship model (like maxSpeed, acceleration) loaded from shipbank.
                 const applyExperienceKeys = (source: any) => {
                     if (!source) return {};
                     const keys = ['autoPilot', 'cruiseMode', 'autoTour', 'cameraAngle', 'cinematicZoomScale', 'cinematicZoomSpeed', 'cinematicBehavior', 'cinematicCloseZoom', 'cinematicWideZoom', 'letterboxEnabled', 'letterboxInSpeed', 'letterboxOutSpeed', 'uiFadeDelay', 'autoStartScreensaver', 'showGrid', 'showTargetRings', 'showNodes'];
                     const patch: any = {};
                     for (const k of keys) {
                         if (source[k] !== undefined) patch[k] = source[k];
                     }
                     return patch;
                 };

                 const activeScreensaverConf = db.screensaver_config || db.screensaver;
                 if (configNamespace === 'screensaver_config' && activeScreensaverConf) {
                     mergedState = { ...mergedState, ...applyExperienceKeys(activeScreensaverConf) };
                     if (activeScreensaverConf.totalKMs !== undefined && sessionDistanceRef.current === 0) {
                         sessionDistanceRef.current = activeScreensaverConf.totalKMs;
                     }
                 } else if (configNamespace && db[configNamespace]) {
                     mergedState = { ...mergedState, ...applyExperienceKeys(db[configNamespace]) };
                 }
                 
                 globalShipbankStateRef.current = mergedState;
                 setParams(p => ({ ...p, ...mergedState, showGrid: false }));
              
                 if (db.planet_prefs_state) {
                     const dbPrefs = db.planet_prefs_state;
                     setPlanetPrefs(p => ({ ...p, ...dbPrefs }));
                     planetPrefsRef.current = { ...planetPrefsRef.current, ...dbPrefs }; // Synchronize instantly
                     needsOrbitRebuildRef.current = true;
                 }
                 
                 if (db.vector_gradients) {
                     setVectorPlanets(db.vector_gradients);
                     vectorPlanetsRef.current = db.vector_gradients;
                 }
                 
                 // Extract flattened Master JSON properties directly
                 if (db.racing_mode_prefs && db.racing_mode_prefs.gameplayGlobalFx) {
                     setGlobalSplashConfig(db.racing_mode_prefs.gameplayGlobalFx);
                 } else if (db.gameplayGlobalFx) {
                     setGlobalSplashConfig(db.gameplayGlobalFx);
                 } else if (db.splash_cursor_config) {
                     setGlobalSplashConfig(db.splash_cursor_config.gameplayGlobalFx || {});
                 }
                 
                 if (db.flightGradientConfig) {
                     setFlightGradientCfgState(db.flightGradientConfig);
                 } else if (db.splash_cursor_config && db.splash_cursor_config.flightGradientConfig) {
                     setFlightGradientCfgState(db.splash_cursor_config.flightGradientConfig);
                 }

                 // Hydrate per-ship FX color overrides
                 if (db.shipFxColors && typeof db.shipFxColors === 'object') {
                     shipFxColorOverrideRef.current = { ...db.shipFxColors };
                 }
                 
                 // If the parent component did not pass an explicit audioConfig, hydrate it from the DB
                 if (!audioConfig && (db.audio || db.soundAssignments)) {
                     audioConfigRef.current = db.audio || db.soundAssignments;
                 }
                 
                 if (db.activeRoster && db.activeRoster.length > 0) {
                     localStorage.setItem('ship_roster_active', JSON.stringify(db.activeRoster));
                 }
                 if (db.registrations && Object.keys(db.registrations).length > 0) {
                     localStorage.setItem('ship_registrations', JSON.stringify(db.registrations));
                 }
                 if (db.classifications && Object.keys(db.classifications).length > 0) {
                     localStorage.setItem('ship_classifications', JSON.stringify(db.classifications));
                 }
                 if (db.rotations && Object.keys(db.rotations).length > 0) {
                     localStorage.setItem('ship_rotations', JSON.stringify(db.rotations));
                 }
                 if (db.customImages) {
                     localStorage.setItem('ship_custom_images', JSON.stringify(db.customImages));
                 }
                 if (db.customAdditions) {
                     localStorage.setItem('ship_custom_additions', JSON.stringify(db.customAdditions));
                 }
                 if (db.progressionModeEnabled !== undefined) {
                     setProgressionModeEnabled(!!db.progressionModeEnabled);
                     progressionModeEnabledRef.current = !!db.progressionModeEnabled;
                 }
                 if (db.progressionShipOrder) {
                     setProgressionShipOrder(db.progressionShipOrder);
                     progressionShipOrderRef.current = db.progressionShipOrder;
                 }
             } else {
                 debugLocalState.status = "Failed";
                 debugLocalState.message = "db was null after parsing.";
             }
             setDebugConfigInfo(debugLocalState);
             if (db) {
                 hasLoadedConfigRef.current = true;
             } else {
                 console.warn("Disabling autosave because db failed to load.");
                 hasLoadedConfigRef.current = false;
             }
             setSHIPS(loadShips());
             setIsDbLoaded(true);
         } catch (e) {
             console.warn("Disabling autosave because fetch threw an error.");
             hasLoadedConfigRef.current = false;
             setSHIPS(loadShips()); // Fallback to bare local cache on fetch fail
             setIsDbLoaded(true);
         }
     };
     
     fetchConfig();
         
         const handleLocalUpdate = () => fetchConfig();
         window.addEventListener('arn_ship_registry_updated', handleLocalUpdate);
         
         return () => {
             window.removeEventListener('arn_ship_registry_updated', handleLocalUpdate);
         };
  }, [configNamespace]);

  // Progression Logic State
  const [progressionModeEnabled, setProgressionModeEnabled] = useState(propProgressionModeEnabled || false);
  const [progressionShipOrder, setProgressionShipOrder] = useState<string[]>(propProgressionShipOrder || []);
  const progressionModeEnabledRef = useRef(propProgressionModeEnabled || false);
  const progressionShipOrderRef = useRef<string[]>(propProgressionShipOrder || []);
  useEffect(() => { progressionModeEnabledRef.current = progressionModeEnabled; }, [progressionModeEnabled]);
  useEffect(() => { progressionShipOrderRef.current = progressionShipOrder; }, [progressionShipOrder]);
  
  const getLeadShipId = () => {
      if (progressionModeEnabled && progressionShipOrder.length > 0) return progressionShipOrder[0];
      // Read from DB state — rosterLead is the canonical first ship, lastEditedShip is the last active
      const db = (getGlobalDbState() || {}) as any;
      if (db.rosterLead && SHIPS.length > 0 && SHIPS.find((s: any) => s.id === db.rosterLead)) return db.rosterLead;
      if (db.lastEditedShip && SHIPS.length > 0 && SHIPS.find((s: any) => s.id === db.lastEditedShip)) return db.lastEditedShip;
      return SHIPS[0]?.id || 'ship';
  };

  const [focusedShipId, setFocusedShipId] = useState(() => getLeadShipId());
  const [playerShipId, setPlayerShipId] = useState(() => getLeadShipId());
  
  const playerShipIdRef = useRef<string | null>(null);
  if (playerShipIdRef.current === null) playerShipIdRef.current = getLeadShipId();
  
  const focusedShipIdRef = useRef<string | null>(null);
  if (focusedShipIdRef.current === null) focusedShipIdRef.current = getLeadShipId();

  useEffect(() => {
     if (SHIPS.length > 0) {
         const leadId = getLeadShipId();
         if (!playerShipIdRef.current || playerShipIdRef.current === 'ship' || !SHIPS.find(s => s.id === playerShipIdRef.current) || (progressionModeEnabled && playerShipIdRef.current !== leadId)) {
             playerShipIdRef.current = leadId;
             setPlayerShipId(leadId);
         }
         // If we don't have a valid focused ship yet, or the current one isn't loaded, default to the lead ship
         if (focusedShipIdRef.current === 'ship' || !SHIPS.find(s => s.id === focusedShipIdRef.current) || (progressionModeEnabled && focusedShipIdRef.current !== leadId)) {
             setFocusedShipId(leadId);
             focusedShipIdRef.current = leadId;
         }
     }
  }, [SHIPS, progressionModeEnabled, progressionShipOrder]);

  // Splash Cursor State
  const splashEmitRef = useRef<any[]>([]);
  const splashCameraDeltaRef = useRef({ x: 0, y: 0 });
  const splashCanvasForwardRef = useRef<HTMLCanvasElement | null>(null);
  // Per-ship FX color overrides: { [shipId]: '#rrggbb' }
  const shipFxColorOverrideRef = useRef<Record<string, string>>({});
  const fluidFloorRef = useRef<THREE.Mesh | null>(null);
  const flightVelocityRef = useRef({ x: 0, y: 0 }); // Track physical world-space camera velocity for particles
  
  const [effectAssignments, setEffectAssignments] = useState<Record<string, number>>({});
  const [globalSplashConfig, setGlobalSplashConfig] = useState<any>({});
  const [flightGradientCfgState, setFlightGradientCfgState] = useState<any>(null);
  const flightGradientCfg = flightGradientConfig || flightGradientCfgState;
  
  useEffect(() => {
    const fetchConfig = () => {
        const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
        const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
        const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
        const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

        let configUrl = isStandaloneMode 
            ? '/game_assets/data/game_config.json' 
            : `${ENV_CONFIG.API_BASE_URL}/api/master-config/`;
        
        fetch(configUrl + (configUrl.includes('?') ? '&' : '?') + `t=${Date.now()}`)
            .then(r => r.json())
            .then(d => {
                const db = d.success ? d.data : d;
                if (db) {
                    if (db.progressionModeEnabled !== undefined) setProgressionModeEnabled(!!db.progressionModeEnabled);
                    if (db.progressionShipOrder) setProgressionShipOrder(db.progressionShipOrder);
                    if (db.sessionDistance !== undefined && sessionDistanceRef.current === 0) {
                        sessionDistanceRef.current = db.sessionDistance;
                    }
                    if (db.flightGradientConfig) setFlightGradientCfgState(db.flightGradientConfig);
                    if (db.ship_effect_assignments) setEffectAssignments(db.ship_effect_assignments);
                }
            }).catch(() => {});
    };
    
    fetchConfig();
    
    // Live preview listener for GameAssetsV2
    window.addEventListener('arn_fx_live_preview', ((e: CustomEvent) => {
        if (e.detail && e.detail.gameplayGlobalFx) {
            setGlobalSplashConfig(e.detail.gameplayGlobalFx);
        }
    }) as EventListener);
    
    window.addEventListener('arn_progression_config_updated', fetchConfig);

    return () => {
        window.removeEventListener('arn_progression_config_updated', fetchConfig);
    };
  }, []);

  const activeEffectIndex = effectAssignments[playerShipId] ?? 0;
  const globalSplashConfigRef = useRef(globalSplashConfig);
  useEffect(() => { globalSplashConfigRef.current = globalSplashConfig; }, [globalSplashConfig]);

  const effectAssignmentsRef = useRef(effectAssignments);
  useEffect(() => { effectAssignmentsRef.current = effectAssignments; }, [effectAssignments]);

  const [spawnedShipIds, setSpawnedShipIds] = useState<string[]>([]);
  const spawnedShipIdsRef = useRef<string[]>([]);
  const autoSpawnedShipsRef = useRef<string[]>([]);
  const shipAudioRefs = useRef<Record<string, THREE.Audio>>({});
  const audioBufferCacheRef = useRef<Record<string, AudioBuffer>>({});
  
  useEffect(() => {
    return () => {
      Object.values(shipAudioRefs.current).forEach(sound => {
          if (sound && sound.isPlaying) sound.stop();
          if (sound && sound.disconnect) sound.disconnect();
      });
      const globalAL = (window as any).ARN_GLOBAL_AUDIO_LISTENER;
      if (globalAL && globalAL.context && globalAL.context.state !== 'closed') {
          globalAL.context.suspend().catch(() => {});
      }
    };
  }, []);
  const hasInitializedSpawnsRef = useRef(false);
  const isFormationCatchingUpRef = useRef(false);
  
  const sessionDistanceRef = useRef(0);
  const progressionSaveTimerRef = useRef(0);

  useEffect(() => {
    if (!hasInitializedSpawnsRef.current && SHIPS.length > 0) {
      // Intelligently auto-spawn ONLY the first ship to preserve load times and reduce clutter at start!
      setSpawnedShipIds([getLeadShipId()]);
      hasInitializedSpawnsRef.current = true;
    }
  }, [SHIPS, progressionModeEnabled, progressionShipOrder]);

  useEffect(() => {
    spawnedShipIdsRef.current = spawnedShipIds;
  }, [spawnedShipIds]);
  const motionOffsetRef = useRef(0.0);

  const [isParamsMinimized, setIsParamsMinimized] = useState(true);
  const [leftMinimized, setLeftMinimized] = useState(true);

  useEffect(() => {
      window.dispatchEvent(new CustomEvent('arn_hangar_toggled', { detail: !leftMinimized }));
  }, [leftMinimized]);
  const [hangarInteractive, setHangarInteractive] = useState(false);
  const [hangarTick, setHangarTick] = useState(0);

  useEffect(() => {
      if (!leftMinimized) {
          const interval = setInterval(() => setHangarTick(t => t + 1), 1000);
          return () => clearInterval(interval);
      }
  }, [leftMinimized]);
  
  // Expose materials to be mutated dynamically by the texture loading side-effect
  const planeModelRef = useRef<THREE.Mesh | null>(null);
  
  const topLetterboxDomRef = useRef<HTMLDivElement>(null);
  const bottomLetterboxDomRef = useRef<HTMLDivElement>(null);
  const letterboxHeightRef = useRef<number>(0);

  const [sunBgConfig, setSunBgConfig] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SUN_CONFIG;
    try {
      const stored = localStorage.getItem('arn_sun_env_config');
      return stored ? { ...DEFAULT_SUN_CONFIG, ...JSON.parse(stored) } : DEFAULT_SUN_CONFIG;
    } catch { return DEFAULT_SUN_CONFIG; }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arn_sun_env_config' && e.newValue) {
        try { setSunBgConfig({ ...DEFAULT_SUN_CONFIG, ...JSON.parse(e.newValue) }); } catch {}
      }
    };
    const handleCustom = (e: any) => {
      try { setSunBgConfig({ ...DEFAULT_SUN_CONFIG, ...e.detail }); } catch {}
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("arn_sun_env_config", handleCustom as any);
    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("arn_sun_env_config", handleCustom as any);
    };
  }, []);
  
  const globalSunTexRef = useRef<THREE.CanvasTexture | null>(null);
  const globalSunGlowTexRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
      // Clamp texture resolution to prevent GPU memory crashes
      const W = Math.min(8192, sunBgConfig.textureResolution || 1024);
      const H = W;
      
      const userPct = Math.max(0.001, sunBgConfig.sunSizePct);
      const sunR_raw = userPct / 100;
      const g2R_raw = sunR_raw * (sunBgConfig.glow2Size || 0);
      const g3R_raw = sunR_raw * (sunBgConfig.glow3Size || 0);
      const g1R_raw = sunR_raw * Math.max(1.0, sunBgConfig.glow1Size || 0);
      const glare_raw = sunR_raw * 3;
      const max_raw = Math.max(sunR_raw, g2R_raw, g3R_raw, g1R_raw, glare_raw, 0.001);

      // ── GRADIENTS TEXTURE ──
      const gradientCanvas = document.createElement('canvas');
      gradientCanvas.width = W; gradientCanvas.height = H;
      const gradientCtx = gradientCanvas.getContext('2d');
      if (gradientCtx) {
          drawSunLayers(gradientCtx, W, W, W/2, H/2, sunBgConfig, 'glow');
      }
      const gradientTex = new THREE.CanvasTexture(gradientCanvas);
      gradientTex.generateMipmaps = true;
      gradientTex.minFilter = THREE.LinearMipmapLinearFilter;

      // ── PLANET BODY TEXTURE ──
      const coreCanvas = document.createElement('canvas');
      coreCanvas.width = W; coreCanvas.height = H;
      const coreCtx = coreCanvas.getContext('2d');
      if (coreCtx) {
          drawSunLayers(coreCtx, W, W, W/2, H/2, sunBgConfig, 'core');
      }
      const coreTex = new THREE.CanvasTexture(coreCanvas);
      coreTex.generateMipmaps = true;
      coreTex.minFilter = THREE.LinearMipmapLinearFilter;
      
      if (globalSunTexRef.current) globalSunTexRef.current.dispose();
      if (globalSunGlowTexRef.current) globalSunGlowTexRef.current.dispose();
      
      globalSunTexRef.current = coreTex;
      globalSunGlowTexRef.current = gradientTex;
  }, [sunBgConfig]);

  const allShipParamsRef = useRef<Record<string, typeof BASE_DEFAULT_PARAMS>>({});

  // REMOVED: Stale localStorage loop that was overwriting the JSON DB data!

  const [params, setParams] = useState(() => {
    return { ...BASE_DEFAULT_PARAMS };
  });

  const [debugConfigInfo, setDebugConfigInfo] = useState<any>({
      status: "Initializing",
      configUrl: "...",
      message: "Waiting for fetchConfig..."
  });

  const globalShipbankStateRef = useRef<any>({ ...BASE_DEFAULT_PARAMS });

  useEffect(() => {
    const handleUpdate = (e: any) => {
        // Clear waypoint if any autonomous mode is explicitly activated
        if (e.detail.autoTour === true || e.detail.autoPilot === true || e.detail.cruiseMode === true) {
            targetPlanetNameRef.current = null;
            setTargetPlanetName(null);
            isMapAutopilotActiveRef.current = false;
        }
        
        // Prevent infinite loops by only updating if values actually changed
        setParams(p => {
            let hasChanges = false;
            for (const key in e.detail) {
                if (p[key] !== e.detail[key]) {
                    hasChanges = true;
                    break;
                }
            }
            return hasChanges ? { ...p, ...e.detail } : p;
        });
    };
    window.addEventListener('arn_shipbank_update', handleUpdate);
    return () => window.removeEventListener('arn_shipbank_update', handleUpdate);
  }, []);

  // Listen for per-ship FX color overrides from the screensaver user panel
  useEffect(() => {
    const handleFxColor = (e: any) => {
      const { shipId, color } = e.detail || {};
      if (!shipId || !color) return;
      shipFxColorOverrideRef.current = { ...shipFxColorOverrideRef.current, [shipId]: color };
      const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
      const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
      const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
      const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;
      if (isStandaloneMode) return;

      // Persist to JSON
      fetch('/api/game-assets/config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipFxColors: shipFxColorOverrideRef.current })
      }).catch(() => {});
    };
    window.addEventListener('arn_ship_fx_color', handleFxColor);
    return () => window.removeEventListener('arn_ship_fx_color', handleFxColor);
  }, []);

  const handleShipChange = (newShipId: string) => {
    // Save current params for the ship we're leaving before switching
    if (focusedShipIdRef.current) {
      allShipParamsRef.current[focusedShipIdRef.current] = paramsRef.current;
    }
    focusedShipIdRef.current = newShipId;
    setFocusedShipId(newShipId);
    const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
    const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
    const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
    const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;
    if (!isStandaloneMode) {
        // Persist active ship selection to JSON — no localStorage
        fetch('/api/game-assets/config/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastEditedShip: newShipId })
        }).catch(() => {});
    }
    // Notify screensaver UI which ship is now focused (name + current fx color)
    const shipDef = shipsRef.current.find((s: any) => s.id === newShipId);
    window.dispatchEvent(new CustomEvent('arn_ship_focused', {
      detail: {
        shipId: newShipId,
        shipName: (shipDef as any)?.name || newShipId,
        fxColor: shipFxColorOverrideRef.current[newShipId] || '#00e5ff'
      }
    }));
    if (allShipParamsRef.current[newShipId]) {
        setParams(p => ({ ...p, ...allShipParamsRef.current[newShipId], showTargetRings: p.showTargetRings, showGrid: p.showGrid }));
    } else {
        // No saved params for this ship yet — copy lead defaults so it starts clean
        const leadDefaults = allShipParamsRef.current[playerShipIdRef.current] || globalShipbankStateRef.current;
        allShipParamsRef.current[newShipId] = { ...leadDefaults };
        setParams(p => ({ ...p, ...leadDefaults, showTargetRings: p.showTargetRings, showGrid: p.showGrid }));
    }
  };

  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
    
    window.dispatchEvent(new CustomEvent('arn_shipbank_state_updated', { detail: params }));
    
    if (focusedShipIdRef.current) {
        allShipParamsRef.current[focusedShipIdRef.current] = params;
    }
    // Always keep the lead ship slot populated so its render loop never falls back to focusedShip params
    if (playerShipIdRef.current && !allShipParamsRef.current[playerShipIdRef.current]) {
        allShipParamsRef.current[playerShipIdRef.current] = params;
    }
  }, [params, hidePreferences]);

  const [positionsOverride, setPositionsOverride] = useState<Record<string, number>>({});
  const positionsOverrideRef = useRef(positionsOverride);
  useEffect(() => { positionsOverrideRef.current = positionsOverride; }, [positionsOverride]);

  const handlePushToScreensaver = async () => {
    setIsPushingConfig(true);
    try {
      const res = await fetch('/api/world-apps/push-to-screensaver', { method: 'POST' });
      if (!res.ok) throw new Error("Failed to push to screensaver");
    } catch (err) {
      console.error("Failed to push config:", err);
    }
    setTimeout(() => setIsPushingConfig(false), 2000);
  };


  useEffect(() => {
      const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
      const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
      const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
      const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

      if (isStandaloneMode) {
          return;
      }

      const fetchOverrides = () => {
          fetch('/api/world-apps/planet-editor')
              .then(res => res.json())
              .then(data => {
                  if (JSON.stringify(data) !== JSON.stringify(positionsOverrideRef.current)) {
                      setPositionsOverride(data);
                      positionsOverrideRef.current = data;
                      needsOrbitRebuildRef.current = true;
                  }
              })
              .catch(() => {
                  // Silently catch fetch errors (e.g. unmount, dev server restart) to prevent Next.js error overlays
              });
      };
      
      // Fetch instantly on mount
      fetchOverrides();
      
      // Poll every 2 seconds to emulate cross-tab live updates without localStorage!
      const interval = setInterval(fetchOverrides, 2000);
      return () => clearInterval(interval);
  }, []);

  const needsOrbitRebuildRef = useRef(true);
  const dynamicPaddedScalesRef = useRef<Record<string, number>>({});
  
  const isPlanetSystemRef = useRef(!!isPlanetSystem);
  useEffect(() => { isPlanetSystemRef.current = !!isPlanetSystem; }, [isPlanetSystem]);

  const getPaddedOrbitalDistances = useCallback(() => {
     let map: Record<string, number> = {};
     let sorted = [...solarBodies]
         .map((sb: any) => {
             // Let manual explicit overrides dictate sorting weight dynamically!
             if (positionsOverrideRef.current[sb.name] !== undefined) {
                 return { ...sb, computedWorldR: positionsOverrideRef.current[sb.name] };
             }
             return { ...sb, computedWorldR: sb.worldR || 0 };
         })
         .sort((a: any, b: any) => a.computedWorldR - b.computedWorldR);
         
     sorted.forEach((sb: any) => {
         let finalR = 0;
         
         if (positionsOverrideRef.current[sb.name] !== undefined) {
             // Explicit WYSIWYG bypass mapping directly from the separate 1D Ruler Editor Window
             finalR = worldToPhysicsRef.current(positionsOverrideRef.current[sb.name]);
         } else {
             // Pure Linear Translation with 4.0x Expansion (Removes artificial distance curves and padding)
             finalR = worldToPhysicsRef.current(sb.worldR || 0) * 4.0;
         }
         
         if (sb.worldR === 0) finalR = 0; // Sun unconditionally locks to zero center
         
         map[sb.name] = finalR;
     });
     return map;
  }, [solarBodies]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = Math.max(1, el.clientWidth  || window.innerWidth);
    const H = Math.max(1, el.clientHeight || window.innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 55, 110);

    const camera = new THREE.OrthographicCamera(
      -W / 2 * 0.05, W / 2 * 0.05,
       H / 2 * 0.05, -H / 2 * 0.05,
      -500000, 500000
    );
    cameraRef.current = camera;
    camera.position.set(0, 60, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    // Removed dynamic fluid floor - SplashCursor will be a DOM overlay

    // Guard: remove any stale canvas left by a previous mount (HMR / fast-refresh)
    const staleCanvas = el.querySelector('canvas');
    if (staleCanvas) el.removeChild(staleCanvas);

    // Check WebGL availability before creating the renderer to avoid THREE.WebGLRenderer console errors
    const isWebGLAvailable = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch (e) {
        return false;
      }
    };

    if (!isWebGLAvailable()) {
      console.warn('[CosmicRenderer] WebGL is not supported in this environment/browser.');
      return; // Bail out gracefully — do not crash the page
    }

    let renderer: THREE.WebGLRenderer;
    const originalConsoleError = console.error;
    try {
      // Temporarily suppress internal Three.js console.error logs for WebGL context failures
      console.error = (...args: any[]) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.WebGLRenderer')) {
          return;
        }
        originalConsoleError.apply(console, args);
      };

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } finally {
        console.error = originalConsoleError;
      }
    } catch (err) {
      console.warn('[CosmicRenderer] WebGL context creation failed. Hardware acceleration may be disabled or too many contexts are open.', err);
      return; // Bail out gracefully — do not crash the page
    }
    
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'relative';
    renderer.domElement.style.zIndex = '10';
    el.appendChild(renderer.domElement);
    
    // Screensaver Failsafe: Handle GPU sleep/power-saving modes indefinitely
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn("[ShipBankDemo] WebGL Context Lost! Suspending flight simulation.");
        isContextLostRef.current = true;
    }, false);
    
    renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.log("[ShipBankDemo] WebGL Context Restored! Rebooting engine.");
        isContextLostRef.current = false;
        // In most cases, ThreeJS will auto-recompile the shader materials natively if preventDefault was called!
    }, false);

    const onResize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      
      const oc = camera as THREE.OrthographicCamera;
      oc.left   = -w / 2 * 0.05; 
      oc.right  =  w / 2 * 0.05;
      oc.top    =  h / 2 * 0.05; 
      oc.bottom = -h / 2 * 0.05;
      oc.near = -500000;
      oc.far = 500000;
      oc.updateProjectionMatrix();
      
      cachedScreenSize.current = { width: w, height: h };
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onResize);
    
    // Natively hook the local geometry explicitly to guarantee scaling binds correctly 
    // without relying exclusively on global window broadcasts that fail during DOM-level fullscreen swaps.
    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(el);

    // const ambPlaneLight = new THREE.AmbientLight(0x334466, 2.0);
    // scene.add(ambPlaneLight);
    // (scene as any).userData.ambLight = ambPlaneLight;

    const sunLightNode = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLightNode.position.set(8, 20, 8);
    scene.add(sunLightNode);
    (scene as any).userData.dirLight = sunLightNode;

    const gridHelper = new THREE.GridHelper(300, 150, 0x00ffff, 0x004488);
    gridHelper.position.y = -0.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    scene.add(gridHelper);
    (scene as any).userData.grid = gridHelper;
    
    setSceneRoot(scene);

    // Native 2D Orthographic Map Group inside WebGL
    const mapGroup = new THREE.Group();
    scene.add(mapGroup);
    (scene as any).userData.mapGroup = mapGroup;

    // --- NATIVE STAR LAYERS ---
    const initStarLayer = (layerName: string, defaults: any) => {
        const MAX_PARTICLES = 10000;
        const positions = new Float32Array(MAX_PARTICLES * 3);
        const randoms = new Float32Array(MAX_PARTICLES * 4);
        const colors = new Float32Array(MAX_PARTICLES * 3);
        const palette = defaults.colors || ['#ffffff', '#ffffff', '#ffffff'];
        
        const baseSpread = 200.0; // Ensures extreme screen coverage natively for Orthographic bounds + mass gutters
        const spreadX = baseSpread * 1.5;
        const spreadY = baseSpread * 1.0;
        const spreadZ = 20.0; // Y-depth variance inside layer

        for (let i = 0; i < MAX_PARTICLES; i++) {
            positions.set([
               (Math.random() * 2 - 1), // Normalized X (Scaled dynamically during shader runtime for perfectly mapped Density mapping)
               (Math.random() * 2 - 1) * spreadZ, // Screen Depth  (Y-axis in flight mode)
               (Math.random() * 2 - 1)  // Normalized Y (Z-axis in flight mode)
            ], i * 3);
            randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
            colors.set(hexToRgb(palette[Math.floor(Math.random() * palette.length)]), i * 3);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 4));
        geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.setDrawRange(0, defaults.count);

        const material = new THREE.ShaderMaterial({
          vertexShader: particleVertex,
          fragmentShader: particleFragment,
          uniforms: {
            uTime: { value: 0 },
            uCameraZoom: { value: 1.0 },
            uSpread: { value: new THREE.Vector2(0, 0) },
            uPerspectiveDepth: { value: 20.0 },
            uBaseSize: { value: defaults.size * window.devicePixelRatio },
            uSizeRandomness: { value: defaults.randomness },
            uSpeedVariation: { value: 0.0 },
            uAlphaParticles: { value: defaults.alpha ? 1 : 0 },
            uOffset: { value: new THREE.Vector2(0, 0) },
            uOpacity: { value: defaults.opacity },
            uVelocity: { value: new THREE.Vector2(0, 0) },
            uTailFade: { value: 0.0 }
          },
          transparent: true, 
          depthTest: true, 
          depthWrite: false, 
          blending: THREE.NormalBlending
        });

        const points = new THREE.Points(geometry, material);
        // By attaching the Star Layers directly to the Camera and rotating them 90 degrees,
        // we turn them into a pure, distortion-free 2D screen overlay!
        // This makes them perfectly immune to 3D cinematic camera sweeps and Orthographic perspective warping.
        points.rotation.x = Math.PI / 2;
        
        // Restore correct parallax layering! The ship is roughly at Z=-60 relative to the camera.
        // By subtracting 60 from their original world yDepth, we perfectly preserve their
        // foreground/background sorting relative to the 3D scene!
        points.position.z = defaults.yDepth - 60; 
        
        points.renderOrder = defaults.order || 0;
        camera.add(points);
        return { points, material, geometry, defaults };
    };

    const starLayers = {
        // bg order is -100 to guarantee it draws before everything else in the scene
        bg: initStarLayer('bg', { count: 5000, spread: 100, size: 15, randomness: 1.0, alpha: false, opacity: 1.0, colors: ['#2a2f4c', '#5e688c', '#ffffff'], yDepth: -150, order: -100 }),
        fx: initStarLayer('fx', { count: 200, spread: 10, size: 30, randomness: 1.0, alpha: false, opacity: 1.0, colors: ['#ffffff'], yDepth: isPlanetSystem ? 20 : 10, order: 10 }),
        fg: initStarLayer('fg', { count: 100, spread: 10, size: 80, randomness: 1.0, alpha: true, opacity: 1.0, colors: ['#ffffff'], yDepth: isPlanetSystem ? -50 : 20, order: 20 })
    };
    (scene as any).userData.starLayers = starLayers;

    // --- TEST ASTEROID PARALLAX LAYER ---
    const asteroidTex = new THREE.TextureLoader().load('/game_assets/props/Astroid_field.png');
    asteroidTex.wrapS = THREE.RepeatWrapping;
    asteroidTex.wrapT = THREE.RepeatWrapping;
    asteroidTex.repeat.set(4, 4);
    const asteroidMat = new THREE.MeshBasicMaterial({
        map: asteroidTex,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending
    });
    const asteroidGeom = new THREE.PlaneGeometry(500, 500);
    const asteroidMesh = new THREE.Mesh(asteroidGeom, asteroidMat);
    asteroidMesh.rotation.x = Math.PI / 2;
    asteroidMesh.position.z = -140; 
    asteroidMesh.renderOrder = -90;
    camera.add(asteroidMesh);
    (scene as any).userData.asteroidMat = asteroidMat;
    // --------------------------

    const planetMeshes: Record<string, THREE.Mesh> = {};
    const orbitMeshes: Record<string, THREE.LineSegments> = {};


    const initialPaddedScales = getPaddedOrbitalDistances();

    const sharedPlanetGeo = new THREE.CircleGeometry(1, planetPrefsRef.current.planetResolution || 32);
    (scene as any).userData.sharedPlanetGeo = sharedPlanetGeo;
    (scene as any).userData.currentPlanetResolution = planetPrefsRef.current.planetResolution || 32;

    // Match the exact physical bounding box of a CircleGeometry(1) which spans from -1 to 1!
    const sharedVectorGeo = new THREE.PlaneGeometry(2, 2);
    (scene as any).userData.sharedVectorGeo = sharedVectorGeo;

    solarBodies.forEach((sbConfig: any) => {
        
        let physR = initialPaddedScales[sbConfig.name] || 0;

        // Initialize orbit with unit radius, then scale it natively so it never leaks VBOs
        const ringGeo = new THREE.EdgesGeometry(new THREE.CircleGeometry(1, 768));
        const ringMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15 });
        const ringMesh = new THREE.LineSegments(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = -2.0; // Physically push the orbit line under the planet
        ringMesh.renderOrder = -5;  // Force early draw order so transparent planets render on top
        ringMesh.scale.setScalar(physR);
        mapGroup.add(ringMesh);
        orbitMeshes[sbConfig.name] = ringMesh;

        // Apply mathematical layout flattening to preserve the fractal ratio while making small planets visible natively
        const pRadius = Math.pow((sbConfig.r || 60), planetPrefsRef.current.radiusCurve) * 0.35;
        const pGeo = sharedPlanetGeo;
        
        // Correctly parse string hex colors from config (e.g. '#ff0000') using THREE.Color
        const safeColor = new THREE.Color(sbConfig.color || 0xcccccc);
        const pMat = new THREE.MeshBasicMaterial({ color: safeColor, side: THREE.DoubleSide, transparent: true });
        
        const pMesh = new THREE.Mesh(pGeo, pMat);
        if (sbConfig.name.toUpperCase() !== 'SUN') {
            pMesh.rotation.x = -Math.PI / 2;
        }
        pMesh.userData = { planetName: sbConfig.name };
        
        // Build the split gradient mesh natively behind every planet!
        const targetBlending = planetPrefsRef.current.additiveGlows ? THREE.AdditiveBlending : THREE.NormalBlending;
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false, // Ensures gradients don't clip with asteroids
            blending: targetBlending // Restore user preference to prevent tinting!
        });
        const sunGlowMesh = new THREE.Mesh(sharedVectorGeo, glowMat);
        sunGlowMesh.name = 'sunGlowMesh';
        sunGlowMesh.position.z = -0.1; // Push it physically behind
        
        // STRICT RENDER ORDER
        // The glow mesh must render BEFORE the core mesh so the crisp core is always drawn on top of the blurry gradients!
        // If they swap, the core looks like a blurry low-res peach blob.
        sunGlowMesh.renderOrder = -2;
        pMesh.renderOrder = -1;
        
        pMesh.add(sunGlowMesh);
        pMesh.userData.sunGlowMesh = sunGlowMesh;
        
        mapGroup.add(pMesh);
        planetMeshes[sbConfig.name] = pMesh;
    });

    (scene as any).userData.planetMeshes = planetMeshes;
    (scene as any).userData.orbitMeshes = orbitMeshes;

    // --- SELECTION RING & WAYPOINT LINE ---
    const selectionRingGeo = new THREE.EdgesGeometry(new THREE.CircleGeometry(1.0, 64));
    const selectionRingMat = new THREE.LineBasicMaterial({ color: 0x00f7ff, transparent: true, opacity: 0.8 });
    const selectionRingMesh = new THREE.LineSegments(selectionRingGeo, selectionRingMat);
    selectionRingMesh.rotation.x = -Math.PI / 2;
    selectionRingMesh.visible = false;
    mapGroup.add(selectionRingMesh);
    (scene as any).userData.selectionRingMesh = selectionRingMesh;

    const hoverRingGeo = new THREE.EdgesGeometry(new THREE.CircleGeometry(1.0, 64));
    const hoverRingMat = new THREE.LineBasicMaterial({ color: 0x00f7ff, transparent: true, opacity: 0.0 });
    const hoverRingMesh = new THREE.LineSegments(hoverRingGeo, hoverRingMat);
    hoverRingMesh.rotation.x = -Math.PI / 2;
    hoverRingMesh.visible = false;
    mapGroup.add(hoverRingMesh);
    (scene as any).userData.hoverRingMesh = hoverRingMesh;

    const waypointLineMat = new THREE.LineDashedMaterial({
        color: 0xd8b4fe, // light purple
        dashSize: 1.0,
        gapSize: 0.5,
        transparent: true,
        opacity: 0.8,
        depthTest: true,
        depthWrite: false
    });
    const waypointLineGeo = new THREE.BufferGeometry();
    const wpPositions = new Float32Array(6);
    waypointLineGeo.setAttribute('position', new THREE.BufferAttribute(wpPositions, 3));
    const waypointLineMesh = new THREE.Line(waypointLineGeo, waypointLineMat);
    waypointLineMesh.visible = false;
    waypointLineMesh.renderOrder = -4; // Draw under planets (which are -1) but above rings (-5)
    mapGroup.add(waypointLineMesh);
    (scene as any).userData.waypointLineMesh = waypointLineMesh;

    const autoTourLineMat = new THREE.LineDashedMaterial({ color: 0xa855f7, dashSize: 0.75, gapSize: 0.75, transparent: true, opacity: 0.8 });
    const autoTourLineGeo = new THREE.BufferGeometry();
    const autoTourLineGeoPositions = new Float32Array(200 * 3);
    autoTourLineGeo.setAttribute('position', new THREE.BufferAttribute(autoTourLineGeoPositions, 3));
    const autoTourLineMesh = new THREE.Line(autoTourLineGeo, autoTourLineMat);
    autoTourLineMesh.visible = false;
    mapGroup.add(autoTourLineMesh);
    (scene as any).userData.autoTourLineMesh = autoTourLineMesh;
    // --------------------------------------

    const shipGroup = createHighFidelityShipGroup();
    scene.add(shipGroup);

    // Unpack variables needed by the rest of ShipBankDemo
    const engLight = shipGroup.userData.engLight;
    const auraMesh = shipGroup.userData.auraMesh;
    const planeModel = shipGroup.userData.planeModel;
    planeModelRef.current = planeModel;
    const underbellyPlane = shipGroup.userData.underbellyPlane;


    const optTrailSystem = trailSystemOverride ? trailSystemOverride.create(scene) : createOptimizedTrailSystem(10000);
    const trailGeo = optTrailSystem.geometry;
    const trailMat = optTrailSystem.material;
    const trail = optTrailSystem.mesh;
    scene.add(trail);
    (scene as any).userData.playerOptTrail = optTrailSystem;

    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    (scene as any).userData.nodeGroup = nodeGroup;



    const waypoints = [
      { x:  30, z:  30, color: '#FF0055' },
      { x: -30, z:  20, color: '#00FF44' },
      { x: -20, z: -40, color: '#3300FF' },
      { x:  40, z: -25, color: '#FF9900' },
    ];

    const nodeGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });

    waypoints.forEach((wp, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: wp.color });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(wp.x, 8, wp.z);
      nodeGroup.add(mesh);
      mesh.userData = { isNode: true, colorHex: wp.color };
      const nextWp = waypoints[(i + 1) % waypoints.length];
      const pts = [new THREE.Vector3(wp.x, 8, wp.z), new THREE.Vector3(nextWp.x, 8, nextWp.z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, lineMat);
      nodeGroup.add(line);
    });

    // Native Waypoint Transit Line for active Map Autopilot overlay rendering
    const wplGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const wplMat = new THREE.LineDashedMaterial({ color: 0x00f7ff, dashSize: 0.15, gapSize: 0.15, linewidth: 2, transparent: true, opacity: 0.35 });
    const wplObj = new THREE.Line(wplGeo, wplMat);
    wplObj.computeLineDistances();
    wplObj.visible = false;
    // SPAWN EDGE OF UNIVERSE ONLY FOR FLIGHT MODEL
    let shipX = 0;
    let shipZ = 0;
    let velX = 0, velZ = 0;
    let cumSunX = 0, cumSunZ = 0;
    
    let heading  = isPlanetSystem ? 0 : -Math.PI / 4; 
    let speed    = 0; 
    let bankAngle = 0;
    let turnRate  = 0;
    let currentSquash = 1.0;

    const BOUND      = 55;
    
    let isIdleScreensaverActive = !isCmsMode;
    const keys: Record<string, boolean> = {};
    const onDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      triggerActivity();
      if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
         // Manual WASD flight controls ALWAYS break you out of autopilot immediately
         if (paramsRef.current.autoPilot || paramsRef.current.autoTour || paramsRef.current.cruiseMode) {
             setParams(p => ({ ...p, autoPilot: false, autoTour: false, cruiseMode: false }));
             paramsRef.current.autoPilot = false;
             paramsRef.current.autoTour = false;
             paramsRef.current.cruiseMode = false;
         }
         isIdleScreensaverActive = false;
         e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    
    let flightLastActivityTime = performance.now();
    let lastActiveCinematicMode = false;
    const triggerActivity = () => { 
        flightLastActivityTime = performance.now(); 
        // We NO LONGER cancel autoTour or autoPilot here!
        // "Mouse movement has nothing to do with tour mode it only has to do with cinematic camera and letter box"
    };
    window.addEventListener('keydown', onDown, { capture: true });
    window.addEventListener('keyup',   onUp, { capture: true });
    window.addEventListener('pointerdown', triggerActivity, { capture: true });
    window.addEventListener('pointermove', triggerActivity, { capture: true });
    window.addEventListener('mousemove', triggerActivity, { capture: true });
    window.addEventListener('wheel', triggerActivity, { capture: true });

    let rafId = 0;

    // CINEMATIC "OFF-STAGE" SPAWN (Starts incredibly wide and dynamically zooms into the player over the first few seconds)
    let currentCameraZoom = isPlanetSystem ? mapZoomRef.current : ((paramsRef.current as any).cinematicCloseZoom || 1.0);
    let parallaxWeight = 1.0;

    // POSSESSION PROXY ENGINES
    const drones: Record<string, { group: THREE.Group, x: number, z: number, heading: number, speed: number, turnRate: number, turnOffset: number, mode: string, activeSpreadX?: number, activeSpreadZ?: number, pocketHeading?: number }> = {};
    
    // Inject the camera target massively off-axis from the player so it organically sweeps in upon scene boot!
    let cameraTargetX = isPlanetSystem ? 0 : shipX + 800;
    let cameraTargetZ = isPlanetSystem ? 0 : shipZ - 800;
    let currentStarOpacity = 1.0;
    
    // AUTO TOUR STATE
    let tourTargetIdx = 0;
    let tourWaitTimer = 0;
    let tourPhase: 'MOVE' | 'ORBIT' = 'MOVE';


    let fpsFrames = 0;
    let fpsLastTime = performance.now();
    let lastRenderTime = performance.now();
    
    // Hide tracker instantly on initial load, letting it seamlessly fade in after assets stabilize
    let mapTrackerOpacity = 0.0;

    // ZERO-ALLOCATION CACHE FOR RENDER LOOP
    const loopAmbColor = new THREE.Color();
    const loopSunColor = new THREE.Color();
    const loopNodeColor = new THREE.Color();
    const loopSpRim = new THREE.Color();
    const loopSpEdge = new THREE.Color();
    const loopLocalSunPos = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (isContextLostRef.current) return;

      fpsFrames++;
      let nowTime = performance.now();
      
      // Calculate delta and strictly clamp to 0.1s (10 FPS equivalent) 
      // This prevents massive physics explosions and camera overshoots when switching tabs or experiencing lag spikes!
      const delta = Math.min((nowTime - lastRenderTime) / 1000.0, 0.1);
      lastRenderTime = nowTime;
      
      // Calculate Idle State for Cinematic Camera Overrides
      const isIdleNow = (nowTime - flightLastActivityTime > (paramsRef.current.uiFadeDelay || 3) * 1000);
      const activeCinematicMode = isCinematicModeRef.current && isIdleNow;

      if (activeCinematicMode !== lastActiveCinematicMode) {
          lastActiveCinematicMode = activeCinematicMode;
          window.dispatchEvent(new CustomEvent('arn_cinematic_mode_change', { detail: activeCinematicMode }));
          
          // Smoothly fade out engine-level native UI directly (bypassing React re-renders)
          const speedContainer = document.getElementById('cosmic-speedometer-container');
          if (speedContainer) speedContainer.style.opacity = activeCinematicMode ? '0' : '1';
          
          const fpsCounter = document.getElementById('cosmic-fps-counter');
          if (fpsCounter) fpsCounter.style.opacity = activeCinematicMode ? '0' : '1';
      }

      // Screensaver overrides computed once per frame
      let dynamicLetterboxEnabled = (paramsRef.current as any).letterboxEnabled;
      const overrideCinBehavior: string | null = null;
      
      // We no longer turn off dynamicLetterboxEnabled based on isAutomatedFlight, 
      // it is now driven strictly by activeCinematicMode later in the render pipeline!
      
      // If News is open, strictly disable the letterbox and prevent the idle timeout from engaging
      if (showNewsRef.current) {
          dynamicLetterboxEnabled = false;
          flightLastActivityTime = nowTime;
      }
      
      // Override letterbox for Website mode
      if (activeThemeRef.current === 'website') {
          dynamicLetterboxEnabled = false;
      }
      
      if (nowTime - fpsLastTime >= 1000) {
          if (fpsRef.current) {
              const currentFps = Math.round((fpsFrames * 1000) / (nowTime - fpsLastTime));
              fpsRef.current.innerText = `${currentFps} FPS`;
          }
          fpsFrames = 0;
          fpsLastTime = nowTime;
      }

      // Reset the emissions array each frame so we don't accumulate thousands of splat commands
      // We will reassign the array atomically later to prevent RAF race conditions with SplashCursor

      


      let left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
      let right = keys['ArrowRight'] || keys['d'] || keys['D'];
      let fwd   = keys['ArrowUp']    || keys['w'] || keys['W'];
      let back  = keys['ArrowDown']  || keys['s'] || keys['S'];
      let fire  = keys[' ']; // Spacebar to fire
      let analogSteer: number | null = null;

      // Physical override cancels autopilot instantly and triggers activity state
      if (left || right || fwd || back) {
          isMapAutopilotActiveRef.current = false;
          // Manual WASD immediately snaps you out of ANY auto mode
          if (paramsRef.current.autoPilot || paramsRef.current.autoTour || paramsRef.current.cruiseMode) {
              setParams(p => ({ ...p, autoPilot: false, autoTour: false, cruiseMode: false }));
              paramsRef.current.autoPilot = false;
              paramsRef.current.autoTour = false;
              paramsRef.current.cruiseMode = false;
          }
          isIdleScreensaverActive = false;
          triggerActivity();
      } else {
          // If the configured timeout of pure idle has passed while in normal flight tracking...
          // We only engage the timeout if the ship is NOT already flying itself in an automated mode
          // AND we only engage it if we are NOT in CMS Mode (i.e. we are in port 3006 / Screensaver wrapper)
          if (!isCmsMode && !paramsRef.current.autoTour && !paramsRef.current.autoPilot && !paramsRef.current.cruiseMode && !isMapAutopilotActiveRef.current && !showMapRef.current) {
              if (isIdleNow) {
                  isIdleScreensaverActive = true;
                  if (targetPlanetNameRef.current) {
                      console.log(`[ShipBank] Idle Timeout Reached (${(paramsRef.current.uiFadeDelay || 3) * 1000}ms). Engaging Waypoint Autopilot!`);
                      isMapAutopilotActiveRef.current = true;
                  } else {
                      console.log(`[ShipBank] Idle Timeout Reached (${(paramsRef.current.uiFadeDelay || 3) * 1000}ms). Engaging Auto-Tour natively!`);
                      setParams(p => ({ ...p, autoTour: true, autoPilot: false, cruiseMode: false }));
                      paramsRef.current.autoTour = true;
                  }
                  // We explicitly DO NOT reset flightLastActivityTime here anymore.
                  // Doing so would instantly cancel the activeCinematicMode calculated above!
              }
          }
      }

      if (targetPlanetNameRef.current && (scene as any).userData.planetMeshes) {
          const tMesh = (scene as any).userData.planetMeshes[targetPlanetNameRef.current];
          if (tMesh) {
              const physicalPlanetX = tMesh.position.x;
              const physicalPlanetZ = tMesh.position.z;
              
              if ((scene as any).userData.waypointLine) {
                 MathCache.vec1.set(shipX, 0, shipZ);
                 MathCache.vec2.set(physicalPlanetX, 0, physicalPlanetZ);
                 wl.geometry.setFromPoints([MathCache.vec1, MathCache.vec2]);
                 wl.computeLineDistances();
                 wl.visible = showMapRef.current; // only draw transit line natively on Map overlay
              }
              
              // Live Distance update running every frame mapped perfectly to global Engine constant
              const distWorldX = physicsToWorldRef.current(physicalPlanetX - shipX);
              const distWorldZ = physicsToWorldRef.current(physicalPlanetZ - shipZ);
              const unscaledDist = Math.hypot(distWorldX, distWorldZ);
              
              const W_ref = typeof window !== 'undefined' ? window.innerWidth : 1280;
              const distAu = unscaledDist / W_ref;
              const distEl = document.getElementById("hud-waypoint-dist");
              if (distEl) {
                  if (distAu > 0.1) {
                      distEl.innerText = `· ${distAu.toFixed(2)} AU`;
                  } else {
                      distEl.innerText = `· ${(distAu * 149597870).toLocaleString(undefined, { maximumFractionDigits: 0 })} KM`;
                  }
              }

              const approachTimeEl = document.getElementById("hud-approach-time");
              if (approachTimeEl) {
                  // Use theoretical max speed for a perfectly stable countdown, avoiding wild swings during acceleration
                  const p = paramsRef.current;
                  const W_game = typeof window !== 'undefined' ? window.innerWidth : 1280;
                  let responsiveSpeedPerSec = (W_game / 120) * (p.maxSpeed / 0.10);
                  if (responsiveSpeedPerSec > W_game / 4) responsiveSpeedPerSec = W_game / 4;
                  const maxSpeedPerFrame = responsiveSpeedPerSec / 60;

                  if (maxSpeedPerFrame > 0.0001) {
                      // We use maxSpeedPerFrame so the timer is purely distance-based and incredibly stable
                      // CRITICAL: We calculate the raw physical distance, ignoring the 100x physicsToWorld multiplier!
                      const physicalDist = Math.hypot(physicalPlanetX - shipX, physicalPlanetZ - shipZ);
                      const secondsRemaining = physicalDist / (maxSpeedPerFrame * 60);
                      const totalH = Math.floor(secondsRemaining / 3600);
                      const m = Math.floor((secondsRemaining % 3600) / 60);
                      const s = Math.floor(secondsRemaining % 60);
                      const d = Math.floor(totalH / 24);
                      const h = totalH % 24;
                      let timeString = '';
                      if (d > 0) timeString = `${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M`;
                      else timeString = `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
                      approachTimeEl.innerText = timeString;
                  } else {
                      approachTimeEl.innerText = "CALCULATING...";
                  }
              }

              if (isMapAutopilotActiveRef.current) {
                  // Calculate shortest heading difference mapped to true native WebGL node position
                  // Note: ship heading 0 maps to (dx=0, dz=-1). Math.atan2(dy,dx) requires translation.
                  const targetHeading = Math.atan2(physicalPlanetZ - shipZ, physicalPlanetX - shipX) + Math.PI / 2;
                  let diff = targetHeading - heading;
                  diff = Math.atan2(Math.sin(diff), Math.cos(diff));

                  // Smoothly steer perfectly to waypoint target
                  analogSteer = Math.max(-1, Math.min(1, diff * 12.0));
                  
                  // Only engage thrusters once roughly aligned to avoid wide corkscrew loops
                  if (Math.abs(diff) < 0.6) fwd = true;
                  
                  // Brake gracefully when arriving
                  if (unscaledDist < 800.0) {
                      fwd = false;
                      if (unscaledDist < 200.0) {
                          isMapAutopilotActiveRef.current = false;
                          if (targetPlanetNameRef.current !== null) {
                              targetPlanetNameRef.current = null; // CLEAR target so the idle timeout can safely engage auto-tour!
                              setTargetPlanetName(null);
                          }
                      }
                  }
              }
          }
      } else if (scene && (scene as any).userData.waypointLine) {
          (scene as any).userData.waypointLine.visible = false;
      }

      const p = paramsRef.current;
      
      if (p.autoPilot) {
        fwd = true;
        const time = Date.now() * 0.001;
        const autoBank = Math.sin(time * 0.5) + Math.sin(time * 0.23) * 0.5;
        analogSteer = autoBank;
      }
      
      if (p.cruiseMode) {
        fwd = true;
        const distToSun = Math.sqrt(cumSunX * cumSunX + cumSunZ * cumSunZ);
        const targetHeading = Math.atan2(-cumSunX, cumSunZ);
        let angleDiff = targetHeading - heading;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        if (distToSun > 45.0) {
            analogSteer = Math.max(-1, Math.min(1, angleDiff * 8.0));
        } else if (distToSun > 15.0) {
            if (Math.abs(angleDiff) < Math.PI / 2) {
               analogSteer = Math.max(-1, Math.min(1, angleDiff * 5.0));
            }
        }
      }

      if (p.autoTour) {
         fwd = true;
         
         const waypoints = customTourWaypointsRef.current || [...solarBodies].filter((b: any) => b.worldR > 0).sort((a: any, b: any) => (a.baseAngle || 0) - (b.baseAngle || 0));
         if (waypoints.length > 0) {
             const wp = waypoints[tourTargetIdx % waypoints.length] as any;
             
             // DO NOT force the UI camera map target to snap around during flight plans natively!
             // Let the auto steer target the waypoint mathematically in the background without kidnapping the user's interactive map tracking!
             // Extract real-time planet coordinates dynamically from exact 3D render mesh if available
             let targetX = 0;
             let targetZ = 0;
             const tgtMesh = (scene as any).userData.planetMeshes?.[wp.name];
             if (tgtMesh) {
                 targetX = tgtMesh.position.x;
                 targetZ = tgtMesh.position.z;
             } else {
                 const tNow = performance.now();
                 const bAngle = wp.baseAngle + (tNow * wp.orbSpeed) / 16.67;
                 let physR = dynamicPaddedScalesRef.current?.[wp.name] || 0;
                 targetX = Math.cos(bAngle) * physR * planetPrefsRef.current.orbitScale;
                 targetZ = Math.sin(bAngle) * physR * planetPrefsRef.current.orbitScale;
             }
             
             // Calculate distance from Ship to Planet Target
             // Target coordinates reflect absolute world position relative to 0,0,0. 
             // Ship position natively lives at cumSunX/cumSunZ.
             const dx = targetX - cumSunX;
             const dz = targetZ - cumSunZ;
             const distToTarget = Math.sqrt(dx*dx + dz*dz);
             
             if (tourPhase === 'MOVE') {
                 let targetHeading = Math.atan2(dx, -dz); // Native compass heading
                 
                 let angleDiff = targetHeading - heading;
                 angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)); // Normalize -PI to PI
                 
                 // Soft turn coefficient (0.2) forces wide, natural banking
                 analogSteer = Math.max(-1, Math.min(1, angleDiff * 0.2));
                 fwd = true;
                 
                 // Wait until the ship actually reaches the edge of the planet
                 const orbitRadius = Math.max((wp.r || 60) * 1.5, 120);
                 if (distToTarget < orbitRadius) {
                     tourPhase = 'OVERSHOOT'; // Switch to coasting phase
                     tourWaitTimer = Date.now();
                 }
             } else if (tourPhase === 'OVERSHOOT') {
                 // Coast perfectly straight so the ship crosses the entire radius and exits the other side!
                 analogSteer = 0.0;
                 fwd = true;
                 
                 // Coast for 1.5 seconds to ensure it clears the planet body before turning
                 if (Date.now() - tourWaitTimer > 1500) {
                     tourPhase = 'MOVE';
                     tourTargetIdx++; // Lock onto the next planet in the path
                 }
             }
         }
      }

      const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
      
      // Responsive Speed Mapping (Continuous Linear based on maxSpeed)
      // Base: 0.10 = 120s flight (W/120). Scaled linearly from there.
      let responsiveSpeedPerSec = (W / 120) * (p.maxSpeed / 0.10);
      
      const MAX_SPEED = responsiveSpeedPerSec / 60; // Convert to per-frame (60 FPS assumption)
      const TURN_SPD  = p.turnSpeed;
      const MAX_BANK  = p.maxBankDeg * Math.PI / 180;
      
      const accelScale = MAX_SPEED / Math.max(0.0001, p.maxSpeed);
      const DYNAMIC_ACCEL = p.acceleration * accelScale;

      // Standard Flight Model Physics
      if (analogSteer !== null) {
          turnRate += (analogSteer - turnRate) * 0.08;
      } else {
          if (right)      turnRate = Math.min( 1, turnRate + 0.025);
          else if (left)  turnRate = Math.max(-1, turnRate - 0.025);
          else            turnRate *= 0.92;
      }

      heading += turnRate * TURN_SPD;

      const nx = Math.sin(heading), nz = -Math.cos(heading);
      const rightX = Math.cos(heading), rightZ = Math.sin(heading); 
      
      let vFwd = velX * nx + velZ * nz;
      let vRight = velX * rightX + velZ * rightZ;

      if (fwd) {
          vFwd = Math.min( MAX_SPEED, vFwd + DYNAMIC_ACCEL);
      } else if (back) {
          const retroMult = vFwd > 0.0 ? p.retroBrake : 1.0;
          vFwd = Math.max(-MAX_SPEED * 0.4, vFwd - (DYNAMIC_ACCEL * retroMult));
      } else {
          vFwd *= p.driftFriction; 
      }
      
      speed = vFwd;

      const driftFactor = p.corneringDrift !== undefined ? p.corneringDrift : 0.0;
      const latGrip = Math.max(0.002, 1.0 - Math.pow(driftFactor, 0.2));
      
      vRight += (0 - vRight) * latGrip;
      
      velX = vFwd * nx + vRight * rightX;
      velZ = vFwd * nz + vRight * rightZ;

      shipX += velX;
      shipZ += velZ;
      
      shipPosRef.current.x = shipX;
      shipPosRef.current.z = shipZ;
      
      cumSunX += velX;
      cumSunZ += velZ;
      
      const dLight = (scene as any).userData.dirLight as THREE.DirectionalLight;
      if (dLight && dLight.target) {
        const sunAzWorld = Math.atan2(p.sunX, p.sunZ || 0.001);
        const sunDist = Math.sqrt(p.sunX*p.sunX + p.sunZ*p.sunZ) || 1.0;
        let relativeAngle = sunAzWorld - heading;
        while(relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while(relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
        const CLAMP_ANGLE = 170 * Math.PI / 180;
        if (relativeAngle > CLAMP_ANGLE) relativeAngle = CLAMP_ANGLE;
        if (relativeAngle < -CLAMP_ANGLE) relativeAngle = -CLAMP_ANGLE;
        const finalAz = heading + relativeAngle;
        dLight.position.set(shipX + Math.sin(finalAz) * sunDist, p.sunY, shipZ + Math.cos(finalAz) * sunDist);
        dLight.target.position.set(shipX, 0, shipZ);
      }
      
      if ((scene as any).userData.grid) {
        const gridRef = (scene as any).userData.grid;
        const anchorX = showMapRef.current ? cameraTargetX : shipX;
        const anchorZ = showMapRef.current ? cameraTargetZ : shipZ;
        gridRef.position.x = anchorX - (anchorX % 2.0);
        gridRef.position.z = anchorZ - (anchorZ % 2.0);
        gridRef.visible = p.showGrid && currentCameraZoomRef.current > 0.2;
      }

      if (sunPosRef.current && el) {
        targetLayoutX.current += (0.5 - targetLayoutX.current) * 0.05;
        targetLayoutY.current += (0.5 - targetLayoutY.current) * 0.05;
        
        parallaxWeight += ((showMapRef.current ? 0.0 : 1.0) - parallaxWeight) * 0.05;

        sunPosRef.current.x = (el.clientWidth * targetLayoutX.current) - cumSunX * 24.0 * parallaxWeight; 
        sunPosRef.current.y = (el.clientHeight * targetLayoutY.current) - cumSunZ * 24.0 * parallaxWeight;
        
        if (worldPosRef.current) {
           worldPosRef.current.x = cumSunX * 24.0;
           worldPosRef.current.y = cumSunZ * 24.0;
        }
      }

      if (sceneRoot) {
           // 3D Planet Kinematics removed. Rendering passed natively to Cartesian SVG UI bindings tracked to `CoordinateEngine` outputs.
           
           // Existing Camera and Engine Kinematics
           const engineLight = p.cruiseMode ? 2.5 : Math.min(1.5, Math.abs(speed) / MAX_SPEED * 1.5);
      }

      bankAngle += (turnRate * MAX_BANK - bankAngle) * p.tiltSpeed;
      const targetSquash = 1.0 - Math.min(1.0, Math.abs(bankAngle) / (MAX_BANK || 0.001)) * p.bankSquashAmount;
      currentSquash += (targetSquash - currentSquash) * p.bankSquashSpeed;

      shipGroup.position.set(shipX, 0, shipZ);
      shipGroup.rotation.y = -heading;
      shipGroup.visible = !showMapRef.current;

      // Viewport Bounds Scaling Tracker (prevents visually violent edge clipping on ultrawide monitors)
      const dynamicConstraintRadius = Math.max(400, (el ? Math.max(el.clientWidth, el.clientHeight) : 1000) * 0.25 + 150);
      if (scene.fog) {
          MathCache.vec1.set(cameraTargetX, 0, cameraTargetZ);
          const focusDist = camera.position.distanceTo(MathCache.vec1);
          // Push the fog planes radically far out to prevent edge-darkening (vignette) artifacts during cinematic zooms
          (scene.fog as THREE.Fog).near = focusDist + dynamicConstraintRadius * 1.5;
          (scene.fog as THREE.Fog).far  = focusDist + dynamicConstraintRadius * 3.5;
      }

      // Dynamically map EXACTLY what the user toggles from the CMS (respecting hangar toggle)
      let rawIds = spawnedShipIdsRef.current;
      // tour_racing_prefs respects hangar toggle — only spawned ships appear
        
      // Strictly prevent array overlaps (e.g. if the user manually selects a ship that is already flying as a wingman)
      // This enforces exactly 1 active player ship and independent active wingmen
      const renderIds = [
         playerShipIdRef.current,
         ...rawIds.filter(id => id !== playerShipIdRef.current)
      ];
      
      renderIds.forEach(id => {
         if (id !== playerShipIdRef.current && !drones[id]) {
             // Prevent ThreeJS circular JSON crash by stripping out attached shaders before cloning
             const savedShaders: any[] = [];
             shipGroup.traverse((child: any) => {
                 if (child.material && child.material.userData && child.material.userData.shader) {
                     savedShaders.push({ mat: child.material, shader: child.material.userData.shader });
                     delete child.material.userData.shader;
                 }
             });
             
             const newDrGroup = shipGroup.clone();
             
             // Restore shaders on the original group
             savedShaders.forEach(item => {
                 item.mat.userData.shader = item.shader;
             });
             const ringGeo = new THREE.RingGeometry(3.5, 4.0, 32);
             const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
             const targetRing = new THREE.Mesh(ringGeo, ringMat);
             targetRing.rotation.x = -Math.PI / 2; // Lie flat
             scene.add(targetRing);

             newDrGroup.traverse((child: any) => { 
                 child.frustumCulled = false; 
                 if (child.userData && child.userData.engineInstancedMesh) {
                     child.userData.engineInstancedMesh = undefined;
                 }
             });
             const optTrailSystem = trailSystemOverride ? trailSystemOverride.create(scene) : createOptimizedTrailSystem(4000);
             const wTrailPoints = optTrailSystem.mesh;
             scene.add(wTrailPoints);
             
             const arrIndex = renderIds.indexOf(id);
             const index = Math.max(0, arrIndex - 1);
             const { x: targetSpreadX, z: targetSpreadZ } = getFormationOffset(index, activeFormationRef.current);
             
             // Spawn scattered off-screen to the rear so they dramatically fly in to meet the lead ship
             const spawnDistanceZ = targetSpreadZ - 80 - (index * 20); // deeply off screen, staggered!
             const spawnDistanceX = targetSpreadX + (Math.random() * 80 - 40); // scatter horizontally
             
             const spawnX = shipX + Math.cos(heading) * spawnDistanceX + Math.sin(heading) * spawnDistanceZ;
             const spawnZ = shipZ + Math.sin(heading) * spawnDistanceX - Math.cos(heading) * spawnDistanceZ;
             
             drones[id] = {
                group: newDrGroup,
                targetRing: targetRing,
                x: spawnX, 
                z: spawnZ,
                heading: heading,
                speed: speed,
                activeSpreadX: targetSpreadX,
                activeSpreadZ: targetSpreadZ,
                 turnRate: 0,
                turnOffset: Math.random() * Math.PI * 2,
                mode: 'spawnDelay',
                spawnTime: Date.now(),
                pocketHeading: heading,
                
                optTrail: optTrailSystem
             };
             const shipDef = shipsRef.current.find(s => s.id === id);
             // No fallback to shipsRef[0] — bail out to avoid rendering lead ship textures on wrong drone
             if (!shipDef) { scene.add(drones[id].group); return; }
             const texLoader = new THREE.TextureLoader((window as any).ARN_LOADING_MANAGER);
             texLoader.setCrossOrigin('anonymous');

             const configTex = (t: THREE.Texture) => {
                 t.colorSpace = THREE.SRGBColorSpace;
                 t.center.set(0.5, 0.5);
                 t.rotation = 0;
                 t.wrapS = THREE.RepeatWrapping;
                 t.wrapT = THREE.RepeatWrapping;
                 t.minFilter = THREE.LinearMipMapLinearFilter;
                 t.magFilter = THREE.LinearFilter;
                 t.generateMipmaps = true;
                 t.anisotropy = 16;
                 return t;
             };

             // Load all 4 maps in parallel — apply to material only when all are ready
             const loadTex = (url: string) => new Promise<THREE.Texture>(resolve => {
                 texLoader.load(url, t => resolve(configTex(t)), undefined, () => {
                     // On error, resolve with a 1x1 transparent fallback so the ship still renders
                     const fb = new THREE.DataTexture(new Uint8Array([0,0,0,0]), 1, 1, THREE.RGBAFormat);
                     fb.needsUpdate = true;
                     resolve(fb);
                 });
             });

             Promise.all([
                 loadTex(shipDef.colorUrl),
                 shipDef.alphaUrl ? loadTex(shipDef.alphaUrl) : Promise.resolve(null),
                 shipDef.bumpUrl  ? loadTex(shipDef.bumpUrl)  : Promise.resolve(null),
                 shipDef.lightUrl ? loadTex(shipDef.lightUrl) : Promise.resolve(null),
             ]).then(([colorT, alphaT, bumpT, lightT]) => {
                 const dronePM = drones[id]?.group?.getObjectByName('planeModel') as THREE.Mesh;
                 if (!dronePM) return;

                 // Scale the mesh now that we know the texture dimensions
                 const aspectX = (colorT.image?.width || 1) / (colorT.image?.height || 1);
                 const shipScale = 1.0 + ((shipDef.tier || 1) - 1) * 0.35;
                 const sz = Math.max(0.01, p.planeSize) * shipScale;
                 dronePM.scale.set(sz * aspectX, sz, sz);
                 dronePM.userData.aspectX = aspectX;
                 dronePM.userData.shipScale = shipScale;
                 dronePM.userData.baseRotation = (shipDef as any).rotation || 0;

                 // Hide underbelly ghost
                 const underbelly = drones[id]?.group?.getObjectByName('underbellyPlane') as THREE.Mesh;
                 if (underbelly) underbelly.visible = false;

                 // Store textures for per-frame render loop
                 dronePM.userData.currentTextures = { map: colorT, alphaMap: alphaT, bumpMap: bumpT, lightMap: lightT };

                 // Build a fully-independent material with all 4 maps
                 const newDroneMat = (dronePM.material as THREE.Material).clone() as THREE.MeshPhysicalMaterial;
                 newDroneMat.customProgramCacheKey = () => id;
                 newDroneMat.onBeforeCompile = (dronePM.material as any).onBeforeCompile;
                 newDroneMat.map = colorT;
                 newDroneMat.alphaMap = alphaT;
                 newDroneMat.bumpMap = bumpT;
                 newDroneMat.lightMap = lightT;
                 if (lightT) newDroneMat.lightMapIntensity = 2.0;
                 newDroneMat.needsUpdate = true;
                 dronePM.material = newDroneMat;

                 // Mirror maps onto underbelly
                 if (underbelly) {
                     const newUnderMat = (underbelly.material as THREE.Material).clone() as THREE.MeshPhysicalMaterial;
                     newUnderMat.customProgramCacheKey = () => id + '_under';
                     newUnderMat.onBeforeCompile = (underbelly.material as any).onBeforeCompile;
                     newUnderMat.map = colorT;
                     newUnderMat.alphaMap = alphaT;
                     newUnderMat.bumpMap = bumpT;
                     newUnderMat.lightMap = lightT;
                     if (lightT) newUnderMat.lightMapIntensity = 2.0;
                     newUnderMat.needsUpdate = true;
                     underbelly.material = newUnderMat;
                 }

                 const sharedIM = drones[id]?.group?.getObjectByName('engineInstancedMesh') as THREE.InstancedMesh;
                 const sharedRM = drones[id]?.group?.getObjectByName('reactorInstancedMesh') as THREE.InstancedMesh;
                 if (sharedIM && dronePM) {
                     dronePM.userData.engineInstancedMesh = sharedIM;
                     const newThrottleAttr = new Float32Array(20);
                     sharedIM.geometry = sharedIM.geometry.clone();
                     sharedIM.geometry.setAttribute('aThrottle', new THREE.InstancedBufferAttribute(newThrottleAttr, 1));
                 }
                 if (sharedRM && dronePM) {
                     dronePM.userData.reactorInstancedMesh = sharedRM;
                 }

                 // DEBUG POSITIONAL TRACKER
                 if (!dronePM.children.find((c: any) => c.name === 'pinkBox')) {
                     const pinkBox = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
                     pinkBox.name = 'pinkBox';
                     pinkBox.position.set(0, 30, 0);
                     pinkBox.visible = false;
                     dronePM.add(pinkBox);
                 }
             });

             scene.add(drones[id].group);
         }
      });
      
      Object.keys(drones).forEach(id => {
         if (!renderIds.includes(id) || id === playerShipIdRef.current) {
             scene.remove(drones[id].group);
             if (drones[id].targetRing) {
                 scene.remove(drones[id].targetRing);
                 drones[id].targetRing.geometry.dispose();
                 drones[id].targetRing.material.dispose();
             }
             if (drones[id].optTrail && drones[id].optTrail.mesh) {
                 scene.remove(drones[id].optTrail.mesh);
             }
             delete drones[id];
         }
      });
      
      // Securely lock ordering to guarantee drones obey their designated formation slots
      const validWingmen = renderIds.filter(id => id !== playerShipIdRef.current);
      
      let anyCatchingUp = false;

      validWingmen.forEach((id, index) => {
         const dr = drones[id] as any;
         if (!dr) return;

         if (dr.mode === 'spawnDelay') {
             // Let the ship cruise dumbly for 3 seconds to look organic
             dr.speed += (speed - dr.speed) * 0.1;
             dr.turnRate += (0 - dr.turnRate) * 0.1; // Coast straight
             if (Date.now() - (dr.spawnTime || 0) > 3000) {
                 dr.mode = 'follow';
             }
         }
         
         if (dr.mode === 'follow') {
             // 1. Smooth the player's vector to get a stable pursuit pocket that doesn't violently flip 180 degrees!
             dr.pocketHeading = dr.pocketHeading !== undefined ? dr.pocketHeading : heading;
             let hDiffPocket = heading - dr.pocketHeading;
             hDiffPocket = Math.atan2(Math.sin(hDiffPocket), Math.cos(hDiffPocket));
             dr.pocketHeading += hDiffPocket * 0.05; // The pocket swings smoothly behind the player
             // 2. Position them gently nudged off the left and right wings (Tactical Formation Flank)
             const { x: targetSpreadX, z: targetSpreadZ } = getFormationOffset(index, activeFormationRef.current);
             
             dr.activeSpreadX = dr.activeSpreadX !== undefined ? dr.activeSpreadX : targetSpreadX;
             dr.activeSpreadZ = dr.activeSpreadZ !== undefined ? dr.activeSpreadZ : targetSpreadZ;
             
             // Smoothly transition the formation targets themselves over time so they don't violently re-route
             dr.activeSpreadX += (targetSpreadX - dr.activeSpreadX) * 0.003; // Circles transition elegantly and slowly into place
             dr.activeSpreadZ += (targetSpreadZ - dr.activeSpreadZ) * 0.003;
             
             // Project the rigid mathematical position for the UI circles
             const pureDxOffset = Math.cos(dr.pocketHeading) * dr.activeSpreadX + Math.sin(dr.pocketHeading) * dr.activeSpreadZ;
             const pureDzOffset = Math.sin(dr.pocketHeading) * dr.activeSpreadX - Math.cos(dr.pocketHeading) * dr.activeSpreadZ;
             const pureTargetX = shipX + pureDxOffset;
             const pureTargetZ = shipZ + pureDzOffset;
             
             // Inject "Alive Pilot" Organic Throttle Drift
             // Real pilots can't hold their speed perfectly. They occasionally drift forward and feather back.
             const timeSec = Date.now() * 0.001;
             const pilotZDrift = Math.sin(timeSec * 0.4 + index * 7) * 1.5; // Drifts forward and rearward smoothly
             const pilotXDrift = Math.cos(timeSec * 0.3 + index * 4) * 1.5; // Sloppy lateral holding
             
             const formationSpreadX = dr.activeSpreadX + pilotXDrift;
             const formationSpreadZ = dr.activeSpreadZ + pilotZDrift;
             
             // Project the wobbly pilot offsets for the physical ship pursuit
             const dxOffset = Math.cos(dr.pocketHeading) * formationSpreadX + Math.sin(dr.pocketHeading) * formationSpreadZ;
             const dzOffset = Math.sin(dr.pocketHeading) * formationSpreadX - Math.cos(dr.pocketHeading) * formationSpreadZ;
             
             const targetX = shipX + dxOffset;
             const targetZ = shipZ + dzOffset;
             
             if (!dr.targetRing) {
                 const ringGeo = new THREE.RingGeometry(14, 15, 32);
                 const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
                 dr.targetRing = new THREE.Mesh(ringGeo, ringMat);
                 dr.targetRing.rotation.x = -Math.PI / 2; // Lie flat
                 scene.add(dr.targetRing);
             }
             if (dr.targetRing) {
                 dr.targetRing.position.set(pureTargetX, 0, pureTargetZ);
                 dr.targetRing.visible = (!showMapRef.current && (paramsRef.current as any).showTargetRings);
             }
             
             // 3. True Physical Chase Mathematics (REACTIVE ONLY, NO SYNCHRONIZATION)
             const dx = targetX - dr.x;
             const dz = targetZ - dr.z;
             const distToTarget = Math.sqrt(dx*dx + dz*dz) || 0.001;
             
             // Pure coordinate line-of-sight tracking. We DO NOT blend with the player's heading!
             // This guarantees the AI can only react purely to spatial drift, inducing a gorgeous natural delay!
             const interceptHeading = Math.atan2(dx, -dz);
             
             // Blend steering to avoid violently shaking the steering wheel when exactly on top of the target coordinate!
             let stableIntercept = interceptHeading;
             if (distToTarget < 30.0) {
                 const blend = 1.0 - (distToTarget / 30.0);
                 const hDiff = dr.pocketHeading - interceptHeading;
                 const shortDiff = Math.atan2(Math.sin(hDiff), Math.cos(hDiff));
                 stableIntercept += shortDiff * blend;
             }
             
             let angleDiff = stableIntercept - dr.heading;
             angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
             
             // Extract autonomous parameterized trajectory values!
             const sp = allShipParamsRef.current[id] || globalShipbankStateRef.current;

             // Responsive Wingman Speed Mapping
             const W_wingman = typeof window !== 'undefined' ? window.innerWidth : 1280;
             let responsiveWingmanSpeed = W_wingman / 120;
             if (sp.maxSpeed >= 0.2) responsiveWingmanSpeed = W_wingman / 60;
             else if (sp.maxSpeed >= 0.12) responsiveWingmanSpeed = W_wingman / 90;
             const MAX_WINGMAN_SPEED = responsiveWingmanSpeed / 60;

             // Drones utilize real physical turning radii
             // The pilot eases the stick exactly proportional to the angle error to prevent over-steering
             let desiredTurnDelta = angleDiff * 0.05;
             
             // The ship is physically constrained by its aerodynamics
             // Give AI wingmen a physical boost to turn speed so they can resolve tight pocket pursuit loops without overshooting
             const aiTurnSpeed = (sp.turnSpeed || 0.014) * 3.0;
             desiredTurnDelta = Math.max(-aiTurnSpeed, Math.min(aiTurnSpeed, desiredTurnDelta));
             
             dr.heading += desiredTurnDelta;
             dr.turnRate = desiredTurnDelta / aiTurnSpeed; // Mapped perfectly from -1 to 1 for visual banking!
             
             // 4. Pure Natural Thrust Track
             // Find out if the pocket is in front of or behind the drone's nose
             const fwdX = Math.sin(dr.heading);
             const fwdZ = -Math.cos(dr.heading);
             const pocketDot = (dx * fwdX) + (dz * fwdZ);
             
             // Smooth Proportional Catch-Up
             // Provide a gentle push forward or backward based on how far the pocket is in front of the nose
             // "speed up a little bit enough to get into position"
             let desiredSpeed = speed + (pocketDot * 0.015);
             
             // Cap the maximum deviation so they never rocket forward or reverse
             // They can fly up to 1.5x speed when far away (spawning), tapering to a majestic 1.05x near the pocket
             const catchUpMultiplier = distToTarget > 100 ? 1.5 : 1.05 + ((distToTarget / 100) * 0.45);
             if (distToTarget > 50.0) anyCatchingUp = true;
             const dynamicMaxSpeed = Math.max(MAX_WINGMAN_SPEED, speed * catchUpMultiplier);
             // If player stops, desiredSpeed shouldn't go negative unless they drastically overshot.
             desiredSpeed = Math.min(dynamicMaxSpeed, Math.max(0, desiredSpeed));

             // Simulate lifting off the throttle to take a sharp corner
             const headingAccuracy = Math.cos(angleDiff); 
             if (headingAccuracy < 0.5) {
                 const throttleCut = Math.max(0.1, headingAccuracy + 0.5); 
                 desiredSpeed *= throttleCut;
             }
             
             // The pilot mathematically eases onto the throttle instead of violently slamming it!
             // They calculate exactly how much speed they need to add/remove this frame.
             const thrustNeed = desiredSpeed - dr.speed;
             
             // Easing factor: The pilot rolls onto the throttle proportionally
             let requestedAccel = thrustNeed * 0.05;
             
             // But the physical engine has absolute hard limits!
             const maxAccel = sp.acceleration;
             const maxBrake = sp.acceleration * (sp.retroBrake ?? 1.0);
             
             requestedAccel = Math.max(-maxBrake, Math.min(maxAccel, requestedAccel));
             dr.speed += requestedAccel;
             
             // 5. Anti-Collision Separation Force (Gentle Nudge)
             // Iterate through all other valid wingmen (and the player) to ensure they don't clip into each other
             let sepX = 0;
             let sepZ = 0;
             const MIN_SAFE_DISTANCE = 4.5; // Slightly larger than typical grid spacing to create organic spring tension
             
             // Check against the player lead ship (give player a wider berth)
             const dxPlayer = dr.x - shipX;
             const dzPlayer = dr.z - shipZ;
             const distPlayer = Math.sqrt(dxPlayer*dxPlayer + dzPlayer*dzPlayer);
             if (distPlayer > 0.001 && distPlayer < MIN_SAFE_DISTANCE * 1.5) {
                 const pushFactor = (MIN_SAFE_DISTANCE * 1.5 - distPlayer) / (MIN_SAFE_DISTANCE * 1.5);
                 sepX += (dxPlayer / distPlayer) * pushFactor * 0.08;
                 sepZ += (dzPlayer / distPlayer) * pushFactor * 0.08;
             }
             
             // Check against other wingmen
             validWingmen.forEach(otherId => {
                 if (id === otherId) return;
                 const otherDr = drones[otherId];
                 if (!otherDr) return;
                 const dxOther = dr.x - otherDr.x;
                 const dzOther = dr.z - otherDr.z;
                 const distOther = Math.sqrt(dxOther*dxOther + dzOther*dzOther);
                 
                 if (distOther > 0.001 && distOther < MIN_SAFE_DISTANCE) {
                     // Stronger push as they get closer (gentle organic avoidance)
                     const pushFactor = (MIN_SAFE_DISTANCE - distOther) / MIN_SAFE_DISTANCE;
                     sepX += (dxOther / distOther) * pushFactor * 0.12; // Nudge strength
                     sepZ += (dzOther / distOther) * pushFactor * 0.12;
                 }
             });
             
             dr.x += sepX;
             dr.z += sepZ;
             
             // Commit trajectory natively
             dr.x += Math.sin(dr.heading) * dr.speed;
             dr.z -= Math.cos(dr.heading) * dr.speed;
             
         } else {
            // Autonomous Sweeping Flight AI (Standard Random)
            const time = Date.now() * 0.001;
            const weave = dr.turnRate + Math.sin(time * 0.1 + dr.turnOffset) * 0.0015;
            dr.heading += weave;

            dr.x += Math.sin(dr.heading) * dr.speed;
            dr.z -= Math.cos(dr.heading) * dr.speed;
            
            // Keep drones within a relative tracking radius to avoid flying to outer space
            // IMPORTANT: Never teleport the drone we are currently tracking, otherwise the camera snaps wildly!
            const RADIUS = Math.max(600, dynamicConstraintRadius);
            if (id !== focusedShipIdRef.current) {
                if (dr.x > shipX + RADIUS) dr.x -= RADIUS * 2;
                if (dr.x < shipX - RADIUS) dr.x += RADIUS * 2;
                if (dr.z > shipZ + RADIUS) dr.z -= RADIUS * 2;
                if (dr.z < shipZ - RADIUS) dr.z += RADIUS * 2;
            }
         }
         dr.group.position.set(dr.x, 0, dr.z);
         dr.group.rotation.y = -dr.heading;
         dr.group.visible = !showMapRef.current;

         // Apply drone-specific banking and native pitch orientation
         const dPM = dr.group.getObjectByName('planeModel') as THREE.Mesh;
         if (dPM) {
             const sp = allShipParamsRef.current[id] || globalShipbankStateRef.current;
             const dMat = dPM.material as THREE.MeshPhysicalMaterial;
             const baseRot = dPM.userData.baseRotation || 0;
             
             const uniformPitchRot = -Math.PI / 2 + sp.modelPitch * Math.PI / 180;
             const MAX_BANK  = sp.maxBankDeg * Math.PI / 180;
             let simulatedBank = 0;
             
             // 5. Aesthetic Visual Banking 
             // (AI tries to calculate an implied bank based on recent heading delta cache)
             if (dr.mode !== 'docked') {
                 const framesTracked = 5;
                 if (!dr.headingHistory) dr.headingHistory = [];
                 dr.headingHistory.push(dr.heading);
                 if (dr.headingHistory.length > framesTracked) dr.headingHistory.shift();
                 if (dr.headingHistory.length > 1) {
                     let totalDelta = 0;
                     for(let h = 1; h < dr.headingHistory.length; h++) {
                         const th = dr.headingHistory[h];
                         const ph = dr.headingHistory[h-1];
                         let dH = th - ph;
                         if (dH > Math.PI) dH -= 2*Math.PI;
                         if (dH < -Math.PI) dH += 2*Math.PI;
                         totalDelta += dH;
                     }
                     const avgTurnSpeed = totalDelta / (dr.headingHistory.length - 1);
                     
                     const bankFactor = avgTurnSpeed / 0.15; // aggressive wing dip 
                     simulatedBank = Math.max(-1, Math.min(1, bankFactor)) * MAX_BANK;
                 }
             } else {
                 simulatedBank = bankAngle; // copy the player precisely if totally anchored
             }

             // Group container takes structural physics
             dr.group.quaternion.identity();
             dr.group.rotateY(-dr.heading); 
             dr.group.rotateX(uniformPitchRot + Math.PI / 2);
             dr.group.rotateZ(-simulatedBank);
             
             const shipChassis = dr.group.getObjectByName('shipChassis') as THREE.Group;
             if (shipChassis) {
                 shipChassis.quaternion.identity();
                 shipChassis.rotateX(-Math.PI / 2); // Chassis lays flat natively on structural boundaries (+Z Up, +X Right, +Y Forward)
                 shipChassis.rotateZ(-baseRot * Math.PI / 180 - (sp.texRotation * Math.PI / 180));
                 
                 dPM.quaternion.identity(); // Texture strictly bound internally
                 
                 const dShipAspectX = dPM.userData.aspectX || 1.0;
                 const dShipBaseScale = dPM.userData.shipScale || 1.0;
                 const droneSize = Math.max(0.01, sp.planeSize) * dShipBaseScale;
                 
                 const droneVelocityRatio = Math.min(1.0, dr.speed / Math.max(0.0001, sp.maxSpeed));
                 const baseSquash = sp.squashLength ?? 1.1; 
                 const dynamicSquash = 1.0 + (baseSquash - 1.0) * droneVelocityRatio;
                 const currentScaleX = droneSize * dShipAspectX * dynamicSquash;
                 
                 dPM.scale.set(currentScaleX, droneSize, droneSize);
                 
                 const dMat = dPM.material as THREE.MeshPhysicalMaterial;
                 
                 const dCt = dPM.userData.currentTextures;
                 if (dCt) {
                     const applyDroneTexSettings = (t: THREE.Texture | null) => {
                         if (!t) return;
                         if (t.offset && typeof t.offset.set === 'function') t.offset.set(sp.texOffsetX, sp.texOffsetY);
                         if (t.repeat && typeof t.repeat.set === 'function') t.repeat.set(sp.texScaleX, sp.texScaleY);
                     };
                     applyDroneTexSettings(dCt.map);
                     applyDroneTexSettings(dCt.alphaMap);
                     applyDroneTexSettings(dCt.bumpMap);
                     applyDroneTexSettings(dCt.lightMap);

                     let dNeedsUpdate = false;
                     if (dMat.map !== (sp.showColorMap ? dCt.map : null)) { dMat.map = sp.showColorMap ? dCt.map : null; dNeedsUpdate = true; }
                     if (dMat.alphaMap !== (sp.showAlphaMap ? dCt.alphaMap : null)) { dMat.alphaMap = sp.showAlphaMap ? dCt.alphaMap : null; dNeedsUpdate = true; }
                     if (dMat.bumpMap !== (sp.showBumpMap ? dCt.bumpMap : null)) { dMat.bumpMap = sp.showBumpMap ? dCt.bumpMap : null; dNeedsUpdate = true; }
                     if (dNeedsUpdate) dMat.needsUpdate = true;
                     
                     dMat.bumpScale = sp.bumpScale;
                     dMat.alphaTest = sp.alphaTest;
                 }
                 
                 const underbelly = shipChassis.getObjectByName('underbellyPlane') as THREE.Mesh;
                 if (underbelly) {
                     underbelly.quaternion.identity();
                     const parallaxVal = sp.underbellyOffset ?? 2.0;
                     underbelly.position.set(0, 0, -parallaxVal * droneSize * 0.3); 
                     underbelly.scale.set(currentScaleX, droneSize, droneSize);
                     
                     const um = underbelly.material as THREE.MeshPhysicalMaterial;
                     if (um.map !== dMat.map) { um.map = dMat.map; um.needsUpdate = true; }
                     if (um.alphaMap !== dMat.alphaMap) { um.alphaMap = dMat.alphaMap; um.needsUpdate = true; }
                     um.alphaTest = sp.alphaTest;
                 }
                 

             }
             
             // Rig native static meshes exclusively for Wingman engine exhausts!
             let wingmanEngineGroup = (shipChassis || dr.group).getObjectByName('wingmanEngineGroup') as THREE.Group;
             if (!wingmanEngineGroup) {
                 wingmanEngineGroup = new THREE.Group();
                 wingmanEngineGroup.name = 'wingmanEngineGroup';
                 (shipChassis || dr.group).add(wingmanEngineGroup);
             }
             wingmanEngineGroup.rotation.set(0, 0, 0); // Strictly aligned with Chassis geometry!
             
             if (wingmanEngineGroup && planeModel) {
                 const cms = shipsRef.current.find(s => s.id === id) || shipsRef.current[0] || {};
                 const shipScale = dPM.userData.shipScale || 1.0;
                 const size = Math.max(0.01, sp.planeSize) * shipScale;
                 const aspectX = dPM.userData.aspectX || 1.0;
                 // Note: we just use Math.max to prevent visual division-by-zero artifacts
                 const currentScaleWidth = size * aspectX * Math.max(0.2, sp.squashLength);

                 const cacheData = shipGeometryCacheRef.current[id];
                 const rawExhausts = (cacheData && cacheData.exhaustPoints && cacheData.exhaustPoints.length > 0) ? cacheData.exhaustPoints : (cms.engines || []);
                 const isFallback = (!cacheData || !cacheData.exhaustPoints || cacheData.exhaustPoints.length === 0) && (!cms.engines || cms.engines.length === 0);
                 const exhaustCount = isFallback ? 2 : rawExhausts.length;
                 
                 // Ensure there is always a baseline glow if they have forward momentum!
                 let visualBoostLevel = Math.max(0, Math.min(1.0, dr.speed / sp.maxSpeed));
                 if (dr.speed > sp.maxSpeed * 1.05) {
                     visualBoostLevel = 1.2; // Blast intense afterburner flames to catch up
                 } else if (visualBoostLevel > 0.05 && visualBoostLevel < 0.4) {
                     visualBoostLevel = 0.4; // Enforce a bright baseline pilot cruise flame
                 }
                 
                 dPM.userData.throttle = (dPM.userData.throttle || 0.0) * 0.8 + (visualBoostLevel * 0.2);
                 
                 // Instantiate bullet-proof native sprites instead of planes to absolutely guarantee rendering!
                 // Instantiate native primitive Shader plane elements (not InstancedMesh, to protect WebGL ID bounds)
                 while (wingmanEngineGroup.children.length < exhaustCount) {
                     if (!(scene as any).userData.WINGMAN_FLAME_GEO) {
                         (scene as any).userData.WINGMAN_FLAME_GEO = new THREE.PlaneGeometry(16, 6);
                     }
                     if (!(scene as any).userData.WINGMAN_FLAME_MAT) {
                         (scene as any).userData.WINGMAN_FLAME_MAT = new THREE.ShaderMaterial({
                             transparent: true,
                             depthWrite: false,
                             blending: THREE.AdditiveBlending,
                             uniforms: {
                                 uThrottle: { value: 0.1 }
                             },
                             vertexShader: `
                                 varying vec2 vUv;
                                 void main() {
                                   vUv = uv;
                                   vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
                                   gl_Position = projectionMatrix * mvPosition;
                                 }
                             `,
                             fragmentShader: `
                                 uniform float uThrottle;
                                 varying vec2 vUv;
                                 void main() {
                                   vec2 p = vUv * 2.0 - 1.0; 
                                   float arcY = p.y - p.x * p.x * 0.4;
                                   
                                   float d = abs(arcY);
                                   float core = smoothstep(0.4, 0.0, d);
                                   float edge = smoothstep(0.7, 0.5, d) - core;
                                   
                                   float xFade = smoothstep(1.0, 0.8, abs(p.x));
                                   
                                   vec3 idleColor = vec3(0.05, 0.2, 1.0);
                                   vec3 activeColor = vec3(0.0, 1.0, 1.0);
                                   vec3 baseColor = mix(idleColor, activeColor, uThrottle);
                                   vec3 finalColor = edge * baseColor + core * mix(baseColor, vec3(1.0), uThrottle);
                                   
                                   float alpha = (edge + core) * xFade;
                                   gl_FragColor = vec4(finalColor * alpha, alpha * (0.3 + (uThrottle * 0.7)));
                                 }
                             `
                         });
                     }
                     const plMat = (scene as any).userData.WINGMAN_FLAME_MAT.clone();
                     plMat.uniforms = THREE.UniformsUtils.clone((scene as any).userData.WINGMAN_FLAME_MAT.uniforms);
                     const flameMesh = new THREE.Mesh((scene as any).userData.WINGMAN_FLAME_GEO, plMat);
                     wingmanEngineGroup.add(flameMesh);
                 }
                 
                 for (let i = 0; i < wingmanEngineGroup.children.length; i++) {
                     wingmanEngineGroup.children[i].visible = false;
                 }
                 
                 for (let i = 0; i < exhaustCount; i++) {
                     let ex = 0;
                     let ey = 0;
                     if (isFallback) {
                         ex = i === 0 ? currentScaleWidth * 25.0 : -currentScaleWidth * 25.0;
                         ey = -size * 50.0;
                     } else {
                         const engData = rawExhausts[i];
                         if (engData.originalX !== undefined || engData.cx !== undefined) {
                             ex = engData.cx * currentScaleWidth * 100.0;
                             ey = -engData.cy * size * 100.0;
                         } else {
                             ex = engData.x;
                             ey = engData.y;
                         }
                     }
                     const flameMesh = wingmanEngineGroup.children[i] as THREE.Mesh;
                     
                     // Synchronize positional layout natively locally bounded inside wingmanEngineGroup
                     flameMesh.quaternion.identity();
                     flameMesh.position.set(ex, ey, -0.5); 
                     
                     // PlaneGeometry naturally looks +Y, spin to face fire backward -Y
                     flameMesh.rotateZ(Math.PI);
                     
                     // Restore unwarped visual baseline glow volume
                     flameMesh.scale.set(size, size, size); 
                     
                     // Connect visual thrust to the shader natively
                     (flameMesh.material as THREE.ShaderMaterial).uniforms.uThrottle.value = dPM.userData.throttle;
                     flameMesh.visible = true;
                     
                 } // closes for loop
             } // closes if (wingmanEngineGroup && planeModel)
         } // closes if (dPM)
             // Extract physical dictionary again exclusively for trail matrices outside the mesh if-block constraint above
             const spTra = allShipParamsRef.current[id] || globalShipbankStateRef.current;

             // 5. Wingman Engine Trails!
             if (dr.optTrail) {
                 const fx = globalSplashConfigRef.current || {};
                 const wingmanIsMoving = Math.abs(dr.speed) > 0.1;
                 const wd_nx = Math.sin(dr.heading);
                 const wd_nz = -Math.cos(dr.heading);
                 const wrx = wingmanIsMoving ? wd_nz * (spTra.trailWidth || 2.0) : 0;
                 const wrz = wingmanIsMoving ? -wd_nx * (spTra.trailWidth || 2.0) : 0;
                 const wSpreadY = wingmanIsMoving ? (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 0;
                 
                 const mountY = spTra.trailMountY ?? -2.0;
                 
                 const currentLeftX = dr.x + wd_nx * mountY - wrx;
                 const currentLeftY = (spTra.modelY || 0) - 0.5;
                 const currentLeftZ = dr.z + wd_nz * mountY - wrz;
                 
                 const currentRightX = dr.x + wd_nx * mountY + wrx;
                 const currentRightY = currentLeftY;
                 const currentRightZ = dr.z + wd_nz * mountY + wrz;
                 
                 if (!showMapRef.current) {
                     if (trailSystemOverride) {
                         trailSystemOverride.update(
                             dr.optTrail, 
                             { x: currentLeftX, y: currentLeftY, z: currentLeftZ },
                             { x: currentRightX, y: currentRightY, z: currentRightZ },
                             { x: 99999.0, y: 99999.0, z: 99999.0 },
                             { x: 99999.0, y: 99999.0, z: 99999.0 },
                             wingmanIsMoving, p, nowTime, fx
                         );
                     } else {
                         let lastLeftX = 99999.0, lastLeftY = 99999.0, lastLeftZ = 99999.0;
                         let lastRightX = 99999.0, lastRightY = 99999.0, lastRightZ = 99999.0;
                         
                         // FIX NaN Freeze: strictly bounds check head to safely prevent loop poisoning during ship teleport
                         if (dr.optTrail.head >= 2 && !Number.isNaN(dr.optTrail.head)) {
                             const leftIdx = (dr.optTrail.head - 2 + dr.optTrail.maxSize) % dr.optTrail.maxSize;
                             const rightIdx = (dr.optTrail.head - 1 + dr.optTrail.maxSize) % dr.optTrail.maxSize;
                             lastLeftX = dr.optTrail.positions[leftIdx * 3] ?? 99999.0;
                             lastLeftY = dr.optTrail.positions[leftIdx * 3 + 1] ?? 99999.0;
                             lastLeftZ = dr.optTrail.positions[leftIdx * 3 + 2] ?? 99999.0;
                             
                             lastRightX = dr.optTrail.positions[rightIdx * 3] ?? 99999.0;
                             lastRightY = dr.optTrail.positions[rightIdx * 3 + 1] ?? 99999.0;
                             lastRightZ = dr.optTrail.positions[rightIdx * 3 + 2] ?? 99999.0;
                         }
                         
                         let steps = 1;
                         // Relaxed trail: removed artificial stiff interpolation
                         
                         for (let step = 1; step <= steps; step++) {
                             const t = step / steps;
                             const lx = wingmanIsMoving ? lastLeftX + (currentLeftX - lastLeftX) * t : 99999.0;
                             const ly = wingmanIsMoving ? lastLeftY + (currentLeftY - lastLeftY) * t + wSpreadY : 99999.0;
                             const lz = wingmanIsMoving ? lastLeftZ + (currentLeftZ - lastLeftZ) * t : 99999.0;
                             
                             const rx_val = wingmanIsMoving ? lastRightX + (currentRightX - lastRightX) * t : 99999.0;
                             const ry_val = wingmanIsMoving ? lastRightY + (currentRightY - lastRightY) * t + wSpreadY : 99999.0;
                             const rz_val = wingmanIsMoving ? lastRightZ + (currentRightZ - lastRightZ) * t : 99999.0;
                             
                             const wi1 = dr.optTrail.head % dr.optTrail.maxSize;
                             dr.optTrail.positions[wi1 * 3]     = wingmanIsMoving ? lx + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                             dr.optTrail.positions[wi1 * 3 + 1] = wingmanIsMoving ? ly : 99999.0;
                             dr.optTrail.positions[wi1 * 3 + 2] = wingmanIsMoving ? lz + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                             dr.optTrail.birthTimes[wi1] = nowTime / 1000.0;
                             dr.optTrail.head++;
                             
                             const wi2 = dr.optTrail.head % dr.optTrail.maxSize;
                             dr.optTrail.positions[wi2 * 3]     = wingmanIsMoving ? rx_val + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                             dr.optTrail.positions[wi2 * 3 + 1] = wingmanIsMoving ? ry_val : 99999.0;
                             dr.optTrail.positions[wi2 * 3 + 2] = wingmanIsMoving ? rz_val + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                             dr.optTrail.birthTimes[wi2] = nowTime / 1000.0;
                             dr.optTrail.head++;
                         }
                     }
                 }
                 
                 dr.optTrail.geometry.attributes.position.needsUpdate = true;
                 if (dr.optTrail.geometry.attributes.aBirthTime) {
                     dr.optTrail.geometry.attributes.aBirthTime.needsUpdate = true;
                 }
                 
                 dr.optTrail.material.uniforms.uTime.value = nowTime / 1000.0;
                 if (p.trailColor) dr.optTrail.material.uniforms.uTrailColor.value.set(p.trailColor);
                 dr.optTrail.material.uniforms.uTrailLife.value = p.trailLife ?? 2.0;
                 dr.optTrail.material.uniforms.uTrailSize.value = p.trailSize ?? 10.0;
                 dr.optTrail.material.uniforms.uTrailOpacity.value = p.trailOpacity ?? 0.8;
                 dr.optTrail.material.uniforms.uCameraZoom.value = currentCameraZoom;
                 
                 dr.optTrail.mesh.visible = !showMapRef.current;
             }
      });

      isFormationCatchingUpRef.current = anyCatchingUp;

      const activeFleet: { isPlayer: boolean, group: THREE.Object3D, id: string, speed: number, isAccelerating?: boolean }[] = [
          { isPlayer: true, group: shipGroup, id: playerShipIdRef.current, speed: Math.abs(speed), isAccelerating: fwd || back }
      ];
      Object.keys(drones).forEach(id => {
          activeFleet.push({ isPlayer: false, group: drones[id].group, id: id, speed: drones[id].speed });
      });
      
      // --- PROGRESSION ODOMETER ---
      const playerShip = activeFleet.find(s => s.isPlayer);
      if (playerShip) {
          // dr.speed = pixels per frame. Scale is 768 KM per pixel.
          // Distance in AU (1 Screen Width = 1 AU)
          const hyperdrive = screensaverTitleConfig?.hyperdriveMultiplier || 1.0;
          // ARTIFICIAL MULTIPLIER FOR TESTING: Unlocks ships very rapidly
          const TESTING_MULTIPLIER = 500.0; 
          sessionDistanceRef.current += (Math.abs(playerShip.speed) / (typeof window !== 'undefined' ? window.innerWidth : 1280)) * hyperdrive * TESTING_MULTIPLIER;
          
          // AUTO-SPAWN newly unlocked ships so Hangar UI buttons activate correctly
          if (progressionModeEnabledRef.current && progressionShipOrderRef.current.length > 0) {
              const order = progressionShipOrderRef.current;
              shipsRef.current.forEach(ship => {
                  const shipIdx = order.indexOf(ship.id);
                  if (shipIdx > 0) {
                      const unlockAu = 267 * Math.pow(1.618, shipIdx);
                      if (sessionDistanceRef.current >= unlockAu) {
                          if (!autoSpawnedShipsRef.current.includes(ship.id)) {
                              autoSpawnedShipsRef.current.push(ship.id);
                              if (!spawnedShipIdsRef.current.includes(ship.id)) {
                                  setSpawnedShipIds(prev => [...prev, ship.id]);
                              }
                          }
                      }
                  } else if (shipIdx === 0) {
                      if (!autoSpawnedShipsRef.current.includes(ship.id)) autoSpawnedShipsRef.current.push(ship.id);
                  }
              });
          }
          
          progressionSaveTimerRef.current++;
          // Update UI every 60 frames (~1 sec)
          if (progressionSaveTimerRef.current % 60 === 0) {
              window.dispatchEvent(new CustomEvent('arn_progression_update', {
                  detail: {
                      distance: sessionDistanceRef.current,
                      order: progressionShipOrderRef.current
                  }
              }));
          }
          // Save to permanent config every ~30 seconds to prevent data loss on closing screensaver
          if (progressionSaveTimerRef.current > 1800) {
              progressionSaveTimerRef.current = 0;
              // Silent background fetch/save to avoid freezing main thread
              fetch('/api/game-assets/config/')
                  .then(r => r.json())
                  .then(d => {
                      const conf = d[configNamespace || 'screensaver_config'] || {};
                      conf.totalKMs = sessionDistanceRef.current;
                      fetch('/api/game-assets/config/', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ [configNamespace || 'screensaver_config']: conf })
                      }).catch(() => {}); // ignore network errors for silent saves
                  }).catch(() => {});
          }
      }

      const globalAL = (window as any).ARN_GLOBAL_AUDIO_LISTENER;
      activeFleet.forEach((dr) => {
          const sp = allShipParamsRef.current[dr.id] || globalShipbankStateRef.current;
          const blinkRate = Math.max(0.1, sp.navLightsBlinkRate || 1.5);
          
          // Seed a unique time offset using the ship's ID so they don't all blink in unison
          const uniqueOffset = dr.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 0.123;
          const blinkPhase = ((Date.now() * 0.001) + uniqueOffset) % blinkRate;
          const isOn = blinkPhase < 0.1 || (blinkPhase > 0.25 && blinkPhase < 0.35);
          
          const chassis = (dr.group as THREE.Group).getObjectByName('shipChassis');

          if (globalAL && globalAL.context.state === 'running') {
              const shipDef = shipsRef.current.find(s => s.id === dr.id) || shipsRef.current[0];
              let sID = shipDef ? ((shipDef as any).soundId || 'ship_02.wav') : 'ship_02.wav';
              if (sID === 'default') sID = 'ship_02.wav';
              if (!shipAudioRefs.current[dr.id]) {
                  const sSound = new THREE.Audio(globalAL);
                  if (audioBufferCacheRef.current[sID]) {
                      sSound.setBuffer(audioBufferCacheRef.current[sID]);
                      sSound.setLoop(true);
                      if (sSound.gain) sSound.gain.gain.value = 0;
                  } else {
                      const localAudioLoader = new THREE.AudioLoader();
                      localAudioLoader.load(`/game_assets/sounds/used/${sID}`, (buffer) => {
                          audioBufferCacheRef.current[sID] = buffer;
                          sSound.setBuffer(buffer);
                          sSound.setLoop(true);
                          if (sSound.gain) sSound.gain.gain.value = 0;
                      });
                  }
                  shipAudioRefs.current[dr.id] = sSound;
              }
              const sSound = shipAudioRefs.current[dr.id];
              if (sSound && sSound.buffer) {
                  const isMovingStatus = dr.speed > 0.05;
                  let userVolMultiplier = 1.0;
                  const currentAudioConfig = audioConfigRef.current;
                  if (currentAudioConfig && currentAudioConfig.tracks) {
                      userVolMultiplier = (currentAudioConfig.tracks[sID] ?? 0.5) * (currentAudioConfig.masterVolume ?? 1.0) * 2.0;
                  }
                  
                  let throttleRatio;
                  if (dr.isPlayer) {
                      throttleRatio = dr.isAccelerating ? 1.0 : 0.0;
                  } else {
                      throttleRatio = Math.max(0, Math.min(1.0, dr.speed / (MAX_SPEED || 0.1)));
                  }
                  
                  const baseVol = throttleRatio * (dr.isPlayer ? 0.35 : 0.15);
                  
                  // Safeguard: Prevent negative values but allow silencing
                  const safeUserMultiplier = Math.max(0.0, userVolMultiplier);
                  const targetVol = baseVol * safeUserMultiplier;
                  const currentVol = sSound.getVolume();
                  
                  if (targetVol > 0.005) {
                      if (!sSound.isPlaying) sSound.play();
                      if (Math.abs(currentVol - targetVol) > 0.005) {
                          sSound.setVolume(currentVol + (targetVol - currentVol) * 0.05);
                      }
                  } else {
                      if (currentVol > 0.01) {
                          // Rapid fade out
                          sSound.setVolume(currentVol + (0 - currentVol) * 0.15);
                      } else if (sSound.isPlaying) {
                          sSound.setVolume(0);
                          sSound.pause(); // Fully halt playback to stop ghosting and save CPU
                      }
                  }
              }
          }
      });

      activeFleet.forEach((dr) => {
          const isPlayer = dr.isPlayer;
          const tGroup = dr.group;
          const tPlane = tGroup.getObjectByName('planeModel') as THREE.Mesh;
          if (!tPlane) return;

          const iMesh = tPlane.userData.engineInstancedMesh as THREE.InstancedMesh;
          if (!iMesh) return;

          const shipId = isPlayer ? focusedShipIdRef.current : dr.id;
          const cms = shipsRef.current.find(s => s.id === shipId) || shipsRef.current[0] || {};
          
          let shipRot = (cms as any).rotation || 0;
          if (shipRot < 0) shipRot += Math.PI * 2;
          const rotRads = shipRot;
          const cosR = Math.cos(-rotRads);
          const sinR = Math.sin(-rotRads);

          const cacheData = shipGeometryCacheRef.current[shipId];
          const rawEngines = (cacheData && cacheData.engines && cacheData.engines.length > 0) ? cacheData.engines : (cms.engines || []);

          const spd = isPlayer ? Math.abs(speed) : Math.abs(dr.speed);
          const isFwd = isPlayer ? fwd : spd > 0.05;

          iMesh.userData.throttle = (iMesh.userData.throttle || 0.0) * 0.8 + (isFwd ? 0.2 : 0.0);
          iMesh.count = rawEngines.length;
          
          if (rawEngines.length > 0) {
              const throttleAttr = iMesh.geometry.getAttribute('aThrottle') as THREE.InstancedBufferAttribute;
              
              for (let i = 0; i < rawEngines.length; i++) {
                  const pt = rawEngines[i];
                  let ex = pt.x;
                  let ey = pt.y;
                  
                  if (pt.originalX !== undefined || pt.cx !== undefined) {
                      const rx = pt.cx * cosR - pt.cy * sinR;
                      const ry = pt.cx * sinR + pt.cy * cosR;
                      ex = rx * 100.0;
                      ey = -ry * 100.0;
                  }
                  
                  MathCache.mat1.makeTranslation(ex, ey + 2.0, 1.0); 
                  iMesh.setMatrixAt(i, MathCache.mat1);
                  if (throttleAttr) throttleAttr.setX(i, iMesh.userData.throttle);
                  
                  const rMesh = tPlane.userData.reactorInstancedMesh as THREE.InstancedMesh;
                  if (rMesh) {
                      MathCache.mat1.makeTranslation(ex, ey, 1.0); 
                      rMesh.setMatrixAt(i, MathCache.mat1);
                  }
              }
              iMesh.instanceMatrix.needsUpdate = true;
              if (throttleAttr) throttleAttr.needsUpdate = true;
              
              const rMesh = tPlane.userData.reactorInstancedMesh as THREE.InstancedMesh;
              if (rMesh) {
                  rMesh.count = rawEngines.length;
                  rMesh.instanceMatrix.needsUpdate = true;
                  // Pulse the glow naturally with throttle
                  (rMesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + iMesh.userData.throttle * 0.6;
              }
          }
      });
      if (planeModel) {
          const leadSp = allShipParamsRef.current[playerShipIdRef.current] || globalShipbankStateRef.current;
          const shipAspectX = planeModel.scale.x / planeModel.scale.z;
          const shipBaseScale = planeModel.scale.z;
          const baseSize = Math.max(0.01, leadSp.planeSize) * shipBaseScale;
          const currentScaleWidth = baseSize * shipAspectX * currentSquash;

          const shipChassis = shipGroup.getObjectByName('shipChassis') as THREE.Group;
      }
      
      const extrudeLayers: THREE.Mesh[] = (shipGroup as any).userData.extrudeLayers || [];
      
      if (planeModel) {
        const leadSp = allShipParamsRef.current[playerShipIdRef.current] || globalShipbankStateRef.current;
        const shipScale = planeModel.userData.shipScale || 1.0;
        const size = Math.max(0.01, leadSp.planeSize) * shipScale;
        const aspectX = planeModel.userData.aspectX || 1.0;
        const currentScaleX = size * aspectX * currentSquash;
        const uniformBankRot = bankAngle;
        const uniformPitchRot = -Math.PI / 2 + leadSp.modelPitch * Math.PI / 180;
        
        const applyTexSettings = (tex: THREE.Texture | null) => {
            if (!tex) return;
            tex.rotation = 0;
            tex.offset.set(leadSp.texOffsetX, leadSp.texOffsetY);
            tex.repeat.set(leadSp.texScaleX, leadSp.texScaleY);
        };
        const ct = planeModel.userData.currentTextures;
        applyTexSettings(ct.map);
        applyTexSettings(ct.alphaMap);
        applyTexSettings(ct.bumpMap);
        applyTexSettings(ct.lightMap);

        const pm = planeModel.material as THREE.MeshPhysicalMaterial;
        let needsUpdate = false;
        if (pm.map !== (leadSp.showColorMap ? ct.map : null)) { pm.map = leadSp.showColorMap ? ct.map : null; needsUpdate = true; }
        if (pm.alphaMap !== (leadSp.showAlphaMap ? ct.alphaMap : null)) { pm.alphaMap = leadSp.showAlphaMap ? ct.alphaMap : null; needsUpdate = true; }
        if (pm.bumpMap !== (leadSp.showBumpMap ? ct.bumpMap : null)) { pm.bumpMap = leadSp.showBumpMap ? ct.bumpMap : null; needsUpdate = true; }
        if (ct.lightMap && pm.lightMap !== ct.lightMap) { pm.lightMap = ct.lightMap; pm.lightMapIntensity = 2.0; needsUpdate = true; }
        if (needsUpdate) pm.needsUpdate = true;

        pm.bumpScale = leadSp.bumpScale;
        pm.alphaTest = leadSp.alphaTest;

        // The ship sprite is mapped to planeModel, so it must be visible
        planeModel.visible = true;
        // Physical visual footprint isolated strictly to the model geometry
        planeModel.scale.set(currentScaleX, size, size);
        planeModel.quaternion.identity(); // Keep perfect 0,0,0 relative to the chassis
        
        const structuralRot = planeModel.userData.baseRotation || 0;
        
        // --- 1. SHIP STRUCTURE PHYSICS ---
        shipGroup.quaternion.identity();
        shipGroup.rotateY(-heading); // True physics Forward Heading
        shipGroup.rotateX(uniformPitchRot + Math.PI / 2); // Pitch correction against true upright
        shipGroup.rotateZ(-uniformBankRot); // Roll / Bank
        
        // --- 2. SHIP CHASSIS UNIFICATION ---
        const shipChassis = shipGroup.getObjectByName('shipChassis') as THREE.Group;
        shipChassis.quaternion.identity();
        // Laying flat inherently points the local +Y top towards the -Z Forward vector of physics
        shipChassis.rotateX(-Math.PI / 2); 
        // Spin around +Z native normal (Sky) with the pure CMS rotational standard 
        shipChassis.rotateZ(-structuralRot * Math.PI / 180 - (leadSp.texRotation * Math.PI / 180));
        
        // Debug arrows removed
        
        if (underbellyPlane) {
            underbellyPlane.visible = false;
            underbellyPlane.scale.set(currentScaleX, size, size);
            underbellyPlane.quaternion.identity(); // Keep perfectly flat to chassis
            const parallaxVal = leadSp.underbellyOffset ?? 2.0;
            underbellyPlane.position.set(0, 0, -parallaxVal * size * 0.3); // -Z pushes BELOW the chassis in local 2D space
            const uDbg = leadSp.underbellyDarkness ?? 0.2;
            
            const um = underbellyPlane.material as THREE.MeshPhysicalMaterial;
            um.color.setRGB(uDbg, uDbg, uDbg);
            let needsUmUpdate = false;
            if (um.map !== pm.map) { um.map = pm.map; needsUmUpdate = true; }
            if (um.alphaMap !== pm.alphaMap) { um.alphaMap = pm.alphaMap; needsUmUpdate = true; }
            if (needsUmUpdate) um.needsUpdate = true;
            um.alphaTest = leadSp.alphaTest;
        }
      }
      
      loopAmbColor.set(p.ambHex);
      loopSunColor.set(p.sunHex);
      
      let closestNode: THREE.Mesh | null = null;
      let minDist = Infinity;

      if (p.showNodes && (scene as any).userData.nodeGroup) {
        ((scene as any).userData.nodeGroup as THREE.Group).visible = true;
        const allNodes = ((scene as any).userData.nodeGroup as THREE.Group).children;
        for (let i = 0; i < allNodes.length; i++) {
           const node = allNodes[i];
           if (!node.userData.isNode) continue;
           const dx = node.position.x - shipX;
           const dz = node.position.z - shipZ;
           const dist = Math.sqrt(dx*dx + dz*dz);
           if (dist < minDist) {
             minDist = dist;
             closestNode = node as THREE.Mesh;
           }
        }
      } else if ((scene as any).userData.nodeGroup) {
        ((scene as any).userData.nodeGroup as THREE.Group).visible = false;
      }

      // If we are within 40 units of the node, we start interpolating completely seamlessly
      const INFLUENCE_RADIUS = 35.0;
      let lerpFactor = 0.0;
      if (closestNode && minDist < INFLUENCE_RADIUS) {
         // Smooth blend factor (1 close, 0 far)
         lerpFactor = 1.0 - (minDist / INFLUENCE_RADIUS);
         // Apply a smooth easing curve so the color shift/light sweeping is buttery
         lerpFactor = lerpFactor * lerpFactor * (3.0 - 2.0 * lerpFactor);
      }

      // Treat sliders as directional light vectors by binding them explicitly to the ship's world origin!
      let finalDirX = shipX + p.sunX;
      let finalDirY = p.sunY;
      let finalDirZ = shipZ + p.sunZ;

      if (closestNode && lerpFactor > 0.0) {
        loopNodeColor.set(closestNode.userData.colorHex);
        loopAmbColor.lerp(loopNodeColor, lerpFactor * 0.7); // Ambient shifts 70% to node
        loopSunColor.lerp(loopNodeColor, lerpFactor); // Sun becomes exactly node color
        
        // Direct vector from ship to the node natively anchors the shadow tracking!
        const dirVecX = closestNode.position.x - shipX;
        const dirVecZ = closestNode.position.z - shipZ;
        
        // Pushing the light out along this vector but keep it highly elevated to maintain normal maps
        const lightDist = 20.0; 
        const ang = Math.atan2(dirVecZ, dirVecX);
        const nodeSunX = shipX + Math.cos(ang) * lightDist;
        const nodeSunZ = shipZ + Math.sin(ang) * lightDist;
        const nodeSunY = 15.0; // Keep lower on horizon for aggressive long directional shadows

        finalDirX += (nodeSunX - finalDirX) * lerpFactor;
        finalDirY += (nodeSunY - finalDirY) * lerpFactor;
        finalDirZ += (nodeSunZ - finalDirZ) * lerpFactor;
      }
      
      // Live update lighting with new dynamic outputs
      if ((scene as any).userData.ambLight) {
        (scene as any).userData.ambLight.intensity = p.ambientLight;
        (scene as any).userData.ambLight.color.copy(loopAmbColor);
      }
      if ((scene as any).userData.dirLight) {
        const dl = (scene as any).userData.dirLight as THREE.DirectionalLight;
        dl.position.set(finalDirX, finalDirY, finalDirZ);
        dl.color.copy(loopSunColor);
        // Force directional light target to be the ship position so shadows accurately roll!
        dl.target.position.set(shipX, 0, shipZ);
        dl.target.updateMatrixWorld();
      }

      // Pre-calculate Lead player motion offset safely ONCE per frame
      const leadVelocityRatio = speed / p.maxSpeed;
      motionOffsetRef.current += p.motionSpeed;
      
      // Must also update standard edge/rim color uniforms because they're bound to params
      const pushFinalUniforms = (mesh: THREE.Mesh | null | undefined, sp: any, activeMotionOffset: number, throttleRatio: number, shipId: string) => {
          if (!mesh || !mesh.material) return;
          const material = mesh.material as THREE.MeshPhysicalMaterial;
          if ((material as any).userData?.shader) {
              const uniforms = (material as any).userData.shader.uniforms;
              
              loopSpRim.set(sp.rimHex);
              loopSpEdge.set(sp.edgeHex);
              if (closestNode && lerpFactor > 0.0) {
                  loopNodeColor.set(closestNode.userData.colorHex);
                  loopSpRim.lerp(loopNodeColor, lerpFactor);
                  loopSpEdge.lerp(loopNodeColor, lerpFactor * 0.8);
              }

              if (uniforms.uRimColor) {
                  if (uniforms.uRimColor.value.copy) uniforms.uRimColor.value.copy(loopSpRim);
                  else uniforms.uRimColor.value = loopSpRim.clone();
              }
              if (uniforms.uEdgeColor) {
                  if (uniforms.uEdgeColor.value.copy) uniforms.uEdgeColor.value.copy(loopSpEdge);
                  else uniforms.uEdgeColor.value = loopSpEdge.clone();
              }
              // Pushing the final computed swept direction overrides the raw sp.sunX so it rotates perfectly!
              if (uniforms.uSunPosition) {
                  if (uniforms.uSunPosition.value.set) uniforms.uSunPosition.value.set(finalDirX, finalDirY, finalDirZ);
                  else uniforms.uSunPosition.value = new THREE.Vector3(finalDirX, finalDirY, finalDirZ);
              }
              if (uniforms.uContrast) uniforms.uContrast.value = sp.texContrast;
              if (uniforms.uLuminance) uniforms.uLuminance.value = sp.texLuminance;
              
              if (uniforms.uEdgeThreshold) uniforms.uEdgeThreshold.value = sp.edgeThreshold;
              if (uniforms.uEdgeIntensity) uniforms.uEdgeIntensity.value = sp.edgeIntensity;
              if (uniforms.uSpecularIntensity) uniforms.uSpecularIntensity.value = sp.specularIntensity;
              if (uniforms.uSpecularShininess) uniforms.uSpecularShininess.value = sp.specularShininess;
              if (uniforms.uSpecularAnisotropy) uniforms.uSpecularAnisotropy.value = sp.specularAnisotropy;
              
              if (uniforms.uCenterSpecularIntensity) uniforms.uCenterSpecularIntensity.value = sp.centerSpecularIntensity;
              if (uniforms.uCenterSpecularWidth) uniforms.uCenterSpecularWidth.value = sp.centerSpecularWidth;
              if (uniforms.uCenterSpecularFalloff) uniforms.uCenterSpecularFalloff.value = sp.centerSpecularFalloff;
              if (uniforms.uCenterSpecularShininess) uniforms.uCenterSpecularShininess.value = sp.centerSpecularShininess;
              if (uniforms.uCenterSpecularAnisotropy) uniforms.uCenterSpecularAnisotropy.value = sp.centerSpecularAnisotropy;

              if (uniforms.uShineStretch) uniforms.uShineStretch.value = sp.shineStretch;
              if (uniforms.uShineWidth) uniforms.uShineWidth.value = sp.shineWidth;
              if (uniforms.uShineIntensity) uniforms.uShineIntensity.value = sp.shineIntensity;
              if (uniforms.uTime) uniforms.uTime.value = performance.now() * 0.001;

              if (uniforms.uGlobalShadowThreshold) uniforms.uGlobalShadowThreshold.value = sp.globalShadowThreshold;
              if (uniforms.uGlobalShadowSmoothness) uniforms.uGlobalShadowSmoothness.value = sp.globalShadowSmoothness;
              if (uniforms.uGlobalShadowOpacity) uniforms.uGlobalShadowOpacity.value = sp.globalShadowOpacity;
              if (uniforms.uGlobalShadowColor) {
                  if (uniforms.uGlobalShadowColor.value.set) uniforms.uGlobalShadowColor.value.set(sp.globalShadowColor);
                  else uniforms.uGlobalShadowColor.value = new THREE.Color(sp.globalShadowColor);
              }
              
              if (uniforms.uSpotLightIntensity) uniforms.uSpotLightIntensity.value = sp.spotLightIntensity;
              if (uniforms.uSpotLightSize) uniforms.uSpotLightSize.value = sp.spotLightSize;
              if (uniforms.uSpotLightFalloff) uniforms.uSpotLightFalloff.value = sp.spotLightFalloff;
              if (uniforms.uSpotLightColor) {
                  if (uniforms.uSpotLightColor.value.set) uniforms.uSpotLightColor.value.set(sp.spotLightHex);
                  else uniforms.uSpotLightColor.value = new THREE.Color(sp.spotLightHex);
              }
              if (uniforms.uSpotLightX) uniforms.uSpotLightX.value = sp.spotLightX;
              if (uniforms.uSpotLightY) uniforms.uSpotLightY.value = sp.spotLightY;
              
              if (uniforms.uMotionOpacity) uniforms.uMotionOpacity.value = sp.motionOpacity;
              if (uniforms.uMotionIntensity) uniforms.uMotionIntensity.value = sp.motionIntensity;
              if (uniforms.uMotionFalloff) uniforms.uMotionFalloff.value = sp.motionFalloff;
              if (uniforms.uMotionOffset) uniforms.uMotionOffset.value = activeMotionOffset;
              
              if (uniforms.uMotionRotation) uniforms.uMotionRotation.value = sp.motionRotation;
              if (uniforms.uMotionFrequency) uniforms.uMotionFrequency.value = sp.motionFrequency;
              if (uniforms.uMotionWidth) uniforms.uMotionWidth.value = sp.motionWidth;
              if (uniforms.uMotionColor) {
                  if (uniforms.uMotionColor.value.set) uniforms.uMotionColor.value.set(sp.motionHex);
                  else uniforms.uMotionColor.value = new THREE.Color(sp.motionHex);
              }
              
              if (uniforms.uHasLightMap) {
                  const hasLM = sp.showLightMap && mesh.userData.currentTextures && mesh.userData.currentTextures.lightMap ? 1.0 : 0.0;
                  uniforms.uHasLightMap.value = hasLM;
                  if (hasLM) {
                      uniforms.uLightMap.value = mesh.userData.currentTextures.lightMap;
                      // Linearly scale lightMap visibility to current throttle load (0 to 1) so it reacts exactly like the engine reactor glow!
                      const lightMapFade = Math.max(0.0, Math.min(1.0, throttleRatio));
                      uniforms.uLightMapIntensity.value = sp.lightMapIntensity * lightMapFade;
                      uniforms.uLightMapGlow.value = sp.lightMapGlow;
                      if (uniforms.uLightMapBloom) uniforms.uLightMapBloom.value = (sp.lightMapBloom ?? 1.0) * lightMapFade;
                      uniforms.uLightMapFalloff.value = sp.lightMapFalloff;
                      uniforms.uLightMapSize.value = sp.lightMapSize;
                      if (uniforms.uLightMapColor.value.set) uniforms.uLightMapColor.value.set(sp.lightMapHex);
                      else uniforms.uLightMapColor.value = new THREE.Color(sp.lightMapHex);
                  }
              }
              
              if (uniforms.uLocalSunDir) {
                 mesh.updateMatrixWorld(true);
                 loopLocalSunPos.set(finalDirX, finalDirY, finalDirZ);
                 mesh.worldToLocal(loopLocalSunPos);
                 if (uniforms.uLocalSunDir.value.copy) uniforms.uLocalSunDir.value.copy(loopLocalSunPos).normalize();
                 else uniforms.uLocalSunDir.value = loopLocalSunPos.clone().normalize();
              }

              if (uniforms.uNavLightPortIntensity) {
                  const blinkRate = Math.max(0.1, sp.navLightsBlinkRate || 1.5);
                  const uniqueOffset = shipId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 0.123;
                  const blinkPhase = ((Date.now() * 0.001) + uniqueOffset) % blinkRate;
                  const isOn = blinkPhase < 0.1 || (blinkPhase > 0.25 && blinkPhase < 0.35);
                  
                  uniforms.uNavLightPortIntensity.value = isOn ? (sp.navLightsPortIntensity ?? 5.0) : 0.0;
                  uniforms.uNavLightStbIntensity.value = isOn ? (sp.navLightsStbIntensity ?? 5.0) : 0.0;
                  
                  if (uniforms.uNavLightPortPos) {
                      if (uniforms.uNavLightPortPos.value.set) {
                          uniforms.uNavLightPortPos.value.set(-sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                          uniforms.uNavLightStbPos.value.set(sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                      } else {
                          uniforms.uNavLightPortPos.value = new THREE.Vector2(-sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                          uniforms.uNavLightStbPos.value = new THREE.Vector2(sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                      }
                      
                      if (uniforms.uNavLightColorPort.value.set) {
                          uniforms.uNavLightColorPort.value.set(sp.navLightsPortColor || '#ff0000');
                          uniforms.uNavLightColorStb.value.set(sp.navLightsStbColor || '#00ff00');
                      } else {
                          uniforms.uNavLightColorPort.value = new THREE.Color(sp.navLightsPortColor || '#ff0000');
                          uniforms.uNavLightColorStb.value = new THREE.Color(sp.navLightsStbColor || '#00ff00');
                      }
                      
                      if (uniforms.uNavLightFalloff) {
                          uniforms.uNavLightFalloff.value = sp.navLightsFalloff ?? 0.005;
                      }
                  }
              }
          }
      };
      
      const leadSp = allShipParamsRef.current[playerShipIdRef.current] || globalShipbankStateRef.current;
      if (planeModel && planeModel.visible) pushFinalUniforms(planeModel, leadSp, motionOffsetRef.current, leadVelocityRatio, playerShipIdRef.current);
      if (underbellyPlane && underbellyPlane.visible) pushFinalUniforms(underbellyPlane as THREE.Mesh, leadSp, motionOffsetRef.current, leadVelocityRatio, playerShipIdRef.current);
      
      // Inject isolated animated material parameters into all active wingman flight models natively
      if (drones) {
          Object.keys(drones).forEach(id => {
              const dr = drones[id] as any;
              if (!dr || !dr.group) return;
              
              const sp = allShipParamsRef.current[id] || globalShipbankStateRef.current;
              const wVelocityRatio = dr.speed / Math.max(0.0001, sp.maxSpeed);
              
              // We now use the global motionOffsetRef for ALL ships so the environment appears global
              dr.motionOffset = motionOffsetRef.current;
              
              const wChassis = dr.group.getObjectByName('shipChassis');
              if (wChassis) {
                  const dPM = wChassis.getObjectByName('planeModel') as THREE.Mesh;
                  const duPM = wChassis.getObjectByName('underbellyPlane') as THREE.Mesh;
                  if (dPM && dPM.visible) pushFinalUniforms(dPM, sp, dr.motionOffset, wVelocityRatio, id);
                  if (duPM && duPM.visible) pushFinalUniforms(duPM, sp, dr.motionOffset, wVelocityRatio, id);
              }
          });
      }
      
      if ((shipGroup as any).userData.auraMesh) {
          const am = (shipGroup as any).userData.auraMesh as THREE.Mesh;
          const amMat = am.material as THREE.ShaderMaterial;
          amMat.uniforms.uColor.value.set(p.auraHex);
          amMat.uniforms.uBlur.value = p.auraBlur;
          amMat.uniforms.uOpacity.value = p.auraOpacity;
          am.scale.set(p.auraScaleX, p.auraScaleY, 1.0);
      }

      const cms = shipsRef.current.find(s => s.id === playerShipIdRef.current) || shipsRef.current[0] || {};
      let reactorOffsetX = 0;
      let reactorOffsetZ = 3.5;
      
      const aspect = planeModel ? planeModel.scale.x / planeModel.scale.z : 1.0;
      const hScale = planeModel ? planeModel.scale.z : 20.0;
      const wScale = planeModel ? planeModel.scale.x : 20.0;

      const cacheDataLead = shipGeometryCacheRef.current[playerShipIdRef.current];
      if (cacheDataLead && cacheDataLead.engines && cacheDataLead.engines.length > 0) {
         const reactorPt = cacheDataLead.engines.find((p: any) => p.type === 'reactor');
         if (reactorPt) {
             let shipRot = (cms as any).rotation || 0;
             if (shipRot < 0) shipRot += 360;
             const rotRadians = shipRot * (Math.PI / 180);
             const cosR = Math.cos(-rotRadians);
             const sinR = Math.sin(-rotRadians);
             const rx = reactorPt.cx * cosR - reactorPt.cy * sinR;
             const ry = reactorPt.cx * sinR + reactorPt.cy * cosR;
             
             const shipScale = planeModel ? planeModel.userData.shipScale || 1.0 : 1.0;
             const size = Math.max(0.01, p.planeSize) * shipScale;
             const aspectX = planeModel ? planeModel.userData.aspectX || 1.0 : 1.0;
             const currentScaleWidth = size * aspectX * p.squashLength;
             
             reactorOffsetX = rx * currentScaleWidth * 100.0;
             reactorOffsetZ = -ry * size * 100.0;
         }
      }

      // Engine glow
      const targetIntensity = fwd ? (2.0 + Math.sin(Date.now() * 0.025) * 0.4) : 0.8; // Idle glow for visibility
      engLight.intensity += (targetIntensity - engLight.intensity) * 0.1;
      
      // Since engLight is intrinsically mounted to shipChassis, Z handles geometric Depth/Elevation
      engLight.position.set(reactorOffsetX, reactorOffsetZ, 2.0);
      // Thruster trail
      trailMat.size = p.trailSize;

      const isMoving = Math.abs(speed) > 0.05;
      const enableIdleFx = false; // Disabled so thrust only shows organically via user input
      

      // -------------------------------------------------------------
      // UNIFIED 1-SYSTEM FLUID EMISSIONS FOR ENTIRE FLEET
      // -------------------------------------------------------------
      const currentEmits: any[] = [];
      if (!showMapRef.current && !isLoadingRef.current) {
          activeFleet.forEach((dr) => {
              const isPlayer = dr.isPlayer;
              const spd = dr.speed;
              // Link player FX emission directly to input (fwd) rather than physics speed so flames cut off instantly on key release
              const isMovingStatus = isPlayer ? (fwd || enableIdleFx) : (spd > 0.05);

              if (!isMovingStatus) return;

              const splashConfig = globalSplashConfigRef.current || {};
              if (!splashConfig) return;

              const tGroup = isPlayer ? shipGroup : dr.group;
              const targetPlane = tGroup.getObjectByName('planeModel') as THREE.Mesh || tGroup;
              if (!targetPlane) return;

              if (!isPlayer) tGroup.updateMatrixWorld(true);

              // Match CMS registration layouts mapped tightly to structural core rotation natively
              const shipId = isPlayer ? focusedShipIdRef.current : dr.id;
              const cms = shipsRef.current.find(s => s.id === shipId) || shipsRef.current[0] || {};
              
              let shipRot = (cms as any).rotation || 0;
              if (shipRot < 0) shipRot += Math.PI * 2;
              const rotRads = shipRot;
              
              let rawEngines = shipGeometryCacheRef.current[cms.id]?.engines || [{ cx: 0, cy: 0.5, originalX: 0, originalY: 0 }];
              if (rawEngines.length === 0) rawEngines.push({ cx: 0, cy: 0.5, originalX: 0, originalY: 0 });
              
              rawEngines.forEach((pt: any, engNum: number) => {
                  const cosR = Math.cos(-rotRads);
                  const sinR = Math.sin(-rotRads);
                  const rx = pt.cx * cosR - pt.cy * sinR;
                  const ry = pt.cx * sinR + pt.cy * cosR;
                  const engX = rx * 100.0;
                  const engY = -ry * 100.0;
                  
                  const enginePos = MathCache.vec1.set(engX, engY, 0);
                  const engineForward = MathCache.vec2.set(engX, engY - 20.0, 0);

                  enginePos.applyMatrix4(targetPlane.matrixWorld);
                  engineForward.applyMatrix4(targetPlane.matrixWorld);

                  enginePos.project(camera);
                  engineForward.project(camera);

                  // Fluid natively overlays perfectly against full inner window viewport coordinates seamlessly
                  const w = window.innerWidth;
                  const h = window.innerHeight;

                  // SplashCursor is physically inside containerRef natively, so we explicitly drop 
                  // rectLeft and rectTop bounding offsets to guarantee coordinates trace perfectly regardless of fullscreen state!
                  let scaleW = window.innerWidth;
                  let scaleH = window.innerHeight;
                  
                  if (mountRef.current) {
                      const rect = mountRef.current.getBoundingClientRect();
                      scaleW = rect.width;
                      scaleH = rect.height;
                  }

                  const screenX = ((enginePos.x * 0.5 + 0.5) * scaleW);
                  const screenY = ((-(enginePos.y) * 0.5 + 0.5) * scaleH);
                  const fwdScreenX = ((engineForward.x * 0.5 + 0.5) * scaleW);
                  const fwdScreenY = ((-(engineForward.y) * 0.5 + 0.5) * scaleH);

                  // Correctly point the vector exactly out of the tail (Forward point minus Engine point)
                  let dirX = fwdScreenX - screenX;
                  let dirY = -(fwdScreenY - screenY);
                  const mag = Math.hypot(dirX, dirY);
                  if (mag > 0.0001) {
                      dirX /= mag; dirY /= mag;
                  } else {
                      dirX = 0; dirY = -1;
                  }
                  

                  const emitForceMult = splashConfig.emissionForceMult !== undefined ? splashConfig.emissionForceMult : 1.0;
                  const inv = splashConfig.invertForce !== undefined ? splashConfig.invertForce : true;
                  const fm = emitForceMult * (inv ? -1.0 : 1.0);
                  const speedRatio = spd > 0.05 ? 1.0 : 0.4;

                  let cHex = "#00e5ff";
                  // Per-ship FX color override takes priority (set by screensaver user panel)
                  if (shipFxColorOverrideRef.current[shipId]) {
                      cHex = shipFxColorOverrideRef.current[shipId];
                  } else if (splashConfig.exhaustColors && splashConfig.exhaustColors.length > 0) {
                      cHex = splashConfig.exhaustColors[0];
                  }
                  const str = cHex.replace('#', '');
                  const c = { r: parseInt(str.substring(0,2), 16) / 255, g: parseInt(str.substring(2,4), 16) / 255, b: parseInt(str.substring(4,6), 16) / 255 };

                  // Dynamic Zoom Clamp: Proportionally reduce the visual fluid emission radius 
                  // when the camera pulls back so it matches the ship model!
                  const zoomRatio = currentCameraZoom;

                  currentEmits.push({
                     id: isPlayer ? `shipbank_lead_eng${engNum}` : `shipbank_wg_${dr.id}_eng${engNum}`,
                     x: screenX,
                     y: screenY,
                     dx: dirX * 0.015 * fm * speedRatio, 
                     dy: dirY * 0.015 * fm * speedRatio, 
                     color: { r: c.r, g: c.g, b: c.b },
                     splatRadius: (splashConfig.splatRadius ?? 0.2) * speedRatio * zoomRatio, 
                     splatForce: (splashConfig.splatForce ?? 6000) * speedRatio * zoomRatio
                  });
              });
          });
      }
      splashEmitRef.current = currentEmits;

      // Constantly run trailing particles to keep the engine feeling alive
      const optTrail = (scene as any).userData.playerOptTrail;
      if (optTrail) {
          const fx = globalSplashConfigRef.current || {};
          const rx = isMoving ? nz * (p.trailWidth || 2.0) : 0;
          const rz = isMoving ? -nx * (p.trailWidth || 2.0) : 0;
          const spreadY = isMoving ? (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 0;
          
          const mountY = p.trailMountY ?? -2.0;
          
          const currentLeftX = shipX + nx * mountY - rx;
          const currentLeftY = (p.modelY || 0) - 0.5;
          const currentLeftZ = shipZ + nz * mountY - rz;
          
          const currentRightX = shipX + nx * mountY + rx;
          const currentRightY = currentLeftY;
          const currentRightZ = shipZ + nz * mountY + rz;
          
          let lastLeftX = 99999.0, lastLeftY = 99999.0, lastLeftZ = 99999.0;
          let lastRightX = 99999.0, lastRightY = 99999.0, lastRightZ = 99999.0;
          
          if (optTrail.head >= 2 && !Number.isNaN(optTrail.head)) {
              const leftIdx = (optTrail.head - 2 + optTrail.maxSize) % optTrail.maxSize;
              const rightIdx = (optTrail.head - 1 + optTrail.maxSize) % optTrail.maxSize;
              lastLeftX = optTrail.positions[leftIdx * 3] ?? 99999.0;
              lastLeftY = optTrail.positions[leftIdx * 3 + 1] ?? 99999.0;
              lastLeftZ = optTrail.positions[leftIdx * 3 + 2] ?? 99999.0;
              
              lastRightX = optTrail.positions[rightIdx * 3] ?? 99999.0;
              lastRightY = optTrail.positions[rightIdx * 3 + 1] ?? 99999.0;
              lastRightZ = optTrail.positions[rightIdx * 3 + 2] ?? 99999.0;
          }
          
          if (!showMapRef.current) {
              if (trailSystemOverride) {
                  trailSystemOverride.update(
                      optTrail, 
                      { x: currentLeftX, y: currentLeftY, z: currentLeftZ },
                      { x: currentRightX, y: currentRightY, z: currentRightZ },
                      { x: lastLeftX, y: lastLeftY, z: lastLeftZ },
                      { x: lastRightX, y: lastRightY, z: lastRightZ },
                      isMoving, p, nowTime, fx
                  );
              } else {
                  let steps = 1;
                  if (isMoving && lastLeftX < 90000.0 && !Number.isNaN(lastLeftX)) {
                      const dist = Math.hypot(currentLeftX - lastLeftX, currentLeftZ - lastLeftZ);
                      if (dist > 50.0) {
                          lastLeftX = currentLeftX;
                          lastLeftY = currentLeftY;
                          lastLeftZ = currentLeftZ;
                          lastRightX = currentRightX;
                          lastRightY = currentRightY;
                          lastRightZ = currentRightZ;
                      }
                  }
                  
                  for (let step = 1; step <= steps; step++) {
                      const t = step / steps;
                      const lx = isMoving ? lastLeftX + (currentLeftX - lastLeftX) * t : 99999.0;
                      const ly = isMoving ? lastLeftY + (currentLeftY - lastLeftY) * t + spreadY : 99999.0;
                      const lz = isMoving ? lastLeftZ + (currentLeftZ - lastLeftZ) * t : 99999.0;
                      
                      const rx_val = isMoving ? lastRightX + (currentRightX - lastRightX) * t : 99999.0;
                      const ry_val = isMoving ? lastRightY + (currentRightY - lastRightY) * t + spreadY : 99999.0;
                      const rz_val = isMoving ? lastRightZ + (currentRightZ - lastRightZ) * t : 99999.0;
                      
                      const wi1 = optTrail.head % optTrail.maxSize;
                      optTrail.positions[wi1 * 3]     = isMoving ? lx + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                      optTrail.positions[wi1 * 3 + 1] = isMoving ? ly : 99999.0;
                      optTrail.positions[wi1 * 3 + 2] = isMoving ? lz + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                      optTrail.birthTimes[wi1] = nowTime / 1000.0;
                      optTrail.head++;
                      
                      const wi2 = optTrail.head % optTrail.maxSize;
                      optTrail.positions[wi2 * 3]     = isMoving ? rx_val + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                      optTrail.positions[wi2 * 3 + 1] = isMoving ? ry_val : 99999.0;
                      optTrail.positions[wi2 * 3 + 2] = isMoving ? rz_val + (Math.random() - 0.5) * (fx.trailSpread ?? 0.5) : 99999.0;
                      optTrail.birthTimes[wi2] = nowTime / 1000.0;
                      optTrail.head++;
                  }
              }
          }
          
          optTrail.geometry.attributes.position.needsUpdate = true;
          if (optTrail.geometry.attributes.aBirthTime) {
              optTrail.geometry.attributes.aBirthTime.needsUpdate = true;
          }
          
          optTrail.material.uniforms.uTime.value = nowTime / 1000.0;
          if (p.trailColor) optTrail.material.uniforms.uTrailColor.value.set(p.trailColor);
          optTrail.material.uniforms.uTrailLife.value = p.trailLife ?? 2.0;
          optTrail.material.uniforms.uTrailSize.value = p.trailSize ?? 10.0;
          optTrail.material.uniforms.uTrailOpacity.value = p.trailOpacity ?? 0.8;
          optTrail.material.uniforms.uCameraZoom.value = currentCameraZoom;
          
          optTrail.mesh.visible = !showMapRef.current;
      }

      // Camera Easing Tracker
      // Safety failsafe for map toggling (but allow cinematic sweeps)
      if (cameraTargetX === 0 && cameraTargetZ === 0 && shipX === 0) {
         cameraTargetX = shipX;
         cameraTargetZ = shipZ;
      }
      
      let isTrackingDrone = false;
      const focusId = focusedShipIdRef.current;
      if (focusId && focusId !== playerShipIdRef.current && (scene as any).userData.drones?.[focusId]) {
          isTrackingDrone = true;
      }
      
      if (!showMapRef.current && !activeCinematicMode) {
          if (!isTrackingDrone) {
              if (Math.abs(shipX - cameraTargetX) > BOUND) {
                  if (shipX > cameraTargetX + BOUND) cameraTargetX += BOUND * 2;
                  if (shipX < cameraTargetX - BOUND) cameraTargetX -= BOUND * 2;
              }
              if (Math.abs(shipZ - cameraTargetZ) > BOUND) {
                  if (shipZ > cameraTargetZ + BOUND) cameraTargetZ += BOUND * 2;
                  if (shipZ < cameraTargetZ - BOUND) cameraTargetZ -= BOUND * 2;
              }
          } else {
              const activeFocusX = (scene as any).userData.drones[focusId].x;
              const activeFocusZ = (scene as any).userData.drones[focusId].z;
              const RADIUS = Math.max(600, dynamicConstraintRadius);
              
              if (Math.abs(activeFocusX - cameraTargetX) > RADIUS * 1.5) {
                  if (activeFocusX > cameraTargetX + RADIUS) cameraTargetX += RADIUS * 2;
                  if (activeFocusX < cameraTargetX - RADIUS) cameraTargetX -= RADIUS * 2;
              }
              if (Math.abs(activeFocusZ - cameraTargetZ) > RADIUS * 1.5) {
                  if (activeFocusZ > cameraTargetZ + RADIUS) cameraTargetZ += RADIUS * 2;
                  if (activeFocusZ < cameraTargetZ - RADIUS) cameraTargetZ -= RADIUS * 2;
              }
          }
      }
      
      if (showMapRef.current) {
         // Lock the focus instantly closer to the sun's actual position so the rapid zoom-out operates around the sun.
         // Account for the map's left-bias container scaling by shifting the 3D camera target dynamically.
         const uiOffset3DX = (0.50 - targetLayoutX.current) * (el ? el.clientWidth * 0.05 / Math.max(0.01, currentCameraZoom) : 0);
         
         // Synthesize external panning from Map overlay pixels to 3D orthographic spatial units.
         // We apply the single inverse camera zoom here so that physical cursor drag behaves constantly across zoom levels natively.
         const mapPan3DX = -mapPanRef.current.x * (0.05 / Math.max(0.01, currentCameraZoom));
         const mapPan3DZ = -mapPanRef.current.y * (0.05 / Math.max(0.01, currentCameraZoom));
         
         // By default, the standard Map zooms out from the Solar System center (0,0).
         let baseTargetX = 0;
         let baseTargetZ = 0;
         
         if (targetPlanetNameRef.current) {
            const tgtMesh = (scene as any).userData.planetMeshes?.[targetPlanetNameRef.current];
            if (tgtMesh) {
                baseTargetX = tgtMesh.position.x;
                baseTargetZ = tgtMesh.position.z;
            }
         } else if (targetShipIdRef.current) {
            const trgShipId = targetShipIdRef.current;
            if (trgShipId === playerShipIdRef.current) {
                baseTargetX = shipX;
                baseTargetZ = shipZ;
            } else if (drones[trgShipId]) {
                baseTargetX = drones[trgShipId].x;
                baseTargetZ = drones[trgShipId].z;
            }
         }

         const target3DX = baseTargetX + mapPan3DX + uiOffset3DX;
         const target3DZ = baseTargetZ + mapPan3DZ;
         
         const densityScalar = showMapRef.current ? planetPrefsRef.current.panDensity : 0.15;
         
         // Camera Pan Tracker
         cameraTargetX += (target3DX - cameraTargetX) * densityScalar;
         cameraTargetZ += (target3DZ - cameraTargetZ) * densityScalar;
      } else {
         // Push the camera focus ahead...
         let cinematicOffsetX = 0;
         let cinematicOffsetZ = 0;
         
         // Smoothly transition the drone-sway multiplier over time instead of instantly snapping the target coordinate
         const targetSwayWeight = activeCinematicMode ? 1.0 : 0.0;
         droneSwayWeightRef.current += (targetSwayWeight - droneSwayWeightRef.current) * (delta * 1.5);
         
         if (droneSwayWeightRef.current > 0.001) {
             const t = performance.now() * 0.001;
             const droneSwayX = Math.sin(t * 0.45) * 3.0; // Gentler sway speed
             const droneSwayZ = Math.cos(t * 0.30) * 2.5; 
             cinematicOffsetX = droneSwayX * droneSwayWeightRef.current;
             cinematicOffsetZ = droneSwayZ * droneSwayWeightRef.current;
         }
         
         // In Cinematic Mode (idling), let the camera drift in a dream-like syrup.
         // In Active Flight, bind the camera aggressively to the hull to prevent motion sickness and rubber-banding lag during hard braking!
         // Smoothly compute closing transition earlier so the lateral swoop natively maps to the exact same speed as the vertical drop!
         const cinBehavior = overrideCinBehavior || (paramsRef.current as any).cinematicBehavior || 'close_up';
         
         let cinematicTargetZoom = 1.0;
         if (cinBehavior === 'close_up') {
             cinematicTargetZoom = 1.45; // Hardcoded safe close up
         } else if (cinBehavior === 'wide_shot') {
             cinematicTargetZoom = 0.68;
         } else if (cinBehavior === 'random') {
             const rMin = 0.68; // Safe wide bound
             const rMax = 1.35; // Safe close bound
             if (randomTargetZoomRef.current === null) {
                 randomTargetZoomRef.current = rMin + Math.random() * (rMax - rMin);
             }
             // Ensure the target remains within bounds if UI settings change
             randomTargetZoomRef.current = Math.max(rMin, Math.min(rMax, randomTargetZoomRef.current));
             cinematicTargetZoom = randomTargetZoomRef.current;
         }
         const mapTargetZoom = showMapRef.current ? mapZoomRef.current : (activeCinematicMode ? cinematicTargetZoom : 1.0);
         
         const isZoomEasing = Math.abs(currentCameraZoom - mapTargetZoom) > 0.02;
         if (!isZoomEasing && mapExitPhaseRef.current) {
               mapExitPhaseRef.current = false; // Turn off the map exit sweep once the camera physically settles
         }
         
         let defaultTrackingStrength = (activeCinematicMode || p.autoTour) ? 0.05 : 0.35;
         
         // Minor adjustment: When zooming closely into the ship during Cinematic Mode, 
         // dynamically tighten the tracking so it doesn't fly out of the letterbox frame!
         if ((activeCinematicMode || p.autoTour) && currentCameraZoom < 1.0) {
             const zoomDepth = 1.0 - currentCameraZoom; // e.g., 0.32 at 0.68 zoom
             defaultTrackingStrength += zoomDepth * 0.15; // Tighten tracking linearly as we zoom in
         }
         const ultimateTrackingStrength = mapExitPhaseRef.current ? planetPrefsRef.current.mapCloseSpeed : defaultTrackingStrength;
         
         // Smooth the velocity tracking interpolator so the camera doesn't abruptly snag mid-flight when modes suddenly switch
         // We use a much softer delta multiplier (0.5 instead of 3.0) so exiting cinematic mode is a graceful, drawn-out camera tighten!
         trackingStrengthRef.current += (ultimateTrackingStrength - trackingStrengthRef.current) * (delta * 0.5);
         
         let finalCamTargetX = shipX;
         let finalCamTargetZ = shipZ;
         
         // Camera native targeting: if user clicked a ship in the hangar, redirect physical lookAt!
         const focusId = focusedShipIdRef.current;
         if (focusId && focusId !== playerShipIdRef.current && drones[focusId]) {
             finalCamTargetX = drones[focusId].x;
             finalCamTargetZ = drones[focusId].z;
         }
         
         cameraTargetX += (finalCamTargetX + cinematicOffsetX - cameraTargetX) * trackingStrengthRef.current;
         cameraTargetZ += (finalCamTargetZ + cinematicOffsetZ - cameraTargetZ) * trackingStrengthRef.current;
      }

      // Camera Modes
      switch (p.cameraAngle) {
        case 'front': {
          camera.position.set(cameraTargetX + nx * 60, 10, cameraTargetZ + nz * 60);
          camera.up.set(0, 1, 0);
          camera.lookAt(cameraTargetX, 0, cameraTargetZ);
          break;
        }
        case 'right': {
          const rx = Math.cos(heading);
          const rz = Math.sin(heading);
          camera.position.set(cameraTargetX + rx * 60, 10, cameraTargetZ + rz * 60);
          camera.up.set(0, 1, 0);
          camera.lookAt(cameraTargetX, 0, cameraTargetZ);
          break;
        }
        case 'isometric': {
          camera.position.set(cameraTargetX + 60, 60, cameraTargetZ + 60);
          camera.up.set(0, 1, 0);
          camera.lookAt(cameraTargetX, 0, cameraTargetZ);
          break;
        }
        case 'cinematic': {
          camera.position.set(cameraTargetX - nx * 40, 20, cameraTargetZ - nz * 40);
          camera.up.set(0, 1, 0);
          camera.lookAt(cameraTargetX + nx * 20, 0, cameraTargetZ + nz * 20);
          break;
        }
        case 'top':
        default: {
          camera.position.set(cameraTargetX, 60, cameraTargetZ);
          camera.up.set(0, 0, -1);
          camera.lookAt(cameraTargetX, 0, cameraTargetZ);
          break;
        }
      }

      // Apply mapping zoom integration precisely across all 3 interactive transition phases (entry, tracking, closing)
      const cinBehavior2 = overrideCinBehavior || (paramsRef.current as any).cinematicBehavior || 'close_up';
      
      let cinematicTargetZoom2 = 1.0;
      if (cinBehavior2 === 'close_up') {
          cinematicTargetZoom2 = 1.45; // Hardcoded safe close up
      } else if (cinBehavior2 === 'wide_shot') {
          cinematicTargetZoom2 = 0.68;
      } else if (cinBehavior2 === 'random') {
          cinematicTargetZoom2 = randomTargetZoomRef.current ?? 1;
      }
      
      const targetCameraZoom = showMapRef.current
          ? mapZoomRef.current
          : (activeCinematicMode ? cinematicTargetZoom2 : 1.0); // Maintain designated size when interacted
      
      // Pure Exponential Easing Geometry (zero spring bounce)
      let currentZoomTension = 0.05;
      
      if (showMapRef.current) {
         if (mapEntryPhaseRef.current) {
             currentZoomTension = planetPrefsRef.current.mapOpenSpeed; 
         } else {
             currentZoomTension = Math.min(planetPrefsRef.current.zoomInertia, 0.3); 
         }
      } else {
         // UI CLOSING! Map must respect map slider before restoring to normal!
         const isZoomEasing = Math.abs(currentCameraZoom - targetCameraZoom) > 0.02;
         currentZoomTension = mapExitPhaseRef.current 
              ? planetPrefsRef.current.mapCloseSpeed 
              // If we are exiting cinematic mode manually, we use a very soft tension (0.015) instead of the aggressive mapCloseSpeed!
              : (activeCinematicMode ? (paramsRef.current.cinematicZoomSpeed ?? 0.02) : 0.02);
      }
      
      const timeScalar = delta * 60.0;
      
      // Simple Ease Native Multiplier
      currentCameraZoom += (targetCameraZoom - currentCameraZoom) * currentZoomTension * timeScalar;
      
      // Handle Random Zoom Re-Targeting Logic
      if (cinBehavior2 === 'random' && activeCinematicMode && !showMapRef.current) {
          // Increase tolerance to 0.15 to account for Zeno's paradox with extremely slow tension (e.g. 0.005)
          if (randomTargetZoomRef.current !== null && Math.abs(currentCameraZoom - randomTargetZoomRef.current) < 0.15) {
              randomZoomHoldTimerRef.current += delta;
              if (randomZoomHoldTimerRef.current > 3.0) { // Hold shot for 3 seconds before next random sweep
                  const rMin = Number((paramsRef.current as any).cinematicRandomMinZoom ?? 0.3);
                  const rMax = Number((paramsRef.current as any).cinematicRandomMaxZoom ?? 1.5);
                  const actualMin = Math.min(rMin, rMax);
                  const actualMax = Math.max(rMin, rMax);
                  randomTargetZoomRef.current = actualMin + Math.random() * (actualMax - actualMin);
                  randomZoomHoldTimerRef.current = 0;
              }
          } else {
              randomZoomHoldTimerRef.current = 0;
          }
      }
      
      // Nullify internal velocity state since we're off physics now
      mapZoomVelocityRef.current = 0;
      currentCameraZoomRef.current = currentCameraZoom;
      
      // Native Cinematic Interactive Drift Inertia processing logic directly locking to grid
      if ((showMapRef.current || isPlanetSystem) && !isDraggingMap.current) {
          mapPanRef.current.x += mapPanVelocity.current.x;
          mapPanRef.current.y += mapPanVelocity.current.y;
          // Dynamically degrade momentum tracking exactly via custom sliders slider!
          mapPanVelocity.current.x *= planetPrefsRef.current.inertia;
          mapPanVelocity.current.y *= planetPrefsRef.current.inertia;
      }
      
      // Build Map Sync Frame
      if (fleetPositionsRef.current) {
         const fleetOut = [];
         fleetOut.push({ id: playerShipIdRef.current, x: cumSunX, y: cumSunZ, color: '#00f7ff', isPlayer: true });
         
         let cIdx = 0;
         Object.keys(drones).forEach((id) => {
             const dr = drones[id];
             const currentSunX = shipX - cumSunX;
             const currentSunZ = shipZ - cumSunZ;
             const hue = (cIdx * 50 + 45) % 360;
             fleetOut.push({ id, x: dr.x - currentSunX, y: dr.z - currentSunZ, color: `hsl(${hue}, 100%, 65%)`, isPlayer: false });
             cIdx++;
         });
         fleetPositionsRef.current = fleetOut;
      }
      
      dronesRef.current = drones; // Sync drones ref for external handlers like onWheel

      const oc = camera as THREE.OrthographicCamera;
      oc.zoom = currentCameraZoom;
      oc.updateProjectionMatrix();

      if ((scene as any).userData.starLayers) {
          const sl = (scene as any).userData.starLayers;
          if (sl.bg) sl.bg.material.uniforms.uCameraZoom.value = currentCameraZoom;
          if (sl.fx) sl.fx.material.uniforms.uCameraZoom.value = currentCameraZoom;
          if (sl.fg) sl.fg.material.uniforms.uCameraZoom.value = currentCameraZoom;
      }

      const timeSec = nowTime / 1000.0;
      const pulseCycle = timeSec % 30.0;
      const isPulsingOut = pulseCycle > 26.0; // Animate out for the last 4 seconds of the 30s cycle
      
      const targetBoxPct = (activeCinematicMode && dynamicLetterboxEnabled && !isPulsingOut) ? 12 : 0;
      const currentBoxPct = letterboxHeightRef.current;
      
      const inSpeedSec = (paramsRef.current as any).letterboxInSpeed ?? 2.0;
      const outSpeedSec = (paramsRef.current as any).letterboxOutSpeed ?? 3.0;
      
      const isOpening = targetBoxPct > currentBoxPct;
      const durationSec = isOpening ? inSpeedSec : outSpeedSec;
      
      // timeScalar is relative to 60fps. Distance is 12 units.
      const maxDelta = (12 / (Math.max(0.1, durationSec) * 60)) * timeScalar;
      
      let newBoxPct = currentBoxPct;
      if (isOpening) {
          newBoxPct = Math.min(targetBoxPct, currentBoxPct + maxDelta);
      } else if (targetBoxPct < currentBoxPct) {
          newBoxPct = Math.max(targetBoxPct, currentBoxPct - maxDelta);
      }
      
      letterboxHeightRef.current = newBoxPct;
      
      if (topLetterboxDomRef.current && bottomLetterboxDomRef.current) {
          topLetterboxDomRef.current.style.height = `${newBoxPct}%`;
          bottomLetterboxDomRef.current.style.height = `${newBoxPct}%`;
      }

      if ((scene as any).userData.prevCamTarget) {
          const prevTarget = (scene as any).userData.prevCamTarget;
          const projectedPrev = MathCache.vec3.copy(prevTarget).project(camera);
          
          const w = el ? el.clientWidth : window.innerWidth;
          const h = el ? el.clientHeight : window.innerHeight;
          
          const prevScreenX = (projectedPrev.x * 0.5 + 0.5) * w;
          const prevScreenY = (-(projectedPrev.y) * 0.5 + 0.5) * h;
          splashCameraDeltaRef.current.x = (w / 2 - prevScreenX);
          splashCameraDeltaRef.current.y = (h / 2 - prevScreenY);

          // Track actual physical displacement of the camera tracking target instead of the raw ship velocity!
          // This guarantees the stars exhibit the exact same spring-elasticity as the fluid particles, locking them in ratio.
          flightVelocityRef.current.x = (cameraTargetX - prevTarget.x) * 40.0;
          flightVelocityRef.current.y = (cameraTargetZ - prevTarget.z) * 40.0; // Z in WebGL becomes Y in 2D Screen
      }
      // ── MAP 2D HTML UI VECTORS TO THREE.JS GRID ──
      const tNow = performance.now();
      const elW = el ? el.clientWidth : window.innerWidth;
      const elH = el ? el.clientHeight : window.innerHeight;

      const originScreenV = MathCache.vec3.set(0,0,0).project(camera);
      const originPx = originScreenV.x * (elW / 2);
      const originPy = -originScreenV.y * (elH / 2);

      // Strictly couple the visual Sun natively to the 3D map origin physically!
      if (showMapRef.current && sunPosRef.current) {
          sunPosRef.current.x = (originScreenV.x + 1) * (elW / 2);
          sunPosRef.current.y = (-originScreenV.y + 1) * (elH / 2);
          
          if (worldPosRef.current) {
             // Tie physical star parallax natively to the orthographic point on the 3D solar grid
             worldPosRef.current.x = -camera.position.x * 24.0;
             worldPosRef.current.y = -camera.position.z * 24.0;
          }
      }

      // Position the master Orbits Group directly locking to 3D Origin natively (0,0,0)
      if ((scene as any).userData.mapGroup) {
          const mGrp = (scene as any).userData.mapGroup;
          mGrp.visible = true; // Always visible seamlessly!
      }

      // Update Native WebGL Planet Objects
      if (needsOrbitRebuildRef.current || !dynamicPaddedScalesRef.current) {
          dynamicPaddedScalesRef.current = getPaddedOrbitalDistances();
          needsOrbitRebuildRef.current = false;
      }
      const dynamicPaddedScales = dynamicPaddedScalesRef.current;

      // Handle dynamic geometry resolution updates using a single shared VBO
      const targetRes = planetPrefsRef.current.planetResolution || 32;
      if ((scene as any).userData.currentPlanetResolution !== targetRes) {
          if ((scene as any).userData.sharedPlanetGeo) {
              (scene as any).userData.sharedPlanetGeo.dispose();
          }
          const newSharedGeo = new THREE.CircleGeometry(1, targetRes);
          (scene as any).userData.sharedPlanetGeo = newSharedGeo;
          (scene as any).userData.currentPlanetResolution = targetRes;

          // Apply instantly to all currently active non-vector planets
          solarBodies.forEach((sbConfig: any) => {
              const mesh = (scene as any).userData.planetMeshes?.[sbConfig.name];
              if (mesh && mesh.geometry.type !== 'PlaneGeometry') {
                  mesh.geometry = newSharedGeo;
              }
          });
      }

      solarBodies.forEach((sbConfig: any) => {
         const mesh = (scene as any).userData.planetMeshes?.[sbConfig.name];
         if (!mesh) return;
         
         // Dynamically inject Vector Planet custom textures natively into the mesh
         const tex = vectorTexturesRef.current[sbConfig.name.toUpperCase()];
         const glowTex = vectorGlowTexturesRef.current[sbConfig.name.toUpperCase()];
         const mat = mesh.material as THREE.MeshBasicMaterial;

         const isPlaneGeo = mesh.geometry.type === 'PlaneGeometry';
         const pRadius = Math.pow((sbConfig.r || 60), planetPrefsRef.current.radiusCurve) * 0.35;
         
         if (isPlaneGeo) {
             // Do NOT dispose shared geometries
             mesh.geometry = (scene as any).userData.sharedPlanetGeo || new THREE.CircleGeometry(1, planetPrefsRef.current.planetResolution || 32);
         }
         
         const bAngle = sbConfig.baseAngle + (tNow * sbConfig.orbSpeed) / 16.67;
         let physR = dynamicPaddedScales[sbConfig.name] || 0;
         const physX = Math.cos(bAngle) * physR * planetPrefsRef.current.orbitScale;
         const physZ = Math.sin(bAngle) * physR * planetPrefsRef.current.orbitScale;
         
         mesh.position.set(physX, -2.0, physZ);
         
         if (sbConfig.name.toUpperCase() === 'SUN') {
             mesh.rotation.set(-Math.PI / 2, 0, 0); // Keep sun flat like all other planets
         }

         // --- DECUPLED PLANET SCALE INTERPOLATOR ---
         let mapTransitionT = Math.max(0, Math.min(1, (1.0 - currentCameraZoomRef.current) / (1.0 - 0.1)));

         const flightViewScale = pRadius * planetPrefsRef.current.planetBaseScale;
         const mapViewScale = (100.0 * planetPrefsRef.current.planetScale) / Math.max(0.000001, currentCameraZoomRef.current);
         const finalBlendedScale = (flightViewScale * (1.0 - mapTransitionT)) + (mapViewScale * mapTransitionT);

         // Unconditionally render the Core Texture or fallback to solid color
         const bakedTex = proceduralTexturesRef.current[sbConfig.name.toUpperCase()];
         mat.map = tex || bakedTex || null;
         if (tex || bakedTex) {
             mat.color.set(0xffffff);
         } else {
             mat.color.set(sbConfig.color || 0xcccccc);
         }
         mat.transparent = true;
         mat.opacity = 1.0; // Ensure opacity is forced to 1!
         mat.depthWrite = false;
         mat.needsUpdate = true;
         mesh.visible = true; // Always visible
         mesh.scale.setScalar(finalBlendedScale);

         // Unconditionally render the Glow Texture (Planet FX)
         const sunGlowMesh = mesh.userData.sunGlowMesh;
         if (sunGlowMesh) {
             const gMat = sunGlowMesh.material as THREE.MeshBasicMaterial;
             gMat.map = glowTex || null;
             gMat.transparent = true;
             gMat.opacity = 1.0; // Ensure glow opacity is 1
             gMat.blending = THREE.NormalBlending;
             gMat.needsUpdate = true;
             sunGlowMesh.visible = !!glowTex;
             sunGlowMesh.scale.setScalar(glowTex ? (glowTex.userData.glowScale || 1.0) : 1.0);
         }
         
         const orbitMesh = (scene as any).userData.orbitMeshes?.[sbConfig.name];
         if (orbitMesh) {
             orbitMesh.visible = mapTransitionT > 0.001 || paramsRef.current.showGrid;
             orbitMesh.scale.setScalar(physR * planetPrefsRef.current.orbitScale);
             (orbitMesh.material as THREE.LineBasicMaterial).opacity = planetPrefsRef.current.orbitOpacity * mapTransitionT;
         }
      });

      if (!(scene as any).userData.prevCamTarget) {
          (scene as any).userData.prevCamTarget = new THREE.Vector3();
      }
      (scene as any).userData.prevCamTarget.set(cameraTargetX, 0, cameraTargetZ);

      // Hover overlay mapping and Opacity interpolation
      const hoverRing = (scene as any).userData.hoverRingMesh;
      if (hoverRing) {
          const hoveredName = (scene as any).userData.hoveredPlanetName;
          const mat = hoverRing.material as THREE.LineBasicMaterial;
          if (hoveredName && showMapRef.current && hoveredName !== targetPlanetNameRef.current) {
              const tgtMesh = (scene as any).userData.planetMeshes?.[hoveredName];
              if (tgtMesh) {
                  hoverRing.position.copy(tgtMesh.position);
                  const pRadius = tgtMesh.geometry.parameters.radius || 1.0;
                  const dynamicRingScale = pRadius * tgtMesh.scale.x * 1.15;
                  hoverRing.scale.setScalar(dynamicRingScale);
                  hoverRing.visible = true;
                  mat.opacity += (0.6 - mat.opacity) * 0.2;
              }
          } else {
              mat.opacity += (0.0 - mat.opacity) * 0.2;
              if (mat.opacity <= 0.01) {
                  hoverRing.visible = false;
                  mat.opacity = 0;
              }
          }
      }

      // Planet DOM Labels mapping
      if (mountRef.current && cameraRef.current) {
          const rect = mountRef.current.getBoundingClientRect();
          const pMeshes = (scene as any).userData.planetMeshes || {};
          
          Object.entries(pMeshes).forEach(([pName, mesh]) => {
              // 1. Calculate Screen Space natively against ANY active camera
              const tgtMesh = mesh as THREE.Mesh;
              tgtMesh.updateMatrixWorld(true);
              MathCache.vec3.setFromMatrixPosition(tgtMesh.matrixWorld);
              MathCache.vec3.project(cameraRef.current!);
              
              if (MathCache.vec3.z > 1.0) {
                  // Planet is physically behind the camera's front-plane!
                  if (envTargetRefs.current[pName]) envTargetRefs.current[pName].current.r = 0;
                  const labelEl = planetLabelRefs.current[pName];
                  if (labelEl) labelEl.style.display = 'none';
                  return; // Strict cull
              }
              
              const screenX = (MathCache.vec3.x * 0.5 + 0.5) * rect.width;
              const screenY = -(MathCache.vec3.y * 0.5 - 0.5) * rect.height;
              
              let screenRadius = 0;
              if ((cameraRef.current as any).isOrthographicCamera) {
                  const orthHeight = 40.0 / Math.max(0.0001, currentCameraZoomRef.current);
                  screenRadius = ((mesh as THREE.Mesh).scale.x / orthHeight) * rect.height;
              } else {
                  // Flight Mode Perspective conversion math
                  const dist = cameraRef.current.position.distanceTo(mesh.position);
                  if (dist > 0) {
                      const fov = (cameraRef.current as THREE.PerspectiveCamera).fov * Math.PI / 180;
                      const heightAtDist = 2 * Math.tan(fov / 2) * dist;
                      screenRadius = ((mesh as THREE.Mesh).scale.x / heightAtDist) * rect.height;
                  }
              }
              
              // 2. Track screen coordinates globally for custom WebGL syncing overlays
              if (screenX >= -screenRadius && screenX <= rect.width + screenRadius && screenY >= -screenRadius && screenY <= rect.height + screenRadius) {
                  if (!envTargetRefs.current[pName]) {
                      envTargetRefs.current[pName] = { current: { x: screenX, y: screenY, r: screenRadius } };
                  } else {
                      envTargetRefs.current[pName].current.x = screenX;
                      envTargetRefs.current[pName].current.y = screenY;
                      envTargetRefs.current[pName].current.r = screenRadius;
                  }
              } else {
                  // Hide if significantly off bounds
                  if (envTargetRefs.current[pName]) envTargetRefs.current[pName].current.r = 0;
              }

              // 3. Planet DOM Labels mapping
              const labelEl = planetLabelRefs.current[pName];
              if (labelEl) {
                  if (showMapRef.current && screenX >= 0 && screenX <= rect.width && screenY >= 0 && screenY <= rect.height) {
                      labelEl.style.display = 'block';
                      labelEl.style.left = `${screenX}px`;
                      labelEl.style.top = `${screenY - screenRadius - (planetPrefsRef.current.labelOffsetY ?? 25)}px`;
                  } else {
                      labelEl.style.display = 'none';
                  }
              }
          });
      }

      // WebGL Selection & Waypoint Overlay
      const selRing = (scene as any).userData.selectionRingMesh;
      const wpLine = (scene as any).userData.waypointLineMesh;
      if (selRing && wpLine) {
         if (showMapRef.current && targetPlanetNameRef.current) {
            const tgtPlanet = solarBodies.find((p:any) => p.name === targetPlanetNameRef.current);
            const tgtMesh = (scene as any).userData.planetMeshes?.[targetPlanetNameRef.current];
            
            if (tgtPlanet && tgtMesh) {
                selRing.position.copy(tgtMesh.position);
                const pRadius = tgtMesh.geometry.parameters.radius || 1.0;
                const dynamicRingScale = pRadius * tgtMesh.scale.x * 1.15;
                selRing.scale.setScalar(dynamicRingScale);
                selRing.visible = false; // Hidden per user request upon selection
                
                const pts = wpLine.geometry.attributes.position.array;
                pts[0] = shipX;
                pts[1] = -1.0;
                pts[2] = shipZ;
                pts[3] = tgtMesh.position.x;
                pts[4] = -1.0;
                pts[5] = tgtMesh.position.z;
                wpLine.geometry.attributes.position.needsUpdate = true;
                wpLine.computeLineDistances();

                if (wpLine.material.dashOffset !== undefined) {
                    wpLine.material.dashOffset -= 0.1;
                }
                wpLine.visible = true;
            } else {
                selRing.visible = false;
                wpLine.visible = false;
            }
         } else {
             selRing.visible = false;
             wpLine.visible = false;
         }
      }

      // Auto Tour 3D Flight Path Overlay
      const autoTourLine = (scene as any).userData.autoTourLineMesh;
      if (autoTourLine) {
          if (showMapRef.current && paramsRef.current.autoTour && customTourWaypointsRef.current && customTourWaypointsRef.current.length > 0) {
              const wps = customTourWaypointsRef.current;
              const positions = autoTourLine.geometry.attributes.position.array;
              
              // Anchor visual flight path to physical ship location
              positions[0] = shipX;
              positions[1] = -1.5;
              positions[2] = shipZ;
              
              let drawCount = 1;
              // Chronologically link the path starting from current active node
              for (let i = 0; i < wps.length; i++) {
                 if (drawCount >= 199) break; // Array safety bound
                 const index = (tourTargetIdx + i) % wps.length;
                 const tgtMesh = (scene as any).userData.planetMeshes?.[wps[index].name];
                 if (tgtMesh) {
                     positions[drawCount * 3 + 0] = tgtMesh.position.x;
                     positions[drawCount * 3 + 1] = -1.5;
                     positions[drawCount * 3 + 2] = tgtMesh.position.z;
                     drawCount++;
                 }
              }
              
              // Draw return line back to start explicitly to visually close the loop
              if (wps.length > 1) {
                  const firstTgtMesh = (scene as any).userData.planetMeshes?.[wps[tourTargetIdx % wps.length].name];
                  if (firstTgtMesh) {
                      positions[drawCount * 3 + 0] = firstTgtMesh.position.x;
                      positions[drawCount * 3 + 1] = -1.5;
                      positions[drawCount * 3 + 2] = firstTgtMesh.position.z;
                      drawCount++;
                  }
              }
              
              autoTourLine.geometry.setDrawRange(0, drawCount);
              autoTourLine.geometry.attributes.position.needsUpdate = true;
              autoTourLine.computeLineDistances();
              autoTourLine.visible = true;
          } else {
              autoTourLine.visible = false;
          }
      }

      // Native Synchronous HTML Map Marker Update tracking
      if (showMapRef.current && cameraRef.current) {
          const eW = el ? el.clientWidth : window.innerWidth;
          const eH = el ? el.clientHeight : window.innerHeight;
          
          if (mapShipMarkerRef.current) {
              const curX = cameraRef.current.position.x;
              const curZ = cameraRef.current.position.z;

              const shipV = MathCache.vec1.set(shipX, 0, shipZ);
              shipV.project(cameraRef.current);
              
              const sx = (shipV.x + 1) * (eW / 2);
              const sy = (-shipV.y + 1) * (eH / 2);
              const shipRotDeg = (heading * 180 / Math.PI) - 90;
              
              // Gracefully fade in the player tracker over the first half second to fulfill "hide on initial load"
              mapTrackerOpacity = Math.min(1.0, mapTrackerOpacity + (delta * 1.5));
              
              mapShipMarkerRef.current.style.opacity = `${mapTrackerOpacity}`;
              mapShipMarkerRef.current.style.transform = `translate(${sx}px, ${sy}px)`;
              mapShipMarkerRef.current.style.display = "block";
              
              const pArrow = mapPlayerArrowRef.current;
              if (pArrow) pArrow.style.transform = `translate(-50%, -50%) rotate(${shipRotDeg}deg) translateX(16px)`;
          }
          // Render drones natively in DOM so they bypass the map's WebGL cull
          const dkeys = Object.keys(drones).filter(id => renderIds.includes(id));
          // Render infinite wingmen map arrows perfectly organically
          dkeys.forEach((did, idx) => {
              const mk = wingmanMarkerRefs.current[idx];
              if (!mk || !drones[did]) return;
              const dV = MathCache.vec2.set(drones[did].x, 0, drones[did].z);
              dV.project(cameraRef.current!);
              const sx = (dV.x + 1) * (eW / 2);
              const sy = (-dV.y + 1) * (eH / 2);
              const dRotDeg = (drones[did].heading * 180 / Math.PI) - 90;
              mk.style.transform = `translate(${sx}px, ${sy}px)`;
              mk.style.display = "block";
              
              const dArrow = wingmanArrowRefs.current[idx];
              if (dArrow) dArrow.style.transform = `translate(-50%, -50%) rotate(${dRotDeg}deg) translateX(14px)`;
          });
          
          // Hide any excess markers seamlessly without ref limits
          for (let idx = dkeys.length; idx < wingmanMarkerRefs.current.length; idx++) {
              const mk = wingmanMarkerRefs.current[idx];
              if (mk) mk.style.display = "none";
          }
          
      } else {
          if (mapShipMarkerRef.current) mapShipMarkerRef.current.style.display = "none";
          // Hide dynamic DOM markers gracefully up to max possible wingmen threshold
          wingmanMarkerRefs.current.forEach(mk => {
              if (mk) mk.style.display = "none";
          });
          mapTrackerOpacity = 0.0; // Reset fade tracker so it hides natively on next load
      }

      // --- Star Layers Dynamic Uniform Updates ---
      // === PARALLAX THE STAR LABELS + UPDATE BACKGROUND SHADERS ===
      if ((scene as any).userData.starLayers) {
          const sl = (scene as any).userData.starLayers;
          // Merge cinematic params with planet prefs so Tour Racing can natively override star layers!
          const currentPrefs = { ...planetPrefsRef.current, ...paramsRef.current };
          
          const updateLayer = (layer: any, prefix: string, defaults: any) => {
              if (!layer || !layer.material) return;
              const spd = Number(currentPrefs[`${prefix}StarSpeed`] ?? currentPrefs[`${prefix}ParticleSpeed`] ?? defaults.speed ?? 0.05);
              
              // Maintain accurate independent parallax offsets
              // using elapsed global time (nowTime * spd) internally, mapping flight velocity for true parallax
              layer.material.uniforms.uTime.value += delta * spd * 10.0;
              
              let par = Number(currentPrefs[`${prefix}ParallaxStrength`]);
              if (Number.isNaN(par)) par = 1.0;
              let depthLevel = Number(currentPrefs[`${prefix}CameraDistance`]);
              if (Number.isNaN(depthLevel)) depthLevel = defaults.yDepth ?? 20;
              layer.material.uniforms.uPerspectiveDepth.value = Math.abs(depthLevel);
              
              // To prevent the modulo wrapping math from tearing the stars apart during camera zooms,
              // we MUST NOT dynamically change the uSpread wrap boundary!
              // Instead, we use a fixed 1.5x bounding box based on the native 1.0 zoom level.
              // Since Cinematic mode only zooms out to 0.68x, the 1.5x bounding box natively covers the entire
              // screen at all times without ever needing to recalculate the GPU modulo!
              const orthoW = (window.innerWidth / 2 * 0.05);
              const orthoH = (window.innerHeight / 2 * 0.05);
              
              // Scale the visual bounding box based on the User's Depth Preference (shrinking or massive fields of density)
              const absDepth = Math.abs(depthLevel);
              const spreadX = orthoW * 1.5 * Math.max(0.1, absDepth / 20.0);
              const spreadY = orthoH * 1.5 * Math.max(0.1, absDepth / 20.0);
              layer.material.uniforms.uSpread.value.set(spreadX, spreadY);
              
              // The stars are now firmly attached to the camera as a 2D UI overlay.
              // To prevent the stars from sliding sideways or wobbling during elastic camera lag/drone sway,
              // we must scroll them strictly along the exact physical vector the ship is flying.
              // By projecting the ship's absolute 3D velocity onto the camera's local screen axes,
              // we get the exact visual direction the ship is moving on the monitor!
              // Substitute raw frame-rate dependent ship velocity with true physical camera displacement per frame!
              // This permanently resolves stuttering, eliminates frame-rate dependency, and allows stars to correctly pan when dragging in the Planetary Systems!
              MathCache.vec1.set(flightVelocityRef.current.x, 0, flightVelocityRef.current.y);
              MathCache.vec2.set(1, 0, 0).applyQuaternion(camera.quaternion); // Screen X (Right)
              MathCache.vec3.set(0, 1, 0).applyQuaternion(camera.quaternion); // Screen Y (Up)
              
              // Dot product gives the exact visual speed of the ship on the monitor screen
              const PARALLAX_SENSITIVITY = 50.0;
              const screenVx = MathCache.vec1.dot(MathCache.vec2) * PARALLAX_SENSITIVITY;
              const screenVy = MathCache.vec1.dot(MathCache.vec3) * PARALLAX_SENSITIVITY;

              // Scroll the 2D star canvas exactly opposite to the ship's visual flight path!
              // X axis is preserved, so subtract screenVx to scroll opposite.
              // Z axis was rotated 90deg to map to Screen -Y (Down). To scroll opposite (Down), we must ADD screenVy.
              layer.material.uniforms.uOffset.value.x -= screenVx * par;
              layer.material.uniforms.uOffset.value.y += screenVy * par;
              
              // NEW: Pass instantaneous displacement vector to fragment shader for Capsule SDF physical screen calibration!
              const sm = currentPrefs.streakMultiplier ?? 1.0;
              const tf = currentPrefs.streakTailFade ?? 0.8;
              layer.material.uniforms.uVelocity.value.set(-screenVx * par * sm, screenVy * par * sm).multiplyScalar(renderer.getPixelRatio());
              layer.material.uniforms.uTailFade.value = tf;
              
              let minS = Number(currentPrefs[`${prefix}StarMinSize`] ?? currentPrefs[`${prefix}ParticleMinSize`]);
              if (Number.isNaN(minS)) minS = (defaults.size ?? 10) * 0.5;
              let maxS = Number(currentPrefs[`${prefix}StarMaxSize`] ?? currentPrefs[`${prefix}ParticleMaxSize`]);
              if (Number.isNaN(maxS)) maxS = (defaults.size ?? 10) * 1.5;
              const derivedBaseSize = (minS + maxS) / 2;
              const derivedRandomness = derivedBaseSize > 0 ? (maxS - minS) / derivedBaseSize : 1;
              
              layer.material.uniforms.uBaseSize.value = derivedBaseSize * renderer.getPixelRatio();
              layer.material.uniforms.uSizeRandomness.value = derivedRandomness;
              const speedVar = Number(currentPrefs[`${prefix}SpeedVariation`]);
              layer.material.uniforms.uSpeedVariation.value = Number.isNaN(speedVar) ? 0.0 : speedVar;
              
              // Update count dynamically via setDrawRange
              const count = Number(currentPrefs[`${prefix}StarDensity`] ?? currentPrefs[`${prefix}ParticleCount`] ?? defaults.count);
              layer.geometry.setDrawRange(0, count);
              
              const isEnabled = currentPrefs[`${prefix}Enabled`] ?? true;
              layer.points.visible = !showMapRef.current && isEnabled;
              layer.material.uniforms.uOpacity.value = showMapRef.current ? 0 : Number(currentPrefs[`${prefix}StarOpacity`] ?? 1.0);
          };
          updateLayer(sl.bg, 'bg', sl.bg.defaults);
          updateLayer(sl.fx, 'fx', sl.fx.defaults);
          updateLayer(sl.fg, 'fg', sl.fg.defaults);

          // Update Asteroid Parallax
          if ((scene as any).userData.asteroidMat) {
              const mat = (scene as any).userData.asteroidMat;
              const currentPrefs = { ...planetPrefsRef.current, ...paramsRef.current };
              const spd = Number(currentPrefs['bgStarSpeed'] ?? 0.05);
              const par = Number(currentPrefs['bgParallaxStrength']) || 1.0;
              const PARALLAX_SENSITIVITY = 50.0;
              
              const screenVx = MathCache.vec1.dot(MathCache.vec2) * PARALLAX_SENSITIVITY;
              const screenVy = MathCache.vec1.dot(MathCache.vec3) * PARALLAX_SENSITIVITY;
              
              // Automatically pan based on continuous speed and parallax shift
              mat.map.offset.x -= (screenVx * par) * 0.0005;
              mat.map.offset.y -= (screenVy * par) * 0.0005;
              
              mat.opacity = showMapRef.current ? 0 : 0.8;
          }
      }
      // -------------------------------------------

      // Update speedometer safely without React re-renders
      const speedEl = document.getElementById('cosmic-speedometer-value');
      if (speedEl) {
          // Level 11 Solar System Scale: 1 Screen Width = 1 AU
          // Distance in AU per frame = speed / W_ref
          // Speed in AU per hour = (speed / W_ref) * 60 frames * 3600 seconds
          const W_ref = typeof window !== 'undefined' ? window.innerWidth : 1280;
          const speedAuPerHour = (speed / W_ref) * 216000;
          speedEl.innerText = speedAuPerHour.toFixed(1);
      }
      
      const totalKmEl = document.getElementById('cosmic-total-km-value');
      if (totalKmEl) {
          totalKmEl.innerText = sessionDistanceRef.current.toFixed(4);
      }

      (window as any)._arn_camera_x = camera.position.x;
      (window as any)._arn_camera_y = camera.position.y;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
      window.removeEventListener('resize',  onResize);
      document.removeEventListener('fullscreenchange', onResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);

    };
  }, []);

  useEffect(() => {
    if (!isDbLoaded) return;
    if (!planeModelRef.current) return;
    const ship = shipsRef.current.find(s => s.id === playerShipId);
    if (!ship) return;
    
    const pm = planeModelRef.current.material as THREE.MeshPhysicalMaterial;
    const texLoader = new THREE.TextureLoader((window as any).ARN_LOADING_MANAGER);
    texLoader.setCrossOrigin('anonymous');
    
    // Attempt graceful garbage collection
    const ct = planeModelRef.current.userData.currentTextures;
    if (ct && ct.map) ct.map.dispose();
    if (ct && ct.alphaMap) ct.alphaMap.dispose();
    if (ct && ct.bumpMap) ct.bumpMap.dispose();

    const applyTex = (tex: THREE.Texture) => {
      tex.center.set(0.5, 0.5);
      tex.rotation = 0;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.anisotropy = 16;
    };

       const colorTex = texLoader.load(ship.colorUrl, (tex) => {
         if (planeModelRef.current) {
            // Mitigate race condition where rapid clicking loads multiple textures asynchronously
            // Only map the footprint scaling and dimensions if THIS is still the active mesh texture
            const activeTex = planeModelRef.current.userData.currentTextures?.map;
            if (activeTex && activeTex !== colorTex) return;
            
            planeModelRef.current.userData.aspectX = tex.image.width / tex.image.height;
            planeModelRef.current.userData.imgW = tex.image.width;
            planeModelRef.current.userData.imgH = tex.image.height;
            planeModelRef.current.userData.baseRotation = (ship as any).rotation || 0;
            planeModelRef.current.userData.shipScale = 1.0 + (((ship as any).tier || 1) - 1) * 0.35;
         }
       });
       colorTex.colorSpace = THREE.SRGBColorSpace;
       applyTex(colorTex);
       
       let alphaTex = null;
       if (ship.alphaUrl) {
         alphaTex = texLoader.load(ship.alphaUrl);
         applyTex(alphaTex);
       }
       
       let bumpTex = null;
       if (ship.bumpUrl) {
         bumpTex = texLoader.load(ship.bumpUrl, (tex) => {
             // ensure loading bumps dynamically trigger
             if(planeModelRef.current) (planeModelRef.current.material as THREE.MeshPhysicalMaterial).needsUpdate = true;
         });
         applyTex(bumpTex);
       }
       
       let lightTex = null;
       if ((ship as any).lightUrl) {
         lightTex = texLoader.load((ship as any).lightUrl, (tex) => {
             if(planeModelRef.current) (planeModelRef.current.material as THREE.MeshPhysicalMaterial).needsUpdate = true;
         });
         applyTex(lightTex);
       }
       
       if (planeModelRef.current) {
           planeModelRef.current.userData.currentTextures = { map: colorTex, alphaMap: alphaTex, bumpMap: bumpTex, lightMap: lightTex };
           const pm = planeModelRef.current.material as THREE.MeshPhysicalMaterial;
           pm.map = colorTex;
           pm.alphaMap = alphaTex;
           pm.bumpMap = bumpTex;
           pm.needsUpdate = true;
       }
  }, [textureRefreshKey, playerShipId, isDbLoaded]);


  const vpSun = vectorPlanets.find((p: any) => p.targetNode && p.targetNode.toUpperCase() === 'SUN');
  const activeBgConfig = vpSun?.sunConfig || sunBgConfig;

  return (
    <>
    {/* ── GAME TYPOGRAPHY: Rubik is the single font for all game UI ── */}
    <style>{`
      .ui-overlay, .ui-overlay * {
        font-family: 'Rubik', sans-serif !important;
      }
      @keyframes gradientCycle {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes hueCycle {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `}</style>

    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100%', overflow: 'hidden', background: 'transparent' }}>


      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            
            {/* The authentic native splash screen */}
            <img 
                src="/assets/features/title_screen/cosmic_racers_title.png" 
                alt="Cosmic Racers" 
                onLoad={() => {
                    setIsImageLoaded(true);
                }}
                onTransitionEnd={(e) => {
                    if (e.propertyName === 'opacity' && isImageLoaded && onReady) {
                        onReady();
                    }
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    zIndex: -1,
                    opacity: isImageLoaded ? 1 : 0,
                    transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: isReady ? 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.3))' : 'none'
                }} 
            />

            {!isReady ? (
               <div style={{ width: '400px', height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '20px' }}>
                  <div style={{ width: `${Math.max(5, loadingProgress * 100)}%`, height: '100%', background: '#00e5ff', transition: 'width 0.2s ease', boxShadow: '0 0 10px #00e5ff' }} />
               </div>
            ) : (
               <div 
                  onClick={() => {
                      if (startAudioRef.current) startAudioRef.current();
                      isLoadingRef.current = false;
                  }}
                  style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 9999999,
                      cursor: 'pointer',
                      background: 'transparent'
                  }}
               />
            )}
        </div>
      )}
      {/* Main rendering container - forced pure black to eliminate any background color leaks */}
      <div ref={containerRef} style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 1s ease', width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000000' }}>
      
      {showDebug && (
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 9999999, background: 'rgba(80,0,120,0.9)', color: '#fff', padding: 15, fontFamily: 'monospace', borderRadius: 8, border: '2px solid #ff00ff', pointerEvents: 'auto', userSelect: 'text', width: 350, boxShadow: '0 0 30px rgba(255,0,255,0.4)' }}>
            <div style={{ color: '#ffb3ff', fontWeight: 'bold', marginBottom: 5 }}>FLIGHT ENGINE DEBUG</div>
            <div style={{ fontSize: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><strong>Status:</strong> <span style={{ color: debugConfigInfo.status === 'Success' ? '#4ade80' : '#ff4444' }}>{debugConfigInfo.status}</span></div>
                <div><strong>Config URL:</strong> {debugConfigInfo.configUrl}</div>
                <div><strong>Active ID:</strong> {debugConfigInfo.activeIdResolved}</div>
                <div><strong>Used Global State:</strong> {debugConfigInfo.usedGlobalShipbankState ? 'Yes' : 'No'}</div>
                <div><strong>Used Per-Ship State:</strong> {debugConfigInfo.usedPerShipState ? 'Yes' : 'No'}</div>
                <div><strong>Loaded Speed:</strong> {debugConfigInfo.loadedSpeed}</div>
                <pre style={{ marginTop: 8, color: '#e2e8f0', background: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflowY: 'auto' }}>{debugConfigInfo.message}</pre>
            </div>
        </div>
      )}

       {/* ── 2D NATIVE WEBGL MAP ENGINE (Previously DOM overlay) ── */}
       {/* Orbits and Planets are now drawn natively inside the WebGL context below */}
      {/* 2. SplashCursor Fluid Overlay (zIndex: 11 - Above WebGL, Beneath UI) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none', opacity: showMapRef.current ? 0 : 1, transition: 'opacity 0.2s' }}>
          <SplashCursor 
             canvasForwardRef={splashCanvasForwardRef}
             externalEmitsRef={splashEmitRef}
             cameraDeltaRef={splashCameraDeltaRef}
             PRESERVE_BUFFER={false}
             SPLAT_RADIUS={globalSplashConfig.splatRadius ?? 0.04}
             SPLAT_FORCE={globalSplashConfig.splatForce ?? 6000}
             DENSITY_DISSIPATION={globalSplashConfig.densityDissipation ?? 2.8}
             VELOCITY_DISSIPATION={globalSplashConfig.velocityDissipation ?? 0.9}
             CURL={globalSplashConfig.curl ?? 1}
             DYE_RESOLUTION={globalSplashConfig.dyeResolution ?? 1024}
             SIM_RESOLUTION={globalSplashConfig.simResolution ?? 128}
             PRESSURE={globalSplashConfig.pressure ?? 0.1}
             PRESSURE_ITERATIONS={globalSplashConfig.pressureIterations ?? 20}
          />
      </div>
      {/* DOM Letterboxes overlaying BOTH WebGL and SplashCursor */}
      <div ref={topLetterboxDomRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '0%', background: '#000', zIndex: 5000, pointerEvents: 'none' }} />
      <div ref={bottomLetterboxDomRef} style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '0%', background: '#000', zIndex: 5000, pointerEvents: 'none' }} />
      
      {/* Display Constraints Toolbar */}
      <div 
        className="ui-overlay"
        onPointerDown={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        style={{ position: 'absolute', top: 20, right: (isPlanetSystem || hidePreferences) ? 70 : 370, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 3000 }}
      >
        {/* Fullscreen Toggle */}
        <button 
          onClick={() => {
            const doc = document as any;
            const docEl = document.documentElement as any;
            
            const requestFullScreen = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            const exitFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

            if (!isFullscreen) {
              if (requestFullScreen) requestFullScreen.call(docEl).catch((err: any) => console.error("Fullscreen err:", err));
            } else {
              if (exitFullScreen) exitFullScreen.call(doc);
            }
          }}
          style={{
            display: hidePreferences ? 'none' : 'flex',
            background: 'rgba(10, 15, 30, 0.85)',
            border: '1px solid rgba(255, 136, 32, 0.3)',
            color: '#FF8820',
            width: 32, height: 32, padding: 0, borderRadius: 8, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 'bold'
          }}
          title="Toggle Fullscreen"
        >
          ⛶
        </button>

        {/* Grid Toggle */}
        <button 
          onClick={() => setParams(p => ({ ...p, showGrid: !p.showGrid }))}
          style={{
            display: hidePreferences ? 'none' : 'flex',
            background: params.showGrid ? 'rgba(56, 189, 248, 0.2)' : 'rgba(10, 15, 30, 0.85)',
            border: params.showGrid ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 136, 32, 0.3)',
            color: params.showGrid ? '#38bdf8' : '#FF8820',
            width: 32, height: 32, padding: 0, borderRadius: 8, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 'bold'
          }}
          title="Toggle Background Grid"
        >
          #
        </button>

        {/* Formation Target Rings Toggle */}
        <button 
          onClick={() => setParams(p => ({ ...p, showTargetRings: !(p as any).showTargetRings }))}
          style={{
            display: hidePreferences ? 'none' : 'flex',
            background: (params as any).showTargetRings ? 'rgba(56, 189, 248, 0.2)' : 'rgba(10, 15, 30, 0.85)',
            border: (params as any).showTargetRings ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 136, 32, 0.3)',
            color: (params as any).showTargetRings ? '#38bdf8' : '#FF8820',
            width: 32, height: 32, padding: 0, borderRadius: 8, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 'bold'
          }}
          title="Toggle AI Formation Targets"
        >
          ◎
        </button>


      </div>

      {/* 1. Deep Space CSS Gradient Layer (RESTORED FROM BACKUP) - ACTIVE */}
      <div style={{ 
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: flightGradientCfg 
            ? (flightGradientCfg.useCosmicCompass
                 ? `linear-gradient(${flightGradientCfg.angle}deg, #FF6D00, #FFD600, #64DD17, #00C853, #00BFA5, #00B8D4, #0091EA, #2962FF, #6200EA, #4A00A3, #6A1B9A, #AD1457, #C62828, #DD2C00, #FFAB00, #FF6D00, #FFD600), linear-gradient(${flightGradientCfg.angle}deg, ${flightGradientCfg.c1}, ${flightGradientCfg.c2}, ${flightGradientCfg.c3})`
                 : `linear-gradient(${flightGradientCfg.angle}deg, ${flightGradientCfg.c1}, ${flightGradientCfg.c2}, ${flightGradientCfg.c3})`)
            : `linear-gradient(${activeBgConfig.bgAngle}deg, ${activeBgConfig.bgC1} 0%, ${activeBgConfig.bgC2} 50%, ${activeBgConfig.bgC3} 100%)`,
          backgroundSize: flightGradientCfg ? (flightGradientCfg.useCosmicCompass ? '1500% 1500%, 400% 400%' : '400% 400%') : '100% 100%',
          backgroundBlendMode: flightGradientCfg ? (flightGradientCfg.useCosmicCompass ? 'overlay' : 'normal') : 'normal',
          animation: flightGradientCfg ? `gradientCycle ${flightGradientCfg.speed}s ease infinite${(flightGradientCfg.cycleColors && !flightGradientCfg.useCosmicCompass) ? `, hueCycle ${flightGradientCfg.speed}s linear infinite` : ''}` : 'none',
          opacity: flightGradientCfg ? 1.0 : activeBgConfig.bgAlpha,
          pointerEvents: 'none'
      }} />
      {/* -------------------------------------------------------- */}

      {/* ELECTRIC BLUE TEST BACKGROUND - COMMENTED OUT */}
      {/*
      <div style={{ 
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(135deg, #0a0f2c 0%, #0044ff 100%)',
          pointerEvents: 'none'
      }} />
      */}

      {/* TEMPORARY AQUA BLUE BACKGROUND - REPLACED WITH VECTOR SUN */}
      {/*
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <SunEnvironment 
          config={sunBgConfig}
          animated={true}
          panEnabled={false}
          zoomEnabled={false}
          worldPosRef={worldPosRef}
          mapPanRef={mapPanRef}
          mapZoomRef={mapZoomRef}
        />
      </div>
      */}


      {/* 4. Asteroid Command Solar Orb (Foreground Background) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: "none" }}>
      </div>

      {/* WebGL Canvas */}
      <div 
        ref={mountRef} 
        onPointerDown={isPlanetSystem ? onPointerDown : undefined}
        onPointerMove={isPlanetSystem ? onPointerMove : undefined}
        onPointerUp={isPlanetSystem ? onPointerUp : undefined}
        onPointerOut={isPlanetSystem ? onPointerUp : undefined}
        style={{ position: 'absolute', inset: 0, zIndex: 2 }} 
      />

      {/* FPS Counter */}
      <div 
        className="ui-overlay"
        ref={fpsRef} 
        style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 20, 
          zIndex: 200, background: 'transparent', 
          border: 'none', color: 'rgba(255,255,255,0.35)', 
          padding: '6px 12px', borderRadius: 8, fontFamily: '"Rubik", monospace', 
          fontWeight: 'bold', pointerEvents: 'none', textAlign: 'center',
          fontSize: 11, letterSpacing: 1
        }}
      >
        60 FPS
      </div>



      {/* SPEEDOMETER & TOTAL KMS */}
      <div id="cosmic-speedometer-container" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 40, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 2, opacity: (isUiHidden || showMap || showNews) ? 0 : 1, transition: 'opacity 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span id="cosmic-speedometer-value" style={{ fontFamily: '"Rubik", sans-serif', fontSize: 64, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>0</span>
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: 18, color: '#00e5ff', fontWeight: 300, letterSpacing: 1 }}>AU/H</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, opacity: 0.8 }}>
              <span id="cosmic-total-km-value" style={{ fontFamily: '"Rubik", sans-serif', fontSize: 24, fontWeight: 300, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>0</span>
              <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: 12, color: '#00e5ff', fontWeight: 300, letterSpacing: 1 }}>AU</span>
          </div>
      </div>

      {/* Hangar Sidebar */}
      {!isPlanetSystem && (
      <>
      {/* Click-outside backdrop — closes hangar when user clicks anywhere outside */}
      {!leftMinimized && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 4989, pointerEvents: 'auto' }}
          onClick={() => { setLeftMinimized(true); setHangarInteractive(false); }}
        />
      )}
      <div className="ui-overlay" style={{ 
        position: 'absolute', top: 20, left: leftMinimized ? -380 : 20, 
        width: 340, height: 'calc(100vh - 40px)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.35s', zIndex: 4990,
        display: 'flex', flexDirection: 'column',
        pointerEvents: hangarInteractive ? 'auto' : 'none',
        visibility: leftMinimized ? 'hidden' : 'visible',
        borderRadius: 12
      }}>
        <div style={{ display: 'flex', gap: 8, padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
           <button onClick={() => setHangarTab('ships')} style={{ flex: 1, padding: '10px 16px', border: '1px solid ' + (hangarTab === 'ships' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'), background: hangarTab === 'ships' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)', color: hangarTab === 'ships' ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Rubik", sans-serif', letterSpacing: 1, fontSize: 13, borderRadius: 8, backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>SHIPS</button>
           <button onClick={() => setHangarTab('formations')} style={{ flex: 1, padding: '10px 16px', border: '1px solid ' + (hangarTab === 'formations' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'), background: hangarTab === 'formations' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)', color: hangarTab === 'formations' ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Rubik", sans-serif', letterSpacing: 1, fontSize: 13, borderRadius: 8, backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>FORMATIONS</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {progressionModeEnabled && hangarTab === 'ships' && <ProgressionProgressBar />}

          {/* Re-calculate lock states using hangarTick to ensure UI updates during flight */}
          {hangarTick !== undefined && hangarTab === 'ships' && (
              progressionShipOrder.map(id => SHIPS.find(s => s.id === id)).filter(Boolean)
          ).map((ship: any, shipIdx) => {
                const isSpawned = spawnedShipIds.includes(ship.id);
                const isFocused = focusedShipId === ship.id;
                const isLead = shipIdx === 0; // First ship is always the lead — permanently locked
                
                let isLocked = false;
                let unlockAu = 0;
                let shipProgress = 0;
                let prevUnlockAu = 0;
                if (!isLead) {
                    // Base requirement: 267 AU scale (Golden Ratio geometry) for 5-day loop
                    // Scale: 1.618 pure golden ratio power curve
                    unlockAu = 267 * Math.pow(1.618, shipIdx);
                    if (sessionDistanceRef.current < unlockAu) {
                        isLocked = true;
                        const prevUnlockAu = shipIdx === 1 ? 0 : 267 * Math.pow(1.618, shipIdx - 1);
                        shipProgress = Math.max(0, Math.min(1, (sessionDistanceRef.current - prevUnlockAu) / (unlockAu - prevUnlockAu)));
                    }
                }
                
                return (
              <div 
                key={ship.id} 
                onClick={(e) => {
                  // Lead ship is always spawned — allow clicking to refocus camera on it
                  // Toggle dot remains locked; only card click (camera focus) is allowed
                  if (isSpawned || isLead) {
                    handleShipChange(ship.id);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  cursor: (isSpawned || isLead) ? 'pointer' : 'default',
                  background: isFocused
                    ? 'rgba(0, 0, 0, 0.75)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isFocused
                    ? '1px solid rgba(255,255,255,0.4)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, transition: 'all 0.2s ease',
                  opacity: isSpawned ? 1.0 : (isLocked ? 0.45 : 0.7)
                }}
              >
                {/* Ship thumbnail */}
                <div style={{ width: 64, height: 64, background: 'transparent', borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative', border: 'none' }}>
                  <img src={ship.colorUrl} alt={ship.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: ship.rotation ? `rotate(${ship.rotation}deg)` : 'none' }} crossOrigin="anonymous" />
                </div>

                {/* Ship info */}
                <div style={{ color: isFocused ? '#fff' : (isLocked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)'), fontWeight: isFocused ? 'bold' : 'normal', fontSize: 16, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ship.name}</div>
                      {isSpawned && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: isFocused ? 1 : 0.5 }} onClick={(e) => e.stopPropagation()}>
                              <input
                                  type="color"
                                  value={shipFxColorOverrideRef.current[ship.id] || '#00e5ff'}
                                  onChange={(e) => {
                                      const newColor = e.target.value;
                                      shipFxColorOverrideRef.current = { ...shipFxColorOverrideRef.current, [ship.id]: newColor };
                                      window.dispatchEvent(new CustomEvent('arn_ship_fx_color', { detail: { shipId: ship.id, color: newColor } }));
                                  }}
                                  style={{ width: 24, height: 24, padding: 0, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
                                  title="Ship FX Color"
                              />
                          </div>
                      )}
                  </div>
                  {isLead && <div style={{ fontSize: 11, color: '#FF8820', textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Lead Ship</div>}
                  {!isLead && isSpawned && !isLocked && <div style={{ fontSize: 12, color: '#4ade80' }}>● In Fleet</div>}
                  {isLocked && (() => {
                      const remainingAu = unlockAu - sessionDistanceRef.current;
                      const remainingHours = remainingAu / 18.0; // 18 AU/hour means 432 AU takes exactly 24 hours
                      const totalH = Math.floor(remainingHours);
                      const m = Math.floor((remainingHours - totalH) * 60);
                      const s = Math.floor((((remainingHours - totalH) * 60) - m) * 60);
                      const d = Math.floor(totalH / 24);
                      const h = totalH % 24;
                      let timeString = '';
                      if (d > 0) {
                          timeString = `${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M`;
                      } else if (h > 0) {
                          timeString = `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M`;
                      } else {
                          timeString = `${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
                      }
                      return (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 24, color: shipProgress > 0 ? '#FF8820' : '#666', fontWeight: 'bold', lineHeight: 1, fontFamily: '"Rubik", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                              {timeString}
                          </div>
                          <div style={{ fontSize: 13, color: '#cbd5e1', letterSpacing: 1, fontFamily: 'monospace' }}>
                              {sessionDistanceRef.current.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / {unlockAu.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} AU
                          </div>
                          <div style={{ width: '100%', height: 8, background: '#111', borderRadius: 4, overflow: 'hidden', marginTop: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ width: `${shipProgress > 0 ? Math.pow(shipProgress, 0.3) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #FF8820, #ff4444)' }} />
                          </div>
                      </div>
                      );
                  })()}
                </div>

                {/* Spawn toggle — locked for lead ship */}
                {isLead ? (
                  <div
                    title="Lead ship is always active"
                    style={{
                      width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'rgba(255,136,32,0.5)', marginRight: 4
                    }}
                  >
                    🔒
                  </div>
                ) : isLocked ? (
                  <div
                    title={`Unlocks at ${unlockAu.toFixed(1)} AU`}
                    style={{
                      width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: 'rgba(239,68,68,0.5)', marginRight: 4
                    }}
                  >
                    🔒
                  </div>
                ) : (
                  <div 
                     onClick={(e) => {
                        e.stopPropagation();
                        setSpawnedShipIds(prev => prev.includes(ship.id) ? prev.filter(id => id !== ship.id) : [...prev, ship.id]);
                     }}
                     title={isSpawned ? 'Remove from fleet' : 'Add to fleet'}
                     style={{ 
                       width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                       border: isSpawned ? '2px solid #FF8820' : '2px solid #555',
                       background: isSpawned ? '#FF8820' : 'transparent',
                       marginRight: 4, cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {isSpawned && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#000' }} />}
                  </div>
                )}
              </div>
            );
          })}

          {hangarTab === 'formations' && (
            <>
            {[
              { id: 'V_FORMATION', title: 'MIGRATING DUCKS', desc: 'Standard V-Formation Wingman Flank', color: '#00ffff' },
              { id: 'DIAMOND_FORMATION', title: 'DIAMOND ESCORT', desc: 'Condensed 360° defensive perimeter', color: '#FF8820' },
              { id: 'WALL_FORMATION', title: 'IRON WALL', desc: 'Wide lateral engagement line', color: '#a855f7' },
              { id: 'ECHELON_RIGHT', title: 'ECHELON RIGHT', desc: 'Staggered starboard flank', color: '#ff4444' },
              { id: 'ECHELON_LEFT', title: 'ECHELON LEFT', desc: 'Staggered port flank', color: '#44ff44' },
              { id: 'ARROWHEAD_FORMATION', title: 'SPEARHEAD VANGUARD', desc: 'Aggressive piercing wedge', color: '#ffdd00' },
              { id: 'TWIN_COLUMN', title: 'CONVOY PARALLEL', desc: 'Dual structural columns', color: '#0088ff' },
              { id: 'X_CROSS_FORMATION', title: 'X-WING CROSS', desc: 'Quadrant sector suppression', color: '#ff00ff' }
            ].map(card => {
               const isActive = activeFormationState === card.id;
               return (
                 <div 
                   key={card.id}
                   onClick={() => {
                       setActiveFormationState(card.id);
                       activeFormationRef.current = card.id;
                       localStorage.setItem('arn_ai_formation', card.id);
                   }}
                   style={{ 
                     padding: 16, background: isActive ? `${card.color}15` : 'rgba(0, 0, 0, 0.4)', 
                     border: isActive ? `1px solid ${card.color}` : '1px solid #333', 
                     borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
                     transition: 'all 0.2s ease', flexShrink: 0
                   }}
                 >
                   <div style={{ fontWeight: 900, color: isActive ? card.color : '#aaa', fontSize: 13 }}>{card.title}</div>
                   <div style={{ fontSize: 11, color: '#888' }}>{card.desc}</div>
                   
                   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: 40, marginTop: 10 }}>
                       {card.id === 'V_FORMATION' && (
                           <>
                              <div style={{ position: 'absolute', top: 20, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-30px, 0)' }} />
                              <div style={{ position: 'absolute', top: 10, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-15px, 0)' }} />
                              <div style={{ position: 'absolute', top: 0, left: '50%', width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', top: 10, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(7px, 0)' }} />
                              <div style={{ position: 'absolute', top: 20, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(22px, 0)' }} />
                           </>
                       )}
                       {card.id === 'DIAMOND_FORMATION' && (
                           <>
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-25px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 0, width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 40, width: 8, height: 8, borderRadius: '50%', background: '#444', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(17px, 0)' }} />
                           </>
                       )}
                       {card.id === 'WALL_FORMATION' && (
                           <>
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#555', transform: 'translate(-40px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(12px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 15, width: 8, height: 8, borderRadius: '50%', background: '#555', transform: 'translate(32px, 0)' }} />
                           </>
                       )}
                       {card.id === 'ECHELON_RIGHT' && (
                           <>
                              <div style={{ position: 'absolute', left: '50%', top: 0, width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-30px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 10, width: 8, height: 8, borderRadius: '50%', background: '#aaa', transform: 'translate(-15px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 20, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(0px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(15px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 40, width: 8, height: 8, borderRadius: '50%', background: '#444', transform: 'translate(30px, 0)' }} />
                           </>
                       )}
                       {card.id === 'ECHELON_LEFT' && (
                           <>
                              <div style={{ position: 'absolute', left: '50%', top: 0, width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(20px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 10, width: 8, height: 8, borderRadius: '50%', background: '#aaa', transform: 'translate(5px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 20, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-10px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 30, width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-25px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 40, width: 8, height: 8, borderRadius: '50%', background: '#444', transform: 'translate(-40px, 0)' }} />
                           </>
                       )}
                       {card.id === 'ARROWHEAD_FORMATION' && (
                           <>
                              <div style={{ position: 'absolute', top: 30, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', top: 15, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-10px, 0)' }} />
                              <div style={{ position: 'absolute', top: 0, left: '50%', width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', top: 15, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(2px, 0)' }} />
                              <div style={{ position: 'absolute', top: 30, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(12px, 0)' }} />
                           </>
                       )}
                       {card.id === 'TWIN_COLUMN' && (
                           <>
                              <div style={{ position: 'absolute', left: '50%', top: 0, width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-5px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 20, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 40, width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 20, width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(12px, 0)' }} />
                              <div style={{ position: 'absolute', left: '50%', top: 40, width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(12px, 0)' }} />
                           </>
                       )}
                       {card.id === 'X_CROSS_FORMATION' && (
                           <>
                              <div style={{ position: 'absolute', top: -10, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', top: -10, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#888', transform: 'translate(12px, 0)' }} />
                              <div style={{ position: 'absolute', top: 15, left: '50%', width: 10, height: 10, borderRadius: '50%', background: isActive ? card.color : '#aaa', transform: 'translate(-50%, 0)' }} />
                              <div style={{ position: 'absolute', top: 40, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(-20px, 0)' }} />
                              <div style={{ position: 'absolute', top: 40, left: '50%', width: 8, height: 8, borderRadius: '50%', background: '#666', transform: 'translate(12px, 0)' }} />
                           </>
                       )}
                   </div>
                 </div>
               );
            })}
            </>
          )}

        </div>
      </div>
      </>
      )}
      
      {leftMinimized && !isPlanetSystem && (
        <div 
          className="ui-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setHangarInteractive(false); // Block panel events during slide-in
            setLeftMinimized(false);
            // Re-enable pointer events only after the transition finishes (350ms)
            setTimeout(() => setHangarInteractive(true), 360);
          }}
          style={{ position: 'absolute', top: 20, left: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', borderRadius: 8, zIndex: 4990, fontSize: 12, fontWeight: 'bold', fontFamily: '"Rubik", sans-serif', letterSpacing: 1, backdropFilter: 'blur(10px)', pointerEvents: showMap ? 'none' : 'auto', display: activeTheme === 'website' ? 'none' : 'flex', alignItems: 'center', transition: 'all 0.5s ease', opacity: showMap ? 0 : 1 }}
        >
          HANGAR
        </div>
      )}
      {!leftMinimized && !isPlanetSystem && !hangarInteractive && (
        // Invisible blocker during slide-in to swallow stray clicks
        <div style={{ position: 'fixed', inset: 0, zIndex: 4995, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
      )}

      {/* Top Header - Removed per request */}
      <div style={{ display: 'none' }} />

      {/* Keyboard Hints (Bottom Center) */}
      {!isPlanetSystem && !hidePreferences && (
      <div className="ui-overlay" style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 18, alignItems: 'center',
        fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,160,60,0.7)',
        background: 'rgba(2,8,18,0.8)', border: '1px solid rgba(255,120,30,0.2)', borderRadius: 8,
        padding: '8px 22px', pointerEvents: 'none', userSelect: 'none',
      }}>
        <span>↑ W — Thrust</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>← → / A D — Turn + Bank</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>↓ S — Brake</span>
      </div>
      )}



      {/* Planet Systems Custom Map Interface */}
      {isPlanetSystem && (
      <div 
        className="ui-overlay"
        onPointerDown={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
      >
         <div style={{ display: 'flex', gap: 10 }}>
             <button 
                onClick={() => setShowPlanetPrefs(!showPlanetPrefs)}
                style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}
             >
                [⚙] Map Preferences
             </button>
             <button 
                onClick={() => window.open('/science/planet-editor', '_blank')}
                style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#a855f7', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}
             >
                [⌖] Planet Positions
             </button>
         </div>
         
         {showPlanetPrefs && (
            <div style={{ background: 'rgba(10, 15, 30, 0.85)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 8, padding: 15, width: 280, maxHeight: '60vh', overflowY: 'auto', color: '#ccc', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 5 }}>MAP CONTROLS</div>
               
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fleet Auto-Zoom Target</span><span style={{ color: '#38bdf8' }}>{planetPrefs.fleetClickZoom?.toFixed(1)}x</span></div>
                 <RangeWithArrows type="range" min="0.1" max="25.0" step="0.01" value={planetPrefs.fleetClickZoom || 2.5} onChange={e => setPlanetPrefs(p => ({ ...p, fleetClickZoom: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Zoom Tracking Speed</span><span style={{ color: '#38bdf8' }}>{planetPrefs.zoomSpeed.toFixed(4)}</span></div>
                 <RangeWithArrows type="range" min="0.001" max="0.100" step="0.001" value={planetPrefs.zoomSpeed} onChange={e => setPlanetPrefs(p => ({ ...p, zoomSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Zoom Tracking Inertia</span><span style={{ color: '#38bdf8' }}>{planetPrefs.zoomInertia.toFixed(3)}</span></div>
                 <RangeWithArrows type="range" min="0.01" max="1.0" step="0.01" value={planetPrefs.zoomInertia} onChange={e => setPlanetPrefs(p => ({ ...p, zoomInertia: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Map Entry Speed</span><span style={{ color: '#38bdf8' }}>{planetPrefs.mapOpenSpeed.toFixed(6)}</span></div>
                 <RangeWithArrows type="range" min="0.0001" max="0.5" step="0.0001" value={planetPrefs.mapOpenSpeed} onChange={e => setPlanetPrefs(p => ({ ...p, mapOpenSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Map Closing Speed</span><span style={{ color: '#38bdf8' }}>{planetPrefs.mapCloseSpeed.toFixed(5)}</span></div>
                 <RangeWithArrows type="range" min="0.00001" max="0.5" step="0.00001" value={planetPrefs.mapCloseSpeed} onChange={e => setPlanetPrefs(p => ({ ...p, mapCloseSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Map Entry Distance</span><span style={{ color: '#38bdf8' }}>{(1.0 / planetPrefs.mapOpenDistance).toFixed(0)}x</span></div>
                 <RangeWithArrows type="range" min="1.0" max="50000.0" step="5.0" value={1.0 / Math.max(0.00001, planetPrefs.mapOpenDistance)} onChange={e => {
                     const val = 1.0 / parseFloat(e.target.value);
                     setPlanetPrefs(p => ({ ...p, mapOpenDistance: val }));
                     if (showMapRef.current) mapZoomRef.current = val;
                 }} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Drag Panning Speed</span><span style={{ color: '#38bdf8' }}>{planetPrefs.dragSpeed.toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.1" max="5.0" step="0.01" value={planetPrefs.dragSpeed} onChange={e => setPlanetPrefs(p => ({ ...p, dragSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kinematic Pan Drift</span><span style={{ color: '#38bdf8' }}>{planetPrefs.inertia.toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.0" max="0.99" step="0.01" value={planetPrefs.inertia} onChange={e => setPlanetPrefs(p => ({ ...p, inertia: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Overall Map Density</span><span style={{ color: '#38bdf8' }}>{planetPrefs.panDensity.toFixed(3)}</span></div>
                 <RangeWithArrows type="range" min="0.001" max="0.30" step="0.005" value={planetPrefs.panDensity} onChange={e => setPlanetPrefs(p => ({ ...p, panDensity: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Planet HUD UI Scale</span><span style={{ color: '#38bdf8' }}>{planetPrefs.planetScale.toFixed(3)}</span></div>
                 <RangeWithArrows type="range" min="0.001" max="0.100" step="0.001" value={planetPrefs.planetScale} onChange={e => setPlanetPrefs(p => ({ ...p, planetScale: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Label Font Size</span><span style={{ color: '#38bdf8' }}>{planetPrefs.labelSize ?? 14}px</span></div>
                 <RangeWithArrows type="range" min="8" max="48" step="1" value={planetPrefs.labelSize ?? 14} onChange={e => setPlanetPrefs(p => ({ ...p, labelSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Label Vertical Offset</span><span style={{ color: '#38bdf8' }}>{planetPrefs.labelOffsetY ?? 25}px</span></div>
                 <RangeWithArrows type="range" min="-50" max="150" step="1" value={planetPrefs.labelOffsetY ?? 25} onChange={e => setPlanetPrefs(p => ({ ...p, labelOffsetY: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Planet True Geometry Scale</span><span style={{ color: '#5eead4' }}>{planetPrefs.planetBaseScale.toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.1" max="10.0" step="0.01" value={planetPrefs.planetBaseScale} onChange={e => setPlanetPrefs(p => ({ ...p, planetBaseScale: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Planet Geometry Resolution</span><span style={{ color: '#f472b6' }}>{planetPrefs.planetResolution} Sides</span></div>
                 <RangeWithArrows type="range" min="3" max="128" step="1" value={planetPrefs.planetResolution} onChange={e => setPlanetPrefs(p => ({ ...p, planetResolution: parseInt(e.target.value) }))} style={{ accentColor: '#f472b6' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orbit Trajectory Opacity</span><span style={{ color: '#38bdf8' }}>{planetPrefs.orbitOpacity.toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={planetPrefs.orbitOpacity} onChange={e => setPlanetPrefs(p => ({ ...p, orbitOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orbit Vector Stroke</span><span style={{ color: '#38bdf8' }}>{planetPrefs.orbitSize.toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="1.0" max="10.0" step="0.01" value={planetPrefs.orbitSize} onChange={e => setPlanetPrefs(p => ({ ...p, orbitSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orbit Layout Spacing</span><span style={{ color: '#38bdf8' }}>{planetPrefs.orbitScale.toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.1" max="50.0" step="0.01" value={planetPrefs.orbitScale} onChange={e => setPlanetPrefs(p => ({ ...p, orbitScale: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orbit Tracking Hex</span><span style={{ color: '#38bdf8' }}>{planetPrefs.orbitColor}</span></div>
                 <input type="color" value={planetPrefs.orbitColor} onChange={e => setPlanetPrefs(p => ({ ...p, orbitColor: e.target.value }))} style={{ width: '100%', height: 28, background: 'none', border: 'none' }} />
               </label>
               <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,136,32,0.2)', marginBottom: 8, marginTop: 8, color: '#FF8820', fontWeight: 'bold' }}>
                 MOTION BLUR OPTICS (SDF)
               </div>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Streak Size Multiplier</span><span style={{ color: '#38bdf8' }}>{planetPrefs.streakMultiplier?.toFixed(2)}x</span></div>
                 <RangeWithArrows type="range" min="0.0" max="5.0" step="0.01" value={planetPrefs.streakMultiplier ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, streakMultiplier: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Comet Tail Fade</span><span style={{ color: '#38bdf8' }}>{((planetPrefs.streakTailFade ?? 0.8) * 100).toFixed(0)}%</span></div>
                 <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={planetPrefs.streakTailFade ?? 0.8} onChange={e => setPlanetPrefs(p => ({ ...p, streakTailFade: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>

               <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,136,32,0.2)', marginBottom: 8, marginTop: 8, color: '#FF8820', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span>MIDDLEGROUND STARS (PARALLAX)</span>
                 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 'normal' }}>
                   <input type="checkbox" checked={planetPrefs.fxEnabled ?? true} onChange={e => setPlanetPrefs(p => ({ ...p, fxEnabled: e.target.checked }))} style={{ accentColor: '#FF8820' }} />
                   {planetPrefs.fxEnabled ?? true ? 'ON' : 'OFF'}
                 </label>
               </div>
               
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Density</span><span style={{ color: '#38bdf8' }}>{Math.floor(planetPrefs.fxParticleCount ?? 200)}</span></div>
                 <RangeWithArrows type="range" min="50" max="2500" step="10" value={planetPrefs.fxParticleCount ?? 200} onChange={e => setPlanetPrefs(p => ({ ...p, fxParticleCount: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Min Size</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxParticleMinSize ?? 1.0).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.1" max="50.0" step="0.01" value={planetPrefs.fxParticleMinSize ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, fxParticleMinSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Max Size</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxParticleMaxSize ?? 10.0).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.5" max="150.0" step="0.01" value={planetPrefs.fxParticleMaxSize ?? 10.0} onChange={e => setPlanetPrefs(p => ({ ...p, fxParticleMaxSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Global Opacity</span><span style={{ color: '#38bdf8' }}>{((planetPrefs.fxStarOpacity ?? 1.0) * 100).toFixed(0)}%</span></div>
                 <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={planetPrefs.fxStarOpacity ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, fxStarOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kinematic Speed</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxParticleSpeed ?? 0.1).toFixed(3)}</span></div>
                 <RangeWithArrows type="range" min="0.0" max="0.2" step="0.001" value={planetPrefs.fxParticleSpeed ?? 0.1} onChange={e => setPlanetPrefs(p => ({ ...p, fxParticleSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Parallax Sensitivity</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxParallaxStrength ?? 0.05).toFixed(5)}</span></div>
                 <RangeWithArrows type="range" min="0.0001" max="0.05" step="0.0001" value={planetPrefs.fxParallaxStrength ?? 0.05} onChange={e => setPlanetPrefs(p => ({ ...p, fxParallaxStrength: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Speed Variation</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxSpeedVariation ?? 0.0).toFixed(2)}</span></div>
                  <RangeWithArrows type="range" min="0.0" max="3.0" step="0.01" value={planetPrefs.fxSpeedVariation ?? 0.0} onChange={e => setPlanetPrefs(p => ({ ...p, fxSpeedVariation: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
                </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Depth Layer (Z)</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fxCameraDistance ?? 20).toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.01" max="250.0" step="0.01" value={planetPrefs.fxCameraDistance ?? 20} onChange={e => setPlanetPrefs(p => ({ ...p, fxCameraDistance: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>

               <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,136,32,0.2)', marginBottom: 8, marginTop: 8, color: '#FF8820', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span>FOREGROUND STARS (PARALLAX)</span>
                 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 'normal' }}>
                   <input type="checkbox" checked={planetPrefs.fgEnabled ?? true} onChange={e => setPlanetPrefs(p => ({ ...p, fgEnabled: e.target.checked }))} style={{ accentColor: '#FF8820' }} />
                   {planetPrefs.fgEnabled ?? true ? 'ON' : 'OFF'}
                 </label>
               </div>
               
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Density</span><span style={{ color: '#38bdf8' }}>{Math.floor(planetPrefs.fgParticleCount ?? 100)}</span></div>
                 <RangeWithArrows type="range" min="10" max="1000" step="5" value={planetPrefs.fgParticleCount ?? 100} onChange={e => setPlanetPrefs(p => ({ ...p, fgParticleCount: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Min Size</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgParticleMinSize ?? 5.0).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.1" max="100.0" step="0.01" value={planetPrefs.fgParticleMinSize ?? 5.0} onChange={e => setPlanetPrefs(p => ({ ...p, fgParticleMinSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Max Size</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgParticleMaxSize ?? 20.0).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.5" max="500.0" step="0.01" value={planetPrefs.fgParticleMaxSize ?? 20.0} onChange={e => setPlanetPrefs(p => ({ ...p, fgParticleMaxSize: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Global Opacity</span><span style={{ color: '#38bdf8' }}>{((planetPrefs.fgStarOpacity ?? 1.0) * 100).toFixed(0)}%</span></div>
                 <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={planetPrefs.fgStarOpacity ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, fgStarOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Kinematic Speed</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgParticleSpeed ?? 0.15).toFixed(3)}</span></div>
                 <RangeWithArrows type="range" min="0.0" max="0.5" step="0.005" value={planetPrefs.fgParticleSpeed ?? 0.15} onChange={e => setPlanetPrefs(p => ({ ...p, fgParticleSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Parallax Sensitivity</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgParallaxStrength ?? 0.1).toFixed(6)}</span></div>
                 <RangeWithArrows type="range" min="0.000001" max="0.02" step="0.0001" value={planetPrefs.fgParallaxStrength ?? 0.1} onChange={e => setPlanetPrefs(p => ({ ...p, fgParallaxStrength: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Speed Variation</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgSpeedVariation ?? 0.0).toFixed(2)}</span></div>
                  <RangeWithArrows type="range" min="0.0" max="3.0" step="0.01" value={planetPrefs.fgSpeedVariation ?? 0.0} onChange={e => setPlanetPrefs(p => ({ ...p, fgSpeedVariation: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
                </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Depth Layer (Z)</span><span style={{ color: '#38bdf8' }}>{(planetPrefs.fgCameraDistance ?? 10).toFixed(4)}</span></div>
                 <RangeWithArrows type="range" min="0.0001" max="20.0" step="0.0001" value={planetPrefs.fgCameraDistance ?? 10} onChange={e => setPlanetPrefs(p => ({ ...p, fgCameraDistance: parseFloat(e.target.value) }))} style={{ accentColor: '#38bdf8' }} />
               </label>

               <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,136,32,0.2)', marginBottom: 8, marginTop: 8, color: '#FF8820', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span>INFINITE BACKGROUND STARS (NATIVE)</span>
                 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 'normal' }}>
                   <input type="checkbox" checked={planetPrefs.bgEnabled ?? true} onChange={e => setPlanetPrefs(p => ({ ...p, bgEnabled: e.target.checked }))} style={{ accentColor: '#FF8820' }} />
                   {planetPrefs.bgEnabled ?? true ? 'ON' : 'OFF'}
                 </label>
               </div>

               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Background Density</span><span style={{ color: '#5eead4' }}>{Math.floor(planetPrefs.bgStarDensity ?? 5000)}</span></div>
                 <RangeWithArrows type="range" min="1000" max="10000" step="100" value={planetPrefs.bgStarDensity ?? 5000} onChange={e => setPlanetPrefs(p => ({ ...p, bgStarDensity: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Min Size</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgStarMinSize ?? 0.5).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.1" max="25.0" step="0.01" value={planetPrefs.bgStarMinSize ?? 0.5} onChange={e => setPlanetPrefs(p => ({ ...p, bgStarMinSize: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Star Max Size</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgStarMaxSize ?? 2.0).toFixed(1)}px</span></div>
                 <RangeWithArrows type="range" min="0.5" max="50.0" step="0.01" value={planetPrefs.bgStarMaxSize ?? 2.0} onChange={e => setPlanetPrefs(p => ({ ...p, bgStarMaxSize: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Global Opacity</span><span style={{ color: '#5eead4' }}>{((planetPrefs.bgStarOpacity ?? 1.0) * 100).toFixed(0)}%</span></div>
                 <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={planetPrefs.bgStarOpacity ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, bgStarOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orbital Drift Speed</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgStarSpeed ?? 0.05).toFixed(4)}</span></div>
                 <RangeWithArrows type="range" min="0.00" max="0.05" step="0.0005" value={planetPrefs.bgStarSpeed ?? 0.05} onChange={e => setPlanetPrefs(p => ({ ...p, bgStarSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Speed Variation</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgSpeedVariation ?? 0.0).toFixed(2)}</span></div>
                  <RangeWithArrows type="range" min="0.0" max="3.0" step="0.01" value={planetPrefs.bgSpeedVariation ?? 0.0} onChange={e => setPlanetPrefs(p => ({ ...p, bgSpeedVariation: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
                </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Parallax Sensitivity</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgParallaxStrength ?? 0.01).toFixed(5)}</span></div>
                 <RangeWithArrows type="range" min="0.00001" max="0.02" step="0.00001" value={planetPrefs.bgParallaxStrength ?? 0.01} onChange={e => setPlanetPrefs(p => ({ ...p, bgParallaxStrength: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Depth Layer (Z)</span><span style={{ color: '#5eead4' }}>{(planetPrefs.bgCameraDistance ?? 100).toFixed(2)}</span></div>
                 <RangeWithArrows type="range" min="0.1" max="1000.0" step="0.01" value={planetPrefs.bgCameraDistance ?? 100} onChange={e => setPlanetPrefs(p => ({ ...p, bgCameraDistance: parseFloat(e.target.value) }))} style={{ accentColor: '#5eead4' }} />
               </label>
               
               <button 
                 onClick={() => {
                   setMapSaveState('saving');
                   localStorage.setItem('arn_planet_prefs_state', JSON.stringify(planetPrefs));
                   fetch('/api/game-assets/config/', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ planet_prefs_state: planetPrefs }) 
                   }).then(() => {
                      setMapSaveState('saved');
                      setTimeout(() => setMapSaveState('idle'), 2000);
                   }).catch(()=>{
                      setMapSaveState('idle'); 
                   });
                 }}
                 style={{ 
                   marginTop: 10, width: '100%', background: mapSaveState === 'saved' ? '#4ade80' : '#FF8820',
                   color: '#020812', border: 'none', padding: '6px', borderRadius: 4, fontFamily: 'monospace', 
                   fontSize: 10, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase'
                 }}>
                 {mapSaveState === 'saving' ? 'UPLOADING...' : mapSaveState === 'saved' ? 'SYNCED ✓' : 'SAVE TO DATABASE'}
               </button>
            </div>
         )}
      </div>
      )}

      {/* Control Panel (Top Right) */}
      {activeTheme === 'game' && !isPlanetSystem && !hidePreferences && (
      <div 
        className="ui-overlay"
        onPointerDown={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 999999,
          background: 'rgba(2,8,18,0.85)', border: '1px solid rgba(255,120,30,0.3)', borderRadius: 8,
          color: '#ccc', fontFamily: 'monospace', fontSize: 12,
          width: 280, maxHeight: 'calc(100% - 40px)', overflowY: isParamsMinimized ? 'hidden' : 'auto',
          display: 'block'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <button onClick={() => setIsParamsMinimized(!isParamsMinimized)}
             style={{ background: 'transparent', color: '#FF8820', border: '1px solid #FF8820', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 10 }}>
             {isParamsMinimized ? '[+] Expand' : '[-] Minimize'}
          </button>
          <button 
            onMouseEnter={() => setIsSaveHovered(true)}
            onMouseLeave={() => setIsSaveHovered(false)}
            onClick={() => {
              if (saveState === 'saving') return;
              setSaveState('saving');
              
              const currentId = focusedShipIdRef.current || playerShipIdRef?.current;
              const bodyPayload = configNamespace 
                  ? { [configNamespace]: params }
                  : { shipbank_state: params, shipbank_state_per_ship: { [currentId]: params }, lastEditedShip: currentId };
                  
              if (!configNamespace) {
                  localStorage.setItem('arn_shipbank_state', JSON.stringify(params));
              }
              
              fetch('/api/game-assets/config/', { 
                 method: 'POST', 
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(bodyPayload) 
              }).then(async (res) => {
                 if (!res.ok) throw new Error('Save failed');
                 const responseData = await res.json();
                 setSaveState('saved');
                 setDebugConfigInfo((prev: any) => ({
                    ...prev,
                    message: `Saved: ${JSON.stringify(responseData.filesWritten)}\nPayload: ${JSON.stringify(responseData.savedPayload)}`
                 }));
                 setTimeout(() => setSaveState('idle'), 2000);
              }).catch(()=>{
                 setSaveState('error'); 
                 setDebugConfigInfo((prev: any) => ({ ...prev, message: `Save Error!` }));
                 setTimeout(() => setSaveState('idle'), 3000);
              });
            }}
            style={{ 
              background: saveState === 'saved' ? '#4ade80' : isSaveHovered ? '#ff9b44' : '#FF8820',
              color: '#020812', border: 'none', 
              padding: '4px 10px', borderRadius: 4, fontFamily: 'monospace', 
              fontSize: 10, fontWeight: 'bold', cursor: 'pointer',
              boxShadow: saveState === 'saved' ? '0 0 10px rgba(74,222,128,0.4)' : saveState === 'error' ? '0 0 10px rgba(255,0,0,0.6)' : isSaveHovered ? '0 0 15px rgba(255,136,32,0.6)' : '0 0 10px rgba(255,136,32,0.4)', 
              textTransform: 'uppercase', transition: 'all 0.2s ease'
            }}>
            {saveState === 'saving' ? 'SAVING...' : saveState === 'saved' ? 'SAVED ✓' : saveState === 'error' ? 'ERROR!' : 'SAVE SETTINGS'}
          </button>
        </div>

        {!isParamsMinimized && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <button key="autopilot" 
                  onClick={() => {
                      setParams(p => ({ ...p, autoPilot: !p.autoPilot, cruiseMode: false, autoTour: false }));
                      setTargetPlanetName(null);
                      targetPlanetNameRef.current = null;
                      isMapAutopilotActiveRef.current = false;
                  }}
                  style={{
                    flex: 1,
                    background: params.autoPilot ? 'rgba(255, 50, 50, 0.2)' : 'rgba(2,8,18,0.8)',
                    color: params.autoPilot ? '#ff6666' : '#995555',
                    border: '1px solid ' + (params.autoPilot ? '#ff6666' : 'rgba(200,80,80,0.3)'),
                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  Looping
                </button>
                <button key="cruisemode" 
                  onClick={() => {
                      setParams(p => ({ ...p, cruiseMode: !p.cruiseMode, autoPilot: false, autoTour: false }));
                      setTargetPlanetName(null);
                      targetPlanetNameRef.current = null;
                      isMapAutopilotActiveRef.current = false;
                  }}
                  style={{
                    flex: 1,
                    background: params.cruiseMode ? 'rgba(50, 255, 100, 0.2)' : 'rgba(2,8,18,0.8)',
                    color: params.cruiseMode ? '#66ff99' : '#559966',
                    border: '1px solid ' + (params.cruiseMode ? '#66ff99' : 'rgba(80,200,80,0.3)'),
                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  Cruise
                </button>
                <button key="autotour" 
                  onClick={() => {
                      setParams(p => ({ ...p, autoTour: !p.autoTour, cruiseMode: false, autoPilot: false }));
                      setTargetPlanetName(null);
                      targetPlanetNameRef.current = null;
                      isMapAutopilotActiveRef.current = false;
                  }}
                  style={{
                    flex: 1,
                    background: params.autoTour ? 'rgba(168, 85, 247, 0.2)' : 'rgba(2,8,18,0.8)',
                    color: params.autoTour ? '#d8b4fe' : '#9333ea',
                    border: '1px solid ' + (params.autoTour ? '#c084fc' : 'rgba(147, 51, 234, 0.3)'),
                    padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                    textTransform: 'uppercase'
                  }}
                >
                  Auto Tour
                </button>

              </div>
            </div>

            <div style={{ marginTop: 8, padding: 8, background: 'rgba(147, 51, 234, 0.1)', borderRadius: 4, border: '1px solid rgba(147, 51, 234, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d8b4fe', marginBottom: 4, fontWeight: 'bold' }}>
                <span>AUTO TOUR IDLE TIMEOUT</span>
                <span>{params.autoTourTimeout || 10}s</span>
              </div>
              <RangeWithArrows type="range" min="3" max="60" value={params.autoTourTimeout || 10} onChange={e => {
                  const v = Number(e.target.value);
                  setParams(p => ({ ...p, autoTourTimeout: v }));
              }} style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }} />
            </div>

            <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 8 }}>GLOBAL COLORS</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, margin: '4px auto 0px', justifyContent: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={params.showNodes} onChange={e => setParams(p => ({ ...p, showNodes: e.target.checked }))} style={{ accentColor: '#FF8820', cursor: 'pointer' }} />
                <span>Show Dynamic Space Objects (Lights)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, margin: '4px auto 8px', justifyContent: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={params.showGrid} onChange={e => setParams(p => ({ ...p, showGrid: e.target.checked }))} style={{ accentColor: '#FF8820', cursor: 'pointer' }} />
                <span>Show 3D Floor Grid</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 4, marginBottom: 8 }}>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
                <span>Ambient</span>
                <input type="color" value={params.ambHex} onChange={e => setParams(p => ({ ...p, ambHex: e.target.value }))} style={{ width: 24, padding: 0, border: 'none', background: 'transparent' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
                <span>Sun</span>
                <input type="color" value={params.sunHex} onChange={e => setParams(p => ({ ...p, sunHex: e.target.value }))} style={{ width: 24, padding: 0, border: 'none', background: 'transparent' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
                <span>Rim</span>
                <input type="color" value={params.rimHex} onChange={e => setParams(p => ({ ...p, rimHex: e.target.value }))} style={{ width: 24, padding: 0, border: 'none', background: 'transparent' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 10 }}>
                <span>Edge</span>
                <input type="color" value={params.edgeHex} onChange={e => setParams(p => ({ ...p, edgeHex: e.target.value }))} style={{ width: 24, padding: 0, border: 'none', background: 'transparent' }} />
              </label>
            </div>

            <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>AERODYNAMIC CONTRAILS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px', marginBottom: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Mount Fwd/Back</span><span style={{ color: '#FF8820' }}>{(params.trailMountY ?? -2.0).toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="-50.0" max="50.0" step="0.01" value={params.trailMountY ?? -2.0} onChange={e => setParams(p => ({ ...p, trailMountY: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Width</span><span style={{ color: '#FF8820' }}>{params.trailWidth.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="40.0" step="0.01" value={params.trailWidth} onChange={e => setParams(p => ({ ...p, trailWidth: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Size</span><span style={{ color: '#FF8820' }}>{params.trailSize.toFixed(3)}</span></div>
            <RangeWithArrows type="range" min="0.001" max="2.0" step="0.001" value={params.trailSize} onChange={e => setParams(p => ({ ...p, trailSize: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Opacity</span><span style={{ color: '#FF8820' }}>{params.trailOpacity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.05" max="1.0" step="0.01" value={params.trailOpacity} onChange={e => setParams(p => ({ ...p, trailOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Spread</span><span style={{ color: '#FF8820' }}>{params.trailSpread.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.05" max="2.0" step="0.01" value={params.trailSpread} onChange={e => setParams(p => ({ ...p, trailSpread: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Falloff</span><span style={{ color: '#FF8820' }}>{params.trailFalloff.toFixed(3)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="1.0" step="0.01" value={params.trailFalloff} onChange={e => setParams(p => ({ ...p, trailFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Length</span><span style={{ color: '#FF8820' }}>{Math.round(params.trailLength || 400)}</span></div>
            <RangeWithArrows type="range" min="10" max="500" step="10" value={params.trailLength || 400} onChange={e => setParams(p => ({ ...p, trailLength: parseInt(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Color</span></div>
            <input type="color" value={params.trailColor} onChange={e => setParams(p => ({ ...p, trailColor: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
        </div>

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>NAVIGATION LIGHTS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px', marginBottom: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Offset X</span><span style={{ color: '#FF8820' }}>{params.navLightsX.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="-100.0" max="100.0" step="0.01" value={params.navLightsX} onChange={e => setParams(p => ({ ...p, navLightsX: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Mount Y</span><span style={{ color: '#FF8820' }}>{params.navLightsY.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="-100.0" max="100.0" step="0.01" value={params.navLightsY} onChange={e => setParams(p => ({ ...p, navLightsY: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Wing Spread</span><span style={{ color: '#FF8820' }}>{params.navLightsSpread.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="150.0" step="0.01" value={params.navLightsSpread} onChange={e => setParams(p => ({ ...p, navLightsSpread: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Light Falloff (Diffuse)</span><span style={{ color: '#FF8820' }}>{params.navLightsFalloff.toFixed(4)}</span></div>
            <RangeWithArrows type="range" min="0.001" max="0.1" step="0.001" value={params.navLightsFalloff} onChange={e => setParams(p => ({ ...p, navLightsFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Port Intensity</span><span style={{ color: '#FF8820' }}>{params.navLightsPortIntensity.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="20.0" step="0.01" value={params.navLightsPortIntensity} onChange={e => setParams(p => ({ ...p, navLightsPortIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Stbd Intensity</span><span style={{ color: '#FF8820' }}>{params.navLightsStbIntensity.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="20.0" step="0.01" value={params.navLightsStbIntensity} onChange={e => setParams(p => ({ ...p, navLightsStbIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Port Color</span></div>
            <input type="color" value={params.navLightsPortColor} onChange={e => setParams(p => ({ ...p, navLightsPortColor: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Stbd Color</span></div>
            <input type="color" value={params.navLightsStbColor} onChange={e => setParams(p => ({ ...p, navLightsStbColor: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
        </div>


        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>SHIP DYNAMICS</div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ship Size</span>
            <span style={{ color: '#FF8820' }}>{params.planeSize.toFixed(3)}</span>
          </div>
          <RangeWithArrows type="range" min="0.005" max="1.0" step="0.005" value={params.planeSize} 
            onChange={e => setParams(p => ({ ...p, planeSize: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Top Speed</span>
            <span style={{ color: '#FF8820' }}>{params.maxSpeed.toFixed(2)}</span>
          </div>
          <RangeWithArrows type="range" min="0.0001" max="0.6" step="0.0001" value={params.maxSpeed} 
            onChange={e => setParams(p => ({ ...p, maxSpeed: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Acceleration</span>
            <span style={{ color: '#FF8820' }}>{params.acceleration.toFixed(4)}</span>
          </div>
          <RangeWithArrows type="range" min="0.0001" max="0.02" step="0.0001" value={params.acceleration} 
            onChange={e => setParams(p => ({ ...p, acceleration: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Drift (Friction)</span>
            <span style={{ color: '#FF8820' }}>{params.driftFriction.toFixed(3)}</span>
          </div>
          <RangeWithArrows type="range" min="0.900" max="0.999" step="0.001" value={params.driftFriction} 
            onChange={e => setParams(p => ({ ...p, driftFriction: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cornering Drift</span>
            <span style={{ color: '#FF8820' }}>{((params.corneringDrift || 0) * 100).toFixed(0)}%</span>
          </div>
          <RangeWithArrows type="range" min="0.0" max="0.99" step="0.01" value={params.corneringDrift || 0} 
            onChange={e => setParams(p => ({ ...p, corneringDrift: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Retro-Brake Burn</span>
            <span style={{ color: '#FF8820' }}>{params.retroBrake.toFixed(1)}x</span>
          </div>
          <RangeWithArrows type="range" min="1.0" max="5.0" step="0.01" value={params.retroBrake} 
            onChange={e => setParams(p => ({ ...p, retroBrake: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>



        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Turn Speed</span>
            <span style={{ color: '#FF8820' }}>{params.turnSpeed.toFixed(3)}</span>
          </div>
          <RangeWithArrows type="range" min="0.01" max="0.1" step="0.001" value={params.turnSpeed} 
            onChange={e => setParams(p => ({ ...p, turnSpeed: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Max Tilt Angle</span>
            <span style={{ color: '#FF8820' }}>{params.maxBankDeg.toFixed(0)}°</span>
          </div>
          <RangeWithArrows type="range" min="0" max="90" step="1" value={params.maxBankDeg} 
            onChange={e => setParams(p => ({ ...p, maxBankDeg: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tilt Speed</span>
            <span style={{ color: '#FF8820' }}>{params.tiltSpeed.toFixed(2)}</span>
          </div>
          <RangeWithArrows type="range" min="0.01" max="0.5" step="0.01" value={params.tiltSpeed} 
            onChange={e => setParams(p => ({ ...p, tiltSpeed: parseFloat(e.target.value) }))} 
            style={{ accentColor: '#FF8820' }} />
        </label>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,120,30,0.2)', margin: '4px 0' }} />

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>MATERIAL EDITOR</div>
        
        {/* Texture Boxes */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', marginBottom: 8 }}>
            {(() => {
                const as = SHIPS.find(s => s.id === focusedShipId);
                return [
                  { id: 'Color', show: params.showColorMap, src: as?.colorUrl || undefined, toggle: () => setParams(p => ({ ...p, showColorMap: !p.showColorMap })) },
                  { id: 'Alpha', show: params.showAlphaMap, src: as?.alphaUrl || undefined, toggle: () => setParams(p => ({ ...p, showAlphaMap: !p.showAlphaMap })) },
                  { id: 'Bump', show: params.showBumpMap, src: as?.bumpUrl || undefined, toggle: () => setParams(p => ({ ...p, showBumpMap: !p.showBumpMap })) },
                  { id: 'Light', show: params.showLightMap, src: (as as any)?.lightUrl || undefined, toggle: () => setParams(p => ({ ...p, showLightMap: !p.showLightMap })) },
                ].map(mapObj => (
               <div key={mapObj.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  {mapObj.src ? (
                      <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden', border: `1px solid ${mapObj.show ? '#FF8820' : '#444'}`, borderRadius: 4, opacity: mapObj.show ? 1 : 0.4, cursor: 'pointer' }} onClick={mapObj.toggle}>
                        <img src={mapObj.src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: (as as any)?.rotation ? `rotate(${(as as any).rotation}deg)` : 'none' }} alt={mapObj.id} />
                      </div>
                  ) : (
                      <div style={{ width: '100%', aspectRatio: '1/1', border: '1px dashed #444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#666', borderRadius: 4 }}>N/A</div>
                  )}
                  <span style={{ fontSize: 9, color: mapObj.show ? '#fff' : '#666' }}>{mapObj.id}</span>
               </div>
                ));
            })()}
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Tex Scale X</span><span style={{ color: '#FF8820' }}>{params.texScaleX.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="20" step="0.01" value={params.texScaleX} onChange={e => setParams(p => ({ ...p, texScaleX: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Tex Scale Y</span><span style={{ color: '#FF8820' }}>{params.texScaleY.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="20" step="0.01" value={params.texScaleY} onChange={e => setParams(p => ({ ...p, texScaleY: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Offset X</span><span style={{ color: '#FF8820' }}>{params.texOffsetX.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="-1" max="1" step="0.01" value={params.texOffsetX} onChange={e => setParams(p => ({ ...p, texOffsetX: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Offset Y</span><span style={{ color: '#FF8820' }}>{params.texOffsetY.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="-1" max="1" step="0.01" value={params.texOffsetY} onChange={e => setParams(p => ({ ...p, texOffsetY: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Tex Rotation</span><span style={{ color: '#FF8820' }}>{params.texRotation.toFixed(0)}°</span></div>
            <RangeWithArrows type="range" min="-180" max="180" step="1" value={params.texRotation} onChange={e => setParams(p => ({ ...p, texRotation: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Contrast</span><span style={{ color: '#FF8820' }}>{params.texContrast.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.texContrast} onChange={e => setParams(p => ({ ...p, texContrast: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Luminance</span><span style={{ color: '#FF8820' }}>{params.texLuminance.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.texLuminance} onChange={e => setParams(p => ({ ...p, texLuminance: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Alpha Threshold</span><span style={{ color: '#FF8820' }}>{params.alphaTest.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.alphaTest} onChange={e => setParams(p => ({ ...p, alphaTest: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Bump Scale</span><span style={{ color: '#FF8820' }}>{params.bumpScale.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="2" step="0.01" value={params.bumpScale} onChange={e => setParams(p => ({ ...p, bumpScale: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,120,30,0.2)', margin: '10px 0 4px 0' }} />

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>LIGHTMAP FX</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Intensity</span><span style={{ color: '#FF8820' }}>{params.lightMapIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="10" step="0.01" value={params.lightMapIntensity} onChange={e => setParams(p => ({ ...p, lightMapIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Glow Spread</span><span style={{ color: '#FF8820' }}>{params.lightMapGlow.toFixed(2)}</span></div>
              <RangeWithArrows type="range" min="0" max="2" step="0.01" value={params.lightMapGlow} onChange={e => setParams(p => ({ ...p, lightMapGlow: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820', width: '100%' }} />
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Bloom</span><span style={{ color: '#FF8820' }}>{(params.lightMapBloom ?? 1.0).toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="10" step="0.01" value={params.lightMapBloom ?? 1.0} onChange={e => setParams(p => ({ ...p, lightMapBloom: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Falloff</span><span style={{ color: '#FF8820' }}>{params.lightMapFalloff.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.lightMapFalloff} onChange={e => setParams(p => ({ ...p, lightMapFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Size</span><span style={{ color: '#FF8820' }}>{params.lightMapSize.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="2" step="0.01" value={params.lightMapSize} onChange={e => setParams(p => ({ ...p, lightMapSize: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>LM Color</span></div>
            <input type="color" value={params.lightMapHex} onChange={e => setParams(p => ({ ...p, lightMapHex: e.target.value }))} style={{ width: '100%', height: 24, border: 'none', cursor: 'pointer', background: 'none' }} />
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,120,30,0.2)', margin: '10px 0 4px 0' }} />

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>3D SHADER FX</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Edge Thresh</span><span style={{ color: '#FF8820' }}>{params.edgeThreshold.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.edgeThreshold} onChange={e => setParams(p => ({ ...p, edgeThreshold: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Edge Int.</span><span style={{ color: '#FF8820' }}>{params.edgeIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.edgeIntensity} onChange={e => setParams(p => ({ ...p, edgeIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Glass Reflection</span><span style={{ color: '#FF8820' }}>{params.specularIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.specularIntensity} onChange={e => setParams(p => ({ ...p, specularIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Glass Sharpness</span><span style={{ color: '#FF8820' }}>{params.specularShininess.toFixed(0)}</span></div>
            <RangeWithArrows type="range" min="1" max="128" step="1" value={params.specularShininess} onChange={e => setParams(p => ({ ...p, specularShininess: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Glass Stretch Y</span><span style={{ color: '#FF8820' }}>{params.specularAnisotropy.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.specularAnisotropy} onChange={e => setParams(p => ({ ...p, specularAnisotropy: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
        </div>

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>CENTER HIGHLIGHT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Center Int.</span><span style={{ color: '#FF8820' }}>{params.centerSpecularIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="10" step="0.01" value={params.centerSpecularIntensity} onChange={e => setParams(p => ({ ...p, centerSpecularIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Center Width</span><span style={{ color: '#FF8820' }}>{params.centerSpecularWidth.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="0.5" step="0.01" value={params.centerSpecularWidth} onChange={e => setParams(p => ({ ...p, centerSpecularWidth: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Center Falloff</span><span style={{ color: '#FF8820' }}>{params.centerSpecularFalloff.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="0.5" step="0.01" value={params.centerSpecularFalloff} onChange={e => setParams(p => ({ ...p, centerSpecularFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Center Sharpness</span><span style={{ color: '#FF8820' }}>{params.centerSpecularShininess.toFixed(0)}</span></div>
            <RangeWithArrows type="range" min="1" max="128" step="1" value={params.centerSpecularShininess} onChange={e => setParams(p => ({ ...p, centerSpecularShininess: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Center Stretch Y</span><span style={{ color: '#FF8820' }}>{params.centerSpecularAnisotropy.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.centerSpecularAnisotropy} onChange={e => setParams(p => ({ ...p, centerSpecularAnisotropy: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
        </div>

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>DIRECTIONAL SPOTLIGHT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Pos X</span><span style={{ color: '#FF8820' }}>{params.spotLightX.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="-1" max="1" step="0.01" value={params.spotLightX} onChange={e => setParams(p => ({ ...p, spotLightX: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Pos Y</span><span style={{ color: '#FF8820' }}>{params.spotLightY.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="-1" max="1" step="0.01" value={params.spotLightY} onChange={e => setParams(p => ({ ...p, spotLightY: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Intensity</span><span style={{ color: '#FF8820' }}>{params.spotLightIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="10" step="0.01" value={params.spotLightIntensity} onChange={e => setParams(p => ({ ...p, spotLightIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Radius</span><span style={{ color: '#FF8820' }}>{params.spotLightSize.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="2.0" step="0.01" value={params.spotLightSize} onChange={e => setParams(p => ({ ...p, spotLightSize: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Falloff</span><span style={{ color: '#FF8820' }}>{params.spotLightFalloff.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="1.5" step="0.01" value={params.spotLightFalloff} onChange={e => setParams(p => ({ ...p, spotLightFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Color</span></div>
            <input type="color" value={params.spotLightHex} onChange={e => setParams(p => ({ ...p, spotLightHex: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
        </div>

        <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>
          MOTION LAYER <span style={{ backgroundColor: '#ff0033', color: '#fff', fontSize: '8px', padding: '2px 4px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '6px' }}>GLOBAL</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4%', paddingBottom: 10, borderBottom: '1px solid #1a2c4d' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Opacity</span><span style={{ color: '#00ffff' }}>{params.motionOpacity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.motionOpacity} onChange={e => setParams(p => ({ ...p, motionOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Intensity</span><span style={{ color: '#00ffff' }}>{params.motionIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="10" step="0.01" value={params.motionIntensity} onChange={e => setParams(p => ({ ...p, motionIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Falloff</span><span style={{ color: '#00ffff' }}>{params.motionFalloff.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="1.0" step="0.01" value={params.motionFalloff} onChange={e => setParams(p => ({ ...p, motionFalloff: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Freq (Dist)</span><span style={{ color: '#00ffff' }}>{params.motionFrequency.toFixed(1)}</span></div>
            <RangeWithArrows type="range" min="1.0" max="50.0" step="0.01" value={params.motionFrequency} onChange={e => setParams(p => ({ ...p, motionFrequency: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Speed</span><span style={{ color: '#00ffff' }}>{params.motionSpeed.toFixed(4)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="0.1" step="0.001" value={params.motionSpeed} onChange={e => setParams(p => ({ ...p, motionSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Rotate</span><span style={{ color: '#00ffff' }}>{params.motionRotation.toFixed(0)}°</span></div>
            <RangeWithArrows type="range" min="-180" max="180" step="1" value={params.motionRotation} onChange={e => setParams(p => ({ ...p, motionRotation: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Width</span><span style={{ color: '#00ffff' }}>{params.motionWidth.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={params.motionWidth} onChange={e => setParams(p => ({ ...p, motionWidth: parseFloat(e.target.value) }))} style={{ accentColor: '#00ffff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Color</span></div>
            <input type="color" value={params.motionHex} onChange={e => setParams(p => ({ ...p, motionHex: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
        </div>

        <div style={{ color: '#1a44ff', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>
          AURA LAYER <span style={{ backgroundColor: '#ff0033', color: '#fff', fontSize: '8px', padding: '2px 4px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '6px' }}>GLOBAL</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4%', paddingBottom: 10, borderBottom: '1px solid #1a2c4d' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Opacity</span><span style={{ color: '#1a44ff' }}>{params.auraOpacity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.auraOpacity} onChange={e => setParams(p => ({ ...p, auraOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#1a44ff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Scale X</span><span style={{ color: '#1a44ff' }}>{params.auraScaleX.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="5.0" step="0.01" value={params.auraScaleX} onChange={e => setParams(p => ({ ...p, auraScaleX: parseFloat(e.target.value) }))} style={{ accentColor: '#1a44ff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Scale Y</span><span style={{ color: '#1a44ff' }}>{params.auraScaleY.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.1" max="5.0" step="0.01" value={params.auraScaleY} onChange={e => setParams(p => ({ ...p, auraScaleY: parseFloat(e.target.value) }))} style={{ accentColor: '#1a44ff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Blur (Softness)</span><span style={{ color: '#1a44ff' }}>{params.auraBlur.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.0" max="1.0" step="0.01" value={params.auraBlur} onChange={e => setParams(p => ({ ...p, auraBlur: parseFloat(e.target.value) }))} style={{ accentColor: '#1a44ff' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Color</span></div>
            <input type="color" value={params.auraHex} onChange={e => setParams(p => ({ ...p, auraHex: e.target.value }))} style={{ width: '100%', height: 20, padding: 0, border: 'none', background: 'transparent' }} />
          </label>
        </div>

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>DYNAMIC SHINE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Stretch Y</span><span style={{ color: '#FF8820' }}>{params.shineStretch.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="1" step="0.01" value={params.shineStretch} onChange={e => setParams(p => ({ ...p, shineStretch: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Width</span><span style={{ color: '#FF8820' }}>{params.shineWidth.toFixed(3)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="0.3" step="0.005" value={params.shineWidth} onChange={e => setParams(p => ({ ...p, shineWidth: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Intensity</span><span style={{ color: '#FF8820' }}>{params.shineIntensity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="5" step="0.01" value={params.shineIntensity} onChange={e => setParams(p => ({ ...p, shineIntensity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
        </div>

        <div style={{ color: '#FF8820', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', marginTop: 12 }}>SHADOWS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Map Center</span><span style={{ color: '#FF8820' }}>{params.globalShadowThreshold.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="-1" max="1" step="0.01" value={params.globalShadowThreshold} onChange={e => setParams(p => ({ ...p, globalShadowThreshold: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Map Blur</span><span style={{ color: '#FF8820' }}>{params.globalShadowSmoothness.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0.01" max="1.5" step="0.01" value={params.globalShadowSmoothness} onChange={e => setParams(p => ({ ...p, globalShadowSmoothness: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Map Opacity</span><span style={{ color: '#FF8820' }}>{params.globalShadowOpacity.toFixed(2)}</span></div>
            <RangeWithArrows type="range" min="0" max="1" step="0.01" value={params.globalShadowOpacity} onChange={e => setParams(p => ({ ...p, globalShadowOpacity: parseFloat(e.target.value) }))} style={{ accentColor: '#FF8820' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '48%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}><span>Map Color</span></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
               <input type="color" value={params.globalShadowColor} onChange={e => setParams(p => ({ ...p, globalShadowColor: e.target.value }))} style={{ width: 24, padding: 0, border: 'none', background: 'transparent' }} />
               <span style={{ fontSize: 10, color: '#FF8820' }}>{params.globalShadowColor}</span>
            </div>
          </label>
        </div>
        </>
      )}
      </div>
      </div>
      )}

      {/* BACKGROUND LINES OVERLAY (Placed outside UI stacking context so mixBlendMode works on canvas) */}
      {activeTheme === 'website' && (
        <div style={{ position: 'absolute', top: '50%', left: '-950px', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none', mixBlendMode: 'overlay', zIndex: 1000 }}>
          <img src="/overlays/website/lines.png" alt="Lines Overlay" />
        </div>
      )}

      {/* THEME UI OVERLAYS */}
      {activeTheme === 'website' && <WebsiteThemeOverlay />}

      {/* FEATURES POPUP (Sibling to HUD container) */}
      {showFeatures && (
        <div 
          onPointerDown={e => e.stopPropagation()}
          style={{ position: 'absolute', top: 150, right: 60, background: 'rgba(10,15,30,0.95)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 109, 0, 0.4)', backdropFilter: 'blur(10px)', width: '300px', animation: 'fadeIn 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'auto', zIndex: 3000 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', color: '#ff6d00' }}>
            <span>Overlay Features (DB Sync)</span>
            <button 
              onClick={() => setIsFeaturesMinimized(m => !m)} 
              style={{ background: 'transparent', border: '1px solid rgba(255,109,0,0.5)', borderRadius: '4px', color: '#ff6d00', cursor: 'pointer', fontSize: '12px', padding: '2px 8px', fontFamily: 'monospace' }}
            >
              {isFeaturesMinimized ? '[+]' : '[-]'}
            </button>
          </div>
          
          {!isFeaturesMinimized && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['game', 'demo', 'website'] as const).map(theme => (
                  <button 
                    key={theme}
                    onClick={() => setActiveTheme(theme)}
                    style={{ flex: 1, padding: '6px', fontSize: '10px', textTransform: 'uppercase', background: activeTheme === theme ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)', border: activeTheme === theme ? '1px solid #333' : '1px solid transparent', color: '#333', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {theme}
                  </button>
                ))}
              </div>

              {activeTheme === 'demo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#666' }}>Trial Minutes</label>
                  <input type="number" defaultValue={5} style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.2)', color: '#333', padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
                </div>
              )}

              {activeTheme === 'website' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#888' }}>Nav Title</label>
                  <input type="text" defaultValue="Cosmic Racers Official" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
                </div>
              )}

              <button 
                onClick={handlePushToScreensaver}
                disabled={isPushingConfig}
                style={{ background: isPushingConfig ? 'rgba(0,255,170,0.2)' : 'rgba(255,109,0,0.2)', border: isPushingConfig ? '1px solid #00ffaa' : '1px solid #ff6d00', color: isPushingConfig ? '#00ffaa' : '#ff6d00', padding: '8px', fontSize: '12px', borderRadius: '4px', cursor: isPushingConfig ? 'default' : 'pointer', fontWeight: 'bold', marginTop: '8px' }}
              >
                {isPushingConfig ? 'Synced ✓' : 'Sync to Engine'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom Right Hud Buttons Container */}
      {/* Features Toggle Button — hidden per user preference */}
      <button 
        className="ui-overlay"
        onPointerDown={e => e.stopPropagation()}
        onClick={() => setShowFeatures(c => !c)}
        style={{
          display: 'none',
          position: 'absolute', top: 140, right: 221,
          background: showFeatures ? 'rgba(255, 109, 0, 0.2)' : 'rgba(10, 15, 30, 0.85)',
          border: showFeatures ? '1px solid rgba(255, 109, 0, 0.4)' : '1px solid rgba(255, 136, 32, 0.3)',
          color: '#ff6d00',
          width: 32, height: 32, padding: 0, borderRadius: 8, cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 16, zIndex: 4990
        }}
        title="Overlay Features"
      >
        {showFeatures ? '✕' : '✨'}
      </button>

      {(activeTheme === 'game' || activeTheme === 'screensaver') && (
      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 2000, display: 'flex', gap: 10, alignItems: 'flex-end' }}>

        {/* Debug Toggle Button Removed */}

        {/* News Toggle Button */}
        <button 
          className="ui-overlay"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => setShowNews(n => !n)}
          style={{
            background: showNews ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 'bold', fontFamily: '"Rubik", sans-serif', letterSpacing: 1,
            backdropFilter: 'blur(10px)', transition: 'all 0.2s ease'
          }}
        >
          {showNews ? '✕ NEWS' : 'NEWS'}
        </button>

        {/* Map Toggle Button */}
        <button 
          className="ui-overlay"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => {
            // SET WAYPOINT mode: planet is selected in map
            if (showMap && selectedPlanet) {
              setTargetPlanetName(selectedPlanet.name);
              targetPlanetNameRef.current = selectedPlanet.name;
              setSelectedPlanet(null);
              mapExitPhaseRef.current = true;
              setShowMap(false);
              return;
            }
            if (!showMap) {
              mapEntryPhaseRef.current = true;
              targetShipIdRef.current = playerShipIdRef?.current || 'ship';
              let maxBoundary = 0;
              const scales = dynamicPaddedScalesRef.current || {};
              Object.values(scales).forEach((r) => {
                   if (r > maxBoundary) maxBoundary = r;
              });
              const nativeViewW = window.innerWidth * 0.05;
              const nativeViewH = window.innerHeight * 0.05;
              const requiredViewBoundary = maxBoundary * 2.0;
              if (requiredViewBoundary > 0) {
                   const bestZoomW = nativeViewW / (requiredViewBoundary * 1.05);
                   const bestZoomH = nativeViewH / (requiredViewBoundary * 1.05);
                   mapZoomRef.current = Math.min(bestZoomW, bestZoomH);
              } else {
                   mapZoomRef.current = Math.max(mapZoomRef.current, planetPrefsRef.current.fleetClickZoom);
              }
              mapPanRef.current = { x: 0, y: 0 };
            } else {
               // Reset to player ship so close zoom tracks back correctly
               mapExitPhaseRef.current = true;
               targetShipIdRef.current = playerShipIdRef?.current || "ship";
               setSelectedPlanet(null);
            }
            setShowMap(!showMap);
          }}
          style={{
            background: (showMap && selectedPlanet) ? 'rgba(34,197,94,0.25)' : showMap ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid ' + ((showMap && selectedPlanet) ? 'rgba(34,197,94,0.7)' : 'rgba(255,255,255,0.2)'),
            color: (showMap && selectedPlanet) ? '#4ade80' : '#fff',
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 'bold', fontFamily: '"Rubik", sans-serif', letterSpacing: 1,
            backdropFilter: 'blur(10px)', transition: 'all 0.2s ease'
          }}
        >
          {showMap && selectedPlanet ? `◎ ${selectedPlanet.name.toUpperCase()}` : showMap ? '✕ MAP' : 'MAP'}
        </button>

      </div>
      )}

      {showNews && <NewsFeedOverlay onClose={() => setShowNews(false)} />}

      {/* Target Planet Cinematic Approach Overlay */}
      {targetPlanetName && !showMap && (
      <div id="hud-approach-container" className="ui-overlay" style={{
         position: 'absolute', bottom: 85, right: 30, zIndex: 2500,
         display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
         pointerEvents: 'none'
      }}>
         <div id="hud-approach-time" style={{
             fontFamily: '"Rubik", sans-serif', fontSize: 32, fontWeight: 900, color: '#fff',
             textShadow: '0 0 10px rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', lineHeight: 1
         }}>
            CALCULATING...
         </div>
         <div id="hud-approach-label" style={{
             fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: 8,
             textTransform: 'uppercase', color: 'rgba(56, 189, 248, 0.95)',
             textShadow: '0 0 15px rgba(56, 189, 248, 0.6), 0 0 30px rgba(56, 189, 248, 0.2)'
         }}>
             APPROACHING: {targetPlanetName}
         </div>
      </div>
      )}

      <div 
         ref={mapShipMarkerRef}
         onClick={(e) => {
             e.stopPropagation();
             targetShipIdRef.current = playerShipIdRef?.current || 'ship';
             targetPlanetNameRef.current = null;
             setTargetPlanetName(null);
             // Native deep zoom lock tracking
             // Eliminate outdated offset vectors natively
             mapPanRef.current = { x: 0, y: 0 };
             // Fixed absolute zoom landing exactly in the middle-ground
             mapZoomRef.current = Math.max(mapZoomRef.current, planetPrefsRef.current?.fleetClickZoom || 2.5);
         }}
         style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, display: 'none', pointerEvents: 'auto', cursor: 'pointer', zIndex: 120, transition: 'transform 0s' }}
      >
        <style>{`
          @keyframes nativeSonarPulse {
            0% { transform: scale(0); opacity: 0.7; }
            100% { transform: scale(1); opacity: 0; }
          }
          .map-sonar-ring {
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            border: 1.5px solid #00f7ff;
            border-radius: 50%;
            animation: nativeSonarPulse 1.33s linear infinite;
          }
        `}</style>
        {/* Core Ship Dot & Directional Arrow */}
        <div ref={mapPlayerArrowRef} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '10px solid #00f7ff', filter: 'drop-shadow(0 0 4px #00f7ff)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, background: '#00f7ff', borderRadius: '50%', boxShadow: '0 0 10px #00f7ff' }} />
        {/* Expanding Sonar Rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 120 }}>
           <div className="map-sonar-ring" style={{ animationDelay: '0s' }} />
           <div className="map-sonar-ring" style={{ animationDelay: '0.44s' }} />
           <div className="map-sonar-ring" style={{ animationDelay: '0.88s' }} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, display: 'flex', justifyContent: 'center' }}>
           <div id="map-you-label" style={{ transform: 'rotate(0deg)' }}>
               <div style={{ marginTop: -80, color: 'rgba(255,255,255,1.0)', fontSize: 14, fontWeight: 'bold', fontFamily: '"Courier New", monospace', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>YOU</div>
           </div>
        </div>
      </div>
      {/* dynamically render infinite wingman markers */}
      {spawnedShipIds.filter(id => id !== playerShipId).map((wId, idx) => (
          <div key={`map-marker-${wId}`} ref={el => { wingmanMarkerRefs.current[idx] = el; }} style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, display: 'none', pointerEvents: 'none', zIndex: 119 }}>
             <div ref={el => { wingmanArrowRefs.current[idx] = el; }} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '8px solid #a855f7', filter: 'drop-shadow(0 0 4px #a855f7)' }} />
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 6, height: 6, background: '#a855f7', borderRadius: '50%', boxShadow: '0 0 10px #a855f7' }} />
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, display: 'flex', justifyContent: 'center' }}>
                <div ref={el => { wingmanLabelRefs.current[idx] = el; }} style={{ transform: 'rotate(0deg)' }}>
                    <div style={{ marginTop: -30, color: '#d8b4fe', fontSize: 12, fontWeight: 'bold', fontFamily: '"Courier New", monospace', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>{(SHIPS.find(s => s.id === wId)?.name || wId.substring(0,8)).toUpperCase()}</div>
                </div>
             </div>
          </div>
      ))}

      {/* PLANET NAME LABELS OVERLAY */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 118, pointerEvents: 'none' }}>
         {solarBodies.map(planet => {
             if (planet.name.toLowerCase().includes('sun')) return null;
             return (
                 <div key={`label-${planet.name}`} ref={el => { planetLabelRefs.current[planet.name] = el; }} style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}>
                     <div style={{ transform: 'translate(-50%, -100%)', color: '#aaaaaa', fontSize: planetPrefs.labelSize ?? 14, fontWeight: 'bold', fontFamily: '"Rubik", sans-serif', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                         {planet.name.toUpperCase()}
                     </div>
                 </div>
             );
         })}
      </div>

      {/* Native Fluids Background Overlay moved to Absolute Scene Root */}

      {/* GLOBAL WAYPOINT HUD (Persists outside the map) */}
      {targetPlanetName && (
         <div className="ui-overlay" style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
            <div
              style={{
                background: "rgba(2,8,23,0.88)",
                border: `2px solid rgba(56,189,248,0.5)`,
                borderRadius: "10px",
                color: "#ffffff",
                padding: "8px 18px",
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                letterSpacing: "0.1em",
              }}
            >
              <span style={{ color: "#38bdf8" }}>⚑</span>
              <span>{targetPlanetName.toUpperCase()}</span>
              <span id="hud-waypoint-dist" ref={hudWaypointDistRef} style={{ color: "#38bdf8" }}></span>
              <button
                 onClick={() => {
                     setTargetPlanetName(null);
                     targetPlanetNameRef.current = null;
                 }}
                 style={{
                     background: 'transparent',
                     border: 'none',
                     color: '#f87171',
                     cursor: 'pointer',
                     fontSize: '16px',
                     lineHeight: 1,
                     padding: '0 0 0 8px',
                     marginLeft: '4px',
                     borderLeft: '1px solid rgba(255,255,255,0.2)'
                 }}
              >
                  ×
              </button>
            </div>
         </div>
      )}

      {/* Map Interface Overlay (Always mounted for seamless fade-out syncing with the scaling sun) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: 'transparent', pointerEvents: showMap ? 'auto' : 'none', opacity: showMap ? 1 : 0, visibility: showMap ? 'visible' : 'hidden', transition: 'opacity 0.6s ease, visibility 0.6s ease' }}>
         <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.01)' }} 
            onPointerDown={(e) => { onPointerDown(e); setSelectedPlanet(null); }} 
            onPointerMove={onPointerMove} 
            onPointerUp={onPointerUp} 
            onPointerOut={onPointerUp}
            onWheel={(e) => {
                 if (!showMap) return;
                 
                 // Immediately abort cinematic entry tracking curve and give physics control back to user trackpad
                 mapEntryPhaseRef.current = false;
                 
                  // Interpolated cleanly up based on the actual preferences UI Slider mapping logic!
                 const mapSpeedRatio = planetPrefs.zoomSpeed * 0.05;
                 const zoomFactor = Math.exp(-e.deltaY * mapSpeedRatio);
                 mapZoomRef.current = Math.min(100.0, Math.max(0.00001, mapZoomRef.current * zoomFactor));
                 
                 // Immediately snap the Pan point to the active ship so it zooms straight into tracking focus
                 let jumpX = shipPosRef.current ? shipPosRef.current.x : 0;
                 let jumpZ = shipPosRef.current ? shipPosRef.current.z : 0;
                 
                 if (focusedShipIdRef.current !== 'player' && dronesRef.current && dronesRef.current[focusedShipIdRef.current]) {
                     jumpX = dronesRef.current[focusedShipIdRef.current].x;
                     jumpZ = dronesRef.current[focusedShipIdRef.current].z;
                 }
                 
                 mapPanRef.current.x += ((jumpX / 24.0) - mapPanRef.current.x) * 0.15;
                 mapPanRef.current.y += ((jumpZ / 24.0) - mapPanRef.current.y) * 0.15;
            }}
         />
         
         {/* TOP BAR */}
         <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', background:'transparent', flexShrink:0, zIndex:10, pointerEvents: 'none', position: 'absolute', top: 0, width: '100%' }}>
           <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10, letterSpacing:4, fontWeight:700 }}>GALAXY MAP · ALLIANCES SYSTEM · OCTAVE {activeOctave}</div>
         </div>
         
         {/* RIGHT SIDEBAR — planet list (floating) */}
         <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', width:230, background:'transparent', maxHeight:'90vh', overflowY:'auto', padding:'8px 0', zIndex:160, pointerEvents: showMap ? 'auto' : 'none' }}>
           {solarBodies.map(planet=>{
             const fc = planet.color || '#4b5563';
             return (
             <div key={planet.name}
               onClick={()=>{
                  setSelectedPlanet(p=>{
                     const next = p?.name===planet.name?null:planet;
                     if (typeof window !== 'undefined') {
                         window.dispatchEvent(new CustomEvent('arn_camera_focus_planet', { 
                            detail: { planetName: next ? next.name : null } 
                         }));
                     }
                     return next;
                  });
               }}
               style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', background:selectedPlanet?.name===planet.name?'rgba(200,50,50,0.12)':hoveredPlanet===planet.name?'rgba(255,255,255,0.03)':'transparent', borderLeft:selectedPlanet?.name===planet.name?`2px solid ${fc}`:'2px solid transparent', transition:'background 0.1s' }}
               onMouseEnter={()=>setHoveredPlanet(planet.name)}
               onMouseLeave={()=>setHoveredPlanet(null)}
             >
               <div style={{ width:9, height:9, borderRadius:5, background:planet.color, flexShrink:0, boxShadow:`0 0 5px ${planet.color}` }}/>
               <div style={{ flex:1, minWidth:0 }}>
                 <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                   <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{planet.name.toUpperCase()}</span>
                 </div>
                 <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                   <span style={{ fontSize:7, color:'#334155' }}>{(planet.worldR / 100).toFixed(0)} km Orbit Radius</span>
                 </div>
               </div>
             </div>
           )})}
         </div>
         
         {/* LEFT SIDEBAR — fleet list (floating) */}
         {fleetPositionsRef && fleetPositionsRef.current && (
           <div style={{ position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', width:230, background:'transparent', maxHeight:'90vh', overflowY:'auto', padding:'8px 0', zIndex:160, pointerEvents: showMap ? 'auto' : 'none' }}>
             {fleetPositionsRef.current.map(ship=>{
               const fc = ship.color || '#4b5563';
               const shipDef = SHIPS.find(s => s.id === ship.id);
                const name = ship.isPlayer ? 'YOU' : (shipDef?.name || ship.id.substring(0,8)).toUpperCase();
               return (
               <div key={ship.id}
                 onClick={()=>{
                    setSelectedPlanet(null);
                    setTargetPlanetName(null);
                    const nextId = ship.id;
                    setSelectedShipId(nextId);
                    handleShipChange(nextId);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('arn_camera_focus_ship', { detail: { shipId: nextId } }));
                    }
                    if (showMap) {
                        targetShipIdRef.current = nextId;
                        targetPlanetNameRef.current = null;
                        mapPanRef.current = { x: 0, y: 0 };
                        mapZoomRef.current = Math.max(mapZoomRef.current, planetPrefsRef.current?.fleetClickZoom || 2.5);
                    }
                 }}
                 style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', background:selectedShipId===ship.id?'rgba(0,136,255,0.12)':hoveredShipId===ship.id?'rgba(255,255,255,0.03)':'transparent', borderLeft:selectedShipId===ship.id?`2px solid ${fc}`:'2px solid transparent', transition:'background 0.1s' }}
                 onMouseEnter={()=>setHoveredShipId(ship.id)}
                 onMouseLeave={()=>setHoveredShipId(null)}
               >
                 <div style={{ width:9, height:9, borderRadius:5, background:ship.color, flexShrink:0, boxShadow:`0 0 5px ${ship.color}` }}/>
                 <div style={{ flex:1, minWidth:0 }}>
                   <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                     <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                   </div>
                   <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                     <span style={{ fontSize:7, color:'#334155' }}>FLEET ASSET</span>
                   </div>
                 </div>
               </div>
             )})}
           </div>
      )}
      </div>
  </div>
  </div>
  </>
  );
}
