'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { SOLAR_BODIES } from '../../../state/logic/SolarSystemData';

const OCTAVES = [
  {n:0,lbl:'VOID'},{n:1,lbl:'QNTM'},{n:2,lbl:'NUCL'},{n:3,lbl:'ATOM'},
  {n:4,lbl:'ELEC'},{n:5,lbl:'MOLC'},{n:6,lbl:'GENE'},{n:7,lbl:'CELL'},
  {n:8,lbl:'NEUR'},{n:9,lbl:'ECOL'},{n:10,lbl:'LNAR'},{n:11,lbl:'SOLR'},
  {n:12,lbl:'OORT'},{n:13,lbl:'CNST'},{n:14,lbl:'GLXY'},
];

const FACTION_COLOR: Record<number,string> = {
  0:'#0088ff', 1:'#f59e0b', 2:'#34d399', 3:'#c084fc', [-1]:'#4b5563',
};

// Planet color palettes matching the Asteroid Command visual style
function drawPlanet(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, planet: any) {
  // Use dynamically retrieved color from physics generation
  const baseColor = planet.color || '#cccccc';
  const glow = baseColor; // Use base color directly for glow

  // Outer atmosphere glow
  const glowGrad = ctx.createRadialGradient(cx, cy, r*0.6, cx, cy, r*2.2);
  glowGrad.addColorStop(0, glow+'44'); glowGrad.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(cx, cy, r*2.2, 0, Math.PI*2);
  ctx.fillStyle = glowGrad; ctx.fill();

  // Main body
  const body = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, 0, cx, cy, r);
  body.addColorStop(0, baseColor+'ff');
  body.addColorStop(0.5, baseColor+'cc');
  body.addColorStop(1, glow+'88');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = body; ctx.fill();

  // Terminator shadow
  const shadow = ctx.createRadialGradient(cx+r*0.4, cy, r*0.2, cx+r*0.35, cy, r);
  shadow.addColorStop(0, 'transparent'); shadow.addColorStop(0.7, 'rgba(0,0,10,0.35)'); shadow.addColorStop(1, 'rgba(0,0,10,0.65)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = shadow; ctx.fill();

  // Specular highlight
  ctx.beginPath(); ctx.arc(cx-r*0.28, cy-r*0.3, r*0.22, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function SolarSystemMapEngine({ 
  sunPosRef, 
  mapPanRef, 
  mapZoomRef,
  visualZoomRef,
  fleetPositionsRef,
  mapPrefsRef,
  hideCanvas
}: { 
  sunPosRef?: React.MutableRefObject<{x: number, y: number}>,
  mapPanRef?: React.MutableRefObject<{x: number, y: number}>,
  mapZoomRef?: React.MutableRefObject<number>,
  visualZoomRef?: React.MutableRefObject<number>,
  fleetPositionsRef?: React.MutableRefObject<{id: string, x: number, y: number, color: string, isPlayer: boolean}[]>,
  mapPrefsRef?: React.MutableRefObject<any>,
  hideCanvas?: boolean,
  disableNativeGestures?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeOctave, setActiveOctave] = useState(11);
  const [selectedPlanet, setSelectedPlanet] = useState<any | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [hoveredShipId, setHoveredShipId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'iso'|'topdown'>('topdown');
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const isReturningToSun = useRef(false);
  const isIntroAnimating = useRef(true);

  // Pan / zoom state
  const localPanRef = useRef({ x: 0, y: 0 });
  const localZoomRef = useRef(1.0);
  const panRef = mapPanRef || localPanRef;
  const zoomRef = mapZoomRef || localZoomRef;
  const isDragging = useRef(false);
  const lastPointer = useRef({ x:0, y:0 });
  const velocity = useRef({ x:0, y:0 });
  const prevPointer = useRef({ x:0, y:0, t:0 });
  const lastTouchDist = useRef<number|null>(null);
  const zoomVelocity = useRef(0); // accumulated scroll impulse, decays each frame

  // Scale physics units to map screen space
  const VISUAL_SCALE = 0.15; // Maps worldR (e.g. 5000) to map radius (e.g. 750px at zoom 1x)

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    
    // Always anchor perfectly to the center of the UI canvas geometry
    const baseX = W / 2;
    const baseY = H / 2;
    const cx = baseX + panRef.current.x;
    const cy = baseY + panRef.current.y;
    const z = zoomRef.current;
    const actualRenderZoom = visualZoomRef ? visualZoomRef.current : z;
    const mapScale = VISUAL_SCALE * actualRenderZoom;
    // ISO = 0.38 compression (angled), Top Down = 1.0 (perfect circles)
    const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;

    const prefs = mapPrefsRef?.current || { mapLineWidth: 1.5, mapOrbitAlpha: 0.33, mapSpeed: 1.0, mapLabelSize: 10, mapGridOpacity: 0.1 };
    const orbitAlphaHex = Math.floor((prefs.mapOrbitAlpha ?? 0.33) * 255).toString(16).padStart(2,'0');

    ctx.clearRect(0,0,W,H);

    // Orbital rings — identical geometric paths as AsteroidsGame
    SOLAR_BODIES.filter(p => p.name !== 'Sun').forEach(planet => {
      const r = planet.worldR * mapScale;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * yRatio, 0, 0, Math.PI*2);
      ctx.strokeStyle = planet.color ? planet.color + orbitAlphaHex : `rgba(255,255,255,${prefs.mapOrbitAlpha})`;
      ctx.lineWidth = prefs.mapLineWidth ?? 1.2;
      ctx.stroke();
    });

    // Planets — dynamic sync with live game kinematics
    const t = Date.now();
    let selPlanetX = 0;
    let selPlanetY = 0;

    SOLAR_BODIES.filter(p => p.name !== 'Sun').forEach((planet, i) => {
      const angle = planet.baseAngle + (t * planet.orbSpeed) * (prefs.mapSpeed ?? 1.0) / 16.67;
      const r = planet.worldR * mapScale;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r * yRatio; // ellipse compression
      // Scale visual planet sizes similarly to game node
      const ps = Math.max(10, (planet.r / 10) * actualRenderZoom * 1.5);
      const isHov = hoveredPlanet === planet.name;
      const isSel = selectedPlanet?.name === planet.name;

      drawPlanet(ctx, px, py, ps, planet);

      if (isSel) {
          selPlanetX = px;
          selPlanetY = py;
      }

      // Selection ring
      if (isHov || isSel) {
        ctx.beginPath(); ctx.arc(px, py, ps+4, 0, Math.PI*2);
        ctx.strokeStyle = isSel ? '#ffffff' : planet.color || '#fff';
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Label (AU distance + name)
      const labelScale = Math.max(0.6, Math.min(1.5, actualRenderZoom * 1.5));
      const baseLabelSize = prefs?.mapLabelSize ?? 12;
      const fontSize = Math.max(9, baseLabelSize * labelScale);
      
      const labelY = py - ps - 8;
      
      ctx.textAlign = 'center';
      ctx.font = `bold ${fontSize}px "Courier New",monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${planet.name.toUpperCase()} — ${planet.au.toFixed(2)} AU`, px, labelY);
    });

    // ── Fleet Ships Locator Markers ──
    if (fleetPositionsRef && fleetPositionsRef.current) {
       fleetPositionsRef.current.forEach(ship => {
           // We scale coordinates out to match the physical spread of the engine
           const mapScaleX = ship.x * 24.0 * mapScale;
           const mapScaleY = ship.y * 24.0 * mapScale * yRatio;
           const shipX = cx + mapScaleX;
           const shipY = cy + mapScaleY;

           if (ship.isPlayer && selectedPlanet && selPlanetX !== 0) {
               ctx.save();
               ctx.beginPath();
               ctx.moveTo(shipX, shipY);
               ctx.lineTo(selPlanetX, selPlanetY);
               ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
               ctx.lineWidth = Math.max(1, 2 * actualRenderZoom);
               ctx.setLineDash([10 * Math.max(1, actualRenderZoom), 8 * Math.max(1, actualRenderZoom)]);
               ctx.lineDashOffset = -Date.now() * 0.02; // Animate line sweeping inward
               ctx.stroke();
               ctx.restore();
           }
           
           if (ship.isPlayer) {
               const SONAR_PERIOD = 80;
               for (let ring = 0; ring < 3; ring++) {
                 const phase =
                   ((Date.now() * 0.05 + (ring * SONAR_PERIOD) / 3) % SONAR_PERIOD) /
                   SONAR_PERIOD;
                 const ringR = Math.max(0, phase * 60 * actualRenderZoom);
                 const alpha = (1 - phase) * 0.7;
                 ctx.save();
                 ctx.globalAlpha = alpha;
                 ctx.strokeStyle = ship.color;
                 ctx.lineWidth = 1.5;
                 ctx.beginPath();
                 ctx.arc(shipX, shipY, ringR, 0, Math.PI * 2);
                 ctx.stroke();
                 ctx.restore();
               }
           }
           
           // Core Ship dot
           ctx.save();
           const isHov = hoveredShipId === ship.id;
           const isSel = selectedShipId === ship.id;
           if (isHov || isSel) {
               ctx.beginPath(); ctx.arc(shipX, shipY, Math.max(2, 4 * actualRenderZoom) + 6, 0, Math.PI * 2);
               ctx.strokeStyle = isSel ? '#ffffff' : ship.color;
               ctx.lineWidth = 1.5; ctx.stroke();
           }
           ctx.fillStyle = ship.color;
           ctx.beginPath();
           ctx.arc(shipX, shipY, Math.max(2, 4 * actualRenderZoom), 0, Math.PI * 2);
           ctx.fill();
           ctx.restore();
    
           // Label
           if (actualRenderZoom > 0.4 && ship.isPlayer) {
             ctx.save();
             ctx.globalAlpha = 0.9;
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.font = `800 ${Math.max(9, 11 * actualRenderZoom)}px "Courier New",monospace`;
             ctx.strokeStyle = "rgba(0,0,0,0.8)";
             ctx.lineWidth = 3;
             ctx.strokeText("YOU", shipX, shipY);
             ctx.fillStyle = "#ffffff";
             ctx.fillText("YOU", shipX, shipY);
             ctx.restore();
           }
       });
    }

  }, [hoveredPlanet, hoveredShipId, selectedPlanet, selectedShipId, viewMode, fleetPositionsRef, visualZoomRef]);

  // ─── Hit test ─────────────────────────────────────────────
  const getPlanetPositions = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return [];
    const W=canvas.width, H=canvas.height;
    const baseX = W / 2;
    const baseY = H / 2;
    const cx=baseX+panRef.current.x, cy=baseY+panRef.current.y;
    const z=zoomRef.current;
    const actualRenderZoom = visualZoomRef ? visualZoomRef.current : z;
    const mapScale = VISUAL_SCALE * actualRenderZoom;
    const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;
    const t=Date.now();
    return SOLAR_BODIES.filter(p => p.name !== 'Sun').map((planet,i)=>{
      const angle = planet.baseAngle + (t * planet.orbSpeed) / 16.67; 
      const r = planet.worldR * mapScale;
      return { planet, x:cx+Math.cos(angle)*r, y:cy+Math.sin(angle)*r*yRatio, r:Math.max(10,(planet.r / 10)*z*1.5) };
    });
  },[viewMode]);

  const getShipPositions = useCallback(() => {
    if (!fleetPositionsRef || !fleetPositionsRef.current) return [];
    const canvas = canvasRef.current; if (!canvas) return [];
    const W=canvas.width, H=canvas.height;
    const cx=(W / 2)+panRef.current.x, cy=(H / 2)+panRef.current.y;
    const z=zoomRef.current;
    const actualRenderZoom = visualZoomRef ? visualZoomRef.current : z;
    const mapScale = VISUAL_SCALE * actualRenderZoom;
    const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;
    return fleetPositionsRef.current.map(ship => {
        return { ship, x: cx + ship.x * 24.0 * mapScale, y: cy + ship.y * 24.0 * mapScale * yRatio, r: Math.max(10, 10 * actualRenderZoom) };
    });
  }, [viewMode, fleetPositionsRef, visualZoomRef]);

  const hitTest = useCallback((mx:number,my:number)=>{
    const canvas=canvasRef.current; if(!canvas) return null;
    const rect=canvas.getBoundingClientRect();
    const px=mx-rect.left, py=my-rect.top;
    
    // Check planets
    const positions=getPlanetPositions();
    for(const {planet,x,y,r} of positions){
      if(Math.sqrt((px-x)**2+(py-y)**2)<=r+10) return { type:'planet', target:planet };
    }
    // Check fleets
    const ships=getShipPositions();
    for(const {ship,x,y,r} of ships){
      if(Math.sqrt((px-x)**2+(py-y)**2)<=r+10) return { type:'ship', target:ship };
    }
    return null;
  },[getPlanetPositions, getShipPositions]);

  // ─── Animation loop ───────────────────────────────────────────────────────
  const animRef = useRef<number>(0);
  useEffect(()=>{
    const PAN_FRICTION = 0.95;
    const ZOOM_FRICTION = 0.80; // how quickly zoom momentum bleeds off
    const loop=()=>{

      // Pan inertia
      if(!isDragging.current){
         const mapScale = VISUAL_SCALE * zoomRef.current;
         const yRatio = viewMode === 'topdown' ? 1.0 : 0.38;
         let targetPanX: number | null = null;
         let targetPanY: number | null = null;
         
         if (selectedPlanet) {
           const t=Date.now();
           const angle = selectedPlanet.baseAngle + (t * selectedPlanet.orbSpeed) / 16.67;
           const r = selectedPlanet.worldR * mapScale;
           targetPanX = -Math.cos(angle) * r;
           targetPanY = -Math.sin(angle) * r * yRatio;
         } else if (selectedShipId && fleetPositionsRef && fleetPositionsRef.current) {
           const s = fleetPositionsRef.current.find(sh => sh.id === selectedShipId);
           if (s) {
              targetPanX = -(s.x * 24.0 * mapScale);
              targetPanY = -(s.y * 24.0 * mapScale * yRatio);
           } else {
              setSelectedShipId(null);
           }
         }
         
         if (targetPanX !== null && targetPanY !== null) {
           const dx = targetPanX - panRef.current.x;
           const dy = targetPanY - panRef.current.y;
           // If we are extremely close after coasting, rigidly snap to eliminate orbital trailing lag!
           if (dx * dx + dy * dy < 4) {
               panRef.current.x = targetPanX;
               panRef.current.y = targetPanY;
           } else {
               panRef.current.x += dx * 0.1;
               panRef.current.y += dy * 0.1;
           }
         } else if (isReturningToSun.current) {
           panRef.current.x += (0 - panRef.current.x) * 0.1;
           panRef.current.y += (0 - panRef.current.y) * 0.1;
           const targetZ = visualZoomRef ? 0.22 : 1.0;
           zoomRef.current += (targetZ - zoomRef.current) * 0.1;
           // Replaced condition block
           if (Math.abs(panRef.current.x) < 1 && Math.abs(panRef.current.y) < 1 && Math.abs(zoomRef.current - targetZ) < 0.01) {
              isReturningToSun.current = false;
           }
         } else {
           const {x:vx,y:vy}=velocity.current;
           if(Math.abs(vx)>0.05||Math.abs(vy)>0.05){
             panRef.current={x:panRef.current.x+vx,y:panRef.current.y+vy};
             velocity.current={x:vx*PAN_FRICTION,y:vy*PAN_FRICTION};
           }
         }
      }
      // Zoom inertia — apply accumulated velocity then decay
      if(Math.abs(zoomVelocity.current) > 0.0001){
        isIntroAnimating.current = false; // break entry anim if player takes control
        const oldZoom = zoomRef.current;
        const newZoom = Math.max(0.02, Math.min(4, oldZoom * (1 + zoomVelocity.current)));
        zoomRef.current = newZoom;
        const f = newZoom / oldZoom;
        panRef.current.x *= f;
        panRef.current.y *= f;
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
    const c=canvasRef.current,d=containerRef.current;
    if(!c||!d) return;
    const resize=()=>{
      c.width=d.clientWidth; c.height=d.clientHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(d);
    resize();
    return ()=>ro.disconnect();
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
    
    if(e.buttons>0) {
      if(Math.abs(dx)>3||Math.abs(dy)>3) {
         if(!isDragging.current) {
            isDragging.current=true;
            if(selectedPlanet) setSelectedPlanet(null);
            if(selectedShipId) setSelectedShipId(null);
            isReturningToSun.current=false;
         }
      }
      if(isDragging.current) {
        if (!disableNativeGestures) {
          panRef.current={x:panRef.current.x+dx,y:panRef.current.y+dy};
          const now=Date.now(),dt=Math.max(1,now-prevPointer.current.t);
          velocity.current={x:(e.clientX-prevPointer.current.x)*(16/dt),y:(e.clientY-prevPointer.current.y)*(16/dt)};
        }
        prevPointer.current={x:e.clientX,y:e.clientY,t:Date.now()};
      }
    } else {
      const hit = hitTest(e.clientX,e.clientY);
      setHoveredPlanet(hit?.type==='planet'?hit.target.name:null);
      setHoveredShipId(hit?.type==='ship'?hit.target.id:null);
    }
    lastPointer.current={x:e.clientX,y:e.clientY};
  };
  const onUp=(e:React.PointerEvent)=>{
    if(!isDragging.current){
      velocity.current={x:0,y:0};
      const hit=hitTest(e.clientX,e.clientY);
      if (hit?.type === 'planet') {
         setSelectedShipId(null);
         setSelectedPlanet(p=>{
           if (p?.name !== hit.target.name) setIsInfoExpanded(false);
           const next = p?.name===hit.target.name?null:hit.target;
           isReturningToSun.current = !next;
           if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('arn_camera_focus_planet', { 
                 detail: { planetName: next ? next.name : null } 
              }));
           }
           return next;
         });
      } else if (hit?.type === 'ship') {
         setSelectedPlanet(null);
         setSelectedShipId(id=>{
            const next = id === hit.target.id ? null : hit.target.id;
            isReturningToSun.current = !next;
            return next;
         });
      } else {
         setSelectedPlanet(null);
         setSelectedShipId(null);
         isReturningToSun.current = true;
         if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent('arn_camera_focus_planet', { 
                 detail: { planetName: null } 
             }));
         }
      }
    }
    isDragging.current=false;
  };
  const onWheel=(e:React.WheelEvent)=>{
    if (disableNativeGestures) return;
    // Accumulate zoom impulse — scale by deltaY so trackpads don't stack impulse uncontrollably
    const impulse = -e.deltaY * 0.00015;
    zoomVelocity.current += impulse;
    // Clamp so we can't accumulate past zoom limits
    const projectedZoom = zoomRef.current * Math.pow(1 + zoomVelocity.current, 8);
    if (projectedZoom < 0.02 || projectedZoom > 8) zoomVelocity.current *= 0.3;
  };
  const onTouchMove=(e:React.TouchEvent)=>{
    if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(lastTouchDist.current!==null){
        const oldZoom = zoomRef.current;
        const nz=Math.max(0.02,Math.min(4,oldZoom*dist/lastTouchDist.current));
        zoomRef.current=nz;
        const f = nz / oldZoom;
        panRef.current.x *= f;
        panRef.current.y *= f;
      }
      lastTouchDist.current=dist;
    } else { lastTouchDist.current=null; }
  };

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'transparent', fontFamily:'"Courier New",monospace', overflow:'hidden', position:'relative' }}>
      
      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'12px', background:'transparent', flexShrink:0, zIndex:10, pointerEvents: 'none' }}>
        <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10, letterSpacing:4, fontWeight:700 }}>GALAXY MAP · ALLIANCES SYSTEM · OCTAVE {activeOctave}</div>
      </div>

      {/* MAIN AREA: canvas + floating right sidebar */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* CANVAS (Conditionally muted when used purely as a HUD over native 3D tracking projections) */}
        {!hideCanvas && (
        <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden', touchAction:'none' }}>
          <canvas ref={canvasRef}
            style={{ display:'block', width:'100%', height:'100%', cursor:hoveredPlanet?'pointer':'grab' }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            onTouchMove={onTouchMove} onWheel={onWheel}
          />
        </div>
        )}

        {/* RIGHT SIDEBAR — planet list (floating) */}
        <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', width:230, background:'transparent', maxHeight:'90vh', overflowY:'auto', padding:'8px 0', zIndex:5, pointerEvents: 'inherit' }}>
          {SOLAR_BODIES.filter(p => p.name !== 'Sun').map(planet=>{
            const fc = planet.color || '#4b5563';
            return (
            <div key={planet.name}
              onClick={()=>{
                 setSelectedPlanet(p=>{
                    if (p?.name !== planet.name) setIsInfoExpanded(false);
                    const next = p?.name===planet.name?null:planet;
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('arn_camera_focus_planet', { 
                           detail: { planetName: next ? next.name : null } 
                        }));
                    }
                    return next;
                 });
              }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', background:selectedPlanet?.name===planet.name?'rgba(200,50,50,0.12)':hoveredPlanet===planet.name?'rgba(255,255,255,0.03)':'transparent', borderLeft:selectedPlanet?.name===planet.name?`2px solid ${fc}`:'2px solid transparent', transition:'background 0.1s' }}
              onMouseEnter={()=>setHoveredPlanet(planet.name)}
              onMouseLeave={()=>setHoveredPlanet(null)}
            >
              <div style={{ width:9, height:9, borderRadius:5, background:planet.color, flexShrink:0, boxShadow:`0 0 5px ${planet.color}` }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{planet.name.toUpperCase()}</span>
                </div>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <span style={{ fontSize:7, color:'#334155' }}>{(planet.worldR / 100).toFixed(0)} km Orbit Radius</span>
                </div>
              </div>
            </div>
          )})}
        </div>

        {/* LEFT SIDEBAR — fleet list (floating) */}
        {fleetPositionsRef && fleetPositionsRef.current && (
          <div style={{ position:'absolute', left:20, top:'50%', transform:'translateY(-50%)', width:230, background:'transparent', maxHeight:'90vh', overflowY:'auto', padding:'8px 0', zIndex:5, pointerEvents: 'inherit' }}>
            {fleetPositionsRef.current.map(ship=>{
              const fc = ship.color || '#4b5563';
              const name = ship.isPlayer ? 'YOU' : `DRONE ${ship.id.substring(0,6).toUpperCase()}`;
              return (
              <div key={ship.id}
                onClick={()=>{
                   setSelectedPlanet(null);
                   setSelectedShipId(id=>{
                      return id===ship.id?null:ship.id;
                   });
                }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', cursor:'pointer', background:selectedShipId===ship.id?'rgba(0,136,255,0.12)':hoveredShipId===ship.id?'rgba(255,255,255,0.03)':'transparent', borderLeft:selectedShipId===ship.id?`2px solid ${fc}`:'2px solid transparent', transition:'background 0.1s' }}
                onMouseEnter={()=>setHoveredShipId(ship.id)}
                onMouseLeave={()=>setHoveredShipId(null)}
              >
                <div style={{ width:9, height:9, borderRadius:5, background:ship.color, flexShrink:0, boxShadow:`0 0 5px ${ship.color}` }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                  </div>
                  <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                    <span style={{ fontSize:7, color:'#334155' }}>FLEET ASSET</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* BOTTOM OCTAVE BAR */}
      <div style={{ display:'none' }}>
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

    </div>
  );
}
