'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GlowingSunConfig {
  sunColor: string;
  sunSize: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  starCount: number;
  starRotationSpeed: number;
  cameraZ: number;
  // Background gradient (matches Asteroid Command look)
  bgAngle: number;   // degrees, 0-360
  bgC1: string;      // stop 0%
  bgC2: string;      // stop 50%
  bgC3: string;      // stop 100%
  bgAlpha: number;   // 0-1
  sunDetail: number; // icosahedron subdivisions
}

export const GLOWING_SUN_DEFAULTS: GlowingSunConfig = {
  sunColor: '#FDB813',
  sunSize: 1.0,
  bloomStrength: 2.0,
  bloomRadius: 0.4,
  bloomThreshold: 0.0,
  starCount: 8000,
  starRotationSpeed: 0.0008,
  cameraZ: 8,
  // Asteroid Command deep-space blue
  bgAngle: 135,
  bgC1: '#050511',
  bgC2: '#1a1a40',
  bgC3: '#0d0d2b',
  bgAlpha: 1.0,
  sunDetail: 15,
};

// ─── Sun sphere ───────────────────────────────────────────────────────────────

function Sun({ color, size, detail }: { color: string; size: number; detail: number }) {
  // Only rebuild the Color object when the hex string actually changes
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  return (
    // key forces R3F to destroy + recreate the geometry when size/detail change
    <mesh key={`sun-${size}-${detail}`} position={[0, 0, 0]}>
      <icosahedronGeometry args={[size, detail]} />
      <meshBasicMaterial color={colorObj} />
    </mesh>
  );
}

// ─── Star field ──────────────────────────────────────────────────────────────

function StarField({ count, rotationSpeed }: { count: number; rotationSpeed: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Keep rotationSpeed in a ref so the animation loop always sees the latest
  // value without needing to restart or recreate anything
  const speedRef = useRef(rotationSpeed);
  useEffect(() => { speedRef.current = rotationSpeed; }, [rotationSpeed]);

  // Star positions only recompute when the COUNT changes — not on every render
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 70 + Math.random() * 10;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame(() => {
    if (pointsRef.current) pointsRef.current.rotation.y += speedRef.current;
  });

  return (
    // key forces buffer recreation when count changes (new Float32Array size)
    <points ref={pointsRef} key={`stars-${count}`}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.15}
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  );
}

// ─── Camera sync ──────────────────────────────────────────────────────────────

function CameraSync({ z }: { z: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.z = z;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix?.();
  }, [camera, z]);
  return null;
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ cfg }: { cfg: GlowingSunConfig }) {
  return (
    <>
      <CameraSync z={cfg.cameraZ} />
      <ambientLight intensity={0.1} />
      <Sun color={cfg.sunColor} size={cfg.sunSize} detail={cfg.sunDetail} />
      <StarField count={cfg.starCount} rotationSpeed={cfg.starRotationSpeed} />
      <EffectComposer>
        <Bloom
          intensity={cfg.bloomStrength}
          kernelSize={KernelSize.LARGE}
          luminanceThreshold={cfg.bloomThreshold}
          luminanceSmoothing={cfg.bloomRadius}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

// Build a CSS linear-gradient string from the config
function buildBg(cfg: GlowingSunConfig): string {
  const a = cfg.bgAlpha ?? 1;
  if (a <= 0) return 'transparent';
  // Convert hex → rgba so bgAlpha applies
  const toRgba = (hex: string) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  return `linear-gradient(${cfg.bgAngle}deg, ${toRgba(cfg.bgC1)} 0%, ${toRgba(cfg.bgC2)} 50%, ${toRgba(cfg.bgC3)} 100%)`;
}

export default function GlowingSun({ cfg = GLOWING_SUN_DEFAULTS }: { cfg?: GlowingSunConfig }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: buildBg(cfg) }}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 0, cfg.cameraZ] }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene cfg={cfg} />
      </Canvas>
    </div>
  );
}
