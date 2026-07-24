import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GRAMMAR_POINTS, type GrammarPoint, type TranslationExample } from '../data/grammar';
import type { VocabTabParamList } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<VocabTabParamList>;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Translation row: Chinese → English */
function TransRow({ ex, idx }: { ex: TranslationExample; idx: number }) {
  return (
    <View style={ts.row}>
      <Text style={ts.num}>{idx + 1}</Text>
      <View style={ts.textWrap}>
        <Text style={ts.cn}>{ex.chinese}</Text>
        <Text style={ts.en}>{ex.english}</Text>
        {ex.note && <Text style={ts.note}>💡 {ex.note}</Text>}
      </View>
    </View>
  );
}

/** ===== Collapsible Section ===== */
function GrammarSection({
  grammar,
  index,
  expanded,
  onToggle,
  onQuiz,
}: {
  grammar: GrammarPoint;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onQuiz: () => void;
}) {
  return (
    <View style={styles.section}>
      {/* Section Header — always visible */}
      <TouchableOpacity
        style={[styles.sectionHeader, expanded && styles.sectionHeaderExpanded]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionIdx}>{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{grammar.titleZh}</Text>
            <Text style={styles.sectionEnglish}>{grammar.title}</Text>
          </View>
          {grammar.videoUrl && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); Linking.openURL(grammar.videoUrl!); }}
              style={styles.videoBtn}
            >
              <Text style={styles.videoBtnText}>📺 视频</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.sectionBody}>
          {/* Definition */}
          <View style={styles.defBox}>
            <Text style={styles.defLabel}>📌 什么是{grammar.titleZh}？</Text>
            <Text style={styles.defText}>{grammar.definition}</Text>
          </View>

          {/* Key Rules */}
          <Text style={styles.bodyLabel}>🔑 关键规则</Text>
          {grammar.rules.map((r, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleBullet}>•</Text>
              <Text style={styles.ruleText}>{r}</Text>
            </View>
          ))}

          {/* Translation Examples */}
          <Text style={styles.bodyLabel}>✏️ 翻译练习</Text>
          {grammar.examples.map((ex, i) => (
            <TransRow key={i} ex={ex} idx={i} />
          ))}

          {/* Traps */}
          <Text style={styles.bodyLabel}>⚠️ 常见错误</Text>
          {grammar.traps.map((trap, i) => (
            <View key={i} style={styles.trapRow}>
              <Text style={styles.trapIdx}>{i + 1}</Text>
              <Text style={styles.trapText}>{trap}</Text>
            </View>
          ))}

          {/* Quiz button */}
          <TouchableOpacity style={styles.quizBtn} onPress={onQuiz}>
            <Text style={styles.quizBtnText}>做测验（{grammar.quiz.length} 题）→</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** ===== Main Wiki Screen ===== */
export default function GrammarWikiScreen() {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 语法 Wiki</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {GRAMMAR_POINTS.map((g, i) => (
          <GrammarSection
            key={g.id}
            grammar={g}
            index={i}
            expanded={expandedIds.has(g.id)}
            onToggle={() => toggleSection(g.id)}
            onQuiz={() => navigation.navigate('GrammarQuiz', { grammarId: g.id })}
          />
        ))}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#1976D2', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#212121' },

  content: { padding: 12, paddingBottom: 40 },

  // ===== TOC =====
  tocCard: {
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  tocTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 4 },
  tocSubtitle: { fontSize: 13, color: '#9E9E9E', marginBottom: 14 },
  tocGrid: { gap: 6 },
  tocItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  tocItemActive: { backgroundColor: '#E3F2FD' },
  tocNum: {
    width: 28, height: 28, borderRadius: 7, backgroundColor: '#E0E0E0',
    textAlign: 'center', lineHeight: 28, fontSize: 13, fontWeight: '800', color: '#757575',
    marginRight: 10, overflow: 'hidden',
  },
  tocNumActive: { backgroundColor: '#1565C0', color: '#FFFFFF' },
  tocItemInfo: { flex: 1 },
  tocItemTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  tocItemEn: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  tocExpand: { fontSize: 12, color: '#BDBDBD' },

  // ===== Section =====
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  sectionHeaderExpanded: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sectionIdx: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#E3F2FD',
    textAlign: 'center', lineHeight: 30, fontSize: 13, fontWeight: '800', color: '#1565C0',
    marginRight: 10, overflow: 'hidden',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#212121' },
  sectionEnglish: { fontSize: 11, color: '#757575', marginTop: 1 },
  videoBtn: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginRight: 8,
  },
  videoBtnText: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  expandIcon: { fontSize: 12, color: '#9E9E9E' },

  // ===== Section Body =====
  sectionBody: { padding: 14 },

  defBox: {
    backgroundColor: '#E8EAF6', padding: 14, borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: '#1A237E', marginBottom: 16,
  },
  defLabel: { fontSize: 12, fontWeight: '700', color: '#1A237E', marginBottom: 6 },
  defText: { fontSize: 14, color: '#212121', lineHeight: 22 },

  bodyLabel: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 8, marginTop: 4 },

  ruleRow: { flexDirection: 'row', marginBottom: 5, paddingLeft: 4 },
  ruleBullet: { fontSize: 16, color: '#1565C0', marginRight: 8, lineHeight: 20 },
  ruleText: { fontSize: 13, color: '#424242', lineHeight: 20, flex: 1 },

  trapRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' },
  trapIdx: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF8F00',
    textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '800', color: '#FFFFFF',
    marginRight: 8, marginTop: 1, overflow: 'hidden',
  },
  trapText: { fontSize: 13, color: '#E65100', lineHeight: 19, flex: 1 },

  quizBtn: {
    backgroundColor: '#E3F2FD', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', marginTop: 14,
  },
  quizBtnText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },

  spacer: { height: 30 },
});

// Translation row styles
const ts = StyleSheet.create({
  row: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EEEEEE',
  },
  num: {
    width: 24, fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginTop: 2,
  },
  textWrap: { flex: 1 },
  cn: { fontSize: 13, color: '#616161', lineHeight: 19 },
  en: { fontSize: 14, color: '#212121', lineHeight: 21, marginTop: 2, fontStyle: 'italic' },
  note: { fontSize: 11, color: '#1565C0', marginTop: 3 },
});
