import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { DesignConfig, EXPORT_DIMENSIONS } from '../types/studio';
import { drawScene, ensureStudioFontsLoaded } from './canvasRenderer';
import { findActiveLineIndex } from './storage';

export interface Mp4ExportOptions {
  audioFile: File;
  audioDuration: number;
  startTrim?: number;
  endTrim?: number | null;
  lyrics: string[];
  times: Array<number | null>;
  design: DesignConfig;
  bgMedia: HTMLImageElement | HTMLVideoElement | null;
  signal: AbortSignal;
  onProgress: (pct: number, status: string) => void;
}

const H264_CODEC_CANDIDATES = [
  'avc1.4d002a', // Main Profile Level 4.2 (1080p/720p)
  'avc1.42001f', // Baseline Profile Level 3.1
  'avc1.42E01E', // Baseline Profile Level 3.0
  'avc1.640028', // High Profile Level 4.0
];

async function findSupportedVideoConfig(
  width: number,
  height: number,
  fps: number
): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null;

  for (const codec of H264_CODEC_CANDIDATES) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: 5_000_000,
      framerate: fps,
      avc: { format: 'avc' },
    };
    try {
      const support = await VideoEncoder.isConfigSupported(config);
      if (support.supported) {
        return support.config ?? config;
      }
    } catch {
      // Try next profile
    }
  }
  return null;
}

async function findSupportedAudioConfig(): Promise<{
  muxerCodec: 'aac' | 'opus';
  encoderConfig: AudioEncoderConfig;
} | null> {
  if (typeof AudioEncoder === 'undefined') return null;

  const candidates: Array<{ muxerCodec: 'aac' | 'opus'; config: AudioEncoderConfig }> = [
    {
      muxerCodec: 'aac',
      config: {
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 192_000,
      },
    },
    {
      muxerCodec: 'aac',
      config: {
        codec: 'mp4a.40.2',
        numberOfChannels: 2,
        sampleRate: 44100,
        bitrate: 192_000,
      },
    },
    {
      muxerCodec: 'opus',
      config: {
        codec: 'opus',
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 160_000,
      },
    },
  ];

  for (const item of candidates) {
    try {
      const support = await AudioEncoder.isConfigSupported(item.config);
      if (support.supported) {
        return {
          muxerCodec: item.muxerCodec,
          encoderConfig: support.config ?? item.config,
        };
      }
    } catch {
      // Try next audio codec
    }
  }
  return null;
}

async function decodeAndResampleAudio(
  audioFile: File,
  targetSampleRate: number,
  targetChannels: number
): Promise<AudioBuffer> {
  const arrayBuf = await audioFile.arrayBuffer();
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const decodeCtx = new AudioCtx();
  try {
    const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
    if (
      decoded.sampleRate === targetSampleRate &&
      decoded.numberOfChannels === targetChannels
    ) {
      return decoded;
    }

    const length = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));
    const offline = new OfflineAudioContext(targetChannels, length, targetSampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    return await offline.startRendering();
  } finally {
    await decodeCtx.close().catch(() => {});
  }
}

async function seekVideoToTime(video: HTMLVideoElement, timeSec: number): Promise<void> {
  const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  if (dur <= 0) return;
  const target = ((timeSec % dur) + dur) % dur;
  if (Math.abs(video.currentTime - target) < 0.015) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('seeked', done);
      resolve();
    };
    video.addEventListener('seeked', done, { once: true });
    video.currentTime = target;
    window.setTimeout(done, 150);
  });
}

export async function isWebCodecsMp4Supported(
  width: number,
  height: number
): Promise<boolean> {
  const v = await findSupportedVideoConfig(width, height, 30);
  const a = await findSupportedAudioConfig();
  return Boolean(v && a);
}

export async function renderMp4WithWebCodecs({
  audioFile,
  audioDuration,
  startTrim = 0,
  endTrim = null,
  lyrics,
  times,
  design,
  bgMedia,
  signal,
  onProgress,
}: Mp4ExportOptions): Promise<Blob> {
  const [width, height] = EXPORT_DIMENSIONS[design.ratio];
  const fps = 30;

  const videoConfig = await findSupportedVideoConfig(width, height, fps);
  const audioSupport = await findSupportedAudioConfig();

  if (!videoConfig || !audioSupport) {
    throw new Error('WEBCODECS_UNSUPPORTED');
  }

  await ensureStudioFontsLoaded();
  try {
    await document.fonts.ready;
  } catch {
    // Proceed even if font readiness rejects
  }

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  onProgress(2, 'অডিও ডিকোড করা হচ্ছে…');

  const sampleRate = audioSupport.encoderConfig.sampleRate;
  const channels = audioSupport.encoderConfig.numberOfChannels;
  const resampledBuffer = await decodeAndResampleAudio(audioFile, sampleRate, channels);

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const introText = design.intro.trim();
  const outroText = design.outro.trim();
  const introDur = introText ? 3 : 0;
  const outroDur = outroText ? 3 : 0;
  const fullSongDur = Number.isFinite(resampledBuffer.duration) && resampledBuffer.duration > 0
    ? resampledBuffer.duration
    : audioDuration;
  const trimStart = Math.max(0, Math.min(Math.max(0, fullSongDur - 0.2), Number(startTrim) || 0));
  const trimEnd =
    endTrim !== null && endTrim !== undefined && Number.isFinite(endTrim) && endTrim > trimStart + 0.1
      ? Math.min(fullSongDur, endTrim)
      : fullSongDur;
  const songDur = Math.max(0.2, trimEnd - trimStart);
  const totalDur = introDur + songDur + outroDur;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
      frameRate: fps,
    },
    audio: {
      codec: audioSupport.muxerCodec,
      numberOfChannels: channels,
      sampleRate,
    },
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure(videoConfig);
  audioEncoder.configure(audioSupport.encoderConfig);

  try {
    // 1. Encode Audio Track (Intro silence + Song audio + Outro silence)
    onProgress(8, 'অডিও MP4 ট্র্যাকে এনকোড হচ্ছে…');

    const totalAudioFrames = Math.ceil(totalDur * sampleRate);
    const introSamples = Math.round(introDur * sampleRate);
    const trimStartSample = Math.min(resampledBuffer.length, Math.round(trimStart * sampleRate));
    const trimEndSample = Math.min(resampledBuffer.length, Math.round(trimEnd * sampleRate));
    const chunkFrames = 4096;

    const channelArrays: Float32Array[] = [];
    for (let c = 0; c < channels; c++) {
      channelArrays.push(
        resampledBuffer.getChannelData(Math.min(c, resampledBuffer.numberOfChannels - 1))
      );
    }

    for (let offset = 0; offset < totalAudioFrames; offset += chunkFrames) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (encoderError) throw encoderError;

      const framesInChunk = Math.min(chunkFrames, totalAudioFrames - offset);
      const planar = new Float32Array(framesInChunk * channels);

      for (let c = 0; c < channels; c++) {
        const src = channelArrays[c];
        const dstStart = c * framesInChunk;
        const songStartInChunk = Math.max(0, introSamples - offset);
        const songSampleOffset = Math.max(0, offset - introSamples);
        const srcStart = trimStartSample + songSampleOffset;
        const copyLen = Math.min(
          framesInChunk - songStartInChunk,
          Math.max(0, trimEndSample - srcStart)
        );
        if (copyLen > 0) {
          planar.set(src.subarray(srcStart, srcStart + copyLen), dstStart + songStartInChunk);
        }
      }

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: framesInChunk,
        numberOfChannels: channels,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planar,
      });

      audioEncoder.encode(audioData);
      audioData.close();

      if (audioEncoder.encodeQueueSize > 16) {
        await new Promise((r) => window.setTimeout(r, 0));
      }
    }

    // 2. Render & Encode Video Frames
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize 2D rendering context');

    const totalFrames = Math.max(1, Math.ceil(totalDur * fps));
    const frameDurationUs = Math.round(1_000_000 / fps);
    const isBgVideo =
      design.bgTheme === 'video' && bgMedia instanceof HTMLVideoElement;

    if (isBgVideo && bgMedia instanceof HTMLVideoElement) {
      bgMedia.pause();
    }

    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (encoderError) throw encoderError;

      const t = frameIdx / fps;
      let text = '';
      let nextText = '';
      let kind: 'lyric' | 'title' = 'lyric';
      let elapsed = 1;

      if (t < introDur) {
        text = introText;
        kind = 'title';
        elapsed = t;
      } else if (t < introDur + songDur) {
        const songT = trimStart + (t - introDur);
        const idx = findActiveLineIndex(times, songT);
        text = idx >= 0 ? lyrics[idx] || '' : '';
        nextText = idx >= 0 ? lyrics[idx + 1] || '' : '';
        elapsed = idx >= 0 ? Math.max(0, songT - (times[idx] ?? 0)) : 1;
      } else {
        text = outroText;
        kind = 'title';
        elapsed = t - (introDur + songDur);
      }

      if (isBgVideo && bgMedia instanceof HTMLVideoElement) {
        const bgSpeed = Math.min(2, Math.max(0.25, Number(design.bgSpeed) || 1));
        await seekVideoToTime(bgMedia, t * bgSpeed);
      }

      drawScene({
        ctx,
        width,
        height,
        text,
        nextText,
        kind,
        design,
        bgMedia,
        elapsedSinceLineStart: elapsed,
        nowMs: t * 1000,
      });

      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round(t * 1_000_000),
        duration: frameDurationUs,
      });

      videoEncoder.encode(videoFrame, { keyFrame: frameIdx % (fps * 2) === 0 });
      videoFrame.close();

      if (frameIdx % 4 === 0 || videoEncoder.encodeQueueSize > 6) {
        const pct = Math.min(96, 12 + Math.round((frameIdx / totalFrames) * 84));
        onProgress(pct, `MP4 রেন্ডার হচ্ছে… ${pct}% (${frameIdx + 1}/${totalFrames} ফ্রেম)`);
        await new Promise((r) => window.setTimeout(r, 0));
      }
    }

    onProgress(98, 'MP4 ফাইল ফাইনাল করা হচ্ছে…');
    await Promise.all([videoEncoder.flush(), audioEncoder.flush()]);
    if (encoderError) throw encoderError;

    muxer.finalize();
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      // Ignore cleanup errors
    }
    try {
      if (audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {
      // Ignore cleanup errors
    }
  }
}
