/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                         ALLIANCES GAME ENGINE                       ║
 * ║                         src/lib/GameEngine.ts                       ║
 * ║                                                                      ║
 * ║  Single source of truth for all game state, decisions, and I/O.     ║
 * ║  All faction AIs, UI components, and match systems call this.        ║
 * ║  Nothing talks to the database or catalogs directly.                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

// ── Type Definitions ────────────────────────────────────────────────────────

export type Doctrine = 'JOUSTER' | 'KITER' | 'BRAWLER' | 'FLANKER' | 'DRIFTER' | 'SENTINEL';
export type MatchResult = 'win' | 'loss' | 'draw' | 'perfectVictory';
export type ArcId = 'venus-protocol' | 'forge-sequence' | 'breakout' | 'alliance-formation';
export type FactionPersonality = 'aggressive' | 'economic' | 'defensive' | 'adaptive';
export type BondAxis = 'trust' | 'debt' | 'respect' | 'tension';

export interface ShipConfig {
  id: number;
  doctrine: Doctrine;
  speed: number;
  rotSpeed: number;
  hp: number;
  equipment: string[]; // equipment item IDs
}

export interface BondPair {
  trust: number;
  debt: number;
  respect: number;
  tension: number;
  note?: string;
}

export interface BondMatrix {
  howard_butterworth: BondPair;
  howard_civilians: BondPair;
  butterworth_civilians: BondPair;
  [key: string]: BondPair; // faction-to-faction bonds
}

export interface ArcState {
  activeArcId: ArcId;
  currentAct: string;
  phase: number;
  matchCount: number;
  matchesRequired: number;
  civiliansAlive: number;
  civiliansDelivered: number;
  baseAlphaBuilt: boolean;
  shipIntegrity: number;
  completedArcs: ArcId[];
  announcerQueue: string[];
}

export interface OctaveCurrency {
  [octave: string]: number;
}

export interface EmpireResources {
  energy: number;
  food: number;
  science: number;
  population: number;
  troops: number;
  [key: string]: number;
}

export interface Building {
  id: string;
  planetName: string;
  category: string;
  tier: number;
  q: number;
  r: number;
  constructionEnd: number;
}

export interface Cost {
  octave_11?: number;
  octave_12?: number;
  octave_13?: number;
  energy?: number;
  food?: number;
  science?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  tier: number;
  category: string;
  slot: string;
  octaveRequirement: number;
  arcUnlock: ArcId;
  description: string;
  stats: Record<string, number | boolean>;
  cost: Cost;
  buildTime: number;
  requires?: string;
}

export interface FactionConfig {
  id: string;
  name: string;
  personality: FactionPersonality;
  accentColor: string;
  profileKey?: string; // key in profiles.json, or null for NPC-only factions
}

export interface Faction {
  config: FactionConfig;
  fleet: ShipConfig[];
  resources: OctaveCurrency;
  bondMatrix: Record<string, BondPair>;
}

export interface MatchContext {
  matchId: string;
  factionA: Faction;
  factionB: Faction;
  arcPhase: ArcId;
  startedAt: number;
}

export interface MatchSummary {
  matchId: string;
  result: MatchResult;
  winner: string;
  cargoA: number;
  cargoB: number;
  killsA: number;
  killsB: number;
  bondDeltas: Record<string, Partial<BondPair>>;
  currencyEarned: OctaveCurrency;
  arcPhase: ArcId;
  completedAt: number;
}

export interface ArcEvent {
  type: 'arcComplete' | 'arcUnlock' | 'bondThreshold' | 'announcer';
  arcId?: ArcId;
  message?: string;
  announcerLine?: string;
}

export interface GameState {
  activeProfileId: string;
  bondMatrix: BondMatrix;
  arcState: ArcState;
  octaveCurrency: OctaveCurrency;
  empireResources: EmpireResources;
  buildings: Building[];
  unlockedTechs: string[];
  unlockedEquipment: string[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_GAME_STATE = '/api/gameState';
const API_CMS        = '/api/cms';

const ARC_CHAIN: ArcId[] = ['venus-protocol', 'forge-sequence', 'breakout', 'alliance-formation'];

const ARC_MATCHES_REQUIRED: Record<ArcId, number> = {
  'venus-protocol':    3,
  'forge-sequence':    5,
  'breakout':          2,
  'alliance-formation': 10,
};

const ARC_ANNOUNCER_LINES: Record<ArcId, string[]> = {
  'venus-protocol': [
    'Base Camp Alpha is — and I use this term loosely — structurally sound.',
    'Twenty civilians are now not dying. Howard considers this adequate.',
    'Butterworth has filed a base camp establishment report. To no one. He filed it anyway.',
  ],
  'forge-sequence': [
    'The ship is not beautiful. Howard has said this several times.',
    'Butterworth has named it. Howard has refused to acknowledge the name.',
    'It will fly. Probably.',
  ],
  'breakout': [
    'They made it. Howard will not discuss it.',
    'Butterworth wrote the full report. It runs to forty-seven pages.',
    'None of the civilians have thanked Howard either. The feeling is mutual.',
  ],
  'alliance-formation': [
    'Alliance Zero is operational. Sci Eve has not celebrated this.',
    'Howard has new ships. He has opinions about all of them.',
    'Butterworth is already filing the formation paperwork.',
  ],
};

const DEFAULT_BOND_DELTAS: Record<MatchResult, Record<string, Partial<BondPair>>> = {
  win: {
    howard_butterworth:    { trust: 5,  debt: -3, tension: -2, respect: 3  },
    howard_civilians:      { trust: 2,  respect: 2  },
    butterworth_civilians: { trust: 3,  debt: -5, respect: 4  },
  },
  loss: {
    howard_butterworth:    { trust: -3, tension: 8,  debt: 5   },
    howard_civilians:      { trust: -4, tension: 5   },
    butterworth_civilians: { trust: -2, debt: 8,  tension: 4   },
  },
  draw: {
    howard_butterworth:    { tension: 3  },
    howard_civilians:      {},
    butterworth_civilians: { tension: 2  },
  },
  perfectVictory: {
    howard_butterworth:    { trust: 10, debt: -8,  tension: -5, respect: 8  },
    howard_civilians:      { trust: 6,  respect: 8  },
    butterworth_civilians: { trust: 6,  debt: -12, respect: 6  },
  },
};

const CURRENCY_YIELD: Record<ArcId, Record<MatchResult, OctaveCurrency>> = {
  'venus-protocol':    { win: {octave_11:150}, loss: {octave_11:50},  draw: {octave_11:80},  perfectVictory: {octave_11:300} },
  'forge-sequence':    { win: {octave_11:250,octave_12:20}, loss: {octave_11:80}, draw: {octave_11:130}, perfectVictory: {octave_11:500,octave_12:50} },
  'breakout':          { win: {octave_11:400,octave_12:60}, loss: {octave_11:100,octave_12:10}, draw: {octave_11:200,octave_12:30}, perfectVictory: {octave_11:800,octave_12:150} },
  'alliance-formation':{ win: {octave_11:600,octave_12:100,octave_13:10}, loss: {octave_11:150,octave_12:20}, draw: {octave_11:300,octave_12:50}, perfectVictory: {octave_11:1200,octave_12:250,octave_13:30} },
};

// ── GameEngine Singleton ─────────────────────────────────────────────────────

class GameEngine {
  private static _instance: GameEngine;

  private _state: GameState | null = null;
  private _equipment: EquipmentItem[] = [];
  private _progressionMatrix: Record<string, unknown> = {};
  private _factions: Map<string, Faction> = new Map();
  private _matchHistory: MatchSummary[] = [];
  private _initialized = false;

  private constructor() {}

  static getInstance(): GameEngine {
    if (!GameEngine._instance) {
      GameEngine._instance = new GameEngine();
    }
    return GameEngine._instance;
  }

  // ── Initialization ───────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (this._initialized) return;
    await Promise.all([
      this._loadState(),
      this._loadEquipmentCatalog(),
      this._loadProgressionMatrix(),
    ]);
    this._initialized = true;
    console.log('[GameEngine] Initialized. Arc:', this._state?.arcState.activeArcId,
      '| Civilians:', this._state?.arcState.civiliansAlive);
  }

  private async _loadState(): Promise<void> {
    try {
      const res = await fetch(API_GAME_STATE);
      const raw = await res.json();
      const profile = raw.profiles?.[raw.activeProfileId] ?? {};
      this._state = {
        activeProfileId: raw.activeProfileId ?? 'player_1',
        bondMatrix: profile.bondMatrix ?? {
          howard_butterworth:    { trust: 40, debt: 40, respect: 45, tension: 25 },
          howard_civilians:      { trust: 30, debt: 0,  respect: 20, tension: 10 },
          butterworth_civilians: { trust: 55, debt: 60, respect: 50, tension: 15 },
        },
        arcState: profile.arcState ?? {
          activeArcId: 'venus-protocol',
          currentAct: 'ACT I',
          phase: 1,
          matchCount: 0,
          matchesRequired: 3,
          civiliansAlive: 20,
          civiliansDelivered: 0,
          baseAlphaBuilt: false,
          shipIntegrity: 0,
          completedArcs: [],
          announcerQueue: [],
        },
        octaveCurrency:  profile.octaveCurrency ?? { '11': 0, '12': 0, '13': 0 },
        empireResources: profile.empireResources ?? { energy: 1000, food: 500, science: 200, population: 20, troops: 5 },
        buildings:       profile.buildings ?? [],
        unlockedTechs:   profile.unlockedTechs ?? [],
        unlockedEquipment: profile.unlockedEquipment ?? [],
      };
    } catch (e) {
      console.error('[GameEngine] Failed to load state:', e);
      // Provide an offline fallback so the engine can still run
      this._state = {
        activeProfileId: 'player_1',
        bondMatrix: {
          howard_butterworth:    { trust: 40, debt: 40, respect: 45, tension: 25 },
          howard_civilians:      { trust: 30, debt: 0,  respect: 20, tension: 10 },
          butterworth_civilians: { trust: 55, debt: 60, respect: 50, tension: 15 },
        },
        arcState: {
          activeArcId: 'venus-protocol', currentAct: 'ACT I', phase: 1,
          matchCount: 0, matchesRequired: 3, civiliansAlive: 20,
          civiliansDelivered: 0, baseAlphaBuilt: false, shipIntegrity: 0,
          completedArcs: [], announcerQueue: [],
        },
        octaveCurrency: { '11': 0, '12': 0, '13': 0 },
        empireResources: { energy: 1000, food: 500, science: 200, population: 20, troops: 5 },
        buildings: [], unlockedTechs: [], unlockedEquipment: [],
      };
    }
  }


  private async _loadEquipmentCatalog(): Promise<void> {
    try {
      const res = await fetch('/api/cms?key=equipment_catalog');
      const json = await res.json();
      if (json.success && json.data) {
        const catalog = json.data;
        this._equipment = [
          ...(catalog.weapons || []),
          ...(catalog.engines || []),
          ...(catalog.shields || []),
          ...(catalog.cargo   || []),
          ...(catalog.sensors || []),
          ...(catalog.doctrineUpgrades || []),
        ];
      }
    } catch (e) {
      console.error('[GameEngine] Failed to load equipment catalog:', e);
    }
  }

  private async _loadProgressionMatrix(): Promise<void> {
    try {
      const res = await fetch('/api/cms?key=progression_matrix');
      const json = await res.json();
      if (json.success && json.data) {
        this._progressionMatrix = json.data as Record<string, unknown>;
      }
    } catch (e) {
      console.error('[GameEngine] Failed to load progression matrix:', e);
    }
  }

  // ── State Accessors ──────────────────────────────────────────────────────

  getState(): GameState | null { return this._state; }

  getBondMatrix(): BondMatrix | null { return this._state?.bondMatrix ?? null; }

  getArcState(): ArcState | null { return this._state?.arcState ?? null; }

  getBondValue(pair: string, axis: BondAxis): number {
    return (this._state?.bondMatrix?.[pair] as any)?.[axis] ?? 0;
  }

  getOctaveCurrency(): OctaveCurrency { return this._state?.octaveCurrency ?? {}; }

  getBuildings(planetName?: string): Building[] {
    const all = this._state?.buildings ?? [];
    return planetName ? all.filter(b => b.planetName === planetName) : all;
  }

  getMatchHistory(): MatchSummary[] { return this._matchHistory; }

  // ── Equipment & Catalog ──────────────────────────────────────────────────

  /** All equipment available for the current arc phase */
  getAvailableEquipment(): EquipmentItem[] {
    const arc = this._state?.arcState.activeArcId ?? 'venus-protocol';
    const arcIndex = ARC_CHAIN.indexOf(arc);
    return this._equipment.filter(item => ARC_CHAIN.indexOf(item.arcUnlock) <= arcIndex);
  }

  getEquipmentById(id: string): EquipmentItem | undefined {
    return this._equipment.find(e => e.id === id);
  }

  getEquipmentByCategory(category: string): EquipmentItem[] {
    return this.getAvailableEquipment().filter(e => e.category === category);
  }

  /** Calculates final cost with tier + arc multipliers from progression matrix */
  calculateCost(item: EquipmentItem): Cost {
    const matrix = this._progressionMatrix as any;
    const arc = this._state?.arcState.activeArcId ?? 'venus-protocol';
    const tierMod = matrix?.tierMultipliers?.[String(item.tier)] ?? 1;
    const arcMod  = matrix?.arcPhaseModifiers?.[arc]?.costMod ?? 1;
    const result: Cost = {};
    for (const [key, val] of Object.entries(item.cost)) {
      result[key as keyof Cost] = Math.ceil((val as number) * tierMod * arcMod);
    }
    return result;
  }

  // ── Economy ──────────────────────────────────────────────────────────────

  canAfford(cost: Cost): boolean {
    const currency = this._state?.octaveCurrency ?? {};
    const resources = this._state?.empireResources ?? {};
    for (const [key, amount] of Object.entries(cost)) {
      if (key.startsWith('octave_')) {
        const octave = key.split('_')[1];
        if ((currency[octave] ?? 0) < (amount ?? 0)) return false;
      } else {
        if (((resources as Record<string, number>)[key] ?? 0) < (amount ?? 0)) return false;
      }
    }
    return true;
  }

  private _deductCost(cost: Cost): void {
    if (!this._state) return;
    for (const [key, amount] of Object.entries(cost)) {
      if (key.startsWith('octave_')) {
        const octave = key.split('_')[1];
        this._state.octaveCurrency[octave] = (this._state.octaveCurrency[octave] ?? 0) - (amount ?? 0);
      } else {
        this._state.empireResources[key] = (this._state.empireResources[key] ?? 0) - (amount ?? 0);
      }
    }
  }

  private _addCurrency(earned: OctaveCurrency): void {
    if (!this._state) return;
    for (const [octave, amount] of Object.entries(earned)) {
      this._state.octaveCurrency[octave] = (this._state.octaveCurrency[octave] ?? 0) + amount;
    }
  }

  // ── Bond Matrix ──────────────────────────────────────────────────────────

  applyBondDeltas(deltas: Record<string, Partial<BondPair>>): void {
    if (!this._state?.bondMatrix) return;
    for (const [pair, delta] of Object.entries(deltas)) {
      if (!this._state.bondMatrix[pair]) continue;
      for (const [axis, change] of Object.entries(delta)) {
        const current = (this._state.bondMatrix[pair] as any)[axis] ?? 0;
        (this._state.bondMatrix[pair] as any)[axis] =
          Math.max(-100, Math.min(100, current + (change ?? 0)));
      }
    }
  }

  /** Returns any bond pairs that have crossed a notable threshold */
  checkBondThresholds(): ArcEvent[] {
    const events: ArcEvent[] = [];
    const bm = this._state?.bondMatrix;
    if (!bm) return events;

    // Forge sequence unlock: howard_butterworth trust >= 55
    if (bm.howard_butterworth.trust >= 55
        && this._state?.arcState.activeArcId === 'venus-protocol') {
      events.push({ type: 'arcUnlock', arcId: 'forge-sequence',
        message: 'Trust threshold reached. Forge Sequence unlocked.' });
    }
    // Breakout unlock: trust >= 70 OR debt <= 20
    if ((bm.howard_butterworth.trust >= 70 || bm.howard_butterworth.debt <= 20)
        && this._state?.arcState.activeArcId === 'forge-sequence') {
      events.push({ type: 'arcUnlock', arcId: 'breakout',
        message: 'Partnership proven. Breakout arc unlocked.' });
    }
    // Crisis: tension >= 90
    if (bm.howard_butterworth.tension >= 90) {
      events.push({ type: 'bondThreshold',
        message: 'CRISIS: Howard and Butterworth are at breaking point.',
        announcerLine: 'Something is about to be said that cannot be unsaid. The mission continues regardless.' });
    }
    return events;
  }

  // ── Match Flow ───────────────────────────────────────────────────────────

  startMatch(factionA: Faction, factionB: Faction): MatchContext {
    const matchId = `match_${Date.now()}`;
    const arcPhase = this._state?.arcState.activeArcId ?? 'venus-protocol';
    console.log(`[GameEngine] Match started: ${factionA.config.name} vs ${factionB.config.name} | Arc: ${arcPhase}`);
    return { matchId, factionA, factionB, arcPhase, startedAt: Date.now() };
  }

  /** Call this when a match ends. Updates all state and persists. */
  async resolveMatch(ctx: MatchContext, result: MatchResult, stats: {
    cargoA: number; cargoB: number; killsA: number; killsB: number;
  }): Promise<{ summary: MatchSummary; events: ArcEvent[] }> {
    const arc = ctx.arcPhase;
    const deltas = DEFAULT_BOND_DELTAS[result];
    const earned = CURRENCY_YIELD[arc]?.[result] ?? {};

    // Apply to state
    this.applyBondDeltas(deltas);
    this._addCurrency(earned);
    if (this._state?.arcState) {
      this._state.arcState.matchCount = (this._state.arcState.matchCount ?? 0) + 1;
    }

    // Check for arc progression
    const bondEvents = this.checkBondThresholds();
    const arcEvents  = await this._evaluateArcProgression();
    const allEvents  = [...bondEvents, ...arcEvents];

    // Build summary
    const summary: MatchSummary = {
      matchId: ctx.matchId, result,
      winner: result === 'win' || result === 'perfectVictory' ? ctx.factionA.config.name : ctx.factionB.config.name,
      cargoA: stats.cargoA, cargoB: stats.cargoB,
      killsA: stats.killsA, killsB: stats.killsB,
      bondDeltas: deltas,
      currencyEarned: earned,
      arcPhase: arc,
      completedAt: Date.now(),
    };
    this._matchHistory.push(summary);

    // Persist to server
    await this._persist('matchComplete', { bondDeltas: deltas });

    console.log(`[GameEngine] Match resolved: ${result} | Currency: +${JSON.stringify(earned)} | Events: ${allEvents.length}`);
    return { summary, events: allEvents };
  }

  private async _evaluateArcProgression(): Promise<ArcEvent[]> {
    const arc = this._state?.arcState;
    if (!arc) return [];
    const events: ArcEvent[] = [];

    if (arc.matchCount >= arc.matchesRequired) {
      const currentIndex = ARC_CHAIN.indexOf(arc.activeArcId);
      const nextArcId = ARC_CHAIN[currentIndex + 1];

      if (nextArcId) {
        const lines = ARC_ANNOUNCER_LINES[arc.activeArcId];
        // Queue announcer lines for current arc completion
        if (this._state) {
          this._state.arcState.announcerQueue = [...lines];
        }
        events.push({
          type: 'arcComplete',
          arcId: arc.activeArcId,
          announcerLine: lines[0],
          message: `${arc.activeArcId} complete. ${nextArcId} available.`,
        });
      }
    }
    return events;
  }

  /** Advance to the next arc in the chain */
  async advanceArc(): Promise<void> {
    const arc = this._state?.arcState;
    if (!arc) return;
    const currentIndex = ARC_CHAIN.indexOf(arc.activeArcId);
    const nextArcId = ARC_CHAIN[currentIndex + 1];
    if (!nextArcId) { console.log('[GameEngine] Already at final arc.'); return; }

    arc.completedArcs.push(arc.activeArcId);
    arc.activeArcId     = nextArcId;
    arc.phase           = currentIndex + 2;
    arc.matchCount      = 0;
    arc.matchesRequired = ARC_MATCHES_REQUIRED[nextArcId];
    arc.announcerQueue  = [];

    await this._persist('advanceArc', {
      completedArcId: ARC_CHAIN[currentIndex],
      nextArcId,
      phase: arc.phase,
      matchesRequired: arc.matchesRequired,
    });
    console.log(`[GameEngine] Arc advanced to: ${nextArcId}`);
  }

  /** Pop the next announcer line from the queue */
  dequeueAnnouncerLine(): string | null {
    const queue = this._state?.arcState.announcerQueue;
    if (!queue || queue.length === 0) return null;
    return queue.shift() ?? null;
  }

  // ── Base Building ────────────────────────────────────────────────────────

  getBuildingCost(category: string, tier: number): Cost | null {
    const matrix = this._progressionMatrix as any;
    const tierKey = `tier${tier}`;
    const raw = matrix?.buildingCosts?.[category]?.[tierKey];
    if (!raw) return null;
    const arc = this._state?.arcState.activeArcId ?? 'venus-protocol';
    const arcMod = matrix?.arcPhaseModifiers?.[arc]?.costMod ?? 1;
    const result: Cost = {};
    for (const [key, val] of Object.entries(raw)) {
      if (key === 'note' || key === 'requires') continue;
      result[key as keyof Cost] = Math.ceil((val as number) * arcMod);
    }
    return result;
  }

  placeBuilding(planetName: string, q: number, r: number, category: string, tier: number): boolean {
    const cost = this.getBuildingCost(category, tier);
    if (!cost || !this.canAfford(cost)) {
      console.warn(`[GameEngine] Cannot afford ${category} tier ${tier}`);
      return false;
    }
    this._deductCost(cost);
    const building: Building = {
      id: String(Math.random()),
      planetName, category, tier, q, r,
      constructionEnd: Date.now() + (30 * 1000), // placeholder 30s build time
    };
    this._state?.buildings.push(building);
    console.log(`[GameEngine] Placed ${category} T${tier} at ${planetName} [${q},${r}]`);
    return true;
  }

  // ── Faction Registry ─────────────────────────────────────────────────────

  registerFaction(cfg: FactionConfig): Faction {
    const faction: Faction = {
      config: cfg,
      fleet: [],
      resources: { '11': 500, '12': 0 }, // starting currency for NPC factions
      bondMatrix: {},
    };
    this._factions.set(cfg.id, faction);
    console.log(`[GameEngine] Faction registered: ${cfg.name} (${cfg.personality})`);
    return faction;
  }

  getFaction(id: string): Faction | undefined { return this._factions.get(id); }

  getAllFactions(): Faction[] { return Array.from(this._factions.values()); }

  /** Auto-configure a faction fleet based on personality */
  autoConfigureFleet(factionId: string): ShipConfig[] {
    const faction = this._factions.get(factionId);
    if (!faction) return [];

    const arc = this._state?.arcState.activeArcId ?? 'venus-protocol';
    const matrix = this._progressionMatrix as any;
    const maxShips = matrix?.shipProgression?.fleetSize?.[arc]?.maxShips ?? 3;

    const personalityDoctrine: Record<FactionPersonality, Doctrine[]> = {
      aggressive: ['JOUSTER', 'BRAWLER', 'FLANKER'],
      defensive:  ['SENTINEL', 'KITER',  'DRIFTER'],
      economic:   ['KITER',    'DRIFTER', 'SENTINEL'],
      adaptive:   ['JOUSTER',  'KITER',  'SENTINEL'],
    };

    const doctrines = personalityDoctrine[faction.config.personality];
    const fleet: ShipConfig[] = [];

    for (let i = 0; i < Math.min(maxShips, doctrines.length); i++) {
      fleet.push({
        id: i + 4, // enemy ships start at id 4
        doctrine: doctrines[i],
        speed: 0.3 + Math.random() * 0.15,
        rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.008),
        hp: 5,
        equipment: this._selectEquipmentForPersonality(faction.config.personality),
      });
    }

    faction.fleet = fleet;
    return fleet;
  }

  private _selectEquipmentForPersonality(personality: FactionPersonality): string[] {
    const available = this.getAvailableEquipment();
    const selected: string[] = [];

    const priorities: Record<FactionPersonality, string[]> = {
      aggressive: ['weapon', 'engine', 'doctrine'],
      defensive:  ['shield', 'sensor', 'hull'],
      economic:   ['cargo',  'engine', 'sensor'],
      adaptive:   ['weapon', 'shield', 'sensor'],
    };

    for (const category of priorities[personality]) {
      const options = available.filter(e => e.category === category && e.tier === 1);
      if (options[0]) selected.push(options[0].id);
    }
    return selected;
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private async _persist(action: string, extra: Record<string, unknown> = {}): Promise<void> {
    if (!this._state) return;
    try {
      await fetch(API_GAME_STATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          bondMatrix:     this._state.bondMatrix,
          arcState:       this._state.arcState,
          octaveCurrency: this._state.octaveCurrency,
          empireResources:this._state.empireResources,
          buildings:      this._state.buildings,
          ...extra,
        }),
      });
    } catch (e) {
      console.error('[GameEngine] Persist failed:', e);
    }
  }

  /** Force a full state save — call after any batch of changes */
  async save(): Promise<void> {
    await this._persist('saveState');
    console.log('[GameEngine] State saved.');
  }

  /** Full state reload from server */
  async reload(): Promise<void> {
    this._initialized = false;
    await this.init();
  }
}

// ── Export singleton ──────────────────────────────────────────────────────────

export const Engine = GameEngine.getInstance();

/**
 * USAGE EXAMPLES
 * ──────────────────────────────────────────────────────────────────────
 *
 * // Initialize (call once at app start or in a layout)
 * await Engine.init();
 *
 * // Read state
 * const bond = Engine.getBondValue('howard_butterworth', 'trust'); // → 40
 * const arc  = Engine.getArcState();                               // → { activeArcId: 'venus-protocol', ... }
 *
 * // Register an enemy faction
 * const corsairs = Engine.registerFaction({
 *   id: 'corsair_fleet', name: 'CORSAIR FLEET',
 *   personality: 'aggressive', accentColor: '#ef4444'
 * });
 * const fleet = Engine.autoConfigureFleet('corsair_fleet');
 * // → [{ id:4, doctrine:'JOUSTER', speed:0.38, ... }, ...]
 *
 * // Resolve a match
 * const ctx = Engine.startMatch(playerFaction, corsairs);
 * // ... match plays out in WaveBasedArena ...
 * const { summary, events } = await Engine.resolveMatch(ctx, 'win', {
 *   cargoA: 12, cargoB: 3, killsA: 3, killsB: 1
 * });
 * // → bond matrix updated, currency earned, arc progressed if threshold hit
 *
 * // Check for announcer lines
 * const line = Engine.dequeueAnnouncerLine();
 * // → 'Twenty civilians are now not dying. Howard considers this adequate.'
 *
 * // Get available equipment for this arc phase
 * const weapons = Engine.getEquipmentByCategory('weapon');
 *
 * // Place a building
 * Engine.placeBuilding('VENUS', 1, 0, 'Shipyard', 1);
 */
