import React, { useState, useEffect } from "react";

export const CATEGORY_BASE_COSTS: Record<string, { octave11: number, food: number }> = {
  "Headquarters": { octave11: 500, food: 0 },
  "Power Plant": { octave11: 50, food: 0 },
  "Hydroponics Farm": { octave11: 100, food: 0 },
  "Research Lab": { octave11: 200, food: 0 },
  "Barracks": { octave11: 300, food: 100 },
  "Recharge Station": { octave11: 150, food: 0 },
  "Marketplace": { octave11: 400, food: 0 },
  "Fuel Resonator": { octave11: 800, food: 0 },
  "Shield Generator": { octave11: 2500, food: 0 },
  "Stabilizer Node": { octave11: 5000, food: 0 },
  "Dyson Node": { octave11: 15000, food: 0 }
};

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
    case "Recharge Station":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="8" width="12" height="14" rx="2" fill="#10b981" />
          <path d="M9 8V4H15V8" stroke="#10b981" strokeWidth="2" />
          <path d="M12 12V18M10 15H14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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

export function BuildingDetailsWindow({
  building,
  allBuildings,
  planetColor,
  empireResources,
  hardCurrency,
  octaveCurrency,
  unlockedTechs,
  planetStorageUsed,
  planetStorageMax,
  onClose,
  onUpgrade,
  onDestroy,
  onSpeedUp,
  onOpenMarket,
  onOpenTechTree,
  onAlignStabilizer,
  onMaintainGrid,
  onAlignEmitters
}: {
  building: { id: string; category: string; tier: number; q: number; r: number; planetName: string; constructionEnd?: number };
  allBuildings: any[];
  planetColor: string;
  empireResources: { energy: number, food: number, science: number, population: number, efficiency?: number, powerEfficiency?: number, laborEfficiency?: number, netFood?: number, finalPopCap?: number };
  hardCurrency: number;
  octaveCurrency: Record<number, number>;
  unlockedTechs: string[];
  planetStorageUsed?: number;
  planetStorageMax?: number;
  onClose: () => void;
  onUpgrade: () => void;
  onDestroy: () => void;
  onSpeedUp?: () => void;
  onOpenMarket?: () => void;
  onOpenTechTree?: () => void;
  onAlignStabilizer?: () => void;
  onMaintainGrid?: () => void;
  onAlignEmitters?: () => void;
}) {
  const isHexNeighbor = (a: any, b: any) => {
    return a.planetName === b.planetName && Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(-a.q-a.r - (-b.q-b.r))) === 1;
  };
  const activeNeighbors = allBuildings.filter(b => isHexNeighbor(building, b));
  
  let activeSynergy = "None detected.";
  if (building.category === "Hydroponics Farm" && activeNeighbors.some(b => b.category === "Hydroponics Farm")) {
     activeSynergy = "Bio-Synergy Active (+1 Food/s)";
  } else if (building.category === "Research Lab" && activeNeighbors.some(b => b.category === "Power Plant")) {
     activeSynergy = "Power Link Active (+10% Science)";
  } else if (building.category === "Power Plant" && activeNeighbors.some(b => b.category === "Research Lab")) {
     activeSynergy = "Power Link Active (Feeding adjacent Lab)";
  }
  const isMaxLevel = building.tier >= 6;
  const baseCost = CATEGORY_BASE_COSTS[building.category] || { octave11: 100, food: 0 };
  
  let targetOctave = 11;
  let targetOctaveName = "Kuiper";
  let targetOctaveColor = "#a855f7";
  let targetOctaveIcon = "🟣";
  if (building.tier === 1 || building.tier === 2) { targetOctave = 12; targetOctaveName = "Oort"; targetOctaveColor = "#38bdf8"; targetOctaveIcon = "🔵"; }
  if (building.tier >= 3) { targetOctave = 13; targetOctaveName = "Interstellar"; targetOctaveColor = "#fbbf24"; targetOctaveIcon = "🟠"; }

  const upgradeCost = {
     currency: baseCost.octave11 * (building.tier + 1),
     food: baseCost.food * (building.tier + 1)
  };
  let canAffordUpgrade = (octaveCurrency[targetOctave] || 0) >= upgradeCost.currency && empireResources.food >= upgradeCost.food;
  const isTechLocked = building.tier >= 1 && !unlockedTechs.includes("Advanced Architecture");
  if (isTechLocked) canAffordUpgrade = false;

  const [, setTick] = useState(0);
  useEffect(() => {
     const v = setInterval(() => setTick(t=>t+1), 500);
     return () => clearInterval(v);
  }, []);

  const isBuilding = building.constructionEnd && Date.now() < building.constructionEnd;
  const remainingMs = isBuilding ? building.constructionEnd! - Date.now() : 0;
  const sec = Math.ceil(remainingMs / 1000);
  let timeStr = sec > 60 ? `${Math.floor(sec/60)}m ${sec%60}s` : `${sec}s`;
  if (sec > 3600) timeStr = `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`;
  
  // 1 Shard per 5 minutes of construction time, minimum 1
  const speedUpCost = Math.max(1, Math.ceil(sec / 300));

  return (
    <div
      style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "400px",
        background: "rgba(2, 8, 23, 0.95)",
        border: `2px solid ${planetColor}`,
        borderRadius: "12px",
        boxShadow: `0 0 30px ${planetColor}44`,
        zIndex: 100,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        fontFamily: "monospace"
      }}
    >
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${planetColor}66`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
           <div style={{ padding: "6px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", display: "flex", alignItems: "center" }}>
              <BuildingIcon category={building.category} size={32} />
           </div>
           <h2 style={{ fontSize: "20px", margin: 0, textTransform: "uppercase" }}>{building.category}</h2>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: planetColor, fontSize: "24px", cursor: "pointer", paddingLeft: "20px" }}>×</button>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "6px" }}>
          <span style={{ color: "#94a3b8" }}>Operational Status</span>
          {isBuilding ? (
             <span style={{ color: "#facc15", fontWeight: "bold", animation: "pulse 2s infinite" }}>IN PROGRESS: {timeStr}</span>
          ) : (
             <span style={{ color: "#4ade80", fontWeight: "bold" }}>ONLINE</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "6px" }}>
          <span style={{ color: "#94a3b8" }}>Current Level</span>
          <span style={{ fontWeight: "bold" }}>Tier {building.tier}</span>
        </div>

        {building.category === "Storage Silo" && planetStorageMax !== undefined && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "6px" }}>
             <div style={{ display: "flex", justifyContent: "space-between" }}>
               <span style={{ color: "#94a3b8" }}>Planetary Storage</span>
               <span style={{ fontWeight: "bold", color: "#38bdf8" }}>{planetStorageUsed?.toLocaleString() || 0} / {planetStorageMax.toLocaleString()}</span>
             </div>
             <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.5)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, ((planetStorageUsed || 0) / Math.max(1, planetStorageMax)) * 100)}%`, background: "#38bdf8" }} />
             </div>
          </div>
        )}

        {building.category === "Residential Quarters" && (() => {
           let popCapAdd = 0;
           const activePlanetBuildings = allBuildings.filter(b => b.planetName === building.planetName && (!b.constructionEnd || Date.now() >= b.constructionEnd));
           for (const b of activePlanetBuildings) {
               if (b.category === "Headquarters") popCapAdd += 10 * b.tier;
               if (b.category === "Residential Quarters") popCapAdd += 100 * b.tier;
           }
           const finalPopCap = Math.max(10, 10 + popCapAdd);
           const currentPop = empireResources.population || 0;
           
           return (
             <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "6px", border: "1px solid rgba(96, 165, 250, 0.3)" }}>
               <div style={{ display: "flex", justifyContent: "space-between" }}>
                 <span style={{ color: "#94a3b8" }}>Planetary Population</span>
                 <span style={{ fontWeight: "bold", color: "#60a5fa" }}>{currentPop.toLocaleString()} / {finalPopCap.toLocaleString()}</span>
               </div>
               <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.5)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (currentPop / Math.max(1, finalPopCap)) * 100)}%`, background: "#60a5fa" }} />
               </div>
               <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "4px" }}>
                 (This Unit: +{100 * building.tier} Cap)
               </div>
             </div>
           );
        })()}

        {(empireResources.powerEfficiency ?? 1.0) < 1.0 && building.category !== "Power Plant" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(234, 179, 8, 0.15)", border: "1px solid #eab308", padding: "12px", borderRadius: "6px" }}>
            <span style={{ fontWeight: "bold", color: "#eab308", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#eab308"/>
              </svg>
              GRID FAILURE
            </span>
            <span style={{ color: "#fff", fontSize: "0.9rem" }}>Not enough electrical power to sustain base operations. <strong style={{color:"#facc15"}}>Build another Power Plant</strong> immediately to restore efficiency!</span>
          </div>
        )}

        {(empireResources.laborEfficiency ?? 1.0) < 1.0 && building.category !== "Residential Quarters" && building.category !== "Hydroponics Farm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(168, 85, 247, 0.15)", border: "1px solid #a855f7", padding: "12px", borderRadius: "6px" }}>
            <span style={{ fontWeight: "bold", color: "#c084fc", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="7" r="4" fill="#c084fc"/>
                <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              LABOR SHORTAGE
            </span>
            <span style={{ color: "#fff", fontSize: "0.9rem" }}>Severe labor shortage! Civilians are overworked. <strong style={{color:"#d8b4fe"}}>Expand Population Base</strong> (build Housing/Farms) to restore efficiency!</span>
          </div>
        )}

        {/* Phase 8: Economic Warning Cascades */}
        {(empireResources.netFood ?? 0) <= 0 && (empireResources.population || 0) < (empireResources.finalPopCap || 10) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", padding: "12px", borderRadius: "6px" }}>
            <span style={{ fontWeight: "bold", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="none"/>
                <path d="M12 6v6l4 2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              GROWTH HALTED
            </span>
            <span style={{ color: "#fff", fontSize: "0.9rem" }}>Civilian food consumption exceeds active farm production. <strong style={{color:"#fca5a5"}}>Build Hydroponics Farms</strong> to restore a live Surplus!</span>
          </div>
        )}

        {(empireResources.population || 0) >= (empireResources.finalPopCap || 10) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(14, 165, 233, 0.15)", border: "1px solid #0ea5e9", padding: "12px", borderRadius: "6px" }}>
            <span style={{ fontWeight: "bold", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0ea5e9"/>
              </svg>
              CAPACITY REACHED
            </span>
            <span style={{ color: "#fff", fontSize: "0.9rem" }}>Your planetary population cannot expand further. <strong style={{color:"#7dd3fc"}}>Build Residential Quarters</strong> to increase global housing!</span>
          </div>
        )}

        {!isBuilding && (
            <div style={{ display: "flex", justifyContent: "space-between", background: activeSynergy !== "None detected." ? "rgba(74, 222, 128, 0.1)" : "rgba(255,255,255,0.05)", border: activeSynergy !== "None detected." ? "1px solid #4ade80" : "none", padding: "12px", borderRadius: "6px" }}>
              <span style={{ color: activeSynergy !== "None detected." ? "#4ade80" : "#94a3b8" }}>Active Synergy</span>
              <span style={{ fontWeight: "bold", color: activeSynergy !== "None detected." ? "#4ade80" : "#fff", fontSize: "12px", textAlign: "right", maxWidth: "160px" }}>{activeSynergy}</span>
            </div>
        )}

        {isTechLocked && !isMaxLevel && !isBuilding && (
          <div style={{ marginTop: "4px", color: "#ef4444", fontSize: "11px", fontWeight: "bold", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px", textAlign: "left", lineHeight: "1.4" }}>
             <strong>Missing Technology:</strong><br/>
             Requires Adv. Architecture.<br/>
             <em>Unlock via Research Databank (⚛️ top HUD).</em>
          </div>
        )}

        {!canAffordUpgrade && !isTechLocked && !isMaxLevel && !isBuilding && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px", textAlign: "left" }}>
            <strong>Missing Requirements:</strong>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", lineHeight: "1.4" }}>
              {(octaveCurrency[targetOctave] || 0) < upgradeCost.currency && <li><strong><span style={{color: targetOctaveColor}}>{targetOctaveIcon}</span> {targetOctaveName} Materials:</strong> Mine Asteroids in Octave {targetOctave}.</li>}
              {empireResources.food < upgradeCost.food && <li><strong>🌾 Food:</strong> Build Hydroponics Farms.</li>}
            </ul>
          </div>
        )}
        
        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          {!isBuilding && (
            <div style={{ display: "flex", flex: 1, gap: "8px" }}>
              <button
                onClick={onDestroy}
                style={{
                  flex: 1,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  padding: "12px",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                DESTROY
              </button>
              
              {building.category === "Research Lab" && onOpenTechTree && (
                <button
                  onClick={onOpenTechTree}
                  style={{
                    flex: 2,
                    background: "rgba(139, 92, 246, 0.15)",
                    border: "1px solid #8b5cf6",
                    color: "#a78bfa",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ACCESS CORE DATABANK
                </button>
              )}
              
              {building.category === "Marketplace" && onOpenMarket && (
                <button
                  onClick={onOpenMarket}
                  style={{
                    flex: 2,
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid #f59e0b",
                    color: "#f59e0b",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ENTER MARKET
                </button>
              )}
              {building.category === "Stabilizer Node" && onAlignStabilizer && (
                <button
                  onClick={onAlignStabilizer}
                  style={{
                    flex: 2,
                    background: "rgba(217, 70, 239, 0.15)",
                    border: "1px solid #d946ef",
                    color: "#d946ef",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ALIGN FREQUENCY
                </button>
              )}
              {building.category === "Headquarters" && onMaintainGrid && (
                <button
                  onClick={onMaintainGrid}
                  style={{
                    flex: 2,
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid #38bdf8",
                    color: "#38bdf8",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  MAINTAIN GRID
                </button>
              )}
              {building.category === "Dyson Node" && onAlignEmitters && (
                <button
                  onClick={onAlignEmitters}
                  style={{
                    flex: 2,
                    background: "rgba(234, 179, 8, 0.15)",
                    border: "1px solid #eab308",
                    color: "#eab308",
                    padding: "12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ALIGN EMITTERS
                </button>
              )}
            </div>
          )}

          {isBuilding ? (
             <button
                onClick={onSpeedUp}
                disabled={hardCurrency < speedUpCost}
                style={{
                  flex: 2,
                  background: hardCurrency >= speedUpCost ? "rgba(168, 85, 247, 0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${hardCurrency >= speedUpCost ? "#a855f7" : "#334155"}`,
                  color: hardCurrency >= speedUpCost ? "#e879f9" : "#94a3b8",
                  padding: "12px",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  cursor: hardCurrency >= speedUpCost ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
             >
                <span>SPEED UP</span>
                <span style={{ fontSize: "11px", marginTop: "4px", color: hardCurrency >= speedUpCost ? "#d8b4fe" : "#ef4444" }}>
                   Cost: 💎 {speedUpCost} Shard{speedUpCost !== 1 ? "s" : ""}
                </span>
             </button>
          ) : (
              <button
                onClick={onUpgrade}
                disabled={isMaxLevel || !canAffordUpgrade}
                style={{
                  flex: 1,
                  background: (isMaxLevel || !canAffordUpgrade) ? "rgba(255,255,255,0.05)" : `${planetColor}33`,
                  border: `1px solid ${(isMaxLevel || !canAffordUpgrade) ? "#334155" : planetColor}`,
                  color: (isMaxLevel || !canAffordUpgrade) ? "#94a3b8" : "#fff",
                  padding: "12px",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  cursor: (isMaxLevel || !canAffordUpgrade) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <span>{isMaxLevel ? "MAX LEVEL" : (isTechLocked ? "TECH LOCKED" : "UPGRADE")}</span>
                {!isMaxLevel && (
                   <span style={{ fontSize: "11px", color: canAffordUpgrade ? "#4ade80" : "#ef4444", marginTop: "4px" }}>
                     {isTechLocked ? "Requires Adv. Architecture" : `Cost: ${upgradeCost.currency > 0 ? `${targetOctaveIcon} ${upgradeCost.currency} (${targetOctaveName}) ` : ""}${upgradeCost.food > 0 ? `🌾 ${upgradeCost.food}` : ""}`}
                   </span>
                )}
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
