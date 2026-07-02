import React from 'react';

export default function ThreadFeed({ activeNode }: { activeNode: any }) {
  return (
    <div className="flex-[1.5] bg-black/40 border border-emerald-500/20 rounded-2xl p-6 flex flex-col shadow-[0_0_20px_rgba(16,185,129,0.05)] relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30 rounded-t-2xl"></div>
      
      <div className="border-b border-white/10 pb-4 mb-4">
        <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mb-2 bg-emerald-900/30 inline-block px-2 py-0.5 rounded-sm border border-emerald-500/20">
          Layer 3: The Data Stream (/stream)
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">3. Live Threads</h2>
        <p className="opacity-60 text-sm mt-1">Raw Kinetic Telemetry Feed</p>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!activeNode ? (
          <div className="flex-1 flex items-center justify-center text-white/30 font-mono text-sm border border-dashed border-white/10 rounded-xl">
            Awaiting Node Selection...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {activeNode.topThreads && activeNode.topThreads.length > 0 ? (
              activeNode.topThreads.map((thread: string, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white/90 font-sans hover:bg-white/10 hover:border-emerald-500/30 transition-colors flex gap-4 items-start shadow-sm">
                  <span className="text-emerald-400/60 font-mono text-xs mt-0.5 min-w-[20px]">{idx + 1}.</span>
                  <span className="leading-relaxed">{thread}</span>
                </div>
              ))
            ) : (
              <div className="text-white/30 font-mono text-sm text-center mt-10">
                No active threads detected for {activeNode.assetKey}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
