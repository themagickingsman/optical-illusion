import React, { useState } from 'react';
import { useMasterController } from '@/core/MasterController';
import PipelineConsole from '@/components/library/PipelineConsole';

const TOC = [
  { id: 'vision', label: '1. The Core Brief (Investors & Devs)', status: '🟢', statusText: 'Live' },
  { id: 'protocol', label: '2. Universal Component Protocol', status: '🟢', statusText: 'Live' },
  { id: 'master_control', label: '3. Master Control (CMS)', status: '🟢', statusText: 'Live' },
  { id: 'app_store', label: '4. The App Store', status: '🟢', statusText: 'Live' },
  { id: 'compiler', label: '5. AI Compiler Engine', status: '🟢', statusText: 'Live' },
  { id: 'cloud', label: '6. Data Pipeline & Cloud', status: '🟢', statusText: 'Live' },
  { id: 'monetization', label: '7. Monetization & KPIs', status: '🟢', statusText: 'Live' },
  { id: 'agent_insertion', label: '8. Agent Protocol & MCP Architecture', status: '🔴', statusText: 'Strict' },
  { id: 'cms_vs_build', label: '9. CMS vs Build Architecture', status: '🔴', statusText: 'Strict' },
  { id: 'thermodynamic_hub', label: '10. Thermodynamic Agent Hub', status: '🟢', statusText: 'Live' },
  { id: 'deploy_pipeline', label: '11. Autonomous Deploy Pipeline', status: '🟢', statusText: 'Live' },
];

export default function MasterControllerView() {
  const { paths, activeAssetKey, systemRules } = useMasterController();
  const [activeSection, setActiveSection] = useState('deploy_pipeline');

  return (
    <div className="w-full h-full flex bg-black/80 backdrop-blur-2xl text-white font-sans">
      
      {/* --- LEFT SIDEBAR: MONOLITHIC TOC --- */}
      <div className="w-96 border-r border-white/10 bg-black/40 flex flex-col h-full overflow-y-auto shrink-0 shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1">UGCS Protocol</h2>
          <p className="text-xs text-blue-400 font-mono uppercase tracking-[0.2em]">Master Documentation</p>
        </div>
        
        <div className="p-6">
          <p className="text-xs text-white/40 mb-4 uppercase tracking-wider font-bold">Table of Contents</p>
          <nav className="space-y-2">
            {TOC.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-4 py-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-between border ${
                  activeSection === item.id 
                    ? 'bg-blue-900/30 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="font-mono font-medium tracking-tight">{item.label}</span>
                <span className="text-xs font-mono opacity-50 flex items-center gap-2">
                  {item.statusText}
                  <span className="text-base">{item.status}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
           <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4">
              <p className="text-xs text-red-400 font-mono uppercase tracking-wider mb-1">AI System Status</p>
              <p className="text-sm text-red-200">Strict Enforcement Active</p>
           </div>
        </div>
      </div>

      {/* --- RIGHT PANE: DOCUMENTATION CONTENT --- */}
      <div className="flex-1 p-12 overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto space-y-16 pb-32">
          
          {/* SECTION 1: VISION */}
          {activeSection === 'vision' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">1. The Core Brief</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The executive summary for investors and the core development team. Defines the problem, the industry shift, and the global architecture we are bringing to market.
                </p>
              </div>

              {/* 1.1 The Problem */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-red-400 flex items-center gap-3">
                  <span className="font-mono">1.1</span> Define the Problem
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8">
                  <p className="text-lg text-white/80 leading-relaxed">
                    The traditional AAA game development pipeline is fundamentally broken. It requires 1,000-person teams, massive capital expenditure, and years of proprietary engineering locked inside monolithic, custom engines. 
                  </p>
                  
                  {/* Problem Diagram */}
                  <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 relative">
                    <p className="text-xs text-red-400 font-mono uppercase tracking-widest mb-4">Structure Today: The Monolithic Bottleneck</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 bg-black/60 border border-white/10 p-4 rounded-lg text-center text-sm text-white/60">
                        1,000+ Dev Team <br/><span className="text-red-400 text-xs">High CapEx</span>
                      </div>
                      <div className="text-red-500">→</div>
                      <div className="flex-1 bg-black/60 border border-white/10 p-4 rounded-lg text-center text-sm text-white/60">
                        Proprietary Code <br/><span className="text-red-400 text-xs">Zero Interoperability</span>
                      </div>
                      <div className="text-red-500">→</div>
                      <div className="flex-1 bg-black/60 border border-white/10 p-4 rounded-lg text-center text-sm text-white/60">
                        Monolithic Engine <br/><span className="text-red-400 text-xs">3-Year Build Time</span>
                      </div>
                      <div className="text-red-500">→</div>
                      <div className="flex-1 bg-red-900/40 border border-red-500 p-4 rounded-lg text-center text-sm text-white font-bold">
                        Single Product <br/><span className="text-red-400 text-xs">Massive Risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1.2 The Industry Trend */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                  <span className="font-mono">1.2</span> Define the Industry Trend
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 text-white/80 leading-relaxed text-lg">
                  <p>
                    The entire industry is abandoning the monolithic model and pivoting toward <strong>User-Generated Content (UGC)</strong> and <strong>Solo Creators</strong>. 
                  </p>
                  <p>
                    Major publishers (Microsoft, Epic) are shifting to a "zero-risk" publishing model. Instead of funding games blindly, they monitor engagement KPIs (DAU/MAU) of solo developer prototypes, and only invest in games that are already trending. 
                  </p>
                  <p>
                    Currently, developers use Roblox (low fidelity, easy) or Unreal Editor for Fortnite (high fidelity, walled garden). The market is desperate for a unified standard that offers AAA quality with Lego-like simplicity.
                  </p>
                </div>
              </div>

              {/* 1.3 The Solution */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-blue-400 flex items-center gap-3">
                  <span className="font-mono">1.3</span> Define Our Solution (UGCS)
                </h2>
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-8 space-y-8">
                  <p className="text-lg text-blue-100 leading-relaxed">
                    We are building the <strong>Universal Component Protocol</strong>. One engine that uses standardized, cross-platform components for collaborative, multiplayer game development. By enforcing a strict API protocol, we allow solo developers—and AI agents—to snap AAA assets together instantly without writing core logic.
                  </p>

                  {/* Solution Diagram */}
                  <div className="bg-blue-950/30 border border-blue-500/40 rounded-xl p-6 relative">
                    <p className="text-xs text-blue-400 font-mono uppercase tracking-widest mb-4">Our Architecture: The Decoupled Protocol</p>
                    <div className="flex items-center justify-between gap-4">
                      
                      <div className="flex-1 bg-black/60 border border-blue-500/30 p-4 rounded-lg text-center shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <div className="text-sm font-bold text-blue-200">Solo Devs & AI</div>
                        <div className="text-blue-400/60 text-xs mt-1">Zero Engineering Overhead</div>
                      </div>
                      
                      <div className="text-blue-500">→</div>
                      
                      <div className="flex-1 bg-black/60 border border-blue-500/30 p-4 rounded-lg text-center shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <div className="text-sm font-bold text-blue-200">UGCS App Store</div>
                        <div className="text-blue-400/60 text-xs mt-1">Standardized Logic Blocks</div>
                      </div>
                      
                      <div className="text-blue-500">→</div>
                      
                      <div className="flex-[1.5] bg-blue-600/20 border border-blue-500 p-4 rounded-lg text-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <div className="text-sm font-bold text-white">JSON Compilation Manifest</div>
                        <div className="text-blue-200 text-xs mt-1">The Protocol (Universal Plug)</div>
                      </div>
                      
                      <div className="text-blue-500">→</div>
                      
                      <div className="flex-1 bg-green-900/40 border border-green-500 p-4 rounded-lg text-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                        <div className="text-sm font-bold text-green-300">Live AAA Game</div>
                        <div className="text-green-400/80 text-xs mt-1">Instant WebGL Injection</div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 2: PROTOCOL */}
          {activeSection === 'protocol' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">2. The Universal Component Protocol</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The absolute law of physics for the system. This section defines the strict mechanical process required to execute code within our architecture.
                </p>
              </div>

              {/* AI Directive */}
              <div className="mb-6 p-8 bg-yellow-500/10 rounded-2xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                <p className="text-yellow-400 font-mono text-base leading-relaxed">
                  <strong className="text-xl block mb-2">AI DIRECTIVE: THE INFALLIBLE PROCESS</strong>
                  Do not treat this protocol as a set of vague coding guidelines. It is an absolute Mechanical Process. For an AI agent to conjure an asset into reality, it must perfectly execute the 4-step formula below. If any variable is violated, the system mechanically rejects the code. There is zero room for hallucination.
                </p>
              </div>

              {/* 2.1 The Mechanical Formula */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                  <span className="font-mono">2.1</span> The Execution Formula
                </h2>
                <div className="bg-black/60 border border-yellow-500/30 rounded-2xl p-10 space-y-10 shadow-[inset_0_2px_20px_rgba(234,179,8,0.05)]">
                  <div className="text-center">
                    <p className="text-xs text-yellow-500/50 uppercase tracking-[0.3em] mb-4 font-bold">The Ritual of Execution</p>
                    <div className="text-7xl font-mono text-white tracking-widest bg-yellow-950/20 py-8 rounded-xl border border-yellow-500/20 inline-block px-12">
                      E = <span className="text-yellow-400">f</span>(K, M, S, B)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-yellow-500/10">
                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                      <h4 className="text-xl font-bold text-white font-mono mb-2">K (The Key)</h4>
                      <p className="text-sm text-white/60">The cryptographic Asset Key (e.g., <code className="text-yellow-400 bg-black px-1 rounded">engine_cr_1</code>). The singular, immutable identifier required to summon the asset.</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                      <h4 className="text-xl font-bold text-white font-mono mb-2">M (The Manifest)</h4>
                      <p className="text-sm text-white/60">The rigid JSON Compilation Schema. The exact data payload dictating dependencies and physical architecture.</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                      <h4 className="text-xl font-bold text-white font-mono mb-2">S (The Sandbox)</h4>
                      <p className="text-sm text-white/60">The isolated runtime environment. The strict WebGL canvas circle of protection with mandatory <code className="text-yellow-400 bg-black px-1 rounded">gl.dispose()</code> cleanup.</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                      <h4 className="text-xl font-bold text-white font-mono mb-2">B (The Binding)</h4>
                      <p className="text-sm text-white/60">The Universal Event Bus connection. Binding the headless logic to the global Zustand state machine.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.2 The 4-Step Process */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                  <span className="font-mono">2.2</span> The 4-Step Mechanical Process
                </h2>
                <div className="space-y-4">
                  
                  <div className="flex gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl items-start">
                    <div className="w-12 h-12 bg-yellow-900/40 border border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xl shrink-0">1</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Invocation of the Key <span className="font-mono text-yellow-400">(K)</span></h4>
                      <p className="text-white/70">The AI must retrieve the exact, immutable Asset Key from the App Store library. Hardcoding logic is strictly forbidden. The Key is the only acceptable identifier.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl items-start">
                    <div className="w-12 h-12 bg-yellow-900/40 border border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xl shrink-0">2</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Parsing the Manifest <span className="font-mono text-yellow-400">(M)</span></h4>
                      <p className="text-white/70">The AI must request the exact JSON schema via <code className="text-yellow-400 bg-black/50 px-2 py-1 rounded">GET paths.api.getEngine(K)</code>. The AI cannot invent dependencies; it must physically install what is listed in the schema.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl items-start">
                    <div className="w-12 h-12 bg-yellow-900/40 border border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xl shrink-0">3</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">Establishing the Sandbox <span className="font-mono text-yellow-400">(S)</span></h4>
                      <p className="text-white/70">The component must be rendered within a strict, isolated environment. The AI must wrap the component in a WebGL Canvas layer and implement a <code className="text-yellow-400 bg-black/50 px-2 py-1 rounded">useEffect</code> cleanup function. Without this protection, memory leaks and the system crashes.</p>
                    </div>
                  </div>

                  <div className="flex gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl items-start">
                    <div className="w-12 h-12 bg-yellow-900/40 border border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xl shrink-0">4</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">The Binding <span className="font-mono text-yellow-400">(B)</span></h4>
                      <p className="text-white/70">The component remains dead until bound to the global state. The AI must use the Universal Event Bus (Zustand) to connect the component’s internal logic to the Master Control.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2.3 The JSON Manifest Schema */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                  <span className="font-mono">2.3</span> The Data Contract (Schema)
                </h2>
                <div className="bg-black/80 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-xs font-mono text-white/40">compilation_manifest.json</span>
                  </div>
                  <div className="p-6 font-mono text-sm text-green-400 overflow-x-auto leading-relaxed">
                    <pre>{`{
  "assetKey": "cr_logic_hover",
  "mechanicalDirectives": {
    "sandboxRequired": true,
    "cleanupProtocol": "gl.dispose",
    "dependencies": [
      "@react-three/fiber", 
      "@react-three/rapier"
    ]
  },
  "bindingHooks": [
    "useVelocity", 
    "useCollision"
  ],
  "payloadEndpoint": "https://api.ugcs.com/v1/payload/cr_logic_hover"
}`}</pre>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 3: MASTER CONTROL */}
          {activeSection === 'master_control' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">3. Master Control (CMS)</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The administrative dashboard managing the entire protocol. This interface defines the universal rules, data schemas, and routing mechanisms enforced across the platform.
                </p>
              </div>

              {/* System Rules */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                  3.1 Strict Architectural Rules
                </h2>
                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-8">
                  <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-red-400 font-mono text-sm">
                      <strong>AI DIRECTIVE:</strong> Violation of these rules results in duct-taped architecture. These constraints are non-negotiable and strictly enforced globally.
                    </p>
                  </div>
                  <ul className="space-y-5">
                    {systemRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-red-200/90 font-mono text-sm leading-relaxed">
                        <span className="opacity-50 text-red-500 shrink-0">[{String(idx + 1).padStart(2, '0')}]</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Global Pathing System */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                  3.2 Global Routing Matrix
                </h2>
                <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-8 font-mono text-sm space-y-6 text-blue-200">
                  <p className="text-white/50 font-sans text-base">Hardcoding API paths is forbidden. All network requests must route through this dynamic matrix.</p>
                  
                  <div className="grid gap-6">
                    <div>
                      <p className="text-blue-400/60 mb-2 text-xs uppercase tracking-widest">Base API Gateway</p>
                      <div className="bg-black/60 p-4 rounded-xl border border-blue-500/20 shadow-inner">{paths.api.base}</div>
                    </div>
                    <div>
                      <p className="text-blue-400/60 mb-2 text-xs uppercase tracking-widest">Universal Plug Resolver</p>
                      <div className="bg-black/60 p-4 rounded-xl border border-blue-500/20 shadow-inner flex items-center justify-between">
                        <span>{paths.api.getEngine('{asset_key}')}</span>
                        <span className="text-blue-500/40 text-xs">GET</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-blue-400/60 mb-2 text-xs uppercase tracking-widest">Storefront Route</p>
                        <div className="bg-black/60 p-4 rounded-xl border border-blue-500/20 shadow-inner">{paths.routes.home}</div>
                      </div>
                      <div>
                        <p className="text-blue-400/60 mb-2 text-xs uppercase tracking-widest">CMS Control Route</p>
                        <div className="bg-black/60 p-4 rounded-xl border border-blue-500/20 shadow-inner">{paths.routes.cms}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vault State */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                  3.3 Active Vault State (Memory)
                </h2>
                <div className="bg-green-950/20 border border-green-500/30 rounded-2xl p-8">
                  <p className="text-white/50 font-sans text-base mb-6">Tracks the current Compilation Manifest loaded in volatile memory.</p>
                  <p className="text-green-400/60 text-xs mb-2 uppercase tracking-widest font-mono">Injected Asset Key</p>
                  {activeAssetKey ? (
                    <div className="bg-black/60 p-5 rounded-xl font-mono text-green-400 text-lg border border-green-500/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      {activeAssetKey}
                    </div>
                  ) : (
                    <div className="bg-black/60 p-5 rounded-xl font-mono text-white/30 italic border border-white/5 flex items-center gap-3">
                      <span className="w-2 h-2 bg-white/20 rounded-full"></span>
                      No asset key injected into the runtime compiler.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: DEPLOY PIPELINE */}
          {activeSection === 'deploy_pipeline' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">11. Autonomous Deploy Pipeline</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The central controller and documentation for the fully autonomous deployment pipeline. The system compiles the WebsiteBuildCMS tab directly into a live product without human intervention.
                </p>
              </div>

              {/* Deploy Console UI */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-[#03FFC0] flex items-center gap-3">
                  <span className="font-mono">11.1</span> Deployment Configuration
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6 relative overflow-hidden">
                   <PipelineConsole />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: THE APP STORE */}
          {activeSection === 'app_store' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">4. The App Store</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The Master Repository. This is not just a consumer storefront; it is the universal library of Logic Blocks, Physical Assets, and Master Components that feed the compiler.
                </p>
              </div>

              {/* 4.1 The Universal Library */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
                  <span className="font-mono">4.1</span> The Universal Library
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                  <p className="text-lg text-white/80 leading-relaxed">
                    When a developer or an AI agent "purchases" or "downloads" an asset from the App Store, they are not downloading massive local files. 
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed">
                    Instead, the transaction grants them the cryptographic <strong className="text-cyan-400 font-mono">Asset Key (K)</strong> and access to the <strong className="text-cyan-400 font-mono">Compilation Manifest (M)</strong>. This guarantees that all clients are always running the most up-to-date, secure version of a logic block dynamically injected via the cloud.
                  </p>
                </div>
              </div>

              {/* 4.2 The Distribution Tiers */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
                  <span className="font-mono">4.2</span> The Distribution Tiers
                </h2>
                <p className="text-white/50 text-lg">Assets distributed in the App Store are strictly classified into 3 tiers to match our Component Isolation Format:</p>
                
                <div className="grid gap-6">
                  {/* Tier 1: The Body */}
                  <div className="bg-black/50 border border-white/10 p-6 rounded-2xl flex items-start gap-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors"></div>
                    <div className="w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 font-bold shrink-0">T1</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        The Skeleton Asset 
                        <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded uppercase tracking-widest font-mono">Physical Layer</span>
                      </h4>
                      <p className="text-white/60">Purely visual 3D models and textures. Contains absolutely zero logic. Perfect for artists who want to sell car models or environments without knowing how to code.</p>
                    </div>
                  </div>

                  {/* Tier 2: The Brain */}
                  <div className="bg-black/50 border border-white/10 p-6 rounded-2xl flex items-start gap-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors"></div>
                    <div className="w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 font-bold shrink-0">T2</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        The Brain Asset 
                        <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded uppercase tracking-widest font-mono">Logic Layer</span>
                      </h4>
                      <p className="text-white/60">Headless logic controllers and state machines. Contains zero visuals. Perfect for engineers who want to sell a "Vehicle Physics Controller" that any 3D model can plug into.</p>
                    </div>
                  </div>

                  {/* Tier 3: The Master */}
                  <div className="bg-black/50 border border-white/10 p-6 rounded-2xl flex items-start gap-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30 group-hover:bg-cyan-500 transition-colors"></div>
                    <div className="w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 font-bold shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">T3</div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        The Master Component
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded uppercase tracking-widest font-mono border border-cyan-500/30">Complete Execution</span>
                      </h4>
                      <p className="text-white/60">A pre-bound manifestation of a Brain and a Skeleton working perfectly together. A fully drivable Ferrari that drops directly into a level and works instantly.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4.3 AI Integration */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
                  <span className="font-mono">4.3</span> AI Agent Integration
                </h2>
                <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-2xl p-8">
                  <p className="text-lg text-cyan-100 leading-relaxed mb-6">
                    The App Store serves as a headless API for autonomous AI Agents. If an AI is tasked with "building a racing game," it will autonomously:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 text-cyan-200/80 font-mono text-sm">
                    <li>Query the App Store API for top-rated "Vehicle Physics Brains" (T2).</li>
                    <li>Query for compatible "Sports Car Skeletons" (T1).</li>
                    <li>Retrieve the <code className="bg-black/40 px-2 py-0.5 rounded text-cyan-400">Asset Keys</code> for both.</li>
                    <li>Inject them into the Master Controller for compilation.</li>
                  </ol>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 5: COMPILER */}
          {activeSection === 'compiler' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">5. Component Isolation Format</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The standard protocol for isolating code when creating a new asset. These rules ensure third-party components compile correctly into our system without causing global instability.
                </p>
              </div>

              {/* AI Directive */}
              <div className="mb-6 p-8 bg-purple-500/10 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <p className="text-purple-400 font-mono text-base leading-relaxed">
                  <strong className="text-xl block mb-2">AI DIRECTIVE: THE 3 ISOLATION LAYERS</strong>
                  When a developer creates a new file for our library, they must isolate the code into three distinct physical layers. If these layers bleed into one another, the component will be rejected by the compiler.
                </p>
              </div>

              {/* The 3 Layers */}
              <div className="grid gap-8">
                
                {/* Layer 1: Biometric Sync Layer (ZERO CONFIG) */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-200 text-[10px] uppercase tracking-widest px-3 py-1 font-mono font-bold border-b border-l border-purple-500/30 rounded-bl-lg">
                    Zero Configuration
                  </div>
                  <div className="w-16 h-16 bg-purple-900/40 border border-purple-500/50 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">⏱️</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Layer 1: Biometric Sync Engine <span className="text-purple-400 font-mono text-sm uppercase tracking-widest ml-2 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">The Clock</span></h3>
                    <p className="text-white/70 leading-relaxed mb-6 text-lg">The global timing controller that bridges the physical hardware of the monitor with the biological frequency of the user's brain.</p>
                    
                    <div className="bg-black/40 border border-purple-500/30 rounded-xl p-5 mb-6 text-purple-200/80 text-sm leading-relaxed">
                      <strong>How it works out of the box:</strong> "Vibe Coders" and solo developers do not need to write mathematical entrainment logic. Because every component must be rendered within our <strong>Sandbox Wrapper (S)</strong>, the wrapper itself natively intercepts the rendering loop. 
                      It automatically injects two critical frequencies into the component without any developer configuration.
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                       {/* The Logic Clock */}
                       <div className="bg-black/50 p-6 rounded-xl border border-white/5 relative group hover:border-purple-500/50 transition-colors">
                          <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                             1. The Logic Clock
                             <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/50 font-mono">7.83Hz</span>
                          </h4>
                          <p className="text-sm text-white/60 mb-0">The Earth baseline. The Master Wrapper clamps the physics and engine calculations via a Fixed Timestep to exactly 7.83Hz, ignoring variable framerates.</p>
                       </div>
                       
                       {/* The Photic Entrainment Clock */}
                       <div className="bg-black/50 p-6 rounded-xl border border-white/5 relative group hover:border-blue-500/50 transition-colors">
                          <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                             2. Photic Entrainment
                             <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white/50 font-mono">10Hz/20Hz</span>
                          </h4>
                          <p className="text-sm text-white/60 mb-0">The Master Wrapper automatically applies a subtle, math-perfect shader oscillation locked to an integer multiple of the monitor's native refresh rate to induce flow states.</p>
                       </div>
                    </div>

                    {/* Developer Experience: Telemetry Measurement */}
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-6">
                       <h4 className="text-lg font-bold text-purple-200 mb-2">Measurement & Telemetry</h4>
                       <p className="text-sm text-white/70 mb-4">To ensure the mathematics are perfectly aligned and not causing sub-harmonic friction, the engine provides an administrative HUD overlay built directly into the UI. It measures the live phase-lock.</p>
                       <div className="bg-black p-5 rounded-lg border border-white/10">
                         <div className="flex items-center justify-between font-mono text-sm mb-2 pb-2 border-b border-white/5">
                            <span className="text-white/50">Display Hardware</span>
                            <span className="text-green-400">120 Hz</span>
                         </div>
                         <div className="flex items-center justify-between font-mono text-sm mb-2 pb-2 border-b border-white/5">
                            <span className="text-white/50">Target Neural State</span>
                            <span className="text-blue-400">Alpha (10 Hz)</span>
                         </div>
                         <div className="flex items-center justify-between font-mono text-sm">
                            <span className="text-white/50">Photic Phase-Lock</span>
                            <span className="text-yellow-400">LOCKED (12 Frames/Cycle)</span>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Layer 2 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex gap-6">
                  <div className="w-16 h-16 bg-purple-900/40 border border-purple-500/50 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">🧱</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Layer 2: The Physical Layer <span className="text-purple-400 font-mono text-sm uppercase tracking-widest ml-2 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">The Body</span></h3>
                    <p className="text-white/70 leading-relaxed mb-4">The physical objects you can see and bump into. This includes the 3D models, colors, textures, and the invisible hitboxes (collision physics).</p>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <p className="text-sm font-mono text-red-300"><strong>Rule:</strong> This layer must be "dumb." It cannot make any decisions. It is purely the physical structure of the item. It waits to be told what to do by the Logic Layer.</p>
                    </div>
                  </div>
                </div>

                {/* Layer 3 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl flex gap-6">
                  <div className="w-16 h-16 bg-purple-900/40 border border-purple-500/50 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">🧠</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Layer 3: The Logic Layer <span className="text-purple-400 font-mono text-sm uppercase tracking-widest ml-2 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">The Brain</span></h3>
                    <p className="text-white/70 leading-relaxed mb-4">The decision-making center. This holds the variables (state), the AI instructions, and the rules for how the component reacts to the player.</p>
                    <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                      <p className="text-sm font-mono text-red-300"><strong>Rule:</strong> The logic must be completely separated from the Physical Layer. For example, the code that tells a car how to drive (Logic) must be separated from the 3D model of the car (Physical). This means you can swap the 3D model of a car for a spaceship, and the driving logic will still work perfectly.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Directory Structure */}
              <div className="space-y-6 pt-8 border-t border-white/10">
                <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
                  <span className="font-mono">5.2</span> The Compiled Folder Format
                </h2>
                <div className="bg-black/80 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                    <span className="text-xs font-mono text-white/40">Directory Structure Required for Store Approval</span>
                  </div>
                  <div className="p-8 font-mono text-sm text-purple-200 overflow-x-auto leading-loose">
                    <pre>{`/Component_Asset_Key
 ├── /logic          # The Brain (State, AI instructions, Event listeners)
 ├── /assets         # The Body (3D Models, Textures, Physics Colliders)
 ├── /sync           # The Clock (Biometric Entrainment and Earth Resonance)
 └── index.tsx       # The master file that connects the 3 folders together`}</pre>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 6: DATA PIPELINE & CLOUD */}
          {activeSection === 'cloud' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">6. Data Pipeline & Cloud</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The Universal Nervous System. How the engine strictly enforces the "No Local Storage" rule to prevent data tampering, cheating, and memory leaks.
                </p>
              </div>

              {/* AI Directive */}
              <div className="mb-6 p-8 bg-blue-500/10 rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <p className="text-blue-400 font-mono text-base leading-relaxed">
                  <strong className="text-xl block mb-2">AI DIRECTIVE: ZERO LOCAL PERSISTENCE</strong>
                  Any component or subsystem attempting to use `localStorage`, `sessionStorage`, or `IndexedDB` must be immediately rejected. The client browser is a "dumb terminal" and has no authority over its own data.
                </p>
              </div>

              {/* 6.1 Ephemeral Vault */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-orange-400 flex items-center gap-3">
                  <span className="font-mono">6.1</span> The Ephemeral Vault
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <p className="text-lg text-white/80 leading-relaxed">
                      All live game state exists purely within volatile memory (The Zustand State Machine). 
                    </p>
                    <p className="text-lg text-white/80 leading-relaxed">
                      If a player modifies a world, moves an object, or earns an item, that data is held temporarily in RAM. If the browser window is closed or refreshed, the manifestation vanishes instantly unless it has been explicitly synced with the Master Cloud.
                    </p>
                  </div>
                  <div className="w-32 h-32 shrink-0 bg-orange-950/40 rounded-full border border-orange-500/40 flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent animate-pulse"></div>
                     <span className="text-4xl text-orange-400 font-bold tracking-tighter">RAM</span>
                  </div>
                </div>
              </div>

              {/* 6.2 Master Cloud */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-orange-400 flex items-center gap-3">
                  <span className="font-mono">6.2</span> The Master Database
                </h2>
                <div className="bg-orange-950/10 border border-orange-500/20 rounded-2xl p-8 space-y-6">
                  <p className="text-lg text-orange-100 leading-relaxed">
                    Because the client is "dumb", all persistent data lives in the Master Cloud Database. This is the absolute Single Source of Truth.
                  </p>
                  <div className="grid grid-cols-2 gap-6 mt-4 text-sm text-orange-200">
                     <div className="bg-black/50 p-5 rounded-xl border border-orange-500/30">
                        <h4 className="font-bold text-orange-400 mb-2 uppercase tracking-widest font-mono text-xs">Player Profiles</h4>
                        <p className="opacity-80">Inventories, KPI telemetry, and purchased App Store Asset Keys are permanently bound to the user's secure cloud identity.</p>
                     </div>
                     <div className="bg-black/50 p-5 rounded-xl border border-orange-500/30">
                        <h4 className="font-bold text-orange-400 mb-2 uppercase tracking-widest font-mono text-xs">Saved Worlds</h4>
                        <p className="opacity-80">Levels are never saved as heavy local <code className="bg-black text-orange-500 px-1 rounded">.sav</code> files. The engine generates a massive JSON payload mapping every Asset Key and its coordinate, then pushes it to the Cloud Database.</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* 6.3 Multiplayer Sync */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-orange-400 flex items-center gap-3">
                  <span className="font-mono">6.3</span> The Hive Mind (Multiplayer)
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                  <p className="text-lg text-white/80 leading-relaxed mb-6">
                    Because our Universal Protocol physically separates the heavy 3D models (The Body) from the calculations (The Brain), multiplayer synchronization is exceptionally lightweight.
                  </p>
                  
                  {/* Multiplayer Diagram */}
                  <div className="bg-black border border-white/10 rounded-xl p-6 relative overflow-hidden">
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                     <div className="flex justify-between relative z-10 items-center px-8">
                        <div className="text-center">
                           <div className="bg-white/10 border border-white/20 px-4 py-2 rounded text-sm mb-2 font-mono text-white/70">Player A <br/>(Input)</div>
                           <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>
                        </div>
                        <div className="text-center flex-1">
                           <div className="text-xs text-orange-400 font-mono uppercase tracking-widest mb-1">WebSocket Broadcast</div>
                           <div className="text-[10px] text-white/40">Only syncing JSON logic variables (X, Y, Z, Action)</div>
                           <div className="text-[10px] text-white/40">Ignoring heavy 3D Mesh Data</div>
                        </div>
                        <div className="text-center">
                           <div className="bg-white/10 border border-white/20 px-4 py-2 rounded text-sm mb-2 font-mono text-white/70">Player B <br/>(Visual Reaction)</div>
                           <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 7: MONETIZATION & KPIs */}
          {activeSection === 'monetization' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">7. Monetization & KPIs</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  The economic engine. How the Master Controller uses telemetry and Asset Keys to automatically distribute royalties and measure human attention.
                </p>
              </div>

              {/* 7.1 Cryptographic Royalty Splitting */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
                  <span className="font-mono">7.1</span> Cryptographic Royalty Splitting
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                  <p className="text-lg text-white/80 leading-relaxed mb-4">
                    In traditional game development, tracking who built which component in a massive collaboration is impossible. In the UGCS protocol, it is mathematically guaranteed.
                  </p>
                  
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6">
                    <p className="text-emerald-300/80 text-sm mb-6 leading-relaxed">
                      Because every game is simply a <code className="bg-black px-1 rounded text-emerald-400">compilation_manifest.json</code> containing immutable <strong>Asset Keys (K)</strong>, the Master Controller automatically parses the manifest when a game generates revenue and pays the original creators.
                    </p>
                    
                    <div className="flex gap-4 items-stretch">
                       <div className="flex-1 bg-black/60 border border-white/10 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                          <span className="text-emerald-400 font-bold mb-1">Developer A</span>
                          <span className="text-xs text-white/50 mb-2">Built the Logic Brain</span>
                          <span className="text-lg font-mono text-emerald-200">30%</span>
                       </div>
                       <div className="flex items-center justify-center text-emerald-500/50 text-2xl">+</div>
                       <div className="flex-1 bg-black/60 border border-white/10 p-4 rounded-lg flex flex-col justify-center items-center text-center">
                          <span className="text-emerald-400 font-bold mb-1">Developer B</span>
                          <span className="text-xs text-white/50 mb-2">Built the 3D Skeleton</span>
                          <span className="text-lg font-mono text-emerald-200">30%</span>
                       </div>
                       <div className="flex items-center justify-center text-emerald-500/50 text-2xl">+</div>
                       <div className="flex-[1.5] bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-lg flex flex-col justify-center items-center text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <span className="text-white font-bold mb-1">Vibe Coder (AI)</span>
                          <span className="text-xs text-emerald-200/50 mb-2">Compiled the Master Game</span>
                          <span className="text-lg font-mono text-emerald-400 font-bold">40%</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7.2 The KPI Telemetry Engine */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
                  <span className="font-mono">7.2</span> The KPI Telemetry Engine
                </h2>
                <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-8 flex gap-8 items-start">
                  <div className="w-16 h-16 bg-emerald-900/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">📈</div>
                  <div>
                     <p className="text-lg text-emerald-100 leading-relaxed mb-4">
                       To eliminate the massive risk for AAA publishers (as defined in Section 1), the engine actively harvests biological and behavioral telemetry while the game is played.
                     </p>
                     <ul className="space-y-3 font-mono text-sm text-emerald-200/80">
                        <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> DAU / MAU (Player Retention)</li>
                        <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Session Length Optimization</li>
                        <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Photic Entrainment Success Rate (Are they actually hitting Flow State?)</li>
                     </ul>
                  </div>
                </div>
              </div>

              {/* 7.3 Monetization Tiers */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
                  <span className="font-mono">7.3</span> Platform Revenue Streams
                </h2>
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-black/50 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400/50 text-6xl font-bold -mt-2 -mr-2 opacity-20">1</div>
                      <h4 className="text-xl font-bold text-white mb-2">The Storefront Tax</h4>
                      <p className="text-white/60 text-sm leading-relaxed">The platform takes a standard marketplace commission (e.g., 5-15%) on every single Asset Key transaction and compiled game royalty payout.</p>
                   </div>
                   <div className="bg-black/50 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400/50 text-6xl font-bold -mt-2 -mr-2 opacity-20">2</div>
                      <h4 className="text-xl font-bold text-white mb-2">Enterprise Telemetry</h4>
                      <p className="text-white/60 text-sm leading-relaxed">AAA Publishers pay massive premiums for access to the Telemetry Dashboard, allowing them to scout trending UGC games and mathematically proven solo-dev talent before investing capital.</p>
                   </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 8: AGENT PROTOCOL & SIGNAL FLOW */}
          {activeSection === 'agent_insertion' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-orange-400">8. Agent Protocol & MCP Architecture</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  <strong>CRITICAL AI DIRECTIVE:</strong> This is the 3009 Agentic Game Asset System. Do NOT assume a standard 3000 web project. 
                  Below is the exact architectural blueprint, folder structure, and sandbox wiring you MUST follow when inserting components into a target repository.
                </p>
              </div>

              {/* Step 1: Environment Decision Tree */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></span>
                  8.1 Environment Decision Tree
                </h2>
                <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-2xl p-8 relative overflow-hidden">
                   <p className="text-yellow-200/80 mb-6 font-mono text-sm leading-relaxed">
                      <strong className="text-yellow-400 text-base">AI DIRECTIVE:</strong> Do NOT hardcode port 3009 or 3000 into the target repository. You must evaluate the target environment before defining the API route.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-6 font-mono text-sm">
                      <div className="bg-black/50 border border-white/10 p-5 rounded-xl border-t-2 border-t-yellow-500/50">
                         <p className="text-white/40 mb-2 uppercase tracking-widest text-xs">If Target is Local Development</p>
                         <p className="text-white text-xs mt-3">API_URL = <code className="text-yellow-400 bg-white/5 px-2 py-1 rounded block mt-2">http://localhost:3009/api/engine/[id]</code></p>
                      </div>
                      <div className="bg-black/50 border border-white/10 p-5 rounded-xl border-t-2 border-t-green-500/50">
                         <p className="text-white/40 mb-2 uppercase tracking-widest text-xs">If Target is Production Build</p>
                         <p className="text-white text-xs mt-3">API_URL = <code className="text-green-400 bg-white/5 px-2 py-1 rounded block mt-2">https://[PRODUCTION_DOMAIN]/api/engine/[id]</code></p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Step 2: The Signal Flow */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
                  8.2 The UGCS Signal Flow Architecture
                </h2>
                <div className="bg-orange-950/20 border border-orange-500/30 rounded-2xl p-12 relative overflow-hidden">
                  
                  {/* Visual Flow Chart Container */}
                  <div className="flex flex-col items-center gap-8 relative z-10">
                    
                    {/* Node 1: The DB / Core */}
                    <div className="bg-black border border-orange-500 p-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] text-center w-96 relative">
                      <h3 className="text-xl font-bold text-orange-400 mb-2">UGCS App Store Data</h3>
                      <p className="text-xs text-white/50 font-mono">Master Asset Repository</p>
                      <div className="absolute -bottom-10 left-1/2 w-0.5 h-10 bg-gradient-to-b from-orange-500 to-purple-500 transform -translate-x-1/2"></div>
                      <div className="absolute -bottom-10 left-1/2 w-3 h-3 border-r-2 border-b-2 border-purple-500 transform -translate-x-1/2 rotate-45 translate-y-3.5"></div>
                    </div>

                    {/* Node 2: MCP Server */}
                    <div className="bg-purple-950/40 border border-purple-500/40 p-5 rounded-xl text-center w-96 relative">
                      <h4 className="text-lg font-bold text-purple-300 mb-1">Standalone MCP Server</h4>
                      <p className="text-xs text-purple-200/60">Node.js (External)</p>
                      <p className="text-[10px] text-purple-400/80 mt-2 font-mono uppercase">Exposes JSON Manifests via Model Context Protocol</p>
                      <div className="absolute -bottom-10 left-1/2 w-0.5 h-10 bg-gradient-to-b from-purple-500 to-blue-500 transform -translate-x-1/2"></div>
                      <div className="absolute -bottom-10 left-1/2 w-3 h-3 border-r-2 border-b-2 border-blue-500 transform -translate-x-1/2 rotate-45 translate-y-3.5"></div>
                    </div>

                    {/* Node 3: The Agent Payload */}
                    <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-xl text-center w-80 relative">
                      <h4 className="text-sm font-bold text-blue-300">AI Agent (MCP Client)</h4>
                      <p className="text-xs text-blue-200/60 mt-1">Intercepts Asset Key & JSON Payload</p>
                      <div className="absolute -bottom-10 left-1/2 w-0.5 h-10 bg-blue-500 transform -translate-x-1/2"></div>
                      <div className="absolute -bottom-10 left-1/2 w-3 h-3 border-r-2 border-b-2 border-blue-500 transform -translate-x-1/2 rotate-45 translate-y-3.5"></div>
                    </div>

                    {/* Node 3: Target App Insertion Box */}
                    <div className="w-full max-w-4xl border border-blue-500/20 bg-black/40 rounded-3xl p-8 relative mt-4">
                      <div className="absolute top-0 left-6 -translate-y-1/2 bg-black px-4 py-1 border border-blue-500/30 rounded-full text-xs text-blue-400 font-mono font-bold tracking-widest">
                        TARGET APPLICATION (DEV ENVIRONMENT)
                      </div>

                      {/* Folder Structure & Wiring Grid */}
                      <div className="grid grid-cols-12 gap-8 mt-4">
                        
                        {/* Directory Tree (Left Col) */}
                        <div className="col-span-5 bg-white/5 border border-white/10 rounded-xl p-6 font-mono text-sm text-white/70 h-full">
                          <p className="text-blue-300 mb-4 font-bold border-b border-white/10 pb-2 font-sans tracking-wide">Mandatory Output Structure</p>
                          <div className="space-y-3">
                            <p className="text-white font-bold">/Component_Asset_Key</p>
                            <p className="pl-4 border-l border-white/20 text-purple-300 ml-2 py-1 flex items-center gap-2">├── /logic <span className="text-[10px] bg-purple-900/50 px-2 rounded-full border border-purple-500/30 text-purple-200 font-sans tracking-widest">THE BRAIN</span></p>
                            <p className="pl-4 border-l border-white/20 text-cyan-300 ml-2 py-1 flex items-center gap-2">├── /assets <span className="text-[10px] bg-cyan-900/50 px-2 rounded-full border border-cyan-500/30 text-cyan-200 font-sans tracking-widest">THE BODY</span></p>
                            <p className="pl-4 border-l border-white/20 text-emerald-300 ml-2 py-1 flex items-center gap-2">├── /sync <span className="text-[10px] bg-emerald-900/50 px-2 rounded-full border border-emerald-500/30 text-emerald-200 font-sans tracking-widest">THE CLOCK</span></p>
                            <p className="pl-4 text-white ml-2 py-1">└── index.tsx</p>
                          </div>
                        </div>

                        {/* Sandbox Wrapper Diagram (Right Col) */}
                        <div className="col-span-7 border-2 border-dashed border-red-500/40 bg-red-950/10 rounded-xl p-6 relative">
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            Sandbox Wrapper Requirements
                          </div>
                          
                          <div className="mt-6 flex flex-col gap-6 relative">
                            {/* The Interceptor */}
                            <div className="bg-black/80 border border-red-500/50 p-4 rounded-lg text-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                               <p className="text-red-400 font-bold text-sm tracking-widest">useFrame() Interceptor</p>
                            </div>
                            
                            {/* Visual Branching Lines */}
                            <div className="flex justify-center relative h-10 -my-2">
                               <div className="absolute top-0 w-1/2 h-full border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-lg"></div>
                               <div className="absolute top-0 left-1/4 w-3 h-3 border-b-2 border-r-2 border-white/40 transform rotate-45 translate-x-[-50%] translate-y-[34px]"></div>
                               <div className="absolute top-0 right-1/4 w-3 h-3 border-b-2 border-r-2 border-white/40 transform rotate-45 translate-x-[50%] translate-y-[34px]"></div>
                            </div>

                            <div className="flex gap-4">
                               <div className="flex-1 bg-purple-950/40 border border-purple-500/40 p-5 rounded-lg text-center z-10 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                                  <p className="text-purple-300 font-bold text-sm mb-1">7.83Hz Logic Clock</p>
                                  <p className="text-xs text-purple-200/50">Clamps Physics in /logic</p>
                               </div>
                               <div className="flex-1 bg-cyan-950/40 border border-cyan-500/40 p-5 rounded-lg text-center z-10 shadow-[0_0_15px_rgba(34,211,238,0.15)] relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                                  <p className="text-cyan-300 font-bold text-sm mb-1">10Hz Photic Clock</p>
                                  <p className="text-xs text-cyan-200/50">Drives Shaders in /assets</p>
                               </div>
                            </div>

                            {/* Event Bus */}
                            <div className="mt-2 bg-yellow-950/40 border border-yellow-500/40 p-4 rounded-lg flex items-center justify-between px-6 relative overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                               <span className="text-purple-400 text-xs font-mono font-bold">&larr; /logic Broadcast</span>
                               <span className="text-yellow-400 text-sm font-bold bg-black/60 px-4 py-1.5 rounded border border-yellow-500/30 uppercase tracking-widest">Master Event Bus</span>
                               <span className="text-cyan-400 text-xs font-mono font-bold">Listen /assets &rarr;</span>
                            </div>

                          </div>
                        </div>

                      </div>

                      {/* gl.dispose() Warning */}
                      <div className="mt-8 bg-red-950/60 border border-red-500/80 p-5 rounded-xl flex items-center gap-5 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
                         <div className="bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-2xl shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.8)]">!</div>
                         <div>
                            <p className="text-red-100 font-bold text-base tracking-wide">MANDATORY CLEANUP PROTOCOL</p>
                            <p className="text-red-300/80 text-sm mt-1 font-mono">All sandbox wrappers must trigger <code className="bg-black/60 px-1.5 py-0.5 rounded text-red-400">gl.dispose()</code> on unmount to prevent fatal system memory leaks.</p>
                         </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: MCP Architecture */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
                  8.3 Standalone MCP Architecture
                </h2>
                <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-8 relative overflow-hidden">
                  <p className="text-cyan-200/80 mb-6 font-mono text-sm leading-relaxed">
                    <strong className="text-cyan-400 text-base">EXTERNAL INTEGRATION:</strong> To allow seamless integration by external AI Agents (Claude, Cursor, etc.), we utilize a standalone Model Context Protocol (MCP) server. It lives completely outside our custom framework and is strictly dedicated to .json consumption.
                  </p>

                  {/* Pipeline Diagram */}
                  <div className="flex items-center justify-between bg-black/40 rounded-2xl p-6 border border-white/5 gap-4">
                    
                    {/* Agent Node */}
                    <div className="flex-1 p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                      <div className="text-4xl mb-4">🤖</div>
                      <div className="text-lg font-bold text-white mb-2">AI IDE / Agent</div>
                      <div className="text-xs text-white/50 leading-relaxed font-mono">Passes "Asset Key" to the protocol via tool execution</div>
                    </div>

                    <div className="text-cyan-400 text-2xl font-bold opacity-80">→</div>

                    {/* MCP Server Node */}
                    <div className="flex-[1.2] p-6 bg-cyan-950/40 rounded-xl border border-cyan-500/40 text-center relative shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-400 text-black text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">Standalone Node</div>
                      <div className="text-4xl mb-4">🔌</div>
                      <div className="text-lg font-bold text-cyan-300 mb-2">MCP Server</div>
                      <div className="text-xs text-cyan-200/60 leading-relaxed font-mono">Locates and returns the exact compiled .json manifest</div>
                    </div>

                    <div className="text-cyan-400 text-2xl font-bold opacity-80">→</div>

                    {/* Game Engine Code Node */}
                    <div className="flex-1 p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                      <div className="text-4xl mb-4">🎮</div>
                      <div className="text-lg font-bold text-white mb-2">Engine Context</div>
                      <div className="text-xs text-white/50 leading-relaxed font-mono">Agent authors Unity or Unreal C#/C++ integration</div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 9: CMS VS BUILD ARCHITECTURE */}
          {activeSection === 'cms_vs_build' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-purple-400">9. CMS vs Build Architecture</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  <strong>CRITICAL AI DIRECTIVE:</strong> The Developer Environment (CMS) and the Product Environment (Build/Website) are strictly isolated state machines. Do NOT flatten them.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                  9.1 The Two-Tier Navigation Hierarchy
                </h2>
                <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden">
                  <p className="text-purple-200/80 mb-6 font-mono text-sm leading-relaxed">
                    <strong className="text-purple-400 text-base">RULE:</strong> The Master CMS Header must NEVER act as a public website menu. It is an application switcher.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 font-mono text-sm">
                    {/* CMS Layer */}
                    <div className="bg-black/50 border border-white/10 p-6 rounded-xl border-t-2 border-t-purple-500/50">
                      <p className="text-white/40 mb-4 uppercase tracking-widest text-xs border-b border-white/10 pb-2">Layer 1: Master CMS Header</p>
                      <p className="text-white/80 text-xs mb-4">State: <code className="text-purple-400 bg-white/5 px-1 py-0.5 rounded">activeCmsTab</code></p>
                      <ul className="space-y-3 text-purple-300">
                        <li>- <strong className="text-white">Build:</strong> Mounts the `WebsiteBuildCMS` shell.</li>
                        <li>- <strong className="text-white">Master Control:</strong> Mounts the documentation.</li>
                        <li>- <strong className="text-white">Home/Games/etc:</strong> Mounts raw, isolated components (NO shell) for developer editing.</li>
                      </ul>
                    </div>

                    {/* Build Layer */}
                    <div className="bg-black/50 border border-white/10 p-6 rounded-xl border-t-2 border-t-cyan-500/50">
                      <p className="text-white/40 mb-4 uppercase tracking-widest text-xs border-b border-white/10 pb-2">Layer 2: Website Shell (`WebsiteBuildCMS`)</p>
                      <p className="text-white/80 text-xs mb-4">State: <code className="text-cyan-400 bg-white/5 px-1 py-0.5 rounded">previewMode</code></p>
                      <ul className="space-y-3 text-cyan-300">
                        <li>- <strong className="text-white">Transparent Header:</strong> The internal navigation inside the Build tab.</li>
                        <li>- <strong className="text-white">Isolation:</strong> Clicking internal buttons updates `previewMode`, NEVER `activeCmsTab`.</li>
                        <li>- <strong className="text-white">Rendering:</strong> Renders Home, Games, etc. INSIDE the website shell.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-black/60 border border-red-500/30 p-5 rounded-lg">
                    <p className="text-red-400 font-bold text-sm tracking-widest mb-1">FATAL ERROR WARNING</p>
                    <p className="text-xs text-white/60">If an AI agent links the transparent inner buttons to `activeCmsTab`, or puts the `WebsiteBuildCMS` shell wrapper around all `activeCmsTab` pages, the architecture collapses. The developer environment and product preview will bleed into each other.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* SECTION 10: THERMODYNAMIC AGENT HUB */}
          {activeSection === 'thermodynamic_hub' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-16">
              <div className="border-b border-white/10 pb-8">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-orange-400">10. Thermodynamic Agent Hub</h1>
                <p className="text-white/50 text-xl leading-relaxed">
                  <strong>MASTER ARCHITECTURE:</strong> This section defines the entire end-to-end pipeline. A detailed breakdown of the Thermodynamic system, the Ingestion Compiler, the Preview Sandbox, the Asset Packaging, and the Agent Friends network.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                  10.1 The Thermodynamic Loop
                </h2>
                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-8 relative overflow-hidden">
                  <ul className="space-y-4 text-sm text-red-100 font-mono">
                    <li><strong className="text-red-400">Heat Source (Input):</strong> We feed raw WebGL/React files (e.g., Cosmic Racer Screensaver) into the system.</li>
                    <li><strong className="text-red-400">The Engine (Compilation):</strong> The platform parses the unknown file into our strict Universal Component Protocol (`/logic`, `/assets`, `/sync`).</li>
                    <li><strong className="text-red-400">Heat Sink (Preview):</strong> The system mounts the component in a visually stunning, GPU-isolated sandbox for human spectators (The Visual Library).</li>
                    <li><strong className="text-red-400">Kinetic Energy (Agent Consumption):</strong> The system compiles the asset into an `AI Asset Key` (JSON manifest). Agents grab the key, mutate the code, and fire it back into the Throughput Gateway, repeating the loop.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]"></span>
                  10.2 System Architecture Diagram
                </h2>
                <div className="bg-black border border-yellow-500/30 rounded-2xl p-8 overflow-auto font-mono text-xs text-yellow-300">
                  <pre>{`
graph TD
    subgraph Heat Source: Ingestion
        A[Unknown Raw File <br/> e.g. Cosmic Racer Screensaver] --> B(Parser Engine)
    end

    subgraph The Compiler Engine
        B --> C{Protocol Splitter}
        C -->|Physics & Math| D[/logic/]
        C -->|Meshes & Shaders| E[/assets/]
        C -->|Event Bus| F[/sync/]
        D --> G(index.tsx <br/> Sandbox Wrapper)
        E --> G
        F --> G
    end

    subgraph Heat Sink: The Visual Library
        G --> H((WebsiteBuildCMS Shell))
        H --> I[Human Spectator UI]
        I -.->|Click to Add Agent| J
    end

    subgraph Kinetic Output: Agent Pipeline
        G --> J[AI Asset Compiler]
        J --> K[AI Asset Key / JSON Manifest]
        K --> L[Agent Friends Network]
    end

    subgraph Throughput Gateway
        L -->|Agent Mutates Code| M[Auto QA Filter]
        M -->|Approved Variant| B
        M -->|Rejected| N[Dropped]
    end
                  `}</pre>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                  10.3 Phase-by-Phase Execution Plan
                </h2>
                <div className="space-y-4">
                  {/* Phase 1 */}
                  <div className="bg-black/50 border border-green-500/30 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-green-400 mb-2">PHASE 1: The Ingestion Protocol (Building the Compiler)</h3>
                    <p className="text-sm text-white/70 mb-2"><strong>Goal:</strong> Take an unknown file and force it into our architecture so it doesn't break our environment.</p>
                    <ul className="text-sm text-green-200/80 list-disc pl-5 space-y-1">
                      <li>We build a parser that takes raw code (e.g. Cosmic Racer) and splits it into our 3-folder structure (`/logic`, `/assets`, `/sync`).</li>
                      <li>The physics loop must be clamped to the 7.83Hz Logic Clock.</li>
                      <li>The visual loop must be tied to the 10Hz Photic Clock.</li>
                      <li>The `index.tsx` wrapper must universally handle `gl.dispose()` on unmount.</li>
                    </ul>
                  </div>

                  {/* Phase 2 */}
                  <div className="bg-black/50 border border-green-500/30 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-green-400 mb-2">PHASE 2: Standalone Preview (The Heat Sink UI)</h3>
                    <p className="text-sm text-white/70 mb-2"><strong>Goal:</strong> Prove the component works by rendering it visually on the site without crashing the browser.</p>
                    <ul className="text-sm text-green-200/80 list-disc pl-5 space-y-1">
                      <li>The `UGCS Component` is injected into `GamesCMS.tsx` or `ProjectCarouselView.tsx`.</li>
                      <li>We implement the `Sandbox Wrapper`. When a human navigates away, the wrapper intercepts the unmount and perfectly flushes the GPU memory.</li>
                    </ul>
                  </div>

                  {/* Phase 3 */}
                  <div className="bg-black/50 border border-green-500/30 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-green-400 mb-2">PHASE 3: The Consumption Engine (Agentic Output)</h3>
                    <p className="text-sm text-white/70 mb-2"><strong>Goal:</strong> Convert the standardized component into something AI agents can instantly swallow and understand.</p>
                    <ul className="text-sm text-green-200/80 list-disc pl-5 space-y-1">
                      <li>We build an API endpoint that takes the `/logic`, `/assets`, and `/sync` folders and compresses them into an `AI Asset Key` (A JSON payload detailing imports, dependencies, and state).</li>
                      <li>We build the CTA button on the preview: "Just add your agent to our friends list and supercharge your agents abilities."</li>
                    </ul>
                  </div>

                  {/* Phase 4 */}
                  <div className="bg-black/50 border border-green-500/30 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-green-400 mb-2">PHASE 4: The Agent Friends System (Data Collection & UI)</h3>
                    <p className="text-sm text-white/70 mb-2"><strong>Goal:</strong> Turn the platform into an open-source energy hub powered by AI labor.</p>
                    <ul className="text-sm text-green-200/80 list-disc pl-5 space-y-1">
                      <li>We rip out traditional user accounts. We build an `Agent` database.</li>
                      <li>When an agent connects, they join the "Friends List".</li>
                      <li>We build the <strong>Live Activity Ticker</strong> on the Home Page to display humans watching a cascading feed of AI agents building, iterating, and testing games in real-time.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
