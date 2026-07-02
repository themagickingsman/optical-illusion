"use client";

import React, { useState, useEffect } from 'react';
import TargetCRM from './assets/TargetCRM';
import VelocityRadar from './sync/VelocityRadar';
import ThreadFeed from './assets/ThreadFeed';

export default function NetworkEngine() {
  const [targetPath, setTargetPath] = useState('gameDevClassifieds, INAT, forhire, DesignJobs, freelance_forhire, jobbit, hiring, remotework, remotejs, startupproject, cofounder, programmingbuddies, UI_Design, Web_Design, UXDesign, frontend, reactjs, threejs, webgl, gamedev');
  const [daemonActive, setDaemonActive] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const subs = targetPath.split(',').map(s => s.trim()).filter(Boolean);
      await fetch('/api/daemon/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddits: subs })
      });
      setTimeout(() => setIsSyncing(false), 1000);
    } catch (err) {
      console.error(err);
      setIsSyncing(false);
    }
  };

  // Major Gates
  const [daemonCron, setDaemonCron] = useState('*/15 * * * *');
  const [pollingRateMs, setPollingRateMs] = useState(5000);
  
  // Telemetry State
  const [telemetry, setTelemetry] = useState({ nodes: [] });
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    if (!daemonActive) return;

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
    const interval = setInterval(fetchTelemetry, pollingRateMs);
    return () => clearInterval(interval);
  }, [daemonActive, pollingRateMs]);

  const handleNodeClick = (nodeData: any) => {
    setActiveNode(nodeData);
  };

  return (
    <div className="flex flex-col w-full h-full text-white p-8 gap-6 font-sans">
      
      {/* Master Configuration Panel (Top Bar) */}
      <div className="bg-black/60 border border-red-500/30 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 bg-red-500/20 text-red-300 text-xs px-4 py-1 font-mono uppercase tracking-widest border-b border-l border-red-500/30 rounded-bl-lg">
          Cloud Daemon Core
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-red-400">Master UI Configuration</h2>
            <p className="text-sm opacity-60 mt-1">Bind the UI to the isolated GitHub Actions thermodynamic heat source.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowPreferences(!showPreferences)}
              className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors border border-white/20 px-3 py-1 rounded-md"
            >
              {showPreferences ? 'Hide Gates' : 'Edit Major Gates'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-red-300">Daemon Status</span>
              <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${daemonActive ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}></div>
            </div>
          </div>
        </div>
        
        {/* Preferences Console (Major Gates) */}
        {showPreferences && (
          <div className="mb-6 p-4 border border-red-500/30 rounded-lg bg-red-900/10 flex gap-6">
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-red-300 uppercase tracking-widest mb-1">Daemon Trigger Rate (CRON)</label>
              <input 
                type="text" 
                value={daemonCron}
                onChange={(e) => setDaemonCron(e.target.value)}
                className="w-full bg-black/50 border border-red-500/20 rounded px-3 py-2 text-white text-sm font-mono outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-red-300 uppercase tracking-widest mb-1">Local Polling Rate (MS)</label>
              <input 
                type="number" 
                value={pollingRateMs}
                onChange={(e) => setPollingRateMs(Number(e.target.value))}
                className="w-full bg-black/50 border border-red-500/20 rounded px-3 py-2 text-white text-sm font-mono outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-mono text-white/50 uppercase tracking-widest mb-2">Target Vectors (Asset Keys)</label>
            <input 
              type="text" 
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              placeholder="e.g. nextjs, reactjs"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-500 transition-colors font-mono"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`${isSyncing ? 'bg-red-500 text-black' : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black'} border border-red-500/50 px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-colors`}
          >
            {isSyncing ? 'Syncing...' : 'Sync Configuration'}
          </button>
        </div>
      </div>

      {/* Thermodynamic 3-Layer Component Hub */}
      <div className="flex flex-1 gap-6 min-h-0">
        <TargetCRM nodes={telemetry?.nodes || []} activeNode={activeNode} onNodeClick={handleNodeClick} />
        <VelocityRadar nodes={telemetry?.nodes || []} activeNode={activeNode} onNodeClick={handleNodeClick} />
        <ThreadFeed activeNode={activeNode} />
      </div>

    </div>
  );
}
