/**
 * Calculated Object Metadata Engine
 * Combines Cosmic Compass, Periodic Table, and physics formulas
 * to derive scientific properties for celestial objects
 */

import { COSMIC_COMPASS_DATA, CosmicCompassRow } from './CosmicCompassData';

// ============================================
// METADATA FIELD DESCRIPTIONS
// ============================================
export const FIELD_DESCRIPTIONS = {
  // Tier 1: Direct Derivations
  fieldMagnitude: "Gravity field scaling factor (K_L^G)",
  scalingRatio: "Ratio of gravity to frequency scaling",
  visibleSpectrum: "Harmonic wavelength in visible spectrum",
  precisionClass: "Framework prediction accuracy level",
  phaseState: "Physical state based on classical element",
  
  // Tier 2: Calculated Physics
  emFieldStrength: "Electromagnetic field intensity",
  schumannRatio: "Frequency ratio to Earth's resonance (7.83 Hz)",
  topologyClass: "Geometric dimensionality classification",
  dimensionalIndex: "Effective dimensional complexity (0-15)",
  bindingEnergy: "Approximate interaction energy scale",
  
  // Tier 3: Cross-Reference
  dominantElements: "Predicted elemental composition",
  atmospherePresent: "Ionospheric cavity prediction",
  matterPhase: "Predicted matter state at this level",
  compositionType: "Dominant bonding character",
  stabilityClass: "Framework stability prediction",
  
  // Tier 4: Predictions
  h2o: "Water presence likelihood",
  metals: "Metallic composition indicator",
  plasma: "Plasma state indicator",
  darkMatter: "Dark matter interaction predicted",
  consciousnessField: "Consciousness field resonance"
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================
export interface MetadataField {
  value: string | number | boolean;
  description: string;
}

export interface CalculatedMetadata {
  // Tier 1: Direct Derivations
  fieldMagnitude: MetadataField;
  scalingRatio: MetadataField;
  visibleSpectrum: MetadataField;
  precisionClass: MetadataField;
  phaseState: MetadataField;
  
  // Tier 2: Calculated Physics
  emFieldStrength: MetadataField;
  schumannRatio: MetadataField;
  topologyClass: MetadataField;
  dimensionalIndex: MetadataField;
  
  // Tier 3: Cross-Reference Predictions
  dominantElements: MetadataField;
  atmospherePresent: MetadataField;
  matterPhase: MetadataField;
  compositionType: MetadataField;
  stabilityClass: MetadataField;
  
  // Tier 4: Predictions
  predictions: {
    h2o: MetadataField;
    metals: MetadataField;
    plasma: MetadataField;
    darkMatter: MetadataField;
    consciousnessField: MetadataField;
  };
  
  // Source data reference
  sourceRow: CosmicCompassRow | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse scientific notation string to number
 * e.g. "1.11×10¹⁸" → 1.11e18
 */
function parseScientificNotation(str: string): number {
  if (!str || str === 'N/A') return 0;
  
  // Replace unicode superscripts
  const superscriptMap: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-'
  };
  
  let normalized = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, c => superscriptMap[c] || c);
  normalized = normalized.replace('×10', 'e').replace(/\s/g, '');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Map classical element to phase state
 */
function elementToPhase(element: string): string {
  const phaseMap: Record<string, string> = {
    'Fire': 'Plasma',
    'Water': 'Liquid',
    'Air': 'Gas',
    'Earth': 'Solid',
    'Spirit/Ether': 'Field',
    'Aether': 'Field',
    '(The Father)': 'Unified'
  };
  return phaseMap[element] || 'Unknown';
}

/**
 * Map precision string to class
 * e.g. "±1e-15" → "Ultra-High"
 */
function precisionToClass(precision: string): string {
  if (!precision) return 'Unknown';
  const match = precision.match(/1e-(\d+)/);
  if (!match) return 'Unknown';
  
  const exponent = parseInt(match[1]);
  if (exponent >= 12) return 'Ultra-High';
  if (exponent >= 9) return 'High';
  if (exponent >= 6) return 'Medium';
  return 'Low';
}

/**
 * Map wavelength to color name
 */
function wavelengthToColor(wavelength: string): string {
  const nm = parseInt(wavelength.replace(/[^0-9]/g, ''));
  if (nm < 400) return `Ultraviolet (${wavelength})`;
  if (nm < 450) return `Violet (${wavelength})`;
  if (nm < 500) return `Blue (${wavelength})`;
  if (nm < 550) return `Cyan (${wavelength})`;
  if (nm < 600) return `Green (${wavelength})`;
  if (nm < 650) return `Yellow (${wavelength})`;
  if (nm < 700) return `Orange (${wavelength})`;
  return `Red (${wavelength})`;
}

/**
 * Topological invariants calculated from level and geometry
 * Returns rich mathematical properties including:
 * - Euler characteristic (χ)
 * - Betti numbers (b₀, b₁, b₂)
 * - Genus (g)
 * - Fundamental group classification
 * - Curvature type (K)
 * - Manifold class
 */
interface TopologyInvariants {
  dimension: number;
  euler: number;       // Euler characteristic χ
  betti: [number, number, number]; // b₀, b₁, b₂
  genus: number;       // g for surfaces
  pi1: string;         // Fundamental group π₁
  curvature: string;   // Gaussian curvature sign
  manifoldClass: string;
  compactness: string;
}

function calculateTopologyInvariants(level: number, geometry: string): TopologyInvariants {
  // Dimension derived from geometry pattern or level
  let dim = 0;
  if (geometry.includes('0D') || geometry === 'Point') dim = 0;
  else if (geometry.includes('1D') || geometry.includes('Line') || geometry.includes('String')) dim = 1;
  else if (geometry.includes('2D') || geometry.includes('Circle') || geometry.includes('Triangle') || geometry.includes('Pentagon') || geometry.includes('Hexagon')) dim = 2;
  else if (geometry.includes('3D') || geometry.includes('Tetra') || geometry.includes('Cube') || geometry.includes('Octa') || geometry.includes('Dodeca') || geometry.includes('Icosa') || geometry.includes('Sphere')) dim = 3;
  else if (geometry.includes('4D') || geometry.includes('Tesseract') || geometry.includes('Hypercube')) dim = 4;
  else if (level >= 110) dim = 5;
  else dim = Math.min(Math.floor(level / 20) + 1, 5);
  
  // Calculate Euler characteristic based on geometry
  // Point: χ=1, Circle: χ=0, Sphere: χ=2, Torus: χ=0, Projective plane: χ=1
  let euler = 1; // Default for point-like
  let betti: [number, number, number] = [1, 0, 0];
  let genus = 0;
  let pi1 = 'trivial';
  let curvature = 'K=0 (flat)';
  let manifoldClass = 'CW⁰';
  let compactness = 'compact';
  
  if (level === 0) {
    // Singularity - point topology
    euler = 1;
    betti = [1, 0, 0];
    pi1 = '{e}';
    curvature = 'K→∞ (singular)';
    manifoldClass = 'CW⁰ (0-cell)';
  } else if (level <= 2) {
    // String/loop topology  
    euler = 0;
    betti = [1, 1, 0];
    pi1 = 'ℤ (loop)';
    curvature = 'K=0 (flat)';
    manifoldClass = 'S¹ (circle)';
  } else if (level <= 5) {
    // Multi-loop/torus-like
    genus = Math.floor((level - 2) / 3) + 1;
    euler = 2 - 2 * genus;
    betti = [1, 2 * genus, 1];
    pi1 = `ℤ²${genus > 1 ? ` (g=${genus})` : ''}`;
    curvature = genus === 1 ? 'K=0 (flat)' : 'K<0 (hyperbolic)';
    manifoldClass = `Σ_${genus} (genus-${genus})`;
  } else if (level <= 20) {
    // 2D compact surfaces
    const complexity = Math.floor((level - 5) / 5);
    genus = complexity;
    euler = 2 - 2 * genus;
    betti = [1, 2 * genus, 1];
    pi1 = genus === 0 ? '{e}' : `π₁ = ⟨a,b|aba⁻¹b⁻¹⟩${genus > 1 ? `^${genus}` : ''}`;
    curvature = genus === 0 ? 'K>0 (spherical)' : genus === 1 ? 'K=0 (flat)' : 'K<0 (hyperbolic)';
    manifoldClass = genus === 0 ? 'S² (sphere)' : `T²#...#T² (${genus}-torus)`;
  } else if (level <= 60) {
    // 3D manifolds
    const complexity = Math.floor((level - 20) / 10);
    euler = 0; // 3-manifolds have χ=0
    betti = [1, complexity, complexity, 1] as unknown as [number, number, number];
    pi1 = complexity === 0 ? '{e}' : complexity <= 2 ? `ℤ^${complexity}` : `π₁ (rank ${complexity})`;
    curvature = level <= 40 ? 'K>0 (positive Ricci)' : 'K≈0 (Ricci flat)';
    manifoldClass = level <= 40 ? 'S³ or lens space' : 'T³ or Nil/Sol';
    compactness = 'compact orientable';
  } else if (level <= 90) {
    // 4D manifolds (Calabi-Yau candidates)
    const b2 = 2 + Math.floor((level - 60) / 5);
    euler = 2 + 2 * b2; // Simplified: χ = 2 + 2b₂ for simply connected 4-folds
    betti = [1, 0, b2];
    pi1 = '{e} (simply connected)';
    curvature = 'Kähler (c₁=0)';
    manifoldClass = `CY⁴ (b₂=${b2})`;
    compactness = 'compact Kähler';
  } else if (level <= 110) {
    // Higher-dimensional (Calabi-Yau 5-folds, G2 manifolds)
    const hodge = level - 100;
    euler = 24 + 4 * hodge; // Varies with Hodge numbers
    betti = [1, 0, hodge + 10];
    pi1 = '{e}';
    curvature = level <= 105 ? 'CY metric (Ric=0)' : 'G₂ holonomy';
    manifoldClass = level <= 105 ? `CY⁵ (h¹¹=${hodge})` : `G₂ manifold`;
    compactness = 'compact special holonomy';
  } else {
    // Ultimate unified (M-theory regime)
    euler = 48; // M-theory compactification
    betti = [1, 0, 22]; // K3 × CY₃ signature
    pi1 = '{e} (unified)';
    curvature = 'Ric(g)=0 (vacuum)';
    manifoldClass = 'M-theory bulk (11D)';
    compactness = 'compact × non-compact';
  }
  
  return { dimension: dim, euler, betti, genus, pi1, curvature, manifoldClass, compactness };
}

/**
 * Format topology for display with rich mathematical content
 */
function levelToTopology(level: number, geometry: string): string {
  const topo = calculateTopologyInvariants(level, geometry);
  return `${topo.dimension}D | χ=${topo.euler} | b=(${topo.betti.join(',')}) | ${topo.pi1}`;
}

/**
 * Get full topology object for detailed display
 */
export function getTopologyDetails(level: number, geometry: string): TopologyInvariants {
  return calculateTopologyInvariants(level, geometry);
}

/**
 * Calculate Schumann ratio
 */
function calculateSchumannRatio(freq: number): string {
  const ratio = freq / 7.83;
  if (ratio < 1) return `${ratio.toFixed(2)}x below Schumann`;
  if (ratio === 1) return 'At Schumann resonance';
  return `${ratio.toFixed(2)}x above Schumann`;
}

/**
 * Determine dominant elements by level
 */
function getDominantElements(level: number, smParticles: string): string {
  if (level === 0) return 'Gravitons';
  if (level <= 2) return 'e⁺e⁻, Quarks, Gluons';
  if (level <= 10) return 'p, n, Electrons';
  if (level <= 40) return 'H, C, N, O (Organic)';
  if (level <= 60) return 'Cells, Neurons';
  if (level <= 80) return 'H₂O, O₂, N₂, CO₂';
  if (level <= 100) return 'Planets, Stars';
  return 'Galaxies, Dark Matter';
}

/**
 * Determine composition type
 */
function getCompositionType(smForces: string, level: number): string {
  if (smForces.includes('Gravity')) return 'Gravitational';
  if (smForces.includes('QED') || smForces.includes('EM')) return 'Electromagnetic';
  if (smForces.includes('QCD')) return 'Strong Nuclear';
  if (smForces.includes('Van der Waals') || smForces.includes('Hydrogen')) return 'Molecular';
  if (smForces.includes('Biochemical') || smForces.includes('Neural')) return 'Biological';
  if (smForces.includes('Schumann')) return 'Planetary Field';
  if (smForces.includes('Hubble')) return 'Cosmological';
  return 'Mixed';
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate comprehensive metadata for an object based on its level
 * Works with or without a source row - derives data from level if needed
 */
export function calculateObjectMetadata(level: number): CalculatedMetadata {
  // Find the corresponding Cosmic Compass row
  const row = COSMIC_COMPASS_DATA.find(r => r.level === level);
  
  // Derive geometry from level if no row
  const geometry = row?.geometry || deriveGeometry(level);
  const element = row?.element || deriveElement(level);
  const smParticles = row?.sm_particles || deriveSMParticles(level);
  const smForces = row?.sm_forces || deriveSMForces(level);
  const consciousnessState = row?.consciousness_state || 'Emergent';
  
  // Calculate frequency from level using Φ scaling: f = 7.83 * Φ^(level - 80)/10
  const phi = 1.618033988749895;
  const freqHz = row ? (parseFloat(row.freq_new_derived) || 0) : 7.83 * Math.pow(phi, (level - 80) / 10);
  
  // Tier 1: Direct Derivations
  const fieldMag = row?.gravity_scaling_KLG || calculateFieldMagnitude(level);
  const scalingRat = row?.ratio_KLG_KL || calculateScalingRatio(level);
  const visSpectrum = row ? wavelengthToColor(row.visible_wavelength_nm) : calculateVisibleSpectrum(level);
  const precClass = row ? precisionToClass(row.precision_metric) : derivePrecisionClass(level);
  const phase = elementToPhase(element);
  
  // Tier 2: Calculated Physics
  const fieldMagNum = parseScientificNotation(fieldMag);
  const emStrength = fieldMagNum > 0 
    ? `${(fieldMagNum * 1/137).toExponential(2)} (α·K_L^G)` 
    : calculateEMFromLevel(level);
  const schumannRat = calculateSchumannRatio(freqHz);
  const topology = levelToTopology(level, geometry);
  const dimIndex = row ? Math.log10(parseScientificNotation(scalingRat) || 1) : (level / 10);
  
  // Tier 3: Cross-Reference
  const dominantElem = getDominantElements(level, smParticles);
  const hasAtmosphere = level === 80 || (level >= 70 && level <= 90);
  const matterPh = phase === 'Unknown' ? consciousnessState : phase;
  const compType = getCompositionType(smForces, level);
  const stability = level <= 90 ? 'Stable' : level <= 110 ? 'Quasi-stable' : 'Unified';
  
  // Tier 4: Predictions
  const h2oPred = element === 'Water' || level >= 70;
  const metalPred = level >= 11 && level <= 90;
  const plasmaPred = element === 'Fire' || level <= 2 || level >= 100;
  const dmPred = level >= 12;
  const consPred = level >= 80 || consciousnessState.toLowerCase().includes('conscious');
  
  return {
    // Tier 1
    fieldMagnitude: { value: fieldMag || 'N/A', description: FIELD_DESCRIPTIONS.fieldMagnitude },
    scalingRatio: { value: scalingRat || 'N/A', description: FIELD_DESCRIPTIONS.scalingRatio },
    visibleSpectrum: { value: visSpectrum, description: FIELD_DESCRIPTIONS.visibleSpectrum },
    precisionClass: { value: precClass, description: FIELD_DESCRIPTIONS.precisionClass },
    phaseState: { value: phase, description: FIELD_DESCRIPTIONS.phaseState },
    
    // Tier 2
    emFieldStrength: { value: emStrength, description: FIELD_DESCRIPTIONS.emFieldStrength },
    schumannRatio: { value: schumannRat, description: FIELD_DESCRIPTIONS.schumannRatio },
    topologyClass: { value: topology, description: FIELD_DESCRIPTIONS.topologyClass },
    dimensionalIndex: { value: dimIndex.toFixed(1), description: FIELD_DESCRIPTIONS.dimensionalIndex },
    
    // Tier 3
    dominantElements: { value: dominantElem, description: FIELD_DESCRIPTIONS.dominantElements },
    atmospherePresent: { value: hasAtmosphere ? 'Yes (Ionosphere)' : 'No', description: FIELD_DESCRIPTIONS.atmospherePresent },
    matterPhase: { value: matterPh, description: FIELD_DESCRIPTIONS.matterPhase },
    compositionType: { value: compType, description: FIELD_DESCRIPTIONS.compositionType },
    stabilityClass: { value: stability, description: FIELD_DESCRIPTIONS.stabilityClass },
    
    // Tier 4
    predictions: {
      h2o: { value: h2oPred, description: FIELD_DESCRIPTIONS.h2o },
      metals: { value: metalPred, description: FIELD_DESCRIPTIONS.metals },
      plasma: { value: plasmaPred, description: FIELD_DESCRIPTIONS.plasma },
      darkMatter: { value: dmPred, description: FIELD_DESCRIPTIONS.darkMatter },
      consciousnessField: { value: consPred, description: FIELD_DESCRIPTIONS.consciousnessField }
    },
    
    sourceRow: row || null
  };
}

// ============================================
// FALLBACK DERIVATION FUNCTIONS
// ============================================

function deriveGeometry(level: number): string {
  if (level === 0) return 'Point (0D)';
  if (level <= 2) return 'Circle (1D)';
  if (level <= 5) return 'Triangle (2D)';
  if (level <= 20) return 'Pentagon (2D)';
  if (level <= 40) return 'Tetrahedron (3D)';
  if (level <= 60) return 'Cube (3D)';
  if (level <= 80) return 'Dodecahedron (3D)';
  if (level <= 100) return 'Icosahedron (3D)';
  return 'Hypercube (4D)';
}

function deriveElement(level: number): string {
  if (level <= 20) return 'Fire';
  if (level <= 40) return 'Air';
  if (level <= 60) return 'Water';
  if (level <= 80) return 'Earth';
  if (level <= 100) return 'Spirit/Ether';
  return 'Aether';
}

function deriveSMParticles(level: number): string {
  if (level === 0) return 'Graviton';
  if (level <= 2) return 'Quarks, Gluons';
  if (level <= 10) return 'Leptons';
  if (level <= 40) return 'Hadrons';
  if (level <= 80) return 'Atoms, Molecules';
  return 'Composite Systems';
}

function deriveSMForces(level: number): string {
  if (level === 0) return 'Gravity';
  if (level <= 2) return 'QCD Strong';
  if (level <= 20) return 'Electroweak';
  if (level <= 60) return 'EM + Chemical';
  if (level <= 80) return 'Schumann + Biochemical';
  return 'Gravitational';
}

function calculateFieldMagnitude(level: number): string {
  // K_L^G = Φ^(L/10) relative to Schumann base
  const phi = 1.618033988749895;
  const klg = Math.pow(phi, (level - 80) / 10);
  if (klg > 1e10) return klg.toExponential(2);
  if (klg < 1e-10) return klg.toExponential(2);
  return klg.toPrecision(4);
}

function calculateScalingRatio(level: number): string {
  // Ratio of gravity to frequency scaling
  const phi = 1.618033988749895;
  const ratio = Math.pow(phi, level / 5);
  return ratio.toExponential(2);
}

function calculateVisibleSpectrum(level: number): string {
  // Map level to visible wavelength (380-700nm)
  const minNm = 380;
  const maxNm = 700;
  const nm = minNm + ((level % 15) / 15) * (maxNm - minNm);
  return wavelengthToColor(`${Math.round(nm)}nm`);
}

function derivePrecisionClass(level: number): string {
  if (level <= 10) return 'Ultra-High';
  if (level <= 40) return 'High';
  if (level <= 80) return 'Medium';
  return 'Empirical';
}

function calculateEMFromLevel(level: number): string {
  // EM field from level: α × Φ^level
  const phi = 1.618033988749895;
  const alpha = 1/137.036;
  const em = alpha * Math.pow(phi, (level - 80) / 10);
  return `${em.toExponential(2)} (derived)`; 
}

/**
 * Create empty metadata structure with descriptions
 */
function createEmptyMetadata(): CalculatedMetadata {
  return {
    fieldMagnitude: { value: 'N/A', description: FIELD_DESCRIPTIONS.fieldMagnitude },
    scalingRatio: { value: 'N/A', description: FIELD_DESCRIPTIONS.scalingRatio },
    visibleSpectrum: { value: 'N/A', description: FIELD_DESCRIPTIONS.visibleSpectrum },
    precisionClass: { value: 'N/A', description: FIELD_DESCRIPTIONS.precisionClass },
    phaseState: { value: 'N/A', description: FIELD_DESCRIPTIONS.phaseState },
    emFieldStrength: { value: 'N/A', description: FIELD_DESCRIPTIONS.emFieldStrength },
    schumannRatio: { value: 'N/A', description: FIELD_DESCRIPTIONS.schumannRatio },
    topologyClass: { value: 'N/A', description: FIELD_DESCRIPTIONS.topologyClass },
    dimensionalIndex: { value: 'N/A', description: FIELD_DESCRIPTIONS.dimensionalIndex },
    dominantElements: { value: 'N/A', description: FIELD_DESCRIPTIONS.dominantElements },
    atmospherePresent: { value: 'N/A', description: FIELD_DESCRIPTIONS.atmospherePresent },
    matterPhase: { value: 'N/A', description: FIELD_DESCRIPTIONS.matterPhase },
    compositionType: { value: 'N/A', description: FIELD_DESCRIPTIONS.compositionType },
    stabilityClass: { value: 'N/A', description: FIELD_DESCRIPTIONS.stabilityClass },
    predictions: {
      h2o: { value: false, description: FIELD_DESCRIPTIONS.h2o },
      metals: { value: false, description: FIELD_DESCRIPTIONS.metals },
      plasma: { value: false, description: FIELD_DESCRIPTIONS.plasma },
      darkMatter: { value: false, description: FIELD_DESCRIPTIONS.darkMatter },
      consciousnessField: { value: false, description: FIELD_DESCRIPTIONS.consciousnessField }
    },
    sourceRow: null
  };
}

/**
 * React component helper: Render a metadata field with value and description
 */
export function MetadataFieldDisplay({ 
  label, 
  field,
  color = '#f8fafc'
}: { 
  label: string; 
  field: MetadataField;
  color?: string;
}) {
  return (
    <div style={{ marginBottom: '0.25rem' }}>
      <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color }}>{String(field.value)}</div>
      <div style={{ fontSize: '0.55rem', color: '#475569', fontStyle: 'italic' }}>{field.description}</div>
    </div>
  );
}
