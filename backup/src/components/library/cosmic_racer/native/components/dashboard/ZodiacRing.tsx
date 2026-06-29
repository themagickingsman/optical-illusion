import React, { useMemo } from 'react';

// Pre-calculated Zodiac Data (Static)
const ZODIAC_SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const ZODIAC_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

interface ZodiacRingProps {
    center: number;
    radius: number;
    rotation: number;
    scale: number;
    selectedZodiac: number | null;
    setSelectedZodiac: (index: number | null) => void;
    onZodiacClick: (index: number) => void;
}

export const ZodiacRing: React.FC<ZodiacRingProps> = React.memo(({
    center,
    radius,
    rotation,
    scale,
    selectedZodiac,
    setSelectedZodiac,
    onZodiacClick
}) => {
    
    // CULLING: Don't render if zoom is too high (User Request: Efficiency)
    // HYDRATION FIX: Force client-side rendering to avoid float precision mismatch
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // USER REQUEST: Hide the zodiac entirely
    return null;

    return (
        <g>
            {/* Outer ring */}
            <circle 
                cx={center} 
                cy={center} 
                r={radius} 
                fill="none" 
                stroke="rgba(99, 102, 241, 0.2)" 
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
            />

            {/* Inner guide ring */}
            <circle 
                cx={center} 
                cy={center} 
                r={Math.max(0, radius - 25/scale)} 
                fill="none" 
                stroke="rgba(99, 102, 241, 0.08)" 
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4,4"
            />
            
            {/* LABELS AND RADIAL LINES GROUP - Rotated for Precession */}
            <g transform={`rotate(${rotation}, ${center}, ${center})`}>
                {/* SEGMENT DIVIDER LINES EXTENDING TO SUN */}
                {ZODIAC_SIGNS.map((_, i) => {
                    const angle = (i * 30 - 90) * Math.PI / 180;
                    const innerX = center;
                    const innerY = center;
                    const outerX = center + (radius + 20/scale) * Math.cos(angle);
                    const outerY = center + (radius + 20/scale) * Math.sin(angle);
                    
                    return (
                        <line 
                            key={`line-${i}`}
                            x1={innerX} 
                            y1={innerY} 
                            x2={outerX} 
                            y2={outerY} 
                            stroke="rgba(99, 102, 241, 0.15)" 
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    );
                })}
                {ZODIAC_SIGNS.map((sign, i) => {
                    const angleOffset = i * 30; 
                    const angleRad = (angleOffset - 90) * Math.PI / 180;
                    const labelRadius = radius + 45/scale;
                    
                    const tx = center + labelRadius * Math.cos(angleRad);
                    const ty = center + labelRadius * Math.sin(angleRad);
                    
                    return (
                        <g 
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                const isAlreadySelected = selectedZodiac === i;
                                if (isAlreadySelected) {
                                    setSelectedZodiac(null);
                                } else {
                                    onZodiacClick(i);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Zodiac Symbol */} 
                            <text
                                x={tx}
                                y={ty - 10/Math.max(1, scale)}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={selectedZodiac === i ? '#fcd34d' : 'rgba(147, 197, 253, 0.5)'}
                                fontSize={Math.max(4, 14/scale)} 
                                transform={`rotate(${-rotation}, ${tx}, ${ty - 10/Math.max(1, scale)})`} 
                            >
                                {sign}
                            </text>
                            
                            {/* Name Label */}
                            <text 
                                x={tx}
                                y={ty + 10/Math.max(1, scale)}
                                textAnchor="middle" 
                                fontSize={Math.max(2, 6/scale)}
                                fill="rgba(147, 197, 253, 0.4)"
                                transform={`rotate(${-rotation}, ${tx}, ${ty + 10/Math.max(1, scale)})`}
                            >
                                {ZODIAC_NAMES[i].toUpperCase()}
                            </text>
                        </g>
                    );
                })}
            </g>
        </g>
    );
});
