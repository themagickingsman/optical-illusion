export interface ComponentPiece {
  id: string;
  name: string;
  type: 'logic' | 'asset' | 'system';
  apiEndpoint: string;
}

export interface EngineData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  sub_categories: string[];
  globalApiEndpoint: string;
  media: { thumbnail: string };
  downloads: number;
  rating: number;
  components: ComponentPiece[];
}

export const engines: EngineData[] = [
  {
    id: 'hero',
    title: 'Combat Engine - Ultimate Edition',
    subtitle: 'The definitive combat framework for your next title.',
    description: 'A comprehensive suite for building modern 3D combat games. Includes targeting systems, advanced pathfinding, state-of-the-art physics collision, and modular weapon logic designed to plug seamlessly into your autonomous AI agent workflow.',
    category: 'Engines',
    sub_categories: ['Action', '3D', 'Multiplayer Ready'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/hero',
    media: { thumbnail: '/assets/store/store_combat.png' },
    downloads: 45200,
    rating: 4.9,
    components: [
      { id: 'comp_cbt_1', name: 'Hitbox System 2.0', type: 'system', apiEndpoint: '/api/component/comp_cbt_1' },
      { id: 'comp_cbt_2', name: 'Weapon Inventory Logic', type: 'logic', apiEndpoint: '/api/component/comp_cbt_2' },
      { id: 'comp_cbt_3', name: 'Plasma Rifle Asset', type: 'asset', apiEndpoint: '/api/component/comp_cbt_3' }
    ]
  },
  {
    id: 'c1',
    title: 'Combat Module',
    subtitle: 'Core combat interactions',
    description: 'A lightweight modular slice of the Combat Engine, focused strictly on melee and hit-reaction logic.',
    category: 'Modules',
    sub_categories: ['Combat', 'Logic'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c1',
    media: { thumbnail: '/assets/store/store_combat.png' },
    downloads: 12400,
    rating: 4.5,
    components: [
      { id: 'comp_cm_1', name: 'Melee Strike Logic', type: 'logic', apiEndpoint: '/api/component/comp_cm_1' },
      { id: 'comp_cm_2', name: 'Damage Number UI', type: 'asset', apiEndpoint: '/api/component/comp_cm_2' }
    ]
  },
  {
    id: 'c2',
    title: 'Racing Module',
    subtitle: 'High-speed physics',
    description: 'The foundation for any modern racing game. Features complex tire friction models, slipstreaming logic, and suspension systems that agents can bolt right into standard vehicular assets.',
    category: 'Modules',
    sub_categories: ['Racing', 'Physics'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c2',
    media: { thumbnail: '/assets/store/store_racing.png' },
    downloads: 8900,
    rating: 4.7,
    components: [
      { id: 'comp_rc_1', name: 'Tire Friction Model', type: 'logic', apiEndpoint: '/api/component/comp_rc_1' },
      { id: 'comp_rc_2', name: 'Hovercar Suspension Logic', type: 'system', apiEndpoint: '/api/component/comp_rc_2' },
      { id: 'comp_rc_3', name: 'Sci-Fi Speedometer UI', type: 'asset', apiEndpoint: '/api/component/comp_rc_3' }
    ]
  },
  {
    id: 'c3',
    title: 'Puzzle Module',
    subtitle: 'Grid and logic handlers',
    description: 'Robust spatial mapping and connection solvers for 2D and 3D puzzle environments.',
    category: 'Modules',
    sub_categories: ['Puzzle', 'Core'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c3',
    media: { thumbnail: '/assets/store/store_puzzle.png' },
    downloads: 5300,
    rating: 4.8,
    components: [
      { id: 'comp_pz_1', name: 'Hex Grid Generator', type: 'logic', apiEndpoint: '/api/component/comp_pz_1' },
      { id: 'comp_pz_2', name: 'A* Pathfinding Solver', type: 'system', apiEndpoint: '/api/component/comp_pz_2' }
    ]
  },
  {
    id: 'c4',
    title: 'Match-3 Module',
    subtitle: 'Classic mobile puzzle logic',
    description: 'Everything an AI agent needs to spawn, drop, swap, and chain gems on a grid with cascading animations.',
    category: 'Modules',
    sub_categories: ['Puzzle', 'Casual'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c4',
    media: { thumbnail: '/assets/store/store_match3.png' },
    downloads: 21000,
    rating: 4.6,
    components: [
      { id: 'comp_m3_1', name: 'Cascade Physics', type: 'logic', apiEndpoint: '/api/component/comp_m3_1' },
      { id: 'comp_m3_2', name: 'Gem Sprite Pack', type: 'asset', apiEndpoint: '/api/component/comp_m3_2' },
      { id: 'comp_m3_3', name: 'Combo Multiplier Logic', type: 'logic', apiEndpoint: '/api/component/comp_m3_3' }
    ]
  },
  {
    id: 'c5',
    title: 'Combat Assets',
    subtitle: 'Models and Textures',
    description: 'A curated library of modular sci-fi armor, weapons, and particle effects.',
    category: 'Assets',
    sub_categories: ['3D Models', 'VFX'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c5',
    media: { thumbnail: '/assets/store/store_combat.png' },
    downloads: 32000,
    rating: 4.3,
    components: [
      { id: 'comp_c5_1', name: 'Mech Chassis Asset', type: 'asset', apiEndpoint: '/api/component/comp_c5_1' },
      { id: 'comp_c5_2', name: 'Laser Beam VFX', type: 'asset', apiEndpoint: '/api/component/comp_c5_2' }
    ]
  },
  {
    id: 'c6',
    title: 'Racing Assets',
    subtitle: 'Vehicles and Tracks',
    description: 'Hovercars, neon tracks, and modular tunnel assets.',
    category: 'Assets',
    sub_categories: ['3D Models', 'Environments'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c6',
    media: { thumbnail: '/assets/store/store_racing.png' },
    downloads: 14000,
    rating: 4.4,
    components: [
      { id: 'comp_c6_1', name: 'Neon Highway Spline', type: 'asset', apiEndpoint: '/api/component/comp_c6_1' },
      { id: 'comp_c6_2', name: 'Hovercar Model Pack', type: 'asset', apiEndpoint: '/api/component/comp_c6_2' }
    ]
  },
  {
    id: 'c7',
    title: 'Puzzle Assets',
    subtitle: 'Blocks and Environments',
    description: 'Clean, minimalist UI elements and 3D primitives for abstract puzzle games.',
    category: 'Assets',
    sub_categories: ['2D/3D', 'UI'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c7',
    media: { thumbnail: '/assets/store/store_puzzle.png' },
    downloads: 7800,
    rating: 4.6,
    components: [
      { id: 'comp_c7_1', name: 'Glass Box Primitives', type: 'asset', apiEndpoint: '/api/component/comp_c7_1' }
    ]
  },
  {
    id: 'c8',
    title: 'Match-3 Assets',
    subtitle: 'Gems and Effects',
    description: 'High-resolution glossy gem sprites and particle bursts.',
    category: 'Assets',
    sub_categories: ['2D', 'VFX'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c8',
    media: { thumbnail: '/assets/store/store_match3.png' },
    downloads: 18000,
    rating: 4.8,
    components: [
      { id: 'comp_c8_1', name: 'Gem Burst Particle System', type: 'asset', apiEndpoint: '/api/component/comp_c8_1' }
    ]
  },
  {
    id: 'c9',
    title: 'Combat Logic',
    subtitle: 'Pure math and state machines',
    description: 'Headless combat logic. No visuals, just pure typescript systems for calculating damage, managing states, and coordinating AI squads.',
    category: 'Logic',
    sub_categories: ['Systems', 'AI'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c9',
    media: { thumbnail: '/assets/store/store_combat.png' },
    downloads: 5000,
    rating: 4.9,
    components: [
      { id: 'comp_c9_1', name: 'Squad Flanking AI', type: 'logic', apiEndpoint: '/api/component/comp_c9_1' },
      { id: 'comp_c9_2', name: 'Damage Calculation Engine', type: 'logic', apiEndpoint: '/api/component/comp_c9_2' }
    ]
  },
  {
    id: 'c10',
    title: 'Racing Logic',
    subtitle: 'AI Drivers and Timers',
    description: 'Headless AI driver wayfinding logic and lap timing systems.',
    category: 'Logic',
    sub_categories: ['Systems', 'AI'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c10',
    media: { thumbnail: '/assets/store/store_racing.png' },
    downloads: 3000,
    rating: 4.6,
    components: [
      { id: 'comp_c10_1', name: 'Spline Follower AI', type: 'logic', apiEndpoint: '/api/component/comp_c10_1' },
      { id: 'comp_c10_2', name: 'Lap Timing System', type: 'system', apiEndpoint: '/api/component/comp_c10_2' }
    ]
  },
  {
    id: 'c11',
    title: 'Puzzle Logic',
    subtitle: 'Headless State Manager',
    description: 'A pure typescript state machine for managing undo/redo stacks, validating moves, and triggering victory conditions.',
    category: 'Logic',
    sub_categories: ['State'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c11',
    media: { thumbnail: '/assets/store/store_puzzle.png' },
    downloads: 4000,
    rating: 4.7,
    components: [
      { id: 'comp_c11_1', name: 'Undo/Redo Stack Manager', type: 'logic', apiEndpoint: '/api/component/comp_c11_1' },
      { id: 'comp_c11_2', name: 'Move Validation Engine', type: 'logic', apiEndpoint: '/api/component/comp_c11_2' }
    ]
  },
  {
    id: 'c12',
    title: 'Match-3 Logic',
    subtitle: 'Headless Grid Engine',
    description: 'The mathematical core of a match-3 game. Handles finding matches, dropping pieces, and calculating chains without any rendering overhead.',
    category: 'Logic',
    sub_categories: ['Algorithms'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/c12',
    media: { thumbnail: '/assets/store/store_match3.png' },
    downloads: 6000,
    rating: 4.9,
    components: [
      { id: 'comp_c12_1', name: 'Grid Gravity Resolver', type: 'logic', apiEndpoint: '/api/component/comp_c12_1' },
      { id: 'comp_c12_2', name: 'Pattern Match Finder', type: 'logic', apiEndpoint: '/api/component/comp_c12_2' }
    ]
  },
  {
    id: 'ui_about',
    title: 'UGCS About Page',
    subtitle: 'Platform Vision UI',
    description: 'The core about page layout component for the UGCS platform.',
    category: 'Web UI',
    sub_categories: ['Layout', 'DOM'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/ui_about',
    media: { thumbnail: '/assets/logo/op_logo.png' },
    downloads: 1200,
    rating: 5.0,
    components: [
      { id: 'comp_ui_about_1', name: 'About CMS Layout', type: 'asset', apiEndpoint: '/api/component/comp_ui_about_1' }
    ]
  },
  {
    id: 'ui_appstore',
    title: 'UGCS Library Page',
    subtitle: 'Asset Grid UI',
    description: 'The standard layout for displaying the store library grid.',
    category: 'Web UI',
    sub_categories: ['Layout', 'DOM'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/ui_appstore',
    media: { thumbnail: '/assets/logo/op_logo.png' },
    downloads: 1500,
    rating: 5.0,
    components: [
      { id: 'comp_ui_lib_1', name: 'Library CMS Layout', type: 'asset', apiEndpoint: '/api/component/comp_ui_lib_1' }
    ]
  },
  {
    id: 'ui_hireme',
    title: 'UGCS Hire Me Page',
    subtitle: 'Contact & Portfolio UI',
    description: 'Interactive contact form and portfolio terminal.',
    category: 'Web UI',
    sub_categories: ['Layout', 'DOM'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/ui_hireme',
    media: { thumbnail: '/assets/logo/op_logo.png' },
    downloads: 900,
    rating: 4.8,
    components: [
      { id: 'comp_ui_hire_1', name: 'Hire Me Terminal', type: 'asset', apiEndpoint: '/api/component/comp_ui_hire_1' }
    ]
  },
  {
    id: 'cosmic_racer',
    title: 'Cosmic Racer Screensaver',
    subtitle: 'High-Performance WebGL Engine',
    description: 'The first officially ingested UGCS component. A stunning WebGL racing screensaver parsed into our Universal Component Protocol.',
    category: 'Engines',
    sub_categories: ['WebGL', 'Screensaver', 'Racing'],
    globalApiEndpoint: 'http://localhost:3009/api/engine/cosmic_racer',
    media: { thumbnail: '/assets/logo/op_logo.png' },
    downloads: 1337,
    rating: 5.0,
    components: [
      { id: 'comp_cr_1', name: 'Cosmic Renderer', type: 'asset', apiEndpoint: '/api/component/comp_cr_1' },
      { id: 'comp_cr_2', name: 'Flight Optimization Engine', type: 'logic', apiEndpoint: '/api/component/comp_cr_2' },
      { id: 'comp_cr_3', name: 'Master Event Bus', type: 'system', apiEndpoint: '/api/component/comp_cr_3' }
    ]
  }
];
