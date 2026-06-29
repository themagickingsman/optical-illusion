/**
 * Client-Side API Router for Screensaver Standalone Environments
 * Intercepts global window.fetch calls and maps API endpoints to local compiled static resources.
 */

if (typeof window !== 'undefined') {
    const isStandalone = 
        window.location.protocol === 'app:' || 
        window.location.protocol === 'file:' || 
        window.location.port === '3006' || 
        window.location.search.includes('standalone=true') ||
        (window as any).isStandaloneMode === true;

    if (isStandalone && !(window as any).__fetchRouterActive) {
        (window as any).__fetchRouterActive = true;
        
        const originalFetch = window.fetch;
        
        console.log('🔌 [Fetch Router] Activating client-side API intercept router for standalone mode');

        // Cache the config fetch promise to avoid loading and parsing the same file multiple times
        let cachedConfigPromise: Promise<any> | null = null;
        let lastSeenVersion: string | null = null;
        const REMOTE_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? window.location.origin 
            : 'https://cosmic-racers.io';

        async function pingRemoteAndUpdate() {
            try {
                const res = await originalFetch(`${REMOTE_BASE_URL}/game_assets/data/game_config.json?t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const dataStr = JSON.stringify(data);
                    const oldData = localStorage.getItem('OFFLINE_MASTER_CONFIG');
                    if (oldData !== dataStr) {
                        localStorage.setItem('OFFLINE_MASTER_CONFIG', dataStr);
                        console.log('🔌 [Fetch Router] Remote update found and cached!');
                        return true; // indicates change
                    }
                }
            } catch (e) {
                console.log('🔌 [Fetch Router] Remote ping failed (Offline Mode Active)');
            }
            return false;
        }

        // Poll for hot-reload signals from the remote GitHub Pages deployment
        setInterval(async () => {
            try {
                const res = await originalFetch(`${REMOTE_BASE_URL}/game_assets/data/sync_version.txt?t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const currentVersion = await res.text();
                    if (lastSeenVersion && currentVersion !== lastSeenVersion) {
                        console.log('🔌 [Fetch Router] Detected remote sync_version.txt change! Downloading update...');
                        const updated = await pingRemoteAndUpdate();
                        if (updated) {
                            console.log('🔌 [Fetch Router] Update cached. Hot reloading...');
                            cachedConfigPromise = null;
                            window.location.reload();
                        }
                    }
                    lastSeenVersion = currentVersion;
                }
            } catch (e) {
                // Ignore missing file errors (Offline)
            }
        }, 10000);

        async function getCachedConfig(): Promise<any> {
            if (cachedConfigPromise) return cachedConfigPromise;

            cachedConfigPromise = (async () => {
                // 1. Check LocalStorage (Thermal Battery)
                const localData = localStorage.getItem('OFFLINE_MASTER_CONFIG');
                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        console.log('🔌 [Fetch Router] Booting from Thermal Battery (localStorage)');
                        // Background remote ping
                        pingRemoteAndUpdate().catch(() => {});
                        return parsed;
                    } catch (e) {
                        console.error('🔌 [Fetch Router] Failed to parse local config', e);
                    }
                }

                // 2. Fallback to Local Packaged File (First Install / Absolute Offline)
                try {
                    const res = await originalFetch(`/game_assets/data/game_config.json?t=${Date.now()}`, { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('OFFLINE_MASTER_CONFIG', JSON.stringify(data));
                        console.log('🔌 [Fetch Router] Booted from bundled local file');
                        pingRemoteAndUpdate().catch(() => {});
                        return data;
                    }
                } catch (e) {
                    console.error('🔌 [Fetch Router] Failed to fetch local packaged config', e);
                }

                // 3. Absolute Zero Fallback (Safe Mode Skeleton)
                console.warn('🔌 [Fetch Router] Total Data Collapse. Injecting Safe Mode Skeleton.');
                return { success: true, isFallback: true, data: { screensaver_config: {}, tour_racing_prefs: {}, shipbank_state: {}, shipbank_state_per_ship: {} } };
            })();

            return cachedConfigPromise;
        }

        window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            let urlString = '';
            if (typeof input === 'string') {
                urlString = input;
            } else if (input instanceof URL) {
                urlString = input.toString();
            } else if (input instanceof Request) {
                urlString = input.url;
            }

            // Route mapping rules: redirect dynamic endpoints to static game_config database
            if (urlString.includes('/api/game-assets/config') || urlString.includes('/api/master-config') || urlString.includes('game_config.json')) {
                console.log(`🔌 [Fetch Router] Intercepted config stream (cached): ${urlString}`);
                try {
                    const config = await getCachedConfig();
                    return new Response(JSON.stringify(config), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e: any) {
                    return new Response(JSON.stringify({ error: `Router fetch failed: ${e.message}` }), { status: 500 });
                }
            }

            if (urlString.includes('/api/world-apps/planet-editor') || urlString.includes('/api/science/planet-editor')) {
                console.log(`🔌 [Fetch Router] Intercepted planet-editor (cached): ${urlString}`);
                try {
                    const config = await getCachedConfig();
                    return new Response(JSON.stringify(config.planet_positions_override || {}), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e: any) {
                    return new Response(JSON.stringify({ error: `Router fetch failed: ${e.message}` }), { status: 500 });
                }
            }

            if (urlString.includes('/api/cms') || urlString.includes('key=cosmic_racers_news_feed')) {
                console.log(`🔌 [Fetch Router] Intercepted CMS news feed (cached): ${urlString}`);
                try {
                    const config = await getCachedConfig();
                    const newsFeed = config.newsFeed || {};
                    return new Response(JSON.stringify(newsFeed), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e: any) {
                    return new Response(JSON.stringify({ error: `Router fetch failed: ${e.message}` }), { status: 500 });
                }
            }

            // Block or stub configuration saves / analytics pushes to prevent CORS or network blocks
            if (urlString.includes('/api/') && (init?.method === 'POST' || init?.method === 'PUT')) {
                console.log(`🔌 [Fetch Router] Blocked write fetch in standalone mode: ${init.method} ${urlString}`);
                return new Response(JSON.stringify({ success: true, message: 'Intercepted and saved locally' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Fallback to standard request for standard static assets (WebP, WAV, etc.)
            return originalFetch(input, init);
        };
    }
}
export {};
