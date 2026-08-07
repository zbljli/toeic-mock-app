import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Alert,
} from 'react-native';
import { useCoach } from '../../context/CoachContext';
import type { GrowthDiary, DiaryMood } from '../../types/coach';

const PART_LABELS: Record<number, string> = {
  1: 'Photographs', 2: 'Q-Response', 3: 'Conversations', 4: 'Talks',
};

const MOOD_OPTIONS: { key: DiaryMood; emoji: string; label: string }[] = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
];

// ─── Score Goal Card ───

function ScoreGoalCard({ goal, latestScore }: {
  goal: { currentListeningScore: number; targetListeningScore: number; scoreGap: number };
  latestScore: number;
}) {
  const overallProgress = goal.scoreGap > 0
    ? Math.min(1, (latestScore - goal.currentListeningScore) / goal.scoreGap)
    : 0;
  const pct = Math.round(overallProgress * 100);

  return (
    <View style={hs.goalCard}>
      <View style={hs.goalHeader}>
        <Text style={hs.goalIcon}>🎯</Text>
        <View>
          <Text style={hs.goalTitle}>Target: {goal.targetListeningScore}</Text>
          <Text style={hs.goalSub}>Listening Score Goal</Text>
        </View>
      </View>
      <View style={hs.goalScores}>
        <View style={hs.goalScoreItem}>
          <Text style={hs.goalScoreNum}>{goal.currentListeningScore}</Text>
          <Text style={hs.goalScoreLabel}>Start</Text>
        </View>
        <View style={hs.goalBarWrap}>
          <View style={hs.goalBarBg}>
            <View style={[hs.goalBarFill, { width: `${Math.max(pct, 4)}%` }]} />
          </View>
          <Text style={hs.goalProgressText}>{pct}%</Text>
        </View>
        <View style={hs.goalScoreItem}>
          <Text style={[hs.goalScoreNum, { color: '#64FFDA' }]}>{goal.targetListeningScore}</Text>
          <Text style={hs.goalScoreLabel}>Goal</Text>
        </View>
      </View>
      <View style={hs.gapRow}>
        <Text style={hs.gapText}>Distance to goal: {Math.max(0, goal.targetListeningScore - latestScore)} points</Text>
      </View>
    </View>
  );
}

// ─── Diagnosis Card ───

function DiagnosisCard({ profile, targetPart }: {
  profile: { part1Accuracy: number; part2Accuracy: number; part3Accuracy: number; part4Accuracy: number; weakestPart: number; weakestAccuracy: number } | null;
  targetPart: number;
}) {
  if (!profile) return null;
  const pct = Math.round(profile.weakestAccuracy * 100);
  const parts = [
    { p: 1, acc: profile.part1Accuracy },
    { p: 2, acc: profile.part2Accuracy },
    { p: 3, acc: profile.part3Accuracy },
    { p: 4, acc: profile.part4Accuracy },
  ];

  return (
    <View style={hs.diagCard}>
      <View style={hs.diagHeader}>
        <Text style={hs.diagIcon}>🔍</Text>
        <Text style={hs.diagTitle}>AI Diagnosis</Text>
      </View>
      <View style={hs.diagBody}>
        <View style={hs.diagTarget}>
          <Text style={hs.diagPartLabel}>Part {targetPart}</Text>
          <Text style={hs.diagPartName}>{PART_LABELS[targetPart] ?? ''}</Text>
        </View>
        <View style={hs.diagReason}>
          <Text style={hs.diagBreakthrough}>Your Breakthrough Point</Text>
          {/* Mini bars for all parts */}
          {parts.map(({ p, acc }) => {
            const ap = Math.round(acc * 100);
            const color = p === targetPart
              ? ap >= 60 ? '#FF9800' : '#F44336'
              : ap >= 70 ? '#4CAF50' : '#BDBDBD';
            return (
              <View key={p} style={hs.miniBarRow}>
                <Text style={hs.miniBarLabel}>P{p}</Text>
                <View style={hs.miniBarBg}>
                  <View style={[hs.miniBarFill, { width: `${Math.max(ap, 4)}%`, backgroundColor: color }]} />
                </View>
                <Text style={[hs.miniBarPct, { color }]}>{ap}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Today Tasks Card ───

function TodayTaskCard({ tasks }: {
  tasks: { icon: string; label: string; durationMinutes: number; questionCount: number; priority: 'high' | 'medium' | 'low' }[];
}) {
  return (
    <View style={hs.tasksCard}>
      <View style={hs.tasksHeader}>
        <Text style={hs.tasksIcon}>📋</Text>
        <Text style={hs.tasksTitle}>Today's Training</Text>
      </View>
      {tasks.length > 0 ? (
        tasks.slice(0, 4).map((task, idx) => (
          <View key={idx} style={hs.taskRow}>
            <Text style={hs.taskIcon}>{task.icon}</Text>
            <View style={hs.taskInfo}>
              <Text style={hs.taskLabel}>{task.label}</Text>
              <Text style={hs.taskMeta}>{task.questionCount} questions · ~{task.durationMinutes} min</Text>
            </View>
            <View style={[hs.taskPriority, { backgroundColor: task.priority === 'high' ? '#FFF3E0' : '#F5F5F5' }]}>
              <Text style={[hs.taskPriorityText, { color: task.priority === 'high' ? '#E65100' : '#757575' }]}>
                {task.priority}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={hs.emptyTasks}>Complete your diagnostic assessment to get today's tasks.</Text>
      )}
    </View>
  );
}

// ─── Growth Snapshot Card ───

function GrowthSnapshotCard({ vocabCount, latestScore, startScore }: {
  vocabCount: number; latestScore: number; startScore: number;
}) {
  const improved = latestScore - startScore;

  return (
    <View style={hs.growthCard}>
      <View style={hs.growthHeader}>
        <Text style={hs.growthIcon}>📊</Text>
        <Text style={hs.growthTitle}>My Growth</Text>
      </View>
      <View style={hs.growthStats}>
        <View style={hs.growthStat}>
          <Text style={hs.growthStatNum}>{vocabCount}</Text>
          <Text style={hs.growthStatLabel}>Total{'\n'}Vocabulary</Text>
        </View>
        <View style={hs.growthDivider} />
        <View style={hs.growthStat}>
          <Text style={[hs.growthStatNum, { color: improved >= 0 ? '#4CAF50' : '#F44336' }]}>
            {improved >= 0 ? '+' : ''}{improved}
          </Text>
          <Text style={hs.growthStatLabel}>Score{'\n'}Change</Text>
        </View>
        <View style={hs.growthDivider} />
        <View style={hs.growthStat}>
          <Text style={hs.growthStatNum}>{latestScore}</Text>
          <Text style={hs.growthStatLabel}>Current{'\n'}Score</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Latest Diary Card ───

function LatestDiaryCard({ diary, onPress }: { diary: GrowthDiary | null; onPress: () => void }) {
  return (
    <TouchableOpacity style={hs.diaryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={hs.diaryHeader}>
        <Text style={hs.diaryIcon}>📝</Text>
        <Text style={hs.diaryTitle}>Latest Journal</Text>
        {diary && <Text style={hs.diaryDay}>Day {diary.dayNumber}</Text>}
      </View>
      {diary ? (
        <View>
          <Text style={hs.diaryContent} numberOfLines={2}>
            "{diary.content}"
          </Text>
          <Text style={hs.diaryDate}>{diary.date}</Text>
        </View>
      ) : (
        <View style={hs.diaryEmpty}>
          <Text style={hs.diaryEmptyText}>No journal entries yet. Tap to write your first reflection.</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Diary Editor Modal ───

function DiaryEditorModal({
  visible, onClose, onSave, dayNumber,
}: {
  visible: boolean; onClose: () => void;
  onSave: (diary: GrowthDiary) => void; dayNumber: number;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [content, setContent] = useState('');
  const [challenges, setChallenges] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [mood, setMood] = useState<DiaryMood>('good');

  const handleSave = () => {
    if (!content.trim()) return;
    const diary: GrowthDiary = {
      id: `diary_${Date.now()}`,
      dayNumber,
      date: today,
      createdAt: new Date().toISOString(),
      content: content.trim(),
      challenges: challenges.trim(),
      tomorrowPlan: tomorrowPlan.trim(),
      completedTaskIds: [],
      scoreSnapshot: 0,
      vocabularyCount: 0,
      mood,
    };
    onSave(diary);
    setContent(''); setChallenges(''); setTomorrowPlan(''); setMood('good');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={de.safe}>
        <View style={de.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={de.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={de.headerTitle}>Today's Reflection</Text>
          <TouchableOpacity onPress={handleSave} disabled={!content.trim()}>
            <Text style={[de.save, !content.trim() && de.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={de.body}>
          <Text style={de.dateLabel}>{today} · Day {dayNumber}</Text>

          <Text style={de.fieldLabel}>How are you feeling?</Text>
          <View style={de.moodRow}>
            {MOOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[de.moodBtn, mood === opt.key && de.moodBtnActive]}
                onPress={() => setMood(opt.key)}
              >
                <Text style={de.moodEmoji}>{opt.emoji}</Text>
                <Text style={[de.moodLabel, mood === opt.key && de.moodLabelActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={de.fieldLabel}>Today's biggest takeaway</Text>
          <TextInput
            style={de.input}
            value={content}
            onChangeText={setContent}
            placeholder="What did you learn today? What clicked?"
            placeholderTextColor="#BDBDBD"
            multiline
            textAlignVertical="top"
          />

          <Text style={de.fieldLabel}>Challenges faced</Text>
          <TextInput
            style={de.inputSmall}
            value={challenges}
            onChangeText={setChallenges}
            placeholder="What was difficult? What didn't go as planned?"
            placeholderTextColor="#BDBDBD"
            multiline
            textAlignVertical="top"
          />

          <Text style={de.fieldLabel}>Tomorrow's focus</Text>
          <TextInput
            style={de.inputSmall}
            value={tomorrowPlan}
            onChangeText={setTomorrowPlan}
            placeholder="What will you work on next?"
            placeholderTextColor="#BDBDBD"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ───

export default function CoachHomeScreen({ navigation }: { navigation: any }) {
  const {
    userGoal, abilityProfile, recommendation, dailyTasks,
    scoreHistory, diaries, saveDiary, getLatestDiary,
  } = useCoach();

  const [diaryVisible, setDiaryVisible] = useState(false);

  const latestScore = useMemo(() => {
    if (scoreHistory.length > 0) return scoreHistory[scoreHistory.length - 1].listeningScore;
    return userGoal?.currentListeningScore ?? 0;
  }, [scoreHistory, userGoal]);

  const startScore = userGoal?.currentListeningScore ?? 0;

  // Estimate vocab from training records
  const vocabCount = useMemo(() => {
    return 0; // Populated as records accumulate
  }, []);

  const latestDiary = useMemo(() => getLatestDiary(), [getLatestDiary]);
  const dayNumber = diaries.length + 1;
  const targetPart = recommendation?.targetPart ?? abilityProfile?.weakestPart ?? 3;

  const handleSaveDiary = async (diary: GrowthDiary) => {
    await saveDiary(diary);
  };

  return (
    <SafeAreaView style={hs.safe}>
      <ScrollView contentContainerStyle={hs.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={hs.headerBar}>
          <View>
            <Text style={hs.appName}>TOEIC Listening AI</Text>
            <Text style={hs.dayLabel}>Day {Math.max(1, diaries.length || 1)}</Text>
          </View>
          <View style={hs.headerBadge}>
            <Text style={hs.headerBadgeText}>Coach</Text>
          </View>
        </View>

        {/* Score Goal */}
        {userGoal && (
          <ScoreGoalCard goal={userGoal} latestScore={latestScore} />
        )}

        {/* AI Diagnosis */}
        {abilityProfile && (
          <DiagnosisCard profile={abilityProfile} targetPart={targetPart} />
        )}

        {/* Today's Tasks */}
        {dailyTasks && (
          <TodayTaskCard tasks={dailyTasks.tasks} />
        )}

        {/* Growth Snapshot */}
        <GrowthSnapshotCard
          vocabCount={vocabCount}
          latestScore={latestScore}
          startScore={startScore}
        />

        {/* Quick Actions */}
        <View style={hs.actionsWrap}>
          {/* Quick Practice (always available) */}
          <TouchableOpacity
            style={hs.quickBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert('功能开发中', '敬请期待！')}
          >
            <Text style={hs.quickBtnIcon}>⚡</Text>
            <View>
              <Text style={hs.quickBtnTitle}>Quick Practice</Text>
              <Text style={hs.quickBtnSub}>10 min</Text>
            </View>
          </TouchableOpacity>

          {/* Full Assessment or Start Training */}
          {abilityProfile ? (
            <TouchableOpacity
              style={hs.quickBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('功能开发中', '敬请期待！')}
            >
              <Text style={hs.quickBtnIcon}>🎧</Text>
              <View>
                <Text style={hs.quickBtnTitle}>Full Mock Test</Text>
                <Text style={hs.quickBtnSub}>45 min</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[hs.quickBtn, hs.assessBtn]}
              activeOpacity={0.8}
              onPress={() => Alert.alert('功能开发中', '敬请期待！')}
            >
              <Text style={hs.quickBtnIcon}>🔍</Text>
              <View>
                <Text style={hs.quickBtnTitle}>Take Assessment</Text>
                <Text style={hs.quickBtnSub}>10 min</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Latest Diary */}
        <LatestDiaryCard diary={latestDiary} onPress={() => setDiaryVisible(true)} />

        {/* Reflection */}
        {recommendation && (
          <TouchableOpacity
            style={hs.startBtn}
            activeOpacity={0.8}
            onPress={() => setDiaryVisible(true)}
          >
            <Text style={hs.startBtnText}>📝 Write Today's Reflection</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Diary Editor Modal */}
      <DiaryEditorModal
        visible={diaryVisible}
        onClose={() => setDiaryVisible(false)}
        onSave={handleSaveDiary}
        dayNumber={dayNumber}
      />
    </SafeAreaView>
  );
}

// ─── Home Styles ───

const hs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { paddingBottom: 40 },

  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  appName: { fontSize: 13, fontWeight: '700', color: '#1A237E', letterSpacing: 0.5 },
  dayLabel: { fontSize: 22, fontWeight: '800', color: '#212121', marginTop: 2 },
  headerBadge: {
    backgroundColor: '#E8EAF6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#1A237E' },

  // Score Goal
  goalCard: {
    backgroundColor: '#1A237E', marginHorizontal: 16, marginTop: 8,
    padding: 20, borderRadius: 18,
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  goalIcon: { fontSize: 28 },
  goalTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  goalSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  goalScores: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  goalScoreItem: { alignItems: 'center', width: 52 },
  goalScoreNum: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  goalScoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase' },
  goalBarWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  goalBarBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4,
    width: '100%', overflow: 'hidden',
  },
  goalBarFill: { height: '100%', backgroundColor: '#64FFDA', borderRadius: 4 },
  goalProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600' },
  gapRow: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, borderRadius: 10,
    alignItems: 'center',
  },
  gapText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Diagnosis
  diagCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 18, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#FF9800',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  diagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  diagIcon: { fontSize: 18 },
  diagTitle: { fontSize: 14, fontWeight: '700', color: '#616161' },
  diagBody: { flexDirection: 'row', gap: 16 },
  diagTarget: { alignItems: 'center', justifyContent: 'center' },
  diagPartLabel: { fontSize: 22, fontWeight: '800', color: '#212121' },
  diagPartName: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  diagReason: { flex: 1 },
  diagBreakthrough: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 8 },
  miniBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  miniBarLabel: { fontSize: 11, fontWeight: '700', color: '#616161', width: 18 },
  miniBarBg: { flex: 1, height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },
  miniBarPct: { fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },

  // Tasks
  tasksCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tasksHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  tasksIcon: { fontSize: 18 },
  tasksTitle: { fontSize: 14, fontWeight: '700', color: '#616161' },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskIcon: { fontSize: 22, marginRight: 10 },
  taskInfo: { flex: 1 },
  taskLabel: { fontSize: 14, fontWeight: '600', color: '#212121' },
  taskMeta: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  taskPriority: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskPriorityText: { fontSize: 11, fontWeight: '700' },
  emptyTasks: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 },

  // Growth Snapshot
  growthCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  growthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  growthIcon: { fontSize: 18 },
  growthTitle: { fontSize: 14, fontWeight: '700', color: '#616161' },
  growthStats: { flexDirection: 'row', alignItems: 'center' },
  growthStat: { flex: 1, alignItems: 'center' },
  growthStatNum: { fontSize: 24, fontWeight: '800', color: '#212121' },
  growthStatLabel: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', marginTop: 2, lineHeight: 15 },
  growthDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },

  // Latest Diary
  diaryCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    padding: 18, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  diaryIcon: { fontSize: 18 },
  diaryTitle: { fontSize: 14, fontWeight: '700', color: '#616161', flex: 1 },
  diaryDay: {
    fontSize: 12, fontWeight: '700', color: '#1A237E',
    backgroundColor: '#E8EAF6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  diaryContent: { fontSize: 14, color: '#424242', lineHeight: 20, fontStyle: 'italic' },
  diaryDate: { fontSize: 11, color: '#BDBDBD', marginTop: 6 },
  diaryEmpty: { paddingVertical: 8 },
  diaryEmptyText: { fontSize: 13, color: '#BDBDBD', lineHeight: 19 },

  // Quick Actions
  actionsWrap: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  assessBtn: { borderColor: '#FF9800', backgroundColor: '#FFF8F0' },
  quickBtnIcon: { fontSize: 24 },
  quickBtnTitle: { fontSize: 14, fontWeight: '700', color: '#212121' },
  quickBtnSub: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },

  startBtn: {
    backgroundColor: '#E8EAF6', marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#1A237E' },
});

// ─── Diary Editor Styles ───

const de = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  cancel: { fontSize: 15, color: '#757575', fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  save: { fontSize: 15, color: '#1A237E', fontWeight: '700' },
  saveDisabled: { color: '#BDBDBD' },

  body: { padding: 20, paddingBottom: 40 },
  dateLabel: { fontSize: 15, fontWeight: '700', color: '#1A237E', marginBottom: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#616161', marginBottom: 8, marginTop: 16 },

  moodRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  moodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  moodBtnActive: { borderColor: '#1A237E', backgroundColor: '#E8EAF6' },
  moodEmoji: { fontSize: 22, marginBottom: 2 },
  moodLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  moodLabelActive: { color: '#1A237E' },

  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    fontSize: 15, color: '#212121', lineHeight: 22,
    borderWidth: 1, borderColor: '#E0E0E0', minHeight: 100,
  },
  inputSmall: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    fontSize: 15, color: '#212121', lineHeight: 22,
    borderWidth: 1, borderColor: '#E0E0E0', minHeight: 72,
  },
});
