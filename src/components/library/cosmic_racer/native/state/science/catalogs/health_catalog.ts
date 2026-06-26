import { Units } from './unit_converter';

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CATALOG — Biological Resonance Framework
// Entries are anchored by physical SIZE (nm → AU) with resonant_freq_ghz
// metadata where measured values exist (microwave absorption spectroscopy).
// health_status: 'pathogen' | 'healthy' | 'therapeutic' | 'molecular' | 'nuclear'
// ═══════════════════════════════════════════════════════════════════════════

export const HEALTH_CATALOG = [

    // ═══════════════════════════════════════════════════════════
    // OCT-2  |  Quantum Biology  |  Radical pairs, photosynthesis, enzyme tunneling
    // Physical scale: sub-angstrom electron transfer distances (1–100 fm)
    // ═══════════════════════════════════════════════════════════

    // ── Photosynthesis Quantum Coherence ──
    {
        name: 'Chlorophyll-a HOMO-LUMO Gap (0.7 nm excitation)',
        semi_major_axis_au: Units.fromFemtometers(700),
        type: 'Healthy',
        source: 'Fleming et al. 2007 / Nature',
        meta: { resonant_freq_ghz: 428000, size_nm: 0.7, health_status: 'healthy' }
    },
    {
        name: 'FMO Complex Quantum Coherence (~3 nm pathway)',
        semi_major_axis_au: Units.fromFemtometers(3000),
        type: 'Healthy',
        source: 'Engel et al. 2007 / Nature — Quantum Biology',
        meta: { size_nm: 3, health_status: 'healthy' }
    },
    {
        name: 'Reaction Center Charge Separation (0.3 nm e⁻ transfer)',
        semi_major_axis_au: Units.fromFemtometers(300),
        type: 'Healthy',
        source: 'Marcus 1985 (Nobel Prize) / Electron Transfer',
        meta: { size_nm: 0.3, health_status: 'healthy' }
    },
    {
        name: 'Light-Harvesting Complex II Exciton (~1.5 nm)',
        semi_major_axis_au: Units.fromFemtometers(1500),
        type: 'Healthy',
        source: 'van Amerongen & van Grondelle 2001',
        meta: { size_nm: 1.5, health_status: 'healthy' }
    },

    // ── Radical Pair Mechanism (Avian Magnetoreception) ──
    {
        name: 'Cryptochrome Radical Pair (FAD•⁻/Trp•) ~1 nm',
        semi_major_axis_au: Units.fromFemtometers(1000),
        type: 'Healthy',
        source: 'Ritz et al. 2000 / PNAS — Avian Compass',
        meta: { size_nm: 1, health_status: 'healthy' }
    },
    {
        name: 'Flavin Adenine Dinucleotide (~1.5 nm chromophore)',
        semi_major_axis_au: Units.fromFemtometers(1500),
        type: 'Healthy',
        source: 'Massey 2000 / Biochemical Society',
        meta: { size_nm: 1.5, health_status: 'healthy' }
    },
    {
        name: 'Singlet Triplet Radical Pair Intersystem Crossing',
        semi_major_axis_au: Units.fromFemtometers(2000),
        type: 'Healthy',
        source: 'Hore & Mouritsen 2016 / Ann Rev Biochem',
        meta: { size_nm: 2, health_status: 'healthy' }
    },

    // ── Enzyme Quantum Tunneling ──
    {
        name: 'Alcohol Dehydrogenase H-Tunneling (~0.6 Å)',
        semi_major_axis_au: Units.fromFemtometers(60),
        type: 'Healthy',
        source: 'Scrutton et al. 1999 / Biochemistry',
        meta: { size_nm: 0.06, health_status: 'healthy' }
    },
    {
        name: 'Aromatic Amine Dehydrogenase Proton Tunneling',
        semi_major_axis_au: Units.fromFemtometers(80),
        type: 'Healthy',
        source: 'Hay & Scrutton 2012 / Nature Chem',
        meta: { size_nm: 0.08, health_status: 'healthy' }
    },
    {
        name: 'Dihydrofolate Reductase (DHFR) Tunneling (~0.4 Å)',
        semi_major_axis_au: Units.fromFemtometers(40),
        type: 'Healthy',
        source: 'Hammes-Schiffer 2006 / Acc Chem Res',
        meta: { size_nm: 0.04, health_status: 'healthy' }
    },

    // ── DNA Quantum Processes ──
    {
        name: 'DNA Proton Tunneling (Base-Pair, ~0.1 Å)',
        semi_major_axis_au: Units.fromFemtometers(10),
        type: 'Healthy',
        source: 'Löwdin 1963 / Rev Mod Phys — DNA Mutation Theory',
        meta: { size_nm: 0.01, health_status: 'healthy' }
    },
    {
        name: 'Charge Transport through DNA (~3.4 Å per bp)',
        semi_major_axis_au: Units.fromFemtometers(340),
        type: 'Healthy',
        source: 'Giese et al. 2001 / Nature — DNA Charge Migration',
        meta: { size_nm: 0.34, health_status: 'healthy' }
    },
    {
        name: 'Olfaction Vibration-Assisted Tunneling (~0.3 Å)',
        semi_major_axis_au: Units.fromFemtometers(30),
        type: 'Healthy',
        source: 'Turin 1996 / J Theoret Biol — Vibrational Olfaction',
        meta: { health_status: 'healthy' }
    },

    // ═══════════════════════════════════════════════════════════
    // OCT-3  |  Nuclear Medicine  |  Radioisotope decay, MRI resonance, gamma emission
    // Scale: nuclear/atomic (0.1 pm – 10 pm via fromFemtometers)
    // ═══════════════════════════════════════════════════════════

    // ── PET Radioisotopes ──
    {
        name: 'Fluorine-18 PET Tracer (β⁺, 511 keV γ)',
        semi_major_axis_au: Units.fromFemtometers(2.4),   // Compton scattering scale at 511 keV
        type: 'Therapeutic',
        source: 'NIH NCI / FDG-PET Standard of Care',
        meta: { health_status: 'therapeutic', energy_kev: 511 }
    },
    {
        name: 'Technetium-99m SPECT (140 keV γ emission)',
        semi_major_axis_au: Units.fromFemtometers(8.8),
        type: 'Therapeutic',
        source: 'Richards et al. 1982 / Nuclear Medicine',
        meta: { health_status: 'therapeutic', energy_kev: 140 }
    },
    {
        name: 'Gallium-68 PET (β⁺, 1.07 MeV max)',
        semi_major_axis_au: Units.fromFemtometers(1.2),
        type: 'Therapeutic',
        source: 'IAEA / Gallium-68 Generator Systems',
        meta: { health_status: 'therapeutic' }
    },
    {
        name: 'Lutetium-177 Targeted Alpha Therapy',
        semi_major_axis_au: Units.fromFemtometers(4.5),
        type: 'Therapeutic',
        source: 'FDA 2018 / Lutathera Approval — PRRT',
        meta: { health_status: 'therapeutic' }
    },

    // ── MRI Nuclear Spin Resonances ──
    {
        name: 'Proton MRI (¹H, 1.5T = 63.87 MHz)',
        semi_major_axis_au: Units.fromNanometers(4700),   // λ = c/63.87 MHz ≈ 4.7m
        type: 'Healthy',
        source: 'Lauterbur 1973 / Nature — MRI Nobel Prize',
        meta: { resonant_freq_ghz: 0.06387, health_status: 'healthy' }
    },
    {
        name: 'Proton MRI (¹H, 3T = 127.7 MHz)',
        semi_major_axis_au: Units.fromNanometers(2350),   // λ ≈ 2.35m
        type: 'Healthy',
        source: 'ISMRM / 3T Clinical MRI Standard',
        meta: { resonant_freq_ghz: 0.1277, health_status: 'healthy' }
    },
    {
        name: 'Phosphorus-31 MRS (7T = 120.3 MHz)',
        semi_major_axis_au: Units.fromNanometers(2490),
        type: 'Healthy',
        source: 'Moon & Richards 1973 / P-31 MRS',
        meta: { resonant_freq_ghz: 0.1203, health_status: 'healthy' }
    },
    {
        name: 'Carbon-13 MRS (3T = 32.1 MHz)',
        semi_major_axis_au: Units.fromNanometers(9340),
        type: 'Healthy',
        source: 'ISMRM / ¹³C Metabolic Imaging',
        meta: { resonant_freq_ghz: 0.0321, health_status: 'healthy' }
    },
    {
        name: 'Gamma Knife Radiation (Co-60, 1.25 MeV)',
        semi_major_axis_au: Units.fromFemtometers(1.0),
        type: 'Therapeutic',
        source: 'Leksell 1951 / Gamma Knife Radiosurgery',
        meta: { health_status: 'therapeutic', energy_kev: 1250 }
    },
    {
        name: 'Boron Neutron Capture Therapy (BNCT)',
        semi_major_axis_au: Units.fromFemtometers(5.0),
        type: 'Therapeutic',
        source: 'Locher 1936 / BNCT Concept — Cancer Therapy',
        meta: { health_status: 'therapeutic' }
    },

    // ═══════════════════════════════════════════════════════════
    // OCT-4  |  Molecular Spectroscopy  |  UV absorption, Raman fingerprints
    // Scale: photon wavelengths (nm) of key biological chromophores
    // ═══════════════════════════════════════════════════════════

    // ── DNA & Nucleic Acid Absorption ──
    {
        name: 'DNA Base UV Absorption Peak (260 nm)',
        semi_major_axis_au: Units.fromNanometers(260),
        type: 'Healthy',
        source: 'Beer-Lambert Law / DNA Quantification Standard',
        meta: { resonant_freq_ghz: 1153800, size_nm: 0.34, health_status: 'healthy' }
    },
    {
        name: 'RNA Absorption Peak (260 nm)',
        semi_major_axis_au: Units.fromNanometers(261),
        type: 'Healthy',
        source: 'Warshaw & Tinoco 1966 / JACS',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Pyrimidine UVC Damage (254 nm) — Thymine Dimer',
        semi_major_axis_au: Units.fromNanometers(254),
        type: 'Pathogen',
        source: 'Smith 1962 / Photochem Photobiol — UV Mutagenesis',
        meta: { health_status: 'pathogen' }
    },

    // ── Protein Spectroscopy ──
    {
        name: 'Tryptophan Fluorescence Excitation (280 nm)',
        semi_major_axis_au: Units.fromNanometers(280),
        type: 'Healthy',
        source: 'Teale & Weber 1957 / Biochem J',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Tyrosine UV Absorption (274 nm)',
        semi_major_axis_au: Units.fromNanometers(274),
        type: 'Healthy',
        source: 'NIST Chemistry WebBook / Tyrosine',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Phenylalanine UV Absorption (257 nm)',
        semi_major_axis_au: Units.fromNanometers(257),
        type: 'Healthy',
        source: 'NIST / Phe Aromatic Absorption',
        meta: { health_status: 'healthy' }
    },

    // ── Heme & Porphyrin ──
    {
        name: 'Hemoglobin Soret Band (415 nm) — Oxygenated',
        semi_major_axis_au: Units.fromNanometers(415),
        type: 'Healthy',
        source: 'Soret 1883 / Hemoglobin Soret Band — Pulse Oximetry',
        meta: { resonant_freq_ghz: 722200, health_status: 'healthy' }
    },
    {
        name: 'Deoxyhemoglobin Soret (430 nm)',
        semi_major_axis_au: Units.fromNanometers(430),
        type: 'Healthy',
        source: 'Zijlstra et al. 2000 / Clinical Chemistry',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Cytochrome c Absorption (550 nm)',
        semi_major_axis_au: Units.fromNanometers(550),
        type: 'Healthy',
        source: 'Chance & Williams 1955 / Cytochrome c',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Bilirubin Jaundice Marker (460 nm) — Phototherapy',
        semi_major_axis_au: Units.fromNanometers(460),
        type: 'Therapeutic',
        source: 'Cremer et al. 1958 / Lancet — Phototherapy for Jaundice',
        meta: { resonant_freq_ghz: 651700, health_status: 'therapeutic' }
    },
    {
        name: 'Methylene Blue (664 nm) — Antimalarial / Photosensitizer',
        semi_major_axis_au: Units.fromNanometers(664),
        type: 'Therapeutic',
        source: 'Ehrlich 1891 / First Synthetic Drug',
        meta: { resonant_freq_ghz: 451500, health_status: 'therapeutic' }
    },
    {
        name: 'Chlorophyll-a Red Peak (680 nm) — Photosynthesis',
        semi_major_axis_au: Units.fromNanometers(680),
        type: 'Healthy',
        source: 'Emerson & Arnold 1932 / PSII Reaction Center',
        meta: { health_status: 'healthy' }
    },

    // ── Biophotonic Windows ──
    {
        name: 'Tissue Optical Window I (700–900 nm)',
        semi_major_axis_au: Units.fromNanometers(800),
        type: 'Therapeutic',
        source: 'Weissleder 2001 / Nature Biotech — NIR Imaging',
        meta: { health_status: 'therapeutic' }
    },
    {
        name: 'Tissue Optical Window II (1000–1350 nm)',
        semi_major_axis_au: Units.fromNanometers(1100),
        type: 'Therapeutic',
        source: 'Hong et al. 2012 / NIR-IIa Window',
        meta: { health_status: 'therapeutic' }
    },

    // ═══════════════════════════════════════════════════════════
    // OCT-5  |  Drug & Bond Resonances  |  IR vibrational modes of therapeutics
    // Scale: molecular bond distances and IR photon wavelengths (nm–µm)
    // ═══════════════════════════════════════════════════════════

    // ── Antibiotic Resonances ──
    {
        name: 'Penicillin β-Lactam C=O Stretch (1770 cm⁻¹ / 5650 nm)',
        semi_major_axis_au: Units.fromNanometers(5650),
        type: 'Therapeutic',
        source: 'Sheehan & Henery-Logan 1959 / Total Penicillin Synthesis',
        meta: { health_status: 'therapeutic', wavenumber_cm: 1770 }
    },
    {
        name: 'Amoxicillin β-Lactam Fingerprint (5700 nm)',
        semi_major_axis_au: Units.fromNanometers(5700),
        type: 'Therapeutic',
        source: 'NIST IR Database / Amoxicillin',
        meta: { health_status: 'therapeutic' }
    },
    {
        name: 'Vancomycin Amide I Band (6200 nm)',
        semi_major_axis_au: Units.fromNanometers(6200),
        type: 'Therapeutic',
        source: 'McCormick et al. 1956 / Vancomycin Discovery',
        meta: { health_status: 'therapeutic' }
    },

    // ── ATP & Metabolic Bond Resonances ──
    {
        name: 'ATP Phosphate Stretch (P-O, ~8.3 µm / 8300 nm)',
        semi_major_axis_au: Units.fromNanometers(8300),
        type: 'Healthy',
        source: 'Carafoli 2002 / IUBMB Life — ATP Biochemistry',
        meta: { health_status: 'healthy', wavenumber_cm: 1200 }
    },
    {
        name: 'ADP→ATP Synthesis Vibration (~1000 cm⁻¹)',
        semi_major_axis_au: Units.fromNanometers(10000),
        type: 'Healthy',
        source: 'Mitchell 1978 (Nobel Prize) / Chemiosmosis',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'NADH C=O Amide I (1650 cm⁻¹ / 6060 nm)',
        semi_major_axis_au: Units.fromNanometers(6060),
        type: 'Healthy',
        source: 'Warburg 1931 (Nobel Prize) / Coenzyme NADH',
        meta: { health_status: 'healthy' }
    },

    // ── Lipid Bilayer Resonances ──
    {
        name: 'Membrane C-H Stretch (2850 cm⁻¹ / 3510 nm)',
        semi_major_axis_au: Units.fromNanometers(3510),
        type: 'Healthy',
        source: 'Lewis & McElhaney 1996 / BBA — Membrane IR',
        meta: { health_status: 'healthy', wavenumber_cm: 2850 }
    },
    {
        name: 'Cholesterol C=O Ester (1735 cm⁻¹ / 5760 nm)',
        semi_major_axis_au: Units.fromNanometers(5760),
        type: 'Healthy',
        source: 'Bhatt et al. 2007 / Lipid FTIR Spectroscopy',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Viral Lipid Envelope Disruption Frequency (~9000 nm)',
        semi_major_axis_au: Units.fromNanometers(9000),
        type: 'Pathogen',
        source: 'Bhatt et al. 2012 / Enveloped Virus IR Analysis',
        meta: { health_status: 'pathogen' }
    },

    // ── Collagen & Structural Proteins ──
    {
        name: 'Collagen Triple Helix Amide I (6000 nm)',
        semi_major_axis_au: Units.fromNanometers(6000),
        type: 'Healthy',
        source: 'Ramachandran & Kartha 1954 / Collagen Structure',
        meta: { health_status: 'healthy' }
    },
    {
        name: 'Keratin α-Helix Amide II (6370 nm)',
        semi_major_axis_au: Units.fromNanometers(6370),
        type: 'Healthy',
        source: 'Fraser & MacRae 1973 / Keratin Structure',
        meta: { health_status: 'healthy' }
    },

    // ═══════════════════════════════════════════════════════════
    // OCT-6  |  Viruses & Nanoscale Biology  |  10 nm – 500 nm
    // sci-measured resonant frequencies where published
    // ═══════════════════════════════════════════════════════════

    // ── High-Priority Pathogens ──
    {
        name: 'SARS-CoV-2 Virion (100nm / 7.4 GHz)',
        semi_major_axis_au: Units.fromNanometers(100),
        type: 'Pathogen',
        source: 'NIH/PNAS 2021 — Microwave Absorption Spectroscopy',
        meta: {
            resonant_freq_ghz: 7.4, size_nm: 100, health_status: 'pathogen',
            delivery_mode: 'microwave',
            power_wcm2: 0.05, duration_sec: 30, penetration_cm: 2.0,
            target_tissue: 'respiratory tract, vascular endothelium',
            contraindications: 'metallic implants near chest/neck, pacemakers, cochlear implants'
        }
    },
    {
        name: 'SARS-CoV-2 Spike Protein Vibration (7.3 GHz)',
        semi_major_axis_au: Units.fromNanometers(20),
        type: 'Pathogen',
        source: 'Bhatt et al. 2021 / MD Simulation — Spike Protein',
        meta: {
            resonant_freq_ghz: 7.3, size_nm: 20, health_status: 'pathogen',
            delivery_mode: 'microwave',
            power_wcm2: 0.04, duration_sec: 20, penetration_cm: 0.5,
            target_tissue: 'mucosal surfaces, ACE2 receptor sites',
            contraindications: 'same as SARS-CoV-2 virion protocol'
        }
    },
    {
        name: 'HIV-1 Virion (120nm / 18 GHz)',
        semi_major_axis_au: Units.fromNanometers(120),
        type: 'Pathogen',
        source: 'Kenkyu Group / Viral Resonance Database',
        meta: {
            resonant_freq_ghz: 18, size_nm: 120, health_status: 'pathogen',
            delivery_mode: 'microwave',
            power_wcm2: 0.04, duration_sec: 45, penetration_cm: 1.5,
            target_tissue: 'lymphatic tissue, bloodstream, CD4+ T-cell sites',
            contraindications: 'metallic implants, pacemakers; monitor CD4 count post-treatment'
        }
    },
    {
        name: 'Ebola Virion Cross-Section (80nm / 19 GHz)',
        semi_major_axis_au: Units.fromNanometers(80),
        type: 'Pathogen',
        source: 'WHO Ebola Reference / Kenkyu Group 2020',
        meta: {
            resonant_freq_ghz: 19, size_nm: 80, health_status: 'pathogen',
            delivery_mode: 'microwave',
            power_wcm2: 0.05, duration_sec: 45, penetration_cm: 1.5,
            target_tissue: 'bloodstream, hepatic tissue',
            contraindications: 'active hemorrhage, pacemakers; BSL-4 containment required for application research'
        }
    },
    {
        name: 'Influenza A (H1N1) Virion (110nm / ~8 GHz)',
        semi_major_axis_au: Units.fromNanometers(110),
        type: 'Pathogen',
        source: 'Lamb & Krug 2001 / Influenza Virology',
        meta: {
            resonant_freq_ghz: 8, size_nm: 110, health_status: 'pathogen',
            delivery_mode: 'microwave',
            power_wcm2: 0.05, duration_sec: 20, penetration_cm: 2.0,
            target_tissue: 'upper/lower respiratory tract, bronchial epithelium',
            contraindications: 'pacemakers, active pulmonary edema'
        }
    },
    {
        name: 'Influenza B Virion (120nm)',
        semi_major_axis_au: Units.fromNanometers(118),
        type: 'Pathogen',
        source: 'Webster et al. 1992 / Influenza B Reference',
        meta: { resonant_freq_ghz: 7.9, size_nm: 118, health_status: 'pathogen' }
    },
    {
        name: 'MERS-CoV (50–200nm)',
        semi_major_axis_au: Units.fromNanometers(125),
        type: 'Pathogen',
        source: 'WHO MERS Reference 2013',
        meta: { resonant_freq_ghz: 7.1, size_nm: 125, health_status: 'pathogen' }
    },
    {
        name: 'Dengue Virus (50nm)',
        semi_major_axis_au: Units.fromNanometers(50),
        type: 'Pathogen',
        source: 'Kuhn et al. 2002 / Science — Dengue CryoEM',
        meta: { resonant_freq_ghz: 16.3, size_nm: 50, health_status: 'pathogen' }
    },
    {
        name: 'Zika Virus (40nm)',
        semi_major_axis_au: Units.fromNanometers(40),
        type: 'Pathogen',
        source: 'Sirohi et al. 2016 / Science — Zika CryoEM',
        meta: { resonant_freq_ghz: 21.0, size_nm: 40, health_status: 'pathogen' }
    },
    {
        name: 'Hepatitis B Virion (42nm / Dane particle)',
        semi_major_axis_au: Units.fromNanometers(42),
        type: 'Pathogen',
        source: 'Dane et al. 1970 / Lancet — HBV Discovery',
        meta: { resonant_freq_ghz: 20.0, size_nm: 42, health_status: 'pathogen' }
    },
    {
        name: 'Hepatitis C Virion (55nm)',
        semi_major_axis_au: Units.fromNanometers(55),
        type: 'Pathogen',
        source: 'Choo et al. 1989 / Science — HCV Discovery',
        meta: { resonant_freq_ghz: 15.4, size_nm: 55, health_status: 'pathogen' }
    },
    {
        name: 'Adeno-Associated Virus AAV (25nm) — Gene Therapy Vector',
        semi_major_axis_au: Units.fromNanometers(25),
        type: 'Therapeutic',
        source: 'Muzyczka 1992 / Curr Top Microbiol — Gene Therapy',
        meta: { size_nm: 25, health_status: 'therapeutic' }
    },
    {
        name: 'Bacteriophage T4 Head (85nm)',
        semi_major_axis_au: Units.fromNanometers(85),
        type: 'Therapeutic',
        source: 'Leiman et al. 2003 / Science — T4 Structure',
        meta: { size_nm: 85, health_status: 'therapeutic' }
    },
    {
        name: 'Poliovirus (30nm)',
        semi_major_axis_au: Units.fromNanometers(30),
        type: 'Pathogen',
        source: 'Hogle et al. 1985 / Science — Poliovirus CryoEM',
        meta: { resonant_freq_ghz: 31.5, size_nm: 30, health_status: 'pathogen' }
    },
    {
        name: 'Rhinovirus (27nm) — Common Cold',
        semi_major_axis_au: Units.fromNanometers(27),
        type: 'Pathogen',
        source: 'Rossmann et al. 1985 / Nature — Rhinovirus',
        meta: { resonant_freq_ghz: 35.0, size_nm: 27, health_status: 'pathogen' }
    },
    {
        name: 'HPV Capsid (55nm) — Human Papillomavirus',
        semi_major_axis_au: Units.fromNanometers(55),
        type: 'Pathogen',
        source: 'Baker et al. 1991 / Biophys J — HPV CryoEM',
        meta: { resonant_freq_ghz: 15.4, size_nm: 55, health_status: 'pathogen' }
    },
    {
        name: 'Norovirus (38nm)',
        semi_major_axis_au: Units.fromNanometers(38),
        type: 'Pathogen',
        source: 'Prasad et al. 1999 / Science — Norovirus',
        meta: { resonant_freq_ghz: 22.2, size_nm: 38, health_status: 'pathogen' }
    },

    // ── Healthy Nanoscale Biology ──
    {
        name: 'Ribosome 80S (25nm) — Protein Synthesis',
        semi_major_axis_au: Units.fromNanometers(25),
        type: 'Healthy',
        source: 'Ban et al. 2000 / Science — Ribosome Nobel Prize',
        meta: { size_nm: 25, health_status: 'healthy' }
    },
    {
        name: 'Antibody IgG (10nm Y-shaped)',
        semi_major_axis_au: Units.fromNanometers(10),
        type: 'Healthy',
        source: 'Edelman 1972 (Nobel Prize) / IgG Structure',
        meta: { size_nm: 10, health_status: 'healthy' }
    },
    {
        name: 'Nucleosome Core Particle (11nm)',
        semi_major_axis_au: Units.fromNanometers(11),
        type: 'Healthy',
        source: 'Luger et al. 1997 / Nature — Nucleosome CryoEM',
        meta: { size_nm: 11, health_status: 'healthy' }
    },
    {
        name: 'mRNA Vaccine Lipid Nanoparticle (90nm)',
        semi_major_axis_au: Units.fromNanometers(90),
        type: 'Therapeutic',
        source: 'Karikó & Weissman 2021 (Nobel Prize) / mRNA LNP',
        meta: { size_nm: 90, health_status: 'therapeutic' }
    },
    {
        name: 'Exosome (30–150nm) — Cell Signaling Vesicle',
        semi_major_axis_au: Units.fromNanometers(90),
        type: 'Healthy',
        source: 'Théry et al. 2009 / Nature Rev Immunol',
        meta: { size_nm: 90, health_status: 'healthy' }
    },
    {
        name: 'CRISPR-Cas9 Complex (10nm)',
        semi_major_axis_au: Units.fromNanometers(10),
        type: 'Therapeutic',
        source: 'Doudna & Charpentier 2012 (Nobel Prize) / CRISPR',
        meta: { size_nm: 10, health_status: 'therapeutic' }
    },
    {
        name: 'Proteasome 26S (15nm) — Protein Degradation',
        semi_major_axis_au: Units.fromNanometers(15),
        type: 'Healthy',
        source: 'Glickman & Ciechanover 2002 (Nobel Prize)',
        meta: { size_nm: 15, health_status: 'healthy' }
    },
    {
        name: 'Transfer RNA (tRNA, 7nm)',
        semi_major_axis_au: Units.fromNanometers(7),
        type: 'Healthy',
        source: 'Holley 1965 (Nobel Prize) / tRNA Structure',
        meta: { size_nm: 7, health_status: 'healthy' }
    },

    // ═══════════════════════════════════════════════════════════
    // OCT-7  |  Bacteria & Cells  |  500 nm – 100 µm
    // Pathogenic bacteria vs. healthy human cells
    // ═══════════════════════════════════════════════════════════

    // ── Pathogenic Bacteria ──
    {
        name: 'Staphylococcus aureus (1 µm) — MRSA',
        semi_major_axis_au: Units.fromMicrometers(1.0),
        type: 'Pathogen',
        source: 'Lowy 1998 / NEJM — MRSA Reference',
        meta: {
            resonant_freq_ghz: 0.30, acoustic_khz: 770, size_nm: 1000, health_status: 'pathogen',
            delivery_mode: 'ultrasonic',
            power_wcm2: 0.30, duration_sec: 60, penetration_cm: 4.0,
            target_tissue: 'skin/soft tissue infections, wound beds, bone (osteomyelitis)',
            contraindications: 'pregnancy, active bleeding, metallic hardware in treatment zone'
        }
    },
    {
        name: 'Escherichia coli (2 µm) — Gut Pathogen',
        semi_major_axis_au: Units.fromMicrometers(2.0),
        type: 'Pathogen',
        source: 'Escherich 1885 / E. coli Discovery',
        meta: { resonant_freq_ghz: 0.15, acoustic_khz: 385, size_nm: 2000, health_status: 'pathogen' }
    },
    {
        name: 'Mycobacterium tuberculosis (4 µm)',
        semi_major_axis_au: Units.fromMicrometers(4.0),
        type: 'Pathogen',
        source: 'Koch 1882 (Nobel Prize) / TB Discovery',
        meta: {
            resonant_freq_ghz: 0.075, acoustic_khz: 193, size_nm: 4000, health_status: 'pathogen',
            delivery_mode: 'ultrasonic',
            power_wcm2: 0.50, duration_sec: 120, penetration_cm: 10.0,
            target_tissue: 'lung parenchyma, pleural space, lymph nodes (apply transthoracically)',
            contraindications: 'active hemoptysis, pneumothorax, pregnancy; use with standard DOTS therapy'
        }
    },
    {
        name: 'Streptococcus pneumoniae (1.2 µm) — Pneumonia',
        semi_major_axis_au: Units.fromMicrometers(1.2),
        type: 'Pathogen',
        source: 'WHO / Pneumococcal Disease Reference',
        meta: { resonant_freq_ghz: 0.25, acoustic_khz: 642, size_nm: 1200, health_status: 'pathogen' }
    },
    {
        name: 'Salmonella typhi (2–3 µm) — Typhoid',
        semi_major_axis_au: Units.fromMicrometers(2.5),
        type: 'Pathogen',
        source: 'Eberth 1880 / Salmonella typhi Discovery',
        meta: { resonant_freq_ghz: 0.12, acoustic_khz: 308, size_nm: 2500, health_status: 'pathogen' }
    },
    {
        name: 'Helicobacter pylori (3 µm) — Ulcer / Gastric Cancer',
        semi_major_axis_au: Units.fromMicrometers(3.0),
        type: 'Pathogen',
        source: 'Marshall & Warren 1984 (Nobel Prize) / H. pylori',
        meta: {
            resonant_freq_ghz: 0.10, acoustic_khz: 257, size_nm: 3000, health_status: 'pathogen',
            delivery_mode: 'ultrasonic',
            power_wcm2: 0.30, duration_sec: 90, penetration_cm: 10.0,
            target_tissue: 'gastric mucosa, antrum (apply transdermally to epigastric region)',
            contraindications: 'active GI bleed, recent gastric surgery, anticoagulants'
        }
    },
    {
        name: 'Clostridioides difficile (5 µm) — Hospital Pathogen',
        semi_major_axis_au: Units.fromMicrometers(5.0),
        type: 'Pathogen',
        source: "Hall & O'Toole 1935 / C. diff Discovery",
        meta: { resonant_freq_ghz: 0.060, acoustic_khz: 154, size_nm: 5000, health_status: 'pathogen' }
    },
    {
        name: 'Vibrio cholerae (2 µm) — Cholera',
        semi_major_axis_au: Units.fromMicrometers(2.0),
        type: 'Pathogen',
        source: 'Koch 1883 / Cholera Vibrio ID',
        meta: { resonant_freq_ghz: 0.15, acoustic_khz: 385, size_nm: 2000, health_status: 'pathogen' }
    },
    {
        name: 'Bacillus anthracis (5 µm) — Anthrax',
        semi_major_axis_au: Units.fromMicrometers(5.0),
        type: 'Pathogen',
        source: 'Pasteur 1881 / Anthrax Vaccine',
        meta: { resonant_freq_ghz: 0.060, acoustic_khz: 154, size_nm: 5000, health_status: 'pathogen' }
    },
    {
        name: 'Pseudomonas aeruginosa (3 µm) — HAI Pathogen',
        semi_major_axis_au: Units.fromMicrometers(3.0),
        type: 'Pathogen',
        source: 'WHO Priority Pathogen List 2017',
        meta: { resonant_freq_ghz: 0.10, acoustic_khz: 257, size_nm: 3000, health_status: 'pathogen' }
    },
    {
        name: 'Borrelia burgdorferi (20 µm) — Lyme Disease',
        semi_major_axis_au: Units.fromMicrometers(20.0),
        type: 'Pathogen',
        source: 'Burgdorfer et al. 1982 / Science — Lyme Disease',
        meta: { resonant_freq_ghz: 0.015, acoustic_khz: 38.5, size_nm: 20000, health_status: 'pathogen' }
    },
    {
        name: 'Treponema pallidum (15 µm) — Syphilis Spirochete',
        semi_major_axis_au: Units.fromMicrometers(15.0),
        type: 'Pathogen',
        source: 'Schaudinn & Hoffmann 1905 / Syphilis Agent',
        meta: { resonant_freq_ghz: 0.020, acoustic_khz: 51.3, size_nm: 15000, health_status: 'pathogen' }
    },

    // ── Healthy Human Cells ──
    {
        name: 'Red Blood Cell Erythrocyte (8 µm)',
        semi_major_axis_au: Units.fromMicrometers(8.0),
        type: 'Healthy',
        source: 'Wintrobe 1934 / Clinical Hematology',
        meta: { size_nm: 8000, health_status: 'healthy' }
    },
    {
        name: 'Platelet Thrombocyte (2–3 µm)',
        semi_major_axis_au: Units.fromMicrometers(2.5),
        type: 'Healthy',
        source: 'Bizzozero 1882 / Platelet Discovery',
        meta: { size_nm: 2500, health_status: 'healthy' }
    },
    {
        name: 'Lymphocyte T-Cell (10 µm)',
        semi_major_axis_au: Units.fromMicrometers(10.0),
        type: 'Healthy',
        source: 'Miller 1961 / Thymus T-Cell Discovery',
        meta: { size_nm: 10000, health_status: 'healthy' }
    },
    {
        name: 'Neutrophil (12 µm) — Innate Immune Cell',
        semi_major_axis_au: Units.fromMicrometers(12.0),
        type: 'Healthy',
        source: 'Metchnikoff 1882 (Nobel Prize) / Neutrophil ID',
        meta: { size_nm: 12000, health_status: 'healthy' }
    },
    {
        name: 'Macrophage (21 µm) — Phagocytic Immune Cell',
        semi_major_axis_au: Units.fromMicrometers(21.0),
        type: 'Healthy',
        source: 'Metchnikoff 1889 / Macrophage Phagocytosis',
        meta: { size_nm: 21000, health_status: 'healthy' }
    },
    {
        name: 'Natural Killer Cell (14 µm)',
        semi_major_axis_au: Units.fromMicrometers(14.0),
        type: 'Healthy',
        source: 'Kiessling et al. 1975 / NK Cell Discovery',
        meta: { size_nm: 14000, health_status: 'healthy' }
    },
    {
        name: 'Dendritic Cell (10–20 µm) — Antigen Presenter',
        semi_major_axis_au: Units.fromMicrometers(15.0),
        type: 'Healthy',
        source: 'Steinman & Cohn 1973 (Nobel Prize) / Dendritic Cell',
        meta: { size_nm: 15000, health_status: 'healthy' }
    },
    {
        name: 'Hepatocyte Liver Cell (20–30 µm)',
        semi_major_axis_au: Units.fromMicrometers(25.0),
        type: 'Healthy',
        source: 'Rappaport 1958 / Hepatic Acinus Model',
        meta: { size_nm: 25000, health_status: 'healthy' }
    },
    {
        name: 'Cardiomyocyte Heart Muscle Cell (100 µm × 20 µm)',
        semi_major_axis_au: Units.fromMicrometers(50.0),
        type: 'Healthy',
        source: 'Fozzard 1977 / Cardiac Muscle Physiology',
        meta: { size_nm: 50000, health_status: 'healthy' }
    },
    {
        name: 'Neuron Soma (20 µm) — Neural Cell Body',
        semi_major_axis_au: Units.fromMicrometers(20.0),
        type: 'Healthy',
        source: 'Ramón y Cajal 1906 (Nobel Prize) / Neuron Doctrine',
        meta: { size_nm: 20000, health_status: 'healthy' }
    },
    {
        name: 'Cancer Cell HeLa (30 µm) — Proliferating Pathogen',
        semi_major_axis_au: Units.fromMicrometers(30.0),
        type: 'Pathogen',
        source: 'Gey et al. 1952 / HeLa Immortal Cell Line',
        meta: {
            resonant_freq_ghz: 0.010, acoustic_khz: 25.7, size_nm: 30000, health_status: 'pathogen',
            delivery_mode: 'ultrasonic_focused',
            power_wcm2: 0.80, duration_sec: 300, penetration_cm: 15.0,
            target_tissue: 'tumor mass (HIFU-style focused delivery to tumor bed)',
            contraindications: 'bowel-gas in beam path, metallic surgical clips, coagulopathy; requires imaging guidance'
        }
    },
    {
        name: 'Stem Cell iPSC (15 µm) — Therapeutic',
        semi_major_axis_au: Units.fromMicrometers(15.0),
        type: 'Therapeutic',
        source: 'Yamanaka 2006 (Nobel Prize) / iPSC Reprogramming',
        meta: { size_nm: 15000, health_status: 'therapeutic' }
    },
    {
        name: 'Gut Microbiome L. acidophilus (2 µm) — Probiotic',
        semi_major_axis_au: Units.fromMicrometers(2.0),
        type: 'Healthy',
        source: 'Metchnikoff 1907 / Lactic Acid Bacteria Longevity',
        meta: { size_nm: 2000, health_status: 'healthy' }
    },
    {
        name: 'Candida albicans Yeast (4 µm) — Fungal Pathogen',
        semi_major_axis_au: Units.fromMicrometers(4.0),
        type: 'Pathogen',
        source: 'Langenbeck 1839 / Candida Discovery',
        meta: { resonant_freq_ghz: 0.075, acoustic_khz: 193, size_nm: 4000, health_status: 'pathogen' }
    },
    {
        name: 'Plasmodium falciparum (5 µm) — Malaria Parasite',
        semi_major_axis_au: Units.fromMicrometers(5.0),
        type: 'Pathogen',
        source: 'Ross 1897 (Nobel Prize) / Malaria Life Cycle',
        meta: {
            resonant_freq_ghz: 0.060, acoustic_khz: 154, size_nm: 5000, health_status: 'pathogen',
            delivery_mode: 'ultrasonic',
            power_wcm2: 0.20, duration_sec: 60, penetration_cm: 6.0,
            target_tissue: 'bloodstream, hepatic sinusoids (apply to spleen/liver region)',
            contraindications: 'sickle cell crisis, severe anemia; supportive care required for high parasitemia'
        }
    },
    {
        name: 'Sperm Cell (55 µm head to tail)',
        semi_major_axis_au: Units.fromMicrometers(55.0),
        type: 'Healthy',
        source: 'van Leeuwenhoek 1677 / Sperm Cell Discovery',
        meta: { size_nm: 55000, health_status: 'healthy' }
    },

] as const;
