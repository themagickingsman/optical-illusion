'use client';

import React from 'react';

export default function TimeDeltaPanel() {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid #38bdf8',
            borderRadius: '24px',
            padding: '2rem',
            color: '#e2e8f0',
            fontFamily: '"Inter", sans-serif',
            position: 'relative',
            overflow: 'hidden',
             boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
            {/* AMBIENT GLOW */}
             <div style={{
                position: 'absolute', top: '-50%', right: '-20%', width: '70%', height: '200%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                filter: 'blur(80px)', zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                
                {/* LEFT SIDE: METRICS */}
                <div>
                     <div style={{ 
                        borderBottom: '1px solid rgba(56, 189, 248, 0.3)', 
                        paddingBottom: '1rem', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
                            PRECISION TIME DELTA
                        </div>
                        <div style={{ fontSize: '2rem' }}>⏳</div>
                    </div>

                    <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                        From <strong style={{ color: '#e2e8f0' }}>April 8, 2024</strong> (Anchor) to <strong style={{ color: '#e2e8f0' }}>March 21, 2500 BC</strong> (Sirius/Orion Lock):
                    </div>

                    <div style={{ 
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' 
                    }}>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>4,523</div>
                            <div style={{ fontSize: '0.9rem', color: '#38bdf8', marginTop: '0.5rem', fontWeight: 700, letterSpacing: '0.1em' }}>YEARS</div>
                        </div>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>21</div>
                            <div style={{ fontSize: '0.9rem', color: '#38bdf8', marginTop: '0.5rem', fontWeight: 700, letterSpacing: '0.1em' }}>DAYS</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: ANALYSIS */}
                <div>
                    <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <span>Cycle Scale:</span>
                            <div>
                                <strong style={{ color: '#fff', fontSize: '1.5rem' }}>0.1745</strong> <span style={{ color: '#64748b' }}>(of Great Year)</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                            <span>Sky Rotation:</span>
                            <strong style={{ color: '#fbbf24', fontSize: '1.5rem' }}>62.82°</strong>
                        </div>
                        
                        <div style={{ 
                            fontSize: '1.2rem', 
                            color: '#94a3b8', 
                            fontStyle: 'italic', 
                            paddingTop: '1rem', 
                            textAlign: 'center',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '1.5rem',
                            borderRadius: '12px'
                        }}>
                            "That's how old the Giza pyramids really are."
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
