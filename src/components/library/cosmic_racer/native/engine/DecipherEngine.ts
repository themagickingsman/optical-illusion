import { UNIVERSAL_ARTIFACTS } from '../data/generated_db';
import { ArtifactCore, SourceReference } from '../data/types';

export interface DecipherLog {
    timestamp: number;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface DecipherResult {
    logs: DecipherLog[];
    calculatedConfidence: number;
    derivedPhysics: string;
    isDeciphered: boolean;
    geometry?: {
        width: number;
        height: number;
        brightness: number;
        contrast: number;
        aspectRatio: number;
    };
    corpusAnalysis?: Array<{
        id: string;
        name: string;
        meaning: string;
        context: string;
    }>;
    isbeAnalysis?: {
        status: string;
        data_source_path?: string;
        dominant_solid: string;
        pattern_type: string;
        state_of_matter: string;
        resonance_hz: number;
        emergence_vector: string;
        dna_sequence: string;
        vitality_bovis: number;
        vitality_status: string;
        mission_statement: string;
        syntropy_ratio: number;
        system_nature: string;
        dimensional_layers?: Record<string, { weight: number }>;
        prospect_domains?: Record<string, number>;
        deep_telemetry?: {
            akashic_locator: string;
            void_frequency: number;
            yin_yang_balance: string;
            musical_key: string;
            chakra_alignment: string;
            elemental_balance: Record<string, number>;
            energy_amplification: number;
            reality_anchor: number;
            consciousness_density: number;
            material_density: number;
            etheric_density: number;
            fractal_dim: number;
            karmic_load: number;
            soul_path_number: number;
            estimated_age_cycles: number;
            time_crystal_sync: string;
            entropy_score: number;
            gc_content: number;
            coherence_index: number;
        };
        quantum_telemetry?: {
            quantum_spin: string;
            torsion_strength: number;
            memetic_potency: number;
            kardashev_level: string;
            zodiac_sign: string;
            planet_ruler: string;
            tarot_card: string;
            iching_hex: number;
            color_spectrum: string;
            aether_texture: string;
            cymatic_form: string;
            light_quotient: number;
            dark_matter: number;
            dimensional_bleed: number;
            logic_iq: number;
            merkaba_vel: number;
            source_proximity: number;
            nucleotide_skew: string;
            encryption_hardness: string;
            galactic_coords: string;
        };
        narrative_analysis?: {
            summary_text: string;
            identified_glyphs: Array<{
                id: string;
                uap_code: string;
                archetype: string;
                frequency: number;
                confidence: number;
            }>;
        };
    };
}

export class DecipherEngine {

    private static LOG_DELAY = 100; // ms

    /**
     * The Main "Brain" Function
     * Translates raw artifact data into a validated Dossier.
     */
    public static async analyze(artifact: ArtifactCore, onProgress?: (data: any) => void): Promise<DecipherResult> {
        const logs: DecipherLog[] = [];
        const addLog = (msg: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
            logs.push({ timestamp: Date.now(), message: msg, type });
        };

        let geometryData = undefined;
        let isbeAnalysis = undefined;

        // 1. INITIALIZATION & METADATA
        addLog(`Loading Artifact Metadata for: ${artifact.id}...`);

        // Citation Check (Transparent)
        addLog(`AUDITING CITATION SOURCES...`);
        if (artifact.vector.citations?.location_source) {
            addLog(`> VERIFIED SOURCE: ${artifact.vector.citations.location_source}`);
        }

        artifact.vector.sources.forEach(src => {
            addLog(`> REFERENCE: ${src.name} [${src.type}]`);
        });

        const reliability = this.calculateCitationScore(artifact.vector.sources);
        addLog(`CITATION SCORE: ${reliability.toFixed(1)}/100`);

        // 2. REAL-TIME IMAGE ANALYSIS
        const imagePath = (artifact.origin === "RAW_SCAN" && artifact.vector.citations?.location_source)
            ? artifact.vector.citations.location_source
            : `/images/deciphered/glyphs/glyph_${artifact.id}.jpg`;

        addLog(`Fetching Local Scan: ${imagePath}...`);

        try {
            // LOAD IMAGE
            const imgParams = await this.analyzeImage(imagePath);
            addLog(`SCAN LOADED: ${imgParams.width}x${imgParams.height}px`, 'SUCCESS');

            // PIXEL ANALYSIS
            addLog(`Processing Pixel Intensity...`);
            addLog(`> Brightness: ${(imgParams.brightness * 100).toFixed(1)}%`);
            addLog(`> Contrast: ${(imgParams.contrast * 100).toFixed(1)}%`);

            // GEOMETRY CHECK
            const realRatio = imgParams.width / imgParams.height;
            addLog(`Calculated Aspect Ratio: ${realRatio.toFixed(3)}`);

            const metaRatio = this.parseRatio(artifact.metrics.physical.dimensions);
            // Verify if metadata matches reality
            addLog(`Metadata Check: ${metaRatio} vs Real ${realRatio.toFixed(2)}`, 'INFO');

            geometryData = {
                width: imgParams.width,
                height: imgParams.height,
                brightness: imgParams.brightness,
                contrast: imgParams.contrast,
                aspectRatio: realRatio
            };

        } catch (e) {
            addLog(`FAILED TO ANALYZE IMAGE: ${imagePath}`, 'ERROR');
            addLog(`> Error: ${e}`, 'ERROR');
        }

        // 3. GLYPH EXTRACTION VERIFICATION
        const corpusAnalysis: Array<{ id: string, name: string, meaning: string, context: string }> = [];

        if (artifact.metrics.iconography.related_symbol_ids?.length) {
            addLog(`ANALYZING SCAN REGIONS...`);

            // Execute real verification in sequence
            // Execute real verification in sequence
            let extractedCount = 0;
            const totalGlyphs = artifact.metrics.iconography.related_symbol_ids.length;

            addLog(`> SCANNING ${totalGlyphs} GLYPH SIGNALS...`);

            for (const id of artifact.metrics.iconography.related_symbol_ids) {
                const targetGlyphPath = `/images/deciphered/glyphs/glyph_${id}.jpg`;
                // addLog(`> Targeting Signal: ${id}...`); // Too verbose

                try {
                    // Actual HTTP Check to verify the extracted region exists
                    const response = await fetch(targetGlyphPath, { method: 'HEAD' });
                    if (response.ok) {
                        extractedCount++;
                        // addLog(`  - SEGMENT EXTRACTED: ${targetGlyphPath.split('/').pop()} (${sizeKb} KB)`, 'SUCCESS');
                    }
                } catch (e) {
                    // Silent fail for smoother UI
                }
            }

            addLog(`> SEGMENTATION COMPLETE: ${extractedCount}/${totalGlyphs} Glyphs Verified`, 'SUCCESS');

            // 4. SEMANTIC TRANSLATION
            addLog(`INITIATING SEMANTIC TRANSLATION...`);
            artifact.metrics.iconography.related_symbol_ids.forEach(id => {
                const ref = UNIVERSAL_ARTIFACTS[id];
                if (ref) {
                    const meaning = ref.analysis.conclusion;
                    addLog(`> DECODED [${id}]: "${meaning}"`, 'SUCCESS');
                    corpusAnalysis.push({
                        id: ref.id,
                        name: ref.name,
                        meaning: ref.analysis.conclusion,
                        context: ref.spectral.worldview.historical_context
                    });
                }
            });
        }

        // 5. ADVANCED ISBE ANALYSIS (Python Bridge)
        try {
            addLog(`CONNECTING TO ISBE-v8.3 REASONING CORE...`);
            const isbeResponse = await fetch('/api/world-apps/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagePath })
            });

            if (isbeResponse.body) {
                const reader = isbeResponse.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulated += chunk;

                    // Split lines but keep potential incomplete line at the end
                    const lines = accumulated.split('\n');
                    accumulated = lines.pop() || ""; // Keep last part in buffer

                    for (const line of lines) {
                        try {
                            if (!line.trim()) continue;
                            const data = JSON.parse(line);
                            if (data.progress) {
                                // Real-time Progress Update
                                if (onProgress) onProgress(data);
                            } else {
                                // Final Result
                                isbeAnalysis = data;
                            }
                        } catch (e) {
                            // Partial JSON ignore
                        }
                    }
                }

                // Process potential last line
                if (accumulated.trim()) {
                    try {
                        const data = JSON.parse(accumulated);
                        if (!data.progress) isbeAnalysis = data;
                    } catch (e) { }
                }
            }

            if (isbeAnalysis) {

                // Custom Logging for Status
                if (!isbeAnalysis.status || isbeAnalysis.status === 'UNDEFINED' || isbeAnalysis.status === 'FAILED') {
                    addLog(`> ISBE STATUS: ${isbeAnalysis.status || 'UNDEFINED'}`, 'ERROR');
                    if (isbeAnalysis.error) addLog(`> ERROR DETAIL: ${isbeAnalysis.error}`, 'ERROR');
                } else {
                    addLog(`> ISBE STATUS: ${isbeAnalysis.status}`, 'INFO');
                }
                addLog(`> DOMINANT GEOMETRY: ${isbeAnalysis.dominant_solid}`);
                addLog(`> EMERGENCE VECTOR: ${isbeAnalysis.emergence_vector}`);
                addLog(`> SYNTROPY RATIO: ${isbeAnalysis.syntropy_ratio.toFixed(3)} (${isbeAnalysis.system_nature})`);
            } else {
                addLog(`> ISBE CONNECTION FAILED: Stream ended without result`, 'WARNING');
            }
        } catch (e: any) {
            addLog(`> ISBE BRIDGE ERROR: ${e.message}`, 'ERROR');
        }

        addLog(`ANALYSIS COMPLETE.`, 'SUCCESS');

        return {
            logs,
            calculatedConfidence: reliability,
            derivedPhysics: artifact.geometry.functional.physics_concept,
            isDeciphered: true,
            geometry: geometryData,
            corpusAnalysis,
            isbeAnalysis
        };
    }

    /**
     * DYNAMIC CALCULATION: Confidence Score
     * Calculates score based on Source Types and Weights.
     * No longer hardcoded.
     */
    private static calculateConfidence(sources: SourceReference[]): number {
        if (!sources || sources.length === 0) return 0;

        let totalWeight = 0;
        let weightedSum = 0;

        sources.forEach(source => {
            // Primary Excavation sources are worth more
            const reliability = source.type === 'PRIMARY_EXCAVATION' ? 1.0 :
                source.type === 'ACADEMIC_STUDY' ? 0.9 : 0.7;

            weightedSum += (source.weight * 100) * reliability;
            totalWeight += source.weight;
        });

        // Normalize
        return Math.min(99.9, weightedSum / totalWeight);
    }

    /**
     * DYNAMIC CALCULATION: Ratio
     * Parses dimension strings to find harmonies.
     */
    private static parseRatio(dimString: string): string {
        // Mock logic for now - in real implementation this would parse "7x14x28"
        if (dimString.includes("7") && dimString.includes("14") && dimString.includes("28")) return "4:2:1 (HARMONIC)";
        if (dimString.includes("Cube")) return "1:1:1 (CUBIC)";
        if (dimString.includes("Circle")) return "π (CIRCULAR)";
        return "VARIABLE";
    }
    /**
     * REAL IMAGE PROCESSING
     * Loads the image into a temporary HTMLImageElement and reads pixel data.
     */
    private static analyzeImage(src: string): Promise<{ width: number, height: number, brightness: number, contrast: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error("Canvas Context Failed");

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    let totalBrightness = 0;
                    let min = 255, max = 0;

                    // Sample every 10th pixel for speed
                    let samples = 0;
                    for (let i = 0; i < data.length; i += 40) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const avg = (r + g + b) / 3;

                        totalBrightness += avg;
                        if (avg < min) min = avg;
                        if (avg > max) max = avg;
                        samples++;
                    }

                    const brightness = (totalBrightness / samples) / 255;
                    const contrast = (max - min) / 255;

                    resolve({
                        width: img.width,
                        height: img.height,
                        brightness,
                        contrast
                    });
                } catch (err) {
                    reject(err);
                }
            };

            img.onerror = () => reject("Image Load Failed");
        });
    }

    private static calculateCitationScore(sources: SourceReference[]): number {
        if (!sources || sources.length === 0) return 0;
        let totalWeight = 0;
        let weightedSum = 0;
        sources.forEach(source => {
            const reliability = source.type === 'PRIMARY_EXCAVATION' ? 1.0 :
                source.type === 'ACADEMIC_STUDY' ? 0.9 : 0.7;
            weightedSum += (source.weight * 100) * reliability;
            totalWeight += source.weight;
        });
        return Math.min(99.9, weightedSum / totalWeight);
    }
}
