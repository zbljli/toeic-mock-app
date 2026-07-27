/**
 * Unified HTML5 Audio playback engine.
 *
 * ALL audio output routes through HTML5 <audio> elements.
 * NEVER uses SpeechSynthesis / Web Speech API directly
 * (those are reserved for the expo-speech extreme-fallback path).
 */
import { Platform } from 'react-native';

export interface PlayCallbacks {
  onPlay?: () => void;
  onEnded?: () => void;
  onError?: () => void;
}

// ── Autoplay policy unlock ───────────────────────────────
let _audioUnlocked = false;

/**
 * Unlock the browser audio subsystem so deferred `play()` calls
 * (from setTimeout / useEffect) are permitted.
 *
 * MUST be called synchronously during a user gesture (tap/click).
 * Uses Web Audio API to resume the AudioContext, which lifts the
 * autoplay restriction for the entire page on iOS Safari,
 * WeChat WKWebView, and Chrome.
 */
export function unlockAudio(): void {
  if (_audioUnlocked) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Play a near-silent tone to fully activate the audio pipeline
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.001);
      _audioUnlocked = true;
    } catch {
      // Silently ignore — manual Listen taps still work
    }
  }
}

/** Whether the audio subsystem has been unlocked by a user gesture. */
export function isAudioUnlocked(): boolean {
  return _audioUnlocked;
}

// ── Playback state ────────────────────────────────────────
let currentAudio: HTMLAudioElement | null = null;
let audioGeneration = 0;

/**
 * Play an audio URL via HTML5 <audio>.
 * Stops any previous playback first.  Returns the Audio element
 * (for lifecycle management) or null on native platforms.
 */
export function playAudioUrl(
  url: string,
  callbacks?: PlayCallbacks,
): HTMLAudioElement | null {
  stopAll();

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const gen = ++audioGeneration;
    const audio = new window.Audio(url);
    audio.preload = 'auto';
    audio.onplay = () => {
      if (audioGeneration !== gen) return;
      callbacks?.onPlay?.();
    };
    audio.onended = () => {
      if (audioGeneration !== gen) return;
      currentAudio = null;
      callbacks?.onEnded?.();
    };
    audio.onerror = () => {
      if (audioGeneration !== gen) return;
      currentAudio = null;
      callbacks?.onError?.();
    };
    currentAudio = audio;
    audio.play().catch((err: DOMException) => {
      if (audioGeneration !== gen) return;
      currentAudio = null;
      if (err.name === 'NotAllowedError') {
        console.warn(
          '[audio] Autoplay blocked — call unlockAudio() during a user gesture.',
        );
      } else {
        console.warn('[audio] Play failed:', err.message);
      }
      callbacks?.onError?.();
    });
    return audio;
  }

  return null;
}

/** Whether an audio element is currently active and playing. */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/** Stop any currently playing HTML5 audio and release resources. */
export function stopAll(): void {
  if (currentAudio) {
    audioGeneration += 1; // Invalidate all pending callbacks from this audio
    try {
      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
      currentAudio.load();
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}
