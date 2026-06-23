const fs = require('fs');
const path = './src/data/library.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

const cosmicRacers = {
  "id": "engine_cosmic_racers",
  "title": "Cosmic Racers Engine",
  "subtitle": "The definitive WebGL hover-racing framework.",
  "description": "A high-performance Next.js and Three.js framework specifically engineered for zero-G tubular racing games. Complete with physics, AI opponents, and modular vehicle assets.",
  "category": "Games",
  "isFeatured": true,
  "price": "$89.99",
  "sub_categories": ["Racing", "WebGL", "3D"],
  "globalApiEndpoint": "http://localhost:3009/api/engine/cosmic_racers",
  "media": {
    "thumbnail": "/assets/store/store_racing.png" 
  },
  "downloads": 150000,
  "rating": 5.0,
  "editorial": {
    "kicker": "EDITOR'S CHOICE",
    "introParagraph": "Cosmic Racers Engine has revolutionized how we build high-speed WebGL experiences. A comprehensive suite for building modern 3D racing games. Includes spline-based track generation, advanced vehicle physics, and modular logic designed to plug seamlessly into your autonomous AI agent workflow.",
    "sections": [
      {
        "heading": "Built for Speed",
        "body": "Utilizing React Three Fiber and Rapier physics, this engine handles complex collision and raycasting at 60fps in the browser. You can seamlessly swap out the default hovering logic with standard wheeled-vehicle physics."
      },
      {
        "heading": "Modular Architecture",
        "body": "Every single part of Cosmic Racers is decoupled. Want to use the AI splines for a flying game? Just grab the AI component. Want the neon assets? Grab the models. The choice is yours."
      }
    ],
    "screenshots": [
      "/assets/store/store_racing.png"
    ]
  },
  "components": [
    {
      "id": "comp_cr_1",
      "name": "Zero-G Hover Physics",
      "type": "logic",
      "apiEndpoint": "http://localhost:3009/api/component/comp_cr_1",
      "description": "Pure headless typescript logic for raycast-based hovering and acceleration.",
      "price": "$14.99",
      "icon": "/assets/store/store_racing.png"
    },
    {
      "id": "comp_cr_2",
      "name": "Torus Spline Track Generator",
      "type": "system",
      "apiEndpoint": "http://localhost:3009/api/component/comp_cr_2",
      "description": "Core system handler for procedural 3D tube tracks along a spline path.",
      "price": "$29.99",
      "icon": "/assets/store/store_racing.png"
    },
    {
      "id": "comp_cr_3",
      "name": "Neon Hovercar Asset",
      "type": "asset",
      "apiEndpoint": "http://localhost:3009/api/component/comp_cr_3",
      "description": "High-quality 3D model asset for a sleek, low-poly hover vehicle.",
      "price": "$9.99",
      "icon": "/assets/store/store_racing.png"
    },
    {
      "id": "comp_cr_4",
      "name": "Racer AI Controller",
      "type": "logic",
      "apiEndpoint": "http://localhost:3009/api/component/comp_cr_4",
      "description": "Autonomous waypoint-following logic for opponent vehicles.",
      "price": "$19.99",
      "icon": "/assets/store/store_racing.png"
    },
    {
      "id": "comp_cr_5",
      "name": "Chase Camera Rig",
      "type": "system",
      "apiEndpoint": "http://localhost:3009/api/component/comp_cr_5",
      "description": "A dynamic spring-based camera controller that responds to velocity and drift.",
      "price": "Free",
      "icon": "/assets/store/store_racing.png"
    }
  ]
};

// Add to the front of the array so it shows up first
data.unshift(cosmicRacers);

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Added Cosmic Racers Engine to library.json');
