'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry, OCTAVE_META } from './hooks/useOctaveEntries';

const OCTAVES = [5, 6, 7, 8, 9];
const D = { raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };

// Cross-domain coupling reference
const CROSS_DOMAIN: Record<number, { neighbor: number; gap: string; relationship: string; application: string }[]> = {
    5: [{ neighbor: 8, gap: 'φ³ (×3 octaves)', relationship: 'Molecular bond ↔ Neural oscillation', application: 'Drug molecule vibrational mode entrains to EEG carrier wave — photobiomodulation protocol design' }],
    6: [{ neighbor: 9, gap: 'φ³ (×3 octaves)', relationship: 'Viral / DNA resonance ↔ Schumann cavity', application: 'Coherence bridge at φ³ scale — pathogen RF protocol timed to Schumann phase for enhanced disruption' }],
    7: [{ neighbor: 5, gap: 'φ³ (×3 octaves)', relationship: 'Cell membrane ↔ Molecular bond', application: 'Cell membrane mechanical mode couples to protein bond vibration — LIPUS activates drug binding simultaneously' },
        { neighbor: 9, gap: 'φ³ (×3 octaves alternate)', relationship: 'Cell membrane ↔ Schumann cavity', application: 'Schumann resonance influence on cellular calcium dynamics — grounding/earthing protocols enhance LIPUS effect' }],
    8: [{ neighbor: 5, gap: 'φ³ (×3 octaves)', relationship: 'Neural EM ↔ Molecular bond', application: 'Brainwave frequency entrains molecular water cluster oscillation — hydration state modulates neural coherence' }],
    9: [{ neighbor: 6, gap: 'φ³ (×3 octaves)', relationship: 'Schumann ↔ Viral DNA', application: 'Earth cavity resonance couples to DNA base-pair vibrational mode — pathogen susceptibility peaks at solar storm events (Kp ≥ 5)' }],
};

// Practical tools that operate at each octave
const TOOLS_AT_OCTAVE: Record<number, { icon: string; name: string; frequency: string; notes: string }[]> = {
    5: [
        { icon: '💡', name: 'THz Spectroscopy', frequency: '0.1–10 THz', notes: 'Protein conformational analysis, drug fingerprinting' },
        { icon: '💡', name: 'NIR Photobiomodulation', frequency: '810–1064 nm', notes: 'Cytochrome c oxidase activation, ATP production' },
    ],
    6: [
        { icon: '📡', name: 'GHz RF Emitter Patch', frequency: '1–20 GHz', notes: 'Viral/DNA disruption, targeted pathogen protocol' },
        { icon: '🔬', name: 'THz Pulsed Field System', frequency: '100 GHz–1 THz', notes: 'DNA strand resonance analysis and modulation' },
    ],
    7: [
        { icon: '🔊', name: 'Therapeutic Ultrasound', frequency: '0.8–3 MHz', notes: 'Cell membrane activation, LIPUS bone healing' },
        { icon: '💡', name: 'NIR Laser / LED', frequency: '630–1000 nm', notes: 'Tissue-level photobiomodulation' },
    ],
    8: [
        { icon: '📡', name: 'PEMF Therapy Mat', frequency: '1–100 Hz', notes: 'Neural entrainment, inflammation, bone regeneration' },
        { icon: '🎧', name: 'Binaural Beat Audio', frequency: '1–40 Hz delta', notes: 'Brainwave entrainment via auditory beat frequency' },
    ],
    9: [
        { icon: '〰️', name: 'Schumann Breathing Protocol', frequency: '7.83 Hz', notes: 'Autonomic coherence, HRV optimisation' },
        { icon: '📳', name: 'Grounding / Earthing Mat', frequency: '7.83 Hz (passive)', notes: 'Free electron transfer, ORP reduction, inflammation' },
    ],
};

function CrossDetail({ entry }: { entry: OctaveEntry }) {
    const meta = OCTAVE_META[entry.octave];
    const crosses = CROSS_DOMAIN[entry.octave] ?? [];
    const tools = TOOLS_AT_OCTAVE[entry.octave] ?? [];

    return (
        <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff' }}>
                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>CROSS-CATALOG RESONANCE NODE</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: 2 }}>{meta?.label} · {entry.name} · {entry.scale_label}</div>
            </div>

            {/* Cross-catalog matches */}
            <div style={{ background: '#042a1d', border: '1px solid #065f46', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#34d399', fontWeight: 800, marginBottom: 6 }}>🔬 CROSS-CATALOG COUPLINGS</div>
                {crosses.length > 0 ? crosses.map((c, i) => (
                    <div key={i} style={{ marginBottom: i < crosses.length - 1 ? 8 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: OCTAVE_META[c.neighbor]?.color ?? '#10b981' }} />
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#6ee7b7' }}>
                                {OCTAVE_META[c.neighbor]?.label} — {c.relationship}
                            </span>
                            <span style={{ fontSize: '0.42rem', color: '#4ade80', marginLeft: 'auto' }}>{c.gap}</span>
                        </div>
                        <p style={{ margin: '0 0 0 1.1rem', fontSize: '0.65rem', color: '#475569', lineHeight: 1.5 }}>{c.application}</p>
                    </div>
                )) : (
                    <div style={{ fontSize: '0.68rem', color: D.muted }}>No cross-catalog resonance documented at this sub-level. Framework position only — open for research.</div>
                )}
            </div>

            {/* Domain significance */}
            <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.42rem', color: '#38bdf8', fontWeight: 800, marginBottom: 3 }}>⊕ RESONANCE SIGNIFICANCE</div>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.55 }}>
                    At {entry.scale_label} (OCT-{entry.octave}), this node sits in the <strong style={{ color: D.text }}>{meta?.domain}</strong> domain.
                    {entry.is_base_level
                        ? ' This is a base resonance level — one of 16 core φ-anchors. Strongest coupling to cross-octave counterparts.'
                        : ` Precision sub-level ${((entry as any).level || 0).toFixed(2)} between base anchors. Weaker but non-zero cross-domain coupling.`
                    }
                    {entry.status === 'predicted'
                        ? ' No confirmed catalog match — open framework prediction for experimental validation.'
                        : ` Closest known entity: ${entry.name} (${Math.round(entry.alignment)}% alignment).`
                    }
                </p>
            </div>

            {/* Tools that work here */}
            {tools.length > 0 && (
                <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
                        <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 INSTRUMENTS AT THIS OCTAVE</span>
                    </div>
                    {tools.map((t, i) => (
                        <div key={i} style={{ padding: '0.45rem 0.7rem', borderBottom: i < tools.length - 1 ? `1px solid ${D.border}` : 'none',
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{t.icon}</span>
                            <div>
                                <div style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{t.name}</div>
                                <div style={{ fontSize: '0.48rem', fontFamily: 'monospace', color: '#4ade80', marginBottom: 1 }}>{t.frequency}</div>
                                <div style={{ fontSize: '0.62rem', color: '#475569' }}>{t.notes}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem' }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.08em', marginBottom: 2 }}>✓ SOURCE</div>
                <p style={{ margin: 0, fontSize: '0.67rem', color: D.muted, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.source}</p>
            </div>
        </div>
    );
}

export default function CrossCatalogResonanceFinder() {
    return (
        <OctaveExplorer
            title="Cross-Catalog Resonance Finder"
            icon="🔬"
            description="φ-harmonic cross-domain coupling framework (OCT-5 through OCT-9 — the biological mezzo range). Each φ³ interval links two octave domains (e.g., molecular bond ↔ neural oscillation). Reveals instruments active at each octave, practical coupling applications, and which entities share resonance across completely different scale domains."
            octaves={OCTAVES}
            toolColor="#10b981"
            renderDetail={(entry) => <CrossDetail entry={entry} />}
        />
    );
}
