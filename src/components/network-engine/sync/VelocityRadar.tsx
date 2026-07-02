import React from 'react';

export default function VelocityRadar({ nodes, activeNode, onNodeClick }: { nodes: any[], activeNode: any, onNodeClick: (node: any) => void }) {
  
  return (
    <div className="flex-[1.5] bg-black/40 border border-purple-500/20 rounded-2xl p-6 flex flex-col shadow-[0_0_20px_rgba(168,85,247,0.05)] relative group overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/30 rounded-t-2xl"></div>
      
      <div className="border-b border-white/10 pb-4 mb-4 relative z-10">
        <div className="text-[10px] text-purple-400 font-mono uppercase tracking-widest mb-2 bg-purple-900/30 inline-block px-2 py-0.5 rounded-sm border border-purple-500/20">
          Layer 1: The Clock (/sync)
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">2. Spark</h2>
        <p className="opacity-60 text-sm mt-1">Zero-Impedance Resonance Radar</p>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
        {/* The Solar System Center (Static HUD) */}
        <div className="absolute w-32 h-32 rounded-full z-20 flex items-center justify-center pointer-events-none">
          {activeNode ? (
            <div className="bg-black/80 border border-purple-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.5)] text-center w-48 backdrop-blur-sm pointer-events-auto transition-all animate-in zoom-in duration-200">
              <h3 className="text-purple-300 font-bold text-lg mb-1">{activeNode.assetKey}</h3>
              <div className="flex justify-between text-xs text-white/70 font-mono border-t border-b border-white/10 py-1 my-2">
                <span>Vol: <span className="text-white">{activeNode.volume}</span></span>
                <span>Vel: <span className="text-white">{activeNode.velocity}</span></span>
              </div>
              <p className="text-[9px] text-purple-400 uppercase tracking-wider leading-tight">
                Resonance:<br/>
                <span className="text-white font-bold">{activeNode.resonance.join(' · ')}</span>
              </p>
            </div>
          ) : (
            <div className="w-4 h-4 bg-purple-500/50 rounded-full shadow-[0_0_50px_#a855f7] flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Orbit Rings & Nodes */}
        {nodes && nodes.map((node, i) => {
          // Math to map the data to visuals
          // Volume (500 - 5000) maps to size (12px - 36px)
          const size = Math.max(12, Math.min(48, (node.volume / 1000) * 12));
          
          // Velocity (10 - 500) maps to animation duration (20s - 4s) [Higher velocity = shorter duration/faster]
          const duration = Math.max(4, 20 - ((node.velocity / 200) * 16));
          
          // Orbit distance based on index just for spacing (pushed further out to make room for center HUD)
          const orbitRadius = 110 + (i * 45);
          
          const isActive = activeNode?.assetKey === node.assetKey;

          return (
            <div 
              key={node.assetKey}
              className={`absolute rounded-full border pointer-events-none flex items-center justify-center transition-colors ${isActive ? 'border-purple-400/50' : 'border-purple-500/10'}`}
              style={{
                width: orbitRadius * 2,
                height: orbitRadius * 2,
                animationName: 'spin',
                animationDuration: `${duration}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationPlayState: isActive ? 'paused' : 'running'
              }}
            >
              {/* The Planet / Node */}
              <div 
                className={`absolute rounded-full cursor-pointer pointer-events-auto transition-all flex items-center justify-center group ${
                  isActive 
                    ? 'bg-white shadow-[0_0_30px_#fff] scale-125 border-4 border-purple-500' 
                    : 'bg-purple-400 shadow-[0_0_15px_#a855f7] hover:scale-150 hover:bg-white'
                }`}
                style={{
                  width: size,
                  height: size,
                  top: -size/2,
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
                onClick={() => onNodeClick && onNodeClick(node)}
              >
                {/* No tooltip anymore - data is in HUD */}
              </div>
            </div>
          );
        })}

        {/* CSS Keyframes for spin */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    </div>
  );
}
