'use client';
import React, { useState, useMemo } from 'react';
import { useOctaveEntries, OctaveEntry, OCTAVE_META } from './hooks/useOctaveEntries';
import type { SolarSystemBody } from '../../../state/science/recursion_levels';

export interface OctaveExplorerProps {
    title: string;
    icon: string;
    description: string;
    octaves: number[];
    toolColor: string;
    renderDetail: (entry: OctaveEntry, subOctave: number, activeOctave: number) => React.ReactNode;
    /** Post-hook display filter — applied after entries are built (for UI-level filtering) */
    entryFilter?: (entry: OctaveEntry) => boolean;
    /** Pre-hook catalog filter — applied BEFORE the base-15 selection so the right pool is sampled */
    catalogFilter?: (body: SolarSystemBody) => boolean;
}

const D = {
    bg:       '#070b14',
    panel:    '#0d1424',
    raised:   '#111827',
    border:   '#1e293b',
    text:     '#e2e8f0',
    muted:    '#64748b',
    dim:      '#334155',
    accent:   '#6366f1',
    accentHi: '#818cf8',
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
    verified:  { color: '#22c55e', bg: '#052e16', label: '✓ VERIFIED'  },
    matched:   { color: '#60a5fa', bg: '#0c1a33', label: '~ MATCHED'   },
    predicted: { color: '#a78bfa', bg: '#1a0a2e', label: '◌ PREDICTED' },
};

const ALL_OCT = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];

function EntryRow({ entry, isSelected, onClick, position }: {
    entry: OctaveEntry; isSelected: boolean; onClick: () => void; position: number;
}) {
    const [hov, setHov] = useState(false);
    const st = STATUS_STYLE[entry.status];
    return (
        <button onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                width: '100%', padding: '0.45rem 0.6rem', borderRadius: 5,
                background: isSelected ? `${D.accent}20` : hov ? D.raised : 'transparent',
                border: `1px solid ${isSelected ? D.accentHi + '44' : 'transparent'}`,
                fontFamily: 'inherit', textAlign: 'left' as const, transition: 'all 0.1s', cursor: 'pointer',
            }}>
            {/* Frequency-order position number */}
            <div style={{ minWidth: 20, fontFamily: 'monospace', fontSize: '0.55rem', fontWeight: 700,
                color: entry.status === 'predicted' ? D.dim : D.muted,
                textAlign: 'right' as const, flexShrink: 0 }}>
                {position}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: st.color, opacity: entry.status === 'predicted' ? 0.4 : 1,
                border: entry.status === 'predicted' ? `1.5px dashed ${st.color}` : 'none' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: entry.is_base_level ? 700 : 500,
                    color: isSelected ? '#c7d2fe' : D.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {entry.name}
                </div>
                <div style={{ fontSize: '0.55rem', color: D.muted }}>{entry.type} · {entry.scale_label}</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.67rem',
                color: isSelected ? D.accentHi : D.dim, flexShrink: 0 }}>{entry.freq_display}</div>
        </button>
    );
}

function DefaultDetail({ entry }: { entry: OctaveEntry }) {
    const st = STATUS_STYLE[entry.status];
    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
            <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 10, padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.48rem', color: D.muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>
                    OCT-{entry.octave} · SUB-{String(entry.subOctave).padStart(2,'0')} · {entry.type}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: D.text, marginBottom: 4 }}>{entry.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900,
                    color: OCTAVE_META[entry.octave]?.color ?? D.accent }}>{entry.freq_display}</div>
                <div style={{ fontSize: '0.58rem', color: D.muted, marginTop: 2 }}>{entry.scale_label}</div>
            </div>
            <div style={{ background: st.bg, border: `1px solid ${st.color}30`, borderRadius: 8, padding: '0.65rem' }}>
                <div style={{ fontSize: '0.48rem', fontWeight: 800, color: st.color, letterSpacing: '0.08em', marginBottom: 2 }}>
                    {st.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: D.muted, lineHeight: 1.5 }}>{entry.source}</div>
            </div>
        </div>
    );
}

export default function OctaveExplorer({
    title, icon, description, octaves, toolColor, renderDetail, entryFilter, catalogFilter,
}: OctaveExplorerProps) {
    const [selectedId, setSelectedId]     = useState<string | null>(null);
    const [subOctave, setSubOctave]       = useState(1);
    const [activeOctave, setActiveOctave] = useState(octaves[0]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'matched' | 'predicted'>('all');

    const allEntries = useOctaveEntries(octaves, subOctave, catalogFilter);
    const filtered = useMemo(() => {
        let e = allEntries.filter(e => e.octave === activeOctave);
        if (statusFilter !== 'all') e = e.filter(e => e.status === statusFilter);
        if (entryFilter) e = e.filter(entryFilter);
        return e;
    }, [allEntries, activeOctave, statusFilter, entryFilter]);

    const selected = filtered.find(e => e.id === selectedId) ?? null;
    const meta = OCTAVE_META[activeOctave];
    const activeSet = new Set(octaves);

    const counts = useMemo(() => ({
        verified:  filtered.filter(e => e.status === 'verified').length,
        matched:   filtered.filter(e => e.status === 'matched').length,
        predicted: filtered.filter(e => e.status === 'predicted').length,
    }), [filtered]);

    // ── Octave button ─────────────────────────────────────────────────────────
    const renderOctBtn = (oct: number) => {
        const isActive   = activeOctave === oct;
        const isEnabled  = activeSet.has(oct);
        const m          = OCTAVE_META[oct];
        const col        = m?.color ?? D.accent;
        return (
            <button key={oct} disabled={!isEnabled}
                onClick={() => { if (isEnabled) { setActiveOctave(oct); setSelectedId(null); } }}
                title={m?.domain}
                style={{
                    minWidth: 42, height: 42, borderRadius: 7,
                    fontSize: '0.78rem', fontWeight: 900, fontFamily: 'monospace',
                    background: isActive ? col : D.raised,
                    border: `1.5px solid ${isActive ? col : isEnabled ? col + '80' : '#2d3f5c'}`,
                    color: isActive ? '#fff' : isEnabled ? col : '#475569',
                    cursor: isEnabled ? 'pointer' : 'default',
                    opacity: isEnabled ? 1 : 0.42,
                    transition: 'all 0.12s',
                    boxShadow: isActive ? `0 0 10px ${col}60` : 'none',
                }}>
                {oct}
            </button>
        );
    };

    // ── Sub-octave button ─────────────────────────────────────────────────────
    const renderSubBtn = (n: number) => {
        const isActive = subOctave === n;
        return (
            <button key={n}
                onClick={() => { setSubOctave(n); setSelectedId(null); }}
                style={{
                    minWidth: 42, height: 42, borderRadius: 7,
                    fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace',
                    background: isActive ? D.accent : D.raised,
                    border: `1.5px solid ${isActive ? D.accentHi : D.border}`,
                    color: isActive ? '#fff' : D.muted,
                    cursor: 'pointer', transition: 'all 0.12s',
                    boxShadow: isActive ? `0 0 10px ${D.accent}60` : 'none',
                }}>
                {String(n).padStart(2,'0')}
            </button>
        );
    };

    const stSel = selected ? STATUS_STYLE[selected.status] : null;

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', background: D.bg }}>

            {/* ── CONTROL PANEL ── */}
            <div style={{ background: D.panel, borderBottom: `1px solid ${D.border}`, padding: '0.75rem 1.5rem 0.9rem' }}>

                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: D.text }}>{title}</span>
                    <span style={{ fontSize: '0.48rem', fontWeight: 800, background: D.accent + '22',
                        color: D.accentHi, padding: '1px 8px', borderRadius: 99,
                        border: `1px solid ${D.accent}35`, letterSpacing: '0.1em' }}>φ-FRAMEWORK</span>
                    <span style={{ fontSize: '0.55rem', color: D.muted, marginLeft: 'auto', maxWidth: 360 }}>
                        {description.length > 90 ? description.slice(0, 90) + '…' : description}
                    </span>
                </div>

                {/* ROW 1: Octave buttons */}
                <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.44rem', color: D.accent, fontWeight: 800, letterSpacing: '0.14em',
                        textAlign: 'center' as const, marginBottom: '0.45rem' }}>
                        OCTAVE&nbsp;·&nbsp;
                        <span style={{ color: meta?.color ?? toolColor, fontSize: '0.85rem', fontWeight: 900 }}>
                            {activeOctave}
                        </span>
                        &nbsp;<span style={{ color: D.muted, fontWeight: 400 }}>{meta?.domain}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                        {ALL_OCT.map(renderOctBtn)}
                    </div>
                </div>

                {/* ROW 2: Sub-octave buttons */}
                <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.44rem', color: D.accent, fontWeight: 800, letterSpacing: '0.14em',
                        textAlign: 'center' as const, marginBottom: '0.45rem' }}>
                        SUB OCTAVE&nbsp;·&nbsp;
                        <span style={{ color: D.text, fontSize: '0.85rem', fontWeight: 900 }}>
                            {String(subOctave).padStart(2,'0')}
                        </span>
                        &nbsp;<span style={{ color: D.muted, fontWeight: 400 }}>{subOctave * 15} nodes</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                        {Array.from({ length: 15 }, (_, i) => renderSubBtn(i + 1))}
                    </div>
                </div>

                {/* Status filters */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {([['all', D.muted, `All ${filtered.length}`]] as [string, string, string][])
                        .concat([
                            ['verified',  '#22c55e', `${counts.verified} ✓ verified`],
                            ['matched',   '#60a5fa', `${counts.matched} ~ matched`],
                            ['predicted', '#a78bfa', `${counts.predicted} ◌ predicted`],
                        ]).map(([f, c, lbl]) => (
                        <button key={f} onClick={() => setStatusFilter(f as any)}
                            style={{ fontSize: '0.52rem', padding: '2px 9px', borderRadius: 99,
                                border: `1px solid ${c}35`,
                                background: statusFilter === f ? c + '20' : 'transparent',
                                color: statusFilter === f ? c : D.muted,
                                fontWeight: statusFilter === f ? 800 : 400,
                                cursor: 'pointer', fontFamily: 'inherit' }}>
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT: entry list + detail ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0.75rem',
                padding: '0.75rem 1.5rem 1.5rem', alignItems: 'start' }}>

                {/* Entry list */}
                <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '0.4rem 0.6rem', borderBottom: `1px solid ${D.border}`,
                        fontSize: '0.48rem', color: D.muted, fontWeight: 800, letterSpacing: '0.08em',
                        display: 'flex', justifyContent: 'space-between' }}>
                        <span>{meta?.label} · SUB-{String(subOctave).padStart(2,'0')}</span>
                        <span style={{ fontFamily: 'monospace' }}>{filtered.length} nodes</span>
                    </div>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center' as const, color: D.muted, fontSize: '0.72rem' }}>
                            No entries — try a different sub-octave or filter
                        </div>
                    ) : (() => {
                        // Build position map: entry.id → frequency-order number (1-based across full filtered list)
                        const positionMap = new Map<string, number>();
                        filtered.forEach((e, i) => positionMap.set(e.id, i + 1));

                        const known     = filtered.filter(e => e.status !== 'predicted');
                        const predicted = filtered.filter(e => e.status === 'predicted');
                        return (
                            <>
                                {known.map(entry => (
                                    <EntryRow key={entry.id} entry={entry}
                                        position={positionMap.get(entry.id)!}
                                        isSelected={selectedId === entry.id}
                                        onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)} />
                                ))}
                                {predicted.length > 0 && (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.3rem 0.6rem', margin: '0.1rem 0' }}>
                                            <div style={{ flex: 1, height: 1, background: D.dim, opacity: 0.5 }} />
                                            <span style={{ fontSize: '0.4rem', color: D.dim, fontWeight: 700,
                                                letterSpacing: '0.1em', flexShrink: 0 }}>
                                                {predicted.length} PREDICTED · AWAITING DISCOVERY
                                            </span>
                                            <div style={{ flex: 1, height: 1, background: D.dim, opacity: 0.5 }} />
                                        </div>
                                        {predicted.map(entry => (
                                            <EntryRow key={entry.id} entry={entry}
                                                position={positionMap.get(entry.id)!}
                                                isSelected={selectedId === entry.id}
                                                onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)} />
                                        ))}
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Detail panel */}
                <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    {selected && stSel ? (
                        <>
                            <div style={{ padding: '0.7rem 0.9rem', borderBottom: `1px solid ${D.border}`,
                                background: `linear-gradient(135deg, ${stSel.color}0c, ${D.raised})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.48rem', color: D.muted, fontWeight: 700, letterSpacing: '0.07em' }}>
                                        {meta?.label} · SUB-{String(selected.subOctave).padStart(2,'0')} · {selected.type}
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: D.text, marginTop: 2 }}>
                                        {selected.name}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 3 }}>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: toolColor }}>
                                        {selected.freq_display}
                                    </div>
                                    <div style={{ fontSize: '0.5rem', fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                                        background: stSel.bg, color: stSel.color, border: `1px solid ${stSel.color}35` }}>
                                        {stSel.label}
                                    </div>
                                </div>
                            </div>
                            {renderDetail ? renderDetail(selected, subOctave, activeOctave) : <DefaultDetail entry={selected} />}
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
                            justifyContent: 'center', minHeight: 260, gap: '0.6rem', padding: '2rem' }}>
                            <div style={{ fontSize: '2.5rem', opacity: 0.08 }}>{icon}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: D.dim }}>Select an entry</div>
                            <div style={{ fontSize: '0.63rem', maxWidth: 240, textAlign: 'center' as const,
                                lineHeight: 1.5, color: D.dim }}>
                                Sub-Octave <strong style={{ color: D.accentHi }}>01</strong> = 15 catalog entries.
                                Each higher level adds 15 framework predictions.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
