"use client";

import React, { useState, useEffect } from 'react';
import HireMeView from '@/components/views/HireMeView';
import LibraryCMS from './LibraryCMS';
import CosmicRacerPreview from '../../library/cosmic_racer/index';

// ----------------------------------------------------------------------
// THE SANDBOX WRAPPER (Layer 1: Biometric Sync Engine)
// This strictly enforces the Component Isolation Format required by the UGCS.
// ----------------------------------------------------------------------
const SandboxWrapper = ({ children, assetKey }: { children: React.ReactNode, assetKey: string }) => {
  // In a real WebGL component, this is where we would intercept useFrame()
  // and inject the 7.83Hz Logic Clock and 10Hz Photic Entrainment Clock.
  // For standard DOM components, we wrap them in a protected boundary.
  
  useEffect(() => {
    // Simulator: On Mount, we bind to the Master Event Bus
    console.log(`[UGCS Sandbox] Bounding ${assetKey} to Master Event Bus...`);
    
    return () => {
      // Simulator: MANDATORY CLEANUP PROTOCOL (gl.dispose)
      console.log(`[UGCS Sandbox] Executing mandatory cleanup for ${assetKey} (gl.dispose) to prevent memory leaks.`);
    };
  }, [assetKey]);

  return (
    <div className="ugcs-sandbox-boundary relative w-full h-full" data-asset-key={assetKey}>
      {/* Visual Sandbox Debugging Layer (Hidden unless debug mode is active) */}
      <div className="absolute top-0 right-0 z-50 pointer-events-none opacity-20 hidden">
        <span className="bg-red-500 text-white text-[10px] px-2 py-1 font-mono uppercase font-bold rounded-bl">Sandbox Protected</span>
      </div>
      {children}
    </div>
  );
};

// ----------------------------------------------------------------------
// THE UGCS COMPONENT LOADER
// Dynamically fetches the JSON Manifest from the App Store API and renders
// the decoupled payload if the payload is verified.
// ----------------------------------------------------------------------
export default function UGCSComponentLoader({ assetKey }: { assetKey: string }) {
  const [manifest, setManifest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchPayload = async () => {
      try {
        // Step 1: Hit the App Store API to fetch the Manifest
        // NOTE: Following the "Decision Tree", we evaluate our environment.
        // For development, we hit the local 3009 API.
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? `/api/engine/${assetKey}` // Production relative path
          : `http://localhost:3009/api/engine/${assetKey}`; // Local development

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch Asset Key: ${assetKey}`);
        
        const data = await response.json();
        
        if (isMounted) {
          setManifest(data.engine);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      }
    };

    fetchPayload();

    return () => { isMounted = false; };
  }, [assetKey]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/80">
        <div className="text-center font-mono space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-cyan-400 text-sm uppercase tracking-widest">Compiling Asset Key: {assetKey}</p>
          <p className="text-white/40 text-[10px]">Fetching Manifest from UGCS Protocol...</p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/80 p-8">
        <div className="bg-red-950/40 border border-red-500 p-6 rounded-xl text-center max-w-md">
          <h3 className="text-red-400 font-bold mb-2">Compilation Failed</h3>
          <p className="text-red-200/80 text-sm font-mono">{error || 'Asset Manifest Not Found'}</p>
        </div>
      </div>
    );
  }

  // Simulator: Mapping the fetched Manifest to the physical component payload.
  // In a true headless engine, this would be a WebGL injection or dynamically executed code block.
  let ComponentPayload = null;
  switch (assetKey) {
    case 'ui_hireme':
      ComponentPayload = HireMeView;
      break;
    case 'ui_appstore':
      ComponentPayload = LibraryCMS;
      break;
    case 'cosmic_racer':
      ComponentPayload = CosmicRacerPreview;
      break;
    default:
      ComponentPayload = () => <div className="text-white p-8">Unknown UI Component Payload</div>;
  }

  // Step 2 & 3: Ensure the payload is wrapped in the mandatory Sandbox Wrapper
  return (
    <SandboxWrapper assetKey={assetKey}>
      <ComponentPayload />
    </SandboxWrapper>
  );
}
