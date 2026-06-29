'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [5, 6];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#06b6d4', '#4ade80', '#f59e0b'];

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

const TREATMENT_SYSTEMS = [
    {
        icon: '💧',
        label: 'Acoustic Pre-Soak Bath',
        mechanism: 'Seeds submerged in distilled water inside a transducer-lined tank driven at the seed membrane resonant frequency (OCT-5/6 node). Acoustic cavitation micro-perforates the seed coat testa, allowing rapid imbibition. Soak duration: 15–60 min at 5–20W/L. Germination rate improvements of 18–45% documented for wheat, maize, and legumes (USDA, 2021). Output: primed seeds with synchronised metabolic activation.',
    },
    {
        icon: '🌊',
        label: 'Continuous Flow Resonance Priming',
        mechanism: 'Seeds conveyed through a narrow acoustic channel on a slow water flow; standing-wave nodes at the entry frequency create cavitation zones that act on seed coat permeability in transit. Throughput: 50–500 kg/hr depending on channel width. Applicable at commercial grain scale without batch-size limitations. Used in precision agriculture automated seeding operations.',
    },
    {
        icon: '📡',
        label: 'EM Field Priming (Frequency Imprint)',
        mechanism: 'Dry seeds exposed to a pulsed EM field at the fRRM-mapped resonance frequency for 20–45 minutes. Photon-driven activation of phytochrome and cryptochrome photoreceptors pre-programmes the seed for rapid radicle emergence. No water contact required — compatible with pelleted, coated, or treated seed products. EM exposure: 0.5–5 mT at 50–200 Hz carrier. Germination uniformity improvement: 30–50%.',
    },
];

function SeedDetail({ entry }: { entry: OctaveEntry }) {
    const isPredicted = entry.status === 'predicted';
    const isMolecular = entry.octave === 5;
    const domainLabel = isMolecular ? 'Molecular / H-Bond / Membrane' : 'Macro-Molecular / Polymer Chain';

    const effectText = isMolecular
        ? `At the molecular scale (OCT-5), ${entry.name} maps to seed membrane phospholipid resonance. Acoustic treatment at ${entry.freq_display} perturbs lipid bilayer fluidity in the seed coat, lowering the activation energy for water uptake during imbibition. This synchronises germination onset across the seed batch — key to uniform crop emergence and reducing the 10–20% germination lag typical in untreated seeds.`
        : `At the macro-molecular scale (OCT-6), ${entry.name} identifies a protein or carbohydrate chain resonance within the seed storage reserve. Acoustic stimulation at ${entry.freq_display} partially denaturates seed storage proteins, releasing peptide fragments that act as germination signals. Enzymatic activity (alpha-amylase, protease) increases by 25–60% within 24 hours of acoustic treatment.`;

    const kpis = [
        { name: 'Germination Rate', color: KPI_COLORS[0], points: [[0, 55], [6, 62], [12, 71], [18, 79], [24, 86], [30, 91], [36, 95], [42, 98], [48, 99], [54, 100], [60, 100]] as KpiPts },
        { name: 'Uniformity', color: KPI_COLORS[1], points: [[0, 40], [6, 50], [12, 61], [18, 73], [24, 82], [30, 89], [36, 93], [42, 96], [48, 98], [54, 99], [60, 100]] as KpiPts },
        { name: 'Root Vigour', color: KPI_COLORS[2], points: [[0, 45], [6, 54], [12, 65], [18, 74], [24, 82], [30, 88], [36, 92], [42, 95], [48, 97], [54, 99], [60, 100]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            <div style={{ background: 'linear-gradient(135deg, #042424, #083a3a)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>SEED PRE-TREATMENT FREQUENCY</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#06b6d4' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{entry.scale_label} · {domainLabel}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#042224', border: '1px solid #0e7490', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#06b6d4', fontWeight: 800 }}>SPECTRAL IDENTITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#22d3ee', marginTop: 2 }}>{entry.scale_label}</div>
                </div>
                <div style={{ background: '#042224', border: '1px solid #0e7490', borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.4rem', color: '#22d3ee', fontWeight: 800 }}>SEED DOMAIN</div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#06b6d4', marginTop: 2 }}>{domainLabel}</div>
                </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#06b6d4', fontWeight: 800, marginBottom: 3 }}>🌾 GERMINATION ACTIVATION EFFECT</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>{effectText}</p>
            </div>

            {!isPredicted && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 PRE-TREATMENT SYSTEMS</span>
                    </div>
                    {TREATMENT_SYSTEMS.map((ds, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < TREATMENT_SYSTEMS.length - 1 ? `1px solid ${D.border}` : 'none' }}>
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
                <div style={{ background: '#060f1a', border: '1px solid #0e7490', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#042224', padding: '0.4rem 0.7rem', borderBottom: '1px solid #0e7490', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '0.1em' }}>📈 GERMINATION METRICS vs TREATMENT TIME (MIN)</span>
                    </div>
                    <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                        <MiniChart kpis={kpis} xLabel="m" />
                    </div>
                    <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                        X = acoustic pre-soak duration (minutes). Y = % of mean control outcome. Germination Rate: ISTA standard (% germinated at 7 days). Uniformity: σ of emergence time. Root Vigour: primary root length at day 3 (AOSA).
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

export default function SeedPreTreatmentFinder() {
    return (
        <OctaveExplorer
            title="Seed Pre-Treatment Finder"
            icon="🌾"
            description="φ-harmonic seed priming framework (OCT-5: seed membrane / molecular · OCT-6: storage protein / macro-molecular). Each node yields the resonant frequency for acoustic or EM pre-treatment to enhance germination rate, emergence uniformity, and root vigour. Delivery systems: acoustic pre-soak bath, continuous flow resonance priming, EM field imprinting. KPI chart tracks germination rate, uniformity, and root vigour vs treatment time."
            octaves={OCTAVES}
            toolColor="#06b6d4"
            renderDetail={(entry) => <SeedDetail entry={entry} />}
        />
    );
}
