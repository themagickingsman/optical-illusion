import React from 'react';

// dummy wrapper to hold the JSX chunk
export const SidebarChunk = () => {
  return (
      {/* ── Apple Inspector Panel ─────────────────────────────────────────── */}
      <div style={{
        width: isSidebarMin ? 40 : 300, 
        background: 'rgba(18, 18, 22, 0.85)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        padding: isSidebarMin ? '16px 4px' : '20px 16px', display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: isSidebarMin ? 'hidden' : 'auto', overflowX: 'hidden', backdropFilter: 'blur(24px)', flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {!isSidebarMin && <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Inspector
          </div>}
          <div 
             onClick={() => setIsSidebarMin(!isSidebarMin)} 
             style={{ cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.5)', margin: isSidebarMin ? '0 auto' : 0 }}
             title="Toggle Sidebar"
          >
             {isSidebarMin ? '📂' : '✕'}
          </div>
        </div>

        {!isSidebarMin && (<>

        {/* ── Mode Selection ── */}
        <div className="apple-segmented-control">
          {(['procedural', 'custom', 'large_map'] as const).map(tab => {
            const label = tab === 'procedural' ? 'Procedural' : tab === 'custom' ? 'Custom' : 'Large Map';
            return (
              <div 
                key={tab} 
                className={`apple-segment ${layoutTab === tab ? 'active' : ''}`}
                onClick={() => setLayoutTab(tab)}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* ── Inspector Category Tabs ── */}
        <div className="apple-segmented-control" style={{ marginTop: -8 }}>
          {(['geometry', 'lighting', 'materials', 'effects'] as const).map(tab => (
            <div 
              key={tab} 
              className={`apple-segment ${inspectorTab === tab ? 'active' : ''}`}
              onClick={() => setInspectorTab(tab)}
              style={{ fontSize: 10, padding: '6px 4px' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          
          {/* ================= GEOMETRY TAB ================= */}
          {inspectorTab === 'geometry' && (<>
            {layoutTab === 'custom' && (
              <div className="apple-card">
                <div className="apple-card-title">HEX ALTAR WORLD</div>
                <div style={{ fontSize: 11, color: '#99aabb', marginBottom: 12, lineHeight: 1.5 }}>
                  7 Altars · 5 slots each · Place energon cubes.<br/>
                  All 5 slots → altar activates beam ↑
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={generateHexWorld} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                    background: 'rgba(255,215,0,0.15)', color: '#ffd700',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}>Generate</button>
                  <button onClick={saveToGame} disabled={!terrain.length} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                    background: saved ? 'rgba(64,170,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: saved ? '#aef' : '#fff',
                    fontWeight: 600, fontSize: 12, cursor: terrain.length ? 'pointer' : 'not-allowed',
                  }}>{saved ? 'Saved' : 'Save'}</button>
                </div>
              </div>
            )}

            {(layoutTab === 'procedural' || layoutTab === 'large_map') && (
              <div className="apple-card">
                <div className="apple-card-title">GRID GENERATION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Width"   min={8} max={64} step={4} value={gridW}     onChange={setGridW}     />
                  <CfgSlider label="Height"  min={8} max={64} step={4} value={gridH}     onChange={setGridH}     />
                  <CfgSlider label="Octaves" min={1} max={6}  step={1} value={octaves}   onChange={setOctaves}   />
                  <CfgSlider label="Seed"    min={1} max={999} step={1} value={seed}     onChange={setSeed}      />
                </div>
                
                <div className="apple-card-title" style={{ marginTop: 16 }}>ELEVATION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Max Height" min={2} max={8}   step={1}   value={maxElev}    onChange={setMaxElev}    />
                  <CfgSlider label="Roughness"  min={0.3} max={4} step={0.1} value={roughness}  onChange={setRoughness}  accent="#f97316" />
                </div>
              </div>
            )}

            <div className="apple-card">
              <div className="apple-card-title">LAYER COLORS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {layerColors.map((col, i) => {
                  const labels = ['Valley','Lowland','Mid','Highland','Peak'];
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{labels[i]}</span>
                      <input type="color" value={col} onChange={e => {
                        const updated = [...layerColors];
                        updated[i] = e.target.value;
                        setLayerColors(updated);
                      }} style={{ width: 32, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent', padding: 0 }} />
                    </div>
                  );
                })}
              </div>
              
              <div className="apple-card-title" style={{ marginTop: 16 }}>TERRAIN BASE TINT</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {['#1e7a8c','#0d4a6a','#2d6a4f','#7b2d8b','#8c4a1e','#1a4a8c','#6c757d'].map(c => (
                  <div key={c} onClick={() => setTerrainTint(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: terrainTint === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: terrainTint === c ? `0 0 8px ${c}` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title">ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={generate} style={{
                  padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600, cursor: 'pointer',
                }}>Generate Terrain</button>
                <button onClick={saveToGame} disabled={!terrain.length} style={{
                  padding: '8px 0', borderRadius: 8, border: 'none', background: saved ? 'rgba(64,170,255,0.2)' : 'rgba(255,255,255,0.08)', color: saved ? '#aef' : '#fff', fontWeight: 600, cursor: terrain.length ? 'pointer' : 'not-allowed',
                }}>{saved ? 'Saved to Game' : 'Save to Game'}</button>
                <button onClick={bake} disabled={!terrain.length} style={{
                  padding: '8px 0', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: terrain.length ? '#fff' : '#666', fontWeight: 500, cursor: terrain.length ? 'pointer' : 'not-allowed',
                }}>Bake PNG Heightmap</button>
              </div>
            </div>
          </>)}

          {/* ================= LIGHTING TAB ================= */}
          {inspectorTab === 'lighting' && (<>
            <div className="apple-card">
              <div className="apple-card-title">ENVIRONMENT LIGHTING</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {([
                  { label: 'Morning',   keyInt: 4.5, ambInt: 0.6, elev: 35, azim: 40, col: '#ffedd5', bg: '#081424', hemInt: 0.6 },
                  { label: 'Noon',      keyInt: 6.5, ambInt: 0.4, elev: 85, azim: 0,  col: '#ffffff', bg: '#020814', hemInt: 0.4 },
                  { label: 'Sunset',    keyInt: 5.0, ambInt: 0.3, elev: 15, azim: 270,col: '#ff904f', bg: '#230b1c', hemInt: 0.5 },
                  { label: 'Midnight',  keyInt: 1.5, ambInt: 0.1, elev: 45, azim: 120,col: '#a4b5f0', bg: '#01030a', hemInt: 0.2 },
                ]).map(p => {
                  const isActive = Math.abs(keyLightInt - p.keyInt) < 0.5 && Math.abs(lightElev - p.elev) < 2;
                  return (
                    <button key={p.label} onClick={() => { setKeyLightInt(p.keyInt); setAmbientInt(p.ambInt); setLightElev(p.elev); setLightAzimuth(p.azim); setKeyLightColor(p.col); setShadowColor(p.bg); setHemIntensity(p.hemInt); }} style={{
                      flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}>{p.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Key Light"  min={0}   max={20}  step={0.1}  value={keyLightInt}  onChange={setKeyLightInt}  accent="#facc15" />
                <CfgSlider label="Ambient"    min={0}   max={1.5} step={0.05} value={ambientInt}   onChange={setAmbientInt}   accent="#facc15" />
                <CfgSlider label="Elevation"  min={5}   max={85}  step={1}    value={lightElev}    onChange={setLightElev}    accent="#facc15" />
                <CfgSlider label="Azimuth"    min={0}   max={360} step={1}    value={lightAzimuth} onChange={setLightAzimuth} accent="#facc15" />
              </div>
              
              <div className="apple-card-title" style={{ marginTop: 16 }}>KEY COLOR</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#ffffff','#a8d8ff','#ffd6aa','#ffeaaa','#c8aaff','#aaffd6'].map(c => (
                  <div key={c} onClick={() => setKeyLightColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: keyLightColor === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: keyLightColor === c ? `0 0 8px ${c}` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>SPOTLIGHT</span>
                <input type="checkbox" checked={spotEnabled} onChange={e => setSpotEnabled(e.target.checked)} style={{ cursor: 'pointer' }} />
              </div>
              {spotEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <CfgSlider label="Intensity"  min={0}   max={50}   step={0.5}  value={spotInt}       onChange={setSpotInt}       accent="#facc15" />
                  <CfgSlider label="Cone Angle" min={1}   max={90}   step={1}    value={spotAngle}     onChange={setSpotAngle}     accent="#facc15" />
                  <CfgSlider label="Falloff"    min={0}   max={1}    step={0.01} value={spotPenumbra}  onChange={setSpotPenumbra}  accent="#facc15" />
                </div>
              )}
            </div>

            <div className="apple-card">
              <div className="apple-card-title">SHADOWS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Cast Opacity" min={0}      max={1}     step={0.01}    value={shadowIntensity}   onChange={setShadowIntensity}   accent="#94a3b8" />
                <CfgSlider label="Softness"     min={1}      max={16}    step={1}       value={shadowRadius}      onChange={setShadowRadius}      accent="#94a3b8" />
                <CfgSlider label="Bias"         min={-0.01}  max={0.002} step={0.0001}  value={shadowBias}        onChange={setShadowBias}        accent="#94a3b8" />
                <CfgSlider label="Normal Bias"  min={0}      max={0.5}   step={0.005}   value={shadowNormalBias}  onChange={setShadowNormalBias}  accent="#94a3b8" />
                <CfgSlider label="Fill Strength" min={0} max={1.5} step={0.02} value={hemIntensity} onChange={setHemIntensity} accent="#94a3b8" />
              </div>
              <div className="apple-card-title" style={{ marginTop: 16 }}>FILL COLOR</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#0a0e2a','#001a0a','#1a0010','#100a00','#000d1a','#1a1a00'].map(c => (
                  <div key={c} onClick={() => setShadowColor(c)} style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: shadowColor === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: shadowColor === c ? `0 0 8px ${c}88` : 'none', flexShrink: 0,
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Map Res</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[256, 512, 1024, 2048].map(sz => (
                    <button key={sz} onClick={() => setShadowMapSize(sz)} style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 600, border: 'none',
                      background: shadowMapSize === sz ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: shadowMapSize === sz ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>{sz >= 1024 ? `${sz / 1024}k` : `${sz}`}</button>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* ================= MATERIALS TAB ================= */}
          {inspectorTab === 'materials' && (<>
            <div className="apple-card">
              <div className="apple-card-title">RENDER ENGINE</div>
              <div className="apple-segmented-control" style={{ marginBottom: 0 }}>
                {(['glass', 'mixed'] as const).map(mode => (
                  <div key={mode} onClick={() => setRenderMode(mode)} className={`apple-segment ${renderMode === mode ? 'active' : ''}`}>
                    {mode === 'glass' ? '🔮 Glass' : '🧱 Mixed Geo'}
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title">GLASS PROPERTIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Bevel"       min={0.01} max={0.35} step={0.01} value={bevel}       onChange={setBevel}       />
                <CfgSlider label="Roughness"   min={0}    max={1.0}  step={0.01} value={matRoughness} onChange={setMatRoughness} accent="#7df" />
                <CfgSlider label="Opacity"     min={0.4}  max={1.0}  step={0.01} value={opacity}     onChange={setOpacity}     />
                <CfgSlider label="Cube Jitter" min={0}    max={1.0}  step={0.01} value={cubeJitter}  onChange={setCubeJitter}  accent="#7df" />
                <CfgSlider label="Jitter Glow" min={0}    max={2}    step={0.05} value={glowInt}     onChange={setGlowInt}     />
                <CfgSlider label="Base Glow"   min={0}    max={2}    step={0.01} value={baseGlow}    onChange={setBaseGlow}    />
                <CfgSlider label="Glow Fade"   min={0.01} max={0.5}  step={0.01} value={hoverFade}   onChange={setHoverFade} />
              </div>
            </div>

            {renderMode === 'glass' && (
              <div className="apple-card">
                <div className="apple-card-title">TRANSMISSION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CfgSlider label="Transmit"  min={0} max={1}   step={0.01} value={matTransmit}  onChange={setMatTransmit}  accent="#06b6d4" />
                  <CfgSlider label="Thickness" min={0} max={5}   step={0.05} value={matThickness} onChange={setMatThickness} accent="#06b6d4" />
                  <CfgSlider label="IOR"       min={1} max={2.5} step={0.01} value={matIor}       onChange={setMatIor}       accent="#06b6d4" />
                </div>
              </div>
            )}
          </>)}

          {/* ================= EFFECTS TAB ================= */}
          {inspectorTab === 'effects' && (<>
            <div className="apple-card">
              <div className="apple-card-title">CAMERA</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {([
                  { label: 'Iso',  elev: 35.26, azim: 45  },
                  { label: 'Dim',   elev: 30,    azim: 30  },
                  { label: 'Top',   elev: 89,    azim: 45  },
                  { label: 'Side',       elev: 25,    azim: 90  },
                  { label: 'Cinematic',  elev: 22,    azim: 20  },
                ] as { label: string; elev: number; azim: number }[]).map(p => {
                  const isActive = Math.abs(camElev - p.elev) < 0.5 && Math.abs(camAzimuth - p.azim) < 0.5;
                  return (
                    <button key={p.label} onClick={() => { setCamElev(p.elev); setCamAzimuth(p.azim); }} style={{
                      flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                      border: 'none', background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}>{p.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Elevation"  min={5}   max={89}  step={0.5}  value={camElev}    onChange={setCamElev}    accent="#67e8f9" />
                <CfgSlider label="Azimuth"    min={0}   max={360} step={1}    value={camAzimuth} onChange={setCamAzimuth} accent="#67e8f9" />
                <CfgSlider label="Zoom"       min={8}   max={80}  step={1}    value={camZoom}    onChange={setCamZoom}    accent="#67e8f9" />
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title">POST-PROCESSING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Bloom Str"    min={0} max={2}   step={0.05} value={bloomStr}    onChange={setBloomStr}    accent="#c084fc" />
                <CfgSlider label="Bloom Thresh" min={0} max={5}   step={0.01} value={bloomThresh} onChange={setBloomThresh} accent="#c084fc" />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <CfgSlider label="Edge Blur"   min={0}     max={5}    step={0.05}  value={tiltBlur}     onChange={setTiltBlur}     accent="#8af" />
                <CfgSlider label="Resolution"  min={0.005} max={0.12} step={0.001} value={tiltSpread}   onChange={setTiltSpread}   accent="#8af" />
                <CfgSlider label="Vignette"    min={0}     max={1}    step={0.01}  value={tiltVignette} onChange={setTiltVignette} accent="#8af" />
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title">SHEEP PHYSICS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Live Engine</span>
                <input type="checkbox" checked={sheepAnimate} onChange={e => { setSheepAnimate(e.target.checked); needsRenderRef.current = true; }} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Count" min={0} max={200} step={1} value={sheepCount} onChange={setSheepCount} accent="#ffccaa" />
                <CfgSlider label="Size"  min={0.1} max={4.0} step={0.05} value={sheepSize} onChange={setSheepSize} accent="#ffccaa" />
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, color: '#a855f7', cursor: 'pointer', fontWeight: 600 }}>Advanced Physics</summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    <CfgSlider label="Walk Speed" min={0.5} max={10} step={0.1} value={sheepSpeed} onChange={setSheepSpeed} accent="#00e5ff" />
                    <CfgSlider label="Bounce Freq" min={1} max={30} step={0.5} value={sheepBounceSpeed} onChange={setSheepBounceSpeed} accent="#00e5ff" />
                    <CfgSlider label="Bounce Height" min={0} max={1} step={0.05} value={sheepBounciness} onChange={setSheepBounciness} accent="#00e5ff" />
                    <CfgSlider label="Gravity (Fall)" min={10} max={100} step={1} value={sheepGravity} onChange={setSheepGravity} accent="#eab308" />
                    <CfgSlider label="Explosion Force" min={5} max={60} step={1} value={sheepExplodeForce} onChange={setSheepExplodeForce} accent="#eab308" />
                    <CfgSlider label="Explosion Radius" min={2} max={30} step={1} value={sheepExplodeRadius} onChange={setSheepExplodeRadius} accent="#eab308" />
                  </div>
                </details>
              </div>
            </div>

            <div className="apple-card">
              <div className="apple-card-title">BEACONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CfgSlider label="Count"    min={0}   max={40}  step={1}    value={beaconCount}    onChange={setBeaconCount}    accent="#ff6b35" />
                <CfgSlider label="Bury Depth" min={0} max={6}   step={1}    value={beaconBury}     onChange={setBeaconBury}     accent="#ff6b35" />
                <CfgSlider label="Emissive" min={0.5} max={8}   step={0.25} value={beaconEmissive} onChange={setBeaconEmissive} accent="#ff6b35" />
                <CfgSlider label="Light"    min={0}   max={4}   step={0.1}  value={beaconLight}    onChange={setBeaconLight}    accent="#ff6b35" />
              </div>
            </div>

            {layoutTab === 'custom' && (
              <div className="apple-card">
                <div className="apple-card-title">ENERGON CUBES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {HEX_ALTAR_COLORS.map((color, i) => {
                    const filled = slotsFilled[i].filter(Boolean).length;
                    const complete = filled === 5;
                    const isSelected = selectedEnergon === i;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const next = isSelected ? null : i;
                          setSelectedEnergon(next);
                          selectedEnergonRef.current = next;
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                          border: isSelected ? `1.5px solid ${color}` : `1px solid ${color}33`,
                          background: isSelected ? `${color}22` : `${color}0a`,
                          color: complete ? color : isSelected ? color : '#7799bb',
                          boxShadow: isSelected ? `0 0 10px ${color}55` : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          background: color,
                          boxShadow: isSelected ? `0 0 8px ${color}` : 'none',
                          opacity: complete ? 1 : isSelected ? 1 : 0.55,
                        }} />
                        <div style={{ flex: 1, textAlign: 'left', fontSize: 10, fontWeight: 600 }}>
                          {HEX_ALTAR_NAMES[i].split('(')[0].trim()}
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array(5).fill(0).map((_, si) => (
                            <div key={si} style={{
                              width: 6, height: 6, borderRadius: 1,
                              background: slotsFilled[i][si] ? color : 'rgba(0,0,0,0.5)',
                            }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="apple-card-title" style={{ marginTop: 16 }}>ALTAR GLOW CALIBRATION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {HEX_ALTAR_NAMES.map((name, i) => {
                    const occluded = altarOcclude[i];
                    return (
                      <div key={i} style={{
                        display: 'flex', flexDirection: 'column', gap: 6,
                        padding: '8px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.2)',
                        border: `1px solid ${HEX_ALTAR_COLORS[i]}33`,
                        opacity: occluded ? 0.4 : 1, transition: 'opacity 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>{name.split('(')[0]}</span>
                          <button
                            onClick={() => setAltarOcclude(prev => { const n=[...prev]; n[i]=!n[i]; return n; })}
                            style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: occluded ? '#333' : `${HEX_ALTAR_COLORS[i]}44`, color: '#fff', fontSize: 9, cursor: 'pointer' }}
                          >{occluded ? 'Disabled' : 'Active'}</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 9, color: '#666', width: 30 }}>GLOW</span>
                          <input type="range" min={0} max={4} step={0.05} value={altarGlow[i]}
                            onChange={e => setAltarGlow(prev => { const n=[...prev]; n[i]=Number(e.target.value); return n; })}
                            style={{ flex: 1, accentColor: HEX_ALTAR_COLORS[i] }} disabled={occluded} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>)}
        </div>
        </>)}
      </div>
  );
}
