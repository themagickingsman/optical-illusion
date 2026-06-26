"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FractalLightmapConfig } from "../../../../../state/stores/EnvironmentStore";

export default function FractalLightmap({ config }: { config: FractalLightmapConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Force cleanup any orphaned canvases from React Fast Refresh
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.Camera;
    let material: THREE.ShaderMaterial;
    let geometry: THREE.BufferGeometry;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const initShader = (noiseTex: THREE.Texture, bgTex: THREE.Texture) => {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.opacity = configRef.current.opacity.toString();
      
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      }

      camera = new THREE.Camera();
      camera.position.z = 1;

      scene = new THREE.Scene();
      geometry = new THREE.PlaneGeometry(2, 2);

      const uniforms = {
        u_time: { value: 1.0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_noise: { value: noiseTex },
        u_bg: { value: bgTex },
        u_mouse: { value: new THREE.Vector2() },
        u_scroll: { value: 0 },
        u_panSpeed: { value: configRef.current.panSpeed },
        u_fractalSpeed: { value: configRef.current.fractalSpeed },
        u_fractalScale: { value: configRef.current.fractalScale },
        u_fractalIntensity: { value: configRef.current.fractalIntensity },
        u_layer1Depth: { value: configRef.current.layer1Depth ?? 0.2 },
        u_layer2Depth: { value: configRef.current.layer2Depth ?? 0.1 },
        u_cloudColour: { value: new THREE.Color().setStyle(configRef.current.cloudColor || '#2b1b4d') },
        u_lightColour: { value: new THREE.Color().setStyle(configRef.current.lightColor || '#5c9ce6') }
      };

      material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          void main() {
              gl_Position = vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform vec2 u_resolution;
          uniform vec2 u_mouse;
          uniform float u_time;
          uniform sampler2D u_noise;
          uniform sampler2D u_bg;
          uniform float u_scroll;
          
          uniform float u_panSpeed;
          uniform float u_fractalSpeed;
          uniform float u_fractalScale;
          uniform float u_fractalIntensity;
          uniform float u_layer1Depth;
          uniform float u_layer2Depth;
          uniform vec3 u_cloudColour;
          uniform vec3 u_lightColour;
          
          float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
          vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
          vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

          float noise(vec3 p){
              vec3 a = floor(p);
              vec3 d = p - a;
              d = d * d * (3.0 - 2.0 * d);

              vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
              vec4 k1 = perm(b.xyxy);
              vec4 k2 = perm(k1.xyxy + b.zzww);

              vec4 c = k2 + a.zzzz;
              vec4 k3 = perm(c);
              vec4 k4 = perm(c + 1.0);

              vec4 o1 = fract(k3 * (1.0 / 41.0));
              vec4 o2 = fract(k4 * (1.0 / 41.0));

              vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
              vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

              return o4.y * d.y + o4.x * (1.0 - d.y);
          }

          void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
            uv *= u_fractalScale; // Globally scale the entire fractal projection
            
            // Fractal Speed modifies the time passed to the noise functions
            float nt = u_time * u_fractalSpeed;
            float pt = u_time * u_panSpeed;
            
            float noise1 = noise(vec3(uv * 3.0 * noise(vec3(uv * 3.0 + 100., nt * 3. + 10.)), nt * 2.))  * 2.;
            
            float noise2 = noise(vec3(uv + 2.35, nt * 1.357 - 10.));
            
            uv.y -= u_scroll * .0001;
            
            // Pan Speed modifies the time passed to the texture lookups
            uv += texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .05, 1.) - .5 * .05).rg * 0.08 + noise1 * .008 * (1. - clamp(noise1 * noise1 * 2. + .2, 0., 1.));
            
            vec3 tex = texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .02, 1.) - .5).rgb;
            
            uv.y -= u_scroll * .0001;
            vec3 tex1 = texture2D(u_bg, uv * vec2(.5, 1.) - vec2(pt * .08, 1.)).rgb;
            
            uv.y -= u_scroll * .0001;
            vec3 tex2 = texture2D(u_bg, (uv * .8 + .5) * vec2(.5, 1.) - vec2(pt * .1, 1.)).rgb;
            
            vec3 fragcolour = tex;
            
            float shade = tex.r;
            shade *= clamp(noise1 * noise2 * sin(nt * 3.), .2, 10.);
            shade += shade * shade * u_fractalIntensity;
            shade -= (1. - clamp(tex1 * 4., 0., 1.).r) * u_layer1Depth;
            shade -= (1. - clamp(tex2 * 4., 0., 1.).r) * u_layer2Depth;
            
            fragcolour = mix(u_cloudColour, u_lightColour, shade);

            gl_FragColor = vec4(fragcolour, 1.);
          }
        `,
        transparent: true,
        // Using Normal blending so CSS mixBlendMode handles the compositing
        blending: THREE.NormalBlending, 
        depthWrite: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const clock = new THREE.Clock();

      function animate() {
        if (!material || !renderer) return;
        
        // If disabled, skip the GPU render entirely
        if (!configRef.current.enabled) {
          renderer.domElement.style.display = 'none';
          animationFrameId = requestAnimationFrame(animate);
          return;
        }
        renderer.domElement.style.display = 'block';
        
        // clock.getElapsedTime() is in seconds.
        const t = clock.getElapsedTime() * 0.5;
        material.uniforms.u_time.value = t;
        
        material.uniforms.u_panSpeed.value = configRef.current.panSpeed;
        material.uniforms.u_fractalSpeed.value = configRef.current.fractalSpeed;
        material.uniforms.u_fractalScale.value = configRef.current.fractalScale;
        material.uniforms.u_fractalIntensity.value = configRef.current.fractalIntensity;
        material.uniforms.u_layer1Depth.value = configRef.current.layer1Depth ?? 0.2;
        material.uniforms.u_layer2Depth.value = configRef.current.layer2Depth ?? 0.1;
        material.uniforms.u_cloudColour.value.setStyle(configRef.current.cloudColor || '#2b1b4d');
        material.uniforms.u_lightColour.value.setStyle(configRef.current.lightColor || '#5c9ce6');
        renderer.domElement.style.opacity = configRef.current.opacity.toString();
        
        const resScale = configRef.current.resolutionScale || 0.5;
        const targetPixelRatio = Math.min(window.devicePixelRatio, 2) * resScale;
        if (renderer.getPixelRatio() !== targetPixelRatio) {
          renderer.setPixelRatio(targetPixelRatio);
        }
        
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      }
      animate();
    };

    // Load Textures
    let texture: THREE.Texture;
    let bg: THREE.Texture;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    
    loader.load(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png',
      (tex) => {
        texture = tex;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        loader.load(
          'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/clouds-1-tile.jpg',
          (tex2) => {
            bg = tex2;
            bg.wrapS = THREE.RepeatWrapping;
            bg.wrapT = THREE.RepeatWrapping;
            bg.minFilter = THREE.LinearFilter;
            initShader(texture, bg);
          }
        );
      }
    );

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !material) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      material.uniforms.u_resolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer && containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (texture) texture.dispose();
      if (bg) bg.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }} />;
}
