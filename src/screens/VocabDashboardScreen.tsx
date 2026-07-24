import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SceneEntry, VocabState, SceneProgress } from '../types/vocabulary';
import type { VocabTabParamList } from '../navigation/AppNavigator';
import { loadVocabState, migrateMasteryIfNeeded } from '../utils/storage';
import scenesData from '../data/scenes.json';

type Nav = StackNavigationProp<VocabTabParamList>;

function computeSceneProgress(scene: SceneEntry, state: VocabState): SceneProgress {
  let unreviewed = 0, mastered = 0, unknown = 0;
  for (const wid of scene.wordIds) {
    const s = state[wid] ?? 'unreviewed';
    if (s === 'unreviewed') unreviewed++;
    else if (s === 'mastered') mastered++;
    else unknown++;
  }
  const total = scene.wordIds.length;
  return {
    sceneId: scene.id,
    total,
    unreviewed,
    mastered,
    unknown,
    completionRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
  };
}

export default function VocabDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [scenes, setScenes] = useState<SceneEntry[]>([]);
  const [allStates, setAllStates] = useState<Record<string, VocabState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sList: SceneEntry[] = scenesData as SceneEntry[];
      setScenes(sList);

      const states: Record<string, VocabState> = {};
      for (const s of sList) {
        await migrateMasteryIfNeeded(s.id);
        states[s.id] = await loadVocabState(s.id);
      }
      setAllStates(states);
      setLoading(false);
    })();
  }, []);

  const sceneProgressList = useMemo(() => {
    return scenes.map((s) => computeSceneProgress(s, allStates[s.id] ?? {}));
  }, [scenes, allStates]);

  const overall = useMemo(() => {
    let total = 0, mastered = 0, unknown = 0, unreviewed = 0;
    for (const sp of sceneProgressList) {
      total += sp.total;
      mastered += sp.mastered;
      unknown += sp.unknown;
      unreviewed += sp.unreviewed;
    }
    return {
      total, mastered, unknown, unreviewed,
      rate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }, [sceneProgressList]);

  // Sort: unreviewed-heavy scenes first, then by completion rate
  const sortedScenes = useMemo(() => {
    return [...scenes].sort((a, b) => {
      const pa = sceneProgressList.find((p) => p.sceneId === a.id);
      const pb = sceneProgressList.find((p) => p.sceneId === b.id);
      if (!pa || !pb) return 0;
      // Prioritize scenes with unreviewed words
      if (pa.unreviewed > 0 && pb.unreviewed === 0) return -1;
      if (pa.unreviewed === 0 && pb.unreviewed > 0) return 1;
      return pa.completionRate - pb.completionRate;
    });
  }, [scenes, sceneProgressList]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📚 Vocabulary</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Overall Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Dashboard</Text>
          <View style={styles.bannerGrid}>
            <View style={styles.bannerItem}>
              <Text style={styles.bannerNum}>{overall.total}</Text>
              <Text style={styles.bannerLabel}>Total</Text>
            </View>
            <View style={styles.bannerItem}>
              <Text style={[styles.bannerNum, { color: '#4CAF50' }]}>{overall.mastered}</Text>
              <Text style={styles.bannerLabel}>Mastered</Text>
            </View>
            <View style={styles.bannerItem}>
              <Text style={[styles.bannerNum, { color: '#FF9800' }]}>{overall.unknown}</Text>
              <Text style={styles.bannerLabel}>Learning</Text>
            </View>
            <View style={styles.bannerItem}>
              <Text style={[styles.bannerNum, { color: '#9E9E9E' }]}>{overall.unreviewed}</Text>
              <Text style={styles.bannerLabel}>Untested</Text>
            </View>
          </View>
          <View style={styles.bannerBar}>
            <View style={[styles.bannerBarFill, { width: `${overall.rate}%` }]} />
          </View>
          <Text style={styles.bannerPct}>{overall.rate}% Complete</Text>
        </View>

        {/* Scene list */}
        <Text style={styles.sectionTitle}>Choose a Scene</Text>

        {sortedScenes.map((scene) => {
          const sp = sceneProgressList.find((p) => p.sceneId === scene.id);
          if (!sp) return null;
          const hasUnreviewed = sp.unreviewed > 0;

          return (
            <TouchableOpacity
              key={scene.id}
              style={[styles.card, hasUnreviewed && styles.cardActive]}
              onPress={() => navigation.navigate('VocabScene', {
                sceneId: scene.id,
                sceneTitle: scene.name,
                sceneIcon: scene.icon,
              })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{scene.icon}</Text>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{scene.name}</Text>
                    {hasUnreviewed && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{sp.unreviewed} new</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardSub}>{scene.name} · {sp.total} words</Text>
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </View>

              {/* Mini progress bar */}
              <View style={styles.miniBar}>
                <View style={[styles.miniSeg, styles.segMastered, { flex: sp.mastered }]} />
                <View style={[styles.miniSeg, styles.segUnknown, { flex: sp.unknown }]} />
                <View style={[styles.miniSeg, styles.segUnreviewed, { flex: sp.unreviewed }]} />
              </View>

              <View style={styles.cardStats}>
                <Text style={styles.statText}>
                  🟢 <Text style={{ fontWeight: '700' }}>{sp.mastered}</Text> Mastered
                </Text>
                <Text style={styles.statText}>
                  🟠 <Text style={{ fontWeight: '700' }}>{sp.unknown}</Text> Learning
                </Text>
                <Text style={styles.statText}>
                  ⬜ <Text style={{ fontWeight: '700' }}>{sp.unreviewed}</Text> Untested
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },

  content: { paddingBottom: 40 },

  // Banner
  banner: {
    backgroundColor: '#1A237E', margin: 16, padding: 20, borderRadius: 16,
  },
  bannerTitle: { fontSize: 14, color: '#B0BEC5', fontWeight: '600', marginBottom: 14 },
  bannerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  bannerItem: { alignItems: 'center' },
  bannerNum: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  bannerLabel: { fontSize: 11, color: '#B0BEC5', marginTop: 2 },
  bannerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  bannerBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  bannerPct: { fontSize: 12, color: '#B0BEC5', marginTop: 6, textAlign: 'right' },

  // Section
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#212121',
    marginHorizontal: 20, marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 8,
    padding: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    borderLeftWidth: 0,
  },
  cardActive: {
    borderLeftWidth: 4, borderLeftColor: '#FF7043',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212121' },
  badge: {
    backgroundColor: '#FF7043', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardSub: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  cardArrow: { fontSize: 20, color: '#BDBDBD' },

  // Mini bar
  miniBar: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 12, marginBottom: 6 },
  miniSeg: { height: '100%', minWidth: 1 },
  segMastered: { backgroundColor: '#4CAF50' },
  segUnknown: { backgroundColor: '#FF9800' },
  segUnreviewed: { backgroundColor: '#E0E0E0' },

  // Stats row
  cardStats: { flexDirection: 'row' },
  statText: { fontSize: 11, color: '#757575', marginRight: 16 },
});
