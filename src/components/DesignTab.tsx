import React, { useRef } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ImagePlus, Maximize2 } from 'lucide-react';
import {
  AspectRatio,
  BengaliFont,
  BgTheme,
  DesignConfig,
  TextAlignment,
  TransitionStyle,
  VideoFilter,
} from '../types/studio';

interface DesignTabProps {
  design: DesignConfig;
  customMediaName: string;
  onUpdateDesign: (patch: Partial<DesignConfig>) => void;
  onSelectBgFile: (file: File) => void;
  onOpenFullscreenPreview: () => void;
}

const PRESET_THEMES: Array<{ id: Exclude<BgTheme, 'image' | 'video'>; label: string }> = [
  { id: 'rain', label: '🌧 বৃষ্টি' },
  { id: 'night', label: '🌌 রাত' },
  { id: 'sunset', label: '🌅 সূর্যাস্ত' },
  { id: 'rose', label: '🌹 গোলাপ' },
  { id: 'ocean', label: '🌊 সমুদ্র' },
  { id: 'forest', label: '🌲 বন' },
];

const RATIOS: Array<{ id: AspectRatio; label: string }> = [
  { id: '16:9', label: 'YouTube 16:9' },
  { id: '9:16', label: 'Reels 9:16' },
  { id: '1:1', label: 'Square 1:1' },
];

const ALIGNMENTS: Array<{ id: TextAlignment; label: string; Icon: typeof AlignLeft }> = [
  { id: 'left', label: 'Left', Icon: AlignLeft },
  { id: 'center', label: 'Center', Icon: AlignCenter },
  { id: 'right', label: 'Right', Icon: AlignRight },
];

export const DesignTab: React.FC<DesignTabProps> = ({
  design,
  customMediaName,
  onUpdateDesign,
  onSelectBgFile,
  onOpenFullscreenPreview,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectBgFile(file);
    e.target.value = '';
  };

  const isCustomMedia = design.bgTheme === 'image' || design.bgTheme === 'video';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white">হাই-রেজোলিউশন প্রিভিউ</h2>
          <p className="text-xs text-[#8a97b8] mt-0.5">
            সম্পূর্ণ স্ক্রিনে লিরিক ভিডিওর আউটপুট দেখুন
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenFullscreenPreview}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-2.5 text-xs font-bold text-[#090b12] transition-opacity hover:opacity-95 cursor-pointer whitespace-nowrap"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Fullscreen Preview</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5">
        <h2 className="mb-3 text-base font-bold text-white">ব্যাকগ্রাউন্ড থিম ও মিডিয়া</h2>

        <div className="grid grid-cols-3 gap-2">
          {PRESET_THEMES.map((theme) => {
            const active = design.bgTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onUpdateDesign({ bgTheme: theme.id })}
                className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'border-transparent bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                    : 'border-[#232b45] bg-[#181e33] text-[#eef1f8] hover:border-[#344066]'
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            isCustomMedia
              ? 'border-transparent bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
              : 'border-[#232b45] bg-[#181e33] text-[#eef1f8] hover:border-[#344066]'
          }`}
        >
          <ImagePlus className="w-4 h-4" />
          <span>
            {isCustomMedia && customMediaName
              ? `মিডিয়া: ${customMediaName}`
              : 'নিজস্ব ছবি / ভিডিও বাছাই করো'}
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5">
        <h2 className="mb-3 text-base font-bold text-white">স্ক্রিনের মাপ</h2>
        <div className="grid grid-cols-3 gap-2">
          {RATIOS.map((r) => {
            const active = design.ratio === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onUpdateDesign({ ratio: r.id })}
                className={`min-h-[44px] rounded-xl border px-2 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-transparent bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                    : 'border-[#232b45] bg-[#181e33] text-[#eef1f8] hover:border-[#344066]'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-bold text-white">লেখা ও অ্যানিমেশন</h2>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="font-size-slider" className="text-[#9aa6c8]">
              ফন্ট সাইজ (Font Size)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.fontSize}px</span>
          </div>
          <input
            id="font-size-slider"
            type="range"
            min={16}
            max={72}
            step={1}
            aria-label="Font Size"
            value={design.fontSize}
            onChange={(e) => onUpdateDesign({ fontSize: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="letter-spacing-slider" className="text-[#9aa6c8]">
              অক্ষরের দূরত্ব (Letter Spacing)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.letterSpacing}px</span>
          </div>
          <input
            id="letter-spacing-slider"
            type="range"
            min={-2}
            max={16}
            step={0.5}
            aria-label="Letter Spacing"
            value={design.letterSpacing}
            onChange={(e) => onUpdateDesign({ letterSpacing: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="darkness-slider" className="text-[#9aa6c8]">
              ব্যাকগ্রাউন্ড অন্ধকার
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.darkness}%</span>
          </div>
          <input
            id="darkness-slider"
            type="range"
            min={0}
            max={85}
            value={design.darkness}
            onChange={(e) => onUpdateDesign({ darkness: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="bg-blur-slider" className="text-[#9aa6c8]">
              ব্যাকগ্রাউন্ড ব্লার (Background Blur)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.bgBlur}px</span>
          </div>
          <input
            id="bg-blur-slider"
            type="range"
            min={0}
            max={20}
            step={1}
            aria-label="Background Blur"
            value={design.bgBlur}
            onChange={(e) => onUpdateDesign({ bgBlur: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
          {!isCustomMedia && design.bgBlur > 0 && (
            <p className="mt-1 text-[11px] text-[#8a97b8]">
              ব্লার ইফেক্ট কাস্টম ছবি বা ভিডিও ব্যাকগ্রাউন্ডে প্রয়োগ হবে
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="bg-fade-slider" className="text-[#9aa6c8]">
              ব্যাকগ্রাউন্ড ফেড (Background Fade)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.bgFade}%</span>
          </div>
          <input
            id="bg-fade-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            aria-label="Background Fade"
            value={design.bgFade}
            onChange={(e) => onUpdateDesign({ bgFade: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
          {!isCustomMedia && design.bgFade > 0 && (
            <p className="mt-1 text-[11px] text-[#8a97b8]">
              ফেড ইফেক্ট কাস্টম ছবি বা ভিডিও ব্যাকগ্রাউন্ডে প্রয়োগ হবে
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5">
          <div className="flex min-h-[36px] items-center justify-between gap-3">
            <label htmlFor="bg-overlay-color-picker" className="text-xs text-[#9aa6c8] cursor-pointer">
              ব্যাকগ্রাউন্ড ওভারলে রঙ (Background Overlay Color)
            </label>
            <div className="flex items-center gap-2.5">
              <span className="font-mono-nums text-xs uppercase text-[#eef1f8]">
                {design.bgOverlayColor}
              </span>
              <input
                id="bg-overlay-color-picker"
                type="color"
                aria-label="Background Overlay Color"
                value={design.bgOverlayColor}
                onChange={(e) => onUpdateDesign({ bgOverlayColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-[#232b45] bg-[#111522] p-0.5"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label htmlFor="bg-overlay-opacity-slider" className="text-[#9aa6c8]">
                ওভারলে অপাসিটি (Overlay Opacity)
              </label>
              <span className="font-mono-nums text-[#eef1f8]">{design.bgOverlayOpacity}%</span>
            </div>
            <input
              id="bg-overlay-opacity-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label="Overlay Opacity"
              value={design.bgOverlayOpacity}
              onChange={(e) => onUpdateDesign({ bgOverlayOpacity: Number(e.target.value) })}
              className="w-full cursor-pointer accent-[#ff7a3d]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="video-filter-select" className="mb-1.5 block text-xs text-[#9aa6c8]">
            ভিডিও ফিল্টার (Video Filter)
          </label>
          <select
            id="video-filter-select"
            aria-label="Video Filter"
            value={design.videoFilter}
            onChange={(e) => onUpdateDesign({ videoFilter: e.target.value as VideoFilter })}
            className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white focus:border-[#ff7a3d] focus:outline-none"
          >
            <option value="none">None</option>
            <option value="grayscale">Grayscale</option>
            <option value="sepia">Sepia</option>
            <option value="invert">Invert</option>
          </select>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="bg-speed-slider" className="text-[#9aa6c8]">
              ব্যাকগ্রাউন্ড স্পিড (Background Speed)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.bgSpeed.toFixed(2)}x</span>
          </div>
          <input
            id="bg-speed-slider"
            type="range"
            min={0.25}
            max={2}
            step={0.05}
            aria-label="Background Speed"
            value={design.bgSpeed}
            onChange={(e) => onUpdateDesign({ bgSpeed: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
          {design.bgTheme !== 'video' && design.bgSpeed !== 1 && (
            <p className="mt-1 text-[11px] text-[#8a97b8]">
              স্পিড পরিবর্তন কাস্টম ভিডিও ব্যাকগ্রাউন্ডে প্রয়োগ হবে
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="font-select" className="mb-1.5 block text-xs text-[#9aa6c8]">
              ফন্ট (Font Family)
            </label>
            <select
              id="font-select"
              value={design.font}
              onChange={(e) => onUpdateDesign({ font: e.target.value as BengaliFont })}
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white focus:border-[#ff7a3d] focus:outline-none"
            >
              <option value="Hind Siliguri">Hind Siliguri</option>
              <option value="Baloo Da 2">Baloo Da 2</option>
              <option value="Noto Serif Bengali">Noto Serif Bengali</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
            </select>
          </div>

          <div>
            <label htmlFor="transition-select" className="mb-1.5 block text-xs text-[#9aa6c8]">
              Transition Style
            </label>
            <select
              id="transition-select"
              value={design.transitionStyle}
              onChange={(e) =>
                onUpdateDesign({ transitionStyle: e.target.value as TransitionStyle })
              }
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white focus:border-[#ff7a3d] focus:outline-none"
            >
              <option value="Fade">Fade</option>
              <option value="Slide">Slide</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <label htmlFor="transition-speed-slider" className="text-[#9aa6c8]">
              ট্রানজিশন স্পিড (Transition Speed)
            </label>
            <span className="font-mono-nums text-[#eef1f8]">{design.transitionSpeed.toFixed(2)}s</span>
          </div>
          <input
            id="transition-speed-slider"
            type="range"
            min={0.1}
            max={2}
            step={0.05}
            aria-label="Transition Speed"
            value={design.transitionSpeed}
            onChange={(e) => onUpdateDesign({ transitionSpeed: Number(e.target.value) })}
            className="w-full cursor-pointer accent-[#ff7a3d]"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-[#9aa6c8]">
            টেক্সট অ্যালাইনমেন্ট (Text Alignment)
          </span>
          <div className="grid grid-cols-3 gap-2">
            {ALIGNMENTS.map(({ id, label, Icon }) => {
              const active = design.textAlign === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onUpdateDesign({ textAlign: id })}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-transparent bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
                      : 'border-[#232b45] bg-[#181e33] text-[#eef1f8] hover:border-[#344066]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5">
          <div className="flex min-h-[36px] items-center justify-between gap-3">
            <label htmlFor="text-color-picker" className="text-xs text-[#9aa6c8] cursor-pointer">
              লেখার রঙ (Text Color)
            </label>
            <div className="flex items-center gap-2.5">
              {design.textColor.toLowerCase() !== '#ffffff' && !design.textGradientEnabled && (
                <button
                  type="button"
                  onClick={() => onUpdateDesign({ textColor: '#ffffff' })}
                  className="rounded-lg border border-[#2c3450] bg-[#181e33] px-2.5 py-1 text-[11px] font-medium text-[#eef1f8] hover:border-[#38446b] cursor-pointer"
                >
                  সাদা রিসেট
                </button>
              )}
              <span className="font-mono-nums text-xs uppercase text-[#eef1f8]">
                {design.textColor}
              </span>
              <input
                id="text-color-picker"
                type="color"
                disabled={design.textGradientEnabled}
                value={design.textColor}
                onChange={(e) => onUpdateDesign({ textColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-[#232b45] bg-[#111522] p-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t border-[#1e2438] pt-2.5">
            <label className="flex min-h-[36px] items-center justify-between gap-3 text-xs text-[#eef1f8] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-white">Text Gradient</span>
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-10 rounded border border-[#2c3450]"
                  style={{
                    background: `linear-gradient(90deg, ${design.textGradientStart}, ${design.textGradientEnd})`,
                  }}
                />
              </div>
              <input
                type="checkbox"
                checked={design.textGradientEnabled}
                onChange={(e) => onUpdateDesign({ textGradientEnabled: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
              />
            </label>

            {design.textGradientEnabled && (
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1e2438] bg-[#111522] px-2.5 py-1.5">
                  <label
                    htmlFor="text-gradient-start"
                    className="text-[11px] text-[#9aa6c8] cursor-pointer"
                  >
                    Color 1
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-nums text-[11px] uppercase text-[#eef1f8]">
                      {design.textGradientStart}
                    </span>
                    <input
                      id="text-gradient-start"
                      type="color"
                      value={design.textGradientStart}
                      onChange={(e) => onUpdateDesign({ textGradientStart: e.target.value })}
                      className="h-7 w-9 cursor-pointer rounded border border-[#232b45] bg-[#0a0d18] p-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1e2438] bg-[#111522] px-2.5 py-1.5">
                  <label
                    htmlFor="text-gradient-end"
                    className="text-[11px] text-[#9aa6c8] cursor-pointer"
                  >
                    Color 2
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-nums text-[11px] uppercase text-[#eef1f8]">
                      {design.textGradientEnd}
                    </span>
                    <input
                      id="text-gradient-end"
                      type="color"
                      value={design.textGradientEnd}
                      onChange={(e) => onUpdateDesign({ textGradientEnd: e.target.value })}
                      className="h-7 w-9 cursor-pointer rounded border border-[#232b45] bg-[#0a0d18] p-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex min-h-[44px] items-center justify-between gap-3 text-xs text-[#eef1f8] cursor-pointer">
            <span>প্রিভিউ ও ভিডিওতে পরের লাইন হালকা দেখাবে</span>
            <input
              type="checkbox"
              checked={design.showNextLine}
              onChange={(e) => onUpdateDesign({ showNextLine: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
            />
          </label>

          <div className="border-t border-[#1e2438] pt-2 space-y-2">
            <label className="flex min-h-[44px] items-center justify-between gap-3 text-xs text-[#eef1f8] cursor-pointer">
              <div>
                <span className="font-semibold text-white">Text Shadow</span>
                <p className="text-[11px] text-[#8a97b8]">
                  জটিল ব্যাকগ্রাউন্ডে লিরিক স্পষ্ট রাখতে হালকা শ্যাডো যোগ করে
                </p>
              </div>
              <input
                type="checkbox"
                checked={design.textShadow}
                onChange={(e) => onUpdateDesign({ textShadow: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
              />
            </label>

            <div className={design.textShadow ? '' : 'opacity-45'}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="shadow-offset-slider" className="text-[#9aa6c8]">
                  Shadow Offset (শ্যাডো দূরত্ব)
                </label>
                <span className="font-mono-nums text-[#eef1f8]">{design.shadowOffset}px</span>
              </div>
              <input
                id="shadow-offset-slider"
                type="range"
                min={0}
                max={20}
                step={1}
                aria-label="Shadow Offset"
                disabled={!design.textShadow}
                value={design.shadowOffset}
                onChange={(e) => onUpdateDesign({ shadowOffset: Number(e.target.value) })}
                className="w-full cursor-pointer accent-[#ff7a3d] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <label className="flex min-h-[44px] items-center justify-between gap-3 border-t border-[#1e2438] pt-2 text-xs text-[#eef1f8] cursor-pointer">
            <div>
              <span className="font-semibold text-white">Text Outline</span>
              <p className="text-[11px] text-[#8a97b8]">
                যেকোনো ব্যাকগ্রাউন্ডে লেখা স্পষ্ট রাখতে টেক্সটে আউটলাইন যোগ করে
              </p>
            </div>
            <input
              type="checkbox"
              checked={design.textOutline}
              onChange={(e) => onUpdateDesign({ textOutline: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
            />
          </label>

          <label className="flex min-h-[44px] items-center justify-between gap-3 border-t border-[#1e2438] pt-2 text-xs text-[#eef1f8] cursor-pointer">
            <div>
              <span className="font-semibold text-white">Text Glow</span>
              <p className="text-[11px] text-[#8a97b8]">
                লিরিক্সে নিয়ন ও সিনেমাটিক লাইট-লিক আউটার গ্লো যোগ করে
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Text Glow"
              checked={design.textGlow}
              onChange={(e) => onUpdateDesign({ textGlow: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
            />
          </label>

          <label className="flex min-h-[44px] items-center justify-between gap-3 border-t border-[#1e2438] pt-2 text-xs text-[#eef1f8] cursor-pointer">
            <div>
              <span className="font-semibold text-white">Bouncing Animation</span>
              <p className="text-[11px] text-[#8a97b8]">
                গানের তালে টেক্সটে হালকা ওপর-নিচ বাউন্স ইফেক্ট যোগ করে
              </p>
            </div>
            <input
              type="checkbox"
              checked={design.bouncingAnimation}
              onChange={(e) => onUpdateDesign({ bouncingAnimation: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[#ff7a3d] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3">
        <div>
          <h2 className="text-base font-bold text-white">ইন্ট্রো ও আউটরো টাইটেল</h2>
          <p className="text-xs text-[#8a97b8] mt-0.5">
            এক্সপোর্ট করা ভিডিওর শুরুতে ও শেষে ৩ সেকেন্ড করে দেখাবে (ফাঁকা রাখলে বাদ যাবে)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="design-intro-input" className="mb-1.5 block text-xs text-[#9aa6c8]">
              Intro Title
            </label>
            <input
              id="design-intro-input"
              type="text"
              value={design.intro}
              onChange={(e) => onUpdateDesign({ intro: e.target.value })}
              placeholder="যেমন: গানের বা চ্যানেলের নাম"
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="design-outro-input" className="mb-1.5 block text-xs text-[#9aa6c8]">
              Outro Text
            </label>
            <input
              id="design-outro-input"
              type="text"
              value={design.outro}
              onChange={(e) => onUpdateDesign({ outro: e.target.value })}
              placeholder="যেমন: Subscribe / ধন্যবাদ"
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white placeholder-[#596587] focus:border-[#ff7a3d] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
