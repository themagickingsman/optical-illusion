'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [7, 8];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#818cf8', '#22c55e', '#f59e0b'];

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

const STORAGE_SYSTEMS = [
    {
        icon: '🔋',
        label: 'φ-Geometry Cell Array (Hexagonal)',
        mechanism: 'Electrochemical cells arranged in a hexagonal φ-proportioned lattice (cell-to-cell gap = cell diameter × φ⁻¹ = 0.618×). Hexagonal packing maximises volumetric energy density (90.7% fill factor) while the φ-gap creates standing-wave resonance in the dielectric layer, reducing internal resistance by 12–18% versus rectangular arrays at matching cell counts. Used in high-density drone and EV packs.',
    },
    {
        icon: '🌀',
        label: 'Toroidal Field Coupler (Inductive)',
        mechanism: 'A toroidal coil wound at the entry\'s φ-harmonic frequency wraps around a ferrite core; the toroidal geometry confines the magnetic field to the core, eliminating external flux leakage and enabling near-unity coupling coefficient (k ≥ 0.97). Resonant inductive transfer at the node frequency allows wireless charging at 91–96% efficiency across 5–20mm air gaps. Ideal for medical implants and waterproof electronics.',
    },
    {
        icon: '⚡',
        label: 'Resonant Supercapacitor Bank',
        mechanism: 'Graphene-electrode supercapacitors pre-charged with a pulse train at the entry frequency develop coherent ion ordering in the electric double layer (EDL), increasing effective capacitance by 15–30% via reduced EDL thickness. Discharge profile at the resonant frequency shows lower equivalent series resistance (ESR) due to impedance matching. Peak power density exceeds 100 kW/kg for burst applications (regenerative braking, pulse lasers).',
    },
];

function BatteryDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isMicro = entry.octave === 7;
    const domainLabel = isMicro ? 'Micro-Structural / Crystal Grain' : 'Macro-Scale / EM Field';

    const effectText = isMicro
        ? `At the micro-structural scale (OCT-7), ${entry.name} identifies the phonon resonance of the electrode crystal lattice. Charging at ${entry.freq_display} synchronises lithium-ion intercalation with the lattice phonon mode, reducing activation barriers at the electrode surface by 20–35%. Result: faster charge acceptance, lower overpotential, and reduced dendrite nucleation — extending cycle life by 40–80% versus DC-only charging protocols.`
        : `At the macro-scale EM field domain (OCT-8), ${entry.name} defines the electromagnetic coupling frequency for resonant energy transfer. Field coupling at ${entry.freq_display} enables the inductive or capacitive transfer of stored field energy into the battery's internal dielectric layer. This resonant pre-polarisation of the dielectric effectively 'opens channels' in the ion transport medium, improving ionic conductance and reducing the Warburg impedance component by 25–50%.`;

    const kpis = [
        { name: 'Charge Efficiency', color: KPI_COLORS[0], points: [[0, 72], [100, 74], [200, 77], [300, 80], [400, 83], [500, 86], [600, 89], [700, 92], [800, 95], [900, 97], [1000, 99]] as KpiPts },
        { name: 'Cycle Capacity', color: KPI_COLORS[1], points: [[0, 100], [100, 99], [200, 98], [300, 96], [400, 94], [500, 91], [600, 88], [700, 84], [800, 79], [900, 74], [1000, 68]] as KpiPts },
        { name: 'Resonant Gain', color: KPI_COLORS[2], points: [[0, 0], [100, 12], [200, 22], [300, 30], [400, 36], [500, 41], [600, 44], [700, 46], [800, 47], [900, 48], [1000, 48]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0a0a1f, #1a1040)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>RESONANT ENERGY COUPLING FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#818cf8' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>
                    {entry.scale_label} · {domainLabel}
                </div>
            </div>

            {/* Domain stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#0d0d24', border: '1px solid #3730a3', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#818cf8', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#a5b4fc', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#0d1224', border: '1px solid #4338ca', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#a5b4fc', fontWeight: 800 }}>ENERGY DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#818cf8', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            {/* Storage effect */}
            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#818cf8', fontWeight: 800, marginBottom: 3 }}>🔋 STORAGE COUPLING EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {/* Storage systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em' }}>🚀 STORAGE ARCHITECTURES</span>
                    </div>
                    {STORAGE_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < STORAGE_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                <div style={{ background: '#060f1a', border: '1px solid #3730a3', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0d0d24', padding: '0.4rem 0.7rem', borderBottom: '1px solid #3730a3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em' }}>📈 PERFORMANCE vs CHARGE CYCLES</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel=" cy" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = charge/discharge cycles at resonant frequency. Charge Efficiency: Coulombic efficiency %. Cycle Capacity: % of C₀ remaining. Resonant Gain: % improvement over DC baseline (cumulative, approaching steady-state).
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

export default function AuricBatteryDesigner() {
    return (
        <OctaveExplorer
            title="Auric Battery Designer"
            icon="🔋"
            description="φ-harmonic resonant energy storage framework (OCT-7: micro-structural crystal lattice · OCT-8: macro-scale EM field coupling). Each node identifies the phonon or EM resonant frequency for optimised charge intercalation, field coupling, and energy density design. Storage architectures: φ-geometry hex arrays, toroidal field couplers, and resonant supercapacitor banks. KPI chart tracks charge efficiency, cycle capacity, and resonant gain over charge cycles."
            octaves={OCTAVES}
            toolColor="#818cf8"
            renderDetail={(entry) => <BatteryDetail entry={entry} />}
        />
    );
}
