import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Speech from 'expo-speech';

type Speed = 0.75 | 1.0 | 1.25 | 1.5;

interface Props {
  speechText?: string;
  label?: string;
  autoPlay?: boolean;
}

interface DialogueLine {
  role: 'male' | 'female' | 'neutral';
  text: string;
}

const SPEEDS: { value: Speed; label: string }[] = [
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
];

/**
 * 解析听力文本，去除角色标签 (Man:, Woman: 等)，标记男女声
 *
 * Part 3/4 对话格式示例:
 *   "Man: Hello, I'd like to make a reservation..."
 *   "Woman: Certainly. How many people..."
 *
 * → 提取为 DialogueLine[]:
 *   [{ role: 'male', text: "Hello, I'd like to..." },
 *    { role: 'female', text: "Certainly. How many..." }]
 */
function parseDialogue(text: string): DialogueLine[] {
  // 检测是否包含角色标记
  const rolePattern = /^(Man|Woman|Man\s*\d*|Woman\s*\d*|M|W)\s*:\s*/gim;

  // 按角色标记分割
  const lines: DialogueLine[] = [];
  const parts = text.split(/(?:^|\n)(Man|Woman|Man\s*\d*|Woman\s*\d*|M|W)\s*:\s*/gim);

  // 跳过第一个空的部分
  let currentRole: 'male' | 'female' | 'neutral' = 'neutral';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]?.trim();
    if (!part) continue;

    if (/^(Man|M)\d*\s*$/i.test(part)) {
      currentRole = 'male';
    } else if (/^(Woman|W)\d*\s*$/i.test(part)) {
      currentRole = 'female';
    } else {
      lines.push({ role: currentRole, text: part });
      currentRole = 'neutral';
    }
  }

  // 如果没有检测到角色标记，整体作为 neutral 处理
  if (lines.length === 0 && text.trim()) {
    lines.push({ role: 'neutral', text: text.trim() });
  }

  return lines;
}

/** 获取最佳可用语音 */
async function getBestVoice(): Promise<Speech.Voice | undefined> {
  const voices = await Speech.getAvailableVoicesAsync();

  // 优先级：Google 英语 > 系统英语 > 任意英语
  const prefs = [
    'Google US English',
    'Google UK English Female',
    'Google UK English Male',
    'en-US',
    'en-GB',
    'Samantha',
    'Daniel',
    'Microsoft David',
    'Microsoft Zira',
    'Karen',
  ];

  for (const pref of prefs) {
    const voice = voices.find(
      (v) =>
        v.identifier.toLowerCase().includes(pref.toLowerCase()) ||
        v.name.toLowerCase().includes(pref.toLowerCase()),
    );
    if (voice) return voice;
  }

  // fallback: any English voice
  return voices.find((v) => v.language.startsWith('en'));
}

/**
 * 音频播放器 — 真人感 TTS
 *
 * 对话文本自动去除 Man:/Woman: 等角色标签
 * 男声用低 pitch (0.9)，女声用高 pitch (1.1)，营造真实对话感
 */
export default function AudioPlayer({ speechText, label = '听力音频', autoPlay = false }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1.0);
  const [voice, setVoice] = useState<Speech.Voice | undefined>();
  const linesRef = useRef<DialogueLine[]>([]);
  const stoppedRef = useRef(false);

  // 初始化语音
  useEffect(() => {
    getBestVoice().then(setVoice);
  }, []);

  // 切题时重置 + 解析对话
  useEffect(() => {
    Speech.stop();
    setIsPlaying(false);
    setHasPlayed(false);
    setPlayCount(0);
    stoppedRef.current = false;

    if (speechText) {
      linesRef.current = parseDialogue(speechText);
    } else {
      linesRef.current = [];
    }
  }, [speechText]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && speechText && !hasPlayed) {
      const timer = setTimeout(() => handlePlay(), 600);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, speechText, hasPlayed]);

  const speakLines = useCallback(
    async (fromIndex: number) => {
      const lines = linesRef.current;
      if (lines.length === 0) return;

      stoppedRef.current = false;
      setIsPlaying(true);

      for (let i = fromIndex; i < lines.length; i++) {
        if (stoppedRef.current) break;
        const line = lines[i];
        if (!line || !line.text) continue;

        // 根据角色设定 pitch：男声低沉，女声略高
        let pitch: number;
        if (line.role === 'male') {
          pitch = 0.88; // 低沉男声
        } else if (line.role === 'female') {
          pitch = 1.12; // 较高女声
        } else {
          pitch = 1.0; // 中性（Part 1/2 描述/问题）
        }

        // 句子间停顿：对话切换时稍微停顿
        if (i > 0 && lines[i - 1]?.role !== line.role && line.role !== 'neutral') {
          await new Promise((r) => setTimeout(r, 300));
        }

        await new Promise<void>((resolve) => {
          Speech.speak(line.text, {
            language: 'en-US',
            pitch,
            rate: speed,
            voice: voice?.identifier,
            onDone: () => resolve(),
            onStopped: () => resolve(),
            onError: () => resolve(),
          });
        });
      }

      if (!stoppedRef.current) {
        setIsPlaying(false);
      }
    },
    [speed, voice],
  );

  const handlePlay = useCallback(() => {
    if (!speechText) return;

    if (isPlaying) {
      stoppedRef.current = true;
      Speech.stop();
      setIsPlaying(false);
      return;
    }

    if (!hasPlayed) {
      setHasPlayed(true);
      setPlayCount(1);
    } else {
      setPlayCount((c) => c + 1);
    }
    speakLines(0);
  }, [speechText, isPlaying, hasPlayed, speakLines]);

  if (!speechText) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderRow}>
          <Text style={styles.placeholderText}>暂无音频文本</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 主控制行 */}
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          onPress={handlePlay}
          activeOpacity={0.7}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <View style={styles.infoArea}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.status}>
            {isPlaying
              ? `🔊 播放中 · 第 ${playCount} 遍`
              : hasPlayed
                ? `✅ 播放完毕 · 第 ${playCount} 遍`
                : '点击播放聆听题目'}
          </Text>
          {voice && (
            <Text style={styles.voiceInfo}>
              🎙 {voice.name}
            </Text>
          )}
        </View>
      </View>

      {/* 语速选择 */}
      <View style={styles.speedRow}>
        <Text style={styles.speedLabel}>语速：</Text>
        {SPEEDS.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={[styles.speedBtn, speed === s.value && styles.speedBtnActive]}
            onPress={() => {
              setSpeed(s.value);
              if (isPlaying) {
                stoppedRef.current = true;
                Speech.stop();
                setIsPlaying(false);
                setTimeout(() => {
                  stoppedRef.current = false;
                  speakLines(0);
                }, 150);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.speedBtnText, speed === s.value && styles.speedBtnTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  placeholderRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playBtnActive: {
    backgroundColor: '#EA4335',
  },
  playIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  infoArea: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: '#5F6368',
  },
  voiceInfo: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  speedLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginRight: 8,
  },
  speedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F3F4',
    marginRight: 6,
  },
  speedBtnActive: {
    backgroundColor: '#1A73E8',
  },
  speedBtnText: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '600',
  },
  speedBtnTextActive: {
    color: '#FFFFFF',
  },
});
