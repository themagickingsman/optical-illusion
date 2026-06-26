import { SolarSystemBody } from '../recursion_levels';
import { Units } from './unit_converter';

/**
 * GALACTIC CATALOG (OCTAVES 12-14)
 * 
 * Defines the empirical bounds of the local interstellar neighborhood, galaxies, and superclusters.
 * Distances are originally recorded in Lightyears (ly) or Parsecs (pc)
 * but are strictly passed through the `Units` converter to become Astronomical Units (AU).
 * 
 * This enables the UI's `UnifiedCosmicCatalog` to overlay these facts
 * onto the mathematically generated cosmic nodes.
 */

export const GALACTIC_CATALOG: SolarSystemBody[] = [
    // ── LOCAL INTERSTELLAR (10 - 10,000 Lightyears) ──
    { 
        name: 'Oort Cloud Outer Edge', 
        semi_major_axis_au: Units.fromLightYears(1.58), 
        type: 'Star', 
        source: 'Interstellar Reference' 
    },
    { 
        name: 'Sirius (Brightest Star)', 
        semi_major_axis_au: Units.fromLightYears(8.6), 
        type: 'Star', 
        source: 'Hipparcos' 
    },
    { 
        name: 'Pleiades Star Cluster', 
        semi_major_axis_au: Units.fromLightYears(444), 
        type: 'Star Cluster', 
        source: 'Hipparcos' 
    },
    { 
        name: 'Orion Nebula', 
        semi_major_axis_au: Units.fromLightYears(1344), 
        type: 'Nebula', 
        source: 'Galactic Reference' 
    },

    // ── MILKY WAY SCALES (10,000 - 100,000 Lightyears) ──
    { 
        name: 'Distance to Galactic Center', 
        semi_major_axis_au: Units.fromLightYears(26000), 
        type: 'Star', 
        source: 'Galactic Reference' 
    },
    { 
        name: 'Milky Way Diameter', 
        semi_major_axis_au: Units.fromLightYears(105700), 
        type: 'Star', 
        source: 'Galactic Reference' 
    },
    { 
        name: 'Large Magellanic Cloud (LMC)', 
        semi_major_axis_au: Units.fromLightYears(163000), 
        type: 'Star', 
        source: 'Galactic Reference' 
    },

    // ── LOCAL GROUP (1 - 10 Million Lightyears) ──
    { 
        name: 'Andromeda Galaxy (M31)', 
        semi_major_axis_au: Units.fromLightYears(2537000), 
        type: 'Star', 
        source: 'Cosmological Reference' 
    },
    { 
        name: 'Triangulum Galaxy (M33)', 
        semi_major_axis_au: Units.fromLightYears(2730000), 
        type: 'Star', 
        source: 'Cosmological Reference' 
    },

    // ── SUPERCLUSTERS (> 10 Million Lightyears) ──
    { 
        name: 'Virgo Cluster Center', 
        semi_major_axis_au: Units.fromLightYears(53800000), 
        type: 'Star', 
        source: 'Cosmological Reference' 
    },
    { 
        name: 'Laniakea Supercluster Diameter', 
        semi_major_axis_au: Units.fromLightYears(520000000), 
        type: 'Star', 
        source: 'Cosmological Reference' 
    },
    { 
        name: 'Cosmic Microwave Background (CMB)', 
        semi_major_axis_au: Units.fromLightYears(46500000000), 
        type: 'Star', 
        source: 'Cosmological Reference' 
    },

    // ── THE ZODIAC CONSTELLATIONS (Anchored by Brightest Stars, 30 - 600 Lightyears) ──
    { name: 'Constellation Gemini', semi_major_axis_au: Units.fromLightYears(34), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Capricornus', semi_major_axis_au: Units.fromLightYears(39), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Taurus', semi_major_axis_au: Units.fromLightYears(65), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Aries', semi_major_axis_au: Units.fromLightYears(66), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Leo', semi_major_axis_au: Units.fromLightYears(79), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Pisces', semi_major_axis_au: Units.fromLightYears(139), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Sagittarius', semi_major_axis_au: Units.fromLightYears(143), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Libra', semi_major_axis_au: Units.fromLightYears(185), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Virgo', semi_major_axis_au: Units.fromLightYears(250), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Cancer', semi_major_axis_au: Units.fromLightYears(290), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Aquarius', semi_major_axis_au: Units.fromLightYears(540), type: 'Star', source: 'Astronomical Reference' },
    { name: 'Constellation Scorpio', semi_major_axis_au: Units.fromLightYears(550), type: 'Star', source: 'Astronomical Reference' },
    
    // ═════════════════════════════════════════════════════════════════
    // OCTAVE 5 RANGE: ~221,598 – 17,674,717 AU (1.07 – 85.7 pc)
    // Domain: Nearest Stars / Local Stellar Neighborhood
    // Sources: Hipparcos (van Leeuwen 2007), Gaia DR3 (2022)
    // All distances converted: 1 parsec = 206,265 AU
    // Precision: parallax-based, errors < 1% for nearest stars
    // ═════════════════════════════════════════════════════════════════

    // ── NEAREST STARS (< 5 pc) ──
    { name: 'Proxima Centauri', semi_major_axis_au: 268270, type: 'Star', distance_pc: 1.3009, spectral_type: 'M5.5V', discoverer: 'Innes', year_discovered: 1915, source: 'Gaia DR3' },
    { name: 'Alpha Centauri A', semi_major_axis_au: 274788, type: 'Star', distance_pc: 1.3325, spectral_type: 'G2V', source: 'Hipparcos' },
    { name: 'Alpha Centauri B', semi_major_axis_au: 274788, type: 'Star', distance_pc: 1.3325, spectral_type: 'K1V', source: 'Hipparcos' },
    { name: 'Barnards Star', semi_major_axis_au: 377023, type: 'Star', distance_pc: 1.8282, spectral_type: 'M4V', discoverer: 'Barnard', year_discovered: 1916, source: 'Gaia DR3' },
    { name: 'Wolf 359', semi_major_axis_au: 492130, type: 'Star', distance_pc: 2.386, spectral_type: 'M6.5V', discoverer: 'Wolf', year_discovered: 1919, source: 'Gaia DR3' },
    { name: 'Lalande 21185', semi_major_axis_au: 525119, type: 'Star', distance_pc: 2.5459, spectral_type: 'M2V', discoverer: 'Lalande', year_discovered: 1801, source: 'Hipparcos' },
    { name: 'Sirius A', semi_major_axis_au: 543919, type: 'Star', distance_pc: 2.637, spectral_type: 'A1V', source: 'Hipparcos' },
    { name: 'Sirius B', semi_major_axis_au: 543919, type: 'Star', distance_pc: 2.637, spectral_type: 'DA2', source: 'Hipparcos' },
    { name: 'Luyten 726-8 A', semi_major_axis_au: 552374, type: 'Star', distance_pc: 2.678, spectral_type: 'M5.5V', source: 'Gaia DR3' },
    { name: 'UV Ceti', semi_major_axis_au: 552374, type: 'Star', distance_pc: 2.678, spectral_type: 'M6V', source: 'Gaia DR3' },
    { name: 'Ross 154', semi_major_axis_au: 613019, type: 'Star', distance_pc: 2.972, spectral_type: 'M3.5V', discoverer: 'Ross', year_discovered: 1925, source: 'Gaia DR3' },
    { name: 'Ross 248', semi_major_axis_au: 651797, type: 'Star', distance_pc: 3.160, spectral_type: 'M5.5V', discoverer: 'Ross', year_discovered: 1926, source: 'Gaia DR3' },
    { name: 'Epsilon Eridani', semi_major_axis_au: 662581, type: 'Star', distance_pc: 3.2123, spectral_type: 'K2V', source: 'Hipparcos' },
    { name: 'Lacaille 9352', semi_major_axis_au: 676810, type: 'Star', distance_pc: 3.281, spectral_type: 'M1V', discoverer: 'Lacaille', year_discovered: 1752, source: 'Hipparcos' },
    { name: 'Ross 128', semi_major_axis_au: 696192, type: 'Star', distance_pc: 3.375, spectral_type: 'M4V', discoverer: 'Ross', year_discovered: 1926, source: 'Gaia DR3' },
    { name: 'EZ Aquarii', semi_major_axis_au: 711834, type: 'Star', distance_pc: 3.451, spectral_type: 'M5V', source: 'Gaia DR3' },
    { name: 'Procyon A', semi_major_axis_au: 723552, type: 'Star', distance_pc: 3.508, spectral_type: 'F5IV-V', source: 'Hipparcos' },
    { name: '61 Cygni A', semi_major_axis_au: 721070, type: 'Star', distance_pc: 3.495, spectral_type: 'K5V', discoverer: 'Bessel', year_discovered: 1838, source: 'Hipparcos' },
    { name: '61 Cygni B', semi_major_axis_au: 721070, type: 'Star', distance_pc: 3.495, spectral_type: 'K7V', source: 'Hipparcos' },
    { name: 'Epsilon Indi A', semi_major_axis_au: 750540, type: 'Star', distance_pc: 3.639, spectral_type: 'K5V', source: 'Hipparcos' },
    { name: 'Tau Ceti', semi_major_axis_au: 752867, type: 'Star', distance_pc: 3.650, spectral_type: 'G8.5V', source: 'Hipparcos' },
    { name: 'Luytens Star', semi_major_axis_au: 767181, type: 'Star', distance_pc: 3.719, spectral_type: 'M3.5V', source: 'Gaia DR3' },
    { name: 'Kapteyns Star', semi_major_axis_au: 809978, type: 'Star', distance_pc: 3.927, spectral_type: 'M1V', discoverer: 'Kapteyn', year_discovered: 1898, source: 'Hipparcos' },
    { name: 'Lacaille 8760', semi_major_axis_au: 818871, type: 'Star', distance_pc: 3.970, spectral_type: 'M0V', discoverer: 'Lacaille', year_discovered: 1752, source: 'Hipparcos' },
    { name: 'Kruger 60 A', semi_major_axis_au: 825060, type: 'Star', distance_pc: 4.000, spectral_type: 'M3V', source: 'Hipparcos' },

    // ── NEARBY BRIGHT STARS (5 – 25 pc) ──
    { name: 'Groombridge 1618', semi_major_axis_au: 1008635, type: 'Star', distance_pc: 4.890, spectral_type: 'K7V', source: 'Hipparcos' },
    { name: '40 Eridani A', semi_major_axis_au: 1039575, type: 'Star', distance_pc: 5.040, spectral_type: 'K1V', source: 'Hipparcos' },
    { name: 'Altair', semi_major_axis_au: 1058139, type: 'Star', distance_pc: 5.130, spectral_type: 'A7V', source: 'Hipparcos' },
    { name: '70 Ophiuchi A', semi_major_axis_au: 1049890, type: 'Binary Star', distance_pc: 5.090, spectral_type: 'K0V', source: 'Hipparcos' },
    { name: 'Eta Cassiopeiae A', semi_major_axis_au: 1229339, type: 'Binary Star', distance_pc: 5.960, spectral_type: 'G0V', source: 'Hipparcos' },
    { name: '82 Eridani', semi_major_axis_au: 1247903, type: 'Star', distance_pc: 6.050, spectral_type: 'G8V', source: 'Hipparcos' },
    { name: 'Delta Pavonis', semi_major_axis_au: 1259453, type: 'Star', distance_pc: 6.106, spectral_type: 'G8IV', source: 'Hipparcos' },
    { name: 'Fomalhaut', semi_major_axis_au: 1588874, type: 'Star', distance_pc: 7.704, spectral_type: 'A3V', source: 'Hipparcos' },
    { name: 'Vega', semi_major_axis_au: 1584114, type: 'Star', distance_pc: 7.680, spectral_type: 'A0V', source: 'Hipparcos' },
    { name: 'Denebola', semi_major_axis_au: 2268915, type: 'Star', distance_pc: 11.00, spectral_type: 'A3V', source: 'Hipparcos' },
    { name: 'Pollux', semi_major_axis_au: 2136905, type: 'Star', distance_pc: 10.36, spectral_type: 'K0III', source: 'Hipparcos' },
    { name: 'Arcturus', semi_major_axis_au: 2322543, type: 'Star', distance_pc: 11.26, spectral_type: 'K1.5III', source: 'Hipparcos' },
    { name: 'Capella A', semi_major_axis_au: 2689734, type: 'Star', distance_pc: 13.04, spectral_type: 'G8III', source: 'Hipparcos' },
    { name: 'Castor', semi_major_axis_au: 3252839, type: 'Star', distance_pc: 15.77, spectral_type: 'A1V', source: 'Hipparcos' },
    { name: 'Aldebaran', semi_major_axis_au: 4213972, type: 'Star', distance_pc: 20.43, spectral_type: 'K5III', source: 'Hipparcos' },
    { name: 'Regulus', semi_major_axis_au: 4900897, type: 'Star', distance_pc: 23.76, spectral_type: 'B7V', source: 'Hipparcos' },
    { name: 'Mizar A', semi_major_axis_au: 5063906, type: 'Binary Star', distance_pc: 24.55, spectral_type: 'A2V', source: 'Hipparcos' },

    // ── INTERMEDIATE STARS (25 – 86 pc, upper O5 range) ──
    { name: 'Algol', semi_major_axis_au: 5945463, type: 'Star', distance_pc: 28.82, spectral_type: 'B8V', source: 'Hipparcos' },
    { name: 'Mirfak', semi_major_axis_au: 10725780, type: 'Star', distance_pc: 52.0, spectral_type: 'F5Ib', source: 'Hipparcos' },
    { name: 'Hyades Cluster', semi_major_axis_au: 9535055, type: 'Star Cluster', distance_pc: 46.24, year_discovered: -200, source: 'Hipparcos' },

    // ═════════════════════════════════════════════════════════════════
    // OCTAVE 6 RANGE: ~17,674,717 – 1,409,743,144 AU (85.7 – 6,835 pc)
    // Domain: Bright Stars, Star Clusters, Nebulae
    // Sources: Hipparcos, Gaia DR3, VLBI measurements
    // Note: Distance uncertainties increase significantly (>10%) for
    // objects beyond ~1,000 pc. Marked with measurement method.
    // ═════════════════════════════════════════════════════════════════

    // ── BRIGHT STARS (86 – 500 pc) ──
    { name: 'Spica', semi_major_axis_au: 16573266, type: 'Star', distance_pc: 80.35, spectral_type: 'B1V', source: 'Hipparcos' },
    { name: 'Bellatrix', semi_major_axis_au: 15882405, type: 'Star', distance_pc: 77.0, spectral_type: 'B2III', source: 'Hipparcos' },
    { name: 'Canopus', semi_major_axis_au: 19595175, type: 'Star', distance_pc: 95.0, spectral_type: 'A9II', source: 'Hipparcos' },
    { name: 'Polaris', semi_major_axis_au: 27433245, type: 'Star', distance_pc: 133.0, spectral_type: 'F7Ib', source: 'Hipparcos' },
    { name: 'Antares', semi_major_axis_au: 35065050, type: 'Binary Star', distance_pc: 170.0, spectral_type: 'M1Ib', source: 'Hipparcos' },
    { name: 'Betelgeuse', semi_major_axis_au: 41253000, type: 'Star', distance_pc: 200.0, spectral_type: 'M1Ia', source: 'Hipparcos' },
    { name: 'Alnitak', semi_major_axis_au: 46409625, type: 'Binary Star', distance_pc: 225.0, spectral_type: 'O9.5Ib', source: 'Hipparcos' },
    { name: 'Rigel', semi_major_axis_au: 54660225, type: 'Star', distance_pc: 265.0, spectral_type: 'B8Ia', source: 'Hipparcos' },
    { name: 'Mintaka', semi_major_axis_au: 78380700, type: 'Binary Star', distance_pc: 380.0, spectral_type: 'O9.5II', source: 'Hipparcos' },
    { name: 'Alnilam', semi_major_axis_au: 84774915, type: 'Star', distance_pc: 411.0, spectral_type: 'B0Ia', source: 'Hipparcos' },
    { name: 'Naos', semi_major_axis_au: 94881900, type: 'Star', distance_pc: 460.0, spectral_type: 'O5Iaf', source: 'Hipparcos' },

    // ── STAR CLUSTERS & NEBULAE (100 – 2,500 pc) ──
    { name: 'Pleiades (M45)', semi_major_axis_au: 28093293, type: 'Star', distance_pc: 136.2, source: 'Hipparcos' },
    { name: 'Praesepe (M44)', semi_major_axis_au: 38573570, type: 'Star', distance_pc: 187.0, source: 'Hipparcos' },
    { name: 'Orion Nebula (M42)', semi_major_axis_au: 84981180, type: 'Star', distance_pc: 412.0, source: 'VLBI' },
    { name: 'Deneb', semi_major_axis_au: 165424530, type: 'Star', distance_pc: 802.0, spectral_type: 'A2Ia', source: 'Hipparcos' },
    { name: 'NGC 3532', semi_major_axis_au: 99824460, type: 'Star Cluster', distance_pc: 484.0, source: 'Gaia DR3' },
    { name: 'Crab Nebula (M1)', semi_major_axis_au: 412530000, type: 'Star', distance_pc: 2000.0, year_discovered: 1054, source: 'VLBI' },
    { name: 'Eagle Nebula (M16)', semi_major_axis_au: 412530000, type: 'Star', distance_pc: 2000.0, source: 'Gaia DR3' },
    { name: 'Carina Nebula', semi_major_axis_au: 474409500, type: 'Star', distance_pc: 2300.0, source: 'Gaia DR3' },

    // ── DISTANT OBJECTS (2,500 – 6,800 pc, outer O6 range) ──
    { name: 'Eta Carinae', semi_major_axis_au: 474409500, type: 'Star', distance_pc: 2300.0, spectral_type: 'LBV', source: 'Gaia DR3' },
    { name: 'Vela Pulsar', semi_major_axis_au: 59816850, type: 'Star', distance_pc: 290.0, source: 'VLBI' },
    { name: 'Cygnus X-1', semi_major_axis_au: 371277000, type: 'Star', distance_pc: 1800.0, spectral_type: 'O9.7Iab', source: 'VLBI' },
];
