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
import { getScoreLevel } from '../utils/scoring';
import { TOEIC_PARTS } from '../data/toeicStructure';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { ToeicPart } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const { state, dispatch } = useTestContext();
  const { result } = state;

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>暂无成绩数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  const level = getScoreLevel(result.totalScore);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 总分展示 */}
        <View style={styles.scoreHero}>
          <Text style={styles.scoreLabel}>你的 TOEIC 分数</Text>
          <Text style={styles.totalScore}>{result.totalScore}</Text>
          <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
            <Text style={styles.levelText}>{level.level}</Text>
          </View>
          <Text style={styles.levelDesc}>{level.description}</Text>
        </View>

        {/* Listening & Reading 分项 */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionIcon}>🎧</Text>
            <Text style={styles.sectionTitle}>Listening</Text>
            <Text style={styles.sectionScore}>{result.listeningScore}</Text>
            <Text style={styles.sectionRange}>/ 495</Text>
          </View>
          <View style={styles.sectionDivider} />
          <View style={styles.sectionCard}>
            <Text style={styles.sectionIcon}>📖</Text>
            <Text style={styles.sectionTitle}>Reading</Text>
            <Text style={styles.sectionScore}>{result.readingScore}</Text>
            <Text style={styles.sectionRange}>/ 495</Text>
          </View>
        </View>

        {/* 各 Part 正确率 */}
        <Text style={styles.detailTitle}>各 Part 表现</Text>
        {TOEIC_PARTS.map((part) => {
          const correct = result.correctByPart[part.part] ?? 0;
          const total = result.totalByPart[part.part] ?? 0;
          const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

          if (total === 0) return null;

          return (
            <View key={part.part} style={styles.partRow}>
              <View style={styles.partLeft}>
                <Text style={styles.partLabel}>
                  Part {part.part} - {part.titleZh}
                </Text>
                <View style={styles.partBarBg}>
                  <View
                    style={[
                      styles.partBarFill,
                      { width: `${rate}%` },
                      rate >= 80
                        ? styles.barGood
                        : rate >= 60
                          ? styles.barMid
                          : styles.barLow,
                    ]}
                  />
                </View>
              </View>
              <View style={styles.partRight}>
                <Text style={styles.partCorrect}>
                  {correct}/{total}
                </Text>
                <Text style={styles.partRate}>{rate}%</Text>
              </View>
            </View>
          );
        })}

        {/* 操作按钮 */}
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Review')}
        >
          <Text style={styles.reviewBtnText}>🔍 查看答案解析</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => {
            dispatch({ type: 'RESET' });
            navigation.popToTop();
          }}
        >
          <Text style={styles.homeBtnText}>返回首页</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
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
  content: {
    paddingBottom: 32,
  },
  scoreHero: {
    backgroundColor: '#1976D2',
    alignItems: 'center',
    paddingVertical: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scoreLabel: {
    fontSize: 15,
    color: '#BBDEFB',
    fontWeight: '600',
  },
  totalScore: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    lineHeight: 72,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelDesc: {
    fontSize: 13,
    color: '#90CAF9',
    marginTop: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCard: {
    flex: 1,
    alignItems: 'center',
  },
  sectionDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },
  sectionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '600',
  },
  sectionScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#212121',
    marginTop: 4,
  },
  sectionRange: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 14,
    borderRadius: 12,
  },
  partLeft: {
    flex: 1,
    marginRight: 12,
  },
  partLabel: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '600',
    marginBottom: 6,
  },
  partBarBg: {
    height: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  partBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  barGood: {
    backgroundColor: '#4CAF50',
  },
  barMid: {
    backgroundColor: '#FF9800',
  },
  barLow: {
    backgroundColor: '#F44336',
  },
  partRight: {
    alignItems: 'flex-end',
  },
  partCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  partRate: {
    fontSize: 13,
    color: '#757575',
  },
  reviewBtn: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  reviewBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  homeBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  homeBtnText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
