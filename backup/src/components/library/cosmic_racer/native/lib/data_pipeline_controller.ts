import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(process.cwd(), '.data');

export interface TargetFileStatus {
    exists: boolean;
    sizeBytes?: number;
    lastModified?: string;
    synced?: boolean;
    error?: string;
}

export interface PipelineStatus {
    success: boolean;
    files: Record<string, {
        exists: boolean;
        sizeBytes?: number;
        error?: string;
        lastModified?: string;
    }>;
    failedLoads?: Array<{
        timestamp: string;
        url: string;
        error: string;
    }>;
    targets?: {
        screensaver: {
            exists: boolean;
            files: Record<string, TargetFileStatus>;
            feeds?: Record<string, { exists: boolean, synced: boolean }>;
        };
        website: {
            exists: boolean;
            files: Record<string, TargetFileStatus>;
            feeds?: Record<string, { exists: boolean, synced: boolean }>;
        };
    };
}

function checkTargetFile(sourcePath: string, targetPath: string): TargetFileStatus {
    if (!fs.existsSync(targetPath)) {
        return { exists: false };
    }
    try {
        const stats = fs.statSync(targetPath);
        let synced = false;
        if (fs.existsSync(sourcePath)) {
            const srcStats = fs.statSync(sourcePath);
            if (stats.size === srcStats.size) {
                const srcContent = fs.readFileSync(sourcePath, 'utf-8');
                const tgtContent = fs.readFileSync(targetPath, 'utf-8');
                if (srcContent === tgtContent) {
                    synced = true;
                }
            }
        }
        return {
            exists: true,
            sizeBytes: stats.size,
            lastModified: stats.mtime.toLocaleString(),
            synced
        };
    } catch (e: any) {
        return { exists: true, error: e.message, synced: false };
    }
}

function checkFeedInConfig(sourceFeedPath: string, targetConfigPath: string): boolean {
    if (!fs.existsSync(sourceFeedPath) || !fs.existsSync(targetConfigPath)) {
        return false;
    }
    try {
        const feedData = JSON.parse(fs.readFileSync(sourceFeedPath, 'utf-8'));
        let configData = JSON.parse(fs.readFileSync(targetConfigPath, 'utf-8'));
        
        if (sourceFeedPath.endsWith('screensaver_config.json')) {
            configData = configData.screensaver_config || configData.screensaver || {};
        }
        
        for (const key of Object.keys(feedData)) {
            if (configData[key] === undefined) {
                return false;
            }
            if (configData.progressionModeEnabled && 
                (key === 'activeRoster' || key === 'rosterLead' || key === 'customAdditions' || key === 'customImages')) {
                continue;
            }
            if (JSON.stringify(feedData[key]) !== JSON.stringify(configData[key])) {
                return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function getPipelineStatus(): PipelineStatus {
    const sections = [
        'section_ships.json',
        'section_fx.json',
        'section_physics.json',
        'section_audio.json',
        'season_01_progression.json',
        'section_equipment.json',
        'section_weapons.json',
        'section_environment.json',
        'cosmic_racers_news_feed.json',
        'screensaver_config.json'
    ];
    const status: PipelineStatus = { success: true, files: {}, failedLoads: [] };
    
    for (const file of sections) {
        const filePath = file === 'screensaver_config.json'
            ? path.join(process.cwd(), 'src/app/(cms)/game-assets/data/screensaver_config.json')
            : path.join(DATA_DIR, file);
        const exists = fs.existsSync(filePath);
        if (exists) {
            try {
                const stats = fs.statSync(filePath);
                status.files[file] = {
                    exists: true,
                    sizeBytes: stats.size,
                    lastModified: stats.mtime.toLocaleString()
                };
            } catch (e: any) {
                status.files[file] = { exists: true, error: e.message };
                status.success = false;
            }
        } else {
            status.files[file] = { exists: false };
            status.success = false;
        }
    }
    
    // Also check game_config
    const shipConfigPath = path.join(process.cwd(), 'public', 'game_assets', 'data', 'game_config.json');
    const gameConfigExists = fs.existsSync(shipConfigPath);
    if (gameConfigExists) {
        try {
            const stats = fs.statSync(shipConfigPath);
            status.files['game_config.json'] = {
                exists: true,
                sizeBytes: stats.size,
                lastModified: stats.mtime.toLocaleString()
            };
        } catch (e: any) {
            status.files['game_config.json'] = { exists: true, error: e.message };
        }
    } else {
        status.files['game_config.json'] = { exists: false };
    }

    // Check targets files synchronization (Screensaver and Website)
    const ssRepo = path.join(process.cwd(), '../cosmic_racers_screensaver');
    const ssExists = fs.existsSync(ssRepo);
    const ssFilesStatus: Record<string, TargetFileStatus> = {};
    
    if (ssExists) {
        // game_config.json
        const ssGameConfigPath = path.join(ssRepo, 'public', 'game_assets', 'data', 'game_config.json');
        ssFilesStatus['game_config.json'] = checkTargetFile(shipConfigPath, ssGameConfigPath);
        
        // screensaver_config.json
        const ssConfigPath = path.join(ssRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'screensaver_config.json');
        let screensaverConfigSynced = false;
        if (fs.existsSync(ssConfigPath) && gameConfigExists) {
            try {
                const srcDb = JSON.parse(fs.readFileSync(shipConfigPath, 'utf-8'));
                const expectedPayload = srcDb.screensaver_config || srcDb.screensaver || {};
                const targetPayload = JSON.parse(fs.readFileSync(ssConfigPath, 'utf-8'));

                // Strip volatile compiler-injected keys to ensure zero-impedance comparison
                const volatileKeys = ['autoPilot', 'autoTour', 'showGrid', 'last_sync_timestamp', 'build_number'];
                for (const key of volatileKeys) {
                    delete expectedPayload[key];
                    delete targetPayload[key];
                }

                if (JSON.stringify(expectedPayload) === JSON.stringify(targetPayload)) {
                    screensaverConfigSynced = true;
                }
            } catch (e) {}
        }
        const ssConfigStats = fs.existsSync(ssConfigPath) ? fs.statSync(ssConfigPath) : null;
        ssFilesStatus['screensaver_config.json'] = {
            exists: !!ssConfigStats,
            sizeBytes: ssConfigStats?.size,
            lastModified: ssConfigStats?.mtime.toLocaleString(),
            synced: screensaverConfigSynced
        };

        // splash_cursor_config.json
        const ssSplashPath = path.join(ssRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'splash_cursor_config.json');
        let splashConfigSynced = false;
        if (fs.existsSync(ssSplashPath) && gameConfigExists) {
            try {
                const srcDb = JSON.parse(fs.readFileSync(shipConfigPath, 'utf-8'));
                const expectedSplash = {
                    splash_cursor_config: {
                        vector_gradients: srcDb.vector_gradients,
                        environment_state: srcDb.environment_state,
                        procedural_planets: srcDb.procedural_planets,
                        shipFxColors: srcDb.shipFxColors
                    }
                };
                const targetSplash = JSON.parse(fs.readFileSync(ssSplashPath, 'utf-8'));
                if (JSON.stringify(expectedSplash) === JSON.stringify(targetSplash)) {
                    splashConfigSynced = true;
                }
            } catch (e) {}
        }
        const ssSplashStats = fs.existsSync(ssSplashPath) ? fs.statSync(ssSplashPath) : null;
        ssFilesStatus['splash_cursor_config.json'] = {
            exists: !!ssSplashStats,
            sizeBytes: ssSplashStats?.size,
            lastModified: ssSplashStats?.mtime.toLocaleString(),
            synced: splashConfigSynced
        };
    }

    const webRepo = path.join(process.cwd(), '../cosmic_racers_website');
    const webExists = fs.existsSync(webRepo);
    const webFilesStatus: Record<string, TargetFileStatus> = {};
    
    if (webExists) {
        // tour_racing_prefs.json
        const webTourPath = path.join(webRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'tour_racing_prefs.json');
        let tourPrefsSynced = false;
        if (fs.existsSync(webTourPath) && gameConfigExists) {
            try {
                const srcDb = JSON.parse(fs.readFileSync(shipConfigPath, 'utf-8'));
                const expectedPayload = srcDb.tour_racing_prefs || {};
                const targetPayload = JSON.parse(fs.readFileSync(webTourPath, 'utf-8'));
                if (JSON.stringify(expectedPayload) === JSON.stringify(targetPayload)) {
                    tourPrefsSynced = true;
                }
            } catch (e) {}
        }
        const webTourStats = fs.existsSync(webTourPath) ? fs.statSync(webTourPath) : null;
        webFilesStatus['tour_racing_prefs.json'] = {
            exists: !!webTourStats,
            sizeBytes: webTourStats?.size,
            lastModified: webTourStats?.mtime.toLocaleString(),
            synced: tourPrefsSynced
        };

        // splash_cursor_config.json
        const webSplashPath = path.join(webRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'splash_cursor_config.json');
        let splashConfigSynced = false;
        if (fs.existsSync(webSplashPath) && gameConfigExists) {
            try {
                const srcDb = JSON.parse(fs.readFileSync(shipConfigPath, 'utf-8'));
                const expectedSplash = {
                    splash_cursor_config: {
                        vector_gradients: srcDb.vector_gradients,
                        environment_state: srcDb.environment_state,
                        procedural_planets: srcDb.procedural_planets,
                        shipFxColors: srcDb.shipFxColors
                    }
                };
                const targetSplash = JSON.parse(fs.readFileSync(webSplashPath, 'utf-8'));
                if (JSON.stringify(expectedSplash) === JSON.stringify(targetSplash)) {
                    splashConfigSynced = true;
                }
            } catch (e) {}
        }
        const webSplashStats = fs.existsSync(webSplashPath) ? fs.statSync(webSplashPath) : null;
        webFilesStatus['splash_cursor_config.json'] = {
            exists: !!webSplashStats,
            sizeBytes: webSplashStats?.size,
            lastModified: webSplashStats?.mtime.toLocaleString(),
            synced: splashConfigSynced
        };
    }

    // Feeds compiled check across targets
    const feedFiles = [
        'section_ships.json',
        'section_fx.json',
        'section_physics.json',
        'section_audio.json',
        'season_01_progression.json',
        'section_equipment.json',
        'section_weapons.json',
        'section_environment.json',
        'screensaver_config.json'
    ];

    const ssFeeds: Record<string, { exists: boolean, synced: boolean }> = {};
    if (ssExists) {
        const ssGameConfigPath = path.join(ssRepo, 'public', 'game_assets', 'data', 'game_config.json');
        for (const file of feedFiles) {
            const sourcePath = file === 'screensaver_config.json'
                ? path.join(process.cwd(), 'src/app/(cms)/game-assets/data/screensaver_config.json')
                : path.join(DATA_DIR, file);
            const exists = fs.existsSync(sourcePath);
            let synced = false;
            if (exists && fs.existsSync(ssGameConfigPath)) {
                synced = checkFeedInConfig(sourcePath, ssGameConfigPath);
            }
            ssFeeds[file] = { exists, synced };
        }
    }

    const webFeeds: Record<string, { exists: boolean, synced: boolean }> = {};
    if (webExists) {
        const webTourPrefsPath = path.join(webRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'tour_racing_prefs.json');
        for (const file of feedFiles) {
            const sourcePath = file === 'screensaver_config.json'
                ? path.join(process.cwd(), 'src/app/(cms)/game-assets/data/screensaver_config.json')
                : path.join(DATA_DIR, file);
            const exists = fs.existsSync(sourcePath);
            let synced = false;
            if (exists) {
                try {
                    let targetObj: any = null;
                    if (file === 'section_physics.json') {
                        if (fs.existsSync(webTourPrefsPath)) {
                            targetObj = JSON.parse(fs.readFileSync(webTourPrefsPath, 'utf-8'));
                        }
                    } else {
                        const webSplashPath = path.join(webRepo, 'src', 'app', 'world-apps', 'game-assets', 'data', 'splash_cursor_config.json');
                        if (fs.existsSync(webSplashPath)) {
                            const splashContent = JSON.parse(fs.readFileSync(webSplashPath, 'utf8'));
                            const innerConfig = splashContent.splash_cursor_config || {};
                            if (file === 'section_environment.json') {
                                targetObj = innerConfig.environment_state || {};
                            } else {
                                targetObj = innerConfig;
                            }
                        }
                    }
                    
                    let match = true;
                    if (targetObj) {
                        const feedData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
                        for (const key of Object.keys(feedData)) {
                            if (targetObj[key] !== undefined) {
                                if (JSON.stringify(feedData[key]) !== JSON.stringify(targetObj[key])) {
                                    match = false;
                                    break;
                                }
                            }
                        }
                    }
                    synced = match;
                } catch (e) {
                    synced = false;
                }
            }
            webFeeds[file] = { exists, synced };
        }
    }

    status.targets = {
        screensaver: {
            exists: ssExists,
            files: ssFilesStatus,
            feeds: ssFeeds
        },
        website: {
            exists: webExists,
            files: webFilesStatus,
            feeds: webFeeds
        }
    };

    // Parse runtime log for output pipeline load failures
    const homeDir = os.homedir();
    const candidateLogPaths = [
        path.join(process.cwd(), '..', 'screensaver_runtime.log'),
        path.join(homeDir, 'Library', 'Containers', 'com.apple.ScreenSaver.Engine.legacyScreenSaver', 'Data', 'Library', 'Caches', 'screensaver_runtime.log'),
        path.join(homeDir, 'Library', 'Containers', 'com.apple.ScreenSaverEngine', 'Data', 'Library', 'Caches', 'screensaver_runtime.log')
    ];
    let logPath = candidateLogPaths[0];
    for (const p of candidateLogPaths) {
        if (fs.existsSync(p)) {
            logPath = p;
            break;
        }
    }
    if (fs.existsSync(logPath)) {
        try {
            const logs = fs.readFileSync(logPath, 'utf-8');
            const lines = logs.split('\n');
            const failures: Array<{ timestamp: string, url: string, error: string }> = [];

            for (const line of lines) {
                if (line.includes('Fetch Failed:')) {
                    // Example format: [2026-05-31 08:11:07 +0000] [JS LOG] Fetch Failed: /api/game-assets/config - Load failed
                    const parts = line.split('] [JS LOG] Fetch Failed: ');
                    if (parts.length === 2) {
                        const rawTime = parts[0].replace('[', '');
                        const rest = parts[1];
                        const errParts = rest.split(' - ');
                        const url = errParts[0];
                        const errorMsg = errParts[1] || 'Load failed';
                        failures.push({
                            timestamp: rawTime,
                            url,
                            error: errorMsg
                        });
                    }
                }
            }
            // Retain last 30 entries
            status.failedLoads = failures.slice(-30).reverse();
        } catch (e) {
            console.error('Failed to parse runtime log:', e);
        }
    }
    
    return status;
}

export function getRawFileContent(filename: string): any {
    try {
        const filePath = filename === 'game_config.json'
            ? path.join(process.cwd(), 'public', 'game_assets', 'data', 'game_config.json')
            : filename === 'screensaver_config.json'
                ? path.join(process.cwd(), 'src/app/(cms)/game-assets/data/screensaver_config.json')
                : path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e: any) {
        return { error: `Failed to load file contents: ${e.message}` };
    }
    return { error: 'File does not exist' };
}

export function compileMasterConfig(): any {
    const sections = [
        'section_ships.json',
        'section_fx.json',
        'section_physics.json',
        'section_audio.json',
        'season_01_progression.json',
        'section_equipment.json',
        'section_weapons.json',
        'section_environment.json'
    ];

    let masterConfig: any = {};

    for (const file of sections) {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                masterConfig = { ...masterConfig, ...data };
            } catch(e) {
                console.error(`Error reading ${file}:`, e);
            }
        }
    }

    // Include screensaver config if it exists
    const screensaverPath = path.join(process.cwd(), 'src/app/(cms)/game-assets/data/screensaver_config.json');
    if (fs.existsSync(screensaverPath)) {
        try {
            const ssData = JSON.parse(fs.readFileSync(screensaverPath, 'utf-8'));
            masterConfig.screensaver = ssData;
        } catch(e) {}
    }
    
    // Include news feed if it exists
    const newsFeedPath = path.join(process.cwd(), '.data', 'cosmic_racers_news_feed.json');
    if (fs.existsSync(newsFeedPath)) {
        try {
            const newsData = JSON.parse(fs.readFileSync(newsFeedPath, 'utf-8'));
            masterConfig.newsFeed = newsData;
        } catch(e) {
            console.error("Error reading news feed config:", e);
        }
    }
    
    // Include the dynamic game assets database (ship physics, planet prefs, overrides, etc.)
    let shipConfigPath = path.join(process.cwd(), 'public', 'game_assets', 'data', 'game_config.json');
    if (!fs.existsSync(shipConfigPath)) {
        shipConfigPath = path.join(process.cwd(), 'game_assets', 'data', 'game_config.json');
    }
    if (fs.existsSync(shipConfigPath)) {
        try {
            const shipDbData = JSON.parse(fs.readFileSync(shipConfigPath, 'utf-8'));
            masterConfig = { ...masterConfig, ...shipDbData };
        } catch(e) {
            console.error(`Error reading game_config.json:`, e);
        }
    }

    // --- PROGRESSION MODE ALIGNMENT OVERRIDES ---
    if (masterConfig.progressionModeEnabled) {
         delete masterConfig.lastEditedShip;
         // 1. Re-apply all visual/audio config keys from progression json on top of game_config
         const progressionPath = path.join(DATA_DIR, 'season_01_progression.json');
         if (fs.existsSync(progressionPath)) {
              try {
                   const progression = JSON.parse(fs.readFileSync(progressionPath, 'utf-8'));
                   const progressionOverrideKeys = [
                        'missile',
                        'flightGradientConfig', 'backgroundEffect', 'lanyardConfig',
                        'audio', 'planets', 'fluidGlassConfig', 'ixnexConfig',
                        'mobileCfg', 'arenaCoreCfg', 'particlesConfig', 'lightningConfig'
                   ];
                   for (const key of progressionOverrideKeys) {
                        if (progression[key] !== undefined) masterConfig[key] = progression[key];
                   }
                   for (const key of Object.keys(progression)) {
                        if (key.startsWith('glass') || key === 'shadow') {
                             masterConfig[key] = progression[key];
                        }
                   }
              } catch (e) {
                   console.error("Progression override parse error:", e);
              }
         }

         // 2. Align roster and lead ship
         const progressionOrder = masterConfig.progressionShipOrder || [];
         masterConfig.activeRoster = [...progressionOrder];
         masterConfig.rosterLead = progressionOrder[0] || null;

         // 3. Filter and sort customAdditions
         const additions = masterConfig.customAdditions || [];
         const additionsMap = new Map(additions.map((a: any) => [a.id, a]));
         masterConfig.customAdditions = progressionOrder
              .map((id: string) => additionsMap.get(id))
              .filter((a: any) => !!a);

         // 4. Filter per-ship keyed objects
         const perShipKeys = [
              'customImages', 'classifications', 'registrations', 'rotations',
              'shipbank_state_per_ship', 'physics_assignments', 'shipFxColors'
         ];
         for (const key of perShipKeys) {
              if (masterConfig[key] && typeof masterConfig[key] === 'object') {
                   const stripped: any = {};
                   for (const id of progressionOrder) {
                        if (masterConfig[key][id] !== undefined) {
                             stripped[id] = masterConfig[key][id];
                        }
                   }
                   masterConfig[key] = stripped;
              }
         }

         // 5. Map customImages texture paths to static filenames
         if (!masterConfig.customImages) masterConfig.customImages = {};
         const PRODUCTION_DIR = path.join(process.cwd(), 'public', 'game_assets', 'production', 'ships');
         const TEXTURE_TYPES = ['color', 'alpha', 'bump', 'lightmap'];

         for (const shipId of progressionOrder) {
              if (!masterConfig.customImages[shipId]) {
                   masterConfig.customImages[shipId] = {};
              }
              const images = masterConfig.customImages[shipId];

              for (const type of TEXTURE_TYPES) {
                   const fileName = `${shipId}_${type}.webp`;
                   const filePath = path.join(PRODUCTION_DIR, fileName);

                   if (fs.existsSync(filePath)) {
                        images[type] = `/game_assets/production/ships/${fileName}`;
                   } else if (images[type] && images[type].startsWith('/api/')) {
                        images[type] = `/game_assets/production/ships/${fileName}`;
                   }
              }

              const compositeFile = `${shipId}.webp`;
              if (fs.existsSync(path.join(PRODUCTION_DIR, compositeFile))) {
                   images.composite = `/game_assets/production/ships/${compositeFile}`;
              }
         }

         // Rewrite any /api/ URLs in all of customImages
         for (const [shipId, images] of Object.entries(masterConfig.customImages)) {
              if (typeof images === 'object' && images !== null) {
                   for (const [mapType, url] of Object.entries(images)) {
                        if (typeof url === 'string' && url.startsWith('/api/game-assets')) {
                             const suffix = mapType === 'composite' ? '' : `_${mapType}`;
                             (masterConfig.customImages[shipId] as any)[mapType] = `/game_assets/production/ships/${shipId}${suffix}.webp`;
                        }
                   }
              }
         }
    }

    return masterConfig;
}
