import React, { createContext, useContext, useState, useMemo } from 'react';

export interface CoordinateState {
    globalScaleConstant: number;
    anchorPoint: 'center' | 'top-left';
    gridUnit: string;
    compassOffsetRadians: number;
}

export interface CoordinateContextType {
    state: CoordinateState;
    updateState: (partial: Partial<CoordinateState>) => void;
    
    // Core Transform Methods
    worldToPhysics: (worldR: number) => number;
    physicsToWorld: (physicsDist: number) => number;
    
    // Projection Helpers
    worldToMapScreen: (rawX: number, rawZ: number, cx: number, cy: number, activeMapZoom: number, isoRatio: number) => { x: number, y: number };
}

const DEFAULT_STATE: CoordinateState = {
    globalScaleConstant: 24.0,     // 24.0 corresponds directly to existing grid logic constants.
    anchorPoint: 'center',         // standard Cartesian default
    gridUnit: 'AU',
    compassOffsetRadians: 0,
};

const CoordinateContext = createContext<CoordinateContextType | null>(null);

export const useCoordinateEngine = () => {
    const context = useContext(CoordinateContext);
    if (!context) {
        throw new Error('useCoordinateEngine must be used within a CoordinateEngineProvider');
    }
    return context;
};

export const CoordinateEngineProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<CoordinateState>(DEFAULT_STATE);

    const updateState = (partial: Partial<CoordinateState>) => {
        setState(prev => ({ ...prev, ...partial }));
    };

    const api = useMemo<CoordinateContextType>(() => {
        const { globalScaleConstant } = state;
        
        return {
            state,
            updateState,
            // Core physical equivalency scaling block
            worldToPhysics: (worldR: number) => worldR / globalScaleConstant,
            physicsToWorld: (physicsR: number) => physicsR * globalScaleConstant,
            
            // Map Screen calculation dynamically applies zoom and layout ratios
            worldToMapScreen: (rawX, rawZ, cx, cy, activeMapZoom, isoRatio) => {
                // Historically mapped against 0.15 VISUAL_SCALE
                const absoluteMapScale = 0.15 * activeMapZoom; 
                return {
                    x: cx + rawX * absoluteMapScale,
                    y: cy + rawZ * absoluteMapScale * isoRatio
                };
            }
        };
    }, [state]);

    return (
        <CoordinateContext.Provider value={api}>
            {children}
        </CoordinateContext.Provider>
    );
};
