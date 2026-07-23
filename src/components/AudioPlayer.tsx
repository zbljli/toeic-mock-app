import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Speech from 'expo-speech';

interface Props {
  /** 要朗读的文本内容 */
  speechText?: string;
  /** 题号标签 */
  label?: string;
}

/**
 * 音频播放器 — 使用 TTS 文字转语音朗读题目
 *
 * Part 1: 朗读 transcript（四句描述）
 * Part 2: 朗读 prompt（问题 + 选项）
 * Part 3: 朗读 passage（对话）+ prompt（问题）
 * Part 4: 朗读 passage（独白）+ prompt（问题）
 */
export default function AudioPlayer({ speechText, label = '听力音频' }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // 切题时自动停止
  useEffect(() => {
    return () => {
      Speech.stop();
      setIsPlaying(false);
    };
  }, [speechText]);

  const handlePlay = useCallback(async () => {
    if (!speechText) return;

    if (isPlaying) {
      // 暂停
      Speech.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      setHasPlayed(true);

      // 将听力文本拆分为句子，逐句朗读（模拟真实 TOEIC 音频节奏）
      const sentences = speechText
        .split(/[.?!]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (let i = 0; i < sentences.length; i++) {
        await new Promise<void>((resolve) => {
          Speech.speak(sentences[i], {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.85, // 稍慢，模仿 TOEIC 语速
            onDone: () => resolve(),
            onStopped: () => resolve(),
            onError: () => resolve(),
          });
        });
      }

      setIsPlaying(false);
    } catch (e) {
      setIsPlaying(false);
    }
  }, [speechText, isPlaying]);

  if (!speechText) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderRow}>
          <Text style={styles.icon}>🎧</Text>
          <Text style={styles.placeholderText}>
            暂无音频文本，请检查题目数据
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 标题行 */}
      <View style={styles.headerRow}>
        <Text style={styles.icon}>🎧</Text>
        <View style={styles.textArea}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.hint}>
            {hasPlayed
              ? isPlaying
                ? '正在播放...'
                : '播放完毕，可重新播放'
              : '点击播放，聆听题目内容'}
          </Text>
        </View>
      </View>

      {/* 播放按钮 */}
      <TouchableOpacity
        style={[styles.playBtn, isPlaying && styles.playBtnActive]}
        onPress={handlePlay}
        activeOpacity={0.7}
      >
        <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        <Text style={styles.playBtnText}>
          {isPlaying ? '暂停播放' : hasPlayed ? '重新播放' : '播放音频'}
        </Text>
      </TouchableOpacity>

      {/* 进度指示 */}
      {isPlaying && (
        <View style={styles.waveContainer}>
          <View style={[styles.waveBar, styles.waveBar1]} />
          <View style={[styles.waveBar, styles.waveBar2]} />
          <View style={[styles.waveBar, styles.waveBar3]} />
          <View style={[styles.waveBar, styles.waveBar4]} />
          <View style={[styles.waveBar, styles.waveBar5]} />
        </View>
      )}

      {/* 文本预览 */}
      <View style={styles.transcriptPreview}>
        <Text style={styles.transcriptLabel}>📝 内容预览</Text>
        <Text style={styles.transcriptText} numberOfLines={3}>
          {speechText}
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <Text style={styles.browserNote}>
          ℹ️ 使用浏览器内置语音引擎朗读
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E65100',
  },
  hint: {
    fontSize: 12,
    color: '#BF360C',
    marginTop: 2,
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#BF360C',
    marginLeft: 8,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 10,
  },
  playBtnActive: {
    backgroundColor: '#E65100',
  },
  playBtnIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 32,
    marginTop: 12,
    gap: 4,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#FF9800',
    borderRadius: 3,
  },
  waveBar1: { height: 12 },
  waveBar2: { height: 24 },
  waveBar3: { height: 20 },
  waveBar4: { height: 28 },
  waveBar5: { height: 16 },
  transcriptPreview: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  transcriptLabel: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 18,
  },
  browserNote: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
});
