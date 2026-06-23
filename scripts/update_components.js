const fs = require('fs');
const path = './src/data/library.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.forEach(item => {
  if (item.components && Array.isArray(item.components)) {
    item.components.forEach(comp => {
      // Ensure absolute endpoint
      if (!comp.apiEndpoint.startsWith('http')) {
        comp.apiEndpoint = `http://localhost:3009${comp.apiEndpoint}`;
      }
      
      // Add description based on type
      if (!comp.description) {
        if (comp.type === 'logic') {
          comp.description = `Pure headless typescript logic for ${comp.name.toLowerCase()}.`;
        } else if (comp.type === 'asset') {
          comp.description = `High-quality 3D model/UI asset for ${comp.name.toLowerCase()}.`;
        } else {
          comp.description = `Core system handler for ${comp.name.toLowerCase()}.`;
        }
      }
      
      // Add price
      if (!comp.price) {
        comp.price = "Free";
      }

      // Add icon (we'll just reuse the parent's thumbnail or a generic one if we had it, but parent thumbnail works)
      if (!comp.icon) {
        comp.icon = item.media.thumbnail;
      }
    });
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated components inside library.json');
