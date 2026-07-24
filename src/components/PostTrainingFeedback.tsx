import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FeedbackProps {
  listeningScore: number;
  totalQuestions: number;
  correctCount: number;
  goalScore: number;
  previousScore?: number;
  completedTasks?: string[];
}

/**
 * Post-training feedback section — displayed inline on ResultScreen.
 * Shows what was completed, score comparison, distance to goal,
 * and an encouraging message.
 */
export default function PostTrainingFeedback({
  listeningScore,
  totalQuestions,
  correctCount,
  goalScore,
  previousScore,
  completedTasks = [],
}: FeedbackProps) {
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const gapToGoal = Math.max(0, goalScore - listeningScore);
  const improved = previousScore != null ? listeningScore - previousScore : null;

  const encouragement = (() => {
    if (improved != null && improved > 0) return `You improved by +${improved} points! Keep this momentum going.`;
    if (improved != null && improved === 0) return 'Steady progress. Consistency is the key to breakthroughs.';
    if (accuracy >= 80) return 'Excellent work! Your listening skills are sharp.';
    if (accuracy >= 60) return 'Good effort! Each session builds your listening foundation.';
    return 'Every question you answer brings you closer to your goal. Keep going!';
  })();

  return (
    <View style={s.wrap}>
      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Today's Completed Tasks</Text>
          {completedTasks.map((task, i) => (
            <View key={i} style={s.taskRow}>
              <Text style={s.check}>✅</Text>
              <Text style={s.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Score summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Your Results</Text>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{listeningScore}</Text>
            <Text style={s.statLabel}>Listening{'\n'}Score</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{accuracy}%</Text>
            <Text style={s.statLabel}>Accuracy{'\n'}Rate</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{correctCount}/{totalQuestions}</Text>
            <Text style={s.statLabel}>Correct{'\n'}Answers</Text>
          </View>
        </View>
      </View>

      {/* Goal progress */}
      {goalScore > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Progress Towards Goal</Text>
          <View style={s.goalRow}>
            <View style={s.goalItem}>
              <Text style={s.goalLabel}>Current</Text>
              <Text style={s.goalNum}>{listeningScore}</Text>
            </View>
            <Text style={s.goalArrow}>→</Text>
            <View style={s.goalItem}>
              <Text style={s.goalLabel}>Target</Text>
              <Text style={[s.goalNum, { color: '#1A237E' }]}>{goalScore}</Text>
            </View>
          </View>
          {gapToGoal > 0 ? (
            <View style={s.gapBadge}>
              <Text style={s.gapText}>{gapToGoal} points to goal — keep going!</Text>
            </View>
          ) : (
            <View style={[s.gapBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[s.gapText, { color: '#2E7D32' }]}>Goal achieved! 🎉 Set a new goal to keep growing.</Text>
            </View>
          )}
        </View>
      )}

      {/* Improvement vs previous */}
      {improved != null && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Score Change</Text>
          <View style={s.changeRow}>
            <Text style={s.changePrev}>{previousScore}</Text>
            <Text style={s.changeArrow}>→</Text>
            <Text style={[s.changeCurr, { color: improved >= 0 ? '#4CAF50' : '#F44336' }]}>
              {listeningScore} ({improved >= 0 ? '+' : ''}{improved})
            </Text>
          </View>
        </View>
      )}

      {/* Encouragement */}
      <View style={s.encourageBox}>
        <Text style={s.encourageEmoji}>
          {accuracy >= 80 ? '🌟' : accuracy >= 60 ? '💪' : '🔥'}
        </Text>
        <Text style={s.encourageText}>{encouragement}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 4 },

  section: {
    backgroundColor: '#FFFFFF', marginBottom: 10, padding: 18,
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#616161', marginBottom: 12 },

  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  check: { fontSize: 14, marginRight: 8 },
  taskText: { fontSize: 14, color: '#424242' },

  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#212121' },
  statLabel: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', marginTop: 2, lineHeight: 15 },

  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 12 },
  goalItem: { alignItems: 'center' },
  goalLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  goalNum: { fontSize: 28, fontWeight: '800', color: '#212121', marginTop: 2 },
  goalArrow: { fontSize: 22, color: '#BDBDBD', paddingBottom: 4 },
  gapBadge: {
    backgroundColor: '#E3F2FD', paddingVertical: 10, borderRadius: 12, alignItems: 'center',
  },
  gapText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },

  changeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingVertical: 8,
  },
  changePrev: { fontSize: 24, fontWeight: '700', color: '#9E9E9E' },
  changeArrow: { fontSize: 20, color: '#BDBDBD' },
  changeCurr: { fontSize: 24, fontWeight: '800' },

  encourageBox: {
    backgroundColor: '#E8EAF6', padding: 18, borderRadius: 16,
    alignItems: 'center', marginTop: 4,
    borderLeftWidth: 3, borderLeftColor: '#1A237E',
  },
  encourageEmoji: { fontSize: 28, marginBottom: 6 },
  encourageText: { fontSize: 14, color: '#424242', textAlign: 'center', lineHeight: 21 },
});
