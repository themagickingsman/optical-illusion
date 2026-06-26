"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function VolumetricClouds() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
    let geometry: THREE.BoxGeometry, material: THREE.MeshLambertMaterial, mesh: THREE.Mesh;
    let textGeo: THREE.PlaneGeometry, textTexture: THREE.Texture, textMaterial: THREE.MeshLambertMaterial, text: THREE.Mesh;
    let smokeTexture: THREE.Texture, smokeMaterial: THREE.MeshLambertMaterial, smokeGeo: THREE.PlaneGeometry;
    let smokeParticles: THREE.Mesh[] = [];
    let clock: THREE.Clock;
    let cubeSineDriver = 0;
    let delta = 0;
    let animationFrameId: number;
    let light: THREE.DirectionalLight;

    function init() {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      clock = new THREE.Clock();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); 
      containerRef.current?.appendChild(renderer.domElement);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
      camera.position.z = 1000;
      scene.add(camera);

      geometry = new THREE.BoxGeometry(200, 200, 200);
      material = new THREE.MeshLambertMaterial({ color: 0xaa6666, wireframe: false });
      mesh = new THREE.Mesh(geometry, material);
      //scene.add( mesh );
      cubeSineDriver = 0;

      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin(''); // Need this to pull in crossdomain images from AWS
      
      textGeo = new THREE.PlaneGeometry(300, 300);
      textTexture = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/quickText.png');
      textMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x00ffff, 
        opacity: 1, 
        map: textTexture, 
        transparent: true, 
        blending: THREE.AdditiveBlending 
      });
      text = new THREE.Mesh(textGeo, textMaterial);
      text.position.z = 800;
      scene.add(text);

      light = new THREE.DirectionalLight(0xffffff, 0.5);
      light.position.set(-1, 0, 1);
      scene.add(light);
      
      // Added ambient light for safety so everything is visible
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      smokeTexture = textureLoader.load('/game_assets/fx/cloud_04_resized.png');
      smokeMaterial = new THREE.MeshLambertMaterial({ color: 0x00dddd, map: smokeTexture, transparent: true });
      smokeGeo = new THREE.PlaneGeometry(300, 300);
      smokeParticles = [];

      for (let p = 0; p < 150; p++) {
        let particle = new THREE.Mesh(smokeGeo, smokeMaterial);
        particle.position.set(
          Math.random() * 500 - 250,
          Math.random() * 500 - 250,
          Math.random() * 1000 - 100
        );
        particle.rotation.z = Math.random() * 360;
        scene.add(particle);
        smokeParticles.push(particle);
      }

      animate();
    }

    function animate() {
      delta = clock.getDelta();
      evolveSmoke();
      render();
      animationFrameId = requestAnimationFrame(animate);
    }

    function evolveSmoke() {
      let sp = smokeParticles.length;
      while (sp--) {
        smokeParticles[sp].rotation.z += (delta * 0.2);
      }
    }

    function render() {
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      cubeSineDriver += 0.01;
      mesh.position.z = 100 + (Math.sin(cubeSineDriver) * 500);
      renderer.render(scene, camera);
    }

    init();

    // Ensure the canvas is display block to prevent scrollbar/baseline gap infinite resize loops
    renderer.domElement.style.display = "block";

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!containerRef.current || !renderer || !camera) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width === 0 || height === 0) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (renderer && containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      
      // Cleanup geometries and materials
      geometry?.dispose();
      material?.dispose();
      textGeo?.dispose();
      textTexture?.dispose();
      textMaterial?.dispose();
      smokeGeo?.dispose();
      smokeTexture?.dispose();
      smokeMaterial?.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, overflow: "hidden", background: "#000" }} />;
}
