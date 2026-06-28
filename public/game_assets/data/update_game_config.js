const fs = require('fs');
const path = require('path');

const configPath = './game_config.json';
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
applySpeed(data.shipbank_state);

// Update all ship presets
if (data.shipbank_state_per_ship) {
    for (const key in data.shipbank_state_per_ship) {
        applySpeed(data.shipbank_state_per_ship[key]);
    }
}

// Update Slate Camo's motionOpacity
const slateCamoId = 'custom_ship_1778398173082';
if (data.shipbank_state_per_ship && data.shipbank_state_per_ship[slateCamoId]) {
    data.shipbank_state_per_ship[slateCamoId].motionOpacity = 0.1;
    // Also, if the motionHex is dark, we should check it, but the user complained it's "so opaque".
    // Wait, earlier I saw motionHex is "#ffffff".
}

// Write back formatted JSON
fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated game_config.json motionSpeed to 0.022 and slate camo opacity to 0.1');
