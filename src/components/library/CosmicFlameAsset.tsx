"use client";

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SplashCursor = dynamic(() => import('./SplashCursor').then(m => m.SplashCursor), { ssr: false });

export default function CosmicFlameAsset() {
  const splashEmitRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);

  const physicsRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // Facing UP initially
    thrusting: false,
    rotatingLeft: false,
    rotatingRight: false,
    firing: false,
    autoPilot: true,
    initialized: false
  });

  const missilesRef = useRef<{id: number, x: number, y: number, vx: number, vy: number, life: number}[]>([]);
  const missileCounterRef = useRef(0);
  const lastFireRef = useRef(0);

  // Default optimal config based on cosmic_racers ShipFxTab tuning
  const config = {
    splatRadius: 0.04,
    splatForce: 9450,
    densityDissipation: 3.5,
    velocityDissipation: 0.9,
    curl: 3,
    dyeResolution: 1440,
    simResolution: 128,
    pressure: 0.1,
    pressureIterations: 20,
    emissionForceMult: 1.0,
    invertForce: true,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = physicsRef.current;
      
      // If any relevant control key is pressed, disable autopilot permanently
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'Space'].includes(e.key) || e.code === 'Space') {
        p.autoPilot = false;
      }

      if (e.key === 'ArrowUp' || e.key === 'w') p.thrusting = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') p.rotatingLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') p.rotatingRight = true;
      if (e.code === 'Space') p.firing = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const p = physicsRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w') p.thrusting = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') p.rotatingLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') p.rotatingRight = false;
      if (e.code === 'Space') p.firing = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (containerRef.current && shipRef.current) {
         const rect = containerRef.current.getBoundingClientRect();
         const p = physicsRef.current;

         if (!p.initialized) {
            p.x = rect.width / 2;
            p.y = rect.height / 2;
            p.initialized = true;
         }

         // Physics constants
         const thrustPower = 1200 * dt;
         const turnSpeed = 4 * dt;
         const friction = 0.98;

         if (p.rotatingLeft) p.angle -= turnSpeed;
         if (p.rotatingRight) p.angle += turnSpeed;

         // Autopilot logic
         let currentThrusting = p.thrusting;
         if (p.autoPilot) {
            currentThrusting = true;
            // Gentle lazy turns based on time
            p.angle += Math.sin(time / 1000) * 0.015;
         }

         if (currentThrusting) {
            p.vx += Math.cos(p.angle) * thrustPower;
            p.vy += Math.sin(p.angle) * thrustPower;
         }

         p.vx *= friction;
         p.vy *= friction;

         p.x += p.vx * dt;
         p.y += p.vy * dt;

         // Screen wrap
         if (p.x < 0) p.x += rect.width;
         if (p.x > rect.width) p.x -= rect.width;
         if (p.y < 0) p.y += rect.height;
         if (p.y > rect.height) p.y -= rect.height;

         // Update ship transform directly for performance
         // The visual SVG is pointing UP, so we add Math.PI/2 to align visual rotation with physics angle
         shipRef.current.style.transform = `translate(-50%, -50%) rotate(${p.angle + Math.PI/2}rad)`;
         shipRef.current.style.left = `${p.x}px`;
         shipRef.current.style.top = `${p.y}px`;

         const tailOffset = 15;
         const tailX = p.x - Math.cos(p.angle) * tailOffset;
         const tailY = p.y - Math.sin(p.angle) * tailOffset;

         const globalTailX = rect.left + tailX;
         const globalTailY = rect.top + tailY;

         // Fire missiles
         if (p.firing && time - lastFireRef.current > 350) {
             lastFireRef.current = time;
             const noseOffset = 40;
             const noseX = p.x + Math.cos(p.angle) * noseOffset;
             const noseY = p.y + Math.sin(p.angle) * noseOffset;
             missileCounterRef.current++;
             missilesRef.current.push({
                id: missileCounterRef.current % 100,
                x: noseX,
                y: noseY,
                vx: Math.cos(p.angle) * 400,
                vy: Math.sin(p.angle) * 400,
                life: 5.0
             });
         }

         // Update missiles
         const m = missilesRef.current;
         for (let i = m.length - 1; i >= 0; i--) {
             m[i].x += m[i].vx * dt;
             m[i].y += m[i].vy * dt;
             m[i].life -= dt;
             if (m[i].life <= 0) m.splice(i, 1);
         }

         window.dispatchEvent(new CustomEvent('SYNC_NEXUS_CURSOR', {
            detail: {
               ships: [], // Removed the ship metaball per user request
               missiles: m.map(proj => ({ id: proj.id, x: rect.left + proj.x, y: rect.top + proj.y }))
            }
         }));

         const emitMult = config.emissionForceMult ?? 1.0;
         
         // Autopilot also uses currentThrusting logic for engine emission
         if (currentThrusting) {
             const emits: any[] = [];
             const inv = config.invertForce ?? true;
             
             // The force pushes the fluid trailing behind
             const forceX = -Math.cos(p.angle) * 0.02 * emitMult * (inv ? -1 : 1);
             const forceY =  Math.sin(p.angle) * 0.02 * emitMult * (inv ? -1 : 1);

             // Use a solid color for the engine flame
             const engineRgb = { r: 1.0, g: 0.0, b: 0.333 }; // #ff0055
             
             emits.push({
                id: "sandbox_ship",
                x: tailX,
                y: tailY,
                dx: forceX,
                dy: forceY,
                color: engineRgb
             });
             
             splashEmitRef.current = emits;
         } else {
             splashEmitRef.current = [];
         }
      }

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.dispatchEvent(new CustomEvent('SYNC_NEXUS_CURSOR', { detail: { ships: [] } }));
    };
  }, []);

  return (
    <>
    <style>{`
    `}</style>
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", display: "flex", background: 'transparent' }}>
      <div 
        ref={containerRef} 
        style={{ 
          flex: 1, 
          position: "relative", 
          pointerEvents: "auto", 
          overflow: 'hidden', 
          background: 'transparent' 
        }}
      >
          
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
             <SplashCursor 
                externalEmitsRef={splashEmitRef}
                cameraDeltaRef={{ current: { x: 0, y: 0 } }}
                SPLAT_RADIUS={config.splatRadius}
                SPLAT_FORCE={config.splatForce}
                DENSITY_DISSIPATION={config.densityDissipation}
                VELOCITY_DISSIPATION={config.velocityDissipation}
                CURL={config.curl}
                DYE_RESOLUTION={config.dyeResolution}
                SIM_RESOLUTION={config.simResolution}
                PRESSURE={config.pressure}
                PRESSURE_ITERATIONS={config.pressureIterations}
             />
          </div>

          <div 
            ref={shipRef}
            style={{
              position: "absolute",
              top: "-1000px", // offscreen until initialized
              left: "-1000px",
              zIndex: 50,
              pointerEvents: "none",
              width: 100,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              willChange: "transform, left, top"
            }}
          >
            <img 
              src="/ships/skittles.webp" 
              alt="Skittles Ship" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                position: 'relative', 
                zIndex: 10
              }} 
            />
          </div>
        </div>
    </div>
    </>
  );
}
