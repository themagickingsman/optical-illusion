import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

const MAX_PARTICLES = 10000;
const SHARDS_PER_EXPLOSION = 200;
const MAX_LIFETIME = 5.0; // seconds

const vertexShader3D = `
    uniform float uTime;
    uniform float uSize;
    uniform float uLifeMult;
    uniform float uSpeedMult;
    attribute vec3 aOrigin;
    attribute vec3 aVelocity;
    attribute float aStartTime;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vLife;

    void main() {
        vColor = aColor;
        
        float age = max(0.0, (uTime - aStartTime)) * uSpeedMult;
        vLife = max(0.0, 1.0 - (age / (5.0 * uLifeMult)));

        // If not born yet or dead, shrink to 0
        float scale = (age > 0.0 && vLife > 0.0) ? (vLife * uSize) : 0.0;
        
        vec3 pos = aOrigin + aVelocity * age;
        pos.y -= 0.5 * 1.5 * age * age;
        
        if (pos.y < 0.0) {
            pos.y = -pos.y * 0.4;
            pos.x = aOrigin.x + (aVelocity.x * age * 0.5);
            pos.z = aOrigin.z + (aVelocity.z * age * 0.5);
        }

        mat3 rot;
        float angleX = age * aVelocity.x * 2.0;
        float angleY = age * aVelocity.y * 2.0;
        float angleZ = age * aVelocity.z * 2.0;
        
        float cx = cos(angleX), sx = sin(angleX);
        float cy = cos(angleY), sy = sin(angleY);
        float cz = cos(angleZ), sz = sin(angleZ);
        
        mat3 rotX = mat3(1.0, 0.0, 0.0,  0.0, cx, sx,  0.0, -sx, cx);
        mat3 rotY = mat3(cy, 0.0, -sy,  0.0, 1.0, 0.0,  sy, 0.0, cy);
        mat3 rotZ = mat3(cz, sz, 0.0,  -sz, cz, 0.0,  0.0, 0.0, 1.0);
        
        vec3 rotatedPosition = rotZ * rotY * rotX * position;
        
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos + rotatedPosition * scale * 1.5, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const vertexShader2D = `
    uniform float uTime;
    uniform float uSize;
    uniform float uLifeMult;
    uniform float uSpeedMult;
    attribute vec3 aOrigin;
    attribute vec3 aVelocity;
    attribute float aStartTime;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vLife;

    void main() {
        vColor = aColor;
        
        float age = max(0.0, (uTime - aStartTime)) * uSpeedMult;
        vLife = max(0.0, 1.0 - (age / (5.0 * uLifeMult)));

        float scale = (age > 0.0 && vLife > 0.0) ? (vLife * uSize) : 0.0;
        
        vec3 pos = aOrigin + aVelocity * age;
        pos.y -= 0.5 * 1.5 * age * age;
        
        if (pos.y < 0.0) {
            pos.y = -pos.y * 0.4;
            pos.x = aOrigin.x + (aVelocity.x * age * 0.5);
            pos.z = aOrigin.z + (aVelocity.z * age * 0.5);
        }
        
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size points based on scale and perspective depth
        gl_PointSize = (150.0 * scale) / -mvPosition.z;
    }
`;

const fragmentShader = `
    uniform float uEmissiveMult;
    varying vec3 vColor;
    varying float vLife;

    void main() {
        if (vLife <= 0.0) discard;
        // Bright emissive color
        gl_FragColor = vec4(vColor * uEmissiveMult, 1.0);
    }
`;

export class GPUParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private mesh: THREE.InstancedMesh | THREE.Points;
    private nextParticleIdx = 0;
    private dimensionType: '2D' | '3D';
    
    private material: THREE.ShaderMaterial;
    private clock: THREE.Clock;

    // Attributes
    private aOrigin: THREE.InstancedBufferAttribute | THREE.BufferAttribute;
    private aVelocity: THREE.InstancedBufferAttribute | THREE.BufferAttribute;
    private aStartTime: THREE.InstancedBufferAttribute | THREE.BufferAttribute;
    private aColor: THREE.InstancedBufferAttribute | THREE.BufferAttribute;

    constructor(dimensionType: '2D' | '3D' = '2D') {
        this.dimensionType = dimensionType;
        this.group = new THREE.Group();
        this.clock = new THREE.Clock();
        
        this.material = new THREE.ShaderMaterial({
            vertexShader: this.dimensionType === '3D' ? vertexShader3D : vertexShader2D,
            fragmentShader,
            uniforms: {
                uTime: { value: 0.0 },
                uEmissiveMult: { value: 1.5 },
                uSize: { value: 1.0 },
                uLifeMult: { value: 1.0 },
                uSpeedMult: { value: 1.0 }
            },
            transparent: true,
            depthWrite: this.dimensionType === '3D',
            blending: this.dimensionType === '2D' ? THREE.AdditiveBlending : THREE.NormalBlending
        });

        if (this.dimensionType === '3D') {
            const boxGeo = new THREE.PlaneGeometry(0.15, 0.15); 
            this.aOrigin = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
            this.aVelocity = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
            this.aStartTime = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 1), 1);
            this.aColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);

            boxGeo.setAttribute('aOrigin', this.aOrigin);
            boxGeo.setAttribute('aVelocity', this.aVelocity);
            boxGeo.setAttribute('aStartTime', this.aStartTime);
            boxGeo.setAttribute('aColor', this.aColor);

            for (let i = 0; i < MAX_PARTICLES; i++) {
                this.aStartTime.setX(i, -9999.0);
            }

            this.mesh = new THREE.InstancedMesh(boxGeo, this.material, MAX_PARTICLES);
            (this.mesh as THREE.InstancedMesh).instanceMatrix.setUsage(THREE.StaticDrawUsage); 
            this.mesh.frustumCulled = false; 
        } else {
            const pointGeo = new THREE.BufferGeometry();
            
            // For Points, we need position even if we don't use it, to satisfy ThreeJS internals sometimes, 
            // but actually we can just leave position empty and use our custom attributes.
            const positions = new Float32Array(MAX_PARTICLES * 3); // dummy
            this.aOrigin = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
            this.aVelocity = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
            this.aStartTime = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 1), 1);
            this.aColor = new THREE.BufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);

            pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            pointGeo.setAttribute('aOrigin', this.aOrigin);
            pointGeo.setAttribute('aVelocity', this.aVelocity);
            pointGeo.setAttribute('aStartTime', this.aStartTime);
            pointGeo.setAttribute('aColor', this.aColor);

            for (let i = 0; i < MAX_PARTICLES; i++) {
                this.aStartTime.setX(i, -9999.0);
            }

            this.mesh = new THREE.Points(pointGeo, this.material);
            this.mesh.frustumCulled = false;
        }
        
        this.group.add(this.mesh);
    }

    public explode(
        x: number, 
        y: number, 
        z: number, 
        force: number, 
        radius: number, 
        color: THREE.Color,
        isTreasureMode: boolean = false,
        amount: number = 300,
        bloomParticlesOnly?: boolean
    ): void {
        this.material.uniforms.uEmissiveMult.value = isTreasureMode ? 2.0 : (bloomParticlesOnly ? 10.0 : 1.5);
        
        const time = this.clock.getElapsedTime();
        const emitCount = Math.min(amount, MAX_PARTICLES);

        for (let i = 0; i < emitCount; i++) {
            const idx = this.nextParticleIdx;
            this.nextParticleIdx = (this.nextParticleIdx + 1) % MAX_PARTICLES;
            
            // Random offset
            const px = x + (Math.random() - 0.5) * 0.8; 
            const py = y + (Math.random() - 0.5) * 0.8; 
            const pz = z + (Math.random() - 0.5) * 0.8; 
            
            // Note: Since shader uses absolute seconds for age instead of frames, 
            // we scale the velocity up so it looks similar.
            const vScale = 25.0; // Lowered from 60.0 to decrease OP optimized speed
            const speed = ((force * 0.05) + Math.random() * (force * 0.03)) * vScale;
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            const vx = Math.sin(phi) * Math.cos(theta) * speed; 
            const vy = (Math.abs(Math.cos(phi)) * speed + (force * 0.02 * vScale)); 
            const vz = Math.sin(phi) * Math.sin(theta) * speed; 
            
            this.aOrigin.setXYZ(idx, px, py, pz);
            this.aVelocity.setXYZ(idx, vx, vy, vz);
            this.aStartTime.setX(idx, time);
            
            if (isTreasureMode) {
                this.aColor.setXYZ(idx, color.r, color.g, color.b);
            } else {
                this.aColor.setXYZ(idx, color.r, color.g, color.b);
            }
        }
        
        this.aOrigin.needsUpdate = true;
        this.aVelocity.needsUpdate = true;
        this.aStartTime.needsUpdate = true;
        this.aColor.needsUpdate = true;
    }

    public update(mouseW: THREE.Vector3, partDecay: number, partFalloff: number, partSize: number): number {
        // GPU does all the work! Just update time.
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        
        // We don't have an easy way to read back active explosion count from GPU without WebGL readPixels, 
        // so we'll just return a fake number or 1 so the UI knows we are active.
        return 1;
    }

    public setSettings(size: number, life: number, speed: number): void {
        this.material.uniforms.uSize.value = size;
        this.material.uniforms.uLifeMult.value = life;
        this.material.uniforms.uSpeedMult.value = speed;
    }

    public dispose(): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.group.remove(this.mesh);
    }
}
