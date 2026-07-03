"use client";

import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import DashboardNav, { DashboardTab } from "@/components/cms/DashboardNav";
import LibraryCMS from "@/components/cms/views/LibraryCMS";

import WebsiteBuildCMS from "@/components/cms/views/WebsiteBuildCMS";
import HireMeView from "@/components/views/HireMeView";

import MasterControllerView from "@/components/cms/views/MasterControllerView";
import HomeCMS from "@/components/cms/views/HomeCMS";
import GamesCMS from "@/components/cms/views/GamesCMS";
import ProcessCMS from "@/components/cms/views/ProcessCMS";
import VariablesCMS from "@/components/cms/views/VariablesCMS";
import TelecomCMS from "@/components/cms/views/TelecomCMS";
import MobileTelecomCMS from "@/components/cms/views/MobileTelecomCMS";
import MobileSiteCMS from "@/components/cms/views/MobileSiteCMS";
import MetaballsCMS from "@/components/cms/views/MetaballsCMS";

import { useQueryState } from "@/hooks/useQueryState";

import GlobalBackground from "@/components/GlobalBackground";

function DashboardContent() {
  const [activeCmsTab, setActiveCmsTab] = useQueryState<string>("tab", "build");
  const [hasNewChats, setHasNewChats] = React.useState(false);

  React.useEffect(() => {
    const checkChats = async () => {
      try {
        const res = await fetch('/api/chat?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          const hasUnread = data.profiles?.some((p: any) => {
            const profileMessages = data.messages?.filter((m: any) => m.profileId === p.id) || [];
            const lastMessage = profileMessages[profileMessages.length - 1];
            return lastMessage && lastMessage.sender === 'user';
          });
          setHasNewChats(hasUnread);
        }
      } catch (e) {}
    };
    
    // Check immediately, then poll every 5 seconds
    checkChats();
    const interval = setInterval(checkChats, 5000);
    return () => clearInterval(interval);
  }, []);

  // If this is a production deployment run by the Autonomous Pipeline,
  // we completely bypass the developer CMS and ONLY render the WebsiteBuildCMS tab.
  if (process.env.NEXT_PUBLIC_BUILD === 'true') {
    return (
      <main id="website-canvas" style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", pointerEvents: "auto" }}>
        <GlobalBackground />
        <WebsiteBuildCMS />
      </main>
    );
  }

  const dashboardTabs: DashboardTab[] = [
    { id: "build", label: "Build" },
    { id: "home", label: "About Me" },
    { id: "games", label: "Games" },
    { id: "process", label: "My Process" },
    { id: "library", label: "Agentic Game Assets" },
    { id: "hire", label: "Hire Me" },
    { id: "variables", label: "Variables" },
    { id: "telecom", label: "Telecom", hasNotification: hasNewChats && activeCmsTab !== "telecom" && activeCmsTab !== "mobile-admin" },
    { id: "mobile-admin", label: "Mobile Admin", hasNotification: hasNewChats && activeCmsTab !== "telecom" && activeCmsTab !== "mobile-admin" },
    { id: "mobile-site", label: "Mobile Site" },
    { id: "master-control", label: "Master Control" },
    { id: "metaballs", label: "Metaballs" }
  ];

  return (
    <main style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", pointerEvents: "none" }}>
      {/* CMS Header Frame */}
      <header id="master-cms-header" style={{ 
        height: "80px", 
        width: "100%", 
        background: "#000000", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 9999,
        pointerEvents: "auto",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
      }}>
        <DashboardNav 
          tabs={dashboardTabs} 
          activeTab={activeCmsTab} 
          onTabChange={setActiveCmsTab} 
        />
      </header>

          {/* Dynamic CMS View Instantiation */}
      <div id="website-canvas" style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0, pointerEvents: "auto" }}>
        <GlobalBackground />
        
        {/* The WebsiteBuildCMS acts as the persistent shell for the Build environment */}
        {activeCmsTab === "build" && (
          <WebsiteBuildCMS />
        )}

        {/* The other CMS tabs render RAW isolated components for developer editing */}
        {activeCmsTab === "home" && <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}><HomeCMS /></div>}
        {activeCmsTab === "games" && <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}><GamesCMS /></div>}
        {activeCmsTab === "process" && <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}><ProcessCMS /></div>}
        {activeCmsTab === "library" && <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}><LibraryCMS /></div>}
        {activeCmsTab === "hire" && <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><HireMeView /></div>}


        {activeCmsTab === "variables" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <VariablesCMS />
          </div>
        )}

        {activeCmsTab === "master-control" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <MasterControllerView />
          </div>
        )}

        {activeCmsTab === "telecom" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <TelecomCMS />
          </div>
        )}

        {activeCmsTab === "mobile-site" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <MobileSiteCMS />
          </div>
        )}

        {activeCmsTab === "mobile-admin" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <MobileTelecomCMS />
          </div>
        )}

        {activeCmsTab === "metaballs" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
            <MetaballsCMS />
          </div>
        )}
      </div>
    </main>
  );
}

export default function MasterDashboard() {
  return (
    <Suspense fallback={<div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
