"use client";

import React, { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NexusMetaballs from './NexusMetaballs';

function GlobalBackgroundInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasEngineSelected = searchParams.get('engine') !== null;
  const currentTab = searchParams.get('tab');
  const isBuildTab = currentTab === 'build' || currentTab === null;

  const [isPreviewing, setIsPreviewing] = React.useState(false);

  React.useEffect(() => {
    const handlePreviewChange = (e: any) => setIsPreviewing(e.detail?.isPreviewing || false);
    window.addEventListener('preview-state-change', handlePreviewChange);
    return () => window.removeEventListener('preview-state-change', handlePreviewChange);
  }, []);

  // Only render the heavy WebGL metaballs on the exact home page,
  // AND only when there is no engine selected in the SPA view.
  if (pathname !== '/' || hasEngineSelected || isPreviewing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-auto">
      <NexusMetaballs showFullscreenBtn={isBuildTab} />
    </div>
  );
}

export default function GlobalBackground() {
  return (
    <Suspense fallback={null}>
      <GlobalBackgroundInner />
    </Suspense>
  );
}
