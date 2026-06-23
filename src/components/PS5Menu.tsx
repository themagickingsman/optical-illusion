"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLibraryLogic } from '@/hooks/useLibraryLogic';
import EngineModal from './cms/modals/EngineModal';
import { 
  Search, Settings, Clock, Menu, Play, Star, Download, 
  ChevronRight, Users, MessageSquare, Plus 
} from 'lucide-react';
import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';

export default function PS5Menu() {
  const router = useRouter();
  const { engines, isLoading, addEngine, updateEngine, deleteEngine, activeCategory, setActiveCategory, categories, sortOption, setSortOption, sortOptions } = useLibraryLogic();
  
  const [localEngines, setLocalEngines] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const activeCardRef = React.useRef<HTMLDivElement>(null);



  useEffect(() => {
    setLocalEngines(engines);
  }, [engines]);

  const handleSelect = (index: number) => {
    if (index === 3) {
      setModalData(null);
      setIsModalOpen(true);
      return;
    }
    const engineIndex = index > 3 ? index - 1 : index;
    if (localEngines[engineIndex]) {
      router.push(`/engine/${localEngines[engineIndex].id}`);
    }
  };

  const { activeIndex, setMouseActiveIndex, interactionType } = useGamepadNavigation({
    totalItems: localEngines.length + 1,
    columns: 4,
    onSelect: handleSelect,
  });

  useEffect(() => {
    if (interactionType === 'mouse') return;

    if (activeIndex <= 2) {
      const container = document.getElementById('library-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, interactionType]);

  const getCardStyle = (index: number): React.CSSProperties => {
    const isActive = activeIndex === index;
    return {
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
      transform: isActive ? 'scale(1.04)' : 'scale(1)',
      outline: 'none',
      boxShadow: isActive ? '0 60px 40px -20px rgba(0, 0, 0, 0.7)' : '0 4px 12px rgba(0,0,0,0.2)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)',
      height: '100%',
      width: '100%',
    };
  };

  if (isLoading || localEngines.length === 0) {
    return <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Cosmic Architecture...</div>;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '30px', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: '150px', height: '40px' }}>
          <Image src="/assets/logo/op_logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto', width: '140px', transform: 'translateX(-25px)' }}>
          <button style={{ background: 'rgba(40,40,50,0.8)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'all 0.2s', textAlign: 'center' }}>About</button>
          <button style={{ background: 'rgba(40,40,50,0.8)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'all 0.2s', textAlign: 'center' }}>Hire Me</button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '30px', right: '40px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>
          <span>Search</span>
          <span>Settings</span>
          <span>12:45 PM</span>
        </div>
      </div>

      <div id="library-scroll-container" style={{ position: 'absolute', inset: 0, zIndex: 10, padding: '100px 60px 60px', overflowY: 'auto', overflowX: 'hidden', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
          <div style={{ maxWidth: '1075px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '30px' }}>Game Engine Library</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '4px' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: activeCategory === cat ? 'rgba(120, 120, 120, 0.5)' : 'rgba(120, 120, 120, 0.2)',
                      color: activeCategory === cat ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '8px 20px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', opacity: 0.7 }}>Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  style={{
                    background: 'rgba(120, 120, 120, 0.2)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 15px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    outline: 'none',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt} value={opt} style={{ color: '#000' }}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading engines...</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '30px', height: '400px', marginBottom: '100px' }}>
                  {localEngines.length > 0 && (
                    <>
                      <div style={{ flex: '6', height: '100%', position: 'relative' }}>
                        <div 
                          ref={activeIndex === 0 ? activeCardRef : null}
                          style={{ ...getCardStyle(0), zIndex: 1 }} 
                          onMouseEnter={() => { setMouseActiveIndex(0); setHoveredCardIndex(0); }} 
                          onMouseLeave={() => setHoveredCardIndex(null)}
                          onClick={() => handleSelect(0)}
                        >
                          <div style={{ position: 'absolute', inset: 0 }}>
                            <Image src={localEngines[0].media.thumbnail} alt={localEngines[0].title} fill style={{ objectFit: 'cover' }} priority />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }} />
                          </div>
                          <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px' }}>
                            <h2 style={{ fontSize: '36px', fontWeight: 700, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{localEngines[0].title}</h2>
                            <p style={{ fontSize: '18px', opacity: 0.9, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{localEngines[0].subtitle}</p>
                          </div>
                          {hoveredCardIndex === 0 && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); setModalData(localEngines[0]); setIsModalOpen(true); }}
                              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 10 }}
                            >
                              <Settings size={20} color="white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', position: 'relative' }}>
                        {localEngines.slice(1, 3).map((engine, i) => {
                          const index = i + 1;
                          return (
                            <div key={engine.id} style={{ height: '185px' }}>
                              <div 
                                ref={activeIndex === index ? activeCardRef : null}
                                style={{ ...getCardStyle(index), zIndex: 1 }} 
                                onMouseEnter={() => { setMouseActiveIndex(index); setHoveredCardIndex(index); }} 
                                onMouseLeave={() => setHoveredCardIndex(null)}
                                onClick={() => handleSelect(index)}
                              >
                                <div style={{ position: 'absolute', inset: 0 }}>
                                  <Image src={engine.media.thumbnail} alt={engine.title} fill style={{ objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }} />
                                </div>
                                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                                  <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{engine.title}</h3>
                                </div>
                                {hoveredCardIndex === index && (
                                  <div 
                                    onClick={(e) => { e.stopPropagation(); setModalData(engine); setIsModalOpen(true); }}
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 10 }}
                                  >
                                    <Settings size={16} color="white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', position: 'relative' }}>
                  <div 
                    ref={activeIndex === 3 ? activeCardRef : null}
                    onClick={() => { setModalData(null); setIsModalOpen(true); }}
                    style={{
                      ...getCardStyle(3),
                      aspectRatio: '3/4',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                    }}
                    onMouseEnter={(e: any) => {
                      setMouseActiveIndex(3);
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.4)';
                    }}
                    onMouseLeave={(e: any) => {
                      setHoveredCardIndex(null);
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <Plus size={48} color="rgba(255,255,255,0.4)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Add New Engine</h3>
                  </div>

                  {localEngines.slice(3).map((engine: any, i: number) => {
                    const index = i + 4;
                    return (
                      <div key={engine.id} style={{ aspectRatio: '3/4' }}>
                        <div 
                          ref={activeIndex === index ? activeCardRef : null}
                          style={{ position: 'relative', background: `url(${engine.media.thumbnail}) center/cover`, borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1, width: '100%', height: '100%', transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' }} 
                          onMouseEnter={(e: any) => { setHoveredCardIndex(index); setMouseActiveIndex(index); e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)'; }} 
                          onMouseLeave={(e: any) => { setHoveredCardIndex(null); e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)'; }}
                          onClick={() => handleSelect(index)} 
                        >
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))', borderRadius: '8px' }} />
                          <h3 style={{ fontSize: '18px', fontWeight: 600, zIndex: 2, position: 'relative' }}>{engine.title}</h3>
                          {hoveredCardIndex === index && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); setModalData(engine); setIsModalOpen(true); }}
                              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 10 }}
                            >
                              <Settings size={16} color="white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
      </div>
      
      <EngineModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setModalData(null); }}
        initialData={modalData}
        onSave={async (data) => {
          if (modalData) {
            await updateEngine(modalData.id, data);
          } else {
            await addEngine(data);
          }
        }} 
        onDelete={async (id) => {
          await deleteEngine(id);
        }}
      />
    </div>
  );
}
