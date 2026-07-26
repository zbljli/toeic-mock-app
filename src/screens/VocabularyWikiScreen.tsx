import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { playWord } from '../utils/audio';
import type { SceneEntry, WordEntry } from '../types/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import scenesData from '../data/scenes.json';
import { loadWords } from '../utils/loadData';
import { loadSceneMastery, saveSceneMastery, type SceneMastery } from '../utils/storage';

type Nav = StackNavigationProp<VocabTabParamList>;

// ===== Helpers =====
function getMasteryForScene(
  mastery: Record<string, SceneMastery>,
  sceneId: string,
): SceneMastery {
  return mastery[sceneId] ?? {};
}

function calcProgress(mastery: SceneMastery, wordIds: string[]): { known: number; total: number; rate: number } {
  const total = wordIds.length;
  const known = wordIds.filter((id) => mastery[id] === true).length;
  return { known, total, rate: total > 0 ? Math.round((known / total) * 100) : 0 };
}

// ===== Word Row =====
function WordRow({
  word, meaning, isKnown, onToggle, onSpeak,
}: {
  word: string; meaning: string; isKnown: boolean;
  onToggle: () => void; onSpeak: () => void;
}) {
  return (
    <View style={wrStyles.row}>
      <TouchableOpacity style={wrStyles.speakBtn} onPress={onSpeak}>
        <Text style={wrStyles.speakIcon}>🔊</Text>
      </TouchableOpacity>
      <View style={wrStyles.info}>
        <Text style={wrStyles.word}>{word}</Text>
        <Text style={wrStyles.meaning}>{meaning}</Text>
      </View>
      <TouchableOpacity
        style={[wrStyles.toggle, isKnown ? wrStyles.toggleKnown : wrStyles.toggleUnknown]}
        onPress={onToggle}
      >
        <Text style={wrStyles.toggleText}>{isKnown ? '✓' : '?'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const wrStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEEEEE',
  },
  speakBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  speakIcon: { fontSize: 13 },
  info: { flex: 1 },
  word: { fontSize: 14, fontWeight: '600', color: '#212121' },
  meaning: { fontSize: 12, color: '#757575', marginTop: 2 },
  toggle: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  toggleKnown: { backgroundColor: '#C8E6C9' },
  toggleUnknown: { backgroundColor: '#EEEEEE' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#424242' },
});

// ===== Scene Card (dashboard) =====
function SceneCard({
  scene, progress, onPress,
}: {
  scene: SceneEntry; progress: { known: number; total: number; rate: number };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={scStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={scStyles.header}>
        <Text style={scStyles.icon}>{scene.icon}</Text>
        <View style={scStyles.headerInfo}>
          <Text style={scStyles.name}>{scene.nameZh}</Text>
          <Text style={scStyles.english}>{scene.name}</Text>
        </View>
        <Text style={scStyles.arrow}>→</Text>
      </View>
      <View style={scStyles.progressRow}>
        <View style={scStyles.barBg}>
          <View style={[scStyles.barFill, { width: `${progress.rate}%` }]} />
        </View>
        <Text style={scStyles.progressText}>
          <Text style={{ fontWeight: '800', color: progress.rate >= 80 ? '#2E7D32' : progress.rate >= 50 ? '#E65100' : '#757575' }}>
            {progress.known}
          </Text>
          <Text style={{ color: '#9E9E9E' }}>/{progress.total}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const scStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8,
    padding: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 22, marginRight: 10 },
  headerInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#212121' },
  english: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  arrow: { fontSize: 18, color: '#BDBDBD' },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  barBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  barFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 13, minWidth: 48, textAlign: 'right' },
});

// ===== MAIN SCREEN =====
export default function VocabularyWikiScreen() {
  const navigation = useNavigation<Nav>();

  // Data
  const [scenes, setScenes] = useState<SceneEntry[]>([]);
  const [wordMap, setWordMap] = useState<Record<string, WordEntry>>({});
  const [mastery, setMastery] = useState<Record<string, SceneMastery>>({});
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedScene, setSelectedScene] = useState<SceneEntry | null>(null);
  const [filterKnown, setFilterKnown] = useState<'all' | 'known' | 'unknown'>('unknown');
  const [searchText, setSearchText] = useState('');

  // Load all data
  useEffect(() => {
    (async () => {
      const sList: SceneEntry[] = scenesData as SceneEntry[];
      const wList = await loadWords();

      setScenes(sList);
      const wm: Record<string, WordEntry> = {};
      for (const w of wList) { wm[w.id] = w; }
      setWordMap(wm);

      // Load mastery for all scenes
      const allMastery: Record<string, SceneMastery> = {};
      for (const s of sList) {
        allMastery[s.id] = await loadSceneMastery(s.id);
      }
      setMastery(allMastery);
      setLoading(false);
    })();
  }, []);

  // Toggle word mastery
  const toggleWord = useCallback((sceneId: string, wordId: string) => {
    setMastery((prev) => {
      const sceneMastery = { ...(prev[sceneId] ?? {}) };
      sceneMastery[wordId] = !sceneMastery[wordId];
      const next = { ...prev, [sceneId]: sceneMastery };
      saveSceneMastery(sceneId, sceneMastery);
      return next;
    });
  }, []);

  // Speak word
  const speakWordCB = useCallback((word: string) => {
    playWord(word);
  }, []);

  // Computed: overall stats
  const overallStats = useMemo(() => {
    let totalWords = 0;
    let knownWords = 0;
    for (const s of scenes) {
      const sm = mastery[s.id] ?? {};
      for (const wid of s.wordIds) {
        totalWords++;
        if (sm[wid] === true) knownWords++;
      }
    }
    return { totalWords, knownWords, rate: totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0 };
  }, [scenes, mastery]);

  // Computed: progress per scene
  const sceneProgress = useMemo(() => {
    const result: Record<string, { known: number; total: number; rate: number }> = {};
    for (const s of scenes) {
      result[s.id] = calcProgress(mastery[s.id] ?? {}, s.wordIds);
    }
    return result;
  }, [scenes, mastery]);

  // Computed: words for selected scene
  const sceneWords = useMemo(() => {
    if (!selectedScene) return [];
    const sm = mastery[selectedScene.id] ?? {};
    return selectedScene.wordIds
      .map((wid) => wordMap[wid])
      .filter(Boolean)
      .map((w) => ({
        ...w,
        isKnown: sm[w.id] === true,
      }))
      .filter((w) => {
        if (searchText.trim()) {
          const q = searchText.toLowerCase();
          if (!w.word.toLowerCase().includes(q) && !w.meanings?.[0]?.zh.includes(q)) return false;
        }
        if (filterKnown === 'known') return w.isKnown;
        if (filterKnown === 'unknown') return !w.isKnown;
        return true;
      });
  }, [selectedScene, wordMap, mastery, filterKnown, searchText]);

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>加载场景词汇...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===== SCENE DETAIL VIEW =====
  if (selectedScene) {
    const sm = mastery[selectedScene.id] ?? {};
    const sp = sceneProgress[selectedScene.id];
    const unknownCount = sceneWords.filter((w) => !w.isKnown).length;

    return (
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedScene(null); setSearchText(''); }}>
            <Text style={styles.backText}>← 场景列表</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>{selectedScene.icon}</Text>
            <Text style={styles.headerTitle}>{selectedScene.nameZh}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('VocabularyQuiz')}>
            <Text style={styles.quizLink}>测验 →</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.detailBar}>
          <View style={styles.detailBarRow}>
            <View style={styles.detailBarBg}>
              <View style={[styles.detailBarFill, { width: `${sp.rate}%` }]} />
            </View>
            <Text style={styles.detailBarText}>{sp.known}/{sp.total}</Text>
          </View>
          {unknownCount > 0 && (
            <Text style={styles.detailHint}>
              还有 <Text style={{ fontWeight: '800', color: '#E65100' }}>{unknownCount}</Text> 个词未掌握
            </Text>
          )}
        </View>

        {/* Filter tabs + search */}
        <View style={styles.filterRow}>
          {(['unknown', 'known', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filterKnown === f && styles.filterTabActive]}
              onPress={() => setFilterKnown(f)}
            >
              <Text style={[styles.filterTabText, filterKnown === f && styles.filterTabTextActive]}>
                {f === 'unknown' ? `🟠 未掌握` : f === 'known' ? `🟢 已掌握` : '📋 全部'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词..."
            placeholderTextColor="#9E9E9E"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Word list */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {sceneWords.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>
                {filterKnown === 'unknown' ? '太棒了，本场景词汇已全部掌握！' : '暂无匹配词汇'}
              </Text>
            </View>
          ) : (
            sceneWords.map((w) => (
              <WordRow
                key={w.id}
                word={w.word}
                meaning={w.meanings?.[0]?.zh ?? ''}
                isKnown={w.isKnown}
                onToggle={() => toggleWord(selectedScene.id, w.id)}
                onSpeak={() => speakWordCB(w.word)}
              />
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== DASHBOARD VIEW =====
  const sortedScenes = [...scenes].sort(
    (a, b) => (sceneProgress[a.id]?.rate ?? 0) - (sceneProgress[b.id]?.rate ?? 0),
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 场景词汇</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VocabularyQuiz')}>
          <Text style={styles.quizLink}>随机测验 →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dashContent}>
        {/* Overall stats banner */}
        <View style={styles.overallBanner}>
          <View style={styles.overallLeft}>
            <Text style={styles.overallRate}>{overallStats.rate}%</Text>
            <Text style={styles.overallLabel}>总掌握率</Text>
          </View>
          <View style={styles.overallRight}>
            <View style={styles.overallStat}>
              <Text style={styles.overallStatNum}>{overallStats.knownWords}</Text>
              <Text style={styles.overallStatLabel}>已掌握</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallStatNum, { color: '#E65100' }]}>
                {overallStats.totalWords - overallStats.knownWords}
              </Text>
              <Text style={styles.overallStatLabel}>未掌握</Text>
            </View>
          </View>
        </View>

        {/* Search across scenes */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词（跨场景）..."
            placeholderTextColor="#9E9E9E"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* If searching, show word results across all scenes */}
        {searchText.trim() ? (
          (() => {
            const q = searchText.toLowerCase();
            const results: { word: WordEntry; scene: SceneEntry; isKnown: boolean }[] = [];
            for (const s of scenes) {
              const sm = mastery[s.id] ?? {};
              for (const wid of s.wordIds) {
                const w = wordMap[wid];
                if (!w) continue;
                if (w.word.toLowerCase().includes(q) || w.meanings?.[0]?.zh.includes(q)) {
                  results.push({ word: w, scene: s, isKnown: sm[w.id] === true });
                }
              }
            }
            if (results.length === 0) {
              return (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>未找到匹配词汇</Text>
                </View>
              );
            }
            return results.slice(0, 50).map((r) => (
              <WordRow
                key={`${r.scene.id}-${r.word.id}`}
                word={r.word.word}
                meaning={`${r.word.meanings?.[0]?.zh ?? ''} · ${r.scene.icon} ${r.scene.nameZh}`}
                isKnown={r.isKnown}
                onToggle={() => toggleWord(r.scene.id, r.word.id)}
                onSpeak={() => speakWordCB(r.word.word)}
              />
            ));
          })()
        ) : (
          /* Scene cards — sorted by mastery (weakest first) */
          <>
            <Text style={styles.sectionTitle}>
              🎯 弱项优先 · 共 {scenes.length} 个场景
            </Text>
            {sortedScenes.map((s) => (
              <SceneCard
                key={s.id}
                scene={s}
                progress={sceneProgress[s.id]}
                onPress={() => setSelectedScene(s)}
              />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#757575', marginTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 18, marginRight: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  quizLink: { fontSize: 14, color: '#66BB6A', fontWeight: '700' },

  // Dashboard
  dashContent: { paddingBottom: 40 },
  overallBanner: {
    backgroundColor: '#1976D2', margin: 16, padding: 20, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  overallLeft: { alignItems: 'center', marginRight: 24 },
  overallRate: { fontSize: 42, fontWeight: '800', color: '#FFFFFF' },
  overallLabel: { fontSize: 13, color: '#BBDEFB', marginTop: 2 },
  overallRight: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  overallStat: { flex: 1, alignItems: 'center' },
  overallStatNum: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  overallStatLabel: { fontSize: 12, color: '#BBDEFB', marginTop: 2 },
  overallDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#212121',
    marginHorizontal: 20, marginBottom: 10, marginTop: 4,
  },

  // Detail
  detailBar: { paddingHorizontal: 16, paddingVertical: 10 },
  detailBarRow: { flexDirection: 'row', alignItems: 'center' },
  detailBarBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  detailBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  detailBarText: { fontSize: 14, fontWeight: '700', color: '#424242' },
  detailHint: { fontSize: 12, color: '#757575', marginTop: 4 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 6 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterTabActive: { backgroundColor: '#FFF3E0', borderColor: '#FF9800' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  filterTabTextActive: { color: '#E65100' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 12, marginVertical: 6,
    paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  searchIcon: { fontSize: 13, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', paddingVertical: 8 },
  clearBtn: { fontSize: 14, color: '#9E9E9E', padding: 4 },

  // List
  listContent: { paddingBottom: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
});
