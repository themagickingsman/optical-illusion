import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, Html, MeshTransmissionMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';
import BaseBuildingEngine, { BuildingData } from './BaseBuildingEngine';
import { useBuildingsCMS, BuildingArchetype } from './BuildingsCMSData';
import Link from 'next/link';
import { BuildingIcon } from '../BuildingIcon';
import FlowFieldInstancedMap from './FlowFieldInstancedMap';
import StarsAndNebulaMap from './StarsAndNebulaMap';
import NexusGroundPlane from './NexusGroundPlane';

// ── FPS METER ───────────────────────────────────────────────────
function FPSMeter() {
    const fpsRef   = useRef<number>(60);
    const frameRef = useRef<number>(0);
    const elRef    = useRef<HTMLDivElement | null>(null);

    useFrame((_, delta) => {
        // Exponential moving average — smooth but responsive
        fpsRef.current = fpsRef.current * 0.9 + (1 / delta) * 0.1;
        frameRef.current++;
        // Update DOM every 6 frames (~10×/sec at 60fps) to avoid thrashing
        if (frameRef.current % 6 === 0 && elRef.current) {
            const fps = Math.round(fpsRef.current);
            const color = fps >= 50 ? '#00e5ff' : fps >= 30 ? '#facc15' : '#f43f5e';
            elRef.current.textContent = `${fps} FPS`;
            elRef.current.style.color = color;
            elRef.current.style.boxShadow = `0 0 8px ${color}40`;
        }
    });

    return (
        <Html
            position={[0, 0, 0]}
            style={{ pointerEvents: 'none', position: 'fixed', bottom: 20, left: 20, zIndex: 9999 }}
            prepend
        >
            <div
                ref={elRef}
                style={{
                    fontFamily: 'Orbitron, monospace',
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    color: '#00e5ff',
                    background: 'rgba(5, 5, 17, 0.75)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    backdropFilter: 'blur(6px)',
                    userSelect: 'none',
                }}
            >
                -- FPS
            </div>
        </Html>
    );
}

const HEX_SIZE = 40;

interface HexCoord {
    q: number;
    r: number;
}

// Ensure precise mathematical alignment with Asteroid Command backend matrices (FLAT-TOP AXIAL)
function hexToPixel(q: number, r: number, size: number) {
    const x = size * (3 / 2) * q;
    const y = size * Math.sqrt(3) * (r + q / 2);
    return { x, y };
}

function pixelToHex(x: number, y: number, size: number): HexCoord {
    const q = (2 / 3 * x) / size;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
    let rx = Math.round(q);
    let ry = Math.round(r);
    let rz = Math.round(-q - r);
    const x_diff = Math.abs(rx - q);
    const y_diff = Math.abs(ry - r);
    const z_diff = Math.abs(rz - (-q - r));
    if (x_diff > y_diff && x_diff > z_diff) {
        rx = -ry - rz;
    } else if (y_diff > z_diff) {
        ry = -rx - rz;
    }
    return { q: rx, r: ry };
}

function hash(q: number, r: number): number {
    let h = Math.imul(q ^ 0x5E6A, 0x9E3779B1) + Math.imul(r ^ 0x2A15, 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 16), 0x735A2D97);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

function valueNoise(q: number, r: number, scale: number): number {
    const qBase = Math.floor(q / scale);
    const rBase = Math.floor(r / scale);
    const qFrac = (q / scale) - qBase;
    const rFrac = (r / scale) - rBase;
    const qSmooth = qFrac * qFrac * (3 - 2 * qFrac);
    const rSmooth = rFrac * rFrac * (3 - 2 * rFrac);
    const h00 = hash(qBase, rBase);
    const h10 = hash(qBase + 1, rBase);
    const h01 = hash(qBase, rBase + 1);
    const h11 = hash(qBase + 1, rBase + 1);
    const nx0 = h00 * (1 - qSmooth) + h10 * qSmooth;
    const nx1 = h01 * (1 - qSmooth) + h11 * qSmooth;
    return nx0 * (1 - rSmooth) + nx1 * rSmooth;
}



function CloudOverlay() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh position={[0, 0, 100]}>
           <circleGeometry args={[4096, 64]} />
           <shaderMaterial 
               ref={materialRef}
               transparent={true}
               depthWrite={false}
               uniforms={{
                   uTime: { value: 0 },
                   uColor: { value: new THREE.Color("#ffffff") }
               }}
               vertexShader={`
                   varying vec2 vUv;
                   void main() {
                       vUv = uv;
                       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                   }
               `}
               fragmentShader={`
                   varying vec2 vUv;
                   uniform float uTime;
                   uniform vec3 uColor;

                   float rand(vec2 n) { 
                       return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                   }

                   float noise(vec2 p){
                       vec2 ip = floor(p);
                       vec2 u = fract(p);
                       u = u*u*(3.0-2.0*u);
                       
                       float res = mix(
                           mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
                           mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
                       return res*res;
                   }

                   void main() {
                       vec2 p = vUv * 12.0;
                       p.x += uTime * 0.03;
                       p.y += uTime * 0.015;
                       
                       float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;
                       float alpha = smoothstep(0.4, 0.8, n) * 0.20;
                       gl_FragColor = vec4(uColor, alpha);
                   }
               `}
           />
        </mesh>
    );
}

const PLANET_PALETTES = [
    { name: "Creeper Woods", base: "#455a24", secondary: "#2c3b14", light: "#729b37" },
    { name: "Redstone Mines", base: "#592b2b", secondary: "#361818", light: "#ff3333" },
    { name: "Fiery Forge", base: "#4a2411", secondary: "#2e1205", light: "#ff8800" },
    { name: "Obsidian Pinnacle", base: "#1e162e", secondary: "#0f0b1a", light: "#a855f7" },
    { name: "Desert Temple", base: "#d1ba8a", secondary: "#9e895d", light: "#38bdf8" },
    { name: "Highblock Halls", base: "#545454", secondary: "#333333", light: "#fac315" }
];

type BgMode = 'dots' | 'pattern' | 'nebula' | 'nexus';

// Sub-component for projecting the permanent territory boundary of the building currently held
function HoverBoundaryPreview({ hoveredHex, hexToPixel, hexSize, activeRadius }: { hoveredHex: HexCoord | null, hexToPixel: any, hexSize: number, activeRadius: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const targetPos = useRef(new THREE.Vector3(0, 0, -0.05));
    const currentOpacity = useRef(0);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        
        if (hoveredHex) {
            const pos = hexToPixel(hoveredHex.q, hoveredHex.r, hexSize);
            targetPos.current.set(pos.x, -pos.y, -0.05);
            currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 1.0, 10.0 * delta);
        } else {
            currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, 0.0, 10.0 * delta);
        }

        groupRef.current.position.lerp(targetPos.current, 15.0 * delta); 
        groupRef.current.rotation.z -= delta * 0.1; // Smooth slow orbit
        groupRef.current.visible = currentOpacity.current > 0.01;
    });

    const linePoints = useMemo(() => {
        const pts = [];
        const r = activeRadius * hexSize;
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
        }
        return pts;
    }, [activeRadius, hexSize]);

    // Apply the exact boundary geometry size so the user explicitly knows the exact final placement
    return (
        <group ref={groupRef} position={[0,0,-0.05]}>
            <Line 
                points={linePoints} 
                color="#ff00ff" 
                lineWidth={4} 
                transparent 
                opacity={0.6}
                dashed={true}
                dashSize={(activeRadius * hexSize) * 0.12} 
                gapSize={(activeRadius * hexSize) * 0.08}
            />
        </group>
    );
}

// Decoupled instance that decays entirely asynchronously via its own hardware loop
function FadingGridRing({ hex, hexToPixel, hexSize, exitTime, maxOpacity }: { hex: HexCoord, hexToPixel: any, hexSize: number, exitTime: number | null, maxOpacity: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<any>(null); // Drei Line implicitly exposes its internal Line2 primitive
    const fillRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_, delta) => {
        if (!groupRef.current || !materialRef.current || !fillRef.current) return;
        
        let target = 0;
        if (exitTime === null) {
            target = maxOpacity; 
        } else {
            const idleAge = Date.now() - exitTime;
            target = Math.max(0, maxOpacity * (1.0 - (idleAge / 400.0))); 
        }

        // Drei <Line> stores its geometry parameters under the nested .material prop dynamically
        if (materialRef.current.material) {
            materialRef.current.material.opacity = target * 0.8;
            materialRef.current.material.transparent = true;
            materialRef.current.material.depthTest = false; // Prevent Z-fighting entirely
        }

        fillRef.current.opacity = target * 0.15;
        fillRef.current.transparent = true;

        groupRef.current.visible = target > 0.01;
    });

    const linePoints = useMemo(() => {
        const pts = [];
        // Mathmatically lock the circle strictly to the inside dimensions of the hex structural bounds
        const r = hexSize * 0.82; 
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0));
        }
        return pts;
    }, [hexSize]);

    const pos = useMemo(() => hexToPixel(hex.q, hex.r, hexSize), [hex, hexToPixel, hexSize]);

    return (
        <group ref={groupRef} position={[pos.x, -pos.y, -0.05]}>
            {/* Soft inner core light up */}
            <mesh>
                <circleGeometry args={[hexSize * 0.82, 64]} />
                <meshBasicMaterial ref={fillRef} color="#00e5ff" transparent opacity={0} depthTest={false} />
            </mesh>
            {/* Ultra-lean 1.5 pixel precision device-agnostic boundary line */}
            <Line 
                ref={materialRef}
                points={linePoints} 
                color="#00e5ff" 
                lineWidth={1.5} 
                transparent 
            />
        </group>
    );
}

interface HoverSnapshot { q: number, r: number, exitTime: number | null, id: string, maxOpacity: number };

function TacticalTerrainMatrix({ activeBuilding, palette, seed, buildingsDB, bgMode }: { activeBuilding: BuildingArchetype | null, palette: any, seed: number, buildingsDB: any[], bgMode: BgMode }) {

    const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
    const [hoverTrail, setHoverTrail] = useState<HoverSnapshot[]>([]);
    const [buildings, setBuildings] = useState<BuildingData[]>([]);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniformsData = useMemo(() => ({
        uSeed: { value: seed },
        uTime: { value: 0 },
        uBase: { value: new THREE.Color(palette.base) },
        uSecondary: { value: new THREE.Color(palette.secondary) },
        uLight: { value: new THREE.Color(palette.light) },
        uOccupiedTiles: { value: Array(64).fill(null).map(() => new THREE.Vector2(-10.0, -10.0)) },
        uOccupiedColors: { value: Array(64).fill(null).map(() => new THREE.Vector3(0.0, 0.0, 0.0)) },
        uOccupiedCount: { value: 0 }
    }), []);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    useEffect(() => {
        uniformsData.uSeed.value = seed;
        uniformsData.uBase.value.set(palette.base);
        uniformsData.uSecondary.value.set(palette.secondary);
        uniformsData.uLight.value.set(palette.light);
    }, [seed, palette]);

    useEffect(() => {
        const count = Math.min(buildings.length, 64);
        for(let i = 0; i < 64; i++){
            if (i < count) {
                // Determine 2D Cartesian Hex origin in relation to mathematical mapping
                const logicalPx = hexToPixel(buildings[i].q, buildings[i].r, HEX_SIZE);
                
                // Map mathematical grid coordinates strictly to Three.js PlaneGeometry Space
                // Math +Y visually translates to PlaneGeometry -Y
                // Plane size = 8192px (-4096 to +4096 Cartesian limit) and natively stretches to 0 -> 1 Vector matrix
                const uvX = (logicalPx.x + 4096.0) / 8192.0;
                const uvY = (-logicalPx.y + 4096.0) / 8192.0;
                
                uniformsData.uOccupiedTiles.value[i].set(uvX, uvY);
                
                const archetype = buildingsDB.find(b => b.id === buildings[i].type);
                const c = new THREE.Color(archetype?.meshColor || '#00e5ff');
                uniformsData.uOccupiedColors.value[i].set(c.r, c.g, c.b);
            } else {
                uniformsData.uOccupiedTiles.value[i].set(-10.0, -10.0);
                uniformsData.uOccupiedColors.value[i].set(0.0, 0.0, 0.0);
            }
        }
        uniformsData.uOccupiedCount.value = count;
    }, [buildings, buildingsDB]);

    const handlePointerMove = (e: any) => {
        // Break free from arbitrary Global World mappings and extract the True Local 2D coordinates on the Plane Geometry
        if (!e.object) return;
        const localPoint = e.object.worldToLocal(e.point.clone());
        
        const math_x = localPoint.x;
        const math_y = -localPoint.y; 

        const hex = pixelToHex(math_x, math_y, HEX_SIZE);
        
        // Prevent unnecessary state updates, and map trail stack natively!
        if (!hoveredHex || hoveredHex.q !== hex.q || hoveredHex.r !== hex.r) {
            setHoveredHex(hex);
            
            setHoverTrail(prev => {
                const now = Date.now();
                // Filter out rings whose exitTime occurred over 500ms ago to keep memory tight 
                const active = prev.filter(h => !h.exitTime || (now - h.exitTime < 500)); 
                
                // Map the tight 7-node cluster payload (Core + strictly 1 grid space radius outer wall)
                const clusterIds = new Set<string>();
                const localCluster: { dq: number, dr: number, dist: number }[] = [];
                for (let dq = -1; dq <= 1; dq++) {
                    for (let dr = -1; dr <= 1; dr++) {
                        const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));
                        if (dist <= 1) {
                            clusterIds.add(`${hex.q+dq}_${hex.r+dr}`);
                            localCluster.push({ dq, dr, dist });
                        }
                    }
                }
                
                // Step 1: Tell any active nodes NOT in the new cluster bounding box to begin their decay sequence
                active.forEach(h => {
                    if (h.exitTime === null) {
                        const localId = `${h.q}_${h.r}`;
                        if (!clusterIds.has(localId)) {
                            h.exitTime = now;
                        }
                    }
                });

                // Step 2: Ensure every node in the new cluster is active, mounting missing nodes!
                localCluster.forEach(({dq, dr, dist}) => {
                    const q = hex.q + dq;
                    const r = hex.r + dr;
                    
                    let op = 1.0;
                    if (dist === 1) op = 0.25;
                    
                    const existingNode = active.find(h => h.exitTime === null && h.q === q && h.r === r);
                    if (existingNode) {
                         // Upgrade or Downgrade overlapping cluster nodes natively
                         existingNode.maxOpacity = op;
                    } else {
                         // Ignite physically missing rings into the geometry map
                         active.push({
                            q, r, 
                            exitTime: null, 
                            maxOpacity: op,
                            id: `ring_${now}_${Math.random()}`
                         });
                    }
                });
                
                return [...active]; // Force reconciler clone
            });
        }
    };

    const handlePointerOut = () => {
        setHoveredHex(null);
        // Cleanly formalize the exitTime for the final resting hex (and its active adjacent clusters) so they slowly decay
        setHoverTrail(prev => {
             const now = Date.now();
             const active = [...prev];
             active.forEach(h => {
                 if (h.exitTime === null) h.exitTime = now;
             });
             return active;
        });
    };

    const handlePlaneClick = (e: any) => {
        // Delta measures mouse travel distance. > 2px means it was a map drag, not a tactical click!
        if (e.delta > 2) return;
        
        e.stopPropagation();
        if (hoveredHex && activeBuilding) {
            const alreadyBuilt = buildings.find(b => b.q === hoveredHex.q && b.r === hoveredHex.r);
            if (!alreadyBuilt) {
                // Instantly inject the Base structure into native array state
                setBuildings(prev => [...prev, {
                    id: `bld_${Date.now()}_${Math.random()}`,
                    q: hoveredHex.q,
                    r: hoveredHex.r,
                    type: activeBuilding.id,
                    owner: 'command'
                }]);
            }
        }
    };

    // Calculate Ghost Hex position flawlessly mapped over the 3D texture space
    const hoverPixel = hoveredHex ? hexToPixel(hoveredHex.q, hoveredHex.r, HEX_SIZE) : { x: 0, y: 0 };

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>

            <CloudOverlay />

            {/* PROCEDURAL MINECRAFT DUNGEON FLIGHT DECK */}
            <mesh onPointerMove={handlePointerMove} onPointerOut={handlePointerOut} onClick={handlePlaneClick} position={[0, -0.2, 0]}>
                <circleGeometry args={[4096, 128]} />
                {bgMode === 'dots' ? (
                     <meshBasicMaterial color="#ffffff" transparent={false} opacity={1.0} />
                ) : bgMode === 'nebula' || bgMode === 'nexus' ? (
                     <meshBasicMaterial color="#050511" transparent={true} opacity={0.0} />
                ) : (
                     <shaderMaterial 
                        ref={materialRef}
                        depthWrite={true}
                        uniforms={uniformsData}
                        vertexShader={`
                           varying vec2 vUv;
                           void main() {
                               vUv = uv;
                               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                           }
                        `}
                        fragmentShader={`
                           varying vec2 vUv;
                           uniform float uSeed;
                           uniform float uTime;
                           uniform vec3 uBase;
                           uniform vec3 uSecondary;
                           uniform vec3 uLight;
                           
                           uniform vec2 uOccupiedTiles[64];
                           uniform vec3 uOccupiedColors[64];
                           uniform int uOccupiedCount;
                           
                           float rand(vec2 n) { 
                               return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                           }
                           float noise(vec2 p){
                               vec2 ip = floor(p);
                               vec2 u = fract(p);
                               u = u*u*(3.0-2.0*u);
                               float res = mix(
                                   mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
                                   mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
                               return res*res;
                           }
                           
                           void main() {
                               vec2 blockPos = floor(vUv * 128.0); 
                               float depth = blockPos.y / 128.0; 
                               float n = noise(blockPos * 0.15 + vec2(uSeed)); 
                               float mineralNoise = noise(blockPos * 0.5 + vec2(uSeed * 1.5));
                               
                               float shaftNoiseX = noise(vec2(blockPos.x * 0.08, uSeed));
                               float shaftNoiseY = noise(vec2(uSeed, blockPos.y * 0.08));
                               
                               vec3 color = vec3(0.0);
                               
                               if (depth > 0.96) {
                                   float cloudNoise = noise(blockPos * 0.1 + uTime * 0.2);
                                   color = mix(vec3(0.3, 0.6, 1.0), vec3(0.5, 0.8, 1.0), n);
                                   if (cloudNoise > 0.6) color = vec3(1.0);
                               } else if (depth > 0.94) {
                                   color = mix(vec3(0.1, 0.5, 0.1), vec3(0.2, 0.4, 0.1), n);
                                   if (mineralNoise > 0.7) color = vec3(0.4, 0.25, 0.15); 
                               } else if (depth < 0.08) {
                                   float lavaN = noise(blockPos * 0.3 + vec2(uTime * 0.5, uTime * 0.2));
                                   color = mix(vec3(0.9, 0.1, 0.0), vec3(1.0, 0.6, 0.0), lavaN);
                                   if (lavaN > 0.8) color = vec3(1.0, 0.9, 0.4); 
                               } else {
                                   float strata = sin(depth * 300.0 + noise(blockPos * 0.05) * 6.0);
                                   vec3 rock1 = mix(vec3(0.4, 0.4, 0.4), uBase, 0.4); 
                                   vec3 rock2 = mix(vec3(0.3, 0.3, 0.3), uSecondary, 0.4);
                                   color = mix(rock1, rock2, smoothstep(-0.5, 0.5, strata));
                                   
                                   bool isShaft = false;
                                   if ((shaftNoiseX > 0.85 || shaftNoiseY > 0.85) && depth <= 0.94 && depth >= 0.08) {
                                       if (mod(blockPos.x, 2.0) == 0.0 && mod(blockPos.y, 2.0) == 0.0) {
                                          color = vec3(0.25, 0.15, 0.05); 
                                       } else {
                                          color = vec3(0.1, 0.08, 0.05); 
                                       }
                                       isShaft = true;
                                   }
                                   
                                   if (!isShaft) {
                                       if (mineralNoise > 0.88) color = uLight; 
                                       else if (mineralNoise < 0.12) color = vec3(0.15, 0.15, 0.15); 
                                       else if (mineralNoise > 0.78 && mineralNoise <= 0.88) color = vec3(0.6, 0.2, 0.2); 
                                   }
                               }
                               
                               vec2 localUv = fract(vUv * 128.0);
                               if (depth <= 0.96) {
                                   if (localUv.x < 0.05 || localUv.y < 0.05) color *= 0.75; 
                                   if (localUv.x > 0.95 || localUv.y > 0.95) color *= 1.25; 
                               }
                               
                               vec3 totalThemeGlow = vec3(0.0);
                               for(int i = 0; i < 64; i++) {
                                   if (i >= uOccupiedCount) break;
                                   float d = distance(vUv, uOccupiedTiles[i]);
                                   float underGlow = smoothstep(0.008, 0.0, d);
                                   totalThemeGlow += uOccupiedColors[i] * (underGlow * 0.6);
                               }
                               color += min(totalThemeGlow, vec3(0.4));
                               
                               float dist = distance(vUv, vec2(0.5));
                               float vignette = smoothstep(0.8, 0.25, dist);
                               color *= mix(0.70, 1.0, vignette);
        
                               gl_FragColor = vec4(color, 1.0);
                           }
                        `}
                     />
                )}
            </mesh>
            
            {/* BACKGROUND GENERATORS */}
            {bgMode === 'dots' && <FlowFieldInstancedMap seed={seed} colors={[palette.base, palette.secondary, palette.light]} />}
            {bgMode === 'nebula' && <StarsAndNebulaMap seed={seed} colors={[palette.base, palette.secondary, palette.light]} />}
            {/* STANDALONE MMO BASE BUILDING ENGINE */}
            <BaseBuildingEngine 
               buildings={buildings} 
               hexSize={HEX_SIZE} 
               hexToPixel={hexToPixel} 
            />

            {/* INTERACTIVE TRON-TRAIL GRID REVEAL MULTI-CLUSTER */}
            {hoverTrail.map((snap) => {
                return (
                    <FadingGridRing 
                        key={snap.id} 
                        hex={snap} 
                        hexToPixel={hexToPixel} 
                        hexSize={HEX_SIZE} 
                        exitTime={snap.exitTime} 
                        maxOpacity={snap.maxOpacity}
                    />
                );
            })}

            {/* SECONDARY PREVIEW RENDER FOR MASSIVE TERRITORY PROJECTING BOUNDARIES */}
            {activeBuilding && activeBuilding.name === 'Shield Generator' && (
                <HoverBoundaryPreview 
                    hoveredHex={hoveredHex} 
                    hexToPixel={hexToPixel} 
                    hexSize={HEX_SIZE} 
                    activeRadius={4.5} 
                />
            )}

            {/* ELECTRIC BLUE FOUNDATION OUTLINES FOR BUILT STRUCTURES */}
            {buildings.map((b) => {
                const bPos = hexToPixel(b.q, b.r, HEX_SIZE);
                return (
                    <group key={`outline_${b.id}`} position={[bPos.x, -bPos.y, -0.15]}>
                        <mesh>
                            <circleGeometry args={[HEX_SIZE * 0.85, 32]} />
                            <meshBasicMaterial color="#00e5ff" transparent opacity={0.15} />
                        </mesh>
                        <lineSegments>
                            <edgesGeometry args={[new THREE.CircleGeometry(HEX_SIZE * 0.85, 32)]} />
                            <lineBasicMaterial color="#00e5ff" linewidth={2} />
                        </lineSegments>
                    </group>
                );
            })}
        </group>
    );
}

function SmoothOrthographicZoom({ controlsRef }: { controlsRef: any }) {
    const { camera, gl, size } = useThree();
    const targetZoom = useRef(camera.zoom);
    const keys = useRef({ up: false, down: false, left: false, right: false });
    const velocity = useRef({ x: 0, z: 0 });

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); 
            const zoomDelta = e.deltaY * 0.002 * targetZoom.current;

            const minZoomX = size.width / 4096;
            const minZoomY = size.height / 4096;
            const absoluteMinZoom = Math.max(minZoomX, minZoomY);

            targetZoom.current = Math.max(absoluteMinZoom, Math.min(5.0, targetZoom.current - zoomDelta));
        };
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = true;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = true;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = false;
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = false;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false;
        };

        const dom = gl.domElement;
        dom.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            dom.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gl, camera, size]);

    useFrame(() => {
        const orthoCam = camera as THREE.OrthographicCamera;
        
        // 1. Elastic Damped Zoom Physics
        const diff = targetZoom.current - orthoCam.zoom;
        if (Math.abs(diff) > 0.001) {
            orthoCam.zoom += diff * 0.15; 
            orthoCam.updateProjectionMatrix();
        }

        // 1.5. Keyboard Kinetic Acceleration (Scale dynamically with zoom)
        // Inverted mapping: User wants the MAP to move in the direction of the key (i.e. Camera moves opposite)
        const accel = 1.0 / orthoCam.zoom; 
        if (keys.current.up) velocity.current.z += accel;    // Map moves UP (Camera moves DOWN/+Z)
        if (keys.current.down) velocity.current.z -= accel;  // Map moves DOWN (Camera moves UP/-Z)
        if (keys.current.left) velocity.current.x += accel;  // Map moves LEFT (Camera moves RIGHT/+X)
        if (keys.current.right) velocity.current.x -= accel; // Map moves RIGHT (Camera moves LEFT/-X)

        // Apply Keyboard Momentum
        if (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.z) > 0.01) {
            orthoCam.position.x += velocity.current.x;
            orthoCam.position.z += velocity.current.z;
            if (controlsRef.current) {
                controlsRef.current.target.x += velocity.current.x;
                controlsRef.current.target.z += velocity.current.z;
            }
        }

        // Kinetic Friction mapped exactly to Apple Maps style 85% bleeding
        velocity.current.x *= 0.85;
        velocity.current.z *= 0.85;

        // 2. Hardware Radial Bound Collision Logic synchronized perfectly with MapControls Orbit Target
        const viewWidthHalf = (size.width / 2) / orthoCam.zoom;
        const viewHeightHalf = (size.height / 2) / orthoCam.zoom;

        // Bounding the Euclidean Distance from map center (4096 is grid boundary radius)
        const max_dist = Math.max(0, 4096 - Math.max(viewWidthHalf, viewHeightHalf)); 

        const pos2d = new THREE.Vector2(orthoCam.position.x, orthoCam.position.z);
        if (pos2d.length() > max_dist) {
            pos2d.normalize().multiplyScalar(max_dist);
            const overshootX = orthoCam.position.x - pos2d.x;
            const overshootZ = orthoCam.position.z - pos2d.y;
            
            orthoCam.position.x = pos2d.x;
            orthoCam.position.z = pos2d.y;
            
            if (controlsRef.current) {
                controlsRef.current.target.x -= overshootX;
                controlsRef.current.target.z -= overshootZ;
            }
        }

        // Continually pipe exact WebGL physical boundaries into the global Window layer 
        // to sync DOM-backgrounds (like the Nexus Fluid Effect) tightly with camera Panning & Zooming!
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('SYNC_NEXUS_CURSOR', { 
                detail: { 
                    cameraX: orthoCam.position.x, 
                    cameraY: orthoCam.position.z, // Because the world is rotated, Z represents Vertical Y pan
                    scale: orthoCam.zoom 
                } 
            }));
        }
    });

    return null;
}

export type LoupeParams = {
    radius: number;
    thickness: number;
    ior: number;
    distortion: number;
    distortionScale: number;
    temporalDistortion: number;
    chroma: number;
    anisotropy: number;
    clearcoat: number;
    attenuationDistance: number;
    transmission: number;
    roughness: number;
};

// LIQUID GLASS LOUPE (Real-time screen-space refraction Magnifier)
function LiquidGlassLoupe({ active, params }: { active: boolean, params: LoupeParams }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    useFrame((state) => {
        if (!active || !meshRef.current) return;
        
        // Unproject orthographic pointer to world space flawlessly
        const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
        vec.unproject(camera);
        
        // Fluid inertia lerping following the mouse cursor
        meshRef.current.position.lerp(new THREE.Vector3(vec.x, 50, vec.z), 0.2);
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef} position={[0, 50, 0]} rotation={[-Math.PI/2, 0, 0]} scale={[1, 1, 0.35]}>
            {/* Dynamic Radius from GUI Calibration! */}
            <sphereGeometry args={[params.radius, 64, 64]} />
            
            <MeshTransmissionMaterial 
                background={new THREE.Color('#050511')}
                thickness={params.thickness}          
                ior={params.ior}                      
                color="#eafcff"               
                attenuationColor="#00e5ff"    
                attenuationDistance={params.attenuationDistance}
                transmission={params.transmission}
                clearcoat={params.clearcoat}
                transparent={true}
                
                // --- 🚀 FAST SCREEN GRAB REFRACTION ---
                resolution={256}           // Throttle frame buffer down strictly for raw speed
                samples={1}                // Disabled AA physically
                anisotropy={0}             // Disabled volume scatter
                chromaticAberration={0}    // Disabled prismatic fringing
                roughness={0}              // Pristine smooth lens
                distortion={0}             // Disabled fluid noise displacement
                temporalDistortion={0}
            />
        </mesh>
    );
}

export default function PlanetSurfaceEngine() {
  const { buildingsDB } = useBuildingsCMS();
  const [activeBuilding, setActiveBuilding] = useState<BuildingArchetype | null>(null);
  const controlsRef = useRef<any>(null);

  const [planetPalette, setPlanetPalette] = useState(PLANET_PALETTES[0]);
  const [planetSeed, setPlanetSeed] = useState(0);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>('nebula');
  
  const [loupeParams, setLoupeParams] = useState<LoupeParams>({
      radius: 250,
      thickness: 200,          // Restored heavy glass depth to drastically warp the edges
      ior: 1.85,               // Restored high-density refraction index to destroy the frozen illusion
      distortion: 0.6,
      distortionScale: 0.3,
      temporalDistortion: 0.15,
      chroma: 0.08,
      anisotropy: 1.0,
      clearcoat: 1.0,
      attenuationDistance: 200,
      transmission: 1.0,
      roughness: 0.0
  });

  const randomizePlanet = () => {
      setPlanetSeed(Math.random() * 1000.0);
      setPlanetPalette(PLANET_PALETTES[Math.floor(Math.random() * PLANET_PALETTES.length)]);
  };

  // Set default selection dynamically if DB exists
  useEffect(() => {
     if (buildingsDB.length > 0 && !activeBuilding) {
         setActiveBuilding(buildingsDB[0]);
     }
  }, [buildingsDB]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: bgMode === 'dots' ? '#ffffff' : '#050511', overflow: 'hidden' }}>


      
      {/* 3000% GPU BOOST: WebGL Infinite Plane Rendering */}
      <Canvas 
         orthographic 
         style={{ position: 'relative', zIndex: 1 }}
         camera={{ position: [0, 500, 0], zoom: 1, up: [0, 0, -1] }}
      >
        <SmoothOrthographicZoom controlsRef={controlsRef} />
        
        <MapControls 
            ref={controlsRef}
            enableRotate={false} 
            enableZoom={false} // Disabled native rigid chunking; SmoothOrthographicZoom takes over!
            panSpeed={1.0}
            enableDamping={true}
            dampingFactor={0.15}
            screenSpacePanning={true} 
            mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        />
        
        <ambientLight intensity={1.2} />
        <directionalLight position={[3000, 1200, 1500]} intensity={2.2} />
        <React.Suspense fallback={null}>
            {bgMode === 'nexus' && <NexusGroundPlane />}
            <TacticalTerrainMatrix activeBuilding={activeBuilding} palette={planetPalette} seed={planetSeed} buildingsDB={buildingsDB} bgMode={bgMode} />
        </React.Suspense>
        <FPSMeter />
        <LiquidGlassLoupe active={isMagnifierActive} params={loupeParams} />
        
      </Canvas>

      {/* TOP RIGHT PLANET GENERATOR BUTTON */}
      <div style={{ position: 'absolute', top: 40, right: 40, zIndex: 10 }}>
           <button onClick={randomizePlanet} style={{
               background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #00e5ff', color: '#00e5ff',
               padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron, monospace', fontWeight: 'bold',
               display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(4px)',
               boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)', transition: 'all 0.2s'
           }}>
               <span style={{ fontSize: '1.2rem' }}>♽</span>
               RANDOMIZE PLANET BIOME
           </button>
           <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }}>
               BIOME: {planetPalette.name.toUpperCase()}
           </div>
      </div>

      {/* MAGNIFYING GLASS 'LIQUID LENS' TOGGLE */}
      <div style={{ position: 'absolute', top: 120, right: 40, zIndex: 10 }}>
           <button onClick={() => setIsMagnifierActive(!isMagnifierActive)} style={{
               background: isMagnifierActive ? 'rgba(0, 229, 255, 0.2)' : 'rgba(15, 23, 42, 0.8)', 
               border: `1px solid ${isMagnifierActive ? '#00e5ff' : '#475569'}`, 
               color: isMagnifierActive ? '#ffffff' : '#94a3b8',
               padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
               display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(4px)',
               boxShadow: isMagnifierActive ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none', 
               transition: 'all 0.3s ease',
               width: '100%', justifyContent: 'center'
           }}>
               <span style={{ fontSize: '1.4rem', transform: 'rotate(-45deg)' }}>⚲</span>
               <span style={{ fontFamily: 'Orbitron, monospace', fontWeight: 'bold', fontSize: '0.9rem' }}>
                   {isMagnifierActive ? 'LENS DEPLOYED' : 'EQUIP LENS'}
               </span>
           </button>
           
           {/* BACKGROUND SETTINGS TOGGLE (4 COLORED CIRCLES) */}
           <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
               {/* 1. DOTS */}
               <button 
                  onClick={() => setBgMode('dots')}
                  title="Polka Dot Flow Field"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: bgMode === 'dots' ? '2px solid #ffffff' : '2px solid transparent', background: '#e2e8f0', boxShadow: bgMode === 'dots' ? '0 0 10px #ffffff' : 'none', transition: 'all 0.2s' }} 
               />
               {/* 2. PATTERN GENERATOR */}
               <button 
                  onClick={() => setBgMode('pattern')}
                  title="Procedural Terrain Pattern"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: bgMode === 'pattern' ? '2px solid #10b981' : '2px solid transparent', background: '#34d399', boxShadow: bgMode === 'pattern' ? '0 0 10px #10b981' : 'none', transition: 'all 0.2s' }} 
               />
               {/* 3. NEBULA & STARS */}
               <button 
                  onClick={() => setBgMode('nebula')}
                  title="Deep Space Nebula & Stars"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: bgMode === 'nebula' ? '2px solid #a855f7' : '2px solid transparent', background: '#c084fc', boxShadow: bgMode === 'nebula' ? '0 0 10px #a855f7' : 'none', transition: 'all 0.2s', pointerEvents: 'auto' }} 
               />
               {/* 4. NEXUS METABALLS */}
               <button 
                  onClick={() => setBgMode('nexus')}
                  title="Nexus Metaball Environment"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: bgMode === 'nexus' ? '2px solid #14b8a6' : '2px solid transparent', background: 'radial-gradient(circle at 35% 35%, #2dd4bf, #0d9488)', boxShadow: bgMode === 'nexus' ? '0 0 12px #14b8a6' : 'none', transition: 'all 0.2s', pointerEvents: 'auto' }} 
               />
           </div>
      </div>

      {/* LOUPE OPTICS CALIBRATION GUI */}
      {isMagnifierActive && (
          <div style={{
              position: 'absolute', top: 180, right: 40, width: '280px', maxHeight: '50vh',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #00e5ff', borderRadius: '12px',
              color: '#fff', fontFamily: 'Orbitron, monospace', overflow: 'hidden',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.15)', backdropFilter: 'blur(10px)', zIndex: 10
          }}>
              <h3 style={{ margin: 0, padding: '12px 16px', fontSize: '0.85rem', color: '#00e5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid rgba(0, 229, 255, 0.2)' }}>
                  <span>OPTICS WIDGET</span>
                  <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>⚲</span>
              </h3>
              
              <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', overflowY: 'auto' }}>
                  <style>{`
                      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.9); border-radius: 4px; }
                      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.5); border-radius: 4px; }
                      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.8); }
                  `}</style>
                  {[
                      { key: 'radius', label: 'VOLUME RADIUS', min: 50, max: 1600, step: 10 },
                      { key: 'thickness', label: 'REFRACTIVE MAGNITUDE', min: -500, max: 500, step: 10 },
                      { key: 'ior', label: 'INDEX (IOR)', min: -2.0, max: 5.0, step: 0.05 },
                      { key: 'distortion', label: 'FLUID VISCOSITY', min: 0, max: 2.0, step: 0.05 },
                      { key: 'distortionScale', label: 'RIPPLE SCALE', min: 0, max: 2.0, step: 0.1 },
                      { key: 'temporalDistortion', label: 'TURBULENCE SPEED', min: 0, max: 1.0, step: 0.05 },
                      { key: 'chroma', label: 'PRISM CHROMA', min: 0, max: 0.2, step: 0.01 },
                      { key: 'anisotropy', label: 'ANISOTROPY', min: 0, max: 2.0, step: 0.1 },
                      { key: 'clearcoat', label: 'SURFACE GLARE', min: 0, max: 1.0, step: 0.1 },
                      { key: 'attenuationDistance', label: 'TINT DEPTH', min: 10, max: 500, step: 10 },
                      { key: 'transmission', label: 'TRANSPARENCY', min: 0.0, max: 1.0, step: 0.05 },
                      { key: 'roughness', label: 'MATERIAL FROST', min: 0.0, max: 1.0, step: 0.05 },
                  ].map(spec => (
                      <div key={spec.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '6px', color: '#94a3b8', letterSpacing: '1px' }}>
                              <span>{spec.label}</span>
                              <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>{loupeParams[spec.key as keyof LoupeParams].toFixed(2)}</span>
                          </div>
                          <input 
                              type="range" 
                              min={spec.min} max={spec.max} step={spec.step}
                              value={loupeParams[spec.key as keyof LoupeParams]}
                              onChange={(e) => setLoupeParams(prev => ({ ...prev, [spec.key]: parseFloat(e.target.value) }))}
                              style={{ width: '100%', accentColor: '#00e5ff', cursor: 'grab' }}
                          />
                      </div>
                  ))}
              </div>
          </div>
      )}



      {/* BOTTOM ACTION BAR: DYNAMIC CMS BUILD MENU (SCROLLABLE) */}
      <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '1rem', background: 'rgba(15, 23, 42, 0.85)', padding: '1rem', 
          borderRadius: '16px', border: '1px solid #334155', backdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)', zIndex: 20, maxWidth: '90vw', overflowX: 'auto'
      }}>
          <div style={{ display: 'flex', gap: '12px' }}>
              {buildingsDB.map((b) => (
                  <button 
                      key={b.id}
                      onClick={() => setActiveBuilding(b)}
                      style={{
                          background: activeBuilding?.id === b.id ? `${b.meshColor}33` : '#1e293b',
                          border: `2px solid ${activeBuilding?.id === b.id ? b.meshColor : '#475569'}`,
                          color: '#fff', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                          fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '0.8rem',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                          boxShadow: activeBuilding?.id === b.id ? `0 0 20px ${b.meshColor}40` : 'none',
                          transition: 'all 0.2s', minWidth: '120px'
                      }}
                  >
                      <BuildingIcon category={b.name} size={32} />
                      <div style={{ textAlign: 'center', lineHeight: '1.2' }}>{b.name}</div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{b.costCredits} ◈</span>
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
}
