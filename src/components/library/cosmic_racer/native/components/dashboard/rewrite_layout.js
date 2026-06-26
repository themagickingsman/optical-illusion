const fs = require('fs');
const file = '/Users/uxmagicman/Desktop/ARN/web_portal/src/app/science/dashboard/components/AcousticPrintingSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract Top Controls
const topControlsStart = content.indexOf('{/* Top Controls - Component Selection & Settings */}');
const topControlsEnd = content.indexOf('            {/* Massive Simulation Canvas Viewport */}');
let topControls = content.substring(topControlsStart, topControlsEnd);
content = content.substring(0, topControlsStart) + content.substring(topControlsEnd);

// Fix topControls indentation (subtract 12 spaces if needed) and margin
topControls = topControls.replace('marginBottom: "2rem",', '/* marginBottom: "2rem", removed */');

// 2. Insert Top Controls at the top
const explainerRowIdx = content.indexOf('{/* PHYSICS EXPLAINER TOP ROW */}');
content = content.substring(0, explainerRowIdx) + topControls + '\n      ' + content.substring(explainerRowIdx);

// 3. Make HUD space-between
const hudStart = content.indexOf('{/* HUD Data Output */}');
const hudDivStart = content.indexOf('<div', hudStart);
const hudStyleEnd = content.indexOf('}}', hudDivStart);
let hudStyle = content.substring(hudDivStart, hudStyleEnd);
hudStyle = hudStyle.replace('border: "1px solid #1e293b",', 
  'border: "1px solid #1e293b",\n            display: "flex",\n            flexDirection: "column",\n            justifyContent: "space-between",\n            height: "100%",');
content = content.substring(0, hudDivStart) + hudStyle + content.substring(hudStyleEnd);

// 4. Update Grid layout below HUD
// The right column wrapper currently is:
const rightColStart = content.indexOf('<div\n          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}\n        >');
// We want to remove this wrapper, since the bottom descriptions and 3D model will sit underneath the main grid.
// But we need to make sure the Canvas is placed inside the 2-column grid instead.
// Actually, let's just write the changes back by targeting specific string replacements.

fs.writeFileSync('rewrite_layout_2.js', `...`);
console.log('Done script 1');
