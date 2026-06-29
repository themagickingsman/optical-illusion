'use client';

import React, { useState, useEffect } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';

// Simulated Lithium Harvest Data (could later be fetched from the actual Harvester state)
const HARVESTED_LITHIUM_MG = 45000000; // Example: 45 kg harvested
const LITHIUM_KG_PER_KWH = 0.16; // Typically ~0.16 kg of pure Lithium per kWh for LiFePO4

export const HomeSolarBatteryFactory = () => {
    const [lithiumInventory, setLithiumInventory] = useState(0);
    const [assembliesCompleted, setAssembliesCompleted] = useState(0);
    const [isAssembling, setIsAssembling] = useState(false);
    const [activeCell, setActiveCell] = useState<number | null>(null);
    const [assemblyMessage, setAssemblyMessage] = useState<string>("SYSTEM STANDBY");
    
    // Core Specifications for a Whole-House Solar Battery (1 Day Autonomy)
    const SPECS = {
        chemistry: 'Lithium Iron Phosphate (LiFePO4)',
        capacity_kWh: 15.0,
        voltage_V: 51.2, // Standard 48V server rack/wall nominal voltage
        weight_kg: 150.0,
        lithiumRequired_kg: 15.0 * LITHIUM_KG_PER_KWH // ~2.4 kg of pure Li
    };

    const hasEnoughLithium = lithiumInventory >= (SPECS.lithiumRequired_kg * 1000 * 1000); // converting to mg

    // Simulated Loading/Connecting
    useEffect(() => {
        const timer = setTimeout(() => {
            setLithiumInventory(HARVESTED_LITHIUM_MG);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const handleAssembly = () => {
        if (!hasEnoughLithium) return;
        
        setIsAssembling(true);
        setActiveCell(0);
        setAssemblyMessage("FORMULATING LiFePO4 CATHODES...");

        // Deduct inventory immediately
        setLithiumInventory(prev => prev - (SPECS.lithiumRequired_kg * 1000 * 1000));

        let currentCell = 0;
        const cellInterval = setInterval(() => {
            currentCell++;
            if (currentCell < 16) {
                setActiveCell(currentCell);
                if (currentCell === 8) setAssemblyMessage("STRUCTURING CELL MATRIX...");
            } else {
                clearInterval(cellInterval);
                setAssemblyMessage("VERIFYING BMS LINK...");
                
                setTimeout(() => {
                    setAssembliesCompleted(prev => prev + 1);
                    setIsAssembling(false);
                    setActiveCell(null);
                    setAssemblyMessage("SYSTEM STANDBY");
                }, 1500);
            }
        }, 150); // Fast, satisfying animation
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            
            {/* Header Area */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                borderRadius: '16px',
                padding: '3rem',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Visual Flair */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '-10%', width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none'
                }} />
                
                <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>
                    Solar Battery Foundry
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '600px', margin: 0, lineHeight: 1.6 }}>
                    Operationalizing refined stable isotopes into high-density <span style={{ color: '#8b5cf6', fontWeight: 600 }}>LiFePO4</span> residential energy storage modules.
                </p>
            </div>

            {/* Main Interactive Assembly View */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '2rem'
            }}>
                
                {/* LEFT: INVENTORY & SPECS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Lithium Supply Container */}
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: '1px solid #334155'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: '#e2e8f0', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Raw Material Supply</h2>
                            <div style={{ padding: '0.25rem 0.75rem', background: '#0284c7', color: 'white', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                LIVE FEED
                            </div>
                        </div>

                        <div style={{ 
                            background: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b',
                            display: 'flex', alignItems: 'flex-end', gap: '1rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Lithium (Li) Inventory
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>
                                    {(lithiumInventory / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span style={{ fontSize: '1.25rem', color: '#64748b' }}>g</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unit Specifications */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Architecture Specs</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Chemistry</div>
                                <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '0.25rem' }}>{SPECS.chemistry}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Nominal Voltage</div>
                                <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '0.25rem' }}>{SPECS.voltage_V} V</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Capacity</div>
                                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.25rem', marginTop: '0.25rem' }}>{SPECS. capacity_kWh} kWh</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Physical Weight</div>
                                <div style={{ color: '#0f172a', fontWeight: 700, marginTop: '0.25rem' }}>{SPECS.weight_kg} kg</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Pure Li Required per Unit:</span>
                            <span style={{ fontSize: '1.1rem', color: '#15803d', fontWeight: 800 }}>{SPECS.lithiumRequired_kg} kg</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: ASSEMBLY SCHEMATIC */}
                <div style={{
                    background: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Placeholder for 3D or schematic visualization of the physical battery pack */}
                    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        
                        {/* Status Readout Above Battery */}
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '0.5rem 1.5rem',
                            background: isAssembling ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isAssembling ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '99px',
                            color: isAssembling ? '#38bdf8' : '#94a3b8',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            transition: 'all 0.3s'
                        }}>
                            {assemblyMessage}
                        </div>

                        {/* Abstract Battery Graphic */}
                        <div style={{
                            width: '200px', height: '300px', 
                            border: `2px solid ${isAssembling ? '#38bdf8' : '#334155'}`, 
                            borderRadius: '12px',
                            background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                            position: 'relative',
                            boxShadow: isAssembling ? '0 0 50px rgba(56, 189, 248, 0.15)' : '0 0 50px rgba(139, 92, 246, 0.1)',
                            transition: 'all 0.3s'
                        }}>
                             {/* Battery Cells visual (16s standard for 48V LiFePO4) */}
                             <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '60%', border: '1px solid #475569', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '4px' }}>
                                 {Array.from({ length: 16 }).map((_, i) => {
                                     const isFilled = activeCell !== null && i <= activeCell;
                                     return (
                                         <div key={i} style={{ 
                                             background: isFilled ? '#10b981' : '#38bdf8', 
                                             opacity: isFilled ? 1 : 0.2, 
                                             borderRadius: '2px',
                                             boxShadow: isFilled ? '0 0 10px #10b981' : 'none',
                                             transition: 'all 0.2s'
                                         }} />
                                     );
                                 })}
                             </div>
                             
                             {/* BMS Visual */}
                             <div style={{ 
                                 position: 'absolute', top: '20px', left: '20px', right: '20px', height: '40px', 
                                 background: '#1e293b', 
                                 border: `1px solid ${activeCell === null && !isAssembling && assembliesCompleted > 0 ? '#10b981' : '#8b5cf6'}`, 
                                 borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 boxShadow: activeCell === null && !isAssembling && assembliesCompleted > 0 ? 'inset 0 0 20px rgba(16, 185, 129, 0.2)' : 'none'
                             }}>
                                 <span style={{ 
                                     color: activeCell === null && !isAssembling && assembliesCompleted > 0 ? '#10b981' : '#8b5cf6', 
                                     fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' 
                                 }}>
                                     BMS LINKED
                                 </span>
                             </div>
                        </div>

                    </div>

                    {/* Manufacturing Control Bar */}
                    <div style={{ background: '#1e293b', padding: '1.5rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Units Manufactured</div>
                            <div style={{ fontSize: '1.5rem', color: 'white', fontWeight: 800 }}>{assembliesCompleted}</div>
                        </div>
                        
                        <button 
                            onClick={handleAssembly}
                            disabled={isAssembling || !hasEnoughLithium}
                            style={{
                                background: !hasEnoughLithium ? '#334155' : isAssembling ? '#0ea5e9' : '#3b82f6',
                                color: !hasEnoughLithium ? '#94a3b8' : 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: isAssembling || !hasEnoughLithium ? 'not-allowed' : 'pointer',
                                opacity: isAssembling ? 0.8 : 1,
                                transition: 'all 0.2s',
                                boxShadow: !isAssembling && hasEnoughLithium ? '0 4px 14px 0 rgba(59, 130, 246, 0.39)' : 'none'
                            }}
                        >
                            {!hasEnoughLithium ? 'INSUFFICIENT MATERIAL' : isAssembling ? 'BUILDING...' : 'BEGIN ASSEMBLY'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
