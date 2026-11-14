import React, { useRef } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode2,
  FileJson,
  FileText,
  Film,
  Image as ImageIcon,
  Package,
  Save,
  Share2,
  Square,
  Upload,
  Video,
  AlertTriangle,
} from 'lucide-react';
import { DesignConfig, DiagnosticItem } from '../types/studio';

interface ExportTabProps {
  design: DesignConfig;
  renderingMode: 'mp4' | 'webm' | null;
  recordProgress: number;
  recordStatus: string;
  recordedVideoUrl: string | null;
  recordedExt: string;
  canShareVideo: boolean;
  pendingUnsyncedMode: 'mp4' | 'webm' | null;
  lrcPreview: string;
  thumbnailDataUrl: string | null;
  diagnostics: DiagnosticItem[] | null;
  onUpdateDesign: (patch: Partial<DesignConfig>) => void;
  onStartOrStopMp4: (forceUnsynced: boolean) => void;
  onStartOrStopWebm: (forceUnsynced: boolean) => void;
  onCancelUnsyncedConfirm: () => void;
  onShareVideo: () => void;
  onSaveLrc: () => void;
  onSaveProject: () => void;
  onExportProjectJson: () => void;
  onImportProjectJson: (file: File) => void;
  onMakeThumbnail: () => void;
  onRunDiagnostics: () => void;
  onDownloadFixedHtml: () => void;
  onDownloadApkZip: () => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({
  design,
  renderingMode,
  recordProgress,
  recordStatus,
  recordedVideoUrl,
  recordedExt,
  canShareVideo,
  pendingUnsyncedMode,
  lrcPreview,
  thumbnailDataUrl,
  diagnostics,
  onUpdateDesign,
  onStartOrStopMp4,
  onStartOrStopWebm,
  onCancelUnsyncedConfirm,
  onShareVideo,
  onSaveLrc,
  onSaveProject,
  onExportProjectJson,
  onImportProjectJson,
  onMakeThumbnail,
  onRunDiagnostics,
  onDownloadFixedHtml,
  onDownloadApkZip,
}) => {
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const isRenderingMp4 = renderingMode === 'mp4';
  const isRenderingWebm = renderingMode === 'webm';
  const isBusy = renderingMode !== null;

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProjectJson(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">ভিডিও + ইন্ট্রো / আউটরো</h2>
          <span className="text-[11px] font-medium text-[#9aa6c8]">MP4 (H.264) &amp; WebM</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="intro-input" className="mb-1.5 block text-xs text-[#9aa6c8]">
              ইন্ট্রো (৩ সেকেন্ড, ফাঁকা রাখলে বাদ)
            </label>
            <input
              id="intro-input"
              type="text"
              value={design.intro}
              onChange={(e) => onUpdateDesign({ intro: e.target.value })}
              placeholder="চ্যানেলের বা গানের নাম"
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white focus:border-[#ff7a3d] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="outro-input" className="mb-1.5 block text-xs text-[#9aa6c8]">
              আউটরো (৩ সেকেন্ড, ফাঁকা রাখলে বাদ)
            </label>
            <input
              id="outro-input"
              type="text"
              value={design.outro}
              onChange={(e) => onUpdateDesign({ outro: e.target.value })}
              placeholder="Subscribe / ধন্যবাদ"
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] px-3 py-2.5 text-sm text-white focus:border-[#ff7a3d] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            disabled={isRenderingWebm}
            onClick={() => onStartOrStopMp4(false)}
            className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold whitespace-nowrap transition-opacity cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
              isRenderingMp4
                ? 'bg-[#ef4444] text-white'
                : 'bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] text-[#090b12]'
            }`}
          >
            {isRenderingMp4 ? <Square className="w-4 h-4 shrink-0" /> : <Film className="w-4 h-4 shrink-0" />}
            <span>{isRenderingMp4 ? 'MP4 বাতিল করো' : 'Render MP4'}</span>
          </button>

          <button
            type="button"
            disabled={isRenderingMp4}
            onClick={() => onStartOrStopWebm(false)}
            className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
              isRenderingWebm
                ? 'border-[#ef4444] bg-[#ef4444] text-white'
                : 'border-[#232b45] bg-[#181e33] text-[#eef1f8] hover:border-[#38446b]'
            }`}
          >
            {isRenderingWebm ? <Square className="w-4 h-4 shrink-0" /> : <Video className="w-4 h-4 shrink-0 text-[#ffb347]" />}
            <span>{isRenderingWebm ? 'WebM রেকর্ড বন্ধ' : 'Render WebM'}</span>
          </button>
        </div>

        {pendingUnsyncedMode && (
          <div className="rounded-xl border border-[#ffb347]/40 bg-[#1c1612] p-3.5">
            <p className="mb-3 text-xs leading-relaxed text-[#ffb347]">
              এখনো কোনো লাইন সিংক করা হয়নি, তাই ভিডিওতে লিরিক আসবে না। তবুও কি{' '}
              {pendingUnsyncedMode.toUpperCase()} ভিডিও বানাতে চান?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelUnsyncedConfirm}
                className="flex-1 min-h-[38px] rounded-lg border border-[#2c3450] bg-[#181e33] px-3 text-xs font-semibold text-white cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() =>
                  pendingUnsyncedMode === 'mp4'
                    ? onStartOrStopMp4(true)
                    : onStartOrStopWebm(true)
                }
                className="flex-1 min-h-[38px] rounded-lg bg-[#ffb347] px-3 text-xs font-bold text-[#090b12] cursor-pointer"
              >
                হ্যাঁ, বানাও
              </button>
            </div>
          </div>
        )}

        {(isBusy || recordProgress > 0) && (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1a2036]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] transition-[width] duration-150"
                style={{ width: `${recordProgress}%` }}
              />
            </div>
            {recordStatus && (
              <p className="mt-2 text-xs font-medium text-[#2de18a] font-mono-nums">{recordStatus}</p>
            )}
          </div>
        )}

        {recordedVideoUrl && (
          <div className="space-y-2.5 pt-2">
            <video
              src={recordedVideoUrl}
              controls
              playsInline
              className="w-full rounded-xl border border-[#232b45] bg-black"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={recordedVideoUrl}
                download={`lyric-video.${recordedExt}`}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-2.5 text-sm font-bold text-[#090b12] no-underline whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{recordedExt.toUpperCase()} ডাউনলোড</span>
              </a>
              {canShareVideo && (
                <button
                  type="button"
                  onClick={onShareVideo}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>শেয়ার / সেভ</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">প্রজেক্ট ম্যানেজার (Project Manager)</h2>
          <span className="font-mono-nums text-[11px] text-[#9aa6c8]">.json</span>
        </div>
        <p className="text-xs leading-relaxed text-[#8a97b8]">
          লিরিক, সিংক টাইম ও ডিজাইন সেটিংস একটি .json ফাইলে ব্যাকআপ রাখুন অথবা আগের ফাইল আপলোড করে এডিট চালু করুন।
        </p>

        <input
          ref={projectFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleProjectFileChange}
          className="hidden"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportProjectJson}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#ff7a3d] cursor-pointer whitespace-nowrap"
          >
            <FileJson className="w-4 h-4 text-[#ffb347] shrink-0" />
            <span>Download Project (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => projectFileInputRef.current?.click()}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#2de18a] cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-[#2de18a] shrink-0" />
            <span>Upload Project (.json)</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e2438] bg-[#111522] p-4 sm:p-5 space-y-3">
        <h2 className="text-base font-bold text-white">ফাইল এক্সপোর্ট ও টেস্ট</h2>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSaveLrc}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#38446b] cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#ff7a3d]" />
            <span>LRC সেভ</span>
          </button>

          <button
            type="button"
            onClick={onSaveProject}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#38446b] cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#ff7a3d]" />
            <span>প্রজেক্ট সেভ</span>
          </button>

          <button
            type="button"
            onClick={onMakeThumbnail}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#38446b] cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#ffb347]" />
            <span>থাম্বনেইল JPG</span>
          </button>

          <button
            type="button"
            onClick={onRunDiagnostics}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#232b45] bg-[#181e33] px-3 py-2 text-xs font-semibold text-[#eef1f8] hover:border-[#38446b] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#2de18a]" />
            <span>সব টেস্ট করো</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onDownloadFixedHtml}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#2d385c] bg-[#161c30] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#ff7a3d] cursor-pointer"
        >
          <FileCode2 className="w-4 h-4 text-[#ff7a3d]" />
          <span>অফলাইন সিঙ্গেল-ফাইল HTML (lyric-studio-fixed.html) ডাউনলোড</span>
        </button>

        <button
          type="button"
          onClick={onDownloadApkZip}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a3d] to-[#ffb347] px-4 py-2.5 text-xs font-bold text-[#090b12] transition-opacity hover:opacity-95 cursor-pointer"
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>GitHub APK প্রজেক্ট (.zip) ডাউনলোড — Android APK বানান</span>
        </button>

        {lrcPreview && (
          <div>
            <label htmlFor="lrc-out" className="mb-1 block text-xs text-[#9aa6c8]">
              LRC আউটপুট (কপি করতে পারেন)
            </label>
            <textarea
              id="lrc-out"
              readOnly
              value={lrcPreview}
              rows={4}
              className="w-full rounded-xl border border-[#232b45] bg-[#0a0d18] p-3 text-xs text-[#eef1f8] font-mono-nums"
            />
          </div>
        )}

        {thumbnailDataUrl && (
          <div>
            <p className="mb-1.5 text-xs text-[#9aa6c8]">থাম্বনেইল প্রিভিউ ({design.ratio})</p>
            <img
              src={thumbnailDataUrl}
              alt="তৈরি করা থাম্বনেইল"
              className="mx-auto max-h-[320px] w-auto rounded-xl border border-[#232b45]"
            />
          </div>
        )}

        {diagnostics && (
          <div className="rounded-xl border border-[#232b45] bg-[#0a0d18] p-3 space-y-1.5">
            {diagnostics.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#eef1f8]">
                  {item.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2de18a]" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
                  )}
                  {item.label}
                </span>
                <span className={item.ok ? 'text-[#2de18a]' : 'text-[#f59e0b]'}>
                  {item.ok ? 'OK' : item.detail}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
