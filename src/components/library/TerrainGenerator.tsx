'use client';
/**
 * TerrainGenerator — Procedural isometric terrain using frosted-glass blocks.
 *
 * - Generates a grid of 1–3 block-tall terrain cells using seeded noise
 * - Same frosted glass + UnrealBloom aesthetic as 3D Studio
 * - "Bake" exports a PNG snapshot
 * - Terrain heightmap is saved to localStorage so 3D Studio can offset buildings
 */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

function SmoothHeight({ children }: { children: React.ReactNode }) {
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const obs = new ResizeObserver((entries) => {
      setHeight(entries[0].borderBoxSize[0].blockSize);
    });
    obs.observe(contentRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ height, transition: 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'hidden' }}>
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}

import * as THREE from 'three';
import { CylinderGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GameStateControls } from './GameStateControls';

import { BehindTheScenes } from './BehindTheScenes';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { sliderToFrustumHalf, applyShadowSoftness } from './PCSSHelper';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { FlockEngine } from '@/lib/FlockEngine';
import { lcg, buildNoise } from '@/lib/TerrainMath';
import { getWaveParams, Difficulty, WeaponType, WEAPONS_IN_ORDER } from '../../data/progression';
import { IParticleSystem } from '../../lib/particles/IParticleSystem';
import { MultiMeshParticleSystem } from '../../lib/particles/MultiMeshParticleSystem';
import { GlobalInstancedParticleSystem } from '../../lib/particles/GlobalInstancedParticleSystem';
import { GPUParticleSystem } from '../../lib/particles/GPUParticleSystem';
import { useWeaponSystem, WEAPON_COOLDOWNS } from './weapons/useWeaponSystem';
import { WeaponEngine } from './weapons/WeaponEngine';
import { useAnalytics } from '@/hooks/useAnalytics';

export type RenderEngine = 'multimesh' | 'global' | 'gpu';

// ── Radial DOF shader — isometric-friendly: blurs edges radially from center ──
// 8 circular samples + quadratic falloff so grid edges blur while terrain centre
// stays sharp. vignette uniform darkens edges independently of blur.
// ── TiltShift shader — blurs TOP & BOTTOM edges, keeps horizontal center band sharp ──
// dy = 0 at screen center, 1 at top/bottom edge.
// Blur accumulates quadratically so the centre stays crisp.
// Vignette darkens/tints the same top/bottom gradient for a consistent cinematic look.
const RadialDOFShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    blur: { value: 1.5 },   // 0=off, higher=more blur at edges
    spread: { value: 0.035 }, // bokeh sample radius per unit of blur
    vignette: { value: 0.4 },   // how strongly top/bottom are darkened/tinted
    vigColor: { value: new THREE.Color(0, 0, 0) }, // vignette tint colour
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
const DEFAULT_LAYER_COLORS = ['#0a1a3a', '#0d4a6a', '#1e7a8c', '#2dd4bf', '#9ef5f5'];

// ── Shape Library — all available geometry archetypes for Mixed Geo mode ──────
interface ShapeDef {
  id: string;
  label: string;
  icon: string;
  desc: string;
  makeGeo: () => THREE.BufferGeometry;
  roughness: number;
  metalness: number;
  yOff: (gz: number) => number;
  rotY?: (gx: number, gy: number) => number;
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
const DEFAULT_ENABLED_SHAPES = new Set(['box', 'slab', 'pillar', 'cylinder', 'ring']);

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
function CfgSlider({ label, min, max, step, value, baseline, onChange, accent = '#0A84FF' }: {
  label: string; min: number; max: number; step: number; value: number; baseline?: number;
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: 20 }}>
        {baseline !== undefined && (
          <div style={{
            position: 'absolute',
            left: `calc(${((baseline - min) / (max - min)) * 100}% + ${9 - (((baseline - min) / (max - min)) * 100) / 100 * 20}px)`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: '1.5px solid rgba(255, 255, 255, 0.8)',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 0 6px rgba(0, 0, 0, 0.6)'
          }} />
        )}
        <input type="range" className="apple-slider" min={min} max={max} step={step} value={value}
          onChange={e => {
            let v = Number(e.target.value);
            if (baseline !== undefined) {
              const range = max - min;
              const snapDist = range * 0.04; // 4% snap
              if (Math.abs(v - baseline) <= snapDist) {
                v = baseline;
              }
            }
            onChange(v);
          }}
          style={{ '--slider-accent': accent, position: 'relative', zIndex: 2, width: '100%' } as React.CSSProperties} />
      </div>
    </div>
  );
}

const IconScatter = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="m4.9 4.9 2.1 2.1" /><path d="m17 17 2.1 2.1" /><path d="m4.9 19.1 2.1-2.1" /><path d="m17 7 2.1-2.1" /></svg>;
const IconArtillery = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
const IconFlyover = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.3 2.6c-.2.4-.1 1 .3 1.3L9 14l-4.5 4.5-2.7-.9c-.4-.1-.8.1-1 .5l-.6 1.2c-.2.4 0 .9.4 1.1l4.9 2.5c.3.1.6.1.9 0l2.5-4.9c.2-.4.1-.9-.2-1.1l-1.2-.6c-.4-.2-.6-.6-.5-1l.9-2.7L14 9l3.2 6.3c.3.4.9.5 1.3.3l2.6-1.3c.5-.2.8-.6.7-1.1z" /></svg>;
const IconLaser = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M8 22h8" /><path d="M8 2h8" /></svg>;
const IconQuake = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14l4-8 4 12 4-12 4 8" /><path d="M2 20h20" /><path d="M2 4h20" /></svg>;
const IconCarpet = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10a7 7 0 1 0 14 0A7 7 0 0 0 5 10z" /><path d="M12 3v3" /><path d="M14 2.5a2 2 0 0 0-4 0" /></svg>;
const IconBlackhole = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20" /><path d="M2 12a14.5 14.5 0 0 0 20 0" /></svg>;

function WeaponButton({ active, onClick, onSecondaryClick, icon, label, weaponId }: { active: boolean, onClick: () => void, onSecondaryClick: () => void, icon: React.ReactNode, label: string, weaponId: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 0) {
      setIsPressed(true);
      didLongPress.current = false;
      pressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        onSecondaryClick();
        setIsPressed(false);
      }, 300);
    }
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    clearTimer();
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    clearTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    clearTimer();
    if (!didLongPress.current) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
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
      <span style={{ fontSize: 24, position: 'relative', zIndex: 2, transform: active ? 'scale(1.1) translateY(-2px)' : isHovered ? 'translateY(-2px)' : 'none', transition: 'transform 0.2s' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, position: 'relative', zIndex: 2, letterSpacing: 0.5, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>{label}</span>
    </button>
  );
}



// ── Default presets for each map slot ───────────────────────────────────────
const DEFAULT_CITY_PRESET = {
  gridW: 32, gridH: 32, octaves: 1, seed: 905, maxElev: 5, roughness: 1.54,
  bevel: 0.03, bloomStr: 0.5, bloomThresh: 0.9, glowInt: 0.55, opacity: 1, shellEmissive: 2.75, shellHalo: 0.72, damageEmissive: 5.0, damageHalo: 0.72,
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
  bevel: 0.06, bloomStr: 0.5, bloomThresh: 0.9, glowInt: 0.15, opacity: 0.92, shellEmissive: 2.75, shellHalo: 0.72, damageEmissive: 5.0, damageHalo: 0.72,
  tiltBlur: 1.8, tiltSpread: 0.032, tiltVignette: 0.45, vigColor: '#000000', shadowColor: '#020814',
  layerColors: ['#0a1a0d', '#0d4a1a', '#1a7a3a', '#2dd46a', '#9ef5c0'],
  matTransmit: 0.0, matThickness: 0.5, matIor: 1.5, matRoughness: 0.88, cubeJitter: 0.12,
  shadowIntensity: 0.75, shadowBias: -0.001, shadowNormalBias: 0.15, hemIntensity: 0.4,
  shadowRadius: 5, shadowMapSize: 1024, keyLightInt: 0.5, ambientInt: 0.18,
  keyLightColor: '#b8e8c0', lightElev: 48, lightAzimuth: 55, camElev: 35.26, camAzimuth: 45, camZoom: 36,
  terrainTint: '#2d6a4f', beaconCount: 0, beaconColor: '#40ff80', beaconEmissive: 2.5,
  beaconLight: 0.9, beaconBury: 3, beaconSeed: 13, renderMode: 'glass',
};


// ── Particle System Imports are above ──

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


function AnimatedVictoryScreen({ stats, onRestart, triggerFirework }: { stats: { score: number, kills: number, shots: number, time: number, base: number }, onRestart: () => void, triggerFirework: () => void }) {
  const [phase, setPhase] = useState(-2);
  const [leavePhase, setLeavePhase] = useState(-1);
  const [displayBase, setDisplayBase] = useState(0);
  const [displayKills, setDisplayKills] = useState(0);
  const [displayShotsPen, setDisplayShotsPen] = useState(0);
  const [displayShots, setDisplayShots] = useState(0);
  const [displayTimePen, setDisplayTimePen] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  const [viewState, setViewState] = useState<'stats' | 'name' | 'leaderboard'>('stats');
  const [playerName, setPlayerName] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 9));


  useEffect(() => {
    if (phase === -2) {
      // 1800ms cinematic pause: 
      // - 800ms for UI to fade and camera to smoothly center the board
      // - 800ms for the WebGL blur to smoothly ramp up
      // - 200ms extra dramatic beat before dropping text
      const t = setTimeout(() => setPhase(-1), 1800);
      return () => clearTimeout(t);
    } else if (phase === -1) {
      const t = setTimeout(() => setPhase(0), 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase < 0) return;

    const animateNum = (targets: { val: number, set: (v: number) => void }[], onComplete: () => void) => {
      const frames = 30;
      let f = 0;
      const t = setInterval(() => {
        f++;
        const progress = f / frames;
        targets.forEach(tgt => tgt.set(Math.floor(tgt.val * progress)));
        if (f >= frames) {
          targets.forEach(tgt => tgt.set(tgt.val));
          clearInterval(t);
          setTimeout(onComplete, 800); // Pause so the user can read the final counted number
        }
      }, 500 / frames);
    };

    let timeout: NodeJS.Timeout;

    // --- PHASE STATE MACHINE ---
    if (phase === 0) {
      // Sheep Label
      timeout = setTimeout(() => setPhase(1), 1100);
    } else if (phase === 1) {
      // Sheep Stat
      setTimeout(() => setLeavePhase(0), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.kills, set: setDisplayKills }], () => setPhase(2));
      }, 250); 
    } else if (phase === 2) {
      // "SCORE" Label
      setTimeout(() => setLeavePhase(1), 0);
      timeout = setTimeout(() => setPhase(3), 1100);
    } else if (phase === 3) {
      // Sheep Score
      setTimeout(() => setLeavePhase(2), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.kills * 25000, set: setDisplayBase }], () => setPhase(4));
      }, 250);
    } else if (phase === 4) {
      // Time Label
      setTimeout(() => setLeavePhase(3), 0);
      timeout = setTimeout(() => setPhase(5), 1100);
    } else if (phase === 5) {
      // Time Stat
      setTimeout(() => setLeavePhase(4), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.time, set: setDisplayTime }], () => setPhase(6));
      }, 250);
    } else if (phase === 6) {
      // "PENALTY" Label
      setTimeout(() => setLeavePhase(5), 0);
      timeout = setTimeout(() => setPhase(7), 1100);
    } else if (phase === 7) {
      // Time Score
      setTimeout(() => setLeavePhase(6), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.time * 15000, set: setDisplayTimePen }], () => setPhase(8));
      }, 250);
    } else if (phase === 8) {
      // Shots Label
      setTimeout(() => setLeavePhase(7), 0);
      timeout = setTimeout(() => setPhase(9), 1100);
    } else if (phase === 9) {
      // Shots Stat
      setTimeout(() => setLeavePhase(8), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.shots, set: setDisplayShots }], () => setPhase(10));
      }, 250);
    } else if (phase === 10) {
      // "PENALTY" Label
      setTimeout(() => setLeavePhase(9), 0);
      timeout = setTimeout(() => setPhase(11), 1100);
    } else if (phase === 11) {
      // Shots Score
      setTimeout(() => setLeavePhase(10), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.shots * 5000, set: setDisplayShotsPen }], () => setPhase(12));
      }, 250);
    } else if (phase === 12) {
      // Final Score Label
      setTimeout(() => setLeavePhase(11), 0);
      timeout = setTimeout(() => setPhase(13), 1100);
    } else if (phase === 13) {
      // Final Score Value
      setTimeout(() => setLeavePhase(12), 0);
      timeout = setTimeout(() => {
        animateNum([{ val: stats.score, set: setDisplayScore }], () => setPhase(14));
      }, 400);
    }

    return () => clearTimeout(timeout);
  }, [phase, stats]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase >= 13) {
      // Fire a random explosion every ~150-300ms to simulate fireworks
      const fire = () => {
        triggerFirework();
        interval = setTimeout(fire, 40 + Math.random() * 50);
      };
      fire();
    }
    return () => clearTimeout(interval);
  }, [phase, triggerFirework]);

  const getScoreMessage = (score: number, base: number) => {
    if (base === 0) return "Did you even try?";
    
    const pct = score / base;
    
    if (pct >= 0.99) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh', alignItems: 'center', marginTop: '175px' }}>
          <div style={{ fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
            <span style={{ fontSize: '4.5vw' }}>You did it!</span><br/>
            <span style={{ fontSize: '2.5vw' }}>You have mastered one more thing on your journey in life.</span>
          </div>
        </div>
      );
    }
    if (pct >= 0.90) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh', alignItems: 'center', marginTop: '175px' }}>
          <div style={{ fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
            <span style={{ fontSize: '4.5vw' }}>You did it!</span><br/>
            <span style={{ fontSize: '2.5vw' }}>Since you've made it this far, there is nothing you can't do.</span>
          </div>
        </div>
      );
    }
    if (pct >= 0.50) {
      return (
        <>
          Try closing your eyes and see if<br/>
          there is any improvements.
        </>
      );
    }
    if (pct >= 0.20) {
      return (
        <>
          Based on this score you must have<br/>
          accidentally hit something.
        </>
      );
    }
    return (
      <>
        If you're going to kill sheep,<br/>
        you should at least be good.
      </>
    );
  };

  const getScoreQuote = (score: number, base: number) => {
    if (base === 0) return null;
    const pct = score / base;
    if (pct >= 0.99) {
      return (
        <div style={{ fontSize: '1.4vw', fontWeight: 400, fontStyle: 'italic', opacity: 0.8, padding: '15px' }}>
          "The next level is enjoying the figuring it out as much as the figured it out."
        </div>
      );
    }
    if (pct >= 0.90) {
      return (
        <div style={{ fontSize: '1.8vw', fontWeight: 400, fontStyle: 'italic', opacity: 0.8 }}>
          "Enjoy the figuring it out as much as the figured it out."
        </div>
      );
    }
    return null;
  };

  const fmt = (n: number) => new Intl.NumberFormat().format(n);
  const fmtTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const submitScore = async () => {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          name: (playerName || 'AAA').toUpperCase().substring(0, 3),
          score: stats.score
        })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Leaderboard API failed:', res.status, text.substring(0, 200));
        throw new Error('Server returned ' + res.status);
      }

      const data = await res.json();
      setLeaderboardData(data);
      setViewState('leaderboard');
    } catch(e) {
      console.error(e);
      setViewState('leaderboard');
    }
  };

  const gtaStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 800,
    fontSize: '10vw',
    letterSpacing: '-4px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    color: '#fff',
    lineHeight: 0.85,
    margin: 0
  };

  const getKnockoutStyle = (myPhase: number, currentPhase: number, isPersistent = false): React.CSSProperties => {
    const isWaiting = currentPhase < myPhase;
    const isGone = leavePhase >= myPhase && !isPersistent;
    const isActive = !isWaiting && !isGone;

    let transform = 'translate(-50%, -50%)';
    let opacity = viewState === 'stats' ? 1 : 0;
    let transition = 'opacity 0.3s';

    if (isWaiting) {
      transform = 'translate(-50%, -150vh)';
      opacity = 0;
      transition = 'none';
    } else if (isActive) {
      transform = 'translate(-50%, -50%)';
      opacity = viewState === 'stats' ? 1 : 0;
      transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s'; 
    } else if (isGone) {
      transform = 'translate(-50%, 150vh)';
      opacity = 0;
      // No easing curve, instant constant velocity
      transition = 'transform 0.2s linear, opacity 0.2s linear'; 
    }

    return {
      position: 'absolute',
      top: '50%',
      left: '50%', // Centered horizontally
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', // Center everything
      justifyContent: 'center',
      transform,
      opacity,
      transition
    };
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'transparent',
      overflow: 'hidden',
      zIndex: 9999, color: '#fff',
      pointerEvents: 'auto',
      opacity: phase >= -1 ? 1 : 0, transition: 'opacity 0.6s'
    }}>

      <style>{`
        /* Removed colored text classes since everything is white now */
        @keyframes leaderboardDrop {
          0% { transform: translateY(-100vh); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ zIndex: 10002, position: 'absolute', inset: 0 }}>

        <div style={getKnockoutStyle(0, phase)}>
          <span style={gtaStyle}>SHEEP DEFEATED</span>
        </div>
        <div style={getKnockoutStyle(1, phase)}>
          <span style={gtaStyle}>{fmt(displayKills)}</span>
        </div>
        <div style={getKnockoutStyle(2, phase)}>
          <span style={gtaStyle}>BONUS</span>
        </div>
        <div style={getKnockoutStyle(3, phase)}>
          <span style={gtaStyle}>+{fmt(displayBase)}</span>
        </div>

        <div style={getKnockoutStyle(4, phase)}>
          <span style={gtaStyle}>TIME TAKEN</span>
        </div>
        <div style={getKnockoutStyle(5, phase)}>
          <span style={gtaStyle}>{fmtTime(displayTime)}</span>
        </div>
        <div style={getKnockoutStyle(6, phase)}>
          <span style={gtaStyle}>PENALTY</span>
        </div>
        <div style={getKnockoutStyle(7, phase)}>
          <span style={gtaStyle}>-{fmt(displayTimePen)}</span>
        </div>

        <div style={getKnockoutStyle(8, phase)}>
          <span style={gtaStyle}>SHOTS FIRED</span>
        </div>
        <div style={getKnockoutStyle(9, phase)}>
          <span style={gtaStyle}>{fmt(displayShots)}</span>
        </div>
        <div style={getKnockoutStyle(10, phase)}>
          <span style={gtaStyle}>PENALTY</span>
        </div>
        <div style={getKnockoutStyle(11, phase)}>
          <span style={gtaStyle}>-{fmt(displayShotsPen)}</span>
        </div>

        {/* Final Score (Label knocks out, Value persists) */}
        <div style={getKnockoutStyle(12, phase)}>
          <span style={gtaStyle}>FINAL SCORE</span>
        </div>
        <div style={getKnockoutStyle(13, phase, true)}>
          <div style={{ position: 'absolute', bottom: '100%', paddingBottom: 'calc(20vh - 100px)', fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 700, fontSize: '3.5vw', color: '#fff', textAlign: 'center', width: '90vw', lineHeight: 1.2 }}>
            {getScoreMessage(stats.score, stats.base)}
          </div>
          <span style={{ ...gtaStyle, fontSize: '14vw' }}>{fmt(displayScore)}</span>
          <div style={{ position: 'absolute', top: '100%', paddingTop: '75px', fontFamily: 'var(--font-rubik), sans-serif', textAlign: 'center', width: '90vw', color: '#fff', display: 'flex', justifyContent: 'center' }}>
            {getScoreQuote(stats.score, stats.base)}
          </div>
        </div>

        {/* Phase 4: Action Buttons (Persistent at bottom) */}
        <div style={{
           position: 'absolute',
           bottom: 'calc(8vh + 30px)',
           left: '50%',
           transform: phase >= 14 && viewState !== 'name' ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
           opacity: phase >= 14 && viewState !== 'name' ? 1 : 0,
           transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
           pointerEvents: phase >= 14 && viewState !== 'name' ? 'auto' : 'none',
           zIndex: 10003,
           display: 'flex',
           gap: '2vw' // Space them out since they are floating
        }}>
          {[
            { label: 'REPLAY', action: onRestart },
            { label: 'LEADERS', action: () => { if(viewState !== 'leaderboard') setViewState('name'); } },
            { label: 'EXIT', action: () => window.location.reload() }
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)', // Glass effect directly on the button
                border: '1px solid rgba(255,255,255,0.05)', 
                color: 'white',
                borderRadius: 999, 
                padding: '1vw 3vw', 
                cursor: 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif', 
                fontSize: '2.5vw', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: 0.5,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Name Entry State */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: viewState === 'name' ? 1 : 0,
          pointerEvents: viewState === 'name' ? 'auto' : 'none',
          transition: 'opacity 0.3s'
        }}>
          <span style={{ ...gtaStyle, fontSize: '6vw', color: '#a1a1aa' }}>NEW HIGH SCORE!</span>
          <span style={{ ...gtaStyle, fontSize: '4vw', marginBottom: '4vh' }}>ENTER 3 INITIALS</span>
          <input 
            maxLength={3} 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value.toUpperCase())}
            placeholder="AAA"
            style={{ 
              ...gtaStyle, 
              fontSize: '8vw',
              background: 'transparent', 
              border: 'none', 
              borderBottom: '4px solid #fff', 
              textAlign: 'center', 
              width: '40vw', 
              outline: 'none' 
            }} 
          />
          <button
            onClick={submitScore}
            style={{
              marginTop: '6vh',
              padding: '1vw 4vw',
              background: '#fff',
              border: 'none',
              borderRadius: '999px',
              color: '#000',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 800,
              fontSize: '3vw',
              cursor: 'pointer'
            }}
          >
            SUBMIT
          </button>
        </div>

        {/* Leaderboard State */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: viewState === 'leaderboard' ? 1 : 0,
          pointerEvents: viewState === 'leaderboard' ? 'auto' : 'none',
          transition: 'opacity 0.3s'
        }}>
          {viewState === 'leaderboard' && (
            <div style={{
              display: 'flex', flexDirection: 'column', width: '60vw',
            }}>
              <div style={{ 
                ...gtaStyle, 
                fontSize: '5.3vw', 
                width: '100%',
                textAlign: 'center', 
                whiteSpace: 'nowrap',
                marginBottom: '4vh', 
                color: '#fff',
                animation: 'leaderboardDrop 0.4s ease-out both',
                animationDelay: '0s'
              }}>TOP SHEEP PROCESSORS</div>
              {Array.from({ length: 5 }).map((_, i) => {
                const row = leaderboardData[i];
                const isMe = row?.id === sessionId;
                const color = isMe ? '#ffffff' : '#a1a1aa';
                
                // Ranks drop one by one, bottom (4) first, top (0) last
                const delay = (4 - i) * 0.15;
                
                return (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '3vh',
                    animation: 'leaderboardDrop 0.4s ease-out both',
                    animationDelay: `${delay + 0.3}s` // wait 0.3s after title drops in
                  }}>
                    <span style={{ ...gtaStyle, fontSize: '3vw', color, minWidth: '8vw' }}>{i + 1}.</span>
                    <span style={{ ...gtaStyle, fontSize: '3vw', color, flex: 1, textAlign: 'left', paddingLeft: '2vw' }}>
                      {row ? row.name : '___'}
                    </span>
                    <span style={{ ...gtaStyle, fontSize: '3vw', color }}>
                      {row ? fmt(row.score) : '---'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TerrainGenerator({ lsKey: lsKeyProp, onClose, onStartExit, onLoadComplete }: { lsKey?: string, onClose?: () => void, onStartExit?: () => void, onLoadComplete?: () => void } = {}) {
  const { trackEvent } = useAnalytics();
  const [inspectorTab, setInspectorTab] = useState<'geometry' | 'lighting' | 'materials' | 'effects' | 'presets'>('geometry');
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('game_started', { game_name: 'raid_defense' });
  }, []);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const hBlurPassRef = useRef<ShaderPass | null>(null);
  const vBlurPassRef = useRef<ShaderPass | null>(null);
  const victoryBlurActiveRef = useRef(false);
  const victoryCameraCenterRef = useRef(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const cinematicZoomRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const beaconGrpRef = useRef<THREE.Group | null>(null);
  const sheepGrpRef = useRef<THREE.Group | null>(null);
  const flockEngineRef = useRef<FlockEngine | null>(null);

  // Wave System
  const waveNumberRef = useRef(1);

  const sheepScoreRef = useRef(0);
  const totalKillsRef = useRef(0);
  const totalTimeRef = useRef(0);
  const gameStartTimeRef = useRef(Date.now());
  const isGameOverRef = useRef(false);
  const cheatBlockRef = useRef<string | null>(null);
  const cheatBlockMeshRef = useRef<THREE.Mesh | null>(null);
  const [victoryStats, setVictoryStats] = useState<{ score: number, kills: number, shots: number, time: number, base: number } | null>(null);

  // Sync victory state for camera centering and delayed blur
  useEffect(() => {
    if (victoryStats) {
      trackEvent('game_milestone_reached', { 
        game_name: 'raid_defense',
        milestone_type: 'victory',
        score: victoryStats.score,
        kills: victoryStats.kills
      });

      // 1. Immediately start centering the camera and fading UI
      victoryCameraCenterRef.current = true;
      
      // 2. Wait for UI to finish fading (800ms), THEN start the WebGL blur
      const t = setTimeout(() => {
        victoryBlurActiveRef.current = true;
      }, 800);
      return () => clearTimeout(t);
    } else {
      victoryCameraCenterRef.current = false;
      victoryBlurActiveRef.current = false;
    }
  }, [victoryStats]);
  const waveUIRef = useRef<HTMLDivElement>(null);
  const mixedGrpRef = useRef<THREE.Group | null>(null); // for mixed-geo mode
  const hexWorldGrpRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemLightRef = useRef<THREE.HemisphereLight | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const volumetricGrpRef = useRef<THREE.Group | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);

  // ── Weapons System refs ───────────────────────────────────────────────────



  // ── Hover glow system refs (Mesh Pool for trailing fades) ──────────────
  interface HoverPoolItem {
    mesh: THREE.Mesh;
    targetAlpha: number;
    currentAlpha: number;
    blockKey: string;
    active: boolean;
  }
  const hoverPoolRef = useRef<HoverPoolItem[]>([]);
  const hoverCurrentlyHitRef = useRef<string | null>(null);
  const tiltPassRef = useRef<ShaderPass | null>(null);
  const rafRef = useRef<number>(0);
  const fpsElRef = useRef<HTMLSpanElement | null>(null);
  const fpsCountRef = useRef(0);
  const fpsTRef = useRef(0);
  const needsRenderRef = useRef(true);
  const shadowsDirtyRef = useRef(true);
  const vigColorRef = useRef(new THREE.Color('#000000'));
  // ── Hover glow system refs (Mesh Pool for trailing fades) ──────────────
  // ── Particle System Architecture Ref ───────────────────────────────────────
  const particleSystemRef = useRef<IParticleSystem | null>(null);
  const weaponEngineRef = useRef<WeaponEngine | null>(null);
  const mouseWorld3DRef = useRef(new THREE.Vector3());                // 3D world pos of mouse
  const particleFrameRef = useRef(0);                                  // frame counter for UI
  const particleCooldownRef = useRef<Map<string, number>>(new Map());
  const presetExplodeBlocksRef = useRef<Set<string>>(new Set());

  // ── Energon placement system refs ─────────────────────────────────────
  const slotMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());   // key: `${altarIdx}_${slotIdx}`
  const beamMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());   // key altarIdx
  const energonPlacedRef = useRef<Map<string, THREE.Mesh>>(new Map());   // placed energon cube meshes
  const slotsFilledRef = useRef<boolean[][]>(Array(7).fill(null).map(() => Array(5).fill(false)));
  const selectedEnergonRef = useRef<number | null>(null);               // which altar index is held
  const beamScaleRef = useRef<number[]>(Array(7).fill(0));           // 0..1 animation progress

  // ── config key — per-instance so Regional Map has its own namespace ──
  const LS_KEY = lsKeyProp ?? 'arn_terrain_v1';
  const _defaultPreset =
    LS_KEY === 'arn_terrain_regional_v1' ? DEFAULT_REGIONAL_PRESET :
      LS_KEY === 'arn_terrain_city_v1' ? DEFAULT_CITY_PRESET : {
        gridW: 32, gridH: 32, octaves: 1, seed: 360, maxElev: 4, roughness: 0.9,
        bevel: 0.12, bloomStr: 0, bloomThresh: 0, glowInt: 0.1, opacity: 1, damageEmissive: 0, damageHalo: 0,
        tiltBlur: 0.15, tiltSpread: 0.015, tiltVignette: 0, vigColor: '#1a001a', shadowColor: '#0a0e2a',
        layerColors: ["#00ace6", "#8b00d6", "#fac400", "#c34b9d", "#000000"],
        matTransmit: 0.03, matThickness: 3.6, matIor: 2.5, matRoughness: 0.6, cubeJitter: 0.04,
        shadowIntensity: 0.97, shadowBias: -0.0001, shadowNormalBias: 0.5, hemIntensity: 1.5,
        shadowRadius: 5, shadowMapSize: 512, keyLightInt: 2.5, ambientInt: 0.35,
        keyLightColor: '#ffffff', lightElev: 37, lightAzimuth: 43, camElev: 35.26, camAzimuth: 45, camZoom: 28,
        terrainTint: '#1e7a8c', beaconCount: 0, beaconColor: '#ff6b35', beaconEmissive: 0.5,
        beaconLight: 0, beaconBury: 0, beaconSeed: 7, renderMode: 'glass',
        enabledShapes: ["box", "slab", "pillar", "cylinder", "ring"],
        partSize: 1.1, partCount: 2840, partSpeed: 0.7, partChance: 1, partDecay: 0.94, partLife: 180, partFalloff: 0.0008, partLimit: 4000,
        regenSpeed: 110, regenFadeSpeed: 0.08, baseGlow: 0.35, hoverFade: 0.01,
        sheepCount: 25, sheepAnimate: true, sheepSize: 2, sheepSeed: 42, sheepSpeed: 2, sheepBounciness: 0.15, sheepBounceSpeed: 10, sheepGravity: 40, sheepExplodeForce: 25, sheepExplodeRadius: 8, sheepSeparation: 0.4, sheepCohesion: 0.1, sheepAlignment: 0.1,
        scatterCount: 26, scatterRadius: 2, scatterDepth: 3, scatterDelay: 0, scatterProjectiles: 8, scatterSpread: 2,
        artilleryRadius: 5, artilleryDepth: 7, artilleryDelay: 0,
        flyoverRadius: 7, flyoverDepth: 7, flyoverDelay: 2500, flyoverLength: 10, flyoverSpacing: 1.5,

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
  const [gridW, setGridW] = useState<number>(_defaultPreset.gridW ?? 48);
  const [gridH, setGridH] = useState<number>(_defaultPreset.gridH ?? 48);
  const [octaves, setOctaves] = useState<number>(_defaultPreset.octaves ?? 2);
  const [seed, setSeed] = useState<number>(_defaultPreset.seed ?? 42);
  const [maxElev, setMaxElev] = useState<number>(_defaultPreset.maxElev ?? 3);
  const [roughness, setRoughness] = useState<number>(_defaultPreset.roughness ?? 1.5);
  const [bevel, setBevel] = useState<number>(_defaultPreset.bevel ?? 0.08);
  const [bloomStr, setBloomStr] = useState<number>(_defaultPreset.bloomStr ?? 0.5);
  const [bloomThresh, setBloomThresh] = useState<number>(_defaultPreset.bloomThresh ?? 0.85);
  const [glowInt, setGlowInt] = useState<number>(_defaultPreset.glowInt ?? 0.2);
  const [bloomParticlesOnly, setBloomParticlesOnly] = useState<boolean>(false);
  const [shellEmissive, setShellEmissive] = useState<number>(_defaultPreset.shellEmissive ?? 2.75);
  const [shellHalo, setShellHalo] = useState<number>(_defaultPreset.shellHalo ?? 0.72);
  const [damageEmissive, setDamageEmissive] = useState<number>(_defaultPreset.damageEmissive ?? 5.0);
  const [damageHalo, setDamageHalo] = useState<number>(_defaultPreset.damageHalo ?? 0.72);
  const [baseGlow, setBaseGlow] = useState<number>(_defaultPreset.baseGlow ?? 0.1);

  const [hoverFade, _setHoverFade] = useState<number>(_defaultPreset.hoverFade ?? 0.07);
  const hoverFadeRef = useRef(hoverFade);
  const setHoverFade = (v: number) => { _setHoverFade(v); hoverFadeRef.current = v; };
  const [opacity, setOpacity] = useState<number>(_defaultPreset.opacity ?? 0.88);
  const [tiltBlur, setTiltBlur] = useState<number>(_defaultPreset.tiltBlur ?? 1.5);  // default to visible blur
  const [tiltSpread, setTiltSpread] = useState<number>(_defaultPreset.tiltSpread ?? 0.035); // bokeh radius per unit
  const [tiltVignette, setTiltVignette] = useState<number>(_defaultPreset.tiltVignette ?? 0.4);
  const [vigColor, setVigColor] = useState<string>(_defaultPreset.vigColor ?? '#ffffff');
  const [shadowColor, setShadowColor] = useState<string>(_defaultPreset.shadowColor ?? '#0a0e2a'); // cool-dark shadow fill
  // Per-layer colours (live-updatable without full terrain rebuild)
  const [layerColors, setLayerColors] = useState<string[]>(
    _defaultPreset.layerColors?.length === 5 ? _defaultPreset.layerColors : [...DEFAULT_LAYER_COLORS]
  );
  // Transmission glass material
  const [matTransmit, setMatTransmit] = useState<number>(_defaultPreset.matTransmit ?? 0.0);
  const [matThickness, setMatThickness] = useState<number>(_defaultPreset.matThickness ?? 0.5);
  const [matIor, setMatIor] = useState<number>(_defaultPreset.matIor ?? 1.5);
  const [matRoughness, setMatRoughness] = useState<number>(_defaultPreset.matRoughness ?? 0.85);
  const [cubeJitter, setCubeJitter] = useState<number>(_defaultPreset.cubeJitter ?? 0.0);
  // Shadow intensity (separate from ambient — how dark the shadow itself is)
  const [shadowIntensity, setShadowIntensity] = useState<number>(_defaultPreset.shadowIntensity ?? 0.8);
  const [shadowBias, setShadowBias] = useState<number>(_defaultPreset.shadowBias ?? -0.001);
  const [shadowNormalBias, setShadowNormalBias] = useState<number>(_defaultPreset.shadowNormalBias ?? 0.15);
  const [hemIntensity, setHemIntensity] = useState<number>(_defaultPreset.hemIntensity ?? 0.5);
  // Shadow & lighting
  const [shadowRadius, setShadowRadius] = useState<number>(_defaultPreset.shadowRadius ?? 4);
  const [shadowMapSize, setShadowMapSize] = useState<number>(_defaultPreset.shadowMapSize ?? (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent) ? 512 : 1024));
  const [keyLightInt, setKeyLightInt] = useState<number>(_defaultPreset.keyLightInt ?? 0.5);
  const [ambientInt, setAmbientInt] = useState<number>(_defaultPreset.ambientInt ?? 0.18);
  const [keyLightColor, setKeyLightColor] = useState<string>(_defaultPreset.keyLightColor ?? '#a8d8ff');
  const [lightElev, setLightElev] = useState<number>(_defaultPreset.lightElev ?? 55);  // degrees
  const [lightAzimuth, setLightAzimuth] = useState<number>(_defaultPreset.lightAzimuth ?? 40);  // degrees

  // Spotlight
  const [spotEnabled, setSpotEnabled] = useState<boolean>(_defaultPreset.spotEnabled ?? false);
  const [spotInt, setSpotInt] = useState<number>(_defaultPreset.spotInt ?? 2.0);
  const [spotColor, setSpotColor] = useState<string>(_defaultPreset.spotColor ?? '#ffffff');
  const [spotAngle, setSpotAngle] = useState<number>(_defaultPreset.spotAngle ?? 30);
  const [spotPenumbra, setSpotPenumbra] = useState<number>(_defaultPreset.spotPenumbra ?? 0.5);

  // OmniLight (cheap fill light)
  const [omniInt, setOmniInt] = useState<number>(_defaultPreset.omniInt ?? 0.5);
  const [omniColor, setOmniColor] = useState<string>(_defaultPreset.omniColor ?? '#ffffff');
  const [omniY, setOmniY] = useState<number>(_defaultPreset.omniY ?? 15);
  // ── Camera angle controls ─────────────────────────────────────────────────
  const [camElev, setCamElev] = useState<number>(_defaultPreset.camElev ?? 35.26); // 0=horizon, 90=top-down
  const [camAzimuth, setCamAzimuth] = useState<number>(_defaultPreset.camAzimuth ?? 45);   // 0-360 degrees
  const [camZoom, setCamZoom] = useState<number>(_defaultPreset.camZoom ?? 28);    // orthographic frustum half-size
  // Terrain appearance
  const [terrainTint, setTerrainTint] = useState<string>(_defaultPreset.terrainTint ?? '#1e7a8c');
  const [status, setStatus] = useState<string>('Click Generate to build terrain');
  const [saved, setSaved] = useState(false);

  // Beacon config
  const [beaconCount, setBeaconCount] = useState<number>(_defaultPreset.beaconCount ?? 6);
  const [beaconColor, setBeaconColor] = useState<string>(_defaultPreset.beaconColor ?? '#ff6b35');
  const [beaconEmissive, setBeaconEmissive] = useState<number>(_defaultPreset.beaconEmissive ?? 3.5);
  const [beaconLight, setBeaconLight] = useState<number>(_defaultPreset.beaconLight ?? 1.2);
  const [beaconBury, setBeaconBury] = useState<number>(_defaultPreset.beaconBury ?? 3);
  const [beaconSeed, setBeaconSeed] = useState<number>(_defaultPreset.beaconSeed ?? 7);

  // Sheep config
  const [sheepCount, setSheepCount] = useState<number>(_defaultPreset.sheepCount ?? 50);
  const [sheepAnimate, setSheepAnimate] = useState<boolean>(_defaultPreset.sheepAnimate ?? true);
  const [sheepSize, setSheepSize] = useState<number>(_defaultPreset.sheepSize ?? 2.0);
  const [sheepSeed, setSheepSeed] = useState<number>(_defaultPreset.sheepSeed ?? 42);
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
  const [partSize, setPartSize] = useState<number>(_defaultPreset.partSize ?? 1.5);
  const [partCount, setPartCount] = useState<number>(_defaultPreset.partCount ?? 12);
  const [partSpeed, setPartSpeed] = useState<number>(_defaultPreset.partSpeed ?? 1.0);
  const [partChance, setPartChance] = useState<number>(_defaultPreset.partChance ?? 0.85);

  const [partDecay, setPartDecay] = useState<number>(_defaultPreset.partDecay ?? 0.94);
  const [partLife, setPartLife] = useState<number>(_defaultPreset.partLife ?? 180);
  const [partFalloff, setPartFalloff] = useState<number>(_defaultPreset.partFalloff ?? 0.0008);
  const [partLimit, setPartLimit] = useState<number>(_defaultPreset.partLimit ?? 4000);

  const partCountRef = useRef(partCount); useEffect(() => { partCountRef.current = partCount; }, [partCount]);
  const partSpeedRef = useRef(partSpeed); useEffect(() => { partSpeedRef.current = partSpeed; }, [partSpeed]);
  const partLimitRef = useRef(partLimit); useEffect(() => { partLimitRef.current = partLimit; }, [partLimit]);
  const partDecayRef = useRef(partDecay); useEffect(() => { partDecayRef.current = partDecay; }, [partDecay]);
  const partFalloffRef = useRef(partFalloff); useEffect(() => { partFalloffRef.current = partFalloff; }, [partFalloff]);
  const partLifeRef = useRef(partLife); useEffect(() => { partLifeRef.current = partLife; }, [partLife]);
  const partSizeRef = useRef(partSize); useEffect(() => { partSizeRef.current = partSize; }, [partSize]);

  // Behind the Scenes State
  const [isBehindScenesActive, setIsBehindScenesActive] = useState(false);
  const behindScenesBlurActiveRef = useRef(false);
  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsBehindScenesActive(e.detail.active);
      behindScenesBlurActiveRef.current = e.detail.active;
    };
    window.addEventListener('toggle-webgl-blur', handleToggle);
    return () => window.removeEventListener('toggle-webgl-blur', handleToggle);
  }, []);



  const [regenSpeed, setRegenSpeed] = useState<number>(0);
  const [regenFadeSpeed, setRegenFadeSpeed] = useState<number>(0.08);
  const regenSpeedRef = useRef(regenSpeed); useEffect(() => { regenSpeedRef.current = regenSpeed; }, [regenSpeed]);
  const regenFadeSpeedRef = useRef(regenFadeSpeed); useEffect(() => { regenFadeSpeedRef.current = regenFadeSpeed; }, [regenFadeSpeed]);
  const bloomParticlesOnlyRef = useRef(bloomParticlesOnly); useEffect(() => { bloomParticlesOnlyRef.current = bloomParticlesOnly; }, [bloomParticlesOnly]);
  const regeneratingBlocksRef = useRef<Map<string, { scale: number, fast?: boolean }>>(new Map());

  const ws = useWeaponSystem();

  // Expose these so that the rest of TerrainGenerator can use them directly without ws. prefixes
  const {
    selectedWeapon, setSelectedWeapon, selectedWeaponRef,
    settingsWeapon, setSettingsWeapon,
    unlockedWeapons, setUnlockedWeapons, unlockedWeaponsRef,

    scatterPartSpeed, setScatterPartSpeed, scatterPartSpeedRef,
    artilleryPartSpeed, setArtilleryPartSpeed, artilleryPartSpeedRef,
    flyoverPartSpeed, setFlyoverPartSpeed, flyoverPartSpeedRef,
    seismicPartSpeed, setSeismicPartSpeed, seismicPartSpeedRef,
    carpetPartSpeed, setCarpetPartSpeed, carpetPartSpeedRef,
    laserPartSpeed, setLaserPartSpeed, laserPartSpeedRef,
    blackholePartSpeed, setBlackholePartSpeed, blackholePartSpeedRef,

    scatterCount, setScatterCount, scatterCountRef,
    scatterRadius, setScatterRadius, scatterRadiusRef,
    scatterDepth, setScatterDepth, scatterDepthRef,
    scatterDelay, setScatterDelay, scatterDelayRef,
    scatterProjectiles, setScatterProjectiles,
    scatterSpread, setScatterSpread,

    artilleryRadius, setArtilleryRadius, artilleryRadiusRef,
    artilleryDepth, setArtilleryDepth, artilleryDepthRef,
    artilleryDelay, setArtilleryDelay, artilleryDelayRef,

    flyoverRadius, setFlyoverRadius, flyoverRadiusRef,
    flyoverDepth, setFlyoverDepth, flyoverDepthRef,
    flyoverDelay, setFlyoverDelay, flyoverDelayRef,
    flyoverLength, setFlyoverLength,
    flyoverSpacing, setFlyoverSpacing,

    laserRadius, setLaserRadius, laserRadiusRef,
    laserAoe, setLaserAoe, laserAoeRef,
    laserDepth, setLaserDepth, laserDepthRef,
    laserDuration, setLaserDuration, laserDurationRef,
    laserDelay, setLaserDelay, laserDelayRef,


    quakeRadius, setQuakeRadius, quakeRadiusRef,
    quakeDepth, setQuakeDepth, quakeDepthRef,
    quakeSpeed, setQuakeSpeed, quakeSpeedRef,
    quakeDelay, setQuakeDelay, quakeDelayRef,
    quakeCount, setQuakeCount, quakeCountRef,
    quakePartSpeed, setQuakePartSpeed, quakePartSpeedRef,

    carpetRadius, setCarpetRadius, carpetRadiusRef,
    carpetDepth, setCarpetDepth, carpetDepthRef,
    carpetCount, setCarpetCount, carpetCountRef,
    carpetDelay, setCarpetDelay, carpetDelayRef,
    carpetRows, setCarpetRows,
    carpetCols, setCarpetCols,
    carpetSpacing, setCarpetSpacing,

    blackholeRadius, setBlackholeRadius, blackholeRadiusRef,
    blackholeDepth, setBlackholeDepth, blackholeDepthRef,
    blackholeDuration, setBlackholeDuration, blackholeDurationRef,
    blackholeDelay, setBlackholeDelay, blackholeDelayRef,
    weaponCooldownsRef, shotsFiredRef
  } = ws;

  const [altarGlow, setAltarGlow] = useState<number[]>(Array(7).fill(1.0));
  const [altarOcclude, setAltarOcclude] = useState<boolean[]>(Array(7).fill(false));
  // ── Energon placement UI state ────────────────────────────────────────
  const [selectedEnergon, setSelectedEnergon] = useState<number | null>(null);
  const [slotsFilled, setSlotsFilled] = useState<boolean[][]>(() => Array(7).fill(null).map(() => Array(5).fill(false)));


  // ── Treasure Hunters Mode State ────────────────────────────────────────
  const [isTreasureMode, setIsTreasureMode] = useState(false);
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

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scoreSettingsOpen, setScoreSettingsOpen] = useState(false);
  const difficultyRef = useRef<Difficulty>('medium');
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  const [renderEngine, setRenderEngine] = useState<RenderEngine>(_defaultPreset.renderEngine ?? 'multimesh');
  const renderEngineRef = useRef<RenderEngine>(renderEngine);
  useEffect(() => { renderEngineRef.current = renderEngine; }, [renderEngine]);

  const [particleDimensionType, setParticleDimensionType] = useState<'2D' | '3D'>(_defaultPreset.particleDimensionType ?? '3D');
  const particleDimensionTypeRef = useRef(particleDimensionType); 
  useEffect(() => { particleDimensionTypeRef.current = particleDimensionType; }, [particleDimensionType]);
  
  const [particlePoolSize, setParticlePoolSize] = useState<number>(_defaultPreset.particlePoolSize ?? 200);
  const particlePoolSizeRef = useRef<number>(particlePoolSize);
  const brokenBlocksRef = useRef<Set<string>>(new Set());
  useEffect(() => { particlePoolSizeRef.current = particlePoolSize; }, [particlePoolSize]);

  const recreateParticleSystem = (engine: RenderEngine, dim: '2D' | '3D', poolSize: number) => {
      if (particleSystemRef.current && sceneRef.current) {
          particleSystemRef.current.dispose();
          sceneRef.current.remove(particleSystemRef.current.group);
      }
      if (engine === 'multimesh') particleSystemRef.current = new MultiMeshParticleSystem(dim, poolSize);
      else if (engine === 'global') particleSystemRef.current = new GlobalInstancedParticleSystem(dim);
      else if (engine === 'gpu') particleSystemRef.current = new GPUParticleSystem(dim);
      
      if (sceneRef.current) sceneRef.current.add(particleSystemRef.current.group);
  };

  const [particleRenderAmount, setParticleRenderAmount] = useState<number>(_defaultPreset.particleRenderAmount ?? 50);
  const particleRenderAmountRef = useRef<number>(particleRenderAmount);
  useEffect(() => { particleRenderAmountRef.current = particleRenderAmount; }, [particleRenderAmount]);

  const [gpuPartSize, setGpuPartSize] = useState<number>(_defaultPreset.gpuPartSize ?? 1.0);
  const [gpuPartLife, setGpuPartLife] = useState<number>(_defaultPreset.gpuPartLife ?? 1.0);
  const [gpuPartSpeed, setGpuPartSpeed] = useState<number>(_defaultPreset.gpuPartSpeed ?? 1.0);

  // Sync OP settings to GPUParticleSystem
  useEffect(() => {
      if (renderEngine === 'gpu' && particleSystemRef.current instanceof GPUParticleSystem) {
          particleSystemRef.current.setSettings(gpuPartSize, gpuPartLife, gpuPartSpeed);
      }
  }, [renderEngine, gpuPartSize, gpuPartLife, gpuPartSpeed]);


  const [isHealingMode, setIsHealingMode] = useState(false);
  const isHealingRef = useRef(false);
  const isTransitioningWaveRef = useRef(false);
  const announcerElRef = useRef<HTMLDivElement>(null);
  useEffect(() => { isHealingRef.current = isHealingMode; }, [isHealingMode]);

  // Cinematic Wave Announcer
  const announceWave = useCallback((wave: number, count: number, weaponUnlock?: string) => {
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
        if (weaponUnlock) {
          await showText(`WAVE ${wave}`, 600);
          await showText(`${weaponUnlock}\nUNLOCKED`, 1200);
        } else {
          await showText(`WAVE ${wave}`, 600);
        }
        await showText(`2`, 250);
        await showText(`1`, 250);
        if (cameraRef.current) cinematicZoomRef.current = 0.5;
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
          if (s.shellEmissive !== undefined) setShellEmissive(s.shellEmissive);
          if (s.shellHalo !== undefined) setShellHalo(s.shellHalo);
          if (s.damageEmissive !== undefined) setDamageEmissive(s.damageEmissive);
          if (s.damageHalo !== undefined) setDamageHalo(s.damageHalo);
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
          if (s.brokenBlocks !== undefined) {
            brokenBlocksRef.current = new Set(s.brokenBlocks);
          }
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

  // ── Trigger cinematic zoom ONLY when board is physically ready ─────────
  useEffect(() => {
    if (isLoaded && cameraRef.current) {
      // Delay it by 100ms just to ensure the first frame of the board is rendered
      setTimeout(() => {
        cinematicZoomRef.current = 0.1;
      }, 100);
    }
  }, [isLoaded]);

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
            bevel, bloomStr, bloomThresh, glowInt, shellEmissive, shellHalo, damageEmissive, damageHalo, baseGlow, hoverFade, opacity,
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
            carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing,
            blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay,
            renderMode,
            renderEngine, particleDimensionType, particlePoolSize, particleRenderAmount, gpuPartSize, gpuPartLife, gpuPartSpeed,
            enabledShapes: [...enabledShapes],
            brokenBlocks: [...brokenBlocksRef.current],
          }
        })
      }).catch(e => console.error(e));
    } catch (e) { }
  }, [gridW, gridH, octaves, seed, maxElev, roughness,
    bevel, bloomStr, bloomThresh, glowInt, shellEmissive, shellHalo, damageEmissive, damageHalo, baseGlow, hoverFade, opacity,
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
    carpetCount, carpetDelay, carpetRadius, carpetDepth, carpetRows, carpetCols, carpetSpacing,
    blackholeDepth, blackholeRadius, blackholeDuration, blackholeDelay,
    renderMode, renderEngine, particleDimensionType, particlePoolSize, particleRenderAmount, gpuPartSize, gpuPartLife, gpuPartSpeed,
    enabledShapes, isLoaded, LS_KEY]);

  // Terrain data (heightmap)
  const terrainRef = useRef<number[][]>([]);
  const currentHeightsRef = useRef<number[][]>([]);
  const lastBrokenCountRef = useRef<number>(-1);
  const [terrain, setTerrain] = useState<number[][]>([]);

  const pickPresetBlocks = useCallback((heights: number[][], currentSeed: number) => {
    const allKeys: string[] = [];
    for (let gy = 0; gy < heights.length; gy++) {
      for (let gx = 0; gx < (heights[gy]?.length || 0); gx++) {
        const cellH = heights[gy][gx] ?? 1;
        if (cellH > 0) allKeys.push(`${gx}_${gy}_${cellH - 1}`);
      }
    }
    const shuffled = [...allKeys];
    // Proper Fisher-Yates shuffle for true random distribution
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    presetExplodeBlocksRef.current = new Set(shuffled.slice(0, 5));
  }, []);

  const spawnBlockExplosion = (px: number, py: number, pz: number, color: THREE.Color, count: number, speedMult: number, lifeMult: number, forceVel?: THREE.Vector3[], forcePos?: THREE.Vector3[], weaponRadius: number = 1) => {
    if (particleSystemRef.current) {
      // Calculate force based on weapon AOE radius
      // Radius 1 (Scatter) -> ~3.8 force. Radius 27 (Blackhole) -> ~50 force.
      const force = 2.0 + (weaponRadius * 1.8);
      // Scale it cleanly between ~5 to max particles based on radius, capped by user preference
      const calculatedShards = Math.min(particleRenderAmountRef.current, Math.max(5, Math.floor(weaponRadius * 5.5)));

      particleSystemRef.current.explode(px, py, pz, force, 5.0, color, isTreasureModeRef.current, calculatedShards, bloomParticlesOnlyRef.current);
    }
  };
  const triggerFirework = useCallback(() => {
    if (particleSystemRef.current) {
      // Spawn randomly in the sky over the terrain
      const px = (Math.random() - 0.5) * 60;
      const pz = (Math.random() - 0.5) * 60;
      const py = 15 + Math.random() * 25; 
      
      // Random vibrant firework color
      const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.6);
      
      // Use a larger radius for even bigger explosions
      const weaponRadius = 6.0;
      const force = 2.0 + (weaponRadius * 1.8);
      const calculatedShards = Math.min(particleRenderAmountRef.current, Math.max(5, Math.floor(weaponRadius * 5.5)));
      
      particleSystemRef.current.explode(px, py, pz, force, 5.0, color, isTreasureModeRef.current, calculatedShards, bloomParticlesOnlyRef.current);
    }
  }, []);

  const triggerWeaponImpact = useCallback((hx: number, hy: number, hz: number, radius: number, depth: number, partSpeedOverride?: number, innerRadius: number = 0) => {
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
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radius && dist >= innerRadius) {
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



    // We don't use React state for brokenBlocks anymore because it causes syncing issues with fast-healing.

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
              brokenBlocksRef.current.add(k); // Synchronize instantly so useFrame doesn't spam this block
              regeneratingBlocksRef.current.delete(k); // Prevent healing loop from instantly overriding this break

              // Isolate destruction purely to the global offset instance
              const _dummyMat = new THREE.Matrix4();
              c.getMatrixAt(i, _dummyMat);
              // Zero out the entire 3x3 rotation/scale sub-matrix to properly set scale to 0 (even if rotated)
              _dummyMat.elements[0] = 0; _dummyMat.elements[1] = 0; _dummyMat.elements[2] = 0;
              _dummyMat.elements[4] = 0; _dummyMat.elements[5] = 0; _dummyMat.elements[6] = 0;
              _dummyMat.elements[8] = 0; _dummyMat.elements[9] = 0; _dummyMat.elements[10] = 0;
              c.setMatrixAt(i, _dummyMat);
              c.instanceMatrix.needsUpdate = true;

              if (targetGroup) {
                const ci = c.userData.colorIndex;
                const gMesh = targetGroup.children.find((child): child is THREE.InstancedMesh => child instanceof THREE.InstancedMesh && child.userData.isJitterGlow && child.userData.colorIndex === ci);
                if (gMesh) {
                  const _gDummy = new THREE.Matrix4();
                  gMesh.getMatrixAt(i, _gDummy);
                  _gDummy.elements[0] = 0; _gDummy.elements[1] = 0; _gDummy.elements[2] = 0;
                  _gDummy.elements[4] = 0; _gDummy.elements[5] = 0; _gDummy.elements[6] = 0;
                  _gDummy.elements[8] = 0; _gDummy.elements[9] = 0; _gDummy.elements[10] = 0;
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
              const layerCol = (c.material as any).emissive || new THREE.Color(1, 0, 0);
              const px = offsetX + parseInt(k.split('_')[0]);
              const py = parseInt(k.split('_')[2]) + 0.5;
              const pz = offsetZ + parseInt(k.split('_')[1]);
              const numParts = partCountRef.current; // Authentic 1:1 explosion size
              spawnBlockExplosion(px, py, pz, layerCol, numParts, partSpeedOverride ?? partSpeedRef.current, partLifeRef.current, undefined, undefined, radius);
            }
          }
        }
      }
    }

    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;



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
    const dummy = new THREE.Object3D();
    const iMeshes: (THREE.InstancedMesh | null)[] = [];
    const glowIMeshes: (THREE.InstancedMesh | null)[] = [];
    const slots = new Array<number>(totalLevels).fill(0);

    // ── Pre-allocate Glow Mesh Pool ─────────────────────────────────────────
    const POOL_SIZE = 20; // 20 blocks max fading
    hoverPoolRef.current = Array.from({ length: POOL_SIZE }, (_, i) => {
      const geo = new RoundedBoxGeometry(1.04, 1.04, 1.04, 2, 0.08);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0, 0, 0),
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
      const hr = ci / Math.max(totalLevels - 1, 1);
      const levelCol = new THREE.Color(layerColors[ci]);
      // Layer color is primary (90%); terrainTint is a subtle 10% overlay
      const blended = levelCol.clone().lerp(userCol, 0.1);
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
      iMesh.castShadow = true;
      iMesh.receiveShadow = true;
      iMesh.frustumCulled = false;
      iMesh.userData.heightRatio = hr;  // used by live glow/opacity updates
      iMesh.userData.colorIndex = ci;  // ◄ KEY: used by live colour update
      iMeshes.push(iMesh);
      group.add(iMesh);

      // Jitter Glow Mesh — identical logic to hover mesh
      const glowGeo = isLarge ? new THREE.BoxGeometry(1.04, 1.04, 1.04) : new RoundedBoxGeometry(1.04, 1.04, 1.04, 2, 0.08);
      const glowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0, 0, 0),
        emissive: levelCol,
        emissiveIntensity: shellEmissive,
        transparent: true,
        opacity: shellHalo,
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
              const ci = Math.min(gz, totalLevels - 1);
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
    const offsetX = -w / 2, offsetZ = -h / 2;
    const nLayers = layerColors.length;
    const N_TYPES = active.length;

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
              const t = ((gx * 31 + gy * 17 + gz * 7) ^ (gx ^ gy)) % N_TYPES;

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

      const baseCol = new THREE.Color(layerColors[ci]);
      const blended = tintCol.clone().lerp(baseCol, 0.6);

      let finalColor = blended;
      let emissCol = baseCol;
      let emissStr = 0.08 + hr * 0.32 + (shape.metalness > 0.4 ? 0.18 : (shape.id === 'default' ? 0.0 : 0.2));

      if (isGlow) {
        finalColor = new THREE.Color('#4096ff'); // Bright hover blue
        emissCol = new THREE.Color('#4096ff');
        emissStr = 1.2; // High glow intensity
      }

      const mat = new THREE.MeshStandardMaterial({
        color: finalColor,
        emissive: emissCol,
        emissiveIntensity: emissStr,
        roughness: shape.roughness,
        metalness: shape.metalness,
      });

      const geo = shape.makeGeo();
      const iMesh = new THREE.InstancedMesh(geo, mat, count);
      iMesh.castShadow = true;
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
              const t = ((gx * 31 + gy * 17 + gz * 7) ^ (gx ^ gy)) % N_TYPES;

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

                const jx = ((gx * 7 + gy * 13) % 7 - 3) * 0.035;
                const jz = ((gx * 11 + gy * 5) % 7 - 3) * 0.035;
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
    const grp = beaconGrpRef.current;
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
    const col = new THREE.Color(hex);
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
        color: col.clone().lerp(new THREE.Color('#ffffff'), 0.25),
        emissive: col,
        emissiveIntensity: emissive,
        roughness: 0.05,
        metalness: 0.1,
        // opaque so they render in the depth pass, not occluded by transparent terrain
        transparent: false,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
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
      brokenBlocksRef.current.clear();
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
            width: gridW,
            height: gridH,
            heights: terrainRef.current,
            // Terrain appearance
            terrainTint,
            // Lighting
            lighting: {
              keyLightColor, lightElev, lightAzimuth,
              keyLightInt, ambientInt,
              bloomStr, bloomThresh, damageEmissive, damageHalo, baseGlow, opacity
            },
            // Beacon blocks
            beacons: {
              count: beaconCount,
              color: beaconColor,
              emissive: beaconEmissive,
              lightInt: beaconLight,
              buryDepth: beaconBury,
              seed: beaconSeed,
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
    const W = el.clientWidth || window.innerWidth;
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;  // only update shadows when scene actually changes
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    weaponEngineRef.current = new WeaponEngine(scene, triggerWeaponImpact);
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
    camera.zoom = 0.001;
    camera.updateProjectionMatrix();
    cinematicZoomRef.current = null; // Wait for isLoaded
    cameraRef.current = camera;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // Bloom at 1/8th resolution for massive GPU savings
    const bloom = new UnrealBloomPass(new THREE.Vector2(W / 8, H / 8), 0.5, 0.5, 0.28);
    composer.addPass(bloom);
    // TiltShift: blurs edges, keeps center sharp
    const tiltPass = new ShaderPass(RadialDOFShader);
    composer.addPass(tiltPass);

    // Dynamic Fullscreen Blur for Victory Screen
    const hBlurPass = new ShaderPass(HorizontalBlurShader);
    const vBlurPass = new ShaderPass(VerticalBlurShader);
    hBlurPass.uniforms.h.value = 0;
    vBlurPass.uniforms.v.value = 0;
    composer.addPass(hBlurPass);
    composer.addPass(vBlurPass);

    composerRef.current = composer;
    bloomPassRef.current = bloom;
    hBlurPassRef.current = hBlurPass;
    vBlurPassRef.current = vBlurPass;
    tiltPassRef.current = tiltPass;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // Locked to isometric angle
    controls.enableZoom = true;
    controls.enablePan = false; // Disabled panning per user request
    controls.minZoom = 0.001;   // Allow it to start from zero in 3D
    controls.maxZoom = 3.0;   // Constrain zoom in
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.mouseButtons = { LEFT: THREE.MOUSE.DOLLY, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.DOLLY };
    controls.touches = { ONE: THREE.TOUCH.DOLLY, TWO: THREE.TOUCH.DOLLY_PAN };
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
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 200;
    key.shadow.camera.left = key.shadow.camera.bottom = -45;
    key.shadow.camera.right = key.shadow.camera.top = 45;
    key.shadow.camera.updateProjectionMatrix();
    // Shadow bias — fixes self-shadow banding (acne) on box faces
    key.shadow.bias = -0.001;  // stronger default for beveled geometry
    key.shadow.normalBias = 0.15;   // large enough to clear RoundedBoxGeometry bevel normals
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

    // ── Thermodynamic Particle System Initialization ──────────────────────────────
    if (particleSystemRef.current) {
      particleSystemRef.current.dispose();
      scene.remove(particleSystemRef.current.group);
    }
    particleSystemRef.current = new MultiMeshParticleSystem('2D', particlePoolSizeRef.current);
    scene.add(particleSystemRef.current.group);

    // Plane at Y=0 used to project mouse ray to 3D world pos (for magnet target)
    const _magnetPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const _magnetTarget = new THREE.Vector3();

    // Render loop — on-demand: only calls composer.render() when needsRenderRef is set
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
    fpsTRef.current = performance.now();
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      controls.update();

      // Animate Camera Centering for Victory Screen
      if (victoryCameraCenterRef.current && cameraRef.current) {
        // Smoothly pan camera target to exact center of the board
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.04);
        needsRenderRef.current = true;
      }

      // Animate WebGL Blur for Victory Screen OR Behind the Scenes
      if (hBlurPassRef.current && vBlurPassRef.current) {
        // Blur activates only after UI has faded, or immediately for Behind the Scenes
        const blurActive = victoryBlurActiveRef.current || behindScenesBlurActiveRef.current;
        const targetBlurH = blurActive ? 1.5 / window.innerWidth : 0;
        const targetBlurV = blurActive ? 1.5 / window.innerHeight : 0;
        const currentBlurH = hBlurPassRef.current.uniforms.h.value;
        const currentBlurV = vBlurPassRef.current.uniforms.v.value;
        
        if (Math.abs(currentBlurH - targetBlurH) > 0.0001) {
          hBlurPassRef.current.uniforms.h.value += (targetBlurH - currentBlurH) * 0.1;
          vBlurPassRef.current.uniforms.v.value += (targetBlurV - currentBlurV) * 0.1;
          needsRenderRef.current = true;
        } else if (currentBlurH !== targetBlurH) {
          hBlurPassRef.current.uniforms.h.value = targetBlurH;
          vBlurPassRef.current.uniforms.v.value = targetBlurV;
        }
      }

      if (cinematicZoomRef.current !== null && cameraRef.current) {
        const diff = cinematicZoomRef.current - cameraRef.current.zoom;
        if (Math.abs(diff) > 0.001) {
          cameraRef.current.zoom += diff * 0.012; // Extremely smooth, majestic zoom (takes ~3s)
          cameraRef.current.updateProjectionMatrix();
          needsRenderRef.current = true;
        } else {
          cameraRef.current.zoom = cinematicZoomRef.current;
          cameraRef.current.updateProjectionMatrix();
          cinematicZoomRef.current = null;
        }
      }


      const cdNow = Date.now();
      const wpnList = ['scatter', 'artillery', 'flyover', 'laser', 'quake', 'carpet', 'blackhole'];
      for (let i = 0; i < wpnList.length; i++) {
        const w = wpnList[i];
        const cd = WEAPON_COOLDOWNS[w];
        const lastFired = weaponCooldownsRef.current[w] || 0;
        const elapsed = cdNow - lastFired;

        // Update mouse cursor cooldown circle for the currently selected weapon
        if (selectedWeaponRef.current === w) {
          const cursorCircle = document.getElementById('mouse-cooldown-circle');
          const overlayContainer = document.getElementById('mouse-cooldown-overlay');
          const bgTrack = document.getElementById('mouse-cooldown-bg-track');
          const backdrop = document.getElementById('mouse-cooldown-backdrop');
          
          if (cursorCircle && overlayContainer && bgTrack && backdrop) {
            // Fast fade out if game ended
            if (victoryCameraCenterRef.current) {
              overlayContainer.style.opacity = '0';
              continue;
            }

            if (elapsed < cd) {
              overlayContainer.style.opacity = '1';
              if (elapsed < 80) {
                 // Step 1: Dark circle expands outward
                 backdrop.style.opacity = '1';
                 backdrop.setAttribute('r', String((elapsed / 80) * 21));
                 bgTrack.style.strokeDashoffset = '88';
                 cursorCircle.style.strokeDashoffset = '88';
              } else if (elapsed < 200) {
                 // Step 2: Background track animates in
                 backdrop.style.opacity = '1';
                 backdrop.setAttribute('r', '21');
                 const fillP = (elapsed - 80) / 120;
                 bgTrack.style.strokeDashoffset = String(88 - (fillP * 88));
                 cursorCircle.style.strokeDashoffset = '88';
              } else {
                 // Step 3: Yellow progress line starts filling
                 backdrop.style.opacity = '1';
                 backdrop.setAttribute('r', '21');
                 bgTrack.style.strokeDashoffset = '0';
                 const progress = 1 - ((elapsed - 200) / (cd - 200));
                 cursorCircle.style.strokeDashoffset = String(progress * 88);
              }
            } else {
              // Cooldown complete, play reverse exit animation (TWICE AS FAST)
              const outElapsed = elapsed - cd;
              overlayContainer.style.opacity = '1';
              
              if (outElapsed < 50) {
                 // Step 1: Yellow line un-draws
                 backdrop.setAttribute('r', '21');
                 bgTrack.style.strokeDashoffset = '0';
                 const unfill = outElapsed / 50;
                 cursorCircle.style.strokeDashoffset = String(unfill * 88);
              } else if (outElapsed < 100) {
                 // Step 2: Background track un-draws
                 backdrop.setAttribute('r', '21');
                 const unfill = (outElapsed - 50) / 50;
                 bgTrack.style.strokeDashoffset = String(unfill * 88);
                 cursorCircle.style.strokeDashoffset = '88';
              } else if (outElapsed < 140) {
                 // Step 3: Dark circle shrinks
                 const shrinkP = 1 - ((outElapsed - 100) / 40);
                 backdrop.setAttribute('r', String(shrinkP * 21));
                 bgTrack.style.strokeDashoffset = '88';
                 cursorCircle.style.strokeDashoffset = '88';
              } else {
                 overlayContainer.style.opacity = '0';
                 backdrop.setAttribute('r', '0');
                 bgTrack.style.strokeDashoffset = '88';
                 cursorCircle.style.strokeDashoffset = '88';
              }
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
          mat.opacity = p.currentAlpha * 0.72;
          p.mesh.visible = p.currentAlpha > 0.01;
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
      if (weaponEngineRef.current) {
        weaponEngineRef.current.update();
        if (weaponEngineRef.current.getProjectiles().length > 0) {
          needsRenderRef.current = true;
        }
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
            const rndIdx = Math.floor(Math.random() * rndMesh.count);
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

      // ── Particle system: frame counter + update active explosions ───────────
      ++particleFrameRef.current;
      let anyParticleAlive = false;
      const mouseW = mouseWorld3DRef.current;
      const _dummy = new THREE.Object3D();
      let activeExplosionCount = 0;
      if (particleSystemRef.current) {
        activeExplosionCount = particleSystemRef.current.update(
          mouseW,
          partDecayRef.current,
          partFalloffRef.current,
          partSizeRef.current
        );
        if (activeExplosionCount > 0) anyParticleAlive = true;
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
        if (didUpdateMeshes) {
          needsRenderRef.current = true;
          shadowsDirtyRef.current = true;
        }
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

          // Rebuild current heights map if terrain changed or blocks were broken/healed
          if (lastBrokenCountRef.current !== brokenBlocksRef.current.size || currentHeightsRef.current.length !== h) {
             currentHeightsRef.current = [];
             for (let y = 0; y < h; y++) {
                currentHeightsRef.current[y] = [];
                for (let x = 0; x < w; x++) {
                   const cellH = terrainRef.current[y][x] ?? 1;
                   let foundH = -100;
                   for (let hTest = cellH - 1; hTest >= 0; hTest--) {
                      if (!brokenBlocksRef.current.has(`${x}_${y}_${hTest}`)) {
                         foundH = hTest + 1;
                         break;
                      }
                   }
                   currentHeightsRef.current[y][x] = foundH;
                }
             }
             lastBrokenCountRef.current = brokenBlocksRef.current.size;
          }

          const gx = Math.round(px - offsetX);
          const gy = Math.round(pz - offsetZ);

          if (gx >= 0 && gx < w && gy >= 0 && gy < h) {
             return currentHeightsRef.current[gy][gx];
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
          const fmt = new Intl.NumberFormat().format;
          waveUIRef.current.innerHTML = `
                <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 2px;">Wave ${waveNumberRef.current}</div>
                <div style="font-size: 20px; font-weight: 700; color: #ff3b30; letter-spacing: -0.5px;">${fmt(aliveCount)}</div>
                
                <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 8px; margin-bottom: 2px;">Time</div>
                <div style="font-size: 20px; font-weight: 700; color: #0a84ff; letter-spacing: -0.5px;">${timeStr}</div>

                <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 8px; margin-bottom: 2px;">Score</div>
                <div style="font-size: 20px; font-weight: 700; color: #ffd60a; letter-spacing: -0.5px;">${fmt(sheepScoreRef.current)}</div>

                <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 8px; margin-bottom: 2px;">Shots</div>
                <div style="font-size: 20px; font-weight: 700; color: #34c759; letter-spacing: -0.5px;">${fmt(shotsFiredRef.current)}</div>
              `;
        }

        // Trigger next wave if all sheep are dead (and wave has actually spawned)
        if (aliveCount === 0 && flockEngineRef.current.mesh.count > 0 && !isTransitioningWaveRef.current) {
          isTransitioningWaveRef.current = true;

          const sheepInWave = flockEngineRef.current.mesh.count;
          sheepScoreRef.current += sheepInWave * (12 * waveNumberRef.current);
          totalKillsRef.current += sheepInWave;

          if (waveNumberRef.current >= 1) {
            isGameOverRef.current = true;
            
            // 1 Billion is the absolute theoretical maximum (0 time, 0 shots)
            const basePoints = 1000000000;
            // 100k penalty per shot
            const shotsPen = shotsFiredRef.current * 100000;
            // 200k penalty per second (so 10 mins = -120m)
            const timePen = totalTimeRef.current * 200000;
            
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

          // Always trigger a rapid one-time heal for all craters at the end of the round!
          // This prevents unhealed craters from occluding ground-level weapon effects like Quake.
          for (const k of Array.from(brokenBlocksRef.current)) {
            regeneratingBlocksRef.current.set(k, { scale: 0.01, fast: true });
            if (energonPlacedRef.current.has(k)) {
              const eMesh = energonPlacedRef.current.get(k);
              if (eMesh && sceneRef.current) sceneRef.current.remove(eMesh);
              energonPlacedRef.current.delete(k);
            }
          }
          brokenBlocksRef.current.clear();
          
          // Force any currently slow-healing blocks into rapid heal
          for (const [k, state] of Array.from(regeneratingBlocksRef.current.entries())) {
            state.fast = true;
          }

          // CLEAR ACTIVE PROJECTILES SO THEY DON'T INSTANTLY CLEAR THE NEXT WAVE!
          if (weaponEngineRef.current) {
            weaponEngineRef.current.clearProjectiles();
          }

          let nextWave = waveNumberRef.current + 1;
          waveNumberRef.current = nextWave;
          const { sheepCount: nextCount, unlockedWeapons: nextUnlocked, params } = getWaveParams(nextWave, difficultyRef.current);

          // Mutate weapon parameters dynamically via refs
          scatterRadiusRef.current = params.scatter.radius;
          scatterDepthRef.current = params.scatter.depth;
          scatterCountRef.current = params.scatter.count;

          artilleryRadiusRef.current = params.artillery.radius;
          artilleryDepthRef.current = params.artillery.depth;

          flyoverRadiusRef.current = params.flyover.radius;
          flyoverDepthRef.current = params.flyover.depth;

          quakeRadiusRef.current = params.quake.radius;
          quakeDepthRef.current = params.quake.depth;

          carpetRadiusRef.current = params.carpet.radius;
          carpetDepthRef.current = params.carpet.depth;

          laserAoeRef.current = params.laser.radius;
          laserDepthRef.current = params.laser.depth;

          blackholeRadiusRef.current = params.blackhole.radius;
          blackholeDepthRef.current = params.blackhole.depth;

          WEAPON_COOLDOWNS.scatter = params.scatter.cooldown;
          WEAPON_COOLDOWNS.artillery = params.artillery.cooldown;
          WEAPON_COOLDOWNS.flyover = params.flyover.cooldown;

          WEAPON_COOLDOWNS.quake = params.quake.cooldown;
          WEAPON_COOLDOWNS.carpet = params.carpet.cooldown;
          WEAPON_COOLDOWNS.laser = params.laser.cooldown;
          WEAPON_COOLDOWNS.blackhole = params.blackhole.cooldown;

          // We DO NOT change the seed anymore, keep the same board!
          if (presetExplodeBlocksRef.current) presetExplodeBlocksRef.current.clear();
          if (energonPlacedRef.current) energonPlacedRef.current.clear();

          if (waveUIRef.current) {
            waveUIRef.current.style.borderColor = '#4096ff'; // Flash border!
            setTimeout(() => {
              if (waveUIRef.current) waveUIRef.current.style.borderColor = 'rgba(255,255,255,0.1)';
            }, 500);
          }

          if (nextUnlocked.length > unlockedWeaponsRef.current.length) {
            const newlyUnlocked = nextUnlocked[nextUnlocked.length - 1];
            setTimeout(() => {
              setUnlockedWeapons(nextUnlocked);
              setSelectedWeapon(newlyUnlocked);
            }, 0);
            announceWave(nextWave, nextCount, newlyUnlocked.toUpperCase());
          } else {
            announceWave(nextWave, nextCount);
          }
        }
      }

      if (!needsRenderRef.current) return;
      needsRenderRef.current = false;

      if (shadowsDirtyRef.current) {
        renderer.shadowMap.needsUpdate = true;
        shadowsDirtyRef.current = false;
      }

      const prevThresh = bloom.threshold;
      if (bloomParticlesOnlyRef.current) {
         bloom.threshold = 5.0; // Override so only super bright particles bloom
      }

      composer.render();

      if (bloomParticlesOnlyRef.current) {
         bloom.threshold = prevThresh;
      }
      fpsCountRef.current++;
      if (fpsCountRef.current >= 20) {
        const now = performance.now();
        const fps = Math.round(20000 / (now - fpsTRef.current));
        if (fpsElRef.current) fpsElRef.current.textContent = `${fps} FPS`;
        fpsTRef.current = now;
        fpsCountRef.current = 0;
      }
    };
    loop();

    // Resize
    const ro = new ResizeObserver(() => {
      const nW = el.clientWidth, nH = el.clientHeight;
      renderer.setSize(nW, nH);
      composer.setSize(nW, nH);
      bloom.setSize(nW / 8, nH / 8);  // keep bloom at 1/8th-res on resize too
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
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const slotMeshes = [...slotMeshesRef.current.values()].filter(m => m.userData.altarIdx === aIdx);
      const hits = raycaster.intersectObjects(slotMeshes);
      if (!hits.length) return;
      const hit = hits[0].object as THREE.Mesh;
      const altIdx = hit.userData.altarIdx as number;
      const slotIdx = hit.userData.slotIdx as number;
      const key = `${altIdx}_${slotIdx}`;
      if (energonPlacedRef.current.has(key)) return; // already filled
      // Place energon cube above the slot
      const slot = slotMeshesRef.current.get(key)!;
      const col = new THREE.Color(HEX_ALTAR_COLORS[altIdx]);
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
      const newFilled = slotsFilledRef.current.map(a => [...a]);
      newFilled[altIdx][slotIdx] = true;
      slotsFilledRef.current = newFilled;
      setSlotsFilled(newFilled.map(a => [...a]));
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
    const hoverMouse = new THREE.Vector2();
    const _hoverMatrix = new THREE.Matrix4(); // reused every frame — no GC
    const _hoverPos = new THREE.Vector3();

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
      const cx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const cy = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const targets: THREE.Object3D[] = [];
      if (meshGroupRef.current?.visible) targets.push(...meshGroupRef.current.children.filter((c) => (c instanceof THREE.InstancedMesh && !c.userData.isJitterGlow) || c.userData.isCheatBlock));
      if (mixedGrpRef.current?.visible) targets.push(...mixedGrpRef.current.children.filter((c) => c instanceof THREE.InstancedMesh || c.userData.isCheatBlock));

      if (targets.length === 0) return;

      const cMouse = new THREE.Vector2(cx, cy);
      hoverRaycaster.setFromCamera(cMouse, camera);
      const hits = hoverRaycaster.intersectObjects(targets, false);

      if (hits.length > 0) {
        const hit = hits[0];
        const obj = hit.object;
        let blockKey = '';

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
    const _clickScaleDummy = new THREE.Vector3(0, 0, 0);

    let _pointerDownPos = { x: 0, y: 0 };
    const onCanvasPointerDown = (e: PointerEvent) => {
      _pointerDownPos = { x: e.clientX, y: e.clientY };

      // Weapon systems now activate on press (pointerdown) rather than release!
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

          if (!ws.canFire(wpType)) return;

          const targetPos = new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z);

          if (weaponEngineRef.current) {
            let params: any = {};
            if (wpType === 'scatter') params = { count: scatterCountRef.current, radius: scatterRadiusRef.current, depth: scatterDepthRef.current, delay: scatterDelayRef.current, partSpeed: scatterPartSpeedRef.current };
            else if (wpType === 'artillery') params = { radius: artilleryRadiusRef.current, depth: artilleryDepthRef.current, delay: artilleryDelayRef.current, partSpeed: artilleryPartSpeedRef.current };
            else if (wpType === 'flyover') params = { radius: flyoverRadiusRef.current, depth: flyoverDepthRef.current, delay: flyoverDelayRef.current, hitObject: hit.object, instanceId: hit.instanceId, hoverPoolRef: hoverPoolRef.current, partSpeed: flyoverPartSpeedRef.current };
            else if (wpType === 'laser') params = { radius: laserRadiusRef.current, aoe: laserAoeRef.current, depth: laserDepthRef.current, delay: laserDelayRef.current, duration: laserDurationRef.current, partSpeed: laserPartSpeedRef.current };
            else if (wpType === 'quake') {
              params = { count: quakeCountRef.current, radius: quakeRadiusRef.current, depth: quakeDepthRef.current, delay: quakeDelayRef.current, speed: quakeSpeedRef.current, partSpeed: quakePartSpeedRef.current };
            }
            else if (wpType === 'carpet') params = { count: carpetCountRef.current, radius: carpetRadiusRef.current, depth: carpetDepthRef.current, delay: carpetDelayRef.current, partSpeed: carpetPartSpeedRef.current };
            else if (wpType === 'blackhole') params = { radius: blackholeRadiusRef.current, depth: blackholeDepthRef.current, delay: blackholeDelayRef.current, duration: blackholeDurationRef.current, partSpeed: blackholePartSpeedRef.current };

            weaponEngineRef.current.fire(wpType, targetPos, params);
          }

          return; // End early.
        }

        const iMesh = hit.object as THREE.InstancedMesh;
        const instIdx = hit.instanceId ?? 0;

        if (iMesh.userData.coordMap) {
          const blockKey = iMesh.userData.coordMap[instIdx];
          if (blockKey && !brokenBlocksRef.current.has(blockKey) && (presetExplodeBlocksRef.current.has(blockKey) || isTreasureModeRef.current)) { // Break it!
            // 1. Log broken block in ref
            brokenBlocksRef.current.add(blockKey);

            // 2. Hide immediately without full rebuild
            iMesh.getMatrixAt(instIdx, _clickMatrix);
            // Scale out the diagonal
            _clickMatrix.elements[0] = 0;
            _clickMatrix.elements[5] = 0;
            _clickMatrix.elements[10] = 0;
            iMesh.setMatrixAt(instIdx, _clickMatrix);
            iMesh.instanceMatrix.needsUpdate = true;
            shadowsDirtyRef.current = true;

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

            // 3. Modular Particle Burst!
            const layerCol = (iMesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial).emissive;
            if (particleSystemRef.current) {
              // Use user preference for particle count
              particleSystemRef.current.explode(hit.point.x, hit.point.y + 0.5, hit.point.z, 25.0, 5.0, layerCol, isTreasureModeRef.current, particleRenderAmountRef.current, bloomParticlesOnlyRef.current);
            }
            needsRenderRef.current = true;
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onCanvasMouseMove);
    renderer.domElement.addEventListener('mouseleave', onCanvasMouseLeave);
    renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.domElement.removeEventListener('click', onCanvasClick_Energon);
      renderer.domElement.removeEventListener('pointerdown', onCanvasPointerDown);
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
      u.blur.value = tiltBlur;
      u.spread.value = tiltSpread;
      u.vignette.value = tiltVignette;
      // PERF: reuse persistent Color instance — avoids GC allocation on rapid slider drags
      u.vigColor.value = vigColorRef.current.set(vigColor);
      // PERF: disable the pass entirely when blur is effectively zero — saves a full GPU blit
      tp.enabled = tiltBlur > 0.003;
      needsRenderRef.current = true;
    }
  }, [tiltBlur, tiltSpread, tiltVignette, vigColor]);

  // Live layer-colour + terrainTint + Shell glow updates
  // Layer color is primary (90%), terrainTint is a subtle 10% overlay
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    const tintCol = new THREE.Color(terrainTint);
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      const ci = (child.userData.colorIndex as number) ?? 0;
      const levelCol = new THREE.Color(layerColors[ci] ?? DEFAULT_LAYER_COLORS[ci]);
      const blended = levelCol.clone().lerp(tintCol, 0.1);

      if (child.userData.isJitterGlow) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive.copy(levelCol);
        mat.emissiveIntensity = shellEmissive;
        mat.opacity = shellHalo;
        mat.needsUpdate = true;
      } else {
        const mat = child.material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
        if ('color' in mat) mat.color.copy(blended);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = baseGlow;
        mat.needsUpdate = true;
      }
    }
    needsRenderRef.current = true;
  }, [layerColors, terrainTint, shellEmissive, shellHalo, baseGlow]);

  // Live transmission material update
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      if ((child.material as any).type !== 'MeshPhysicalMaterial') continue;
      const mat = child.material as THREE.MeshPhysicalMaterial;
      mat.transmission = matTransmit;
      mat.thickness = matThickness;
      mat.ior = matIor;
      mat.transparent = matTransmit < 0.05;
      mat.needsUpdate = true;
    }
    needsRenderRef.current = true;
  }, [matTransmit, matThickness, matIor]);



  // Live bloom update — strength and threshold both need a re-render
  useEffect(() => {
    const bp = bloomPassRef.current;
    if (!bp) return;
    bp.strength = bloomStr;
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
        mat.emissiveIntensity = shellEmissive; // controlled by Shell Emissive
        mat.opacity = shellHalo;               // controlled by Shell Halo
        mat.needsUpdate = true;
      } else {
        const mat = child.material as THREE.MeshPhysicalMaterial;
        if (!mat) continue;
        const hr = (child.userData.heightRatio as number) ?? 0;
        mat.emissiveIntensity = baseGlow; // Base terrain uses baseGlow
        mat.opacity = Math.max(0.05, opacity - hr * 0.05);
        mat.needsUpdate = true;
      }
    }
    needsRenderRef.current = true;
  }, [glowInt, baseGlow, opacity, shellEmissive, shellHalo]);



  // Adjust particle settings dynamically
  // partSize is handled in useFrame loop via partSizeRef

  // ── Sync group visibility when render mode changes ──────────────────────────
  useEffect(() => {
    if (meshGroupRef.current) meshGroupRef.current.visible = renderMode === 'glass';
    if (mixedGrpRef.current) mixedGrpRef.current.visible = renderMode === 'mixed';
    needsRenderRef.current = true;
    if (renderMode === 'mixed' && terrainRef.current.length) {
      rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode]);

  // ── Show/hide hex world vs procedural groups when layout tab changes ────────────
  useEffect(() => {
    const hexGrp = hexWorldGrpRef.current;
    const meshGrp = meshGroupRef.current;
    const mixedGrp = mixedGrpRef.current;
    const beaconGrp = beaconGrpRef.current;
    const isCustom = layoutTab === 'custom';
    // Hex world only visible in Custom tab
    if (hexGrp) hexGrp.visible = false; // only show after explicit Generate click
    // Procedural terrain groups respect renderMode, but stay hidden in Custom
    if (meshGrp) meshGrp.visible = !isCustom && renderMode === 'glass';
    if (mixedGrp) mixedGrp.visible = !isCustom && renderMode === 'mixed';
    // Beacons: show in procedural, hide in custom (custom uses its own structures)
    if (beaconGrp) beaconGrp.visible = !isCustom;
    needsRenderRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutTab]);

  // ── Auto-regenerate terrain meshes when expanding boundaries to large_map ────────────
  useEffect(() => {
    if ((layoutTab === 'procedural' || layoutTab === 'large_map') && terrainRef.current.length > 0) {
      if (renderMode === 'glass') {
        rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, brokenBlocksRef.current);
      } else {
        rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, brokenBlocksRef.current);
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
    camera.left = -camZoom * asp;
    camera.right = camZoom * asp;
    camera.top = camZoom;
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
      const elevRad = (lightElev * Math.PI) / 180;
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
      const elevRad = (Math.max(5, lightElev - 20) * Math.PI) / 180;
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
    k.shadow.bias = shadowBias;
    k.shadow.normalBias = shadowNormalBias;
    needsRenderRef.current = true;
  }, [shadowBias, shadowNormalBias]);

  // Live roughness update — kills specular hotspot without rebuilding terrain
  useEffect(() => {
    const grp = meshGroupRef.current;
    if (!grp) return;
    for (const child of grp.children) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      (child.material as THREE.MeshPhysicalMaterial).roughness = matRoughness;
      (child.material as THREE.MeshPhysicalMaterial).needsUpdate = true;
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
      brokenBlocksRef.current.clear();
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
  }, [gridW, gridH, octaves, seed, maxElev, roughness, bevel]);

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
    const scene = sceneRef.current;
    const hexGrp = hexWorldGrpRef.current;
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
    const R = 18; // hex ring radius in grid units

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
    slotsFilledRef.current = Array(7).fill(null).map(() => Array(5).fill(false));
    setSlotsFilled(Array(7).fill(null).map(() => Array(5).fill(false)));
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
      const hg = c.createLinearGradient(0, 0, 32, 0);
      hg.addColorStop(0, 'transparent'); hg.addColorStop(0.35, hex + 'bb');
      hg.addColorStop(0.5, hex + 'ff'); hg.addColorStop(0.65, hex + 'bb');
      hg.addColorStop(1, 'transparent');
      c.fillStyle = hg; c.fillRect(0, 0, 32, 128);
      const vg = c.createLinearGradient(0, 0, 0, 128);
      c.globalCompositeOperation = 'multiply';
      vg.addColorStop(0, 'transparent'); vg.addColorStop(0.08, hex + 'ff');
      vg.addColorStop(0.6, hex + '88'); vg.addColorStop(1, 'transparent');
      c.fillStyle = vg; c.fillRect(0, 0, 32, 128);
      return new THREE.CanvasTexture(cv);
    };

    altarPos.forEach((ap, idx) => {
      const col = new THREE.Color(HEX_ALTAR_COLORS[idx]);
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
      const pillarOffsets: [number, number][] = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
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
      cSlotMesh.userData.isSlot = true;
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
        slotPlate.userData.isSlot = true;
        slotPlate.userData.slotIdx = si;
        slotPlate.userData.altarIdx = idx;
        tag(slotPlate, 0.06);
        slotMeshesRef.current.set(`${idx}_${si}`, slotPlate);
      }

      // ── Lights — dim initially (lights up when cubes placed) ─────────────
      const crownLight = new THREE.PointLight(col, 1.2, 14, 2);
      crownLight.position.set(ap.x + offsetX, CAP_Y + 4, ap.z + offsetZ);
      crownLight.userData.altarIdx = idx;
      crownLight.userData.baseLight = 8;
      hexGrp.add(crownLight);

      const poolLight = new THREE.PointLight(col, 0.6, 8, 2);
      poolLight.position.set(ap.x + offsetX, FLOOR_Y + 1, ap.z + offsetZ);
      poolLight.userData.altarIdx = idx;
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

      {/* ── Three.js canvas ───────────────────────────────────────── */}
      <div ref={mountRef} className="game-canvas-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <style>{`
          .game-canvas-wrapper canvas {
            transform: scale(1);
            opacity: 1;
            transform-origin: center center;
          }
        `}</style>

        {/* ── Behind the Scenes Crawl ── */}


        {/* ── UI Elements Overlay (Fades in, fades out separately) ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
          opacity: (isLoaded && !isGameboardExited && !victoryStats && !isBehindScenesActive) ? 1 : 0, transition: 'opacity 0.8s ease-out', zIndex: 100
        }}>
          {/* Pink box removed */}
          {/* Close Game Button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: '90px', right: '40px', zIndex: 110,
              width: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: 'rgba(52, 199, 89, 0.9)', border: '1px solid rgba(52, 199, 89, 1)',
              color: 'white', padding: '16px', borderRadius: '9999px', cursor: 'pointer',
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

          {/* Randomize Background Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new Event('nexus-randomize'));
              
              // Reset game to level 1 start
              const { sheepCount, unlockedWeapons } = getWaveParams(1, difficultyRef.current);
              
              setVictoryStats(null);
              waveNumberRef.current = 1;
              shotsFiredRef.current = 0;
              sheepScoreRef.current = 0;
              totalKillsRef.current = 0;
              totalTimeRef.current = 0;
              gameStartTimeRef.current = Date.now();
              isGameOverRef.current = false;
              
              setUnlockedWeapons(unlockedWeapons);
              setSelectedWeapon(unlockedWeapons[0]);
              
              // Force a complete board heal!
              const emptySet = new Set<string>();
              brokenBlocksRef.current.clear();
              regeneratingBlocksRef.current.clear();
              
              if (weaponEngineRef.current) {
                weaponEngineRef.current.clearProjectiles();
              }
              
              // Start countdown via announceWave instead of instant spawn
              announceWave(1, sheepCount);
              
              if (renderMode === 'glass') {
                rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
              } else {
                rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, emptySet);
              }
            }}
            title="Randomize Background & Restart Game"
            style={{
              position: 'absolute', top: 96, left: 40, zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>

          <div style={{
            position: 'absolute',
            top: '50%',
            left: 40,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(18, 18, 22, 0.65)',
            backdropFilter: 'blur(24px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: '24px 20px',
            width: 160, // Increased width slightly to accommodate the status text
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease'
          }}>
            <div style={{ 
              color: saved ? '#4af' : '#9ca3af', 
              fontSize: 10, 
              textAlign: 'center', 
              marginBottom: 16,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 600,
              lineHeight: 1.4
            }}>
              {status}
            </div>

            <div
              ref={waveUIRef}
              style={{
                color: '#fff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                pointerEvents: 'none',
                textAlign: 'center'
              }}
            >
            </div>

            <button
              onClick={() => setScoreSettingsOpen(prev => !prev)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                marginTop: 16, padding: '8px 0', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, pointerEvents: 'auto'
              }}
            >
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: scoreSettingsOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)', 
                border: scoreSettingsOpen ? '2px solid rgba(255, 255, 255, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)',
                color: '#fff', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: scoreSettingsOpen ? 'rotate(90deg)' : 'none', transition: 'all 0.3s ease',
                boxShadow: scoreSettingsOpen ? '0 4px 16px rgba(0,0,0,0.3)' : 'none'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
            </button>

            <div style={{
              display: 'grid', gridTemplateRows: scoreSettingsOpen ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: scoreSettingsOpen ? 'auto' : 'none'
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: 8 }}>
                  <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 8 }} />
                  {/* Difficulty Reset Panel */}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, textAlign: 'center', marginBottom: 2 }}>Difficulty</div>
                  <button
                    onClick={() => {
                      setDifficulty('easy');
                      waveNumberRef.current = 1;
                      sheepScoreRef.current = 0;
                      shotsFiredRef.current = 0;
                      totalKillsRef.current = 0;
                      totalTimeRef.current = 0;
                      if (flockEngineRef.current) flockEngineRef.current.reset();
                      const { sheepCount, unlockedWeapons } = getWaveParams(1, 'easy');
                      setUnlockedWeapons(unlockedWeapons);
                      setSelectedWeapon(unlockedWeapons[0]);
                      announceWave(1, sheepCount);

                      // Force a complete board heal!
                      const emptySet = new Set<string>();
                      brokenBlocksRef.current.clear();
                      regeneratingBlocksRef.current.clear();
                      if (renderMode === 'glass') {
                        rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
                      } else {
                        rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, emptySet);
                      }
                    }}
                    style={{ background: difficulty === 'easy' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255,255,255,0.05)', color: difficulty === 'easy' ? '#34c759' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>Easy</button>
                  <button
                    onClick={() => {
                      setDifficulty('medium');
                      waveNumberRef.current = 1;
                      sheepScoreRef.current = 0;
                      shotsFiredRef.current = 0;
                      totalKillsRef.current = 0;
                      totalTimeRef.current = 0;
                      if (flockEngineRef.current) flockEngineRef.current.reset();
                      const { sheepCount, unlockedWeapons } = getWaveParams(1, 'medium');
                      setUnlockedWeapons(unlockedWeapons);
                      setSelectedWeapon(unlockedWeapons[0]);
                      announceWave(1, sheepCount);

                      // Force a complete board heal!
                      const emptySet = new Set<string>();
                      brokenBlocksRef.current.clear();
                      regeneratingBlocksRef.current.clear();
                      if (renderMode === 'glass') {
                        rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
                      } else {
                        rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, emptySet);
                      }
                    }}
                    style={{ background: difficulty === 'medium' ? 'rgba(255, 214, 10, 0.3)' : 'rgba(255,255,255,0.05)', color: difficulty === 'medium' ? '#ffd60a' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>Medium</button>
                  <button
                    onClick={() => {
                      setDifficulty('hard');
                      waveNumberRef.current = 1;
                      sheepScoreRef.current = 0;
                      shotsFiredRef.current = 0;
                      totalKillsRef.current = 0;
                      totalTimeRef.current = 0;
                      if (flockEngineRef.current) flockEngineRef.current.reset();
                      const { sheepCount, unlockedWeapons } = getWaveParams(1, 'hard');
                      setUnlockedWeapons(unlockedWeapons);
                      setSelectedWeapon(unlockedWeapons[0]);
                      announceWave(1, sheepCount);

                      // Force a complete board heal!
                      const emptySet = new Set<string>();
                      brokenBlocksRef.current.clear();
                      regeneratingBlocksRef.current.clear();
                      if (renderMode === 'glass') {
                        rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
                      } else {
                        rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, emptySet);
                      }
                    }}
                    style={{ background: difficulty === 'hard' ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255,255,255,0.05)', color: difficulty === 'hard' ? '#ff3b30' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>Hard</button>
                </div>

                <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Render Engine Panel */}
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, textAlign: 'center', marginBottom: 2 }}>Particle Type</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                        onClick={() => { setParticleDimensionType('2D'); recreateParticleSystem(renderEngine, '2D', particlePoolSize); }}
                        style={{ flex: 1, background: particleDimensionType === '2D' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255,255,255,0.05)', color: particleDimensionType === '2D' ? '#0a84ff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '4px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>2D</button>
                    <button 
                        onClick={() => { setParticleDimensionType('3D'); recreateParticleSystem(renderEngine, '3D', particlePoolSize); }}
                        style={{ flex: 1, background: particleDimensionType === '3D' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255,255,255,0.05)', color: particleDimensionType === '3D' ? '#0a84ff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '4px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>3D</button>
                  </div>
                  
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, textAlign: 'center', marginBottom: 2, marginTop: 4 }}>Particle Engine</div>
                  <button
                    onClick={() => {
                      setRenderEngine('multimesh');
                      recreateParticleSystem('multimesh', particleDimensionType, particlePoolSize);
                    }}
                    style={{ background: renderEngine === 'multimesh' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255,255,255,0.05)', color: renderEngine === 'multimesh' ? '#0a84ff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>Multi-Mesh</button>
                  <button
                    onClick={() => {
                      setRenderEngine('global');
                      recreateParticleSystem('global', particleDimensionType, particlePoolSize);
                    }}
                    style={{ background: renderEngine === 'global' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255,255,255,0.05)', color: renderEngine === 'global' ? '#0a84ff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>Global Mesh</button>
                  <button
                    onClick={() => {
                      setRenderEngine('gpu');
                      recreateParticleSystem('gpu', particleDimensionType, particlePoolSize);
                    }}
                    style={{ background: renderEngine === 'gpu' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255,255,255,0.05)', color: renderEngine === 'gpu' ? '#0a84ff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '8px', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>OP Optimized</button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '4px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Count</span>
                    <input 
                      type="number" 
                      min={10} 
                      max={100} 
                      step={10} 
                      value={particleRenderAmount} 
                      onChange={(e) => setParticleRenderAmount(Number(e.target.value))}
                      style={{ 
                        background: 'transparent', border: 'none', color: '#0a84ff', 
                        fontSize: 11, fontWeight: 700, width: 40, textAlign: 'right', outline: 'none'
                      }} 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '4px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Pool Size</span>
                    <input 
                      type="number" 
                      min={50} 
                      max={1000} 
                      step={50} 
                      value={particlePoolSize} 
                      onChange={(e) => {
                          setParticlePoolSize(Number(e.target.value));
                      }}
                      onBlur={() => {
                          recreateParticleSystem(renderEngine, particleDimensionType, particlePoolSize);
                      }}
                      style={{ 
                        background: 'transparent', border: 'none', color: '#0a84ff', 
                        fontSize: 11, fontWeight: 700, width: 40, textAlign: 'right', outline: 'none'
                      }} 
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Wave Announcer ── */}
          <div
            ref={announcerElRef}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(0.8)',
              fontSize: '10vw', fontWeight: 800, color: '#fff',
              fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-4px',
              textAlign: 'center', lineHeight: '0.85', whiteSpace: 'pre-wrap',
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

                <SmoothHeight>
                {settingsWeapon === 'scatter' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Blast Radius" min={1} max={10} step={1} value={scatterRadius} baseline={3} onChange={setScatterRadius} accent="#ff3b30" />
                    <CfgSlider label="Projectile Count" min={1} max={30} step={1} value={scatterCount} baseline={8} onChange={setScatterCount} accent="#ff3b30" />
                    <CfgSlider label="Scatter Depth" min={1} max={8} step={1} value={scatterDepth} baseline={3} onChange={setScatterDepth} accent="#ff3b30" />
                    <CfgSlider label="Delay (ms)" min={0} max={1000} step={50} value={scatterDelay} baseline={0} onChange={setScatterDelay} accent="#ff3b30" />
                    <CfgSlider label="Particle Speed" min={0.5} max={10} step={0.5} value={scatterPartSpeed} baseline={2} onChange={setScatterPartSpeed} accent="#ff3b30" />
                  </div>
                )}

                {settingsWeapon === 'artillery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Impact Radius" min={2} max={12} step={1} value={artilleryRadius} baseline={3} onChange={setArtilleryRadius} accent="#ff9500" />
                    <CfgSlider label="Crater Depth" min={1} max={10} step={1} value={artilleryDepth} baseline={4} onChange={setArtilleryDepth} accent="#ff9500" />
                    <CfgSlider label="Launch Delay (ms)" min={0} max={2000} step={50} value={artilleryDelay} baseline={0} onChange={setArtilleryDelay} accent="#ff9500" />
                    <CfgSlider label="Particle Speed" min={0.5} max={10} step={0.5} value={artilleryPartSpeed} baseline={2} onChange={setArtilleryPartSpeed} accent="#ff9500" />
                  </div>
                )}

                {settingsWeapon === 'flyover' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Bomb Radius" min={1} max={8} step={1} value={flyoverRadius} baseline={5} onChange={setFlyoverRadius} accent="#007aff" />
                    <CfgSlider label="Bomb Depth" min={1} max={8} step={1} value={flyoverDepth} baseline={5} onChange={setFlyoverDepth} accent="#007aff" />
                    <CfgSlider label="Run Length" min={2} max={20} step={1} value={flyoverLength} baseline={10} onChange={setFlyoverLength} accent="#007aff" />
                    <CfgSlider label="Spacing" min={1} max={5} step={0.5} value={flyoverSpacing} baseline={1.5} onChange={setFlyoverSpacing} accent="#007aff" />
                    <CfgSlider label="Particle Speed" min={0.5} max={10} step={0.5} value={flyoverPartSpeed} baseline={2} onChange={setFlyoverPartSpeed} accent="#007aff" />
                  </div>
                )}

                {settingsWeapon === 'laser' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Beam Radius" min={1} max={10} step={1} value={laserRadius} baseline={4} onChange={setLaserRadius} accent="#ff2d55" />
                    <CfgSlider label="Damage AOE" min={1} max={20} step={1} value={ws.laserAoe} baseline={8} onChange={ws.setLaserAoe} accent="#ff2d55" />
                    <CfgSlider label="Penetration Depth" min={1} max={20} step={1} value={laserDepth} baseline={10} onChange={setLaserDepth} accent="#ff2d55" />
                    <CfgSlider label="Burn Duration (ms)" min={500} max={5000} step={100} value={laserDuration} baseline={1500} onChange={setLaserDuration} accent="#ff2d55" />
                    <CfgSlider label="Activation Delay" min={0} max={2000} step={50} value={laserDelay} baseline={0} onChange={setLaserDelay} accent="#ff2d55" />
                    <CfgSlider label="Particle Speed" min={0.5} max={10} step={0.5} value={laserPartSpeed} baseline={6} onChange={setLaserPartSpeed} accent="#ff2d55" />
                  </div>
                )}


                
                {settingsWeapon === 'quake' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Destruction Radius" min={2} max={16} step={1} value={quakeRadius} baseline={8} onChange={setQuakeRadius} accent="#ff9900" />
                    <CfgSlider label="Shatter Depth" min={1} max={10} step={1} value={quakeDepth} baseline={3} onChange={setQuakeDepth} accent="#ff9900" />
                    <CfgSlider label="Wave Speed" min={10} max={100} step={5} value={quakeSpeed} baseline={40} onChange={setQuakeSpeed} accent="#ff9900" />
                    <CfgSlider label="Tremors" min={0} max={10} step={1} value={quakeCount} baseline={5} onChange={setQuakeCount} accent="#ff9900" />
                    <CfgSlider label="Particle Speed" min={0.1} max={10} step={0.1} value={quakePartSpeed} baseline={1} onChange={setQuakePartSpeed} accent="#ff9900" />
                  </div>
                )}

                {settingsWeapon === 'carpet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Bomb Radius" min={1} max={8} step={1} value={carpetRadius} baseline={4} onChange={setCarpetRadius} accent="#5856d6" />
                    <CfgSlider label="Crater Depth" min={1} max={10} step={1} value={carpetDepth} baseline={4} onChange={setCarpetDepth} accent="#5856d6" />
                    <CfgSlider label="Grid Rows" min={1} max={10} step={1} value={carpetRows} baseline={3} onChange={setCarpetRows} accent="#5856d6" />
                    <CfgSlider label="Grid Cols" min={1} max={10} step={1} value={carpetCols} baseline={3} onChange={setCarpetCols} accent="#5856d6" />
                    <CfgSlider label="Drop Delay (ms)" min={50} max={1000} step={10} value={carpetDelay} baseline={150} onChange={setCarpetDelay} accent="#5856d6" />
                    <CfgSlider label="Particle Speed" min={0.5} max={10} step={0.5} value={carpetPartSpeed} baseline={2} onChange={setCarpetPartSpeed} accent="#5856d6" />
                  </div>
                )}

                {settingsWeapon === 'blackhole' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <CfgSlider label="Event Horizon Radius" min={2} max={20} step={1} value={blackholeRadius} baseline={8} onChange={setBlackholeRadius} accent="#af52de" />
                    <CfgSlider label="Singularity Depth" min={5} max={30} step={1} value={blackholeDepth} baseline={10} onChange={setBlackholeDepth} accent="#af52de" />
                    <CfgSlider label="Collapse Duration" min={1000} max={10000} step={500} value={blackholeDuration} baseline={3000} onChange={setBlackholeDuration} accent="#af52de" />
                    <CfgSlider label="Spawn Delay (ms)" min={0} max={3000} step={100} value={blackholeDelay} baseline={0} onChange={setBlackholeDelay} accent="#af52de" />
                    <CfgSlider label="Particle Speed" min={0.1} max={10} step={0.1} value={blackholePartSpeed} baseline={1} onChange={setBlackholePartSpeed} accent="#af52de" />
                  </div>
                )}
                </SmoothHeight>
                {/* Global Weapon Post-Processing removed by user request */}
              </div>

              {/* Scroll to zoom */}
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
                marginBottom: 4,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                pointerEvents: 'none',
                opacity: settingsWeapon ? 0 : 1, // Hide when drawer is open
                transition: 'opacity 0.3s',
              }}>
                🖱 Scroll to zoom
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
                Press and hold weapon to balance system
              </div>


              {/* Dock */}
              <div style={{
                display: 'flex', gap: 6, padding: '8px',
                background: 'rgba(18, 18, 22, 0.65)',
                backdropFilter: 'blur(24px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 999,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                pointerEvents: 'auto' // Re-enable clicks for the dock
              }}>
                <div style={{ opacity: unlockedWeapons.includes('scatter') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('scatter') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="scatter" active={selectedWeapon === 'scatter'} onClick={() => { if (settingsWeapon !== 'scatter') setSelectedWeapon(selectedWeapon === 'scatter' ? null : 'scatter'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'scatter'; setSettingsWeapon(open ? 'scatter' : null); if (open) setSelectedWeapon('scatter'); }} icon={<IconScatter />} label="SCATTER" />
                </div>
                <div style={{ opacity: unlockedWeapons.includes('artillery') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('artillery') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="artillery" active={selectedWeapon === 'artillery'} onClick={() => { if (settingsWeapon !== 'artillery') setSelectedWeapon(selectedWeapon === 'artillery' ? null : 'artillery'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'artillery'; setSettingsWeapon(open ? 'artillery' : null); if (open) setSelectedWeapon('artillery'); }} icon={<IconArtillery />} label="ARTILLERY" />
                </div>
                <div style={{ opacity: unlockedWeapons.includes('flyover') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('flyover') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="flyover" active={selectedWeapon === 'flyover'} onClick={() => { if (settingsWeapon !== 'flyover') setSelectedWeapon(selectedWeapon === 'flyover' ? null : 'flyover'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'flyover'; setSettingsWeapon(open ? 'flyover' : null); if (open) setSelectedWeapon('flyover'); }} icon={<IconFlyover />} label="FLYOVER" />
                </div>

                <div style={{ opacity: unlockedWeapons.includes('quake') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('quake') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="quake" active={selectedWeapon === 'quake'} onClick={() => { if (settingsWeapon !== 'quake') setSelectedWeapon(selectedWeapon === 'quake' ? null : 'quake'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'quake'; setSettingsWeapon(open ? 'quake' : null); if (open) setSelectedWeapon('quake'); }} icon={<IconQuake />} label="QUAKE" />
                </div>
                <div style={{ opacity: unlockedWeapons.includes('carpet') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('carpet') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="carpet" active={selectedWeapon === 'carpet'} onClick={() => { if (settingsWeapon !== 'carpet') setSelectedWeapon(selectedWeapon === 'carpet' ? null : 'carpet'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'carpet'; setSettingsWeapon(open ? 'carpet' : null); if (open) setSelectedWeapon('carpet'); }} icon={<IconCarpet />} label="CARPET" />
                </div>
                <div style={{ opacity: unlockedWeapons.includes('laser') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('laser') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="laser" active={selectedWeapon === 'laser'} onClick={() => { if (settingsWeapon !== 'laser') setSelectedWeapon(selectedWeapon === 'laser' ? null : 'laser'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'laser'; setSettingsWeapon(open ? 'laser' : null); if (open) setSelectedWeapon('laser'); }} icon={<IconLaser />} label="LASER" />
                </div>
                <div style={{ opacity: unlockedWeapons.includes('blackhole') ? 1 : 0.3, pointerEvents: unlockedWeapons.includes('blackhole') ? 'auto' : 'none' }}>
                  <WeaponButton weaponId="blackhole" active={selectedWeapon === 'blackhole'} onClick={() => { if (settingsWeapon !== 'blackhole') setSelectedWeapon(selectedWeapon === 'blackhole' ? null : 'blackhole'); }} onSecondaryClick={() => { const open = settingsWeapon !== 'blackhole'; setSettingsWeapon(open ? 'blackhole' : null); if (open) setSelectedWeapon('blackhole'); }} icon={<IconBlackhole />} label="BLACKHOLE" />
                </div>

                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 6px' }} />
                <button
                  onClick={() => {
                    if (unlockedWeapons.length > 1) {
                      setUnlockedWeapons(['scatter']);
                    } else {
                      setUnlockedWeapons(['scatter', 'artillery', 'flyover', 'quake', 'carpet', 'laser', 'blackhole']);
                    }
                    setSelectedWeapon('scatter');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                    borderRadius: 999, padding: '0 16px', cursor: 'pointer',
                    fontFamily: 'system-ui', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  {unlockedWeapons.length > 1 ? 'Lock' : 'Unlock'}
                </button>
              </div>
            </div>
          )}

          {/* ── Shape Library Panel — Hidden for Raid Mode ──────────────────────── */}



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
        height: isSidebarMin ? 44 : 'calc(100vh - 260px)',
        borderRadius: isSidebarMin ? 22 : 24,
        background: 'rgba(18, 18, 22, 0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: isSidebarMin ? 0 : '24px 20px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', backdropFilter: 'blur(40px) saturate(150%)', flexShrink: 0,
        transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
        color: '#ffffff',
        pointerEvents: (victoryStats || isBehindScenesActive) ? 'none' : 'auto',
        opacity: (victoryStats || isBehindScenesActive) ? 0 : 1,
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

            {renderEngine === 'gpu' && (
              <div className="apple-card">
                <div className="apple-card-title">OP Optimized Settings</div>
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Size</span>
                    <input type="range" min="0.1" max="5" step="0.1" value={gpuPartSize} onChange={(e) => setGpuPartSize(Number(e.target.value))} style={{ width: 60 }} />
                    <span style={{ fontSize: 11, color: '#0a84ff', fontWeight: 700, width: 24, textAlign: 'right' }}>{gpuPartSize.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Life</span>
                    <input type="range" min="0.1" max="5" step="0.1" value={gpuPartLife} onChange={(e) => setGpuPartLife(Number(e.target.value))} style={{ width: 60 }} />
                    <span style={{ fontSize: 11, color: '#0a84ff', fontWeight: 700, width: 24, textAlign: 'right' }}>{gpuPartLife.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Speed</span>
                    <input type="range" min="0.1" max="5" step="0.1" value={gpuPartSpeed} onChange={(e) => setGpuPartSpeed(Number(e.target.value))} style={{ width: 60 }} />
                    <span style={{ fontSize: 11, color: '#0a84ff', fontWeight: 700, width: 24, textAlign: 'right' }}>{gpuPartSpeed.toFixed(1)}</span>
                  </div>
                </>
              </div>
            )}

            {layoutTab === 'custom' && (<>
              {/* ── HEX ALTAR WORLD ── */}
              <div className="apple-card">
                <div className="apple-card-title">HEX ALTAR WORLD</div>
                <div style={{ fontSize: 11, color: '#99aabb', marginBottom: 12, lineHeight: 1.5 }}>
                  7 Altars · 5 slots each · Place energon cubes.<br />
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
                            onClick={() => setAltarOcclude(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                            style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: occluded ? '#333' : `${HEX_ALTAR_COLORS[i]}44`, color: '#fff', fontSize: 9, cursor: 'pointer' }}
                          >{occluded ? 'Disabled' : 'Active'}</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 9, color: '#9ca3af', width: 30 }}>GLOW</span>
                          <input type="range" min={0} max={4} step={0.05} value={altarGlow[i]}
                            onChange={e => setAltarGlow(prev => { const n = [...prev]; n[i] = Number(e.target.value); return n; })}
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
                  <CfgSlider label="Width" min={8} max={64} step={4} value={gridW} baseline={_defaultPreset.gridW} onChange={setGridW} />
                  <CfgSlider label="Height" min={8} max={64} step={4} value={gridH} baseline={_defaultPreset.gridH} onChange={setGridH} />
                  <CfgSlider label="Octaves" min={1} max={6} step={1} value={octaves} baseline={_defaultPreset.octaves} onChange={setOctaves} />
                  <CfgSlider label="Seed" min={1} max={999} step={1} value={seed} baseline={_defaultPreset.seed} onChange={setSeed} />
                </div>
              </div>

              {/* ── ELEVATION ── */}
              <div className="apple-card">
                <div className="apple-card-title">Elevation & Repair</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Max Height" min={2} max={8} step={1} value={maxElev} baseline={_defaultPreset.maxElev} onChange={setMaxElev} />
                  <CfgSlider label="Roughness" min={0.3} max={4} step={0.1} value={roughness} baseline={_defaultPreset.roughness} onChange={setRoughness} accent="#f97316" />
                  <CfgSlider label="Heal Speed" min={10} max={1000} step={10} value={regenSpeed} baseline={_defaultPreset.regenSpeed} onChange={setRegenSpeed} accent="#10b981" />
                  <CfgSlider label="Fade Speed" min={0.01} max={0.5} step={0.01} value={regenFadeSpeed} baseline={_defaultPreset.regenFadeSpeed} onChange={setRegenFadeSpeed} accent="#10b981" />
                </div>
              </div>

              {/* ── GLASS PROPERTIES ── */}
              <div className="apple-card">
                <div className="apple-card-title">Glass Properties</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Bevel" min={0.01} max={0.35} step={0.01} value={bevel} baseline={_defaultPreset.bevel} onChange={setBevel} />
                  <CfgSlider label="Roughness" min={0} max={1.0} step={0.01} value={matRoughness} baseline={_defaultPreset.matRoughness} onChange={setMatRoughness} accent="#7df" />
                  <CfgSlider label="Opacity" min={0.4} max={1.0} step={0.01} value={opacity} baseline={_defaultPreset.opacity} onChange={setOpacity} />
                  <CfgSlider label="Cube Jitter" min={0} max={1.0} step={0.01} value={cubeJitter} baseline={_defaultPreset.cubeJitter} onChange={setCubeJitter} accent="#7df" />
                  <CfgSlider label="Damage Emissive" min={0} max={20} step={0.1} value={damageEmissive} baseline={_defaultPreset.damageEmissive} onChange={setDamageEmissive} accent="#ef4444" />
                  <CfgSlider label="Damage Opacity" min={0} max={1} step={0.01} value={damageHalo} baseline={_defaultPreset.damageHalo} onChange={setDamageHalo} accent="#ef4444" />
                  <CfgSlider label="Base Glow" min={0} max={2} step={0.01} value={baseGlow} baseline={_defaultPreset.baseGlow} onChange={setBaseGlow} />

                  <CfgSlider label="Glow Fade" min={0.01} max={0.5} step={0.01} value={hoverFade} baseline={_defaultPreset.hoverFade} onChange={setHoverFade} />
                </div>
              </div>

              {/* ── TRANSMISSION ── */}
              {renderMode === 'glass' && (
                <div className="apple-card">
                  <div className="apple-card-title">Transmission</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <CfgSlider label="Transmit" min={0} max={1} step={0.01} value={matTransmit} baseline={_defaultPreset.matTransmit} onChange={setMatTransmit} accent="#06b6d4" />
                    <CfgSlider label="Thickness" min={0} max={5} step={0.05} value={matThickness} baseline={_defaultPreset.matThickness} onChange={setMatThickness} accent="#06b6d4" />
                    <CfgSlider label="IOR" min={1} max={2.5} step={0.01} value={matIor} baseline={_defaultPreset.matIor} onChange={setMatIor} accent="#06b6d4" />
                  </div>
                </div>
              )}

              {/* ── ENVIRONMENT LIGHTING ── */}
              <div className="apple-card">
                <div className="apple-card-title">Environment Lighting</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                  {([
                    { label: 'Morning', keyInt: 4.5, ambInt: 0.6, elev: 35, azim: 40, col: '#ffedd5', bg: '#081424', hemInt: 0.6 },
                    { label: 'Noon', keyInt: 6.5, ambInt: 0.4, elev: 85, azim: 0, col: '#ffffff', bg: '#020814', hemInt: 0.4 },
                    { label: 'Sunset', keyInt: 5.0, ambInt: 0.3, elev: 15, azim: 270, col: '#ff904f', bg: '#230b1c', hemInt: 0.5 },
                    { label: 'Midnight', keyInt: 1.5, ambInt: 0.1, elev: 45, azim: 120, col: '#a4b5f0', bg: '#01030a', hemInt: 0.2 },
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
                  <CfgSlider label="Key Light" min={0} max={20} step={0.1} value={keyLightInt} baseline={_defaultPreset.keyLightInt} onChange={setKeyLightInt} accent="#facc15" />
                  <CfgSlider label="Ambient" min={0} max={1.5} step={0.05} value={ambientInt} baseline={_defaultPreset.ambientInt} onChange={setAmbientInt} accent="#facc15" />
                  <CfgSlider label="Elevation" min={5} max={85} step={1} value={lightElev} baseline={_defaultPreset.lightElev} onChange={setLightElev} accent="#facc15" />
                  <CfgSlider label="Azimuth" min={0} max={360} step={1} value={lightAzimuth} baseline={_defaultPreset.lightAzimuth} onChange={setLightAzimuth} accent="#facc15" />
                </div>

                <div className="apple-card-title" style={{ marginTop: 24 }}>Key Color</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#ffffff', '#a8d8ff', '#ffd6aa', '#ffeaaa', '#c8aaff', '#aaffd6'].map(c => (
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
                    <CfgSlider label="Intensity" min={0} max={50} step={0.5} value={spotInt} onChange={setSpotInt} accent="#facc15" />
                    <CfgSlider label="Cone Angle" min={1} max={90} step={1} value={spotAngle} onChange={setSpotAngle} accent="#facc15" />
                    <CfgSlider label="Falloff" min={0} max={1} step={0.01} value={spotPenumbra} onChange={setSpotPenumbra} accent="#facc15" />
                  </div>
                )}
              </div>

              {/* ── SHADOWS ── */}
              <div className="apple-card">
                <div className="apple-card-title">Shadows</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Cast Opacity" min={0} max={1} step={0.01} value={shadowIntensity} baseline={_defaultPreset.shadowIntensity} onChange={setShadowIntensity} accent="#94a3b8" />
                  <CfgSlider label="Softness" min={1} max={16} step={1} value={shadowRadius} baseline={_defaultPreset.shadowRadius} onChange={setShadowRadius} accent="#94a3b8" />
                  <CfgSlider label="Bias" min={-0.01} max={0.002} step={0.0001} value={shadowBias} baseline={_defaultPreset.shadowBias} onChange={setShadowBias} accent="#94a3b8" />
                  <CfgSlider label="Normal Bias" min={0} max={0.5} step={0.005} value={shadowNormalBias} baseline={_defaultPreset.shadowNormalBias} onChange={setShadowNormalBias} accent="#94a3b8" />
                  <CfgSlider label="Fill Strength" min={0} max={1.5} step={0.02} value={hemIntensity} baseline={_defaultPreset.hemIntensity} onChange={setHemIntensity} accent="#94a3b8" />
                </div>
                <div className="apple-card-title" style={{ marginTop: 24 }}>Fill Color</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#0a0e2a', '#001a0a', '#1a0010', '#100a00', '#000d1a', '#1a1a00'].map(c => (
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
                    { label: 'Iso', elev: 35.26, azim: 45 },
                    { label: 'Dim', elev: 30, azim: 30 },
                    { label: 'Top', elev: 89, azim: 45 },
                    { label: 'Side', elev: 25, azim: 90 },
                    { label: 'Cinematic', elev: 22, azim: 20 },
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
                  <CfgSlider label="Elevation" min={5} max={89} step={0.5} value={camElev} onChange={setCamElev} accent="#67e8f9" />
                  <CfgSlider label="Azimuth" min={0} max={360} step={1} value={camAzimuth} onChange={setCamAzimuth} accent="#67e8f9" />
                  <CfgSlider label="Zoom" min={8} max={80} step={1} value={camZoom} onChange={setCamZoom} accent="#67e8f9" />
                </div>
              </div>

              {/* ── POST-PROCESSING ── */}
              <div className="apple-card">
                <div className="apple-card-title">Post-Processing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Bloom Strength"  min={0} max={0.5} step={0.005} value={bloomStr}    baseline={_defaultPreset.bloomStr} onChange={setBloomStr}    accent="#8b5cf6" />
                  <CfgSlider label="Bloom Threshold" min={0} max={1.0} step={0.01}  value={bloomThresh} baseline={_defaultPreset.bloomThresh} onChange={setBloomThresh} accent="#8b5cf6" />
                  <CfgSlider label="Block Glow Int." min={0} max={1.0} step={0.01}  value={glowInt}     baseline={_defaultPreset.glowInt} onChange={setGlowInt}     accent="#8b5cf6" />
                  


                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', marginTop: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>Particles Bloom Only</span>
                    <input type="checkbox" checked={bloomParticlesOnly} onChange={e => setBloomParticlesOnly(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#0a84ff', width: 16, height: 16 }} />
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  <CfgSlider label="Edge Blur" min={0} max={5} step={0.05} value={tiltBlur} onChange={setTiltBlur} accent="#8af" />
                  <CfgSlider label="Resolution" min={0.005} max={0.12} step={0.001} value={tiltSpread} onChange={setTiltSpread} accent="#8af" />
                  <CfgSlider label="Vignette" min={0} max={1} step={0.01} value={tiltVignette} onChange={setTiltVignette} accent="#8af" />
                </div>
                <div className="apple-card-title" style={{ marginTop: 24 }}>Vignette Color</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#000000', '#1a0000', '#001a00', '#00001a', '#1a1a00', '#1a001a'].map(c => (
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
                  <CfgSlider label="Size" min={0.1} max={4.0} step={0.05} value={sheepSize} onChange={setSheepSize} accent="#ffccaa" />
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
                  <CfgSlider label="Count" min={0} max={40} step={1} value={beaconCount} onChange={setBeaconCount} accent="#ff6b35" />
                  <CfgSlider label="Bury Depth" min={0} max={6} step={1} value={beaconBury} onChange={setBeaconBury} accent="#ff6b35" />
                  <CfgSlider label="Emissive" min={0.5} max={8} step={0.25} value={beaconEmissive} onChange={setBeaconEmissive} accent="#ff6b35" />
                  <CfgSlider label="Light Int" min={0} max={4} step={0.1} value={beaconLight} onChange={setBeaconLight} accent="#ff6b35" />
                  <CfgSlider label="Seed" min={1} max={100} step={1} value={beaconSeed} onChange={setBeaconSeed} accent="#ff6b35" />
                </div>
              </div>

              {/* ── ATMOSPHERE PARTICLES ── */}
              <div className="apple-card">
                <div className="apple-card-title">ATMOSPHERE PARTICLES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Engine Limit" min={1000} max={500000} step={1000} value={partLimit} onChange={setPartLimit} accent="#14b8a6" />
                  <CfgSlider label="Count" min={1} max={100000} step={1} value={partCount} onChange={setPartCount} accent="#14b8a6" />
                  <CfgSlider label="Size" min={0.1} max={5.0} step={0.1} value={partSize} onChange={setPartSize} accent="#14b8a6" />
                  <CfgSlider label="Speed" min={0} max={5} step={0.1} value={partSpeed} onChange={setPartSpeed} accent="#14b8a6" />
                  <CfgSlider label="Chance" min={0} max={1.0} step={0.05} value={partChance} onChange={setPartChance} accent="#14b8a6" />
                </div>
              </div>

              {/* ── LAYER COLORS ── */}
              <div className="apple-card">
                <div className="apple-card-title">LAYER COLORS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {layerColors.map((col, i) => {
                    const labels = ['Valley', 'Lowland', 'Mid', 'Highland', 'Peak'];
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
                  {['#1e7a8c', '#0d4a6a', '#2d6a4f', '#7b2d8b', '#8c4a1e', '#1a4a8c', '#6c757d'].map(c => (
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
            triggerFirework={triggerFirework}
          onRestart={() => {
            const { sheepCount, unlockedWeapons } = getWaveParams(1, difficultyRef.current);

            setVictoryStats(null);
            waveNumberRef.current = 1;
            shotsFiredRef.current = 0;
            sheepScoreRef.current = 0;
            totalKillsRef.current = 0;
            totalTimeRef.current = 0;
            gameStartTimeRef.current = Date.now();
            isTransitioningWaveRef.current = false;
            isGameOverRef.current = false;

            setUnlockedWeapons(unlockedWeapons);
            setSelectedWeapon(unlockedWeapons[0]);

            // Force a complete board heal!
            const emptySet = new Set<string>();
            brokenBlocksRef.current.clear();
            regeneratingBlocksRef.current.clear();

            if (weaponEngineRef.current) {
              weaponEngineRef.current.clearProjectiles();
            }

            // Start countdown via announceWave instead of instant spawn
            announceWave(1, sheepCount);

            if (renderMode === 'glass') {
              rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, emptySet);
            } else {
              rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, emptySet);
            }
          }}
        />
      )}
      {/* ── Mouse Cooldown Overlay ── */}
      <div
        id="mouse-cooldown-overlay"
        style={{
          position: 'fixed', top: 0, left: 0, width: 48, height: 48,
          pointerEvents: 'none', zIndex: 99999,
          transform: 'translate(-100px, -100px)',
          opacity: 0
        }}
      >
        <svg width="48" height="48">
          {/* Dark backdrop for visibility */}
          <circle id="mouse-cooldown-backdrop" cx="24" cy="24" r="21" fill="rgba(0, 0, 0, 0.5)" opacity="0" />
          {/* Background track */}
          <circle id="mouse-cooldown-bg-track" cx="24" cy="24" r="14" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" strokeDasharray="88" strokeDashoffset="88" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
          {/* Progress track */}
          <circle
            id="mouse-cooldown-circle"
            cx="24" cy="24" r="14" fill="none" stroke="#ffcc00" strokeWidth="3"
            strokeDasharray="88" strokeDashoffset="88"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
      </div>
    </div>
  );
}
