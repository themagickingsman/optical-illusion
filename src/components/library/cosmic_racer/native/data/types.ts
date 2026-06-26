export interface SourceReference {
    name: string;
    discipline: "ARCHAEOLOGY" | "GEOLOGY" | "MATH" | "LINGUISTICS" | "METALLURGY" | "ECONOMY" | "ASTRONOMY" | "CHEMISTRY" | "HYDROLOGY" | "HISTORY" | "BOTANY" | "SOCIOLOGY";
    weight: number;
    type: "PRIMARY_EXCAVATION" | "ACADEMIC_STUDY" | "COMPARATIVE_ANALYSIS";
}

export interface ArtifactCore {
    id: string;
    slug: string;
    name: string;
    origin: string;
    meta: { decipher_engine_file: string; original_source_image?: string; processing_timestamp: string; alias?: string; };
    metrics: {
        physical: { dimensions: string; weight: string };
        composition: { material: string; chemical?: string; hardness?: string };
        provenance: { location: string; epoch: string };
        iconography: { corpus_id?: string; symbol_ref?: string; visual_description: string; related_symbol_ids?: string[]; };
    };
    spectral: {
        mathematical: { base_system: string };
        temporal: { dating_method: string };
        worldview: { historical_context: string; cosmologic_significance: string };
    };
    geometry: {
        topology: { primitive: string; symmetry: string };
        proportional: { ratio: string };
        functional: { physics_concept: string; description: string };
        system_architecture: { framework_name: string; role_in_framework: string };
        visual_stats?: {
            physical_dimensions: string;
            aspect_ratio: number;
            visual_density: number;
            symmetry_score: number;
            source_image: string;
        };
    };
    vector: {
        validation: { confidence_score: number; hits: number; conflict: string | null };
        sources: SourceReference[];
        citations?: {
            location_source?: string;
            dating_source?: string;
            context_source?: string;
            physics_source?: string;
        };
        external_links?: string[];
        vector_url?: string;
        vector_split_manifest?: string;
    };
    analysis: { method: string; conclusion: string; };
    procedure: string;
    logic_trace?: string;
    visual_geometry?: any;
    ten_vectors?: Record<string, { status: string; data: string; url: string; }>;
}
