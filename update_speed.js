const fs = require('fs');
const path = require('path');

const configPath = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/cosmic_racer/native/data/compiled_config.json';
const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Function to update speed
function applySpeed(obj) {
    if (obj && 'motionSpeed' in obj) {
        obj.motionSpeed = 0.022;
    }
}

// Update top level configurations
applySpeed(data.screensaver);
applySpeed(data.screensaver_config);
applySpeed(data.tour_racing_prefs);
applySpeed(data.website_config);

// Update all ship presets
if (Array.isArray(data.ship_config)) {
    data.ship_config.forEach(ship => applySpeed(ship));
}

// Write back formatted JSON
fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated compiled_config.json motionSpeed to 0.022');
