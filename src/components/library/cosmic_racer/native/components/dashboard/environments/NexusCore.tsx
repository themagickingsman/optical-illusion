"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const NexusMetaballs = dynamic(() => import("./NexusMetaballs"), { ssr: false });
const PixelSnow      = dynamic(() => import("./PixelSnow"),      { ssr: false });
import NexusAsteroids from "./NexusAsteroids";

const DEFAULT_LS_KEY = 'nexus-core-config';

interface NexusCoreProps {
  showControls?: boolean;
  storageKey?: string;   // Use a different key to isolate config per context
}

interface Config {
  // Background gradient
  bgCenterColor:    string;
  bgEdgeColor:      string;
  bgOpacity:        number;
  // CSS glow layer
  glowColor:        string;
  outerGlowColor:   string;   // separate colour for the outer halo bloom
  glowIntensity:    number;
  glowRadius:       number;
  outerRadius:      number;
  pulseSpeed:       number;
  starOpacity:      number;
  vignetteStrength: number;
  // WebGL orb — emission
  orbRadius:        number;
  coreIntensity:    number;
  haloIntensity:    number;
  atmoIntensity:    number;
  fresnelScale:     number;
  rimGlow:          number;      // inside+outside rim band
  outerRimGlow:     number;      // outside surface only
  orbColorHex:      string;
  // Hero orb background backlight
  backlightColor:    string;
  backlightStrength: number;
  backlightSpread:   number;
  // Center bloom (cursor glow reused as a static bloom at orb center)
  centerGlowColor:    string;
  centerGlowIntensity:number;
  centerGlowRadius:   number;
  // WebGL orb — lighting
  lightX:           number;
  lightY:           number;
  lightZ:           number;
  lightColorHex:    string;
  surfaceColorHex:  string;
  ambient:          number;
  diffuse:          number;
  specularInt:      number;
  specularPow:      number;
  fresnelPow:       number;
  // Satellites
  satelliteCount:   number;
  satelliteOrbit:   number;
  satelliteSize:    number;
  satelliteSpeed:   number;
  // Asteroid field — master
  showAsteroids:    boolean;
  asteroidOpacity:  number;
  // Asteroid front layer
  astFrontSpeed:    number;
  astFrontOpacity:  number;
  astFrontColor:    string;
  astFrontRot:      number;
  astFrontRotSpd:   number;
  astFrontGeomSeed: number;
  astFrontYOffset:  number;
  astFrontSizeScale: number;
  // Asteroid mid layer
  astMidSpeed:    number;
  astMidOpacity:  number;
  astMidColor:    string;
  astMidRot:      number;
  astMidRotSpd:   number;
  astMidGeomSeed: number;
  astMidYOffset:  number;
  astMidSizeScale: number;
  // Asteroid back layer
  astBackSpeed:    number;
  astBackOpacity:  number;
  astBackColor:    string;
  astBackRot:      number;
  astBackRotSpd:   number;
  astBackGeomSeed: number;
  astBackYOffset:  number;
  astBackSizeScale: number;
  // Star particles (PixelSnow)
  showStarParticles:  boolean;
  starPColor:         string;
  starPDensity:       number;
  starPSpeed:         number;
  starPBrightness:    number;
  starPSize:          number;
  starPDepthFade:     number;
  starPVariant:       'square' | 'round' | 'snowflake';
  starPDirection:     number;
  starPOpacity:       number;
  // WebGL rendering / performance
  renderScale:     number;   // 0.25–1.0 — lower = faster but blurrier
  canvasBlur:      number;   // CSS blur px to smooth low-res render
  sphereCount:     number;   // number of dynamic metaball satellites
  smoothness:      number;   // smin blend softness
  mergeDistance:   number;   // attractor merge radius
  contrast:        number;   // tone-mapping exponent
  fogDensity:      number;   // volumetric fog amount
  animationSpeed:  number;   // global animation speed multiplier
  movementScale:   number;   // orbit size multiplier
}

const DEFAULT: Config = {
  bgCenterColor:    '#ffd200',
  bgEdgeColor:      '#00b3d9',
  bgOpacity:        1.0,
  glowColor:        '#3b82f6',
  outerGlowColor:   '#3b82f6',
  glowIntensity:    3.0,
  glowRadius:       80,
  outerRadius:      340,
  pulseSpeed:       4,
  starOpacity:      0.9,
  vignetteStrength: 0,
  orbRadius:        0.45,
  coreIntensity:    2.0,
  haloIntensity:    0.9,
  atmoIntensity:    0.10,
  fresnelScale:     1.4,
  rimGlow:          0.0,
  outerRimGlow:     3.0,
  orbColorHex:      "#3b82f6",
  backlightColor:    "#1e7aff",
  backlightStrength: 1.0,
  backlightSpread:   900,
  centerGlowColor:    "#1e7aff",
  centerGlowIntensity: 0.0,   // off by default — enable to add a center bloom
  centerGlowRadius:    2.2,
  lightX:           0.0,
  lightY:           0.3,
  lightZ:           1.0,
  lightColorHex:    "#ccaaff",
  surfaceColorHex:  "#000010",
  ambient:          0.30,
  diffuse:          0.70,
  specularInt:      2.5,
  specularPow:      3,
  fresnelPow:       0.8,
  satelliteCount:   4,
  satelliteOrbit:   0.5,
  satelliteSize:    0.09,
  satelliteSpeed:   1.0,
  showAsteroids:    true,
  asteroidOpacity:  1.0,
  // Front layer
  astFrontSpeed:    1.0,
  astFrontOpacity:  0.90,
  astFrontColor:    '#1e293b',
  astFrontRot:      0,
  astFrontRotSpd:   1.0,
  astFrontGeomSeed: 0,
  astFrontYOffset:  0,
  astFrontSizeScale: 1.0,
  // Mid layer
  astMidSpeed:    1.0,
  astMidOpacity:  0.50,
  astMidColor:    '#0d1c38',
  astMidRot:      0,
  astMidRotSpd:   1.0,
  astMidGeomSeed: 0,
  astMidYOffset:  0,
  astMidSizeScale: 1.0,
  // Back layer
  astBackSpeed:    1.0,
  astBackOpacity:  0.28,
  astBackColor:    '#1a3260',
  astBackRot:      0,
  astBackRotSpd:   1.0,
  astBackGeomSeed: 0,
  astBackYOffset:  0,
  astBackSizeScale: 1.0,
  // Star particles
  showStarParticles: false,
  starPColor:        '#aac8ff',
  starPDensity:      0.18,
  starPSpeed:        0.6,
  starPBrightness:   1.2,
  starPSize:         0.008,
  starPDepthFade:    10,
  starPVariant:      'round' as const,
  starPDirection:    90,
  starPOpacity:      0.7,
  // WebGL rendering / performance (holographic preset defaults)
  renderScale:    0.55,
  canvasBlur:     1.5,
  sphereCount:    6,
  smoothness:     0.80,
  mergeDistance:  2.0,
  contrast:       1.6,
  fogDensity:     0.06,
  animationSpeed: 0.6,
  movementScale:  1.6,
};

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  return {
    r: parseInt(c.slice(0, 2), 16) / 255,
    g: parseInt(c.slice(2, 4), 16) / 255,
    b: parseInt(c.slice(4, 6), 16) / 255,
    css: `${parseInt(c.slice(0, 2), 16)}, ${parseInt(c.slice(2, 4), 16)}, ${parseInt(c.slice(4, 6), 16)}`,
  };
}

/** Merge saved localStorage data with DEFAULT so new fields are never undefined. */
function loadSaved(key: string): Config {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULT };
}

// ── Built-in presets (always available) ──────────────────────────────
// (defined outside component so they share identity across renders)
const BUILT_IN_PRESETS: Array<{ name: string; config: Partial<Config> }> = [
  { name: '🔵 Blue Nebula', config: {
      bgCenterColor:'#0d1b4f', bgEdgeColor:'#020c1f', bgOpacity:1.0,
      glowColor:'#3b82f6', outerGlowColor:'#1d4ed8', glowIntensity:3.5, glowRadius:80, outerRadius:380,
      orbColorHex:'#60a5fa', orbRadius:0.45, coreIntensity:2.5, haloIntensity:1.1, atmoIntensity:0.10,
      lightColorHex:'#88aaff', ambient:0.30, diffuse:0.70, specularInt:2.5, specularPow:3,
      backlightColor:'#1e7aff', backlightStrength:1.0, backlightSpread:900, centerGlowIntensity:0.0, satelliteCount:4,
  }},
  { name: '🔥 Solar Flare', config: {
      bgCenterColor:'#ff8c00', bgEdgeColor:'#1a0500', bgOpacity:0.85,
      glowColor:'#f97316', outerGlowColor:'#ea580c', glowIntensity:4.0, glowRadius:100, outerRadius:400,
      orbColorHex:'#fdba74', orbRadius:0.48, coreIntensity:2.8, haloIntensity:1.2, atmoIntensity:0.15,
      lightColorHex:'#ffcc88', ambient:0.35, diffuse:0.80, specularInt:3.0, specularPow:3,
      backlightColor:'#ff8800', backlightStrength:1.2, backlightSpread:1000,
      centerGlowColor:'#ffdd00', centerGlowIntensity:0.4, centerGlowRadius:3.0, satelliteCount:4,
  }},
  { name: '🌿 Aurora', config: {
      bgCenterColor:'#002233', bgEdgeColor:'#000d14', bgOpacity:1.0,
      glowColor:'#06b6d4', outerGlowColor:'#0891b2', glowIntensity:3.0, glowRadius:75, outerRadius:360,
      orbColorHex:'#67e8f9', orbRadius:0.42, coreIntensity:2.2, haloIntensity:0.9, atmoIntensity:0.10,
      lightColorHex:'#88ffee', ambient:0.30, diffuse:0.70, specularInt:2.0, specularPow:3,
      backlightColor:'#00ccaa', backlightStrength:0.9, backlightSpread:850, centerGlowIntensity:0.0, satelliteCount:4,
  }},
  { name: '🌌 Deep Void', config: {
      bgCenterColor:'#0a0015', bgEdgeColor:'#030006', bgOpacity:1.0,
      glowColor:'#7c3aed', outerGlowColor:'#4c1d95', glowIntensity:2.5, glowRadius:65, outerRadius:300,
      orbColorHex:'#a78bfa', orbRadius:0.40, coreIntensity:1.8, haloIntensity:0.7, atmoIntensity:0.08,
      lightColorHex:'#bb99ff', ambient:0.25, diffuse:0.65, specularInt:2.0, specularPow:3,
      backlightColor:'#6600ff', backlightStrength:0.7, backlightSpread:700, centerGlowIntensity:0.0, satelliteCount:3,
  }},
  { name: '🌸 Cosmic Rose', config: {
      bgCenterColor:'#3d0028', bgEdgeColor:'#100010', bgOpacity:1.0,
      glowColor:'#ec4899', outerGlowColor:'#be185d', glowIntensity:3.2, glowRadius:85, outerRadius:350,
      orbColorHex:'#f9a8d4', orbRadius:0.43, coreIntensity:2.3, haloIntensity:1.0, atmoIntensity:0.12,
      lightColorHex:'#ffb3c8', ambient:0.30, diffuse:0.72, specularInt:2.5, specularPow:3,
      backlightColor:'#ff1493', backlightStrength:0.9, backlightSpread:800,
      centerGlowColor:'#ff69b4', centerGlowIntensity:0.3, centerGlowRadius:2.5, satelliteCount:4,
  }},
  { name: '⚡ Neon Storm', config: {
      bgCenterColor:'#001a1a', bgEdgeColor:'#000808', bgOpacity:1.0,
      glowColor:'#00ffcc', outerGlowColor:'#00cc99', glowIntensity:5.0, glowRadius:90, outerRadius:420,
      orbColorHex:'#00fff7', orbRadius:0.44, coreIntensity:3.0, haloIntensity:1.3, atmoIntensity:0.20,
      lightColorHex:'#00ffaa', ambient:0.25, diffuse:0.85, specularInt:3.5, specularPow:3,
      backlightColor:'#00ffcc', backlightStrength:1.5, backlightSpread:1100,
      centerGlowColor:'#00ffff', centerGlowIntensity:0.5, centerGlowRadius:2.8, satelliteCount:5,
  }},
];

export default function NexusCore({ showControls = true, storageKey = DEFAULT_LS_KEY }: NexusCoreProps) {
  const [cfg, setCfg] = useState<Config>(() => loadSaved(storageKey));
  const [panelOpen, setPanelOpen] = useState(true);
  const [fps, setFps] = useState(0);
  const [saved, setSaved] = useState(false);
  const fpsRef = useRef({ frames: 0, last: performance.now() });
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  // ── Preset management ────────────────────────────────────────────────
  const presetsKey = `nexus-presets-${storageKey}`;
  const [userPresets, setUserPresets] = useState<Array<{name:string;config:Config}>>(() => {
    try { const r = localStorage.getItem(presetsKey); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [newPresetName, setNewPresetName] = useState('');

  const applyPreset = useCallback((partial: Partial<Config>) => {
    setCfg(prev => ({ ...prev, ...partial }));
  }, []);

  const saveUserPreset = useCallback((name: string) => {
    const updated = [...userPresets.filter(p => p.name !== name), { name, config: { ...cfgRef.current } }];
    setUserPresets(updated);
    try { localStorage.setItem(presetsKey, JSON.stringify(updated)); } catch {}
  }, [userPresets, presetsKey]);

  const deleteUserPreset = useCallback((name: string) => {
    const updated = userPresets.filter(p => p.name !== name);
    setUserPresets(updated);
    try { localStorage.setItem(presetsKey, JSON.stringify(updated)); } catch {}
  }, [userPresets, presetsKey]);

  // Re-read config when an external writer (e.g. mobile build panel) updates the same key
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try { setCfg(prev => ({ ...prev, ...JSON.parse(e.newValue!) })); } catch(_) {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [storageKey]);

  const set = useCallback(<K extends keyof Config>(key: K, val: Config[K]) =>
    setCfg(prev => ({ ...prev, [key]: val })), []);

  // Build the full dispatch payload from current config
  const buildPayload = useCallback((c: Config) => {
    // glowColor drives both CSS rings AND the WebGL orb colour
    const orb   = hexToRgb(c.glowColor);
    const light  = hexToRgb(c.lightColorHex);
    const surf   = hexToRgb(c.surfaceColorHex);
    return {
      heroOrbRadius:     c.orbRadius,
      heroCoreIntensity: c.coreIntensity,
      heroHaloIntensity: c.haloIntensity,
      heroAtmoIntensity: c.atmoIntensity,
      heroFresnelScale:  c.fresnelScale,
      heroRimGlow:       c.rimGlow,
      heroOuterRimGlow:  c.outerRimGlow,
      heroOrbColorR:     orb.r,
      heroOrbColorG:     orb.g,
      heroOrbColorB:     orb.b,
      // Backlight bloom behind the orb
      heroBacklightColorR:  hexToRgb(c.backlightColor ?? '#1e7aff').r,
      heroBacklightColorG:  hexToRgb(c.backlightColor ?? '#1e7aff').g,
      heroBacklightColorB:  hexToRgb(c.backlightColor ?? '#1e7aff').b,
      heroBacklightStrength: c.backlightStrength ?? 1.0,
      heroBacklightSpread:   c.backlightSpread   ?? 900,
      // Center bloom
      centerGlowColorR: hexToRgb(c.centerGlowColor ?? '#1e7aff').r,
      centerGlowColorG: hexToRgb(c.centerGlowColor ?? '#1e7aff').g,
      centerGlowColorB: hexToRgb(c.centerGlowColor ?? '#1e7aff').b,
      centerGlowIntensity: c.centerGlowIntensity ?? 0.0,
      centerGlowRadius:    c.centerGlowRadius    ?? 2.2,
      // Tint the 3D surface colour to match orb emission — scaled down
      // so specular highlights still read clearly against the surface.
      sphereColorR:      orb.r * 0.18,
      sphereColorG:      orb.g * 0.18,
      sphereColorB:      orb.b * 0.18,
      lightPositionX:    c.lightX,
      lightPositionY:    c.lightY,
      lightPositionZ:    c.lightZ,
      lightColorR:       light.r,
      lightColorG:       light.g,
      lightColorB:       light.b,
      // Surface colour is now derived from orbColorHex above; surfaceColorHex
      // can still be used to override via the Lighting section.
      ambientIntensity:  c.ambient,
      diffuseIntensity:  c.diffuse,
      specularIntensity: c.specularInt,
      specularPower:     c.specularPow,
      fresnelPower:      c.fresnelPow,
      satelliteCount:       c.satelliteCount,
      satelliteOrbitScale:  c.satelliteOrbit,
      satelliteSize:        c.satelliteSize,
      satelliteSpeed:       c.satelliteSpeed,
      // Rendering / performance
      renderScale:    c.renderScale    ?? 0.55,
      canvasBlur:     c.canvasBlur     ?? 1.5,
      sphereCount:    c.sphereCount    ?? 6,
      smoothness:     c.smoothness     ?? 0.80,
      mergeDistance:  c.mergeDistance  ?? 2.0,
      contrast:       c.contrast       ?? 1.6,
      fogDensity:     c.fogDensity     ?? 0.06,
      animationSpeed: c.animationSpeed ?? 0.6,
      movementScale:  c.movementScale  ?? 1.6,
    };
  }, []);

  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cfgRef.current));
      // Notify other instances watching the same key
      window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: JSON.stringify(cfgRef.current) }));
    } catch (_) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [storageKey]);

  const applyToArena = useCallback(() => {
    window.dispatchEvent(new CustomEvent('nexus-arena-apply', {
      detail: buildPayload(cfgRef.current)
    }));
  }, [buildPayload]);


  // ── FPS counter ─────────────────────────────────────────────────
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      fpsRef.current.frames++;
      if (now - fpsRef.current.last >= 500) {
        setFps(Math.round((fpsRef.current.frames / (now - fpsRef.current.last)) * 1000));
        fpsRef.current = { frames: 0, last: now };
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Listen for NexusMetaballs ready signal, then push full config ─
  useEffect(() => {
    const onReady = () => {
      // Small delay so the WebGL uniform setup completes first
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nexus-arena-apply', {
          detail: buildPayload(cfgRef.current)
        }));
      }, 80);
    };
    window.addEventListener('nexus-metaballs-ready', onReady);
    return () => window.removeEventListener('nexus-metaballs-ready', onReady);
  }, [buildPayload]);

  // ── Push updates whenever any config value changes ───────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexus-arena-apply', {
      detail: buildPayload(cfg)
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.orbRadius, cfg.coreIntensity, cfg.haloIntensity, cfg.atmoIntensity,
      cfg.fresnelScale, cfg.rimGlow, cfg.outerRimGlow,
      cfg.glowColor,   // glowColor now drives WebGL orb colour
      cfg.lightX, cfg.lightY, cfg.lightZ, cfg.lightColorHex,
      cfg.surfaceColorHex, cfg.ambient, cfg.diffuse,
      cfg.specularInt, cfg.specularPow, cfg.fresnelPow,
      cfg.satelliteCount, cfg.satelliteOrbit,
      cfg.backlightColor, cfg.backlightStrength, cfg.backlightSpread,
      cfg.centerGlowColor, cfg.centerGlowIntensity, cfg.centerGlowRadius,
      cfg.renderScale, cfg.canvasBlur, cfg.sphereCount, cfg.smoothness,
      cfg.mergeDistance, cfg.contrast, cfg.fogDensity, cfg.animationSpeed, cfg.movementScale]);

  const glowRgb = hexToRgb(cfg.glowColor).css;
  const pulse = cfg.pulseSpeed > 0;
  const fpsColor = fps >= 55 ? "#4ade80" : fps >= 30 ? "#facc15" : "#f87171";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>

      <style>{`
        @keyframes ncPulse { 0%,100%{opacity:.80;transform:translate(-50%,-50%) scale(1.00)} 50%{opacity:1.00;transform:translate(-50%,-50%) scale(1.09)} }
        @keyframes ncRing  { 0%,100%{opacity:.40;transform:translate(-50%,-50%) scale(1.00)} 50%{opacity:.80;transform:translate(-50%,-50%) scale(1.13)} }
      `}</style>

      {/* Star field */}
      <div style={{ position:"absolute", inset:0, opacity:cfg.starOpacity, background:
        "radial-gradient(1px 1px at 8% 12%, rgba(200,225,255,.65) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 92% 7%, rgba(180,215,255,.50) 0%,transparent 100%)," +
        "radial-gradient(1.5px 1.5px at 31% 68%, rgba(210,235,255,.45) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 65% 38%, rgba(170,205,255,.55) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 75% 82%, rgba(185,220,255,.40) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 4% 52%, rgba(200,230,255,.38) 0%,transparent 100%)," +
        "radial-gradient(1.5px 1.5px at 89% 44%, rgba(165,205,255,.48) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 50% 90%, rgba(180,218,255,.30) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 22% 33%, rgba(205,232,255,.35) 0%,transparent 100%)," +
        "radial-gradient(1px 1px at 70% 11%, rgba(160,205,255,.58) 0%,transparent 100%)" }} />

      {/* Edge vignette */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        boxShadow:`inset 0 0 ${Math.round(200*cfg.vignetteStrength)}px rgba(15,60,200,${(0.38*cfg.vignetteStrength).toFixed(2)}), inset 0 0 ${Math.round(90*cfg.vignetteStrength)}px rgba(8,35,160,${(0.25*cfg.vignetteStrength).toFixed(2)})` }} />

      {/* WebGL hero orb — canvas z:1 */}
      <NexusMetaballs showUI={false} heroOrbOnly={true} />

      {/* Star particles — PixelSnow layer above orb, below gradient */}
      {cfg.showStarParticles && (
        <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none', opacity: cfg.starPOpacity ?? 0.7 }}>
          <PixelSnow
            color={cfg.starPColor}
            density={cfg.starPDensity}
            speed={cfg.starPSpeed}
            brightness={cfg.starPBrightness}
            flakeSize={cfg.starPSize}
            depthFade={cfg.starPDepthFade}
            variant={cfg.starPVariant}
            direction={cfg.starPDirection}
            style={{ width:'100%', height:'100%' }}
          />
        </div>
      )}

      {/* Background gradient — rendered ABOVE canvas so it's always visible.
          mix-blend-mode:screen composites it with the WebGL orb without hiding it. */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: `radial-gradient(circle at 50% 50%, ${cfg.bgCenterColor} 0%, ${cfg.bgEdgeColor} 100%)`,
        opacity: cfg.bgOpacity,
        mixBlendMode: 'screen',
      }} />

      {/* Asteroid field — 3 parallax layers */}
      {cfg.showAsteroids && (
        <NexusAsteroids
          fieldOpacity={cfg.asteroidOpacity ?? 1}
          orbColor={cfg.glowColor}
          layers="all"
          front={{
            color:        cfg.astFrontColor,
            speed:        cfg.astFrontSpeed,
            opacity:      cfg.astFrontOpacity,
            rotation:     cfg.astFrontRot,
            rotSpeed:     cfg.astFrontRotSpd,
            geometrySeed: cfg.astFrontGeomSeed,
            yOffset:      cfg.astFrontYOffset,
            sizeScale:    cfg.astFrontSizeScale,
          }}
          mid={{
            color:        cfg.astMidColor,
            speed:        cfg.astMidSpeed,
            opacity:      cfg.astMidOpacity,
            rotation:     cfg.astMidRot,
            rotSpeed:     cfg.astMidRotSpd,
            geometrySeed: cfg.astMidGeomSeed,
            yOffset:      cfg.astMidYOffset,
            sizeScale:    cfg.astMidSizeScale,
          }}
          back={{
            color:        cfg.astBackColor,
            speed:        cfg.astBackSpeed,
            opacity:      cfg.astBackOpacity,
            rotation:     cfg.astBackRot,
            rotSpeed:     cfg.astBackRotSpd,
            geometrySeed: cfg.astBackGeomSeed,
            yOffset:      cfg.astBackYOffset,
            sizeScale:    cfg.astBackSizeScale,
          }}
        />
      )}

      {/* CSS glow — outer halo (separate colour from core glow) */}
      {(() => { const outerRgb = hexToRgb(cfg.outerGlowColor ?? cfg.glowColor).css; return (
      <div style={{ position:"absolute", left:"50%", top:"50%",
        width:`${cfg.outerRadius*2}px`, height:`${cfg.outerRadius*2}px`,
        transform:"translate(-50%,-50%)", borderRadius:"50%",
        background:`radial-gradient(circle at 50% 46%,rgba(${outerRgb},${(0.28*cfg.glowIntensity/3).toFixed(2)}) 0%,rgba(${outerRgb},${(0.14*cfg.glowIntensity/3).toFixed(2)}) 40%,transparent 72%)`,
        filter:`blur(${Math.round(cfg.outerRadius*0.12)}px)`,
        animation:pulse?`ncPulse ${cfg.pulseSpeed}s ease-in-out infinite`:"none",
        pointerEvents:"none" }} />); })()}

      {/* CSS glow — inner core */}
      <div style={{ position:"absolute", left:"50%", top:"50%",
        width:`${cfg.glowRadius*2}px`, height:`${cfg.glowRadius*2}px`,
        transform:"translate(-50%,-50%)", borderRadius:"50%",
        background:`radial-gradient(circle at 50% 42%,rgba(${glowRgb},${Math.min(1,0.60*cfg.glowIntensity/3).toFixed(2)}) 0%,rgba(${glowRgb},${Math.min(1,0.30*cfg.glowIntensity/3).toFixed(2)}) 55%,transparent 85%)`,
        filter:`blur(${Math.round(cfg.glowRadius*0.15)}px)`,
        boxShadow:`0 0 ${Math.round(cfg.glowRadius*0.8*cfg.glowIntensity)}px ${Math.round(cfg.glowRadius*0.3)}px rgba(${glowRgb},${Math.min(0.95,0.55*cfg.glowIntensity/3).toFixed(2)}),0 0 ${Math.round(cfg.outerRadius*0.6*cfg.glowIntensity)}px ${Math.round(cfg.outerRadius*0.25)}px rgba(${glowRgb},${Math.min(0.5,0.20*cfg.glowIntensity/3).toFixed(2)})`,
        animation:pulse?`ncPulse ${cfg.pulseSpeed}s ease-in-out infinite`:"none",
        pointerEvents:"none" }} />

      {/* CSS glow — ring */}
      <div style={{ position:"absolute", left:"50%", top:"50%",
        width:`${cfg.glowRadius*2.8}px`, height:`${cfg.glowRadius*2.8}px`,
        transform:"translate(-50%,-50%)", borderRadius:"50%",
        border:`1.5px solid rgba(${glowRgb},0.35)`,
        boxShadow:`0 0 ${Math.round(28*cfg.glowIntensity/3)}px ${Math.round(8*cfg.glowIntensity/3)}px rgba(${glowRgb},.30),inset 0 0 ${Math.round(28*cfg.glowIntensity/3)}px ${Math.round(8*cfg.glowIntensity/3)}px rgba(${glowRgb},.15)`,
        animation:pulse?`ncRing ${cfg.pulseSpeed}s ease-in-out infinite`:"none",
        pointerEvents:"none" }} />

      {/* FPS */}
      {showControls && (
        <div style={{ position:"absolute", top:16, right:16, zIndex:1001,
          fontFamily:"Orbitron,monospace", fontSize:13, fontWeight:700,
          color:fpsColor, background:"rgba(0,0,0,.55)",
          border:`1px solid ${fpsColor}44`, borderRadius:8,
          padding:"4px 12px", letterSpacing:1,
          boxShadow:`0 0 12px ${fpsColor}33` }}>
          {fps} FPS
        </div>
      )}

      {/* Controls panel */}
      {showControls && (
        <div style={{ position:"absolute", bottom:24, right:16, zIndex:1000,
          width:panelOpen?296:"auto", fontFamily:"Orbitron,monospace" }}>

          <button onClick={() => setPanelOpen(p=>!p)} style={{
            display:"block", marginLeft:"auto", marginBottom:panelOpen?8:0,
            padding:"5px 14px", background:"rgba(0,0,0,.7)",
            border:`1px solid ${cfg.glowColor}`, borderRadius:20,
            color:cfg.glowColor, fontSize:11, letterSpacing:1, cursor:"pointer",
            boxShadow:`0 0 12px rgba(${glowRgb},.4)` }}>
            {panelOpen?"▼ NEXUS CORE":"▲ NEXUS CORE"}
          </button>

          {panelOpen && (
            <div style={{ background:"rgba(2,8,24,.92)", border:`1px solid rgba(${glowRgb},.28)`,
              borderRadius:12, padding:"14px 16px",
              boxShadow:`0 0 28px rgba(${glowRgb},.16)`, backdropFilter:"blur(16px)",
              display:"flex", flexDirection:"column", gap:10,
              maxHeight:"76vh", overflowY:"auto" }}>

              {/* ── BACKGROUND GRADIENT ── */}
              <Divider label="BG GRADIENT" color="#fbbf24" />
              <ColorRow label="Center Color" value={cfg.bgCenterColor} color="#fbbf24" onChange={v=>set("bgCenterColor",v)} />
              <ColorRow label="Edge Color"   value={cfg.bgEdgeColor}   color="#22d3ee" onChange={v=>set("bgEdgeColor",v)} />
              <Slider label="Opacity" value={cfg.bgOpacity} min={0} max={1} step={.05} color="#fbbf24" display={Math.round(cfg.bgOpacity*100)+"%"} onChange={v=>set("bgOpacity",v)} />

              {/* ── CSS GLOW ── */}
              <Divider label="ORB COLOR + CSS GLOW" color={cfg.glowColor} />
              <ColorRow label="Core Glow Color"  value={cfg.glowColor}      color={cfg.glowColor}      onChange={v=>set("glowColor",v)} />
              <ColorRow label="Outer Halo Color" value={cfg.outerGlowColor ?? cfg.glowColor} color="#a78bfa" onChange={v=>set("outerGlowColor",v)} />
              <Slider label="Intensity"    value={cfg.glowIntensity}    min={0}  max={5}    step={.1}  color={cfg.glowColor} display={cfg.glowIntensity.toFixed(1)+"x"} onChange={v=>set("glowIntensity",v)} />
              <Slider label="Core Radius"  value={cfg.glowRadius}       min={20} max={220}  step={4}   color={cfg.glowColor} display={cfg.glowRadius+"px"} onChange={v=>set("glowRadius",v)} />
              <Slider label="Halo Spread"  value={cfg.outerRadius}      min={50} max={900}  step={10}  color="#a78bfa" display={cfg.outerRadius+"px"} onChange={v=>set("outerRadius",v)} />
              <Slider label="Pulse Speed"  value={cfg.pulseSpeed}       min={0}  max={10}   step={.5}  color={cfg.glowColor} display={cfg.pulseSpeed===0?"OFF":cfg.pulseSpeed+"s"} onChange={v=>set("pulseSpeed",v)} />
              <Slider label="Stars"        value={cfg.starOpacity}      min={0}  max={1}    step={.05} color={cfg.glowColor} display={Math.round(cfg.starOpacity*100)+"%"} onChange={v=>set("starOpacity",v)} />
              <Slider label="Vignette"     value={cfg.vignetteStrength} min={0}  max={1}    step={.05} color={cfg.glowColor} display={Math.round(cfg.vignetteStrength*100)+"%"} onChange={v=>set("vignetteStrength",v)} />

              {/* ── ORB BACKLIGHT ── */}
              <Divider label="ORB BACKLIGHT BLOOM" color="#a78bfa" />
              <ColorRow label="Backlight Color"    value={cfg.backlightColor ?? '#1e7aff'} color="#a78bfa" onChange={v=>set("backlightColor",v)} />
              <Slider label="Backlight Strength" value={cfg.backlightStrength ?? 1.0} min={0} max={3}    step={0.05} color="#a78bfa" display={(cfg.backlightStrength ?? 1).toFixed(2)+"x"} onChange={v=>set("backlightStrength",v)} />
              <Slider label="Backlight Spread"   value={cfg.backlightSpread   ?? 900}  min={0} max={2000} step={50}  color="#a78bfa" display={(cfg.backlightSpread ?? 900)+"px"} onChange={v=>set("backlightSpread",v)} />

              {/* ── CENTER BLOOM ── */}
              <Divider label="CENTER BLOOM" color="#f472b6" />
              <ColorRow label="Bloom Color"     value={cfg.centerGlowColor ?? '#1e7aff'} color="#f472b6" onChange={v=>set("centerGlowColor",v)} />
              <Slider label="Bloom Intensity" value={cfg.centerGlowIntensity ?? 0.0} min={0} max={3}    step={0.05} color="#f472b6" display={(cfg.centerGlowIntensity ?? 0).toFixed(2)+"x"} onChange={v=>set("centerGlowIntensity",v)} />
              <Slider label="Bloom Radius"    value={cfg.centerGlowRadius    ?? 2.2} min={0.2} max={6}  step={0.1}  color="#f472b6" display={(cfg.centerGlowRadius ?? 2.2).toFixed(1)} onChange={v=>set("centerGlowRadius",v)} />

              {/* ── ORB EMISSION ── */}
              <Divider label="ORB EMISSION" color="#60a5fa" />
              <ColorRow label="Orb Color"    value={cfg.orbColorHex} color="#60a5fa" onChange={v=>set("orbColorHex",v)} />
              <Slider label="Orb Radius"     value={cfg.orbRadius}      min={.05} max={1.5} step={.01} color="#60a5fa" display={cfg.orbRadius.toFixed(2)} onChange={v=>set("orbRadius",v)} />
              <Slider label="Core"           value={cfg.coreIntensity}  min={0}   max={6}   step={.1}  color="#60a5fa" display={cfg.coreIntensity.toFixed(1)+"x"} onChange={v=>set("coreIntensity",v)} />
              <Slider label="Halo"           value={cfg.haloIntensity}  min={0}   max={3}   step={.05} color="#60a5fa" display={cfg.haloIntensity.toFixed(2)+"x"} onChange={v=>set("haloIntensity",v)} />
              <Slider label="Atmosphere"     value={cfg.atmoIntensity}  min={0}   max={1}   step={.01} color="#60a5fa" display={cfg.atmoIntensity.toFixed(2)+"x"} onChange={v=>set("atmoIntensity",v)} />
              <Slider label="Fresnel Emit"   value={cfg.fresnelScale}   min={0}   max={6}   step={.1}  color="#60a5fa" display={cfg.fresnelScale.toFixed(1)+"x"} onChange={v=>set("fresnelScale",v)} />
              <Slider label="Rim (both)"     value={cfg.rimGlow}        min={0}   max={12}  step={.25} color="#60a5fa" display={cfg.rimGlow.toFixed(1)+"x"} onChange={v=>set("rimGlow",v)} />
              <Slider label="Rim (outside)"  value={cfg.outerRimGlow}   min={0}   max={12}  step={.25} color="#93c5fd" display={cfg.outerRimGlow.toFixed(1)+"x"} onChange={v=>set("outerRimGlow",v)} />

              {/* ── LIGHTING ── */}
              <Divider label="LIGHTING" color="#f59e0b" />
              <ColorRow label="Light Color"   value={cfg.lightColorHex}   color="#f59e0b" onChange={v=>set("lightColorHex",v)} />
              <ColorRow label="Surface Color" value={cfg.surfaceColorHex} color="#f59e0b" onChange={v=>set("surfaceColorHex",v)} />
              <Slider label="Light X"    value={cfg.lightX}      min={-2}  max={2}  step={.05} color="#f59e0b" display={cfg.lightX.toFixed(2)} onChange={v=>set("lightX",v)} />
              <Slider label="Light Y"    value={cfg.lightY}      min={-2}  max={2}  step={.05} color="#f59e0b" display={cfg.lightY.toFixed(2)} onChange={v=>set("lightY",v)} />
              <Slider label="Light Z"    value={cfg.lightZ}      min={.1}  max={3}  step={.05} color="#f59e0b" display={cfg.lightZ.toFixed(2)} onChange={v=>set("lightZ",v)} />
              <Slider label="Ambient"    value={cfg.ambient}     min={0}   max={1}  step={.01} color="#f59e0b" display={(cfg.ambient*100).toFixed(0)+"%"} onChange={v=>set("ambient",v)} />
              <Slider label="Diffuse"    value={cfg.diffuse}     min={0}   max={2}  step={.05} color="#f59e0b" display={cfg.diffuse.toFixed(2)+"x"} onChange={v=>set("diffuse",v)} />
              <Slider label="Specular"   value={cfg.specularInt} min={0}   max={5}  step={.1}  color="#f59e0b" display={cfg.specularInt.toFixed(1)+"x"} onChange={v=>set("specularInt",v)} />
              <Slider label="Spec Power" value={cfg.specularPow} min={1}   max={32} step={1}   color="#f59e0b" display={cfg.specularPow.toFixed(0)} onChange={v=>set("specularPow",v)} />
              <Slider label="Fresnel Pw" value={cfg.fresnelPow}  min={.1}  max={4}  step={.05} color="#f59e0b" display={cfg.fresnelPow.toFixed(2)} onChange={v=>set("fresnelPow",v)} />

              {/* ── STAR PARTICLES ── */}
              <Divider label="✨ STAR PARTICLES" color="#c4b5fd" />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:"#a78bfa", letterSpacing:1, textTransform:"uppercase" }}>Visible</span>
                <button onClick={() => set("showStarParticles", !cfg.showStarParticles)} style={{
                  padding:"3px 12px", fontSize:10, letterSpacing:1, cursor:"pointer",
                  borderRadius:6, background:cfg.showStarParticles?"rgba(167,139,250,.25)":"rgba(255,255,255,.08)",
                  border:`1px solid rgba(167,139,250,${cfg.showStarParticles?.5:.2})`,
                  color:cfg.showStarParticles?"#c4b5fd":"#475569", transition:"all .2s" }}>
                  {cfg.showStarParticles ? "ON" : "OFF"}
                </button>
              </div>
              {cfg.showStarParticles && <>
                <ColorRow label="Color"      value={cfg.starPColor}    color="#c4b5fd" onChange={v=>set("starPColor",v)} />
                <Slider label="Opacity"      value={cfg.starPOpacity}     min={0}    max={1}   step={.05}  color="#c4b5fd" display={Math.round(cfg.starPOpacity*100)+"%"}       onChange={v=>set("starPOpacity",v)} />
                <Slider label="Density"      value={cfg.starPDensity}     min={0.01} max={0.8} step={.01}  color="#c4b5fd" display={cfg.starPDensity.toFixed(2)}               onChange={v=>set("starPDensity",v)} />
                <Slider label="Speed"        value={cfg.starPSpeed}       min={0}    max={5}   step={.05}  color="#c4b5fd" display={cfg.starPSpeed.toFixed(2)+"x"}             onChange={v=>set("starPSpeed",v)} />
                <Slider label="Brightness"   value={cfg.starPBrightness}  min={0}    max={5}   step={.05}  color="#c4b5fd" display={cfg.starPBrightness.toFixed(2)+"x"}        onChange={v=>set("starPBrightness",v)} />
                <Slider label="Flake Size"   value={cfg.starPSize}        min={0.001}max={0.05}step={.001} color="#c4b5fd" display={cfg.starPSize.toFixed(3)}                  onChange={v=>set("starPSize",v)} />
                <Slider label="Depth Fade"   value={cfg.starPDepthFade}   min={1}    max={30}  step={0.5}  color="#c4b5fd" display={cfg.starPDepthFade.toFixed(1)}             onChange={v=>set("starPDepthFade",v)} />
                <Slider label="Direction°"   value={cfg.starPDirection}   min={0}    max={360} step={5}    color="#c4b5fd" display={cfg.starPDirection+"°"}                     onChange={v=>set("starPDirection",v)} />
                <div style={{ display:"flex", gap:4 }}>
                  {(['square','round','snowflake'] as const).map(v => (
                    <button key={v} onClick={() => set("starPVariant",v)} style={{
                      flex:1, padding:"4px 0", fontSize:9, letterSpacing:0.5, cursor:"pointer",
                      borderRadius:5, transition:"all .15s",
                      background: cfg.starPVariant===v?"rgba(167,139,250,.30)":"rgba(255,255,255,.05)",
                      border:`1px solid rgba(167,139,250,${cfg.starPVariant===v?.6:.2})`,
                      color: cfg.starPVariant===v?"#c4b5fd":"#475569",
                    }}>{v}</button>
                  ))}
                </div>
              </>
              }

              {/* ── ASTEROID FIELD ── */}
              <Divider label="ASTEROID FIELD" color="#94a3b8" />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:"#8899bb", letterSpacing:1, textTransform:"uppercase" }}>Visible</span>
                <button onClick={() => set("showAsteroids", !cfg.showAsteroids)} style={{
                  padding:"3px 12px", fontSize:10, letterSpacing:1, cursor:"pointer",
                  borderRadius:6, background:cfg.showAsteroids?"rgba(148,163,184,.25)":"rgba(255,255,255,.08)",
                  border:`1px solid rgba(148,163,184,${cfg.showAsteroids?.5:.2})`,
                  color:cfg.showAsteroids?"#cbd5e1":"#475569", transition:"all .2s" }}>
                  {cfg.showAsteroids ? "ON" : "OFF"}
                </button>
              </div>
              {cfg.showAsteroids && (
                <Slider label="Master Opacity" value={cfg.asteroidOpacity} min={0} max={1} step={.05} color="#94a3b8" display={Math.round(cfg.asteroidOpacity*100)+"%"} onChange={v=>set("asteroidOpacity",v)} />
              )}

              {/* FRONT */}
              {cfg.showAsteroids && <>
                <Divider label="↑ FRONT LAYER" color="#e2e8f0" />
                <ColorRow label="Color"   value={cfg.astFrontColor}   color="#e2e8f0" onChange={v=>set("astFrontColor",v)} />
                <Slider label="Speed"    value={cfg.astFrontSpeed}   min={0.1} max={5}   step={.1}  color="#e2e8f0" display={cfg.astFrontSpeed.toFixed(1)+"x"}          onChange={v=>set("astFrontSpeed",v)} />
                <Slider label="Opacity"  value={cfg.astFrontOpacity} min={0}   max={1}   step={.05} color="#e2e8f0" display={Math.round(cfg.astFrontOpacity*100)+"%"}     onChange={v=>set("astFrontOpacity",v)} />
                <Slider label="Rotation" value={cfg.astFrontRot}     min={-180} max={180} step={5}  color="#e2e8f0" display={cfg.astFrontRot+"°"}                        onChange={v=>set("astFrontRot",v)} />
                <Slider label="Spin Spd" value={cfg.astFrontRotSpd}  min={0} max={5} step={.1} color="#e2e8f0" display={cfg.astFrontRotSpd.toFixed(1)+"x"}      onChange={v=>set("astFrontRotSpd",v)} />
                <Slider label="V Shift"  value={cfg.astFrontYOffset}  min={-50} max={50} step={2}   color="#e2e8f0" display={(cfg.astFrontYOffset>0?"+":"")+cfg.astFrontYOffset+"%"} onChange={v=>set("astFrontYOffset",v)} />
                <Slider label="Size"     value={cfg.astFrontSizeScale} min={0.1} max={5}  step={0.1} color="#e2e8f0" display={cfg.astFrontSizeScale.toFixed(1)+"x"}                 onChange={v=>set("astFrontSizeScale",v)} />
                <button onClick={()=>set("astFrontGeomSeed", Math.floor(Math.random()*99999)+1)} style={{ width:"100%", padding:"6px 0", background:"rgba(226,232,240,.08)", border:"1px solid rgba(226,232,240,.2)", borderRadius:6, color:"#94a3b8", fontSize:9, letterSpacing:1, cursor:"pointer" }}>🎲 RANDOMISE FRONT GEOMETRY</button>
              </>}

              {/* MID */}
              {cfg.showAsteroids && <>
                <Divider label="— MID LAYER" color="#7dd3fc" />
                <ColorRow label="Color"   value={cfg.astMidColor}   color="#7dd3fc" onChange={v=>set("astMidColor",v)} />
                <Slider label="Speed"    value={cfg.astMidSpeed}   min={0.1} max={5}   step={.1}  color="#7dd3fc" display={cfg.astMidSpeed.toFixed(1)+"x"}        onChange={v=>set("astMidSpeed",v)} />
                <Slider label="Opacity"  value={cfg.astMidOpacity} min={0}   max={1}   step={.05} color="#7dd3fc" display={Math.round(cfg.astMidOpacity*100)+"%"} onChange={v=>set("astMidOpacity",v)} />
                <Slider label="Rotation" value={cfg.astMidRot}     min={-180} max={180} step={5}  color="#7dd3fc" display={cfg.astMidRot+"°"}                     onChange={v=>set("astMidRot",v)} />
                <Slider label="Spin Spd" value={cfg.astMidRotSpd}  min={0} max={5} step={.1} color="#7dd3fc" display={cfg.astMidRotSpd.toFixed(1)+"x"}      onChange={v=>set("astMidRotSpd",v)} />
                <Slider label="V Shift"  value={cfg.astMidYOffset}  min={-50} max={50} step={2}   color="#7dd3fc" display={(cfg.astMidYOffset>0?"+":"")+cfg.astMidYOffset+"%"} onChange={v=>set("astMidYOffset",v)} />
                <Slider label="Size"     value={cfg.astMidSizeScale} min={0.1} max={5}  step={0.1} color="#7dd3fc" display={cfg.astMidSizeScale.toFixed(1)+"x"}                 onChange={v=>set("astMidSizeScale",v)} />
                <button onClick={()=>set("astMidGeomSeed", Math.floor(Math.random()*99999)+1)} style={{ width:"100%", padding:"6px 0", background:"rgba(125,211,252,.08)", border:"1px solid rgba(125,211,252,.2)", borderRadius:6, color:"#7dd3fc", fontSize:9, letterSpacing:1, cursor:"pointer" }}>🎲 RANDOMISE MID GEOMETRY</button>
              </>}

              {/* BACK */}
              {cfg.showAsteroids && <>
                <Divider label="↓ BACK LAYER" color="#6366f1" />
                <ColorRow label="Color"   value={cfg.astBackColor}   color="#6366f1" onChange={v=>set("astBackColor",v)} />
                <Slider label="Speed"    value={cfg.astBackSpeed}   min={0.1} max={5}   step={.1}  color="#6366f1" display={cfg.astBackSpeed.toFixed(1)+"x"}        onChange={v=>set("astBackSpeed",v)} />
                <Slider label="Opacity"  value={cfg.astBackOpacity} min={0}   max={1}   step={.05} color="#6366f1" display={Math.round(cfg.astBackOpacity*100)+"%"} onChange={v=>set("astBackOpacity",v)} />
                <Slider label="Rotation" value={cfg.astBackRot}     min={-180} max={180} step={5}  color="#6366f1" display={cfg.astBackRot+"°"}                     onChange={v=>set("astBackRot",v)} />
                <Slider label="Spin Spd" value={cfg.astBackRotSpd}  min={0} max={5} step={.1} color="#6366f1" display={cfg.astBackRotSpd.toFixed(1)+"x"}      onChange={v=>set("astBackRotSpd",v)} />
                <Slider label="V Shift"  value={cfg.astBackYOffset}  min={-50} max={50} step={2}   color="#6366f1" display={(cfg.astBackYOffset>0?"+":"")+cfg.astBackYOffset+"%"} onChange={v=>set("astBackYOffset",v)} />
                <Slider label="Size"     value={cfg.astBackSizeScale} min={0.1} max={5}  step={0.1} color="#6366f1" display={cfg.astBackSizeScale.toFixed(1)+"x"}                 onChange={v=>set("astBackSizeScale",v)} />
                <button onClick={()=>set("astBackGeomSeed", Math.floor(Math.random()*99999)+1)} style={{ width:"100%", padding:"6px 0", background:"rgba(99,102,241,.08)", border:"1px solid rgba(99,102,241,.2)", borderRadius:6, color:"#6366f1", fontSize:9, letterSpacing:1, cursor:"pointer" }}>🎲 RANDOMISE BACK GEOMETRY</button>
              </>}
              <Divider label="SATELLITES" color="#a78bfa" />
              <Slider label="Count"       value={cfg.satelliteCount}  min={0}   max={12}  step={1}    color="#a78bfa" display={cfg.satelliteCount.toString()} onChange={v=>set("satelliteCount",Math.round(v))} />
              <Slider label="Depth"        value={cfg.satelliteOrbit}  min={0.0} max={1.0} step={.025} color="#a78bfa" display={cfg.satelliteOrbit===0?"SURFACE":Math.round(cfg.satelliteOrbit*100)+"% deep"} onChange={v=>set("satelliteOrbit",v)} />
              <Slider label="Size"         value={cfg.satelliteSize}   min={0.002} max={0.30} step={.002} color="#a78bfa" display={cfg.satelliteSize.toFixed(3)} onChange={v=>set("satelliteSize",v)} />
              <Slider label="Speed"       value={cfg.satelliteSpeed}  min={0.0} max={5.0} step={.1}   color="#a78bfa" display={cfg.satelliteSpeed.toFixed(1)+"x"} onChange={v=>set("satelliteSpeed",v)} />

              {/* ── RENDERING & PERFORMANCE ── */}
              <Divider label="⚙ RENDERING & PERFORMANCE" color="#94a3b8" />
              <Slider label="Render Scale"    value={cfg.renderScale  ?? 0.55} min={0.2} max={1.0} step={0.05} color="#94a3b8" display={`${Math.round((cfg.renderScale??0.55)*100)}%`}   onChange={v=>set("renderScale",v)} />
              <Slider label="Canvas Blur"     value={cfg.canvasBlur   ?? 1.5}  min={0}   max={6}   step={0.25} color="#94a3b8" display={`${(cfg.canvasBlur??1.5).toFixed(2)}px`}          onChange={v=>set("canvasBlur",v)} />
              <Slider label="Sphere Count"    value={cfg.sphereCount  ?? 6}    min={0}   max={12}  step={1}    color="#94a3b8" display={(cfg.sphereCount??6).toString()}                    onChange={v=>set("sphereCount",Math.round(v))} />
              <Slider label="Blob Smoothness" value={cfg.smoothness   ?? 0.80} min={0.0} max={1.5} step={0.01} color="#94a3b8" display={(cfg.smoothness??0.8).toFixed(2)}                  onChange={v=>set("smoothness",v)} />
              <Slider label="Blend Distance"  value={cfg.mergeDistance?? 2.0}  min={0.5} max={5}   step={0.05} color="#94a3b8" display={(cfg.mergeDistance??2).toFixed(2)}                 onChange={v=>set("mergeDistance",v)} />
              <Slider label="Contrast"        value={cfg.contrast     ?? 1.6}  min={0.5} max={3.0} step={0.05} color="#94a3b8" display={(cfg.contrast??1.6).toFixed(2)}                    onChange={v=>set("contrast",v)} />
              <Slider label="Fog Density"     value={cfg.fogDensity   ?? 0.06} min={0}   max={0.5} step={0.005}color="#94a3b8" display={(cfg.fogDensity??0.06).toFixed(3)}                 onChange={v=>set("fogDensity",v)} />
              <Slider label="Anim Speed"      value={cfg.animationSpeed??0.6}  min={0}   max={3.0} step={0.05} color="#94a3b8" display={`${(cfg.animationSpeed??0.6).toFixed(2)}x`}       onChange={v=>set("animationSpeed",v)} />
              <Slider label="Movement Scale"  value={cfg.movementScale??1.6}   min={0}   max={4.0} step={0.05} color="#94a3b8" display={`${(cfg.movementScale??1.6).toFixed(2)}x`}        onChange={v=>set("movementScale",v)} />

              {/* ── PRESETS ── */}
              <Divider label="PRESETS" color="#22d3ee" />
              {/* Built-in row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
                {BUILT_IN_PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p.config)} title={p.name}
                    style={{ padding:'5px 4px', fontSize:8.5, letterSpacing:0.3, cursor:'pointer',
                      borderRadius:6, background:'rgba(34,211,238,.08)', border:'1px solid rgba(34,211,238,.22)',
                      color:'#67e8f9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      transition:'background .15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(34,211,238,.22)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='rgba(34,211,238,.08)')}>
                    {p.name}
                  </button>
                ))}
              </div>
              {/* User presets */}
              {userPresets.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {userPresets.map(p => (
                    <div key={p.name} style={{ display:'flex', gap:4 }}>
                      <button onClick={() => applyPreset(p.config)}
                        style={{ flex:1, padding:'4px 8px', fontSize:9, letterSpacing:0.5, textAlign:'left',
                          cursor:'pointer', borderRadius:6, background:'rgba(52,211,153,.08)',
                          border:'1px solid rgba(52,211,153,.25)', color:'#6ee7b7',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.name}
                      </button>
                      <button onClick={() => deleteUserPreset(p.name)}
                        style={{ padding:'4px 7px', fontSize:9, cursor:'pointer', borderRadius:6,
                          background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.22)', color:'#fca5a5' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Save-as-preset input */}
              <div style={{ display:'flex', gap:4 }}>
                <input value={newPresetName} onChange={e=>setNewPresetName(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter' && newPresetName.trim()){ saveUserPreset(newPresetName.trim()); setNewPresetName(''); } }}
                  placeholder="Name this preset…"
                  style={{ flex:1, padding:'5px 8px', fontSize:9, borderRadius:6,
                    background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.14)',
                    color:'#cbd5e1', outline:'none', fontFamily:'Orbitron,monospace' }} />
                <button onClick={() => { if(newPresetName.trim()){ saveUserPreset(newPresetName.trim()); setNewPresetName(''); } }}
                  style={{ padding:'5px 10px', fontSize:9, letterSpacing:0.5, cursor:'pointer',
                    borderRadius:6, background:'rgba(52,211,153,.12)', border:'1px solid rgba(52,211,153,.32)', color:'#6ee7b7' }}>
                  + Save
                </button>
              </div>

              <button onClick={saveSettings} style={{
                marginTop:4, padding:"8px 0", background:saved?"rgba(34,197,94,.30)":"rgba(34,197,94,.10)",
                border:`1px solid rgba(34,197,94,${saved?.7:.3})`, borderRadius:8,
                color:saved?"#4ade80":"rgba(34,197,94,.8)", fontSize:10, letterSpacing:1,
                cursor:"pointer", textTransform:"uppercase",
                transition:"all .3s" }}>
                {saved ? "✓ Saved!" : "💾 Save Settings"}
              </button>

              <button onClick={applyToArena} style={{
                padding:"8px 0", background:"rgba(168,85,247,.12)",
                border:"1px solid rgba(168,85,247,.35)", borderRadius:8,
                color:"rgba(168,85,247,.9)", fontSize:10, letterSpacing:1,
                cursor:"pointer", textTransform:"uppercase" }}>
                ▶ Apply to Arena
              </button>

              <button onClick={() => setCfg({...DEFAULT})} style={{
                marginTop:4, padding:"7px 0", background:"transparent",
                border:`1px solid rgba(${glowRgb},.28)`, borderRadius:8,
                color:`rgba(${glowRgb},.8)`, fontSize:10, letterSpacing:1,
                cursor:"pointer", textTransform:"uppercase" }}>
                Reset to Defaults
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Divider({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:6, marginTop:2 }}>
      <span style={{ fontSize:9, color, letterSpacing:2, fontWeight:700, textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

function ColorRow({ label, value, color, onChange }: { label:string; value:string; color:string; onChange:(v:string)=>void }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:10, color:"#8899bb", letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:10, color, fontWeight:700 }}>{value.toUpperCase()}</span>
      </div>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", height:26, border:"none", borderRadius:6, cursor:"pointer", background:"none" }} />
    </div>
  );
}

function Slider({ label, value, min, max, step, color, display, onChange }:
  { label:string; value:number; min:number; max:number; step:number; color:string; display:string; onChange:(v:number)=>void }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
        <span style={{ fontSize:10, color:"#8899bb", letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:10, color, fontWeight:700 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        style={{ width:"100%", accentColor:color, cursor:"pointer" }} />
    </div>
  );
}
