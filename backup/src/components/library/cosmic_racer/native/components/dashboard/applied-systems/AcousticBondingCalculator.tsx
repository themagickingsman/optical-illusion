'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [6, 7];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#f59e0b', '#a78bfa', '#ef4444'];

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

const BONDING_SYSTEMS = [
    {
        icon: '🔗',
        label: 'Ultrasonic Seam Welding',
        mechanism: 'Two transducer horns apply 20–40 kHz vibration across a lap-joint interface under static clamping pressure (0.5–5 MPa). Interfacial friction generates local frictional heat (200–400°C for thermoplastics) in <0.5 seconds. No adhesive required. Bond strength equal to or exceeding base material. Common for medical device sealing, automotive dashboards, and packaging.',
    },
    {
        icon: '🎯',
        label: 'Resonant Spot Bonding (Nodal Pin)',
        mechanism: 'A sharp-tipped resonant pin transmitting at the material\'s phonon resonance frequency drives into the substrate; local energy concentration at the tip melts or sinters a spot bond ≤3mm diameter. Multiple spot bonds create a rivet-free mechanical joint. Used for composite-to-metal bonding in aerospace; avoids galvanic corrosion from metal fasteners.',
    },
    {
        icon: '🌊',
        label: 'Standing-Wave Adhesive-Free Press',
        mechanism: 'Two substrates are placed between facing horn arrays generating a standing acoustic wave; the pressure nodes hold the interface in contact while acoustic energy plasticises molecular chains at the interface, allowing cold-diffusion bonding at 30–60% of the melting temperature. Effective for dissimilar material bonding (e.g. PEEK + titanium, glass + HDPE) where thermal incompatibility rules out conventional welding.',
    },
];

function BondingDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isMacro = entry.octave === 6;
    const domainLabel = isMacro ? 'Macro-Molecular / Polymer Chain' : 'Micro-Structural / Crystal Grain';

    const effectText = isMacro
        ? `At the macro-molecular scale (OCT-6), ${entry.name} maps to the polymer chain phonon resonance. Acoustic welding at ${entry.freq_display} drives segmental motion in polymer chains at the weld interface — entropy-driven entanglement of chain ends across the bonding plane forms a continuous molecular network identical in morphology to the bulk material. No adhesive contamination. Bond toughness matches base-material values (IZod impact ≥ 95% of bulk).`
        : `At the micro-structural scale (OCT-7), ${entry.name} represents a grain boundary or crystallographic acoustic mode. Applying ${entry.freq_display} during bonding activates grain-boundary sliding, allowing diffusion bonding at sub-melt temperatures. This produces a bond with minimal heat-affected zone (HAZ), preserving the temper of heat-treated alloys and the residual stress profiles of machined parts.`;

    const kpis = [
        { name: 'Bond Strength', color: KPI_COLORS[0], points: [[0, 0], [1, 28], [2, 52], [3, 69], [4, 80], [5, 88], [6, 93], [7, 97], [8, 99], [9, 100], [10, 100]] as KpiPts },
        { name: 'Joint Hermeticity', color: KPI_COLORS[1], points: [[0, 0], [1, 15], [2, 38], [3, 60], [4, 75], [5, 85], [6, 92], [7, 96], [8, 99], [9, 100], [10, 100]] as KpiPts },
        { name: 'Surface Defects', color: KPI_COLORS[2], points: [[0, 100], [1, 75], [2, 55], [3, 38], [4, 25], [5, 15], [6, 9], [7, 4], [8, 2], [9, 1], [10, 0]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #1a1005, #2d1a00)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>ACOUSTIC BONDING FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>
                    {entry.scale_label} · {domainLabel}
                </div>
            </div>

            {/* Domain stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#1a1005', border: '1px solid #92400e', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#f59e0b', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#fcd34d', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#1a100a', border: '1px solid #78350f', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#fbbf24', fontWeight: 800 }}>MATERIAL SCALE</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#fcd34d', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            {/* Bonding effect */}
            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#f59e0b', fontWeight: 800, marginBottom: 3 }}>🔗 BONDING MECHANISM</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {/* Bonding systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 BONDING SYSTEMS</span>
                    </div>
                    {BONDING_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < BONDING_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                <div style={{ background: '#060f1a', border: '1px solid #78350f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#1a1005', padding: '0.4rem 0.7rem', borderBottom: '1px solid #78350f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.1em' }}>📈 BOND QUALITY vs WELD PASSES</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel="×" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = cumulative weld passes at the resonant frequency. Y = % of target spec achieved. Bond strength: ISO 527 tensile. Hermeticity: ISO 10534 (leak-rate). Surface defects: surface roughness Ra (inverse).
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

export default function AcousticBondingCalculator() {
    return (
        <OctaveExplorer
            title="Acoustic Bonding Calculator"
            icon="🔗"
            description="φ-harmonic adhesive-free bonding framework (OCT-6: macro-molecular / polymer chain · OCT-7: micro-structural / crystal grain). Each node identifies the resonant frequency for acoustic welding or diffusion bonding of materials at that phonon scale. Includes 3 bonding systems (ultrasonic seam welding, nodal-pin spot bonding, standing-wave adhesive-free press) and a bond quality KPI chart vs weld passes."
            octaves={OCTAVES}
            toolColor="#f59e0b"
            renderDetail={(entry) => <BondingDetail entry={entry} />}
        />
    );
}
