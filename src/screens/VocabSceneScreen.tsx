import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, Dimensions, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SceneEntry, WordEntry, WordStatus } from '../types/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import { loadVocabState, saveVocabState, migrateMasteryIfNeeded } from '../utils/storage';
import { analyzeEtymology } from '../utils/etymology';
import { speakWord, stopSpeech } from '../utils/speech';
import scenesData from '../data/scenes.json';
import wordsData from '../data/words.json';

// ─── Types ───────────────────────────────────────────
type Nav = StackNavigationProp<VocabTabParamList>;
type Route = RouteProp<VocabTabParamList, 'VocabScene'>;

// ─── Layout constants ─────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const GRID_PADDING = 16;
const CARD_GAP = 14;
const COLS = 2;
const CARD_W = (SCREEN_W - GRID_PADDING * 2 - CARD_GAP * (COLS - 1)) / COLS;

// ─── Status color palette ────────────────────────────
const STATUS_META: Record<WordStatus, { bg: string; fg: string; label: string; dot: string }> = {
  unreviewed: { bg: '#F5F5F5', fg: '#9E9E9E', label: 'Untested', dot: '#BDBDBD' },
  mastered:   { bg: '#E8F5E9', fg: '#2E7D32', label: 'Mastered', dot: '#4CAF50' },
  unknown:    { bg: '#FFF3E0', fg: '#E65100', label: 'Learning', dot: '#FF9800' },
};

// ═══════════════════════════════════════════════════════
//  WORD CARD  — Apple Card 风格词砖
// ═══════════════════════════════════════════════════════
function WordCard({
  word, status, onPress, index,
}: {
  word: WordEntry; status: WordStatus; onPress: () => void; index: number;
}) {
  const meta = STATUS_META[status];
  const isFirstCol = index % 2 === 0;

  return (
    <TouchableOpacity
      style={[
        cardStyles.wrapper,
        isFirstCol ? cardStyles.wrapperLeft : cardStyles.wrapperRight,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.inner}>
        {/* Word */}
        <Text style={cardStyles.word} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.6}>
          {word.word}
        </Text>

        {/* Bottom accent strip */}
        <View style={[cardStyles.accent, { backgroundColor: meta.dot }]} />
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    marginBottom: CARD_GAP,
  },
  wrapperLeft: {
    marginRight: CARD_GAP / 2,
  },
  wrapperRight: {
    marginLeft: CARD_GAP / 2,
  },
  inner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    // Apple Card shadow — light, distant
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
    // Minimum height for visual consistency
    minHeight: 88,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 18,
  },
  word: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 20,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

// ═══════════════════════════════════════════════════════
//  STATS BANNER  — clickable filter stats
// ═══════════════════════════════════════════════════════
function StatsBanner({
  total, mastered, unknown, unreviewed, rate,
  activeFilter, onFilterChange,
}: {
  total: number; mastered: number; unknown: number; unreviewed: number; rate: number;
  activeFilter: WordStatus | null;
  onFilterChange: (f: WordStatus | null) => void;
}) {
  const tested = mastered + unknown;

  return (
    <View style={statsStyles.card}>
      {/* 3 clickable stat columns */}
      <View style={statsStyles.columns}>
        <TouchableOpacity
          style={statsStyles.item}
          onPress={() => onFilterChange(activeFilter === 'mastered' ? null : 'mastered')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#2E7D32' }, activeFilter === 'mastered' && statsStyles.itemActive]}>{mastered}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'mastered' && { color: '#2E7D32', fontWeight: '700' }]}>Mastered</Text>
        </TouchableOpacity>
        <View style={statsStyles.divider} />
        <TouchableOpacity
          style={statsStyles.item}
          onPress={() => onFilterChange(activeFilter === 'unknown' ? null : 'unknown')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#E65100' }, activeFilter === 'unknown' && statsStyles.itemActive]}>{unknown}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'unknown' && { color: '#E65100', fontWeight: '700' }]}>Learning</Text>
        </TouchableOpacity>
        <View style={statsStyles.divider} />
        <TouchableOpacity
          style={statsStyles.item}
          onPress={() => onFilterChange(activeFilter === 'unreviewed' ? null : 'unreviewed')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#9E9E9E' }, activeFilter === 'unreviewed' && statsStyles.itemActive]}>{unreviewed}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'unreviewed' && { color: '#757575', fontWeight: '700' }]}>Untested</Text>
        </TouchableOpacity>
      </View>

      {/* Progress track — segmented bar */}
      <View style={statsStyles.track}>
        {mastered > 0 && (
          <View style={[statsStyles.seg, { backgroundColor: '#4CAF50', flex: mastered }]} />
        )}
        {unknown > 0 && (
          <View style={[statsStyles.seg, { backgroundColor: '#FF9800', flex: unknown }]} />
        )}
        {unreviewed > 0 && (
          <View style={[statsStyles.seg, { backgroundColor: '#E0E0E0', flex: unreviewed }]} />
        )}
      </View>

      {/* Summary */}
      <Text style={statsStyles.summary}>
        Tested <Text style={statsStyles.summaryBold}>{tested}</Text>/{total}
        {'  '}·{'  '}
        Mastery <Text style={[statsStyles.summaryBold, { color: rate >= 60 ? '#2E7D32' : '#E65100' }]}>{rate}%</Text>
        {activeFilter && (
          <>
            {'  '}·{'  '}
            <Text style={[statsStyles.summaryBold, { color: '#1565C0' }]}>Filtered</Text>
            <Text style={statsStyles.summaryDim}> — tap again to clear</Text>
          </>
        )}
      </Text>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 18,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F0',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemActive: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  itemLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
    fontWeight: '500',
  },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  seg: {
    height: '100%',
    minWidth: 4,
  },
  summary: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  summaryBold: {
    fontWeight: '700',
    color: '#424242',
  },
  summaryDim: {
    color: '#BDBDBD',
  },
});

// ═══════════════════════════════════════════════════════
//  WORD SHEET  — 3-button bottom sheet
// ═══════════════════════════════════════════════════════
function WordSheet({
  visible, word, status, onClose, onMark,
}: {
  visible: boolean; word: WordEntry | null; status: WordStatus;
  onClose: () => void;
  onMark: (s: WordStatus) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const meta = STATUS_META[status];

  // Reset on word change, auto-speak
  useEffect(() => {
    if (!visible || !word) return;
    setRevealed(false);
    const t = setTimeout(() => {
      speakWord(word.word);
    }, 400);
    return () => { clearTimeout(t); stopSpeech(); };
  }, [visible, word?.id]);

  const etymology = useMemo(
    () => (word ? analyzeEtymology(word.word) : null),
    [word?.id],
  );

  /** Know it → mark as mastered, advance */
  const handleKnow = () => { onMark('mastered'); };

  /** Not sure → mark as unknown, advance */
  const handleNotSure = () => { onMark('unknown'); };

  /** Show answer → reveal meanings AND count as unknown */
  const handleReveal = () => {
    setRevealed(true);
    onMark('unknown');
  };

  const handleSpeak = () => {
    if (word) speakWord(word.word);
  };

  if (!word) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={sheet.panel} activeOpacity={1} onPress={() => {}}>
          {/* Drag handle */}
          <View style={sheet.handle} />

          {/* Close button */}
          <TouchableOpacity style={sheet.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={sheet.closeX}>✕</Text>
          </TouchableOpacity>

          {/* ── Word hero ── */}
          <Text style={sheet.wordHero}>{word.word}</Text>
          {word.phonetic && word.phonetic !== `/${word.word.toLowerCase()}/` && (
            <Text style={sheet.phonetic}>{word.phonetic}</Text>
          )}

          {/* 🔊 Audio button */}
          <TouchableOpacity style={sheet.speakPill} onPress={handleSpeak}>
            <Text style={sheet.speakIcon}>🔊</Text>
            <Text style={sheet.speakLabel}>Listen</Text>
          </TouchableOpacity>

          {/* ══ Three action buttons ══ */}
          <View style={sheet.actions}>
            <TouchableOpacity
              style={[sheet.actionBtn, sheet.btnKnow]}
              onPress={handleKnow}
              activeOpacity={0.7}
            >
              <Text style={sheet.btnKnowText}>✅ Know</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[sheet.actionBtn, sheet.btnDunno]}
              onPress={handleNotSure}
              activeOpacity={0.7}
            >
              <Text style={sheet.btnDunnoText}>❌ Not Sure</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[sheet.actionBtn, sheet.btnReveal]}
              onPress={handleReveal}
              activeOpacity={0.7}
            >
              <Text style={sheet.btnRevealText}>👁 Answer</Text>
            </TouchableOpacity>
          </View>

          {/* ══ Revealed content ══ */}
          {revealed && (
            <ScrollView
              style={sheet.revealScroll}
              contentContainerStyle={sheet.revealPad}
              showsVerticalScrollIndicator={false}
            >
              {/* POS + status chips */}
              <View style={sheet.chipRow}>
                <View style={sheet.posChip}>
                  <Text style={sheet.posChipText}>{word.partOfSpeech}</Text>
                </View>
                <View style={[sheet.statusChip, { backgroundColor: STATUS_META.unknown.bg }]}>
                  <Text style={[sheet.statusChipText, { color: STATUS_META.unknown.fg }]}>Learning</Text>
                </View>
              </View>

              {/* Chinese meanings — always visible for unknown words */}
              <View style={sheet.meaningBlock}>
                <Text style={sheet.meaningTitle}>中文释义</Text>
                {word.meanings.map((m, i) => (
                  <Text key={i} style={sheet.meaningText}>
                    {m.zh}{m.context ? `（${m.context}）` : ''}
                  </Text>
                ))}
              </View>

              {/* Examples */}
              {word.examples.length > 0 && (
                <View style={sheet.block}>
                  <Text style={sheet.blockTitle}>📝 Examples</Text>
                  {word.examples.slice(0, 2).map((ex, i) => (
                    <View key={i} style={sheet.exItem}>
                      <Text style={sheet.exEn}>{ex.en}</Text>
                      <Text style={sheet.exZh}>{ex.zh}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Etymology */}
              {etymology && (
                <View style={sheet.block}>
                  <Text style={sheet.blockTitle}>🧩 Word Structure</Text>
                  <View style={sheet.etymBox}>
                    <View style={sheet.etymParts}>
                      {etymology.prefix && (
                        <>
                          <EtymPart
                            text={etymology.prefix.text.replace('-', '')}
                            hint={etymology.prefix.meaning}
                            role="Prefix"
                          />
                          <Text style={sheet.etymPlus}>+</Text>
                        </>
                      )}
                      <EtymPart
                        text={etymology.root.text}
                        hint={etymology.root.meaning}
                        role="Root"
                        accent
                      />
                      {etymology.suffix && (
                        <>
                          <Text style={sheet.etymPlus}>+</Text>
                          <EtymPart
                            text={etymology.suffix.text.replace('-', '')}
                            hint={etymology.suffix.meaning}
                            role="Suffix"
                          />
                        </>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/** A single etymology segment: prefix / root / suffix */
function EtymPart({ text, hint, role, accent }: {
  text: string; hint: string; role: string; accent?: boolean;
}) {
  return (
    <View style={sheet.etymPart}>
      <View style={[sheet.etymPartBox, accent && sheet.etymPartBoxAccent]}>
        <Text style={[sheet.etymPartText, accent && { color: '#E65100' }]}>{text}</Text>
      </View>
      <Text style={sheet.etymPartRole}>{role}</Text>
      <Text style={sheet.etymPartHint}>{hint}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function VocabSceneScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sceneId, sceneTitle, sceneIcon } = route.params;

  // Data
  const [scene, setScene] = useState<SceneEntry | null>(null);
  const [wordMap, setWordMap] = useState<Record<string, WordEntry>>({});
  const [state, setState] = useState<Record<string, WordStatus>>({});
  const [loading, setLoading] = useState(true);

  // Sheet
  const [sheetWord, setSheetWord] = useState<WordEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter
  const [activeFilter, setActiveFilter] = useState<WordStatus | null>(null);

  // Load scene + words + vocab state
  useEffect(() => {
    (async () => {
      const sl: SceneEntry[] = scenesData as SceneEntry[];
      const wl: WordEntry[] = wordsData as WordEntry[];
      setScene(sl.find((s) => s.id === sceneId) ?? null);

      const map: Record<string, WordEntry> = {};
      wl.forEach((w) => { map[w.id] = w; });
      setWordMap(map);

      await migrateMasteryIfNeeded(sceneId);
      const savedState = await loadVocabState(sceneId);
      console.log('[Vocab] Loaded state for', sceneId, ':', Object.keys(savedState).length, 'words');
      setState(savedState);
      setLoading(false);
    })();
  }, [sceneId]);

  // Words in this scene
  const allWords = useMemo(() => {
    if (!scene) return [];
    return scene.wordIds.map((id) => wordMap[id]).filter(Boolean) as WordEntry[];
  }, [scene, wordMap]);

  // Filtered words
  const words = useMemo(() => {
    if (!activeFilter) return allWords;
    return allWords.filter((w) => (state[w.id] ?? 'unreviewed') === activeFilter);
  }, [allWords, state, activeFilter]);

  // Stats (always based on ALL words)
  const stats = useMemo(() => {
    let mastered = 0, unknown = 0, unreviewed = 0;
    allWords.forEach((w) => {
      const s = state[w.id] ?? 'unreviewed';
      if (s === 'mastered') mastered++;
      else if (s === 'unknown') unknown++;
      else unreviewed++;
    });
    const total = allWords.length;
    const tested = mastered + unknown;
    return {
      total, mastered, unknown, unreviewed, tested,
      rate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }, [allWords, state]);

  // Mark word status — persist immediately, auto-advance
  const handleMark = useCallback(async (status: WordStatus) => {
    if (!sheetWord) return;
    const wordId = sheetWord.id;
    const next = { ...state, [wordId]: status };
    setState(next);
    await saveVocabState(sceneId, next);
    // Auto-advance to next word in current view
    const currentList = activeFilter ? allWords.filter((w) => (next[w.id] ?? 'unreviewed') === activeFilter) : allWords;
    const idx = currentList.findIndex(w => w.id === wordId);
    if (idx >= 0 && idx < currentList.length - 1) {
      setSheetWord(currentList[idx + 1]);
    } else {
      setSheetOpen(false);
    }
  }, [sheetWord, state, sceneId, allWords, activeFilter]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color="#1976D2" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerSide}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerIcon}>{sceneIcon}</Text>
          <Text style={s.title}>{sceneTitle}</Text>
        </View>
        <View style={[s.headerSide, s.headerRight]}>
          <Text style={s.wordCount}>{stats.total} words</Text>
        </View>
      </View>

      {/* ── Stats ── */}
      <StatsBanner
        {...stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ── Word Grid ── */}
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        {words.length === 0 && activeFilter && (
          <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#9E9E9E', fontSize: 14 }}>No words match this filter</Text>
          </View>
        )}
        {words.map((w, idx) => (
          <WordCard
            key={w.id}
            word={w}
            status={state[w.id] ?? 'unreviewed'}
            onPress={() => { setSheetWord(w); setSheetOpen(true); }}
            index={idx}
          />
        ))}

        {/* Bottom spacer for scroll comfort */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Sheet ── */}
      <WordSheet
        visible={sheetOpen}
        word={sheetWord}
        status={sheetWord ? (state[sheetWord.id] ?? 'unreviewed') : 'unreviewed'}
        onClose={() => setSheetOpen(false)}
        onMark={handleMark}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  headerSide: {
    minWidth: 60,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  back: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: { fontSize: 18, marginRight: 6 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  wordCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#757575',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    paddingTop: 6,
    paddingBottom: 20,
  },
});

// ── Sheet styles ─────────────────────────────────────
const sheet = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: 340,
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 22,
    padding: 6,
    zIndex: 10,
  },
  closeX: { fontSize: 18, color: '#BDBDBD' },

  // Word hero
  wordHero: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  phonetic: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  speakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  speakIcon: { fontSize: 16, marginRight: 6 },
  speakLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },

  // ── Actions: 3 equal buttons ──
  actions: {
    flexDirection: 'row',
    marginTop: 22,
    paddingHorizontal: 0,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    minHeight: 52,
  },

  btnKnow: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  btnKnowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  btnDunno: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FF9800',
  },
  btnDunnoText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '700',
  },
  btnReveal: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1.5,
    borderColor: '#1565C0',
  },
  btnRevealText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '700',
  },

  // ── Phase 2: Reveal ──
  revealScroll: {},
  revealPad: { paddingTop: 18 },

  // Chips
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  posChip: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  posChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Meaning block
  meaningBlock: {
    backgroundColor: '#FFFDE7',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    marginBottom: 18,
  },
  meaningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F57F17',
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 16,
    color: '#424242',
    fontWeight: '600',
    lineHeight: 26,
  },

  // Examples
  block: { marginBottom: 18 },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#616161',
    marginBottom: 10,
  },
  exItem: {
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  exEn: {
    fontSize: 14,
    color: '#424242',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  exZh: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },

  // Etymology
  etymBox: {
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  etymParts: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  etymPart: {
    alignItems: 'center',
    marginRight: 8,
  },
  etymPartBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  etymPartBoxAccent: {
    borderColor: '#FF9800',
  },
  etymPartText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1565C0',
  },
  etymPartRole: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 4,
    fontWeight: '600',
  },
  etymPartHint: {
    fontSize: 10,
    color: '#757575',
    marginTop: 1,
  },
  etymPlus: {
    fontSize: 16,
    color: '#BDBDBD',
    fontWeight: '700',
    paddingBottom: 18,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  toggleBtnActiveDunno: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  toggleTextActive: {
    color: '#2E7D32',
  },
  toggleTextActiveDunno: {
    color: '#E65100',
  },
});
