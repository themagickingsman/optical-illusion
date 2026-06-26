import * as THREE from 'three'
import { useEffect, useRef, useState, Suspense } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, useProgress } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

useGLTF.preload('/tag.glb')

export default function LanyardBadge({ onPlay, captains = [], imagePath = '/game_assets/avatars/v2/Gemini_Generated_Image_211xp3211xp3211x.jpeg', ropeImagePath = '', textureScaleX = 2.0, textureScaleY = 2.0, textureOffsetX = 0, textureOffsetY = 0, textureFlipX = false, textureFlipY = false }: { onPlay: () => void, captains?: { id?: string, avatar: string }[], imagePath?: string, ropeImagePath?: string, textureScaleX?: number, textureScaleY?: number, textureOffsetX?: number, textureOffsetY?: number, textureFlipX?: boolean, textureFlipY?: boolean }) {
  const bandsToRender = captains && captains.length > 0 ? captains : [{ id: 'default', avatar: imagePath }];
  const [activeId, setActiveId] = useState<string | number>(bandsToRender[0]?.id || 0);
  
  // Prevent any janky drops by suspending physics simulation entirely while the browser compiles WebGL shaders and downloads textures on initial page load
  const { active, progress } = useProgress();
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  useEffect(() => {
    // Only release the lanyards into freefall exactly when the hydration loader confirms 0 active network requests and 100% texture completion!
    if (!active || progress === 100) {
      // 100ms micro-buffer ensures the DOM and physics thread formally synchronize before locking GPU to 60 FPS.
      const timer = setTimeout(() => setPhysicsEnabled(true), 150);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
      {/* 
        The pointerEvents auto ensures we can grab the rope. 
        Canvas takes full overlay but has transparent background so Asteroids can be seen beneath it conceptually, 
        or if it needs to block clicks, it's above.
        The user clicks the lanyard and releases to play.
      */}
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }} style={{ pointerEvents: 'auto' }}>
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60} paused={!physicsEnabled}>
          {bandsToRender.map((c, i) => {
            // Distribute them evenly along the X axis
            const spacing = 1.2; // Adjusted WebGL unit spacing to fit 5 inside fov 25 camera and overlap
            const totalWidth = (bandsToRender.length - 1) * spacing;
            const offsetX = (i * spacing) - (totalWidth / 2);
            
            // Stagger their Y heights naturally (subtler alternating highs and lows)
            // Anchor strictly remains permanently fixed off-screen at exactly 10
            const staggerPattern = [0, -0.15, 0.1, -0.05, 0.15];
            const offsetDiff = (staggerPattern[i % staggerPattern.length] || 0);
            const offsetY = 10 + offsetDiff;

            const id = c.id || i;
            const isFront = activeId === id;
            // Prevent exact geometric clipping by staging them structurally on Z
            const targetZ = isFront ? 0.3 : (i * -0.15 - 0.1);
            
            return (
              <Band 
                key={id}
                targetZ={targetZ}
                onClick={() => setActiveId(id)}
                position={[offsetX, offsetY, 0]}
                onPlay={onPlay} 
                imagePath={c.avatar} 
                ropeImagePath={ropeImagePath} 
                textureScaleX={textureScaleX} 
                textureScaleY={textureScaleY} 
                textureOffsetX={textureOffsetX} 
                textureOffsetY={textureOffsetY} 
                textureFlipX={textureFlipX} 
                textureFlipY={textureFlipY} 
              />
            );
          })}

        </Physics>

        <Environment blur={0.75}>
          {/* Transparent color background to match gameplay stars behind it */}
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
        </Suspense>
      </Canvas>
    </div>
  )
}

function Band({ maxSpeed = 50, minSpeed = 10, onPlay, imagePath, ropeImagePath, textureScaleX = 1.0, textureScaleY = 1.0, textureOffsetX = 0, textureOffsetY = 0, textureFlipX = false, textureFlipY = false, position = [0, 4, 0], targetZ = 0, onClick }: { maxSpeed?: number, minSpeed?: number, onPlay: () => void, imagePath: string, ropeImagePath?: string, textureScaleX?: number, textureScaleY?: number, textureOffsetX?: number, textureOffsetY?: number, textureFlipX?: boolean, textureFlipY?: boolean, position?: [number, number, number], targetZ?: number, onClick?: () => void }) {
  const band = useRef<any>(null), bandShadow = useRef<any>(null), cardShadow = useRef<any>(null), fixed = useRef<any>(null), j1 = useRef<any>(null), j2 = useRef<any>(null), j3 = useRef<any>(null), card = useRef<any>(null) // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const segmentProps = { type: 'dynamic' as const, canSleep: true, colliders: false as const, angularDamping: 2, linearDamping: 2 }
  const { nodes, materials } = useGLTF('/tag.glb') as any
  const texture = useTexture(imagePath || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
  // Only attempt to load the rope texture if a path exists. Fallback texture mapping handled conditionally in render.
  const ropeTexture = useTexture((ropeImagePath && ropeImagePath !== '') ? ropeImagePath : (imagePath || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='))
  const { width, height } = useThree((state) => state.size)
  // Give each lanyard an organic unique initial pendulum offset so they drop swinging!
  const [swingX] = useState(() => (Math.random() * 2 - 1) * 1.5)
  const [swingZ] = useState(() => (Math.random() * 2 - 1) * 0.5)

  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(position[0] + swingX, position[1], position[2] + swingZ), 
    new THREE.Vector3(position[0] + swingX * 0.66, position[1], position[2] + swingZ * 0.66), 
    new THREE.Vector3(position[0] + swingX * 0.33, position[1], position[2] + swingZ * 0.33), 
    new THREE.Vector3(position[0], position[1], position[2])
  ]))
  const [dragged, drag] = useState<any>(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 3]) // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 3]) // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 3]) // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]) // prettier-ignore

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    // Smoothly pull the fixed coordinate toward its staggered targetZ layer on every frame
    if (fixed.current) {
      const t = fixed.current.translation()
      const newZ = THREE.MathUtils.lerp(t.z, targetZ, delta * 3.5)
      fixed.current.setNextKinematicTranslation({ x: t.x, y: t.y, z: newZ })
    }

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      // Fix most of the jitter when over pulling the card
      ;[j1, j2, j3].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      // Calculate catmul curve
      curve.points[0].copy(j3.current.lerped)
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      // @ts-ignore
      band.current.geometry.setPoints(curve.getPoints(32))
      if (bandShadow.current) {
        // @ts-ignore
        bandShadow.current.geometry.setPoints(curve.getPoints(32))
      }
      
      // Pure World Space tracking for the Shadow Card so rotation doesn't leverage it away from the rope!
      if (cardShadow.current && card.current) {
        const t = card.current.translation()
        const r = card.current.rotation()
        // Raised the Y drop relative to the previous plunging baseline
        cardShadow.current.position.set(t.x + 2.4, t.y - 2.3, t.z - 3.5)
        cardShadow.current.quaternion.set(r.x, r.y, r.z, r.w)
      }

      // Tilt it back towards the screen
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  // @ts-ignore
  curve.curveType = 'centripetal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  // Support responsive image scaling so the user can zoom out portrait textures natively.
  // We explicitly multiply by -1 to flip the axis on UVs if the specific image loads backwards!
  texture.repeat.set(textureScaleX * (textureFlipX ? -1 : 1), textureScaleY * (textureFlipY ? -1 : 1));

  // Allow the user to manually pan the offset to frame it around bottom-right or center!
  // By default, ThreeJS scales from the corner (0,0). Giving the user offset control lets them counter-shift it.
  texture.offset.set(textureOffsetX, textureOffsetY);

  // Fix upside down rendering on the card
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI;

  const handlePointerUp = (e: any) => {
    if (e.target) {
       (e.target as Element).releasePointerCapture(e.pointerId);
    }
    drag(false);
  };

  return (
    <>
      <group position={position}>
        <RigidBody ref={fixed} {...segmentProps} type="kinematicPosition" />
        <RigidBody position={[swingX * 0.25, 0, swingZ * 0.25]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[swingX * 0.50, 0, swingZ * 0.50]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[swingX * 0.75, 0, swingZ * 0.75]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[swingX, 0, swingZ]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          {/* Shrunk the physics width so they visually overlap without explosive physics collisions */}
          <CuboidCollider args={[0.4, 1.125, 0.01]} />

          {/* Real Card */}
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={handlePointerUp}
            onPointerDown={(e) => { 
                onClick?.();
                (e.target as Element).setPointerCapture(e.pointerId); 
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))); 
            }}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={texture} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      {/* Shadow Card (Tracked outside physics for parallel world space projection) */}
      <group ref={cardShadow} position={[0, 13, 0]}>
        <group scale={2.25} position={[0, -1.2, -0.05]}>
          <mesh geometry={nodes.card.geometry}>
            <meshBasicMaterial color="black" transparent opacity={0.075} depthWrite={false} />
          </mesh>
          <mesh geometry={nodes.clip.geometry}>
            <meshBasicMaterial color="black" transparent opacity={0.075} depthWrite={false} />
          </mesh>
          <mesh geometry={nodes.clamp.geometry}>
             <meshBasicMaterial color="black" transparent opacity={0.075} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* Shadow Rope */}
      <mesh ref={bandShadow} position={[2.4, -2.3, -3.5]}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial color="black" transparent opacity={0.075} depthTest={false} resolution={[width, height]} lineWidth={1} />
      </mesh>
      {/* Real Rope */}
      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {ropeImagePath && ropeImagePath !== '' ? (
          // @ts-ignore
          <meshLineMaterial color="white" resolution={[width, height]} useMap map={ropeTexture} repeat={[-3, 1]} lineWidth={1} />
        ) : (
          // @ts-ignore
          <meshLineMaterial color="black" resolution={[width, height]} lineWidth={1} />
        )}
      </mesh>
    </>
  )
}
