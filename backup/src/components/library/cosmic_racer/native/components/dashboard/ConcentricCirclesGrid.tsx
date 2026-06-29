import React, { useMemo } from 'react';

import { formatRadiusString } from '../../state/logic/formatUnits';

interface ConcentricCirclesGridProps {
    center: number;
    scaleFactor: number;
    viewTransform: { x: number, y: number, scale: number };
    viewportSize: { width: number, height: number };
    visible: boolean;
    svgSize: number;
    octave: number;
}

/**
 * ConcentricCirclesGrid
 * 
 * Renders a polar grid with concentric circles radiating from the center (Sun).
 * - Major Rings: 1 AU intervals
 * - Minor Rings: 0.1 AU intervals
 * - Orientation: Radial lines at cardinal directions (0, 90, 180, 270)
 */
export const ConcentricCirclesGrid: React.FC<ConcentricCirclesGridProps> = React.memo(({ center, scaleFactor, viewTransform, viewportSize, visible, svgSize, octave }) => {
    if (!visible) return null;

    const gridData = useMemo(() => {
        // Calculate visible bounds to determine max radius needed
        const offsetX = (viewportSize.width - svgSize) / 2;
        const offsetY = (viewportSize.height - svgSize) / 2;

        // Invert transform to find World coordinates of viewport corners
        // LocalX = (ScreenX - viewTransform.x) / viewTransform.scale
        // WorldX (AU) = (LocalX - center) / scaleFactor

        // We want the maximum distance from the center (0,0 AU) to any corner of the viewport
        const corners = [
            { x: -offsetX, y: -offsetY }, // Top-Left
            { x: viewportSize.width - offsetX, y: -offsetY }, // Top-Right
            { x: -offsetX, y: viewportSize.height - offsetY }, // Bottom-Left
            { x: viewportSize.width - offsetX, y: viewportSize.height - offsetY } // Bottom-Right
        ];

        let maxRadiusAU = 0;

        corners.forEach(corner => {
            const localX = (corner.x - viewTransform.x) / viewTransform.scale;
            const localY = (corner.y - viewTransform.y) / viewTransform.scale;
            
            // Distance from center (Sun) in pixels
            const dx = localX - center;
            const dy = localY - center;
            const distPx = Math.sqrt(dx*dx + dy*dy);
            
            // Convert to AU
            const distAU = distPx / scaleFactor;
            if (distAU > maxRadiusAU) maxRadiusAU = distAU;
        });

        // Generate ticks with Adaptive Stepping to avoid clutter
        // USER REQUEST: Start at 1, use whole digits, local unit of measure
        let majorStep = 1.0;
        if (maxRadiusAU > 100) majorStep = 50.0;
        else if (maxRadiusAU > 25) majorStep = 10.0;
        else if (maxRadiusAU > 10) majorStep = 5.0;
        else majorStep = 1.0; // Enforce minimum step of 1 for integer labels
        
        const rings = [];
        const maxR = Math.ceil(maxRadiusAU);

        // Major Rings (prominent)
        // USER REQUEST: Start at 1
        for (let r = Math.max(1, majorStep); r <= maxR; r += majorStep) {
            rings.push({ r: Math.round(r), type: 'major' }); // Ensure 'r' is an integer
        }
        
        return { rings, maxRadiusAU };

    }, [center, scaleFactor, viewTransform, viewportSize, svgSize]);

    return (
        <g className="concentric-grid"  style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {/* Radial Lines (Cardinal Directions) */}
            <g opacity="0.3">
                <line x1={center - gridData.maxRadiusAU * scaleFactor} y1={center} x2={center + gridData.maxRadiusAU * scaleFactor} y2={center} stroke="rgba(99, 102, 241, 0.5)" strokeWidth={1} style={{ vectorEffect: 'non-scaling-stroke' }} />
                <line x1={center} y1={center - gridData.maxRadiusAU * scaleFactor} x2={center} y2={center + gridData.maxRadiusAU * scaleFactor} stroke="rgba(99, 102, 241, 0.5)" strokeWidth={1} style={{ vectorEffect: 'non-scaling-stroke' }} />
            </g>

            {/* Rings */}
            {gridData.rings.map((ring, i) => (
                <circle 
                    key={`ring-${i}`}
                    cx={center}
                    cy={center}
                    r={ring.r * scaleFactor}
                    fill="none"
                    stroke={ring.type === 'major' ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.15)"}
                    strokeWidth={1}
                    style={{ vectorEffect: 'non-scaling-stroke' }}
                />
            ))}

            {/* Labels for Major Rings */}
            {gridData.rings.filter(r => r.type === 'major').map((ring, i) => (
                 <text
                    key={`label-${i}`}
                    x={center + ring.r * scaleFactor + (4 / viewTransform.scale)} // Slight offset
                    y={center - (4 / viewTransform.scale)}
                    fill="rgba(255, 255, 255, 0.3)"
                    fontSize={12 / viewTransform.scale} // Scale text so it stays readable? Or fixed size? 
                    // Actually, if we want fixed size text, we should inverse scale.
                    // But standard text scales with zoom. Let's keep it scalable but readable.
                    // Wait, user wanted non-scaling lines. Text usually should scale inversely to remain constant size 
                    // OR scale with the map. 
                    // Let's try constant visual size for text.
                    style={{ fontSize: '10px', vectorEffect: 'non-scaling-stroke' }} // This doesn't work for font-size directly in SVG 1.1 usually, but let's try or logic proper size.
                    // We fix the trailing zeroes safely inside formatRadiusString now.
                 >
                    {formatRadiusString(ring.r, octave)}
                 </text>
            ))}
             {/* Re-render text with proper inverse scaling for readability if needed, 
                 but for now simple text is fine. 
                 Actually, simple text transforms with the group. 
                 To keep it readable, we can divide by scale. 
             */}
        </g>
    );
});
