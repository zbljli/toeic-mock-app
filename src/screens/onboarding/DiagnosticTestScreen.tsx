import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useCoach } from '../../context/CoachContext';
import AudioPlayer from '../../components/AudioPlayer';
import QuestionCard from '../../components/QuestionCard';
import OptionButton from '../../components/OptionButton';
import ProgressBar from '../../components/ProgressBar';
import { generateQuestions } from '../../data/questions';
import { estimateListeningScore, estimateAccuracyFromScore, diagnose } from '../../engines/diagnosisEngine';
import { generateRecommendation } from '../../engines/recommendationEngine';
import type { Question, Answer } from '../../types';
import type { ToeicPart } from '../../types';
import type { AssessmentResult } from '../../types/coach';

const DIAGNOSTIC_COUNT = 20; // total questions for diagnostic
const DIAGNOSTIC_PARTS: ToeicPart[] = [1, 2, 3, 4];

export default function DiagnosticTestScreen() {
  const { setOnboardingStage, saveAssessment, saveAbilityProfile, saveRecommendation, userGoal, refreshDailyTasks } = useCoach();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const qs = generateQuestions(DIAGNOSTIC_PARTS, DIAGNOSTIC_COUNT);
    setQuestions(qs);
    setLoading(false);
  }, []);

  const currentQuestion = questions[currentIdx] ?? null;
  const answeredCount = Object.values(answers).filter(Boolean).length;

  const handleSelectOption = useCallback((optionId: string) => {
    if (!currentQuestion || submitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
  }, [currentQuestion, submitted]);

  const handleSubmit = useCallback(async () => {
    if (!userGoal || submitted) return;
    setSubmitted(true);

    // Calculate scores per part
    const rawCorrect: Partial<Record<ToeicPart, number>> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const rawTotal: Partial<Record<ToeicPart, number>> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const q of questions) {
      rawTotal[q.part] = (rawTotal[q.part] ?? 0) + 1;
      if (answers[q.id] === q.correctOptionId) {
        rawCorrect[q.part] = (rawCorrect[q.part] ?? 0) + 1;
      }
    }

    const totalCorrect = Object.values(rawCorrect).reduce((a, b) => a + b, 0);
    const listeningScore = estimateListeningScore(totalCorrect, DIAGNOSTIC_COUNT);
    const partScores = estimateAccuracyFromScore(rawCorrect, rawTotal);

    const assessment: AssessmentResult = {
      id: `diag_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      totalScore: listeningScore,
      partScores,
      completedAt: new Date().toISOString(),
    };

    await saveAssessment(assessment);

    const diagnosis = diagnose(assessment);
    await saveAbilityProfile(diagnosis.profile);

    const rec = generateRecommendation(diagnosis.profile, userGoal);
    await saveRecommendation(rec);
    await refreshDailyTasks();

    setOnboardingStage('diagnosis_report');
  }, [userGoal, submitted, questions, answers, saveAssessment, saveAbilityProfile, saveRecommendation, setOnboardingStage, refreshDailyTasks]);

  const handleSkip = useCallback(() => {
    setOnboardingStage('completed');
  }, [setOnboardingStage]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><Text style={s.loading}>Loading assessment...</Text></View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loading}>No questions available</Text>
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
            <Text style={s.submitText}>View Results</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Build speech text
  let speechText = '';
  if (currentQuestion.type === 'listening') {
    if (currentQuestion.transcript) speechText = currentQuestion.transcript;
    else if (currentQuestion.passage) speechText = currentQuestion.passage + '. ' + currentQuestion.prompt;
    else speechText = currentQuestion.prompt;
  }

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Listening Assessment</Text>
        <Text style={s.headerSub}>20 questions · about 10 minutes</Text>
      </View>

      <ProgressBar current={currentIdx + 1} total={questions.length} answeredCount={answeredCount} />

      <View style={s.scrollContent}>
        <QuestionCard
          part={currentQuestion.part}
          partTitle=""
          prompt={currentQuestion.prompt}
          passage={currentQuestion.passage}
          imageUrl={currentQuestion.imageUrl}
          displayMode={currentQuestion.part === 1 ? 'photo' : 'text'}
          questionNumber={currentIdx + 1}
          totalQuestions={questions.length}
          hidePassage
        />

        {currentQuestion.type === 'listening' && (
          <AudioPlayer
            audioScript={currentQuestion.audioScript}
            speechText={speechText}
            autoPlay
          />
        )}

        {/* Options */}
        <View style={s.optsContainer}>
          {currentQuestion.options.map((opt, idx) => (
            <OptionButton
              key={opt.id}
              optionId={opt.id}
              label={optionLabels[idx] ?? String(idx)}
              text={opt.text}
              isSelected={answers[currentQuestion.id] === opt.id}
              onSelect={handleSelectOption}
            />
          ))}
        </View>
      </View>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity
          style={[s.navBtn, currentIdx === 0 && s.navDisabled]}
          onPress={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <Text style={[s.navText, currentIdx === 0 && s.navTextDisabled]}>← Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.progressBtn} onPress={handleSubmit}>
          <Text style={s.progressText}>{answeredCount}/{questions.length}</Text>
        </TouchableOpacity>

        {currentIdx < questions.length - 1 ? (
          <TouchableOpacity style={s.navBtnPrimary} onPress={() => setCurrentIdx(i => i + 1)}>
            <Text style={s.navTextPrimary}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
            <Text style={s.submitText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Skip option */}
      <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.6}>
        <Text style={s.skipText}>Skip for now — I'll take it later</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEEEEE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loading: { fontSize: 16, color: '#757575' },
  header: {
    backgroundColor: '#1A237E', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scrollContent: { flex: 1, paddingBottom: 16 },

  optsContainer: { marginHorizontal: 16, marginTop: 20 },

  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  navBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F5F5F5' },
  navDisabled: { backgroundColor: '#FAFAFA' },
  navText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  navTextDisabled: { color: '#BDBDBD' },
  navBtnPrimary: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1A237E' },
  navTextPrimary: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  progressBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#E3F2FD' },
  progressText: { fontSize: 14, color: '#1565C0', fontWeight: '700' },
  submitBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#4CAF50' },
  submitText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipText: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
});
