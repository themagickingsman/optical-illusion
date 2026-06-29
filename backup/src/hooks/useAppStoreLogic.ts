"use client";

import { useMemo, useState } from 'react';
import libraryData from '@/data/library.json';
import { useQueryState } from '@/hooks/useQueryState';

export type AppStoreTab = 'Discover' | 'Arcade' | 'Create' | 'Work' | 'Play' | 'Develop' | 'Categories' | 'Updates';

export function useAppStoreLogic() {
  const [activeTab, setActiveTab] = useQueryState<AppStoreTab>('storeTab', 'Discover');
  const [selectedAppId, setSelectedAppId] = useQueryState<string>('app', '');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedApp = useMemo(() => {
    if (!selectedAppId) return null;
    return libraryData.find(app => app.id === selectedAppId) || null;
  }, [selectedAppId]);

  const featuredApps = useMemo(() => {
    return libraryData.filter(app => app.isFeatured);
  }, []);

  const appsByCategory = useMemo(() => {
    const grouped: Record<string, typeof libraryData> = {};
    libraryData.forEach(app => {
      if (!app.isFeatured) {
        if (!grouped[app.category]) {
          grouped[app.category] = [];
        }
        grouped[app.category].push(app);
      }
    });
    return grouped;
  }, []);

  const handleGetClick = async (appOrComponent: any) => {
    const endpoint = appOrComponent.globalApiEndpoint || appOrComponent.apiEndpoint;
    const snippet = `const componentData = await fetch('${endpoint}').then(res => res.json());\nconsole.log(componentData);`;
    try {
      await navigator.clipboard.writeText(snippet);
      return true; // Success
    } catch (err) {
      console.error('Failed to copy API snippet', err);
      return false;
    }
  };

  return {
    activeTab,
    setActiveTab,
    selectedApp,
    setSelectedAppId,
    searchQuery,
    setSearchQuery,
    featuredApps,
    appsByCategory,
    handleGetClick
  };
}
