"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

import { SmokeConfig } from "../../../../../state/stores/EnvironmentStore";

export default function Smoke({ config }: { config: SmokeConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);

  // Keep the config ref updated without restarting WebGL
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Setup Renderer
    // Force cleanup any orphaned canvases from React Fast Refresh
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(width, height);
    // Limit pixel ratio for heavy full-screen shaders
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    containerRef.current.appendChild(renderer.domElement);

    // 2. Setup Scene & Orthographic Camera for Full-Screen Shader
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // 3. Immersive Volumetric FBM Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor: { value: new THREE.Color().setHSL(configRef.current.hue / 360.0, 0.4, 0.5) },
        uSpeed: { value: configRef.current.speed },
        uScale: { value: configRef.current.scale },
        uDensity: { value: configRef.current.density },
        uWarp: { value: configRef.current.warp },
        uContrast: { value: configRef.current.contrast },
        uBrightness: { value: configRef.current.brightness },
        uDrift: { value: new THREE.Vector2(configRef.current.driftX, configRef.current.driftY) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uColor;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uDensity;
        uniform float uWarp;
        uniform float uContrast;
        uniform float uBrightness;
        uniform vec2 uDrift;

        // Standard hash for noise
        float hash(vec2 p) {
            vec3 p3  = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        // Smooth value noise
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        // Fractal Brownian Motion
        float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            // Rotate to reduce axial bias
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < 6; ++i) {
                v += a * noise(x);
                x = rot * x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            // Normalize coordinates and fix aspect ratio
            vec2 uv = gl_FragCoord.xy / uResolution.y; 
            uv *= 2.5 * uScale; // Scale of the smoke clouds
            
            // Allow directional panning + time drift
            vec2 tDir = uDrift * uTime * 0.05 * uSpeed;
            float t = uTime * 0.12 * uSpeed; 
            
            // Domain warping for organic, fluid-like wisps
            vec2 q = vec2(fbm(uv + tDir), fbm(uv + vec2(5.2,1.3) + tDir));
            
            // Warp strength controlled by uWarp
            vec2 r = vec2(fbm(uv + uWarp*q + vec2(1.7,9.2) + tDir*1.2), fbm(uv + uWarp*q + vec2(8.3,2.8) + tDir*0.8));
            
            // Final noise field
            float f = fbm(uv + uWarp*r + tDir*1.5);
            
            // Apply true contrast mathematically
            f = clamp((f - 0.5) * uContrast + 0.5, 0.0, 1.0);
            
            // Color mapping with dynamic brightness
            vec3 col = uColor * uBrightness;
            col = mix(col * 0.1, col, f); // Use the contrasted noise to darken the gaps
            
            // Subtle bright highlights where the clouds compress
            col = mix(col, vec3(1.0), clamp(length(q)*length(r)*0.15, 0.0, 1.0)); 
            
            // Soft alpha based on fog density
            float alpha = smoothstep(0.15, 0.95, f);
            
            // Output with max opacity controlled by density
            float finalAlpha = alpha * 0.8 * uDensity;
            
            // Pre-multiply RGB by alpha for correct browser compositing
            gl_FragColor = vec4(col * finalAlpha, finalAlpha); 
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    // 4. Animate Loop
    function animate() {
      material.uniforms.uTime.value = clock.getElapsedTime();
      // Dynamically tint based on the editor slider without restarting the renderer
      material.uniforms.uColor.value.setHSL(configRef.current.hue / 360.0, 0.4, 0.55);
      material.uniforms.uSpeed.value = configRef.current.speed;
      material.uniforms.uScale.value = configRef.current.scale;
      material.uniforms.uDensity.value = configRef.current.density;
      material.uniforms.uWarp.value = configRef.current.warp;
      material.uniforms.uContrast.value = configRef.current.contrast;
      material.uniforms.uBrightness.value = configRef.current.brightness;
      material.uniforms.uDrift.value.set(configRef.current.driftX, configRef.current.driftY);
      
      const resScale = configRef.current.resolutionScale || 0.5;
      const targetPixelRatio = Math.min(window.devicePixelRatio, 2) * resScale;
      if (renderer.getPixelRatio() !== targetPixelRatio) {
        renderer.setPixelRatio(targetPixelRatio);
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    // 5. Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer && containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }} />;
}
