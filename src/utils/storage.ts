export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const tenths = Math.round(seconds * 10);
  const mins = Math.floor(tenths / 600);
  const secs = (tenths % 600) / 10;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

export function formatLrcTime(seconds: number): string {
  const cs = Math.max(0, Math.round(seconds * 100));
  const pad = (n: number) => String(n).padStart(2, '0');
  const mins = Math.floor(cs / 6000);
  const secs = Math.floor((cs % 6000) / 100);
  const rem = cs % 100;
  return `[${pad(mins)}:${pad(secs)}.${pad(rem)}]`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function findActiveLineIndex(times: Array<number | null>, currentTime: number): number {
  let idx = -1;
  let bestTime = -1;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (t !== null && Number.isFinite(t) && t <= currentTime + 0.001 && t >= bestTime) {
      bestTime = t;
      idx = i;
    }
  }
  return idx;
}

export function getSortedNextLine(
  lyrics: string[],
  times: Array<number | null>,
  activeIdx: number
): string {
  if (activeIdx < 0 || activeIdx + 1 >= lyrics.length) return '';
  return lyrics[activeIdx + 1] || '';
}
