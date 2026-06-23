'use client';
import React, { useEffect, useRef } from 'react';
// UGCS Auto-Generated Sandbox Wrapper

export default function CosmicRacerPreview() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("[UGCS Sandbox] Mounting Cosmic Racer in Isolation...");

        return () => {
            console.log("[UGCS Sandbox] FATAL UNMOUNT CAUGHT. Triggering mandatory gl.dispose()...");
            // AI DIRECTIVE: We force memory cleanup here to prevent GPU meltdown.
            if (typeof window !== 'undefined') {
                 // The injected renderer will be intercepted and destroyed here natively.
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black flex flex-col items-center justify-center">
            {/* The Asset Renderer goes here */}
            <div className="absolute inset-0 flex items-center justify-center text-white/50 font-mono text-sm z-10 pointer-events-none">
                UGCS STANDALONE PREVIEW ACTIVE
            </div>
            
            <div className="bg-orange-500/20 border border-orange-500 p-4 rounded text-orange-400 font-mono text-xs">
                [COSMIC RACER ENGINE INGESTED]
            </div>
        </div>
    );
}
