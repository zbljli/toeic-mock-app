import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useCoach } from '../../context/CoachContext';
import { useTestContext } from '../../context/TestContext';
import { generateQuestions } from '../../data/questions';
import type { ToeicPart } from '../../types';

const SCENE_LIST = [
  { id: 's_meeting', icon: '💼', name: 'Business Meeting' },
  { id: 's_office', icon: '🏢', name: 'Office' },
  { id: 's_travel', icon: '✈️', name: 'Travel' },
  { id: 's_telephone', icon: '📞', name: 'Phone Calls' },
];

export default function TrainingCenterScreen({ navigation }: any) {
  const { recommendation } = useCoach();
  const { dispatch } = useTestContext();
  const rec = recommendation;

  const startMockTest = () => {
    navigation.navigate('Test', {
      config: {
        mode: 'part-practice',
        label: 'Mock Test',
        description: 'Full Listening Test · Part 1-4 · 45 min',
        totalQuestions: 100,
        totalTimeMinutes: 45,
        parts: [1, 2, 3, 4] as ToeicPart[],
      },
    });
  };

  const startPartTraining = (part: ToeicPart) => {
    const counts: Record<number, { total: number; time: number }> = {
      1: { total: 6, time: 5 }, 2: { total: 10, time: 8 },
      3: { total: 12, time: 12 }, 4: { total: 10, time: 10 },
    };
    const c = counts[part] ?? { total: 10, time: 10 };
    navigation.navigate('Test', {
      config: {
        mode: 'part-practice',
        label: `Part ${part} Training`,
        description: `Part ${part} Focused Practice`,
        totalQuestions: c.total,
        totalTimeMinutes: c.time,
        parts: [part],
      },
    });
  };

  return (
    <SafeAreaView style={ts.safe}>
      <ScrollView contentContainerStyle={ts.scroll}>
        <Text style={ts.title}>Training Center</Text>

        {/* Mock Test */}
        <TouchableOpacity style={ts.mockCard} onPress={startMockTest} activeOpacity={0.8}>
          <Text style={ts.mockIcon}>🎧</Text>
          <Text style={ts.mockTitle}>Full Mock Test</Text>
          <Text style={ts.mockDesc}>Part 1–4 · 100 questions · 45 min</Text>
          <Text style={ts.mockHint}>Simulate real TOEIC exam conditions →</Text>
        </TouchableOpacity>

        {/* Part Training */}
        <Text style={ts.sectionTitle}>Part Training</Text>
        {rec && (
          <View style={ts.recommendBadge}>
            <Text style={ts.recommendText}>🎯 Focus: Part {rec.targetPart}</Text>
          </View>
        )}
        <View style={ts.partGrid}>
          {([1, 2, 3, 4] as ToeicPart[]).map(part => (
            <TouchableOpacity
              key={part}
              style={[ts.partCard, rec?.targetPart === part && ts.partCardRec]}
              onPress={() => startPartTraining(part)}
              activeOpacity={0.7}
            >
              <Text style={ts.partNum}>Part {part}</Text>
              <Text style={ts.partName}>
                {['Photos','Q-Resp','Convers.','Talks'][part - 1]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scene Listening */}
        <Text style={ts.sectionTitle}>Scene Listening</Text>
        <View style={ts.sceneGrid}>
          {SCENE_LIST.map(scene => (
            <TouchableOpacity
              key={scene.id}
              style={ts.sceneCard}
              onPress={() => navigation.navigate('SceneStudy', {
                sceneId: scene.id,
                sceneTitle: scene.name,
                sceneIcon: scene.icon,
              })}
              activeOpacity={0.7}
            >
              <Text style={ts.sceneIcon}>{scene.icon}</Text>
              <Text style={ts.sceneName}>{scene.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grammar */}
        <Text style={ts.sectionTitle}>Grammar</Text>
        <TouchableOpacity
          style={ts.grammarCard}
          onPress={() => navigation.navigate('GrammarWiki')}
          activeOpacity={0.7}
        >
          <Text style={ts.grammarIcon}>📝</Text>
          <View style={ts.grammarInfo}>
            <Text style={ts.grammarTitle}>Grammar Wiki</Text>
            <Text style={ts.grammarDesc}>Key TOEIC grammar points with translation exercises and quizzes.</Text>
          </View>
          <Text style={ts.grammarArrow}>→</Text>
        </TouchableOpacity>

        {/* Mistake Review */}
        <TouchableOpacity style={ts.mistakeCard} activeOpacity={0.7}>
          <Text style={ts.mistakeIcon}>📋</Text>
          <Text style={ts.mistakeTitle}>Mistake Review</Text>
          <Text style={ts.mistakeDesc}>Review your recent mistakes and reinforce weak areas.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ts = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40, paddingHorizontal: 16 },

  title: { fontSize: 22, fontWeight: '800', color: '#1A237E', paddingTop: 16, paddingBottom: 12 },

  mockCard: {
    backgroundColor: '#1A237E', padding: 24, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
    marginBottom: 24,
  },
  mockIcon: { fontSize: 36, marginBottom: 8 },
  mockTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  mockDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  mockHint: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 10, marginTop: 4 },

  recommendBadge: {
    backgroundColor: '#FFF3E0', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  recommendText: { fontSize: 13, fontWeight: '700', color: '#E65100' },

  partGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  partCard: {
    width: '47%', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14,
    borderWidth: 2, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  partCardRec: { borderColor: '#FF9800', backgroundColor: '#FFF8F0' },
  partNum: { fontSize: 18, fontWeight: '800', color: '#1A237E' },
  partName: { fontSize: 13, color: '#757575', marginTop: 4 },

  sceneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  sceneCard: {
    width: '47%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14,
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  sceneIcon: { fontSize: 28, marginBottom: 8 },
  sceneName: { fontSize: 14, fontWeight: '600', color: '#212121' },

  grammarCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  grammarIcon: { fontSize: 28, marginRight: 12 },
  grammarInfo: { flex: 1 },
  grammarTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  grammarDesc: { fontSize: 13, color: '#757575', marginTop: 4, lineHeight: 18 },
  grammarArrow: { fontSize: 20, color: '#BDBDBD' },

  mistakeCard: {
    backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  mistakeIcon: { fontSize: 24, marginBottom: 6 },
  mistakeTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  mistakeDesc: { fontSize: 13, color: '#757575', marginTop: 4 },
});
