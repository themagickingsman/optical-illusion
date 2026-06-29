'use client';

import React from 'react';

export default function IndigenousZodiacPanel() {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid #fbbf24',
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
                position: 'absolute', top: '-50%', left: '-20%', width: '70%', height: '200%',
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, transparent 70%)',
                filter: 'blur(80px)', zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ 
                    borderBottom: '1px solid rgba(251, 191, 36, 0.3)', 
                    paddingBottom: '1rem', 
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ fontSize: '2rem', color: '#fbbf24' }}>👁️</div>
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            MEROITIC INTELLIGENCE (CONTEXT)
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                            TIMELINE CORRECTION: -2500 EPOCH
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: '1rem', lineHeight: 1.6, color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '4px solid #fbbf24' }}>
                            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem' }}>THE HIDDEN ARCHITECTURE</strong>
                            We discovered that applying Greek astronomical labels (Taurus, Scorpio) to African megaliths creates a <strong>62.8° misalignment</strong>. 
                            The ancients were not building "Greek Temples"—they were building indigenous <strong>Agricultural Machines</strong>.
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>1. THE SOLAR HOUSE: NG'OMBE (THE COW)</strong><br/>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Western: Taurus</span><br/>
                            This corrects the context. Giza is a monumental <strong>"Cattle Enclosure"</strong>, geometrically linked to the Great Zimbabwe complex in the South. 
                            The Sun rose in the House of the <strong style={{ color: '#fbbf24' }}>Sacred Cow (Ng'ombe)</strong>, not the Bull (Apis).
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>2. THE LUNAR HOUSE: NGE (THE SCORPION)</strong><br/>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Western: Scorpio</span><br/>
                            This explains the opposition. The Moon stood in the House of the <strong style={{ color: '#ef4444' }}>Sting (Nge)</strong>, representing the "Opposer" or "Protector" versus the "Nurturer" (Cow).
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>3. THE ANCESTRAL SHAFTS (THE LINEAGE)</strong><br/>
                            The shafts target the specific stars of the Bantu cosmology:<br/>
                            • <strong style={{ color: '#fbbf24' }}>Shaft 1 (King):</strong> Osiris (Orion) - The Hunter/Warrior.<br/>
                            • <strong style={{ color: '#38bdf8' }}>Shaft 2 (Queen):</strong> Isis (Sirius) - The Rain Star.
                        </div>

                        <div style={{ 
                            marginTop: '1.5rem', 
                            padding: '1rem', 
                            background: 'rgba(251, 191, 36, 0.1)', 
                            border: '1px solid rgba(251, 191, 36, 0.2)', 
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.25rem', fontSize: '1.1rem' }}>CONCLUSION</strong>
                            The "Error" on the timeline was a translation artifact. By using the Indigenous Zodiac, the architectural alignment clicks into place with <strong>zero deviation</strong>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
