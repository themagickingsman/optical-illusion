import React, { useEffect, useRef, useState } from 'react';
import styles from './LapseSimulation.module.css';

const vs = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;

const fs = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform float uSteps;
uniform float uStepScale;
uniform float uDepth;
uniform float uKickOctaves;
uniform float uColR, uColG, uColB;
uniform float uDepthTint, uIterTint;
uniform float uExposure;
uniform vec3 uAxis;
uniform float uSquash;
uniform float uTilt;

void main() {
    vec2 FC = gl_FragCoord.xy;

    // Squash Y for horizontal feel + tilt camera
    vec2 uv = FC.xy * 2.0 - iResolution.xy;
    uv.y *= uSquash;
    uv.y += uTilt * iResolution.y;

    vec4 o = vec4(0.0);
    float z = 0.0;

    // Normalize rotation axis
    vec3 ax = normalize(uAxis + 1e-6);

    for (float i = 1.0; i <= 100.0; i += 1.0) {
        if (i > uSteps) break;

        vec3 p = z * normalize(vec3(uv, -iResolution.y));
        p.z += uDepth;

        // Rodrigues rotation around configurable axis
        float h = length(p) - iTime;
        vec3 a = mix(dot(ax, p) * ax, p, sin(h)) + cos(h) * cross(ax, p);

        // Quantized kick distortion
        for (float d = 1.0; d <= 15.0; d += 1.0) {
            if (d > uKickOctaves) break;
            a += sin(floor(a * d + 0.5) - iTime).zxy / d;
        }

        float d = uStepScale * length(a.xz);
        z += d;

        // Color: base RGB + depth and iteration tinting
        vec3 col = vec3(uColR, uColG, uColB)
                  + uDepthTint * z * vec3(0.1, 0.3, 0.2)
                  + uIterTint * i * vec3(0.05, 0.1, 0.15);
        o += vec4(col, 1.0) / max(d, 1e-4);

        // Early termination
        if (o.r > 5e4 && o.g > 5e4 && o.b > 5e4) break;
    }

    vec4 v = o / uExposure;
    vec4 e = exp(2.0 * v);
    o = (e - 1.0) / (e + 1.0);

    gl_FragColor = vec4(o.rgb, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

const presets = {
  deep: { axisX: 0.45, axisY: 0.50, axisZ: -0.05, squash: 1.10, tilt: 0.05, steps: 50, stepScale: 0.07, depth: 12.75, kickOctaves: 11, colR: 0.0, colG: 8.0, colB: 6.20, depthTint: 0.40, iterTint: 0.20, exposure: 10000, speed: 0.65, blur: 1.0, resScale: 0.5 },
  storm: { axisX: -1.0, axisY: 0.80, axisZ: 0.0, squash: 0.75, tilt: 0.0, steps: 50, stepScale: 0.17, depth: 2.0, kickOctaves: 15, colR: 0, colG: 0, colB: 7.6, depthTint: 1.5, iterTint: 1.0, exposure: 3500, speed: 0.6, blur: 1.0, resScale: 0.5 },
  arctic: { axisX: -0.15, axisY: -1.0, axisZ: -0.55, squash: 1.10, tilt: 0.0, steps: 50, stepScale: 0.05, depth: 6.0, kickOctaves: 11, colR: 0.0, colG: 4.10, colB: 8.0, depthTint: 2.40, iterTint: 1.0, exposure: 14500, speed: 0.55, blur: 0.5, resScale: 0.5 },
  inferno: { axisX: 0.7, axisY: 0.5, axisZ: 0.0, squash: 0.60, tilt: 0.15, steps: 50, stepScale: 0.12, depth: 6.5, kickOctaves: 9, colR: 8.0, colG: 0.0, colB: 0.1, depthTint: 0.4, iterTint: 0, exposure: 2500, speed: 0.85, blur: 0.0, resScale: 0.5 },
  aurora: { axisX: -0.75, axisY: -0.50, axisZ: -0.55, squash: 2.00, tilt: 0.95, steps: 50, stepScale: 0.20, depth: 3.75, kickOctaves: 11, colR: 0.3, colG: 2.75, colB: 1.5, depthTint: 2.20, iterTint: 0, exposure: 3000, speed: 0.1, blur: 1.50, resScale: 0.5 },
  original: { axisX: 0.0, axisY: 1.0, axisZ: 0.0, squash: 1.0, tilt: 0.0, steps: 50, stepScale: 0.10, depth: 7.0, kickOctaves: 9, colR: 0.0, colG: 0.0, colB: 8.0, depthTint: 1.0, iterTint: 1.0, exposure: 10000, speed: 1.0, blur: 0.0, resScale: 0.5 }
};

class LapseStore {
  params = { ...presets.inferno };
  listeners = new Set<() => void>();
  
  setParams(newParams: typeof presets.inferno) {
    this.params = { ...newParams };
    this.listeners.forEach(l => l());
  }

  saveToLocal() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lapse_custom_preset', JSON.stringify(this.params));
    }
  }

  loadFromLocal() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lapse_custom_preset');
      if (stored) {
        try {
          this.params = { ...this.params, ...JSON.parse(stored) };
          this.listeners.forEach(l => l());
          return true;
        } catch(e){}
      }
    }
    return false;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
export const globalLapseStore = new LapseStore();

export default function LapseSimulation({ showUI = true, cameraOffsets, colorOverride }: { showUI?: boolean, cameraOffsets?: { x: React.MutableRefObject<number>, y: React.MutableRefObject<number> }, colorOverride?: {r: number, g: number, b: number} | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePreset, setActivePreset] = useState<keyof typeof presets | 'custom'>('inferno');
  const [params, setParamsLocal] = useState(globalLapseStore.params);
  const paramsRef = useRef(globalLapseStore.params);
  const colorOverrideRef = useRef(colorOverride);
  colorOverrideRef.current = colorOverride;

  useEffect(() => {
    // 1. Subscribe first to ensure subsequent updates are caught
    const unsubscribe = globalLapseStore.subscribe(() => {
      setParamsLocal(globalLapseStore.params);
      paramsRef.current = globalLapseStore.params;
    });

    // 2. Attempt hydration on client initialization
    if (globalLapseStore.loadFromLocal()) {
      setActivePreset('custom' as any);
    } else {
      // Sync immediately in case it was already mutated by another mounted instance
      setParamsLocal(globalLapseStore.params);
      paramsRef.current = globalLapseStore.params;
    }

    return unsubscribe;
  }, []);

  const setParams = (newParams: any) => {
    globalLapseStore.setParams(newParams);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const prog = gl.createProgram();
    if (!prog) return;

    const vShader = compile(gl, gl.VERTEX_SHADER, vs);
    const fShader = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!vShader || !fShader) return;

    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);

    const u: Record<string, WebGLUniformLocation | null> = {};
    ['iResolution', 'iTime', 'uSteps', 'uStepScale', 'uDepth', 'uKickOctaves',
     'uColR', 'uColG', 'uColB', 'uDepthTint', 'uIterTint', 'uExposure', 'uAxis', 'uSquash', 'uTilt'
    ].forEach(n => u[n] = gl.getUniformLocation(prog, n));

    let frameId: number;
    const startTime = performance.now();

    let currentScale = paramsRef.current.resScale || 0.5; // defaults to highly optimized 50%
    
    // Mutable refs for LERPing so we smoothly slide colors frame by frame without mutating global store
    const curColor = { r: paramsRef.current.colR, g: paramsRef.current.colG, b: paramsRef.current.colB };

    const resize = () => {
      canvas.width = window.innerWidth * currentScale;
      canvas.height = window.innerHeight * currentScale;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    const loop = () => {
      const p = paramsRef.current;
      const time = ((performance.now() - startTime) / 1000) * p.speed;

      if ((p.resScale || 0.5) !== currentScale) {
        currentScale = p.resScale || 0.5;
        resize();
      }
      
      if (colorOverrideRef.current) {
          curColor.r += (colorOverrideRef.current.r * 8.0 - curColor.r) * 0.015;
          curColor.g += (colorOverrideRef.current.g * 8.0 - curColor.g) * 0.015;
          curColor.b += (colorOverrideRef.current.b * 8.0 - curColor.b) * 0.015;
      } else {
          curColor.r += (p.colR - curColor.r) * 0.05;
          curColor.g += (p.colG - curColor.g) * 0.05;
          curColor.b += (p.colB - curColor.b) * 0.05;
      }

      gl.uniform2f(u.iResolution, canvas.width, canvas.height);
      gl.uniform1f(u.iTime, time);
      gl.uniform1f(u.uSteps, p.steps);
      gl.uniform1f(u.uStepScale, p.stepScale);
      gl.uniform1f(u.uDepth, p.depth);
      gl.uniform1f(u.uKickOctaves, p.kickOctaves);
      gl.uniform1f(u.uColR, curColor.r);
      gl.uniform1f(u.uColG, curColor.g);
      gl.uniform1f(u.uColB, curColor.b);
      gl.uniform1f(u.uDepthTint, p.depthTint);
      gl.uniform1f(u.uIterTint, p.iterTint);
      gl.uniform1f(u.uExposure, p.exposure);
      let currentAxisX = p.axisX;
      let currentAxisY = p.axisY;
      
      if (cameraOffsets) {
          currentAxisX += cameraOffsets.x.current * -0.0001; // Scale drift appropriately
          currentAxisY += cameraOffsets.y.current * 0.0001;
      }

      gl.uniform3f(u.uAxis, currentAxisX, currentAxisY, p.axisZ);
      gl.uniform1f(u.uSquash, p.squash);
      gl.uniform1f(u.uTilt, p.tilt);

      canvas.style.filter = p.blur > 0 ? `blur(${p.blur}px)` : 'none';

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const handlePreset = (name: keyof typeof presets) => {
    setActivePreset(name);
    setParams({ ...presets[name] });
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      {/* Settings Overlay */}
      {showUI && (
        <div className={styles.console} style={{ maxHeight: isCollapsed ? '45px' : 'calc(100vh - 32px)', overflow: isCollapsed ? 'hidden' : 'auto', transition: 'max-height 0.3s ease' }}>
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isCollapsed ? '0' : '10px' }}
          >
            <h2 style={{color: '#fff', margin: 0, fontSize: '18px'}}>Lapse Parameters</h2>
            <button style={{background: 'transparent', color: '#fff', border: 'none', fontSize: '18px', cursor: 'pointer'}}>
              {isCollapsed ? '+' : '−'}
            </button>
          </div>
          
          {!isCollapsed && (
            <>
        <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px'}}>
          {(Object.keys(presets) as Array<keyof typeof presets>).map(k => (
            <button 
              key={k} 
              onClick={() => handlePreset(k)}
              style={{
                background: activePreset === k ? '#f43f5e' : '#333',
                color: '#fff', border: 'none', padding: '5px 10px', 
                borderRadius: '4px', cursor: 'pointer', textTransform: 'capitalize', fontSize: '12px'
              }}
            >
              {k}
            </button>
          ))}
            <button 
              onClick={() => { globalLapseStore.saveToLocal(); setActivePreset('custom' as any); }}
              style={{
                background: activePreset === 'custom' ? '#4ade80' : '#22c55e',
                color: '#000', border: 'none', padding: '5px 10px', fontWeight: 'bold',
                borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginLeft: 'auto'
              }}
            >
              Save Custom
            </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr min-content', gap: '8px 12px', alignItems: 'center', fontSize: '11px', overflowY: 'auto', paddingRight: '10px' }}>
          <label>Speed</label>
          <input type="range" min="0" max="3" step="0.05" value={params.speed} onChange={e => { setActivePreset('' as any); setParams({...params, speed: parseFloat(e.target.value)})}} />
          <span>{params.speed.toFixed(2)}</span>

          <label>Axis X</label>
          <input type="range" min="-1" max="1" step="0.05" value={params.axisX} onChange={e => { setActivePreset('' as any); setParams({...params, axisX: parseFloat(e.target.value)})}} />
          <span>{params.axisX.toFixed(2)}</span>

          <label>Axis Y</label>
          <input type="range" min="-1" max="1" step="0.05" value={params.axisY} onChange={e => { setActivePreset('' as any); setParams({...params, axisY: parseFloat(e.target.value)})}} />
          <span>{params.axisY.toFixed(2)}</span>

          <label>Axis Z</label>
          <input type="range" min="-1" max="1" step="0.05" value={params.axisZ} onChange={e => { setActivePreset('' as any); setParams({...params, axisZ: parseFloat(e.target.value)})}} />
          <span>{params.axisZ.toFixed(2)}</span>

          <label>Squash</label>
          <input type="range" min="0.1" max="2" step="0.05" value={params.squash} onChange={e => { setActivePreset('' as any); setParams({...params, squash: parseFloat(e.target.value)})}} />
          <span>{params.squash.toFixed(2)}</span>

          <label>Tilt</label>
          <input type="range" min="-1" max="1" step="0.05" value={params.tilt} onChange={e => { setActivePreset('' as any); setParams({...params, tilt: parseFloat(e.target.value)})}} />
          <span>{params.tilt.toFixed(2)}</span>

          <label>Steps</label>
          <input type="range" min="10" max="100" step="1" value={params.steps} onChange={e => { setActivePreset('' as any); setParams({...params, steps: parseFloat(e.target.value)})}} />
          <span>{params.steps}</span>

          <label>Shader Res</label>
          <input type="range" min="0.1" max="1.0" step="0.05" value={params.resScale} onChange={e => { setActivePreset('' as any); setParams({...params, resScale: parseFloat(e.target.value)})}} />
          <span>{params.resScale.toFixed(2)}</span>

          <label>Scale</label>
          <input type="range" min="0.02" max="0.3" step="0.01" value={params.stepScale} onChange={e => { setActivePreset('' as any); setParams({...params, stepScale: parseFloat(e.target.value)})}} />
          <span>{params.stepScale.toFixed(2)}</span>

          <label>Depth</label>
          <input type="range" min="2" max="15" step="0.25" value={params.depth} onChange={e => { setActivePreset('' as any); setParams({...params, depth: parseFloat(e.target.value)})}} />
          <span>{params.depth.toFixed(2)}</span>

          <label>Octaves</label>
          <input type="range" min="1" max="15" step="1" value={params.kickOctaves} onChange={e => { setActivePreset('' as any); setParams({...params, kickOctaves: parseFloat(e.target.value)})}} />
          <span>{params.kickOctaves}</span>

          <label>R</label>
          <input type="range" min="0" max="8" step="0.1" value={params.colR} onChange={e => { setActivePreset('' as any); setParams({...params, colR: parseFloat(e.target.value)})}} />
          <span>{params.colR.toFixed(1)}</span>
          
          <label>G</label>
          <input type="range" min="0" max="8" step="0.1" value={params.colG} onChange={e => { setActivePreset('' as any); setParams({...params, colG: parseFloat(e.target.value)})}} />
          <span>{params.colG.toFixed(1)}</span>

          <label>B</label>
          <input type="range" min="0" max="8" step="0.1" value={params.colB} onChange={e => { setActivePreset('' as any); setParams({...params, colB: parseFloat(e.target.value)})}} />
          <span>{params.colB.toFixed(1)}</span>

          <label>DepthTint</label>
          <input type="range" min="0" max="3" step="0.1" value={params.depthTint} onChange={e => { setActivePreset('' as any); setParams({...params, depthTint: parseFloat(e.target.value)})}} />
          <span>{params.depthTint.toFixed(1)}</span>

          <label>IterTint</label>
          <input type="range" min="0" max="3" step="0.1" value={params.iterTint} onChange={e => { setActivePreset('' as any); setParams({...params, iterTint: parseFloat(e.target.value)})}} />
          <span>{params.iterTint.toFixed(1)}</span>

          <label>Exposure</label>
          <input type="range" min="100" max="30000" step="100" value={params.exposure} onChange={e => { setActivePreset('' as any); setParams({...params, exposure: parseFloat(e.target.value)})}} />
          <span>{params.exposure}</span>

          <label>Blur</label>
          <input type="range" min="0" max="20" step="0.5" value={params.blur} onChange={e => { setActivePreset('' as any); setParams({...params, blur: parseFloat(e.target.value)})}} />
          <span>{params.blur.toFixed(1)}</span>
        </div>
        </>
      )}
      </div>
     )}
    </div>
  );
}
