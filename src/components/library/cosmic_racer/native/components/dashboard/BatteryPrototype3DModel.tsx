import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder, Sphere, Html, Torus } from '@react-three/drei';
import * as THREE from 'three';

const BatteryPrototype = () => {
    const groupRef = useRef<THREE.Group>(null);
    const particleRef = useRef<THREE.InstancedMesh>(null);

    // Animate Electron Flow
    useFrame((state) => {
        if (particleRef.current) {
            const time = state.clock.getElapsedTime();
            const dummy = new THREE.Object3D();
            
            for (let i = 0; i < 150; i++) {
                // Electron positions along the fractal branches
                const branchLength = 2.0;
                const speed = 1.5;
                const phase = ((time * speed) + (i / 150) * branchLength) % branchLength;
                
                // Which branch (0 to 7)
                const branchIndex = i % 8;
                const angle = (branchIndex * Math.PI) / 4;
                
                // Move out from center
                const radius = phase * 2;
                
                // Add some fractal drift/split
                const driftOsc = Math.sin(time * 3 + i) * 0.1 * radius;
                
                const x = Math.cos(angle) * radius + Math.sin(angle) * driftOsc;
                const y = Math.sin(angle) * radius - Math.cos(angle) * driftOsc;
                
                const z = Math.sin(time * 2 + x * 2 + y * 2) * 0.1; // Slight vertical oscillation

                dummy.position.set(x, z, y);
                dummy.scale.setScalar(0.04);
                dummy.updateMatrix();
                particleRef.current.setMatrixAt(i, dummy.matrix);
            }
            particleRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* ANNOTATIONS */}
            <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #38bdf8', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fractal Current Collector</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>(Infinite Surface Area, Zero Resistance)</span>
                </div>
            </Html>

            <Html position={[4, -1, -4]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(234,179,8,0.15)', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #eab308', color: '#eab308', fontSize: '11px', textAlign: 'center' }}>
                    <strong>Cymatic Lithium Alignment</strong><br/>Ions locked in harmonic lattice
                </div>
            </Html>

            {/* BASE/SUBSTRATE */}
            <Cylinder args={[5, 5, 0.1, 64]} position={[0, -0.5, 0]}>
                <meshStandardMaterial color="#0f172a" transparent opacity={0.8} metalness={0.5} roughness={0.8} />
            </Cylinder>
            
            {/* FRACTAL COPPER MESH (Simplified Visual) */}
            {/* Center Hub */}
            <Cylinder args={[0.5, 0.5, 0.15, 32]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
            </Cylinder>
            
            {/* Primary Branches */}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4;
                return (
                    <group key={`branch1-${i}`} rotation={[0, -angle, 0]} position={[Math.cos(angle)*1.5, 0, Math.sin(angle)*1.5]}>
                        <Box args={[2.5, 0.1, 0.15]}>
                            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
                        </Box>
                        {/* Secondary Branches */}
                        <Box args={[1.5, 0.08, 0.1]} position={[1.2, 0, 0.5]} rotation={[0, Math.PI/4, 0]}>
                             <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
                        </Box>
                        <Box args={[1.5, 0.08, 0.1]} position={[1.2, 0, -0.5]} rotation={[0, -Math.PI/4, 0]}>
                             <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
                        </Box>
                    </group>
                );
            })}

            {/* CYMATIC LITHIUM LATTICE (Visual representation overlays) */}
            {Array.from({ length: 3 }).map((_, ring) => (
                <Torus key={`cymatic-${ring}`} args={[(ring + 1) * 1.5, 0.02, 16, 64]} position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
                     <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} wireframe />
                </Torus>
            ))}

            {/* ANIMATED ELECTRON FLOW */}
            <instancedMesh ref={particleRef} args={[undefined, undefined, 150]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#38bdf8" blending={THREE.AdditiveBlending} transparent opacity={0.9} />
            </instancedMesh>
            
        </group>
    );
};

export default function BatteryPrototype3DModel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    // Listen for Escape key fullscreen exits to update state
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: isFullscreen ? '100vh' : '600px', background: '#020617', borderRadius: isFullscreen ? '0' : '20px', overflow: 'hidden', position: 'relative', border: isFullscreen ? 'none' : '1px solid #1e293b', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 10, 30]} />
                
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
                <pointLight position={[0, 2, 0]} intensity={2.0} color="#38bdf8" />
                
                <BatteryPrototype />
                
                <Grid infiniteGrid fadeDistance={30} sectionColor="#334155" cellColor="#0f172a" position={[0, -2.0, 0]} />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={1.0} maxDistance={20} minDistance={2} />
            </Canvas>
            
            {/* UI Overlay for Model Specs */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                        <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>Proto-Auric Core CAD</h3>
                    </div>
                    <p style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interactive 3D Render • Drag to Rotate</p>
                    
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>CATHODE BASE</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>Fractal Etched Copper Foil</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE MATERIAL</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>LiFePO4 Slurry</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>SEPARATOR ALIGNMENT</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>432 Hz Harmonic Lattice</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Button */}
            <button 
                onClick={toggleFullscreen}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 10, transition: 'all 0.2s' }}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3v3h-3m16 0h-3v-3m0 16v-3h3m-16 0h3v3"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                )}
            </button>
        </div>
    );
}
