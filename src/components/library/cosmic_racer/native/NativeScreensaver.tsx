"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import engine and providers from our Component Library
import { CosmicEngineProvider } from './state/logic/CosmicEngineProvider';
import { EnvironmentStoreProvider } from './state/stores/EnvironmentStore';
import { useCoordinateEngine } from './state/components/CoordinateEngine';
import { useEnvironmentState } from './state/context/EnvironmentStateContext';
import { SOLAR_BODIES } from './state/logic/SolarSystemData';

// Dynamically load the WebGL renderer and website layer
const CosmicRenderer = dynamic(() => import('./engine/CosmicRenderer'), { ssr: false });
const TourRacingGameLayer = dynamic(() => import('./components/TourRacingGameLayer'), { ssr: false });

function EngineConnector({ onReady }: { onReady?: () => void }) {
    const coordinateEngine = useCoordinateEngine();
    const environmentState = useEnvironmentState();

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <CosmicRenderer
                initialActiveMode="screensaver"
                isCmsMode={false}
                isPlanetSystem={false}
                isCinematicMode={true}
                isUiHidden={false}
                hidePreferences={true}
                coordinateEngine={coordinateEngine}
                environmentState={environmentState}
                solarBodies={SOLAR_BODIES}
                configNamespace="tour_racing_prefs"
                onReady={onReady}
            />
            <TourRacingGameLayer 
                configNamespace="tour_racing_prefs"
                mode="screensaver"
                hideMenu={true}
                showScreensaverMenu={true}
                isCinematicMode={true}
                isUiHidden={false}
            />
        </div>
    );
}

export default function NativeScreensaver({ onReady }: { onReady?: () => void }) {
    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
            <EnvironmentStoreProvider>
                <CosmicEngineProvider initialMode="screensaver">
                    <EngineConnector onReady={onReady} />
                </CosmicEngineProvider>
            </EnvironmentStoreProvider>
        </div>
    );
}
