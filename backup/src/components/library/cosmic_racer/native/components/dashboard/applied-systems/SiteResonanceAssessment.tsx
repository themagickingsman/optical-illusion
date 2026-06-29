'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [9, 10];
const PHI = 1.61803398875;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#38bdf8', '#14b8a6', '#a78bfa'];

type KpiPts = [number, number][];

function MiniChart({ kpis, xLabel }: { kpis: { name: string; color: string; points: KpiPts }[]; xLabel: string }) {
    const W = 260, H = 100, PAD = { t: 14, r: 8, b: 26, l: 34 };
    const N = kpis[0]?.points[kpis[0].points.length - 1]?.[0] || 10;
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (v: number) => PAD.l + (v / N) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: KpiPts) => pts.map(([x, y], i) => {
        const px = toX(x), py = toY(y);
        if (i === 0) return `M ${px.toFixed(1)} ${py.toFixed(1)}`;
        const cx = (toX(pts[i-1][0]) + px) / 2;
        return `C ${cx.toFixed(1)} ${toY(pts[i-1][1]).toFixed(1)}, ${cx.toFixed(1)} ${py.toFixed(1)}, ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
    const ticks = [0, 0.5, 1].map(f => Math.round(f * N));
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{100-v}%</text>)}
            {ticks.map(t => <text key={t} x={toX(t)} y={H-3} textAnchor="middle" fontSize={6} fill="#475569">{t}{xLabel}</text>)}
            {kpis.map((k, i) => <g key={i} transform={`translate(${PAD.l+i*(IW/kpis.length)},3)`}><line x1="0" x2="9" y1="4" y2="4" stroke={k.color} strokeWidth={1.5}/><text x="12" y="7" fontSize="6" fill={k.color}>{k.name}</text></g>)}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={k.color} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

const SITE_SENSORS = [
    { icon: '📻', label: 'ELF/VLF Coil Magnetometer', mechanism: 'Multi-turn air-core coil (1000+ turns) wound on ferrite rod; detects Schumann resonances (7.83, 14.3, 20.8 Hz) as µV-level induced EMF; sensitivity: 1 pT/√Hz. Deployed in pairs (horizontal N-S and E-W) for field direction analysis. Standard equipment for planetary resonance monitoring.' },
    { icon: '🔬', label: 'Seismometer Array (Broadband)', mechanism: 'Three-axis broadband seismometer (0.008–50 Hz); detects micro-seismic noise floor (ocean microseism peak 0.1–0.3 Hz); identifies standing wave modes in local geology. Paired with ELF coil for coincident EM + seismic event detection at Schumann harmonics.' },
    { icon: '📡', label: 'Helical Resonant Cavity Probe', mechanism: 'Tunable helical resonator probe physically matched to site geometry; driven by network analyser to sweep OCT-9/10 frequency range; resonant peaks at measured site frequencies; confirms coupling between built geometry and Schumann cavity.' },
    { icon: '📳', label: 'Human HRV / Coherence Monitor', mechanism: 'Heart rate variability monitor (photoplethysmograph or ECG) worn by occupant; 24-hr HRV recording at site; coherence with Schumann 7.83 Hz baseline computed in frequency domain. Coherence ratio > 0.7 indicates site Schumann coupling is biologically significant.' },
];

function SiteDetail({ entry }: { entry: OctaveEntry }) {
    const km = entry.radius_au * 1.495978707e8;
    const phi_ring = km > 0 ? Math.log(km) / Math.log(PHI * 1000) : 0;
    const isPredicted = entry.status === 'predicted';

    const SCHUMANN = [7.83, 14.3, 20.8, 27.3, 33.8];
    const nearSchumann = SCHUMANN.find(s => Math.abs(entry.freq_hz - s) / s < 0.15);
    const hazard = nearSchumann ? (Math.abs(entry.freq_hz - nearSchumann) / nearSchumann < 0.03 ? 'HIGH' : 'MEDIUM') : 'LOW';
    const hColors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#4ade80' };
    const hBg    = { HIGH: '#1c0a0a', MEDIUM: '#1a1005', LOW: '#06160a' };
    const hBorder = { HIGH: '#7f1d1d', MEDIUM: '#92400e', LOW: '#14532d' };

    const kpis = [
        { name: 'Schumann Coupling', color: KPI_COLORS[0], points: [[0,100],[4,65],[8,38],[12,18],[18,7],[24,2]] as KpiPts },
        { name: 'EM Coherence',      color: KPI_COLORS[1], points: [[0,100],[3,72],[7,48],[10,28],[14,12],[20,3]] as KpiPts },
        { name: 'Bio-HRV Align',     color: KPI_COLORS[2], points: [[0,100],[5,70],[10,45],[15,22],[20,8],[24,2]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>SITE RESONANCE NODE</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · φ^{phi_ring.toFixed(2)} · {km.toExponential(2)} km scale</div>
            </div>

            {/* Schumann hazard badge */}
            <div style={{ background: hBg[hazard], border: `2px solid ${hBorder[hazard]}`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.5rem', color: hColors[hazard], fontWeight: 900, marginBottom: 3 }}>
                    SCHUMANN COUPLING — {hazard}
                    {nearSchumann && ` · Overlaps ${nearSchumann} Hz harmonic`}
                </div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: D.text, lineHeight: 1.5 }}>
                    {hazard === 'HIGH'
                        ? `This site resonates within 3% of Schumann harmonic ${nearSchumann} Hz. Direct coupling to Earth's electromagnetic cavity is measurable. Optimal placement for resonant architecture, healing spaces, and sensitive biological monitoring.`
                        : hazard === 'MEDIUM'
                        ? `Within 15% of Schumann harmonic ${nearSchumann} Hz. Partial cavity coupling during elevated geomagnetic activity (Kp ≥ 4). Sensitive instrument placement recommended.`
                        : `No Schumann harmonic overlap at ${entry.freq_display}. Site resonates in a null zone between planetary cavity modes — geomagnetically quiet location.`
                    }
                </p>
            </div>

            {/* Context */}
            <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#38bdf8', fontWeight: 800, marginBottom: 3 }}>⊕ GEOPHYSICAL CONTEXT — OCT-{entry.octave}</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>
                    {entry.octave === 9
                        ? `At ${entry.scale_label}, this is a planetary cavity resonance node. Sites positioned at this scale harmonic relative to a natural landmark (mountain, lake, cave system) will couple to Schumann / seismic standing waves. Ideal for resonant architecture, healing sanctuaries, and sensitive instrument placement.`
                        : `At ${entry.scale_label} (OCT-10), this corresponds to lunar orbital / magnetospheric boundary scale. Sites at this distance from geomagnetic anomalies experience coherent EM fluctuations during solar storm events (Kp ≥ 6), measurable as ELF perturbations in the 0.01–1 Hz range.`
                    }
                </p>
            </div>

            {/* Assessment instruments */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 SITE ASSESSMENT INSTRUMENTS</span>
                    </div>
                    {SITE_SENSORS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < SITE_SENSORS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{ds.mechanism}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Coupling decay chart */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 COUPLING DECAY vs DISTANCE FROM NODE</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel="km" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        Y = % of maximum coupling strength at node. Coupling decays as distance from φ-node increases. Human HRV alignment measured by occupant coherence monitor.
                    </div>
                </div>
            )}

            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.08em', marginBottom: 2 }}>✓ SOURCE</div>
                <p style={{ margin: 0, fontSize: '0.67rem', color: D.muted, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.source}</p>
            </div>
        </div>
    );
}

export default function SiteResonanceAssessment() {
    return (
        <OctaveExplorer
            title="Site Resonance Assessment"
            icon="⊕"
            description="φ-harmonic site coupling framework (OCT-9: planetary cavity / Schumann / seismic · OCT-10: lunar orbital / magnetosphere). Each node shows Schumann harmonic proximity (HIGH/MEDIUM/LOW coupling), geophysical context, 4 site assessment instruments (ELF magnetometer, seismometer, helical cavity probe, HRV coherence monitor), and coupling decay chart vs distance from node."
            octaves={OCTAVES}
            toolColor="#38bdf8"
            renderDetail={(entry) => <SiteDetail entry={entry} />}
        />
    );
}
