"use client";

import React from "react";
import Image from "next/image";

export default function GameMosaic() {
  const images = [
    "contest_of_champions.jpeg",
    "farcry.jpeg",
    "fbm.jpeg",
    "fruitninja.jpeg",
    "koc.jpeg",
    "madden.jpeg",
    "nba2k.jpeg",
    "pokemon_go.jpeg",
    "sonic_dash2.jpeg",
    "sonic_jump.jpeg",
    "taxi.jpeg",
    "tw.jpeg",
    "valorant.jpeg",
    "xcom.jpeg",
    "black_ops_6.jpeg",
    "balatro.jpeg",
    "destiny_2.jpeg",
    "zynga_poker.jpeg",
    "wow.jpeg",
    "cfb_25.jpeg",
    "block_blast.jpeg",
    "poker_stars.jpeg",
    "brawlstars.jpeg",
    "zooba.jpeg"
  ];

  return (
    <div className="glass-panel" style={{ 
      flex: 1, 
      padding: "0", 
      background: "rgba(20, 60, 180, 0.2)", 
      backdropFilter: "blur(25px)", 
      WebkitBackdropFilter: "blur(25px)", 
      borderRadius: "40px", 
      border: "1px solid rgba(0, 255, 255, 0.1)", 
      overflow: "visible",
      display: "flex",
      position: "relative",
      zIndex: 10
    }}>
      {/* The Grid */}
      <div style={{
        flex: 1,
        display: "grid", 
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: "0",
        width: "100%",
        height: "100%",
      }}>
        {images.map((src, idx) => (
          <div key={idx} style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            cursor: "pointer",
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.8)";
            e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.9)";
            e.currentTarget.style.zIndex = "100";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.zIndex = "1";
          }}
          >
            <Image 
              src={`/assets/box_art/${src}`} 
              alt={src.split('.')[0].replace(/_/g, ' ')} 
              fill 
              style={{ objectFit: 'cover' }} 
              sizes="(max-width: 768px) 100vw, 200px"
            />
          </div>
        ))}
      </div>



    </div>
  );
}
