import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * NexusGroundPlane
 * Renders the NexusMetaballs holographic shader on a flat plane inside the
 * existing Three.js Canvas — no second WebGL context needed.
 *
 * Coordinate fix: NexusMetaballs derives uv from gl_FragCoord (screen pixels).
 * Here we derive the identical uv from world XZ position using camera uniforms:
 *   nx = (worldX - camX) * 2 * zoom / viewW   →  same as NexusMetaballs uv.x (pre-aspect)
 *   ny = (worldZ - camZ) * 2 * zoom / viewH   →  same as NexusMetaballs uv.y
 *   nx *= aspect                               →  aspect correction (same as uResolution.x/y)
 *   ro = vec3(nx*2, ny*2, -1.0)               →  identical ray origin
 */
export default function NexusGroundPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const ortho = camera as THREE.OrthographicCamera;
    const u = matRef.current.uniforms;
    u.uTime.value  = clock.getElapsedTime();
    u.uCamX.value  = ortho.position.x;
    u.uCamZ.value  = ortho.position.z;
    u.uZoom.value  = ortho.zoom;
    // Keep uResolution in sync for screenToWorld aspect ratio
    u.uResolution.value.set(size.width, size.height);
  });

  const uniforms = useMemo(() => ({
    // ── Camera sync (ground-plane only) ────────────────────────────────────────
    uCamX:      { value: 0 },
    uCamZ:      { value: 0 },
    uZoom:      { value: 1 },
    // ── NexusMetaballs uniforms (verbatim names / roles) ─────────────────────
    uTime:      { value: 0 },
    uResolution: { value: new THREE.Vector2(1280, 800) },
    uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
    // Cursor disabled — parked off-screen
    uCursorSphere:  { value: new THREE.Vector3(0, 9999, 0) },
    uCursorRadius:  { value: 0.0001 },
    uSphereCount:   { value: 6 },
    // Blob radii — auto-randomised on mount (same logic as NexusMetaballs init)
    uFixedTopLeftRadius:     { value: 0.4 + Math.random() * 1.2 },
    uFixedBottomRightRadius: { value: 0.4 + Math.random() * 1.2 },
    uSmallTopLeftRadius:     { value: 0.2 + Math.random() * 0.6 },
    uSmallBottomRightRadius: { value: 0.2 + Math.random() * 0.6 },
    // Blob positions — auto-randomised on mount
    uPos1: { value: new THREE.Vector2(0.05 + Math.random() * 0.35, 0.65 + Math.random() * 0.30) },
    uPos2: { value: new THREE.Vector2(0.15 + Math.random() * 0.35, 0.50 + Math.random() * 0.35) },
    uPos3: { value: new THREE.Vector2(0.60 + Math.random() * 0.35, 0.05 + Math.random() * 0.35) },
    uPos4: { value: new THREE.Vector2(0.50 + Math.random() * 0.35, 0.15 + Math.random() * 0.35) },
    uPos5: { value: new THREE.Vector2(0.05 + Math.random() * 0.90, 0.05 + Math.random() * 0.90) },
    uPos5Radius: { value: 0.35 + Math.random() * 0.65 },
    uPos6: { value: new THREE.Vector2(0.35 + Math.random() * 0.30, 0.35 + Math.random() * 0.30) },
    uPos6Radius: { value: 0.30 + Math.random() * 0.60 },
    uPos7: { value: new THREE.Vector2(0.30 + Math.random() * 0.40, 0.30 + Math.random() * 0.40) },
    uPos7Radius: { value: 0.40 + Math.random() * 0.40 },
    uMergeDistance:    { value: 2.0 },
    // Holographic preset values (from NexusMetaballs presets.holographic)
    uSmoothness:       { value: 0.8 },
    uAmbientIntensity: { value: 0.12 },
    uDiffuseIntensity: { value: 1.2 },
    uSpecularIntensity:{ value: 2.5 },
    uSpecularPower:    { value: 3.0 },
    uFresnelPower:     { value: 0.8 },
    uBackgroundColor:  { value: new THREE.Color(0x0a0a15) },
    uSphereColor:      { value: new THREE.Color(0x050510) },
    uLightColor:       { value: new THREE.Color(0xccaaff) },
    uLightPosition:    { value: new THREE.Vector3(0.9, 0.9, 1.2) },
    uContrast:         { value: 1.6 },
    uFogDensity:       { value: 0.06 },
    uAnimationSpeed:   { value: 0.6 },
    uMovementScale:    { value: 1.6 },
    uMinMovementScale: { value: 0.3 },
    uMaxMovementScale: { value: 1.0 },
    uCursorGlowIntensity: { value: 1.2 },
    uCursorGlowRadius:    { value: 2.2 },
    uCursorGlowColor:     { value: new THREE.Color(0xaa77ff) },
    uIsSafari:   { value: 0.0 },
    uIsMobile:   { value: 0.0 },
    uIsLowPower: { value: 0.0 },
    uSeed:       { value: Math.random() * 1000.0 },
    // Entities disabled
    uEntities:    { value: Array.from({ length: 12 }, () => new THREE.Vector3(0, 9999, 0)) },
    uEntityCount: { value: 0 },
  }), []);

  return (
    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      {/* Large enough to cover the 4096-radius map at any zoom level */}
      <planeGeometry args={[65536, 65536, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        vertexShader={`
          varying vec2 vWorldXZ;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldXZ = wp.xz; // world XZ passed to fragment
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision mediump float;

          // ── Ground-plane camera uniforms ───────────────────────────────────
          uniform float uCamX;
          uniform float uCamZ;
          uniform float uZoom;
          varying vec2 vWorldXZ;

          // ── NexusMetaballs uniforms (verbatim) ────────────────────────────
          uniform float uTime;
          uniform vec2  uResolution;
          uniform vec2  uMousePosition;
          uniform vec3  uCursorSphere;
          uniform float uCursorRadius;
          uniform int   uSphereCount;
          uniform float uFixedTopLeftRadius;
          uniform float uFixedBottomRightRadius;
          uniform float uSmallTopLeftRadius;
          uniform float uSmallBottomRightRadius;
          uniform float uMergeDistance;
          uniform float uSmoothness;
          uniform float uAmbientIntensity;
          uniform float uDiffuseIntensity;
          uniform float uSpecularIntensity;
          uniform float uSpecularPower;
          uniform float uFresnelPower;
          uniform vec3  uBackgroundColor;
          uniform vec3  uSphereColor;
          uniform vec3  uLightColor;
          uniform vec3  uLightPosition;
          uniform float uContrast;
          uniform float uFogDensity;
          uniform float uAnimationSpeed;
          uniform float uMovementScale;
          uniform float uMinMovementScale;
          uniform float uMaxMovementScale;
          uniform float uCursorGlowIntensity;
          uniform float uCursorGlowRadius;
          uniform vec3  uCursorGlowColor;
          uniform float uIsSafari;
          uniform float uIsMobile;
          uniform float uIsLowPower;
          uniform vec2  uPos1;
          uniform vec2  uPos2;
          uniform vec2  uPos3;
          uniform vec2  uPos4;
          uniform vec2  uPos5;
          uniform float uPos5Radius;
          uniform vec2  uPos6;
          uniform float uPos6Radius;
          uniform vec2  uPos7;
          uniform float uPos7Radius;
          uniform float uSeed;
          uniform vec3  uEntities[12];
          uniform int   uEntityCount;

          const float PI      = 3.14159265359;
          const float PHI     = 1.61803398875;
          const float SCH     = 7.83;
          const float EPSILON = 0.001;
          const float MAX_DIST = 100.0;

          // ── Verbatim from NexusMetaballs ──────────────────────────────────
          float haltonPhi(float i) {
            float f = 1.0; float r = 0.0;
            float base = PHI;
            for (int j = 0; j < 8; j++) {
              f = f / base;
              r = r + f * mod(i, base);
              i = floor(i / base);
            }
            return fract(r + uSeed * 0.001);
          }

          float smin(float a, float b, float k) {
            float h = max(k - abs(a - b), 0.0) / k;
            return min(a, b) - h * h * k * 0.25;
          }

          float sdSphere(vec3 p, float r) { return length(p) - r; }

          vec3 screenToWorld(vec2 n) {
            vec2 uv = n * 2.0 - 1.0;
            uv.x *= uResolution.x / uResolution.y;
            return vec3(uv * 2.0, 0.0);
          }

          vec4 sceneSDFGrad(vec3 pos) {
            vec3 p1 = screenToWorld(uPos1);
            vec3 p2 = screenToWorld(uPos2);
            vec3 p3 = screenToWorld(uPos3);
            vec3 p4 = screenToWorld(uPos4);

            vec3 d1v = pos - p1; float d1 = length(d1v) - uFixedTopLeftRadius;
            vec3 d2v = pos - p2; float d2 = length(d2v) - uSmallTopLeftRadius;
            vec3 d3v = pos - p3; float d3 = length(d3v) - uFixedBottomRightRadius;
            vec3 d4v = pos - p4; float d4 = length(d4v) - uSmallBottomRightRadius;

            vec3 p5 = screenToWorld(uPos5);
            vec3 d5v = pos - p5; float d5 = length(d5v) - uPos5Radius;
            vec3 p6 = screenToWorld(uPos6);
            vec3 d6v = pos - p6; float d6 = length(d6v) - uPos6Radius;
            vec3 p7 = screenToWorld(uPos7);
            vec3 d7v = pos - p7; float d7 = length(d7v) - uPos7Radius;

            float t = uTime * uAnimationSpeed;
            float dynamicScale = uMovementScale;

            float topGroup = smin(d1, d2, 0.4);
            float btmGroup = smin(d3, d4, 0.4);
            float result   = smin(topGroup, btmGroup, 0.3);
            result         = smin(result, d5, 0.35);
            result         = smin(result, d6, 0.35);
            result         = smin(result, d7, 0.35);
            vec3 gradFixed = normalize(pos - p1) * 0.5 + normalize(pos - p2) * 0.3
                           + normalize(pos - p3) * 0.5 + normalize(pos - p4) * 0.3
                           + normalize(pos - p5) * 0.4 + normalize(pos - p6) * 0.4
                           + normalize(pos - p7) * 0.4;

            int maxIter = uIsMobile > 0.5 ? 3 : min(uSphereCount, 6);
            vec3 gradDyn = vec3(0.0);

            for (int i = 0; i < 10; i++) {
              if (i >= maxIter) break;
              float fi = float(i);
              float r1 = fract(haltonPhi(fi * 1.0));
              float r2 = fract(haltonPhi(fi * 2.0 + 7.0));
              float r3 = fract(haltonPhi(fi * 3.0 + 13.0));
              float r4 = fract(haltonPhi(fi * 5.0 + 23.0));

              float speed  = (0.2 + r1 * 0.4) * (SCH / 10.0);
              float radius = 0.08 + r2 * 0.12;
              float orbit  = (0.2 + r3 * 0.4) * dynamicScale;
              float phase  = r4 * PI * 2.0;

              float distToCursor = length(uCursorSphere);
              orbit *= 1.0 + (1.0 - smoothstep(0.0, 1.0, distToCursor)) * 0.5;

              vec3 offset = vec3(
                sin(t * speed + phase)            * orbit * (0.6 + r1 * 0.4),
                cos(t * speed / PHI + phase * PHI) * orbit * (0.5 + r2 * 0.5),
                sin(t * speed * 0.5 + phase)       * 0.3
              );

              vec3 toCursor = uCursorSphere - offset;
              float cd = length(toCursor);
              if (cd < uMergeDistance && cd > 0.0) {
                offset += normalize(toCursor) * ((1.0 - cd / uMergeDistance) * 0.3);
              }

              vec3 dp = pos - offset;
              float ms = sdSphere(dp, radius);
              float blend = cd < uMergeDistance
                ? mix(0.05, uSmoothness, pow(1.0 - cd / uMergeDistance, 3.0))
                : 0.05;
              result = smin(result, ms, blend);

              float dpLen = length(dp);
              if (dpLen > 0.001) gradDyn += normalize(dp) * (1.0 / max(ms * ms + 0.01, 0.01));
            }

            vec3 dcv = pos - uCursorSphere;
            float dcBall = sdSphere(dcv, uCursorRadius);
            result = smin(result, dcBall, uSmoothness);

            int eCount = min(uEntityCount, 12);
            for (int ei = 0; ei < 12; ei++) {
              if (ei >= eCount) break;
              vec3 ev = pos - uEntities[ei];
              float ed = length(ev) - uEntities[ei].z;
              result = smin(result, ed, 0.28);
            }

            vec3 dcv2 = pos - uCursorSphere;
            vec3 grad = normalize(gradFixed + gradDyn * 0.5 + normalize(dcv2) * 0.2);
            return vec4(result, grad);
          }

          float gradAO(float sdfVal, vec3 grad) {
            float edge = 1.0 - smoothstep(0.0, 0.06, abs(sdfVal));
            float gradMag = length(grad);
            return clamp(0.75 + gradMag * 0.2 - edge * 0.15, 0.0, 1.0);
          }

          float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
            float res = 1.0; float t = mint;
            int steps = uIsMobile > 0.5 ? 2 : 6;
            for (int i = 0; i < 6; i++) {
              if (i >= steps || t >= maxt) break;
              float h = sceneSDFGrad(ro + rd * t).x;
              if (h < EPSILON) return 0.0;
              res = min(res, k * h / t);
              t += max(h, 0.025);
            }
            return clamp(res, 0.0, 1.0);
          }

          float rayMarch(vec3 ro, vec3 rd) {
            float t = 0.0;
            int maxSteps = uIsMobile > 0.5 ? 12 : 20;
            for (int i = 0; i < 20; i++) {
              if (i >= maxSteps) break;
              vec3 p = ro + rd * t;
              float d = sceneSDFGrad(p).x;
              if (d < EPSILON) return t;
              if (t > 5.0) break;
              t += d;
            }
            return -1.0;
          }

          vec3 lighting(vec3 p, vec4 sdfGrad, vec3 rd) {
            vec3 normal   = sdfGrad.yzw;
            vec3 viewDir  = -rd;
            float ao      = gradAO(sdfGrad.x, normal);
            vec3 ambient  = uLightColor * uAmbientIntensity * ao;
            vec3 lightDir = normalize(uLightPosition);
            float diff    = max(dot(normal, lightDir), 0.0);
            float sh      = softShadow(p, lightDir, 0.01, 8.0, 16.0);
            vec3 diffuse  = uLightColor * diff * uDiffuseIntensity * sh;
            vec3 reflDir  = reflect(-lightDir, normal);
            float spec    = pow(max(dot(viewDir, reflDir), 0.0), uSpecularPower);
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
            vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;
            vec3 fresnelRim = uLightColor * fresnel * 0.4;
            float dc = length(p - uCursorSphere);
            if (dc < uCursorRadius + 0.4) {
              specular += uLightColor * (1.0 - smoothstep(0.0, uCursorRadius + 0.4, dc)) * 0.2;
              ambient  += uLightColor * exp(-dc * 3.0) * 0.075;
            }
            vec3 color = (uSphereColor + ambient + diffuse + specular + fresnelRim) * ao;
            color = pow(color, vec3(uContrast * 0.9));
            color = color / (color + vec3(0.8));
            return color;
          }

          float cursorGlowVal(vec3 wp) {
            float d = length(wp.xy - uCursorSphere.xy);
            return pow(1.0 - smoothstep(0.0, uCursorGlowRadius, d), 2.0) * uCursorGlowIntensity;
          }

          void main() {
            // ── COORDINATE FIX ────────────────────────────────────────────────
            // Derive the exact same 'uv' that NexusMetaballs computes from gl_FragCoord,
            // but using world XZ position + orthographic camera params instead.
            //
            // NexusMetaballs does:
            //   uv = (gl_FragCoord.xy * 2 - actualRes) / actualRes  →  -1..1
            //   uv.x *= aspect
            //   ro = vec3(uv * 2, -1)
            //
            // Orthographic camera maps world → screen as:
            //   screenX_norm = (worldX - camX) * 2 * zoom / viewW   →  -1..1
            //   screenY_norm = (worldZ - camZ) * 2 * zoom / viewH   →  -1..1
            // Then apply the same aspect correction:
            //   screenX_norm *= aspect  (= uResolution.x / uResolution.y)
            // Result is identical to NexusMetaballs uv post-aspect. ──────────
            float nx = (vWorldXZ.x - uCamX) * 2.0 * uZoom / uResolution.x;
            float ny = (vWorldXZ.y - uCamZ) * 2.0 * uZoom / uResolution.y;
            nx *= uResolution.x / uResolution.y; // aspect correction
            vec2 uv = vec2(nx, ny);

            vec3 ro = vec3(uv * 2.0, -1.0);
            vec3 rd = vec3(0.0, 0.0, 1.0);

            // ── Early-exit (verbatim from NexusMetaballs) ─────────────────────
            float earlyField = MAX_DIST;
            vec3 ep = vec3(uv * 2.0, 0.0);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos1)) - uFixedTopLeftRadius);
            earlyField = min(earlyField, length(ep - screenToWorld(uPos3)) - uFixedBottomRightRadius);
            earlyField = min(earlyField, length(ep.xy - uCursorSphere.xy) - uCursorRadius);

            float t = -1.0;
            vec3 p = ro;
            vec4 sdfGrad = vec4(MAX_DIST, 0.0, 1.0, 0.0);
            if (earlyField < 2.5) {
              t = rayMarch(ro, rd);
              if (t > 0.0) {
                p = ro + rd * t;
                sdfGrad = sceneSDFGrad(p);
              }
            }

            float glow = cursorGlowVal(ro);
            vec3 glowColor = uCursorGlowColor * glow;

            if (t > 0.0) {
              vec3 color = lighting(p, sdfGrad, rd);
              float fog = 1.0 - exp(-t * uFogDensity);
              color = mix(color, uBackgroundColor.rgb, fog * 0.3);
              color += glowColor * 0.3;
              gl_FragColor = vec4(color, 1.0);
            } else {
              gl_FragColor = glow > 0.01
                ? vec4(glowColor, glow * 0.8)
                : vec4(uBackgroundColor, 1.0);
            }
          }
        `}
      />
    </mesh>
  );
}
