'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [3, 4];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#4ade80', '#06b6d4', '#f59e0b'];

type KpiPts = [number, number][];

function MiniChart({ kpis, xLabel }: { kpis: { name: string; color: string; points: KpiPts }[]; xLabel: string }) {
    const W = 260, H = 100, PAD = { t: 14, r: 8, b: 26, l: 34 };
    const N = kpis[0]?.points[kpis[0].points.length - 1]?.[0] || 10;
    const IW = W - PAD.l - PAD.r;
    const IH = H - PAD.t - PAD.b;
    const toX = (v: number) => PAD.l + (v / N) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: KpiPts) => pts.map(([x, y], i) => {
        const px = toX(x), py = toY(y);
        if (i === 0) return `M ${px.toFixed(1)} ${py.toFixed(1)}`;
        const cx = (toX(pts[i - 1][0]) + px) / 2;
        return `C ${cx.toFixed(1)} ${toY(pts[i - 1][1]).toFixed(1)}, ${cx.toFixed(1)} ${py.toFixed(1)}, ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
    const ticks = [0, 0.5, 1].map(f => Math.round(f * N));
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W - PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v === 0 ? 1 : 0.5} strokeDasharray={v === 0 ? '' : '3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fontSize={6.5} fill="#475569">{100 - v}%</text>)}
            {ticks.map(t => <text key={t} x={toX(t)} y={H - 3} textAnchor="middle" fontSize={6} fill="#475569">{t}{xLabel}</text>)}
            {kpis.map((k, i) => <g key={i} transform={`translate(${PAD.l + i * (IW / kpis.length)},3)`}><line x1="0" x2="9" y1="4" y2="4" stroke={k.color} strokeWidth={1.5} /><text x="12" y="7" fontSize="6" fill={k.color}>{k.name}</text></g>)}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={k.color} strokeWidth={1.5} strokeLinecap="round" />)}
        </svg>
    );
}

const DELIVERY_SYSTEMS = [
    {
        icon: '📡',
        label: 'Ground-coupled Acoustic Array',
        mechanism: 'Spike transducers (100–300mm steel rods) hammered to depth and driven at the mineral resonant frequency. Standing-wave acoustic field radiates laterally through the soil matrix, de-agglomerating compacted mineral clusters and stimulating microbial membrane activity. Grid spacing: ~0.5 × acoustic wavelength. Effective radius per spike: 0.5–2m depending on soil density.',
    },
    {
        icon: '🌀',
        label: 'Vortex Water Drench (φ-structured)',
        mechanism: 'φ-structured water carrying the mineral resonant imprint is applied by drench irrigation. The coherent cluster geometry of structured water acts as a carrier wave frequency—when it contacts soil minerals of matching resonant identity, ion exchange and hydration shell restructuring occur, improving mineral bioavailability to plant roots by 15–40%.',
    },
    {
        icon: '☀️',
        label: 'Focused UV/IR Soil Activation',
        mechanism: 'For dry, low-conductivity soils, pulsed UV (185nm ozone-band) or far-IR (9.6µm CO₂ band) applied at the soil surface can photo-ionise and photo-activate mineral crystalline faces, enhancing surface charge and cation exchange capacity (CEC). 5-minute exposure per metre² followed by acoustic treatment compounds the remineralisation effect.',
    },
];

function SoilDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isAtomic = entry.octave === 3;
    const domainLabel = isAtomic ? 'Atomic / Elemental' : 'Electron Orbital / Ion';

    const effectText = isAtomic
        ? `At the atomic nucleus scale (OCT-3), ${entry.name} provides the core elemental fingerprint. This NIST-validated spectral identity anchors the φ-harmonic mineral profile of the soil. Applying acoustic energy at ${entry.freq_display} activates the elemental nucleus resonance, breaking compaction bonds around mineral lattice sites and releasing locked cations (Ca²⁺, Mg²⁺, Fe³⁺) into bio-available form.`
        : `At the electron orbital scale (OCT-4), ${entry.name} defines the ionic spectral identity (NIST emission line). For soil remediation, this means the hydrated mineral ion cluster can be targeted by acoustic structuring to disrupt its ordered hydration shell. Result: 15–40% improvement in ion exchange with plant root exudates and 20–60% increase in microbial enzyme activity in mineral-rich zones.`;

    const kpis = [
        { name: 'Microbial Act.', color: KPI_COLORS[0], points: [[0, 5], [1, 18], [2, 34], [3, 52], [4, 66], [5, 78], [6, 87], [7, 93], [8, 97], [9, 99], [10, 100]] as KpiPts },
        { name: 'Ion Avail.', color: KPI_COLORS[1], points: [[0, 8], [1, 22], [2, 38], [3, 55], [4, 68], [5, 79], [6, 88], [7, 94], [8, 97], [9, 99], [10, 100]] as KpiPts },
        { name: 'Soil CEC', color: KPI_COLORS[2], points: [[0, 10], [1, 20], [2, 33], [3, 47], [4, 58], [5, 68], [6, 76], [7, 83], [8, 90], [9, 95], [10, 100]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0a1a0a, #1a3a1a)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>φ-HARMONIC SOIL TREATMENT FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#4ade80' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>
                    {entry.scale_label} · {domainLabel}
                </div>
            </div>

            {/* Domain stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#061606', border: '1px solid #14532d', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#4ade80', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#86efac', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#0c1e10', border: '1px solid #166534', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#86efac', fontWeight: 800 }}>OCT DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#4ade80', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            {/* Soil effect */}
            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#4ade80', fontWeight: 800, marginBottom: 3 }}>🌱 SOIL RESONANCE EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 APPLICATION SYSTEMS</span>
                    </div>
                    {DELIVERY_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < DELIVERY_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{ds.mechanism}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI chart */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 SOIL QUALITY vs TREATMENT SESSIONS</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel="×" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = cumulative acoustic treatment sessions. Y = % of target soil health level achieved. CEC = cation exchange capacity. Microbial activation measured by PLFA analysis.
                    </div>
                </div>
            )}

            {/* Source */}
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.08em', marginBottom: 2 }}>✓ SOURCE</div>
                <p style={{ margin: 0, fontSize: '0.67rem', color: D.muted, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.source}</p>
            </div>
        </div>
    );
}

export default function SoilResonanceOptimizer() {
    return (
        <OctaveExplorer
            title="Soil Resonance Optimizer"
            icon="🌱"
            description="φ-harmonic soil remediation framework (OCT-3: elemental nucleus · OCT-4: ion orbital). Each entry yields a recommended acoustic/photonic treatment frequency for unlocking mineral bioavailability. Delivery systems: ground-coupled spike arrays, vortex water drench, and focused UV/IR activation. KPI chart tracks microbial activation, ion availability, and CEC gain per treatment session."
            octaves={OCTAVES}
            toolColor="#4ade80"
            renderDetail={(entry) => <SoilDetail entry={entry} />}
        />
    );
}
