import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useCoach } from '../../context/CoachContext';

export default function GrowthScreen() {
  const { scoreHistory, abilityProfile, userGoal } = useCoach();
  const profile = abilityProfile;

  return (
    <SafeAreaView style={gs.safe}>
      <ScrollView contentContainerStyle={gs.scroll}>
        <Text style={gs.title}>Growth Tracker</Text>

        {/* Score Trend */}
        <View style={gs.card}>
          <Text style={gs.cardTitle}>Score History</Text>
          {scoreHistory.length > 0 ? (
            scoreHistory.slice(-8).map((r, i) => (
              <View key={i} style={gs.historyRow}>
                <Text style={gs.historyDate}>{r.date}</Text>
                <Text style={gs.historyType}>{r.type === 'assessment' ? 'Assessment' : 'Mock Test'}</Text>
                <Text style={gs.historyScore}>{r.listeningScore}</Text>
              </View>
            ))
          ) : (
            <View style={gs.emptyWrap}>
              <Text style={gs.emptyIcon}>📈</Text>
              <Text style={gs.emptyText}>Complete your first assessment{'\n'}to see your score trend.</Text>
            </View>
          )}
        </View>

        {/* Ability Distribution */}
        {profile && (
          <View style={gs.card}>
            <Text style={gs.cardTitle}>Current Ability</Text>
            {(['Part 1', 'Part 2', 'Part 3', 'Part 4'] as const).map((label, i) => {
              const part = (i + 1) as 1 | 2 | 3 | 4;
              const acc = part === 1 ? profile.part1Accuracy : part === 2 ? profile.part2Accuracy : part === 3 ? profile.part3Accuracy : profile.part4Accuracy;
              const pct = Math.round(acc * 100);
              return (
                <View key={label} style={gs.barRow}>
                  <Text style={gs.barLabel}>{label}</Text>
                  <View style={gs.barBg}>
                    <View style={[gs.barFill, { width: `${pct}%`, backgroundColor: pct >= 70 ? '#4CAF50' : pct >= 50 ? '#FF9800' : '#F44336' }]} />
                  </View>
                  <Text style={gs.barPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Goal Progress */}
        {userGoal && (
          <View style={gs.card}>
            <Text style={gs.cardTitle}>Goal Progress</Text>
            <Text style={gs.goalInfo}>
              {userGoal.currentListeningScore} → {userGoal.targetListeningScore}
              {'  '}(+{userGoal.scoreGap} gap)
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const gs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40, paddingHorizontal: 16 },

  title: { fontSize: 22, fontWeight: '800', color: '#1A237E', paddingTop: 16, paddingBottom: 12 },

  card: {
    backgroundColor: '#FFFFFF', marginBottom: 14, padding: 18,
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 14 },

  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  historyDate: { fontSize: 13, color: '#9E9E9E', width: 80 },
  historyType: { fontSize: 13, color: '#616161', flex: 1 },
  historyScore: { fontSize: 16, fontWeight: '800', color: '#1A237E' },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { fontSize: 13, color: '#616161', width: 55 },
  barBg: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  barPct: { fontSize: 14, fontWeight: '800', width: 40, textAlign: 'right' },

  goalInfo: { fontSize: 18, fontWeight: '700', color: '#1A237E', textAlign: 'center' },

  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20 },
});
