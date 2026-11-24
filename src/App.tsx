import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioLyricsTab } from './components/AudioLyricsTab';
import { AutoSyncTab } from './components/AutoSyncTab';
import { DesignTab } from './components/DesignTab';
import { ExportTab } from './components/ExportTab';
import { FullscreenPreviewModal } from './components/FullscreenPreviewModal';
import { PreviewStage } from './components/PreviewStage';
import { SyncTab } from './components/SyncTab';
import { MobileBottomNav, TopBar } from './components/TopBar';
import {
  CreativeSuiteApp,
  DEFAULT_DESIGN,
  DEFAULT_LYRICS,
  DesignConfig,
  DiagnosticItem,
  EXPORT_DIMENSIONS,
  PREVIEW_DIMENSIONS,
  StudioTab,
  ToastMessage,
} from './types/studio';
import { drawScene, ensureStudioFontsLoaded } from './utils/canvasRenderer';
import { isWebCodecsMp4Supported, renderMp4WithWebCodecs } from './utils/mp4Exporter';
import {
  findActiveLineIndex,
  formatLrcTime,
  loadFromStorage,
  saveToStorage,
  triggerBlobDownload,
  triggerDataUrlDownload,
} from './utils/storage';

interface UndoSnapshot {
  lyrics: string[];
  times: Array<number | null>;
  selectedIdx: number;
}

const VALID_BG_THEMES = ['rain', 'night', 'sunset', 'rose', 'ocean', 'forest'] as const;
const VALID_FONTS = [
  'Hind Siliguri',
  'Baloo Da 2',
  'Noto Serif Bengali',
  'Plus Jakarta Sans',
] as const;

const AUTO_SAVE_INTERVAL_MS = 30_000;

function sanitizeDesignConfig(saved: Partial<DesignConfig> | null | undefined): DesignConfig {
  if (!saved || typeof saved !== 'object') return DEFAULT_DESIGN;
  const validBg =
    saved.bgTheme && (VALID_BG_THEMES as readonly string[]).includes(saved.bgTheme)
      ? saved.bgTheme
      : 'rain';
  const validFont =
    saved.font && (VALID_FONTS as readonly string[]).includes(saved.font)
      ? saved.font
      : DEFAULT_DESIGN.font;
  const rawTransition = saved.transitionStyle ?? saved.animation;
  const transitionStyle =
    rawTransition === 'Fade' || rawTransition === 'fade'
      ? 'Fade'
      : rawTransition === 'None' || rawTransition === 'none'
      ? 'None'
      : 'Slide';
  return {
    ...DEFAULT_DESIGN,
    ...saved,
    font: validFont,
    fontSize: Math.min(72, Math.max(16, Number(saved.fontSize) || DEFAULT_DESIGN.fontSize)),
    letterSpacing:
      saved.letterSpacing !== undefined && Number.isFinite(Number(saved.letterSpacing))
        ? Math.min(16, Math.max(-2, Number(saved.letterSpacing)))
        : DEFAULT_DESIGN.letterSpacing,
    darkness:
      saved.darkness !== undefined && Number.isFinite(Number(saved.darkness))
        ? Math.min(85, Math.max(0, Number(saved.darkness)))
        : DEFAULT_DESIGN.darkness,
    bgBlur: Math.min(20, Math.max(0, Number(saved.bgBlur) || DEFAULT_DESIGN.bgBlur)),
    bgFade:
      saved.bgFade !== undefined && Number.isFinite(Number(saved.bgFade))
        ? Math.min(100, Math.max(0, Number(saved.bgFade)))
        : DEFAULT_DESIGN.bgFade,
    bgOverlayColor:
      typeof saved.bgOverlayColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.bgOverlayColor)
        ? saved.bgOverlayColor
        : DEFAULT_DESIGN.bgOverlayColor,
    bgOverlayOpacity:
      saved.bgOverlayOpacity !== undefined && Number.isFinite(Number(saved.bgOverlayOpacity))
        ? Math.min(100, Math.max(0, Number(saved.bgOverlayOpacity)))
        : DEFAULT_DESIGN.bgOverlayOpacity,
    videoFilter:
      saved.videoFilter === 'grayscale' ||
      saved.videoFilter === 'sepia' ||
      saved.videoFilter === 'invert' ||
      saved.videoFilter === 'none'
        ? saved.videoFilter
        : DEFAULT_DESIGN.videoFilter,
    bgSpeed:
      saved.bgSpeed !== undefined && Number.isFinite(Number(saved.bgSpeed))
        ? Math.min(2, Math.max(0.25, Number(saved.bgSpeed)))
        : DEFAULT_DESIGN.bgSpeed,
    ratio: saved.ratio && PREVIEW_DIMENSIONS[saved.ratio] ? saved.ratio : '16:9',
    bgTheme: validBg,
    transitionStyle,
    transitionSpeed:
      saved.transitionSpeed !== undefined && Number.isFinite(Number(saved.transitionSpeed))
        ? Math.min(2, Math.max(0.1, Number(saved.transitionSpeed)))
        : DEFAULT_DESIGN.transitionSpeed,
    bouncingAnimation:
      saved.bouncingAnimation !== undefined
        ? Boolean(saved.bouncingAnimation)
        : DEFAULT_DESIGN.bouncingAnimation,
    showNextLine:
      saved.showNextLine !== undefined ? Boolean(saved.showNextLine) : DEFAULT_DESIGN.showNextLine,
    textShadow:
      saved.textShadow !== undefined ? Boolean(saved.textShadow) : DEFAULT_DESIGN.textShadow,
    shadowOffset:
      saved.shadowOffset !== undefined && Number.isFinite(Number(saved.shadowOffset))
        ? Math.min(20, Math.max(0, Number(saved.shadowOffset)))
        : DEFAULT_DESIGN.shadowOffset,
    textOutline:
      saved.textOutline !== undefined ? Boolean(saved.textOutline) : DEFAULT_DESIGN.textOutline,
    textGlow:
      saved.textGlow !== undefined ? Boolean(saved.textGlow) : DEFAULT_DESIGN.textGlow,
    textColor:
      typeof saved.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.textColor)
        ? saved.textColor
        : DEFAULT_DESIGN.textColor,
    textGradientEnabled:
      saved.textGradientEnabled !== undefined
        ? Boolean(saved.textGradientEnabled)
        : DEFAULT_DESIGN.textGradientEnabled,
    textGradientStart:
      typeof saved.textGradientStart === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.textGradientStart)
        ? saved.textGradientStart
        : DEFAULT_DESIGN.textGradientStart,
    textGradientEnd:
      typeof saved.textGradientEnd === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.textGradientEnd)
        ? saved.textGradientEnd
        : DEFAULT_DESIGN.textGradientEnd,
    textAlign:
      saved.textAlign === 'left' || saved.textAlign === 'right' || saved.textAlign === 'center'
        ? saved.textAlign
        : DEFAULT_DESIGN.textAlign,
    intro: typeof saved.intro === 'string' ? saved.intro : DEFAULT_DESIGN.intro,
    outro: typeof saved.outro === 'string' ? saved.outro : DEFAULT_DESIGN.outro,
  };
}

export default function App() {
  const [activeSuiteApp, setActiveSuiteApp] = useState<CreativeSuiteApp>('lyrics');
  const [loadedSuiteApps, setLoadedSuiteApps] = useState<Record<Exclude<CreativeSuiteApp, 'lyrics'>, boolean>>({
    cinema: false,
    intro: false,
    translator: false,
  });
  const [activeTab, setActiveTab] = useState<StudioTab>('lyrics');

  // Initialize from localStorage cleanly — fixing the original `st[i] > 0` bug with `>= 0`
  const [lyricsText, setLyricsText] = useState<string>(() => {
    const saved = loadFromStorage<string[] | null>('lyrics', null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(String).join('\n');
    }
    return DEFAULT_LYRICS;
  });

  const [lyrics, setLyrics] = useState<string[]>(() => {
    const saved = loadFromStorage<string[] | null>('lyrics', null);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(String);
    }
    return DEFAULT_LYRICS.split('\n').map((l) => l.trim()).filter(Boolean);
  });

  const [times, setTimes] = useState<Array<number | null>>(() => {
    const savedLyrics = loadFromStorage<string[] | null>('lyrics', null);
    const savedTimes = loadFromStorage<Array<number | null>>('times', []);
    if (Array.isArray(savedLyrics) && savedLyrics.length > 0) {
      return savedLyrics.map((_, i) => {
        const val = savedTimes[i];
        return typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : null;
      });
    }
    return DEFAULT_LYRICS.split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map(() => null);
  });

  const [design, setDesign] = useState<DesignConfig>(() => {
    const saved = loadFromStorage<Partial<DesignConfig> | null>('design', null);
    return sanitizeDesignConfig(saved);
  });

  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [introSeconds, setIntroSeconds] = useState<number>(() => {
    const saved = loadFromStorage<number>('introSeconds', 3);
    return typeof saved === 'number' && Number.isFinite(saved) && saved >= 0 ? saved : 3;
  });
  const [startTrim, setStartTrim] = useState<number>(() => {
    const saved = loadFromStorage<number>('startTrim', 0);
    return typeof saved === 'number' && Number.isFinite(saved) && saved >= 0 ? saved : 0;
  });
  const [endTrim, setEndTrim] = useState<number | null>(() => {
    const saved = loadFromStorage<number | null>('endTrim', null);
    return typeof saved === 'number' && Number.isFinite(saved) && saved > 0 ? saved : null;
  });

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileRef = useRef<File | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  const [audioSizeMb, setAudioSizeMb] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Background custom media state
  const bgMediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const bgUrlRef = useRef<string | null>(null);
  const [customMediaName, setCustomMediaName] = useState<string>('');

  // Canvas & recording state
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState<boolean>(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recRafRef = useRef<number | null>(null);
  const abortedRecordingRef = useRef<boolean>(false);
  const mp4AbortRef = useRef<AbortController | null>(null);
  const recordedVideoUrlRef = useRef<string | null>(null);
  const audioGraphRef = useRef<{
    ctx: AudioContext;
    src: MediaElementAudioSourceNode;
    dest: MediaStreamAudioDestinationNode;
  } | null>(null);

  const [renderingMode, setRenderingMode] = useState<'mp4' | 'webm' | null>(null);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [recordStatus, setRecordStatus] = useState<string>('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedExt, setRecordedExt] = useState<string>('mp4');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [pendingUnsyncedMode, setPendingUnsyncedMode] = useState<'mp4' | 'webm' | null>(null);

  // Other export states
  const [lrcPreview, setLrcPreview] = useState<string>('');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[] | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const previewAnimStartRef = useRef<number>(performance.now() - 1000);

  // Persist design changes
  const updateDesign = useCallback((patch: Partial<DesignConfig>) => {
    if (patch.transitionStyle !== undefined || patch.transitionSpeed !== undefined) {
      previewAnimStartRef.current = performance.now();
    }
    setDesign((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage('design', {
        ...next,
        bgTheme: next.bgTheme === 'image' || next.bgTheme === 'video' ? 'rain' : next.bgTheme,
      });
      return next;
    });
  }, []);

  // Debounced auto-save for lyrics, times, and design every 30 seconds
  const latestAutoSaveRef = useRef({ lyrics, lyricsText, times, design });
  latestAutoSaveRef.current = { lyrics, lyricsText, times, design };
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveDirtyRef = useRef<boolean>(false);
  const hasMountedAutoSaveRef = useRef<boolean>(false);

  const flushAutoSave = useCallback((): boolean => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const {
      lyrics: curLyrics,
      lyricsText: curLyricsText,
      times: curTimes,
      design: curDesign,
    } = latestAutoSaveRef.current;

    const parsedLines = curLyricsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const hasUnconfirmedText =
      parsedLines.length > 0 && parsedLines.join('\n') !== curLyrics.join('\n');

    const lyricsToSave = hasUnconfirmedText ? parsedLines : curLyrics;
    const timesToSave = hasUnconfirmedText
      ? parsedLines.map((line, i) =>
          curLyrics[i] === line && curTimes[i] !== null ? curTimes[i] : null
        )
      : curTimes;

    const savedLyrics = saveToStorage('lyrics', lyricsToSave);
    const savedTimes = saveToStorage('times', timesToSave);
    const savedDesign = saveToStorage('design', {
      ...curDesign,
      bgTheme:
        curDesign.bgTheme === 'image' || curDesign.bgTheme === 'video' ? 'rain' : curDesign.bgTheme,
    });
    autoSaveDirtyRef.current = false;
    return savedLyrics && savedTimes && savedDesign;
  }, []);

  useEffect(() => {
    if (!hasMountedAutoSaveRef.current) {
      hasMountedAutoSaveRef.current = true;
      return;
    }
    autoSaveDirtyRef.current = true;
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      if (autoSaveDirtyRef.current) {
        flushAutoSave();
      }
    }, AUTO_SAVE_INTERVAL_MS);
  }, [lyrics, lyricsText, times, design, flushAutoSave]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (autoSaveDirtyRef.current) {
        flushAutoSave();
      }
    }, AUTO_SAVE_INTERVAL_MS);

    const handlePageHide = () => {
      if (autoSaveDirtyRef.current) {
        flushAutoSave();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && autoSaveDirtyRef.current) {
        flushAutoSave();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autoSaveDirtyRef.current) {
        flushAutoSave();
      } else if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [flushAutoSave]);

  // Ensure Bengali fonts load cleanly
  useEffect(() => {
    ensureStudioFontsLoaded();
  }, []);

  // Control background video playback and playbackRate when theme or speed changes
  useEffect(() => {
    const media = bgMediaRef.current;
    if (media instanceof HTMLVideoElement) {
      media.playbackRate = Math.min(2, Math.max(0.25, Number(design.bgSpeed) || 1));
      if (design.bgTheme === 'video') {
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    }
  }, [design.bgTheme, design.bgSpeed]);

  const effectiveTrim = useMemo(() => {
    const hasDur = Number.isFinite(duration) && duration > 0;
    const minStart = hasDur
      ? Math.max(0, Math.min(Math.max(0, duration - 0.5), Number(startTrim) || 0))
      : Math.max(0, Number(startTrim) || 0);
    const maxEnd = hasDur
      ? endTrim !== null && Number.isFinite(endTrim) && endTrim > minStart + 0.1
        ? Math.min(duration, endTrim)
        : duration
      : endTrim !== null && Number.isFinite(endTrim) && endTrim > minStart + 0.1
      ? endTrim
      : Infinity;
    return { start: minStart, end: maxEnd };
  }, [duration, startTrim, endTrim]);

  const trimControlRef = useRef({
    start: 0,
    end: Infinity,
    isRecording: false,
  });
  trimControlRef.current = {
    start: effectiveTrim.start,
    end: effectiveTrim.end,
    isRecording: renderingMode !== null,
  };

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const t = audio.currentTime || 0;
      const bounds = trimControlRef.current;
      if (!bounds.isRecording && !audio.paused) {
        if (t < bounds.start - 0.05) {
          audio.currentTime = bounds.start;
          setCurrentTime(bounds.start);
          return;
        }
        if (Number.isFinite(bounds.end) && bounds.end > bounds.start && t >= bounds.end) {
          audio.pause();
          audio.currentTime = bounds.end;
          setCurrentTime(bounds.end);
          return;
        }
      }
      setCurrentTime(t);
    };
    const handleMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      if (audio.getAttribute('src')) {
        showToast('অডিও ফাইল লোড করা যায়নি, অন্য ফাইল চেষ্টা করুন।', 'error');
      }
    };

    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('seeked', handleTime);
    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('durationchange', handleMeta);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('seeked', handleTime);
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('durationchange', handleMeta);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [showToast]);

  // Cleanup object URLs and active renders strictly on unmount
  useEffect(() => {
    return () => {
      if (recRafRef.current) cancelAnimationFrame(recRafRef.current);
      if (mp4AbortRef.current) mp4AbortRef.current.abort();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
      if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
    };
  }, []);

  const activePlayIdx = useMemo(
    () => findActiveLineIndex(times, currentTime),
    [times, currentTime]
  );

  // Live preview render loop
  useEffect(() => {
    let rafId = 0;

    const renderLoop = () => {
      const audioNow = audioRef.current?.currentTime || 0;
      const idx = findActiveLineIndex(times, audioNow);
      const hasAnySynced = times.some((t) => t !== null);

      let text = '';
      let nextText = '';
      let elapsed = 1;

      if (idx >= 0) {
        text = lyrics[idx] || '';
        nextText = lyrics[idx + 1] || '';
        elapsed = Math.max(0, audioNow - (times[idx] ?? 0));
      } else if (!hasAnySynced || activeTab === 'design' || isFullscreenPreviewOpen) {
        const previewIdx = Math.min(selectedIdx, Math.max(0, lyrics.length - 1));
        text = lyrics[previewIdx] || '';
        nextText = lyrics[previewIdx + 1] || '';
        elapsed = Math.max(0, (performance.now() - previewAnimStartRef.current) / 1000);
      }

      const targets = [previewCanvasRef.current, isFullscreenPreviewOpen ? fullscreenCanvasRef.current : null];
      for (const canvas of targets) {
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        drawScene({
          ctx,
          width: canvas.width,
          height: canvas.height,
          text,
          nextText,
          kind: 'lyric',
          design,
          bgMedia: bgMediaRef.current,
          elapsedSinceLineStart: elapsed,
        });
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [lyrics, times, design, activeTab, selectedIdx, isFullscreenPreviewOpen]);

  // Handlers
  const handleSelectAudioFile = (file: File) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    audioFileRef.current = file;
    audioUrlRef.current = nextUrl;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setAudioUrl(nextUrl);
    setAudioName(file.name);
    setAudioSizeMb((file.size / 1024 / 1024).toFixed(1));
    setStartTrim(0);
    setEndTrim(null);
    saveToStorage('startTrim', 0);
    saveToStorage('endTrim', null);
    audio.src = nextUrl;
    audio.load();
    showToast(`গান লোড হয়েছে: ${file.name}`, 'success');
  };

  const handleUpdateStartTrim = (sec: number) => {
    const safeSec = Number.isFinite(sec) ? Math.max(0, Number(sec.toFixed(2))) : 0;
    const maxAllowed =
      duration > 0 ? Math.max(0, Number((duration - 0.5).toFixed(2))) : safeSec;
    const clamped = Math.min(maxAllowed, safeSec);
    setStartTrim(clamped);
    saveToStorage('startTrim', clamped);
    const audio = audioRef.current;
    if (audio && audioUrl && audio.paused && (audio.currentTime || 0) < clamped) {
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const handleUpdateEndTrim = (sec: number | null) => {
    if (sec === null) {
      setEndTrim(null);
      saveToStorage('endTrim', null);
      return;
    }
    const safeSec = Number.isFinite(sec) ? Math.max(0, Number(sec.toFixed(2))) : 0;
    const clamped = duration > 0 ? Math.min(Number(duration.toFixed(2)), safeSec) : safeSec;
    setEndTrim(clamped);
    saveToStorage('endTrim', clamped);
    const audio = audioRef.current;
    if (
      audio &&
      audioUrl &&
      audio.paused &&
      clamped > effectiveTrim.start + 0.1 &&
      (audio.currentTime || 0) > clamped
    ) {
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const handleResetTrim = () => {
    setStartTrim(0);
    setEndTrim(null);
    saveToStorage('startTrim', 0);
    saveToStorage('endTrim', null);
    showToast('অডিও ট্রিম রিসেট হয়েছে।', 'info');
  };

  const handleSelectBgFile = (file: File) => {
    if (bgMediaRef.current instanceof HTMLVideoElement) {
      bgMediaRef.current.pause();
    }
    if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
    const url = URL.createObjectURL(file);
    bgUrlRef.current = url;
    setCustomMediaName(file.name);

    if (file.type.startsWith('video')) {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.playbackRate = Math.min(2, Math.max(0.25, Number(design.bgSpeed) || 1));
      video.src = url;
      bgMediaRef.current = video;
      updateDesign({ bgTheme: 'video' });
      video.play().catch(() => {});
      showToast(`ভিডিও ব্যাকগ্রাউন্ড সেট হয়েছে: ${file.name}`, 'success');
    } else {
      const img = new Image();
      img.onload = () => {
        bgMediaRef.current = img;
        updateDesign({ bgTheme: 'image' });
        showToast(`ছবি ব্যাকগ্রাউন্ড সেট হয়েছে: ${file.name}`, 'success');
      };
      img.onerror = () => {
        showToast('ছবিটি লোড করা যায়নি, অন্য ছবি চেষ্টা করুন।', 'error');
      };
      img.src = url;
    }
  };

  const parseAndApplyLyrics = useCallback(
    (navigateToSync: boolean) => {
      const nextLines = lyricsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (nextLines.length === 0) {
        showToast('আগে কিছু লিরিক লিখুন।', 'warning');
        return;
      }

      const nextTimes = nextLines.map((line, i) =>
        lyrics[i] === line && times[i] !== null ? times[i] : null
      );

      setLyrics(nextLines);
      setTimes(nextTimes);
      setSelectedIdx(0);
      saveToStorage('lyrics', nextLines);
      saveToStorage('times', nextTimes);

      if (navigateToSync) {
        setActiveTab('sync');
        showToast(`${nextLines.length}টি লাইন সিঙ্কের জন্য প্রস্তুত।`, 'success');
      }
    },
    [lyricsText, lyrics, times, showToast]
  );

  const handleSelectTab = (tab: StudioTab) => {
    setActiveTab(tab);
    if (tab !== 'lyrics' && lyrics.length === 0) {
      parseAndApplyLyrics(false);
    }
  };

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-29),
      { lyrics: [...lyrics], times: [...times], selectedIdx },
    ]);
  }, [lyrics, times, selectedIdx]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setLyrics(prev.lyrics);
    setTimes(prev.times);
    setSelectedIdx(prev.selectedIdx);
    setLyricsText(prev.lyrics.join('\n'));
    saveToStorage('lyrics', prev.lyrics);
    saveToStorage('times', prev.times);
    showToast('পূর্বের অবস্থায় ফিরে গেছে।', 'info');
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      showToast('আগে গান বাছাই করুন।', 'warning');
      return;
    }
    if (audio.paused) {
      const { start, end } = effectiveTrim;
      const cur = audio.currentTime || 0;
      if (cur < start || (Number.isFinite(end) && cur >= end - 0.05)) {
        audio.currentTime = start;
        setCurrentTime(start);
      }
      audio.play().catch(() => showToast('গান চালানো যায়নি।', 'error'));
    } else {
      audio.pause();
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    audio.currentTime = effectiveTrim.start;
    setCurrentTime(effectiveTrim.start);
    setSelectedIdx(0);
    audio.play().catch(() => {});
  };

  const handleSeekRelative = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    const minT = effectiveTrim.start;
    const maxT = Number.isFinite(effectiveTrim.end)
      ? effectiveTrim.end
      : Number.isFinite(audio.duration)
      ? audio.duration
      : 9999;
    audio.currentTime = Math.max(minT, Math.min(maxT, (audio.currentTime || minT) + delta));
  };

  const handleSeekAbsolute = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    const minT = effectiveTrim.start;
    const maxT = Number.isFinite(effectiveTrim.end) ? effectiveTrim.end : Infinity;
    audio.currentTime = Math.max(minT, Math.min(maxT, time));
  };

  const handleMarkLine = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      showToast('আগে গান বাছাই করুন।', 'warning');
      return;
    }
    if (lyrics.length === 0) {
      showToast('আগে লিরিক নিশ্চিত করুন।', 'warning');
      return;
    }
    pushUndo();
    const targetIdx = Math.min(selectedIdx, lyrics.length - 1);
    const updatedTimes = [...times];
    updatedTimes[targetIdx] = audio.currentTime || 0;
    setTimes(updatedTimes);
    saveToStorage('times', updatedTimes);
    if (targetIdx < lyrics.length - 1) {
      setSelectedIdx(targetIdx + 1);
    }
  };

  const handleInsertGap = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      showToast('আগে গান বাছাই করুন।', 'warning');
      return;
    }
    pushUndo();
    const insertAt = Math.min(selectedIdx, lyrics.length);
    const nextLyrics = [...lyrics];
    const nextTimes = [...times];
    nextLyrics.splice(insertAt, 0, '♪');
    nextTimes.splice(insertAt, 0, audio.currentTime || 0);
    setLyrics(nextLyrics);
    setTimes(nextTimes);
    setLyricsText(nextLyrics.join('\n'));
    setSelectedIdx(Math.min(insertAt + 1, nextLyrics.length));
    saveToStorage('lyrics', nextLyrics);
    saveToStorage('times', nextTimes);
    showToast('মিউজিক বিরতি (Gap) যোগ হয়েছে।', 'success');
  };

  const handleAdjustTime = (delta: number) => {
    const target =
      times[selectedIdx] !== null
        ? selectedIdx
        : selectedIdx > 0 && times[selectedIdx - 1] !== null
        ? selectedIdx - 1
        : -1;
    if (target < 0) {
      showToast('আগে কোনো লাইন সিংক বা সিলেক্ট করুন।', 'warning');
      return;
    }
    pushUndo();
    const updatedTimes = [...times];
    updatedTimes[target] = Math.max(0, (updatedTimes[target] || 0) + delta);
    setTimes(updatedTimes);
    saveToStorage('times', updatedTimes);
  };

  const handleBatchOffset = (offsetSec: number) => {
    if (!Number.isFinite(offsetSec) || offsetSec === 0) {
      showToast('সঠিক সেকেন্ডের মান দিন (যেমন: 0.5 বা -0.5)।', 'warning');
      return;
    }
    const syncedCount = times.filter((t) => t !== null).length;
    if (syncedCount === 0) {
      showToast('এখনো কোনো লাইন সিংক করা হয়নি।', 'warning');
      return;
    }
    pushUndo();
    const maxDuration =
      audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0
        ? audioRef.current.duration
        : Infinity;
    const updatedTimes = times.map((t) =>
      t === null
        ? null
        : Math.max(
            effectiveTrim.start,
            Math.min(effectiveTrim.end, Number((t + offsetSec).toFixed(3)))
          )
    );
    setTimes(updatedTimes);
    saveToStorage('times', updatedTimes);
    const label = offsetSec > 0 ? `+${offsetSec}s` : `${offsetSec}s`;
    setSyncMessage(`সকল ${syncedCount}টি সিংকড লাইনের সময় ${label} সরানো হয়েছে।`);
    showToast(`সব সিংকড লাইনের সময় ${label} পরিবর্তন হয়েছে।`, 'success');
  };

  const handleUpdateIntroSeconds = (sec: number) => {
    const safeSec = Number.isFinite(sec) ? Math.max(0, Number(sec.toFixed(2))) : 0;
    setIntroSeconds(safeSec);
    saveToStorage('introSeconds', safeSec);
  };

  const handleSetLineTimeManual = (idx: number, sec: number) => {
    if (idx < 0 || idx >= lyrics.length) return;
    if (!Number.isFinite(sec) || sec < 0) {
      showToast('সঠিক সময় (0 বা তার বেশি সেকেন্ড) দিন।', 'warning');
      return;
    }
    pushUndo();
    const updatedTimes = [...times];
    updatedTimes[idx] = Math.max(
      effectiveTrim.start,
      Math.min(effectiveTrim.end, Number(sec.toFixed(3)))
    );
    setTimes(updatedTimes);
    saveToStorage('times', updatedTimes);
    setSyncMessage(`লাইন #${idx + 1} এর সময় ${updatedTimes[idx]?.toFixed(1)}s সেট হয়েছে।`);
    showToast(`লাইন #${idx + 1} এর সময় সেট হয়েছে।`, 'success');
  };

  const handleAlignSyncToIntro = (customIntroSec?: number) => {
    const firstIdx = times.findIndex((t) => t !== null);
    if (firstIdx < 0) {
      showToast('আগে অন্তত ১টি লাইন সিংক করুন বা Auto Sync ব্যবহার করুন।', 'warning');
      return;
    }
    const rawTarget = customIntroSec !== undefined ? customIntroSec : introSeconds;
    const targetStart = effectiveTrim.start + Math.max(0, Number.isFinite(rawTarget) ? rawTarget : 0);
    const delta = targetStart - (times[firstIdx] as number);
    if (Math.abs(delta) < 0.001) {
      showToast(`১ম সিংকড লাইন ইতিমধ্যেই ${targetStart.toFixed(1)}s-এ আছে।`, 'info');
      return;
    }
    pushUndo();
    const updatedTimes = times.map((t) =>
      t === null
        ? null
        : Math.max(
            effectiveTrim.start,
            Math.min(effectiveTrim.end, Number((t + delta).toFixed(3)))
          )
    );
    setTimes(updatedTimes);
    saveToStorage('times', updatedTimes);
    setSyncMessage(
      `১ম সিংকড লাইন ${targetStart.toFixed(1)}s-এ এনে সব লাইনের সিংক ঠিক করা হয়েছে।`
    );
    showToast('ইন্ট্রো অনুযায়ী সিংক ঠিক করা হয়েছে!', 'success');
  };

  const handleAutoSync = (customIntroSec?: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      showToast('গান লোড হয়নি, duration পাওয়া যায়নি।', 'warning');
      return;
    }
    if (lyrics.length === 0) {
      showToast('আগে লিরিক নিশ্চিত করুন।', 'warning');
      return;
    }
    pushUndo();
    const trimStart = effectiveTrim.start;
    const trimEnd = Number.isFinite(effectiveTrim.end) ? effectiveTrim.end : audio.duration;
    const windowDur = Math.max(0.5, trimEnd - trimStart);
    const rawLead = customIntroSec !== undefined ? customIntroSec : introSeconds;
    const lead = Math.max(
      0,
      Math.min(Math.max(0, windowDur - 0.5), Number.isFinite(rawLead) ? rawLead : 0)
    );
    const tail = windowDur - lead > 4 ? 3 : 0;
    const total = Math.max(0.5, windowDur - lead - tail);
    const per = total / lyrics.length;
    const startAt = trimStart + lead;
    const nextTimes = lyrics.map((_, i) => Number((startAt + i * per).toFixed(3)));
    setTimes(nextTimes);
    setSelectedIdx(lyrics.length - 1);
    saveToStorage('times', nextTimes);
    setSyncMessage(
      `${trimStart.toFixed(1)}s–${trimEnd.toFixed(1)}s সীমায় শুরুর ${lead.toFixed(1)}s ইন্ট্রো রেখে ${lyrics.length}টি লাইন অটো সিংক হয়েছে।`
    );
    showToast(`অটো সিংক সম্পন্ন (${lead.toFixed(1)}s ইন্ট্রো)।`, 'success');
  };

  const handleJumpToLine = (idx: number) => {
    setSelectedIdx(idx);
    const t = times[idx];
    if (t !== null && audioRef.current && audioUrl) {
      audioRef.current.currentTime = t;
    }
  };

  // Global keyboard shortcuts for fast playback & synchronization
  const shortcutsRef = useRef({
    isLyricsAppActive: activeSuiteApp === 'lyrics',
    activeTab,
    isBusy: renderingMode !== null,
    lyricsCount: lyrics.length,
    togglePlay: handleTogglePlay,
    seekRelative: handleSeekRelative,
    markLine: handleMarkLine,
    insertGap: handleInsertGap,
    adjustTime: handleAdjustTime,
    undo: handleUndo,
    moveSelection: (delta: number) => {
      setSelectedIdx((prev) => {
        if (lyrics.length === 0) return 0;
        return Math.max(0, Math.min(lyrics.length - 1, prev + delta));
      });
    },
  });

  shortcutsRef.current = {
    isLyricsAppActive: activeSuiteApp === 'lyrics',
    activeTab,
    isBusy: renderingMode !== null,
    lyricsCount: lyrics.length,
    togglePlay: handleTogglePlay,
    seekRelative: handleSeekRelative,
    markLine: handleMarkLine,
    insertGap: handleInsertGap,
    adjustTime: handleAdjustTime,
    undo: handleUndo,
    moveSelection: (delta: number) => {
      setSelectedIdx((prev) => {
        if (lyrics.length === 0) return 0;
        return Math.max(0, Math.min(lyrics.length - 1, prev + delta));
      });
    },
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const cur = shortcutsRef.current;
      if (!cur.isLyricsAppActive || cur.isBusy) return;

      const keyLower = e.key.toLowerCase();
      if (e.altKey) return;

      // Allow Ctrl/Cmd+Z for Undo when on Sync/AutoSync tabs, ignore other Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        if (
          keyLower === 'z' &&
          !e.shiftKey &&
          (cur.activeTab === 'sync' || cur.activeTab === 'autosync') &&
          !e.repeat
        ) {
          e.preventDefault();
          cur.undo();
        }
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
          (target.closest('button') as HTMLElement | null)?.blur();
        }
        if (!e.repeat) {
          cur.togglePlay();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cur.seekRelative(e.shiftKey ? -1 : -5);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        cur.seekRelative(e.shiftKey ? 1 : 5);
        return;
      }

      if (keyLower === 'm') {
        if (!e.repeat) {
          e.preventDefault();
          cur.markLine();
        }
        return;
      }

      if (keyLower === 'g') {
        if (!e.repeat) {
          e.preventDefault();
          cur.insertGap();
        }
        return;
      }

      if (cur.activeTab === 'sync' || cur.activeTab === 'autosync') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          cur.moveSelection(-1);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cur.moveSelection(1);
          return;
        }
        if (e.key === '[') {
          e.preventDefault();
          cur.adjustTime(-0.1);
          return;
        }
        if (e.key === ']') {
          e.preventDefault();
          cur.adjustTime(0.1);
          return;
        }
        if (keyLower === 'z' && !e.repeat) {
          e.preventDefault();
          cur.undo();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Video Recording & Rendering
  const stopRecording = useCallback(() => {
    if (recRafRef.current) {
      cancelAnimationFrame(recRafRef.current);
      recRafRef.current = null;
    }
    audioRef.current?.pause();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
  }, []);

  const startMediaRecorderExport = useCallback(
    async (mode: 'mp4' | 'webm') => {
      const audio = audioRef.current;
      if (!audio || !audioUrl) return;
      const D = audio.duration;
      if (!D || !Number.isFinite(D)) {
        setRenderingMode(null);
        showToast('গান এখনো সম্পূর্ণ লোড হয়নি।', 'warning');
        return;
      }

      if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        setRenderingMode(null);
        showToast('এই ব্রাউজার ভিডিও রেকর্ডিং সাপোর্ট করে না।', 'error');
        return;
      }

      const mimeCandidates =
        mode === 'mp4'
          ? [
              'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
              'video/mp4;codecs=avc1,mp4a.40.2',
              'video/mp4;codecs=h264,aac',
              'video/mp4',
            ]
          : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      if (mode === 'mp4' && !mime) {
        setRenderingMode(null);
        setRecordProgress(0);
        setRecordStatus('');
        showToast(
          'এই ব্রাউজার MP4 এনকোডিং সাপোর্ট করে না। অনুগ্রহ করে Render WebM বা Chrome/Edge ব্যবহার করুন।',
          'error'
        );
        return;
      }

      // Initialize WebAudio graph once per audio element
      try {
        if (!audioGraphRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          const src = ctx.createMediaElementSource(audio);
          const dest = ctx.createMediaStreamDestination();
          src.connect(dest);
          src.connect(ctx.destination);
          audioGraphRef.current = { ctx, src, dest };
        }
        if (audioGraphRef.current.ctx.state === 'suspended') {
          await audioGraphRef.current.ctx.resume();
        }
      } catch {
        setRenderingMode(null);
        showToast('অডিও গ্রাফ সেটআপ করা যায়নি।', 'error');
        return;
      }

      await ensureStudioFontsLoaded();
      try {
        await document.fonts.ready;
      } catch {
        // Proceed even if font readiness rejects
      }

      if (design.bgTheme === 'video' && bgMediaRef.current instanceof HTMLVideoElement) {
        bgMediaRef.current.play().catch(() => {});
      }

      const [W, H] = EXPORT_DIMENSIONS[design.ratio];
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = W;
      renderCanvas.height = H;
      const renderCtx = renderCanvas.getContext('2d');
      if (!renderCtx) {
        setRenderingMode(null);
        return;
      }

      const stream = renderCanvas.captureStream(30);
      audioGraphRef.current.dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(
          stream,
          mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined
        );
      } catch {
        setRenderingMode(null);
        showToast('ভিডিও রেকর্ডার চালু করা যায়নি।', 'error');
        return;
      }

      const chunks: BlobPart[] = [];
      const introText = design.intro.trim();
      const outroText = design.outro.trim();
      const introDur = introText ? 3 : 0;
      const outroDur = outroText ? 3 : 0;

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      mr.onstop = () => {
        recorderRef.current = null;
        setRenderingMode(null);

        if (abortedRecordingRef.current) {
          abortedRecordingRef.current = false;
          setRecordProgress(0);
          setRecordStatus('');
          return;
        }

        const fallbackType = mode === 'mp4' ? 'video/mp4' : 'video/webm';
        const type = (mr.mimeType || mime || fallbackType).split(';')[0];
        const blob = new Blob(chunks, { type });
        if (!blob.size) {
          setRecordProgress(0);
          setRecordStatus('');
          showToast('ভিডিও ডেটা তৈরি হয়নি — অনুগ্রহ করে অন্য ফরম্যাট (WebM) চেষ্টা করুন।', 'error');
          return;
        }
        const ext = mode === 'mp4' || type.includes('mp4') ? 'mp4' : 'webm';

        if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
        const nextUrl = URL.createObjectURL(blob);
        recordedVideoUrlRef.current = nextUrl;

        setRecordProgress(100);
        setRecordedBlob(blob);
        setRecordedExt(ext);
        setRecordedVideoUrl(nextUrl);
        setRecordStatus(
          `${ext.toUpperCase()} ভিডিও তৈরি হয়েছে (${(blob.size / 1024 / 1024).toFixed(1)} MB)`
        );
        showToast(`${ext.toUpperCase()} ভিডিও রেন্ডার সম্পন্ন হয়েছে!`, 'success');
      };

      const trimStart = effectiveTrim.start;
      const trimEnd = Number.isFinite(effectiveTrim.end) ? effectiveTrim.end : D;
      const trimmedSongDur = Math.max(0.2, trimEnd - trimStart);

      abortedRecordingRef.current = false;
      recorderRef.current = mr;
      if (recordedVideoUrlRef.current) {
        URL.revokeObjectURL(recordedVideoUrlRef.current);
        recordedVideoUrlRef.current = null;
      }
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
      setRecordProgress(0);
      setRenderingMode(mode);
      audio.pause();
      audio.currentTime = trimStart;

      let phase: 'intro' | 'song' | 'outro' = introDur > 0 ? 'intro' : 'song';
      const t0 = performance.now();
      let t1 = 0;
      let startedSong = false;

      mr.start(250);
      if (phase === 'song') {
        startedSong = true;
        audio.play().catch(() => {
          abortedRecordingRef.current = true;
          showToast('গান চালানো যায়নি।', 'error');
          stopRecording();
        });
      }

      const tick = () => {
        if (!recorderRef.current || recorderRef.current.state === 'inactive') return;
        const now = performance.now();
        const totalDur = introDur + trimmedSongDur + outroDur;
        let text = '';
        let nextText = '';
        let kind: 'lyric' | 'title' = 'lyric';
        let prog = 0;
        let elapsed = 1;

        if (phase === 'intro') {
          const e = (now - t0) / 1000;
          if (e >= introDur) {
            phase = 'song';
            if (!startedSong) {
              startedSong = true;
              audio.currentTime = trimStart;
              audio.play().catch(() => {
                abortedRecordingRef.current = true;
                showToast('গান চালানো যায়নি।', 'error');
                stopRecording();
              });
            }
          } else {
            text = introText;
            kind = 'title';
            prog = e;
            elapsed = e;
          }
        }

        if (phase === 'song') {
          const t = audio.currentTime || trimStart;
          if (audio.ended || t >= trimEnd - 0.02) {
            audio.pause();
            if (outroDur > 0) {
              phase = 'outro';
              t1 = now;
            } else {
              stopRecording();
              return;
            }
          } else {
            const idx = findActiveLineIndex(times, t);
            text = idx >= 0 ? lyrics[idx] || '' : '';
            nextText = idx >= 0 ? lyrics[idx + 1] || '' : '';
            elapsed = idx >= 0 ? Math.max(0, t - (times[idx] ?? 0)) : 1;
            prog = introDur + Math.max(0, t - trimStart);
          }
        }

        if (phase === 'outro') {
          const e = (now - t1) / 1000;
          if (e >= outroDur) {
            stopRecording();
            return;
          }
          text = outroText;
          kind = 'title';
          prog = introDur + trimmedSongDur + e;
          elapsed = e;
        }

        drawScene({
          ctx: renderCtx,
          width: W,
          height: H,
          text,
          nextText,
          kind,
          design,
          bgMedia: bgMediaRef.current,
          elapsedSinceLineStart: elapsed,
          nowMs: now,
        });

        const pct = Math.min(100, totalDur > 0 ? (prog / totalDur) * 100 : 0);
        setRecordProgress(pct);
        setRecordStatus(
          `${mode.toUpperCase()} রেকর্ড চলছে… ${Math.floor(pct)}% (ট্যাব খোলা রাখুন)`
        );
        recRafRef.current = requestAnimationFrame(tick);
      };

      recRafRef.current = requestAnimationFrame(tick);
    },
    [audioUrl, design, effectiveTrim, lyrics, showToast, stopRecording, times]
  );

  const handleStartOrStopMp4 = async (forceUnsynced: boolean) => {
    if (renderingMode === 'mp4') {
      if (mp4AbortRef.current) {
        mp4AbortRef.current.abort();
      } else {
        abortedRecordingRef.current = true;
        stopRecording();
      }
      return;
    }
    if (renderingMode !== null) return;

    const audio = audioRef.current;
    const audioFile = audioFileRef.current;
    if (!audio || !audioUrl || !audioFile) {
      showToast('আগে গান বাছাই করুন।', 'warning');
      return;
    }
    if (lyrics.length === 0) {
      showToast('আগে লিরিক লিখুন।', 'warning');
      return;
    }
    if (!forceUnsynced && !times.some((t) => t !== null)) {
      setPendingUnsyncedMode('mp4');
      return;
    }
    setPendingUnsyncedMode(null);

    const D = audio.duration;
    if (!D || !Number.isFinite(D)) {
      showToast('গান এখনো সম্পূর্ণ লোড হয়নি।', 'warning');
      return;
    }

    audio.pause();
    if (recordedVideoUrlRef.current) {
      URL.revokeObjectURL(recordedVideoUrlRef.current);
      recordedVideoUrlRef.current = null;
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setRenderingMode('mp4');
    setRecordProgress(2);
    setRecordStatus('MP4 রেন্ডার শুরু হচ্ছে…');

    const controller = new AbortController();
    mp4AbortRef.current = controller;

    let handedOffToRecorder = false;
    try {
      const blob = await renderMp4WithWebCodecs({
        audioFile,
        audioDuration: D,
        startTrim: effectiveTrim.start,
        endTrim: Number.isFinite(effectiveTrim.end) ? effectiveTrim.end : null,
        lyrics,
        times,
        design,
        bgMedia: bgMediaRef.current,
        signal: controller.signal,
        onProgress: (pct, status) => {
          setRecordProgress(pct);
          setRecordStatus(status);
        },
      });

      if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
      const nextUrl = URL.createObjectURL(blob);
      recordedVideoUrlRef.current = nextUrl;

      setRecordProgress(100);
      setRecordedBlob(blob);
      setRecordedExt('mp4');
      setRecordedVideoUrl(nextUrl);
      setRecordStatus(`MP4 ভিডিও তৈরি হয়েছে (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
      showToast('MP4 ভিডিও রেন্ডার সম্পন্ন হয়েছে!', 'success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRecordProgress(0);
        setRecordStatus('');
        showToast('MP4 রেন্ডার বাতিল করা হয়েছে।', 'info');
      } else if (err instanceof Error && err.message === 'WEBCODECS_UNSUPPORTED') {
        handedOffToRecorder = true;
        mp4AbortRef.current = null;
        await startMediaRecorderExport('mp4');
      } else {
        setRecordProgress(0);
        setRecordStatus('');
        showToast('MP4 রেন্ডার করা যায়নি। অনুগ্রহ করে Render WebM চেষ্টা করুন।', 'error');
      }
    } finally {
      if (!handedOffToRecorder) {
        mp4AbortRef.current = null;
        setRenderingMode(null);
      }
      if (design.bgTheme === 'video' && bgMediaRef.current instanceof HTMLVideoElement) {
        bgMediaRef.current.play().catch(() => {});
      }
    }
  };

  const handleStartOrStopWebm = async (forceUnsynced: boolean) => {
    if (renderingMode === 'webm') {
      abortedRecordingRef.current = false;
      stopRecording();
      return;
    }
    if (renderingMode !== null) return;

    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      showToast('আগে গান বাছাই করুন।', 'warning');
      return;
    }
    if (lyrics.length === 0) {
      showToast('আগে লিরিক লিখুন।', 'warning');
      return;
    }
    if (!forceUnsynced && !times.some((t) => t !== null)) {
      setPendingUnsyncedMode('webm');
      return;
    }
    setPendingUnsyncedMode(null);

    await startMediaRecorderExport('webm');
  };

  const canShareVideo = useMemo(() => {
    return Boolean(recordedBlob && typeof navigator.share === 'function');
  }, [recordedBlob]);

  const saveBlobViaAndroidBridge = useCallback(
    (blob: Blob, filename: string): boolean => {
      const bridge = (
        window as unknown as {
          AndroidBridge?: {
            startFileSave?: (name: string, mime: string) => string;
            appendFileChunk?: (id: string, chunk: string) => void;
            finishFileSave?: (id: string) => void;
          };
        }
      ).AndroidBridge;
      if (!bridge || typeof bridge.startFileSave !== 'function') return false;
      showToast('ফোনের Downloads/TanvirCreativeStudio ফোল্ডারে সেভ হচ্ছে…', 'info');
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const res = String(reader.result || '');
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          const id = bridge.startFileSave!(filename, blob.type || 'application/octet-stream');
          const chunkSize = 262144;
          for (let i = 0; i < b64.length; i += chunkSize) {
            bridge.appendFileChunk?.(id, b64.slice(i, i + chunkSize));
          }
          bridge.finishFileSave?.(id);
          showToast(`সেভ সম্পন্ন: ${filename}`, 'success');
        } catch {
          showToast('Android ফোল্ডারে সেভ করা যায়নি।', 'error');
        }
      };
      reader.readAsDataURL(blob);
      return true;
    },
    [showToast]
  );

  const handleDownloadRecordedVideo = useCallback(async () => {
    if (!recordedBlob || !recordedBlob.size) {
      showToast('আগে ভিডিও রেন্ডার করুন।', 'warning');
      return;
    }
    const filename = `lyric-video.${recordedExt}`;
    if (saveBlobViaAndroidBridge(recordedBlob, filename)) return;

    const pickerWindow = window as unknown as {
      showSaveFilePicker?: (opts: {
        suggestedName: string;
        types?: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<{
        createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
      }>;
    };
    if (typeof pickerWindow.showSaveFilePicker === 'function' && window.self === window.top) {
      try {
        const mime = recordedExt === 'mp4' ? 'video/mp4' : 'video/webm';
        const handle = await pickerWindow.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: `${recordedExt.toUpperCase()} Video`, accept: { [mime]: [`.${recordedExt}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(recordedBlob);
        await writable.close();
        showToast(`${recordedExt.toUpperCase()} ভিডিও সেভ সম্পন্ন হয়েছে!`, 'success');
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Fall through to forced octet-stream blob download
      }
    }

    triggerBlobDownload(recordedBlob, filename, true);
    showToast(`${recordedExt.toUpperCase()} ডাউনলোড শুরু হয়েছে… (না হলে বিকল্প ডাউনলোড চাপুন)`, 'success');
  }, [recordedBlob, recordedExt, saveBlobViaAndroidBridge, showToast]);

  const handleDownloadRecordedVideoAlt = useCallback(() => {
    if (!recordedBlob || !recordedBlob.size) {
      showToast('আগে ভিডিও রেন্ডার করুন।', 'warning');
      return;
    }
    const filename = `lyric-video.${recordedExt}`;
    if (saveBlobViaAndroidBridge(recordedBlob, filename)) return;
    if (recordedBlob.size > 48 * 1024 * 1024) {
      showToast(
        `ফাইলটি বড় (${(recordedBlob.size / 1024 / 1024).toFixed(1)} MB) — বিকল্প ডাউনলোড চেষ্টা হচ্ছে, না হলে শেয়ার বা GitHub APK ব্যবহার করুন।`,
        'warning'
      );
    } else {
      showToast('বিকল্প ডাউনলোড (APK / WebView) প্রস্তুত হচ্ছে…', 'info');
    }
    triggerDataUrlDownload(recordedBlob, filename, (ok) => {
      if (ok) {
        showToast(`বিকল্প ডাউনলোড পাঠানো হয়েছে: ${filename}`, 'success');
      } else {
        showToast('বিকল্প ডাউনলোড ব্লক হয়েছে — শেয়ার বাটন বা GitHub APK ব্যবহার করুন।', 'error');
      }
    });
  }, [recordedBlob, recordedExt, saveBlobViaAndroidBridge, showToast]);

  const handleShareVideo = async () => {
    if (!recordedBlob || !navigator.share) return;
    try {
      await navigator.share({
        files: [
          new File([recordedBlob], `lyric-video.${recordedExt}`, {
            type: recordedBlob.type || (recordedExt === 'mp4' ? 'video/mp4' : 'video/webm'),
          }),
        ],
        title: `lyric-video.${recordedExt}`,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast('এই ব্রাউজার/WebView-তে ভিডিও শেয়ার সাপোর্ট নেই — বিকল্প ডাউনলোড ব্যবহার করুন।', 'warning');
    }
  };

  const handleSaveLrc = () => {
    const pairs: Array<{ t: number; line: string }> = [];
    lyrics.forEach((line, i) => {
      const t = times[i];
      if (t !== null && line !== '♪') pairs.push({ t, line });
    });
    if (pairs.length === 0) {
      showToast('এখনো কোনো লাইন সিংক করা হয়নি।', 'warning');
      return;
    }
    pairs.sort((a, b) => a.t - b.t);
    const lrc = pairs.map((p) => `${formatLrcTime(p.t)}${p.line}`).join('\n') + '\n';
    setLrcPreview(lrc);
    triggerBlobDownload(new Blob([lrc], { type: 'text/plain' }), 'lyrics.lrc');
    showToast('LRC ফাইল ডাউনলোড হয়েছে।', 'success');
  };

  const handleSaveProject = () => {
    const ok = flushAutoSave();
    showToast(
      ok ? 'প্রজেক্ট ব্রাউজারে সেভ হয়েছে।' : 'সেভ করা যায়নি (স্টোরেজ সীমাবদ্ধ)।',
      ok ? 'success' : 'warning'
    );
  };

  const handleExportProjectJson = () => {
    const payload = {
      version: 1,
      app: 'lyric-studio',
      exportedAt: new Date().toISOString(),
      lyrics,
      times,
      introSeconds,
      startTrim,
      endTrim,
      design: {
        ...design,
        bgTheme: design.bgTheme === 'image' || design.bgTheme === 'video' ? 'rain' : design.bgTheme,
      },
    };
    const json = JSON.stringify(payload, null, 2);
    triggerBlobDownload(
      new Blob([json], { type: 'application/json;charset=utf-8' }),
      'lyric-studio-project.json'
    );
    showToast('প্রজেক্ট JSON ফাইল ডাউনলোড হয়েছে!', 'success');
  };

  const handleImportProjectJson = async (file: File) => {
    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid project structure');
      }

      const hasLyrics = Array.isArray(parsed.lyrics);
      const hasTimes = Array.isArray(parsed.times);
      const hasDesign = Boolean(parsed.design && typeof parsed.design === 'object');
      if (!hasLyrics && !hasTimes && !hasDesign) {
        throw new Error('Missing project fields');
      }

      pushUndo();

      const nextLyrics = hasLyrics
        ? (parsed.lyrics as unknown[]).map((l) => String(l).trim()).filter(Boolean)
        : lyrics;

      const rawTimes = hasTimes ? (parsed.times as unknown[]) : times;
      const nextTimes: Array<number | null> = nextLyrics.map((_, i) => {
        const val = rawTimes[i];
        return typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : null;
      });

      const nextDesign = hasDesign
        ? sanitizeDesignConfig(parsed.design as Partial<DesignConfig>)
        : design;

      const rawIntro = parsed.introSeconds;
      const nextIntro =
        typeof rawIntro === 'number' && Number.isFinite(rawIntro) && rawIntro >= 0
          ? Number(rawIntro.toFixed(2))
          : introSeconds;
      const nextStartTrim =
        typeof parsed.startTrim === 'number' && Number.isFinite(parsed.startTrim) && parsed.startTrim >= 0
          ? Number(parsed.startTrim.toFixed(2))
          : 0;
      const nextEndTrim =
        typeof parsed.endTrim === 'number' && Number.isFinite(parsed.endTrim) && parsed.endTrim > 0
          ? Number(parsed.endTrim.toFixed(2))
          : null;

      if (bgMediaRef.current instanceof HTMLVideoElement) {
        bgMediaRef.current.pause();
      }
      if (bgUrlRef.current) {
        URL.revokeObjectURL(bgUrlRef.current);
        bgUrlRef.current = null;
      }
      bgMediaRef.current = null;
      setCustomMediaName('');

      setLyrics(nextLyrics);
      setLyricsText(nextLyrics.join('\n'));
      setTimes(nextTimes);
      setDesign(nextDesign);
      setIntroSeconds(nextIntro);
      setStartTrim(nextStartTrim);
      setEndTrim(nextEndTrim);
      setSelectedIdx(0);
      setLrcPreview('');
      setSyncMessage(`প্রজেক্ট লোড হয়েছে (${nextLyrics.length} লাইন)।`);

      saveToStorage('lyrics', nextLyrics);
      saveToStorage('times', nextTimes);
      saveToStorage('design', nextDesign);
      saveToStorage('introSeconds', nextIntro);
      saveToStorage('startTrim', nextStartTrim);
      saveToStorage('endTrim', nextEndTrim);

      showToast(`প্রজেক্ট সফলভাবে লোড হয়েছে (${nextLyrics.length} লাইন)!`, 'success');
    } catch {
      showToast('সঠিক প্রজেক্ট .json ফাইল বাছাই করুন।', 'error');
    }
  };

  // Fixes hardcoded 1280x720 thumbnail bug: uses exact EXPORT_DIMENSIONS[design.ratio]
  const handleMakeThumbnail = () => {
    const [W, H] = EXPORT_DIMENSIONS[design.ratio];
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const sampleLine = lyrics.find((l) => l && l !== '♪') || 'লিরিক স্টুডিও';
    drawScene({
      ctx,
      width: W,
      height: H,
      text: sampleLine,
      kind: 'lyric',
      design,
      bgMedia: bgMediaRef.current,
      elapsedSinceLineStart: 1,
    });

    setThumbnailDataUrl(c.toDataURL('image/jpeg', 0.92));
    c.toBlob(
      (blob) => {
        if (blob) {
          triggerBlobDownload(blob, 'thumbnail.jpg');
          showToast(`থাম্বনেইল তৈরি হয়েছে (${W}×${H})।`, 'success');
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleRunDiagnostics = async () => {
    let lsOk = false;
    try {
      localStorage.setItem('_t', '1');
      localStorage.removeItem('_t');
      lsOk = true;
    } catch {
      lsOk = false;
    }
    let cvOk = false;
    try {
      cvOk = Boolean(document.createElement('canvas').getContext('2d'));
    } catch {
      cvOk = false;
    }
    const recOk =
      typeof MediaRecorder !== 'undefined' && Boolean(HTMLCanvasElement.prototype.captureStream);
    const [W, H] = EXPORT_DIMENSIONS[design.ratio];
    const webCodecsMp4Ok = await isWebCodecsMp4Supported(W, H);
    const nativeMp4Ok =
      typeof MediaRecorder !== 'undefined' &&
      ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'].some((m) => MediaRecorder.isTypeSupported(m));
    const mp4Ok = webCodecsMp4Ok || nativeMp4Ok;

    setDiagnostics([
      { label: 'Lyrics', ok: lyrics.length > 0, detail: 'লিরিক লিখুন' },
      { label: 'Audio', ok: Boolean(audioUrl), detail: 'গান বাছাই করুন' },
      { label: 'Synced Times', ok: times.some((t) => t !== null), detail: 'সিঙ্ক বা অটো ভাগ করুন' },
      { label: 'Canvas 2D', ok: cvOk, detail: 'Unsupported' },
      { label: 'localStorage', ok: lsOk, detail: 'Blocked' },
      {
        label: 'MP4 Encoder',
        ok: mp4Ok,
        detail: 'Use WebM or Chrome/Edge',
      },
      { label: 'WebM Recorder', ok: recOk, detail: 'Unsupported' },
    ]);
  };

  const handleSelectSuiteApp = useCallback((app: CreativeSuiteApp) => {
    setActiveSuiteApp(app);
    if (app !== 'lyrics') {
      audioRef.current?.pause();
      if (bgMediaRef.current instanceof HTMLVideoElement) {
        bgMediaRef.current.pause();
      }
      setLoadedSuiteApps((prev) => (prev[app] ? prev : { ...prev, [app]: true }));
    } else if (design.bgTheme === 'video' && bgMediaRef.current instanceof HTMLVideoElement) {
      bgMediaRef.current.play().catch(() => {});
    }
  }, [design.bgTheme]);

  // Receive translated lyrics directly from the Translator tab (p3)
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'TCS_STORAGE_SET' && typeof msg.key === 'string') {
        try {
          localStorage.setItem(msg.key, String(msg.value ?? ''));
        } catch {
          // Ignore storage restrictions
        }
        document.querySelectorAll('iframe').forEach((frame) => {
          try {
            if (frame.contentWindow && frame.contentWindow !== ev.source) {
              frame.contentWindow.postMessage(
                { type: 'TCS_STORAGE_SYNC', key: msg.key, value: String(msg.value ?? '') },
                '*'
              );
            }
          } catch {
            // Ignore cross-frame errors
          }
        });
        return;
      }
      if (msg.type === 'TCS_STORAGE_REMOVE' && typeof msg.key === 'string') {
        try {
          localStorage.removeItem(msg.key);
        } catch {
          // Ignore storage restrictions
        }
        document.querySelectorAll('iframe').forEach((frame) => {
          try {
            if (frame.contentWindow && frame.contentWindow !== ev.source) {
              frame.contentWindow.postMessage(
                { type: 'TCS_STORAGE_SYNC', key: msg.key, value: null },
                '*'
              );
            }
          } catch {
            // Ignore cross-frame errors
          }
        });
        return;
      }
      if (msg.type === 'TCS_DOWNLOAD_FILE' && msg.buffer) {
        const filename = typeof msg.name === 'string' && msg.name ? msg.name : 'studio-video.webm';
        const mime = typeof msg.mime === 'string' && msg.mime ? msg.mime : 'application/octet-stream';
        const blob = new Blob([msg.buffer], { type: mime });
        if (!saveBlobViaAndroidBridge(blob, filename)) {
          triggerBlobDownload(blob, filename, true);
          showToast(`ডাউনলোড শুরু হয়েছে: ${filename}`, 'success');
        }
        return;
      }
      if (msg.type === 'TCS_DOWNLOAD_DATA_URL' && typeof msg.dataUrl === 'string' && msg.dataUrl.startsWith('data:')) {
        const filename = typeof msg.name === 'string' && msg.name ? msg.name : 'studio-video.webm';
        const a = document.createElement('a');
        a.href = msg.dataUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        window.setTimeout(() => {
          try {
            a.remove();
          } catch {
            // ignore
          }
        }, 4000);
        showToast(`বিকল্প ডাউনলোড পাঠানো হয়েছে: ${filename}`, 'success');
        return;
      }
      if (msg.type === 'TCS_SEND_LYRICS_TO_STUDIO' && typeof msg.text === 'string' && msg.text.trim()) {
        const nextLines = msg.text
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean);
        if (nextLines.length === 0) return;
        const nextTimes = nextLines.map(() => null);
        setLyricsText(nextLines.join('\n'));
        setLyrics(nextLines);
        setTimes(nextTimes);
        setSelectedIdx(0);
        saveToStorage('lyrics', nextLines);
        saveToStorage('times', nextTimes);
        setActiveSuiteApp('lyrics');
        setActiveTab('lyrics');
        showToast(`ট্রান্সলেটর থেকে ${nextLines.length}টি লিরিক লাইন লোড হয়েছে!`, 'success');
      }
    };
    const w = window as unknown as {
      __TCS_TRIGGER_DOWNLOAD__?: (blob: Blob, name: string) => void;
      __TCS_TRIGGER_DATA_URL__?: (dataUrl: string, name: string) => void;
    };
    w.__TCS_TRIGGER_DOWNLOAD__ = (blob: Blob, name: string) => {
      if (!saveBlobViaAndroidBridge(blob, name)) {
        triggerBlobDownload(blob, name, true);
      }
    };
    w.__TCS_TRIGGER_DATA_URL__ = (dataUrl: string, name: string) => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => {
        try {
          a.remove();
        } catch {
          // ignore
        }
      }, 4000);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      delete w.__TCS_TRIGGER_DOWNLOAD__;
      delete w.__TCS_TRIGGER_DATA_URL__;
    };
  }, [saveBlobViaAndroidBridge, showToast]);

  const handleDownloadFixedHtml = async () => {
    try {
      const res = await fetch(`/lyric-studio-fixed.html?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Fetch failed');
      const htmlText = await res.text();
      triggerBlobDownload(
        new Blob([htmlText], { type: 'application/octet-stream' }),
        'lyric-studio-fixed.html'
      );
      showToast('লিরিক স্টুডিও HTML ডাউনলোড হয়েছে!', 'success');
    } catch {
      showToast('HTML ফাইল ডাউনলোড করা যায়নি।', 'error');
    }
  };

  const handleDownloadAllInOneHtml = async () => {
    try {
      const res = await fetch(`/tanvir-creative-studio-all-in-one.html?v=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Fetch failed');
      const htmlText = await res.text();
      triggerBlobDownload(
        new Blob([htmlText], { type: 'application/octet-stream' }),
        'Tanvir_Creative_Studio_All_in_One.html'
      );
      showToast('All-in-One HTML ফাইল (৪টি অ্যাপ সহ) ডাউনলোড হয়েছে!', 'success');
    } catch {
      showToast('All-in-One HTML ডাউনলোড করা যায়নি।', 'error');
    }
  };

  const handleDownloadApkZip = async () => {
    try {
      const res = await fetch(`/tanvir-creative-studio-github-apk.zip?v=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Fetch failed');
      const zipBuf = await res.arrayBuffer();
      triggerBlobDownload(
        new Blob([zipBuf], { type: 'application/octet-stream' }),
        'tanvir-creative-studio-github-apk.zip'
      );
      showToast('All-in-One GitHub APK প্রজেক্ট (.zip) ডাউনলোড শুরু হয়েছে!', 'success');
    } catch {
      showToast('APK ZIP ফাইল ডাউনলোড করা যায়নি।', 'error');
    }
  };

  const syncedCount = times.filter((t) => t !== null).length;

  return (
    <div className="min-h-screen bg-[#090b12] text-[#eef1f8] pb-20 lg:pb-10">
      <audio ref={audioRef} className="hidden" />

      <TopBar
        activeSuiteApp={activeSuiteApp}
        activeTab={activeTab}
        onSelectSuiteApp={handleSelectSuiteApp}
        onSelectTab={handleSelectTab}
        onDownloadAllInOneHtml={handleDownloadAllInOneHtml}
        onDownloadApkZip={handleDownloadApkZip}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md transition-opacity ${
            toast.tone === 'error'
              ? 'border-[#ef4444]/60 bg-[#241215]/95 text-[#fca5a5]'
              : toast.tone === 'warning'
              ? 'border-[#f59e0b]/60 bg-[#241c12]/95 text-[#fcd34d]'
              : toast.tone === 'success'
              ? 'border-[#2de18a]/50 bg-[#10241c]/95 text-[#6ee7b7]'
              : 'border-[#2c3554] bg-[#161c30]/95 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Embedded Companion Apps from Tanvir's Creative Studio (preserved in DOM once opened) */}
      {loadedSuiteApps.cinema && (
        <div
          className={
            activeSuiteApp === 'cinema'
              ? 'mx-auto max-w-7xl px-2 sm:px-6 pt-3'
              : 'hidden'
          }
        >
          <iframe
            title="CinemaMaster AI Director"
            src="/studio-modules/p1.html"
            allow="clipboard-write"
            className="w-full h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-[#1e2438] bg-[#090b12]"
          />
        </div>
      )}

      {loadedSuiteApps.intro && (
        <div
          className={
            activeSuiteApp === 'intro'
              ? 'mx-auto max-w-7xl px-2 sm:px-6 pt-3'
              : 'hidden'
          }
        >
          <iframe
            title="Intro / Outro Maker"
            src="/studio-modules/p2.html"
            allow="clipboard-write; screen-wake-lock"
            className="w-full h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-[#1e2438] bg-[#07070b]"
          />
        </div>
      )}

      {loadedSuiteApps.translator && (
        <div
          className={
            activeSuiteApp === 'translator'
              ? 'mx-auto max-w-7xl px-2 sm:px-6 pt-3'
              : 'hidden'
          }
        >
          <iframe
            title="লিরিক ট্রান্সলেটর"
            src="/studio-modules/p3.html"
            allow="clipboard-write"
            className="w-full h-[calc(100vh-140px)] min-h-[640px] rounded-2xl border border-[#1e2438] bg-[#0b0f19]"
          />
        </div>
      )}

      <main
        className={`mx-auto max-w-7xl px-4 pt-5 sm:px-6 ${
          activeSuiteApp === 'lyrics' ? 'block' : 'hidden'
        }`}
      >
        <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left column: Sticky Live Preview Stage on Desktop AND Sticky Compact on Mobile during Manual Sync / Design */}
          <div
            className={`lg:col-span-6 lg:sticky lg:top-28 ${
              activeTab === 'sync' || activeTab === 'design'
                ? 'sticky top-[106px] sm:top-[96px] z-20 block'
                : activeTab === 'autosync'
                ? 'block'
                : 'hidden lg:block'
            }`}
          >
            <PreviewStage
              canvasRef={previewCanvasRef}
              ratio={design.ratio}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              hasAudio={Boolean(audioUrl)}
              syncedCount={syncedCount}
              totalLines={lyrics.length}
              compact={activeTab === 'sync' || activeTab === 'design'}
              onTogglePlay={handleTogglePlay}
              onRestart={handleRestart}
              onSeekRelative={handleSeekRelative}
              onSeekAbsolute={handleSeekAbsolute}
            />
          </div>

          {/* Right column: Active Studio Step Panel */}
          <div className="lg:col-span-6">
            {activeTab === 'lyrics' && (
              <AudioLyricsTab
                audioName={audioName}
                audioSizeMb={audioSizeMb}
                hasAudio={Boolean(audioUrl)}
                audioDuration={duration}
                currentAudioTime={currentTime}
                startTrim={startTrim}
                endTrim={endTrim}
                lyricsText={lyricsText}
                lineCount={lyricsText.split('\n').filter((l) => l.trim()).length}
                onSelectAudioFile={handleSelectAudioFile}
                onUpdateStartTrim={handleUpdateStartTrim}
                onUpdateEndTrim={handleUpdateEndTrim}
                onResetTrim={handleResetTrim}
                onLyricsTextChange={setLyricsText}
                onConfirmLyrics={() => parseAndApplyLyrics(true)}
              />
            )}

            {activeTab === 'sync' && (
              <SyncTab
                lyrics={lyrics}
                times={times}
                selectedIdx={selectedIdx}
                activePlayIdx={activePlayIdx}
                hasAudio={Boolean(audioUrl)}
                canUndo={undoStack.length > 0}
                syncMessage={syncMessage}
                onSelectLine={setSelectedIdx}
                onJumpToLine={handleJumpToLine}
                onMarkLine={handleMarkLine}
                onInsertGap={handleInsertGap}
                onAdjustTime={handleAdjustTime}
                onUndo={handleUndo}
                onOpenAutoSync={() => setActiveTab('autosync')}
              />
            )}

            {activeTab === 'autosync' && (
              <AutoSyncTab
                lyrics={lyrics}
                times={times}
                selectedIdx={selectedIdx}
                activePlayIdx={activePlayIdx}
                hasAudio={Boolean(audioUrl)}
                currentAudioTime={currentTime}
                introSeconds={introSeconds}
                canUndo={undoStack.length > 0}
                syncMessage={syncMessage}
                onSelectLine={setSelectedIdx}
                onJumpToLine={handleJumpToLine}
                onBatchOffset={handleBatchOffset}
                onUpdateIntroSeconds={handleUpdateIntroSeconds}
                onAlignSyncToIntro={handleAlignSyncToIntro}
                onSetLineTimeManual={handleSetLineTimeManual}
                onUndo={handleUndo}
                onAutoSync={handleAutoSync}
                onOpenManualSync={() => setActiveTab('sync')}
              />
            )}

            {activeTab === 'design' && (
              <DesignTab
                design={design}
                customMediaName={customMediaName}
                onUpdateDesign={updateDesign}
                onSelectBgFile={handleSelectBgFile}
                onOpenFullscreenPreview={() => setIsFullscreenPreviewOpen(true)}
              />
            )}

            {activeTab === 'export' && (
              <ExportTab
                design={design}
                renderingMode={renderingMode}
                recordProgress={recordProgress}
                recordStatus={recordStatus}
                recordedVideoUrl={recordedVideoUrl}
                recordedExt={recordedExt}
                canShareVideo={canShareVideo}
                pendingUnsyncedMode={pendingUnsyncedMode}
                lrcPreview={lrcPreview}
                thumbnailDataUrl={thumbnailDataUrl}
                diagnostics={diagnostics}
                onUpdateDesign={updateDesign}
                onStartOrStopMp4={handleStartOrStopMp4}
                onStartOrStopWebm={handleStartOrStopWebm}
                onCancelUnsyncedConfirm={() => setPendingUnsyncedMode(null)}
                onDownloadVideo={handleDownloadRecordedVideo}
                onDownloadVideoAlt={handleDownloadRecordedVideoAlt}
                onShareVideo={handleShareVideo}
                onSaveLrc={handleSaveLrc}
                onSaveProject={handleSaveProject}
                onExportProjectJson={handleExportProjectJson}
                onImportProjectJson={handleImportProjectJson}
                onMakeThumbnail={handleMakeThumbnail}
                onRunDiagnostics={handleRunDiagnostics}
                onDownloadFixedHtml={handleDownloadFixedHtml}
                onDownloadAllInOneHtml={handleDownloadAllInOneHtml}
                onDownloadApkZip={handleDownloadApkZip}
              />
            )}
          </div>
        </div>
      </main>

      {activeSuiteApp === 'lyrics' && (
        <MobileBottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />
      )}

      <FullscreenPreviewModal
        isOpen={isFullscreenPreviewOpen}
        canvasRef={fullscreenCanvasRef}
        ratio={design.ratio}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        hasAudio={Boolean(audioUrl)}
        onClose={() => setIsFullscreenPreviewOpen(false)}
        onTogglePlay={handleTogglePlay}
        onRestart={handleRestart}
        onSeekRelative={handleSeekRelative}
        onSeekAbsolute={handleSeekAbsolute}
      />
    </div>
  );
}
