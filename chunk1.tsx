'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { debounce } from 'lodash';
import { ALL_SHAPE_IDS, DEFAULT_ENABLED_SHAPES, SHAPE_LIBRARY } from './ShapeLibrary';
import { SheepFlockEngine } from './SheepFlockEngine';

// ============================================================================
// Shader: Custom Tilt Shift (Radial Blur + Vignette)
// ============================================================================
const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    focus:    { value: 0.5 },
    blur:     { value: 1.5 },
    spread:   { value: 0.02 },
    vignette: { value: 0.35 },
    vigColor: { value: new THREE.Color(0x000000) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float focus;
    uniform float blur;
    uniform float spread;
    uniform float vignette;
    uniform vec3 vigColor;
    varying vec2 vUv;
    void main() {
      vec4 color = vec4(0.0);
      float d = distance(vUv, vec2(0.5));
      float amount = smoothstep(focus - 0.2, focus + 0.5, d) * blur;
      float total = 0.0;
      for (float x = -2.0; x <= 2.0; x++) {
        for (float y = -2.0; y <= 2.0; y++) {
          color += texture2D(tDiffuse, vUv + vec2(x, y) * spread * amount);
          total += 1.0;
        }
      }
      color /= total;
      float vig = smoothstep(0.8, 0.2, d * (1.0 + vignette));
      color.rgb = mix(vigColor, color.rgb, vig);
      gl_FragColor = color;
    }
  `,
};

// ============================================================================
// Procedural Generation (Perlin-ish Noise)
// ============================================================================
function buildNoise(w: number, h: number, octaves: number, seed: number, maxElev: number, roughness: number) {
  const map: number[][] = Array.from({ length: h }, () => Array(w).fill(0));
  for (let o = 0; o < octaves; o++) {
    const freq = Math.pow(2, o) * (roughness * 0.1);
    const amp  = Math.pow(0.5, o);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x / w - 0.5) * freq + seed;
        const ny = (y / h - 0.5) * freq + seed;
        const val = Math.sin(nx * 10) * Math.cos(ny * 10) * 0.5 + 0.5;
        map[y][x] += val * amp;
      }
    }
  }
  let min = 1, max = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (map[y][x] < min) min = map[y][x];
      if (map[y][x] > max) max = map[y][x];
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const norm = (map[y][x] - min) / (max - min);
      map[y][x] = Math.max(1, Math.round(norm * maxElev));
    }
  }
  return map;
}

// ── We randomly pick a fixed set of ~5% blocks that can explode on click
const presetExplodeBlocksRef = { current: new Set<string>() };
function pickPresetBlocks(heights: number[][], seed: number) {
  const s = new Set<string>();
  // pseudo-random using seed to keep it consistent for the layout
  const pseudoRandom = (i: number) => {
     let x = Math.sin(seed + i) * 10000;
     return x - Math.floor(x);
  };
  let count = 0;
  for (let y = 0; y < heights.length; y++) {
     for (let x = 0; x < heights[y].length; x++) {
         const ht = heights[y][x];
         for (let h = 0; h < ht; h++) {
             if (pseudoRandom(count++) < 0.05) s.add(`${x}_${y}_${h}`);
         }
     }
  }
  presetExplodeBlocksRef.current = s;
}

// ============================================================================
// Particle System + Treasure VFX Pools + Weapon FX Pools
// ============================================================================
const TERRAIN_MAX_PARTICLES = 30000;
type Particle = {
  alive: boolean;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  age: number; maxAge: number;
  r: number; g: number; b: number;
};
const particleDataRef = { current: [] as Particle[] };

type WeaponProjectile = {
  id: string;
  type: 'scatter' | 'artillery' | 'flyover' | 'laser' | 'seismic' | 'carpet' | 'blackhole';
  mesh: THREE.Mesh | THREE.Group;
  startX: number; startY: number; startZ: number;
  targetX: number; targetY: number; targetZ: number;
  progress: number;
  speed: number;
  curvePt1?: THREE.Vector3; curvePt2?: THREE.Vector3;
  radius: number; depth: number;
  delayMs?: number; startTime?: number; durationMs?: number;
};
const weaponProjectilesRef = { current: [] as WeaponProjectile[] };

type HoverItem = { active: boolean; blockKey: string; mesh: THREE.Mesh; targetAlpha: number; currentAlpha: number; };
const HOVER_POOL_SIZE = 120; // Needs to be big enough for shotgun scatter trails
const hoverPoolRef = { current: [] as HoverItem[] };
const hoverCurrentlyHitRef = { current: null as string | null };

const DEFAULT_LAYER_COLORS = ['#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd'];
const PRESET_BEACON_COLORS = ['#ff6b35','#f0e040','#40e0f0','#c040f0','#40ff80','#ff4060','#ffffff'];

// ============================================================================
// UI Component: Generic Settings Slider
// ============================================================================
const CfgSlider = ({ label, min, max, step, value, onChange, accent = '#a78bfa' }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
    <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', letterSpacing: 0.5, width: 75, textTransform: 'uppercase' }}>
      {label}
    </span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ flex: 1, accentColor: accent, opacity: 0.8 }}
    />
    <span style={{ fontSize: 9, color: accent, fontFamily: 'monospace', width: 28, textAlign: 'right' }}>
      {Number.isInteger(step) ? value : Number(value).toFixed(2)}
    </span>
  </div>
);

// ============================================================================
// UI Component: Weapon Button
// ============================================================================
const WeaponButton = ({ active, onClick, icon, label }: any) => {
  const col = active ? '#ff3c3c' : '#778899';
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: active ? 'rgba(255, 60, 60, 0.15)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${active ? '#ff3c3c' : 'rgba(255,255,255,0.1)'}`,
      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
      boxShadow: active ? '0 0 10px rgba(255,60,60,0.3)' : 'none',
      transition: 'all 0.1s', width: 75
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 8, fontFamily: 'monospace', color: col, fontWeight: active ? 'bold' : 'normal', letterSpacing: 1 }}>{label}</span>
      {active && (
         <div className="wpn-cooldown-bar" style={{ height: 2, background: '#ff3c3c', width: '0%', borderRadius: 1, marginTop: 2, alignSelf: 'stretch', transition: 'width 0.2s linear' }} />
      )}
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TerrainGenerator() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const tiltPassRef = useRef<ShaderPass | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const mixedGrpRef = useRef<THREE.Group | null>(null);
  const beaconGrpRef = useRef<THREE.Group | null>(null);
  const hexWorldGrpRef = useRef<THREE.Group | null>(null);
  const flockEngineRef = useRef<SheepFlockEngine | null>(null);
  
  const particlesRef = useRef<THREE.Points | null>(null);
  
  // Custom Hex World tracking refs
  const slotMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const beamMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const energonPlacedRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const [selectedEnergon, setSelectedEnergon] = useState<number | null>(null);
  const selectedEnergonRef = useRef<number | null>(null);
  const [slotsFilled, setSlotsFilled] = useState<boolean[][]>(Array(7).fill(null).map(()=>Array(5).fill(false)));
  const slotsFilledRef = useRef<boolean[][]>(Array(7).fill(null).map(()=>Array(5).fill(false)));
  const beamScaleRef = useRef<number[]>(Array(7).fill(0));
  
  const [altarGlow, setAltarGlow] = useState<number[]>(Array(7).fill(1.0));
  const [altarOcclude, setAltarOcclude] = useState<boolean[]>(Array(7).fill(false));

  const [shapeLibraryOpen, setShapeLibraryOpen] = useState(false);
  const [enabledShapes, setEnabledShapes] = useState<Set<string>>(new Set(DEFAULT_ENABLED_SHAPES));

  // Treasure Hunters / Shuffling Mode
  const [isTreasureMode, setIsTreasureMode] = useState(false);
  const [shuffleStartTime, setShuffleStartTime] = useState(0);
  const isTreasureModeRef = useRef(isTreasureMode);
  const shuffleStartTimeRef = useRef(shuffleStartTime);
  
  // Raid Mode
  const [isRaidMode, setIsRaidMode] = useState(false);
  const [showRaidPanel, setShowRaidPanel] = useState(true);
  const [showRaidPhysics, setShowRaidPhysics] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<'scatter'|'artillery'|'flyover'|'laser'|'seismic'|'carpet'|'blackhole'|null>(null);
  
  const isRaidModeRef = useRef(isRaidMode);
  const selectedWeaponRef = useRef(selectedWeapon);

  // Weapon Config States
  const [scatterCount, setScatterCount] = useState(8); const scatterCountRef = useRef(scatterCount);
  const [scatterRadius, setScatterRadius] = useState(5); const scatterRadiusRef = useRef(scatterRadius);
  const [scatterDepth, setScatterDepth] = useState(2); const scatterDepthRef = useRef(scatterDepth);
  const [scatterDelay, setScatterDelay] = useState(300); const scatterDelayRef = useRef(scatterDelay);
  
  const [artilleryRadius, setArtilleryRadius] = useState(8); const artilleryRadiusRef = useRef(artilleryRadius);
  const [artilleryDepth, setArtilleryDepth] = useState(5); const artilleryDepthRef = useRef(artilleryDepth);
  const [artilleryDelay, setArtilleryDelay] = useState(800); const artilleryDelayRef = useRef(artilleryDelay);
  
  const [flyoverRadius, setFlyoverRadius] = useState(6); const flyoverRadiusRef = useRef(flyoverRadius);
  const [flyoverDepth, setFlyoverDepth] = useState(4); const flyoverDepthRef = useRef(flyoverDepth);
  const [flyoverDelay, setFlyoverDelay] = useState(1500); const flyoverDelayRef = useRef(flyoverDelay);
  
  const [laserRadius, setLaserRadius] = useState(3); const laserRadiusRef = useRef(laserRadius);
  const [laserDepth, setLaserDepth] = useState(6); const laserDepthRef = useRef(laserDepth);
  const [laserDuration, setLaserDuration] = useState(2000); const laserDurationRef = useRef(laserDuration);
  const [laserDelay, setLaserDelay] = useState(500); const laserDelayRef = useRef(laserDelay);
  
  const [seismicRadius, setSeismicRadius] = useState(12); const seismicRadiusRef = useRef(seismicRadius);
  const [seismicDepth, setSeismicDepth] = useState(2); const seismicDepthRef = useRef(seismicDepth);
  const [seismicSpeed, setSeismicSpeed] = useState(40); const seismicSpeedRef = useRef(seismicSpeed);
  const [seismicDelay, setSeismicDelay] = useState(200); const seismicDelayRef = useRef(seismicDelay);
  
  const [carpetCount, setCarpetCount] = useState(10); const carpetCountRef = useRef(carpetCount);
  const [carpetRadius, setCarpetRadius] = useState(3); const carpetRadiusRef = useRef(carpetRadius);
  const [carpetDepth, setCarpetDepth] = useState(2); const carpetDepthRef = useRef(carpetDepth);
  const [carpetDelay, setCarpetDelay] = useState(150); const carpetDelayRef = useRef(carpetDelay);
  
  const [blackholeRadius, setBlackholeRadius] = useState(6); const blackholeRadiusRef = useRef(blackholeRadius);
  const [blackholeDepth, setBlackholeDepth] = useState(8); const blackholeDepthRef = useRef(blackholeDepth);
  const [blackholeDuration, setBlackholeDuration] = useState(4000); const blackholeDurationRef = useRef(blackholeDuration);
  const [blackholeDelay, setBlackholeDelay] = useState(1000); const blackholeDelayRef = useRef(blackholeDelay);

  useEffect(() => { isTreasureModeRef.current = isTreasureMode; }, [isTreasureMode]);
  useEffect(() => { shuffleStartTimeRef.current = shuffleStartTime; }, [shuffleStartTime]);
  useEffect(() => { isRaidModeRef.current = isRaidMode; }, [isRaidMode]);
  useEffect(() => { selectedWeaponRef.current = selectedWeapon; }, [selectedWeapon]);
  
  useEffect(() => { scatterCountRef.current = scatterCount; }, [scatterCount]);
  useEffect(() => { scatterRadiusRef.current = scatterRadius; }, [scatterRadius]);
  useEffect(() => { scatterDepthRef.current = scatterDepth; }, [scatterDepth]);
  useEffect(() => { scatterDelayRef.current = scatterDelay; }, [scatterDelay]);
  
  useEffect(() => { artilleryRadiusRef.current = artilleryRadius; }, [artilleryRadius]);
  useEffect(() => { artilleryDepthRef.current = artilleryDepth; }, [artilleryDepth]);
  useEffect(() => { artilleryDelayRef.current = artilleryDelay; }, [artilleryDelay]);
  
  useEffect(() => { flyoverRadiusRef.current = flyoverRadius; }, [flyoverRadius]);
  useEffect(() => { flyoverDepthRef.current = flyoverDepth; }, [flyoverDepth]);
  useEffect(() => { flyoverDelayRef.current = flyoverDelay; }, [flyoverDelay]);
  
  useEffect(() => { laserRadiusRef.current = laserRadius; }, [laserRadius]);
  useEffect(() => { laserDepthRef.current = laserDepth; }, [laserDepth]);
  useEffect(() => { laserDurationRef.current = laserDuration; }, [laserDuration]);
  useEffect(() => { laserDelayRef.current = laserDelay; }, [laserDelay]);
  
  useEffect(() => { seismicRadiusRef.current = seismicRadius; }, [seismicRadius]);
  useEffect(() => { seismicDepthRef.current = seismicDepth; }, [seismicDepth]);
  useEffect(() => { seismicSpeedRef.current = seismicSpeed; }, [seismicSpeed]);
  useEffect(() => { seismicDelayRef.current = seismicDelay; }, [seismicDelay]);
  
  useEffect(() => { carpetCountRef.current = carpetCount; }, [carpetCount]);
  useEffect(() => { carpetRadiusRef.current = carpetRadius; }, [carpetRadius]);
  useEffect(() => { carpetDepthRef.current = carpetDepth; }, [carpetDepth]);
  useEffect(() => { carpetDelayRef.current = carpetDelay; }, [carpetDelay]);
  
  useEffect(() => { blackholeRadiusRef.current = blackholeRadius; }, [blackholeRadius]);
  useEffect(() => { blackholeDepthRef.current = blackholeDepth; }, [blackholeDepth]);
  useEffect(() => { blackholeDurationRef.current = blackholeDuration; }, [blackholeDuration]);
  useEffect(() => { blackholeDelayRef.current = blackholeDelay; }, [blackholeDelay]);

  // Lighting refs
  const ambLightRef  = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef  = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef  = useRef<THREE.DirectionalLight | null>(null);
  const hemLightRef  = useRef<THREE.HemisphereLight | null>(null);
  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const vigColorRef  = useRef(new THREE.Color('#000000'));
  const mouseWorld3DRef = useRef(new THREE.Vector3());

  // Optimisation: On-demand rendering system
  const rafRef         = useRef<number>(0);
  const needsRenderRef = useRef<boolean>(true);
  const shadowsDirtyRef= useRef<boolean>(true);
  const fpsTRef        = useRef<number>(0);
  const fpsCountRef    = useRef<number>(0);
  const fpsElRef       = useRef<HTMLSpanElement>(null);
  const particleFrameRef = useRef(0);

  // Layout Tab: procedural vs custom hex world vs large_map
  const [layoutTab, setLayoutTab] = useState<'procedural' | 'custom' | 'large_map'>('procedural');
  const layoutTabRef = useRef(layoutTab);
  useEffect(() => { layoutTabRef.current = layoutTab; }, [layoutTab]);

  // Pipeline toggle
  const [renderMode, setRenderMode] = useState<'glass' | 'mixed'>('glass');
  const renderModeRef = useRef(renderMode);
  useEffect(() => { renderModeRef.current = renderMode; }, [renderMode]);

  // Grid / Terrain controls
  const [gridW, setGridW] = useState(32);
  const [gridH, setGridH] = useState(32);
  const [octaves, setOctaves] = useState(3);
  const [seed, setSeed] = useState(42);
  const [maxElev, setMaxElev] = useState(5);
  const [roughness, setRoughness] = useState(1.0);
  
  // Interactive Block Break System
  const [brokenBlocks, setBrokenBlocks] = useState<Set<string>>(new Set());
  const brokenBlocksRef = useRef(brokenBlocks);
  useEffect(() => { brokenBlocksRef.current = brokenBlocks; }, [brokenBlocks]);
  
  // Particle System Config
  const [partLimit, setPartLimit] = useState(30000);   const partLimitRef = useRef(partLimit);
  const [partCount, setPartCount] = useState(25);      const partCountRef = useRef(partCount);
  const [partSize, setPartSize] = useState(1.2);       const partSizeRef = useRef(partSize);
  const [partSpeed, setPartSpeed] = useState(0.8);     const partSpeedRef = useRef(partSpeed);
  const [partDecay, setPartDecay] = useState(0.95);    const partDecayRef = useRef(partDecay);
  const [partLife, setPartLife] = useState(240);       const partLifeRef = useRef(partLife);
  const [partFalloff, setPartFalloff] = useState(0.002); const partFalloffRef = useRef(partFalloff);
  const [partChance, setPartChance] = useState(1.0);   const partChanceRef = useRef(partChance);
  
  const [regenSpeed, setRegenSpeed] = useState(15);    const regenSpeedRef = useRef(regenSpeed);
  const [regenFadeSpeed, setRegenFadeSpeed] = useState(0.02); const regenFadeSpeedRef = useRef(regenFadeSpeed);
  const regeneratingBlocksRef = useRef<Map<string, { scale: number }>>(new Map());

  // Bind particles to ref
  useEffect(() => { partLimitRef.current = partLimit; }, [partLimit]);
  useEffect(() => { partCountRef.current = partCount; }, [partCount]);
  useEffect(() => { partSizeRef.current = partSize; }, [partSize]);
  useEffect(() => { partSpeedRef.current = partSpeed; }, [partSpeed]);
  useEffect(() => { partDecayRef.current = partDecay; }, [partDecay]);
  useEffect(() => { partLifeRef.current = partLife; }, [partLife]);
  useEffect(() => { partFalloffRef.current = partFalloff; }, [partFalloff]);
  useEffect(() => { partChanceRef.current = partChance; }, [partChance]);
  useEffect(() => { regenSpeedRef.current = regenSpeed; }, [regenSpeed]);
  useEffect(() => { regenFadeSpeedRef.current = regenFadeSpeed; }, [regenFadeSpeed]);

  // Mesh controls
  const [bevel, setBevel] = useState(0.08);
  const [cubeJitter, setCubeJitter] = useState(0.0);
  const [glowInt, setGlowInt] = useState(1.15);
  const [hoverFade, setHoverFade] = useState(0.08);
  const hoverFadeRef = useRef(hoverFade);
  useEffect(() => { hoverFadeRef.current = hoverFade; }, [hoverFade]);
  const [opacity, setOpacity] = useState(0.92);
  const [layerColors, setLayerColors] = useState<string[]>([...DEFAULT_LAYER_COLORS]);
  const [terrainTint, setTerrainTint] = useState('#1e7a8c');
  const [matTransmit, setMatTransmit] = useState(0.9);
  const [matThickness, setMatThickness] = useState(1.2);
  const [matIor, setMatIor] = useState(1.5);
  const [matRoughness, setMatRoughness] = useState(0.12);

  // Beacons
  const [beaconCount, setBeaconCount] = useState(6);
  const [beaconColor, setBeaconColor] = useState('#ff6b35');
  const [beaconEmissive, setBeaconEmissive] = useState(4.0);
  const [beaconLight, setBeaconLight] = useState(1.5);
  const [beaconSeed, setBeaconSeed] = useState(100);
  const [beaconBury, setBeaconBury] = useState(2);

  // Bloom
  const [bloomStr, setBloomStr] = useState(0.8);
  const [bloomThresh, setBloomThresh] = useState(1.1);

  // Camera + TiltShift
  const [camElev, setCamElev] = useState(35.26);
  const [camAzimuth, setCamAzimuth] = useState(45);
  const [camZoom, setCamZoom] = useState(22);
  const [tiltBlur, setTiltBlur] = useState(1.5);
  const [tiltSpread, setTiltSpread] = useState(0.02);
  const [tiltVignette, setTiltVignette] = useState(0.35);
  const [vigColor, setVigColor] = useState('#000000');

  // Lighting
  const [keyLightInt, setKeyLightInt] = useState(4.5);
  const [ambientInt, setAmbientInt] = useState(0.6);
  const [lightElev, setLightElev] = useState(35);
  const [lightAzimuth, setLightAzimuth] = useState(40);
  const [keyLightColor, setKeyLightColor] = useState('#ffedd5');

  // SpotLight (Focus)
  const [spotEnabled, setSpotEnabled] = useState(false);
  const [spotInt, setSpotInt] = useState(20);
  const [spotColor, setSpotColor] = useState('#ffffff');
  const [spotAngle, setSpotAngle] = useState(30);
  const [spotPenumbra, setSpotPenumbra] = useState(0.5);

  // Shadows
  const [shadowRadius, setShadowRadius] = useState(4);
  const [shadowColor, setShadowColor] = useState('#081424');
  const [hemIntensity, setHemIntensity] = useState(0.6);
  const [shadowMapSize, setShadowMapSize] = useState(2048);
  const [shadowIntensity, setShadowIntensity] = useState(0.8);
  const [shadowBias, setShadowBias] = useState(-0.001);
  const [shadowNormalBias, setShadowNormalBias] = useState(0.02);
  
  // Sheep configs
  const [sheepCount, setSheepCount] = useState(40);
  const [sheepSize, setSheepSize] = useState(1.0);
  const [sheepSeed, setSheepSeed] = useState(100);
  const [sheepAnimate, setSheepAnimate] = useState(true);
  
  const [sheepSpeed, setSheepSpeed] = useState(1.5);
  const [sheepBounceSpeed, setSheepBounceSpeed] = useState(8.0);
  const [sheepBounciness, setSheepBounciness] = useState(0.2);
  const [sheepGravity, setSheepGravity] = useState(30);
  const [sheepExplodeForce, setSheepExplodeForce] = useState(20);
  const [sheepExplodeRadius, setSheepExplodeRadius] = useState(6);
  const [sheepSeparation, setSheepSeparation] = useState(0.8);
  const [sheepCohesion, setSheepCohesion] = useState(1.2);
  const [sheepAlignment, setSheepAlignment] = useState(1.0);

  const [terrain, setTerrain] = useState<number[][]>([]);
  const terrainRef = useRef<number[][]>([]);
  const [status, setStatus] = useState('Idle');
  const [saved, setSaved] = useState(false);
  const [isSidebarMin, setIsSidebarMin] = useState(false);

