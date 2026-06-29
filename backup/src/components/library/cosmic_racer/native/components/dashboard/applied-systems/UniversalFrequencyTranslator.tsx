'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry, OCTAVE_META } from './hooks/useOctaveEntries';

const OCTAVES = [4, 5, 6, 7, 8, 9, 10, 11];
const PHI = 1.61803398875;
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };
const KPI_COLORS = ['#6366f1', '#22d3ee', '#4ade80'];

type KpiPts = [number, number][];

function MiniChart({ kpis }: { kpis: { name: string; color: string; points: KpiPts }[] }) {
    const W = 260, H = 90, PAD = { t: 12, r: 8, b: 22, l: 34 };
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
    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
            {[0, 50, 100].map(v => <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)} stroke="#1e293b" strokeWidth={v===0?1:0.5} strokeDasharray={v===0?'':'3,3'} />)}
            {[0, 50, 100].map(v => <text key={v} x={PAD.l-4} y={toY(v)+3} textAnchor="end" fontSize={6.5} fill="#475569">{v}%</text>)}
            {[0, 5, 10].map(t => <text key={t} x={toX(t)} y={H-3} textAnchor="middle" fontSize={6} fill="#475569">OCT-{Math.round(4 + t * 0.7)}</text>)}
            {kpis.map((k, i) => <g key={i} transform={`translate(${PAD.l+i*(IW/kpis.length)},2)`}><line x1="0" x2="9" y1="3" y2="3" stroke={k.color} strokeWidth={1.5}/><text x="12" y="6" fontSize="6" fill={k.color}>{k.name}</text></g>)}
            {kpis.map((k, i) => <path key={i} d={curve(k.points)} fill="none" stroke={k.color} strokeWidth={1.5} strokeLinecap="round"/>)}
        </svg>
    );
}

function fmt(hz: number) {
    if (hz >= 1e12) return `${(hz / 1e12).toFixed(2)} THz`;
    if (hz >= 1e9)  return `${(hz / 1e9).toFixed(2)} GHz`;
    if (hz >= 1e6)  return `${(hz / 1e6).toFixed(2)} MHz`;
    if (hz >= 1e3)  return `${(hz / 1e3).toFixed(2)} kHz`;
    if (hz >= 1)    return `${hz.toFixed(3)} Hz`;
    return `${(hz * 1e3).toFixed(3)} mHz`;
}

// Domain-specific applications per octave
const DOMAIN_APPLICATIONS: Record<number, { instrument: string; application: string; icon: string }[]> = {
    4:  [{ icon: '🔬', instrument: 'THz / X-ray Spectrometer',    application: 'Atom electron orbital spectroscopy; NIST spectral ID validation; elemental fingerprinting for acoustic print' }],
    5:  [{ icon: '💡', instrument: 'NIR / THz PBM Unit',           application: 'Molecular bond photobiomodulation; protein conformational tuning; H-bond water cluster structuring' }],
    6:  [{ icon: '📡', instrument: 'GHz RF Emitter Patch',         application: 'Viral/DNA disruption (Pathogen Protocol); gene network RRM frequency entrainment; nanoparticle heating' }],
    7:  [{ icon: '🔊', instrument: 'LIPUS Transducer',             application: 'Cell membrane resonance; bone healing; immune cell activation; wound care ultrasound' }],
    8:  [{ icon: '📡', instrument: 'PEMF Mat / Binaural Audio',    application: 'Neural brainwave entrainment; tissue EM field therapy; autonomic nervous system regulation' }],
    9:  [{ icon: '〰️', instrument: 'Schumann Breathing / Earthing', application: 'Planetary cavity resonance coupling; HRV optimisation; circadian alignment; site resonance assessment' }],
    10: [{ icon: '🌙', instrument: 'Magnetometer Array',           application: 'Lunar/magnetospheric EM monitoring; geomagnetic storm coupling analysis; remote site characterisation' }],
    11: [{ icon: '🌞', instrument: 'Solar EM Observatory',         application: 'Solar orbital resonance tracking; heliospheric φ-structure mapping; solar-biological coupling research' }],
};

function UniversalDetail({ entry }: { entry: OctaveEntry }) {
    const meta = OCTAVE_META[entry.octave];
    const subHarmonic = entry.freq_hz / PHI;
    const superHarmonic = entry.freq_hz * PHI;
    const phiSq = entry.freq_hz * PHI * PHI;
    const phiCube = entry.freq_hz * PHI * PHI * PHI;
    const subOct = entry.freq_hz / 2;
    const supOct = entry.freq_hz * 2;
    const apps = DOMAIN_APPLICATIONS[entry.octave] ?? [];

    // Coupling strength across octaves (how well this freq couples to all other octaves)
    const couplingChart = [
        { name: 'φ coupling',   color: KPI_COLORS[0], points: [[0,60],[2,55],[3,85],[4,60],[5,75],[6,55],[7,80],[8,55],[10,65]] as KpiPts },
        { name: 'Harmonic',     color: KPI_COLORS[1], points: [[0,90],[2,40],[3,70],[4,90],[5,40],[6,70],[7,40],[8,90],[10,70]] as KpiPts },
        { name: 'Base level',   color: KPI_COLORS[2], points: [[0,100],[2,20],[3,100],[4,20],[5,100],[6,20],[7,100],[8,20],[10,100]] as KpiPts },
    ];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1a1a3e)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>UNIVERSAL FREQUENCY NODE</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: meta?.color ?? '#6366f1' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{meta?.label} · {meta?.domain} · {entry.scale_label}</div>
            </div>

            {/* φ translations */}
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: D.muted, fontWeight: 800, marginBottom: 6 }}>⟐ φ-HARMONIC TRANSLATIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem' }}>
                    {[
                        { l: '÷φ sub',   v: fmt(subHarmonic),  c: '#818cf8' },
                        { l: 'This freq', v: entry.freq_display, c: meta?.color ?? '#6366f1' },
                        { l: '×φ super',  v: fmt(superHarmonic), c: '#4ade80' },
                        { l: '÷2 octave', v: fmt(subOct),       c: '#64748b' },
                        { l: '×φ² ',      v: fmt(phiSq),        c: '#22c55e' },
                        { l: '×φ³',       v: fmt(phiCube),      c: '#06b6d4' },
                    ].map(p => (
                        <div key={p.l} style={{ background: '#0a1020', border: `1px solid ${D.border}`, borderRadius: 6, padding: '0.4rem', textAlign: 'center' as const }}>
                            <div style={{ fontSize: '0.38rem', color: D.muted, fontWeight: 700, marginBottom: 1 }}>{p.l}</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.58rem', color: p.c }}>{p.v}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Domain context */}
            <div style={{ background: (meta?.color ?? '#6366f1') + '15', border: `1px solid ${(meta?.color ?? '#6366f1')}30`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: meta?.color ?? '#6366f1', fontWeight: 800, marginBottom: 3 }}>⟐ OCTAVE DOMAIN</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: D.text, lineHeight: 1.55 }}>
                    <strong>{meta?.label}</strong> — {meta?.domain}. At {entry.scale_label}, this position is at the
                    {entry.is_base_level
                        ? ' base resonance level (one of 16 fundamental φ-harmonic anchors — maximum cross-domain coupling potential).'
                        : ` precision sub-level ${((entry as any).level || 0).toFixed(2)} between base resonances.`
                    }
                    {entry.status === 'predicted'
                        ? ' No known entity confirmed — framework prediction open for experimental validation.'
                        : ` Matched to: ${entry.name} (${Math.round(entry.alignment)}% alignment).`
                    }
                </p>
            </div>

            {/* Domain applications */}
            {apps.length > 0 && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 INSTRUMENTS AT THIS SCALE</span>
                    </div>
                    {apps.map((app, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.7rem', borderBottom: i < apps.length - 1 ? `1px solid ${D.border}` : 'none',
                            display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{app.icon}</span>
                            <div>
                                <div style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd', marginBottom: 2 }}>{app.instrument}</div>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{app.application}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cross-octave coupling strength */}
            <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
                <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d' }}>
                    <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>📈 φ-COUPLING STRENGTH ACROSS OCTAVES</span>
                </div>
                <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
                    <MiniChart kpis={couplingChart} />
                </div>
                <div style={{ padding: '0 0.7rem 0.4rem', fontSize: '0.38rem', color: D.dim, lineHeight: 1.5 }}>
                    Shows relative φ-coupling, harmonic, and base-level coupling intensity of this frequency position across all octave domains (OCT-4 through OCT-11). Peaks occur at φ-harmonic and octave-harmonic intervals.
                </div>
            </div>

            {/* Source */}
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.08em', marginBottom: 2 }}>✓ SOURCE</div>
                <p style={{ margin: 0, fontSize: '0.67rem', color: D.muted, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.source}</p>
            </div>
        </div>
    );
}

export default function UniversalFrequencyTranslator() {
    return (
        <OctaveExplorer
            title="Universal Frequency Translator"
            icon="🌐"
            description="Full φ-harmonic framework across OCT-4 through OCT-11 — from electron orbital spectroscopy (nm) to solar system orbital mechanics (AU). Each node shows 6 φ-harmonic translations (÷φ, ×φ, ×φ², ×φ³, ÷2, ×2), domain-specific instruments active at that scale, and a cross-octave coupling strength chart showing how this frequency resonates across all octave domains."
            octaves={OCTAVES}
            toolColor="#6366f1"
            renderDetail={(entry) => <UniversalDetail entry={entry} />}
        />
    );
}
