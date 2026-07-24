import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useCoach } from '../../context/CoachContext';

const PART_LABELS: Record<number, string> = {
  1: 'Photographs',
  2: 'Q-Response',
  3: 'Conversations',
  4: 'Talks',
};

function AbilityBar({ part, accuracy }: { part: number; accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const color = pct >= 70 ? '#4CAF50' : pct >= 50 ? '#FF9800' : '#F44336';
  return (
    <View style={ab.row}>
      <Text style={ab.partLabel}>Part {part}</Text>
      <Text style={ab.partName}>{PART_LABELS[part] ?? ''}</Text>
      <View style={ab.barBg}>
        <View style={[ab.barFill, { width: `${Math.max(pct, 4)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[ab.pct, { color }]}>{pct}%</Text>
    </View>
  );
}
const ab = StyleSheet.create({
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 10 },
  partLabel: { fontSize: 13, fontWeight: '700' as const, color: '#616161', width: 44 },
  partName: { fontSize: 13, color: '#9E9E9E', width: 90 },
  barBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' as const, marginRight: 10 },
  barFill: { height: '100%' as const, borderRadius: 4 },
  pct: { fontSize: 14, fontWeight: '800' as const, width: 40, textAlign: 'right' as const },
});

export default function DiagnosisReportScreen() {
  const { userGoal, abilityProfile, recommendation, setOnboardingStage } = useCoach();

  const handleFinish = async () => {
    await setOnboardingStage('completed');
  };

  const profile = abilityProfile;
  const rec = recommendation;

  return (
    <SafeAreaView style={ds.safe}>
      <ScrollView contentContainerStyle={ds.scroll}>
        {/* Header */}
        <View style={ds.header}>
          <Text style={ds.headerIcon}>🔍</Text>
          <Text style={ds.headerTitle}>Your Listening{'\n'}Diagnosis Report</Text>
        </View>

        {/* Score Summary */}
        <View style={ds.card}>
          <Text style={ds.cardTitle}>Score Overview</Text>
          <View style={ds.scoreRow}>
            <View style={ds.scoreItem}>
              <Text style={ds.scoreLabel}>Estimated</Text>
              <Text style={ds.scoreNum}>{userGoal?.currentListeningScore ?? '---'}</Text>
              <Text style={ds.scoreLabel}>Current</Text>
            </View>
            <Text style={ds.scoreArrow}>→</Text>
            <View style={ds.scoreItem}>
              <Text style={ds.scoreLabel}>Target</Text>
              <Text style={[ds.scoreNum, { color: '#1565C0' }]}>{userGoal?.targetListeningScore ?? '---'}</Text>
              <Text style={ds.scoreLabel}>Goal</Text>
            </View>
          </View>
          <View style={ds.gapChip}>
            <Text style={ds.gapText}>Gap: +{userGoal?.scoreGap ?? 0} points</Text>
          </View>
        </View>

        {/* Ability Analysis */}
        {profile && (
          <View style={ds.card}>
            <Text style={ds.cardTitle}>Ability Breakdown</Text>
            <AbilityBar part={1} accuracy={profile.part1Accuracy} />
            <AbilityBar part={2} accuracy={profile.part2Accuracy} />
            <AbilityBar part={3} accuracy={profile.part3Accuracy} />
            <AbilityBar part={4} accuracy={profile.part4Accuracy} />
          </View>
        )}

        {/* Weakness Diagnosis */}
        {rec && (
          <View style={[ds.card, ds.highlightCard]}>
            <View style={ds.highlightBadge}>
              <Text style={ds.highlightBadgeText}>BREAKTHROUGH POINT</Text>
            </View>
            <Text style={ds.highlightTitle}>Part {rec.targetPart}: {rec.reason}</Text>
            <Text style={ds.highlightDesc}>{rec.detail}</Text>
            <View style={ds.statsRow}>
              <View style={ds.statItem}>
                <Text style={ds.statNum}>{rec.estimatedDays}</Text>
                <Text style={ds.statLabel}>days to improve</Text>
              </View>
              <View style={ds.statItem}>
                <Text style={ds.statNum}>{rec.tasks.length}</Text>
                <Text style={ds.statLabel}>daily tasks</Text>
              </View>
              <View style={ds.statItem}>
                <Text style={ds.statNum}>{rec.stage}</Text>
                <Text style={ds.statLabel}>stage</Text>
              </View>
            </View>
          </View>
        )}

        {/* Training Plan */}
        {rec && (
          <View style={ds.card}>
            <Text style={ds.cardTitle}>Your Training Plan</Text>
            {rec.tasks.map((task) => (
              <View key={task.id} style={ds.taskRow}>
                <Text style={ds.taskIcon}>{task.icon}</Text>
                <View style={ds.taskInfo}>
                  <Text style={ds.taskLabel}>{task.label}</Text>
                  <Text style={ds.taskMeta}>{task.questionCount} questions · ~{task.durationMinutes} min</Text>
                </View>
                <View style={[ds.taskPriority, { backgroundColor: task.priority === 'high' ? '#FFF3E0' : task.priority === 'medium' ? '#F5F5F5' : '#E8F5E9' }]}>
                  <Text style={[ds.taskPText, { color: task.priority === 'high' ? '#E65100' : task.priority === 'medium' ? '#757575' : '#2E7D32' }]}>
                    {task.priority}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={ds.bottom}>
        <TouchableOpacity style={ds.btn} onPress={handleFinish} activeOpacity={0.8}>
          <Text style={ds.btnText}>Start My Training Journey →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40 },
  header: {
    backgroundColor: '#1A237E', paddingVertical: 32, paddingHorizontal: 24,
    alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 32 },

  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 20,
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 16 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scoreItem: { alignItems: 'center', flex: 1 },
  scoreLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase' },
  scoreNum: { fontSize: 36, fontWeight: '800', color: '#212121', marginVertical: 4 },
  scoreArrow: { fontSize: 24, color: '#BDBDBD', marginHorizontal: 16, paddingBottom: 12 },
  gapChip: {
    backgroundColor: '#E3F2FD', paddingVertical: 8, borderRadius: 20, alignItems: 'center',
  },
  gapText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },

  highlightCard: { borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  highlightBadge: { marginBottom: 12 },
  highlightBadgeText: { fontSize: 11, fontWeight: '800', color: '#FF9800', letterSpacing: 1.5 },
  highlightTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 8 },
  highlightDesc: { fontSize: 14, color: '#616161', lineHeight: 21, marginBottom: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 14 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#212121' },
  statLabel: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },

  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskIcon: { fontSize: 22, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskLabel: { fontSize: 14, fontWeight: '600', color: '#212121' },
  taskMeta: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  taskPriority: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  taskPText: { fontSize: 11, fontWeight: '700' },

  bottom: {
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  btn: {
    backgroundColor: '#1A237E', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
