'use client';
import React, { useEffect, useRef } from 'react';
import NativeScreensaver from './native/NativeScreensaver';

export default function CosmicRacerPreview({ onReady }: { onReady?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("[UGCS Sandbox] Mounting Native Cosmic Racer in Isolation...");
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent flex flex-col items-center justify-center pointer-events-auto">
            <NativeScreensaver onReady={onReady} />
        </div>
    );
}
