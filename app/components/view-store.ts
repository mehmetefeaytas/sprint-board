// Görünüm seçimi (takvim / pano) localStorage'da tutulur. useSyncExternalStore
// ile okunur; böylece SSR sırasında varsayılan, istemcide kayıtlı değer gelir.

export type ViewMode = 'calendar' | 'board';

const KEY = 'sprint-panosu-gorunum';

let listeners: Array<() => void> = [];

export function subscribeView(callback: () => void): () => void {
  listeners.push(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners = listeners.filter((item) => item !== callback);
    window.removeEventListener('storage', callback);
  };
}

export function readView(): ViewMode {
  try {
    return window.localStorage.getItem(KEY) === 'board' ? 'board' : 'calendar';
  } catch {
    return 'calendar';
  }
}

/** Sunucu tarafında okunacak değer. */
export function serverView(): ViewMode {
  return 'calendar';
}

export function writeView(mode: ViewMode): void {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    // Özel modda yazma engellenebilir; seçim yine de bu oturumda uygulanır.
  }
  for (const listener of [...listeners]) listener();
}
