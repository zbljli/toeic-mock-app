import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../utils/timer';

interface Props {
  seconds: number;
  isRunning: boolean;
  onTick?: (remaining: number) => void;
  onTimeUp?: () => void;
  warningThreshold?: number; // 低于此秒数变红
}

export default function Timer({
  seconds,
  isRunning,
  onTick,
  onTimeUp,
  warningThreshold = 300, // 5 分钟
}: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const isWarning = remaining <= warningThreshold;

  return (
    <View style={[styles.container, isWarning && styles.containerWarning]}>
      <Text style={styles.icon}>⏱</Text>
      <Text style={[styles.time, isWarning && styles.timeWarning]}>
        {formatTime(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  containerWarning: {
    backgroundColor: '#FFF3E0',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    fontVariant: ['tabular-nums'],
  },
  timeWarning: {
    color: '#F44336',
  },
});
