const fs = require('fs');
const file = '/Users/uxmagicman/Desktop/ARN/web_portal/src/app/science/dashboard/components/AcousticPrintingSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract Top Controls
const topControlsStart = content.indexOf('{/* Top Controls - Component Selection & Settings */}');
// find the div enclosing top controls
const topControlsDivStart = content.lastIndexOf('<div', topControlsStart);
const canvasDivStart = content.indexOf('{/* Massive Simulation Canvas Viewport */}');
let topControls = content.substring(topControlsDivStart, canvasDivStart);

// It has a closing div right before `{/* Massive Simulation Canvas Viewport */}`?
// Wait, Top Controls has its own div. Let's precise that.
// Actual code:
//             {/* Top Controls - Component Selection & Settings */}
//             <div
//               style={{ ... }}
//             >
//               ...
//             </div>
//
//             {/* Massive Simulation Canvas Viewport */}
// So it ends neatly before canvas.
const topControlsEnd = content.lastIndexOf('</div>', canvasDivStart) + 6;
topControls = content.substring(topControlsDivStart, topControlsEnd);

// Remove Top Controls from original place
content = content.substring(0, topControlsDivStart) + content.substring(topControlsEnd);

// Fix Top Controls margin
topControls = topControls.replace('marginBottom: "2rem",', '');

// 2. We want to remove the wrapper around Top Controls and Canvas:
//           <div
//             style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
//           >
const flexWrapperStart = content.lastIndexOf('<div', topControlsDivStart);
// remove that <div ... >
const flexWrapperCloseTag = content.indexOf('>', flexWrapperStart) + 1;
content = content.substring(0, flexWrapperStart) + content.substring(flexWrapperCloseTag);

// we also need to remove its closing </div> which is right after the canvas div
const descriptionsStart = content.indexOf('<div\n            style={{\n              display: "grid",\n              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",');
const flexWrapperClosingDiv = content.lastIndexOf('</div>', descriptionsStart);
content = content.substring(0, flexWrapperClosingDiv) + content.substring(flexWrapperClosingDiv + 6);

// 3. We want to close the 2-column grid AFTER the canvas, instead of after the 3D model.
// Original 2-column grid: gridTemplateColumns: "minmax(300px, 400px) 1fr"
// It closes at the very end of the component.
// Right column grid wrapper currently:
const rightGridStart = content.lastIndexOf('<div', content.indexOf('gridTemplateColumns: "1fr"'));
const rightGridCloseTag = content.indexOf('>', rightGridStart) + 1;
// remove the right column wrapper <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
content = content.substring(0, rightGridStart) + content.substring(rightGridCloseTag);

// remove its closing </div> which is at the very end of the component, just before the main container closing </div>
const lastMainDiv = content.lastIndexOf('</div>\n    </div>\n  );\n};');
// actually there are two closing divs at the end. We need to remove one.
// Let's just remove the first '</div>' we find backwards from the end
const lastDiv1 = content.lastIndexOf('</div>');
const lastDiv2 = content.lastIndexOf('</div>', lastDiv1 - 1);
content = content.substring(0, lastDiv2) + content.substring(lastDiv2 + 6);

// Now, we need to CLOSE the 2-column grid (minmax(300px, 400px) 1fr) AFTER the canvas, and BEFORE the Descriptions.
const twoColumnGridEndStr = '</div>\n\n          <div\n            style={{\n              display: "grid",\n              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",';
content = content.replace('<div\n            style={{\n              display: "grid",\n              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",', twoColumnGridEndStr);

// 4. Make HUD space-between and height 100%
const hudStart = content.indexOf('{/* HUD Data Output */}');
const hudDivStart = content.indexOf('<div', hudStart);
const hudStyleEnd = content.indexOf('}}', hudDivStart);
let hudStyle = content.substring(hudDivStart, hudStyleEnd);
hudStyle = hudStyle.replace('border: "1px solid #1e293b",', 
  'border: "1px solid #1e293b",\n            display: "flex",\n            flexDirection: "column",\n            justifyContent: "space-between",\n            height: "100%",');
content = content.substring(0, hudDivStart) + hudStyle + content.substring(hudStyleEnd);

// Also set Canvas height to 100% and ensure it acts right in grid
const canvasViewportStart = content.indexOf('{/* Massive Simulation Canvas Viewport */}');
const canvasDiv2Start = content.indexOf('<div', canvasViewportStart);
const canvasStyleEnd = content.indexOf('}}', canvasDiv2Start);
let canvasStyle = content.substring(canvasDiv2Start, canvasStyleEnd);
// Maybe remove aspectRatio and add height 100%
canvasStyle = canvasStyle.replace('aspectRatio: "21/9",', '/* aspectRatio: "21/9", */');
canvasStyle = canvasStyle.replace('marginBottom: "2rem",', 'height: "100%",');
content = content.substring(0, canvasDiv2Start) + canvasStyle + content.substring(canvasStyleEnd);

// To ensure items stretch:
const grid2ColStart = content.indexOf('gridTemplateColumns: "minmax(300px, 400px) 1fr",');
content = content.replace('gridTemplateColumns: "minmax(300px, 400px) 1fr",\n          gap: "2rem",', 
  'gridTemplateColumns: "minmax(300px, 400px) 1fr",\n          gap: "2rem",\n          alignItems: "stretch",');

// Insert Top Controls before the 2-col grid
const explainerStart = content.indexOf('{/* PHYSICS EXPLAINER TOP ROW */}');
content = content.substring(0, explainerStart) + topControls + '\n\n      ' + content.substring(explainerStart);

fs.writeFileSync(file, content);
console.log("Rewrite completed.");
