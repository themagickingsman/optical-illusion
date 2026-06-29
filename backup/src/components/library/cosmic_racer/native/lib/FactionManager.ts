/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                        FACTION MANAGER                              ║
 * ║                     src/lib/FactionManager.ts                       ║
 * ║                                                                      ║
 * ║  Manages all factions — player alliance and all enemy factions.     ║
 * ║  Assigns AI behaviors based on personality, monitors growth curves, ║
 * ║  detects stalls, ensures enemies are always a credible threat.       ║
 * ║                                                                      ║
 * ║  Thin wrapper + extension over the fleet logic already in Engine.   ║
 * ║  The Engine handles registration/fleet config; this handles the      ║
 * ║  meta loop: growth tracking, rebalancing, stall detection.          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { Engine } from './GameEngine';
import type { Faction, FactionConfig, FactionPersonality, MatchResult, Doctrine } from './GameEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FactionRecord {
  factionId:    string;
  matchHistory: MatchResult[];
  winRate:      number;
  lastGrowthAt: number;   // matchCount when fleet last changed
  stallCount:   number;   // consecutive matches with no growth
  tier:         number;   // 1–5
  doctrine:     Doctrine[];
}

export interface GrowthReport {
  factionId:   string;
  isStalled:   boolean;
  stallCount:  number;
  winRate:     number;
  tier:        number;
  recommendation: 'none' | 'upgrade_tier' | 'change_doctrine' | 'reduce_difficulty';
}

export interface BalanceReport {
  playerWinRate:      number;
  targetWinRate:      number;
  adjustment:         'none' | 'increase_difficulty' | 'reduce_difficulty';
  enemyTierChange:    number;  // +1, 0, or -1
  affectedFactions:   string[];
}

// ── Faction personality doctrine maps ─────────────────────────────────────────

const PERSONALITY_DOCTRINES: Record<FactionPersonality, Doctrine[][]> = {
  aggressive: [
    ['JOUSTER', 'BRAWLER', 'FLANKER'],         // tier 1
    ['BRAWLER', 'FLANKER', 'JOUSTER'],          // tier 2
    ['FLANKER', 'JOUSTER', 'BRAWLER'],          // tier 3
    ['JOUSTER', 'BRAWLER', 'FLANKER'],          // tier 4
    ['BRAWLER', 'FLANKER', 'JOUSTER'],          // tier 5
  ],
  defensive: [
    ['SENTINEL', 'KITER', 'DRIFTER'],
    ['KITER', 'SENTINEL', 'DRIFTER'],
    ['SENTINEL', 'DRIFTER', 'KITER'],
    ['KITER', 'SENTINEL', 'SENTINEL'],
    ['SENTINEL', 'SENTINEL', 'KITER'],
  ],
  economic: [
    ['DRIFTER', 'KITER', 'SENTINEL'],
    ['KITER', 'DRIFTER', 'SENTINEL'],
    ['DRIFTER', 'SENTINEL', 'KITER'],
    ['KITER', 'DRIFTER', 'DRIFTER'],
    ['DRIFTER', 'KITER', 'KITER'],
  ],
  adaptive: [
    ['JOUSTER', 'KITER', 'SENTINEL'],
    ['KITER', 'BRAWLER', 'DRIFTER'],
    ['BRAWLER', 'SENTINEL', 'FLANKER'],
    ['FLANKER', 'KITER', 'JOUSTER'],
    ['JOUSTER', 'BRAWLER', 'SENTINEL'],
  ],
};

// ── Enemy faction presets ──────────────────────────────────────────────────────
// Seeded enemy factions for the Venus Protocol arc and beyond.

export const ENEMY_FACTION_PRESETS: FactionConfig[] = [
  {
    id:          'dust_corsairs',
    name:        'DUST CORSAIRS',
    personality: 'aggressive',
    accentColor: '#ef4444',
  },
  {
    id:          'silent_compact',
    name:        'SILENT COMPACT',
    personality: 'defensive',
    accentColor: '#94a3b8',
  },
  {
    id:          'reclaimers',
    name:        'THE RECLAIMERS',
    personality: 'economic',
    accentColor: '#f59e0b',
  },
  {
    id:          'vanguard_echo',
    name:        'VANGUARD ECHO',
    personality: 'adaptive',
    accentColor: '#8b5cf6',
  },
];

// ── FactionManager Class ───────────────────────────────────────────────────────

class FactionManagerEngine {
  private static _instance: FactionManagerEngine;

  private _records:       Map<string, FactionRecord> = new Map();
  private _totalMatches   = 0;
  private _playerWins     = 0;
  private _targetWinRate  = 0.55; // read from EngineConfig if available
  private _stallThreshold = 5;    // matches without growth before stall flag
  private _maxTier        = 3;    // maximum enemy tier, tunable

  private constructor() {}

  static getInstance(): FactionManagerEngine {
    if (!FactionManagerEngine._instance) {
      FactionManagerEngine._instance = new FactionManagerEngine();
    }
    return FactionManagerEngine._instance;
  }

  // ── Initialization ────────────────────────────────────────────────────────

  /** Register all default enemy factions. Call once at game start. */
  initializeEnemyFactions(): Faction[] {
    const factions: Faction[] = [];
    for (const preset of ENEMY_FACTION_PRESETS) {
      const faction = Engine.registerFaction(preset);
      Engine.autoConfigureFleet(preset.id);
      this._records.set(preset.id, {
        factionId:    preset.id,
        matchHistory: [],
        winRate:      0,
        lastGrowthAt: 0,
        stallCount:   0,
        tier:         1,
        doctrine:     PERSONALITY_DOCTRINES[preset.personality][0],
      });
      factions.push(faction);
      console.log(`[FactionManager] Registered: ${preset.name} (${preset.personality})`);
    }
    return factions;
  }

  // ── Match Recording ───────────────────────────────────────────────────────

  /** Record a match result for a faction and update win rate. */
  recordMatchResult(factionId: string, result: MatchResult): void {
    const rec = this._records.get(factionId);
    if (!rec) return;

    rec.matchHistory.push(result);
    this._totalMatches++;
    if (result === 'loss') this._playerWins++; // loss for enemy = win for player

    // Rolling win rate over last 10 matches
    const recent = rec.matchHistory.slice(-10);
    const enemyWins = recent.filter(r => r === 'win' || r === 'perfectVictory').length;
    rec.winRate = enemyWins / recent.length;

    console.log(`[FactionManager] ${factionId} record updated. Win rate: ${(rec.winRate * 100).toFixed(0)}%`);
  }

  /** Call after every match — the heart of the faction AI loop. */
  postMatchTick(playerResult: MatchResult, enemyFactionId: string): {
    growthReports: GrowthReport[];
    balanceReport: BalanceReport;
  } {
    this.recordMatchResult(enemyFactionId, playerResult === 'win' || playerResult === 'perfectVictory' ? 'loss' : 'win');

    const growthReports = this.evaluateGrowth();
    const balanceReport = this.rebalance();

    return { growthReports, balanceReport };
  }

  // ── Growth & Stall Detection ──────────────────────────────────────────────

  /** Checks all factions for stalls or growth triggers. */
  evaluateGrowth(): GrowthReport[] {
    const reports: GrowthReport[] = [];
    const arc = Engine.getArcState();
    const currentMatchCount = arc?.matchCount ?? 0;

    for (const [id, rec] of this._records) {
      const matchesSinceGrowth = currentMatchCount - rec.lastGrowthAt;
      const isStalled = matchesSinceGrowth >= this._stallThreshold;

      let recommendation: GrowthReport['recommendation'] = 'none';

      if (isStalled) {
        rec.stallCount++;
        // Stalled + losing → change doctrine
        if (rec.winRate < 0.3) recommendation = 'change_doctrine';
        // Stalled + winning too much → reduce difficulty
        else if (rec.winRate > 0.7) recommendation = 'reduce_difficulty';
        // Stalled neutrally → upgrade tier if possible
        else if (rec.tier < this._maxTier) recommendation = 'upgrade_tier';
      } else {
        rec.stallCount = 0;
        recommendation = 'none';
      }

      reports.push({
        factionId: id,
        isStalled,
        stallCount: rec.stallCount,
        winRate:    rec.winRate,
        tier:       rec.tier,
        recommendation,
      });

      // Auto-apply recommendations
      if (recommendation === 'upgrade_tier' && rec.tier < this._maxTier) {
        this._upgradeTier(id, rec);
      } else if (recommendation === 'change_doctrine') {
        this._rotateDoctrine(id, rec);
      }
    }

    if (reports.length > 0) {
      const stalled = reports.filter(r => r.isStalled);
      if (stalled.length > 0) {
        console.log(`[FactionManager] Growth eval: ${stalled.length} faction(s) stalled. Reports:`, stalled.map(r => `${r.factionId}→${r.recommendation}`));
      }
    }

    return reports;
  }

  detectStall(factionId: string): boolean {
    const rec = this._records.get(factionId);
    if (!rec) return false;
    const arc = Engine.getArcState();
    const matchesSinceGrowth = (arc?.matchCount ?? 0) - rec.lastGrowthAt;
    return matchesSinceGrowth >= this._stallThreshold;
  }

  // ── Rebalancing ───────────────────────────────────────────────────────────

  /** Adjusts enemy difficulty toward the target player win rate. */
  rebalance(): BalanceReport {
    if (this._totalMatches < 3) {
      // Not enough data yet
      return {
        playerWinRate: 0, targetWinRate: this._targetWinRate,
        adjustment: 'none', enemyTierChange: 0, affectedFactions: [],
      };
    }

    const playerWinRate = this._playerWins / this._totalMatches;
    const delta = playerWinRate - this._targetWinRate;
    const affected: string[] = [];

    let adjustment: BalanceReport['adjustment'] = 'none';
    let tierChange = 0;

    if (delta > 0.15 && this._maxTier < 5) {
      // Player winning too much → increase difficulty
      adjustment = 'increase_difficulty';
      tierChange = +1;
      for (const [id, rec] of this._records) {
        if (rec.tier < this._maxTier) {
          this._upgradeTier(id, rec);
          affected.push(id);
        }
      }
    } else if (delta < -0.15 && this._maxTier > 1) {
      // Player losing too much → reduce difficulty
      adjustment = 'reduce_difficulty';
      tierChange = -1;
      for (const [id, rec] of this._records) {
        if (rec.tier > 1) {
          rec.tier = Math.max(1, rec.tier - 1);
          this._applyDoctrine(id, rec);
          affected.push(id);
        }
      }
    }

    if (adjustment !== 'none') {
      console.log(`[FactionManager] Rebalance: player win rate ${(playerWinRate * 100).toFixed(0)}% vs target ${(this._targetWinRate * 100).toFixed(0)}% → ${adjustment} (tier ${tierChange > 0 ? '+1' : '-1'})`);
    }

    return { playerWinRate, targetWinRate: this._targetWinRate, adjustment, enemyTierChange: tierChange, affectedFactions: affected };
  }

  // ── Faction Configuration ────────────────────────────────────────────────

  /** Pick the best enemy faction to face the player this match, based on arc phase. */
  selectEnemyFaction(): string {
    const arc = Engine.getArcState();
    const arcId = arc?.activeArcId ?? 'venus-protocol';

    // Arc-based faction assignment (escalates with story progression)
    const arcFactionMap: Record<string, string[]> = {
      'venus-protocol':    ['dust_corsairs'],
      'forge-sequence':    ['dust_corsairs', 'silent_compact'],
      'breakout':          ['silent_compact', 'reclaimers'],
      'alliance-formation':['reclaimers', 'vanguard_echo', 'dust_corsairs'],
    };

    const candidates = arcFactionMap[arcId] ?? ['dust_corsairs'];

    // Pick the one with the lowest win rate to keep it competitive
    let best = candidates[0];
    let bestRate = this._records.get(best)?.winRate ?? 0;

    for (const id of candidates) {
      const rate = this._records.get(id)?.winRate ?? 0;
      if (rate < bestRate) { best = id; bestRate = rate; }
    }

    return best;
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private _upgradeTier(factionId: string, rec: FactionRecord): void {
    rec.tier = Math.min(this._maxTier, rec.tier + 1);
    rec.lastGrowthAt = Engine.getArcState()?.matchCount ?? 0;
    this._applyDoctrine(factionId, rec);
    console.log(`[FactionManager] ${factionId} upgraded to tier ${rec.tier}`);
  }

  private _rotateDoctrine(factionId: string, rec: FactionRecord): void {
    const faction = Engine.getFaction(factionId);
    if (!faction) return;
    const personality = faction.config.personality;
    const tiers = PERSONALITY_DOCTRINES[personality];
    // Rotate to next tier pattern cyclically
    const idx = (rec.tier % tiers.length);
    rec.doctrine = tiers[idx];
    rec.lastGrowthAt = Engine.getArcState()?.matchCount ?? 0;
    console.log(`[FactionManager] ${factionId} doctrine rotated to: ${rec.doctrine.join(', ')}`);
  }

  private _applyDoctrine(factionId: string, rec: FactionRecord): void {
    const faction = Engine.getFaction(factionId);
    if (!faction) return;
    const personality = faction.config.personality;
    const tierIdx = Math.min(rec.tier - 1, PERSONALITY_DOCTRINES[personality].length - 1);
    rec.doctrine = PERSONALITY_DOCTRINES[personality][tierIdx];
    // Sync back to Engine fleet configs
    Engine.autoConfigureFleet(factionId);
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  getAllRecords(): FactionRecord[] {
    return Array.from(this._records.values());
  }

  getFactionRecord(factionId: string): FactionRecord | undefined {
    return this._records.get(factionId);
  }

  getPlayerWinRate(): number {
    return this._totalMatches > 0 ? this._playerWins / this._totalMatches : 0;
  }

  // ── Tuning ────────────────────────────────────────────────────────────────

  setTargetWinRate(rate: number):  void { this._targetWinRate  = Math.max(0.1, Math.min(0.9, rate)); }
  setStallThreshold(n: number):   void { this._stallThreshold  = Math.max(1, n); }
  setMaxEnemyTier(tier: number):  void { this._maxTier         = Math.max(1, Math.min(5, tier)); }
}

// ── Export singleton ──────────────────────────────────────────────────────────

export const FactionManager = FactionManagerEngine.getInstance();

/**
 * USAGE EXAMPLES
 * ──────────────────────────────────────────────────────────────────────
 *
 * // At game start, seed all enemy factions:
 * FactionManager.initializeEnemyFactions();
 *
 * // Pick an enemy before each match:
 * const enemyId = FactionManager.selectEnemyFaction(); // → 'dust_corsairs'
 * const enemy   = Engine.getFaction(enemyId);
 *
 * // After a match resolves:
 * const { growthReports, balanceReport } = FactionManager.postMatchTick('win', enemyId);
 * // → auto-upgrades stalled factions, adjusts difficulty if win rate drifts
 *
 * // Manual tuning (synced from Engine Hub sliders):
 * FactionManager.setTargetWinRate(0.60);
 * FactionManager.setStallThreshold(4);
 * FactionManager.setMaxEnemyTier(4);
 */
