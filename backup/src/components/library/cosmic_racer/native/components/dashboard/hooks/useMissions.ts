import { useMemo } from 'react';

export interface MissionState {
  octaveCurrency: Record<number, number>;
  buildings: any[];
  inventory: any;
  activeOctave: number;
  completedTasks: Record<string, boolean>;
  distressStatus?: "stranded"|"rescued"|"delivered";
}

export interface SubTaskPreview {
  type: 'canvas_asteroid' | 'canvas_building' | 'image' | 'keybind';
  octave?: number;    // for canvas_asteroid — drives geom group + color
  src?: string;       // for image type
  key?: string;       // for keybind type e.g. "B"
  label?: string;     // caption below the preview
}

export interface SubTask {
  label: string;
  done: boolean;
  details: string[];
  preview?: SubTaskPreview;
}

export function useMissions({ octaveCurrency, buildings, inventory, activeOctave, completedTasks, distressStatus }: MissionState) {
  return useMemo(() => [
    {
      title: "MILESTONE 1: THE ANCHOR",
      desc: "Establish initial funding by harvesting resources in the Earth orbit.",
      status: completedTasks["Mine 50 Kuiper Materials"] || (octaveCurrency[11] || 0) >= 50 ? "COMPLETED" : "IN PROGRESS",
      avatar: "/game_assets/avatars/cmdr_chad_8bit.png",
      commander: "THE ARCHITECT",
      comp: 1,
      color: "#6ee7b7",
      day: "Day 1",
      subTasks: [
        { 
          label: "Mine 50 Kuiper Materials", 
          done: completedTasks["Mine 50 Kuiper Materials"] || (octaveCurrency[11] || 0) >= 50,
          details: [
            "You start in Octave 11 (Solar System scale).",
            "Shoot the rocky asteroids — they explode into glowing dust orbs.",
            "Fly through the orbs to collect them. You need 50 units.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 11,
            label: "Kuiper Rock — Octave 11",
          }
        } as SubTask
      ]
    },
    {
      title: "MILESTONE 2: INFRASTRUCTURE",
      desc: "Kickstart the Global Grid efficiency matrix to begin automation.",
      status: completedTasks["Build a Power Plant Node"] || buildings.some(b => b.category === "Power Plant") ? "COMPLETED" : (completedTasks["Ensure you have 50 Kuiper Materials"] || (octaveCurrency[11] || 0) >= 50 ? "IN PROGRESS" : "LOCKED"),
      avatar: "/game_assets/avatars/commander_blackman_8bit.png",
      commander: "THE ARCHITECT",
      comp: 2,
      color: "#10b981",
      day: "Day 2",
      subTasks: [
        { 
          label: "Ensure you have 50 Kuiper Materials", 
          done: completedTasks["Ensure you have 50 Kuiper Materials"] || (octaveCurrency[11] || 0) >= 50,
          details: [
            "Required to fund the construction of Tier 1 structures.",
            "Return to Octave 11 and shoot rocky asteroids if you're short.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 11,
            label: "Kuiper Rock — Octave 11",
          }
        } as SubTask,
        { 
          label: "Build a Power Plant Node", 
          done: completedTasks["Build a Power Plant Node"] || buildings.some(b => b.category === "Power Plant"),
          details: [
            "Fly to Earth (blue planet at the centre of the solar system).",
            "Press [B] to open the planetary hex-grid builder.",
            "Select 'Power Plant L1' from the Energy category and place it on a tile.",
          ],
          preview: {
            type: 'keybind',
            key: 'B',
            label: "Open Builder",
          }
        } as SubTask
      ]
    },
    {
      title: "MILESTONE 3: DISTRESS CALL",
      desc: "Rescue stranded civilians from the furthest rim of the Octave.",
      status: distressStatus === "delivered" ? "COMPLETED" : (completedTasks["Build a Power Plant Node"] || buildings.some(b => b.category === "Power Plant") ? "IN PROGRESS" : "LOCKED"),
      avatar: "/game_assets/avatars/cmdr_chad_8bit.png",
      commander: "THE ARCHITECT",
      comp: 3,
      color: "#3b82f6",
      day: "Day 3",
      subTasks: [
        { 
          label: "Upgrade Fuel Capacity (Garage)", 
          done: completedTasks["Upgrade Fuel Capacity (Garage)"] || (inventory?.shipEquip?.[0]?.modulator),
          details: [
            "You won't have the range to reach the outermost planet without upgrades.",
            "Gather more Kuiper Materials, visit a Base, and buy Fuel Tank improvements.",
          ],
          preview: {
            type: 'image',
            src: '/game_assets/items/modulator_8bit.png',
            label: "Fuel Tank Upgrade",
          }
        } as SubTask,
        { 
          label: "Locate and rescue the stranded civilians", 
          done: distressStatus === "rescued" || distressStatus === "delivered",
          details: [
            "Using your expanded fuel range, fly to the outermost dark-grey edge planet.",
            "Intersect the planet's orbit to rescue the 50 stranded colonists aboard.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 11,
            label: "Distressed Edge World",
          }
        } as SubTask,
        { 
          label: "Deliver 50 civilians to the colony", 
          done: distressStatus === "delivered",
          details: [
            "With the extra 50 colonists crowding the ship, fly back to your Headquarters.",
            "Intersect the HQ planet's orbit to securely drop them off.",
          ],
          preview: {
            type: 'canvas_building',
            label: "HQ Dropoff",
          }
        } as SubTask
      ]
    },
    {
      title: "MILESTONE 4: QUANTUM SHIFT",
      desc: "Dive into the Cellular Scale to harvest organic compounds.",
      status: completedTasks["Harvest 100 Volatile Cytoplasm"] || (octaveCurrency[7] || 0) >= 100 ? "COMPLETED" : (distressStatus === "delivered" ? "IN PROGRESS" : "LOCKED"),
      avatar: "/game_assets/avatars/cmdr_denzel_8bit.png",
      commander: "THE ARCHITECT",
      comp: 4,
      color: "#8b5cf6",
      day: "Day 5",
      subTasks: [
        { 
          label: "Acquire the Harmonic Resonator Shield", 
          done: completedTasks["Acquire the Harmonic Resonator Shield"] || !!inventory.bioShield,
          details: [
            "Required for surviving intense fluid pressures in Octave 7.",
            "Purchase from the Global Marketplace at a planetary Base.",
          ],
          preview: {
            type: 'image',
            src: '/game_assets/items/modulator_8bit.png',
            label: "Harmonic Resonator Shield",
          }
        } as SubTask,
        { 
          label: "Warp down to Octave 7", 
          done: completedTasks["Warp down to Octave 7"] || activeOctave <= 7,
          details: [
            "Fly into the Meroitic Portal (the golden glowing ring on the map).",
            "Select Octave 7 — Cellular Mechanics on the warp navigator.",
          ],
          preview: {
            type: 'canvas_building',
            label: "Meroitic Portal — Warp Ring",
          }
        } as SubTask,
        { 
          label: "Harvest 100 Volatile Cytoplasm", 
          done: completedTasks["Harvest 100 Volatile Cytoplasm"] || (octaveCurrency[7] || 0) >= 100,
          details: [
            "In Octave 7 look for glowing organic blobs drifting through the fluid (see preview).",
            "They pulse and wobble slowly — shoot them to burst and release dust.",
            "Collect the rose-red orbs. You need 100 units.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 7,
            label: "Volatile Cytoplasm — Octave 7",
          }
        } as SubTask
      ]
    },
    {
      title: "MILESTONE 5: PLANETARY SHIELD",
      desc: "Protect the global grid from anomalous cosmic events.",
      status: completedTasks["Align Stabilizer Frequency to HQ Shield"] ? "COMPLETED" : (completedTasks["Harvest 100 Volatile Cytoplasm"] || (octaveCurrency[7] || 0) >= 100 ? "IN PROGRESS" : "LOCKED"),
      avatar: "/game_assets/avatars/commander_blackman_8bit.png",
      commander: "THE ARCHITECT",
      comp: 5,
      color: "#a855f7",
      day: "Day 14",
      subTasks: [
        { 
          label: "Build Shield Generator at HQ", 
          done: completedTasks["Build Shield Generator at HQ"] || buildings.some(b => b.category === "Shield Generator"),
          details: [
            "Fly to Earth and press [B] to open the builder.",
            "Select 'Shield Generator' from the Defence category.",
            "Place it adjacent to your Headquarters tile to connect it.",
          ],
          preview: {
            type: 'keybind',
            key: 'B',
            label: "Open Builder",
          }
        } as SubTask,
        {
          label: "Overclock Shield to Level 2",
          done: completedTasks["Overclock Shield to Level 2"] || (inventory?.shieldLevel || 0) >= 2,
          details: [
            "Visit the Global Marketplace at a Base station.",
            "Upgrade your ship's deflector using Volatile Cytoplasm as fuel.",
          ],
          preview: {
            type: 'image',
            src: '/game_assets/items/modulator_8bit.png',
            label: "Shield Modulator — Level 2",
          }
        } as SubTask,
        { 
          label: "Warp down to Octave 4", 
          done: completedTasks["Warp down to Octave 4"] || activeOctave <= 4,
          details: [
            "Fly into the Meroitic Portal to dive deeper.",
            "Select Octave 4 — Electron Orbitals on the navigator.",
            "Objects at this scale look like molecular bond clusters.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 4,
            label: "Electron Orbital — Octave 4",
          }
        } as SubTask,
        { 
          label: "Mine 500 Isotopic Strontium", 
          done: completedTasks["Mine 500 Isotopic Strontium"] || (octaveCurrency[4] || 0) >= 500,
          details: [
            "In Octave 4 the asteroids appear as purple molecular bond clusters (see preview).",
            "Shoot the clusters — they release glowing purple dust orbs.",
            "Collect 500 units. This takes time — fly efficiently.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 4,
            label: "Isotopic Strontium — Octave 4",
          }
        } as SubTask,
        { 
          label: "Build Sub-Atomic Stabilizer Node", 
          done: completedTasks["Build Sub-Atomic Stabilizer Node"] || buildings.some(b => b.category === "Stabilizer Node"),
          details: [
            "Return to Earth after mining Strontium.",
            "Press [B] and place the Stabilizer Node near HQ.",
          ],
          preview: {
            type: 'keybind',
            key: 'B',
            label: "Open Builder",
          }
        } as SubTask,
        {
          label: "Align Stabilizer Frequency to HQ Shield",
          done: completedTasks["Align Stabilizer Frequency to HQ Shield"],
          details: [
            "Open the Grid Interface from the HQ building panel.",
            "Select the Stabilizer Node and activate Frequency Link.",
            "A signal arc will confirm the connection.",
          ],
          preview: {
            type: 'canvas_building',
            label: "Frequency Alignment",
          }
        } as SubTask
      ]
    },
    {
      title: "MILESTONE 6: DYSON LATTICE",
      desc: "Harness the power of the stars at a macroscopic level.",
      status: completedTasks["Align Stellar Microwave Emitters"] ? "COMPLETED" : (completedTasks["Align Stabilizer Frequency to HQ Shield"] ? "IN PROGRESS" : "LOCKED"),
      avatar: "/game_assets/avatars/commander_blackman_8bit.png",
      commander: "THE ARCHITECT",
      comp: 6,
      color: "#f43f5e",
      day: "Day 20+",
      subTasks: [
        { 
          label: "Warp up to Octave 13", 
          done: completedTasks["Warp up to Octave 13"] || activeOctave >= 13,
          details: [
            "Fly into the outer boundary warp ring to ascend.",
            "Select Octave 13 — Constellations on the navigator.",
            "At this scale, asteroids are enormous dark-crimson platonic rocks.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 13,
            label: "Astrocluster — Octave 13",
          }
        } as SubTask,
        { 
          label: "Mine 10,000 Oort Materials", 
          done: completedTasks["Mine 10,000 Oort Materials"] || (octaveCurrency[13] || 0) >= 10000,
          details: [
            "In Octave 13 asteroids are large crimson polyhedral rocks (see preview).",
            "Each rock is worth more — prioritise the largest Tier 4–5 solids.",
            "10,000 units is a grind. Use missile ships for faster clearing.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 13,
            label: "Oort Rock — Octave 13",
          }
        } as SubTask,
        {
          label: "Overclock Shield to Level 3",
          done: completedTasks["Overclock Shield to Level 3"] || (inventory?.shieldLevel || 0) >= 3,
          details: [
            "Upgrade at the Marketplace using Isotopic Strontium.",
            "Level 3 shield is required to survive sub-atomic radiation in Octave 1.",
          ],
          preview: {
            type: 'image',
            src: '/game_assets/items/modulator_8bit.png',
            label: "Shield Modulator — Level 3",
          }
        } as SubTask,
        { 
          label: "Warp down to Octave 1", 
          done: completedTasks["Warp down to Octave 1"] || activeOctave <= 1,
          details: [
            "Dive all the way to the sub-atomic realm via the Meroitic Portal.",
            "Select Octave 1 — Quantum Foam on the navigator.",
            "Objects here appear as fuzzy, rapidly oscillating blue circles.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 1,
            label: "Quantum Foam — Octave 1",
          }
        } as SubTask,
        { 
          label: "Harvest 50 Primordial Foam", 
          done: completedTasks["Harvest 50 Primordial Foam"] || (octaveCurrency[1] || 0) >= 50,
          details: [
            "In Octave 1, look for fuzzy, oscillating blue spheres (see preview).",
            "Their outlines shimmer and shift — they are hard to target. Use area weapons.",
            "Collect 50 units of the cyan dust they release.",
          ],
          preview: {
            type: 'canvas_asteroid',
            octave: 1,
            label: "Primordial Foam — Octave 1",
          }
        } as SubTask,
        {
          label: "Maintain Rank 5 Global Grid Efficiency",
          done: completedTasks["Maintain Rank 5 Global Grid Efficiency"],
          details: [
            "Ensure Power Plants, Farms, and Factories are all operational.",
            "Check efficiency in the Colony Dashboard — all bars must be at maximum.",
            "Build more infrastructure if efficiency is below Rank 5.",
          ],
          preview: {
            type: 'canvas_building',
            label: "Grid Efficiency Rank 5",
          }
        } as SubTask,
        {
          label: "Build Dyson Node Lattice Frame",
          done: completedTasks["Build Dyson Node Lattice Frame"] || buildings.some(b => b.category === "Dyson Node"),
          details: [
            "Return to Octave 11 and press [B] at the stellar body.",
            "Select 'Dyson Node' from the Megastructure category.",
            "Place multiple nodes around the sun's perimeter to form the lattice.",
          ],
          preview: {
            type: 'keybind',
            key: 'B',
            label: "Open Builder — Dyson Node",
          }
        } as SubTask,
        {
          label: "Align Stellar Microwave Emitters",
          done: completedTasks["Align Stellar Microwave Emitters"],
          details: [
            "Open the Dyson Node panel and select Frequency Synchronise.",
            "All nodes must be aligned simultaneously — a pulsing arc will confirm.",
            "This completes the Dyson Lattice and finishes the campaign.",
          ],
          preview: {
            type: 'canvas_building',
            label: "Emitter Alignment",
          }
        } as SubTask
      ]
    }
  ], [octaveCurrency, buildings, inventory, activeOctave, completedTasks, distressStatus]);
}
