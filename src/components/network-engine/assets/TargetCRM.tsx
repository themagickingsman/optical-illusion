import React from 'react';

export default function TargetCRM({ nodes, activeNode, onNodeClick }: { nodes: any[], activeNode: any, onNodeClick: (node: any) => void }) {
  return (
    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col shadow-[0_0_20px_rgba(3,255,192,0.05)] relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/30 rounded-t-2xl"></div>
      <div className="border-b border-white/10 pb-4 mb-4">
        <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-2 bg-cyan-900/30 inline-block px-2 py-0.5 rounded-sm border border-cyan-500/20">
          Layer 2: The Body (/assets)
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">1. Target</h2>
        <p className="opacity-60 text-sm mt-1">CRM & Heat Sink</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {nodes && nodes.map((node) => {
          const isActive = activeNode?.assetKey === node.assetKey;
          return (
            <div 
              key={node.assetKey} 
              onClick={() => onNodeClick && onNodeClick(node)}
              className={`p-3 border rounded-lg flex flex-col gap-1 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-cyan-900/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                  : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/50'
              }`}
            >
              <span className="font-bold text-white text-sm">{node.assetKey}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="opacity-50 text-[10px] font-mono">Vol: {node.volume}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-300 font-bold' : 'opacity-50 text-cyan-400'}`}>Vel: {node.velocity}</span>
              </div>
            </div>
          );
        })}
        {(!nodes || nodes.length === 0) && (
          <div className="text-white/30 text-xs font-mono p-4 text-center">
            Awaiting Heat Source...
          </div>
        )}
      </div>
    </div>
  );
}
