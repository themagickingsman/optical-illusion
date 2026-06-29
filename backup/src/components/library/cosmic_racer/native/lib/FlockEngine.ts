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
           roughness: 0.8
        });

        this.mesh = new THREE.InstancedMesh(geo, mat, config.count);
        this.mesh.frustumCulled = false;
        
        // ── Blob Shadow ──
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(0,0,0,0.5)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const shadowTex = new THREE.CanvasTexture(canvas);
        const sGeo = new THREE.PlaneGeometry(config.size * 0.9, config.size * 0.9);
        sGeo.rotateX(-Math.PI / 2); // lie flat on floor
        const sMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 });
        
        this.shadowMesh = new THREE.InstancedMesh(sGeo, sMat, config.count);
        this.shadowMesh.frustumCulled = false;

        this.reset();
    }

    public updateConfig(newConfig: Partial<FlockConfig>) {
        const oldSize = this.config.size;
        const oldCount = this.config.count;
        this.config = { ...this.config, ...newConfig };
        
        if (oldCount !== this.config.count) {
           // Wait, resize instanced mesh is tough, better to recreate or update count.
           // Usually we recreate if count increases beyond initial alloc, but we can set instances count.
           // We will rely on caller to rebuild engine if max count changes, or we can resize here.
           // For safety, let's allow dynamic shrinking.
           this.mesh.count = Math.min(this.config.count, this.positions.length);
        }

        if (oldSize !== this.config.size) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(this.config.size, this.config.size);
            
            this.shadowMesh.geometry.dispose();
            const sGeo = new THREE.PlaneGeometry(this.config.size * 0.9, this.config.size * 0.9);
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
        
        for (let i = 0; i < this.config.count; i++) {
            // Random scatter
            const x = (Math.random() - 0.5) * this.config.boundsX;
            const z = (Math.random() - 0.5) * this.config.boundsZ;
            this.positions.push(new THREE.Vector3(x, 0, z));

            // Random initial velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * this.config.speed;
            this.velocities.push(new THREE.Vector3(Math.cos(angle) * speed, 0, Math.sin(angle) * speed));

            // Random traits
            this.phases.push(Math.random() * Math.PI * 2);
            // Size distribution: mostly adults ~1.0, some lambs ~0.5
            const scale = Math.random() > 0.7 ? 0.4 + Math.random() * 0.3 : 0.8 + Math.random() * 0.4;
            this.scales.push(scale);

            // Start all moving
            this.states.push(2);
            this.stateTimers.push(Math.random() * 5.0);
            
            // Explosion tracking
            this.yVelocities.push(0);
            this.tumble.push(0);
        }
        this.mesh.count = this.config.count;
        this.shadowMesh.count = this.config.count;
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
            const pos = this.positions[i];
            const vel = this.velocities[i];

            // ── Boids Calculation ──
            const align = new THREE.Vector3();
            const coh = new THREE.Vector3();
            const sep = new THREE.Vector3();
            let total = 0;

            for (let j = 0; j < this.mesh.count; j++) {
                if (i !== j) {
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
            
            // Only allow Flee overwrites if not actively Airborne
            if (this.scarePoint && this.states[i] !== 4) {
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
            // Never override state based on timers if they are Airborne (State 4)
            if (!isFleeing && this.states[i] !== 4 && this.stateTimers[i] <= 0) {
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

            // Enforce max speed depending on state
            if (this.states[i] !== 4) { // Don't restrict horizontal speed if mid-explosion blast
                vel.clampLength(0, currentTargetSpeed);
            }

            // Apply Velocity
            pos.add(vel.clone().multiplyScalar(delta));

            // Hard clamp purely to prevent escapes
            pos.x = THREE.MathUtils.clamp(pos.x, -halfX, halfX);
            pos.z = THREE.MathUtils.clamp(pos.z, -halfZ, halfZ);

            // ── Terrain Sync, Gravity & Bounce ──
            const baseHeight = getTerrainElevation(pos.x, pos.z);
            const scale = this.scales[i];
            const currentSpeedRatio = vel.length() / c.speed;
            const groundFloor = baseHeight + (c.size * scale) / 2.0;
            
            let walkBounce = 0;
            let currentTumble = 0;
            
            // Airborne physics
            if (this.states[i] === 4) {
                // Apply Gravity
                this.yVelocities[i] -= c.gravity * delta;
                pos.y += this.yVelocities[i] * delta;
                
                // Tumble rotation
                this.tumble[i] += delta * (this.yVelocities[i] + 5.0); // Spin dependent on vertical movement
                currentTumble = this.tumble[i];
                
                // Ground collision hit
                if (pos.y <= groundFloor) {
                    pos.y = groundFloor;
                    this.yVelocities[i] = 0;
                    this.tumble[i] = 0;
                    this.states[i] = 2; // Resume walking
                    this.stateTimers[i] = 1.0; // short stagger
                }
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
