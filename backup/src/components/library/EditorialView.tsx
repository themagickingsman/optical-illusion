import React from 'react';
import Image from 'next/image';
import { ChevronLeft, Share, CloudDownload } from 'lucide-react';

interface EditorialViewProps {
  app: any;
  onBack: () => void;
  onGetClick: (app: any) => void;
}

export default function EditorialView({ app, onBack, onGetClick }: EditorialViewProps) {
  const [imgSize, setImgSize] = React.useState({ width: 0, height: 0 });

  if (!app) return null;

  return (
    <div className="flex-1 flex h-full bg-white pointer-events-auto overflow-hidden">
      
      {/* LEFT COLUMN: Visual Hero */}
      <div className="relative bg-black flex-shrink-0" style={{ width: imgSize.width ? imgSize.width / 2 : 'fit-content', height: imgSize.height ? imgSize.height / 2 : 'fit-content' }}>
        <img 
          src={app.media.thumbnail} 
          alt={app.title} 
          className="opacity-80 block object-cover"
          style={{ 
            width: imgSize.width ? imgSize.width / 2 : undefined, 
            height: imgSize.height ? imgSize.height / 2 : undefined,
            visibility: imgSize.width ? 'visible' : 'hidden'
          }}
          onLoad={(e) => setImgSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
        />
        
        {/* Back Button Overlay */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <ChevronLeft size={20} className="-ml-0.5" />
        </button>

        {/* Text Overlay */}
        <div className="absolute top-20 left-10 right-10 z-10">
          <p className="text-[11px] font-semibold tracking-wider text-white/80 uppercase mb-2">
            {app.editorial?.kicker || 'FEATURED'}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            {app.title}
          </h1>
        </div>

        {/* Glass Floating App Card */}
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <div className="bg-black/40 backdrop-blur-xl rounded-[24px] p-4 flex items-center gap-4 border border-white/10 shadow-2xl">
            {/* App Icon */}
            <div className="relative w-16 h-16 rounded-[14px] overflow-hidden bg-white/10 flex-shrink-0">
              <Image 
                src={app.media.thumbnail} 
                alt={app.title} 
                fill 
                className="object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-white">{app.title}</h3>
              <p className="text-[13px] text-white/70">{app.subtitle}</p>
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={() => onGetClick(app)}
                className="bg-white/10 hover:bg-white/20 text-blue-400 font-bold px-4 py-2 rounded-full transition-colors flex items-center justify-center h-8 w-8 !p-0"
                title="Get Component"
              >
                <CloudDownload size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Editorial Content */}
      <div className="flex-1 h-full overflow-y-auto bg-white relative">
        {/* Share Button Header */}
        <div className="sticky top-0 right-0 p-4 flex justify-end bg-white/90 backdrop-blur-sm z-10">
          <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Share size={18} />
          </button>
        </div>

        <div className="px-14 pb-20 pt-6">
          {/* Intro Paragraph */}
          <p className="text-[17px] leading-relaxed text-gray-800 mb-8 font-medium">
            <strong className="text-black font-semibold">{app.title}</strong> {app.editorial?.introParagraph || app.description}
          </p>

          {/* Dynamic Sections */}
          {app.editorial?.sections?.map((section: any, idx: number) => (
            <div key={idx} className="mb-8">
              <h2 className="text-[20px] font-bold text-black mb-3">{section.heading}</h2>
              <p className="text-[15px] leading-relaxed text-gray-600 mb-6">
                {section.body}
              </p>
            </div>
          ))}

          {/* Screenshots Gallery */}
          {app.editorial?.screenshots && app.editorial.screenshots.length > 0 && (
            <div className="mt-10">
              {app.editorial.screenshots.map((src: string, idx: number) => (
                <img 
                  key={idx}
                  src={src} 
                  alt="Screenshot" 
                  className="w-full h-auto rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.15)] mb-6 border border-gray-100 block"
                />
              ))}
            </div>
          )}

          {/* Component Marketplace UI */}
          {app.components && app.components.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h3 className="text-[20px] font-bold text-black mb-6">Included Components</h3>
              
              <div className="space-y-4">
                {app.components.map((comp: any) => (
                  <div key={comp.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0 group cursor-pointer">
                    {/* Component Icon */}
                    <div className="relative w-14 h-14 rounded-[12px] overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                      <Image 
                        src={comp.icon || app.media.thumbnail} 
                        alt={comp.name} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[16px] font-semibold text-black truncate">{comp.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wide uppercase">
                          {comp.type}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-500 line-clamp-1">{comp.description}</p>
                    </div>

                    <div className="flex flex-col items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onGetClick(comp)}
                        className="bg-[#f0f0f5] hover:bg-[#e4e4e9] text-[#0066cc] font-bold text-[13px] px-5 py-1.5 rounded-full transition-colors"
                      >
                        {comp.price || "GET"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
