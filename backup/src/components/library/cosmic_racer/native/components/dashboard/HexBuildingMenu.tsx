import React from "react";

const BuildingIcon = ({ category, size = 48 }: { category: string, size?: number }) => {
  switch (category) {
    case "Headquarters":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L6 12H18L12 2Z" fill="#38bdf8" />
          <path d="M7 12V22H17V12H7Z" fill="#94a3b8" />
          <circle cx="12" cy="16" r="2" fill="#38bdf8" />
        </svg>
      );
    case "Hydroponics Farm":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="14" r="7" fill="rgba(74, 222, 128, 0.4)" stroke="#4ade80" strokeWidth="1" />
          <circle cx="6" cy="18" r="4" fill="rgba(74, 222, 128, 0.6)" stroke="#4ade80" strokeWidth="1" />
          <circle cx="18" cy="18" r="4" fill="rgba(74, 222, 128, 0.6)" stroke="#4ade80" strokeWidth="1" />
        </svg>
      );
    case "Power Plant":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#334155" />
          <circle cx="12" cy="12" r="6" fill="#ef4444" />
          <circle cx="12" cy="12" r="3" fill="#facc15" />
        </svg>
      );
    case "Research Lab":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 14C4 9.58172 7.58172 6 12 6C16.4183 6 20 9.58172 20 14" fill="#1e40af" />
          <rect x="3" y="14" width="18" height="6" rx="1" fill="#3b82f6" />
          <circle cx="12" cy="10" r="2.5" fill="#60a5fa" />
        </svg>
      );
    case "Barracks":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 20L5 10H19L22 20H2Z" fill="#475569" />
          <rect x="10" y="14" width="4" height="6" fill="#ef4444" />
        </svg>
      );
    case "Residential Quarters":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="12" height="14" fill="#a78bfa" />
          <rect x="8" y="10" width="2" height="2" fill="#fff" />
          <rect x="14" y="10" width="2" height="2" fill="#fff" />
          <rect x="8" y="14" width="2" height="2" fill="#fff" />
          <rect x="14" y="14" width="2" height="2" fill="#fff" />
          <path d="M12 2L4 8H20L12 2Z" fill="#8b5cf6" />
        </svg>
      );
    case "Fuel Resonator":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,2 20,10 12,22 4,10" fill="rgba(192, 132, 252, 0.4)" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" fill="#c084fc" />
          <circle cx="12" cy="12" r="8" stroke="#e879f9" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        </svg>
      );
    case "Storage Silo":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="#475569" strokeWidth="2" fill="rgba(71,85,105,0.3)"/>
          <path d="M4 10H20 M4 15H20" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      );
    case "Docking Station":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" fill="rgba(59, 130, 246, 0.1)"/>
          <path d="M12 4V8 M12 16V20 M4 12H8 M16 12H20" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="3" fill="#3b82f6"/>
        </svg>
      );
    case "Marketplace":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20L18 14H6L4 6Z" fill="rgba(245, 158, 11, 0.4)" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="9" cy="18" r="2" fill="#f59e0b" />
          <circle cx="15" cy="18" r="2" fill="#f59e0b" />
          <path d="M2 3L4 6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "Shield Generator":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" fill="#06b6d4"/>
        </svg>
      );
    case "Stabilizer Node":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="#d946ef" strokeWidth="2" strokeDasharray="3 3"/>
          <circle cx="12" cy="12" r="4" fill="rgba(217, 70, 239, 0.4)" stroke="#d946ef" strokeWidth="1"/>
          <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#d946ef" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "Dyson Node":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,2 20.66,7 20.66,17 12,22 3.34,17 3.34,7" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" strokeWidth="2"/>
          <circle cx="12" cy="12" r="5" fill="#eab308"/>
          <circle cx="12" cy="12" r="8" stroke="#eab308" strokeWidth="1" strokeDasharray="2 4"/>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#475569" />
        </svg>
      );
  }
};

const CATEGORIES = [
  { name: "Headquarters", cost: { octave11: 2100, food: 0 }, desc: "Provides +25 Starting Colonists. Minimum Workers: 5. Provides Base Population Cap (+10). Drains -30 ⚡/s", synergy: "" },
  { name: "Power Plant", cost: { octave11: 500, food: 0 }, desc: "Minimum Workers: 10. Generates +50 ⚡/s", synergy: "" },
  { name: "Hydroponics Farm", cost: { octave11: 800, food: 0 }, desc: "Minimum Workers: 10. Produces +5 🌾/s. Drains -10 ⚡/s", synergy: "Adjacent Farms create +1 🌾/s Hubs." },
  { name: "Research Lab", cost: { octave11: 1300, food: 0 }, desc: "Minimum Workers: 20. Produces +5 ⚛️/s. Drains -20 ⚡/s", synergy: "Draws +10% ⚛️ from adjacent Power Plants." },
  { name: "Residential Quarters", cost: { octave11: 800, food: 100 }, desc: "Houses civilian population. Provides Population Cap (+100). Drains -5 ⚡/s", synergy: "" },
  { name: "Barracks", cost: { octave11: 5500, food: 890 }, desc: "Minimum Workers: 20. Trains Planetary Defense Troops. Drains -10 ⚡/s", synergy: "" },
  { name: "Recharge Station", cost: { octave11: 8900, food: 0 }, desc: "Minimum Workers: 15. Orbital refueling matrix. Drains -20 ⚡/s.", synergy: "Automatically refills ship fuel while in orbit." },
  { name: "Storage Silo", cost: { octave11: 2100, food: 0 }, desc: "Minimum Workers: 5. Expands planetary cargo capacity by +15,000 slots. Drains -5 ⚡/s.", synergy: "Essential for housing dust offloads from bulk freighters." },
  { name: "Docking Station", cost: { octave11: 8900, food: 0 }, desc: "Minimum Workers: 25. Permits physical Ship Hangar Swapping on this planet. Drains -40 ⚡/s.", synergy: "Transforms a standard colonial outpost into a Fleet Hub." },
  { name: "Marketplace", cost: { octave11: 3400, food: 0 }, desc: "Minimum Workers: 10. Global Trading Hub for exchanging materials and modules. Drains -15 ⚡/s.", synergy: "Opens access to the Interplanetary Market." },
  { name: "Fuel Resonator", cost: { octave11: 14400, food: 0 }, desc: "Minimum Workers: 50. Projects structural integrity, doubling global Ship Fuel Range. Drains -50 ⚡/s.", synergy: "Essential deep-space infrastructure required to reach Pluto." },
  { name: "Shield Generator", cost: { octave11: 23300, food: 0 }, desc: "Minimum Workers: 100. Projects a planetary defense grid. Drains -100 ⚡/s.", synergy: "Required for HQ Stabilization." },
  { name: "Stabilizer Node", cost: { octave11: 37700, food: 0 }, desc: "Minimum Workers: 200. Anchors the planetary shield to the sub-atomic realm. Drains -250 ⚡/s.", synergy: "Enables frequency alignment." },
  { name: "Dyson Node", cost: { octave11: 61000, food: 0 }, desc: "Minimum Workers: 500. Massive stellar energy lattice frame. Drains -1000 ⚡/s.", synergy: "Harnesses raw microwave emitters." }
];

export function HexBuildingMenu({
  planetColor,
  empireResources,
  octaveCurrency,
  unlockedTechs,
  hasHeadquarters,
  onClose,
  onBuild,
}: {
  planetColor: string;
  empireResources: { energy: number, food: number, science: number, population: number, efficiency: number, troops?: number, growthBuffer?: number },
  octaveCurrency: Record<number, number>;
  unlockedTechs: string[];
  hasHeadquarters: boolean;
  onClose: () => void;
  onBuild: (category: string, tier: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "900px",
        maxHeight: "80%",
        height: "80%",
        background: "rgba(2, 8, 23, 0.95)",
        border: `2px solid ${planetColor}`,
        borderRadius: "12px",
        boxShadow: `0 0 30px ${planetColor}44`,
        zIndex: 100,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        fontFamily: "monospace",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${planetColor}66`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "24px", margin: 0, textTransform: "uppercase", letterSpacing: "2px" }}>Sector Construction</h2>
        <div style={{ display: "flex", gap: "16px", fontSize: "16px", color: "#4ade80" }}>
           <span>⚡ {Math.floor(empireResources.energy)}</span>
           <span style={{ color: "#facc15" }}>🌾 {Math.floor(empireResources.food)}</span>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: planetColor, fontSize: "24px", cursor: "pointer" }}>×</button>
      </div>

      <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", alignContent: "start" }}>
        {CATEGORIES.map(cat => {
          let canAfford = (octaveCurrency[11] || 0) >= cat.cost.octave11 && empireResources.food >= cat.cost.food;
          const isTechLocked = cat.name === "Barracks" && !unlockedTechs.includes("Military Garrison");
          const isHqLocked = !hasHeadquarters && cat.name !== "Headquarters" && cat.name !== "Residential Quarters";
          if (isTechLocked || isHqLocked) canAfford = false;
          
          let isSuggested = false;
          if (empireResources.efficiency < 1.0 && cat.name === "Power Plant") isSuggested = true;
          if (empireResources.food <= 0 && cat.name === "Hydroponics Farm") isSuggested = true;
          
          return (
             <div
               key={cat.name}
               onClick={() => canAfford && onBuild(cat.name, 1)}
               style={{
                 position: "relative",
                 background: canAfford ? `${planetColor}15` : "rgba(255,255,255,0.02)",
                 border: `1px solid ${canAfford ? planetColor : "#334155"}`,
                 borderRadius: "12px",
                 padding: "16px",
                 cursor: canAfford ? "pointer" : "not-allowed",
                 opacity: canAfford ? 1 : 0.6,
                 display: "flex",
                 flexDirection: "column",
                 gap: "8px",
                 transition: "transform 0.2s, box-shadow 0.2s"
               }}
               onMouseEnter={e => {
                  if (canAfford) {
                     e.currentTarget.style.transform = "scale(1.02)";
                     e.currentTarget.style.boxShadow = `0 8px 24px ${planetColor}44`;
                  }
               }}
               onMouseLeave={e => {
                  if (canAfford) {
                     e.currentTarget.style.transform = "scale(1)";
                     e.currentTarget.style.boxShadow = "none";
                  }
               }}
             >
               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: `1px solid ${planetColor}44`, position: "relative" }}>
                     <BuildingIcon category={cat.name} size={42} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: canAfford ? "#fff" : "#94a3b8", textAlign: "center", lineHeight: "1.2" }}>
                      {cat.name}
                  </h3>
                  {isSuggested && (
                     <div style={{
                         position: "absolute", top: "-10px", right: "-10px",
                         background: "#ef4444", color: "#fff",
                         padding: "4px 8px", borderRadius: "8px",
                         fontSize: "10px", fontWeight: "bold",
                         boxShadow: "0 0 10px #ef4444",
                         animation: "bouncePip 1s infinite"
                     }}>
                         SUGGESTED
                         <style>{`@keyframes bouncePip { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>
                     </div>
                  )}
               </div>
               <div style={{ fontSize: "12px", color: canAfford ? "#cbd5e1" : "#64748b", flex: 1, lineHeight: "1.4", textAlign: "center", marginTop: "8px" }}>
                  {cat.desc}
                  
                  {isTechLocked && (
                    <div style={{ marginTop: "12px", color: "#ef4444", fontSize: "11px", fontWeight: "bold", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px", textAlign: "left", lineHeight: "1.4" }}>
                       <strong>Missing Technology:</strong><br/>
                       Requires Military Garrison.<br/>
                       <em>Unlock via Research Databank (⚛️ top HUD).</em>
                    </div>
                  )}

                  {isHqLocked && (
                    <div style={{ marginTop: "12px", color: "#f87171", fontSize: "11px", fontWeight: "bold", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px", textAlign: "left", lineHeight: "1.4" }}>
                       <strong>Missing Prerequisites:</strong><br/>
                       Colony requires a planetary Headquarters to begin localized infrastructure development.
                    </div>
                  )}

                  {!canAfford && !isTechLocked && !isHqLocked && (
                    <div style={{ marginTop: "12px", fontSize: "11px", color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px", textAlign: "left" }}>
                      <strong>Missing Requirements:</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", lineHeight: "1.4" }}>
                        {(octaveCurrency[11] || 0) < cat.cost.octave11 && <li><strong><span style={{color: "#a855f7"}}>🟣</span> Kuiper Materials:</strong> Mine purple Asteroids in Octave 11.</li>}
                        {empireResources.food < cat.cost.food && <li><strong>🌾 Food:</strong> Build planetary Hydroponics Farms to increase agricultural output.</li>}
                      </ul>
                    </div>
                  )}

                  {cat.synergy && !isTechLocked && !isHqLocked && <div style={{ marginTop: "8px", color: "#4ade80", fontSize: "11px", fontStyle: "italic", background: "rgba(74, 222, 128, 0.1)", padding: "4px", borderRadius: "4px" }}>Synergy: {cat.synergy}</div>}
               </div>
               <div style={{ display: "flex", justifyContent: "center", gap: "12px", borderTop: `1px dashed ${planetColor}44`, paddingTop: "12px", marginTop: "auto" }}>
                  {cat.cost.octave11 > 0 && (
                     <div style={{ fontSize: "14px", fontWeight: "bold", color: (octaveCurrency[11] || 0) >= cat.cost.octave11 ? "#a855f7" : "#ef4444" }}>
                       🟣 {cat.cost.octave11} Kuiper
                     </div>
                  )}
                  {cat.cost.food > 0 && (
                     <div style={{ fontSize: "14px", fontWeight: "bold", color: empireResources.food >= cat.cost.food ? "#facc15" : "#ef4444" }}>
                       🌾 {cat.cost.food}
                     </div>
                  )}
               </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
