/**
 * expo-speech extreme fallback.
 *
 * ONLY used when all HTML5 Audio sources (CDN MP3, Free Dictionary API,
 * Google TTS URL) are exhausted.  Never the primary audio path.
 */
import { Platform } from 'react-native';

// ── Lazy-load expo-speech ────────────────────────────────
let SpeechModule: any = null;
try {
  SpeechModule = require('expo-speech');
} catch {
  // expo-speech unavailable (e.g. non-Expo web builds)
}

/** Whether expo-speech is available on this platform / build. */
export function isExpoAvailable(): boolean {
  return SpeechModule !== null;
}

/** Speak text via expo-speech. Returns a cleanup function. */
export function speakWithExpo(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voice?: string;
    onDone?: () => void;
  },
): () => void {
  if (!SpeechModule) return () => {};

  try {
    SpeechModule.speak(text, {
      language: 'en-US',
      rate: options?.rate ?? 0.9,
      pitch: options?.pitch ?? 1.0,
      voice: options?.voice,
      onDone: options?.onDone,
      onError: options?.onDone,
      onStopped: options?.onDone,
    });
    return () => {
      try {
        SpeechModule.stop();
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}

/** Immediately stop any expo-speech utterance. */
export function stopExpo(): void {
  if (SpeechModule) {
    try {
      SpeechModule.stop();
    } catch {
      // ignore
    }
  }
}
