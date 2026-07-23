import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  current: number;
  total: number;
  answeredCount: number;
}

export default function ProgressBar({ current, total, answeredCount }: Props) {
  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
  const answeredPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {/* 已答进度 */}
        <View style={[styles.bar, styles.answeredBar, { flex: answeredCount }]} />
        {/* 当前进度 */}
        <View
          style={[
            styles.bar,
            styles.currentBar,
            { flex: Math.max(current - answeredCount, 0) },
          ]}
        />
        {/* 剩余 */}
        <View
          style={[
            styles.bar,
            styles.remainingBar,
            { flex: Math.max(total - current, 0) },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>
          <Text style={styles.labelBold}>{current}</Text>/{total}
        </Text>
        <Text style={styles.answeredLabel}>
          已答 <Text style={styles.labelBold}>{answeredCount}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  barContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  answeredBar: {
    backgroundColor: '#4CAF50',
  },
  currentBar: {
    backgroundColor: '#E0E0E0',
  },
  remainingBar: {
    backgroundColor: '#F5F5F5',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#757575',
  },
  answeredLabel: {
    fontSize: 12,
    color: '#4CAF50',
  },
  labelBold: {
    fontWeight: '700',
    color: '#424242',
  },
});
