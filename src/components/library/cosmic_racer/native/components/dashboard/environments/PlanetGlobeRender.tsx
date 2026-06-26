import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { OrbitControls, useTexture, Stars, Stats, Html } from '@react-three/drei';
import * as THREE from 'three';
import { generateHexasphere, buildHexGridGeometry, generateLabelAtlasAndGeometry, HexTile } from './hexasphere/hexasphereMath';

function UniverseBackground() {
    return (
        <group>
            {/* 
                BACKGROUND DEACTIVATED: The WebGL background is completely transparent,
                exposing the raw native CSS Game Gradient placed perfectly underneath the canvas!
            */}
            <Stars radius={300} depth={50} count={1200} factor={3} saturation={1} fade speed={0.5} />
        </group>
    );
}

export default function PlanetGlobeRender({ 
  triggerZoomOut, 
  onZoomedIn, 
  onZoomOutComplete 
}: { 
  triggerZoomOut: boolean; 
  onZoomedIn: () => void; 
  onZoomOutComplete: () => void; 
}) {
  const globeRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);

  // Math Setup: Generate the massive 3D Hexasphere Grid globally once!
  // Detail levels determine the recursive geometry payload:
  // 4 = 2562 hexes (heavy) | 3 = 642 hexes (medium) | 2 = 162 hexes (super chunky & ultra-fast)
  const detailLevel = 2; 

  const { tiles, fillGeo, wireGeo, labelGeo, labelTexture } = useMemo(() => {
     // Radius 10 matching the exact crust size of the previous planet.
     const generatedTiles = generateHexasphere(10.0, detailLevel); 
     const geos = buildHexGridGeometry(generatedTiles);
     const labels = generateLabelAtlasAndGeometry(generatedTiles);
     
     return { 
         tiles: generatedTiles, 
         fillGeo: geos.fillGeo, 
         wireGeo: geos.wireGeo,
         labelGeo: labels.labelGeo,
         labelTexture: labels.labelTexture
     };
  }, [detailLevel]);

  const [hoveredTile, setHoveredTile] = useState<HexTile | null>(null);
  const [targetParams, setTargetParams] = useState<{ pos: THREE.Vector3, up: THREE.Vector3 } | null>(null);
  const [activeFactionTab, setActiveFactionTab] = useState<-1 | 0 | 1 | 2 | 'ALL'>('ALL');

  // The 12 canonical ALLIANCES planets in GDD order.
  // The first 12 faction-sorted hexes are named planets; the rest are AXIS addresses.
  const PLANET_NAMES = [
    'Nexus Prime',   // Mega — HQ
    'Venus',         // Large — story anchor
    'Forge World',   // Large — industrial
    'Outpost Gamma', // Medium — transit hub
    'Meridian',      // Medium — trade
    'Bastion',       // Medium — military
    'The Drift',     // Small — contested
    'Ember',         // Small — mining
    'Coldreach',     // Small — sensors
    'The Scar',      // Tiny — high risk
    'Waypoint 7',    // Tiny — resupply
    'Void Anchor',   // Tiny — end-game unlock
  ];

  // Hard slice 80 hexes and structure globally so each planet is permanently locked to one hex.
  const baseServers = useMemo(() => {
      const allHexes = tiles.filter(t => t.polygon.length === 6).slice(0, 80);
      
      // Group by Faction natively (0, 1, 2, and then Neutral = -1 last)
      const sorted = [...allHexes].sort((a,b) => {
          const fA = a.factionId === -1 || a.factionId === undefined ? 99 : a.factionId;
          const fB = b.factionId === -1 || b.factionId === undefined ? 99 : b.factionId;
          return fA - fB;
      });
      
      // First 12 get real planet names; rest show their AXIS hex address
      return sorted.map((tile, index) => ({ 
          tile, 
          serverName: index < PLANET_NAMES.length
            ? PLANET_NAMES[index]
            : `AXIS:${String(tile.id).substring(0, 4)}`
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  const filteredServers = useMemo(() => {
      if (activeFactionTab === 'ALL') return baseServers;
      return baseServers.filter(s => s.tile.factionId === activeFactionTab);
  }, [baseServers, activeFactionTab]);

  // Cinematic memory states
  const [orbitReturnParams, setOrbitReturnParams] = useState<{ pos: THREE.Vector3, up: THREE.Vector3 } | null>(null);
  
  // Cinematic states
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const zoomProgress = useRef(0);

  // Shader Uniform Reference targeting exactly the hovered hexagon
  const uniformsRef = useRef({
      hoverCenter: { value: new THREE.Vector3(0,0,0) }
  });

  useEffect(() => {
     if (triggerZoomOut && isZoomedIn) {
         setIsZoomedIn(false);
         setIsZoomingOut(true);
     }
  }, [triggerZoomOut, isZoomedIn]);

  useEffect(() => {
     if (hoveredTile && !isZoomingOut && !targetParams && !isZoomedIn) {
         uniformsRef.current.hoverCenter.value.copy(hoveredTile.center);
     } else {
         uniformsRef.current.hoverCenter.value.set(0,0,0);
     }
  }, [hoveredTile, isZoomingOut, targetParams, isZoomedIn]);

  // Explicit tracking for pointer drag so we don't zoom-in while just trying to spin the globe
  const pointerDownCoords = useRef<{ x: number, y: number } | null>(null);
  
  // Explicitly separate the physical click bounds from the tracking state so that
  // spinning the globe doesn't accidentally trigger a hex drop sequence.
  const clickOriginCoords = useRef<{ x: number, y: number } | null>(null);

  // Explicit tracking for physical momentum! 
  const rotationalVelocity = useRef({ x: 0, y: 0 });

  // Native FPS Counter Repositioning
  // The user reported the FPS tracker was completely clipped by the standard Next/React DOM layout!
  // This explicitly grabs the canvas wrapper node and absolutely centers it squarely in the bottom middle. 
  useEffect(() => {
     const interval = setInterval(() => {
         const statsDiv = document.body.querySelector('div[style*="z-index: 10000"]') as HTMLElement;
         if (statsDiv) {
             statsDiv.style.left = '50%';
             statsDiv.style.top = 'auto';
             statsDiv.style.bottom = '20px';
             statsDiv.style.transform = 'translateX(-50%)'; // Perfectly center internally
             clearInterval(interval);
         }
     }, 100);
     return () => clearInterval(interval);
  }, []);

  const handlePointerMove = (e: any) => {
     if (isZoomingOut || targetParams) return;
     
     if (pointerDownCoords.current && globeRef.current) {
         // TACTILE TURNTABLE ENGINE: Capture physical velocity!
         const dx = e.clientX - pointerDownCoords.current.x;
         const dy = e.clientY - pointerDownCoords.current.y;
         
         // Standard 'Carousel / Swipe' tracking polarity
         const turnSpeed = 0.006; 
         
         // Store velocity for when the user lets go (flick momentum)
         rotationalVelocity.current.y = dx * turnSpeed;
         rotationalVelocity.current.x = dy * turnSpeed;
         
         // Apply it instantly for instant responsive tactile feedback
         globeRef.current.rotation.y += rotationalVelocity.current.y;
         globeRef.current.rotation.x += rotationalVelocity.current.x;
         
         // Hard-clamp vertical tilt to 45 degrees so they never lose track of North.
         const maxTilt = Math.PI / 4;
         globeRef.current.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, globeRef.current.rotation.x));
         
         pointerDownCoords.current = { x: e.clientX, y: e.clientY };
         return; // Skip raycasting while actively dragging
     }
     
     if (e.face && fillGeo.attributes.tileId) {
         // O(1) Absolute Hardware Precision: Read the exact tile ID embedded directly into the hovered triangle's vertices!
         const vertexIdx = e.face.a;
         const exactTileId = fillGeo.attributes.tileId.getX(vertexIdx);
         
         const bestTile = tiles[exactTileId];
         if (bestTile && (!hoveredTile || hoveredTile.id !== bestTile.id)) {
             setHoveredTile(bestTile);
             document.body.style.cursor='pointer';
         }
     }
  };

  const handlePointerOut = () => {
     if (!isZoomingOut && !targetParams && !isZoomedIn) {
        setHoveredTile(null);
        document.body.style.cursor='auto';
     }
  };

  const handlePointerDown = (e: any) => {
     pointerDownCoords.current = { x: e.clientX, y: e.clientY };
     clickOriginCoords.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
     if (!clickOriginCoords.current) return;
     const dx = e.clientX - clickOriginCoords.current.x;
     const dy = e.clientY - clickOriginCoords.current.y;
     const dragDistanceSquared = dx * dx + dy * dy;
     
     // Only trigger a dive click if the mouse shifted less than 5px total since touchdown.
     // This guarantees smooth spinning without accidental rapid target drops!
     if (dragDistanceSquared < 25) {
         handleClick(e);
     }
     pointerDownCoords.current = null;
     clickOriginCoords.current = null;
  };

  const executeDive = (targetTile: HexTile) => {
     if (isZoomingOut || targetParams || isZoomedIn) return;
     if (controlsRef.current && globeRef.current) {
         document.body.style.cursor='auto';
         
         const startPos = controlsRef.current.object.position.clone();
         const startUp = controlsRef.current.object.up.clone();
         setOrbitReturnParams({ pos: startPos, up: startUp });
         
         const localPos = targetTile.center.clone();
         const worldPos = localPos.applyMatrix4(globeRef.current.matrixWorld);

         // To ensure the hexagon perfectly aligns Pointy-Topped (0 optical tilt) on the screen:
         const hexTopVertex = targetTile.polygon[0].clone();
         const localUp = hexTopVertex.sub(targetTile.center).normalize();
         
         // Transform direction purely handles rotation matrices (immune to planet positioning translations)
         const worldUp = localUp.transformDirection(globeRef.current.matrixWorld);
         
         // Fix: Move the camera out to radius 10.7 instead of crashing into the crust at exactly 10.0!
         const divePos = worldPos.clone().normalize().multiplyScalar(10.7);
         
         setTargetParams({ pos: divePos, up: worldUp });
     }
  };

  const handleClick = (e: any) => {
      if (hoveredTile) executeDive(hoveredTile);
  };

  useFrame((state, delta) => {
      // 1. INERTIA PHYSICS ENGINE: Apply momentum decay when the user lets go!
      if (globeRef.current && !pointerDownCoords.current && !targetParams && !isZoomingOut && !isZoomedIn) {
          // Apply residual velocity
          globeRef.current.rotation.y += rotationalVelocity.current.y;
          globeRef.current.rotation.x += rotationalVelocity.current.x;
          
          // Heavy Friction (Decay velocity by 6% every frame)
          rotationalVelocity.current.y *= 0.94;
          rotationalVelocity.current.x *= 0.94;
          
          // Extremely slow constant ambient auto-rotation when perfectly idle
          if (Math.abs(rotationalVelocity.current.y) < 0.0001) {
              globeRef.current.rotation.y += delta * 0.02; 
          }
          
          // Hard-clamp vertical tilt during momentum sliding to prevent rolling over!
          const maxTilt = Math.PI / 4;
          globeRef.current.rotation.x = Math.max(-maxTilt, Math.min(maxTilt, globeRef.current.rotation.x));
      }

      const camera = state.camera;
      
      if ((isZoomingOut || (targetParams && !isZoomedIn)) && orbitReturnParams && targetParams) {
          
          // Identify if we were already sitting at the boundary from the previous frame
          const wasMax = zoomProgress.current >= 1.0;
          const wasMin = zoomProgress.current <= 0.0;
          
          if (isZoomingOut) {
              zoomProgress.current -= delta * 0.8; // Takes exactly 1.25s to retreat
          } else {
              zoomProgress.current += delta * 0.6; // Takes exactly 1.66s to dive
          }

          
          // Hard clamp the actual ref value physically so it doesn't drift endlessly!
          zoomProgress.current = Math.max(0, Math.min(1.0, zoomProgress.current));
          const t = zoomProgress.current;

          // Cubic Ease-In-Out scalar
          const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const startDir = orbitReturnParams.pos.clone().normalize();
          const targetDir = targetParams.pos.clone().normalize();
          
          // Spherical Interpolation organically traces the orbital curvature natively
          const currentDir = startDir.clone().lerp(targetDir, easeT).normalize();
          
          // Distance Arc (Cinematic swooping path)
          const startDist = orbitReturnParams.pos.length();
          let currentDist;
          if (t < 0.3) {
             // 0% to 30%: Camera pulls back into high orbit to survey
             const u = t / 0.3; // 0 to 1
             const pullBackEase = u * u; // quadratic ease out
             currentDist = THREE.MathUtils.lerp(startDist, 25.0, pullBackEase);
          } else {
             // 30% to 100%: Aggressive dive bombing approach into the atmosphere
             const u = (t - 0.3) / 0.7; // 0 to 1
             const diveEase = 1 - Math.pow(1 - u, 3); // cubic ease out (decelerates dramatically at the crust)
             currentDist = THREE.MathUtils.lerp(25.0, 10.7, diveEase); 
          }
          
          // Interpolate Optical Roll Vector unconditionally
          const currentUp = orbitReturnParams.up.clone().lerp(targetParams.up, easeT).normalize();
          
          // Absolute Mathematical Execution (Zero snapping drift!)
          camera.position.copy(currentDir.multiplyScalar(currentDist));
          camera.up.copy(currentUp);
          camera.lookAt(0,0,0);
          
          // State Machine Termination checks based strictly on hard bounded bounds limiters
          if (!isZoomingOut && t >= 1.0) {
              // Only fire the load callback once when breaching the threshold for the very first time
              if (!wasMax) {
                  setIsZoomedIn(true);
                  onZoomedIn();
              }
          } else if (isZoomingOut && t <= 0.0) {
              if (!wasMin) {
                  setIsZoomingOut(false);
                  setTargetParams(null);
                  setOrbitReturnParams(null);
                  onZoomOutComplete();
              }
          }
          
      } 
      else if (controlsRef.current && !targetParams && !isZoomedIn && !isZoomingOut) {
          controlsRef.current.update();
      }
  });

  return (
    <>
      <Suspense fallback={null}>
         <UniverseBackground />
      </Suspense>
    
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />
      {/* Rim light for a bit of cinematic pop on the solid mesh */}
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#00e5ff" />
      
      {/* 120 FPS: Post-Processing Bloom has been entirely eradicated to unlock raw bare-metal hardware speed */}
      <group ref={globeRef}>
         
         {/* Main Solid Hexasphere Faction Tiles */}
         <mesh 
           geometry={fillGeo}
           onPointerOver={() => { document.body.style.cursor='pointer'; }}
           onPointerOut={handlePointerOut}
           onPointerMove={handlePointerMove}
           onPointerDown={handlePointerDown}
           onPointerUp={handlePointerUp}
         >
           <meshStandardMaterial 
              vertexColors={true} 
              roughness={0.8} 
              metalness={0.2} 
              side={THREE.FrontSide} // Explicitly block rendering the inner shell
              depthWrite={true}
              onBeforeCompile={(shader) => {
                  shader.uniforms.hoverCenter = uniformsRef.current.hoverCenter;
                  
                  // Inject tileCenter attribute read
                  shader.vertexShader = `
                     attribute vec3 tileCenter;
                     varying vec3 vTileCenter;
                  ` + shader.vertexShader.replace(
                     `#include <common>`,
                     `#include <common>
                     varying vec3 vTileCenter_inner;` // Standard replacement isolation
                  ).replace(
                     `void main() {`,
                     `void main() {
                         vTileCenter = tileCenter;`
                  );
                  
                  // Read the varying and light up if we are inside the hovered tile!
                  shader.fragmentShader = `
                     uniform vec3 hoverCenter;
                     varying vec3 vTileCenter;
                  ` + shader.fragmentShader.replace(
                     `#include <color_fragment>`,
                     `#include <color_fragment>
                      // High-performance hovering glow strictly isolated to exactly one polygon!
                      float distMatch = distance(vTileCenter, hoverCenter);
                      if (distMatch < 0.1) {
                          diffuseColor.rgb += vec3(0.0, 0.8, 1.0); // Vivid Cyan Glow!
                      }
                     `
                  );
              }}
           />
         </mesh>

         {/* Extruded Tile Decals (Arrows + IDs) visually scaled above the crust to completely destroy completely Z-fighting jitter! */}
         <mesh geometry={labelGeo} scale={1.01} raycast={() => null}>
             <meshBasicMaterial 
                 map={labelTexture} 
                 transparent 
                 opacity={0.9} 
                 depthWrite={false} 
                 depthTest={true} 
                 side={THREE.FrontSide} // Explicitly blocks any labels from rendering backwards ("inside out") through the crust!
             />
         </mesh>

         {/* Wireframe Hex Grid Skeleton overlaid tightly on the outside */}
         <lineSegments geometry={wireGeo} scale={1.002} raycast={() => null}>
             {/* 120 FPS NATIVE LIGHTING: Intense opaque cyan natively eliminates the need for expensive post-processed Bloom passes! */}
             <lineBasicMaterial color="#00ffff" depthWrite={false} transparent opacity={0.8} />
         </lineSegments>
         
      </group>

      {/* 80-SERVER TACTICAL SIDEBAR MENU (DOM Layer synced seamlessly with WebGL Coordinate Math) */}
      <Html fullscreen zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
         <div style={{ pointerEvents: 'auto', position: 'absolute', left: 20, top: '10%', bottom: '10%', width: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* 4 FACTION TABS */}
            <div style={{ display: 'flex', gap: '5px' }}>
               {[
                 { id: 0, label: 'Alliance Zero', color: '#0088ff' },
                 { id: 1, label: 'Forge Syndicate', color: '#f59e0b' },
                 { id: 2, label: 'Meridian', color: '#34d399' },
                 { id: -1, label: 'Neutral', color: '#aaaaaa' },
               ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveFactionTab(activeFactionTab === tab.id ? 'ALL' : tab.id as any)}
                    style={{
                       flex: 1,
                       padding: '10px 0',
                       background: activeFactionTab === tab.id || activeFactionTab === 'ALL' ? tab.color : 'rgba(0,0,0,0.6)',
                       border: `1px solid ${tab.color}`,
                       color: activeFactionTab === tab.id || activeFactionTab === 'ALL' ? '#000' : '#fff',
                       fontSize: '11px',
                       fontFamily: 'Orbitron, sans-serif',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       borderRadius: '4px',
                       transition: 'all 0.2s',
                       opacity: activeFactionTab === 'ALL' ? 0.7 : (activeFactionTab === tab.id ? 1.0 : 0.4)
                    }}
                 >
                    {tab.label}
                 </button>
               ))}
            </div>

            {/* SCROLLING SERVER LIST */}
            <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {filteredServers.map(({ tile, serverName }) => (
                   <div 
                     key={tile.id}
                     onClick={() => executeDive(tile)}
                     onMouseEnter={() => setHoveredTile(tile)} // Two-way binding highlights WebGL hex!
                     onMouseLeave={() => setHoveredTile(null)}
                     style={{
                        background: hoveredTile?.id === tile.id ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.6)',
                        border: hoveredTile?.id === tile.id ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.2)',
                        color: '#fff',
                        padding: '12px 15px',
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(4px)'
                     }}
                   >
                      <span>{serverName}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>AXIS: {String(tile.id).substring(0,4)}</span>
                   </div>
                ))}
            </div>
         </div>
      </Html>

      {/* TACTICAL HUD: Hexagon Geometry Payload Indicator */}
      <Html 
          center 
          style={{ 
             position: 'absolute', 
             top: '40vh', /* Center places anchor at 0,0, top pushes it down */
             color: '#fff', 
             fontFamily: 'Orbitron, sans-serif',
             fontWeight: '900',
             fontSize: '32px',
             textShadow: '0 0 15px rgba(0, 229, 255, 0.8), 0 0 30px rgba(0, 229, 255, 0.5)',
             pointerEvents: 'none',
             letterSpacing: '5px'
          }}
      >
          {tiles.filter(t => t.polygon.length === 6).length}
      </Html>

      <Stats />

      <OrbitControls 
         ref={controlsRef}
         enablePan={false}
         minDistance={10} 
         maxDistance={60}
         enableDamping={true}
         dampingFactor={0.05}
         /* TACTILE ENGINE ACTIVE: Camera rotation and native zoom are physically severed.
            The user now exclusively spins the 3D globe object itself on a native turntable,
            massively boosting orientation stability while locking the Z-depth natively! */
         enabled={!targetParams && !isZoomedIn && !isZoomingOut}
         enableZoom={false}
         enableRotate={false}
         autoRotate={false} 
      />
    </>
  );
}
