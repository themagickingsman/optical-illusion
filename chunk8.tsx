  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#081424', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* Top HUD / Tabs */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: 8, backdropFilter: 'blur(10px)' }}>
             <button onClick={() => setLayoutTab('procedural')} style={{ padding: '8px 16px', background: layoutTab==='procedural'?'#ffedd5':'transparent', color: layoutTab==='procedural'?'#000':'#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Procedural</button>
             <button onClick={() => setLayoutTab('custom')} style={{ padding: '8px 16px', background: layoutTab==='custom'?'#00ffcc':'transparent', color: layoutTab==='custom'?'#000':'#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Hex Altar</button>
             <button onClick={() => setLayoutTab('large_map')} style={{ padding: '8px 16px', background: layoutTab==='large_map'?'#ff44aa':'transparent', color: layoutTab==='large_map'?'#000':'#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Large Map</button>
         </div>
         
         <div style={{ color: '#00ffcc', fontSize: 12, fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
            <span ref={fpsElRef}>0 FPS</span>
         </div>
         
         {layoutTab === 'procedural' && (
             <div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: 8, backdropFilter: 'blur(10px)' }}>
                 <button onClick={() => setRenderMode('glass')} style={{ padding: '8px 16px', background: renderMode==='glass'?'#60a5fa':'transparent', color: renderMode==='glass'?'#000':'#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Glass Blox</button>
                 <button onClick={() => setRenderMode('mixed')} style={{ padding: '8px 16px', background: renderMode==='mixed'?'#f59e0b':'transparent', color: renderMode==='mixed'?'#000':'#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Mixed Geo</button>
                 {renderMode === 'mixed' && (
                    <button onClick={() => setShapeLibraryOpen(true)} style={{ padding: '8px 12px', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Shapes...</button>
                 )}
             </div>
         )}
      </div>

      {/* Hex World HUD */}
      {layoutTab === 'custom' && (
         <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.7)', padding: '15px 30px', borderRadius: 12, border: '1px solid #00ffcc', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: 0, color: '#00ffcc', fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}>Energon Altar</h3>
            <div style={{ display: 'flex', gap: 10 }}>
               <button onClick={() => setSelectedEnergon(1)} style={{ padding: '10px 20px', background: selectedEnergon?'#00ffcc':'transparent', color: selectedEnergon?'#000':'#00ffcc', border: '1px solid #00ffcc', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Hold Energon Core</button>
               <button onClick={() => setSelectedEnergon(null)} style={{ padding: '10px 20px', background: !selectedEnergon?'#333':'transparent', color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer' }}>Empty Hands</button>
            </div>
            <p style={{ margin: 0, color: '#aaa', fontSize: 11 }}>Click slots to place cores. Click back beams to charge them.</p>
         </div>
      )}

      {/* Shape Library Modal */}
      {shapeLibraryOpen && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
             <div style={{ background: '#1e293b', width: 600, height: 500, borderRadius: 12, border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: 20, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 style={{ margin: 0, color: '#fff' }}>Shape Library</h2>
                   <button onClick={() => setShapeLibraryOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ padding: 20, flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, alignContent: 'start' }}>
                   {SHAPE_LIBRARY.map(s => {
                      const isActive = enabledShapes.has(s.id);
                      return (
                         <div key={s.id} onClick={() => {
                            const n = new Set(enabledShapes);
                            if (n.has(s.id)) {
                               if (n.size > 1) n.delete(s.id); // don't allow 0 shapes
                            } else {
                               n.add(s.id);
                            }
                            setEnabledShapes(n);
                         }} style={{
                             background: isActive ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.05)',
                             border: `1px solid ${isActive ? '#60a5fa' : 'transparent'}`,
                             borderRadius: 8, padding: 15, cursor: 'pointer', textAlign: 'center',
                             transition: 'all 0.2s'
                         }}>
                             <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                             <div style={{ color: isActive ? '#fff' : '#94a3b8', fontSize: 12 }}>{s.name}</div>
                         </div>
                      )
                   })}
                </div>
                <div style={{ padding: 20, borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                   <button onClick={() => setEnabledShapes(new Set(ALL_SHAPE_IDS))} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Enable All</button>
                   <button onClick={() => { generate(); setShapeLibraryOpen(false); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Apply & Rebuild</button>
                </div>
             </div>
          </div>
      )}

      {/* Sidebar Controls (Hidden in Hex Mode) */}
      {layoutTab !== 'custom' && (
      <div style={{
        position: 'absolute', top: 20, right: isSidebarMin ? -330 : 20,
        width: 320, maxHeight: 'calc(100vh - 40px)',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: 16, display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 20
      }}>
        {/* Sidebar Toggle Handle */}
        <div 
           onClick={() => setIsSidebarMin(!isSidebarMin)}
           style={{
              position: 'absolute', left: -30, top: 20, width: 30, height: 60,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRight: 'none',
              borderRadius: '8px 0 0 8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 20
           }}
        >
           {isSidebarMin ? '◀' : '▶'}
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>World Builder</h2>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{status}</div>
           </div>
           <button onClick={generate} style={{
              background: '#3b82f6', color: '#fff', border: 'none',
              padding: '6px 12px', borderRadius: 6, fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
           }}>Regen</button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Section: Geography */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Geography</div>
            <CfgSlider label="Grid W" min={8} max={64} step={1} value={gridW} onChange={setGridW} accent="#3b82f6" />
            <CfgSlider label="Grid H" min={8} max={64} step={1} value={gridH} onChange={setGridH} accent="#3b82f6" />
            <CfgSlider label="Octaves" min={1} max={6} step={1} value={octaves} onChange={setOctaves} accent="#10b981" />
            <CfgSlider label="Max Elev" min={1} max={20} step={1} value={maxElev} onChange={setMaxElev} accent="#f59e0b" />
            <CfgSlider label="Roughness" min={0.1} max={3.0} step={0.1} value={roughness} onChange={setRoughness} accent="#ef4444" />
            <CfgSlider label="Seed" min={0} max={9999} step={1} value={seed} onChange={setSeed} accent="#8b5cf6" />
          </div>

          {/* Section: Material / Looks */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Material & Colors</div>
            <CfgSlider label="Opacity" min={0.1} max={1.0} step={0.01} value={opacity} onChange={setOpacity} />
            <CfgSlider label="Transmit" min={0.0} max={1.0} step={0.01} value={matTransmit} onChange={setMatTransmit} />
            <CfgSlider label="Thickness" min={0.1} max={5.0} step={0.1} value={matThickness} onChange={setMatThickness} />
            <CfgSlider label="IOR" min={1.0} max={2.5} step={0.01} value={matIor} onChange={setMatIor} />
            <CfgSlider label="Roughness" min={0.0} max={1.0} step={0.01} value={matRoughness} onChange={setMatRoughness} />
            <CfgSlider label="Bevel" min={0} max={0.5} step={0.01} value={bevel} onChange={setBevel} />
            <CfgSlider label="Jitter" min={0} max={1.0} step={0.05} value={cubeJitter} onChange={setCubeJitter} />
            <CfgSlider label="Glow Int" min={0} max={5} step={0.1} value={glowInt} onChange={setGlowInt} />
            <CfgSlider label="Hover Fade" min={0.01} max={0.2} step={0.01} value={hoverFade} onChange={setHoverFade} accent="#ff00ff" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
               <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', width: 75 }}>TINT</span>
               <input type="color" value={terrainTint} onChange={e => setTerrainTint(e.target.value)} style={{ width: '100%', height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
               {layerColors.map((col, i) => (
                 <input key={i} type="color" value={col} onChange={e => handleLayerColorChange(i, e.target.value)} style={{ flex: 1, height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
               ))}
            </div>
          </div>

          {/* Section: Beacons */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Beacons</div>
            <CfgSlider label="Count" min={0} max={20} step={1} value={beaconCount} onChange={setBeaconCount} accent="#ff6b35" />
            <CfgSlider label="Bury Depth" min={0} max={10} step={1} value={beaconBury} onChange={setBeaconBury} accent="#ff6b35" />
            <CfgSlider label="Emissive" min={0} max={10} step={0.5} value={beaconEmissive} onChange={setBeaconEmissive} accent="#ff6b35" />
            <CfgSlider label="Light Str" min={0} max={5} step={0.1} value={beaconLight} onChange={setBeaconLight} accent="#ff6b35" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
               <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', width: 75 }}>COLOR</span>
               <input type="color" value={beaconColor} onChange={e => setBeaconColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            </div>
          </div>
          
          {/* Section: Flocks (Sheep) */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Sheep Flock</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
               <span style={{ fontSize: 10, color: '#aaa' }}>Animate</span>
               <input type="checkbox" checked={sheepAnimate} onChange={e => setSheepAnimate(e.target.checked)} />
            </div>
            <CfgSlider label="Count" min={0} max={200} step={1} value={sheepCount} onChange={setSheepCount} accent="#dddddd" />
            <CfgSlider label="Size" min={0.1} max={5.0} step={0.1} value={sheepSize} onChange={setSheepSize} accent="#dddddd" />
            <CfgSlider label="Seed" min={0} max={9999} step={1} value={sheepSeed} onChange={setSheepSeed} accent="#dddddd" />
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>BEHAVIOR</div>
            <CfgSlider label="Speed" min={0.1} max={10.0} step={0.1} value={sheepSpeed} onChange={setSheepSpeed} accent="#aaaaaa" />
            <CfgSlider label="Jump Spd" min={1.0} max={20.0} step={0.5} value={sheepBounceSpeed} onChange={setSheepBounceSpeed} accent="#aaaaaa" />
            <CfgSlider label="Bounce" min={0.0} max={2.0} step={0.05} value={sheepBounciness} onChange={setSheepBounciness} accent="#aaaaaa" />
            <CfgSlider label="Gravity" min={5} max={100} step={1} value={sheepGravity} onChange={setSheepGravity} accent="#aaaaaa" />
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>EXPLOSION RESPONSE</div>
            <CfgSlider label="Exp Force" min={0} max={100} step={1} value={sheepExplodeForce} onChange={setSheepExplodeForce} accent="#ff4444" />
            <CfgSlider label="Exp Radius" min={1} max={20} step={1} value={sheepExplodeRadius} onChange={setSheepExplodeRadius} accent="#ff4444" />
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>BOIDS RULES</div>
            <CfgSlider label="Separation" min={0} max={5} step={0.1} value={sheepSeparation} onChange={setSheepSeparation} accent="#44aaff" />
            <CfgSlider label="Cohesion" min={0} max={5} step={0.1} value={sheepCohesion} onChange={setSheepCohesion} accent="#44aaff" />
            <CfgSlider label="Alignment" min={0} max={5} step={0.1} value={sheepAlignment} onChange={setSheepAlignment} accent="#44aaff" />
          </div>

          {/* Section: Particles & Regeneration */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Particles & Damage</div>
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>DEBRIS CONFIG</div>
            <CfgSlider label="Max Pool" min={1000} max={TERRAIN_MAX_PARTICLES} step={1000} value={partLimit} onChange={setPartLimit} accent="#ff4444" />
            <CfgSlider label="Count/Blk" min={1} max={200} step={1} value={partCount} onChange={setPartCount} accent="#ff4444" />
            <CfgSlider label="Size" min={0.1} max={5.0} step={0.1} value={partSize} onChange={setPartSize} accent="#ff4444" />
            <CfgSlider label="Init Spd" min={0.1} max={5.0} step={0.1} value={partSpeed} onChange={setPartSpeed} accent="#ff4444" />
            <CfgSlider label="Air Drag" min={0.8} max={0.999} step={0.001} value={partDecay} onChange={setPartDecay} accent="#ff4444" />
            <CfgSlider label="Gravity" min={0.0} max={0.1} step={0.001} value={partFalloff} onChange={setPartFalloff} accent="#ff4444" />
            <CfgSlider label="LifeMax" min={10} max={1000} step={10} value={partLife} onChange={setPartLife} accent="#ff4444" />
            <CfgSlider label="Break %" min={0.0} max={1.0} step={0.05} value={partChance} onChange={setPartChance} accent="#ffaa00" />
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>AUTO-REPAIR</div>
            <CfgSlider label="Ticks Wait" min={0} max={300} step={1} value={regenSpeed} onChange={setRegenSpeed} accent="#00ff88" />
            <CfgSlider label="Heal Spd" min={0.001} max={0.1} step={0.001} value={regenFadeSpeed} onChange={setRegenFadeSpeed} accent="#00ff88" />
          </div>

          {/* Section: Lighting & Camera */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Lighting & Rig</div>
            <CfgSlider label="Key Int" min={0} max={10} step={0.1} value={keyLightInt} onChange={setKeyLightInt} />
            <CfgSlider label="Amb Int" min={0} max={5} step={0.1} value={ambientInt} onChange={setAmbientInt} />
            <CfgSlider label="Light Elv" min={0} max={90} step={1} value={lightElev} onChange={setLightElev} />
            <CfgSlider label="Light Azi" min={0} max={360} step={1} value={lightAzimuth} onChange={setLightAzimuth} />
            <CfgSlider label="Cam Elv" min={0} max={90} step={0.1} value={camElev} onChange={setCamElev} />
            <CfgSlider label="Cam Azi" min={0} max={360} step={1} value={camAzimuth} onChange={setCamAzimuth} />
            <CfgSlider label="Cam Zoom" min={10} max={100} step={1} value={camZoom} onChange={setCamZoom} />
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>SPOTLIGHT (CURSOR)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
               <span style={{ fontSize: 10, color: '#aaa' }}>Enable</span>
               <input type="checkbox" checked={spotEnabled} onChange={e => setSpotEnabled(e.target.checked)} />
            </div>
            <CfgSlider label="Intensity" min={0} max={100} step={1} value={spotInt} onChange={setSpotInt} accent="#ffdd00" />
            <CfgSlider label="Angle" min={5} max={90} step={1} value={spotAngle} onChange={setSpotAngle} accent="#ffdd00" />
            <CfgSlider label="Penumbra" min={0} max={1} step={0.01} value={spotPenumbra} onChange={setSpotPenumbra} accent="#ffdd00" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
               <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', width: 75 }}>COLOR</span>
               <input type="color" value={spotColor} onChange={e => setSpotColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            </div>
            
            <div style={{ fontSize: 9, color: '#667', marginTop: 10, marginBottom: 5 }}>SHADOWS</div>
            <CfgSlider label="Softness" min={0} max={20} step={0.5} value={shadowRadius} onChange={setShadowRadius} />
            <CfgSlider label="Map Size" min={512} max={4096} step={512} value={shadowMapSize} onChange={setShadowMapSize} />
            <CfgSlider label="NormalBias" min={0} max={0.1} step={0.001} value={shadowNormalBias} onChange={setShadowNormalBias} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
               <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', width: 75 }}>COLOR</span>
               <input type="color" value={shadowColor} onChange={e => setShadowColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            </div>
            <CfgSlider label="Hem Str" min={0} max={2} step={0.1} value={hemIntensity} onChange={setHemIntensity} />
          </div>

          {/* Section: Post-Processing */}
          <div>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}>Post FX</div>
            <CfgSlider label="Bloom Str" min={0} max={3} step={0.1} value={bloomStr} onChange={setBloomStr} accent="#ec4899" />
            <CfgSlider label="Bloom Thr" min={0} max={2} step={0.1} value={bloomThresh} onChange={setBloomThresh} accent="#ec4899" />
            <CfgSlider label="Tilt Blur" min={0} max={5} step={0.1} value={tiltBlur} onChange={setTiltBlur} accent="#a855f7" />
            <CfgSlider label="Tilt Sprd" min={0} max={0.1} step={0.005} value={tiltSpread} onChange={setTiltSpread} accent="#a855f7" />
            <CfgSlider label="Vignette" min={0} max={1} step={0.05} value={tiltVignette} onChange={setTiltVignette} accent="#a855f7" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
               <span style={{ fontSize: 9, color: '#556677', fontFamily: 'monospace', width: 75 }}>VIG TINT</span>
               <input type="color" value={vigColor} onChange={e => setVigColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
           <button onClick={handleExport} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', transition: 'background 0.2s' }}
                   onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                   onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
           >
              {saved ? 'Saved!' : 'Export JSON'}
           </button>
        </div>
      </div>
      )}

      {/* =========================================================================
          RAID HUD
          ========================================================================= */}
      {layoutTab !== 'custom' && (
      <div style={{
         position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
         display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30
      }}>
          <button 
             onClick={() => { setIsRaidMode(!isRaidMode); if (!isRaidMode) setShowRaidPanel(true); }}
             style={{
                background: isRaidMode ? '#ff3c3c' : 'rgba(0,0,0,0.6)',
                color: '#fff', border: `2px solid ${isRaidMode ? '#ff8888' : '#333'}`,
                padding: '10px 24px', borderRadius: 30, fontSize: 16, fontWeight: 'bold',
                cursor: 'pointer', backdropFilter: 'blur(10px)',
                boxShadow: isRaidMode ? '0 0 20px rgba(255,60,60,0.5)' : 'none',
                marginBottom: 10, transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: 2
             }}
          >
             {isRaidMode ? '🚨 RAID ACTIVE 🚨' : 'ENABLE RAID MODE'}
          </button>
          
          {isRaidMode && showRaidPanel && (
             <div style={{
                background: 'rgba(20, 10, 10, 0.9)', border: '1px solid #441111',
                padding: 15, borderRadius: 12, backdropFilter: 'blur(10px)',
                display: 'flex', gap: 10, alignItems: 'flex-start'
             }}>
                 <div style={{ display: 'flex', gap: 5 }}>
                    <WeaponButton active={selectedWeapon === 'scatter'} onClick={() => setSelectedWeapon('scatter')} icon="🧨" label="SCATTER" />
                    <WeaponButton active={selectedWeapon === 'artillery'} onClick={() => setSelectedWeapon('artillery')} icon="🚀" label="ARTILLERY" />
                    <WeaponButton active={selectedWeapon === 'flyover'} onClick={() => setSelectedWeapon('flyover')} icon="✈️" label="FLYOVER" />
                    <WeaponButton active={selectedWeapon === 'laser'} onClick={() => setSelectedWeapon('laser')} icon="🛰️" label="ORBIT LASER" />
                    <WeaponButton active={selectedWeapon === 'seismic'} onClick={() => setSelectedWeapon('seismic')} icon="🔊" label="SEISMIC" />
                    <WeaponButton active={selectedWeapon === 'carpet'} onClick={() => setSelectedWeapon('carpet')} icon="💣" label="CARPET" />
                    <WeaponButton active={selectedWeapon === 'blackhole'} onClick={() => setSelectedWeapon('blackhole')} icon="🌌" label="SINGULARITY" />
                 </div>
                 
                 <div style={{ width: 1, background: '#331111', margin: '0 10px', alignSelf: 'stretch' }} />
                 
                 {/* Right Side: Settings for selected weapon */}
                 <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#ff3c3c', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>WEAPON TUNING</span>
                        <button onClick={() => setShowRaidPhysics(!showRaidPhysics)} style={{ background: 'transparent', border: '1px solid #ff3c3c', color: '#ff3c3c', fontSize: 9, cursor: 'pointer', borderRadius: 4 }}>{showRaidPhysics ? 'Hide Physics' : 'Physics...'}</button>
                     </div>
                     
                     {showRaidPhysics ? (
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 }}>
                            <div style={{ fontSize: 9, color: '#aaa', marginBottom: 5 }}>GLOBAL PARTICLE PHYSICS</div>
                            <CfgSlider label="Spd" min={0.1} max={5} step={0.1} value={partSpeed} onChange={setPartSpeed} accent="#ff3c3c" />
                            <CfgSlider label="Drag" min={0.8} max={0.999} step={0.001} value={partDecay} onChange={setPartDecay} accent="#ff3c3c" />
                            <CfgSlider label="Grav" min={0} max={0.1} step={0.001} value={partFalloff} onChange={setPartFalloff} accent="#ff3c3c" />
                            <CfgSlider label="Life" min={10} max={1000} step={10} value={partLife} onChange={setPartLife} accent="#ff3c3c" />
                        </div>
                     ) : (
                        <>
                           {!selectedWeapon && <div style={{ color: '#666', fontSize: 11, fontStyle: 'italic', marginTop: 10 }}>Select a weapon system to configure payload parameters.</div>}
                           
                           {selectedWeapon === 'scatter' && <>
                              <CfgSlider label="Bombs" min={1} max={30} step={1} value={scatterCount} onChange={setScatterCount} accent="#ff3c3c" />
                              <CfgSlider label="Radius" min={1} max={15} step={1} value={scatterRadius} onChange={setScatterRadius} accent="#ff3c3c" />
                              <CfgSlider label="Depth" min={1} max={10} step={1} value={scatterDepth} onChange={setScatterDepth} accent="#ff3c3c" />
                              <CfgSlider label="Delay" min={50} max={1000} step={10} value={scatterDelay} onChange={setScatterDelay} accent="#ff3c3c" />
                           </>}
                           
                           {selectedWeapon === 'artillery' && <>
                              <CfgSlider label="Radius" min={2} max={25} step={1} value={artilleryRadius} onChange={setArtilleryRadius} accent="#ffaa00" />
                              <CfgSlider label="Depth" min={1} max={15} step={1} value={artilleryDepth} onChange={setArtilleryDepth} accent="#ffaa00" />
                              <CfgSlider label="Hangtime" min={200} max={2000} step={50} value={artilleryDelay} onChange={setArtilleryDelay} accent="#ffaa00" />
                           </>}
                           
                           {selectedWeapon === 'flyover' && <>
                              <CfgSlider label="Radius" min={2} max={15} step={1} value={flyoverRadius} onChange={setFlyoverRadius} accent="#00ffff" />
                              <CfgSlider label="Depth" min={1} max={10} step={1} value={flyoverDepth} onChange={setFlyoverDepth} accent="#00ffff" />
                              <CfgSlider label="Time To Tgt" min={500} max={3000} step={100} value={flyoverDelay} onChange={setFlyoverDelay} accent="#00ffff" />
                           </>}
                           
                           {selectedWeapon === 'laser' && <>
                              <CfgSlider label="Beam Rad" min={1} max={10} step={1} value={laserRadius} onChange={setLaserRadius} accent="#ff0055" />
                              <CfgSlider label="Melt Dpt" min={1} max={20} step={1} value={laserDepth} onChange={setLaserDepth} accent="#ff0055" />
                              <CfgSlider label="Duration" min={500} max={5000} step={100} value={laserDuration} onChange={setLaserDuration} accent="#ff0055" />
                              <CfgSlider label="Spin Up" min={100} max={2000} step={50} value={laserDelay} onChange={setLaserDelay} accent="#ff0055" />
                           </>}
                           
                           {selectedWeapon === 'seismic' && <>
                              <CfgSlider label="Wave Rad" min={5} max={40} step={1} value={seismicRadius} onChange={setSeismicRadius} accent="#88ff00" />
                              <CfgSlider label="Depth" min={1} max={5} step={1} value={seismicDepth} onChange={setSeismicDepth} accent="#88ff00" />
                              <CfgSlider label="Wave Spd" min={10} max={100} step={5} value={seismicSpeed} onChange={setSeismicSpeed} accent="#88ff00" />
                              <CfgSlider label="Charge" min={50} max={1000} step={50} value={seismicDelay} onChange={setSeismicDelay} accent="#88ff00" />
                           </>}
                           
                           {selectedWeapon === 'carpet' && <>
                              <CfgSlider label="Bombs" min={5} max={50} step={1} value={carpetCount} onChange={setCarpetCount} accent="#ff5500" />
                              <CfgSlider label="Radius" min={1} max={10} step={1} value={carpetRadius} onChange={setCarpetRadius} accent="#ff5500" />
                              <CfgSlider label="Depth" min={1} max={5} step={1} value={carpetDepth} onChange={setCarpetDepth} accent="#ff5500" />
                              <CfgSlider label="Spacing" min={50} max={500} step={10} value={carpetDelay} onChange={setCarpetDelay} accent="#ff5500" />
                           </>}
                           
                           {selectedWeapon === 'blackhole' && <>
                              <CfgSlider label="Event Hrz" min={2} max={20} step={1} value={blackholeRadius} onChange={setBlackholeRadius} accent="#8800ff" />
                              <CfgSlider label="Singularity" min={1} max={15} step={1} value={blackholeDepth} onChange={setBlackholeDepth} accent="#8800ff" />
                              <CfgSlider label="Duration" min={1000} max={10000} step={500} value={blackholeDuration} onChange={setBlackholeDuration} accent="#8800ff" />
                              <CfgSlider label="Collapse" min={200} max={2000} step={100} value={blackholeDelay} onChange={setBlackholeDelay} accent="#8800ff" />
                           </>}
                        </>
                     )}
                 </div>
             </div>
          )}
      </div>
      )}

    </div>
  );
}
