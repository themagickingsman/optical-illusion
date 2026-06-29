import { getShipAssetUrl } from '../../config/ship_assets';

export type AssetStatus = 'approved' | 'draft' | 'pending' | 'wip';
export type BgMode = 'flood' | 'tight' | 'dark' | 'checker' | 'none';

export type RegistrationType = 'engine' | 'reactor' | 'radar' | 'missile' | 'shield';

export interface RegistrationPoint {
  id: string;
  type: RegistrationType;
  x: number;  // normalized percentage
  y: number;  // normalized percentage
}

export interface ShipAsset {
  id: string;
  name: string;
  class: string;
  classGroup: string;   // broad category
  tier: number;
  slots: { weapons: number; shields: number; engines: number };
  status: AssetStatus;
  tags: string[];
  imagePath?: string;
  bgMode?: BgMode;
  rotation?: number;
  registrationPoints?: RegistrationPoint[];
}

export interface ShipPack {
  id: string;
  name: string;
  version: string;
  description: string;
  ships: ShipAsset[];
  color: string;
  collectionImage?: string;
}

export const CLASS_GROUP_META: Record<string, { icon: string; label: string; order: number; accent: string }> = {
  'Capital Ships':       { icon: '🏛', label: 'Capital Ships',       order: 0, accent: '#f59e0b' },
  'Capital Escorts':     { icon: '🛡', label: 'Capital Escorts',     order: 1, accent: '#22d3ee' },
  'Strategic Frigates':  { icon: '⚔️', label: 'Strategic Frigates',  order: 2, accent: '#818cf8' },
  'Fighters':            { icon: '✈', label: 'Fighters',             order: 3, accent: '#34d399' },
  'Bombers':             { icon: '💥', label: 'Bombers',             order: 4, accent: '#fb923c' },
  'Interceptors':        { icon: '⚡', label: 'Interceptors',        order: 5, accent: '#60a5fa' },
  'Scouts':              { icon: '👁', label: 'Scouts',              order: 6, accent: '#a78bfa' },
  'Support & Utility':   { icon: '🔧', label: 'Support & Utility',   order: 7, accent: '#94a3b8' },
};

// SHIP_PACKS is intentionally empty. All ships are user-created and stored
// in game_config.json → customAdditions[]. This array exists only for the
// ShipPack type interface; do not add hardcoded ships here.
export const SHIP_PACKS: ShipPack[] = [];

// ─── Global Database State (Replacing localStorage) ───────────────────────────
let globalDbState: any = null;

export function setGlobalDbState(db: any) {
  globalDbState = db;
}

export function getGlobalDbState(): any {
  return globalDbState;
}

// ─── Hydration Helper ─────────────────────────────────────────────────────────
export function hydrateGameShips(onlyActive: boolean = false): ShipAsset[] {
  const list: ShipAsset[] = [];
  if (typeof window === 'undefined') return list;

  const db = globalDbState || {};

  let activeSet: Set<string> | null = null;
  if (onlyActive && db.activeRoster) {
    activeSet = new Set(db.activeRoster);
  }

  const classifications: any = db.classifications || {};
  const registrations: any = db.registrations || {};

  const rotations: any = db.rotations || {};
  const sounds: any = db.soundAssignments || {};
  const physicsAssignments: any = db.physics_assignments || {};
  const deletedIds = new Set<string>(db.deletedIds || []);

  for (const pack of SHIP_PACKS) {
    for (const ship of pack.ships) {
      if (deletedIds.has(ship.id)) continue;

      const overrides = classifications[ship.id] || {};
      const regPoints = registrations[ship.id];
      const manualRot = rotations[ship.id];
      const manualSound = sounds[ship.id];
      const hydrated = { ...ship, ...overrides };

      if (manualRot !== undefined) {
         hydrated.rotation = manualRot;
      }
      if (manualSound !== undefined) {
         hydrated.soundId = manualSound;
      }
      if (physicsAssignments[ship.id]) {
         hydrated.physics = physicsAssignments[ship.id];
      }

      // Active roster logic:
      // - If there IS an explicit active roster, only show ships the user enabled (no status gate)
      // - If there is NO explicit roster, fall back to showing all approved ships
      if (onlyActive) {
        if (activeSet && activeSet.size > 0) {
          if (!activeSet.has(ship.id)) continue;   // Must be explicitly enabled
        } else {
          if (hydrated.status !== 'approved') continue; // Fallback: require approved
        }
      }


      if (regPoints || ship.registrationPoints) {
         hydrated.registrationPoints = regPoints || ship.registrationPoints;
      }

      
      const customImgs = (db.customImages && db.customImages[ship.id]) ? db.customImages[ship.id] : null;
      if (customImgs) {
         if (customImgs.color) (hydrated as any).colorUrl = customImgs.color;
         if (customImgs.alpha) (hydrated as any).alphaUrl = customImgs.alpha;
         if (customImgs.bump) (hydrated as any).bumpUrl = customImgs.bump;
         if (customImgs.lightmap) (hydrated as any).lightUrl = customImgs.lightmap;
         if (customImgs.composite) hydrated.imagePath = customImgs.composite;
      }

      // Sanitize any dynamic API URLs to resolve to static assets instead
      if (hydrated.imagePath && hydrated.imagePath.startsWith('/api/game-assets')) {
         hydrated.imagePath = getShipAssetUrl(ship.id, 'composite');
      }
      if ((hydrated as any).colorUrl && (hydrated as any).colorUrl.startsWith('/api/game-assets')) {
         (hydrated as any).colorUrl = getShipAssetUrl(ship.id, 'color');
      }
      if ((hydrated as any).alphaUrl && (hydrated as any).alphaUrl.startsWith('/api/game-assets')) {
         (hydrated as any).alphaUrl = getShipAssetUrl(ship.id, 'alpha');
      }
      if ((hydrated as any).bumpUrl && (hydrated as any).bumpUrl.startsWith('/api/game-assets')) {
         (hydrated as any).bumpUrl = getShipAssetUrl(ship.id, 'bump');
      }
      if ((hydrated as any).lightUrl && (hydrated as any).lightUrl.startsWith('/api/game-assets')) {
         (hydrated as any).lightUrl = getShipAssetUrl(ship.id, 'lightmap');
      }

      if (!(hydrated as any).colorUrl) (hydrated as any).colorUrl = getShipAssetUrl(ship.id, 'color');
      if (!(hydrated as any).alphaUrl) (hydrated as any).alphaUrl = getShipAssetUrl(ship.id, 'alpha');
      if (!(hydrated as any).bumpUrl) (hydrated as any).bumpUrl = getShipAssetUrl(ship.id, 'bump');
      if (!(hydrated as any).lightUrl) (hydrated as any).lightUrl = getShipAssetUrl(ship.id, 'lightmap');
      if (!hydrated.imagePath) hydrated.imagePath = getShipAssetUrl(ship.id, 'composite');

      list.push(hydrated);
    }
  }

  const additions: any[] = db.customAdditions || [];

  for (const ship of additions) {
      if (deletedIds.has(ship.id)) continue;
      const overrides = classifications[ship.id] || {};
      const regPoints = registrations[ship.id];
      const hydrated = { ...ship, ...overrides };
      
      const manualRot = rotations[ship.id];
      const manualSound = sounds[ship.id];
      if (manualRot !== undefined) hydrated.rotation = manualRot;
      if (manualSound !== undefined) hydrated.soundId = manualSound;
      if (physicsAssignments[ship.id]) hydrated.physics = physicsAssignments[ship.id];
      
      // Active roster logic (same as base ships)
      if (onlyActive) {
        if (activeSet && activeSet.size > 0) {
          if (!activeSet.has(ship.id)) continue;
        } else {
          if (hydrated.status !== 'approved') continue;
        }
      }

      if (regPoints || ship.registrationPoints) hydrated.registrationPoints = regPoints || ship.registrationPoints;

      
      const customImgs = (db.customImages && db.customImages[ship.id]) ? db.customImages[ship.id] : null;
      if (customImgs) {
         if (customImgs.color) (hydrated as any).colorUrl = customImgs.color;
         if (customImgs.alpha) (hydrated as any).alphaUrl = customImgs.alpha;
         if (customImgs.bump) (hydrated as any).bumpUrl = customImgs.bump;
         if (customImgs.lightmap) (hydrated as any).lightUrl = customImgs.lightmap;
         if (customImgs.composite) hydrated.imagePath = customImgs.composite;
      }

      // Sanitize any dynamic API URLs to resolve to static assets instead
      if (hydrated.imagePath && hydrated.imagePath.startsWith('/api/game-assets')) {
         hydrated.imagePath = getShipAssetUrl(ship.id, 'composite');
      }
      if ((hydrated as any).colorUrl && (hydrated as any).colorUrl.startsWith('/api/game-assets')) {
         (hydrated as any).colorUrl = getShipAssetUrl(ship.id, 'color');
      }
      if ((hydrated as any).alphaUrl && (hydrated as any).alphaUrl.startsWith('/api/game-assets')) {
         (hydrated as any).alphaUrl = getShipAssetUrl(ship.id, 'alpha');
      }
      if ((hydrated as any).bumpUrl && (hydrated as any).bumpUrl.startsWith('/api/game-assets')) {
         (hydrated as any).bumpUrl = getShipAssetUrl(ship.id, 'bump');
      }
      if ((hydrated as any).lightUrl && (hydrated as any).lightUrl.startsWith('/api/game-assets')) {
         (hydrated as any).lightUrl = getShipAssetUrl(ship.id, 'lightmap');
      }

      if (!(hydrated as any).colorUrl) (hydrated as any).colorUrl = getShipAssetUrl(ship.id, 'color');
      if (!(hydrated as any).alphaUrl) (hydrated as any).alphaUrl = getShipAssetUrl(ship.id, 'alpha');
      if (!(hydrated as any).bumpUrl) (hydrated as any).bumpUrl = getShipAssetUrl(ship.id, 'bump');
      if (!(hydrated as any).lightUrl) (hydrated as any).lightUrl = getShipAssetUrl(ship.id, 'lightmap');
      if (!hydrated.imagePath) hydrated.imagePath = getShipAssetUrl(ship.id, 'composite');
      
      list.push(hydrated); // Ensure custom ships appear at the end
  }

  const leadShipId: string | null = db.rosterLead || null;

  if (leadShipId) {
      const idx = list.findIndex(s => s.id === leadShipId);
      if (idx > -1) {
          const [lead] = list.splice(idx, 1);
          list.unshift(lead);
      }
  }

  return list;
}

