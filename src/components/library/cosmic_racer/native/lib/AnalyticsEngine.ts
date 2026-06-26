/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                       ANALYTICS ENGINE                              ║
 * ║                    src/lib/AnalyticsEngine.ts                       ║
 * ║                                                                      ║
 * ║  Silent observer. Never makes decisions. Records every event        ║
 * ║  with a timestamp and exports structured reports on KPIs.           ║
 * ║  Match outcomes, bond progression, resource velocity, arc           ║
 * ║  completion times, equipment meta — all captured for AI evaluation. ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { Engine } from './GameEngine';
import type { ArcId, MatchResult, BondAxis } from './GameEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType =
  | 'match_complete'
  | 'arc_progress'
  | 'arc_complete'
  | 'bond_delta'
  | 'bond_threshold'
  | 'currency_earned'
  | 'currency_spent'
  | 'building_placed'
  | 'equipment_purchased'
  | 'director_beat'
  | 'faction_tier_change'
  | 'hint_shown'
  | 'player_action';

export interface AnalyticsEvent {
  id:        string;
  type:      EventType;
  timestamp: number;
  arcId:     ArcId;
  payload:   Record<string, unknown>;
}

export interface KPISnapshot {
  timestamp:         number;
  arcId:             ArcId;
  matchCount:        number;
  matchesRequired:   number;
  playerWinRate:     number;
  bondTrust_hb:      number;
  bondTension_hb:    number;
  bondTrust_hc:      number;
  bondDebt_bc:       number;
  octave_11:         number;
  octave_12:         number;
  octave_13:         number;
  buildingCount:     number;
  civiliansAlive:    number;
  avgCargoPerMatch:  number;
  avgKillsPerMatch:  number;
}

export interface MatchKPI {
  matchId:        string;
  result:         MatchResult;
  cargoA:         number;
  cargoB:         number;
  killsA:         number;
  killsB:         number;
  currencyEarned: Record<string, number>;
  arcId:          ArcId;
  durationSec:    number;
  bondDeltaSummary: string;
  timestamp:      number;
}

export interface ExportReport {
  generatedAt:      string;
  sessionSummary: {
    totalMatches:     number;
    playerWinRate:    number;
    totalCurrencyEarned: Record<string, number>;
    arcProgress:      string;
    beatsFireded:     number;
  };
  matchKPIs:        MatchKPI[];
  bondProgression:  { timestamp: number; pair: string; axis: BondAxis; value: number }[];
  kpiSnapshots:     KPISnapshot[];
  events:           AnalyticsEvent[];
}

// ── AnalyticsEngine Class ──────────────────────────────────────────────────────

const MAX_EVENTS    = 500; // cap to avoid in-memory state bloat

class AnalyticsEngineCore {
  private static _instance: AnalyticsEngineCore;

  private _events:          AnalyticsEvent[]  = [];
  private _kpiSnapshots:    KPISnapshot[]     = [];
  private _matchKPIs:       MatchKPI[]        = [];
  private _bondProgression: ExportReport['bondProgression'] = [];
  private _snapshotInterval = 5;  // every N matches
  private _matchesSinceSnap = 0;
  private _totalCurrencyEarned: Record<string, number> = {};
  private _beatsFireded     = 0;

  private constructor() {
    this._loadFromStorage();
  }

  static getInstance(): AnalyticsEngineCore {
    if (!AnalyticsEngineCore._instance) {
      AnalyticsEngineCore._instance = new AnalyticsEngineCore();
    }
    return AnalyticsEngineCore._instance;
  }

  // ── Core: record() ───────────────────────────────────────────────────────

  record(type: EventType, payload: Record<string, unknown> = {}): AnalyticsEvent {
    const arc = Engine.getArcState()?.activeArcId ?? 'venus-protocol';
    const event: AnalyticsEvent = {
      id:        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      timestamp: Date.now(),
      arcId:     arc,
      payload,
    };
    this._events.push(event);

    // Trim to max
    if (this._events.length > MAX_EVENTS) {
      this._events = this._events.slice(-MAX_EVENTS);
    }

    this._persistToStorage();
    return event;
  }

  // ── Match Recording ───────────────────────────────────────────────────────

  recordMatch(kpi: MatchKPI): void {
    this._matchKPIs.push(kpi);

    // Track total currency earned
    for (const [octave, amt] of Object.entries(kpi.currencyEarned)) {
      this._totalCurrencyEarned[octave] = (this._totalCurrencyEarned[octave] ?? 0) + amt;
    }

    this.record('match_complete', {
      matchId:  kpi.matchId,
      result:   kpi.result,
      cargoA:   kpi.cargoA,
      cargoB:   kpi.cargoB,
      killsA:   kpi.killsA,
      killsB:   kpi.killsB,
      arcId:    kpi.arcId,
      duration: kpi.durationSec,
    });

    // Auto-snapshot every N matches
    this._matchesSinceSnap++;
    if (this._matchesSinceSnap >= this._snapshotInterval) {
      this.snapshot();
      this._matchesSinceSnap = 0;
    }
  }

  // ── Bond Tracking ─────────────────────────────────────────────────────────

  recordBondDelta(pair: string, axis: BondAxis, oldValue: number, newValue: number): void {
    const delta = newValue - oldValue;
    this._bondProgression.push({
      timestamp: Date.now(),
      pair,
      axis,
      value: newValue,
    });
    this.record('bond_delta', { pair, axis, from: oldValue, to: newValue, delta });
  }

  recordBondThreshold(pair: string, message: string): void {
    this.record('bond_threshold', { pair, message });
  }

  // ── Director Beat Tracking ────────────────────────────────────────────────

  recordDirectorBeat(beatId: string, announcerLine?: string): void {
    this._beatsFireded++;
    this.record('director_beat', { beatId, announcerLine });
  }

  // ── Arc Tracking ──────────────────────────────────────────────────────────

  recordArcProgress(arcId: ArcId, matchCount: number, matchesRequired: number): void {
    this.record('arc_progress', { arcId, matchCount, matchesRequired,
      pct: Math.round((matchCount / matchesRequired) * 100) });
  }

  recordArcComplete(arcId: ArcId, totalMatchesPlayed: number, durationMs: number): void {
    this.record('arc_complete', { arcId, totalMatchesPlayed, durationMs });
  }

  // ── Snapshot ──────────────────────────────────────────────────────────────

  snapshot(): KPISnapshot {
    const arc      = Engine.getArcState();
    const bonds    = Engine.getBondMatrix();
    const currency = Engine.getOctaveCurrency();
    const buildings = Engine.getBuildings();

    const recentMatches = this._matchKPIs.slice(-10);
    const wins = recentMatches.filter(m => m.result === 'win' || m.result === 'perfectVictory').length;
    const totalCargo = recentMatches.reduce((s, m) => s + m.cargoA, 0);
    const totalKills = recentMatches.reduce((s, m) => s + m.killsA, 0);

    const snap: KPISnapshot = {
      timestamp:         Date.now(),
      arcId:             arc?.activeArcId ?? 'venus-protocol',
      matchCount:        arc?.matchCount ?? 0,
      matchesRequired:   arc?.matchesRequired ?? 3,
      playerWinRate:     recentMatches.length > 0 ? wins / recentMatches.length : 0,
      bondTrust_hb:      bonds?.howard_butterworth?.trust ?? 0,
      bondTension_hb:    bonds?.howard_butterworth?.tension ?? 0,
      bondTrust_hc:      bonds?.howard_civilians?.trust ?? 0,
      bondDebt_bc:       bonds?.butterworth_civilians?.debt ?? 0,
      octave_11:         currency['11'] ?? 0,
      octave_12:         currency['12'] ?? 0,
      octave_13:         currency['13'] ?? 0,
      buildingCount:     buildings.length,
      civiliansAlive:    arc?.civiliansAlive ?? 20,
      avgCargoPerMatch:  recentMatches.length > 0 ? Math.round(totalCargo / recentMatches.length) : 0,
      avgKillsPerMatch:  recentMatches.length > 0 ? Math.round(totalKills / recentMatches.length) : 0,
    };

    this._kpiSnapshots.push(snap);
    this.record('arc_progress', { snapshotId: snap.timestamp, ...snap });

    console.log(`[AnalyticsEngine] Snapshot taken. Win rate: ${(snap.playerWinRate * 100).toFixed(0)}% | Trust HB: ${snap.bondTrust_hb}`);
    return snap;
  }

  // ── Live KPIs ─────────────────────────────────────────────────────────────

  getKPIs(): KPISnapshot {
    return this.snapshot(); // always return a fresh snapshot
  }

  getWinRate(lastN = 10): number {
    const recent = this._matchKPIs.slice(-lastN);
    if (recent.length === 0) return 0;
    const wins = recent.filter(m => m.result === 'win' || m.result === 'perfectVictory').length;
    return wins / recent.length;
  }

  getMatchKPIs(): MatchKPI[] { return [...this._matchKPIs]; }

  getEvents(type?: EventType, limit = 50): AnalyticsEvent[] {
    const filtered = type ? this._events.filter(e => e.type === type) : this._events;
    return filtered.slice(-limit);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportReport(format: 'json' | 'csv' | 'both' = 'json'): ExportReport | string {
    const arc = Engine.getArcState();

    const report: ExportReport = {
      generatedAt: new Date().toISOString(),
      sessionSummary: {
        totalMatches:        this._matchKPIs.length,
        playerWinRate:       this.getWinRate(),
        totalCurrencyEarned: this._totalCurrencyEarned,
        arcProgress:         arc ? `${arc.matchCount}/${arc.matchesRequired} (${arc.activeArcId})` : 'unknown',
        beatsFireded:        this._beatsFireded,
      },
      matchKPIs:       this._matchKPIs,
      bondProgression: this._bondProgression.slice(-100),
      kpiSnapshots:    this._kpiSnapshots,
      events:          this._events.slice(-200),
    };

    if (format === 'json') return report;
    if (format === 'csv')  return this._toCSV(report);

    // 'both' — return JSON (caller handles download)
    return report;
  }

  /** Download the report as a file from the browser */
  downloadReport(format: 'json' | 'csv' = 'json'): void {
    if (typeof window === 'undefined') return;
    const report = this.exportReport(format);
    const content = format === 'csv' ? report as string : JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `alliances_analytics_${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`[AnalyticsEngine] Report downloaded as ${format.toUpperCase()}`);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private _toCSV(report: ExportReport): string {
    const rows: string[] = [
      '# ALLIANCES ANALYTICS REPORT',
      `# Generated: ${report.generatedAt}`,
      `# Arc: ${report.sessionSummary.arcProgress}`,
      `# Win Rate: ${(report.sessionSummary.playerWinRate * 100).toFixed(1)}%`,
      '',
      '## MATCH KPIs',
      'matchId,result,cargoA,cargoB,killsA,killsB,arcId,durationSec,timestamp',
      ...report.matchKPIs.map(m =>
        `${m.matchId},${m.result},${m.cargoA},${m.cargoB},${m.killsA},${m.killsB},${m.arcId},${m.durationSec},${m.timestamp}`
      ),
      '',
      '## KPI SNAPSHOTS',
      'timestamp,arcId,matchCount,playerWinRate,bondTrust_hb,bondTension_hb,octave_11,octave_12',
      ...report.kpiSnapshots.map(s =>
        `${s.timestamp},${s.arcId},${s.matchCount},${s.playerWinRate.toFixed(3)},${s.bondTrust_hb},${s.bondTension_hb},${s.octave_11},${s.octave_12}`
      ),
    ];
    return rows.join('\n');
  }

  private _loadFromStorage(): void {
    // REMOVED: localStorage usage per architectural rules. State is transient in-memory.
  }

  private _persistToStorage(): void {
    // REMOVED: localStorage usage per architectural rules. State is transient in-memory.
  }

  // ── Tuning ────────────────────────────────────────────────────────────────

  setSnapshotInterval(n: number): void { this._snapshotInterval = Math.max(1, n); }
  clearHistory(): void {
    this._events = []; this._matchKPIs = []; this._kpiSnapshots = [];
    this._bondProgression = []; this._totalCurrencyEarned = {};
    this._beatsFireded = 0; this._persistToStorage();
    console.log('[AnalyticsEngine] History cleared.');
  }
}

// ── Export singleton ──────────────────────────────────────────────────────────

export const Analytics = AnalyticsEngineCore.getInstance();

/**
 * USAGE EXAMPLES
 * ──────────────────────────────────────────────────────────────────────
 *
 * // Record a match (call after Engine.resolveMatch):
 * Analytics.recordMatch({
 *   matchId: 'match_123', result: 'win',
 *   cargoA: 12, cargoB: 3, killsA: 3, killsB: 0,
 *   currencyEarned: { '11': 150 }, arcId: 'venus-protocol',
 *   durationSec: 120, bondDeltaSummary: 'trust+5 debt-3',
 *   timestamp: Date.now(),
 * });
 *
 * // Get live KPIs:
 * const kpis = Analytics.getKPIs();
 * // → { playerWinRate: 0.67, bondTrust_hb: 55, octave_11: 450, ... }
 *
 * // Download a full report:
 * Analytics.downloadReport('json');  // saves alliances_analytics_2026-04-06.json
 * Analytics.downloadReport('csv');   // saves as CSV for spreadsheet analysis
 *
 * // Manual snapshot:
 * const snap = Analytics.snapshot();
 */
