import React, { useEffect, useRef, useState } from 'react';
import { Check, FileAudio, RotateCcw, Scissors, Upload } from 'lucide-react';
import { formatTime } from '../utils/storage';

interface AudioLyricsTabProps {
  audioName: string;
  audioSizeMb: string;
  hasAudio: boolean;
  audioDuration: number;
  currentAudioTime: number;
  startTrim: number;
  endTrim: number | null;
  lyricsText: string;
  lineCount: number;
  onSelectAudioFile: (file: File) => void;
  onUpdateStartTrim: (sec: number) => void;
  onUpdateEndTrim: (sec: number | null) => void;
  onResetTrim: () => void;
  onLyricsTextChange: (text: string) => void;
  onConfirmLyrics: () => void;
}

export const AudioLyricsTab: React.FC<AudioLyricsTabProps> = ({
  audioName,
  audioSizeMb,
  hasAudio,
  audioDuration,
  currentAudioTime,
  startTrim,
  endTrim,
  lyricsText,
  lineCount,
  onSelectAudioFile,
  onUpdateStartTrim,
  onUpdateEndTrim,
  onResetTrim,
  onLyricsTextChange,
  onConfirmLyrics,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [startInput, setStartInput] = useState<string>(() => (startTrim > 0 ? String(startTrim) : '0'));
  const [endInput, setEndInput] = useState<string>(() => (endTrim !== null ? String(endTrim) : ''));

  useEffect(() => {
    setStartInput(String(startTrim));
  }, [startTrim]);

  useEffect(() => {
    setEndInput(endTrim !== null ? String(endTrim) : '');
  }, [endTrim]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectAudioFile(file);
    }
    e.target.value = '';
  };

  const handleStartChange = (val: string) => {
    setStartInput(val);
    if (val.trim() === '') {
      onUpdateStartTrim(0);
      return;
    }
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onUpdateStartTrim(parsed);
    }
  };

  const handleEndChange = (val: string) => {
    setEndInput(val);
    if (val.trim() === '') {
      onUpdateEndTrim(null);
      return;
    }
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      onUpdateEndTrim(parsed);
    }
  };

  const hasValidDur = Number.isFinite(audioDuration) && audioDuration > 0;
  const effStart = hasValidDur
    ? Math.max(0, Math.min(Math.max(0, audioDuration - 0.5), startTrim))
    : Math.max(0, startTrim);
  const effEnd = hasValidDur
    ? endTrim !== null && endTrim > effStart + 0.1
      ? Math.min(audioDuration, endTrim)
      : audioDuration
    : endTrim;
  const invalidTrimRange = endTrim !== null && endTrim <= effStart;
  const trimmedDuration =
    hasValidDur && effEnd !== null ? Math.max(0, effEnd - effStart) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">১. গান বাছাই করো</h2>
          {hasAudio && (
            <span className="text-xs font-medium text-[#2de18a]">লোড হয়েছে</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#313b5e] bg-[#161c30] px-4 py-3 text-sm font-semibold text-[#eef1f8] transition-colors hover:border-[#ff7a3d] hover:bg-[#1b223a] cursor-pointer"
        >
          {hasAudio ? (
            <FileAudio className="w-4 h-4 text-[#ff7a3d]" />
          ) : (
            <Upload className="w-4 h-4 text-[#ff7a3d]" />
          )}
          <span>{hasAudio ? 'অন্য গান পরিবর্তন করো' : 'গান বাছাই করো (MP3 / WAV / M4A)'}</span>
        </button>

        <div className="text-xs text-[#8a97b8]">
          {hasAudio ? (
            <div className="flex flex-wrap items-center gap-2 text-[#eef1f8]">
              <span className="truncate font-medium">{audioName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-nums text-[#8a97b8]">{audioSizeMb} MB</span>
              {hasValidDur && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-nums text-[#ffb347]">{formatTime(audioDuration)}</span>
                </>
              )}
            </div>
          ) : (
            <span>এখনো কোনো অডিও ফাইল বাছাই হয়নি</span>
          )}
        </div>

        {/* Start Trim & End Trim Boundaries */}
        <div className="rounded-xl border border-[#1e2438] bg-[#0a0d18] p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Scissors className="w-3.5 h-3.5 text-[#ffb347] shrink-0" />
              <span>অডিও ট্রিম (Start Trim &amp; End Trim)</span>
            </div>

            {(startTrim > 0 || endTrim !== null) && (
              <button
                type="button"
                onClick={onResetTrim}
                className="inline-flex items-center gap-1 rounded-lg border border-[#2c3450] bg-[#161c30] px-2 py-1 text-[11px] font-medium text-[#eef1f8] hover:border-[#ff7a3d] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>রিসেট</span>
              </button>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-[#8a97b8]">
            সিংক ও ভিডিও এক্সপোর্টে শুধু এই সীমার ভেতরের অডিও ব্যবহৃত হবে (ফাঁকা রাখলে গানের শেষ পর্যন্ত)।
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="start-trim-input" className="text-[11px] text-[#9aa6c8]">
                  Start Trim (sec)
                </label>
                {hasAudio && (
                  <button
                    type="button"
                    onClick={() => onUpdateStartTrim(Number(currentAudioTime.toFixed(1)))}
                    className="text-[10px] font-semibold text-[#ffb347] hover:underline cursor-pointer"
                  >
                    এখন থেকে ({currentAudioTime.toFixed(1)}s)
                  </button>
                )}
              </div>
              <input
                id="start-trim-input"
                type="number"
                min={0}
                max={hasValidDur ? Math.max(0, Number((audioDuration - 0.5).toFixed(1))) : undefined}
                step="0.1"
                value={startInput}
                onChange={(e) => handleStartChange(e.target.value)}
                placeholder="0.0"
                className="w-full rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="end-trim-input" className="text-[11px] text-[#9aa6c8]">
                  End Trim (sec)
                </label>
                {hasAudio && (
                  <button
                    type="button"
                    onClick={() => onUpdateEndTrim(Number(currentAudioTime.toFixed(1)))}
                    className="text-[10px] font-semibold text-[#ffb347] hover:underline cursor-pointer"
                  >
                    এখন পর্যন্ত ({currentAudioTime.toFixed(1)}s)
                  </button>
                )}
              </div>
              <input
                id="end-trim-input"
                type="number"
                min={0}
                max={hasValidDur ? Number(audioDuration.toFixed(1)) : undefined}
                step="0.1"
                value={endInput}
                onChange={(e) => handleEndChange(e.target.value)}
                placeholder={hasValidDur ? audioDuration.toFixed(1) : 'Full'}
                className="w-full rounded-lg border border-[#232b45] bg-[#111522] px-3 py-2 text-xs text-white font-mono-nums placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
              />
            </div>
          </div>

          {invalidTrimRange && (
            <p className="text-[11px] font-medium text-[#f59e0b]">
              End Trim অবশ্যই Start Trim ({effStart.toFixed(1)}s) থেকে বড় হতে হবে।
            </p>
          )}

          {trimmedDuration !== null && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8a97b8] pt-0.5">
              <span>
                কার্যকর অংশ:{' '}
                <strong className="font-mono-nums text-[#2de18a]">
                  {formatTime(effStart)} – {formatTime(effEnd ?? audioDuration)}
                </strong>
              </span>
              <span className="font-mono-nums text-[#eef1f8]">
                মোট {trimmedDuration.toFixed(1)}s
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">২. লিরিক লেখো</h2>
          <span className="text-xs text-[#8a97b8] font-mono-nums">{lineCount} লাইন</span>
        </div>
        <p className="mb-3 text-xs text-[#8a97b8]">
          প্রতিটি লাইন আলাদা লাইনে লিখুন। আগে সিংক করা লাইন অপরিবর্তিত থাকলে তার সময় সংরক্ষিত থাকবে।
        </p>

        <textarea
          value={lyricsText}
          onChange={(e) => onLyricsTextChange(e.target.value)}
          rows={7}
          placeholder="এখানে গানের লিরিক লিখুন বা পেস্ট করুন..."
          className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] p-3.5 text-sm leading-relaxed text-white placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
        />

        <button
          type="button"
          onClick={onConfirmLyrics}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-5 py-3 text-sm font-bold text-[#090b12] transition-opacity hover:opacity-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>লিরিক নিশ্চিত করো ও সিঙ্কে যাও</span>
        </button>
      </div>
    </div>
  );
};
