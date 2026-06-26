'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  SEBLAGUE FLUID SIM — 3D port (Episode-01 logic, WebGL rendering)
//  Kernels:   SpikyPow2 (density) + SpikyPow3 (near-density)
//  Approach:  Predicted-position semi-implicit integration
//  Source:    github.com/SebLague/Fluid-Sim/tree/Episode-01
// ─────────────────────────────────────────────────────────────────────────────

// ─── Simulation Parameters (matching SebLague's tuned values) ──────────────
const N               = 2000;
const SMOOTHING_R     = 0.35;       // smoothingRadius
const H               = SMOOTHING_R;
const H2              = H * H;
const MASS            = 1.0;
const TARGET_DENSITY  = 55.0;       // targetDensity
const PRESSURE_MULT   = 500.0;      // pressureMultiplier
const NEAR_PRESS_MULT = 18.0;       // nearPressureMultiplier
const VISCOSITY_STR   = 0.06;       // viscosityStrength
const GRAVITY         = -9.8;
const DT              = 1 / 120;    // iterationsPerFrame=2, so 2 × 1/120 ≈ 60fps
const BOUND           = 1.4;        // boundsSize half-extent
const COLLISION_DAMP  = 0.95;       // collisionDamping (SebLague uses 0.95)
const PI              = Math.PI;

// ─── SebLague Kernel Functions (3D) ─────────────────────────────────────────
// SpikyPow2 — used for density
const DK_SCALE   = 15 / (2 * PI * Math.pow(H, 5));
function densityKernel(dst: number): number {
  if (dst >= H) return 0;
  const v = H - dst; return v * v * DK_SCALE;
}
function densityDerivative(dst: number): number {
  if (dst >= H) return 0;
  return -(H - dst) * (15 / (Math.pow(H, 5) * PI));
}
// SpikyPow3 — used for near-density (anti-clustering)
const NDK_SCALE  = 15 / (PI * Math.pow(H, 6));
function nearDensityKernel(dst: number): number {
  if (dst >= H) return 0;
  const v = H - dst; return v * v * v * NDK_SCALE;
}
function nearDensityDerivative(dst: number): number {
  if (dst >= H) return 0;
  const v = H - dst;
  return -v * v * (45 / (Math.pow(H, 6) * PI));
}
// Viscosity smoothing (SmoothingKernelPoly6)
const VK_SCALE = 315 / (64 * PI * Math.pow(H, 9));
function viscosityKernel(dst: number): number {
  if (dst >= H) return 0;
  const v = H2 - dst*dst; return v * v * v * VK_SCALE;
}

// ─── Pressure from density ───────────────────────────────────────────────────
function pressureFromDensity(d: number): number {
  return (d - TARGET_DENSITY) * PRESSURE_MULT;
}
function nearPressureFromDensity(nd: number): number {
  return nd * NEAR_PRESS_MULT;
}

// ─── Simulation State ────────────────────────────────────────────────────────
const px  = new Float32Array(N); const py  = new Float32Array(N); const pz  = new Float32Array(N);
const ppx = new Float32Array(N); const ppy = new Float32Array(N); const ppz = new Float32Array(N);
const vx  = new Float32Array(N); const vy  = new Float32Array(N); const vz  = new Float32Array(N);
const den = new Float32Array(N); const nden = new Float32Array(N);
const spd = new Float32Array(N);
const nbuf = new Int32Array(6000);

function resetSim() {
  const side = Math.ceil(Math.cbrt(N));
  const spacing = H * 0.9;
  let i = 0;
  outer: for (let a = 0; a < side; a++)
    for (let b = 0; b < side; b++)
      for (let c = 0; c < side; c++) {
        if (i >= N) break outer;
        px[i] = (-side * 0.5 + a + 0.5) * spacing + (Math.random()-0.5) * 0.002;
        py[i] = -BOUND * 0.8 + b * spacing  + (Math.random()-0.5) * 0.002;
        pz[i] = (-side * 0.5 + c + 0.5) * spacing + (Math.random()-0.5) * 0.002;
        vx[i] = vy[i] = vz[i] = 0;
        i++;
      }
}

// ─── Spatial Hash ────────────────────────────────────────────────────────────
const CELL = H;
const hc = (v: number) => Math.floor(v / CELL);
const hkey = (x: number, y: number, z: number) =>
  (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

function buildHash(): Map<number, number[]> {
  const m = new Map<number, number[]>();
  for (let i = 0; i < N; i++) {
    const k = hkey(hc(ppx[i]), hc(ppy[i]), hc(ppz[i]));
    let a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(i);
  }
  return m;
}

function queryN(ox: number, oy: number, oz: number, m: Map<number, number[]>): number {
  let cnt = 0;
  const cx = hc(ox), cy = hc(oy), cz = hc(oz);
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        const a = m.get(hkey(cx+dx, cy+dy, cz+dz));
        if (a) for (const j of a) if (cnt < 5999) nbuf[cnt++] = j;
      }
  return cnt;
}

// ─── Rigid Bodies ────────────────────────────────────────────────────────────
interface Body { x:number; y:number; z:number; vx:number; vy:number; vz:number; r:number; mass:number; color:[number,number,number,number]; }
let bodies: Body[] = [];
let bid = 0;
function addBody(type: 'sphere'|'box') {
  const r = type === 'sphere' ? 0.12 : 0.09;
  bodies.push({ x:(Math.random()-0.5)*BOUND*0.8, y: BOUND*0.9, z:(Math.random()-0.5)*BOUND*0.8,
    vx:0, vy:0, vz:0, r, mass: type==='sphere' ? 0.25 : 0.7,
    color: type==='sphere'?[1.0,0.55,0.1,1]:[0.2,1.0,0.5,1]
  });
  bid++;
}

// ─── Tilt / Shake Impulse ────────────────────────────────────────────────────
const tilt = { ax: 0, ay: 0, az: 0 };

// ─── Main SPH Step (SebLague algorithm) ─────────────────────────────────────
function sphStep(gravMult: number, viscMult: number) {
  const g = GRAVITY * gravMult;

  // 1. Apply gravity, predict positions
  for (let i = 0; i < N; i++) {
    vy[i] += g * DT;
    // Tilt impulse as extra acceleration
    vx[i] += tilt.ax * DT;
    vy[i] += tilt.ay * DT;
    vz[i] += tilt.az * DT;
    ppx[i] = px[i] + vx[i] * DT;
    ppy[i] = py[i] + vy[i] * DT;
    ppz[i] = pz[i] + vz[i] * DT;
  }

  // 2. Spatial hash on predicted positions
  const hash = buildHash();

  // 3. Compute density and near-density (on predicted positions)
  for (let i = 0; i < N; i++) {
    let d = 0, nd = 0;
    const cnt = queryN(ppx[i], ppy[i], ppz[i], hash);
    for (let n = 0; n < cnt; n++) {
      const j = nbuf[n];
      const dx = ppx[j]-ppx[i], dy = ppy[j]-ppy[i], dz = ppz[j]-ppz[i];
      const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
      d  += MASS * densityKernel(r);
      nd += MASS * nearDensityKernel(r);
    }
    den[i]  = d;
    nden[i] = nd;
  }

  // 4. Pressure force
  for (let i = 0; i < N; i++) {
    const p_i  = pressureFromDensity(den[i]);
    const np_i = nearPressureFromDensity(nden[i]);
    let fpx=0, fpy=0, fpz=0;
    const cnt = queryN(ppx[i], ppy[i], ppz[i], hash);
    for (let n = 0; n < cnt; n++) {
      const j = nbuf[n]; if (j === i) continue;
      const dx=ppx[j]-ppx[i], dy=ppy[j]-ppy[i], dz=ppz[j]-ppz[i];
      const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (r < 1e-5 || r >= H) continue;
      const invR = 1/r;
      const nx=dx*invR, ny=dy*invR, nz=dz*invR;
      const p_j  = pressureFromDensity(den[j]);
      const np_j = nearPressureFromDensity(nden[j]);
      const sharedP  = (p_i + p_j)  * 0.5;
      const sharedNP = (np_i + np_j) * 0.5;
      const slope    = densityDerivative(r);
      const nslope   = nearDensityDerivative(r);
      const rhoJ     = Math.max(den[j], 1e-3);
      const mag      = (sharedP * slope + sharedNP * nslope) * MASS / rhoJ;
      fpx += mag * nx; fpy += mag * ny; fpz += mag * nz;
    }
    const rhoI = Math.max(den[i], 1e-3);
    vx[i] += fpx / rhoI * DT;
    vy[i] += fpy / rhoI * DT;
    vz[i] += fpz / rhoI * DT;
  }

  // 5. Viscosity
  const vStr = VISCOSITY_STR * viscMult;
  for (let i = 0; i < N; i++) {
    let fx=0, fy=0, fz=0;
    const cnt = queryN(ppx[i], ppy[i], ppz[i], hash);
    for (let n = 0; n < cnt; n++) {
      const j = nbuf[n]; if (j===i) continue;
      const dx=ppx[j]-ppx[i], dy=ppy[j]-ppy[i], dz=ppz[j]-ppz[i];
      const r=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if (r >= H) continue;
      const infl = viscosityKernel(r);
      fx += (vx[j]-vx[i])*infl;
      fy += (vy[j]-vy[i])*infl;
      fz += (vz[j]-vz[i])*infl;
    }
    vx[i] += fx * vStr * DT;
    vy[i] += fy * vStr * DT;
    vz[i] += fz * vStr * DT;
  }

  // 6. Integrate + boundary (SebLague uses collisionDamping on velocity flip)
  for (let i = 0; i < N; i++) {
    px[i] += vx[i] * DT;
    py[i] += vy[i] * DT;
    pz[i] += vz[i] * DT;
    if(px[i]<-BOUND){px[i]=-BOUND;vx[i]*=-COLLISION_DAMP;}
    if(px[i]> BOUND){px[i]= BOUND;vx[i]*=-COLLISION_DAMP;}
    if(py[i]<-BOUND){py[i]=-BOUND;vy[i]*=-COLLISION_DAMP;}
    if(py[i]> BOUND){py[i]= BOUND;vy[i]*=-COLLISION_DAMP;}
    if(pz[i]<-BOUND){pz[i]=-BOUND;vz[i]*=-COLLISION_DAMP;}
    if(pz[i]> BOUND){pz[i]= BOUND;vz[i]*=-COLLISION_DAMP;}
    spd[i] = Math.sqrt(vx[i]*vx[i]+vy[i]*vy[i]+vz[i]*vz[i]);
  }

  // 7. Rigid body physics
  for (const b of bodies) {
    let submergedVol = 0, fluidVx=0, fluidVy=0, fluidVz=0, fc=0;
    for (let i = 0; i < N; i++) {
      const dx=px[i]-b.x, dy=py[i]-b.y, dz=pz[i]-b.z;
      const r2 = dx*dx + dy*dy + dz*dz;
      if (r2 < b.r*b.r*4) { submergedVol++; fluidVx+=vx[i]; fluidVy+=vy[i]; fluidVz+=vz[i]; fc++; }
      // Collision repulsion
      if (r2 < b.r*b.r && r2 > 1e-6) {
        const r=Math.sqrt(r2), push=(b.r-r)/r*0.6;
        vx[i]+=dx*push; vy[i]+=dy*push; vz[i]+=dz*push;
      }
    }
    if (fc>0) { fluidVx/=fc; fluidVy/=fc; fluidVz/=fc; }
    const buoyancy = submergedVol * MASS * Math.abs(g) * 0.5;
    b.vy += DT * ((buoyancy / b.mass) + g - 8*(b.vy-fluidVy));
    b.vx += DT * (-8*(b.vx-fluidVx));
    b.vz += DT * (-8*(b.vz-fluidVz));
    b.x+=DT*b.vx; b.y+=DT*b.vy; b.z+=DT*b.vz;
    const bn = BOUND - b.r;
    if(b.x<-bn){b.x=-bn;b.vx*=-0.4;} if(b.x>bn){b.x=bn;b.vx*=-0.4;}
    if(b.y<-bn){b.y=-bn;b.vy*=-0.4;} if(b.y>bn){b.y=bn;b.vy*=-0.4;}
    if(b.z<-bn){b.z=-bn;b.vz*=-0.4;} if(b.z>bn){b.z=bn;b.vz*=-0.4;}
  }

  // Decay tilt
  tilt.ax *= 0.85; tilt.ay *= 0.85; tilt.az *= 0.85;
}

// ─────────────────────────────────────────────────────────────────────────────
//  WEBGL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function mkProg(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const comp = (t: number, s: string) => {
    const sh = gl.createShader(t)!; gl.shaderSource(sh,s); gl.compileShader(sh);
    if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, comp(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, comp(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p); return p;
}
function perspective(fov:number, asp:number, n:number, f:number): Float32Array {
  const t=1/Math.tan(fov*PI/360), nf=1/(n-f);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
}
function lookAt(ex:number,ey:number,ez:number): Float32Array {
  let fx=-ex,fy=-ey,fz=-ez;
  const fl=Math.sqrt(fx*fx+fy*fy+fz*fz); fx/=fl;fy/=fl;fz/=fl;
  // right = forward × up
  let rx=fy*0-fz*1, ry=fz*0-fx*0, rz=fx*1-fy*0;
  // right = fz,0,-fx
  rx=fz; ry=0; rz=-fx;
  const rl=Math.sqrt(rx*rx+ry*ry+rz*rz)||1; rx/=rl;ry/=rl;rz/=rl;
  const ux=fy*rz-fz*ry, uy=fz*rx-fx*rz, uz=fx*ry-fy*rx;
  return new Float32Array([
    rx,ux,-fx,0, ry,uy,-fy,0, rz,uz,-fz,0,
    -(rx*ex+ry*ey+rz*ez), -(ux*ex+uy*ey+uz*ez), fx*ex+fy*ey+fz*ez, 1
  ]);
}
function mul4(a:Float32Array,b:Float32Array): Float32Array {
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}
  return o;
}
function boxWire(s:number): Float32Array {
  return new Float32Array([
    -s,-s,-s, s,-s,-s,  s,-s,-s, s,s,-s,  s,s,-s,-s,s,-s,  -s,s,-s,-s,-s,-s,
    -s,-s, s, s,-s, s,  s,-s, s, s,s, s,  s,s, s,-s,s, s,  -s,s, s,-s,-s, s,
    -s,-s,-s,-s,-s, s,  s,-s,-s, s,-s, s,  s,s,-s, s,s, s, -s,s,-s,-s,s, s,
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHADERS
// ─────────────────────────────────────────────────────────────────────────────
// Velocity colormap: still=dark blue, slow=blue, fast=cyan, very fast=white
// Matches SebLague's gradient texture (cold=navy, warm=cyan, hot=white)
const VS_FLUID = `
attribute vec3 aPos;
attribute float aSpeed;
uniform mat4 uMVP;
uniform float uPS;
varying float vSpeed;
void main(){
  vec4 clip = uMVP * vec4(aPos, 1.0);
  gl_Position  = clip;
  gl_PointSize = clamp(uPS / clip.w, 3.0, 72.0);
  vSpeed = aSpeed;
}`;

const FS_FLUID = `
precision mediump float;
varying float vSpeed;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // Smooth circle edge
  float alpha = 1.0 - smoothstep(0.38, 0.50, d);
  // Sphere normal for diffuse lighting
  vec3 N = normalize(vec3(c * 2.0, sqrt(max(0.0, 1.0 - 4.0*dot(c,c)))));
  vec3 L = normalize(vec3(0.4, 1.0, 0.6));
  float diff = 0.25 + 0.75 * max(dot(N, L), 0.0);
  float spec = pow(max(dot(reflect(-L,N), vec3(0,0,1)), 0.0), 24.0) * 0.55;
  // SebLague velocity colormap
  float t = clamp(vSpeed / 6.0, 0.0, 1.0);
  vec3 col0 = vec3(0.02, 0.12, 0.80);  // still   — dark blue
  vec3 col1 = vec3(0.00, 0.60, 1.00);  // medium  — blue
  vec3 col2 = vec3(0.00, 0.90, 1.00);  // fast    — cyan
  vec3 col3 = vec3(0.90, 0.97, 1.00);  // v.fast  — near-white
  vec3 col;
  if (t < 0.33)      col = mix(col0, col1, t / 0.33);
  else if (t < 0.66) col = mix(col1, col2, (t-0.33)/0.33);
  else               col = mix(col2, col3, (t-0.66)/0.34);
  gl_FragColor = vec4(col * diff + spec, alpha * 0.91);
}`;

const VS_WIRE=`attribute vec3 aPos;uniform mat4 uMVP;void main(){gl_Position=uMVP*vec4(aPos,1.0);}`;
const FS_WIRE=`precision mediump float;uniform vec4 uCol;void main(){gl_FragColor=uCol;}`;
const VS_BODY=`attribute vec3 aPos;uniform mat4 uMVP;uniform float uPS;void main(){vec4 p=uMVP*vec4(aPos,1.0);gl_Position=p;gl_PointSize=clamp(uPS/p.w,8.0,300.0);}`;
const FS_BODY=`
precision mediump float;uniform vec4 uCol;
void main(){
  vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;
  vec3 N=normalize(vec3(c*2.0,sqrt(max(0.0,1.0-4.0*dot(c,c)))));
  vec3 L=normalize(vec3(0.4,1.0,0.6));
  float diff=0.25+0.75*max(dot(N,L),0.0);
  float spec=pow(max(dot(reflect(-L,N),vec3(0,0,1)),0.0),20.0)*0.45;
  gl_FragColor=vec4(uCol.rgb*diff+spec,1.0);
}`;

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function LiquidPhysicsEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gravRef   = useRef(1.0);
  const viscRef   = useRef(1.0);
  const camRef    = useRef({ theta: 0.5, phi: 1.1, dist: 3.5 });
  const mouseRef  = useRef({ left:false, right:false, lx:0, ly:0 });
  const fpsRef    = useRef({ cnt:0, last:0, val:0 });
  const [fps, setFps]       = useState(0);
  const [bodyCnt, setBodyCnt] = useState(0);
  const [gravDir, setGravDir] = useState<'down'|'zero'|'up'>('down');
  const [visc, setVisc]       = useState(1.0);

  useEffect(()=>{ gravRef.current = gravDir==='down'?1:gravDir==='up'?-1:0; },[gravDir]);
  useEffect(()=>{ viscRef.current = visc; },[visc]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const gl = canvas.getContext('webgl',{antialias:true,alpha:false,premultipliedAlpha:false});
    if (!gl) return;

    resetSim(); bodies=[]; bid=0;

    const fluidProg = mkProg(gl, VS_FLUID, FS_FLUID);
    const wireProg  = mkProg(gl, VS_WIRE,  FS_WIRE);
    const bodyProg  = mkProg(gl, VS_BODY,  FS_BODY);

    const fluidBuf  = gl.createBuffer()!;
    const speedBuf  = gl.createBuffer()!;
    const wireBuf   = gl.createBuffer()!;
    const bodyBuf   = gl.createBuffer()!;
    const wireData  = boxWire(BOUND);
    const fluidData = new Float32Array(N * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, wireBuf);
    gl.bufferData(gl.ARRAY_BUFFER, wireData, gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.01, 0.02, 0.09, 1.0);

    function resize(){
      canvas!.width  = canvas!.clientWidth;
      canvas!.height = canvas!.clientHeight;
      gl!.viewport(0,0,canvas!.width,canvas!.height);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    let raf: number;
    function frame() {
      fpsRef.current.cnt++;
      const now = performance.now();
      if (now - fpsRef.current.last > 600) {
        fpsRef.current.val = Math.round(fpsRef.current.cnt*1000/(now-fpsRef.current.last));
        fpsRef.current.cnt=0; fpsRef.current.last=now;
        setFps(fpsRef.current.val);
      }

      // 2 sub-steps per frame (matches SebLague's iterationsPerFrame=2)
      sphStep(gravRef.current, viscRef.current);
      sphStep(gravRef.current, viscRef.current);

      const cam = camRef.current;
      const ex = cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta);
      const ey = cam.dist * Math.cos(cam.phi);
      const ez = cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta);
      const asp = canvas!.width / canvas!.height;
      const mvp = mul4(perspective(55, asp, 0.05, 30), lookAt(ex,ey,ez));

      gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

      // Wire box
      gl!.useProgram(wireProg);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, wireBuf);
      const wl=gl!.getAttribLocation(wireProg,'aPos');
      gl!.enableVertexAttribArray(wl);
      gl!.vertexAttribPointer(wl,3,gl!.FLOAT,false,0,0);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(wireProg,'uMVP'),false,mvp);
      gl!.uniform4f(gl!.getUniformLocation(wireProg,'uCol'),0.06,0.35,0.85,0.4);
      gl!.drawArrays(gl!.LINES,0,wireData.length/3);

      // Fluid
      for(let i=0;i<N;i++){ fluidData[i*3]=px[i]; fluidData[i*3+1]=py[i]; fluidData[i*3+2]=pz[i]; }
      gl!.useProgram(fluidProg);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, fluidBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, fluidData, gl!.DYNAMIC_DRAW);
      const fl=gl!.getAttribLocation(fluidProg,'aPos');
      gl!.enableVertexAttribArray(fl);
      gl!.vertexAttribPointer(fl,3,gl!.FLOAT,false,0,0);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, speedBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, spd, gl!.DYNAMIC_DRAW);
      const sl=gl!.getAttribLocation(fluidProg,'aSpeed');
      gl!.enableVertexAttribArray(sl);
      gl!.vertexAttribPointer(sl,1,gl!.FLOAT,false,0,0);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(fluidProg,'uMVP'),false,mvp);
      gl!.uniform1f(gl!.getUniformLocation(fluidProg,'uPS'), 32.0);
      gl!.drawArrays(gl!.POINTS,0,N);

      // Bodies
      if(bodies.length>0){
        gl!.useProgram(bodyProg);
        const bl=gl!.getAttribLocation(bodyProg,'aPos');
        for(const b of bodies){
          gl!.bindBuffer(gl!.ARRAY_BUFFER, bodyBuf);
          gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([b.x,b.y,b.z]), gl!.DYNAMIC_DRAW);
          gl!.enableVertexAttribArray(bl);
          gl!.vertexAttribPointer(bl,3,gl!.FLOAT,false,0,0);
          gl!.uniformMatrix4fv(gl!.getUniformLocation(bodyProg,'uMVP'),false,mvp);
          gl!.uniform1f(gl!.getUniformLocation(bodyProg,'uPS'),b.r*1400);
          gl!.uniform4fv(gl!.getUniformLocation(bodyProg,'uCol'),new Float32Array(b.color));
          gl!.drawArrays(gl!.POINTS,0,1);
        }
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const onMouseDown = useCallback((e:React.MouseEvent)=>{
    mouseRef.current={left:e.button===0,right:e.button===2,lx:e.clientX,ly:e.clientY};
  },[]);
  const onMouseMove = useCallback((e:React.MouseEvent)=>{
    const m=mouseRef.current;
    if(!m.left&&!m.right) return;
    const dx=e.clientX-m.lx, dy=e.clientY-m.ly;
    if(m.left){
      const th=camRef.current.theta, str=25;
      tilt.ax += (-dx*Math.cos(th) - dy*Math.sin(th)*0.3)*str;
      tilt.ay += dy*str*0.4;
      tilt.az += ( dx*Math.sin(th) - dy*Math.cos(th)*0.3)*str;
    }
    if(m.right){
      camRef.current.theta -= dx*0.008;
      camRef.current.phi = Math.max(0.15,Math.min(PI-0.15,camRef.current.phi-dy*0.008));
    }
    m.lx=e.clientX; m.ly=e.clientY;
  },[]);
  const onMouseUp    = useCallback(()=>{ mouseRef.current={left:false,right:false,lx:0,ly:0}; },[]);
  const onContextMenu= useCallback((e:React.MouseEvent)=>e.preventDefault(),[]);
  const onWheel      = useCallback((e:React.WheelEvent)=>{
    camRef.current.dist=Math.max(1.5,Math.min(7.0,camRef.current.dist+e.deltaY*0.005));
  },[]);
  const doAddBody = useCallback((t:'sphere'|'box')=>{ addBody(t); setBodyCnt(bodies.length); },[]);
  const doReset   = useCallback(()=>{ resetSim(); bodies=[]; bid=0; setBodyCnt(0); tilt.ax=tilt.ay=tilt.az=0; },[]);

  const CY='#00d4ff';
  const panel:React.CSSProperties={
    background:'rgba(2,5,18,0.93)',border:'1px solid rgba(0,212,255,0.18)',
    borderRadius:'14px',padding:'0.85rem 1.05rem',backdropFilter:'blur(16px)',
  };
  const btn:React.CSSProperties={
    padding:'0.3rem 0.72rem',borderRadius:'8px',fontFamily:'monospace',
    fontSize:'0.71rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.05em',
    border:'1px solid rgba(0,212,255,0.32)',background:'rgba(0,212,255,0.07)',color:CY,transition:'all 0.18s',
  };
  const aBtn=(a:boolean):React.CSSProperties=>({
    ...btn,
    background:a?'rgba(0,212,255,0.17)':btn.background,
    borderColor:a?CY:'rgba(0,212,255,0.22)',
    boxShadow:a?`0 0 8px rgba(0,212,255,0.3)`:'none',
  });

  return (
    <div style={{position:'relative',width:'100%',height:'calc(100vh - 80px)',background:'#010209',overflow:'hidden'}}>
      <canvas ref={canvasRef}
        style={{width:'100%',height:'100%',display:'block',cursor:'crosshair'}}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onContextMenu={onContextMenu} onWheel={onWheel}
      />

      {/* TOP LEFT */}
      <div style={{position:'absolute',top:'1.2rem',left:'1.2rem',...panel}}>
        <div style={{fontSize:'9px',letterSpacing:'0.18em',color:CY,fontFamily:'monospace',fontWeight:700,marginBottom:4}}>
          PHYSICS ENGINE · SPH FLUID SIM
        </div>
        <div style={{fontSize:'1.1rem',fontWeight:800,color:'#ddf0ff',letterSpacing:'-0.02em'}}>
          3D Liquid Simulation
        </div>
        <div style={{fontSize:'0.65rem',color:'#334155',fontFamily:'monospace',marginTop:5,lineHeight:1.7}}>
          <span style={{color:'#475569'}}>h =</span> <span style={{color:CY}}>{H.toFixed(2)}</span>
          {'  '}<span style={{color:'#475569'}}>ρ₀ =</span> <span style={{color:CY}}>{TARGET_DENSITY}</span>
          {'  '}<span style={{color:'#475569'}}>N =</span> <span style={{color:CY}}>{N.toLocaleString()}</span>
        </div>
        <div style={{marginTop:'0.5rem',display:'flex',gap:'1rem',alignItems:'center'}}>
          <span style={{fontSize:'0.7rem',color:fps>30?'#10b981':'#f59e0b',fontFamily:'monospace',fontWeight:700}}>{fps} FPS</span>
          <span style={{fontSize:'0.68rem',color:'#64748b',fontFamily:'monospace'}}>{bodyCnt} object{bodyCnt!==1?'s':''}</span>
        </div>
      </div>

      {/* TOP RIGHT */}
      <div style={{position:'absolute',top:'1.2rem',right:'1.2rem',...panel,display:'flex',flexDirection:'column',gap:'0.7rem',minWidth:'198px'}}>
        <div style={{fontSize:'9px',letterSpacing:'0.16em',color:CY,fontFamily:'monospace',fontWeight:700}}>
          SIMULATION CONTROLS
        </div>

        <div>
          <div style={{fontSize:'0.66rem',color:'#64748b',fontFamily:'monospace',marginBottom:'0.3rem',letterSpacing:'0.08em'}}>GRAVITY</div>
          <div style={{display:'flex',gap:'0.3rem'}}>
            {(['down','zero','up'] as const).map(g=>(
              <button key={g} style={aBtn(gravDir===g)} onClick={()=>setGravDir(g)}>
                {g==='down'?'▼':g==='up'?'▲':'✦'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{fontSize:'0.66rem',color:'#64748b',fontFamily:'monospace',marginBottom:'0.3rem',letterSpacing:'0.08em'}}>
            VISCOSITY <span style={{color:CY}}>{visc.toFixed(1)}×</span>
          </div>
          <input type="range" min="0.1" max="6" step="0.1" value={visc}
            onChange={e=>setVisc(parseFloat(e.target.value))}
            style={{width:'100%',accentColor:CY}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.59rem',color:'#475569',fontFamily:'monospace'}}>
            <span>Water</span><span>Honey</span><span>Tar</span>
          </div>
        </div>

        <div>
          <div style={{fontSize:'0.66rem',color:'#64748b',fontFamily:'monospace',marginBottom:'0.3rem',letterSpacing:'0.08em'}}>ADD OBJECT</div>
          <div style={{display:'flex',gap:'0.3rem'}}>
            <button style={btn} onClick={()=>doAddBody('sphere')}>⬤ Sphere</button>
            <button style={btn} onClick={()=>doAddBody('box')}>■ Cube</button>
          </div>
        </div>

        <button style={{...btn,borderColor:'rgba(239,68,68,0.35)',color:'#f87171',background:'rgba(239,68,68,0.06)'}}
          onClick={doReset}>↺ RESET</button>
      </div>

      <div style={{position:'absolute',bottom:'1rem',left:'50%',transform:'translateX(-50%)',
        fontSize:'0.61rem',color:'rgba(100,116,139,0.6)',fontFamily:'monospace',letterSpacing:'0.1em',
        background:'rgba(2,5,18,0.5)',padding:'0.3rem 0.85rem',borderRadius:'99px',
        border:'1px solid rgba(255,255,255,0.04)'}}>
        LEFT-DRAG: SHAKE &nbsp;·&nbsp; RIGHT-DRAG: ORBIT &nbsp;·&nbsp; SCROLL: ZOOM
      </div>
    </div>
  );
}
