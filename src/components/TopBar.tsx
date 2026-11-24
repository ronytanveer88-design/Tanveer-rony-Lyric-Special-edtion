import React from 'react';
import { Clapperboard, Download, Film, Globe, Hand, Music, Package, Palette, Sparkles, Wand2 } from 'lucide-react';
import { CreativeSuiteApp, StudioTab } from '../types/studio';

interface TopBarProps {
  activeSuiteApp: CreativeSuiteApp;
  activeTab: StudioTab;
  onSelectSuiteApp: (app: CreativeSuiteApp) => void;
  onSelectTab: (tab: StudioTab) => void;
  onDownloadAllInOneHtml: () => void;
  onDownloadApkZip: () => void;
}

const SUITE_APPS: Array<{ id: CreativeSuiteApp; label: string; icon: React.ReactNode }> = [
  { id: 'cinema', label: '১ · সিনেমা AI', icon: <Clapperboard className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'intro', label: '২ · ইন্ট্রো/আউট্রো', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'translator', label: '৩ · ট্রান্সলেটর', icon: <Globe className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'lyrics', label: '৪ · লিরিক ভিডিও', icon: <Music className="w-3.5 h-3.5 shrink-0" /> },
];

const NAV_ITEMS: Array<{ id: StudioTab; label: string; shortLabel: string; icon: React.ReactNode }> = [
  { id: 'lyrics', label: 'গান ও লিরিক', shortLabel: 'গান', icon: <Music className="w-4 h-4" /> },
  { id: 'sync', label: 'ম্যানুয়াল সিঙ্ক', shortLabel: 'ম্যানুয়াল', icon: <Hand className="w-4 h-4" /> },
  { id: 'autosync', label: 'অটো সিঙ্ক', shortLabel: 'অটো সিঙ্ক', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'design', label: 'ডিজাইন', shortLabel: 'ডিজাইন', icon: <Palette className="w-4 h-4" /> },
  { id: 'export', label: 'ভিডিও', shortLabel: 'ভিডিও', icon: <Film className="w-4 h-4" /> },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSuiteApp,
  activeTab,
  onSelectSuiteApp,
  onSelectTab,
  onDownloadAllInOneHtml,
  onDownloadApkZip,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1e2438] bg-[#090b12]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="whitespace-nowrap shrink-0 text-sm sm:text-lg font-bold tracking-tight text-white">
              Tanvir&apos;s Creative Studio
            </span>
            <span className="hidden xl:inline-block text-[11px] font-medium text-[#8a97b8] whitespace-nowrap">
              All-in-One 4 Apps
            </span>
          </div>

          {activeSuiteApp === 'lyrics' && (
            <nav className="hidden lg:flex items-center gap-1 rounded-xl bg-[#111522] p-1 border border-[#1e2438]">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onDownloadApkZip}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-2.5 sm:px-3.5 py-2 text-xs font-bold text-[#090b12] transition-opacity hover:opacity-95 cursor-pointer min-h-[36px]"
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>APK ZIP ডাউনলোড</span>
            </button>
            <button
              type="button"
              onClick={onDownloadAllInOneHtml}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl border border-[#ff7a3d]/50 bg-[#181e33] px-2.5 sm:px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-[#ff7a3d] cursor-pointer min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 text-[#ffb347] shrink-0" />
              <span className="hidden sm:inline">All-in-One HTML</span>
              <span className="sm:hidden">HTML</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Creative Studio Apps"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[#111522] p-1 border border-[#1e2438]"
        >
          {SUITE_APPS.map((app) => {
            const isActive = activeSuiteApp === app.id;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => onSelectSuiteApp(app.id)}
                className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                    : 'text-[#9aa6c8] hover:text-white hover:bg-white/5'
                }`}
              >
                {app.icon}
                <span>{app.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
}> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-[#1e2438] bg-[#0d111e]/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex min-h-[54px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-semibold transition-colors cursor-pointer ${
              isActive ? 'text-[#ff7a3d]' : 'text-[#7c89ab] hover:text-[#eef1f8]'
            }`}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
};
