import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

interface BlockExplosion {
  mesh: THREE.InstancedMesh;
  physics: Float32Array; // [px, py, pz, vx, vy, vz, age, maxAge]
  active: boolean;
}

const MAX_EXPLOSIONS = 800;
const SHARDS_PER_BLOCK = 200;

export class MultiMeshParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private explosions: BlockExplosion[] = [];
    private dummy = new THREE.Object3D();
    private nextExplosionIdx = 0;

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

        for (let i = 0; i < MAX_EXPLOSIONS; i++) {
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
        const exp = this.explosions[this.nextExplosionIdx];
        this.nextExplosionIdx = (this.nextExplosionIdx + 1) % MAX_EXPLOSIONS;
        
        exp.active = true;
        exp.mesh.visible = true;
        (exp.mesh.material as THREE.MeshStandardMaterial).emissive.copy(color);
        if (isTreasureMode) {
            (exp.mesh.material as THREE.MeshStandardMaterial).color.copy(color);
            (exp.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
        } else {
            (exp.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
        }

        const count = exp.mesh.count;
        for (let i = 0; i < count; i++) {
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
            exp.physics[pIdx + 7] = 60 + Math.random() * 40; 
        }
        exp.mesh.instanceMatrix.needsUpdate = true;
    }

    public update(mouseW: THREE.Vector3, partDecay: number, partFalloff: number, partSize: number): number {
        let activeExplosionCount = 0;

        for (let e = 0; e < this.explosions.length; e++) {
            const exp = this.explosions[e];
            if (!exp.active) continue;
            
            let aliveShards = 0;
            const shardCount = exp.mesh.count;
            
            for (let i = 0; i < shardCount; i++) {
                const pIdx = i * 8;
                let age = exp.physics[pIdx + 6];
                const maxAge = exp.physics[pIdx + 7];
                
                if (age >= maxAge) {
                    this.dummy.position.set(0, 0, 0);
                    this.dummy.scale.set(0, 0, 0);
                    this.dummy.updateMatrix();
                    exp.mesh.setMatrixAt(i, this.dummy.matrix);
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
                this.dummy.position.set(px, py, pz);
                
                this.dummy.rotation.x = age * 0.1 * vx;
                this.dummy.rotation.y = age * 0.1 * vy;
                this.dummy.rotation.z = age * 0.1 * vz;
                
                const sc = life * partSize;
                this.dummy.scale.set(sc, sc, sc);
                this.dummy.updateMatrix();
                exp.mesh.setMatrixAt(i, this.dummy.matrix);
            }
            
            if (aliveShards > 0) {
                exp.mesh.instanceMatrix.needsUpdate = true;
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
