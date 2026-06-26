import React, { createContext, useContext, useState, useEffect } from 'react';
import { hydrateGameShips, setGlobalDbState } from '../game-assets/ships';
import { getShipAssetUrl } from '../../config/ship_assets';


export const BASE_DEFAULT_PARAMS = {
  maxSpeed: 0.08,
  acceleration: 0.0008,
  driftFriction: 0.990,
  corneringDrift: 0.0,
  retroBrake: 2.0,
  turnSpeed: 0.014,
  maxBankDeg: 43,
  tiltSpeed: 0.04,
  modelScale: 0.1,
  planeSize: 0.2,
  modelPitch: 0,
  modelY: 0.3,
  texScaleX: 1.0,
  texScaleY: 1.0,
  texOffsetX: 0,
  texOffsetY: 0,
  texRotation: 0,
  showColorMap: true,
  showAlphaMap: true,
  showBumpMap: true,
  alphaTest: 0.05,
  texContrast: 1.0,
  texLuminance: 1.0,
  bumpScale: 1.0,
  ambientLight: 0.4,
  sunX: 20,
  showGrid: false,
  autoPilot: false,
  cruiseMode: false,
  sunY: 40,
  sunZ: 20,
  cameraAngle: 'top',
  cinematicZoomScale: 0.68,
  cinematicZoomSpeed: 0.005,
  starSize: 2.0,
  starOpacity: 0.8,
  starParallax: 0.5,
  starCount: 1500,
  starDistance: 400,
  starSpeed: 1.0,
  shadowOpacity: 0.6,
  shadowSize: 1.0,
  ambHex: '#334466',
  sunHex: '#ffc87a',
  edgeThreshold: 0.35,
  edgeIntensity: 1.0,
  rimHex: '#ff6600',
  edgeHex: '#1a99ff',
  bankSquashAmount: 0.25,
  bankSquashSpeed: 0.05,
  underbellyOffset: 2.0,
  underbellyDarkness: 0.2,
  showNodes: true,
  trailSize: 0.3,
  trailOpacity: 0.8,
  trailSpread: 0.4,
  trailWidth: 2.5,
  trailLength: 400,
  trailFalloff: 0.5,
  trailColor: '#ffffff',
  navLightsX: 0.0,
  navLightsY: -62.0,
  navLightsSpread: 85.0,
  specularIntensity: 2.0,
  specularShininess: 110.0,
  specularAnisotropy: 0.85,
  centerSpecularIntensity: 1.5,
  centerSpecularWidth: 0.12,
  centerSpecularFalloff: 0.02,
  centerSpecularShininess: 110.0,
  centerSpecularAnisotropy: 0.1,
  shineStretch: 0.2,
  shineWidth: 0.1,
  shineIntensity: 1.5,
  globalShadowThreshold: 0.05,
  globalShadowSmoothness: 0.35,
  globalShadowOpacity: 0.85,
  globalShadowColor: '#0a1024',
  spotLightIntensity: 1.5,
  spotLightSize: 0.5,
  spotLightFalloff: 0.2,
  spotLightHex: '#ffffff',
  spotLightX: 0.0,
  spotLightY: -0.4,
  motionOpacity: 0.8,
  motionIntensity: 2.0,
  motionFalloff: 0.05,
  motionSpeed: 0.05,
  motionRotation: 0.0,
  motionFrequency: 15.0,
  motionWidth: 0.1,
  motionHex: '#00ffff',
  auraOpacity: 1.0,
  auraScaleX: 1.0,
  auraScaleY: 1.0,
  auraBlur: 0.5,
  auraHex: '#1a44ff',
};

interface FlightState {
  params: typeof BASE_DEFAULT_PARAMS;
  setParams: React.Dispatch<React.SetStateAction<typeof BASE_DEFAULT_PARAMS>>;
  activeShipId: string;
  setActiveShipId: React.Dispatch<React.SetStateAction<string>>;
  ships: any[];
}

const FlightStateContext = createContext<FlightState | null>(null);

export function FlightStateProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState(BASE_DEFAULT_PARAMS);
  const [loaded, setLoaded] = useState(false);

  const [ships, setShips] = useState<any[]>([]);
  const [activeShipId, setActiveShipId] = useState<string>('');

  const loadShips = () => {
    const s = hydrateGameShips();
    return s.filter((ship: any) => !!ship.imagePath).map((ship: any) => ({
        ...ship,
        colorUrl: getShipAssetUrl(ship.id, 'color'),
        alphaUrl: getShipAssetUrl(ship.id, 'alpha'),
        bumpUrl: getShipAssetUrl(ship.id, 'bump'),
    }));
  };

  // Sync state cleanly globally via DB config
  useEffect(() => {
    const isScreensaverTarget = process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
    const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
    const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
    const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

    let configUrl = '/game_assets/data/game_config.json';
    if (isLocalScheme) {
        if (window.location.pathname.includes('/builds/')) {
            configUrl = '../game_assets/data/game_config.json';
        } else {
            configUrl = './game_assets/data/game_config.json';
        }
    } else if (!isStandaloneMode) {
        configUrl = '/api/game-assets/config';
    }

    fetch(configUrl)
      .then(r => r.json())
      .then(db => {
        const data = db.success ? db.data : db;
        if (data) {
          setGlobalDbState(data);
          if (data.shipbank_state) {
            setParams(data.shipbank_state);
          }
          const loadedShips = loadShips();
          setShips(loadedShips);
          
          const leadShipId = data.rosterLead || data.lastEditedShip || (loadedShips.length > 0 ? loadedShips[0].id : '');
          if (leadShipId) {
            setActiveShipId(leadShipId);
          }
        }
        setLoaded(true);
      })
      .catch(err => {
        console.error("FlightStateContext config fetch failed:", err);
        setLoaded(true);
      });
  }, []);

  // Removed autosave POST to /api/game-assets/config to prevent resetting master configuration with default context values.

  useEffect(() => {
    setShips(loadShips());
    
    const handleThumbUpdate = () => setShips(loadShips());
    window.addEventListener('ship-thumbnail-update', handleThumbUpdate);
    return () => window.removeEventListener('ship-thumbnail-update', handleThumbUpdate);
  }, []);

  return (
    <FlightStateContext.Provider value={{ params, setParams, activeShipId, setActiveShipId, ships }}>
      {children}
    </FlightStateContext.Provider>
  );
}

export function useFlightState() {
  const ctx = useContext(FlightStateContext);
  if (!ctx) throw new Error("useFlightState must be used within FlightStateProvider");
  return ctx;
}
