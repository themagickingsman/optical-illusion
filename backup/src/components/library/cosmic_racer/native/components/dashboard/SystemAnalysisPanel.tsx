import React from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

export default function SystemAnalysisPanel({ title, description }: { title?: string, description?: string }) {
    return (
        <div style={{
            background: '#0f172a',
            borderRadius: '24px',
            border: '1px solid #334155',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            height: '100%', // Fill Grid Cell
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                color: '#ef4444', 
                marginBottom: '0.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
            }}>
                System Analysis
            </div>
            <h2 style={{ 
                fontSize: '2.5rem', // Larger Header
                fontWeight: 800, 
                color: '#f8fafc',
                lineHeight: 1.1,
                marginBottom: '2rem',
                fontFamily: 'sans-serif'
            }}>
                {title || "The 9.1 Signature"}<br/>
                <span style={{ color: '#fbbf24', fontSize: '1.5rem' }}>{description || "Recursive Power Key"}</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
                {/* COLUMN 1: THE CONNECTION */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        Geodetic Resonance
                    </h3>
                    <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                        {description ? `Analyzing the architectural data for ${title}. Systems currently registering within expected geodetic thresholds.` : "The <strong>+9.1 km</strong> deviation in the Moon's radius is not an error. It is the physical manifestation of the system's core scaling constant."}
                    </p>
                    
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                            <span style={{ color: '#94a3b8' }}>Framework Constant</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>9.1</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                            <span style={{ color: '#94a3b8' }}>Geodetic Delta</span>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>+9.1 km</span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
                        <div style={{ fontSize: '1rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                            "The system encodes its own scaling factor into the radius of the Moon."
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: TEMPORAL IMPLICATIONS */}
                <div style={{ flex: 1 }}>
                     <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        Time Dilation Effect
                    </h3>

                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.75rem 1rem', fontSize: '1.1rem' }}>
                            <span style={{ color: '#cbd5e1' }}>Harmonic Cycle:</span>
                            <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right' }}>25,920 Years</span>

                            <span style={{ color: '#fbbf24' }}>Total Drag:</span>
                            <span style={{ color: '#fbbf24', fontWeight: 600, textAlign: 'right' }}>- 136.5 Years</span>

                            <div style={{ gridColumn: '1 / -1', height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.5rem 0' }}></div>

                            <span style={{ color: '#06b6d4' }}>Predicted:</span>
                            <span style={{ color: '#06b6d4', fontWeight: 700, textAlign: 'right' }}>25,783.5 Years</span>
                        </div>
                        
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', textAlign: 'right' }}>
                            Actual: ~25,772 Years <span style={{ color: '#10b981', marginLeft: '0.5rem', fontWeight: 700 }}>99.96% Match</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
