'use client';

import React, { useState } from 'react';
import { DASHBOARD_THEME } from './DashboardTheme';
import { HexCellArchitecture } from './HexCellArchitecture';
import { MainframeSuitcase } from './MainframeSuitcase';
import { BatterySolarIntegration } from './BatterySolarIntegration';
import { RapidDeployFramework } from './RapidDeployFramework';
import { BatterySwappingSOP } from './BatterySwappingSOP';
import AcousticLabBuild from './AcousticLabBuild';

type Tab =
    | 'HEX_CELL'
    | 'MAINFRAME'
    | 'FRACTAL_AMPLIFICATION'
    | 'RAPID_DEPLOY'
    | 'AEROSPACE_SOP'
    | 'ACOUSTIC_LAB';

export const PhysicalEnergyPanel = () => {
    const [activeTab, setActiveTab] = useState<Tab>('HEX_CELL');

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* HER0 / INTRO */}
            <div style={{
                background: `linear-gradient(135deg, ${DASHBOARD_THEME.colors.background} 0%, #ffffff 100%)`,
                color: DASHBOARD_THEME.colors.text.primary,
                padding: '3rem',
                borderRadius: '24px',
                marginBottom: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{ background: DASHBOARD_THEME.colors.accents.cyan.base, color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                            SYSTEM BLUEPRINT & ASSEMBLY
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.1em' }}>
                            ACTIVE: PHYSICAL ENERGY SYSTEM
                        </span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: DASHBOARD_THEME.colors.text.primary }}>
                        Modular Solid-State Micro-Grid
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: DASHBOARD_THEME.colors.text.secondary, lineHeight: 1.8, maxWidth: '800px' }}>
                        Ultra high-density, hot-swappable solid-state battery architecture designed for fractal solar integration and austere rapid deployment.
                    </p>
                </div>
            </div>

            {/* TAB SYSTEM */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: `1px solid ${DASHBOARD_THEME.colors.glass.border}`, paddingBottom: '1rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('HEX_CELL')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'HEX_CELL' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'HEX_CELL' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    1. HEX-CELL ARCHITECTURE
                </button>
                <button
                    onClick={() => setActiveTab('ACOUSTIC_LAB')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'ACOUSTIC_LAB' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'ACOUSTIC_LAB' ? DASHBOARD_THEME.colors.accents.amber.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    2. $50K ACOUSTIC LAB
                </button>
                <button
                    onClick={() => setActiveTab('MAINFRAME')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'MAINFRAME' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'MAINFRAME' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    3. THE MAINFRAME
                </button>
                <button
                    onClick={() => setActiveTab('FRACTAL_AMPLIFICATION')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'FRACTAL_AMPLIFICATION' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'FRACTAL_AMPLIFICATION' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    4. FRACTAL AMPLIFICATION
                </button>
                <button
                    onClick={() => setActiveTab('RAPID_DEPLOY')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'RAPID_DEPLOY' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'RAPID_DEPLOY' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    5. RAPID DEPLOYMENT ARRAY
                </button>
                <button
                    onClick={() => setActiveTab('AEROSPACE_SOP')}
                    style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: activeTab === 'AEROSPACE_SOP' ? DASHBOARD_THEME.colors.text.primary : DASHBOARD_THEME.colors.text.muted,
                        background: activeTab === 'AEROSPACE_SOP' ? DASHBOARD_THEME.colors.accents.cyan.base : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                    }}
                >
                    6. AEROSPACE / SOP PROTOCOL
                </button>
            </div>

            {/* TAB CONTENT */}
            <div>
                {activeTab === 'HEX_CELL' && <HexCellArchitecture />}
                {activeTab === 'ACOUSTIC_LAB' && <AcousticLabBuild />}
                {activeTab === 'MAINFRAME' && <MainframeSuitcase />}
                {activeTab === 'FRACTAL_AMPLIFICATION' && <BatterySolarIntegration />}
                {activeTab === 'RAPID_DEPLOY' && <RapidDeployFramework />}
                {activeTab === 'AEROSPACE_SOP' && <BatterySwappingSOP />}
            </div>
        </div>
    );
};
