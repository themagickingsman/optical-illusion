import React from 'react';

const TECH_NODES = [
  { id: "Advanced Architecture", cost: 100, desc: "Unlocks the ability to upgrade structures past Tier 1. Essential for deep colony development.", icon: "🏗️" },
  { id: "Military Garrison", cost: 250, desc: "Unlocks the Barracks structure to train planetary defense troops.", icon: "🛡️" },
  { id: "Engine Optimization", cost: 500, desc: "Upgrades ship thruster efficiency. Reduces global thrust fuel consumption by 15%.", icon: "🚀" }
];

export function TechTreeMenu({
  empireResources,
  setEmpireResources,
  unlockedTechs,
  setUnlockedTechs,
  onClose
}: {
  empireResources: { energy: number; food: number; science: number; population: number };
  setEmpireResources: (r: any) => void;
  unlockedTechs: string[];
  setUnlockedTechs: (t: string[]) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "800px",
        maxHeight: "80%",
        height: "80%",
        background: "rgba(2, 8, 23, 0.95)",
        border: "2px solid #38bdf8",
        borderRadius: "12px",
        boxShadow: "0 0 30px rgba(56, 189, 248, 0.2)",
        zIndex: 100,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        fontFamily: "monospace",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(56, 189, 248, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "24px", margin: 0, textTransform: "uppercase", letterSpacing: "2px", color: "#38bdf8" }}>
          Research Databank
        </h2>
        <div style={{ display: "flex", gap: "16px", fontSize: "16px", color: "#38bdf8", fontWeight: "bold" }}>
           <span>⚛️ {Math.floor(empireResources.science)} Available Science</span>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "24px", cursor: "pointer" }}>×</button>
      </div>

      <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", alignContent: "start" }}>
        {TECH_NODES.map(node => {
          const isUnlocked = unlockedTechs.includes(node.id);
          const canAfford = !isUnlocked && empireResources.science >= node.cost;
          
          return (
             <div
               key={node.id}
               onClick={() => {
                 if (canAfford) {
                   setEmpireResources({ ...empireResources, science: empireResources.science - node.cost });
                   setUnlockedTechs([...unlockedTechs, node.id]);
                 }
               }}
               style={{
                 background: isUnlocked ? "rgba(56, 189, 248, 0.15)" : (canAfford ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.4)"),
                 border: `1px solid ${isUnlocked ? "#38bdf8" : (canAfford ? "#94a3b8" : "#334155")}`,
                 borderRadius: "12px",
                 padding: "20px",
                 cursor: isUnlocked ? "default" : (canAfford ? "pointer" : "not-allowed"),
                 opacity: isUnlocked ? 1 : (canAfford ? 1 : 0.5),
                 display: "flex",
                 flexDirection: "column",
                 gap: "12px",
                 transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                 position: "relative",
                 overflow: "hidden"
               }}
               onMouseEnter={e => {
                  if (canAfford && !isUnlocked) {
                     e.currentTarget.style.transform = "scale(1.02)";
                     e.currentTarget.style.boxShadow = "0 8px 24px rgba(56, 189, 248, 0.2)";
                     e.currentTarget.style.borderColor = "#38bdf8";
                  }
               }}
               onMouseLeave={e => {
                  if (canAfford && !isUnlocked) {
                     e.currentTarget.style.transform = "scale(1)";
                     e.currentTarget.style.boxShadow = "none";
                     e.currentTarget.style.borderColor = "#94a3b8";
                  }
               }}
             >
               {isUnlocked && (
                 <div style={{ position: "absolute", top: "10px", right: "10px", color: "#38bdf8", fontSize: "14px", fontWeight: "bold" }}>
                   ✓ ACQUIRED
                 </div>
               )}
               <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>
                 {node.icon}
               </div>
               <h3 style={{ margin: 0, fontSize: "16px", color: isUnlocked ? "#fff" : (canAfford ? "#f8fafc" : "#94a3b8"), textAlign: "center", lineHeight: "1.2" }}>
                 {node.id}
               </h3>
               <div style={{ fontSize: "12px", color: isUnlocked ? "#e2e8f0" : "#64748b", flex: 1, lineHeight: "1.4", textAlign: "center", marginTop: "4px" }}>
                 {node.desc}
               </div>
               <div style={{ display: "flex", justifyContent: "center", gap: "12px", borderTop: `1px dashed ${isUnlocked ? "rgba(56,189,248,0.4)" : "#334155"}`, paddingTop: "12px", marginTop: "auto" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: isUnlocked ? "#38bdf8" : (empireResources.science >= node.cost ? "#38bdf8" : "#ef4444") }}>
                    ⚛️ {node.cost}
                  </div>
               </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
