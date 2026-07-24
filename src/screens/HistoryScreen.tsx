import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTestContext } from '../context/TestContext';
import type { HomeTabParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<HomeTabParamList>;

function getScoreColor(score: number): string {
  if (score >= 785) return '#4CAF50';
  if (score >= 605) return '#2196F3';
  if (score >= 405) return '#FF9800';
  return '#F44336';
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useTestContext();
  const { history } = state;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 60 }} />
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Records Yet</Text>
          <Text style={styles.emptyDesc}>Complete a mock test and your{'\n'}score will be saved here.</Text>
        </View>
      ) : (
        <FlatList
          data={[...history].reverse()}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const date = new Date(item.startedAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const hasScore = item.result !== null;

            return (
              <View style={styles.card}>
                {/* Header: # + mode + status */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIdx}>#{history.length - index}</Text>
                  <Text style={styles.cardMode}>{item.modeLabel}</Text>
                  {item.isCompleted ? (
                    <View style={styles.badgeCompleted}>
                      <Text style={styles.badgeText}>Done</Text>
                    </View>
                  ) : (
                    <View style={styles.badgePending}>
                      <Text style={styles.badgeText}>Incomplete</Text>
                    </View>
                  )}
                </View>

                {/* Score row */}
                {hasScore ? (
                  <View style={styles.scoreRow}>
                    <Text
                      style={[
                        styles.scoreValue,
                        { color: getScoreColor(item.result!.totalScore) },
                      ]}
                    >
                      {item.result!.totalScore}
                    </Text>
                    <View style={styles.scoreBreakdown}>
                      <Text style={styles.sectionScore}>
                        🎧 Listening: {item.result!.listeningScore}/495
                      </Text>
                      <Text style={styles.sectionScore}>
                        📖 Reading: {item.result!.readingScore}/495
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <Text style={styles.cardDate}>
                    {dateStr} {timeStr}
                  </Text>
                  {hasScore && (
                    <Text style={styles.answeredInfo}>
                      {item.answeredCount}/{item.totalQuestions} answered
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIdx: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1976D2',
    marginRight: 10,
  },
  cardMode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  badgeCompleted: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#424242',
  },
  cardDate: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 14,
  },
  scoreBreakdown: {
    flex: 1,
  },
  sectionScore: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answeredInfo: {
    fontSize: 12,
    color: '#9E9E9E',
  },
});
