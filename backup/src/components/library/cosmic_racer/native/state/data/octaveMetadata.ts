// Shared UI Metadata for Octaves (Ranges, Units, Colors)
// Source of truth for both Debug Page and Simulation

export const OCTAVE_UI_METADATA: Record<number, { range: string; unit: string }> = {
    0: { range: "Planck Scale (10⁻³⁵m)", unit: "ℓP" },
    1: { range: "10⁻³⁵m to 10⁻³⁰m", unit: "qm" },
    2: { range: "10⁻³⁰m to 10⁻¹⁵m", unit: "fm" },
    3: { range: "10⁻¹⁵m to 10⁻¹²m", unit: "pm" },
    4: { range: "10⁻¹²m to 10⁻¹⁰m", unit: "Å" },
    5: { range: "10⁻¹⁰m to 10⁻⁹m", unit: "nm" },
    6: { range: "Nanometer Scale", unit: "nm" },
    7: { range: "Micrometer Scale", unit: "μm" },
    8: { range: "Biological Scale", unit: "mm" },
    9: { range: "Human Scale", unit: "m" },
    10: { range: "Planetary Scale", unit: "km" },
    11: { range: "0.1 AU to 100 AU", unit: "AU" },
    12: { range: "100 AU to 100k LY", unit: "ly" },
    13: { range: "Intergalactic", unit: "Mpc" },
    14: { range: "Cosmic Scale", unit: "Gpc" }
};

import COSMIC_DATA from '../../config/cosmic_compass_data.json';

// Merge JSON Data with UI Metadata
export const SCALE_LABELS = COSMIC_DATA.map((data, index) => ({
    title: data.name.toUpperCase(),
    range: OCTAVE_UI_METADATA[index]?.range || data.notes || "Range Unknown",
    unit: OCTAVE_UI_METADATA[index]?.unit || "Units",
    color: data.hex
}));
