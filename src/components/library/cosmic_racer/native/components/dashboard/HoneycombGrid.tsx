
import React, { useMemo } from 'react';

interface HoneycombGridProps {
    center: number;
    scaleFactor: number;
    viewTransform: { x: number, y: number, scale: number };
    viewportSize: { width: number, height: number };
    visible: boolean;
    svgSize: number;
}

/**
 * HoneycombGrid
 * 
 * Renders a hexagonal grid overlay/underlay.
 * - Grid Scale: 1 Unit = 1 AU (Astronomical Unit)
 * - Orientation: Pointy-topped (standard for hex grids usually, or flat-topped - we'll use pointy-topped)
 */
export const HoneycombGrid: React.FC<HoneycombGridProps> = React.memo(({ center, scaleFactor, viewTransform, viewportSize, visible, svgSize }) => {
    if (!visible) return null;

    // 1. Grid Configuration
    // HEX_SIZE in pixels at scale 1.0 = scaleFactor (since 1 Unit = 1 AU)
    // We want the grid lines to be fixed in "World Space" (AU), so they scale visually.
    const hexRadiusAU = 0.1; // Base 10 Subdivision (Level 90 Math Base) 
    
    // 2. Visible Bounds Calculation
    // We need to find which hexes are visible in the viewport.
    // Viewport coordinates: [0, 0] to [width, height]
    // Transform: Screen = (World - ViewCenter) * Scale + ScreenCenter
    // Inverse: World = (Screen - ScreenCenter) / Scale + ViewCenter
    
    // ViewTransform x/y are the *translation applied to the group*.
    // SVG Transform: translate(x, y) scale(s)
    // ScreenX = (LocalX + x) * s ??? No, transform is usually on a group.
    // Let's look at CosmicClock.tsx usage:
    // <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>
    // Wait, CosmicClock uses: 
    // const transform = `translate(${center}, ${center}) scale(${scaleFactor}) ...` for bodies?
    // Let's verify how `viewTransform` is used in the main SVG.
    // It seems CosmicClock might be applying the transform to a <g> wrapping everything.
    
    // Re-reading CosmicClock.tsx...
    // <g transform={`alias? no`}>
    // Ah, it uses:
    // <g ref={contentRef} transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>
    // AND `viewTransform` is initialized to { x: 0, y: 0, scale: 1 }.
    // BUT rendering logic for bodies often adds `center` manually: `cx={center + x}`.
    // IF the parent <g> is transformed, then `center` offset in children might double-apply if we aren't careful?
    // Let's look at `OrbitPath` again: `d={`M ${center + p.x}...`}`
    // And `SolarBody`: `cx={center} cy={center}`
    // So the "World Origin" (0,0 of the solar system) is at `(center, center)` inside the `<g>`.
    
    const hexData = useMemo(() => {
        const grid = [];
        const r_px = hexRadiusAU * scaleFactor; // Radius in local pixels (before view scale)
        const w = Math.sqrt(3) * r_px; // Width of a hex
        const h = 2 * r_px;           // Height of a hex
        
        // Horizontal spacing: w
        // Vertical spacing: 3/4 * h
        
        // We need to cover the viewport.
        // The viewport in "Local Group Space" (pixels, but relative to group origin):
        // Screen (0,0) -> Local?
        // LocalX = (ScreenX - viewTransform.x) / viewTransform.scale
        // LocalY = (ScreenY - viewTransform.y) / viewTransform.scale
        
        const offsetX = (viewportSize.width - svgSize) / 2;
        const offsetY = (viewportSize.height - svgSize) / 2;

        const minLocalX = (-offsetX - viewTransform.x) / viewTransform.scale;
        const maxLocalX = (viewportSize.width - offsetX - viewTransform.x) / viewTransform.scale;
        const minLocalY = (-offsetY - viewTransform.y) / viewTransform.scale;
        const maxLocalY = (viewportSize.height - offsetY - viewTransform.y) / viewTransform.scale;
        
        // The Origin (0,0 AU) is at (center, center) pixels in Local Space.
        // So we need to subtract `center` to get coordinates relative to the Sun.
        const minAuX = (minLocalX - center) / scaleFactor;
        const maxAuX = (maxLocalX - center) / scaleFactor;
        const minAuY = (minLocalY - center) / scaleFactor;
        const maxAuY = (maxLocalY - center) / scaleFactor;
        
        // Pad bounds to ensure edges are covered
        const pad = 2; // Extra hexes
        
        // Convert AU bounds to Hex Grid Coordinates (axial or offset)
        // Pointy-topped hexes:
        // x = sqrt(3) * (q + r/2) * size
        // y = 3/2 * r * size
        
        // Inverse:
        // q = (sqrt(3)/3 * x - 1/3 * y) / size
        // r = (2/3 * y) / size
        
        // We iterate over a bounding box of q and r.
        // Approx range:
        // r_min ≈ minAuY / (1.5 * radius)
        const r_min = Math.floor(minAuY / (1.5 * hexRadiusAU)) - pad;
        const r_max = Math.ceil(maxAuY / (1.5 * hexRadiusAU)) + pad;
        
        // For q, it depends on r (slanted).
        // x ≈ sqrt(3) * size * (q + r/2)
        // q ≈ (x / (sqrt(3)*size)) - r/2
        
        // We can just iterate a large enough rectangular area of q/r that covers the view?
        // Or essentially: iterate r, then calculate q range for that r.
        
        for (let r = r_min; r <= r_max; r++) {
            // y_au = r * 1.5 * size
            const y_au = r * 1.5 * hexRadiusAU;
            
            // solve for q range at this y (approx x range)
            // minAuX <= sqrt(3) * size * (q + r/2) <= maxAuX
            // minAuX / (sqrt(3)*size) - r/2 <= q <= ...
            
            const q_min = Math.floor((minAuX / (Math.sqrt(3) * hexRadiusAU)) - r/2) - pad;
            const q_max = Math.ceil((maxAuX / (Math.sqrt(3) * hexRadiusAU)) - r/2) + pad;
            
            for (let q = q_min; q <= q_max; q++) {
                // Calculate actual position (AU)
                const x_au = Math.sqrt(3) * hexRadiusAU * (q + r/2);
                const cy_au = 1.5 * hexRadiusAU * r; // y center
                
                // Convert to Local Pixels (rendering space)
                const px = center + x_au * scaleFactor;
                const py = center + cy_au * scaleFactor;
                
                grid.push({ q, r, x: px, y: py });
            }
        }
        return { grid, hexSizePx: r_px };
    }, [center, scaleFactor, viewTransform, viewportSize, svgSize]);

    // 3. Hexagon Path Generator
    // Generates a path for a hexagon centered at 0,0
    const hexPath = useMemo(() => {
        const r = hexData.hexSizePx;
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30; // -30 for pointy topped
            const angle_rad = Math.PI / 180 * angle_deg;
            points.push(`${r * Math.cos(angle_rad)},${r * Math.sin(angle_rad)}`);
        }
        return points.join(' ');
    }, [hexData.hexSizePx]);

    return (
        <g className="honeycomb-grid">
            {hexData.grid.map((hex) => (
                <g key={`${hex.q},${hex.r}`} transform={`translate(${hex.x}, ${hex.y})`}>
                    <polygon
                        points={hexPath}
                        fill="none"
                        stroke="rgba(99, 102, 241, 0.15)" // Indigo-500 faded
                        strokeWidth={1} 
                        style={{ vectorEffect: 'non-scaling-stroke' }} 
                    />
                    <text
                        x="0"
                        y="0"
                        fill="rgba(255, 255, 255, 0.15)"
                        fontSize={hexData.hexSizePx * 0.4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {hex.q},{hex.r}
                    </text>
                </g>
            ))}
        </g>
    );
});
