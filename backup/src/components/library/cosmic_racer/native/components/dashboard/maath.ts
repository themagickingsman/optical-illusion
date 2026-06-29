import * as THREE from 'three';

export const easing = {
  damp3: (current: THREE.Vector3, target: [number, number, number], lambda: number, delta: number) => {
    current.x = THREE.MathUtils.lerp(current.x, target[0], lambda * (delta * 60 || 1));
    current.y = THREE.MathUtils.lerp(current.y, target[1], lambda * (delta * 60 || 1));
    current.z = THREE.MathUtils.lerp(current.z, target[2], lambda * (delta * 60 || 1));
  }
};
