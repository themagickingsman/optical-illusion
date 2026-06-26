import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Particles.css';

interface ParticlesProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  minSize?: number;
  maxSize?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
  pixelRatio?: number;
  className?: string;
  cameraOffsetRef?: React.MutableRefObject<{ x: number, y: number }>;
  parallaxMultiplier?: number;
  globalOpacity?: number;
}

const defaultColors: string[] = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = (hex: string): [number, number, number] => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec4 random;
  attribute vec3 customColor;

  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  uniform vec2 uOffset;

  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vRandom = random;
    vColor = customColor;

    vec3 pos = position;
    
    // Bounds check to evaluate native viewport limits without GPU stretching
    // Collapsed the extreme scattering multiplier so the points fit densely inside the camera lens!
    float spreadX = uSpread * 1.5;
    float spreadY = uSpread * 1.0;
    
    // Infinite Parallax Wrap-Around perfectly outside viewport bounds
    pos.x = mod(pos.x + uOffset.x + spreadX, spreadX * 2.0) - spreadX;
    pos.y = mod(pos.y + uOffset.y + spreadY, spreadY * 2.0) - spreadY;

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

    vec4 mvPos = viewMatrix * mPos;
    float finalSize = uBaseSize;
    if (uSizeRandomness > 0.0) {
      finalSize = uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5));
    }
    // Divide by 20 mathematically to offset the missing perspective division roughly aligned with the camera
    gl_PointSize = finalSize / 20.0;

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uAlphaParticles;
  uniform float uOpacity;
  varying vec4 vRandom;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));

    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0 * uOpacity);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle * uOpacity);
    }
  }
`;

const Particles: React.FC<ParticlesProps> = ({
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleColors,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 100,
  sizeRandomness = 1,
  minSize,
  maxSize,
  cameraDistance = 20,
  disableRotation = false,
  pixelRatio = 1,
  className,
  cameraOffsetRef,
  parallaxMultiplier,
  globalOpacity
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false
    });
    renderer.setPixelRatio(pixelRatio);
    container.appendChild(renderer.domElement);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(15, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = cameraDistance;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    // Natively observe the DOM boundaries in case the React paint is delayed
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    window.addEventListener('resize', resize, false);
    setTimeout(resize, 50); // Guarantee proper initial frame scaling

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
    };

    if (moveParticlesOnHover) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    const MAX_PARTICLES = 10000;
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const randoms = new Float32Array(MAX_PARTICLES * 4);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

    const spreadX = particleSpread * 1.5;
    const spreadY = particleSpread * 1.0;
    const spreadZ = particleSpread * 5.0;

    for (let i = 0; i < MAX_PARTICLES; i++) {
        // Natively plot the vertices across the viewable frustum during compilation so the GPU has 0 stress.
        positions.set([
            (Math.random() * 2 - 1) * spreadX, 
            (Math.random() * 2 - 1) * spreadY, 
            (Math.random() * 2 - 1) * spreadZ
        ], i * 3);
        
        randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
        const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
        colors.set(col, i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 4));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    
    // Initial draw range
    geometry.setDrawRange(0, particleCount);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: particleSpread },
        uBaseSize: { value: ((minSize !== undefined && maxSize !== undefined) ? (minSize + maxSize) / 2 : particleBaseSize) * pixelRatio },
        uSizeRandomness: { value: (minSize !== undefined && maxSize !== undefined && (minSize + maxSize) > 0) ? (maxSize - minSize) / ((minSize + maxSize) / 2) : sizeRandomness },
        uAlphaParticles: { value: alphaParticles ? 1 : 0 },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uOpacity: { value: globalOpacity !== undefined ? globalOpacity : 1.0 }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false, // Performance optimization
      blending: THREE.NormalBlending // Normal blending bypasses the compositing budget overflow that occurs when additive canvases stack
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Persist refs for live-updates!
    (container as any)._particlesEngine = { geometry, material, camera };

    let animationFrameId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    const update = (t: number) => {
      animationFrameId = requestAnimationFrame(update);
      const delta = t - lastTime;
      lastTime = t;
      // Read raw speed off the latest ref attached to the DOM so it stays live inside closure
      const currentSpeed = (container as any)._liveSpeed ?? speed;
      elapsed += delta * currentSpeed;

      material.uniforms.uTime.value = elapsed * 0.001;
      
      if (cameraOffsetRef?.current) {
          // Accumulate the delta per-frame into the global uniform rather than setting absolute
          // The baseline factor produces the parallax depth effect relative to foreground movement speed
          const dx = Number.isFinite(cameraOffsetRef.current.x) ? cameraOffsetRef.current.x : 0;
          const dy = Number.isFinite(cameraOffsetRef.current.y) ? cameraOffsetRef.current.y : 0;
          
          const currentParallax = (container as any)._liveParallax ?? parallaxMultiplier ?? 0.02;
          
          let newX = material.uniforms.uOffset.value.x - dx * currentParallax;
          let newY = material.uniforms.uOffset.value.y + dy * currentParallax;

          // Prevent catastrophic floating point precision loss on the GPU by wrapping natively in JS!
          const spreadX = particleSpread * 1.5 * 2.0; 
          const spreadY = particleSpread * 1.0 * 2.0;
          newX = newX % spreadX;
          newY = newY % spreadY;

          material.uniforms.uOffset.value.x = newX;
          material.uniforms.uOffset.value.y = newY;
      }

      if (moveParticlesOnHover) {
        particles.position.x = -mouseRef.current.x * particleHoverFactor;
        particles.position.y = -mouseRef.current.y * particleHoverFactor;
      } else {
        particles.position.x = 0;
        particles.position.y = 0;
      }

      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * currentSpeed;
      }

      renderer.render(scene, camera);
    };

    update(performance.now()); // kick off loop

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      if (moveParticlesOnHover && container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      geometry.dispose();
      material.dispose();
      renderer.forceContextLoss(); // MANUALLY FORCE SAFARI VRAM CLEAR TO PREVENT 16-CONTEXT CRASH LOOP
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Engine only spins up once securely

  // Live uniform updates for CMS config panels
  useEffect(() => {
    if (containerRef.current) {
        const engine = (containerRef.current as any)._particlesEngine;
        if (engine) {
            const derivedBaseSize = (minSize !== undefined && maxSize !== undefined) ? (minSize + maxSize) / 2 : particleBaseSize;
            const derivedRandomness = (minSize !== undefined && maxSize !== undefined && derivedBaseSize > 0) ? (maxSize - minSize) / derivedBaseSize : sizeRandomness;
            engine.material.uniforms.uBaseSize.value = derivedBaseSize * pixelRatio;
            engine.material.uniforms.uSizeRandomness.value = derivedRandomness;
            engine.material.uniforms.uAlphaParticles.value = alphaParticles ? 1 : 0;
            engine.material.uniforms.uSpread.value = particleSpread;
            engine.camera.position.z = cameraDistance;
            engine.geometry.setDrawRange(0, particleCount);
            engine.material.uniforms.uOpacity.value = globalOpacity !== undefined ? globalOpacity : 1.0;
            (containerRef.current as any)._liveSpeed = speed;
            (containerRef.current as any)._liveParallax = parallaxMultiplier;
        }
    }
  }, [particleBaseSize, pixelRatio, sizeRandomness, minSize, maxSize, alphaParticles, particleSpread, cameraDistance, particleCount, speed, parallaxMultiplier, globalOpacity]);

  return <div ref={containerRef} className={`particles-container ${className || ''}`} />;
};

export default Particles;
