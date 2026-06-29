import React from 'react';
import Image from 'next/image';
import { DownloadCloud } from 'lucide-react';

interface DiscoverViewProps {
  featuredApps: any[];
  appsByCategory: Record<string, any[]>;
  onAppSelect: (id: string) => void;
  onGetClick: (app: any) => void;
}

export default function DiscoverView({ featuredApps, appsByCategory, onAppSelect, onGetClick }: DiscoverViewProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white pointer-events-auto pb-20">
      <div className="max-w-[1000px] mx-auto px-10 py-10">
        
        {/* Featured Top Row */}
        {featuredApps.length > 0 && (
          <div className="mb-14">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
              {featuredApps.map(app => (
                <div 
                  key={app.id} 
                  className="min-w-[400px] flex-shrink-0 cursor-pointer group snap-start"
                  onClick={() => onAppSelect(app.id)}
                >
                  <div className="relative w-full h-[240px] rounded-[20px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.12)] mb-4 transition-transform duration-300 group-hover:scale-[1.02]">
                    <Image 
                      src={app.media.thumbnail} 
                      alt={app.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2">
                    <p className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase mb-1">
                      {app.editorial?.kicker || 'FEATURED'}
                    </p>
                    <h2 className="text-[22px] leading-tight font-medium text-black mb-1">{app.title}</h2>
                    <p className="text-[15px] text-gray-500 leading-snug line-clamp-2">{app.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Lists */}
        <div className="space-y-16">
          {Object.entries(appsByCategory).map(([category, apps]) => {
            if (apps.length === 0) return null;
            
            return (
              <div key={category}>
                <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
                  <h3 className="text-[22px] font-semibold text-black">{`Best New ${category}`}</h3>
                  <button className="text-[14px] text-blue-500 hover:text-blue-600 font-medium">See All</button>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                  {apps.map(app => (
                    <div 
                      key={app.id} 
                      className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0 cursor-pointer group"
                      onClick={() => onAppSelect(app.id)}
                    >
                      {/* Squircle Icon */}
                      <div className="relative w-16 h-16 rounded-[14px] overflow-hidden shadow-sm flex-shrink-0 bg-gray-100">
                        <Image 
                          src={app.media.thumbnail} 
                          alt={app.title} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-medium text-black truncate">{app.title}</h4>
                        <p className="text-[13px] text-gray-500 truncate">{app.subtitle}</p>
                      </div>

                      <div className="flex flex-col items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => onGetClick(app)}
                          className="bg-[#f0f0f5] hover:bg-[#e4e4e9] text-[#0066cc] font-bold text-[13px] px-5 py-1.5 rounded-full transition-colors"
                        >
                          {app.price && app.price !== "Free" ? app.price : "GET"}
                        </button>
                        <span className="text-[8px] text-gray-400 mt-1">In-App Purchases</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
