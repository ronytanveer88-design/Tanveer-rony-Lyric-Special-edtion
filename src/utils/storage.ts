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

export function triggerBlobDownload(
  blob: Blob,
  filename: string,
  forceOctetStream = false
): void {
  const payload = forceOctetStream
    ? new Blob([blob], { type: 'application/octet-stream' })
    : blob;
  const url = URL.createObjectURL(payload);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    try {
      a.remove();
    } catch {
      // ignore
    }
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 60000);
}

export function triggerDataUrlDownload(
  blob: Blob,
  filename: string,
  onDone?: (ok: boolean) => void
): void {
  const reader = new FileReader();
  reader.onerror = () => onDone?.(false);
  reader.onloadend = () => {
    const dataUrl = String(reader.result || '');
    if (!dataUrl.startsWith('data:')) {
      onDone?.(false);
      return;
    }
    try {
      const a = document.createElement('a');
      a.href = dataUrl;
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
      onDone?.(true);
    } catch {
      onDone?.(false);
    }
  };
  reader.readAsDataURL(new Blob([blob], { type: 'application/octet-stream' }));
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
