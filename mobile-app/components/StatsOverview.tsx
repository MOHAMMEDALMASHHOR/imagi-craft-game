import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserStats } from '@/types';

interface StatsOverviewProps {
  stats: UserStats;
  style?: any;
}

export default function StatsOverview({ stats, style }: StatsOverviewProps) {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <MaterialIcons name="extension" size={24} color="#6366F1" />
          <Text style={styles.statValue}>{stats.totalGamesPlayed}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="schedule" size={24} color="#10B981" />
          <Text style={styles.statValue}>{formatTime(stats.totalTimePlayed)}</Text>
          <Text style={styles.statLabel}>Play Time</Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="local-fire-department" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
});