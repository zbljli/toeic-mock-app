import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  optionId: string;
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed?: boolean;
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
      activeOpacity={0.6}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  selected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#1A73E8',
  },
  correct: {
    backgroundColor: '#E6F4EA',
    borderColor: '#34A853',
  },
  wrong: {
    backgroundColor: '#FCE8E6',
    borderColor: '#EA4335',
  },
  label: {
    width: 36,
    height: 36,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 14,
    overflow: 'hidden',
  },
  labelDefault: {
    backgroundColor: '#F5F5F5',
    color: '#5F6368',
  },
  labelSelected: {
    backgroundColor: '#1A73E8',
    color: '#FFFFFF',
  },
  labelCorrect: {
    backgroundColor: '#34A853',
    color: '#FFFFFF',
  },
  labelWrong: {
    backgroundColor: '#EA4335',
    color: '#FFFFFF',
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  textDefault: {
    color: '#202124',
  },
  textSelected: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  textCorrect: {
    color: '#137333',
    fontWeight: '600',
  },
  textWrong: {
    color: '#C5221F',
    fontWeight: '600',
  },
});
