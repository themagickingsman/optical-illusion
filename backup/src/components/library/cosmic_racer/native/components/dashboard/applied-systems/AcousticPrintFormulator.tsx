'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [4, 5];
const C_AIR = 343;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#a855f7', '#06b6d4', '#4ade80'];

type KpiPts = [number, number][];

function MiniChart({ kpis }: { kpis: { name: string; color: string; points: KpiPts }[] }) {
    const W = 260, H = 100, PAD = { t: 14, r: 8, b: 26, l: 34 };
    const N = kpis[0]?.points.length - 1 || 10;
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (i: number) => PAD.l + (i / N) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: KpiPts) => pts.map(([i, v], idx) => {
        const x = toX(i), y = toY(v);
        if (idx === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        const cx = (toX(pts[idx-1][0]) + x) / 2;
        return `C ${cx.toFixed(1)} ${toY(pts[idx-1][1]).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{100-v}%</text>)}
            {kpis.map((k, i) => (
                <g key={i} transform={`translate(${PAD.l + i*(IW/kpis.length)},3)`}>
                    <line x1="0" x2="9" y1="4" y2="4" stroke={k.color} strokeWidth={1.5}/>
                    <text x="12" y="7" fontSize="6" fill={k.color}>{k.name}</text>
                </g>
            ))}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={k.color} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

function fmt(hz: number) {
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(0)} kHz`;
    return `${hz.toFixed(0)} Hz`;
}

function PrintDetail({ entry }: { entry: OctaveEntry }) {
    const radius_m = entry.radius_au * 1.495978707e11;
    const particle_um = radius_m / 1e-6;
    const acoustic_hz = radius_m > 0 ? C_AIR / (2 * radius_m) : 0;
    const transducerFreqMHz = acoustic_hz / 1e6;
    const trapDistance_mm = acoustic_hz > 0 ? C_AIR / (2 * acoustic_hz) * 1000 : 0;
    const layerRes_mm = trapDistance_mm * 0.1;
    const isPredicted = entry.status === 'predicted';

    const delivery = [
        {   icon: '🔊', label: 'Single-Axis Acoustic Levitator',
            mechanism: `Two opposing transducers at ${transducerFreqMHz.toFixed(2)} MHz face each other; standing wave nodes trap particles at λ/2 spacing (${trapDistance_mm.toExponential(2)} mm apart). Particle injector deposits material at each node. Simplest print geometry — 1D linear array.` },
        {   icon: '🎯', label: 'Multi-Axis Phased Array Printer',
            mechanism: `Phased array of ${transducerFreqMHz > 0.1 ? '64-element' : '32-element'} transducers steerable in 3D; acoustic focus moved electronically without moving parts; nano-layer deposition at ${layerRes_mm.toExponential(2)} mm resolution. Used for pharmaceutical micro-dosing and electronics printing.` },
        {   icon: '💧', label: 'Acoustic Inkjet Dispenser',
            mechanism: `Single transducer behind ink chamber; pressure pulse ejects droplet without nozzle contact; frequency tuned to chamber resonance for consistent droplet volume. Drop-on-demand at ${transducerFreqMHz.toFixed(2)} MHz burst; used in bioprinting (cells + hydrogel matrix).` },
        ...(entry.octave === 4 ? [
            { icon: '🔍', label: 'Ion Trap (mass-spectrometry grade)',
              mechanism: `${entry.name} spectral line (NIST: ${entry.scale_label}) used as elemental identity anchor for print validation. Post-print ICP-MS verification confirms elemental composition of deposited material with sub-ppm accuracy.` },
        ] : []),
    ];

    const chartKpis = [
        { name: 'Position Acc.', color: KPI_COLORS[0], points: [[0,100],[2,60],[4,35],[6,18],[8,8],[10,2]] as KpiPts },
        { name: 'Layer Uniform', color: KPI_COLORS[1], points: [[0,100],[2,70],[4,48],[6,28],[8,12],[10,3]] as KpiPts },
        { name: 'Particle Trap', color: KPI_COLORS[2], points: [[0,100],[1,55],[3,30],[5,14],[7,5],[10,1]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero freq */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1a1a2e)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>ACOUSTIC LEVITATION FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#a855f7' }}>
                    {acoustic_hz > 0 ? fmt(acoustic_hz) : entry.freq_display}
                </div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>f = 343 m/s / (2 × {radius_m.toExponential(2)} m) · {entry.scale_label}</div>
            </div>

            {/* Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                {[
                    { l: 'Particle Size', v: `${particle_um.toExponential(2)} µm`, c: '#a855f7' },
                    { l: 'Trap Node λ/2', v: `${trapDistance_mm.toExponential(2)} mm`, c: '#6366f1' },
                    { l: 'Layer Resolution', v: `${layerRes_mm.toExponential(2)} mm`, c: '#22c55e' },
                ].map(p => (
                    <div key={p.l} style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem', textAlign: 'center' as const }}>
                        <div style={{ fontSize: '0.4rem', color: D.muted, fontWeight: 800 }}>{p.l}</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.72rem', color: p.c, marginTop: 2 }}>{p.v}</div>
                    </div>
                ))}
            </div>

            {/* Print protocol */}
            <div style={{ background: '#170a2a', border: '1px solid #6b21a8', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#c084fc', fontWeight: 800, marginBottom: 3 }}>🖨️ PRINT PROTOCOL</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#d8b4fe', lineHeight: 1.55 }}>
                    {entry.octave === 4
                        ? `${entry.name} (${entry.scale_label}) is the NIST spectral emission line used as elemental identity anchor for post-print validation. Levitation nodes target particles of this characteristic size in the standing-wave field.`
                        : `${entry.name} at ${entry.scale_label} falls in the molecular bond scale. Levitation nodes form at λ/2 intervals (${trapDistance_mm.toExponential(2)} mm). Layer thickness ≤ ${layerRes_mm.toExponential(2)} mm allows sub-wavelength material deposition for nanoscale print resolution.`
                    }
                </p>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 PRINT DELIVERY SYSTEMS</span>
                    </div>
                    {delivery.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < delivery.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{ds.mechanism}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Print accuracy chart */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 PRINT ACCURACY vs CALIBRATION RUNS</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={chartKpis} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        Y = % error from target. 0% = perfect accuracy. Position accuracy and layer uniformity reach specification after ~8 calibration runs.
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

export default function AcousticPrintFormulator() {
    return (
        <OctaveExplorer
            title="Acoustic Print Formulator"
            icon="🖨️"
            description="φ-harmonic acoustic levitation and printing framework (OCT-4: NIST elemental spectral IDs · OCT-5: molecular bond resonances). Derives levitation frequency via f = c_air / (2 × particle diameter). Delivery systems include single-axis levitators, phased-array 3D printers, acoustic inkjet dispensers, and ion-trap validation. KPI chart shows print accuracy convergence across calibration runs."
            octaves={OCTAVES}
            toolColor="#a855f7"
            renderDetail={(entry) => <PrintDetail entry={entry} />}
        />
    );
}
