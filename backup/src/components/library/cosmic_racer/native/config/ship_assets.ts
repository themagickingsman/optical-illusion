import { resolveAssetUrl } from './asset_resolver';

export const SHIP_MAP: Record<string, string> = {
  // ── Arena keys (fighter/frigate/cruiser/battleship/carrier) → best v3 match ──
  fighter:    '/game_assets/ships/v3/game/Gemini_Generated_Image_iaa3upiaa3upiaa3.jpeg', // Astra Heavy Fighter
  frigate:    '/game_assets/ships/v3/game/Gemini_Generated_Image_jb68w1jb68w1jb68.jpeg', // Astra Heavy Frigate A
  cruiser:    '/game_assets/ships/v3/game/Gemini_Generated_Image_cf4he2cf4he2cf4h.jpeg', // Astra Tactical Bomber
  battleship: '/game_assets/ships/v3/game/Gemini_Generated_Image_4525224525224525.jpeg', // Astra Heavy Capital Cruiser
  carrier:    '/game_assets/ships/v3/game/Gemini_Generated_Image_894sul894sul894s.jpeg', // Astra Medium Fighter

  // ── Alpha equivalents mapping ──
  'fighter-alpha':    '/game_assets/ships/v3/game/Gemini_Generated_Image_iaa3upiaa3upiaa3.jpeg',
  'frigate-alpha':    '/game_assets/ships/v3/game/Gemini_Generated_Image_jb68w1jb68w1jb68.jpeg',
  'cruiser-alpha':    '/game_assets/ships/v3/game/Gemini_Generated_Image_cf4he2cf4he2cf4h.jpeg',
  'battleship-alpha': '/game_assets/ships/v3/game/Gemini_Generated_Image_4525224525224525.jpeg',
  'carrier-alpha':    '/game_assets/ships/v3/game/Gemini_Generated_Image_894sul894sul894s.jpeg',
  
  // ── All v3 ships by slug ──────────────────────────────────────────────────────
  'v3-capital-cruiser':    '/game_assets/ships/v3/game/Gemini_Generated_Image_4525224525224525.jpeg',
  'v3-heavy-frigate':      '/game_assets/ships/v3/game/Gemini_Generated_Image_jb68w1jb68w1jb68.jpeg',
  'v3-medium-fighter':     '/game_assets/ships/v3/game/Gemini_Generated_Image_894sul894sul894s.jpeg',
  'v3-heavy-fighter':      '/game_assets/ships/v3/game/Gemini_Generated_Image_iaa3upiaa3upiaa3.jpeg',
  'v3-tactical-bomber':    '/game_assets/ships/v3/game/Gemini_Generated_Image_cf4he2cf4he2cf4h.jpeg',
  'v3-light-interceptor':  '/game_assets/ships/v3/game/Gemini_Generated_Image_9ynlsi9ynlsi9ynl.jpeg',
  'v3-stealth-interceptor':'/game_assets/ships/v3/game/Gemini_Generated_Image_677ftt677ftt677f.jpeg',
  'v3-scout-ship':         '/game_assets/ships/v3/game/Gemini_Generated_Image_pal33jpal33jpal3.jpeg',
  'v3-scout-ship-ii':      '/game_assets/ships/v3/game/Gemini_Generated_Image_888ev7888ev7888e.jpeg',
  'v3-utility-craft':      '/game_assets/ships/v3/game/Gemini_Generated_Image_i958qui958qui958.jpeg',
  
  // ── v4 fleet slugs (correct path: /game_assets/ships/v4/) ────────────────
  'v4-orange':      '/game_assets/ships/v4/Gemini_Generated_Image_dvjj7qdvjj7qdvjj.jpeg',   // orange – player 1 default
  'v4-white-camo':  '/game_assets/ships/v4/Gemini_Generated_Image_fqpx93fqpx93fqpx.jpeg',
  'v4-white-tac':   '/game_assets/ships/v4/Gemini_Generated_Image_fi3xv9fi3xv9fi3x.jpeg',
  'v4-black':       '/game_assets/ships/v4/Gemini_Generated_Image_c4h8esc4h8esc4h8.jpeg',
  'v4-dark-camo':   '/game_assets/ships/v4/Gemini_Generated_Image_loelrjloelrjloel.jpeg',
  'v4-orange-camo': '/game_assets/ships/v4/Gemini_Generated_Image_dmt01dmt01dmt01d.jpeg',
  
  // ── v5 fleet (4 new renders, no flames, clean bg) ─────────────────────────
  'v5-alpha':  '/game_assets/ships/v5/Gemini_Generated_Image_ahexs9ahexs9ahex.jpeg',
  'v5-beta':   '/game_assets/ships/v5/Gemini_Generated_Image_cvphhacvphhacvph.jpeg',
  'v5-gamma':  '/game_assets/ships/v5/Gemini_Generated_Image_gmh8r0gmh8r0gmh8.jpeg',
  'v5-delta':  '/game_assets/ships/v5/Gemini_Generated_Image_nzq4m5nzq4m5nzq4.jpeg',
  'v4-red-ghost': '/game_assets/ships/v4/Gemini_Generated_Image_re2cvwre2cvwre2c.jpeg',
  'v4-neon-green': '/game_assets/ships/v4/Gemini_Generated_Image_mmbv1gmmbv1gmmbv.jpeg',
  
  // ── Studio Renders ─────────────────────────────────────────────────────────────
  'studio-v1': '/game_assets/ships/masks/ship/v1',
  'studio-v2': '/game_assets/ships/masks/ship/v2',
  'studio-v3': '/game_assets/ships/masks/ship/v3',
  'studio-v4': '/game_assets/ships/masks/ship/v4',
  'studio-v5': '/game_assets/ships/masks/ship/v5',
  
  // ── Legacy V1 ──────────────────────────────────────────────────────────────────
  'v1-player-1': '/game_assets/ships/v1/player_ship_01.png',
  'v1-player-2': '/game_assets/ships/v1/player_ship_02.png',
  'v1-player-3': '/game_assets/ships/v1/player_ship_03.png',
  'v1-ship-01': '/game_assets/ships/v1/ship_01.png',
  'v1-ship-02': '/game_assets/ships/v1/ship_02.webp',
  'v1-ship-04': '/game_assets/ships/v1/ship_04.webp',
  'v1-ship-05': '/game_assets/ships/v1/ship_05.png',
  'v1-ship-06': '/game_assets/ships/v1/ship_06.webp',
  'v1-ship-07': '/game_assets/ships/v1/ship_07.webp',
  'v1-ship-08': '/game_assets/ships/v1/ship_08.webp',
  'v1-ship-09': '/game_assets/ships/v1/ship_09.webp',
};

export type ShipAssetType = 'composite' | 'color' | 'alpha' | 'bump' | 'lightmap';

export function getShipAssetUrl(
  shipId: string,
  type: ShipAssetType = 'composite'
): string {
  return resolveAssetUrl(getRawShipAssetUrl(shipId, type));
}

function getRawShipAssetUrl(
  shipId: string,
  type: ShipAssetType = 'composite'
): string {
  if (!shipId) return '';

  // Studio renders
  if (shipId.startsWith('studio-')) {
    const vNum = shipId.replace('studio-', '');
    let fileName = 'color.png';
    if (type === 'bump') fileName = 'bump.png';
    else if (type === 'lightmap') fileName = 'lightmap.png';
    else if (type === 'alpha') {
      if (['v1', 'v4', 'v5'].includes(vNum)) fileName = 'alpha.png';
      else if (['v2', 'v3'].includes(vNum)) fileName = 'mask.png';
      else fileName = `ship_${vNum.replace('v','')}_alpha.png`;
    }
    return `/game_assets/ships/masks/ship/${vNum}/${fileName}`;
  }

  // General mappings
  const mapped = SHIP_MAP[shipId];
  if (mapped) {
    if (type === 'composite' || type === 'color') {
      return mapped;
    }
    // Fallback 1x1 base64 pixels for maps on standard images
    if (type === 'alpha') {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    }
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  }

  // Fallback to production/custom path structure (normally uploaded files)
  if (type === 'lightmap') {
    return '';
  }
  const suffix = type === 'composite' ? '' : `_${type}`;
  return `/game_assets/production/ships/${shipId}${suffix}.webp`;
}
