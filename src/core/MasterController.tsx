'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * ============================================================================
 * 🚨 CRITICAL AI ARCHITECTURE RULES (DO NOT IGNORE) 🚨
 * ============================================================================
 * Any AI agent interacting with this codebase MUST obey the following rules:
 * 
 * 1. GAMEPAD-FIRST UI: All interactive lists, grids, and carousels MUST use 
 *    the `useGamepadNavigation` hook. Do not rely on default React accessibility.
 * 2. SPA ROUTING ONLY: The application is a persistent OS. Interior views MUST 
 *    use URL Query State (e.g., `?engine=xxx`) to swap views. DO NOT push users 
 *    to new Next.js routes (`/pages`).
 * 3. GPU PRESERVATION: Heavy WebGL (e.g. Metaballs) must be fully unmounted 
 *    from the DOM when obscured by opaque views. Do not use opacity or z-index 
 *    to hide them.
 * 4. NO LOCAL STORAGE: Use JSON configs or backend DBs for persistence.
 * 5. BUILD TAB VS CMS TABS: The 'Build' tab (WebsiteBuildCMS.tsx) acts as the 
 *    integrated public website shell and MUST contain all navigation links (Home, 
 *    Games, Process, etc). The Master CMS tabs exist to isolate these components 
 *    for raw developer editing.
 * 6. PATHING: Use `useMasterController().paths` for all routing. No hardcoded 
 *    absolute paths anywhere in components.
 * 7. NO PAGE.TSX BUILDS: Do not build UI or logic directly inside `page.tsx`. 
 *    All new views and components must be created in their own files and imported.
 * ============================================================================
 */

interface SystemPaths {
  api: {
    base: string;
    getEngine: (id: string) => string;
  };
  routes: {
    home: string;
    cms: string;
  };
}

interface MasterControllerState {
  // Global Pathing System
  paths: SystemPaths;
  
  // Pipeline & Key State
  activeAssetKey: string | null;
  setActiveAssetKey: (key: string | null) => void;
  
  // Architectural Rules Payload (For UI Display)
  systemRules: string[];
}

const defaultPaths: SystemPaths = {
  api: {
    base: '/api',
    getEngine: (id: string) => `/api/engine/${id}`,
  },
  routes: {
    home: '/',
    cms: '/?tab=master', // Or similar query-based routing for CMS
  }
};

const systemRulesList = [
  "1. PRODUCT VISION: Universal Game Component System for 'regular people'. No engineering jargon. Complex AI integration must be hidden behind a consumer-grade App Store UX.",
  "2. NOMENCLATURE: Use 'Asset Key' instead of 'API Endpoint', 'Universal Plug' instead of 'Architecture', 'Game Block' instead of 'Module'.",
  "3. DESIGN AESTHETIC: Strict Light Mode mimicking macOS App Store. SF Pro typography. Massive hero images. Pure white interior pages with translucent glassmorphism overlays.",
  "4. COMPONENTIZATION: The App Store itself must remain a modular React component (<AgentAppStore />) embeddable anywhere.",
  "5. ASSET KEY INTERACTION: Clicking 'Get Asset Key' instantly copies a pre-formatted JS fetch snippet to the clipboard and changes button to 'Copied!'.",
  "6. CATEGORY ARCHITECTURE: Use the strict master list of classic categories (Business, Developer Tools, Games, Utilities, etc.). Only render rows that contain data.",
  "7. GAMEPAD-FIRST UI: All interactive lists, grids, and carousels MUST use the `useGamepadNavigation` hook. Do not rely on default React accessibility.",
  "8. SPA ROUTING ONLY: The application is a persistent OS. Interior views MUST use URL Query State (e.g., `?engine=xxx`) to swap views. DO NOT push users to new Next.js routes.",
  "9. GPU PRESERVATION: Heavy WebGL (e.g., NexusMetaballs) must be FULLY UNMOUNTED from the DOM when obscured by opaque UI layers to free GPU resources. No CSS opacity tricks.",
  "10. NO LOCAL STORAGE: Absolute ban on `localStorage`. All state persistence must use JSON or backend databases.",
  "11. BUILD TAB VS CMS TABS: The 'Build' tab (WebsiteBuildCMS.tsx) acts as the integrated public website shell and MUST contain navigation links to all public components (Home, Games, Process, Library, Hire Me). The other Master CMS tabs (in page.tsx) exist to isolate these components for raw developer editing.",
  "12. CENTRALIZED PATHING: All route and API path strings MUST be accessed via `useMasterController().paths`. No hardcoded paths.",
  "13. NO PAGE.TSX BUILDS: Do not build UI or logic directly inside `page.tsx`. All new views and components must be created in their own files and imported into the routing architecture."
];

const MasterControllerContext = createContext<MasterControllerState | undefined>(undefined);

export function MasterControllerProvider({ children }: { children: ReactNode }) {
  const [activeAssetKey, setActiveAssetKey] = useState<string | null>(null);

  const value: MasterControllerState = {
    paths: defaultPaths,
    activeAssetKey,
    setActiveAssetKey,
    systemRules: systemRulesList,
  };

  return (
    <MasterControllerContext.Provider value={value}>
      {children}
    </MasterControllerContext.Provider>
  );
}

export function useMasterController() {
  const context = useContext(MasterControllerContext);
  if (context === undefined) {
    throw new Error('useMasterController must be used within a MasterControllerProvider');
  }
  return context;
}
