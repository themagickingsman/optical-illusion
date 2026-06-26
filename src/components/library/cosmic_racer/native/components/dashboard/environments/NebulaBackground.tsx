import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface NebulaBackgroundProps {
  bumpScale?: number;
  lightIntensity?: number;
  opacity?: number;
  blendMode?: string;
}

export const NebulaBackground: React.FC<NebulaBackgroundProps> = ({
  bumpScale = 0.05,
  lightIntensity = 1.0,
  opacity = 1.0,
  blendMode = 'screen'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use a state to trigger re-renders if needed, but mostly we update uniforms
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Explicitly ensure background is transparent
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    
    // Orthographic camera for 2D plane
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const colorMap = textureLoader.load('/game_assets/backgrounds/nebula/color_stars.png');
    const alphaMap = textureLoader.load('/game_assets/backgrounds/nebula/alpha_stars.png');
    const bumpMap = textureLoader.load('/game_assets/backgrounds/nebula/bump_stars.png');
    const lightMap = textureLoader.load('/game_assets/backgrounds/nebula/light_stars.png');

    // Create material
    const material = new THREE.MeshStandardMaterial({
      map: colorMap,
      alphaMap: alphaMap,
      bumpMap: bumpMap,
      emissiveMap: lightMap,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: lightIntensity,
      bumpScale: bumpScale,
      transparent: true,
      opacity: opacity,
      depthTest: false,
      depthWrite: false,
      alphaTest: 0.05,
    });

    // We want the plane to match the native resolution of the texture (1756x988)
    const geometry = new THREE.PlaneGeometry(1756, 988);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Add lighting for the bump map to react to
    const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      
      renderer.setSize(width, height);
      
      // Update camera to match container pixel dimensions (so 1 unit = 1 pixel)
      camera.left = width / -2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = height / -2;
      camera.updateProjectionMatrix();
      
      renderer.render(scene, camera);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    window.addEventListener('resize', resize, false);
    
    // Initial render
    setTimeout(resize, 50);

    // Save references for live updates
    (container as any)._nebulaEngine = { material };

    let animationFrameId: number;
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update material properties dynamically when props change
  useEffect(() => {
    if (containerRef.current) {
      const engine = (containerRef.current as any)._nebulaEngine;
      if (engine && engine.material) {
        engine.material.bumpScale = bumpScale;
        engine.material.emissiveIntensity = lightIntensity;
        engine.material.opacity = opacity;
        
        // Map CSS blend mode strings to Three.js blending modes
        let threeBlendMode = THREE.NormalBlending;
        if (blendMode === 'screen' || blendMode === 'additive' || blendMode === 'color-dodge' || blendMode === 'lighten') {
          threeBlendMode = THREE.AdditiveBlending;
        } else if (blendMode === 'multiply') {
          threeBlendMode = THREE.MultiplyBlending;
        }
        engine.material.blending = threeBlendMode;
        
        engine.material.needsUpdate = true;
      }
    }
  }, [bumpScale, lightIntensity, opacity, blendMode]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        mixBlendMode: blendMode as any,
        pointerEvents: 'none',
        zIndex: 0 // Keep it in the background
      }} 
    />
  );
};

export default NebulaBackground;
