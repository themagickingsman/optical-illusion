import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_PLANET_PREFS = {
    zoomSpeed: 0.010,
    zoomInertia: 0.10,
    fleetClickZoom: 2.5,
    mapOpenSpeed: 0.005,
    mapCloseSpeed: 0.06,
    mapOpenDistance: 0.002,
    dragSpeed: 1.0,
    inertia: 0.92,
    panDensity: 0.15,
    planetScale: 1.0,
    planetBaseScale: 1.0,
    planetResolution: 32,
    orbitOpacity: 1.0,
    orbitSize: 1.0,
    orbitScale: 1.0,
    orbitColor: '#ffffff',
    radiusCurve: 0.65,
    distanceCurve: 0.82,
    labelSize: 14,
    labelOffsetY: 25,
    fxParticleCount: 200,
    fxParticleSize: 30,
    fxParticleMinSize: 10,
    fxParticleMaxSize: 50,
    fxParticleSpeed: 0.1,
    fxParallaxStrength: 0.05,
    fxStarOpacity: 1.0,
    fgParticleCount: 100,
    fgParticleMinSize: 40,
    fgParticleMaxSize: 120,
    fgParticleSpeed: 0.15,
    fgParallaxStrength: 0.1,
    fgStarOpacity: 1.0,
    bgStarDensity: 5000,
    bgStarSpeed: 0.05,
    bgStarSize: 15,
    bgStarMinSize: 5,
    bgStarMaxSize: 25,
    bgParallaxStrength: 0.01,
    bgStarOpacity: 1.0,
    streakMultiplier: 1.0,
    streakTailFade: 0.8,
    asteroidsEnabled: true,
    asteroidDensity: 200,
    asteroidSpeed: 1.0,
    asteroidScale: 1.0,
    asteroidRotationSpeed: 1.0,
    asteroidPattern: 'random' as 'random' | 'orbital',
    asteroidRingRadius: 300
};

interface EnvironmentState {
    planetPrefs: typeof DEFAULT_PLANET_PREFS;
    setPlanetPrefs: React.Dispatch<React.SetStateAction<typeof DEFAULT_PLANET_PREFS>>;
}

const EnvironmentStateContext = createContext<EnvironmentState | null>(null);

export function EnvironmentStateProvider({ children }: { children: React.ReactNode }) {
    const [planetPrefs, setPlanetPrefs] = useState(DEFAULT_PLANET_PREFS);
    const [loaded, setLoaded] = useState(false);

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
                if (data && data.planet_prefs_state) {
                    setPlanetPrefs(data.planet_prefs_state);
                }
                setLoaded(true);
            })
            .catch(err => {
                console.error("EnvironmentStateContext config fetch failed:", err);
                setLoaded(true);
            });
    }, []);



    return (
        <EnvironmentStateContext.Provider value={{ planetPrefs, setPlanetPrefs }}>
            {children}
        </EnvironmentStateContext.Provider>
    );
}

export function useEnvironmentState() {
    const ctx = useContext(EnvironmentStateContext);
    if (!ctx) throw new Error("useEnvironmentState must be used within an EnvironmentStateProvider");
    return ctx;
}
