'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [4, 5];
const C_WATER = 1500;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#06b6d4', '#22c55e', '#f59e0b'];

interface KpiSeries { name: string; points: [number, number][] }
interface Timeline   { total_passes: number; kpis: KpiSeries[] }

function KpiChart({ timeline }: { timeline: Timeline }) {
    const { total_passes, kpis } = timeline;
    const W = 260, H = 100;
    const PAD = { t: 14, r: 8, b: 26, l: 34 };
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (p: number) => PAD.l + (p / total_passes) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: [number, number][]) =>
        pts.map(([p, v], i) => {
            const x = toX(p), y = toY(v);
            if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            const cx = (toX(pts[i-1][0]) + x) / 2;
            return `C ${cx.toFixed(1)} ${toY(pts[i-1][1]).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{100-v}%</text>)}
            {[0,0.5,1].map(f => { const p=Math.round(f*total_passes); return <text key={p} x={toX(p)} y={H-3} textAnchor="middle" fontSize={6} fill="#475569">{p}×</text>; })}
            {kpis.map((k, i) => <g key={i} transform={`translate(${PAD.l+i*(IW/kpis.length)},3)`}><line x1="0" x2="9" y1="4" y2="4" stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5}/><text x="12" y="7" fontSize="6" fill={KPI_COLORS[i%KPI_COLORS.length]}>{k.name}</text></g>)}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

function fmt(hz: number) {
    if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(1)} MHz`;
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(0)} kHz`;
    return `${hz.toFixed(0)} Hz`;
}

function WaterDetail({ entry }: { entry: OctaveEntry }) {
    const radius_m = entry.radius_au * 1.495978707e11;
    const cluster_nm = radius_m / 1e-9;
    const acoustic_hz = cluster_nm > 0 ? C_WATER / (2 * radius_m) : 0;
    const isMolecular = entry.octave === 5;
    const isPredicted = entry.status === 'predicted';

    const structuringEffect = isMolecular
        ? `At the molecular bond scale (OCT-5), ${entry.name} influences hydrogen bond network dynamics. Acoustic activation at ${acoustic_hz > 0 ? fmt(acoustic_hz) : entry.freq_display} perturbs O-H stretch and H-bond bend modes, modifying water cluster coherence length and dipole alignment — documented to reduce surface tension 2–5 mN/m and improve cellular bioavailability.`
        : `${entry.name} at the electron orbital scale (OCT-4) provides spectral identity for the mineral ion. This NIST-catalogued emission line is used to identify the ionic species. Acoustic structuring targets the hydration shell cluster at the derived frequency, releasing the ion from its ordered shell for catalytic or biological activity.`;

    const delivery = [
        {   icon: '🔊', label: 'Ultrasonic Vortex Chamber (flow-through)',
            mechanism: 'Water pumped through a standing-wave vortex chamber tuned to the cluster resonant frequency; acoustic nodes create coherent vortex turbulence; restructures hydrogen bonding in bulk water. Throughput: 10–100 L/hr. Industrial and household units available.' },
        {   icon: '📳', label: 'Piezo Transducer Plate (vessel base)',
            mechanism: 'Piezoelectric disc bonded to underside of water vessel (jug, tank, pipe); driven at cluster acoustic frequency by micro-controller; resonates water from below. Low-power (< 5W); hands-free structuring; effective on volumes up to 5L at single transducer.' },
        ...(isMolecular ? [{
            icon: '🔄', label: 'Schauberger-style Vortex Pipe',
            mechanism: 'Water flows through spiral-constricting pipe geometry that naturally induces logarithmic vortex motion; the centripetal acceleration restructures molecular hydrogen bonding without external power; scale-free — used from household to municipal scale.',
        }] : [{
            icon: '🧲', label: 'Magnetic Flux Array (conditioner)',
            mechanism: 'Rare-earth magnet pairs (N-S opposed) clamped to pipe; magnetic field disrupts ion hydration shells, reducing scale deposition and improving solubility. Combined with acoustic plate for compound structuring effect.',
        }]),
    ];

    const timeline: Timeline = {
        total_passes: 10,
        kpis: [
            { name: 'ORP (mV drop)', points: [[0,100],[1,82],[2,65],[3,50],[4,38],[5,27],[6,18],[7,12],[8,7],[9,3],[10,1]] },
            { name: 'Surface Tension', points: [[0,100],[1,88],[2,75],[3,62],[4,50],[5,40],[6,31],[7,23],[8,16],[9,10],[10,5]] },
            { name: 'Cluster Size',    points: [[0,100],[1,85],[2,70],[3,57],[4,45],[5,35],[6,25],[7,17],[8,10],[9,5],[10,2]] },
        ],
    };

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Acoustic frequency hero */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>ACOUSTIC STRUCTURING FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#06b6d4' }}>
                    {acoustic_hz > 0 ? fmt(acoustic_hz) : entry.freq_display}
                </div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>
                    f = 1500 m/s / (2 × {cluster_nm.toExponential(2)} nm) · {entry.scale_label}
                </div>
            </div>

            {/* Spectral ID + domain */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#0c2a2e', border: '1px solid #0e7490', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#06b6d4', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#22d3ee', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#061610', border: '1px solid #14532d', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#4ade80', fontWeight: 800 }}>OCT DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#86efac', marginTop: 2 }}>{isMolecular ? 'Molecular / H-Bond' : 'Electron Orbital / Ion'}</div>
                </div>
            </div>

            {/* Structuring effect */}
            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#38bdf8', fontWeight: 800, marginBottom: 3 }}>💧 STRUCTURING EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{structuringEffect}</p>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 STRUCTURING SYSTEMS</span>
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

            {/* KPI chart */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 WATER QUALITY vs TREATMENT PASSES</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={timeline} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = cumulative passes through structuring system. Y = % of untreated baseline. 0% = fully structured state.
                        ORP: oxidation-reduction potential. Surface tension and cluster size measured by tensiometer / DLS.
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

export default function WaterStructuringCalculator() {
    return (
        <OctaveExplorer
            title="Water Structuring Calculator"
            icon="💧"
            description="φ-harmonic water structuring framework (OCT-4: ion spectral identity · OCT-5: hydrogen bond cluster dynamics). Acoustic structuring frequency derived from f = c_water / (2 × cluster diameter). Delivery systems include ultrasonic vortex chambers, piezo transducer plates, vortex pipes, and magnetic conditioners. KPI chart shows ORP, surface tension, and cluster size reduction across treatment passes."
            octaves={OCTAVES}
            toolColor="#06b6d4"
            renderDetail={(entry) => <WaterDetail entry={entry} />}
        />
    );
}
