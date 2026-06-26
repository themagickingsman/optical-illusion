"use client";

import React, { useEffect, useRef } from "react";

export default function RainEffect({ bgUrl = "/api/cyber-apartment" }: { bgUrl?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", resize);

    // Load background
    const bgImg = new Image();
    bgImg.src = bgUrl;
    let imgLoaded = false;
    // Fallback gradient if image fails
    let fallbackGrad: CanvasGradient;

    bgImg.onload = () => {
      imgLoaded = true;
    };

    // Raindrop physics configuration
    interface Drop {
      x: number;
      y: number;
      r: number; // Radius
      l: number; // Life/Length of trail
      xs: number; // X-speed (wind)
      ys: number; // Y-speed (gravity)
      type: "static" | "falling";
      alpha: number;
    }

    const maxDrops = 150;
    const drops: Drop[] = [];

    // Initialize initial static drops across the glass
    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1.5,
        l: Math.random() * 20,
        xs: -1 + Math.random() * 2, // Slight wind
        ys: Math.random() * 10 + 10,
        type: Math.random() > 0.8 ? "falling" : "static",
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const drawGlassDrop = (drop: Drop) => {
      if (drop.r < 0.5) return;
      
      // We simulate pseudo-refraction by drawing the background inverted or offset,
      // but to keep 60fps across all devices, we draw a sleek volumetric glass bead natively using gradients
      
      ctx.save();
      ctx.beginPath();
      ctx.translate(drop.x, drop.y);
      
      // Trail for falling drops
      if (drop.type === "falling") {
         ctx.moveTo(0, 0);
         ctx.lineTo(-drop.xs * (drop.ys * 0.5), -drop.ys * 1.2);
         ctx.lineWidth = drop.r;
         ctx.lineCap = "round";
         const trailGrad = ctx.createLinearGradient(0, 0, -drop.xs * drop.ys, -drop.ys * 1.2);
         trailGrad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha * 0.5})`);
         trailGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
         ctx.strokeStyle = trailGrad;
         ctx.stroke();
      }

      // Bulb (Glass droplet body)
      ctx.beginPath();
      ctx.arc(0, 0, drop.r, 0, Math.PI * 2);
      ctx.clip(); // Clip to circle

      // Refraction illusion: dark top, light bottom
      const glassGrad = ctx.createLinearGradient(0, -drop.r, 0, drop.r);
      glassGrad.addColorStop(0, "rgba(0, 0, 0, 0.6)");
      glassGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.1)");
      glassGrad.addColorStop(0.8, "rgba(255, 255, 255, 0.2)");
      glassGrad.addColorStop(1, "rgba(255, 255, 255, 0.8)");
      
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Specular Highlight (The tiny bright reflection)
      ctx.beginPath();
      ctx.arc(0, -drop.r * 0.4, drop.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${drop.alpha + 0.3})`;
      ctx.fill();

      // Inner shadow border for depth
      ctx.beginPath();
      ctx.arc(0, 0, drop.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = drop.r * 0.15;
      ctx.stroke();

      ctx.restore();
    };

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // 1. Draw Background View (The Cyberpunk City)
      if (imgLoaded && bgImg.width > 0) {
         // Scale to cover
         const imgRatio = bgImg.width / bgImg.height;
         const screenRatio = w / h;
         let drawW = w, drawH = h, offsetX = 0, offsetY = 0;
         if (screenRatio > imgRatio) {
            drawH = w / imgRatio;
            offsetY = (h - drawH) / 2;
         } else {
            drawW = h * imgRatio;
            offsetX = (w - drawW) / 2;
         }
         
         // Apply a slight blur or darkening simulating thick window glass
         ctx.filter = "brightness(0.8) contrast(1.1) blur(2px)";
         ctx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
         ctx.filter = "none";
      } else {
         if (!fallbackGrad) {
             fallbackGrad = ctx.createLinearGradient(0, 0, 0, h);
             fallbackGrad.addColorStop(0, "#050B14");
             fallbackGrad.addColorStop(1, "#1A0F2E");
         }
         ctx.fillStyle = fallbackGrad;
         ctx.fillRect(0, 0, w, h);
      }

      // Add atmospheric glow over the window
      const neonGlow = ctx.createLinearGradient(0, 0, w, 0);
      neonGlow.addColorStop(0, "rgba(0, 229, 255, 0.05)");
      neonGlow.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      neonGlow.addColorStop(1, "rgba(255, 0, 128, 0.05)");
      ctx.fillStyle = neonGlow;
      ctx.fillRect(0, 0, w, h);

      // 2. Physics & Draw Drops
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        if (d.type === "falling") {
            // Gravity & Friction
            d.y += d.ys;
            d.x += d.xs;
            
            // Randomly merge with static drops directly in its path
            for(let j=0; j<drops.length; j++) {
                if (i===j || drops[j].type === "falling") continue;
                const sd = drops[j];
                const dist = Math.hypot(d.x - sd.x, d.y - sd.y);
                if (dist < d.r + sd.r) {
                   // Absorb the static drop
                   d.r = Math.min(d.r + sd.r * 0.2, 8); // Grow slightly
                   d.ys += sd.r * 0.5; // Gain momentum
                   
                   // Respawn the static drop somewhere else instantly so we don't lose overall wetness
                   sd.x = Math.random() * w;
                   sd.y = Math.random() * h;
                   sd.r = Math.random() * 2 + 1;
                }
            }

            if (d.y > h + d.r) { // Reset at top
               d.y = -20;
               d.x = Math.random() * w;
               d.ys = Math.random() * 10 + 10;
               d.r = Math.random() * 3 + 2;
            }
        } else {
            // Static drops just hang, slowly accumulating or evaporating
            if (Math.random() < 0.001) {
                // Suddenly gains enough mass to fall!
                d.type = "falling";
                d.ys = 5;
            }
        }

        drawGlassDrop(d);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [bgUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
