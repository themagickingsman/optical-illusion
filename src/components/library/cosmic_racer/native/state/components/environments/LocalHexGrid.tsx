"use client";

import React, { useEffect, useRef, useState } from 'react';

// Math constants for Flat-Topped hex
const SQRT3 = Math.sqrt(3);

interface LocalGridProps {
  onBack: () => void;
  seedLocation: { lat: number, lon: number } | null;
}

export default function LocalHexGrid({ onBack, seedLocation }: LocalGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hexRadius, setHexRadius] = useState(60); // Base zoom level
  const [camera, setCamera] = useState({ x: 0, y: 0 }); // World center
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Grid mechanics
  const drawHex = (ctx: CanvasRenderingContext2D, q: number, r: number, radius: number, cx: number, cy: number, seed: number) => {
    // Math for pointy-topped hexagons (Diamond Top)
    const x = radius * SQRT3 * (q + r/2) + cx;
    const y = radius * (3/2) * r + cy;

    // Viewport Culling
    if (x < -radius*2 || x > window.innerWidth + radius*2 ||
        y < -radius*2 || y > window.innerHeight + radius*2) {
      return;
    }

    ctx.save();
    ctx.translate(x, y);

    // Procedural terrain color based on coordinates & seed
    const terrainHash = Math.abs(Math.sin(q * 12.9898 + r * 78.233 + seed) * 43758.5453) % 1;
    let fillColor = "#2d3748"; // Default dry rock
    if (terrainHash < 0.2) fillColor = "#0ea5e9"; // Water
    else if (terrainHash < 0.4) fillColor = "#10b981"; // Alien Grass
    else if (terrainHash < 0.45) fillColor = "#8b5cf6"; // Crystal Mineral
    else if (terrainHash < 0.6) fillColor = "#3f3f46"; // Dark stone

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        // Pointy top angle sequence (30, 90, 150, etc.)
        const angle = (Math.PI / 180) * (60 * i + 30);
        const hx = radius * Math.cos(angle);
        const hy = radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    // Inward bevel / border
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.stroke();

    // Slight inner glow overlay
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i + 30);
        const hx = (radius-4) * Math.cos(angle);
        const hy = (radius-4) * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', handleResize);

    // Generate random seed locally based on the lat/lon clicked!
    const localSeed = seedLocation ? (seedLocation.lat * 1000 + seedLocation.lon * 2000) : 1337;

    let frameId: number;
    const loop = () => {
      ctx.fillStyle = "#1a202c"; // Deep tactical space background
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2 - camera.x;
      const cy = h / 2 - camera.y;

      // Draw standard hex grid bound algorithmically to viewport size (Hard clamped to prevent memory leaks)
      const maxCol = Math.min(60, Math.ceil(w / (hexRadius * SQRT3)) + 4);
      const maxRow = Math.min(40, Math.ceil(h / (hexRadius * 1.5)) + 4);

      // Identify the core (0,0) offset inside the viewport grid using inverse formulas
      const camR = Math.round(camera.y / (hexRadius * 1.5));
      const camQ = Math.round(camera.x / (hexRadius * SQRT3) - camR / 2);

      // Draw infinitely wrapping dynamic matrix
      for (let q = camQ - maxCol; q <= camQ + maxCol; q++) {
        for (let r = camR - maxRow; r <= camR + maxRow; r++) {
          drawHex(ctx, q, r, hexRadius, cx, cy, localSeed);
        }
      }

      // Draw center crosshair for debugging orientation
      ctx.beginPath();
      ctx.moveTo(w/2 - 20, h/2);
      ctx.lineTo(w/2 + 20, h/2);
      ctx.moveTo(w/2, h/2 - 20);
      ctx.lineTo(w/2, h/2 + 20);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [camera, hexRadius, seedLocation]);

  // Interaction handlers
  const handleWheel = (e: React.WheelEvent) => {
    // Zoom in/out linearly
    const zoomFactor = -e.deltaY * 0.1;
    setHexRadius(currentR => Math.max(20, Math.min(200, currentR + zoomFactor)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    // Map screen pixel drag inverse to world camera coordinates
    setCamera(c => ({ x: c.x - dx, y: c.y - dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none" // Prevent native browser pull-to-refresh
        }}
      />

      {/* Control Overlay */}
      <div style={{ position: "absolute", top: 20, right: 30, zIndex: 999999 }}>
         <button 
           onClick={onBack}
           style={{
             background: "rgba(244, 63, 94, 0.9)", // Rose 500
             color: "white", 
             border: "2px solid #fff", 
             width: "60px",
             height: "60px",
             borderRadius: "50%", 
             cursor: "pointer", 
             fontWeight: "900",
             fontSize: "24px",
             boxShadow: "0 0 20px rgba(244, 63, 94, 0.6)",
             display: "flex",
             justifyContent: "center",
             alignItems: "center",
             transition: "transform 0.2s"
           }}
           onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
           onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
         >
           ✕
         </button>
      </div>

      <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 10, background: "rgba(0,0,0,0.8)", padding: 20, borderRadius: 8, border: "1px solid #444", color: "#fff", fontFamily: "monospace" }}>
         <h2 style={{ marginTop: 0, color: "#00e5ff" }}>Local Planetary Grid: Sector 0x4B</h2>
         <p style={{ margin: "5px 0", color: "#888" }}>X: {Math.round(camera.x)} | Y: {Math.round(camera.y)} | Zoom: {Math.round(hexRadius)}px</p>
      </div>
    </div>
  );
}
