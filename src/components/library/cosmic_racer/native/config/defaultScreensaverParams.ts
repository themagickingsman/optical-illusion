import COMPILED_CONFIG from '../data/compiled_config.json';

/**
 * DEFAULT_SCREENSAVER_SETTINGS
 * 
 * This file acts as the ultimate offline fallback for the screensaver.
 * According to the UGCS architecture, the engine attempts to fetch live data from the Master Cloud (port 3001).
 * If the user is running offline, or the backend is unreachable, the engine gracefully degrades
 * to these meticulously tuned static defaults instead of defaulting to raw engine zeros.
 */

export const DEFAULT_SCREENSAVER_SETTINGS = COMPILED_CONFIG.screensaver_config;
