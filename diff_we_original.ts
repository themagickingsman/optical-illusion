import * as THREE from 'three';

export interface WeaponProjectile {
  id: string;
  type: 'scatter' | 'artillery' | 'flyover' | 'laser' | 'seismic' | 'carpet' | 'blackhole';
  mesh: THREE.Object3D;
  startX: number; startY: number; startZ: number;
  targetX: number; targetY: number; targetZ: number;
  progress: number;
  speed: number;
  radius: number;
  aoe?: number;
  depth: number;
  delayMs?: number;
  startTime?: number;
  durationMs?: number;
  curvePt1?: THREE.Vector3;
  curvePt2?: THREE.Vector3;
  lastImpactRadius?: number;
  partSpeed?: number;
  windLines?: { mesh: THREE.Mesh, startPos: THREE.Vector3, progress: number, speed: number }[];
}

export class WeaponEngine {
  private scene: THREE.Scene;
  private onImpact: (x: number, y: number, z: number, radius: number, depth: number, partSpeed?: number) => void;
  private projectiles: WeaponProjectile[] = [];

  constructor(scene: THREE.Scene, onImpact: (x: number, y: number, z: number, radius: number, depth: number, partSpeed?: number) => void) {
    this.scene = scene;
    this.onImpact = onImpact;
  }

  public clearProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) {
           if (Array.isArray(p.mesh.material)) {
              p.mesh.material.forEach(m => m.dispose());
           } else {
              p.mesh.material.dispose();
           }
        }
        if (p.windLines) {
           for (const wl of p.windLines) {
               if (wl.mesh.parent) wl.mesh.parent.remove(wl.mesh);
               wl.mesh.geometry.dispose();
               (wl.mesh.material as THREE.Material).dispose();
           }
        }
    }
    this.projectiles = [];
  }

  public fire(wpType: string, targetPos: THREE.Vector3, params: any) {
    if (wpType === 'scatter') {
      const pGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      
      for (let b = 0; b < params.count; b++) {
         const pMesh = new THREE.Mesh(pGeo, pMat);
         pMesh.visible = false;
         this.scene.add(pMesh);
         
         const ox = (Math.random() - 0.5) * params.radius;
         const oz = (Math.random() - 0.5) * params.radius;
         const finalX = targetPos.x + ox;
         const finalZ = targetPos.z + oz;
         
         this.projectiles.push({
           id: Math.random().toString(),
           type: 'scatter', mesh: pMesh,
           startX: finalX, startY: targetPos.y + 40 + Math.random() * 20, startZ: finalZ,
           targetX: finalX, targetY: targetPos.y, targetZ: finalZ,
           progress: 0, speed: 0.015 + Math.random() * 0.01,
           radius: params.radius, depth: params.depth,
           delayMs: params.delay, startTime: Date.now(),
           partSpeed: params.partSpeed
         });
      }
    } else if (wpType === 'artillery') {
      const pGeo = new THREE.SphereGeometry(0.6, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xff8833 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.visible = false;
      this.scene.add(pMesh);
      
      const startX = targetPos.x - 30;
      const startZ = targetPos.z - 30;
      const startY = targetPos.y + 40;
      
      this.projectiles.push({
           id: Math.random().toString(),
           type: 'artillery', mesh: pMesh,
           startX, startY, startZ,
           targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
           curvePt1: new THREE.Vector3(startX + 10, startY + 10, startZ + 10),
           curvePt2: new THREE.Vector3(targetPos.x - 5, targetPos.y + 20, targetPos.z - 5),
           progress: 0, speed: 0.015,
           radius: params.radius, depth: params.depth,
           delayMs: params.delay, startTime: Date.now(),
           partSpeed: params.partSpeed
      });
    } else if (wpType === 'flyover') {
      if (params.hitObject && params.hoverPoolRef) {
          const iMesh = params.hitObject as THREE.InstancedMesh;
          const instIdx = params.instanceId ?? 0;
          if (iMesh.userData.coordMap) {
             const blockKey = iMesh.userData.coordMap[instIdx];
             if (blockKey) {
                const poolItem = params.hoverPoolRef.find((p: any) => !p.active);
                if (poolItem) {
                   poolItem.active = true;
                   poolItem.blockKey = blockKey;
                   poolItem.targetAlpha = 0.9;
                   
                   const _dummyMat = new THREE.Matrix4();
                   iMesh.getMatrixAt(instIdx, _dummyMat);
                   poolItem.mesh.position.setFromMatrixPosition(_dummyMat);
                   poolItem.mesh.visible = true;
                   (poolItem.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x3388ff);
                }
             }
          }
      }

      const pGeo = new THREE.BoxGeometry(0.5, 0.5, 1.5);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x3388ff });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      
      const startX = targetPos.x + 20;
      const startY = targetPos.y + 60;
      const startZ = targetPos.z + 20;
      
      pMesh.position.set(startX, startY, startZ);
      pMesh.lookAt(targetPos);
      pMesh.visible = false;
      this.scene.add(pMesh);
      
      this.projectiles.push({
           id: Math.random().toString(),
           type: 'flyover', mesh: pMesh,
           startX, startY, startZ,
           targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
           progress: 0, speed: 0.025,
           radius: params.radius, depth: params.depth,
           delayMs: params.delay, startTime: Date.now(),
           partSpeed: params.partSpeed
      });
    } else if (wpType === 'laser') {
      const pGeo = new THREE.CylinderGeometry(params.radius, params.radius, 2000, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xff1111, transparent: true, opacity: 0.8 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(targetPos.x, targetPos.y + 500, targetPos.z);
      this.scene.add(pMesh);
      
      this.projectiles.push({
           id: Math.random().toString(),
           type: 'laser', mesh: pMesh,
           startX: targetPos.x, startY: targetPos.y + 500, startZ: targetPos.z,
           targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
           progress: 0, speed: 0,
           radius: params.radius, aoe: params.aoe, depth: params.depth,
           delayMs: params.delay, startTime: Date.now(),
           durationMs: params.duration,
           partSpeed: params.partSpeed
      });
    } else if (wpType === 'seismic') {
      const aftershocks = params.count ?? 1;
      for (let i = 0; i < aftershocks; i++) {
          const pGeo = new THREE.RingGeometry(0.1, 0.4, 32);
          const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1, side: THREE.DoubleSide });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.rotation.x = -Math.PI / 2;
          pMesh.position.set(targetPos.x, targetPos.y + 1, targetPos.z);
          pMesh.visible = false;
          this.scene.add(pMesh);
          
          this.projectiles.push({
              id: Math.random().toString(),
              type: 'seismic', mesh: pMesh,
              startX: targetPos.x, startY: targetPos.y + 1, startZ: targetPos.z,
              targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
              progress: 0, speed: params.speed / 1000,
              radius: params.radius, depth: params.depth,
              delayMs: params.delay + (i * 300), // 300ms delay between aftershocks
              startTime: Date.now(),
              partSpeed: params.partSpeed
          });
      }
    } else if (wpType === 'carpet') {
      const angle = Math.random() * Math.PI * 2;
      const spacing = 3;
      const dx = Math.cos(angle) * spacing;
      const dz = Math.sin(angle) * spacing;
      
      const startOffsetX = targetPos.x - (params.count / 2) * dx;
      const startOffsetZ = targetPos.z - (params.count / 2) * dz;
      
      for (let j = 0; j < params.count; j++) {
        const bx = startOffsetX + j * dx;
        const bz = startOffsetZ + j * dz;
      
        const pGeo = new THREE.BoxGeometry(0.5, 0.5, 1.5);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x66dd66 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        
        const startX = bx + 20;
        const startY = targetPos.y + 60;
        const startZ = bz + 20;
        
        pMesh.position.set(startX, startY, startZ);
        pMesh.lookAt(new THREE.Vector3(bx, targetPos.y, bz));
        pMesh.visible = false;
        this.scene.add(pMesh);
        
        this.projectiles.push({
           id: Math.random().toString(),
           type: 'carpet', mesh: pMesh,
           startX, startY, startZ,
           targetX: bx, targetY: targetPos.y, targetZ: bz,
           progress: 0, speed: 0.05,
           radius: params.radius, depth: params.depth,
           delayMs: j * params.delay, startTime: Date.now(),
           partSpeed: params.partSpeed
        });
      }
    } else if (wpType === 'blackhole') {
      const pGeo = new THREE.SphereGeometry(params.radius * 0.2, 32, 32);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x050111 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(targetPos.x, targetPos.y + 5, targetPos.z);
      this.scene.add(pMesh);
      
      this.projectiles.push({
           id: Math.random().toString(),
           type: 'blackhole', mesh: pMesh,
           startX: targetPos.x, startY: targetPos.y + 5, startZ: targetPos.z,
           targetX: targetPos.x, targetY: targetPos.y, targetZ: targetPos.z,
           progress: 0, speed: 0,
           radius: params.radius, depth: params.depth,
           delayMs: params.delay, startTime: Date.now(),
           durationMs: params.duration,
           partSpeed: params.partSpeed,
           windLines: []
      });
    }
  }

  public update() {
    const now = Date.now();
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.delayMs && p.startTime && now - p.startTime < p.delayMs) {
        p.mesh.visible = false;
        continue;
      }
      p.mesh.visible = true;

      p.progress += p.speed;

      if (p.type === 'artillery' && p.curvePt1 && p.curvePt2) {
        const t = p.progress;
        const mt = 1 - t;
        const x = mt*mt*mt*p.startX + 3*mt*mt*t*p.curvePt1.x + 3*mt*t*t*p.curvePt2.x + t*t*t*p.targetX;
        const y = mt*mt*mt*p.startY + 3*mt*mt*t*p.curvePt1.y + 3*mt*t*t*p.curvePt2.y + t*t*t*p.targetY;
        const z = mt*mt*mt*p.startZ + 3*mt*mt*t*p.curvePt1.z + 3*mt*t*t*p.curvePt2.z + t*t*t*p.targetZ;
        p.mesh.position.set(x, y, z);
      } else if (p.type === 'seismic') {
        p.mesh.visible = false; // Hide the 2D flat cylinder graphic
        const clampedProgress = Math.min(1.0, p.progress);
        const scale = 1 + clampedProgress * p.radius;
        p.mesh.scale.set(scale, scale, scale);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - clampedProgress;
        
        if (clampedProgress < 1.0) {
            const r = (typeof p.radius === 'number' && !isNaN(p.radius) && p.radius > 0) ? p.radius : 8;
            const d = (typeof p.depth === 'number' && !isNaN(p.depth) && p.depth > 0) ? p.depth : 3;
            const ps = (typeof p.partSpeed === 'number' && !isNaN(p.partSpeed)) ? p.partSpeed : 1;
            
            const currentRadius = clampedProgress * r;
            if (p.lastImpactRadius === undefined) p.lastImpactRadius = 0;
            
            if (currentRadius - p.lastImpactRadius >= 0.5) {
                console.log("Seismic Impact!", currentRadius);
                this.onImpact(p.targetX, p.targetY, p.targetZ, currentRadius, d, ps);
                p.lastImpactRadius = currentRadius;
            }
        }
      } else if (p.type === 'laser') {
        const freq = 0.122; // ~19.4 Hz (12Hz * 1.618 Golden Ratio)
        p.mesh.scale.x = 1.0 + Math.sin(now * freq) * 0.1;
        p.mesh.scale.z = 1.0 + Math.sin(now * freq) * 0.1;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(now * freq) * 0.25;
        if (p.startTime && p.durationMs && now - p.startTime > (p.delayMs || 0) + p.durationMs) {
          p.progress = 1.1; 
        }
      } else if (p.type === 'blackhole') {
        if (p.startTime && p.durationMs) {
            const elapsed = now - p.startTime;
            p.progress = Math.min(1.0, elapsed / p.durationMs);
        }
        p.mesh.rotation.y += 0.1;
        p.mesh.rotation.x += 0.05;
        const s = 1.0 + p.progress * 0.5;
        p.mesh.scale.set(s, s, s);
        
        if (Math.random() < 0.4 + p.progress * 0.5) {
            const numLines = Math.floor(1 + p.progress * 4);
            for (let i = 0; i < numLines; i++) {
                const wGeo = new THREE.BoxGeometry(0.4, 0.4, 4.0);
                const wMat = new THREE.MeshBasicMaterial({ color: 0xff33cc, transparent: true, opacity: 0.8 });
                const wMesh = new THREE.Mesh(wGeo, wMat);
                
                const theta = Math.random() * Math.PI * 2;
                const rad = p.radius * (0.6 + Math.random() * 0.8);
                const sy = p.targetY + 1 + Math.random() * 8;
                const sx = p.targetX + Math.cos(theta) * rad;
                const sz = p.targetZ + Math.sin(theta) * rad;
                
                wMesh.position.set(sx, sy, sz);
                wMesh.lookAt(p.targetX, p.targetY + 5, p.targetZ);
                this.scene.add(wMesh);
                
                if (!p.windLines) p.windLines = [];
                p.windLines.push({
                    mesh: wMesh,
                    startPos: new THREE.Vector3(sx, sy, sz),
                    progress: 0,
                    speed: 0.01 + p.progress * 0.08
                });
            }
        }
        
        if (p.windLines) {
            for (let i = p.windLines.length - 1; i >= 0; i--) {
                const wl = p.windLines[i];
                wl.progress += wl.speed * (1.0 + wl.progress * 2.0); // Accelerate as it gets closer
                if (wl.progress >= 1.0) {
                    if (wl.mesh.parent) wl.mesh.parent.remove(wl.mesh);
                    wl.mesh.geometry.dispose();
                    (wl.mesh.material as THREE.Material).dispose();
                    p.windLines.splice(i, 1);
                } else {
                    wl.mesh.position.lerpVectors(wl.startPos, p.mesh.position, wl.progress);
                    const scale = 1.0 - wl.progress;
                    wl.mesh.scale.set(scale, scale, Math.max(0.2, scale));
                }
            }
        }
        
        if (p.startTime && p.durationMs && now - p.startTime > (p.delayMs || 0) + p.durationMs) {
          p.progress = 1.1;
        }
      } else {
        const x = p.startX + (p.targetX - p.startX) * p.progress;
        const y = p.startY + (p.targetY - p.startY) * p.progress;
        const z = p.startZ + (p.targetZ - p.startZ) * p.progress;
        p.mesh.position.set(x, y, z);
      }

      // Handle continuous impacts
      if ((p.type === 'laser') && p.progress < 1.0) {
        if (Math.random() < 0.4) {
           if (p.type === 'laser') {
               // Drill perfectly matching the visual cylinder radius (or custom AOE), 1 block deep per tick
               this.onImpact(p.targetX, p.targetY, p.targetZ, p.aoe !== undefined ? p.aoe : p.radius, 1, p.partSpeed);
           } else {
               const shakeRad = p.radius;
               const ox = (Math.random() - 0.5) * shakeRad;
               const oz = (Math.random() - 0.5) * shakeRad;
               this.onImpact(p.targetX + ox, p.targetY, p.targetZ + oz, 1, p.depth, p.partSpeed);
           }
        }
      }

      if (p.progress >= 1.0) {
        if (p.type !== 'laser' && p.type !== 'seismic') {
          this.onImpact(p.targetX, p.targetY, p.targetZ, p.radius, p.depth, p.partSpeed);
        } else if (p.type === 'seismic') {
          // Final cleanup impact to ensure full radius is reached exactly
          const r = (typeof p.radius === 'number' && !isNaN(p.radius) && p.radius > 0) ? p.radius : 8;
          const d = (typeof p.depth === 'number' && !isNaN(p.depth) && p.depth > 0) ? p.depth : 3;
          const ps = (typeof p.partSpeed === 'number' && !isNaN(p.partSpeed)) ? p.partSpeed : 1;
          this.onImpact(p.targetX, p.targetY, p.targetZ, r, d, ps);
        }
        
        if (p.mesh.parent) {
          p.mesh.parent.remove(p.mesh);
        }
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) {
           if (Array.isArray(p.mesh.material)) {
              p.mesh.material.forEach(m => m.dispose());
           } else {
              p.mesh.material.dispose();
           }
        }
         
         if (p.windLines) {
             p.windLines.forEach(wl => {
                 if (wl.mesh.parent) wl.mesh.parent.remove(wl.mesh);
                 if (wl.mesh.geometry) wl.mesh.geometry.dispose();
                 if (wl.mesh.material) (wl.mesh.material as THREE.Material).dispose();
             });
         }
         
         this.projectiles.splice(i, 1);
       }
    }
  }

  public dispose() {
    this.projectiles.forEach(p => {
       if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
       if (p.mesh.geometry) p.mesh.geometry.dispose();
       if (p.mesh.material) {
          if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
          else p.mesh.material.dispose();
       }
       if (p.windLines) {
           p.windLines.forEach(wl => {
               if (wl.mesh.parent) wl.mesh.parent.remove(wl.mesh);
               wl.mesh.geometry.dispose();
               if (wl.mesh.material) (wl.mesh.material as THREE.Material).dispose();
           });
       }
    });
    this.projectiles = [];
  }

  public getProjectiles() {
    return this.projectiles;
  }
}
