'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [6, 7];

// ─── Types ───────────────────────────────────────────────────────────────────
interface DeliverySystem { icon: string; label: string; mechanism: string }
interface KpiSeries      { name: string; points: [number, number][] }
interface Timeline        { total_weeks: number; sessions_per_day: number; session_min: number; kpis: KpiSeries[] }

const KPI_COLORS = ['#f97316', '#818cf8', '#22c55e'];

// ─── KPI Chart ───────────────────────────────────────────────────────────────
function KpiChart({ timeline }: { timeline: Timeline }) {
    const { total_weeks, kpis } = timeline;
    const W = 260, H = 110;
    const PAD = { t: 16, r: 8, b: 28, l: 36 };
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (w: number) => PAD.l + (w / total_weeks) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: [number, number][]) =>
        pts.map(([w, v], i) => {
            const x = toX(w), y = toY(v);
            if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            const [pw, pv] = pts[i - 1];
            const cx = (toX(pw) + x) / 2;
            return `C ${cx.toFixed(1)} ${toY(pv).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * total_weeks));
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 25, 50, 75, 100].map(v => (
                <line key={v} x1={PAD.l} x2={W - PAD.r} y1={toY(v)} y2={toY(v)}
                    stroke="#1e293b" strokeWidth={v === 0 || v === 100 ? 1 : 0.5} strokeDasharray={v === 0 ? '' : '3,3'} />
            ))}
            {[0, 50, 100].map(v => (
                <text key={v} x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#475569">{100 - v}%</text>
            ))}
            {xTicks.map(w => (
                <text key={w} x={toX(w)} y={H - 4} textAnchor="middle" fontSize={6.5} fill="#475569">{w}w</text>
            ))}
            {kpis.map((k, i) => (
                <g key={i} transform={`translate(${PAD.l + i * (IW / kpis.length)}, 4)`}>
                    <line x1={0} x2={10} y1={4} y2={4} stroke={KPI_COLORS[i % KPI_COLORS.length]} strokeWidth={1.5} />
                    <text x={13} y={7} fontSize={6.5} fill={KPI_COLORS[i % KPI_COLORS.length]}>{k.name}</text>
                </g>
            ))}
            {kpis.map((k, i) => (
                <path key={i} d={curve(k.points)} fill="none"
                    stroke={KPI_COLORS[i % KPI_COLORS.length]} strokeWidth={1.5} strokeLinecap="round" />
            ))}
        </svg>
    );
}

const D = { bg: '#070b14', panel: '#0d1424', raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b' };

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.3rem 0', borderBottom: `1px solid ${D.border}` }}>
            <span style={{ fontSize: '0.55rem', color: D.muted }}>{label}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace', color: color ?? D.text }}>{value}</span>
        </div>
    );
}

// ─── Gene-specific protocol data ─────────────────────────────────────────────
interface GeneProtocol { delivery: DeliverySystem[]; timeline: Timeline; application: { target: string; mechanism: string } }

function deriveGeneProtocol(entry: OctaveEntry): GeneProtocol {
    const fHz = entry.freq_hz;
    const isMolecular = entry.octave <= 5;

    const deliveryMolecular: DeliverySystem[] = [
        { icon: '💡', label: 'THz Pulsed Field Emitter', mechanism: 'Terahertz time-domain spectroscopy pulse source; delivers sub-picosecond pulses tuned to molecular resonance; targets protein conformational state and DNA/RNA strand vibration modes without ionisation. Standard benchtop unit, contact-free, 1 cm beam.' },
        { icon: '📡', label: 'NIR Photobiomodulation Probe', mechanism: 'Near-infrared laser diode (808–1064 nm) delivers photons matched to cytochrome c oxidase and DNA repair complex absorption; promotes ATP synthesis and upregulates gene repair pathways; contact probe at 200 mW/cm², 10-min sessions.' },
        { icon: '📳', label: 'Bioresonance Frequency Generator', mechanism: 'Programmable Rife-type frequency generator driving a contact electrode pad; outputs the specific fRRM frequency matched to this entry\'s protein class; 10 µA current, palmar electrode contact.' },
    ];
    const deliveryCellular: DeliverySystem[] = [
        { icon: '🔊', label: 'LIPUS Transducer (1 MHz)', mechanism: 'Low-Intensity Pulsed Ultrasound at 1 MHz / 30 mW/cm²; activates stretch-sensitive ion channels on cell membrane, triggering downstream gene expression pathways (Wnt, MAPK, NF-κB); applied via contact gel pad over target organ.' },
        { icon: '📡', label: 'PEMF Gene Expression Mat', mechanism: 'Pulsed Electromagnetic Field mat at tissue-level resonance; modulates intracellular calcium signalling and promotes growth factor gene expression; whole-body or targeted pad, 0.1–1 mT, 30-min daily sessions.' },
        { icon: '💉', label: 'Frequency-Encoded Nanoparticle (IV)', mechanism: 'Lipid nanoparticles loaded with piezoelectric material matched to cellular resonant frequency; administered IV; preferentially deposit in target tissue and resonate with external LIPUS field to enhance local gene expression.' },
    ];

    const delivery = isMolecular ? deliveryMolecular : deliveryCellular;

    const timeline: Timeline = {
        total_weeks: isMolecular ? 4 : 8,
        sessions_per_day: 2, session_min: isMolecular ? 10 : 30,
        kpis: [
            { name: 'Gene Expression Δ', points: isMolecular
                ? [[0,100],[1,78],[2,55],[3,30],[4,10]]
                : [[0,100],[1,88],[2,72],[3,55],[5,35],[8,12]] },
            { name: 'Protein Binding %', points: isMolecular
                ? [[0,100],[1,70],[2,45],[3,22],[4,5]]
                : [[0,100],[2,80],[4,58],[6,32],[8,8]] },
            { name: 'ATP Output',         points: isMolecular
                ? [[0,100],[1,65],[2,40],[3,20],[4,5]]
                : [[0,100],[2,75],[4,52],[6,28],[8,6]] },
        ],
    };

    const application = {
        target: isMolecular
            ? 'DNA repair complexes, protein folding chaperones, transcription factor binding sites'
            : 'Cell membrane ion channels, organelle membranes, gene regulatory networks',
        mechanism: isMolecular
            ? `At the RRM fRRM scale, proteins sharing this frequency value couple to the same class of biological ligands. Targeted delivery at this frequency modulates binding affinity without chemical intervention.`
            : `At the cellular scale (OCT-${entry.octave}), membrane resonance at ${entry.freq_display} activates mechanosensitive channels, propagating signal cascades that alter gene transcription within minutes.`,
    };

    return { delivery, timeline, application };
}

// ─── GeneDetail panel ─────────────────────────────────────────────────────────
function GeneDetail({ entry }: { entry: OctaveEntry }) {
    const fRRM = (entry.freq_hz / 3e14).toFixed(6);
    const lambdaNm = entry.radius_au * 1.495978707e11 / 1e-9;
    const isPredicted = entry.status === 'predicted';
    const proto = deriveGeneProtocol(entry);

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* RRM + frequency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                {[
                    { l: 'fRRM Scale', v: fRRM,                              c: '#f97316' },
                    { l: 'λ (nm)',     v: `${lambdaNm.toFixed(1)} nm`,       c: '#818cf8' },
                    { l: 'Frequency',  v: entry.freq_display,                c: '#22c55e' },
                ].map(p => (
                    <div key={p.l} style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem', textAlign: 'center' as const }}>
                        <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800 }}>{p.l}</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: p.c, marginTop: 2 }}>{p.v}</div>
                    </div>
                ))}
            </div>

            {/* RRM framework */}
            <div style={{ background: '#1a0a05', border: '1px solid #92400e', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.45rem', color: '#f97316', fontWeight: 800, marginBottom: 3 }}>🧬 COSIC RRM FRAMEWORK</div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#fbbf24', lineHeight: 1.55 }}>
                    {isPredicted
                        ? `Predicted framework position at fRRM ${fRRM}. The φ-harmonic system expects a biologically relevant resonance here — no known gene or protein confirmed at this spectral position. Open for experimental validation.`
                        : `${entry.name} maps to fRRM ${fRRM}. Proteins sharing this RRM value interact with the same class of biological targets regardless of amino acid sequence similarity (Cosic 1994).`
                    }
                </p>
            </div>

            {/* Application target */}
            {!isPredicted && (
                <div style={{ background: '#0a1020', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                    <div style={{ fontSize: '0.45rem', color: '#38bdf8', fontWeight: 800, marginBottom: 3 }}>🎯 APPLICATION TARGET</div>
                    <div style={{ fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.5, marginBottom: 6 }}>{proto.application.target}</div>
                    <div style={{ fontSize: '0.45rem', color: '#64748b', fontWeight: 700, marginBottom: 2 }}>MECHANISM</div>
                    <p style={{ margin: 0, fontSize: '0.67rem', color: '#475569', lineHeight: 1.5 }}>{proto.application.mechanism}</p>
                </div>
            )}

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 DELIVERY SYSTEMS</span>
                    </div>
                    {proto.delivery.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < proto.delivery.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 PREDICTED RESPONSE TRAJECTORY</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>
                            {proto.timeline.sessions_per_day}× daily · {proto.timeline.session_min}min · {proto.timeline.total_weeks}w
                        </span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={proto.timeline} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: '#334155', lineHeight: 1.5 }}>
                        Y-axis = % change from baseline. 0% = target state reached. Projections at therapeutic dose applied consistently.
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

export default function GeneFrequencyProfile() {
    return (
        <OctaveExplorer
            title="Gene Frequency Profile"
            icon="🧬"
            description="φ-harmonic gene and protein resonance framework (Cosic RRM, OCT-6/7). Each node maps to the Resonant Recognition Model fRRM scale — proteins sharing a frequency value share biological target class. Includes delivery systems, application targets, and predicted gene expression response trajectories."
            octaves={OCTAVES}
            toolColor="#f97316"
            renderDetail={(entry) => <GeneDetail entry={entry} />}
        />
    );
}
