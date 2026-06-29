import React, { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { BingoBlueprint } from './GenomeSequencer';

// --- DATA MODELS ---
// We will receive the completed sequence and the current progress to build the physical structure.

interface GenomeSequencer3DProps {
  blueprint: BingoBlueprint | null;
  aminoAcids: Record<string, any>;
  targetSequenceCodons: string; // The literal string of 'A', 'T', 'C', 'G' for the entire blueprint
  filledRungs: number; // How many rungs are completed
}

// Physical constants for the DNA double helix (simplified relative scales)
const RADIUS = 2;
const RISE_PER_BASE = 0.5; // distance upward per base pair
const TWIST_PER_BASE = (36 * Math.PI) / 180; // 36 degrees twist per base pair

// Colors derived mathematically from the Octave 5 and Octave 6 frequencies
const NUCLEOTIDE_COLORS: Record<string, string> = {
  A: '#f59e0b', // Octave 5: Amber (Lower freq purine)
  G: '#ef4444', // Octave 5: Red (Higher freq purine)
  T: '#38bdf8', // Octave 5: Cyan (Lower freq pyrimidine)
  C: '#10b981', // Octave 5: Emerald (Higher freq pyrimidine)
  U: '#f59e0b',
  UNKNOWN: '#475569' 
};

const SUGAR_COLOR = '#94a3b8';     // Octave 6 structural resonance
const PHOSPHATE_COLOR = '#cbd5e1'; // Octave 6 structural resonance

// --- 3D COMPONENTS ---

const BasePair = ({ index, letterTop, isFilled, isBlueprintScope }: { index: number, letterTop: string, isFilled: boolean, isBlueprintScope: boolean }) => {
  // Hide completely if it's beyond the blueprint scope (no infinite helix, just the target sequence)
  if (!isBlueprintScope) return null;

  // We place the helix along the X-axis for horizontal scrolling
  const x = index * RISE_PER_BASE * 4; // Spread out horizontally
  const angle = index * TWIST_PER_BASE;

  const letterBot = letterTop === 'A' ? 'T' : letterTop === 'T' ? 'A' : letterTop === 'C' ? 'G' : letterTop === 'G' ? 'C' : '?';
  
  const colorTop = isFilled ? (NUCLEOTIDE_COLORS[letterTop] || NUCLEOTIDE_COLORS.UNKNOWN) : '#334155';
  const colorBot = isFilled ? (NUCLEOTIDE_COLORS[letterBot] || NUCLEOTIDE_COLORS.UNKNOWN) : '#334155';

  // Biological Geometry: Purines (A, G) are long (2 rings), Pyrimidines (C, T) are short (1 ring).
  const isPurineTop = letterTop === 'A' || letterTop === 'G';
  const isPurineBot = letterBot === 'A' || letterBot === 'G';
  
  const lenTop = isPurineTop ? 2.0 : 1.4;
  const lenBot = isPurineBot ? 2.0 : 1.4;
  
  // Calculate gap for Hydrogen bonds
  const topEnd = RADIUS - lenTop;
  const botEnd = -RADIUS + lenBot;
  const gapCenter = (topEnd + botEnd) / 2;
  const gapSize = Math.abs(topEnd - botEnd);
  
  // A-T have 2 hydrogen bonds. C-G have 3 hydrogen bonds.
  const numBonds = (letterTop === 'C' || letterTop === 'G') ? 3 : 2;

  return (
    <group position={[x, 0, 0]}>
      {/* Rotate the entire rung around the X axis string to create the twist */}
      <group rotation={[angle, 0, 0]}>
      
        {/* === TOP STRAND === */}
        {/* Sugar Backbone Node */}
        <mesh position={[0, RADIUS, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />

            <meshStandardMaterial 
                color={isFilled ? SUGAR_COLOR : "#38bdf8"} 
                emissive={isFilled ? "#475569" : "#000000"} 
                emissiveIntensity={isFilled ? 0.5 : 0} 
                roughness={isFilled ? 0.7 : 1}
                wireframe={!isFilled}
                transparent={true}
                opacity={isFilled ? 1.0 : 0.4}
            />
        </mesh>
        {/* Nucleobase Plane Rib */}
        <group position={[0, RADIUS - lenTop/2, 0]}>
            <mesh>
                <boxGeometry args={[0.6, lenTop, 0.1]} />
                <meshStandardMaterial 
                    color={isFilled ? colorTop : "#38bdf8"} 
                    metalness={isFilled ? 0.1 : 0} 
                    roughness={isFilled ? 0.3 : 1} 
                    emissive={isFilled ? colorTop : "#000000"} 
                    emissiveIntensity={isFilled ? 0.4 : 0} 
                    wireframe={!isFilled}
                    transparent={true}
                    opacity={isFilled ? 1.0 : 0.2}
                />
            </mesh>
            <Text visible={isFilled} position={[0, 0, 0.06]} fontSize={0.35} color="#f8fafc" outlineWidth={0.02} outlineColor="#000000" fontWeight={900}>{letterTop}</Text>
            <Text visible={isFilled} position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]} fontSize={0.35} color="#f8fafc" outlineWidth={0.02} outlineColor="#000000" fontWeight={900}>{letterTop}</Text>
        </group>

        {/* === BOTTOM STRAND === */}
        {/* Sugar Backbone Node */}
        <mesh position={[0, -RADIUS, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial 
                color={isFilled ? SUGAR_COLOR : "#38bdf8"} 
                emissive={isFilled ? "#475569" : "#000000"} 
                emissiveIntensity={isFilled ? 0.5 : 0} 
                roughness={isFilled ? 0.7 : 1}
                wireframe={!isFilled}
                transparent={true}
                opacity={isFilled ? 1.0 : 0.4}
            />
        </mesh>
        {/* Nucleobase Plane Rib */}
        <group position={[0, -RADIUS + lenBot/2, 0]}>
            <mesh>
                <boxGeometry args={[0.6, lenBot, 0.1]} />
                <meshStandardMaterial 
                    color={isFilled ? colorBot : "#38bdf8"} 
                    metalness={isFilled ? 0.1 : 0} 
                    roughness={isFilled ? 0.3 : 1} 
                    emissive={isFilled ? colorBot : "#000000"} 
                    emissiveIntensity={isFilled ? 0.4 : 0} 
                    wireframe={!isFilled}
                    transparent={true}
                    opacity={isFilled ? 1.0 : 0.2}
                />
            </mesh>
            
            <Text visible={isFilled} position={[0, 0, 0.06]} fontSize={0.35} color="#f8fafc" outlineWidth={0.02} outlineColor="#000000" fontWeight={900}>{letterBot}</Text>
            <Text visible={isFilled} position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]} fontSize={0.35} color="#f8fafc" outlineWidth={0.02} outlineColor="#000000" fontWeight={900}>{letterBot}</Text>
        </group>

        {/* === PHYSICAL HYDROGEN BONDS === */}
        <group position={[0, gapCenter, 0]}>
            {Array.from({ length: numBonds }).map((_, i) => {
                // Offset them along X to sit side-by-side like a socket/plug
                const offset = (i - (numBonds - 1) / 2) * 0.25;
                return (
                    <mesh key={i} position={[offset, 0, 0]}>
                        <boxGeometry args={[0.08, gapSize, 0.08]} />
                        <meshStandardMaterial 
                                color={isFilled ? "#f8fafc" : "#38bdf8"} 
                                emissive={isFilled ? "#ffffff" : "#000000"} 
                                emissiveIntensity={isFilled ? 1 : 0} 
                                wireframe={!isFilled}
                                transparent={true} 
                                opacity={isFilled ? 0.9 : 0.2} 
                            />
                    </mesh>
                );
            })}
        </group>

        {/* === PHOSPHATE LINKERS === */}
        {/* Stick out along the rail to connect to the next node */}
        <mesh position={[RISE_PER_BASE * 2, RADIUS * 0.95, 0.2]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
                  color={isFilled ? PHOSPHATE_COLOR : "#38bdf8"} 
                  metalness={isFilled ? 0.8 : 0} 
                  roughness={isFilled ? 0.2 : 1}
                  wireframe={!isFilled}
                  transparent={true} 
                  opacity={isFilled ? 1.0 : 0.2} 
                />
        </mesh>
      </group>
    </group>
  );
};

// Auto-zooming camera to ensure the entire blueprint fits perfectly on screen
const CameraFramer = ({ rungsCount }: { rungsCount: number }) => {
  const { camera } = useThree();
  useEffect(() => {
    // 24 rungs * 1.2 = 28 Z distance. 12 rungs * 1.2 = 14 Z distance (caps at 18 min).
    const targetZ = Math.max(18, rungsCount * 1.2);
    // Directly position to prevent fighting OrbitControls
    camera.position.set(0, 0, targetZ);
  }, [rungsCount, camera]);
  
  return null;
};

// --- MAIN ENGINE ---

export default function GenomeSequencer3D({ blueprint, aminoAcids, targetSequenceCodons, filledRungs }: GenomeSequencer3DProps) {
  
  // Calculate total length
  const totalRungs = targetSequenceCodons.length || 60; // Render at least some background structure
  
  // Create an array of rung data
  const rungs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < Math.max(totalRungs, 60); i++) {
        let letter = targetSequenceCodons[i];
        if (!letter) {
            // Generate synthetic background pairs if beyond blueprint
            letter = ['A', 'T', 'C', 'G'][Math.floor(Math.random() * 4)];
        }
        arr.push({
            index: i,
            letter,
            isFilled: i < filledRungs,
            isBlueprintScope: i < totalRungs
        });
    }
    return arr;
  }, [totalRungs, targetSequenceCodons, filledRungs]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#020617' }}>
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        {/* Cosmos Lighting */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={3.0} color="#38bdf8" />
        <pointLight position={[-10, -10, -10]} intensity={2.0} color="#818cf8" />
        <spotLight position={[0, 20, 0]} angle={0.8} penumbra={1} intensity={5} />

        {/* DNA Helix Group */}
        <group position={[-totalRungs * RISE_PER_BASE * 2, 0, 0]}>
            {rungs.map((rung) => (
                <BasePair 
                    key={rung.index} 
                    index={rung.index} 
                    letterTop={rung.letter} 
                    isFilled={rung.isFilled} 
                    isBlueprintScope={rung.isBlueprintScope}
                />
            ))}
        </group>

        {/* Dynamic Camera Control */}
        <CameraFramer rungsCount={totalRungs} />

        {/* Controls */}
        <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
        />
        
        {/* Background Grid for Scale */}
        <gridHelper args={[100, 100, '#1e293b', '#0f172a']} position={[0, -10, 0]} />
      </Canvas>
    </div>
  );
}
