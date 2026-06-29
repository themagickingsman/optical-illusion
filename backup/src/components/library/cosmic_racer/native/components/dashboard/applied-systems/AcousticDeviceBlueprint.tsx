'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [7, 8];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };

interface KpiSeries { name: string; points: [number, number][] }
interface Timeline   { total_sessions: number; session_min: number; kpis: KpiSeries[] }
const KPI_COLORS = ['#6366f1', '#22d3ee', '#4ade80'];

function KpiChart({ timeline }: { timeline: Timeline }) {
    const { total_sessions, kpis } = timeline;
    const W = 260, H = 100;
    const PAD = { t: 14, r: 8, b: 26, l: 34 };
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (s: number) => PAD.l + (s / total_sessions) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: [number, number][]) =>
        pts.map(([s, v], i) => {
            const x = toX(s), y = toY(v);
            if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            const cx = (toX(pts[i - 1][0]) + x) / 2;
            return `C ${cx.toFixed(1)} ${toY(pts[i-1][1]).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{100-v}%</text>)}
            {[0,0.5,1].map(f => { const s=Math.round(f*total_sessions); return <text key={s} x={toX(s)} y={H-3} textAnchor="middle" fontSize={6} fill="#475569">{s}sx</text>; })}
            {kpis.map((k, i) => (<g key={i} transform={`translate(${PAD.l+i*(IW/kpis.length)},3)`}><line x1={0} x2={9} y1={4} y2={4} stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5}/><text x={12} y={7} fontSize={6} fill={KPI_COLORS[i%KPI_COLORS.length]}>{k.name}</text></g>))}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={KPI_COLORS[i%KPI_COLORS.length]} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

function deriveDeviceSpec(freqHz: number) {
    const SCHUMANN = [7.83, 14.3, 20.8, 27.3, 33.8, 39, 45.5];
    const isCellular = freqHz > 1e3;
    const deviceClass = freqHz < 20e3 ? 'Infrasound / Physiotherapy (< 20 kHz)'
        : freqHz < 200e3  ? 'Therapeutic Ultrasound (20–200 kHz)'
        : freqHz < 5e6    ? 'HIFU / LIPUS (200 kHz–5 MHz)'
        : freqHz < 100e6  ? 'Microacoustic / MEMS (5–100 MHz)'
        : 'Piezo Nano-transducer / SAW (> 100 MHz)';
    const material = freqHz < 1e6 ? 'PZT-4 (lead zirconate titanate)'
        : freqHz < 100e6  ? 'PZT-5A / PVDF polymer film'
        : 'Lithium niobate (LiNbO₃) / AlN thin film';
    const power = freqHz < 1e6 ? '0.1–1 W/cm²' : freqHz < 100e6 ? '10–100 mW/cm²' : '< 1 mW/cm²';
    const pulse = freqHz < 20e3 ? 'CW or 1–10 ms burst' : freqHz < 5e6 ? '1–10 µs burst · 10% duty' : 'CW';
    const beam = freqHz > 1e6 ? 'Focused (f/1.5 piezo lens)' : 'Planar / unfocused';
    return { deviceClass, material, power, pulse, beam };
}

const DELIVERY_BY_OCTAVE: Record<number, { icon: string; label: string; mechanism: string }[]> = {
    7: [
        { icon: '🔊', label: 'Contact Ultrasound Probe', mechanism: 'Handheld PZT transducer with sterile coupling gel; pressed against skin over target tissue; near-field planar or focused beam delivers therapeutic acoustic energy precisely at cell membrane resonance. Standard physiotherapy clinical device.' },
        { icon: '📳', label: 'Wearable Adhesive Transducer', mechanism: 'Flexible PVDF piezo-polymer disk embedded in self-adhesive patch; worn continuously over treatment area; powered by coin-cell or wearable unit; 8–12 hr passive therapy sessions without clinical attendance.' },
        { icon: '🔊', label: 'Ultrasonic Bath (Immersion)', mechanism: 'Extremity (hand/foot) immersed in water tank with underwater transducer array; uniform field surrounds tissue from all angles; ideal for diffuse conditions like arthritis or peripheral neuropathy. Tank maintained at 37°C.' },
    ],
    8: [
        { icon: '📡', label: 'PEMF Coil Mat', mechanism: 'Flexible coil array generating pulsed EM field at tissue-level resonance (OCT-8: Hz range); patient lies or sits on mat; field penetrates full body depth without attenuation; addresses systemic inflammation, autonomic dysregulation.' },
        { icon: '🔊', label: 'Low-Frequency Acoustic Chair', mechanism: 'Resonant chair or bed frame with embedded low-frequency transducers (< 20 kHz); patient sits/lies and receives whole-body vibroacoustic stimulation; used in pain management, MS, Parkinson\'s, and depression protocols.' },
        { icon: '〰️', label: 'Vagal / Neural Entrainment Device', mechanism: 'Auricular or transcutaneous vagal nerve stimulator operating at OCT-8 neural frequencies; clips to ear tragus; modulates autonomic nervous system and dampens systemic inflammation via cholinergic pathway. 20-min sessions.' },
    ],
};

function BlueprintDetail({ entry }: { entry: OctaveEntry }) {
    const spec = deriveDeviceSpec(entry.freq_hz);
    const delivery = DELIVERY_BY_OCTAVE[entry.octave] ?? DELIVERY_BY_OCTAVE[7];
    const isPredicted = entry.status === 'predicted';

    const timeline: Timeline = {
        total_sessions: 12, session_min: entry.octave === 7 ? 20 : 30,
        kpis: entry.octave === 7
            ? [
                { name: 'Output Power', points: [[0,0],[2,40],[4,65],[6,80],[8,88],[10,93],[12,96]] },
                { name: 'Beam Quality', points: [[0,0],[1,50],[3,72],[5,85],[7,91],[10,95],[12,98]] },
              ]
            : [
                { name: 'Field Uniformity', points: [[0,0],[2,35],[4,60],[6,78],[8,88],[10,94],[12,97]] },
                { name: 'Penetration Depth', points: [[0,0],[3,45],[5,65],[7,80],[10,90],[12,95]] },
              ],
    };

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Freq + scale */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>TARGET FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#6366f1' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.55rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · OCT-{entry.octave}</div>
            </div>

            {/* Device class */}
            <div style={{ background: '#1a0e05', border: '1px solid #92400e', borderRadius: 8, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#f59e0b', fontWeight: 800, marginBottom: 2 }}>📡 DEVICE CLASS</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>{spec.deviceClass}</div>
            </div>

            {/* Transducer spec */}
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800, marginBottom: 6 }}>⚙️ TRANSDUCER SPECIFICATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 0.6rem' }}>
                    {[
                        { l: 'Crystal material', v: spec.material },
                        { l: 'Output power',    v: spec.power },
                        { l: 'Pulse mode',      v: spec.pulse },
                        { l: 'Beam geometry',   v: spec.beam },
                    ].map(({ l, v }) => (
                        <div key={l}>
                            <span style={{ fontSize: '0.4rem', color: D.muted }}>{l}: </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: D.text }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 APPLICATION MODES</span>
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

            {/* Performance projection */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
                        display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 DEVICE PERFORMANCE vs SESSIONS</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>{timeline.session_min}min calibration runs</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={timeline} />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        % of rated specification achieved. Beam optimisation typically reaches 90%+ by session 8.
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

export default function AcousticDeviceBlueprint() {
    return (
        <OctaveExplorer
            title="Acoustic Device Blueprint"
            icon="📡"
            description="φ-harmonic acoustic device specification framework (OCT-7: cellular ultrasound · OCT-8: tissue-level EM/acoustic). Each node gives target frequency, device class, transducer material, power spec, pulse mode, beam geometry, application modes, and a device performance calibration trajectory."
            octaves={OCTAVES}
            toolColor="#6366f1"
            renderDetail={(entry) => <BlueprintDetail entry={entry} />}
        />
    );
}
