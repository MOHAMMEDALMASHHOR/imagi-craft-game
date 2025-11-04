import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DailyChallengeCard from '@/components/DailyChallengeCard';

export default function DailyScreen() {
  const handleDailyChallenge = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Navigate to daily challenge
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.subtitle}>New puzzles every day</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DailyChallengeCard
          onPress={handleDailyChallenge}
          style={styles.todayChallenge}
          completed={false}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Days</Text>

          {/* Mock previous challenges */}
          {[1, 2, 3, 4, 5].map((day) => (
            <TouchableOpacity
              key={day}
              style={styles.previousChallenge}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={styles.previousChallengeLeft}>
                <MaterialIcons name="event" size={24} color="#6B7280" />
                <View>
                  <Text style={styles.previousChallengeTitle}>
                    Day {day} Challenge
                  </Text>
                  <Text style={styles.previousChallengeDate}>
                    {new Date(Date.now() - day * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.previousChallengeRight}>
                <MaterialIcons
                  name={day % 2 === 0 ? "check-circle" : "help-outline"}
                  size={20}
                  color={day % 2 === 0 ? "#10B981" : "#6B7280"}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  todayChallenge: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  previousChallenge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  previousChallengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previousChallengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    marginBottom: 2,
  },
  previousChallengeDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  previousChallengeRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});