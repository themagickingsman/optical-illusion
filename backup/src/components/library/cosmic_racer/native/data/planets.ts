export type HexType =
  | 'command'    // Governance / faction HQ tiles
  | 'arena'      // PvP / battle tiles
  | 'market'     // Trade / broker tiles
  | 'industry'   // Crafting / production tiles
  | 'mine'       // Raw resource extraction
  | 'research'   // Tech / intel tiles
  | 'military'   // Barracks / fortification tiles
  | 'transit'    // Fast-travel / logistics tiles
  | 'culture'    // Story / social / lore tiles
  | 'wild'       // Unclaimed / contested tiles
  | 'void'       // Dark matter / anomaly tiles
  | 'residential'; // Housing / population tiles

export interface HexBreakdown {
  type: HexType;
  count: number;
  label: string;         // display name
  icon: string;          // emoji
  revenue: string;       // per-hex credit yield description
  activity: string;      // what players do here
}

export interface Planet {
  // Identity
  id: string;
  name: string;
  axis: string;          // AXIS coordinate (grid address)
  lore: string;          // One-line flavour text

  // Orbital / visual
  au: number;            // distance from star in AU
  color: string;         // primary planet hex colour
  glow: string;          // atmosphere glow colour
  size: number;          // relative display size (px at zoom=1)

  // Ownership
  faction: number;       // 0=Alliance Zero, 1=Forge Syndicate, 2=Meridian, 3=Void Reavers, -1=Neutral
  conquerable: boolean;  // can another faction take this planet?

  // Summary stats
  totalHexes: number;
  pop: number;           // baseline population
  players: number;       // active players (live data placeholder)

  // Economy & specialization
  specialty: string;     // one-word role (TRADE, INDUSTRY, MILITARY…)
  specialtyDesc: string; // short description
  bonuses: string[];     // gameplay bonuses that apply here
  resources: string[];   // raw resources available

  // Hex breakdown — the full hex grid composition
  hexes: HexBreakdown[];

  // Activities — what missions / loops happen here
  activities: {
    name: string;
    type: 'mission' | 'shop' | 'arena' | 'passive' | 'event' | 'story';
    desc: string;
    unlock?: string;     // level / quest prerequisite if any
  }[];
}

// ─── FACTION REFERENCE ────────────────────────────────────────────────────────
export const FACTIONS: Record<number, { name: string; color: string; shortName: string }> = {
   0: { name: 'Alliance Zero',    color: '#0088ff', shortName: 'AZ'  },
   1: { name: 'Forge Syndicate',  color: '#f59e0b', shortName: 'FS'  },
   2: { name: 'Meridian Council', color: '#34d399', shortName: 'MC'  },
   3: { name: 'Void Reavers',     color: '#c084fc', shortName: 'VR'  },
  [-1]:{ name: 'Neutral',         color: '#4b5563', shortName: 'NEU' },
};

// ─── PLANET DEFINITIONS ───────────────────────────────────────────────────────
export const PLANETS: Planet[] = [
  {
    id: 'nexus-prime',
    name: 'Nexus Prime',
    axis: '14',
    lore: 'The beating heart of the ALLIANCES system. Neutral ground, permanent command center. No faction can own it — everyone passes through.',
    au: 0.39, color: '#c0c0c0', glow: '#888888', size: 6,
    faction: 0, conquerable: false,
    totalHexes: 500, pop: 12000, players: 12,
    specialty: 'HUB',
    specialtyDesc: 'The political and economic capital of the system. All four factions maintain embassies here. The arena, broker, and mission board all anchor to Nexus Prime.',
    bonuses: [
      'Global trade / broker access regardless of location',
      'Mission board shows all active contracts system-wide',
      'Arena queue shortcut — enter from any planet',
      'Diplomatic immunity while in Nexus Prime territory',
    ],
    resources: ['data', 'credits', 'influence'],
    hexes: [
      { type: 'command',     count: 80,  label: 'Command Spires',    icon: '🏛', revenue: '500 credits/turn', activity: 'Faction HQ, voting, season influence tallying' },
      { type: 'arena',       count: 60,  label: 'Arena Sectors',     icon: '⚔️', revenue: '200 credits/match', activity: 'PvP battles, Light Cycle race, tournament events' },
      { type: 'market',      count: 100, label: 'Market Districts',  icon: '💰', revenue: '350 credits/turn', activity: 'Broker trades, equipment shop, resource exchange' },
      { type: 'culture',     count: 80,  label: 'Council Chambers',  icon: '📜', revenue: '150 credits/turn', activity: 'Diplomacy, lore unlocks, faction alliance negotiations' },
      { type: 'transit',     count: 60,  label: 'Transit Hubs',      icon: '🚀', revenue: '100 credits/turn', activity: 'Fast travel access to all known planets' },
      { type: 'residential', count: 120, label: 'Residential Rings', icon: '🏘', revenue: '80 credits/turn',  activity: 'Population housing, recruit NPCs' },
    ],
    activities: [
      { name: 'Arena Queue',         type: 'arena',   desc: 'Enter the main PvP arena. Ships, weapons, tactics.' },
      { name: 'Light Cycle Race',    type: 'arena',   desc: 'Bet on or enter the cycle track. Sponsor a bike. Upgrade it.' },
      { name: 'Mission Board',       type: 'mission', desc: 'Pick up contracts from all four factions.' },
      { name: 'Broker Exchange',     type: 'shop',    desc: 'Buy/sell resources and intelligence packets.' },
      { name: 'Alliance Vote',       type: 'passive', desc: 'Cast influence votes that shape season outcomes.' },
      { name: 'Diplomatic Council',  type: 'story',   desc: 'Negotiate territory agreements between factions.' },
    ],
  },

  {
    id: 'venus',
    name: 'Venus',
    axis: '31',
    lore: 'The birthplace of the Venus Protocol. Ancient libraries and broadcast towers tell the story of the system\'s founding conflict.',
    au: 0.72, color: '#e8c87a', glow: '#c8a050', size: 10,
    faction: 0, conquerable: true,
    totalHexes: 200, pop: 8200, players: 8,
    specialty: 'STORY',
    specialtyDesc: 'Cultural and narrative anchor of the system. The Venus Protocol mission arc launches from here. Controlling Venus grants system-wide broadcast bonuses.',
    bonuses: [
      '+25% influence from all cultural / lore activities',
      'Broadcast Towers boost faction influence gain system-wide',
      'Unlocks the Venus Protocol mission arc (story campaign)',
      'Academy hexes reduce tech research time by 20%',
    ],
    resources: ['data', 'influence', 'culture-tokens'],
    hexes: [
      { type: 'culture',     count: 80,  label: 'Academies',          icon: '📚', revenue: '200 credits/turn', activity: 'Lore unlocks, skill training, story missions' },
      { type: 'research',    count: 40,  label: 'Broadcast Towers',   icon: '📡', revenue: '300 credits/turn', activity: 'Faction influence multiplier, intel sharing' },
      { type: 'market',      count: 30,  label: 'Archive Markets',    icon: '📖', revenue: '150 credits/turn', activity: 'Trade rare data packets, lore fragments' },
      { type: 'residential', count: 50,  label: 'Residential Domes',  icon: '🏘', revenue: '80 credits/turn',  activity: 'Population, recruit story NPCs' },
    ],
    activities: [
      { name: 'Venus Protocol Arc', type: 'story',   desc: 'Multi-part story campaign. 4 missions → arena finale.', unlock: 'Visit Venus once' },
      { name: 'Academy Training',   type: 'passive', desc: 'Passive skill XP gain. Assign crew members to study.' },
      { name: 'Broadcast Control',  type: 'mission', desc: 'Capture or defend broadcast towers for influence.' },
      { name: 'Archive Trade',      type: 'shop',    desc: 'Buy/sell rare lore fragments and data caches.' },
    ],
  },

  {
    id: 'forge-world',
    name: 'Forge World',
    axis: '32',
    lore: 'The industrial heartland. Foundries run 24/7. Forge Syndicate controls the supply chain — but anyone can rent a factory floor.',
    au: 1.00, color: '#d46c2a', glow: '#b05020', size: 11,
    faction: 1, conquerable: true,
    totalHexes: 180, pop: 6400, players: 6,
    specialty: 'INDUSTRY',
    specialtyDesc: 'Manufacturing and crafting hub. Equipment, weapons, and ship upgrades cost less here. Controlling Forge World gives a faction-wide production bonus.',
    bonuses: [
      '-20% crafting credit cost for all equipment',
      'Ship upgrades 25% faster when docked here',
      'Heavy weapon manufacturing unlocked (unique to Forge World)',
      '+15% ore and metal resource yield from all Syndicate-held mines',
    ],
    resources: ['ore', 'metal', 'plasma', 'ship-parts'],
    hexes: [
      { type: 'industry',    count: 80,  label: 'Foundries',         icon: '🔨', revenue: '400 credits/turn', activity: 'Craft weapons, equipment, ship modules' },
      { type: 'mine',        count: 50,  label: 'Ore Pits',         icon: '⛏️', revenue: '300 credits/turn', activity: 'Raw ore / metal extraction' },
      { type: 'market',      count: 20,  label: 'Equipment Bazaar', icon: '🛠', revenue: '200 credits/turn', activity: 'Buy/sell crafted equipment' },
      { type: 'military',    count: 20,  label: 'Armories',         icon: '🏭', revenue: '150 credits/turn', activity: 'Weapon upgrades, ammo restocking' },
      { type: 'residential', count: 10,  label: 'Worker Quarters',  icon: '🏘', revenue: '60 credits/turn',  activity: 'Workforce housing' },
    ],
    activities: [
      { name: 'Crafting Floor',     type: 'shop',    desc: 'Craft weapons and equipment using raw materials.' },
      { name: 'Ship Refit',         type: 'shop',    desc: 'Upgrade hull, weapons, engines, cargo at the shipyard.' },
      { name: 'Factory Raid',       type: 'mission', desc: 'Espionage mission: steal Syndicate blueprints. → Arena' },
      { name: 'Supply Line',        type: 'passive', desc: 'Passive ore income from owned Foundry hexes.' },
      { name: 'Heavy Arms Unlock',  type: 'mission', desc: 'Complete supply chain quest to unlock Tier 3 weapons.', unlock: 'Control 20 Foundry hexes' },
    ],
  },

  {
    id: 'outpost-gamma',
    name: 'Outpost Gamma',
    axis: '33',
    lore: 'The crossroads of the system. Every fast-travel route passes through Gamma. Control it and you tax the entire network.',
    au: 1.52, color: '#7ab0cc', glow: '#5a90ac', size: 8,
    faction: 0, conquerable: true,
    totalHexes: 120, pop: 320, players: 4,
    specialty: 'TRANSIT',
    specialtyDesc: 'Logistics and fast-travel gateway. Owning this planet lets your faction tax or discount travel across the system. Critical strategic chokepoint.',
    bonuses: [
      'Free fast travel within your faction\'s territory',
      '+20% cargo capacity for all ships passing through',
      'Fuel costs reduced 30% system-wide while you hold it',
      'Ability to reroute or block enemy fast-travel (contested)',
    ],
    resources: ['fuel', 'data', 'cargo-manifests'],
    hexes: [
      { type: 'transit',     count: 60,  label: 'Jump Gates',        icon: '🌀', revenue: '250 credits/jump', activity: 'Fast travel hub, route management' },
      { type: 'market',      count: 25,  label: 'Fuel Depots',       icon: '⛽', revenue: '180 credits/turn', activity: 'Fuel resupply, cargo offload' },
      { type: 'command',     count: 15,  label: 'Relay Stations',    icon: '📡', revenue: '100 credits/turn', activity: 'Route control, intel relay' },
      { type: 'residential', count: 20,  label: 'Crew Quarters',     icon: '🏘', revenue: '60 credits/turn',  activity: 'Transient crew housing' },
    ],
    activities: [
      { name: 'Gate Control',       type: 'mission', desc: 'Missions to capture / hold the jump gate network.' },
      { name: 'Cargo Hauling',      type: 'passive', desc: 'Passive credits from taxing passing trade ships.' },
      { name: 'Blockade',           type: 'arena',   desc: 'PvP: intercept enemy ships attempting fast travel.' },
      { name: 'Refuel & Restock',   type: 'shop',    desc: 'Buy fuel, repairs, and basic supplies.' },
    ],
  },

  {
    id: 'meridian',
    name: 'Meridian',
    axis: '34',
    lore: 'The neutral trade world. Meridian Council brokers peace treaties — and profits from every deal made on its soil.',
    au: 1.83, color: '#50c878', glow: '#30a858', size: 9,
    faction: 2, conquerable: true,
    totalHexes: 100, pop: 4800, players: 3,
    specialty: 'TRADE',
    specialtyDesc: 'Economic and diplomatic hub. The best market prices in the system are found here. Controlling Meridian increases faction credit income by 30%.',
    bonuses: [
      '+30% credit income for controlling faction',
      'Best exchange rates for all resource trades',
      'Diplomatic immunity: no PvP attacks within Meridian territory',
      'Faction standing can be improved / repaired here',
    ],
    resources: ['credits', 'luxury-goods', 'data', 'influence'],
    hexes: [
      { type: 'market',      count: 50,  label: 'Exchange Floors',   icon: '💹', revenue: '500 credits/turn', activity: 'High-volume resource trading, arbitrage' },
      { type: 'command',     count: 20,  label: 'Council Chambers',  icon: '🏛', revenue: '200 credits/turn', activity: 'Faction diplomacy, alliance formation' },
      { type: 'culture',     count: 20,  label: 'Cultural Plazas',   icon: '🎭', revenue: '100 credits/turn', activity: 'Influence gain, faction reputation' },
      { type: 'residential', count: 10,  label: 'Merchant Housing',  icon: '🏘', revenue: '80 credits/turn',  activity: 'Wealthy NPC merchants' },
    ],
    activities: [
      { name: 'Resource Exchange',  type: 'shop',    desc: 'Trade resources at the best system-wide rates.' },
      { name: 'Diplomatic Summit',  type: 'story',   desc: 'Multi-faction event — negotiate territory, set season rules.' },
      { name: 'Market Manipulation',type: 'mission', desc: 'Covert op to crash or spike a commodity\'s price.' },
      { name: 'Faction Rehabilitation',type:'passive',desc: 'Spend credits to repair standing with a rival faction.' },
    ],
  },

  {
    id: 'bastion',
    name: 'Bastion',
    axis: '35',
    lore: 'A fortress world built for one purpose: war. Forge Syndicate\'s forward staging ground. The barracks never empty.',
    au: 2.70, color: '#c8a060', glow: '#b09050', size: 12,
    faction: 1, conquerable: true,
    totalHexes: 90, pop: 5500, players: 5,
    specialty: 'MILITARY',
    specialtyDesc: 'The premier combat world. All PvP modifiers are active. Barracks and fortifications are the primary hex types. High risk, high kill-reward.',
    bonuses: [
      '+20% combat damage bonus for all ships launching from Bastion',
      'Fortification hexes provide territory defense bonuses',
      'Barracks generate passive recruit income (NPC fighters)',
      'Fastest fleet respawn timer in the system',
    ],
    resources: ['metal', 'weapons', 'soldiers', 'energy'],
    hexes: [
      { type: 'military',    count: 45,  label: 'Barracks',          icon: '⚔️', revenue: '300 credits/turn', activity: 'NPC recruit generation, combat training' },
      { type: 'industry',    count: 20,  label: 'Armories',          icon: '🛡', revenue: '200 credits/turn', activity: 'Weapon and armor production' },
      { type: 'command',     count: 15,  label: 'Fortifications',    icon: '🏰', revenue: '250 credits/turn', activity: 'Territory defense, siege operations' },
      { type: 'residential', count: 10,  label: 'Soldier Quarters',  icon: '🏘', revenue: '60 credits/turn',  activity: 'Military housing' },
    ],
    activities: [
      { name: 'Raid Mission',        type: 'mission', desc: 'Attack an enemy territory → resolve in arena.' },
      { name: 'Siege Defense',       type: 'arena',   desc: 'Defend your Bastion hexes against incoming faction attack.' },
      { name: 'Recruit Training',    type: 'passive', desc: 'Passively generate NPC crew members for your fleet.' },
      { name: 'Arms Deal',           type: 'shop',    desc: 'Buy military-grade weapons not available elsewhere.' },
    ],
  },

  {
    id: 'the-drift',
    name: 'The Drift',
    axis: '57',
    lore: 'No one owns The Drift — everyone fights over it. Perpetual conflict zone. The highest risk, the highest reward.',
    au: 3.87, color: '#d4a020', glow: '#c89010', size: 8,
    faction: -1, conquerable: true,
    totalHexes: 60, pop: 140, players: 2,
    specialty: 'CONTESTED',
    specialtyDesc: 'Full PvP territory. No faction holds it for long. Rich in rare resources but zero safety. The ultimate grind zone for aggressive players.',
    bonuses: [
      'Rare resource drops (2× yield on ore, plasma, dark-matter precursors)',
      'No respawn protection — full loot on player death',
      'Holding even 1 hex here grants +5% system-wide influence',
      'Hidden POIs only visible to players with radar upgrades',
    ],
    resources: ['ore', 'plasma', 'rare-minerals', 'salvage'],
    hexes: [
      { type: 'wild',        count: 35,  label: 'Contested Zones',   icon: '💀', revenue: '500 credits (high risk)', activity: 'PvP extraction, scavenging, ambushes' },
      { type: 'mine',        count: 15,  label: 'Drift Mines',       icon: '⛏️', revenue: '450 credits/turn', activity: 'Rare ore and plasma extraction' },
      { type: 'transit',     count: 10,  label: 'Drifter Camps',     icon: '⛺', revenue: '100 credits/turn', activity: 'Hidden rest stops, NPC vendor access' },
    ],
    activities: [
      { name: 'Resource Raid',       type: 'mission', desc: 'Extract rare resources under enemy fire.' },
      { name: 'Turf War',            type: 'arena',   desc: 'Player-vs-player hex capture — winner takes the tile.' },
      { name: 'Scavenger Hunt',      type: 'mission', desc: 'Find hidden POI caches before rival players do.' },
      { name: 'Drift Bounty',        type: 'event',   desc: 'Weekly event: most extractable from The Drift wins bonus.', unlock: 'Active season' },
    ],
  },

  {
    id: 'ember',
    name: 'Ember',
    axis: '59',
    lore: 'A scorched mining world baked too close to the star. The plasma veins run deep. Worth the heat.',
    au: 5.20, color: '#e05030', glow: '#c04020', size: 10,
    faction: -1, conquerable: true,
    totalHexes: 55, pop: 90, players: 1,
    specialty: 'MINING',
    specialtyDesc: 'The richest raw resource world in the system. Plasma, ore, and rare minerals. Controlling it locks down the supply of high-tier crafting materials.',
    bonuses: [
      '+40% raw ore and plasma yield from all extraction',
      'Exclusive plasma forge unlocked (Tier 3 energy weapons)',
      'Heat-shielded ship mods available only here',
      'Passive income from unmanned extraction rigs',
    ],
    resources: ['plasma', 'ore', 'rare-minerals', 'heat-crystals'],
    hexes: [
      { type: 'mine',        count: 35,  label: 'Plasma Veins',      icon: '🔥', revenue: '600 credits/turn', activity: 'Plasma and ore extraction, deep drilling' },
      { type: 'industry',    count: 10,  label: 'Processing Plants', icon: '⚙️', revenue: '300 credits/turn', activity: 'Refine raw plasma into usable fuel/weapons' },
      { type: 'wild',        count: 10,  label: 'Hazard Zones',      icon: '☢️', revenue: 'Variable (event)', activity: 'High-reward extraction with environmental hazard' },
    ],
    activities: [
      { name: 'Deep Drilling',       type: 'passive', desc: 'Assign crew to extraction rigs for passive plasma income.' },
      { name: 'Plasma Forge',        type: 'shop',    desc: 'Craft energy weapons from raw plasma.', unlock: 'Control 10 Plasma Vein hexes' },
      { name: 'Hazard Extraction',   type: 'event',   desc: 'Risk heat damage for double plasma yield. Time-limited.' },
      { name: 'Rig Defense',         type: 'mission', desc: 'Defend your extraction rigs against rival raiding parties.' },
    ],
  },

  {
    id: 'coldreach',
    name: 'Coldreach',
    axis: '85',
    lore: 'The sensor world. Coldreach sees everything — every ship, every transmission, every location. Knowledge is its currency.',
    au: 5.86, color: '#a0c8d8', glow: '#80b0c8', size: 9,
    faction: 3, conquerable: true,
    totalHexes: 50, pop: 800, players: 2,
    specialty: 'INTEL',
    specialtyDesc: 'Intelligence and research hub. Controlling Coldreach expands your faction\'s radar range and unlocks hidden POIs across the galaxy map.',
    bonuses: [
      'Radar range expanded by 50% for your faction',
      'Hidden POIs on the galaxy map become visible system-wide',
      'Enemy ship locations revealed within Coldreach\'s sensor range',
      'Tech research speed +30% for controlling faction',
    ],
    resources: ['data', 'sensor-arrays', 'ice', 'rare-gases'],
    hexes: [
      { type: 'research',    count: 25,  label: 'Sensor Arrays',     icon: '📡', revenue: '400 credits/turn', activity: 'Radar, intel gathering, enemy tracking' },
      { type: 'research',    count: 15,  label: 'Research Labs',     icon: '🔬', revenue: '300 credits/turn', activity: 'Tech upgrades, new module development' },
      { type: 'mine',        count: 10,  label: 'Cryo Mines',        icon: '❄️', revenue: '200 credits/turn', activity: 'Ice and rare gas extraction' },
    ],
    activities: [
      { name: 'Intel Sweep',         type: 'passive', desc: 'Passive intel income — reveals enemy positions on minimap.' },
      { name: 'Research Project',    type: 'passive', desc: 'Long-run research unlocks Tier 3 modules and abilities.' },
      { name: 'Signal Intercept',    type: 'mission', desc: 'Intercept enemy communications → intel advantage in arena.' },
      { name: 'Sensor Sabotage',     type: 'mission', desc: 'Covert op: blind an enemy faction\'s radar for 24h.' },
    ],
  },

  {
    id: 'the-scar',
    name: 'The Scar',
    axis: '86',
    lore: 'Something tore The Scar open long ago. Dark matter bleeds through the rift. Only the desperate or the brilliant go there.',
    au: 7.74, color: '#5040a0', glow: '#3020c0', size: 7,
    faction: -1, conquerable: true,
    totalHexes: 35, pop: 20, players: 0,
    specialty: 'DARK MATTER',
    specialtyDesc: 'End-game resource zone. Dark matter is required for Tier 4 upgrades, void tech, and Octave expansion. Extremely high risk.',
    bonuses: [
      'Only source of dark matter in the system',
      'Tier 4 module crafting unlocked with dark matter',
      'Void Reavers faction bonus: +50% dark matter yield',
      'Season bonus: faction controlling The Scar at season end gains Octave expansion rights',
    ],
    resources: ['dark-matter', 'void-crystals', 'exotic-particles'],
    hexes: [
      { type: 'void',        count: 20,  label: 'Rift Zones',        icon: '🌀', revenue: '800 credits/turn (extreme risk)', activity: 'Dark matter extraction, void anomaly events' },
      { type: 'research',    count: 10,  label: 'Anomaly Labs',      icon: '🔭', revenue: '400 credits/turn', activity: 'Void tech research, exotic particle study' },
      { type: 'wild',        count: 5,   label: 'Irradiated Wastes', icon: '☢️', revenue: 'Variable', activity: 'Hazard exploration, scavenging' },
    ],
    activities: [
      { name: 'Dark Matter Extraction', type: 'passive', desc: 'Passive T4 material income. Requires Tier 3 rig.', unlock: 'Tier 3 extraction module' },
      { name: 'Void Anomaly Event',     type: 'event',   desc: 'Random rift events — major loot or major danger.' },
      { name: 'Scar Heist',             type: 'mission', desc: '4-stage mission arc → final arena showdown at the rift.' },
      { name: 'Tier 4 Forge',           type: 'shop',    desc: 'Spend dark matter to craft the rarest modules.', unlock: 'Control 5 Rift Zone hexes' },
    ],
  },

  {
    id: 'waypoint-7',
    name: 'Waypoint 7',
    axis: '91',
    lore: 'A modest resupply beacon in the outer system. Not glamorous, but everyone stops here eventually.',
    au: 9.14, color: '#202030', glow: '#101828', size: 5,
    faction: 0, conquerable: true,
    totalHexes: 30, pop: 180, players: 1,
    specialty: 'RESUPPLY',
    specialtyDesc: 'Pit stop world in the outer system. Cheap fuel, basic repairs, minimal conflict. A safe haven for ships venturing into the outer reaches.',
    bonuses: [
      'Ship repairs cost 40% less credits',
      'Fuel purchase free for Alliance Zero members',
      'Safe zone: no PvP attacks within Waypoint 7 territory',
      'Scout post: one free radar ping per day of the outer system',
    ],
    resources: ['fuel', 'ship-parts', 'basic-supplies'],
    hexes: [
      { type: 'transit',     count: 15,  label: 'Repair Bays',       icon: '🔧', revenue: '150 credits/turn', activity: 'Ship hull repairs, systems restoration' },
      { type: 'market',      count: 10,  label: 'Supply Depot',      icon: '📦', revenue: '100 credits/turn', activity: 'Basic resource trading, crew restocking' },
      { type: 'residential', count: 5,   label: 'Beacon Housing',    icon: '🏘', revenue: '50 credits/turn',  activity: 'Small crew quarters' },
    ],
    activities: [
      { name: 'Ship Repairs',        type: 'shop',    desc: 'Repair hull and systems at discounted rates.' },
      { name: 'Outer Scan',          type: 'passive', desc: 'Daily radar ping revealing ships in the outer system.' },
      { name: 'Resupply Run',        type: 'mission', desc: 'Escort supply convoys from Waypoint 7 to Nexus Prime.' },
    ],
  },

  {
    id: 'void-anchor',
    name: 'Void Anchor',
    axis: '44',
    lore: 'Something ancient anchors the void here. The Void Reavers revere it. Everyone else fears it. Unlock it and the next Octave opens.',
    au: 9.88, color: '#d0a0c0', glow: '#c090b0', size: 8,
    faction: -1, conquerable: true,
    totalHexes: 25, pop: 640, players: 0,
    specialty: 'VOID',
    specialtyDesc: 'The final frontier of the current Octave. Controlling Void Anchor at season end triggers the Octave expansion — the next season begins from here.',
    bonuses: [
      'Season finale trigger: first faction to control Void Anchor initiates Octave expansion',
      'Grants access to next Octave\'s planet set (new season)',
      'Ancient artifact hexes yield unique one-of-a-kind items',
      'Void Reavers faction: +100% income while controlling Void Anchor',
    ],
    resources: ['dark-matter', 'ancient-artifacts', 'void-crystals'],
    hexes: [
      { type: 'void',        count: 15,  label: 'Ancient Anchor',    icon: '🗿', revenue: '1000 credits/turn (unique)', activity: 'Octave expansion control, ancient tech unlocks' },
      { type: 'research',    count: 5,   label: 'Relic Study Labs',  icon: '🔭', revenue: '300 credits/turn', activity: 'Ancient artifact research, void lore' },
      { type: 'wild',        count: 5,   label: 'Void Wastes',       icon: '🌌', revenue: 'Variable', activity: 'Exploration, random event encounters' },
    ],
    activities: [
      { name: 'Octave Control',      type: 'story',   desc: 'Season-long objective. Control this to end the season.', unlock: 'Reach 80% faction influence' },
      { name: 'Relic Recovery',      type: 'mission', desc: 'Recover ancient artifacts → trade for unique items.' },
      { name: 'Void Anchor Siege',   type: 'arena',   desc: 'The season-finale battle. All factions fight for control.' },
    ],
  },
];

export const getPlanetById  = (id: string) => PLANETS.find(p => p.id === id);
export const getPlanetByAxis = (axis: string) => PLANETS.find(p => p.axis === axis);
export const getPlanetsByFaction = (faction: number) => PLANETS.filter(p => p.faction === faction);

export const TOTAL_HEXES = PLANETS.reduce((acc, p) => acc + p.totalHexes, 0);
