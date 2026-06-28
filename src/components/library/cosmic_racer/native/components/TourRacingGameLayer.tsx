import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_SCREENSAVER_SETTINGS } from '../config/defaultScreensaverParams';

const RangeWithArrows = ({ value, defaultValue, onChange, min, max, step, style, type, ...props }: any) => {
  const stepVal = parseFloat(step) || 1;
  const pVal = parseFloat(value);
  const pDef = parseFloat(defaultValue);
  const currentVal = !isNaN(pVal) ? pVal : (!isNaN(pDef) ? pDef : 0);
  
  const [localStr, setLocalStr] = React.useState(currentVal.toString());
  
  const valueRef = React.useRef(currentVal);
  React.useEffect(() => {
    valueRef.current = currentVal;
    if (parseFloat(localStr) !== currentVal && !localStr.endsWith('.')) {
        setLocalStr(currentVal.toString());
    }
  }, [currentVal]);

  const timeoutRef = React.useRef<any>(null);
  const intervalRef = React.useRef<any>(null);

  const doStep = (dir: number) => {
    const val = valueRef.current;
    const minVal = min !== undefined ? parseFloat(min) : -Infinity;
    const maxVal = max !== undefined ? parseFloat(max) : Infinity;
    const newVal = Math.max(minVal, Math.min(maxVal, val + (stepVal * dir)));
    const decimals = step ? (step.toString().split('.')[1] || '').length : 0;
    const formatted = parseFloat(newVal.toFixed(decimals));
    valueRef.current = formatted; // optimistic update
    setLocalStr(formatted.toString());
    if (onChange) onChange({ target: { value: formatted.toString() } });
  };

  const startHold = (dir: number, e: any) => {
    e.preventDefault();
    doStep(dir);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        doStep(dir);
      }, 50);
    }, 300);
  };

  const stopHold = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  };

  React.useEffect(() => {
    return () => stopHold();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: style?.width || '100%' }}>
      <style>{`
        .no-spinners::-webkit-inner-spin-button, 
        .no-spinners::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        .no-spinners {
          -moz-appearance: textfield;
        }
      `}</style>
      <button 
        onMouseDown={(e) => startHold(-1, e)} 
        onMouseUp={stopHold} 
        onMouseLeave={stopHold}
        onTouchStart={(e) => startHold(-1, e)}
        onTouchEnd={stopHold}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#aaa', cursor: 'pointer', padding: '2px 8px', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >◀</button>
      
      <input 
        type="text" 
        inputMode="decimal"
        className="no-spinners"
        value={localStr} 
        defaultValue={defaultValue} 
        onChange={(e) => {
            setLocalStr(e.target.value);
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed) && onChange) {
                onChange({ target: { value: e.target.value } });
            }
        }}
        min={min} 
        max={max} 
        step={step} 
        style={{ flex: 1, background: 'rgba(10,15,30,0.6)', color: style?.accentColor || '#38bdf8', border: `1px solid ${style?.accentColor || 'rgba(255,255,255,0.1)'}`, borderRadius: 4, padding: '2px 4px', textAlign: 'center', fontSize: 11, backdropFilter: 'blur(4px)', boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 5px ${style?.accentColor ? style.accentColor + '40' : 'rgba(56,189,248,0.2)'}`, transition: 'all 0.2s ease', ...style, accentColor: undefined }} 
        {...props} 
      />
      
      <button 
        onMouseDown={(e) => startHold(1, e)} 
        onMouseUp={stopHold} 
        onMouseLeave={stopHold}
        onTouchStart={(e) => startHold(1, e)}
        onTouchEnd={stopHold}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#aaa', cursor: 'pointer', padding: '2px 8px', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >▶</button>
    </div>
  );
};

export default function TourRacingGameLayer({ isCinematicMode, flightGradientConfig, audioConfig: audioConfigProp, configNamespace, hideMenu, showScreensaverMenu, isUiHidden, saveToGame, cmsActionButtons }: any) {
    const [params, setParams] = useState<any>({
        autoPilot: false,
        cruiseMode: false,
        autoTour: true,
        cinematicBehavior: 'random',
        cinematicCloseZoom: 0.8,
        cinematicWideZoom: 0.4,
        cinematicRandomMinZoom: 0.3,
        cinematicRandomMaxZoom: 1.5,
        cinematicZoomSpeed: 0.005,
        uiFadeDelay: 3.0,
        letterboxEnabled: false,
        // Optional Trail Configs to surface
        trailMountY: -2.0,
        trailWidth: 2.0,
        trailSize: 0.5,
        trailOpacity: 0.5,
        trailSpread: 0.5,
        trailFalloff: 0.2,
        trailLength: 400,
        trailColor: '#facc15',
        engineParticleCycleSpeed: 1.0,
        engineParticleColor1: '#ff0055',
        engineParticleColor2: '#00ffaa',
        engineParticleColor3: '#0088ff',
        // Planetary Atmospheres
        glow1Size: 3.0,
        glow2Size: 0.55,
        glow3Size: 1.2,
        // Star Layers
        bgStarSpeed: 0.05, bgStarDensity: 5000, bgStarOpacity: 1.0, bgStarMinSize: 5, bgStarMaxSize: 15, bgParallaxStrength: 1.0,
        fxStarSpeed: 0.05, fxStarDensity: 200, fxStarOpacity: 1.0, fxStarMinSize: 15, fxStarMaxSize: 30, fxParallaxStrength: 1.0,
        fgStarSpeed: 0.05, fgStarDensity: 100, fgStarOpacity: 1.0, fgStarMinSize: 40, fgStarMaxSize: 80, fgParallaxStrength: 1.0
    });

    const [audioConfig, setAudioConfig] = useState<any>(audioConfigProp);
    
    // Sync when parent prop changes
    useEffect(() => {
        if (audioConfigProp) {
            setAudioConfig(audioConfigProp);
        }
    }, [audioConfigProp]);

    const [isMinimized, setIsMinimized] = useState(true);
    const [isEngineInitializing, setIsEngineInitializing] = useState(true);
    // Tracks which ship the user has focused in the Hangar for the per-ship FX color picker
    const [focusedShip, setFocusedShip] = useState<{ shipId: string; shipName: string; fxColor: string } | null>(null);
    // Prevents the menu from closing while the native OS color picker is open
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    
    // NEW: Native DOM ref for the Fullscreen button to bypass React Synthetic Events
    const fsBtnRef = useRef<HTMLButtonElement>(null);

    const [showFeatures, setShowFeatures] = useState(false);
    const [activeTheme, setActiveTheme] = useState<'game' | 'demo' | 'website'>('game');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleFeaturesState = (e: any) => {
            if (e.detail) {
                setShowFeatures(e.detail.showFeatures);
            }
        };
        window.addEventListener('arn_features_state', handleFeaturesState);
        // Request the initial features state in case CosmicRenderer is already mounted
        window.dispatchEvent(new Event('arn_request_features_state'));
        return () => {
            window.removeEventListener('arn_features_state', handleFeaturesState);
        };
    }, []);

    const [isCinematicActive, setIsCinematicActive] = useState(false);
    useEffect(() => {
        const handler = (e: any) => setIsCinematicActive(e.detail);
        window.addEventListener('arn_cinematic_mode_change', handler);
        return () => window.removeEventListener('arn_cinematic_mode_change', handler);
    }, []);

    useEffect(() => {
        const initCheck = setInterval(() => {
            const isLoadingOverlay = document.querySelector('div[style*="z-index: 9999999"]');
            setIsEngineInitializing(isLoadingOverlay !== null);

        }, 500);
        return () => clearInterval(initCheck);
    }, []);

    useEffect(() => {
        const loadInitialConfig = async () => {
            try {
                const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
                const isPort3001 = typeof window !== 'undefined' && window.location.port === '3001';
                const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
                const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
                const isStandaloneMode = (isScreensaverTarget || isPort3006 || isLocalScheme) && !isPort3001;
                
                let configUrl = '/game_assets/data/game_config.json';
                if (isLocalScheme && window.location.pathname.includes('/builds/')) {
                    configUrl = '../game_assets/data/game_config.json';
                }

                let db: any = {};
                try {
                    if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.loadConfig) {
                        db = await (window as any).electronAPI.loadConfig();
                    } else {
                        const res = await fetch(configUrl, { cache: 'no-store' });
                        db = await res.json();
                    }
                } catch (err) {
                    console.warn("[TourRacingGameLayer] fetch failed, using fallback", err);
                    db = {
                        success: true,
                        data: {
                            screensaver_config: DEFAULT_SCREENSAVER_SETTINGS,
                            website_config: DEFAULT_SCREENSAVER_SETTINGS,
                            tour_racing_prefs: DEFAULT_SCREENSAVER_SETTINGS
                        }
                    };
                }
                
                // If it booted from the Absolute Zero Fallback, unwrap the safe skeleton
                if (db && db.success && db.data) {
                    db = db.data;
                }
                
                const dynamicNamespace = activeTheme === 'game' ? (configNamespace || 'tour_racing_prefs') : activeTheme === 'demo' ? 'screensaver_config' : 'website_config';
                const targetKey = dynamicNamespace;
                
                console.log(`[TourRacingGameLayer] Fetched initial config for: ${targetKey} (Theme: ${activeTheme})`, db[targetKey]);
                
                if (db && db[targetKey]) {
                    setParams((p: any) => ({ ...p, ...db[targetKey] }));
                } else if (db && db.screensaver && targetKey === 'screensaver_config') {
                    setParams((p: any) => ({ ...p, ...db.screensaver }));
                }

                if (db && (db.audio || db.soundAssignments)) {
                    setAudioConfig(db.audio || db.soundAssignments);
                }
            } catch (e) {
                console.warn("TourRacingGameLayer failed to load initial config", e);
            }
        };
        loadInitialConfig();
    }, [configNamespace, activeTheme]);

    useEffect(() => {
        const handleStateUpdate = (e: any) => {
            setParams(e.detail);
        };
        window.addEventListener('arn_shipbank_state_updated', handleStateUpdate);

        return () => {
            window.removeEventListener('arn_shipbank_state_updated', handleStateUpdate);
        };
    }, []);

    // Track focused ship for the FX color picker (fired by CosmicRenderer when user clicks a ship in Hangar)
    useEffect(() => {
        const handleShipFocused = (e: any) => {
            if (e.detail) setFocusedShip(e.detail);
        };
        window.addEventListener('arn_ship_focused', handleShipFocused);
        return () => window.removeEventListener('arn_ship_focused', handleShipFocused);
    }, []);

    const updateParam = (key: string, rawValue: any) => {
        let value = rawValue;
        if (typeof value === 'number' && Number.isNaN(value)) return;
        
        // CRITICAL BOUNDARY ENFORCEMENT: Prevent downstream crash/overshoot bugs in the engine
        if (key === 'cinematicZoomSpeed') {
            value = Math.min(0.01, Math.max(0.0001, value)); // Hard clamp to prevent timeScalar explosion!
        }
        if (key === 'cinematicRandomMinZoom' || key === 'cinematicRandomMaxZoom' || key === 'cinematicCloseZoom' || key === 'cinematicWideZoom') {
            value = Math.min(50.0, Math.max(0.001, value));
        }

        setParams((p: any) => {
            const next = { ...p, [key]: value };
            
            const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
            const isPort3001 = typeof window !== 'undefined' && window.location.port === '3001';
            const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
            const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
            const isStandaloneMode = (isScreensaverTarget || isPort3006 || isLocalScheme) && !isPort3001;
            
            if (!isStandaloneMode) {
                if ((window as any)._saveTimeout) clearTimeout((window as any)._saveTimeout);
                (window as any)._saveTimeout = setTimeout(() => {
                    const dynamicNamespace = activeTheme === 'game' ? (configNamespace || 'tour_racing_prefs') : activeTheme === 'demo' ? 'screensaver_config' : 'website_config';
                    // fetch('/api/game-assets/config/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [dynamicNamespace]: next }) }).catch(console.error);
                }, 500);
            } else if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.saveConfig) {
                if ((window as any)._saveTimeout) clearTimeout((window as any)._saveTimeout);
                (window as any)._saveTimeout = setTimeout(() => {
                    const dynamicNamespace = activeTheme === 'game' ? (configNamespace || 'tour_racing_prefs') : activeTheme === 'demo' ? 'screensaver_config' : 'website_config';
                    (window as any).electronAPI.saveConfig(dynamicNamespace, next);
                }, 500);
            }
            return next;
        });
        
        // Dispatch explicit event for ShipBankDemo glow system dynamically!
        if (key === 'glow1Size' || key === 'glow2Size' || key === 'glow3Size') {
            window.dispatchEvent(new CustomEvent('arn_sun_env_config', { detail: { [key]: value } }));
        }

        window.dispatchEvent(new CustomEvent('arn_shipbank_update', { detail: { [key]: value } }));
    };

    const updateMultipleParams = (newParams: any) => {
        setParams((p: any) => {
            const next = { ...p, ...newParams };
            
            const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
            const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
            const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
            const isPort3001 = typeof window !== 'undefined' && window.location.port === '3001';
            const isStandaloneMode = (isScreensaverTarget || isPort3006 || isLocalScheme) && !isPort3001;
            
            if (!isStandaloneMode) {
                if ((window as any)._saveTimeout) clearTimeout((window as any)._saveTimeout);
                (window as any)._saveTimeout = setTimeout(() => {
                    const dynamicNamespace = activeTheme === 'game' ? (configNamespace || 'tour_racing_prefs') : activeTheme === 'demo' ? 'screensaver_config' : 'website_config';
                    // fetch('/api/game-assets/config/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [dynamicNamespace]: next }) }).catch(console.error);
                }, 500);
            } else if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.saveConfig) {
                if ((window as any)._saveTimeout) clearTimeout((window as any)._saveTimeout);
                (window as any)._saveTimeout = setTimeout(() => {
                    const dynamicNamespace = activeTheme === 'game' ? (configNamespace || 'tour_racing_prefs') : activeTheme === 'demo' ? 'screensaver_config' : 'website_config';
                    (window as any).electronAPI.saveConfig(dynamicNamespace, next);
                }, 500);
            }
            return next;
        });
        window.dispatchEvent(new CustomEvent('arn_shipbank_update', { detail: newParams }));
    };

    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 4999, pointerEvents: "none" }}>
            
            {/* SAFE CSS OVERRIDES FOR UI LAYER (DOES NOT TOUCH ENGINE) */}
            <style>{`
                /* 1. Move Map & News buttons right */
                div[style*="bottom: 20px"][style*="right: 20px"][style*="z-index: 2000"] {
                    right: 20px !important;
                }
                
                body.theme-website #cosmic-speedometer-container {
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
            `}</style>
            
            {/* SPEEDOMETER & TOTAL KMS (MOVED TO COSMIC RENDERER) */}

            {/* SPEEDOMETER & TOTAL KMS (MOVED TO COSMIC RENDERER) */}

            {/* FULLSCREEN / CINEMATIC TOGGLE */}
            <button 
                    id="game-fullscreen-btn"
                    onClick={() => {
                        try {
                            const doc = document as any;
                            const targetEl = document.getElementById('cosmic-racers-game-container') || document.documentElement as any;
                            if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                                if (targetEl?.requestFullscreen) targetEl.requestFullscreen();
                                else if (targetEl?.webkitRequestFullscreen) targetEl.webkitRequestFullscreen();
                                else if (targetEl?.msRequestFullscreen) targetEl.msRequestFullscreen();
                            } else {
                                if (doc.exitFullscreen) doc.exitFullscreen();
                                else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
                                else if (doc.msExitFullscreen) doc.msExitFullscreen();
                            }
                        } catch (err) {
                            console.error("Fullscreen error:", err);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                        zIndex: 4990,
                        pointerEvents: (isUiHidden || isCinematicActive) ? 'none' : 'auto',
                        opacity: (isUiHidden || isCinematicActive) ? 0 : 1,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    title="Fullscreen"
                >
                    ⛶
                </button>

            {/* SCREENSAVER SETTINGS — gear button (standalone, matches fullscreen) */}
            {showScreensaverMenu && (
                <button
                    onClick={() => setIsMinimized(prev => !prev)}
                    style={{
                        position: 'absolute', top: 20, right: 62,
                        background: isMinimized ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, zIndex: 4991,
                        pointerEvents: (isUiHidden || isCinematicActive) ? 'none' : 'auto',
                        opacity: (isUiHidden || isCinematicActive) ? 0 : 1,
                        backdropFilter: 'blur(10px)', transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isMinimized ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                    title="Screensaver Settings"
                >
                    ⚙
                </button>
            )}

            {/* SCREENSAVER SETTINGS — panel (drops below gear button) */}
            {showScreensaverMenu && !isMinimized && (
                <div style={{ position: 'absolute', top: 62, right: 20, width: 300, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', zIndex: 4990, pointerEvents: (isUiHidden || isCinematicActive) ? 'none' : 'auto', opacity: (isUiHidden || isCinematicActive) ? 0 : 1, transition: 'opacity 0.3s ease', background: 'rgba(10, 15, 30, 0.75)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, backdropFilter: 'blur(20px) saturate(150%)', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 }}>
                                    {configNamespace === 'tour_racing_prefs' ? 'TOUR RACING' : 'SCREENSAVER'}
                                </span>
                                <button onClick={() => setIsMinimized(true)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }} title="Close">×</button>
                            </div>

                            {/* FLIGHT MODE */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>FLIGHT MODE</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => updateMultipleParams({ autoPilot: !params.autoPilot, cruiseMode: false, autoTour: false })}
                                        style={{ flex: 1, background: params.autoPilot ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)', color: params.autoPilot ? '#fff' : 'rgba(255,255,255,0.4)', border: '1px solid ' + (params.autoPilot ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'), padding: '6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', fontWeight: params.autoPilot ? 'bold' : 'normal' }}>Donut</button>
                                    <button onClick={() => updateMultipleParams({ cruiseMode: !params.cruiseMode, autoPilot: false, autoTour: false })}
                                        style={{ flex: 1, background: params.cruiseMode ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)', color: params.cruiseMode ? '#fff' : 'rgba(255,255,255,0.4)', border: '1px solid ' + (params.cruiseMode ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'), padding: '6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', fontWeight: params.cruiseMode ? 'bold' : 'normal' }}>Cruise</button>
                                    <button onClick={() => updateMultipleParams({ autoTour: !params.autoTour, cruiseMode: false, autoPilot: false })}
                                        style={{ flex: 1, background: params.autoTour ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)', color: params.autoTour ? '#fff' : 'rgba(255,255,255,0.4)', border: '1px solid ' + (params.autoTour ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'), padding: '6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', fontWeight: params.autoTour ? 'bold' : 'normal' }}>Tour</button>
                                </div>
                            </div>

                            {/* CAMERA MODE */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>CAMERA MODE</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['close_up', 'wide_shot', 'random'] as const).map(tab => {
                                        const isActive = ((params as any).cinematicBehavior || 'close_up') === tab;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => updateParam('cinematicBehavior', tab)}
                                                style={{
                                                    flex: 1, padding: '6px 0', fontSize: '10px', cursor: 'pointer',
                                                    textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace',
                                                    background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
                                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                                    border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'),
                                                    borderRadius: 6, fontWeight: isActive ? 'bold' : 'normal',
                                                    backdropFilter: 'blur(10px)', transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {tab.replace('_', ' ')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* MASTER VOLUME */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#fff', fontSize: 11 }}>Master Volume</span>
                                    <span style={{ color: '#FF8820', fontSize: 11 }}>{audioConfig?.masterVolume?.toFixed(2) ?? '0.50'}</span>
                                </div>
                                <style>{`
                                    .custom-vol-range::-webkit-slider-thumb {
                                        -webkit-appearance: none;
                                        appearance: none;
                                        width: 14px;
                                        height: 14px;
                                        border-radius: 50%;
                                        background: #FF8820;
                                        box-shadow: 0 0 10px rgba(255, 136, 32, 0.8);
                                        cursor: pointer;
                                        transition: transform 0.1s;
                                    }
                                    .custom-vol-range::-webkit-slider-thumb:hover {
                                        transform: scale(1.2);
                                    }
                                `}</style>
                                    <input 
                                        type="range" min="0" max="1" step="0.05" 
                                        className="custom-vol-range"
                                        value={audioConfig?.masterVolume ?? 0.5} 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setAudioConfig((prev: any) => ({ ...prev, masterVolume: val }));
                                            window.dispatchEvent(new CustomEvent('arn_audio_update', { detail: { masterVolume: val } }));
                                            
                                            const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
                                            const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.port === '3009' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
                                            const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
                                            const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

                                            if (!isStandaloneMode) {
                                                if ((window as any)._audioSaveTimeout) clearTimeout((window as any)._audioSaveTimeout);
                                                (window as any)._audioSaveTimeout = setTimeout(() => {
                                                    // fetch('/api/game-assets/config/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: { ...audioConfig, masterVolume: val } }) }).catch(console.error);
                                                }, 500);
                                            }
                                        }}
                                        style={{ width: '100%', cursor: 'pointer', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', appearance: 'none', outline: 'none' }}
                                    />
                            </div>

                            {/* IDLE TIME (uiFadeDelay) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>IDLE TIME</span>
                                    <span style={{ color: '#fff', fontSize: 10, fontFamily: 'monospace' }}>{((params as any).uiFadeDelay ?? 3.0).toFixed(1)}s</span>
                                </div>
                                <input
                                    type="range" min="1.0" max="30.0" step="0.5"
                                    value={(params as any).uiFadeDelay ?? 3.0}
                                    onChange={(e) => updateParam('uiFadeDelay', parseFloat(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', appearance: 'none', outline: 'none', accentColor: '#fff' }}
                                />
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Time before auto-tour activates</div>
                            </div>


                            {/* SAVE TO CMS BUTTON */}
                            {saveToGame && (
                                <button 
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        const originalText = btn.innerText;
                                        btn.innerText = 'SAVING...';
                                        try {
                                            // 1. Save to central JSON first (triggers auto-sync to 3006)
                                            await fetch('/api/game-assets/config', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ [configNamespace || 'screensaver_config']: params })
                                            });
                                            // 2. Keep original functionality
                                            saveToGame();
                                            
                                            btn.innerText = '✓ SYNCED';
                                            btn.style.borderColor = '#4ade80';
                                            btn.style.color = '#4ade80';
                                        } catch (err) {
                                            console.error(err);
                                            btn.innerText = 'ERROR SAVING';
                                            btn.style.borderColor = '#f87171';
                                            btn.style.color = '#f87171';
                                        }
                                        setTimeout(() => {
                                            btn.innerText = originalText;
                                            btn.style.borderColor = "rgba(16,185,129,0.5)";
                                            btn.style.color = "#10b981";
                                        }, 2500);
                                    }} 
                                    style={{ padding: 12, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.5)", color: "#10b981", fontWeight: "bold", borderRadius: 8, cursor: "pointer", fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.4)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(16,185,129,0.3)"; e.currentTarget.style.transform = "scale(1.02)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.2)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "scale(1)"; }}>
                                    💾 Save to CMS
                                </button>
                            )}


                </div>
            )}


        </div>
    );
}
