'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [8, 9];
const SCHUMANN_HZ = [7.83, 14.3, 20.8, 27.3, 33.8, 39, 45.5];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#f59e0b', '#ef4444', '#4ade80'];

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

function isSchumannHazard(hz: number) {
    for (const s of SCHUMANN_HZ) {
        const pct = Math.abs(hz - s) / s;
        if (pct < 0.03) return { isHazard: true, nearSchumann: s, hazardLevel: 'HIGH' as const };
        if (pct < 0.12) return { isHazard: true, nearSchumann: s, hazardLevel: 'MEDIUM' as const };
    }
    return { isHazard: false, nearSchumann: null, hazardLevel: 'LOW' as const };
}

const MITIGATION = [
    { icon: '📐', label: 'Floor Height Tuning', mechanism: 'Adjust floor-to-ceiling height to detune fundamental resonance by ≥15% from nearest Schumann harmonic. Target floor count ± 2 from calculated resonant floor count. Use φ-proportioned floor heights (3.24m, 5.24m) to distribute modal energy across non-resonant sub-modes.' },
    { icon: '⚡', label: 'Tuned Mass Damper (TMD)', mechanism: 'Heavy suspended mass (1–2% of building mass) on viscous dampers, tuned to building natural frequency; reduces vibration amplitude at resonant frequency by 40–90%. Used in skyscrapers (Taipei 101, Shanghai Tower) and bridges subject to vortex shedding.' },
    { icon: '🔲', label: 'φ-Proportioned Cross Bracing', mechanism: 'Diagonal bracing at φ-ratio angles (31.7°, 58.3°) distributes modal energy across multiple non-resonant structural modes; prevents energy concentration at fundamental frequency. Natural frequency shifts ±20-35% from baseline.' },
    { icon: '🧲', label: 'Viscoelastic Base Isolation', mechanism: 'Lead-rubber bearing or friction pendulum isolators at foundation; isolate superstructure from ground motion at frequencies above 0.5 Hz; reduce transmitted acceleration by 60–90% during seismic or Schumann-coupled events.' },
];

function StructuralDetail({ entry }: { entry: OctaveEntry }) {
    const hz = entry.freq_hz;
    const hazard = isSchumannHazard(hz);
    const hColor = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#4ade80' };
    const hBg    = { HIGH: '#1c0a0a', MEDIUM: '#1a1005', LOW: '#06160a' };
    const hBorder = { HIGH: '#7f1d1d', MEDIUM: '#92400e', LOW: '#14532d' };
    const col = hColor[hazard.hazardLevel];

    const v_shear = entry.octave === 8 ? 250 : 2500;
    const building_height_m = hz > 0 ? v_shear / (4 * hz) : 0;
    const floors = Math.round(building_height_m / 3.5);
    const isPredicted = entry.status === 'predicted';

    const kpis = [
        { name: 'Structural Risk',  color: KPI_COLORS[0], points: [[0,100],[2,80],[4,62],[6,46],[8,33],[10,22],[12,14],[16,7],[20,2]] as KpiPts },
        { name: 'Resonance Amp.',   color: KPI_COLORS[1], points: [[0,100],[2,75],[4,55],[6,38],[8,25],[10,15],[12,8],[16,3],[20,1]] as KpiPts },
        { name: 'Occupant Comfort', color: KPI_COLORS[2], points: [[0,100],[2,82],[4,65],[6,48],[8,32],[10,20],[12,10],[16,4],[20,1]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>STRUCTURAL FUNDAMENTAL FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>
                    Implied height: {building_height_m.toFixed(1)} m · ~{floors} floors · v_shear = {v_shear} m/s ({entry.octave === 8 ? 'timber/steel' : 'RC/masonry'})
                </div>
            </div>

            {/* Hazard badge */}
            <div style={{ background: hBg[hazard.hazardLevel], border: `2px solid ${hBorder[hazard.hazardLevel]}`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.5rem', color: col, fontWeight: 900, marginBottom: 3 }}>
                    SCHUMANN COUPLING — {hazard.hazardLevel}
                    {hazard.nearSchumann && ` · Overlaps ${hazard.nearSchumann} Hz harmonic`}
                </div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: D.text, lineHeight: 1.5 }}>
                    {hazard.hazardLevel === 'HIGH'
                        ? `Fundamental frequency is within 3% of Schumann ${hazard.nearSchumann} Hz. Direct coupling to Earth's electromagnetic cavity possible. Amplified oscillation during geomagnetic K-index events ≥ 5. Immediate mitigation recommended for occupied structures.`
                        : hazard.hazardLevel === 'MEDIUM'
                        ? `Within 12% of Schumann harmonic ${hazard.nearSchumann} Hz. Partial coupling during solar storm periods. Sensitive laboratory instruments and occupants in this structure may experience EM interference during elevated geomagnetic activity.`
                        : `No Schumann harmonic overlap at ${entry.freq_display}. Structure resonates in a geomagnetically quiet zone — safe for sensitive equipment and resonant architecture.`
                    }
                </p>
            </div>

            {/* Mitigation systems */}
            {hazard.isHazard && !isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🏗️ MITIGATION SYSTEMS</span>
                    </div>
                    {MITIGATION.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < MITIGATION.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{ds.mechanism}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* If safe zone — design benefits */}
            {!hazard.isHazard && !isPredicted && (
                <div style={{ background: '#06160a', border: '1px solid #14532d', borderRadius: 8, padding: '0.65rem' }}>
                    <div style={{ fontSize: '0.42rem', color: '#4ade80', fontWeight: 800, marginBottom: 3 }}>✅ DESIGN OPPORTUNITIES</div>
                    <div style={{ fontSize: '0.68rem', color: '#86efac', lineHeight: 1.55 }}>
                        No Schumann interference at {entry.freq_display}. This site is suitable for:
                        Sensitive biomagnetic measurement labs · Healing / retreat architecture ·
                        Precision instrument facilities · Resonant geometry experiments (Schumann-tuned buildings).
                    </div>
                </div>
            )}

            {/* Risk reduction chart */}
            {!isPredicted && hazard.isHazard && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 RISK REDUCTION vs MITIGATION MEASURES</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel=" mx" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = mitigation measures implemented (1 = floor tuning, 4 = TMD, 8 = φ-bracing, 16 = base isolation + all). Y = % of initial risk remaining.
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

export default function StructuralResonanceAnalyzer() {
    return (
        <OctaveExplorer
            title="Structural Resonance Analyzer"
            icon="🏛️"
            description="φ-harmonic structural resonance framework (OCT-8: building/EM · OCT-9: Schumann cavity). Each node shows implied building height, Schumann coupling hazard rating (HIGH/MEDIUM/LOW), 4 mitigation systems (floor tuning, tuned mass dampers, φ-bracing, base isolation) with engineering mechanisms, and a risk reduction chart vs mitigation measures applied."
            octaves={OCTAVES}
            toolColor="#f59e0b"
            renderDetail={(entry) => <StructuralDetail entry={entry} />}
        />
    );
}
