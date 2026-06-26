'use client';
import React from 'react';
import CosmicRenderer from '../engine/CosmicRenderer';
import TourRacingGameLayer from '../components/TourRacingGameLayer';
import { TourRacingTrailOverride } from '../components/TourRacingOverrides';
import { SOLAR_BODIES } from '../state/logic/SolarSystemData';
import { useCoordinateEngine } from '../state/components/CoordinateEngine';
import { useEnvironmentState } from '../state/context/EnvironmentStateContext';
import { useEnvironmentStore } from '../state/stores/EnvironmentStore';

export function ScreensaverTemplateView({ 
    screensaverTitleConfig,
    isUiHidden = false,
    audioConfig,
    isCinematicMode = true,
    isCmsMode = false,
    cmsActionButtons,
}: any) {
    const { state: coordState, worldToPhysics, physicsToWorld } = useCoordinateEngine();
    const { planetPrefs, setPlanetPrefs } = useEnvironmentState();
    const { flightGradientConfig } = useEnvironmentStore();

    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#020508", display: "flex" }}>
            <div id="cosmic-racers-game-container" style={{ flex: 1, position: "relative", background: "#000" }}>
                <CosmicRenderer 
                    solarBodies={SOLAR_BODIES} 
                    coordinateEngine={{state: coordState, worldToPhysics, physicsToWorld}} 
                    environmentState={{planetPrefs, setPlanetPrefs}} 
                    isCmsMode={isCmsMode}
                    isCinematicMode={isCinematicMode} 
                    isUiHidden={isUiHidden}
                    audioConfig={audioConfig} 
                    hidePreferences={true}
                    isPlanetSystem={false}
                    flightGradientConfig={flightGradientConfig} 
                    screensaverTitleConfig={screensaverTitleConfig}
                    trailSystemOverride={TourRacingTrailOverride}
                    configNamespace="screensaver_config"
                />
                
                <TourRacingGameLayer 
                    isCinematicMode={isCinematicMode} 
                    flightGradientConfig={flightGradientConfig} 
                    audioConfig={audioConfig} 
                    configNamespace="screensaver_config"
                    hideMenu={true}
                    showScreensaverMenu={true}
                    isUiHidden={isUiHidden}
                    cmsActionButtons={cmsActionButtons}
                />
            </div>
        </div>
    );
}

export default ScreensaverTemplateView;
