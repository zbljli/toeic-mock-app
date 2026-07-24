import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTestContext } from '../context/TestContext';
import { useCoach } from '../context/CoachContext';
import { getScoreLevel } from '../utils/scoring';
import { TOEIC_PARTS } from '../data/toeicStructure';
import PostTrainingFeedback from '../components/PostTrainingFeedback';
import type { HomeTabParamList } from '../navigation/AppNavigator';
import type { ScoreRecord, TrainingRecord } from '../types/coach';

type Nav = StackNavigationProp<HomeTabParamList>;

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const { state, dispatch } = useTestContext();
  const { result } = state;
  const {
    userGoal, addScoreRecord, addTrainingRecord,
    scoreHistory, completeDailyTasks,
    isOnboarded, setOnboardingStage,
  } = useCoach();

  // Auto-save score record on mount
  useEffect(() => {
    if (!result) return;

    const scoreRecord: ScoreRecord = {
      date: new Date().toISOString().split('T')[0],
      type: 'mock_test',
      listeningScore: result.listeningScore,
      partScores: {},
    };

    const trainingRecord: TrainingRecord = {
      id: `train_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'mock_test',
      questionCount: totalQuestions,
      correctCount: totalCorrect,
      accuracy,
      durationMinutes: 30,
    };

    addScoreRecord(scoreRecord);
    addTrainingRecord(trainingRecord);
    completeDailyTasks();
  }, []); // Only run once on mount

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No result data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const level = getScoreLevel(result.totalScore);
  const goalScore = userGoal?.targetListeningScore ?? 0;
  const previousScore = scoreHistory.length > 1
    ? scoreHistory[scoreHistory.length - 2]?.listeningScore
    : userGoal?.currentListeningScore;

  // Compute derived stats
  const totalQuestions = Object.values(result.totalByPart).reduce((a, b) => a + b, 0);
  const totalCorrect = Object.values(result.correctByPart).reduce((a, b) => a + b, 0);
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Score Hero */}
        <View style={styles.scoreHero}>
          <Text style={styles.scoreLabel}>Listening Score</Text>
          <Text style={styles.totalScore}>{result.listeningScore}</Text>
          <Text style={styles.scoreRange}>/ 495</Text>
          <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
            <Text style={styles.levelText}>{level.level}</Text>
          </View>
          <Text style={styles.levelDesc}>{level.description}</Text>
        </View>

        {/* Part breakdown */}
        <Text style={styles.detailTitle}>Part Performance</Text>
        {TOEIC_PARTS.map((part) => {
          const correct = result.correctByPart[part.part] ?? 0;
          const total = result.totalByPart[part.part] ?? 0;
          const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
          if (total === 0) return null;

          return (
            <View key={part.part} style={styles.partRow}>
              <View style={styles.partLeft}>
                <Text style={styles.partLabel}>Part {part.part} — {part.title}</Text>
                <View style={styles.partBarBg}>
                  <View
                    style={[
                      styles.partBarFill,
                      { width: `${rate}%` },
                      rate >= 80 ? styles.barGood : rate >= 60 ? styles.barMid : styles.barLow,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.partRight}>
                <Text style={styles.partCorrect}>{correct}/{total}</Text>
                <Text style={styles.partRate}>{rate}%</Text>
              </View>
            </View>
          );
        })}

        {/* Post-Training Feedback */}
        <View style={styles.feedbackSection}>
          <PostTrainingFeedback
            listeningScore={result.listeningScore}
            totalQuestions={totalQuestions}
            correctCount={totalCorrect}
            goalScore={goalScore}
            previousScore={previousScore}
            completedTasks={[`${totalQuestions} questions completed`]}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Review')}
        >
          <Text style={styles.reviewBtnText}>🔍 Review Answers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={async () => {
            dispatch({ type: 'RESET' });
            if (!isOnboarded) {
              await setOnboardingStage('completed');
              // Jump to MainTabs via root navigator
              const parent = navigation.getParent();
              if (parent) {
                parent.reset({ index: 0, routes: [{ name: 'MainTabs' as any }] });
              } else {
                (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs' }] });
              }
            } else {
              navigation.popToTop();
            }
          }}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9E9E9E' },
  content: { paddingBottom: 32 },

  scoreHero: {
    backgroundColor: '#1A237E',
    alignItems: 'center',
    paddingVertical: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scoreLabel: { fontSize: 15, color: '#9FA8DA', fontWeight: '600' },
  totalScore: { fontSize: 64, fontWeight: '800', color: '#FFFFFF', marginTop: 4, lineHeight: 72 },
  scoreRange: { fontSize: 16, color: '#9FA8DA', fontWeight: '600', marginTop: 2 },
  levelBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: 10 },
  levelText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  levelDesc: { fontSize: 13, color: '#9FA8DA', marginTop: 8 },

  detailTitle: {
    fontSize: 17, fontWeight: '700', color: '#212121',
    marginTop: 24, marginBottom: 12, marginHorizontal: 20,
  },
  partRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 6,
    padding: 14, borderRadius: 12,
  },
  partLeft: { flex: 1, marginRight: 12 },
  partLabel: { fontSize: 13, color: '#424242', fontWeight: '600', marginBottom: 6 },
  partBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  partBarFill: { height: '100%', borderRadius: 3 },
  barGood: { backgroundColor: '#4CAF50' },
  barMid: { backgroundColor: '#FF9800' },
  barLow: { backgroundColor: '#F44336' },
  partRight: { alignItems: 'flex-end' },
  partCorrect: { fontSize: 16, fontWeight: '700', color: '#212121' },
  partRate: { fontSize: 13, color: '#757575' },

  feedbackSection: { marginTop: 20 },

  reviewBtn: {
    backgroundColor: '#E3F2FD', marginHorizontal: 16, marginTop: 20,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  reviewBtnText: { fontSize: 16, fontWeight: '600', color: '#1565C0' },

  homeBtn: {
    marginHorizontal: 16, marginTop: 10, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  homeBtnText: { fontSize: 16, color: '#757575', fontWeight: '600' },
  spacer: { height: 40 },
});
