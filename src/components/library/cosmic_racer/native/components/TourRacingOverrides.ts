import * as THREE from 'three';

const CUSTOM_TRAIL_VS = `
attribute vec2 aUv;
attribute float aEmit;
uniform float uTrailCustomLength;
varying vec2 vUv;
varying float vEmit;

void main() {
    vUv = aUv;
    vEmit = aEmit;
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const CUSTOM_TRAIL_FS = `
uniform vec3 uTrailColor;
uniform float uTrailOpacity;
uniform float uTrailFalloff;
varying vec2 vUv;
varying float vEmit;

void main() {
    if (vEmit < 0.1) discard;
    
    float curve = mix(10.0, 1.0, uTrailFalloff);
    float lifePct = 1.0 - pow(max(vUv.y, 0.0001), curve);
    
    float edgeDist = abs(vUv.x - 0.5) * 2.0;
    float edgeAlpha = smoothstep(1.0, 0.0, edgeDist);
    edgeAlpha = pow(edgeAlpha, 1.5);
    
    float intensity = lifePct * uTrailOpacity * edgeAlpha;
    if(intensity <= 0.01) discard;
    
    gl_FragColor = vec4(uTrailColor, intensity);
}
`;

export function createCustomSolidTrailSystem(segments: number = 200, scene?: any) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(segments * 2 * 3 * 2); // 2 wings, segments*2 vertices each
    const uvs = new Float32Array(segments * 2 * 2 * 2); // 2 floats (X, Y) per vertex
    const indices = [];

    // Build indices for 2 separate ribbons (Left Wing and Right Wing)
    for (let wing = 0; wing < 2; wing++) {
        const offset = wing * segments * 2;
        for (let i = 0; i < segments - 1; i++) {
            const v0 = offset + i * 2;
            const v1 = offset + i * 2 + 1;
            const v2 = offset + (i + 1) * 2;
            const v3 = offset + (i + 1) * 2 + 1;

            // Triangle 1
            indices.push(v0, v1, v2);
            // Triangle 2
            indices.push(v1, v3, v2);
        }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));

    // Initialize UVs (constant)
    for (let wing = 0; wing < 2; wing++) {
        const offset = wing * segments * 2;
        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1); // 0 at wingtip, 1 at tail
            
            const vIdx1 = (offset + i * 2) * 2;
            uvs[vIdx1] = 0.0;
            uvs[vIdx1 + 1] = t;
            
            const vIdx2 = (offset + i * 2 + 1) * 2;
            uvs[vIdx2] = 1.0;
            uvs[vIdx2 + 1] = t;
        }
    }

    const cachedMat = (scene as any).userData.SHARED_TRAIL_MAT;
    let baseMat: THREE.ShaderMaterial;
    
    if (!cachedMat) {
        baseMat = new THREE.ShaderMaterial({
            vertexShader: CUSTOM_TRAIL_VS,
            fragmentShader: CUSTOM_TRAIL_FS,
            uniforms: {
                uTime: { value: 0 },
                uTrailColor: { value: new THREE.Color("#facc15") },
                uTrailCustomLength: { value: 4.0 },
                uTrailLife: { value: 2.0 },
                uTrailSize: { value: 0.5 },
                uTrailOpacity: { value: 0.8 },
                uTrailFalloff: { value: 0.5 },
                uCameraZoom: { value: 1.0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        (scene as any).userData.SHARED_TRAIL_MAT = baseMat;
    } else {
        baseMat = cachedMat;
    }

    const material = baseMat.clone();
    material.uniforms = THREE.UniformsUtils.clone(baseMat.uniforms);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    
    return {
        mesh,
        geometry,
        material,
        history: [],
        segments
    };
}

export const TourRacingTrailOverride = {
    create: (scene?: any) => createCustomSolidTrailSystem(400, scene),
    update: (optTrail: any, currentLeft: any, currentRight: any, lastLeft: any, lastRight: any, isMoving: boolean, p: any, nowTime: number, fx: any) => {
        const tLength = p?.trailLength ?? fx?.trailLength ?? 400;
        const tFalloff = p?.trailFalloff ?? fx?.trailFalloff ?? 0.5;
        const tOpacity = p?.trailOpacity ?? fx?.trailOpacity ?? 0.8;
        const tColor = p?.trailColor ?? fx?.trailColor ?? "#a855f7";

        // Correctly apply the parameters for length and falloff by overriding the uniforms directly
        if (optTrail.material && optTrail.material.uniforms) {
            // trailLength is usually ~10 to 500. Let's map it to seconds (e.g. 100 = 1.0s)
            optTrail.material.uniforms.uTrailCustomLength.value = tLength / 100.0;
            // falloff is 0.01 to 1.0
            optTrail.material.uniforms.uTrailFalloff.value = tFalloff;
            optTrail.material.uniforms.uTrailOpacity.value = tOpacity;
            optTrail.material.uniforms.uTrailColor.value.set(tColor);
        }

        // --- HISTORY BUFFER LOGIC ---
        let history = optTrail.history;
        if (!history) {
            history = [];
            optTrail.history = history;
        }

        // Prune history buffer to a safe constant to survive dynamic UI slider adjustments without data destruction
        const maxHistoryLen = 400;
        if (history.length > maxHistoryLen) {
            history.length = maxHistoryLen;
        }

        let dist = 0.1;
        if (isMoving && history.length > 0) {
            const lastH = history[0];
            dist = Math.hypot(currentLeft.x - lastH.lx, currentLeft.z - lastH.lz);
            if (dist > 50.0) {
                // Ship teleported or swapped. Clear history.
                dist = 0.1;
                history.length = 0;
            }
        }

        // Calculate the ship's forward vector (nx, nz) directly from the wingtip orientation
        const dirX = -(currentRight.z - currentLeft.z);
        const dirZ = currentRight.x - currentLeft.x;
        const len = Math.hypot(dirX, dirZ);
        const nx = len > 0.0001 ? dirX / len : 0;
        const nz = len > 0.0001 ? dirZ / len : 0;
        
        const lengthUnits = tLength * 0.15; // Scale to visual world units

        // Push current state into history
        // If the ship stops moving, we push a fake distance. This causes the real-world points in the history buffer 
        // to move down the targetDist parameter (t), naturally aging them in place and causing them to fade out!
        let simDist = dist;
        if (!isMoving && history.length > 0) {
            simDist = 1.5;
        }

        history.unshift({
            lx: currentLeft.x, ly: currentLeft.y, lz: currentLeft.z,
            rx: currentRight.x, ry: currentRight.y, rz: currentRight.z,
            distMoved: simDist,
            emit: isMoving ? 1.0 : 0.0
        });

        // Limit history size to prevent memory leaks
        if (history.length > 300) history.pop();

        const segments = optTrail.segments || 200;
        const positions = optTrail.mesh.geometry.attributes.position.array;
        
        let histIdx = 0;
        let accumulatedDist = 0;
        
        let prevLx = currentLeft.x; let prevLz = currentLeft.z;
        let prevRx = currentRight.x; let prevRz = currentRight.z;

        for (let i = 0; i < segments; i++) {
            // t goes from 0.0 (at the wingtip) to 1.0 (at the tail end of the trail)
            const t = i / (segments - 1);
            const targetDist = t * lengthUnits;
            
            // 1. ADVANCE ALONG HISTORY BUFFER
            while (histIdx < history.length - 1) {
                const segmentLen = history[histIdx].distMoved;
                if (accumulatedDist + segmentLen >= targetDist) {
                    break;
                }
                accumulatedDist += segmentLen;
                histIdx++;
            }
            
            let histLx, histLy, histLz;
            let histRx, histRy, histRz;
            let histEmit = 1.0;
            
            if (histIdx >= history.length - 1) {
                // Out of history: clamp to the oldest point so the trail can stretch elegantly to the origin
                // without being chopped off abruptly when first spawning.
                const h = history[history.length - 1];
                histLx = h.lx; histLy = h.ly; histLz = h.lz;
                histRx = h.rx; histRy = h.ry; histRz = h.rz;
                histEmit = h.emit ?? 1.0;
            } else {
                // Interpolate precisely between the two historical frames
                const h1 = history[histIdx];
                const h2 = history[histIdx + 1];
                const segmentLen = h1.distMoved;
                const fraction = segmentLen > 0.0001 ? (targetDist - accumulatedDist) / segmentLen : 0;
                
                histLx = h1.lx + (h2.lx - h1.lx) * fraction;
                histLy = h1.ly + (h2.ly - h1.ly) * fraction;
                histLz = h1.lz + (h2.lz - h1.lz) * fraction;
                
                histRx = h1.rx + (h2.rx - h1.rx) * fraction;
                histRy = h1.ry + (h2.ry - h1.ry) * fraction;
                histRz = h1.rz + (h2.rz - h1.rz) * fraction;
                
                const e1 = h1.emit ?? 1.0;
                const e2 = h2.emit ?? 1.0;
                histEmit = e1 + (e2 - e1) * fraction;
            }

            // 2. CALCULATE RIGID NOZZLE VECTOR
            const rigidLx = currentLeft.x - nx * targetDist;
            const rigidLy = currentLeft.y;
            const rigidLz = currentLeft.z - nz * targetDist;
            
            const rigidRx = currentRight.x - nx * targetDist;
            const rigidRy = currentRight.y;
            const rigidRz = currentRight.z - nz * targetDist;

            // 3. BLEND NOZZLE WITH HISTORY
            // Reduced from 20.0 to 2.0 to eliminate the "stiff pole" turning artifact
            const stiffnessLength = 2.0; 
            let blend = 1.0 - (targetDist / stiffnessLength);
            blend = Math.max(0.0, Math.min(1.0, blend));
            blend = blend * blend * (3.0 - 2.0 * blend); // Smoothstep easing
            
            const finalLx = histLx * (1 - blend) + rigidLx * blend;
            const finalLy = histLy * (1 - blend) + rigidLy * blend;
            const finalLz = histLz * (1 - blend) + rigidLz * blend;
            
            const finalRx = histRx * (1 - blend) + rigidRx * blend;
            const finalRy = histRy * (1 - blend) + rigidRy * blend;
            const finalRz = histRz * (1 - blend) + rigidRz * blend;
            
            // 4. GENERATE MESH VERTICES
            // Calculate tangent to extrude the ribbon flat on the XZ plane
            let dxL = i === 0 ? -nx : finalLx - prevLx;
            let dzL = i === 0 ? -nz : finalLz - prevLz;
            let lenL = Math.hypot(dxL, dzL);
            let nX_L = lenL > 0.0001 ? -dzL / lenL : -nz;
            let nZ_L = lenL > 0.0001 ? dxL / lenL : nx;
            
            let dxR = i === 0 ? -nx : finalRx - prevRx;
            let dzR = i === 0 ? -nz : finalRz - prevRz;
            let lenR = Math.hypot(dxR, dzR);
            let nX_R = lenR > 0.0001 ? -dzR / lenR : -nz;
            let nZ_R = lenR > 0.0001 ? dxR / lenR : nx;
            
            prevLx = finalLx; prevLz = finalLz;
            prevRx = finalRx; prevRz = finalRz;
            
            // The 2D Canvas SVG ship container is 120px wide. 
            // The 3D ship wingspan (trailWidth * 2) is exactly 4.0 world units wide.
            // 2D lineWidth uses (trailSize * 2.0). 
            // To make 3D radius (w) match 2D radius proportional to the ship: w = trailSize * (4.0 / 120.0)
            let w = (p?.trailSize ?? fx?.trailSize ?? 10.0) * 0.03333; 
            w *= histEmit; // Kill width immediately on stopped segments to detach trail
            
            // To prevent crumpling at the origin point, forcefully pinch the width to 0
            // when clamped at the end of the history buffer so it forms a beautiful needle tip.
            if (histIdx >= history.length - 1) {
                w = 0; 
            }
            
            // Replicate the exact 2D power-curve falloff to taper the 3D geometry into a sharp point
            const curve = 10.0 + (1.0 - 10.0) * tFalloff;
            const lifePct = 1.0 - Math.pow(Math.max(t, 0.0001), curve);
            const widthScale = w * lifePct;
            
            // Left Wing Ribbon Vertices
            const lOffX = nX_L * widthScale;
            const lOffZ = nZ_L * widthScale;
            
            const idxL = i * 6; // 2 vertices * 3 coords
            positions[idxL]     = finalLx + lOffX;
            positions[idxL + 1] = finalLy;
            positions[idxL + 2] = finalLz + lOffZ;
            
            positions[idxL + 3] = finalLx - lOffX;
            positions[idxL + 4] = finalLy;
            positions[idxL + 5] = finalLz - lOffZ;
            
            // Right Wing Ribbon Vertices
            const idxR = (segments * 6) + (i * 6);
            const rOffX = nX_R * widthScale;
            const rOffZ = nZ_R * widthScale;
            
            positions[idxR]     = finalRx + rOffX;
            positions[idxR + 1] = finalRy;
            positions[idxR + 2] = finalRz + rOffZ;
            
            positions[idxR + 3] = finalRx - rOffX;
            positions[idxR + 4] = finalRy;
            positions[idxR + 5] = finalRz - rOffZ;
        }
        
        optTrail.mesh.geometry.attributes.position.needsUpdate = true;
    }
};
