import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTestContext } from '../context/TestContext';
import OptionButton from '../components/OptionButton';
import type { HomeTabParamList } from '../navigation/AppNavigator';
import type { Question, Answer } from '../types';

type Nav = StackNavigationProp<HomeTabParamList>;

const optionLabels = ['A', 'B', 'C', 'D'];

function ListFooter({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.doneBtn} onPress={onPress}>
      <Text style={styles.doneBtnText}>Back to Home</Text>
    </TouchableOpacity>
  );
}

function ReviewCard({
  question, index, userAnswer,
}: {
  question: Question; index: number; userAnswer: Answer | undefined;
}) {
  const isCorrect = userAnswer?.selectedOptionId === question.correctOptionId;
  const isAnswered = userAnswer?.selectedOptionId != null;

  return (
    <View style={styles.questionBlock}>
      <View style={styles.qHeader}>
        <Text style={styles.qNumber}>
          Q{index + 1} · Part {question.part}
        </Text>
        {isAnswered ? (
          <View style={[styles.resultBadge, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            <Text style={styles.resultText}>{isCorrect ? '✓ Correct' : '✗ Wrong'}</Text>
          </View>
        ) : (
          <View style={styles.resultSkipped}>
            <Text style={styles.skippedText}>Skipped</Text>
          </View>
        )}
      </View>

      <Text style={styles.qPrompt}>{question.prompt}</Text>

      {question.options.map((opt, optIdx) => (
        <OptionButton
          key={opt.id}
          optionId={opt.id}
          label={optionLabels[optIdx] ?? String(optIdx)}
          text={opt.text}
          isSelected={userAnswer?.selectedOptionId === opt.id}
          isCorrect={opt.id === question.correctOptionId}
          isRevealed
          onSelect={() => {}}
          disabled
        />
      ))}

      {question.transcript ? (
        <View style={styles.transcript}>
          <Text style={styles.transcriptLabel}>📝 Transcript</Text>
          <Text style={styles.transcriptText}>{question.transcript}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { state, dispatch } = useTestContext();
  const { questions, session } = state;

  const answerMap = useMemo(
    () => new Map(session?.answers.map((a) => [a.questionId, a]) ?? []),
    [session?.answers],
  );

  const handleGoHome = () => {
    dispatch({ type: 'RESET' });
    navigation.popToTop();
  };

  if (!session?.isCompleted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Please complete the test first</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Score</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Answer Review</Text>
        <View style={{ width: 80 }} />
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReviewCard question={item} index={index} userAnswer={answerMap.get(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<ListFooter onPress={handleGoHome} />}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9E9E9E' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#212121' },
  questionBlock: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    padding: 18, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  qNumber: { fontSize: 14, fontWeight: '600', color: '#757575' },
  resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resultCorrect: { backgroundColor: '#E8F5E9' },
  resultWrong: { backgroundColor: '#FFEBEE' },
  resultText: { fontSize: 13, fontWeight: '700' },
  resultSkipped: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F5F5F5' },
  skippedText: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  qPrompt: { fontSize: 15, color: '#212121', lineHeight: 22, marginBottom: 12, fontWeight: '500' },
  transcript: { backgroundColor: '#F3E5F5', padding: 14, borderRadius: 10, marginTop: 12 },
  transcriptLabel: { fontSize: 12, color: '#7B1FA2', fontWeight: '600', marginBottom: 6 },
  transcriptText: { fontSize: 14, color: '#424242', lineHeight: 22 },
  listContent: { paddingBottom: 40 },
  doneBtn: {
    marginHorizontal: 16, marginTop: 24, backgroundColor: '#1976D2',
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
});
