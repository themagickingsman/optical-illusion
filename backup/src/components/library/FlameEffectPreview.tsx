"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FlameEffectPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRef = useRef<number>(0);
  
  // UI State for instructions
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    // Add some fog for depth
    scene.fog = new THREE.Fog(0x050508, 10, 40);

    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 2. Environment (Infinite Grid) ---
    const gridHelper = new THREE.GridHelper(100, 50, 0x03FFC0, 0x222233);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // --- 3. The Triangle Ship ---
    const shipGroup = new THREE.Group();
    
    // Create a sleek triangle ship using a Cone
    const shipGeo = new THREE.ConeGeometry(1.5, 4, 3);
    // Rotate so it points forward (along -Z axis)
    shipGeo.rotateX(-Math.PI / 2);
    // Flatten it to look like a sleek wing
    shipGeo.scale(1, 0.3, 1);
    
    const shipMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true, // Wireframe looks very "technical asset"
      emissive: 0x002222
    });
    
    const shipMesh = new THREE.Mesh(shipGeo, shipMat);
    shipGroup.add(shipMesh);
    scene.add(shipGroup);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x03FFC0, 2, 20);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // --- 4. The Dynamic Flame Shader ---
    const flameGeo = new THREE.PlaneGeometry(1.5, 3);
    const flameMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        uThrottle: { value: 0.0 }, // Starts at 0 (idle)
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float uThrottle;
        varying vec2 vUv;
        
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float dist = length(p * vec2(1.0, 0.5));
          
          float noise = sin(p.y * 15.0 - time * 20.0) * 0.1;
          float edge = smoothstep(1.0 + noise, 0.2 + noise, dist);
          float core = smoothstep(0.4 + noise * 0.5, 0.0, dist);
          
          vec3 idleColor = vec3(0.05, 0.2, 1.0);
          vec3 activeColor = vec3(0.0, 1.0, 1.0);
          vec3 baseColor = mix(idleColor, activeColor, uThrottle);
          vec3 finalColor = edge * baseColor + core * mix(baseColor, vec3(1.0), uThrottle);
          
          float xFade = smoothstep(1.0, -0.5, p.y);
          float alpha = (edge + core) * xFade;
          
          gl_FragColor = vec4(finalColor * alpha, alpha * (0.3 + (uThrottle * 0.7)));
        }
      `
    });
    
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    // Attach to the back of the ship
    flameMesh.position.set(0, 0, 2);
    // Rotate to face backwards
    flameMesh.rotation.x = Math.PI / 2;
    shipGroup.add(flameMesh);

    // Engine Glow Light attached to throttle
    const engineGlow = new THREE.PointLight(0x00aaff, 0, 8);
    engineGlow.position.set(0, 0, 2);
    shipGroup.add(engineGlow);


    // --- 5. Input & Physics State ---
    const keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      setHasInteracted(true);
      const key = e.key.toLowerCase();
      if (keys.hasOwnProperty(key)) keys[key as keyof typeof keys] = true;
      if (e.key === 'ArrowUp') keys.up = true;
      if (e.key === 'ArrowDown') keys.down = true;
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keys.hasOwnProperty(key)) keys[key as keyof typeof keys] = false;
      if (e.key === 'ArrowUp') keys.up = false;
      if (e.key === 'ArrowDown') keys.down = false;
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let shipVelocityX = 0;
    let targetThrottle = 0;
    let currentThrottle = 0;
    let shipRoll = 0;
    let shipPitch = 0;

    // --- 6. Main Animation Loop ---
    const clock = new THREE.Clock();
    
    const animate = () => {
      if (!rendererRef.current) return;
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      // Update Inputs
      const isAccelerating = keys.w || keys.up;
      const isBraking = keys.s || keys.down;
      const isLeft = keys.a || keys.left;
      const isRight = keys.d || keys.right;

      // Throttle Physics
      if (isAccelerating) targetThrottle = 1.0;
      else if (isBraking) targetThrottle = -0.2;
      else targetThrottle = 0.1; // Pilot light idle

      // Smooth throttle interpolation
      currentThrottle += (targetThrottle - currentThrottle) * delta * 5.0;
      
      // Update Flame Shader
      flameMat.uniforms.time.value = elapsedTime;
      flameMat.uniforms.uThrottle.value = Math.max(0, currentThrottle);
      
      // Flame scale reacts to throttle
      const scaleY = 1.0 + (currentThrottle * 1.5);
      flameMesh.scale.set(1.0 + currentThrottle * 0.5, scaleY, 1.0);
      flameMesh.position.z = 2 + (currentThrottle * 0.5); // Push flame back slightly as it gets bigger
      
      engineGlow.intensity = Math.max(0, currentThrottle * 5);

      // Ship Movement (Horizontal)
      let targetRoll = 0;
      if (isLeft) {
        shipVelocityX -= delta * 15;
        targetRoll = Math.PI / 4;
      } else if (isRight) {
        shipVelocityX += delta * 15;
        targetRoll = -Math.PI / 4;
      } else {
        // Friction
        shipVelocityX *= 0.9;
      }
      
      // Clamp velocity
      shipVelocityX = Math.max(-10, Math.min(10, shipVelocityX));
      shipGroup.position.x += shipVelocityX * delta;
      
      // Keep in bounds
      if (shipGroup.position.x > 8) shipGroup.position.x = 8;
      if (shipGroup.position.x < -8) shipGroup.position.x = -8;

      // Smooth Roll & Pitch
      shipRoll += (targetRoll - shipRoll) * delta * 5.0;
      shipGroup.rotation.z = shipRoll;
      
      let targetPitch = isAccelerating ? -0.1 : (isBraking ? 0.2 : 0);
      // Subtle idle hover bobbing
      targetPitch += Math.sin(elapsedTime * 2) * 0.05;
      shipPitch += (targetPitch - shipPitch) * delta * 5.0;
      shipGroup.rotation.x = shipPitch;
      shipGroup.position.y = Math.sin(elapsedTime * 3) * 0.1; // Bob up and down

      // Move Environment to simulate speed
      const baseSpeed = 5;
      const boostSpeed = currentThrottle * 20;
      const speed = baseSpeed + boostSpeed;
      gridHelper.position.z += speed * delta;
      if (gridHelper.position.z > 5) {
        gridHelper.position.z -= 5; // Seamless looping
      }

      // Render
      rendererRef.current.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    // --- 7. Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      shipGeo.dispose();
      shipMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', outline: 'none' }} 
        tabIndex={0} // Make it focusable for keyboard events
      />
      
      {/* UI Overlay for controls */}
      {!hasInteracted && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(3, 255, 192, 0.3)',
          padding: '12px 24px',
          borderRadius: '30px',
          color: 'white',
          fontSize: '14px',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          pointerEvents: 'none',
          animation: 'pulse 2s infinite'
        }}>
          <style>{`
            @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
            .key-cap { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #03FFC0; font-weight: bold; }
          `}</style>
          <span>Use <span className="key-cap">W</span> <span className="key-cap">A</span> <span className="key-cap">S</span> <span className="key-cap">D</span> to fly</span>
        </div>
      )}
    </div>
  );
}
