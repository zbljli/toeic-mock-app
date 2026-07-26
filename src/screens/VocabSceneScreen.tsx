import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, Dimensions, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SceneEntry, WordEntry, WordStatus } from '../types/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import { loadVocabState, saveVocabState, migrateMasteryIfNeeded } from '../utils/storage';
import { fetchWordAudioUrl, playAudioUrl, stopAll, preloadWord, unlockAudio } from '../utils/audio';

// ─── Debug toggle ───────────────────────────────────────
const DEBUG_MODE = false;
import scenesData from '../data/scenes.json';
import { loadWords } from '../utils/loadData';

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
  new:      { bg: '#F5F5F5', fg: '#9E9E9E', label: '未检测', dot: '#BDBDBD' },
  known:    { bg: '#E8F5E9', fg: '#2E7D32', label: '已认识', dot: '#4CAF50' },
  learning: { bg: '#FFF3E0', fg: '#E65100', label: '待学习', dot: '#FF9800' },
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
          onPress={() => onFilterChange(activeFilter === 'known' ? null : 'known')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#2E7D32' }, activeFilter === 'known' && statsStyles.itemActive]}>{mastered}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'known' && { color: '#2E7D32', fontWeight: '700' }]}>已认识</Text>
        </TouchableOpacity>
        <View style={statsStyles.divider} />
        <TouchableOpacity
          style={statsStyles.item}
          onPress={() => onFilterChange(activeFilter === 'learning' ? null : 'learning')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#E65100' }, activeFilter === 'learning' && statsStyles.itemActive]}>{unknown}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'learning' && { color: '#E65100', fontWeight: '700' }]}>待学习</Text>
        </TouchableOpacity>
        <View style={statsStyles.divider} />
        <TouchableOpacity
          style={statsStyles.item}
          onPress={() => onFilterChange(activeFilter === 'new' ? null : 'new')}
          activeOpacity={0.6}
        >
          <Text style={[statsStyles.itemValue, { color: '#9E9E9E' }, activeFilter === 'new' && statsStyles.itemActive]}>{unreviewed}</Text>
          <Text style={[statsStyles.itemLabel, activeFilter === 'new' && { color: '#757575', fontWeight: '700' }]}>未检测</Text>
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
        已检测 <Text style={statsStyles.summaryBold}>{tested}</Text>/{total}
        {'  '}·{'  '}
        掌握率 <Text style={[statsStyles.summaryBold, { color: rate >= 60 ? '#2E7D32' : '#E65100' }]}>{rate}%</Text>
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
//  WORD SHEET  — 3-phase state machine
// ═══════════════════════════════════════════════════════
type SheetPhase = 'assessment' | 'reveal';

function WordSheet({
  visible, word, status, onClose, onSaveStatus, onAdvance,
}: {
  visible: boolean; word: WordEntry | null; status: WordStatus;
  onClose: () => void;
  onSaveStatus: (s: WordStatus) => void;
  onAdvance: () => void;
}) {
  const [phase, setPhase] = useState<SheetPhase>('assessment');
  const [taggedStatus, setTaggedStatus] = useState<WordStatus | null>(null);
  const meta = STATUS_META[status];

  // ── Real human audio state ──
  const [audioUrl, setAudioUrl] = useState<string | null | undefined>(undefined); // undefined=loading, null=unavailable
  const [audioLoading, setAudioLoading] = useState(false);
  const lastAutoPlayedId = useRef<string | null>(null);

  // ── Debug state ──
  const [audioLoadStatus, setAudioLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [playStatus, setPlayStatus] = useState<'idle' | 'playing' | 'error' | 'ended'>('idle');

  // Reset phase + fetch audio URL on word change
  useEffect(() => {
    if (!visible || !word) return;
    setPhase('assessment');
    setTaggedStatus(null);
    setAudioUrl(undefined);
    setAudioLoading(true);
    setAudioLoadStatus('loading');
    setPlayStatus('idle');

    let cancelled = false;
    fetchWordAudioUrl(word.word).then((url) => {
      if (cancelled) return;
      setAudioUrl(url);
      setAudioLoading(false);
      setAudioLoadStatus(url ? 'success' : 'error');
    });

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [visible, word?.id]);

  // Auto-play when audio URL is ready AND this word hasn't been auto-played yet
  useEffect(() => {
    if (!visible || !word || audioUrl === undefined) return;
    if (lastAutoPlayedId.current === word.id) return;

    if (audioUrl) {
      lastAutoPlayedId.current = word.id;
      // Small delay for the sheet animation to finish
      const t = setTimeout(() => {
        playAudioUrl(audioUrl, {
          onPlay: () => setPlayStatus('playing'),
          onEnded: () => setPlayStatus('ended'),
          onError: () => setPlayStatus('error'),
        });
      }, 350);
      return () => clearTimeout(t);
    }
  }, [visible, word?.id, audioUrl]);

  // Reset auto-play tracker when sheet closes
  useEffect(() => {
    if (!visible) {
      lastAutoPlayedId.current = null;
      stopAll();
    }
  }, [visible]);

  /** 我认识 → save as known, auto-advance to next word */
  const handleKnow = () => {
    onSaveStatus('known');
    // Auto-advance after a brief moment (no confirm popup)
    setTimeout(() => onAdvance(), 150);
  };

  /** 我不认识 → save as learning, flip to reveal */
  const handleDontKnow = () => {
    onSaveStatus('learning');
    setTaggedStatus('learning');
    setPhase('reveal');
  };

  /** Manual replay — play the real audio again */
  const handleSpeak = () => {
    if (word && audioUrl) {
      playAudioUrl(audioUrl, {
        onPlay: () => setPlayStatus('playing'),
        onEnded: () => setPlayStatus('ended'),
        onError: () => setPlayStatus('error'),
      });
    }
  };

  if (!word) return null;

  const showAudioButton = audioUrl !== null; // show button if audio is loading or ready
  const showNoAudioText = audioUrl === null && !audioLoading; // confirmed no audio

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

          {/* ── Word hero (all phases) ── */}
          <Text style={sheet.wordHero}>{word.word}</Text>
          {word.phonetic && word.phonetic !== `/${word.word.toLowerCase()}/` && (
            <Text style={sheet.phonetic}>{word.phonetic}</Text>
          )}

          {/* 🔊 Audio button — real human pronunciation only */}
          {showAudioButton && (
            <TouchableOpacity
              style={[sheet.speakPill, audioLoading && { opacity: 0.5 }]}
              onPress={handleSpeak}
              disabled={audioLoading || !audioUrl}
            >
              <Text style={sheet.speakIcon}>{audioLoading ? '⏳' : '🔊'}</Text>
              <Text style={sheet.speakLabel}>
                {audioLoading ? 'Loading audio...' : 'Listen'}
              </Text>
            </TouchableOpacity>
          )}

          {/* No audio fallback */}
          {showNoAudioText && (
            <View style={sheet.noAudioPill}>
              <Text style={sheet.noAudioText}>暂无真人发音</Text>
            </View>
          )}

          {/* ── Debug Panel ── */}
          {DEBUG_MODE && (
            <View style={sheet.debugPanel}>
              <Text style={sheet.debugTitle}>🐛 Debug</Text>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>当前单词：</Text>
                <Text style={sheet.debugValue}>{word.word}</Text>
              </View>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>当前阶段：</Text>
                <Text style={[sheet.debugValue, {
                  color: phase === 'assessment' ? '#1565C0' : '#F57F17',
                }]}>
                  {phase === 'assessment' ? '🔵 ASSESSMENT' : '🟡 REVEAL'}
                </Text>
              </View>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>标签状态：</Text>
                <Text style={sheet.debugValue}>{taggedStatus ?? status}</Text>
              </View>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>音频地址：</Text>
                <Text style={sheet.debugValueMono} numberOfLines={2}>
                  {audioUrl ?? '(none)'}
                </Text>
              </View>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>音频加载状态：</Text>
                <Text style={[sheet.debugValue, {
                  color: audioLoadStatus === 'success' ? '#2E7D32' : audioLoadStatus === 'error' ? '#C62828' : '#F57F17',
                }]}>
                  {audioLoadStatus === 'loading' ? '⏳ loading...' : audioLoadStatus === 'success' ? '✅ success' : '❌ error'}
                </Text>
              </View>
              <View style={sheet.debugRow}>
                <Text style={sheet.debugLabel}>播放状态：</Text>
                <Text style={[sheet.debugValue, {
                  color: playStatus === 'playing' ? '#1565C0' : playStatus === 'ended' ? '#2E7D32' : playStatus === 'error' ? '#C62828' : '#9E9E9E',
                }]}>
                  {playStatus === 'idle' ? '⏸ idle' : playStatus === 'playing' ? '▶ playing' : playStatus === 'ended' ? '✅ ended' : '❌ error'}
                </Text>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/*  PHASE: ASSESSMENT — 3 buttons                    */}
          {/* ═══════════════════════════════════════════════ */}
          {phase === 'assessment' && (
            <View style={sheet.actions}>
              <TouchableOpacity
                style={[sheet.actionBtn, sheet.btnKnow]}
                onPress={handleKnow}
                activeOpacity={0.7}
              >
                <Text style={sheet.btnKnowText}>我认识</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[sheet.actionBtn, sheet.btnDunno]}
                onPress={handleDontKnow}
                activeOpacity={0.7}
              >
                <Text style={sheet.btnDunnoText}>我不认识</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/*  PHASE: REVEAL — minimal explanation              */}
          {/* ═══════════════════════════════════════════════ */}
          {phase === 'reveal' && (
            <>
              <View style={sheet.revealPad}>
                {/* POS chip */}
                <View style={sheet.chipRow}>
                  <View style={sheet.posChip}>
                    <Text style={sheet.posChipText}>{word.partOfSpeech}</Text>
                  </View>
                </View>

                {/* Chinese meanings */}
                <View style={sheet.meaningBlock}>
                  <Text style={sheet.meaningTitle}>中文释义</Text>
                  {word.meanings.map((m, i) => (
                    <Text key={i} style={sheet.meaningText}>
                      {m.zh}{m.context ? `（${m.context}）` : ''}
                    </Text>
                  ))}
                </View>

                {/* Scene category */}
                {word.sceneIds.length > 0 && (() => {
                  const sl: SceneEntry[] = scenesData as SceneEntry[];
                  const scene = sl.find((s) => s.id === word.sceneIds[0]);
                  return scene ? (
                    <View style={sheet.sceneTag}>
                      <Text style={sheet.sceneTagLabel}>所属场景</Text>
                      <Text style={sheet.sceneTagText}>{scene.icon} {scene.nameZh}</Text>
                    </View>
                  ) : null;
                })()}
              </View>

              {/* Single "下一个单词" button */}
              <View style={[sheet.actions, { marginTop: 16 }]}>
                <TouchableOpacity
                  style={[sheet.actionBtn, sheet.btnNext]}
                  onPress={onAdvance}
                  activeOpacity={0.7}
                >
                  <Text style={sheet.btnNextText}>下一个单词 →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
      const wl = await loadWords();
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

  // Preload audio URLs in the background (non-blocking, cached)
  useEffect(() => {
    if (allWords.length === 0) return;
    // Stagger preloading to avoid flooding the network
    const wordsToPreload = allWords.slice(0, 30);
    wordsToPreload.forEach((w, i) => {
      setTimeout(() => preloadWord(w.word), i * 200);
    });
  }, [allWords]);

  // Filtered words
  const words = useMemo(() => {
    if (!activeFilter) return allWords;
    return allWords.filter((w) => (state[w.id] ?? 'new') === activeFilter);
  }, [allWords, state, activeFilter]);

  // Stats (always based on ALL words)
  const stats = useMemo(() => {
    let mastered = 0, unknown = 0, unreviewed = 0;
    allWords.forEach((w) => {
      const s = state[w.id] ?? 'new';
      if (s === 'known') mastered++;
      else if (s === 'learning') unknown++;
      else unreviewed++;
    });
    const total = allWords.length;
    const tested = mastered + unknown;
    return {
      total, mastered, unknown, unreviewed, tested,
      rate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }, [allWords, state]);

  // Save word status — persist immediately, NO auto-advance
  const handleSaveStatus = useCallback(async (status: WordStatus) => {
    if (!sheetWord) return;
    const wordId = sheetWord.id;
    const next = { ...state, [wordId]: status };
    setState(next);
    await saveVocabState(sceneId, next);
  }, [sheetWord, state, sceneId]);

  // Advance to next word (called by WordSheet CONFIRM phase)
  const handleAdvanceWord = useCallback(() => {
    if (!sheetWord) return;
    const currentList = activeFilter
      ? allWords.filter((w) => (state[w.id] ?? 'new') === activeFilter)
      : allWords;
    const idx = currentList.findIndex(w => w.id === sheetWord.id);
    if (idx >= 0 && idx < currentList.length - 1) {
      setSheetWord(currentList[idx + 1]);
    } else {
      setSheetOpen(false);
    }
  }, [sheetWord, state, allWords, activeFilter]);

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
            status={state[w.id] ?? 'new'}
            onPress={() => { unlockAudio(); setSheetWord(w); setSheetOpen(true); }}
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
        status={sheetWord ? (state[sheetWord.id] ?? 'new') : 'new'}
        onClose={() => setSheetOpen(false)}
        onSaveStatus={handleSaveStatus}
        onAdvance={handleAdvanceWord}
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
  noAudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  noAudioText: {
    fontSize: 13,
    color: '#BDBDBD',
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Debug panel
  debugPanel: {
    marginTop: 14,
    marginHorizontal: 4,
    backgroundColor: '#263238',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#455A64',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD54F',
    marginBottom: 10,
  },
  debugRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  debugLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#90A4AE',
    minWidth: 95,
  },
  debugValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ECEFF1',
    flexShrink: 1,
  },
  debugValueMono: {
    fontSize: 10,
    fontWeight: '500',
    color: '#80CBC4',
    flexShrink: 1,
    fontFamily: 'monospace',
  },

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

  // Reveal-phase "Back" button
  btnBack: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
  },
  btnBackText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '700',
  },

  // Confirm-phase "Next Word" button
  btnNext: {
    backgroundColor: '#1976D2',
    borderWidth: 1.5,
    borderColor: '#1976D2',
  },
  btnNextText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Confirm-phase "Close" button
  btnClose: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  btnCloseText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '600',
  },

  // Confirm-phase card
  confirmCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  confirmIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#424242',
    textAlign: 'center',
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

  // Scene tag
  sceneTag: {
    backgroundColor: '#E8EAF6',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1A237E',
    marginBottom: 12,
  },
  sceneTagLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 4,
  },
  sceneTagText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
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
