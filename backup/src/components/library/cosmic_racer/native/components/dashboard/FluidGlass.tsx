"use client";
/* eslint-disable react/no-unknown-property */
// @ts-nocheck
import * as THREE from 'three';
import { useRef, useEffect, useState, memo, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  useScroll,
  Image,
  Scroll,
  Preload,
  ScrollControls,
  MeshTransmissionMaterial,
  Environment,
  Text,
  Cone,
  Stars
} from '@react-three/drei';
// Local Polyfill for maath since NPM is blocked
import { easing } from './maath';

export default function FluidGlass({ mode = 'lens', lensProps = {}, barProps = {}, cubeProps = {}, children }: { mode?: 'lens' | 'bar' | 'cube', lensProps?: any, barProps?: any, cubeProps?: any, children?: React.ReactNode }) {
  const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens;
  const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;

  const {
    navItems = [],
    ...modeProps
  } = rawOverrides;

  const trackMouse = modeProps.followPointer ?? true;
  const cameraFov = modeProps.fov ?? 15;
  const cameraZ = modeProps.camZ ?? 50;

  return (
    <Canvas camera={{ position: [0, 0, cameraZ], fov: cameraFov }} gl={{ alpha: true }} style={{ width: '100%', height: '100%', pointerEvents: trackMouse ? 'auto' : 'none' }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} />
        <Wrapper modeProps={modeProps}>
          {children}
        </Wrapper>
    </Canvas>
  );
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  glb,
  geometryKey,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}) {
  const ref = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);
  
  const { nodes } = useGLTF(glb);
  const { viewport: vp } = useThree();

  const bgTexture = useMemo(() => {
    if (modeProps.cropCanvasRef?.current) {
      const tex = new THREE.CanvasTexture(modeProps.cropCanvasRef.current);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    }
    return null;
  }, [modeProps.cropCanvasRef]);

  // Deep cloning geometry inside useMemo without a continuous .dispose() destructor rapidly floods 
  // GPU VRAM during hot reloads resulting in severe OOM (ASCII sad face) browser crashes.
  // Furthermore, we discovered .center() was actually unbalancing the shield into the corner! 
  // We now strictly use the natively imported, pristine origin node from the primitive raw mesh exclusively.

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    if (bgTexture) {
      bgTexture.needsUpdate = true;
    }

    const { pointer, camera, viewport } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 0]);

    const pointerTrack = modeProps.followPointer ?? followPointer;

    let destX = 0, destY = 0;
    
    const trackPos = modeProps.previewPosRef?.current;

    if (trackPos && !modeProps.isDomCentered) {
      // Precise mapping of WASD CSS pixels into WebGL unprojected viewport tracking bounds
      destX = ((trackPos.x / window.innerWidth) * 2 - 1) * (v.width / 2);
      destY = -((trackPos.y / window.innerHeight) * 2 - 1) * (v.height / 2);
      
      // We match AsteroidsGame's CSS rotation calculation precisely:
      // Angle + PI/2, inversed for WebGL 2D plane conversion
      const renderAngle = - (trackPos.angle + Math.PI / 2);
      ref.current.rotation.y = renderAngle;
      
      if (modeProps.preview) {
        if (arrowRef.current) {
          arrowRef.current.position.x = destX;
          arrowRef.current.position.y = destY;
          arrowRef.current.rotation.z = renderAngle;
        }
      }
    } else if (modeProps.preview) {
      // In preview mode, add slight subtle rotation/movement
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      ref.current.rotation.x = Math.PI / 2 + Math.cos(state.clock.elapsedTime) * 0.1;
      destX = lockToBottom ? 0 : pointerTrack ? (pointer.x * v.width) / 4 : 0;
      destY = lockToBottom ? -v.height / 2 + 0.2 : pointerTrack ? (pointer.y * v.height) / 4 : 0;
    } else {
      destX = pointerTrack ? (pointer.x * v.width) / 2 : 0;
      destY = lockToBottom ? -v.height / 2 + 0.2 : pointerTrack ? (pointer.y * v.height) / 2 : 0;
    }

    easing.damp3(ref.current.position, [destX, destY, 0], 0.25, delta);

    let finalScale = modeProps.scale ?? 0.15;
    if (trackPos && trackPos.totalScale !== undefined) {
      finalScale = trackPos.totalScale;
    }
    ref.current.scale.setScalar(finalScale);
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration, customX, customY, ...extraMat } = modeProps;

  return (
    <>
      {modeProps.preview && (
        <group position={[0, 0, -5]}>
             <gridHelper args={[100, 100, '#00e5ff', '#d946ef']} rotation-x={Math.PI/2} position={[0, 0, -1]} />
             <Text fontSize={3} color="#d946ef" anchorX="center" anchorY="middle" letterSpacing={0.1}>
               LIQUID SHIELD
             </Text>
             <mesh position={[-3, 2, -2]}>
               <sphereGeometry args={[0.5, 32, 32]} />
               <meshBasicMaterial color="#00e5ff" />
             </mesh>
             <mesh position={[4, -1, -3]}>
               <sphereGeometry args={[1.0, 32, 32]} />
               <meshBasicMaterial color="#d946ef" />
             </mesh>
        </group>
      )}

      {children}

      <group ref={ref} scale={scale ?? 0.15} rotation-x={Math.PI / 2} {...props}>
        <mesh geometry={nodes[geometryKey]?.geometry} position={[0, 0, 0]}>
          <MeshTransmissionMaterial
            buffer={bgTexture || undefined}
            background={modeProps.preview ? new THREE.Color('#060010') : null}
            transmission={extraMat.transmission ?? 1}
            roughness={extraMat.roughness ?? 0.05}
            ior={ior ?? 1.15}
            thickness={thickness ?? 5}
            anisotropy={anisotropy ?? 0.01}
            chromaticAberration={chromaticAberration ?? 0.1}
            transparent={true}
            {...extraMat}
          />
        </mesh>
      </group>

      {/* Floating Arrow Indicator for CMS Directional Validation */}
      {modeProps.previewPosRef && modeProps.preview && (
        <group ref={arrowRef}>
          <Cone args={[0.2, 0.7, 3]} position={[0, 2.2 * (scale ?? 1.0), 0]}>
            <meshBasicMaterial color="#00e5ff" />
          </Cone>
        </group>
      )}
    </>
  );
});

// Stripped external dependencies to guarantee air-gapped environment execution

const NativeTorusWrapper = memo(function NativeTorusWrapper({
  children,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  scale,
  ...props
}: any) {
  const ref = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const { viewport: vp } = useThree();

  const bgTexture = useMemo(() => {
    if (modeProps.cropCanvasRef?.current) {
      const tex = new THREE.CanvasTexture(modeProps.cropCanvasRef.current);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    }
    return null;
  }, [modeProps.cropCanvasRef]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    if (bgTexture) {
      bgTexture.needsUpdate = true;
    }

    const { pointer, camera, viewport } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 0]);

    const pointerTrack = modeProps.followPointer ?? followPointer;

    let destX = 0, destY = 0;
    
    const trackPos = modeProps.previewPosRef?.current;

    if (trackPos && !modeProps.isDomCentered) {
      destX = ((trackPos.x / window.innerWidth) * 2 - 1) * (v.width / 2);
      destY = -((trackPos.y / window.innerHeight) * 2 - 1) * (v.height / 2);
      
      // For NativeTorusWrapper we lock X to 0 and rotate on Z
      const renderAngle = - (trackPos.angle + Math.PI / 2);
      ref.current.rotation.z = renderAngle;
        
      if (modeProps.preview) {
        if (arrowRef.current) {
          arrowRef.current.position.x = destX;
          arrowRef.current.position.y = destY;
          arrowRef.current.rotation.z = renderAngle;
        }
      }
    } else if (modeProps.preview) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      ref.current.rotation.x = Math.cos(state.clock.elapsedTime) * 0.1;
      destX = lockToBottom ? 0 : pointerTrack ? (pointer.x * v.width) / 4 : 0;
      destY = lockToBottom ? -v.height / 2 + 0.2 : pointerTrack ? (pointer.y * v.height) / 4 : 0;
    } else {
      destX = pointerTrack ? (pointer.x * v.width) / 2 : 0;
      destY = lockToBottom ? -v.height / 2 + 0.2 : pointerTrack ? (pointer.y * v.height) / 2 : 0;
    }

    easing.damp3(ref.current.position, [destX, destY, 0], 0.25, delta);

    let finalScale = modeProps.scale ?? 1.0;
    if (trackPos && trackPos.totalScale !== undefined && !modeProps.isDomCentered) {
      finalScale = trackPos.totalScale;
    }
    ref.current.scale.setScalar(finalScale);

    if (modeProps.previewPosRef?.current && modeProps.preview && arrowRef.current) {
      arrowRef.current.scale.setScalar(finalScale);
    }
  });

  const { scale: _s, ior, thickness, anisotropy, chromaticAberration, customX, customY, ...extraMat } = modeProps;

  return (
    <>
      {modeProps.preview && (
        <group position={[0, 0, -5]}>
             <gridHelper args={[100, 100, '#00e5ff', '#d946ef']} rotation-x={Math.PI/2} position={[0, 0, -1]} />
             <Text fontSize={3} color="#d946ef" anchorX="center" anchorY="middle" letterSpacing={0.1}>
               LIQUID SHIELD
             </Text>
        </group>
      )}

      {children}

      <group ref={ref} scale={scale ?? 1.0} rotation-x={0} {...props}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[6.58, 64, 64]} />
          <MeshTransmissionMaterial
            buffer={bgTexture || undefined}
            background={modeProps.preview ? new THREE.Color('#060010') : null}
            color={extraMat.color ?? '#d946ef'}
            transmission={extraMat.transmission ?? 1}
            roughness={extraMat.roughness ?? 0.05}
            ior={ior ?? 1.15}
            thickness={thickness ?? 1.5}
            anisotropy={anisotropy ?? 0.01}
            chromaticAberration={chromaticAberration ?? 0.1}
            transparent={true}
            {...extraMat}
          />
        </mesh>
      </group>

      {modeProps.previewPosRef && modeProps.preview && (
        <group ref={arrowRef}>
          <Cone args={[0.2, 0.7, 3]} position={[0, 7.0, 0]}>
            <meshBasicMaterial color="#00e5ff" />
          </Cone>
        </group>
      )}
    </>
  );
});

function Lens({ modeProps, ...p }) {
  return <NativeTorusWrapper followPointer={true} modeProps={modeProps} glb="" geometryKey="" {...p} />;
}

function Cube({ modeProps, ...p }: any) {
  return null; // Remote GitHub asset disabled for pure offline execution
}

function Bar({ modeProps = {}, ...p }: any) {
  return null; // Remote GitHub asset disabled for pure offline execution
}

