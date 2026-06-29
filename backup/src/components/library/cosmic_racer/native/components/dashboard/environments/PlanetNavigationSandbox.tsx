import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import PlanetGlobeRender from './PlanetGlobeRender';
import PlanetSurfaceEngine from './PlanetSurfaceEngine';

// Simulated top-level state controller
export default function PlanetNavigationSandbox({ onBack }: { onBack?: () => void }) {
  const [viewLevel, setViewLevel] = useState<'ORBIT' | 'GLOBE' | 'LAND'>('GLOBE');
  
  // Explicitly manage 3D Camera zoom states here at the React DOM level
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [triggerZoomOut, setTriggerZoomOut] = useState(false);
  const [cloudDensity, setCloudDensity] = useState(0);

  const triggerCloudSweep = (targetLevel: 'LAND' | 'GLOBE', callback?: () => void) => {
     // 1. Blast purely optical CSS clouds over the DOM to 100% opacity
     setCloudDensity(1);
     
     // 2. Wait exactly 700ms for the optical flashbang to reach peak density
     setTimeout(() => {
         // 3. Perform the violent heavy-duty WebGL Canvas swaps entirely hidden from the user
         setViewLevel(targetLevel);
         if (callback) callback();
         
         // 4. Wait a fraction of a second for React to render the massive new geometries, then dramatically pull the clouds away!
         setTimeout(() => {
             setCloudDensity(0);
         }, 200);
     }, 700);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(to bottom right, #050511, #1a1a40, #0d0d2b)" }}
    >
      {/* Explicit Absolute React DOM Zoom-Out Button (Immune to ThreeJS coordinate transforms) */}
      {(viewLevel === 'GLOBE' && isZoomedIn) || viewLevel === 'LAND' ? (
         <button 
           onClick={() => {
              if (viewLevel === 'LAND') {
                  // Reverse sequence: Cloud over the grid, swap down to Globe, then trigger the backward dive sequence
                  triggerCloudSweep('GLOBE', () => {
                      setTriggerZoomOut(true);
                  });
              } else {
                  setTriggerZoomOut(true);
              }
           }}
           style={{
             position: "absolute", 
             top: 20, 
             right: 30, 
             zIndex: 9999999, // Safely above Canvas
             background: "rgba(244, 63, 94, 0.9)", // Vibrant Rose 500
             color: "white", 
             border: "2px solid #fff", 
             width: "60px",
             height: "60px",
             fontSize: "30px",
             fontWeight: "bold",
             borderRadius: "50%",
             cursor: "pointer",
             boxShadow: "0 0 20px rgba(244, 63, 94, 0.6)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             transition: "all 0.2s ease-in-out"
           }}
           onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = "rgba(244, 63, 94, 1.0)"; }}
           onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; e.currentTarget.style.background = "rgba(244, 63, 94, 0.9)"; }}
         >
            ✕
         </button>
      ) : null}

      {/* ATMOSPHERIC CLOUD LOAD SCREEN (Flashbang Transition) */}
      <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,240,255,0.95) 40%, rgba(100,200,255,0.9) 100%)',
          opacity: cloudDensity,
          pointerEvents: 'none',
          transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)', // Snappy ease-in-out curve
          zIndex: 8888888, // Below the "X" button, but above ALL Canvases
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
      }}>
          <h1 style={{ 
              color: '#fff', fontSize: '5rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, 
              textShadow: '0 0 50px rgba(0, 229, 255, 1), 0 0 100px rgba(0, 229, 255, 0.8)',
              opacity: cloudDensity > 0.5 ? 1 : 0, transition: 'opacity 0.2s'
          }}>
              SYNCHRONIZING
          </h1>
      </div>

      {/* LEVEL 1: Empty Orbit (Vanguard Sandbox) */}
      <div style={{
          position: 'absolute', inset: 0,
          opacity: viewLevel === 'ORBIT' ? 1 : 0,
          pointerEvents: viewLevel === 'ORBIT' ? 'auto' : 'none',
          transition: 'opacity 1s ease-in-out'
      }}>
         <div className="flex w-full h-full items-center justify-center text-4xl text-cyan-500 font-bold uppercase tracking-widest cursor-pointer" onClick={() => setViewLevel('GLOBE')}>
            <span>Standard Orbit (Click to Enter Atmosphere)</span>
         </div>
      </div>

      {/* LEVEL 2: 3D Interlocking Planet Array */}
      <div style={{
          position: 'absolute', inset: 0,
          opacity: viewLevel === 'GLOBE' ? 1 : 0,
          pointerEvents: viewLevel === 'GLOBE' ? 'auto' : 'none',
          // We absolutely do not unmount this canvas! We must leave it running natively in the background so it rigidly remembers `isZoomedIn=true`!
          transition: 'opacity 0.1s linear'
      }}>
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 28], fov: 45 }}>
             <PlanetGlobeRender 
                triggerZoomOut={triggerZoomOut}
                onZoomedIn={() => {
                    setIsZoomedIn(true);
                    triggerCloudSweep('LAND');
                }}
                onZoomOutComplete={() => {
                   setIsZoomedIn(false);
                   setTriggerZoomOut(false);
                }}
             />
          </Canvas>
      </div>

      {/* LEVEL 3: Base-Building Land Matrix Engine */}
      <div style={{
          position: 'absolute', inset: 0,
          opacity: viewLevel === 'LAND' ? 1 : 0,
          pointerEvents: viewLevel === 'LAND' ? 'auto' : 'none',
          transition: 'opacity 0.1s linear'
      }}>
          {viewLevel === 'LAND' && (
             <PlanetSurfaceEngine />
          )}
      </div>
    </div>
  );
}
