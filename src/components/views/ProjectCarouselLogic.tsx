'use client';

import React from 'react';
import { useQueryState } from '@/hooks/useQueryState';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';
import ProjectCarouselView from '@/components/cms/views/ProjectCarouselView';

export default function ProjectCarouselLogic() {
  const { engines, isLoading } = useLibraryLogic();
  const [selectedEngineId, setSelectedEngineId] = useQueryState<string | null>('engine', null);

  if (isLoading || !selectedEngineId) return null;

  const selectedEngine = engines.find((e: any) => e.id === selectedEngineId);
  
  if (!selectedEngine) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
      <ProjectCarouselView 
        app={selectedEngine} 
        onBack={() => setSelectedEngineId(null)} 
      />
    </div>
  );
}
