import React from 'react';

export default function AppleSpinner({ size = 18, color = '#03FFC0' }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ shapeRendering: 'geometricPrecision' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <rect key={i} x="47" y="15" rx="4" ry="4" width="6" height="20" fill={color} transform={`rotate(${i * 30} 50 50)`}>
          <animate attributeName="opacity" values="1;0.2" keyTimes="0;1" dur="1s" begin={`${(i * (1/12)) - 1}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}
