import React, { useEffect } from 'react';
import Image from 'next/image';
import { Key } from 'lucide-react';
import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';
import { useAnalytics } from '@/hooks/useAnalytics';

interface NetflixEditorialViewProps {
  app: any;
  activeItem: any;
  setActiveItem: (item: any) => void;
  onGetClick: (item: any) => void;
}

export default function NetflixEditorialView({ app, activeItem, setActiveItem, onGetClick }: NetflixEditorialViewProps) {
  const { trackEvent } = useAnalytics();
  const roster = [app, ...(app.components || [])];

  const { activeIndex, setMouseActiveIndex } = useGamepadNavigation({
    totalItems: roster.length,
    columns: roster.length, // 1D horizontal row, so columns = total items
    onSelect: (index) => onGetClick(roster[index]),
  });

  // When gamepad/keyboard changes the activeIndex, update the parent's activeItem state
  // to swap the background and metadata instantly.
  useEffect(() => {
    setActiveItem(roster[activeIndex]);
  }, [activeIndex, roster, setActiveItem]);

  if (!app) return null;

  // Determine active item properties
  const isMasterEngine = activeItem.id === app.id;
  const title = isMasterEngine ? app.title : activeItem.name;
  const subtitle = isMasterEngine ? app.subtitle : activeItem.description;
  const categoryOrType = isMasterEngine ? app.category : activeItem.type;
  const price = isMasterEngine ? app.price : activeItem.price;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between pt-[15%] pb-[8%]">
      
      {/* Main Stage Metadata & Actions (Centered near top/middle) */}
      <div className="flex flex-col items-center text-center pointer-events-auto max-w-3xl px-8">
        <p className="text-[13px] font-bold tracking-[0.2em] text-white/60 uppercase mb-3 drop-shadow-md">
          {categoryOrType || 'COMPONENT'}
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-2xl mb-4">
          {title}
        </h1>
        <p className="text-lg text-white/80 font-medium drop-shadow-lg mb-8 leading-relaxed line-clamp-2 px-8">
          {subtitle}
        </p>
        
        <button 
          onClick={() => onGetClick(activeItem)}
          className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 text-lg"
        >
          <Key fill="currentColor" size={24} />
          {isMasterEngine ? 'Get Master Asset Key' : 'Get Asset Key'} {price && price !== 'Free' ? `(${price})` : ''}
        </button>
      </div>

      {/* Portrait Cards (3/4 down the page, max 800px width) */}
      <div className="flex items-end justify-center gap-4 pointer-events-auto w-full max-w-[800px] px-8">
        {roster.map((item: any, index: number) => {
          const isSelected = activeItem.id === item.id;
          const itemImage = item.media?.thumbnail || item.icon || app.media?.thumbnail;
          const itemTitle = item.id === app.id ? "Full Engine" : item.name;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item);
                trackEvent('carousel_item_clicked', { item_index: index, item_id: item.id, item_title: itemTitle });
              }}
              onMouseEnter={() => setMouseActiveIndex(index)}
              className={`relative group flex-shrink-0 w-32 md:w-36 aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ease-out ${
                isSelected 
                  ? 'ring-[3px] ring-white scale-110 z-20 shadow-[0_20px_40px_rgba(0,0,0,0.8)] -translate-y-4' 
                  : 'ring-1 ring-white/20 hover:ring-white/50 opacity-60 hover:opacity-100 scale-95 hover:scale-100 z-10 hover:-translate-y-2'
              }`}
            >
              {itemImage && (
                <Image 
                  src={itemImage} 
                  alt={itemTitle} 
                  fill 
                  className="object-cover"
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <p className="text-white font-bold text-[13px] leading-tight line-clamp-2">
                  {itemTitle}
                </p>
                <p className="text-white/50 text-[9px] uppercase tracking-[0.1em] mt-1 font-semibold">
                  {item.id === app.id ? app.category : item.type}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
