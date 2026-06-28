import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

const MAX_PARTICLES = 50000;
const SHARDS_PER_EXPLOSION = 200;

export class GlobalInstancedParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private mesh: THREE.InstancedMesh;
    private physics: Float32Array; // [px, py, pz, vx, vy, vz, age, maxAge]
    private dummy = new THREE.Object3D();
    private nextParticleIdx = 0;

    constructor() {
        this.group = new THREE.Group();
        
        const boxGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15); 
        const boxMat = new THREE.MeshStandardMaterial({ 
           color: 0xffffff,
           roughness: 0.2,
           metalness: 0.1,
           transparent: true,
           opacity: 1.0,
           emissiveIntensity: 1.5,
        });

        this.mesh = new THREE.InstancedMesh(boxGeo, boxMat, MAX_PARTICLES);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        // Hide all initially
        const m = new THREE.Matrix4();
        m.makeScale(0, 0, 0);
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.mesh.setMatrixAt(i, m);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        
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
        isTreasureMode: boolean = false
    ): void {
        // We set the base material color (since it's a global mesh, color tinting per explosion 
        // using vertex colors would be better, but for simplicity we'll just tint the whole mesh 
        // to the latest explosion color, or rely on white emissive).
        // To properly support multi-colored explosions in a single mesh, we use setTargetColorAt.
        (this.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isTreasureMode ? 2.0 : 1.5;

        for (let i = 0; i < SHARDS_PER_EXPLOSION; i++) {
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
            this.physics[pIdx + 7] = 60 + Math.random() * 40; 
            
            this.mesh.setColorAt(idx, color);
        }
        
        if (this.mesh.instanceColor) {
            this.mesh.instanceColor.needsUpdate = true;
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
                // If it just died, hide it once
                if (age === maxAge) {
                    this.dummy.position.set(0, 0, 0);
                    this.dummy.scale.set(0, 0, 0);
                    this.dummy.updateMatrix();
                    this.mesh.setMatrixAt(i, this.dummy.matrix);
                    this.physics[pIdx + 6] = maxAge + 1; // Mark strictly dead
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
            this.dummy.position.set(px, py, pz);
            
            this.dummy.rotation.x = age * 0.1 * vx;
            this.dummy.rotation.y = age * 0.1 * vy;
            this.dummy.rotation.z = age * 0.1 * vz;
            
            const sc = life * partSize;
            this.dummy.scale.set(sc, sc, sc);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        
        if (needsUpdate) {
            this.mesh.instanceMatrix.needsUpdate = true;
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
