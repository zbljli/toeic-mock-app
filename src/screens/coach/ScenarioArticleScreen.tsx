import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { playText, stopAll } from '../../utils/audio';
import type { ScenariosTabParamList } from '../../navigation/AppNavigator';
import { loadVocabState, saveVocabState, migrateMasteryIfNeeded } from '../../utils/storage';
import type { VocabState } from '../../types/vocabulary';
import { loadArticles, loadWords } from '../../utils/loadData';

// ── Types ──

interface ArticleItem {
  id: string;
  sceneId: string;
  title: string;
  type: 'article' | 'dialogue';
  estimatedTime: number;
  passage: string;
  vocabWordIds: string[];
  questions?: { id: string; text: string; options: string[]; correctIndex: number }[];
}

interface WordInfo {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
}

interface TextSegment {
  text: string;
  isVocab: boolean;
  wordId?: string;
}

type Nav = StackNavigationProp<ScenariosTabParamList>;
type Route = RouteProp<ScenariosTabParamList, 'ScenarioArticle'>;

// ── splitPassage: highlight vocab words inline ──

function splitPassage(passage: string, vocabMap: Map<string, WordInfo>): TextSegment[] {
  const segments: TextSegment[] = [];
  const vocabEntries = Array.from(vocabMap.entries())
    .sort((a, b) => b[1].word.length - a[1].word.length);

  const tokens = passage.split(/(\s+|(?=[.,;:!?()\-—"])(?<=[^\s])|(?<=[.,;:!?()\-—"])(?=[^\s]))/g);

  let pending = '';
  for (const token of tokens) {
    if (!token || token === '') continue;
    pending += token;

    const pendingLower = pending.toLowerCase().trim();
    let matched: { id: string; word: string } | null = null;

    for (const [wordId, info] of vocabEntries) {
      const wordLower = info.word.toLowerCase();
      if (pendingLower.endsWith(wordLower)) {
        const beforeMatch = pendingLower.slice(0, -wordLower.length);
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

// ── Article Selector Tabs ──

function ArticleSelector({
  articles, selectedId, onSelect,
}: {
  articles: ArticleItem[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  if (articles.length <= 1) return null;
  return (
    <View style={sel.go}>
      {articles.map((a) => (
        <TouchableOpacity
          key={a.id}
          style={[sel.tab, a.id === selectedId && sel.tabOn]}
          onPress={() => onSelect(a.id)}
        >
          <Text style={[sel.txt, a.id === selectedId && sel.txtOn]}>
            {a.type === 'dialogue' ? '💬' : '📄'} {a.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const sel = StyleSheet.create({
  go: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  tab: { paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: '#1565C0' },
  txt: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  txtOn: { color: '#1565C0' },
});

// ── Vocab Popup Modal ──

function VocabPopup({
  visible, word, meaning, isMastered, onMarkMastered, onMarkUnknown, onClose,
}: {
  visible: boolean; word: string; meaning: string;
  isMastered: boolean; onMarkMastered: () => void; onMarkUnknown: () => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pop.back} activeOpacity={1} onPress={onClose}>
        <View style={pop.card}>
          <Text style={pop.word}>{word}</Text>
          <Text style={pop.meaning}>{meaning}</Text>
          <View style={pop.statusRow}>
            <View style={[pop.badge, isMastered ? pop.masteredBadge : pop.unknownBadge]}>
              <Text style={pop.badgeText}>{isMastered ? '✅ Mastered' : '📝 Not Yet'}</Text>
            </View>
          </View>
          <View style={pop.actions}>
            <TouchableOpacity style={[pop.btn, pop.btnMastered]} onPress={onMarkMastered}>
              <Text style={pop.btnText}>👍 Got it</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[pop.btn, pop.btnUnknown]} onPress={onMarkUnknown}>
              <Text style={[pop.btnText, { color: '#C62828' }]}>📝 Not sure</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={pop.closeBtn} onPress={onClose}>
            <Text style={pop.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const pop = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  word: { fontSize: 24, fontWeight: '800', color: '#1565C0', marginBottom: 8 },
  meaning: { fontSize: 15, color: '#424242', marginBottom: 16, textAlign: 'center' },
  statusRow: { marginBottom: 20 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  masteredBadge: { backgroundColor: '#E8F5E9' },
  unknownBadge: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#424242' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnMastered: { backgroundColor: '#E8F5E9', borderWidth: 1.5, borderColor: '#4CAF50' },
  btnUnknown: { backgroundColor: '#FFF3E0', borderWidth: 1.5, borderColor: '#FF9800' },
  btnText: { fontSize: 14, fontWeight: '700' },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 13, color: '#9E9E9E' },
});

// ── Progress Summary Card ──

function ProgressSummary({
  mastered, total, justLearned,
}: {
  mastered: number; total: number; justLearned: WordInfo[];
}) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  let message: string;
  let emoji: string;
  if (pct === 100) {
    message = "You've mastered every word in this scene. Outstanding!";
    emoji = '🏆';
  } else if (pct >= 70) {
    message = "Great progress! You're building strong scene vocabulary.";
    emoji = '🌟';
  } else if (pct >= 30) {
    message = "Keep reading — each pass locks in more words.";
    emoji = '💪';
  } else {
    message = "Read the article a few times. Words will start to stick!";
    emoji = '🌱';
  }

  return (
    <View style={ps.go}>
      <View style={ps.top}>
        <Text style={ps.emoji}>{emoji}</Text>
        <View style={ps.info}>
          <Text style={ps.count}>
            <Text style={ps.countNum}>{mastered}</Text>
            <Text style={ps.countOf}> / {total}</Text>
            <Text style={ps.countLabel}> words mastered</Text>
          </Text>
          <Text style={ps.msg}>{message}</Text>
        </View>
      </View>
      {justLearned.length > 0 && (
        <View style={ps.learnedRow}>
          <Text style={ps.learnedLabel}>🆕 Just learned this session:</Text>
          <View style={ps.learnedChips}>
            {justLearned.map((w) => (
              <View key={w.id} style={ps.learnedChip}>
                <Text style={ps.learnedWord}>{w.word}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={ps.bar}>
        <View style={[ps.barFill, { width: `${Math.max(pct, 2)}%` }]} />
      </View>
    </View>
  );
}
const ps = StyleSheet.create({
  go: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 32, marginRight: 14 },
  info: { flex: 1 },
  count: { marginBottom: 4 },
  countNum: { fontSize: 26, fontWeight: '800', color: '#1A237E' },
  countOf: { fontSize: 16, color: '#9E9E9E', fontWeight: '600' },
  countLabel: { fontSize: 14, color: '#757575', fontWeight: '600' },
  msg: { fontSize: 13, color: '#616161', lineHeight: 18 },
  learnedRow: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  learnedLabel: { fontSize: 12, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  learnedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  learnedChip: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7',
  },
  learnedWord: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  bar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
});

// ── Word Blocks Panel (categorized) ──

function WordBlocks({
  words, mastery, initialMastery, onWordTap,
}: {
  words: WordInfo[]; mastery: VocabState; initialMastery: VocabState; onWordTap: (w: WordInfo) => void;
}) {
  const justLearned = words.filter((w) => {
    const was = initialMastery[w.id] ?? 'new';
    const now = mastery[w.id] ?? 'new';
    return was !== 'known' && now === 'known';
  });

  const stillLearning = words.filter((w) => {
    const now = mastery[w.id] ?? 'new';
    return now !== 'known';
  });

  const alreadyKnew = words.filter((w) => {
    const was = initialMastery[w.id] ?? 'new';
    const now = mastery[w.id] ?? 'new';
    return was === 'known' && now === 'known';
  });

  if (words.length === 0) return null;

  return (
    <View style={wb.go}>
      {/* Still Learning — most prominent */}
      {stillLearning.length > 0 && (
        <View style={wb.section}>
          <Text style={wb.sectionTitle}>
            📝 Still Learning ({stillLearning.length})
          </Text>
          <View style={wb.grid}>
            {stillLearning.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[wb.chip, wb.chipUnknown]}
                onPress={() => onWordTap(w)}
              >
                <Text style={[wb.chipWord, wb.chipWordNew]}>{w.word}</Text>
                <Text style={wb.chipMeaning} numberOfLines={1}>{w.meaning}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Just Learned — celebration */}
      {justLearned.length > 0 && (
        <View style={wb.section}>
          <Text style={wb.sectionTitle}>
            🆕 Just Learned ({justLearned.length})
          </Text>
          <View style={wb.grid}>
            {justLearned.map((w) => (
              <View key={w.id} style={[wb.chip, wb.chipJustLearned]}>
                <Text style={[wb.chipWord, wb.chipWordDone]}>{w.word}</Text>
                <Text style={wb.chipMeaning} numberOfLines={1}>{w.meaning}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Already Knew — collapsed */}
      {alreadyKnew.length > 0 && (
        <View style={wb.section}>
          <Text style={wb.sectionTitleDone}>
            ✅ Already Knew ({alreadyKnew.length})
          </Text>
          <View style={wb.grid}>
            {alreadyKnew.map((w) => (
              <View key={w.id} style={[wb.chip, wb.chipMastered]}>
                <Text style={[wb.chipWord, wb.chipWordDone]}>{w.word}</Text>
                <Text style={wb.chipMeaning} numberOfLines={1}>{w.meaning}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {stillLearning.length === 0 && justLearned.length === 0 && (
        <View style={wb.empty}>
          <Text style={wb.emptyIcon}>🎉</Text>
          <Text style={wb.emptyText}>All words in this scene mastered!</Text>
        </View>
      )}
    </View>
  );
}
const wb = StyleSheet.create({
  go: { padding: 16, paddingTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 10 },
  sectionTitleDone: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, maxWidth: '48%',
  },
  chipMastered: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  chipUnknown: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
  chipJustLearned: { backgroundColor: '#E8F5E9', borderColor: '#66BB6A', borderWidth: 2 },
  chipWord: { fontSize: 14, fontWeight: '700', color: '#E65100' },
  chipWordNew: { color: '#E65100' },
  chipWordDone: { color: '#2E7D32' },
  chipMeaning: { fontSize: 11, color: '#757575', marginTop: 2 },
  empty: { padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#757575' },
});

// ── Main Screen ──

export default function ScenarioArticleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sceneId, sceneTitle, sceneIcon } = route.params;

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [words, setWords] = useState<WordInfo[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [mastery, setMastery] = useState<VocabState>({});
  const [loading, setLoading] = useState(true);
  const [popupWord, setPopupWord] = useState<WordInfo | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const initialMastery = useRef<VocabState>({});

  // Load data
  useEffect(() => {
    (async () => {
      await migrateMasteryIfNeeded(sceneId);

      const [allArticlesData, allWordsData] = await Promise.all([
        loadArticles(), loadWords(),
      ]);
      const allArticles = allArticlesData as ArticleItem[];

      const sceneArticles = allArticles.filter((a) => a.sceneId === sceneId);
      setArticles(sceneArticles);
      if (sceneArticles.length > 0) setCurrentArticleId(sceneArticles[0].id);

      // Build word info list
      const wordMap = new Map<string, any>();
      for (const w of allWordsData) wordMap.set(w.id, w);

      const wordList: WordInfo[] = [];
      const vocabIds = new Set<string>();
      for (const a of sceneArticles) {
        for (const wid of a.vocabWordIds) vocabIds.add(wid);
      }
      for (const wid of vocabIds) {
        const entry = wordMap.get(wid);
        if (entry) {
          wordList.push({
            id: entry.id,
            word: entry.word,
            meaning: entry.meanings?.[0]?.zh ?? entry.word,
            phonetic: entry.phonetic,
          });
        }
      }
      setWords(wordList);

      const mst = await loadVocabState(sceneId);
      setMastery(mst);
      initialMastery.current = { ...mst };
      setLoading(false);
    })();
  }, [sceneId]);

  const currentArticle = useMemo(
    () => articles.find((a) => a.id === currentArticleId) ?? null,
    [articles, currentArticleId],
  );

  // Build vocab map for current article
  const vocabMap = useMemo(() => {
    const map = new Map<string, WordInfo>();
    if (!currentArticle) return map;
    for (const w of words) {
      if (currentArticle.vocabWordIds.includes(w.id)) {
        map.set(w.id, w);
      }
    }
    return map;
  }, [currentArticle, words]);

  // Split passage into highlighted segments
  const passageSegments = useMemo(() => {
    if (!currentArticle) return [];
    return splitPassage(currentArticle.passage, vocabMap);
  }, [currentArticle, vocabMap]);

  // Words for blocks panel
  const articleWords = useMemo(() => {
    if (!currentArticle) return [];
    return words.filter((w) => currentArticle.vocabWordIds.includes(w.id));
  }, [currentArticle, words]);

  // Mastery counts
  const masteryStats = useMemo(() => {
    let mastered = 0;
    for (const w of articleWords) {
      if ((mastery[w.id] ?? 'new') === 'known') mastered++;
    }
    return { mastered, total: articleWords.length };
  }, [articleWords, mastery]);

  // Words learned this session
  const justLearned = useMemo(() => {
    return articleWords.filter((w) => {
      const was = initialMastery.current[w.id] ?? 'new';
      const now = mastery[w.id] ?? 'new';
      return was !== 'known' && now === 'known';
    });
  }, [articleWords, mastery]);

  // ── Handlers ──

  const handleWordTap = useCallback((w: WordInfo) => {
    setPopupWord(w);
  }, []);

  const handleMarkMastered = useCallback(async () => {
    if (!popupWord) return;
    const next = { ...mastery, [popupWord.id]: 'known' as const };
    setMastery(next);
    await saveVocabState(sceneId, next);
    setPopupWord(null);
  }, [popupWord, mastery, sceneId]);

  const handleMarkUnknown = useCallback(async () => {
    if (!popupWord) return;
    const next = { ...mastery, [popupWord.id]: 'learning' as const };
    setMastery(next);
    await saveVocabState(sceneId, next);
    setPopupWord(null);
  }, [popupWord, mastery, sceneId]);

  const handleTTS = useCallback(() => {
    if (!currentArticle) return;
    if (speaking) {
      stopAll();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    playText(currentArticle.passage, {
      rate: 0.78,
      onDone: () => setSpeaking(false),
    });
  }, [currentArticle, speaking]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={st.back}>← Back</Text>
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerIcon}>{sceneIcon}</Text>
          <Text style={st.headerTitle}>{sceneTitle}</Text>
        </View>
        <View style={st.masteryBadge}>
          <Text style={st.masteryText}>{masteryStats.mastered}/{masteryStats.total}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll}>
        {/* Article Selector Tabs */}
        <ArticleSelector
          articles={articles}
          selectedId={currentArticleId}
          onSelect={setCurrentArticleId}
        />

        {currentArticle && (
          <>
            {/* Meta Row */}
            <View style={st.meta}>
              <Text style={st.metaTitle}>{currentArticle.title}</Text>
              <View style={st.metaInfo}>
                <Text style={st.metaTag}>
                  {currentArticle.type === 'dialogue' ? '💬 Dialogue' : '📄 Article'}
                </Text>
                <Text style={st.metaTag}>🕐 {currentArticle.estimatedTime} min</Text>
                <Text style={st.metaTag}>📚 {currentArticle.vocabWordIds.length} words</Text>
              </View>
            </View>

            {/* TTS Button */}
            <TouchableOpacity
              style={[st.ttsBtn, speaking && st.ttsBtnActive]}
              onPress={handleTTS}
              activeOpacity={0.7}
            >
              <Text style={st.ttsIcon}>{speaking ? '⏸' : '🔊'}</Text>
              <Text style={st.ttsLabel}>
                {speaking ? 'Stop Listening' : 'Listen to Article'}
              </Text>
            </TouchableOpacity>

            {/* Mastery Progress */}
            <View style={st.progressRow}>
              <View style={st.progressBar}>
                <View
                  style={[
                    st.progressFill,
                    { width: `${masteryStats.total > 0 ? Math.round((masteryStats.mastered / masteryStats.total) * 100) : 0}%` },
                  ]}
                />
              </View>
              <Text style={st.progressText}>
                {masteryStats.mastered}/{masteryStats.total} mastered
              </Text>
            </View>

            {/* Passage Card */}
            <View style={st.passageCard}>
              <Text style={st.passageText}>
                {passageSegments.map((seg, i) => {
                  if (!seg.isVocab) {
                    return <Text key={i}>{seg.text}</Text>;
                  }
                  const isMastered = (mastery[seg.wordId!] ?? 'new') === 'known';
                  const wordInfo = vocabMap.get(seg.wordId!);
                  return (
                    <Text
                      key={i}
                      style={isMastered ? st.vocabMastered : st.vocabUnknown}
                      onPress={() => wordInfo && handleWordTap(wordInfo)}
                    >
                      {seg.text}
                    </Text>
                  );
                })}
              </Text>
            </View>

            {/* Progress Summary */}
            <ProgressSummary
              mastered={masteryStats.mastered}
              total={masteryStats.total}
              justLearned={justLearned}
            />

            {/* Word Blocks */}
            <WordBlocks
              words={articleWords}
              mastery={mastery}
              initialMastery={initialMastery.current}
              onWordTap={handleWordTap}
            />
          </>
        )}

        {articles.length === 0 && (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>📭</Text>
            <Text style={st.emptyText}>No articles available for this scene yet.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Vocab Popup */}
      {popupWord && (
        <VocabPopup
          visible={true}
          word={popupWord.word}
          meaning={popupWord.meaning}
          isMastered={(mastery[popupWord.id] ?? 'new') === 'known'}
          onMarkMastered={handleMarkMastered}
          onMarkUnknown={handleMarkUnknown}
          onClose={() => setPopupWord(null)}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  back: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  masteryBadge: {
    backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  masteryText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },

  // Meta
  meta: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  metaTitle: { fontSize: 20, fontWeight: '800', color: '#1A237E', marginBottom: 8 },
  metaInfo: { flexDirection: 'row', gap: 12 },
  metaTag: { fontSize: 12, color: '#757575', fontWeight: '600' },

  // TTS
  ttsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#E3F2FD', gap: 8,
  },
  ttsBtnActive: { backgroundColor: '#FFF3E0' },
  ttsIcon: { fontSize: 20 },
  ttsLabel: { fontSize: 15, fontWeight: '700', color: '#1565C0' },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#757575', fontWeight: '600' },

  // Passage
  passageCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 20, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  passageText: { fontSize: 16, color: '#212121', lineHeight: 26 },
  vocabMastered: {
    color: '#2E7D32', fontWeight: '700', textDecorationLine: 'underline',
    textDecorationColor: '#A5D6A7', backgroundColor: 'rgba(76,175,80,0.08)',
  },
  vocabUnknown: {
    color: '#E65100', fontWeight: '700', textDecorationLine: 'underline',
    textDecorationColor: '#FFCC80', backgroundColor: 'rgba(255,152,0,0.08)',
  },

  // Empty
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9E9E9E' },
});
