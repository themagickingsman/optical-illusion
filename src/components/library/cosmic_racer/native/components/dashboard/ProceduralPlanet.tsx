import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface PlanetConfig {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  waterLevel: number;
  atmosphereColor: string;
  shadowColor: string;
  backlightColor: string;
  bloomIntensity: number;
  atmosphereIntensity?: number;
  backlightIntensity?: number;
  shadowOpacity?: number;
  bumpScale: number;
  craterScale: number;
  noiseScale: number;
  timeScale: number;
  cloudStretchX: number;
  cloudStretchY: number;
  warpScale: number;
  terraces: number;
}

const glslNoiseLib = `
// Simplex 3D Noise Helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 4; ++i) { // Restored higher octaves to generate tiny, granular wave ripples on the edges
        v += a * snoise(x);
        x = x * 2.0 + shift; // Restored sharp frequency multiplier (2.0x instead of 1.5x)
        a *= 0.5;
    }
    return v;
}

float terracedNoise(float n, float steps) {
    float scaled = n * steps;
    float i = floor(scaled);
    float f = fract(scaled);
    float sm = smoothstep(0.1, 0.9, f); // Massively expanded the smoothing for less contrast
    return (i + sm) / steps;
}
`;

const vertexShader = `
uniform float uBumpScale;
uniform float uNoiseScale;
uniform float uCloudStretchX;
uniform float uCloudStretchY;
uniform float uWarpScale;
uniform float uTime;
uniform float uTerraces;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

${glslNoiseLib}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Construct stretch/warp coordinates identically to fragment
  vec3 stretchedPos = vec3(
    position.x * uCloudStretchX,
    position.y * uCloudStretchY,
    position.z * uCloudStretchX
  );
  vec3 basePos = stretchedPos * uNoiseScale + vec3(uTime * 0.1);
  vec3 q = vec3( fbm(basePos), fbm(basePos + vec3(5.2)), fbm(basePos + vec3(1.3)) );
  float rawNoise = fbm(basePos + uWarpScale * q);
  
  float normalizedNoise = rawNoise * 0.5 + 0.5;
  float height = terracedNoise(normalizedNoise, uTerraces);
  
  // PHYSICAL MESH DISPLACEMENT (Disabled per user request, keeping sphere silhouette clean)
  vec3 displacedPosition = position; // + (normal * height * uBumpScale * 0.2); 
  vPosition = displacedPosition; // Send displaced position physically to the fragment interpolator

  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uAtmosphereColor;
uniform vec3 uShadowColor;
uniform vec3 uBacklightColor;
uniform float uBloomIntensity;
uniform float uAtmosphereIntensity;
uniform float uBacklightIntensity;
uniform float uShadowOpacity;
uniform float uBumpScale;
uniform float uCraterScale;
uniform float uNoiseScale;
uniform float uCloudStretchX;
uniform float uCloudStretchY;
uniform float uWarpScale;
uniform float uTime;
uniform float uTerraces;
uniform float uWaterLevel;
uniform vec3 uLightDirection;

uniform int uRenderMode;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

${glslNoiseLib}

void main() {
  // Re-evaluating procedural geometry perfectly in Screen-Space allows us to catch the exact pixel-perfect normals
  // Base noise matrix (no longer aggressively squashed on Y, ensuring the swirls remain organically circular)
  vec3 stretchedPos = vec3(
    vPosition.x * uCloudStretchX,
    vPosition.y * 1.0, 
    vPosition.z * uCloudStretchX
  );
  vec3 basePos = stretchedPos * uNoiseScale + vec3(uTime * 0.1);
  vec3 q = vec3( fbm(basePos), fbm(basePos + vec3(5.2)), fbm(basePos + vec3(1.3)) );
  
  // Domain Warping Engine
  // uWarpScale now STRICTLY controls the domain-warping input (spinning the coords into intense vortex spirals)
  float rawNoise = fbm(basePos + (uWarpScale * 0.5) * q);
  
  // Latitudinal Banding Engine
  // We fix the structural amplitude of the noise at a tight 0.4 so the spirals mathematically remain trapped 
  // along the strata edges, rather than overpowering the entire horizontal layout!
  float edgeTurbulence = rawNoise * 0.4;
  float latitudinalBand = (vPosition.y * uCloudStretchY * 0.5) + edgeTurbulence;
  
  float normalizedNoise = latitudinalBand * 0.5 + 0.5;
  float height = terracedNoise(normalizedNoise, uTerraces);
  
  // Bypass artificial bump maps: surface acts as a perfectly smooth planetary shell
  vec3 finalNormal = vNormal;

  // 5-Layer Color Strata (Top Peaks to Deep Core)
  vec3 surfaceColor;
  if (height > uWaterLevel + 0.3) {
      surfaceColor = uColor1; 
  } else if (height > uWaterLevel + 0.15) {
      surfaceColor = uColor2; 
  } else if (height > uWaterLevel) {
      surfaceColor = uColor3; 
  } else if (height > uWaterLevel - 0.15) {
      surfaceColor = uColor4; 
  } else {
      surfaceColor = uColor5; 
  }
  
  // Fragment Lighting (Primary Sun)
  vec3 lightDir = normalize(uLightDirection);
  float rawDiff = max(dot(finalNormal, lightDir), 0.0);
  
  // The user requested to make the "black shadow bottom left facing" invisible
  // We skip the directional darkening and use the raw surface color for a uniformly lit flat-shaded planet
  vec3 litSurface = surfaceColor;
  
  // Cinematic Blue Side-Light (Backlight Mask)
  // Inverse computation pushes the cinematic rim strictly to the shadowed hemisphere
  vec3 backLightDir = normalize(vec3(-lightDir.x, 0.5, -lightDir.y));
  float backDiff = max(dot(vNormal, backLightDir), 0.0); 
  float backLightMask = smoothstep(0.0, 0.5, backDiff); 
  
  // Fresnel Atmospheric Rim
  vec3 viewDir = normalize(vViewPosition);
  float fresnelTerm = clamp(1.0 - dot(viewDir, vNormal), 0.0, 1.0); 
  
  float coreRim = pow(fresnelTerm, 4.0); // Softer gradient for daytime atmosphere
  float sharpRim = pow(fresnelTerm, 12.0); // Razor sharp edge for cinematic backlight
  
  vec3 finalColor = vec3(0.0);
  float alpha = 1.0;
  
  if (uRenderMode == 0) { // All Combined
     finalColor = litSurface + (uAtmosphereColor * coreRim * 1.5 * uAtmosphereIntensity);
     finalColor = min(finalColor, vec3(1.0));
     float thinCinematicEdge = sharpRim * backLightMask; 
     finalColor += uBacklightColor * thinCinematicEdge * uBloomIntensity * uBacklightIntensity * 6.0; 
  } else if (uRenderMode == 1) { // Core Substrate Only
     finalColor = litSurface;
  } else if (uRenderMode == 2) { // SunRim Glow Only
     finalColor = uAtmosphereColor;
     // The alpha strictly dictates the gradient intensity
     alpha = clamp(coreRim * 1.5, 0.0, 1.0);
  } else if (uRenderMode == 3) { // Backlight Cinematic Rim Only
     finalColor = uBacklightColor;
     float thinCinematicEdge = sharpRim * backLightMask; 
     alpha = clamp(thinCinematicEdge * uBloomIntensity * 6.0, 0.0, 1.0);
  }

  gl_FragColor = vec4(finalColor, alpha);
}
`;

interface ProceduralPlanetProps {
  config: PlanetConfig;
  lightDirection?: THREE.Vector3;
  materialRef?: React.MutableRefObject<any>;
  renderMode?: number;
}

export function ProceduralPlanet({ config, lightDirection, materialRef, renderMode }: ProceduralPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uColor1: { value: new THREE.Color(config.color1) },
    uColor2: { value: new THREE.Color(config.color2) },
    uColor3: { value: new THREE.Color(config.color3) },
    uColor4: { value: new THREE.Color(config.color4) },
    uColor5: { value: new THREE.Color(config.color5) },
    uAtmosphereColor: { value: new THREE.Color(config.atmosphereColor) },
    uBacklightColor: { value: new THREE.Color(config.backlightColor) },
    uBloomIntensity: { value: config.bloomIntensity },
    uAtmosphereIntensity: { value: config.atmosphereIntensity ?? 1.0 },
    uBacklightIntensity: { value: config.backlightIntensity ?? 1.0 },
    uShadowOpacity: { value: config.shadowOpacity ?? 0.0 },
    uCraterScale: { value: config.craterScale },
    uNoiseScale: { value: config.noiseScale },
    uCloudStretchX: { value: config.cloudStretchX },
    uCloudStretchY: { value: config.cloudStretchY },
    uWarpScale: { value: config.warpScale },
    uTerraces: { value: config.terraces },
    uWaterLevel: { value: config.waterLevel },
    uLightDirection: { value: lightDirection ? lightDirection.clone() : new THREE.Vector3(1.0, 1.0, 1.0) },
    uRenderMode: { value: renderMode || 0 },
    uTime: { value: 0 }
  }), []);

  // Sync uniforms on prop changes
  useMemo(() => {
    uniforms.uColor1.value.set(config.color1);
    uniforms.uColor2.value.set(config.color2);
    uniforms.uColor3.value.set(config.color3);
    uniforms.uColor4.value.set(config.color4);
    uniforms.uColor5.value.set(config.color5);
    uniforms.uAtmosphereColor.value.set(config.atmosphereColor);
    uniforms.uBacklightColor.value.set(config.backlightColor);
    uniforms.uBloomIntensity.value = config.bloomIntensity;
    uniforms.uAtmosphereIntensity.value = config.atmosphereIntensity ?? 1.0;
    uniforms.uBacklightIntensity.value = config.backlightIntensity ?? 1.0;
    uniforms.uShadowOpacity.value = config.shadowOpacity ?? 0.0;
    uniforms.uCraterScale.value = config.craterScale;
    uniforms.uNoiseScale.value = config.noiseScale;
    uniforms.uCloudStretchX.value = config.cloudStretchX;
    uniforms.uCloudStretchY.value = config.cloudStretchY;
    uniforms.uWarpScale.value = config.warpScale;
    uniforms.uTerraces.value = config.terraces;
    uniforms.uWaterLevel.value = config.waterLevel;
    
    if (lightDirection) {
        uniforms.uLightDirection.value.copy(lightDirection);
    }
  }, [config, lightDirection, uniforms]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * config.timeScale;
      uniforms.uTime.value += delta * config.timeScale;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        // @ts-ignore
        extensions={{ derivatives: true }}
      />
    </mesh>
  );
}

// Provide a Canvas wrapper so it can be used generically without throwing Canvas errors
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

function CameraEnforcer({ exportTrigger }: { exportTrigger?: number }) {
  // Enforcer not needed with Orthographic
  return null;
}

import { OrthographicCamera } from '@react-three/drei';

function ResponsiveOrthoCamera({ zoomIndex = 1 }: { zoomIndex?: number }) {
  const { size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const frustumHeight = 6.4;
  const frustumWidth = frustumHeight * aspect;

  return (
    <OrthographicCamera 
      makeDefault 
      manual 
      position={[0, 0, 10]} 
      zoom={zoomIndex} 
      left={frustumWidth / -2} 
      right={frustumWidth / 2} 
      top={frustumHeight / 2} 
      bottom={frustumHeight / -2} 
      near={0.1} far={100} 
      onUpdate={c => c.updateProjectionMatrix()} 
    />
  );
}

export function ProceduralPlanetCanvas({ config, renderMode, exportTrigger, zoomIndex = 1 }: { config: PlanetConfig, renderMode?: number, exportTrigger?: number, zoomIndex?: number }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (exportTrigger && controlsRef.current) {
      controlsRef.current.reset(); // Stop rotations
    }
  }, [exportTrigger]);

  return (
    <Canvas dpr={1} gl={{ preserveDrawingBuffer: true, antialias: false, alpha: true, premultipliedAlpha: false, toneMapping: THREE.NoToneMapping }}>
      <ResponsiveOrthoCamera zoomIndex={zoomIndex} />
      <CameraEnforcer exportTrigger={exportTrigger} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <ProceduralPlanet config={config} renderMode={renderMode} />
      <OrbitControls ref={controlsRef} makeDefault enableZoom={true} minDistance={2.1} maxDistance={40.0} enablePan={false} autoRotate={false} />
      {(!renderMode || renderMode === 0) && (
        <EffectComposer>
          <Bloom luminanceThreshold={1.05} mipmapBlur intensity={config.bloomIntensity ?? 1.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export default ProceduralPlanetCanvas;
