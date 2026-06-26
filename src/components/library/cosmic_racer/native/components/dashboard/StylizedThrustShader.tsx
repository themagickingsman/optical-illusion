import React, { useEffect, useRef } from "react";

export default function StylizedThrustShader({ externalEmitsRef, isMissile = false }: { externalEmitsRef: React.MutableRefObject<any[]>, isMissile?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_vel;
      attribute float a_life;
      attribute vec3 a_color;

      uniform vec2 u_resolution;

      varying float v_life;
      varying vec3 v_color;

      void main() {
        v_life = a_life;
        v_color = a_color;

        float age = 1.0 - a_life;
        vec2 p = a_pos + (a_vel * age);
        
        // Add noisy wiggle
        p.x += sin(age * 20.0 + p.y * 0.1) * 6.0;
        p.y += cos(age * 20.0 + p.x * 0.1) * 6.0;

        vec2 clipSpace = (p / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        
        // Hard-fixed size just to prove pixels are being written!
        gl_PointSize = (${isMissile ? "20.0" : "50.0"}) * max(a_life, 0.2);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying float v_life;
      varying vec3 v_color;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }

        // Just draw harsh visible glowing orbs for now to ensure rendering works
        float core = smoothstep(0.5, 0.0, dist);
        
        // Blast stark white into center, hard-mix color to edges
        vec3 finalColor = mix(v_color, vec3(1.0, 1.0, 1.0), core * 2.0);
        
        // Force high alpha
        float alpha = core * v_life;
        
        // Add 0.1 to alpha to force it to show up even faintly if blending is broken
        gl_FragColor = vec4(finalColor, max(alpha, 0.2));
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(shaderProgram, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    const PARTICLE_STRIDE = 8;
    const MAX_PARTICLES = isMissile ? 3000 : 8000;
    const particles = new Float32Array(MAX_PARTICLES * PARTICLE_STRIDE);
    let head = 0;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles, gl.DYNAMIC_DRAW);

    const aPos = gl.getAttribLocation(shaderProgram, "a_pos");
    const aVel = gl.getAttribLocation(shaderProgram, "a_vel");
    const aLife = gl.getAttribLocation(shaderProgram, "a_life");
    const aColor = gl.getAttribLocation(shaderProgram, "a_color");
    const uRes = gl.getUniformLocation(shaderProgram, "u_resolution");

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 32, 0);
    
    gl.enableVertexAttribArray(aVel);
    gl.vertexAttribPointer(aVel, 2, gl.FLOAT, false, 32, 8);
    
    gl.enableVertexAttribArray(aLife);
    gl.vertexAttribPointer(aLife, 1, gl.FLOAT, false, 32, 16);
    
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 32, 20);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for hot plasma!

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    let rafId: number;
    let lastTime = performance.now();

    const loop = (t: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = (t - lastTime) / 1000;
      lastTime = t;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uRes, width, height);

      const emits = externalEmitsRef.current || [];
      const emissionRate = isMissile ? 1 : 4; 
      
      for (let i = 0; i < emits.length; i++) {
        const em = emits[i];
        let r=0, g=229, b=255;
        if (em.color) {
            [r, g, b] = typeof em.color === "string" ? hexToRgb(em.color) : [em.color.r * 255, em.color.g * 255, em.color.b * 255]; 
        }
        
        const normalizedR = r / 255;
        const normalizedG = g / 255;
        const normalizedB = b / 255;

        for (let j = 0; j < emissionRate; j++) {
          const idx = head * PARTICLE_STRIDE;
          particles[idx] = em.x + (Math.random() - 0.5) * 12.0; // Spread origin wider
          particles[idx + 1] = em.y + (Math.random() - 0.5) * 12.0; 
          
          // Directly assign pixels traveled per second natively
          particles[idx + 2] = (em.dx * 12000.0) + (Math.random() - 0.5) * (isMissile ? 30.0 : 80.0); 
          particles[idx + 3] = (em.dy * 12000.0) + (Math.random() - 0.5) * (isMissile ? 30.0 : 80.0); 
          
          particles[idx + 4] = 1.0; 
          particles[idx + 5] = normalizedR;
          particles[idx + 6] = normalizedG;
          particles[idx + 7] = normalizedB;
          
          head = (head + 1) % MAX_PARTICLES;
        }
      }

      const dropRate = dt * (isMissile ? 3.5 : 2.5); 
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const iLife = i * PARTICLE_STRIDE + 4;
        if (particles[iLife] > 0) {
          particles[iLife] = Math.max(0, particles[iLife] - dropRate);
        }
      }

      gl.bufferSubData(gl.ARRAY_BUFFER, 0, particles);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, MAX_PARTICLES);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(shaderProgram);
    };
  }, [isMissile, externalEmitsRef]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none",
        background: "none" // Ensures entirely transparent backbuffer
      }} 
    />
  );
}
