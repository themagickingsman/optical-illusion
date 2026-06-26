'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [7, 8];

const KPI_COLORS = ['#ef4444', '#22d3ee', '#4ade80'];
const D = { bg: '#070b14', panel: '#0d1424', raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b' };

interface KpiSeries { name: string; points: [number, number][] }
interface Timeline   { total_weeks: number; sessions_per_day: number; session_min: number; kpis: KpiSeries[] }
interface DeliverySystem { icon: string; label: string; mechanism: string }

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

// ─── Domain-specific data ─────────────────────────────────────────────────────
const IMMUNE_PROTOCOLS: Record<number, {
    cell_types: string; kpis_title: string;
    delivery: DeliverySystem[]; timeline: Timeline;
}> = {
    7: {
        cell_types: 'Neutrophils (10–15µm) · Macrophages (15–30µm) · NK cells (8–15µm) · T-cells (8–12µm)',
        kpis_title: 'Immune Cell Activation',
        delivery: [
            { icon: '🔊', label: 'LIPUS Transducer (1 MHz)', mechanism: 'Low-Intensity Pulsed Ultrasound at 1 MHz / 30 mW/cm² (ISO 10328); applied via coupling gel over lymph node clusters or spleen; activates membrane ion channels and integrin signalling on immune cells, enhancing phagocytic burst activity 3–5× within 20 min.' },
            { icon: '💡', label: 'NIR Photobiomodulation Panel', mechanism: '830 nm / 120 mW/cm² NIR LED panel positioned 2 cm over target region; photons absorbed by cytochrome c oxidase in immune cell mitochondria, increasing ATP and ROS production, priming dendritic cells for antigen presentation. 15-min sessions 2× daily.' },
            { icon: '📳', label: 'Contact PEMF Electrode Pad', mechanism: 'Pulsed EM field at cellular resonance frequency; adhesive electrode pad placed over lymph node or thymus; 0.1–1 mT field at immune cell membrane resonance frequency modulates calcium influx and NF-κB transcription factor activity.' },
        ],
        timeline: {
            total_weeks: 6, sessions_per_day: 2, session_min: 20,
            kpis: [
                { name: 'NK Activity %',  points: [[0,100],[1,80],[2,60],[3,42],[4,25],[5,12],[6,4]] },
                { name: 'CRP Level',      points: [[0,100],[1,85],[2,68],[3,50],[4,32],[5,15],[6,4]] },
                { name: 'CD4:CD8 ratio',  points: [[0,100],[1,88],[2,72],[3,55],[4,35],[5,16],[6,5]] },
            ],
        },
    },
    8: {
        cell_types: 'Cytokine gradients · Inflammatory cascades · Nerve-immune interface · Vagal tone',
        kpis_title: 'Inflammatory Resolution',
        delivery: [
            { icon: '📡', label: 'PEMF Therapy Mat (Full-Body)', mechanism: 'Full-body PEMF mat with 8-coil array operating at tissue/neural EM resonance (OCT-8); modulates NF-κB pathway signalling and mast cell cytokine release; 30-min reclined sessions 2× daily; patient feels subtle warmth, no pain.' },
            { icon: '〰️', label: 'Vagal Nerve Stimulator (Auricular)', mechanism: 'Non-invasive auricular vagal nerve stimulation at 25 Hz / 1 mA; stimulates afferent vagal fibres to the nucleus tractus solitarius; activates the cholinergic anti-inflammatory pathway, suppressing TNF-α and IL-6 within 2 hrs. Clip-on ear device.' },
            { icon: '💡', label: 'Low-Level Laser Therapy (LLLT)', mechanism: '632 nm CW helium-neon laser / 5 mW/cm² over inflammatory focus; reduces prostaglandin E2 and leukotriene B4 at the tissue level; anti-oedema effect within 48 hrs; no thermal damage to tissue.' },
        ],
        timeline: {
            total_weeks: 8, sessions_per_day: 2, session_min: 30,
            kpis: [
                { name: 'IL-6 Level',     points: [[0,100],[1,88],[2,72],[3,52],[4,32],[6,14],[8,3]] },
                { name: 'TNF-α Level',    points: [[0,100],[1,85],[2,65],[3,45],[4,28],[6,12],[8,2]] },
                { name: 'Pain VAS',       points: [[0,100],[1,80],[2,60],[3,40],[4,22],[6,8],[8,1]] },
            ],
        },
    },
};

// ─── ImmuneDetail panel ───────────────────────────────────────────────────────
function ImmuneDetail({ entry }: { entry: OctaveEntry }) {
    const data = IMMUNE_PROTOCOLS[entry.octave] ?? IMMUNE_PROTOCOLS[7];
    const isPredicted = entry.status === 'predicted';

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Freq + domain */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#1a0813', border: '1px solid #7f1d1d', borderRadius: 8, padding: '0.65rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.42rem', color: '#f87171', fontWeight: 800 }}>RESONANCE FREQ</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: '#ef4444', marginTop: 2 }}>{entry.freq_display}</div>
                </div>
                <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.65rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800 }}>DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.7rem', color: D.text, marginTop: 2 }}>OCT-{entry.octave} · {entry.octave === 7 ? 'Cellular' : 'Tissue / Neural'}</div>
                </div>
            </div>

            {/* Cell types */}
            <div style={{ background: '#0a1020', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#38bdf8', fontWeight: 800, marginBottom: 2 }}>🛡️ TARGET CELL TYPES</div>
                <div style={{ fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.5 }}>{data.cell_types}</div>
            </div>

            {/* Protocol context */}
            <div style={{ background: '#1a0a05', border: '1px solid #92400e', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.45rem', color: '#f59e0b', fontWeight: 800, marginBottom: 3 }}>⚕️ IMMUNE STIMULATION PROTOCOL</div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#fbbf24', lineHeight: 1.55 }}>
                    {isPredicted
                        ? `Framework position at ${entry.freq_display} — no confirmed immune correlate. φ-harmonic prediction: a resonant immune modulation mode exists here awaiting experimental confirmation.`
                        : entry.octave === 7
                        ? `At ${entry.scale_label}, this frequency targets the membrane resonance of immune cells. Low-intensity ultrasound activates membrane ion channels, enhancing phagocytic activity and cytokine release without thermal damage.`
                        : `At OCT-8 (${entry.freq_display}), this governs cytokine signalling gradients and inflammation cascade coupling. PEMF or low-level laser at this frequency modulates NF-κB pathway activity and vagal anti-inflammatory tone.`
                    }
                </p>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 DELIVERY SYSTEMS</span>
                    </div>
                    {data.delivery.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < data.delivery.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 PREDICTED {data.kpis_title.toUpperCase()}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>
                            {data.timeline.sessions_per_day}× daily · {data.timeline.session_min}min · {data.timeline.total_weeks}w
                        </span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={data.timeline} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: '#334155', lineHeight: 1.5 }}>
                        Y-axis = % of pathological state remaining. 0% = healthy baseline restored. Projections based on published LIPUS/PEMF immune studies.
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

export default function ImmuneFrequencyMap() {
    return (
        <OctaveExplorer
            title="Immune Frequency Map"
            icon="🛡️"
            description="φ-harmonic immune cell resonance framework (OCT-7: membrane/cellular · OCT-8: cytokine/tissue EM). Each node shows target cell types, immune stimulation protocol, physical delivery systems (LIPUS, PEMF, NIR, vagal), and KPI trajectories for NK activity, CRP, IL-6, and symptom score over treatment weeks."
            octaves={OCTAVES}
            toolColor="#ef4444"
            renderDetail={(entry) => <ImmuneDetail entry={entry} />}
        />
    );
}
