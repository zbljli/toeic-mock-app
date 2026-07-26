import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { playWord } from '../utils/audio';
import { VOCAB_GROUPS, type VocabWord } from '../data/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<VocabTabParamList>;

const ALL_WORDS: VocabWord[] = VOCAB_GROUPS.flatMap((g) => g.words);
const QUIZ_COUNT = 10;

interface QuizQuestion { word: VocabWord; options: string[]; correctIndex: number; }

function generateQuiz(): QuizQuestion[] {
  const pool = [...ALL_WORDS].sort(() => Math.random() - 0.5).slice(0, QUIZ_COUNT);
  return pool.map((word) => {
    const wrongOptions = ALL_WORDS
      .filter((w) => w.meaningZh !== word.meaningZh)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaningZh);
    const options = [word.meaningZh, ...wrongOptions].sort(() => Math.random() - 0.5);
    return { word, options, correctIndex: options.indexOf(word.meaningZh) };
  });
}

type OptKey = 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed';
function getOptKey(p: { showAnswer: boolean; idx: number; correctIndex: number; selectedIdx: number | null }): OptKey {
  const { showAnswer, idx, correctIndex, selectedIdx } = p;
  if (showAnswer) {
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIdx) return 'wrong';
    return 'dimmed';
  }
  if (idx === selectedIdx) return 'selected';
  return 'default';
}

const btnStyles: Record<OptKey, object> = {
  default: {}, selected: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  correct: { backgroundColor: '#E6F4EA', borderColor: '#34A853' },
  wrong: { backgroundColor: '#FCE8E6', borderColor: '#EA4335' },
  dimmed: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', opacity: 0.6 },
};
const txtStyles: Record<OptKey, object> = {
  default: {}, selected: { color: '#1A73E8', fontWeight: '600' },
  correct: { color: '#137333', fontWeight: '600' }, wrong: { color: '#C5221F', fontWeight: '600' },
  dimmed: { color: '#9E9E9E' },
};

export default function VocabularyQuizScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const quiz = useMemo(() => generateQuiz(), []);
  if (quiz.length === 0) return null;

  const currentQ = quiz[currentIdx];

  const handleSelect = (idx: number) => {
    if (showAnswer) return;
    setSelectedIdx(idx); setShowAnswer(true);
    if (idx === currentQ.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < quiz.length - 1) {
      setSelectedIdx(null); setShowAnswer(false); setCurrentIdx((i) => i + 1);
    } else { setIsDone(true); }
  };

  const handleSpeak = () => playWord(currentQ.word.word);

  if (isDone) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.resultWrap}>
          <Text style={s.resultIcon}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</Text>
          <Text style={s.resultTitle}>测验完成</Text>
          <Text style={s.resultScore}>{score} / {quiz.length}</Text>
          <Text style={s.resultPct}>正确率 {pct}%</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.retryBtnText}>返回词汇 Wiki</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← 退出</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{currentIdx + 1} / {quiz.length}</Text>
        <Text style={s.scoreText}>{score}✓</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.qCard}>
          <Text style={s.qLabel}>以下单词的中文意思是？</Text>
          <TouchableOpacity onPress={handleSpeak} style={s.speakBtn}>
            <Text style={s.qWord}>{currentQ.word.word} 🔊</Text>
          </TouchableOpacity>
        </View>
        <View style={s.optsWrap}>
          {currentQ.options.map((opt, idx) => {
            const k = getOptKey({ showAnswer, idx, correctIndex: currentQ.correctIndex, selectedIdx });
            return (
              <TouchableOpacity
                key={idx} style={[s.optBtn, btnStyles[k]]}
                onPress={() => handleSelect(idx)} disabled={showAnswer} activeOpacity={0.7}
              >
                <Text style={[s.optLetter, txtStyles[k]]}>{['A','B','C','D'][idx]}</Text>
                <Text style={[s.optText, txtStyles[k]]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {showAnswer && (
          <>
            <View style={s.detail}>
              <Text style={s.detailWord}>{currentQ.word.word}</Text>
              <Text style={s.detailMeaning}>{currentQ.word.meaningZh}</Text>
            </View>
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnText}>{currentIdx < quiz.length - 1 ? '下一题 →' : '查看结果'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#66BB6A' },
  body: { padding: 16, paddingBottom: 40 },
  qCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  qLabel: { fontSize: 13, color: '#9E9E9E', marginBottom: 12 },
  speakBtn: { padding: 8 },
  qWord: { fontSize: 28, fontWeight: '800', color: '#212121' },
  optsWrap: { },
  optBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', marginBottom: 10 },
  optLetter: { width: 32, height: 32, borderRadius: 6, textAlign: 'center', lineHeight: 32, fontSize: 14, fontWeight: '700', marginRight: 12, backgroundColor: '#F5F5F5', color: '#5F6368', overflow: 'hidden' },
  optText: { fontSize: 15, color: '#202124', flex: 1 },
  detail: { backgroundColor: '#FFF8E1', padding: 16, borderRadius: 12, marginTop: 16, borderLeftWidth: 3, borderLeftColor: '#FFC107' },
  detailWord: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 4 },
  detailMeaning: { fontSize: 14, color: '#757575' },
  nextBtn: { backgroundColor: '#66BB6A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  resultIcon: { fontSize: 56, marginBottom: 16 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 12 },
  resultScore: { fontSize: 48, fontWeight: '800', color: '#66BB6A' },
  resultPct: { fontSize: 16, color: '#757575', marginTop: 4, marginBottom: 32 },
  retryBtn: { backgroundColor: '#E8F5E9', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  retryBtnText: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
});
