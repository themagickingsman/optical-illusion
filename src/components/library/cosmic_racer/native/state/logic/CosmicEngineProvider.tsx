import React from 'react';
import { SolarSystemProvider } from '../../state/logic/SolarSystemContext';
import { CoordinateEngineProvider } from '../../state/components/CoordinateEngine';
import { FlightStateProvider } from '../../state/context/FlightStateContext';
import { EnvironmentStateProvider } from '../../state/context/EnvironmentStateContext';
import { EnvironmentStoreProvider } from '../../state/stores/EnvironmentStore';

interface CosmicEngineProviderProps {
  children: React.ReactNode;
  initialMode?: 'LEGACY' | 'COMPASS';
}

export function CosmicEngineProvider({ children, initialMode = 'COMPASS' }: CosmicEngineProviderProps) {
  return (
    <SolarSystemProvider initialMode={initialMode}>
       <CoordinateEngineProvider>
          <FlightStateProvider>
             <EnvironmentStateProvider>
                <EnvironmentStoreProvider>
                   {children}
                </EnvironmentStoreProvider>
             </EnvironmentStateProvider>
          </FlightStateProvider>
       </CoordinateEngineProvider>
    </SolarSystemProvider>
  );
}
