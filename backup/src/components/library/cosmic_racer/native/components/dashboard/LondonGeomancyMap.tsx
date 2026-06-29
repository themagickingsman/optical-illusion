"use client";

import React, { useMemo } from "react";

// --- COORDINATE SYSTEM ---
const BOUNDS = {
  minLat: 51.4700,
  maxLat: 51.5250,
  minLon: -0.1600,
  maxLon: 0.0200,
};

const LANDMARKS = [
  { id: "eye", name: "London Eye (CPU)", lat: 51.5033, lon: -0.1195, type: "cpu" },
  { id: "greenwich", name: "Greenwich (Input)", lat: 51.4769, lon: -0.0005, type: "input" },
  { id: "canary", name: "Canary Wharf (Output)", lat: 51.5048, lon: -0.0202, type: "output" },
  { id: "o2", name: "The O2 (Receiver)", lat: 51.5030, lon: 0.0031, type: "receiver" },
  { id: "centrepoint", name: "Centre Point (33)", lat: 51.5164, lon: -0.1302, type: "node" },
  { id: "gherkin", name: "The Gherkin (66)", lat: 51.5145, lon: -0.0803, type: "node" },
  { id: "stone", name: "London Stone", lat: 51.5113, lon: -0.0898, type: "node" },
];

// Simplified Thames Path Points (approximate logic for visual representation)
const THAMES_POINTS = [
  { lat: 51.485, lon: -0.1600 }, // West enter
  { lat: 51.495, lon: -0.1350 }, // Millbank
  { lat: 51.503, lon: -0.1195 }, // Eye (The Bend)
  { lat: 51.510, lon: -0.1100 }, // Waterloo Bridge
  { lat: 51.508, lon: -0.0900 }, // Blackfriars
  { lat: 51.505, lon: -0.0600 }, // Wapping
  { lat: 51.500, lon: -0.0400 }, // Rotherhithe curve
  { lat: 51.490, lon: -0.0200 }, // Bottom of Isle of Dogs
  { lat: 51.505, lon: -0.0050 }, // Up to Greenwich/O2 visual area
  { lat: 51.503, lon: 0.0031 },  // Past O2
  { lat: 51.495, lon: 0.0200 },  // East exit
];

export const LondonGeomancyMap = () => {
  // Normalize Coordinates to SVG % (0-100)
  const getPos = (lat: number, lon: number) => {
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
    const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * 100;
    return { x, y };
  };

  const eyePos = getPos(51.5033, -0.1195);
  const stonePos = getPos(51.5113, -0.0898);
  const gherkinPos = getPos(51.5145, -0.0803);
  const centrePos = getPos(51.5164, -0.1302);
  const greenwichPos = getPos(51.4769, -0.0005);
  const canaryPos = getPos(51.5048, -0.0202);
  const o2Pos = getPos(51.5030, 0.0031);

  // Generate River Path string
  const riverPath = useMemo(() => {
    let d = "";
    THAMES_POINTS.forEach((p, i) => {
      const pos = getPos(p.lat, p.lon);
      if (i === 0) d += `M ${pos.x} ${pos.y}`;
      else {
        // Simple smoothing could be added, but straight lines for now or basic curve
        // For a smoother look in SVG, we'd need bezier controls.
        // Let's us basic Line To for the "Circuit" aesthetic
        d += ` L ${pos.x} ${pos.y}`;
      }
    });
    return d;
  }, []);

  return (
    <div className="w-full h-[600px] bg-[#1a1a1a] rounded-lg border border-white/10 relative overflow-hidden flex">
      {/* LEFT WIDGET: EYE CAROUSEL */}
      <div className="w-1/4 h-full border-r border-white/10 bg-black/20 backdrop-blur-sm p-4 flex flex-col items-center justify-center">
        <h3 className="text-violet-400 font-mono text-sm mb-4 tracking-widest">SYSTEM_CPU</h3>
        <div className="relative w-48 h-48">
             <div 
                className="w-full h-full rounded-full border-2 border-dashed border-violet-500/30 animate-[spin_60s_linear_infinite]"
             >
                {/* 32 Pods */}
                {Array.from({ length: 32 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-1 h-3 bg-violet-400/50 left-[calc(50%-2px)] top-0 origin-[50%_96px]"
                        style={{ transform: `rotate(${i * (360/32)}deg)` }}
                    />
                ))}
             </div>
             <div className="absolute inset-0 flex items-center justify-center text-violet-200 font-bold font-mono text-2xl">
                EYE
             </div>
        </div>
        <div className="mt-8 space-y-2 text-xs font-mono text-white/50">
            <div className="flex justify-between w-full"><span>STATUS:</span> <span className="text-green-400">ONLINE</span></div>
            <div className="flex justify-between w-full"><span>FREQ:</span> <span>30 MIN</span></div>
            <div className="flex justify-between w-full"><span>LAT:</span> <span>51.5033°N</span></div>
        </div>
      </div>

      {/* RIGHT: MAP AREA */}
      <div className="flex-1 relative bg-[#111]">
        {/* GRID LINES */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
             {/* RIVER THAMES */}
             <path d={riverPath} fill="none" stroke="#00d8ff" strokeWidth="2" strokeOpacity="0.6" />

             {/* LEYLINES */}
             {/* 66 Degree Vector: Eye -> Stone -> Gherkin */}
             <path d={`M ${eyePos.x} ${eyePos.y} L ${stonePos.x} ${stonePos.y} L ${gherkinPos.x} ${gherkinPos.y}`} 
                   stroke="#a855f7" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
             
             {/* 33 Degree Vector: Eye -> Centre Point (333 deg) */}
             <path d={`M ${eyePos.x} ${eyePos.y} L ${centrePos.x} ${centrePos.y}`} 
                   stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />

             {/* 2040 Golden Conjunction Target Vector (258 deg Azimuth) */}
             {/* Approximate vector line pointing West-South-West from Eye */}
             <path d={`M ${eyePos.x} ${eyePos.y} L 0 ${eyePos.y + ((eyePos.y - stonePos.y)*0.3)}`} 
                   stroke="#ef4444" strokeWidth="1.5" strokeDasharray="8 4" opacity="0.8" />

             {/* I/O Bus: Eye -> Greenwich */}
             <path d={`M ${eyePos.x} ${eyePos.y} L ${greenwichPos.x} ${greenwichPos.y}`} 
                   stroke="#a855f7" strokeWidth="1" opacity="0.4" />
             
             {/* Output Bus: Eye -> Canary */}
              <path d={`M ${eyePos.x} ${eyePos.y} L ${canaryPos.x} ${canaryPos.y}`} 
                   stroke="#a855f7" strokeWidth="1" opacity="0.4" />
        </svg>

        {/* DEFINING VECTORS */}
        <div className="absolute text-[10px] text-[#a855f7] font-mono font-bold bg-black/50 px-1 rounded" style={{ left: `${(eyePos.x + gherkinPos.x)/2}%`, top: `${(eyePos.y + gherkinPos.y)/2}%` }}>~66° MEROITIC JUPITER VECTOR</div>
        <div className="absolute text-[10px] text-[#fbbf24] font-mono font-bold bg-black/50 px-1 rounded" style={{ left: `${(eyePos.x + centrePos.x)/2}%`, top: `${(eyePos.y + centrePos.y)/2}%` }}>333° NODE 33 VECTOR</div>
        <div className="absolute text-[10px] text-[#ef4444] font-mono font-bold bg-black/50 px-1 rounded" style={{ left: '10%', top: `${eyePos.y + ((eyePos.y - stonePos.y)*0.1)}%` }}>258° (2040 GOLDEN CONJUNCTION)</div>

        {/* LANDMARKS */}
        {LANDMARKS.map((l) => {
            const pos = getPos(l.lat, l.lon);
            return (
                <div key={l.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group hover:z-50 cursor-pointer" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                    <div className={`w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] ${l.type === 'cpu' ? 'bg-violet-400 shadow-violet-500 scale-150' : ''}`} />
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/80 px-2 py-1 rounded border border-white/20 text-[10px] text-white whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
                        {l.name}
                    </div>
                </div>
            );
        })}
        
        {/* LABELS FOR ANGLES */}
        <div className="absolute text-[10px] text-white/50 font-mono" style={{ left: `${(eyePos.x + gherkinPos.x)/2}%`, top: `${(eyePos.y + gherkinPos.y)/2}%` }}>66° VECTOR</div>
        <div className="absolute text-[10px] text-white/50 font-mono" style={{ left: `${(eyePos.x + centrePos.x)/2}%`, top: `${(eyePos.y + centrePos.y)/2}%` }}>333° VECTOR</div>

      </div>

      {/* TEXT OVERLAY PANEL */}
      <div className="absolute bottom-4 right-4 w-[450px] bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-lg text-[10px] font-mono text-white/80 overflow-y-auto max-h-[300px] shadow-2xl z-50">
        <h4 className="text-violet-400 font-bold mb-2">GEOMANTIC ALIGNMENT PROTOCOL</h4>
        <div className="space-y-3">
          <p>
            <strong className="text-white">THE 2040 CONJUNCTION VECTOR:</strong> 
            <br/>Calculations for the September 8, 2040 Golden Conjunction (Mercury, Venus, Mars, Jupiter, Saturn, Moon) from the London Eye (51.5033 N, -0.1195 E) place the cluster at <strong className="text-red-400">~258° Azimuth</strong> setting at -3.2° altitude.
          </p>
          <p>
            <strong className="text-white">THE "33" NETWORK:</strong>
            <br/>Drawing a vector at exactly 258° from the Eye points directly across Westminster through the "33 Network" (e.g., 33 Grosvenor Place sits exactly at 256.95° Azimuth). It is a direct geometric line from the "CPU" straight into the 2040 planetary trigger event.
          </p>
          <p>
            <strong className="text-white">THE "66" NETWORK:</strong>
            <br/>The "66" Nodes map identically to the Meroitic Jupiter Base Angle (64.4°).
            <br/>- The Gherkin (66): 65.33° Azimuth
            <br/>- London Stone: 66.59° Azimuth
          </p>
          <p className="text-green-400 italic">
            CONCLUSION: The mathematical margin of error is near zero. Node designations refer to the physical, terrestrial degrees at which they sit relative to the central "CPU" (the Eye) to lock into those specific planetary frequencies. The architecture acts as a massive terrestrial receiver.
          </p>
        </div>
      </div>
    </div>
  );
};
