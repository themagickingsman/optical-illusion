import React from 'react';
import { Search, Compass, Gamepad2, PenTool, Briefcase, PlayCircle, Wrench, LayoutGrid, DownloadCloud } from 'lucide-react';
import type { AppStoreTab } from '@/hooks/useAppStoreLogic';

interface SidebarProps {
  activeTab: AppStoreTab;
  setActiveTab: (tab: AppStoreTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function AppStoreSidebar({ activeTab, setActiveTab, searchQuery, setSearchQuery }: SidebarProps) {
  const navItems: { id: AppStoreTab, label: string, icon: React.ReactNode }[] = [
    { id: 'Discover', label: 'Discover', icon: <Compass size={18} /> },
    { id: 'Arcade', label: 'Arcade', icon: <Gamepad2 size={18} /> },
    { id: 'Create', label: 'Create', icon: <PenTool size={18} /> },
    { id: 'Work', label: 'Work', icon: <Briefcase size={18} /> },
    { id: 'Play', label: 'Play', icon: <PlayCircle size={18} /> },
    { id: 'Develop', label: 'Develop', icon: <Wrench size={18} /> },
    { id: 'Categories', label: 'Categories', icon: <LayoutGrid size={18} /> },
    { id: 'Updates', label: 'Updates', icon: <DownloadCloud size={18} /> },
  ];

  return (
    <div className="w-[260px] h-full bg-[#f5f5f7] border-r border-[#e5e5e5] flex flex-col pointer-events-auto">
      {/* Search Bar */}
      <div className="p-4 pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#e3e3e5] rounded-md py-1.5 pl-9 pr-4 text-[13px] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[14px] transition-colors ${
                isActive 
                  ? 'bg-[#e3e3e5] text-black font-medium' 
                  : 'text-gray-700 hover:bg-[#ebebeb]'
              }`}
            >
              <div className={isActive ? 'text-blue-500' : 'text-gray-500'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Profile Area */}
      <div className="p-4 border-t border-[#e5e5e5] flex items-center gap-3 cursor-pointer hover:bg-[#ebebeb] transition-colors">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-xs">
          AB
        </div>
        <span className="text-[13px] font-medium text-gray-800">Alfonzo Burton</span>
      </div>
    </div>
  );
}
