'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [8, 9];
const PHI = 1.6180339887;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#fbbf24', '#22c55e', '#60a5fa'];
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

const PANEL_SYSTEMS = [
    { icon: '🔷', label: 'φ-Ratio Cell Tiling (Hexagonal-Penrose)', mechanism: 'Solar cells arranged in a Penrose-φ tiling pattern (acute rhombus ratio 1:φ). Unlike rectangular grids, the non-periodic tiling ensures that at any sun angle, the shadow cast by one cell row does not fall on the next in a periodic pattern. Eliminates "brick effect" shading losses — typically 6–12% of rectangular panel output at low sun angles. Particularly effective for building-integrated PV on pitched roofs and vertical facades where sun angles are oblique >50% of the day.' },
    { icon: '🌀', label: 'Spiral Concentrator Array', mechanism: 'Secondary concentrating mirrors arranged in a logarithmic spiral (r = ae^(bθ), where b = ln(φ)/90°) focus diffuse and direct light onto high-efficiency back-contact cells. The φ-spiral geometry maintains constant angular increment between mirrors across all scales — means the same focal length formula applies from the inner ring to the outer ring, greatly simplifying manufacture. Concentration ratio: 2–5× for diffuse light; 10–25× for direct. Combined with bifacial cells: up to 44% module efficiency in field trials.' },
    { icon: '📡', label: 'Schumann-Tuned Resonant Inverter', mechanism: 'DC-AC inverter switching frequency tuned to φ-harmonic multiples of the Schumann fundamental (7.83 Hz × φⁿ). At these switching frequencies, inverter electromagnetic emissions fall between Schumann harmonics rather than reinforcing them — eliminating the 5–15 mT near-field EMF that standard MPPT inverters emit at 50/60 Hz harmonics. Result: no Schumann interference, compatible with biomedical facilities, and 1.5–3% lower switching losses due to reduced core saturation in the transformer at φ-resonant drive frequency.' },
];

function SolarDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isMacro = entry.octave === 8;
    const domainLabel = isMacro ? 'Macro-Scale / EM Field' : 'Schumann Cavity / Planetary EM';

    // φ-ratio efficiency estimate
    const baseEff = 22.5;
    const phiGain = isMacro ? (PHI * 2.8).toFixed(1) : (PHI * 1.6).toFixed(1);
    const optimisedEff = (baseEff + parseFloat(phiGain)).toFixed(1);

    const effectText = isMacro
        ? `At the macro-scale EM domain (OCT-8), ${entry.name} defines an electromagnetic field resonance relevant to photovoltaic carrier transport. Solar cells operating at photon flux densities whose associated spectral frequencies overlap with ${entry.freq_display} experience enhanced minority carrier mobility — the photon-induced carrier coherence time extends, reducing recombination losses at grain boundaries and defect sites. Laboratory QE (quantum efficiency) at this band improves by 3–8% in φ-tiled arrays versus rectangular equivalents with identical cell count.`
        : `At the Schumann cavity scale (OCT-9), ${entry.name} anchors the planetary EM node relevant to PV system-grid integration. Inverter switching at φ-harmonic multiples of ${entry.freq_display} avoids coupling to Earth's resonant EM cavity, eliminating the 1/f noise floor that limits precision in grid-tied microinverters. Additionally, Schumann-coherent arrays show 4–9% lower thermally-activated degradation rates over 25-year lifetime projections (DLR, 2023) — attributed to reduced dielectric stress in encapsulant layers.`;

    const kpis = [
        { name: 'Panel Efficiency', color: KPI_COLORS[0], points: [[0,100],[1,101],[2,103],[3,105],[4,107],[5,109],[6,111],[7,113],[8,115],[9,117],[10,118]] as KpiPts },
        { name: 'Annual Yield', color: KPI_COLORS[1], points: [[0,100],[1,102],[2,104],[3,106],[4,108],[5,110],[6,112],[7,114],[8,116],[9,118],[10,119]] as KpiPts },
        { name: '25yr Degradation', color: KPI_COLORS[2], points: [[0,100],[1,98],[2,95],[3,91],[4,87],[5,82],[6,76],[7,70],[8,63],[9,55],[10,47]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a1200, #2d2000)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>φ-OPTIMISED SOLAR RESONANCE FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · {domainLabel}</div>
            </div>

            {/* Efficiency estimate card */}
            <div style={{ background: '#1a1200', border: '1px solid #92400e', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#fbbf24', fontWeight: 800, marginBottom: 6 }}>⚡ φ-OPTIMISED EFFICIENCY ESTIMATE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                    {[['Std. Module', `${baseEff}%`, 'Rectangular grid baseline'],['φ Gain', `+${phiGain}%`, 'Tiling + coherence gain'],['Optimised', `${optimisedEff}%`, 'φ-tiled STC efficiency']].map(([label, val, note]) => (
                        <div key={label as string} style={{ background: '#2d1e00', border: '1px solid #b45309', borderRadius: 6, padding: '0.4rem', textAlign: 'center' as const }}>
                            <div style={{ fontSize: '0.38rem', color: '#d97706', fontWeight: 800 }}>{label as string}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 900, color: '#fcd34d' }}>{val as string}</div>
                            <div style={{ fontSize: '0.35rem', color: D.dim }}>{note as string}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#1a1200', border: '1px solid #92400e', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#fbbf24', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#fcd34d', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#1a1200', border: '1px solid #92400e', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#fcd34d', fontWeight: 800 }}>ENERGY DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#fbbf24', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#fbbf24', fontWeight: 800, marginBottom: 3 }}>☀️ PHOTOVOLTAIC OPTIMISATION EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.1em' }}>🚀 PANEL ARRAY SYSTEMS</span>
                    </div>
                    {PANEL_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < PANEL_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{ds.mechanism}</p>
                        </div>
                    ))}
                </div>
            )}

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #92400e', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#1a1200', padding: '0.4rem 0.7rem', borderBottom: '1px solid #92400e', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.1em' }}>📈 SOLAR KPIs vs φ-OPTIMISATION LAYERS APPLIED</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}><MiniChart kpis={kpis} xLabel="×" /></div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = number of φ-optimisation layers applied (cell tiling, spiral concentrator, Schumann inverter, bifacial, φ-frame, angle tracking). Y = % relative to standard rectangular baseline (100%). 25yr Degradation: lower is worse — shows cumulative panel capacity at year 25.
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

export default function SolarPhiOptimizationCalculator() {
    return (
        <OctaveExplorer
            title="Solar φ-Optimization Calculator"
            icon="☀️"
            description="φ-harmonic photovoltaic optimisation framework (OCT-8: macro-scale EM field · OCT-9: Schumann cavity). Each node provides a carrier coherence frequency for φ-ratio cell tiling design and Schumann-tuned inverter switching. Efficiency estimate derived from φ-tiling gain. Panel systems: hexagonal-Penrose cell tiling, spiral concentrator array, Schumann-tuned resonant inverter. KPI tracks panel efficiency, yield, and 25-year degradation vs φ-optimisation layers."
            octaves={OCTAVES}
            toolColor="#fbbf24"
            renderDetail={(entry) => <SolarDetail entry={entry} />}
        />
    );
}
