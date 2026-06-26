  // ── Particle System Init ──
  useEffect(() => {
     const scene = sceneRef.current;
     if (!scene) return;
     
     if (particlesRef.current) {
        scene.remove(particlesRef.current);
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
        particlesRef.current = null;
     }

     const maxP = Math.min(partLimitRef.current, TERRAIN_MAX_PARTICLES);
     const geo = new THREE.BufferGeometry();
     const positions = new Float32Array(maxP * 3);
     const colors = new Float32Array(maxP * 3);
     
     const pData: Particle[] = [];
     for (let i = 0; i < maxP; i++) {
         positions[i*3+1] = -9999; // hide initially
         colors[i*3] = 1; colors[i*3+1] = 1; colors[i*3+2] = 1;
         pData.push({
             alive: false, px:0, py:-9999, pz:0, vx:0, vy:0, vz:0, age:0, maxAge:100, r:1, g:1, b:1
         });
     }
     particleDataRef.current = pData;
     
     geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
     geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
     
     // Need a custom shader material if we want rounded particles, but PointsMaterial is faster
     const mat = new THREE.PointsMaterial({
         size: partSize,
         vertexColors: true,
         transparent: true,
         opacity: 0.9,
         blending: THREE.AdditiveBlending,
         depthWrite: false,
         sizeAttenuation: true
     });
     
     const pts = new THREE.Points(geo, mat);
     pts.frustumCulled = false; // Always render if we have active particles
     scene.add(pts);
     particlesRef.current = pts;
     
  }, [partLimit, partSize]);

  // ── UPDATE CAM & POST ──
  useEffect(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current;
      cam.position.set(
        Math.cos(THREE.MathUtils.degToRad(camAzimuth)) * 100,
        camElev,
        Math.sin(THREE.MathUtils.degToRad(camAzimuth)) * 100
      );
      cam.lookAt(0, 0, 0);
      const w = mountRef.current?.clientWidth || 800;
      const h = mountRef.current?.clientHeight || 600;
      const aspect = w / h;
      cam.left = camZoom * aspect / -2;
      cam.right = camZoom * aspect / 2;
      cam.top = camZoom / 2;
      cam.bottom = camZoom / -2;
      cam.updateProjectionMatrix();
      needsRenderRef.current = true;
    }
  }, [camElev, camAzimuth, camZoom]);

  useEffect(() => {
    if (tiltPassRef.current) {
      tiltPassRef.current.uniforms.blur.value = tiltBlur;
      tiltPassRef.current.uniforms.spread.value = tiltSpread;
      tiltPassRef.current.uniforms.vignette.value = tiltVignette;
      tiltPassRef.current.uniforms.vigColor.value = vigColorRef.current.set(vigColor);
      needsRenderRef.current = true;
    }
  }, [tiltBlur, tiltSpread, tiltVignette, vigColor]);

  useEffect(() => {
    if (bloomPassRef.current) {
      bloomPassRef.current.strength = bloomStr;
      bloomPassRef.current.threshold = bloomThresh;
      needsRenderRef.current = true;
    }
  }, [bloomStr, bloomThresh]);

  useEffect(() => {
    if (keyLightRef.current) {
      keyLightRef.current.intensity = keyLightInt;
      keyLightRef.current.color.set(keyLightColor);
      keyLightRef.current.position.set(
        Math.cos(THREE.MathUtils.degToRad(lightAzimuth)) * 100,
        lightElev,
        Math.sin(THREE.MathUtils.degToRad(lightAzimuth)) * 100
      );
    }
    if (ambLightRef.current) ambLightRef.current.intensity = ambientInt;
    if (hemLightRef.current) {
       hemLightRef.current.intensity = hemIntensity;
       hemLightRef.current.groundColor.set(shadowColor);
    }
    
    if (spotLightRef.current) {
       spotLightRef.current.intensity = spotEnabled ? spotInt : 0;
       spotLightRef.current.color.set(spotColor);
       spotLightRef.current.angle = THREE.MathUtils.degToRad(spotAngle);
       spotLightRef.current.penumbra = spotPenumbra;
    }

    if (rendererRef.current && keyLightRef.current) {
      applyShadowSoftness(keyLightRef.current, rendererRef.current, shadowRadius);
      keyLightRef.current.shadow.bias = shadowBias;
      keyLightRef.current.shadow.normalBias = shadowNormalBias;
      keyLightRef.current.shadow.mapSize.width = shadowMapSize;
      keyLightRef.current.shadow.mapSize.height = shadowMapSize;
      shadowsDirtyRef.current = true;
    }
    needsRenderRef.current = true;
  }, [keyLightInt, keyLightColor, ambientInt, lightElev, lightAzimuth, shadowRadius, shadowColor, hemIntensity, shadowMapSize, shadowBias, shadowNormalBias, spotEnabled, spotInt, spotColor, spotAngle, spotPenumbra]);

  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current || !composerRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      composerRef.current.setSize(w, h);
      const aspect = w / h;
      cameraRef.current.left = camZoom * aspect / -2;
      cameraRef.current.right = camZoom * aspect / 2;
      cameraRef.current.top = camZoom / 2;
      cameraRef.current.bottom = camZoom / -2;
      cameraRef.current.updateProjectionMatrix();
      needsRenderRef.current = true;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camZoom]);

  const handleLayerColorChange = (index: number, color: string) => {
    const newColors = [...layerColors];
    newColors[index] = color;
    setLayerColors(newColors);
    if (terrainRef.current.length > 0) {
      if (renderModeRef.current === 'glass') {
         rebuildMeshes(terrainRef.current, bevel, glowInt, opacity, terrainTint, newColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter, brokenBlocks);
      } else {
         rebuildMixedMeshes(terrainRef.current, newColors, terrainTint, enabledShapes, brokenBlocks);
      }
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({
      layoutTab,
      gridW, gridH, octaves, seed, maxElev, roughness,
      bevel, glowInt, opacity, terrainTint, layerColors, matTransmit, matThickness, matIor, matRoughness, cubeJitter,
      beaconCount, beaconColor, beaconEmissive, beaconLight, beaconSeed, beaconBury,
      bloomStr, bloomThresh,
      camElev, camAzimuth, camZoom, tiltBlur, tiltSpread, tiltVignette, vigColor,
      keyLightInt, ambientInt, lightElev, lightAzimuth, keyLightColor,
      shadowRadius, shadowColor, hemIntensity, shadowMapSize, shadowBias, shadowNormalBias,
      renderMode, enabledShapes: Array.from(enabledShapes),
      
      sheepCount, sheepSize, sheepSeed,
      sheepSpeed, sheepBounceSpeed, sheepBounciness, sheepGravity,
      sheepExplodeForce, sheepExplodeRadius, sheepSeparation, sheepCohesion, sheepAlignment,
      
      spotEnabled, spotInt, spotColor, spotAngle, spotPenumbra,
      
      partLimit, partCount, partSize, partSpeed, partDecay, partLife, partFalloff, partChance,
      regenSpeed, regenFadeSpeed
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terrain-preset.json';
    a.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
