  // ── Spawn Particles from an Explosion ──
  const spawnExplosionParticles = useCallback((x: number, y: number, z: number, r: number, g: number, b: number) => {
      const count = partCountRef.current;
      const speedMult = partSpeedRef.current;
      const lifeMax = partLifeRef.current;
      
      for (let i = 0; i < count; i++) {
         const p = getFreeParticle();
         if (!p) break;
         
         // Random velocity out from center (sphere burst)
         const phi = Math.acos( -1 + ( 2 * Math.random() ) );
         const theta = Math.random() * Math.PI * 2;
         const vmag = (Math.random() * 0.8 + 0.2) * speedMult;
         
         p.alive = true;
         p.age = 0;
         p.maxAge = (Math.random() * 0.5 + 0.5) * lifeMax;
         p.px = x + (Math.random() - 0.5) * 0.5;
         p.py = y + (Math.random() - 0.5) * 0.5;
         p.pz = z + (Math.random() - 0.5) * 0.5;
         
         p.vx = Math.sin(phi) * Math.cos(theta) * vmag;
         p.vy = Math.cos(phi) * vmag + (Math.random() * 0.5); // extra up force
         p.vz = Math.sin(phi) * Math.sin(theta) * vmag;
         
         p.r = r; p.g = g; p.b = b;
      }
  }, []);

  // ── Fire Weapon / Add Projectile ──
  const fireWeapon = useCallback((targetX: number, targetZ: number, wType: string) => {
      const scene = sceneRef.current;
      if (!scene) return;
      
      const startY = 40; // drop from sky
      const startX = targetX + (Math.random() - 0.5) * 40;
      const startZ = targetZ + (Math.random() - 0.5) * 40;
      
      let radius = scatterRadiusRef.current;
      let depth = scatterDepthRef.current;
      
      let matColor = 0xffffff;
      let geo: THREE.BufferGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      
      const proj: WeaponProjectile = {
         id: Math.random().toString(36),
         type: wType as any,
         mesh: new THREE.Mesh(),
         startX, startY, startZ,
         targetX, targetY: 0, targetZ, // We calculate Y based on terrain at target later
         progress: 0,
         speed: 1.0,
         radius: 1, depth: 1
      };
      
      // Determine ground height at target
      const w = terrainRef.current[0]?.length || 0;
      const h = terrainRef.current.length || 0;
      const gridX = Math.round(targetX + w/2);
      const gridZ = Math.round(targetZ + h/2);
      let groundY = 0;
      if (gridZ >= 0 && gridZ < h && gridX >= 0 && gridX < w) {
          groundY = terrainRef.current[gridZ][gridX] || 0;
      }
      proj.targetY = groundY;

      if (wType === 'scatter') {
         radius = scatterRadiusRef.current;
         depth = scatterDepthRef.current;
         matColor = 0xff3300;
         proj.speed = 2.5;
         // Slight curve
         proj.curvePt1 = new THREE.Vector3(startX, startY + 10, startZ);
         proj.curvePt2 = new THREE.Vector3(targetX, targetY + 10, targetZ);
      } 
      else if (wType === 'artillery') {
         radius = artilleryRadiusRef.current;
         depth = artilleryDepthRef.current;
         matColor = 0xffaa00;
         proj.speed = 0.8;
         geo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
         // High arc
         proj.curvePt1 = new THREE.Vector3(startX, startY + 40, startZ);
         proj.curvePt2 = new THREE.Vector3(targetX, targetY + 40, targetZ);
      }
      else if (wType === 'flyover') {
         radius = flyoverRadiusRef.current;
         depth = flyoverDepthRef.current;
         matColor = 0x00ffff;
         proj.speed = 1.5;
         geo = new THREE.ConeGeometry(0.5, 2, 8);
         proj.mesh.rotation.x = Math.PI/2; // point forward
      }
      else if (wType === 'laser') {
         radius = laserRadiusRef.current;
         depth = laserDepthRef.current;
         matColor = 0xff0055;
         proj.speed = 0; // doesn't move
         geo = new THREE.CylinderGeometry(radius, radius, 40, 16);
         proj.durationMs = laserDurationRef.current;
         proj.startTime = performance.now();
      }
      else if (wType === 'seismic') {
         radius = seismicRadiusRef.current;
         depth = seismicDepthRef.current;
         matColor = 0x88ff00;
         proj.speed = seismicSpeedRef.current / 100;
         geo = new THREE.TorusGeometry(1, 0.2, 8, 32);
         proj.mesh.rotation.x = Math.PI/2;
      }
      else if (wType === 'carpet') {
         radius = carpetRadiusRef.current;
         depth = carpetDepthRef.current;
         matColor = 0xff5500;
         proj.speed = 2.0;
         proj.curvePt1 = new THREE.Vector3(startX, startY - 10, startZ);
         proj.curvePt2 = new THREE.Vector3(targetX, targetY + 5, targetZ);
      }
      else if (wType === 'blackhole') {
         radius = blackholeRadiusRef.current;
         depth = blackholeDepthRef.current;
         matColor = 0x110022;
         proj.speed = 1.0; // timeline progress for scale
         geo = new THREE.SphereGeometry(1, 16, 16);
         proj.durationMs = blackholeDurationRef.current;
         proj.startTime = performance.now();
      }
      
      proj.radius = radius;
      proj.depth = depth;
      
      const mat = new THREE.MeshStandardMaterial({
          color: matColor, emissive: matColor, emissiveIntensity: 2.0,
          roughness: 0.1, metalness: 0.8
      });
      proj.mesh.geometry = geo;
      proj.mesh.material = mat;
      proj.mesh.position.set(startX, startY, startZ);
      
      scene.add(proj.mesh);
      weaponProjectilesRef.current.push(proj);

  }, []);

  // ── Trigger Explosion Logic ──
  const triggerExplosion = useCallback((cx: number, cz: number, radius: number, depth: number) => {
     if (radius <= 0) return;
     const w = terrainRef.current[0]?.length || 0;
     const h = terrainRef.current.length || 0;
     const gridX = Math.round(cx + w/2);
     const gridZ = Math.round(cz + h/2);
     
     let brokenCount = 0;
     const rSq = radius * radius;
     
     setBrokenBlocks(prev => {
         const next = new Set(prev);
         
         // Scan area
         for (let dz = -radius; dz <= radius; dz++) {
             for (let dx = -radius; dx <= radius; dx++) {
                 if (dx*dx + dz*dz <= rSq) {
                     const tx = gridX + dx;
                     const tz = gridZ + dz;
                     if (tx >= 0 && tx < w && tz >= 0 && tz < h) {
                         const ht = terrainRef.current[tz][tx];
                         // Break top N blocks based on depth parameter (and random chance)
                         // For a crater effect, depth is deeper at the center
                         const distToCenter = Math.sqrt(dx*dx + dz*dz);
                         const effectDepth = Math.max(1, Math.round(depth * (1 - distToCenter/radius)));
                         
                         for (let i = 0; i < effectDepth; i++) {
                             const targetY = ht - 1 - i;
                             if (targetY >= 0) {
                                 const key = `${tx}_${tz}_${targetY}`;
                                 if (!next.has(key)) {
                                     // Random chance check
                                     if (Math.random() <= partChanceRef.current) {
                                         next.add(key);
                                         brokenCount++;
                                         
                                         // Get block world coords
                                         const bx = tx - w/2;
                                         const by = targetY;
                                         const bz = tz - h/2;
                                         
                                         // Grab color from mesh if possible
                                         let r=1, g=1, b=1;
                                         const grp = renderModeRef.current === 'glass' ? meshGroupRef.current : mixedGrpRef.current;
                                         if (grp) {
                                             let foundMat: THREE.Material | null = null;
                                             grp.children.forEach(c => {
                                                 const m = c as THREE.InstancedMesh;
                                                 if (m.userData.coordIndexMap && m.userData.coordIndexMap.has(key)) {
                                                     foundMat = m.material as THREE.Material;
                                                 }
                                             });
                                             if (foundMat && (foundMat as any).color) {
                                                 r = (foundMat as any).color.r;
                                                 g = (foundMat as any).color.g;
                                                 b = (foundMat as any).color.b;
                                             }
                                         }
                                         
                                         spawnExplosionParticles(bx, by, bz, r, g, b);
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
         }
         return next;
     });
     
     if (brokenCount > 0) {
        needsRenderRef.current = true;
        // Sheep flock explode logic
        if (flockEngineRef.current && sheepAnimate) {
             flockEngineRef.current.triggerExplosion(
                cx, cz, 
                sheepExplodeRadius, 
                sheepExplodeForce
             );
        }
     }
  }, [sheepAnimate, sheepExplodeRadius, sheepExplodeForce, spawnExplosionParticles]);

  const triggerExplosionRing = useCallback((cx: number, cz: number, radius: number, depth: number) => {
      // similar to explosion but only affects blocks on the ring circumference
      const w = terrainRef.current[0]?.length || 0;
      const h = terrainRef.current.length || 0;
      const gridX = Math.round(cx + w/2);
      const gridZ = Math.round(cz + h/2);
      
      const rIn = (radius - 1) * (radius - 1);
      const rOut = (radius + 1) * (radius + 1);
      
      setBrokenBlocks(prev => {
          const next = new Set(prev);
          for (let dz = -radius-1; dz <= radius+1; dz++) {
             for (let dx = -radius-1; dx <= radius+1; dx++) {
                 const dSq = dx*dx + dz*dz;
                 if (dSq >= rIn && dSq <= rOut) {
                     const tx = gridX + dx;
                     const tz = gridZ + dz;
                     if (tx >= 0 && tx < w && tz >= 0 && tz < h) {
                         const ht = terrainRef.current[tz][tx];
                         for (let i = 0; i < depth; i++) {
                             const targetY = ht - 1 - i;
                             if (targetY >= 0) {
                                 const key = `${tx}_${tz}_${targetY}`;
                                 if (!next.has(key)) {
                                     if (Math.random() <= partChanceRef.current) {
                                         next.add(key);
                                         spawnExplosionParticles(tx - w/2, targetY, tz - h/2, 1, 1, 1);
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
          }
          return next;
      });
  }, [spawnExplosionParticles]);

