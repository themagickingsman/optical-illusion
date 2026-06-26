import * as THREE from 'three';
import { getGlobalDbState } from '../state/game-assets/ships';

export const FLIGHT_MODEL_DEFAULT_PARAMS = {
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
  showLightMap: true,
  lightMapIntensity: 2.0,
  lightMapGlow: 0.5,
  lightMapBloom: 1.0,
  lightMapFalloff: 2.0,
  lightMapSize: 1.0,
  lightMapHex: '#00ffff',
  ambientLight: 0.4,
  sunX: 20,
  showGrid: false,
  showTargetRings: false,
  autoPilot: false,
  cruiseMode: false,
  sunY: 40,
  sunZ: 20,
  cameraAngle: 'top',
  cinematicZoomScale: 0.68,
  cinematicZoomSpeed: 0.005,

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
  trailMountY: -2.0,
  navLightsX: 0.0,
  navLightsY: -62.0,
  navLightsSpread: 85.0,
  navLightsPortColor: '#ff0000',
  navLightsStbColor: '#00ff00',
  navLightsPortIntensity: 5.0,
  navLightsStbIntensity: 5.0,
  navLightsFalloff: 0.005,
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
  motionRotation: 0.0,
  motionFrequency: 15.0,
  motionWidth: 0.05,
  motionHex: '#00ffff',
  engineParticleColor1: '#ff0055',
  engineParticleColor2: '#00ffaa',
  engineParticleColor3: '#0088ff',
  engineParticleCycleSpeed: 1.0,
  useCustomEngineFlames: false,
  navLightsBlinkRate: 1.5
};

export function applyFlightLightingToShip(factoryGroup: THREE.Group, sp = FLIGHT_MODEL_DEFAULT_PARAMS, sunPos = new THREE.Vector3(8, 20, 8), activeMotionOffset = 0, throttleRatio = 1.0, shipId = '1', isPlayer = false) {
    const applyToMesh = (mesh: THREE.Mesh | null | undefined) => {
        if (!mesh || !mesh.material) return;
        const material = mesh.material as any;
        const uniforms = material ? (material.uniforms || material.userData?.shader?.uniforms) : null;
        if (uniforms) {
            if (uniforms.uIsPink) {
                uniforms.uIsPink.value = 0.0;
            }
            
            const finalDirX = sunPos.x;
            const finalDirY = sunPos.y;
            const finalDirZ = sunPos.z;

            if (uniforms.uRimColor) {
                if (uniforms.uRimColor.value.set) uniforms.uRimColor.value.set(sp.rimHex);
                else uniforms.uRimColor.value = new THREE.Color(sp.rimHex);
            }
            if (uniforms.uEdgeColor) {
                if (uniforms.uEdgeColor.value.set) uniforms.uEdgeColor.value.set(sp.edgeHex);
                else uniforms.uEdgeColor.value = new THREE.Color(sp.edgeHex);
            }
            
            if (uniforms.uSunPosition) {
                if (uniforms.uSunPosition.value.set) uniforms.uSunPosition.value.set(finalDirX, finalDirY, finalDirZ);
                else uniforms.uSunPosition.value = new THREE.Vector3(finalDirX, finalDirY, finalDirZ);
            }
            if (uniforms.uContrast) uniforms.uContrast.value = sp.texContrast;
            if (uniforms.uLuminance) uniforms.uLuminance.value = sp.texLuminance;
            
            if (uniforms.uEdgeThreshold) uniforms.uEdgeThreshold.value = sp.edgeThreshold;
            if (uniforms.uEdgeIntensity) uniforms.uEdgeIntensity.value = sp.edgeIntensity;
            if (uniforms.uSpecularIntensity) uniforms.uSpecularIntensity.value = sp.specularIntensity;
            if (uniforms.uSpecularShininess) uniforms.uSpecularShininess.value = sp.specularShininess;
            if (uniforms.uSpecularAnisotropy) uniforms.uSpecularAnisotropy.value = sp.specularAnisotropy;
            
            if (uniforms.uCenterSpecularIntensity) uniforms.uCenterSpecularIntensity.value = sp.centerSpecularIntensity;
            if (uniforms.uCenterSpecularWidth) uniforms.uCenterSpecularWidth.value = sp.centerSpecularWidth;
            if (uniforms.uCenterSpecularFalloff) uniforms.uCenterSpecularFalloff.value = sp.centerSpecularFalloff;
            if (uniforms.uCenterSpecularShininess) uniforms.uCenterSpecularShininess.value = sp.centerSpecularShininess;
            if (uniforms.uCenterSpecularAnisotropy) uniforms.uCenterSpecularAnisotropy.value = sp.centerSpecularAnisotropy;

            if (uniforms.uShineStretch) uniforms.uShineStretch.value = sp.shineStretch;
            if (uniforms.uShineWidth) uniforms.uShineWidth.value = sp.shineWidth;
            if (uniforms.uShineIntensity) uniforms.uShineIntensity.value = sp.shineIntensity;
            if (uniforms.uTime) uniforms.uTime.value = performance.now() * 0.001;
            
            // Engine Particle Colors
            let eColor1 = sp.engineParticleColor1 || '#ff0055';
            let eColor2 = sp.engineParticleColor2 || '#00ffaa';
            let eColor3 = sp.engineParticleColor3 || '#0088ff';

            const db = getGlobalDbState();
            if (!sp.useCustomEngineFlames && db && db.shipFxColors && db.shipFxColors[shipId]) {
                const overrideColor = db.shipFxColors[shipId];
                eColor1 = overrideColor;
                eColor2 = overrideColor;
                eColor3 = overrideColor;
            }

            if (uniforms.uEngineColor1) {
                if (uniforms.uEngineColor1.value.set) uniforms.uEngineColor1.value.set(eColor1);
                else uniforms.uEngineColor1.value = new THREE.Color(eColor1);
            }
            if (uniforms.uEngineColor2) {
                if (uniforms.uEngineColor2.value.set) uniforms.uEngineColor2.value.set(eColor2);
                else uniforms.uEngineColor2.value = new THREE.Color(eColor2);
            }
            if (uniforms.uEngineColor3) {
                if (uniforms.uEngineColor3.value.set) uniforms.uEngineColor3.value.set(eColor3);
                else uniforms.uEngineColor3.value = new THREE.Color(eColor3);
            }
            if (uniforms.uEngineCycleSpeed !== undefined) {
                uniforms.uEngineCycleSpeed.value = sp.engineParticleCycleSpeed !== undefined ? sp.engineParticleCycleSpeed : 1.0;
            }

            if (uniforms.uGlobalShadowThreshold) uniforms.uGlobalShadowThreshold.value = sp.globalShadowThreshold;
            if (uniforms.uGlobalShadowSmoothness) uniforms.uGlobalShadowSmoothness.value = sp.globalShadowSmoothness;
            if (uniforms.uGlobalShadowOpacity) uniforms.uGlobalShadowOpacity.value = sp.globalShadowOpacity;
            if (uniforms.uGlobalShadowColor) {
                if (uniforms.uGlobalShadowColor.value.set) uniforms.uGlobalShadowColor.value.set(sp.globalShadowColor);
                else uniforms.uGlobalShadowColor.value = new THREE.Color(sp.globalShadowColor);
            }
            
            if (uniforms.uSpotLightIntensity) uniforms.uSpotLightIntensity.value = sp.spotLightIntensity;
            if (uniforms.uSpotLightSize) uniforms.uSpotLightSize.value = sp.spotLightSize;
            if (uniforms.uSpotLightFalloff) uniforms.uSpotLightFalloff.value = sp.spotLightFalloff;
            if (uniforms.uSpotLightColor) {
                if (uniforms.uSpotLightColor.value.set) uniforms.uSpotLightColor.value.set(sp.spotLightHex);
                else uniforms.uSpotLightColor.value = new THREE.Color(sp.spotLightHex);
            }
            if (uniforms.uSpotLightX) uniforms.uSpotLightX.value = sp.spotLightX;
            if (uniforms.uSpotLightY) uniforms.uSpotLightY.value = sp.spotLightY;
            
            if (uniforms.uMotionOpacity) uniforms.uMotionOpacity.value = sp.motionOpacity;
            if (uniforms.uMotionIntensity) uniforms.uMotionIntensity.value = sp.motionIntensity;
            if (uniforms.uMotionFalloff) uniforms.uMotionFalloff.value = sp.motionFalloff;
            if (uniforms.uMotionOffset) uniforms.uMotionOffset.value = activeMotionOffset;
            
            if (uniforms.uMotionRotation) uniforms.uMotionRotation.value = sp.motionRotation;
            if (uniforms.uMotionFrequency) uniforms.uMotionFrequency.value = sp.motionFrequency;
            if (uniforms.uMotionWidth) uniforms.uMotionWidth.value = sp.motionWidth;
            if (uniforms.uMotionColor) {
                if (uniforms.uMotionColor.value.set) uniforms.uMotionColor.value.set(sp.motionHex);
                else uniforms.uMotionColor.value = new THREE.Color(sp.motionHex);
            }
            
            if (uniforms.uHasLightMap) {
                const hasLM = sp.showLightMap && mesh.userData.currentTextures && mesh.userData.currentTextures.lightMap ? 1.0 : 0.0;
                uniforms.uHasLightMap.value = hasLM;
                if (hasLM) {
                    uniforms.uLightMap.value = mesh.userData.currentTextures.lightMap;
                    const lightMapFade = Math.max(0.0, Math.min(1.0, throttleRatio));
                    uniforms.uLightMapIntensity.value = sp.lightMapIntensity * lightMapFade;
                    uniforms.uLightMapGlow.value = sp.lightMapGlow;
                    if (uniforms.uLightMapBloom) uniforms.uLightMapBloom.value = (sp.lightMapBloom ?? 1.0) * lightMapFade;
                    uniforms.uLightMapFalloff.value = sp.lightMapFalloff;
                    uniforms.uLightMapSize.value = sp.lightMapSize;
                    if (uniforms.uLightMapColor.value.set) uniforms.uLightMapColor.value.set(sp.lightMapHex);
                    else uniforms.uLightMapColor.value = new THREE.Color(sp.lightMapHex);
                }
            }
            
            if (uniforms.uLocalSunDir) {
               mesh.updateMatrixWorld(true);
               const loopLocalSunPos = new THREE.Vector3(finalDirX, finalDirY, finalDirZ);
               mesh.worldToLocal(loopLocalSunPos);
               if (uniforms.uLocalSunDir.value.copy) uniforms.uLocalSunDir.value.copy(loopLocalSunPos).normalize();
               else uniforms.uLocalSunDir.value = loopLocalSunPos.clone().normalize();
            }

            if (uniforms.uNavLightPortIntensity) {
                const blinkRate = Math.max(0.1, sp.navLightsBlinkRate || 1.5);
                const uniqueOffset = shipId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 0.123;
                const blinkPhase = ((Date.now() * 0.001) + uniqueOffset) % blinkRate;
                const isOn = blinkPhase < 0.1 || (blinkPhase > 0.25 && blinkPhase < 0.35);
                
                uniforms.uNavLightPortIntensity.value = isOn ? (sp.navLightsPortIntensity ?? 5.0) : 0.0;
                uniforms.uNavLightStbIntensity.value = isOn ? (sp.navLightsStbIntensity ?? 5.0) : 0.0;
                
                if (uniforms.uNavLightPortPos) {
                    if (uniforms.uNavLightPortPos.value.set) {
                        uniforms.uNavLightPortPos.value.set(-sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                        uniforms.uNavLightStbPos.value.set(sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                    } else {
                        uniforms.uNavLightPortPos.value = new THREE.Vector2(-sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                        uniforms.uNavLightStbPos.value = new THREE.Vector2(sp.navLightsSpread / 100.0, sp.navLightsY / 50.0);
                    }
                    
                    if (uniforms.uNavLightColorPort) {
                        if (uniforms.uNavLightColorPort.value.set) {
                            uniforms.uNavLightColorPort.value.set(sp.navLightsPortColor || '#ff0000');
                            uniforms.uNavLightColorStb.value.set(sp.navLightsStbColor || '#00ff00');
                        } else {
                            uniforms.uNavLightColorPort.value = new THREE.Color(sp.navLightsPortColor || '#ff0000');
                            uniforms.uNavLightColorStb.value = new THREE.Color(sp.navLightsStbColor || '#00ff00');
                        }
                    }
                    
                    if (uniforms.uNavLightFalloff) {
                        uniforms.uNavLightFalloff.value = sp.navLightsFalloff ?? 0.005;
                    }
                }
            }
        }
    };
    
    if (factoryGroup.userData.planeModel) applyToMesh(factoryGroup.userData.planeModel);
    if (factoryGroup.userData.underbellyPlane) applyToMesh(factoryGroup.userData.underbellyPlane);
    if (factoryGroup.userData.engineInstancedMesh) applyToMesh(factoryGroup.userData.engineInstancedMesh);
}

export function createHighFidelityShipGroup() {
    const shipGroup = new THREE.Group();

    const engLight = new THREE.PointLight(0xff7700, 0, 10);

    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 1; dummyCanvas.height = 1;
    const dummyTex = new THREE.Texture(dummyCanvas);
    dummyTex.needsUpdate = true;
    
    const shipChassis = new THREE.Group();
    shipChassis.name = 'shipChassis';
    shipGroup.add(shipChassis);
    
    shipChassis.add(engLight);

    const planeGeo = new THREE.PlaneGeometry(100, 100, 128, 128);
    const planeMat = new THREE.MeshPhysicalMaterial({
      map: dummyTex,
      alphaMap: dummyTex,
      bumpMap: dummyTex,
      transparent: false,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
      roughness: 1.0,
      metalness: 0.0,
      clearcoat: 0.0,
      clearcoatRoughness: 1.0,
      iridescence: 0.0,
    });
    planeMat.onBeforeCompile = function (shader) {
        shader.uniforms.uIsPink = { value: 0.0 };
        shader.uniforms.uContrast = { value: 1.0 };
        shader.uniforms.uLuminance = { value: 1.0 };
        shader.uniforms.uLocalSunDir = { value: new THREE.Vector3(0, 0, 1) };
        shader.uniforms.uRimColor = { value: new THREE.Color() };
        shader.uniforms.uEdgeColor = { value: new THREE.Color() };
        shader.uniforms.uEdgeThreshold = { value: 0.35 };
        shader.uniforms.uEdgeIntensity = { value: 1.0 };
        shader.uniforms.uSpecularIntensity = { value: 0.5 };
        shader.uniforms.uSpecularShininess = { value: 32.0 };
        shader.uniforms.uSpecularAnisotropy = { value: 0.85 };
        shader.uniforms.uCenterSpecularIntensity = { value: 1.5 };
        shader.uniforms.uCenterSpecularWidth = { value: 0.12 };
        shader.uniforms.uCenterSpecularFalloff = { value: 0.02 };
        shader.uniforms.uCenterSpecularShininess = { value: 110.0 };
        shader.uniforms.uCenterSpecularAnisotropy = { value: 0.1 };
        shader.uniforms.uShineStretch = { value: 0.2 };
        shader.uniforms.uShineWidth = { value: 0.1 };
        shader.uniforms.uShineIntensity = { value: 1.5 };
        shader.uniforms.uTime = { value: 0.0 };
        shader.uniforms.uGlobalShadowThreshold = { value: 0.05 };
        shader.uniforms.uGlobalShadowSmoothness = { value: 0.35 };
        shader.uniforms.uGlobalShadowOpacity = { value: 0.85 };
        shader.uniforms.uGlobalShadowColor = { value: new THREE.Color('#0a1024') };
        shader.uniforms.uSpotLightIntensity = { value: 1.5 };
        shader.uniforms.uSpotLightSize = { value: 0.5 };
        shader.uniforms.uSpotLightFalloff = { value: 0.2 };
        shader.uniforms.uSpotLightColor = { value: new THREE.Color('#ffffff') };
        shader.uniforms.uSpotLightX = { value: 0.0 };
        shader.uniforms.uSpotLightY = { value: -0.4 };
        shader.uniforms.uMotionOpacity = { value: 0.8 };
        shader.uniforms.uMotionIntensity = { value: 2.0 };
        shader.uniforms.uMotionFalloff = { value: 0.05 };
        shader.uniforms.uMotionOffset = { value: 0.0 };
        shader.uniforms.uMotionRotation = { value: 0.0 };
        shader.uniforms.uMotionFrequency = { value: 15.0 };
        shader.uniforms.uMotionWidth = { value: 0.05 };
        shader.uniforms.uMotionColor = { value: new THREE.Color('#00ffff') };
        
        shader.uniforms.uLightMap = { value: null };
        shader.uniforms.uHasLightMap = { value: 0.0 };
        shader.uniforms.uLightMapIntensity = { value: 2.0 };
        shader.uniforms.uLightMapGlow = { value: 0.5 };
        shader.uniforms.uLightMapBloom = { value: 1.0 };
        shader.uniforms.uLightMapFalloff = { value: 2.0 };
        shader.uniforms.uLightMapSize = { value: 1.0 };
        shader.uniforms.uLightMapColor = { value: new THREE.Color('#00ffff') };

        // Fake Nav Lights
        shader.uniforms.uNavLightPortPos = { value: new THREE.Vector2(-0.5, -0.6) };
        shader.uniforms.uNavLightStbPos = { value: new THREE.Vector2(0.5, -0.6) };
        shader.uniforms.uNavLightColorPort = { value: new THREE.Color('#ff0000') };
        shader.uniforms.uNavLightColorStb = { value: new THREE.Color('#00ff00') };
        shader.uniforms.uNavLightPortIntensity = { value: 0.0 };
        shader.uniforms.uNavLightStbIntensity = { value: 0.0 };
        shader.uniforms.uNavLightFalloff = { value: 0.005 };

        shader.fragmentShader = `
          uniform float uIsPink;
          uniform float uContrast;
          uniform float uLuminance;
          uniform vec3 uLocalSunDir;
          uniform vec3 uRimColor;
          uniform vec3 uEdgeColor;
          uniform float uEdgeThreshold;
          uniform float uEdgeIntensity;
          uniform float uSpecularIntensity;
          uniform float uSpecularShininess;
          uniform float uSpecularAnisotropy;
          uniform float uCenterSpecularIntensity;
          uniform float uCenterSpecularWidth;
          uniform float uCenterSpecularFalloff;
          uniform float uCenterSpecularShininess;
          uniform float uCenterSpecularAnisotropy;
          uniform float uShineStretch;
          uniform float uShineWidth;
          uniform float uShineIntensity;
          uniform float uTime;
          uniform float uGlobalShadowThreshold;
          uniform float uGlobalShadowSmoothness;
          uniform float uGlobalShadowOpacity;
          uniform vec3 uGlobalShadowColor;
          uniform float uSpotLightIntensity;
          uniform float uSpotLightSize;
          uniform float uSpotLightFalloff;
          uniform vec3 uSpotLightColor;
          uniform float uSpotLightX;
          uniform float uSpotLightY;
          uniform float uMotionOpacity;
          uniform float uMotionIntensity;
          uniform float uMotionFalloff;
          uniform float uMotionOffset;
          uniform float uMotionRotation;
          uniform float uMotionFrequency;
          uniform float uMotionWidth;
          uniform vec3 uMotionColor;
          
          uniform sampler2D uLightMap;
          uniform float uHasLightMap;
          uniform float uLightMapIntensity;
          uniform float uLightMapGlow;
          uniform float uLightMapBloom;
          uniform float uLightMapFalloff;
          uniform float uLightMapSize;
          uniform vec3 uLightMapColor;

          uniform vec2 uNavLightPortPos;
          uniform vec2 uNavLightStbPos;
          uniform vec3 uNavLightColorPort;
          uniform vec3 uNavLightColorStb;
          uniform float uNavLightPortIntensity;
          uniform float uNavLightStbIntensity;
          uniform float uNavLightFalloff;
        ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #ifdef USE_MAP
                vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                #ifdef DECODE_VIDEO_TEXTURE
                    sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
                #endif
                sampledDiffuseColor.rgb = ((sampledDiffuseColor.rgb - 0.5) * max(uContrast, 0.0) + 0.5) * max(uLuminance, 0.0);
                
                // Allow the color map's built-in alpha channel to be used for transparency
                diffuseColor *= sampledDiffuseColor;
            #endif
            if (uIsPink > 0.5) {
                diffuseColor.rgb = vec3(1.0, 0.078, 0.576); // Hot Pink
                if (diffuseColor.a < 0.1) diffuseColor.a = 0.8; // Graceful fallback alpha
            }
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            
            vec2 safeUv = vec2(0.5);
            #if defined(USE_MAP)
                safeUv = vMapUv;
            #elif defined(USE_UV)
                safeUv = vUv;
            #endif
            
            // FAKE 3D LIGHTING PASS
            float texSpacing = 0.005;
            
            #ifdef USE_ALPHAMAP
                float aC = texture2D(alphaMap, safeUv).g;
                float aR = texture2D(alphaMap, safeUv + vec2(texSpacing * 2.0, 0.0)).g;
                float aU = texture2D(alphaMap, safeUv + vec2(0.0, texSpacing * 2.0)).g;
                vec3 edgeNormal = normalize(vec3((aC - aR) * 10.0, (aC - aU) * 10.0, 0.5));
            #else
                vec3 edgeNormal = vec3(0.0, 0.0, 1.0);
                float aC = 1.0;
            #endif
            
            #ifdef USE_BUMPMAP
                float bC = texture2D(bumpMap, safeUv).r;
                float bR = texture2D(bumpMap, safeUv + vec2(texSpacing, 0.0)).r;
                float bU = texture2D(bumpMap, safeUv + vec2(0.0, texSpacing)).r;
                vec3 bumpNormal = normalize(vec3((bC - bR) * 15.0 * bumpScale, (bC - bU) * 15.0 * bumpScale, 1.0));
                
                float isEdge = smoothstep(1.0, uEdgeThreshold, aC);
                vec3 finalFakeNormal = normalize(mix(bumpNormal, edgeNormal, isEdge));
            #else
                vec3 finalFakeNormal = edgeNormal;
            #endif

            // Inflate entire ship into a 3D bubble/dome normal via U/V mapping
            vec2 uvC = (safeUv - 0.5) * 2.0; 
            vec3 globalNormal = normalize(vec3(uvC.x, uvC.y, 1.5));
            finalFakeNormal = normalize(mix(globalNormal, finalFakeNormal, 0.5));

            // To ensure the shadow always stays exactly on the opposite side of the sun as the ship spins,
            // we project the sun perfectly onto the 2D plane (X and Y) and explicitly discard Z-depth entirely.
            // This guarantees the shadow divides the sprite cleanly like a dial without weird angles or vanishing!
            vec2 sunDir2D = length(uLocalSunDir.xy) > 0.001 ? normalize(uLocalSunDir.xy) : vec2(0.0, 1.0);
            vec3 shadowSunDir = vec3(sunDir2D.x, sunDir2D.y, 0.0);
            float diffMatch = dot(finalFakeNormal, shadowSunDir);
            float diffPositive = max(0.0, diffMatch);

            vec3 viewDir = vec3(0.0, 0.0, 1.0);
            
            vec3 ambientGlow = mix(uRimColor, uEdgeColor, diffPositive) * diffPositive * uEdgeIntensity;

            // Heavily contrasted shadow map using explicit threshold dynamics
            float shadowBlend = smoothstep(uGlobalShadowThreshold - uGlobalShadowSmoothness, uGlobalShadowThreshold + uGlobalShadowSmoothness, diffMatch); 
            
            // Map the shadow tint to multiply over the texture
            vec3 darkSide = gl_FragColor.rgb * uGlobalShadowColor;
            vec3 brightSide = gl_FragColor.rgb * 1.5;
            
            // Mix final color based on the computed gradient and global opacity slider
            vec3 mapColor = mix(darkSide, brightSide, shadowBlend);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mapColor, uGlobalShadowOpacity) + (ambientGlow * aC);

            // --- DIRECTIONAL SIDELIGHT (SPOTLIGHT) ---
            // A localized glow that you can freely position on the ship using X and Y coordinates.
            vec2 spotCenter = vec2(uSpotLightX, uSpotLightY); 
            
            // Calculate a synthetic directional vector from center to the manual spot for proper half-masking!
            vec2 manualSpotDir = length(spotCenter) > 0.001 ? normalize(spotCenter) : vec2(0.0, 1.0);
            
            // Warp the spotlight distance with the normal map to make it contour slightly
            float spotDist = distance(uvC, spotCenter) - (finalFakeNormal.z * 0.05);
            
            // Calculate a spot glow with falloff
            float spotGlow = smoothstep(uSpotLightSize, max(0.0, uSpotLightSize - uSpotLightFalloff), spotDist);
            
            // Mask it strictly to the "lit half" of the ship facing the spotlight!
            float spotSideMask = smoothstep(0.0, 0.4, dot(normalize(uvC), manualSpotDir));
            
            vec3 spotFinal = spotGlow * spotSideMask * uSpotLightColor * uSpotLightIntensity;
            gl_FragColor.rgb += spotFinal * aC;

            // --- SIMULATED ENVIRONMENT REFLECTION LAYER ---
            // A pure, clean glass-like reflection on top of the ship, completely ignoring the gritty bump map.
            vec3 envSunDir = normalize(vec3(uLocalSunDir.x * 0.5, uLocalSunDir.y * 0.5, 1.0));
            vec3 envHalfVector = normalize(envSunDir + vec3(0.0, 0.0, 1.0));
            
            // Apply Anisotropy to stretch the highlight vertically (nose-to-tail)
            float envSquash = mix(1.0, 0.05, uSpecularAnisotropy);
            // Use globalNormal to guarantee perfectly smooth sweeping behavior across the top of the sprite
            vec3 envNormal = normalize(vec3(globalNormal.x, globalNormal.y * envSquash, globalNormal.z));
            
            float envDot = max(0.0, dot(envNormal, envHalfVector));
            
            // Map Shininess slider (1 to 128) to a hard cutoff threshold (0.7 to 0.998)
            float stretchRatio = uSpecularShininess / 128.0;
            float threshold = mix(0.7, 0.998, stretchRatio);
            
            // Create a perfectly sharp, hard-edged glass streak
            float envMatch = smoothstep(threshold - 0.005, threshold + 0.005, envDot);
            
            // Multiply by intensity to ensure it renders as bright glossy glass
            vec3 envSpec = vec3(envMatch * uSpecularIntensity);

            // Add the pure reflection layer on top of everything
            gl_FragColor.rgb += envSpec * aC;

            // --- LIGHTMAP EMISSIVE GLOW ---
            if (uHasLightMap > 0.5) {
                // Sample the crisp texture for the core emission line
                vec4 coreSample = texture2D(uLightMap, safeUv);
                float coreLuma = dot(coreSample.rgb, vec3(0.299, 0.587, 0.114));
                
                // MULTI-TAP MIPMAP SAMPLING FOR REAL-TIME BLUR
                // We sample the texture again but with a high Mipmap Bias (the 3rd argument)
                // This natively forces the GPU to read a lower-resolution, heavily blurred version of the mask!
                // uLightMapGlow (0 to 2) maps to a mipmap bias of 0 to 8
                vec4 blurredSample = texture2D(uLightMap, safeUv, uLightMapGlow * 4.0);
                float bloomLuma = dot(blurredSample.rgb, vec3(0.299, 0.587, 0.114));
                
                // Calculate core threshold based on size and falloff
                float threshold = max(0.001, 1.0 - (uLightMapSize * 0.5));
                float feather = max(0.001, uLightMapFalloff * 0.5);
                
                float coreMask = smoothstep(threshold, threshold + feather, coreLuma);
                vec3 coreFinal = coreMask * uLightMapColor * uLightMapIntensity;
                
                // The bloom mask uses the blurred Luma, boosted by the Bloom slider
                // We use a much softer threshold to let the blur bleed smoothly across the hull
                float bloomMask = smoothstep(0.1, 0.8, bloomLuma);
                vec3 bloomFinal = bloomMask * uLightMapColor * uLightMapBloom;
                
                // Strict noise gate mask on BOTH lumas to prevent background JPEG artifacts
                float strictMask = smoothstep(0.05, 0.15, max(coreLuma, bloomLuma));
                
                gl_FragColor.rgb += (coreFinal + bloomFinal) * strictMask * aC;
            }

            // --- SECONDARY CENTER HIGHLIGHT ---
            // Mask for the center block using the true 3D normal. This allows the mathematical line to bend 
            // and trace the actual physical contours and ridges of the hull!
            float cWidth = uCenterSpecularWidth;
            float contourMask = smoothstep(cWidth, max(0.0, cWidth - uCenterSpecularFalloff), abs(finalFakeNormal.x));
            
            // Multiply by a broad geometric mask so it stays roughly "in the center" without bleeding to the far wings
            float centerMask = contourMask * smoothstep(0.5, 0.2, abs(uvC.x));
            
            // To make it slide up and down but never disappear, we drastically reduce horizontal light tracking
            // acting like the canopy is a perfect vertical cylinder that roughly always faces the light horizontally
            vec3 centerLightDir = normalize(vec3(uLocalSunDir.x * 0.15, uLocalSunDir.y * 1.5, 1.0));
            vec3 centerHalfVector = normalize(centerLightDir + vec3(0.0, 0.0, 1.0));

            // Flatten the X normal heavily so it doesn't fall off horizontally, but use finalFakeNormal 
            // so the light directly interacts with texture contours!
            vec3 centerNormal = normalize(vec3(finalFakeNormal.x * 0.2, finalFakeNormal.y * uCenterSpecularAnisotropy, 1.0));
            float centerDot = max(0.0, dot(centerNormal, centerHalfVector));
            
            // Push threshold even higher for a sharper, glass-like bead of light
            float centerStretchRatio = uCenterSpecularShininess / 128.0;
            float centerThreshold = mix(0.7, 0.999, centerStretchRatio);
            float centerMatch = smoothstep(centerThreshold - 0.01, centerThreshold + 0.01, centerDot);
            
            // Fake Nav Lights Integration
            float distPort = distance(uvC, uNavLightPortPos);
            float distStb = distance(uvC, uNavLightStbPos);
            
            // Soft inverse square falloff with a STRICT cutoff to prevent global ship washout!
            float portMask = smoothstep(0.15, 0.02, distPort);
            float stbMask = smoothstep(0.15, 0.02, distStb);
            float portGlow = (0.01 / (distPort * distPort + uNavLightFalloff)) * uNavLightPortIntensity * portMask;
            float stbGlow = (0.01 / (distStb * distStb + uNavLightFalloff)) * uNavLightStbIntensity * stbMask;
            
            vec3 navLightColor = (portGlow * uNavLightColorPort) + (stbGlow * uNavLightColorStb);
            
            // Stand out slightly more than the primary layer by multiplying intensity
            vec3 centerSpec = vec3(centerMatch * uCenterSpecularIntensity) * centerMask;
            gl_FragColor.rgb += centerSpec * aC;
            gl_FragColor.rgb += navLightColor * aC;

            // --- ROTATION-DRIVEN CANOPY GLARE ---
            // Simulates the intense specular glint of the sun on a curved plane/windshield.
            // Rather than turning on/off based on a mathematical threshold, this physical 2D spotlight 
            // directly glides across the curved surface as the ship's pitch/roll angle changes.
            
            // Scrub the Y position of the glare up and down the sprite using the light's vertical vector
            float glareY = uLocalSunDir.y * -1.5; // Invert to make the light reflection slide correctly against pitch
            float glareX = uLocalSunDir.x * 0.05; // Extremely minimal horizontal slide
            
            // Inject organic contours: physically warp the glint position using the underlying ship normals.
            // This causes the shine to bend and break over bumps rather than staying a perfect straight line!
            vec2 warpedCenter = vec2(glareX, glareY) - (finalFakeNormal.xy * 0.15);
            
            // The dist function evaluates an ellipse: stretched on Y for a longitudinal aircraft streak
            float stretchFactor = max(0.01, uShineStretch);
            float distToGlare = length( vec2(abs(uvC.x - warpedCenter.x), abs(uvC.y - warpedCenter.y) * stretchFactor) );
            
            // Sharp falloff creates that blinding "glass edge" intensity
            float glareSpot = smoothstep(uShineWidth, uShineWidth * 0.3, distToGlare);
            
            // Add an ultra-sharp, thin inner core for the hottest part of the glint
            float glareCore = smoothstep(uShineWidth * 0.2, 0.0, distToGlare);
            
            // Constrain this to purely the middle spine/canopy of the ship
            float spineMask = smoothstep(0.12, 0.02, abs(uvC.x));
            
            vec3 finalGlare = vec3(1.0) * (glareSpot * 0.6 + glareCore * 1.5) * uShineIntensity * spineMask;
            
            gl_FragColor.rgb += finalGlare * aC;

            // --- TUNNEL MOTION LAYER ---
            float rad = uMotionRotation * 3.14159265 / 180.0;
            vec2 centeredUv = safeUv - 0.5;
            float rotatedY = centeredUv.x * sin(rad) + centeredUv.y * cos(rad) + 0.5;
            float warpedY = rotatedY + (finalFakeNormal.y * 0.1) + (abs(finalFakeNormal.x) * 0.1);
            float signal = fract(warpedY * uMotionFrequency + uMotionOffset);
            float d = abs(signal - 0.5) * 2.0;
            float edge = 1.0 - uMotionWidth;
            float motionMask = smoothstep(edge - uMotionFalloff, edge, d);
            float edgeCatch = smoothstep(0.0, 1.0, abs(finalFakeNormal.x) + 0.2); 
            vec3 finalMotionLayer = vec3(motionMask * edgeCatch) * uMotionColor * uMotionIntensity * uMotionOpacity;
            gl_FragColor.rgb += finalMotionLayer * aC;

            `
        );
        this.userData.shader = shader;
    };
    const planeModel = new THREE.Mesh(planeGeo, planeMat);
    planeModel.userData.currentTextures = { map: null, alphaMap: null, bumpMap: null };
    planeModel.name = 'planeModel';
    planeModel.renderOrder = 2;
    shipChassis.add(planeModel);

    const underbellyMat = planeMat.clone();
    underbellyMat.color = new THREE.Color(0.2, 0.2, 0.2);
    const underbellyPlane = new THREE.Mesh(planeGeo, underbellyMat);
    underbellyPlane.name = 'underbellyPlane';
    underbellyPlane.renderOrder = 1;
    shipChassis.add(underbellyPlane);

    const MAX_ENGINES = 20;
    planeModel.userData.engineGeo = new THREE.PlaneGeometry(16, 6);
    const throttleArray = new Float32Array(MAX_ENGINES);
    planeModel.userData.engineGeo.setAttribute('aThrottle', new THREE.InstancedBufferAttribute(throttleArray, 1));

    planeModel.userData.engineMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
          uTime: { value: 0.0 },
          uEngineColor1: { value: new THREE.Color('#ff0055') },
          uEngineColor2: { value: new THREE.Color('#00ffaa') },
          uEngineColor3: { value: new THREE.Color('#0088ff') },
          uEngineCycleSpeed: { value: 1.0 }
      },
      vertexShader: `
        attribute float aThrottle;
        varying vec2 vUv;
        varying float vThrottle;
        varying vec3 vInstanceColor;
        void main() {
          vUv = uv;
          vThrottle = aThrottle;
          vInstanceColor = instanceColor;
          vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vThrottle;
        varying vec3 vInstanceColor;
        
        void main() {
          vec2 p = vUv * 2.0 - 1.0; 
          float arcY = p.y - p.x * p.x * 0.4;
          
          float d = abs(arcY);
          float core = smoothstep(0.4, 0.0, d);
          float edge = smoothstep(0.7, 0.5, d) - core;
          
          float xFade = smoothstep(1.0, 0.8, abs(p.x));
          
          vec3 activeColor = vInstanceColor;
          
          vec3 idleColor = mix(activeColor, vec3(0.1), 0.5);
          vec3 baseColor = mix(idleColor, activeColor, vThrottle);
          vec3 finalColor = edge * baseColor + core * mix(baseColor, vec3(1.0), vThrottle);
          
          float alpha = (edge + core) * xFade;
          gl_FragColor = vec4(finalColor * alpha, alpha * (0.3 + (vThrottle * 0.7)));
        }
      `
    });
    
    // Add shader userData to allow applyFlightLightingToShip to update uniforms!
    planeModel.userData.engineMat.userData = { shader: planeModel.userData.engineMat };

    const engineInstancedMesh = new THREE.InstancedMesh(planeModel.userData.engineGeo, planeModel.userData.engineMat, MAX_ENGINES);
    const colorArray = new Float32Array(MAX_ENGINES * 3);
    for (let i = 0; i < MAX_ENGINES; i++) {
        colorArray[i * 3] = 1.0;
        colorArray[i * 3 + 1] = 0.0;
        colorArray[i * 3 + 2] = 0.33;
    }
    engineInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    engineInstancedMesh.count = 0;
    engineInstancedMesh.name = 'engineInstancedMesh';
    planeModel.add(engineInstancedMesh);
    planeModel.userData.engineInstancedMesh = engineInstancedMesh;

    // Create the physical glowing reactor nozzle
    planeModel.userData.reactorGeo = new THREE.CircleGeometry(1.5, 32);
    planeModel.userData.reactorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const reactorInstancedMesh = new THREE.InstancedMesh(planeModel.userData.reactorGeo, planeModel.userData.reactorMat, MAX_ENGINES);
    reactorInstancedMesh.count = 0;
    reactorInstancedMesh.name = 'reactorInstancedMesh';
    reactorInstancedMesh.position.z = 0.5; // Slight Z elevation so it renders visually ON TOP of the chassis
    planeModel.add(reactorInstancedMesh);
    planeModel.userData.reactorInstancedMesh = reactorInstancedMesh;

    // --- AURA LAYER ---
    const auraGeo = new THREE.PlaneGeometry(100, 100, 1, 1);
    const auraMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
         uColor: { value: new THREE.Color() },
         uBlur: { value: 0.0 },
         uOpacity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uBlur;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec2 c = vUv - 0.5;
          vec2 d = abs(c * 2.0); // 0 to 1 outward
          float blur = max(0.001, uBlur);
          float maxX = smoothstep(1.0, 1.0 - blur, d.x);
          float maxY = smoothstep(1.0, 1.0 - blur, d.y);
          float alpha = maxX * maxY * uOpacity;
          gl_FragColor = vec4(uColor * alpha, alpha);
        }
      `
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.name = 'auraMesh';
    auraMesh.position.z = -0.2; // Slides structurally beneath the ship mesh
    auraMesh.renderOrder = 1;
    shipGroup.add(auraMesh);
    
    (shipGroup as any).userData = {
        auraMesh,
        planeModel,
        underbellyPlane,
        engineInstancedMesh,
        reactorInstancedMesh,
        engLight
    };

    return shipGroup;
}
