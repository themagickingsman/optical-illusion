"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NetflixEditorialView from '@/components/library/NetflixEditorialView';
import { ChevronLeft } from 'lucide-react';

export default function EngineClientView({ app }: { app: any }) {
  const router = useRouter();
  // By default, the master engine is the active item
  const [activeItem, setActiveItem] = useState(app);

  const handleBack = () => {
    router.push('/');
  };

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
    <div className="w-full h-full absolute inset-0 bg-black overflow-hidden pointer-events-auto flex flex-col">
      
      {/* Immersive Full-Screen Background */}
      <div className="absolute inset-0 z-0 transition-opacity duration-500 ease-in-out">
        {bgImage && (
          <Image 
            key={bgImage} // Forces a re-render/fade if we want to add CSS animations later
            src={bgImage} 
            alt={activeItem.title || activeItem.name} 
            fill 
            className="object-cover opacity-60"
            priority
          />
        )}
        {/* Subtle gradient so text on the left/bottom is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Top Left Back Button (Always visible) */}
      <div className="absolute top-8 left-8 z-50 pointer-events-auto">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/40 transition-all shadow-lg"
        >
          <ChevronLeft size={24} className="-ml-0.5" />
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
