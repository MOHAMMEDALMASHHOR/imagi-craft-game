import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface DailyChallengeCardProps {
  onPress: () => void;
  style?: any;
  completed?: boolean;
}

export default function DailyChallengeCard({ onPress, style, completed = false }: DailyChallengeCardProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={completed ? ['#10B981', '#059669'] : ['#6366F1', '#4F46E5']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <MaterialIcons
              name={completed ? "check-circle" : "today"}
              size={28}
              color="#FFFFFF"
            />
            <View style={styles.textSection}>
              <Text style={styles.title}>Daily Challenge</Text>
              <Text style={styles.date}>{today}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            {completed ? (
              <View style={styles.completedBadge}>
                <MaterialIcons name="star" size={16} color="#FFFFFF" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+50 XP</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textSection: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});