import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function hash(x: number, y: number): number {
    let h = Math.imul(x ^ 0x5E6A, 0x9E3779B1) + Math.imul(y ^ 0x2A15, 0x85EBCA6B);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296.0;
}

function noise(x: number, y: number): number {
    let ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    let s = fx * fx * (3 - 2 * fx), t = fy * fy * (3 - 2 * fy);
    let n00 = hash(ix, iy), n10 = hash(ix + 1, iy);
    let n01 = hash(ix, iy + 1), n11 = hash(ix + 1, iy + 1);
    return n00 * (1 - s) * (1 - t) + n10 * s * (1 - t) + n01 * (1 - s) * t + n11 * s * t;
}

interface InstanceData {
    spawnX: number;
    spawnY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
    start: number;
    duration: number;
    size: number;
    drag: number;
}

export default function FlowFieldInstancedMap({ seed, colors }: { seed: number, colors: string[] }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const planeSize = 8192;
    const step = 80; // Distance between polka dots
    
    // Grid generation ensures we uniformly populate the entire map logically
    const particles = useMemo(() => {
        const arr: InstanceData[] = [];
        for (let x = -planeSize / 2; x < planeSize / 2; x += step) {
            for (let y = -planeSize / 2; y < planeSize / 2; y += step) {
                // Introduce slight variance so it's organic
                const ox = x + step * 0.5;
                const oy = y + step * 0.5;
                arr.push({
                    spawnX: ox, spawnY: oy,
                    x: ox, y: oy,
                    vx: 0, vy: 0,
                    ax: 0, ay: 0,
                    start: 0, duration: 0,
                    size: 0, drag: 0
                });
            }
        }
        return arr;
    }, []);

    const count = particles.length;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const colorArray = useMemo(() => new Float32Array(count * 3), [count]);
    const parsedColors = useMemo(() => colors.map(c => new THREE.Color(c)), [colors]);

    const sys = useMemo(() => ({
        flow: 50.0,         // Increased drastically to account for huge 8192 world scale physics
        topSpeed: 800.0, 
        lifeSpan: 2000,
        flowOffset: seed * 5.0,
        gravity: { dir: 90, force: 0 },
        fieldStep: 200
    }), [seed]);

    const initParticle = (p: InstanceData, i: number, timeNow: number) => {
        p.size = step * 0.35 * (0.5 + Math.random());
        p.start = timeNow;
        p.x = p.spawnX; 
        p.y = p.spawnY;
        p.vx = 0; p.vy = 0;
        p.ax = 0; p.ay = 0;
        p.duration = sys.lifeSpan * (0.2 + Math.random() * 1.0);
        p.drag = 0.9 + Math.random() * 0.08;
        
        let ang = Math.random() * Math.PI * 2;
        let mag = Math.random() * 150; // Initial burst to separate the polka grid cleanly
        p.ax += Math.cos(ang) * mag;
        p.ay += Math.sin(ang) * mag;

        // Assign mesh vertex colors only once deeply
        const c = parsedColors[Math.floor(Math.random() * parsedColors.length)];
        colorArray[i * 3 + 0] = c.r;
        colorArray[i * 3 + 1] = c.g;
        colorArray[i * 3 + 2] = c.b;
    };

    useEffect(() => {
        const timeNow = performance.now();
        for (let i = 0; i < count; i++) {
            initParticle(particles[i], i, timeNow);
        }
        if (meshRef.current) {
            meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, [colors, seed]);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        
        const timeNow = performance.now();
        const gravX = Math.cos(sys.gravity.dir * Math.PI / 180) * sys.gravity.force;
        const gravY = Math.sin(sys.gravity.dir * Math.PI / 180) * sys.gravity.force;
        
        for (let i = 0; i < count; i++) {
            const p = particles[i];
            
            let age = timeNow - p.start;
            
            p.ax += gravX; 
            p.ay += gravY;
            
            // Map coordinates identically into the flow field
            let fx = p.x - (p.x % sys.fieldStep);
            let fy = p.y - (p.y % sys.fieldStep);
            
            // Noise calculation dynamically at huge layout scale
            let ang = noise((fx + seed*100) * 0.001, (fy + seed*100) * 0.001) * Math.PI * 4;
            ang += sys.flowOffset;
            
            p.ax += Math.cos(ang) * sys.flow;
            p.ay += Math.sin(ang) * sys.flow;
            
            p.vx += p.ax; p.vy += p.ay;
            
            let speed = Math.hypot(p.vx, p.vy);
            if (speed > sys.topSpeed) { 
                p.vx = (p.vx / speed) * sys.topSpeed; 
                p.vy = (p.vy / speed) * sys.topSpeed; 
            }
            p.vx *= p.drag; 
            p.vy *= p.drag;
            
            // Delta T integration scalar
            p.x += p.vx * 0.016; 
            p.y += p.vy * 0.016;
            p.ax = 0; 
            p.ay = 0;
            
            // Reset if dead or completely out of plane matrix
            if (p.x > planeSize/2 || p.x < -planeSize/2 || p.y > planeSize/2 || p.y < -planeSize/2 || age > p.duration) {
                initParticle(p, i, timeNow);
                age = 0;
                meshRef.current.instanceColor!.needsUpdate = true; // Mark buffer for update if colors shift on death
            }

            // Calculate optical scaling natively
            let s = 1.0;
            if (age < p.duration * 0.1) {
                s = age / (p.duration * 0.1);
            } else if (age > p.duration * 0.5) {
                s = 1.0 - (age - p.duration * 0.5) / (p.duration * 0.5);
            }
            
            let scaleMut = s * (0.5 + (speed / sys.topSpeed) * 0.7);
            
            // Set InstancedMatrix Native Transforms
            // Note: Since PlanetSurfaceEngine Group is Rotated -Math.PI/2, world Z is technically 0 and we push Y
            dummy.position.set(p.x, p.y, 0.5); 
            dummy.scale.setScalar(Math.max(0.1, p.size * scaleMut));
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={1}>
            <circleGeometry args={[1, 16]} />
            <meshBasicMaterial transparent opacity={0.8} />
            <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
        </instancedMesh>
    );
}
