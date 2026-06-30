'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';
import { BlueprintLibraryModal } from './BlueprintLibraryModal';
import GenomeSequencer3D from './GenomeSequencer3D';

import codons from '../../state/science/datasets/dna/codons.json';
import aminoAcids from '../../state/science/datasets/dna/amino_acids.json';
import chr1BlueprintsData from '../../../../data/INPUTS/genome/chr1_blueprints.json';
import { COUNTER_FREQUENCY_INDEX } from '../../state/science/catalogs/gene_frequency_catalog';

// --- GAME LOGIC TYPES ---
export interface AminoAcidCard {
    id: string;
    name: string;
    symbol: string;
    mass: number;
    color: string;
    count: number;
}

export interface BingoBlueprint {
    id: string;
    name: string;
    targetSequence: string[]; // List of Amino Acid targets by symbol (e.g. ['Ser', 'Lys'])
    currentProgress: number; // Index of the next required item
    completed: boolean;
    reward: string;
    themeColor: string;
    category?: string; // e.g. 'Structura', 'Nervosa'
}

// 64 pre-calculated codon objects (we use the imported JSON)
const CODON_LIST = Object.values(codons);

const ALL_BLUEPRINTS = chr1BlueprintsData as BingoBlueprint[];
const INITIAL_BLUEPRINTS: BingoBlueprint[] = ALL_BLUEPRINTS.slice(0, 3);
// All other genes are "hidden" and require the user to pull the first Amino Acid Catalyst to unlock them
const HIDDEN_BLUEPRINTS: BingoBlueprint[] = ALL_BLUEPRINTS.slice(3).map(bp => ({
    ...bp,
    currentProgress: 1 // Pre-filled because finding the first card unlocks it
}));

export const GenomeSequencer = () => {
    // --- STATE ---
    const [slots, setSlots] = useState<[string, string, string]>(['-', '-', '-']);
    const [isSpinning, setIsSpinning] = useState(false);
    const [inventory, setInventory] = useState<Record<string, AminoAcidCard>>({});
    const [blueprints, setBlueprints] = useState<BingoBlueprint[]>(INITIAL_BLUEPRINTS);
    const [latestSpunCodon, setLatestSpunCodon] = useState<any | null>(null);
    const [spinsLeft, setSpinsLeft] = useState(500); // Standard soft-currency
    const [showDropReveal, setShowDropReveal] = useState(false);
    const [dropDestination, setDropDestination] = useState<'INVENTORY' | 'BLUEPRINT' | null>(null);
    const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false); // Retractable library state
    const [isCollecting, setIsCollecting] = useState(false); // Controls the plunge animation
    
    // Discovery Engine State
    const [hiddenBlueprints, setHiddenBlueprints] = useState<BingoBlueprint[]>(HIDDEN_BLUEPRINTS);
    const [discoveryOverlay, setDiscoveryOverlay] = useState<BingoBlueprint | null>(null);
    const [isDeckManagerOpen, setIsDeckManagerOpen] = useState(false);
    const [completedBlueprintId, setCompletedBlueprintId] = useState<string | null>(null); // set when a card is completed

    // Filter Top 5 closest to completion
    const top5ActiveBlueprints = useMemo(() => {
        return [...blueprints]
            .filter(bp => !bp.completed)
            .sort((a, b) => {
                const aPct = a.currentProgress / Math.max(a.targetSequence.length, 1);
                const bPct = b.currentProgress / Math.max(b.targetSequence.length, 1);
                return bPct - aPct;
            })
            .slice(0, 5);
    }, [blueprints]);

    // Oscilloscope Reference
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'HELIX' | 'OSCILLOSCOPE'>('HELIX');
    
    // Waveform state (History of successfully matched Codons for rendering)
    const [activeWaveformEntities, setActiveWaveformEntities] = useState<any[]>([]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Calculate current DNA sequence state for 3D Renderer
    const activeBp = blueprints.find(b => !b.completed) || blueprints[0];
    const getCodonForAa = (aaAbbr: string) => {
        const found = (codons as any[]).find(c => c.amino_acid === aaAbbr);
        return found ? (found.sequence as string) : 'ATG'; 
    };
    const targetSequenceCodons = activeBp ? activeBp.targetSequence.map(aa => getCodonForAa(aa)).join('') : '';
    const filledRungs = activeBp ? activeBp.currentProgress * 3 : 0;

    // --- INITIALIZE INVENTORY FROM AMINO ACIDS JSON ---
    useEffect(() => {
        const initialInv: Record<string, AminoAcidCard> = {};
        Object.keys(aminoAcids).forEach(key => {
            const aa = (aminoAcids as any)[key];
            
            // Key the inventory by the 3-letter abbreviation returned by the Faucet (e.g. 'Phe', 'Ala')
            initialInv[aa.abbr || aa.symbol] = {
                id: key,
                name: aa.name,
                symbol: aa.abbr || aa.symbol, // UI now displays the 3-letter 'Phe' instead of 'F' to match User expectations
                mass: aa.mass_molar || aa.mass || 0,
                color: aa.color_hex || '#94a3b8',
                count: 0
            };
        });
        // We also need the "Stop" command card
        initialInv['Stop'] = { id: 'stop', name: 'Stop Codon', symbol: 'Stop', mass: 0, color: '#475569', count: 0 };
        setInventory(initialInv);
    }, []);

    // --- DISCOVERY ENGINE LOOP ---
    useEffect(() => {
        if (Object.keys(inventory).length === 0) return;

        const newlyDiscovered: BingoBlueprint[] = [];
        const remainingHidden: BingoBlueprint[] = [];

        hiddenBlueprints.forEach(bp => {
            // A blueprint is discovered the moment the user collects the FIRST card in its target sequence
            const catalystCard = bp.targetSequence[0];
            if (inventory[catalystCard] && inventory[catalystCard].count > 0) {
                newlyDiscovered.push(bp);
            } else {
                remainingHidden.push(bp);
            }
        });

        if (newlyDiscovered.length > 0) {
            setHiddenBlueprints(remainingHidden);
            setBlueprints(prev => [...prev, ...newlyDiscovered]);
            setDiscoveryOverlay(newlyDiscovered[0]); // Show the modal for the first discovery this tick
        }
    }, [inventory, hiddenBlueprints]);

    // --- CANVAS OSCILLOSCOPE LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Match actual resolution to screen
        const handleResize = () => {
           canvas.width = canvas.clientWidth * 2;
           canvas.height = canvas.clientHeight * 2;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        let animationFrameId: number;
        let time = 0;

        const renderLoop = () => {
            time += 0.05; // Time delta

            // Clear Background
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerY = canvas.height / 2;
            const yScale = canvas.height / 900;
            ctx.lineWidth = 4 * yScale;

            if (viewMode === 'OSCILLOSCOPE') {
                if (activeWaveformEntities.length === 0) {
                    // Idle static (Flatline)
                    ctx.strokeStyle = '#334155';
                    ctx.beginPath();
                    ctx.moveTo(0, centerY);
                    ctx.lineTo(canvas.width, centerY);
                    ctx.stroke();
                } else {
                    // 1. Draw individual constituent waveforms (lighter, thinner lines)
                    ctx.lineWidth = 1.5 * yScale;
                    activeWaveformEntities.forEach((codon: any, index: number) => {
                        const rawMass = codon.amino_acid ? ((aminoAcids as any)[codon.amino_acid]?.mass_molar || 135) : 0;
                        const amplitude = (rawMass / 150) * 80 * yScale;
                        const phaseRad = (codon.phase_angle || 0) * (Math.PI / 180);
                        const freq = Math.min(0.01 + (index * 0.002), 0.1);
                        const activeColor = codon.amino_acid ? ((aminoAcids as any)[codon.amino_acid]?.color_hex || '#14b8a6') : '#14b8a6';

                        ctx.beginPath();
                        ctx.strokeStyle = `${activeColor}40`; 
                        for (let x = 0; x < canvas.width; x += 4) {
                            const y = amplitude * Math.sin((x * freq * 0.5) + time + phaseRad);
                            const displayY = Math.max(20, Math.min(canvas.height - 20, centerY + y));
                            if (x === 0) ctx.moveTo(x, displayY);
                            else ctx.lineTo(x, displayY);
                        }
                        ctx.stroke();
                    });

                    // 2. Draw Compound Waveform (Thick, bright, glowing)
                    ctx.lineWidth = 4 * yScale;
                    ctx.beginPath();
                    
                    // Draw path across X axis
                    for (let x = 0; x < canvas.width; x += 2) {
                        let combinedY = 0;
                        
                        activeWaveformEntities.forEach((codon: any, index: number) => {
                            const rawMass = codon.amino_acid ? ((aminoAcids as any)[codon.amino_acid]?.mass_molar || 135) : 0;
                            const amplitude = (rawMass / 150) * 80 * yScale; 
                            const phaseRad = (codon.phase_angle || 0) * (Math.PI / 180);
                            const freq = Math.min(0.01 + (index * 0.002), 0.1);
                            combinedY += amplitude * Math.sin((x * freq * 0.5) + time + phaseRad);
                        });

                        const displayY = Math.max(20, Math.min(canvas.height - 20, centerY + combinedY));

                        if (x === 0) {
                            ctx.moveTo(x, displayY);
                        } else {
                            ctx.lineTo(x, displayY);
                        }
                    }

                    // Render stroke glow based on the last added codon's AA color
                    const lastEntity = activeWaveformEntities[activeWaveformEntities.length - 1];
                    const activeColor = lastEntity.amino_acid ? ((aminoAcids as any)[lastEntity.amino_acid]?.color_hex || '#14b8a6') : '#14b8a6';
                    
                    ctx.strokeStyle = activeColor;
                    ctx.shadowColor = activeColor;
                    ctx.shadowBlur = 20;
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                }
            }


            // Grid lines overlay
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, centerY); ctx.lineTo(canvas.width, centerY);
            
            // Draw a few vertical grid lines
            for (let i = 1; i < 10; i++) {
                const ix = (canvas.width / 10) * i;
                ctx.moveTo(ix, 0); ctx.lineTo(ix, canvas.height);
            }
            
            ctx.stroke();

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [activeWaveformEntities, viewMode, blueprints]);


    // --- GAME ACTIONS ---
    const collectActiveCard = () => {
        if (isCollecting || !latestSpunCodon) return;
        
        setIsCollecting(true);
        
        // Capture exact current values in closure so they don't get overwritten by a fast new spin
        const codonToCollect = latestSpunCodon;

        // Synchronously update the inventory ledger immediately so race conditions can't drop cards!
        setInventory(prev => {
            const next = { ...prev };
            const symbol = codonToCollect.amino_acid;
            if (symbol && next[symbol]) {
                // Deep clone to ensure React catches the re-render mapping
                next[symbol] = { ...next[symbol], count: next[symbol].count + 1 };
            }
            return next;
        });

        // Also stack it on the waveform to create physical resonance!
        setActiveWaveformEntities(prev => [...prev, codonToCollect]);

        setTimeout(() => {
            setIsCollecting(false);
            setShowDropReveal(false);
        }, 450); // Matches CSS animation timing
    };

    const handleSpin = () => {
        if (spinsLeft <= 0 || isSpinning || isCollecting) return; // Prevent spamming while collecting
        
        // If a card is waiting to be collected, auto-collect it while we start the exact next spin immediately!
        if (showDropReveal) {
            collectActiveCard();
        } else {
            setShowDropReveal(false);
        }

        setIsSpinning(true);
        setSpinsLeft(prev => prev - 1);
        
        // Visiual Spin Effect
        let spins = 0;
        const spinInterval = setInterval(() => {
            const bases = ['A', 'C', 'T', 'G'];
            setSlots([
                bases[Math.floor(Math.random() * 4)],
                bases[Math.floor(Math.random() * 4)],
                bases[Math.floor(Math.random() * 4)],
            ]);
            spins++;

            if (spins > 10) {
                clearInterval(spinInterval);
                finishSpin();
            }
        }, 50);
    };

    const finishSpin = () => {
        // --- RIGGED RNG FOR DEVELOPER TESTING ---
        // We want the user to easily see the structure build without clicking 300 times.
        // We will rig the drop to match the needed blueprint card 75% of the time.
        let hitCodon;
        
        // Find what we currently need:
        const activeBp = blueprints.find(b => !b.completed) || blueprints[0];
        const requiredSymbol = (activeBp && activeBp.currentProgress < activeBp.targetSequence.length) 
                                ? activeBp.targetSequence[activeBp.currentProgress] 
                                : null;

        if (requiredSymbol && Math.random() < 0.75) {
            // Rig the drop! Find the first codon that matches this Amino Acid
            const forcedIndex = CODON_LIST.findIndex((c: any) => c.amino_acid === requiredSymbol);
            hitCodon = CODON_LIST[forcedIndex > -1 ? forcedIndex : 0] as any;
        } else {
            // Natural 64 Codon distribution
            const randomIndex = Math.floor(Math.random() * CODON_LIST.length);
            hitCodon = CODON_LIST[randomIndex] as any;
        }
        
        // Update Slot Letters
        const chars = hitCodon.sequence.split('');
        setSlots([chars[0], chars[1], chars[2]]);
        
        const aaSymbol = hitCodon.amino_acid;
        setLatestSpunCodon(hitCodon);

        // ----------------------------------------
        // THE BINGO / CRAFTING MECHANIC
        // ----------------------------------------
        let wasMatched = false;
        
        if (aaSymbol !== 'Stop') {
            setBlueprints(prevBlueprints => {
                const nextBps = [...prevBlueprints];
                let matched = false;

                for (let i = 0; i < nextBps.length; i++) {
                    const bp = nextBps[i];
                    if (!bp.completed && bp.currentProgress < bp.targetSequence.length) {
                        const requiredSymbol = bp.targetSequence[bp.currentProgress];
                        if (requiredSymbol === aaSymbol) {
                            // MATCH! Slot it in (Immutable clone for React state detection).
                            nextBps[i] = { ...bp, currentProgress: bp.currentProgress + 1 };
                            matched = true;
                            if (nextBps[i].currentProgress >= nextBps[i].targetSequence.length) {
                                nextBps[i].completed = true;
                                // 🔓 Unlock the frequency reveal for this blueprint
                                setCompletedBlueprintId(nextBps[i].id);
                            }
                            break; // Ensure one card drop only fills one slot total
                        }
                    }
                }
                
                if (matched) {
                    wasMatched = true;
                }
                
                return nextBps;
            });
        }

        setTimeout(() => {
             setDropDestination(wasMatched ? 'BLUEPRINT' : 'INVENTORY');
             setIsSpinning(false);
             setShowDropReveal(true);
        }, 50); // slight delay to allow state to settle
    };


    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#020617', color: '#fff', overflow: 'hidden' }}>
            
            {/* GLOBAL GENOME SCALE BAND */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 150, padding: '1rem', background: 'rgba(2, 6, 23, 0.95)', borderBottom: '1px solid rgba(56, 189, 248, 0.1)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.15em', marginBottom: '8px' }}>
                    <span>HUMAN GENOME SCALE (25,000+ GENES)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>{blueprints.length + hiddenBlueprints.length} / 25,000 MAPPED</span>
                        <a
                            href="/science/library/gene-frequency-catalog"
                            style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                background: 'rgba(167,139,250,0.12)',
                                border: '1px solid rgba(167,139,250,0.4)',
                                color: '#a78bfa',
                                textDecoration: 'none',
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            💡 GENE FREQUENCY ATLAS →
                        </a>
                    </div>
                </div>
                <div style={{ position: 'relative', width: '100%', height: '10px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    {Array.from({ length: 200 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, background: i % 15 === 0 ? '#1e293b' : 'transparent', borderRight: '1px solid rgba(255,255,255,0.02)' }} />
                    ))}
                    
                    {/* Active Blueprint Locator Blip */}
                    {(blueprints.find(b => !b.completed) || blueprints[0]) && (() => {
                        const activeBp = blueprints.find(b => !b.completed) || blueprints[0];
                        // Deterministic visual hash for the position out of 100%
                        const posPercent = Math.abs(activeBp.id.charCodeAt(3) * 17) % 90 + 5; 
                        
                        return (
                            <React.Fragment>
                                <div style={{
                                    position: 'absolute', top: 0, bottom: 0,
                                    left: `${posPercent}%`, width: '4px',
                                    background: activeBp.themeColor || '#38bdf8',
                                    boxShadow: `0 0 10px ${activeBp.themeColor || '#38bdf8'}`
                                }} />
                                <div style={{
                                    position: 'absolute', left: `calc(${posPercent}% - 75px)`, width: '150px',
                                    textAlign: 'center', fontSize: '0.6rem', color: activeBp.themeColor || '#38bdf8',
                                    fontWeight: 900, marginTop: '12px', letterSpacing: '0.05em'
                                }}>
                                    ▲ OVERALL SEQUENCE ALIGNMENT
                                </div>
                            </React.Fragment>
                        );
                    })()}
                </div>
            </div>
            
            {/* HIDDEN BLUEPRINT DISCOVERY OVERLAY */}
            {discoveryOverlay && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1000,
                    background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <div style={{
                        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.95))`,
                        border: `2px solid ${discoveryOverlay.themeColor}`,
                        boxShadow: `0 0 50px ${discoveryOverlay.themeColor}50, inset 0 0 20px ${discoveryOverlay.themeColor}20`,
                        borderRadius: '24px', padding: '4rem', textAlign: 'center',
                        maxWidth: '600px', animation: 'scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ color: discoveryOverlay.themeColor, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.2em', marginBottom: '1rem' }}>
                            NEW GENETIC SEQUENCE DISCOVERED
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 2rem 0', fontFamily: 'monospace' }}>
                            {discoveryOverlay.name}
                        </h2>
                        <div style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '3rem' }}>
                            You have collected a catalyst amino acid. This unknown sequence has been mathematically identified and added to your Active Blueprints.
                        </div>
                        
                        <button onClick={() => setDiscoveryOverlay(null)} style={{
                            padding: '1.2rem 3rem', background: discoveryOverlay.themeColor, color: '#0f172a',
                            border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.1em',
                            cursor: 'pointer', boxShadow: `0 10px 20px -5px ${discoveryOverlay.themeColor}80`
                        }}>
                            COMMENCE SYNTHESIS
                        </button>
                    </div>
                </div>
            )}

            {/* TOP RIGHT CONTROLS */}
            <div style={{
                position: 'absolute', top: '5rem', right: '1rem',
                display: 'flex', gap: '0.5rem', zIndex: 100
            }}>
                <button 
                    onClick={() => setViewMode(viewMode === 'HELIX' ? 'OSCILLOSCOPE' : 'HELIX')}
                    style={{
                        background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#f8fafc',
                        padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em',
                        backdropFilter: 'blur(10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    {viewMode === 'HELIX' ? '⇌ OSCILLOSCOPE' : '⇌ HELIX'}
                </button>
                <button 
                    onClick={() => setIsDeckManagerOpen(true)}
                    style={{
                        background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#f8fafc',
                        padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em',
                        backdropFilter: 'blur(10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    ◫ CATALOG
                </button>
                <button 
                    onClick={toggleFullscreen}
                    style={{
                        background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#f8fafc',
                        padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em',
                        backdropFilter: 'blur(10px)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    {isFullscreen ? 'EXIT FULLSCREEN' : '⛶ FULLSCREEN'}
                </button>
            </div>

            {/* TOP SECTION: Oscilloscope (Background), Slot Machine (Center), Blueprints (Right) */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                
                {/* 1. LAYER 0: OSCILLOSCOPE FULL SCREEN */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                        {viewMode === 'OSCILLOSCOPE' ? (
                            <canvas 
                                ref={canvasRef} 
                                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                            />
                        ) : (
                            <GenomeSequencer3D 
                                blueprint={activeBp}
                                aminoAcids={aminoAcids}
                                targetSequenceCodons={targetSequenceCodons}
                                filledRungs={filledRungs}
                            />
                        )}
                    {/* Header stats over canvas */}
                    <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', textShadow: '0 2px 10px rgba(0,0,0,1)' }}>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#f8fafc', fontWeight: 900, letterSpacing: '0.05em' }}>
                            <span style={{ color: '#14b8a6' }}>Real-Time</span> Oscilloscope Tribunal
                        </h2>
                        <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Rendering Synthesized Matter Frequencies</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#14b8a6', fontFamily: 'monospace', marginTop: '1rem' }}>
                            {activeWaveformEntities.length > 0 ? `${(500 + activeWaveformEntities.length * 2.3).toFixed(1)} THz` : '000.0 THz'}
                        </div>
                    </div>
                </div>

                {/* 2. LAYER 1: CENTERED SLOT MACHINE (FLOATING LABELS ONLY) */}
                <div style={{ 
                    position: 'absolute', 
                    bottom: '500px', // 500px from bottom as requested
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    zIndex: 5, 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    {/* The 3 Dials without the heavy container */}
                    <div style={{ 
                        display: 'flex', justifyContent: 'center', gap: '1.5rem', 
                        position: 'relative'
                    }}>
                        {slots.map((char, idx) => (
                            <div key={idx} style={{
                                width: '100px', height: '130px', 
                                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(203, 213, 225, 0.95) 100%)', 
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '6rem', fontWeight: 900, color: '#0f172a',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), inset 0 4px 6px rgba(255,255,255,0.5)',
                                fontFamily: 'monospace',
                                border: '2px solid rgba(255,255,255,0.5)'
                            }}>
                                {char}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleSpin}
                        disabled={isSpinning || spinsLeft <= 0}
                        style={{
                            width: '300px', padding: '1.2rem', marginTop: '1rem',
                            background: isSpinning ? '#475569' : 'linear-gradient(135deg, rgba(20, 184, 166, 0.9) 0%, rgba(13, 148, 136, 0.9) 100%)',
                            color: '#fff', border: 'none', borderRadius: '12px',
                            cursor: isSpinning ? 'default' : 'pointer',
                            boxShadow: isSpinning ? 'none' : '0 10px 25px -5px rgba(13, 148, 136, 0.6)',
                            transition: 'all 0.2s',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                    >
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {isSpinning ? 'Sequencing...' : 'Pull Lever'}
                        </span>
                        
                        <div style={{ 
                            background: 'rgba(255, 255, 255, 0.2)', padding: '0.4rem 0.8rem', 
                            borderRadius: '99px', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 800, 
                            border: '1px solid rgba(255,255,255,0.3)' 
                        }}>
                             {spinsLeft}
                        </div>
                    </button>

                    {/* Reveal Overlay - Hovers below slot machine without shifting layout */}
                    {showDropReveal && latestSpunCodon && (
                        <div style={{ 
                            position: 'absolute',
                            top: '105%',
                            width: '100%',
                            padding: '1.5rem', 
                            background: dropDestination === 'BLUEPRINT' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.95)', 
                            borderRadius: '16px', 
                            border: `2px solid ${dropDestination === 'BLUEPRINT' ? '#38bdf8' : '#14b8a6'}`,
                            boxShadow: `0 0 30px ${dropDestination === 'BLUEPRINT' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(20, 184, 166, 0.3)'}`,
                            animation: isCollecting 
                                ? 'collectDrop 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards' 
                                : 'revealPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                            overflow: 'hidden',
                            zIndex: 20
                        }}>
                             {/* Gloss effect */}
                             <div style={{ position: 'absolute', top: 0, left: '-100%', width: '150%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'swipe 2s infinite' }} />

                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800 }}>YOU ROLLED</div>
                            
                            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.1em', fontFamily: 'monospace', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                                    {latestSpunCodon.sequence}
                                </div>
                                <div style={{ fontSize: '1.1rem', color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 600 }}>
                                    Yields: <span style={{ color: latestSpunCodon.amino_acid === 'Stop' ? '#ef4444' : '#14b8a6', fontWeight: 900 }}>
                                         {latestSpunCodon.amino_acid === 'Stop' ? '🛑 STOP COMMAND' : `${latestSpunCodon.amino_acid || 'Unknown'} Card`}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ 
                                background: dropDestination === 'BLUEPRINT' ? '#38bdf8' : '#14b8a6', 
                                color: '#0f172a', padding: '0.8rem', borderRadius: '8px', 
                                textAlign: 'center', fontSize: '0.9rem', fontWeight: 900,
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                letterSpacing: '0.05em'
                            }}>
                                {dropDestination === 'BLUEPRINT' ? '⚡ SLOTTED INTO ACTIVE BLUEPRINT' : '📦 SENT TO INVENTORY'}
                            </div>

                            <button 
                                onClick={collectActiveCard}
                                disabled={isCollecting} 
                                style={{
                                    width: '100%', marginTop: '1rem', padding: '1rem',
                                    background: isCollecting ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1',
                                    borderRadius: '8px', cursor: isCollecting ? 'default' : 'pointer',
                                    fontWeight: 700, letterSpacing: '0.1em',
                                    transition: 'all 0.2s'
                            }}>
                                {isCollecting ? 'COLLECTING...' : 'COLLECT'}
                            </button>

                            {/* ── FREQUENCY REVEAL — shows when a blueprint is just completed ── */}
                            {completedBlueprintId && (() => {
                                const cf = COUNTER_FREQUENCY_INDEX[completedBlueprintId];
                                if (!cf) return null;
                                return (
                                    <div style={{
                                        marginTop: '1.25rem',
                                        borderTop: '1px solid rgba(56,189,248,0.2)',
                                        paddingTop: '1rem',
                                    }}>
                                        {/* Header */}
                                        <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: '#38bdf8', marginBottom: '1rem' }}>
                                            🔓 BLUEPRINT COMPLETE — FREQUENCY UNLOCKED
                                        </div>

                                        {/* Two-column: Therapeutic | Counter */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                                            {/* Therapeutic (amplify) */}
                                            <div style={{
                                                background: 'rgba(56,189,248,0.08)',
                                                border: '1px solid rgba(56,189,248,0.3)',
                                                borderRadius: 10, padding: '0.9rem',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: '#38bdf8', marginBottom: 6 }}>THERAPEUTIC ↑</div>
                                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0f9ff', fontFamily: 'monospace' }}>{cf.therapeuticLambdaNm}nm</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{cf.therapeuticFreqTHz} THz · {cf.therapeuticEmBand}</div>
                                                <div style={{ fontSize: '0.62rem', color: '#38bdf8', marginTop: 6, lineHeight: 1.4 }}>Amplifies gene function</div>
                                            </div>

                                            {/* Counter (inhibit / pair) */}
                                            <div style={{
                                                background: 'rgba(168,85,247,0.08)',
                                                border: '1px solid rgba(168,85,247,0.3)',
                                                borderRadius: 10, padding: '0.9rem',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: '#a855f7', marginBottom: 6 }}>COUNTER ↓</div>
                                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0f9ff', fontFamily: 'monospace' }}>{cf.counterLambdaNm}nm</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{cf.counterFreqTHz} THz · {cf.counterEmBand}</div>
                                                {cf.harmonicPairGene && (
                                                    <div style={{ fontSize: '0.62rem', color: '#a855f7', marginTop: 6, lineHeight: 1.4 }}>Φ-pair: <strong>{cf.harmonicPairGene}</strong></div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cosic match description */}
                                        <div style={{
                                            marginTop: '0.75rem', padding: '0.6rem 0.8rem',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                                            fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.5,
                                        }}>
                                            <span style={{ color: '#a855f7', fontWeight: 700 }}>Cosic: </span>{cf.counterCosicMatch}
                                        </div>

                                        {/* CTA to RRM Analyzer */}
                                        <a href='/science/dashboard?domain=health&system=rrm-analyzer' style={{
                                            display: 'block', marginTop: '0.75rem',
                                            padding: '0.7rem', borderRadius: 8, textAlign: 'center',
                                            background: 'rgba(56,189,248,0.12)',
                                            border: '1px solid rgba(56,189,248,0.35)',
                                            color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800,
                                            letterSpacing: '0.1em', textDecoration: 'none',
                                        }}>⚗️ SEND TO RRM ANALYZER →</a>

                                        {/* Dismiss */}
                                        <button onClick={() => setCompletedBlueprintId(null)} style={{
                                            display: 'block', width: '100%', marginTop: '0.5rem',
                                            padding: '0.5rem', borderRadius: 8, textAlign: 'center',
                                            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#475569', fontSize: '0.68rem', cursor: 'pointer',
                                        }}>dismiss</button>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* 3. LAYER 2: BLUEPRINTS SIDEBAR (FLOATING) */}
                <div style={{ 
                    position: 'absolute', 
                    right: '1rem', top: '7rem', // Moved down slightly to accommodate top buttons and band
                    width: '380px', 
                    zIndex: 10, 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxHeight: 'calc(100vh - 120px)',
                    overflowY: 'auto',
                    pointerEvents: 'none', // Allow clicks to pass through empty space
                    paddingBottom: '140px' // Keep Deck button above inventory
                }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', color: '#f8fafc', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                            Active Blueprints
                        </h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {top5ActiveBlueprints.map((bp) => {
                            const pct = Math.round((bp.currentProgress / bp.targetSequence.length) * 100);
                            const isExpanded = activeBlueprintId === bp.id;

                            return (
                                <div key={bp.id} 
                                    onClick={() => setActiveBlueprintId(isExpanded ? null : bp.id)}
                                    style={{ 
                                        background: bp.completed ? `rgba(2, 6, 23, 0.9)` : 'rgba(15, 23, 42, 0.8)', 
                                        backdropFilter: 'blur(8px)',
                                        border: `1px solid ${isExpanded || bp.completed ? bp.themeColor : 'rgba(255,255,255,0.15)'}`, 
                                        borderRadius: '16px', padding: '1.5rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: isExpanded ? `0 10px 25px -5px ${bp.themeColor}50` : '0 10px 15px -3px rgba(0,0,0,0.5)',
                                        pointerEvents: 'auto'
                                    }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', color: bp.completed ? bp.themeColor : '#f8fafc', fontWeight: 800 }}>
                                                {bp.name}
                                            </h3>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: bp.completed ? bp.themeColor : '#cbd5e1', marginLeft: '1rem' }}>
                                            {bp.completed ? 'DONE' : `${pct}%`}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginTop: '0.8rem' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: bp.themeColor, transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Synthesis Yield:</div>
                                            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '1.2rem', fontWeight: 600 }}>{bp.reward}</div>
                                            
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Sequence Requirement:</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {bp.targetSequence.map((reqAASymbol, idx) => {
                                                    const isFilled = idx < bp.currentProgress;
                                                    const isNext = idx === bp.currentProgress;
                                                    
                                                    const aaData = Object.values(aminoAcids).find((a: any) => a.symbol === reqAASymbol) as any;
                                                    const themeColor = aaData?.color_hex || '#94a3b8';

                                                    return (
                                                        <div key={idx} style={{
                                                            width: '60px', height: '85px',
                                                            borderRadius: '8px',
                                                            background: isFilled ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' : (isNext ? 'rgba(30, 41, 59, 0.5)' : 'transparent'),
                                                            border: `2px ${isFilled ? 'solid' : 'dashed'} ${isFilled ? themeColor : (isNext ? themeColor : '#334155')}`,
                                                            color: isFilled ? '#0f172a' : (isNext ? '#f8fafc' : '#475569'),
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: isFilled ? `0 4px 10px ${themeColor}40` : (isNext ? `inset 0 0 15px ${themeColor}20` : 'none'),
                                                            opacity: isFilled ? 1 : (isNext ? 0.8 : 0.4),
                                                            position: 'relative',
                                                            transition: 'all 0.3s'
                                                        }}>
                                                            {isFilled && (
                                                                <div style={{ position: 'absolute', top: '4px', right: '4px', color: themeColor, fontSize: '0.6rem', fontWeight: 900 }}>✓</div>
                                                            )}
                                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.05em', color: isFilled ? '#020617' : (isNext ? '#f8fafc' : '#475569') }}>
                                                                {reqAASymbol}
                                                            </div>
                                                            {isFilled && aaData && (
                                                                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: themeColor, marginTop: '4px' }}>
                                                                    {(aaData.mass || aaData.mass_molar || 0).toFixed(0)}m
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* BOTTOM SECTION: COLLAPSIBLE INVENTORY GRID */}
            <div style={{ 
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 50,
                transform: isLibraryOpen ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {/* Toggle Pull Tab */}
                <div 
                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    style={{
                        width: '200px', height: '40px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        borderTop: '1px solid rgba(255,255,255,0.2)',
                        borderLeft: '1px solid rgba(255,255,255,0.2)',
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '16px 16px 0 0',
                        margin: '0 auto',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        cursor: 'pointer',
                        color: '#f8fafc', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em',
                        boxShadow: '0 -10px 20px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {isLibraryOpen ? '▼ CLOSE LIBRARY' : '▲ OPEN LIBRARY'}
                </div>

                {/* Library Content */}
                <div style={{ 
                    background: 'rgba(2, 6, 23, 0.95)', 
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.1)', 
                    padding: '2rem', 
                    boxShadow: '0 -20px 40px rgba(0,0,0,0.7)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900 }}>
                            Amino Acid Vault
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>20 Canonical Bases + Stop Commands</div>
                    </div>
                    
                    {/* Acquired Horizontal Scrolling Cards */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem',
                        alignItems: 'center',
                        overflowX: 'auto',
                        paddingBottom: '1rem',
                        minHeight: '200px'
                    }}>
                        {Object.values(inventory).filter(card => card.count > 0).length === 0 ? (
                            <div style={{ color: '#475569', fontStyle: 'italic', margin: '0 auto', fontSize: '1rem' }}>
                                Pull the lever to acquire Amino Acids.
                            </div>
                        ) : (
                            Object.values(inventory)
                              .filter(card => card.count > 0)
                              .map((card) => (
                                <div key={card.id} style={{
                                    minWidth: '140px', height: '190px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                                    border: `2px solid ${card.color}`,
                                    borderRadius: '12px', padding: '1rem',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                                    boxShadow: `0 10px 20px -5px rgba(0,0,0,0.5), inset 0 0 10px ${card.color}20`,
                                    position: 'relative',
                                    color: '#0f172a'
                                }}>
                                    {/* Count Badge */}
                                    {card.count > 1 && (
                                        <div style={{
                                            position: 'absolute', top: '-10px', right: '-10px',
                                            background: card.color, color: '#fff',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '1.1rem',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                            border: '2px solid #0f172a'
                                        }}>
                                            {card.count}
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            MASS
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: card.color }}>
                                            {card.mass.toFixed(1)}
                                        </div>
                                    </div>

                                    {/* Huge Center Symbol */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '3rem', color: '#020617', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.05em' }}>
                                            {card.symbol}
                                        </span>
                                    </div>

                                    {/* Card Footer / Name */}
                                    <div style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '0.5rem' }}>
                                        {card.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BlueprintLibraryModal 
                isOpen={isDeckManagerOpen}
                onClose={() => setIsDeckManagerOpen(false)}
                inventory={inventory}
                masterLibrary={[...blueprints, ...hiddenBlueprints]}
                discoveredBlueprintIds={blueprints.map(b => b.id)}
            />

            <style>
                {`
                   @keyframes swipe {
                        0% { left: -100%; }
                        100% { left: 200%; }
                   }
                   @keyframes revealPop {
                        0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                   }
                   @keyframes collectDrop {
                        0% { opacity: 1; transform: translateY(0) scale(1); }
                        40% { opacity: 1; transform: translateY(30px) scale(0.9); }
                        100% { opacity: 0; transform: translateY(300px) scale(0); border-radius: 50px; }
                   }
                   @keyframes fadeIn {
                        0% { opacity: 0; }
                        100% { opacity: 1; }
                   }
                   @keyframes scaleUp {
                        0% { opacity: 0; transform: scale(0.8); }
                        100% { opacity: 1; transform: scale(1); }
                   }
                `}
            </style>
        </div>
    );
};
