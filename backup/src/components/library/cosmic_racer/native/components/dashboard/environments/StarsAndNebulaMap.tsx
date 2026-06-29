import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function StarsAndNebulaMap({ seed, colors }: { seed: number, colors: string[] }) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime() * 0.2;
        }
    });

    // Generate True-Orthographic Static Stars safely across the 8192 viewport
    const starsGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const count = 4000;
        const pts = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for(let i=0; i<count; i++) {
            // XY Plane Distribution so it correctly falls onto the XZ plane after parent group rotation
            pts[i*3] = (Math.random() - 0.5) * 8192; // X
            pts[i*3+1] = (Math.random() - 0.5) * 8192; // Y originally (translates to Z floor)
            pts[i*3+2] = -50 - Math.random() * 50; // Z Depth originally (translates to Deep Y space)
            sizes[i] = Math.random() * 2 + 0.5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geo;
    }, []);

    return (
        <group>
            {/* Custom Orthographic-Safe Starfield */}
            <points geometry={starsGeo}>
                <shaderMaterial 
                    transparent={true} 
                    depthWrite={false}
                    vertexShader={`
                        attribute float size;
                        void main() {
                            gl_PointSize = size;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        void main() {
                            // Circular star shape
                            float dist = distance(gl_PointCoord, vec2(0.5));
                            if(dist > 0.5) discard;
                            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 - (dist * 2.0));
                        }
                    `}
                />
            </points>
            {/* NEBULA PLANE: Z=-20 pushes it safely below the ground structures */}
            <mesh position={[0, 0, -20]}>
                <planeGeometry args={[16384, 16384]} />
                <shaderMaterial 
                    ref={materialRef}
                    transparent={true}
                    depthWrite={false}
                    uniforms={{
                        uTime: { value: 0 },
                        uSeed: { value: seed },
                        uColor1: { value: new THREE.Color(colors[0] || '#ff00ff') },
                        uColor2: { value: new THREE.Color(colors[1] || '#00ffff') },
                        uColor3: { value: new THREE.Color(colors[2] || '#0000ff') }
                    }}
                    vertexShader={`
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec2 vUv;
                        uniform float uTime;
                        uniform float uSeed;
                        uniform vec3 uColor1;
                        uniform vec3 uColor2;
                        uniform vec3 uColor3;

                        mat2 rot(float a) {
                            float s = sin(a), c = cos(a);
                            return mat2(c, -s, s, c);
                        }

                        void main() {
                            // By reducing the UV scale to < 3.14 (Pi), we ensure that the sine waves 
                            // NEVER complete a full cycle across the massive 16384x16384 plane. 
                            // This physically prevents it from EVER repeating, acting like 1 single massive image!
                            vec2 p = (vUv - 0.5) * 2.5; 
                            
                            // Highly irregular FBM (Fractal Brownian Motion)
                            // Octave 1: Massive underlying base
                            float n1 = sin(p.x + uTime * 0.05) + sin(p.y - uTime * 0.03); 
                            
                            // Warp coordinate domain heavily
                            p = rot(2.4) * p * 1.8 + vec2(uSeed * 0.1, uSeed * 0.15); 
                            
                            // Octave 2: Mid-tier gas clouds
                            float n2 = sin(p.x - uTime * 0.08) + sin(p.y + uTime * 0.06);
                            
                            // Warp again
                            p = rot(1.8) * p * 1.5 - vec2(uSeed * 0.2, uSeed * 0.05);
                            
                            // Octave 3: Wispy surface details
                            float n3 = sin(p.x + uTime * 0.12) + sin(p.y - uTime * 0.09);
                            
                            // Normalize accumulative noise safely
                            float combined = (n1 + n2 * 0.8 + n3 * 0.6) / 4.8 + 0.5;
                            
                            // Shift colors radically based on depth
                            vec3 color = mix(uColor1, uColor2, smoothstep(0.2, 0.7, combined));
                            color = mix(color, uColor3, smoothstep(0.5, 1.0, combined));
                            
                            // Massive localized bloom
                            float alpha = smoothstep(0.35, 0.9, combined) * 0.75;
                            
                            gl_FragColor = vec4(color, alpha);
                        }
                    `}
                />
            </mesh>

            {/* SPATIAL HEX WIREFRAME GRID FOR 2D SPACE STATION PLACEMENT: Z=-0.5 pushes it just below cursor */}
            <mesh position={[0, 0, -0.5]}>
                <planeGeometry args={[8192, 8192]} />
                <shaderMaterial 
                    transparent={true}
                    depthWrite={false}
                    vertexShader={`
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec2 vUv;
                        
                        // Exact match to Pointy-Topped BaseBuildingEngine Hexagons
                        // Width = sqrt(3)*40 = 69.282, Height = 2*40 = 80
                        void main() {
                            // Scale down UVs to pixel size
                            vec2 uv = (vUv - 0.5) * 8192.0; 
                            
                            // Pointy topped hex math layout
                            float size = 40.0;
                            
                            // In BaseBuildingEngine point-topped width is sqrt(3)*size = 69.282
                            // Height = 2*size = 80
                            // Horizontal repetition distance is W
                            // Vertical repetition distance is 3/4 H = 60
                            vec2 r = vec2(sqrt(3.0) * size, 3.0 * size);
                            vec2 h = r * 0.5;
                            
                            // Offset mathematical skew mapping
                            vec2 mapUV = vec2(uv.x, uv.y * sqrt(3.0) * 0.5);
                            
                            vec2 a = mod(mapUV, r) - h;
                            vec2 b = mod(mapUV - h, r) - h;
                            
                            vec2 gv = dot(a, a) < dot(b, b) ? a : b;
                            
                            // Absolute hex boundaries via distance field
                            vec2 ab = abs(gv);
                            float dist = max(dot(ab, normalize(vec2(sqrt(3.0)*0.5, 0.5))), ab.x);
                            
                            // Bold line thresholding logic 
                            float lineTarget = size * sqrt(3.0) * 0.5; // Apothem ~34.641
                            float border = smoothstep(lineTarget - 2.5, lineTarget - 0.5, dist);
                            
                            gl_FragColor = vec4(1.0, 1.0, 1.0, border * 0.35); // Clean glowing hex
                        }
                    `}
                />
            </mesh>
        </group>
    );
}
