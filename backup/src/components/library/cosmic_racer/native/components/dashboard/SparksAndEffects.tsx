"use client";

import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const roundedSquareZ = new Float32Array([
  0, 0, 0,
  0, 1, 0,
  1, 1, 0,
  1, 0, 0,
  0, 0, 0
]);

interface ParticleSystemProps {
  count?: number;
  speedMult?: number;
  radiusMult?: number;
  color?: string;
}

const ParticleSystem = ({ count = 2500, speedMult = 1, radiusMult = 1, color = "#00e5ff" }: ParticleSystemProps) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const time = Math.random() * 100;
        const factor = 20 + Math.random() * 100;
        const speed = 0.01 + Math.random() / 200;
        const x = Math.random() * 200 - 100;
        const y = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;

        temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
        let { time, factor, speed, x, y, z } = particle;

        time = particle.time += (speed / 2) * speedMult;
        
        // Complex swirling motion
        const s = Math.cos(time);
        const c = Math.sin(time);

        dummy.position.set(
            (x + s * factor) * radiusMult,
            (y + c * factor) * radiusMult,
            (z + (Math.sin(time * 2) * factor) / 4) * radiusMult
        );
        
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(s * 5, c * 5, 0);
        dummy.updateMatrix();

        mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </>
  );
};

export interface SparksConfig {
  particleCount: number;
  speedMult: number;
  radiusMult: number;
  bloomIntensity: number;
  color: string;
}

export const SparksAndEffects = ({ config }: { config?: Partial<SparksConfig> }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const activeConfig = {
    particleCount: 1500,
    speedMult: 1.0,
    radiusMult: 1.0,
    bloomIntensity: 1.5,
    color: "#00e5ff",
    ...config
  };

  return (
    <div style={{ width: "100%", height: "100%", background: "#050511" }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }} frameloop={isVisible ? "always" : "demand"}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <ParticleSystem 
          count={activeConfig.particleCount} 
          speedMult={activeConfig.speedMult} 
          radiusMult={activeConfig.radiusMult}
          color={activeConfig.color}
        />
        
        {/* The signature Sparks & Effects post-processing glow */}
        <EffectComposer>
            <Bloom 
                luminanceThreshold={0.2} 
                mipmapBlur 
                intensity={activeConfig.bloomIntensity} 
            />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
