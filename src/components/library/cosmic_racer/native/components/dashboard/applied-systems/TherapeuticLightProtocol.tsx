'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [4, 5];

const KPI_COLORS = ['#f59e0b', '#22d3ee', '#4ade80'];
const D = { bg: '#070b14', panel: '#0d1424', raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b' };

interface KpiSeries { name: string; points: [number, number][] }
interface Timeline   { total_sessions: number; session_min: number; kpis: KpiSeries[] }
interface DeliverySystem { icon: string; label: string; mechanism: string; dose: string }

function KpiChart({ timeline, xLabel }: { timeline: Timeline; xLabel: string }) {
    const { total_sessions, kpis } = timeline;
    const W = 260, H = 110;
    const PAD = { t: 16, r: 8, b: 28, l: 36 };
    const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;
    const toX = (s: number) => PAD.l + (s / total_sessions) * IW;
    const toY = (v: number) => PAD.t + (v / 100) * IH;
    const curve = (pts: [number, number][]) =>
        pts.map(([s, v], i) => {
            const x = toX(s), y = toY(v);
            if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
            const [ps, pv] = pts[i - 1];
            const cx = (toX(ps) + x) / 2;
            return `C ${cx.toFixed(1)} ${toY(pv).toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * total_sessions));
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 25, 50, 75, 100].map(v => (
                <line key={v} x1={PAD.l} x2={W - PAD.r} y1={toY(v)} y2={toY(v)}
                    stroke="#1e293b" strokeWidth={v === 0 || v === 100 ? 1 : 0.5} strokeDasharray={v === 0 ? '' : '3,3'} />
            ))}
            {[0, 50, 100].map(v => (
                <text key={v} x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#475569">{100 - v}%</text>
            ))}
            {xTicks.map(s => (
                <text key={s} x={toX(s)} y={H - 4} textAnchor="middle" fontSize={6.5} fill="#475569">{s}{xLabel}</text>
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

function BAND_FOR_NM(nm: number): { name: string; color: string; effects: string; conditions: string } {
    if (nm < 1)    return { name: 'X-ray / Gamma',          color: '#f43f5e', effects: 'Ionising — DNA strand breaks', conditions: 'Radiation oncology (micro-dose)' };
    if (nm < 200)  return { name: 'EUV',                    color: '#a855f7', effects: 'Surface sterilisation',         conditions: 'Semiconductor lithography, sterilisation' };
    if (nm < 280)  return { name: 'UV-C (Germicidal)',       color: '#818cf8', effects: 'RNA/DNA photolesion induction', conditions: 'Far-UVC 222nm wound sterilisation, air treatment' };
    if (nm < 315)  return { name: 'UV-B',                   color: '#6366f1', effects: 'Vitamin D / melanogenesis',     conditions: 'Psoriasis phototherapy, vitamin D deficiency' };
    if (nm < 400)  return { name: 'UV-A',                   color: '#a78bfa', effects: 'Collagen cross-link, NO release', conditions: 'PUVA therapy, wound healing, jaundice' };
    if (nm < 500)  return { name: 'Violet / Blue (415 nm)', color: '#6366f1', effects: 'Bacterial porphyrin activation',  conditions: 'Acne, MRSA wound photodynamic therapy' };
    if (nm < 570)  return { name: 'Green',                  color: '#22c55e', effects: 'Melanin stimulation, vascular',  conditions: 'Vascular lesions, pigmentation' };
    if (nm < 590)  return { name: 'Yellow (590 nm)',         color: '#eab308', effects: 'Lymph stimulation, serotonin',   conditions: 'Neonatal jaundice, rosacea' };
    if (nm < 700)  return { name: 'Red — LLLT (630–680nm)', color: '#ef4444', effects: 'Cytochrome c oxidase / ATP ↑',   conditions: 'Wound healing, pain, hair loss, sports recovery' };
    if (nm < 1100) return { name: 'NIR — PBM (810–1064nm)', color: '#f97316', effects: 'Deep tissue ATP, neurological',  conditions: 'TBI, stroke, peripheral neuropathy, joint pain' };
    if (nm < 3000) return { name: 'Mid-IR',                 color: '#a16207', effects: 'Water absorption, vibrational',  conditions: 'Hyperthermia, collagen remodelling' };
    return          { name: 'Far-IR / THz',                 color: '#64748b', effects: 'Phonon resonance in proteins',    conditions: 'Protein folding disorder research, THz bioeffects' };
}

function deriveDelivery(nm: number): DeliverySystem[] {
    if (nm < 280) return [
        { icon: '💡', label: 'Far-UVC LED Array (222nm)', mechanism: 'KrCl excimer lamp or 222nm LED array; safe for occupied rooms at <3 mJ/cm²/hr; continuously decontaminates air and wound surfaces. For therapeutic use: focused delivery at 23 mJ/cm² per session.', dose: '0.01–1 mW/cm² · 3–5 min' },
        { icon: '💡', label: 'UV-C Cabinet / Flow System', mechanism: 'Collimated UV-C lamp in light-tight cabinet; objects or fluids passed through receive controlled germicidal dose without occupant exposure.', dose: '25 mJ/cm² · 30s pass-time' },
    ];
    if (nm < 400) return [
        { icon: '💡', label: 'UV-A / UVB Phototherapy Lamp', mechanism: 'Narrowband UVB (311 nm) lamp array for whole-body or regional skin phototherapy; patient stands in light cabinet normalised to Fitzpatrick skin type dose. Standard hospital phototherapy rooms.', dose: '20–1000 mJ/cm² · 2–5 min' },
        { icon: '💊', label: 'Photosensitiser + UVA (PUVA)', mechanism: 'Patient takes psoralen oral photosensitiser 2 hrs before UVA exposure; psoralen intercalates into DNA and cross-links on UV-A activation, arresting keratinocyte proliferation in psoriasis.', dose: 'UVA: 1–5 J/cm² after psoralen' },
    ];
    if (nm < 700) return [
        { icon: '💡', label: 'LED Panel Array (Visible Band)', mechanism: `Wavelength-specific LED panel (${nm.toFixed(0)} ±10 nm bandwidth); applied at 5–10 cm distance from skin surface; fluence-controlled by timer. Used in clinical settings for wound care, acne, and vascular lesions.`, dose: `10–50 mW/cm² · 10–20 min` },
        { icon: '💡', label: 'Photodynamic Therapy (PDT) Probe', mechanism: 'Contact fibre-optic probe delivering LED energy directly to wound or tumour bed after photosensitiser application; activates ROS cascade in target cells.', dose: '75–150 J/cm² · 8–16 min' },
    ];
    if (nm < 1100) return [
        { icon: '💡', label: 'NIR Laser Diode Probe', mechanism: `Handheld laser diode (${nm.toFixed(0)} nm) at 200–500 mW/cm²; contact probe or 1 cm gap; photons penetrate 3–5 cm into tissue, absorbed by cytochrome c oxidase in mitochondria; increases ATP by 30–50% in treatment zone within 10 min.`, dose: '4–10 J/cm² · 60–90 s/point' },
        { icon: '💡', label: 'NIR LED Panel / Helmet', mechanism: `Full-face NIR LED panel or transcranial helmet (${nm.toFixed(0)} nm) for neurological applications; delivers uniform field over scalp. Used in TBI and cognitive enhancement research.`, dose: '250 mW/cm² · 10–20 min' },
        { icon: '📳', label: 'NIR + PEMF Combined Pad', mechanism: 'NIR LED array embedded in PEMF therapy pad; dual-modality application — photons activate mitochondria while electromagnetic field modulates membrane potential. Synergistic anti-inflammatory effect.', dose: 'NIR 100mW/cm² + 1mT PEMF · 20min' },
    ];
    return [
        { icon: '💡', label: 'IR Emitter / Heated Pad', mechanism: 'Far-IR ceramic emitter pad or mineral lamp; emits broadband IR centred at molecular absorption bands; increases tissue temperature 1–2°C promoting circulation and collagen synthesis.', dose: '50–100 mW/cm² · 20–30 min' },
    ];
}

function deriveLightTimeline(nm: number): Timeline {
    if (nm < 400) return {
        total_sessions: 20, session_min: 4,
        kpis: [
            { name: 'Lesion Area', points: [[0,100],[4,80],[8,60],[12,40],[16,20],[20,5]] },
            { name: 'Redness',     points: [[0,100],[3,75],[6,52],[10,30],[15,12],[20,3]] },
        ],
    };
    if (nm < 700) return {
        total_sessions: 12, session_min: 15,
        kpis: [
            { name: 'Wound Size', points: [[0,100],[2,82],[4,60],[6,40],[8,22],[10,8],[12,2]] },
            { name: 'Pain VAS',   points: [[0,100],[1,72],[3,50],[5,30],[8,12],[12,2]] },
            { name: 'Bacteria',   points: [[0,100],[1,55],[2,28],[3,12],[5,3],[8,0]] },
        ],
    };
    // NIR
    return {
        total_sessions: 20, session_min: 15,
        kpis: [
            { name: 'Pain VAS',   points: [[0,100],[3,78],[5,58],[8,38],[12,18],[16,6],[20,1]] },
            { name: 'ATP Marker', points: [[0,100],[1,72],[3,50],[5,30],[8,12],[12,3],[20,0]] },
            { name: 'Inflammation', points: [[0,100],[2,80],[4,60],[7,38],[10,18],[15,5],[20,0]] },
        ],
    };
}

// ─── LightDetail panel ────────────────────────────────────────────────────────
function LightDetail({ entry }: { entry: OctaveEntry }) {
    const nm = entry.radius_au * 1.495978707e11 / 1e-9;
    const band = BAND_FOR_NM(nm);
    const delivery = deriveDelivery(nm);
    const timeline = deriveLightTimeline(nm);
    const isPredicted = entry.status === 'predicted';

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Wavelength + freq */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: band.color + '20', border: `1px solid ${band.color}50`, borderRadius: 8, padding: '0.65rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.42rem', color: band.color, fontWeight: 800 }}>WAVELENGTH</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: band.color, marginTop: 2 }}>
                        {nm < 1 ? entry.scale_label : `${nm.toFixed(1)} nm`}
                    </div>
                </div>
                <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.65rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800 }}>FREQUENCY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: D.text, marginTop: 2 }}>{entry.freq_display}</div>
                </div>
            </div>

            {/* Band + clinical conditions */}
            <div style={{ background: band.color + '12', border: `1px solid ${band.color}35`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.45rem', color: band.color, fontWeight: 800, marginBottom: 3 }}>💡 BAND — {band.name}</div>
                <div style={{ fontSize: '0.7rem', color: D.text, lineHeight: 1.5, marginBottom: 6 }}>{band.effects}</div>
                <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 700, marginBottom: 2 }}>CLINICAL CONDITIONS</div>
                <div style={{ fontSize: '0.67rem', color: band.color, opacity: 0.9 }}>{band.conditions}</div>
            </div>

            {/* Device spec */}
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800, marginBottom: 6 }}>⚙️ DEVICE SPECIFICATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                    {[
                        { l: 'Device class', v: nm < 400 ? 'UV LED / Excimer lamp' : nm < 700 ? 'LED array / Laser diode' : nm < 1100 ? 'NIR Laser / LED' : 'IR Emitter / THz source' },
                        { l: 'Power dose', v: nm < 315 ? '1–10 mW/cm²' : nm < 700 ? '10–75 mW/cm²' : '100–500 mW/cm²' },
                        { l: 'Session', v: nm < 400 ? '2–5 min' : nm < 700 ? '10–20 min' : '15–30 min' },
                        { l: 'Penetration', v: nm < 400 ? 'Surface only' : nm < 700 ? '1–2 mm' : nm < 1100 ? '3–5 cm' : '< 1 mm' },
                    ].map(({ l, v }) => (
                        <div key={l}>
                            <span style={{ fontSize: '0.42rem', color: D.muted }}>{l}: </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: D.text }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delivery systems */}
            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 DELIVERY SYSTEMS</span>
                    </div>
                    {delivery.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < delivery.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.38rem', color: D.muted }}>{ds.dose}</span>
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
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 PREDICTED CLINICAL RESPONSE</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>{timeline.session_min}min sessions</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <KpiChart timeline={timeline} xLabel="sx" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: '#334155', lineHeight: 1.5 }}>
                        X-axis = sessions. Y-axis = % symptom burden remaining. 0% = clinical endpoint.
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

export default function TherapeuticLightProtocol() {
    return (
        <OctaveExplorer
            title="Therapeutic Light Protocol"
            icon="💡"
            description="φ-harmonic photobiomodulation and phototherapy spectrum (OCT-4: UV/Vis electron orbitals · OCT-5: IR/NIR molecular bonds). Each node shows wavelength band, clinical conditions treated, device class, delivery systems with dose protocols, and predicted clinical response trajectory. From UV-C sterilisation to NIR deep-tissue ATP stimulation."
            octaves={OCTAVES}
            toolColor="#f59e0b"
            renderDetail={(entry) => <LightDetail entry={entry} />}
        />
    );
}
