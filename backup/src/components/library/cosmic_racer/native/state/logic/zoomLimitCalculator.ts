
export interface ZoomLimitParams {
    /** 
     * Array of renderable bodies to scan for max distance. 
     * Can be RenderableBody[] or raw COSMIC_DATA format.
     */
    bodies: any[];
    
    /** 
     * The fixed container size in pixels (e.g. 580). 
     */
    containerSize: number;
    
    /** 
     * The scale factor used at 1.0x Zoom (Pixels per AU).
     * Typically: containerSize / 2 / 42.
     */
    baseScaleFactor: number;
    
    /**
     * The target maximum pixel width for the entire system at Max Zoom.
     * Default: 100,000px.
     */
    targetPixelWidth?: number;
    
    /**
     * Minimum system radius in AU (e.g. 42 AU for Zodiac).
     * Prevents zoom from exploding if only inner planets are visible.
     */
    minSystemRadiusAU?: number;
}

/**
 * Calculates the Maximum Zoom Scale required to cap the total system width
 * at a specific pixel value (e.g. 100,000px).
 * 
 * Formula: MaxScale = TargetWidth / (SystemRadiusAU * 2 * BaseScaleFactor)
 */
export const calculateDynamicMaxScale = ({
    bodies,
    containerSize,
    baseScaleFactor,
    targetPixelWidth = 1000000, // Increased 10x per user request
    minSystemRadiusAU = 42
}: ZoomLimitParams): number => {
    
    // 1. Find Maximum Orbital Radius (AU)
    // Scan all bodies for 'semiMajorAxis_AU' (JPL) or 'normalized_radius_au' (Harmonic)
    let maxRadius = minSystemRadiusAU;
    
    for (const body of bodies) {
        // Handle different data shapes
        const r = body.semiMajorAxis_AU || body.normalized_radius_au || 0;
        if (r > maxRadius) {
            maxRadius = r;
        }
    }
    
    // 2. Calculate Base System Width at 1.0x Scale
    // Width = Diameter * ScaleFactor
    const diameterAU = maxRadius * 2;
    const baseWidthPx = diameterAU * baseScaleFactor;
    
    // 3. Solve for Max Scale
    // TargetWidth = BaseWidth * MaxScale
    // MaxScale = TargetWidth / BaseWidth
    
    if (baseWidthPx === 0) return 100; // Fallback safety
    
    const maxScale = targetPixelWidth / baseWidthPx;
    
    // Safety Clamps:
    // Don't let it go below 1.0x (if system is already >100k px at 1.0x) - rare/impossible given 580px container
    // Don't let it go insanely high (e.g. if system is tiny) -> Cap at 100,000x
    return Math.max(1.0, Math.min(100000.0, maxScale));
};
