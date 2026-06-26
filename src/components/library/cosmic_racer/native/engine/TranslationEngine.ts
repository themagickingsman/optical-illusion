import { ArtifactCore } from "../data/types";

/**
 * THE TRANSLATION ENGINE
 * Converts raw ISBE-v8 Geometric Codes into Natural English Narratives.
 */
export class TranslationEngine {

    // 1. THE DICTIONARY (ISBE-v8 Mapping)
    private static CODE_MAP: Record<string, string> = {
        "STRUCTURAL_Y_AXIS": "Vertical Structural Alignment",
        "VECTOR_DELTA_WING": "Projective Flight Vector",
        "GRID_LOGIC_GATE": "Orthogonal Law/Grid Measurement",
        "SOURCE_SINGULARITY_NODE": "Source Energy Singularity",
        "WAVEFORM_ENERGY_OSCILLATION": "High-Frequency Energy Oscillation",
        "RESONANCE_VOID": "Unified Void State (Base-1)",
        "RESONANCE_DIMENSIONAL": "Toroidal Vortex Field (Base-9)",
        "RESONANCE_BIOLOGICAL": "Biological Life Sequence (Base-4)",
        "RESONANCE_ATOMIC": "Atomic Material Structure (Base-10)"
    };

    /**
     * Generates a "Plain English" summary of a collection of artifacts.
     */
    public static generatePageSummary(artifacts: ArtifactCore[]): { title: string, narrative: string, dominantTheme: string } {
        if (!artifacts || artifacts.length === 0) {
            return { title: "No Data", narrative: "No artifacts available for analysis.", dominantTheme: "None" };
        }

        // 1. FREQUENCY ANALYSIS
        const counts: Record<string, number> = {};
        const themes: Record<string, number> = {
            "STRUCTURE": 0,
            "ENERGY": 0,
            "LAW": 0,
            "VOID": 0
        };

        artifacts.forEach(a => {
            const code = a.procedure || "UNKNOWN";

            // Count raw codes
            counts[code] = (counts[code] || 0) + 1;

            // Map to Themes
            if (code.includes("STRUCTURAL") || code.includes("GRID")) themes["STRUCTURE"]++;
            if (code.includes("WAVE") || code.includes("VECTOR") || code.includes("SOURCE")) themes["ENERGY"]++;
            if (code.includes("GRID")) themes["LAW"]++;
            if (code.includes("void") || code.includes("VOID")) themes["VOID"]++;
        });

        // 2. DETERMINE DOMINANT THEME
        const sortedThemes = Object.entries(themes).sort((a, b) => b[1] - a[1]);
        const dominant = sortedThemes[0][0]; // e.g. "STRUCTURE"

        // 3. CONSTRUCT NARRATIVE
        let narrative = `Analysis of ${artifacts.length} glyphs reveals a primary focus on **${dominant}**. `;

        // Add specifics
        const topCodes = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const specifics = topCodes.map(([code, count]) => {
            const humanName = this.translateCode(code);
            return `${count} instances of ${humanName}`;
        });

        narrative += `The data is anchored by ${specifics.join(", ")}. `;

        // 4. SYNTHESIZE MEANING
        if (dominant === "STRUCTURE") {
            narrative += "This suggests a localized engineering breakdown, likely outlining architectural or physical stability requirements.";
        } else if (dominant === "ENERGY") {
            narrative += "This indicates an active circuit diagram describing the flow, projection, or oscillation of power.";
        } else if (dominant === "VOID") {
            narrative += "This represents a fundamental state of unity or potential, possibly a 'Source Code' definition.";
        } else if (dominant === "LAW") {
            narrative += "This serves as a regulatory framework or measurement standard.";
        }

        return {
            title: `DECODED: ${dominant} PROTOCOL`,
            narrative: narrative,
            dominantTheme: dominant
        };
    }

    public static translateCode(code: string): string {
        // Direct match
        if (this.CODE_MAP[code]) return this.CODE_MAP[code];

        // Partial matches (for Resonance codes which have numbers)
        if (code.includes("RESONANCE_VOID")) return "Void Resonance";
        if (code.includes("RESONANCE_DIMENSIONAL")) return "Dimensional Resonance";
        if (code.includes("RESONANCE_BIOLOGICAL")) return "Biological Resonance";

        return code.replace(/_/g, " "); // Fallback
    }
}
