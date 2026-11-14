import React, { useEffect } from 'react';
import { FastForward, Pause, Play, Rewind, RotateCcw, X } from 'lucide-react';
import { AspectRatio } from '../types/studio';
import { formatTime } from '../utils/storage';

export const FULLSCREEN_DIMENSIONS: Record<AspectRatio, [number, number]> = {
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
};

interface FullscreenPreviewModalProps {
  isOpen: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ratio: AspectRatio;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hasAudio: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeekRelative: (delta: number) => void;
  onSeekAbsolute: (time: number) => void;
}

export const FullscreenPreviewModal: React.FC<FullscreenPreviewModalProps> = ({
  isOpen,
  canvasRef,
  ratio,
  currentTime,
  duration,
  isPlaying,
  hasAudio,
  onClose,
  onTogglePlay,
  onRestart,
  onSeekRelative,
  onSeekAbsolute,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const [w, h] = FULLSCREEN_DIMENSIONS[ratio];
  const progressPct =
    Number.isFinite(duration) && duration > 0
      ? Math.min(100, (currentTime / duration) * 100)
      : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!Number.isFinite(duration) || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeekAbsolute(pct * duration);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Preview"
      className="fixed inset-0 z-50 flex flex-col bg-[#05070c]/98 backdrop-blur-md"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold text-white">Fullscreen Preview</span>
          <span className="text-[#8a97b8] font-mono-nums text-xs">
            {ratio} · {w}×{h}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Fullscreen Preview"
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>বন্ধ করো</span>
        </button>
      </div>

      {/* High-Resolution Centered Canvas Stage */}
      <div className="flex flex-1 min-h-0 items-center justify-center p-3 sm:p-6">
        <div
          className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl"
          style={{
            aspectRatio: `${w} / ${h}`,
            height: ratio === '9:16' ? '100%' : 'auto',
            width: ratio === '9:16' ? 'auto' : '100%',
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            className="block h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="border-t border-white/10 bg-[#090b12]/90 px-4 py-3 sm:px-6 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          <div
            role="slider"
            aria-label="ফুলস্ক্রিন টাইমলাইন"
            aria-valuemin={0}
            aria-valuemax={Number.isFinite(duration) ? duration : 0}
            aria-valuenow={currentTime}
            tabIndex={0}
            onClick={handleBarClick}
            className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-[#1e2438]"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff7a3d] to-[#ffb347]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#9aa6c8] font-mono-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRestart}
                disabled={!hasAudio}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>শুরু</span>
              </button>

              <button
                type="button"
                onClick={() => onSeekRelative(-5)}
                disabled={!hasAudio}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-2.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="৫ সেকেন্ড পেছনে"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                disabled={!hasAudio}
                className="flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#ff7a3d] px-5 py-1.5 text-xs font-bold text-[#090b12] hover:opacity-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'থামাও' : 'চালাও'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSeekRelative(5)}
                disabled={!hasAudio}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-2.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="৫ সেকেন্ড সামনে"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
