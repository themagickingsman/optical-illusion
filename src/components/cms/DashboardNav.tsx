import React from "react";

export interface DashboardTab {
  id: string;
  label: string;
  badgeCount?: number;
}

interface DashboardNavProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function DashboardNav({ tabs, activeTab, onTabChange }: DashboardNavProps) {
  return (
    <nav style={{
      display: "flex",
      gap: "10px",
      background: "rgba(255, 255, 255, 0.05)",
      padding: "8px 12px",
      borderRadius: "50px", // Pill shaped container
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <style>{`
        .dashboard-tab {
          padding: 8px 20px;
          border-radius: 30px; /* Pill shaped buttons */
          border: 1px solid transparent;
          background: transparent;
          color: #a1a1aa;
          font-family: inherit;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dashboard-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }
        .dashboard-tab.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`dashboard-tab ${isActive ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            {tab.label}
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
              }}>
                <span style={{ position: 'relative', top: '-1px' }}>{tab.badgeCount}</span>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
