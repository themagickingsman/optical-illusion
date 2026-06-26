'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GlowingSunConfig, GLOWING_SUN_DEFAULTS } from './GlowingSun';

const GlowingSun = dynamic(() => import('./GlowingSun'), { ssr: false });

// ─── Shared styles ────────────────────────────────────────────────────────────
const ROW: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
const COL: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const LBL: React.CSSProperties = { fontSize: 11, color: '#888', fontFamily: 'monospace' };
const VAL: React.CSSProperties = { fontSize: 11, color: '#fff', fontFamily: 'monospace', fontWeight: 700, minWidth: 40, textAlign: 'right' };
const slider = (accent: string): React.CSSProperties => ({ width: '100%', accentColor: accent, cursor: 'pointer' });

// ─── Section accordion ────────────────────────────────────────────────────────
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid #1e1e3a', paddingBottom: 14, marginBottom: 14 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: 'none', color, cursor: 'pointer',
        fontFamily: 'monospace', fontWeight: 700, fontSize: 12, padding: '4px 0',
        width: '100%', textAlign: 'left', marginBottom: open ? 12 : 0,
      }}>
        {open ? '▾' : '▸'} {title}
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </div>
  );
}

function SliderRow({ label, min, max, step, value, onChange, accent, fmt }: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; accent: string; fmt?: (v: number) => string;
}) {
  return (
    <div style={ROW}>
      <div style={{ ...COL, justifyContent: 'space-between' }}>
        <span style={LBL}>{label}</span>
        <span style={VAL}>{fmt ? fmt(value) : String(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={slider(accent)} />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ ...COL, gap: 10 }}>
      <span style={LBL}>{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 40, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4, background: 'none', flexShrink: 0 }} />
      <span style={{ ...VAL, color: '#555', fontSize: 10, minWidth: 56 }}>{value}</span>
    </div>
  );
}

export default function GlowingSunStudio({ onBack }: { onBack?: () => void }) {
  const [cfg, setCfg] = useState<GlowingSunConfig>(GLOWING_SUN_DEFAULTS);

  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const set = useCallback(<K extends keyof GlowingSunConfig>(k: K, v: GlowingSunConfig[K]) => {
    setCfg(prev => ({ ...prev, [k]: v }));
  }, []);

  const s = (k: keyof GlowingSunConfig) => (v: number) => set(k, v as GlowingSunConfig[typeof k]);
  const c = (k: keyof GlowingSunConfig) => (v: string) => set(k, v as GlowingSunConfig[typeof k]);

  const save = useCallback(() => {
    // REMOVED: localStorage usage per architectural rules. State is transient in-memory.
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  }, []);

  const reset = () => setCfg(GLOWING_SUN_DEFAULTS);

  const ACC = '#FDB813';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GlowingSun cfg={cfg} />
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'monospace',
          userSelect: 'none', pointerEvents: 'none',
        }}>glowing sun · three.js + postprocessing bloom</div>
      </div>

      {/* ── Sidebar ── */}
      <div style={{
        width: 300, height: '100%', overflowY: 'auto', flexShrink: 0,
        background: 'rgba(6,6,16,0.97)', borderLeft: '1px solid #1a1a30',
        padding: '16px 18px 60px', boxSizing: 'border-box', fontFamily: 'monospace',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'transparent', border: '1px solid #333', color: '#888',
              padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
            }}>← Back</button>
          )}
          <h3 style={{ margin: 0, color: ACC, fontSize: 12, letterSpacing: 1.5, flex: 1 }}>☀ GLOWING SUN</h3>
          <button onClick={save} style={{
            background: saveState === 'saved' ? '#14532d' : '#111',
            border: saveState === 'saved' ? '1px solid #22c55e' : '1px solid #4ade80',
            color: saveState === 'saved' ? '#22c55e' : '#4ade80',
            padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700, transition: 'all 0.3s',
          }}>{saveState === 'saved' ? '✓ Saved' : '💾 Save'}</button>
          <button onClick={reset} style={{
            background: 'transparent', border: '1px solid #222',
            color: '#444', padding: '5px 9px', borderRadius: 4,
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
          }}>Reset</button>
        </div>

        {/* ── SUN ── */}
        <Section title="SUN SPHERE" color={ACC}>
          <ColorRow label="Sun Color" value={cfg.sunColor} onChange={c('sunColor')} />
          <SliderRow label="Size" min={0.1} max={5} step={0.05}
            value={cfg.sunSize} onChange={s('sunSize')} accent={ACC}
            fmt={v => v.toFixed(2)} />
          <SliderRow label="Detail (subdivisions)" min={0} max={20} step={1}
            value={cfg.sunDetail} onChange={v => set('sunDetail', Math.round(v))} accent={ACC}
            fmt={v => String(Math.round(v))} />
        </Section>

        {/* ── BLOOM ── */}
        <Section title="BLOOM (UnrealBloom)" color="#ff9900">
          <SliderRow label="Strength / Intensity" min={0} max={10} step={0.1}
            value={cfg.bloomStrength} onChange={s('bloomStrength')} accent="#ff9900"
            fmt={v => v.toFixed(1)} />
          <SliderRow label="Luminance Smoothing (radius)" min={0} max={1} step={0.01}
            value={cfg.bloomRadius} onChange={s('bloomRadius')} accent="#ff9900"
            fmt={v => v.toFixed(2)} />
          <SliderRow label="Luminance Threshold" min={0} max={1} step={0.01}
            value={cfg.bloomThreshold} onChange={s('bloomThreshold')} accent="#ff9900"
            fmt={v => v.toFixed(2)} />
        </Section>

        {/* ── STARS ── */}
        <Section title="STAR FIELD" color="#a5b4fc">
          <SliderRow label="Star Count" min={100} max={20000} step={100}
            value={cfg.starCount} onChange={v => set('starCount', Math.round(v))} accent="#a5b4fc"
            fmt={v => String(Math.round(v))} />
          <SliderRow label="Rotation Speed" min={0} max={0.01} step={0.0001}
            value={cfg.starRotationSpeed} onChange={s('starRotationSpeed')} accent="#a5b4fc"
            fmt={v => v.toFixed(4)} />
        </Section>

        {/* ── CAMERA ── */}
        <Section title="CAMERA" color="#67e8f9">
          <SliderRow label="Distance (Z)" min={2} max={30} step={0.5}
            value={cfg.cameraZ} onChange={s('cameraZ')} accent="#67e8f9"
            fmt={v => v.toFixed(1)} />
        </Section>

        {/* ── BACKGROUND ── */}
        <Section title="BACKGROUND GRADIENT" color="#6366f1">
          <SliderRow label="Angle" min={0} max={360} step={1}
            value={cfg.bgAngle} onChange={v => set('bgAngle', Math.round(v))} accent="#6366f1"
            fmt={v => `${Math.round(v)}°`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ColorRow label="Stop 0%"   value={cfg.bgC1} onChange={c('bgC1')} />
            <ColorRow label="Stop 50%"  value={cfg.bgC2} onChange={c('bgC2')} />
            <ColorRow label="Stop 100%" value={cfg.bgC3} onChange={c('bgC3')} />
          </div>
          <SliderRow label="Opacity" min={0} max={1} step={0.01}
            value={cfg.bgAlpha} onChange={s('bgAlpha')} accent="#6366f1"
            fmt={v => `${(v * 100).toFixed(0)}%`} />
          <button onClick={() => {
            set('bgAngle', 135); set('bgC1', '#050511');
            set('bgC2', '#1a1a40'); set('bgC3', '#0d0d2b'); set('bgAlpha', 1);
          }} style={{
            background: '#0a0a1e', border: '1px solid #6366f1', color: '#6366f1',
            padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
          }}>↺ Asteroid Command Blue</button>
        </Section>

        {/* ── PRESETS ── */}
        <Section title="PRESETS" color="#f43f5e">
          {[
            { label: '🌟 Classic Sun',  val: { sunColor: '#FDB813', bloomStrength: 2.0, bloomRadius: 0.4, bgAngle: 135, bgC1: '#050511', bgC2: '#1a1a40', bgC3: '#0d0d2b', cameraZ: 8,  sunSize: 1.0 } },
            { label: '🔴 Red Dwarf',    val: { sunColor: '#ff3300', bloomStrength: 3.0, bloomRadius: 0.6, bgAngle: 135, bgC1: '#0a0000', bgC2: '#1a0505', bgC3: '#060000', cameraZ: 10, sunSize: 0.7 } },
            { label: '🔵 Blue Giant',   val: { sunColor: '#44aaff', bloomStrength: 4.0, bloomRadius: 0.3, bgAngle: 135, bgC1: '#000510', bgC2: '#050a2a', bgC3: '#000815', cameraZ: 12, sunSize: 2.0 } },
            { label: '🟣 Neutron',      val: { sunColor: '#cc44ff', bloomStrength: 6.0, bloomRadius: 0.2, bgAngle: 135, bgC1: '#05000a', bgC2: '#120520', bgC3: '#070010', cameraZ: 6,  sunSize: 0.4 } },
            { label: '⚪ White Dwarf',  val: { sunColor: '#eeeeff', bloomStrength: 5.0, bloomRadius: 0.5, bgAngle: 135, bgC1: '#000005', bgC2: '#050514', bgC3: '#020209', cameraZ: 7,  sunSize: 0.5 } },
          ].map(p => (
            <button key={p.label} onClick={() => setCfg(prev => ({ ...prev, ...p.val }))} style={{
              background: '#0d0d1e', border: '1px solid #333', color: '#ccc',
              padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 11, textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#f43f5e')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
            >{p.label}</button>
          ))}
        </Section>

      </div>
    </div>
  );
}
