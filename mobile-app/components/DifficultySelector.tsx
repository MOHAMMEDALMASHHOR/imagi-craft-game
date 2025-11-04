import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Difficulty } from '@/types';
import { DIFFICULTY_SETTINGS } from '@/constants/games';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  style?: any;
}

export default function DifficultySelector({ selected, onSelect, style }: DifficultySelectorProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Select Difficulty</Text>
      <View style={styles.options}>
        {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((difficulty) => {
          const settings = DIFFICULTY_SETTINGS[difficulty];
          const isSelected = selected === difficulty;

          return (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? settings.color : '#F3F4F6',
                  borderColor: isSelected ? settings.color : '#E5E7EB',
                }
              ]}
              onPress={() => onSelect(difficulty)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.optionText,
                { color: isSelected ? '#FFFFFF' : '#374151' }
              ]}>
                {settings.label}
              </Text>
              <Text style={[
                styles.optionDescription,
                { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#6B7280' }
              ]}>
                {settings.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  options: {
    gap: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
});