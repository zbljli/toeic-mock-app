import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  part: number;
  partTitle: string;
  prompt: string;
  passage?: string;
  imageUrl?: string;
  questionNumber: number;
  totalQuestions: number;
  displayMode?: 'photo' | 'text';
  /** Hide passage text (official exam: audio only, no reading) */
  hidePassage?: boolean;
}

const PART_NAMES: Record<number, string> = {
  1: 'Photographs',
  2: 'Question-Response',
  3: 'Conversations',
  4: 'Talks',
};

export default function QuestionCard({
  part,
  prompt,
  passage,
  imageUrl,
  questionNumber,
  totalQuestions,
  displayMode = 'text',
  hidePassage = false,
}: Props) {
  const isPhotoMode = displayMode === 'photo' && !!imageUrl;
  const [imageLoading, setImageLoading] = useState(!!imageUrl);
  const [imageError, setImageError] = useState(false);

  const renderImage = (uri: string, style: object, resizeMode: 'cover' | 'contain') => (
    <View style={[style, { overflow: 'hidden' }]}>
      {imageLoading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="large" color="#9E9E9E" />
        </View>
      )}
      {imageError ? (
        <View style={styles.imageError}>
          <Text style={styles.errorIcon}>🖼</Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[style, imageLoading && styles.imageHidden]}
          resizeMode={resizeMode}
          onLoadStart={() => setImageLoading(true)}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Part badge + question number */}
      <View style={styles.header}>
        <View style={styles.partBadge}>
          <Text style={styles.partBadgeText}>PART {part}</Text>
        </View>
        <Text style={styles.partName}>{PART_NAMES[part] ?? ''}</Text>
        <Text style={styles.questionCount}>
          {questionNumber}/{totalQuestions}
        </Text>
      </View>

      {/* Part 1: clean photo, no overlay text */}
      {isPhotoMode ? (
        <View style={styles.photoContainer}>
          {renderImage(imageUrl!, styles.photoImage, 'contain')}
        </View>
      ) : (
        <>
          {imageUrl && (
            <View style={styles.imageContainer}>
              {renderImage(imageUrl, styles.image, 'cover')}
            </View>
          )}

          {/* Passage — hidden during official exam simulation */}
          {passage && !hidePassage && (
            <View style={styles.passageContainer}>
              <Text style={styles.passageText}>{passage}</Text>
            </View>
          )}

          {/* Prompt */}
          <View style={styles.promptContainer}>
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
  partName: {
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
  // Part 1 photo
  photoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 320,
  },
  // Regular image
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
  // Passage
  passageContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  passageText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 21,
  },
  // Prompt
  promptContainer: {
    marginBottom: 2,
  },
  promptText: {
    fontSize: 15,
    color: '#212121',
    lineHeight: 23,
    fontWeight: '500',
  },
  // Loading
  imageLoader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    zIndex: 1,
  },
  imageHidden: { opacity: 0 },
  imageError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorIcon: { fontSize: 36 },
});
