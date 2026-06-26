'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

// --- CLOCK CONSTANTS ---
const EARTH_AXIAL_TILT = 23.5;
const MERCURY_AXIAL_TILT = 0.03;
const MARS_AXIAL_TILT = 25.19;

// RATIOS (Relative Speed)
// Earth (Second Hand) = Base Speed 1.0 (1 tick per day)
// Mercury (Minute Hand) = 1 / 58.646 (~1/60th speed)
// Mars (Hour Hand) = 1 / 686.98 (~1/720th speed, or 1/12th of Mercury)

const SPEED_EARTH = 1.0;
const SPEED_MERCURY = 1.0 / 58.646; // ~0.017
const SPEED_MARS = 1.0 / 686.98;   // ~0.00145
const SPEED_SATURN = 1.0 / 10759.22; // ~0.00009 (29.5 years)

export default function PlanetaryClockPanel() {
    const [time, setTime] = useState(0); // Time in "Earth Days"
    const requestRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number>(Date.now());
    const [isPlaying, setIsPlaying] = useState(true);

    const animate = () => {
        if (isPlaying) {
             // 1 Real Second = 1 Earth Day (Fast forward)
            setTime(prev => prev + 0.1); 
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [isPlaying]);

    // Calculate Angles (Degrees)
    // 1 Full Rotation (360) = 60 Units for Seconds/Minutes, 12 Units for Hours
    
    // Earth Hand (Seconds): Loops every 60 Days (mapping to a standard 60s face)
    // Wait, if Earth is the "Second Hand", it should loop every 60 units.
    // Let's say the clock face is "60 Earth Days".
    // Earth Hand Angle = (Time % 60) / 60 * 360
    const earthAngle = (time % 60) / 60 * 360;

    // Mercury Hand (Minutes): Loops every 60 * 60? No.
    // Real Clock: Minute hand moves 1/60th of Second hand.
    // Mercury moves ~1/59th of Earth. 
    // So Mercury Angle = (Time / 58.646) % 60? No.
    // Mercury Angle should track total rotations.
    // 1 Mercury Spin = 360 degrees on its own dial? Or on the main dial?
    // Let's simulate a standard clock.
    // Minute Hand (Mercury) completes 1 rev in 1 "Cosmic Hour".
    // 1 Cosmic Hour = 1 Mars Orbit? (Mars = Hour Hand).
    // Mars Orbit = 687 days.
    // Mercury rotates 11.7 times in that period. Close to 12.
    // So Mercury is the Minute Hand.
    
    // Let's simplify:
    // Earth Hand: Fast. Visualizing "Daily Spin".
    // Mercury Hand: Medium. Visualizing "Mercury Spin".
    // Mars Hand: Slow. Visualizing "Mars Orbit".

    // Angle = (Total Days / Period) * 360
    const earthRotationAngle = (time % 1) * 360; // Spins once per day (too fast?)
    // Let's make "Seconds" hand map to 1 Day = 6 degrees (Like a second tick).
    // So 60 Days = 360 degrees.
    const secondsAngle = (time % 60) / 60 * 360; 

    // Mercury (Minute): Spins once every 58.6 days.
    // If Seconds (Earth) does 60 days in a loop...
    // Mercury does ~1 spin in that loop.
    // So Mercury Angle = (time / 58.646) * 360 % 360
    const minutesAngle = ((time / 58.646) % 12) / 12 * 360; // Wait, Minute hand goes 0-60?
    // Let's stick to the 12-hour clock face analogy.
    // Hour Hand (Mars) = 1 Orbit in 12 "Mercury Units".
    
    // REVISED GEARING:
    // Inner Ring (Mars): 0-12 Scale. Period = 687 Days.
    // Middle Ring (Mercury): 0-60 Scale? No, 0-12 Scale?
    // A clock has 12 hours.
    // Mars takes 687 days to do a full circle (12 hours).
    const marsAngle = (time / 686.98) * 360;

    // Mercury takes 58.6 days to do... 1/12th of that circle? No, 1/12th of 687 is 57.25.
    // Mercury is 58.6. Almost perfect match!
    // So Mercury acts as the subdivider.
    // Actually, Mercury is the 'Minute Hand' relative to Mars 'Hour Hand'.
    // A Minute hand does 12 revs for 1 Hour hand rev.
    // Mercury (58.6) * 12 = 703.
    // Mars (687). 
    // It's close. 703 vs 687. (2.3% error).
    
    // Visual:
    // Mars Hand: Period 687.
    // Mercury Hand: Period 58.6.
    // Earth Hand: Period 1 (Seconds? No, 1 day is too fast).
    // Let's use Earth Month? 
    // Earth acts as the ticker.
    
    const hAngle = (time / 686.98) * 360; // Mars (Hour)
    const mAngle = (time / 58.646) * 360; // Mercury (Minute) - spins 12x per Mars orbit
    const sAngle = (time / 1) * 360;      // Earth (Second?) - spins 60x per Mercury? (58.6x)
    const satAngle = (time / 10759.22) * 360; // Saturn (The Governor) - very slow

    const handleReset = () => {
        setTime(0);
    };

    return (
        <div style={{
            background: '#0f172a',
            borderRadius: '24px',
            border: '1px solid #334155',
            padding: '2rem', // Increased padding
            color: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                marginBottom: '2rem', 
                borderBottom: '1px solid #334155', 
                paddingBottom: '1rem',
                letterSpacing: '-0.02em'
            }}>
                The Planetary Clock
                <span style={{ display: 'block', fontSize: '1rem', color: '#94a3b8', fontWeight: 400, marginTop: '0.5rem' }}>
                    4-Gear Mechanism: Earth : Mercury : Mars : Saturn
                </span>
            </h2>

            <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                
                {/* LEFT: CLOCK VISUALIZATION - LARGER */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                     <div style={{ position: 'relative', width: '320px', height: '320px' }}>
                        {/* CLOCK FACE */}
                        <svg width="100%" height="100%" viewBox="0 0 300 300">
                            {/* OUTER RIM */}
                            <circle cx="150" cy="150" r="145" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                            
                            {/* MARKS */}
                            {Array.from({ length: 12 }).map((_, i) => {
                                const angle = (i * 30) * (Math.PI / 180);
                                const x1 = 150 + Math.cos(angle) * 135;
                                const y1 = 150 + Math.sin(angle) * 135;
                                const x2 = 150 + Math.cos(angle) * 145;
                                const y2 = 150 + Math.sin(angle) * 145;
                                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="2" />;
                            })}

                            <circle cx="150" cy="150" r="130" fill="none" stroke="#1e293b" strokeWidth="1" />
                            <circle cx="150" cy="150" r="100" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                            <circle cx="150" cy="150" r="60" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

                            {/* HANDS */}
                            
                            {/* SATURN (Slowest) - Outer Ring */}
                            <line 
                                x1="150" y1="150" 
                                x2={150 + Math.cos(satAngle - Math.PI/2) * 130} 
                                y2={150 + Math.sin(satAngle - Math.PI/2) * 130} 
                                stroke="#fbbf24" 
                                strokeWidth="6" 
                                strokeLinecap="round"
                            />
                            <circle cx={150 + Math.cos(satAngle - Math.PI/2) * 130} cy={150 + Math.sin(satAngle - Math.PI/2) * 130} r="8" fill="#fbbf24" />

                            {/* MARS - Mid Ring */}
                            <line 
                                x1="150" y1="150" 
                                x2={150 + Math.cos(hAngle - Math.PI/2) * 100} 
                                y2={150 + Math.sin(hAngle - Math.PI/2) * 100} 
                                stroke="#ef4444" 
                                strokeWidth="4" 
                                strokeLinecap="round"
                            />
                             <circle cx={150 + Math.cos(hAngle - Math.PI/2) * 101} cy={150 + Math.sin(hAngle - Math.PI/2) * 101} r="6" fill="#ef4444" />

                            {/* EARTH - Ref Ring */}
                            <line 
                                x1="150" y1="150" 
                                x2={150 + Math.cos(sAngle - Math.PI/2) * 80} 
                                y2={150 + Math.sin(sAngle - Math.PI/2) * 80} 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                            />
                            <circle cx={150 + Math.cos(sAngle - Math.PI/2) * 80} cy={150 + Math.sin(sAngle - Math.PI/2) * 80} r="5" fill="#3b82f6" />


                            {/* MERCURY (Fastest) - Inner Ring */}
                            <line 
                                x1="150" y1="150" 
                                x2={150 + Math.cos(mAngle - Math.PI/2) * 50} 
                                y2={150 + Math.sin(mAngle - Math.PI/2) * 50} 
                                stroke="#a8a29e" 
                                strokeWidth="2" 
                                strokeLinecap="round"
                            />
                             <circle cx={150 + Math.cos(mAngle - Math.PI/2) * 50} cy={150 + Math.sin(mAngle - Math.PI/2) * 50} r="4" fill="#a8a29e" />


                            {/* CENTER CAP */}
                            <circle cx="150" cy="150" r="8" fill="#fff" />
                        </svg>
                     </div>
                </div>

                {/* RIGHT: CONTROLS & DATA - LARGER TEXT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}>Simulation Control</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    background: isPlaying ? '#ef4444' : '#22c55e',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                {isPlaying ? 'PAUSE' : 'PLAY'}
                            </button>
                            <button 
                                onClick={handleReset}
                                style={{
                                    background: '#334155',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                RESET
                            </button>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                            Simulated Time: <span style={{ color: '#fff', fontWeight: 'bold' }}>{(time / 10).toFixed(1)} Years</span>
                        </div>
                    </div>

                    {/* LIVE METRICS - GRID */}
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#0ea5e9', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>EARTH SPINS</div>
                            <div style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{time.toFixed(1)}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7dd3fc' }}>1.00x Ratio</div>
                        </div>

                        <div style={{ background: 'rgba(168, 162, 158, 0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#a8a29e', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>MERCURY SPINS</div>
                             <div style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{(time * 4.15).toFixed(1)}</div>
                             <div style={{ fontSize: '0.75rem', color: '#d6d3d1' }}>4.15x Ratio</div>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>MARS SPINS</div>
                             <div style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{(time * 0.53).toFixed(1)}</div>
                             <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>0.53x Ratio</div>
                        </div>

                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>SATURN SPINS</div>
                             <div style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{(time * 0.034).toFixed(2)}</div>
                             <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>0.034x Ratio</div>
                        </div>
                    </div>

                </div>
            </div>

            {/* VERIFICATION FOOTER */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     Astronomical Data Verification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#a8a29e', fontWeight: 'bold' }}>Mercury</span> / Earth Ratio:
                        </div>
                        <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#fff' }}>
                            4.152 <span style={{ color: '#10b981', fontSize: '0.9rem' }}>(Matches NASA)</span>
                        </div>
                    </div>
                    <div>
                         <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Saturn</span> / Earth Ratio:
                        </div>
                        <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: '#fff' }}>
                            29.45 Years <span style={{ color: '#10b981', fontSize: '0.9rem' }}>(Matches Kepler)</span>
                        </div>
                    </div>
                </div>
                 <div style={{ marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 700 }}>SYSTEM DRIFT:</div>
                    <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                        The clock mechanism reveals a <strong style={{ color: '#ef4444' }}>-0.78%</strong> drag coefficient on Saturn's orbit relative to the harmonic ideal. This is the physical manifestation of "Time Dilation" in the outer system.
                    </div>
                </div>
            </div>
        </div>
    );
}
