import * as THREE from 'three';

export interface IParticleSystem {
    /** The main group containing any meshes the system uses. Add this to your scene. */
    group: THREE.Group;
    
    /** Trigger an explosion of particles at a world coordinate. */
    explode(
        x: number, 
        y: number, 
        z: number, 
        force: number, 
        radius: number, 
        color: THREE.Color,
        isTreasureMode?: boolean
    ): void;

    /** 
     * Update physics for all active particles.
     * @param mouseW The world coordinate of the mouse (for magnetic pulling)
     * @param partDecay Multiplier for velocity decay (e.g. 0.98)
     * @param partFalloff Linear Y falloff for gravity (e.g. 0.05)
     * @param partSize Base size multiplier for particles
     * @returns activeExplosionCount - Number of currently active explosions for UI profiling
     */
    update(mouseW: THREE.Vector3, partDecay: number, partFalloff: number, partSize: number): number;

    /** Clean up resources */
    dispose(): void;
}
