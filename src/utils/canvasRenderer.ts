import { BgTheme, DesignConfig, VideoFilter } from '../types/studio';

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

const RAIN_DROPS: Particle[] = Array.from({ length: 140 }, () => ({
  x: Math.random(),
  y: Math.random(),
  speed: 0.6 + Math.random() * 0.9,
  size: 0.03 + Math.random() * 0.05,
  alpha: 0.25 + Math.random() * 0.3,
}));

const AMBIENT_PARTICLES: Particle[] = Array.from({ length: 85 }, () => ({
  x: Math.random(),
  y: Math.random(),
  speed: 0.04 + Math.random() * 0.12,
  size: 0.8 + Math.random() * 2.0,
  alpha: 0.25 + Math.random() * 0.65,
}));

const THEME_GRADIENTS: Record<Exclude<BgTheme, 'image' | 'video'>, [string, string, string]> = {
  rain: ['#0a1230', '#060a1c', 'rgba(190, 210, 255, 0.38)'],
  night: ['#070b19', '#0d142b', 'rgba(220, 232, 255, 0.72)'],
  sunset: ['#2b101e', '#140914', 'rgba(255, 168, 92, 0.55)'],
  rose: ['#260a18', '#0f050c', 'rgba(255, 130, 175, 0.52)'],
  ocean: ['#061d29', '#040b14', 'rgba(110, 225, 245, 0.48)'],
  forest: ['#081c15', '#040c09', 'rgba(155, 240, 175, 0.50)'],
};

export function drawMediaCover(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  w: number,
  h: number
): void {
  if (media instanceof HTMLVideoElement && media.readyState < 2) return;
  const sw =
    media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth || media.width;
  const sh =
    media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight || media.height;
  if (!sw || !sh) return;

  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  try {
    ctx.drawImage(media, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } catch {
    // Ignore transient frame draw errors while seeking media
  }
}

function drawProceduralBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  k: number,
  theme: Exclude<BgTheme, 'image' | 'video'>,
  nowSec: number
): void {
  const [topColor, bottomColor, particleColor] = THEME_GRADIENTS[theme];
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (theme === 'rain') {
    ctx.strokeStyle = particleColor;
    ctx.lineWidth = Math.max(1, k);
    ctx.beginPath();
    for (const d of RAIN_DROPS) {
      const y = (d.y + nowSec * d.speed * 0.8) % 1;
      const x = (((d.x - y * 0.08) % 1) + 1) % 1;
      ctx.moveTo(x * w, y * h);
      ctx.lineTo((x - 0.01) * w, (y + d.size) * h);
    }
    ctx.stroke();
  } else {
    // Subtle radial atmospheric glow + drifting particles
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.55);
    glow.addColorStop(0, particleColor.replace(/[\d.]+\)$/, '0.14)'));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (const p of AMBIENT_PARTICLES) {
      const driftY = theme === 'night' ? 0 : nowSec * p.speed * 0.35;
      const y = (((p.y - driftY) % 1) + 1) % 1;
      const x = (((p.x + Math.sin(nowSec * 0.4 + p.y * 6) * 0.015) % 1) + 1) % 1;
      const twinkle = 0.55 + 0.45 * Math.sin(nowSec * 2.2 + p.x * 12);
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(x * w, y * h, Math.max(0.8, p.size * k * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

type GraphemeSegmenter = { segment(input: string): Iterable<{ segment: string }> };

const GRAPHEME_SEGMENTER: GraphemeSegmenter | null = (() => {
  const IntlAny = Intl as unknown as {
    Segmenter?: new (
      locales?: string,
      options?: { granularity: 'grapheme' }
    ) => GraphemeSegmenter;
  };
  return typeof IntlAny?.Segmenter === 'function'
    ? new IntlAny.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
})();

function hexToRgba(hex: string, alpha: number): string {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#ffffff';
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function splitGraphemes(text: string): string[] {
  if (!text) return [];
  if (GRAPHEME_SEGMENTER) {
    return Array.from(GRAPHEME_SEGMENTER.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function measureSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacingPx: number
): number {
  if (!text) return 0;
  if (Math.abs(letterSpacingPx) < 0.001) {
    return ctx.measureText(text).width;
  }
  const chars = splitGraphemes(text);
  if (chars.length <= 1) return ctx.measureText(text).width;
  let total = 0;
  for (let i = 0; i < chars.length; i++) {
    total += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) total += letterSpacingPx;
  }
  return Math.max(0, total);
}

function drawSpacedTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
  letterSpacingPx: number,
  mode: 'fill' | 'stroke'
): void {
  if (!text) return;
  if (Math.abs(letterSpacingPx) < 0.001) {
    if (mode === 'stroke') ctx.strokeText(text, x, y);
    else ctx.fillText(text, x, y);
    return;
  }

  const chars = splitGraphemes(text);
  if (chars.length <= 1) {
    if (mode === 'stroke') ctx.strokeText(text, x, y);
    else ctx.fillText(text, x, y);
    return;
  }

  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalW = Math.max(
    0,
    widths.reduce((acc, w) => acc + w, 0) + letterSpacingPx * (chars.length - 1)
  );

  let cursorX =
    align === 'left' ? x : align === 'right' ? x - totalW : x - totalW / 2;

  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    if (mode === 'stroke') {
      ctx.strokeText(chars[i], cursorX, y);
    } else {
      ctx.fillText(chars[i], cursorX, y);
    }
    cursorX += widths[i] + letterSpacingPx;
  }
  ctx.textAlign = prevAlign;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  letterSpacingPx = 0
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureSpacedText(ctx, candidate, letterSpacingPx) <= maxW) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (measureSpacedText(ctx, word, letterSpacingPx) <= maxW) {
        current = word;
      } else {
        // Fallback grapheme-level wrap for very long unbroken tokens
        let chunk = '';
        for (const ch of splitGraphemes(word)) {
          if (chunk && measureSpacedText(ctx, chunk + ch, letterSpacingPx) > maxW) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface SceneRenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  text: string;
  nextText?: string;
  kind: 'lyric' | 'title';
  design: DesignConfig;
  bgMedia: HTMLImageElement | HTMLVideoElement | null;
  elapsedSinceLineStart?: number;
  nowMs?: number;
}

export function drawScene({
  ctx,
  width,
  height,
  text,
  nextText = '',
  kind,
  design,
  bgMedia,
  elapsedSinceLineStart = 1,
  nowMs = performance.now(),
}: SceneRenderOptions): void {
  const k = Math.min(width, height) / 360;
  const nowSec = nowMs / 1000;

  const blurAmount = Math.min(20, Math.max(0, Number(design.bgBlur) || 0));
  const fadeAmount = Math.min(
    100,
    Math.max(
      0,
      design.bgFade !== undefined && Number.isFinite(Number(design.bgFade))
        ? Number(design.bgFade)
        : 0
    )
  );
  const bgMediaAlpha = Math.max(0, Math.min(1, 1 - fadeAmount / 100));
  const videoFilterMap: Record<VideoFilter, string> = {
    none: '',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    invert: 'invert(100%)',
  };
  const videoFilterCss = videoFilterMap[design.videoFilter] ?? '';

  if ((design.bgTheme === 'image' || design.bgTheme === 'video') && bgMedia) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    const bgFilters: string[] = [];
    if (blurAmount > 0) {
      const scaledBlur = blurAmount * k;
      bgFilters.push(`blur(${scaledBlur}px)`);
      const overscan = 1 + (scaledBlur * 3) / Math.min(width, height);
      ctx.translate(width / 2, height / 2);
      ctx.scale(overscan, overscan);
      ctx.translate(-width / 2, -height / 2);
    }
    if (videoFilterCss) {
      bgFilters.push(videoFilterCss);
    }
    if (bgFilters.length > 0) {
      ctx.filter = bgFilters.join(' ');
    }
    ctx.globalAlpha = bgMediaAlpha;
    drawMediaCover(ctx, bgMedia, width, height);
    ctx.restore();
    ctx.filter = 'none';
  } else {
    const fallbackTheme: Exclude<BgTheme, 'image' | 'video'> =
      design.bgTheme === 'image' || design.bgTheme === 'video' ? 'rain' : design.bgTheme;
    ctx.save();
    if (videoFilterCss) {
      ctx.filter = videoFilterCss;
    }
    drawProceduralBackground(ctx, width, height, k, fallbackTheme, nowSec);
    ctx.restore();
    ctx.filter = 'none';
  }

  // Scrim overlay for lyric contrast
  const scrimAlpha = Math.min(0.85, Math.max(0, design.darkness / 100));
  ctx.fillStyle = `rgba(0, 0, 0, ${scrimAlpha})`;
  ctx.fillRect(0, 0, width, height);

  // Custom solid color overlay over background media and behind lyrics
  const overlayOpacity = Math.min(
    100,
    Math.max(
      0,
      design.bgOverlayOpacity !== undefined && Number.isFinite(Number(design.bgOverlayOpacity))
        ? Number(design.bgOverlayOpacity)
        : 0
    )
  );
  if (overlayOpacity > 0) {
    const overlayColor =
      typeof design.bgOverlayColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(design.bgOverlayColor)
        ? design.bgOverlayColor
        : '#000000';
    ctx.fillStyle = hexToRgba(overlayColor, overlayOpacity / 100);
    ctx.fillRect(0, 0, width, height);
  }

  if (!text || text === '♪') return;

  const fontName = design.font || 'Hind Siliguri';
  const baseSize = (design.fontSize || 32) * (kind === 'title' ? 1.25 : 1);
  const rawLetterSpacing =
    design.letterSpacing !== undefined && Number.isFinite(Number(design.letterSpacing))
      ? Math.min(16, Math.max(-2, Number(design.letterSpacing)))
      : 0;
  const scaledLetterSpacing = rawLetterSpacing * k;
  const maxW = width * 0.84;
  const paddingX = (width - maxW) / 2;
  const textAlign =
    design.textAlign === 'left' || design.textAlign === 'right' ? design.textAlign : 'center';
  const textX =
    textAlign === 'left' ? paddingX : textAlign === 'right' ? width - paddingX : width / 2;
  const hasNext = kind === 'lyric' && design.showNextLine && Boolean(nextText) && nextText !== '♪';
  const maxH = height * (hasNext ? 0.56 : 0.78);

  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';

  let fontSize = baseSize * k;
  let lines: string[] = [];
  for (;;) {
    ctx.font = `700 ${fontSize}px "${fontName}", "Hind Siliguri", sans-serif`;
    lines = wrapTextLines(ctx, text, maxW, scaledLetterSpacing);
    const fits =
      lines.length * fontSize * 1.35 <= maxH &&
      lines.every((l) => measureSpacedText(ctx, l, scaledLetterSpacing) <= maxW);
    if (fits || fontSize <= 11 * k) break;
    fontSize -= 2 * k;
  }

  // Compute text appearance transition based on elapsedSinceLineStart
  const rawStyle = String(design.transitionStyle ?? design.animation ?? 'Slide');
  const normalizedStyle =
    rawStyle === 'Fade' || rawStyle === 'fade'
      ? 'Fade'
      : rawStyle === 'None' || rawStyle === 'none'
      ? 'None'
      : 'Slide';

  const animDuration = Math.min(
    2,
    Math.max(
      0.1,
      design.transitionSpeed !== undefined && Number.isFinite(Number(design.transitionSpeed))
        ? Number(design.transitionSpeed)
        : 0.4
    )
  );
  const rawProgress = Math.min(1, Math.max(0, elapsedSinceLineStart / animDuration));
  const eased = 1 - Math.pow(1 - rawProgress, 3);

  let alpha = 1;
  let slideOffsetY = 0;

  if (normalizedStyle === 'Fade') {
    alpha = eased;
  } else if (normalizedStyle === 'Slide') {
    alpha = eased;
    slideOffsetY = (1 - eased) * 26 * k;
  }

  const bounceOffsetY = design.bouncingAnimation
    ? Math.sin(Math.max(0, elapsedSinceLineStart) * 5) * 4.5 * k
    : 0;
  const offsetY = slideOffsetY + bounceOffsetY;

  const lineHeight = fontSize * 1.35;
  const centerOffset = hasNext ? -14 * k : 0;
  const startY = height / 2 + centerOffset - ((lines.length - 1) * lineHeight) / 2;

  const useTextShadow = design.textShadow !== false;
  const shadowOffset = Math.min(
    20,
    Math.max(
      0,
      design.shadowOffset !== undefined && Number.isFinite(Number(design.shadowOffset))
        ? Number(design.shadowOffset)
        : 2
    )
  );
  const useTextOutline = Boolean(design.textOutline);
  const useTextGlow = Boolean(design.textGlow);
  const lyricColor =
    typeof design.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(design.textColor)
      ? design.textColor
      : '#ffffff';
  const useTextGradient = Boolean(design.textGradientEnabled);
  const gradStart =
    typeof design.textGradientStart === 'string' && /^#[0-9a-fA-F]{6}$/.test(design.textGradientStart)
      ? design.textGradientStart
      : '#ffffff';
  const gradEnd =
    typeof design.textGradientEnd === 'string' && /^#[0-9a-fA-F]{6}$/.test(design.textGradientEnd)
      ? design.textGradientEnd
      : '#ffb347';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, offsetY);

  if (useTextShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 14 * k;
    ctx.shadowOffsetX = shadowOffset * 0.35 * k;
    ctx.shadowOffsetY = shadowOffset * k;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (useTextOutline) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = Math.max(2 * k, fontSize * 0.12);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    lines.forEach((line, i) => {
      drawSpacedTextLine(
        ctx,
        line,
        textX,
        startY + i * lineHeight,
        textAlign,
        scaledLetterSpacing,
        'stroke'
      );
    });
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (kind === 'title') {
    ctx.fillStyle = '#ffb347';
  } else if (useTextGradient) {
    const maxLineW = Math.max(
      40 * k,
      ...lines.map((l) => measureSpacedText(ctx, l, scaledLetterSpacing))
    );
    const gx0 =
      textAlign === 'left'
        ? textX
        : textAlign === 'right'
        ? textX - maxLineW
        : textX - maxLineW / 2;
    const gx1 =
      textAlign === 'left'
        ? textX + maxLineW
        : textAlign === 'right'
        ? textX
        : textX + maxLineW / 2;
    const gy0 = startY - lineHeight * 0.45;
    const gy1 = startY + (lines.length - 1) * lineHeight + lineHeight * 0.45;
    const textGrad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    textGrad.addColorStop(0, gradStart);
    textGrad.addColorStop(1, gradEnd);
    ctx.fillStyle = textGrad;
  } else {
    ctx.fillStyle = lyricColor;
  }

  if (useTextGlow) {
    // Preserve drop shadow when both Text Shadow and Text Glow are active without outline
    if (useTextShadow && !useTextOutline) {
      lines.forEach((line, i) => {
        drawSpacedTextLine(
          ctx,
          line,
          textX,
          startY + i * lineHeight,
          textAlign,
          scaledLetterSpacing,
          'fill'
        );
      });
    }

    const r = parseInt(lyricColor.slice(1, 3), 16);
    const g = parseInt(lyricColor.slice(3, 5), 16);
    const b = parseInt(lyricColor.slice(5, 7), 16);
    const isNearWhite = r >= 235 && g >= 235 && b >= 235;

    const outerGlowColor =
      kind === 'title'
        ? 'rgba(255, 179, 71, 0.9)'
        : useTextGradient
        ? hexToRgba(gradEnd, 0.88)
        : isNearWhite
        ? 'rgba(165, 216, 255, 0.85)'
        : hexToRgba(lyricColor, 0.9);

    const innerGlowColor =
      kind === 'title'
        ? 'rgba(255, 224, 150, 0.9)'
        : useTextGradient
        ? hexToRgba(gradStart, 0.92)
        : isNearWhite
        ? 'rgba(255, 255, 255, 0.95)'
        : hexToRgba(lyricColor, 0.98);

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Wide cinematic light-leak bloom pass
    ctx.shadowColor = outerGlowColor;
    ctx.shadowBlur = 28 * k;
    lines.forEach((line, i) => {
      drawSpacedTextLine(
        ctx,
        line,
        textX,
        startY + i * lineHeight,
        textAlign,
        scaledLetterSpacing,
        'fill'
      );
    });

    // Crisp neon core halo pass
    ctx.shadowColor = innerGlowColor;
    ctx.shadowBlur = 11 * k;
    lines.forEach((line, i) => {
      drawSpacedTextLine(
        ctx,
        line,
        textX,
        startY + i * lineHeight,
        textAlign,
        scaledLetterSpacing,
        'fill'
      );
    });
  } else {
    lines.forEach((line, i) => {
      drawSpacedTextLine(
        ctx,
        line,
        textX,
        startY + i * lineHeight,
        textAlign,
        scaledLetterSpacing,
        'fill'
      );
    });
  }
  ctx.restore();

  // Render subtle upcoming line below active lyric (matching PDF preview)
  if (hasNext) {
    const nextSize = Math.max(10 * k, fontSize * 0.56);
    const nextSpacing = scaledLetterSpacing * 0.65;
    const nextBaseHex = useTextGradient ? gradStart : lyricColor;
    const r = parseInt(nextBaseHex.slice(1, 3), 16);
    const g = parseInt(nextBaseHex.slice(3, 5), 16);
    const b = parseInt(nextBaseHex.slice(5, 7), 16);
    ctx.save();
    ctx.globalAlpha = normalizedStyle === 'None' ? 1 : eased;
    ctx.translate(0, normalizedStyle === 'Slide' ? slideOffsetY * 0.5 : 0);
    ctx.font = `500 ${nextSize}px "${fontName}", "Hind Siliguri", sans-serif`;
    const nextLines = wrapTextLines(ctx, nextText, maxW, nextSpacing).slice(0, 2);
    const blockBottom = startY + (lines.length - 1) * lineHeight + lineHeight * 0.68;
    if (useTextShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
      ctx.shadowBlur = 8 * k;
      ctx.shadowOffsetX = shadowOffset * 0.25 * k;
      ctx.shadowOffsetY = shadowOffset * 0.7 * k;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    if (useTextOutline) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = Math.max(1.2 * k, nextSize * 0.1);
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      nextLines.forEach((nl, idx) => {
        drawSpacedTextLine(
          ctx,
          nl,
          textX,
          blockBottom + idx * (nextSize * 1.35),
          textAlign,
          nextSpacing,
          'stroke'
        );
      });
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
    nextLines.forEach((nl, idx) => {
      drawSpacedTextLine(
        ctx,
        nl,
        textX,
        blockBottom + idx * (nextSize * 1.35),
        textAlign,
        nextSpacing,
        'fill'
      );
    });
    ctx.restore();
  }
}

export async function ensureStudioFontsLoaded(): Promise<void> {
  if (!document.fonts?.load) return;
  const loads: Array<Promise<FontFace[]>> = [
    document.fonts.load('700 32px "Hind Siliguri"', 'অআকখ'),
    document.fonts.load('700 32px "Baloo Da 2"', 'অআকখ'),
    document.fonts.load('700 32px "Noto Serif Bengali"', 'অআকখ'),
    document.fonts.load('700 32px "Plus Jakarta Sans"', 'Abc'),
    document.fonts.load('500 20px "Plus Jakarta Sans"', 'Abc'),
  ];
  await Promise.allSettled(loads);
}
