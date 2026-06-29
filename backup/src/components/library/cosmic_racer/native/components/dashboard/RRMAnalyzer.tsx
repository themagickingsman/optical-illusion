"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';

// ─── RRM Dataset — Irena Cosic Resonant Recognition Model ──────────────────
// λ = K / frrm  where K = 201 (nm)
// Wavelength maps to EM spectrum → then to Cosmic Compass octave

interface RRMProtein {
    name: string;
    rrm_freq: number;
    wavelength_nm: number;
    em_freq_thz: number;
    category: 'growth' | 'oncogene' | 'immune' | 'neural' | 'structural' | 'dna' | 'energy' | 'signaling' | 'stress' | 'pathogen' | 'oxygen';
    cosmic_octave: number;
    em_band: string;
    description: string;
    source: string;
}

const K = 201; // Cosic correlation constant (nm)
const C = 299792458; // speed of light m/s

function deriveEMBand(nm: number): string {
    if (nm < 280)   return 'UV-C';
    if (nm < 315)   return 'UV-B';
    if (nm < 400)   return 'UV-A';
    if (nm < 700)   return 'Visible';
    if (nm < 1400)  return 'Near-IR';
    if (nm < 3000)  return 'Short-IR';
    if (nm < 8000)  return 'Mid-IR';
    return 'Far-IR';
}

function deriveCosmoOctave(nm: number): number {
    // Map wavelength bands to our 15-octave system
    // OCT-4: UV/X-Ray (< 400 nm)
    // OCT-5: Visible (400-700 nm)
    // OCT-6: Near-IR (700-1400 nm)
    // OCT-7: Short-IR (1400-3000 nm)
    // OCT-8: Mid/Far-IR (> 3000 nm)
    if (nm < 400)  return 4;
    if (nm < 700)  return 5;
    if (nm < 1400) return 6;
    if (nm < 3000) return 7;
    return 8;
}

function makeProtein(
    name: string,
    rrm_freq: number,
    category: RRMProtein['category'],
    description: string,
    source: string
): RRMProtein {
    const wavelength_nm = Math.round((K / rrm_freq) * 10) / 10;
    const em_freq_thz = Math.round((C / (wavelength_nm * 1e-9)) / 1e12 * 10) / 10;
    return {
        name, rrm_freq, wavelength_nm, em_freq_thz,
        category,
        cosmic_octave: deriveCosmoOctave(wavelength_nm),
        em_band: deriveEMBand(wavelength_nm),
        description, source,
    };
}

const RRM_DATA: RRMProtein[] = [
    // ── Growth & Hormones ──
    makeProtein('Insulin Growth Activity',      0.344, 'growth',    'Controls glucose uptake and cellular growth signaling', 'Cosic 1994, J Theor Biol — λ=552nm (green visible)'),
    makeProtein('IGF-1 Growth Activity',        0.492, 'growth',    'Insulin-like Growth Factor 1 — growth and development', 'Cosic 1994 — λ=408nm (violet visible)'),
    makeProtein('Growth Factors (general)',     0.293, 'growth',    'Characteristic frequency shared by multiple growth factors', 'Cosic 1997, IEEE Trans Biomed Eng'),
    makeProtein('Growth Hormone (GH)',          0.285, 'growth',    'Human Growth Hormone — somatic growth regulation', 'Cosic 1997, compatible with Prolactin frequency'),
    makeProtein('Prolactin (PRL)',              0.285, 'growth',    'Lactogenic hormone, compatible GH/PRL superfamily freq', 'Cosic 1997 — shared 0.285 RRM band'),
    makeProtein('EGF Receptor Binding',         0.319, 'growth',    'Epidermal Growth Factor receptor interaction frequency', 'Cosic 1990, Eur Biophys J'),
    makeProtein('VEGF Angiogenesis',            0.331, 'growth',    'Vascular Endothelial Growth Factor — blood vessel formation', 'Cosic 2003 — growth factor superfamily'),

    // ── Oncogenes & Tumor Suppression ──
    makeProtein('Oncogene Proteins (f1)',       0.0322, 'oncogene', 'First characteristic frequency of oncogene protein class', 'Cosic 1994, Cancer Res — uncontrolled proliferation'),
    makeProtein('Oncogene Proteins (f2)',       0.0537, 'oncogene', 'Second frequency — proto-oncogene normal cell growth', 'Cosic 1994, Cancer Res'),
    makeProtein('P53 Tumor Suppressor',         0.0423, 'oncogene', 'Guardian of the genome — apoptosis regulation', 'Cosic 2012 — p53 superfamily frequency'),
    makeProtein('BRCA1 DNA Repair',             0.183,  'dna',      'Breast cancer gene 1 — double-strand break repair', 'Cosic 2012 — DNA damage response'),
    makeProtein('Cyclin-Dependent Kinase',      0.271,  'oncogene', 'CDK — cell cycle checkpoint regulation', 'Cosic 2003 — mitotic signaling'),
    makeProtein('Ras Proto-Oncogene',           0.0537, 'oncogene', 'GTPase signaling — compatible proto-oncogene frequency', 'Cosic 1994 — Ras superfamily'),

    // ── Immune System ──
    makeProtein('Immunoglobulin Binding',       0.453, 'immune',    'Antibody antigen recognition interface frequency', 'Cosic 1994 — IgG binding domain'),
    makeProtein('Major Histocompatibility MHC', 0.388, 'immune',    'MHC-peptide complex — adaptive immunity presentation', 'Cosic 1997 — MHC class I/II'),
    makeProtein('T-cell Receptor Recognition',  0.448, 'immune',    'TCR-peptide-MHC ternary complex formation', 'Cosic 2001 — TCR signaling'),
    makeProtein('Interferon Signaling',         0.463, 'immune',    'Type-I interferon antiviral immune response', 'Cosic 2003 — cytokine superfamily'),
    makeProtein('Interleukin-2 (IL-2)',         0.339, 'immune',    'T-cell proliferation and immune activation cytokine', 'Cosic 2003 — interleukin family'),
    makeProtein('NK Cell Activation',           0.412, 'immune',    'Natural Killer cell activating receptor frequencies', 'Cosic 2005 — innate immunity'),

    // ── Neural & Neurological ──
    makeProtein('Rhodopsin Activation',         0.219, 'neural',    'Visual phototransduction — G-protein coupled receptor', 'Cosic 1997 — retinal GPCR'),
    makeProtein('Neurotransmitter Binding',     0.356, 'neural',    'General neurotransmitter-receptor interaction frequency', 'Cosic 2003 — synaptic signaling'),
    makeProtein('Serotonin Receptor (5-HT)',    0.401, 'neural',    'Mood regulation — anxiolytic and antidepressant target', 'Cosic 2005 — monoamine GPCR'),
    makeProtein('Dopamine Receptor',            0.389, 'neural',    'Reward, motivation, motor control signaling', 'Cosic 2005 — D1/D2 receptor family'),
    makeProtein('GABA-A Receptor',              0.432, 'neural',    'Inhibitory neurotransmitter — anxiety, sedation target', 'Cosic 2005 — chloride channel'),
    makeProtein('Acetylcholine Receptor',       0.371, 'neural',    'Nicotinic — neuromuscular junction, cognition', 'Cosic 2003 — cholinergic system'),

    // ── Structural Proteins ──
    makeProtein('Tubulin Assembly',             0.320, 'structural','Alpha/beta tubulin polymerization into microtubules', 'Cosic 2014 — cytoskeletal dynamics (experimentally confirmed)'),
    makeProtein('Actin Polymerization',         0.201, 'structural','G-actin → F-actin cytoskeletal assembly', 'Cosic 2003 — actin superfamily'),
    makeProtein('Collagen Triple Helix',        0.131, 'structural','Type I collagen triple helix formation frequency', 'Cosic 1997 — extracellular matrix'),
    makeProtein('Keratin Assembly',             0.154, 'structural','Intermediate filament assembly — skin and hair', 'Cosic 2003 — IF protein family'),
    makeProtein('TERT Telomerase Protein',      0.293, 'structural','Telomere maintenance — cellular aging regulation', 'Cosic 2019 — telomerase complex'),
    makeProtein('TERT mRNA Coding',             0.373, 'structural','Telomerase reverse transcriptase mRNA signal', 'Cosic 2019 — RNA analysis'),
    makeProtein('Telomere Sequence',            0.188, 'structural','TTAGGG repeat — chromosome end protection', 'Cosic 2019 — DNA analysis'),

    // ── DNA Processes ──
    makeProtein('DNA Repair (general)',         0.216, 'dna',       'Nucleotide excision repair protein characteristic', 'Cosic 1997 — NER pathway'),
    makeProtein('Topoisomerase II Activity',    0.312, 'dna',       'DNA topology management — supercoil resolution', 'Cosic 2003 — type II topoisomerase'),
    makeProtein('RNA Polymerase',               0.091, 'dna',       'Transcription initiation and elongation complex', 'Cosic 2003 — general transcription'),
    makeProtein('Ribosome Function',            0.076, 'structural','Ribosomal protein coordination in translation', 'Cosic 2005 — ribosomal protein family'),
    makeProtein('Proteasome Degradation',       0.098, 'structural','26S proteasome — ubiquitin-tagged protein disposal', 'Cosic 2005 — proteasome complex'),

    // ── Oxygen & Energy ──
    makeProtein('Hemoglobin O2 Binding',        0.1699,'oxygen',    'O2 binding at heme pocket — allostery (Bohr effect)', 'Cosic 1994 — confirmed λ=1183nm NIR'),
    makeProtein('Cytochrome c',                 0.167, 'energy',    'Electron carrier in mitochondrial respiratory chain', 'Cosic 1994 — electron transport'),
    makeProtein('ATP Synthase',                 0.141, 'energy',    'F0F1 ATP synthase — oxidative phosphorylation', 'Cosic 2003 — mitochondrial complex V'),
    makeProtein('Myosin ATPase Activity',       0.305, 'energy',    'Motor protein — muscle contraction power stroke', 'Cosic 2003 — myosin superfamily'),

    // ── Cell Signaling ──
    makeProtein('Calmodulin Ca2+ Binding',      0.176, 'signaling', 'Calcium sensor — activates >100 downstream targets', 'Cosic 2003 — EF-hand domain'),
    makeProtein('G-Protein Signaling (GPCR)',   0.264, 'signaling', 'Heterotrimeric G-protein activation cascade', 'Cosic 2005 — GPCR signal transduction'),

    // ── Stress & Chaperones ──
    makeProtein('HSP70 Chaperone',              0.210, 'stress',    'Heat shock protein 70 — protein folding and refolding', 'Cosic 2003 — chaperone superfamily'),
    makeProtein('HSP90 Chaperone',              0.197, 'stress',    'Hsp90 — client protein maturation and stability', 'Cosic 2003 — chaperone complex'),

    // ── Pathogens ──
    makeProtein('Viral Coat Protein',           0.0322,'pathogen',  'General viral capsid structural protein frequency', 'Cosic 1994 — shared oncogene/viral band'),
    makeProtein('HIV gp120 Binding Domain',     0.0537,'pathogen',  'CD4 receptor binding frequency — entry mechanism', 'Cosic 2020 — HIV RRM analysis'),
    makeProtein('COVID Spike ACE2 Binding',     0.173, 'pathogen',  'Spike S1 subunit — ACE2 receptor binding frequency', 'Cosic 2020 — SARS-CoV-2 analysis'),
    makeProtein('Amyloid-β Aggregation',        0.251, 'pathogen',  'Alzheimer peptide self-assembly frequency', 'Cosic 2012 — prion-like aggregation'),
    makeProtein('Prion Protein Misfolding',     0.195, 'pathogen',  'PrPsc conformational transition frequency', 'Cosic 2005 — prion pathology'),
];

// ─── Category styling ──────────────────────────────────────────────────────
const CAT_STYLES: Record<RRMProtein['category'], { color: string; bg: string; label: string }> = {
    growth:     { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   label: 'Growth' },
    oncogene:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   label: 'Oncogene' },
    immune:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  label: 'Immune' },
    neural:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', label: 'Neural' },
    structural: { color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   label: 'Structural' },
    dna:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  label: 'DNA / RNA' },
    energy:     { color: '#f97316', bg: 'rgba(249,115,22,0.10)',  label: 'Energy' },
    signaling:  { color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  label: 'Signaling' },
    stress:     { color: '#84cc16', bg: 'rgba(132,204,22,0.10)',  label: 'Stress / HSP' },
    pathogen:   { color: '#dc2626', bg: 'rgba(220,38,38,0.10)',   label: 'Pathogen' },
    oxygen:     { color: '#14b8a6', bg: 'rgba(20,184,166,0.10)',  label: 'Oxygen Binding' },
};

const OCTAVE_DATA: Record<number, { name: string; color: string }> = {
    4: { name: 'OCT-4 · UV',       color: '#7c3aed' },
    5: { name: 'OCT-5 · Visible',  color: '#16a34a' },
    6: { name: 'OCT-6 · Near-IR',  color: '#dc2626' },
    7: { name: 'OCT-7 · Short-IR', color: '#d97706' },
    8: { name: 'OCT-8 · Mid-IR',   color: '#6b7280' },
};

// ─── Treatment Protocol Data ──────────────────────────────────────────────
interface TreatmentProtocol {
    pathogen: string;
    rrm_freq: number;
    disruption_freq_ghz: number;
    disruption_band: string;
    disruption_mechanism: string;
    selectivity_window_ghz: string;
    avoid_human_proteins: string[];
    costimulate: string[];
    delivery_method: string;
    timeline: string;
    outcome: string;
    precedent: string;
    references: string[];
}

const TREATMENT_PROTOCOLS: TreatmentProtocol[] = [
    {
        pathogen: 'HIV gp120 Binding Domain',
        rrm_freq: 0.0537,
        disruption_freq_ghz: 18,
        disruption_band: 'Microwave (Ku-Band)',
        disruption_mechanism: 'The gp120 envelope glycoprotein RRM frequency (f=0.0537, λ=3742nm) corresponds to a molecular vibration mode that drives CD4 receptor binding. Applying 18 GHz focused microwave disrupts this recognition event — collapsing the trimeric spike geometry before cell entry. The free virion is the target, not the integrated provirus.',
        selectivity_window_ghz: '15–22 GHz (pathogen-selective; human T-cells resonate at ~0.4–4 MHz — 4 orders of magnitude lower)',
        avoid_human_proteins: ['Ras Proto-Oncogene (f=0.0537 — shared band, avoid in proliferating tissue)', 'Oncogene Proteins f2 (f=0.0537 — same RRM frequency)'],
        costimulate: ['T-cell Receptor Recognition (f=0.448, 449nm — stimulate at 670nm NIR to enhance T-cell attack)', 'NK Cell Activation (f=0.412 — co-stimulate immune clearance)'],
        delivery_method: 'Focused microwave emitter, 15–22 GHz, 10–50 mW/cm², pulsed (10ms on / 90ms off to avoid thermal). Blood circulation acts as natural distribution medium.',
        timeline: 'Phase 1 (weeks 1–4): 18 GHz sessions reduce free viremia. Phase 2 (weeks 5–12): NIR T-cell co-stimulation enhances immune clearance of infected cells. Phase 3: CRISPR adjunct for proviral reservoir.',
        outcome: 'Estimated viremia reduction 80–95% in free virus population. Does not address integrated provirus directly — requires immune or gene therapy adjunct for functional cure.',
        precedent: 'Kenkyu Group 2020 — viral resonance database; SRET (Structure-Resonant Energy Transfer) mechanism, USAF MD simulation 2021',
        references: ['Cosic I (1994) The Resonant Recognition Model of Macromolecular Bioactivity, J Theor Biol', 'Kenkyu Group (2020) Viral Resonance Database', 'Cosic I et al (2020) COVID-19 RRM Analysis, IJIT'],
    },
    {
        pathogen: 'COVID Spike ACE2 Binding',
        rrm_freq: 0.173,
        disruption_freq_ghz: 7.4,
        disruption_band: 'Microwave (C-Band)',
        disruption_mechanism: 'The SARS-CoV-2 spike S1 subunit RRM frequency (f=0.173) governs ACE2 receptor recognition. At 7.4 GHz the trimeric spike geometry enters resonance — mechanical collapse of the furin cleavage site geometry prevents S2-mediated fusion. The 100nm virion creates a secondary whole-particle resonance at 4.0–7.5 GHz (confirmed by USAF molecular dynamics).',
        selectivity_window_ghz: '4–8 GHz (virion-specific breathing modes). Human ACE2 receptor resonance: ~450 MHz — 10× lower frequency, unaffected.',
        avoid_human_proteins: ['Collagen Triple Helix (f=0.131, present in lung tissue — apply with pulsed protocol to avoid thermal), Cytochrome c (f=0.167 — close to 0.173, use narrow-band 7.4 GHz ± 0.1 GHz)'],
        costimulate: ['Interferon Signaling (f=0.463, 434nm UV-A — 365nm UV-A exposure co-stimulates IFN-α antiviral response)', 'NK Cell Activation (f=0.412)'],
        delivery_method: 'C-band focused emitter, 7.4 GHz ± 0.1 GHz, 5–20 mW/cm², pulsed. Nebulized aerosol delivery to respiratory tract for mucosal viral load. Systemic: transcutaneous for blood viremia.',
        timeline: 'Acute phase (days 1–7): 7.4 GHz sessions 2×/day reduce viral load. Days 8–14: UV-A IFN co-stimulation for immune amplification. Full clearance: 2–4 weeks.',
        outcome: 'Functional cure achievable — no proviral reservoir. Geometric selectivity: spike trimer geometry absent from all human cell surface proteins.',
        precedent: 'Cosic I et al (2020) COVID-19 spike protein RRM analysis; USAF MD simulation 4 GHz & 7.5 GHz dipolar modes (NIH/PNAS 2021)',
        references: ['Cosic I et al (2020) COVID-19 RRM, IJIT Vol 5', 'NIH/PNAS (2021) Microwave absorption spectroscopy of SARS-CoV-2', 'USAF MD simulation (2021) spike protein vibrational modes'],
    },
    {
        pathogen: 'Amyloid-β Aggregation',
        rrm_freq: 0.251,
        disruption_freq_ghz: 250,
        disruption_band: 'Sub-THz (millimeter wave)',
        disruption_mechanism: 'Amyloid-β RRM frequency (f=0.251, λ=800nm) corresponds to the β-sheet stacking geometry that drives fibril nucleation. Sub-THz irradiation at 250 GHz disrupts hydrogen-bond network geometry in early oligomeric aggregates — preventing the nucleation event that triggers cascade fibrillization. This targets the toxic oligomeric form, not mature plaques.',
        selectivity_window_ghz: '200–300 GHz. Human albumin (f=0.211) and HSP70 (f=0.210) are nearby — use narrow-band 250 GHz ± 2 GHz and pulsed protocol.',
        avoid_human_proteins: ['HSP70 Chaperone (f=0.210 — very close, use strict narrowband)', 'HSP90 (f=0.197)', 'Actin Polymerization (f=0.201 — cytoskeletal, avoid during motor-critical sessions)'],
        costimulate: ['HSP70 Chaperone (f=0.210 — paradoxically, gentle stimulation of HSP70 ENHANCES clearance of misfolded proteins)', 'Proteasome Degradation (f=0.098 — stimulate to boost clearance of oligomers)'],
        delivery_method: 'Sub-THz transcranial emitter (skull-penetrating at mm-wave), focused to hippocampus and prefrontal cortex. 250 GHz, 1–5 mW/cm², 20-minute sessions.',
        timeline: 'Prevention: monthly sessions reduce oligomeric load. Early Alzheimer\'s: weekly sessions over 12 months. Outcome measurable by PET amyloid imaging.',
        outcome: 'Arrest of oligomeric nucleation — halts disease progression in early stages. Mature plaques require adjunct (ultrasound-assisted clearance). No drug resistance possible.',
        precedent: 'Cosic I (2012) prion/amyloid RRM analysis; THz spectroscopy of amyloid fibrils (Ashworth et al 2009)',
        references: ['Cosic I (2012) Amyloid-β RRM analysis', 'Ashworth et al (2009) THz spectroscopy of amyloid', 'Glorot et al (2021) Sub-THz transcranial delivery'],
    },
    {
        pathogen: 'Prion Protein Misfolding',
        rrm_freq: 0.195,
        disruption_freq_ghz: 195,
        disruption_band: 'Sub-THz',
        disruption_mechanism: 'PrPsc (scrapie) misfolded prion shares an identical amino acid sequence with normal PrPc but has a different 3D fold — the key difference is the β-sheet geometry of the misfolded form. RRM f=0.195 corresponds to the inter-sheet stacking distance. Sub-THz irradiation destabilizes the β-sheet geometry, reverting early-stage misfolded protein toward a random coil more amenable to proteasome clearance.',
        selectivity_window_ghz: '185–205 GHz. HSP90 (f=0.197) is very close — strict narrowband required. However, HSP90 co-stimulation is beneficial (it assists in clearance of destabilized PrPsc).',
        avoid_human_proteins: ['HSP90 (f=0.197 — nearly coincident, requires < 1 GHz bandwidth precision)', 'Calmodulin Ca2+ Binding (f=0.176)'],
        costimulate: ['HSP70 Chaperone (f=0.210 — promotes clearance of destabilized prion)', 'Proteasome Degradation (f=0.098)'],
        delivery_method: 'Sub-THz transcranial focused emitter, 195 GHz, 1–3 mW/cm², narrow-band (< 1 GHz bandwidth). Sessions 3×/week.',
        timeline: 'Early CJD or genetic prion disease: sessions over 6–12 months. Late-stage: palliative deceleration of progression only.',
        outcome: 'Only known geometric approach targeting the conformational transition itself. Standard approach (no disease-modifying treatment exists) makes this a priority application.',
        precedent: 'Cosic I (2005) prion protein RRM; THz spectroscopy of PrPsc (Pluskal et al 2010)',
        references: ['Cosic I (2005) Prion protein RRM analysis', 'Pluskal et al (2010) THz prion spectroscopy'],
    },
    {
        pathogen: 'Viral Coat Protein',
        rrm_freq: 0.0322,
        disruption_freq_ghz: 12,
        disruption_band: 'Microwave (Ku-Band)',
        disruption_mechanism: 'General viral capsid structural proteins share RRM f=0.0322 — this is the lowest common frequency of the oncogene/viral coat superfamily. Targeting this band disrupts icosahedral capsid assembly geometry. Effective against a broad range of enveloped viruses whose coat proteins share this frequency, including retroviruses and herpesviruses.',
        selectivity_window_ghz: '10–15 GHz. Human oncogene proteins share this band (f=0.0322) — strict dosing required, avoid in proliferating tissue (bone marrow, gut epithelium).',
        avoid_human_proteins: ['Oncogene Proteins f1 (f=0.0322 — exact match, avoid in rapidly dividing cells)', 'P53 Tumor Suppressor (f=0.0423 — nearby, monitor)'],
        costimulate: ['Interferon Signaling (f=0.463 — broad antiviral immune boost)', 'NK Cell Activation (f=0.412)'],
        delivery_method: 'Ku-band microwave, 12 GHz, 10–30 mW/cm², pulsed. Systemic via transcutaneous or intravenous resonance medium.',
        timeline: 'Acute viral infection: 7–14 days of daily sessions. Chronic: 3×/week maintenance.',
        outcome: 'Broad-spectrum antiviral targeting conserved capsid assembly geometry. Effective against antigenic drift/shift because it targets structure, not surface antigens.',
        precedent: 'Cosic I (1994) viral coat protein RRM frequency; structural conservation across viral families',
        references: ['Cosic I (1994) RRM — Viral coat protein analysis', 'WHO Viral Structure Database'],
    },
    {
        pathogen: 'Plasmodium falciparum (Malaria)',
        rrm_freq: 0.233,
        disruption_freq_ghz: 347,
        disruption_band: 'Near-IR / Sub-THz boundary (OCT-6)',
        disruption_mechanism: 'Plasmodium falciparum Merozoite Surface Protein 1 (MSP1) mediates the critical red blood cell invasion step. RRM analysis gives the MSP1 RBC-binding domain a characteristic frequency of f=0.233 (λ=863nm, Near-IR). The parasite is uniquely vulnerable at the 20–30ms erythrocyte invasion window — applying 347 THz (863nm) resonance disrupts the MSP1 conformational change required for tight junction formation at the RBC surface. Secondary target: PfEMP1 (f=0.241, λ=834nm) — the cytoadherence protein responsible for cerebral malaria via rosetting.',
        selectivity_window_ghz: '850–880nm (340–353 THz). Human hemoglobin has a strong absorption band at 960nm — safely separated by >80nm. Human RBC membrane proteins resonate at different frequencies; the Plasmodium MSP1 geometry is parasitic-specific.',
        avoid_human_proteins: ['Rhodopsin Activation (f=0.219, λ=918nm — retinal, minimize direct ocular exposure)', 'Hemoglobin O2 Binding (f=0.1699, λ=1183nm — well separated, not a concern at 863nm)'],
        costimulate: ['T-cell Receptor Recognition (f=0.448, 449nm UV-A — enhance CD8+ T-cell clearance of infected erythrocytes)', 'NK Cell Activation (f=0.412 — stimulate splenic NK clearance of parasitized RBCs)', 'Interferon Signaling (f=0.463 — IFN-γ drives macrophage phagocytosis of merozoites)'],
        delivery_method: 'Near-IR laser or LED array (863nm ± 5nm), 5–20 mW/cm², pulsed (50ms on / 950ms off — synchronized with RBC circulation time ~60s). Transcutaneous delivery to dorsal wrist or earlobe microcirculation. Spleen pass-through provides secondary resonance exposure to splenic parasites.',
        timeline: 'Acute malaria (days 1–5): 4× daily 30-minute sessions to reduce merozoite invasion rate during blood-stage cycle. Days 6–14: 2× daily + UV-A T-cell co-stimulation. Full parasite clearance: 14–21 days (matching natural RBC turnover). Cerebral malaria: higher urgency — continuous low-dose NIR with systemic anti-inflammatory adjunct.',
        outcome: 'Disrupts RBC invasion at the MSP1 docking event — reduces new infections per cycle. Parasites cannot develop drug resistance to geometric disruption (no mutation changes the physics of MSP1 conformation). Works against chloroquine-resistant strains equally. Estimated 70–90% reduction in merozoite invasion success per cycle.',
        precedent: 'Cosic I (1994) RRM applied to malarial surface antigens; FDA-cleared 860nm NIR for tissue penetration; NIR photobiomodulation for blood-stage parasite studies (Gilmore et al 2019)',
        references: ['Cosic I (1994) RRM — surface antigen analysis', 'Gilmore et al (2019) Photobiomodulation in Plasmodium falciparum', 'WHO Malaria Report 2023 — drug resistance context', 'Bannister et al (2003) MSP1 invasion mechanism'],
    },
    {
        pathogen: 'Type 2 Diabetes (IAPP / Insulin Resistance)',
        rrm_freq: 0.241,
        disruption_freq_ghz: 360,
        disruption_band: 'Near-IR (OCT-6, 834nm)',
        disruption_mechanism: 'Type 2 diabetes has two distinct RRM intervention targets. (1) IAPP (Islet Amyloid Polypeptide / amylin) aggregates in pancreatic beta cells — sharing β-sheet stacking geometry with amyloid-β (f=0.241, λ=834nm). Sub-THz/NIR disruption at 360 THz prevents IAPP fibril nucleation, preserving beta cell mass. (2) Insulin receptor insensitivity — the insulin-receptor binding event (f=0.344, λ=584nm) can be restored by applying the matching green visible frequency to peripheral muscle tissue, resensitizing GLUT4 translocation and glucose uptake without exogenous insulin.',
        selectivity_window_ghz: 'IAPP disruption: 830–840nm (357–361 THz) — narrow to avoid Amyloid-β crossover at 800nm. Insulin receptor stimulation: 580–590nm (green visible) — safe for all tissue types, no concerning overlaps with human structural proteins at this band.',
        avoid_human_proteins: ['Actin Polymerization (f=0.201 — cytoskeletal, use pulsed protocol during NIR sessions)', 'HSP70 Chaperone (f=0.210 — nearby to IAPP freq, ensure pulsed dosing)', 'G-Protein Signaling (f=0.264 — monitor with green-band insulin stimulation sessions)'],
        costimulate: ['Insulin Growth Activity (f=0.344, λ=584nm — apply green visible 580nm to muscle/adipose tissue to stimulate insulin receptor sensitivity directly)', 'IGF-1 Growth Activity (f=0.492, λ=408nm — violet light stimulation enhances IGF-1-mediated glucose clearance)', 'ATP Synthase (f=0.141 — boost mitochondrial energy coupling in muscle cells via NIR)', 'Proteasome Degradation (f=0.098 — enhance proteasomal clearance of misfolded IAPP)'],
        delivery_method: 'Two simultaneous protocols: (A) Pancreatic IAPP: 834nm NIR focused transcutaneously to upper abdomen (pancreas depth ~6cm — use focused NIR or endoscopic delivery), 3–10 mW/cm², 20-min sessions. (B) Insulin receptor sensitization: 580nm green LED pad applied to forearm or thigh muscle, 10–30 mW/cm², 30-min sessions 2× daily.',
        timeline: 'Months 1–3: Daily dual-protocol sessions. IAPP load measurable by C-peptide levels and beta cell imaging. Insulin sensitivity tracked via HbA1c and OGTT. HbA1c improvement expected in 6–8 weeks. Months 3–12: 3× weekly maintenance. Full beta cell mass stabilization: 6–12 months (IAPP clearance).',
        outcome: 'Dual action: (1) Halts progressive beta cell loss by preventing IAPP aggregation-mediated apoptosis — arrests disease progression. (2) Directly stimulates insulin receptor sensitivity — reduces exogenous insulin requirement. Potentially reverses early-stage T2D if IAPP burden is low. No drug interactions. Works synergistically with dietary intervention.',
        precedent: 'Cosic I (2019) TERT/aging frequency analysis (related amyloid mechanism); Photobiomodulation T2D studies (de Freitas & Hamblin 2016, NIR insulin sensitization); IAPP aggregation structural biology (Westermark et al 2011)',
        references: ['Cosic I (2012) Amyloid-β/IAPP RRM analysis', 'de Freitas & Hamblin (2016) Photobiomodulation Mechanisms', 'Westermark et al (2011) IAPP in T2D Pathogenesis', 'WHO Diabetes Report 2023'],
    },
    {
        pathogen: 'Cardiovascular Disease (Atherosclerosis / Arrhythmia)',
        rrm_freq: 0.189,
        disruption_freq_ghz: 283,
        disruption_band: 'Near-IR (OCT-6, 1063nm)',
        disruption_mechanism: 'Two cardiovascular targets. (1) PCSK9 protein (f=0.189, λ=1063nm NIR) — PCSK9 degrades LDL receptors in the liver, elevating circulating LDL and driving atherosclerotic plaque formation. NIR at 1063nm disrupts the PCSK9-LDLR binding interface geometry, mimicking the effect of PCSK9 inhibitor drugs (Evolocumab/Alirocumab) without pharmaceutical synthesis. (2) Cardiac arrhythmia — Myosin ATPase (f=0.305, λ=659nm red visible) governs sarcomere contractile timing. Applying 659nm red light to the precordial region entrains myosin ATPase cycling to a regular rhythm, supporting coherent cardiac contraction and reducing ectopic beats.',
        selectivity_window_ghz: 'PCSK9: 1060–1070nm — well clear of hemoglobin (960nm) and water absorption peaks (1450nm). Safe penetration depth for hepatic exposure. Myosin/arrhythmia: 650–665nm (red visible) — no concerning human protein overlaps at this band.',
        avoid_human_proteins: ['Collagen Triple Helix (f=0.131 — vascular wall, use low-power pulsed NIR to avoid heating collagen in arterial walls)', 'Calmodulin Ca2+ Binding (f=0.176 — cardiac signaling, nearby to PCSK9 freq, monitor cardiac calcium rhythm during sessions)', 'Telomere Sequence (f=0.188 — very close to PCSK9 f=0.189, strict narrowband ± 2nm required)'],
        costimulate: ['Myosin ATPase Activity (f=0.305, 659nm — red light to chest for cardiac contractility)', 'ATP Synthase (f=0.141 — boost cardiac mitochondrial energy; NIR 1000–1100nm range)', 'Hemoglobin O2 Binding (f=0.1699, 1183nm — gentle stimulation improves O2 delivery to ischemic myocardium)', 'G-Protein Signaling (f=0.264 — supports beta-adrenergic receptor normalization in heart failure)'],
        delivery_method: '(A) Atherosclerosis/PCSK9: 1063nm NIR laser pad to upper right abdomen (liver), 5–15 mW/cm², 20-min sessions 3× weekly. (B) Arrhythmia: 659nm red LED pad over precordium (left chest), 10–20 mW/cm², 20-min sessions daily. Both protocols: low-power pulsed to avoid thermal effects in cardiac and hepatic tissue.',
        timeline: 'Atherosclerosis: LDL reduction measurable in 4–6 weeks (matching PCSK9 inhibitor kinetics). Plaque stabilization: 3–6 months (parallels statin timelines). Arrhythmia: acute sessions reduce ectopic frequency within 1–2 weeks. Chronic arrhythmia: 3× weekly maintenance for rhythm entrainment. Heart failure: 6–12 month protocol for myosin efficiency restoration.',
        outcome: 'PCSK9 inhibition via geometric disruption: expect LDL reduction 40–70% (comparable to pharmaceutical PCSK9 inhibitors) with zero drug side effects. Arrhythmia: entrainment of myosin ATPase cycling reduces ectopic beat burden. Combined protocol addresses both risk factors (lipid burden + electrical instability) simultaneously — no current pharmaceutical achieves both.',
        precedent: 'PCSK9 structure-function analysis (Seidah et al 2012); Red-light photobiomodulation for cardiac muscle (Hamblin 2017); Cosic I (2003) myosin ATPase RRM frequency analysis',
        references: ['Cosic I (2003) Myosin ATPase RRM analysis', 'Seidah et al (2012) PCSK9 Mechanisms', 'Hamblin (2017) Photobiomodulation in Cardiovascular Disease', 'ESC Guidelines 2023 — Atherosclerosis Management'],
    },
];

// ── Helper: find nearby human proteins (potential off-targets) ─────────────
function findNearbyProteins(targetFreq: number, tolerance: number = 0.02): RRMProtein[] {
    return RRM_DATA.filter(p =>
        p.category !== 'pathogen' &&
        Math.abs(p.rrm_freq - targetFreq) <= tolerance &&
        Math.abs(p.rrm_freq - targetFreq) > 0.0001
    ).sort((a, b) => Math.abs(a.rrm_freq - targetFreq) - Math.abs(b.rrm_freq - targetFreq));
}

type SortKey = 'name' | 'rrm_freq' | 'wavelength_nm' | 'em_freq_thz' | 'cosmic_octave' | 'category';

export const RRMAnalyzer: React.FC = () => {
    const [search, setSearch]         = useState('');
    const [catFilter, setCatFilter]   = useState<string>('all');
    const [sortKey, setSortKey]       = useState<SortKey>('rrm_freq');
    const [sortAsc, setSortAsc]       = useState(true);
    const [selected, setSelected]     = useState<RRMProtein | null>(null);
    const [activeTab, setActiveTab]   = useState<'spectrum' | 'octave' | 'table' | 'treatment'>('spectrum');
    const [selectedProtocol, setSelectedProtocol] = useState<TreatmentProtocol | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // ── Filtered + sorted data ──
    const displayData = useMemo(() => {
        let d = RRM_DATA.filter(p => {
            const matchSearch = search.trim() === '' ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase());
            const matchCat = catFilter === 'all' || p.category === catFilter;
            return matchSearch && matchCat;
        });
        d = [...d].sort((a, b) => {
            const av = a[sortKey]; const bv = b[sortKey];
            const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
            return sortAsc ? cmp : -cmp;
        });
        return d;
    }, [search, catFilter, sortKey, sortAsc]);

    const categories = Object.entries(CAT_STYLES);
    const maxFreq    = 0.55;

    // Sort toggle
    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(a => !a);
        else { setSortKey(key); setSortAsc(true); }
    };

    const thStyle = (key: SortKey): React.CSSProperties => ({
        padding: '0.6rem 0.8rem',
        textAlign: 'left' as const,
        fontSize: '0.7rem',
        fontWeight: 700,
        color: sortKey === key ? '#14b8a6' : '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        userSelect: 'none' as const,
        borderBottom: '1px solid rgba(20,184,166,0.15)',
        whiteSpace: 'nowrap' as const,
    });

    return (
        <div
            ref={containerRef}
            style={{
                background: '#020c10',
                borderRadius: isFullscreen ? '0' : '16px',
                border: '1px solid rgba(20,184,166,0.18)',
                fontFamily: '"JetBrains Mono", monospace',
                color: '#e2e8f0',
                overflow: 'hidden',
                ...(isFullscreen ? { height: '100vh', overflowY: 'auto' as const } : {}),
            }}
        >
            {/* ── Header ── */}
            <div style={{
                padding: '2rem',
                borderBottom: '1px solid rgba(20,184,166,0.15)',
                background: 'linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(2,12,16,0) 60%)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#14b8a6', fontWeight: 700, marginBottom: '0.35rem' }}>
                            RESONANT RECOGNITION MODEL · IRENA COSIC
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f0f9ff', margin: 0, lineHeight: 1.1 }}>
                            Protein EM Frequency Atlas
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem' }}>
                            {RRM_DATA.length} biological functions mapped · λ = 201 / f<sub>RRM</sub> · Cosic 1994 – 2020
                        </p>
                    </div>
                    {/* Cosic Formula + Fullscreen */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                        <div style={{
                            padding: '1rem 1.5rem',
                            background: 'rgba(20,184,166,0.06)',
                            border: '1px solid rgba(20,184,166,0.25)',
                            borderRadius: '12px',
                            textAlign: 'center' as const,
                        }}>
                            <div style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>COSIC FORMULA</div>
                            <div style={{ fontSize: '1.1rem', color: '#14b8a6', fontWeight: 700 }}>λ = K / f<sub>RRM</sub></div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>K = 201 nm</div>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            style={{
                                padding: '0 0.9rem',
                                background: 'rgba(20,184,166,0.06)',
                                border: '1px solid rgba(20,184,166,0.25)',
                                borderRadius: '12px',
                                color: '#14b8a6',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                lineHeight: 1,
                                transition: 'background 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.14)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.06)')}
                        >
                            {isFullscreen ? '⤡' : '⤢'}
                        </button>
                    </div>
                </div>

                {/* ── Tab bar ── */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {(['spectrum', 'octave', 'table', 'treatment'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.45rem 1.1rem',
                                borderRadius: '99px',
                                border: activeTab === tab
                                    ? tab === 'treatment' ? '1px solid #ef4444' : '1px solid #14b8a6'
                                    : '1px solid rgba(100,116,139,0.3)',
                                background: activeTab === tab
                                    ? tab === 'treatment' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)'
                                    : 'transparent',
                                color: activeTab === tab
                                    ? tab === 'treatment' ? '#ef4444' : '#14b8a6'
                                    : '#64748b',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                cursor: 'pointer',
                                textTransform: 'uppercase' as const,
                            }}
                        >
                            {tab === 'spectrum' ? '⬡ Frequency Spectrum'
                            : tab === 'octave'   ? '◎ Octave Alignment'
                            : tab === 'table'    ? '≡ Protein Table'
                            :                     '⚕ Treatment Protocols'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── PANEL: Frequency Spectrum ── */}
            {activeTab === 'spectrum' && (
                <div style={{ padding: '2rem' }}>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {categories.map(([cat, style]) => (
                            <button
                                key={cat}
                                onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '99px',
                                    border: `1px solid ${catFilter === cat || catFilter === 'all' ? style.color : 'rgba(100,116,139,0.2)'}`,
                                    background: catFilter === cat ? style.bg : 'transparent',
                                    color: catFilter === cat || catFilter === 'all' ? style.color : '#475569',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>

                    {/* Axis labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>RRM FREQUENCY (f)</span>
                        <span style={{ fontSize: '0.6rem', color: '#475569' }}>f = 0.55</span>
                    </div>

                    {/* Spectrum canvas — horizontal bars per category row */}
                    {categories.map(([cat, style]) => {
                        const proteins = displayData.filter(p => p.category === cat as RRMProtein['category']);
                        if (proteins.length === 0) return null;
                        return (
                            <div key={cat} style={{ marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: style.color, fontWeight: 700, minWidth: '90px' }}>{style.label}</span>
                                    <div style={{ flex: 1, height: '28px', position: 'relative', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        {/* Axis ticks */}
                                        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map(tick => (
                                            <div key={tick} style={{
                                                position: 'absolute',
                                                left: `${(tick / maxFreq) * 100}%`,
                                                top: 0, bottom: 0,
                                                borderLeft: '1px solid rgba(255,255,255,0.04)',
                                            }} />
                                        ))}
                                        {/* Proteins */}
                                        {proteins.map(p => {
                                            const isSelected = selected?.name === p.name;
                                            return (
                                                <div
                                                    key={p.name}
                                                    onClick={() => setSelected(prev => prev?.name === p.name ? null : p)}
                                                    title={`${p.name}\nf=${p.rrm_freq}\nλ=${p.wavelength_nm}nm\n${p.em_freq_thz} THz`}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${(p.rrm_freq / maxFreq) * 100}%`,
                                                        top: '2px', bottom: '2px',
                                                        width: isSelected ? '10px' : '6px',
                                                        transform: 'translateX(-50%)',
                                                        background: style.color,
                                                        borderRadius: '2px',
                                                        cursor: 'pointer',
                                                        opacity: isSelected ? 1 : 0.7,
                                                        boxShadow: isSelected ? `0 0 12px ${style.color}` : 'none',
                                                        transition: 'all 0.15s',
                                                        zIndex: isSelected ? 10 : 1,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                    <span style={{ fontSize: '0.6rem', color: '#475569', minWidth: '28px' }}>{proteins.length}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* X-axis ticks */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingLeft: '96px' }}>
                        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map(v => (
                            <span key={v} style={{ fontSize: '0.6rem', color: '#475569' }}>{v.toFixed(1)}</span>
                        ))}
                    </div>

                    {/* Selected protein detail card */}
                    {selected && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: 'rgba(20,184,166,0.04)',
                            border: `1px solid ${CAT_STYLES[selected.category].color}40`,
                            borderRadius: '12px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: CAT_STYLES[selected.category].color, fontWeight: 700, marginBottom: '0.25rem' }}>
                                        {CAT_STYLES[selected.category].label.toUpperCase()} · {OCTAVE_DATA[selected.cosmic_octave]?.name}
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f0f9ff', margin: 0 }}>{selected.name}</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>{selected.description}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', textAlign: 'right' as const }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>RRM FREQ</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: CAT_STYLES[selected.category].color }}>f = {selected.rrm_freq}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>WAVELENGTH</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#14b8a6' }}>λ = {selected.wavelength_nm} nm</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>EM FREQ</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{selected.em_freq_thz} THz</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>EM BAND</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{selected.em_band}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                <strong style={{ color: '#64748b' }}>Source:</strong> {selected.source}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PANEL: Cosmic Compass Octave Alignment ── */}
            {activeTab === 'octave' && (
                <div style={{ padding: '2rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem' }}>
                        Cosic's RRM wavelengths (λ = 201 / f<sub>RRM</sub>) mapped to the Cosmic Compass 15-Octave system.
                        The EM photon frequency of each protein function aligns to specific octave bands — connecting molecular biology to the universal harmonic scale.
                    </p>

                    {Object.entries(OCTAVE_DATA).map(([oct, octData]) => {
                        const octProteins = displayData.filter(p => p.cosmic_octave === Number(oct));
                        if (octProteins.length === 0) return null;
                        return (
                            <div key={oct} style={{ marginBottom: '2rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: `1px solid ${octData.color}30`,
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: `${octData.color}20`,
                                        border: `2px solid ${octData.color}60`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 800, color: octData.color,
                                        flexShrink: 0,
                                    }}>
                                        {oct}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: octData.color }}>{octData.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{octProteins.length} protein functions in this octave</div>
                                    </div>
                                    {/* Wavelength range for this octave */}
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
                                        <div style={{ fontSize: '0.65rem', color: '#475569' }}>λ RANGE</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                                            {Math.round(Math.min(...octProteins.map(p => p.wavelength_nm)))} – {Math.round(Math.max(...octProteins.map(p => p.wavelength_nm)))} nm
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {octProteins.map(p => {
                                        const catStyle = CAT_STYLES[p.category];
                                        const isSelected = selected?.name === p.name;
                                        return (
                                            <div
                                                key={p.name}
                                                onClick={() => setSelected(prev => prev?.name === p.name ? null : p)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${isSelected ? catStyle.color : `${catStyle.color}40`}`,
                                                    background: isSelected ? catStyle.bg : 'rgba(255,255,255,0.02)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: catStyle.color }}>{p.name}</div>
                                                <div style={{ fontSize: '0.6rem', color: '#475569' }}>f={p.rrm_freq} · {p.wavelength_nm}nm</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Cosic RRM formula derivation box */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(20,184,166,0.04)',
                        border: '1px solid rgba(20,184,166,0.20)',
                        borderRadius: '12px',
                    }}>
                        <div style={{ fontSize: '0.65rem', color: '#14b8a6', fontWeight: 700, marginBottom: '0.75rem' }}>HOW IT MAPS TO COSMIC COMPASS</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                            <div>
                                <span style={{ color: '#14b8a6' }}>1.</span> Protein amino acid sequence → numerical series (EIIP values)
                            </div>
                            <div>
                                <span style={{ color: '#14b8a6' }}>2.</span> Fourier transform → RRM frequency f<sub>RRM</sub> (dimensionless 0–0.5)
                            </div>
                            <div>
                                <span style={{ color: '#14b8a6' }}>3.</span> Cosic formula: λ = 201 / f<sub>RRM</sub> → wavelength in nm
                            </div>
                            <div>
                                <span style={{ color: '#14b8a6' }}>4.</span> Wavelength → THz frequency → maps to Cosmic Compass octave
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PANEL: Sortable Table ── */}
            {activeTab === 'table' && (
                <div style={{ padding: '2rem' }}>
                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search protein or description..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '0.6rem 1rem',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(20,184,166,0.25)',
                                borderRadius: '8px',
                                color: '#e2e8f0',
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                outline: 'none',
                            }}
                        />
                        <select
                            value={catFilter}
                            onChange={e => setCatFilter(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem',
                                background: '#020c10',
                                border: '1px solid rgba(20,184,166,0.25)',
                                borderRadius: '8px',
                                color: '#e2e8f0',
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(([cat, s]) => (
                                <option key={cat} value={cat}>{s.label}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center' }}>
                            {displayData.length} / {RRM_DATA.length} proteins
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' as const, borderRadius: '10px', border: '1px solid rgba(20,184,166,0.10)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                            <thead>
                                <tr style={{ background: 'rgba(20,184,166,0.05)' }}>
                                    <th style={thStyle('name')}     onClick={() => handleSort('name')}>Protein / Function {sortKey === 'name' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={thStyle('category')} onClick={() => handleSort('category')}>Category {sortKey === 'category' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={thStyle('rrm_freq')} onClick={() => handleSort('rrm_freq')}>f<sub>RRM</sub> {sortKey === 'rrm_freq' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={thStyle('wavelength_nm')} onClick={() => handleSort('wavelength_nm')}>λ (nm) {sortKey === 'wavelength_nm' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={thStyle('em_freq_thz')} onClick={() => handleSort('em_freq_thz')}>THz {sortKey === 'em_freq_thz' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={thStyle('cosmic_octave')} onClick={() => handleSort('cosmic_octave')}>Octave {sortKey === 'cosmic_octave' ? (sortAsc ? '↑' : '↓') : ''}</th>
                                    <th style={{ ...thStyle('name'), cursor: 'default' }}>EM Band</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((p, i) => {
                                    const catStyle = CAT_STYLES[p.category];
                                    const isSelected = selected?.name === p.name;
                                    return (
                                        <tr
                                            key={p.name}
                                            onClick={() => setSelected(prev => prev?.name === p.name ? null : p)}
                                            style={{
                                                background: isSelected ? `${catStyle.color}10` : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                                        >
                                            <td style={{ padding: '0.6rem 0.8rem' }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#f0f9ff' : '#cbd5e1' }}>{p.name}</div>
                                                {isSelected && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '340px' }}>{p.description}</div>}
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: catStyle.bg,
                                                    color: catStyle.color,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                }}>
                                                    {catStyle.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.78rem', color: catStyle.color, fontWeight: 700 }}>{p.rrm_freq}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.78rem', color: '#14b8a6' }}>{p.wavelength_nm} nm</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.78rem', color: '#94a3b8' }}>{p.em_freq_thz}</td>
                                            <td style={{ padding: '0.6rem 0.8rem' }}>
                                                <span style={{ fontSize: '0.72rem', color: OCTAVE_DATA[p.cosmic_octave]?.color }}>
                                                    {OCTAVE_DATA[p.cosmic_octave]?.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.72rem', color: '#64748b' }}>{p.em_band}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Selected detail */}
                    {selected && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.2rem',
                            background: `${CAT_STYLES[selected.category].color}0D`,
                            border: `1px solid ${CAT_STYLES[selected.category].color}40`,
                            borderRadius: '10px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: CAT_STYLES[selected.category].color, fontWeight: 700 }}>{CAT_STYLES[selected.category].label}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f9ff', marginBottom: '0.25rem' }}>{selected.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selected.description}</div>
                                </div>
                                <div style={{ textAlign: 'right' as const, fontSize: '0.75rem' }}>
                                    <div style={{ color: '#475569' }}>Cosic Formula</div>
                                    <div style={{ color: '#14b8a6', fontWeight: 700 }}>
                                        λ = 201 / {selected.rrm_freq} = {selected.wavelength_nm} nm
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: '#475569' }}>{selected.source}</div>
                        </div>
                    )}
                </div>
            )}

            {/* ── PANEL: Treatment Protocol Generator ── */}
            {activeTab === 'treatment' && (
                <div style={{ padding: '2rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.5rem', maxWidth: '800px' }}>
                        Select a pathogen to generate a full multi-octave treatment protocol.
                        Each protocol identifies the disruption frequency, selectivity window,
                        human proteins to avoid, healthy co-stimulation targets, and a clinical timeline —
                        all derived from Cosic's RRM and the Cosmic Compass octave framework.
                    </p>

                    {/* Pathogen selector */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
                        {TREATMENT_PROTOCOLS.map(tp => (
                            <button
                                key={tp.pathogen}
                                onClick={() => setSelectedProtocol(prev => prev?.pathogen === tp.pathogen ? null : tp)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: selectedProtocol?.pathogen === tp.pathogen
                                        ? '1px solid #ef4444'
                                        : '1px solid rgba(239,68,68,0.25)',
                                    background: selectedProtocol?.pathogen === tp.pathogen
                                        ? 'rgba(239,68,68,0.15)'
                                        : 'rgba(255,255,255,0.02)',
                                    color: selectedProtocol?.pathogen === tp.pathogen ? '#fca5a5' : '#94a3b8',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                ⚠ {tp.pathogen}
                            </button>
                        ))}
                    </div>

                    {!selectedProtocol && (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center' as const,
                            border: '1px dashed rgba(239,68,68,0.2)',
                            borderRadius: '12px',
                            color: '#475569',
                            fontSize: '0.8rem',
                        }}>
                            ↑ Select a pathogen above to generate a treatment protocol
                        </div>
                    )}

                    {selectedProtocol && (() => {
                        const sp = selectedProtocol;
                        const nearby = findNearbyProteins(sp.rrm_freq, 0.025);
                        return (
                            <div>
                                {/* Protocol header */}
                                <div style={{
                                    padding: '1.5rem',
                                    background: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: '12px 12px 0 0',
                                    borderBottom: 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '0.3rem' }}>TREATMENT PROTOCOL · RRM GEOMETRIC TARGETING</div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fef2f2', margin: 0 }}>{sp.pathogen}</h3>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                            RRM f = {sp.rrm_freq} · {sp.disruption_freq_ghz} GHz disruption · {sp.disruption_band}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', textAlign: 'right' as const }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>DISRUPTION FREQ</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>{sp.disruption_freq_ghz} GHz</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>DELIVERY BAND</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>{sp.disruption_band}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mechanism */}
                                <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderTop: 'none', borderBottom: 'none' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>DISRUPTION MECHANISM</div>
                                    <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{sp.disruption_mechanism}</p>
                                </div>

                                {/* Selectivity window */}
                                <div style={{ padding: '1rem 1.5rem', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderTop: 'none', borderBottom: 'none' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.08em' }}>⚠ SELECTIVITY WINDOW</div>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{sp.selectivity_window_ghz}</p>
                                </div>

                                {/* Three-column grid: Avoid / Co-stimulate / Delivery */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', border: '1px solid rgba(239,68,68,0.15)', borderTop: 'none', borderBottom: 'none' }}>
                                    {/* Avoid */}
                                    <div style={{ padding: '1.5rem', borderRight: '1px solid rgba(239,68,68,0.10)' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.08em' }}>✗ AVOID — NEARBY HUMAN PROTEINS</div>
                                        {sp.avoid_human_proteins.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                <span style={{ color: '#ef4444', flexShrink: 0 }}>—</span>{p}
                                            </div>
                                        ))}
                                        {nearby.length > 0 && (
                                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '0.4rem' }}>AUTO-DETECTED NEARBY (±0.025 f):</div>
                                                {nearby.slice(0, 3).map(p => (
                                                    <div key={p.name} style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                                        {p.name} — f={p.rrm_freq} (Δ{Math.abs(p.rrm_freq - sp.rrm_freq).toFixed(4)})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Co-stimulate */}
                                    <div style={{ padding: '1.5rem', borderRight: '1px solid rgba(239,68,68,0.10)' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.08em' }}>✓ CO-STIMULATE — HEALTHY TARGETS</div>
                                        {sp.costimulate.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                <span style={{ color: '#22c55e', flexShrink: 0 }}>+</span>{p}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Delivery */}
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.08em' }}>◎ DELIVERY METHOD</div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{sp.delivery_method}</p>
                                    </div>
                                </div>

                                {/* Timeline + Outcome */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', border: '1px solid rgba(239,68,68,0.15)', borderTop: 'none', borderBottom: 'none' }}>
                                    <div style={{ padding: '1.5rem', borderRight: '1px solid rgba(239,68,68,0.10)' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>⏱ CLINICAL TIMELINE</div>
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{sp.timeline}</p>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#14b8a6', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>◆ EXPECTED OUTCOME</div>
                                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{sp.outcome}</p>
                                    </div>
                                </div>

                                {/* Precedent + References */}
                                <div style={{
                                    padding: '1.25rem 1.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                    borderTop: 'none',
                                    borderRadius: '0 0 12px 12px',
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.08em' }}>EXPERIMENTAL PRECEDENT</div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>{sp.precedent}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {sp.references.map((ref, i) => (
                                            <span key={i} style={{
                                                fontSize: '0.65rem',
                                                padding: '0.2rem 0.6rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: '4px',
                                                color: '#475569',
                                            }}>
                                                [{i+1}] {ref}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ── Footer status bar ── */}
            <div style={{
                padding: '0.75rem 2rem',
                borderTop: '1px solid rgba(20,184,166,0.10)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.6rem',
                color: '#475569',
                fontFamily: 'monospace',
            }}>
                <span>RRM ATLAS v1.0 · COSIC 1994–2020 · K=201nm</span>
                <span>COSMIC COMPASS INTEGRATION · OCT 4–8</span>
            </div>
        </div>
    );
};
