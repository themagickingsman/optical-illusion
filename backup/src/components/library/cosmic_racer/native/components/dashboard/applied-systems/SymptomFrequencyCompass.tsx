'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [7, 8, 9];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#14b8a6', '#60a5fa', '#a78bfa'];

interface KpiSeries { name: string; points: [number, number][] }
interface Timeline   { total_weeks: number; sessions_per_day: number; session_min: number; kpis: KpiSeries[] }

function KpiChart({ timeline }: { timeline: Timeline }) {
    const { total_weeks, kpis } = timeline;
    const W = 260, H = 100;
    const PAD = { t: 14, r: 8, b: 26, l: 34 };
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (w: number) => PAD.l + (w / total_weeks) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: [number, number][]) =>
        pts.map(([w, v], i) => {
            const x = toX(w), y = toY(v);
            if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            const cx = (toX(pts[i-1][0]) + x) / 2;
            return `C ${cx.toFixed(1)} ${toY(pts[i-1][1]).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{100-v}%</text>)}
            {[0,0.5,1].map(f => { const w=Math.round(f*total_weeks); return <text key={w} x={toX(w)} y={H-3} textAnchor="middle" fontSize={6} fill="#475569">{w}w</text>; })}
            {kpis.map((k, i) => <g key={i} transform={`translate(${PAD.l+i*(IW/kpis.length)},3)`}><line x1="0" x2="9" y1="4" y2="4" stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5}/><text x="12" y="7" fontSize="6" fill={KPI_COLORS[i%KPI_COLORS.length]}>{k.name}</text></g>)}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

const OCTAVE_DATA: Record<number, {
    domain: string; systems: string; color: string;
    delivery: { icon: string; label: string; mechanism: string }[];
    timeline: Timeline;
}> = {
    7: {
        domain: 'Cellular Bioelectric',
        systems: 'Cell membrane potential · ion channels · mitochondrial respiration · ATP production',
        color: '#14b8a6',
        delivery: [
            { icon: '📳', label: 'Micro-Current Stimulation Pad', mechanism: 'Low-level microcurrent (50–1000 µA) delivered via conductive adhesive electrodes over symptom region; re-establishes normal transmembrane potential gradient in dysfunctional cells; sub-sensory — patient feels nothing. 1–2 hr sessions.' },
            { icon: '💡', label: 'NIR Photobiomodulation (810nm)', mechanism: 'Near-infrared 810 nm laser or LED pad at 100 mW/cm² positioned over affected joint or organ; photons activate cytochrome c oxidase, restoring mitochondrial electron transport; increases cellular ATP 30–50% within 20 min. Pain signal reduces as ATP normalises.' },
            { icon: '🔊', label: 'Pulsed Acoustic (LIPUS, 1 MHz)', mechanism: 'LIPUS at 1 MHz / 30 mW/cm² applied by physiotherapist with coupling gel; 20-min sessions 5× per week; activates cell membrane mechanoreceptors and growth factor signalling. FDA-cleared for bone healing; evidence base for tendon and soft tissue.' },
        ],
        timeline: {
            total_weeks: 8, sessions_per_day: 2, session_min: 20,
            kpis: [
                { name: 'Pain VAS',    points: [[0,100],[1,82],[2,65],[3,48],[4,32],[5,18],[6,8],[8,2]] },
                { name: 'Cell ATP',    points: [[0,100],[1,70],[2,50],[3,32],[4,18],[5,8],[6,2],[8,0]] },
                { name: 'Sleep Score', points: [[0,100],[2,80],[4,58],[6,35],[8,10]] },
            ],
        },
    },
    8: {
        domain: 'Neural / Tissue EM',
        systems: 'Brainwaves (δ/θ/α/β/γ) · nerve conduction velocity · tissue fluid dynamics · neuroinflammation',
        color: '#60a5fa',
        delivery: [
            { icon: '〰️', label: 'Neurofeedback Headset (EEG Guided)', mechanism: 'Consumer EEG headset monitors dominant brainwave frequencies in real-time; software guides patient to shift toward target band (e.g., alpha at 10 Hz) via biofeedback game; each 30-min session trains the brain toward healthy resonance pattern autonomously.' },
            { icon: '📡', label: 'Transcranial PEMF Headset', mechanism: 'Pulsed electromagnetic field coil positioned over scalp; delivers 1 mT field at specific brainwave frequency (e.g., 40 Hz gamma for cognitive, 10 Hz alpha for calm); modulates cortical excitability non-invasively; no anaesthesia, outpatient.' },
            { icon: '🎧', label: 'Binaural Beat Audio Therapy', mechanism: 'Two slightly offset tones delivered separately to each ear (e.g., 210 Hz left, 220 Hz right = 10 Hz binaural beat); brain entrains to the difference frequency; shifts dominant EEG band toward target state. Used for sleep, anxiety, focus, pain.' },
        ],
        timeline: {
            total_weeks: 8, sessions_per_day: 1, session_min: 30,
            kpis: [
                { name: 'Anxiety Score', points: [[0,100],[1,88],[2,74],[3,58],[4,42],[5,28],[6,16],[8,5]] },
                { name: 'Sleep Quality',  points: [[0,100],[1,85],[2,68],[3,50],[4,34],[5,20],[6,10],[8,2]] },
                { name: 'Focus (ADHD)',   points: [[0,100],[2,78],[4,55],[6,32],[8,10]] },
            ],
        },
    },
    9: {
        domain: 'Organ / Systemic / Schumann',
        systems: 'Autonomic nervous system · HRV · circadian rhythms · Schumann coupling (7.83 Hz)',
        color: '#a78bfa',
        delivery: [
            { icon: '〰️', label: 'Schumann Resonance Breathing Protocol', mechanism: 'Guided breathing at 7.83 Hz (one breath cycle every ~13 sec); synchronises respiratory sinus arrhythmia to Schumann base frequency; measurably increases HRV within 5 min; patients do 20-min morning and evening sessions — reduces cortisol, improves autonomic balance.' },
            { icon: '📳', label: 'Earthing / Grounding Mat', mechanism: 'Conductive mat connected to ground rod or building earth point; patient stands or sleeps on mat; free electrons from Earth neutralise oxidative stress; measurably reduces blood viscosity within 2 hrs; improves HRV and reduces inflammation markers in 4-week RCTs.' },
            { icon: '〰️', label: 'HRV Biofeedback Device', mechanism: 'Pulse oximeter or chest strap provides continuous HRV data; app guides resonance breathing to entrain autonomic nervous system to Schumann-coherent state; 20-min sessions 2× daily; RMSSD HRV improvement measurable in 2 weeks.' },
        ],
        timeline: {
            total_weeks: 12, sessions_per_day: 2, session_min: 20,
            kpis: [
                { name: 'HRV (RMSSD)', points: [[0,100],[2,85],[4,68],[6,50],[8,34],[10,18],[12,6]] },
                { name: 'Cortisol',    points: [[0,100],[2,88],[4,72],[6,55],[8,36],[10,18],[12,5]] },
                { name: 'Sleep Depth', points: [[0,100],[3,80],[6,58],[9,35],[12,10]] },
            ],
        },
    },
};

function SymptomDetail({ entry }: { entry: OctaveEntry }) {
    const data = OCTAVE_DATA[entry.octave] ?? OCTAVE_DATA[7];
    const isPredicted = entry.status === 'predicted';

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Domain header */}
            <div style={{ background: data.color + '18', border: `1px solid ${data.color}40`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: data.color, fontWeight: 800, marginBottom: 2 }}>🧭 COMPASS DOMAIN — {data.domain}</div>
                <div style={{ fontSize: '0.68rem', color: D.text, lineHeight: 1.5 }}>{data.systems}</div>
            </div>

            {/* Freq display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: D.muted, fontWeight: 800 }}>RESONANCE FREQ</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: data.color, marginTop: 2 }}>{entry.freq_display}</div>
                </div>
                <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: D.muted, fontWeight: 800 }}>SCALE</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: D.text, marginTop: 2 }}>{entry.scale_label}</div>
                </div>
            </div>

            {/* Protocol context */}
            {isPredicted ? (
                <div style={{ background: '#1a0a2a', border: '1px solid #6b21a8', borderRadius: 8, padding: '0.65rem' }}>
                    <div style={{ fontSize: '0.42rem', color: '#a78bfa', fontWeight: 800, marginBottom: 2 }}>◌ FRAMEWORK PREDICTION</div>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#6b21a8', lineHeight: 1.5 }}>
                        φ-harmonic position at {entry.freq_display} — no confirmed biological oscillation here yet. The framework predicts a resonant node: possibly a sub-harmonic of a known brain rhythm or an uncharacterised bioelectric mode.
                    </p>
                </div>
            ) : (
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

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 PREDICTED SYMPTOM RESOLUTION</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>
                            {data.timeline.sessions_per_day}× daily · {data.timeline.session_min}min · {data.timeline.total_weeks}w
                        </span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={data.timeline} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        Y-axis = % symptom burden remaining. 0% = healthy resonance restored.
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

export default function SymptomFrequencyCompass() {
    return (
        <OctaveExplorer
            title="Symptom → Frequency Compass"
            icon="🧭"
            description="φ-harmonic symptom-to-frequency mapping (OCT-7: cellular bioelectric · OCT-8: neural/tissue EM · OCT-9: organ/Schumann/autonomic). Each node shows the body system domain, delivery systems (neurofeedback, micro-current, PEMF, binaural beats, Schumann breathing, grounding), and a predicted KPI recovery chart for pain, anxiety, HRV, and sleep."
            octaves={OCTAVES}
            toolColor="#14b8a6"
            renderDetail={(entry) => <SymptomDetail entry={entry} />}
        />
    );
}
