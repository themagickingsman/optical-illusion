const fs = require('fs');

let content = fs.readFileSync('/Users/uxmagicman/Desktop/optical_illusions/src/components/library/TerrainGenerator.tsx', 'utf8');

const appleMenuBarStart = content.indexOf('{/* ── Apple Menu Bar (Top) ─────────────────────────────────────────── */}');
const hudStart = content.indexOf('{/* ── HUD ───────────────────────────────────────────────────── */}');

const originalModeAndRaid = `        {/* ── Mode Buttons (Bottom Left) ────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 1000, display: 'flex', gap: 10 }}>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (isRaidMode) setIsRaidMode(false);
              setIsTreasureMode(prev => !prev);
              setShuffleStartTime(Date.now());
            }}
            style={{
              background: isTreasureMode ? 'rgba(255, 193, 7, 0.2)' : 'rgba(10, 16, 28, 0.8)',
              border: isTreasureMode ? '1px solid #ffc107' : '1px solid rgba(255,193,7,0.3)',
              color: isTreasureMode ? '#ffc107' : '#e2b342',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1,
              boxShadow: isTreasureMode ? '0 0 15px rgba(255,193,7,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isTreasureMode ? '✨ EXIT TREASURE HUNTERS' : '🗺️ TREASURE HUNTERS'}
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              if (isTreasureMode) setIsTreasureMode(false);
              setIsRaidMode(prev => !prev);
              if (isRaidMode) setSelectedWeapon(null);
            }}
            style={{
              background: isRaidMode ? 'rgba(255, 60, 60, 0.2)' : 'rgba(10, 16, 28, 0.8)',
              border: isRaidMode ? '1px solid #ff3c3c' : '1px solid rgba(255,60,60,0.3)',
              color: isRaidMode ? '#ff3c3c' : '#e26042',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1,
              boxShadow: isRaidMode ? '0 0 15px rgba(255,60,60,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isRaidMode ? '🛑 EXIT RAID MODE' : '⚔️ ENTER RAID MODE'}
          </button>
        </div>

        {/* ── Raid Control Panel (Top Center) ────────────────────────────── */}
        {isRaidMode && (
          <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 16, width: 800,
            background: 'rgba(10, 16, 28, 0.95)', padding: 24, borderRadius: 12, border: '1px solid rgba(255,60,60,0.3)',
            boxShadow: '0 0 40px rgba(255,60,60,0.15)', backdropFilter: 'blur(10px)',
          }}>
            <div style={{ cursor: 'pointer' }} onClick={() => setShowRaidPanel(!showRaidPanel)}>
              <div style={{ color: '#ff3c3c', fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', textAlign: 'center' }}>
                {showRaidPanel ? '▼ HIDE ARSENAL DASHBOARD ▼' : '▲ SHOW ARSENAL DASHBOARD ▲'}
              </div>
            </div>

            {showRaidPanel && (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <RaidBtn active={selectedWeapon === 'scatter'} onClick={() => setSelectedWeapon('scatter')} icon="🎇" label="SCATTER" />
                  <RaidBtn active={selectedWeapon === 'artillery'} onClick={() => setSelectedWeapon('artillery')} icon="☄️" label="ARTILLERY" />
                  <RaidBtn active={selectedWeapon === 'flyover'} onClick={() => setSelectedWeapon('flyover')} icon="✈️" label="FLYOVER" />
                  <RaidBtn active={selectedWeapon === 'laser'} onClick={() => setSelectedWeapon('laser')} icon="🚀" label="LASER" />
                  <RaidBtn active={selectedWeapon === 'seismic'} onClick={() => setSelectedWeapon('seismic')} icon="🌋" label="SEISMIC" />
                  <RaidBtn active={selectedWeapon === 'carpet'} onClick={() => setSelectedWeapon('carpet')} icon="💣" label="CARPET" />
                  <RaidBtn active={selectedWeapon === 'blackhole'} onClick={() => setSelectedWeapon('blackhole')} icon="🕳️" label="BLACKHOLE" />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  {/* Physics Block */}
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }}>
                      <span>GLOBAL PHYSICS</span>
                      <input type="checkbox" checked={showRaidPhysics} onChange={e => setShowRaidPhysics(e.target.checked)} />
                    </div>
                    {showRaidPhysics && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <CfgSlider label="Max Sys" min={100} max={30000} step={100} value={partLimit} onChange={setPartLimit} accent="#ff3c3c" />
                        <CfgSlider label="Burst Num" min={1} max={100} step={1} value={partCount} onChange={setPartCount} accent="#ff3c3c" />
                        <CfgSlider label="Size" min={0.1} max={5.0} step={0.1} value={partSize} onChange={setPartSize} accent="#ff3c3c" />
                        <CfgSlider label="Speed" min={0.1} max={3.0} step={0.1} value={partSpeed} onChange={setPartSpeed} accent="#ff3c3c" />
                        <CfgSlider label="Decay" min={0.80} max={0.99} step={0.01} value={partDecay} onChange={setPartDecay} accent="#ff3c3c" />
                        <CfgSlider label="Life" min={10} max={600} step={10} value={partLife} onChange={setPartLife} accent="#ff3c3c" />
                        <CfgSlider label="Falloff" min={0.0} max={0.01} step={0.0001} value={partFalloff} onChange={setPartFalloff} accent="#ff3c3c" />
                        <CfgSlider label="Chance" min={0.0} max={1.0} step={0.05} value={partChance} onChange={setPartChance} accent="#ff3c3c" />
                      </div>
                    )}
                  </div>
                  {/* Regen Block */}
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#4ade80', display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }}>
                      <span>TERRAIN REGEN</span>
                      <input type="checkbox" checked={showRaidRegen} onChange={e => setShowRaidRegen(e.target.checked)} />
                    </div>
                    {showRaidRegen && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <CfgSlider label="Regen Speed" min={0.001} max={0.1} step={0.001} value={regenSpeed} onChange={setRegenSpeed} accent="#4ade80" />
                        <CfgSlider label="Regen Delay" min={0} max={300} step={1} value={regenDelay} onChange={setRegenDelay} accent="#4ade80" />
                        <CfgSlider label="Target Ht" min={0.1} max={5.0} step={0.1} value={regenTarget} onChange={setRegenTarget} accent="#4ade80" />
                      </div>
                    )}
                  </div>
                </div>

                {/* WEAPON PARAMS */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#eab308', marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }}>WEAPON PAYLOAD CALIBRATION</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {selectedWeapon === 'scatter' && (
                      <>
                        <CfgSlider label="Radius" min={0} max={10} step={0.1} value={scatterRadius} onChange={setScatterRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={2} step={0.05} value={scatterDepth} onChange={setScatterDepth} accent="#eab308" />
                        <CfgSlider label="Projectiles" min={1} max={20} step={1} value={scatterProjectiles} onChange={setScatterProjectiles} accent="#eab308" />
                        <CfgSlider label="Spread" min={0} max={5} step={0.1} value={scatterSpread} onChange={setScatterSpread} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={60} step={1} value={scatterDelay} onChange={setScatterDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'artillery' && (
                      <>
                        <CfgSlider label="Radius" min={0} max={20} step={0.1} value={artilleryRadius} onChange={setArtilleryRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={5} step={0.1} value={artilleryDepth} onChange={setArtilleryDepth} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={100} step={1} value={artilleryDelay} onChange={setArtilleryDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'flyover' && (
                      <>
                        <CfgSlider label="Radius" min={0} max={15} step={0.1} value={flyoverRadius} onChange={setFlyoverRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={3} step={0.1} value={flyoverDepth} onChange={setFlyoverDepth} accent="#eab308" />
                        <CfgSlider label="Length" min={1} max={30} step={1} value={flyoverLength} onChange={setFlyoverLength} accent="#eab308" />
                        <CfgSlider label="Spacing" min={0.1} max={3} step={0.1} value={flyoverSpacing} onChange={setFlyoverSpacing} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={20} step={1} value={flyoverDelay} onChange={setFlyoverDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'laser' && (
                      <>
                        <CfgSlider label="Radius" min={0} max={5} step={0.1} value={laserRadius} onChange={setLaserRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={5} step={0.1} value={laserDepth} onChange={setLaserDepth} accent="#eab308" />
                        <CfgSlider label="Duration" min={1} max={100} step={1} value={laserDuration} onChange={setLaserDuration} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={10} step={1} value={laserDelay} onChange={setLaserDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'seismic' && (
                      <>
                        <CfgSlider label="Count" min={1} max={10} step={1} value={seismicCount} onChange={setSeismicCount} accent="#eab308" />
                        <CfgSlider label="Radius" min={0} max={20} step={0.1} value={seismicRadius} onChange={setSeismicRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={4} step={0.1} value={seismicDepth} onChange={setSeismicDepth} accent="#eab308" />
                        <CfgSlider label="Speed" min={0.1} max={2} step={0.1} value={seismicSpeed} onChange={setSeismicSpeed} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={20} step={1} value={seismicDelay} onChange={setSeismicDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'carpet' && (
                      <>
                        <CfgSlider label="Rows" min={1} max={10} step={1} value={carpetRows} onChange={setCarpetRows} accent="#eab308" />
                        <CfgSlider label="Cols" min={1} max={10} step={1} value={carpetCols} onChange={setCarpetCols} accent="#eab308" />
                        <CfgSlider label="Radius" min={0} max={10} step={0.1} value={carpetRadius} onChange={setCarpetRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={3} step={0.1} value={carpetDepth} onChange={setCarpetDepth} accent="#eab308" />
                        <CfgSlider label="Spacing" min={0.1} max={5} step={0.1} value={carpetSpacing} onChange={setCarpetSpacing} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={20} step={1} value={carpetDelay} onChange={setCarpetDelay} accent="#eab308" />
                      </>
                    )}
                    {selectedWeapon === 'blackhole' && (
                      <>
                        <CfgSlider label="Radius" min={0} max={30} step={0.1} value={blackholeRadius} onChange={setBlackholeRadius} accent="#eab308" />
                        <CfgSlider label="Depth" min={0} max={10} step={0.1} value={blackholeDepth} onChange={setBlackholeDepth} accent="#eab308" />
                        <CfgSlider label="Duration" min={1} max={200} step={1} value={blackholeDuration} onChange={setBlackholeDuration} accent="#eab308" />
                        <CfgSlider label="Delay" min={0} max={10} step={1} value={blackholeDelay} onChange={setBlackholeDelay} accent="#eab308" />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
`;

if (appleMenuBarStart !== -1 && hudStart !== -1) {
  content = content.substring(0, appleMenuBarStart) + originalModeAndRaid + '\n' + content.substring(hudStart);
} else {
  console.error("Could not find appleMenuBarStart or hudStart");
}

const hudEnd = content.indexOf('{/* ── Apple Dock (Shape Library) ──────────────────────── */}');
const inspectorStart = content.indexOf('{/* ── Apple Inspector Panel ─────────────────────────────────────────── */}');

const originalShapeLibrary = `        {/* ── Shape Library Panel — bottom of canvas ──────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: 20, pointerEvents: 'auto',
        }}>
          {/* Toggle handle */}
          <div
            onClick={() => setShapeLibraryOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 14px',
              background: 'rgba(4,6,18,0.88)', backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(167,139,250,0.18)',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 10, color: '#a78bfa', fontFamily: 'monospace', letterSpacing: 1.5, fontWeight: 700 }}>
              🧱 SHAPE LIBRARY
            </span>
            <span style={{
              fontSize: 9, color: '#334455', fontFamily: 'monospace',
              background: 'rgba(167,139,250,0.12)', padding: '1px 6px', borderRadius: 10,
              border: '1px solid rgba(167,139,250,0.2)',
            }}>
              {enabledShapes.size} / {SHAPE_LIBRARY.length} active
            </span>
            <span style={{ fontSize: 9, color: '#334455', marginLeft: 'auto', fontFamily: 'monospace' }}>
              {shapeLibraryOpen ? '▾ hide' : '▴ show'}
            </span>
          </div>

          {/* Shape cards row */}
          {shapeLibraryOpen && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '8px 10px',
              background: 'rgba(3,5,14,0.96)', backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.03)',
              overflowX: 'auto',
            }}>
              {/* Quick actions */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                paddingRight: 10, marginRight: 4,
                borderRight: '1px solid rgba(255,255,255,0.1)'
              }}>
                <button onClick={() => setEnabledShapes(new Set(ALL_SHAPE_IDS))} style={{ padding: '2px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', border: '1px solid #4ade80', background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>ALL</button>
                <button onClick={() => setEnabledShapes(new Set(DEFAULT_ENABLED_SHAPES))} style={{ padding: '2px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', border: '1px solid #fbbf24', background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>RESET</button>
              </div>

              {SHAPE_LIBRARY.map(shape => {
                const active = enabledShapes.has(shape.id);
                return (
                  <div
                    key={shape.id}
                    onClick={() => {
                      setEnabledShapes(prev => {
                        const next = new Set(prev);
                        if (next.has(shape.id)) { if (next.size > 1) next.delete(shape.id); } else { next.add(shape.id); }
                        return next;
                      });
                    }}
                    title={\`\${shape.label} — \${shape.desc}\`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '4px', borderRadius: 6, cursor: 'pointer',
                      border: active ? '1px solid #a78bfa' : '1px solid transparent',
                      background: active ? 'rgba(167,139,250,0.1)' : 'transparent',
                      minWidth: 44, transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{shape.icon}</span>
                    <span style={{ fontSize: 8, fontFamily: 'monospace', color: active ? '#a78bfa' : '#666' }}>{shape.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
`;

if (hudEnd !== -1 && inspectorStart !== -1) {
  content = content.substring(0, hudEnd) + originalShapeLibrary + '\n      ' + content.substring(inspectorStart);
} else {
  console.error("Could not find hudEnd or inspectorStart");
}

content = content.replace('{/* ── Apple Inspector Panel ─────────────────────────────────────────── */}', '{/* ── Inspector Panel ─────────────────────────────────────────── */}');

// Instead of string replacement for css class, we leave the index.css classes for the inspector as is (they are harmless and make the inspector look good).

fs.writeFileSync('/Users/uxmagicman/Desktop/optical_illusions/src/components/library/TerrainGenerator.tsx', content);
console.log("Successfully reverted TerrainGenerator.tsx");
