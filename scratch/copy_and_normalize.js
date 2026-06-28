const fs = require('fs');

const srcGameConfig = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/public/game_assets/data/game_config.json';
const srcCompiledConfig = '/Users/uxmagicman/Desktop/cosmic_racing_game/cosmic_racers/src/components/library/cosmic_racer/native/data/compiled_config.json';

const destGameConfig = '/Users/uxmagicman/Desktop/optical_illusions/public/game_assets/data/game_config.json';
const destCompiledConfig = '/Users/uxmagicman/Desktop/optical_illusions/src/components/library/cosmic_racer/native/data/compiled_config.json';

function processFile(src, dest) {
    console.log('Processing', src);
    if (!fs.existsSync(src)) {
        console.error('Source does not exist:', src);
        return;
    }
    const data = JSON.parse(fs.readFileSync(src, 'utf8'));

    // Apply global speed
    function applySpeed(obj) {
        if (obj && 'motionSpeed' in obj) {
            obj.motionSpeed = 0.022;
        }
    }

    if (data.screensaver) applySpeed(data.screensaver);
    if (data.screensaver_config) applySpeed(data.screensaver_config);
    if (data.tour_racing_prefs) applySpeed(data.tour_racing_prefs);
    if (data.website_config) applySpeed(data.website_config);
    if (data.shipbank_state) applySpeed(data.shipbank_state);
    
    // Recursive function to apply speed and opacity anywhere
    function traverse(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if ('motionSpeed' in obj) {
            obj.motionSpeed = 0.022;
        }
        
        if (obj.id === 'custom_ship_1778398173082' || obj.name === 'Slate Camo') {
            obj.motionOpacity = 0.015; // Lowered even further from 0.1
        }
        
        for (const key in obj) {
            if (key === 'custom_ship_1778398173082' && obj[key] && typeof obj[key] === 'object') {
                obj[key].motionOpacity = 0.015; // Lowered even further
            }
            traverse(obj[key]);
        }
    }

    traverse(data);
    
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
    console.log('Saved to', dest);
}

processFile(srcGameConfig, destGameConfig);
processFile(srcCompiledConfig, destCompiledConfig);
