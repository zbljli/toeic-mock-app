import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTestContext } from '../context/TestContext';
import OptionButton from '../components/OptionButton';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const optionLabels = ['A', 'B', 'C', 'D'];

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { state, dispatch } = useTestContext();
  const { questions, session } = state;

  if (!session?.isCompleted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>请先完成考试</Text>
        </View>
      </SafeAreaView>
    );
  }

  const answerMap = new Map(
    session.answers.map((a) => [a.questionId, a]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回成绩</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>答案解析</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {questions.map((q, idx) => {
          const userAnswer = answerMap.get(q.id);
          const isCorrect =
            userAnswer?.selectedOptionId === q.correctOptionId;
          const isAnswered = userAnswer?.selectedOptionId != null;

          return (
            <View key={q.id} style={styles.questionBlock}>
              {/* 题号 & 结果 */}
              <View style={styles.qHeader}>
                <Text style={styles.qNumber}>
                  第 {idx + 1} 题 · Part {q.part}
                </Text>
                {isAnswered ? (
                  <View
                    style={[
                      styles.resultBadge,
                      isCorrect ? styles.resultCorrect : styles.resultWrong,
                    ]}
                  >
                    <Text style={styles.resultText}>
                      {isCorrect ? '✓ 正确' : '✗ 错误'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.resultSkipped}>
                    <Text style={styles.skippedText}>未作答</Text>
                  </View>
                )}
              </View>

              {/* 题干 */}
              <Text style={styles.qPrompt}>{q.prompt}</Text>

              {/* 选项 */}
              {q.options.map((opt, optIdx) => (
                <OptionButton
                  key={opt.id}
                  optionId={opt.id}
                  label={optionLabels[optIdx] ?? String(optIdx)}
                  text={opt.text}
                  isSelected={userAnswer?.selectedOptionId === opt.id}
                  isCorrect={opt.id === q.correctOptionId}
                  isRevealed
                  onSelect={() => {}}
                  disabled
                />
              ))}

              {/* 听力文本 */}
              {q.transcript && (
                <View style={styles.transcript}>
                  <Text style={styles.transcriptLabel}>📝 听力文本</Text>
                  <Text style={styles.transcriptText}>{q.transcript}</Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            dispatch({ type: 'RESET' });
            navigation.popToTop();
          }}
        >
          <Text style={styles.doneBtnText}>返回首页</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backText: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    paddingBottom: 40,
  },
  questionBlock: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultCorrect: {
    backgroundColor: '#E8F5E9',
  },
  resultWrong: {
    backgroundColor: '#FFEBEE',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultSkipped: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  skippedText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  qPrompt: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
  },
  transcript: {
    backgroundColor: '#F3E5F5',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#7B1FA2',
    fontWeight: '600',
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
