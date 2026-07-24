import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GRAMMAR_POINTS } from '../data/grammar';
import type { VocabTabParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<VocabTabParamList>;
type Route = RouteProp<VocabTabParamList, 'GrammarQuiz'>;

type OptStyleKey = 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed';

function getOptStyleKey(params: {
  showAnswer: boolean;
  idx: number;
  correctIndex: number;
  selectedIdx: number | null;
}): OptStyleKey {
  const { showAnswer, idx, correctIndex, selectedIdx } = params;
  if (showAnswer) {
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIdx) return 'wrong';
    return 'dimmed';
  }
  if (idx === selectedIdx) return 'selected';
  return 'default';
}

const optBtnStyles: Record<OptStyleKey, object> = {
  default: {},
  selected: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  correct: { backgroundColor: '#E6F4EA', borderColor: '#34A853' },
  wrong: { backgroundColor: '#FCE8E6', borderColor: '#EA4335' },
  dimmed: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', opacity: 0.6 },
};

const optTextStyles: Record<OptStyleKey, object> = {
  default: {},
  selected: { color: '#1A73E8', fontWeight: '600' },
  correct: { color: '#137333', fontWeight: '600' },
  wrong: { color: '#C5221F', fontWeight: '600' },
  dimmed: { color: '#9E9E9E' },
};

export default function GrammarQuizScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { grammarId } = route.params;
  const grammar = GRAMMAR_POINTS.find((g) => g.id === grammarId);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  if (!grammar) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>暂无测验数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quiz = grammar.quiz;
  const currentQ = quiz[currentIdx];

  const handleSelect = (idx: number) => {
    if (showAnswer) return;
    setSelectedIdx(idx);
    setShowAnswer(true);
    if (idx === currentQ.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < quiz.length - 1) {
      setSelectedIdx(null);
      setShowAnswer(false);
      setCurrentIdx((i) => i + 1);
    } else {
      setIsDone(true);
    }
  };

  if (isDone) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>{pct === 100 ? '🎉' : pct >= 70 ? '👍' : '💪'}</Text>
          <Text style={styles.resultTitle}>测验完成</Text>
          <Text style={styles.resultScore}>{score} / {quiz.length}</Text>
          <Text style={styles.resultPct}>正确率 {pct}%</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>返回 Wiki</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 退出</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{grammar.titleZh} 测验</Text>
        <Text style={styles.scoreText}>{score}✓</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{currentIdx + 1} / {quiz.length}</Text>
        </View>

        <Text style={styles.qText}>{currentQ.question}</Text>

        <View style={styles.optionsWrap}>
          {currentQ.options.map((opt, idx) => {
            const styleKey = getOptStyleKey({ showAnswer, idx, correctIndex: currentQ.correctIndex, selectedIdx });
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optBtn, optBtnStyles[styleKey]]}
                onPress={() => handleSelect(idx)}
                disabled={showAnswer}
                activeOpacity={0.7}
              >
                <Text style={[styles.optLabel, optTextStyles[styleKey]]}>{['A', 'B', 'C', 'D'][idx]}</Text>
                <Text style={[styles.optText, optTextStyles[styleKey]]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showAnswer && (
          <>
            <View style={styles.explanationBox}>
              <Text style={styles.expTitle}>💡 解析</Text>
              <Text style={styles.expText}>{currentQ.explanation}</Text>
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx < quiz.length - 1 ? '下一题 →' : '查看结果'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9E9E9E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#42A5F5' },

  body: { padding: 16, paddingBottom: 40 },
  progressRow: { alignItems: 'center', marginBottom: 16 },
  progressText: { fontSize: 14, color: '#757575', fontWeight: '600' },

  qText: {
    fontSize: 17, fontWeight: '600', color: '#212121', lineHeight: 24,
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },

  optionsWrap: { gap: 10 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF',
  },
  optLabel: {
    width: 32, height: 32, borderRadius: 6, textAlign: 'center', lineHeight: 32,
    fontSize: 14, fontWeight: '700', marginRight: 12, backgroundColor: '#F5F5F5', color: '#5F6368', overflow: 'hidden',
  },
  optText: { fontSize: 15, color: '#202124', flex: 1 },

  explanationBox: {
    backgroundColor: '#E3F2FD', padding: 16, borderRadius: 12, marginTop: 16,
    borderLeftWidth: 3, borderLeftColor: '#42A5F5',
  },
  expTitle: { fontSize: 13, fontWeight: '700', color: '#1565C0', marginBottom: 6 },
  expText: { fontSize: 14, color: '#424242', lineHeight: 21 },

  nextBtn: {
    backgroundColor: '#42A5F5', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 16,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultIcon: { fontSize: 56, marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 12 },
  resultScore: { fontSize: 48, fontWeight: '800', color: '#42A5F5' },
  resultPct: { fontSize: 16, color: '#757575', marginTop: 4, marginBottom: 24 },
  retryBtn: { backgroundColor: '#E3F2FD', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  retryBtnText: { fontSize: 16, fontWeight: '700', color: '#1565C0' },
});
