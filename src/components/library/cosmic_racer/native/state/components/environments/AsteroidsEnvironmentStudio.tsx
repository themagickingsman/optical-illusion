'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEnvironmentState } from '../../context/EnvironmentStateContext';
import { AsteroidOptimizationEngine } from '@/app/(cms)/cosmic_racers/AsteroidOptimizationEngine';

export default function AsteroidsEnvironmentStudio() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { planetPrefs, setPlanetPrefs } = useEnvironmentState();
    const [cameraAngle, setCameraAngle] = React.useState<'orthographic' | 'top-down'>('orthographic');
    
    // Create an isolated ref for mutable preferences so we don't trigger React renders on 120fps loop
    const prefsRef = useRef(planetPrefs);
    const cameraAngleRef = useRef(cameraAngle);
    
    useEffect(() => {
        prefsRef.current = planetPrefs;
    }, [planetPrefs]);

    useEffect(() => {
        cameraAngleRef.current = cameraAngle;
    }, [cameraAngle]);

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const W = el.clientWidth;
        const H = el.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a1024);
        
        // Setup isolated camera
        const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
        camera.position.set(0, 150, 200);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setSize(W, H);
        el.appendChild(renderer.domElement);

        // Lights
        const ambLight = new THREE.AmbientLight(0x334466, 2.0);
        scene.add(ambLight);
        const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
        sunLight.position.set(80, 200, 80);
        scene.add(sunLight);

        // Engine Init
        const astEngine = new AsteroidOptimizationEngine(2000, 4000);
        
        const astGeometries = {
            1: new THREE.TetrahedronGeometry(1, 0),
            2: new THREE.BoxGeometry(1.2, 1.2, 1.2),
            3: new THREE.OctahedronGeometry(1.1, 0),
            4: new THREE.DodecahedronGeometry(1.1, 0),
            5: new THREE.IcosahedronGeometry(1.1, 0)
        };
        
        const astMat = new THREE.MeshPhysicalMaterial({
            color: 0x8899aa, roughness: 0.8, metalness: 0.2, flatShading: true,
        });

        const tierColors = {
            1: 0x00ff88, 2: 0x4488ff, 3: 0xff44aa, 4: 0xffaa00, 5: 0xffffff
        };

        const asteroidMeshes: Record<number, THREE.InstancedMesh> = {};
        [1, 2, 3, 4, 5].forEach(tier => {
            const geo = astGeometries[tier as keyof typeof astGeometries];
            const imesh = new THREE.InstancedMesh(geo, astMat, astEngine.maxAsteroids);
            imesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            const color = new THREE.Color(tierColors[tier as keyof typeof tierColors]);
            for(let i=0; i < astEngine.maxAsteroids; i++) {
                imesh.setColorAt(i, color);
            }
            if (imesh.instanceColor) imesh.instanceColor.needsUpdate = true;
            scene.add(imesh);
            asteroidMeshes[tier] = imesh;
        });

        const dustGeo = new THREE.IcosahedronGeometry(0.5, 0);
        const dustMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, astEngine.maxDust);
        dustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(dustMesh);

        // Pre-populate
        for (let i = 0; i < 200; i++) {
            const r = 50 + Math.random() * 400;
            const angle = Math.random() * Math.PI * 2;
            astEngine.spawnAsteroid(Math.cos(angle)*r, (Math.random()-0.5)*10, Math.sin(angle)*r, Math.floor(1 + Math.random() * 5));
        }

        let rafId = 0;
        let lastTime = performance.now();
        const dummy = new THREE.Object3D();

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            const now = performance.now();
            const delta = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            const prefs = prefsRef.current;
            const enabled = prefs.asteroidsEnabled ?? true;
            const density = prefs.asteroidDensity ?? 200;
            const currentScale = prefs.asteroidScale ?? 1.0;
            const currentSpeed = prefs.asteroidSpeed ?? 1.0;
            const rotSpeed = prefs.asteroidRotationSpeed ?? 1.0;
            const pattern = prefs.asteroidPattern ?? 'random';
            const ringRadius = prefs.asteroidRingRadius ?? 300;

            [1,2,3,4,5].forEach(tier => { asteroidMeshes[tier].visible = enabled; });
            dustMesh.visible = enabled;

            if (enabled) {
                // Spawn randomly up to density
                let activeCount = 0;
                for(let i=0; i<astEngine.maxAsteroids; i++) if(astEngine.a_active[i]) activeCount++;
                if (activeCount < density) {
                    const r = 100 + Math.random() * 400;
                    const angle = Math.random() * Math.PI * 2;
                    astEngine.spawnAsteroid(Math.cos(angle)*r, (Math.random()-0.5)*10, Math.sin(angle)*r, Math.floor(1 + Math.random() * 5), currentScale, currentSpeed);
                } else if (activeCount > density) {
                    // Cull excess asteroids immediately when slider drops
                    let toCull = activeCount - density;
                    for (let i = 0; i < astEngine.maxAsteroids && toCull > 0; i++) {
                        if (astEngine.a_active[i]) {
                            astEngine.a_active[i] = 0;
                            toCull--;
                        }
                    }
                }

                // Simple simulated center "black hole / ship" to trigger destruction and dust for visual demo
                astEngine.update(delta, 0, 0, currentScale, currentSpeed, pattern, ringRadius);

                // Update Matrices
                [1,2,3,4,5].forEach(tier => {
                    const imesh = asteroidMeshes[tier];
                    for(let i=0; i < astEngine.maxAsteroids; i++) {
                        if (astEngine.a_active[i] && astEngine.a_tier[i] === tier) {
                            dummy.position.set(astEngine.a_x[i], astEngine.a_y[i], astEngine.a_z[i]);
                            dummy.rotation.set(astEngine.a_rx[i] * rotSpeed, astEngine.a_ry[i] * rotSpeed, astEngine.a_rz[i] * rotSpeed);
                            const s = astEngine.a_scale[i];
                            dummy.scale.set(s, s, s);
                            dummy.updateMatrix();
                            imesh.setMatrixAt(i, dummy.matrix);
                        } else {
                            dummy.scale.set(0,0,0);
                            dummy.updateMatrix();
                            imesh.setMatrixAt(i, dummy.matrix);
                        }
                    }
                    imesh.instanceMatrix.needsUpdate = true;
                });

                for(let i=0; i < astEngine.maxDust; i++) {
                    if (astEngine.d_active[i]) {
                        dummy.position.set(astEngine.d_x[i], astEngine.d_y[i], astEngine.d_z[i]);
                        dummy.rotation.set(0,0,0);
                        const s = astEngine.d_life[i] * 1.5;
                        dummy.scale.set(s, s, s);
                        dummy.updateMatrix();
                        dustMesh.setMatrixAt(i, dummy.matrix);
                    } else {
                        dummy.scale.set(0,0,0);
                        dummy.updateMatrix();
                        dustMesh.setMatrixAt(i, dummy.matrix);
                    }
                }
                dustMesh.instanceMatrix.needsUpdate = true;
            }

            // Camera logic based on active tab
            if (cameraAngleRef.current === 'orthographic') {
                camera.position.x = Math.sin(now * 0.0001) * 300;
                camera.position.y = 150;
                camera.position.z = Math.cos(now * 0.0001) * 300;
                camera.lookAt(0, 0, 0);
            } else {
                camera.position.x = 0;
                camera.position.y = 400;
                camera.position.z = 0;
                camera.lookAt(0, 0, 0);
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            renderer.dispose();
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Preferences Floating Panel */}
            <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(10, 15, 30, 0.85)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 8, padding: 20, width: 320, color: '#ccc', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div style={{ fontWeight: 'bold', color: '#a855f7', fontSize: 14 }}>ASTEROIDS CONTROLS</div>
               
               {/* Camera Angle Tabs */}
               <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 6 }}>
                 <div 
                   onClick={() => setCameraAngle('orthographic')}
                   style={{ flex: 1, textAlign: 'center', padding: '6px 0', cursor: 'pointer', borderRadius: 4, background: cameraAngle === 'orthographic' ? '#a855f7' : 'transparent', color: cameraAngle === 'orthographic' ? '#fff' : '#888', fontWeight: 'bold', transition: 'all 0.2s' }}
                 >
                   ORTHOGRAPHIC
                 </div>
                 <div 
                   onClick={() => setCameraAngle('top-down')}
                   style={{ flex: 1, textAlign: 'center', padding: '6px 0', cursor: 'pointer', borderRadius: 4, background: cameraAngle === 'top-down' ? '#a855f7' : 'transparent', color: cameraAngle === 'top-down' ? '#fff' : '#888', fontWeight: 'bold', transition: 'all 0.2s' }}
                 >
                   TOP DOWN
                 </div>
               </div>

               {/* Field Pattern Tabs */}
               <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 6 }}>
                 <div 
                   onClick={() => setPlanetPrefs(p => ({ ...p, asteroidPattern: 'random' }))}
                   style={{ flex: 1, textAlign: 'center', padding: '6px 0', cursor: 'pointer', borderRadius: 4, background: (planetPrefs.asteroidPattern ?? 'random') === 'random' ? '#10b981' : 'transparent', color: (planetPrefs.asteroidPattern ?? 'random') === 'random' ? '#fff' : '#888', fontWeight: 'bold', transition: 'all 0.2s' }}
                 >
                   RANDOM
                 </div>
                 <div 
                   onClick={() => setPlanetPrefs(p => ({ ...p, asteroidPattern: 'orbital' }))}
                   style={{ flex: 1, textAlign: 'center', padding: '6px 0', cursor: 'pointer', borderRadius: 4, background: planetPrefs.asteroidPattern === 'orbital' ? '#10b981' : 'transparent', color: planetPrefs.asteroidPattern === 'orbital' ? '#fff' : '#888', fontWeight: 'bold', transition: 'all 0.2s' }}
                 >
                   ORBITAL RING
                 </div>
               </div>

               <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff' }}>
                 <input type="checkbox" checked={planetPrefs.asteroidsEnabled ?? true} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidsEnabled: e.target.checked }))} style={{ accentColor: '#a855f7' }} />
                 {planetPrefs.asteroidsEnabled ?? true ? 'System Online' : 'System Offline'}
               </label>
               
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Field Density</span><span style={{ color: '#a855f7' }}>{Math.floor(planetPrefs.asteroidDensity ?? 200)}</span></div>
                 <input type="range" min="10" max="2000" step="10" value={planetPrefs.asteroidDensity ?? 200} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidDensity: parseFloat(e.target.value) }))} style={{ accentColor: '#a855f7' }} />
               </label>
               {planetPrefs.asteroidPattern === 'orbital' && (
                 <label style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(16,185,129,0.1)', padding: 8, borderRadius: 6 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#10b981'}}>Ring Radius</span><span style={{ color: '#10b981' }}>{Math.floor(planetPrefs.asteroidRingRadius ?? 300)}</span></div>
                   <input type="range" min="100" max="800" step="10" value={planetPrefs.asteroidRingRadius ?? 300} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidRingRadius: parseFloat(e.target.value) }))} style={{ accentColor: '#10b981' }} />
                 </label>
               )}
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Overall Scale</span><span style={{ color: '#a855f7' }}>{(planetPrefs.asteroidScale ?? 1.0).toFixed(2)}x</span></div>
                 <input type="range" min="0.1" max="5.0" step="0.1" value={planetPrefs.asteroidScale ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidScale: parseFloat(e.target.value) }))} style={{ accentColor: '#a855f7' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Velocity Multiplier</span><span style={{ color: '#a855f7' }}>{(planetPrefs.asteroidSpeed ?? 1.0).toFixed(2)}x</span></div>
                 <input type="range" min="0.0" max="5.0" step="0.1" value={planetPrefs.asteroidSpeed ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#a855f7' }} />
               </label>
               <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rotation Speed</span><span style={{ color: '#a855f7' }}>{(planetPrefs.asteroidRotationSpeed ?? 1.0).toFixed(2)}x</span></div>
                 <input type="range" min="0.0" max="10.0" step="0.1" value={planetPrefs.asteroidRotationSpeed ?? 1.0} onChange={e => setPlanetPrefs(p => ({ ...p, asteroidRotationSpeed: parseFloat(e.target.value) }))} style={{ accentColor: '#a855f7' }} />
               </label>
               
               <p style={{ margin: 0, fontSize: 10, color: '#888', marginTop: 10 }}>
                   Watch the asteroids orbit the origin! If they intersect the center of the scene, they will simulate "ramming" and physically shatter into dust particles.
               </p>
            </div>
        </div>
    );
}
