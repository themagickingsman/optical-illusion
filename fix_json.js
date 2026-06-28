const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'public', 'game_assets', 'data', 'game_config.json');

try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    function fixZoomValues(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                fixZoomValues(obj[key]);
            } else if (key === 'cinematicWideZoom') {
                obj[key] = 0.4;
            } else if (key === 'cinematicCloseZoom') {
                obj[key] = 0.8;
            } else if (key === 'cinematicRandomMinZoom') {
                obj[key] = 0.3;
            } else if (key === 'cinematicRandomMaxZoom') {
                obj[key] = 1.5;
            } else if (key === 'cinematicZoomScale') {
                obj[key] = 0.8;
            }
        }
    }

    fixZoomValues(data);

    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully fixed zoom values in game_config.json');

    // Also do compiled_config if it exists
    const compiledPath = path.join(__dirname, 'src', 'components', 'library', 'cosmic_racer', 'native', 'data', 'compiled_config.json');
    if (fs.existsSync(compiledPath)) {
        const compiledData = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
        fixZoomValues(compiledData);
        fs.writeFileSync(compiledPath, JSON.stringify(compiledData, null, 2), 'utf8');
        console.log('Successfully fixed zoom values in compiled_config.json');
    }

} catch (e) {
    console.error('Error fixing JSON:', e);
}
