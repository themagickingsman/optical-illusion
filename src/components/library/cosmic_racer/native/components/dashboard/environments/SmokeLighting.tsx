"use client";

import React, { useEffect, useRef } from "react";
import { SmokeLightingConfig } from "../../../../../state/stores/EnvironmentStore";

interface Bolt {
  canvas: HTMLCanvasElement;
  duration: number;
  spawnCamX: number;
  spawnCamY: number;
}

export default function SmokeLighting({ config }: { config: SmokeLightingConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    const scale = 1.0;

    let lastFrame = Date.now();
    const boltFlashDuration = 0.25;
    const boltFadeDuration = 0.5;
    const totalBoltDuration = boltFlashDuration + boltFadeDuration;

    interface Glow {
      x: number;
      y: number;
      opacity: number;
      spawnCamX: number;
      spawnCamY: number;
    }
    const activeGlows: Glow[] = [];

    const bolts: Bolt[] = [];
    const activeIntervals: NodeJS.Timeout[] = [];

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      for (const bolt of bolts) {
        bolt.canvas.width = width;
        bolt.canvas.height = height;
      }
    };

    let activeBranchesCount = 0;

    const recursiveLaunchBolt = (x: number, y: number, length: number, direction: number, boltContext: CanvasRenderingContext2D, branchProb: number, depth: number = 0, originY: number = y) => {
      if (activeBranchesCount > 150) return; // Strict global cap to prevent fork bombs
      activeBranchesCount++;
      
      const originalDirection = direction;
      
      const boltInterval = setInterval(() => {
        if (length <= 0) {
          activeBranchesCount--;
          clearInterval(boltInterval);
          const index = activeIntervals.indexOf(boltInterval);
          if (index > -1) activeIntervals.splice(index, 1);
          return;
        }
        
        let i = 0;
        while (i++ < Math.floor(45 / scale) && length > 0) {
          const x1 = Math.floor(x);
          const y1 = Math.floor(y);
          x += Math.cos(direction);
          y -= Math.sin(direction);
          length--;
          
          if (x1 !== Math.floor(x) || y1 !== Math.floor(y)) {
            // Distance traveled from the very top of the bolt
            const distFromOrigin = Math.max(0, y1 - originY);
            // Smoothly fade in over the first 100 pixels to hide the start point
            const fadeInAlpha = Math.min(1.0, distFromOrigin / 100.0);
            // Existing fade out at the very tip of the bolt
            const tipAlpha = Math.min(1.0, length / 350.0);
            
            const finalAlpha = fadeInAlpha * tipAlpha;
            
            boltContext.fillStyle = `hsla(${configRef.current.hue}, 80%, 75%, ${finalAlpha})`;
            boltContext.fillRect(x1, y1, 2.0, 2.0); // Slightly thicker for better visibility
            
            direction = originalDirection + (-Math.PI / 8.0 + Math.random() * (Math.PI / 4.0));
            
            if (Math.random() > branchProb && depth < 4) {
              recursiveLaunchBolt(x1, y1, length * (0.3 + Math.random() * 0.4), originalDirection + (-Math.PI / 6.0 + Math.random() * (Math.PI / 3.0)), boltContext, branchProb, depth + 1, originY);
            } else if (Math.random() > 0.95) {
              recursiveLaunchBolt(x1, y1, length, originalDirection + (-Math.PI / 6.0 + Math.random() * (Math.PI / 3.0)), boltContext, branchProb, depth, originY);
              length = 0;
            }
          }
        }
      }, 10);
      
      activeIntervals.push(boltInterval);
    };

    const launchBolt = (x: number, y: number, length: number, direction: number, branchProb: number) => {
      // If the engine is already drawing a massive bolt and nearing the branch cap, 
      // abort immediately. This prevents pushing a glow gradient when the bolt will fail to draw.
      if (activeBranchesCount > 100) return;

      activeGlows.push({
        x: x,
        y: y,
        opacity: (0.4 + Math.random() * 0.4) * (configRef.current.intensity / 2.0)
      });
      
      const boltCanvas = document.createElement("canvas");
      boltCanvas.width = width;
      boltCanvas.height = height;
      const boltContext = boltCanvas.getContext("2d");
      if (!boltContext) return;
      boltContext.scale(scale, scale);
      
      bolts.push({ canvas: boltCanvas, duration: 0.0 });
      recursiveLaunchBolt(x, y, length, direction, boltContext, branchProb, 0, y);
    };

    let animationFrameId: number;

    const tick = () => {
      const frame = Date.now();
      const elapsed = (frame - lastFrame) / 1000.0;
      lastFrame = frame;
      
      // If disabled, clear the canvas and wait — don't do any rendering work
      if (!configRef.current.enabled) {
        context.clearRect(0, 0, width, height);
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      
      context.clearRect(0, 0, width, height);
      
      // Control spawn frequency with config.speed
      // Baseline 0.98 means 2% chance per frame. At 60fps, that's ~1.2 bolts/sec.
      // We map config.speed (0.1 to 10.0)
      const spawnThreshold = 1.0 - (0.01 * configRef.current.speed);
      
      if (Math.random() > spawnThreshold) {
        const x = Math.floor(-10.0 + Math.random() * (width + 20.0));
        // Spawn from the vertical middle downward to simulate a distant horizon!
        const y = Math.floor((height / 2.0) + Math.random() * (height / 4.0));
        let lengthMultiplier = configRef.current.lightningLength !== undefined ? configRef.current.lightningLength : 1.5;
        let branchProb = configRef.current.lightningBranches !== undefined ? configRef.current.lightningBranches : 0.98;
        
        if (configRef.current.randomizeLightning) {
          lengthMultiplier = 1.0 + Math.random(); // Random between 1.0 and 2.0
          // Convert current density back to raw range (0.5 to 0.99) and randomize
          // Density is inverted mathematically, so 0.5 is high density, 0.99 is low density.
          // We'll just pick a random density between 0.5 and 0.99
          branchProb = 0.5 + Math.random() * 0.49;
        }
        
        const length = Math.floor((height / 2.0 + Math.random() * (height / 2.0)) * lengthMultiplier);
        
        launchBolt(x, y, length, Math.PI * 3.0 / 2.0, branchProb); // PI*1.5 is straight UP in math, but canvas Y is inverted, wait...

        // In canvas, y increases downward. Math.sin(1.5*PI) = -1. 
        // Original code: y -= Math.sin(direction). 
        // So y -= -1 => y += 1 (moves downward). Perfect.
      }
      // 1. Draw lightning bolts first
      for (let i = 0; i < bolts.length; i++) {
        const bolt = bolts[i];
        bolt.duration += elapsed;
        
        if (bolt.duration >= totalBoltDuration) {
          bolts.splice(i, 1);
          i--;
          continue;
        }
        
        context.globalAlpha = Math.max(0.0, Math.min(1.0, (totalBoltDuration - bolt.duration) / boltFadeDuration));
        context.globalCompositeOperation = "screen";
        context.drawImage(bolt.canvas, 0, 0);
        context.globalCompositeOperation = "source-over"; // reset
      }

      // 2. Draw atmospheric glows ON TOP of bolts
      const safeGlow = configRef.current.glow !== undefined ? configRef.current.glow : 1.0;
      const glowRadius = Math.max(100, width * 0.4 * safeGlow); // Slightly smaller base radius for punchier core

      context.globalCompositeOperation = "screen";
      for (let i = 0; i < activeGlows.length; i++) {
        const glow = activeGlows[i];
        if (glow.opacity > 0.0) {
          if (isFinite(glowRadius) && isFinite(glow.x) && isFinite(glow.y)) {
            // Unified Single Glow Layer
            // Fades perfectly smoothly as one object to prevent staggered "blinking"
            const userOpacity = configRef.current.opacity ?? 0.8;
            const safeOpacity = Math.min(1.0, glow.opacity) * userOpacity;
            
            const gradient = context.createRadialGradient(
              glow.x, glow.y, 0,
              glow.x, glow.y, glowRadius
            );
            
            gradient.addColorStop(0, `rgba(255, 255, 255, ${safeOpacity})`); // Intense white core
            gradient.addColorStop(0.15, `hsla(${configRef.current.hue}, 80%, 90%, ${safeOpacity * 0.9})`);
            gradient.addColorStop(0.5, `hsla(${configRef.current.hue}, 90%, 70%, ${safeOpacity * 0.5})`);
            gradient.addColorStop(1, `hsla(${configRef.current.hue}, 100%, 50%, 0.0)`);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(glow.x, glow.y, glowRadius, 0, Math.PI * 2);
            context.fill();
          }
          // Decrease slower so it matches the bolt fade time (0.75s)
          glow.opacity -= 1.0 * elapsed;
        } else {
          activeGlows.splice(i, 1);
          i--;
        }
      }
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1.0;
      
      animationFrameId = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", setCanvasSize);
    setCanvasSize();
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", setCanvasSize);
      activeIntervals.forEach(clearInterval);
    };
  }, []);

  // Parent container handles mixBlendMode. Opacity is handled per-glow inside the render loop now.
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 1 }} />;
}
