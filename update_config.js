const fs = require('fs');
const path = require('path');

const configPath = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/cosmic_racer/native/data/compiled_config.json';
const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Function to update flight and cinematic params
function applyDefaults(obj) {
    if (obj) {
        if ('autoTour' in obj) obj.autoTour = true;
        if ('autoPilot' in obj) obj.autoPilot = false;
        if ('cruiseMode' in obj) obj.cruiseMode = false;
        if ('cinematicBehavior' in obj) obj.cinematicBehavior = 'random';
    }
}

// Update top level configurations
applyDefaults(data.screensaver);
applyDefaults(data.screensaver_config);
applyDefaults(data.tour_racing_prefs);
applyDefaults(data.website_config);

// Update all ship presets
if (Array.isArray(data.ship_config)) {
    data.ship_config.forEach(ship => applyDefaults(ship));
}

// Write back formatted JSON
fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated compiled_config.json defaults to Tour Mode / Random');
