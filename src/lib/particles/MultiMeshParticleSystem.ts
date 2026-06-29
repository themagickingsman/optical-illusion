import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

interface BlockExplosion {
  mesh: THREE.InstancedMesh | THREE.Points;
  physics: Float32Array; // [px, py, pz, vx, vy, vz, age, maxAge]
  active: boolean;
  pointPositions?: Float32Array;
}

const SHARDS_PER_BLOCK = 200;

export class MultiMeshParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private explosions: BlockExplosion[] = [];
    private dummy = new THREE.Object3D();
    private nextExplosionIdx = 0;
    private dimensionType: '2D' | '3D';
    private maxExplosions: number;

    constructor(dimensionType: '2D' | '3D' = '2D', maxExplosions: number = 200) {
        this.dimensionType = dimensionType;
        this.maxExplosions = maxExplosions;
        this.group = new THREE.Group();
        
        if (this.dimensionType === '3D') {
            const boxGeo = new THREE.PlaneGeometry(0.15, 0.15); 
            const boxMat = new THREE.MeshStandardMaterial({ 
               color: 0xffffff,
               roughness: 0.2,
               metalness: 0.1,
               transparent: true,
               opacity: 1.0,
               emissiveIntensity: 1.5,
               depthWrite: true
            });

            for (let i = 0; i < this.maxExplosions; i++) {
               const mesh = new THREE.InstancedMesh(boxGeo, boxMat.clone(), SHARDS_PER_BLOCK);
               mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
               mesh.visible = false;
               this.group.add(mesh);
               this.explosions.push({
                  mesh,
                  physics: new Float32Array(SHARDS_PER_BLOCK * 8),
                  active: false
               });
            }
        } else {
            const pointMat = new THREE.ShaderMaterial({
                uniforms: {
                    uSize: { value: 6.0 },
                    uPixelRatio: { value: window.devicePixelRatio || 1.0 }
                },
                vertexShader: `
                    attribute float opacity;
                    attribute vec3 instanceColor;
                    varying float vOpacity;
                    varying vec3 vColor;
                    uniform float uSize;
                    uniform float uPixelRatio;
                    void main() {
                        vOpacity = opacity;
                        vColor = instanceColor;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        gl_PointSize = uSize * uPixelRatio;
                    }
                `,
                fragmentShader: `
                    varying float vOpacity;
                    varying vec3 vColor;
                    void main() {
                        vec2 xy = gl_PointCoord.xy - vec2(0.5);
                        float ll = length(xy);
                        if (ll > 0.5) discard;
                        gl_FragColor = vec4(vColor, vOpacity);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            for (let i = 0; i < this.maxExplosions; i++) {
                const pointGeo = new THREE.BufferGeometry();
                const pointPositions = new Float32Array(SHARDS_PER_BLOCK * 3);
                const pointOpacities = new Float32Array(SHARDS_PER_BLOCK);
                const pointColors = new Float32Array(SHARDS_PER_BLOCK * 3);
                
                for (let j = 0; j < SHARDS_PER_BLOCK; j++) {
                    pointPositions[j * 3 + 1] = -9999;
                    pointOpacities[j] = 0.0;
                }
                
                pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
                pointGeo.setAttribute('opacity', new THREE.BufferAttribute(pointOpacities, 1));
                pointGeo.setAttribute('instanceColor', new THREE.BufferAttribute(pointColors, 3));
                
                const mesh = new THREE.Points(pointGeo, pointMat.clone());
                mesh.visible = false;
                
                this.group.add(mesh);
                this.explosions.push({
                    mesh,
                    physics: new Float32Array(SHARDS_PER_BLOCK * 8),
                    active: false,
                    pointPositions
                });
            }
        }
    }

    public explode(
        x: number, 
        y: number, 
        z: number, 
        force: number, 
        radius: number, 
        color: THREE.Color,
        isTreasureMode: boolean = false,
        amount?: number,
        bloomParticlesOnly?: boolean
    ): void {
        const exp = this.explosions[this.nextExplosionIdx];
        this.nextExplosionIdx = (this.nextExplosionIdx + 1) % this.maxExplosions;
        
        exp.active = true;
        exp.mesh.visible = true;
        
        if (this.dimensionType === '3D') {
            (exp.mesh.material as THREE.MeshStandardMaterial).emissive.copy(color);
            if (isTreasureMode) {
                (exp.mesh.material as THREE.MeshStandardMaterial).color.copy(color);
                (exp.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
            } else {
                (exp.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
                (exp.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = bloomParticlesOnly ? 10.0 : 1.5;
            }
        } else {
            const emitC = amount !== undefined ? Math.min(amount, SHARDS_PER_BLOCK) : SHARDS_PER_BLOCK;
            const colorsAttr = exp.mesh.geometry.attributes.instanceColor as THREE.BufferAttribute;
            const scale = bloomParticlesOnly ? 10.0 : 1.5;
            for (let j = 0; j < emitC; j++) {
                colorsAttr.array[j * 3 + 0] = color.r * scale;
                colorsAttr.array[j * 3 + 1] = color.g * scale;
                colorsAttr.array[j * 3 + 2] = color.b * scale;
            }
            colorsAttr.needsUpdate = true;
        }

        const emitCount = amount !== undefined ? Math.min(amount, SHARDS_PER_BLOCK) : SHARDS_PER_BLOCK;
        for (let i = 0; i < emitCount; i++) {
            const pIdx = i * 8;
            exp.physics[pIdx + 0] = x + (Math.random() - 0.5) * 0.8; 
            exp.physics[pIdx + 1] = y + (Math.random() - 0.5) * 0.8; 
            exp.physics[pIdx + 2] = z + (Math.random() - 0.5) * 0.8; 
            
            const speed = (force * 0.05) + Math.random() * (force * 0.03);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            exp.physics[pIdx + 3] = Math.sin(phi) * Math.cos(theta) * speed; 
            exp.physics[pIdx + 4] = Math.abs(Math.cos(phi)) * speed + (force * 0.02); 
            exp.physics[pIdx + 5] = Math.sin(phi) * Math.sin(theta) * speed; 
            
            exp.physics[pIdx + 6] = 0; 
            exp.physics[pIdx + 7] = 120 + Math.random() * 120; 
        }

        for (let i = emitCount; i < SHARDS_PER_BLOCK; i++) {
            const pIdx = i * 8;
            exp.physics[pIdx + 6] = 999; 
            exp.physics[pIdx + 7] = 0;   
            
            if (this.dimensionType === '3D') {
                this.dummy.position.set(0, 0, 0);
                this.dummy.scale.set(0, 0, 0);
                this.dummy.updateMatrix();
                (exp.mesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
            } else if (exp.mesh.geometry.attributes.position) {
                const pos = exp.mesh.geometry.attributes.position as THREE.BufferAttribute;
                pos.array[i * 3 + 1] = -9999;
                const op = exp.mesh.geometry.attributes.opacity as THREE.BufferAttribute;
                if (op) op.array[i] = 0;
            }
        }
        
        if (this.dimensionType === '3D') {
            (exp.mesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
        } else if (exp.mesh.geometry.attributes.position) {
            exp.mesh.geometry.attributes.position.needsUpdate = true;
        }
    }

    public update(mouseW: THREE.Vector3, partDecay: number, partFalloff: number, partSize: number): number {
        let activeExplosionCount = 0;

        for (let e = 0; e < this.explosions.length; e++) {
            const exp = this.explosions[e];
            if (!exp.active) continue;
            
            let aliveShards = 0;
            const shardCount = SHARDS_PER_BLOCK;
            
            for (let i = 0; i < shardCount; i++) {
                const pIdx = i * 8;
                let age = exp.physics[pIdx + 6];
                const maxAge = exp.physics[pIdx + 7];
                
                if (age >= maxAge) {
                    if (age === maxAge) {
                        if (this.dimensionType === '3D') {
                            this.dummy.position.set(0, 0, 0);
                            this.dummy.scale.set(0, 0, 0);
                            this.dummy.updateMatrix();
                            (exp.mesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
                        } else if (exp.mesh.geometry.attributes.position) {
                            const pos = exp.mesh.geometry.attributes.position as THREE.BufferAttribute;
                            pos.array[i * 3 + 1] = -9999;
                            const op = exp.mesh.geometry.attributes.opacity as THREE.BufferAttribute;
                            if (op) op.array[i] = 0;
                        }
                        exp.physics[pIdx + 6] = maxAge + 1;
                    }
                    continue;
                }
                
                age++;
                exp.physics[pIdx + 6] = age;
                aliveShards++;
                
                let px = exp.physics[pIdx + 0];
                let py = exp.physics[pIdx + 1];
                let pz = exp.physics[pIdx + 2];
                let vx = exp.physics[pIdx + 3];
                let vy = exp.physics[pIdx + 4];
                let vz = exp.physics[pIdx + 5];

                const magnetPhase = Math.min(1, Math.max(0, (age - 40) / 70));
                if (magnetPhase > 0) {
                    const dx = mouseW.x - px;
                    const dy = mouseW.y - py;
                    const dz = mouseW.z - pz;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.8;
                    const force = magnetPhase * 0.006 / (dist * 0.4 + 0.5);
                    vx += (dx / dist) * force;
                    vy += (dy / dist) * force;
                    vz += (dz / dist) * force;
                }

                vx *= partDecay;
                vy  = vy * partDecay - partFalloff;
                vz *= partDecay;
                
                if (py < 0 && vy < 0) {
                    vy = -vy * 0.4;
                    vx *= 0.8;
                    vz *= 0.8;
                    py = 0;
                }
                
                px += vx;
                py += vy;
                pz += vz;
                
                exp.physics[pIdx + 0] = px;
                exp.physics[pIdx + 1] = py;
                exp.physics[pIdx + 2] = pz;
                exp.physics[pIdx + 3] = vx;
                exp.physics[pIdx + 4] = vy;
                exp.physics[pIdx + 5] = vz;

                const life = 1 - age / maxAge;
                
                if (this.dimensionType === '3D') {
                    this.dummy.position.set(px, py, pz);
                    this.dummy.rotation.x = age * 0.1 * vx;
                    this.dummy.rotation.y = age * 0.1 * vy;
                    this.dummy.rotation.z = age * 0.1 * vz;
                    
                    const sc = life * partSize;
                    this.dummy.scale.set(sc, sc, sc);
                    this.dummy.updateMatrix();
                    (exp.mesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
                } else if (exp.mesh.geometry.attributes.position) {
                    const pos = exp.mesh.geometry.attributes.position as THREE.BufferAttribute;
                    pos.array[i * 3 + 0] = px;
                    pos.array[i * 3 + 1] = py;
                    pos.array[i * 3 + 2] = pz;
                    const op = exp.mesh.geometry.attributes.opacity as THREE.BufferAttribute;
                    if (op) op.array[i] = life;
                }
            }
            
            if (aliveShards > 0) {
                if (this.dimensionType === '3D') {
                    (exp.mesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
                } else if (exp.mesh.geometry.attributes.position) {
                    exp.mesh.geometry.attributes.position.needsUpdate = true;
                    if (exp.mesh.geometry.attributes.opacity) {
                        exp.mesh.geometry.attributes.opacity.needsUpdate = true;
                    }
                }
                activeExplosionCount++;
            } else {
                exp.active = false;
                exp.mesh.visible = false;
            }
        }

        return activeExplosionCount;
    }

    public dispose(): void {
        for (const exp of this.explosions) {
            exp.mesh.geometry.dispose();
            (exp.mesh.material as THREE.Material).dispose();
            this.group.remove(exp.mesh);
        }
        this.explosions = [];
    }
}
