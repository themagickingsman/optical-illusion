const fs = require('fs');
const path = './src/data/library.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

// App Store Apple Categories mapping roughly
data.forEach(item => {
  if (item.title.includes('Engine')) {
    item.category = 'Games';
    item.isFeatured = true;
    item.price = "$59.99";
  } else if (item.title.includes('Module')) {
    item.category = 'Developer Tools';
    item.isFeatured = item.title.includes('Combat') || item.title.includes('Match-3');
    item.price = "$9.99";
  } else if (item.title.includes('Asset')) {
    item.category = 'Graphics & Design';
    item.isFeatured = false;
    item.price = "$4.99";
  } else {
    item.category = 'Utilities';
    item.isFeatured = false;
    item.price = "Free";
  }
  
  // Editorial content for interior page
  item.editorial = {
    kicker: item.category.toUpperCase(),
    introParagraph: `${item.title} has been an essential tool since it launched. ${item.description}`,
    sections: [
      {
        heading: "New Features",
        body: "Better add an extension to your workflow. This component's array of features has raced past expectations. In addition to core systems, you can now utilize high-performance sub-modules. But be warned: integrating this means serious power!"
      }
    ],
    screenshots: [
      item.media.thumbnail
    ]
  };
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Updated library.json');
