'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { PLANETS, FACTIONS, type Planet } from '../../../data/planets';

const OCTAVES = [
  {n:0,lbl:'VOID'},{n:1,lbl:'QNTM'},{n:2,lbl:'NUCL'},{n:3,lbl:'ATOM'},
  {n:4,lbl:'ELEC'},{n:5,lbl:'MOLC'},{n:6,lbl:'GENE'},{n:7,lbl:'CELL'},
  {n:8,lbl:'NEUR'},{n:9,lbl:'ECOL'},{n:10,lbl:'LNAR'},{n:11,lbl:'SOLR'},
  {n:12,lbl:'OORT'},{n:13,lbl:'CNST'},{n:14,lbl:'GLXY'},
];

const FACTION_COLOR: Record<number,string> = {
  0:'#0088ff', 1:'#f59e0b', 2:'#34d399', 3:'#c084fc', [-1]:'#4b5563',
};

function drawPlanet(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, planet: Planet) {
  // ── TURNED OFF GRADIENTS AS REQUESTED ──

  // Simple flat base
  ctx.beginPath(); 
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = planet.color || '#cccccc'; 
  ctx.fill();

  // The sun is a luminous body and shouldn't receive a dark terminator shadow.
  const isSun = planet.name && planet.name.toLowerCase().includes('sun');
  
  if (!isSun) {
    // Simple flat shadow instead of gradient
    ctx.beginPath(); 
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,10,0.5)'; 
    ctx.fill();

    // Specular highlight
    ctx.beginPath(); ctx.arc(cx-r*0.28, cy-r*0.3, r*0.22, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
  }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function GalaxyMapEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeOctave, setActiveOctave] = useState(11);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'iso'|'topdown'>('iso');

  // Pan / zoom state
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x:0, y:0 });
  const velocity = useRef({ x:0, y:0 });
  const prevPointer = useRef({ x:0, y:0, t:0 });
  const lastTouchDist = useRef<number|null>(null);
  const zoomVelocity = useRef(0); // accumulated scroll impulse, decays each frame

  // Convert AU to canvas radius
  const AU_SCALE = useRef(60); // px per AU at zoom=1

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W/2 + panRef.current.x;
    const cy = H/2 + panRef.current.y;
    const z = zoomRef.current;
    const AU = AU_SCALE.current * z;
    // ISO = 0.38 compression (angled), Top Down = 1.0 (perfect circles)
    const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;

    ctx.clearRect(0,0,W,H);

    // Deep space background
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
    bg.addColorStop(0,'#0a0d1f'); bg.addColorStop(0.5,'#060818'); bg.addColorStop(1,'#020408');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Stars
    const STAR_SEED = [
      [0.07,0.12,0.7],[0.18,0.06,0.5],[0.28,0.22,0.9],[0.40,0.08,0.6],[0.55,0.15,0.8],
      [0.68,0.05,0.5],[0.82,0.19,0.7],[0.93,0.28,0.9],[0.96,0.44,0.6],[0.90,0.60,0.8],
      [0.85,0.76,0.5],[0.72,0.88,0.7],[0.58,0.94,0.9],[0.44,0.91,0.6],[0.30,0.85,0.8],
      [0.14,0.78,0.5],[0.06,0.65,0.7],[0.03,0.50,0.9],[0.08,0.35,0.6],[0.22,0.48,0.4],
      [0.47,0.38,0.7],[0.63,0.52,0.5],[0.78,0.40,0.8],[0.88,0.58,0.6],[0.33,0.60,0.9],
      [0.50,0.72,0.5],[0.20,0.30,0.7],[0.75,0.68,0.6],[0.12,0.90,0.8],[0.95,0.80,0.4],
    ];
    STAR_SEED.forEach(([sx,sy,b]) => {
      ctx.beginPath(); ctx.arc(sx*W, sy*H, b*0.9, 0, Math.PI*2);
      ctx.fillStyle=`rgba(200,210,255,${b*0.5})`; ctx.fill();
    });

    // Central star (sun)
    const starGlow = ctx.createRadialGradient(cx,cy,0,cx,cy,AU*0.3);
    starGlow.addColorStop(0,'rgba(255,240,160,0.9)'); starGlow.addColorStop(0.3,'rgba(255,180,60,0.4)'); starGlow.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(cx,cy,AU*0.3,0,Math.PI*2); ctx.fillStyle=starGlow; ctx.fill();
    const starCore = ctx.createRadialGradient(cx-4,cy-4,0,cx,cy,14*z);
    starCore.addColorStop(0,'#fffbe0'); starCore.addColorStop(0.5,'#ffe080'); starCore.addColorStop(1,'#ff8020');
    ctx.beginPath(); ctx.arc(cx,cy,14*z,0,Math.PI*2); ctx.fillStyle=starCore; ctx.fill();

    // Orbital rings — concentric ellipses (ISO) or circles (Top Down)
    PLANETS.forEach(planet => {
      const r = planet.au * AU;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * yRatio, 0, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(200,50,50,0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // Planets — angles spread out so they're visible (not stacked)
    const t = Date.now() * 0.00008;
    PLANETS.forEach((planet, i) => {
      const baseAngle = (i / PLANETS.length) * Math.PI * 2;
      const angle = baseAngle + t / Math.sqrt(planet.au); // inner planets orbit faster
      const r = planet.au * AU;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r * yRatio; // ellipse compression
      const ps = Math.max(3, planet.size * z * 0.55);
      const isHov = hoveredPlanet === planet.id;
      const isSel = selectedPlanet?.id === planet.id;

      drawPlanet(ctx, px, py, ps, planet);

      // Selection ring
      if (isHov || isSel) {
        ctx.beginPath(); ctx.arc(px, py, ps+4, 0, Math.PI*2);
        ctx.strokeStyle = isSel ? '#ffffff' : FACTION_COLOR[planet.faction]??'#fff';
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Label (AU distance + name)
      if (z > 0.55) {
        const labelX = px + ps + 6;
        const labelY = py - 2;
        ctx.font = `bold ${Math.max(8,10*z)}px "Courier New",monospace`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`${planet.name.toUpperCase()} — ${planet.au.toFixed(2)} AU`, labelX, labelY);
        if (planet.pop > 0) {
          ctx.font = `${Math.max(7,9*z)}px "Courier New",monospace`;
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`${planet.pop.toLocaleString()}`, labelX+4, labelY + 13*z);
        }
      }
    });

  }, [hoveredPlanet, selectedPlanet, viewMode]);

  // ─── Hit test ─────────────────────────────────────────────
  const getPlanetPositions = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return [];
    const W=canvas.width, H=canvas.height;
    const cx=W/2+panRef.current.x, cy=H/2+panRef.current.y;
    const z=zoomRef.current, AU=AU_SCALE.current*z;
    const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;
    const t=Date.now()*0.00008;
    return PLANETS.map((planet,i)=>{
      const baseAngle=(i/PLANETS.length)*Math.PI*2;
      const angle=baseAngle+t/Math.sqrt(planet.au);
      const r=planet.au*AU;
      return { planet, x:cx+Math.cos(angle)*r, y:cy+Math.sin(angle)*r*yRatio, r:Math.max(3,planet.size*z*0.55) };
    });
  },[viewMode]);

  const hitTest = useCallback((mx:number,my:number)=>{
    const canvas=canvasRef.current; if(!canvas) return null;
    const rect=canvas.getBoundingClientRect();
    const px=mx-rect.left, py=my-rect.top;
    const positions=getPlanetPositions();
    for(const {planet,x,y,r} of positions){
      if(Math.sqrt((px-x)**2+(py-y)**2)<=r+10) return planet;
    }
    return null;
  },[getPlanetPositions]);

  // ─── Animation loop ───────────────────────────────────────────────────────
  const animRef = useRef<number>(0);
  useEffect(()=>{
    const PAN_FRICTION = 0.88;
    const ZOOM_FRICTION = 0.80; // how quickly zoom momentum bleeds off
    const loop=()=>{
      // Pan inertia
      if(!isDragging.current){
        const {x:vx,y:vy}=velocity.current;
        if(Math.abs(vx)>0.05||Math.abs(vy)>0.05){
          panRef.current={x:panRef.current.x+vx,y:panRef.current.y+vy};
          velocity.current={x:vx*PAN_FRICTION,y:vy*PAN_FRICTION};
        }
      }
      // Zoom inertia — apply accumulated velocity then decay
      if(Math.abs(zoomVelocity.current) > 0.0001){
        const newZoom = Math.max(0.3, Math.min(4, zoomRef.current * (1 + zoomVelocity.current)));
        zoomRef.current = newZoom;
        zoomVelocity.current *= ZOOM_FRICTION;
      } else {
        zoomVelocity.current = 0;
      }
      draw();
      animRef.current=requestAnimationFrame(loop);
    };
    animRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(animRef.current);
  },[draw]);

  // ─── Resize ────────────────────────────────────────────────
  useEffect(()=>{
    const resize=()=>{
      const c=canvasRef.current,d=containerRef.current;
      if(!c||!d) return;
      c.width=d.clientWidth; c.height=d.clientHeight;
    };
    resize(); window.addEventListener('resize',resize);
    return ()=>window.removeEventListener('resize',resize);
  },[]);

  // ─── Pointer events ────────────────────────────────────────
  const onDown=(e:React.PointerEvent)=>{
    velocity.current={x:0,y:0}; isDragging.current=false;
    lastPointer.current={x:e.clientX,y:e.clientY};
    prevPointer.current={x:e.clientX,y:e.clientY,t:Date.now()};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove=(e:React.PointerEvent)=>{
    const dx=e.clientX-lastPointer.current.x,dy=e.clientY-lastPointer.current.y;
    if(Math.abs(dx)>3||Math.abs(dy)>3) isDragging.current=true;
    if(e.buttons>0&&isDragging.current){
      panRef.current={x:panRef.current.x+dx,y:panRef.current.y+dy};
      const now=Date.now(),dt=Math.max(1,now-prevPointer.current.t);
      velocity.current={x:(e.clientX-prevPointer.current.x)*(16/dt),y:(e.clientY-prevPointer.current.y)*(16/dt)};
      prevPointer.current={x:e.clientX,y:e.clientY,t:now};
    } else {
      setHoveredPlanet(hitTest(e.clientX,e.clientY)?.id??null);
    }
    lastPointer.current={x:e.clientX,y:e.clientY};
  };
  const onUp=(e:React.PointerEvent)=>{
    if(!isDragging.current){
      velocity.current={x:0,y:0};
      const hit=hitTest(e.clientX,e.clientY);
      setSelectedPlanet(p=>hit?(p?.id===hit.id?null:hit):null);
    }
    isDragging.current=false;
  };
  const onWheel=(e:React.WheelEvent)=>{
    // Accumulate zoom impulse — scroll wheel adds momentum, friction bleeds it off
    const impulse = e.deltaY > 0 ? -0.012 : 0.014; // negative = zoom out, positive = in
    zoomVelocity.current += impulse;
    // Clamp so we can't accumulate past zoom limits
    const projectedZoom = zoomRef.current * Math.pow(1 + zoomVelocity.current, 8);
    if (projectedZoom < 0.3 || projectedZoom > 4) zoomVelocity.current *= 0.3;
  };
  const onTouchMove=(e:React.TouchEvent)=>{
    if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(lastTouchDist.current!==null){
        const nz=Math.max(0.3,Math.min(4,zoomRef.current*dist/lastTouchDist.current));
        zoomRef.current=nz;
      }
      lastTouchDist.current=dist;
    } else { lastTouchDist.current=null; }
  };

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'#020408', fontFamily:'"Courier New",monospace', overflow:'hidden', position:'relative' }}>
      
      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px', background:'rgba(0,4,16,0.96)', borderBottom:'1px solid rgba(200,50,50,0.2)', flexShrink:0, zIndex:10 }}>
        <button style={{ background:'rgba(200,50,50,0.15)', border:'1px solid rgba(200,50,50,0.5)', borderRadius:5, color:'#ef4444', padding:'5px 14px', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:1 }}>
          ☰ MISSIONS
        </button>

        {/* View mode sub-tabs */}
        <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(200,50,50,0.2)', borderRadius:6, padding:3 }}>
          {(['iso','topdown'] as const).map(mode=>(
            <button key={mode} onClick={()=>setViewMode(mode)}
              style={{ padding:'4px 16px', borderRadius:4, border:'none', cursor:'pointer', fontSize:10, fontWeight:700, letterSpacing:1, transition:'all 0.15s',
                background: viewMode===mode ? 'rgba(200,50,50,0.3)' : 'transparent',
                color: viewMode===mode ? '#ef4444' : '#475569',
                boxShadow: viewMode===mode ? '0 0 8px rgba(200,50,50,0.3)' : 'none'
              }}
            >
              {mode==='iso' ? '⟨ ISO' : '⊙ TOP DOWN'}
            </button>
          ))}
        </div>

        <div style={{ color:'#475569', fontSize:9, letterSpacing:2 }}>GALAXY MAP · ALLIANCES SYSTEM · OCTAVE {activeOctave}</div>
        <button onClick={()=>setSelectedPlanet(null)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:5, color:'#ef4444', padding:'5px 14px', fontSize:11, fontWeight:700, cursor:'pointer', letterSpacing:1 }}>
          ✕ CLOSE MAP
        </button>
      </div>

      {/* MAIN AREA: canvas + right sidebar */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* CANVAS */}
        <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden', touchAction:'none' }}>
          <canvas ref={canvasRef}
            style={{ display:'block', width:'100%', height:'100%', cursor:hoveredPlanet?'pointer':'grab' }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            onTouchMove={onTouchMove} onWheel={onWheel}
          />
          {/* Bottom-left controls */}
          <div style={{ position:'absolute', bottom:12, left:12, display:'flex', gap:6, zIndex:10 }}>
            {['⊙','⬡','□','◇','✦'].map((icon,i)=>(
              <button key={i} style={{ width:30, height:30, borderRadius:4, background:'rgba(0,4,16,0.88)', border:'1px solid #1e293b', color:'#475569', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</button>
            ))}
          </div>
          <div style={{ position:'absolute', bottom:12, left:180, zIndex:10 }}>
            <button style={{ background:'rgba(200,50,50,0.15)', border:'1px solid rgba(200,50,50,0.4)', borderRadius:5, color:'#ef4444', padding:'5px 14px', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:1 }}>NUKE SAVE</button>
          </div>
        </div>

        {/* RIGHT SIDEBAR — planet list */}
        <div style={{ width:230, borderLeft:'1px solid rgba(200,50,50,0.18)', background:'rgba(0,4,16,0.96)', overflowY:'auto', padding:'8px 0', flexShrink:0, zIndex:5 }}>
          {PLANETS.map(planet=>{
            const fc = FACTION_COLOR[planet.faction]??'#4b5563';
            return (
            <div key={planet.id}
              onClick={()=>setSelectedPlanet(p=>p?.id===planet.id?null:planet)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', background:selectedPlanet?.id===planet.id?'rgba(200,50,50,0.12)':hoveredPlanet===planet.id?'rgba(255,255,255,0.03)':'transparent', borderLeft:selectedPlanet?.id===planet.id?'2px solid #ef4444':'2px solid transparent', transition:'background 0.1s' }}
              onMouseEnter={()=>setHoveredPlanet(planet.id)}
              onMouseLeave={()=>setHoveredPlanet(null)}
            >
              <div style={{ width:9, height:9, borderRadius:5, background:planet.color, flexShrink:0, boxShadow:`0 0 5px ${planet.glow}` }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{planet.name.toUpperCase()}</span>
                  {planet.faction>=0 && <span style={{ fontSize:9 }}>👑</span>}
                </div>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <span style={{ fontSize:7, fontWeight:700, color:fc, letterSpacing:0.5, background:fc+'18', padding:'1px 4px', borderRadius:2 }}>{planet.specialty}</span>
                  <span style={{ fontSize:7, color:'#334155' }}>{planet.totalHexes} hexes</span>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* BOTTOM OCTAVE BAR */}
      <div style={{ display:'flex', borderTop:'1px solid rgba(200,50,50,0.2)', background:'rgba(0,4,16,0.98)', flexShrink:0, overflowX:'auto' }}>
        {OCTAVES.map(oct=>{
          const isActive=oct.n===activeOctave;
          return (
            <button key={oct.n} onClick={()=>setActiveOctave(oct.n)}
              style={{ flex:'0 0 auto', minWidth:70, padding:'8px 4px', background:isActive?'rgba(200,50,50,0.22)':'transparent', border:'none', borderRight:'1px solid rgba(200,50,50,0.12)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'background 0.15s' }}
            >
              <div style={{ fontSize:11, fontWeight:700, color:isActive?'#ef4444':'#475569' }}>{oct.n}</div>
              <div style={{ fontSize:8, letterSpacing:1, color:isActive?'#ef4444':'#334155', fontFamily:'"Courier New",monospace' }}>{oct.lbl}</div>
            </button>
          );
        })}
      </div>

      {/* PLANET INFO CARD (slide up when selected) */}
      {selectedPlanet && (()=>{
        const fc = FACTION_COLOR[selectedPlanet.faction]??'#4b5563';
        const fn = FACTIONS[selectedPlanet.faction]?.name ?? 'Neutral';
        return (
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:60, background:'rgba(0,4,16,0.97)', border:`1px solid ${fc}44`, borderRadius:10, padding:'14px 18px', zIndex:50, width:360, maxHeight:'60vh', overflowY:'auto', boxShadow:`0 0 30px ${fc}18` }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:20, background:selectedPlanet.color+'22', border:`2px solid ${selectedPlanet.color}55`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🪐</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ color:'#fff', fontWeight:700, fontSize:13, letterSpacing:1 }}>{selectedPlanet.name.toUpperCase()}</span>
                <span style={{ fontSize:8, fontWeight:700, color:fc, background:fc+'18', padding:'2px 6px', borderRadius:3, letterSpacing:1 }}>{selectedPlanet.specialty}</span>
                {!selectedPlanet.conquerable && <span style={{ fontSize:7, color:'#475569', background:'rgba(255,255,255,0.05)', padding:'2px 5px', borderRadius:3 }}>UNCAPTURABLE</span>}
              </div>
              <div style={{ color:'#475569', fontSize:9, marginTop:2 }}>{selectedPlanet.au.toFixed(2)} AU · AXIS {selectedPlanet.axis} · {selectedPlanet.totalHexes} hexes total</div>
              <div style={{ color:fc, fontSize:9, marginTop:1 }}>{fn}</div>
            </div>
            <button onClick={()=>setSelectedPlanet(null)} style={{ background:'none', border:'none', color:'#475569', fontSize:14, cursor:'pointer', flexShrink:0 }}>✕</button>
          </div>
          {/* Lore */}
          <div style={{ color:'#64748b', fontSize:9, lineHeight:1.5, marginBottom:10, fontStyle:'italic', borderLeft:`2px solid ${fc}44`, paddingLeft:8 }}>{selectedPlanet.lore}</div>
          {/* Hex types */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:8, color:'#334155', letterSpacing:1, marginBottom:5 }}>HEX BREAKDOWN</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {selectedPlanet.hexes.map(h=>(
                <div key={h.type+h.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #1e293b', borderRadius:4, padding:'4px 7px', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:11 }}>{h.icon}</span>
                  <div>
                    <div style={{ fontSize:8, color:'#94a3b8', fontWeight:600 }}>{h.label}</div>
                    <div style={{ fontSize:7, color:'#475569' }}>{h.count} hexes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Activities */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:8, color:'#334155', letterSpacing:1, marginBottom:5 }}>ACTIVITIES</div>
            {selectedPlanet.activities.slice(0,4).map(a=>(
              <div key={a.name} style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:4 }}>
                <span style={{ fontSize:9, marginTop:1 }}>{a.type==='arena'?'⚔️':a.type==='shop'?'🛒':a.type==='mission'?'📋':a.type==='story'?'📜':a.type==='event'?'⚡':'⚙️'}</span>
                <div>
                  <div style={{ fontSize:9, color:'#e2e8f0', fontWeight:600 }}>{a.name}</div>
                  <div style={{ fontSize:7, color:'#475569', lineHeight:1.4 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ flex:1, background:`${fc}18`, border:`1px solid ${fc}44`, borderRadius:6, color:fc, padding:'8px 0', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:0.5 }}>⚡ FAST TRAVEL</button>
            <button style={{ flex:1, background:'rgba(0,136,255,0.1)', border:'1px solid rgba(0,136,255,0.3)', borderRadius:6, color:'#0088ff', padding:'8px 0', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:0.5 }}>🗺 PLANET VIEW →</button>
          </div>
        </div>
      );})()}
    </div>
  );
}
