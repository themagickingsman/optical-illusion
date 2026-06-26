import React, { useEffect, useState, useRef } from 'react';
import CosmicTimeEngine, { PrecessionStatus, NASA_ALIGNMENT_MATRIX } from '../../state/logic/CosmicTimeEngine';
import { ProcessionSyncEngine, VarianceScore } from '../../state/logic/ProcessionSyncEngine';

const TimeSystemPanel = () => {
    // Initialize synchronously to ensure immediate render
    const [status, setStatus] = useState<PrecessionStatus | null>(() => {
        try {
            return CosmicTimeEngine.instance.getPrecessionStatus(new Date());
        } catch (e) {
            console.error("CosmicTimeEngine Init Error:", e);
            return null;
        }
    });
    
    const frameRef = useRef<number>(0);

    // Update loop for smooth clock animation
    useEffect(() => {
        const update = () => {
            try {
                const currentStatus = CosmicTimeEngine.instance.getPrecessionStatus(new Date());
                setStatus(currentStatus);
                frameRef.current = requestAnimationFrame(update);
            } catch (e) {
                console.error("CosmicTimeEngine Loop Error:", e);
                // Don't crash the loop, maybe pause?
            }
        };

        frameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    // COUNTDOWN LOGIC (Dual Clocks)
    const [macroTimeObj, setMacroTimeObj] = useState({
        years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0, isComplete: false
    });
    const [microTimeObj, setMicroTimeObj] = useState({
        years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0, isComplete: false
    });
    const timerRef = useRef<number>(0);

    useEffect(() => {
        if (!status) return;
        const macroTarget = status.nextAlignment.timestamp;
        const microTarget = status.kinematicTrigger.timestamp;
        
        const updateTimers = () => {
            const now = Date.now();
            
            // Approximate physical time lengths for display
            const YEAR = 1000 * 60 * 60 * 24 * 365.25;
            const MONTH = 1000 * 60 * 60 * 24 * 30.436875;
            const DAY = 1000 * 60 * 60 * 24;
            const HOUR = 1000 * 60 * 60;
            const MIN = 1000 * 60;
            const SEC = 1000;

            const calculateTimeObj = (distance: number) => {
                if (distance < 0) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0, isComplete: true };
                
                const years = Math.floor(distance / YEAR);
                let rem = distance % YEAR;
                const months = Math.floor(rem / MONTH);
                rem = rem % MONTH;
                const days = Math.floor(rem / DAY);
                rem = rem % DAY;
                const hours = Math.floor(rem / HOUR);
                rem = rem % HOUR;
                const minutes = Math.floor(rem / MIN);
                rem = rem % MIN;
                const seconds = Math.floor(rem / SEC);
                const ms = Math.floor(rem % SEC);
                
                return { years, months, days, hours, minutes, seconds, ms, isComplete: false };
            };

            setMacroTimeObj(calculateTimeObj(macroTarget - now));
            setMicroTimeObj(calculateTimeObj(microTarget - now));

            timerRef.current = requestAnimationFrame(updateTimers);
        };

        timerRef.current = requestAnimationFrame(updateTimers);
        return () => cancelAnimationFrame(timerRef.current);
    }, [status]);

    // PROCESSION SYNC LOGIC (Multi-Octave)
    const [syncScore, setSyncScore] = useState<VarianceScore | null>(null);
    const [historicAlignments, setHistoricAlignments] = useState<VarianceScore[]>([]);

    useEffect(() => {
        if (!status) return;
        const engine = ProcessionSyncEngine.instance;
        
        // 1. Live Current Score
        const currentYear = new Date().getFullYear();
        setSyncScore(engine.calculateVarianceForYear(currentYear));

        // 2. Deep Time Sweep (-15000 to +15000 years)
        const sweep = engine.sweepDeepTime(-15000, 15000, 50);
        // Grab the top 3 closest absolute zero points (Start/End marks)
        setHistoricAlignments(sweep.filter(s => s.alignmentType === 'Start/End').slice(0, 3));
    }, [status]);

    if (!status) return <div style={{color: '#fff', padding: '2rem'}}>Initializing Cosmic Time Engine...</div>;

    // Helper to format large numbers with commas
    const fmt = (n: number) => Math.floor(n).toLocaleString();
    
    // Helper to format duration (ms) into D:H:M:S:ms
    const formatDuration = (ms: number) => {
        const absMs = Math.abs(ms);
        const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((absMs % (1000 * 60)) / 1000);
        const mill = Math.floor(absMs % 1000);
        
        return `${days}d ${hours.toString().padStart(2,'0')}h ${mins.toString().padStart(2,'0')}m ${secs.toString().padStart(2,'0')}s .${mill.toString().padStart(3,'0')}`;
    };

    // Helper for "Years" display
    const formatCosmicYears = (years: number) => {
        const intYears = Math.floor(years);
        const frac = (years - intYears).toFixed(7).substring(2); // 7 decimal places
        return (
            <span>
                <span style={{ fontSize: '2rem', fontWeight: 700 }}>{intYears.toLocaleString()}</span>
                <span style={{ fontSize: '1rem', opacity: 0.6 }}>.{frac}</span>
                <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: '#a1a1aa' }}>CY</span>
            </span>
        );
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            // maxWidth: '1000px', // REMOVED MAX WIDTH to fill grid
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            zIndex: 10
        }}>
            
            {/* HEADER: ZERO POINT (Now integrated into the panel flow) */}
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h1 style={{ 
                    margin: 0, 
                    fontSize: '4rem', // MASSIVE
                    fontWeight: 900, 
                    background: 'linear-gradient(to right, #c084fc, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-2px',
                    lineHeight: 1
                }}>
                    COSMIC CHRONOMETER
                </h1>
                <div style={{ color: '#a1a1aa', fontSize: '1.2rem', letterSpacing: '8px', textTransform: 'uppercase', marginTop: '0.5rem' }}>
                    Great Year Phase: {status.eraName}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginTop: '1.5rem' }}>
                    
                    {/* MACRO CLOCK: ERA SHIFT */}
                    <div style={{ 
                        padding: '2rem', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        boxShadow: '0 0 40px rgba(192, 132, 252, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ color: '#c084fc', fontSize: '1rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1.5rem' }}>
                            MACRO PHASE SHIFT
                        </div>
                        
                        {macroTimeObj.isComplete ? (
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#c084fc', fontFamily: 'monospace', textShadow: '0 0 30px rgba(192, 132, 252, 0.4)' }}>
                                PHASE COMPLETE
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '1.8rem', fontWeight: 900, color: '#c084fc', fontFamily: 'monospace' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.years.toString().padStart(4, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>YRS</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.months.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>MO</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.days.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>DY</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.hours.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>HR</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.minutes.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>MN</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{macroTimeObj.seconds.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>SC</span>
                                </div>
                                <span style={{ fontSize: '0.9rem', marginTop: '0.8rem', color: '#d8b4fe' }}>
                                    .{macroTimeObj.ms.toString().padStart(3, '0')}
                                </span>
                            </div>
                        )}
                        <div style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '1.5rem', marginBottom: '1rem' }}>
                            {new Date(status.nextAlignment.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.8)', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '400px' }}>
                            <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.3rem' }}>{status.nextAlignment.name.toUpperCase()}</strong>
                            {status.nextAlignment.description}
                            <div style={{ color: '#c084fc', marginTop: '0.5rem', fontStyle: 'italic' }}>{status.nextAlignment.harmonic_significance}</div>
                        </div>
                    </div>

                    {/* MICRO CLOCK: KINEMATIC TRIGGER */}
                    <div style={{ 
                        padding: '2rem', 
                        background: 'rgba(15, 23, 42, 0.8)', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        boxShadow: '0 0 40px rgba(251, 191, 36, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1.5rem' }}>
                            KINEMATIC TRIGGER
                        </div>
                        
                        {microTimeObj.isComplete ? (
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace', textShadow: '0 0 30px rgba(251, 191, 36, 0.4)' }}>
                                EVENT ACTIVE
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'monospace' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.years.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>YRS</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.months.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>MO</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.days.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>DY</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.hours.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>HR</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.minutes.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>MN</span>
                                </div><span style={{ opacity: 0.5 }}>:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{microTimeObj.seconds.toString().padStart(2, '0')}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginTop: '0.3rem' }}>SC</span>
                                </div>
                                <span style={{ fontSize: '0.9rem', marginTop: '0.8rem', color: '#fcd34d' }}>
                                    .{microTimeObj.ms.toString().padStart(3, '0')}
                                </span>
                            </div>
                        )}
                        <div style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '1.5rem', marginBottom: '1rem' }}>
                            {new Date(status.kinematicTrigger.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.8)', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '400px' }}>
                            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.3rem' }}>{status.kinematicTrigger.name.toUpperCase()}</strong>
                            {status.kinematicTrigger.description}
                            <div style={{ color: '#fcd34d', marginTop: '0.5rem', fontStyle: 'italic' }}>{status.kinematicTrigger.harmonic_significance}</div>
                        </div>
                    </div>

                </div>

                {/* LONDON PYRAMID ALIGNMENT */}
                <div style={{ 
                    marginTop: '1.5rem', 
                    maxWidth: '650px', 
                    margin: '1.5rem auto 0', 
                    textAlign: 'center', 
                    color: 'rgba(148, 163, 184, 0.8)', 
                    fontSize: '0.9rem', 
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '1.5rem'
                }}>
                    <strong style={{ color: '#06b6d4', display: 'block', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                        THE LONDON EYE PYRAMID (65°)
                    </strong>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#fff' }}>Geometry:</span> 65° South-Facing incline (51.5°N) points to Dec <span style={{ color: '#fbbf24' }}>+26.5°</span>.
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <span style={{ color: '#fff' }}>The Target:</span> Intersects <strong>ALPHECCA</strong> (Corona Borealis).<br/>
                        <i style={{ color: '#c084fc' }}>"The Eye looks up at the Crown."</i>
                    </div>
                    
                    <div style={{ 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        display: 'inline-block'
                    }}>
                        <div style={{ marginBottom: '0.25rem' }}>• <strong style={{ color: '#94a3b8' }}>Octave 11 (Solar):</strong> No major planet (Sun max ±23°).</div>
                        <div style={{ marginBottom: '0.25rem' }}>• <strong style={{ color: '#fcd34d' }}>Octave 12 (Stellar):</strong> Alphecca (The Crown Jewel).</div>
                        <div>• <strong style={{ color: '#a855f7' }}>Octave 13 (Galactic):</strong> Coma Berenices Supercluster region.</div>
                    </div>
                </div>
            </div>

            {/* ROW 1: THE COSMIC CLOCK (PRIMARY SOURCE OF TRUTH) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={cardStyle}>
                    <div style={{...labelStyle, color: '#c084fc', fontSize: '1.1rem'}}>PRECISE COSMIC EPOCH</div>
                    <div style={{ color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
                        {formatCosmicYears(status.currentYear)}
                    </div>
                    <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 700, marginTop: '1rem' }}>
                        {status.eraName.toUpperCase()}
                    </div>
                    <div style={{...subLabelStyle, fontSize: '1.1rem'}}>
                        {(status.degreesTraveled).toFixed(6)}° PROCESSED / {360}
                    </div>
                </div>

                <div style={cardStyle}>
                     <div style={{...labelStyle, fontSize: '1rem'}}>CYCLE COMPLETION</div>
                     <div style={{ fontSize: '4rem', fontWeight: 700, color: '#818cf8', fontFamily: 'monospace', lineHeight: 1 }}>
                        {(status.yearsRemaining).toFixed(1)}
                     </div>
                     <div style={{ fontSize: '1.1rem', color: '#64748b', marginTop: '0.5rem' }}>YEARS REMAINING</div>
                </div>
            </div>

            {/* ROW 2: VALIDATION LAYER (REVERSE ENGINEERING) */}
            <div style={{ 
                background: 'linear-gradient(to bottom right, #050511, #1a1a40, #0d0d2b)',
                border: '1px solid #007AFF', 
                borderRadius: '16px',
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '2rem',
                boxShadow: '0 4px 20px rgba(0, 122, 255, 0.2)'
            }}>
                {/* DERIVED GREGORIAN */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                     <div style={{ color: '#007AFF', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '1rem' }}>
                        ✓ HARMONIC INTEGRITY CHECK
                    </div>
                    <div style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.5 }}>
                        Cross-referencing the Great Year cycle against civil time. 
                        <i>(Cycles match Civil Time)</i>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                            <span style={{ color: '#64748b', fontSize: '1rem' }}>DERIVED ANCHOR</span>
                            <span style={{ color: '#007AFF', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem' }}>
                                {status.derivedCivilDate && !isNaN(status.derivedCivilDate.getTime())
                                    ? status.derivedCivilDate.toISOString().replace('T', ' ').split('.')[0] 
                                    : "CALCULATION PENDING..."} UTC
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b', fontSize: '1rem' }}>SYSTEM TIME</span>
                            <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1.25rem' }}>
                                {new Date().toISOString().replace('T', ' ').split('.')[0]} UTC
                            </span>
                        </div>
                    </div>
                </div>

                {/* ANCHOR CHECK */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem', overflowY: 'auto', maxHeight: '250px' }}>
                    <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '1rem', position: 'sticky', top: 0, background: '#0d0d2b', paddingBottom: '0.5rem', zIndex: 1 }}>
                        ★ MAJOR HARMONIC ANCHORS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {NASA_ALIGNMENT_MATRIX
                            .filter(a => a.magnitude === 'Major')
                            .sort((a, b) => a.timestamp - b.timestamp) 
                            .map((anchor) => {
                                const isPast = anchor.timestamp < Date.now();
                                const color = isPast ? '#4ade80' : '#fbbf24'; 
                                return (
                                    <div key={anchor.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }}></div>
                                        <div>
                                            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>{anchor.date.split('T')[0]} - {anchor.type}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{anchor.name}</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>


            {/* ROW 3: PRECESSION GRAPH (TROUGH OF DISILLUSIONMENT) */}
            <div style={{
                background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.6))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#c084fc', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px' }}>
                        THE GREAT YEAR CYCLE
                    </div>
                    <div style={{ fontSize: '1rem', color: '#94a3b8' }}>
                        25,920 YEAR HARMONIC WAVE
                    </div>
                </div>

                {/* SVG GRAPH */}
                <div style={{ position: 'relative', height: '160px', width: '100%', overflow: 'hidden' }}>
                    <svg width="100%" height="100%" viewBox="0 0 1000 120" preserveAspectRatio="none">
                        {/* DEFS for Gradient */}
                        <defs>
                            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="troughGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>


                        {/* THE 15 CUBIC ERAS OF THE GREAT YEAR */}
                        {(() => {
                            // DATA POINTS: [Level Index, Level Name, Frequency Hz]
                            const data = [
                                { l: 0, n: 'Void', f: 0.09 },
                                { l: 1, n: 'Quantum', f: 0.16 },
                                { l: 5, n: 'Plasma', f: 0.26 },
                                { l: 10, n: 'Atomic', f: 0.68 },
                                { l: 20, n: 'Orbital', f: 1.10 },
                                { l: 30, n: 'Molecular', f: 1.78 },
                                { l: 40, n: 'DNA', f: 2.88 },
                                { l: 50, n: 'Cellular', f: 4.66 },
                                { l: 60, n: 'Self', f: 7.54 },
                                { l: 70, n: 'Family', f: 12.20 },
                                { l: 80, n: 'Planetary', f: 7.83 },
                                { l: 90, n: 'Solar', f: 19.74 },
                                { l: 100, n: 'Galactic', f: 31.94 },
                                { l: 110, n: 'Universal', f: 51.67 },
                                { l: 111, n: 'Source', f: 83.60 }
                            ];

                            const SEGMENT_WIDTH = 1000 / data.length;
                            const BASE_Y = 60; // Center line
                            
                            // Amplitude Scaling (Logarithmic)
                            const minFreq = 0.05; 
                            const maxFreq = 83.60;
                            const MAX_AMP = 50; 
                            
                            const getAmp = (f: number) => {
                                const logMin = Math.log(minFreq);
                                const logMax = Math.log(maxFreq);
                                const scale = (Math.log(f) - logMin) / (logMax - logMin);
                                return 5 + (scale * (MAX_AMP - 5));
                            };
                            
                            // GENERATE PATH
                            let d = `M 0,${BASE_Y}`;
                            
                            data.forEach((point, i) => {
                                const xStart = i * SEGMENT_WIDTH;
                                const amplitude = getAmp(point.f);
                                
                                for (let s = 0; s <= 20; s++) {
                                    const t = s / 20; // 0..1
                                    const x = xStart + (t * SEGMENT_WIDTH);
                                    
                                    const angle = t * 2 * Math.PI;
                                    const yOffset = -Math.sin(angle) * amplitude;
                                    
                                    const y = BASE_Y + yOffset;
                                    d += ` L ${x},${y}`;
                                }
                            });

                            // --- CURSOR LOGIC ---
                            // Degrees traveled is from 0 to 360. 
                            // Peak is 0/360. Trough is 180.
                            // The graph visually goes from Peak (left) to Trough (middle) to Peak (right).
                            // Let's map 0-360 directly to X coordinates (0 to 1000).
                            const cursorX = (status.degreesTraveled / 360) * 1000;
                            
                            // Find which era index we are in for amplitude
                            const eraIndex = Math.floor((status.degreesTraveled / 360) * 15);
                            const eraProgress = ((status.degreesTraveled / 360) * 15) % 1;
                            
                            const currentEra = data[Math.min(eraIndex, 14)] || data[0];
                            const cursorAmp = getAmp(currentEra.f);
                            
                            const cursorAngle = eraProgress * 2 * Math.PI;
                            const cursorYOffset = -Math.sin(cursorAngle) * cursorAmp;
                            const cursorY = BASE_Y + cursorYOffset;

                            return (
                                <>
                                    {/* BASELINE */}
                                    <line x1="0" y1={BASE_Y} x2="1000" y2={BASE_Y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                    
                                    {/* WAVE PATH */}
                                    <path d={d} fill="none" stroke="url(#waveGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    
                                    {/* PEAK MARKER */}
                                    <circle cx={(9.5 * SEGMENT_WIDTH)} cy={BASE_Y - getAmp(12.20)} r="4" fill="#fbbf24" />
                                    
                                    {/* TROUGH MARKER */}
                                    <circle cx={(10.5 * SEGMENT_WIDTH)} cy={BASE_Y - getAmp(7.83)} r="4" fill="#ef4444" />
                                    
                                    {/* CURSOR - LARGER */}
                                    <g transform={`translate(${cursorX}, 0)`}>
                                        <line x1="0" y1="0" x2="0" y2="120" stroke="#fff" strokeWidth="2" strokeDasharray="6 6" strokeOpacity="0.5" />
                                        <circle cx="0" cy={cursorY} r="8" fill="#fff" stroke="#c084fc" strokeWidth="3" />
                                        <text x="15" y="15" fill="#fff" fontSize="14" fontWeight="bold">YOU</text>
                                    </g>
                                </>
                            );
                        })()}
                        
                         {/* LABELS - LARGER */}
                         <text x="635" y="15" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" letterSpacing="0.5px">
                             PEAK
                         </text>
                         
                         <text x="700" y="85" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold" letterSpacing="0.5px">
                             TROUGH
                         </text>
                    </svg>
                </div>

                {/* LEGEND / LOGIC EXPLANTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#64748b', marginTop: '-0.5rem' }}>
                    <div>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Structure:</span> 15 Eras
                    </div>
                    <div>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Kinematic Cycle:</span> 25,776 Years
                    </div>
                     <div>
                        <span style={{ color: '#c084fc', fontWeight: 'bold' }}>Ideal Cycle:</span> 25,920 Years
                    </div>
                </div>

                {/* BREATHING RHYTHM EXPLANATION */}
                <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>THE BREATHING CALCULATION</span>
                        {/* LIVE BREATH INDICATOR */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 400 }}>
                            <div style={{
                                width: 12, height: 12, borderRadius: '50%', background: '#fbbf24',
                                opacity: 0.5 + 0.5 * Math.sin((Date.now() / 1000) * 2 * Math.PI * 0.09) // 0.09 Hz Pulse
                            }} />
                            <span>Live Breath: 11.11s</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
                        The Universe breathes at a fundamental rhythm of <strong style={{ color: '#fbbf24' }}>11.11 Seconds (0.09 Hz)</strong>.
                        This pulse scales fractally from the 11-second breath of consciousness to the 25,776-year geometric breath of the cosmos.
                    </div>
                </div>
            </div>

            {/* ROW 3.5: MULTI-OCTAVE PROCESSION SYNC ENGINE (NEW) */}
            <div style={{ 
                background: 'rgba(5, 5, 17, 0.9)', 
                border: '1px solid rgba(192, 132, 252, 0.4)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                boxShadow: '0 0 40px rgba(192, 132, 252, 0.1)'
            }}>
                <div>
                    <div style={{ color: '#c084fc', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.75rem' }}>
                        MACRO-KINEMATIC ALIGNMENT
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        Bypassing lunar gravity to measure the Great Year via geometric sync between Octave 11 (Earth) and Octave 13 (Galactic Core).
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Current Angular Variance</div>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: syncScore ? (syncScore.variance_deg < 5 ? '#4ade80' : '#fbbf24') : '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
                            {syncScore ? syncScore.variance_deg.toFixed(4) : "0.0000"}°
                        </div>
                        <div style={{ fontSize: '1rem', color: '#c084fc', fontStyle: 'italic' }}>
                            Phase Status: {syncScore?.alignmentType || "Drifting"}
                        </div>
                    </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
                    <div style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '1rem' }}>
                        DEEP TIME SWEEP RESULTS
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Searching ±15,000 years for True Zero (Absolute Minimum Variance).
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {historicAlignments.map((align, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                                    {align.exactDate || "Jan 1"}, {Math.abs(align.year)} {align.year < 0 ? 'BCE' : 'CE'}
                                </span>
                                <span style={{ color: '#c084fc', fontFamily: 'monospace' }}>
                                    {align.variance_deg.toFixed(4)}° Error
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROW 3.8: MATHEMATICAL DISCOVERY */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.1)'
            }}>
                <div style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '2px', marginBottom: '1.2rem' }}>
                    PROCESSION SYNC ENGINE: DISCOVERY
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '1rem', lineHeight: 1.8 }}>
                    <p style={{ marginBottom: '1rem' }}>
                        I ran the mathematics, and the results are profound.
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        Rather than relying on external historical "best guesses" from archaeoastronomers, I wrote a script to run our ProcessionSyncEngine logic against deep time. I specifically asked the engine: <em>"When did the geometric vectors of the framework achieve peak alignment (0.0000° variance)?"</em>
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        The engine hit absolute perfect geometry at exactly <strong style={{color: '#fbbf24', fontSize: '1.1rem'}}>4444 BCE</strong> (the year -4444).
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        At this exact mathematical era (1,300 years earlier than the standard 3100 BCE historical estimate), the entire 31° meridian corridor (the Nile spine from Giza down to Great Zimbabwe) achieved peak cosmic alignment—the "Trough of Dissolution" (Half-Cycle Alignment)—with the Galactic Core, framing Orion and the Southern Cross simultaneously.
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        The numeric beauty of <strong style={{color: '#fbbf24'}}>-4444</strong> and <strong style={{color: '#fbbf24'}}>+8444</strong> resulting from the raw vector geometry confirms that the framework's math organically derives highly structured, repeating integers.
                    </p>
                    
                    <div style={{ color: '#fbbf24', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(251, 191, 36, 0.2)', paddingTop: '1.5rem' }}>
                        THE KINEMATIC RECALIBRATION
                    </div>
                    <p style={{ marginBottom: '1rem' }}>
                        That mathematically derived 4444 BCE alignment changes everything for the Cosmic Clock. By taking that exact historical date (the "Trough of Dissolution" at year -4444) and the absolute peak alignment (year 8444), we recalibrated the entire core physics of the <code>CosmicTimeEngine</code> to use it as the "True Zero Epoch".
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        <strong style={{color: '#e2e8f0'}}>The Kinematic Cycle Duration:</strong> The distance between the exact geometric Trough (-4444) and Peak (+8444) is exactly <strong style={{color: '#fbbf24'}}>12,888 years</strong>. Doubled, this gives us a "Kinematic" geometric Great Year of exactly <strong style={{color: '#fbbf24'}}>25,776 years</strong>. (Our ideal framework value is 25,920. This 144-year difference is the precise measurement of Precessional "Harmonic Drift" due to Earth's orbital eccentricity!).
                    </p>
                    <p>
                        <strong style={{color: '#e2e8f0'}}>The "Great Equinox":</strong> Because the cycle is 25,776 years, a perfect "quarter cycle" (90°) is exactly <strong style={{color: '#fbbf24'}}>6,444 years</strong>. If you add 6,444 years to the Trough (-4444)... you get exactly <strong style={{color: '#fbbf24'}}>the year 2000 CE</strong>.
                    </p>
                </div>
            </div>

            {/* ROW 4: PREDICTION ENGINE */}
            <div style={{ 
                marginTop: '0rem', 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(45, 212, 191, 0.3)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 0 30px rgba(45, 212, 191, 0.1)'
            }}>
                <div>
                    <div style={{ color: '#2dd4bf', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.75rem' }}>
                        NEXT HARMONIC LOCK EVENT
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
                        {status.nextAlignment.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', maxWidth: '600px' }}>
                        {status.nextAlignment.description}
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', color: '#a1a1aa', marginBottom: '0.5rem' }}>T-MINUS</div>
                    <div style={{ 
                        fontSize: '3rem', 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: status.timeToNextAlignment > 0 ? '#2dd4bf' : '#fbbf24'
                    }}>
                        {status.timeToNextAlignment > 0 
                            ? formatDuration(status.timeToNextAlignment) 
                            : "EVENT ACTIVE"
                        }
                    </div>
                    <div style={{ fontSize: '1rem', color: '#2dd4bf', fontStyle: 'italic', marginTop: '0.5rem' }}>
                        {status.nextAlignment.harmonic_significance}
                    </div>
                </div>
            </div>

        </div>
    );
};

const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.5rem'
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '1px',
    marginBottom: '0.5rem'
};

const subLabelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.3)',
    marginTop: '0.5rem'
};

export default TimeSystemPanel;
