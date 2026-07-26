import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SceneEntry, VocabState } from '../../types/vocabulary';
import type { ScenariosTabParamList } from '../../navigation/AppNavigator';
import { loadVocabState, migrateMasteryIfNeeded } from '../../utils/storage';
import scenesData from '../../data/scenes.json';
import { loadArticles } from '../../utils/loadData';

type Nav = StackNavigationProp<ScenariosTabParamList>;

interface ArticleMeta {
  id: string;
  sceneId: string;
  title: string;
  type: 'article' | 'dialogue';
  estimatedTime: number;
  vocabWordIds: string[];
}

export default function ScenarioLearningScreen() {
  const navigation = useNavigation<Nav>();
  const [scenes, setScenes] = useState<SceneEntry[]>([]);
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [allStates, setAllStates] = useState<Record<string, VocabState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sList: SceneEntry[] = scenesData as SceneEntry[];
      const aList: ArticleMeta[] = await loadArticles() as ArticleMeta[];
      setScenes(sList);
      setArticles(aList);

      const states: Record<string, VocabState> = {};
      for (const s of sList) {
        await migrateMasteryIfNeeded(s.id);
        states[s.id] = await loadVocabState(s.id);
      }
      setAllStates(states);
      setLoading(false);
    })();
  }, []);

  // Build scene + article progress
  const sceneData = useMemo(() => {
    return scenes.map((scene) => {
      const sceneArticles = articles.filter((a) => a.sceneId === scene.id);
      const state = allStates[scene.id] ?? {};

      let mastered = 0;
      let totalVocab = 0;
      for (const a of sceneArticles) {
        for (const wid of a.vocabWordIds) {
          totalVocab++;
          if ((state[wid] ?? 'new') === 'known') mastered++;
        }
      }

      return {
        scene,
        articleCount: sceneArticles.length,
        totalVocab,
        mastered,
        rate: totalVocab > 0 ? Math.round((mastered / totalVocab) * 100) : 0,
      };
    });
  }, [scenes, articles, allStates]);

  // Sort by completion rate (lowest first)
  const sortedScenes = useMemo(() => {
    return [...sceneData].sort((a, b) => a.rate - b.rate);
  }, [sceneData]);

  const overall = useMemo(() => {
    let total = 0, mastered = 0;
    for (const sd of sceneData) {
      total += sd.totalVocab;
      mastered += sd.mastered;
    }
    return { total, mastered, rate: total > 0 ? Math.round((mastered / total) * 100) : 0 };
  }, [sceneData]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#1A237E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <Text style={s.title}>Scenario Learning</Text>
        <Text style={s.subtitle}>Read AI articles and build vocabulary in context</Text>

        {/* Overall Banner */}
        <View style={s.banner}>
          <Text style={s.bannerLabel}>Overall Progress</Text>
          <View style={s.bannerRow}>
            <View style={s.bannerStat}>
              <Text style={s.bannerNum}>{overall.total}</Text>
              <Text style={s.bannerUnit}>Total Words</Text>
            </View>
            <View style={s.bannerStat}>
              <Text style={[s.bannerNum, { color: '#4CAF50' }]}>{overall.mastered}</Text>
              <Text style={s.bannerUnit}>Mastered</Text>
            </View>
            <View style={s.bannerStat}>
              <Text style={[s.bannerNum, { color: '#1A237E' }]}>{overall.rate}%</Text>
              <Text style={s.bannerUnit}>Complete</Text>
            </View>
          </View>
          <View style={s.bannerBar}>
            <View style={[s.bannerFill, { width: `${Math.max(overall.rate, 2)}%` }]} />
          </View>
        </View>

        {/* Scene List */}
        <Text style={s.sectionTitle}>Choose a Scenario</Text>

        {sortedScenes.map(({ scene, articleCount, totalVocab, mastered, rate }) => (
          <TouchableOpacity
            key={scene.id}
            style={s.card}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('ScenarioArticle', {
                sceneId: scene.id,
                sceneTitle: scene.name,
                sceneIcon: scene.icon,
              })
            }
          >
            {/* Card Header */}
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>{scene.icon}</Text>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{scene.name}</Text>
                <Text style={s.cardDesc}>{scene.description}</Text>
                <View style={s.cardMeta}>
                  <Text style={s.metaTag}>{articleCount} article{articleCount !== 1 ? 's' : ''}</Text>
                  <Text style={s.metaTag}>{totalVocab} words</Text>
                </View>
              </View>
              <Text style={s.cardArrow}>→</Text>
            </View>

            {/* Progress Bar */}
            <View style={s.progressRow}>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${Math.max(rate, 2)}%` }]} />
              </View>
              <Text style={s.progressText}>
                {mastered}/{totalVocab} · {rate}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },

  title: { fontSize: 24, fontWeight: '800', color: '#1A237E', paddingTop: 20, paddingHorizontal: 20 },
  subtitle: { fontSize: 13, color: '#9E9E9E', paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },

  // Banner
  banner: { backgroundColor: '#1A237E', marginHorizontal: 16, padding: 20, borderRadius: 16, marginBottom: 20 },
  bannerLabel: { fontSize: 12, color: '#9FA8DA', fontWeight: '600', marginBottom: 14 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  bannerStat: { alignItems: 'center', flex: 1 },
  bannerNum: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  bannerUnit: { fontSize: 10, color: '#9FA8DA', marginTop: 2 },
  bannerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  bannerFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },

  // Section
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginHorizontal: 20, marginBottom: 10 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 10,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { fontSize: 28, marginRight: 14, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#9E9E9E', lineHeight: 17, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaTag: { fontSize: 11, color: '#757575', fontWeight: '600' },
  cardArrow: { fontSize: 20, color: '#BDBDBD', marginTop: 4 },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  progressBar: { flex: 1, height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#757575', fontWeight: '600' },
});
