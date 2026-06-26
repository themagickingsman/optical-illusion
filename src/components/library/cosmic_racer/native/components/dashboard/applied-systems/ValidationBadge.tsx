'use client';
import React, { useState } from 'react';

// ─── ValidationBadge ─────────────────────────────────────────────────────────
// Shows a small green "✓ VALIDATED" chip next to any catalog entry that has
// a peer-reviewed source citation. Hover reveals the citation detail.
// Usage: <ValidationBadge source="Cosic 1994 (RRM) · PNAS" />

interface ValidationBadgeProps {
    /** The citation / source string from the catalog. If empty/null, renders nothing. */
    source?: string | null;
    /** Override badge text (default: 'VALIDATED') */
    label?: string;
    /** Color scheme: 'green' (default), 'gold', 'blue' */
    variant?: 'green' | 'gold' | 'blue';
}

const VARIANT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    green: { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', dot: '#22c55e' },
    gold:  { bg: '#fefce8', border: '#fde68a', text: '#b45309', dot: '#f59e0b' },
    blue:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
};

export function ValidationBadge({ source, label = 'VALIDATED', variant = 'green' }: ValidationBadgeProps) {
    const [hovered, setHovered] = useState(false);
    if (!source) return null;

    const s = VARIANT_STYLES[variant];

    return (
        <div style={{ position: 'relative' as const, display: 'inline-flex', flexShrink: 0 }}>
            <span
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '1px 7px',
                    borderRadius: 99,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: s.text,
                    cursor: 'default',
                    userSelect: 'none' as const,
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap' as const,
                    flexShrink: 0,
                }}
            >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                ✓ {label}
            </span>
            {hovered && (
                <div style={{
                    position: 'absolute' as const,
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: '0.68rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 8,
                    maxWidth: 260,
                    whiteSpace: 'pre-wrap' as const,
                    lineHeight: 1.5,
                    zIndex: 50,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    pointerEvents: 'none' as const,
                }}>
                    <div style={{ fontWeight: 700, marginBottom: 2, color: s.dot, fontSize: '0.6rem' }}>VALIDATION SOURCE</div>
                    {source}
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute' as const,
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderWidth: '5px 5px 0 5px',
                        borderStyle: 'solid',
                        borderColor: '#1e293b transparent transparent transparent',
                        width: 0, height: 0,
                    }} />
                </div>
            )}
        </div>
    );
}
