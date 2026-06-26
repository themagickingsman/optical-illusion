      // 1) Animate floating beacons
      if (beaconGrpRef.current && beaconGrpRef.current.visible) {
         beaconGrpRef.current.children.forEach(c => {
             if (c instanceof THREE.Mesh) {
                const ud = c.userData;
                if (ud && ud.baseY !== undefined) {
                   c.position.y = ud.baseY + Math.sin(now * 0.002 + ud.animOffset) * 0.4;
                   c.rotation.y += 0.01;
                   c.rotation.z = Math.sin(now * 0.001 + ud.animOffset) * 0.1;
                   _needsRender = true;
                }
             }
         });
      }

      // 2) Animate Hover Items (Raycaster hit highlight and fade)
      const curHoverKey = hoverCurrentlyHitRef.current;
      for (let i = 0; i < hoverPoolRef.current.length; i++) {
         const item = hoverPoolRef.current[i];
         if (!item.active) continue;
         
         // Set target alpha
         if (item.blockKey === curHoverKey) {
             item.targetAlpha = 0.6; // High opacity while hovered
         } else {
             item.targetAlpha = 0;   // Fade out when not hovered
         }
         
         // Animate alpha
         const fadeRate = hoverFadeRef.current; // Use the slider value
         if (item.currentAlpha < item.targetAlpha) {
             item.currentAlpha = Math.min(item.targetAlpha, item.currentAlpha + fadeRate);
             _needsRender = true;
         } else if (item.currentAlpha > item.targetAlpha) {
             item.currentAlpha = Math.max(item.targetAlpha, item.currentAlpha - fadeRate);
             _needsRender = true;
         }
         
         if (item.currentAlpha <= 0 && item.targetAlpha === 0) {
             item.active = false;
             item.mesh.visible = false;
             item.blockKey = "";
         } else {
             const mat = item.mesh.material as THREE.MeshBasicMaterial;
             mat.opacity = item.currentAlpha;
             // slight pulse on top of the alpha
             const pulse = 1.0 + Math.sin(now * 0.01) * 0.1;
             item.mesh.scale.setScalar(1.05 * pulse);
         }
      }

      // 3) Animate sheep
      if (flockEngineRef.current && sheepAnimate) {
         if (flockEngineRef.current.update(dt / 1000, terrainRef.current, layoutTabRef.current === 'large_map')) {
             _needsRender = true;
         }
      }

      // 4) Weapon Projectiles
      const wProj = weaponProjectilesRef.current;
      if (wProj.length > 0) {
         _needsRender = true;
         for (let i = wProj.length - 1; i >= 0; i--) {
            const p = wProj[i];
            
            // Handle delays
            if (p.delayMs && p.startTime) {
                if (now < p.startTime + p.delayMs) continue; // still waiting
            }
            if (p.durationMs && p.startTime) {
                if (now > p.startTime + (p.delayMs||0) + p.durationMs) {
                   // Time based weapon finished (e.g. Laser / Blackhole)
                   if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
                   wProj.splice(i, 1);
                   continue;
                }
            }

            // Move Projectile
            p.progress += (dt / 1000) * p.speed;
            
            if (p.type === 'laser') {
                // Laser just stays at target and grows/pulses
                p.mesh.position.set(p.targetX, p.targetY + 5, p.targetZ);
                const pulse = 1.0 + Math.sin(now * 0.05) * 0.2;
                p.mesh.scale.set(pulse, 10, pulse);
                // Trigger damage continuously around target
                triggerExplosion(p.targetX, p.targetZ, p.radius, p.depth);
            } 
            else if (p.type === 'seismic') {
                // Seismic wave travels outward
                p.mesh.position.set(p.targetX, p.targetY + 0.5, p.targetZ);
                const currentRadius = p.progress * p.radius; // expands over time
                p.mesh.scale.set(currentRadius, 1, currentRadius);
                // Trigger damage in a ring
                triggerExplosionRing(p.targetX, p.targetZ, currentRadius, p.depth);
                
                if (p.progress >= 1.0) {
                    if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
                    wProj.splice(i, 1);
                }
            }
            else if (p.type === 'blackhole') {
                 p.mesh.position.set(p.targetX, p.targetY + 2, p.targetZ);
                 p.mesh.rotation.y += 0.1;
                 p.mesh.rotation.z += 0.05;
                 const scale = Math.min(1.0, p.progress * 2) * p.radius; // grow in
                 p.mesh.scale.setScalar(scale);
                 // Suck blocks in continuously
                 triggerExplosion(p.targetX, p.targetZ, p.radius * (p.progress/2), p.depth);
            }
            else {
                // Standard ballistic path (Scatter, Artillery, Flyover, Carpet)
                if (p.progress >= 1.0) {
                   // Hit Target!
                   triggerExplosion(p.targetX, p.targetZ, p.radius, p.depth);
                   // Remove projectile
                   if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
                   wProj.splice(i, 1);
                } else {
                   if (p.curvePt1 && p.curvePt2) {
                       // Cubic Bezier
                       const t = p.progress;
                       const v0 = new THREE.Vector3(p.startX, p.startY, p.startZ);
                       const v3 = new THREE.Vector3(p.targetX, p.targetY, p.targetZ);
                       
                       const pos = new THREE.Vector3();
                       pos.x = Math.pow(1-t, 3)*v0.x + 3*Math.pow(1-t, 2)*t*p.curvePt1.x + 3*(1-t)*t*t*p.curvePt2.x + Math.pow(t, 3)*v3.x;
                       pos.y = Math.pow(1-t, 3)*v0.y + 3*Math.pow(1-t, 2)*t*p.curvePt1.y + 3*(1-t)*t*t*p.curvePt2.y + Math.pow(t, 3)*v3.y;
                       pos.z = Math.pow(1-t, 3)*v0.z + 3*Math.pow(1-t, 2)*t*p.curvePt1.z + 3*(1-t)*t*t*p.curvePt2.z + Math.pow(t, 3)*v3.z;
                       
                       p.mesh.position.copy(pos);
                       
                       // Look at next point
                       const t2 = Math.min(1.0, t + 0.05);
                       const nextPos = new THREE.Vector3();
                       nextPos.x = Math.pow(1-t2, 3)*v0.x + 3*Math.pow(1-t2, 2)*t2*p.curvePt1.x + 3*(1-t2)*t2*t2*p.curvePt2.x + Math.pow(t2, 3)*v3.x;
                       nextPos.y = Math.pow(1-t2, 3)*v0.y + 3*Math.pow(1-t2, 2)*t2*p.curvePt1.y + 3*(1-t2)*t2*t2*p.curvePt2.y + Math.pow(t2, 3)*v3.y;
                       nextPos.z = Math.pow(1-t2, 3)*v0.z + 3*Math.pow(1-t2, 2)*t2*p.curvePt1.z + 3*(1-t2)*t2*t2*p.curvePt2.z + Math.pow(t2, 3)*v3.z;
                       p.mesh.lookAt(nextPos);
                   } else {
                       // Linear
                       p.mesh.position.x = THREE.MathUtils.lerp(p.startX, p.targetX, p.progress);
                       p.mesh.position.y = THREE.MathUtils.lerp(p.startY, p.targetY, p.progress);
                       p.mesh.position.z = THREE.MathUtils.lerp(p.startZ, p.targetZ, p.progress);
                   }
                }
            }
         }
      }

      // 5) Update Particles
      if (particlesRef.current) {
        const pLimit = Math.min(partLimitRef.current, TERRAIN_MAX_PARTICLES);
        const pData = particleDataRef.current;
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
        
        let moved = false;
        
        // Fast decay logic: only update every Nth frame, or all frames but highly optimized
        const decay = partDecayRef.current;
        const speedMult = partSpeedRef.current;
        const falloff = partFalloffRef.current;

        for (let i = 0; i < pLimit; i++) {
          if (!pData[i].alive) continue;
          moved = true;
          
          pData[i].age++;
          if (pData[i].age > pData[i].maxAge) {
             pData[i].alive = false;
             // hide it
             positions[i * 3 + 1] = -9999;
             continue;
          }

          // Physics integration
          pData[i].px += pData[i].vx * speedMult;
          pData[i].py += pData[i].vy * speedMult;
          pData[i].pz += pData[i].vz * speedMult;
          
          // Apply velocity decay (air resistance)
          pData[i].vx *= decay;
          pData[i].vy *= decay;
          pData[i].vz *= decay;
          
          // Apply gravity falloff (simulate chunks falling)
          pData[i].vy -= falloff;

          const idx3 = i * 3;
          positions[idx3] = pData[i].px;
          positions[idx3 + 1] = pData[i].py;
          positions[idx3 + 2] = pData[i].pz;
          
          // Fade alpha via color magnitude or just fade to black
          const lifeRatio = 1.0 - (pData[i].age / pData[i].maxAge);
          colors[idx3] = pData[i].r * lifeRatio;
          colors[idx3 + 1] = pData[i].g * lifeRatio;
          colors[idx3 + 2] = pData[i].b * lifeRatio;
        }

        if (moved) {
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          particlesRef.current.geometry.attributes.color.needsUpdate = true;
          _needsRender = true;
        }
      }
      
      // 6) Regenerate broken blocks smoothly
      if (regenSpeedRef.current > 0 && regeneratingBlocksRef.current.size > 0) {
         let changed = false;
         const grp = renderModeRef.current === 'glass' ? meshGroupRef.current : mixedGrpRef.current;
         if (grp) {
            const tempMat = new THREE.Matrix4();
            const tempPos = new THREE.Vector3();
            const tempQuat = new THREE.Quaternion();
            const tempScale = new THREE.Vector3();

            for (const [key, state] of regeneratingBlocksRef.current.entries()) {
               state.scale += regenFadeSpeedRef.current;
               let done = false;
               if (state.scale >= 1.0) {
                  state.scale = 1.0;
                  done = true;
               }

               // Find mesh and update scale
               grp.children.forEach(c => {
                  const m = c as THREE.InstancedMesh;
                  if (m.userData.coordIndexMap && m.userData.coordIndexMap.has(key)) {
                      const idx = m.userData.coordIndexMap.get(key)!;
                      m.getMatrixAt(idx, tempMat);
                      tempMat.decompose(tempPos, tempQuat, tempScale);
                      
                      // Base scale needs to be what it was originally... 
                      // For mixed shapes, we'd need to look up the original shape scale. 
                      // For glass, it's ~1.0 with jitter. 
                      // Simplification: just use state.scale directly on all axes
                      tempScale.setScalar(state.scale); 
                      
                      tempMat.compose(tempPos, tempQuat, tempScale);
                      m.setMatrixAt(idx, tempMat);
                      m.instanceMatrix.needsUpdate = true;
                      changed = true;
                  }
               });

               if (done) {
                  regeneratingBlocksRef.current.delete(key);
                  // Remove from broken blocks so it stays fully solid
                  setBrokenBlocks(prev => {
                     const next = new Set(prev);
                     next.delete(key);
                     return next;
                  });
               }
            }
         }
         if (changed) _needsRender = true;
      }

      // Hack for shadow map update limit
      if (shadowsDirtyRef.current) {
         renderer.shadowMap.needsUpdate = true;
         shadowsDirtyRef.current = false;
      }

      if (_needsRender) {
        composer.render();
        needsRenderRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (rendererRef.current) {
         mountRef.current?.removeChild(rendererRef.current.domElement);
         rendererRef.current.dispose();
      }
    };
  }, []);

