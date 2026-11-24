import React, { useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Keyboard,
  PauseCircle,
  Undo2,
  Wand2,
} from 'lucide-react';
import { formatTime } from '../utils/storage';

interface SyncTabProps {
  lyrics: string[];
  times: Array<number | null>;
  selectedIdx: number;
  activePlayIdx: number;
  hasAudio: boolean;
  canUndo: boolean;
  syncMessage: string;
  onSelectLine: (idx: number) => void;
  onJumpToLine: (idx: number) => void;
  onMarkLine: () => void;
  onInsertGap: () => void;
  onAdjustTime: (delta: number) => void;
  onUndo: () => void;
  onOpenAutoSync: () => void;
}

export const SyncTab: React.FC<SyncTabProps> = ({
  lyrics,
  times,
  selectedIdx,
  activePlayIdx,
  hasAudio,
  canUndo,
  syncMessage,
  onSelectLine,
  onJumpToLine,
  onMarkLine,
  onInsertGap,
  onAdjustTime,
  onUndo,
  onOpenAutoSync,
}) => {
  const syncListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = syncListRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-sync-idx="${selectedIdx}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedIdx]);

  const currentTargetLine = lyrics[selectedIdx] ?? '';
  const syncedCount = times.filter((t) => t !== null).length;

  return (
    <div className="space-y-3">
      {/* Focused One-Thumb Manual Tap Sync Deck */}
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold text-white">
            ম্যানুয়াল ট্যাপ সিঙ্ক
            <span className="ml-2 font-mono-nums font-normal text-[#8a97b8]">
              ({syncedCount}/{lyrics.length})
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAutoSync}
            className="inline-flex items-center gap-1 rounded-lg border border-[#283152] bg-[#161c30] px-2.5 py-1 text-[11px] font-semibold text-[#ffb347] hover:border-[#ff7a3d] cursor-pointer whitespace-nowrap"
          >
            <Wand2 className="w-3 h-3 shrink-0" />
            <span>অটো সিঙ্ক ও বাল্ক →</span>
          </button>
        </div>

        {/* Target Line Cue Card with 1-tap Up/Down */}
        <div className="flex items-center gap-2 rounded-xl border border-[#ff7a3d]/35 bg-[#0a0d18] p-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] text-[#8a97b8] mb-0.5">
              <span>
                এখন ট্যাপের লাইন{' '}
                <strong className="font-mono-nums text-[#ffb347]">#{selectedIdx + 1}</strong>
              </span>
              <span className="font-mono-nums">
                {times[selectedIdx] !== null ? formatTime(times[selectedIdx]!) : 'সিংক বাকি'}
              </span>
            </div>
            <div className="truncate text-sm sm:text-base font-bold text-[#ffb347]">
              {lyrics.length === 0
                ? 'আগে গান ও লিরিক ট্যাবে লিরিক লিখুন'
                : currentTargetLine === '♪'
                ? '♪ (বিরতি / Instrumental)'
                : currentTargetLine || 'সব লাইন মার্ক হয়েছে'}
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectLine(Math.max(0, selectedIdx - 1))}
              disabled={selectedIdx <= 0}
              aria-label="আগের লাইন"
              className="flex h-7 w-8 items-center justify-center rounded-lg border border-[#232b45] bg-[#161c30] text-[#eef1f8] hover:border-[#ff7a3d] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectLine(Math.min(Math.max(0, lyrics.length - 1), selectedIdx + 1))}
              disabled={selectedIdx >= lyrics.length - 1}
              aria-label="পরের লাইন"
              className="flex h-7 w-8 items-center justify-center rounded-lg border border-[#232b45] bg-[#161c30] text-[#eef1f8] hover:border-[#ff7a3d] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big One-Thumb Primary Sync Tap + Gap */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMarkLine}
            disabled={!hasAudio || lyrics.length === 0}
            className="flex min-h-[54px] flex-[2.3] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-3 text-sm sm:text-base font-bold text-[#090b12] transition-transform active:scale-[0.98] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <CornerDownRight className="w-4 h-4 shrink-0" />
            <span>এই লাইন এখন শুরু (SET)</span>
            <kbd className="hidden sm:inline-block rounded bg-[#090b12]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#090b12]">
              M
            </kbd>
          </button>

          <button
            type="button"
            onClick={onInsertGap}
            disabled={!hasAudio}
            className="flex min-h-[54px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-3 text-xs font-semibold text-[#eef1f8] hover:border-[#344066] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            title="মিউজিক বিরতি যোগ করো (Shortcut: G)"
          >
            <PauseCircle className="w-4 h-4 text-[#ffb347] shrink-0" />
            <span>গ্যাপ</span>
          </button>
        </div>

        {/* Tight 5-button Fine-Tune & Undo Row */}
        <div className="grid grid-cols-5 gap-1.5">
          {[-0.5, -0.1, 0.1, 0.5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => onAdjustTime(delta)}
              className="min-h-[38px] rounded-lg border border-[#232b45] bg-[#161c30] px-1.5 py-1 text-xs font-semibold text-[#eef1f8] font-mono-nums hover:border-[#3b4770] cursor-pointer"
            >
              {delta > 0 ? `+${delta}s` : `${delta}s`}
            </button>
          ))}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-[#232b45] bg-[#161c30] px-1.5 py-1 text-xs font-semibold text-[#eef1f8] hover:border-[#3b4770] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>

        {syncMessage && <p className="text-xs font-medium text-[#2de18a]">{syncMessage}</p>}
      </div>

      {/* Compact Auto-Centering Lyric Queue */}
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-3.5 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white">সিংক লিস্ট (স্বয়ংক্রিয় স্ক্রল)</h3>
          <span className="text-[11px] text-[#8a97b8]">লাইনে ট্যাপ করে বাছাই করুন</span>
        </div>

        {lyrics.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8a97b8]">
            কোনো লিরিক নেই। প্রথম ট্যাবে গিয়ে লিরিক লিখুন।
          </div>
        ) : (
          <div ref={syncListRef} className="max-h-[240px] lg:max-h-[340px] space-y-1 overflow-y-auto pr-1">
            {lyrics.map((line, i) => {
              const t = times[i];
              let durationStr = '';
              if (t !== null) {
                let nextT: number | null = null;
                for (let j = i + 1; j < times.length; j++) {
                  const cand = times[j];
                  if (cand !== null && cand > t) {
                    nextT = cand;
                    break;
                  }
                }
                if (nextT !== null) {
                  durationStr = ` · ${(nextT - t).toFixed(1)}s`;
                }
              }

              const isSelected = i === selectedIdx;
              const isPlayingNow = i === activePlayIdx;
              const isGap = line === '♪';

              return (
                <div
                  key={`${i}-${line}`}
                  data-sync-idx={i}
                  onClick={() => onSelectLine(i)}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#ff7a3d]/70 bg-[#ff7a3d]/15'
                      : 'border-transparent bg-[#0d101c] hover:border-[#232b45]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono-nums text-[11px] text-[#6f7b9e]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`truncate font-medium ${
                        isPlayingNow ? 'text-[#ffb347]' : isGap ? 'text-[#8a97b8] italic' : 'text-[#eef1f8]'
                      }`}
                    >
                      {isGap ? '♪ (বিরতি / Instrumental)' : line}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-mono-nums text-[11px] text-[#8a97b8]">
                      {t === null ? '—' : `${formatTime(t)}${durationStr}`}
                    </span>
                    {t !== null && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToLine(i);
                        }}
                        className="rounded-lg border border-[#293250] bg-[#181e33] px-2 py-1 text-[11px] font-semibold text-white hover:border-[#ff7a3d] cursor-pointer"
                      >
                        Go
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 hidden sm:block rounded-xl border border-[#1e2438] bg-[#0a0d18] px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8a97b8]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#9aa6c8]">
              <Keyboard className="w-3.5 h-3.5 text-[#ffb347]" />
              <span>শর্টকাট:</span>
            </span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">Space</kbd> Play</span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">M</kbd> SET</span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">G</kbd> Gap</span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">↑/↓</kbd> লাইন</span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">[/]</kbd> ±0.1s</span>
            <span><kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1 py-0.5 font-mono text-[10px] text-[#ffb347]">Z</kbd> Undo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
