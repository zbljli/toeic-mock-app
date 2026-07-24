import React, { useEffect, useState, useRef } from 'react';
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

  // Use refs for callbacks to avoid stale closures in setInterval
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return;

    let timedOut = false;

    const interval = setInterval(() => {
      if (timedOut) return;
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          timedOut = true;
          clearInterval(interval);
          // Defer onTimeUp to avoid calling during setState
          setTimeout(() => {
            onTimeUpRef.current?.();
          }, 0);
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => {
      timedOut = true;
      clearInterval(interval);
    };
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
    fontVariant: ['tabular-nums'] as any,
  },
  timeWarning: {
    color: '#F44336',
  },
});
