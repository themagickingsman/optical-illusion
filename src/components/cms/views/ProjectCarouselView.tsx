"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import NetflixEditorialView from '@/components/library/NetflixEditorialView';
import { ChevronLeft } from 'lucide-react';
import UGCSComponentLoader from './UGCSComponentLoader';

export default function ProjectCarouselView({ app, onBack }: { app: any, onBack: () => void }) {
  // By default, the master engine is the active item
  const [activeItem, setActiveItem] = useState(app);

  // If the app prop changes, reset the active item
  useEffect(() => {
    setActiveItem(app);
  }, [app]);

  const handleGetClick = (item: any) => {
    const endpoint = item.apiEndpoint || item.globalApiEndpoint;
    const fetchString = `await fetch('${endpoint}')`;
    navigator.clipboard.writeText(fetchString).then(() => {
      alert(`Copied Asset Key to clipboard:\n${fetchString}`);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };

  // Determine the best background image for the active item
  const bgImage = activeItem.media?.thumbnail || activeItem.icon || app.media?.thumbnail;

  return (
    <div className="w-full h-full absolute inset-0 bg-black overflow-hidden pointer-events-auto flex flex-col z-[10]">
      
      {/* Immersive Full-Screen Background */}
      <div className="absolute inset-0 z-0 transition-opacity duration-500 ease-in-out">
        {activeItem.id === 'cosmic_racer' ? (
          <div className="absolute inset-0 opacity-100">
            <UGCSComponentLoader assetKey={activeItem.id} />
          </div>
        ) : (
          bgImage && (
            <Image 
              key={bgImage} // Forces a re-render/fade if we want to add CSS animations later
              src={bgImage} 
              alt={activeItem.title || activeItem.name} 
              fill 
              className="object-cover opacity-60"
              priority
            />
          )
        )}
        {/* Subtle gradient so text on the left/bottom is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Bottom Right Back Button */}
      <div className="absolute bottom-[40px] right-[40px] z-[200] pointer-events-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full text-white font-bold text-sm transition-all shadow-xl shadow-black/50"
        >
          <ChevronLeft size={18} />
          Back to Library
        </button>
      </div>

      {/* Netflix Overlay Layer (The Bottom Carousel UI) */}
      <NetflixEditorialView 
        app={app} 
        activeItem={activeItem}
        setActiveItem={setActiveItem}
        onGetClick={handleGetClick} 
      />
      
    </div>
  );
}
