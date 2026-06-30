import React, { Suspense } from 'react';
import GlobalBackground from '@/components/GlobalBackground';
import PublicNav from '@/components/views/PublicNav';
import ProjectCarouselLogic from '@/components/views/ProjectCarouselLogic';
import ScrollResetter from '@/components/views/ScrollResetter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <ScrollResetter />
      {/* The GlobalBackground and PublicNav will NEVER unmount on page navigations! */}
      <GlobalBackground />
      <PublicNav />
      
      {/* Handle displaying the specific Game Engine Carousel if an engine is selected */}
      <Suspense fallback={null}>
        <ProjectCarouselLogic />
      </Suspense>

      {/* The Scroll Container for the specific page contents */}
      <div id="build-scroll-container" style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '0 60px 60px', overflowY: 'auto', overflowX: 'hidden', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        <div style={{ margin: '0 auto', paddingTop: '110px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            zIndex: 20,
          }}>
            {children}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
