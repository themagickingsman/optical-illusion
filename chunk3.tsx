  // ── Build Custom Hex World ──
  const buildHexWorld = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!hexWorldGrpRef.current) {
      hexWorldGrpRef.current = new THREE.Group();
      scene.add(hexWorldGrpRef.current);
    }
    const grp = hexWorldGrpRef.current;
    grp.visible = layoutTabRef.current === 'custom';
    if (!grp.visible) return;

    // Clear old
    while (grp.children.length > 0) {
       const c = grp.children[0] as THREE.Mesh;
       grp.remove(c);
       c.geometry?.dispose();
       (c.material as THREE.Material)?.dispose();
    }
    slotMeshesRef.current.clear();
    beamMeshesRef.current.clear();
    energonPlacedRef.current.clear();

    const hexRadius = 1.0;
    const hexHeight = 0.5;
    const hexWidth = Math.sqrt(3) * hexRadius;
    const hexVert = 1.5 * hexRadius;

    const geo = new THREE.CylinderGeometry(hexRadius, hexRadius, hexHeight, 6);
    // 7 rows of 5 hexes, staggered
    for (let row = 0; row < 7; row++) {
       for (let col = 0; col < 5; col++) {
           const xOffset = (row % 2 === 1) ? hexWidth / 2 : 0;
           const px = (col * hexWidth) + xOffset - (2.5 * hexWidth);
           const pz = (row * hexVert) - (3 * hexVert);
           const py = (row === 0 || row === 6 || col === 0 || col === 4) ? -0.2 : 0; // slight bowl

           const isFilled = slotsFilledRef.current[row][col];

           const mat = new THREE.MeshStandardMaterial({
               color: isFilled ? 0x222222 : 0x111111,
               roughness: 0.7,
               metalness: 0.3,
               emissive: isFilled ? 0x111111 : 0x050505
           });
           const mesh = new THREE.Mesh(geo, mat);
           mesh.position.set(px, py, pz);
           mesh.receiveShadow = true;
           mesh.castShadow = true;
           mesh.userData = { row, col, type: 'hex_slot' };
           grp.add(mesh);
           slotMeshesRef.current.set(`${row}_${col}`, mesh);

           if (isFilled) {
               const egGeo = new THREE.DodecahedronGeometry(0.4, 0);
               const egMat = new THREE.MeshStandardMaterial({
                   color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 2.0,
                   roughness: 0.1, metalness: 0.8
               });
               const egMesh = new THREE.Mesh(egGeo, egMat);
               egMesh.position.set(px, py + 0.8, pz);
               egMesh.userData = { row, col, type: 'energon' };
               grp.add(egMesh);
               energonPlacedRef.current.set(`${row}_${col}`, egMesh);
           }
       }
    }

    // Altar beams at the back (row 6)
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 16);
    for (let b = 0; b < 7; b++) {
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ffff, transparent: true, opacity: 0.6,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const beam = new THREE.Mesh(beamGeo, mat);
        // Position them behind the hex grid
        beam.position.set((b - 3) * 2, 10, -8);
        beam.scale.set(1, beamScaleRef.current[b], 1);
        beam.userData = { beamIndex: b };
        grp.add(beam);
        beamMeshesRef.current.set(b, beam);
        
        // Base glowing ring for the beam
        const ringGeo = new THREE.RingGeometry(0.3, 0.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set((b - 3) * 2, 0.1, -8);
        grp.add(ring);
    }
    
    needsRenderRef.current = true;
  }, []);

  // Update effect for Hex World
  useEffect(() => {
     if (layoutTab === 'custom') {
        buildHexWorld();
     } else if (hexWorldGrpRef.current) {
        hexWorldGrpRef.current.visible = false;
     }
  }, [layoutTab, buildHexWorld, slotsFilled]);

  // Main Effect
  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Use Orthographic for isometric look
    const frustumSize = camZoom;
    const aspect = w / h;
    const cam = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      -100, 1000
    );
    cameraRef.current = cam;
    
    cam.position.set(
      Math.cos(THREE.MathUtils.degToRad(camAzimuth)) * 100,
      camElev,
      Math.sin(THREE.MathUtils.degToRad(camAzimuth)) * 100
    );
    cam.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping important for good bloom/glass
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Lock rotation if we want strict isometric, but allow panning/zooming
    controls.enableRotate = true; 
    controls.addEventListener('change', () => { needsRenderRef.current = true; });

    // Lights
    const hemLight = new THREE.HemisphereLight(0xffffff, shadowColor, hemIntensity);
    scene.add(hemLight);
    hemLightRef.current = hemLight;

    const ambLight = new THREE.AmbientLight(0xffffff, ambientInt);
    scene.add(ambLight);
    ambLightRef.current = ambLight;

    const dirLight = new THREE.DirectionalLight(keyLightColor, keyLightInt);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = shadowMapSize;
    dirLight.shadow.mapSize.height = shadowMapSize;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    dirLight.shadow.bias = shadowBias;
    dirLight.shadow.normalBias = shadowNormalBias;
    scene.add(dirLight);
    keyLightRef.current = dirLight;

    const rimLight = new THREE.DirectionalLight(0x88bbff, keyLightInt * 0.3);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const spotLight = new THREE.SpotLight(spotColor, spotEnabled ? spotInt : 0);
    spotLight.angle = THREE.MathUtils.degToRad(spotAngle);
    spotLight.penumbra = spotPenumbra;
    spotLight.castShadow = true;
    spotLight.position.set(0, 30, 0);
    scene.add(spotLight);
    spotLightRef.current = spotLight;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    const renderPass = new RenderPass(scene, cam);
    renderPassRef.current = renderPass;
    composer.addPass(renderPass);

    const tiltPass = new ShaderPass(TiltShiftShader);
    tiltPass.uniforms.focus.value = 0.5;
    tiltPassRef.current = tiltPass;
    composer.addPass(tiltPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), bloomStr, 0.4, bloomThresh);
    bloomPassRef.current = bloomPass;
    composer.addPass(bloomPass);

    // Initialize flocks
    flockEngineRef.current = new SheepFlockEngine(scene);

    let lastTime = performance.now();
    let tickCount = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;
      tickCount++;

      // FPS tracking
      fpsCountRef.current++;
      if (now - fpsTRef.current >= 1000) {
        if (fpsElRef.current) fpsElRef.current.innerText = `${fpsCountRef.current} FPS`;
        fpsCountRef.current = 0;
        fpsTRef.current = now;
      }

      let _needsRender = needsRenderRef.current;
      controls.update();

