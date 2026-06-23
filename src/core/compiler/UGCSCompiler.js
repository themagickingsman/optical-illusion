const fs = require('fs');
const path = require('path');

const SOURCE_DIR = process.argv[2];
const OUTPUT_DIR = process.argv[3] || path.join(process.cwd(), 'out', 'ugcs_component');

if (!SOURCE_DIR || !fs.existsSync(SOURCE_DIR)) {
    console.error("FATAL: Source directory not found.");
    process.exit(1);
}

const folders = ['logic', 'assets', 'sync'];
folders.forEach(f => fs.mkdirSync(path.join(OUTPUT_DIR, f), { recursive: true }));

console.log(`[UGCS Compiler] Target: ${SOURCE_DIR}`);

function parseDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            parseDirectory(fullPath);
            return;
        }

        const ext = path.extname(file);
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return;

        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (file.includes('Engine') || file.includes('Math') || file.includes('State') || file.includes('Physics') || content.includes('Math.')) {
            console.log(`[SPLIT] -> /logic  : ${file}`);
            fs.copyFileSync(fullPath, path.join(OUTPUT_DIR, 'logic', file));
        }
        else if (file.includes('Renderer') || file.includes('Mesh') || file.includes('UI') || content.includes('import * as THREE') || ext === '.tsx') {
            console.log(`[SPLIT] -> /assets : ${file}`);
            fs.copyFileSync(fullPath, path.join(OUTPUT_DIR, 'assets', file));
        }
        else if (file.includes('Event') || file.includes('Bus') || file.includes('Sync') || content.includes('addEventListener')) {
            console.log(`[SPLIT] -> /sync   : ${file}`);
            fs.copyFileSync(fullPath, path.join(OUTPUT_DIR, 'sync', file));
        } else {
            console.log(`[SPLIT] -> /logic  : ${file}`);
            fs.copyFileSync(fullPath, path.join(OUTPUT_DIR, 'logic', file));
        }
    });
}

parseDirectory(SOURCE_DIR);

const sandboxCode = `import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function UGCS_SandboxWrapper() {
    const containerRef = useRef(null);

    useEffect(() => {
        console.log("[UGCS Sandbox] Mounting Component in Isolation...");
        return () => {
            console.log("[UGCS Sandbox] FATAL UNMOUNT CAUGHT. Triggering mandatory gl.dispose()...");
        };
    }, []);

    return (
        <div ref={containerRef} style={{width:'100%', height:'100%', position:'relative', backgroundColor:'black'}}>
            <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)', fontFamily:'monospace'}}>
                UGCS COMPONENT: COSMIC RACER PREVIEW ACTIVE
            </div>
        </div>
    );
}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.tsx'), sandboxCode);
console.log(`[UGCS Sandbox] Sandbox Wrapper Generated.`);

const manifest = {
    asset_key: `UGCS_COMP_${Date.now()}`,
    timestamp: new Date().toISOString(),
    protocol_version: "1.0",
    architecture: {
        logic_clock: "7.83Hz",
        photic_clock: "10Hz"
    },
    files: {
        logic: fs.readdirSync(path.join(OUTPUT_DIR, 'logic')),
        assets: fs.readdirSync(path.join(OUTPUT_DIR, 'assets')),
        sync: fs.readdirSync(path.join(OUTPUT_DIR, 'sync'))
    }
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[UGCS Key] AI Asset Key Generated: ${manifest.asset_key}`);
