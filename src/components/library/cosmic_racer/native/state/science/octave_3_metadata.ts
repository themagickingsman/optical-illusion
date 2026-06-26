/**
 * Octave 3 Galactic Object Metadata
 * Sacred Geometry Verified Framework
 * 
 * Contains rich information for each φ-power level including:
 * - Object classification and description
 * - Sacred geometry mapping
 * - Distance and alignment data
 * - Physical properties
 */

export interface Octave3Object {
  level: number;           // UI level (0, 1, 5, 10, etc.)
  name: string;            // Display name
  phi_power: number;       // φ exponent
  type: 'star' | 'cluster' | 'nebula' | 'globular' | 'galaxy' | 'core' | 'gap';
  subtype: string;         // More specific classification
  plain_english: string;   // Human-readable description
  sacred_shape: string;    // Associated sacred geometry
  element?: string;        // Classical element (if applicable)
  expected_pc: number;     // Expected distance in parsecs
  expected_ly: number;     // Expected distance in light-years
  actual_pc?: number;      // Actual distance (if verified)
  alignment?: number;      // Alignment percentage (if verified)
  composition?: string;    // What it's made of
  size?: string;           // Physical size
  notable?: string;        // Notable features
  gap_info?: {             // For gaps only
    transition: string;    // What transition this gap represents
    search_range: string;  // Search range in pc
  };
}

export const OCTAVE_3_METADATA: Record<number, Octave3Object> = {
  // Level 0: φ⁰ (Unity Point) - 1.0 pc
  0: {
    level: 0,
    name: "New Object Found (φ⁰)",
    phi_power: 0,
    type: 'gap',
    subtype: 'Unity Gap',
    plain_english: "The fundamental unit distance - one parsec from Earth. No prominent star verified at this exact position.",
    sacred_shape: "Point",
    element: "Void",
    expected_pc: 1.000,
    expected_ly: 3.262,
    gap_info: {
      transition: "Base → Nearest Stars",
      search_range: "0.95 - 1.05 pc"
    }
  },

  // Level 1: φ¹ (Golden Ratio) - 1.618 pc
  1: {
    level: 1,
    name: "New Object Found (φ¹)",
    phi_power: 1,
    type: 'gap',
    subtype: 'Golden Gap',
    plain_english: "First golden ratio step outward. Proxima Centauri (1.30 pc) is nearby but doesn't align precisely.",
    sacred_shape: "Line",
    element: "Ether",
    expected_pc: 1.618,
    expected_ly: 5.277,
    gap_info: {
      transition: "Nearest → Binary Systems",
      search_range: "1.54 - 1.70 pc"
    }
  },

  // Level 5: φ² (Golden Rectangle) - 2.618 pc - SIRIUS ✓
  5: {
    level: 5,
    name: "Sirius",
    phi_power: 2,
    type: 'star',
    subtype: 'Binary Star System',
    plain_english: "The brightest star in Earth's night sky. A hot blue-white star (Sirius A) with a white dwarf companion (Sirius B).",
    sacred_shape: "Golden Rectangle",
    expected_pc: 2.618,
    expected_ly: 8.536,
    actual_pc: 2.637,
    alignment: 99.3,
    composition: "Hydrogen/Helium fusion core",
    size: "1.71 solar radii",
    notable: "The 'Dog Star' - brightest in Canis Major"
  },

  // Level 10: φ⁴ (Tetrahedron) - 6.854 pc
  10: {
    level: 10,
    name: "New Object Found (φ⁴)",
    phi_power: 4,
    type: 'gap',
    subtype: 'Tetrahedron Gap',
    plain_english: "Sacred fire threshold. The simplest 3D form marks the edge of the immediate stellar neighborhood.",
    sacred_shape: "Tetrahedron",
    element: "Fire",
    expected_pc: 6.854,
    expected_ly: 22.354,
    gap_info: {
      transition: "Nearby Stars → Extended Neighborhood",
      search_range: "6.51 - 7.20 pc"
    }
  },

  // Level 20: φ⁵ (Pentagon) - 11.09 pc - ARCTURUS ✓
  20: {
    level: 20,
    name: "Arcturus",
    phi_power: 5,
    type: 'star',
    subtype: 'Red Giant',
    plain_english: "Fourth brightest star in the night sky. An aging giant star that has exhausted its hydrogen and expanded enormously.",
    sacred_shape: "Pentagon",
    element: "Life",
    expected_pc: 11.090,
    expected_ly: 36.173,
    actual_pc: 11.26,
    alignment: 98.5,
    composition: "Helium fusion, metal-poor",
    size: "25.4 solar radii",
    notable: "Guardian of the Bear - brightest in Boötes"
  },

  // Level 30: φ⁸ (Octahedron) - 46.98 pc - HYADES ✓
  30: {
    level: 30,
    name: "Hyades Cluster",
    phi_power: 8,
    type: 'cluster',
    subtype: 'Open Star Cluster',
    plain_english: "The nearest open star cluster to Earth. A family of ~400 sibling stars born from the same molecular cloud 625 million years ago.",
    sacred_shape: "Octahedron",
    element: "Air",
    expected_pc: 46.979,
    expected_ly: 153.214,
    actual_pc: 46.34,
    alignment: 98.6,
    composition: "~400 stars, solar-type metallicity",
    size: "~33 light-years diameter",
    notable: "Double sacred point: Platonic (8) + Fibonacci (8)"
  },

  // Level 35: φ¹⁰ (Cross/Quaternary) - 85 pc - SOUTHERN CROSS ✓
  35: {
    level: 35,
    name: "Southern Cross\nCrux",
    phi_power: 10,
    type: 'cluster',
    subtype: 'Constellation Asterism',
    plain_english: "The Southern Cross - a circumpolar constellation of the Southern Hemisphere. Contains 5 bright stars spanning 27-109 parsecs. Visible from Egypt until ~1300 AD due to axial precession.",
    sacred_shape: "Cross / Quaternary",
    element: "Spirit",
    expected_pc: 122.99,  // φ¹⁰ exact
    expected_ly: 401.14,
    actual_pc: 85,  // Using Mimosa (β Crucis) as center reference
    alignment: 69.1,  // 85 / 122.99 = 69.1%
    composition: "5 main stars: Acrux (α, 99pc), Mimosa (β, 85pc), Gacrux (γ, 27pc), Imai (δ, 109pc), Ginan (ε, 69pc)",
    size: "~82 pc span from Gacrux to Imai",
    notable: "Navigation guide for Southern Hemisphere. Aligned with ancient sites (Giza, Meroe, Great Zimbabwe, Adams Calendar) when visible from Egypt ~3100 BC - 1300 AD"
  },

  // Level 40: φ¹² (Dodecahedron) - 322 pc - BETELGEUSE ✓
  40: {
    level: 40,
    name: "Betelgeuse",
    phi_power: 12,
    type: 'star',
    subtype: 'Red Supergiant',
    plain_english: "A dying massive star in Orion's shoulder. So large that if placed at the Sun's position, it would engulf Jupiter.",
    sacred_shape: "Dodecahedron",
    element: "Universe",
    expected_pc: 321.997,
    expected_ly: 1050.120,
    actual_pc: 200,
    alignment: 62.1, // Note: lower alignment, but closest major object
    composition: "Evolved supergiant, fusion of heavy elements",
    size: "~700-1000 solar radii (variable)",
    notable: "Future supernova candidate - will explode within 100,000 years"
  },

  // Level 50: φ¹³ (Fibonacci 13) - 521 pc - DENEB ✓
  50: {
    level: 50,
    name: "Deneb",
    phi_power: 13,
    type: 'star',
    subtype: 'Blue-White Supergiant',
    plain_english: "One of the most luminous stars known. Part of the Summer Triangle, it is the tail of Cygnus the Swan.",
    sacred_shape: "Fibonacci Spiral",
    expected_pc: 521.001,
    expected_ly: 1699.121,
    actual_pc: 802,
    alignment: 65.0, // Adjusted alignment
    composition: "Main sequence fusion, extremely massive",
    size: "~203 solar radii",
    notable: "~200,000× more luminous than the Sun"
  },

  // Level 60: φ¹⁶ (Tetrahedron²) - 2207 pc - CARINA ✓
  60: {
    level: 60,
    name: "Carina Nebula",
    phi_power: 16,
    type: 'nebula',
    subtype: 'Emission Nebula',
    plain_english: "A giant stellar nursery where new stars are being born. Contains Eta Carinae, one of the most massive stars known.",
    sacred_shape: "Nested Tetrahedron",
    expected_pc: 2206.999,
    expected_ly: 7197.602,
    actual_pc: 2300,
    alignment: 95.9,
    composition: "Hydrogen gas, dust, ~65 O-type stars",
    size: "~300 light-years diameter",
    notable: "Home to Eta Carinae - 4 million × Sun's luminosity"
  },

  // Level 70: φ²⁰ (Icosahedron) - 15127 pc
  70: {
    level: 70,
    name: "New Object Found (φ²⁰)",
    phi_power: 20,
    type: 'gap',
    subtype: 'Icosahedron Gap',
    plain_english: "Phase transition to extragalactic scale. Beyond the galactic core, before satellite galaxies begin.",
    sacred_shape: "Icosahedron",
    element: "Water",
    expected_pc: 15126.995,
    expected_ly: 49338.100,
    gap_info: {
      transition: "Galactic Core → Satellite Galaxies",
      search_range: "14,371 - 15,883 pc"
    }
  },

  // Level 80: φ²¹ (Fibonacci 21) - 24476 pc
  80: {
    level: 80,
    name: "New Object Found (φ²¹)",
    phi_power: 21,
    type: 'gap',
    subtype: 'Fibonacci Peak Gap',
    plain_english: "The 21st Fibonacci spiral step. Sagittarius Dwarf Galaxy (26 kpc) is close but at 94.1% alignment.",
    sacred_shape: "Spiral Peak",
    expected_pc: 24475.992,
    expected_ly: 79832.631,
    gap_info: {
      transition: "Inner Halo → Satellite Ring",
      search_range: "23,252 - 25,700 pc"
    }
  },

  // Level 90: φ²³ (Prime Emergence) - 64079 pc - SMC ✓
  90: {
    level: 90,
    name: "Small Magellanic Cloud",
    phi_power: 23,
    type: 'galaxy',
    subtype: 'Dwarf Irregular Galaxy',
    plain_english: "A nearby dwarf galaxy visible from the Southern Hemisphere. Orbiting the Milky Way and slowly being absorbed.",
    sacred_shape: "Prime Emergence",
    expected_pc: 64078.979,
    expected_ly: 209003.962,
    actual_pc: 64000,
    alignment: 99.9,
    composition: "~3 billion stars, gas-rich",
    size: "~7,000 light-years diameter",
    notable: "Highest alignment anchor (99.9%) - sacred φ²³ point"
  },

  // Level 100: φ²⁶ (Galaxy Gate) - 271443 pc
  100: {
    level: 100,
    name: "New Object Found (φ²⁶)",
    phi_power: 26,
    type: 'gap',
    subtype: 'Galaxy Gate Gap',
    plain_english: "Threshold to major galaxy scale. Andromeda (765 kpc) is beyond this point - a massive intergalactic void.",
    sacred_shape: "Galaxy Threshold",
    expected_pc: 271442.911,
    expected_ly: 885354.547,
    gap_info: {
      transition: "Satellite Galaxies → Major Galaxies",
      search_range: "257,871 - 285,015 pc"
    }
  },

  // Level 110: φ²⁷ (Outer Emergence) - 439204 pc
  110: {
    level: 110,
    name: "New Object Found (φ²⁷)",
    phi_power: 27,
    type: 'gap',
    subtype: 'Outer Emergence Gap',
    plain_english: "Edge of the Local Group. Major spiral galaxies like Andromeda and Triangulum lie beyond this boundary.",
    sacred_shape: "Expansion Threshold",
    expected_pc: 439203.856,
    expected_ly: 1432533.802,
    gap_info: {
      transition: "Local Group → Deep Space",
      search_range: "417,244 - 461,164 pc"
    }
  },

  // Level 111: φ∞ (Infinite) - Observable Universe
  111: {
    level: 111,
    name: "Observable Universe",
    phi_power: Infinity,
    type: 'gap',
    subtype: 'Cosmological Horizon',
    plain_english: "The edge of all that can ever be observed. Light from beyond this boundary will never reach us due to cosmic expansion.",
    sacred_shape: "Infinite Unity",
    element: "All",
    expected_pc: Infinity,
    expected_ly: Infinity,
    notable: "~46.5 billion light-years to cosmic horizon"
  }
};

/**
 * Get metadata for an Octave 3 object by UI level
 */
export function getOctave3Metadata(level: number): Octave3Object | undefined {
  return OCTAVE_3_METADATA[level];
}

/**
 * Format metadata for compact display (info bar)
 */
export function formatOctave3Info(level: number): string {
  const obj = OCTAVE_3_METADATA[level];
  if (!obj) return "Unknown object";
  
  const distStr = obj.actual_pc 
    ? `${obj.actual_pc.toLocaleString()} pc (${obj.alignment}% align)`
    : `~${obj.expected_pc.toLocaleString()} pc (predicted)`;
  
  const typeStr = obj.type === 'gap' 
    ? `GAP: ${obj.gap_info?.transition || 'Unknown transition'}`
    : `${obj.subtype}`;
  
  return `${obj.name} | ${typeStr} | ${distStr} | ${obj.sacred_shape}`;
}

/**
 * Get type icon for object
 */
export function getOctave3TypeIcon(level: number): string {
  const obj = OCTAVE_3_METADATA[level];
  if (!obj) return "❓";
  
  const icons: Record<string, string> = {
    star: "⭐",
    cluster: "✨",
    nebula: "🌫️",
    globular: "🔵",
    galaxy: "🌌",
    core: "⚫",
    gap: "📍"
  };
  
  return icons[obj.type] || "❓";
}
