import React from 'react';
import { Download, Film, Music, Palette, Timer } from 'lucide-react';
import { StudioTab } from '../types/studio';

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onDownloadHtml: () => void;
}

const NAV_ITEMS: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
  { id: 'lyrics', label: 'গান ও লিরিক', icon: <Music className="w-4 h-4" /> },
  { id: 'sync', label: 'সিঙ্ক', icon: <Timer className="w-4 h-4" /> },
  { id: 'design', label: 'ডিজাইন', icon: <Palette className="w-4 h-4" /> },
  { id: 'export', label: 'ভিডিও', icon: <Film className="w-4 h-4" /> },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onDownloadHtml,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1e2438] bg-[#090b12]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        <span className="whitespace-nowrap shrink-0 text-lg font-bold tracking-tight text-white">
          লিরিক স্টুডিও
        </span>

        <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-[#111522] p-1 border border-[#1e2438]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#ff7a3d] text-[#090b12]'
                    : 'text-[#9aa6c8] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onDownloadHtml}
          className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-[#2a3352] bg-[#161c30] px-4 py-2 text-xs font-semibold text-[#eef1f8] transition-colors hover:border-[#ff7a3d]/60 hover:text-white cursor-pointer min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5 text-[#ff7a3d]" />
          <span>ফিক্সড HTML ডাউনলোড</span>
        </button>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
}> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-[#1e2438] bg-[#0d111e]/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
              isActive ? 'text-[#ff7a3d]' : 'text-[#7c89ab] hover:text-[#eef1f8]'
            }`}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
