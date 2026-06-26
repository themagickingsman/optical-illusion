import React, { useState, useEffect, useRef } from "react";
import { useMissions } from "./hooks/useMissions";
import treeDataRaw from '../../state/data/progression_tree.json';

const treeData: any[] = Array.isArray(treeDataRaw) ? treeDataRaw : (treeDataRaw as any).archetypes || [];

interface Props {
  empireResources: any;
  octaveCurrency: Record<number, number>;
}

export function ProgressionFrameworkUI({ empireResources, octaveCurrency }: Props) {
  const [localState, setLocalState] = useState({
    buildings: [],
    inventory: {},
    activeOctave: 11,
    completedTasks: {}
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setLocalState({
          buildings: JSON.parse(localStorage.getItem("arn_buildings_v3") || "[]"),
          inventory: JSON.parse(localStorage.getItem("arn_player_inventory_v3") || "{}"),
          activeOctave: parseInt(localStorage.getItem("arn_active_octave_v1") || "11"),
          completedTasks: JSON.parse(localStorage.getItem("arn_completed_tasks_v1") || "{}")
        });
      } catch (e) { }
    }
  }, []);

  const missions = useMissions({
    octaveCurrency: octaveCurrency || {},
    buildings: localState.buildings,
    inventory: localState.inventory,
    activeOctave: localState.activeOctave,
    completedTasks: localState.completedTasks
  });

  const [activeTab, setActiveTab] = useState<
    "description" | "spreadsheet" | "diagram" | "quests" | "monetization" | "activities" | "story_arcs"
  >("description");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const tabs = [
    { id: "description", label: "Overview" },
    { id: "spreadsheet", label: "Octave Math" },
    { id: "diagram", label: "Hexagon Path" },
    { id: "quests", label: "Mastery Gates" },
    { id: "monetization", label: "Biological Pressures" },
    { id: "activities", label: "Activity Builder" },
    { id: "story_arcs", label: "Story Arc Matrix" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(2, 6, 23, 0.95)",
        color: "#cbd5e1",
        fontFamily: "monospace",
        overflow: "hidden",
      }}
    >
      {/* Sub-Navigation Header */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #334155",
          padding: "16px 24px",
          gap: "12px",
          background: "linear-gradient(to bottom, #0f172a, rgba(15,23,42,0))",
        }}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                background: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                border: `1px solid ${isActive ? "#38bdf8" : "#475569"}`,
                color: isActive ? "#38bdf8" : "#94a3b8",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: isActive ? "bold" : "normal",
                transition: "all 0.2s",
                boxShadow: isActive ? "0 0 10px rgba(56,189,248,0.2)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "#94a3b8";
                  e.currentTarget.style.color = "#cbd5e1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "#475569";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {activeTab === "description" && (
          <div style={{ maxWidth: "800px", lineHeight: "1.6" }}>
            <h2 style={{ color: "#38bdf8", marginBottom: "16px", textTransform: "uppercase" }}>
              The Hexagonal Progression Framework
            </h2>
            <p style={{ marginBottom: "16px", fontSize: "14px", color: "#94a3b8" }}>
              Unlike traditional 4X games that rely on flat, binary progression paths (e.g., Good vs. Evil), this game structurally utilizes the <strong>15-Octave Cosmic Compass</strong> to create a dimensional web of dependencies. Progression is scaled radially outward using the <strong>Golden Ratio (Phi ~1.618)</strong> to form a complete 6-point Hexagonal Endgame Matrix.
              <br /><br />
              Instead of a linear level-up system, player choices ripple outward along 6 distinct arms, forming a hexagon. The distance between functional progression nodes on these arms scales by Phi, mathematically pacing the mid-to-late game to feel organically expansive.
            </p>
            <div style={{ borderLeft: "4px solid #38bdf8", paddingLeft: "16px", background: "rgba(56,189,248,0.05)", padding: "16px", borderRadius: "0 8px 8px 0" }}>
              <h3 style={{ color: "#e2e8f0", marginBottom: "8px" }}>The 6 Evolutionary Endgames</h3>
              <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingLeft: "16px", fontSize: "14px" }}>
                <li><strong style={{ color: "#fbbf24" }}>The Sovereign:</strong> Controlling all major spatial zones and ruling the galaxy through fleet superiority.</li>
                <li><strong style={{ color: "#34d399" }}>The Prime Broker:</strong> Total pacifist playthrough. Controlling the flow of Harmonic Credits (hC) and supply logistical chains.</li>
                <li><strong style={{ color: "#818cf8" }}>The Architect:</strong> Building Dyson Spheres and Quantum circuitry. Manipulating the physics of the universe to artificially generate infinite materials.</li>
                <li><strong style={{ color: "#f87171" }}>The Warden:</strong> Protecting the galactic grid from deep-space anomalies, void-creatures, and rogue entities.</li>
                <li><strong style={{ color: "#c084fc" }}>The Oracle:</strong> Mapping the uncharted Phantom Nodes, decoding the Primordial Field, and reaching the outer edge of the Milky Way.</li>
                <li><strong style={{ color: "#f472b6" }}>The Weaver:</strong> Forging symbiotic alliances across human and alien factions. Achieving total macroscopic resonance.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "spreadsheet" && (
          <div>
            <h2 style={{ color: "#fbbf24", marginBottom: "24px", textTransform: "uppercase" }}>
              Dynamic Golden-Ratio Complexity Simulator
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {Array.from({ length: 15 }, (_, i) => {
                const oct = i;
                const phi = 1.618;
                const baseComplexity = Math.pow(phi, Math.abs(11 - oct));
                const userFunds = octaveCurrency[oct] || 0;
                const dynamicMultiplier = (empireResources.efficiency * baseComplexity).toFixed(2);

                return (
                  <div key={oct} style={{ background: "#0f172a", border: "1px solid #334155", padding: "16px", borderRadius: "8px" }}>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>OCTAVE {oct}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}>
                      Φ-Factor: {baseComplexity.toFixed(1)}x
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "14px", color: oct === 11 ? "#34d399" : "#64748b" }}>
                      Active Funds: {userFunds.toLocaleString()}
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "12px", color: "#38bdf8" }}>
                      Cognitive Load: {dynamicMultiplier}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "diagram" && (
          <div style={{ textAlign: "center", paddingTop: "40px" }}>
             {/* Abstract CSS Hexagon Tree visualization */}
             <div style={{ position: "relative", width: "400px", height: "400px", margin: "0 auto" }}>
                {Array.from({ length: 6 }).map((_, i) => {
                   const angle = (Math.PI / 3) * i - Math.PI / 2;
                   const x = Math.cos(angle) * 150 + 200;
                   const y = Math.sin(angle) * 150 + 200;
                   const colors = ["#fbbf24", "#34d399", "#818cf8", "#f87171", "#c084fc", "#f472b6"];
                   const labels = ["SOVEREIGN", "BROKER", "ARCHITECT", "WARDEN", "ORACLE", "WEAVER"];
                   
                   return (
                     <React.Fragment key={i}>
                       {/* Connection Line */}
                       <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
                         <line x1="200" y1="200" x2={x} y2={y} stroke={colors[i]} strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                       </svg>
                       {/* Node */}
                       <div style={{
                         position: "absolute",
                         top: y - 20,
                         left: x - 60,
                         width: "120px",
                         textAlign: "center",
                         color: colors[i],
                         background: "rgba(2,8,23,0.9)",
                         border: `1px solid ${colors[i]}55`,
                         padding: "8px",
                         borderRadius: "4px",
                         fontSize: "12px",
                         fontWeight: "bold",
                         zIndex: 10,
                         boxShadow: `0 0 15px ${colors[i]}33`
                       }}>
                         {labels[i]}
                       </div>
                     </React.Fragment>
                   );
                })}
                <div style={{
                   position: "absolute",
                   top: "160px",
                   left: "140px",
                   width: "120px",
                   height: "80px",
                   background: "rgba(56,189,248,0.2)",
                   border: "1px solid #38bdf8",
                   borderRadius: "8px",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   color: "#38bdf8",
                   fontWeight: "bold",
                   zIndex: 20,
                   boxShadow: "0 0 20px rgba(56,189,248,0.4)"
                }}>
                  PRIMORDIAL<br/>ANCHOR
                </div>
             </div>
          </div>
        )}

        {activeTab === "quests" && (
          <div style={{ maxWidth: "800px" }}>
            <h2 style={{ color: "#34d399", marginBottom: "24px", textTransform: "uppercase" }}>
              The Recursive Endgame (The Grand Council)
            </h2>
            <p style={{ color: "#cbd5e1", marginBottom: "24px", lineHeight: "1.6" }}>
              In traditional 4X games, "winning" means the game ends or you run out of things to do. In this framework, mastering one of the 6 Golden Ratio Endgames at Octave 14 does not roll the credits—it fundamentally changes the genre of the game.
              <br /><br />
              When you master an evolutionary path on Octave 14 (The Milky Way), you unlock the <strong>Grand Council</strong>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Deploying the Council", desc: "You assemble a governing body of 12 members (Specialized in Research, Trade, Logistics, Security, Diplomacy, etc.).", tier: "OCTAVE 14" },
                { label: "The Fractal Restart", desc: "You are now playing on a staggeringly massive scale: spanning the Local Group, superclusters, and ultimately the Observable Universe (Octaves 14 through 29).", tier: "OCTAVE 15+" },
                { label: "Role Fluidity", desc: "When the progression restarts at this macro-scale, you begin with your entire established planetary empire intact. However, you can fundamentally shift your path on the Hexagon. If you spent Octaves 0-14 as an isolated Architect (Research) building Dyson spheres, you can now enter Octaves 14-29 as a sprawling Sovereign (Tyrant).", tier: "OCTAVE 15+" },
                { label: "No Stat-Padding, True Complexity", desc: "Enemies at Octave 25 are not just generic level 1 enemies with 'more health.' The actual physical goals, diplomatic consequences, and systemic mechanics evolve. You are no longer managing planets—your council members manage the planets, and you manage the council members. If you want to, you can still dive back into the Void (Octave 0) to micromanage a specific particle mutation.", tier: "OCTAVE 25+" },
              ].map((q, idx) => (
                <div key={idx} style={{ background: "#0f172a", borderLeft: "4px solid #34d399", padding: "16px", borderRadius: "0 8px 8px 0" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                     <strong style={{ color: "#e2e8f0" }}>{q.label}</strong>
                     <span style={{ fontSize: "10px", color: "#64748b", border: "1px solid #475569", padding: "2px 6px", borderRadius: "12px" }}>{q.tier}</span>
                   </div>
                   <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>{q.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "monetization" && (
           <div style={{ maxWidth: "800px", lineHeight: "1.6" }}>
            <h2 style={{ color: "#f87171", marginBottom: "16px", textTransform: "uppercase" }}>
              Biological Pressure Systems
            </h2>
            <p style={{ marginBottom: "24px", color: "#94a3b8" }}>
              Generic wait-timers have been eradicated. To support the F2P matrix organically, macroeconomic expansion is taxed through mathematically unarguable physical laws, forcing players to <b>earn the right</b> to purchase permanent automation algorithms.
            </p>
            <div style={{ background: "rgba(248, 113, 113, 0.05)", border: "1px solid rgba(248, 113, 113, 0.2)", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
              <h3 style={{ color: "#fca5a5", marginBottom: "8px" }}>1. Structural Entropy (Decay / Cellular Hunger)</h3>
              <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
                As your 15-Octave empire scales exponentially, massive physical structures (like Dyson Spheres) naturally experience atomic entropy. If they are not actively supplied with energy by your fleets, their output physically decays to baseline percentages. 
                <br/><br/>
                <b>Monetization Hook:</b> The player can manually hunt for fuel to feed their grid, OR they can deploy premium <i>Nanite Stabilizers</i>—automated biological vitamins that permanently freeze entropy on target nodes, eliminating grid micromanagement.
              </p>
            </div>
            <div style={{ background: "rgba(192, 132, 252, 0.05)", border: "1px solid rgba(192, 132, 252, 0.2)", borderRadius: "8px", padding: "24px" }}>
              <h3 style={{ color: "#d8b4fe", marginBottom: "8px" }}>2. Cognitive Bandwidth (Fatigue / Sleep)</h3>
              <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
                A human player can physically only command so many autonomous mining vessels before reaching logistical fatigue limit. Autonomous fleets that exceed your current <i>Command Bandwidth</i> will inherently stumble, lose efficiency, or mathematically "fall asleep."
                <br/><br/>
                <b>Monetization Hook:</b> The player must first organically climb the tech tree to unlock AI theory. Once unlocked, they "earn the right" to purchase premium <i>Neural Sub-Directors</i>, permanently artificially expanding their physical cognitive limit. It is not pay-to-win, it is paying for profound multi-dimensional relief.
              </p>
            </div>
           </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY LIBRARY BUILDER */}
        {/* ========================================================= */}
        {activeTab === 'activities' && (
          <div style={{ display: "flex", gap: "20px", width: "100%", position: "relative", zIndex: 1000, pointerEvents: "auto" }}>
            
            <div style={{ width: "300px", background: "rgba(0,0,0,0.8)", border: "1px solid #333", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
               <div style={{ padding: "15px", borderBottom: "1px solid #333", background: "#111", borderRadius: "8px 8px 0 0" }}>
                  <h3 style={{ margin: 0, color: "#fca5a5" }}>ATOMIC VERBS</h3>
               </div>
               <div style={{ flex: 1, padding: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {['[VERB] MINE_RESOURCE', '[VERB] WARP_SHIP', '[VERB] BUILD_STRUCTURE', '[VERB] SYNTHESIZE', '[VERB] ALIGN_GRID'].map(verb => (
                    <div key={verb} style={{ padding: "10px", background: "#1e293b", border: "1px solid #334155", borderRadius: "4px", color: "#94a3b8", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>
                       {verb}
                    </div>
                  ))}
               </div>
            </div>

            <div style={{ flex: 1, background: "rgba(0,0,0,0.8)", border: "1px solid #333", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
               <div style={{ padding: "15px", borderBottom: "1px solid #333", background: "#111", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, color: "#fca5a5" }}>JSON CONFIGURATION</h3>
                  <button style={{ background: "#fca5a5", color: "#000", border: "none", padding: "5px 15px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>SAVE ACTIVITY</button>
               </div>
               <div style={{ flex: 1, padding: "20px", display: "flex" }}>
                  <textarea 
                    readOnly 
                    value={"{\n  \"id\": \"act_mine_001\",\n  \"type\": \"MINE_RESOURCE\",\n  \"payload\": {\n    \"resource\": \"carbon\",\n    \"amount\": 50,\n    \"octave_required\": 11\n  }\n}"} 
                    style={{ width: "100%", height: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "4px", color: "#cbd5e1", padding: "15px", fontFamily: "monospace", fontSize: "14px", resize: "none", outline: "none" }}
                  />
               </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STORY ARC FIBONACCI MATRIX */}
        {/* ========================================================= */}
        {activeTab === 'story_arcs' && (
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{ 
              width: "100%", 
              position: "relative", 
              zIndex: 1000, 
              display: "flex", 
              gap: "40px", 
              overflowX: "auto", 
              paddingBottom: "20px",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none"
            }}
            className="no-scrollbar"
          >
            {treeData.map((arc: any) => {
               // The Architect is fully wired to useMissions.ts active state
               const isWired = arc.id === "architect";
               
               return (
                 <div key={arc.id} style={{ minWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
                   {/* Archetype Header */}
                   <div style={{ background: "rgba(0,0,0,0.8)", borderLeft: `4px solid ${isWired ? "#6ee7b7" : "#64748b"}`, padding: "20px", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                        <img src={arc.avatar} style={{ width: "40px", height: "40px", borderRadius: "4px", border: "1px solid #334155" }} />
                        <h2 style={{ color: isWired ? "#6ee7b7" : "#cbd5e1", margin: 0 }}>{arc.name.toUpperCase()}</h2>
                      </div>
                      <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>{arc.description}</p>
                   </div>

                   {/* Nodes Container */}
                   {isWired ? (
                     missions.map((m: any, idx: number) => (
                       <div key={idx} style={{ display: "flex", gap: "20px" }}>
                          <div style={{ width: "80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0f172a", border: `2px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: m.color, fontWeight: "bold", fontSize: "16px" }}>
                              {m.comp}
                            </div>
                            {idx !== missions.length - 1 && <div style={{ flex: 1, width: "2px", background: "#334155", marginTop: "10px" }} />}
                          </div>
                          
                          <div style={{ flex: 1, background: "rgba(0,0,0,0.6)", border: "1px solid #1e293b", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #334155", paddingBottom: "10px" }}>
                              <h3 style={{ margin: 0, color: m.color, fontSize: "16px" }}>{m.title}</h3>
                              <span style={{ background: "#0f172a", color: "#cbd5e1", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid #334155" }}>{m.day}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {m.subTasks.map((st: any, sIdx: number) => (
                                <div key={sIdx} style={{ 
                                  background: "#0f172a", 
                                  padding: "10px", 
                                  borderRadius: "4px", 
                                  color: st.done ? "#22c55e" : "#94a3b8", 
                                  fontSize: "12px", 
                                  borderLeft: `2px solid ${m.color}`,
                                  textDecoration: st.done ? "line-through" : "none"
                                }}>
                                  {st.done ? "[x]" : "[ ]"} {st.label}
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div style={{ background: "rgba(0,0,0,0.4)", border: "1px dashed #334155", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#64748b" }}>
                       <i>Storyline currently locked in the conceptual matrix. Expansion logic initializing...</i>
                     </div>
                   )}
                 </div>
               );
            })}
            
            <style dangerouslySetInnerHTML={{__html: `
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
          </div>
        )}
      </div>
    </div>
  );
}
