'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const UniversalFrequencyTranslator = dynamic(() => import('./applied-systems/UniversalFrequencyTranslator'), { ssr: false });
const CrossCatalogResonanceFinder  = dynamic(() => import('./applied-systems/CrossCatalogResonanceFinder'),  { ssr: false });
const PathogenProtocolGenerator    = dynamic(() => import('./applied-systems/PathogenProtocolGenerator'),    { ssr: false });
const SymptomFrequencyCompass      = dynamic(() => import('./applied-systems/SymptomFrequencyCompass'),      { ssr: false });
const GeneFrequencyProfile         = dynamic(() => import('./applied-systems/GeneFrequencyProfile'),         { ssr: false });
const ImmuneFrequencyMap           = dynamic(() => import('./applied-systems/ImmuneFrequencyMap'),           { ssr: false });
const AcousticDeviceBlueprint      = dynamic(() => import('./applied-systems/AcousticDeviceBlueprint'),      { ssr: false });
const TherapeuticLightProtocol     = dynamic(() => import('./applied-systems/TherapeuticLightProtocol'),     { ssr: false });
const SiteResonanceAssessment      = dynamic(() => import('./applied-systems/SiteResonanceAssessment'),      { ssr: false });
const WaterStructuringCalculator        = dynamic(() => import('./applied-systems/WaterStructuringCalculator'),        { ssr: false });
const AcousticPrintFormulator           = dynamic(() => import('./applied-systems/AcousticPrintFormulator'),           { ssr: false });
const StructuralResonanceAnalyzer       = dynamic(() => import('./applied-systems/StructuralResonanceAnalyzer'),       { ssr: false });
const SoilResonanceOptimizer            = dynamic(() => import('./applied-systems/SoilResonanceOptimizer'),            { ssr: false });
const AcousticBondingCalculator         = dynamic(() => import('./applied-systems/AcousticBondingCalculator'),         { ssr: false });
const AuricBatteryDesigner              = dynamic(() => import('./applied-systems/AuricBatteryDesigner'),              { ssr: false });
const SeedPreTreatmentFinder            = dynamic(() => import('./applied-systems/SeedPreTreatmentFinder'),            { ssr: false });
const CropYieldFrequencyMap             = dynamic(() => import('./applied-systems/CropYieldFrequencyMap'),             { ssr: false });
const PhiGeometryBuildingPlanner        = dynamic(() => import('./applied-systems/PhiGeometryBuildingPlanner'),        { ssr: false });
const PiezoelectricHarvesterDesigner    = dynamic(() => import('./applied-systems/PiezoelectricHarvesterDesigner'),    { ssr: false });
const SolarPhiOptimizationCalculator    = dynamic(() => import('./applied-systems/SolarPhiOptimizationCalculator'),    { ssr: false });

// ─── Types ──────────────────────────────────────────────────────────────────
type SystemDomain = 'Health & Biology' | 'Water & Agriculture' | 'Materials & Construction' | 'Energy' | 'Cross-Domain Tools';
type SystemStatus = 'ACTIVE' | 'PROTOTYPE' | 'PLANNED';

interface AppliedSystem {
    id: number;
    name: string;
    description: string;
    domain: SystemDomain;
    status: SystemStatus;
    toolId?: string;
    icon: string;
    tags: string[];
}

// ─── Domain config ──────────────────────────────────────────────────────────
const DOMAIN_CONFIG: Record<SystemDomain, { color: string; selected: string; label: string }> = {
    'Health & Biology':        { color: '#ef4444', selected: '#ef444422', label: '🩺 Health' },
    'Water & Agriculture':     { color: '#06b6d4', selected: '#06b6d422', label: '💧 Water' },
    'Materials & Construction':{ color: '#f59e0b', selected: '#f59e0b22', label: '🏗️ Materials' },
    'Energy':                  { color: '#6366f1', selected: '#6366f122', label: '⚡ Energy' },
    'Cross-Domain Tools':      { color: '#22c55e', selected: '#22c55e22', label: '🔬 Cross-Domain' },
};

// Dark theme tokens
const D = { bg: '#070b14', panel: '#0d1424', raised: '#111827', border: '#1e293b', text: '#e2e8f0', muted: '#64748b', dim: '#334155' };

// ─── Catalog ────────────────────────────────────────────────────────────────
const APPLIED_SYSTEMS: AppliedSystem[] = [
    {
        id: 1,
        name: 'Pathogen Protocol Generator',
        description: 'Input a pathogen → get the exact MHz/GHz disruption frequency, why human cells are unaffected, treatment duration, and device class required.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'pathogen-protocol',
        icon: '⚡',
        tags: ['bio-resonance', 'acoustic', 'pathogens', 'GHz', 'MHz'],
    },
    {
        id: 2,
        name: 'Symptom → Frequency Compass',
        description: 'Report symptoms → maps to chakra deficit/excess → identifies gene anchor → recommends light/sound/dietary protocol.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'symptom-compass',
        icon: '🧭',
        tags: ['symptoms', 'chakra', 'light', 'sound', 'dietary'],
    },
    {
        id: 3,
        name: 'Gene Frequency Profile',
        description: 'Select gene variants → plot on the fRRM scale → see which body systems are running off-optimal frequency → get targeted intervention list.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'gene-profile',
        icon: '🧬',
        tags: ['genome', 'fRRM', 'gene catalog', 'body systems'],
    },
    {
        id: 4,
        name: 'Acoustic Device Blueprint',
        description: 'Select target (pathogen / organ / chakra) → output transducer spec: frequency band, power, pulse duration, beam geometry.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'acoustic-blueprint',
        icon: '📡',
        tags: ['acoustic', 'transducer', 'device', 'blueprint', 'pulse'],
    },
    {
        id: 5,
        name: 'Therapeutic Light Protocol',
        description: 'Choose condition/chakra → get wavelength (nm), fRRM, LED/laser class, exposure time, contraindications.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'light-protocol',
        icon: '💡',
        tags: ['light', 'photon', 'wavelength', 'nm', 'LED', 'laser', 'chakra'],
    },
    {
        id: 6,
        name: 'Immune Frequency Map',
        description: 'Visual octave ring map of all immune cells (T-Cell, NK, Macrophage, Neutrophil, Dendritic). Select any cell to get its stimulation protocol and research citations.',
        domain: 'Health & Biology',
        status: 'ACTIVE',
        toolId: 'immune-map',
        icon: '🛡️',
        tags: ['immune', 'cells', 'OCT-7', 'stimulation', 'MHz'],
    },
    {
        id: 7,
        name: 'Water Structuring Calculator',
        description: 'Select mineral ion → compute acoustic structuring frequency from cluster physics (f = c_water / 2 × cluster_nm). Blend mode for multi-mineral protocols.',
        domain: 'Water & Agriculture',
        status: 'ACTIVE',
        toolId: 'water-structuring',
        icon: '💧',
        tags: ['water', 'acoustic', 'minerals', 'structuring'],
    },
    {
        id: 8,
        name: 'Soil Resonance Optimizer',
        description: 'Input soil composition (minerals, pH, density) → output φ-harmonic acoustic treatment for remineralization and microbial activation.',
        domain: 'Water & Agriculture',
        status: 'ACTIVE',
        toolId: 'soil-resonance',
        icon: '🌱',
        tags: ['soil', 'φ-harmonic', 'minerals', 'microbial', 'remineralization'],
    },
    {
        id: 9,
        name: 'Seed Pre-Treatment Finder',
        description: 'Select crop/seed type → get optimal acoustic or EM pre-soak frequency to enhance germination rates based on fRRM resonance.',
        domain: 'Water & Agriculture',
        status: 'ACTIVE',
        toolId: 'seed-pretreatment',
        icon: '🌾',
        tags: ['seed', 'crop', 'acoustic', 'EM', 'germination', 'fRRM'],
    },
    {
        id: 10,
        name: 'Crop Yield Frequency Map',
        description: 'Plot farm coordinates on φ-ring system → identify resonance quality of site → recommend acoustic soil treatment and optimal planting geometry.',
        domain: 'Water & Agriculture',
        status: 'ACTIVE',
        toolId: 'crop-yield-map',
        icon: '🗺️',
        tags: ['crop', 'φ-ring', 'geographic', 'resonance', 'planting'],
    },
    {
        id: 11,
        name: 'Acoustic Print Formulator',
        description: 'Select material → get acoustic levitation frequency (from NIST spectral IDs), transducer config, power and build-rate protocol.',
        domain: 'Materials & Construction',
        status: 'ACTIVE',
        toolId: 'acoustic-print',
        icon: '🖨️',
        tags: ['acoustic printing', 'materials', 'elements', 'frequency'],
    },
    {
        id: 12,
        name: 'Structural Resonance Analyzer',
        description: 'Input building height, floors, and material type → compute natural resonance frequencies → flag Schumann and seismic overlap risks.',
        domain: 'Materials & Construction',
        status: 'ACTIVE',
        toolId: 'structural-resonance',
        icon: '🏛️',
        tags: ['structural', 'resonance', 'seismic', 'building', 'risk'],
    },
    {
        id: 13,
        name: 'Acoustic Bonding Calculator',
        description: 'Select two materials to join → calculate the frequency needed for acoustic welding/bonding without adhesives.',
        domain: 'Materials & Construction',
        status: 'ACTIVE',
        toolId: 'acoustic-bonding',
        icon: '🔗',
        tags: ['bonding', 'welding', 'acoustic', 'materials', 'adhesive-free'],
    },
    {
        id: 14,
        name: 'φ-Geometry Building Planner',
        description: 'Input site dimensions → auto-generate φ-proportioned floor plans, spacing, room ratios → outputs as a design guide.',
        domain: 'Materials & Construction',
        status: 'ACTIVE',
        toolId: 'phi-building-planner',
        icon: '📐',
        tags: ['φ-geometry', 'floor plan', 'golden ratio', 'architecture'],
    },
    {
        id: 15,
        name: 'Auric Battery Designer',
        description: 'Select geometry type and materials → calculate field coupling efficiency, energy storage density, and discharge profile for resonant energy storage.',
        domain: 'Energy',
        status: 'ACTIVE',
        toolId: 'auric-battery',
        icon: '🔋',
        tags: ['battery', 'field coupling', 'resonance', 'energy storage'],
    },
    {
        id: 16,
        name: 'Piezoelectric Harvester Designer',
        description: 'Input environment (footfall, wind, vibration source) → select optimal crystal geometry + dimensions → output power yield estimate.',
        domain: 'Energy',
        status: 'ACTIVE',
        toolId: 'piezo-harvester',
        icon: '⚙️',
        tags: ['piezoelectric', 'harvesting', 'crystal', 'vibration', 'power'],
    },
    {
        id: 17,
        name: 'Solar φ-Optimization Calculator',
        description: 'Input panel array dimensions → calculate optimal φ-ratio cell arrangement → estimate efficiency gain compared to standard rectangular grid layout.',
        domain: 'Energy',
        status: 'ACTIVE',
        toolId: 'solar-phi-calc',
        icon: '☀️',
        tags: ['solar', 'φ-ratio', 'efficiency', 'panel layout', 'optimization'],
    },
    {
        id: 18,
        name: 'Universal Frequency Translator',
        description: 'Input any frequency in any unit (nm, Hz, GHz, THz, fRRM) → converts to all other units and shows which octave domain it sits in across the full Cosmic Compass scale.',
        domain: 'Cross-Domain Tools',
        status: 'ACTIVE',
        toolId: 'universal-translator',
        icon: '🔄',
        tags: ['converter', 'fRRM', 'nm', 'THz', 'GHz', 'octave'],
    },
    {
        id: 19,
        name: 'Cross-Catalog Resonance Finder',
        description: 'Input a frequency → search all catalogs simultaneously (genes, pathogens, chakras, celestial, atomic) → return every entity resonating at that frequency.',
        domain: 'Cross-Domain Tools',
        status: 'ACTIVE',
        toolId: 'cross-catalog-finder',
        icon: '🔍',
        tags: ['search', 'all catalogs', 'resonance', 'cross-domain', 'fRRM'],
    },
    {
        id: 20,
        name: 'Site Resonance Assessment',
        description: 'Input GPS coordinates → compute distance from Great Zimbabwe → identify which φ-ring the site sits on → resonance quality score + recommendations.',
        domain: 'Cross-Domain Tools',
        status: 'ACTIVE',
        toolId: 'site-resonance',
        icon: '📍',
        tags: ['GPS', 'Great Zimbabwe', 'φ-ring', 'site assessment', 'geographic'],
    },
];

const DOMAIN_ORDER: SystemDomain[] = [
    'Health & Biology',
    'Water & Agriculture',
    'Materials & Construction',
    'Energy',
    'Cross-Domain Tools',
];

// ─── Tool Panel ──────────────────────────────────────────────────────────────
function ToolPanel({ toolId, system }: { toolId: string; system: AppliedSystem }) {
    switch (toolId) {
        case 'universal-translator':  return <UniversalFrequencyTranslator />;
        case 'cross-catalog-finder':  return <CrossCatalogResonanceFinder />;
        case 'pathogen-protocol':     return <PathogenProtocolGenerator />;
        case 'symptom-compass':       return <SymptomFrequencyCompass />;
        case 'gene-profile':          return <GeneFrequencyProfile />;
        case 'immune-map':            return <ImmuneFrequencyMap />;
        case 'acoustic-blueprint':    return <AcousticDeviceBlueprint />;
        case 'light-protocol':        return <TherapeuticLightProtocol />;
        case 'site-resonance':        return <SiteResonanceAssessment />;
        case 'water-structuring':     return <WaterStructuringCalculator />;
        case 'acoustic-print':        return <AcousticPrintFormulator />;
        case 'structural-resonance':  return <StructuralResonanceAnalyzer />;
        case 'soil-resonance':        return <SoilResonanceOptimizer />;
        case 'acoustic-bonding':      return <AcousticBondingCalculator />;
        case 'auric-battery':         return <AuricBatteryDesigner />;
        case 'seed-pretreatment':     return <SeedPreTreatmentFinder />;
        case 'crop-yield-map':        return <CropYieldFrequencyMap />;
        case 'phi-building-planner':  return <PhiGeometryBuildingPlanner />;
        case 'piezo-harvester':       return <PiezoelectricHarvesterDesigner />;
        case 'solar-phi-calc':        return <SolarPhiOptimizationCalculator />;
        default: return (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' as const, color: D.muted, background: D.bg, minHeight: 400, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>{system.icon}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: D.text, marginBottom: '0.5rem' }}>{system.name}</div>
                <div style={{ fontSize: '0.82rem', maxWidth: 380, margin: '0 auto 1.5rem', lineHeight: 1.7, color: D.muted }}>{system.description}</div>
                <div style={{ display: 'inline-block', background: D.raised, border: `1px solid ${D.border}`, borderRadius: 99, padding: '0.4rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: D.dim }}>
                    🚧 Coming Soon
                </div>
            </div>
        );
    }
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' as const, background: D.bg }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.15 }}>🔬</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: D.dim, marginBottom: '0.4rem' }}>Select a system</div>
            <div style={{ fontSize: '0.78rem', maxWidth: 280, lineHeight: 1.6, color: D.dim }}>
                Choose any tool from the left panel. Systems marked <strong style={{ color: '#818cf8' }}>NEW</strong> are live and ready to use.
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AppliedSystemsSection() {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const selectedSystem = APPLIED_SYSTEMS.find(s => s.id === selectedId) ?? null;

    // Group by domain
    const byDomain = DOMAIN_ORDER.map(domain => ({
        domain,
        cfg: DOMAIN_CONFIG[domain],
        systems: APPLIED_SYSTEMS.filter(s => s.domain === domain),
    }));

    const activeCount = APPLIED_SYSTEMS.filter(s => s.toolId).length;

    return (
        <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 2rem 0', background: D.bg, minHeight: '100vh' }}>
            {/* Section header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' as const }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: D.text, margin: 0 }}>
                        Applied Technology Systems
                    </h2>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: D.muted, background: D.raised, border: `1px solid ${D.border}`, padding: '2px 10px', borderRadius: 99 }}>
                        {APPLIED_SYSTEMS.length} systems
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#818cf8', background: '#6366f122', padding: '2px 10px', borderRadius: 99, border: '1px solid #6366f140' }}>
                        {activeCount} LIVE
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: D.muted, maxWidth: 600 }}>
                    Practical tools powered by the Cosmic Compass φ-harmonic framework. Select a system on the left to open its tool.
                </p>
            </div>

            {/* Two-panel layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '1rem',
                paddingBottom: '2rem',
                alignItems: 'start',
            }}>
                {/* ── LEFT: Nav list ── */}
                <div style={{
                    borderRight: `1px solid ${D.border}`,
                    paddingRight: '0.75rem',
                }}>
                    {byDomain.map(({ domain, cfg, systems }) => (
                        <div key={domain} style={{ marginBottom: '1.1rem' }}>
                            <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em', color: cfg.color, marginBottom: '0.35rem', padding: '0 0.2rem' }}>
                                {cfg.label.toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.15rem' }}>
                                {systems.map(system => {
                                    const isSelected = selectedId === system.id;
                                    const isLive = !!system.toolId;
                                    return (
                                        <button key={system.id}
                                            onClick={() => setSelectedId(isSelected ? null : system.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.55rem',
                                                padding: '0.5rem 0.65rem', borderRadius: 8,
                                                background: isSelected ? cfg.selected : 'transparent',
                                                border: `1px solid ${isSelected ? cfg.color + '50' : 'transparent'}`,
                                                cursor: 'pointer', textAlign: 'left' as const,
                                                fontFamily: 'inherit', transition: 'all 0.13s', width: '100%',
                                            }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = D.raised; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                        >
                                            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{system.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.77rem', fontWeight: isSelected ? 700 : 500,
                                                    color: isSelected ? cfg.color : D.muted,
                                                    whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>
                                                    {system.name}
                                                </div>
                                            </div>
                                            {isLive && (
                                                <span style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.06em',
                                                    color: '#fff', background: '#6366f1', padding: '1px 5px', borderRadius: 99, flexShrink: 0 }}>NEW</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── RIGHT: Content panel ── */}
                <div style={{
                    background: D.bg,
                    border: `1px solid ${D.border}`,
                    borderRadius: 16,
                    position: 'relative' as const,
                }}>
                    {selectedSystem
                        ? <ToolPanel toolId={selectedSystem.toolId ?? ''} system={selectedSystem} />
                        : <EmptyState />
                    }

                </div>
            </div>
        </div>
    );
}
