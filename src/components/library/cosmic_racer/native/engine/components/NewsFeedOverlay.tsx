import React, { useState, useEffect } from 'react';
import { getGlobalDbState } from '../../state/game-assets/ships';
import { PathController } from '../../config/PathController';

interface NewsFeedData {
  header: string;
  subheader: string;
  body: string;
  bgImage?: string;
}

interface NewsFeedOverlayProps {
  onClose?: () => void;
  isEditorMode?: boolean;
}

export function NewsFeedOverlay({ onClose, isEditorMode = false }: NewsFeedOverlayProps) {
  const [newsData, setNewsData] = useState<NewsFeedData | null>({
    header: "GALACTIC NEWS UPDATE",
    subheader: "LATEST PATCH NOTES",
    body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
    bgImage: "/assets/news_feed_bg.png"
  });

  useEffect(() => {
    const isScreensaverTarget = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BUILD_TARGET === 'screensaver';
    const isPort3006 = typeof window !== 'undefined' && (window.location.port === '3006' || window.location.port === '3007' || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.app'));
    const isLocalScheme = typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:');
    const isStandaloneMode = isScreensaverTarget || isPort3006 || isLocalScheme;

    if (isStandaloneMode) {
      const db = getGlobalDbState();
      if (db && db.newsFeed) {
        setNewsData(db.newsFeed);
      } else {
        const configUrl = typeof window !== 'undefined' && window.location.pathname.includes('/builds/')
          ? '../game_assets/data/game_config.json'
          : './game_assets/data/game_config.json';
        fetch(configUrl)
          .then(res => res.json())
          .then(data => {
            const config = data.success ? data.data : data;
            if (config && config.newsFeed) {
              setNewsData(config.newsFeed);
            } else {
              setNewsData({
                header: "GALACTIC NEWS UPDATE",
                subheader: "LATEST PATCH NOTES",
                body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                bgImage: "/assets/news_feed_bg.png"
              });
            }
          })
          .catch(err => {
            console.error("Failed static news fetch", err);
            setNewsData({
                header: "GALACTIC NEWS UPDATE",
                subheader: "LATEST PATCH NOTES",
                body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                bgImage: "/assets/news_feed_bg.png"
            });
          });
      }
      return;
    }

    fetch('/api/cms?key=cosmic_racers_news_feed')
      .then(res => res.json())
      .then(json => {
        if (json && json.success && json.data) {
          setNewsData(json.data);
        } else {
          // Fallback: fetch from master-config
          fetch('/api/master-config')
            .then(res => res.json())
            .then(mcJson => {
              const data = mcJson.success ? mcJson.data : mcJson;
              if (data && data.newsFeed) {
                setNewsData(data.newsFeed);
              } else {
                setNewsData({
                  header: "GALACTIC NEWS UPDATE",
                  subheader: "LATEST PATCH NOTES",
                  body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                  bgImage: "/assets/news_feed_bg.png"
                });
              }
            })
            .catch(err => {
               console.error("Failed fallback news fetch", err);
               setNewsData({
                  header: "GALACTIC NEWS UPDATE",
                  subheader: "LATEST PATCH NOTES",
                  body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                  bgImage: "/assets/news_feed_bg.png"
               });
            });
        }
      })
      .catch(err => {
        console.warn("Failed primary news fetch, attempting fallback", err);
        fetch('/api/master-config')
          .then(res => res.json())
          .then(mcJson => {
            const data = mcJson.success ? mcJson.data : mcJson;
            if (data && data.newsFeed) {
              setNewsData(data.newsFeed);
            } else {
              setNewsData({
                header: "GALACTIC NEWS UPDATE",
                subheader: "LATEST PATCH NOTES",
                body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                bgImage: "/assets/news_feed_bg.png"
              });
            }
          })
          .catch(err2 => {
            console.error("Failed fallback news fetch", err2);
            setNewsData({
                header: "GALACTIC NEWS UPDATE",
                subheader: "LATEST PATCH NOTES",
                body: "Welcome to Cosmic Racers. The newest fleet deployments have been authorized.",
                bgImage: "/assets/news_feed_bg.png"
            });
          });
      });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newsData) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('shipId', 'news_feed'); // Reusing this endpoint
    formData.append('mapType', 'bg');

    try {
      const res = await fetch('/api/game-assets/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imagePath) {
          const newNewsData = { ...newsData, bgImage: data.imagePath };
          const cmsRes = await fetch('/api/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'cosmic_racers_news_feed', data: newNewsData })
          });
          if (cmsRes.ok) {
            setNewsData(newNewsData);
          } else {
            console.error("Failed to update CMS");
          }
        }
      } else {
        console.error("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTextUpdate = async (field: keyof NewsFeedData, value: string) => {
    if (!newsData) return;
    if (newsData[field] === value) return; // no change

    const newNewsData = { ...newsData, [field]: value };
    setNewsData(newNewsData); // Optimistic UI update

    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'cosmic_racers_news_feed', data: newNewsData })
      });
    } catch (err) {
      console.error("Failed to update CMS text", err);
    }
  };

  if (!newsData) return null;

  return (
    <div id="news-feed-overlay-container" style={{
      position: 'absolute', inset: 0, zIndex: 5000, 
      display: 'flex', flexDirection: 'row',
      pointerEvents: 'auto',
      backgroundColor: 'rgba(0,0,0,0.1)'
    }}>
      <style>{`
        @keyframes newsImageSlide {
          0% { opacity: 0; transform: translateX(50px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1.15); }
        }
        @keyframes newsTextFade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Left Column (Text - 25% + 100px) */}
      <div style={{
        flex: '0 0 calc(25% + 100px)',
        position: 'relative',
        zIndex: 10,
        padding: '60px 40px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'left',
        height: '100%',
        fontFamily: "'Rubik', sans-serif",
        background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div 
          style={{ 
            color: '#00e5ff', fontSize: 14, fontWeight: 900, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase',
            outline: 'none',
            borderBottom: isEditorMode ? '1px dashed rgba(0, 229, 255, 0.3)' : 'none',
            display: 'inline-block',
            opacity: 0,
            animation: 'newsTextFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards'
          }}
          contentEditable={isEditorMode}
          suppressContentEditableWarning={true}
          onBlur={(e) => handleTextUpdate('subheader', e.currentTarget.innerText)}
        >
          {newsData.subheader}
        </div>
        <h1 
          style={{ 
            fontSize: 48, fontWeight: 900, marginBottom: 20, lineHeight: 1.1,
            outline: 'none',
            borderBottom: isEditorMode ? '1px dashed rgba(255, 255, 255, 0.3)' : 'none',
            opacity: 0,
            animation: 'newsTextFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards'
          }}
          contentEditable={isEditorMode}
          suppressContentEditableWarning={true}
          onBlur={(e) => handleTextUpdate('header', e.currentTarget.innerText)}
        >
          {newsData.header}
        </h1>
        <div 
          style={{ 
            fontSize: 22, color: '#cccce0', lineHeight: 1.6,
            outline: 'none',
            borderBottom: isEditorMode ? '1px dashed rgba(204, 204, 224, 0.3)' : 'none',
            opacity: 0,
            animation: 'newsTextFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards'
          }}
          contentEditable={isEditorMode}
          suppressContentEditableWarning={true}
          onBlur={(e) => handleTextUpdate('body', e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: newsData.body }}
        />
      </div>

      {/* Right Column (Image - 75% - 100px) */}
      <div style={{
        flex: '0 0 calc(75% - 100px)',
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0px', // Removed 40px padding to maximize image space
        boxSizing: 'border-box'
      }}>
        {newsData.bgImage && (
            <img 
              src={PathController.resolve(newsData.bgImage)} 
              alt="News Graphic"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                marginBottom: '-300px', // Offset the 300px baked-in shadow so the visual graphic centers perfectly
                opacity: 0,
                animation: 'newsImageSlide 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            />
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'calc(12% + 20px)',
            right: '40px',
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s, border-color 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ✕
        </button>
      )}

      {isEditorMode && (
        <div style={{ position: 'absolute', bottom: 'calc(12% + 20px)', right: '20px', zIndex: 100 }}>
          <label style={{
            background: '#00e5ff33',
            border: '1px solid #00e5ff',
            color: '#00e5ff',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '14px',
            backdropFilter: 'blur(4px)',
            display: 'inline-block'
          }}>
            REPLACE IMAGE
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
          </label>
        </div>
      )}
    </div>
  );
}
