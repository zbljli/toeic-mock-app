/**
 * Runtime data loader — fetches JSON from /data/ at runtime instead of
 * bundling it into the JS payload.
 *
 * Data is cached in memory after the first successful fetch so
 * subsequent calls (e.g. navigating between scenes) are instant.
 */
import type { WordEntry, SceneEntry } from '../types/vocabulary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _cache = new Map<string, any>();
const _pending = new Map<string, Promise<any>>();

/**
 * Load a JSON file from the given path.  Results are cached forever.
 */
export async function loadJsonData<T>(path: string): Promise<T> {
  if (_cache.has(path)) return _cache.get(path) as T;
  if (_pending.has(path)) return _pending.get(path) as Promise<T>;

  const promise = fetch(path)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} loading ${path}`);
      return r.json();
    })
    .then((data) => {
      _cache.set(path, data);
      _pending.delete(path);
      return data as T;
    })
    .catch((err) => {
      _pending.delete(path); // allow retry next call
      throw err;
    });

  _pending.set(path, promise);
  return promise;
}

// ── Convenience loaders ──────────────────────────────────

export function loadWords(): Promise<WordEntry[]> {
  return loadJsonData<WordEntry[]>('/data/words.json');
}

export function loadScenes(): Promise<SceneEntry[]> {
  return loadJsonData<SceneEntry[]>('/data/scenes.json');
}

// Article types vary per consumer; use generic
export function loadArticles(): Promise<any[]> {
  return loadJsonData<any[]>('/data/articles.json');
}
