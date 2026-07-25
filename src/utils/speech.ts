/**
 * Reliable TTS — expo-speech with HTML5 Audio fallback for Web/WeChat.
 *
 * On mobile web (especially WeChat WebView), the Web Speech API may
 * be unavailable or silent. This module falls back to Google Translate
 * TTS served through an HTML5 <audio> element.
 */
import { Platform } from 'react-native';

let SpeechModule: any = null;
try {
  SpeechModule = require('expo-speech');
} catch {
  // expo-speech unavailable
}

/** Speak a single word or short phrase. Returns a cleanup function. */
export function speakWord(word: string): () => void {
  const text = word.trim();
  if (!text) return () => {};

  // ── Strategy 1: expo-speech (Web Speech API) ──
  if (SpeechModule) {
    try {
      SpeechModule.speak(text, {
        language: 'en-US',
        rate: 0.85,
      });
      return () => {
        try { SpeechModule.stop(); } catch {}
      };
    } catch {
      // fall through
    }
  }

  // ── Strategy 2: HTML5 Audio via Google TTS ──
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const audio = new window.Audio();
    audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
    audio.play().catch(() => {});
    return () => { audio.pause(); };
  }

  return () => {};
}

/** Speak a sentence or paragraph (may be longer). */
export function speakSentence(
  text: string,
  onDone?: () => void,
): () => void {
  const trimmed = text.trim();
  if (!trimmed) return () => {};

  // ── Strategy 1: expo-speech ──
  if (SpeechModule) {
    try {
      SpeechModule.speak(trimmed, {
        language: 'en-US',
        rate: 0.9,
        onDone,
        onError: onDone,
        onStopped: onDone,
      });
      return () => {
        try { SpeechModule.stop(); } catch {}
      };
    } catch {
      // fall through
    }
  }

  // ── Strategy 2: HTML5 Audio via Google TTS ──
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const audio = new window.Audio();
    audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(trimmed)}`;
    audio.onended = () => onDone?.();
    audio.onerror = () => onDone?.();
    audio.play().catch(() => onDone?.());
    return () => { audio.pause(); };
  }

  return () => {};
}

/** Check if TTS is potentially available */
export function isSpeechAvailable(): boolean {
  if (SpeechModule) return true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return true;
  return false;
}

/** Stop all current speech */
export function stopSpeech(): void {
  if (SpeechModule) {
    try { SpeechModule.stop(); } catch {}
  }
}
