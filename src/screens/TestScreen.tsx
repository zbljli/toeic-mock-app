import React, { useEffect, useState, useCallback } from 'react';
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
import { TOEIC_PARTS } from '../data/toeicStructure';
import { calculateScore } from '../utils/scoring';
import { generateQuestions } from '../data/questions';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Question, Answer, TestMode } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type TestRoute = RouteProp<RootStackParamList, 'Test'>;

export default function TestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TestRoute>();
  const { config } = route.params;
  const { state, dispatch } = useTestContext();

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(config.totalTimeMinutes * 60);

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

  // 选项标签
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
      // 已经是最后一题，确认交卷
      Alert.alert(
        '交卷确认',
        `你已答完 ${answeredCount}/${totalQuestions} 题，确定提交吗？`,
        [
          { text: '继续做题', style: 'cancel' },
          { text: '提交', onPress: handleSubmit },
        ],
      );
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_QUESTION' });
  };

  const handleSubmit = () => {
    setIsTimerRunning(false);
    const result = calculateScore(state.session?.answers ?? [], state.questions);
    dispatch({ type: 'COMPLETE_TEST', result });
    navigation.replace('Result');
  };

  const handleTimeUp = () => {
    Alert.alert('时间到', '考试时间已结束，系统将自动交卷。', [
      { text: '确认', onPress: handleSubmit },
    ]);
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* 顶部栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕ 退出</Text>
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

      {/* 题目内容 */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <QuestionCard
          part={currentQuestion.part}
          partTitle={partInfo?.titleZh ?? ''}
          prompt={currentQuestion.prompt}
          passage={currentQuestion.passage}
          imageUrl={currentQuestion.imageUrl}
          questionNumber={state.session.currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />

        {/* 听力音频播放器 */}
        {currentQuestion.type === 'listening' && (
          <AudioPlayer audioUrl={currentQuestion.audioUrl} />
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
          style={[styles.navBtn, styles.prevBtn]}
          onPress={handlePrev}
          disabled={state.session.currentQuestionIndex === 0}
        >
          <Text
            style={[
              styles.navText,
              state.session.currentQuestionIndex === 0 && styles.navTextDisabled,
            ]}
          >
            ← 上一题
          </Text>
        </TouchableOpacity>

        {/* 答题卡跳转 */}
        <TouchableOpacity style={styles.answerSheetBtn}>
          <Text style={styles.answerSheetText}>
            📋 {answeredCount}/{totalQuestions}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext}>
          <Text style={styles.navText}>
            {state.session.currentQuestionIndex >= totalQuestions - 1
              ? '提交 ✓'
              : '下一题 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  exitText: {
    fontSize: 15,
    color: '#F44336',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  audioNotice: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  audioText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  optionsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  optionsTitle: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  prevBtn: {
    backgroundColor: '#F5F5F5',
  },
  nextBtn: {
    backgroundColor: '#1976D2',
  },
  navText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navTextDisabled: {
    color: '#BDBDBD',
  },
  answerSheetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  answerSheetText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '600',
  },
});
