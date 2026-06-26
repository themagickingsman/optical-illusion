'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SOLAR_BODIES, OctaveBody } from '../../logic/SolarSystemData';

function ws(wx: number, wy: number, cam: { x: number, y: number, scale?: number }, W: number, H: number) {
  return { x: wx - cam.x + W / 2, y: wy - cam.y + H / 2 };
}

function drawOrbitalLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rad: number,
  finalScale: number,
  color: string,
) {
  if (finalScale * rad < 0.2) return;
  
  ctx.save();
  ctx.beginPath();
  
  const circumference = Math.PI * 2 * rad;
  const dashCount = 140; // Reduced segments for extreme optimization
  const dashLen = circumference / dashCount;
  
  ctx.setLineDash([dashLen * 0.4, dashLen * 0.6]); 
  ctx.lineCap = "round";
  
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  
  ctx.globalAlpha = 0.6; // Stronger presence inside pure visual map
  
  ctx.lineWidth = Math.max(1.0, 1.5 / finalScale);
  ctx.stroke();
  ctx.restore();
}

interface CameraState {
  x: number;
  y: number;
  scale: number;
}

interface PlanetSystemProps {
  children?: React.ReactNode;
  cameraOverride?: CameraState;
  onCameraUpdate?: (cam: CameraState) => void;
}

const PARALLAX_STARS = 4000;
const PARALLAX_GRID = 0.5;
const USE_BAKED_SPRITE = true;
const PERFORMANT_SHADOWS = true;

const STARS: { x: number; y: number; r: number; a: number; parallax: number }[] = [];
for (let i = 0; i < PARALLAX_STARS; i++) {
  STARS.push({
    x: Math.random() * 20000 - 10000,
    y: Math.random() * 20000 - 10000,
    r: Math.random() * 1.5 + 0.1,
    a: Math.random() * 0.8 + 0.2,
    parallax: Math.random() * 0.4 + 0.05,
  });
}

export default function StandalonePlanetSystem({ children, cameraOverride, onCameraUpdate }: PlanetSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const frameRef = useRef(0);
  const internalCam = useRef<CameraState>({ x: 0, y: 0, scale: 0.1 }); // Default to solar system scale
  
  const targetPlanetRef = useRef<string | null>(null);
  const flightStateRef = useRef<'idle' | 'flying' | 'orbiting'>('idle');
  const orbitAngleRef = useRef(0);

  useEffect(() => {
     const focusHandler = (e: any) => {
        if (e.detail?.planetName) {
           targetPlanetRef.current = e.detail.planetName;
        } else {
           flightStateRef.current = 'idle';
           targetPlanetRef.current = null;
        }
     };
     const mapToggledHandler = (e: any) => {
        const showMap = e.detail;
        if (!showMap && targetPlanetRef.current) {
            flightStateRef.current = 'flying';
        }
     };
     window.addEventListener('arn_camera_focus_planet', focusHandler);
     window.addEventListener('arn_map_toggled', mapToggledHandler);
     return () => {
         window.removeEventListener('arn_camera_focus_planet', focusHandler);
         window.removeEventListener('arn_map_toggled', mapToggledHandler);
     };
  }, []);
  
  // Use override if provided
  const camToUse = cameraOverride || internalCam.current;

  // Track textures dynamically
  const spriteCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      SOLAR_BODIES.forEach((body) => {
        const bodyKey = body.name.replace(/\s+/g, '_');
        const img = new window.Image();
        // Load sprite
        img.src = `/game_assets/planets/${bodyKey}_Sprite.png?v=${Date.now()}`;
        img.onload = () => {
          spriteCacheRef.current[body.name] = img;
        };
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const onResize = () => {
      const W = containerRef.current?.clientWidth || window.innerWidth;
      const H = containerRef.current?.clientHeight || window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    onResize();
    window.addEventListener("resize", onResize);
    
    let raf = 0;
    
    // Render loop
    const render = () => {
      frameRef.current++;
      const W = canvas.width;
      const H = canvas.height;
      const cam = cameraOverride ?? internalCam.current;

      const targetName = targetPlanetRef.current;
      if (targetName && flightStateRef.current !== 'idle') {
          const body = SOLAR_BODIES.find(b => b.name === targetName);
          if (body) {
              const ox = 0, oy = 0;
              const bAngle = body.baseAngle + frameRef.current * body.orbSpeed;
              const bwx = ox + Math.cos(bAngle) * body.worldR;
              const bwy = oy + Math.sin(bAngle) * body.worldR;
              
              const targetScale = 0.85;

              if (flightStateRef.current === 'flying') {
                 internalCam.current.x += (bwx - internalCam.current.x) * 0.03;
                 internalCam.current.y += (bwy - internalCam.current.y) * 0.03;
                 internalCam.current.scale += (targetScale - internalCam.current.scale) * 0.03;
                 
                 const dist = Math.hypot(bwx - internalCam.current.x, bwy - internalCam.current.y);
                 if (dist < body.r * 2.5) {
                     flightStateRef.current = 'orbiting';
                     orbitAngleRef.current = Math.atan2(internalCam.current.y - bwy, internalCam.current.x - bwx);
                 }
              } else if (flightStateRef.current === 'orbiting') {
                 orbitAngleRef.current -= 0.005; // Clockwise gentle orbit
                 const orbitRadius = body.r * 2.5; 
                 internalCam.current.x = bwx + Math.cos(orbitAngleRef.current) * orbitRadius;
                 internalCam.current.y = bwy + Math.sin(orbitAngleRef.current) * orbitRadius;
                 internalCam.current.scale += (targetScale - internalCam.current.scale) * 0.05;
              }
          }
      }

      const finalScale = cam.scale;

      // 1. Draw Space Background (Black)
      ctx.fillStyle = "#020508";
      ctx.fillRect(0, 0, W, H);

      // 2. Parallax Stars
      ctx.save();
      for (const s of STARS) {
        const sx = (((s.x - cam.x * s.parallax) % W) + W) % W;
        const sy = (((s.y - cam.y * s.parallax) % H) + H) % H;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Transform space for World Elements
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(finalScale, finalScale);
      ctx.translate(-cam.x, -cam.y);
      
      const ox = 0, oy = 0; // Sun is 0,0

      // Draw Orbit Lines
      SOLAR_BODIES.forEach((body) => {
        if (body.name !== "SUN" && body.worldR > 0) {
            const grad = ctx.createLinearGradient(ox - body.worldR, oy, ox + body.worldR, oy);
            grad.addColorStop(0, `rgba(255, 255, 255, 0.03)`);
            grad.addColorStop(0.5, `rgba(255, 255, 255, 0.1)`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0.03)`);
            drawOrbitalLine(ctx, ox, oy, body.worldR, finalScale, grad as any);
        }
      });

      // Draw Planets
      SOLAR_BODIES.forEach((body) => {
        const bAngle = body.baseAngle + frameRef.current * body.orbSpeed;
        const bwx = ox + Math.cos(bAngle) * body.worldR;
        const bwy = oy + Math.sin(bAngle) * body.worldR;

        const isPlanet = body.name !== "SUN";
        const displayR = body.r;
        
        if (isPlanet) {
            const sunAngle = Math.atan2(oy - bwy, ox - bwx);
            ctx.save();
            ctx.translate(bwx, bwy);
            
            const distRatio = Math.max(0, Math.min(1, body.worldR / 8000));
            const shadowAlpha = (0.15 + 0.65 * distRatio) * 0.7; 

            if (PERFORMANT_SHADOWS) {
                ctx.save();
                ctx.rotate(sunAngle);
                const castLen = displayR * 7; 
                const grad = ctx.createLinearGradient(0, 0, -castLen, 0);
                grad.addColorStop(0, `rgba(2, 6, 23, ${shadowAlpha * 0.4})`); 
                grad.addColorStop(1, `rgba(2, 6, 23, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, -displayR * 0.98); 
                ctx.lineTo(-castLen, -displayR * 0.98); 
                ctx.lineTo(-castLen, displayR * 0.98);
                ctx.lineTo(0, displayR * 0.98);
                ctx.closePath();
                ctx.fill();
                ctx.restore(); 
            }

            const cachedSprite = spriteCacheRef.current?.[body.name];
            let spriteW = displayR * 2;
            let spriteH = displayR * 2;

            if (cachedSprite && cachedSprite.naturalWidth && cachedSprite.naturalHeight && USE_BAKED_SPRITE) {
                const aspect = cachedSprite.naturalWidth / cachedSprite.naturalHeight;
                if (aspect > 1) spriteH = spriteW / aspect;
                else if (aspect < 1) spriteW = spriteH * aspect;
                
                ctx.drawImage(cachedSprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);

                if (PERFORMANT_SHADOWS) {
                    ctx.save();
                    ctx.rotate(sunAngle);
                    ctx.fillStyle = `rgba(2, 6, 23, ${shadowAlpha.toFixed(2)})`;
                    const shadowR = displayR;
                    ctx.beginPath();
                    ctx.arc(0, 0, shadowR, Math.PI / 2, Math.PI * 1.5);
                    ctx.bezierCurveTo(-displayR * 0.4, -shadowR * 0.5, -displayR * 0.4, shadowR * 0.5, 0, shadowR);
                    ctx.fill();
                    ctx.restore();
                }

            } else if (cachedSprite && USE_BAKED_SPRITE) {
                ctx.drawImage(cachedSprite, -displayR, -displayR, displayR * 2, displayR * 2);
            } else {
                ctx.fillStyle = body.color || "#cccccc";
                ctx.beginPath();
                ctx.arc(0, 0, displayR, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore(); 
        } else {
            // Sun Render
            const pulse = 0.8 + 0.2 * Math.sin(frameRef.current * 0.05);
            ctx.fillStyle = body.color || "#ffaa00";
            ctx.beginPath();
            ctx.arc(bwx, bwy, displayR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 0.5 * pulse;
            ctx.beginPath();
            ctx.arc(bwx, bwy, displayR * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
      });
      
      ctx.restore(); // END Main Translation Context
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [cameraOverride]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          zIndex: 1, 
          background: '#020508' 
        }} 
      />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
         {children}
      </div>
    </div>
  );
}
