/**
 * ShadowHelper.ts
 *
 * Shadow quality utilities for the ARN terrain / 3D studio.
 * Uses the shadow camera frustum-size approach to control softness:
 *   - Tight frustum = more shadow texels per world unit = sharper edges
 *   - Wide frustum  = fewer texels per unit = softer, blurrier appearance
 *
 * This is dependency-free and works with any Three.js shadow map type.
 */

import * as THREE from 'three';

/**
 * Map a slider value (0–24) to a shadow-camera frustum half-size.
 *   0  → 15  (very sharp — 4096/30   ≈ 137 texels per world unit)
 *   12 → 39  (medium)
 *   24 → 63  (very soft — 4096/126   ≈ 33 texels per world unit)
 */
export function sliderToFrustumHalf(sliderValue: number, base = 15): number {
  return base + sliderValue * 2;
}

/**
 * Apply a new frustum half-size to a DirectionalLight's shadow camera
 * and request a shadow map refresh.
 */
export function applyShadowSoftness(
  light: THREE.DirectionalLight,
  renderer: THREE.WebGLRenderer,
  half: number,
): void {
  const cam = light.shadow.camera;
  cam.left   = cam.bottom = -half;
  cam.right  = cam.top    =  half;
  cam.updateProjectionMatrix();
  light.shadow.needsUpdate = true;
  renderer.shadowMap.needsUpdate = true;
}
