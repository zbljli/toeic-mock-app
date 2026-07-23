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
import { TEST_MODES, getPartPracticeConfigs, TOEIC_PARTS } from '../data/toeicStructure';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { TestModeConfig } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const partPractices = getPartPracticeConfigs();

  const handleStart = (config: TestModeConfig) => {
    navigation.navigate('Test', { config });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📝 TOEIC 模拟考</Text>
          <Text style={styles.subtitle}>
            Listening & Reading Test{'\n'}全真模拟 · 智能评分
          </Text>
        </View>

        {/* 完整模考 */}
        <Text style={styles.sectionTitle}>🎯 模拟考试</Text>
        {TEST_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.mode}
            style={styles.modeCard}
            onPress={() => handleStart(mode)}
            activeOpacity={0.8}
          >
            <View style={styles.modeHeader}>
              <Text style={styles.modeLabel}>{mode.label}</Text>
              <Text style={styles.modeTime}>⏱ {mode.totalTimeMinutes} min</Text>
            </View>
            <Text style={styles.modeDesc}>{mode.description}</Text>
            <View style={styles.modeFooter}>
              <Text style={styles.modeQuestions}>{mode.totalQuestions} 题</Text>
              <Text style={styles.startBtn}>开始 →</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* 单 Part 练习 */}
        <Text style={styles.sectionTitle}>🔍 分 Part 练习</Text>
        {partPractices.map((config, idx) => {
          const partInfo = TOEIC_PARTS[idx];
          return (
            <TouchableOpacity
              key={`part-${partInfo.part}`}
              style={[
                styles.partCard,
                partInfo.type === 'listening'
                  ? styles.listeningCard
                  : styles.readingCard,
              ]}
              onPress={() => handleStart(config)}
              activeOpacity={0.8}
            >
              <View style={styles.partBadge}>
                <Text style={styles.partBadgeText}>P{partInfo.part}</Text>
              </View>
              <View style={styles.partInfo}>
                <Text style={styles.partTitle}>{partInfo.titleZh}</Text>
                <Text style={styles.partDesc}>{partInfo.description}</Text>
              </View>
              <View style={styles.partMeta}>
                <Text style={styles.partType}>
                  {partInfo.type === 'listening' ? '🎧' : '📖'}
                </Text>
                <Text style={styles.partCount}>{partInfo.questionCount}题</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* 历史记录入口 */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyText}>📊 查看历史成绩</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#BBDEFB',
    marginTop: 8,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  modeTime: {
    fontSize: 14,
    color: '#757575',
  },
  modeDesc: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 12,
  },
  modeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  modeQuestions: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  startBtn: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: '700',
  },
  partCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
  },
  listeningCard: {
    borderLeftColor: '#FF7043',
  },
  readingCard: {
    borderLeftColor: '#42A5F5',
  },
  partBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#424242',
  },
  partInfo: {
    flex: 1,
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  partDesc: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  partMeta: {
    alignItems: 'center',
  },
  partType: {
    fontSize: 18,
  },
  partCount: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  historyBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#E3F2FD',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  historyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  bottomSpacer: {
    height: 40,
  },
});
