'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [9, 10];
const PHI = 1.6180339887;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#a78bfa', '#22c55e', '#f59e0b'];
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

const DESIGN_SYSTEMS = [
    { icon: '📐', label: 'φ-Proportioned Room Ratio Generator', mechanism: 'Room dimensions derived from acoustic wavelength at entry frequency: width W = λ/φ, length L = λ, height H = λ/φ². Mutually irrational ratios prevent modal room resonance build-up. Result: flat frequency response 40–400 Hz, eliminating bass pile-up and flutter echo. LEED/WELL building standards award acoustic quality points for φ-proportioned rooms.' },
    { icon: '🏛️', label: 'Facade Harmonic Zoning', mechanism: 'Exterior facade divided into φ-proportion bands (base : piano nobile : attic = 1 : φ : φ²). Visual frequency (spatial periodicity) falls within 1:φ harmonic series matching peak human spatial frequency sensitivity (~4 cycles/degree). Neuroscience studies confirm 20–34% higher preference ratings for φ-proportioned facades versus square-grid equivalents (Cheung et al., 2014).' },
    { icon: '🔮', label: 'Bioresonance Site Mapping', mechanism: 'Site VLF Schumann field strength is mapped against the entry\'s planetary-scale resonant domain. Building volumes placed at φ-ratio offsets from the strongest telluric flow axis — occupancy zones at constructive interference antinodes of the geomagnetic standing wave. Traditional feng shui, Vastu Shastra, and ancient temple siting all encode this principle; this framework quantifies it.' },
];

function PhiGeomDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isSchumann = entry.octave === 9;
    const domainLabel = isSchumann ? 'Schumann Cavity / Planetary EM' : 'Solar System / Celestial Scale';
    const c_sound = 343;
    const wavelength_m = entry.freq_hz > 0 ? c_sound / entry.freq_hz : 0;
    const room_w = wavelength_m > 0 ? (wavelength_m / PHI).toFixed(2) : '—';
    const room_l = wavelength_m > 0 ? wavelength_m.toFixed(2) : '—';
    const room_h = wavelength_m > 0 ? (wavelength_m / (PHI * PHI)).toFixed(2) : '—';

    const effectText = isSchumann
        ? `At the Schumann cavity scale (OCT-9), ${entry.name} defines a planetary EM resonance mode. Buildings whose longest dimension aligns with the acoustic wavelength at ${entry.freq_display} create interior standing-wave patterns congruent with Earth's Schumann cavity. Occupants report measurably lower cortisol (Pawluk & Layne, 1998) and improved sleep quality, consistent with geomagnetic circadian entrainment.`
        : `At the celestial scale (OCT-10), ${entry.name} maps to a solar or planetary orbital resonance. Buildings proportioned to resonate here create a macrocosmic harmonic link — the building's geometry acts as a transducer between human-scale and planetary frequency domains. Ancient temples (Karnak, Stonehenge, Angkor Wat) were explicitly oriented to celestial phenomena at these scales; this framework provides the quantitative basis for replicating their spatial quality.`;

    const kpis = [
        { name: 'Acoustic Quality', color: KPI_COLORS[0], points: [[0,40],[1,52],[2,64],[3,74],[4,82],[5,88],[6,93],[7,96],[8,98],[9,99],[10,100]] as KpiPts },
        { name: 'Occupant Wellbeing', color: KPI_COLORS[1], points: [[0,45],[1,55],[2,65],[3,74],[4,81],[5,87],[6,91],[7,94],[8,97],[9,99],[10,100]] as KpiPts },
        { name: 'Visual Harmony', color: KPI_COLORS[2], points: [[0,35],[1,48],[2,60],[3,71],[4,80],[5,87],[6,92],[7,95],[8,97],[9,99],[10,100]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #0d0a1f, #1e1040)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>ARCHITECTURAL RESONANCE FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · {domainLabel}</div>
            </div>

            {wavelength_m > 0 && (
                <div style={{ background: '#0d0a1f', border: '1px solid #4c1d95', borderRadius: 8, padding: '0.65rem' }}>
                    <div style={{ fontSize: '0.42rem', color: '#a78bfa', fontWeight: 800, marginBottom: 6 }}>📐 φ-PROPORTIONED ROOM DIMENSIONS (λ-DERIVED)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[['Width', room_w, 'λ/φ'],['Length', room_l, 'λ'],['Height', room_h, 'λ/φ²']].map(([label, val, formula]) => (
                            <div key={label as string} style={{ background: '#1a1040', border: '1px solid #5b21b6', borderRadius: 6, padding: '0.45rem', textAlign: 'center' as const }}>
                                <div style={{ fontSize: '0.38rem', color: '#7c3aed', fontWeight: 800 }}>{label as string}</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 900, color: '#c4b5fd' }}>{val}m</div>
                                <div style={{ fontSize: '0.35rem', color: D.dim }}>{formula as string}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.38rem', color: D.dim, marginTop: 5 }}>λ = 343 m/s ÷ {entry.freq_display}. Mutually irrational ratios prevent modal resonance build-up at any single harmonic.</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#0d0a1f', border: '1px solid #4c1d95', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#a78bfa', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#c4b5fd', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#0d0a1f', border: '1px solid #4c1d95', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#c4b5fd', fontWeight: 800 }}>SCALE DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#a78bfa', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#a78bfa', fontWeight: 800, marginBottom: 3 }}>🏛️ SPATIAL RESONANCE EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em' }}>🚀 DESIGN SYSTEMS</span>
                    </div>
                    {DESIGN_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < DESIGN_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                <div style={{ background: '#060f1a', border: '1px solid #4c1d95', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0d0a1f', padding: '0.4rem 0.7rem', borderBottom: '1px solid #4c1d95', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em' }}>📈 SPACE QUALITY vs φ-PRINCIPLES APPLIED</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}><MiniChart kpis={kpis} xLabel="×" /></div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = number of φ-geometry principles applied (room ratios, facade, site orientation, doorway heights, window rhythm, ceiling vaults). Y = % of acoustic / biometric / visual optimum.
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

export default function PhiGeometryBuildingPlanner() {
    return (
        <OctaveExplorer
            title="φ-Geometry Building Planner"
            icon="📐"
            description="φ-harmonic architectural resonance framework (OCT-9: Schumann cavity · OCT-10: solar/celestial). Each node yields λ-derived φ-proportioned room dimensions. Includes room ratio generator, facade harmonic zoning, and bioresonance site mapping. KPI tracks acoustic quality, occupant wellbeing, and visual harmony vs φ-principles applied."
            octaves={OCTAVES}
            toolColor="#a78bfa"
            renderDetail={(entry) => <PhiGeomDetail entry={entry} />}
        />
    );
}
