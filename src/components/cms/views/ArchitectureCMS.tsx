"use client";

import React, { useState } from 'react';

const shapes = [
  { id: 'point', name: 'Point', description: '0D - The Inception' },
  { id: 'line', name: 'Line', description: '1D - The Connection' },
  { id: 'triangle', name: 'Triangle', description: '2D - The Foundation' },
  { id: 'square', name: 'Square', description: '2D - The Structure' },
  { id: 'hexagon', name: 'Hexagon', description: '2D - The Network' },
];

export default function ArchitectureCMS() {
  const [activeShape, setActiveShape] = useState('triangle');

  return (
    <div className="flex w-full h-full text-white font-sans" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      
      {/* Left Column: Geometric Roadmap Nav */}
      <div className="w-80 border-r border-white/10 p-6 flex flex-col gap-3 bg-black/50 backdrop-blur-md overflow-y-auto shrink-0">
        <h2 className="text-xl font-bold tracking-widest uppercase mb-6 text-[#03FFC0]">Geometric Roadmap</h2>
        
        {shapes.map((shape) => (
          <button
            key={shape.id}
            onClick={() => setActiveShape(shape.id)}
            className={`p-4 text-left rounded-xl transition-all duration-200 border ${
              activeShape === shape.id 
                ? 'bg-[#03FFC0]/10 border-[#03FFC0]' 
                : 'bg-transparent border-white/10 hover:bg-white/5'
            }`}
          >
            <div className="text-lg font-bold mb-1">{shape.name}</div>
            <div className="text-xs opacity-60 tracking-widest uppercase">{shape.description}</div>
          </button>
        ))}
      </div>

      {/* Right Column: Architecture Details */}
      <div className="flex-1 p-12 overflow-y-auto">
        
        {activeShape === 'point' && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-5xl font-bold mb-4">Point Architecture</h1>
            <p className="text-xl opacity-70">The origin. The initial CMS build and singular user capability.</p>
            <div className="mt-8 p-6 border border-dashed border-white/20 rounded-xl text-white/50">
              Completed.
            </div>
          </div>
        )}

        {activeShape === 'line' && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-5xl font-bold mb-4">Line Architecture</h1>
            <p className="text-xl opacity-70">1-to-1 relationships. Basic telemetry and direct manual connections.</p>
            <div className="mt-8 p-6 border border-dashed border-white/20 rounded-xl text-white/50">
              Completed.
            </div>
          </div>
        )}

        {activeShape === 'triangle' && (
          <div className="animate-in fade-in duration-500 space-y-16 pb-32 max-w-5xl">
            
            <div className="border-b border-white/10 pb-8">
              <h1 className="text-5xl font-bold mb-4 text-[#03FFC0]">Triangle Architecture</h1>
              <p className="text-xl opacity-70 leading-relaxed">
                The first stable structure. A closed feedback loop for targeted energy injection. This section serves as the definitive manual for the <strong>Thermodynamic Agent Hub</strong>. AI Agents must read and strictly adhere to this zero-database, serverless architecture.
              </p>
            </div>

            {/* 1. UGCS Protocol Formula */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-[#03FFC0] font-mono">1.0</span> The Universal Component Protocol
              </h2>
              <div className="bg-black/60 border border-[#03FFC0]/40 rounded-2xl p-10 shadow-[0_0_30px_rgba(3,255,192,0.1)]">
                <div className="text-center mb-10">
                  <p className="text-xs text-[#03FFC0]/70 tracking-[0.2em] uppercase mb-4 font-bold">The Execution Formula</p>
                  <div className="text-6xl font-mono text-white tracking-widest bg-[#03FFC0]/10 py-6 rounded-xl border border-[#03FFC0]/30 inline-block px-12">
                    E = <span className="text-[#03FFC0]">f</span>(K, M, S, B)
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#03FFC0]/20">
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-xl font-bold text-[#03FFC0] font-mono mb-3">K (The Key)</h4>
                    <p className="text-sm text-white/70 leading-relaxed">The immutable cryptographic identifier for a network node (e.g., a Subreddit, a Discord Server). It is the only acceptable identifier to summon the node into the UI.</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-xl font-bold text-[#03FFC0] font-mono mb-3">M (The Manifest)</h4>
                    <p className="text-sm text-white/70 leading-relaxed">The JSON payload defining the telemetry and relationships of that node. Data is strictly stateless and volatile.</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-xl font-bold text-[#03FFC0] font-mono mb-3">S (The Sandbox)</h4>
                    <p className="text-sm text-white/70 leading-relaxed">The isolated runtime wrapper. We view the nodes inside an isolated box to prevent their unpredictable external data from polluting the Master Control.</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h4 className="text-xl font-bold text-[#03FFC0] font-mono mb-3">B (The Binding)</h4>
                    <p className="text-sm text-white/70 leading-relaxed">The Universal Event Bus that connects the Target, the Spark, and the Charge together so energy flows seamlessly between them.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Thermodynamic Cloud Architecture */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-red-400 flex items-center gap-3">
                <span className="font-mono">2.0</span> Thermodynamic Stateless Architecture
              </h2>
              
              <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-10 space-y-8">
                
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
                  <p className="text-red-400 font-mono text-sm leading-relaxed">
                    <strong className="text-base mb-2 block">AI DIRECTIVE: ZERO DATABASES</strong>
                    There is NO SQL, NO Postgres, NO massive data hoarding. A thermodynamic system treats data as a continuous current of kinetic energy. We do not store old waves. We only measure the live standing wave. Old data is allowed to dissipate.
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">The Serverless App Store Daemon (Option C)</h3>
                  <p className="text-white/70 leading-relaxed">
                    To maintain zero-cost, infinite scalability, the "Heat Source" (the scraper) does not run locally on a developer's box. It is packaged as an isolated Master Component (Tier 3) deployed to GitHub Actions.
                  </p>
                  
                  {/* System Architecture Diagram */}
                  <div className="bg-black/80 border border-red-500/30 p-8 rounded-xl shadow-[inset_0_2px_20px_rgba(239,68,68,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 text-xs px-3 py-1 font-mono uppercase tracking-widest border-b border-l border-red-500/30 rounded-bl-lg">
                      Data Pipeline Flow
                    </div>

                    <div className="flex flex-col items-center gap-6 relative z-10 pt-8">
                      
                      {/* CMS Input */}
                      <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center w-80 relative z-10">
                        <h4 className="text-white font-bold mb-1">1. Master CMS Configuration</h4>
                        <p className="text-xs text-white/50 font-mono">User inputs Target URLs via UI.</p>
                      </div>

                      <div className="w-0.5 h-8 bg-gradient-to-b from-white/20 to-red-500"></div>

                      {/* GitHub Actions */}
                      <div className="bg-red-950/60 border border-red-500/60 p-6 rounded-xl text-center w-[400px] relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <h4 className="text-lg font-bold text-red-400 mb-2">2. GitHub Actions (The Daemon)</h4>
                        <p className="text-xs text-red-200/70 mb-3 font-mono leading-relaxed">
                          A 24/7 serverless CRON job running on Microsoft's hardware for free.
                        </p>
                        <div className="bg-black/50 p-3 rounded-lg border border-red-500/20 text-left">
                          <ul className="text-[11px] text-red-300 font-mono space-y-1">
                            <li>&gt; Reads CMS Configuration</li>
                            <li>&gt; Ingests Live Social Velocity</li>
                            <li>&gt; Calculates Resonance (Math)</li>
                          </ul>
                        </div>
                      </div>

                      <div className="w-0.5 h-8 bg-gradient-to-b from-red-500 to-[#03FFC0]"></div>

                      {/* Volatile Output */}
                      <div className="bg-[#03FFC0]/10 border border-[#03FFC0]/40 p-4 rounded-xl text-center w-80 relative z-10">
                        <h4 className="text-[#03FFC0] font-bold mb-1">3. Volatile JSON Endpoint</h4>
                        <p className="text-xs text-[#03FFC0]/60 font-mono">Current wave state stored briefly (Gist/S3).</p>
                      </div>

                      <div className="w-0.5 h-8 bg-[#03FFC0]"></div>

                      {/* UI Consumption */}
                      <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-center w-80 relative z-10">
                        <h4 className="text-white font-bold mb-1">4. Triangle UI (Heat Sink)</h4>
                        <p className="text-xs text-white/50 font-mono">Pings endpoint and displays live data.</p>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-white mb-2">The Magic of the Asset Key</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Because the entire scraper is an isolated GitHub Action, another user can install this entire system just by pulling the <code className="bg-black/50 text-[#03FFC0] px-2 py-1 rounded">Asset Key</code>. The system will deploy the React UI to their Vercel, and automatically deploy the Daemon to their GitHub. True, universal plug-and-play architecture.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. The 3 Nodes (Body, Clock, Brain) */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
                <span className="font-mono">3.0</span> The 3 Component Layers
              </h2>
              
              <div className="grid grid-cols-3 gap-6">
                
                {/* Layer 2: Body (Target) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/30"></div>
                  <h3 className="text-2xl font-bold text-white mb-1">Target</h3>
                  <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-6 bg-cyan-900/30 inline-block px-3 py-1 rounded-full border border-cyan-500/20">
                    Layer 2: The Body (/assets)
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    <strong>The Heat Sink.</strong> The physical nodes of the network. These are "dumb" visual entities (Subreddits, Users, Discord Servers) waiting to be acted upon. They hold no logic, just location data.
                  </p>
                  <ul className="text-sm font-mono text-cyan-200/60 space-y-2">
                    <li>→ CRM Directory</li>
                    <li>→ Visual Grid Mapping</li>
                    <li>→ Zero Decision Logic</li>
                  </ul>
                </div>

                {/* Layer 1: Clock (Spark) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/30"></div>
                  <h3 className="text-2xl font-bold text-white mb-1">Spark</h3>
                  <div className="text-[10px] text-purple-400 font-mono uppercase tracking-widest mb-6 bg-purple-900/30 inline-block px-3 py-1 rounded-full border border-purple-500/20">
                    Layer 1: The Clock (/sync)
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    <strong>The Engine.</strong> The Biometric Sync layer. This component actively listens to the JSON Endpoint from the Cloud Daemon. It tracks the velocity and tells the UI what is resonating right now.
                  </p>
                  <ul className="text-sm font-mono text-purple-200/60 space-y-2">
                    <li>→ Real-time Velocity Radar</li>
                    <li>→ 7.83Hz / 10Hz Resonances</li>
                    <li>→ Heat Maps</li>
                  </ul>
                </div>

                {/* Layer 3: Brain (Charge) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30"></div>
                  <h3 className="text-2xl font-bold text-white mb-1">Charge</h3>
                  <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mb-6 bg-emerald-900/30 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                    Layer 3: The Brain (/logic)
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    <strong>Kinetic Energy.</strong> The decision-making center. This is where the human (or AI) drafts the post, commits a decision, and injects the formatted kinetic energy back out into the real world.
                  </p>
                  <ul className="text-sm font-mono text-emerald-200/60 space-y-2">
                    <li>→ Pre-formatted Payload Staging</li>
                    <li>→ 1-Click Execution</li>
                    <li>→ Energy Output</li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        )}

        {(activeShape === 'square' || activeShape === 'hexagon') && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-5xl font-bold mb-4">{shapes.find(s => s.id === activeShape)?.name} Architecture</h1>
            <p className="text-xl opacity-70">Advanced structure requiring completion of previous geometric phases.</p>
            <div className="mt-8 p-6 border border-dashed border-white/20 rounded-xl text-white/50 font-mono uppercase tracking-widest">
              Awaiting stabilization of Triangle phase.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
