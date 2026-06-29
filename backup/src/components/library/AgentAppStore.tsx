"use client";

import React from 'react';
import { useAppStoreLogic } from '@/hooks/useAppStoreLogic';
import AppStoreSidebar from './AppStoreSidebar';
import DiscoverView from './DiscoverView';
import EditorialView from './EditorialView';

export default function AgentAppStore() {
  const {
    activeTab,
    setActiveTab,
    selectedApp,
    setSelectedAppId,
    searchQuery,
    setSearchQuery,
    featuredApps,
    appsByCategory,
    handleGetClick
  } = useAppStoreLogic();

  return (
    <div className="w-full h-full flex overflow-hidden bg-white text-black font-sans pointer-events-auto shadow-2xl">
      {/* Sidebar Navigation */}
      <AppStoreSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {selectedApp ? (
          <EditorialView 
            app={selectedApp} 
            onBack={() => setSelectedAppId('')} 
            onGetClick={handleGetClick}
          />
        ) : (
          <DiscoverView 
            featuredApps={featuredApps}
            appsByCategory={appsByCategory}
            onAppSelect={(id) => setSelectedAppId(id)}
            onGetClick={handleGetClick}
          />
        )}
      </div>
    </div>
  );
}
