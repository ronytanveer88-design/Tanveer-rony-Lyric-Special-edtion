export type CreativeSuiteApp = 'cinema' | 'intro' | 'translator' | 'lyrics';

export type StudioTab = 'lyrics' | 'sync' | 'autosync' | 'design' | 'export';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type BgTheme = 'rain' | 'night' | 'sunset' | 'rose' | 'ocean' | 'forest' | 'image' | 'video';

export type TransitionStyle = 'Fade' | 'Slide' | 'None';

export type TextAlignment = 'left' | 'center' | 'right';

export type VideoFilter = 'none' | 'grayscale' | 'sepia' | 'invert';

export type LyricAnimation = TransitionStyle | 'slide-up' | 'fade' | 'zoom' | 'none';

export type BengaliFont =
  | 'Hind Siliguri'
  | 'Baloo Da 2'
  | 'Noto Serif Bengali'
  | 'Plus Jakarta Sans';

export interface DesignConfig {
  fontSize: number;
  letterSpacing: number;
  darkness: number;
  bgBlur: number;
  bgFade: number;
  bgOverlayColor: string;
  bgOverlayOpacity: number;
  videoFilter: VideoFilter;
  bgSpeed: number;
  font: BengaliFont;
  ratio: AspectRatio;
  bgTheme: BgTheme;
  transitionStyle: TransitionStyle;
  transitionSpeed: number;
  animation?: LyricAnimation;
  bouncingAnimation: boolean;
  showNextLine: boolean;
  textShadow: boolean;
  shadowOffset: number;
  textOutline: boolean;
  textGlow: boolean;
  textColor: string;
  textGradientEnabled: boolean;
  textGradientStart: string;
  textGradientEnd: string;
  textAlign: TextAlignment;
  intro: string;
  outro: string;
}

export interface DiagnosticItem {
  label: string;
  ok: boolean;
  detail: string;
}

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'warning' | 'error' | 'info';
}

export const PREVIEW_DIMENSIONS: Record<AspectRatio, [number, number]> = {
  '16:9': [640, 360],
  '9:16': [360, 640],
  '1:1': [360, 360],
};

export const EXPORT_DIMENSIONS: Record<AspectRatio, [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '1:1': [720, 720],
};

export const DEFAULT_LYRICS = `উজাড় করে দিয়েছিলাম
তবুও তুমি বুঝলে না
বৃষ্টি ভেজা এই রাতে
তোমাকেই খুঁজেছি`;

export const DEFAULT_DESIGN: DesignConfig = {
  fontSize: 32,
  letterSpacing: 0,
  darkness: 40,
  bgBlur: 0,
  bgFade: 0,
  bgOverlayColor: '#000000',
  bgOverlayOpacity: 0,
  videoFilter: 'none',
  bgSpeed: 1,
  font: 'Hind Siliguri',
  ratio: '16:9',
  bgTheme: 'rain',
  transitionStyle: 'Slide',
  transitionSpeed: 0.4,
  bouncingAnimation: false,
  showNextLine: true,
  textShadow: true,
  shadowOffset: 2,
  textOutline: false,
  textGlow: false,
  textColor: '#ffffff',
  textGradientEnabled: false,
  textGradientStart: '#ffffff',
  textGradientEnd: '#ffb347',
  textAlign: 'center',
  intro: 'Tanvir Rahman Rony',
  outro: 'Subscribe',
};
