import * as THREE from 'three';

export interface FlockConfig {
    count: number;
    size: number;
    speed: number;
    bounciness: number;
    bounceSpeed: number; // Added bounce speed config
    gravity: number;
    explodeForce: number;
    explodeRadius: number;
    separation: number;
    cohesion: number;
    alignment: number;
    boundsX: number; // e.g., grid width
    boundsZ: number; // e.g., grid height
    textureUrl: string;
}

export class FlockEngine {
    public mesh: THREE.InstancedMesh;
    public shadowMesh: THREE.InstancedMesh;
    private positions: THREE.Vector3[] = [];
    private velocities: THREE.Vector3[] = [];
    private yVelocities: number[] = []; // Explosion vertical velocity
    private tumble: number[] = [];      // Air rotation spin
    private phases: number[] = [];
    private scales: number[] = [];    // Native size scale (Lambs vs Adults)
    private states: number[] = [];    // 0=Rest, 1=Graze, 2=Move, 3=Flee, 4=Airborne
    private stateTimers: number[] = [];
    private scarePoint: THREE.Vector3 | null = null;
    private scareRadius: number = 0;
    private dummy = new THREE.Object3D();
    public config: FlockConfig;

    constructor(config: FlockConfig) {
        this.config = config;

        // Texture Loading
        const texLoader = new THREE.TextureLoader();
        const spriteTex = texLoader.load(config.textureUrl);
        spriteTex.colorSpace = THREE.SRGBColorSpace;
        
        // Material & Geometry
        const geo = new THREE.PlaneGeometry(config.size, config.size);
        const mat = new THREE.MeshStandardMaterial({ 
           map: spriteTex, 
           transparent: true, 
           alphaTest: 0.1, 
           side: THREE.DoubleSide,
           roughness: 0.8,
           emissive: new THREE.Color(0x666666) // Prevents the backside from going pitch black
        });

        this.mesh = new THREE.InstancedMesh(geo, mat, config.count);
        this.mesh.frustumCulled = false;
        
        // ── Blob Shadow ──
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(0,0,0,0.95)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const shadowTex = new THREE.CanvasTexture(canvas);
        const sGeo = new THREE.PlaneGeometry(config.size * 1.1, config.size * 1.1);
        sGeo.rotateX(-Math.PI / 2); // lie flat on floor
        const sMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 1.0 });
        
        this.shadowMesh = new THREE.InstancedMesh(sGeo, sMat, config.count);
        this.shadowMesh.frustumCulled = false;

        this.reset();
    }

    public getLivingCount(): number {
        let count = 0;
        // Only count up to mesh.count, which is the current wave size
        for (let i = 0; i < this.mesh.count; i++) {
            if (this.states[i] !== 6) count++;
        }
        return count;
    }

    public spawnWave(count: number) {
        this.config.count = count;
        
        // Ensure arrays have enough capacity
        while (this.positions.length < count) {
             this.positions.push(new THREE.Vector3());
             this.velocities.push(new THREE.Vector3());
             this.yVelocities.push(0);
             this.tumble.push(0);
             this.phases.push(0);
             this.scales.push(1);
             this.states.push(6);
             this.stateTimers.push(0);
        }

        // Recreate InstancedMesh if we need a larger buffer
        if (count > this.mesh.instanceMatrix.count) {
             const oldGeo = this.mesh.geometry;
             const oldMat = this.mesh.material;
             const parent = this.mesh.parent;
             
             if (parent) {
                 parent.remove(this.mesh);
                 parent.remove(this.shadowMesh);
             }
             
             this.mesh = new THREE.InstancedMesh(oldGeo, oldMat, count * 2); // Double capacity to prevent frequent resizing
             this.mesh.frustumCulled = false;
             
             const oldSGeo = this.shadowMesh.geometry;
             const oldSMat = this.shadowMesh.material;
             this.shadowMesh = new THREE.InstancedMesh(oldSGeo, oldSMat, count * 2);
             this.shadowMesh.frustumCulled = false;
             
             if (parent) {
                 parent.add(this.mesh);
                 parent.add(this.shadowMesh);
             }
        }
        
        this.mesh.count = count;
        this.shadowMesh.count = count;

        // Reset all sheep in the active wave to parachuting state
        for (let i = 0; i < count; i++) {
            this.resetSheep(i);
            this.states[i] = 5; // Parachuting
        }
    }

    public updateConfig(newConfig: Partial<FlockConfig>) {
        const oldSize = this.config.size;
        this.config = { ...this.config, ...newConfig };
        
        if (oldSize !== this.config.size) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(this.config.size, this.config.size);
            
            this.shadowMesh.geometry.dispose();
            const sGeo = new THREE.PlaneGeometry(this.config.size * 1.1, this.config.size * 1.1);
            sGeo.rotateX(-Math.PI / 2);
            this.shadowMesh.geometry = sGeo;
        }
    }

    public reset() {
        this.positions = [];
        this.velocities = [];
        this.yVelocities = [];
        this.tumble = [];
        this.phases = [];
        this.scales = [];
        this.states = [];
        this.stateTimers = [];
        this.scarePoint = null;
        
        // Initialize an empty buffer (we spawn later via spawnWave)
        this.mesh.count = 0;
        this.shadowMesh.count = 0;
    }

    private resetSheep(i: number) {
        const c = this.config;
        const x = (Math.random() - 0.5) * c.boundsX;
        const z = (Math.random() - 0.5) * c.boundsZ;
        
        // Spawn them high up so they drop into the map safely
        this.positions[i].set(x, 40 + Math.random() * 20, z); 

        this.velocities[i].set(0, 0, 0); // They don't have horizontal velocity initially
        this.yVelocities[i] = -2.0; // Slow descent initially
        this.tumble[i] = 0;
        this.phases[i] = Math.random() * Math.PI * 2;
        this.states[i] = 5; // Start Parachuting
        this.stateTimers[i] = 0;
        
        const scale = Math.random() > 0.7 ? 0.4 + Math.random() * 0.3 : 0.8 + Math.random() * 0.4;
        this.scales[i] = scale;
    }

    private resetSheep(i: number) {
        const c = this.config;
        
        // Instead of pure random square, create 3-5 random "drop zones"
        // This makes the swarms look more organic and wave-like as they drop in
        const numClusters = 4;
        const clusterIndex = i % numClusters;
        
        const cx = Math.sin(clusterIndex * 21.4) * (c.boundsX * 0.35);
        const cz = Math.cos(clusterIndex * 21.4) * (c.boundsZ * 0.35);
        
        const r = (Math.random() + Math.random()) / 2; // rough gaussian spread
        const angle = Math.random() * Math.PI * 2;
        const spread = Math.min(c.boundsX, c.boundsZ) * 0.45;
        
        let x = cx + Math.cos(angle) * r * spread;
        let z = cz + Math.sin(angle) * r * spread;
        
        // Keep them strictly inside the bounds for spawning
        x = THREE.MathUtils.clamp(x, -c.boundsX/2, c.boundsX/2);
        z = THREE.MathUtils.clamp(z, -c.boundsZ/2, c.boundsZ/2);
        
        // Spawn them high up so they drop into the map safely
        this.positions[i].set(x, 30 + Math.random() * 20, z); 

        const velocityAngle = Math.random() * Math.PI * 2;
        const speed = Math.random() * c.speed;
        this.velocities[i].set(Math.cos(velocityAngle) * speed, 0, Math.sin(velocityAngle) * speed);

        this.yVelocities[i] = 0;
        this.tumble[i] = (Math.random() - 0.5) * 10.0;
        this.phases[i] = Math.random() * Math.PI * 2;
        this.states[i] = 4; // Start airborne and let them fall down
        this.stateTimers[i] = 0;
    }

    public scare(x: number, z: number, radius: number) {
        this.scarePoint = new THREE.Vector3(x, 0, z);
        this.scareRadius = radius;
        // Scare points disappear after 2 seconds
        setTimeout(() => {
            this.scarePoint = null;
        }, 2000);
    }

    public explode(x: number, z: number, explodeForce: number, explodeRadius: number) {
        const explosionPoint = new THREE.Vector2(x, z);
        for (let i = 0; i < this.mesh.count; i++) {
            const p = this.positions[i];
            const dist = explosionPoint.distanceTo(new THREE.Vector2(p.x, p.z));
            if (dist < explodeRadius) {
                this.states[i] = 4; // Airborne
                // Massive upward force multiplier
                this.yVelocities[i] = (explodeForce * 2.5) * (1.0 - (dist / explodeRadius)) + (Math.random() * 15.0);
                
                // Add horizontal scatter from the blast center
                const blastDir = new THREE.Vector3(p.x - x, 0, p.z - z).normalize();
                this.velocities[i].add(blastDir.multiplyScalar(explodeForce * 0.5));
                
                // Induce a quick random spin
                this.tumble[i] = 0; 
            }
        }
    }

    public update(delta: number, time: number, getTerrainElevation: (x: number, z: number) => number, camera?: THREE.Camera) {
        const c = this.config;
        const perceptionRadius = 4.0;
        const maxForce = 0.5;

        for (let i = 0; i < this.mesh.count; i++) {
            if (this.states[i] === 6) {
                // Completely hide dead sheep
                this.dummy.scale.set(0, 0, 0);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
                this.shadowMesh.setMatrixAt(i, this.dummy.matrix);
                continue;
            }

            const pos = this.positions[i];
            const vel = this.velocities[i];

            // ── Boids Calculation (Only for ground walking) ──
            if (this.states[i] !== 4 && this.states[i] !== 5) {
                const align = new THREE.Vector3();
                const coh = new THREE.Vector3();
                const sep = new THREE.Vector3();
                let total = 0;

                // Optimization: Random sampling for Boids instead of O(N^2)
                // This completely eliminates performance hits at high waves while introducing 
                // organic "competing waves" of movement since they sample different neighbors.
                const samples = Math.min(this.mesh.count, 15);
                for (let k = 0; k < samples; k++) {
                    const j = Math.floor(Math.random() * this.mesh.count);
                    if (i !== j && this.states[j] !== 6 && this.states[j] !== 4 && this.states[j] !== 5) {
                        const otherPos = this.positions[j];
                        const d = pos.distanceTo(otherPos);
                        
                        if (d > 0 && d < perceptionRadius) {
                            align.add(this.velocities[j]);
                            coh.add(otherPos);
                            const diff = pos.clone().sub(otherPos).normalize().divideScalar(d);
                            sep.add(diff);
                            total++;
                        }
                    }
                }

                // ── Flee Mechanic ──
                let isFleeing = false;
                let currentTargetSpeed = c.speed;
                
                if (this.scarePoint) {
                    const distToScare = pos.distanceTo(this.scarePoint);
                    if (distToScare < this.scareRadius) {
                        isFleeing = true;
                        // Flee hard away from point
                        const fleeVec = pos.clone().sub(this.scarePoint).normalize().multiplyScalar(c.speed * 3.0);
                        vel.add(fleeVec);
                        currentTargetSpeed = c.speed * 3.0; // temporary boost
                        this.states[i] = 3; // Fleeing
                        this.stateTimers[i] = 2.0; // panic for 2 seconds
                    }
                }

                // ── Idle/Grazing State Logic ──
                this.stateTimers[i] -= delta;
                if (!isFleeing && this.stateTimers[i] <= 0) {
                    // Determine next state
                    if (this.states[i] === 2) { 
                        // Was moving -> chance to rest or graze
                        this.states[i] = Math.random() > 0.5 ? 0 : 1;
                        this.stateTimers[i] = 1.0 + Math.random() * 4.0; // Rest for 1-5s
                    } else {
                        // Was resting -> move
                        this.states[i] = 2;
                        this.stateTimers[i] = 3.0 + Math.random() * 8.0; // Move for 3-11s
                        
                        // Nudge to prevent permanent stationary freezing without neighbors
                        if (vel.lengthSq() < 0.001) {
                            const randomAngle = Math.random() * Math.PI * 2;
                            vel.set(Math.cos(randomAngle), 0, Math.sin(randomAngle)).multiplyScalar(c.speed * 0.4);
                        }
                    }
                }

                // If resting, dampen velocity
                if (this.states[i] === 0 || this.states[i] === 1) {
                    vel.multiplyScalar(0.9); // slow down to a stop
                } else if (total > 0 && !isFleeing) {
                    align.divideScalar(total).normalize().multiplyScalar(c.speed).sub(vel).clampLength(0, maxForce).multiplyScalar(c.alignment);
                    coh.divideScalar(total).sub(pos).normalize().multiplyScalar(c.speed).sub(vel).clampLength(0, maxForce).multiplyScalar(c.cohesion);
                    sep.divideScalar(total).normalize().multiplyScalar(c.speed).sub(vel).clampLength(0, maxForce).multiplyScalar(c.separation);
                    
                    vel.add(align).add(coh).add(sep);
                }

                // ── Edge Avoidance (Steer back towards center) ──
                const margin = 2.0;
                const turnForce = 1.0;
                const curX = pos.x;
                const curZ = pos.z;
                const halfX = c.boundsX / 2;
                const halfZ = c.boundsZ / 2;

                if (curX < -halfX + margin) vel.x += turnForce;
                if (curX >  halfX - margin) vel.x -= turnForce;
                if (curZ < -halfZ + margin) vel.z += turnForce;
                if (curZ >  halfZ - margin) vel.z -= turnForce;

                vel.clampLength(0, currentTargetSpeed);
            }

            // Apply Horizontal Velocity (with cliff avoidance for walkers)
            const nextPos = pos.clone().add(vel.clone().multiplyScalar(delta));
            
            // Prevent walkers from stepping into the abyss
            if (this.states[i] !== 4 && this.states[i] !== 5) {
                const nextHeight = getTerrainElevation(nextPos.x, nextPos.z);
                if (nextHeight < -10) {
                    // Reached a cliff edge! Turn around immediately.
                    vel.multiplyScalar(-1);
                    // Add a random nudge so they don't get stuck perfectly bouncing back and forth
                    const randomAngle = Math.random() * Math.PI * 2;
                    vel.add(new THREE.Vector3(Math.cos(randomAngle), 0, Math.sin(randomAngle)).multiplyScalar(c.speed * 0.5));
                } else {
                    pos.copy(nextPos);
                }
            } else {
                // If they are airborne or parachuting, momentum carries them directly over holes
                pos.copy(nextPos);
            }

            // Hard clamp purely to prevent map escapes (Only when walking/parachuting)
            if (this.states[i] !== 4) {
                const clampX = c.boundsX / 2;
                const clampZ = c.boundsZ / 2;
                pos.x = THREE.MathUtils.clamp(pos.x, -clampX, clampX);
                pos.z = THREE.MathUtils.clamp(pos.z, -clampZ, clampZ);
            }

            // ── Terrain Sync, Gravity & Bounce ──
            const baseHeight = getTerrainElevation(pos.x, pos.z);
            const scale = this.scales[i];
            const currentSpeedRatio = vel.length() / c.speed;
            const groundFloor = baseHeight + (c.size * scale) / 2.0;
            
            // If the floor suddenly vanishes (they walked onto a hole), force them airborne!
            if (this.states[i] !== 4 && this.states[i] !== 5 && groundFloor < -10) {
                this.states[i] = 4;
                this.yVelocities[i] = 0; 
                this.tumble[i] = (Math.random() - 0.5) * 5.0; // Mild tumble as they slip off edge
            }
            
            let walkBounce = 0;
            let currentTumble = 0;
            
            // Parachuting Physics (State 5)
            if (this.states[i] === 5) {
                this.yVelocities[i] -= (c.gravity * 0.1) * delta; // Much weaker gravity
                pos.y += this.yVelocities[i] * delta;
                
                // Gentle swaying side to side
                this.phases[i] += delta * 2.0;
                pos.x += Math.sin(this.phases[i]) * 1.5 * delta;
                
                currentTumble = Math.sin(this.phases[i]) * 0.5; // Slight tilt
                
                if (pos.y <= groundFloor && groundFloor > -10) {
                    pos.y = groundFloor;
                    this.yVelocities[i] = 0;
                    this.tumble[i] = 0;
                    this.states[i] = 2; // Start walking
                    this.stateTimers[i] = 2.0;
                    
                    // Give them a nudge to walk away from landing
                    const angle = Math.random() * Math.PI * 2;
                    this.velocities[i].set(Math.cos(angle) * c.speed, 0, Math.sin(angle) * c.speed);
                }
            }
            // Airborne physics (State 4)
            else if (this.states[i] === 4) {
                // Apply Gravity
                this.yVelocities[i] -= c.gravity * delta;
                pos.y += this.yVelocities[i] * delta;
                
                // Tumble rotation
                this.tumble[i] += delta * (this.yVelocities[i] + 5.0); // Spin dependent on vertical movement
                currentTumble = this.tumble[i];
                
                // No ground collision! If they get blasted, they fall through the terrain into the abyss.
            } else {
                // Bounce Amplitude & Frequency tied to physical scale & config
                const bounceAmplitude = c.bounciness * scale;
                const bounceFreq = (c.bounceSpeed / scale);
                
                // Only bounce if actively moving
                if (currentSpeedRatio > 0.1) {
                    this.phases[i] += delta * bounceFreq * currentSpeedRatio;
                    walkBounce = Math.abs(Math.sin(this.phases[i])) * bounceAmplitude;
                }
                pos.y = groundFloor + walkBounce;
                
                // Snap them back if somehow they sank through terrain
                if (pos.y < groundFloor) pos.y = groundFloor;
            }

            // Abyss Death (if they fell out of the world)
            if (pos.y < -50) {
                this.states[i] = 6; // Mark as Dead
                continue; // Skip matrix updates for this frame, hidden next frame
            }

            // ── Update Instance Matrix ──
            this.dummy.position.copy(pos);
            
            // Sphere billboard (face camera perfectly to cancel out isometric squish)
            if (camera) {
               this.dummy.quaternion.copy(camera.quaternion);
            } else {
               this.dummy.rotation.set(0, 0, 0); 
            }
            
            // Apply spin
            if (this.states[i] === 4) {
                this.dummy.rotateZ(currentTumble * 0.5); 
            }
            
            // Face velocity direction via X-scale flip instead of rotation (preserves Billboard perspective)
            const flip = vel.x > 0 ? 1 : -1;
            this.dummy.scale.set(flip * scale, scale, scale);
            
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);

            // ── Update Shadow Matrix ──
            this.dummy.rotation.set(0, 0, 0); // No tumbling for shadow
            this.dummy.position.set(pos.x, groundFloor + 0.05, pos.z); // Clamp directly to floor
            // Shrink shadow if jumping
            const heightDiff = Math.max(0, pos.y - groundFloor);
            const shadowScale = scale * Math.max(0, 1.0 - (heightDiff * 0.2));
            this.dummy.scale.set(shadowScale, shadowScale, shadowScale);
            this.dummy.updateMatrix();
            this.shadowMesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        this.shadowMesh.instanceMatrix.needsUpdate = true;
    }
}
