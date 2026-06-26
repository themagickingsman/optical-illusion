  // ── Raycaster (Hover / Explode) ──
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
      if (layoutTabRef.current === 'custom') return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, cameraRef.current);
      
      const grp = renderModeRef.current === 'glass' ? meshGroupRef.current : mixedGrpRef.current;
      if (!grp || !grp.visible) return;

      const intersects = raycaster.intersectObjects(grp.children, false);
      let hitKey: string | null = null;
      let hitMesh: THREE.InstancedMesh | null = null;
      let hitInstanceId: number | null = null;

      if (intersects.length > 0) {
        const hit = intersects[0];
        hitMesh = hit.object as THREE.InstancedMesh;
        hitInstanceId = hit.instanceId ?? null;
        if (hitInstanceId !== null && hitMesh.userData.coordMap) {
           hitKey = hitMesh.userData.coordMap[hitInstanceId];
        }
      }

      // Record mouse 3D world pos for SpotLight
      if (intersects.length > 0) {
          mouseWorld3DRef.current.copy(intersects[0].point);
      } else {
          // fallback project to y=0 plane
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          raycaster.ray.intersectPlane(plane, mouseWorld3DRef.current);
      }
      
      // Update Hover Highlight
      if (hitKey && hitMesh && hitInstanceId !== null) {
          hoverCurrentlyHitRef.current = hitKey;
          
          // Is it already in pool?
          let poolItem = hoverPoolRef.current.find(h => h.blockKey === hitKey && h.active);
          
          if (!poolItem) {
              // Get inactive item
              poolItem = hoverPoolRef.current.find(h => !h.active);
              if (poolItem) {
                  poolItem.active = true;
                  poolItem.blockKey = hitKey;
                  poolItem.currentAlpha = 0;
                  
                  const mat = new THREE.Matrix4();
                  hitMesh.getMatrixAt(hitInstanceId, mat);
                  
                  const pos = new THREE.Vector3();
                  const quat = new THREE.Quaternion();
                  const scale = new THREE.Vector3();
                  mat.decompose(pos, quat, scale);
                  
                  poolItem.mesh.position.copy(pos);
                  poolItem.mesh.rotation.setFromQuaternion(quat);
                  poolItem.mesh.scale.copy(scale);
                  poolItem.mesh.visible = true;
                  
                  // Clone color from instance
                  const baseCol = (hitMesh.material as any).color as THREE.Color;
                  if (baseCol) {
                     (poolItem.mesh.material as THREE.MeshBasicMaterial).color.copy(baseCol);
                  } else {
                     (poolItem.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
                  }
              }
          }
      } else {
          hoverCurrentlyHitRef.current = null;
      }
    };
    
    // Throttle pointer move to save CPU
    const throttledPointerMove = debounce(handlePointerMove, 16, { maxWait: 16 });

    const handleClick = (e: MouseEvent) => {
      if (layoutTabRef.current === 'custom') return;
      // if Raid mode active, fire weapon on click
      if (isRaidModeRef.current && selectedWeaponRef.current) {
          fireWeapon(mouseWorld3DRef.current.x, mouseWorld3DRef.current.z, selectedWeaponRef.current);
          return;
      }

      // Default behavior: break single block if clicked
      const curKey = hoverCurrentlyHitRef.current;
      if (curKey && !brokenBlocksRef.current.has(curKey)) {
         setBrokenBlocks(prev => {
             const next = new Set(prev);
             next.add(curKey);
             return next;
         });
         
         // extract coords from key to spawn particles
         const [sx, sy, sz] = curKey.split('_').map(Number);
         const w = terrainRef.current[0]?.length || 0;
         const h = terrainRef.current.length || 0;
         
         const wx = sx - w/2;
         const wz = sy - h/2; // wait, sy is Z in array? key is x_y_h. so sy is Z, sz is H
         const wy = sz;
         
         // spawn particles at block center
         spawnExplosionParticles(wx, wy, wz, 1, 1, 1);
         
         needsRenderRef.current = true;
      }
    };

    window.addEventListener('pointermove', throttledPointerMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('pointermove', throttledPointerMove);
      window.removeEventListener('click', handleClick);
      throttledPointerMove.cancel();
    };
  }, [fireWeapon, spawnExplosionParticles]);

  // Setup Hover Pool meshes
  useEffect(() => {
     const scene = sceneRef.current;
     if (!scene) return;
     
     // Clean up old pool
     hoverPoolRef.current.forEach(h => {
         if (h.mesh && h.mesh.parent) h.mesh.parent.remove(h.mesh);
         h.mesh.geometry.dispose();
         (h.mesh.material as THREE.Material).dispose();
     });
     
     const geo = new RoundedBoxGeometry(1.02, 1.02, 1.02, 2, 0.1);
     const pool: HoverItem[] = [];
     for (let i = 0; i < HOVER_POOL_SIZE; i++) {
         const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
         });
         const mesh = new THREE.Mesh(geo, mat);
         mesh.visible = false;
         scene.add(mesh);
         pool.push({ active: false, blockKey: "", mesh, targetAlpha: 0, currentAlpha: 0 });
      }
      hoverPoolRef.current = pool;
  }, []);

  // Custom Hex World interaction
  useEffect(() => {
     const handlePointerDown = (e: PointerEvent) => {
         if (layoutTabRef.current !== 'custom') return;
         if (!cameraRef.current || !sceneRef.current || !rendererRef.current) return;
         const rect = rendererRef.current.domElement.getBoundingClientRect();
         const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
         const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
         raycaster.setFromCamera({ x, y }, cameraRef.current);
         
         if (hexWorldGrpRef.current) {
             const intersects = raycaster.intersectObjects(hexWorldGrpRef.current.children, false);
             if (intersects.length > 0) {
                 const hit = intersects[0].object as THREE.Mesh;
                 const ud = hit.userData;
                 
                 // If clicking a beam and holding energon
                 if (ud.type === undefined && ud.beamIndex !== undefined && selectedEnergonRef.current !== null) {
                     // Charge beam!
                     beamScaleRef.current[ud.beamIndex] += 1;
                     (hit.scale as THREE.Vector3).setY(beamScaleRef.current[ud.beamIndex]);
                     needsRenderRef.current = true;
                     return;
                 }
                 
                 if (ud.type === 'hex_slot') {
                    if (selectedEnergonRef.current !== null) {
                        // Place energon
                        setSlotsFilled(prev => {
                            const next = prev.map(r => [...r]);
                            next[ud.row][ud.col] = true;
                            return next;
                        });
                        setSelectedEnergon(null); // consume
                    } else if (slotsFilledRef.current[ud.row][ud.col]) {
                        // Pick up energon
                        setSlotsFilled(prev => {
                            const next = prev.map(r => [...r]);
                            next[ud.row][ud.col] = false;
                            return next;
                        });
                        setSelectedEnergon(1); // placeholder value for "holding something"
                    }
                 }
                 
                 if (ud.type === 'energon') {
                    // Pick up
                    setSlotsFilled(prev => {
                        const next = prev.map(r => [...r]);
                        next[ud.row][ud.col] = false;
                        return next;
                    });
                    setSelectedEnergon(1);
                 }
             }
         }
     };
     window.addEventListener('pointerdown', handlePointerDown);
     return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [raycaster]);

  // Keep ref sync
  useEffect(() => { slotsFilledRef.current = slotsFilled; }, [slotsFilled]);
  useEffect(() => { selectedEnergonRef.current = selectedEnergon; }, [selectedEnergon]);

  // Generate Base Terrain Matrix
  const generate = useCallback(() => {
    setStatus('Generating Perlin Map...');
    setTimeout(() => {
      const heights = buildNoise(gridW, gridH, octaves, seed, maxElev, roughness);
      setTerrain(heights);
      terrainRef.current = heights;
      
      pickPresetBlocks(heights, seed);
      
      // Clear broken blocks on new gen
      setBrokenBlocks(new Set());
      regeneratingBlocksRef.current.clear();
      
      // Clear Particles
      if (particlesRef.current) {
         const pData = particleDataRef.current;
         for (let i = 0; i < pData.length; i++) pData[i].alive = false;
         const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
         for (let i = 0; i < pos.length; i++) pos[i] = -9999;
         particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
      
      // Clear Projectiles
      weaponProjectilesRef.current.forEach(p => {
         if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
      });
      weaponProjectilesRef.current = [];

      setStatus('Building Meshes...');
      requestAnimationFrame(() => {
        if (renderModeRef.current === 'glass') {
            rebuildMeshes(heights, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, new Set());
        } else {
            rebuildMixedMeshes(heights, layerColors, terrainTint, enabledShapes, new Set());
        }
        rebuildBeacons(heights, beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury);
        
        // Setup Sheep
        if (flockEngineRef.current) {
            flockEngineRef.current.init(sheepCount, sheepSize, sheepSeed, heights, layoutTabRef.current === 'large_map');
        }
        
        setStatus('Idle');
      });
    }, 50);
  }, [
    gridW, gridH, octaves, seed, maxElev, roughness, 
    bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter,
    beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury,
    renderMode, enabledShapes,
    rebuildMeshes, rebuildMixedMeshes, rebuildBeacons,
    sheepCount, sheepSize, sheepSeed
  ]);

  // Handle broken blocks update
  useEffect(() => {
    if (terrainRef.current.length > 0) {
      if (renderModeRef.current === 'glass') {
         rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, brokenBlocks);
      } else {
         rebuildMixedMeshes(terrainRef.current, layerColors, terrainTint, enabledShapes, brokenBlocks);
      }
    }
  }, [brokenBlocks, rebuildMeshes, rebuildMixedMeshes, bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, enabledShapes]);

  // Initial load
  useEffect(() => { generate(); }, [generate]);

