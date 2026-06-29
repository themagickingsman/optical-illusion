import * as THREE from 'three';

const MAX_PARTICLES = 10000;
const SHARDS_PER_EXPLOSION = 200;
const MAX_LIFETIME = 5.0; // seconds

const vertexShader3D = `
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

        float scale = (age > 0.0 && vLife > 0.0) ? vLife : 0.0;
        
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
