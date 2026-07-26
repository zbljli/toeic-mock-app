/**
 * Unified audio module — single entry-point for all app audio.
 *
 * ── Quick reference ──
 *   Vocabulary words  → playWord(word)
 *   Articles/passages → playText(text)
 *   Exam listening    → AudioPlayer uses speakWithExpo for multi-voice,
 *                        falling back to playText when voices unavailable
 *
 * ── Source priority ──
 *   Words:  CDN MP3 > Free Dictionary API > Google TTS URL > expo-speech
 *   Text:   Google TTS URL > expo-speech
 *
 * ── Engine ──
 *   All output goes through HTML5 <audio> elements.
 *   expo-speech is ONLY used as the last-resort fallback.
 */

// Core engine
export {
  unlockAudio,
  isAudioUnlocked,
  playAudioUrl,
  stopAll,
  isAudioPlaying,
} from './player';
export type { PlayCallbacks } from './player';

// Source resolution + high-level playback
export { playWord, playText, preloadWord, fetchWordAudioUrl } from './sources';

// expo-speech fallback (also used directly by AudioPlayer for multi-voice)
export { isExpoAvailable, speakWithExpo, stopExpo } from './fallback';
