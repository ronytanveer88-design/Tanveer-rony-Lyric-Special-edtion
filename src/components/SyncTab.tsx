import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  CornerDownRight,
  Crosshair,
  Hand,
  Keyboard,
  PauseCircle,
  Sparkles,
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
  currentAudioTime: number;
  introSeconds: number;
  canUndo: boolean;
  syncMessage: string;
  onSelectLine: (idx: number) => void;
  onJumpToLine: (idx: number) => void;
  onMarkLine: () => void;
  onInsertGap: () => void;
  onAdjustTime: (delta: number) => void;
  onBatchOffset: (offsetSec: number) => void;
  onUpdateIntroSeconds: (sec: number) => void;
  onAlignSyncToIntro: (customIntroSec?: number) => void;
  onSetLineTimeManual: (idx: number, sec: number) => void;
  onUndo: () => void;
  onAutoSync: (customIntroSec?: number) => void;
}

export const SyncTab: React.FC<SyncTabProps> = ({
  lyrics,
  times,
  selectedIdx,
  activePlayIdx,
  hasAudio,
  currentAudioTime,
  introSeconds,
  canUndo,
  syncMessage,
  onSelectLine,
  onJumpToLine,
  onMarkLine,
  onInsertGap,
  onAdjustTime,
  onBatchOffset,
  onUpdateIntroSeconds,
  onAlignSyncToIntro,
  onSetLineTimeManual,
  onUndo,
  onAutoSync,
}) => {
  const [syncMode, setSyncMode] = useState<'manual' | 'auto'>('manual');
  const [introInput, setIntroInput] = useState<string>(() => String(introSeconds));
  const [manualLineTimeInput, setManualLineTimeInput] = useState<string>('');
  const [batchOffsetInput, setBatchOffsetInput] = useState<string>('');
  const syncListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIntroInput(String(introSeconds));
  }, [introSeconds]);

  useEffect(() => {
    const selTime = times[selectedIdx];
    setManualLineTimeInput(selTime !== null && selTime !== undefined ? selTime.toFixed(1) : '');
  }, [selectedIdx, times]);

  useEffect(() => {
    const container = syncListRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-sync-idx="${selectedIdx}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const currentTargetLine = lyrics[selectedIdx] ?? '';
  const hasSyncedTimes = times.some((t) => t !== null);
  const parsedIntro = Number(introInput);
  const validIntro = introInput.trim() !== '' && Number.isFinite(parsedIntro) && parsedIntro >= 0;

  const parsedOffset = Number(batchOffsetInput);
  const canApplyBatchOffset =
    hasSyncedTimes &&
    batchOffsetInput.trim() !== '' &&
    Number.isFinite(parsedOffset) &&
    parsedOffset !== 0;

  const parsedManualLineTime = Number(manualLineTimeInput);
  const canApplyManualLineTime =
    lyrics.length > 0 &&
    manualLineTimeInput.trim() !== '' &&
    Number.isFinite(parsedManualLineTime) &&
    parsedManualLineTime >= 0;

  const handleIntroChange = (val: string) => {
    setIntroInput(val);
    const num = Number(val);
    if (val.trim() !== '' && Number.isFinite(num) && num >= 0) {
      onUpdateIntroSeconds(num);
    }
  };

  const handleCaptureCurrentAsIntro = () => {
    const captured = Number(currentAudioTime.toFixed(1));
    setIntroInput(String(captured));
    onUpdateIntroSeconds(captured);
  };

  const submitBatchOffset = () => {
    if (!canApplyBatchOffset) return;
    onBatchOffset(parsedOffset);
  };

  const submitManualLineTime = () => {
    if (!canApplyManualLineTime) return;
    onSetLineTimeManual(selectedIdx, parsedManualLineTime);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#1e2438] bg-[#0a0d18] p-1">
            <button
              type="button"
              onClick={() => setSyncMode('manual')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                syncMode === 'manual'
                  ? 'bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                  : 'text-[#9aa6c8] hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5 shrink-0" />
              <span>Manual Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setSyncMode('auto')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                syncMode === 'auto'
                  ? 'bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                  : 'text-[#9aa6c8] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Auto Sync</span>
            </button>
          </div>

          <span className="font-mono-nums text-xs text-[#8a97b8]">
            {times.filter((t) => t !== null).length}/{lyrics.length} সিংকড
          </span>
        </div>

        {/* Manual Intro Seconds Box for Auto Sync & Accidental Sync Fix */}
        <div className="rounded-xl border border-[#232b45] bg-[#0a0d18] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="intro-seconds-input" className="text-xs font-semibold text-white">
              ইন্ট্রো সময় (Manual Intro Seconds)
            </label>
            <button
              type="button"
              onClick={handleCaptureCurrentAsIntro}
              disabled={!hasAudio}
              className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#2c3450] bg-[#181e33] px-2.5 py-1 text-[11px] font-medium text-[#ffb347] hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Crosshair className="w-3 h-3" />
              <span>অডিও সময় নাও ({currentAudioTime.toFixed(1)}s)</span>
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-[#8a97b8]">
            গানের শুরুতে যত সেকেন্ড মিউজিক/ইন্ট্রো আছে তা দিন—তাহলে অটো সিংক বা ভুল সিংক রিকভার নিখুঁত হবে।
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
              <input
                id="intro-seconds-input"
                type="number"
                min={0}
                step="0.1"
                value={introInput}
                onChange={(e) => handleIntroChange(e.target.value)}
                placeholder="যেমন: 5.0"
                className="w-full rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
              />
              <span className="text-xs text-[#8a97b8] shrink-0">sec</span>
            </div>

            <button
              type="button"
              onClick={() => onAlignSyncToIntro(validIntro ? parsedIntro : 0)}
              disabled={!hasSyncedTimes || !validIntro}
              title="প্রথম সিংকড লাইনকে ইন্ট্রো সেকেন্ডে এনে সব লাইনের ভুল সিংক ঠিক করুন"
              className="min-h-[36px] rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-[#eef1f8] hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              ইন্ট্রো থেকে সিংক ঠিক করো
            </button>
          </div>
        </div>

        {syncMode === 'auto' ? (
          <div className="space-y-3 rounded-xl border border-[#1e2438] bg-[#0a0d18] p-3.5">
            <div className="text-xs leading-relaxed text-[#9aa6c8]">
              Auto Sync চাপলে গানের শুরুর{' '}
              <strong className="font-mono-nums text-[#ffb347]">
                {validIntro ? `${parsedIntro.toFixed(1)}s` : '0.0s'}
              </strong>{' '}
              ইন্ট্রো বাদ দিয়ে পুরো গানে সব লাইন সমানভাবে সিংক হবে।
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAutoSync(validIntro ? parsedIntro : 0)}
                disabled={!hasAudio || lyrics.length === 0 || !validIntro}
                className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-3 text-sm font-bold text-[#090b12] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4 shrink-0" />
                <span>Auto Sync চালু করো</span>
              </button>
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl border border-[#232b45] bg-[#181e33] px-4 py-3 text-xs font-semibold text-[#eef1f8] hover:border-[#3b4770] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-[#8a97b8]">
                <span>
                  নির্বাচিত লাইন{' '}
                  <strong className="font-mono-nums text-[#ffb347]">#{selectedIdx + 1}</strong>
                </span>
                <span className="font-mono-nums">
                  বর্তমান সময়: {times[selectedIdx] !== null ? formatTime(times[selectedIdx]!) : '—'}
                </span>
              </div>

              <div className="mb-3 min-h-[24px] truncate rounded-lg bg-[#0a0d18] px-3 py-2 text-sm font-semibold text-[#ffb347] border border-[#1e2438]">
                {lyrics.length === 0
                  ? 'আগে লিরিক যোগ করো'
                  : currentTargetLine === '♪'
                  ? '♪ (বিরতি / Instrumental)'
                  : currentTargetLine || 'সব লাইন মার্ক হয়েছে'}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onMarkLine}
                  disabled={!hasAudio || lyrics.length === 0}
                  className="flex min-h-[52px] flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-3 text-sm font-bold text-[#090b12] transition-transform active:scale-[0.99] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
                  className="flex min-h-[52px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-3 text-xs font-semibold text-[#eef1f8] hover:border-[#344066] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="মিউজিক বিরতি যোগ করো (Shortcut: G)"
                >
                  <PauseCircle className="w-4 h-4 text-[#ffb347] shrink-0" />
                  <span>Gap</span>
                  <kbd className="hidden sm:inline-block rounded border border-[#2c3450] bg-[#111522] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                    G
                  </kbd>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[-0.5, -0.1, 0.1, 0.5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => onAdjustTime(delta)}
                  className="min-h-[40px] rounded-lg border border-[#232b45] bg-[#161c30] px-2 py-1.5 text-xs font-semibold text-[#eef1f8] font-mono-nums hover:border-[#3b4770] cursor-pointer"
                >
                  {delta > 0 ? `+${delta}s` : `${delta}s`}
                </button>
              ))}
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-[#232b45] bg-[#161c30] px-2 py-1.5 text-xs font-semibold text-[#eef1f8] hover:border-[#3b4770] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => onAutoSync(validIntro ? parsedIntro : 0)}
                disabled={!hasAudio || lyrics.length === 0}
                className="flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-[#232b45] bg-[#161c30] px-2 py-1.5 text-xs font-semibold text-[#eef1f8] hover:border-[#3b4770] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#ffb347]" />
                <span>অটো ভাগ</span>
              </button>
            </div>

            {/* Direct Manual Line Time Edit */}
            <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] p-2.5 sm:p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="manual-line-time-input"
                  className="text-xs font-medium text-[#9aa6c8]"
                >
                  লাইন <span className="font-mono-nums text-[#ffb347]">#{selectedIdx + 1}</span> ম্যানুয়াল সময় (sec)
                </label>

                <div className="flex items-center gap-2">
                  <input
                    id="manual-line-time-input"
                    type="number"
                    min={0}
                    step="0.1"
                    value={manualLineTimeInput}
                    onChange={(e) => setManualLineTimeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitManualLineTime();
                      }
                    }}
                    placeholder="যেমন: 12.5"
                    className="w-full sm:w-32 rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitManualLineTime}
                    disabled={!canApplyManualLineTime}
                    className="min-h-[36px] shrink-0 rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    সময় সেট
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Batch Offset */}
        <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] p-2.5 sm:p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="batch-offset-input"
              className="flex items-center gap-1.5 text-xs font-medium text-[#9aa6c8]"
            >
              <Clock className="w-3.5 h-3.5 text-[#ffb347] shrink-0" />
              <span>Batch Offset (সব লাইনে সেকেন্ড +/-)</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                id="batch-offset-input"
                type="number"
                step="0.1"
                value={batchOffsetInput}
                onChange={(e) => setBatchOffsetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitBatchOffset();
                  }
                }}
                placeholder="যেমন: 0.5 বা -0.5"
                className="w-full sm:w-36 rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
              />
              <button
                type="button"
                onClick={submitBatchOffset}
                disabled={!canApplyBatchOffset}
                className="min-h-[36px] shrink-0 rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                প্রয়োগ করো
              </button>
            </div>
          </div>
        </div>

        {syncMessage && (
          <p className="text-xs font-medium text-[#2de18a]">{syncMessage}</p>
        )}

        {/* Global Keyboard Shortcuts Legend */}
        <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] px-3 py-2.5">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#9aa6c8]">
            <Keyboard className="w-3.5 h-3.5 text-[#ffb347] shrink-0" />
            <span>কীবোর্ড শর্টকাট (দ্রুত সিংক)</span>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-[#8a97b8]">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                Space
              </kbd>
              <span>Play/Pause</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                ← / →
              </kbd>
              <span>±5s (Shift ±1s)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                M
              </kbd>
              <span>Mark (SET)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                G
              </kbd>
              <span>Gap</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                ↑ / ↓
              </kbd>
              <span>লাইন বদল</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                [ / ]
              </kbd>
              <span>±0.1s</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-[#2c3450] bg-[#161c30] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ffb347]">
                Z
              </kbd>
              <span>Undo</span>
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">সিংক লিস্ট</h3>
          <span className="text-xs text-[#8a97b8]">লাইনে ক্লিক করে সিলেক্ট করুন</span>
        </div>

        {lyrics.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8a97b8]">
            কোনো লিরিক নেই। প্রথম ট্যাবে গিয়ে লিরিক লিখুন।
          </div>
        ) : (
          <div ref={syncListRef} className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
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
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#ff7a3d]/60 bg-[#ff7a3d]/10'
                      : 'border-transparent bg-[#0d101c] hover:border-[#232b45]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="font-mono-nums text-xs text-[#6f7b9e]">
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

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono-nums text-xs text-[#8a97b8]">
                      {t === null ? '—' : `${formatTime(t)}${durationStr}`}
                    </span>
                    {t !== null && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToLine(i);
                        }}
                        className="rounded-lg border border-[#293250] bg-[#181e33] px-2.5 py-1 text-xs font-semibold text-white hover:border-[#ff7a3d] cursor-pointer"
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
      </div>
    </div>
  );
};
