import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { speakSentence, stopSpeech } from '../utils/speech';
import type { AudioScript } from '../types';

interface Props {
  audioScript?: AudioScript;
  speechText?: string;
  label?: string;
  autoPlay?: boolean;
  maxPlays?: number;
}

interface DialogueLine {
  role: 'male' | 'female' | 'neutral';
  text: string;
}

interface SpeakerVoice {
  male: Speech.Voice | undefined;
  female: Speech.Voice | undefined;
}

async function getSpeakerVoices(): Promise<SpeakerVoice> {
  const voices = await Speech.getAvailableVoicesAsync();
  const englishVoices = voices.filter((v) => v.language.startsWith('en'));

  function findVoice(prefs: string[]): Speech.Voice | undefined {
    for (const pref of prefs) {
      const match = englishVoices.find(
        (v) =>
          v.identifier.toLowerCase().includes(pref.toLowerCase()) ||
          v.name.toLowerCase().includes(pref.toLowerCase()),
      );
      if (match) return match;
    }
    return undefined;
  }

  const male = findVoice(['Google UK English Male', 'Daniel', 'Microsoft David', 'en-us-male']);
  const female = findVoice(['Google UK English Female', 'Samantha', 'Microsoft Zira', 'Karen', 'en-us-female']);
  const any = findVoice(['Google US English', 'en-US', 'en-GB']);

  return {
    male: male ?? any ?? englishVoices[0],
    female: female ?? any ?? englishVoices[0],
  };
}

function parseDialogue(text: string): DialogueLine[] {
  if (!text?.trim()) return [];
  const roleSplitter = /(?:^|\n)\s*(Man\s*(?:\d+)?|Woman\s*(?:\d+)?|M|W)\s*:\s*/gi;
  const segments = text.split(roleSplitter);
  const lines: DialogueLine[] = [];
  for (let i = 1; i < segments.length; i += 2) {
    const roleMarker = segments[i]?.trim() ?? '';
    const dialogText = (segments[i + 1] ?? '').trim();
    if (!dialogText) continue;
    lines.push({ role: /^man\b|^m\b/i.test(roleMarker) ? 'male' : 'female', text: dialogText });
  }
  if (lines.length === 0) {
    const stripped = text.replace(/^(Man|Woman|M|W)\s*(?:\d+)?\s*:\s*/gim, '').trim();
    if (stripped) lines.push({ role: 'neutral', text: stripped });
  }
  return lines;
}

export default function AudioPlayer({
  audioScript,
  speechText,
  label = 'Listening',
  autoPlay = false,
  maxPlays,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [voices, setVoices] = useState<SpeakerVoice>({ male: undefined, female: undefined });
  const stoppedRef = useRef(false);
  const playLimitReached = maxPlays != null && playCount >= maxPlays;

  useEffect(() => { getSpeakerVoices().then(setVoices); }, []);

  useEffect(() => {
    Speech.stop();
    setIsPlaying(false);
    setHasPlayed(false);
    setPlayCount(0);
    stoppedRef.current = false;
  }, [audioScript, speechText]);

  useEffect(() => {
    if (autoPlay && !hasPlayed && (audioScript || speechText)) {
      const timer = setTimeout(() => handlePlay(), 600);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioScript, speechText, hasPlayed]);

  // ── Structured playback ──
  const speakScript = useCallback(async (script: AudioScript) => {
    stoppedRef.current = false;
    setIsPlaying(true);
    const speakerMap = new Map(script.speakers.map((s) => [s.id, s]));
    const LINE_TIMEOUT_MS = 30000;

    for (let i = 0; i < script.segments.length; i++) {
      if (stoppedRef.current) break;
      const seg = script.segments[i];
      if (!seg?.text) continue;

      const speaker = speakerMap.get(seg.speakerId);
      const voice = speaker?.gender === 'male' ? voices.male : voices.female;
      const rate = seg.rate ?? 1.0;

      if (seg.pauseBefore > 0) {
        await new Promise((r) => setTimeout(r, seg.pauseBefore * 1000));
      }
      if (stoppedRef.current) break;

      let resolved = false;
      await Promise.race<void>([
        new Promise<void>((resolve) => {
          Speech.speak(seg.text, {
            language: 'en-US', pitch: 1.0, rate,
            voice: voice?.identifier,
            onDone: () => { resolved = true; resolve(); },
            onStopped: () => { resolved = true; resolve(); },
            onError: () => { resolved = true; resolve(); },
          });
        }),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            if (!resolved) { Speech.stop(); resolve(); }
          }, LINE_TIMEOUT_MS);
        }),
      ]);
    }
    if (!stoppedRef.current) setIsPlaying(false);
  }, [voices]);

  // ── Legacy playback ──
  const speakLegacy = useCallback(async (text: string) => {
    const lines = parseDialogue(text);
    if (lines.length === 0) return;
    stoppedRef.current = false;
    setIsPlaying(true);
    const LINE_TIMEOUT_MS = 30000;

    for (let i = 0; i < lines.length; i++) {
      if (stoppedRef.current) break;
      const line = lines[i];
      if (!line?.text) continue;

      const voice = line.role === 'male' ? voices.male : line.role === 'female' ? voices.female : voices.male;
      const pitch = line.role === 'male' ? 0.88 : line.role === 'female' ? 1.12 : 1.0;

      if (i > 0) {
        const prevRole = lines[i - 1]?.role;
        await new Promise((r) => setTimeout(r, prevRole !== line.role && line.role !== 'neutral' ? 400 : 200));
      }
      if (stoppedRef.current) break;

      let resolved = false;
      await Promise.race<void>([
        new Promise<void>((resolve) => {
          Speech.speak(line.text, {
            language: 'en-US', pitch, rate: 1.0,
            voice: voice?.identifier,
            onDone: () => { resolved = true; resolve(); },
            onStopped: () => { resolved = true; resolve(); },
            onError: () => { resolved = true; resolve(); },
          });
        }),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            if (!resolved) { Speech.stop(); resolve(); }
          }, LINE_TIMEOUT_MS);
        }),
      ]);
    }
    if (!stoppedRef.current) setIsPlaying(false);
  }, [voices]);

  const handlePlay = useCallback(async () => {
    if (playLimitReached) return;
    if (isPlaying) {
      stoppedRef.current = true;
      Speech.stop();
      stopSpeech();
      setIsPlaying(false);
      return;
    }
    if (!hasPlayed) { setHasPlayed(true); setPlayCount(1); }
    else { setPlayCount((c) => c + 1); }

    // Try expo-speech first; fall back to Google TTS on web
    if (audioScript) {
      const voicesAvailable = (await Speech.getAvailableVoicesAsync()).length > 0;
      if (voicesAvailable) {
        speakScript(audioScript);
      } else {
        // Fallback: speak the combined text as one utterance
        const fullText = audioScript.segments.map(s => s.text).join('. ');
        speakSentence(fullText);
      }
    } else if (speechText) {
      const voicesAvailable = (await Speech.getAvailableVoicesAsync()).length > 0;
      if (voicesAvailable) {
        speakLegacy(speechText);
      } else {
        speakSentence(speechText);
      }
    }
  }, [audioScript, speechText, isPlaying, hasPlayed, playLimitReached, speakScript, speakLegacy]);

  const hasContent = !!audioScript || !!speechText;
  if (!hasContent) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playBtn, isPlaying && styles.playBtnActive, playLimitReached && styles.playBtnDisabled]}
        onPress={handlePlay}
        activeOpacity={0.7}
        disabled={playLimitReached}
      >
        <Text style={styles.playIcon}>
          {playLimitReached ? '🔒' : isPlaying ? '⏸' : '▶'}
        </Text>
        <Text style={[styles.playLabel, playLimitReached && styles.playLabelDim]}>
          {playLimitReached ? 'Played' : isPlaying ? 'Playing...' : hasPlayed ? `Replay (${playCount})` : 'Play'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
    gap: 8,
  },
  playBtnActive: { backgroundColor: '#EA4335' },
  playBtnDisabled: { backgroundColor: '#9E9E9E' },
  playIcon: { fontSize: 16, color: '#FFFFFF' },
  playLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  playLabelDim: { color: '#E0E0E0' },
});
