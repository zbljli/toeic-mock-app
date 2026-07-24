import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useCoach } from '../../context/CoachContext';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { TestModeConfig } from '../../types';

type Nav = StackNavigationProp<RootStackParamList>;

const FIVE_QUESTION_CONFIG: TestModeConfig = {
  mode: 'listening-only',
  label: 'Quick Warm-up',
  description: '5 listening questions across all parts',
  totalQuestions: 5,
  totalTimeMinutes: 5,
  parts: [1, 2, 3, 4],
};

const FULL_TEST_CONFIG: TestModeConfig = {
  mode: 'listening-only',
  label: 'Full Listening Test',
  description: 'Part 1–4 · 45 min · 100 questions',
  totalQuestions: 100,
  totalTimeMinutes: 45,
  parts: [1, 2, 3, 4],
};

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { setOnboardingStage } = useCoach();

  const handleSkip = async () => {
    await setOnboardingStage('completed');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Branding */}
        <View style={s.branding}>
          <Text style={s.brandIcon}>🎧</Text>
          <Text style={s.brandTitle}>TOEIC Listening</Text>
          <Text style={s.brandSub}>AI Coach</Text>
        </View>

        {/* Description */}
        <Text style={s.desc}>
          Ready to improve your listening skills?{'\n'}
          Choose how you'd like to start:
        </Text>

        {/* Three equally prominent options */}
        <View style={s.options}>
          {/* Option 1: 5 Questions */}
          <TouchableOpacity
            style={[s.card, s.cardQuick]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OnboardingTest', { config: FIVE_QUESTION_CONFIG })}
          >
            <Text style={s.cardEmoji}>⚡</Text>
            <Text style={s.cardTitle}>5 Questions</Text>
            <Text style={s.cardSub}>Quick warm-up · ~3 min</Text>
            <Text style={s.cardHint}>Try a few questions first</Text>
          </TouchableOpacity>

          {/* Option 2: 100 Questions */}
          <TouchableOpacity
            style={[s.card, s.cardFull]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OnboardingTest', { config: FULL_TEST_CONFIG })}
          >
            <Text style={s.cardEmoji}>🎯</Text>
            <Text style={s.cardTitle}>100 Questions</Text>
            <Text style={s.cardSub}>Full test · ~45 min</Text>
            <Text style={s.cardHint}>Parts 1–4 · Standard TOEIC format</Text>
          </TouchableOpacity>

          {/* Option 3: Skip */}
          <TouchableOpacity
            style={[s.card, s.cardSkip]}
            activeOpacity={0.7}
            onPress={handleSkip}
          >
            <Text style={s.cardEmoji}>🏠</Text>
            <Text style={s.cardTitle}>Skip for Now</Text>
            <Text style={s.cardSub}>Explore the app first</Text>
            <Text style={s.cardHint}>You can take a test anytime</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_BASE = {
  paddingVertical: 20,
  paddingHorizontal: 24,
  borderRadius: 20,
  alignItems: 'center' as const,
  borderWidth: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Branding
  branding: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: { fontSize: 48, marginBottom: 8 },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 16,
    color: '#1A237E',
    fontWeight: '600',
    marginTop: 2,
  },

  // Description
  desc: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // Options
  options: {
    gap: 0,
  },

  // Cards — all equally prominent
  card: {
    ...CARD_BASE,
    marginBottom: 14,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  cardQuick: {
    borderColor: '#1565C0',
  },
  cardFull: {
    borderColor: '#1A237E',
  },
  cardSkip: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },

  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});
