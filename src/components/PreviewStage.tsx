import React from 'react';
import { FastForward, Pause, Play, Rewind, RotateCcw } from 'lucide-react';
import { AspectRatio, PREVIEW_DIMENSIONS } from '../types/studio';
import { formatTime } from '../utils/storage';

interface PreviewStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ratio: AspectRatio;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hasAudio: boolean;
  syncedCount: number;
  totalLines: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekAbsolute: (time: number) => void;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  canvasRef,
  ratio,
  currentTime,
  duration,
  isPlaying,
  hasAudio,
  syncedCount,
  totalLines,
  onTogglePlay,
  onRestart,
  onSeekRelative,
  onSeekAbsolute,
}) => {
  const [w, h] = PREVIEW_DIMENSIONS[ratio];
  const progressPct = Number.isFinite(duration) && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!Number.isFinite(duration) || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeekAbsolute(pct * duration);
  };

  const maxWidthClass =
    ratio === '16:9' ? 'w-full' : ratio === '9:16' ? 'w-full max-w-[260px]' : 'w-full max-w-[360px]';

  return (
    <section className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-[#8a97b8]">
        <span className="font-semibold text-[#eef1f8]">লাইভ প্রিভিউ</span>
        <div className="flex items-center gap-2 font-mono-nums">
          <span>{ratio}</span>
          <span aria-hidden="true">·</span>
          <span>
            সিংক {syncedCount}/{totalLines}
          </span>
        </div>
      </div>

      <div className="flex justify-center rounded-xl bg-[#07090f] p-2 border border-[#1a2033]">
        <div
          className={`${maxWidthClass} overflow-hidden rounded-lg bg-black`}
          style={{ aspectRatio: `${w} / ${h}` }}
        >
          <canvas ref={canvasRef} width={w} height={h} className="block h-full w-full" />
        </div>
      </div>

      <div className="mt-4">
        <div
          role="slider"
          aria-label="অডিও টাইমলাইন"
          aria-valuemin={0}
          aria-valuemax={Number.isFinite(duration) ? duration : 0}
          aria-valuenow={currentTime}
          tabIndex={0}
          onClick={handleBarClick}
          className="group relative h-2.5 w-full cursor-pointer overflow-hidden rounded-full bg-[#1b2238]"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] transition-[width] duration-75"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-[#9aa6c8] font-mono-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!hasAudio}
            className="col-span-2 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#ff7a3d] px-4 py-2 text-sm font-bold text-[#090b12] transition-opacity hover:opacity-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'থামাও' : 'চালাও'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            disabled={!hasAudio}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#344066] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            title="শুরু থেকে"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>শুরু</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSeekRelative(-5)}
              disabled={!hasAudio}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#232b45] bg-[#181e33] text-xs font-semibold text-[#eef1f8] hover:border-[#344066] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="৫ সেকেন্ড পেছনে"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSeekRelative(5)}
              disabled={!hasAudio}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#232b45] bg-[#181e33] text-xs font-semibold text-[#eef1f8] hover:border-[#344066] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              title="৫ সেকেন্ড সামনে"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
