const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('/Users/uxmagicman/Desktop/optical_illusions/public/game_assets/data/game_config.json', 'utf8'));
  
  function search(obj, path) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.id === 'custom_ship_1778398173082' || obj.name === 'Slate Camo' || path.includes('custom_ship_1778398173082')) {
      if (obj.motionOpacity !== undefined) {
         console.log(path, 'motionOpacity:', obj.motionOpacity);
      }
    }
    for (const key in obj) {
      search(obj[key], path + '.' + key);
    }
  }
  
  search(data, 'root');
} catch (e) {
  console.log("Error:", e.message);
}
