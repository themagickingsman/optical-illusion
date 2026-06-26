import fs from 'fs/promises';
import path from 'path';
import SCANNED_PAGES_RAW from '../data/sources/scanned_pages_manifest.json';

// UNIVERSAL VAULT ROOT
const VAULT_ROOT = path.join(process.cwd(), 'src', 'data', 'INPUTS', 'indus_valley_scripts', 'raw_data');
const SCANNED_PAGES = SCANNED_PAGES_RAW as any[];

export interface ScannedPageData {
    id: string;
    slug: string;
    name: string;
    original_source: string;
    meta: {
        process_node: string;
        timestamp: string;
        file_size: string;
        file_path?: string;
        book_id?: string;
        original_source_image?: string;
    };
    status: string;
    imageUrl: string;
    thumbnailUrl: string; // NEW: Low-rez thumb
    artifacts: string[];
    vector_data: {
        density: string;
        noise_floor: string;
    };
    visual_geometry?: any;
    heatmap?: any[];
}

/**
 * UTILITY: Find a page across all books in the vault.
 * Returns { bookId, pagePath, analysisPath } or null.
 */
async function locatePageInVault(pageId: string) {
    try {
        const entries = await fs.readdir(VAULT_ROOT, { withFileTypes: true });
        const bookDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('book_'));

        for (const book of bookDirs) {
            const pagePath = path.join(VAULT_ROOT, book.name, 'pages_processed', pageId);
            const analysisPath = path.join(pagePath, 'analysis.json');

            // Check if Atomic Folder exists
            try {
                await fs.access(analysisPath);
                return { bookId: book.name, pagePath, analysisPath };
            } catch (e) {
                // Not in this book, continue
            }
        }
    } catch (e) {
        console.warn(`[Vault] Error scanning vault root: ${VAULT_ROOT}`, e);
    }
    return null;
}

/**
 * Reads all pages from all books in the vault.
 */
export async function getScannedPages(): Promise<ScannedPageData[]> {
    const allPages: ScannedPageData[] = [];

    try {
        const entries = await fs.readdir(VAULT_ROOT, { withFileTypes: true });
        const bookDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('book_'));

        for (const book of bookDirs) {
            const pagesDir = path.join(VAULT_ROOT, book.name, 'pages_processed');
            try {
                const pageFolders = await fs.readdir(pagesDir, { withFileTypes: true });

                for (const folder of pageFolders) {
                    if (!folder.isDirectory() || !folder.name.startsWith('PAGE-')) continue;

                    const pageId = folder.name; // e.g. PAGE-103
                    const analysisPath = path.join(pagesDir, pageId, 'analysis.json');

                    try {
                        let content = "";
                        let data: any = {};

                        // Check size
                        const stats = await fs.stat(analysisPath);
                        if (stats.size > 50 * 1024 * 1024) {
                            data = { id: pageId, name: `Scan ${pageId}`, meta: {} };
                        } else {
                            content = await fs.readFile(analysisPath, 'utf-8');
                            data = JSON.parse(content);
                        }

                        // Enforce ID
                        if (!data.id) data.id = pageId;

                        // VISUAL VALIDATION (STRICT)
                        // 1. Check Public Thumb
                        const pageNum = pageId.replace('PAGE-', '');
                        const isNumeric = /^\d+$/.test(pageNum);
                        const paddedNum = isNumeric ? pageNum.padStart(3, '0') : pageNum;

                        const publicThumbPath = path.join(process.cwd(), 'public', 'images', 'deciphered', `hologram_page_${paddedNum}.jpg`);
                        let hasPublicThumb = false;
                        try {
                            await fs.access(publicThumbPath);
                            hasPublicThumb = true;
                        } catch { hasPublicThumb = false; }

                        // 2. Check Raw Scan
                        const rawScanPath = path.join(pagesDir, pageId, 'raw_scan.jpg');
                        let hasRawScan = false;
                        try {
                            await fs.access(rawScanPath);
                            hasRawScan = true;
                        } catch { hasRawScan = false; }

                        // SKIP if no visuals
                        if (!hasPublicThumb && !hasRawScan) {
                            // console.warn(`Skipping ${pageId}: No visual assets found.`);
                            continue;
                        }

                        const thumb = hasPublicThumb
                            ? `/images/deciphered/hologram_page_${paddedNum}.jpg`
                            : `/api/images/scans?book=${book.name}&pageId=${pageId}&file=raw_scan.jpg`;

                        // Normalize
                        const pageObj: ScannedPageData = {
                            id: data.id,
                            slug: data.id.toLowerCase(), // page-103
                            name: data.name || `Scan ${data.id}`,
                            original_source: data.original_source || "Vault",
                            meta: {
                                process_node: "Atomic Vault",
                                timestamp: new Date().toISOString(),
                                file_size: data.meta?.file_size || "JSON",
                                book_id: book.name,
                                file_path: rawScanPath,
                                original_source_image: `/api/images/scans?book=${book.name}&page=${pageId}&file=raw_scan.jpg`,
                                ...data.meta
                            },
                            status: "Deciphered",
                            imageUrl: `/api/images/scans?book=${book.name}&page=${pageId}&file=raw_scan.jpg`,
                            thumbnailUrl: thumb,
                            artifacts: data.artifacts || [],
                            vector_data: data.vector_data || { density: "N/A", noise_floor: "N/A" },
                            visual_geometry: data.visual_geometry,
                            heatmap: data.heatmap
                        };

                        // Merge Static Manifest Data (Vectors)
                        const staticPage = SCANNED_PAGES.find(p => p.id === pageId);
                        if (staticPage) {
                            // @ts-ignore
                            if (staticPage.vectorUrl) pageObj.vectorUrl = staticPage.vectorUrl;
                            // @ts-ignore
                            if (staticPage.vectorSplitManifest) pageObj.vectorSplitManifest = staticPage.vectorSplitManifest;
                        }

                        allPages.push(pageObj);

                    } catch (e) {
                        // console.warn(`Skipping invalid page: ${folder.name} in ${book.name}`);
                    }
                }
            } catch (e) {
                // console.warn(`No pages_processed in ${book.name}`);
            }
        }

        // Add pure static pages if not found in vault (Legacy Support / Virtual)
        // Add pure static pages if not found in vault (Legacy Support / Virtual)
        // const foundIds = new Set(allPages.map(p => p.id));
        // SCANNED_PAGES.forEach(staticPage => {
        //     if (!foundIds.has(staticPage.id)) {
        //         // Try to guess location even if not scanned yet (e.g. if we just have the folder but no json)
        //         // This ensures raw scans load even without analysis
        //         const guessBook = "book_02"; // Default for new stuff
        //         const guessPath = path.join(VAULT_ROOT, guessBook, 'pages_processed', staticPage.id, 'raw_scan.jpg');
        //
        //         // Default thumb
        //         const pageNum = staticPage.id.replace('PAGE-', '');
        //         const isNumeric = /^\d+$/.test(pageNum);
        //         const paddedNum = isNumeric ? pageNum.padStart(3, '0') : pageNum;
        //         const thumb = isNumeric 
        //             ? `/images/deciphered/hologram_page_${paddedNum}.jpg`
        //             : `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`;
        //
        //         allPages.push({
        //             id: staticPage.id,
        //             slug: staticPage.slug,
        //             name: staticPage.name,
        //             original_source: "Static Manifest",
        //             meta: {
        //                 process_node: "Static",
        //                 timestamp: new Date().toISOString(),
        //                 file_size: "0KB",
        //                 file_path: guessPath, // Optimistic guess
        //                 original_source_image: `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`,
        //                 ...staticPage.meta
        //             },
        //             status: staticPage.status,
        //             imageUrl: `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`,
        //             thumbnailUrl: thumb,
        //             artifacts: staticPage.artifacts,
        //             vector_data: { density: "N/A", noise_floor: "N/A" },
        //             // @ts-ignore
        //             vectorUrl: staticPage.vectorUrl,
        //             // @ts-ignore
        //             vectorSplitManifest: staticPage.vectorSplitManifest
        //         } as ScannedPageData);
        //     }
        // });

        return allPages.sort((a, b) => a.id.localeCompare(b.id));

    } catch (e: any) {
        if (e && e.code === 'ENOENT') {
            console.warn(`[Vault] Vault root directory not found (skipping local scans): ${VAULT_ROOT}`);
        } else {
            console.error("Critical Vault Error:", e);
        }
        return [];
    }
}

/**
 * Reads a single page by slug or ID.
 */
export async function getScannedPage(slug: string): Promise<ScannedPageData | null> {
    // slug might be "page-103" or "key9" -> mapped to ID
    // 1. Resolve ID
    let pageId = slug.toUpperCase().startsWith('PAGE-') ? slug.toUpperCase() : `PAGE-${slug.replace('page-', '').toUpperCase()}`;

    // Special case mapping if slug is "key9"
    if (slug === 'key9') pageId = 'PAGE-KEY-P9';

    // 2. Locate in Vault
    const location = await locatePageInVault(pageId);

    if (location) {
        try {
            // Check file size first to avoid OOM on massive 13D dumps
            const stats = await fs.stat(location.analysisPath);
            const MAX_JSON_SIZE = 50 * 1024 * 1024; // 50MB Limit

            let data: any = {};

            if (stats.size > MAX_JSON_SIZE) {
                // LIGHTWEIGHT LOAD
                console.warn(`[Vault] File too large (${(stats.size / 1024 / 1024).toFixed(1)} MB), skipping parse: ${location.analysisPath}`);
                data = {
                    id: pageId,
                    name: `Scan ${pageId} (Large Dataset)`,
                    status: "Deciphered",
                    artifacts: [],
                    meta: {
                        process_node: "Atomic Vault (Lightweight)",
                        file_size: `${(stats.size / 1024 / 1024).toFixed(1)} MB`
                    }
                };
            } else {
                // STANDARD LOAD
                const content = await fs.readFile(location.analysisPath, 'utf-8');
                data = JSON.parse(content);
            }

            // Thumb Logic
            const pageNum = pageId.replace('PAGE-', '');
            const isNumeric = /^\d+$/.test(pageNum);
            const paddedNum = isNumeric ? pageNum.padStart(3, '0') : pageNum;

            const thumb = isNumeric
                ? `/images/deciphered/hologram_page_${paddedNum}.jpg`
                : `/api/images/scans?book=${location.bookId}&page=${pageId}&file=raw_scan.jpg`;

            // SOURCE IMAGE LOGIC (Fallback to Hologram if Raw Scan missing)
            const rawScanPath = path.join(location.pagePath, 'raw_scan.jpg');
            let hasRawScan = false;
            try {
                await fs.access(rawScanPath);
                hasRawScan = true;
            } catch { hasRawScan = false; }

            const publicThumbPath = path.join(process.cwd(), 'public', 'images', 'deciphered', `hologram_page_${paddedNum}.jpg`);
            let hasPublicThumb = false;
            try {
                await fs.access(publicThumbPath);
                hasPublicThumb = true;
            } catch { hasPublicThumb = false; }

            // Prefer Raw Scan via API, else Public Hologram
            const finalImageUrl = hasRawScan
                ? `/api/images/scans?book=${location.bookId}&page=${pageId}&file=raw_scan.jpg`
                : (hasPublicThumb ? `/images/deciphered/hologram_page_${paddedNum}.jpg` : "");

            // Construct full object
            const pageObj: ScannedPageData = {
                id: pageId,
                slug: slug, // Keep requested slug
                name: data.name || `Scan ${pageId}`,
                original_source: location.pagePath,
                meta: {
                    process_node: "Atomic Vault",
                    timestamp: new Date().toISOString(),
                    file_size: data.meta?.file_size || "JSON",
                    book_id: location.bookId,
                    file_path: hasRawScan ? rawScanPath : publicThumbPath,
                    original_source_image: finalImageUrl,
                    ...data.meta
                },
                status: data.status || "Deciphered",
                imageUrl: finalImageUrl,
                thumbnailUrl: thumb,
                artifacts: data.artifacts || [],
                vector_data: data.vector_data || { density: "N/A", noise_floor: "N/A" },
                // @ts-ignore - Shim for ArtifactCore compatibility
                vector: {
                    vector_url: data.vectorUrl || null,
                    vector_split_manifest: data.vectorSplitManifest || null,
                    citations: {
                        location_source: finalImageUrl
                    }
                },
                visual_geometry: data.visual_geometry,
                heatmap: data.heatmap
            };

            // Merge Static
            const staticPage = SCANNED_PAGES.find(p => p.id === pageId);
            if (staticPage) {
                // @ts-ignore
                if (staticPage.vectorUrl) pageObj.vector.vector_url = staticPage.vectorUrl;
                // @ts-ignore
                if (staticPage.vectorSplitManifest) pageObj.vector.vector_split_manifest = staticPage.vectorSplitManifest;
            }
            if (pageObj.id === 'PAGE-100') {
                console.log("[DEBUG PAGE-100] Final Object:", JSON.stringify({
                    hasRawScan,
                    hasPublicThumb,
                    finalImageUrl,
                    meta_original: pageObj.meta.original_source_image,
                    imageUrl: pageObj.imageUrl,
                    // Check Vector Data
                    // @ts-ignore
                    vector: pageObj.vector,
                    staticPageFound: !!staticPage,
                    staticVectorUrl: staticPage?.vectorUrl
                }, null, 2));
            }

            return pageObj;

        } catch (e) {
            console.error(`Failed to parse analysis for ${pageId}`, e);
        }
    }

    // 3. Fallback: Static Only
    const staticPage = SCANNED_PAGES.find(p => p.slug === slug || p.id === pageId);
    if (staticPage) {
        const guessBook = "book_02";
        const guessPath = path.join(VAULT_ROOT, guessBook, 'pages_processed', staticPage.id, 'raw_scan.jpg');

        const pageNum = staticPage.id.replace('PAGE-', '');
        const isNumeric = /^\d+$/.test(pageNum);
        const paddedNum = isNumeric ? pageNum.padStart(3, '0') : pageNum;

        const thumb = isNumeric
            ? `/images/deciphered/hologram_page_${paddedNum}.jpg`
            : `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`;

        return {
            id: staticPage.id,
            slug: staticPage.slug,
            name: staticPage.name,
            original_source: "Static Manifest",
            meta: {
                process_node: "Static",
                timestamp: new Date().toISOString(),
                file_size: "0KB",
                file_path: guessPath,
                original_source_image: `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`,
                ...staticPage.meta
            },
            status: staticPage.status,
            imageUrl: `/api/images/scans?book=${guessBook}&page=${staticPage.id}&file=raw_scan.jpg`,
            thumbnailUrl: thumb,
            artifacts: staticPage.artifacts,
            vector_data: { density: "N/A", noise_floor: "N/A" },
            // @ts-ignore
            vectorUrl: staticPage.vectorUrl,
            // @ts-ignore
            vectorSplitManifest: staticPage.vectorSplitManifest
        } as ScannedPageData;
    }

    return null;
}
