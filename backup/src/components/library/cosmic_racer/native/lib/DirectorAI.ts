/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                           DIRECTOR AI                               ║
 * ║                        src/lib/DirectorAI.ts                        ║
 * ║                                                                      ║
 * ║  The narrative brain. Reads state from the Engine, evaluates        ║
 * ║  story triggers, generates player hints, sequences announcer lines, ║
 * ║  and produces social feed posts. Think: Left 4 Dead AI Director —   ║
 * ║  not controlling units, controlling narrative tension.               ║
 * ║                                                                      ║
 * ║  Does NOT store state. Reads from Engine, returns decisions.        ║
 * ║  The Engine executes the decisions.                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { Engine } from './GameEngine';
import type { ArcId, ArcEvent, MatchResult } from './GameEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HintCategory = 'combat' | 'economic' | 'social' | 'narrative' | 'urgent';

export interface Hint {
  id: string;
  category: HintCategory;
  priority: number;     // 1–10, 10 = urgent, drives render ordering
  headline: string;
  body: string;
  action?: string;      // CTA button label
  route?: string;       // where action takes the player
  arcId?: ArcId;
}

export interface FeedPost {
  charId: string;
  text: string;
  tags: string[];
  arcId: ArcId;
  triggerEvent: string; // what game event caused this post
  timestamp?: string;
}

export interface StoryBeat {
  id: string;
  condition: (ctx: DirectorContext) => boolean;
  once: boolean;       // fire only once per arc
  priority: number;
  announcerLines: string[];
  feedPosts: FeedPost[];
  arcEvent?: ArcEvent;
}

export interface DirectorDecision {
  arcEvents: ArcEvent[];
  hints: Hint[];
  feedPosts: FeedPost[];
  announcerLines: string[];
  beatsFired: string[];
}

interface DirectorContext {
  arcId: ArcId;
  matchCount: number;
  matchesRequired: number;
  civiliansAlive: number;
  trust_hb: number;      // howard_butterworth trust
  debt_hb: number;
  respect_hb: number;
  tension_hb: number;
  trust_hc: number;      // howard_civilians trust
  tension_hc: number;
  trust_bc: number;      // butterworth_civilians trust
  debt_bc: number;
  octave_11: number;
  octave_12: number;
  matchesWon: number;
  matchesLost: number;
  lastResult: MatchResult | null;
  buildingCount: number;
}

// ── Story Beats Database ───────────────────────────────────────────────────────
// Each beat fires when its condition is true. Once-beats are tracked to not repeat.

const STORY_BEATS: StoryBeat[] = [

  // ── VENUS PROTOCOL ────────────────────────────────────────────────────────

  {
    id: 'venus_arrival',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.matchCount === 0,
    once: true, priority: 10,
    announcerLines: [
      'Venus. Not ideal. Howard has not said this, but the implication is clear.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'Made it to Venus. This was not the plan. There was a plan.',
        tags: ['#VenusProtocol', '#NoPlan'], arcId: 'venus-protocol', triggerEvent: 'venus_arrival' },
      { charId: 'butterworth', text: 'Ship integrity assessment complete. I have assessed it. The integrity is not present.',
        tags: ['#BaseCampAlpha', '#ShipIntegrity'], arcId: 'venus-protocol', triggerEvent: 'venus_arrival' },
    ],
    arcEvent: undefined,
  },

  {
    id: 'venus_first_win',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.matchCount === 1 && ctx.lastResult === 'win',
    once: true, priority: 8,
    announcerLines: [
      'First perimeter held. Howard does not celebrate. Butterworth has already filed the report.',
    ],
    feedPosts: [
      { charId: 'butterworth', text: 'Perimeter security report filed. Threat level: manageable. Howard disagrees. Both are correct.',
        tags: ['#PerimeterReport', '#VenusProtocol'], arcId: 'venus-protocol', triggerEvent: 'venus_first_win' },
      { charId: 'civilians', text: 'We have been told the situation is under control. We are choosing to believe this.',
        tags: ['#TrustingTheProcess', '#VenusProtocol'], arcId: 'venus-protocol', triggerEvent: 'venus_first_win' },
    ],
  },

  {
    id: 'venus_first_loss',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.matchCount === 1 && ctx.lastResult === 'loss',
    once: true, priority: 9,
    announcerLines: [
      'Lost that one. The civilians noticed. They are not saying anything. They are definitely noticing.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'Match result: suboptimal. Officially attributing to environmental factors. Butterworth agrees. He is lying.',
        tags: ['#MatchReport', '#Accountability'], arcId: 'venus-protocol', triggerEvent: 'venus_first_loss' },
      { charId: 'butterworth', text: 'Civilian morale report: stable. In the sense that it has not changed. It was not high to begin with.',
        tags: ['#MoraleReport', '#VenusProtocol'], arcId: 'venus-protocol', triggerEvent: 'venus_first_loss' },
    ],
  },

  {
    id: 'venus_tension_spike',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.tension_hb >= 60,
    once: false, priority: 9,
    announcerLines: [
      'Something is building between Howard and Butterworth. Butterworth has started using full sentences. Howard has started using fewer.',
    ],
    feedPosts: [
      { charId: 'butterworth', text: 'Communication with the pilot has become efficient. In the sense that there is less of it.',
        tags: ['#TeamDynamics', '#OperationalUpdate'], arcId: 'venus-protocol', triggerEvent: 'tension_spike' },
    ],
  },

  {
    id: 'venus_trust_build',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.trust_hb >= 45 && ctx.matchCount >= 2,
    once: true, priority: 7,
    announcerLines: [
      'Something like trust is forming. Neither of them would call it that.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'Butterworth named the base. I did not ask him to name the base. The name is fine.',
        tags: ['#BaseCampAlpha', '#Unsolicited'], arcId: 'venus-protocol', triggerEvent: 'trust_build' },
    ],
  },

  {
    id: 'venus_arc_complete',
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.matchCount >= ctx.matchesRequired,
    once: true, priority: 10,
    announcerLines: [
      'Base Camp Alpha is — and I use this term loosely — structurally sound.',
      'Twenty civilians are now not dying. Howard considers this adequate.',
      'Butterworth has filed the base camp establishment report. To no one. He filed it anyway.',
    ],
    feedPosts: [
      { charId: 'butterworth', text: 'Base Camp Alpha: established. Civilian count: 20. Ship integrity: pending. Howard considers this a victory. It is.',
        tags: ['#BaseCampAlpha', '#VenusProtocol', '#ArcComplete'], arcId: 'venus-protocol', triggerEvent: 'arc_complete' },
      { charId: 'civilians', text: 'We made it. None of us understand how. We have agreed not to ask.',
        tags: ['#Survivors', '#VenusProtocol'], arcId: 'venus-protocol', triggerEvent: 'arc_complete' },
    ],
    arcEvent: { type: 'arcComplete', arcId: 'venus-protocol', message: 'Venus Protocol complete. Forge Sequence unlocking.' },
  },

  // ── FORGE SEQUENCE ────────────────────────────────────────────────────────

  {
    id: 'forge_begins',
    condition: ctx => ctx.arcId === 'forge-sequence' && ctx.matchCount === 0,
    once: true, priority: 10,
    announcerLines: [
      'The ship will not build itself. Howard has been informed of this.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'New arc. New problem. Same planet. Same Butterworth.',
        tags: ['#ForgeSequence', '#BuildPhase'], arcId: 'forge-sequence', triggerEvent: 'forge_begins' },
      { charId: 'butterworth', text: 'Shipyard construction has commenced. I have a plan. Howard has questions about the plan. The plan is sound.',
        tags: ['#Shipyard', '#ForgeSequence'], arcId: 'forge-sequence', triggerEvent: 'forge_begins' },
    ],
  },

  {
    id: 'forge_ship_progress',
    condition: ctx => ctx.arcId === 'forge-sequence' && ctx.matchCount === 2,
    once: true, priority: 7,
    announcerLines: [
      'The ship is not beautiful. Howard has said this several times.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'Hull is taking shape. It is a shape. Whether it is the right shape is a Butterworth question.',
        tags: ['#ShipBuild', '#ForgeSequence'], arcId: 'forge-sequence', triggerEvent: 'ship_progress' },
    ],
  },

  // ── ALLIANCE FORMATION ────────────────────────────────────────────────────

  {
    id: 'alliance_zero_forms',
    condition: ctx => ctx.arcId === 'alliance-formation' && ctx.matchCount === 0,
    once: true, priority: 10,
    announcerLines: [
      'Alliance Zero is operational. Sci Eve has not celebrated.',
      'There will be no celebration. There is work.',
    ],
    feedPosts: [
      { charId: 'scieve', text: 'Alliance Zero is operational. There will be no celebration. There is work.',
        tags: ['#AllianceZero', '#Alliance-Formation'], arcId: 'alliance-formation', triggerEvent: 'alliance_forms' },
      { charId: 'howard', text: 'We have an alliance. I have thoughts about alliances. Butterworth has talked me out of sharing them.',
        tags: ['#AllianceZero', '#Howard'], arcId: 'alliance-formation', triggerEvent: 'alliance_forms' },
    ],
  },

  // ── CROSS-ARC BEATS ───────────────────────────────────────────────────────

  {
    id: 'crisis_tension',
    condition: ctx => ctx.tension_hb >= 85,
    once: false, priority: 10,
    announcerLines: [
      'Something is about to be said that cannot be unsaid. The mission continues regardless.',
      'Howard and Butterworth have not spoken in some time. Butterworth has filed a report about this.',
    ],
    feedPosts: [
      { charId: 'butterworth', text: 'Communication protocols are under review. This is a procedural statement. Everything is fine.',
        tags: ['#TeamDynamics', '#OperationalUpdate'], arcId: 'venus-protocol', triggerEvent: 'crisis_tension' },
    ],
  },

  {
    id: 'perfect_victory',
    condition: ctx => ctx.lastResult === 'perfectVictory',
    once: false, priority: 8,
    announcerLines: [
      'Not a single enemy ship survived. Howard has filed no report about this. He does not need to.',
    ],
    feedPosts: [
      { charId: 'howard', text: 'Match result: complete. Nothing survived. I have thoughts about this. They are not complicated thoughts.',
        tags: ['#PerfectVictory', '#MatchReport'], arcId: 'venus-protocol', triggerEvent: 'perfect_victory' },
    ],
  },
];

// ── Hint Library ───────────────────────────────────────────────────────────────
// Rule-based hints indexed by game state condition.

const HINT_RULES: Array<{
  condition: (ctx: DirectorContext) => boolean;
  hint: Hint;
}> = [

  // ── Urgent ────────────────────────────────────────────────────────────────

  {
    condition: ctx => ctx.tension_hb >= 85,
    hint: {
      id: 'hint_crisis',
      category: 'urgent', priority: 10,
      headline: 'RELATIONSHIP CRISIS',
      body: 'Howard and Butterworth are at a breaking point. Tension is critical. Win your next match — a shared victory is the only thing that resets it.',
      action: 'Go to Arena',
      route: '/science/cosmic_racers?tab=combat%20arena',
    },
  },

  {
    condition: ctx => ctx.civiliansAlive < 15 && ctx.arcId === 'venus-protocol',
    hint: {
      id: 'hint_civilians_critical',
      category: 'urgent', priority: 9,
      headline: 'CIVILIAN LOSSES',
      body: `Only ${0} civilians remaining. Losing more risks arc failure. Prioritize defensive fleet builds with cargo recovery.`,
      action: 'Fleet Garage',
      route: '/science/cosmic_racers?tab=combat%20arena',
    },
  },

  // ── Narrative ─────────────────────────────────────────────────────────────

  {
    condition: ctx => ctx.arcId === 'venus-protocol' && ctx.matchCount === 0,
    hint: {
      id: 'hint_welcome',
      category: 'narrative', priority: 8,
      headline: 'VENUS PROTOCOL — ACT I',
      body: 'Howard and Butterworth have crash-landed on Venus with 20 civilians. Secure the perimeter. Win 3 matches to establish Base Camp Alpha.',
      action: 'Start First Match',
      route: '/science/cosmic_racers?tab=combat%20arena',
      arcId: 'venus-protocol',
    },
  },

  {
    condition: ctx => ctx.matchCount === ctx.matchesRequired - 1,
    hint: {
      id: 'hint_one_more',
      category: 'narrative', priority: 8,
      headline: 'ONE MATCH TO ARC COMPLETION',
      body: 'One more match completes the current arc. A win here earns full arc currency bonus and advances the story.',
      action: 'Fight',
      route: '/science/cosmic_racers?tab=combat%20arena',
    },
  },

  {
    condition: ctx => ctx.trust_hb >= 50 && ctx.arcId === 'venus-protocol',
    hint: {
      id: 'hint_forge_unlock',
      category: 'narrative', priority: 7,
      headline: 'FORGE SEQUENCE APPROACHING',
      body: 'Trust between Howard and Butterworth is strong enough to attempt the shipyard. Complete the Venus arc to unlock Forge Sequence.',
      arcId: 'forge-sequence',
    },
  },

  // ── Economic ──────────────────────────────────────────────────────────────

  {
    condition: ctx => ctx.octave_11 >= 300 && ctx.buildingCount === 0,
    hint: {
      id: 'hint_build_base',
      category: 'economic', priority: 7,
      headline: 'BUILD YOUR BASE',
      body: 'You have currency but no base buildings. A Command Post or Shipyard on Venus unlocks passive income and fleet upgrades.',
      action: 'Planet Surface',
      route: '/science/cosmic_racers?tab=planet%20fx',
    },
  },

  {
    condition: ctx => ctx.octave_11 >= 500,
    hint: {
      id: 'hint_shop',
      category: 'economic', priority: 6,
      headline: 'UPGRADE YOUR FLEET',
      body: 'You have 500+ Octave-11 currency. Visit the equipment shop to upgrade weapons, shields, or engines before your next match.',
      action: 'Equipment Shop',
      route: '/science/engine',
    },
  },

  {
    condition: ctx => ctx.octave_11 < 100 && ctx.matchesLost > ctx.matchesWon,
    hint: {
      id: 'hint_struggling',
      category: 'economic', priority: 6,
      headline: 'EARNING IS SLOW',
      body: 'Currency is low and losses are mounting. Switch to a cargo-focused fleet doctrine (DRIFTER or KITER) to maximize dust collection even in defeat.',
      action: 'Fleet Garage',
      route: '/science/cosmic_racers?tab=combat%20arena',
    },
  },

  // ── Combat ────────────────────────────────────────────────────────────────

  {
    condition: ctx => ctx.matchesLost >= 3 && ctx.matchesWon === 0,
    hint: {
      id: 'hint_three_losses',
      category: 'combat', priority: 8,
      headline: 'LOSING STREAK — ADAPT',
      body: 'Three straight losses with no wins. The enemy is reading your doctrine. Try switching all three ships to SENTINEL to force a defensive reset.',
      action: 'Change Fleet',
      route: '/science/cosmic_racers?tab=combat%20arena',
    },
  },

  {
    condition: ctx => ctx.matchesLost === 0 && ctx.matchesWon >= 2,
    hint: {
      id: 'hint_winning_streak',
      category: 'combat', priority: 4,
      headline: 'PERFORMING WELL',
      body: 'Clean sweep. Consider pushing to higher-tier equipment to maintain this pace into the next arc — enemies get harder.',
      action: 'Engine Hub',
      route: '/science/engine',
    },
  },

  // ── Social ────────────────────────────────────────────────────────────────

  {
    condition: ctx => ctx.trust_hb < 25,
    hint: {
      id: 'hint_bond_low',
      category: 'social', priority: 7,
      headline: 'BOND DETERIORATING',
      body: 'Howard and Butterworth\'s trust is critically low. Consecutive wins — especially perfect victories — are the fastest recovery path.',
      action: 'Character Feed',
      route: '/science/social',
    },
  },

  {
    condition: ctx => ctx.debt_bc >= 70,
    hint: {
      id: 'hint_civilian_debt',
      category: 'social', priority: 6,
      headline: 'CIVILIAN DEBT HIGH',
      body: 'The civilians feel owed — Butterworth has over-promised and under-delivered. Winning matches with high cargo returns resets this debt.',
      action: 'Social Feed',
      route: '/science/social',
    },
  },
];

// Tracking fired beats in memory per session
const _firedBeatsInMemory = new Set<string>();

function getFiredBeats(): Set<string> {
  return _firedBeatsInMemory;
}

function markBeatFired(beatId: string): void {
  _firedBeatsInMemory.add(beatId);
}

// ── DirectorAI Class ──────────────────────────────────────────────────────────

class DirectorAIEngine {
  private static _instance: DirectorAIEngine;
  private _matchesWon  = 0;
  private _matchesLost = 0;
  private _lastResult: MatchResult | null = null;
  private _pendingFeedPosts: FeedPost[] = [];
  private _pendingHints: Hint[] = [];

  private constructor() {}

  static getInstance(): DirectorAIEngine {
    if (!DirectorAIEngine._instance) {
      DirectorAIEngine._instance = new DirectorAIEngine();
    }
    return DirectorAIEngine._instance;
  }

  // ── Context Builder ───────────────────────────────────────────────────────

  private _buildContext(): DirectorContext | null {
    const state    = Engine.getState();
    const arc      = Engine.getArcState();
    const bonds    = Engine.getBondMatrix();
    const currency = Engine.getOctaveCurrency();
    const buildings = Engine.getBuildings();

    if (!state || !arc || !bonds) return null;

    return {
      arcId:           arc.activeArcId,
      matchCount:      arc.matchCount,
      matchesRequired: arc.matchesRequired,
      civiliansAlive:  arc.civiliansAlive,
      trust_hb:        bonds.howard_butterworth?.trust ?? 40,
      debt_hb:         bonds.howard_butterworth?.debt ?? 40,
      respect_hb:      bonds.howard_butterworth?.respect ?? 45,
      tension_hb:      bonds.howard_butterworth?.tension ?? 25,
      trust_hc:        bonds.howard_civilians?.trust ?? 30,
      tension_hc:      bonds.howard_civilians?.tension ?? 10,
      trust_bc:        bonds.butterworth_civilians?.trust ?? 55,
      debt_bc:         bonds.butterworth_civilians?.debt ?? 60,
      octave_11:       currency['11'] ?? 0,
      octave_12:       currency['12'] ?? 0,
      matchesWon:      this._matchesWon,
      matchesLost:     this._matchesLost,
      lastResult:      this._lastResult,
      buildingCount:   buildings.length,
    };
  }

  // ── Main Tick ─────────────────────────────────────────────────────────────
  // Call this after every match resolves. Returns a full DirectorDecision.

  tick(lastResult?: MatchResult): DirectorDecision {
    if (lastResult) {
      this._lastResult = lastResult;
      if (lastResult === 'win' || lastResult === 'perfectVictory') this._matchesWon++;
      else if (lastResult === 'loss') this._matchesLost++;
    }

    const ctx = this._buildContext();
    if (!ctx) {
      return { arcEvents: [], hints: [], feedPosts: [], announcerLines: [], beatsFired: [] };
    }

    const arcEvents:       ArcEvent[] = [];
    const announcerLines:  string[]   = [];
    const feedPosts:       FeedPost[] = [];
    const beatsFired:      string[]   = [];

    const fired = getFiredBeats();

    // ── Evaluate Story Beats ──────────────────────────────────────────────
    const sortedBeats = [...STORY_BEATS].sort((a, b) => b.priority - a.priority);

    for (const beat of sortedBeats) {
      if (beat.once && fired.has(beat.id)) continue;
      if (!beat.condition(ctx)) continue;

      // Beat fires
      announcerLines.push(...beat.announcerLines);
      feedPosts.push(...beat.feedPosts);
      beatsFired.push(beat.id);
      if (beat.arcEvent) arcEvents.push(beat.arcEvent);
      if (beat.once) markBeatFired(beat.id);

      // Only fire the top priority beat per tick to prevent narrative overload
      break;
    }

    // ── Evaluate Hints ────────────────────────────────────────────────────
    const activeHints = HINT_RULES
      .filter(r => r.condition(ctx))
      .map(r => r.hint)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3); // max 3 concurrent hints

    this._pendingHints   = activeHints;
    this._pendingFeedPosts.push(...feedPosts);

    console.log(`[DirectorAI] Tick complete. Beats: ${beatsFired.join(', ') || 'none'} | Hints: ${activeHints.length} | Feed posts queued: ${feedPosts.length}`);

    return { arcEvents, hints: activeHints, feedPosts, announcerLines, beatsFired };
  }

  // ── Public Interface ──────────────────────────────────────────────────────

  /** Get the current most-relevant hint for display in the UI */
  generateHint(): Hint | null {
    return this._pendingHints[0] ?? null;
  }

  /** Get all active hints (for a hints panel) */
  getAllHints(): Hint[] {
    return [...this._pendingHints];
  }

  /** Dequeue all pending feed posts (for SocialManager to consume) */
  dequeueFeedPosts(): FeedPost[] {
    const posts = [...this._pendingFeedPosts];
    this._pendingFeedPosts = [];
    return posts;
  }

  /** Returns narrative summary of current game state — for export/AI reporting */
  getNarrativeReport(): {
    arc: string;
    matchProgress: string;
    bondStatus: { pair: string; status: string; value: number }[];
    currentHints: string[];
    lastBeatFired: string | null;
  } {
    const ctx = this._buildContext();
    if (!ctx) return {
      arc: 'unknown', matchProgress: '?/?',
      bondStatus: [], currentHints: [], lastBeatFired: null,
    };

    const fired = Array.from(getFiredBeats());

    return {
      arc: ctx.arcId,
      matchProgress: `${ctx.matchCount}/${ctx.matchesRequired}`,
      bondStatus: [
        { pair: 'howard_butterworth', status: ctx.trust_hb >= 60 ? 'STRONG' : ctx.trust_hb >= 35 ? 'STABLE' : 'WEAK', value: ctx.trust_hb },
        { pair: 'howard_civilians',   status: ctx.trust_hc >= 40 ? 'STABLE' : 'WEAK', value: ctx.trust_hc },
        { pair: 'butterworth_civilians', status: ctx.debt_bc  <= 40 ? 'STABLE' : 'INDEBTED', value: ctx.debt_bc },
        { pair: 'tension_active', status: ctx.tension_hb >= 80 ? 'CRISIS' : ctx.tension_hb >= 55 ? 'ELEVATED' : 'NOMINAL', value: ctx.tension_hb },
      ],
      currentHints: this._pendingHints.map(h => h.headline),
      lastBeatFired: fired.slice(-1)[0] ?? null,
    };
  }

  /** Reset match-level counters (call between major arc transitions) */
  resetMatchCounters(): void {
    this._matchesWon  = 0;
    this._matchesLost = 0;
    this._lastResult  = null;
    console.log('[DirectorAI] Match counters reset.');
  }
}

// ── Export singleton ──────────────────────────────────────────────────────────

export const DirectorAI = DirectorAIEngine.getInstance();

/**
 * USAGE EXAMPLES
 * ──────────────────────────────────────────────────────────────────────
 *
 * // After a match resolves:
 * const decision = DirectorAI.tick('win');
 * // → { arcEvents: [...], hints: [...], feedPosts: [...], announcerLines: [...] }
 *
 * // Get the top hint for UI display:
 * const hint = DirectorAI.generateHint();
 * // → { headline: 'FORGE SEQUENCE APPROACHING', body: '...', action: 'Read More' }
 *
 * // Feed the social manager:
 * const posts = DirectorAI.dequeueFeedPosts();
 * // → [{ charId: 'howard', text: 'Match result: suboptimal...', tags: [...] }]
 *
 * // Generate a full narrative report for analytics/AI upload:
 * const report = DirectorAI.getNarrativeReport();
 * // → { arc: 'venus-protocol', matchProgress: '2/3', bondStatus: [...] }
 */
