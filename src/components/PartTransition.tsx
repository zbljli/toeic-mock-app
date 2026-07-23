import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  part: number;
  partTitle: string;
  partType: 'listening' | 'reading';
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function PartTransition({
  part,
  partTitle,
  partType,
  onDismiss,
  autoDismissMs = 3000,
}: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  const isListening = partType === 'listening';
  const icon = isListening ? '🎧' : '📖';
  const sectionLabel = isListening ? 'LISTENING' : 'READING';

  return (
    <View style={[styles.overlay, isListening ? styles.listeningBg : styles.readingBg]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
        <Text style={styles.partNumber}>PART {part}</Text>
        <Text style={styles.partTitle}>{partTitle}</Text>
        <Text style={styles.hint}>3 秒后自动开始 · 点击跳过</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listeningBg: {
    backgroundColor: 'rgba(26, 35, 126, 0.95)',
  },
  readingBg: {
    backgroundColor: 'rgba(21, 101, 192, 0.95)',
  },
  card: {
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    marginBottom: 16,
  },
  partNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  partTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 32,
  },
});
