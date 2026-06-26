'use client';
/**
 * TerrainGenerator — Procedural isometric terrain using frosted-glass blocks.
 *
 * - Generates a grid of 1–3 block-tall terrain cells using seeded noise
 * - Same frosted glass + UnrealBloom aesthetic as 3D Studio
 * - "Bake" exports a PNG snapshot
 * - Terrain heightmap is saved to localStorage so 3D Studio can offset buildings
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CylinderGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { sliderToFrustumHalf, applyShadowSoftness } from './PCSSHelper';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FlockEngine } from '@/lib/FlockEngine';
import { lcg, buildNoise } from '@/lib/TerrainMath';

// ── Radial DOF shader — isometric-friendly: blurs edges radially from center ──
// 8 circular samples + quadratic falloff so grid edges blur while terrain centre
// stays sharp. vignette uniform darkens edges independently of blur.
// ── TiltShift shader — blurs TOP & BOTTOM edges, keeps horizontal center band sharp ──
// dy = 0 at screen center, 1 at top/bottom edge.
// Blur accumulates quadratically so the centre stays crisp.
// Vignette darkens/tints the same top/bottom gradient for a consistent cinematic look.
const RadialDOFShader = {
  uniforms: {
    tDiffuse:  { value: null as THREE.Texture | null },
    blur:      { value: 1.5 },   // 0=off, higher=more blur at edges
    spread:    { value: 0.035 }, // bokeh sample radius per unit of blur
    vignette:  { value: 0.4 },   // how strongly top/bottom are darkened/tinted
    vigColor:  { value: new THREE.Color(0, 0, 0) }, // vignette tint colour
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float blur;
    uniform float spread;
    uniform float vignette;
    uniform vec3  vigColor;
    varying vec2 vUv;
    void main() {
      // dy: 0 at horizontal centre, 1 at very top/very bottom
      float dy = abs(vUv.y - 0.5) * 2.0;
      float b  = blur * dy * dy;          // quadratic — edges blur, centre stays sharp
      vec4 col;
      if (b > 0.003) {
        float s = spread;
        col = vec4(0.0);
        // Primary vertical samples (most weight — tilt-shift is vertical blur)
        col += texture2D(tDiffuse, vUv + vec2(0.0,   b * s));
        col += texture2D(tDiffuse, vUv + vec2(0.0,  -b * s));
        // Diagonal samples for circular bokeh feel
        col += texture2D(tDiffuse, vUv + vec2( b * s * 0.6,  b * s * 0.8));
        col += texture2D(tDiffuse, vUv + vec2(-b * s * 0.6,  b * s * 0.8));
        col += texture2D(tDiffuse, vUv + vec2( b * s * 0.6, -b * s * 0.8));
        col += texture2D(tDiffuse, vUv + vec2(-b * s * 0.6, -b * s * 0.8));
        // Horizontal samples for width
        col += texture2D(tDiffuse, vUv + vec2( b * s, 0.0));
        col += texture2D(tDiffuse, vUv + vec2(-b * s, 0.0));
        col += texture2D(tDiffuse, vUv) * 2.0;   // centre weighted 2×
        col /= 10.0;
      } else {
        col = texture2D(tDiffuse, vUv);
      }
      // Vignette follows same top/bottom gradient
      float vigAmt = clamp(vignette * dy * dy * 1.8, 0.0, 1.0);
      col.rgb = mix(col.rgb, vigColor, vigAmt);
      gl_FragColor = col;
    }
  `,
};

// ── Extend range → 5 height levels: deep valley → lowland → mid → highland → peak
// Default layer colours (5 height levels) — can be overridden per-session
const DEFAULT_LAYER_COLORS = ['#0a1a3a','#0d4a6a','#1e7a8c','#2dd4bf','#9ef5f5'];

// ── Shape Library — all available geometry archetypes for Mixed Geo mode ──────
interface ShapeDef {
  id:       string;
  label:    string;
  icon:     string;
  desc:     string;
  makeGeo:  () => THREE.BufferGeometry;
  roughness: number;
  metalness: number;
  yOff:     (gz: number) => number;
  rotY?:    (gx: number, gy: number) => number;
}

const SHAPE_LIBRARY: ShapeDef[] = [
  {
    id: 'box', label: 'Box', icon: '⬛', desc: 'Standard cube block',
    makeGeo: () => new THREE.BoxGeometry(0.92, 1.0, 0.92),
    roughness: 0.55, metalness: 0.05,
    yOff: gz => gz + 0.5,
  },
  {
    id: 'slab', label: 'Slab', icon: '▬', desc: 'Wide flat panel',
    makeGeo: () => new THREE.BoxGeometry(1.14, 0.24, 1.14),
    roughness: 0.9, metalness: 0.04,
    yOff: gz => gz + 0.12,
  },
  {
    id: 'pillar', label: 'Pillar', icon: '🗼', desc: 'Thin vertical column',
    makeGeo: () => new THREE.BoxGeometry(0.32, 1.6, 0.32),
    roughness: 0.45, metalness: 0.45,
    yOff: gz => gz + 0.5,
    rotY: (gx, gy) => ((gx * 3 + gy * 5) % 4) * Math.PI / 2,
  },
  {
    id: 'cylinder', label: 'Cylinder', icon: '🥫', desc: 'Round cylinder',
    makeGeo: () => new CylinderGeometry(0.38, 0.42, 0.88, 10),
    roughness: 0.3, metalness: 0.6,
    yOff: gz => gz + 0.5,
    rotY: (gx, gy) => (gx + gy) * 0.3927,
  },
  {
    id: 'ring', label: 'Ring', icon: '🔲', desc: 'Thin accent tile',
    makeGeo: () => new THREE.BoxGeometry(0.84, 0.12, 0.84),
    roughness: 0.55, metalness: 0.08,
    yOff: gz => gz + 0.06,
  },
  {
    id: 'tower', label: 'Tower', icon: '🏛', desc: 'Tall narrow tower',
    makeGeo: () => new THREE.BoxGeometry(0.5, 2.1, 0.5),
    roughness: 0.4, metalness: 0.5,
    yOff: gz => gz + 0.5,
  },
  {
    id: 'dome', label: 'Dome', icon: '🔵', desc: 'Hemisphere cap',
    makeGeo: () => new THREE.SphereGeometry(0.46, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    roughness: 0.25, metalness: 0.55,
    yOff: gz => gz + 0.02,
  },
  {
    id: 'spike', label: 'Spike', icon: '🔺', desc: 'Pointed cone spike',
    makeGeo: () => new CylinderGeometry(0, 0.38, 1.4, 8),
    roughness: 0.3, metalness: 0.7,
    yOff: gz => gz + 0.05,
    rotY: (gx, gy) => (gx ^ gy) * 0.523,
  },
  {
    id: 'micro', label: 'Micro', icon: '▫', desc: 'Small accent cube',
    makeGeo: () => new THREE.BoxGeometry(0.48, 0.48, 0.48),
    roughness: 0.6, metalness: 0.1,
    yOff: gz => gz + 0.24,
  },
  {
    id: 'wedge', label: 'Wedge', icon: '◩', desc: 'Angled wedge block',
    makeGeo: () => new THREE.BoxGeometry(0.9, 0.9, 0.9),
    roughness: 0.65, metalness: 0.1,
    yOff: gz => gz + 0.5,
    rotY: (gx, gy) => ((gx + gy) % 4) * Math.PI / 2,
  },
];

const ALL_SHAPE_IDS = SHAPE_LIBRARY.map(s => s.id);
const DEFAULT_ENABLED_SHAPES = new Set(['box','slab','pillar','cylinder','ring']);

// ── Download helper ───────────────────────────────────────────────────────────
function downloadPNG(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}

// ── Global Styles for Apple UI ────────────────────────────────────────────────
const APPLE_UI_STYLES = `
  .apple-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    outline: none;
    transition: background 0.2s;
  }
  .apple-slider:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .apple-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .apple-slider::-webkit-slider-thumb:active {
    transform: scale(1.1);
  }
  .apple-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
  }
  .apple-card {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
  }
  .apple-card-title {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 10px;
    letter-spacing: 0.2px;
  }
  .apple-segmented-control {
    display: flex;
    background: rgba(0, 0, 0, 0.3);
    padding: 2px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .apple-segment {
    flex: 1;
    text-align: center;
    padding: 6px 12px;
    font-size: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .apple-segment.active {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
`;

// ── Apple-Style Config slider ──────────────────────────────────────────────────
function CfgSlider({ label, min, max, step, value, onChange, accent = '#0A84FF' }: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; accent?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: 13, 
          color: 'rgba(255, 255, 255, 0.9)', 
          fontWeight: 600,
          letterSpacing: 0.2,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>{label}</span>
        <span style={{ 
          fontSize: 13, 
          color: '#ffffff', 
          fontWeight: 700,
          fontFamily: 'system-ui, -apple-system, monospace'
        }}>{value}</span>
      </div>
      <input type="range" className="apple-slider" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ '--slider-accent': accent } as React.CSSProperties} />
    </div>
  );
}

const IconScatter = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.9 4.9 2.1 2.1"/><path d="m17 17 2.1 2.1"/><path d="m4.9 19.1 2.1-2.1"/><path d="m17 7 2.1-2.1"/></svg>;
const IconArtillery = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
const IconFlyover = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.3 2.6c-.2.4-.1 1 .3 1.3L9 14l-4.5 4.5-2.7-.9c-.4-.1-.8.1-1 .5l-.6 1.2c-.2.4 0 .9.4 1.1l4.9 2.5c.3.1.6.1.9 0l2.5-4.9c.2-.4.1-.9-.2-1.1l-1.2-.6c-.4-.2-.6-.6-.5-1l.9-2.7L14 9l3.2 6.3c.3.4.9.5 1.3.3l2.6-1.3c.5-.2.8-.6.7-1.1z"/></svg>;
const IconLaser = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M8 22h8"/><path d="M8 2h8"/></svg>;
const IconSeismic = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h3l3-9 6 18 3-9h5"/></svg>;
const IconCarpet = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10a7 7 0 1 0 14 0A7 7 0 0 0 5 10z"/><path d="M12 3v3"/><path d="M14 2.5a2 2 0 0 0-4 0"/></svg>;
const IconBlackhole = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12a14.5 14.5 0 0 0 20 0"/></svg>;

function WeaponButton({ active, onClick, onSecondaryClick, icon, label, weaponId }: { active: boolean, onClick: () => void, onSecondaryClick: () => void, icon: React.ReactNode, label: string, weaponId: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onSecondaryClick(); }}
      onPointerDown={(e) => { if (e.button === 0) setIsPressed(true); }}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: active ? 'rgba(255, 255, 255, 0.25)' : isHovered ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
        border: active ? '2px solid rgba(255, 255, 255, 0.9)' : isHovered ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid transparent',
        boxShadow: active ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
        transform: isPressed ? 'scale(0.92)' : 'scale(1)',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
        outline: 'none',
        borderRadius: 999,
        padding: '10px 24px',
        minWidth: 84,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      <div id={`cooldown-${weaponId}`} className="wpn-cooldown-bar" style={{ position: 'absolute', bottom: 0, left: 0, height: '0%', background: 'rgba(255, 255, 255, 0.15)', width: '100%', transition: 'none', zIndex: 1 }} />
      <span style={{ fontSize: 24, position: 'relative', zIndex: 2, transform: active ? 'scale(1.1) translateY(-2px)' : isHovered ? 'translateY(-2px)' : 'none', transition: 'transform 0.2s' }}>{icon}</span> 
      <span style={{ fontSize: 12, fontWeight: 700, position: 'relative', zIndex: 2, letterSpacing: 0.5, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>{label}</span>
    </button>
  );
}

const WEAPON_COOLDOWNS: Record<string, number> = {
  scatter: 560,
  artillery: 900,
  flyover: 1460,
  laser: 2360,
  seismic: 3820,
  carpet: 6180,
  blackhole: 10000
};

// ── Default presets for each map slot ───────────────────────────────────────
const DEFAULT_CITY_PRESET = {
  gridW: 32, gridH: 32, octaves: 1, seed: 905, maxElev: 5, roughness: 1.54,
  bevel: 0.03, bloomStr: 0, bloomThresh: 0, glowInt: 0.55, opacity: 1,
  tiltBlur: 0.3, tiltSpread: 0.02, tiltVignette: 0, vigColor: '#1a001a', shadowColor: '#0a0e2a',
  layerColors: ["#00b3ff", "#e7b883", "#ff00ae", "#ae00ff", "#ffffff"],
  matTransmit: 0, matThickness: 0, matIor: 1, matRoughness: 0.14, cubeJitter: 0.5,
  shadowIntensity: 1, shadowBias: -0.01, shadowNormalBias: 0, hemIntensity: 0.46,
  shadowRadius: 3, shadowMapSize: 2048, keyLightInt: 4.4, ambientInt: 1.15,
  keyLightColor: '#c8aaff', lightElev: 13, lightAzimuth: 0, camElev: 35.26, camAzimuth: 45, camZoom: 28,
  terrainTint: '#1e7a8c', beaconCount: 0, beaconColor: '#ff6b35', beaconEmissive: 0.5,
  beaconLight: 0, beaconBury: 0, beaconSeed: 7, renderMode: 'glass',
};
const DEFAULT_REGIONAL_PRESET = {
  gridW: 64, gridH: 64, octaves: 5, seed: 42, maxElev: 6, roughness: 1.5,
  bevel: 0.06, bloomStr: 0.4, bloomThresh: 0.3, glowInt: 0.15, opacity: 0.92,
  tiltBlur: 1.8, tiltSpread: 0.032, tiltVignette: 0.45, vigColor: '#000000', shadowColor: '#020814',
  layerColors: ['#0a1a0d','#0d4a1a','#1a7a3a','#2dd46a','#9ef5c0'],
  matTransmit: 0.0, matThickness: 0.5, matIor: 1.5, matRoughness: 0.88, cubeJitter: 0.12,
  shadowIntensity: 0.75, shadowBias: -0.001, shadowNormalBias: 0.15, hemIntensity: 0.4,
  shadowRadius: 5, shadowMapSize: 1024, keyLightInt: 0.5, ambientInt: 0.18,
  keyLightColor: '#b8e8c0', lightElev: 48, lightAzimuth: 55, camElev: 35.26, camAzimuth: 45, camZoom: 36,
  terrainTint: '#2d6a4f', beaconCount: 0, beaconColor: '#40ff80', beaconEmissive: 2.5,
  beaconLight: 0.9, beaconBury: 3, beaconSeed: 13, renderMode: 'glass',
};

// ── Weapons System Types ──────────────────────────────────────────────────
interface WeaponProjectile {
  id: string;
  type: 'scatter' | 'artillery' | 'flyover' | 'laser' | 'seismic' | 'carpet' | 'blackhole';
  mesh: THREE.Object3D;
  startX: number; startY: number; startZ: number;
  targetX: number; targetY: number; targetZ: number;
  progress: number;
  speed: number;
  radius: number;
  depth: number;
  delayMs?: number;
  startTime?: number;
  curvePt1?: THREE.Vector3;
  curvePt2?: THREE.Vector3;
}

// ── Asteroid-style particle pool for the terrain hover system ────────────────
interface TerrainParticle {
  alive:  boolean;
  px: number; py: number; pz: number;  // world position
  vx: number; vy: number; vz: number;  // velocity
  age: number; maxAge: number;          // lifetime in frames
  r:   number; g: number; b: number;   // emissive color
}
const TERRAIN_MAX_PARTICLES = 30000;

// ── Main component ────────────────────────────────────────────────────────────
const createGoldenRatioShadowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // The 3D shadow plane will be 100x100 world units.
  // The terrain grid is about 48x48 world units.
  // So the grid occupies 48% of the plane.
  // In a 1024x1024 canvas, the grid is 491 pixels.
  const layer1Size = 491 * 0.4; // 60% smaller than grid
  const layer1Blur = 50;
  const layer1Opac = 0.75;
  
  const layer2Size = layer1Size * 1.618;
  const layer2Blur = layer1Blur * 1.618;
  const layer2Opac = layer1Opac / 1.618;

  const layer3Size = layer2Size * 1.618;
  const layer3Blur = layer2Blur * 1.618;
  const layer3Opac = layer2Opac / 1.618;

  const layers = [
    { size: layer3Size, blur: layer3Blur, opac: layer3Opac },
    { size: layer2Size, blur: layer2Blur, opac: layer2Opac },
    { size: layer1Size, blur: layer1Blur, opac: layer1Opac },
  ];

  layers.forEach(layer => {
    // Cast a bright light blue shadow instead of black
    ctx.shadowColor = `rgba(90, 180, 255, ${layer.opac})`;
    ctx.shadowBlur = layer.blur;
    ctx.shadowOffsetX = 10000; 
    ctx.shadowOffsetY = 0;

    const x = -10000 + (1024 - layer.size) / 2;
    const y = (1024 - layer.size) / 2;
    
    ctx.fillStyle = 'rgba(42, 65, 163, 1)'; // Royal Blue instead of white
    ctx.beginPath();
    ctx.rect(x, y, layer.size, layer.size);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
};



function AnimatedVictoryScreen({ stats, onRestart }: { stats: { score: number, kills: number, shots: number, time: number, base: number }, onRestart: () => void }) {
  const [phase, setPhase] = useState(-1);
  const [displayBase, setDisplayBase] = useState(0);
  const [displayShotsPen, setDisplayShotsPen] = useState(0);
  const [displayTimePen, setDisplayTimePen] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (phase === -1) {
        const t = setTimeout(() => setPhase(0), 100);
        return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase < 0) return;
    
    const animateNum = (target: number, setter: (v: number) => void, onComplete: () => void) => {
      const frames = 30;
      let f = 0;
      const t = setInterval(() => {
        f++;
        setter(Math.floor((target / frames) * f));
        if (f >= frames) {
          setter(target);
          clearInterval(t);
          setTimeout(onComplete, 300);
        }
      }, 800 / frames);
    };

    if (phase === 0) {
      animateNum(stats.kills * 25000, setDisplayBase, () => setPhase(1));
    } else if (phase === 1) {
      animateNum(stats.shots * 5000, setDisplayShotsPen, () => setPhase(2));
    } else if (phase === 2) {
      animateNum(stats.time * 15000, setDisplayTimePen, () => setPhase(3));
    } else if (phase === 3) {
      animateNum(stats.score, setDisplayScore, () => setPhase(4));
    }
  }, [phase, stats]);

  const fmt = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, color: '#fff', fontFamily: '"Rubik", system-ui, -apple-system, sans-serif',
      pointerEvents: 'auto',
      opacity: phase >= -1 ? 1 : 0, transition: 'opacity 0.6s'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: 24,
        padding: '32px',
        width: '640px',
        height: 'auto',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: 40, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 8px 0', 
              background: 'linear-gradient(180deg, #fff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>SECTOR CLEARED</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Wave Defeated</p>
        </div>
        {/* Receipt Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
           
           {/* Sheep Row */}
           <div style={{ 
             display: 'flex', alignItems: 'center',
             background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '12px 20px',
             border: '1px solid rgba(255,255,255,0.05)',
             boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3)',
             opacity: phase >= 0 ? 1 : 0, transform: phase >= 0 ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s'
           }}>
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 600, flex: 1 }}>Sheep Defeated</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1, flex: 1, textAlign: 'center' }}>
                {fmt(stats.kills)} × [ 25,000 ]
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#32d74b', flex: 1, textAlign: 'right', textShadow: '0 0 20px rgba(50, 215, 75, 0.4)' }}>
                +{fmt(displayBase)}
              </span>
           </div>

           {/* Shots Row */}
           <div style={{ 
             display: 'flex', alignItems: 'center',
             background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '12px 20px',
             border: '1px solid rgba(255,255,255,0.05)',
             boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3)',
             opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s'
           }}>
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 600, flex: 1 }}>Shots Fired</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1, flex: 1, textAlign: 'center' }}>
                {fmt(stats.shots)} × [ 5,000 ]
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ff453a', flex: 1, textAlign: 'right', textShadow: '0 0 20px rgba(255, 69, 58, 0.4)' }}>
                -{fmt(displayShotsPen)}
              </span>
           </div>

           {/* Time Row */}
           <div style={{ 
             display: 'flex', alignItems: 'center',
             background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '12px 20px',
             border: '1px solid rgba(255,255,255,0.05)',
             boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.3)',
             opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s'
           }}>
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 600, flex: 1 }}>Time Elapsed</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1, flex: 1, textAlign: 'center' }}>
                {fmt(stats.time)}s × [ 15,000 ]
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ff453a', flex: 1, textAlign: 'right', textShadow: '0 0 20px rgba(255, 69, 58, 0.4)' }}>
                -{fmt(displayTimePen)}
              </span>
           </div>

        </div>

        {/* Footer (Score Left, Action Right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
           <div style={{ 
             display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
             opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
           }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 4 }}>Total Score</span>
              <span style={{ 
                fontSize: 48, fontWeight: 800, letterSpacing: '-2px', color: '#32d74b', lineHeight: 1,
                textShadow: '0 0 40px rgba(50, 215, 75, 0.6), 0 0 10px rgba(50, 215, 75, 0.4)'
              }}>{fmt(displayScore)}</span>
           </div>

           <button 
             onClick={onRestart}
             style={{
               padding: '12px 32px',
               height: 'fit-content',
               background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
               border: '1px solid rgba(255,255,255,0.2)',
               borderRadius: 999,
               color: '#fff',
               fontSize: 14,
               fontWeight: 600,
               cursor: 'pointer',
               transition: 'all 0.3s',
               opacity: phase === 4 ? 1 : 0,
               transform: phase === 4 ? 'translateY(0)' : 'translateY(15px)',
               pointerEvents: phase === 4 ? 'auto' : 'none',
               boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
             }}
             onMouseEnter={e => {
               e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)';
               e.currentTarget.style.transform = 'translateY(-2px)';
               e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
             }}
             onMouseLeave={e => {
               e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)';
               e.currentTarget.style.transform = 'translateY(0)';
               e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
             }}
             onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
             onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
           >
             Continue
           </button>
        </div>
    </div>
  </div>
);
}

export default function TerrainGenerator({ lsKey: lsKeyProp, onClose, onStartExit, onLoadComplete }: { lsKey?: string, onClose?: () => void, onStartExit?: () => void, onLoadComplete?: () => void } = {}) {
  const [inspectorTab, setInspectorTab] = useState<'geometry' | 'lighting' | 'materials' | 'effects' | 'presets'>('geometry');
  const mountRef      = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef   = useRef<EffectComposer | null>(null);
  const bloomPassRef  = useRef<UnrealBloomPass | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef   = useRef<OrbitControls | null>(null);
  const meshGroupRef  = useRef<THREE.Group | null>(null);
  const beaconGrpRef  = useRef<THREE.Group | null>(null);
  const sheepGrpRef   = useRef<THREE.Group | null>(null);
  const flockEngineRef= useRef<FlockEngine | null>(null);
  
  // Wave System
  const waveNumberRef = useRef(1);
  const shotsFiredRef = useRef(0);
  const sheepScoreRef = useRef(0);
  const totalKillsRef = useRef(0);
  const totalTimeRef = useRef(0);
  const gameStartTimeRef = useRef(Date.now());
  const isGameOverRef = useRef(false);
  const cheatBlockRef = useRef<string | null>(null);
  const cheatBlockMeshRef = useRef<THREE.Mesh | null>(null);
  const [victoryStats, setVictoryStats] = useState<{ score: number, kills: number, shots: number, time: number, base: number } | null>(null);
  const waveUIRef = useRef<HTMLDivElement>(null);
  const mixedGrpRef   = useRef<THREE.Group | null>(null); // for mixed-geo mode
    const hexWorldGrpRef = useRef<THREE.Group | null>(null);
  const keyLightRef   = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef   = useRef<THREE.AmbientLight | null>(null);
  const hemLightRef   = useRef<THREE.HemisphereLight | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const volumetricGrpRef = useRef<THREE.Group | null>(null);
  const rimLightRef   = useRef<THREE.DirectionalLight | null>(null);
  const spotLightRef  = useRef<THREE.SpotLight | null>(null);
  
  // ── Weapons System refs ───────────────────────────────────────────────────
  const weaponProjectilesRef  = useRef<WeaponProjectile[]>([]);
  const weaponCooldownsRef    = useRef<Record<string, number>>({});

  // ── Hover glow system refs (Mesh Pool for trailing fades) ──────────────
  interface HoverPoolItem {
    mesh: THREE.Mesh;
    targetAlpha: number;
    currentAlpha: number;
    blockKey: string;
    active: boolean;
  }
  const hoverPoolRef          = useRef<HoverPoolItem[]>([]);
  const hoverCurrentlyHitRef  = useRef<string | null>(null);
  const tiltPassRef    = useRef<ShaderPass | null>(null);
  const rafRef        = useRef<number>(0);
  const fpsElRef      = useRef<HTMLSpanElement | null>(null);
  const fpsCountRef   = useRef(0);
  const fpsTRef       = useRef(0);
  const needsRenderRef  = useRef(true);
  const shadowsDirtyRef = useRef(true);
  const vigColorRef     = useRef(new THREE.Color('#000000'));
  // ── Hover glow system refs (Mesh Pool for trailing fades) ──────────────
  // ── Asteroid particle system refs ─────────────────────────────────────────
  const particlesRef      = useRef<THREE.Points | null>(null);          // THREE.Points object
  const particleDataRef   = useRef<TerrainParticle[]>([]);              // CPU particle pool
  const mouseWorld3DRef   = useRef(new THREE.Vector3());                // 3D world pos of mouse
  const particleFrameRef  = useRef(0);                                  // frame counter for particle loop
  // Per-block cooldown: Date.now() of last particle yield (key = `meshIdx_instIdx`)
  const particleCooldownRef = useRef<Map<string, number>>(new Map());
  const presetExplodeBlocksRef = useRef<Set<string>>(new Set());
  const dynamicGlowBlocksRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // ── Energon placement system refs ─────────────────────────────────────
  const slotMeshesRef   = useRef<Map<string, THREE.Mesh>>(new Map());   // key: `${altarIdx}_${slotIdx}`
  const beamMeshesRef   = useRef<Map<number, THREE.Mesh>>(new Map());   // key altarIdx
  const energonPlacedRef= useRef<Map<string, THREE.Mesh>>(new Map());   // placed energon cube meshes
  const slotsFilledRef  = useRef<boolean[][]>(Array(7).fill(null).map(()=>Array(5).fill(false)));
  const selectedEnergonRef = useRef<number | null>(null);               // which altar index is held
  const beamScaleRef    = useRef<number[]>(Array(7).fill(0));           // 0..1 animation progress

  // ── config key — per-instance so Regional Map has its own namespace ──
  const LS_KEY = lsKeyProp ?? 'arn_terrain_v1';
  const _defaultPreset =
    LS_KEY === 'arn_terrain_regional_v1' ? DEFAULT_REGIONAL_PRESET :
    LS_KEY === 'arn_terrain_city_v1'     ? DEFAULT_CITY_PRESET     : {
      gridW: 32, gridH: 32, octaves: 1, seed: 905, maxElev: 5, roughness: 1.54,
      bevel: 0.03, bloomStr: 0, bloomThresh: 0, glowInt: 0.55, opacity: 1,
      tiltBlur: 0.3, tiltSpread: 0.02, tiltVignette: 0, vigColor: '#1a001a', shadowColor: '#0a0e2a',
      layerColors: ["#00b3ff", "#e7b883", "#ff00ae", "#ae00ff", "#ffffff"],
      matTransmit: 0, matThickness: 0, matIor: 1, matRoughness: 0.14, cubeJitter: 0.5,
      shadowIntensity: 1, shadowBias: -0.01, shadowNormalBias: 0, hemIntensity: 0.46,
      shadowRadius: 3, shadowMapSize: 2048, keyLightInt: 4.4, ambientInt: 1.15,
      keyLightColor: '#c8aaff', lightElev: 13, lightAzimuth: 0, camElev: 35.26, camAzimuth: 45, camZoom: 28,
      terrainTint: '#1e7a8c', beaconCount: 0, beaconColor: '#ff6b35', beaconEmissive: 0.5,
      beaconLight: 0, beaconBury: 0, beaconSeed: 7, renderMode: 'glass',
      enabledShapes: ["box", "slab", "pillar", "cylinder", "ring"],
      partSize: 1.5, partCount: 12, partSpeed: 1, partChance: 0.85, partDecay: 0.94, partLife: 180, partFalloff: 0.0008, partLimit: 4000,
      regenSpeed: 250, regenFadeSpeed: 0.08, baseGlow: 0, hoverFade: 0.05,
      sheepCount: 25, sheepAnimate: true, sheepSize: 1.35, sheepSeed: 42, sheepSpeed: 2, sheepBounciness: 0.15, sheepBounceSpeed: 10, sheepGravity: 40, sheepExplodeForce: 25, sheepExplodeRadius: 8, sheepSeparation: 0.4, sheepCohesion: 0.1, sheepAlignment: 0.1,
      scatterCount: 26, scatterRadius: 2, scatterDepth: 3, scatterDelay: 0, scatterProjectiles: 8, scatterSpread: 2,
      artilleryRadius: 5, artilleryDepth: 7, artilleryDelay: 0,
      flyoverRadius: 7, flyoverDepth: 7, flyoverDelay: 2500, flyoverLength: 10, flyoverSpacing: 1.5,
      laserRadius: 7, laserDepth: 10, laserDuration: 1500, laserDelay: 0,
      seismicRadius: 9, seismicSpeed: 40, seismicDelay: 0, seismicDepth: 3, seismicCount: 5,
      carpetCount: 12, carpetDelay: 150, carpetRadius: 6, carpetDepth: 1, carpetRows: 3, carpetCols: 3, carpetSpacing: 2,
      blackholeDepth: 10, blackholeRadius: 13, blackholeDuration: 3000, blackholeDelay: 0
    };
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isGameboardExited, setIsGameboardExited] = useState(false);

  const handleClose = () => {
    setIsExiting(true); // Phase 1: Trigger gameboard ease-in-out-back animation
    if (onStartExit) onStartExit();
    setTimeout(() => {
      setIsGameboardExited(true); // Phase 2: Fade out UI and background
      setTimeout(() => {
        if (onClose) onClose(); // Phase 3: Unmount
      }, 500); // Wait for fade out
    }, 800); // Wait for scale out
  };

  // ── Layout tab: which panel the sidebar shows ────────────────────────────
  const [layoutTab, setLayoutTab] = useState<'procedural' | 'custom' | 'large_map'>('procedural');
  const layoutTabRef = useRef(layoutTab);
  useEffect(() => { layoutTabRef.current = layoutTab; }, [layoutTab]);
  const [isSidebarMin, setIsSidebarMin] = useState(true);

  // ── Render mode: 'glass' = InstancedMesh + MeshPhysical (current), 'mixed' = varied geometry + MeshStandard ──
  const [renderMode, setRenderMode] = useState<'glass' | 'mixed'>(_defaultPreset.renderMode ?? 'glass');
  const renderModeRef = useRef(renderMode);
  useEffect(() => { renderModeRef.current = renderMode; }, [renderMode]);
  // ── Shape library: which shapes are active in mixed mode ──────────────────
  const [enabledShapes, setEnabledShapes] = useState<Set<string>>(() => {
    const saved = _defaultPreset.enabledShapes as string[] | undefined;
    return saved?.length ? new Set(saved) : new Set(DEFAULT_ENABLED_SHAPES);
  });
  const [shapeLibraryOpen, setShapeLibraryOpen] = useState(true);

  // Config
  const [gridW,       setGridW]       = useState<number>(_defaultPreset.gridW      ?? 48);
  const [gridH,       setGridH]       = useState<number>(_defaultPreset.gridH      ?? 48);
  const [octaves,     setOctaves]     = useState<number>(_defaultPreset.octaves    ?? 2);
  const [seed,        setSeed]        = useState<number>(_defaultPreset.seed       ?? 42);
  const [maxElev,     setMaxElev]     = useState<number>(_defaultPreset.maxElev    ?? 3);
  const [roughness,   setRoughness]   = useState<number>(_defaultPreset.roughness  ?? 1.5);
  const [bevel,       setBevel]       = useState<number>(_defaultPreset.bevel      ?? 0.08);
  const [bloomStr,    setBloomStr]    = useState<number>(_defaultPreset.bloomStr      ?? 0.5);
  const [bloomThresh, setBloomThresh] = useState<number>(_defaultPreset.bloomThresh   ?? 0.85);
  const [glowInt,     setGlowInt]     = useState<number>(_defaultPreset.glowInt       ?? 0.2);
  const [baseGlow,    setBaseGlow]    = useState<number>(_defaultPreset.baseGlow      ?? 0.1);
  const [hoverFade,   _setHoverFade]  = useState<number>(_defaultPreset.hoverFade     ?? 0.07);
  const hoverFadeRef = useRef(hoverFade);
  const setHoverFade = (v: number) => { _setHoverFade(v); hoverFadeRef.current = v; };
  const [opacity,     setOpacity]     = useState<number>(_defaultPreset.opacity       ?? 0.88);
  const [tiltBlur,     setTiltBlur]    = useState<number>(_defaultPreset.tiltBlur     ?? 1.5);  // default to visible blur
  const [tiltSpread,   setTiltSpread]  = useState<number>(_defaultPreset.tiltSpread   ?? 0.035); // bokeh radius per unit
  const [tiltVignette, setTiltVignette]= useState<number>(_defaultPreset.tiltVignette ?? 0.4);
  const [vigColor,     setVigColor]    = useState<string>(_defaultPreset.vigColor      ?? '#ffffff');
  const [shadowColor,  setShadowColor] = useState<string>(_defaultPreset.shadowColor   ?? '#0a0e2a'); // cool-dark shadow fill
  // Per-layer colours (live-updatable without full terrain rebuild)
  const [layerColors, setLayerColors] = useState<string[]>(
    _defaultPreset.layerColors?.length === 5 ? _defaultPreset.layerColors : [...DEFAULT_LAYER_COLORS]
  );
  // Transmission glass material
  const [matTransmit, setMatTransmit] = useState<number>(_defaultPreset.matTransmit ?? 0.0);
  const [matThickness,setMatThickness]= useState<number>(_defaultPreset.matThickness ?? 0.5);
  const [matIor,      setMatIor]      = useState<number>(_defaultPreset.matIor       ?? 1.5);
  const [matRoughness,setMatRoughness]= useState<number>(_defaultPreset.matRoughness  ?? 0.85);
  const [cubeJitter,  setCubeJitter]  = useState<number>(_defaultPreset.cubeJitter    ?? 0.0);
  // Shadow intensity (separate from ambient — how dark the shadow itself is)
  const [shadowIntensity, setShadowIntensity] = useState<number>(_defaultPreset.shadowIntensity ?? 0.8);
  const [shadowBias,       setShadowBias]       = useState<number>(_defaultPreset.shadowBias       ?? -0.001);
  const [shadowNormalBias, setShadowNormalBias] = useState<number>(_defaultPreset.shadowNormalBias ?? 0.15);
  const [hemIntensity,    setHemIntensity]    = useState<number>(_defaultPreset.hemIntensity    ?? 0.5);
  // Shadow & lighting
  const [shadowRadius,  setShadowRadius]  = useState<number>(_defaultPreset.shadowRadius  ?? 4);
  const [shadowMapSize, setShadowMapSize] = useState<number>(_defaultPreset.shadowMapSize ?? (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 512 : 1024));
  const [keyLightInt,   setKeyLightInt]   = useState<number>(_defaultPreset.keyLightInt   ?? 0.5);
  const [ambientInt,    setAmbientInt]    = useState<number>(_defaultPreset.ambientInt    ?? 0.18);
  const [keyLightColor, setKeyLightColor] = useState<string>(_defaultPreset.keyLightColor ?? '#a8d8ff');
  const [lightElev,     setLightElev]     = useState<number>(_defaultPreset.lightElev     ?? 55);  // degrees
  const [lightAzimuth,  setLightAzimuth]  = useState<number>(_defaultPreset.lightAzimuth  ?? 40);  // degrees
  
  // Spotlight
  const [spotEnabled, setSpotEnabled] = useState<boolean>(_defaultPreset.spotEnabled ?? false);
  const [spotInt,     setSpotInt]     = useState<number>(_defaultPreset.spotInt     ?? 2.0);
  const [spotColor,   setSpotColor]   = useState<string>(_defaultPreset.spotColor   ?? '#ffffff');
  const [spotAngle,   setSpotAngle]   = useState<number>(_defaultPreset.spotAngle   ?? 30);
  const [spotPenumbra,setSpotPenumbra]= useState<number>(_defaultPreset.spotPenumbra?? 0.5);

  // OmniLight (cheap fill light)
  const [omniInt,   setOmniInt]   = useState<number>(_defaultPreset.omniInt ?? 0.5);
  const [omniColor, setOmniColor] = useState<string>(_defaultPreset.omniColor ?? '#ffffff');
  const [omniY,     setOmniY]     = useState<number>(_defaultPreset.omniY ?? 15);
  // ── Camera angle controls ─────────────────────────────────────────────────
  const [camElev,    setCamElev]    = useState<number>(_defaultPreset.camElev    ?? 35.26); // 0=horizon, 90=top-down
  const [camAzimuth, setCamAzimuth] = useState<number>(_defaultPreset.camAzimuth ?? 45);   // 0-360 degrees
  const [camZoom,    setCamZoom]    = useState<number>(_defaultPreset.camZoom    ?? 28);    // orthographic frustum half-size
  // Terrain appearance
  const [terrainTint,   setTerrainTint]   = useState<string>(_defaultPreset.terrainTint   ?? '#1e7a8c');
  const [status,      setStatus]      = useState<string>('Click Generate to build terrain');
  const [saved,       setSaved]       = useState(false);

  // Beacon config
  const [beaconCount,    setBeaconCount]    = useState<number>(_defaultPreset.beaconCount    ?? 6);
  const [beaconColor,    setBeaconColor]    = useState<string>(_defaultPreset.beaconColor    ?? '#ff6b35');
  const [beaconEmissive, setBeaconEmissive] = useState<number>(_defaultPreset.beaconEmissive ?? 3.5);
  const [beaconLight,    setBeaconLight]    = useState<number>(_defaultPreset.beaconLight    ?? 1.2);
  const [beaconBury,     setBeaconBury]     = useState<number>(_defaultPreset.beaconBury     ?? 3);
  const [beaconSeed,     setBeaconSeed]     = useState<number>(_defaultPreset.beaconSeed     ?? 7);

  // Sheep config
  const [sheepCount, setSheepCount] = useState<number>(_defaultPreset.sheepCount ?? 50);
  const [sheepAnimate, setSheepAnimate] = useState<boolean>(_defaultPreset.sheepAnimate ?? true);
  const [sheepSize,  setSheepSize]  = useState<number>(_defaultPreset.sheepSize  ?? 2.0);
  const [sheepSeed,  setSheepSeed]  = useState<number>(_defaultPreset.sheepSeed  ?? 42);
  const [sheepSpeed, setSheepSpeed] = useState<number>(_defaultPreset.sheepSpeed ?? 2.0);
  const [sheepBounciness, setSheepBounciness] = useState<number>(_defaultPreset.sheepBounciness ?? 0.15);
  const [sheepBounceSpeed, setSheepBounceSpeed] = useState<number>(_defaultPreset.sheepBounceSpeed ?? 10.0);
  const [sheepGravity, setSheepGravity] = useState<number>(_defaultPreset.sheepGravity ?? 40.0);
  const [sheepExplodeForce, setSheepExplodeForce] = useState<number>(_defaultPreset.sheepExplodeForce ?? 25.0);
  const [sheepExplodeRadius, setSheepExplodeRadius] = useState<number>(_defaultPreset.sheepExplodeRadius ?? 8.0);
  const [sheepSeparation, setSheepSeparation] = useState<number>(_defaultPreset.sheepSeparation ?? 0.4);
  const [sheepCohesion, setSheepCohesion] = useState<number>(_defaultPreset.sheepCohesion ?? 0.1);
  const [sheepAlignment, setSheepAlignment] = useState<number>(_defaultPreset.sheepAlignment ?? 0.1);

  // Particles config
  const [partSize,    setPartSize]    = useState<number>(_defaultPreset.partSize    ?? 1.5);
  const [partCount,   setPartCount]   = useState<number>(_defaultPreset.partCount   ?? 12);
  const [partSpeed,   setPartSpeed]   = useState<number>(_defaultPreset.partSpeed   ?? 1.0);
  const [partChance,  setPartChance]  = useState<number>(_defaultPreset.partChance  ?? 0.85);

  const [partDecay,   setPartDecay]   = useState<number>(_defaultPreset.partDecay   ?? 0.94);
  const [partLife,    setPartLife]    = useState<number>(_defaultPreset.partLife    ?? 180);
  const [partFalloff, setPartFalloff] = useState<number>(_defaultPreset.partFalloff ?? 0.0008);
  const [partLimit,   setPartLimit]   = useState<number>(_defaultPreset.partLimit   ?? 4000);

  const partCountRef = useRef(partCount);   useEffect(() => { partCountRef.current = partCount; }, [partCount]);
  const partSpeedRef = useRef(partSpeed);   useEffect(() => { partSpeedRef.current = partSpeed; }, [partSpeed]);
  const partLimitRef = useRef(partLimit);   useEffect(() => { partLimitRef.current = partLimit; }, [partLimit]);
  const partDecayRef = useRef(partDecay);   useEffect(() => { partDecayRef.current = partDecay; }, [partDecay]);
  const partFalloffRef = useRef(partFalloff); useEffect(() => { partFalloffRef.current = partFalloff; }, [partFalloff]);
  const partLifeRef = useRef(partLife);     useEffect(() => { partLifeRef.current = partLife; }, [partLife]);

  const [regenSpeed, setRegenSpeed] = useState<number>(0);
  const [regenFadeSpeed, setRegenFadeSpeed] = useState<number>(0.08);
  const regenSpeedRef = useRef(regenSpeed); useEffect(() => { regenSpeedRef.current = regenSpeed; }, [regenSpeed]);
  const regenFadeSpeedRef = useRef(regenFadeSpeed); useEffect(() => { regenFadeSpeedRef.current = regenFadeSpeed; }, [regenFadeSpeed]);
  const regeneratingBlocksRef = useRef<Map<string, { scale: number, fast?: boolean }>>(new Map());

  type WeaponType = 'scatter' | 'artillery' | 'flyover' | 'laser' | 'seismic' | 'carpet' | 'blackhole' | null;
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('scatter');
  const [settingsWeapon, setSettingsWeapon] = useState<WeaponType>(null);
  const selectedWeaponRef = useRef<WeaponType>(null);
  const [altarGlow,       setAltarGlow]       = useState<number[]>(Array(7).fill(1.0));
  const [altarOcclude,    setAltarOcclude]    = useState<boolean[]>(Array(7).fill(false));
  // ── Energon placement UI state ────────────────────────────────────────
  const [selectedEnergon, setSelectedEnergon] = useState<number | null>(null);
  const [slotsFilled,     setSlotsFilled]     = useState<boolean[][]>(() => Array(7).fill(null).map(()=>Array(5).fill(false)));

  // ── Treasure Hunters Mode State ────────────────────────────────────────
  const [isTreasureMode, setIsTreasureMode]   = useState(false);
  const isTreasureModeRef = useRef(false);
  useEffect(() => { isTreasureModeRef.current = isTreasureMode; }, [isTreasureMode]);

  const [shuffleStartTime, setShuffleStartTime] = useState(0);
  const shuffleStartTimeRef = useRef(0);
  useEffect(() => { shuffleStartTimeRef.current = shuffleStartTime; }, [shuffleStartTime]);

  // ── Raid Mode State ────────────────────────────────────────
  const [isRaidMode, setIsRaidMode] = useState(true);
  const [showRaidPhysics, setShowRaidPhysics] = useState(false);
  const [showRaidPanel, setShowRaidPanel] = useState(true);
  const [showRaidRegen, setShowRaidRegen] = useState(false);
  const isRaidModeRef = useRef(false);
  useEffect(() => { isRaidModeRef.current = isRaidMode; }, [isRaidMode]);
  

  useEffect(() => { selectedWeaponRef.current = selectedWeapon; }, [selectedWeapon]);

  // Weapon parameters
  const [scatterCount, setScatterCount] = useState(8);
  const scatterCountRef = useRef(scatterCount);
  useEffect(() => { scatterCountRef.current = scatterCount; }, [scatterCount]);

  const [scatterRadius, setScatterRadius] = useState(3);
  const scatterRadiusRef = useRef(scatterRadius);
  useEffect(() => { scatterRadiusRef.current = scatterRadius; }, [scatterRadius]);

  const [scatterDepth, setScatterDepth] = useState(3);
  const scatterDepthRef = useRef(scatterDepth);
  useEffect(() => { scatterDepthRef.current = scatterDepth; }, [scatterDepth]);

  const [scatterDelay, setScatterDelay] = useState(0);
  const scatterDelayRef = useRef(scatterDelay);
  useEffect(() => { scatterDelayRef.current = scatterDelay; }, [scatterDelay]);

  const [artilleryRadius, setArtilleryRadius] = useState(3);
  const artilleryRadiusRef = useRef(artilleryRadius);
  useEffect(() => { artilleryRadiusRef.current = artilleryRadius; }, [artilleryRadius]);

  const [artilleryDepth, setArtilleryDepth] = useState(4);
  const artilleryDepthRef = useRef(artilleryDepth);
  useEffect(() => { artilleryDepthRef.current = artilleryDepth; }, [artilleryDepth]);

  const [artilleryDelay, setArtilleryDelay] = useState(0);
  const artilleryDelayRef = useRef(artilleryDelay);
  useEffect(() => { artilleryDelayRef.current = artilleryDelay; }, [artilleryDelay]);

  const [flyoverRadius, setFlyoverRadius] = useState(5);
  const flyoverRadiusRef = useRef(flyoverRadius);
  useEffect(() => { flyoverRadiusRef.current = flyoverRadius; }, [flyoverRadius]);

  const [flyoverDepth, setFlyoverDepth] = useState(5);
  const flyoverDepthRef = useRef(flyoverDepth);
  useEffect(() => { flyoverDepthRef.current = flyoverDepth; }, [flyoverDepth]);

  const [flyoverDelay, setFlyoverDelay] = useState(2500);
  const flyoverDelayRef = useRef(flyoverDelay);
  useEffect(() => { flyoverDelayRef.current = flyoverDelay; }, [flyoverDelay]);

  // New Weapons state
  const [laserRadius, setLaserRadius] = useState(4);
  const laserRadiusRef = useRef(laserRadius);
  useEffect(() => { laserRadiusRef.current = laserRadius; }, [laserRadius]);

  const [laserDepth, setLaserDepth] = useState(10);
  const laserDepthRef = useRef(laserDepth);
  useEffect(() => { laserDepthRef.current = laserDepth; }, [laserDepth]);

  const [laserDuration, setLaserDuration] = useState(1500);
  const laserDurationRef = useRef(laserDuration);
  useEffect(() => { laserDurationRef.current = laserDuration; }, [laserDuration]);

  const [laserDelay, setLaserDelay] = useState(0);
  const laserDelayRef = useRef(laserDelay);
  useEffect(() => { laserDelayRef.current = laserDelay; }, [laserDelay]);

  const [seismicRadius, setSeismicRadius] = useState(8);
  const seismicRadiusRef = useRef(seismicRadius);
  useEffect(() => { seismicRadiusRef.current = seismicRadius; }, [seismicRadius]);

  const [seismicSpeed, setSeismicSpeed] = useState(40);
  const seismicSpeedRef = useRef(seismicSpeed);
  useEffect(() => { seismicSpeedRef.current = seismicSpeed; }, [seismicSpeed]);

  const [seismicDelay, setSeismicDelay] = useState(0);
  const seismicDelayRef = useRef(seismicDelay);
  useEffect(() => { seismicDelayRef.current = seismicDelay; }, [seismicDelay]);

  const [carpetCount, setCarpetCount] = useState(12);
  const carpetCountRef = useRef(carpetCount);
  useEffect(() => { carpetCountRef.current = carpetCount; }, [carpetCount]);

  const [carpetDelay, setCarpetDelay] = useState(150);
  const carpetDelayRef = useRef(carpetDelay);
  useEffect(() => { carpetDelayRef.current = carpetDelay; }, [carpetDelay]);

  const [seismicDepth, setSeismicDepth] = useState(3);
  const seismicDepthRef = useRef(seismicDepth);
  useEffect(() => { seismicDepthRef.current = seismicDepth; }, [seismicDepth]);

  const [carpetRadius, setCarpetRadius] = useState(4);
  const carpetRadiusRef = useRef(carpetRadius);
  useEffect(() => { carpetRadiusRef.current = carpetRadius; }, [carpetRadius]);

  const [carpetDepth, setCarpetDepth] = useState(4);
  const carpetDepthRef = useRef(carpetDepth);
  useEffect(() => { carpetDepthRef.current = carpetDepth; }, [carpetDepth]);

  const [blackholeDepth, setBlackholeDepth] = useState(10);
  const blackholeDepthRef = useRef(blackholeDepth);
  useEffect(() => { blackholeDepthRef.current = blackholeDepth; }, [blackholeDepth]);

  const [blackholeRadius, setBlackholeRadius] = useState(8);
  const blackholeRadiusRef = useRef(blackholeRadius);
  useEffect(() => { blackholeRadiusRef.current = blackholeRadius; }, [blackholeRadius]);

  const [blackholeDuration, setBlackholeDuration] = useState(3000);
  const blackholeDurationRef = useRef(blackholeDuration);
  useEffect(() => { blackholeDurationRef.current = blackholeDuration; }, [blackholeDuration]);

  const [blackholeDelay, setBlackholeDelay] = useState(0);

  // Missing Payload configs
  const [scatterProjectiles, setScatterProjectiles] = useState(8);
  const [scatterSpread, setScatterSpread] = useState(2);
  const [flyoverLength, setFlyoverLength] = useState(10);
  const [flyoverSpacing, setFlyoverSpacing] = useState(1.5);
  const [seismicCount, setSeismicCount] = useState(5);
  const [carpetRows, setCarpetRows] = useState(3);
  const [carpetCols, setCarpetCols] = useState(3);
  const [carpetSpacing, setCarpetSpacing] = useState(2);
  const blackholeDelayRef = useRef(blackholeDelay);
  useEffect(() => { blackholeDelayRef.current = blackholeDelay; }, [blackholeDelay]);

  const [brokenBlocks, setBrokenBlocks]       = useState<Set<string>>(new Set());
  const brokenBlocksRef = useRef<Set<string>>(brokenBlocks);
  const [isHealingMode, setIsHealingMode] = useState(false);
  const isHealingRef = useRef(false);
  const isTransitioningWaveRef = useRef(false);
  const announcerElRef = useRef<HTMLDivElement>(null);
  useEffect(() => { isHealingRef.current = isHealingMode; }, [isHealingMode]);
  useEffect(() => { brokenBlocksRef.current = brokenBlocks; }, [brokenBlocks]);

  // Cinematic Wave Announcer
  const announceWave = useCallback((wave: number, count: number) => {
      isTransitioningWaveRef.current = true;
      const el = announcerElRef.current;
      if (el) {
          const showText = (txt: string, duration: number) => {
              return new Promise<void>(resolve => {
                  el.style.transition = 'none';
                  el.style.transform = 'translate(-50%, -50%) scale(0.8)';
                  el.style.opacity = '0';
                  void el.offsetHeight;
                  el.style.transition = 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)';
                  el.innerText = txt;
                  el.style.opacity = '1';
                  el.style.transform = 'translate(-50%, -50%) scale(1)';
                  setTimeout(() => {
                      el.style.opacity = '0';
                      el.style.transform = 'translate(-50%, -50%) scale(1.1)';
                      setTimeout(resolve, 250);
                  }, duration);
              });
          };
          (async () => {
              await showText(`WAVE ${wave}`, 600);
              await showText(`2`, 250);
              await showText(`1`, 250);
              if (flockEngineRef.current) flockEngineRef.current.spawnWave(count);
              isTransitioningWaveRef.current = false;
          })();
      } else {
          if (flockEngineRef.current) flockEngineRef.current.spawnWave(count);
          isTransitioningWaveRef.current = false;
      }
  }, []);

  // Load config from CMS API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cms?key=${LS_KEY}&t=${Date.now()}`);
        const json = await res.json();
        if (json.success && json.data) {
          const s = json.data;
          if (s.renderMode !== undefined) setRenderMode(s.renderMode);
          if (s.enabledShapes !== undefined) setEnabledShapes(new Set(s.enabledShapes));
          if (s.gridW !== undefined) setGridW(s.gridW);
          if (s.gridH !== undefined) setGridH(s.gridH);
          if (s.octaves !== undefined) setOctaves(s.octaves);
          if (s.seed !== undefined) setSeed(s.seed);
          if (s.maxElev !== undefined) setMaxElev(s.maxElev);
          if (s.roughness !== undefined) setRoughness(s.roughness);
          if (s.bevel !== undefined) setBevel(s.bevel);
          if (s.bloomStr !== undefined) setBloomStr(s.bloomStr);
          if (s.bloomThresh !== undefined) setBloomThresh(s.bloomThresh);
          if (s.glowInt !== undefined) setGlowInt(s.glowInt);
          if (s.baseGlow !== undefined) setBaseGlow(s.baseGlow);
          if (s.hoverFade !== undefined) setHoverFade(s.hoverFade);
          if (s.opacity !== undefined) setOpacity(s.opacity);
          if (s.tiltBlur !== undefined) setTiltBlur(s.tiltBlur);
          if (s.tiltSpread !== undefined) setTiltSpread(s.tiltSpread);
          if (s.tiltVignette !== undefined) setTiltVignette(s.tiltVignette);
          if (s.vigColor !== undefined) setVigColor(s.vigColor);
          if (s.shadowColor !== undefined) setShadowColor(s.shadowColor);
          if (s.layerColors !== undefined && s.layerColors.length === 5) setLayerColors(s.layerColors);
          if (s.matTransmit !== undefined) setMatTransmit(s.matTransmit);
          if (s.matThickness !== undefined) setMatThickness(s.matThickness);
          if (s.matIor !== undefined) setMatIor(s.matIor);
          if (s.matRoughness !== undefined) setMatRoughness(s.matRoughness);
          if (s.cubeJitter !== undefined) setCubeJitter(s.cubeJitter);
          if (s.shadowIntensity !== undefined) setShadowIntensity(s.shadowIntensity);
          if (s.shadowBias !== undefined) setShadowBias(s.shadowBias);
          if (s.shadowNormalBias !== undefined) setShadowNormalBias(s.shadowNormalBias);
          if (s.hemIntensity !== undefined) setHemIntensity(s.hemIntensity);
          if (s.shadowRadius !== undefined) setShadowRadius(s.shadowRadius);
          if (s.shadowMapSize !== undefined) setShadowMapSize(s.shadowMapSize);
          if (s.keyLightInt !== undefined) setKeyLightInt(s.keyLightInt);
          if (s.ambientInt !== undefined) setAmbientInt(s.ambientInt);
          if (s.keyLightColor !== undefined) setKeyLightColor(s.keyLightColor);
          if (s.lightElev !== undefined) setLightElev(s.lightElev);
          if (s.lightAzimuth !== undefined) setLightAzimuth(s.lightAzimuth);
          if (s.camElev !== undefined) setCamElev(s.camElev);
          if (s.camAzimuth !== undefined) setCamAzimuth(s.camAzimuth);
          if (s.camZoom !== undefined) setCamZoom(s.camZoom);
          if (s.terrainTint !== undefined) setTerrainTint(s.terrainTint);
          if (s.beaconCount !== undefined) setBeaconCount(s.beaconCount);
          if (s.beaconColor !== undefined) setBeaconColor(s.beaconColor);
          if (s.beaconEmissive !== undefined) setBeaconEmissive(s.beaconEmissive);
          if (s.beaconLight !== undefined) setBeaconLight(s.beaconLight);
          if (s.beaconBury !== undefined) setBeaconBury(s.beaconBury);
          if (s.beaconSeed !== undefined) setBeaconSeed(s.beaconSeed);
          if (s.sheepCount !== undefined) setSheepCount(s.sheepCount);
          if (s.sheepAnimate !== undefined) setSheepAnimate(s.sheepAnimate);
          if (s.sheepSize !== undefined) setSheepSize(s.sheepSize);
          if (s.sheepSeed !== undefined) setSheepSeed(s.sheepSeed);
          if (s.sheepSpeed !== undefined) setSheepSpeed(s.sheepSpeed);
          if (s.sheepBounciness !== undefined) setSheepBounciness(s.sheepBounciness);
          if (s.sheepBounceSpeed !== undefined) setSheepBounceSpeed(s.sheepBounceSpeed);
          if (s.sheepGravity !== undefined) setSheepGravity(s.sheepGravity);
          if (s.sheepExplodeForce !== undefined) setSheepExplodeForce(s.sheepExplodeForce);
          if (s.sheepExplodeRadius !== undefined) setSheepExplodeRadius(s.sheepExplodeRadius);
          if (s.sheepSeparation !== undefined) setSheepSeparation(s.sheepSeparation);
          if (s.sheepCohesion !== undefined) setSheepCohesion(s.sheepCohesion);
          if (s.sheepAlignment !== undefined) setSheepAlignment(s.sheepAlignment);
          if (s.partSize !== undefined) setPartSize(s.partSize);
          if (s.partCount !== undefined) setPartCount(s.partCount);
          if (s.partSpeed !== undefined) setPartSpeed(s.partSpeed);
          if (s.partChance !== undefined) setPartChance(s.partChance);
          if (s.partDecay !== undefined) setPartDecay(s.partDecay);
          if (s.partLife !== undefined) setPartLife(s.partLife);
          if (s.partFalloff !== undefined) setPartFalloff(s.partFalloff);
          if (s.brokenBlocks !== undefined) setBrokenBlocks(new Set(s.brokenBlocks));
          if (s.regenSpeed !== undefined) setRegenSpeed(s.regenSpeed);
          if (s.regenFadeSpeed !== undefined) setRegenFadeSpeed(s.regenFadeSpeed);
          if (s.scatterCount !== undefined) setScatterCount(s.scatterCount);
          if (s.scatterRadius !== undefined) setScatterRadius(s.scatterRadius);
          if (s.scatterDepth !== undefined) setScatterDepth(s.scatterDepth);
          if (s.scatterDelay !== undefined) setScatterDelay(s.scatterDelay);
          if (s.artilleryRadius !== undefined) setArtilleryRadius(s.artilleryRadius);
          if (s.artilleryDepth !== undefined) setArtilleryDepth(s.artilleryDepth);
          if (s.artilleryDelay !== undefined) setArtilleryDelay(s.artilleryDelay);
          if (s.flyoverRadius !== undefined) setFlyoverRadius(s.flyoverRadius);
          if (s.flyoverDepth !== undefined) setFlyoverDepth(s.flyoverDepth);
          if (s.flyoverDelay !== undefined) setFlyoverDelay(s.flyoverDelay);
          if (s.laserRadius !== undefined) setLaserRadius(s.laserRadius);
          if (s.laserDepth !== undefined) setLaserDepth(s.laserDepth);
          if (s.laserDuration !== undefined) setLaserDuration(s.laserDuration);
          if (s.laserDelay !== undefined) setLaserDelay(s.laserDelay);
          if (s.seismicRadius !== undefined) setSeismicRadius(s.seismicRadius);
          if (s.seismicSpeed !== undefined) setSeismicSpeed(s.seismicSpeed);
          if (s.seismicDelay !== undefined) setSeismicDelay(s.seismicDelay);
          if (s.seismicDepth !== undefined) setSeismicDepth(s.seismicDepth);
          if (s.carpetCount !== undefined) setCarpetCount(s.carpetCount);
          if (s.carpetDelay !== undefined) setCarpetDelay(s.carpetDelay);
          if (s.carpetRadius !== undefined) setCarpetRadius(s.carpetRadius);
          if (s.carpetDepth !== undefined) setCarpetDepth(s.carpetDepth);
          if (s.blackholeDepth !== undefined) setBlackholeDepth(s.blackholeDepth);
          if (s.blackholeRadius !== undefined) setBlackholeRadius(s.blackholeRadius);
          if (s.blackholeDuration !== undefined) setBlackholeDuration(s.blackholeDuration);
          if (s.blackholeDelay !== undefined) setBlackholeDelay(s.blackholeDelay);
          if (s.partLimit !== undefined) setPartLimit(s.partLimit);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoaded(true);
        if (onLoadComplete) onLoadComplete();
      }
    };
    load();
  }, [LS_KEY]);

  // ── Auto-save settings whenever any param changes ────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    try {
      fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: LS_KEY,
          data: {
            gridW, gridH, octaves, seed, maxElev, roughness,
            bevel, bloomStr, bloomThresh, glowInt, baseGlow, hoverFade, opacity,
            tiltBlur, tiltSpread, tiltVignette, vigColor, shadowColor,
            layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, shadowIntensity, shadowBias, shadowNormalBias, hemIntensity,
            shadowRadius, shadowMapSize, keyLightInt, ambientInt, keyLightColor, lightElev, lightAzimuth,
            camElev, camAzimuth, camZoom,
            terrainTint,
            beaconCount, beaconColor, beaconEmissive, beaconLight, beaconBury, beaconSeed,
            sheepCount, sheepAnimate, sheepSize, sheepSeed, sheepSpeed, sheepBounciness, sheepBounceSpeed, sheepGravity, sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment,
            partSize, partCount, partSpeed, partChance, partDecay, partLife, partFalloff, partLimit,
            regenSpeed, regenFadeSpeed,
            scatterCount, scatterRadius, scatterDepth, scatterDelay, scatterProjectiles, scatterSpread,
            artilleryRadius, artilleryDepth, artilleryDelay,
            flyoverRadius, flyoverDepth, flyoverDelay, flyoverLength, flyoverSpacing,
            laserRadius, laserDepth, laserDuration, laserDelay,
            seismicRadius, seismicSpeed, seismicDelay, seismicDepth, seismicCount,
            carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing,
            blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay,
            renderMode,
            enabledShapes: [...enabledShapes],
            brokenBlocks: [...brokenBlocks],
          }
        })
      }).catch(e => console.error(e));
    } catch (e) {}
  }, [gridW, gridH, octaves, seed, maxElev, roughness,
      bevel, bloomStr, bloomThresh, glowInt, baseGlow, hoverFade, opacity,
      tiltBlur, tiltSpread, tiltVignette, vigColor, shadowColor,
      layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, shadowIntensity, shadowBias, shadowNormalBias, hemIntensity,
      shadowRadius, shadowMapSize, keyLightInt, ambientInt, keyLightColor, lightElev, lightAzimuth,
      camElev, camAzimuth, camZoom,
      terrainTint,
      beaconCount, beaconColor, beaconEmissive, beaconLight, beaconBury, beaconSeed,
      sheepCount, sheepAnimate, sheepSize, sheepSeed, sheepSpeed, sheepBounciness, sheepBounceSpeed, sheepGravity, sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment,
      partSize, partCount, partSpeed, partChance, partDecay, partLife, partFalloff, partLimit,
      regenSpeed, regenFadeSpeed,
      scatterCount, scatterRadius, scatterDepth, scatterDelay, scatterProjectiles, scatterSpread,
      artilleryRadius, artilleryDepth, artilleryDelay,
      flyoverRadius, flyoverDepth, flyoverDelay, flyoverLength, flyoverSpacing,
      laserRadius, laserDepth, laserDuration, laserDelay,
      seismicRadius, seismicSpeed, seismicDelay, seismicDepth, seismicCount,
      carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing,
      blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay,
      renderMode, enabledShapes, brokenBlocks, isLoaded, LS_KEY]);

  // Terrain data (heightmap)
  const terrainRef = useRef<number[][]>([]);
  const [terrain,  setTerrain]  = useState<number[][]>([]);

  const pickPresetBlocks = useCallback((heights: number[][], currentSeed: number) => {
    const allKeys: string[] = [];
    for (let gy = 0; gy < heights.length; gy++) {
      for (let gx = 0; gx < (heights[gy]?.length || 0); gx++) {
        const cellH = heights[gy][gx] ?? 1;
        if (cellH > 0) allKeys.push(`${gx}_${gy}_${cellH - 1}`);
      }
    }
    const localRand = lcg(currentSeed * 7);
    const shuffled = [...allKeys].sort(() => localRand() - 0.5);
    presetExplodeBlocksRef.current = new Set(shuffled.slice(0, 5));
  }, []);

  const getFreeParticle = () => {
    const limit = Math.min(partLimitRef.current, TERRAIN_MAX_PARTICLES);
    const pd = particleDataRef.current;
    for (let i = 0; i < limit; i++) {
       if (!pd[i].alive) return pd[i];
    }
    return undefined;
  };

  const triggerWeaponImpact = useCallback((hx: number, hy: number, hz: number, radius: number, depth: number) => {
    // 1. Sheep physical blast wave response
    if (flockEngineRef.current) {
         const conf = flockEngineRef.current.config;
         // Use the larger of the weapon's radius or the UI physics override radius
         const blastRadius = Math.max(radius * 2.0, conf.explodeRadius);
         flockEngineRef.current.explode(hx, hz, conf.explodeForce, blastRadius);
    }
    
    // 2. Gather keys
    const toBreak = new Set<string>();
    const tr = terrainRef.current;
    if (!tr || !tr.length) return;
    const h = tr.length;
    const w = tr[0]?.length || 0;
    
    const offsetX = -w / 2;
    const offsetZ = -h / 2;
    const gxCenter = Math.round(hx - offsetX);
    const gzCenter = Math.round(hz - offsetZ);

    const radInt = Math.ceil(radius);
    for (let dx = -radInt; dx <= radInt; dx++) {
      for (let dz = -radInt; dz <= radInt; dz++) {
        if (Math.sqrt(dx*dx + dz*dz) <= radius) {
          const gxRaw = gxCenter + dx;
          const gyRaw = gzCenter + dz;
          const isLargeMap = layoutTabRef.current === 'large_map';
          
          const gx = isLargeMap ? ((gxRaw % w) + w) % w : gxRaw;
          const gy = isLargeMap ? ((gyRaw % h) + h) % h : gyRaw;

          if (gy >= 0 && gy < h && gx >= 0 && gx < w) {
            const cellH = tr[gy][gx] ?? 1;
            // Find the highest UNBROKEN block
            let topUnbrokenH = -1;
            for (let hTest = cellH - 1; hTest >= 0; hTest--) {
               const targetKey = isLargeMap ? `${gxRaw}_${gyRaw}_${hTest}` : `${gx}_${gy}_${hTest}`;
               if (!brokenBlocksRef.current.has(targetKey)) {
                  topUnbrokenH = hTest;
                  break;
               }
            }
            
            // Break downward 'depth' blocks starting from the actual top surface
            if (topUnbrokenH >= 0) {
               for (let dy = 0; dy < depth; dy++) {
                 const bH = topUnbrokenH - dy;
                 if (bH >= 0) {
                   toBreak.add(isLargeMap ? `${gxRaw}_${gyRaw}_${bH}` : `${gx}_${gy}_${bH}`);
                 }
               }
            }
            if (topUnbrokenH >= 0) {
               for (let dy = 0; dy < depth; dy++) {
                 const bH = topUnbrokenH - dy;
                 if (bH >= 0) {
                    const targetKey = isLargeMap ? `${gxRaw}_${gyRaw}_${bH}` : `${gx}_${gy}_${bH}`;
                    toBreak.add(targetKey);
                 }
               }
            }
          }
        }
      }
    }
    
    // Short-circuit optimization: if nothing here is new, skip full O(N) lookup.
    let hasNewBreaks = false;
    for (const k of toBreak) {
      if (!brokenBlocksRef.current.has(k)) {
        hasNewBreaks = true;
        break;
      }
    }
    if (!hasNewBreaks) return;

    setBrokenBlocks(prev => {
      const next = new Set(prev);
      toBreak.forEach(k => next.add(k));
      return next;
    });

    const targetGroup = renderModeRef.current === 'glass' ? meshGroupRef.current : mixedGrpRef.current;

    // Check auto-win cheat block!
    for (const k of toBreak) {
      if (k === cheatBlockRef.current) {
        // Auto-win triggered!
        if (cheatBlockMeshRef.current && targetGroup) {
            targetGroup.remove(cheatBlockMeshRef.current);
            cheatBlockMeshRef.current = null;
        }
        isGameOverRef.current = true;
        const cheatBase = 50 * 25000;
        const shotsPen = shotsFiredRef.current * 5000;
        const timePen = totalTimeRef.current * 15000;
        setVictoryStats({
            score: Math.max(0, cheatBase - shotsPen - timePen),
            kills: 50,
            shots: shotsFiredRef.current,
            time: totalTimeRef.current,
            base: cheatBase
        });
        cheatBlockRef.current = null;
        return;
      }
    }

    if (!targetGroup) return;

    for (const c of targetGroup.children) {
       if (c instanceof THREE.InstancedMesh && !c.userData.isJitterGlow) {
         if (c.userData.coordIndexMap) {
            const indexMap = c.userData.coordIndexMap as Map<string, number>;
            for (const k of toBreak) {
               if (brokenBlocksRef.current.has(k)) continue;
               const i = indexMap.get(k);
               if (i !== undefined) {
                  // Isolate destruction purely to the global offset instance
                  const _dummyMat = new THREE.Matrix4();
                  c.getMatrixAt(i, _dummyMat);
                  _dummyMat.elements[0] = 0; _dummyMat.elements[5] = 0; _dummyMat.elements[10] = 0;
                  c.setMatrixAt(i, _dummyMat);
                  c.instanceMatrix.needsUpdate = true;
                  
                  if (renderModeRef.current === 'glass') {
                    const ci = c.userData.colorIndex;
                    const gMesh = (sceneRef.current?.children.find(child => child === meshGroupRef.current)?.children ?? [])
                       .find((child): child is THREE.InstancedMesh => child instanceof THREE.InstancedMesh && child.userData.isJitterGlow && child.userData.colorIndex === ci);
                    if (gMesh) {
                       const _gDummy = new THREE.Matrix4();
                       gMesh.getMatrixAt(i, _gDummy);
                       _gDummy.elements[0] = 0; _gDummy.elements[5] = 0; _gDummy.elements[10] = 0;
                       gMesh.setMatrixAt(i, _gDummy);
                       gMesh.instanceMatrix.needsUpdate = true;
                    }
                  }

                  // Hide hover glow immediately
                  hoverPoolRef.current.forEach(p => {
                    if (p.blockKey === k) {
                       p.targetAlpha = 0; p.currentAlpha = 0; p.mesh.visible = false; p.active = false;
                    }
                  });

                  // Destroy any beacon sitting on or near this block
                  if (beaconGrpRef.current) {
                      const pxRaw = offsetX + parseInt(k.split('_')[0]);
                      const pzRaw = offsetZ + parseInt(k.split('_')[1]);
                      const toRemove: THREE.Object3D[] = [];
                      beaconGrpRef.current.children.forEach(b => {
                          if (Math.abs(b.position.x - pxRaw) < 0.1 && Math.abs(b.position.z - pzRaw) < 0.1) {
                              toRemove.push(b);
                          }
                      });
                      toRemove.forEach(b => {
                          if (b instanceof THREE.Mesh) {
                              b.geometry?.dispose();
                              (b.material as THREE.Material)?.dispose();
                          }
                          beaconGrpRef.current?.remove(b);
                      });
                  }

                  // Emit burst of particles
                  const layerCol = (c.material as any).emissive || new THREE.Color(1,0,0);
                  const px = offsetX + parseInt(k.split('_')[0]);
                  const py = parseInt(k.split('_')[2]) + 0.5;
                  const pz = offsetZ + parseInt(k.split('_')[1]);
                  const numParts = partCountRef.current; // Tied to global UI slider
                  for (let p = 0; p < numParts; p++) {
                    const slot = getFreeParticle();
                    if (!slot) break;
                    const speed = (0.2 + Math.random() * 0.4) * partSpeedRef.current;
                    const theta  = Math.random() * Math.PI * 2;
                    const phi    = Math.random() * Math.PI;
                    slot.alive  = true;
                    slot.px = px; slot.py = py; slot.pz = pz;
                    slot.vx = Math.sin(phi) * Math.cos(theta) * speed; slot.vy = Math.cos(phi) * speed + 0.1; slot.vz = Math.sin(phi) * Math.sin(theta) * speed;
                    slot.age    = 0; slot.maxAge = partLifeRef.current + Math.random() * (partLifeRef.current * 0.5);
                    slot.r = layerCol.r; slot.g = layerCol.g; slot.b = layerCol.b;
                  }
               }
            }
         }
        }
     }

     // Helper function: dynamically instantiate a glowing brick if it became an edge
     const checkAndSpawnDynamicGlow = (gx: number, gy: number, gz: number, cx: number, cy: number, w: number, h: number, heights: any[]) => {
       const isLargeMap = layoutTabRef.current === 'large_map';
       const blockKey = isLargeMap ? `${gx}_${gy}_${gz}` : `${gx}_${gy}_${gz}`;
       if (brokenBlocksRef.current.has(blockKey) || toBreak.has(blockKey)) return;

       // Recalculate isEdge
       const isInteriorHole = (nx: number, ny: number) => {
         if (nx < 0 || nx >= w || ny < 0 || ny >= h) return false;
         const nH = heights[ny][nx] ?? 1;
         if (nH <= 0) return true;
         const gX = nx + cx * w;
         const gY = ny + cy * h;
         const testKey = isLargeMap ? `${gX}_${gY}_0` : `${nx}_${ny}_0`;
         return brokenBlocksRef.current.has(testKey) || toBreak.has(testKey);
       };

       const localX = gx - cx * w;
       const localY = gy - cy * h;

       const isEdge = isInteriorHole(localX, localY - 1) ||
                      isInteriorHole(localX, localY + 1) ||
                      isInteriorHole(localX - 1, localY) ||
                      isInteriorHole(localX + 1, localY);

       if (isEdge && !dynamicGlowBlocksRef.current.has(blockKey)) {
         let foundMesh: THREE.InstancedMesh | null = null;
         let foundIndex: number = -1;
         for (const c of targetGroup.children) {
           if (c instanceof THREE.InstancedMesh && c.userData.coordIndexMap) {
             const i = c.userData.coordIndexMap.get(blockKey);
             if (i !== undefined) {
               foundMesh = c;
               foundIndex = i;
               break;
             }
           }
         }
         
         if (foundMesh) {
           const _dummyMat = new THREE.Matrix4();
           foundMesh.getMatrixAt(foundIndex, _dummyMat);
           const originalPos = new THREE.Vector3().setFromMatrixPosition(_dummyMat);
           
           // DO NOT hide the original block! Leave it perfectly intact.
           // Just spawn the translucent JitterGlow shell over it, exactly matching the preset 'rando blocks' feature.
           const geo = isLargeMap ? new THREE.BoxGeometry(1.04, 1.04, 1.04) : new THREE.BoxGeometry(1.04, 1.04, 1.04);
           
           // Read color from instance or material
           let baseColor = new THREE.Color(0xffffff);
           if (foundMesh.instanceColor) {
             foundMesh.getColorAt(foundIndex, baseColor);
           } else if (foundMesh.material) {
             const origMat = Array.isArray(foundMesh.material) ? foundMesh.material[0] : foundMesh.material;
             if ('emissive' in origMat) {
               baseColor = new THREE.Color((origMat as any).emissive);
             } else if ('color' in origMat) {
               baseColor = new THREE.Color((origMat as any).color);
             }
           }

           const mat = new THREE.MeshStandardMaterial({
             color: new THREE.Color(0, 0, 0),
             emissive: baseColor,
             emissiveIntensity: 5.0, // Matches full hover shell intensity (1.0 * 5.0)
             transparent: true,
             opacity: 0.72, // Matches full hover shell opacity (1.0 * 0.72)
             depthWrite: false,
             side: THREE.FrontSide,
           });
           
           const newMesh = new THREE.Mesh(geo, mat);
           newMesh.position.copy(originalPos);
           
           targetGroup.add(newMesh);
           dynamicGlowBlocksRef.current.set(blockKey, newMesh);
         }
       }
     };

     // Dynamically update neighbors of broken blocks
     const hData = terrainRef.current;
     if (hData.length > 0) {
       const w = hData[0].length;
       const h = hData.length;
       for (const k of toBreak) {
         // Cleanup: if the block being destroyed was a glowing edge, remove the dynamic mesh so it doesn't float!
         if (dynamicGlowBlocksRef.current.has(k)) {
           const floatMesh = dynamicGlowBlocksRef.current.get(k);
           if (floatMesh && floatMesh.parent) floatMesh.parent.remove(floatMesh);
           dynamicGlowBlocksRef.current.delete(k);
         }

         const [xs, ys, zs] = k.split('_');
         const gx = parseInt(xs), gy = parseInt(ys), gz = parseInt(zs);
         const cx = Math.floor(gx / w), cy = Math.floor(gy / h);
         
         checkAndSpawnDynamicGlow(gx, gy - 1, gz, cx, cy, w, h, hData);
         checkAndSpawnDynamicGlow(gx, gy + 1, gz, cx, cy, w, h, hData);
         checkAndSpawnDynamicGlow(gx - 1, gy, gz, cx, cy, w, h, hData);
         checkAndSpawnDynamicGlow(gx + 1, gy, gz, cx, cy, w, h, hData);
         checkAndSpawnDynamicGlow(gx, gy, gz + 1, cx, cy, w, h, hData);
         checkAndSpawnDynamicGlow(gx, gy, Math.max(0, gz - 1), cx, cy, w, h, hData);
       }
     }

    needsRenderRef.current = true;
  }, []);

  // ── Rebuild terrain meshes (InstancedMesh — one draw call per height level) ──
  const rebuildMeshes = useCallback((
    heights: number[][], bv: number, glow: number, op: number, tint: string,
    layerColors: string[], transmit: number, thickness: number, ior: number,
    matRoughness: number, cubeJitter = 0, brokenBlocksSet = brokenBlocks
  ) => {
    const scene = sceneRef.current;
    const group = meshGroupRef.current;
    if (!scene || !group) return;

    // Dispose previous InstancedMesh objects
    while (group.children.length > 0) {
      const m = group.children[0] as THREE.InstancedMesh;
      group.remove(m);
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
      else (m.material as THREE.Material)?.dispose();
    }

    const h = heights.length, w = heights[0]?.length ?? 0;
    if (h === 0 || w === 0) return;
    const offsetX = -w / 2, offsetZ = -h / 2;
    const totalLevels = layerColors.length;
    const userCol = new THREE.Color(tint);

    // Pass 1 — count how many blocks land in each height-color level
    const isLarge = layoutTabRef.current === 'large_map';
    const COPIES = isLarge ? 9 : 1;
    const counts = new Array<number>(totalLevels).fill(0);
    for (let gy = 0; gy < h; gy++)
      for (let gx = 0; gx < w; gx++) {
        const cellH = heights[gy][gx] ?? 1;
        for (let gz = 0; gz < cellH; gz++)
          counts[Math.min(gz, totalLevels - 1)] += COPIES;
      }

    // Pass 2 — create one InstancedMesh per non-empty color level
    const dummy  = new THREE.Object3D();
    const iMeshes: (THREE.InstancedMesh | null)[] = [];
    const glowIMeshes: (THREE.InstancedMesh | null)[] = [];
    const slots   = new Array<number>(totalLevels).fill(0);

    // ── Pre-allocate Glow Mesh Pool ─────────────────────────────────────────
    const POOL_SIZE = 20; // 20 blocks max fading
    hoverPoolRef.current = Array.from({ length: POOL_SIZE }, (_, i) => {
      const geo = new RoundedBoxGeometry(1.04, 1.04, 1.04, 2, 0.08);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0,0,0),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const hoverMesh = new THREE.Mesh(geo, mat);
      hoverMesh.visible = false;
      hoverMesh.renderOrder = 2; // Above JitterGlow
      scene.add(hoverMesh);
      return { mesh: hoverMesh, targetAlpha: 0, currentAlpha: 0, blockKey: '', active: false };
    });

    for (let ci = 0; ci < totalLevels; ci++) {
      if (counts[ci] === 0) { 
        iMeshes.push(null); 
        glowIMeshes.push(null);
        continue; 
      }
      const hr       = ci / Math.max(totalLevels - 1, 1);
      const levelCol = new THREE.Color(layerColors[ci]);
      // Layer color is primary (90%); terrainTint is a subtle 10% overlay
      const blended  = levelCol.clone().lerp(userCol, 0.1);
      // Use MeshStandard when no transmission — avoids the expensive physical shader branches
      const mat = transmit > 0.01
        ? new THREE.MeshPhysicalMaterial({
            color: blended, emissive: levelCol,
            emissiveIntensity: baseGlow,
            roughness: matRoughness, metalness: 0.0,
            transmission: transmit, thickness, ior,
            transparent: false, opacity: 1.0,
          })
        : new THREE.MeshStandardMaterial({
            color: blended, emissive: levelCol,
            emissiveIntensity: baseGlow,
            roughness: matRoughness, metalness: 0.0,
            transparent: op < 0.99,
            opacity: Math.max(0.05, op - hr * 0.05),
          });
      // Segments=1 — visually identical at terrain scale, ~half the vertex count vs segments=2
      // For extreme 3x3 array spanning, drop cleanly to primitive BoxGeometry (12 tris instead of 228!)
      const geo = isLarge ? new THREE.BoxGeometry(1.0, 1.0, 1.0) : new RoundedBoxGeometry(1.0, 1.0, 1.0, 1, bv);
      const iMesh = new THREE.InstancedMesh(geo, mat, counts[ci]);
      iMesh.castShadow    = true;
      iMesh.receiveShadow = true;
      iMesh.frustumCulled = false;
      iMesh.userData.heightRatio = hr;  // used by live glow/opacity updates
      iMesh.userData.colorIndex  = ci;  // ◄ KEY: used by live colour update
      iMeshes.push(iMesh);
      group.add(iMesh);

      // Jitter Glow Mesh — identical logic to hover mesh
      const glowGeo = isLarge ? new THREE.BoxGeometry(1.04, 1.04, 1.04) : new RoundedBoxGeometry(1.04, 1.04, 1.04, 2, 0.08);
      const glowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0,0,0),
        emissive: levelCol,
        emissiveIntensity: glow * 5.0,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const gMesh = new THREE.InstancedMesh(glowGeo, glowMat, counts[ci]);
      gMesh.castShadow = false;
      gMesh.receiveShadow = false;
      gMesh.frustumCulled = false;
      gMesh.renderOrder = 1;
      gMesh.userData.colorIndex = ci;
      gMesh.userData.isJitterGlow = true; // flag it
      glowIMeshes.push(gMesh);
      group.add(gMesh);
    }

    // Pass 3 — populate instance matrices
    const bound = isLarge ? 1 : 0;
    
    // Pick cheat block on wave 1
    if (waveNumberRef.current === 1 && !cheatBlockRef.current) {
        // Cheat block hidden per user request
        // const gx = Math.floor(w / 2) + 2;
        // const gy = Math.floor(h / 2) + 2;
        // const gz = (heights[gy]?.[gx] ?? 1) - 1; // Top of the stack!
        // cheatBlockRef.current = `${gx}_${gy}_${gz}`; 
    } else if (waveNumberRef.current > 1) {
        cheatBlockRef.current = null;
    }

    for (let cy = -bound; cy <= bound; cy++) {
      for (let cx = -bound; cx <= bound; cx++) {
        for (let gy = 0; gy < h; gy++) {
          for (let gx = 0; gx < w; gx++) {
            const cellH = heights[gy][gx] ?? 1;
            for (let gz = 0; gz < cellH; gz++) {
              const ci    = Math.min(gz, totalLevels - 1);
              const iMesh = iMeshes[ci];
              if (!iMesh) continue;

              const globalX = gx + cx * w;
              const globalY = gy + cy * h;
              const blockKey = isLarge ? `${globalX}_${globalY}_${gz}` : `${gx}_${gy}_${gz}`;
              if (!iMesh.userData.coordMap) {
                 iMesh.userData.coordMap = [] as string[];
                 iMesh.userData.coordIndexMap = new Map<string, number>();
              }
              iMesh.userData.coordMap[slots[ci]] = blockKey;
              iMesh.userData.coordIndexMap.set(blockKey, slots[ci]);

              let dip = 0;
              if (brokenBlocksSet.has(blockKey)) {
                dummy.scale.set(0, 0, 0); // hide broken blocks
              } else {
                dummy.scale.set(1, 1, 1); // normal scale
              }

              if (cubeJitter > 0) {
                // Two independent LCG values per block — different primes so they're uncorrelated
                const rng1 = lcg(gx * 73856093 ^ gy * 19349663 ^ gz * 83492791);
                const r1 = rng1(); // 0..1 — sparsity gate
                // Only ~35% of blocks dip — rest sit flush (breaks up the uniform feel)
                if (r1 < 0.35) dip = Math.pow(rng1(), 2.2) * cubeJitter * 0.55;
              }

              dummy.position.set(gx + offsetX + cx * w, gz + 0.5 - dip, gy + offsetZ + cy * h);
              dummy.updateMatrix();
              iMesh.setMatrixAt(slots[ci], dummy.matrix);

              // Render independent glowing yellow cheat block
              if (blockKey === cheatBlockRef.current) {
                  if (cheatBlockMeshRef.current) {
                      group.remove(cheatBlockMeshRef.current);
                  }
                  const cGeo = new THREE.BoxGeometry(1.06, 1.06, 1.06);
                  const cMat = new THREE.MeshStandardMaterial({ color: 0xffd60a, emissive: 0xffd60a, emissiveIntensity: 5 });
                  const cMesh = new THREE.Mesh(cGeo, cMat);
                  cMesh.position.copy(dummy.position);
                  cMesh.userData.isCheatBlock = true;
                  group.add(cMesh);
                  cheatBlockMeshRef.current = cMesh;
              }

              const gMesh = glowIMeshes[ci];
              if (gMesh) {
                 if (presetExplodeBlocksRef.current.has(blockKey) && !brokenBlocksSet.has(blockKey)) {
                    dummy.scale.set(1, 1, 1);
                 } else {
                    dummy.scale.set(0, 0, 0);
                 }
                 dummy.updateMatrix();
                 gMesh.setMatrixAt(slots[ci], dummy.matrix);
              }

              slots[ci]++;
            }
          }
        }
      }
    }

    // Flush instance matrices to GPU
    for (const iMesh of iMeshes)
      if (iMesh) iMesh.instanceMatrix.needsUpdate = true;
    for (const gMesh of glowIMeshes)
      if (gMesh) gMesh.instanceMatrix.needsUpdate = true;
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;  // geometry changed — re-bake shadows
  }, []);

  // ── Rebuild mixed-geo terrain — driven by SHAPE_LIBRARY + enabledShapeIds ──
  // MeshStandard only (no transmission) — matches Tympanus BatchedMesh performance.
  const rebuildMixedMeshes = useCallback((heights: number[][], layerColors: string[], tint: string, enabledShapeIds: Set<string>, brokenBlocksSet = brokenBlocks) => {
    const grp = mixedGrpRef.current;
    if (!grp) return;

    // Filter to active shapes; fall back to all if none selected
    const shapes = SHAPE_LIBRARY.filter(s => enabledShapeIds.has(s.id));
    const active = shapes.length > 0 ? shapes : SHAPE_LIBRARY;

    // Dispose previous contents
    while (grp.children.length > 0) {
      const m = grp.children[0] as THREE.InstancedMesh;
      grp.remove(m);
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
      else (m.material as THREE.Material)?.dispose();
    }


    const h = heights.length, w = heights[0]?.length ?? 0;
    if (h === 0 || w === 0) return;
    const offsetX  = -w / 2, offsetZ = -h / 2;
    const nLayers  = layerColors.length;
    const N_TYPES  = active.length;

    // ── Pre-calculate Interior Holes ─────────────────────────────────────────
    const bound = isLarge ? 1 : 0;
    const isInteriorHole = (nx: number, ny: number, cx: number, cy: number) => {
      // Must NOT be the edge of the map
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) return false; 
      
      const nH = heights[ny][nx] ?? 1;
      if (nH <= 0) return true; // Bottom layer is empty
      
      const gX = nx + cx * w;
      const gY = ny + cy * h;
      const blockKey = isLarge ? `${gX}_${gY}_0` : `${nx}_${ny}_0`;
      return brokenBlocksSet.has(blockKey); // True if bottom block was destroyed
    };

    const isEdgeBlock = (gx: number, gy: number, cx: number, cy: number) => {
      return isInteriorHole(gx, gy - 1, cx, cy) ||
             isInteriorHole(gx, gy + 1, cx, cy) ||
             isInteriorHole(gx - 1, gy, cx, cy) ||
             isInteriorHole(gx + 1, gy, cx, cy);
    };

    // ── Pass 1: count per (layer × shapeIndex × isGlow) ──────────────────────
    type LK = `${number}_${number}_${boolean}`;
    const counts = new Map<LK, number>();
    
    for (let cy = -bound; cy <= bound; cy++) {
      for (let cx = -bound; cx <= bound; cx++) {
        for (let gy = 0; gy < h; gy++) {
          for (let gx = 0; gx < w; gx++) {
            const cellH = heights[gy][gx] ?? 1;
            const glowEdge = isEdgeBlock(gx, gy, cx, cy);
            
            for (let gz = 0; gz < cellH; gz++) {
              const ci = Math.min(gz, nLayers - 1);
              const t  = ((gx * 31 + gy * 17 + gz * 7) ^ (gx ^ gy)) % N_TYPES;
              
              // Only apply glow if the block is active and not broken
              const globalX = gx + cx * w;
              const globalY = gy + cy * h;
              const blockKey = isLarge ? `${globalX}_${globalY}_${gz}` : `${gx}_${gy}_${gz}`;
              if (!brokenBlocksSet.has(blockKey)) {
                const k: LK = `${ci}_${t}_${glowEdge}`;
                counts.set(k, (counts.get(k) ?? 0) + 1);
              }
            }
          }
        }
      }
    }

    // ── Pass 2: build one InstancedMesh per (layer × shapeIndex × isGlow) ────
    const tintCol = new THREE.Color(tint);
    const meshMap = new Map<LK, THREE.InstancedMesh>();
    const slotMap = new Map<LK, number>();

    for (const [k, count] of counts) {
      if (count === 0) continue;
      const [ciStr, tStr, isGlowStr] = k.split('_');
      const ci = parseInt(ciStr), t = parseInt(tStr);
      const isGlow = isGlowStr === "true";
      const shape = active[t];
      const hr = ci / Math.max(nLayers - 1, 1);

      const baseCol  = new THREE.Color(layerColors[ci]);
      const blended  = tintCol.clone().lerp(baseCol, 0.6);
      
      let finalColor = blended;
      let emissCol = baseCol;
      let emissStr = 0.08 + hr * 0.32 + (shape.metalness > 0.4 ? 0.18 : (shape.id === 'default' ? 0.0 : 0.2));

      if (isGlow) {
        finalColor = new THREE.Color('#4096ff'); // Bright hover blue
        emissCol = new THREE.Color('#4096ff');
        emissStr = 1.2; // High glow intensity
      }

      const mat = new THREE.MeshStandardMaterial({
        color:             finalColor,
        emissive:          emissCol,
        emissiveIntensity: emissStr,
        roughness:         shape.roughness,
        metalness:         shape.metalness,
      });

      const geo   = shape.makeGeo();
      const iMesh = new THREE.InstancedMesh(geo, mat, count);
      iMesh.castShadow    = true;
      iMesh.receiveShadow = true;
      meshMap.set(k as LK, iMesh);
      slotMap.set(k as LK, 0);
      grp.add(iMesh);
    }

    // ── Pass 3: populate instance matrices ────────────────────────────────────
    const dummy = new THREE.Object3D();
    for (let cy = -bound; cy <= bound; cy++) {
      for (let cx = -bound; cx <= bound; cx++) {
        for (let gy = 0; gy < h; gy++) {
          for (let gx = 0; gx < w; gx++) {
            const cellH = heights[gy][gx] ?? 1;
            for (let gz = 0; gz < cellH; gz++) {
              const ci = Math.min(gz, nLayers - 1);
              const t  = ((gx * 31 + gy * 17 + gz * 7) ^ (gx ^ gy)) % N_TYPES;
              
              const globalX = gx + cx * w;
              const globalY = gy + cy * h;
              const blockKey = isLarge ? `${globalX}_${globalY}_${gz}` : `${gx}_${gy}_${gz}`;
              const glowEdge = isEdgeBlock(gx, gy, cx, cy);

              if (!brokenBlocksSet.has(blockKey)) {
                const k: LK = `${ci}_${t}_${glowEdge}`;
                const iMesh = meshMap.get(k);
                if (!iMesh) continue;
                const shape = active[t];
                
                dummy.rotation.set(0, 0, 0);
                if (shape.rotY) dummy.rotation.y = shape.rotY(gx, gy);
                
                const jx = ((gx * 7  + gy * 13) % 7 - 3) * 0.035;
                const jz = ((gx * 11 + gy * 5)  % 7 - 3) * 0.035;
                dummy.scale.set(1, 1, 1);
                dummy.position.set(gx + offsetX + jx + cx * w, shape.yOff(gz), gy + offsetZ + jz + cy * h);
                dummy.updateMatrix();
                
                const slot = slotMap.get(k)!;
                iMesh.setMatrixAt(slot, dummy.matrix);
                
                if (!iMesh.userData.coordMap) {
                   iMesh.userData.coordMap = [] as string[];
                   iMesh.userData.coordIndexMap = new Map<string, number>();
                }
                iMesh.userData.coordMap[slot] = blockKey;
                iMesh.userData.coordIndexMap.set(blockKey, slot);
                
                slotMap.set(k, slot + 1);
              }
            }
          }
        }
      }
    }

    for (const iMesh of meshMap.values())
      iMesh.instanceMatrix.needsUpdate = true;

    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
  }, []);

  // ── Rebuild beacon blocks ─────────────────────────────────────────────────
  const rebuildBeacons = useCallback((
    heights: number[][], count: number, hex: string, emissive: number,
    lightInt: number, bSeed: number, buryDepth: number
  ) => {
    const scene = sceneRef.current;
    const grp   = beaconGrpRef.current;
    if (!scene || !grp) return;

    // Clear old beacons + their lights (each mesh has its own geo — safe to dispose individually)
    while (grp.children.length > 0) {
      const obj = grp.children[0];
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        (obj.material as THREE.Material)?.dispose();
      }
      grp.remove(obj);
    }

    const h = heights.length, w = heights[0]?.length ?? 0;
    if (!h || !w || count < 1) { needsRenderRef.current = true; return; }

    const rand = lcg(bSeed);
    const used = new Set<string>();
    const col  = new THREE.Color(hex);
    const offsetX = -w / 2, offsetZ = -h / 2;

    let placed = 0, attempts = 0;
    while (placed < count && attempts < count * 40) {
      attempts++;
      const gx = Math.floor(rand() * w);
      const gy = Math.floor(rand() * h);
      const key = `${gx},${gy}`;
      if (used.has(key)) continue;
      used.add(key);

      const cellH = heights[gy][gx] ?? 1;
      const px = gx + offsetX;
      const pz = gy + offsetZ;
      const gz_place = Math.max(0, cellH - buryDepth);
      const py = gz_place + 0.5;

      // Each beacon gets its own geometry so disposal works correctly
      const geo = new RoundedBoxGeometry(0.98, 0.98, 0.98, 3, 0.1);
      const mat = new THREE.MeshPhysicalMaterial({
        color:             col.clone().lerp(new THREE.Color('#ffffff'), 0.25),
        emissive:          col,
        emissiveIntensity: emissive,
        roughness:         0.05,
        metalness:         0.1,
        // opaque so they render in the depth pass, not occluded by transparent terrain
        transparent:       false,
        opacity:           1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;
      grp.add(mesh);

      // Point light at beacon position for local color spill
      const light = new THREE.PointLight(col, lightInt, 8, 2);
      light.position.set(px, py + 0.6, pz);
      grp.add(light);

      placed++;
    }
    needsRenderRef.current = true;
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true; // beacon geometry changed — re-bake shadows
  }, []);

  // ── Rebuild sheep planes ──────────────────────────────────────────────────
  const rebuildSheep = useCallback((heights: number[][], count: number, size: number, sSeed: number) => {
    const scene = sceneRef.current;
    const grp = sheepGrpRef.current;
    if (!scene || !grp) return;

    if (flockEngineRef.current) {
        grp.remove(flockEngineRef.current.mesh);
        if (flockEngineRef.current.shadowMesh) grp.remove(flockEngineRef.current.shadowMesh);
        flockEngineRef.current.mesh.geometry.dispose();
        if (flockEngineRef.current.shadowMesh) flockEngineRef.current.shadowMesh.geometry.dispose();
        (flockEngineRef.current.mesh.material as THREE.Material).dispose();
        if (flockEngineRef.current.shadowMesh) (flockEngineRef.current.shadowMesh.material as THREE.Material).dispose();
        flockEngineRef.current = null;
    }

    const h = heights.length, w = heights[0]?.length ?? 0;
    if (!h || !w || count < 1) { needsRenderRef.current = true; return; }

    flockEngineRef.current = new FlockEngine({
        count: 0,
        size: size,
        speed: sheepSpeed,
        bounciness: sheepBounciness,
        bounceSpeed: sheepBounceSpeed,
        gravity: sheepGravity,
        explodeForce: sheepExplodeForce,
        explodeRadius: sheepExplodeRadius,
        separation: sheepSeparation,
        cohesion: sheepCohesion,
        alignment: sheepAlignment,
        boundsX: Math.max(10, w - 4),
        boundsZ: Math.max(10, h - 4),
        textureUrl: '/game_assets/props/sheep/sheep_02.png'
    });

    if (!isTransitioningWaveRef.current) {
        waveNumberRef.current = 1;
        shotsFiredRef.current = 0;
        sheepScoreRef.current = 0;
        totalKillsRef.current = 0;
        gameStartTimeRef.current = Date.now();
        setVictoryStats(null);
        setTimeout(() => announceWave(1, 1), 100);
    }

    grp.add(flockEngineRef.current.mesh);
    grp.add(flockEngineRef.current.shadowMesh);
    needsRenderRef.current = true;
  }, [sheepSpeed, sheepBounciness, sheepBounceSpeed, sheepGravity, sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment]);

  // Live dynamic config update for sheep
  useEffect(() => {
      if (flockEngineRef.current) {
          flockEngineRef.current.updateConfig({
              speed: sheepSpeed,
              bounciness: sheepBounciness,
              bounceSpeed: sheepBounceSpeed,
              gravity: sheepGravity,
              explodeForce: sheepExplodeForce,
              explodeRadius: sheepExplodeRadius,
              separation: sheepSeparation,
              cohesion: sheepCohesion,
              alignment: sheepAlignment,
          });
      }
  }, [sheepSpeed, sheepBounciness, sheepBounceSpeed, sheepGravity, sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment]);


  // ── Generator ─────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    setStatus('Generating…');
    setSaved(false);
    setTimeout(() => {
      const heights = buildNoise(gridW, gridH, octaves, seed, maxElev, roughness);
      pickPresetBlocks(heights, seed);
      terrainRef.current = heights;
      setTerrain(heights);
      const emptySet = new Set<string>();
      setBrokenBlocks(emptySet);
      if (renderMode === 'glass') {
        rebuildMeshes(heights, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
      } else {
        rebuildMixedMeshes(heights, layerColors, terrainTint, enabledShapes, emptySet);
      }
      rebuildSheep(heights, sheepCount, sheepSize, sheepSeed);
      setStatus(`${gridW}×${gridH} terrain ready — ${gridW * gridH} cells`);
    }, 10);
  }, [gridW, gridH, octaves, seed, maxElev, roughness, bevel, glowInt, baseGlow, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, rebuildMeshes, rebuildMixedMeshes, renderMode, enabledShapes, rebuildSheep, sheepCount, sheepSize, sheepSeed]);

  // ── Reshuffle beacons (new random positions, same terrain) ─────────────────
  const reshuffleBeacons = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 9999) + 1;
    setBeaconSeed(newSeed);
  }, []);

  // ── Save full scene (heightmap + lighting + beacons) to CMS API ────────
  const saveToGame = useCallback(async () => {
    if (!terrainRef.current.length) return;
    try {
      const saveRes = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'arn_terrain_heightmap',
          data: {
            width:   gridW,
            height:  gridH,
            heights: terrainRef.current,
            // Terrain appearance
            terrainTint,
            // Lighting
            lighting: {
              keyLightColor, lightElev, lightAzimuth,
              keyLightInt, ambientInt,
            },
            // Beacon blocks
            beacons: {
              count:     beaconCount,
              color:     beaconColor,
              emissive:  beaconEmissive,
              lightInt:  beaconLight,
              buryDepth: beaconBury,
              seed:      beaconSeed,
            },
          }
        })
      });
      const saveJson = await saveRes.json();
      if (!saveJson.success) {
        throw new Error(saveJson.error || 'Failed to save terrain map');
      }

      // ── Clear old 3D Studio buildings so they don't appear on the new terrain ──
      const clearRes = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'arn_3dstudio_v1', data: null })
      });
      const clearJson = await clearRes.json();
      if (!clearJson.success) {
        throw new Error(clearJson.error || 'Failed to clear studio buildings');
      }

      setSaved(true);
      setStatus('✅ Scene saved — terrain + lighting + beacons synced to 3D Studio. Buildings reset.');
    } catch (e) {
      setStatus('❌ Save failed: ' + String(e));
    }
  }, [gridW, gridH, terrainTint, keyLightColor, lightElev, lightAzimuth, keyLightInt, ambientInt,
      beaconCount, beaconColor, beaconEmissive, beaconLight, beaconBury, beaconSeed]);

  // ── Bake PNG ───────────────────────────────────────────────────────────────
  const bake = useCallback(() => {
    const composer = composerRef.current;
    const renderer = rendererRef.current;
    if (!composer || !renderer) return;
    composer.render();
    downloadPNG(renderer.domElement, 'terrain_bake.png');
  }, []);

  // ── Three.js scene setup (runs once) ──────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth  || window.innerWidth;
    const H = el.clientHeight || window.innerHeight;

    const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const dprMax = isMobileDevice ? 1.0 : 1.5;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio < 2, // Redundant and highly expensive on high-density displays
      alpha: true, 
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance' 
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprMax)); // 1.0 max on mobile to save pure bandwidth
    renderer.shadowMap.enabled    = true;
    renderer.shadowMap.type       = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;  // only update shadows when scene actually changes
    renderer.outputColorSpace  = THREE.SRGBColorSpace;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x16003b, 80, 220);
    sceneRef.current = scene;

    const aspect = W / H, frustum = 28;
    const camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 800,
    );
    const iso = Math.atan(1 / Math.sqrt(2));
    const d = 80;
    camera.position.set(d * Math.cos(iso) * Math.sin(Math.PI / 4), d * Math.sin(iso), d * Math.cos(iso) * Math.cos(Math.PI / 4));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Composer + bloom — bloom at quarter resolution for max GPU savings (unnoticeable at terrain scale)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W / 4, H / 4), 0.5, 0.5, 0.28);
    composer.addPass(bloom);
    // TiltShift: blurs edges, keeps center sharp
    const tiltPass = new ShaderPass(RadialDOFShader);
    composer.addPass(tiltPass);
    composerRef.current  = composer;
    bloomPassRef.current = bloom;
    tiltPassRef.current  = tiltPass;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate  = false; // Locked to isometric angle
    controls.enableZoom    = true;
    controls.enablePan     = true; // Re-enabled per user request
    controls.minZoom       = 0.5;   // Constrain zoom out
    controls.maxZoom       = 3.0;   // Constrain zoom in
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.mouseButtons  = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches       = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    // Mark scene dirty whenever camera changes so we re-render exactly once
    controls.addEventListener('change', () => { needsRenderRef.current = true; });
    controlsRef.current = controls;

    // Lights
    const ambLight = Object.assign(new THREE.AmbientLight(0xffffff, 0.18), { name: 'ambient' });
    scene.add(ambLight);
    ambLightRef.current = ambLight;

    // HemisphereLight: sky=white fill, ground=shadowColor tints shadow areas
    const hemLight = new THREE.HemisphereLight(0xffffff, 0x0a0e2a, 0.25);
    scene.add(hemLight);
    hemLightRef.current = hemLight;

    const key = Object.assign(new THREE.DirectionalLight(0xa8d8ff, 0.5), { name: 'key' });
    key.position.set(12, 20, 8); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); // default; shadowMapSize state useEffect syncs this
    key.shadow.camera.near   = 0.1;
    key.shadow.camera.far    = 200;
    key.shadow.camera.left   = key.shadow.camera.bottom = -45;
    key.shadow.camera.right  = key.shadow.camera.top    =  45;
    key.shadow.camera.updateProjectionMatrix();
    // Shadow bias — fixes self-shadow banding (acne) on box faces
    key.shadow.bias       = -0.001;  // stronger default for beveled geometry
    key.shadow.normalBias =  0.15;   // large enough to clear RoundedBoxGeometry bevel normals
    scene.add(key);
    scene.add(key.target);
    keyLightRef.current = key;

    const rim = Object.assign(new THREE.DirectionalLight(0xffddaa, 0.25), { name: 'rim' });
    rim.position.set(-12, 10, -8);
    scene.add(rim);
    scene.add(rim.target);
    rimLightRef.current = rim;

    const spot = Object.assign(new THREE.SpotLight(0xffffff, 0), { name: 'spot' });
    spot.position.set(0, 80, 0); // Directly overhead
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.focus = 1;
    scene.add(spot);
    scene.add(spot.target);
    spotLightRef.current = spot;

    // Grid
    const grid = new THREE.GridHelper(100, 100, 0xeaeaea, 0xeaeaea);
    (grid.material as THREE.LineBasicMaterial).opacity = 0.3;
    (grid.material as THREE.LineBasicMaterial).transparent = true;
    grid.visible = false; // Hidden per user request
    scene.add(grid);

    // Ground
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshStandardMaterial({ color: 0x040d1e, roughness: 0.95, emissive: new THREE.Color(0x0a1832), emissiveIntensity: 0.4 })
    );
    gnd.rotation.x = -Math.PI / 2; gnd.position.y = -0.01; gnd.receiveShadow = true;
    gnd.visible = false; // Hidden per user request to let gradient show through
    scene.add(gnd);

    // Golden Ratio High-Fidelity Shadow Plane
    const shadowTexture = createGoldenRatioShadowTexture();
    if (shadowTexture) {
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({ 
          map: shadowTexture, 
          transparent: true, 
          opacity: 1.0, 
          depthWrite: false 
        })
      );
      shadowPlane.rotation.x = -Math.PI / 2; 
      shadowPlane.position.y = -0.5; // Just below the lowest blocks
      scene.add(shadowPlane);
      shadowPlaneRef.current = shadowPlane; // Save for 7.83Hz pulsing
    }

    // Mesh group (glass mode)
    const group = new THREE.Group();
    scene.add(group);
    meshGroupRef.current = group;

    // Mixed-geo group (mixed mode — hidden when in glass mode)
    const mixedGrp = new THREE.Group();
    scene.add(mixedGrp);
    mixedGrpRef.current = mixedGrp;

    // Beacon group (separate so we can clear independently)
    const beaconGrp = new THREE.Group();
    scene.add(beaconGrp);
    beaconGrpRef.current = beaconGrp;

    // Sheep group
    const sheepGrp = new THREE.Group();
    scene.add(sheepGrp);
    sheepGrpRef.current = sheepGrp;

    // Hex world custom structures group
    const hexGrp = new THREE.Group();
    scene.add(hexGrp);
    hexWorldGrpRef.current = hexGrp;

    // ── Asteroid particle system ────────────────────────────────────────────────
    const pPosArr = new Float32Array(TERRAIN_MAX_PARTICLES * 3);
    const pColArr = new Float32Array(TERRAIN_MAX_PARTICLES * 3);
    const pGeo   = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPosArr, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pColArr, 3));
    pGeo.setDrawRange(0, 0); // start with nothing visible
    const pMat = new THREE.PointsMaterial({
      size:            1.5,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.92,
      depthWrite:      false,
      blending:        THREE.AdditiveBlending, // additive = glowing dots, boosted by Bloom
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(pGeo, pMat);
    pts.renderOrder = 3; // in front of terrain + hover overlay
    // Force the bounding sphere to exactly encompass the massive 3x3 array layout explicitly,
    // thereby keeping WebGL hardware culling active for performance without prematurely clipping edges!
    pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 220);
    scene.add(pts);
    particlesRef.current = pts;
    // Pre-allocate pool (all dead)
    particleDataRef.current = Array.from({ length: TERRAIN_MAX_PARTICLES }, () => ({
      alive: false,
      px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0,
      age: 0, maxAge: 300, r: 1, g: 1, b: 1,
    }));

    // Plane at Y=0 used to project mouse ray to 3D world pos (for magnet target)
    const _magnetPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const _magnetTarget = new THREE.Vector3();

    // Render loop — on-demand: only calls composer.render() when needsRenderRef is set
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
    fpsTRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      controls.update();

      const cdNow = Date.now();
      const wpnList = ['scatter', 'artillery', 'flyover', 'laser', 'seismic', 'carpet', 'blackhole'];
      for (let i = 0; i < wpnList.length; i++) {
         const w = wpnList[i];
         const cd = WEAPON_COOLDOWNS[w];
         const lastFired = weaponCooldownsRef.current[w] || 0;
         const elapsed = cdNow - lastFired;
         const el = document.getElementById(`cooldown-${w}`);
         if (el) {
            if (elapsed < cd) {
               el.style.height = `${(1 - (elapsed / cd)) * 100}%`;
            } else {
               el.style.height = '0%';
            }
         }

         // Update mouse cursor cooldown circle for the currently selected weapon
         if (selectedWeaponRef.current === w) {
            const cursorCircle = document.getElementById('mouse-cooldown-circle');
            const overlayContainer = document.getElementById('mouse-cooldown-overlay');
            if (cursorCircle && overlayContainer) {
               if (elapsed < cd) {
                  const progress = 1 - (elapsed / cd);
                  // 88 is approx circumference of r=14. 
                  cursorCircle.style.strokeDashoffset = String(progress * 88);
                  overlayContainer.style.opacity = '1';
               } else {
                  overlayContainer.style.opacity = '0';
               }
            }
         }
      }

      // ── Schumann Resonance Pulsing Shadow ──────────────────────────────────
      if (shadowPlaneRef.current) {
        // Paused the 7.83Hz fast pulse per user request, setting to a static 90% opacity glow
        const targetOpacity = 0.9; 
        (shadowPlaneRef.current.material as THREE.MeshBasicMaterial).opacity = targetOpacity;
        needsRenderRef.current = true; // Force render
      }

      // ── Hover glow pool lerp — drives trailing fading meshes ──────────────────
      let anyFading = false;
      const fadeSpd = Math.max(0.001, hoverFadeRef.current);
      for (const p of hoverPoolRef.current) {
        if (!p.active) continue;
        
        if (Math.abs(p.targetAlpha - p.currentAlpha) > 0.005) {
          // Snap in fast for crisp feel, fade out according to slider
          const curSpeed = p.targetAlpha > p.currentAlpha ? 0.4 : fadeSpd;
          p.currentAlpha = p.currentAlpha + (p.targetAlpha - p.currentAlpha) * curSpeed;
          
          const mat = p.mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = p.currentAlpha * 5.0;
          mat.opacity           = p.currentAlpha * 0.72;
          p.mesh.visible        = p.currentAlpha > 0.01;
          anyFading = true;
        } else if (p.targetAlpha === 0 && p.currentAlpha < 0.005) {
          p.currentAlpha = 0;
          p.active = false;
          p.blockKey = '';
          p.mesh.visible = false;
          anyFading = true; // one last render
        }
      }
      if (anyFading) needsRenderRef.current = true;

      // ── Weapons Logic ────────────────────────────────────────────────────────
      const now = Date.now();
      const wPrjs = weaponProjectilesRef.current;
      for (let i = wPrjs.length - 1; i >= 0; i--) {
        const wp = wPrjs[i];
        
        if (wp.startTime && wp.delayMs && now - wp.startTime < wp.delayMs) {
           wp.mesh.visible = false;
           continue; // waiting for delay
        }
        wp.mesh.visible = true;

        if (wp.type === 'laser') {
           if (wp.startTime && wp.durationMs) {
             const elapsed = now - wp.startTime;
             wp.progress = Math.min(1.0, elapsed / wp.durationMs);
             const pulse = 0.8 + Math.random() * 0.4;
             wp.mesh.scale.set(pulse, 1, pulse);
             const currentDepth = Math.max(1, Math.floor(wp.progress * wp.depth));
             triggerWeaponImpact(wp.targetX, wp.targetY, wp.targetZ, wp.radius, currentDepth);

             if (wp.progress >= 1.0) {
               scene.remove(wp.mesh);
               (wp.mesh as THREE.Mesh).geometry?.dispose();
               if (Array.isArray((wp.mesh as THREE.Mesh).material)) ((wp.mesh as THREE.Mesh).material as any).forEach((m: any) => m.dispose());
               else ((wp.mesh as THREE.Mesh).material as THREE.Material)?.dispose();
               wPrjs.splice(i, 1);
             }
             needsRenderRef.current = true;
             continue;
           }
        } else if (wp.type === 'seismic') {
           wp.progress += wp.speed;
           const currentRad = wp.progress * wp.radius;
           wp.mesh.scale.set(currentRad, currentRad, 1);
           
           if (wp.mesh instanceof THREE.Mesh && wp.mesh.material instanceof THREE.Material) {
              (wp.mesh.material as any).opacity = Math.max(0, 1.0 - wp.progress);
           }

           triggerWeaponImpact(wp.targetX, wp.targetY, wp.targetZ, currentRad, wp.depth);

           if (wp.progress >= 1.0) {
             scene.remove(wp.mesh);
             (wp.mesh as THREE.Mesh).geometry?.dispose();
             if (Array.isArray((wp.mesh as THREE.Mesh).material)) ((wp.mesh as THREE.Mesh).material as any).forEach((m: any) => m.dispose());
             else ((wp.mesh as THREE.Mesh).material as THREE.Material)?.dispose();
             wPrjs.splice(i, 1);
           }
           needsRenderRef.current = true;
           continue;
        } else if (wp.type === 'blackhole') {
           if (wp.startTime && wp.durationMs) {
             const elapsed = now - wp.startTime;
             wp.progress = Math.min(1.0, elapsed / wp.durationMs);

             const s = 1.0 + wp.progress * 0.5;
             wp.mesh.scale.set(s, s, s);

             if (Math.random() < 0.4) {
                 const numParts = 3;
                 for (let p = 0; p < numParts; p++) {
                    const slot = getFreeParticle();
                    if (!slot) break;
                    
                    const theta = Math.random() * Math.PI * 2;
                    const rad = wp.radius * (0.5 + Math.random() * 0.5);
                    const spawnX = wp.targetX + Math.cos(theta) * rad;
                    const spawnZ = wp.targetZ + Math.sin(theta) * rad;
                    
                    slot.alive  = true;
                    slot.px = spawnX; slot.py = wp.targetY + 2; slot.pz = spawnZ;
                    
                    const dx = wp.targetX - spawnX;
                    const dy = (wp.targetY + 5) - slot.py;
                    const dz = wp.targetZ - spawnZ;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                    
                    const pSpeed = 0.5 + Math.random() * 0.5;
                    slot.vx = (dx/dist) * pSpeed; slot.vy = (dy/dist) * pSpeed; slot.vz = (dz/dist) * pSpeed;
                    slot.age = 0; slot.maxAge = 40 + Math.random() * 20;
                    slot.r = 0.6; slot.g = 0.1; slot.b = 0.8;
                 }
             }

             if (wp.progress >= 1.0) {
               triggerWeaponImpact(wp.targetX, wp.targetY, wp.targetZ, wp.radius, wp.depth);
               scene.remove(wp.mesh);
               (wp.mesh as THREE.Mesh).geometry?.dispose();
               if (Array.isArray((wp.mesh as THREE.Mesh).material)) ((wp.mesh as THREE.Mesh).material as any).forEach((m: any) => m.dispose());
               else ((wp.mesh as THREE.Mesh).material as THREE.Material)?.dispose();
               wPrjs.splice(i, 1);
             }
             needsRenderRef.current = true;
             continue;
           }
        }

        wp.progress += wp.speed;
        if (wp.progress >= 1.0) {
           wp.progress = 1.0;
           // Trigger hit
           triggerWeaponImpact(wp.targetX, wp.targetY, wp.targetZ, wp.radius, wp.depth);
           scene.remove(wp.mesh);
           (wp.mesh as THREE.Mesh).geometry?.dispose();
           if (Array.isArray((wp.mesh as THREE.Mesh).material)) ((wp.mesh as THREE.Mesh).material as any).forEach((m: any) => m.dispose());
           else ((wp.mesh as THREE.Mesh).material as THREE.Material)?.dispose();
           wPrjs.splice(i, 1);
           needsRenderRef.current = true;
           continue;
        }

        // Animate
        if (wp.type === 'scatter' || wp.type === 'flyover' || wp.type === 'carpet') {
           wp.mesh.position.lerpVectors(
              new THREE.Vector3(wp.startX, wp.startY, wp.startZ),
              new THREE.Vector3(wp.targetX, wp.targetY, wp.targetZ),
              wp.progress
           );
        } else if (wp.type === 'artillery') {
           if (wp.curvePt1 && wp.curvePt2) {
             const t = wp.progress;
             const p0 = new THREE.Vector3(wp.startX, wp.startY, wp.startZ);
             const p3 = new THREE.Vector3(wp.targetX, wp.targetY, wp.targetZ);
             const p1 = wp.curvePt1; const p2 = wp.curvePt2;
             const invT = 1 - t;
             wp.mesh.position.x = invT * invT * invT * p0.x + 3 * invT * invT * t * p1.x + 3 * invT * t * t * p2.x + t * t * t * p3.x;
             wp.mesh.position.y = invT * invT * invT * p0.y + 3 * invT * invT * t * p1.y + 3 * invT * t * t * p2.y + t * t * t * p3.y;
             wp.mesh.position.z = invT * invT * invT * p0.z + 3 * invT * invT * t * p1.z + 3 * invT * t * t * p2.z + t * t * t * p3.z;
           }
        }
        needsRenderRef.current = true;
      }
      // ── Treasure Hunters FX: Shuffle Animation & Vignette ──────────────────────
      const isTM = isTreasureModeRef.current;
      const shuffTime = Date.now() - shuffleStartTimeRef.current;
      const tPass = tiltPassRef.current;
      if (tPass) {
        const baseVigDecay = Math.min(1.0, shuffTime > 3000 ? 1.0 : (shuffTime / 3000));
        if (isTM) {
           tPass.uniforms.vigColor.value.copy(vigColorRef.current).lerp(new THREE.Color('#ffc107'), 0.6);
           tPass.uniforms.vignette.value = THREE.MathUtils.lerp(tiltVignette, 0.7, 0.5);
           needsRenderRef.current = true;
        } else {
           tPass.uniforms.vigColor.value.copy(vigColorRef.current);
           tPass.uniforms.vignette.value = tiltVignette;
        }
      }

      // Shuffle logic
      if (isTM && shuffTime < 3000) {
        // Fast at 0, slow at 3000
        const frameSkip = Math.floor(Math.max(1, (shuffTime / 3000) * 8));
        if (rafRef.current % frameSkip === 0) {
           // Spread random hits to generate chaotic blinking
           const targets: THREE.InstancedMesh[] = [];
           if (meshGroupRef.current?.visible) targets.push(...meshGroupRef.current.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh && c.count > 0 && !c.userData.isJitterGlow));
           if (mixedGrpRef.current?.visible) targets.push(...mixedGrpRef.current.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh && c.count > 0));
           
           if (targets.length > 0 && hoverPoolRef.current.length > 0) {
              const rndMesh = targets[Math.floor(Math.random() * targets.length)];
              const rndIdx  = Math.floor(Math.random() * rndMesh.count);
              const blockKey = rndMesh.userData.coordMap ? rndMesh.userData.coordMap[rndIdx] : `shuff_${rndIdx}`;

              // Force everything to fade out over time
              hoverPoolRef.current.forEach(p => p.targetAlpha = 0);
              
              let freeItem = hoverPoolRef.current.find(p => !p.active);
              if (!freeItem) freeItem = hoverPoolRef.current.reduce((min, p) => p.currentAlpha < min.currentAlpha ? p : min, hoverPoolRef.current[0]);
              
              freeItem.active = true;
              freeItem.blockKey = blockKey;
              freeItem.targetAlpha = 1.0;
              freeItem.currentAlpha = 0.5; // kickstart
              
              rndMesh.getMatrixAt(rndIdx, _hoverMatrix);
              _hoverPos.setFromMatrixPosition(_hoverMatrix);
              freeItem.mesh.position.copy(_hoverPos);
              
              const mat = rndMesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
              (freeItem.mesh.material as THREE.MeshStandardMaterial).emissive.copy(mat.emissive);
              freeItem.mesh.visible = true;
              needsRenderRef.current = true;
           }
        }
      } else if (isTM && shuffTime >= 3000 && shuffTime < 3500) {
         hoverPoolRef.current.forEach(p => p.targetAlpha = 0);
      }

      // ── Particle system: frame counter + update alive particles ─────────────
      ++particleFrameRef.current;
      const pData  = particleDataRef.current;
      const particlePts = particlesRef.current;
      const mouseW = mouseWorld3DRef.current;
      let anyParticleAlive = false;
      // (Particle spawning happens in onCanvasMouseMove on hover — see below)

      // Update all alive particles
      if (particlePts) {
        const posAttr = particlePts.geometry.attributes.position as THREE.BufferAttribute;
        const colAttr = particlePts.geometry.attributes.color    as THREE.BufferAttribute;
        let drawCount = 0;
        const limit = Math.min(partLimitRef.current, TERRAIN_MAX_PARTICLES);
        for (let i = 0; i < limit; i++) {
          const p = pData[i];
          if (!p.alive) continue;
          p.age++;
          if (p.age >= p.maxAge) { p.alive = false; continue; }

          // Magnet phase ramps in after the first 40 frames (explosion phase)
          const magnetPhase = Math.min(1, Math.max(0, (p.age - 40) / 70));
          if (magnetPhase > 0) {
            const dx = mouseW.x - p.px;
            const dy = mouseW.y - p.py;
            const dz = mouseW.z - p.pz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.8;
            // Force: stronger when close (like asteroid command gravity well)
            const force = magnetPhase * 0.006 / (dist * 0.4 + 0.5);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            p.vz += (dz / dist) * force;
          }

          // Damping + subtle micro-gravity
          p.vx *= partDecayRef.current;
          p.vy  = p.vy * partDecayRef.current - partFalloffRef.current;
          p.vz *= partDecayRef.current;
          p.px += p.vx;
          p.py += p.vy;
          p.pz += p.vz;

          // Fade out by lifetime
          const life = 1 - p.age / p.maxAge;
          const i3 = drawCount * 3;
          posAttr.array[i3    ] = p.px;
          posAttr.array[i3 + 1] = p.py;
          posAttr.array[i3 + 2] = p.pz;
          colAttr.array[i3    ] = p.r * life * 2.5; // overbright for additive glow
          colAttr.array[i3 + 1] = p.g * life * 2.5;
          colAttr.array[i3 + 2] = p.b * life * 2.5;
          drawCount++;
          anyParticleAlive = true;
        }
        particlePts.geometry.setDrawRange(0, drawCount);
        (posAttr as THREE.BufferAttribute).needsUpdate = true;
        (colAttr  as THREE.BufferAttribute).needsUpdate = true;
        // ── UI Cooldown Progress Bar Update (pure DOM, no React re-render) ──
        if (document.getElementsByClassName) {
           const bars = document.getElementsByClassName('wpn-cooldown-bar');
           if (bars.length > 0) {
              let pendingParts = 0;
              for (let p = 0; p < weaponProjectilesRef.current.length; p++) {
                 const wpt = weaponProjectilesRef.current[p].type;
                 if (wpt === 'scatter') pendingParts += scatterCountRef.current * partCountRef.current;
                 else if (wpt === 'artillery') pendingParts += partCountRef.current;
                 else if (wpt === 'flyover') pendingParts += 8 * partCountRef.current;
                 else if (wpt === 'laser') pendingParts += 20 * partCountRef.current;
                 else if (wpt === 'seismic') pendingParts += 15 * partCountRef.current;
                 else if (wpt === 'carpet') pendingParts += 25 * partCountRef.current;
                 else if (wpt === 'blackhole') pendingParts += 12 * partCountRef.current;
              }
              const ratio = Math.min(1.0, (drawCount + pendingParts) / partLimitRef.current);
              const wStr = `${(ratio * 100).toFixed(1)}%`;
              for (let i = 0; i < bars.length; i++) {
                 (bars[i] as HTMLElement).style.width = wStr;
              }
           }
        }
      }
      if (anyParticleAlive) needsRenderRef.current = true;

      // ── Block Regeneration Logic ──
      if (isHealingRef.current && regenSpeedRef.current > 0) {
         // Scale chance by 5x slower to make the bottom end of the slider actually slow
         const chance = (regenSpeedRef.current / 5) / 60;
         let numToRegen = Math.floor(chance) + (Math.random() < (chance % 1) ? 1 : 0);

         if (numToRegen > 0 && brokenBlocksRef.current.size > 0) {
            const brokenArray = Array.from(brokenBlocksRef.current);
            const candidates = brokenArray.filter(k => 
                (!presetExplodeBlocksRef.current || !presetExplodeBlocksRef.current.has(k)) && 
                (!regeneratingBlocksRef.current || !regeneratingBlocksRef.current.has(k))
            );
            for (let i = 0; i < numToRegen && i < candidates.length; i++) {
               const rIdx = Math.floor(Math.random() * candidates.length);
               const key = candidates[rIdx];
               candidates.splice(rIdx, 1);
               regeneratingBlocksRef.current.set(key, { scale: 0.01 });
               brokenBlocksRef.current.delete(key);
               if (energonPlacedRef.current.has(key)) {
                   const eMesh = energonPlacedRef.current.get(key);
                   if (eMesh && sceneRef.current) sceneRef.current.remove(eMesh);
                   energonPlacedRef.current.delete(key);
               }
            }
         }
      }

      if (regeneratingBlocksRef.current && regeneratingBlocksRef.current.size > 0) {
         let didUpdateMeshes = false;
         // Link animation fade speed directly to the regen speed slider!
         const baseFadeStep = Math.max(0.002, (regenSpeedRef.current / 1000) * 0.1);
         const dummy = new THREE.Object3D();
         const mat = new THREE.Matrix4();
         
         const mGroups = [meshGroupRef.current, mixedGrpRef.current].filter(Boolean);
         
         for (const [key, state] of Array.from(regeneratingBlocksRef.current.entries())) {
            const step = state.fast ? 0.15 : baseFadeStep;
            state.scale = Math.min(1.0, state.scale + step);
            
            for (const grp of mGroups) {
               for (const m of (grp as THREE.Group).children) {
                  const iMesh = m as THREE.InstancedMesh;
                  if (iMesh.userData?.coordIndexMap?.has(key)) {
                     const idx = iMesh.userData.coordIndexMap.get(key);
                     iMesh.getMatrixAt(idx, mat);
                     const pos = new THREE.Vector3().setFromMatrixPosition(mat);
                     dummy.position.copy(pos);
                     dummy.scale.set(state.scale, state.scale, state.scale);
                     dummy.updateMatrix();
                     iMesh.setMatrixAt(idx, dummy.matrix);
                     iMesh.instanceMatrix.needsUpdate = true;
                     didUpdateMeshes = true;
                  }
               }
            }
            if (state.scale >= 1.0) {
               regeneratingBlocksRef.current.delete(key);
            }
         }
         if (didUpdateMeshes) needsRenderRef.current = true;
      }

      // ── Beam animation: face camera + scale up when altar complete ──
      const cam = cameraRef.current;
      if (cam) {
        beamMeshesRef.current.forEach((beam, idx) => {
          if (!beam.visible) return;
          needsRenderRef.current = true;
          // Face camera (billboard)
          beam.lookAt(cam.position);
          // Animate scale from 0→1 over ~2s
          if (beamScaleRef.current[idx] < 1) {
            beamScaleRef.current[idx] = Math.min(1, beamScaleRef.current[idx] + 0.008);
            beam.scale.set(1, beamScaleRef.current[idx], 1);
          }
          // Slow rise offset
          beam.position.y += Math.sin(Date.now() * 0.001 + idx) * 0.001;
        });
        // Spin placed energon cubes
        energonPlacedRef.current.forEach(mesh => {
          mesh.rotation.y += 0.012;
          needsRenderRef.current = true;
        });
      }

      if (flockEngineRef.current) {
         if (sheepAnimate && flockEngineRef.current.mesh.count > 0) {
            needsRenderRef.current = true;
         }
         const dt = 0.016;
         const getElev = (px: number, pz: number) => {
            const h = terrainRef.current.length, w = terrainRef.current[0]?.length ?? 0;
            const offsetX = -w / 2;
            const offsetZ = -h / 2;
            const gx = Math.round(px - offsetX);
            const gy = Math.round(pz - offsetZ);
            
            if (gx >= 0 && gx < w && gy >= 0 && gy < h) {
                const cellH = terrainRef.current[gy][gx] ?? 1;
                for (let hTest = cellH - 1; hTest >= 0; hTest--) {
                    const isLargeMap = layoutTabRef.current === 'large_map';
                    // Sheep engine strictly clamps positions to bounds, so no complex wrapping needed
                    const targetKey = `${gx}_${gy}_${hTest}`;
                    if (!brokenBlocksRef.current.has(targetKey)) {
                        return hTest + 1;
                    }
                }
                return -100; // Empty crater floor
            }
            return -100;
         };
         flockEngineRef.current.update(dt, Date.now() / 1000, getElev, camera);
          
          // Wave Logic & UI Update
          const aliveCount = flockEngineRef.current.getLivingCount();
          
          if (!isGameOverRef.current) {
              const elapsedSecs = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
              totalTimeRef.current = elapsedSecs;
          }
          const mins = Math.floor(totalTimeRef.current / 60);
          const secs = totalTimeRef.current % 60;
          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          if (waveUIRef.current) {
              waveUIRef.current.innerHTML = `
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px;">Wave ${waveNumberRef.current}</div>
                <div style="font-size: 24px; font-weight: 600; color: #ff3b30; letter-spacing: -0.5px;">${aliveCount} Remaining</div>
                
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-top: 12px; margin-bottom: 4px;">Time</div>
                <div style="font-size: 24px; font-weight: 600; color: #0a84ff; letter-spacing: -0.5px;">${timeStr}</div>

                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-top: 12px; margin-bottom: 4px;">Score</div>
                <div style="font-size: 24px; font-weight: 600; color: #ffd60a; letter-spacing: -0.5px;">${sheepScoreRef.current}</div>

                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-top: 12px; margin-bottom: 4px;">Shots Fired</div>
                <div style="font-size: 24px; font-weight: 600; color: #34c759; letter-spacing: -0.5px;">${shotsFiredRef.current}</div>
              `;
          }

          // Trigger next wave if all sheep are dead (and wave has actually spawned)
          if (aliveCount === 0 && flockEngineRef.current.mesh.count > 0 && !isTransitioningWaveRef.current) {
              isTransitioningWaveRef.current = true;
              
              const sheepInWave = flockEngineRef.current.mesh.count;
              sheepScoreRef.current += sheepInWave * (12 * waveNumberRef.current);
              totalKillsRef.current += sheepInWave;

              if (waveNumberRef.current >= 18) {
                  isGameOverRef.current = true;
                  const basePoints = totalKillsRef.current * 25000;
                  const shotsPen = shotsFiredRef.current * 5000;
                  const timePen = totalTimeRef.current * 15000;
                  const finalScore = Math.max(0, basePoints - shotsPen - timePen);
                  setVictoryStats({
                      score: finalScore,
                      kills: totalKillsRef.current,
                      shots: shotsFiredRef.current,
                      time: totalTimeRef.current,
                      base: basePoints
                  });
                  return; 
              }

              // If Auto-Heal is OFF, we trigger a rapid one-time heal for all craters at the end of the round!
              if (!isHealingRef.current) {
                  for (const k of Array.from(brokenBlocksRef.current)) {
                      regeneratingBlocksRef.current.set(k, { scale: 0.01, fast: true });
                      if (energonPlacedRef.current.has(k)) {
                          const eMesh = energonPlacedRef.current.get(k);
                          if (eMesh && sceneRef.current) sceneRef.current.remove(eMesh);
                          energonPlacedRef.current.delete(k);
                      }
                  }
                  brokenBlocksRef.current.clear();
              }

              let nextWave = waveNumberRef.current + 1;
              waveNumberRef.current = nextWave;
              const nextCount = nextWave === 1 ? 1 : Math.round(3 * Math.pow(1.618, nextWave - 1));
              
              // We DO NOT change the seed anymore, keep the same board!
              // Healing will continue independently in the background based on the slider speed.
              if (presetExplodeBlocksRef.current) presetExplodeBlocksRef.current.clear();
              if (energonPlacedRef.current) energonPlacedRef.current.clear();
              
              if (waveUIRef.current) {
                  waveUIRef.current.style.borderColor = '#4096ff'; // Flash border!
                  setTimeout(() => {
                      if (waveUIRef.current) waveUIRef.current.style.borderColor = 'rgba(255,255,255,0.1)';
                  }, 500);
              }

              announceWave(nextWave, nextCount);
          }
      }

      if (!needsRenderRef.current) return;
      needsRenderRef.current = false;

      if (shadowsDirtyRef.current) {
        renderer.shadowMap.needsUpdate = true;
        shadowsDirtyRef.current = false;
      }

      composer.render();
      fpsCountRef.current++;
      if (fpsCountRef.current >= 20) {
        const now  = performance.now();
        const fps  = Math.round(20000 / (now - fpsTRef.current));
        if (fpsElRef.current) fpsElRef.current.textContent = `${fps} FPS`;
        fpsTRef.current      = now;
        fpsCountRef.current  = 0;
      }
    };
    loop();

    // Resize
    const ro = new ResizeObserver(() => {
      const nW = el.clientWidth, nH = el.clientHeight;
      renderer.setSize(nW, nH);
      composer.setSize(nW, nH);
      bloom.setSize(nW / 4, nH / 4);  // keep bloom at quarter-res on resize too
      const asp = nW / nH, f = camera.top;
      camera.left = -f * asp; camera.right = f * asp;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    // ── Raycaster: click on slot mesh → place energon cube ────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onCanvasClick_Energon = (e: MouseEvent) => {
      const aIdx = selectedEnergonRef.current;
      if (aIdx === null) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const slotMeshes = [...slotMeshesRef.current.values()].filter(m => m.userData.altarIdx === aIdx);
      const hits = raycaster.intersectObjects(slotMeshes);
      if (!hits.length) return;
      const hit = hits[0].object as THREE.Mesh;
      const altIdx  = hit.userData.altarIdx as number;
      const slotIdx = hit.userData.slotIdx  as number;
      const key = `${altIdx}_${slotIdx}`;
      if (energonPlacedRef.current.has(key)) return; // already filled
      // Place energon cube above the slot
      const slot = slotMeshesRef.current.get(key)!;
      const col  = new THREE.Color(HEX_ALTAR_COLORS[altIdx]);
      const eMat = new THREE.MeshStandardMaterial({
        color: col.clone().multiplyScalar(0.6), emissive: col,
        emissiveIntensity: 2.8, roughness: 0.08, metalness: 0.85,
        transparent: false,
      });
      const eMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), eMat);
      eMesh.position.copy(slot.position);
      eMesh.position.y += 0.55;
      hexWorldGrpRef.current?.add(eMesh);
      energonPlacedRef.current.set(key, eMesh);
      // Update filled state
      const newFilled = slotsFilledRef.current.map(a=>[...a]);
      newFilled[altIdx][slotIdx] = true;
      slotsFilledRef.current = newFilled;
      setSlotsFilled(newFilled.map(a=>[...a]));
      // Check altar complete → show beam
      const allFilled = newFilled[altIdx].every(Boolean);
      if (allFilled) {
        const beam = beamMeshesRef.current.get(altIdx);
        if (beam) { beam.visible = true; beamScaleRef.current[altIdx] = 0; }
        // Boost lights
        const hexGrp = hexWorldGrpRef.current;
        if (hexGrp) {
          for (const child of hexGrp.children) {
            if (child.userData.altarIdx !== altIdx) continue;
            if (child instanceof THREE.PointLight) child.intensity *= 5;
            if (child instanceof THREE.Mesh) {
              const m = child.material as THREE.MeshStandardMaterial;
              if (m?.isMeshStandardMaterial) { m.emissiveIntensity *= 4; m.needsUpdate = true; }
            }
          }
        }
      }
      needsRenderRef.current = true;
      shadowsDirtyRef.current = true;
    };
    renderer.domElement.addEventListener('click', onCanvasClick_Energon);

    // ── Hover raycaster — emissive glow on the block under the cursor ──────
    const hoverRaycaster = new THREE.Raycaster();
    const hoverMouse     = new THREE.Vector2();
    const _hoverMatrix   = new THREE.Matrix4(); // reused every frame — no GC
    const _hoverPos      = new THREE.Vector3();

    let lastHoverTime = 0;
    const onCanvasMouseMove = (e: MouseEvent) => {
      // Update mouse cooldown overlay position instantly
      const overlay = document.getElementById('mouse-cooldown-overlay');
      if (overlay) {
         overlay.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`;
      }

      const now = performance.now();
      if (now - lastHoverTime < 32) return; // Throttle to ~30 raycasts/second max to prevent CPU exhaustion
      lastHoverTime = now;
      
      const rect = renderer.domElement.getBoundingClientRect();
      const cx =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const cy = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      
      const targets: THREE.Object3D[] = [];
      if (meshGroupRef.current?.visible) targets.push(...meshGroupRef.current.children.filter((c) => (c instanceof THREE.InstancedMesh && !c.userData.isJitterGlow) || c.userData.isCheatBlock));
      if (mixedGrpRef.current?.visible) targets.push(...mixedGrpRef.current.children.filter((c) => c instanceof THREE.InstancedMesh || c.userData.isCheatBlock));
      
      if (targets.length === 0) return;

      const cMouse = new THREE.Vector2(cx, cy);
      hoverRaycaster.setFromCamera(cMouse, camera);
      const hits = hoverRaycaster.intersectObjects(targets, false);

      if (hits.length > 0) {
        const hit     = hits[0];
        const obj     = hit.object;
        let blockKey  = '';

        if (obj.userData.isCheatBlock) {
           blockKey = cheatBlockRef.current ?? 'cheat';
        } else if (obj instanceof THREE.InstancedMesh) {
           const instIdx = hit.instanceId ?? 0;
           blockKey = obj.userData.coordMap ? obj.userData.coordMap[instIdx] : `${instIdx}`;
        }
        
        if (hoverCurrentlyHitRef.current === blockKey) return; 

        // Start fade-out for all OTHER blocks.
        hoverPoolRef.current.forEach(p => { if (p.blockKey !== blockKey) p.targetAlpha = 0; });
        hoverCurrentlyHitRef.current = blockKey;

        let item = hoverPoolRef.current.find(p => p.active && p.blockKey === blockKey);
        if (!item) {
          item = hoverPoolRef.current.find(p => !p.active);
          if (!item) item = hoverPoolRef.current.reduce((min, p) => p.currentAlpha < min.currentAlpha ? p : min, hoverPoolRef.current[0]);
          
          item.active = true;
          item.blockKey = blockKey;
          item.currentAlpha = 0.5; // kickstart it quickly
          
          if (obj.userData.isCheatBlock) {
              item.mesh.position.copy(obj.position);
              const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
              (item.mesh.material as THREE.MeshStandardMaterial).emissive.copy(mat.emissive);
          } else if (obj instanceof THREE.InstancedMesh) {
              const instIdx = hit.instanceId ?? 0;
              obj.getMatrixAt(instIdx, _hoverMatrix);
              _hoverPos.setFromMatrixPosition(_hoverMatrix);
              item.mesh.position.copy(_hoverPos);
              const mat = obj.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
              (item.mesh.material as THREE.MeshStandardMaterial).emissive.copy(mat.emissive);
          }
          item.mesh.visible = true;
        }
        item.targetAlpha = 1.0;
        needsRenderRef.current = true;
      } else {
        if (hoverCurrentlyHitRef.current !== null) {
          hoverPoolRef.current.forEach(p => p.targetAlpha = 0);
          hoverCurrentlyHitRef.current = null;
          needsRenderRef.current = true;
        }
      }

      // Update magnet
      hoverRaycaster.ray.intersectPlane(_magnetPlane, _magnetTarget);
      if (_magnetTarget.lengthSq() > 0) {
        mouseWorld3DRef.current.copy(_magnetTarget);
      }
    };

    const onCanvasMouseLeave = () => {
      hoverPoolRef.current.forEach(p => p.targetAlpha = 0);
      hoverCurrentlyHitRef.current = null;
      needsRenderRef.current = true;
    };

    const _clickMatrix = new THREE.Matrix4();
    const _clickScaleDummy = new THREE.Vector3(0,0,0);
    
    let _pointerDownPos = { x: 0, y: 0 };
    const onCanvasPointerDown = (e: PointerEvent) => {
      _pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onCanvasPointerUp_Action = (e: PointerEvent) => {
      // Ignore click if it was actually a camera drag
      if (Math.abs(e.clientX - _pointerDownPos.x) > 5 || Math.abs(e.clientY - _pointerDownPos.y) > 5) return;

      if (isTreasureModeRef.current && Date.now() - shuffleStartTimeRef.current < 3000) return; // ignore clicks during shuffle

      const rect = renderer.domElement.getBoundingClientRect();
      const pt = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      hoverRaycaster.setFromCamera(pt, camera);

      const targets: THREE.Object3D[] = [];
      if (meshGroupRef.current?.visible) targets.push(...meshGroupRef.current.children.filter((c) => (c instanceof THREE.InstancedMesh && !c.userData.isJitterGlow) || c.userData.isCheatBlock));
      if (mixedGrpRef.current?.visible) targets.push(...mixedGrpRef.current.children.filter((c) => c instanceof THREE.InstancedMesh || c.userData.isCheatBlock));
      if (targets.length === 0) return;
      
      const hits = hoverRaycaster.intersectObjects(targets, false);

      if (hits.length > 0) {
        const hit = hits[0];
        
        // ── PREDATOR SCARE RESPONSE ──────────────────────────────────────────
        // Any click on the terrain "spooks" nearby sheep
        if (flockEngineRef.current) {
            flockEngineRef.current.scare(hit.point.x, hit.point.z, 15.0);
        }

        // ── AUTO WIN CHEAT ───────────────────────────────────────────────────
        if (hit.object.userData.isCheatBlock) {
             const targetGroup = renderModeRef.current === 'glass' ? meshGroupRef.current : mixedGrpRef.current;
             if (cheatBlockMeshRef.current && targetGroup) {
                 targetGroup.remove(cheatBlockMeshRef.current);
                 cheatBlockMeshRef.current = null;
             }
             isGameOverRef.current = true;
             const cheatBase = 50 * 25000;
             const shotsPen = shotsFiredRef.current * 5000;
             const timePen = totalTimeRef.current * 15000;
             setVictoryStats({
                 score: Math.max(0, cheatBase - shotsPen - timePen),
                 kills: 50,
                 shots: shotsFiredRef.current,
                 time: totalTimeRef.current,
                 base: cheatBase
             });
             cheatBlockRef.current = null;
             return;
        }
        
        // ── WEAPON SYSTEM RAID MODE ──────────────────────────────────────────
        if (isRaidModeRef.current && selectedWeaponRef.current) {
           const wpType = selectedWeaponRef.current;

           // ── SPAM PREVENTION & COOLDOWN ─────────────────────────────────────
           const now = Date.now();
           const lastFired = weaponCooldownsRef.current[wpType] || 0;
           const cd = WEAPON_COOLDOWNS[wpType];
           if (now - lastFired < cd) {
              return; // Weapon is on cooldown
           }

           let activeParts = 0;
           const pd = particleDataRef.current;
           const lim = partLimitRef.current;
           for (let i = 0; i < lim; i++) if (pd[i].alive) activeParts++;
           
           let pendingParts = 0;
           for (let i = 0; i < weaponProjectilesRef.current.length; i++) {
              const wpt = weaponProjectilesRef.current[i].type;
              if (wpt === 'scatter') pendingParts += scatterCountRef.current * partCountRef.current;
              else if (wpt === 'artillery') pendingParts += partCountRef.current;
              else if (wpt === 'flyover') pendingParts += 8 * partCountRef.current;
              else if (wpt === 'laser') pendingParts += 20 * partCountRef.current;
              else if (wpt === 'seismic') pendingParts += 15 * partCountRef.current;
              else if (wpt === 'carpet') pendingParts += 25 * partCountRef.current;
              else if (wpt === 'blackhole') pendingParts += 12 * partCountRef.current;
           }

           let requestedParts = 200;
           if (wpType === 'scatter') requestedParts = scatterCountRef.current * partCountRef.current;
           else if (wpType === 'artillery') requestedParts = partCountRef.current;
           else if (wpType === 'flyover') requestedParts = 8 * partCountRef.current;
           else if (wpType === 'laser') requestedParts = 20 * partCountRef.current;
           else if (wpType === 'seismic') requestedParts = 15 * partCountRef.current;
           else if (wpType === 'carpet') requestedParts = 25 * partCountRef.current;
           else if (wpType === 'blackhole') requestedParts = 12 * partCountRef.current;

           // If firing this munition would exceed our active engine limits, block the click!
           if (activeParts + pendingParts + requestedParts > lim) {
              console.warn(`[Spam Prevention] Cooldown active! Waiting for ${activeParts + pendingParts}/${lim} particles to decay...`);
              return; 
           }

           // Valid shot fired!
           weaponCooldownsRef.current[wpType] = Date.now();
           shotsFiredRef.current += 1;
           if (waveUIRef.current && flockEngineRef.current) {
               waveUIRef.current.innerHTML = `
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px;">Wave ${waveNumberRef.current}</div>
                <div style="font-size: 24px; font-weight: 600; color: #ff3b30; letter-spacing: -0.5px;">${flockEngineRef.current.getLivingCount()} Remaining</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-top: 12px; margin-bottom: 4px;">Shots Fired</div>
                <div style="font-size: 24px; font-weight: 600; color: #34c759; letter-spacing: -0.5px;">${shotsFiredRef.current}</div>
               `;
           }

           const targetPos = new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z);

           if (wpType === 'scatter') {
              for (let b = 0; b < scatterCountRef.current; b++) {
                 // Randomize target
                 const rd = scatterRadiusRef.current;
                 const ox = (Math.random() - 0.5) * rd;
                 const oz = (Math.random() - 0.5) * rd;
                 const finalX = targetPos.x + ox;
                 const finalZ = targetPos.z + oz;
                 
                 const pGeo = new THREE.SphereGeometry(0.3, 8, 8);
                 const pMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
                 const pMesh = new THREE.Mesh(pGeo, pMat);
                 pMesh.visible = false;
                 scene.add(pMesh);
                 
                 weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'scatter', mesh: pMesh,
                   startX: finalX, startY: targetPos.y + 40 + Math.random() * 20, startZ: finalZ,
                   targetX: finalX, targetY: targetPos.y, targetZ: finalZ,
                   progress: 0, speed: 0.015 + Math.random() * 0.01,
                   radius: scatterRadiusRef.current, depth: scatterDepthRef.current,
                   delayMs: scatterDelayRef.current, startTime: Date.now()
                 });
              }
           } else if (wpType === 'artillery') {
              const pGeo = new THREE.SphereGeometry(0.6, 12, 12);
              const pMat = new THREE.MeshBasicMaterial({ color: 0xff8833 });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.visible = false;
              scene.add(pMesh);
              
              const startX = targetPos.x - 30;
              const startZ = targetPos.z - 30;
              const startY = targetPos.y + 40;
              
              // Simple cubic bezier curve logic handled in loop via P1/P2
              weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'artillery', mesh: pMesh,
                   startX, startY, startZ,
                   targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
                   curvePt1: new THREE.Vector3(startX + 10, startY + 10, startZ + 10),
                   curvePt2: new THREE.Vector3(targetPos.x - 5, targetPos.y + 20, targetPos.z - 5),
                   progress: 0, speed: 0.015,
                   radius: artilleryRadiusRef.current, depth: artilleryDepthRef.current,
                   delayMs: artilleryDelayRef.current, startTime: Date.now()
              });
           } else if (wpType === 'flyover') {
              // Highlight selected block immediately using hover glow
              const iMesh = hit.object as THREE.InstancedMesh;
              const instIdx = hit.instanceId ?? 0;
              if (iMesh.userData.coordMap) {
                 const blockKey = iMesh.userData.coordMap[instIdx];
                 if (blockKey) {
                    const poolItem = hoverPoolRef.current.find(p => !p.active);
                    if (poolItem) {
                       poolItem.active = true;
                       poolItem.blockKey = blockKey;
                       poolItem.targetAlpha = 0.9;
                       
                       const _dummyMat = new THREE.Matrix4();
                       iMesh.getMatrixAt(instIdx, _dummyMat);
                       poolItem.mesh.position.setFromMatrixPosition(_dummyMat);
                       poolItem.mesh.visible = true;
                       (poolItem.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x3388ff);
                    }
                 }
              }
              
              const pGeo = new THREE.BoxGeometry(0.5, 0.5, 1.5);
              const pMat = new THREE.MeshBasicMaterial({ color: 0x3388ff });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              
              const delay = flyoverDelayRef.current;
              
              const startX = targetPos.x + 20;
              const startY = targetPos.y + 60;
              const startZ = targetPos.z + 20;
              
              pMesh.position.set(startX, startY, startZ);
              pMesh.lookAt(targetPos);
              pMesh.visible = false;
              scene.add(pMesh);
              
              weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'flyover', mesh: pMesh,
                   startX, startY, startZ,
                   targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
                   progress: 0, speed: 0.025,
                   radius: flyoverRadiusRef.current, depth: flyoverDepthRef.current,
                   delayMs: delay, startTime: Date.now()
              });
           } else if (wpType === 'laser') {
              // Massive 2000 unit height so it extends infinitely past the top and bottom of the screen
              const pGeo = new THREE.CylinderGeometry(laserRadiusRef.current * 0.8, laserRadiusRef.current * 0.4, 2000, 16);
              const pMat = new THREE.MeshBasicMaterial({ color: 0xff1111, transparent: true, opacity: 0.8 });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              // Center it higher up so it extends 500 units BELOW the impact point, and 1500 units ABOVE.
              pMesh.position.set(targetPos.x, targetPos.y + 500, targetPos.z);
              scene.add(pMesh);
              
              weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'laser', mesh: pMesh,
                   startX: targetPos.x, startY: targetPos.y + 500, startZ: targetPos.z,
                   targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
                   progress: 0, speed: 0,
                   radius: laserRadiusRef.current, depth: laserDepthRef.current,
                   delayMs: laserDelayRef.current, startTime: Date.now(),
                   durationMs: laserDurationRef.current
              });
           } else if (wpType === 'seismic') {
              const pGeo = new THREE.RingGeometry(0.1, 0.4, 32);
              const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1, side: THREE.DoubleSide });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.rotation.x = -Math.PI / 2;
              pMesh.position.set(targetPos.x, targetPos.y + 1, targetPos.z);
              scene.add(pMesh);
              
              weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'seismic', mesh: pMesh,
                   startX: targetPos.x, startY: targetPos.y + 1, startZ: targetPos.z,
                   targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
                   progress: 0, speed: seismicSpeedRef.current / 1000,
                   radius: seismicRadiusRef.current, depth: seismicDepthRef.current,
                   delayMs: seismicDelayRef.current, startTime: Date.now()
              });
           } else if (wpType === 'carpet') {
              const count = carpetCountRef.current;
              const angle = Math.random() * Math.PI * 2;
              const spacing = 3;
              const dx = Math.cos(angle) * spacing;
              const dz = Math.sin(angle) * spacing;
              
              const startOffsetX = targetPos.x - (count / 2) * dx;
              const startOffsetZ = targetPos.z - (count / 2) * dz;
              
              for (let j = 0; j < count; j++) {
                const bx = startOffsetX + j * dx;
                const bz = startOffsetZ + j * dz;
              
                const pGeo = new THREE.BoxGeometry(0.5, 0.5, 1.5);
                const pMat = new THREE.MeshBasicMaterial({ color: 0x66dd66 });
                const pMesh = new THREE.Mesh(pGeo, pMat);
                
                const startX = bx + 20;
                const startY = targetPos.y + 60;
                const startZ = bz + 20;
                
                pMesh.position.set(startX, startY, startZ);
                pMesh.lookAt(new THREE.Vector3(bx, targetPos.y, bz));
                pMesh.visible = false;
                scene.add(pMesh);
                
                weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'carpet', mesh: pMesh,
                   startX, startY, startZ,
                   targetX: bx, targetY: targetPos.y, targetZ: bz,
                   progress: 0, speed: 0.05,
                   radius: carpetRadiusRef.current, depth: carpetDepthRef.current,
                   delayMs: j * carpetDelayRef.current, startTime: Date.now()
                });
              }
           } else if (wpType === 'blackhole') {
              const pGeo = new THREE.SphereGeometry(1.5, 32, 32);
              const pMat = new THREE.MeshBasicMaterial({ color: 0x050111 });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.position.set(targetPos.x, targetPos.y + 5, targetPos.z);
              scene.add(pMesh);
              
              weaponProjectilesRef.current.push({
                   id: Math.random().toString(),
                   type: 'blackhole', mesh: pMesh,
                   startX: targetPos.x, startY: targetPos.y + 5, startZ: targetPos.z,
                   targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
                   progress: 0, speed: 0,
                   radius: blackholeRadiusRef.current, depth: blackholeDepthRef.current,
                   delayMs: blackholeDelayRef.current, startTime: Date.now(),
                   durationMs: blackholeDurationRef.current
              });
           }
           
           return; // End early.
        }

        const iMesh = hit.object as THREE.InstancedMesh;
        const instIdx = hit.instanceId ?? 0;

        if (iMesh.userData.coordMap) {
          const blockKey = iMesh.userData.coordMap[instIdx];
          if (blockKey && !brokenBlocksRef.current.has(blockKey) && (presetExplodeBlocksRef.current.has(blockKey) || isTreasureModeRef.current)) { // Break it!
            // 1. Log broken block
            setBrokenBlocks(prev => {
              const next = new Set(prev);
              next.add(blockKey);
              return next;
            });

            // 2. Hide immediately without full rebuild
            iMesh.getMatrixAt(instIdx, _clickMatrix);
            // Scale out the diagonal
            _clickMatrix.elements[0] = 0;
            _clickMatrix.elements[5] = 0;
            _clickMatrix.elements[10] = 0;
            iMesh.setMatrixAt(instIdx, _clickMatrix);
            iMesh.instanceMatrix.needsUpdate = true;

            // Also hide the glow mesh if running
            const ci = iMesh.userData.colorIndex;
            const gMesh = (sceneRef.current?.children.find(c => c === meshGroupRef.current)?.children ?? [])
               .filter(c => c.userData.isJitterGlow && c.userData.colorIndex === ci)[0] as THREE.InstancedMesh;
            if (gMesh) {
              gMesh.setMatrixAt(instIdx, _clickMatrix);
              gMesh.instanceMatrix.needsUpdate = true;
            }

            // Turn off any glow mesh on this block instantly
            hoverPoolRef.current.forEach(p => {
              if (p.blockKey === blockKey) {
                 p.targetAlpha = 0;
                 p.currentAlpha = 0;
                 p.mesh.visible = false;
                 p.active = false;
              }
            });

            // Trigger Sheep explosion physics dynamically
            const breakPos = new THREE.Vector3().setFromMatrixPosition(_clickMatrix);
            if (flockEngineRef.current) {
                const conf = flockEngineRef.current.config;
                flockEngineRef.current.explode(breakPos.x, breakPos.z, conf.explodeForce, conf.explodeRadius);
            }

            // 3. Huge Particle Burst!
            const layerCol = (iMesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial).emissive;
            const numParts = 200; // Force huge party!
            for (let p = 0; p < numParts; p++) {
              const slot = getFreeParticle();
              if (!slot) break;
              const speed = 0.2 + Math.random() * 0.4;
              const theta  = Math.random() * Math.PI * 2;
              const phi    = Math.random() * Math.PI;
              slot.alive  = true;
              slot.px = hit.point.x;
              slot.py = hit.point.y + 0.5;
              slot.pz = hit.point.z;
              slot.vx = Math.sin(phi) * Math.cos(theta) * speed;
              slot.vy = Math.cos(phi) * speed + 0.1;
              slot.vz = Math.sin(phi) * Math.sin(theta) * speed;
              slot.age    = 0;
              slot.maxAge = 180 + Math.random() * 80;
              slot.r = layerCol.r; slot.g = layerCol.g; slot.b = layerCol.b;
            }
            needsRenderRef.current = true;
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onCanvasMouseMove);
    renderer.domElement.addEventListener('mouseleave', onCanvasMouseLeave);
    renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
    renderer.domElement.addEventListener('pointerup', onCanvasPointerUp_Action);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.domElement.removeEventListener('click', onCanvasClick_Energon);
      renderer.domElement.removeEventListener('pointerdown', onCanvasPointerDown);
      renderer.domElement.removeEventListener('pointerup', onCanvasPointerUp_Action);
      renderer.domElement.removeEventListener('mousemove', onCanvasMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onCanvasMouseLeave);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      ro.disconnect();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Live TiltShift update (blur + spread + vignette + vigColor as separate uniforms)
  useEffect(() => {
    const tp = tiltPassRef.current;
    if (tp) {
      const u = tp.uniforms as Record<string, THREE.IUniform>;
      u.blur.value      = tiltBlur;
      u.spread.value    = tiltSpread;
      u.vignette.value  = tiltVignette;
      // PERF: reuse persistent Color instance — avoids GC allocation on rapid slider drags
      u.vigColor.value  = vigColorRef.current.set(vigColor);
      // PERF: disable the pass entirely when blur is effectively zero — saves a full GPU blit
      tp.enabled = tiltBlur > 0.003;
      needsRenderRef.current = true;
    }
  }, [tiltBlur, tiltSpread, tiltVignette, vigColor]);

  // Live layer-colour + terrainTint — zero rebuild, just swap material colours
  // Layer color is primary (90%), terrainTint is a subtle 10% overlay
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    const tintCol = new THREE.Color(terrainTint);
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      const mat = child.material as THREE.MeshPhysicalMaterial;
      const ci  = (child.userData.colorIndex as number) ?? 0;
      const levelCol = new THREE.Color(layerColors[ci] ?? DEFAULT_LAYER_COLORS[ci]);
      const blended  = levelCol.clone().lerp(tintCol, 0.1);

      if (child.userData.isJitterGlow) {
         const mat = child.material as THREE.MeshStandardMaterial;
         mat.emissive.copy(levelCol);
         mat.needsUpdate = true;
      } else {
         const mat = child.material as THREE.MeshPhysicalMaterial;
         mat.color.copy(blended);
         mat.needsUpdate = true;
      }
    }
    needsRenderRef.current = true;
  }, [layerColors, terrainTint]);

  // Live transmission material update
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      if ((child.material as any).type !== 'MeshPhysicalMaterial') continue;
      const mat = child.material as THREE.MeshPhysicalMaterial;
      mat.transmission = matTransmit;
      mat.thickness    = matThickness;
      mat.ior          = matIor;
      mat.transparent  = matTransmit < 0.05;
      mat.needsUpdate  = true;
    }
    needsRenderRef.current = true;
  }, [matTransmit, matThickness, matIor]);

  // Live bloom update — strength and threshold both need a re-render
  useEffect(() => {
    const bp = bloomPassRef.current;
    if (!bp) return;
    bp.strength  = bloomStr;
    bp.threshold = bloomThresh;
    needsRenderRef.current = true;
  }, [bloomStr, bloomThresh]);

  // Live glow & opacity — update the 5 InstancedMesh materials directly (no traverse)
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;

      if (child.userData.isJitterGlow) {
         const mat = child.material as THREE.MeshStandardMaterial;
         mat.emissiveIntensity = glowInt * 5.0; // matched to jitter glow
         mat.opacity = 0.72;
         mat.needsUpdate = true;
      } else {
         const mat = child.material as THREE.MeshPhysicalMaterial;
         if (!mat) continue;
         const hr = (child.userData.heightRatio as number) ?? 0;
         mat.emissiveIntensity = baseGlow; // Base terrain uses baseGlow
         mat.opacity           = Math.max(0.05, opacity - hr * 0.05);
         mat.needsUpdate       = true;
      }
    }
    needsRenderRef.current = true;
  }, [glowInt, baseGlow, opacity]);

  // Adjust particle settings dynamically
  useEffect(() => {
    if (particlesRef.current) {
        (particlesRef.current.material as THREE.PointsMaterial).size = partSize * 5.0;
        needsRenderRef.current = true;
    }
  }, [partSize]);

  // ── Sync group visibility when render mode changes ──────────────────────────
  useEffect(() => {
    if (meshGroupRef.current)  meshGroupRef.current.visible  = renderMode === 'glass';
    if (mixedGrpRef.current)   mixedGrpRef.current.visible   = renderMode === 'mixed';
    needsRenderRef.current = true;
    if (renderMode === 'mixed' && terrainRef.current.length) {
      rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode]);

  // ── Show/hide hex world vs procedural groups when layout tab changes ────────────
  useEffect(() => {
    const hexGrp     = hexWorldGrpRef.current;
    const meshGrp    = meshGroupRef.current;
    const mixedGrp   = mixedGrpRef.current;
    const beaconGrp  = beaconGrpRef.current;
    const isCustom   = layoutTab === 'custom';
    // Hex world only visible in Custom tab
    if (hexGrp)    hexGrp.visible    = false; // only show after explicit Generate click
    // Procedural terrain groups respect renderMode, but stay hidden in Custom
    if (meshGrp)   meshGrp.visible   = !isCustom && renderMode === 'glass';
    if (mixedGrp)  mixedGrp.visible  = !isCustom && renderMode === 'mixed';
    // Beacons: show in procedural, hide in custom (custom uses its own structures)
    if (beaconGrp) beaconGrp.visible = !isCustom;
    needsRenderRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutTab]);

  // ── Auto-regenerate terrain meshes when expanding boundaries to large_map ────────────
  useEffect(() => {
    if ((layoutTab === 'procedural' || layoutTab === 'large_map') && terrainRef.current.length > 0) {
      if (renderMode === 'glass') {
        rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, brokenBlocks);
      } else {
        rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, brokenBlocks);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutTab]);

  // ── Rebuild mixed terrain when enabled shapes change ──────────────────────
  useEffect(() => {
    if (renderMode !== 'mixed' || !terrainRef.current.length) return;
    rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledShapes]);

  // ── Live camera angle — elevation + azimuth + zoom ─────────────────────────────
  useEffect(() => {
    const camera = cameraRef.current;
    const composer = composerRef.current;
    const el = mountRef.current;
    if (!camera || !el) return;
    const elevRad = (camElev * Math.PI) / 180;
    const azimRad = (camAzimuth * Math.PI) / 180;
    const d = 80;
    camera.position.set(
      d * Math.cos(elevRad) * Math.sin(azimRad),
      d * Math.sin(elevRad),
      d * Math.cos(elevRad) * Math.cos(azimRad),
    );
    camera.lookAt(0, 0, 0);
    // Update frustum for zoom
    const asp = (el.clientWidth || window.innerWidth) / (el.clientHeight || window.innerHeight);
    camera.left   = -camZoom * asp;
    camera.right  =  camZoom * asp;
    camera.top    =  camZoom;
    camera.bottom = -camZoom;
    camera.updateProjectionMatrix();
    needsRenderRef.current = true;
  }, [camElev, camAzimuth, camZoom]);

  // Live shadow & light updates
  useEffect(() => {
    const k = keyLightRef.current;
    const renderer = rendererRef.current;
    if (k) {
      k.intensity = keyLightInt;
      k.color.set(keyLightColor);
      const elevRad    = (lightElev    * Math.PI) / 180;
      const azimuthRad = (lightAzimuth * Math.PI) / 180;
      const dist = 50;
      k.position.set(
        dist * Math.cos(elevRad) * Math.sin(azimuthRad),
        dist * Math.sin(elevRad),
        dist * Math.cos(elevRad) * Math.cos(azimuthRad),
      );
    }
    const r = rimLightRef.current;
    if (r) {
      r.intensity = keyLightInt * 0.35; // rim is proportional to key light
      const elevRad    = (Math.max(5, lightElev - 20) * Math.PI) / 180;
      const azimuthRad = ((lightAzimuth + 180) % 360 * Math.PI) / 180; // opposite side
      const dist = 50;
      r.position.set(
        dist * Math.cos(elevRad) * Math.sin(azimuthRad),
        dist * Math.sin(elevRad),
        dist * Math.cos(elevRad) * Math.cos(azimuthRad),
      );
    }
    if (k) {
      // Set shadow softness radius (PCFSoft)
      (k.shadow as any).radius = shadowRadius;
      if (rendererRef.current) applyShadowSoftness(k, rendererRef.current, sliderToFrustumHalf(shadowRadius, 15));
    }
    // Mark shadows dirty — needsUpdate will be set by the loop on next render
    shadowsDirtyRef.current = true;
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true; // light moved — shadow must re-bake
  }, [keyLightInt, shadowRadius, keyLightColor, lightElev, lightAzimuth]);

  useEffect(() => {
    const a = ambLightRef.current;
    if (a) { a.intensity = ambientInt; needsRenderRef.current = true; }
    
    // Also inject a subtle baseline emissive glow into the terrain materials 
    // so the dark sides of the blocks physically brighten up 
    if (meshGroupRef.current) {
       meshGroupRef.current.children.forEach(child => {
          if (child instanceof THREE.InstancedMesh && !child.userData.isJitterGlow) {
             const mat = child.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
             if (mat) {
                mat.emissiveIntensity = baseGlow;
                mat.needsUpdate = true;
             }
          }
       });
    }
  }, [ambientInt, baseGlow]);

  useEffect(() => {
    const s = spotLightRef.current;
    if (s) {
      s.visible = spotEnabled;
      s.intensity = spotInt;
      s.color.set(spotColor);
      s.angle = spotAngle * Math.PI / 180;
      s.penumbra = spotPenumbra;
      shadowsDirtyRef.current = true;
      needsRenderRef.current = true;
    }
  }, [spotEnabled, spotInt, spotColor, spotAngle, spotPenumbra]);

  // Shadow color + face fill via HemisphereLight (groundColor = shadow face tint, intensity = fill strength)
  useEffect(() => {
    const h = hemLightRef.current;
    if (h) {
      h.groundColor.set(shadowColor);
      h.intensity = hemIntensity;
      needsRenderRef.current = true;
    }
  }, [shadowColor, hemIntensity]);
  // Shadow map resolution — requires dispose + realloc of the shadow texture
  useEffect(() => {
    const k = keyLightRef.current;
    const renderer = rendererRef.current;
    if (!k || !renderer) return;
    k.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    if (k.shadow.map) {
      k.shadow.map.dispose();
      (k.shadow as THREE.LightShadow & { map: THREE.WebGLRenderTarget | null }).map = null;
    }
    renderer.shadowMap.needsUpdate = true; // must force-update when map is reallocated
    shadowsDirtyRef.current = true;
    needsRenderRef.current = true;
  }, [shadowMapSize]);

  // Shadow intensity (darkness) — separate from ambient, Three.js r169+ feature
  useEffect(() => {
    const k = keyLightRef.current;
    if (!k) return;
    (k.shadow as THREE.LightShadow & { intensity?: number }).intensity = shadowIntensity;
    needsRenderRef.current = true;
  }, [shadowIntensity]);

  // Shadow bias + normalBias — live sliders to fix bevel edge shadows at low elevation
  useEffect(() => {
    const k = keyLightRef.current;
    if (!k) return;
    k.shadow.bias       = shadowBias;
    k.shadow.normalBias = shadowNormalBias;
    needsRenderRef.current = true;
  }, [shadowBias, shadowNormalBias]);

  // Live roughness update — kills specular hotspot without rebuilding terrain
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      (child.material as THREE.MeshPhysicalMaterial).roughness   = matRoughness;
      (child.material as THREE.MeshPhysicalMaterial).needsUpdate  = true;
    }
    needsRenderRef.current = true;
  }, [matRoughness]);

  // Cube jitter — live rebuild on slider change (debounced 250ms, glass mode only)
  useEffect(() => {
    if (!terrainRef.current.length || renderMode !== 'glass') return;
    const id = setTimeout(() => {
      rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint,
        layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter);
    }, 250);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubeJitter]);

  // ── Auto-regenerate terrain when SHAPE params change (debounced 350ms) ─────
  // glowInt + opacity are NOT here — handled purely by the live material effect above
  useEffect(() => {
    if (!meshGroupRef.current) return;
    const id = setTimeout(() => {
      const heights = buildNoise(gridW, gridH, octaves, seed, maxElev, roughness);
      pickPresetBlocks(heights, seed);
      terrainRef.current = heights;
      setTerrain(heights);
      const emptySet = new Set<string>();
      setBrokenBlocks(emptySet);
      if (renderModeRef.current === 'glass') {
        rebuildMeshes(heights, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
      } else {
        rebuildMixedMeshes(heights, layerColors, terrainTint, enabledShapes, emptySet);
      }
      rebuildBeacons(heights, beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury);
      rebuildSheep(heights, sheepCount, sheepSize, sheepSeed);
      setStatus(`${gridW}×${gridH} — ${gridW * gridH} cells`);
      setSaved(false);
    }, 350);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridW, gridH, octaves, seed, maxElev, roughness, bevel, sheepCount, sheepSize, sheepSeed]);

  // ── Auto-update beacons when beacon params change (debounced 200ms) ───────
  useEffect(() => {
    if (!terrainRef.current.length) return;
    const id = setTimeout(() => {
      rebuildBeacons(terrainRef.current, beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury);
      rebuildSheep(terrainRef.current, sheepCount, sheepSize, sheepSeed);
    }, 200);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury, sheepCount, sheepSize, sheepSeed]);

  const LABEL: React.CSSProperties = {
    fontSize: 10, color: '#7799bb', letterSpacing: 1,
    textTransform: 'uppercase', fontFamily: 'monospace',
  };

  // ── 7 Altar colors (center + 6 outer) ──────────────────────────────────────
  const HEX_ALTAR_COLORS = [
    '#ffd700', // 0 — Center     — Gold
    '#ff4444', // 1 — North      — Crimson
    '#ff8c00', // 2 — NE         — Amber
    '#44ff88', // 3 — SE         — Lime
    '#00ffff', // 4 — South      — Cyan
    '#4488ff', // 5 — SW         — Electric Blue
    '#cc44ff', // 6 — NW         — Violet
  ];

  const HEX_ALTAR_NAMES = [
    '🟡 Core Nexus   (CENTER)',
    '🔴 Vex Gate     (NORTH)',
    '🟠 Forge Spire  (NE)',
    '🟢 Bio Relay    (SE)',
    '🩵 Cryo Beacon  (SOUTH)',
    '🔵 Arc Terminal (SW)',
    '🟣 Void Anchor  (NW)',
  ];

  // ── Generate the hex world on the Custom tab ────────────────────────────────
  const generateHexWorld = useCallback(() => {
    const scene      = sceneRef.current;
    const hexGrp     = hexWorldGrpRef.current;
    const terrainGrp = meshGroupRef.current;
    const beaconGrp2 = beaconGrpRef.current;
    if (!scene || !hexGrp) return;

    // Clear previous hex world
    while (hexGrp.children.length > 0) {
      const obj = hexGrp.children[0] as THREE.Mesh;
      hexGrp.remove(obj);
      obj.geometry?.dispose();
      (obj.material as THREE.Material)?.dispose();
    }

    // ── 1. Generate a flat 64×64 heightmap for the base terrain ──────────────
    const GW = 64, GH = 64;
    const cx = GW / 2, cz = GH / 2;
    const R  = 18; // hex ring radius in grid units

    // 7 altar positions: [center, N, NE, SE, S, SW, NW]
    // angles: top = -90° so N points up in isometric view
    const altarPos = [
      { x: cx, z: cz },                                             // 0 center
      ...Array.from({ length: 6 }, (_, i) => ({
        x: cx + R * Math.cos(((i * 60 - 90) * Math.PI) / 180),
        z: cz + R * Math.sin(((i * 60 - 90) * Math.PI) / 180),
      })),
    ];

    // Build base heightmap: base=3, beacon clearings=1, steps=2, perimeter=5
    const heights: number[][] = Array.from({ length: GH }, (_, gy) =>
      Array.from({ length: GW }, (_, gx) => {
        // Base terrain — flat, no perimeter walls
        // Nearest beacon distance
        let minBd = Infinity;
        for (const p of altarPos) {
          const d = Math.sqrt((gx - p.x) ** 2 + (gy - p.z) ** 2);
          if (d < minBd) minBd = d;
        }

        // Clearing (sunken floor)
        if (minBd < 3.5) return 1;
        // Step ring
        if (minBd < 5.5) return 2;

        // Pathway corridors between center and outer altars, + outer ring
        let minPd = Infinity;
        const distToSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
          const dx = bx - ax, dy = by - ay;
          const lenSq = dx * dx + dy * dy;
          let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
          t = Math.max(0, Math.min(1, t));
          return Math.sqrt((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2);
        };
        // Center to each outer
        for (let i = 1; i <= 6; i++) {
          const d = distToSeg(gx, gy, altarPos[0].x, altarPos[0].z, altarPos[i].x, altarPos[i].z);
          if (d < minPd) minPd = d;
        }
        // Outer ring edges (each outer to its neighbor)
        for (let i = 1; i <= 6; i++) {
          const j = i === 6 ? 1 : i + 1;
          const d = distToSeg(gx, gy, altarPos[i].x, altarPos[i].z, altarPos[j].x, altarPos[j].z);
          if (d < minPd) minPd = d;
        }
        if (minPd < 1.5) return 2; // road surface — slightly lowered
        if (minPd < 2.5) return 3; // road shoulder

        // Gentle terrain variation: two overlapping sine waves give
        // natural-feeling hills (1–4 blocks) without Perlin overhead
        const wave =
          Math.sin(gx * 0.22) * Math.cos(gy * 0.18) * 1.1 +
          Math.cos(gx * 0.11 + gy * 0.14) * 0.7;
        return Math.max(1, Math.round(2.5 + wave)); // range 1–4
      })
    );

    // Store and render the base terrain using live state values so
    // Glass / Transmission / Layer Colors sliders all work in Custom tab
    pickPresetBlocks(heights, seed);
    terrainRef.current = heights;
    setTerrain(heights);
    rebuildMeshes(
      heights, bevel, glowInt, opacity, terrainTint,
      layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter
    );
    // Make the glass group visible (custom tab always uses glass pipeline for terrain)
    if (meshGroupRef.current) meshGroupRef.current.visible = true;
    // Hide random procedural beacons — custom uses its own altar structures
    if (beaconGrp2) beaconGrp2.visible = false;
    setStatus('Custom Hex World — 64×64 · 7 Altars');
    setSaved(false);

    // ── Reset slot state on regenerate ────────────────────────────────────────
    slotMeshesRef.current.clear();
    beamMeshesRef.current.clear();
    energonPlacedRef.current.clear();
    slotsFilledRef.current = Array(7).fill(null).map(()=>Array(5).fill(false));
    setSlotsFilled(Array(7).fill(null).map(()=>Array(5).fill(false)));
    setSelectedEnergon(null);
    selectedEnergonRef.current = null;
    beamScaleRef.current = Array(7).fill(0);

    // ── 2. Build altar structures ─────────────────────────────────────────────
    const offsetX = -GW / 2;
    const offsetZ = -GH / 2;
    // Terrain at clearing has height=1 → top face at y=1.0
    const FLOOR_Y = 1.0;

    // Create a vertical gradient beam texture (white luminance — tinted by material)
    const makeBeamTexture = (hex: string) => {
      const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128;
      const c = cv.getContext('2d')!;
      const hg = c.createLinearGradient(0,0,32,0);
      hg.addColorStop(0,'transparent'); hg.addColorStop(0.35, hex+'bb');
      hg.addColorStop(0.5, hex+'ff');   hg.addColorStop(0.65, hex+'bb');
      hg.addColorStop(1,'transparent');
      c.fillStyle = hg; c.fillRect(0,0,32,128);
      const vg = c.createLinearGradient(0,0,0,128);
      c.globalCompositeOperation='multiply';
      vg.addColorStop(0,'transparent'); vg.addColorStop(0.08, hex+'ff');
      vg.addColorStop(0.6, hex+'88');   vg.addColorStop(1,'transparent');
      c.fillStyle = vg; c.fillRect(0,0,32,128);
      return new THREE.CanvasTexture(cv);
    };

    altarPos.forEach((ap, idx) => {
      const col  = new THREE.Color(HEX_ALTAR_COLORS[idx]);
      const dark = col.clone().multiplyScalar(0.18);

      const tag = (mesh: THREE.Mesh, baseEmissive: number) => {
        mesh.userData.altarIdx = idx;
        mesh.userData.baseEmissive = baseEmissive;
        hexGrp.add(mesh);
      };

      // ── Ring boundary blocks — floor-aligned ─────────────────────────────
      const RING_R = 5.0, RING_N = 10;
      for (let ri = 0; ri < RING_N; ri++) {
        const angle = (ri / RING_N) * Math.PI * 2;
        const rx = ap.x + RING_R * Math.cos(angle);
        const rz = ap.z + RING_R * Math.sin(angle);
        for (let layer = 0; layer < 2; layer++) {
          const ei = 0.06 + layer * 0.04; // dim
          const rMat = new THREE.MeshStandardMaterial({
            color: dark, emissive: col, emissiveIntensity: ei, roughness: 0.55, metalness: 0.3,
          });
          const rMesh = new THREE.Mesh(new RoundedBoxGeometry(0.88, 1.0, 0.88, 1, 0.08), rMat);
          // Bottom of block at FLOOR_Y: center = FLOOR_Y + 0.5 + layer
          rMesh.position.set(rx + offsetX, FLOOR_Y + 0.5 + layer, rz + offsetZ);
          rMesh.castShadow = true;
          tag(rMesh, ei);
        }
      }

      // ── 2×2 pillar (3 blocks tall) — floor-aligned ───────────────────────
      const pillarOffsets: [number, number][] = [[-0.5,-0.5],[0.5,-0.5],[-0.5,0.5],[0.5,0.5]];
      const PILLAR_H = 3;
      for (const [dx, dz] of pillarOffsets) {
        for (let py = 0; py < PILLAR_H; py++) {
          const ei = 0.04 + py * 0.03; // very dim
          const pMat = new THREE.MeshStandardMaterial({
            color: dark.clone().multiplyScalar(0.8), emissive: col,
            emissiveIntensity: ei, roughness: 0.4, metalness: 0.6,
          });
          const pMesh = new THREE.Mesh(new RoundedBoxGeometry(0.82, 1.0, 0.82, 1, 0.1), pMat);
          pMesh.position.set(ap.x + dx + offsetX, FLOOR_Y + 0.5 + py, ap.z + dz + offsetZ);
          pMesh.castShadow = true;
          tag(pMesh, ei);
        }
      }

      // ── Cap slab on top of pillars ────────────────────────────────────────
      const CAP_Y = FLOOR_Y + PILLAR_H; // top face of pillars = bottom of cap
      const capMat = new THREE.MeshStandardMaterial({
        color: col.clone().multiplyScalar(0.25), emissive: col, emissiveIntensity: 0.12,
        roughness: 0.22, metalness: 0.75,
      });
      const capMesh = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.35, 2.2, 1, 0.1), capMat);
      capMesh.position.set(ap.x + offsetX, CAP_Y + 0.175, ap.z + offsetZ);
      capMesh.castShadow = true;
      tag(capMesh, 0.12);

      // ── CENTER SLOT on cap top (beacon slot = slotIdx 4) ─────────────────
      const CENTER_SLOT_Y = CAP_Y + 0.35;
      const cSlotGeo = new THREE.BoxGeometry(0.95, 0.14, 0.95);
      const cSlotMat = new THREE.MeshStandardMaterial({
        color: col.clone().multiplyScalar(0.1), emissive: col, emissiveIntensity: 0.08,
        roughness: 0.2, metalness: 0.92,
      });
      const cSlotMesh = new THREE.Mesh(cSlotGeo, cSlotMat);
      cSlotMesh.position.set(ap.x + offsetX, CENTER_SLOT_Y + 0.07, ap.z + offsetZ);
      cSlotMesh.userData.isSlot  = true;
      cSlotMesh.userData.slotIdx = 4;
      cSlotMesh.userData.altarIdx = idx;
      tag(cSlotMesh, 0.08);
      slotMeshesRef.current.set(`${idx}_4`, cSlotMesh);

      // ── 4 surrounding PEDESTAL + SLOT blocks ─────────────────────────────
      const OUTER: [number, number, number][] = [
        [0, 2.4, 0], [2.4, 0, 1], [0, -2.4, 2], [-2.4, 0, 3],
      ];
      for (const [ox, oz, si] of OUTER) {
        const px = ap.x + ox + offsetX;
        const pz = ap.z + oz + offsetZ;
        // Pedestal body — sits on floor
        const pedMat = new THREE.MeshStandardMaterial({
          color: dark.clone().multiplyScalar(0.7), emissive: col, emissiveIntensity: 0.05,
          roughness: 0.5, metalness: 0.5,
        });
        const pedMesh = new THREE.Mesh(new RoundedBoxGeometry(0.88, 1.4, 0.88, 1, 0.08), pedMat);
        pedMesh.position.set(px, FLOOR_Y + 0.7, pz); // bottom at FLOOR_Y, sits on ground
        pedMesh.castShadow = true;
        tag(pedMesh, 0.05);
        // Slot plate on top of pedestal
        const PED_TOP = FLOOR_Y + 1.4;
        const slotPlateMat = new THREE.MeshStandardMaterial({
          color: col.clone().multiplyScalar(0.1), emissive: col, emissiveIntensity: 0.06,
          roughness: 0.15, metalness: 0.95,
        });
        const slotPlate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.65), slotPlateMat);
        slotPlate.position.set(px, PED_TOP + 0.05, pz);
        slotPlate.userData.isSlot   = true;
        slotPlate.userData.slotIdx  = si;
        slotPlate.userData.altarIdx = idx;
        tag(slotPlate, 0.06);
        slotMeshesRef.current.set(`${idx}_${si}`, slotPlate);
      }

      // ── Lights — dim initially (lights up when cubes placed) ─────────────
      const crownLight = new THREE.PointLight(col, 1.2, 14, 2);
      crownLight.position.set(ap.x + offsetX, CAP_Y + 4, ap.z + offsetZ);
      crownLight.userData.altarIdx  = idx;
      crownLight.userData.baseLight = 8;
      hexGrp.add(crownLight);

      const poolLight = new THREE.PointLight(col, 0.6, 8, 2);
      poolLight.position.set(ap.x + offsetX, FLOOR_Y + 1, ap.z + offsetZ);
      poolLight.userData.altarIdx  = idx;
      poolLight.userData.baseLight = 4;
      hexGrp.add(poolLight);

      // ── Beam — hidden until all 5 slots filled ────────────────────────────
      const BEAM_BASE = CAP_Y + 0.35 + 0.5;
      const beamTex = makeBeamTexture(HEX_ALTAR_COLORS[idx]);
      const beamMat = new THREE.MeshBasicMaterial({
        map: beamTex, transparent: true, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const beamMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 22), beamMat);
      beamMesh.position.set(ap.x + offsetX, BEAM_BASE + 11, ap.z + offsetZ);
      beamMesh.scale.set(1, 0, 1);
      beamMesh.visible = false;
      beamMesh.userData.altarIdx = idx;
      hexGrp.add(beamMesh);
      beamMeshesRef.current.set(idx, beamMesh);
    });

    // Make the hex group visible — the layoutTab switch effect hides it,
    // so we must re-show it explicitly after building all the structures
    if (hexGrp) hexGrp.visible = true;
    needsRenderRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, partSize, partCount, partSpeed, partChance, rebuildMeshes, setTerrain]);

  // ── Live-update per-altar glow without regenerating ───────────────────────────────
  useEffect(() => {
    const hexGrp = hexWorldGrpRef.current;
    if (!hexGrp) return;
    for (const child of hexGrp.children) {
      const aIdx = child.userData.altarIdx as number | undefined;
      if (aIdx === undefined) continue;
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat?.isMeshStandardMaterial) continue;
        const base = (child.userData.baseEmissive as number) ?? 1.0;
        const glow = altarGlow[aIdx] ?? 1.0;
        mat.emissiveIntensity = altarOcclude[aIdx] ? 0.0 : base * glow;
        mat.needsUpdate = true;
      } else if (child instanceof THREE.PointLight) {
        const base = (child.userData.baseLight as number) ?? 1.8;
        const glow = altarGlow[aIdx] ?? 1.0;
        child.intensity = altarOcclude[aIdx] ? 0.0 : base * glow;
      }
    }
    needsRenderRef.current = true;
  }, [altarGlow, altarOcclude]);

  // ── Auto-generate hex world whenever the user enters the Custom tab ────────────
  // 200ms delay lets the Three.js scene finish initialising before we build meshes
  useEffect(() => {
    if (layoutTab !== 'custom') return;
    const timer = setTimeout(() => { generateHexWorld(); }, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutTab]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 55%, #5ba4ff 0%, #2a319c 35%, #16003b 75%, #0d0024 100%)', touchAction: 'none', opacity: isGameboardExited ? 0 : 1, transition: 'opacity 0.5s ease' }}>

      {/* ── Loading Bar Overlay ── */}
      {(!isLoaded && !isExiting) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '240px', height: '2px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px', overflow: 'hidden', zIndex: 9999
        }}>
          <div style={{
            width: '100%', height: '100%', background: '#00e5ff',
            animation: 'raid-loading-slide 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }} />
          <style>{`
            @keyframes raid-loading-slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {/* ── Three.js canvas ───────────────────────────────────────── */}
      <div ref={mountRef} className="game-canvas-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <style>{`
          .game-canvas-wrapper canvas {
            transform: ${(isLoaded && !isExiting) ? 'scale(1)' : 'scale(0)'};
            opacity: ${(isLoaded && !isExiting) ? 1 : 0};
            transition: ${isExiting 
              ? 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.4s ease-out 0.4s' 
              : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease-out'};
            transform-origin: center center;
          }
        `}</style>

        {/* ── UI Elements Overlay (Fades in, fades out separately) ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
          opacity: (isLoaded && !isGameboardExited) ? 1 : 0, transition: 'opacity 0.8s ease-out', zIndex: 100
        }}>
          {/* Close Game Button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: '40px', right: '40px', zIndex: 110,
              background: 'rgba(52, 199, 89, 0.9)', border: '1px solid rgba(52, 199, 89, 1)',
              color: 'white', padding: '16px 32px', borderRadius: '9999px', cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
              backdropFilter: 'blur(8px)', transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(52, 199, 89, 0.4)',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52, 199, 89, 0.9)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Close Window
          </button>
          {/* FPS counter — updated directly via DOM ref, zero React re-renders */}
          <span ref={fpsElRef} style={{
            position: 'absolute', bottom: 40, left: 40,
            fontSize: 14, fontFamily: '"Rubik", sans-serif', letterSpacing: 1, fontWeight: 700,
            color: 'rgba(100,220,255,0.9)',
            background: 'transparent', padding: '2px 0px', borderRadius: 4,
            pointerEvents: 'none', zIndex: 10,
          }}>-- FPS</span>

          {/* Auto-Heal Toggle Button */}
          <button
            onClick={() => setIsHealingMode(prev => !prev)}
            style={{
              position: 'absolute', top: 40, left: 40, zIndex: 1000,
              background: isHealingMode ? 'rgba(52, 199, 89, 0.8)' : 'rgba(0, 0, 0, 0.5)',
              border: isHealingMode ? '1px solid rgba(52, 199, 89, 1)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff', padding: '12px 24px', borderRadius: '9999px',
              fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600, fontSize: 16, cursor: 'pointer',
              transition: 'all 0.2s', backdropFilter: 'blur(8px)',
              boxShadow: isHealingMode ? '0 4px 16px rgba(52, 199, 89, 0.3)' : 'none',
              pointerEvents: 'auto'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
          >
            {isHealingMode ? 'Auto-Heal: ON' : 'Auto-Heal: OFF'}
          </button>



        <div 
          ref={waveUIRef}
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 40, 
            transform: 'translateY(-50%)',
            background: 'rgba(18, 18, 22, 0.65)',
            backdropFilter: 'blur(24px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '24px',
            color: '#fff', 
            fontFamily: 'system-ui, -apple-system, sans-serif', 
            zIndex: 1000, 
            pointerEvents: 'none',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease'
          }}
        >
        </div>

        {/* ── Wave Announcer ── */}
        <div 
          ref={announcerElRef}
          style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) scale(0.8)',
            fontSize: '10vw', fontWeight: 800, color: '#fff', 
            fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-4px',
            textShadow: '0 20px 60px rgba(0,0,0,0.8)',
            opacity: 0, transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none', zIndex: 3000,
          }}
        />

        {/* ── Weapons UI (Apple Style Pill Bar + Drawer) ────────────────────────────── */}
        {isRaidMode && (
          <div style={{
            position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
            pointerEvents: 'none' // Prevent the invisible flex container from blocking scene clicks!
          }}>
            {/* Weapon Settings Drawer */}
            <div style={{
              width: 380,
              background: 'rgba(18, 18, 22, 0.85)',
              backdropFilter: 'blur(40px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 24, padding: '24px 24px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              color: '#ffffff',
              transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              opacity: settingsWeapon ? 1 : 0,
              transform: settingsWeapon ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              pointerEvents: settingsWeapon ? 'auto' : 'none',
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, textTransform: 'capitalize' }}>
                  {settingsWeapon} Settings
                </div>
                <div onClick={() => setSettingsWeapon(null)} style={{ cursor: 'pointer', opacity: 0.5 }}>✕</div>
              </div>

              {settingsWeapon === 'scatter' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Blast Radius" min={1} max={10} step={1} value={scatterRadius} onChange={setScatterRadius} accent="#ff3b30" />
                  <CfgSlider label="Projectile Count" min={1} max={30} step={1} value={scatterCount} onChange={setScatterCount} accent="#ff3b30" />
                  <CfgSlider label="Scatter Depth" min={1} max={8} step={1} value={scatterDepth} onChange={setScatterDepth} accent="#ff3b30" />
                  <CfgSlider label="Delay (ms)" min={0} max={1000} step={50} value={scatterDelay} onChange={setScatterDelay} accent="#ff3b30" />
                </div>
              )}

              {settingsWeapon === 'artillery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Impact Radius" min={2} max={12} step={1} value={artilleryRadius} onChange={setArtilleryRadius} accent="#ff9500" />
                  <CfgSlider label="Crater Depth" min={1} max={10} step={1} value={artilleryDepth} onChange={setArtilleryDepth} accent="#ff9500" />
                  <CfgSlider label="Launch Delay (ms)" min={0} max={2000} step={50} value={artilleryDelay} onChange={setArtilleryDelay} accent="#ff9500" />
                </div>
              )}

              {settingsWeapon === 'flyover' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Bomb Radius" min={1} max={8} step={1} value={flyoverRadius} onChange={setFlyoverRadius} accent="#007aff" />
                  <CfgSlider label="Bomb Depth" min={1} max={8} step={1} value={flyoverDepth} onChange={setFlyoverDepth} accent="#007aff" />
                  <CfgSlider label="Run Length" min={2} max={20} step={1} value={flyoverLength} onChange={setFlyoverLength} accent="#007aff" />
                  <CfgSlider label="Spacing" min={1} max={5} step={0.5} value={flyoverSpacing} onChange={setFlyoverSpacing} accent="#007aff" />
                </div>
              )}

              {settingsWeapon === 'laser' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Beam Radius" min={1} max={10} step={1} value={laserRadius} onChange={setLaserRadius} accent="#ff2d55" />
                  <CfgSlider label="Penetration Depth" min={1} max={20} step={1} value={laserDepth} onChange={setLaserDepth} accent="#ff2d55" />
                  <CfgSlider label="Burn Duration (ms)" min={500} max={5000} step={100} value={laserDuration} onChange={setLaserDuration} accent="#ff2d55" />
                  <CfgSlider label="Activation Delay" min={0} max={2000} step={50} value={laserDelay} onChange={setLaserDelay} accent="#ff2d55" />
                </div>
              )}

              {settingsWeapon === 'seismic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Shockwave Radius" min={2} max={16} step={1} value={seismicRadius} onChange={setSeismicRadius} accent="#ffcc00" />
                  <CfgSlider label="Fissure Depth" min={1} max={10} step={1} value={seismicDepth} onChange={setSeismicDepth} accent="#ffcc00" />
                  <CfgSlider label="Wave Speed" min={10} max={100} step={5} value={seismicSpeed} onChange={setSeismicSpeed} accent="#ffcc00" />
                  <CfgSlider label="Aftershocks" min={1} max={10} step={1} value={seismicCount} onChange={setSeismicCount} accent="#ffcc00" />
                </div>
              )}

              {settingsWeapon === 'carpet' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Bomb Radius" min={1} max={8} step={1} value={carpetRadius} onChange={setCarpetRadius} accent="#5856d6" />
                  <CfgSlider label="Crater Depth" min={1} max={10} step={1} value={carpetDepth} onChange={setCarpetDepth} accent="#5856d6" />
                  <CfgSlider label="Grid Rows" min={1} max={10} step={1} value={carpetRows} onChange={setCarpetRows} accent="#5856d6" />
                  <CfgSlider label="Grid Cols" min={1} max={10} step={1} value={carpetCols} onChange={setCarpetCols} accent="#5856d6" />
                  <CfgSlider label="Drop Delay (ms)" min={50} max={1000} step={10} value={carpetDelay} onChange={setCarpetDelay} accent="#5856d6" />
                </div>
              )}

              {settingsWeapon === 'blackhole' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CfgSlider label="Event Horizon Radius" min={2} max={20} step={1} value={blackholeRadius} onChange={setBlackholeRadius} accent="#af52de" />
                  <CfgSlider label="Singularity Depth" min={5} max={30} step={1} value={blackholeDepth} onChange={setBlackholeDepth} accent="#af52de" />
                  <CfgSlider label="Collapse Duration" min={1000} max={10000} step={500} value={blackholeDuration} onChange={setBlackholeDuration} accent="#af52de" />
                  <CfgSlider label="Spawn Delay (ms)" min={0} max={3000} step={100} value={blackholeDelay} onChange={setBlackholeDelay} accent="#af52de" />
                </div>
              )}
            </div>

            {/* Helper Text */}
            <div style={{
              fontFamily: '"Rubik", sans-serif',
              fontSize: 22,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              marginBottom: 14,
              pointerEvents: 'none',
              transition: 'opacity 0.3s',
              opacity: settingsWeapon ? 0 : 1 // Hide when drawer is open so it doesn't clutter
            }}>
              Right mouse on weapon to change preferences
            </div>

            {/* Dock */}
            <div style={{
              display: 'flex', gap: 6, padding: '8px',
              background: 'rgba(18, 18, 22, 0.85)',
              backdropFilter: 'blur(40px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              pointerEvents: 'auto' // Re-enable clicks for the dock
            }}>
              <WeaponButton weaponId="scatter" active={selectedWeapon === 'scatter'} onClick={() => setSelectedWeapon(selectedWeapon === 'scatter' ? null : 'scatter')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'scatter' ? null : 'scatter')} icon={<IconScatter />} label="SCATTER" />
              <WeaponButton weaponId="artillery" active={selectedWeapon === 'artillery'} onClick={() => setSelectedWeapon(selectedWeapon === 'artillery' ? null : 'artillery')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'artillery' ? null : 'artillery')} icon={<IconArtillery />} label="ARTILLERY" />
              <WeaponButton weaponId="flyover" active={selectedWeapon === 'flyover'} onClick={() => setSelectedWeapon(selectedWeapon === 'flyover' ? null : 'flyover')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'flyover' ? null : 'flyover')} icon={<IconFlyover />} label="FLYOVER" />
              <WeaponButton weaponId="laser" active={selectedWeapon === 'laser'} onClick={() => setSelectedWeapon(selectedWeapon === 'laser' ? null : 'laser')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'laser' ? null : 'laser')} icon={<IconLaser />} label="LASER" />
              <WeaponButton weaponId="seismic" active={selectedWeapon === 'seismic'} onClick={() => setSelectedWeapon(selectedWeapon === 'seismic' ? null : 'seismic')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'seismic' ? null : 'seismic')} icon={<IconSeismic />} label="SEISMIC" />
              <WeaponButton weaponId="carpet" active={selectedWeapon === 'carpet'} onClick={() => setSelectedWeapon(selectedWeapon === 'carpet' ? null : 'carpet')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'carpet' ? null : 'carpet')} icon={<IconCarpet />} label="CARPET" />
              <WeaponButton weaponId="blackhole" active={selectedWeapon === 'blackhole'} onClick={() => setSelectedWeapon(selectedWeapon === 'blackhole' ? null : 'blackhole')} onSecondaryClick={() => setSettingsWeapon(settingsWeapon === 'blackhole' ? null : 'blackhole')} icon={<IconBlackhole />} label="BLACKHOLE" />
            </div>
          </div>
        )}

        {/* ── Shape Library Panel — Hidden for Raid Mode ──────────────────────── */}

      {/* ── HUD ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 120, right: 40,
        fontSize: 12, color: 'rgba(255,255,255,0.6)',
        pointerEvents: 'none', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.6,
        textAlign: 'right', zIndex: 100
      }}>
        <div>🖱 Drag to pan · Scroll to zoom</div>
        <div style={{ color: saved ? '#4af' : '#9ca3af' }}>{status}</div>
      </div>

        </div> {/* End of UI Fading Wrapper */}
    </div> {/* End of Viewport (Left/Main) */}

    {/* ── Inspector Panel (Restored Full Apple Preferences) ── */}
      <style>{`
        .apple-pref-panel {
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
        }
        .apple-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .apple-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-transform: capitalize;
        }
      `}</style>
      <div className="apple-pref-panel" style={{
        position: 'absolute',
        bottom: 40,
        right: 40,
        zIndex: 2000,
        width: isSidebarMin ? 160 : 320,
        height: isSidebarMin ? 44 : 'calc(100vh - 160px)',
        borderRadius: isSidebarMin ? 22 : 24,
        background: 'rgba(18, 18, 22, 0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: isSidebarMin ? 0 : '24px 20px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', backdropFilter: 'blur(40px) saturate(150%)', flexShrink: 0,
        transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
        color: '#ffffff',
        pointerEvents: 'auto',
      }}>
        {!isSidebarMin ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: -0.5 }}>
              Preferences
            </div>
            <div 
               onClick={() => setIsSidebarMin(true)} 
               style={{ cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
               title="Close Preferences"
               onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
               onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            >
               ✕
            </div>
          </div>
        ) : (
          <div 
             onClick={() => setIsSidebarMin(false)} 
             style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
             title="Open Preferences"
          >
             ⚙️ Preferences
          </div>
        )}

        {!isSidebarMin && (<>

        {/* Mode Selection Removed as per request */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 4, paddingBottom: 60 }}>
          
          {layoutTab === 'custom' && (<>
            {/* ── HEX ALTAR WORLD ── */}
            <div className="apple-card">
              <div className="apple-card-title">HEX ALTAR WORLD</div>
              <div style={{ fontSize: 11, color: '#99aabb', marginBottom: 12, lineHeight: 1.5 }}>
                7 Altars · 5 slots each · Place energon cubes.<br/>
                All 5 slots → altar activates beam ↑
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateHexWorld} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  background: 'rgba(255,215,0,0.15)', color: '#ffd700',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>Generate</button>
                <button onClick={saveToGame} disabled={!terrain.length} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  background: saved ? 'rgba(64,170,255,0.2)' : 'rgba(255,255,255,0.1)',
                  color: saved ? '#aef' : '#fff',
                  fontWeight: 600, fontSize: 12, cursor: terrain.length ? 'pointer' : 'not-allowed',
                }}>{saved ? 'Saved' : 'Save'}</button>
              </div>
            </div>

            {/* ── ENERGON CUBES ── */}
            <div className="apple-card">
              <div className="apple-card-title">ENERGON CUBES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {HEX_ALTAR_COLORS.map((color, i) => {
                  const filled = slotsFilled[i].filter(Boolean).length;
                  const complete = filled === 5;
                  const isSelected = selectedEnergon === i;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const next = isSelected ? null : i;
                        setSelectedEnergon(next);
                        selectedEnergonRef.current = next;
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                        border: isSelected ? `1.5px solid ${color}` : `1px solid ${color}33`,
                        background: isSelected ? `${color}22` : `${color}0a`,
                        color: complete ? color : isSelected ? color : '#7799bb',
                        boxShadow: isSelected ? `0 0 10px ${color}55` : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                        background: color,
                        boxShadow: isSelected ? `0 0 8px ${color}` : 'none',
                        opacity: complete ? 1 : isSelected ? 1 : 0.55,
                      }} />
                      <div style={{ flex: 1, textAlign: 'left', fontSize: 10, fontWeight: 600 }}>
                        {HEX_ALTAR_NAMES[i].split('(')[0].trim()}
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {Array(5).fill(0).map((_, si) => (
                          <div key={si} style={{
                            width: 6, height: 6, borderRadius: 1,
                            background: slotsFilled[i][si] ? color : 'rgba(0,0,0,0.5)',
                          }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── ALTAR GLOW CALIBRATION ── */}
            <div className="apple-card">
              <div className="apple-card-title">ALTAR GLOW CALIBRATION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {HEX_ALTAR_NAMES.map((name, i) => {
                  const occluded = altarOcclude[i];
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: 6,
                      padding: '8px', borderRadius: 6,
                      background: 'rgba(0,0,0,0.2)',
                      border: `1px solid ${HEX_ALTAR_COLORS[i]}33`,
                      opacity: occluded ? 0.4 : 1, transition: 'opacity 0.2s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#d1d5db', fontWeight: 600 }}>{name.split('(')[0]}</span>
                        <button
                          onClick={() => setAltarOcclude(prev => { const n=[...prev]; n[i]=!n[i]; return n; })}
                          style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: occluded ? '#333' : `${HEX_ALTAR_COLORS[i]}44`, color: '#fff', fontSize: 9, cursor: 'pointer' }}
                        >{occluded ? 'Disabled' : 'Active'}</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: '#9ca3af', width: 30 }}>GLOW</span>
                        <input type="range" min={0} max={4} step={0.05} value={altarGlow[i]}
                          onChange={e => setAltarGlow(prev => { const n=[...prev]; n[i]=Number(e.target.value); return n; })}
                          style={{ flex: 1, accentColor: HEX_ALTAR_COLORS[i] }} disabled={occluded} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>)}

          {(layoutTab === 'procedural' || layoutTab === 'large_map') && (<>
            {/* RENDER ENGINE text removed as per request */}

            {/* ── GRID GENERATION ── */}
            <div className="apple-card">
              <div className="apple-card-title">Grid Generation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Width"   min={8} max={64} step={4} value={gridW}     onChange={setGridW}     />
                <CfgSlider label="Height"  min={8} max={64} step={4} value={gridH}     onChange={setGridH}     />
                <CfgSlider label="Octaves" min={1} max={6}  step={1} value={octaves}   onChange={setOctaves}   />
                <CfgSlider label="Seed"    min={1} max={999} step={1} value={seed}     onChange={setSeed}      />
              </div>
            </div>

            {/* ── ELEVATION ── */}
            <div className="apple-card">
              <div className="apple-card-title">Elevation & Repair</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Max Height" min={2} max={8}   step={1}   value={maxElev}    onChange={setMaxElev}    />
                <CfgSlider label="Roughness"  min={0.3} max={4} step={0.1} value={roughness}  onChange={setRoughness}  accent="#f97316" />
                <CfgSlider label="Heal Speed" min={10} max={1000} step={10} value={regenSpeed} onChange={setRegenSpeed} accent="#10b981" />
              </div>
            </div>

            {/* ── GLASS PROPERTIES ── */}
            <div className="apple-card">
              <div className="apple-card-title">Glass Properties</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Bevel"       min={0.01} max={0.35} step={0.01} value={bevel}       onChange={setBevel}       />
                <CfgSlider label="Roughness"   min={0}    max={1.0}  step={0.01} value={matRoughness} onChange={setMatRoughness} accent="#7df" />
                <CfgSlider label="Opacity"     min={0.4}  max={1.0}  step={0.01} value={opacity}     onChange={setOpacity}     />
                <CfgSlider label="Cube Jitter" min={0}    max={1.0}  step={0.01} value={cubeJitter}  onChange={setCubeJitter}  accent="#7df" />
                <CfgSlider label="Jitter Glow" min={0}    max={2}    step={0.05} value={glowInt}     onChange={setGlowInt}     />
                <CfgSlider label="Base Glow"   min={0}    max={2}    step={0.01} value={baseGlow}    onChange={setBaseGlow}    />
                <CfgSlider label="Glow Fade"   min={0.01} max={0.5}  step={0.01} value={hoverFade}   onChange={setHoverFade} />
              </div>
            </div>

            {/* ── TRANSMISSION ── */}
            {renderMode === 'glass' && (
              <div className="apple-card">
                <div className="apple-card-title">Transmission</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Transmit"  min={0} max={1}   step={0.01} value={matTransmit}  onChange={setMatTransmit}  accent="#06b6d4" />
                  <CfgSlider label="Thickness" min={0} max={5}   step={0.05} value={matThickness} onChange={setMatThickness} accent="#06b6d4" />
                  <CfgSlider label="IOR"       min={1} max={2.5} step={0.01} value={matIor}       onChange={setMatIor}       accent="#06b6d4" />
                </div>
              </div>
            )}

            {/* ── ENVIRONMENT LIGHTING ── */}
            <div className="apple-card">
              <div className="apple-card-title">Environment Lighting</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {([
                  { label: 'Morning',   keyInt: 4.5, ambInt: 0.6, elev: 35, azim: 40, col: '#ffedd5', bg: '#081424', hemInt: 0.6 },
                  { label: 'Noon',      keyInt: 6.5, ambInt: 0.4, elev: 85, azim: 0,  col: '#ffffff', bg: '#020814', hemInt: 0.4 },
                  { label: 'Sunset',    keyInt: 5.0, ambInt: 0.3, elev: 15, azim: 270,col: '#ff904f', bg: '#230b1c', hemInt: 0.5 },
                  { label: 'Midnight',  keyInt: 1.5, ambInt: 0.1, elev: 45, azim: 120,col: '#a4b5f0', bg: '#01030a', hemInt: 0.2 },
                ]).map(p => {
                  const isActive = Math.abs(keyLightInt - p.keyInt) < 0.5 && Math.abs(lightElev - p.elev) < 2;
                  return (
                    <button key={p.label} onClick={() => { setKeyLightInt(p.keyInt); setAmbientInt(p.ambInt); setLightElev(p.elev); setLightAzimuth(p.azim); setKeyLightColor(p.col); setShadowColor(p.bg); setHemIntensity(p.hemInt); }} style={{
                      flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}>{p.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Key Light"  min={0}   max={20}  step={0.1}  value={keyLightInt}  onChange={setKeyLightInt}  accent="#facc15" />
                <CfgSlider label="Ambient"    min={0}   max={1.5} step={0.05} value={ambientInt}   onChange={setAmbientInt}   accent="#facc15" />
                <CfgSlider label="Elevation"  min={5}   max={85}  step={1}    value={lightElev}    onChange={setLightElev}    accent="#facc15" />
                <CfgSlider label="Azimuth"    min={0}   max={360} step={1}    value={lightAzimuth} onChange={setLightAzimuth} accent="#facc15" />
              </div>
              
              <div className="apple-card-title" style={{ marginTop: 24 }}>Key Color</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#ffffff','#a8d8ff','#ffd6aa','#ffeaaa','#c8aaff','#aaffd6'].map(c => (
                  <div key={c} onClick={() => setKeyLightColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: keyLightColor === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: keyLightColor === c ? `0 0 8px ${c}` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            {/* ── SPOTLIGHT ── */}
            <div className="apple-card">
              <div className="apple-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Spotlight</span>
                <input type="checkbox" checked={spotEnabled} onChange={e => setSpotEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
              </div>
              {spotEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <CfgSlider label="Intensity"  min={0}   max={50}   step={0.5}  value={spotInt}       onChange={setSpotInt}       accent="#facc15" />
                  <CfgSlider label="Cone Angle" min={1}   max={90}   step={1}    value={spotAngle}     onChange={setSpotAngle}     accent="#facc15" />
                  <CfgSlider label="Falloff"    min={0}   max={1}    step={0.01} value={spotPenumbra}  onChange={setSpotPenumbra}  accent="#facc15" />
                </div>
              )}
            </div>

            {/* ── SHADOWS ── */}
            <div className="apple-card">
              <div className="apple-card-title">Shadows</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Cast Opacity" min={0}      max={1}     step={0.01}    value={shadowIntensity}   onChange={setShadowIntensity}   accent="#94a3b8" />
                <CfgSlider label="Softness"     min={1}      max={16}    step={1}       value={shadowRadius}      onChange={setShadowRadius}      accent="#94a3b8" />
                <CfgSlider label="Bias"         min={-0.01}  max={0.002} step={0.0001}  value={shadowBias}        onChange={setShadowBias}        accent="#94a3b8" />
                <CfgSlider label="Normal Bias"  min={0}      max={0.5}   step={0.005}   value={shadowNormalBias}  onChange={setShadowNormalBias}  accent="#94a3b8" />
                <CfgSlider label="Fill Strength" min={0} max={1.5} step={0.02} value={hemIntensity} onChange={setHemIntensity} accent="#94a3b8" />
              </div>
              <div className="apple-card-title" style={{ marginTop: 24 }}>Fill Color</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#0a0e2a','#001a0a','#1a0010','#100a00','#000d1a','#1a1a00'].map(c => (
                  <div key={c} onClick={() => setShadowColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: shadowColor === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: shadowColor === c ? `0 0 8px ${c}88` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Map Res</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[256, 512, 1024, 2048].map(sz => (
                    <button key={sz} onClick={() => setShadowMapSize(sz)} style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 600, border: 'none',
                      background: shadowMapSize === sz ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: shadowMapSize === sz ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>{sz >= 1024 ? `${sz / 1024}k` : `${sz}`}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CAMERA ── */}
            <div className="apple-card">
              <div className="apple-card-title">Camera</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {([
                  { label: 'Iso',  elev: 35.26, azim: 45  },
                  { label: 'Dim',   elev: 30,    azim: 30  },
                  { label: 'Top',   elev: 89,    azim: 45  },
                  { label: 'Side',       elev: 25,    azim: 90  },
                  { label: 'Cinematic',  elev: 22,    azim: 20  },
                ] as { label: string; elev: number; azim: number }[]).map(p => {
                  const isActive = Math.abs(camElev - p.elev) < 0.5 && Math.abs(camAzimuth - p.azim) < 0.5;
                  return (
                    <button key={p.label} onClick={() => { setCamElev(p.elev); setCamAzimuth(p.azim); }} style={{
                      flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}>{p.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Elevation"  min={5}   max={89}  step={0.5}  value={camElev}    onChange={setCamElev}    accent="#67e8f9" />
                <CfgSlider label="Azimuth"    min={0}   max={360} step={1}    value={camAzimuth} onChange={setCamAzimuth} accent="#67e8f9" />
                <CfgSlider label="Zoom"       min={8}   max={80}  step={1}    value={camZoom}    onChange={setCamZoom}    accent="#67e8f9" />
              </div>
            </div>

            {/* ── POST-PROCESSING ── */}
            <div className="apple-card">
              <div className="apple-card-title">Post-Processing</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Bloom Str"    min={0} max={2}   step={0.05} value={bloomStr}    onChange={setBloomStr}    accent="#c084fc" />
                <CfgSlider label="Bloom Thresh" min={0} max={5}   step={0.01} value={bloomThresh} onChange={setBloomThresh} accent="#c084fc" />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <CfgSlider label="Edge Blur"   min={0}     max={5}    step={0.05}  value={tiltBlur}     onChange={setTiltBlur}     accent="#8af" />
                <CfgSlider label="Resolution"  min={0.005} max={0.12} step={0.001} value={tiltSpread}   onChange={setTiltSpread}   accent="#8af" />
                <CfgSlider label="Vignette"    min={0}     max={1}    step={0.01}  value={tiltVignette} onChange={setTiltVignette} accent="#8af" />
              </div>
              <div className="apple-card-title" style={{ marginTop: 24 }}>Vignette Color</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#000000','#1a0000','#001a00','#00001a','#1a1a00','#1a001a'].map(c => (
                  <div key={c} onClick={() => setVigColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: vigColor === c ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: vigColor === c ? `0 0 8px ${c}` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            {/* ── SHEEP PHYSICS ── */}
            <div className="apple-card">
              <div className="apple-card-title">SHEEP PHYSICS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Live Engine</span>
                <input type="checkbox" checked={sheepAnimate} onChange={e => { setSheepAnimate(e.target.checked); needsRenderRef.current = true; }} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Count" min={0} max={200} step={1} value={sheepCount} onChange={setSheepCount} accent="#ffccaa" />
                <CfgSlider label="Size"  min={0.1} max={4.0} step={0.05} value={sheepSize} onChange={setSheepSize} accent="#ffccaa" />
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, color: '#a855f7', cursor: 'pointer', fontWeight: 600 }}>Advanced Physics</summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    <CfgSlider label="Walk Speed" min={0.5} max={10} step={0.1} value={sheepSpeed} onChange={setSheepSpeed} accent="#00e5ff" />
                    <CfgSlider label="Bounce Freq" min={1} max={30} step={0.5} value={sheepBounceSpeed} onChange={setSheepBounceSpeed} accent="#00e5ff" />
                    <CfgSlider label="Bounce Height" min={0} max={1} step={0.05} value={sheepBounciness} onChange={setSheepBounciness} accent="#00e5ff" />
                    <CfgSlider label="Gravity (Fall)" min={10} max={100} step={1} value={sheepGravity} onChange={setSheepGravity} accent="#eab308" />
                    <CfgSlider label="Explosion Force" min={5} max={60} step={1} value={sheepExplodeForce} onChange={setSheepExplodeForce} accent="#eab308" />
                    <CfgSlider label="Explosion Radius" min={2} max={30} step={1} value={sheepExplodeRadius} onChange={setSheepExplodeRadius} accent="#eab308" />
                  </div>
                </details>
              </div>
            </div>

            {/* ── BEACONS ── */}
            <div className="apple-card">
              <div className="apple-card-title">BEACONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Count"    min={0}   max={40}  step={1}    value={beaconCount}    onChange={setBeaconCount}    accent="#ff6b35" />
                <CfgSlider label="Bury Depth" min={0} max={6}   step={1}    value={beaconBury}     onChange={setBeaconBury}     accent="#ff6b35" />
                <CfgSlider label="Emissive" min={0.5} max={8}   step={0.25} value={beaconEmissive} onChange={setBeaconEmissive} accent="#ff6b35" />
                <CfgSlider label="Light"    min={0}   max={4}   step={0.1}  value={beaconLight}    onChange={setBeaconLight}    accent="#ff6b35" />
              </div>
            </div>

            {/* ── LAYER COLORS ── */}
            <div className="apple-card">
              <div className="apple-card-title">LAYER COLORS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {layerColors.map((col, i) => {
                  const labels = ['Valley','Lowland','Mid','Highland','Peak'];
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{labels[i]}</span>
                      <input type="color" value={col} onChange={e => {
                        const updated = [...layerColors];
                        updated[i] = e.target.value;
                        setLayerColors(updated);
                      }} style={{ width: 32, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent', padding: 0 }} />
                    </div>
                  );
                })}
              </div>
              
              <div className="apple-card-title" style={{ marginTop: 16 }}>TERRAIN BASE TINT</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {['#1e7a8c','#0d4a6a','#2d6a4f','#7b2d8b','#8c4a1e','#1a4a8c','#6c757d'].map(c => (
                  <div key={c} onClick={() => setTerrainTint(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: terrainTint === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: terrainTint === c ? `0 0 8px ${c}` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            {/* ACTIONS block removed as per request */}
          </>)}
        </div>
        </>)}
      </div>
      {/* ── Victory Screen ── */}
      {victoryStats && (
        <AnimatedVictoryScreen 
          stats={victoryStats} 
          onRestart={() => {
            setVictoryStats(null);
            waveNumberRef.current = 1;
            shotsFiredRef.current = 0;
            sheepScoreRef.current = 0;
            totalKillsRef.current = 0;
            gameStartTimeRef.current = Date.now();
            isTransitioningWaveRef.current = false;
            isGameOverRef.current = false;
          }} 
        />
      )}    {/* ── Mouse Cooldown Overlay ── */}
    <div
      id="mouse-cooldown-overlay"
      style={{
        position: 'fixed', top: 0, left: 0, width: 48, height: 48,
        pointerEvents: 'none', zIndex: 99999,
        transform: 'translate(-100px, -100px)',
        transition: 'opacity 0.1s',
        opacity: 0
      }}
    >
      <svg width="48" height="48">
        {/* Background track */}
        <circle cx="24" cy="24" r="14" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
        {/* Progress track */}
        <circle 
          id="mouse-cooldown-circle" 
          cx="24" cy="24" r="14" fill="none" stroke="#ffcc00" strokeWidth="3" 
          strokeDasharray="88" strokeDashoffset="0"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
    </div>
    </div>
  );
}
