const fs = require('fs');
try {
  JSON.parse(fs.readFileSync('/Users/uxmagicman/Desktop/optical_illusions/public/game_assets/data/game_config.json', 'utf8'));
  console.log("JSON is valid");
} catch (e) {
  console.log("JSON IS INVALID: " + e.message);
}
