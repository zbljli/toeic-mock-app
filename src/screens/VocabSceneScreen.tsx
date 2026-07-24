import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, Dimensions, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Speech from 'expo-speech';
import type { SceneEntry, WordEntry, WordStatus } from '../types/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import { loadVocabState, saveVocabState, migrateMasteryIfNeeded } from '../utils/storage';
import { analyzeEtymology } from '../utils/etymology';
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
//  STATS BANNER  — 顶部统计卡片
// ═══════════════════════════════════════════════════════
function StatsBanner({
  total, mastered, unknown, unreviewed, rate,
}: {
  total: number; mastered: number; unknown: number; unreviewed: number; rate: number;
}) {
  const tested = mastered + unknown;

  return (
    <View style={statsStyles.card}>
      {/* 3 stat columns */}
      <View style={statsStyles.columns}>
        <StatItem value={mastered} label="Mastered" color="#2E7D32" />
        <View style={statsStyles.divider} />
        <StatItem value={unknown} label="Learning" color="#E65100" />
        <View style={statsStyles.divider} />
        <StatItem value={unreviewed} label="Untested" color="#9E9E9E" />
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
      </Text>
    </View>
  );
}

function StatItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={statsStyles.item}>
      <Text style={[statsStyles.itemValue, { color }]}>{value}</Text>
      <Text style={statsStyles.itemLabel}>{label}</Text>
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
});

// ═══════════════════════════════════════════════════════
//  WORD SHEET  — 底部弹窗（两阶段）
// ═══════════════════════════════════════════════════════
function WordSheet({
  visible, word, status, onClose, onMark, onToggle,
}: {
  visible: boolean; word: WordEntry | null; status: WordStatus;
  onClose: () => void; onMark: (s: WordStatus) => void; onToggle: (s: WordStatus) => void;
}) {
  const [phase, setPhase] = useState<'ask' | 'reveal'>('ask');
  const meta = STATUS_META[status];

  // Reset phase on word change, auto-speak
  useEffect(() => {
    if (!visible || !word) return;
    setPhase('ask');
    const t = setTimeout(() => {
      Speech.speak(word.word, { language: 'en-US', rate: 0.85 });
    }, 350);
    return () => { clearTimeout(t); Speech.stop(); };
  }, [visible, word?.id]);

  const etymology = useMemo(
    () => (word ? analyzeEtymology(word.word) : null),
    [word?.id],
  );

  const handleKnow = () => { onMark('mastered'); };
  const handleDunno = () => { onMark('unknown'); };
  const handleSpeak = () => {
    if (word) Speech.speak(word.word, { language: 'en-US', rate: 0.85 });
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
          {word.phonetic !== `/${word.word.toLowerCase()}/` && (
            <Text style={sheet.phonetic}>{word.phonetic}</Text>
          )}
          <TouchableOpacity style={sheet.speakPill} onPress={handleSpeak}>
            <Text style={sheet.speakIcon}>🔊</Text>
            <Text style={sheet.speakLabel}>Listen</Text>
          </TouchableOpacity>

          {/* ══ Phase 1: Ask ══ */}
          {phase === 'ask' && (
            <View style={sheet.askSection}>
              <TouchableOpacity
                style={sheet.btnKnow}
                onPress={handleKnow}
                activeOpacity={0.7}
              >
                <Text style={sheet.btnKnowText}>✅  Know It</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={sheet.btnDunno}
                onPress={handleDunno}
                activeOpacity={0.7}
              >
                <Text style={sheet.btnDunnoText}>❌  Not Sure</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ Phase 2: Reveal ══ */}
          {phase === 'reveal' && (
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
                <View style={[sheet.statusChip, { backgroundColor: meta.bg }]}>
                  <Text style={[sheet.statusChipText, { color: meta.fg }]}>{meta.label}</Text>
                </View>
              </View>

              {/* Meanings */}
              <View style={sheet.meaningBlock}>
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

              {/* Toggle status */}
              <View style={sheet.toggleRow}>
                <TouchableOpacity
                  style={[sheet.toggleBtn, status === 'mastered' && sheet.toggleBtnActive]}
                  onPress={() => onToggle('mastered')}
                  activeOpacity={0.7}
                >
                  <Text style={[sheet.toggleText, status === 'mastered' && sheet.toggleTextActive]}>
                    ✅ Mastered
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[sheet.toggleBtn, status === 'unknown' && sheet.toggleBtnActiveDunno]}
                  onPress={() => onToggle('unknown')}
                  activeOpacity={0.7}
                >
                  <Text style={[sheet.toggleText, status === 'unknown' && sheet.toggleTextActiveDunno]}>
                    ❌ Learning
                  </Text>
                </TouchableOpacity>
              </View>
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
      setState(await loadVocabState(sceneId));
      setLoading(false);
    })();
  }, [sceneId]);

  // Words in this scene
  const words = useMemo(() => {
    if (!scene) return [];
    return scene.wordIds.map((id) => wordMap[id]).filter(Boolean) as WordEntry[];
  }, [scene, wordMap]);

  // Stats
  const stats = useMemo(() => {
    let mastered = 0, unknown = 0, unreviewed = 0;
    words.forEach((w) => {
      const s = state[w.id] ?? 'unreviewed';
      if (s === 'mastered') mastered++;
      else if (s === 'unknown') unknown++;
      else unreviewed++;
    });
    const total = words.length;
    const tested = mastered + unknown;
    return {
      total, mastered, unknown, unreviewed, tested,
      rate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }, [words, state]);

  // Mark word status (Phase 1 → auto-advance)
  const handleMarkPhase1 = useCallback((status: WordStatus) => {
    if (!sheetWord) return;
    const wordId = sheetWord.id;
    const next = { ...state, [wordId]: status };
    setState(next);
    saveVocabState(sceneId, next);
    // Auto-advance to next word
    const idx = words.findIndex(w => w.id === wordId);
    if (idx >= 0 && idx < words.length - 1) {
      setSheetWord(words[idx + 1]);
    } else {
      setSheetOpen(false);
    }
  }, [sheetWord, state, sceneId, words]);

  // Phase 2 toggle — just mark, no auto-advance
  const handleToggle = useCallback((status: WordStatus) => {
    if (!sheetWord) return;
    const wordId = sheetWord.id;
    const next = { ...state, [wordId]: status };
    setState(next);
    saveVocabState(sceneId, next);
  }, [sheetWord, state, sceneId]);

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
      <StatsBanner {...stats} />

      {/* ── Word Grid ── */}
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
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
        onMark={handleMarkPhase1}
        onToggle={handleToggle}
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

  // ── Phase 1: Ask ──
  askSection: {
    alignItems: 'center',
    marginTop: 26,
    paddingHorizontal: 4,
  },

  btnKnow: {
    backgroundColor: '#1565C0',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnKnowText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDunno: {
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  btnDunnoText: {
    fontSize: 15,
    color: '#9E9E9E',
    fontWeight: '600',
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
