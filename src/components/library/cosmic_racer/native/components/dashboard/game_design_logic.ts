/**
 * game_design_logic.ts
 * 
 * Hydration logic for the Game Design page.
 * Uses the SAME hydration path as the Flight Engine (setGlobalDbState + hydrateGameShips)
 * so that ships display identically across all consumers.
 * 
 * This replaces the old shipCatalogLogic.ts import which used a separate hydration path
 * that generated dynamic API URLs instead of static asset paths.
 */

import { hydrateGameShips, setGlobalDbState } from '../../state/game-assets/ships';

const CONFIG_API = '/api/game-assets/config';

/**
 * Fetches the ship DB from the same API endpoint, sets the global DB state,
 * and hydrates ships using the same function as CosmicRenderer / Flight Engine.
 */
export async function fetchAndHydrateShips(): Promise<any[]> {
  const res = await fetch(CONFIG_API, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchAndHydrateShips failed: ${res.status}`);
  const db = await res.json();

  // Set the global DB state — same call CosmicRenderer makes
  setGlobalDbState(db);

  // Hydrate using the unified function — returns ships with static asset paths
  return hydrateGameShips(false);
}
