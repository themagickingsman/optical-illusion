import * as THREE from 'three';
import { IParticleSystem } from './IParticleSystem';

const MAX_PARTICLES = 100000;
const SHARDS_PER_EXPLOSION = 200;
const MAX_LIFETIME = 2.0; // seconds

const vertexShader = `
    uniform float uTime;
    attribute vec3 aOrigin;
    attribute vec3 aVelocity;
    attribute float aStartTime;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vLife;

    void main() {
        vColor = aColor;
        
        float age = max(0.0, uTime - aStartTime);
        vLife = max(0.0, 1.0 - (age / ${MAX_LIFETIME.toFixed(1)}));

        // If not born yet or dead, shrink to 0
        float scale = (age > 0.0 && vLife > 0.0) ? vLife : 0.0;
        
        // Parabolic physics
        // Apply basic velocity
        vec3 pos = aOrigin + aVelocity * age;
        
        // Apply gravity: 0.5 * g * t^2 (g = 9.8)
        pos.y -= 0.5 * 18.0 * age * age;
        
        // Simple floor bounce
        if (pos.y < 0.0) {
            // Reflect and dampen
            pos.y = -pos.y * 0.4;
            // Add friction to X and Z on bounce
            pos.x = aOrigin.x + (aVelocity.x * age * 0.5);
            pos.z = aOrigin.z + (aVelocity.z * age * 0.5);
        }

        // Add some spin based on age and velocity
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

const fragmentShader = `
    varying vec3 vColor;
    varying float vLife;

    void main() {
        if (vLife <= 0.0) discard;
        // Bright emissive color
        gl_FragColor = vec4(vColor * 1.5, 1.0);
    }
`;

export class GPUParticleSystem implements IParticleSystem {
    public group: THREE.Group;
    private mesh: THREE.InstancedMesh;
    private nextParticleIdx = 0;
    
    private material: THREE.ShaderMaterial;
    private clock: THREE.Clock;

    // Attributes
    private aOrigin: THREE.InstancedBufferAttribute;
    private aVelocity: THREE.InstancedBufferAttribute;
    private aStartTime: THREE.InstancedBufferAttribute;
    private aColor: THREE.InstancedBufferAttribute;

    constructor() {
        this.group = new THREE.Group();
        this.clock = new THREE.Clock();
        
        const boxGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15); 
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0.0 }
            },
            transparent: true,
            depthWrite: true,
        });

        this.aOrigin = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
        this.aVelocity = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
        this.aStartTime = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 1), 1);
        this.aColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);

        boxGeo.setAttribute('aOrigin', this.aOrigin);
        boxGeo.setAttribute('aVelocity', this.aVelocity);
        boxGeo.setAttribute('aStartTime', this.aStartTime);
        boxGeo.setAttribute('aColor', this.aColor);

        // Fill start time with a large negative number so they hide instantly
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.aStartTime.setX(i, -9999.0);
        }

        this.mesh = new THREE.InstancedMesh(boxGeo, this.material, MAX_PARTICLES);
        this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); // Matrix doesn't change, we move verts in shader
        this.mesh.frustumCulled = false; // Always draw, let vertex shader collapse dead ones
        
        this.group.add(this.mesh);
    }

    public explode(
        x: number, 
        y: number, 
        z: number, 
        force: number, 
        radius: number, 
        color: THREE.Color,
        isTreasureMode: boolean = false
    ): void {
        const time = this.clock.getElapsedTime();

        for (let i = 0; i < SHARDS_PER_EXPLOSION; i++) {
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

    public dispose(): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.group.remove(this.mesh);
    }
}
