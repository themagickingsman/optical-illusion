import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useBuildingsCMS, BuildingArchetype } from './BuildingsCMSData';

export interface BuildingData {
    id: string;
    q: number;
    r: number;
    type: string;
    owner: string;
}

interface BaseBuildingEngineProps {
    buildings: BuildingData[];
    hexSize: number;
    // We pass the mathematical conversion explicitly so the building engine acts perfectly headlessly
    hexToPixel: (q: number, r: number, size: number) => { x: number, y: number };
}

import { useTexture, Line } from '@react-three/drei';
import { getBuildingSVGDataUri } from '../BuildingIcon';

// Autonomous Physics Rotation Group for generating high-definition Dash Lines honoring actual system pixel widths
function SpinningShieldRing({ radius, posX, posY }: { radius: number, posX: number, posY: number }) {
    const ref = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.z -= delta * 0.1; // Smooth slow orbit
    });

    const linePoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
        }
        return pts;
    }, [radius]);

    return (
        <group position={[posX, -posY, 1.0]} ref={ref}>
            <Line 
                points={linePoints} 
                color="#ff00ff" 
                lineWidth={4} // Fixed 4-pixel device-agnostic thickness
                transparent 
                opacity={0.8}
                dashed={true}
                dashSize={radius * 0.12} // Graceful dotted scale 
                gapSize={radius * 0.08}
            />
        </group>
    );
}

// Sub-component allocating 1 dedicated GPU Draw Call mapping strictly to 1 Archetype Memory Array
function ArchetypeInstancedMesh({ archetype, instances, hexSize, hexToPixel }: { archetype: BuildingArchetype, instances: BuildingData[], hexSize: number, hexToPixel: any }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Generate strict SVG Texture Cache natively for this Archetype's Material
    const textureUrl = useMemo(() => getBuildingSVGDataUri(archetype.name), [archetype.name]);
    const texture = useTexture(textureUrl);

    useEffect(() => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        
        instances.forEach((building, i) => {
            const pos = hexToPixel(building.q, building.r, hexSize);
            
            // This component mounts exactly inside the Local Rotation group (X, -Z inversion matches)
            dummy.position.set(pos.x, -pos.y, 5); 
            // Because the top-down camera points [-Z], setting rotation to 0 keeps the SVG sprite flawlessly flat facing the camera.
            dummy.rotation.set(0, 0, 0);
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        // Notify the Graphics Card that the Matrix Buffer has mutated
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [instances, hexSize, hexToPixel, archetype]);

    if (instances.length === 0) return null;

    const geometryScale = hexSize * 1.35;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 10000]} count={instances.length} frustumCulled={false}>
            <planeGeometry args={[geometryScale, geometryScale]} />
            <meshBasicMaterial map={texture} transparent={true} depthTest={false} side={THREE.DoubleSide} />
        </instancedMesh>
    );
}

/**
 * 100% Standalone MMO InstancedMesh Base Building Engine
 * 
 * Takes an array of hundreds/thousands of JSON buildings, and mathematically stamps
 * them across the GPU using a single Draw Call per building classification.
 */
export default function BaseBuildingEngine({ buildings, hexSize, hexToPixel }: BaseBuildingEngineProps) {
    const { buildingsDB } = useBuildingsCMS();

    // Fast memory lookup to find which Archetype ID is the Shield Generator
    const shieldGeneratorId = useMemo(() => buildingsDB.find(a => a.name === 'Shield Generator')?.id, [buildingsDB]);
    const shieldGenerators = useMemo(() => buildings.filter(b => b.type === shieldGeneratorId), [buildings, shieldGeneratorId]);
    const shieldRadius = hexSize * 4.5; // Exact matching bounds for 19 hex cluster density

    return (
        <group>
            {shieldGenerators.map(sg => {
                const pos = hexToPixel(sg.q, sg.r, hexSize);
                return <SpinningShieldRing key={`shield_bound_${sg.id}`} radius={shieldRadius} posX={pos.x} posY={pos.y} />;
            })}

            {buildingsDB.map(archetype => {
                // Hard isolate the building arrays by type (O(N) operation on memory state only)
                const typeInstances = buildings.filter(b => b.type === archetype.id);
                return (
                    <ArchetypeInstancedMesh 
                        key={archetype.id} 
                        archetype={archetype} 
                        instances={typeInstances} 
                        hexSize={hexSize} 
                        hexToPixel={hexToPixel} 
                    />
                );
            })}
        </group>
    );
}
