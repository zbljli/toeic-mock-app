import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useCoach } from '../../context/CoachContext';
import { SUCCESS_STORIES } from '../../data/successStories';

const story = SUCCESS_STORIES[0];

export default function SuccessStoryScreen() {
  const { setOnboardingStage } = useCoach();

  const handleNext = () => {
    setOnboardingStage('goal_setting');
  };

  if (!story) return null;

  return (
    <SafeAreaView style={sc.safe}>
      {/* Header */}
      <View style={sc.topSection}>
        <Text style={sc.brandLabel}>TOEIC Listening AI Coach</Text>
        <Text style={sc.title}>看见可能性</Text>
        <Text style={sc.subtitle}>
          每一个高分背后，都有一条清晰的成长路径。{'\n'}
          看看 Carrie 如何在 45 天内做到。
        </Text>
      </View>

      {/* Story Card */}
      <View style={sc.cardWrap}>
        <View style={sc.card}>
          {/* Header: avatar + scores */}
          <View style={sc.header}>
            <View style={sc.userRow}>
              <Text style={sc.avatar}>{story.avatarEmoji}</Text>
              <View>
                <Text style={sc.nickname}>{story.nickname}</Text>
                <Text style={sc.duration}>{story.totalDays} 天</Text>
              </View>
            </View>
            <View style={sc.improvementBadge}>
              <Text style={sc.improvementText}>+{story.improvement}</Text>
            </View>
          </View>

          {/* Score progression */}
          <View style={sc.scoreRow}>
            <View style={sc.scoreItem}>
              <Text style={sc.scoreLabel}>起点</Text>
              <Text style={sc.scoreNum}>{story.startScore}</Text>
            </View>
            <Text style={sc.scoreArrow}>→</Text>
            <View style={sc.scoreItem}>
              <Text style={sc.scoreLabel}>目标</Text>
              <Text style={[sc.scoreNum, { color: '#1565C0' }]}>{story.targetScore}</Text>
            </View>
            <Text style={sc.scoreArrow}>→</Text>
            <View style={sc.scoreItem}>
              <Text style={sc.scoreLabel}>达成</Text>
              <Text style={[sc.scoreNum, { color: '#4CAF50' }]}>{story.finalScore}</Text>
            </View>
          </View>

          {/* Phase timeline */}
          <View style={sc.phases}>
            {story.phases.map((phase, idx) => (
              <View key={idx} style={sc.phaseRow}>
                <View style={sc.phaseDotWrap}>
                  <View style={[sc.phaseDot, idx === 0 && sc.phaseDotFirst, idx === story.phases.length - 1 && sc.phaseDotLast]} />
                  {idx < story.phases.length - 1 && <View style={sc.phaseLine} />}
                </View>
                <View style={sc.phaseContent}>
                  <Text style={sc.phaseLabel}>{phase.label}</Text>
                  <Text style={sc.phaseFocus}>{phase.focus}</Text>
                  <Text style={sc.phaseDesc}>{phase.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Testimonial */}
          <View style={sc.testimonial}>
            <Text style={sc.quoteMark}>"</Text>
            <Text style={sc.quoteText}>{story.testimonial}</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={sc.bottom}>
        <Text style={sc.ctaHint}>找到正确的方法，你也可以做到。</Text>
        <TouchableOpacity style={sc.btn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={sc.btnText}>开始我的提升计划 →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },

  topSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  brandLabel: { fontSize: 12, color: '#1A237E', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A1A', lineHeight: 38, marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#757575', lineHeight: 21 },

  cardWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { fontSize: 32 },
  nickname: { fontSize: 18, fontWeight: '700', color: '#212121' },
  duration: { fontSize: 13, color: '#9E9E9E', marginTop: 1 },
  improvementBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  improvementText: { fontSize: 16, fontWeight: '800', color: '#2E7D32' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingHorizontal: 4 },
  scoreItem: { alignItems: 'center', flex: 1 },
  scoreLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600', marginBottom: 2 },
  scoreNum: { fontSize: 26, fontWeight: '800', color: '#212121' },
  scoreArrow: { fontSize: 18, color: '#BDBDBD', paddingBottom: 8 },

  phases: { marginBottom: 16 },
  phaseRow: { flexDirection: 'row', marginBottom: 4 },
  phaseDotWrap: { alignItems: 'center', width: 24, marginRight: 12 },
  phaseDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', marginTop: 4,
  },
  phaseDotFirst: { backgroundColor: '#4CAF50' },
  phaseDotLast: { backgroundColor: '#1A237E' },
  phaseLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: 4 },
  phaseContent: { flex: 1, paddingBottom: 12 },
  phaseLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', marginBottom: 2 },
  phaseFocus: { fontSize: 14, fontWeight: '700', color: '#212121' },
  phaseDesc: { fontSize: 12, color: '#757575', marginTop: 2, lineHeight: 17 },

  testimonial: {
    backgroundColor: '#F5F7FA', padding: 14, borderRadius: 12,
    borderLeftWidth: 3, borderLeftColor: '#1A237E',
  },
  quoteMark: { fontSize: 28, color: '#1A237E', fontWeight: '800', lineHeight: 28, marginBottom: 4 },
  quoteText: { fontSize: 14, color: '#424242', lineHeight: 21, fontStyle: 'italic' },

  bottom: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 },
  ctaHint: { fontSize: 14, color: '#616161', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
  btn: {
    backgroundColor: '#1A237E', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
