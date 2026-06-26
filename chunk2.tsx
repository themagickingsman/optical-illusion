  // ── Sync Sheep Configs dynamically ──
  useEffect(() => {
     if (flockEngineRef.current) {
        flockEngineRef.current.config.speed = sheepSpeed;
        flockEngineRef.current.config.bounceSpeed = sheepBounceSpeed;
        flockEngineRef.current.config.bounciness = sheepBounciness;
        flockEngineRef.current.config.gravity = sheepGravity;
        flockEngineRef.current.config.explodeForce = sheepExplodeForce;
        flockEngineRef.current.config.explodeRadius = sheepExplodeRadius;
        flockEngineRef.current.config.separation = sheepSeparation;
        flockEngineRef.current.config.cohesion = sheepCohesion;
        flockEngineRef.current.config.alignment = sheepAlignment;
     }
  }, [sheepSpeed, sheepBounceSpeed, sheepBounciness, sheepGravity, sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment]);

  // Soft shadows for PCFSoftShadowMap
  const applyShadowSoftness = (light: THREE.DirectionalLight, renderer: THREE.WebGLRenderer, size: number) => {
    light.shadow.mapSize.width = shadowMapSize;
    light.shadow.mapSize.height = shadowMapSize;
    (light.shadow as any).radius = size;
  };

  const sliderToFrustumHalf = (sliderVal: number, maxF: number) => {
    return (sliderVal / 16) * maxF; // slider goes 1..16
  };

  const getFreeParticle = (): Particle | null => {
    const limit = Math.min(partLimitRef.current, TERRAIN_MAX_PARTICLES);
    const pData = particleDataRef.current;
    
    // Quick search starting from last spawn index to avoid O(N) scan from 0 every time
    // But for simplicity in JS, just do a fast linear scan
    for (let i = 0; i < limit; i++) {
        if (!pData[i].alive) return pData[i];
    }
    // If full, override the oldest living particle (approximate by finding one with highest age/maxAge ratio)
    let oldest = 0; let oldestIdx = -1;
    for (let i = 0; i < limit; i++) {
        const ratio = pData[i].age / pData[i].maxAge;
        if (ratio > oldest) { oldest = ratio; oldestIdx = i; }
    }
    if (oldestIdx !== -1) return pData[oldestIdx];
    return null;
  };

  // Rebuild the main Glass terrain (InstancedMeshes)
  const rebuildMeshes = useCallback((
    heights: number[][],
    bevelVal: number,
    glowIntensity: number,
    opacityVal: number,
    baseTint: string,
    layerCols: string[],
    transmit: number,
    thickness: number,
    ior: number,
    rough: number,
    jitterAmt: number,
    broken?: Set<string>
  ) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!meshGroupRef.current) {
      meshGroupRef.current = new THREE.Group();
      scene.add(meshGroupRef.current);
    }
    const grp = meshGroupRef.current;
    while (grp.children.length > 0) {
      const c = grp.children[0] as THREE.InstancedMesh;
      grp.remove(c);
      c.geometry?.dispose();
      (c.material as THREE.Material)?.dispose();
    }
    
    if (layoutTabRef.current === 'custom') {
       grp.visible = false;
       return;
    }
    grp.visible = renderModeRef.current === 'glass';

    const h = heights.length;
    const w = heights[0]?.length || 0;
    if (h === 0 || w === 0) return;

    // Count blocks by layer (0 to maxElev)
    const counts = Array(10).fill(0);
    // Extra count for glowing jitter blocks
    const jitterCounts = Array(10).fill(0);

    const isLargeMap = layoutTabRef.current === 'large_map';
    const brokenSet = broken || brokenBlocksRef.current;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ht = heights[y][x];
        for (let i = 0; i < ht; i++) {
          const key = `${x}_${y}_${i}`;
          if (brokenSet.has(key)) continue;

          // Exclude blocks hidden beneath higher blocks, EXCEPT edge blocks and bottom block.
          // In large_map mode, we render everything so holes expose lower layers.
          let visible = true;
          if (!isLargeMap) {
            const isEdge = x === 0 || x === w - 1 || y === 0 || y === h - 1;
            const isTopOrBottom = i === ht - 1 || i === 0;
            if (!isEdge && !isTopOrBottom) {
              const hN = heights[y - 1]?.[x] ?? 0;
              const hS = heights[y + 1]?.[x] ?? 0;
              const hE = heights[y]?.[x + 1] ?? 0;
              const hW = heights[y]?.[x - 1] ?? 0;
              if (i < hN && i < hS && i < hE && i < hW) {
                visible = false;
              }
            }
          }
          if (visible) {
             // 5% chance of being a glowing jitter block if jitter is enabled
             if (jitterAmt > 0 && Math.random() < 0.05) {
                jitterCounts[i]++;
             } else {
                counts[i]++;
             }
          }
        }
      }
    }

    const geo = new RoundedBoxGeometry(1, 1, 1, 2, bevelVal);
    const tintCol = new THREE.Color(baseTint);

    // Create Base (Glass) meshes
    const meshes: THREE.InstancedMesh[] = [];
    counts.forEach((count, i) => {
      if (count === 0) return;
      const ci = Math.min(i, 4); // max 5 layers color
      const levelCol = new THREE.Color(layerCols[ci] ?? DEFAULT_LAYER_COLORS[ci]);
      const blended  = levelCol.clone().lerp(tintCol, 0.1);

      const mat = new THREE.MeshPhysicalMaterial({
        color: blended,
        transmission: transmit,
        thickness: thickness,
        ior: ior,
        roughness: rough,
        metalness: 0.1,
        transparent: transmit < 0.05,
        opacity: Math.max(0.05, opacityVal - (i / 8) * 0.05),
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color(0x000000), // No emissive on base glass
      });
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { colorIndex: ci, heightRatio: i / 8, isJitterGlow: false, coordMap: [] };
      meshes.push(mesh);
      grp.add(mesh);
    });

    // Create Jitter Glow meshes
    const glowMeshes: THREE.InstancedMesh[] = [];
    jitterCounts.forEach((count, i) => {
      if (count === 0) return;
      const ci = Math.min(i, 4);
      const levelCol = new THREE.Color(layerCols[ci] ?? DEFAULT_LAYER_COLORS[ci]);

      // Glow meshes use StandardMaterial with high emissive, no transmission
      const mat = new THREE.MeshStandardMaterial({
        color: levelCol,
        emissive: levelCol,
        emissiveIntensity: glowIntensity * 5.0, // multiplier for bloom punch
        transparent: true,
        opacity: 0.72,
        roughness: 0.4,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData = { colorIndex: ci, isJitterGlow: true, coordMap: [] };
      glowMeshes.push(mesh);
      grp.add(mesh);
    });

    const dummy = new THREE.Object3D();
    const idxTracker = Array(10).fill(0);
    const glowIdxTracker = Array(10).fill(0);
    const offsetX = -w / 2;
    const offsetZ = -h / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ht = heights[y][x];
        for (let i = 0; i < ht; i++) {
          const key = `${x}_${y}_${i}`;
          if (brokenSet.has(key)) continue;

          let visible = true;
          if (!isLargeMap) {
            const isEdge = x === 0 || x === w - 1 || y === 0 || y === h - 1;
            const isTopOrBottom = i === ht - 1 || i === 0;
            if (!isEdge && !isTopOrBottom) {
              const hN = heights[y - 1]?.[x] ?? 0;
              const hS = heights[y + 1]?.[x] ?? 0;
              const hE = heights[y]?.[x + 1] ?? 0;
              const hW = heights[y]?.[x - 1] ?? 0;
              if (i < hN && i < hS && i < hE && i < hW) {
                visible = false;
              }
            }
          }
          if (visible) {
             const isGlow = jitterAmt > 0 && Math.random() < 0.05;
             
             // Jitter displacement calculation
             let jx = 0, jy = 0, jz = 0, sx = 1, sy = 1, sz = 1;
             if (jitterAmt > 0) {
                 const scaleJit = jitterAmt * 0.4;
                 sx = 1.0 - (Math.random() * scaleJit);
                 sy = 1.0 - (Math.random() * scaleJit);
                 sz = 1.0 - (Math.random() * scaleJit);
                 
                 const posJit = jitterAmt * 0.15;
                 jx = (Math.random() - 0.5) * posJit;
                 jy = (Math.random() - 0.5) * posJit;
                 jz = (Math.random() - 0.5) * posJit;
             }
             
             dummy.position.set(x + offsetX + jx, i + jy, y + offsetZ + jz);
             dummy.scale.set(sx, sy, sz);
             dummy.updateMatrix();

             if (isGlow) {
                 const m = glowMeshes.find(m => m.userData.colorIndex === Math.min(i, 4));
                 if (m) {
                    const idx = glowIdxTracker[i]++;
                    m.setMatrixAt(idx, dummy.matrix);
                    m.userData.coordMap[idx] = key;
                 }
             } else {
                 const m = meshes.find(m => m.userData.colorIndex === Math.min(i, 4));
                 if (m) {
                    const idx = idxTracker[i]++;
                    m.setMatrixAt(idx, dummy.matrix);
                    m.userData.coordMap[idx] = key;
                 }
             }
          }
        }
      }
    }

    [...meshes, ...glowMeshes].forEach(m => {
      m.instanceMatrix.needsUpdate = true;
      // Also build a reverse index map for regeneration scaling
      m.userData.coordIndexMap = new Map<string, number>();
      for (let j = 0; j < m.userData.coordMap.length; j++) {
         m.userData.coordIndexMap.set(m.userData.coordMap[j], j);
      }
    });
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
  }, []);

  // ── Rebuild MIXED GEO terrain (fast InstancedMesh of blocks/cylinders/etc) ──
  const rebuildMixedMeshes = useCallback((
    heights: number[][],
    layerCols: string[],
    baseTint: string,
    enabledShapes: Set<string>,
    broken?: Set<string>
  ) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!mixedGrpRef.current) {
      mixedGrpRef.current = new THREE.Group();
      scene.add(mixedGrpRef.current);
    }
    const grp = mixedGrpRef.current;
    while (grp.children.length > 0) {
      const c = grp.children[0] as THREE.InstancedMesh;
      grp.remove(c);
      c.geometry?.dispose();
      (c.material as THREE.Material)?.dispose();
    }
    
    if (layoutTabRef.current === 'custom') {
      grp.visible = false;
      return;
    }
    grp.visible = renderModeRef.current === 'mixed';

    const h = heights.length;
    const w = heights[0]?.length || 0;
    if (h === 0 || w === 0) return;

    const isLargeMap = layoutTabRef.current === 'large_map';
    const brokenSet = broken || brokenBlocksRef.current;

    // Filter available shapes
    const activeShapes = SHAPE_LIBRARY.filter(s => enabledShapes.has(s.id));
    if (activeShapes.length === 0) activeShapes.push(SHAPE_LIBRARY[0]); // fallback

    // 1 pass to determine shape + color for every block
    // We group by "ShapeID_ColorIndex"
    const instancesData = new Map<string, {
      shapeIdx: number, colorIdx: number,
      transforms: THREE.Matrix4[], keys: string[]
    }>();

    const dummy = new THREE.Object3D();
    const offsetX = -w / 2;
    const offsetZ = -h / 2;

    // Seeded random for consistent shapes at grid coords
    const pseudoRandom = (seed: number, x: number, y: number, z: number) => {
      const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
      return v - Math.floor(v);
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ht = heights[y][x];
        for (let i = 0; i < ht; i++) {
          const key = `${x}_${y}_${i}`;
          if (brokenSet.has(key)) continue;

          // visibility culling
          let visible = true;
          if (!isLargeMap) {
            const isEdge = x === 0 || x === w - 1 || y === 0 || y === h - 1;
            const isTopOrBottom = i === ht - 1 || i === 0;
            if (!isEdge && !isTopOrBottom) {
              const hN = heights[y - 1]?.[x] ?? 0;
              const hS = heights[y + 1]?.[x] ?? 0;
              const hE = heights[y]?.[x + 1] ?? 0;
              const hW = heights[y]?.[x - 1] ?? 0;
              if (i < hN && i < hS && i < hE && i < hW) {
                visible = false;
              }
            }
          }
          if (!visible) continue;

          // pick shape randomly based on position
          const rnd = pseudoRandom(1337, x, y, i);
          const sObj = activeShapes[Math.floor(rnd * activeShapes.length)];
          const colorIdx = Math.min(i, 4);

          const groupKey = `${sObj.id}_${colorIdx}`;
          if (!instancesData.has(groupKey)) {
            instancesData.set(groupKey, { shapeIdx: SHAPE_LIBRARY.findIndex(s=>s.id===sObj.id), colorIdx, transforms: [], keys: [] });
          }

          // Compute transform
          dummy.position.set(x + offsetX, i, y + offsetZ);
          
          // apply the shape's specific scale offset
          dummy.scale.set(sObj.scale[0], sObj.scale[1], sObj.scale[2]);
          
          // Some random rotation if requested by the shape
          dummy.rotation.set(0, 0, 0);
          if (sObj.randomRot) {
             const rt = Math.floor(pseudoRandom(999, x, y, i) * 4) * (Math.PI/2);
             dummy.rotation.y = rt;
          }
          
          dummy.updateMatrix();

          const g = instancesData.get(groupKey)!;
          g.transforms.push(dummy.matrix.clone());
          g.keys.push(key);
        }
      }
    }

    const tintCol = new THREE.Color(baseTint);

    // Build the InstancedMeshes
    for (const [_, data] of instancesData) {
      const { shapeIdx, colorIdx, transforms, keys } = data;
      const count = transforms.length;
      if (count === 0) continue;

      const sObj = SHAPE_LIBRARY[shapeIdx];
      const levelCol = new THREE.Color(layerCols[colorIdx] ?? DEFAULT_LAYER_COLORS[colorIdx]);
      const blended  = levelCol.clone().lerp(tintCol, 0.1);

      // Fast, solid material
      const mat = new THREE.MeshStandardMaterial({
        color: blended,
        roughness: 0.8,
        metalness: 0.1,
      });

      const iMesh = new THREE.InstancedMesh(sObj.geo, mat, count);
      iMesh.castShadow = true;
      iMesh.receiveShadow = true;
      iMesh.userData = { colorIndex: colorIdx, shapeId: sObj.id, coordMap: keys, coordIndexMap: new Map<string, number>() };

      for (let i = 0; i < count; i++) {
        iMesh.setMatrixAt(i, transforms[i]);
        iMesh.userData.coordIndexMap.set(keys[i], i);
      }
      iMesh.instanceMatrix.needsUpdate = true;
      grp.add(iMesh);
    }
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
  }, []);

  // Place decorative beacons based on a seed
  const rebuildBeacons = useCallback((heights: number[][], count: number, bColor: string, emStr: number, lFall: number, bSeed: number, bBury: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!beaconGrpRef.current) {
      beaconGrpRef.current = new THREE.Group();
      scene.add(beaconGrpRef.current);
    }
    const bGrp = beaconGrpRef.current;
    // hide beacons when in custom tab
    bGrp.visible = layoutTabRef.current !== 'custom';
    
    while (bGrp.children.length > 0) {
      const c = bGrp.children[0] as THREE.Mesh | THREE.PointLight;
      bGrp.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry?.dispose();
        (c.material as THREE.Material)?.dispose();
      } else {
        c.dispose();
      }
    }

    const h = heights.length;
    const w = heights[0]?.length || 0;
    if (h === 0 || w === 0 || count <= 0) {
      needsRenderRef.current = true;
      return;
    }

    const prng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const isLargeMap = layoutTabRef.current === 'large_map';
    const margin = 2; // Keep away from extreme edges
    const usableW = w - margin * 2;
    const usableH = h - margin * 2;
    if (usableW <= 0 || usableH <= 0) return;

    for (let i = 0; i < count; i++) {
      const rx = Math.floor(prng(bSeed + i * 7) * usableW) + margin;
      const rz = Math.floor(prng(bSeed + i * 13) * usableH) + margin;
      
      const tH = heights[rz][rx];
      if (tH === undefined || tH <= 0) continue; // invalid spot
      
      const yElev = tH - bBury; 
      
      // We will place the beacon here
      const px = rx - w / 2;
      const pz = rz - h / 2;
      
      const c = new THREE.Color(bColor);
      
      // Create glowing core
      const geo = new THREE.OctahedronGeometry(0.8, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: c.clone().multiplyScalar(0.2),
        emissive: c,
        emissiveIntensity: emStr,
        roughness: 0.1,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      // Floating a bit above the bury depth
      mesh.position.set(px, yElev + 1.2, pz);
      
      // Floating animation randomized offset
      mesh.userData = { animOffset: prng(bSeed + i * 3) * 100, baseY: yElev + 1.2 };
      
      bGrp.add(mesh);
      
      // Add local light
      const light = new THREE.PointLight(c, emStr * 0.8, lFall * 10, 2);
      light.position.set(px, yElev + 2.0, pz);
      bGrp.add(light);
    }
    
    needsRenderRef.current = true;
    shadowsDirtyRef.current = true;
  }, []);

