import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PhobonLiquidEffect() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // Exact replica of Phobon's TSL math algorithm compiled strictly into native GLSL
    const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;

        float sdSphere(vec3 p, float r) {
            return length(p) - r;
        }

        // Polynomial smooth min
        float smin(float a, float b, float k) {
            float h = max(k - abs(a - b), 0.0) / k;
            return min(a, b) - h * h * k * 0.25;
        }

        float sdf(vec3 pos) {
            // translatedPos = pos.add(vec3(sin(timer), 0, 0))
            vec3 translatedPos = pos + vec3(sin(uTime), 0.0, 0.0);
            
            float sphere = sdSphere(translatedPos, 0.5);
            float secondSphere = sdSphere(pos, 0.3);

            return smin(secondSphere, sphere, 0.3);
        }

        vec3 calcNormal(vec3 p) {
            float eps = 0.0001;
            vec2 h = vec2(eps, 0.0);
            return normalize(vec3(
                sdf(p + h.xyy) - sdf(p - h.xyy),
                sdf(p + h.yxy) - sdf(p - h.yxy),
                sdf(p + h.yyx) - sdf(p - h.yyx)
            ));
        }

        vec3 lighting(vec3 ro, vec3 r) {
            vec3 normal = calcNormal(r);
            vec3 viewDir = normalize(ro - r);

            // Step 1: Ambient light
            vec3 ambient = vec3(0.2);

            // Step 2: Diffuse lighting
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            vec3 lightColor = vec3(1.0, 1.0, 0.9);
            float dp = max(0.0, dot(lightDir, normal));
            vec3 diffuse = lightColor * dp;

            // Step 3: Hemisphere light 
            vec3 skyColor = vec3(0.0, 0.3, 0.6);
            vec3 groundColor = vec3(0.6, 0.3, 0.1);
            float hemiMix = normal.y * 0.5 + 0.5;
            vec3 hemi = mix(groundColor, skyColor, hemiMix);

            // Step 4: Phong specular 
            vec3 ph = normalize(reflect(-lightDir, normal));
            float phongValue = pow(max(0.0, dot(viewDir, ph)), 32.0);
            vec3 specular = vec3(phongValue);

            // Step 5: Fresnel effect 
            float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 2.0);
            specular *= fresnel;

            // Compilation Mix
            vec3 l = ambient * 0.1;
            l += diffuse * 0.5;
            l += hemi * 0.2;

            vec3 finalColor = vec3(0.1) * l;
            finalColor += specular;

            return finalColor;
        }

        void main() {
            // Use frag coordinates to get an aspect-fixed UV
            vec2 uv = (vUv - 0.5) * 2.0;
            uv.x *= uResolution.x / uResolution.y;

            vec3 rayOrigin = vec3(0.0, 0.0, -3.0);
            vec3 rayDirection = normalize(vec3(uv, 1.0));

            float t = 0.0;
            vec3 ray = rayOrigin + rayDirection * t;

            float d = 0.0;
            for(int i = 0; i < 80; i++) {
                d = sdf(ray);
                t += d * 0.8;
                ray = rayOrigin + rayDirection * t;

                if(d < 0.005) break;
                if(t > 50.0) break;
            }

            if (t > 50.0) {
               gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            } else {
               vec3 color = lighting(rayOrigin, ray);
               gl_FragColor = vec4(color, 1.0);
            }
        }
    `;

    return (
        // Render on a gigantic deep-background plane that completely fills behind the planet
        <mesh position={[0, 0, -200]}>
            <planeGeometry args={[16384, 16384]} />
            <shaderMaterial
                ref={materialRef}
                transparent={true}
                depthWrite={false}
                uniforms={{
                    uTime: { value: 0 },
                    uResolution: { value: new THREE.Vector2(1920, 1080) } // Approximation since it scales infinitely
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
}
