import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useCoach } from '../../context/CoachContext';

export default function GoalSettingScreen() {
  const { setOnboardingStage, saveUserGoal } = useCoach();
  const [currentScore, setCurrentScore] = useState('300');
  const [targetScore, setTargetScore] = useState('400');

  const current = parseInt(currentScore, 10) || 0;
  const target = parseInt(targetScore, 10) || 0;
  const gap = target - current;

  const handleNext = async () => {
    if (current < 5 || target < 5 || target <= current) return;
    await saveUserGoal({
      currentListeningScore: current,
      targetListeningScore: target,
      scoreGap: gap,
      setAt: new Date().toISOString(),
    });
    setOnboardingStage('diagnostic_test');
  };

  const isValid = current >= 5 && target > current && target <= 495;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <TouchableOpacity onPress={() => setOnboardingStage('success_story')}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.step}>Step 2 of 4</Text>
        <Text style={s.title}>Set Your{'\n'}Listening Goal</Text>
        <Text style={s.desc}>
          Enter your current and target TOEIC listening scores.{'\n'}
          We'll design a training path to close the gap.
        </Text>

        <View style={s.inputRow}>
          <View style={s.inputCol}>
            <Text style={s.label}>Current Score</Text>
            <TextInput
              style={s.input}
              value={currentScore}
              onChangeText={setCurrentScore}
              keyboardType="number-pad"
              placeholder="300"
              placeholderTextColor="#BDBDBD"
              maxLength={3}
            />
          </View>
          <Text style={s.toArrow}>→</Text>
          <View style={s.inputCol}>
            <Text style={s.label}>Target Score</Text>
            <TextInput
              style={s.input}
              value={targetScore}
              onChangeText={setTargetScore}
              keyboardType="number-pad"
              placeholder="400"
              placeholderTextColor="#BDBDBD"
              maxLength={3}
            />
          </View>
        </View>

        {gap > 0 && (
          <View style={s.gapCard}>
            <Text style={s.gapLabel}>Score Gap</Text>
            <Text style={s.gapNum}>+{gap}</Text>
            <Text style={s.gapHint}>
              {gap <= 50
                ? "You're close! Focused practice can get you there."
                : gap <= 100
                ? 'A solid plan will bridge this gap steadily.'
                : 'This is achievable with consistent, targeted training.'}
            </Text>
          </View>
        )}

        {gap > 0 && (
          <View style={s.estimateCard}>
            <Text style={s.estimateTitle}>📅 Estimated Timeline</Text>
            <View style={s.estimateRow}>
              <View style={s.estimateItem}>
                <Text style={s.estimateNum}>~30</Text>
                <Text style={s.estimateUnit}>min / day</Text>
              </View>
              <Text style={s.estimateArrow}>·</Text>
              <View style={s.estimateItem}>
                <Text style={s.estimateNum}>~{Math.max(14, Math.round(gap / 3))}</Text>
                <Text style={s.estimateUnit}>days</Text>
              </View>
              <Text style={s.estimateArrow}>·</Text>
              <View style={s.estimateItem}>
                <Text style={s.estimateNum}>{Math.max(1, Math.round(gap / 100))}</Text>
                <Text style={s.estimateUnit}>stages</Text>
              </View>
            </View>
            <Text style={s.estimateHint}>Consistency matters more than intensity.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, !isValid && s.btnDisabled]}
          onPress={handleNext}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[s.btnText, !isValid && s.btnTextDisabled]}>
            Next: Listening Assessment →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  back: { fontSize: 15, color: '#1976D2', fontWeight: '600', marginBottom: 24 },
  step: {
    fontSize: 13, color: '#9E9E9E', fontWeight: '600', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', lineHeight: 36, marginBottom: 12 },
  desc: { fontSize: 14, color: '#757575', lineHeight: 21, marginBottom: 32 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  inputCol: { flex: 1 },
  label: {
    fontSize: 12, fontWeight: '700', color: '#616161', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    fontSize: 32, fontWeight: '800', color: '#1A237E', textAlign: 'center',
    borderWidth: 2, borderColor: '#E0E0E0',
  },
  toArrow: { fontSize: 24, color: '#BDBDBD', fontWeight: '700', paddingTop: 20 },

  gapCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#1565C0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  gapLabel: {
    fontSize: 12, color: '#9E9E9E', fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gapNum: { fontSize: 40, fontWeight: '800', color: '#1565C0', marginVertical: 4 },
  gapHint: { fontSize: 13, color: '#757575', textAlign: 'center', lineHeight: 19, marginTop: 4 },

  estimateCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#E8EAF6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  estimateTitle: { fontSize: 14, fontWeight: '700', color: '#1A237E', marginBottom: 14 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  estimateItem: { alignItems: 'center' },
  estimateNum: { fontSize: 22, fontWeight: '800', color: '#1A237E' },
  estimateUnit: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  estimateArrow: { fontSize: 20, color: '#BDBDBD', fontWeight: '600' },
  estimateHint: { fontSize: 12, color: '#BDBDBD', fontStyle: 'italic' },

  btn: {
    backgroundColor: '#1A237E', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', marginTop: 'auto', marginBottom: 24,
  },
  btnDisabled: { backgroundColor: '#E0E0E0' },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  btnTextDisabled: { color: '#9E9E9E' },
});
