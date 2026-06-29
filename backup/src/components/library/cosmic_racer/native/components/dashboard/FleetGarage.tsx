"use client";
/**
 * FleetGarage — Standalone ship upgrade & officer management UI.
 * Layout: Left vertical ship selector | Center ship+officers | Right tabbed panel
 */
import React, { useState, useCallback, useEffect } from "react";
import { BOND_MATRIX_CREW } from "./economy_fallback";

// ── Ship definitions ─────────────────────────────────────────────────────────
const PLAYABLE_SHIPS = [
  {
    id: 0,
    name: "VANGUARD",
    subtitle: "Classic Fighter",
    avatar: "/game_assets/ships/v1/player_ship_01.png",
    color: "#00f7ff",
    cargoMax: 50,
    slots: 3,
    stats: { speed: 50, mining: 50, range: 40 },
  },
  {
    id: 1,
    name: "FALCOR",
    subtitle: "Balanced Scout",
    avatar: "/game_assets/ships/v1/player_ship_02.png",
    color: "#00AAFF",
    cargoMax: 200,
    slots: 6,
    stats: { speed: 65, mining: 65, range: 60 },
  },
  {
    id: 2,
    name: "MAMMOTH",
    subtitle: "Heavy Miner",
    avatar: "/game_assets/ships/v1/player_ship_03.png",
    color: "#f59e0b",
    cargoMax: 1000,
    slots: 12,
    stats: { speed: 20, mining: 100, range: 100 },
  },
];

// Additional placeholder ships to fill out the sidebar
const TEMP_SHIPS = [
  { id: 10, name: "PHANTOM", subtitle: "Stealth Raider",   avatar: "/game_assets/ships/v1/player_ship_01.png", color: "#a855f7", locked: true },
  { id: 11, name: "TITAN",   subtitle: "Dreadnought",      avatar: "/game_assets/ships/v1/player_ship_02.png", color: "#ef4444", locked: true },
  { id: 12, name: "SPECTRE", subtitle: "Electronic Warfare",avatar: "/game_assets/ships/v1/player_ship_03.png", color: "#10b981", locked: true },
  { id: 13, name: "HERALD",  subtitle: "Command Frigate",  avatar: "/game_assets/ships/v1/player_ship_01.png", color: "#f97316", locked: true },
  { id: 14, name: "NEXUS",   subtitle: "Carrier",          avatar: "/game_assets/ships/v1/player_ship_02.png", color: "#06b6d4", locked: true },
  { id: 15, name: "OMEN",    subtitle: "Interceptor",      avatar: "/game_assets/ships/v1/player_ship_03.png", color: "#e879f9", locked: true },
  { id: 16, name: "EPOCH",   subtitle: "Titan-class",      avatar: "/game_assets/ships/v1/player_ship_01.png", color: "#fbbf24", locked: true },
  { id: 17, name: "RIFT",    subtitle: "Jump Corvette",    avatar: "/game_assets/ships/v1/player_ship_02.png", color: "#38bdf8", locked: true },
];

// ── Persistence helpers ───────────────────────────────────────────────────────
const CURRENCY_KEY = "arn_octave_currency";
function loadCurrency(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(CURRENCY_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {};
}
const ROSTER_KEY = "arn_ship_rosters";
function loadRosters(): Record<number, (string | null)[]> {
  if (typeof window === "undefined") return {};
  try { const raw = localStorage.getItem(ROSTER_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {
    0: [BOND_MATRIX_CREW[0]?.id ?? null, null, null],
    1: [BOND_MATRIX_CREW[1]?.id ?? null, null, null, null, null, null],
    2: Array(12).fill(null),
  };
}

type RightTab = "OFFICERS" | "SHIP_STATS" | "CARGO" | "MANIFEST";

// Rewrites full-res v1/v2 avatar paths → 300px JPEG thumbnails.
// API routes pass through unchanged.
function thumbUrl(src: string): string {
  const match = src.match(/\/game_assets\/avatars\/v[12]\/(.+?)(?:\.[^.]+)?$/);
  if (!match) return src;
  return `/game_assets/avatars/thumb/${match[1]}.jpg`;
}


// ── Component ─────────────────────────────────────────────────────────────────
export function FleetGarage() {
  const [selectedShip, setSelectedShip]       = useState(0);
  const [shipRosters, setShipRosters]         = useState<Record<number, (string | null)[]>>(loadRosters);
  const [draggedOfficer, setDraggedOfficer]   = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<RightTab>("OFFICERS");
  const [currency, setCurrency]               = useState<Record<number, number>>(loadCurrency);

  const ship        = PLAYABLE_SHIPS[selectedShip];
  const activeRoster = shipRosters[selectedShip] || [];
  const accentColor = ship?.color ?? "#00e5ff";

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(ROSTER_KEY, JSON.stringify(shipRosters));
  }, [shipRosters]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
  }, [currency]);

  const handleDropOnSlot = useCallback(
    (slotIndex: number) => {
      if (!draggedOfficer) return;
      setShipRosters((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const idx = next[Number(k)].indexOf(draggedOfficer);
          if (idx !== -1) { next[Number(k)] = [...next[Number(k)]]; next[Number(k)][idx] = null; }
        });
        if (!next[selectedShip]) next[selectedShip] = Array(ship?.slots ?? 3).fill(null);
        next[selectedShip] = [...next[selectedShip]];
        next[selectedShip][slotIndex] = draggedOfficer;
        return next;
      });
      setDraggedOfficer(null);
    },
    [draggedOfficer, selectedShip, ship]
  );

  const hasCaptain  = !!activeRoster[0];
  const slottedCrew = activeRoster.map((id) => (id ? BOND_MATRIX_CREW.find((o) => o.id === id) : null)).filter(Boolean) as typeof BOND_MATRIX_CREW;
  const crewCombat  = slottedCrew.reduce((s, n) => s + (n.stats?.combat || 0), 0);
  const crewMining  = slottedCrew.reduce((s, n) => s + (n.stats?.mining || 0), 0);
  const crewSpeed   = slottedCrew.reduce((s, n) => s + (n.stats?.speed  || 0), 0);
  const synergyPct  = hasCaptain ? 15 : 0;
  const multi       = 1 + synergyPct / 100;

  const statsData = [
    { id: "combat",  label: "COMBAT",             base: 250, crew: crewCombat, color: "#f43f5e" },
    { id: "mining",  label: "MINING / EXTRACTION", base: 80,  crew: crewMining, color: "#eab308" },
    { id: "speed",   label: "SPEED",               base: 100, crew: crewSpeed,  color: "#38bdf8" },
    { id: "evasion", label: "EVASION",              base: 80,  crew: Math.floor(crewSpeed * 0.5), color: "#a855f7" },
  ];

  const tabConfig: { id: RightTab; label: string; color: string }[] = [
    { id: "OFFICERS",   label: "OFFICERS",   color: "#10b981" },
    { id: "SHIP_STATS", label: "SHIP STATS", color: "#e879f9" },
    { id: "CARGO",      label: "CARGO",      color: accentColor },
    { id: "MANIFEST",   label: "MANIFEST",   color: "#64748b" },
  ];

  return (
    <div style={{
      width: "100%", height: "100%", minHeight: "100vh",
      background: "linear-gradient(135deg, #050511 0%, #0d0d2b 50%, #1a1a40 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "monospace", overflow: "hidden", position: "relative",
    }}>
      {/* ── Stars ─────────────────────────────────────────────────────────── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            background: "#ffffff", borderRadius: "50%",
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#64748b", marginBottom: "4px" }}>ARN COMMAND</div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "0.15em" }}>FLEET GARAGE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 16px" }}>
          <span style={{ fontSize: "16px" }}>🟣</span>
          <span style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>{(currency[11] || 0).toLocaleString()}</span>
          <span style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.15em" }}>CREDITS</span>
        </div>
      </div>

      {/* ── Three-column body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, position: "relative", zIndex: 1 }}>

        {/* ════════════════════════════════════════════════════════════════
            LEFT — vertical ship selector
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          width: "290px", flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", overflowX: "hidden",
          padding: "12px",
          gap: "12px",
        }}>
          {/* Section label */}
          <div style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#475569", fontWeight: 900, paddingLeft: "4px" }}>
            YOUR FLEET
          </div>

          {/* Owned ships — exact same style as original top-row buttons */}
          {PLAYABLE_SHIPS.map((s) => {
            const active = selectedShip === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedShip(s.id)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: active ? `${s.color}22` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${active ? s.color : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px",
                  transition: "all 0.2s ease", color: "#fff", textAlign: "left",
                }}
              >
                <img
                  src={s.avatar} alt={s.name}
                  style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "6px", flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                />
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: active ? s.color : "#cbd5e1", letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.05em" }}>{s.subtitle}</div>
                </div>
              </button>
            );
          })}

          {/* Divider + locked ships */}
          <div style={{ padding: "14px 16px 8px", fontSize: "9px", letterSpacing: "0.25em", color: "#334155", fontWeight: 900, marginTop: "8px" }}>
            UNAVAILABLE
          </div>

          {TEMP_SHIPS.map((s) => (
            <div
              key={s.id}
              style={{
                width: "100%", padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", gap: "10px", opacity: 0.35,
                cursor: "not-allowed",
              }}
            >
              <img
                src={s.avatar} alt={s.name}
                style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", filter: "grayscale(1)", flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 900, color: "#475569", letterSpacing: "0.08em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.subtitle}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "10px", flexShrink: 0 }}>🔒</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CENTER — ship visual + orbit officer slots
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "16px", position: "relative",
        }}>
          {/* Ship image + orbit */}
          <div style={{ position: "relative", width: "700px", height: "700px" }}>
            <img
              src={ship?.avatar} alt={ship?.name}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "375px", height: "375px", objectFit: "contain",
                filter: `drop-shadow(0 0 40px ${accentColor}aa)`,
                animation: "floatShip 4s ease-in-out infinite",
              }}
            />
            {/* Orbit ring */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "530px", height: "530px", borderRadius: "50%",
              border: `1px dashed ${accentColor}33`, pointerEvents: "none",
            }} />
            {/* Officer slots */}
            {Array.from({ length: ship?.slots ?? 3 }).map((_, i) => {
              const totalSlots = ship?.slots ?? 3;
              const angle   = (i * Math.PI * 2) / totalSlots - Math.PI / 2;
              const radius  = totalSlots > 6 ? (i % 2 === 0 ? 300 : 230) : 250;
              const x       = Math.cos(angle) * radius;
              const y       = Math.sin(angle) * radius;
              const slotSz  = totalSlots > 6 ? 135 : 172;
              const officerId = activeRoster[i];
              const officer   = officerId ? BOND_MATRIX_CREW.find((o) => o.id === officerId) : null;
              return (
                <div
                  key={i}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.transform = `translate(-50%, -50%) scale(1.12)`; e.currentTarget.style.borderColor = "#fff"; }}
                  onDragLeave={(e) => { e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"; e.currentTarget.style.borderColor = officer ? accentColor : "#475569"; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)"; handleDropOnSlot(i); }}
                  style={{
                    position: "absolute",
                    top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`,
                    transform: "translate(-50%, -50%)",
                    width: `${slotSz}px`, height: `${slotSz}px`, borderRadius: "50%",
                    background: officer ? "rgba(15,23,42,0.9)" : "rgba(2,8,23,0.6)",
                    border: `2px ${officer ? "solid" : "dashed"} ${officer ? accentColor : "#475569"}`,
                    display: "flex", justifyContent: "center", alignItems: "center",
                    cursor: "default", transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    overflow: "hidden", zIndex: 5,
                  }}
                >
                  {officer ? (
                    <>
                      <img src={officer.avatar} alt={officer.name} style={{ width: "94%", height: "94%", borderRadius: "50%", objectFit: "cover" }} />
                      <div
                        onClick={() => {
                          setShipRosters((prev) => {
                            const next = { ...prev };
                            const r = [...(next[selectedShip] || [])];
                            r[i] = null; next[selectedShip] = r; return next;
                          });
                        }}
                        style={{
                          position: "absolute", top: "-4px", right: "-4px",
                          width: "20px", height: "20px",
                          background: "rgba(220,38,38,0.9)", border: "1px solid rgba(255,255,255,0.3)",
                          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", zIndex: 10, fontSize: "12px", color: "#fff", fontWeight: 900,
                          opacity: 0.7, transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.transform = "scale(1)"; }}
                        title="Unassign"
                      >×</div>
                    </>
                  ) : (
                    <span style={{ color: "#64748b", fontSize: totalSlots > 6 ? "8px" : "10px", fontWeight: 900, letterSpacing: "0.1em" }}>
                      {i === 0 ? "CPT" : `S${i + 1}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: "11px", color: "#64748b", letterSpacing: "0.2em" }}>
            {activeRoster.filter(Boolean).length} / {ship?.slots ?? 3} OFFICERS ASSIGNED
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT — tabbed panel (Officers | Ship Stats | Cargo | Manifest)
            ════════════════════════════════════════════════════════════════ */}
        <div style={{
          width: "360px", flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", minHeight: 0,
        }}>
          {/* Tab strip */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {tabConfig.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, textAlign: "center", fontSize: "9px", fontWeight: 900,
                  letterSpacing: "0.08em", padding: "14px 4px 11px", cursor: "pointer",
                  color: activeTab === tab.id ? tab.color : "#334155",
                  borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                  transition: "all 0.18s",
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* ── OFFICERS tab ─────────────────────────────────────────────── */}
          {activeTab === "OFFICERS" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 900, color: "#10b981", letterSpacing: "0.15em" }}>OFFICER LIBRARY</div>
                <div style={{ fontSize: "10px", color: "#475569", fontWeight: 900 }}>{BOND_MATRIX_CREW.length} TOTAL</div>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gridAutoRows: "240px",
                gap: "5px",
                flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "4px",
              }}>
                {BOND_MATRIX_CREW.map((officer, i) => {
                  let assignedShip = -1;
                  Object.entries(shipRosters).forEach(([sId, roster]) => {
                    if (roster.includes(officer.id)) assignedShip = Number(sId);
                  });
                  const isSlottedLocally = activeRoster.includes(officer.id);
                  const isDraggable = !isSlottedLocally;
                  return (
                    <div
                      key={i}
                      draggable={isDraggable}
                      onClick={() => setSelectedOfficer(officer.id)}
                      onDragStart={(e) => { if (!isDraggable) { e.preventDefault(); return; } setDraggedOfficer(officer.id); }}
                      onDragEnd={() => setDraggedOfficer(null)}
                      style={{
                        background: isSlottedLocally ? "rgba(15,23,42,0.9)" : `${accentColor}11`,
                        border: `2px solid ${isSlottedLocally ? "#334155" : accentColor}`,
                        borderRadius: "8px", position: "relative", overflow: "hidden",
                        cursor: isDraggable ? "grab" : "default",
                        opacity: isSlottedLocally ? 0.3 : 1, transition: "all 0.2s",
                      }}
                    >
                      <img src={thumbUrl(officer.avatar)} alt={officer.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(2,6,23,1), transparent)", zIndex: 2 }} />
                      <div style={{ position: "absolute", bottom: "6px", left: "6px", right: "6px", zIndex: 3 }}>
                        <div style={{ color: "#f8fafc", fontSize: "10px", fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{officer.name}</div>
                        <div style={{ width: "100%", height: "3px", background: "rgba(30,41,59,0.8)", borderRadius: "1px", overflow: "hidden", marginTop: "4px" }}>
                          <div style={{ width: `${Math.min(100, officer.bondLevel * 10)}%`, height: "100%", background: accentColor }} />
                        </div>
                      </div>
                      {assignedShip !== -1 && !isSlottedLocally && (
                        <div style={{ position: "absolute", top: "3px", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.9)", border: "1px solid #10b981", borderRadius: "10px", padding: "1px 4px", zIndex: 5, display: "flex", alignItems: "center", gap: "2px" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#10b981" }} />
                          <span style={{ fontSize: "6px", color: "#10b981", fontWeight: "bold", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{PLAYABLE_SHIPS[assignedShip]?.name.split(" ")[0] ?? "SHIP"}</span>
                        </div>
                      )}
                      {isSlottedLocally && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }}>
                          <div style={{ color: "#10b981", fontSize: "20px", fontWeight: 900 }}>✓</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Recruit CTA */}
              <button
                onClick={() => {
                  const cost = 5000;
                  if ((currency[11] || 0) >= cost) setCurrency((prev) => ({ ...prev, 11: (prev[11] || 0) - cost }));
                }}
                style={{
                  marginTop: "14px", width: "100%", padding: "12px",
                  background: "linear-gradient(to right, rgba(16,185,129,0.1), rgba(16,185,129,0.2))",
                  border: "1px solid #10b981", borderRadius: "8px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  color: "#fff", transition: "all 0.2s", flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📡</span>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "#10b981", letterSpacing: "0.1em" }}>RECRUIT OFFICERS</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(2,6,23,0.6)", padding: "3px 8px", borderRadius: "4px", border: "1px solid #10b98155" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>5,000</span>
                  <span>🟣</span>
                </div>
              </button>
            </div>
          )}

          {/* ── SHIP STATS tab ────────────────────────────────────────────── */}
          {activeTab === "SHIP_STATS" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", padding: "16px", minHeight: 0, overflowY: "auto" }}>
              {hasCaptain && (
                <div style={{ background: "rgba(232,121,249,0.08)", border: "1px solid rgba(232,121,249,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "11px", color: "#e879f9", letterSpacing: "0.1em", fontWeight: 900 }}>
                  ⚡ CAPTAIN SYNERGY: +15% ALL STATS
                </div>
              )}
              {statsData.map((stat) => {
                const total = Math.floor((stat.base + stat.crew) * multi);
                const pct   = Math.min(100, (total / 500) * 100);
                return (
                  <div key={stat.id} style={{ background: "rgba(15,23,42,0.6)", padding: "14px 16px", borderRadius: "8px", borderLeft: `4px solid ${stat.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                      <span style={{ color: "#94a3b8", fontSize: "11px", letterSpacing: "0.1em", fontWeight: 900 }}>{stat.label}</span>
                      <span style={{ color: "#f8fafc", fontSize: "20px", fontWeight: 900 }}>{total}</span>
                    </div>
                    <div style={{ height: "4px", background: "#020817", borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: stat.color, transition: "width 0.4s ease" }} />
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>
                      <span>BASE: <span style={{ color: "#cbd5e1" }}>{stat.base}</span></span>
                      <span>CREW: <span style={{ color: "#cbd5e1" }}>+{stat.crew}</span></span>
                      {synergyPct > 0 && <span>MULT: <span style={{ color: "#e879f9" }}>+{synergyPct}%</span></span>}
                    </div>
                  </div>
                );
              })}
              {/* Upgrade CTA */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "8px" }}>
                <button
                  onClick={() => { const cost = 50000; if ((currency[11] || 0) >= cost) setCurrency((prev) => ({ ...prev, 11: (prev[11] || 0) - cost })); }}
                  style={{ width: "100%", padding: "14px", background: "linear-gradient(to right, rgba(20,184,166,0.1), rgba(20,184,166,0.25))", border: "1px solid #14b8a6", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🛠️</span>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#14b8a6", letterSpacing: "0.1em" }}>UPGRADE HULL</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(2,6,23,0.6)", padding: "3px 8px", borderRadius: "4px", border: "1px solid #14b8a655" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold" }}>50,000</span>
                    <span>🟣</span>
                  </div>
                </button>
                <div style={{ fontSize: "10px", color: "#475569", textAlign: "center", letterSpacing: "0.1em" }}>
                  CARGO CAP: <span style={{ color: accentColor }}>{Math.floor((ship?.cargoMax ?? 100) * multi).toLocaleString()} KG</span>
                  {hasCaptain && <span style={{ color: "#e879f9", marginLeft: "6px" }}>↑ +15% CAPTAIN</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── CARGO tab ─────────────────────────────────────────────────── */}
          {activeTab === "CARGO" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "16px", border: "1px dashed #334155", borderRadius: "8px" }}>
              <div style={{ color: "#475569", fontSize: "12px", letterSpacing: "0.1em", textAlign: "center" }}>
                CARGO HOLD EMPTY<br />
                <span style={{ fontSize: "10px", opacity: 0.6 }}>Play the game to fill your cargo</span>
              </div>
            </div>
          )}

          {/* ── MANIFEST tab ──────────────────────────────────────────────── */}
          {activeTab === "MANIFEST" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", margin: "16px", border: "1px dashed #334155", borderRadius: "8px" }}>
              <div style={{ color: "#475569", fontSize: "12px", letterSpacing: "0.1em", textAlign: "center" }}>
                NO PASSENGERS<br />CURRENTLY IN TRANSIT
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Officer detail popup ───────────────────────────────────────────── */}
      {selectedOfficer && (() => {
        const o = BOND_MATRIX_CREW.find((x) => x.id === selectedOfficer);
        if (!o) return null;
        return (
          <div
            onClick={() => setSelectedOfficer(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "rgba(11,15,25,0.98)", border: `1px solid ${accentColor}44`, borderRadius: "16px", padding: "32px", width: "360px", display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <img src={o.avatar} alt={o.name} style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", border: `2px solid ${accentColor}` }} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "0.1em" }}>{o.name}</div>
                  <div style={{ fontSize: "11px", color: accentColor, letterSpacing: "0.15em", marginTop: "4px" }}>BOND LEVEL {o.bondLevel}</div>
                  <div style={{ width: "120px", height: "4px", background: "#1e293b", borderRadius: "2px", overflow: "hidden", marginTop: "8px" }}>
                    <div style={{ width: `${Math.min(100, o.bondLevel * 10)}%`, height: "100%", background: accentColor }} />
                  </div>
                </div>
              </div>
              {o.stats && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {Object.entries(o.stats).map(([k, v]) => (
                    <div key={k} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: 900, color: "#fff" }}>{v}</div>
                      <div style={{ fontSize: "9px", color: "#64748b", letterSpacing: "0.1em", marginTop: "2px" }}>{k.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelectedOfficer(null)}
                style={{ padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontFamily: "monospace", fontSize: "12px", letterSpacing: "0.1em" }}
              >CLOSE</button>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.8; } }
        @keyframes floatShip { 0%, 100% { transform: translate(-50%, -50%) translateY(0px); } 50% { transform: translate(-50%, -50%) translateY(-8px); } }
      `}</style>
    </div>
  );
}
