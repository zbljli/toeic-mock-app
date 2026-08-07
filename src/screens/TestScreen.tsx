import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTestContext, getCurrentQuestion, getAnswerForQuestion, getAnsweredCount } from '../context/TestContext';

import QuestionCard from '../components/QuestionCard';
import OptionButton from '../components/OptionButton';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import AudioPlayer from '../components/AudioPlayer';
import AnswerSheet from '../components/AnswerSheet';
import PartTransition from '../components/PartTransition';
import { TOEIC_PARTS } from '../data/toeicStructure';
import { calculateScore } from '../utils/scoring';
import { generateQuestions } from '../data/questions';
import { appendHistoryEntry, saveInProgress, loadInProgress, clearInProgress, type PersistedHistoryEntry, type InProgressSnapshot } from '../utils/storage';
import type { HomeTabParamList } from '../navigation/AppNavigator';
import type { Answer } from '../types';

type Nav = StackNavigationProp<HomeTabParamList>;
type TestRoute = RouteProp<HomeTabParamList, 'Test'>;

export default function TestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TestRoute>();
  const { config } = route.params;
  const { state, dispatch } = useTestContext();

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(config.totalTimeMinutes * 60);

  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showPartTransition, setShowPartTransition] = useState(false);
  const [transitionPart, setTransitionPart] = useState<number | null>(null);
  const prevPartRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const submittingRef = useRef(false); // prevent double-submit
  const alertRef = useRef(false); // prevent overlapping Alert dialogs

  // 初始化考试
  useEffect(() => {
    // Prevent double initialization in React StrictMode / dev reloads
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      // ── Recovery check ──
      const snapshot = await loadInProgress();
      if (snapshot && snapshot.mode === config.mode) {
        // Only recover if the mode matches the current config
        alertRef.current = true;
        // Small delay so the component renders before the Alert
        await new Promise(r => setTimeout(r, 300));
        Alert.alert(
          'Resume Exam',
          'You have an unfinished exam. Continue where you left off?',
          [
            {
              text: 'Start New',
              style: 'destructive',
              onPress: () => {
                alertRef.current = false;
                clearInProgress();
                startNewTest();
              },
            },
            {
              text: 'Resume',
              onPress: () => {
                alertRef.current = false;
                restoreTest(snapshot);
              },
            },
          ],
        );
      } else {
        // No matching recovery — clean up any stale snapshot
        if (snapshot) clearInProgress();
        startNewTest();
      }
    };

    const startNewTest = () => {
      const questions = generateQuestions(config.parts, config.totalQuestions);
      dispatch({ type: 'LOAD_QUESTIONS', questions });
      dispatch({
        type: 'START_TEST',
        mode: config.mode,
        sessionId: `test-${Date.now()}`,
      });
      setTotalSeconds(config.totalTimeMinutes * 60);
      setIsTimerRunning(true);
    };

    const restoreTest = (snapshot: InProgressSnapshot) => {
      const questions = generateQuestions(snapshot.parts, snapshot.totalQuestions);
      dispatch({ type: 'LOAD_QUESTIONS', questions });
      dispatch({
        type: 'RESTORE_SESSION',
        session: {
          id: snapshot.sessionId,
          startedAt: snapshot.startedAt,
          mode: snapshot.mode,
          currentQuestionIndex: snapshot.currentQuestionIndex,
          answers: snapshot.answers.map(a => ({
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            timeSpent: 0,
          })),
          partTimeRemaining: {},
          isCompleted: false,
          isScored: false,
        },
      });
      const remaining = Math.max(0, snapshot.totalTimeMinutes * 60 - snapshot.elapsedSeconds);
      setTotalSeconds(remaining);
      setIsTimerRunning(true);
    };

    init();
  }, [config, dispatch]);

  // ── Auto-save progress on each answer / navigation ──
  useEffect(() => {
    if (!state.session || state.session.isCompleted) return;
    const snapshot: InProgressSnapshot = {
      sessionId: state.session.id,
      mode: state.session.mode,
      modeLabel: config.mode === 'listening-only' ? 'Full Listening Test' : 'Part Practice',
      startedAt: state.session.startedAt,
      currentQuestionIndex: state.session.currentQuestionIndex,
      answers: state.session.answers
        .filter(a => a.selectedOptionId !== null)
        .map(a => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId! })),
      parts: config.parts,
      totalQuestions: state.questions.length,
      totalTimeMinutes: config.totalTimeMinutes,
      elapsedSeconds: config.totalTimeMinutes * 60 - totalSeconds,
    };
    saveInProgress(snapshot);
  }, [state.session?.answers, state.session?.currentQuestionIndex]);

  const currentQuestion = getCurrentQuestion(state);
  const answeredCount = getAnsweredCount(state);
  const totalQuestions = state.questions.length;

  // Android 返回键拦截 — 考试中按返回键弹出确认对话框
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (alertRef.current) return true;
      if (answeredCount > 0) {
        alertRef.current = true;
        Alert.alert('Exit Test', 'Your progress will be lost. Are you sure?', [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => { alertRef.current = false; },
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              alertRef.current = false;
              dispatch({ type: 'RESET' });
              navigation.goBack();
            },
          },
        ]);
      } else {
        dispatch({ type: 'RESET' });
        navigation.goBack();
      }
      return true;
    });

    return () => subscription.remove();
  }, [answeredCount, dispatch, navigation]);

  const currentAnswer = currentQuestion
    ? getAnswerForQuestion(state, currentQuestion.id)
    : undefined;

  const partInfo = currentQuestion
    ? TOEIC_PARTS.find((p) => p.part === currentQuestion.part)
    : null;

  // Part 切换检测 — 显示过渡提示
  useEffect(() => {
    if (currentQuestion && prevPartRef.current !== null && currentQuestion.part !== prevPartRef.current) {
      setTransitionPart(currentQuestion.part);
      setShowPartTransition(true);
    }
    if (currentQuestion) {
      prevPartRef.current = currentQuestion.part;
    }
  }, [currentQuestion?.part]);

  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      const answer: Answer = {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        timeSpent: 0,
      };
      dispatch({ type: 'ANSWER_QUESTION', answer });
    },
    [currentQuestion, dispatch],
  );

  const handleNext = () => {
    if (!state.session) return;
    if (state.session.currentQuestionIndex >= totalQuestions - 1) {
      if (alertRef.current) return;
      const unanswered = totalQuestions - answeredCount;
      alertRef.current = true;
      Alert.alert(
        'Submit Test',
        unanswered > 0
          ? `${unanswered} question(s) unanswered. Submit anyway?`
          : 'All questions answered. Submit now?',
        [
          {
            text: 'Continue',
            style: 'cancel',
            onPress: () => { alertRef.current = false; },
          },
          {
            text: 'Submit',
            style: 'destructive',
            onPress: () => {
              alertRef.current = false;
              handleSubmit();
            },
          },
        ],
      );
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_QUESTION' });
  };

  const handleGoToQuestion = (index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', index });
  };

  const handleSubmit = () => {
    if (submittingRef.current) return; // prevent double submit
    submittingRef.current = true;
    setIsTimerRunning(false);
    clearInProgress(); // clear auto-saved progress
    const result = calculateScore(state.session?.answers ?? [], state.questions);
    dispatch({ type: 'COMPLETE_TEST', result });

    // Persist to AsyncStorage
    if (state.session) {
      const answeredCount = state.session.answers.filter((a) => a.selectedOptionId !== null).length;
      const modeLabels: Record<string, string> = {
        'listening-only': 'Full Listening Test',
        'part-practice': 'Part Practice',
      };
      const entry: PersistedHistoryEntry = {
        sessionId: state.session.id,
        mode: state.session.mode,
        modeLabel: modeLabels[state.session.mode] ?? state.session.mode,
        startedAt: state.session.startedAt,
        isCompleted: true,
        totalQuestions: state.questions.length,
        answeredCount,
        result,
      };
      appendHistoryEntry(entry);
    }

    (navigation as any).replace('Result');
  };

  const handleTimeUp = () => {
    if (alertRef.current || submittingRef.current) return;
    alertRef.current = true;
    Alert.alert('Time\'s Up', 'The test time has expired. Your answers will be submitted automatically.', [{
      text: 'OK',
      onPress: () => {
        alertRef.current = false;
        handleSubmit();
      },
    }]);
  };

  const handleExit = () => {
    if (answeredCount > 0) {
      if (alertRef.current) return;
      alertRef.current = true;
      Alert.alert('Exit Test', 'Your progress will be lost. Are you sure?', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { alertRef.current = false; },
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            alertRef.current = false;
            clearInProgress();
            dispatch({ type: 'RESET' });
            navigation.goBack();
          },
        },
      ]);
    } else {
      clearInProgress();
      dispatch({ type: 'RESET' });
      navigation.goBack();
    }
  };

  if (!currentQuestion || !state.session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 组装听力朗读文本
  let speechText = '';
  if (currentQuestion.type === 'listening') {
    if (currentQuestion.transcript) {
      speechText = currentQuestion.transcript;
    } else if (currentQuestion.passage) {
      speechText = currentQuestion.passage + '. ' + currentQuestion.prompt;
    } else {
      speechText = currentQuestion.prompt;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.timerGroup}>
          <Timer
            seconds={totalSeconds}
            isRunning={isTimerRunning}
            onTimeUp={handleTimeUp}
          />
        </View>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* 进度条 */}
      <ProgressBar
        current={state.session.currentQuestionIndex + 1}
        total={totalQuestions}
        answeredCount={answeredCount}
      />

      {/* Part 过渡提示 */}
      {showPartTransition && transitionPart && (
        <PartTransition
          part={transitionPart}
          partTitle={TOEIC_PARTS.find((p) => p.part === transitionPart)?.title ?? ''}
          partType={TOEIC_PARTS.find((p) => p.part === transitionPart)?.type ?? 'reading'}
          onDismiss={() => setShowPartTransition(false)}
        />
      )}

      {/* 题目内容 */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          part={currentQuestion.part}
          partTitle={partInfo?.title ?? ''}
          prompt={currentQuestion.prompt}
          passage={currentQuestion.passage}
          imageUrl={currentQuestion.imageUrl}
          displayMode={currentQuestion.part === 1 ? 'photo' : 'text'}
          questionNumber={state.session.currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          hidePassage={config.mode === 'listening-only'}
        />

        {/* Audio Player */}
        {currentQuestion.type === 'listening' && (
          <AudioPlayer
            audioScript={currentQuestion.audioScript}
            speechText={speechText}
            autoPlay
            maxPlays={config.mode === 'listening-only' ? 1 : undefined}
          />
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((opt, idx) => (
            <OptionButton
              key={opt.id}
              optionId={opt.id}
              label={optionLabels[idx] ?? String(idx)}
              text={opt.text}
              isSelected={currentAnswer?.selectedOptionId === opt.id}
              onSelect={handleSelectOption}
            />
          ))}
        </View>
      </ScrollView>

      {/* 底部导航按钮 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navBtn, state.session.currentQuestionIndex === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={state.session.currentQuestionIndex === 0}
        >
          <Text
            style={[
              styles.navBtnText,
              state.session.currentQuestionIndex === 0 && styles.navBtnTextDisabled,
            ]}
          >
            ← Prev
          </Text>
        </TouchableOpacity>

        {/* Answer Sheet button */}
        <TouchableOpacity
          style={styles.answerSheetBtn}
          onPress={() => setShowAnswerSheet(true)}
        >
          <Text style={styles.answerSheetBtnText}>
            {answeredCount}/{totalQuestions}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>
            {state.session.currentQuestionIndex >= totalQuestions - 1
              ? 'Submit'
              : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 答题卡 Modal */}
      <AnswerSheet
        visible={showAnswerSheet}
        onClose={() => setShowAnswerSheet(false)}
        session={state.session}
        questions={state.questions}
        onGoToQuestion={handleGoToQuestion}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEEEEE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
  },
  // === Top Bar ===
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1A237E',
  },
  exitBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  exitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timerGroup: {
    alignItems: 'center',
  },
  phaseBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  phaseBadgeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // === Scroll ===
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // === Options ===
  optionsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  optionsTitle: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 8,
  },
  // === Bottom Nav ===
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  navBtnDisabled: {
    backgroundColor: '#FAFAFA',
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  navBtnTextDisabled: {
    color: '#BDBDBD',
  },
  nextBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1A237E',
  },
  answerSheetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  answerSheetBtnText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '700',
  },
});
