import * as THREE from 'three';

// ─── ZERO-ALLOCATION SHADER MATERIALS ──────────────────────────────────────

const TRAIL_VS = `
attribute float aBirthTime;
uniform float uTime;
uniform float uTrailLife;
uniform float uTrailSize;
uniform float uCameraZoom;
varying float vAge;

void main() {
    float age = max(0.0, uTime - aBirthTime);
    vAge = age;
    
    float lifePct = 1.0 - clamp(age / max(0.01, uTrailLife), 0.0, 1.0);
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // In an Orthographic projection, Z-depth doesn't provide size attenuation.
    // The previous division by -mvPosition.z caused particles to collapse to sub-pixel sizes.
    // We scale the base trail size by the life percentage and the orthographic camera zoom.
    gl_PointSize = max(1.0, uTrailSize * lifePct * 60.0 * max(0.001, uCameraZoom));
}
`;

const TRAIL_FS = `
uniform vec3 uTrailColor;
uniform float uTrailOpacity;
uniform float uTrailLife;
varying float vAge;

void main() {
    float lifePct = 1.0 - clamp(vAge / max(0.01, uTrailLife), 0.0, 1.0);
    if(lifePct <= 0.01) discard;
    
    // Soft circular particle
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r = dot(p, p);
    if(r > 1.0) discard;
    
    // Core glow that softly degrades at the edges
    float intensity = (1.0 - r) * lifePct * uTrailOpacity;
    gl_FragColor = vec4(uTrailColor, intensity);
}
`;

/**
 * Generates an optimized custom shader-based GPU particle system.
 * By completely stripping logic from the CPU, it relies simply on a vertex age \`aBirthTime\`.
 */
export function createOptimizedTrailSystem(maxTrails: number = 1000) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxTrails * 3);
    const birthTimes = new Float32Array(maxTrails);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aBirthTime', new THREE.BufferAttribute(birthTimes, 1).setUsage(THREE.DynamicDrawUsage));
    
    const material = new THREE.ShaderMaterial({
        vertexShader: TRAIL_VS,
        fragmentShader: TRAIL_FS,
        uniforms: {
            uTime: { value: 0 },
            uTrailColor: { value: new THREE.Color("#facc15") },
            uTrailLife: { value: 2.0 },
            uTrailSize: { value: 10.0 },
            uTrailOpacity: { value: 0.8 },
            uCameraZoom: { value: 1.0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const mesh = new THREE.Points(geometry, material);
    mesh.frustumCulled = false;
    
    return {
        mesh,
        geometry,
        material,
        positions,
        birthTimes,
        head: 0,
        maxSize: maxTrails
    };
}

// ─── STRUCTURAL CACHING ──────────────────────────────────────────────────────

/**
 * Pre-computes structural footprints, mapping out filtered engine/wing coordinates 
 * ONCE upon load, so the 120 FPS loop doesn't have to `filter` or `map` dynamically.
 */
export function buildShipGeometryCache(shipsRaw: any[]) {
    const cache: Record<string, any> = {};
    
    for (const ship of shipsRaw) {
        let engines: any[] = [];
        let wings: any[] = [];
        let exhaustPoints: any[] = [];
        
        if (ship.registrationPoints) {
            // Find core engines specifically
            engines = ship.registrationPoints.filter((p: any) => p.type === 'reactor' || p.type === 'engine').map((p: any) => {
                const cx = p.x - 0.5;
                const cy = p.y - 0.5;
                return { ...p, originalX: p.x, originalY: p.y, cx, cy };
            });
            
            // Map wings or fallbacks for aerodynamic trails
            wings = ship.registrationPoints.filter((p: any) => p.type !== 'reactor' && p.type !== 'engine').map((p: any) => {
                const cx = p.x - 0.5;
                const cy = p.y - 0.5;
                return { ...p, cx, cy };
            });
            
            exhaustPoints = ship.registrationPoints.filter((p: any) => p.type === 'engine').map((p: any) => {
                return { ...p, cx: p.x - 0.5, cy: p.y - 0.5 };
            });
        }
        
        cache[ship.id] = {
            ...ship,
            engines,
            wings,
            exhaustPoints
        };
    }
    
    return cache;
}

// ─── ZERO-ALLOCATION MATH CACHE ──────────────────────────────────────────────

/**
 * Expose top-level, mutable vector instances to completely eliminate
 * `new THREE.Vector3()` garbage-collection pressure inside `requestAnimationFrame`.
 */
export const MathCache = {
    vec1: new THREE.Vector3(),
    vec2: new THREE.Vector3(),
    vec3: new THREE.Vector3(),
    mat1: new THREE.Matrix4(),
    mat2: new THREE.Matrix4(),
    color1: new THREE.Color()
};
