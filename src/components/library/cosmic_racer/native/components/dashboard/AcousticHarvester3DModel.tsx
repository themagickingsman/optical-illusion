import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

const HarvesterDevice = () => {
    const groupRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.InstancedMesh>(null);
    
    // Animate particles flowing through the system
    useFrame((state, delta) => {
        if (particlesRef.current) {
            const time = state.clock.getElapsedTime();
            const dummy = new THREE.Object3D();
            
            // 200 particles flowing
            for (let i = 0; i < 200; i++) {
                // Determine phase of particle (0 to 1) along the pipeline
                // Length is roughly -6.5 (start of funnel) to +2.0 (end of exhaust) = 8.5m total
                const speed = 2.0;
                const phase = ((time * speed) + (i / 200) * 8.5) % 8.5;
                const x = -6.5 + phase;
                
                let y = 0;
                let z = 0;
                let scale = 1.0;
                
                // If in funnel (x from -6.5 to -1.0)
                if (x < -1.0) {
                    const funnelProgress = (x + 6.5) / 5.5; // 0 to 1
                    // Funnel is now a diffuser: narrow intake (0.4m), wide exit (2.0m)
                    const radiusAtX = 0.4 + (funnelProgress * 1.6); 
                    
                    // Spiral pattern spinning elements
                    const angle = i * 0.1 + time * 5.0;
                    y = Math.sin(angle) * (radiusAtX * 0.8 * (i % 2 === 0 ? 1 : 0.5));
                    z = Math.cos(angle) * (radiusAtX * 0.8 * (i % 2 === 0 ? 1 : 0.5));
                    
                } else if (x >= -1.0 && x <= 1.0) {
                    // Inside the extraction chamber: Particles clump and get trapped by the waves
                    const nodeIndex = Math.floor((x + 1.0) / (2.0 / 12));
                    const nodeCenter = -1.0 + (nodeIndex * (2.0 / 12)) + (1.0/12);
                    
                    // Sucked to the center of the nodes
                    const pull = Math.max(0, 1.0 - Math.abs(x - nodeCenter) * 10);
                    
                    y = Math.sin(time * 5 + i) * 0.05 * (1 - pull);
                    z = Math.cos(time * 5 + i) * 0.05 * (1 - pull);
                    
                    // Particles agglomerate (grow)
                    scale = 1.0 + pull * 3.0;
                } else {
                    // Exhaust
                    y = (Math.random() - 0.5) * 0.4;
                    z = (Math.random() - 0.5) * 0.8;
                    scale = 0.5;
                }
                
                dummy.position.set(x, y, z);
                dummy.scale.setScalar(scale * 0.05);
                dummy.updateMatrix();
                particlesRef.current.setMatrixAt(i, dummy.matrix);
            }
            particlesRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            {/* ANNOTATIONS */}
            <Html position={[-3.75, 3.0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #38bdf8', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Cone: High-Pressure Diffuser</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>(Widens to decrease velocity & spike pressure)</span>
                </div>
            </Html>
            
            <Html position={[-3.75, -1.0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(234,179,8,0.15)', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #eab308', color: '#eab308', fontSize: '11px', textAlign: 'center' }}>
                    <strong>Spinning Elements:</strong><br/>Raw Target Particles
                </div>
            </Html>

            <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.85)', padding: '8px 16px', borderRadius: '8px', border: '2px solid #eab308', color: '#f8fafc', fontSize: '13px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <span style={{ color: '#eab308', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Waves: Acoustic Standing Fields</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>(Gor'kov Potential traps the metals)</span>
                </div>
            </Html>
            
            <Html position={[0, -1.0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(234,179,8,0.15)', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #eab308', color: '#eab308', fontSize: '11px', textAlign: 'center' }}>
                    <strong>Particles in Box:</strong><br/>Agglomerating (clumping for extraction)
                </div>
            </Html>

            <Html position={[2.5, 1.0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ background: 'rgba(15,23,42,0.8)', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', color: '#f8fafc', fontSize: '12px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: '#ef4444' }}>Exhaust Outlet</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Clean Ocean Water)</span>
                </div>
            </Html>

            {/* The Main Extraction Chamber (Lx: 2.0, Ly: 0.5, Lz: 1.0) */}
            <Box args={[2.0, 0.5, 1.0]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#1e293b" transparent opacity={0.6} metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </Box>
            
            {/* Outline box for better visibility */}
            <Box args={[2.0, 0.5, 1.0]} position={[0, 0, 0]}>
                <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.3} />
            </Box>

            {/* High-Pressure Diffuser Funnel */}
            {/* Spikes pressure and slows fluid before entering the acoustic extraction chamber */}
            <group position={[-3.75, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <Cylinder args={[1.5, 0.4, 5.5, 32, 1, true]}>
                    <meshStandardMaterial color="#0f172a" transparent opacity={0.7} wireframe />
                </Cylinder>
                <Cylinder args={[1.5, 0.4, 5.5, 32, 1, false]}>
                    <meshStandardMaterial color="#38bdf8" transparent opacity={0.15} metalness={0.5} side={THREE.DoubleSide} />
                </Cylinder>
            </group>
            
            {/* Connecting Flange (Diffuser to Chamber) */}
            <Cylinder args={[0.8, 0.8, 0.2, 32]} position={[-1.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
            </Cylinder>

            {/* Downstream Exhaust Pipe */}
            <Box args={[1.5, 0.5, 1.0]} position={[1.75, 0, 0]}>
                <meshStandardMaterial color="#1e293b" transparent opacity={0.4} metalness={0.8} side={THREE.DoubleSide} />
            </Box>
            <Box args={[1.5, 0.5, 1.0]} position={[1.75, 0, 0]}>
                <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.2} />
            </Box>
            
            {/* Connecting Flange (Chamber to Exhaust) */}
            <Cylinder args={[0.6, 0.6, 0.2, 32]} position={[1.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
            </Cylinder>

            {/* 12 Acoustic Trapping Nodes (Gor'kov Fields) */}
            {Array.from({ length: 12 }).map((_, i) => {
                const xPos = -0.825 + (i * 0.15); // Spaced evenly across ~1.65m of the 2.0m pipe
                return (
                    <group key={i} position={[xPos, 0, 0]}>
                        <Sphere args={[0.08, 16, 16]}>
                            <meshBasicMaterial color="#eab308" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
                        </Sphere>
                        {/* Acoustic vertical standing wave indicators */}
                        <Cylinder args={[0.01, 0.01, 0.5, 8]} position={[0, 0, 0]}>
                            <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
                        </Cylinder>
                    </group>
                );
            })}

            {/* Flowing Particles */}
            <instancedMesh ref={particlesRef} args={[undefined, undefined, 200]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#eab308" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
            </instancedMesh>
        </group>
    );
};

export default function AcousticHarvester3DModel() {
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
            <Canvas camera={{ position: [5, 5, 8], fov: 50 }}>
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 10, 30]} />
                
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-5, 0, 5]} intensity={2.0} color="#38bdf8" />
                <pointLight position={[0, 2, 0]} intensity={2.0} color="#eab308" distance={5} />
                
                <HarvesterDevice />
                
                <Grid infiniteGrid fadeDistance={30} sectionColor="#334155" cellColor="#0f172a" position={[0, -4.0, 0]} />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate autoRotateSpeed={0.5} maxDistance={20} minDistance={2} />
            </Canvas>
            
            {/* UI Overlay for Model Specs */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '12px', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                        <h3 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>Harmonic Phi Module CAD</h3>
                    </div>
                    <p style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interactive 3D Render • Drag to Rotate</p>
                    
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>INTAKE FUNNEL</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>High-Pressure Diffuser</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>CHAMBER (Lx:Ly:Lz)</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>2.0m : 0.5m : 1.0m</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>ACOUSTIC TRAPS</span>
                            <span style={{ color: '#f8fafc', fontSize: '0.75rem', fontWeight: 700 }}>12 Gor'kov Nodes</span>
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
