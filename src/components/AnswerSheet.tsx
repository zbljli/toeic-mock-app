import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { TOEIC_PARTS } from '../data/toeicStructure';
import type { TestSession, Question, Answer } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  session: TestSession;
  questions: Question[];
  onGoToQuestion: (index: number) => void;
}

export default function AnswerSheet({
  visible,
  onClose,
  session,
  questions,
  onGoToQuestion,
}: Props) {
  const answerMap = new Map(
    session.answers.map((a) => [a.questionId, a]),
  );

  // 按 Part 分组
  const partGroups: { part: number; title: string; questionIndices: number[] }[] = [];
  let currentPart = 0;
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].part !== currentPart) {
      currentPart = questions[i].part;
      const info = TOEIC_PARTS.find((p) => p.part === currentPart);
      partGroups.push({
        part: currentPart,
        title: info?.titleZh ?? `Part ${currentPart}`,
        questionIndices: [i],
      });
    } else {
      partGroups[partGroups.length - 1].questionIndices.push(i);
    }
  }

  const totalAnswered = session.answers.filter(
    (a) => a.selectedOptionId !== null,
  ).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕ 关闭</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>答题卡</Text>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {totalAnswered}/{questions.length}
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotAnswered]} />
            <Text style={styles.legendText}>已答</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotCurrent]} />
            <Text style={styles.legendText}>当前</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotUnanswered]} />
            <Text style={styles.legendText}>未答</Text>
          </View>
        </View>

        {/* Question Grid by Part */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {partGroups.map((group) => (
            <View key={group.part} style={styles.partGroup}>
              <Text style={styles.partGroupTitle}>
                Part {group.part} — {group.title}
              </Text>
              <View style={styles.grid}>
                {group.questionIndices.map((qIdx) => {
                  const q = questions[qIdx];
                  const ans = answerMap.get(q.id);
                  const isAnswered = ans?.selectedOptionId != null;
                  const isCurrent = qIdx === session.currentQuestionIndex;

                  let dotStyle = styles.dotUnanswered;
                  let textStyle = styles.gridTextUnanswered;
                  if (isCurrent) {
                    dotStyle = styles.dotCurrent;
                    textStyle = styles.gridTextCurrent;
                  } else if (isAnswered) {
                    dotStyle = styles.dotAnswered;
                    textStyle = styles.gridTextAnswered;
                  }

                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[styles.gridItem, dotStyle]}
                      onPress={() => {
                        onGoToQuestion(qIdx);
                        onClose();
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.gridText, textStyle]}>
                        {qIdx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  closeText: {
    fontSize: 15,
    color: '#1565C0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  summary: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#616161',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  partGroup: {
    marginBottom: 20,
  },
  partGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 10,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dotUnanswered: {
    backgroundColor: '#EEEEEE',
  },
  gridTextUnanswered: {
    color: '#9E9E9E',
  },
  dotCurrent: {
    backgroundColor: '#1565C0',
  },
  gridTextCurrent: {
    color: '#FFFFFF',
  },
  dotAnswered: {
    backgroundColor: '#C8E6C9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  gridTextAnswered: {
    color: '#2E7D32',
  },
});

