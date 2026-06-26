import React, { useState, useRef, useEffect, useMemo } from 'react';
import bakedCatalog from "../../data/cosmic_catalog_snapshot.json";

interface PlanetManagerProps {
  onSelectPlanet?: (planetName: string, posX: number, posY: number) => void;
  onClose?: () => void;
}

export default function PlanetManager({ onSelectPlanet, onClose }: PlanetManagerProps) {
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 0.15 }); // zoomed out
  const camRef = useRef({ x: 0, y: 0, scale: 0.15 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeWaypoint, setActiveWaypoint] = useState<string | null>(null);
  const activeWaypointRef = useRef<string | null>(null);
  const pzaRef = useRef({ active: false, direction: 'in', progress: 0, startCam: { x: 0, y: 0, scale: 0.15 }, endScale: 1.0 });
  const [dim, setDim] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1200, h: typeof window !== 'undefined' ? window.innerHeight : 800 });
  const lastMouse = useRef({ x: 0, y: 0 });

  // Read solar system (octave 11) data exactly as AsteroidsGame does
  const solarSystemBodies = useMemo(() => {
    const raw = (bakedCatalog as any)?.octaves?.["11"] || [];
    
    const realBodies = raw.filter(
      (b: any) =>
        b.name &&
        b.name !== "Predicted Orbit" &&
        b.status !== "predicted" &&
        (b.object_type === "Planet" ||
          b.object_type === "Dwarf Planet" ||
          b.object_type === "Star" ||
          b.name.toLowerCase().includes("sun"))
    );

    const getAu = (b: any) =>
      b.radius_au || b.meta?.true_radius_au || b.meta?.local_radius_au || Number(b.id) || 0;

    const toWorldR = (au: number) => {
      return Math.pow(Math.max(au, 0.001), 0.6) * 3500;
    };

    const getRad = (b: any) => b.meta?.real_radius || b.radius_au || getAu(b);
    
    return realBodies.map((b: any) => {
      const au = getAu(b);
      const wR = toWorldR(au);
      const label = (b.name as string).toUpperCase().slice(0, 20);

      // Pastel colors from AsteroidsGame
      let col = "#ffffff";
      const nLower = label.toLowerCase();
      if (nLower.includes("sun")) col = "#ffdd88";
      else if (nLower.includes("mercury")) col = "#cccccc";
      else if (nLower.includes("venus")) col = "#ffccaa";
      else if (nLower.includes("earth")) col = "#99ccff";
      else if (nLower.includes("mars")) col = "#ff9988";
      else if (nLower.includes("jupiter")) col = "#eeddcc";
      else if (nLower.includes("saturn")) col = "#ffeecc";
      else if (nLower.includes("uranus")) col = "#aaddff";
      else if (nLower.includes("neptune")) col = "#88aaff";
      else if (nLower.includes("pluto")) col = "#eeeeee";
      else col = b.compass_hex || b.color || "#888888";

      // Base radius calculation
      const r = b.name === "Sun" ? 50 : Math.max(3, Math.min(25, getRad(b) * 100));

      // Calculate orb speed logic from AsteroidsGame
      // Speed inversely proportional to sqrt(AU)
      const baseOrbSpeed = 0.001 / Math.sqrt(Math.max(au, 0.1));

      return {
        ...b,
        name: label,
        worldR: wR,
        color: col,
        r,
        au,
        orbSpeed: baseOrbSpeed,
        baseAngle: Number(b.id) || Math.random() * Math.PI * 2
      };
    }).sort((a: any, b: any) => a.au - b.au);
  }, []);

  // Frame loop for animating orbits + Window Resize Observer
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const handleResize = () => setDim({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    
    // Cinematic Quart easing curve for a snappy mid-flight and an extremely soft planetary landing
    const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    
    let raf: number;
    let localFrame = 0;
    const loop = () => {
      localFrame++;
      setFrame(localFrame);
      
      const pza = pzaRef.current;
      const awp = activeWaypointRef.current;
      
      if (pza.active) {
         pza.progress += (pza.direction === 'in' ? 0.02 : -0.02);
         if (pza.progress >= 1.0) { pza.progress = 1.0; pza.active = false; }
         if (pza.progress <= 0.0) { pza.progress = 0.0; pza.active = false; }
      }
      
      if (awp) {
          const target = solarSystemBodies.find((b: any) => b.name === awp);
          if (target && pza.progress > 0) {
              const pAngle = target.baseAngle + localFrame * target.orbSpeed;
              const px = target.name === "SUN" ? 0 : Math.cos(pAngle) * target.worldR;
              const py = target.name === "SUN" ? 0 : Math.sin(pAngle) * target.worldR;
              
              const p = Math.max(0, Math.min(1, easeInOutQuart(pza.progress)));
              
              camRef.current = {
                  x: pza.startCam.x + (-px - pza.startCam.x) * p,
                  y: pza.startCam.y + (-py - pza.startCam.y) * p,
                  scale: pza.startCam.scale + (pza.endScale - pza.startCam.scale) * p
              };
              setCam({ ...camRef.current });
          }
      } else if (pza.active && pza.direction === 'out') {
          const p = Math.max(0, Math.min(1, easeInOutQuart(pza.progress)));
          // Ease back out to deep space
          camRef.current = {
              x: pza.startCam.x + (0 - pza.startCam.x) * (1-p),
              y: pza.startCam.y + (0 - pza.startCam.y) * (1-p),
              scale: pza.startCam.scale + (0.15 - pza.startCam.scale) * (1-p)
          };
          setCam({ ...camRef.current });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, [solarSystemBodies]);

  const escapeFocus = () => {
     if (!activeWaypointRef.current) return;
     setActiveWaypoint(null);
     activeWaypointRef.current = null;
     pzaRef.current = {
        active: true, direction: 'out', progress: pzaRef.current.progress,
        startCam: { ...camRef.current }, endScale: 0.15
     };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (activeWaypoint) escapeFocus();
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? Math.min(camRef.current.scale * zoomFactor, 2.0) : Math.max(camRef.current.scale / zoomFactor, 0.01);
    camRef.current.scale = newScale;
    setCam({ ...camRef.current });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    if (activeWaypoint) escapeFocus();
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    camRef.current.x += dx / camRef.current.scale;
    camRef.current.y += dy / camRef.current.scale;
    setCam({ ...camRef.current });
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div 
      className="cursor-move select-none"
      style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#020508", width: "100%", height: "100%" }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* MAP HEADER / CLOSE */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', color: '#ff6666', border: '1px solid rgba(255,100,100,0.4)', 
              borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' 
            }}
            className="hover:bg-red-500 hover:text-white transition-colors"
          >
            CLOSE MAP [X]
          </button>
        )}
      </div>

      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`translate(${dim.w / 2 + cam.x * cam.scale}, ${dim.h / 2 + cam.y * cam.scale}) scale(${cam.scale})`}>
          
          {/* CENTER SHIP ORIGIN CROSSHAIR */}
          <g>
            <circle cx={0} cy={0} r={4 / cam.scale} fill="#00ffcc" />
            <line x1={-15 / cam.scale} y1={0} x2={15 / cam.scale} y2={0} stroke="#00ffcc" strokeWidth={1 / cam.scale} />
            <line x1={0} y1={-15 / cam.scale} x2={0} y2={15 / cam.scale} stroke="#00ffcc" strokeWidth={1 / cam.scale} />
          </g>

          {/* ACTIVE WAYPOINT TRAJECTORY LINE */}
          {activeWaypoint && solarSystemBodies.find((b: any) => b.name === activeWaypoint) && (() => {
             const target = solarSystemBodies.find((b: any) => b.name === activeWaypoint)!;
             const angle = target.baseAngle + frame * target.orbSpeed;
             const isSun = target.name === "SUN";
             const px = isSun ? 0 : Math.cos(angle) * target.worldR;
             const py = isSun ? 0 : Math.sin(angle) * target.worldR;
             return (
               <line 
                 x1={0} y1={0} 
                 x2={px} y2={py} 
                 stroke="#00ffcc" 
                 strokeWidth={8 / cam.scale} 
                 strokeDasharray={`${12 / cam.scale} ${6 / cam.scale}`} 
                 opacity={0.8}
               />
             );
          })()}
          
          {/* ORBITS */}
          {solarSystemBodies.map((b: any, i: number) => {
             // Sun does not need an orbit ring
             if (b.name === "SUN") return null;
             return (
               <circle 
                 key={`orbit-${i}`}
                 cx={0} 
                 cy={0} 
                 r={b.worldR} 
                 fill="none" 
                 stroke={b.color} 
                 strokeOpacity={0.15}
                 strokeWidth={2 / cam.scale} 
                 strokeDasharray="4 8"
               />
             )
          })}

          {/* PLANETS */}
          {solarSystemBodies.map((b: any, i: number) => {
            const angle = b.baseAngle + frame * b.orbSpeed;
            // The sun stays at 0,0
            const isSun = b.name === "SUN";
            const px = isSun ? 0 : Math.cos(angle) * b.worldR;
            const py = isSun ? 0 : Math.sin(angle) * b.worldR;

            return (
              <g key={`planet-${i}`} transform={`translate(${px}, ${py})`}>
                <circle 
                  cx={0} 
                  cy={0} 
                  r={b.r / cam.scale + (isSun ? 100 : 5)} 
                  fill={b.color}
                  stroke={b.color}
                  strokeOpacity={0.5}
                  strokeWidth={4 / cam.scale}
                  className="transition-all duration-200 hover:scale-150 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent drag/click from bubbling
                    setActiveWaypoint(b.name);
                    activeWaypointRef.current = b.name;
                    
                    // Start cinematic zoom tracking
                    const padding = b.name === 'SUN' ? 50 : 250;
                    const visualRadiusLevel = Math.max(b.r, 5) * 5;
                    const endScale = Math.max(0.2, Math.min(1.5, window.innerHeight / (visualRadiusLevel + padding)));

                    pzaRef.current = {
                       active: true, direction: 'in', progress: pzaRef.current.progress > 0 ? pzaRef.current.progress : 0,
                       startCam: { ...camRef.current }, endScale
                    };

                    if (onSelectPlanet) {
                      onSelectPlanet(b.name, px, py);
                    }
                  }}
                />
                <text 
                  x={(b.r / cam.scale) + 10} 
                  y={4} 
                  fill="#ffffff" 
                  fontSize={14 / cam.scale}
                  fontFamily="monospace"
                  opacity={0.8}
                  style={{ pointerEvents: 'none' }}
                >
                  {b.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
