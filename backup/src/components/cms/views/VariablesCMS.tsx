"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, ShieldCheck, Terminal, Trash2 } from 'lucide-react';

export default function VariablesCMS() {
  const [telemetryStatus, setTelemetryStatus] = useState<{ isEnabled: boolean | null, raw: string }>({ isEnabled: null, raw: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();
      if (data.success) {
        setTelemetryStatus({ isEnabled: data.isEnabled, raw: data.rawOutput });
      } else {
        setTelemetryStatus({ isEnabled: null, raw: `Error: ${data.error}` });
      }
    } catch (err: any) {
      setTelemetryStatus({ isEnabled: null, raw: `Network Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleTelemetry = async (action: 'disable' | 'enable') => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      
      // Refresh the real status from the server after executing
      await fetchStatus();
      
    } catch (err: any) {
      console.error(err);
      alert('Failed to execute command on server.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12 pb-24">
      {/* Header */}
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex items-center gap-4">
          <Terminal className="text-[#FF3366]" size={36} />
          Variables & Hidden Data Control
        </h1>
        <p className="text-white/50 text-xl leading-relaxed max-w-3xl">
          This panel physically executes terminal commands on the server architecture to control hidden data collection, telemetry, and environment variables. No fake buttons.
        </p>
      </div>

      {/* Next.js Telemetry Control */}
      <div className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF3366] to-transparent opacity-50"></div>
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                Next.js Background Telemetry
                {isLoading ? (
                  <span className="text-xs font-mono px-3 py-1 bg-white/5 rounded-full text-white/50 animate-pulse">SCANNING...</span>
                ) : telemetryStatus.isEnabled ? (
                  <span className="text-xs font-bold px-3 py-1 bg-[#FF3366]/20 border border-[#FF3366]/50 rounded-full text-[#FF3366] flex items-center gap-1">
                    <ShieldAlert size={14} /> ACTIVE TRACKING DETECTED
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 bg-[#03FFC0]/20 border border-[#03FFC0]/50 rounded-full text-[#03FFC0] flex items-center gap-1">
                    <ShieldCheck size={14} /> SECURE (DISABLED)
                  </span>
                )}
              </h2>
              <p className="text-white/40 max-w-2xl">
                Next.js collects completely anonymous telemetry regarding usage by default. This information is sent to Vercel to shape Next.js' roadmap and prioritize features. You can permanently opt-out by physically running the <code className="text-[#FF3366] bg-[#FF3366]/10 px-2 py-0.5 rounded">npx next telemetry disable</code> command.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Live Terminal Output */}
            <div className="bg-black border border-white/10 rounded-xl p-6 font-mono text-sm relative group">
              <div className="absolute top-3 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <div className="text-white/30 text-xs text-right mb-4">root@optical-illusions:~# next telemetry status</div>
              
              <div className="text-white/70 whitespace-pre-wrap overflow-x-auto">
                {isLoading ? (
                  <span className="animate-pulse">Executing status check...</span>
                ) : (
                  telemetryStatus.raw
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Execute Command:</h3>
                
                {telemetryStatus.isEnabled ? (
                  <button 
                    onClick={() => toggleTelemetry('disable')}
                    disabled={isExecuting || isLoading}
                    className="w-full relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#FF3366] to-[#FF9933] rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <div className="relative bg-black px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 group-hover:bg-transparent">
                      {isExecuting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="text-[#FF3366] group-hover:text-white transition-colors" size={20} />
                      )}
                      <span className="font-bold text-white tracking-widest uppercase">
                        {isExecuting ? 'EXECUTING...' : 'KILL TELEMETRY TRACKING'}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleTelemetry('enable')}
                    disabled={isExecuting || isLoading}
                    className="w-full relative group overflow-hidden rounded-xl border border-white/20 p-4 transition-all duration-300 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative flex items-center justify-center gap-3">
                      {isExecuting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Terminal className="text-white/50 group-hover:text-white transition-colors" size={20} />
                      )}
                      <span className="font-bold text-white/50 group-hover:text-white transition-colors tracking-widest uppercase">
                        {isExecuting ? 'EXECUTING...' : 'RE-ENABLE TRACKING'}
                      </span>
                    </div>
                  </button>
                )}
                
                <p className="text-white/30 text-xs text-center mt-4">
                  Buttons physically execute <code className="bg-white/10 px-1 rounded">child_process.exec</code> on the local backend node server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
