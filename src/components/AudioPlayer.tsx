import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  audioUrl?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

/**
 * 音频播放器组件
 * 当前为 UI 占位，后续接入 expo-av 实现真实播放
 */
export default function AudioPlayer({ audioUrl, isPlaying: externalPlaying, onPlay, onPause }: Props) {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const isPlaying = externalPlaying ?? internalPlaying;

  const handleToggle = () => {
    if (isPlaying) {
      setInternalPlaying(false);
      onPause?.();
    } else {
      setInternalPlaying(true);
      onPlay?.();
    }
  };

  if (!audioUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderRow}>
          <Text style={styles.icon}>🎧</Text>
          <View style={styles.textArea}>
            <Text style={styles.title}>听力音频</Text>
            <Text style={styles.hint}>请仔细聆听，选择正确答案</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.playBtn, styles.playBtnDisabled]}
          disabled
        >
          <Text style={styles.playBtnText}>▶ 模拟播放</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '0%' }]} />
        </View>
        <Text style={styles.mockHint}>
          ⚠️ 当前为预览模式，音频文件待接入。
          真实考试中将播放对应录音。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playBtn} onPress={handleToggle}>
        <Text style={styles.playBtnText}>
          {isPlaying ? '⏸ 暂停' : '▶ 播放音频'}
        </Text>
      </TouchableOpacity>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: isPlaying ? '60%' : '0%' }]} />
      </View>
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
  placeholderRow: {
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
    fontSize: 13,
    color: '#BF360C',
    marginTop: 2,
  },
  playBtn: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  playBtnDisabled: {
    backgroundColor: '#FFE0B2',
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFE0B2',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },
  mockHint: {
    fontSize: 11,
    color: '#E65100',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
