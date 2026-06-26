import React from 'react';
import styles from './page.module.css';
import { SplashCursor } from '../dashboard/components/SplashCursor';
import LapseSimulation from '../dashboard/components/environments/LapseSimulation';
import PixelSnow from '../dashboard/components/environments/PixelSnow';
import GooeyParticles from '../dashboard/components/environments/GooeyParticles';
import NexusFluidEffect from '../dashboard/components/environments/NexusFluidEffect';

// --- CMS Weapon Trail Color Interpolation ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16)/255, g: parseInt(result[2], 16)/255, b: parseInt(result[3], 16)/255 } : { r: 1, g: 1, b: 1 };
};
const getEngineColor = (colors: string[], time: number) => {
  if (!colors || colors.length === 0) return { r: 1, g: 1, b: 1 };
  if (colors.length === 1) return hexToRgb(colors[0]);
  const cycleTime = 1500;
  const p = (time % cycleTime) / cycleTime;
  const idx = Math.floor(p * colors.length);
  const nextIdx = (idx + 1) % colors.length;
  const t = (p * colors.length) - idx;
  const c1 = hexToRgb(colors[idx]);
  const c2 = hexToRgb(colors[nextIdx]);
  return { r: c1.r + (c2.r - c1.r)*t, g: c1.g + (c2.g - c1.g)*t, b: c1.b + (c2.b - c1.b)*t };
};

// --- PRE-RENDERED STYLIZED TEXTURE MAP ---
// Used for high-performance stylized "Fortnite/Anime" explosion and flame VFX.
// By pre-baking this soft, high-contract radial texture, we eliminate expensive path drawing globally.
const PARTICLE_TEX_SIZE = 64;
const getFireTexture = (isPlasma: boolean) => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = PARTICLE_TEX_SIZE;
    c.height = PARTICLE_TEX_SIZE;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    
    // Stylized dense glowing center with soft edge
    const r = PARTICLE_TEX_SIZE / 2;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); // White-hot core
    grad.addColorStop(0.2, isPlasma ? 'rgba(0, 229, 255, 0.9)' : 'rgba(255, 220, 100, 0.9)'); // Bright plasma / fire
    grad.addColorStop(0.5, isPlasma ? 'rgba(0, 100, 255, 0.6)' : 'rgba(255, 100, 20, 0.6)');  // Mid core
    grad.addColorStop(0.8, isPlasma ? 'rgba(0, 0, 200, 0.2)' : 'rgba(200, 20, 0, 0.2)');      // Deep edges
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)'); // Transparent falloff
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PARTICLE_TEX_SIZE, PARTICLE_TEX_SIZE);
    return c;
};
const sharedTextures: Record<string, HTMLCanvasElement> = {};

const GLOBAL_SHUFFLES = [
    [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]],
    [[-1, 0], [0, 1], [1, 0], [-1, 1], [0, -1], [1, -1]],
    [[0, -1], [-1, 1], [1, -1], [-1, 0], [1, 0], [0, 1]]
];

export default function WaveBasedArena({ onSwitchMode }: { onSwitchMode: () => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const globalZoomRef = React.useRef(1.0);
  const [gameState, setGameState] = React.useState<'INITIALIZING' | 'LOBBY' | 'SETUP' | 'PLAYING' | 'GAMEOVER'>('INITIALIZING');
  React.useEffect(() => {
      // Fake loading delay to build hype before showing Lobby
      const t = setTimeout(() => setGameState('LOBBY'), 1500);
      return () => clearTimeout(t);
  }, []);
  const [replayKey, setReplayKey] = React.useState(0);
  const [activeShips, setActiveShips] = React.useState<Set<number>>(new Set([1, 2, 3]));
  const activeShipsRef = React.useRef(activeShips);
  React.useEffect(() => { activeShipsRef.current = activeShips; }, [activeShips]);
  
  // Real-time pure DOM Keyboard mappings for instantaneous 60fps controls
  const keysRef = React.useRef({ forward: false, left: false, right: false, fire: false });
  React.useEffect(() => {
      const kd = (e: KeyboardEvent) => {
          if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = true;
          if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.left = true;
          if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.right = true;
          if (e.code === 'Space') keysRef.current.fire = true;
      };
      const ku = (e: KeyboardEvent) => {
          if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = false;
          if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.left = false;
          if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.right = false;
          if (e.code === 'Space') keysRef.current.fire = false;
      };
      window.addEventListener('keydown', kd);
      window.addEventListener('keyup', ku);
      return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  
  const [matchMode, setMatchMode] = React.useState<'PATHFINDING' | 'JOUSTING'>('JOUSTING');
  const [matchTimer, setMatchTimer] = React.useState(180);
  const [damageDealt, setDamageDealt] = React.useState({ player: 0, enemy: 0 });
  const [shipUI, setShipUI] = React.useState<Record<number, { hp: number, alive: boolean, hasDived: boolean, kills: number, cooldown?: number, magazine?: number, doctrine?: string, evasionTimer?: number }>>({
     1: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 },
     2: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 },
     3: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 },
     4: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 },
     5: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 },
     6: { hp: 100, alive: true, hasDived: false, kills: 0, cooldown: 0, magazine: 3, doctrine: 'JOUSTER', evasionTimer: 0 }
  });
  
  const [countdown, setCountdown] = React.useState(3);
  const setupTimestampRef = React.useRef(Date.now());
  const [selectedShips, setSelectedShips] = React.useState<Set<number>>(new Set());
  const [logs, setLogs] = React.useState<string[]>(['Simulation Initialized. Awaiting LOBBY clearance.']);
  const [showGrid, setShowGrid] = React.useState(false);
  const [showBackground, setShowBackground] = React.useState(true); // HARD-DISABLED: Background raytracer natively starves the GPU causing 30FPS hardware locks.
  const [showWake, setShowWake] = React.useState(true);
  const [arenaBackground, setArenaBackground] = React.useState<'lapse' | 'nexus'>('lapse');
  const arenaBackgroundRef = React.useRef(arenaBackground);
  React.useEffect(() => { arenaBackgroundRef.current = arenaBackground; }, [arenaBackground]);
  
  React.useEffect(() => {
      if (gameState === 'SETUP') {
          // window.dispatchEvent(new CustomEvent('SCRAMBLE_NEXUS')); // Prevent metaballs from redrawing/scrambling
      }
  }, [gameState]);
  
  const starsRef = React.useRef(Array.from({length: 500}).map(() => ({ x: Math.random() * 4000, y: Math.random() * 4000, r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.6 + 0.2 })));
  
  // --- CINEMATIC PLAYER COMMAND STATE ---
  const [playerCommand, setPlayerCommand] = React.useState('ROVE');
  const playerCommandRef = React.useRef('ROVE');
  const roamAngleRef = React.useRef(Math.random() * Math.PI * 2);

  // UI Syncer for Physics Engine State Reversals
  React.useEffect(() => {
      const handleSync = (e: any) => { setPlayerCommand(e.detail); };
      window.addEventListener('SYNC_UI_COMMAND', handleSync);
      return () => window.removeEventListener('SYNC_UI_COMMAND', handleSync);
  }, []);

  // Refs for loop
  const stateRef = React.useRef(gameState);
  const arenaRadiusRef = React.useRef<number>(2500);
  const arenaStartTimestampRef = React.useRef(0);
  const matchTimerRef = React.useRef(matchTimer);
  const damageDealtRef = React.useRef(damageDealt);
  
  const matchModeRef = React.useRef(matchMode);
  React.useEffect(() => { matchModeRef.current = matchMode; }, [matchMode]);
  
  React.useEffect(() => { matchTimerRef.current = matchTimer; }, [matchTimer]);
  React.useEffect(() => { damageDealtRef.current = damageDealt; }, [damageDealt]);
  
  const showGridRef = React.useRef(showGrid);
  React.useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);

  const selectedShipsRef = React.useRef(selectedShips);
  const playerBaseRef = React.useRef<{q: number, r: number} | null>(null);
  const enemyBaseRef = React.useRef<{q: number, r: number} | null>(null);
  const basesHealth = React.useRef({ player: 3, enemy: 3 });
  const trailHexesRef = React.useRef(new Map<string, {q: number, r: number, alpha: number}>());
  
  const fpsRef = React.useRef(60);
  const lastFrameTimeRef = React.useRef(Date.now());
  
  // Tactical Match Timer Clock Hook
  React.useEffect(() => {
    if (gameState === 'PLAYING' && matchTimer > 0) {
      const t = setTimeout(() => setMatchTimer(m => m - 1), 1000);
      return () => clearTimeout(t);
    } else if (matchTimer === 0 && gameState === 'PLAYING') {
      setGameState('GAMEOVER');
      setLogs(l => [...l.slice(-4), `Match Time Limit Reached. Resolving Victors...`]);
    }
  }, [gameState, matchTimer]);

  // Dynamic Ship Configs Payload mapping ID to internal settings
  const [shipConfigs, setShipConfigs] = React.useState<Record<number, { speed: number, turnRadius: number, radar: number, hp: number, attackDamage: number }>>({
    1: { speed: 0.4, turnRadius: 0.012, radar: 600, hp: 10, attackDamage: 2 },
    2: { speed: 0.35, turnRadius: 0.015, radar: 600, hp: 12, attackDamage: 2 },
    3: { speed: 0.425, turnRadius: 0.010, radar: 600, hp: 8, attackDamage: 1 },
    4: { speed: 0.325, turnRadius: 0.011, radar: 600, hp: 10, attackDamage: 2 },
    5: { speed: 0.375, turnRadius: 0.013, radar: 600, hp: 10, attackDamage: 2 },
    6: { speed: 0.30, turnRadius: 0.014, radar: 600, hp: 10, attackDamage: 2 }
  });
  const shipConfigsRef = React.useRef(shipConfigs);
  
  React.useEffect(() => { stateRef.current = gameState; }, [gameState]);
  React.useEffect(() => { selectedShipsRef.current = selectedShips; }, [selectedShips]);
  React.useEffect(() => { shipConfigsRef.current = shipConfigs; }, [shipConfigs]);

  // CMS Plasma Missile Hydration
  const splashEmitRef = React.useRef<any[]>([]);
  const defaultMissileConfig = {
    splatRadius: 0.0001, splatForce: 1, densityDissipation: 2.8,
    velocityDissipation: 0.001, curl: 1, dyeResolution: 1024,
    simResolution: 128, pressure: 0.1, pressureIterations: 20,
    emissionForceMult: 1.0, invertForce: true,
    emitterSize: 1.0,
    exhaustColors: ["#ff3300", "#ffaa00", "#ffffff"],
    projectileSpeed: 2.27,
    fireRate: 10
  };
  
  const [missileConfig, setMissileConfig] = React.useState(defaultMissileConfig);
  const missileConfigRef = React.useRef(missileConfig);
  React.useEffect(() => { missileConfigRef.current = missileConfig; }, [missileConfig]);

  const [backgroundEffect, setBackgroundEffect] = React.useState('lapse');

  const defaultShipEffects = [
    { ...defaultMissileConfig, splatRadius: 0.04, splatForce: 9450, velocityDissipation: 0.9, exhaustColors: ["#0088ff","#0088ff","#0088ff"] },
    { ...defaultMissileConfig, splatRadius: 0.04, splatForce: 9450, velocityDissipation: 0.9, exhaustColors: ["#facc15","#facc15","#facc15"] },
    { ...defaultMissileConfig, splatRadius: 0.04, splatForce: 9450, velocityDissipation: 0.9, exhaustColors: ["#facc15","#facc15","#facc15"] }
  ];
  const [visualShips, setVisualShips] = React.useState(defaultShipEffects);
  const visualShipsRef = React.useRef(visualShips);
  React.useEffect(() => { visualShipsRef.current = visualShips; }, [visualShips]);

  const [focusedEnemyId, setFocusedEnemyId] = React.useState<number | null>(null);

  const cameraScaleRef = React.useRef(1.0);
  const cameraXRef = React.useRef(0);
  const cameraYRef = React.useRef(0);
  
  const nexusStationsRef = React.useRef<{nx: number, ny: number}[]>([
      {nx: 0.08, ny: 0.92}, {nx: 0.25, ny: 0.72}, {nx: 0.92, ny: 0.08}, {nx: 0.72, ny: 0.25}
  ]);
  
  React.useEffect(() => {
     const load = () => {
         const stored = localStorage.getItem("splash_cursor_config");
         if (stored) {
             try {
                 const parsed = JSON.parse(stored);
                 if (parsed.arenaShips && Array.isArray(parsed.arenaShips)) {
                     setVisualShips(parsed.arenaShips);
                     visualShipsRef.current = parsed.arenaShips;
                 } else if (parsed.ships && Array.isArray(parsed.ships)) {
                     setVisualShips(parsed.ships);
                     visualShipsRef.current = parsed.ships;
                 }
                 if (parsed.missile) {
                     setMissileConfig(parsed.missile);
                     missileConfigRef.current = parsed.missile;
                 }
                 if (parsed.backgroundEffect) {
                     setBackgroundEffect(parsed.backgroundEffect);
                 }
             } catch(e) {}
         } else {
             fetch('/api/cms?key=splash_cursor_config')
                 .then(res => res.json())
                 .then(json => {
                     if (json.success && json.data) {
                         const parsed = json.data;
                         if (parsed.arenaShips && Array.isArray(parsed.arenaShips)) {
                             setVisualShips(parsed.arenaShips);
                             visualShipsRef.current = parsed.arenaShips;
                         }
                         if (parsed.missile) {
                             setMissileConfig(parsed.missile);
                             missileConfigRef.current = parsed.missile;
                         }
                     }
                 }).catch(err => console.error(err));
         }
         // Load the Arena's local debug hardware overrides
         const overrides = localStorage.getItem("splash_cursor_v3");
         if (overrides) {
             try {
                 const parsedOverrides = JSON.parse(overrides);
                 if (parsedOverrides.missile) {
                     setMissileConfig(parsedOverrides.missile);
                     missileConfigRef.current = parsedOverrides.missile;
                 }
             } catch(e) {}
         }
     };
     load(); // Initial load
     window.addEventListener("splashConfigUpdated", load);
     
     const handleStations = (e: any) => {
         if (e.detail && e.detail.stations) nexusStationsRef.current = e.detail.stations;
     };
     window.addEventListener("NEXUS_STATIONS_READY", handleStations);
     
     return () => {
         window.removeEventListener("splashConfigUpdated", load);
         window.removeEventListener("NEXUS_STATIONS_READY", handleStations);
     };
  }, []);

  // Hex Math helpers (Flat-topped)
  const R = 20; // Denser tactical grid (reduced from 90)
  const pixelToHex = (x: number, y: number) => {
      const q = (2/3 * x) / R;
      const r = (-1/3 * x + Math.sqrt(3)/3 * y) / R;
      let rx = Math.round(q), ry = Math.round(r), rz = Math.round(-q - r);
      const x_diff = Math.abs(rx - q), y_diff = Math.abs(ry - r), z_diff = Math.abs(rz - (-q - r));
      if (x_diff > y_diff && x_diff > z_diff) rx = -ry - rz;
      else if (y_diff > z_diff) ry = -rx - rz;
      return { q: rx, r: ry };
  };
  const hexToPixel = (q: number, r: number) => ({
      x: R * (3/2 * q),
      y: R * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  });

  // Setup loop
  React.useEffect(() => {
     if (!enemyBaseRef.current) {
         enemyBaseRef.current = { q: Math.floor(Math.random() * 8) + 2, r: Math.floor(Math.random() * 5) + 2 };
     }
     if (gameState === 'SETUP') {
         setupTimestampRef.current = Date.now();
         const timer = setInterval(() => {
             setCountdown(prev => {
                 if (prev <= 1) {
                     clearInterval(timer);
                     setGameState('PLAYING');
                     
                     // Fallback check: If the player didn't pick a base, assign one randomly on the left side
                     if (!playerBaseRef.current) {
                         playerBaseRef.current = { 
                             q: Math.floor(Math.random() * 4) + 2, 
                             r: Math.floor(Math.random() * 4) + 2 
                         };
                         setLogs(l => [...l, `Auto-deployed Command Center at [${playerBaseRef.current?.q}, ${playerBaseRef.current?.r}] due to timeout.`]);
                     }
                     
                     setLogs(l => [...l, 'COMBAT PHASE INITIATED! Fleet arriving on sector.']);
                     return 0;
                 }
                 return prev - 1;
             });
         }, 1000);
         return () => clearInterval(timer);
     }
  }, [gameState]);

  // Interaction router
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (stateRef.current === 'SETUP') {
          playerBaseRef.current = pixelToHex(x, y);
          enemyBaseRef.current = pixelToHex(rect.width - x, rect.height - y);
          
          // Clear trails once selected for visual clarity
          trailHexesRef.current.clear();
          
          setLogs(l => [...l, `Command center deployed at sector [${playerBaseRef.current?.q}, ${playerBaseRef.current?.r}]`]);
          return;
      }
      if (stateRef.current === 'PLAYING') {
          if (selectedShips.size > 0) {
              const invScale = 1.0 / Math.max(0.01, cameraScaleRef.current);
              const cx = rect.width / 2;
              const cy = rect.height / 2;
              const logicalX = (x - cx) * invScale + cx;
              const logicalY = (y - cy) * invScale + cy;
              
              const hex = pixelToHex(logicalX, logicalY);
              window.dispatchEvent(new CustomEvent('VANGUARD_ORDER', { detail: { rawX: logicalX, rawY: logicalY, q: hex.q, r: hex.r, selected: Array.from(selectedShips) }}));
          }
      }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Create a visual light trail when hovering during SETUP
      if (stateRef.current === 'SETUP' && !playerBaseRef.current) {
          const rect = e.currentTarget.getBoundingClientRect();
          const hex = pixelToHex(e.clientX - rect.left, e.clientY - rect.top);
          trailHexesRef.current.set(`${hex.q},${hex.r}`, { q: hex.q, r: hex.r, alpha: 1.0 });
      }
  };

  // Main Canvas Loop
  React.useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     
     let frameId = 0;
     let autoPilotTimer = 0;
     let engineTicks = 0;
     let gameOverTimer = 0;
     let tieBreakerTimer = 0;
     let w = canvas.width, h = canvas.height;
     const resize = () => {
         const p = canvas.parentElement;
         if (p) { 
             canvas.width = p.clientWidth; 
             canvas.height = p.clientHeight; 
             w = canvas.width; 
             h = canvas.height; 
         }
     };
     window.addEventListener('resize', resize);
     resize();

     const projectiles: Array<{ id: string, x: number, y: number, vel: {x: number, y: number}, angle: number, targetId: number | string, speed: number, damage: number, lifetime: number, color: string, ignitionDelay: number, sourceId: number, weaponType?: string }> = [];
     const explosionParticles: Array<{ x: number, y: number, vel: {x: number, y: number}, life: number, maxLife: number, color: string, radius: number }> = [];
     const debrisPieces: Array<{ x: number, y: number, vel: {x: number, y: number}, life: number, angle: number, rotSpeed: number, color: string, side: 'left' | 'right' | 'main' }> = [];
     const powerups: Array<{ id: string, type: 'speed' | 'heatseeking' | 'health', x: number, y: number, vel: {x: number, y: number}, angle: number, lifetime: number }> = [];
     const collectibleParticles: Array<{ x: number, y: number, vel: {x: number, y: number}, life: number, type: 'dust', color: string }> = [];
     const flares: Array<{ id: string, x: number, y: number, vel: {x: number, y: number}, life: number, team: number }> = [];
     
     let spawnPlatformAlpha = 1.0;
     let ships = [
         { id: 1, x: 0, y: -400, vel: {x: 0, y: 0}, thrustOn: false, angle: Math.PI/2, speed: 0.4, rotSpeed: 0.008, color: '#0088ff', alpha: 1, team: 1, state: 'DRIFT', target: null as any, currentHp: 10, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'JOUSTER', parts: { left: true, right: true, main: true }, cargo: 0 },
         { id: 2, x: 0, y: -400, vel: {x: 0, y: 0}, thrustOn: false, angle: Math.PI/2, speed: 0.35, rotSpeed: -0.005, color: '#0088ff', alpha: 1, team: 1, state: 'DRIFT', target: null as any, currentHp: 12, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'KITER', parts: { left: true, right: true, main: true }, cargo: 0 },
         { id: 3, x: 0, y: -400, vel: {x: 0, y: 0}, thrustOn: false, angle: Math.PI/2, speed: 0.425, rotSpeed: 0.012, color: '#0088ff', alpha: 1, team: 1, state: 'DRIFT', target: null as any, currentHp: 8, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'BRAWLER', parts: { left: true, right: true, main: true }, cargo: 0 },
         { id: 4, x: -346, y: 200, vel: {x: 0, y: 0}, thrustOn: false, angle: -Math.PI/6, speed: 0.325, rotSpeed: -0.006, color: '#facc15', alpha: 1, team: 2, state: 'DRIFT', target: null as any, currentHp: 10, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'FLANKER', parts: { left: true, right: true, main: true }, cargo: 0 },
         { id: 5, x: -346, y: 200, vel: {x: 0, y: 0}, thrustOn: false, angle: -Math.PI/6, speed: 0.375, rotSpeed: 0.007, color: '#facc15', alpha: 1, team: 2, state: 'DRIFT', target: null as any, currentHp: 10, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'DRIFTER', parts: { left: true, right: true, main: true }, cargo: 0 },
         { id: 6, x: -346, y: 200, vel: {x: 0, y: 0}, thrustOn: false, angle: -Math.PI/6, speed: 0.3, rotSpeed: -0.01, color: '#facc15', alpha: 1, team: 2, state: 'DRIFT', target: null as any, currentHp: 10, alive: true, hasDived: false, shotsFired: 0, cooldown: 0, kills: 0, magazine: 3, approachOffset: 0, navWaypoint: null as {x: number, y: number} | null, navPath: null as any, doctrine: 'SENTINEL', parts: { left: true, right: true, main: true }, cargo: 0 }
     ];
     // Filter simulation actors based on selected fleet
     ships = ships.filter(s => s.id <= 3 ? activeShipsRef.current.has(s.id) : activeShipsRef.current.has(s.id - 3));

     // Listen for UI orders
     const orderHandler = (e: any) => {
         const { rawX, rawY, q, r, selected, directTargetId } = e.detail;
         
         // 1. Raycast for Enemy Ship Hit
         let clickedEnemyId: number | null = directTargetId || null;
         if (!clickedEnemyId && rawX !== undefined && rawY !== undefined) {
             ships.forEach(s => {
             if (s.team === 2 && s.alpha > 0) {
                 const dx = Math.abs(s.x - rawX), wrapDx = Math.min(dx, w - dx);
                 const dy = Math.abs(s.y - rawY), wrapDy = Math.min(dy, h - dy);
                 if (Math.hypot(wrapDx, wrapDy) < 60) {
                     clickedEnemyId = s.id;
                 }
             }
         });
         }

         if (clickedEnemyId) {
             ships.forEach(s => {
                 if (selected.includes(s.id)) {
                     s.state = 'INTERCEPT';
                     s.target = { type: 'ship', id: clickedEnemyId };
                     // Retain base physical speed; ONLY alter turning path!
                 }
             });
         } else if (q !== undefined && r !== undefined) {
             const targetPos = hexToPixel(q, r);
             ships.forEach(s => {
                 if (selected.includes(s.id)) {
                     s.state = 'INTERCEPT';
                     s.target = { type: 'hex', x: targetPos.x, y: targetPos.y, q, r };
                 }
             });
         }
     };
     window.addEventListener('VANGUARD_ORDER', orderHandler);
     
     // Listen for UI override buttons (X and O)
     const overrideHandler = (e: any) => {
         const { selected, doctrine } = e.detail;
         ships.forEach(s => {
             if (selected.includes(s.id)) {
                 s.doctrine = doctrine;
                 s.state = 'INTERCEPT'; // Force them to immediately retrigger movement logic to clear DRIFT status
                 if (!s.target) s.target = null as any; // Trigger auto-acquire on next loop explicitly
                 
                 // Cinematic Arcade Overrides!
                 if (matchModeRef.current === 'JOUSTING') {
                     if (doctrine === 'KITER') { // "O" Retreat Button
                         (s as any).evasionTimer = 90; // Lock banked evasive turn for 1.5s
                         
                         // Manually fire a side-winder tracking shot if we have a locked enemy target!
                         if (s.target && s.target.type === 'ship' && s.magazine > 0) {
                             const tgtPlane = ships.find(e => e.id === s.target.id);
                             if (tgtPlane) {
                                  const shotAngle = Math.atan2(tgtPlane.y - s.y, tgtPlane.x - s.x) + Math.PI/2;
                                  projectiles.push({
                                      id: 'p_' + Math.random().toString(36).substr(2, 9),
                                      x: s.x, y: s.y,
                                      vel: { x: s.vel.x + Math.cos(shotAngle - Math.PI/2) * 5, y: s.vel.y + Math.sin(shotAngle - Math.PI/2) * 5 }, 
                                      angle: shotAngle,
                                      targetId: tgtPlane.id,
                                      speed: (missileConfigRef.current.projectileSpeed ?? 3.5) * 1.5, 
                                      damage: shipConfigsRef.current[s.id].attackDamage,
                                      lifetime: 2000, 
                                      color: s.color === '#0088ff' ? '#fff' : '#fbd38d', 
                                      ignitionDelay: 0, 
                                      sourceId: s.id
                                  });
                                  s.magazine--;
                             }
                         }
                     } else if (doctrine === 'BRAWLER') {
                         (s as any).evasionTimer = 0; // Lock nose strictly onto enemy
                         
                         let nearestEnemyId: number | string = -1;
                         let bestDist = Infinity;
                         
                         if (s.state !== 'SCAVENGE') {
                             ships.forEach(e => {
                                 if (e.alive && e.team !== s.team) {
                                     // Prevent target logic if scavenging
                                     const dist = Math.hypot(e.x - s.x, e.y - s.y);
                                     if (dist < bestDist) { bestDist = dist; nearestEnemyId = e.id; }
                                 }
                             });
                         }
                         if (nearestEnemyId !== -1) {
                             s.target = { type: 'ship', id: nearestEnemyId };
                             s.state = 'INTERCEPT';
                         }
                     }
                 }
                 
             }
         });
     };
     window.addEventListener('VANGUARD_OVERRIDE', overrideHandler);
     
     const flareHandler = () => {
         ships.forEach(s => {
             if (s.team === 1 && s.alive) {
                 // Set up a rapid countermeasure dispenser ("bam, bam, bam") 
                 // ejecting particles sequentially rather than all at once.
                 let flareCount = 0;
                 const maxFlares = 15; // Dispense 15 sequential flares
                 
                 const dispenser = setInterval(() => {
                     if (!s.alive) { clearInterval(dispenser); return; }
                     // Calculate current tail coordinate since ship is moving
                     const tailX = s.x + Math.cos(s.angle + Math.PI/2) * 20; 
                     const tailY = s.y + Math.sin(s.angle + Math.PI/2) * 20;
                     
                     // Drop them out smoothly and slowly for a short drift using tangential angles
                     const baseSpeed = 1.0;
                     const spd = baseSpeed + Math.random() * 3;
                     const targetVecL = s.angle + Math.PI/2 + Math.PI/3.5; // Left burst
                     const targetVecR = s.angle + Math.PI/2 - Math.PI/3.5; // Right burst
                     
                     // Shoot out Left Side
                     flares.push({ 
                         id: 'f_' + Math.random().toString() + 'L', 
                         x: tailX, y: tailY, 
                         vel: { x: Math.cos(targetVecL)*spd, y: Math.sin(targetVecL)*spd }, 
                         life: 150, team: s.team 
                     });
                     
                     // Shoot out Right Side
                     flares.push({ 
                         id: 'f_' + Math.random().toString() + 'R', 
                         x: tailX, y: tailY, 
                         vel: { x: Math.cos(targetVecR)*spd, y: Math.sin(targetVecR)*spd }, 
                         life: 150, team: s.team 
                     });
                     
                     flareCount++;
                     if (flareCount >= maxFlares) clearInterval(dispenser);
                 }, 60); // Dispense one every 60ms rapidly
             }
         });
     };
     window.addEventListener('VANGUARD_FLARE', flareHandler);

     const getSubmergedTint = (wx: number, wy: number) => {
         if (arenaBackgroundRef.current !== 'nexus') return 0;
         let maxInt = 0;
         const cw = canvasRef.current ? canvasRef.current.width : 1920;
         const ch = canvasRef.current ? canvasRef.current.height : 1080;
         for (const st of nexusStationsRef.current) {
             const mx = st.nx * cw - cw / 2;
             const my = (1.0 - st.ny) * ch - ch / 2;
             const dist = Math.hypot(wx - mx, wy - my);
             // Standard fluid radii is ~130px depending on screen res
             if (dist < 150) {
                 const inty = 1.0 - (dist / 150);
                 if (inty > maxInt) maxInt = inty;
             }
         }
         return maxInt;
     };

     const drawShip = (x: number, y: number, angle: number, color: string, alpha: number, isSelected: boolean, currentHp: number, maxHp: number, team: number = 2, parts: {left?: boolean, right?: boolean, main?: boolean} = {left: true, right: true, main: true}) => {
         let r = 0, g = 136, b = 255;
         if (color === '#facc15') { r = 250; g = 204; b = 21; }
         else if (color === '#0088ff') { r = 0; g = 136; b = 255; }
         else if (color === '#fb923c') { r = 251; g = 146; b = 60; }
         else if (color === '#4ade80') { r = 74; g = 222; b = 128; }
         else if (color === '#c084fc') { r = 192; g = 132; b = 252; }
         
         ctx.save();
         
         const submergence = getSubmergedTint(x, y);
         ctx.globalAlpha = alpha * (1.0 - submergence * 0.5); // Fade natively when sinking
         
         ctx.translate(x, y);
         
         // Unified Structural Integrity HUD (Non-Rotating GUI)
         const structuralMax = maxHp + (team === 1 ? 6 : 3);
         const currentStructural = currentHp + (team === 1 ? ((parts.left?3:0)+(parts.right?3:0)) : (parts.main?3:0));
         const hpPct = Math.max(0, currentStructural / structuralMax);
         
         ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
         ctx.fillRect(-8, -22, 16, 3); // Unified wide background
         ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#facc15" : "#facc15";
         ctx.fillRect(-8, -22, 16 * hpPct, 3); // Unified fluid physical life indicator
         ctx.rotate(angle);
         
         // ── UNIVERSAL SHIP GLOW (OPTIMIZED ANIMATED CANVAS TEXTURE) ──
         // This creates a fast native gradient glow without heavy shadowBlur post-processing
         const pulse = Math.sin(Date.now() / 250) * 0.5 + 0.5;
         const glowRadius = 25 + pulse * 5;
         const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRadius);
         grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.4 + pulse * 0.3})`);
         grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
         ctx.beginPath();
         ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
         ctx.fillStyle = grad;
         ctx.fill();
         
         // ── UNIVERSAL SHIP 3 (WRAITH) INJECTION ──
         
         // Under-Slung Mounts & Thrusters
         if (parts.left) { // Left Side Mount
             ctx.beginPath();
             ctx.roundRect(-18, 5, 8, 16, 4);
             ctx.fillStyle = "#fff"; ctx.fill();
             ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
         }
         
         if (parts.right) { // Right Side Mount
             ctx.beginPath();
             ctx.roundRect(10, 5, 8, 16, 4);
             ctx.fillStyle = "#fff"; ctx.fill();
             ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
         }
         
         if (team !== 1 && parts.main) { // Central Mount / Main Thruster
             ctx.beginPath();
             ctx.roundRect(-8, 12, 16, 12, 4);
             ctx.fillStyle = "#fff"; ctx.fill();
             ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
         }
         
         // Main Engine/Hull Object (Rendered over the attachments)
         ctx.beginPath();
         ctx.roundRect(-10, -20, 20, 40, 10);
         ctx.fillStyle = "#fff"; ctx.fill();
         ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
         
         // Inner LED indicator (replacing the large glass pill)
         ctx.beginPath();
         ctx.arc(0, -5, 2.5, 0, Math.PI * 2);
         ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
         ctx.fill();
         
         ctx.beginPath();
         ctx.arc(0, -5, 5, 0, Math.PI * 2);
         ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
         ctx.fill();
         
         if (isSelected) {
             ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2);
             ctx.strokeStyle = "rgba(255, 215, 0, 0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
         }
         
         
         if (isSelected) {
             // 300px Firing Range (Inner Ring)
             ctx.beginPath();
             ctx.arc(0, 0, 300, 0, Math.PI*2);
             ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
             ctx.setLineDash([5, 10]);
             ctx.lineWidth = 1;
             ctx.stroke();
             
             // 600px Radar Acquisition (Outer Ring)
             ctx.beginPath();
             ctx.arc(0, 0, 600, 0, Math.PI*2);
             ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
             ctx.setLineDash([10, 20]);
             ctx.lineWidth = 1;
             ctx.stroke();
             ctx.setLineDash([]); // Reset dash for rest of canvas
         }
         
         // --- Fast Submersion Liquid Overlay ---
         if (submergence > 0) {
             ctx.globalCompositeOperation = "source-atop"; // Only dye the ship pixels, explicitly coloring it dark purple
             ctx.beginPath();
             ctx.arc(0, 0, 22, 0, Math.PI * 2);
             ctx.fillStyle = `rgba(90, 0, 150, ${submergence})`; // Solid Dark Purple
             ctx.fill();
             ctx.globalCompositeOperation = "source-over"; // Restore standard
         }
         
         ctx.restore();
     };

     const drawHexGrid = (fw: number, fh: number, state: string) => {
         const hSpace = 1.5 * R, vSpace = Math.sqrt(3) * R;
         ctx.save();
         ctx.lineWidth = 5; // Requested 5px thickness
         ctx.beginPath();
         const cols = Math.ceil(fw / hSpace) + 1, rows = Math.ceil(fh / vSpace) + 1;
         const halfCols = Math.floor(cols / 2);
         const halfRows = Math.floor(rows / 2);
         
         const innerR = R * 0.88; // Draw structurally inside the bounds
         
         for (let col = -halfCols; col <= halfCols; col++) {
             for (let row = -halfRows; row <= halfRows; row++) {
                 const x = col * hSpace;
                 const y = row * vSpace + (Math.abs(col) % 2 === 1 ? vSpace / 2 : 0);
                 for (let i = 0; i < 6; i++) {
                     const angle = (Math.PI / 3) * i;
                     if (i === 0) ctx.moveTo(x + innerR * Math.cos(angle), y + innerR * Math.sin(angle));
                     else ctx.lineTo(x + innerR * Math.cos(angle), y + innerR * Math.sin(angle));
                 }
                 ctx.closePath();
             }
         }
         
         if (state === 'SETUP') {
             // In SETUP mode, reveal the full tactical grid
             ctx.strokeStyle = "rgba(255, 0, 255, 0.4)"; // Magenta highlight 
             ctx.stroke();
         } else {
             // In PLAYING mode, establish global white transparent grid uniformly 
             ctx.strokeStyle = "rgba(255, 0, 255, 0.15)"; // Soft Magenta highlight
             ctx.stroke();
         }
         
         ctx.restore();
     };
     
     const drawBaseHex = (q: number, r: number, color: string, icon: string) => {
         const {x, y} = hexToPixel(q, r);
         ctx.save(); ctx.beginPath();
         for (let i = 0; i < 6; i++) {
             const px = x + R * Math.cos(Math.PI/3 * i), py = y + R * Math.sin(Math.PI/3 * i);
             if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
         }
         ctx.closePath(); 
         
         // CPU OPTIMIZATION: Shadows forcefully removed
         ctx.fillStyle = color; 
         ctx.fill();
         
         ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; 
         ctx.lineWidth = 2;
         ctx.stroke(); 

         if (icon) {
             // shadow removed
             ctx.fillStyle = "#fff";
             ctx.font = "40px Orbitron";
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillText(icon, x, y);
         }

         ctx.restore();
     };

     let initializedPositions = false;

     const loop = () => {
         const loopStartTime = performance.now();
         // --- GLOBAL FRAME RESOURCE CACHE ---
         const engineRgbDynamic = missileConfigRef.current.exhaustColors ? getEngineColor(missileConfigRef.current.exhaustColors, performance.now()) : {r: 0.1, g: 0.8, b: 1.0};
         
         // 3x Intensity boost for SplashCursor (reduced from 20x to optimize/reduce excessive post-processing glow under the ship)
         engineRgbDynamic.r *= 3.0;
         engineRgbDynamic.g *= 3.0;
         engineRgbDynamic.b *= 3.0;
         
         splashEmitRef.current.length = 0; // Fix OOM Memory Leak: purge stale emissions from last frame while preserving the object reference for SplashCursor's React listener!
         
         const now = Date.now();
         const dt = now - lastFrameTimeRef.current;
         lastFrameTimeRef.current = now;
         if (dt > 0) fpsRef.current = Math.round(1000 / dt);
         if (stateRef.current === 'PLAYING' && !initializedPositions) {
             // Spread the 3 spawning rings out significantly across the arena (Equilateral Triangle points at R=400)
             const platformOffsets = [ { dx: 0, dy: -400 }, { dx: -346, dy: 200 }, { dx: 346, dy: 200 } ];
             
             // Put Team 1 explicitly in the top platform, Team 2 in the bottom-left
             const arrangeTeam = (teamIndex: number, platformOffset: { dx: number, dy: number }) => {
                 const angleToCenter = Math.atan2(0 - platformOffset.dy, 0 - platformOffset.dx);
                 ships.filter(s => s.team === teamIndex).forEach((s, idx) => {
                     const dist = 60; // Spacing
                     let fwd = 0, rt = 0;
                     if (idx === 1) { fwd = -dist; rt = -dist; } // Back left
                     else if (idx === 2) { fwd = -dist; rt = dist; }  // Back right
                     else if (idx === 3) { fwd = -dist * 2; rt = 0; } // Diamond back
                     else if (idx === 4) { fwd = -dist * 2; rt = -dist * 2; }
                     else if (idx === 5) { fwd = -dist * 2; rt = dist * 2; }
                     
                     s.x = platformOffset.dx + fwd * Math.cos(angleToCenter) - rt * Math.sin(angleToCenter);
                     s.y = platformOffset.dy + fwd * Math.sin(angleToCenter) + rt * Math.cos(angleToCenter);
                     s.angle = angleToCenter;
                 });
             };

             arrangeTeam(1, platformOffsets[0]);
             arrangeTeam(2, platformOffsets[1]);
             
             // Setup ship velocities
             ships.forEach(s => {
                 s.vel = {x: 0, y: 0};
                 s.thrustOn = false;
             });

             arenaRadiusRef.current = Math.max(w, h) * 0.5; // Full screen circle
             
             // IMPORTANT: Only start the shrink timer once! DO NOT overwrite it if the loop restarts
             if (arenaStartTimestampRef.current === 0) {
                 arenaStartTimestampRef.current = Date.now(); 
             }
             
             initializedPositions = true;
         }

         engineTicks++;
         
         // Dynamic Arena Safe Zone Shrink (5 minutes / 300s)
         if (arenaStartTimestampRef.current > 0) {
             const elapsedGameTime = Date.now() - arenaStartTimestampRef.current;
             const shrinkDuration = 5 * 60 * 1000;
             // Pure linear battle-royale shrink
             const shrinkRatio = Math.max(0, Math.min(1.0, elapsedGameTime / shrinkDuration));
             
             const startRadius = Math.max(w, h) * 0.5;
             const endRadius = 400; // Final combat box (800x800px physical total, large enough to prevent clustering bugs)
             arenaRadiusRef.current = startRadius - (startRadius - endRadius) * shrinkRatio;
         } else {
             arenaRadiusRef.current = Math.max(w, h) * 0.5;
         }

         ctx.clearRect(0, 0, w, h);
         
         // 1. Base Deep Space Background
         // (Disabled explicit gradient fill on the 2D canvas to allow the WebGL Fluid Wake Engine on zIndex 1 to shine through! The gradient is handled natively by the parent CSS div)
         // const domGrad = ctx.createLinearGradient(0, 0, w, h);
         // domGrad.addColorStop(0, "#050511");
         // domGrad.addColorStop(0.5, "#1a1a40");
         // domGrad.addColorStop(1, "#0d0d2b");
         // ctx.fillStyle = domGrad;
         // ctx.fillRect(0, 0, w, h);
         
         // --- 1.2 DYNAMIC CINEMATIC CAMERA SYSTEM ---
         let targetScale = 1.0;
         let targetCamX = 0;
         let targetCamY = 0;
         
         if (stateRef.current === 'PLAYING') {
             let minX = w * 2, maxX = -w, minY = h * 2, maxY = -h;
             let activeCount = 0;
             ships.forEach(s => {
                 if (s.alive) {
                     if (s.x < minX) minX = s.x;
                     if (s.x > maxX) maxX = s.x;
                     if (s.y < minY) minY = s.y;
                     if (s.y > maxY) maxY = s.y;
                     activeCount++;
                 }
             });
             
             if (activeCount > 0) {
                 const midpointX = (minX + maxX) / 2;
                 const midpointY = (minY + maxY) / 2;
                 
                 // Center absolute origin. Panning disabled to ensure the Battle Royale ring remains flawlessly centered and stable against the screen!
                 targetCamX = 0;
                 targetCamY = 0;
                 
                 const furthestX = Math.max(Math.abs(minX), Math.abs(maxX));
                 const furthestY = Math.max(Math.abs(minY), Math.abs(maxY));

                 const edgeBuffer = 120; // Only trigger zoom if ships reach within 120px of monitor edge
                 
                 const scaleX = (w / 2) / (furthestX + edgeBuffer);
                 const scaleY = (h / 2) / (furthestY + edgeBuffer);
                 
                 // Dynamic zoom out: allow the camera to unrestrictedly zoom out to fit all ships, but cap maximum zoom-in at 1.0 (no extreme closeups)
                 targetScale = Math.max(0.2, Math.min(1.0, scaleY, scaleX));
             }
         }
         
         // Smoothly LERP the camera values (ultra relaxed speed so it glides imperceptibly)
         cameraScaleRef.current += (targetScale - cameraScaleRef.current) * 0.01;
         cameraXRef.current += (targetCamX - cameraXRef.current) * 0.03;
         cameraYRef.current += (targetCamY - cameraYRef.current) * 0.03;
         
         ctx.save();
         // Push focal point using dynamic panning coordinates
         ctx.translate(w/2, h/2);
         ctx.scale(cameraScaleRef.current, cameraScaleRef.current);
         ctx.translate(-cameraXRef.current, -cameraYRef.current);
         
         // Draw the Full Screen Arena Polygon Boundary (Centered on 0,0)
         
         if (showGridRef.current) {
              drawHexGrid(w * 4, h * 4, stateRef.current);
         }
         
         // Squeezing darkness wash removed per user request (boundary floats transparently)

         // Animated Electricity Ring - Long Smooth Standing Waves
         const r = arenaRadiusRef.current;
         const segments = Math.min(120, Math.max(80, Math.floor(r * 0.2))); // Prevent CPU stroke recursion on complex polygons
         const time = engineTicks * 0.05; // Moderate speed for graceful movement

         // Pre-calculate the exact geometry once so all strokes perfectly stack
         ctx.beginPath();
         // Hard enforce rounded joins to prevent Miter calculation CPU explosions!
         ctx.lineJoin = "round";
         ctx.lineCap = "round";
         
         for (let i = 0; i <= segments; i++) {
             const angle = (i / segments) * Math.PI * 2;
             
             // Long smooth spatial waves (low frequency: 12-18 peaks) with temporal oscillation.
             const wave1 = Math.sin(angle * 12) * Math.cos(time * 1.5);
             const wave2 = Math.cos(angle * 18) * Math.sin(time * 2.0);
             const wave3 = Math.sin(angle * 7) * Math.cos(time * 0.8);
             
             // Visibly larger amplitude (6-13px total) so massive waves have depth!
             let noise = (wave1 * 6.0) + (wave2 * 4.0) + (wave3 * 3.0);
                         
             const jR = r + noise;
             const px = Math.cos(angle) * jR;
             const py = Math.sin(angle) * jR;

             if (i === 0) ctx.moveTo(px, py);
             else ctx.lineTo(px, py);
         }
         ctx.closePath();
         
         // 1. Electric Blue Aura
         ctx.strokeStyle = "rgba(0, 100, 255, 0.20)";
         ctx.lineWidth = 10;
         ctx.stroke();

         // 2. Focused Electric Blue 
         ctx.strokeStyle = "rgba(0, 180, 255, 0.55)";
         ctx.lineWidth = 5;
         ctx.stroke();

         // 3. Laser White Core
         ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
         ctx.lineWidth = 1.5;
         ctx.stroke();
         
         // 1.5. Yellow Sun Gradient (Environment wash)
         // 1.5. Yellow Sun Gradient (removed to save framerate)
         
         // 2. Wrap-Around Particle Stars
         ctx.save();
         // Hide stars in arena per user request
         /* ctx.fillStyle = "#e2e8f0";
         for (const star of starsRef.current) {
             ctx.globalAlpha = star.a * 0.7;
             ctx.fillRect(star.x % w, star.y % h, star.r, star.r);
         }
         ctx.globalAlpha = 1; */
         
         ctx.restore();
         
         // Fixed Spawn Platforms (Active during PLAYING or SETUP)
         const isSetup = stateRef.current === 'SETUP';
         if (stateRef.current === 'PLAYING' || isSetup) {
             const platformOffsets = [ { dx: 0, dy: -400 }, { dx: -346, dy: 200 }, { dx: 346, dy: 200 } ];
             
             ctx.save();
             ctx.globalAlpha = 0.4;
             ctx.lineWidth = 4;
             
             ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Neutral/Universal Launch Pad Color
             
             const elapsed = isSetup ? (Date.now() - setupTimestampRef.current) : 3000;
             
             platformOffsets.forEach((off, idx) => {
                 const startTime = idx * 500; // 500ms sequential offset across platforms
                 const animDuration = 800;    // 800ms line draw fill
                 
                 let arcLen = Math.PI * 2;
                 if (isSetup) {
                     const t = Math.max(0, elapsed - startTime);
                     // EaseOut cubic equivalent roughly 
                     const p = Math.min(1.0, t / animDuration);
                     const eased = 1 - Math.pow(1 - p, 3);
                     arcLen = (Math.PI * 2) * eased;
                 }
                 
                 if (arcLen > 0) {
                     ctx.beginPath();
                     ctx.arc(off.dx, off.dy, 120, -Math.PI / 2, -Math.PI / 2 + arcLen);
                     ctx.stroke();
                 }
             });
             ctx.restore();
         }
         
         // Legacy yellow sun and star generation preserved but Base Hex Removed
         
         // --- POWERUPS ENGINE ---
         if (stateRef.current === 'PLAYING' && Math.random() < 0.003 && powerups.length < 8) {
             const types: ('speed' | 'heatseeking' | 'health')[] = ['speed', 'heatseeking', 'health'];
             powerups.push({
                 id: 'pu_' + Math.random().toString(36).substr(2, 9),
                 type: types[Math.floor(Math.random() * types.length)],
                 x: Math.random() * w, y: Math.random() * h,
                 vel: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2 },
                 angle: 0,
                 lifetime: 900 // 15 seconds
             });
         }
         
         for (let i = powerups.length - 1; i >= 0; i--) {
             const pu = powerups[i];
             pu.angle += 0.05;
             pu.x += pu.vel.x;
             pu.y += pu.vel.y;
             pu.lifetime--;
             
             // Wrap around board constraints
             if (pu.x < 0) pu.x = w; if (pu.x > w) pu.x = 0;
             if (pu.y < 0) pu.y = h; if (pu.y > h) pu.y = 0;
             
             // Draw
             ctx.save();
             ctx.translate(pu.x, pu.y);
             ctx.rotate(pu.angle);
             ctx.font = "24px sans-serif";
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             let icon = "⚡️";
             let glow = "#fbd38d";
             if (pu.type === 'speed') { icon = "⚡️"; glow = "#0088ff"; }
             if (pu.type === 'heatseeking') { icon = "🔥"; glow = "#facc15"; }
             if (pu.type === 'health') { icon = "💊"; glow = "#4ade80"; }
             // CPU OPTIMIZATION: Shadows forcefully removed
             // Slow pulse down to 15 seconds lifetime based decay
             ctx.globalAlpha = Math.min(1.0, pu.lifetime / 100); 
             ctx.fillText(icon, 0, 0);
             ctx.restore();
             
             if (pu.lifetime <= 0) {
                 powerups.splice(i, 1);
                 continue;
             }
             
             let collected = false;
             ships.forEach((s: any) => {
                 if (s.alive && Math.hypot(s.x - pu.x, s.y - pu.y) < 30) {
                     if (pu.type === 'health') {
                         const maxHp = shipConfigsRef.current?.[s.id]?.hp || 10;
                         s.currentHp = Math.min(maxHp, s.currentHp + maxHp * 0.25);
                     }
                     if (pu.type === 'speed') s.speedTimer = 180; // 3 seconds
                     if (pu.type === 'heatseeking') s.heatSeekTimer = 300; // 5 seconds
                     collected = true;
                     // Spark burst
                     for(let k=0; k<10; k++){
                         explosionParticles.push({
                             x: pu.x, y: pu.y, vel: { x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10 },
                             life: 1.0, maxLife: 1.0, radius: 2, color: glow
                         });
                     }
                 }
             });
             if (collected) { powerups.splice(i, 1); continue; }
         }
         if (stateRef.current === 'SETUP') {
             ships.forEach((s) => {
                 const cfg = shipConfigsRef.current[s.id];
                 const isSel = selectedShipsRef.current.has(s.id);
                 const blink = Math.sin(Date.now() / 150) * 0.5 + 0.5;
                 drawShip(s.x, s.y, s.angle, s.color, blink, isSel, s.currentHp, cfg.hp, s.team, s.parts);
             });
         }

         if (stateRef.current === 'PLAYING') {
             ships.forEach(s => s.alpha = 1.0);

             ships.forEach((s, idx) => {
                 if (!s.alive) return; // Discard dead ships completely
                 const cfg = shipConfigsRef.current[s.id]; // Access real-time UI physics constants
                 
                 // Boids Group Interaction Terminated
                 

                 // Threat Awareness Core
                 let isHunted: any = ships.find(att => att.alive && att.state === 'INTERCEPT' && att.target && att.target.type === 'ship' && att.target.id === s.id);
                 if (!isHunted) isHunted = projectiles.find(p => p.targetId === s.id);
                 let isLinedUp = false;
                 
                 // --- PRISTINE ASTEROIDS PURE FLIGHT ENGINE OVERRIDE APPLIED GLOBALLY ---
                     s.state = 'INTERCEPT'; // Force into logic processing state
                     s.target = null as any; // Strip autonomous targets natively!

                     const pCfg = { turnSpeed: 0.009, thrustPower: 0.021, friction: 0.98 };
                     // Enemies have their own autonomous AI state completely disconnected from the player HUD
                     let currentCommand = 'ROVE';
                     if (s.team === 1) {
                         currentCommand = playerCommandRef.current;
                     } else {
                         if ((s as any).enemyCommandTimer === undefined || (s as any).enemyCommandTimer <= 0) {
                             (s as any).enemyCommandTimer = 180 + Math.random() * 300; 
                             const r = Math.random();
                             if (r < 0.5) (s as any).enemyCommand = 'DIVE';
                             else if (r < 0.8) (s as any).enemyCommand = 'ROVE';
                             else (s as any).enemyCommand = 'RETREAT';
                         } else {
                             (s as any).enemyCommandTimer--;
                         }
                         currentCommand = (s as any).enemyCommand || 'ROVE';
                     }

                     // --- 1. RADAR ACQUISITION (Radius 1 = 600px, Radius 2 = 300px) ---
                     let closestEnemy: any = null;
                     let closestDist = Infinity;
                     ships.forEach(e => {
                         if (e.team !== s.team && e.alive) {
                             // Standard Euclidean distance
                             let dx = Math.abs(e.x - s.x);
                             let dy = Math.abs(e.y - s.y);
                             const dist = Math.hypot(dx, dy);
                             if (dist < closestDist) { closestDist = dist; closestEnemy = e; }
                         }
                     });

                     const inRadius1 = closestDist <= 600; // Locates targets
                     const inRadius2 = closestDist <= 300; // Fire range

                     // --- 2. CINEMATIC STATE MACHINE ---
                     let targetAngle = s.angle;
                     let engineOn = false;

                     if (s.state === 'ROVE' || s.state === 'DRIFT' || s.state === 'SCAVENGE') {
                         
                         if (s.state === 'SCAVENGE') {
                             // Scavenge mode forcefully seeks nearest Dust particles
                             let nearestDust = null;
                             let dustDist = Infinity;
                             for (const cp of collectibleParticles) {
                                 if (((cp as any).pickupDelay || 0) > 0 && (cp as any).ownerId === s.id) continue;
                                 const d = Math.hypot(cp.x - s.x, cp.y - s.y);
                                 if (d < dustDist) { dustDist = d; nearestDust = cp; }
                             }
                             if (nearestDust) {
                                 targetAngle = Math.atan2((nearestDust as any).y - s.y, (nearestDust as any).x - s.x);
                                 engineOn = true;
                             } else {
                                 targetAngle = (s as any).roamAngle;
                                 engineOn = true;
                             }
                         } else if (s.state === 'DRIFT') {
                             engineOn = false;
                         } else {
                             targetAngle = (s as any).roamAngle;
                             engineOn = true;
                         }
                     } else if (currentCommand === 'DIVE') {
                         if (closestEnemy) {
                             targetAngle = Math.atan2(closestEnemy.y - s.y, closestEnemy.x - s.x) + Math.PI/2;
                         }
                         engineOn = true; // Speed up to full speed
                     } else if (currentCommand === 'RETREAT') {
                         if (closestEnemy) {
                             targetAngle = Math.atan2(closestEnemy.y - s.y, closestEnemy.x - s.x) - Math.PI/2; // Veer away exactly opposite
                         } else {
                             targetAngle = (s as any).roamAngle || s.angle;
                         }
                         engineOn = true;
                         
                         // Go and rove if safely out of Radius 1
                         if (!inRadius1) {
                             playerCommandRef.current = 'ROVE';
                             window.dispatchEvent(new CustomEvent('SYNC_UI_COMMAND', { detail: 'ROVE' }));
                         }
                     } else if (currentCommand === 'ROVE') {
                         if ((s as any).roamAngle === undefined) (s as any).roamAngle = Math.random() * Math.PI * 2;
                         if (Math.random() < 0.005) (s as any).roamAngle = Math.random() * Math.PI * 2;
                         targetAngle = (s as any).roamAngle;
                         engineOn = true;
                     }
                     
                     // --- 2. THEORETICAL CIRCLE BOUNDARY REPULSION ---
                     let avoidX = 0, avoidY = 0;
                     const softRadius = Math.max(50, arenaRadiusRef.current - 250); // Ensure soft-repel radius never goes negative causing physics collapse
                     let wallAvoidDepth = 0;
                     const distFromCenter = Math.hypot(s.x, s.y);
                     
                     if (distFromCenter > softRadius) {
                         const depth = distFromCenter - softRadius;
                         const pullMagnitude = depth; // Stronger push the further out
                         const centerAngle = Math.atan2(-s.y, -s.x);
                         avoidX = Math.cos(centerAngle) * pullMagnitude;
                         avoidY = Math.sin(centerAngle) * pullMagnitude;
                         wallAvoidDepth = depth / 250;
                     }
                     
                     if (avoidX !== 0 || avoidY !== 0) {
                         const wallAngle = Math.atan2(avoidY, avoidX) + Math.PI/2;
                         let diff = wallAngle - targetAngle;
                         while (diff > Math.PI) diff -= Math.PI * 2;
                         while (diff < -Math.PI) diff += Math.PI * 2;
                         
                         // Scale the avoidance priority cleanly
                         // wallAvoidDepth already calculated dynamically above
                         
                         // Modulate banking angle dynamically! 
                         targetAngle += diff * wallAvoidDepth * 0.95; 
                         
                         // Re-calibrate the roving compass so it doesn't immediately ping-pong back into the wall
                         if (currentCommand === 'ROVE') (s as any).roamAngle = targetAngle;
                     }

                     // --- 3. AERODYNAMIC STEERING (Water over the rudder) ---
                     const currentSpeed = Math.hypot(s.vel.x, s.vel.y);
                     let steerAuthority = Math.max(0.15, Math.min(1.0, currentSpeed / 1.0));
                     let workingEngines = (s.parts.left ? 1 : 0) + (s.parts.right ? 1 : 0) + (s.team !== 1 && s.parts.main ? 1 : 0);
                     let mEngines = s.team === 1 ? 2 : 3;
                     steerAuthority *= Math.max(0.3, workingEngines / mEngines);
                     
                     if (steerAuthority > 0) {
                         let diff = targetAngle - s.angle;
                         // Normalize angle difference computationally to [-PI, PI]
                         while (diff > Math.PI) diff -= Math.PI * 2;
                         while (diff < -Math.PI) diff += Math.PI * 2;
                         
                         // If trapped against a wall, exponentially boost steering authority up to 4x normal speed!
                         const emergencySteer = 1.0 + (wallAvoidDepth * 3.0);
                         const turnRate = pCfg.turnSpeed * steerAuthority * emergencySteer;
                         
                         if (Math.abs(diff) < turnRate) s.angle = targetAngle;
                         else s.angle += Math.sign(diff) * turnRate;
                     }

                     // --- 4. ENGINE THRUST DYNAMICS ---
                     let workingEngineCount = (s.parts.left ? 1 : 0) + (s.parts.right ? 1 : 0) + (s.team !== 1 && s.parts.main ? 1 : 0);
                     let engineDead = workingEngineCount === 0;
                     (s as any).knocked = engineDead; // Store knocked state
                     let speedMult = engineDead ? 0.0 : ((s.team === 1 && workingEngineCount === 1) ? 0.6 : Math.max(0.3, workingEngineCount / (s.team === 1 ? 2 : 3)));

                     s.thrustOn = engineDead ? false : engineOn;
                     if (engineDead) {
                         speedMult = 0; // Disabled, no natural health drain anymore
                     }
                     
                     // --- MISSING PART SPARKS (Bleeding electrical fires from damaged ship) ---
                     if (engineTicks % 3 === 0 || ((s as any).knocked && engineTicks % 1 === 0)) {
                         const thrustAngle = s.angle - Math.PI/2;
                         const perpX = Math.cos(thrustAngle + Math.PI/2) * 14; 
                         const perpY = Math.sin(thrustAngle + Math.PI/2) * 14;
                         const backX = s.x - Math.cos(s.angle) * 15;
                         const backY = s.y - Math.sin(s.angle) * 15;
                         
                         // If knocked, spew thick wild sparks continuously
                         if ((s as any).knocked) {
                             if (engineTicks % 5 === 0) {
                                 for (let x = 0; x < 2; x++) {
                                     explosionParticles.push({ x: s.x + (Math.random()-0.5)*20, y: s.y + (Math.random()-0.5)*20, vel: { x: s.vel.x*0.5 + (Math.random()-0.5)*6, y: s.vel.y*0.5 + (Math.random()-0.5)*6 }, life: 0.6 + Math.random()*0.4, maxLife: 1.0, color: '#fbbf24', radius: Math.random() * 3 + 1.5 });
                                     if (Math.random() > 0.5) explosionParticles.push({ x: s.x + (Math.random()-0.5)*15, y: s.y + (Math.random()-0.5)*15, vel: { x: s.vel.x*0.5 + (Math.random()-0.5)*8, y: s.vel.y*0.5 + (Math.random()-0.5)*8 }, life: 0.4 + Math.random()*0.6, maxLife: 1.0, color: '#ffffff', radius: Math.random() * 2 + 1 });
                                 }
                             }
                         } else {
                             if (engineTicks % 5 === 0) {
                                 if (s.team === 1) {
                                     if (!s.parts.right && Math.random() < 0.6) {
                                         explosionParticles.push({ x: backX + perpX + (Math.random()-0.5)*6, y: backY + perpY + (Math.random()-0.5)*6, vel: { x: s.vel.x*0.5 + (Math.random()-0.5)*2, y: s.vel.y*0.5 + (Math.random()-0.5)*2 }, life: 0.5 + Math.random()*0.5, maxLife: 1.0, color: '#fbbf24', radius: Math.random() * 1.5 + 0.5 });
                                     }
                                     if (!s.parts.left && Math.random() < 0.6) {
                                         explosionParticles.push({ x: backX - perpX + (Math.random()-0.5)*6, y: backY - perpY + (Math.random()-0.5)*6, vel: { x: s.vel.x*0.5 + (Math.random()-0.5)*2, y: s.vel.y*0.5 + (Math.random()-0.5)*2 }, life: 0.5 + Math.random()*0.5, maxLife: 1.0, color: '#fbbf24', radius: Math.random() * 1.5 + 0.5 });
                                     }
                                 } else {
                                     if (!s.parts.main && Math.random() < 0.6) {
                                         explosionParticles.push({ x: backX + (Math.random()-0.5)*6, y: backY + (Math.random()-0.5)*6, vel: { x: s.vel.x*0.5 + (Math.random()-0.5)*2, y: s.vel.y*0.5 + (Math.random()-0.5)*2 }, life: 0.5 + Math.random()*0.5, maxLife: 1.0, color: '#fbbf24', radius: Math.random() * 1.5 + 0.5 });
                                     }
                                 }
                             }
                         }
                     }
                     if ((s as any).speedTimer > 0) {
                         speedMult = 1.5;
                         (s as any).speedTimer--;
                         // Trail visual for speed boost
                         explosionParticles.push({
                             x: s.x, y: s.y, vel: { x: -s.vel.x*0.5, y: -s.vel.y*0.5 },
                             life: 0.4, maxLife: 0.4, radius: 1.5, color: '#0088ff'
                         });
                     }
                     if (s.thrustOn) {
                         s.vel.x += Math.cos(s.angle - Math.PI/2) * pCfg.thrustPower * speedMult;
                         s.vel.y += Math.sin(s.angle - Math.PI/2) * pCfg.thrustPower * speedMult;
                         
                         // --- WEBGL FLUID WAKE ENGINE DISPATCH (SHIPS) ---
                         const shipEffect = (visualShipsRef.current[s.team] || visualShipsRef.current[0]) as any;
                         const emitMult = shipEffect.emissionForceMult ?? 1.0;
                         const inv = shipEffect.invertForce ?? true;
                         
                         
                         const thrustAngle = s.angle - Math.PI/2; 
                         // Vector math fix: exhaust must precisely mirror travel trajectory (flip X and Y natively)
                         // Added WebGL screen Y-translation modifier (dx passes through negative negation twice inside SplashCursor, dy parses correctly backwards)
                         const forceX = Math.cos(thrustAngle) * 0.015 * emitMult * (inv ? 1 : -1);
                         const forceY = -Math.sin(thrustAngle) * 0.015 * emitMult * (inv ? 1 : -1);
                             // Tangential offsets for twin engines
                         let engineOffsets: {x: number, y: number}[] = [];
                         if (s.team === 1) { // Blue Player Ship
                             const perpX = Math.cos(thrustAngle + Math.PI/2) * 14; 
                             const perpY = Math.sin(thrustAngle + Math.PI/2) * 14;
                             if (s.parts.right) engineOffsets.push( { x: perpX, y: perpY } );
                             if (s.parts.left) engineOffsets.push( { x: -perpX, y: -perpY } );
                         } else {
                             // Enemies emit center wake
                             if (s.parts.main) engineOffsets.push( {x: 0, y: 0} );
                         }
                         
                         const artStretch = shipEffect.artificialThrust ?? 0;
                         const camScale = cameraScaleRef.current;
                         
                         // Convert hex to rgb for fluid engine
                         let hexColors = shipEffect.exhaustColors || ["#0088ff", "#0088ff", "#0088ff"];
                         const hex = hexColors[Math.floor(Math.random() * hexColors.length)];
                         let r = 0, g = 0, b = 0;
                         if (hex.length === 7) {
                            r = parseInt(hex.slice(1, 3), 16) / 255;
                            g = parseInt(hex.slice(3, 5), 16) / 255;
                            b = parseInt(hex.slice(5, 7), 16) / 255;
                         }

                         for (let engNum = 0; engNum < engineOffsets.length; engNum++) {
                             const offset = engineOffsets[engNum];
                             // Offset exact tail distance depending on ship length
                             const sScale = s.team === 1 ? 21 : 24; // Mathematically mapped to exact drawShip trailing nozzle edges (py=21 / py=24) to prevent pivot drifting during rotations
                             let tailX = s.x - Math.cos(thrustAngle) * sScale + offset.x;
                             let tailY = s.y - Math.sin(thrustAngle) * sScale + offset.y;

                             // Artificial Thrust Wake Stretch removed because extending the physical vector expands the rotation radius and breaks the pivot lock!
                             
                             // Project fluid back through camera translation
                             const screenX = w / 2 + (tailX - cameraXRef.current) * camScale;
                             const screenY = h / 2 + (tailY - cameraYRef.current) * camScale;

                             splashEmitRef.current.push({
                                 id: `ship_${s.id}_eng${engNum}`,
                                 x: screenX, 
                                 y: screenY,
                                 dx: forceX,
                                 dy: forceY,
                                 color: {r, g, b},
                                 splatRadius: shipEffect.splatRadius,
                                 splatForce: shipEffect.splatForce
                             });
                         }
                     }

                     // --- 5. FRICTION & MOMENTUM ---
                     const f = pCfg.friction;
                     s.vel.x *= f;
                     s.vel.y *= f;
                     s.x += s.vel.x;
                     s.y += s.vel.y;

                     // --- 6. CIRCLE SCREEN BOUNDARY REPULSION (HARD EDGE) ---
                     const distHard = Math.hypot(s.x, s.y);
                     if (distHard > arenaRadiusRef.current) { 
                         const angleFromCenter = Math.atan2(s.y, s.x);
                         s.x = Math.cos(angleFromCenter) * arenaRadiusRef.current;
                         s.y = Math.sin(angleFromCenter) * arenaRadiusRef.current;
                         s.vel.x *= -0.8; 
                         s.vel.y *= -0.8;
                         (s as any).roamAngle = Math.atan2(-s.y, -s.x);
                     }
                     
                     // --- 7. AUTOMATED FIRE CONTROL (45-Degree Tactical Cone) ---
                     let shouldFire = false;
                     let nearestEnemyId: number | string = -1;
                     let bestDist = Infinity;
                     
                     // Sweep the 600px scanner radius but strictly enforce a ±22.5 deg (45-degree total) frontal lock
                     ships.forEach(e => {
                         if (e.alive && e.team !== s.team) {
                             const dx = e.x - s.x;
                             const dy = e.y - s.y;
                             const d = Math.hypot(dx, dy);
                             
                             if (d <= 600) {
                                 const angleToEnemy = Math.atan2(dy, dx);
                                 const forwardAngle = s.angle - Math.PI / 2;
                                 let diff = (angleToEnemy - forwardAngle) % (Math.PI * 2);
                                 if (diff > Math.PI) diff -= Math.PI * 2;
                                 if (diff < -Math.PI) diff += Math.PI * 2;
                                 
                                 // 45-degree cone = ±22.5 degrees (Math.PI / 8 radians)
                                 if (Math.abs(diff) <= Math.PI / 8) {
                                     shouldFire = true;
                                     if (d < bestDist) { bestDist = d; nearestEnemyId = e.id; }
                                 }
                             }
                         }
                     });
                     
                     // Core weapon fire ignores thrust failure since battery is isolated
                     const canFire = true;
                     if (s.cooldown <= 0 && shouldFire && s.alive && !(s as any).knocked && s.state !== 'SCAVENGE' && canFire) {
                         s.magazine = 3; // Infinite ammo bypass for arcade native 
                         
                         const launchSpeed = missileConfigRef.current.projectileSpeed ?? 1.21;
                         
                         projectiles.push({
                             id: 'p_' + Math.random().toString(36).substr(2, 9),
                             x: s.x, y: s.y,
                             vel: { x: s.vel.x, y: s.vel.y }, // Straight inherit
                             angle: s.angle, targetId: nearestEnemyId, 
                             speed: launchSpeed * 0.25, // Visual adjustment scaling down since rendering transitioned upwards to 60fps natively
                             damage: cfg.attackDamage, 
                             lifetime: Math.floor(4800 / Math.max(0.01, launchSpeed)), // Scaled 4x to counteract the 0.25x speed modifier, guaranteeing 1200px range
                             color: '#0088ff', ignitionDelay: -Date.now(), sourceId: s.id
                         });
                         s.cooldown = Math.max(180, missileConfigRef.current.fireRate ?? 180); // Strictly enforce 3 second minimum for player
                     } else { s.cooldown--; }
                     
                     // Visual Indicator Removed per request
                     
                     // 7. Render Explicitly and Escape Hybrid Engine Loop Entirely
                     const isSel = selectedShipsRef.current.has(s.id);
                     if (stateRef.current === 'PLAYING') {
                         if (s.target && s.target.type === 'ship' && s.team === 1) {
                             const tz = ships.find(sx => sx.id === s.target.id && sx.alive);
                             if (tz) {
                                 ctx.save();
                                 ctx.beginPath();
                                 ctx.moveTo(s.x, s.y);
                                 ctx.lineTo(tz.x, tz.y);
                                 ctx.strokeStyle = "rgba(0, 136, 255, 0.4)";
                                 ctx.lineWidth = 2;
                                 ctx.stroke();
                                 ctx.restore();
                             }
                         }
                         drawShip(s.x, s.y, s.angle, s.color, s.alpha, isSel, s.currentHp, cfg.hp, s.team, s.parts);
                     }
             });

             // --- HUD RENDERING (Absolute coordinates via resetting transform) ---
             // --- Projectile Flight Engine ---
             for (let i = projectiles.length - 1; i >= 0; i--) {
                 const p = projectiles[i];
                 p.lifetime--;
                 
                 // 1. Intercept other projectiles (Missile vs Missile)
                 let intercepted = false;
                 for (let j = 0; j < projectiles.length; j++) {
                     if (j !== i) {
                         const op = projectiles[j];
                         // Only intercept if they are close physically
                         // FAKE COLLISION CULLING: Bypass heavy Math.hypot starvation natively!
                         if (Math.abs(p.x - op.x) > 15 || Math.abs(p.y - op.y) > 15) continue;
                         
                         if (Math.hypot(p.x - op.x, p.y - op.y) < 15) {
                             intercepted = true;
                             projectiles.splice(j, 1);
                             // Adjust i if j was before i
                             if (j < i) i--;
                             break;
                         }
                     }
                 }
                 
                 if (intercepted) {
                     // Mid-air explosion (Flak burst)
                     for (let b = 0; b < 8; b++) {
                         const sparkAngle = Math.random() * Math.PI * 2;
                         explosionParticles.push({
                             x: p.x, y: p.y,
                             vel: { x: Math.cos(sparkAngle) * (Math.random() * 6), y: Math.sin(sparkAngle) * (Math.random() * 6) },
                             life: 1.0, maxLife: 1.0, radius: Math.random() * 3 + 1,
                             color: "#ffffff"
                         });
                     }
                     // Particle Drop
                     const dropAmount = (Math.floor(Math.random() * 6) + 3) * 2;
                     for (let b = 0; b < dropAmount; b++) {
                         const a = Math.random() * Math.PI * 2;
                         const s = Math.random() * 5 + 2;
                         collectibleParticles.push({
                             x: p.x, y: p.y,
                             vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                             life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: '#fbd38d', pickupDelay: 120
                         } as any);
                     }
                     projectiles.splice(i, 1);
                     continue;
                 }
                 
                 // 1.5 Debris Physics Deflection (Variables in the arena)
                 let hitDebris: any = null;
                 let hitDebrisIndex = -1;
                 for (let j = debrisPieces.length - 1; j >= 0; j--) {
                     const dp = debrisPieces[j];
                     
                     // FAKE COLLISION CULLING
                     if (Math.abs(dp.x - p.x) > 25 || Math.abs(dp.y - p.y) > 25) continue;
                     
                     // Debris hitbox
                     if (Math.hypot(dp.x - p.x, dp.y - p.y) < 25) {
                         hitDebris = dp;
                         hitDebrisIndex = j;
                         break;
                     }
                 }
                 
                 if (hitDebris) {
                     // Explode the structural debris into high-value collectible grind particles!
                     const yieldAmount = 15 + Math.floor(Math.random() * 8);
                     for (let k = 0; k < yieldAmount; k++) {
                         const a = Math.random() * Math.PI * 2;
                         const s = Math.random() * 8 + 2;
                         collectibleParticles.push({
                             x: hitDebris.x + (Math.random()-0.5)*15, 
                             y: hitDebris.y + (Math.random()-0.5)*15,
                             vel: { x: hitDebris.vel.x + Math.cos(a)*s, y: hitDebris.vel.y + Math.sin(a)*s },
                             life: Date.now() + 15000 + Math.floor(Math.random() * 5000), 
                             type: 'dust', 
                             color: hitDebris.color, 
                             pickupDelay: 60,
                             ownerId: p.sourceId
                         } as any);
                     }
                     // Splice the physical unit out of the simulation
                     if (hitDebrisIndex !== -1) {
                         debrisPieces.splice(hitDebrisIndex, 1);
                     }
                     
                     // Destroy the traversing projectile since it hit floating debris
                     projectiles.splice(i, 1);
                     continue;
                 }
                 
                 // 2. Universal Hit Detection against Ships
                 let hitShip: any = null;
                 let hitFlare = false;
                 const sourceTeam = ships.find(sx => sx.id === p.sourceId)?.team || 0;
                 
                 // Cannons physically shred flares if they touch them
                 if (p.weaponType === 'CANNON') {
                     for (let j = flares.length - 1; j >= 0; j--) {
                         const f = flares[j];
                         if (Math.hypot(f.x - p.x, f.y - p.y) < 25) { // Flare broad hitbox
                             flares.splice(j, 1);
                             for (let b = 0; b < 12; b++) {
                                 const a = Math.random() * Math.PI * 2;
                                 const s = Math.random() * 5 + 2;
                                 collectibleParticles.push({
                                     x: f.x, y: f.y, vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                     life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: '#4ade80', pickupDelay: 120
                                 } as any);
                             }
                             hitFlare = true;
                             break; // Round consumed
                         }
                     }
                 }

                 if (!hitFlare) {
                     for (const s of ships) {
                         if (s.alive && s.id !== p.sourceId && s.team !== sourceTeam) {
                             let dx = s.x - p.x;
                             let dy = s.y - p.y;
                             if (Math.hypot(dx, dy) < 25) { // Hitbox encompassing modular pills
                                 hitShip = s;
                                 break;
                             }
                         }
                     }
                 }
                 
                 if (hitShip || hitFlare) {
                     if (hitShip) {
                         // --- Kinetic Knockback ---
                     // Apply a physical momentum push to the ship from the missile's literal velocity vector
                     hitShip.vel.x += Math.cos(p.angle - Math.PI/2) * 0.2; // Significantly reduced for a subtle nudge
                     hitShip.vel.y += Math.sin(p.angle - Math.PI/2) * 0.2;
                     
                     // --- Directional Part Ablation ---
                     const relLocAngle = Math.atan2(p.y - hitShip.y, p.x - hitShip.x) - (hitShip.angle - Math.PI/2);
                     let diff = relLocAngle % (Math.PI * 2);
                     if (diff > Math.PI) diff -= Math.PI * 2;
                     if (diff < -Math.PI) diff += Math.PI * 2;
                     
                     let damageAbsorbed = false;
                     
                     // If struck aggressively from the left side and left thruster is still intact (All Ships)
                     if (diff < -Math.PI/6 && diff > -Math.PI*(5/6) && hitShip.parts.left) {
                         hitShip.parts.left = false;
                         damageAbsorbed = true; // Reactive Armor absorbs all HP damage
                         debrisPieces.push({ 
                             x: hitShip.x - Math.cos(hitShip.angle)*15, 
                             y: hitShip.y - Math.sin(hitShip.angle)*15, 
                             vel: { x: Math.cos(p.angle - Math.PI/2) * 2 + (Math.random()-0.5), y: Math.sin(p.angle - Math.PI/2) * 2 + (Math.random()-0.5) }, 
                             angle: hitShip.angle, 
                             rotSpeed: (Math.random() - 0.5) * 0.2, 
                             life: 1.0, color: hitShip.color, side: 'left' 
                         });
                         // Massive dust spray on ablation
                         for (let b = 0; b < Math.floor(Math.random() * 3) + 3; b++) {
                             const a = Math.random() * Math.PI * 2;
                             const s = Math.random() * 7 + 3;
                             const p: any = {
                                 x: hitShip.x - Math.cos(hitShip.angle)*15, 
                                 y: hitShip.y - Math.sin(hitShip.angle)*15, 
                                 vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                 life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: '#fbd38d', pickupDelay: 120, ownerId: hitShip.id
                             };
                             collectibleParticles.push(p);
                         }
                     } 
                     // If struck aggressively from the right side and right thruster is still intact (All Ships)
                     else if (diff > Math.PI/6 && diff < Math.PI*(5/6) && hitShip.parts.right) {
                         hitShip.parts.right = false;
                         damageAbsorbed = true; // Reactive Armor absorbs all HP damage
                         debrisPieces.push({ 
                             x: hitShip.x + Math.cos(hitShip.angle)*15, 
                             y: hitShip.y + Math.sin(hitShip.angle)*15, 
                             vel: { x: Math.cos(p.angle - Math.PI/2) * 2 + (Math.random()-0.5), y: Math.sin(p.angle - Math.PI/2) * 2 + (Math.random()-0.5) }, 
                             angle: hitShip.angle, 
                             rotSpeed: (Math.random() - 0.5) * 0.2, 
                             life: 1.0, color: hitShip.color, side: 'right' 
                         });
                         // Massive dust spray on ablation
                         for (let b = 0; b < Math.floor(Math.random() * 3) + 3; b++) {
                             const a = Math.random() * Math.PI * 2;
                             const s = Math.random() * 7 + 3;
                             const p: any = {
                                 x: hitShip.x + Math.cos(hitShip.angle)*15, 
                                 y: hitShip.y + Math.sin(hitShip.angle)*15, 
                                 vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                 life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: '#fbd38d', pickupDelay: 120, ownerId: hitShip.id
                             };
                             collectibleParticles.push(p);
                         }
                     }
                     // If struck heavily from BEHIND and main thruster is still intact (Team 2 & 3)
                     else if (hitShip.team !== 1 && Math.abs(diff) > Math.PI * 0.75 && hitShip.parts.main) {
                         hitShip.parts.main = false;
                         damageAbsorbed = true;
                         debrisPieces.push({ 
                             x: hitShip.x - Math.cos(hitShip.angle)*15, 
                             y: hitShip.y - Math.sin(hitShip.angle)*15, 
                             vel: { x: Math.cos(p.angle - Math.PI/2) * 3 + (Math.random()-0.5), y: Math.sin(p.angle - Math.PI/2) * 3 + (Math.random()-0.5) }, 
                             angle: hitShip.angle, 
                             rotSpeed: (Math.random() - 0.5) * 0.4, 
                             life: 1.0, color: hitShip.color, side: 'main' 
                         });
                         for (let b = 0; b < Math.floor(Math.random() * 3) + 3; b++) {
                             const a = Math.random() * Math.PI * 2;
                             const s = Math.random() * 7 + 3;
                             const p: any = {
                                 x: hitShip.x - Math.cos(hitShip.angle)*15, 
                                 y: hitShip.y - Math.sin(hitShip.angle)*15, 
                                 vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                 life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: '#fbd38d', pickupDelay: 120, ownerId: hitShip.id
                             };
                             collectibleParticles.push(p);
                         }
                     }
                     
                     // Generate localized impact kinetic sparks
                     const sparkCount = Math.floor(p.damage * 0.5) + 3;
                     for (let k = 0; k < sparkCount; k++) {
                         const sparkAngle = Math.random() * Math.PI * 2;
                         const sSpeed = Math.random() * 10 + 2;
                         collectibleParticles.push({
                             x: p.x + (Math.random() - 0.5) * 8, y: p.y + (Math.random() - 0.5) * 8,
                             vel: { x: (Math.random() - 0.5) * sSpeed + Math.cos(sparkAngle) * (sSpeed * 0.5), y: (Math.random() - 0.5) * sSpeed + Math.sin(sparkAngle) * (sSpeed * 0.5) },
                             life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: damageAbsorbed ? "#ffffff" : hitShip.color, ownerId: hitShip.id, pickupDelay: 120
                         } as any);
                     }
                     
                     if (!damageAbsorbed) {
                         // Full Main Hull Penetration
                         hitShip.currentHp -= p.damage;
                         const tgtTeam = hitShip.team;
                         if (tgtTeam === 2) damageDealtRef.current.player += p.damage;
                         if (tgtTeam === 1) damageDealtRef.current.enemy += p.damage;
                         
                         if (hitShip.currentHp <= 0) {
                             hitShip.alive = false;
                             const kShip = ships.find(sx => sx.id === p.sourceId);
                             if (kShip) kShip.kills++;
                             
                             const explodeAmount = (hitShip.cargo + 8) * 4;
                             for (let b = 0; b < explodeAmount; b++) {
                                 const a = Math.random() * Math.PI * 2;
                                 const s = Math.random() * 6 + 3;
                                 collectibleParticles.push({
                                     x: hitShip.x, y: hitShip.y,
                                     vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                     life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: hitShip.color, ownerId: hitShip.id, pickupDelay: 180
                                 } as any);
                             }
                             hitShip.cargo = 0;
                         } else {
                             const dropAmount = (Math.floor(Math.random() * 4) + 2) * 2;
                             for (let b = 0; b < dropAmount; b++) {
                                 const a = Math.random() * Math.PI * 2;
                                 const s = Math.random() * 4 + 1;
                                 collectibleParticles.push({
                                     x: hitShip.x, y: hitShip.y,
                                     vel: { x: Math.cos(a)*s, y: Math.sin(a)*s },
                                     life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: hitShip.color, ownerId: hitShip.id, pickupDelay: 120
                                 } as any);
                             }
                         }
                     }
                     } // End if (hitShip)
                     
                     projectiles.splice(i, 1);
                     continue;
                 }
                 
                 // --- Heat-Seeking Logic ---
                 if (p.targetId !== -1) {
                     let target: any = ships.find(sx => sx.id === p.targetId && sx.alive);
                     if (!target) target = flares.find(fx => fx.id === p.targetId);
                     
                     if (target) {
                         // Active Countermeasure Decoy Override
                         let closestDist = 500; // Missile wide-area radar field of view for extreme-heat flares
                         for (const f of flares) {
                             const srcShip = ships.find(sx => sx.id === p.sourceId);
                             const pTeam = srcShip ? srcShip.team : 0;
                             if (f.team !== pTeam) { // Flares securely attract enemy missiles mechanically
                                 const fd = Math.hypot(f.x - p.x, f.y - p.y);
                                 if (fd < closestDist) { 
                                     closestDist = fd; 
                                     target = f as any; 
                                     p.targetId = f.id; // Permanently hijack lock onto the flare!
                                 }
                             }
                         }
                         
                         const dx = target.x - p.x;
                         const dy = target.y - p.y;
                         const angleToTarget = Math.atan2(dy, dx) + Math.PI/2;
                         
                         // Calculate shortest angular difference
                         let diff = (angleToTarget - p.angle) % (Math.PI * 2);
                         if (diff < -Math.PI) diff += Math.PI * 2;
                         if (diff > Math.PI) diff -= Math.PI * 2;
                         
                         // Missile Turn Dynamics
                         // Flares burn so hot that missiles will snap-turn toward them violently
                         const isTrackingFlare = typeof p.targetId === 'string' && p.targetId.startsWith('f_');
                         
                         // If passed the target (>90 deg diff), stop tracking (unless violently snapping to a flare)
                         if (Math.abs(diff) > Math.PI / 2 && !isTrackingFlare) {
                             p.targetId = -1;
                         } else {
                             // Smooth steer (turn speed) - flares pull missiles violently
                             const turnSpeed = isTrackingFlare ? 0.35 : 0.05;
                             p.angle += Math.max(-turnSpeed, Math.min(turnSpeed, diff));
                         }
                     } else {
                         p.targetId = -1; // Target (ship or flare) burned out or died
                     }
                 }
                 
                 // Physics Velocity (Moves straight where pointed, inheriting CMS Speed exactly)
                 p.x += Math.cos(p.angle - Math.PI/2) * p.speed;
                 p.y += Math.sin(p.angle - Math.PI/2) * p.speed;

                 // NEXUS METABALL COVER (Bouncing Mechanics)
                 if (arenaBackgroundRef.current === 'nexus') {
                     // Get current viewport resolution
                     const cw = canvasRef.current ? canvasRef.current.width : 1920;
                     const ch = canvasRef.current ? canvasRef.current.height : 1080;
                     
                     // Approximate the physical radius of the metaballs in the raymarching engine
                     // 15% of the shortest screen dimension captures the bounds safely.
                     const mRadius = Math.min(cw, ch) * 0.15;
                     
                     // Direct evaluation without generating a map() array inside the O(N) loop
                     for (const st of nexusStationsRef.current) {
                         const mbX = cw * st.nx - cw / 2;
                         const mbY = ch * (1.0 - st.ny) - ch / 2;
                         
                         const dx = p.x - mbX;
                         const dy = p.y - mbY;
                         const distSq = dx * dx + dy * dy;
                         
                         // Direct Impact 
                         if (distSq < mRadius * mRadius) {
                             const dist = Math.sqrt(distSq);
                             
                             // 1. Resolve penetration to stop the ship getting stuck
                             const overlap = mRadius - dist;
                             p.x += (dx / dist) * overlap;
                             p.y += (dy / dist) * overlap;
                             
                             // 2. Incident vectors & bounce trajectory
                             const normalAngle = Math.atan2(dy, dx);
                             const moveAngle = p.angle - Math.PI / 2;
                             
                             // Perfect Elastic Reflection (Angle) 
                             // R = 2N - M - PI (Reflection Formula)
                             const bounceMoveAngle = 2 * normalAngle - moveAngle - Math.PI;
                             // Convert back to ship's "forward" facing 
                             p.angle = bounceMoveAngle + Math.PI / 2;
                             
                             // 3. Clear target temporarily so it doesn't immediately U-turn into the fluid 
                             p.targetId = -1;
                             
                             // 4. Kinetic Splash visual effect indicating physical deflection 
                             for (let b = 0; b < 10; b++) {
                                 const sparkAngle = normalAngle + (Math.random() - 0.5) * Math.PI;
                                 explosionParticles.push({
                                     x: p.x, y: p.y,
                                     vel: { x: Math.cos(sparkAngle) * (Math.random() * 8 + 3), y: Math.sin(sparkAngle) * (Math.random() * 8 + 3) },
                                     life: 0.8, maxLife: 0.8, radius: Math.random() * 3 + 1,
                                     color: p.color === '#0088ff' ? '#fff' : '#fbd38d'
                                 });
                             }
                             break; // Once bounced off of one, ignore the rest 
                         }
                     }
                 }
                 
                 // Lightweight physical spark wake trail for immediate visual feedback
                 if (Math.random() < 0.8) {
                     const spread = (Math.random() - 0.5) * 0.3;
                     const tailX = p.x - Math.cos(p.angle - Math.PI/2) * 15;
                     const tailY = p.y - Math.sin(p.angle - Math.PI/2) * 15;
                     explosionParticles.push({
                         x: tailX, y: tailY,
                         vel: { x: -Math.cos(p.angle - Math.PI/2 + spread) * (1.5 + Math.random()), y: -Math.sin(p.angle - Math.PI/2 + spread) * (1.5 + Math.random()) },
                         life: 0.6, maxLife: 0.6, radius: Math.random() * 2.0 + 0.5,
                         // Ensure white hot core color
                         color: p.color === '#0088ff' || p.color === '#fff' ? '#0088ff' : '#fbd38d'
                     });
                 }
                 
                 // Render Active Ignited Visuals
                 const submergence = getSubmergedTint(p.x, p.y);

                 ctx.save();
                 ctx.globalAlpha = 1.0 - submergence * 0.7; // Fades deeply into the fluid
                 
                 ctx.translate(p.x, p.y);
                 ctx.rotate(p.angle);
                 
                 // Minimalist Pill Shape Missile
                 const isEnemy = p.color !== '#0088ff' && p.color !== '#fff';
                 const pColor = p.color || (isEnemy ? "#facc15" : "#0088ff");
                 
                 // Draw simple pill capsule
                 ctx.beginPath();
                 ctx.roundRect(-2.5, -8, 5, 16, 2.5);
                 ctx.fillStyle = isEnemy ? "rgba(244, 63, 94, 0.9)" : "rgba(0, 229, 255, 0.9)";
                 ctx.fill();
                 ctx.strokeStyle = "#fff";
                 ctx.lineWidth = 1;
                 ctx.stroke();
                 
                 // Small energy core line for visual punch
                 ctx.beginPath();
                 ctx.moveTo(0, -4); ctx.lineTo(0, 4);
                 ctx.strokeStyle = "#fff";
                 ctx.lineWidth = 1.5;
                 ctx.stroke();
                 
                 // Revert to original simple wake effect (removed SplashCursor dispatch from missiles based on user feedback)
                 
                 // Fluid caustic tint wrapper
                 if (submergence > 0) {
                     ctx.globalCompositeOperation = "multiply";
                     ctx.beginPath();
                     ctx.arc(0, 0, 10, 0, Math.PI * 2);
                     ctx.fillStyle = `rgba(0, 30, 80, ${submergence})`;
                     ctx.fill();
                     ctx.globalCompositeOperation = "source-over";
                 }
                 
                 ctx.restore();
                 
                 if (p.lifetime <= 0) {
                     // Spark explosion for detonation at max range (airburst)
                     for (let b = 0; b < 6; b++) {
                         const sparkAngle = Math.random() * Math.PI * 2;
                         explosionParticles.push({
                             x: p.x, y: p.y,
                             vel: { x: Math.cos(sparkAngle) * (Math.random() * 4 + 2), y: Math.sin(sparkAngle) * (Math.random() * 4 + 2) },
                             life: 1.0, maxLife: 1.0, radius: Math.random() * 2 + 0.5,
                             color: p.color === '#0088ff' || p.color === '#fff' ? '#0088ff' : '#fbd38d'
                         });
                     }
                     projectiles.splice(i, 1);
                 }
             }
             
             // --- Explosions Engine (Lightweight Impact Sparks) ---
            for (let i = explosionParticles.length - 1; i >= 0; i--) {
                const ep = explosionParticles[i];
                ep.life -= 0.016;
                ep.x += ep.vel.x; ep.y += ep.vel.y;
                ep.vel.x *= 0.95; ep.vel.y *= 0.95;
                
                const ext = Math.max(0.1, Math.hypot(ep.vel.x, ep.vel.y) * 1.5);
                const ang = Math.atan2(ep.vel.y, ep.vel.x);
                
                ctx.save();
                ctx.globalAlpha = Math.max(0, ep.life / ep.maxLife);
                ctx.beginPath();
                ctx.moveTo(ep.x, ep.y);
                ctx.lineTo(ep.x - Math.cos(ang) * ext, ep.y - Math.sin(ang) * ext);
                ctx.strokeStyle = ep.color;
                ctx.lineWidth = Math.max(1, ep.radius);
                ctx.lineCap = "round";
                ctx.stroke();
                ctx.restore();
                
                if (ep.life <= 0) {
                    explosionParticles.splice(i, 1);
                }
            }
             
             // --- Physics Simulation: Countermeasure Flares ---
             for (let i = flares.length - 1; i >= 0; i--) {
                 const f = flares[i];
                 f.x += f.vel.x;
                 f.y += f.vel.y;
                 f.vel.x *= 0.95; // Extreme drag for flares in space
                 f.vel.y *= 0.95;
                 f.life--;
                 if (f.life <= 0) {
                     flares.splice(i, 1);
                     continue;
                 }
                 ctx.save();
                 ctx.globalAlpha = Math.min(1.0, f.life / 60); // Fade out over last second
                 ctx.beginPath();
                 ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
                 ctx.fillStyle = f.team === 1 ? "#0088ff" : "#facc15";
                 // CPU OPTIMIZATION: Shadows forcefully removed
                 ctx.fill();
                 ctx.restore();
                 
                 // Spawn micro-sparks from flares
                 if (Math.random() < 0.3) {
                     explosionParticles.push({
                         x: f.x + (Math.random()-0.5)*4, y: f.y + (Math.random()-0.5)*4,
                         vel: { x: (Math.random()-0.5)*1, y: (Math.random()-0.5)*1 },
                         life: 0, maxLife: Math.random()*15 + 10, color: '#fff', radius: 1
                     });
                 }
             }
             
             // --- Modular Debris Engine ---
             for (let i = debrisPieces.length - 1; i >= 0; i--) {
                 const d = debrisPieces[i];
                 d.x += d.vel.x;
                 d.y += d.vel.y;
                 d.angle += d.rotSpeed;
                 
                 // Friction to bleed off explosion velocity to a total stop
                 d.vel.x *= 0.95;
                 d.vel.y *= 0.95;
                 d.rotSpeed *= 0.98;
                 
                 // Live Electrical Sparking (Every now and then)
                 if (Math.random() < 0.08) {
                     explosionParticles.push({
                         x: d.x + (Math.random()-0.5)*12, y: d.y + (Math.random()-0.5)*12,
                         vel: { x: d.vel.x*0.3 + (Math.random()-0.5)*1.5, y: d.vel.y*0.3 + (Math.random()-0.5)*1.5 },
                         life: 0, maxLife: Math.random()*25 + 10, color: '#fef3c7', radius: Math.random() + 0.5
                     });
                 }
                 
                 // Ship Collision (Bumping stationary/floating debris)
                 for (const s of ships) {
                     if (s.alive) {
                         const dx = d.x - s.x;
                         const dy = d.y - s.y;
                         
                         // FAKE COLLISION CULLING
                         if (Math.abs(dx) > 30 || Math.abs(dy) > 30) continue;
                         
                         if (Math.hypot(dx, dy) < 30) {
                             // Bump force: physically kick the debris using the ship's engine momentum (amplified for space physics)
                             d.vel.x += s.vel.x * 2.0 + (Math.random()-0.5) * 1.5;
                             d.vel.y += s.vel.y * 2.0 + (Math.random()-0.5) * 1.5;
                             d.rotSpeed += (Math.random() - 0.5) * 0.8;
                         }
                     }
                 }
                 
                 // Deep space infinite wrap (Bypassed for debris to prevent screen clipping plane teleports)
                 // if (d.x < 0) d.x += w; if (d.x > w) d.x -= w;
                 // if (d.y < 0) d.y += h; if (d.y > h) d.y -= h;
                 
                 ctx.save();
                 ctx.globalAlpha = 1.0; // Never fades out
                 ctx.translate(d.x, d.y);
                 ctx.rotate(d.angle);
                 ctx.beginPath();
                 // Draw the sheared thruster pill exactly scaled to 50%
                 ctx.roundRect(-4, -8, 8, 16, 4);
                 ctx.fillStyle = "#ffffff"; ctx.fill();
                 ctx.strokeStyle = d.color; ctx.lineWidth = 1.5; ctx.stroke();
                 ctx.restore();
             }
             
             // --- Collectible Particles Engine ---
             for (let i = collectibleParticles.length - 1; i >= 0; i--) {
                 const cp = collectibleParticles[i];
                 cp.x += cp.vel.x;
                 cp.y += cp.vel.y;
                 
                 // Deep space infinite wrap (Bypassed for temporary aesthetic visual particles to prevent screen clipping)
                 // if (cp.x < 0) cp.x += w; if (cp.x > w) cp.x -= w;
                 // if (cp.y < 0) cp.y += h; if (cp.y > h) cp.y -= h;
                 
                 // Space Drift Friction (Tuned for smooth, medium-distance sliding)
                 cp.vel.x *= 0.96;
                 cp.vel.y *= 0.96;
                 
                 if (Date.now() >= cp.life) {
                     for (let k = 0; k < 3; k++) {
                         explosionParticles.push({
                             x: cp.x + (Math.random()-0.5)*5, y: cp.y + (Math.random()-0.5)*5,
                             vel: { x: (Math.random()-0.5)*4, y: (Math.random()-0.5)*4 },
                             life: 0.3, maxLife: 0.3, radius: Math.random() + 0.5, color: cp.color
                         });
                     }
                     collectibleParticles.splice(i, 1);
                     continue;
                 }
                 
                 // Magnetic Range Check
                 let collected = false;
                 
                 // Process grace period scatter physics unconditionally
                 if ((cp as any).pickupDelay !== undefined && (cp as any).pickupDelay > 0) {
                     (cp as any).pickupDelay--;
                 }
                 
                 // Physics Vacuum Loop (Skips if owner ship is trying to vacuum its own hull, or if it's still in grace period)
                 if (!((cp as any).pickupDelay > 0)) {
                     for (const s of ships) {
                         // Ships cannot collect their own generated particles
                         if (s.alive && s.id !== (cp as any).ownerId) {
                             const dx = s.x - cp.x;
                             const dy = s.y - cp.y;
                             const dist = Math.hypot(dx, dy);
                             if (dist < 30) {
                                 s.cargo++;
                                 collected = true;
                                 break;
                             } else if (dist < 250) {
                                 // Ultra-smooth Magnetic Homing
                                 // The pull curve starts at 0 near the 250px edge and gracefully intensifies without overriding the particle's natural drift momentum
                                 const pullStrength = Math.pow(1 - dist / 250, 3) * 0.9; 
                                 cp.vel.x += (dx / dist) * pullStrength;
                                 cp.vel.y += (dy / dist) * pullStrength;
                             }
                         }
                     }
                 }
                 
                 if (collected) {
                     collectibleParticles.splice(i, 1);
                     continue;
                 }
                 
                 // Render Particle Core as Kinetic Streak
                 ctx.save();
                 ctx.globalAlpha = (cp.life - Date.now()) < 1500 ? (((cp.life - Date.now()) % 200 < 100) ? 1 : 0.2) : 1.0; 
                 ctx.beginPath();
                 ctx.moveTo(cp.x, cp.y);
                 const cpMag = Math.hypot(cp.vel.x, cp.vel.y);
                 const cpExt = Math.max(0.1, cpMag * 1.5);
                 const cpAng = Math.atan2(cp.vel.y, cp.vel.x);
                 ctx.lineTo(cp.x - Math.cos(cpAng) * cpExt, cp.y - Math.sin(cpAng) * cpExt);
                 ctx.strokeStyle = cp.color;
                 ctx.lineWidth = 3.0;
                 ctx.lineCap = "round";
                 ctx.stroke();
                 ctx.restore();
             }
             
             // --- Automated Action Turn Managers ---
             // --- 9. RENDER LIVE SHIPS ---
             const activeTeams = new Set(ships.filter(s => s.alive).map(s => s.team));
             

             // Removal of Meltdown requirement: Ships drift but remain operative if thrusters are destroyed
                         
                         // Create final catastrophic explosion
             
             const aliveShips = ships.filter(s => s.alive);
             const unknockedShips = aliveShips.filter(s => !(s as any).knocked);
             
             // If opposing teams remain, but all surviving ships are knocked (disabled tie-break scenario)
             if (activeTeams.size > 1 && unknockedShips.length === 0 && aliveShips.length > 0) {
                 if (tieBreakerTimer === 0) tieBreakerTimer = Date.now();
                 else if (Date.now() - tieBreakerTimer > 3000) {
                     aliveShips.forEach(s => {
                         s.currentHp -= (100 / 180); // 3-second drain
                         if (s.currentHp <= 0) {
                             s.currentHp = 0;
                             s.alive = false;
                             const explodeAmount = (s.cargo + 8) * 4;
                             for (let b = 0; b < explodeAmount; b++) {
                                 const a = Math.random() * Math.PI * 2;
                                 const sp = Math.random() * 6 + 3;
                                 collectibleParticles.push({ x: s.x, y: s.y, vel: { x: Math.cos(a)*sp, y: Math.sin(a)*sp }, life: Date.now() + 10000 + Math.floor(Math.random() * 5000), type: 'dust', color: s.color, ownerId: s.id, pickupDelay: 180 } as any);
                             }
                             s.cargo = 0;
                             for (let w = 0; w < 20; w++) {
                                 const wa = Math.random() * Math.PI * 2;
                                 explosionParticles.push({ x: s.x + (Math.random()-0.5)*10, y: s.y + (Math.random()-0.5)*10, vel: { x: Math.cos(wa)*15, y: Math.sin(wa)*15 }, life: 0.8 + Math.random()*0.4, maxLife: 1.2, color: '#fbbf24', radius: Math.random() * 4 + 2 });
                             }
                         }
                     });
                 }
             } else {
                 tieBreakerTimer = 0;
             }
             
             // Win Condition Core
             if (activeTeams.size <= 1) {
                 // Force survivors into pure scavenging pursuit mode explicitly overriding RTB
                 ships.forEach(s => { if (s.alive) s.state = 'SCAVENGE'; });
                 if ((stateRef.current as string) !== 'GAMEOVER') {
                     if (gameOverTimer === 0) gameOverTimer = Date.now();
                     
                     if (Date.now() - gameOverTimer > 10000) { // 10 mathematically pure seconds
                         stateRef.current = 'GAMEOVER' as any;
                         setGameState('GAMEOVER');
                     }
                 }
             } else {
                 gameOverTimer = 0; // Reset continuously while combat is active
             }
             
             // 6hz React state payload sync
             if (engineTicks % 10 === 0) {
                 const uiSync: any = {};
                 ships.forEach(s => uiSync[s.id] = { hp: s.currentHp, alive: s.alive, hasDived: s.hasDived, kills: s.kills, cooldown: s.cooldown, magazine: s.magazine, doctrine: s.doctrine, evasionTimer: (s as any).evasionTimer || 0, cargo: s.cargo });
                 setShipUI(uiSync);
             }

             // NATIVE FLUID SYNC (Nexus cursor payload mapping)
             // Find player/camera ship and pass coordinates to window dispatch perfectly scaled
             const focalShip = ships.find(s => s.id === 1);
             
             const screenMissiles = [];
             for (const m of projectiles) {
                 const mx = w/2 + (m.x - cameraXRef.current) * cameraScaleRef.current;
                 const my = h/2 + (m.y - cameraYRef.current) * cameraScaleRef.current;
                 // Optimization: Only send missiles that are somewhat near the viewport
                 if (mx > -100 && mx < w + 100 && my > -100 && my < h + 100) {
                     screenMissiles.push({ x: mx, y: my });
                 }
                 if (screenMissiles.length >= 15) break; // Hard limit for shader performance scaling
             }
             
             if (focalShip && focalShip.alive) {
                 const cx = w/2 + (focalShip.x - cameraXRef.current) * cameraScaleRef.current;
                 const cy = h/2 + (focalShip.y - cameraYRef.current) * cameraScaleRef.current;
                 try {
                     window.dispatchEvent(new CustomEvent('SYNC_NEXUS_CURSOR', { detail: { 
                         clientX: cx, 
                         clientY: cy, 
                         missiles: screenMissiles,
                         cameraX: cameraXRef.current,
                         cameraY: cameraYRef.current,
                         scale: cameraScaleRef.current
                     } }));
                 } catch (e) {}
             } else if(screenMissiles.length > 0) {
                 try {
                     window.dispatchEvent(new CustomEvent('SYNC_NEXUS_CURSOR', { detail: { 
                         missiles: screenMissiles,
                         cameraX: cameraXRef.current,
                         cameraY: cameraYRef.current,
                         scale: cameraScaleRef.current
                     } }));
                 } catch (e) {}
             }

         }
         
         ctx.restore(); // --- CLOSE CINEMATIC CAMERA SYSTEM OVERLAY ---
         
         // --- CLEANUP COUNTDOWN HUD ---
         if (gameOverTimer > 0 && stateRef.current === 'PLAYING') {
             const secondsLeft = Math.max(0, Math.ceil(10 - (Date.now() - gameOverTimer) / 1000));
             ctx.save();
             // Center everything dead in the middle of the screen
             ctx.translate(w/2, h/2);
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             const sfFont = '900 {size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
             
             // Create smooth CSS-like linear gradient for Canvas text
             const textGrad = ctx.createLinearGradient(0, -120, 0, 100);
             textGrad.addColorStop(0, '#ffffff');
             textGrad.addColorStop(1, '#aaaaaa');
             
             // Top text
             ctx.font = sfFont.replace('{size}', '80');
             ctx.fillStyle = textGrad; // Identical gradient mapping
             ctx.fillText('VICTORY LAP', 0, -80);

             // Main Countdown Digit
             ctx.font = sfFont.replace('{size}', '160');
             ctx.fillStyle = textGrad; // Identical gradient mapping
             ctx.fillText(secondsLeft.toString(), 0, 40);
             
             ctx.restore();
         }
         

         
         const finalRenderMs = performance.now() - loopStartTime;
         
         // FPS Debug overlay 
         ctx.save();
         ctx.fillStyle = "#ffffff";
         ctx.font = "900 16px Orbitron, sans-serif";
         ctx.textAlign = "right";
         ctx.textBaseline = "bottom";
         ctx.fillText(`FPS: ${fpsRef.current}`, w - 20, h - 20);
         ctx.fillText(`P:${projectiles.length} E:${explosionParticles.length} C:${collectibleParticles.length} D:${debrisPieces.length}`, w - 20, h - 40);
         ctx.fillStyle = finalRenderMs > 8 ? "#ff0000" : "#00ff00";
         ctx.fillText(`CPU: ${finalRenderMs.toFixed(2)}ms`, w - 20, h - 60);
         ctx.restore();
         
         frameId = requestAnimationFrame(loop);
     };
     
     loop();
     return () => { window.removeEventListener('resize', resize); window.removeEventListener('VANGUARD_ORDER', orderHandler); window.removeEventListener('VANGUARD_OVERRIDE', overrideHandler); window.removeEventListener('VANGUARD_FLARE', flareHandler); cancelAnimationFrame(frameId); };
  }, [visualShips, activeShips, replayKey]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  
  return (
      <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 10 }}>
         {/* Dynamic CMS Background */}
         {showBackground ? (
           <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
              {arenaBackground === 'lapse' && <LapseSimulation showUI={false} />}
              {arenaBackground === 'nexus' && <NexusFluidEffect isPreview={true} />}
           </div>
         ) : (
           <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "#000", zIndex: 0 }} />
         )}
         <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove} style={{ position: "absolute", zIndex: 2, width: "100%", height: "100%", display: "block", cursor: gameState === 'SETUP' ? 'crosshair' : 'crosshair' }} />
         
         {/* WebGL Fluid Wake Engine Layer */}
         {showWake && (
             <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
                <SplashCursor
                   externalEmitsRef={splashEmitRef}
                   cameraDeltaRef={{ current: { x: 0, y: 0 } }}
                   fluidColor={{ r: 1.0, g: 0.2, b: 0.0 }} 
                   SPLAT_RADIUS={visualShips[0].splatRadius} 
                   SPLAT_FORCE={visualShips[0].splatForce} 
                   DENSITY_DISSIPATION={visualShips[0].densityDissipation}
                   VELOCITY_DISSIPATION={visualShips[0].velocityDissipation}
                   CURL={visualShips[0].curl}
                   // Cap resolution heavily to guarantee we don't break the 16.6ms GPU budget on 60/120Hz displays
                   DYE_RESOLUTION={Math.min(512, visualShips[0].dyeResolution || 512)}
                   SIM_RESOLUTION={Math.min(128, visualShips[0].simResolution || 128)}
                   PRESSURE={visualShips[0].pressure}
                   PRESSURE_ITERATIONS={Math.min(20, visualShips[0].pressureIterations || 20)}
                />
             </div>
         )}
         
         {/* DYNAMIC PORTAL ANCHOR FOR EXTERNAL UI TO SURVIVE FULLSCREEN */}
         <div id="nexus-ui-root" style={{ position: "absolute", inset: 0, zIndex: 999999, pointerEvents: "none" }} />
         
         {/* Top Right UI Group (Timer & Full Screen Button) */}
         <div style={{ position: "absolute", top: 20, right: 20, zIndex: 999999, display: "flex", gap: "15px", alignItems: "center", pointerEvents: "auto" }}>
             <div style={{ color: "#fbd38d", fontWeight: "bold", fontSize: "1.2rem", border: "1px solid rgba(255,255,255,0.2)", padding: "5px 15px", borderRadius: "5px", background: "rgba(0,0,0,0.5)", fontFamily: "Orbitron, sans-serif", pointerEvents: "none" }}>
                 {Math.floor(matchTimer / 60)}:{(matchTimer % 60).toString().padStart(2, '0')}
             </div>
             <button onClick={() => { try { const doc = document as any; const elm = containerRef.current as any; if (doc.fullscreenElement || doc.webkitFullscreenElement) { if (doc.exitFullscreen) doc.exitFullscreen().catch(()=>{}); else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen(); } else if (elm) { if (elm.requestFullscreen) elm.requestFullscreen().catch(()=>{}); else if (elm.webkitRequestFullscreen) elm.webkitRequestFullscreen(); } } catch(e){} }} 
                 style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 15px", borderRadius: "30px", cursor: "pointer", fontFamily: "Orbitron, sans-serif", fontWeight: "bold" }}>
                 [ FULL SCREEN ]
             </button>
         </div>
         
         {/* Environmental UI Toggles */}
         <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100000, display: "flex", gap: "10px" }}>
             <button onClick={() => setShowGrid((p: boolean) => !p)} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#0088ff", fontSize: "12px", padding: "5px 15px", cursor: "pointer", borderRadius: "30px", fontWeight: "bold" }}>
                 [ {showGrid ? "HIDE" : "SHOW"} TACTICAL GRID ]
             </button>
             <button onClick={() => setShowBackground((p: boolean) => !p)} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#d946ef", fontSize: "12px", padding: "5px 15px", cursor: "pointer", borderRadius: "30px", fontWeight: "bold" }}>
                 [ {showBackground ? "HIDE" : "SHOW"} NEBULA ]
             </button>
             <button onClick={() => setShowWake((p: boolean) => !p)} style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#4ade80", fontSize: "12px", padding: "5px 15px", cursor: "pointer", borderRadius: "30px", fontWeight: "bold" }}>
                 [ {showWake ? "HIDE" : "SHOW"} PLASMA WAKE (TEST) ]
             </button>
         </div>
         
         {/* LOCALIZED ROCKET ENGINE TUNING PANEL */}
         <div style={{ display: "none", position: "absolute", top: 60, right: 20, background: "rgba(0,0,0,0.6)", border: "1px solid #0088ff", borderRadius: "8px", padding: "15px", zIndex: 100, flexDirection: "column", gap: "10px", color: "#0088ff", fontFamily: "Orbitron, sans-serif", width: "260px" }}>
             <h3 style={{ margin: 0, fontSize: "1rem", borderBottom: "1px solid rgba(0, 229, 255, 0.3)", paddingBottom: "5px" }}>PLASMA WAKE ENGINE</h3>
             
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Fluid Splat Force: <span style={{ color: "#fff" }}>{missileConfig.splatForce}</span>
                 <input type="range" min="1" max="25000" step="1" value={missileConfig.splatForce} onChange={e => setMissileConfig(p => ({...p, splatForce: Number(e.target.value)}))} style={{ accentColor: "#0088ff" }} />
             </label>
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Fluid Splat Radius: <span style={{ color: "#fff" }}>{missileConfig.splatRadius.toFixed(4)}</span>
                 <input type="range" min="0.0001" max="0.2" step="0.0001" value={missileConfig.splatRadius} onChange={e => setMissileConfig(p => ({...p, splatRadius: Number(e.target.value)}))} style={{ accentColor: "#0088ff" }} />
             </label>
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Wake Dissipation: <span style={{ color: "#fff" }}>{missileConfig.velocityDissipation.toFixed(3)}</span>
                 <input type="range" min="0.001" max="4.0" step="0.01" value={missileConfig.velocityDissipation} onChange={e => setMissileConfig(p => ({...p, velocityDissipation: Number(e.target.value)}))} style={{ accentColor: "#0088ff" }} />
             </label>
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Physical Missile Scale: <span style={{ color: "#fff" }}>{missileConfig.emitterSize.toFixed(2)}x</span>
                 <input type="range" min="0.01" max="3.0" step="0.01" value={missileConfig.emitterSize} onChange={e => setMissileConfig(p => ({...p, emitterSize: Number(e.target.value)}))} style={{ accentColor: "#facc15" }} />
             </label>
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Projectile Speed: <span style={{ color: "#fff" }}>{missileConfig.projectileSpeed.toFixed(2)}</span>
                 <input type="range" min="0.01" max="30.0" step="0.01" value={missileConfig.projectileSpeed} onChange={e => setMissileConfig(p => ({...p, projectileSpeed: Number(e.target.value)}))} style={{ accentColor: "#facc15" }} />
             </label>
             <label style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                 Rate of Fire (Frames): <span style={{ color: "#fff" }}>{missileConfig.fireRate}</span>
                 <input type="range" min="10" max="600" step="5" value={missileConfig.fireRate} onChange={e => setMissileConfig(p => ({...p, fireRate: Number(e.target.value)}))} style={{ accentColor: "#facc15" }} />
             </label>
             <button style={{ marginTop: "5px", padding: "5px 15px", background: "transparent", border: "1px solid #0088ff", color: "#0088ff", cursor: "pointer", borderRadius: "30px", fontWeight: "bold" }}
                 onClick={() => {
                     // Save overrides locally so they persist during reloads
                     localStorage.setItem("splash_cursor_v3", JSON.stringify({ missile: missileConfig }));
                 }}>
                 SAVE HARDWARE CONFIG
             </button>
         </div>
         
         {gameState === 'INITIALIZING' && (
             <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", zIndex: 100 }}>
                 <div style={{ width: "240px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", position: "relative", margin: "0 auto" }}>
                     <div style={{ 
                         position: "absolute", top: 0, left: 0, height: "100%", width: "100%", 
                         background: "linear-gradient(90deg, #4f46e5, #7c3aed, #0088ff)", 
                         animation: "arn-load-fill 1.5s ease-out forwards" 
                     }} />
                 </div>
                 <style>{`@keyframes arn-load-fill { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
             </div>
         )}
         
         {gameState === 'LOBBY' && (
             <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "auto", zIndex: 100 }}>
                 
                 {/* PLAYER SIDE (LEFT) */}
                 <div style={{ position: "absolute", top: "45%", left: "25%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                     
                     {/* Portrait & Left-Hemisphere Orbiting Ships */}
                     <div style={{ position: "relative", width: "200px", height: "200px" }}>
                         <div style={{ 
                             width: "200px", height: "200px", borderRadius: "50%", border: "4px solid #0088ff", 
                             backgroundImage: "url(/game_assets/avatars/v2/Gemini_Generated_Image_gjo9hcgjo9hcgjo9.jpeg)", 
                             backgroundSize: "320%", backgroundPosition: "center 25%",
                             zIndex: 2, position: "relative", transform: "scaleX(-1)"
                         }}></div>
                     </div>
                     
                     <h2 style={{ color: "#0088ff", fontFamily: "Orbitron, sans-serif", fontSize: "1.5rem", marginTop: "20px", marginBottom: "0", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" }}>
                         Captain Ross
                     </h2>

                     {/* BIG SHIPS TOTAL */}
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px", color: "#0088ff", fontFamily: "Orbitron, sans-serif" }}>
                         <span style={{ fontSize: "6rem", fontWeight: "900", lineHeight: "1" }}>{activeShips.size * 1420 + 20}</span>
                         <span style={{ fontSize: "1rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "4px" }}>TOTAL POWER</span>
                     </div>

                     {/* STATS UNDER PLAYER PORTRAIT (NO GLOW) */}
                     <div style={{ marginTop: "35px", display: "flex", gap: "20px", justifyContent: "center", color: "#0088ff", fontFamily: "Orbitron, sans-serif" }}>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>HP</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{activeShips.size * 120}</span>
                         </div>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>SPEED</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{Math.floor(100 + activeShips.size * 5)}</span>
                         </div>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>DAMAGE</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{activeShips.size * 45}</span>
                         </div>
                     </div>
                     <button style={{ 
                         marginTop: "125px", padding: "10px 40px", fontSize: "1rem", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", 
                         background: "#ffffff", color: "#a855f7", border: "2px solid #a855f7", borderRadius: "30px", 
                         cursor: "pointer", textTransform: "uppercase", letterSpacing: "2px", transition: "all 0.2s" 
                     }} onMouseOver={e => { e.currentTarget.style.background = "#a855f7"; e.currentTarget.style.color = "#ffffff"; }} onMouseOut={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#a855f7"; }}>CARGO</button>
                 </div>

                 {/* ENEMY SIDE (RIGHT) */}
                 <div style={{ position: "absolute", top: "45%", left: "75%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                     
                     {/* Portrait & Right-Hemisphere Orbiting Ships */}
                     <div style={{ position: "relative", width: "200px", height: "200px" }}>
                         <div style={{ 
                             width: "200px", height: "200px", borderRadius: "50%", border: "4px solid #facc15", 
                             backgroundImage: "url(/game_assets/avatars/v2/Gemini_Generated_Image_i7uy7ri7uy7ri7uy.jpeg)", 
                             backgroundSize: "300%", backgroundPosition: "center 25%",
                             zIndex: 2, position: "relative"
                         }}></div>

                         {/* Floating iMessage Bubble */}
                         <div style={{
                             position: "absolute", top: "10px", right: "220px",
                             background: "#ffffff", border: "3px solid #facc15", borderRadius: "30px",
                             padding: "10px 15px", color: "#facc15", fontFamily: "Orbitron, sans-serif", fontSize: "0.8rem", fontWeight: "900",
                             zIndex: 10, width: "200px", textAlign: "center"
                         }}>
                             "Tonight I will drink to your bones."
                         </div>
                     </div>
                     
                     <h2 style={{ color: "#facc15", fontFamily: "Orbitron, sans-serif", fontSize: "1.5rem", marginTop: "20px", marginBottom: "0", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" }}>
                         Mr. Butterworth
                     </h2>

                     {/* BIG SHIPS TOTAL */}
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px", color: "#facc15", fontFamily: "Orbitron, sans-serif" }}>
                         <span style={{ fontSize: "6rem", fontWeight: "900", lineHeight: "1" }}>4280</span>
                         <span style={{ fontSize: "1rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "4px" }}>TOTAL POWER</span>
                     </div>

                     {/* ENEMY STATS UNDER PORTRAIT (NO GLOW) */}
                     <div style={{ marginTop: "35px", display: "flex", gap: "20px", justifyContent: "center", color: "#facc15", fontFamily: "Orbitron, sans-serif" }}>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>HP</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{activeShips.size * 135}</span>
                         </div>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>SPEED</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{Math.floor(105 + activeShips.size * 5)}</span>
                         </div>
                         <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                             <span style={{ fontSize: "0.85rem", fontWeight: "bold", opacity: 0.7, letterSpacing: "2px" }}>DAMAGE</span>
                             <span style={{ fontSize: "1.8rem", fontWeight: "900" }}>{activeShips.size * 40}</span>
                         </div>
                     </div>
                     <button style={{ 
                         marginTop: "125px", padding: "10px 40px", fontSize: "1rem", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", 
                         background: "#ffffff", color: "#a855f7", border: "2px solid #a855f7", borderRadius: "30px", 
                         cursor: "pointer", textTransform: "uppercase", letterSpacing: "2px", transition: "all 0.2s" 
                     }} onMouseOver={e => { e.currentTarget.style.background = "#a855f7"; e.currentTarget.style.color = "#ffffff"; }} onMouseOut={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#a855f7"; }}>CARGO</button>
                 </div>

                 {/* TRUE FULL-SCREEN BOUNDARY ARC (PLAYER SHIPS) */}
                 {Array.from({length: 6}).map((_, i) => {
                     // Center of West is -PI. Reduced spread to 0.8 to tighten distance between ships
                     const spread = 0.8;
                     const angle = -Math.PI - (spread / 2) + (i / 5) * spread;
                     const sin = Math.sin(angle);
                     const cos = Math.cos(angle); 
                     const radiusCalc = `calc(max(50vw, 50vh) - 100px)`; // Inward 100px offset track maintaining boundary curve
                     const shipId = (i % 3) + 1;
                     const globalId = i + 1;
                     const isActive = activeShips.has(globalId);

                     const imageRotation = angle * (180 / Math.PI) - 90;

                     return (
                         <div key={`arc-p-ship-${globalId}`}
                             onClick={() => setActiveShips(prev => { 
                                 const n = new Set(prev); 
                                 if(n.has(globalId)){
                                     if(n.size>1) n.delete(globalId);
                                 }else{
                                     if(n.size < 3) n.add(globalId); 
                                 } 
                                 return n; 
                             })}
                             style={{
                                 position: "absolute", 
                                 top: `calc(50% + ${radiusCalc} * ${sin})`, 
                                 left: `calc(50% + ${radiusCalc} * ${cos})`, 
                                 transform: "translate(-50%, -50%)",
                                 width: "100px", height: "100px", borderRadius: "50%",
                                 background: isActive ? "rgba(0, 229, 255, 0.2)" : "rgba(0,0,0,0.8)",
                                 border: isActive ? "3px solid #0088ff" : "3px solid #555",
                                 cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center",
                                 transition: "all 0.2s"
                             }}>
                             <img src={`/game_assets/ships/v1/player_ship_0${shipId}.png`} alt="Player Ship" style={{ height: "70px", objectFit: "contain", transform: `rotate(${imageRotation}deg)`, opacity: isActive ? 1.0 : 0.5 }} />
                         </div>
                     );
                 })}

                 {/* TRUE FULL-SCREEN BOUNDARY ARC (ENEMY SHIPS) */}
                 {Array.from({length: 6}).map((_, i) => {
                     // Center of East is 0. Reduced spread to 0.8 to tighten distance between ships
                     const spread = 0.8;
                     const angle = -(spread / 2) + (i / 5) * spread;
                     const sin = Math.sin(angle);
                     const cos = Math.cos(angle); 
                     const radiusCalc = `calc(max(50vw, 50vh) - 100px)`; // Inward 100px offset track maintaining boundary curve
                     const shipId = (i % 3) + 1;
                     const isActive = i < 3; // Enemy selection completely disconnected from player
                     
                     const imageRotation = angle * (180 / Math.PI) - 90;

                     return (
                         <div key={`arc-e-ship-${i}`}
                             style={{
                                 position: "absolute", 
                                 top: `calc(50% + ${radiusCalc} * ${sin})`, 
                                 left: `calc(50% + ${radiusCalc} * ${cos})`, 
                                 transform: "translate(-50%, -50%)",
                                 width: "100px", height: "100px", borderRadius: "50%",
                                 background: isActive ? "rgba(244, 63, 94, 0.2)" : "rgba(0,0,0,0.8)",
                                 border: isActive ? "3px solid #facc15" : "3px solid #555",
                                 display: "flex", justifyContent: "center", alignItems: "center",
                                 transition: "all 0.4s"
                             }}>
                             <img src={`/game_assets/ships/v1/player_ship_0${shipId}.png`} alt="Enemy Ship" style={{ height: "70px", objectFit: "contain", transform: `rotate(${imageRotation}deg)`, opacity: isActive ? 1.0 : 0.5 }} />
                         </div>
                     );
                 })}

                 {/* CENTERED FIGHT BUTTON SHRUNK NO GLOW */}
                 <button 
                    onPointerDown={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%) scale(0.9)"; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"; }}
                    onClick={() => { setMatchMode('PATHFINDING'); setCountdown(3); setGameState('SETUP'); try { const doc = document as any; const elm = containerRef.current || doc.documentElement as any; if (!doc.fullscreenElement && !doc.webkitFullscreenElement) { if (elm.requestFullscreen) elm.requestFullscreen().catch(() => {}); else if (elm.webkitRequestFullscreen) elm.webkitRequestFullscreen(); } } catch (e) {} }}
                    style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        padding: "20px 80px", background: "#ffffff", border: "6px solid #a855f7", borderRadius: "100px", 
                        color: "#a855f7", fontSize: "2rem", fontWeight: "900", cursor: "pointer",
                        fontFamily: "Orbitron, sans-serif",
                        transition: "all 0.1s ease-out", zIndex: 1000
                    }}>
                     FIGHT
                 </button>

                 {/* Map Selection Buttons */}
                 <div style={{ position: "absolute", top: "calc(50% + 70px)", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "20px", zIndex: 1000 }}>
                    <div 
                       onClick={() => setArenaBackground('lapse')}
                       style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f97316", border: arenaBackground === 'lapse' ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "transform 0.2s" }}
                       onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                       onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                       title="Lapse Map"
                    />
                    <div 
                       onClick={() => setArenaBackground('nexus')}
                       style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#a855f7", border: arenaBackground === 'nexus' ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "transform 0.2s" }}
                       onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                       onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                       title="Nexus Map"
                    />
                 </div>

                 {/* BOTTOM LEFT RETREAT BUTTON SHRUNK NO GLOW */}
                 <button 
                    onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                    onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    onClick={() => window.history.back()}
                    style={{
                        position: "absolute", bottom: "40px", left: "40px",
                        width: "80px", height: "80px", background: "#ffffff", border: "4px solid #facc15", borderRadius: "50%", 
                        color: "#facc15", fontSize: "0.8rem", fontWeight: "900", cursor: "pointer",
                        fontFamily: "Orbitron, sans-serif",
                        transition: "transform 0.1s ease-out", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                     RETREAT
                 </button>
             </div>
         )}

         {gameState === 'SETUP' && (
             <>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", fontSize: "10rem", fontWeight: "900", background: "linear-gradient(to bottom, #ffffff 30%, #aaaaaa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {countdown}
                </div>
             </>
         )}
         
         {gameState === 'PLAYING' && (
             <>
             {/* Enemy Cards (Updated to match health-border style) */}
             <div style={{ position: "absolute", top: "50%", right: 20, transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "15px", zIndex: 20, pointerEvents: "none" }}>
                 {[4, 5, 6].filter(id => activeShips.has(id - 3)).map(id => {
                     const sMap = shipUI[id];
                     if (!sMap) return null;
                     const isDead = !sMap.alive;
                     const isGrayedOut = isDead;
                     
                     let uiColor = "#facc15";
                     if (id === 5) uiColor = "#facc15";
                     if (id === 6) uiColor = "#4ade80";
                     if (focusedEnemyId === id) uiColor = "#ff00ff";
                     
                     const hexToRgba = (hex: string, alpha: number) => {
                         const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
                         return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                     };
                     
                     return (
                         <div key={id} 
                         onClick={() => {
                             if (isDead) return;
                             setFocusedEnemyId(id);
                             const allPlayerShips = [1, 2, 3].filter(pid => activeShips.has(pid) && shipUI[pid]?.alive);
                             if (allPlayerShips.length > 0) {
                                 window.dispatchEvent(new CustomEvent('VANGUARD_ORDER', { detail: { selected: allPlayerShips, directTargetId: id }}));
                             }
                         }}
                         style={{
                               pointerEvents: "auto",
                               width: "70px", height: "70px", borderRadius: "50%",
                               background: isGrayedOut ? "#555" : `conic-gradient(${uiColor} ${sMap.hp}%, rgba(0,0,0,0.4) ${sMap.hp}%)`,
                               display: "flex", alignItems: "center", justifyContent: "center", padding: "4px",
                               cursor: isDead ? "default" : "crosshair",
                               transition: "all 0.2s"
                           }}>
                           <div style={{
                               width: "100%", height: "100%", borderRadius: "50%",
                               backgroundColor: isGrayedOut ? "rgba(50,50,50,0.8)" : "#ffffff",
                               backgroundImage: isGrayedOut ? "none" : "url(/game_assets/avatars/v2/Gemini_Generated_Image_i7uy7ri7uy7ri7uy.jpeg)",
                               backgroundSize: "300%", backgroundPosition: "center 25%",
                               color: isGrayedOut ? "#777" : uiColor,
                               border: `2px solid ${isGrayedOut ? "#777" : uiColor}`,
                               display: "flex", alignItems: "center", justifyContent: "center",
                               fontSize: "1.2rem", fontWeight: "900",
                               textShadow: isGrayedOut ? "none" : "0 0 6px #000, 0 0 6px #000, 0 0 6px #000",
                               boxShadow: isGrayedOut ? "none" : "inset 0 0 10px rgba(0,0,0,0.8)"
                           }}>
                               {isDead ? "X" : ""}
                           </div>
                         </div>
                     );
                 })}
             </div>

             {/* Top-Center Unified Mastery Tracker (Star Milestones) */}
             <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
                 {(() => {
                     const p1 = shipUI[1] as any;
                     if (!p1) return null;
                     
                     // Score calculation based strictly on cargo (dust collection)
                     // Scaling cargo to 100 for maximum star rating
                     const maxScore = 150;
                     const score = Math.min(maxScore, p1.cargo || 0);
                     const fillPct = (score / maxScore) * 100;
                     
                     const stars = [33, 66, 100];
                     
                     return (
                         <div style={{ 
                             width: "280px", padding: "5px 15px", background: "#ffffff", borderRadius: "30px", 
                             border: `2px solid #0088ff`,
                             display: "flex", alignItems: "center", gap: "10px"
                         }}>
                             {/* Progress Bar with Star Milestones Overlay */}
                             <div style={{ position: "relative", height: "12px", flexGrow: 1, background: "rgba(0,0,0,0.1)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center" }}>
                                 {/* Dynamic Fill */}
                                 <div style={{ height: "100%", width: `${fillPct}%`, background: "#0088ff", borderRadius: "6px", transition: "width 0.2s ease-out" }} />
                                 
                                 {/* Star Markers Overlay */}
                                 {stars.map((milestone, idx) => {
                                     const reached = fillPct >= milestone;
                                     // Slightly adjust left transform so 100% star fits entirely within the bar bounds
                                     const leftTransformOffset = milestone === 100 ? "calc(100% - 14px)" : `${milestone}%`;
                                     
                                     return (
                                         <div key={idx} style={{ position: "absolute", left: leftTransformOffset, top: "50%", transform: "translate(-50%, -50%)", transition: "all 0.3s" }}>
                                             {/* SVG Star */}
                                             <svg width="14" height="14" viewBox="0 0 24 24" fill={reached ? "#facc15" : "rgba(255,255,255,0.8)"} stroke={reached ? "#ca8a04" : "rgba(0,0,0,0.2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                 <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                             </svg>
                                         </div>
                                     );
                                 })}
                             </div>
                             
                             {/* Number Tracker inline at the exact end of the bar */}
                             <div style={{ color: "#0088ff", fontFamily: "Orbitron, sans-serif", fontWeight: "900", fontSize: "1rem", paddingLeft: "5px" }}>
                                 {score}
                             </div>
                         </div>
                     );
                 })()}
             </div>

             {/* Vanguard Ship Selection (Left Mirror Column) */}
             <div style={{ position: "absolute", top: "50%", left: 20, transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "15px", zIndex: 20, pointerEvents: "none" }}>
                 {[1, 2, 3].filter(id => activeShips.has(id)).map((id, index) => {
                     const sMap = shipUI[id];
                     if (!sMap) return null;
                     const isDead = !sMap.alive;
                     const isGrayedOut = isDead;
                     
                     let uiColor = id <= 3 ? "#0088ff" : "#facc15";
                     
                     return (
                        <div key={id} onClick={() => {
                            if (isGrayedOut) return;
                            if (id <= 3) setSelectedShips(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })
                            else if (selectedShips.size > 0) {
                                window.dispatchEvent(new CustomEvent('VANGUARD_ORDER', { detail: { selected: Array.from(selectedShips), directTargetId: id }}));
                            }
                        }}
                           style={{
                               pointerEvents: "auto",
                               width: "70px", height: "70px", borderRadius: "50%",
                               background: isGrayedOut ? "#555" : `conic-gradient(${uiColor} ${sMap.hp}%, rgba(0,0,0,0.4) ${sMap.hp}%)`,
                               display: "flex", alignItems: "center", justifyContent: "center", padding: "4px",
                               cursor: isGrayedOut ? "not-allowed" : (id > 3 && selectedShips.size > 0 ? "crosshair" : "pointer"),
                               transition: "all 0.2s"
                           }}>
                           <div style={{
                               width: "100%", height: "100%", borderRadius: "50%",
                               backgroundColor: isGrayedOut ? "rgba(50,50,50,0.8)" : (selectedShips.has(id) ? uiColor : "rgba(255,255,255,0.7)"),
                               backgroundImage: isGrayedOut ? "none" : "url(/game_assets/avatars/v2/Gemini_Generated_Image_gjo9hcgjo9hcgjo9.jpeg)",
                               backgroundSize: "320%", backgroundPosition: "center 25%", backgroundBlendMode: selectedShips.has(id) ? "hard-light" : "normal",
                               color: isGrayedOut ? "#777" : (selectedShips.has(id) ? "#ffffff" : uiColor),
                               border: `2px solid ${isGrayedOut ? "#777" : uiColor}`,
                               display: "flex", alignItems: "center", justifyContent: "center",
                               fontSize: "1.2rem", fontWeight: "900",
                               textShadow: isGrayedOut ? "none" : "0 0 6px #000, 0 0 6px #000, 0 0 6px #000",
                               boxShadow: isGrayedOut ? "none" : "inset 0 0 10px rgba(0,0,0,0.8)"
                           }}>
                               {isDead ? "X" : ""}
                           </div>
                        </div>
                     );
                 })}
             </div>
             
             {/* Action Triangle Buttons */}
             <div style={{ position: "absolute", bottom: 40, right: 140, width: "320px", height: "280px", zIndex: 100, pointerEvents: "none" }}>
                 <button 
                     onClick={() => { 
                         const nextCmd = playerCommand === 'DIVE' ? 'ROVE' : 'DIVE';
                         playerCommandRef.current = nextCmd; 
                         setPlayerCommand(nextCmd); 
                         window.dispatchEvent(new CustomEvent('SYNC_UI_COMMAND', { detail: nextCmd }));
                     }}
                     style={{ 
                         pointerEvents: "auto",
                         position: "absolute", top: 0, left: "50%",
                         width: "140px", height: "140px", borderRadius: "50%",
                         background: playerCommand === 'DIVE' ? "#facc15" : "#ffffff", 
                         border: playerCommand === 'DIVE' ? "4px solid #fff" : "4px solid #facc15", 
                         color: playerCommand === 'DIVE' ? "#fff" : "#facc15", 
                         fontSize:"1.4rem", fontWeight:"900", cursor:"pointer", 
                         transform: `translateX(-50%) ${playerCommand === 'DIVE' ? "scale(0.95)" : "scale(1)"}`,
                         transition: "all 0.1s ease-out", display: "flex", alignItems: "center", justifyContent: "center"
                     }}>
                     DIVE
                 </button>
                 <button 
                     onClick={() => { 
                         const nextCmd = playerCommand === 'RETREAT' ? 'ROVE' : 'RETREAT';
                         playerCommandRef.current = nextCmd; 
                         setPlayerCommand(nextCmd); 
                         window.dispatchEvent(new CustomEvent('SYNC_UI_COMMAND', { detail: nextCmd }));
                     }}
                     style={{ 
                         pointerEvents: "auto",
                         position: "absolute", top: 140, left: 0,
                         width: "140px", height: "140px", borderRadius: "50%",
                         background: playerCommand === 'RETREAT' ? "#f97316" : "#ffffff", 
                         border: playerCommand === 'RETREAT' ? "4px solid #fff" : "4px solid #f97316", 
                         color: playerCommand === 'RETREAT' ? "#fff" : "#f97316", 
                         fontSize:"1.2rem", fontWeight:"900", cursor:"pointer", 
                         transform: playerCommand === 'RETREAT' ? "scale(0.95)" : "scale(1)",
                         transition: "all 0.1s ease-out", display: "flex", alignItems: "center", justifyContent: "center"
                     }}>
                     TURN
                 </button>
                 <button 
                     onPointerDown={(e) => { 
                         e.currentTarget.style.transform = "scale(0.95)";
                         window.dispatchEvent(new CustomEvent('VANGUARD_FLARE'));
                     }}
                     onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                     onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                     style={{ 
                         pointerEvents: "auto",
                         position: "absolute", top: 140, right: 0,
                         width: "140px", height: "140px", borderRadius: "50%",
                         background: "#ffffff", 
                         border: "4px solid #0088ff", 
                         color: "#0088ff", 
                         fontSize:"1.2rem", fontWeight:"900", cursor:"pointer", 
                         transform: "scale(1)",
                         transition: "transform 0.1s ease-out", display: "flex", alignItems: "center", justifyContent: "center"
                     }}>
                     FLARE
                 </button>
             </div>
             </>
         )}
         
         {gameState === 'GAMEOVER' && (() => {
             const survivingPlayers = Object.values(shipUI).filter((s: any) => s.alive && s.id <= 3).length;
             const survivingEnemies = Object.values(shipUI).filter((s: any) => s.alive && s.id > 3).length;
             
             let isVictory = false;
             if (survivingPlayers > survivingEnemies) {
                 isVictory = true;
             } else if (survivingEnemies > survivingPlayers) {
                 isVictory = false;
             } else {
                 isVictory = damageDealt.player >= damageDealt.enemy;
             }

             return (
                 <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeInVictory 1s ease-out forwards" }}>
                     <style>{`
                         @keyframes fadeInVictory {
                             0% { opacity: 0; transform: scale(0.9); }
                             100% { opacity: 1; transform: scale(1); }
                         }
                     `}</style>
                     <div style={{ padding: "40px", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                         <h1 style={{ fontSize: "6rem", fontFamily: "Orbitron, sans-serif", margin: 0, color: isVictory ? "#0088ff" : "#facc15" }}>
                             {isVictory ? "VICTORY" : "DEFEAT"}
                         </h1>
                         <h3 style={{ fontSize: "2rem", color: "#fff", margin: "20px 0", fontFamily: "Orbitron, sans-serif" }}>MATCH CONCLUDED</h3>
                     
                     <div style={{ display: "flex", gap: "60px", marginTop: "20px", justifyContent: "center" }}>
                         <div style={{ textAlign: "center", color: isVictory ? "#0088ff" : "#facc15" }}>
                             <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", fontFamily: "Orbitron, sans-serif" }}>PLAYER DAMAGE</p>
                             <p style={{ margin: 0, fontSize: "3rem", fontFamily: "Orbitron, sans-serif", fontWeight: 900 }}>{Math.round(damageDealt.player)}</p>
                         </div>
                         <div style={{ textAlign: "center", color: !isVictory ? "#0088ff" : "#facc15" }}>
                             <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", fontFamily: "Orbitron, sans-serif" }}>ENEMY DAMAGE</p>
                             <p style={{ margin: 0, fontSize: "3rem", fontFamily: "Orbitron, sans-serif", fontWeight: 900 }}>{Math.round(damageDealt.enemy)}</p>
                         </div>
                     </div>
 
                     <div style={{ marginTop: "40px", fontSize: "1.2rem", color: "#fbd38d", fontFamily: "Orbitron, sans-serif", textAlign: "center" }}>
                         <p style={{ margin: "0 0 15px 0", color: "#fff", fontSize: "16px", fontWeight: "bold" }}>ELAPSED BATTLE TIME: <span style={{ color: isVictory ? "#0088ff" : "#facc15" }}>{Math.floor((180 - matchTimer) / 60)}:{((180 - matchTimer) % 60).toString().padStart(2, '0')}</span></p>
                         <div style={{ display: "flex", gap: "30px", justifyContent: "center", flexWrap: "wrap", maxWidth: "800px", marginTop: "40px" }}>
                             {[1, 2, 3, 4, 5, 6].filter(id => id <= 3 ? activeShips.has(id) : activeShips.has(id - 3)).map(id => {
                                 const ship = shipUI[id];
                                 if (!ship) return null;
                                 
                                 let uiColor = id <= 3 ? "#0088ff" : "#facc15";
                                 const shipId = id <= 3 ? id : id - 3;
                                 const isEnemy = id > 3;
                                 
                                 return (
                                     <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Orbitron, sans-serif" }}>
                                         <div style={{
                                             width: "100px", height: "100px", borderRadius: "50%",
                                             background: ship.alive && isEnemy ? "rgba(244, 63, 94, 0.2)" : "rgba(0,0,0,0.8)",
                                             border: ship.alive ? `3px solid ${uiColor}` : "3px solid #555",
                                             display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "15px"
                                         }}>
                                             <img src={`/game_assets/ships/v1/player_ship_0${shipId}.png`} alt="Ship" style={{ height: "70px", objectFit: "contain", transform: `rotate(${isEnemy ? 180 : 0}deg)`, opacity: ship.alive && !isEnemy ? 1.0 : 0.5 }} />
                                         </div>
                                         <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold" }}>{ship.kills || 0} <span style={{fontSize:"0.8rem", color:"#aaa"}}>KILLS</span></div>
                                         <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: ship.alive ? uiColor : "#555", marginTop: "5px" }}>
                                             {ship.alive ? "SURVIVED" : "DESTROYED"}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
     
                     <div style={{ display: "flex", gap: "20px", marginTop: "60px", justifyContent: "center" }}>
                             <button onClick={() => {
                                 setGameState('SETUP');
                                 setCountdown(3);
                                 setMatchTimer(180);
                                 setDamageDealt({ player: 0, enemy: 0 });
                                 setLogs(['Simulation Restarting...']);
                                 setReplayKey(k => k + 1);
                             }}
                             style={{ padding: "20px 80px", background: "#ffffff", border: `6px solid ${isVictory ? "#0088ff" : "#facc15"}`, color: isVictory ? "#0088ff" : "#facc15", fontFamily: "Orbitron, sans-serif", fontSize: "1.5rem", cursor: "pointer", borderRadius: "100px", fontWeight: "900", transition: "transform 0.2s" }}
                             onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                             onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                             onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                             >
                                 REPLAY MATCH
                             </button>
                             <button onClick={() => {
                                 if (window.location.search.includes('tab=combat')) { window.location.reload(); } 
                                 else { window.location.href = window.location.pathname + '?tab=combat%20arena'; }
                             }}
                             style={{ padding: "20px 80px", background: "transparent", border: `6px solid ${isVictory ? "#0088ff" : "#facc15"}`, color: isVictory ? "#0088ff" : "#facc15", fontFamily: "Orbitron, sans-serif", fontSize: "1.5rem", cursor: "pointer", borderRadius: "100px", fontWeight: "900", transition: "transform 0.2s" }}
                             onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                             onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                             onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                             >
                                 REDEPLOY FLEETS
                             </button>
                         </div>
                     </div>
                 </div>
             );
         })()}
         

         
      </div>
  );
}