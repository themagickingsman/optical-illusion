"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function NexusMetaballs({
  showUI = true,
  showFullscreenBtn = true,
  heroOrbOnly = false,
}: {
  showUI?: boolean;
  showFullscreenBtn?: boolean;
  heroOrbOnly?: boolean;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const canvasParent = document.getElementById("website-canvas") || document.body;

    let uiContainer: HTMLDivElement | null = null;
    if (showUI) {
      uiContainer = document.getElementById("nexus-ui-root") as HTMLDivElement;
      if (!uiContainer) {
        uiContainer = document.createElement("div");
        uiContainer.id = "nexus-ui-root";
        uiContainer.style.cssText = "position: absolute; bottom: 20px; right: 20px; z-index: 2000000; pointer-events: none; display: flex; flex-direction: column; gap: 10px; align-items: flex-end;";
        canvasParent.appendChild(uiContainer);
      }
    }
    let scene: THREE.Scene, camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial;
    let clock: THREE.Clock;
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let animationFrameId: number;
    let pane: any = null;
    let fpsBadgeRef: HTMLDivElement | null = null;
    let lastFpsDisplay = -1;
    let heroTargetX = 0;
    let heroTargetY = 0;
    // Canvas ref for CSS blur (set in init)
    let canvasEl: HTMLCanvasElement | null = null;
    let canvasBlur = 0; // px — smooths half-res upscale edges
    // Autonomous floating sphere
    let floatSpherePos = new THREE.Vector3(0, 0, 0);
    // Stable home positions for animated blobs — updated only on randomize, never during render loop
    let cornerHomes = [
      { x: 0.08, y: 0.92 }, // A1 (default TL)
      { x: 0.25, y: 0.72 }, // A2
      { x: 0.92, y: 0.08 }, // B1 (default BR)
      { x: 0.72, y: 0.25 }, // B2
    ];
    let pos5HomeX = 0.5, pos5HomeY = 0.25;
    let pos6HomeX = 0.5, pos6HomeY = 0.6;
    let pos7HomeX = 0.4, pos7HomeY = 0.5;

    // Entity blob fade system — each slot has a target radius and a current radius.
    // The render loop lerps current toward target so blobs dissolve smoothly instead
    // of popping when a ship leaves the SYNC event (death / off-screen).
    const ENTITY_SLOTS = 32;
    const entityTargetR  = new Array(ENTITY_SLOTS).fill(0);
    const entityCurrentR = new Array(ENTITY_SLOTS).fill(0);
    // Lerp factor per frame: 0.88 ≈ 20-frame dissolve at 60fps (~330ms)
    const ENTITY_FADE_K = 0.88;

    let lightingMode = (window as any).__nexusLightingMode || 'default';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isLowPowerDevice = isMobile || navigator.hardwareConcurrency <= 4;
    // Force devicePixelRatio to 1 so that renderScale is the sole multiplier.
    // This allows renderScale = 2.0 to be native Retina (2x) instead of a crushed 4x.
    const devicePixelRatio = 1;
    // Render scale — user adjustable via preferences (0.25–4.0)
    let renderScale = 1.0;

    const presets = {
      moody: { sphereCount: isMobile ? 4 : 6, ambientIntensity: 0.02, diffuseIntensity: 0.6, specularIntensity: 1.8, specularPower: 8, fresnelPower: 1.2, backgroundColor: new THREE.Color(0x050505), sphereColor: new THREE.Color(0x000000), lightColor: new THREE.Color(0xffffff), lightPosition: new THREE.Vector3(1, 1, 1), smoothness: 0.3, contrast: 2.0, fogDensity: 0.12, cursorGlowIntensity: 0.4, cursorGlowRadius: 1.2, cursorGlowColor: new THREE.Color(0xffffff) },
      cosmic: { sphereCount: isMobile ? 5 : 8, ambientIntensity: 0.03, diffuseIntensity: 0.8, specularIntensity: 1.6, specularPower: 6, fresnelPower: 1.4, backgroundColor: new THREE.Color(0x000011), sphereColor: new THREE.Color(0x000022), lightColor: new THREE.Color(0x88aaff), lightPosition: new THREE.Vector3(0.5, 1, 0.5), smoothness: 0.4, contrast: 2.0, fogDensity: 0.15, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.5, cursorGlowColor: new THREE.Color(0x4477ff) },
      minimal: { sphereCount: isMobile ? 2 : 3, ambientIntensity: 0.0, diffuseIntensity: 0.25, specularIntensity: 1.3, specularPower: 11, fresnelPower: 1.7, backgroundColor: new THREE.Color(0x0a0a0a), sphereColor: new THREE.Color(0x000000), lightColor: new THREE.Color(0xffffff), lightPosition: new THREE.Vector3(1, 0.5, 0.8), smoothness: 0.25, contrast: 2.0, fogDensity: 0.1, cursorGlowIntensity: 0.3, cursorGlowRadius: 1.0, cursorGlowColor: new THREE.Color(0xffffff) },
      vibrant: { sphereCount: isMobile ? 6 : 10, ambientIntensity: 0.05, diffuseIntensity: 0.9, specularIntensity: 1.5, specularPower: 5, fresnelPower: 1.3, backgroundColor: new THREE.Color(0x0a0505), sphereColor: new THREE.Color(0x110000), lightColor: new THREE.Color(0xff8866), lightPosition: new THREE.Vector3(0.8, 1.2, 0.6), smoothness: 0.5, contrast: 2.0, fogDensity: 0.08, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.3, cursorGlowColor: new THREE.Color(0xff6644) },
      neon: { sphereCount: isMobile ? 4 : 7, ambientIntensity: 0.04, diffuseIntensity: 1.0, specularIntensity: 2.0, specularPower: 4, fresnelPower: 1.0, backgroundColor: new THREE.Color(0x000505), sphereColor: new THREE.Color(0x000808), lightColor: new THREE.Color(0x00ffcc), lightPosition: new THREE.Vector3(0.7, 1.3, 0.8), smoothness: 0.7, contrast: 2.0, fogDensity: 0.08, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.4, cursorGlowColor: new THREE.Color(0x00ffaa) },
      sunset: { sphereCount: isMobile ? 3 : 5, ambientIntensity: 0.04, diffuseIntensity: 0.7, specularIntensity: 1.4, specularPower: 7, fresnelPower: 1.5, backgroundColor: new THREE.Color(0x150505), sphereColor: new THREE.Color(0x100000), lightColor: new THREE.Color(0xff6622), lightPosition: new THREE.Vector3(1.2, 0.4, 0.6), smoothness: 0.35, contrast: 2.0, fogDensity: 0.1, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.4, cursorGlowColor: new THREE.Color(0xff4422) },
      midnight: { sphereCount: isMobile ? 3 : 4, ambientIntensity: 0.01, diffuseIntensity: 0.4, specularIntensity: 1.6, specularPower: 9, fresnelPower: 1.8, backgroundColor: new THREE.Color(0x000010), sphereColor: new THREE.Color(0x000015), lightColor: new THREE.Color(0x4466ff), lightPosition: new THREE.Vector3(0.9, 0.8, 1.0), smoothness: 0.28, contrast: 2.0, fogDensity: 0.14, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.6, cursorGlowColor: new THREE.Color(0x3355ff) },
      toxic: { sphereCount: isMobile ? 5 : 9, ambientIntensity: 0.06, diffuseIntensity: 0.85, specularIntensity: 1.7, specularPower: 6, fresnelPower: 1.1, backgroundColor: new THREE.Color(0x001000), sphereColor: new THREE.Color(0x001500), lightColor: new THREE.Color(0x66ff44), lightPosition: new THREE.Vector3(0.6, 1.1, 0.7), smoothness: 0.55, contrast: 2.0, fogDensity: 0.09, cursorGlowIntensity: 0.8, cursorGlowRadius: 1.7, cursorGlowColor: new THREE.Color(0x44ff22) },
      pastel: { sphereCount: isMobile ? 4 : 6, ambientIntensity: 0.08, diffuseIntensity: 0.5, specularIntensity: 1.2, specularPower: 12, fresnelPower: 2.0, backgroundColor: new THREE.Color(0x101018), sphereColor: new THREE.Color(0x080814), lightColor: new THREE.Color(0xaabbff), lightPosition: new THREE.Vector3(1.0, 0.7, 0.9), smoothness: 0.38, contrast: 1.8, fogDensity: 0.07, cursorGlowIntensity: 0.35, cursorGlowRadius: 1.1, cursorGlowColor: new THREE.Color(0x8899ff) },
      dithered: { sphereCount: isMobile ? 5 : 8, ambientIntensity: 0.1, diffuseIntensity: 0.8, specularIntensity: 1.5, specularPower: 6, fresnelPower: 1.2, backgroundColor: new THREE.Color(0x0a0520), sphereColor: new THREE.Color(0x000000), lightColor: new THREE.Color(0xff00ff), lightPosition: new THREE.Vector3(0.8, 0.8, 0.8), smoothness: 0.6, contrast: 1.8, fogDensity: 0.05, cursorGlowIntensity: 1.0, cursorGlowRadius: 2.0, cursorGlowColor: new THREE.Color(0x00ffff) },
      holographic: { sphereCount: isMobile ? 4 : 6, ambientIntensity: 0.12, diffuseIntensity: 1.2, specularIntensity: 2.5, specularPower: 3, fresnelPower: 0.8, backgroundColor: new THREE.Color(0xffffff), sphereColor: new THREE.Color(0x050510), lightColor: new THREE.Color(0xccaaff), lightPosition: new THREE.Vector3(0.9, 0.9, 1.2), smoothness: 0.8, contrast: 1.6, fogDensity: 0.06, cursorGlowIntensity: 1.2, cursorGlowRadius: 2.2, cursorGlowColor: new THREE.Color(0xaa77ff) },
      studio: { sphereCount: isMobile ? 5 : 8, ambientIntensity: 0.5, diffuseIntensity: 0.0, specularIntensity: 3.0, specularPower: 1.0, fresnelPower: 2.7, backgroundColor: new THREE.Color(0xffffff), sphereColor: new THREE.Color(0xb829e3), lightColor: new THREE.Color(0xffe5ff), lightPosition: new THREE.Vector3(1.0, 1.2, 1.0), smoothness: 0.99, contrast: 3.5, fogDensity: 0.115, cursorGlowIntensity: 1.4, cursorGlowRadius: 2.4, cursorGlowColor: new THREE.Color(0xff88ff) }
    };

    const settings = {
      preset: "studio",
      ...presets.studio,
      fixedTopLeftRadius: 1.0,
      fixedBottomRightRadius: 1.3,
      smallTopLeftRadius: 0.55,
      smallBottomRightRadius: 0.6,
      cursorRadiusMin: 0.08,
      cursorRadiusMax: 0.15,
      animationSpeed: 0.6,
      movementScale: 1.6,
      mouseSmoothness: 0.1,
      mergeDistance: 2.0,
      mouseProximityEffect: true,
      minMovementScale: 0.3,
      maxMovementScale: 1.0,
      pos1: {x: 0.0, y: 1.0},
      pos2: {x: 0.25, y: 0.72},
      pos3: {x: 0.92, y: 0.08},
      pos4: {x: 0.72, y: 0.25},
      seed: 0.0
    };

    const randomizeSettings = () => {
      settings.fixedTopLeftRadius = 0.8 + Math.random() * 0.6;
      settings.smallTopLeftRadius = 0.8 + Math.random() * 0.6;
      settings.fixedBottomRightRadius = 0.4 + Math.random() * 1.2;
      settings.smallBottomRightRadius = 0.2 + Math.random() * 0.6;
      settings.seed = Math.random() * 1000.0;
      
      cornerHomes[0] = { x: 0.0 + Math.random() * 0.1, y: 0.9 + Math.random() * 0.1 };
      cornerHomes[1] = { x: 0.9 + Math.random() * 0.1, y: 0.9 + Math.random() * 0.1 };
      cornerHomes[2] = { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.3 };
      cornerHomes[3] = { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.3 };

      pos5HomeX = 0.15 + Math.random() * 0.70; pos5HomeY = 0.15 + Math.random() * 0.70;
      pos6HomeX = 0.25 + Math.random() * 0.50; pos6HomeY = 0.25 + Math.random() * 0.50;
      pos7HomeX = 0.30 + Math.random() * 0.40; pos7HomeY = 0.30 + Math.random() * 0.40;

      if (material) {
        material.uniforms.uFixedTopLeftRadius.value    = settings.fixedTopLeftRadius;
        material.uniforms.uSmallTopLeftRadius.value    = settings.smallTopLeftRadius;
        material.uniforms.uFixedBottomRightRadius.value = settings.fixedBottomRightRadius;
        material.uniforms.uSmallBottomRightRadius.value = settings.smallBottomRightRadius;
        material.uniforms.uPos1.value.set(cornerHomes[0].x, cornerHomes[0].y);
        material.uniforms.uPos2.value.set(cornerHomes[1].x, cornerHomes[1].y);
        material.uniforms.uPos3.value.set(cornerHomes[2].x, cornerHomes[2].y);
        material.uniforms.uPos4.value.set(cornerHomes[3].x, cornerHomes[3].y);
        material.uniforms.uPos5.value.set(pos5HomeX, pos5HomeY);
        material.uniforms.uPos5Radius.value = 0.35 + Math.random() * 0.65;
        material.uniforms.uPos6.value.set(pos6HomeX, pos6HomeY);
        material.uniforms.uPos6Radius.value = 0.3 + Math.random() * 0.6;
        material.uniforms.uPos7.value.set(pos7HomeX, pos7HomeY);
        material.uniforms.uPos7Radius.value = 0.4 + Math.random() * 0.4;
        material.uniforms.uSeed.value = settings.seed;
      }
      
      if (uiContainer) {
        uiContainer.querySelectorAll('input[type=range]').forEach((el: any) => el.dispatchEvent(new Event('refresh')));
      }
    };

    function init() {
      // Remove any stale canvas from a previous mount (React StrictMode or hot-reload)
      while (container && container.firstChild) {
        container.removeChild(container.firstChild);
      }
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;
      clock = new THREE.Clock();

      renderer = new THREE.WebGLRenderer({
        antialias: false,           // disabled — upscale blur masks it anyway
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
        premultipliedAlpha: false
      });

      // Render at device pixel ratio, strictly capped at 1.5 for performance
      // since the raymarching shader is incredibly heavy on Retina displays (2.0 dpr).
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

      // Use container's actual bounding rect so the orb is always round
      // regardless of whether the container fills the full window or not.
      const rect = container ? container.getBoundingClientRect() : null;
      const viewportWidth  = rect ? Math.max(rect.width,  1) : window.innerWidth;
      const viewportHeight = rect ? Math.max(rect.height, 1) : window.innerHeight;
      // ── Half-resolution: render at 55% linear (≈30% pixel count) ──────────
      const renderW = Math.floor(viewportWidth  * renderScale);
      const renderH = Math.floor(viewportHeight * renderScale);
      renderer.setSize(renderW, renderH, false); // false = don't set CSS size
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const canvas = renderer.domElement;
      canvasEl = canvas;
      canvas.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 0 !important;
        display: block !important;
        pointer-events: none;
        image-rendering: auto;
        filter: blur(${canvasBlur}px);
      `;
      if (container) container.appendChild(canvas);

      material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(viewportWidth, viewportHeight) },
          uActualResolution: { value: new THREE.Vector2(renderW, renderH) },
          uPixelRatio: { value: devicePixelRatio },
          uCameraSway: { value: new THREE.Vector2(0, 0) },
          uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
          uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
          uCursorRadius: { value: settings.cursorRadiusMin },
          uSphereCount: { value: settings.sphereCount },
          // Arena entity blobs — populated each frame from SYNC_NEXUS_CURSOR
          uEntities: { value: Array.from({ length: 32 }, () => new THREE.Vector3(0, 0, 0)) },
          uEntityCount: { value: 0 },
          uFixedTopLeftRadius: { value: settings.fixedTopLeftRadius },
          uFixedBottomRightRadius: { value: settings.fixedBottomRightRadius },
          uSmallTopLeftRadius: { value: settings.smallTopLeftRadius },
          uSmallBottomRightRadius: { value: settings.smallBottomRightRadius },
          uPos1: { value: new THREE.Vector2(settings.pos1.x, settings.pos1.y) },
          uPos2: { value: new THREE.Vector2(settings.pos2.x, settings.pos2.y) },
          uPos3: { value: new THREE.Vector2(settings.pos3.x, settings.pos3.y) },
          uPos4: { value: new THREE.Vector2(settings.pos4.x, settings.pos4.y) },
          uPos5: { value: new THREE.Vector2(0.5, 0.5) },
          uPos5Radius: { value: 0.7 },
          uPos6: { value: new THREE.Vector2(0.45, 0.45) },
          uPos6Radius: { value: 0.5 },
          uPos7: { value: new THREE.Vector2(0.5, 0.5) },
          uPos7Radius: { value: 0.6 },
          uMergeDistance: { value: settings.mergeDistance },
          uSmoothness: { value: settings.smoothness },
          uAmbientIntensity: { value: settings.ambientIntensity },
          uDiffuseIntensity: { value: settings.diffuseIntensity },
          uSpecularIntensity: { value: settings.specularIntensity },
          uSpecularPower: { value: settings.specularPower },
          uFresnelPower: { value: settings.fresnelPower },
          uBackgroundColor: { value: settings.backgroundColor },
          uSphereColor: { value: settings.sphereColor },
          uLightColor: { value: settings.lightColor },
          uLightPosition: { value: settings.lightPosition },
          uContrast: { value: settings.contrast },
          uFogDensity: { value: settings.fogDensity },
          uAnimationSpeed: { value: settings.animationSpeed },
          uMovementScale: { value: settings.movementScale },
          uMouseProximityEffect: { value: settings.mouseProximityEffect },
          uMinMovementScale: { value: settings.minMovementScale },
          uMaxMovementScale: { value: settings.maxMovementScale },
          uCursorGlowIntensity: { value: settings.cursorGlowIntensity },
          uCursorGlowRadius: { value: settings.cursorGlowRadius },
          uCursorGlowColor: { value: settings.cursorGlowColor },
          uIsSafari: { value: isSafari ? 1.0 : 0.0 },
          uIsMobile: { value: isMobile ? 1.0 : 0.0 },
          uIsLowPower: { value: isLowPowerDevice ? 1.0 : 0.0 },
          uSeed: { value: settings.seed },
          // Hero orb — blue glowing orb that passes through the field
          uHeroOrb: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
          uHeroOrbRadius: { value: 0.45 },
          // Hero orb appearance controls — exposed to NexusCore for live tuning
          uHeroOrbColor:        { value: new THREE.Vector3(0.15, 0.55, 1.0) },
          uHeroCoreIntensity:   { value: 1.3  },
          uHeroHaloIntensity:   { value: 0.6  },
          uHeroAtmoIntensity:   { value: 0.10 },
          uHeroFresnelScale:    { value: 1.4  },
          uHeroRimGlow:         { value: 0.0  }, // rim band (both sides)
          uHeroOuterRimGlow:    { value: 3.0  }, // glow OUTSIDE the orb surface only
          // Hero orb background backlight — the wide atmospheric bloom behind the orb
          uHeroBacklightColor:    { value: new THREE.Vector3(0.12, 0.48, 1.0) },
          uHeroBacklightStrength: { value: 1.0 },
          uHeroBacklightSpread:   { value: 900.0 }, // px equivalent at y-resolution
          // Satellite orbit control
          uSatelliteOrbitScale: { value: 1.0  },
          uSatelliteSize:       { value: 0.09 }, // blob radius of each satellite
          uSatelliteSpeed:      { value: 1.0  }, // orbit speed multiplier
          // Per-entity ship colors — RGB matching each ship's team color
          uEntityColors: { value: Array.from({ length: 32 }, () => new THREE.Vector3(0.0, 0.53, 1.0)) },
          // Traversing asteroid metaballs (MID + BACK layers as WebGL travelers)
          uTravelerCount:  { value: 0 },
          uTravelers:      { value: Array.from({ length: 30 }, () => new THREE.Vector3(0, 9999, 0)) },
          uTravelerColors: { value: Array.from({ length: 30 }, () => new THREE.Vector3(0.15, 0.55, 1.0)) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;  // mediump on all devices — saves ~10% ALU cost
          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec2 uActualResolution;
          uniform float uPixelRatio;
          uniform vec2 uCameraSway;
          uniform vec2 uMousePosition;
          uniform vec3 uCursorSphere;
          uniform float uCursorRadius;
          uniform int uSphereCount;
          uniform float uFixedTopLeftRadius;
          uniform float uFixedBottomRightRadius;
          uniform float uSmallTopLeftRadius;
          uniform float uSmallBottomRightRadius;
          uniform float uMergeDistance;
          uniform float uSmoothness;
          uniform float uAmbientIntensity;
          uniform float uDiffuseIntensity;
          uniform float uSpecularIntensity;
          uniform float uSpecularPower;
          uniform float uFresnelPower;
          uniform vec3 uBackgroundColor;
          uniform vec3 uSphereColor;
          uniform vec3 uLightColor;
          uniform vec3 uLightPosition;
          uniform float uContrast;
          uniform float uFogDensity;
          uniform float uAnimationSpeed;
          uniform float uMovementScale;
          uniform bool uMouseProximityEffect;
          uniform float uMinMovementScale;
          uniform float uMaxMovementScale;
          uniform float uCursorGlowIntensity;
          uniform float uCursorGlowRadius;
          uniform vec3 uCursorGlowColor;
          uniform float uIsSafari;
          uniform float uIsMobile;
          uniform float uIsLowPower;
          uniform vec2 uPos1;
          uniform vec2 uPos2;
          uniform vec2 uPos3;
          uniform vec2 uPos4;
          uniform vec2 uPos5;
          uniform float uPos5Radius;
          uniform vec2 uPos6;
          uniform float uPos6Radius;
          uniform vec2 uPos7;
          uniform float uPos7Radius;
          uniform float uSeed;
          // Hero orb — blue glowing orb that passes through the field
          uniform vec3  uHeroOrb;            // world-space position
          uniform float uHeroOrbRadius;
          uniform vec3  uHeroOrbColor;       // RGB emission colour
          uniform float uHeroCoreIntensity;
          uniform float uHeroHaloIntensity;
          uniform float uHeroAtmoIntensity;
          uniform float uHeroFresnelScale;
          uniform float uHeroRimGlow;        // rim band (both sides of surface)
          uniform float uHeroOuterRimGlow;   // outer-only glow (outside surface)
          uniform vec3  uHeroBacklightColor;  // colour of the wide bloom behind the orb
          uniform float uHeroBacklightStrength; // intensity multiplier (0 = off)
          uniform float uHeroBacklightSpread;   // radius in px at y-resolution
          uniform float uSatelliteOrbitScale;
          // Arena entities: ships & missiles as live metaball blobs
          uniform vec3 uEntities[32]; // (shaderX, shaderY, radius)
          uniform int  uEntityCount;
          // Per-entity ship color (RGB, pre-parsed from hex on CPU side)
          uniform vec3 uEntityColors[32];
          // Traversing asteroid metaballs
          uniform int  uTravelerCount;
          uniform vec3 uTravelers[30];       // (worldX, worldY, radius)
          uniform vec3 uTravelerColors[30];

          varying vec2 vUv;
          const float PI    = 3.14159265359;
          const float PHI   = 1.61803398875;   // Golden Ratio — Cosmic Compass Level 1
          const float SCH   = 7.83;             // Schumann Resonance — Cosmic Compass Level 80
          const float EPSILON = 0.001;
          const float MAX_DIST = 100.0;

          // ── φ-Halton sequence (replaces sin-hash — no transcendental cost) ───────
          // Halton base-φ: each sphere i gets a deterministic, well-distributed offset.
          // Cosmic Compass Level 1: Math Base φ
          float haltonPhi(float i) {
            float f = 1.0; float r = 0.0;
            float base = PHI;
            for (int j = 0; j < 8; j++) {
              f = f / base;
              r = r + f * mod(i, base);
              i = floor(i / base);
            }
            return fract(r + uSeed * 0.001);
          }

          float smin(float a, float b, float k) {
            float h = max(k - abs(a - b), 0.0) / k;
            return min(a, b) - h * h * k * 0.25;
          }

          float smax(float a, float b, float k) {
            float h = max(k - abs(a - b), 0.0) / k;
            return max(a, b) + h * h * k * 0.25;
          }

          float sdSphere(vec3 p, float r) { return length(p) - r; }

          vec3 screenToWorld(vec2 n) {
            vec2 uv = n * 2.0 - 1.0;
            uv.x *= uResolution.x / uResolution.y;
            return vec3(uv * 2.0, 0.0);
          }

          // ── Full SDF + analytical gradient in one pass ────────────────────────────
          // Returns vec4(sdf, dSDF/dx, dSDF/dy, dSDF/dz)
          // Avoids 6 extra sceneSDF calls that calcNormal previously needed
          vec4 sceneSDFGrad(vec3 pos) {
            // Fixed blobs
            vec3 p1 = screenToWorld(uPos1);
            vec3 p2 = screenToWorld(uPos2);
            vec3 p3 = screenToWorld(uPos3);
            vec3 p4 = screenToWorld(uPos4);

            vec3 d1v = pos - p1; float d1 = length(d1v) - uFixedTopLeftRadius;
            vec3 d2v = pos - p2; float d2 = length(d2v) - uSmallTopLeftRadius;
            vec3 d3v = pos - p3; float d3 = length(d3v) - uFixedBottomRightRadius;
            vec3 d4v = pos - p4; float d4 = length(d4v) - uSmallBottomRightRadius;

            // 5th independent blob
            vec3 p5 = screenToWorld(uPos5);
            vec3 d5v = pos - p5; float d5 = length(d5v) - uPos5Radius;
            // 6th center-range blob
            vec3 p6 = screenToWorld(uPos6);
            vec3 d6v = pos - p6; float d6 = length(d6v) - uPos6Radius;
            // 7th medium blob near center
            vec3 p7 = screenToWorld(uPos7);
            vec3 d7v = pos - p7; float d7 = length(d7v) - uPos7Radius;

            // Dynamic movement scale driven by Schumann/φ harmonics
            // Cosmic Compass: Planetary (7.83) × φ gives a resonant oscillation
            float t = uTime * uAnimationSpeed;
            float dynamicScale = uMovementScale;
            if (uMouseProximityEffect) {
              float dc = length(uMousePosition - vec2(0.5)) * 2.0;
              dynamicScale = mix(uMinMovementScale, uMaxMovementScale, smoothstep(0.0, 1.0, dc));
            }

            // Start accumulating field + gradient
            // Group the two fixed pairs first
            // Analytical smin gradient: ∂smin/∂a = smoothstep contribution
            float topGroup = smin(d1, d2, 0.4);
            float btmGroup = smin(d3, d4, 0.4);
            float result   = smin(topGroup, btmGroup, 0.3);
            result         = smin(result, d5, 0.35);
            result         = smin(result, d6, 0.35);
            result         = smin(result, d7, 0.35);
            vec3 gradFixed = normalize(pos - p1) * 0.5 + normalize(pos - p2) * 0.3
                           + normalize(pos - p3) * 0.5 + normalize(pos - p4) * 0.3
                           + normalize(pos - p5) * 0.4 + normalize(pos - p6) * 0.4
                           + normalize(pos - p7) * 0.4;

            // Cap at 6 desktop / 3 mobile — halton gives good distribution even with fewer spheres
            int maxIter = uIsMobile > 0.5 ? 3 : min(uSphereCount, 6);
            vec3 gradDyn = vec3(0.0);

            for (int i = 0; i < 10; i++) {
              if (i >= maxIter) break;
              float fi = float(i);

              // φ-Halton replaces 4× sin() hash — Cosmic Compass Level 1
              float r1 = fract(haltonPhi(fi * 1.0));
              float r2 = fract(haltonPhi(fi * 2.0 + 7.0));
              float r3 = fract(haltonPhi(fi * 3.0 + 13.0));
              float r4 = fract(haltonPhi(fi * 5.0 + 23.0));

              // Schumann resonance (7.83) drives the base time harmonic
              // φ modulates the secondary frequency — Levels 1 & 80
              float speed  = (0.2 + r1 * 0.4) * (SCH / 10.0);
              float radius = 0.08 + r2 * 0.12;
              float orbit  = (0.2 + r3 * 0.4) * dynamicScale * uSatelliteOrbitScale;
              float phase  = r4 * PI * 2.0;

              float distToCursor = length(uCursorSphere);
              orbit *= 1.0 + (1.0 - smoothstep(0.0, 1.0, distToCursor)) * 0.5;

              vec3 offset = vec3(
                sin(t * speed + phase)            * orbit * (0.6 + r1 * 0.4),
                cos(t * speed / PHI + phase * PHI) * orbit * (0.5 + r2 * 0.5),
                sin(t * speed * 0.5 + phase)       * 0.3
              );

              vec3 toCursor = uCursorSphere - offset;
              float cd = length(toCursor);
              if (cd < uMergeDistance && cd > 0.0) {
                offset += normalize(toCursor) * ((1.0 - cd / uMergeDistance) * 0.3);
              }

              vec3 dp = pos - offset;
              float ms = sdSphere(dp, radius);
              float blend = cd < uMergeDistance
                ? mix(0.05, uSmoothness, pow(1.0 - cd / uMergeDistance, 3.0))
                : 0.05;
              result = smin(result, ms, blend);

              // Accumulate analytical gradient contribution
              float dpLen = length(dp);
              if (dpLen > 0.001) gradDyn += normalize(dp) * (1.0 / max(ms * ms + 0.01, 0.01));
            }

            // Cursor ball
            vec3 dcv = pos - uCursorSphere;
            float dcBall = sdSphere(dcv, uCursorRadius);
            result = smin(result, dcBall, uSmoothness);

            // ── Hero orb — now that we drive it, we want it to heavily stretch the fluid!
            // Increased 'k' from 0.05 to 0.45 to create thick string-cheese viscosity.
            vec3 heroV = pos - uHeroOrb;
            float heroD = sdSphere(heroV, uHeroOrbRadius);
            result = smin(result, heroD, 0.45);

            // Traversing asteroid metaballs (MID + BACK)
            int tCount = min(uTravelerCount, 30);
            for (int ti = 0; ti < 30; ti++) {
              if (ti >= tCount) break;
              vec3 tv = pos - vec3(uTravelers[ti].xy, 0.0);
              float td = length(tv) - uTravelers[ti].z;
              result = smin(result, td, 0.09);
            }

            // Arena entities: Missiles
            // Each missile blends with the background independently so they do not merge with each other
            float bg = result;
            float finalResult = bg;
            for (int ei = 1; ei < 32; ei++) {
              if (uEntities[ei].z > 0.0) {
                vec3 ev = pos - uEntities[ei];
                float ed = length(ev) - uEntities[ei].z;
                float singleMissileBlend = smin(bg, ed, 0.65);
                finalResult = min(finalResult, singleMissileBlend);
              }
            }
            result = finalResult;

            vec3 grad = normalize(gradFixed + gradDyn * 0.5 + normalize(dcv) * 0.2
                                + normalize(heroV) * 0.6);
            return vec4(result, grad);
          }

          // Zero-cost AO: derived from gradient magnitude + field value
          // No extra sceneSDFGrad calls — uses the .x (sdf) and .yzw (grad) already in hand
          float gradAO(float sdfVal, vec3 grad) {
            // Edge proximity: how close to the surface (sdfVal near 0 = surface)
            float edge = 1.0 - smoothstep(0.0, 0.06, abs(sdfVal));
            // Gradient magnitude near 1 = clean surface, <1 can mean inside merge
            float gradMag = length(grad);
            return clamp(0.75 + gradMag * 0.2 - edge * 0.15, 0.0, 1.0);
          }

          // Soft shadow: 6 steps desktop / 2 mobile
          float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
            float res = 1.0; float t = mint;
            int steps = uIsMobile > 0.5 ? 2 : 6;
            for (int i = 0; i < 6; i++) {
              if (i >= steps || t >= maxt) break;
              float h = sceneSDFGrad(ro + rd * t).x;
              if (h < EPSILON) return 0.0;
              res = min(res, k * h / t);
              t += max(h, 0.025);
            }
            return clamp(res, 0.0, 1.0);
          }

          float rayMarch(vec3 ro, vec3 rd) {
            float t = 0.0;
            // 20 steps desktop / 12 mobile — half-res means smaller step can still converge
            int maxSteps = uIsMobile > 0.5 ? 12 : 20;
            for (int i = 0; i < 20; i++) {
              if (i >= maxSteps) break;
              vec3 p = ro + rd * t;
              float d = sceneSDFGrad(p).x;
              if (d < EPSILON) return t;
              if (t > 20.0) break;
              t += d;   // step factor 1.0 always — mediump precision sufficient
            }
            return -1.0;
          }

          vec3 lighting(vec3 p, vec4 sdfGrad, vec3 rd) {
            // Use pre-computed analytical normal — zero extra SDF cost
            vec3 normal   = sdfGrad.yzw;
            vec3 viewDir  = -rd;
            float ao      = gradAO(sdfGrad.x, normal);
            vec3 ambient  = uLightColor * uAmbientIntensity * ao;
            vec3 lightDir = normalize(uLightPosition);
            float diff    = max(dot(normal, lightDir), 0.0);
            float sh      = softShadow(p, lightDir, 0.01, 8.0, 16.0);
            vec3 diffuse  = uLightColor * diff * uDiffuseIntensity * sh;
            vec3 reflDir  = reflect(-lightDir, normal);
            float spec    = pow(max(dot(viewDir, reflDir), 0.0), uSpecularPower);
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
            vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;
            vec3 fresnelRim = uLightColor * fresnel * 0.4;
            // Cursor highlight
            float dc = length(p - uCursorSphere);
            if (dc < uCursorRadius + 0.4) {
              specular += uLightColor * (1.0 - smoothstep(0.0, uCursorRadius + 0.4, dc)) * 0.2;
              ambient  += uLightColor * exp(-dc * 3.0) * 0.075;
            }

            // ── Hero orb emission — driven by NexusCore uniforms ─────────────
            float dHero = length(p - uHeroOrb);
            float heroCore = exp(-max(dHero - uHeroOrbRadius, 0.0) * 18.0) * uHeroCoreIntensity;
            float heroHalo = pow(1.0 - smoothstep(0.0, uHeroOrbRadius * 3.5, dHero), 2.5) * uHeroHaloIntensity;
            float heroAtmo = exp(-dHero * 0.9) * uHeroAtmoIntensity;
            vec3 heroEmit = uHeroOrbColor * (heroCore + heroHalo + heroAtmo);
            float onHero = 1.0 - smoothstep(0.0, 0.12, abs(dHero - uHeroOrbRadius));
            heroEmit += uHeroOrbColor * fresnel * onHero * uHeroFresnelScale;
            // Inner+outer rim band
            float rimBand = exp(-abs(dHero - uHeroOrbRadius) * 28.0) * uHeroRimGlow;
            heroEmit += uHeroOrbColor * rimBand;
            // Outer-only rim glow: only activates OUTSIDE the surface
            float outerRim = exp(-max(dHero - uHeroOrbRadius, 0.0) * 14.0) * uHeroOuterRimGlow;
            heroEmit += uHeroOrbColor * outerRim;

            // ── Ship / entity colored emission ────────────────────────────────
            vec3 entityEmit = vec3(0.0);
            int eGlow = min(uEntityCount, 32);
            for (int ei = 0; ei < 32; ei++) {
              if (ei >= eGlow) break;
              float dEnt = length(p.xy - uEntities[ei].xy);
              float entR  = uEntities[ei].z;
              float entCore = exp(-max(dEnt - entR, 0.0) * 22.0) * 0.45;
              float entHalo = pow(1.0 - smoothstep(0.0, entR * 2.8, dEnt), 2.0) * 0.18;
              entityEmit += uEntityColors[ei] * (entCore + entHalo);
            }

            // Traversing asteroid emission glow
            vec3 travelerEmit = vec3(0.0);
            int tGlow = min(uTravelerCount, 30);
            for (int ti = 0; ti < 30; ti++) {
              if (ti >= tGlow) break;
              float dT  = length(p.xy - uTravelers[ti].xy);
              float tR  = uTravelers[ti].z;
              float tCore = exp(-max(dT - tR, 0.0) * 24.0) * 0.40;
              float tHalo = pow(1.0 - smoothstep(0.0, tR * 2.5, dT), 2.5) * 0.15;
              travelerEmit += uTravelerColors[ti] * (tCore + tHalo);
            }

            vec3 color = (uSphereColor + ambient + diffuse + specular + fresnelRim) * ao
                       + heroEmit + entityEmit + travelerEmit;
            color = pow(color, vec3(uContrast * 0.9));
            color = color / (color + vec3(0.8));
            return color;
          }

          float cursorGlowVal(vec3 wp) {
            float d = length(wp.xy - uCursorSphere.xy);
            return pow(1.0 - smoothstep(0.0, uCursorGlowRadius, d), 2.0) * uCursorGlowIntensity;
          }

          // Hero orb screen-space backlight — paints a wide blue gradient into
          // the empty space behind the orb, just like the original cursor backlight.
          // Uses a larger radius than the 3D halo so it bleeds well into the bg.
          float heroBacklightVal(vec3 wp) {
            float d = length(wp.xy - uHeroOrb.xy);
            float glowR = (uHeroBacklightSpread / uResolution.y) * 4.0;
            return pow(1.0 - smoothstep(0.0, glowR, d), 2.0) * uHeroBacklightStrength;
          }

          void main() {
            vec2 actualPixelRes = uActualResolution.xy * uPixelRatio;
            vec2 uv = (gl_FragCoord.xy * 2.0 - actualPixelRes) / actualPixelRes;
            uv += uCameraSway;
            uv.x *= uResolution.x / uResolution.y;

            // Raymarcher setup
            vec3 ro = vec3(uv * 2.0, -10.0);
            vec3 rd = vec3(0.0, 0.0, 1.0);

            // ── Early-exit bounding region ────────────────────────────────────────
            // Test ALL fixed blob positions so no blob is masked by a partial check.
            // ep is in the same coordinate space as screenToWorld() output.
            vec3 ep = vec3(ro.xy, 0.0);
            float earlyField = MAX_DIST;
            earlyField = min(earlyField, length(ep - screenToWorld(uPos1)) - uFixedTopLeftRadius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos2)) - uSmallTopLeftRadius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos3)) - uFixedBottomRightRadius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos4)) - uSmallBottomRightRadius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos5)) - uPos5Radius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos6)) - uPos6Radius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos7)) - uPos7Radius);
            earlyField = min(earlyField, length(ep.xy - uCursorSphere.xy) - uCursorRadius);
            // Hero orb — large halo needs a generous bounding radius
            earlyField = min(earlyField, length(ep - uHeroOrb) - uHeroOrbRadius * 3.5);

            // Entities (ship & missiles) bounding check
            int eBound = min(uEntityCount, 32);
            for (int ei = 0; ei < 32; ei++) {
              if (ei >= eBound) break;
              if (uEntities[ei].z > 0.01) {
                earlyField = min(earlyField, length(ep.xy - uEntities[ei].xy) - uEntities[ei].z * 3.0);
              }
            }
            
            // Travelers bounding check
            int tBound = min(uTravelerCount, 30);
            for (int ti = 0; ti < 30; ti++) {
              if (ti >= tBound) break;
              if (uTravelers[ti].z > 0.01) {
                earlyField = min(earlyField, length(ep.xy - uTravelers[ti].xy) - uTravelers[ti].z * 3.0);
              }
            }

            float t = -1.0;
            vec3 p = ro;
            vec4 sdfGrad = vec4(MAX_DIST, 0.0, 1.0, 0.0);
            // Threshold 15.0 — generous enough that no blob surface is skipped,
            // the ray marcher still terminates fast for truly empty regions (t>20).
            if (earlyField < 15.0) {
              t = rayMarch(ro, rd);
              if (t > -0.5) {
                p = ro + rd * t;
                sdfGrad = sceneSDFGrad(p);
              }
            }

            float glow = cursorGlowVal(ro);
            vec3 glowColor = uCursorGlowColor * glow;

            // Hero orb backlight — wide atmospheric bloom behind the orb (colour + spread controlled via uniforms)
            float heroBack = heroBacklightVal(ro);
            vec3 heroBackColor = uHeroBacklightColor * heroBack;

            // Apply a vertical gradient using 5F61E1 (0.37, 0.38, 0.88)
            float gradFactor = uv.y * 0.5 + 0.5; // 0 at bottom, 1 at top
            vec3 topColor = uBackgroundColor.rgb * vec3(0.37, 0.38, 0.88); // 5F61E1
            vec3 bottomColor = uBackgroundColor.rgb * vec3(0.65, 0.65, 0.95); // Lighter blue/purple
            vec3 bgGradient = mix(bottomColor, topColor, gradFactor);

            if (t > -0.5) {
              vec3 color = lighting(p, sdfGrad, rd);
              float fog = 1.0 - exp(-max(0.0, t - 9.0) * uFogDensity);
              color = mix(color, bgGradient, fog * 0.3);
              color += glowColor * 0.3;
              color += heroBackColor * 0.5;
              gl_FragColor = vec4(color, 1.0);
            } else {
              gl_FragColor = vec4(bgGradient + heroBackColor * 0.5, 1.0);
            }
          }
        `,
        transparent: true
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      setupEventListeners();

      // Auto-randomize on every load — runs independently of showUI
      randomizeSettings();

      // ── Hero-orb-only mode: suppress CORNER + named blobs, keep dynamic spheres
      // orbiting close to the orb surface to create the bubbling illusion.
      if (heroOrbOnly && material) {
        material.uniforms.uFixedTopLeftRadius.value     = 0.0;
        material.uniforms.uFixedBottomRightRadius.value = 0.0;
        material.uniforms.uSmallTopLeftRadius.value     = 0.0;
        material.uniforms.uSmallBottomRightRadius.value = 0.0;
        material.uniforms.uPos5Radius.value = 0.0;
        material.uniforms.uPos6Radius.value = 0.0;
        material.uniforms.uPos7Radius.value = 0.0;
        // Keep 4 small dynamic satellites orbiting closely around the orb
        material.uniforms.uSphereCount.value         = 4;
        material.uniforms.uSatelliteOrbitScale.value = 0.28;
        material.uniforms.uEntityCount.value = 0;
        material.uniforms.uCursorSphere.value.set(0, 0, -99);
        material.uniforms.uCursorRadius.value = 0.001;
        // Disable cursor glow — in heroOrbOnly mode there is no cursor interaction.
        // The cursor glow colour + intensity are exposed via NexusCore sliders instead.
        material.uniforms.uCursorGlowIntensity.value = 0.0;
        material.uniforms.uCursorGlowRadius.value    = 2.2;
        material.uniforms.uCursorGlowColor.value.set(0.12, 0.48, 1.0); // neutral blue start
        // Frontal light → symmetric shading → orb looks round, not squished
        material.uniforms.uLightPosition.value.set(0.0, 0.3, 1.0);
        material.uniforms.uAmbientIntensity.value = 0.30;  // fill shadows evenly
        material.uniforms.uDiffuseIntensity.value = 0.70;
        // Boost hero orb glow and add rim
        material.uniforms.uHeroCoreIntensity.value = 2.0;
        material.uniforms.uHeroHaloIntensity.value = 0.9;
        material.uniforms.uHeroRimGlow.value       = 2.5;
      }

      if (showUI) setupUI();
      animate();
      // Signal that NexusMetaballs is ready — NexusCore listens for this
      // to re-dispatch its initial config after the WebGL instance is live.
      window.dispatchEvent(new CustomEvent('nexus-metaballs-ready'));
    }

    // ── Serialize current settings to a plain object for localStorage / CustomEvent ─
    function serializeSettings() {
      return {
        sphereCount:              settings.sphereCount,
        ambientIntensity:         settings.ambientIntensity,
        diffuseIntensity:         settings.diffuseIntensity,
        specularIntensity:        settings.specularIntensity,
        specularPower:            settings.specularPower,
        fresnelPower:             settings.fresnelPower,
        smoothness:               settings.smoothness,
        mergeDistance:            settings.mergeDistance,
        contrast:                 settings.contrast,
        fogDensity:               settings.fogDensity,
        animationSpeed:           settings.animationSpeed,
        movementScale:            settings.movementScale,
        cursorGlowIntensity:      settings.cursorGlowIntensity,
        cursorGlowRadius:         settings.cursorGlowRadius,
        fixedTopLeftRadius:       settings.fixedTopLeftRadius,
        fixedBottomRightRadius:   settings.fixedBottomRightRadius,
        smallTopLeftRadius:       settings.smallTopLeftRadius,
        smallBottomRightRadius:   settings.smallBottomRightRadius,
        sphereColorR:             settings.sphereColor.r,
        sphereColorG:             settings.sphereColor.g,
        sphereColorB:             settings.sphereColor.b,
        bgColorR:                 settings.backgroundColor.r,
        bgColorG:                 settings.backgroundColor.g,
        bgColorB:                 settings.backgroundColor.b,
        lightColorR:              settings.lightColor.r,
        lightColorG:              settings.lightColor.g,
        lightColorB:              settings.lightColor.b,
        glowColorR:               settings.cursorGlowColor.r,
        glowColorG:               settings.cursorGlowColor.g,
        glowColorB:               settings.cursorGlowColor.b,
        renderScale,
        canvasBlur,
        preset:                   settings.preset,
      };
    }

    // ── Apply a serialized payload to material uniforms + canvas ─────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyPayload(d: any) {
      if (!material) return;
      // Standard settings — guarded so partial payloads (e.g. NexusCore hero-only
      // dispatches) don't clobber untouched uniforms with undefined/NaN.
      if (typeof d.sphereCount        === 'number' && !heroOrbOnly) material.uniforms.uSphereCount.value        = d.sphereCount;
      if (typeof d.ambientIntensity   === 'number') material.uniforms.uAmbientIntensity.value   = d.ambientIntensity;
      if (typeof d.diffuseIntensity   === 'number') material.uniforms.uDiffuseIntensity.value   = d.diffuseIntensity;
      if (typeof d.specularIntensity  === 'number') material.uniforms.uSpecularIntensity.value  = d.specularIntensity;
      if (typeof d.specularPower      === 'number') material.uniforms.uSpecularPower.value      = d.specularPower;
      if (typeof d.fresnelPower       === 'number') material.uniforms.uFresnelPower.value       = d.fresnelPower;
      if (typeof d.smoothness         === 'number') material.uniforms.uSmoothness.value         = d.smoothness;
      if (typeof d.mergeDistance      === 'number') material.uniforms.uMergeDistance.value      = d.mergeDistance;
      if (typeof d.contrast           === 'number') material.uniforms.uContrast.value           = d.contrast;
      if (typeof d.fogDensity         === 'number') material.uniforms.uFogDensity.value         = d.fogDensity;
      if (typeof d.animationSpeed     === 'number') material.uniforms.uAnimationSpeed.value     = d.animationSpeed;
      if (typeof d.movementScale      === 'number') material.uniforms.uMovementScale.value      = d.movementScale;
      if (typeof d.cursorGlowIntensity === 'number') material.uniforms.uCursorGlowIntensity.value = d.cursorGlowIntensity;
      if (typeof d.cursorGlowRadius   === 'number') material.uniforms.uCursorGlowRadius.value   = d.cursorGlowRadius;
      if (typeof d.fixedTopLeftRadius     === 'number') material.uniforms.uFixedTopLeftRadius.value     = d.fixedTopLeftRadius;
      if (typeof d.fixedBottomRightRadius === 'number') material.uniforms.uFixedBottomRightRadius.value = d.fixedBottomRightRadius;
      if (typeof d.smallTopLeftRadius     === 'number') material.uniforms.uSmallTopLeftRadius.value     = d.smallTopLeftRadius;
      if (typeof d.smallBottomRightRadius === 'number') material.uniforms.uSmallBottomRightRadius.value = d.smallBottomRightRadius;
      if (d.sphereColorR !== undefined) material.uniforms.uSphereColor.value.setRGB(d.sphereColorR, d.sphereColorG, d.sphereColorB);
      if (d.bgColorR     !== undefined) material.uniforms.uBackgroundColor.value.setRGB(d.bgColorR, d.bgColorG, d.bgColorB);
      if (d.lightColorR  !== undefined) material.uniforms.uLightColor.value.setRGB(d.lightColorR, d.lightColorG, d.lightColorB);
      if (d.glowColorR   !== undefined) material.uniforms.uCursorGlowColor.value.setRGB(d.glowColorR, d.glowColorG, d.glowColorB);
      // Light position
      if (d.lightPositionX !== undefined) material.uniforms.uLightPosition.value.set(d.lightPositionX, d.lightPositionY, d.lightPositionZ);
      // Hero orb appearance
      if (typeof d.heroOrbRadius       === 'number') material.uniforms.uHeroOrbRadius.value       = d.heroOrbRadius;
      if (typeof d.heroCoreIntensity   === 'number') material.uniforms.uHeroCoreIntensity.value   = d.heroCoreIntensity;
      if (typeof d.heroHaloIntensity   === 'number') material.uniforms.uHeroHaloIntensity.value   = d.heroHaloIntensity;
      if (typeof d.heroAtmoIntensity   === 'number') material.uniforms.uHeroAtmoIntensity.value   = d.heroAtmoIntensity;
      if (typeof d.heroFresnelScale    === 'number') material.uniforms.uHeroFresnelScale.value    = d.heroFresnelScale;
      if (typeof d.heroRimGlow      === 'number') material.uniforms.uHeroRimGlow.value      = d.heroRimGlow;
      if (typeof d.heroOuterRimGlow === 'number') material.uniforms.uHeroOuterRimGlow.value = d.heroOuterRimGlow;
      if (d.heroBacklightColorR !== undefined) material.uniforms.uHeroBacklightColor.value.set(d.heroBacklightColorR, d.heroBacklightColorG, d.heroBacklightColorB);
      if (typeof d.heroBacklightStrength === 'number') material.uniforms.uHeroBacklightStrength.value = d.heroBacklightStrength;
      if (typeof d.heroBacklightSpread   === 'number') material.uniforms.uHeroBacklightSpread.value   = d.heroBacklightSpread;
      // Center bloom (cursor glow repurposed as a static center glow in heroOrbOnly mode)
      if (d.centerGlowColorR !== undefined) material.uniforms.uCursorGlowColor.value.setRGB(d.centerGlowColorR, d.centerGlowColorG, d.centerGlowColorB);
      if (typeof d.centerGlowIntensity === 'number') material.uniforms.uCursorGlowIntensity.value = d.centerGlowIntensity;
      if (typeof d.centerGlowRadius    === 'number') material.uniforms.uCursorGlowRadius.value    = d.centerGlowRadius;
      if (typeof d.satelliteOrbitScale === 'number') material.uniforms.uSatelliteOrbitScale.value = d.satelliteOrbitScale;
      if (typeof d.satelliteSize        === 'number') material.uniforms.uSatelliteSize.value       = d.satelliteSize;
      if (typeof d.satelliteSpeed       === 'number') material.uniforms.uSatelliteSpeed.value      = d.satelliteSpeed;
      if (typeof d.satelliteCount       === 'number') material.uniforms.uSphereCount.value         = d.satelliteCount;
      if (d.heroOrbColorR !== undefined) material.uniforms.uHeroOrbColor.value.set(d.heroOrbColorR, d.heroOrbColorG, d.heroOrbColorB);
      // Resolution scale
      if (d.renderScale && renderer) {
        renderScale = d.renderScale;
        const r = container ? container.getBoundingClientRect() : null;
        const w = r ? Math.max(r.width, 1)  : window.innerWidth;
        const h = r ? Math.max(r.height, 1) : window.innerHeight;
        const rW = Math.floor(w * renderScale); const rH = Math.floor(h * renderScale);
        renderer.setSize(rW, rH, false);
        material.uniforms.uResolution.value.set(w, h);
        material.uniforms.uActualResolution.value.set(rW, rH);
      }
      // Canvas blur
      if (typeof d.canvasBlur === 'number' && canvasEl) {
        canvasBlur = d.canvasBlur;
        canvasEl.style.filter = canvasBlur > 0 ? `blur(${canvasBlur}px)` : 'none';
      }
    }


    function setupEventListeners() {
      window.addEventListener("resize", onWindowResize, { passive: true });
      window.addEventListener("nexus-randomize", randomizeSettings);
      // Arena instance: listen for settings pushed from the environment preview tab
      if (!showUI) {
        const onArenaApply = (e: Event) => applyPayload((e as CustomEvent).detail);
        window.addEventListener('nexus-arena-apply', onArenaApply);
        // REMOVED: Restore last saved arena config from localStorage per architectural rules.
        // Store cleanup ref on the window so cleanup can remove it
        (window as any).__nexusArenaApplyHandler = onArenaApply;
      }

      // SYNC_NEXUS_CURSOR — write ships + missiles directly to uEntities shader uniform.
      // Each entity is a live metaball: ships (r=0.07) merge/tear with the goo,
      // missiles (r=0.04) leave thin tendrils as they pass through.
      const onSyncCursor = (e: Event) => {
        if (!material) return;
        const d = (e as CustomEvent).detail;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const asp = W / H;
        // screen-pixel → shader world-space
        const toShader = (sx: number, sy: number) => ({
          x: (sx / W * 2 - 1) * asp * 2,
          y: -(sy / H * 2 - 1) * 2,
        });

        const ents: THREE.Vector3[] = material.uniforms.uEntities.value;
        const col: THREE.Vector3[]  = material.uniforms.uEntityColors.value;

        // Slot 0: Ship or Hero Control
        if (d.ships && Array.isArray(d.ships) && d.ships.length > 0) {
          const s = d.ships[0];
          const sw = toShader(s.x, s.y);
          heroTargetX = sw.x;
          heroTargetY = sw.y;
          // Disable the small cyan ship blob since we are driving the main orb now
          entityTargetR[0] = 0;
          const hex = (s.color as string) || '#0088ff';
          col[0].set(
            parseInt(hex.slice(1,3), 16) / 255,
            parseInt(hex.slice(3,5), 16) / 255,
            parseInt(hex.slice(5,7), 16) / 255
          );
        } else if (d.clientX !== undefined) {
          const sw = toShader(d.clientX, d.clientY);
          ents[0].x = sw.x;
          ents[0].y = sw.y;
          entityTargetR[0] = 0.13;
          col[0].set(0, 0.533, 1.0);
        } else {
          entityTargetR[0] = 0;
        }

        // Slots 1-31: Missiles
        const activeMissileSlots = new Set();
        if (d.missiles && Array.isArray(d.missiles)) {
          for (const m of d.missiles) {
            const slot = (m.id % 31) + 1; // Map strictly to slots 1 through 31
            const mw = toShader(m.x, m.y);
            ents[slot].set(mw.x, mw.y, 0.055);
            entityTargetR[slot] = 0.055;
            
            // Instantly pop in if it's a completely new missile, otherwise let it lerp
            if (entityCurrentR[slot] < 0.01) {
               entityCurrentR[slot] = 0.055;
            }
            
            col[slot].set(1.0, 0.0, 0.333);
            activeMissileSlots.add(slot);
          }
        }
        
        // Any slot that didn't receive an update this frame will have its target radius set to 0.
        // The WebGL loop will smoothly shrink it at its EXACT last known position without teleporting.
        for (let slot = 1; slot <= 31; slot++) {
          if (!activeMissileSlots.has(slot)) {
            entityTargetR[slot] = 0;
          }
        }

        material.uniforms.uEntityCount.value = 32;
      };
      window.addEventListener('SYNC_NEXUS_CURSOR', onSyncCursor, { passive: true });
      (window as any).__nexusSyncCursorHandler = onSyncCursor;
    }

    function screenToWorldJS(normalizedX: number, normalizedY: number) {
      const uv_x = normalizedX * 2.0 - 1.0;
      const uv_y = normalizedY * 2.0 - 1.0;
      const aspect = window.innerWidth / window.innerHeight;
      return new THREE.Vector3(uv_x * aspect * 2.0, uv_y * 2.0, 0.0);
    }

    function applyPreset(presetName: keyof typeof presets) {
      const preset = presets[presetName];
      if (!preset) return;
      settings.preset = presetName;
      Object.assign(settings, preset);

      if (material) {
          material.uniforms.uSphereCount.value = settings.sphereCount;
          material.uniforms.uAmbientIntensity.value = settings.ambientIntensity;
          material.uniforms.uDiffuseIntensity.value = settings.diffuseIntensity;
          material.uniforms.uSpecularIntensity.value = settings.specularIntensity;
          material.uniforms.uSpecularPower.value = settings.specularPower;
          material.uniforms.uFresnelPower.value = settings.fresnelPower;
          material.uniforms.uBackgroundColor.value = settings.backgroundColor;
          material.uniforms.uSphereColor.value = settings.sphereColor;
          material.uniforms.uLightColor.value = settings.lightColor;
          material.uniforms.uLightPosition.value = settings.lightPosition;
          material.uniforms.uSmoothness.value = settings.smoothness;
          material.uniforms.uContrast.value = settings.contrast;
          material.uniforms.uFogDensity.value = settings.fogDensity;
          material.uniforms.uCursorGlowIntensity.value = settings.cursorGlowIntensity;
          material.uniforms.uCursorGlowRadius.value = settings.cursorGlowRadius;
          material.uniforms.uCursorGlowColor.value = settings.cursorGlowColor;
      }
    }

    function setupUI() {
      if (!uiContainer) return;

      // Wipe any previously appended UI (prevents duplicate buttons on re-mount)
      uiContainer.innerHTML = '';

      const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

      // ── Prefs toggle button ───────────────────────────────────────────────
      const prefsButton = document.createElement('button');
      prefsButton.innerHTML = "⚙ Preferences";
      prefsButton.style.cssText = `background: rgba(10,10,15,0.7); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 50px; cursor: pointer; font-size: 13px; font-weight: 500; font-family: ${font}; backdrop-filter: blur(10px); transition: all 0.2s; z-index: 2000000; position: relative; pointer-events: auto; display: block;`;
      prefsButton.onmouseenter = () => prefsButton.style.background = "rgba(40,40,50,0.8)";
      prefsButton.onmouseleave = () => { if (!isPanelOpen) prefsButton.style.background = "rgba(10,10,15,0.7)"; };

      // ── Panel container ───────────────────────────────────────────────────
      const panel = document.createElement('div');
      panel.style.cssText = `display: none; background: rgba(8,8,16,0.92); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 14px; width: 270px; font-family: ${font}; color: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.6); backdrop-filter: blur(16px); flex-direction: column; gap: 10px; position: absolute; right: 0; bottom: 40px; max-height: 70vh; overflow-y: auto;`;

      let isPanelOpen = false;
      prefsButton.onclick = () => {
        isPanelOpen = !isPanelOpen;
        panel.style.display = isPanelOpen ? 'flex' : 'none';
        prefsButton.style.background = isPanelOpen ? "rgba(60,60,80,0.9)" : "rgba(10,10,15,0.7)";
      };

      // ── Helpers ───────────────────────────────────────────────────────────
      const sectionTitle = (text: string) => {
        const el = document.createElement('div');
        el.innerText = text;
        el.style.cssText = "font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(168,85,247,0.9); padding: 6px 0 2px; border-bottom: 1px solid rgba(168,85,247,0.2); margin-top: 4px;";
        return el;
      };

      const makeSlider = (
        label: string,
        min: number, max: number, step: number,
        getValue: () => number,
        onChange: (v: number) => void
      ) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = "display: flex; flex-direction: column; gap: 3px;";
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center;";
        const lbl = document.createElement('span');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 11px; color: rgba(255,255,255,0.65);";
        const val = document.createElement('span');
        val.innerText = getValue().toFixed(2);
        val.style.cssText = "font-size: 11px; color: rgba(168,85,247,0.9); font-weight: 600; min-width: 36px; text-align: right;";
        row.appendChild(lbl);
        row.appendChild(val);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(step);
        slider.value = String(getValue());
        slider.style.cssText = "width: 100%; accent-color: #a855f7; cursor: pointer;";
        slider.oninput = () => {
          const n = parseFloat(slider.value);
          onChange(n);
          val.innerText = n.toFixed(2);
        };
        wrap.appendChild(row);
        wrap.appendChild(slider);
        return wrap;
      };

      const makeToggle = (label: string, getValue: () => boolean, onChange: (v: boolean) => void) => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center;";
        const lbl = document.createElement('span');
        lbl.innerText = label;
        lbl.style.cssText = "font-size: 11px; color: rgba(255,255,255,0.65);";
        const btn = document.createElement('button');
        const update = () => {
          btn.innerText = getValue() ? 'ON' : 'OFF';
          btn.style.background = getValue() ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)';
        };
        btn.style.cssText = "border: 1px solid rgba(168,85,247,0.4); color: white; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; transition: background 0.15s;";
        btn.onclick = () => { onChange(!getValue()); update(); };
        update();
        row.appendChild(lbl);
        row.appendChild(btn);
        return row;
      };

      // ── Header ────────────────────────────────────────────────────────────
      const header = document.createElement('div');
      header.innerText = "Nexus Metaballs";
      header.style.cssText = "font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.85); padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);";
      panel.appendChild(header);

      // ── PRESETS ───────────────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Color Preset"));

      const presetSelect = document.createElement('select');
      presetSelect.style.cssText = "background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 7px 8px; border-radius: 6px; font-size: 12px; cursor: pointer; outline: none; width: 100%;";
      ["moody","cosmic","minimal","vibrant","neon","sunset","midnight","toxic","pastel","dithered","holographic","studio"].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.innerText = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (opt === settings.preset) o.selected = true;
        presetSelect.appendChild(o);
      });
      presetSelect.onchange = (e: any) => applyPreset(e.target.value);
      panel.appendChild(presetSelect);

      // ── BLOBS ─────────────────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Blobs / Shape"));

       // Create the button wired to randomizeSettings
       const randomizeBtn = document.createElement('button');
       randomizeBtn.innerHTML = "🎲 Randomize Positions";
       randomizeBtn.style.cssText = "background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; width: 100%; text-align: center; transition: background 0.2s;";
       randomizeBtn.onmouseenter = () => randomizeBtn.style.background = "rgba(168,85,247,0.3)";
       randomizeBtn.onmouseleave = () => randomizeBtn.style.background = "rgba(168,85,247,0.15)";
       randomizeBtn.onclick = randomizeSettings;
       panel.appendChild(randomizeBtn);

       const copyBtn = document.createElement('button');
       copyBtn.innerHTML = "📋 Copy Preset to Clipboard";
       copyBtn.style.cssText = "background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; width: 100%; text-align: center; transition: background 0.2s; margin-top: 10px;";
       copyBtn.onmouseenter = () => copyBtn.style.background = "rgba(59,130,246,0.3)";
       copyBtn.onmouseleave = () => copyBtn.style.background = "rgba(59,130,246,0.15)";
       copyBtn.onclick = () => {
         const out = {
           sphereCount: settings.sphereCount,
           ambientIntensity: settings.ambientIntensity,
           diffuseIntensity: settings.diffuseIntensity,
           specularIntensity: settings.specularIntensity,
           specularPower: settings.specularPower,
           fresnelPower: settings.fresnelPower,
           backgroundColor: `0x${settings.backgroundColor.getHexString()}`,
           sphereColor: `0x${settings.sphereColor.getHexString()}`,
           lightColor: `0x${settings.lightColor.getHexString()}`,
           lightPosition: { x: settings.lightPosition.x, y: settings.lightPosition.y, z: settings.lightPosition.z },
           smoothness: settings.smoothness,
           contrast: settings.contrast,
           fogDensity: settings.fogDensity,
           cursorGlowIntensity: settings.cursorGlowIntensity,
           cursorGlowRadius: settings.cursorGlowRadius,
           cursorGlowColor: `0x${settings.cursorGlowColor.getHexString()}`
         };
         navigator.clipboard.writeText(JSON.stringify(out, null, 2)).then(() => {
           const orig = copyBtn.innerHTML;
           copyBtn.innerHTML = "✅ Copied!";
           setTimeout(() => copyBtn.innerHTML = orig, 1500);
         });
       };
       panel.appendChild(copyBtn);

      panel.appendChild(makeSlider("Sphere Count", 1, 10, 1,
        () => settings.sphereCount,
        v => { settings.sphereCount = Math.round(v); if (material) material.uniforms.uSphereCount.value = Math.round(v); }
      ));
      panel.appendChild(makeSlider("Fixed Blob 1 Radius", 0.1, 2.5, 0.01,
        () => settings.fixedTopLeftRadius,
        v => { settings.fixedTopLeftRadius = v; if (material) material.uniforms.uFixedTopLeftRadius.value = v; }
      ));
      panel.appendChild(makeSlider("Fixed Blob 2 Radius", 0.1, 2.5, 0.01,
        () => settings.fixedBottomRightRadius,
        v => { settings.fixedBottomRightRadius = v; if (material) material.uniforms.uFixedBottomRightRadius.value = v; }
      ));
      panel.appendChild(makeSlider("Small Blob 1 Radius", 0.05, 1.0, 0.01,
        () => settings.smallTopLeftRadius,
        v => { settings.smallTopLeftRadius = v; if (material) material.uniforms.uSmallTopLeftRadius.value = v; }
      ));
      panel.appendChild(makeSlider("Small Blob 2 Radius", 0.05, 1.0, 0.01,
        () => settings.smallBottomRightRadius,
        v => { settings.smallBottomRightRadius = v; if (material) material.uniforms.uSmallBottomRightRadius.value = v; }
      ));
      panel.appendChild(makeSlider("Smoothness", 0.0, 1.0, 0.01,
        () => settings.smoothness,
        v => { settings.smoothness = v; if (material) material.uniforms.uSmoothness.value = v; }
      ));
      panel.appendChild(makeSlider("Merge Distance", 0.3, 3.5, 0.05,
        () => settings.mergeDistance,
        v => { settings.mergeDistance = v; if (material) material.uniforms.uMergeDistance.value = v; }
      ));

      // ── ANIMATION ─────────────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Animation"));

      panel.appendChild(makeSlider("Animation Speed", 0.0, 3.0, 0.01,
        () => settings.animationSpeed,
        v => { settings.animationSpeed = v; if (material) material.uniforms.uAnimationSpeed.value = v; }
      ));
      panel.appendChild(makeSlider("Movement Scale", 0.0, 2.5, 0.01,
        () => settings.movementScale,
        v => { settings.movementScale = v; if (material) material.uniforms.uMovementScale.value = v; }
      ));
      panel.appendChild(makeSlider("Mouse Smoothness", 0.01, 0.5, 0.01,
        () => settings.mouseSmoothness,
        v => { settings.mouseSmoothness = v; }
      ));
      panel.appendChild(makeToggle("Mouse Proximity Effect",
        () => settings.mouseProximityEffect,
        v => { settings.mouseProximityEffect = v; if (material) material.uniforms.uMouseProximityEffect.value = v; }
      ));
      panel.appendChild(makeSlider("Min Movement Scale", 0.0, 1.5, 0.01,
        () => settings.minMovementScale,
        v => { settings.minMovementScale = v; if (material) material.uniforms.uMinMovementScale.value = v; }
      ));
      panel.appendChild(makeSlider("Max Movement Scale", 0.0, 2.5, 0.01,
        () => settings.maxMovementScale,
        v => { settings.maxMovementScale = v; if (material) material.uniforms.uMaxMovementScale.value = v; }
      ));

      // ── LIGHTING ──────────────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Lighting & Quality"));

      panel.appendChild(makeSlider("Ambient Intensity", 0.0, 0.5, 0.005,
        () => settings.ambientIntensity,
        v => { settings.ambientIntensity = v; if (material) material.uniforms.uAmbientIntensity.value = v; }
      ));
      panel.appendChild(makeSlider("Diffuse Intensity", 0.0, 2.0, 0.01,
        () => settings.diffuseIntensity,
        v => { settings.diffuseIntensity = v; if (material) material.uniforms.uDiffuseIntensity.value = v; }
      ));
      panel.appendChild(makeSlider("Specular Intensity", 0.0, 3.0, 0.01,
        () => settings.specularIntensity,
        v => { settings.specularIntensity = v; if (material) material.uniforms.uSpecularIntensity.value = v; }
      ));
      panel.appendChild(makeSlider("Specular Power", 1, 20, 0.5,
        () => settings.specularPower,
        v => { settings.specularPower = v; if (material) material.uniforms.uSpecularPower.value = v; }
      ));
      panel.appendChild(makeSlider("Fresnel Power", 0.3, 4.0, 0.05,
        () => settings.fresnelPower,
        v => { settings.fresnelPower = v; if (material) material.uniforms.uFresnelPower.value = v; }
      ));
      panel.appendChild(makeSlider("Contrast", 1.0, 3.5, 0.05,
        () => settings.contrast,
        v => { settings.contrast = v; if (material) material.uniforms.uContrast.value = v; }
      ));
      panel.appendChild(makeSlider("Fog Density", 0.0, 0.4, 0.005,
        () => settings.fogDensity,
        v => { settings.fogDensity = v; if (material) material.uniforms.uFogDensity.value = v; }
      ));

      // ── CURSOR GLOW ───────────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Cursor Glow"));

      panel.appendChild(makeSlider("Glow Intensity", 0.0, 2.5, 0.05,
        () => settings.cursorGlowIntensity,
        v => { settings.cursorGlowIntensity = v; if (material) material.uniforms.uCursorGlowIntensity.value = v; }
      ));
      panel.appendChild(makeSlider("Glow Radius", 0.3, 3.5, 0.05,
        () => settings.cursorGlowRadius,
        v => { settings.cursorGlowRadius = v; if (material) material.uniforms.uCursorGlowRadius.value = v; }
      ));
      panel.appendChild(makeSlider("Cursor Radius Min", 0.01, 0.4, 0.005,
        () => settings.cursorRadiusMin,
        v => { settings.cursorRadiusMin = v; }
      ));
      panel.appendChild(makeSlider("Cursor Radius Max", 0.01, 0.6, 0.005,
        () => settings.cursorRadiusMax,
        v => { settings.cursorRadiusMax = v; }
      ));

      // ── PERFORMANCE ─────────────────────────────────────────────────
      panel.appendChild(sectionTitle("Performance"));

      panel.appendChild(makeSlider("Resolution Scale", 0.25, 4.0, 0.05,
        () => renderScale,
        v => {
          renderScale = v;
          if (!renderer || !material) return;
          const w = window.innerWidth;
          const h = window.innerHeight;
          const rW = Math.floor(w * v);
          const rH = Math.floor(h * v);
          renderer.setSize(rW, rH, false);
          material.uniforms.uResolution.value.set(w, h);
          material.uniforms.uActualResolution.value.set(rW, rH);
        }
      ));

      panel.appendChild(makeSlider("Edge Blur (px)", 0, 12, 0.5,
        () => canvasBlur,
        v => {
          canvasBlur = v;
          if (canvasEl) canvasEl.style.filter = v > 0 ? `blur(${v}px)` : 'none';
        }
      ));

      // Hide preferences per user request
      // uiContainer.appendChild(prefsButton);
      // uiContainer.appendChild(panel);

      // ── Fullscreen button ─────────────────────────────────────────────────
      let fullscreenBtn = document.getElementById('nexus-fullscreen-btn') as HTMLButtonElement;
      if (!fullscreenBtn) {
        fullscreenBtn = document.createElement('button');
        fullscreenBtn.id = 'nexus-fullscreen-btn';
        fullscreenBtn.innerHTML = "⛶ Fullscreen";
        fullscreenBtn.style.cssText = `background: rgba(10,10,15,0.7); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 50px; cursor: pointer; font-size: 13px; font-weight: 500; font-family: ${font}; backdrop-filter: blur(10px); transition: all 0.2s; pointer-events: auto; display: block;`;
        fullscreenBtn.onmouseenter = () => fullscreenBtn.style.background = "rgba(40,40,50,0.8)";
        fullscreenBtn.onmouseleave = () => fullscreenBtn.style.background = "rgba(10,10,15,0.7)";
        fullscreenBtn.onclick = () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
          } else {
            document.exitFullscreen();
          }
        };
        uiContainer.appendChild(fullscreenBtn);
      }
      // Force initial display state
      fullscreenBtn.style.display = showFullscreenBtn ? 'block' : 'none';

      // ── FPS counter badge ─────────────────────────────────────────────────
      // We append this directly to website-canvas so it stays visible in fullscreen
      let fpsBadge = document.getElementById("nexus-fps-badge") as HTMLDivElement;
      if (!fpsBadge) {
        fpsBadge = document.createElement('div');
        fpsBadge.id = "nexus-fps-badge";
        fpsBadge.style.cssText = "position: absolute; bottom: 20px; left: 20px; font-size: 13px; font-weight: 500; font-family: 'Rubik', sans-serif; color: white; letter-spacing: 1px; transition: color 0.5s; z-index: 2000000; pointer-events: none;";
        fpsBadge.innerText = 'FPS --';
        canvasParent.appendChild(fpsBadge);
      }
      fpsBadgeRef = fpsBadge;
    }

    function onWindowResize() {
      if (!camera || !renderer || !material) return;
      // Use the container's actual rendered size — same approach as init() —
      // so the orb stays perfectly round at any window/fullscreen size.
      const rect   = container ? container.getBoundingClientRect() : null;
      const width  = rect ? Math.max(rect.width,  1) : window.innerWidth;
      const height = rect ? Math.max(rect.height, 1) : window.innerHeight;
      const rW = Math.floor(width  * renderScale);
      const rH = Math.floor(height * renderScale);

      camera.updateProjectionMatrix();
      renderer.setSize(rW, rH, false);
      renderer.setPixelRatio(devicePixelRatio);

      material.uniforms.uResolution.value.set(width, height);
      material.uniforms.uActualResolution.value.set(rW, rH);
      material.uniforms.uPixelRatio.value = devicePixelRatio;
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      render();
    }

    function render() {
      const currentTime = performance.now();
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        // Update FPS badge color: green ≥55, yellow 35-54, red <35
        if (fpsBadgeRef && fps !== lastFpsDisplay) {
          lastFpsDisplay = fps;
          fpsBadgeRef.innerText = `FPS ${fps}`;
          const color = fps >= 55 ? 'white' : fps >= 35 ? '#facc15' : '#f87171';
          const border = fps >= 55 ? 'rgba(255,255,255,0.3)' : fps >= 35 ? 'rgba(250,204,21,0.3)' : 'rgba(248,113,113,0.3)';
          fpsBadgeRef.style.color = color;
          fpsBadgeRef.style.borderColor = border;
        }
      }

      // Float sphere — stationary at screen center (0,0 in shader world-space)
      const t = clock.getElapsedTime();
      const floatZ = Math.sin(t * 0.17) * 0.05; // very slight Z pulse for subtle life
      floatSpherePos.x += (0 - floatSpherePos.x) * 0.05;
      floatSpherePos.y += (0 - floatSpherePos.y) * 0.05;
      floatSpherePos.z += (floatZ - floatSpherePos.z) * 0.05;

      // Animate corner blobs — slow independent sin drifts so all goo is alive
      const asp2 = window.innerWidth / window.innerHeight;
      if (material) {
          // Corner blobs — oscillate around their randomized cornerHomes (never compound)
          // Keep pos1 almost locked for the logo background
          const p1x = cornerHomes[0].x + Math.sin(t * 0.13) * 0.005;
          const p1y = cornerHomes[0].y + Math.cos(t * 0.17) * 0.005;
          const p2x = cornerHomes[1].x + Math.sin(t * 0.19 + 1.0) * 0.07;
          const p2y = cornerHomes[1].y + Math.cos(t * 0.11 + 2.0) * 0.06;
          const p3x = cornerHomes[2].x + Math.sin(t * 0.15 + 3.0) * 0.05;
          const p3y = cornerHomes[2].y + Math.cos(t * 0.21 + 1.5) * 0.05;
          const p4x = cornerHomes[3].x + Math.sin(t * 0.09 + 2.5) * 0.07;
          const p4y = cornerHomes[3].y + Math.cos(t * 0.13 + 0.5) * 0.06;
          // Center blobs — use stable home vars, never read current uniform (prevents compounding drift)
          const p5x = pos5HomeX + Math.sin(t * 0.07 + 5.0) * 0.12;
          const p5y = pos5HomeY + Math.cos(t * 0.09 + 3.5) * 0.10;
          const p6x = pos6HomeX + Math.sin(t * 0.11 + 2.2) * 0.14;
          const p6y = pos6HomeY + Math.cos(t * 0.08 + 4.1) * 0.12;
          const p7x = pos7HomeX + Math.sin(t * 0.06 + 1.7) * 0.16;
          const p7y = pos7HomeY + Math.cos(t * 0.05 + 0.9) * 0.14;
          material.uniforms.uPos1.value.set(p1x, p1y);
          material.uniforms.uPos2.value.set(p2x, p2y);
          material.uniforms.uPos3.value.set(p3x, p3y);
          material.uniforms.uPos4.value.set(p4x, p4y);
          material.uniforms.uPos5.value.set(p5x, p5y);
          material.uniforms.uPos6.value.set(p6x, p6y);
          material.uniforms.uPos7.value.set(p7x, p7y);
          
          const swayX = Math.sin(t * 0.45) * 0.05;
          const swayY = Math.cos(t * 0.30) * 0.04;
          material.uniforms.uCameraSway.value.set(swayX, swayY);

          // ── Lighting Mode Interpolation ───────────────────────────────────────
          let targetDiffuse = settings.diffuseIntensity;
          let targetSpecular = settings.specularIntensity;
          let targetAmbient = settings.ambientIntensity;
          
          if (lightingMode === 'dim') {
            targetDiffuse *= 0.2;
            targetSpecular *= 0.2;
            targetAmbient *= 0.4; // Don't make shadows completely pitch black
          }

          material.uniforms.uDiffuseIntensity.value += (targetDiffuse - material.uniforms.uDiffuseIntensity.value) * 0.05;
          material.uniforms.uSpecularIntensity.value += (targetSpecular - material.uniforms.uSpecularIntensity.value) * 0.05;
          material.uniforms.uAmbientIntensity.value += (targetAmbient - material.uniforms.uAmbientIntensity.value) * 0.05;


          // Middle blob — wide Lissajous so it visibly tours the screen
          const PHI = 1.61803398875;
          const asp2 = window.innerWidth / window.innerHeight;
          const lissX = Math.sin(t * 0.28)             * asp2 * 1.4;
          const lissY = Math.sin(t * 0.28 / PHI + 1.2) * 1.4;
          floatSpherePos.x += (lissX - floatSpherePos.x) * 0.025;
          floatSpherePos.y += (lissY - floatSpherePos.y) * 0.025;
          floatSpherePos.z += (floatZ - floatSpherePos.z) * 0.05;

          // ── Hero orb — driven by the ship's coordinates ──────
          // Smoothly lerp to pilot's target, but snap instantly if the physics wrapped across the screen!
          if (Math.abs(heroTargetX - material.uniforms.uHeroOrb.value.x) > 1.0) {
             material.uniforms.uHeroOrb.value.x = heroTargetX;
          } else {
             material.uniforms.uHeroOrb.value.x += (heroTargetX - material.uniforms.uHeroOrb.value.x) * 0.04;
          }
          
          if (Math.abs(heroTargetY - material.uniforms.uHeroOrb.value.y) > 1.0) {
             material.uniforms.uHeroOrb.value.y = heroTargetY;
          } else {
             material.uniforms.uHeroOrb.value.y += (heroTargetY - material.uniforms.uHeroOrb.value.y) * 0.04;
          }
          material.uniforms.uHeroOrb.value.z += (0 - material.uniforms.uHeroOrb.value.z) * 0.04;

          // ── Entity blob radius fade ──────────────────────────────────
          // Lerp each slot's radius toward its target so blobs dissolve
          // smoothly rather than popping when a ship dies or leaves.
          const entsF: THREE.Vector3[] = material.uniforms.uEntities.value;
          for (let ei = 0; ei < ENTITY_SLOTS; ei++) {
            entityCurrentR[ei] += (entityTargetR[ei] - entityCurrentR[ei]) * (1 - ENTITY_FADE_K);
            if (entityCurrentR[ei] < 0.001 && entityTargetR[ei] === 0) {
              // Fully dissolved — park off-screen with zero radius
              entsF[ei].set(0, 9999, 0);
              entityCurrentR[ei] = 0;
            } else {
              entsF[ei].z = entityCurrentR[ei];
            }
          }

          material.uniforms.uTime.value = t;
          material.uniforms.uMousePosition.value.set(0.5, 0.5);

          if (!heroOrbOnly) {
            // Normal mode — park cursor sphere off-screen, kill dynamic blobs (entities handle interaction)
            material.uniforms.uCursorSphere.value.set(0, 10, 0);
            material.uniforms.uCursorRadius.value = 0.001;
            material.uniforms.uSphereCount.value = 0;
          } else {
            // Hero-orb-only mode — drive satellites via uEntities.
            const satCount  = Math.min(material.uniforms.uSphereCount.value,  ENTITY_SLOTS);
            const orbScale  = material.uniforms.uSatelliteOrbitScale.value;
            const satSize   = material.uniforms.uSatelliteSize.value;
            const speedMult = material.uniforms.uSatelliteSpeed.value;
            const heroR     = material.uniforms.uHeroOrbRadius.value;
            const orbColor  = material.uniforms.uHeroOrbColor.value;  // <- sync satellite color
            const entsS:   THREE.Vector3[] = material.uniforms.uEntities.value;
            const colorsS: THREE.Vector3[] = material.uniforms.uEntityColors.value;
            const baseSpeed = 0.22;
            for (let si = 0; si < ENTITY_SLOTS; si++) {
              if (si < satCount) {
                const phase     = (si / satCount) * Math.PI * 2.0 + si * 0.47;
                const speed     = baseSpeed * speedMult * (0.7 + (si % 3) * 0.22);
                const satRadius = satSize * (0.85 + (si % 4) * 0.12);
                // 0% = satellite grazes surface, 100% = satellite center deep inside
                const orbitR    = heroR * (1.0 - orbScale * 0.82) + satRadius * 0.5;
                const inclin    = (si / satCount) * Math.PI * 0.8 + 0.25;
                const az        = phase + t * speed;
                const satX      = Math.cos(az) * Math.cos(inclin) * orbitR;
                const satY      = Math.sin(az) * orbitR;
                entsS[si].set(satX, satY, satRadius);
                // Sync satellite emission colour to hero orb colour
                colorsS[si].set(orbColor.x, orbColor.y, orbColor.z);
                entityTargetR[si]  = satRadius;
                entityCurrentR[si] = satRadius;
              } else {
                entsS[si].set(0, 9999, 0);
                colorsS[si].set(0, 0, 0);
                entityTargetR[si]  = 0;
                entityCurrentR[si] = 0;
              }
            }
            material.uniforms.uEntityCount.value = satCount;
            material.uniforms.uCursorSphere.value.set(0, 0, -99);
            material.uniforms.uCursorRadius.value = 0.001;
            // Traveler system disabled — uTravelerCount stays 0
          }
      } // end if (material)

      if (scene && camera) {
        renderer.render(scene, camera);
      }

      // ── Broadcast blob positions for arena projectile collision ───────────
      // Written every frame to a shared window property (no event overhead).
      // Positions are in shader world-space: screenToWorld(pos) = (pos*2-1)*[aspect*2, 2]
      // Arena reads window.__nexusBlobData = Array<{cx, cy, r}> in shader units
      if (!showUI || true) { // always broadcast for any arena instance
        const W = window.innerWidth;
        const H = window.innerHeight;
        const asp = W / H;
        // Convert shader world-space → canvas pixel coords
        // Shader world: x in [-asp*2, asp*2], y in [-2, 2]
        // Canvas pixel: x = (wx/(asp*2)+0.5)*W, y = (-wy/2+0.5)*H
        const toPixX = (wx: number) => (wx / (asp * 2) + 0.5) * W;
        const toPixY = (wy: number) => (-wy / 2 + 0.5) * H;
        // Blob radii in shader units — approx pixel radius = r * (H/2)
        const rToPix = (r: number) => r * (H / 2);

        const s1x = (settings.pos1.x * 2 - 1) * asp * 2;
        const s1y = (settings.pos1.y * 2 - 1) * 2;
        const s3x = (settings.pos3.x * 2 - 1) * asp * 2;
        const s3y = (settings.pos3.y * 2 - 1) * 2;

        const cursorR = material?.uniforms.uCursorRadius?.value ?? 0.2;
        (window as any).__nexusBlobData = [
          { cx: toPixX(s1x),        cy: toPixY(s1y),        r: rToPix(settings.fixedTopLeftRadius) },
          { cx: toPixX(s3x),        cy: toPixY(s3y),        r: rToPix(settings.fixedBottomRightRadius) },
          { cx: toPixX(floatSpherePos.x), cy: toPixY(floatSpherePos.y), r: rToPix(cursorR) },
        ];
      }
    }

    const handleLightingMode = (e: any) => {
      lightingMode = e.detail?.mode || 'default';
    };
    window.addEventListener('nexus-lighting-mode', handleLightingMode);

    init();

    return () => {
      window.removeEventListener('nexus-lighting-mode', handleLightingMode);
      window.removeEventListener("resize", onWindowResize);
      if (!showUI && (window as any).__nexusArenaApplyHandler) {
        window.removeEventListener('nexus-arena-apply', (window as any).__nexusArenaApplyHandler);
        delete (window as any).__nexusArenaApplyHandler;
      }
      if ((window as any).__nexusSyncCursorHandler) {
        window.removeEventListener('SYNC_NEXUS_CURSOR', (window as any).__nexusSyncCursorHandler);
        delete (window as any).__nexusSyncCursorHandler;
        delete (window as any).__nexusSyncTarget;
      }
      cancelAnimationFrame(animationFrameId);

      // Use locally-captured 'container' — containerRef.current is null after unmount
      if (renderer && container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (uiContainer) {
        uiContainer.innerHTML = '';
        if (uiContainer.parentNode) uiContainer.parentNode.removeChild(uiContainer);
      }
      const leftoverBadge = document.getElementById("nexus-fps-badge");
      if (leftoverBadge) leftoverBadge.remove();
      
      if (renderer) renderer.dispose();
      if (material) material.dispose();
      if (scene) scene.clear();
    };
  }, []);

  return (
    <>
      <div 
        ref={containerRef} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, overflow: 'hidden' }} 
      />
    </>
  );
}
