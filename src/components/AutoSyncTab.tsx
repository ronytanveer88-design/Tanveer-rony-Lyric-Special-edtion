import React, { useEffect, useState } from 'react';
import { Clock, Crosshair, Hand, Undo2, Wand2 } from 'lucide-react';
import { formatTime } from '../utils/storage';

interface AutoSyncTabProps {
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
  onBatchOffset: (offsetSec: number) => void;
  onUpdateIntroSeconds: (sec: number) => void;
  onAlignSyncToIntro: (customIntroSec?: number) => void;
  onSetLineTimeManual: (idx: number, sec: number) => void;
  onUndo: () => void;
  onAutoSync: (customIntroSec?: number) => void;
  onOpenManualSync: () => void;
}

export const AutoSyncTab: React.FC<AutoSyncTabProps> = ({
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
  onBatchOffset,
  onUpdateIntroSeconds,
  onAlignSyncToIntro,
  onSetLineTimeManual,
  onUndo,
  onAutoSync,
  onOpenManualSync,
}) => {
  const [introInput, setIntroInput] = useState<string>(() => String(introSeconds));
  const [manualLineTimeInput, setManualLineTimeInput] = useState<string>('');
  const [batchOffsetInput, setBatchOffsetInput] = useState<string>('');

  useEffect(() => {
    setIntroInput(String(introSeconds));
  }, [introSeconds]);

  useEffect(() => {
    const selTime = times[selectedIdx];
    setManualLineTimeInput(selTime !== null && selTime !== undefined ? selTime.toFixed(1) : '');
  }, [selectedIdx, times]);

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">অটো সিঙ্ক ও ফাইন টিউন</h2>
            <p className="text-xs text-[#8a97b8]">
              ইন্ট্রো সময় দিয়ে এক ক্লিকে অটো সিঙ্ক করুন, অথবা সব লাইন একসাথে আগে-পরে সরান।
            </p>
          </div>
          <span className="font-mono-nums text-xs text-[#8a97b8]">
            {times.filter((t) => t !== null).length}/{lyrics.length} সিংকড
          </span>
        </div>

        {/* Intro Seconds Box */}
        <div className="rounded-xl border border-[#232b45] bg-[#0a0d18] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="auto-intro-seconds-input" className="text-xs font-semibold text-white">
              ইন্ট্রো সময় (Intro Seconds)
            </label>
            <button
              type="button"
              onClick={handleCaptureCurrentAsIntro}
              disabled={!hasAudio}
              className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#2c3450] bg-[#181e33] px-2.5 py-1 text-[11px] font-medium text-[#ffb347] hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Crosshair className="w-3 h-3" />
              <span>অডিও সময় নাও ({currentAudioTime.toFixed(1)}s)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
              <input
                id="auto-intro-seconds-input"
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
              className="min-h-[36px] rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-[#eef1f8] hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              ইন্ট্রো থেকে সিংক ঠিক করো
            </button>
          </div>
        </div>

        {/* Auto Sync Primary CTA */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAutoSync(validIntro ? parsedIntro : 0)}
            disabled={!hasAudio || lyrics.length === 0 || !validIntro}
            className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-3 text-sm font-bold text-[#090b12] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Wand2 className="w-4 h-4 shrink-0" />
            <span>Auto Sync চালু করো ({validIntro ? `${parsedIntro.toFixed(1)}s` : '0.0s'} ইন্ট্রো)</span>
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

        {/* Quick 1-Tap & Custom Batch Offset */}
        <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9aa6c8]">
            <Clock className="w-3.5 h-3.5 text-[#ffb347] shrink-0" />
            <span>সব লাইন একসাথে আগে/পরে সরান (Batch Offset)</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[-0.5, -0.2, 0.2, 0.5].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => onBatchOffset(delta)}
                disabled={!hasSyncedTimes}
                className="min-h-[36px] rounded-lg border border-[#232b45] bg-[#161c30] px-2 py-1 text-xs font-semibold text-[#eef1f8] font-mono-nums hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {delta > 0 ? `+${delta}s` : `${delta}s`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="auto-batch-offset-input"
              type="number"
              step="0.1"
              value={batchOffsetInput}
              onChange={(e) => setBatchOffsetInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canApplyBatchOffset) {
                  e.preventDefault();
                  onBatchOffset(parsedOffset);
                }
              }}
              placeholder="কাস্টম সেকেন্ড (যেমন: 0.5 বা -0.5)"
              className="flex-1 rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => canApplyBatchOffset && onBatchOffset(parsedOffset)}
              disabled={!canApplyBatchOffset}
              className="min-h-[36px] shrink-0 rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              প্রয়োগ করো
            </button>
          </div>
        </div>

        {/* Direct Manual Line Time Edit */}
        <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="auto-manual-line-time-input" className="text-xs font-medium text-[#9aa6c8]">
              লাইন <span className="font-mono-nums text-[#ffb347]">#{selectedIdx + 1}</span> সরাসরি সময় (sec)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="auto-manual-line-time-input"
                type="number"
                min={0}
                step="0.1"
                value={manualLineTimeInput}
                onChange={(e) => setManualLineTimeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canApplyManualLineTime) {
                    e.preventDefault();
                    onSetLineTimeManual(selectedIdx, parsedManualLineTime);
                  }
                }}
                placeholder="যেমন: 12.5"
                className="w-full sm:w-32 rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => canApplyManualLineTime && onSetLineTimeManual(selectedIdx, parsedManualLineTime)}
                disabled={!canApplyManualLineTime}
                className="min-h-[36px] shrink-0 rounded-lg border border-[#232b45] bg-[#181e33] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#ff7a3d] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                সময় সেট
              </button>
            </div>
          </div>
        </div>

        {/* 1-Tap Handoff to Screen-Visible Manual Sync */}
        <button
          type="button"
          onClick={onOpenManualSync}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff7a3d]/50 bg-[#ff7a3d]/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#ffb347] hover:bg-[#ff7a3d]/20 transition-colors cursor-pointer"
        >
          <Hand className="w-4 h-4 shrink-0" />
          <span>অটো সিঙ্ক না মিললে স্ক্রিন দেখে ম্যানুয়াল সিঙ্ক করুন →</span>
        </button>

        {syncMessage && <p className="text-xs font-medium text-[#2de18a]">{syncMessage}</p>}
      </div>

      {/* Line list for picking lines to edit exact seconds */}
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white">সব লাইনের টাইমলাইন</h3>
          <span className="text-[11px] text-[#8a97b8]">লাইন বাছাই করে সময় ঠিক করুন</span>
        </div>

        <div className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
          {lyrics.map((line, i) => {
            const t = times[i];
            const isSelected = i === selectedIdx;
            const isPlayingNow = i === activePlayIdx;
            return (
              <div
                key={`${i}-${line}`}
                onClick={() => onSelectLine(i)}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm cursor-pointer ${
                  isSelected
                    ? 'border-[#ff7a3d]/60 bg-[#ff7a3d]/10'
                    : 'border-transparent bg-[#0d101c] hover:border-[#232b45]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono-nums text-[11px] text-[#6f7b9e]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`truncate font-medium ${isPlayingNow ? 'text-[#ffb347]' : 'text-[#eef1f8]'}`}>
                    {line === '♪' ? '♪ (বিরতি / Instrumental)' : line}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono-nums text-[11px] text-[#8a97b8]">
                    {t === null ? '—' : formatTime(t)}
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
      </div>
    </div>
  );
};
