import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Speech from 'expo-speech';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import { loadSceneMastery, saveSceneMastery, type SceneMastery } from '../utils/storage';
import wordsAll from '../data/words.json';
import { GRAMMAR_POINTS } from '../data/grammar';
import articlesData from '../data/articles.json';

// ===== Types =====

interface ArticleItem {
  id: string;
  sceneId: string;
  title: string;
  type: 'article' | 'dialogue';
  estimatedTime: number;
  passage: string;
  vocabWordIds: string[];
  questions: {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
  }[];
}

interface WordInfo {
  id: string;
  word: string;
  meaning: string;
}

interface TextSegment {
  text: string;
  isVocab: boolean;
  wordId?: string;
}

type Nav = StackNavigationProp<VocabTabParamList>;
type Route = RouteProp<VocabTabParamList, 'SceneStudy'>;

// ===== Helper: split passage into segments with vocab highlighting =====

function splitPassage(passage: string, vocabMap: Map<string, WordInfo>): TextSegment[] {
  const segments: TextSegment[] = [];
  // Build regex from vocab words, longer words first to match greedily
  const vocabEntries = Array.from(vocabMap.entries())
    .sort((a, b) => b[1].word.length - a[1].word.length);

  // Process text word by word + punctuation
  const tokens = passage.split(/(\s+|(?=[.,;:!?()\-—"])(?<=[^\s])|(?<=[.,;:!?()\-—"])(?=[^\s]))/g);

  let pending = '';
  for (const token of tokens) {
    if (!token || token === '') continue;
    pending += token;

    // Check if any vocab word ends at the current position
    const pendingLower = pending.toLowerCase().trim();
    let matched: { id: string; word: string } | null = null;

    for (const [wordId, info] of vocabEntries) {
      const wordLower = info.word.toLowerCase();
      // Match whole word (must be at word boundary)
      if (pendingLower.endsWith(wordLower)) {
        // Check if it's a clean word boundary match
        const beforeMatch = pendingLower.slice(0, -wordLower.length);
        const afterChar = pendingLower === wordLower ? '' : '';
        // Only match if preceded by space/punctuation/start
        if (beforeMatch === '' || /[\s.,;:!?()\-—"]$/.test(beforeMatch)) {
          matched = { id: wordId, word: info.word };
          break;
        }
      }
    }

    if (matched) {
      const beforeLen = pending.length - matched.word.length;
      const before = pending.slice(0, beforeLen);
      if (before) segments.push({ text: before, isVocab: false });
      segments.push({ text: matched.word, isVocab: true, wordId: matched.id });
      pending = '';
    }
  }

  if (pending) segments.push({ text: pending, isVocab: false });

  return segments;
}

// ===== Article Selector (compact tabs) =====

function ArticleSelector({
  articles,
  selectedId,
  onSelect,
}: {
  articles: ArticleItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (articles.length <= 1) return null;
  return (
    <View style={selStyles.container}>
      {articles.map((a) => {
        const active = a.id === selectedId;
        return (
          <TouchableOpacity
            key={a.id}
            style={[selStyles.tab, active && selStyles.tabActive]}
            onPress={() => onSelect(a.id)}
          >
            <Text style={[selStyles.tabText, active && selStyles.tabTextActive]}>
              {a.type === 'dialogue' ? '💬' : '📄'} {a.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const selStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  tab: {
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1565C0',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: '#1565C0' },
});

// ===== Vocab Detail Popup =====

function VocabPopup({
  visible, word, meaning, isKnown, onMarkKnown, onMarkUnknown, onClose,
}: {
  visible: boolean; word: string; meaning: string;
  isKnown: boolean; onMarkKnown: () => void; onMarkUnknown: () => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={popStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={popStyles.card}>
          <Text style={popStyles.word}>{word}</Text>
          <Text style={popStyles.meaning}>{meaning}</Text>
          <View style={popStyles.statusRow}>
            <View style={[popStyles.statusBadge, isKnown ? popStyles.knownBadge : popStyles.unknownBadge]}>
              <Text style={popStyles.statusText}>{isKnown ? '✅ 已掌握' : '❌ 未掌握'}</Text>
            </View>
          </View>
          <View style={popStyles.actions}>
            <TouchableOpacity
              style={[popStyles.btn, popStyles.btnKnown]}
              onPress={onMarkKnown}
            >
              <Text style={popStyles.btnText}>👍 我认识</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[popStyles.btn, popStyles.btnUnknown]}
              onPress={onMarkUnknown}
            >
              <Text style={[popStyles.btnText, { color: '#C62828' }]}>📝 不认识</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={popStyles.closeBtn} onPress={onClose}>
            <Text style={popStyles.closeText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const popStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  word: { fontSize: 24, fontWeight: '800', color: '#1565C0', marginBottom: 8 },
  meaning: { fontSize: 15, color: '#424242', marginBottom: 16, textAlign: 'center' },
  statusRow: { marginBottom: 20 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  knownBadge: { backgroundColor: '#E8F5E9' },
  unknownBadge: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 13, fontWeight: '700', color: '#424242' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnKnown: { backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#4CAF50' },
  btnUnknown: { backgroundColor: '#FFF3E0', borderWidth: 1.5, borderColor: '#FF9800' },
  btnText: { fontSize: 14, fontWeight: '700' },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 13, color: '#9E9E9E' },
});

// ===== Weak Words Panel =====

function WeakWordsPanel({
  weakWords, onWordTap,
}: {
  weakWords: WordInfo[]; onWordTap: (w: WordInfo) => void;
}) {
  if (weakWords.length === 0) {
    return (
      <View style={wwStyles.empty}>
        <Text style={wwStyles.emptyIcon}>🎉</Text>
        <Text style={wwStyles.emptyText}>太棒了！本场景词汇已全部掌握</Text>
      </View>
    );
  }
  return (
    <View style={wwStyles.container}>
      <Text style={wwStyles.title}>🎯 弱词推荐（重点学习）</Text>
      <View style={wwStyles.grid}>
        {weakWords.map((w) => (
          <TouchableOpacity key={w.id} style={wwStyles.chip} onPress={() => onWordTap(w)}>
            <Text style={wwStyles.chipWord}>{w.word}</Text>
            <Text style={wwStyles.chipMeaning} numberOfLines={1}>{w.meaning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const wwStyles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#FFE0B2', maxWidth: '48%',
  },
  chipWord: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  chipMeaning: { fontSize: 11, color: '#757575', marginTop: 2 },
  empty: { padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#757575' },
});

// ===== Comprehension Questions =====

function CompQuestions({
  questions, answers, onAnswer,
}: {
  questions: ArticleItem['questions'];
  answers: Record<string, number | null>;
  onAnswer: (qId: string, idx: number) => void;
}) {
  const [showResults, setShowResults] = useState(false);
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  return (
    <View style={qStyles.container}>
      <Text style={qStyles.title}>📋 阅读理解</Text>
      {questions.map((q, qi) => {
        const answered = answers[q.id] != null;
        const isCorrect = answers[q.id] === q.correctIndex;
        return (
          <View key={q.id} style={qStyles.qBlock}>
            <Text style={qStyles.qNum}>Q{qi + 1}. {q.text}</Text>
            {q.options.map((opt, oi) => {
              let optStyle = qStyles.optDefault;
              if (showResults && oi === q.correctIndex) optStyle = qStyles.optCorrect;
              else if (showResults && oi === answers[q.id] && oi !== q.correctIndex) optStyle = qStyles.optWrong;
              else if (oi === answers[q.id]) optStyle = qStyles.optSelected;
              return (
                <TouchableOpacity
                  key={oi}
                  style={[qStyles.optBtn, optStyle]}
                  onPress={() => onAnswer(q.id, oi)}
                  disabled={showResults}
                >
                  <Text style={qStyles.optLetter}>{['A','B','C','D'][oi]}</Text>
                  <Text style={qStyles.optText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
      {!showResults && questions.every((q) => answers[q.id] != null) && (
        <TouchableOpacity style={qStyles.checkBtn} onPress={() => setShowResults(true)}>
          <Text style={qStyles.checkBtnText}>✅ 提交答案</Text>
        </TouchableOpacity>
      )}
      {showResults && (
        <View style={qStyles.resultRow}>
          <Text style={qStyles.resultText}>
            {correctCount}/{questions.length} 正确
            {correctCount === questions.length ? ' 🎉' : ' 💪'}
          </Text>
        </View>
      )}
    </View>
  );
}

const qStyles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 12 },
  qBlock: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 10 },
  qNum: { fontSize: 14, fontWeight: '600', color: '#212121', marginBottom: 10, lineHeight: 20 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 6, backgroundColor: '#FAFAFA',
  },
  optDefault: {},
  optSelected: { backgroundColor: '#E8F0FE', borderColor: '#1A73E8' },
  optCorrect: { backgroundColor: '#E6F4EA', borderColor: '#34A853' },
  optWrong: { backgroundColor: '#FCE8E6', borderColor: '#EA4335' },
  optLetter: {
    width: 28, height: 28, borderRadius: 6, textAlign: 'center', lineHeight: 28,
    fontSize: 13, fontWeight: '700', backgroundColor: '#F5F5F5', color: '#616161', marginRight: 10, overflow: 'hidden',
  },
  optText: { fontSize: 13, color: '#424242', flex: 1 },
  checkBtn: { backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  resultRow: { backgroundColor: '#E8F5E9', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  resultText: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
});

// ===== MAIN SCREEN =====

export default function SceneStudyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sceneId, sceneTitle, sceneIcon } = route.params;

  // Load mastery state
  const [mastery, setMastery] = useState<SceneMastery>({});
  const [masteryLoaded, setMasteryLoaded] = useState(false);

  useEffect(() => {
    loadSceneMastery(sceneId).then((m) => { setMastery(m); setMasteryLoaded(true); });
  }, [sceneId]);

  // Parse articles for this scene
  const articles: ArticleItem[] = useMemo(
    () => (articlesData as ArticleItem[]).filter((a) => a.sceneId === sceneId),
    [sceneId],
  );
  const [articleIdx, setArticleIdx] = useState(0);
  const article = articles[articleIdx] ?? null;

  // Load words data for vocab map
  const [wordsData, setWordsData] = useState<WordInfo[]>([]);
  const [wordsLoaded, setWordsLoaded] = useState(false);

  useEffect(() => {
    // Load words data
    const allWords: WordInfo[] = (wordsAll as any[]).map((w: any) => ({
      id: w.id,
      word: w.word,
      meaning: w.meanings?.[0]?.zh ?? '',
    }));
    setWordsData(allWords);
    setWordsLoaded(true);
  }, []);

  // Vocab map for the current article
  const vocabMap = useMemo(() => {
    if (!article) return new Map<string, WordInfo>();
    const map = new Map<string, WordInfo>();
    for (const wid of article.vocabWordIds) {
      const w = wordsData.find((x) => x.id === wid);
      if (w) map.set(wid, w);
    }
    return map;
  }, [article, wordsData]);

  // Split passage into segments
  const segments = useMemo(() => {
    if (!article) return [];
    return splitPassage(article.passage, vocabMap);
  }, [article, vocabMap]);

  // Popup state
  const [popupWord, setPopupWord] = useState<WordInfo | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  // Comprehension answers
  const [answers, setAnswers] = useState<Record<string, number | null>>({});

  // TTS朗读
  const [speaking, setSpeaking] = useState(false);

  // Stop speech on unmount
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const handleSpeakPassage = useCallback(async () => {
    if (!article) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    // Clean the passage: strip excessive whitespace
    const text = article.passage.replace(/\s+/g, ' ').trim();
    setSpeaking(true);
    // Use lower rate for natural reading cadence
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.78,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [article, speaking]);

  // Known word IDs
  const knownIds = useMemo(() => new Set(Object.keys(mastery).filter((k) => mastery[k])), [mastery]);
  const totalVocab = vocabMap.size;
  const knownCount = Array.from(vocabMap.keys()).filter((id) => knownIds.has(id)).length;
  const masteryRate = totalVocab > 0 ? Math.round((knownCount / totalVocab) * 100) : 0;
  const weakWords = Array.from(vocabMap.values()).filter((w) => !knownIds.has(w.id));

  // Toggle mastery
  const toggleMastery = useCallback(
    (wordId: string, known: boolean) => {
      setMastery((prev) => {
        const next = { ...prev, [wordId]: known };
        saveSceneMastery(sceneId, next);
        return next;
      });
    },
    [sceneId],
  );

  const handleVocabTap = useCallback(
    (wordId: string) => {
      const w = vocabMap.get(wordId);
      if (w) {
        setPopupWord(w);
        setPopupVisible(true);
      }
    },
    [vocabMap],
  );

  const handleAnswer = useCallback((qId: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }, []);

  // Loading
  if (!masteryLoaded || !wordsLoaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>暂无文章</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{sceneIcon}</Text>
          <Text style={styles.headerTitle}>{sceneTitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.masteryBadge}>{masteryRate}%</Text>
        </View>
      </View>

      {/* Article Selector */}
      <ArticleSelector articles={articles} selectedId={article.id} onSelect={(id) => {
        const idx = articles.findIndex((a) => a.id === id);
        if (idx >= 0) { setArticleIdx(idx); setAnswers({}); }
      }} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Compact meta row: type + time + words + TTS */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleMetaText}>
              {article.type === 'dialogue' ? '💬 对话' : '📄 文章'}
              {' · '}⏱ {article.estimatedTime}min
              {' · '}{totalVocab}词
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.speakBtn, speaking && styles.speakBtnActive]}
            onPress={handleSpeakPassage}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>{speaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        {/* Mastery Bar — compact */}
        <View style={styles.masteryBarWrap}>
          <View style={styles.masteryBarBg}>
            <View style={[styles.masteryBarFill, { width: `${masteryRate}%` }]} />
          </View>
        </View>

        {/* Article Passage */}
        <View style={styles.passageCard}>
          <Text style={styles.passageText}>
            {segments.map((seg, i) =>
              seg.isVocab && seg.wordId ? (
                <Text
                  key={i}
                  style={[
                    styles.vocabWord,
                    knownIds.has(seg.wordId) ? styles.vocabKnown : styles.vocabUnknown,
                  ]}
                  onPress={() => handleVocabTap(seg.wordId!)}
                >
                  {seg.text}
                </Text>
              ) : (
                <Text key={i}>{seg.text}</Text>
              ),
            )}
          </Text>
        </View>

        {/* Weak Words */}
        <WeakWordsPanel weakWords={weakWords} onWordTap={(w) => {
          setPopupWord(w); setPopupVisible(true);
        }} />

        {/* Comprehension Questions */}
        {article.questions.length > 0 && (
          <CompQuestions questions={article.questions} answers={answers} onAnswer={handleAnswer} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Vocab Popup */}
      {popupWord && (
        <VocabPopup
          visible={popupVisible}
          word={popupWord.word}
          meaning={popupWord.meaning}
          isKnown={knownIds.has(popupWord.id)}
          onMarkKnown={() => toggleMastery(popupWord.id, true)}
          onMarkUnknown={() => toggleMastery(popupWord.id, false)}
          onClose={() => setPopupVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#757575', marginTop: 8 },
  emptyText: { fontSize: 16, color: '#9E9E9E' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 18, marginRight: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  headerRight: {},
  masteryBadge: {
    fontSize: 14, fontWeight: '800', color: '#FFFFFF',
    backgroundColor: '#1565C0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Compact meta row
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  metaLeft: { flex: 1 },
  articleTitle: { fontSize: 17, fontWeight: '800', color: '#212121', marginBottom: 4 },
  articleMetaText: { fontSize: 12, color: '#9E9E9E' },

  // Compact TTS button
  speakBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12,
  },
  speakBtnActive: {
    backgroundColor: '#E8EAF6',
  },

  masteryBarWrap: { paddingHorizontal: 16, marginBottom: 12 },
  masteryBarBg: {
    height: 5, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden',
  },
  masteryBarFill: {
    height: '100%', backgroundColor: '#4CAF50', borderRadius: 3,
  },

  passageCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, padding: 18,
    borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  passageText: { fontSize: 16, color: '#212121', lineHeight: 28 },
  vocabWord: {
    fontWeight: '700', paddingHorizontal: 2,
    borderBottomWidth: 2,
  },
  vocabKnown: {
    color: '#2E7D32', backgroundColor: '#E8F5E9',
    borderBottomColor: '#4CAF50',
  },
  vocabUnknown: {
    color: '#E65100', backgroundColor: '#FFF3E0',
    borderBottomColor: '#FF9800',
  },
});
