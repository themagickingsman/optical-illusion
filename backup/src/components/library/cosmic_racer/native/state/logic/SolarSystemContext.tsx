"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildAllOctaves, OctaveBody } from './SolarSystemData';

interface SolarSystemContextType {
    solarBodies: OctaveBody[];
    currentMode: 'LEGACY' | 'COMPASS';
    setMode: (mode: 'LEGACY' | 'COMPASS') => void;
}

const SolarSystemContext = createContext<SolarSystemContextType>({
    solarBodies: [],
    currentMode: 'LEGACY',
    setMode: () => {}
});

export function SolarSystemProvider({ children, initialMode = 'LEGACY' }: { children: React.ReactNode, initialMode?: 'LEGACY' | 'COMPASS' }) {
    const [currentMode, setMode] = useState<'LEGACY' | 'COMPASS'>(initialMode);
    const [solarBodies, setSolarBodies] = useState<OctaveBody[]>([]);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        // Octave 11 is the Solar System. 
        setSolarBodies(buildAllOctaves(currentMode));

        const handleResize = () => {
            setSolarBodies(buildAllOctaves(currentMode));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [currentMode]);

    return (
        <SolarSystemContext.Provider value={{ solarBodies, currentMode, setMode }}>
            {children}
        </SolarSystemContext.Provider>
    );
}

export function useSolarSystem() {
    return useContext(SolarSystemContext);
}
