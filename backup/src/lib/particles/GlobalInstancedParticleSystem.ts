import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

const MAX_PARTICLES = 50000;
const SHARDS_PER_EXPLOSION = 200;

export class GlobalInstancedParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private mesh: THREE.InstancedMesh | THREE.Points;
    private physics: Float32Array; // [px, py, pz, vx, vy, vz, age, maxAge]
    private dummy = new THREE.Object3D();
    private nextParticleIdx = 0;
    private dimensionType: '2D' | '3D';
    private pointPositions?: Float32Array;
    private pointColors?: Float32Array;

    constructor(dimensionType: '2D' | '3D' = '2D') {
        this.dimensionType = dimensionType;
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

            this.mesh = new THREE.InstancedMesh(boxGeo, boxMat, MAX_PARTICLES);
            (this.mesh as THREE.InstancedMesh).instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            const m = new THREE.Matrix4();
            m.makeScale(0, 0, 0);
            for (let i = 0; i < MAX_PARTICLES; i++) {
                (this.mesh as THREE.InstancedMesh).setMatrixAt(i, m);
            }
            (this.mesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
        } else {
            const pointGeo = new THREE.BufferGeometry();
            this.pointPositions = new Float32Array(MAX_PARTICLES * 3);
            this.pointColors = new Float32Array(MAX_PARTICLES * 3);
            
            // Hide all initially
            for (let i = 0; i < MAX_PARTICLES; i++) {
                this.pointPositions[i * 3 + 1] = -9999;
            }
            
            pointGeo.setAttribute('position', new THREE.BufferAttribute(this.pointPositions, 3));
            pointGeo.setAttribute('color', new THREE.BufferAttribute(this.pointColors, 3));
            
            const pointMat = new THREE.PointsMaterial({
                size: 6, // Size in perspective scale
                sizeAttenuation: false,
                vertexColors: true,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            this.mesh = new THREE.Points(pointGeo, pointMat);
        }
        
        this.group.add(this.mesh);
        
        // Initialize physics array, all age=0, maxAge=0 (dead)
        this.physics = new Float32Array(MAX_PARTICLES * 8);
    }

    public explode(
        x: number, 
        y: number, 
        z: number, 
        force: number, 
        radius: number, 
        color: THREE.Color,
        isTreasureMode: boolean = false,
        amount: number = SHARDS_PER_EXPLOSION,
        bloomParticlesOnly?: boolean
    ): void {
        if (this.dimensionType === '3D') {
            (this.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isTreasureMode ? 2.0 : (bloomParticlesOnly ? 10.0 : 1.5);
        } else {
            // PointsMaterial has no emissiveIntensity, so we multiply the base color to trigger UnrealBloomPass threshold
            const scale = isTreasureMode ? 2.0 : (bloomParticlesOnly ? 10.0 : 1.5);
            (this.mesh.material as THREE.PointsMaterial).color.setHex(0xffffff).multiplyScalar(scale);
        }
        const emitCount = Math.min(amount, MAX_PARTICLES);
        for (let i = 0; i < emitCount; i++) {
            const idx = this.nextParticleIdx;
            this.nextParticleIdx = (this.nextParticleIdx + 1) % MAX_PARTICLES;
            
            const pIdx = idx * 8;
            this.physics[pIdx + 0] = x + (Math.random() - 0.5) * 0.8; 
            this.physics[pIdx + 1] = y + (Math.random() - 0.5) * 0.8; 
            this.physics[pIdx + 2] = z + (Math.random() - 0.5) * 0.8; 
            
            const speed = (force * 0.05) + Math.random() * (force * 0.03);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            this.physics[pIdx + 3] = Math.sin(phi) * Math.cos(theta) * speed; 
            this.physics[pIdx + 4] = Math.abs(Math.cos(phi)) * speed + (force * 0.02); 
            this.physics[pIdx + 5] = Math.sin(phi) * Math.sin(theta) * speed; 
            
            this.physics[pIdx + 6] = 0; 
            this.physics[pIdx + 7] = 120 + Math.random() * 120; // 2 to 4 seconds
            
            if (this.dimensionType === '3D') {
                (this.mesh as THREE.InstancedMesh).setColorAt(idx, color);
            } else if (this.pointColors) {
                const mult = isTreasureMode ? 1.5 : 1.0;
                this.pointColors[idx * 3] = color.r * mult;
                this.pointColors[idx * 3 + 1] = color.g * mult;
                this.pointColors[idx * 3 + 2] = color.b * mult;
            }
        }
        
        if (this.dimensionType === '3D' && (this.mesh as THREE.InstancedMesh).instanceColor) {
            (this.mesh as THREE.InstancedMesh).instanceColor.needsUpdate = true;
        } else if (this.dimensionType === '2D' && this.mesh.geometry.attributes.color) {
            this.mesh.geometry.attributes.color.needsUpdate = true;
        }
    }

    public update(mouseW: THREE.Vector3, partDecay: number, partFalloff: number, partSize: number): number {
        let aliveShards = 0;
        let needsUpdate = false;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const pIdx = i * 8;
            let age = this.physics[pIdx + 6];
            const maxAge = this.physics[pIdx + 7];
            
            if (age >= maxAge) {
                if (age === maxAge) {
                    if (this.dimensionType === '3D') {
                        this.dummy.position.set(0, 0, 0);
                        this.dummy.scale.set(0, 0, 0);
                        this.dummy.updateMatrix();
                        (this.mesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
                    } else if (this.pointPositions) {
                        this.pointPositions[i * 3 + 1] = -9999;
                    }
                    this.physics[pIdx + 6] = maxAge + 1; 
                    needsUpdate = true;
                }
                continue;
            }
            
            age++;
            this.physics[pIdx + 6] = age;
            aliveShards++;
            needsUpdate = true;
            
            let px = this.physics[pIdx + 0];
            let py = this.physics[pIdx + 1];
            let pz = this.physics[pIdx + 2];
            let vx = this.physics[pIdx + 3];
            let vy = this.physics[pIdx + 4];
            let vz = this.physics[pIdx + 5];

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
            
            this.physics[pIdx + 0] = px;
            this.physics[pIdx + 1] = py;
            this.physics[pIdx + 2] = pz;
            this.physics[pIdx + 3] = vx;
            this.physics[pIdx + 4] = vy;
            this.physics[pIdx + 5] = vz;

            const life = 1 - age / maxAge;
            
            if (this.dimensionType === '3D') {
                this.dummy.position.set(px, py, pz);
                this.dummy.rotation.x = age * 0.1 * vx;
                this.dummy.rotation.y = age * 0.1 * vy;
                this.dummy.rotation.z = age * 0.1 * vz;
                
                const sc = life * partSize;
                this.dummy.scale.set(sc, sc, sc);
                this.dummy.updateMatrix();
                (this.mesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
            } else if (this.pointPositions) {
                this.pointPositions[i * 3 + 0] = px;
                this.pointPositions[i * 3 + 1] = py;
                this.pointPositions[i * 3 + 2] = pz;
            }
        }
        
        if (needsUpdate) {
            if (this.dimensionType === '3D') {
                (this.mesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
            } else if (this.mesh.geometry.attributes.position) {
                this.mesh.geometry.attributes.position.needsUpdate = true;
            }
        }

        // Return pseudo explosion count based on alive shards
        return Math.ceil(aliveShards / SHARDS_PER_EXPLOSION);
    }

    public dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
        this.group.remove(this.mesh);
    }
}
