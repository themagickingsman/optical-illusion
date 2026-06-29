"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HEALTH_CATALOG } from '../../state/science/catalogs/health_catalog';

// ─── Theme ──────────────────────────────────────────────────────────────────
const BIO_THEME = {
    background: '#020c10',
    surface: 'rgba(2, 20, 30, 0.85)',
    border: 'rgba(20, 184, 166, 0.18)',
    grid: 'rgba(20, 184, 166, 0.04)',
    pathogen:    '#ef4444',
    healthy:     '#14b8a6',
    therapeutic: '#a78bfa',
    molecular:   '#818cf8',
    nuclear:     '#06b6d4',
    pathogenGlow:    'rgba(239, 68, 68, 0.4)',
    healthyGlow:     'rgba(20, 184, 166, 0.4)',
    therapeuticGlow: 'rgba(167, 139, 250, 0.4)',
    molecularGlow:   'rgba(129, 140, 248, 0.25)',
};

interface BioEntity {
    name: string;
    size_nm: number;
    octave: number;
    health_status: 'pathogen' | 'healthy' | 'therapeutic' | 'molecular' | 'nuclear';
    resonant_freq_ghz?: number;
    source?: string;
}

function deriveOctave(size_nm: number): number {
    if (size_nm > 500) return 7;
    if (size_nm > 5)   return 6;
    return 5;
}

const BIO_ENTITIES: BioEntity[] = (HEALTH_CATALOG as unknown as any[])
    .filter((e: any) => e.meta?.health_status && e.meta?.size_nm)
    .map((e: any) => ({
        name: e.name,
        size_nm: e.meta.size_nm,
        octave: deriveOctave(e.meta.size_nm),
        health_status: e.meta.health_status as BioEntity['health_status'],
        resonant_freq_ghz: e.meta.resonant_freq_ghz,
        source: e.source,
    }));

// ─── Mechanism lookup from published research ──────────────────────────────
const MECHANISMS: Record<string, { disrupt?: string; stimulate?: string; paper: string }> = {
    'SARS-CoV-2': {
        disrupt: 'Spike protein resonates at 7.3–7.4 GHz → mechanical collapse of capsid within milliseconds',
        paper: 'USAF MD Simulation 2021 / NIH SRET — 4 GHz & 7.5 GHz dipolar modes'
    },
    'HIV': {
        disrupt: 'Viral envelope resonates at 18 GHz → membrane rupture via SRET dipolar mode',
        paper: 'Kenkyu Group / Viral Resonance Database 2020'
    },
    'Ebola': {
        disrupt: '19 GHz resonance disrupts nucleocapsid structure → envelope lysis',
        paper: 'WHO / Kenkyu Group 2020'
    },
    'Influenza': {
        disrupt: '8–11 GHz acoustic resonance collapses hemagglutinin spikes → 94% titer reduction',
        paper: 'NIH — Avian H5N1 microwave inactivation study'
    },
    'S. aureus': {
        disrupt: 'Traveling surface acoustic waves (TSAWs) generate cavitation → cell wall lysis',
        paper: 'NIH — Gram-positive bacterial acoustic lysis'
    },
    'E. coli': {
        disrupt: 'High-frequency pressure waves stress bacterial membrane → lysis',
        paper: 'NIH PMID — E. coli acoustic disruption'
    },
    'Red Blood Cell': {
        stimulate: 'MHz-range resonance improves RBC membrane flexibility and oxygen transport',
        paper: 'PEMF therapy — erythrocyte membrane studies'
    },
    'T-Cell': {
        stimulate: 'Acoustic stimulation at cellular resonance enhances immune T-cell activation',
        paper: 'Vibroacoustic immunology — cellular MHz stimulation'
    },
    'Macrophage': {
        stimulate: 'Resonant acoustic fields enhance phagocytosis and inflammatory signaling',
        paper: 'PEMF macrophage activation research'
    },
};

function getMechanism(entity: BioEntity, mode: 'disrupt' | 'stimulate') {
    for (const [key, val] of Object.entries(MECHANISMS)) {
        if (entity.name.toLowerCase().includes(key.toLowerCase())) {
            if (mode === 'disrupt' && val.disrupt) return { text: val.disrupt, paper: val.paper };
            if (mode === 'stimulate' && val.stimulate) return { text: val.stimulate, paper: val.paper };
            if (val.disrupt) return { text: val.disrupt, paper: val.paper };
        }
    }
    if (mode === 'disrupt' && entity.resonant_freq_ghz) {
        return {
            text: `${entity.resonant_freq_ghz} GHz resonance targets pathogen structure → lysis`,
            paper: entity.source || 'Published resonance data'
        };
    }
    if (mode === 'stimulate') {
        const mhz = entity.size_nm > 0 ? Math.round(3e8 / (entity.size_nm * 1e-9) / 1e6) : 0;
        return {
            text: `${mhz > 0 ? `~${mhz} MHz` : 'cellular-range'} resonance stimulates membrane function`,
            paper: entity.source || 'Vibroacoustic therapy research'
        };
    }
    return null;
}

// ─── Treatment Pathways — deep explanation for every entity ─────────────────
const TREATMENT_PATHWAYS: Record<string, {
    fingerprint: string;
    pathway: string;
    outcome: string;
}> = {
    'SARS-CoV-2': {
        fingerprint: 'Spherical envelope (100nm) with 72 trimeric spike proteins in a quasi-icosahedral arrangement. Spike S1/S2 subunits form trimers with distinct twofold symmetry. The envelope\'s fullerene-like geometry creates discrete breathing modes at 4 GHz and 7.4 GHz — not present in any human cellular structure.',
        pathway: 'Non-integrating RNA virus — does NOT insert into host DNA. Free virions can be disrupted at 7.4 GHz via Structure-Resonant Energy Transfer (SRET), collapsing spike protein geometry. With viral load reduced, immune clearance handles remaining intracellular replications. No genetic reservoir means complete clearance is achievable.',
        outcome: 'Functional cure achievable. Estimated viral clearance: 2–4 weeks of targeted GHz treatment combined with immune response. Geometric selectivity: spike trimer geometry is absent from all human cell surface proteins.',
    },
    'HIV': {
        fingerprint: 'Unique conical fullerene capsid (~1,500 CA hexamers + 12 pentamers in two distinct lattice zones) inside a 120nm spherical envelope. The cone\'s aspect ratio (width:length ≈ 0.5) and hexamer/pentamer boundary geometry are not found in any human organelle or cell structure. 72 trimeric gp120/gp41 spikes in defined spacing create a secondary geometric signature at OCT-5.',
        pathway: 'Dual strategy using the Cosmic Compass multi-octave approach: (1) OCT-6 — disrupt free virions at 18 GHz to reduce viremia. (2) OCT-5/4 — apply geometric selection pressure across HIV replication cycles to steer evolutionary path toward "HIV-Good" — delivery-capable, non-pathogenic variant. HIV-Good retains integrase and gp120 targeting (same T-cell tropism) but silences Vif/Vpr/Nef pathogenicity, then is used to deliver CRISPR excision of wild-type proviral DNA from patient T-cells. HIV\'s own reproductive machinery is turned against itself.',
        outcome: 'Viremia reduction: weeks. Ex-vivo evolutionary reprogramming: 8–12 weeks. Full patient treatment arc: 6–9 months. Precedent: nature already ran this experiment — ancient retroviruses became Syncytin-1 (now essential for placental formation) and ARC protein (required for memory formation in neurons).',
    },
    'Ebola': {
        fingerprint: 'Filamentous/tubular virion (80nm wide, 970–1,400nm long) — the only major human pathogen with this elongated geometry. Nucleocapsid has strict helical symmetry (7-stranded). The extreme length:width ratio (12–17:1) creates axial resonance modes completely absent from any spherical human cell. Geometry alone uniquely identifies it.',
        pathway: 'Non-integrating RNA virus. The filamentous geometry creates axial resonance at ~19 GHz. Disrupting the nucleocapsid helical geometry prevents RNA-protein complex integrity — the genome cannot be packaged. Unlike spherical viruses, the filamentous form also has high surface tension making it vulnerable to traveling surface acoustic waves propagating along its length.',
        outcome: 'Acute treatment: days to weeks for viral clearance. No proviral reservoir. Zero analog in human spherical cell biology — geometric selectivity is near-absolute. Could revolutionize treatment of hemorrhagic fevers where no effective pharmaceuticals exist.',
    },
    'Influenza': {
        fingerprint: 'Pleomorphic (80–120nm) with 8 distinct RNA segment bundles in a 7+1 geometric arrangement — one central segment surrounded by seven. Hemagglutinin (HA) and neuraminidase (NA) spikes in specific surface spacing. The 8-segment packing geometry creates combinatorial harmonic modes distinct from all single-genome viruses.',
        pathway: 'Non-integrating RNA virus with rapid mutation (antigenic drift/shift). GHz resonance targets the 8-segment geometric assembly process — disrupting the inter-segment packing prevents infectious progeny formation regardless of surface antigen mutations. This is antigenic-drift-resistant treatment: the 8-segment assembly geometry is conserved even when HA/NA change.',
        outcome: 'Acute treatment: clearance in 3–7 days (vs 7–14 untreated). Critically: effective against all influenza strains including pandemic variants because it targets conserved assembly geometry, not surface antigens. Addresses the vaccine-escape problem.',
    },
    'Hepatitis B': {
        fingerprint: 'Icosahedral capsid (36nm) with T=4 symmetry (240 capsid monomers). Notable: viral envelope contains host-derived lipids plus surface antigens — the geometric boundary between viral and host membranes is measurable. DNA is partially double-stranded, circular — a unique compact geometry.',
        pathway: 'Integrates (covalently closed circular DNA / cccDNA) into hepatocyte nucleus — the main obstacle to cure. OCT-6 disruption of free virions reduces load. OCT-4 approach targets the cccDNA geometry — circular DNA creates distinct supercoiling topology that THz spectroscopy can distinguish from linear human chromosomal DNA.',
        outcome: 'Functional cure possible via cccDNA geometric targeting. Currently incurable with direct-acting antivirals. Geometric framework provides the targeting mechanism chemical approaches lack.',
    },
    'Hepatitis C': {
        fingerprint: 'Enveloped spherical virion (50–60nm). E1/E2 envelope glycoproteins form tight dimers — geometric packing differs from host membrane proteins. RNA with IRES (Internal Ribosome Entry Site) structure — a specific 3D RNA fold that is geometrically conserved across all HCV genotypes.',
        pathway: 'Non-integrating — functional cure possible. IRES 3D geometry is highly conserved; THz targeting of the IRES fold would be pan-genotypic (effective against all 7 HCV genotypes simultaneously). GHz virion disruption handles extracellular virus. Combined approach mirrors how direct-acting antivirals work but via geometric rather than chemical mechanism.',
        outcome: 'Functional cure similar to current DAA regimens, but potentially pan-genotypic and without antiviral resistance. Timeline: 8–12 weeks.',
    },
    'HPV': {
        fingerprint: 'Icosahedral capsid (55nm) with T=7 symmetry (360 L1 protein subunits in 72 pentamers). Among the most geometrically precise viral structures known — the L1 pentamer geometry is conserved across all HPV types enabling pan-type geometric targeting.',
        pathway: 'Integrates into host DNA in cancer-causing types (16, 18). High-risk HPV integration disrupts cellular proto-oncogenes. Key insight: HPV oncoproteins E6 and E7 have specific 3D geometries — E6 forms a zinc-binding fold; E7 has a histone-like fold. These can be targeted at OCT-5 without touching human zinc proteins or histones due to slight geometric differences.',
        outcome: 'Prevention: virion disruption prevents infection. Treatment of integration: E6/E7 geometric targeting could suppress oncogenesis without host cell damage — relevant to cervical cancer prevention.',
    },
    'Dengue': {
        fingerprint: 'Spherical virus (50nm) with beautiful E protein geometric tiling — 90 dimers in a herringbone pattern (T=1 icosahedral symmetry with pseudo-T=3 arrangement). At physiological temperature the E dimer arrangement undergoes geometric breathing, creating temperature-dependent resonance shifts measurable at GHz.',
        pathway: 'Non-integrating. The E protein geometric breathing (dimer rearrangement during fusion) is the critical step for cell entry. Targeting the E dimer resonance during this conformational shift disrupts the fusion geometry before host cell entry — preventing infection regardless of serotype. Pan-serotype approach.',
        outcome: 'Acute treatment and prevention. Four serotypes currently require separate vaccines; geometric framework targets conserved E protein geometry across all four.',
    },
    'Plasmodium': {
        fingerprint: 'Eukaryotic parasite (blood stage: 5–20µm). During intraerythrocytic development, creates a parasitophorous vacuole membrane (PVM) — a distinct geometric boundary inside the red blood cell. PVM (diameter 5–8µm) resonates at 150–500 MHz, distinct from the surrounding RBC membrane (~20 MHz). This differential resonance is the targeting mechanism.',
        pathway: 'Apply 150–500 MHz focused ultrasound — creates acoustic cavitation preferentially at the PVM geometry. The parasite\'s internal digestive vacuole (hemozoin crystal geometry) also creates unique MHz-range resonance. Parasitemia reduction below 0.1% allows natural immune clearance to resolve blood-stage infection. Liver-stage parasites require separate 200–400 MHz targeting of hepatocyte-resident schizonts.',
        outcome: 'Potential functional cure of blood-stage malaria in 2–4 weeks. Antibiotic-resistance-independent — targets geometry, not enzymes. Directly addresses the 600,000 annual malaria deaths where drug resistance is growing.',
    },
    'Mycobacterium': {
        fingerprint: 'Rod-shaped bacterium (2–4µm long). Uniquely thick mycolic acid cell wall (10–30nm) — a waxy, hydrophobic geometric shell with distinct elastic modulus. The wall\'s stiffness creates resonant modes 40–60% higher frequency than other bacteria of the same size. This geometric property is also why standard antibiotics cannot penetrate it.',
        pathway: 'Antibiotic-resistant persister cells survive standard 6-month treatment. MHz ultrasound at mycolic acid wall resonance creates cavitation that bypasses wall geometry — the same physical property that blocks chemicals doesn\'t block acoustic pressure. Can target intracellular TB within macrophages (the usual hiding place) because the acoustic wave passes through the macrophage membrane unimpeded.',
        outcome: 'Potential reduction of TB treatment from 6 months to weeks. Drug-resistant (MDR-TB) and extensively drug-resistant (XDR-TB) strains are equally vulnerable — resistance is chemical, not geometric.',
    },
    'Staphylococcus': {
        fingerprint: 'Spherical cocci (0.5–1.5µm) arranged in grape-cluster geometry. Peptidoglycan cell wall (30–80nm thick) creates distinct acoustic impedance boundary. The cluster geometry enables traveling surface acoustic waves (TSAWs) to propagate between cells — creating a collective resonance of the cluster, not just single cells.',
        pathway: 'MRSA is antibiotic-resistant but NOT frequency-resistant. Peptidoglycan wall geometry is invariant across methicillin-resistant mutations — resistance genes change chemical binding sites, not wall thickness or geometry. MHz acoustic cavitation lyses the cell wall membrane through the same geometric coupling regardless of antibiotic resistance profile.',
        outcome: 'Physical lysis of MRSA — antibiotic resistance is completely irrelevant. Applicable to sepsis, hospital-acquired infections, prosthetic joint infections where MRSA is otherwise untreatable.',
    },
    'E. coli': {
        fingerprint: 'Rod-shaped gram-negative bacterium (1–6µm long, 0.5µm wide). Asymmetric geometry (rod vs. sphere) creates bending resonance modes in addition to breathing modes. Outer membrane (3–8nm) + peptidoglycan (2–7nm) + inner membrane triple-layer geometry creates frequency-distinct resonance at each boundary.',
        pathway: 'The triple-membrane geometry creates a unique frequency signature relative to gram-positive bacteria. Acoustic resonance targeting the outer-membrane/peptidoglycan boundary is selective for gram-negative bacteria. Applicable to treatment of drug-resistant UTIs, sepsis, food poisoning without disturbing beneficial gut microbiota (which have different size distributions).',
        outcome: 'Selective disruption. Critical for antibiotic-sparing approaches to prevent gut dysbiosis — frequency selection can target E. coli specifically while leaving Lactobacillus (different size: 2–20µm rods) at reduced risk.',
    },
    'Candida': {
        fingerprint: 'Dimorphic fungus — switches between spherical yeast form (3–8µm, ~250 MHz) and elongated hyphal form (3nm wide, many µm long, MHz axial modes). The frequency signature shifts measurably between forms. The invasive pathological form (hyphae) has a distinct geometric resonance — this is the therapeutic target.',
        pathway: 'The morphological switch from yeast to hyphae (triggered by host temperature) is the key pathogenicity step. Targeting hyphal-form resonance selectively disrupts the invasive form while yeast-form Candida at its different frequency is less affected. Chitin in the fungal cell wall provides an additional geometric target (not present in human cells: chitin is fungus-specific).',
        outcome: 'Form-selective disruption — targets the pathogenic hyphal form. Not achievable with most systemic antifungals. Relevant for immunocompromised patients (HIV, chemotherapy) where Candida is lethal.',
    },
    'Red Blood Cell': {
        fingerprint: 'Biconcave disc (8µm diameter, 2µm thick at center) — the only major human cell with this non-spherical geometry. The biconcave shape creates flexural resonance modes that enable RBC deformability — the ability to squeeze through capillaries 3µm in diameter. This geometry is also why RBCs have no nucleus (removed to maximize deformability).',
        pathway: 'Stimulation at ~20 MHz matches RBC membrane flexural resonance. Effect: enhanced membrane deformability (critical for microcirculation), improved oxygen-hemoglobin binding kinetics at the geometric center of the biconcave disc, reduced RBC-RBC aggregation (rouleaux formation reduction). Non-thermal: purely mechanical membrane effect. Used in PEMF therapy.\nEvolutionary perspective: the biconcave disc is a geometric optimization evolved over 300 million years for O2 transport at the capillary scale. Stimulating at its natural mode amplifies what evolution already designed.',
        outcome: 'Enhanced O2 delivery, improved microcirculation. Clinical applications: anemia management, sickle cell crisis prevention (sickle cells lose this geometry; stimulation can delay sickling process), chronic fatigue, altitude adaptation.',
    },
    'T-Cell': {
        fingerprint: 'Roughly spherical (8–12µm) with dynamic pseudopod extensions during immune activation. T-cell receptor complex (TCR/CD3) microcluster geometry on membrane surface organizes in ~100nm nanoclusters — OCT-6 scale structures on an OCT-7 cell. This multi-octave geometry creates coupled resonance between the nanoclusters and the whole cell.',
        pathway: 'MHz stimulation at whole-cell resonance activates membrane-associated signaling cascades: LAT phosphorylation, calcium flux, downstream NFAT transcription. This mimics the mechanical deformation of the T-cell during immunological synapse formation — essentially "pre-activating" immune surveillance without antigen presentation. Creates a state of heightened immune readiness.\nApplication: before HIV infection, stimulate T-cells to an alert state supplemented with restriction factor expression. After HIV infection, stimulate effector T-cells to enhance elimination of HIV-infected cells.',
        outcome: 'Immune activation and amplification. Applications: cancer immunotherapy adjunct, post-viral immune recovery, vaccine response enhancement, HIV immune reconstitution.',
    },
    'Macrophage': {
        fingerprint: 'Largest immune cell (15–25µm), highly plastic geometry — extends pseudopods during phagocytosis, creating cup-shaped phagosome geometry. The phagosome (5–15µm diameter compartment) has a distinct geometric resonance that creates an internal microenvironment. Macrophage polarization (M1 inflammatory vs. M2 anti-inflammatory) is reflected in distinct morphological geometry.',
        pathway: 'Frequency determines polarization: lower frequency (kHz range) drives M1 (pro-inflammatory, pathogen-killing); higher (MHz) promotes M2 (anti-inflammatory, healing). This frequency-controlled polarization switch could resolve chronic inflammation or enhance pathogen clearance depending on treatment phase. In HIV/TB context: TB hides inside macrophages; MHz stimulation enhances macrophage\'s own lysosomal killing of intracellular bacteria.',
        outcome: 'Tunable immune response: kHz for infection clearance, MHz for wound healing and tissue repair. Addresses the therapeutic paradox of needing both inflammation (to kill pathogens) and resolution (to prevent tissue damage).',
    },
    'Neutrophil': {
        fingerprint: 'Multi-lobed nucleus (3–5 lobes connected by thin chromatin bridges) — unique nuclear geometry in all human cells. Nucleus shape determines how the cell can deform through narrow tissue spaces to reach infection sites. Granules (primary, secondary, tertiary) distributed in specific cytoplasmic geometry create internal mass distribution that influences whole-cell vibration.',
        pathway: 'Hz to kHz range stimulation enhances neutrophil chemotaxis (directional migration toward infection sites) by up to 40% in research models. Resonant stimulation at migration-relevant frequencies increases β2-integrin clustering — the geometric mechanism of adhesion to blood vessel walls before extravasation. Could be used to direct neutrophil swarms to specific infection sites.',
        outcome: 'Accelerated wound healing, enhanced early immune response. Combined with antibiotic treatment for severe infections — frequencies guide neutrophils to the site while antibiotics kill on contact. Could reduce post-surgical infection rates.',
    },
    'Dendritic Cell': {
        fingerprint: 'Highly ramified — long dendritic projections (1–2µm wide, up to 50µm long) that maximize surface contact with the environment. Projections create a fractal-like branching geometry with scale-dependent resonance at multiple octave levels simultaneously. Major histocompatibility complex (MHC) clusters on projection tips have specific nanocluster geometry.',
        pathway: 'Dendritic cells are the immune system\'s antigen-presenting scouts — they\'re the bridge between innate and adaptive immunity. MHz stimulation of dendritic projection geometry enhances their sampling of local environment and accelerates maturation. Mature dendritic cells present antigens to T-cells 10× more efficiently. In cancer: stimulating tumor-infiltrating dendritic cells could restart stalled anti-tumor immunity.',
        outcome: 'Vaccine adjuvant effect — enhance immune priming. Cancer immunotherapy: reactivate exhausted tumor-infiltrating DC-T cell responses without checkpoint inhibitors.',
    },
    'NK Cell': {
        fingerprint: 'Natural Killer cells (10–15µm) form a highly organized "immune synapse" when contacting target cells — a bull\'s-eye geometry of concentric rings of activating and inhibitory receptors. This synapse geometry determines kill decision. NK cells are geometrically calibrated to detect the "missing self" — loss of MHC-I surface geometry on tumor or infected cells.',
        pathway: 'MHz stimulation at NK cell resonance enhances granzyme B release (the killing mechanism) and accelerates immune synapse formation. In cancer: tumor cells downregulate MHC-I to escape T-cells, but this "missing self" is precisely what NK cells look for. Stimulated NK cells could clear tumors that evade all T-cell-based therapies.',
        outcome: 'Anti-cancer and anti-viral killing enhancement. Particularly relevant for cancers that downregulate MHC-I (most solid tumors and many hematologic malignancies).',
    },
    'Neuron': {
        fingerprint: 'Highly elongated — soma (10–80µm) with axon extending up to 1m. This extreme aspect ratio creates guided axonal resonance modes. Myelin sheath geometry (concentric lipid layers, 1.5–2.5µm periodicity) creates a geometric waveguide around the axon with resonance in the kHz–MHz range.',
        pathway: 'kHz stimulation mimics endogenous electrical nerve impulse frequencies. Transcranial magnetic/acoustic stimulation at axonal resonance can re-enable dormant neural pathways in spinal injury, enhance neuroplasticity, and modulate pain signaling. Geometric targetability: myelinated vs unmyelinated axons have distinct resonance — enabling selective pain vs motor pathway targeting.',
        outcome: 'Neural regeneration, pain management, neuroplasticity enhancement. Applications: spinal cord injury, Parkinson\'s, neuropathic pain. Avoids side effects of current neuromodulation (TMS/tDCS) through geometric selectivity.',
    },
    'Cardiomyocyte': {
        fingerprint: 'Rod-shaped striated muscle cell (100–150µm long, 20–35µm wide) with regular sarcomere geometry — 2.2µm between Z-discs creates a crystalline internal structure. This geometric regularity means cardiomyocytes have extremely precise resonant modes at ~MHz. The sarcomere is nature\'s most geometrically perfect biological oscillator.',
        pathway: 'Stimulation at sarcomere resonance frequency can entrain cardiac rhythm, improve calcium handling, and reduce arrhythmia. The crystalline sarcomere geometry makes cardiomyocytes extraordinarily frequency-sensitive — this is the basis of PEMF cardiac therapy. Could restore contractility in heart failure by resonantly "re-tuning" sarcomere coupling.',
        outcome: 'Cardiac therapy: arrhythmia management, heart failure contractility enhancement, post-infarct recovery acceleration. Sarcomere geometry is extremely conserved — treatment works regardless of genetic heart disease subtype.',
    },
    'Hepatocyte': {
        fingerprint: 'Polygonal cells (20–30µm) with a unique architectural geometry — they tile in hexagonal lobules around a central vein with defined hubs for blood processing. Individual cells have two distinct membrane domains: sinusoidal (blood-facing, microvilli geometry) and canalicular (bile-facing, tight junction geometry). These domains have distinct resonant properties.',
        pathway: 'Domain-specific stimulation: sinusoidal membrane resonance enhances nutrient uptake and drug metabolism; canalicular resonance improves bile transport (relevant for cholestatic liver disease). In viral hepatitis (HBV/HCV): hepatocyte stimulation can enhance interferon production and innate antiviral signaling, making infected cells more resistant to viral replication.',
        outcome: 'Liver disease management. For fatty liver disease: lipid droplet geometry (2–10µm) has distinct NMR-detectable resonance — targeting could disrupt lipid accumulation. For viral hepatitis: immune sensitization adjunct.',
    },
};

function getTreatmentPathway(entity: BioEntity) {
    for (const [key, val] of Object.entries(TREATMENT_PATHWAYS)) {
        if (entity.name.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(entity.name.toLowerCase().split(' ')[0])) {
            return val;
        }
    }
    // Generic fallback
    const freq = entity.resonant_freq_ghz
        ? { ghz: entity.resonant_freq_ghz, estimated: false }
        : { ghz: Math.round((1500 / (2 * entity.size_nm * 1e-9)) / 1e9 * 10) / 10, estimated: true };
    const freqStr = freq.ghz >= 1 ? `${freq.ghz} GHz` : `${Math.round(freq.ghz * 1000)} MHz`;
    return {
        fingerprint: `Physical size ${entity.size_nm >= 1000 ? `${(entity.size_nm/1000).toFixed(1)} µm` : `${entity.size_nm} nm`} maps to OCT-${entity.octave} orbital ring. Geometric structure creates resonant modes at ${freqStr} — distinct from other biological entities of different sizes.`,
        pathway: entity.health_status === 'pathogen'
            ? `Apply ${freqStr} targeted field → structural resonance disrupts pathogen geometry. Selectivity is determined by size differential — human cells of different sizes resonate at different frequencies and are unaffected.`
            : `Apply ${freqStr} → constructive resonance amplifies natural membrane oscillation, enhancing biological function without thermal or chemical side effects.`,
        outcome: entity.health_status === 'pathogen'
            ? `Pathogen load reduction. Combine with immune system recovery for full therapeutic benefit.`
            : `Enhanced cellular function in treated tissue. Non-invasive, non-pharmaceutical approach.`,
    };
}

function getEntityColor(status: BioEntity['health_status']): string {
    switch (status) {
        case 'pathogen':    return BIO_THEME.pathogen;
        case 'healthy':     return BIO_THEME.healthy;
        case 'therapeutic': return BIO_THEME.therapeutic;
        case 'molecular':   return BIO_THEME.molecular;
        case 'nuclear':     return BIO_THEME.nuclear;
        default:            return BIO_THEME.healthy;
    }
}

function getEntityGlow(status: BioEntity['health_status']): string {
    switch (status) {
        case 'pathogen':    return BIO_THEME.pathogenGlow;
        case 'healthy':     return BIO_THEME.healthyGlow;
        case 'therapeutic': return BIO_THEME.therapeuticGlow;
        case 'molecular':   return BIO_THEME.molecularGlow;
        default:            return BIO_THEME.healthyGlow;
    }
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '255, 255, 255';
}

// ─── Wave ring pool ────────────────────────────────────────────────────────
interface WaveRing {
    id: number;
    targetX: number;
    targetY: number;
    color: string;
    maxR: number;
    progress: number;
    speed: number;
}

// ─── Disruption particle ───────────────────────────────────────────────────
interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    color: string; size: number;
}

export const BioResonanceSimulator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef   = useRef<number>(0);
    const timeRef   = useRef<number>(0);
    const waveRingsRef = useRef<WaveRing[]>([]);
    const waveIdRef = useRef(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedEntity, setSelectedEntity] = useState<BioEntity | null>(null);
    const [hoveredEntity,  setHoveredEntity]  = useState<BioEntity | null>(null);
    const [filterStatus,   setFilterStatus]   = useState<string>('all');
    const [waveMode,       setWaveMode]       = useState<'disrupt' | 'stimulate'>('disrupt');
    const [waveActive,     setWaveActive]     = useState(false);
    const [isFullscreen,   setIsFullscreen]   = useState(false);
    const [disruptionPhase, setDisruptionPhase] = useState<'idle' | 'impacting' | 'done'>('idle');

    const disruptionParticlesRef = useRef<Particle[]>([]);
    const waveCountRef = useRef(0);

    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const selectedRef = useRef<BioEntity | null>(null);
    const waveModeRef = useRef<'disrupt' | 'stimulate'>('disrupt');
    const waveActiveRef = useRef(false);

    useEffect(() => { selectedRef.current = selectedEntity; }, [selectedEntity]);
    useEffect(() => { waveModeRef.current = waveMode; }, [waveMode]);
    useEffect(() => { waveActiveRef.current = waveActive; }, [waveActive]);

    // Wave spawner — fires rings every 400ms when active
    const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const spawnDisruptionParticles = useCallback((tx: number, ty: number, color: string) => {
        const count = 40;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 1.5 + Math.random() * 4;
            disruptionParticlesRef.current.push({
                x: tx, y: ty,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, maxLife: 1,
                color,
                size: 1.5 + Math.random() * 3,
            });
        }
    }, []);

    const spawnWave = useCallback((targetX: number, targetY: number, cx: number, cy: number, color: string) => {
        const dx = targetX - cx;
        const dy = targetY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        waveRingsRef.current.push({
            id: waveIdRef.current++,
            targetX,
            targetY,
            color,
            maxR: dist,
            progress: 0,
            speed: 0.018 + Math.random() * 0.006,
        });
        // Keep max 8 rings
        if (waveRingsRef.current.length > 8) waveRingsRef.current.shift();
    }, []);

    const getEntityDotRadius = (entity: BioEntity) => {
        const logSize = Math.log10(entity.size_nm + 1);
        return Math.max(3, Math.min(10, logSize * 2));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = (timestamp: number) => {
            timeRef.current = timestamp;

            const { width, height } = canvas.getBoundingClientRect();
            canvas.width  = width  * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

            const W = width, H = height;
            const cx = W / 2, cy = H / 2;
            const maxR = Math.min(W, H) / 2 * 0.88;
            const t = timestamp * 0.0003;

            // ── Background ──
            ctx.fillStyle = BIO_THEME.background;
            ctx.fillRect(0, 0, W, H);

            // ── Hex Grid ──
            ctx.strokeStyle = BIO_THEME.grid;
            ctx.lineWidth = 0.5;
            const hexSize = 28;
            for (let row = 0; row < H / hexSize + 2; row++) {
                for (let col = 0; col < W / hexSize + 2; col++) {
                    const hx = col * hexSize * 1.5 - hexSize;
                    const hy = row * hexSize * 1.732 - hexSize + (col % 2) * hexSize * 0.866;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI / 3) * i;
                        const px = hx + hexSize * 0.5 * Math.cos(a);
                        const py = hy + hexSize * 0.5 * Math.sin(a);
                        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }

            // ── Orbital Rings ──
            const rings = [
                { label: 'OCT-5 · Molecular', r: maxR * 0.16, color: BIO_THEME.molecular },
                { label: 'OCT-6 · Viral',     r: maxR * 0.50, color: BIO_THEME.pathogen  },
                { label: 'OCT-7 · Cellular',  r: maxR * 0.85, color: BIO_THEME.healthy   },
            ];

            const sel = selectedRef.current;
            const mode = waveModeRef.current;
            const isWaveOn = waveActiveRef.current;

            rings.forEach(ring => {
                // if wave mode active, pulse the target ring
                const isTargetRing = sel && (
                    (sel.octave === 6 && ring.label.includes('Viral')) ||
                    (sel.octave === 7 && ring.label.includes('Cellular'))
                );
                const ringAlpha = isWaveOn && sel && !isTargetRing ? 0.06 : 0.22;

                const grad = ctx.createRadialGradient(cx, cy, ring.r - 3, cx, cy, ring.r + 10);
                grad.addColorStop(0, `rgba(${hexToRgb(ring.color)}, ${isWaveOn && isTargetRing ? 0.3 : 0.08})`);
                grad.addColorStop(1, `rgba(${hexToRgb(ring.color)}, 0)`);
                ctx.beginPath();
                ctx.arc(cx, cy, ring.r + 6, 0, Math.PI * 2);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 12;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${hexToRgb(ring.color)}, ${ringAlpha})`;
                ctx.lineWidth = isWaveOn && isTargetRing ? 1.5 : 1;
                ctx.stroke();

                ctx.save();
                ctx.font = `bold 13px "JetBrains Mono", monospace`;
                ctx.fillStyle = `rgba(${hexToRgb(ring.color)}, 0.55)`;
                ctx.textAlign = 'left';
                ctx.fillText(ring.label, cx + ring.r + 8, cy - 5);
                ctx.restore();
            });

            // ── Nucleus ──
            const pulseScale = 1 + Math.sin(t * 2.5) * (isWaveOn ? 0.2 : 0.08);
            const nucleusR = 16 * pulseScale;

            const nucGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucleusR * 4);
            nucGrad.addColorStop(0, isWaveOn && mode === 'disrupt' ? 'rgba(239,68,68,0.4)' : 'rgba(14,165,233,0.35)');
            nucGrad.addColorStop(0.4, isWaveOn && mode === 'stimulate' ? 'rgba(20,184,166,0.2)' : 'rgba(20,184,166,0.12)');
            nucGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, nucleusR * 4, 0, Math.PI * 2);
            ctx.fillStyle = nucGrad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
            const coreGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, nucleusR);
            const c1 = isWaveOn && mode === 'disrupt' ? '#f97316' : '#38bdf8';
            const c2 = isWaveOn && mode === 'disrupt' ? '#ef4444' : '#0ea5e9';
            const c3 = isWaveOn && mode === 'disrupt' ? '#7f1d1d' : '#0c4a6e';
            coreGrad.addColorStop(0, c1);
            coreGrad.addColorStop(0.5, c2);
            coreGrad.addColorStop(1, c3);
            ctx.fillStyle = coreGrad;
            ctx.shadowBlur = isWaveOn ? 30 : 20;
            ctx.shadowColor = isWaveOn && mode === 'disrupt' ? '#ef4444' : '#0ea5e9';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.save();
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = isWaveOn && mode === 'disrupt' ? '#fca5a5' : '#7dd3fc';
            ctx.textAlign = 'center';
            ctx.fillText(isWaveOn ? (mode === 'disrupt' ? 'WAVE EMITTER' : 'RESONATOR') : 'CELL NUCLEUS', cx, cy + nucleusR + 12);
            ctx.restore();

            // ── Wave Rings ──
            if (isWaveOn) {
                waveRingsRef.current.forEach(ring => {
                    ring.progress = Math.min(1, ring.progress + ring.speed);
                    const r = ring.maxR * ring.progress;
                    const alpha = (1 - ring.progress) * 0.6;

                    // Direction vector to target
                    const dx = ring.targetX - cx;
                    const dy = ring.targetY - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const angle = Math.atan2(ny, nx);

                    // Draw an arc sector instead of full circle (beam-shaped)
                    const spread = Math.PI * 0.28;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, angle - spread, angle + spread);
                    ctx.strokeStyle = `rgba(${hexToRgb(ring.color)}, ${alpha})`;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Inner glow arc
                    ctx.beginPath();
                    ctx.arc(cx, cy, r - 3, angle - spread * 0.6, angle + spread * 0.6);
                    ctx.strokeStyle = `rgba(${hexToRgb(ring.color)}, ${alpha * 0.4})`;
                    ctx.lineWidth = 6;
                    ctx.stroke();
                });
                // Cull completed rings
                waveRingsRef.current = waveRingsRef.current.filter(r => r.progress < 1);
            }

            // ── Disruption Particles ──
            disruptionParticlesRef.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.94;
                p.vy *= 0.94;
                p.life -= 0.018;
                const alpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            disruptionParticlesRef.current = disruptionParticlesRef.current.filter(p => p.life > 0);

            // ── Place entities ──
            const oct5 = BIO_ENTITIES.filter(e => e.octave === 5);
            const oct6 = BIO_ENTITIES.filter(e => e.octave === 6);
            const oct7 = BIO_ENTITIES.filter(e => e.octave === 7);

            interface PlacedEntity extends BioEntity {
                x: number; y: number; dotR: number; angle: number;
            }

            const placedEntities: PlacedEntity[] = [];

            const placeRing = (entities: BioEntity[], baseRingR: number, speedMult: number) => {
                entities.forEach((e, i) => {
                    const angleOffset = (i / entities.length) * Math.PI * 2;
                    const wobble = Math.sin(t * 0.4 + i * 0.7) * 4;
                    const r = baseRingR + wobble;
                    const angle = angleOffset + t * speedMult;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    const dotR = getEntityDotRadius(e);
                    placedEntities.push({ ...e, x, y, dotR, angle });
                });
            };

            if (oct5.length > 0) placeRing(oct5, maxR * 0.16, 0.14);
            placeRing(oct6, maxR * 0.50, 0.06);
            placeRing(oct7, maxR * 0.85, 0.025);

            // ── Resonant Web Lines ──
            if (!isWaveOn) {
                const drawWeb = (subset: PlacedEntity[], color: string) => {
                    for (let i = 0; i < subset.length; i++) {
                        for (let j = i + 1; j < subset.length; j++) {
                            const a = subset[i], b = subset[j];
                            const dx = b.x - a.x, dy = b.y - a.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const maxD = maxR * 0.45;
                            if (dist < maxD) {
                                ctx.beginPath();
                                ctx.moveTo(a.x, a.y);
                                ctx.lineTo(b.x, b.y);
                                ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${(1 - dist / maxD) * 0.1})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        }
                    }
                };
                drawWeb(placedEntities.filter(e => e.octave === 6 && e.health_status === 'pathogen'), BIO_THEME.pathogen);
                drawWeb(placedEntities.filter(e => e.octave === 7 && e.health_status === 'healthy'), BIO_THEME.healthy);
            }

            // ── Draw Entities ──
            placedEntities.forEach(entity => {
                const isFiltered  = filterStatus !== 'all' && entity.health_status !== filterStatus;
                const isSelected  = sel?.name === entity.name;
                const isHovered   = hoveredEntity?.name === entity.name;

                // Selectivity dimming — when wave is active, dim non-matching entities
                let dimmed = false;
                if (isWaveOn && sel) {
                    if (mode === 'disrupt') {
                        dimmed = entity.health_status !== 'pathogen';
                    } else {
                        dimmed = entity.health_status === 'pathogen';
                    }
                    if (isSelected) dimmed = false;
                }

                if (isFiltered && !isSelected) return;

                const col    = getEntityColor(entity.health_status);
                const glow   = getEntityGlow(entity.health_status);
                const baseR  = entity.dotR;
                const drawR  = isSelected ? baseR * 1.8 : isHovered ? baseR * 1.3 : baseR;
                const alpha  = dimmed ? 0.12 : 1;

                // Glow halo
                if ((isSelected || isHovered) && !dimmed) {
                    ctx.beginPath();
                    ctx.arc(entity.x, entity.y, drawR + 10, 0, Math.PI * 2);
                    const haloGrad = ctx.createRadialGradient(entity.x, entity.y, drawR, entity.x, entity.y, drawR + 18);
                    haloGrad.addColorStop(0, glow);
                    haloGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = haloGrad;
                    ctx.fill();
                }

                // Target crosshair ring when wave is active on this entity
                if (isSelected && isWaveOn) {
                    const rotT = t * 2;
                    for (let seg = 0; seg < 4; seg++) {
                        const a = rotT + (seg / 4) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.arc(entity.x, entity.y, drawR + 8, a, a + Math.PI * 0.35);
                        ctx.strokeStyle = mode === 'disrupt' ? '#ef4444' : '#14b8a6';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                // Dot
                ctx.beginPath();
                ctx.arc(entity.x, entity.y, drawR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${hexToRgb(col)}, ${alpha})`;
                ctx.shadowBlur = isSelected ? (isWaveOn ? 28 : 18) : isHovered ? 12 : 6;
                ctx.shadowColor = isSelected && isWaveOn ? (mode === 'disrupt' ? '#ef4444' : '#14b8a6') : glow;
                ctx.fill();
                ctx.shadowBlur = 0;

                if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(entity.x, entity.y, drawR + 4, 0, Math.PI * 2);
                    ctx.strokeStyle = isWaveOn ? (mode === 'disrupt' ? '#ef4444' : '#14b8a6') : col;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }

                // Label
                if (!dimmed && (isSelected || isHovered || drawR > 4)) {
                    ctx.save();
                    ctx.font = isSelected ? `bold 14px "JetBrains Mono", monospace` : `12px "JetBrains Mono", monospace`;
                    ctx.fillStyle = `rgba(${hexToRgb(col)}, ${isSelected || isHovered ? 1 : 0.75})`;
                    ctx.textAlign = 'center';
                    ctx.fillText(entity.name.split(' ')[0], entity.x, entity.y - drawR - 4);
                    if (entity.resonant_freq_ghz && (isSelected || isHovered || drawR > 5)) {
                        ctx.font = `11px monospace`;
                        ctx.fillStyle = `rgba(${hexToRgb(col)}, 0.6)`;
                        ctx.fillText(`${entity.resonant_freq_ghz} GHz`, entity.x, entity.y + drawR + 13);
                    }
                    ctx.restore();
                }
            });

            (canvas as any)._placedEntities = placedEntities;
            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [selectedEntity, hoveredEntity, filterStatus, waveActive, waveMode]);

    // Mouse
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const placed = (canvas as any)._placedEntities as (BioEntity & { x: number; y: number; dotR: number })[] | undefined;
        if (!placed) return;
        const hit = placed.find(en => {
            const dx = mx - en.x, dy = my - en.y;
            return Math.sqrt(dx * dx + dy * dy) < en.dotR + 8;
        });
        setHoveredEntity(hit || null);
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const placed = (canvas as any)._placedEntities as (BioEntity & { x: number; y: number; dotR: number })[] | undefined;
        if (!placed) return;
        const hit = placed.find(en => {
            const dx = mx - en.x, dy = my - en.y;
            return Math.sqrt(dx * dx + dy * dy) < en.dotR + 8;
        });
        if (hit) {
            setSelectedEntity(prev => prev?.name === hit.name ? null : hit);
            setWaveActive(false);
            setDisruptionPhase('idle');
            disruptionParticlesRef.current = [];
            waveRingsRef.current = [];
        } else {
            setSelectedEntity(null);
            setWaveActive(false);
            setDisruptionPhase('idle');
            disruptionParticlesRef.current = [];
            waveRingsRef.current = [];
        }
    }, []);

    // Wave interval — spawns rings toward selected entity and counts waves for disruption
    useEffect(() => {
        if (waveTimerRef.current) clearInterval(waveTimerRef.current);
        if (!waveActive || !selectedEntity) return;
        waveCountRef.current = 0;
        setDisruptionPhase('idle');
        disruptionParticlesRef.current = [];

        const canvas = canvasRef.current;
        if (!canvas) return;

        const spawnInterval = setInterval(() => {
            const c = canvasRef.current;
            if (!c) return;
            const { width, height } = c.getBoundingClientRect();
            const cx = width / 2, cy = height / 2;
            const placed = (c as any)._placedEntities as (BioEntity & { x: number; y: number })[] | undefined;
            if (!placed) return;
            const target = placed.find(p => p.name === selectedEntity.name);
            if (!target) return;
            const color = waveModeRef.current === 'disrupt' ? BIO_THEME.pathogen : BIO_THEME.healthy;
            spawnWave(target.x, target.y, cx, cy, color);

            waveCountRef.current += 1;
            // After 6 waves (~2.1 seconds) trigger the disruption event
            if (waveCountRef.current === 6) {
                spawnDisruptionParticles(target.x, target.y, color);
                setDisruptionPhase('impacting');
                setTimeout(() => setDisruptionPhase('done'), 1200);
            }
        }, 350);

        waveTimerRef.current = spawnInterval;
        return () => clearInterval(spawnInterval);
    }, [waveActive, selectedEntity, waveMode, spawnWave, spawnDisruptionParticles]);

    const displayEntity  = selectedEntity || hoveredEntity;
    const mechanism      = displayEntity ? getMechanism(displayEntity, waveMode) : null;

    const statusLabel = (s: string) => {
        switch (s) {
            case 'pathogen':    return '● PATHOGEN';
            case 'healthy':     return '● HEALTHY';
            case 'therapeutic': return '● THERAPEUTIC';
            case 'molecular':   return '● MOLECULAR';
            default:            return '● UNKNOWN';
        }
    };
    const statusColor = (s?: string) => {
        if (!s) return BIO_THEME.healthy;
        return getEntityColor(s as BioEntity['health_status']);
    };

    const filters = [
        { key: 'all',         label: 'ALL'         },
        { key: 'pathogen',    label: 'PATHOGEN'    },
        { key: 'healthy',     label: 'HEALTHY'     },
        { key: 'therapeutic', label: 'THERAPEUTIC' },
    ];

    // Compute usable frequency — measured or estimated from size
    const getFreq = (entity: BioEntity): { ghz: number; estimated: boolean } => {
        if (entity.resonant_freq_ghz) return { ghz: entity.resonant_freq_ghz, estimated: false };
        // Estimate: f ≈ c_sound / (2 × diameter). c_elastic ≈ 1500 m/s in tissue.
        const diameter_m = entity.size_nm * 1e-9;
        const ghz = (1500 / (2 * diameter_m)) / 1e9;
        return { ghz: Math.round(ghz * 10) / 10, estimated: true };
    };

    const getSelectivityNote = (entity: BioEntity): string => {
        const freq = getFreq(entity);
        const freqStr = freq.ghz >= 1 ? `${freq.ghz} GHz` : `${Math.round(freq.ghz * 1000)} MHz`;
        if (entity.health_status === 'pathogen') {
            if (freq.ghz >= 1) {
                return `Human cells (10–50 µm) resonate at MHz — 1,000× lower than this target. ${freqStr} beams pass through healthy tissue without coupling. Zero off-target effect.`;
            } else {
                const mhz = Math.round(freq.ghz * 1000);
                return `At ${mhz} MHz, this frequency is above the single-cell resonance of individual human cells (~10–100 MHz) but targeted exposure and beam focusing limits the treatment zone to the pathogen site.`;
            }
        }
        if (entity.health_status === 'healthy' || entity.health_status === 'therapeutic') {
            return `Pathogens resonate at GHz — far above this cell's frequency. Stimulation at ${freqStr} causes no disruption to viral or bacterial structures.`;
        }
        return `Each entity's physical size locks its resonant frequency. Only exact frequency matching causes significant mechanical coupling.`;
    };

    const getDisruptOrStimulateExplanation = (entity: BioEntity): string => {
        const freq = getFreq(entity);
        const freqStr = freq.ghz >= 1 ? `${freq.ghz} GHz` : `${Math.round(freq.ghz * 1000)} MHz`;
        const estNote = freq.estimated ? ' (derived from size via f = v/2d)' : '';

        if (entity.health_status === 'pathogen') {
            if (freq.ghz >= 1) {
                // Virus / small pathogen — GHz microwave resonance
                return `Solution: Apply ${freqStr} microwave${estNote} → SRET (Structure-Resonant Energy Transfer) causes the capsid or spike proteins to oscillate beyond their elastic limit → membrane rupture within milliseconds. Non-thermal: no heat, only mechanical structural failure.`;
            } else {
                // Larger pathogen (bacterial, parasitic) — MHz ultrasound
                const mhz = Math.round(freq.ghz * 1000);
                return `Solution: Apply ${mhz} MHz focused ultrasound${estNote} → acoustic radiation pressure creates cavitation at the pathogen membrane → bubble collapse drives mechanical lysis. This is the correct frequency band for organisms of this size (${entity.size_nm >= 1000 ? `${(entity.size_nm/1000).toFixed(1)} µm` : `${entity.size_nm} nm`}).`;
            }
        }
        if (entity.health_status === 'healthy') {
            return `Solution: Apply ${freqStr}${estNote} — matches this cell's natural membrane oscillation frequency. Effect: enhanced ion transport, improved metabolic signaling, and increased membrane permeability. Used therapeutically in PEMF and vibroacoustic therapy.`;
        }
        if (entity.health_status === 'therapeutic') {
            return `Solution: Apply ${freqStr}${estNote} → resonant excitation improves drug binding affinity, penetration through biological barriers, and activation efficiency for this molecule.`;
        }
        return `Apply ${freqStr}${estNote} → resonant energy couples directly into this structure via its natural oscillation mode.`;
    };

    const canDisrupt   = selectedEntity?.health_status === 'pathogen';
    const canStimulate = selectedEntity?.health_status === 'healthy' || selectedEntity?.health_status === 'therapeutic';
    const modeColor    = waveMode === 'disrupt' ? BIO_THEME.pathogen : BIO_THEME.healthy;

    return (
        <div style={{
        position: 'relative', width: '100%', height: isFullscreen ? '100vh' : '100%', minHeight: '500px',
            background: BIO_THEME.background, borderRadius: isFullscreen ? '0' : '12px', overflow: 'hidden',
            fontFamily: '"JetBrains Mono", monospace', zIndex: isFullscreen ? 9999 : 'auto',
        }} ref={containerRef}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', cursor: hoveredEntity ? 'pointer' : 'default' }}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            />

            {/* ── HUD – top left ─────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 14, left: 14,
                background: 'rgba(2,18,28,0.96)',
                border: `1px solid ${waveActive ? modeColor : BIO_THEME.border}`,
                borderRadius: 10, padding: '14px 18px',
                minWidth: 440, maxWidth: 480,
                maxHeight: '82vh', overflowY: 'auto',
                backdropFilter: 'blur(14px)',
                boxShadow: waveActive ? `0 0 24px rgba(${hexToRgb(modeColor)}, 0.25)` : '0 4px 24px rgba(0,0,0,0.5)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}>
                {/* Header label */}
                <div style={{ fontSize: 11, color: waveActive ? modeColor : '#334155', letterSpacing: '0.12em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 700 }}>
                    {waveActive ? (waveMode === 'disrupt' ? '⚡ DISRUPT MODE ACTIVE' : '⬡ STIMULATE MODE ACTIVE') : 'BIO-RESONANCE COMPASS'}
                </div>

                {displayEntity ? (
                    <>
                        {/* Entity name */}
                        <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 800, marginBottom: 4, lineHeight: 1.2 }}>
                            {displayEntity.name}
                        </div>

                        {/* Size + Octave + Ring mapping */}
                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, fontFamily: 'monospace' }}>
                            <span style={{ color: '#38bdf8' }}>
                                {displayEntity.size_nm >= 1000 ? `${(displayEntity.size_nm / 1000).toFixed(1)} µm` : `${displayEntity.size_nm} nm`}
                            </span>
                            {' → '}
                            <span style={{ color: '#7dd3fc', fontWeight: 700 }}>OCT-{displayEntity.octave}</span>
                            {' → '}
                            <span style={{ color: '#475569' }}>
                                {displayEntity.octave === 5 ? 'inner ring (molecular)' : displayEntity.octave === 6 ? 'mid ring (viral)' : 'outer ring (cellular)'}
                            </span>
                        </div>

                        {/* Status pill + disruption confirmation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ fontSize: 14, color: statusColor(displayEntity.health_status), fontWeight: 700 }}>
                                {statusLabel(displayEntity.health_status)}
                            </div>
                            {disruptionPhase === 'impacting' && (
                                <div style={{
                                    fontSize: 13, color: waveMode === 'disrupt' ? '#ef4444' : '#14b8a6',
                                    fontWeight: 800, animation: 'none',
                                    background: waveMode === 'disrupt' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)',
                                    border: `1px solid ${waveMode === 'disrupt' ? '#ef4444' : '#14b8a6'}`,
                                    borderRadius: 4, padding: '2px 8px',
                                }}>
                                    ⚡ IMPACT
                                </div>
                            )}
                            {disruptionPhase === 'done' && (
                                <div style={{
                                    fontSize: 13, color: waveMode === 'disrupt' ? '#fca5a5' : '#6ee7b7',
                                    fontWeight: 800,
                                    background: waveMode === 'disrupt' ? 'rgba(239,68,68,0.12)' : 'rgba(20,184,166,0.12)',
                                    border: `1px solid ${waveMode === 'disrupt' ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.4)'}`,
                                    borderRadius: 4, padding: '2px 8px',
                                }}>
                                    {waveMode === 'disrupt' ? '✓ DISRUPTED' : '✓ STIMULATED'}
                                </div>
                            )}
                        </div>

                        {/* ── Always-visible explanation panel ── */}
                        <div style={{
                            background: 'rgba(0,0,0,0.45)', borderRadius: 8,
                            padding: '12px 14px', marginBottom: 12,
                            border: `1px solid rgba(56,189,248,0.12)`,
                        }}>
                            {/* Section 1: What the frequency is */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                    Resonant Frequency
                                </div>
                                <div style={{ fontSize: 14, color: '#38bdf8', fontWeight: 800, marginBottom: 4 }}>
                                    {(() => { const f = getFreq(displayEntity); return `${f.ghz >= 1000 ? `${(f.ghz/1000).toFixed(0)} THz` : `${f.ghz} GHz`}${f.estimated ? ' (est.)' : ''}`; })()}
                                </div>
                                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                                    Every object vibrates at a frequency set by its size — like a wine glass shattering when hit with its matching note.
                                </div>
                            </div>

                            {/* Section 2: What it does to this entity */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, color: statusColor(displayEntity.health_status), fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                    {displayEntity.health_status === 'pathogen' ? 'Disruption Effect' : 'Stimulation Effect'}
                                </div>
                                <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                                    {getDisruptOrStimulateExplanation(displayEntity)}
                                </div>
                            </div>

                            {/* Section 3: Selectivity */}
                            <div style={{ marginBottom: 0 }}>
                                <div style={{ fontSize: 11, color: '#14b8a6', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                    Frequency Selectivity
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                                    {getSelectivityNote(displayEntity)}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Geometric Fingerprint + Treatment Pathway ── */}
                        {(() => {
                            const tp = getTreatmentPathway(displayEntity);
                            return (
                                <div style={{
                                    background: 'rgba(0,0,0,0.38)', borderRadius: 8,
                                    padding: '12px 14px', marginBottom: 12,
                                    border: `1px solid rgba(120,90,220,0.18)`,
                                }}>
                                    {/* Geometric Fingerprint */}
                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                            Geometric Fingerprint
                                        </div>
                                        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
                                            {tp.fingerprint}
                                        </div>
                                    </div>

                                    {/* Treatment Pathway */}
                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{ fontSize: 11, color: displayEntity.health_status === 'pathogen' ? '#ef4444' : '#14b8a6', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                            {displayEntity.health_status === 'pathogen' ? 'Treatment Pathway' : 'Stimulation Pathway'}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65 }}>
                                            {tp.pathway}
                                        </div>
                                    </div>

                                    {/* Outcome */}
                                    <div>
                                        <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>
                                            Expected Outcome
                                        </div>
                                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>
                                            {tp.outcome}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Source citation */}
                        {displayEntity.source && (
                            <div style={{ fontSize: 11, color: '#1e3a4a', marginBottom: 10, fontStyle: 'italic' }}>
                                {displayEntity.source}
                            </div>
                        )}

                        {/* Wave control buttons */}
                        {selectedEntity && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                    disabled={!canDisrupt}
                                    onClick={() => {
                                        setWaveMode('disrupt');
                                        if (waveMode !== 'disrupt') { setWaveActive(true); } else { setWaveActive(v => !v); }
                                    }}
                                    style={{
                                        padding: '7px 14px', borderRadius: 6, fontSize: 13,
                                        background: waveActive && waveMode === 'disrupt' ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.1)',
                                        border: `1px solid ${waveActive && waveMode === 'disrupt' ? '#ef4444' : 'rgba(239,68,68,0.35)'}`,
                                        color: canDisrupt ? '#ef4444' : '#4b5563',
                                        cursor: canDisrupt ? 'pointer' : 'not-allowed',
                                        fontWeight: 700, fontFamily: 'monospace',
                                    }}
                                >
                                    ⚡ DISRUPT
                                </button>
                                <button
                                    disabled={!canStimulate}
                                    onClick={() => {
                                        setWaveMode('stimulate');
                                        if (waveMode !== 'stimulate') { setWaveActive(true); } else { setWaveActive(v => !v); }
                                    }}
                                    style={{
                                        padding: '7px 14px', borderRadius: 6, fontSize: 13,
                                        background: waveActive && waveMode === 'stimulate' ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.1)',
                                        border: `1px solid ${waveActive && waveMode === 'stimulate' ? '#14b8a6' : 'rgba(20,184,166,0.35)'}`,
                                        color: canStimulate ? '#14b8a6' : '#4b5563',
                                        cursor: canStimulate ? 'pointer' : 'not-allowed',
                                        fontWeight: 700, fontFamily: 'monospace',
                                    }}
                                >
                                    ⬡ STIMULATE
                                </button>
                                {waveActive && (
                                    <button
                                        onClick={() => { setWaveActive(false); waveRingsRef.current = []; }}
                                        style={{
                                            padding: '7px 12px', borderRadius: 6, fontSize: 13,
                                            background: 'rgba(100,116,139,0.15)',
                                            border: '1px solid rgba(100,116,139,0.3)',
                                            color: '#64748b', cursor: 'pointer', fontFamily: 'monospace',
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div>
                        <div style={{ fontSize: 16, color: '#4b5563', marginBottom: 6 }}>
                            Click any entity to inspect it
                        </div>
                        <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6 }}>
                            You'll see its resonant frequency, disruption or stimulation effect, and why the Cosmic Compass framework placed it on this ring.
                        </div>
                    </div>
                )}
            </div>

            {/* ── Selectivity notice — top center ────────────────────── */}
            {waveActive && (
                <div style={{
                    position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(2,18,28,0.92)',
                    border: `1px solid ${modeColor}`,
                    borderRadius: 20, padding: '7px 18px',
                    fontSize: 13, color: modeColor, fontWeight: 700, letterSpacing: '0.07em',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 0 16px rgba(${hexToRgb(modeColor)}, 0.35)`,
                }}>
                    {waveMode === 'disrupt'
                        ? '⚡ Healthy cells unaffected — they resonate at MHz, not GHz'
                        : '⬡ Pathogens dimmed — stimulating at cellular resonance frequency'}
                </div>
            )}

            {/* ── Filter Buttons — top right ─────────────────────────── */}
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterStatus(f.key)}
                        style={{
                            background: filterStatus === f.key ? 'rgba(14,165,233,0.22)' : 'rgba(2,20,30,0.85)',
                            border: `1px solid ${filterStatus === f.key ? '#0ea5e9' : BIO_THEME.border}`,
                            borderRadius: 6, color: filterStatus === f.key ? '#38bdf8' : '#64748b',
                            fontSize: 13, padding: '6px 14px', cursor: 'pointer',
                            letterSpacing: '0.07em', fontFamily: 'monospace', fontWeight: 600,
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Legend — bottom left ───────────────────────────────── */}
            <div style={{
                position: 'absolute', bottom: 14, left: 14,
                background: 'rgba(2,18,28,0.9)', border: `1px solid ${BIO_THEME.border}`,
                borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 14,
                backdropFilter: 'blur(6px)',
            }}>
                {[
                    { color: BIO_THEME.pathogen,    label: 'Pathogen'    },
                    { color: BIO_THEME.healthy,     label: 'Healthy'     },
                    { color: BIO_THEME.therapeutic, label: 'Therapeutic' },
                    { color: BIO_THEME.molecular,   label: 'Molecular'   },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                        <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Entity count — bottom right ────────────────────────── */}
            <div style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 11, color: '#334155', letterSpacing: '0.05em' }}>
            </div>

            {/* ── Fullscreen button ───────────────────────────────────── */}
            <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                style={{
                    position: 'absolute', bottom: 14, right: 14,
                    background: 'rgba(2,20,30,0.85)',
                    border: `1px solid ${BIO_THEME.border}`,
                    borderRadius: 6, color: '#64748b',
                    fontSize: 18, padding: '5px 10px',
                    cursor: 'pointer', lineHeight: 1,
                    backdropFilter: 'blur(6px)',
                    transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e2e8f0'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = BIO_THEME.border; }}
            >
                {isFullscreen ? '⛶' : '⛶'}
            </button>
        </div>
    );
};

export default BioResonanceSimulator;
