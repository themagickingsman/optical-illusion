import React, { useState, useEffect } from 'react';

export default function ChargeEditor({ payload }: { payload: any }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (payload) {
      setTitle(`[HOT] Capitalizing on ${payload.resonance[0]}`);
      setBody(`System has detected massive kinetic energy on ${payload.assetKey}.\nVolume: ${payload.volume}\nVelocity: ${payload.velocity}\n\nKey Resonance Signals: ${payload.resonance.join(', ')}.\n\nDeploy counter-energy here...`);
    }
  }, [payload]);

  const handleDeploy = () => {
    if (!payload) return;
    const fullPost = `${title}\n\n${body}`;
    navigator.clipboard.writeText(fullPost);
    alert('Payload Copied to Clipboard! Ready for deployment to ' + payload.assetKey);
  };

  return (
    <div className="flex-[1.5] bg-black/40 border border-[#03FFC0]/30 rounded-2xl p-6 flex flex-col shadow-[0_0_30px_rgba(3,255,192,0.1)] relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-[#03FFC0]/30 rounded-t-2xl"></div>
      <div className="border-b border-white/10 pb-4 mb-4">
        <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest mb-2 bg-emerald-900/30 inline-block px-2 py-0.5 rounded-sm border border-emerald-500/20">
          Layer 3: The Brain (/logic)
        </div>
        <h2 className="text-2xl font-bold text-[#03FFC0] tracking-wide">3. Charge</h2>
        <p className="opacity-60 text-sm mt-1">Kinetic Energy Deployment</p>
      </div>
      <div className="flex-1 flex flex-col">
        {/* Editor Area */}
        <div className="bg-white/5 rounded-xl p-4 flex-1 border border-white/10 flex flex-col transition-colors focus-within:border-[#03FFC0]/50">
          <input 
            type="text" 
            placeholder="Click a Node in the Spark Radar..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-white/20 text-white text-xl pb-2 mb-4 outline-none focus:border-[#03FFC0] transition-colors"
          />
          <textarea 
            placeholder="Format kinetic energy payload here..." 
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full flex-1 bg-transparent border-none text-white text-sm outline-none resize-none font-mono opacity-80"
          />
        </div>
        
        {/* Output Action */}
        <div className="mt-4 flex justify-between items-center pb-4 border-b border-white/10">
          <div className="text-xs text-white/40 font-mono uppercase tracking-widest">
            {payload ? `Targeting: ${payload.assetKey}` : 'Awaiting Deployment...'}
          </div>
          <button 
            onClick={handleDeploy}
            className={`${payload ? 'bg-[#03FFC0] hover:scale-105' : 'bg-white/10 opacity-50 cursor-not-allowed'} text-black px-8 py-3 rounded-full font-bold tracking-widest text-sm uppercase transition-transform shadow-[0_4px_20px_rgba(3,255,192,0.4)]`}
          >
            Deploy Energy
          </button>
        </div>

        {/* Source Data Explorer */}
        <div className="mt-4 flex-1 min-h-0 flex flex-col">
          <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">
            Top Thread Sources (Live Data)
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {payload?.topThreads ? (
              payload.topThreads.map((thread: string, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white/80 font-mono flex gap-3">
                  <span className="text-[#03FFC0]/50">{idx + 1}.</span>
                  <span>{thread}</span>
                </div>
              ))
            ) : (
              <div className="text-white/20 text-xs italic text-center mt-4">No source data available. Select a node.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
