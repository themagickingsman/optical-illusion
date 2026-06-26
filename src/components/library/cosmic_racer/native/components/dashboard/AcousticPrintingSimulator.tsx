"use client";

import React, { useRef, useEffect, useState } from "react";
import AcousticPrinting3DModel from "./AcousticPrinting3DModel";

const TARGET_MATERIALS: Record<
  string,
  {
    name: string;
    color: string;
    fusedColor: string;
    density: number;
    speedOfSound: number; // m/s
    description: string;
  }
> = {
  Titanium: {
    name: "Titanium Dust (Ti-6Al-4V)",
    color: "#94a3b8",
    fusedColor: "#f1f5f9",
    density: 4430,
    speedOfSound: 6090, // Bulk speed of sound in Titanium
    description:
      "High-strength, lightweight aerospace alloy powder. Extremely difficult to thermal-print without residual stress.",
  },
  Copper: {
    name: "Copper Nanoparticles (Cu)",
    color: "#d97706",
    fusedColor: "#fbbf24",
    density: 8960,
    speedOfSound: 4600, // Bulk speed of sound in Copper
    description:
      "Highly conductive material for Fractal Solar Mesh. Acoustic assembly prevents oxidation during construction.",
  },
  Gold: {
    name: "Gold Colloid (Au)",
    color: "#eab308",
    fusedColor: "#fef08a",
    density: 19300,
    speedOfSound: 3240, // Bulk speed of sound in Gold
    description:
      "Ultra-dense noble metal used for zero-resistance nano-circuitry within the logic modules.",
  },
};

const TARGET_COMPONENTS: Record<
  string,
  { name: string; description: string; shapeType: string }
> = {
  HarvesterNode: {
    name: "Acoustic Harvester Node",
    description:
      "Complex internal resonant cavity to trap monoatomic gold. Impossible to cast traditionally.",
    shapeType: "sphere",
  },
  SolarMesh: {
    name: "Fractal Solar Nano-Mesh",
    description:
      "Microscopic overlapping leaf-vein patterns to capture quantum light fluctuations.",
    shapeType: "fractal",
  },
  LaminarPipe: {
    name: "Laminar Intake Pipe",
    description:
      "Extremely smooth, perfectly uniform interior cylinder to prevent turbulence in fluid processing.",
    shapeType: "cylinder",
  },
};

export const AcousticPrintingSimulator = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Component State
  const [selectedMaterial, setSelectedMaterial] = useState("Titanium");
  const [selectedComponent, setSelectedComponent] = useState("HarvesterNode");
  const [acousticFreq, setAcousticFreq] = useState(138.8); // kHz
  const [weldPressure, setWeldPressure] = useState(100.0); // MPa

  // Parametric Dimensions State
  const [harvesterOuterRadius, setHarvesterOuterRadius] = useState(65.0); // mm
  const [harvesterInnerRadius, setHarvesterInnerRadius] = useState(40.0); // mm
  const [meshPitch, setMeshPitch] = useState(25.0); // μm
  const [meshThickness, setMeshThickness] = useState(3.14); // μm
  const [pipeLength, setPipeLength] = useState(180.0); // mm
  const [pipeOuterRadius, setPipeOuterRadius] = useState(40.0); // mm
  const [pipeInnerRadius, setPipeInnerRadius] = useState(30.0); // mm

  // Refs for hot-loop canvas access
  const materialRef = useRef(selectedMaterial);
  const componentRef = useRef(selectedComponent);
  const paramsRef = useRef({
    harvesterOuterRadius,
    harvesterInnerRadius,
    meshPitch,
    meshThickness,
    pipeLength,
    pipeOuterRadius,
    pipeInnerRadius,
    acousticFreq,
    weldPressure
  });

  useEffect(() => {
    materialRef.current = selectedMaterial;
    componentRef.current = selectedComponent;
    paramsRef.current = {
      harvesterOuterRadius,
      harvesterInnerRadius,
      meshPitch,
      meshThickness,
      pipeLength,
      pipeOuterRadius,
      pipeInnerRadius,
      acousticFreq,
      weldPressure
    };
  }, [
    selectedMaterial, 
    selectedComponent, 
    harvesterOuterRadius, 
    harvesterInnerRadius, 
    meshPitch, 
    meshThickness, 
    pipeLength, 
    pipeOuterRadius, 
    pipeInnerRadius, 
    acousticFreq, 
    weldPressure
  ]);

  // Display calculations
  const displayIntegrity = (weldPressure / 100) * 99.99; // Yields 99.99% at max
  const displayTrapDensity = (acousticFreq / 138.8) * 1.618; // millions per CC

  // Canvas Blueprint Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      time += 0.016;

      const activeMaterial = materialRef.current;
      const activeComponent = componentRef.current;
      const p = paramsRef.current;

      // Blueprint background overlay
      ctx.fillStyle = "rgba(10, 25, 47, 1.0)"; // Deep blueprint navy
      ctx.fillRect(0, 0, width, height);

      // Blueprint grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.1)"; // Cyan grid
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < width; i += 20) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
      }
      for (let i = 0; i < height; i += 20) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
      ctx.stroke();

      ctx.strokeStyle = "#38bdf8"; // Bright cyan for lines
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";

      // Draw Title Block
      const activeMatInfo = TARGET_MATERIALS[activeMaterial];
      const wavelength_mm = activeMatInfo.speedOfSound / p.acousticFreq;
      const tolStr = `±${(wavelength_mm * 0.0001).toFixed(4)} μm (Q-ALIGN)`;

      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`PRODUCTION BLUEPRINT`, 30, 40);
      ctx.font = "12px monospace";
      ctx.fillText(
        `PART:   ${TARGET_COMPONENTS[activeComponent].name.toUpperCase()}`,
        30,
        65,
      );
      ctx.fillText(
        `MAT:    ${TARGET_MATERIALS[activeMaterial].name.toUpperCase()}`,
        30,
        85,
      );
      ctx.fillText(`TOL:    ${tolStr}`, 30, 105);
      ctx.fillText(`STATUS: MANUFACTURED`, 30, 125);

      ctx.beginPath();
      ctx.moveTo(30, 140);
      ctx.lineTo(350, 140);
      ctx.stroke();

      // Helpers for drafting
      const drawDim = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        text: string,
        offset: number,
        isVertical: boolean,
      ) => {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();

        if (isVertical) {
          const nx = x1 + offset;
          ctx.moveTo(x1, y1);
          ctx.lineTo(nx, y1);
          ctx.moveTo(x2, y2);
          ctx.lineTo(nx, y2);
          // arrow line
          ctx.moveTo(nx - 10, y1);
          ctx.lineTo(nx - 10, y2);

          // arrows
          ctx.moveTo(nx - 13, y1 + 6);
          ctx.lineTo(nx - 10, y1);
          ctx.lineTo(nx - 7, y1 + 6);
          ctx.moveTo(nx - 13, y2 - 6);
          ctx.lineTo(nx - 10, y2);
          ctx.lineTo(nx - 7, y2 - 6);
          ctx.stroke();

          ctx.translate(nx - 15, (y1 + y2) / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.fillText(text, 0, 0);
        } else {
          const ny = y1 + offset;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, ny);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2, ny);
          // arrow line
          ctx.moveTo(x1, ny - 10);
          ctx.lineTo(x2, ny - 10);

          // arrows
          ctx.moveTo(x1 + 6, ny - 13);
          ctx.lineTo(x1, ny - 10);
          ctx.lineTo(x1 + 6, ny - 7);
          ctx.moveTo(x2 - 6, ny - 13);
          ctx.lineTo(x2, ny - 10);
          ctx.lineTo(x2 - 6, ny - 7);
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.fillText(text, (x1 + x2) / 2, ny - 15);
        }
        ctx.restore();
      };

      const drawCenterLine = (
        x: number,
        y: number,
        len: number,
        isVertical: boolean,
      ) => {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.setLineDash([15, 5, 3, 5]);
        ctx.beginPath();
        if (isVertical) {
          ctx.moveTo(x, y - len / 2);
          ctx.lineTo(x, y + len / 2);
        } else {
          ctx.moveTo(x - len / 2, y);
          ctx.lineTo(x + len / 2, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      // Component specific drafting
      if (activeComponent === "HarvesterNode") {
        // Top View (Left)
        const cx1 = width * 0.25;
        const cy1 = height * 0.55;
        const rOut = p.harvesterOuterRadius;
        const rIn = p.harvesterInnerRadius;

        ctx.beginPath();
        ctx.arc(cx1, cy1, rOut, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx1, cy1, rIn, 0, Math.PI * 2);
        ctx.stroke();

        // Resonant node pattern (representing internal trap structure)
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.5)"; // Greenish hint for acoustic nodes
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo(cx1, cy1);
          ctx.lineTo(
            cx1 + Math.cos((Math.PI / 3) * i) * rIn,
            cy1 + Math.sin((Math.PI / 3) * i) * rIn
          );
          ctx.stroke();
        }
        ctx.restore();

        drawCenterLine(cx1, cy1, rOut * 2.5 + 40, true);
        drawCenterLine(cx1, cy1, rOut * 2.5 + 40, false);

        drawDim(cx1 - rOut, cy1, cx1 + rOut, cy1, `Ø ${rOut * 2} mm`, -rOut - 20, false);
        drawDim(cx1 - rIn, cy1, cx1 + rIn, cy1, `Ø ${rIn * 2} mm`, -rOut + 15, false);

        ctx.textAlign = "center";
        ctx.fillText("TOP VIEW", cx1, cy1 + Math.max(rOut, 100) + 10);

        // Front View (Center)
        const cx2 = width * 0.5;
        const cy2 = cy1;

        ctx.beginPath();
        ctx.arc(cx2, cy2, rOut, 0, Math.PI * 2);
        ctx.stroke();
        // Hidden inner cavity
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx2, cy2, rIn, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        drawCenterLine(cx2, cy2, rOut * 2.5 + 40, true);
        drawCenterLine(cx2, cy2, rOut * 2.5 + 40, false);
        
        ctx.textAlign = "center";
        ctx.fillText("FRONT VIEW", cx2, cy2 + Math.max(rOut, 100) + 10);

        // Section View (Right)
        const cx3 = width * 0.75;
        const cy3 = cy1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx3, cy3, rOut, Math.PI / 2, Math.PI * 1.5);
        ctx.lineTo(cx3, cy3 - rIn);
        ctx.arc(cx3, cy3, rIn, Math.PI * 1.5, Math.PI / 2, true);
        ctx.lineTo(cx3, cy3 + rOut);
        ctx.stroke();

        // Hatching
        ctx.beginPath();
        ctx.arc(cx3, cy3, rOut, Math.PI / 2, Math.PI * 1.5);
        ctx.lineTo(cx3, cy3 - rIn);
        ctx.arc(cx3, cy3, rIn, Math.PI * 1.5, Math.PI / 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -rOut; i < rOut; i += 6) {
          ctx.moveTo(cx3 - rOut, cy3 + i - rOut);
          ctx.lineTo(cx3 + rOut, cy3 + i + rOut);
        }
        ctx.stroke();
        ctx.restore();

        // Right half is full exterior
        ctx.beginPath();
        ctx.arc(cx3, cy3, rOut, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        drawCenterLine(cx3, cy3, rOut * 2.5 + 40, true);
        
        ctx.textAlign = "center";
        ctx.fillText("SECTION A-A", cx3, cy3 + Math.max(rOut, 100) + 10);
        drawDim(cx3, cy3 - rOut, cx3, cy3 + rOut, `${rOut * 2} mm`, rOut + 25, true);
        drawDim(cx3, cy3 - rIn, cx3, cy3 + rIn, `${rIn * 2} mm`, rIn + 10, true);
      } else if (activeComponent === "SolarMesh") {
        // Fractal Honeycomb drafting
        const cx = width * 0.35;
        const cy = height * 0.55;
        const hexSize = p.meshPitch;

        ctx.save();
        ctx.translate(cx, cy);
        for (let x = -4; x <= 4; x++) {
          for (let y = -4; y <= 4; y++) {
            const px = x * hexSize * 1.5;
            const py =
              (y + (Math.abs(x) % 2) * 0.5) * hexSize * Math.sqrt(3);
            if (Math.hypot(px, py) < 130) {
              ctx.beginPath();
              for (let s = 0; s < 6; s++) {
                const angle = (Math.PI / 3) * s;
                const hx = px + hexSize * Math.cos(angle);
                const hy = py + hexSize * Math.sin(angle);
                if (s === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
              }
              ctx.closePath();
              ctx.stroke();
            }
          }
        }
        ctx.restore();

        drawCenterLine(cx, cy, 320, true);
        drawCenterLine(cx, cy, 320, false);

        drawDim(
          cx - hexSize,
          cy - (hexSize * Math.sqrt(3)) / 2,
          cx + Math.cos(Math.PI / 3) * hexSize,
          cy - Math.sin(Math.PI / 3) * hexSize,
          `${p.meshPitch} μm PITCH`,
          -160,
          false,
        );
        
        ctx.textAlign = "center";
        ctx.fillText("FRONT DATUM PLAN", cx, cy + 180);

        // Mesh Thickness Profile (Right Side)
        const px2 = width * 0.75;
        const py2 = height * 0.55;
        
        ctx.beginPath();
        ctx.rect(px2 - 10, py2 - 130, 20, 260);
        ctx.stroke();

        // Stacked layers indication
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1;
        for(let i = 0; i < 260; i += 10) {
            ctx.beginPath();
            ctx.moveTo(px2 - 10, py2 - 130 + i);
            ctx.lineTo(px2 + 10, py2 - 130 + i);
            ctx.stroke();
        }
        ctx.restore();

        drawCenterLine(px2, py2, 320, true);
        drawDim(px2 - 10, py2 + 140, px2 + 10, py2 + 140, `${p.meshThickness.toFixed(2)} μm THICKNESS`, 20, false);
        
        ctx.textAlign = "center";
        ctx.fillText("PROFILE LAYER STACK", px2, py2 + 180);

      } else if (activeComponent === "LaminarPipe") {
        // Cylinder drafting
        const cx1 = width * 0.25;
        const cy1 = height * 0.55;
        const rOut = p.pipeOuterRadius;
        const rIn = p.pipeInnerRadius;

        // End View (Left)
        ctx.beginPath();
        ctx.arc(cx1, cy1, rOut, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx1, cy1, rIn, 0, Math.PI * 2);
        ctx.stroke();
        drawCenterLine(cx1, cy1, rOut * 2.5 + 40, true);
        drawCenterLine(cx1, cy1, rOut * 2.5 + 40, false);
        drawDim(cx1 - rOut, cy1, cx1 + rOut, cy1, `Ø ${rOut * 2} mm`, -rOut - 30, false);
        
        ctx.textAlign = "center";
        ctx.fillText("END VIEW", cx1, cy1 + Math.max(rOut, 90) + 10);

        // Front Profile (Center)
        const cx2 = width * 0.5;
        const cy2 = cy1;
        const len = p.pipeLength;

        ctx.beginPath();
        ctx.rect(cx2 - len / 2, cy2 - rOut, len, rOut * 2);
        ctx.stroke();

        // Hidden lines for inner bore
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx2 - len / 2, cy2 - rIn);
        ctx.lineTo(cx2 + len / 2, cy2 - rIn);
        ctx.moveTo(cx2 - len / 2, cy2 + rIn);
        ctx.lineTo(cx2 + len / 2, cy2 + rIn);
        ctx.stroke();
        ctx.restore();

        drawCenterLine(cx2, cy2, len + 60, false);
        drawDim(cx2 - len / 2, cy2 - rOut, cx2 + len / 2, cy2 - rOut, `${len} mm`, -rOut - 15, false);

        ctx.textAlign = "center";
        ctx.fillText("FRONT ELEVATION", cx2, cy2 + Math.max(rOut, 90) + 10);
        
        // Section Profile (Right)
        const cx3 = width * 0.75;
        const cy3 = cy1;
        
        ctx.beginPath();
        ctx.rect(cx3 - len / 2, cy3 - rOut, len, rOut * 2);
        ctx.stroke();
        
        // Bore lines
        ctx.beginPath();
        ctx.moveTo(cx3 - len / 2, cy3 - rIn);
        ctx.lineTo(cx3 + len / 2, cy3 - rIn);
        ctx.moveTo(cx3 - len / 2, cy3 + rIn);
        ctx.lineTo(cx3 + len / 2, cy3 + rIn);
        ctx.stroke();

        // Hatching walls
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx3 - len / 2, cy3 - rOut, len, rOut - rIn);
        ctx.rect(cx3 - len / 2, cy3 + rIn, len, rOut - rIn);
        ctx.clip("nonzero");
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1;
        for(let i = -len/2 - 100; i < len/2 + 100; i += 8) {
            ctx.beginPath();
            ctx.moveTo(cx3 + i, cy3 - 100);
            ctx.lineTo(cx3 + i + 100, cy3 + 100);
            ctx.stroke();
        }
        ctx.restore();

        drawCenterLine(cx3, cy3, len + 60, false);
        drawDim(cx3 + len / 2, cy3 - rOut, cx3 + len / 2, cy3 + rOut, `${rOut * 2} mm`, 40, true);
        drawDim(cx3 + len / 2, cy3 - rIn, cx3 + len / 2, cy3 + rIn, `${rIn * 2} mm`, 15, true);

        ctx.textAlign = "center";
        ctx.fillText("SECTION B-B", cx3, cy3 + Math.max(rOut, 90) + 10);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* FULL WIDTH CONTROLS */}
      <div
        style={{
          width: "100%",
          background: "#0f172a",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid #1e293b",
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          boxSizing: "border-box",
        }}
      >
        {/* Component & Material Setup */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TARGET C.A.D
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {Object.keys(TARGET_COMPONENTS).map((key) => {
                const isSel = selectedComponent === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedComponent(key)}
                    style={{
                      flex: 1, padding: "0.5rem", borderRadius: "8px",
                      border: `1px solid ${isSel ? "#8b5cf6" : "#334155"}`,
                      background: isSel ? "rgba(139, 92, 246, 0.15)" : "transparent",
                      color: isSel ? "#ffffff" : "#94a3b8",
                      fontWeight: isSel ? 700 : 500, fontSize: "0.75rem",
                      cursor: "pointer", transition: "all 0.2s ease"
                    }}
                  >
                    {key === "HarvesterNode" ? "Sphere" : key === "SolarMesh" ? "Hex-Grid" : "Pipe"}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              INPUT MATERIAL
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {Object.keys(TARGET_MATERIALS).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedMaterial(key)}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "8px",
                    border: `1px solid ${selectedMaterial === key ? TARGET_MATERIALS[key].color : "#334155"}`,
                    background: selectedMaterial === key ? `${TARGET_MATERIALS[key].color}22` : "transparent",
                    color: selectedMaterial === key ? TARGET_MATERIALS[key].color : "#94a3b8",
                    fontWeight: selectedMaterial === key ? 700 : 500, fontSize: "0.75rem",
                    cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s"
                  }}
                >
                  {TARGET_MATERIALS[key].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Parameters */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
           <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              FABRICATION ENVIRONMENT
            </label>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Acoustic Potential</span>
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.75rem" }}>{acousticFreq.toFixed(1)} kHz</span>
            </div>
            <input type="range" min="20" max="138.8" step="0.1" value={acousticFreq} onChange={(e) => setAcousticFreq(parseFloat(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: "#10b981", height: "4px" }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Weld Cavitation</span>
              <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.75rem" }}>{weldPressure.toFixed(1)} MPa</span>
            </div>
            <input type="range" min="10.0" max="150.0" step="1.0" value={weldPressure} onChange={(e) => setWeldPressure(parseFloat(e.target.value))} style={{ width: "100%", cursor: "pointer", accentColor: "#8b5cf6", height: "4px" }} />
          </div>
        </div>

        {/* Component Dimensions Specifics */}
        <div style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "1rem", borderLeft: "1px solid #1e293b", paddingLeft: "2rem" }}>
           <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              PARAMETRIC DIMENSIONS
            </label>
            
            {selectedComponent === "HarvesterNode" && (
              <>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Outer Radius</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{harvesterOuterRadius.toFixed(1)} mm</span>
                  </div>
                  <input type="range" min="20" max="120" step="1" value={harvesterOuterRadius} onChange={(e) => setHarvesterOuterRadius(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Inner Cavity Radius</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{harvesterInnerRadius.toFixed(1)} mm</span>
                  </div>
                  <input type="range" min="10" max={harvesterOuterRadius - 5} step="1" value={harvesterInnerRadius} onChange={(e) => setHarvesterInnerRadius(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
              </>
            )}

            {selectedComponent === "SolarMesh" && (
              <>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Hexagonal Pitch</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{meshPitch.toFixed(1)} μm</span>
                  </div>
                  <input type="range" min="5" max="50" step="0.5" value={meshPitch} onChange={(e) => setMeshPitch(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Layer Thickness</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{meshThickness.toFixed(2)} μm</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.01" value={meshThickness} onChange={(e) => setMeshThickness(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
              </>
            )}

            {selectedComponent === "LaminarPipe" && (
              <>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Pipe Length</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{pipeLength.toFixed(1)} mm</span>
                  </div>
                  <input type="range" min="50" max="300" step="1" value={pipeLength} onChange={(e) => setPipeLength(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Outer Radius</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{pipeOuterRadius.toFixed(1)} mm</span>
                  </div>
                  <input type="range" min="15" max="80" step="1" value={pipeOuterRadius} onChange={(e) => setPipeOuterRadius(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>Inner Bore Radius</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.75rem" }}>{pipeInnerRadius.toFixed(1)} mm</span>
                  </div>
                  <input type="range" min="5" max={pipeOuterRadius - 2} step="1" value={pipeInnerRadius} onChange={(e) => setPipeInnerRadius(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", height: "4px" }} />
                </div>
              </>
            )}
        </div>
      </div>

      {/* 2. HUD AND CANVAS GRID */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "stretch", height: "450px" }}>
        
        {/* HUD Data Output */}
        <div style={{ width: "350px", background: "#0f172a", padding: "2rem", borderRadius: "16px", color: "#f8fafc", boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)", border: "1px solid #1e293b", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", color: "#8b5cf6", margin: 0 }}>ENGINEERING HUD</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}></div>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 10px #8b5cf6", animation: "pulse 2s infinite" }}></div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Acoustic Holographic Trap Density</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 300, fontFamily: "monospace", color: "#f8fafc" }}>
                {displayTrapDensity.toFixed(3)} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>M/cm³</span>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Sonochemical Weld Pressure</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 300, fontFamily: "monospace", color: "#f8fafc" }}>
                {weldPressure.toFixed(1)} <span style={{ fontSize: "1rem", color: "#94a3b8" }}>MPa</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Solid-State Bond Integrity</div>
              <div style={{ fontSize: "2rem", fontWeight: 300, fontFamily: "monospace", color: "#10b981" }}>
                {displayIntegrity.toFixed(4)} %
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Blueprint Canvas */}
        <div style={{ flex: 1, position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid #1e293b", background: "#0f172a" }}>
          <canvas ref={canvasRef} width={800} height={450} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
        </div>
      </div>

      {/* 3. MATERIAL AND COMPONENT DESCRIPTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: TARGET_MATERIALS[selectedMaterial].color }}>●</span> {TARGET_MATERIALS[selectedMaterial].name}
          </h3>
          <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: "0.95rem" }}>{TARGET_MATERIALS[selectedMaterial].description}</p>
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "#8b5cf6" }}>■</span> {TARGET_COMPONENTS[selectedComponent].name}
          </h3>
          <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: "0.95rem" }}>{TARGET_COMPONENTS[selectedComponent].description}</p>
        </div>
      </div>

      <div style={{ marginBottom: "3rem" }}>
        <AcousticPrinting3DModel 
           componentType={selectedComponent}
           material={selectedMaterial}
           params={{ harvesterOuterRadius, harvesterInnerRadius, meshPitch, meshThickness, pipeLength, pipeOuterRadius, pipeInnerRadius }}
        />
      </div>
    </div>
  );
};
