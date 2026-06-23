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
    "xcom.jpeg"
  ];

  return (
    <div className="glass-panel" style={{ 
      flex: 1, 
      padding: "40px", 
      background: "rgba(255, 255, 255, 0.03)", 
      backdropFilter: "blur(100px)", 
      WebkitBackdropFilter: "blur(100px)", 
      borderRadius: "20px", 
      border: "1px solid rgba(255,255,255,0.1)", 
      overflowY: "auto",
      overflowX: "hidden"
    }}>
      {/* The Grid */}
      <div style={{
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
        gap: "0",
        overflow: "visible",
      }}>
        {images.map((src, idx) => (
          <div key={idx} style={{
            position: "relative",
            width: "100%",
            aspectRatio: "3 / 4",
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

      {/* The Resume / Experience Text */}
      <div style={{ marginTop: "20px", color: "#fff", display: "flex", flexDirection: "column", gap: "35px", paddingBottom: "20px", fontFamily: "var(--font-rubik)" }}>
        
        {/* Header Block */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "42px", color: "#0ff", letterSpacing: "-1px" }}>Neyo Onalenna</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "18px", color: "#4ade80", fontWeight: 600 }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }} />
              Available
            </div>
          </div>
          <div style={{ fontSize: "18px", opacity: 0.8, marginTop: "12px", letterSpacing: "0.5px" }}>Location: London</div>
          <div style={{ fontSize: "22px", opacity: 0.9, fontWeight: 500, marginTop: "8px" }}>Full-time Independent developer</div>
          <div style={{ fontSize: "18px", opacity: 0.6, marginTop: "5px" }}>2010 - 2026</div>
        </div>

        {/* Tech Stack */}
        <div style={{ padding: "25px", background: "rgba(0, 255, 255, 0.05)", borderRadius: "16px", borderLeft: "4px solid #0ff" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>Front-end Designer + Dev</div>
          <div style={{ fontSize: "20px", opacity: 0.9, marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
            React <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> Three.js <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> Python = Dynamic Front-end pipeline
          </div>
          <div style={{ fontSize: "18px", opacity: 0.6 }}>Playstation, Xbox, PC and Switch</div>
        </div>

        {/* Experience Blocks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Kabam */}
          <div>
            <div style={{ fontSize: "26px", color: "#0ff", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "baseline", gap: "15px" }}>
              Kabaam <span style={{ fontSize: "18px", opacity: 0.6, fontWeight: "normal" }}>2012 - 2014</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "25px", fontSize: "20px", opacity: 0.8, lineHeight: 1.7 }}>
              <li><strong>Kingdoms of Camelot</strong> - Front-end design + tech art</li>
              <li><strong>Contests of champions</strong> - Front-end design + tech art</li>
            </ul>
          </div>

          {/* Sega */}
          <div>
            <div style={{ fontSize: "26px", color: "#0ff", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "baseline", gap: "15px" }}>
              Sega <span style={{ fontSize: "18px", opacity: 0.6, fontWeight: "normal" }}>2014 - 2019</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "25px", fontSize: "20px", opacity: 0.8, lineHeight: 1.7 }}>
              <li><strong>Sonic & All-Stars Racing Transformed</strong> - brought console to mobile</li>
              <li><strong>Football Manager Handheld 2014</strong> - Brought console to mobile</li>
              <li><strong>Sonic Dash</strong> - Mobile</li>
              <li><strong>The Sega Forever Launch Lineup</strong></li>
            </ul>
          </div>

          {/* Unity */}
          <div>
            <div style={{ fontSize: "26px", color: "#0ff", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "baseline", gap: "15px" }}>
              Unity <span style={{ fontSize: "18px", opacity: 0.6, fontWeight: "normal" }}>2019 - 2023</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "25px", fontSize: "20px", opacity: 0.8, lineHeight: 1.7 }}>
              <li>Front-end design + Integration Team</li>
            </ul>
          </div>

          {/* Optical Illusions */}
          <div>
            <div style={{ fontSize: "26px", color: "#0ff", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "baseline", gap: "15px" }}>
              Optical Illusions <span style={{ fontSize: "18px", opacity: 0.6, fontWeight: "normal" }}>Since 2023</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "25px", fontSize: "20px", opacity: 0.8, lineHeight: 1.7 }}>
              <li>Independent front-end design + dev</li>
            </ul>
          </div>

        </div>

        {/* Closing Statement */}
        <div style={{ padding: "40px", background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,255,255,0.05) 100%)", borderRadius: "20px", border: "1px solid rgba(0,255,255,0.2)", marginTop: "20px" }}>
          <p style={{ fontSize: "22px", lineHeight: 1.6, margin: "0 0 30px 0", opacity: 0.9 }}>
            I built a proprietary backend framework that allows front-end experience integration into any development environment for console, mobile, pc and switch.
          </p>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0ff", letterSpacing: "1px", marginBottom: "30px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            React <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> Three.js <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> WebGL <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> Python <span style={{opacity:0.5, transform: "rotate(45deg)", display: "inline-block"}}>+</span> Json
          </div>
          <p style={{ fontSize: "26px", fontWeight: 500, margin: 0, textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            I develop front-end UI, transitions, effects and data API connections
          </p>
        </div>

      </div>

    </div>
  );
}
