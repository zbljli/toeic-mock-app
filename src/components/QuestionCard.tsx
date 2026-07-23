import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  part: number;
  partTitle: string;
  prompt: string;
  passage?: string;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  part,
  partTitle,
  prompt,
  passage,
  questionNumber,
  totalQuestions,
}: Props) {
  return (
    <View style={styles.container}>
      {/* 题号 & Part 信息 */}
      <View style={styles.header}>
        <View style={styles.partBadge}>
          <Text style={styles.partBadgeText}>Part {part}</Text>
        </View>
        <Text style={styles.partTitle}>{partTitle}</Text>
        <Text style={styles.questionCount}>
          {questionNumber}/{totalQuestions}
        </Text>
      </View>

      {/* 阅读材料 */}
      {passage && (
        <View style={styles.passageContainer}>
          <Text style={styles.passageLabel}>📄 参考材料</Text>
          <Text style={styles.passageText}>{passage}</Text>
        </View>
      )}

      {/* 题干 */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptLabel}>📝 题目</Text>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  partBadge: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  partBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  partTitle: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
  },
  questionCount: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  passageContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  passageLabel: {
    fontSize: 12,
    color: '#F57F17',
    fontWeight: '600',
    marginBottom: 6,
  },
  passageText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  promptContainer: {
    marginBottom: 4,
  },
  promptLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 6,
  },
  promptText: {
    fontSize: 16,
    color: '#212121',
    lineHeight: 24,
    fontWeight: '500',
  },
});
