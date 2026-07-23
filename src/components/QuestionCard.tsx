import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface Props {
  part: number;
  partTitle: string;
  prompt: string;
  passage?: string;
  imageUrl?: string;
  questionNumber: number;
  totalQuestions: number;
  /** 'photo' = Part 1 只显示图片不显示题干 / 'text' = 正常显示 */
  displayMode?: 'photo' | 'text';
}

export default function QuestionCard({
  part,
  partTitle,
  prompt,
  passage,
  imageUrl,
  questionNumber,
  totalQuestions,
  displayMode = 'text',
}: Props) {
  const isPhotoMode = displayMode === 'photo' && imageUrl;

  return (
    <View style={styles.container}>
      {/* 题号 & Part 信息 */}
      <View style={styles.header}>
        <View style={styles.partBadge}>
          <Text style={styles.partBadgeText}>Part {part}</Text>
        </View>
        <Text style={styles.partTitle}>{partTitle}</Text>
        <Text style={styles.questionCount}>
          {questionNumber}/{totalQuestions}
        </Text>
      </View>

      {/* Part 1 大图模式: 图片占主体，不显示题干 */}
      {isPhotoMode ? (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.photoImage}
            resizeMode="contain"
          />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoLabel}>📷 观察图片，聆听音频选择最合适的描述</Text>
          </View>
        </View>
      ) : (
        <>
          {/* 普通图片（非 Part 1 也可能有图） */}
          {imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* 阅读材料 */}
          {passage && (
            <View style={styles.passageContainer}>
              <Text style={styles.passageLabel}>📄 参考材料</Text>
              <Text style={styles.passageText}>{passage}</Text>
            </View>
          )}

          {/* 题干 */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptLabel}>📝 题目</Text>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partBadge: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  partBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  partTitle: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
    fontWeight: '500',
  },
  questionCount: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  // === Photo Mode (Part 1) ===
  photoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    marginBottom: 4,
  },
  photoImage: {
    width: '100%',
    height: 340,
  },
  photoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  photoLabel: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    fontWeight: '500',
  },
  // === Regular Image ===
  imageContainer: {
    marginBottom: 14,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: 220,
  },
  // === Passage ===
  passageContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  passageLabel: {
    fontSize: 11,
    color: '#F57F17',
    fontWeight: '600',
    marginBottom: 4,
  },
  passageText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 21,
  },
  // === Prompt ===
  promptContainer: {
    marginBottom: 2,
  },
  promptLabel: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '600',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 23,
    fontWeight: '500',
  },
});
