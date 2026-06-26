import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMissionControl, MissionControlState } from './hooks/useMissionControl';
import { SubTaskPreview } from './hooks/useMissions';

// ─── Octave geometry + colour helpers (mirrors drawOctaveObject logic) ────────
const OCTAVE_COLORS: Record<number, string> = {
  0: '#22d3ee', 1: '#38bdf8', 2: '#6366f1', 3: '#8b5cf6',
  4: '#a855f7', 5: '#d946ef', 6: '#ec4899', 7: '#f43f5e',
  8: '#fbbf24', 9: '#f59e0b', 10: '#ea580c', 11: '#ef4444',
  12: '#e11d48', 13: '#be123c', 14: '#881337',
};
function octGeomGroup(octave: number): number {
  if (octave <= 1) return 0;  // quantum fuzzy circles
  if (octave <= 3) return 1;  // nuclear orbital rings
  if (octave <= 5) return 2;  // molecular bonds
  if (octave <= 7) return 3;  // biological cell blobs
  if (octave === 8) return 4; // EM/neural wave ring
  return 5;                   // geological/galactic platonic solid
}

function drawOctaveMini(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number,
  octave: number, frame: number, seed: number,
) {
  const grp = octGeomGroup(octave);
  const color = OCTAVE_COLORS[octave] ?? '#ffffff';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}44`;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  switch (grp) {
    case 0: { // QUANTUM — fuzzy sinusoidal circle
      const pts = 36, noise = 0.22;
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const ang = (i / pts) * Math.PI * 2;
        const nr = R * (1 + noise * Math.sin(ang * 5 + seed + frame * 0.04));
        i === 0
          ? ctx.moveTo(Math.cos(ang) * nr, Math.sin(ang) * nr)
          : ctx.lineTo(Math.cos(ang) * nr, Math.sin(ang) * nr);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }
    case 1: { // NUCLEAR — atomic orbital
      ctx.beginPath(); ctx.arc(0, 0, R * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let o = 0; o < 2; o++) {
        const rr = R * (0.45 + o * 0.35);
        ctx.globalAlpha = 0.6;
        ctx.save(); ctx.rotate(o * Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 2: { // MOLECULAR — dumbbell
      const nr = R * 0.38;
      ctx.beginPath(); ctx.arc(-R * 0.55, 0, nr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc( R * 0.55, 0, nr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.7; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-R * 0.17, 0); ctx.lineTo(R * 0.17, 0); ctx.stroke();
      break;
    }
    case 3: { // BIOLOGICAL — organic blob
      const pts3 = 12;
      ctx.beginPath();
      for (let i = 0; i <= pts3; i++) {
        const ang = (i / pts3) * Math.PI * 2;
        const nr = R * (1 + 0.27 * Math.sin(ang * 3.7 + seed + frame * 0.012));
        i === 0
          ? ctx.moveTo(Math.cos(ang) * nr, Math.sin(ang) * nr)
          : ctx.lineTo(Math.cos(ang) * nr, Math.sin(ang) * nr);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.28, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 4: { // EM / NEURAL — wave ring
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI * 2;
        const wave = Math.sin(t * 4 + frame * 0.06) * R * 0.25;
        const rx = Math.cos(t) * (R + wave); const ry = Math.sin(t) * (R + wave);
        i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
      }
      ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 0.2; ctx.fill();
      break;
    }
    case 5: { // GEOLOGICAL — platonic polygon (hexagon for large octaves)
      const sides = octave >= 12 ? 6 : 5;
      const scaledR = octave >= 12 ? R * 1.15 : R;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
        i === 0
          ? ctx.moveTo(Math.cos(ang) * scaledR, Math.sin(ang) * scaledR)
          : ctx.lineTo(Math.cos(ang) * scaledR, Math.sin(ang) * scaledR);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.45; ctx.lineWidth = 0.8;
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * scaledR, Math.sin(ang) * scaledR); ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

function drawWarpRingMini(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, frame: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  const pulse = 0.85 + 0.15 * Math.sin(frame * 0.05);
  ctx.strokeStyle = '#f59e0b';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = pulse;
  ctx.beginPath(); ctx.arc(0, 0, R * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.3 * pulse;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(0, 0, R * pulse * 0.6, 0, Math.PI * 2); ctx.fill();
  // golden shimmer particles
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + frame * 0.02;
    const px = Math.cos(ang) * R, py = Math.sin(ang) * R;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 0.07 + i);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBuildingMini(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, frame: number, label?: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  const isAlign = label?.toLowerCase().includes('align') || label?.toLowerCase().includes('emitter') || label?.toLowerCase().includes('frequen');
  const isEfficiency = label?.toLowerCase().includes('efficiency');

  if (isEfficiency) {
    // 5-bar efficiency meter
    const barW = R * 0.28, barGap = R * 0.08;
    const totalW = 5 * barW + 4 * barGap;
    for (let i = 0; i < 5; i++) {
      const x = -totalW / 2 + i * (barW + barGap);
      const barH = R * (0.45 + i * 0.11);
      const pulse = i < 4 ? 1.0 : 0.7 + 0.3 * Math.sin(frame * 0.06);
      ctx.globalAlpha = 0.9 * pulse;
      ctx.fillStyle = `hsl(${120 - i * 10}, 80%, 55%)`;
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
      ctx.fillRect(x, -barH / 2, barW, barH);
    }
  } else if (isAlign) {
    // Two arcs converging with signal line
    const t = frame * 0.04;
    ctx.strokeStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    // Node A
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(-R * 0.65, 0, R * 0.18, 0, Math.PI * 2); ctx.stroke();
    // Node B
    ctx.beginPath(); ctx.arc( R * 0.65, 0, R * 0.18, 0, Math.PI * 2); ctx.stroke();
    // Signal pulse between them
    const progress = (Math.sin(t) + 1) / 2;
    const px = -R * 0.47 + R * 0.94 * progress;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(px, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    // Dashed connection line
    ctx.globalAlpha = 0.35; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(-R * 0.47, 0); ctx.lineTo(R * 0.47, 0); ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Generic: hex tile with a glowing centre
    ctx.strokeStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      i === 0
        ? ctx.moveTo(Math.cos(ang) * R, Math.sin(ang) * R)
        : ctx.lineTo(Math.cos(ang) * R, Math.sin(ang) * R);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#38bdf8';
    ctx.fill(); ctx.globalAlpha = 0.8; ctx.stroke();
    // inner glow dot
    const pulse = 0.7 + 0.3 * Math.sin(frame * 0.06);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(0, 0, R * 0.22, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── SubTaskPreviewComponent ──────────────────────────────────────────────────
const SubTaskPreviewComponent: React.FC<{ preview: SubTaskPreview; done: boolean }> = ({ preview, done }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const SIZE = 88;
  const R = SIZE * 0.34;
  const cx = SIZE / 2, cy = SIZE / 2;
  const seed = preview.octave ? (preview.octave * 137.5) % (Math.PI * 2) : 0;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.globalAlpha = done ? 0.35 : 1.0;
    const f = frameRef.current++;

    if (preview.type === 'canvas_asteroid') {
      const oct = preview.octave ?? 11;
      // Gentle rotation
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(f * 0.008);
      ctx.translate(-cx, -cy);
      drawOctaveMini(ctx, cx, cy, R, oct, f, seed);
      ctx.restore();
    } else if (preview.type === 'canvas_building') {
      if (preview.label?.toLowerCase().includes('warp') || preview.label?.toLowerCase().includes('portal')) {
        drawWarpRingMini(ctx, cx, cy, R, f);
      } else {
        drawBuildingMini(ctx, cx, cy, R, f, preview.label);
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, [preview, done, seed]);

  useEffect(() => {
    if (preview.type === 'canvas_asteroid' || preview.type === 'canvas_building') {
      rafRef.current = requestAnimationFrame(render);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [preview.type, render]);

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    opacity: done ? 0.4 : 1, transition: 'opacity 0.3s', flexShrink: 0,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.6rem', color: '#64748b', textAlign: 'center',
    maxWidth: '72px', lineHeight: 1.2, fontFamily: 'monospace',
  };

  if (preview.type === 'canvas_asteroid' || preview.type === 'canvas_building') {
    const octColor = preview.octave ? (OCTAVE_COLORS[preview.octave] ?? '#38bdf8') : '#38bdf8';
    return (
      <div style={containerStyle}>
        <div style={{
          borderRadius: '10px', padding: '3px',
          border: `1.5px solid ${octColor}88`,
          boxShadow: `0 0 16px ${octColor}44, 0 0 6px ${octColor}22`,
          background: 'transparent',
        }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: 'block', borderRadius: '8px' }} />
        </div>
        {preview.label && <span style={labelStyle}>{preview.label}</span>}
      </div>
    );
  }

  if (preview.type === 'image') {
    return (
      <div style={containerStyle}>
        <div style={{
          width: SIZE, height: SIZE, borderRadius: '10px',
          border: '1.5px solid #38bdf888',
          boxShadow: '0 0 16px #38bdf844, 0 0 6px #38bdf822',
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <img
            src={preview.src} alt={preview.label ?? 'item'}
            style={{ width: '85%', height: '85%', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        </div>
        {preview.label && <span style={labelStyle}>{preview.label}</span>}
      </div>
    );
  }

  if (preview.type === 'keybind') {
    return (
      <div style={containerStyle}>
        <div style={{
          width: SIZE, height: SIZE, borderRadius: '10px',
          border: '1.5px solid #f59e0b88',
          boxShadow: '0 0 16px #f59e0b44, 0 0 6px #f59e0b22',
          background: 'transparent',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <div style={{
            background: '#1e293b', border: '2px solid #f59e0b',
            borderRadius: '7px', padding: '5px 12px',
            color: '#f59e0b', fontSize: '1.25rem', fontWeight: 'bold',
            fontFamily: 'monospace', boxShadow: '0 3px 0 #92400e, 0 0 12px #f59e0b55',
          }}>
            {preview.key}
          </div>
          <span style={{ fontSize: '0.6rem', color: '#f59e0bcc' }}>PRESS</span>
        </div>
        {preview.label && <span style={labelStyle}>{preview.label}</span>}
      </div>
    );
  }

  return null;
};

// ─── Main MissionControlUI ────────────────────────────────────────────────────

interface MissionControlUIProps {
  state: MissionControlState;
  onClose: () => void;
  onStartContract?: (offId: string, cost: number) => void;
}

export const MissionControlUI: React.FC<MissionControlUIProps> = ({ state, onClose, onStartContract }) => {
  const treeData = useMissionControl(state);
  
  // Default to the first archetype (e.g., 'architect')
  const [activeArchetypeId, setActiveArchetypeId] = useState<string>(treeData?.archetypes[0]?.id || "");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'MATRIX' | 'COUNCIL'>('LIST');
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);

  // Matrix Mode Geometry State
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = useState<{ id: string, x1: number, y1: number, x2: number, y2: number, color: string }[]>([]);

  // Compute Matrix DAG structure
  const { matrixLayers, dict } = React.useMemo(() => {
    if (!treeData) return { matrixLayers: [], dict: {} };
    const allNodes: any[] = [];
    const _dict: Record<string, any> = {};
    treeData.archetypes.forEach((arc: any) => {
      arc.nodes.forEach((n: any) => {
        const enhanced = { ...n, archetypeId: arc.id, color: arc.color || n.color || '#38bdf8', avatar: arc.avatar, arcName: arc.name };
        allNodes.push(enhanced);
        _dict[n.id] = enhanced;
      });
    });

    let maxDepth = 0;
    let changed = true;
    while(changed) {
      changed = false;
      for (const node of allNodes) {
        let desiredDepth = 0;
        for (const req of node.prerequisites) {
          const pNode = _dict[req];
          if (pNode) desiredDepth = Math.max(desiredDepth, (pNode.depth || 0) + 1);
        }
        if (node.depth !== desiredDepth) {
          node.depth = desiredDepth;
          maxDepth = Math.max(maxDepth, desiredDepth);
          changed = true;
        }
      }
    }
    
    const layers: any[][] = Array(maxDepth + 1).fill(null).map(() => []);
    allNodes.forEach(n => layers[n.depth || 0].push(n));
    return { matrixLayers: layers, dict: _dict };
  }, [treeData]);

  useEffect(() => {
    if (viewMode !== 'MATRIX' || !containerRef.current) return;
    
    const calculateEdges = () => {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const newEdges: any[] = [];
      const parentColorHash: Record<string, string> = {};

      Object.values(dict).forEach((node: any) => {
        const destEl = nodeRefs.current[node.id];
        if (!destEl) return;
        const dRect = destEl.getBoundingClientRect();
        const destX = dRect.left - cRect.left;
        const destY = dRect.top - cRect.top + (dRect.height / 2);

        node.prerequisites.forEach((reqId: string) => {
          const parentEl = nodeRefs.current[reqId];
          const parentNode = dict[reqId];
          if (!parentEl || !parentNode) return;
          const pRect = parentEl.getBoundingClientRect();
          const pX = pRect.right - cRect.left;
          const pY = pRect.top - cRect.top + (pRect.height / 2);

          newEdges.push({
            id: `${reqId}->${node.id}`,
            x1: pX, y1: pY,
            x2: destX, y2: destY,
            color: parentNode.color
          });
        });
      });
      setEdges(newEdges);
    };

    // Calculate once DOM mounts
    const tId = setTimeout(calculateEdges, 100);
    window.addEventListener('resize', calculateEdges);
    return () => { clearTimeout(tId); window.removeEventListener('resize', calculateEdges); };
  }, [viewMode, matrixLayers, dict]);

  if (!treeData) return <div style={{ color: 'white' }}>Mission Engine Initializing...</div>;

  const activeArchetype = treeData.archetypes.find((a: any) => a.id === activeArchetypeId);
  const selectedNode = activeArchetype?.nodes.find((n: any) => n.id === selectedNodeId) 
    || activeArchetype?.nodes[0]; // Fallback to first node if none selected

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(5, 10, 20, 0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'monospace', zIndex: 10000,
      pointerEvents: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 25px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem', textShadow: '0 0 10px rgba(56,189,248,0.3)' }}>THE NEXUS COMMAND</h2>
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '4px', padding: '2px' }}>
            <button 
              onClick={() => setViewMode('LIST')}
              style={{ background: viewMode === 'LIST' ? '#38bdf8' : 'transparent', color: viewMode === 'LIST' ? '#000' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>
              TIMELINE
            </button>
            <button 
              onClick={() => setViewMode('MATRIX')}
              style={{ background: viewMode === 'MATRIX' ? '#38bdf8' : 'transparent', color: viewMode === 'MATRIX' ? '#000' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>
              MATRIX
            </button>
            <button 
              onClick={() => setViewMode('COUNCIL')}
              style={{ background: viewMode === 'COUNCIL' ? '#fbbf24' : 'transparent', color: viewMode === 'COUNCIL' ? '#000' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}>
              COUNCIL
            </button>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLOSE DISPATCH</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Pane A: Archetypes Sidebar */}
        {viewMode !== 'COUNCIL' && (
          <div style={{ width: '250px', borderRight: '1px solid #1e293b', background: '#0b1120', display: 'flex', flexDirection: 'column' }}>
            {treeData.archetypes.map((arc: any) => (
              <button
                key={arc.id}
                onClick={() => { setActiveArchetypeId(arc.id); setSelectedNodeId(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', border: 'none',
                  background: activeArchetypeId === arc.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                  borderLeft: `4px solid ${activeArchetypeId === arc.id ? arc.color : 'transparent'}`,
                  color: activeArchetypeId === arc.id ? '#fff' : '#94a3b8', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{arc.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem', color: arc.color }}>{arc.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {arc.nodes.filter((n: any) => n.status === 'COMPLETED').length} / {arc.nodes.length} Synced
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {viewMode === 'LIST' ? (
          <>
            {/* Pane B: Timeline / Tree View */}
            <div style={{ width: '350px', borderRight: '1px solid #1e293b', background: '#0f172a', overflowY: 'auto' }}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeArchetype?.nodes.map((node: any, idx: number) => {
                  const isSelected = selectedNodeId === node.id || (!selectedNodeId && idx === 0);
                  const isLocked = node.status === 'LOCKED';
                  const isCompleted = node.status === 'COMPLETED';
                  
                  return (
                    <div 
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isSelected ? activeArchetype.color : '#1e293b'}`,
                        borderRadius: '6px', padding: '12px', cursor: 'pointer',
                        opacity: isLocked ? 0.5 : 1, transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 0 10px ${activeArchetype.color}20` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: activeArchetype.color, fontWeight: 'bold' }}>{node.day}</span>
                        {isCompleted && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ DONE</span>}
                        {isLocked && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>🔒 LOCKED</span>}
                        {node.status === 'IN_PROGRESS' && <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold' }}>▶ ACTIVE</span>}
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', color: isSelected ? '#fff' : '#cbd5e1', fontSize: '0.95rem' }}>{node.title}</h4>
                      {isLocked && node.prerequisites.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '6px' }}>
                          Requires: {node.prerequisites.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pane C: Active Telemetry / Node Detail */}
            <div style={{ flex: 1, background: '#050a14', padding: '30px', overflowY: 'auto' }}>
              {selectedNode ? (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  
                  {/* Archetype Header */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #1e293b' }}>
                    <img src={activeArchetype.avatar} alt="Commander" style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${activeArchetype.color}` }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: activeArchetype.color, fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px' }}>{activeArchetype.name.toUpperCase()} DATALOG</span>
                      <h1 style={{ margin: '5px 0', fontSize: '2rem', color: '#fff' }}>{selectedNode.title}</h1>
                      <span style={{ color: '#94a3b8' }}>{selectedNode.desc}</span>
                    </div>
                  </div>

                  {selectedNode.status === 'LOCKED' && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '0 4px 4px 0' }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#f87171' }}>ACCESS DENIED</h3>
                      <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem' }}>You must physically complete preceding sub-root dependencies before unlocking this progression branch.</p>
                    </div>
                  )}

                  {/* Subtask Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>PROTOCOL CHECKLIST</h3>
                    {selectedNode.subTasks.map((st: any, idx: number) => (
                      <div key={st.id ?? idx} style={{ 
                        display: 'flex', gap: '15px', padding: '15px', background: '#0f172a', borderRadius: '6px',
                        borderLeft: `4px solid ${st.done ? '#22c55e' : '#334155'}`,
                        alignItems: 'flex-start',
                      }}>
                        {/* Checkbox */}
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', background: st.done ? '#22c55e' : 'transparent',
                          border: `2px solid ${st.done ? '#22c55e' : '#475569'}`, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, marginTop: '2px',
                        }}>
                          {st.done && <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        {/* Text content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold', color: st.done ? '#94a3b8' : '#fff', textDecoration: st.done ? 'line-through' : 'none' }}>
                            {st.label}
                          </span>
                          {st.details && st.details.map((detail: string, dIdx: number) => (
                            <span key={dIdx} style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>› {detail}</span>
                          ))}
                          {/* Live Progress Bar — only for RESOURCE conditions */}
                          {st.progress && !st.done && (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                  PROGRESS
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                  {st.progress.current.toLocaleString()}
                                  <span style={{ color: '#475569' }}> / </span>
                                  {st.progress.max.toLocaleString()}
                                </span>
                              </div>
                              <div style={{
                                width: '100%', height: '6px', background: '#1e293b',
                                borderRadius: '3px', overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(100, (st.progress.current / st.progress.max) * 100)}%`,
                                  background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                                  borderRadius: '3px',
                                  boxShadow: '0 0 6px #38bdf866',
                                  transition: 'width 0.5s ease',
                                }} />
                              </div>
                            </div>
                          )}
                          {st.progress && st.done && (
                            <span style={{ fontSize: '0.75rem', color: '#22c55e', fontFamily: 'monospace' }}>
                              ✓ {st.progress.max.toLocaleString()} collected
                            </span>
                          )}
                        </div>
                        {/* Visual Preview */}
                        {st.preview && (
                          <SubTaskPreviewComponent preview={st.preview} done={st.done} />
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', marginTop: '100px' }}>Select a node to view its telemetry.</div>
              )}
            </div>
          </>
        ) : viewMode === 'MATRIX' ? (
          <div style={{ flex: 1, display: 'flex', background: '#050a14', position: 'relative' }}>
            
            <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto', display: 'flex', padding: '60px' }}>
              
              {/* SVG Edge Renderer */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                <defs>
                  {/* Arrowheads for each archetype color */}
                  {Object.values(dict).map((n: any) => (
                    <marker key={`arrow-${n.color}`} id={`arrow-${n.color.replace('#','')}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={n.color} opacity="0.6" />
                    </marker>
                  ))}
                </defs>
                {edges.map(e => {
                  // Bezier curve for smooth DAG links
                  const dx = Math.abs(e.x2 - e.x1) * 0.5;
                  const cx1 = e.x1 + dx;
                  const cy1 = e.y1;
                  const cx2 = e.x2 - dx;
                  const cy2 = e.y2;
                  return (
                    <path
                      key={e.id}
                      d={`M ${e.x1} ${e.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${e.x2} ${e.y2}`}
                      fill="none"
                      stroke={e.color}
                      strokeWidth="2.5"
                      opacity="0.35"
                      strokeDasharray="4 4"
                      markerEnd={`url(#arrow-${e.color.replace('#','')})`}
                    />
                  );
                })}
              </svg>

              {/* Columns for topological depth */}
              {matrixLayers.map((layerNodes: any[], colIdx: number) => (
                <div key={`col-${colIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '40px', minWidth: '220px', marginLeft: colIdx === 0 ? 0 : '100px', zIndex: 2 }}>
                  {layerNodes.map((node: any) => {
                     const isLocked = node.status === 'LOCKED';
                     const isCompleted = node.status === 'COMPLETED';
                     const isSelected = selectedNodeId === node.id;
                     return (
                       <div 
                         key={node.id} 
                         ref={el => { nodeRefs.current[node.id] = el; }}
                         onClick={() => {
                           setSelectedNodeId(node.id);
                           const parentArc = treeData.archetypes.find((a:any) => a.id === node.archetypeId);
                           if (parentArc) setActiveArchetypeId(parentArc.id);
                           setViewMode('LIST'); // Send them back to detail view
                         }}
                         style={{ 
                           background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.95)',
                           border: `1.5px solid ${node.color}`,
                           borderRadius: '8px', padding: '15px', color: '#fff',
                           boxShadow: `0 0 20px ${node.color}${isCompleted ? '44' : '11'}`,
                           opacity: isLocked ? 0.4 : 1.0,
                           cursor: 'pointer', transition: 'all 0.2s',
                           position: 'relative'
                         }}
                       >
                         {/* Status Icon */}
                         <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', borderRadius: '50%', background: '#0f172a', border: `1px solid ${node.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isCompleted ? <span style={{ color: '#22c55e', fontSize: '10px' }}>✓</span> : 
                             isLocked ? <span style={{ color: '#ef4444', fontSize: '10px' }}>🔒</span> :
                             <span style={{ color: '#f59e0b', fontSize: '10px' }}>▶</span>}
                         </div>

                         <div style={{ fontSize: '0.65rem', color: node.color, fontWeight: 'bold', marginBottom: '4px' }}>{node.arcName.toUpperCase()}</div>
                         <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{node.title}</div>
                         <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>{node.subTasks.filter((t:any) => t.done).length} / {node.subTasks.length} Done</div>
                       </div>
                     );
                  })}
                </div>
              ))}

            </div>
          </div>
        ) : viewMode === 'COUNCIL' && (
          <div style={{ flex: 1, display: "flex", background: "#050a14" }} onClick={() => setSelectedOfficer(null)}>
            <div style={{ flex: selectedOfficer ? 1.5 : 1, padding: "40px", overflowY: "auto", transition: "all 0.3s ease" }}>
              <div style={{ maxWidth: selectedOfficer ? '100%' : '1000px', margin: '0 auto' }}>
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <h1 style={{ color: "#fbbf24", margin: "0 0 10px 0", fontSize: "2.5rem", letterSpacing: "2px", textShadow: "0 0 20px rgba(251,191,36,0.3)" }}>THE HIGH COUNCIL</h1>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Honoring the legacy of retired Bridge Officers. Assure global prosperity.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
                {[0, 1, 2].map(slotIdx => {
                  const councilMember = state.highCouncil?.[slotIdx];
                  return (
                    <div key={slotIdx} style={{ 
                      background: councilMember ? "rgba(251,191,36,0.15)" : "rgba(15, 23, 42, 0.5)",
                      border: `2px ${councilMember ? "solid" : "dashed"} #fbbf24`,
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                      boxShadow: councilMember ? "0 0 20px rgba(251,191,36,0.2)" : "none"
                    }}>
                      <div style={{ color: "#fbbf24", fontWeight: "bold", letterSpacing: "1px" }}>SEAT {slotIdx + 1}</div>
                      {councilMember ? (
                        <>
                          <img src={councilMember.avatar} style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #fbbf24" }} />
                          <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.1rem" }}>{councilMember.name}</div>
                          <div style={{ color: "#4ade80", fontSize: "0.9rem" }}>+{Math.floor(councilMember.bondLevel * 5)}% Global Efficiency</div>
                          <button 
                            onClick={() => {
                              if (state.setHighCouncil) {
                                const newCouncil = [...(state.highCouncil || [])];
                                newCouncil.splice(slotIdx, 1);
                                state.setHighCouncil(newCouncil);
                                try { localStorage.setItem("arn_high_council_v1", JSON.stringify(newCouncil)); } catch {}
                              }
                            }}
                            style={{ marginTop: "10px", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "5px 15px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", transition: "all 0.2s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            REVOKE SEAT
                          </button>
                        </>
                      ) : (
                        <div style={{ padding: "30px 0", color: "#64748b", fontStyle: "italic", fontSize: "0.9rem" }}>Empty Council Seat</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {state.legacyOfficers && state.legacyOfficers.length > 0 ? (
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
                   {state.legacyOfficers.map((off, idx) => (
                      <div key={idx} style={{ 
                        background: "rgba(15, 23, 42, 0.8)", 
                        border: "1px solid #fbbf24", 
                        borderRadius: "12px", 
                        padding: "20px",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 0 15px rgba(251,191,36,0.15)"
                      }}>
                        <div style={{ position: "absolute", top: 0, right: 0, background: "#fbbf24", color: "#000", padding: "4px 12px", borderBottomLeftRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>
                          LEGACY SECURED
                        </div>
                        <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
                          <img src={off.avatar} style={{ width: "60px", height: "60px", borderRadius: "8px", border: "2px solid #fbbf24" }} />
                          <div>
                            <h3 style={{ margin: "0 0 5px 0", color: "#fff", fontSize: "1.2rem" }}>{off.name}</h3>
                            <div style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: "bold" }}>{off.role.toUpperCase()}</div>
                          </div>
                        </div>
                        
                        <div style={{ background: "#050a14", padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                           <div style={{ display: "flex", justifyContent: "space-between" }}>
                             <span style={{ color: "#64748b" }}>Retirement Age:</span>
                             <span style={{ color: "#e2e8f0" }}>{off.age}</span>
                           </div>
                           <div style={{ display: "flex", justifyContent: "space-between" }}>
                             <span style={{ color: "#64748b" }}>Service Years:</span>
                             <span style={{ color: "#e2e8f0" }}>{off.serviceYears}</span>
                           </div>
                           <div style={{ display: "flex", justifyContent: "space-between" }}>
                             <span style={{ color: "#64748b" }}>Final Bond:</span>
                             <span style={{ color: "#e2e8f0" }}>Lv. {off.bondLevel}</span>
                           </div>
                        </div>

                        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                          <button 
                            onClick={() => {
                              const isFull = (state.highCouncil?.length || 0) >= 3;
                              const isAlreadyOnCouncil = state.highCouncil?.some(c => c.id === off.id);
                              if (!isFull && !isAlreadyOnCouncil && state.setHighCouncil) {
                                const newCouncil = [...(state.highCouncil || []), off];
                                state.setHighCouncil(newCouncil);
                                try { localStorage.setItem("arn_high_council_v1", JSON.stringify(newCouncil)); } catch {}
                              }
                            }}
                            disabled={(state.highCouncil?.length || 0) >= 3 || !!(state.highCouncil?.some(c => c.id === off.id))}
                            style={{ flex: 1, padding: "10px", background: "rgba(56,189,248,0.1)", border: "1px solid #38bdf8", borderRadius: "6px", color: "#38bdf8", fontWeight: "bold", cursor: ((state.highCouncil?.length || 0) >= 3 || state.highCouncil?.some(c => c.id === off.id)) ? "not-allowed" : "pointer", opacity: ((state.highCouncil?.length || 0) >= 3 || state.highCouncil?.some(c => c.id === off.id)) ? 0.5 : 1, transition: "all 0.2s" }}
                            onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "#38bdf8"; e.currentTarget.style.color = "#000"; } }}
                            onMouseLeave={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "rgba(56,189,248,0.1)"; e.currentTarget.style.color = "#38bdf8"; } }}
                          >
                            {state.highCouncil?.some(c => c.id === off.id) ? "ON COUNCIL" : "ASSIGN SEAT"}
                          </button>
                          <button 
                            disabled={!!off.activeContract}
                            onClick={() => {
                              if (onStartContract && !off.activeContract) {
                                onStartContract(off.id, 1000);
                              }
                            }}
                            style={{ flex: 1, padding: "10px", background: off.activeContract ? "transparent" : "rgba(251,191,36,0.1)", border: "1px solid #fbbf24", borderRadius: "6px", color: "#fbbf24", fontWeight: "bold", cursor: off.activeContract ? "not-allowed" : "pointer", opacity: off.activeContract ? 0.5 : 1, transition: "all 0.2s" }}
                            onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "#fbbf24"; e.currentTarget.style.color = "#000"; } }}
                            onMouseLeave={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "rgba(251,191,36,0.1)"; e.currentTarget.style.color = "#fbbf24"; } }}
                          >
                            {off.activeContract ? "CONTRACT ACTIVE" : "TRADE CONTRACT (1000E)"}
                          </button>
                        </div>

                      </div>
                   ))}
                 </div>
              ) : (
                 <div style={{ textAlign: "center", padding: "60px", background: "rgba(15, 23, 42, 0.5)", border: "1px dashed #334155", borderRadius: "12px" }}>
                   <span style={{ fontSize: "3rem", filter: "grayscale(1)", opacity: 0.5 }}>🏛️</span>
                   <h3 style={{ color: "#94a3b8", marginTop: "20px" }}>The Hall is Empty</h3>
                   <p style={{ color: "#64748b", maxWidth: "400px", margin: "10px auto 0" }}>
                     No officers have reached the mandatory Federation retirement age of 50. Keep mining to age your crew globally.
                   </p>
                 </div>
              )}
            </div>
            </div>
            
            {/* RIGHT PANE: Detailed Meta-Data Card Viewer */}
            {selectedOfficer && (
              <div 
                style={{ width: "400px", minWidth: "400px", borderLeft: "1px solid #1e293b", background: "#0a0f1c", padding: "40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <img src={selectedOfficer.avatar} style={{ width: "120px", height: "120px", borderRadius: "16px", border: "2px solid #fbbf24", boxShadow: "0 0 20px rgba(251,191,36,0.2)" }} />
                  <button onClick={() => setSelectedOfficer(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "2rem", cursor: "pointer", lineHeight: "1" }}>&times;</button>
                </div>
                
                <div>
                  <h2 style={{ margin: "0 0 5px 0", color: "#fff", fontSize: "1.8rem" }}>{selectedOfficer.name}</h2>
                  <div style={{ color: "#fbbf24", fontSize: "1rem", fontWeight: "bold", letterSpacing: "2px" }}>{selectedOfficer.role.toUpperCase()}</div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", border: "1px solid #1e293b" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>SERVICE RECORD</h3>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Retirement Age:</span><span style={{ color: "#e2e8f0", fontWeight: "bold" }}>{selectedOfficer.age}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Years Active:</span><span style={{ color: "#e2e8f0", fontWeight: "bold" }}>{selectedOfficer.serviceYears || 0}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Final Bond Level:</span><span style={{ color: "#fbbf24", fontWeight: "bold" }}>Lv. {selectedOfficer.bondLevel}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Legacy Status:</span><span style={{ color: "#4ade80", fontWeight: "bold" }}>SECURED</span></div>
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", border: "1px solid #1e293b" }}>
                  <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>BIOMETRIC METADATA</h3>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Base Processing:</span><span style={{ color: "#e2e8f0" }}>{Math.floor((selectedOfficer.stats?.processing || 1) * 100)} TFLOP/s</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Base Research:</span><span style={{ color: "#e2e8f0" }}>{Math.floor((selectedOfficer.stats?.research || 1) * 100)} QT</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Base Combat:</span><span style={{ color: "#e2e8f0" }}>{Math.floor((selectedOfficer.stats?.combat || 1) * 100)} DPI</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Base Logistics:</span><span style={{ color: "#e2e8f0" }}>{Math.floor((selectedOfficer.stats?.logistics || 1) * 100)} OP/s</span></div>
                </div>
                
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", lineHeight: "1.5", marginTop: "10px" }}>
                  "The Federation is built on the shoulders of giants. {selectedOfficer.name}'s service is permanently encoded into the structural efficiency of all colonies."
                </p>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
