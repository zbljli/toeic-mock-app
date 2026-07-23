import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  optionId: string;
  label: string; // A, B, C, D
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean; // 是否已经显示答案
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export default function OptionButton({
  optionId,
  label,
  text,
  isSelected,
  isCorrect,
  isRevealed = false,
  onSelect,
  disabled = false,
}: Props) {
  let containerStyle = styles.default;
  let labelStyle = styles.labelDefault;
  let textStyle = styles.textDefault;

  if (isRevealed && isCorrect) {
    containerStyle = styles.correct;
    labelStyle = styles.labelCorrect;
    textStyle = styles.textCorrect;
  } else if (isRevealed && isSelected && !isCorrect) {
    containerStyle = styles.wrong;
    labelStyle = styles.labelWrong;
    textStyle = styles.textWrong;
  } else if (isSelected) {
    containerStyle = styles.selected;
    labelStyle = styles.labelSelected;
    textStyle = styles.textSelected;
  }

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={() => onSelect(optionId)}
      disabled={disabled || isRevealed}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
  },
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  selected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  correct: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  wrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  label: {
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 12,
    overflow: 'hidden',
  },
  labelDefault: {
    backgroundColor: '#F5F5F5',
    color: '#757575',
  },
  labelSelected: {
    backgroundColor: '#1976D2',
    color: '#FFFFFF',
  },
  labelCorrect: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
  },
  labelWrong: {
    backgroundColor: '#F44336',
    color: '#FFFFFF',
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  textDefault: {
    color: '#212121',
  },
  textSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  textCorrect: {
    color: '#2E7D32',
  },
  textWrong: {
    color: '#C62828',
  },
});
