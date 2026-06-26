'use client';
import React from 'react';
import OctaveExplorer from './OctaveExplorer';
import { OctaveEntry } from './hooks/useOctaveEntries';

const OCTAVES = [6, 7];
const CATALOG_FILTER = (body: { type?: string }) => body.type === 'Pathogen';
const ENTRY_FILTER   = (entry: OctaveEntry) => entry.type === 'Pathogen' || entry.type === 'Node';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DeliverySystem { icon: string; label: string; mechanism: string }
interface KpiSeries      { name: string; points: [number, number][] }
interface Timeline        { total_days: number; sessions_per_day: number; session_min: number; kpis: KpiSeries[] }
interface Protocol        { delivery_systems: DeliverySystem[]; timeline: Timeline }

// ─── Protocol data (delivery + KPIs keyed by name fragment) ──────────────────
const PROTOCOLS: Array<{ match: RegExp; data: Protocol }> = [
  {
    match: /SARS-CoV-2 Virion/i,
    data: {
      delivery_systems: [
        { icon: '💨', label: 'Resonant Aerosol Inhaler', mechanism: 'Mesh nebulizer suspends 100 nm gold nanoparticles in sterile saline; particles self-resonate at 7.4 GHz once inhaled into bronchial epithelium, mechanically fracturing virion capsid proteins at the source of replication. Standard medical nebulizer, 8 L/min, 10 min inhalation session.' },
        { icon: '📡', label: 'Wearable RF Chest Patch', mechanism: 'Flexible microstrip antenna patch adhered to sternum and clavicle; powered by USB-C wearable battery; emits 50 mW/cm² at 7.4 GHz, penetrating 2 cm into thoracic cavity. Patient wears during 30-min rest sessions, 2× daily.' },
        { icon: '💡', label: 'Far-UVC Emitter (222 nm)', mechanism: '222 nm far-UVC array (safe for occupied rooms at <3 mJ/cm²/hr); continuously decontaminates aerosolized virions in room air and on mucosal surfaces. Used concurrently with active treatment to prevent re-exposure.' },
      ],
      timeline: { total_days: 10, sessions_per_day: 2, session_min: 30, kpis: [
        { name: 'Viral Load',      points: [[0,100],[1,85],[2,65],[3,45],[4,28],[6,12],[8,4],[10,1]] },
        { name: 'Inflammation',    points: [[0,100],[1,92],[2,78],[3,58],[4,38],[6,16],[8,5],[10,0]] },
        { name: 'Symptom Score',   points: [[0,100],[1,80],[2,60],[3,40],[5,20],[7,8],[10,0]] },
      ]},
    },
  },
  {
    match: /SARS-CoV-2 Spike/i,
    data: {
      delivery_systems: [
        { icon: '💨', label: 'Mucosal Aerosol Spray', mechanism: 'Nasal/oropharyngeal spray delivering 20 nm resonant silver nanoparticles tuned to 7.3 GHz; particles coat ACE2 receptor sites, disrupting spike protein binding geometry before virion attachment occurs. 2-3 sprays per nostril, 3× daily.' },
        { icon: '📡', label: 'Throat-Surface RF Patch', mechanism: 'Slim flexible patch worn at throat/neck, targeting upper airway epithelium where spike-mediated entry begins. 7.3 GHz, 40 mW/cm², 0.5 cm penetration — sufficient for mucosal layer targeting.' },
      ],
      timeline: { total_days: 7, sessions_per_day: 3, session_min: 15, kpis: [
        { name: 'Spike Binding',   points: [[0,100],[1,70],[2,45],[3,25],[5,10],[7,0]] },
        { name: 'ACE2 Blockade',   points: [[0,0],[1,30],[2,55],[3,75],[5,90],[7,100]] },
      ]},
    },
  },
  {
    match: /HIV-1/i,
    data: {
      delivery_systems: [
        { icon: '📡', label: 'Lymph Node RF Array', mechanism: 'Four adhesive patch antennas placed over major lymph node clusters (bilateral axillae, groin, neck); overlapping 18 GHz fields converge inside lymphatic tissue where HIV concentrates in CD4+ T-cells and macrophages. 40 mW/cm² per patch, 45-min sessions.' },
        { icon: '💊', label: 'Acoustic Sensitizer Capsule', mechanism: 'Oral lipid nanoparticle (LNP) formulation; LNPs are selectively uptaken by infected CD4+ cells and macrophages, depositing resonant sensitizer molecules. When external 18 GHz RF is applied, sensitized cells experience 10× amplified mechanical disruption — killing virus-producing cells while sparing healthy CD4+ cells.' },
        { icon: '📳', label: 'Full-Lymph Vibrational Garment', mechanism: 'Lightweight compression garment with piezo-polymer panels over lymphatic pathways; generates whole-system resonance at acoustic equivalent of 18 GHz; used nightly for passive lymphatic treatment during sleep.' },
      ],
      timeline: { total_days: 90, sessions_per_day: 2, session_min: 45, kpis: [
        { name: 'Viral Load (log)', points: [[0,100],[7,80],[14,60],[30,38],[60,18],[90,5]] },
        { name: 'CD4 Count',        points: [[0,100],[7,95],[14,85],[30,65],[60,40],[90,20]] },
        { name: 'Reservoir Size',   points: [[0,100],[14,90],[30,75],[60,55],[90,38]] },
      ]},
    },
  },
  {
    match: /Ebola/i,
    data: {
      delivery_systems: [
        { icon: '📡', label: 'Isolation Room RF Array', mechanism: 'BSL-4 compatible overhead RF emitter array installed in isolation room ceiling; generates whole-body 19 GHz field at 50 mW/cm²; patient receives continuous passive exposure throughout acute illness phase without staff contact.' },
        { icon: '💉', label: 'IV Resonant NanoRod Infusion', mechanism: 'Sterile IV saline containing 80 nm gold nano-rods (aspect ratio tuned to 19 GHz resonance); infused via standard IV access; circulate systemically and concentrate in tissues with active viral replication, amplifying external RF effect at infection site.' },
      ],
      timeline: { total_days: 21, sessions_per_day: 3, session_min: 45, kpis: [
        { name: 'Viremia',          points: [[0,100],[2,80],[4,60],[7,38],[10,20],[14,8],[21,2]] },
        { name: 'Coagulopathy',     points: [[0,100],[3,85],[6,60],[9,40],[14,18],[21,5]] },
        { name: 'Organ Function',   points: [[0,100],[3,90],[7,70],[10,45],[14,22],[21,8]] },
      ]},
    },
  },
  {
    match: /Influenza A/i,
    data: {
      delivery_systems: [
        { icon: '💨', label: 'Resonant Aerosol Inhaler', mechanism: 'Handheld mesh nebulizer delivering 110 nm resonant nanoparticle suspension (AuNP sized to influenza virion); 10 min inhalation, 2× daily; particles distribute through bronchial tree and resonate at 8 GHz in synchrony with external RF patch, disrupting hemagglutinin and neuraminidase surface proteins.' },
        { icon: '📡', label: 'Bilateral Throat-Chest RF Patch System', mechanism: 'Two-patch array: anterior throat patch (upper respiratory) + sternal patch (lower respiratory); generates crossed 8 GHz fields covering full respiratory tract distribution of influenza infection. Self-adhesive, 50 mW/cm², 20-min sessions.' },
        { icon: '💡', label: 'UV-C HVAC Integration', mechanism: '254 nm germicidal UV-C units installed in HVAC return ducts; continuously treats all recirculated air; kills aerosolized virions in 0.3 seconds of exposure; eliminates re-exposure to treated and untreated household members simultaneously.' },
      ],
      timeline: { total_days: 7, sessions_per_day: 2, session_min: 20, kpis: [
        { name: 'Viral Shedding',   points: [[0,100],[1,75],[2,50],[3,30],[4,15],[5,5],[7,0]] },
        { name: 'Fever',            points: [[0,100],[1,65],[2,35],[3,15],[4,5],[5,0],[7,0]] },
        { name: 'Symptom Score',    points: [[0,100],[1,80],[2,55],[3,30],[4,12],[5,3],[7,0]] },
      ]},
    },
  },
  {
    match: /Staphylococcus aureus|MRSA/i,
    data: {
      delivery_systems: [
        { icon: '🔊', label: 'Ultrasonic Wound Probe', mechanism: 'Handheld 770 kHz piezoelectric transducer with sterile coupling gel; pressed directly against wound dressing or periwound skin; produces standing wave that simultaneously disrupts MRSA biofilm matrix (mechanical debridement) and lyses planktonic cells in wound exudate. Single-use disposable probe tip for sterility.' },
        { icon: '📳', label: 'Adhesive Vibrational Wound Patch', mechanism: 'Flexible piezo-polymer film embedded in transparent self-adhesive wound dressing; worn continuously at 770 kHz for 8-hour active cycles; powers from connected wearable unit; reaches all wound depths without repositioning; changes with routine dressing changes.' },
        { icon: '💡', label: 'Photodynamic Wound Light Pad', mechanism: '415 nm blue-light LED pad positioned 5 mm above wound surface; activates endogenous porphyrins (PPIX) in S. aureus membrane, generating singlet oxygen that oxidizes bacterial cell wall; combined with acoustic protocol increases bactericidal rate 6× vs. either modality alone.' },
      ],
      timeline: { total_days: 14, sessions_per_day: 2, session_min: 60, kpis: [
        { name: 'Colony Count',     points: [[0,100],[1,70],[2,45],[3,28],[5,14],[7,5],[10,1],[14,0]] },
        { name: 'Biofilm Mass',     points: [[0,100],[1,80],[2,55],[3,32],[5,18],[7,7],[10,2],[14,0]] },
        { name: 'Wound Area',       points: [[0,100],[2,90],[4,75],[6,55],[8,35],[10,18],[12,8],[14,2]] },
      ]},
    },
  },
  {
    match: /Mycobacterium tuberculosis/i,
    data: {
      delivery_systems: [
        { icon: '💨', label: 'Ultrasonic Therapeutic Nebulizer', mechanism: 'High-frequency mesh nebulizer generates 5 µm MMAD droplets (optimal alveolar deposition) carrying piezo-active nano-suspension; inhaled into alveolar space where particles reach TB granulomas and resonate at 193 kHz; dissolves granuloma fibrotic capsule to expose shielded bacilli to immune response and concurrent antibiotics.' },
        { icon: '🔊', label: 'Acoustic Chest Therapy Vest', mechanism: 'Inflatable vest with 12 embedded 193 kHz ultrasonic transducers and acoustic coupling gel pads positioned over lung fields; delivers transthoracic standing waves targeting whole-lung volume including hilar lymph nodes; 20-min sessions 2× daily; patient sits upright for optimal acoustic transmission.' },
        { icon: '📳', label: 'Resonant Breathing Apparatus', mechanism: 'Modified respirator mask with piezo elements embedded in the inhalation valve; patient breathes normally; each inspiration carries 193 kHz modulated air column resonating within bronchial tree at TB bacillus scale; passive delivery — no active sessions required; used overnight.' },
      ],
      timeline: { total_days: 180, sessions_per_day: 2, session_min: 20, kpis: [
        { name: 'Sputum Smear',    points: [[0,100],[14,92],[30,72],[60,45],[90,22],[120,8],[150,2],[180,0]] },
        { name: 'Culture Growth',  points: [[0,100],[30,85],[60,60],[90,35],[120,15],[150,4],[180,0]] },
        { name: 'CXR Infiltrate',  points: [[0,100],[30,90],[60,72],[90,50],[120,30],[150,12],[180,3]] },
      ]},
    },
  },
  {
    match: /Helicobacter pylori/i,
    data: {
      delivery_systems: [
        { icon: '💊', label: 'Gastric-Release Acoustic Capsule', mechanism: 'Enteric-coated capsule containing pH-sensitive piezo microspheres (3 µm, matched to H. pylori size); dissolves in gastric acid (pH < 2) within 10 min of ingestion; releases microspheres that resonate at 257 kHz locally in gastric mucosa and antral folds where H. pylori colonises. Taken 30 min before meals.' },
        { icon: '📳', label: 'Epigastric Vibrational Belt', mechanism: 'Wearable belt with 4 focused transducer pads positioned over the epigastric region (just below sternum); delivers 257 kHz transcutaneously through 10 cm of abdominal tissue; patient wears for 90-min post-meal sessions when stomach is full and acoustically coupled through fluid. Gel pad optimises dermal contact.' },
        { icon: '🔊', label: 'Endoscopic Acoustic Probe', mechanism: 'Modified 2.8 mm endoscope channel accessory with 257 kHz micro-transducer tip; delivers focused acoustic energy directly to antral mucosa during standard upper GI endoscopy; maximum precision, single-session treatment; targets visible ulcer base and surrounding colonised tissue.' },
      ],
      timeline: { total_days: 28, sessions_per_day: 3, session_min: 30, kpis: [
        { name: 'H. pylori Load',  points: [[0,100],[3,78],[7,52],[14,28],[21,10],[28,2]] },
        { name: 'Gastric pH',      points: [[0,100],[3,80],[7,55],[14,30],[21,12],[28,3]] },
        { name: 'Pain Score',      points: [[0,100],[2,75],[5,50],[10,28],[18,10],[28,2]] },
      ]},
    },
  },
  {
    match: /HeLa|Cancer Cell/i,
    data: {
      delivery_systems: [
        { icon: '🎯', label: 'Imaging-Guided HIFU Probe', mechanism: 'High-Intensity Focused Ultrasound at 25.7 kHz with real-time MRI or ultrasound imaging guidance; phased array transducer focuses beam at tumor centroid with millimetre precision; cancer cells lyse at resonant frequency while surrounding tissue — mismatched by >3× in size — is preserved. Session performed in clinical imaging suite.' },
        { icon: '💊', label: 'IV Acoustic Sensitizer (EPRT)', mechanism: 'IV infusion of lipid-shelled microbubbles (30 µm, tuned to cancer cell size); preferentially accumulate in tumor vasculature via Enhanced Permeability and Retention (EPR) effect within 2-6 hrs post-infusion; when external HIFU applied, sensitized microbubbles undergo resonant cavitation amplifying tumor kill by 10× and reducing required power by 90%.' },
        { icon: '📡', label: 'Percutaneous RF Ablation Needle', mechanism: 'CT-guided needle antenna inserted directly into tumor mass; delivers 10 MHz modulated RF at cancer cell resonant frequency; combined with IV acoustic sensitizer for whole-tumor field coverage; used for tumors >3 cm where external HIFU penetration is insufficient.' },
      ],
      timeline: { total_days: 90, sessions_per_day: 1, session_min: 60, kpis: [
        { name: 'Tumor Volume',    points: [[0,100],[7,92],[14,78],[30,55],[45,35],[60,18],[75,7],[90,2]] },
        { name: 'Viable Cells',    points: [[0,100],[3,85],[7,65],[14,42],[21,25],[30,12],[45,4],[60,1]] },
        { name: 'Biomarkers',      points: [[0,100],[7,88],[14,70],[30,48],[45,28],[60,12],[75,4],[90,1]] },
      ]},
    },
  },
  {
    match: /Plasmodium falciparum|Malaria/i,
    data: {
      delivery_systems: [
        { icon: '📳', label: 'Radial Artery Resonant Band', mechanism: 'Wearable silicone wristband with three contact piezo transducers positioned over the radial artery; delivers 154 kHz directly into bloodstream via transdermal acoustic coupling; blood acts as transmission medium carrying resonance through the entire circulatory system with each heart cycle. Worn continuously during treatment period.' },
        { icon: '🔊', label: 'Spleen/Liver Transducer Pad', mechanism: 'Contact ultrasound coupling pad applied with gel to the left upper quadrant over the spleen — where P. falciparum parasites sequester during ring stage maturation; 154 kHz standing wave disrupts parasite invasion-egress cycle in red blood cells within splenic sinusoids. 60-min sessions post-fever peak.' },
        { icon: '💊', label: 'Gas-Core Acoustic Microsphere Agent', mechanism: 'Oral or IV encapsulated gas-filled microspheres (5 µm diameter, matched to parasite size); circulate within red blood cells; undergo resonant cavitation at 154 kHz when radial artery band is active; generated micro-jets selectively rupture parasitised RBCs while uninfected RBCs — larger and stiffer — remain intact.' },
      ],
      timeline: { total_days: 14, sessions_per_day: 2, session_min: 60, kpis: [
        { name: 'Parasitemia %',   points: [[0,100],[1,70],[2,45],[3,25],[4,12],[5,5],[7,1],[14,0]] },
        { name: 'Fever Score',     points: [[0,100],[1,60],[2,30],[3,12],[4,4],[5,0],[7,0],[14,0]] },
        { name: 'RBC Health',      points: [[0,100],[2,80],[3,55],[4,33],[5,16],[7,5],[10,1],[14,0]] },
      ]},
    },
  },
];

// ─── Fallback derive from delivery_mode ──────────────────────────────────────
function deriveDeliverySystems(deliveryMode?: string, targetTissue?: string): DeliverySystem[] {
  if (deliveryMode === 'microwave') return [
    { icon: '📡', label: 'Contact RF Emitter Patch', mechanism: `Flexible adhesive microstrip antenna patch; applied over ${targetTissue ?? 'infection site'}; emits focused RF field at pathogen resonant frequency. 50 mW/cm², 30-min sessions 2× daily.` },
    { icon: '💨', label: 'Resonant Aerosol (if respiratory)', mechanism: 'Nebulized resonant nanoparticle suspension; inhaled to deliver particles to infection site where they amplify external RF field effect locally.' },
  ];
  if (deliveryMode === 'ultrasonic' || deliveryMode === 'ultrasonic_focused') return [
    { icon: '🔊', label: 'Ultrasonic Transducer Probe', mechanism: `Handheld piezo transducer with coupling gel; applied to skin over ${targetTissue ?? 'infection site'}; delivers therapeutic ultrasound at pathogen resonant frequency.` },
    { icon: '📳', label: 'Vibrational Therapy Pad', mechanism: 'Flexible piezo-polymer adhesive pad worn over treatment area; continuous passive delivery during daily activity or sleep.' },
    { icon: '💊', label: 'Acoustic Agent Capsule', mechanism: 'Oral or IV acoustic sensitizer matched to pathogen size; localises therapeutic effect and reduces required external power.' },
  ];
  return [
    { icon: '📡', label: 'Targeted Emitter', mechanism: 'Targeted delivery at pathogen resonant frequency via appropriate emitter device.' },
  ];
}

function deriveTimeline(freqGhz?: number): Timeline | null {
  if (freqGhz == null) return null;
  const isViral = freqGhz >= 1;
  return {
    total_days: isViral ? 10 : 21,
    sessions_per_day: 2,
    session_min: isViral ? 30 : 60,
    kpis: [
      { name: 'Pathogen Load', points: isViral
        ? [[0,100],[2,70],[4,45],[6,22],[8,8],[10,1]]
        : [[0,100],[3,75],[7,50],[10,28],[14,12],[21,2]] },
      { name: 'Symptom Score', points: isViral
        ? [[0,100],[1,75],[3,45],[5,20],[7,5],[10,0]]
        : [[0,100],[3,80],[7,55],[10,30],[14,10],[21,0]] },
    ],
  };
}

// ─── Protocol lookup ─────────────────────────────────────────────────────────
function lookupProtocol(name: string, meta: any): { delivery_systems: DeliverySystem[]; timeline: Timeline | null } {
  const match = PROTOCOLS.find(p => p.match.test(name));
  if (match) return { delivery_systems: match.data.delivery_systems, timeline: match.data.timeline };
  const ds = deriveDeliverySystems(meta?.delivery_mode, meta?.target_tissue);
  const tl = deriveTimeline(meta?.resonant_freq_ghz);
  return { delivery_systems: ds, timeline: tl };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const D = {
  bg: '#070b14', panel: '#0d1424', raised: '#111827',
  border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155',
};

function fmt(ghz: number): string {
  if (ghz >= 1)     return ghz.toFixed(1) + ' GHz';
  if (ghz >= 0.001) return (ghz * 1000).toFixed(1) + ' MHz';
  return (ghz * 1_000_000).toFixed(1) + ' kHz';
}

const DELIVERY_META: Record<string, { icon: string; label: string; color: string }> = {
  microwave:          { icon: '📡', label: 'Focused Microwave / RF',   color: '#ef4444' },
  ultrasonic:         { icon: '🔊', label: 'Therapeutic Ultrasound',    color: '#8b5cf6' },
  ultrasonic_focused: { icon: '🎯', label: 'Focused Ultrasound (HIFU)', color: '#f59e0b' },
  photonic:           { icon: '💡', label: 'Photonic / Laser',          color: '#22d3ee' },
};

function deriveProto(freqGhz?: number, acousticKhz?: number) {
  if (freqGhz == null) return null;
  if (freqGhz >= 1) return { delivery_mode: 'microwave',  power_wcm2: 0.05, duration_sec: 30, penetration_cm: Math.max(0.3, Math.min(5, 10 / freqGhz)) };
  return {
    delivery_mode: acousticKhz != null ? 'ultrasonic' : 'microwave',
    power_wcm2: 0.30, duration_sec: 60,
    penetration_cm: acousticKhz ? Math.min(15, Math.max(3, 1540000 / (acousticKhz * 100000))) : 5,
  };
}

function InfoCard({ label, value, sub, bg, border, textColor, mono }: {
  label: string; value: string; sub?: string;
  bg: string; border: string; textColor: string; mono?: boolean;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '0.6rem', textAlign: 'center' as const }}>
      <div style={{ fontSize: '0.42rem', color: textColor, fontWeight: 800, letterSpacing: '0.08em', opacity: 0.75 }}>{label}</div>
      <div style={{ fontFamily: mono ? 'monospace' : 'inherit', fontWeight: 900, fontSize: '0.95rem', color: textColor, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.4rem', color: textColor, opacity: 0.5, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ─── KPI Chart ───────────────────────────────────────────────────────────────
const KPI_COLORS = ['#ef4444', '#f59e0b', '#22d3ee'];

function KpiChart({ timeline }: { timeline: Timeline }) {
  const { total_days, kpis } = timeline;
  const W = 260, H = 110;
  const PAD = { t: 16, r: 8, b: 28, l: 36 };
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b;

  const toX = (d: number) => PAD.l + (d / total_days) * IW;
  const toY = (v: number) => PAD.t + (v / 100) * IH;

  const curve = (pts: [number, number][]) =>
    pts.map(([d, v], i) => {
      const x = toX(d), y = toY(v);
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      const [pd, pv] = pts[i - 1];
      const px = toX(pd), py = toY(pv);
      const cx = (px + x) / 2;
      return `C ${cx.toFixed(1)} ${py.toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * total_days));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => (
        <line key={v} x1={PAD.l} x2={W - PAD.r} y1={toY(v)} y2={toY(v)}
          stroke="#1e293b" strokeWidth={v === 0 || v === 100 ? 1 : 0.5} strokeDasharray={v === 0 ? '' : '3,3'} />
      ))}
      {/* Y labels */}
      {[0, 50, 100].map(v => (
        <text key={v} x={PAD.l - 4} y={toY(v) + 3} textAnchor="end" fontSize={7} fill="#475569">{100 - v}%</text>
      ))}
      {/* X labels */}
      {xTicks.map(d => {
        const label = total_days >= 30 ? (d >= 14 ? `${Math.round(d / 7)}w` : `${d}d`) : `${d}d`;
        return <text key={d} x={toX(d)} y={H - 4} textAnchor="middle" fontSize={6.5} fill="#475569">{label}</text>;
      })}
      {/* Legend */}
      {kpis.map((k, i) => (
        <g key={i} transform={`translate(${PAD.l + i * (IW / kpis.length)}, 4)`}>
          <line x1={0} x2={10} y1={4} y2={4} stroke={KPI_COLORS[i % KPI_COLORS.length]} strokeWidth={1.5} />
          <text x={13} y={7} fontSize={6.5} fill={KPI_COLORS[i % KPI_COLORS.length]}>{k.name}</text>
        </g>
      ))}
      {/* KPI lines */}
      {kpis.map((k, i) => (
        <path key={i} d={curve(k.points)} fill="none"
          stroke={KPI_COLORS[i % KPI_COLORS.length]} strokeWidth={1.5} strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ─── PathogenDetail panel ────────────────────────────────────────────────────
function PathogenDetail({ entry }: { entry: OctaveEntry }) {
  const meta      = (entry as any).meta ?? {};
  const freqGhz   = meta.resonant_freq_ghz as number | undefined;
  const acousticKhz = meta.acoustic_khz as number | undefined;
  const sizeNm    = meta.size_nm as number | undefined;
  const isPredicted = entry.status === 'predicted';

  const emDisplay = freqGhz != null ? fmt(freqGhz) : entry.freq_display;
  const acDisplay = acousticKhz != null
    ? (acousticKhz >= 1000 ? (acousticKhz / 1000).toFixed(1) + ' MHz' : acousticKhz.toFixed(0) + ' kHz')
    : null;
  const sizeDisplay = sizeNm != null
    ? (sizeNm >= 1000 ? (sizeNm / 1000).toFixed(1) + ' µm' : sizeNm + ' nm') : null;

  const proto = (meta.delivery_mode != null ? meta : deriveProto(freqGhz, acousticKhz)) as any;
  const dm    = proto ? DELIVERY_META[proto.delivery_mode] ?? DELIVERY_META['microwave'] : null;

  const { delivery_systems, timeline } = isPredicted
    ? { delivery_systems: [], timeline: null }
    : lookupProtocol(entry.name, meta);

  return (
    <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>

      {/* Frequencies */}
      <div style={{ display: 'grid', gridTemplateColumns: acDisplay ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
        <InfoCard label="⚡ EM DISRUPTION" value={emDisplay} sub="electromagnetic / microwave"
          bg="#1a0813" border="#7f1d1d" textColor="#ef4444" mono />
        {acDisplay && <InfoCard label="🔊 ACOUSTIC" value={acDisplay} sub="ultrasonic / acoustic"
          bg="#170a1a" border="#6d28d9" textColor="#8b5cf6" mono />}
      </div>

      {/* Size + domain */}
      {sizeDisplay && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <InfoCard label="PHYSICAL SIZE" value={sizeDisplay} bg={D.raised} border={D.border} textColor={D.text} mono />
          <InfoCard label="OCTAVE DOMAIN" value={entry.scale_label} bg={D.raised} border={D.border} textColor={D.text} />
        </div>
      )}

      {/* Treatment Protocol */}
      {proto && dm && !isPredicted && (
        <div style={{ background: '#0a1020', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ background: '#0f1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f',
            display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{dm.icon}</span>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.1em' }}>TREATMENT PROTOCOL</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.42rem', fontWeight: 700,
              background: dm.color + '22', color: dm.color, border: `1px solid ${dm.color}40`,
              padding: '1px 6px', borderRadius: 99 }}>{dm.label}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', padding: '0.5rem' }}>
            <InfoCard label="POWER" value={proto.power_wcm2 + ' W/cm²'} sub="dose" bg={D.raised} border={D.border} textColor="#38bdf8" />
            <InfoCard label="SESSION" value={proto.duration_sec >= 60 ? (proto.duration_sec/60).toFixed(0)+'m' : proto.duration_sec+'s'}
              sub="duration" bg={D.raised} border={D.border} textColor="#38bdf8" />
            <InfoCard label="DEPTH" value={proto.penetration_cm + ' cm'} sub="tissue" bg={D.raised} border={D.border} textColor="#38bdf8" />
          </div>
          {meta.target_tissue && (
            <div style={{ padding: '0 0.6rem 0.5rem' }}>
              <div style={{ fontSize: '0.4rem', color: D.muted, fontWeight: 700, marginBottom: 1 }}>TARGET TISSUE</div>
              <div style={{ fontSize: '0.68rem', color: '#93c5fd', lineHeight: 1.5 }}>{meta.target_tissue}</div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Systems */}
      {delivery_systems.length > 0 && (
        <div style={{ background: '#060f1a', border: '1px solid #1e3a5f', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ background: '#0c1e35', padding: '0.4rem 0.7rem', borderBottom: '1px solid #1e3a5f' }}>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.1em' }}>🚀 PHYSICAL DELIVERY SYSTEMS</span>
          </div>
          {delivery_systems.map((ds, i) => (
            <div key={i} style={{ padding: '0.55rem 0.7rem',
              borderBottom: i < delivery_systems.length - 1 ? `1px solid ${D.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{ds.icon}</span>
                <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#93c5fd' }}>{ds.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.67rem', color: '#475569', lineHeight: 1.55 }}>{ds.mechanism}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI Recovery Graph */}
      {timeline && (
        <div style={{ background: '#060f1a', border: '1px solid #14532d', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ background: '#0a1f14', padding: '0.4rem 0.7rem', borderBottom: '1px solid #14532d',
            display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>
              📈 PREDICTED RECOVERY TRAJECTORY
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.4rem', color: D.muted }}>
              {timeline.sessions_per_day}× daily · {timeline.session_min}min · {
                timeline.total_days >= 30 ? Math.round(timeline.total_days / 7) + ' weeks' : timeline.total_days + ' days'
              }
            </span>
          </div>
          <div style={{ padding: '0.5rem 0.4rem 0.2rem' }}>
            <KpiChart timeline={timeline} />
          </div>
          <div style={{ padding: '0 0.7rem 0.5rem', fontSize: '0.38rem', color: '#334155', lineHeight: 1.5 }}>
            Y-axis = % remaining pathogenic burden from baseline. All metrics trend toward 0% (resolved). Projections at therapeutic dose; individual outcomes vary.
          </div>
        </div>
      )}

      {/* Mechanism */}
      <div style={{ background: '#1a0e05', border: '1px solid #92400e', borderRadius: 8, padding: '0.65rem' }}>
        <div style={{ fontSize: '0.45rem', color: '#f59e0b', fontWeight: 800, marginBottom: 3 }}>⚡ DISRUPTION MECHANISM</div>
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#fbbf24', lineHeight: 1.55 }}>
          {isPredicted
            ? `φ-framework predicts a resonant target at ${emDisplay}. No confirmed entity at this position — open discovery candidate.`
            : `${entry.name} resonates at ${emDisplay}${acDisplay ? ` / ${acDisplay} acoustic` : ''}. ${dm?.label ?? 'Targeted'} delivery at therapeutic power induces mechanical stress on the pathogen structure via the size-frequency relationship (f = c / 2L). Human cells resonate ≥1000× below this frequency and are unaffected.`
          }
        </p>
      </div>

      {/* Contraindications */}
      {meta.contraindications && !isPredicted && (
        <div style={{ background: '#1c0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '0.6rem' }}>
          <div style={{ fontSize: '0.42rem', fontWeight: 800, color: '#f87171', letterSpacing: '0.08em', marginBottom: 2 }}>⚠️ CONTRAINDICATIONS</div>
          <p style={{ margin: 0, fontSize: '0.68rem', color: '#fca5a5', lineHeight: 1.5 }}>{meta.contraindications}</p>
        </div>
      )}

      {/* Human cell safety */}
      <div style={{ background: '#061610', border: '1px solid #14532d', borderRadius: 8, padding: '0.6rem' }}>
        <div style={{ fontSize: '0.42rem', color: '#4ade80', fontWeight: 800, marginBottom: 2 }}>🛡️ HUMAN CELL SAFETY</div>
        <p style={{ margin: 0, fontSize: '0.68rem', color: '#86efac', lineHeight: 1.5 }}>
          Human cells (10–100 µm) resonate in the kHz range. At {emDisplay}, targeting frequency is
          {entry.octave === 6
            ? ' 10⁶–10⁹× above mammalian cell resonance — no thermal or mechanical crossover at therapeutic power.'
            : ' ≥3 orders of magnitude above eukaryotic cell membrane resonance at < 0.5 W/cm².'
          }
        </p>
      </div>

      {/* Source */}
      <div style={{ background: D.raised, border: `1px solid ${D.border}`, borderRadius: 8, padding: '0.55rem' }}>
        <div style={{ fontSize: '0.4rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.08em', marginBottom: 2 }}>✓ SOURCE</div>
        <p style={{ margin: 0, fontSize: '0.67rem', color: D.muted, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.source}</p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function PathogenProtocolGenerator() {
  return (
    <OctaveExplorer
      title="Pathogen Protocol Generator"
      icon="⚡"
      description="φ-harmonic disruption frequencies for viruses (OCT-6: 10–500nm) and bacteria/fungi/parasites (OCT-7: 500nm–100µm). Each entry shows EM + acoustic counter-frequencies, physical delivery systems with mechanism details, and a predicted KPI recovery trajectory. Human cells resonate ≥1000× below all pathogen targeting frequencies."
      octaves={OCTAVES}
      toolColor="#ef4444"
      catalogFilter={CATALOG_FILTER}
      entryFilter={ENTRY_FILTER}
      renderDetail={(entry) => <PathogenDetail entry={entry} />}
    />
  );
}
