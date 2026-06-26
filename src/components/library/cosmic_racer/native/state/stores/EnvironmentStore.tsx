'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Atomic Interface Definition
export interface FlightGradientConfig {
  angle: number;
  c1: string;
  c2: string;
  c3: string;
  speed: number;
  cycleColors: boolean;
  useCosmicCompass?: boolean;
}

export interface ParticlesConfig {
  particleCount: number;
  speed: number;
  sizeRandomness: number;
  cameraDistance: number;
}

export interface LightningConfig {
  hue: number;
  speed: number;
  intensity: number;
  size: number;
}

export interface IridescenceConfig {
  color: [number, number, number];
  speed: number;
  amplitude: number;
  mouseReact: boolean;
}

export interface ColorBendsConfig {
  rotation: number;
  speed: number;
  colors: string[];
  transparent: boolean;
  autoRotate: number;
  scale: number;
  frequency: number;
  warpStrength: number;
  mouseInfluence: number;
  parallax: number;
  noise: number;
}

export interface NebulaConfig {
  bumpScale: number;
  lightIntensity: number;
  opacity: number;
  blendMode: string;
}

export interface SmokeConfig {
  hue: number;
  speed: number;
  density: number;
  scale: number;
  warp: number;
  contrast: number;
  brightness: number;
  driftX: number;
  driftY: number;
  blendMode: string;
  resolutionScale?: number;
}

export interface SmokeLightingConfig {
  enabled: boolean;
  intensity: number;
  speed: number;
  hue: number;
  opacity: number;
  glow: number;
  lightningLength?: number;
  lightningBranches?: number;
  randomizeLightning?: boolean;
  blendMode: string;
}

export interface FractalLightmapConfig {
  enabled: boolean;
  cloudColor: string;
  lightColor: string;
  panSpeed: number;
  fractalSpeed: number;
  fractalScale: number;
  fractalIntensity: number;
  layer1Depth: number;
  layer2Depth: number;
  opacity: number;
  blendMode: string;
  resolutionScale?: number;
}

interface EnvironmentState {
  flightGradientConfig: FlightGradientConfig;
  updateFlightGradient: (key: keyof FlightGradientConfig, value: any) => void;
  setFlightGradientConfig: (config: FlightGradientConfig) => void;
  
  particlesConfig: ParticlesConfig;
  updateParticlesConfig: (key: keyof ParticlesConfig, value: number) => void;
  setParticlesConfig: (config: ParticlesConfig) => void;

  lightningConfig: LightningConfig;
  updateLightningConfig: (key: keyof LightningConfig, value: number) => void;
  setLightningConfig: (config: LightningConfig) => void;

  iridescenceConfig: IridescenceConfig;
  updateIridescenceConfig: (key: keyof IridescenceConfig, value: any) => void;
  setIridescenceConfig: (config: IridescenceConfig) => void;

  colorBendsConfig: ColorBendsConfig;
  updateColorBendsConfig: (key: keyof ColorBendsConfig, value: any) => void;
  setColorBendsConfig: (config: ColorBendsConfig) => void;

  nebulaConfig: NebulaConfig;
  updateNebulaConfig: (key: keyof NebulaConfig, value: any) => void;
  setNebulaConfig: (config: NebulaConfig) => void;

  smokeConfig: SmokeConfig;
  updateSmokeConfig: (key: keyof SmokeConfig, value: number) => void;
  setSmokeConfig: (config: SmokeConfig) => void;
  
  smokeLightingConfig: SmokeLightingConfig;
  updateSmokeLightingConfig: (key: keyof SmokeLightingConfig, value: any) => void;
  setSmokeLightingConfig: (config: SmokeLightingConfig) => void;

  fractalLightmapConfig: FractalLightmapConfig;
  updateFractalLightmapConfig: (key: keyof FractalLightmapConfig, value: any) => void;
  setFractalLightmapConfig: (config: FractalLightmapConfig) => void;
}

// Default isolated values so the component works on a blank page
const DEFAULT_GRADIENT: FlightGradientConfig = {
  angle: 135,
  c1: '#050511',
  c2: '#1a1a40',
  c3: '#0d0d2b',
  speed: 15,
  cycleColors: true
};

const DEFAULT_PARTICLES: ParticlesConfig = {
  particleCount: 200,
  speed: 0.1,
  sizeRandomness: 1,
  cameraDistance: 20
};

const DEFAULT_LIGHTNING: LightningConfig = {
  hue: 230,
  speed: 1,
  intensity: 1,
  size: 1
};

const DEFAULT_IRIDESCENCE: IridescenceConfig = {
  color: [1, 1, 1],
  speed: 1.0,
  amplitude: 0.1,
  mouseReact: true
};

const DEFAULT_COLOR_BENDS: ColorBendsConfig = {
  rotation: 45,
  speed: 0.2,
  colors: ['#ff00ff', '#00ffff', '#ffff00'],
  transparent: true,
  autoRotate: 0,
  scale: 1,
  frequency: 1,
  warpStrength: 1,
  mouseInfluence: 1,
  parallax: 0.5,
  noise: 0.1
};

const DEFAULT_NEBULA: NebulaConfig = {
  bumpScale: 0.05,
  lightIntensity: 1.0,
  opacity: 1.0,
  blendMode: 'screen'
};

const DEFAULT_SMOKE: SmokeConfig = {
  hue: 230,
  speed: 1.0,
  density: 1.0,
  scale: 1.0,
  warp: 4.0,
  contrast: 3.0,
  brightness: 1.0,
  driftX: 1.0,
  driftY: 0.5,
  blendMode: 'normal'
};

const DEFAULT_SMOKE_LIGHTING: SmokeLightingConfig = {
  enabled: false,
  intensity: 2.0,
  speed: 1.0,
  hue: 220,
  opacity: 0.8,
  glow: 1.0,
  lightningLength: 1.5,
  lightningBranches: 0.98,
  randomizeLightning: false,
  blendMode: 'screen'
};

const DEFAULT_FRACTAL_LIGHTMAP: FractalLightmapConfig = {
  enabled: false,
  cloudColor: '#2b1b4d', // Deep purple mapping from hue 260
  lightColor: '#5c9ce6', // Blue mapping from hue 210
  panSpeed: 1.0,
  fractalSpeed: 1.0,
  fractalScale: 1.0,
  fractalIntensity: 3.0,
  layer1Depth: 0.2,
  layer2Depth: 0.1,
  opacity: 0.8,
  blendMode: 'screen'
};

const EnvironmentContext = createContext<EnvironmentState | undefined>(undefined);

export const EnvironmentStoreProvider = ({ children, masterConfig }: { children: ReactNode, masterConfig?: any }) => {
  const [flightGradientConfig, setFlightGradientConfig] = useState<FlightGradientConfig>(DEFAULT_GRADIENT);
  const [particlesConfig, setParticlesConfig] = useState<ParticlesConfig>(DEFAULT_PARTICLES);
  const [lightningConfig, setLightningConfig] = useState<LightningConfig>(DEFAULT_LIGHTNING);
  const [iridescenceConfig, setIridescenceConfig] = useState<IridescenceConfig>(DEFAULT_IRIDESCENCE);
  const [colorBendsConfig, setColorBendsConfig] = useState<ColorBendsConfig>(DEFAULT_COLOR_BENDS);
  const [nebulaConfig, setNebulaConfig] = useState<NebulaConfig>(DEFAULT_NEBULA);
  const [smokeConfig, setSmokeConfig] = useState<SmokeConfig>(DEFAULT_SMOKE);
  const [smokeLightingConfig, setSmokeLightingConfig] = useState<SmokeLightingConfig>(DEFAULT_SMOKE_LIGHTING);
  const [fractalLightmapConfig, setFractalLightmapConfig] = useState<FractalLightmapConfig>(DEFAULT_FRACTAL_LIGHTMAP);

  // Hydrate from DB on mount
  useEffect(() => {
    const hydrate = (data: any) => {
        if (data) {
          if (data.flightGradientConfig) setFlightGradientConfig(data.flightGradientConfig);
          if (data.particlesConfig) setParticlesConfig(data.particlesConfig);
          if (data.lightningConfig) setLightningConfig(data.lightningConfig);
          if (data.iridescenceConfig) setIridescenceConfig(data.iridescenceConfig);
          if (data.colorBendsConfig) setColorBendsConfig(data.colorBendsConfig);
          if (data.nebulaConfig) setNebulaConfig(data.nebulaConfig);
          if (data.smokeConfig) setSmokeConfig(data.smokeConfig);
          if (data.smokeLightingConfig) setSmokeLightingConfig(data.smokeLightingConfig);
          if (data.fractalLightmapConfig) setFractalLightmapConfig(data.fractalLightmapConfig);
        }
    };

    if (masterConfig) {
        hydrate(masterConfig);
    } else {
        const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
        const isLocalScheme = typeof window !== 'undefined' && 
          window.location.protocol !== 'http:' && 
          window.location.protocol !== 'https:';

        const configUrl = (isPort3006 || isLocalScheme)
          ? '/game_assets/data/game_config.json'
          : '/api/game-assets/config';

        fetch(configUrl)
          .then(res => res.json())
          .then(hydrate)
          .catch(err => console.error('Failed to load environment state from DB:', err));
    }
  }, [masterConfig]);

  const updateFlightGradient = (key: keyof FlightGradientConfig, value: any) => {
    setFlightGradientConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateParticlesConfig = (key: keyof ParticlesConfig, value: number) => {
    setParticlesConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateLightningConfig = (key: keyof LightningConfig, value: number) => {
    setLightningConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateIridescenceConfig = (key: keyof IridescenceConfig, value: any) => {
    setIridescenceConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateColorBendsConfig = (key: keyof ColorBendsConfig, value: any) => {
    setColorBendsConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateNebulaConfig = (key: keyof NebulaConfig, value: any) => {
    setNebulaConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateSmokeConfig = (key: keyof SmokeConfig, value: number) => {
    setSmokeConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateSmokeLightingConfig = (key: keyof SmokeLightingConfig, value: any) => {
    setSmokeLightingConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateFractalLightmapConfig = (key: keyof FractalLightmapConfig, value: any) => {
    setFractalLightmapConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <EnvironmentContext.Provider value={{ 
      flightGradientConfig, updateFlightGradient, setFlightGradientConfig,
      particlesConfig, updateParticlesConfig, setParticlesConfig,
      lightningConfig, updateLightningConfig, setLightningConfig,
      iridescenceConfig, updateIridescenceConfig, setIridescenceConfig,
      colorBendsConfig, updateColorBendsConfig, setColorBendsConfig,
      nebulaConfig, updateNebulaConfig, setNebulaConfig,
      smokeConfig, updateSmokeConfig, setSmokeConfig,
      smokeLightingConfig, updateSmokeLightingConfig, setSmokeLightingConfig,
      fractalLightmapConfig, updateFractalLightmapConfig, setFractalLightmapConfig
    }}>
      {children}
    </EnvironmentContext.Provider>
  );
};


// Global hook: Every component uses this to bypass 6,000-line prop drilling
export const useEnvironmentStore = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironmentStore must be used within an EnvironmentStoreProvider');
  }
  return context;
};
