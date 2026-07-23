import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
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
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Answer } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type TestRoute = RouteProp<RootStackParamList, 'Test'>;

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

  // 初始化考试
  useEffect(() => {
    const questions = generateQuestions(config.parts, config.totalQuestions);
    dispatch({ type: 'LOAD_QUESTIONS', questions });
    dispatch({
      type: 'START_TEST',
      mode: config.mode,
      sessionId: `test-${Date.now()}`,
    });
    setTotalSeconds(config.totalTimeMinutes * 60);
    setIsTimerRunning(true);
  }, []);

  const currentQuestion = getCurrentQuestion(state);
  const answeredCount = getAnsweredCount(state);
  const totalQuestions = state.questions.length;

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
    if (state.session && state.session.currentQuestionIndex >= totalQuestions - 1) {
      const unanswered = totalQuestions - answeredCount;
      Alert.alert(
        '交卷确认',
        unanswered > 0
          ? `还有 ${unanswered} 题未作答，确定提交吗？`
          : `已全部作答，确定提交吗？`,
        [
          { text: '继续做题', style: 'cancel' },
          {
            text: '提交',
            style: 'destructive',
            onPress: handleSubmit,
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
    setIsTimerRunning(false);
    const result = calculateScore(state.session?.answers ?? [], state.questions);
    dispatch({ type: 'COMPLETE_TEST', result });
    navigation.replace('Result');
  };

  const handleTimeUp = () => {
    Alert.alert('⏰ 时间到', '考试时间已结束，系统将自动交卷。', [
      { text: '确认', onPress: handleSubmit },
    ]);
  };

  const handleExit = () => {
    if (answeredCount > 0) {
      Alert.alert('确认退出', '退出后当前答题进度将丢失，确定退出吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET' });
            navigation.goBack();
          },
        },
      ]);
    } else {
      dispatch({ type: 'RESET' });
      navigation.goBack();
    }
  };

  if (!currentQuestion || !state.session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载题目中...</Text>
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
        <Timer
          seconds={totalSeconds}
          isRunning={isTimerRunning}
          onTimeUp={handleTimeUp}
        />
        <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
          <Text style={styles.submitText}>交卷</Text>
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
          partTitle={TOEIC_PARTS.find((p) => p.part === transitionPart)?.titleZh ?? ''}
          partType={TOEIC_PARTS.find((p) => p.part === transitionPart)?.type ?? 'reading'}
          onDismiss={() => setShowPartTransition(false)}
        />
      )}

      {/* 题目内容 */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          part={currentQuestion.part}
          partTitle={partInfo?.titleZh ?? ''}
          prompt={currentQuestion.prompt}
          passage={currentQuestion.passage}
          imageUrl={currentQuestion.imageUrl}
          displayMode={currentQuestion.part === 1 ? 'photo' : 'text'}
          questionNumber={state.session.currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />

        {/* 听力音频播放器 */}
        {currentQuestion.type === 'listening' && (
          <AudioPlayer
            speechText={speechText}
            label={`Part ${currentQuestion.part} · ${partInfo?.titleZh ?? ''}`}
            autoPlay
          />
        )}

        {/* 选项 */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>选择答案</Text>
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
            ← 上一题
          </Text>
        </TouchableOpacity>

        {/* 答题卡按钮 */}
        <TouchableOpacity
          style={styles.answerSheetBtn}
          onPress={() => setShowAnswerSheet(true)}
        >
          <Text style={styles.answerSheetBtnText}>
            📋 {answeredCount}/{totalQuestions}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.navBtnText}>
            {state.session.currentQuestionIndex >= totalQuestions - 1
              ? '提交 ✓'
              : '下一题 →'}
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
