import React from "react";
import ReactDOMServer from "react-dom/server";

export const BuildingIcon = ({ category, size = 48 }: { category: string, size?: number }) => {
  switch (category) {
    case "Headquarters":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Main Core Node with protective outer orbital rings */}
          <circle cx="12" cy="12" r="10" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeDasharray="4 2" />
          <circle cx="12" cy="12" r="7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="#38bdf8" />
        </svg>
      );
    case "Hydroponics Farm":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Bubble clusters representing bio-domes */}
          <circle cx="12" cy="12" r="11" stroke="rgba(74, 222, 128, 0.2)" strokeWidth="1" />
          <circle cx="12" cy="12" r="6" fill="rgba(74, 222, 128, 0.2)" stroke="#4ade80" strokeWidth="1.5" />
          {/* Growth node satellites */}
          <circle cx="8" cy="12" r="2" fill="#4ade80" />
          <circle cx="16" cy="12" r="2" fill="#4ade80" />
          <circle cx="12" cy="8" r="2" fill="#4ade80" />
          <circle cx="12" cy="16" r="2" fill="#4ade80" />
        </svg>
      );
    case "Power Plant":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Pulsing energy reactor core */}
          <circle cx="12" cy="12" r="10" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" />
          <circle cx="12" cy="12" r="8" fill="rgba(239, 68, 68, 0.15)" />
          {/* Reactor internal bands */}
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" fill="#ef4444" />
        </svg>
      );
    case "Research Lab":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Concentric planetary orbital arcs denoting scanning/tech */}
          <circle cx="12" cy="12" r="3" fill="#3b82f6" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 22a10 10 0 0 1-10-10" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="21" cy="4" r="1.5" fill="#3b82f6" />
        </svg>
      );
    case "Barracks":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Heavily shielded geometric ring */}
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="3" />
          <circle cx="12" cy="12" r="6" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1" />
          <circle cx="12" cy="12" r="4" fill="#ef4444" />
        </svg>
      );
    case "Residential Quarters":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Cluster configuration of soft circular modules */}
          <circle cx="12" cy="12" r="11" stroke="rgba(167, 139, 250, 0.2)" strokeWidth="1" />
          <circle cx="9" cy="9" r="4" fill="#8b5cf6" />
          <circle cx="15" cy="11" r="3" fill="#a78bfa" />
          <circle cx="10" cy="15" r="3.5" fill="#a78bfa" />
        </svg>
      );
    case "Fuel Resonator":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Wave interference patterns (overlapping circles) */}
          <circle cx="8" cy="12" r="6" stroke="#c084fc" strokeWidth="2" fill="rgba(192, 132, 252, 0.2)" />
          <circle cx="16" cy="12" r="6" stroke="#c084fc" strokeWidth="2" fill="rgba(192, 132, 252, 0.2)" />
          {/* Dense interaction point */}
          <circle cx="12" cy="12" r="2.5" fill="#d8b4fe" />
        </svg>
      );
    case "Storage Silo":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Massive single storage drum with containment rim */}
          <circle cx="12" cy="12" r="9" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" fill="#334155" />
          <circle cx="12" cy="12" r="2" fill="#94a3b8" />
        </svg>
      );
    case "Docking Station":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Large wide open docking hoop */}
          <path d="M12 2A10 10 0 1 0 22 12" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" fill="transparent" />
          <path d="M18 12h-4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" fill="#3b82f6" />
        </svg>
      );
    case "Marketplace":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Radiant commerce hub consisting of sunburst nodes */}
          <circle cx="12" cy="12" r="8" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="12" cy="4" r="2" fill="#f59e0b" />
          <circle cx="12" cy="20" r="2" fill="#f59e0b" />
          <circle cx="4" cy="12" r="2" fill="#f59e0b" />
          <circle cx="20" cy="12" r="2" fill="#f59e0b" />
          <circle cx="12" cy="12" r="3" fill="rgba(245, 158, 11, 0.5)" />
        </svg>
      );
    case "Shield Generator":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Multiple protective plasma bands forming a thick fluid shell */}
          <circle cx="12" cy="12" r="11" fill="rgba(6, 182, 212, 0.1)" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="12" cy="12" r="8" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="#06b6d4" />
        </svg>
      );
    case "Stabilizer Node":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Precision gyroscopic stabilization rings */}
          <circle cx="12" cy="12" r="10" stroke="#d946ef" strokeWidth="1" />
          <circle cx="12" cy="12" r="7" stroke="rgba(217, 70, 239, 0.5)" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2.5" fill="#d946ef" />
        </svg>
      );
    case "Dyson Node":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* The only massive solid-glow entity mimicking an artificial sun */}
          <circle cx="12" cy="12" r="9" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" fill="#eab308" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Unidentified minimalist drop */}
          <circle cx="12" cy="12" r="6" fill="#475569" />
          <circle cx="12" cy="12" r="10" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
  }
};

export const getBuildingSVGDataUri = (category: string) => {
   const svgMarkup = ReactDOMServer.renderToStaticMarkup(<BuildingIcon category={category} size={256} />);
   return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
};
