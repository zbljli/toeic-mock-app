/**
 * Audio source resolution — multi-tier fallback chain.
 *
 * Word playback:  1. CDN pre-generated MP3  (/audio/{word}.mp3)  — real human
 *                 2. CDN TTS MP3             (/audio-tts/{word}.mp3) — offline Google TTS
 *                 3. Free Dictionary API     (real human .mp3)
 *                 4. Google TTS URL          (HTML5 Audio)
 *                 5. expo-speech             (extreme fallback)
 *
 * Text playback:  1. Google TTS URL (HTML5 Audio)
 *                 2. expo-speech     (extreme fallback)
 */
import { playAudioUrl, stopAll, type PlayCallbacks } from './player';
import { isExpoAvailable, speakWithExpo, stopExpo } from './fallback';
import { CDN_AUDIO_WORDS, CDN_TTS_WORDS } from '../../data/audioManifest';

// ── CDN base URL ─────────────────────────────────────────
// Override with env or build-time config; defaults to same-origin.
const CDN_BASE = '/audio';
const CDN_TTS_BASE = '/audio-tts';

// ── In-memory URL cache ──────────────────────────────────
const audioUrlCache: Record<string, string | null> = {};

// ── Source resolvers ─────────────────────────────────────

/**
 * Fetch a real human audio URL from the Free Dictionary API.
 * Results are cached in memory for the session.
 * Returns null when no recording is available for this word.
 */
export async function fetchWordAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase().trim();

  if (audioUrlCache[key] !== undefined) {
    return audioUrlCache[key];
  }

  try {
    const resp = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`,
    );

    if (!resp.ok) {
      audioUrlCache[key] = null;
      return null;
    }

    const data = await resp.json();
    if (Array.isArray(data)) {
      for (const entry of data) {
        const phonetics = entry.phonetics || [];
        for (const p of phonetics) {
          if (p.audio && typeof p.audio === 'string' && p.audio.trim()) {
            audioUrlCache[key] = p.audio;
            return p.audio;
          }
        }
      }
    }
  } catch {
    // Network error — don't cache so retry is possible later
    return null;
  }

  audioUrlCache[key] = null;
  return null;
}

/** Build a Google Translate TTS URL for the given text. */
export function googleTtsUrl(text: string): string {
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
}

// ── High-level playback ──────────────────────────────────

/**
 * Play a single word with the full fallback chain.
 *
 * Returns a cleanup function — call it to cancel playback
 * (e.g. on component unmount or when switching words).
 */
export function playWord(
  word: string,
  callbacks?: PlayCallbacks,
): () => void {
  let cancelled = false;
  const key = word.toLowerCase().trim();

  stopAll();
  stopExpo();

  // ── Tier 5: expo-speech (last resort) ──
  const tryExpoFallback = () => {
    if (cancelled) return;
    if (isExpoAvailable()) {
      speakWithExpo(word, {
        rate: 0.85,
        onDone: callbacks?.onEnded,
      });
      callbacks?.onPlay?.();
    } else {
      console.warn('[audio] All sources exhausted for word:', word);
      callbacks?.onError?.();
    }
  };

  // ── Tier 4: Google TTS URL (live) ──
  const tryGoogleTts = () => {
    if (cancelled) return;
    const audio = playAudioUrl(googleTtsUrl(word), {
      onPlay: callbacks?.onPlay,
      onEnded: callbacks?.onEnded,
      onError: () => tryExpoFallback(),
    });
    if (!audio) tryExpoFallback();
  };

  // ── Tier 3: Free Dictionary API (real human) ──
  const tryDictApi = async () => {
    if (cancelled) return;
    const dictUrl = await fetchWordAudioUrl(word);
    if (cancelled) return;

    if (dictUrl) {
      const audio = playAudioUrl(dictUrl, {
        onPlay: callbacks?.onPlay,
        onEnded: callbacks?.onEnded,
        onError: () => tryGoogleTts(),
      });
      if (!audio) tryGoogleTts();
    } else {
      tryGoogleTts();
    }
  };

  // ── Tier 2: CDN TTS MP3 (offline pre-generated Google TTS) ──
  const tryTtsCdn = () => {
    if (cancelled) return;
    if (CDN_TTS_WORDS.has(key)) {
      const ttsUrl = `${CDN_TTS_BASE}/${key}.mp3`;
      const audio = playAudioUrl(ttsUrl, {
        onPlay: callbacks?.onPlay,
        onEnded: callbacks?.onEnded,
        onError: () => {
          console.warn('[audio] TTS CDN miss for', key);
          tryDictApi();
        },
      });
      if (!audio) tryDictApi();
    } else {
      tryDictApi();
    }
  };

  // ── Tier 1: CDN pre-generated real-human MP3 ──
  if (CDN_AUDIO_WORDS.has(key)) {
    const cdnUrl = `${CDN_BASE}/${key}.mp3`;
    const audio = playAudioUrl(cdnUrl, {
      onPlay: callbacks?.onPlay,
      onEnded: callbacks?.onEnded,
      onError: () => {
        console.warn('[audio] Real audio CDN miss for', key);
        tryTtsCdn();
      },
    });
    if (!audio) tryTtsCdn();
  } else {
    tryTtsCdn();
  }

  return () => {
    cancelled = true;
    stopAll();
    stopExpo();
  };
}

/**
 * Play text (sentence / paragraph) via the fallback chain.
 *
 * Primary: Google TTS URL → HTML5 Audio.
 * Fallback: expo-speech.
 *
 * Returns a cleanup function.
 */
export function playText(
  text: string,
  options?: { rate?: number; onDone?: () => void },
): () => void {
  let cancelled = false;
  const trimmed = text.trim();
  if (!trimmed) {
    options?.onDone?.();
    return () => {};
  }

  stopAll();
  stopExpo();

  const tryFallback = () => {
    if (cancelled) return;
    if (isExpoAvailable()) {
      speakWithExpo(trimmed, {
        rate: options?.rate ?? 0.9,
        onDone: options?.onDone,
      });
    } else {
      console.warn('[audio] All sources exhausted for text');
      options?.onDone?.();
    }
  };

  const audio = playAudioUrl(googleTtsUrl(trimmed), {
    onEnded: () => {
      if (!cancelled) options?.onDone?.();
    },
    onError: () => tryFallback(),
  });

  if (!audio) tryFallback();

  return () => {
    cancelled = true;
    stopAll();
    stopExpo();
  };
}

/**
 * Preload a word's real-human audio URL in the background.
 * Non-blocking — fires and forgets.
 */
export function preloadWord(word: string): void {
  fetchWordAudioUrl(word).catch(() => {});
}
