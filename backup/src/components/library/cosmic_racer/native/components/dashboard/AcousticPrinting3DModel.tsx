import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Html, Circle } from '@react-three/drei';
import * as THREE from 'three';

interface ParametricDims {
    harvesterOuterRadius: number;
    harvesterInnerRadius: number;
    meshPitch: number;
    meshThickness: number;
    pipeLength: number;
    pipeOuterRadius: number;
    pipeInnerRadius: number;
}

interface Props {
    componentType?: string;
    material?: string; // e.g. "Titanium", "Copper", "Gold"
    params?: ParametricDims;
}

const MATERIAL_COLORS: Record<string, string> = {
    Titanium: "#f1f5f9",
    Copper: "#fbbf24",
    Gold: "#fef08a"
};

const PrinterDevice = ({ componentType = "HarvesterNode", material = "Titanium", params }: Props) => {
    const groupRef = useRef<THREE.Group>(null);
    const sonotrodeRef = useRef<THREE.Mesh>(null);
    
    // Create transducer array positions for a spherical phased array
    const transducerPositions = useMemo(() => {
        const positions = [];
        const radius = 2.5;
        const numTheta = 12; // vertical slices
        const numPhi = 24; // horizontal slices
        
        for (let i = 0; i < numTheta; i++) {
            const theta = (i / numTheta) * Math.PI; // 0 to PI
            for (let j = 0; j < numPhi; j++) {
                const phi = (j / numPhi) * Math.PI * 2; // 0 to 2PI
                
                // Skip the direct top and bottom to leave room for the nozzle and sonotrode
                if (theta < Math.PI * 0.15 || theta > Math.PI * 0.85) continue;

                const x = radius * Math.sin(theta) * Math.cos(phi);
                const y = radius * Math.cos(theta);
                const z = radius * Math.sin(theta) * Math.sin(phi);
                
                positions.push(new THREE.Vector3(x, y, z));
            }
        }
        return positions;
    }, []);

    // Animate sonotrode sweeping
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (sonotrodeRef.current) {
            sonotrodeRef.current.position.x = Math.sin(time * 0.8) * 1.5;
        }
    });

    const matColor = MATERIAL_COLORS[material] || "#ffffff";

    // Destructure default param fallbacks just in case
    const p = params || {
        harvesterOuterRadius: 65,
        harvesterInnerRadius: 40,
        meshPitch: 25,
        meshThickness: 3.14,
        pipeLength: 180,
        pipeOuterRadius: 40,
        pipeInnerRadius: 30
    };

    // Global scale factor to map mm to Three.js viewport units (2.5 chamber radius)
    // 100mm -> 2.0 units => scale = 0.02
    const S = 0.02;

    const renderParametricComponent = () => {
        if (componentType === "HarvesterNode") {
            const rOut = p.harvesterOuterRadius * S;
            const rIn = p.harvesterInnerRadius * S;
            return (
                <group position={[0, 0, 0]}>
                    <Sphere args={[rOut, 32, 32]}>
                        <meshStandardMaterial color={matColor} metalness={0.9} roughness={0.1} transparent opacity={0.4} />
                    </Sphere>
                    <Sphere args={[rIn, 32, 32]}>
                        <meshStandardMaterial color={matColor} metalness={0.9} roughness={0.05} />
                    </Sphere>
                    {/* Visual resonant field inner cage */}
                    <Sphere args={[rIn * 1.05, 16, 8]}>
                        <meshStandardMaterial color="#8b5cf6" wireframe transparent opacity={0.3} />
                    </Sphere>
                </group>
            );
        } else if (componentType === "LaminarPipe") {
            const ROut = p.pipeOuterRadius * S;
            const length = p.pipeLength * S;
            // Fake hollow visual mapping: transparent outer cylinder, dark inner bore
            return (
                <group position={[0, 0, 0]}>
                    <Cylinder args={[ROut, ROut, length, 32]}>
                        <meshStandardMaterial color={matColor} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
                    </Cylinder>
                    <Cylinder args={[p.pipeInnerRadius * S, p.pipeInnerRadius * S, length * 1.01, 16]}>
                        <meshBasicMaterial color="#0f172a" />
                    </Cylinder>
                </group>
            );
        } else if (componentType === "SolarMesh") {
            // Hexagonal microscopic array representation
            // Thickness in micrometers is practically flat in mm scale, so we represent the layer.
            const meshRadius = 1.5; // Visual 3D fit scale
            const hexScale = (p.meshPitch / 25) * 0.15; // Parametric density visual scaling
            return (
                <group position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <Cylinder args={[meshRadius, meshRadius, p.meshThickness * 0.01, 64]}>
                        <meshStandardMaterial color={matColor} metalness={1.0} roughness={0.2} transparent opacity={0.7} />
                    </Cylinder>
                    {/* Holographic Wireframe simulating the intricate leaf-vein density */}
                    <Circle args={[meshRadius * 0.98, Math.floor(64 / hexScale)]}>
                         <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.5} />
                    </Circle>
                </group>
            );
        }
    };

    return (
        <group ref={groupRef}>
            {/* ANNOTATIONS */}
            <Html position={[0, 4.0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #94a3b8', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acoustophoretic Injector</span>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>(Feeds elemental parameters)</span>
                </div>
            </Html>

            <Html position={[3.2, 0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #8b5cf6', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#8b5cf6', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phased Transducer Array</span>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>(Generates 3D standing wave matrix)</span>
                </div>
            </Html>
            
            <Html position={[0, -2.5, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #10b981', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#10b981', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ultrasonic Consolidation Sonotrode</span>
                    <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>(Real-time frictionless parametric binding)</span>
                </div>
            </Html>

            {/* Top Injector Nozzle */}
            <Cylinder args={[0.2, 0.05, 1.0, 16]} position={[0, 3.2, 0]}>
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.3, 0.3, 0.2, 16]} position={[0, 3.8, 0]}>
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
            </Cylinder>

            {/* Spherical Transducer Array */}
            {transducerPositions.map((pos, i) => (
                <Box key={i} args={[0.15, 0.15, 0.05]} position={pos} rotation={[Math.atan2(-pos.y, Math.hypot(pos.x, pos.z)), Math.atan2(pos.x, pos.z), 0]}>
                    <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.2} emissive="#8b5cf6" emissiveIntensity={0.2} />
                </Box>
            ))}
            
            {/* Holographic Chamber Bounding Wireframe */}
            <Sphere args={[2.6, 32, 16]} position={[0, 0, 0]}>
                <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.05} />
            </Sphere>

            {/* Ultrasonic Consolidation Sonotrode (Sweeping Bar beneath object) */}
            <group ref={sonotrodeRef} position={[0, -1.2, 0]}>
                <Box args={[0.2, 0.4, 3.0]}>
                    <meshStandardMaterial color="#10b981" metalness={0.9} roughness={0.1} emissive="#10b981" emissiveIntensity={0.3} />
                </Box>
                {/* Sonotrode acoustic beam visual */}
                <Box args={[0.2, 2.0, 3.0]} position={[0, 1.2, 0]}>
                    <meshBasicMaterial color="#10b981" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
                </Box>
            </group>

            {/* The dynamically instanced parametric C.A.D object */}
            {renderParametricComponent()}

            {/* Build Plate */}
            <Cylinder args={[1.2, 1.2, 0.1, 32]} position={[0, -1.5, 0]}>
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </Cylinder>

        </group>
    );
};

export default function AcousticPrinting3DModel({ componentType = "HarvesterNode", material = "Titanium", params }: Props) {
    return (
        <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden', background: '#0f172a', border: '1px solid #1e293b' }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <color attach="background" args={['#0f172a']} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -5, -5]} color="#8b5cf6" intensity={2} decay={2} />
                <pointLight position={[0, -10, 0]} color="#10b981" intensity={2} decay={2} />
                
                <PrinterDevice componentType={componentType} material={material} params={params} />
                <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}

