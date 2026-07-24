import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useCoach } from '../../context/CoachContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { userGoal, setOnboardingStage, assessmentHistory, trainingHistory } = useCoach();

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will restart your onboarding and clear all progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const coachKeys = keys.filter(k => k.startsWith('@coach_'));
            await AsyncStorage.multiRemove(coachKeys);
            setOnboardingStage('success_story');
          },
        },
      ],
    );
  };

  const handleReassess = () => {
    setOnboardingStage('diagnostic_test');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Profile</Text>

        {/* Goal */}
        {userGoal && (
          <View style={s.card}>
            <Text style={s.cardTitle}>My Goal</Text>
            <Text style={s.goalScore}>
              {userGoal.currentListeningScore} → {userGoal.targetListeningScore}
            </Text>
            <Text style={s.goalMeta}>Gap: +{userGoal.scoreGap} points</Text>
          </View>
        )}

        {/* Stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Summary</Text>
          <View style={s.statRow}>
            <View style={s.stat}>
              <Text style={s.statNum}>{assessmentHistory.length}</Text>
              <Text style={s.statLabel}>Assessments</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statNum}>{trainingHistory.length}</Text>
              <Text style={s.statLabel}>Trainings</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Actions</Text>
          <TouchableOpacity style={s.actionBtn} onPress={handleReassess}>
            <Text style={s.actionText}>🔄 Re-assess Listening</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.dangerBtn]} onPress={handleReset}>
            <Text style={[s.actionText, s.dangerText]}>⚠️ Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40, paddingHorizontal: 16 },

  title: { fontSize: 22, fontWeight: '800', color: '#1A237E', paddingTop: 16, paddingBottom: 12 },

  card: {
    backgroundColor: '#FFFFFF', marginBottom: 14, padding: 18,
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 12 },

  goalScore: { fontSize: 24, fontWeight: '800', color: '#1A237E', textAlign: 'center' },
  goalMeta: { fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 6 },

  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#1A237E' },
  statLabel: { fontSize: 12, color: '#9E9E9E', marginTop: 4 },

  actionBtn: {
    backgroundColor: '#F5F5F5', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#212121' },
  dangerBtn: { backgroundColor: '#FFF5F5' },
  dangerText: { color: '#D32F2F' },
});
