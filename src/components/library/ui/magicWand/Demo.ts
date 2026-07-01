import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import {
    Discard,
    Fn,
    If,
    deltaTime,
    distance,
    float,
    hash,
    instanceIndex,
    normalize,
    pass,
    smoothstep,
    storage,
    time,
    uint,
    uniform,
    uv,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';
import {
    ComputeNode,
    InstancedMesh,
    Plane,
    PlaneGeometry,
    RenderPipeline,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    TimestampQuery,
    Vector3,
} from 'three/webgpu';
import BaseExperience from './BaseExperience';
import { Pointer } from './Pointer';

function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

class Demo extends BaseExperience {
    postProcessing: RenderPipeline;
    mesh!: InstancedMesh<PlaneGeometry, SpriteNodeMaterial>;
    particlesCycleBuffer!: StorageBufferNode<'float'>;
    particlesPhaseBuffer!: StorageBufferNode<'float'>; // 0=rocket, 1=exploded

    updateParticlesCompute!: ComputeNode;
    bloomPass!: ReturnType<typeof bloom>;

    params = {
        totalFireworks: 20,
        particlesPerFirework: 150,
        trailParticles: 50,
        fireworkSpeed: 1.0,
        usePostprocessing: true,
        sparkLifeDecay: 1.0,
        sparkSpread: 1.2,
        spreadX: 0.8,
        bloom: {
            intensity: 0.6,
            radius: 0.5,
            threshold: 0.1,
        },
    };

    uniforms = {
        fireworkSpeed: uniform(this.params.fireworkSpeed),
        sparkLifeDecay: uniform(this.params.sparkLifeDecay),
        sparkSpread: uniform(this.params.sparkSpread),
        spreadX: uniform(this.params.spreadX),
        finaleMode: uniform(0), // 0 = single rockets, 1 = continuous finale
        finaleStartTime: uniform(0.0),
        launchTrigger: uniform(0),
        targetGroupId: uniform(0),
    };

    launches: number[] = [];
    nextGroupId = 0;

    launchRocket() {
        this.launches.push(this.nextGroupId % this.params.totalFireworks);
        this.nextGroupId++;
    }

    startFinale() {
        this.uniforms.finaleMode.value = 1;
        this.uniforms.finaleStartTime.value = this.clock.getElapsed();
    }

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 0, 25); 

        const totalAmount = this.params.totalFireworks * this.params.particlesPerFirework;

        this.particlesPositionsBuffer = storage(
            new StorageInstancedBufferAttribute(totalAmount, 3),
            'vec3',
            totalAmount,
        ).setPBO(true);

        this.particlesLifeBuffer = storage(
            new StorageInstancedBufferAttribute(totalAmount, 1),
            'float',
            totalAmount,
        );

        this.particlesVelocitiesBuffer = storage(
            new StorageInstancedBufferAttribute(totalAmount, 3),
            'vec3',
            totalAmount,
        );
        
        this.particlesAgeBuffer = storage(
            new StorageInstancedBufferAttribute(totalAmount, 1),
            'float',
            totalAmount,
        );

        this.particlesPhaseBuffer = storage(
            new StorageInstancedBufferAttribute(totalAmount, 1),
            'float',
            totalAmount,
        );

        const initParticlesCompute = Fn(() => {
            this.particlesPositionsBuffer.element(instanceIndex).xyz.assign(vec3(0, -99, 0));
            this.particlesVelocitiesBuffer.element(instanceIndex).xyz.assign(vec3(0));
            this.particlesLifeBuffer.element(instanceIndex).assign(0);
            this.particlesAgeBuffer.element(instanceIndex).assign(-1.0);
            this.particlesPhaseBuffer.element(instanceIndex).assign(2); // 2 = uninitialized
        })().compute(totalAmount);

        void this.renderer.computeAsync(initParticlesCompute);

        this.updateParticlesCompute = Fn(() => {
            const position = this.particlesPositionsBuffer.element(instanceIndex);
            const velocity = this.particlesVelocitiesBuffer.element(instanceIndex);
            const life = this.particlesLifeBuffer.element(instanceIndex);
            const age = this.particlesAgeBuffer.element(instanceIndex);
            const phase = this.particlesPhaseBuffer.element(instanceIndex);

            const particlesPerGroup = uint(this.params.particlesPerFirework);
            const groupId = float(uint(instanceIndex).div(particlesPerGroup));
            const localId = float(uint(instanceIndex).mod(particlesPerGroup));
            const trailCount = float(this.params.trailParticles);

            const isTrail = localId.lessThan(trailCount);
            const isExplosion = localId.greaterThanEqual(trailCount);

            // Time offset logic for finale stagger
            const groupTimeOffset = hash(groupId).mul(4.0);

            // Increment age if active
            If(age.greaterThanEqual(0.0), () => {
                age.addAssign(deltaTime.mul(this.uniforms.fireworkSpeed));
            });

            // unique seed for launch directions
            const launchSeed = groupId.add(uint(time).toFloat()); 

            const doLaunch = Fn(() => {
                const startX = hash(launchSeed).mul(12).sub(6).mul(this.uniforms.spreadX);
                position.xyz.assign(vec3(startX, -5.5, 0));
                
                const upVel = hash(launchSeed.add(1)).mul(6).add(14); // 14 to 20!
                velocity.xyz.assign(vec3(0, upVel, 0));
                
                phase.assign(0); // Rocket phase
                age.assign(0.0);
                life.assign(hash(instanceIndex).mul(1.0).add(0.5));
            });

            If(this.uniforms.finaleMode.equal(1), () => {
                // Finale Mode: Staggered continuous loop
                If(age.greaterThan(4.0).or(age.lessThan(0.0).and(time.greaterThan(this.uniforms.finaleStartTime.add(groupTimeOffset)))), () => {
                    doLaunch();
                });
            }).ElseIf(this.uniforms.launchTrigger.equal(1).and(groupId.equal(this.uniforms.targetGroupId)), () => {
                // Imperative single launch
                doLaunch();
            });

            If(age.greaterThanEqual(0.0), () => {
                const prevAge = age.sub(deltaTime.mul(this.uniforms.fireworkSpeed));

                // Detect explosion transition!
                If(age.greaterThanEqual(1.0).and(prevAge.lessThan(1.0)), () => {
                    If(isExplosion, () => {
                        phase.assign(1); // Mark as exploded
                        
                        const randomDir = normalize(vec3(
                            hash(instanceIndex.add(launchSeed)).sub(0.5),
                            hash(instanceIndex.add(launchSeed).add(1)).sub(0.5),
                            hash(instanceIndex.add(launchSeed).add(2)).sub(0.5)
                        ));
                        const burstSpeed = hash(instanceIndex.add(launchSeed).add(3)).mul(6).add(2);
                        velocity.xyz.assign(randomDir.mul(burstSpeed).mul(this.uniforms.sparkSpread));
                    });
                });

                // Handle Trail dropping out during Rocket phase
                If(age.lessThan(1.0).and(phase.equal(0)), () => {
                    If(isTrail, () => {
                        const dropOutCycle = localId.div(trailCount); // 0.0 to 1.0
                        If(age.greaterThanEqual(dropOutCycle).and(prevAge.lessThan(dropOutCycle)), () => {
                            phase.assign(1); // Drop out!
                            velocity.xyz.assign(vec3(0)); // stop upward velocity
                        });
                    });
                });

                // Physics step
                If(phase.equal(0), () => {
                    velocity.y.subAssign(deltaTime.mul(10)); // Rocket gravity
                }).ElseIf(phase.equal(1), () => {
                    velocity.y.subAssign(deltaTime.mul(3)); // Explosion slow drift gravity
                });

                velocity.mulAssign(0.98); // Friction
                position.xyz.addAssign(velocity.mul(deltaTime));
            });
        })().compute(totalAmount);

        const geometry = new PlaneGeometry();

        const material = new SpriteNodeMaterial({
            depthWrite: false,
            sizeAttenuation: true,
            transparent: true,
        });

        material.positionNode = this.particlesPositionsBuffer.element(instanceIndex);

        material.scaleNode = float(0.06);

        material.colorNode = Fn(() => {
            Discard(distance(uv(), vec2(0.5)).greaterThan(0.5));

            const age = this.particlesAgeBuffer.element(instanceIndex);
            const phase = this.particlesPhaseBuffer.element(instanceIndex);
            
            const particlesPerGroup = uint(this.params.particlesPerFirework);
            const groupId = float(uint(instanceIndex).div(particlesPerGroup));
            const localId = float(uint(instanceIndex).mod(particlesPerGroup));
            const trailCount = float(this.params.trailParticles);

            const isTrail = localId.lessThan(trailCount);
            const isExplosion = localId.greaterThanEqual(trailCount);
            
            const launchSeed = groupId.add(uint(time).toFloat());

            const opacity = float(0).toVar();

            If(age.greaterThanEqual(0.0), () => {
                If(age.lessThan(1.0), () => {
                    // Rocket Phase
                    If(localId.equal(0), () => {
                        opacity.assign(1.0); // Rocket head is fully visible
                    }).ElseIf(isTrail, () => {
                        const dropOutCycle = localId.div(trailCount);
                        If(age.greaterThanEqual(dropOutCycle), () => {
                            const trailAge = age.sub(dropOutCycle);
                            opacity.assign(smoothstep(0.5, 0.0, trailAge));
                        });
                    });
                }).ElseIf(age.lessThan(3.0), () => {
                    // Explosion Phase
                    If(isExplosion, () => {
                        const explosionAge = age.sub(1.0);
                        const individualLife = this.particlesLifeBuffer.element(instanceIndex);
                        opacity.assign(smoothstep(individualLife, 0.0, explosionAge));
                    });
                });
            });

            const color = vec3(
                hash(launchSeed),
                hash(launchSeed.add(1)),
                hash(launchSeed.add(2))
            );

            const dist = distance(uv(), vec2(0.5));
            const softOpacity = opacity.mul(smoothstep(0.5, 0.0, dist));

            return vec4(color, softOpacity);
        })();

        this.mesh = new InstancedMesh(geometry, material, this.params.totalFireworks * this.params.particlesPerFirework);
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
        this.scene.add(this.mesh);

        this.postProcessing = new RenderPipeline(this.renderer);

        const scenePass = pass(this.scene, this.camera);
        const scenePassColor = scenePass.getTextureNode('output');

        this.bloomPass = bloom(
            scenePassColor,
            this.params.bloom.intensity,
            this.params.bloom.radius,
            this.params.bloom.threshold,
        );

        this.postProcessing.outputNode = vec4(
            scenePassColor.xyz.add(this.bloomPass.xyz),
            scenePassColor.a.add(this.bloomPass.x).add(this.bloomPass.y).add(this.bloomPass.z) // Fix: force bloom to write to alpha channel on transparent canvas
        );
    }

    async render() {
        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        if (this.launches.length > 0) {
            this.uniforms.targetGroupId.value = this.launches.shift() as number;
            this.uniforms.launchTrigger.value = 1;
        } else {
            this.uniforms.launchTrigger.value = 0;
        }

        try {
            await this.renderer.computeAsync(this.updateParticlesCompute);
        } catch (e) {
            console.error("Compute async failed:", e);
        }

        if (this.params.usePostprocessing) {
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        this.particlesPositionsBuffer.dispose();
        this.particlesLifeBuffer.dispose();
        this.particlesVelocitiesBuffer.dispose();
        this.particlesAgeBuffer.dispose();
        this.particlesPhaseBuffer.dispose();

        this.postProcessing.dispose();

        super.destroy();
    }
}

export default Demo;
