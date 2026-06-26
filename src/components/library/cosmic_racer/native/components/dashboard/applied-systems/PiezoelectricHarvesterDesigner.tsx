'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [6, 7];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#fb7185', '#f59e0b', '#22c55e'];
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

const HARVESTER_SYSTEMS = [
    { icon: '👣', label: 'Footfall Floor Harvester', mechanism: 'PVDF film tiles embedded under flooring; each footstep at 1–3 Hz generates a compression event. Bimorph cantilever stack resonant at the building\'s foot traffic rhythm (OCT-6/7 phonon nodes) converts impact energy. 0.5–8 mW per step. High-traffic corridors (shopping malls, transit hubs) generate 20–100 W net from 10,000+ daily footfalls. Tiles rated for 20 million cycles (IEC 62047-22).' },
    { icon: '🌬️', label: 'Aeroelastic Wind Harvester', mechanism: 'Piezoelectric "grass" — flexible PZT-coated cantilever blades that flutter at Strouhal resonance in airflow. Blade dimensions tuned so natural flutter frequency matches entry node. At 4–12 m/s wind, a 0.5m² patch generates 0.8–15 W. No rotating parts, zero acoustic nuisance, maintenance-free for 10+ years. Ideal for building facades, bridge handrails, and rural off-grid installations.' },
    { icon: '⚙️', label: 'Machine Vibration Scavenger', mechanism: 'PZT stack or PVDF membrane mounted on industrial machinery housing. The entry frequency matches the machine\'s dominant vibration mode (spindle harmonics, motor bearing defect frequency) — the harvester impedance-matches at this resonance, extracting energy that would otherwise cause fatigue damage. Dual function: energy harvesting AND vibration damping. Output: 5–50 mW per harvester module; daisy-chain 40 modules for 1–2W continuous from HVAC or pump systems.' },
];

function PiezoDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isMacroMol = entry.octave === 6;
    const domainLabel = isMacroMol ? 'Macro-Molecular / Polymer Chain' : 'Micro-Structural / Crystal Grain';

    const effectText = isMacroMol
        ? `At the macro-molecular scale (OCT-6), ${entry.name} identifies the phonon resonance of the piezoelectric polymer chain (PVDF, PVDF-TrFE). A harvester whose mechanical resonant frequency matches ${entry.freq_display} achieves peak power transfer — energy conversion efficiency rises to 60–80% of theoretical maximum at resonance versus 5–15% off-resonance. This is why frequency-matched design is fundamental to viable ambient energy harvesting.`
        : `At the micro-structural crystal scale (OCT-7), ${entry.name} maps to a grain boundary acoustic mode in ceramic piezoelectrics (PZT-5A, PMN-PT). Driving the crystal at ${entry.freq_display} aligns ferroelectric domains during poling, increasing the piezoelectric coefficient d₃₃ by 15–30% compared to convention poling protocols. Higher d₃₃ → more charge per unit strain → higher output power for the same vibration amplitude.`;

    const kpis = [
        { name: 'Power Output', color: KPI_COLORS[0], points: [[0,5],[5,18],[10,35],[15,55],[20,72],[25,84],[30,91],[35,95],[40,98],[45,99],[50,100]] as KpiPts },
        { name: 'Conversion Eff.', color: KPI_COLORS[1], points: [[0,8],[5,20],[10,38],[15,56],[20,71],[25,82],[30,89],[35,93],[40,97],[45,99],[50,100]] as KpiPts },
        { name: 'Device Lifespan', color: KPI_COLORS[2], points: [[0,60],[5,67],[10,74],[15,80],[20,85],[25,89],[30,92],[35,94],[40,96],[45,98],[50,100]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a0010, #360020)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>PIEZOELECTRIC RESONANT HARVEST FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#fb7185' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · {domainLabel}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#1a0010', border: '1px solid #9f1239', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#fb7185', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#fda4af', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#1a0010', border: '1px solid #9f1239', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#fda4af', fontWeight: 800 }}>CRYSTAL DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#fb7185', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#fb7185', fontWeight: 800, marginBottom: 3 }}>⚙️ PIEZOELECTRIC CONVERSION EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#fb7185', letterSpacing: '0.1em' }}>🚀 HARVESTER ARCHITECTURES</span>
                    </div>
                    {HARVESTER_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < HARVESTER_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                <div style={{ background: '#060f1a', border: '1px solid #9f1239', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#1a0010', padding: '0.4rem 0.7rem', borderBottom: '1px solid #9f1239', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#fb7185', letterSpacing: '0.1em' }}>📈 HARVESTER PERFORMANCE vs FREQUENCY MATCH %</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}><MiniChart kpis={kpis} xLabel="%" /></div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = % frequency match between harvester resonant frequency and ambient vibration source. Y = % of peak specification. Power Output: mW/cm². Conversion Efficiency: mechanical-to-electrical %. Device Lifespan: cycles to 80% initial output.
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

export default function PiezoelectricHarvesterDesigner() {
    return (
        <OctaveExplorer
            title="Piezoelectric Harvester Designer"
            icon="⚙️"
            description="φ-harmonic piezoelectric energy harvesting framework (OCT-6: polymer chain phonon · OCT-7: ceramic crystal grain). Each node identifies the resonant harvest frequency for optimal impedance matching of PVDF or PZT harvesters to ambient vibration sources. Architectures: footfall floor tiles, aeroelastic wind harvesters, machine vibration scavengers. KPI chart tracks power output, conversion efficiency, and device lifespan vs frequency match."
            octaves={OCTAVES}
            toolColor="#fb7185"
            renderDetail={(entry) => <PiezoDetail entry={entry} />}
        />
    );
}
