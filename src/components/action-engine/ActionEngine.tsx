"use client";

import React, { useState, useEffect } from 'react';
import ChargeEditor from '../network-engine/logic/ChargeEditor';

export default function ActionEngine() {
  const [telemetry, setTelemetry] = useState({ nodes: [] });
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/telemetry.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        console.error("Failed to fetch telemetry", err);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full h-full text-white p-8 gap-6 font-sans">
      <div className="bg-black/60 border border-[#03FFC0]/30 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(3,255,192,0.05)] relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 bg-[#03FFC0]/20 text-[#03FFC0] text-xs px-4 py-1 font-mono uppercase tracking-widest border-b border-l border-[#03FFC0]/30 rounded-bl-lg">
          The Square / Action Matrix
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-[#03FFC0]">Payload Deployment Deck</h2>
            <p className="text-sm opacity-60 mt-1">Select an active node to format and deploy its kinetic energy payload.</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {telemetry.nodes && telemetry.nodes.map((node: any) => (
            <button
              key={node.assetKey}
              onClick={() => setActiveNode(node)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors border whitespace-nowrap ${
                activeNode?.assetKey === node.assetKey 
                  ? 'bg-[#03FFC0] text-black border-[#03FFC0] shadow-[0_0_15px_rgba(3,255,192,0.4)]' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-[#03FFC0]/50'
              }`}
            >
              {node.assetKey} (Vol: {node.volume})
            </button>
          ))}
          {(!telemetry.nodes || telemetry.nodes.length === 0) && (
            <div className="text-white/30 text-sm italic py-2">No nodes available. Check the Cloud Daemon.</div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 w-full max-w-5xl mx-auto">
        <ChargeEditor payload={activeNode} />
      </div>
    </div>
  );
}
