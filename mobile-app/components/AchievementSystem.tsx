import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Achievement } from '@/types';

const { width, height } = Dimensions.get('window');

interface AchievementSystemProps {
  achievements: Achievement[];
  onAchievementUnlock: (achievementId: string) => void;
}

export default function AchievementSystem({
  achievements,
  onAchievementUnlock,
}: AchievementSystemProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [slideAnimation] = useState(new Animated.Value(-100));

  useEffect(() => {
    // Check for newly unlocked achievements
    const newUnlocks = achievements.filter(a => a.unlocked && !a.unlockedAt);

    if (newUnlocks.length > 0) {
      const achievement = newUnlocks[0];
      setCurrentAchievement(achievement);
      showAchievementNotification(achievement);
      onAchievementUnlock(achievement.id);
    }
  }, [achievements]);

  const showAchievementNotification = (achievement: Achievement) => {
    setShowNotification(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Slide in animation
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnimation, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNotification(false);
    });
  };

  const getAchievementIcon = (achievement: Achievement) => {
    const iconMap: { [key: string]: string } = {
      'first_win': 'emoji-events',
      'speed_demon': 'speed',
      'perfectionist': 'star',
      'daily_player': 'calendar-today',
      'puzzle_master': 'workspace-premium',
      'explorer': 'explore',
    };
    return iconMap[achievement.id] || 'military-tech';
  };

  const getAchievementColor = (achievement: Achievement) => {
    if (achievement.unlocked) return '#10B981';
    if (achievement.progress && achievement.maxProgress) {
      const progress = achievement.progress / achievement.maxProgress;
      if (progress >= 0.75) return '#F59E0B';
      if (progress >= 0.5) return '#3B82F6';
      if (progress >= 0.25) return '#8B5CF6';
    }
    return '#9CA3AF';
  };

  const getAchievementTier = (achievement: Achievement) => {
    if (achievement.unlocked) return 'MASTERED';
    if (achievement.progress && achievement.maxProgress) {
      const progress = achievement.progress / achievement.maxProgress;
      if (progress >= 0.75) return 'NEARLY';
      if (progress >= 0.5) return 'HALFWAY';
      if (progress >= 0.25) return 'PROGRESS';
    }
    return 'LOCKED';
  };

  const renderNotification = () => {
    if (!showNotification || !currentAchievement) return null;

    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.notificationContent}
        >
          <View style={styles.notificationLeft}>
            <View style={styles.notificationIcon}>
              <MaterialIcons
                name={getAchievementIcon(currentAchievement) as any}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>Achievement Unlocked!</Text>
              <Text style={styles.notificationSubtitle}>{currentAchievement.title}</Text>
              <Text style={styles.notificationDescription}>
                {currentAchievement.description}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationClose}
            onPress={() => setShowNotification(false)}
          >
            <MaterialIcons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <>
      {renderNotification()}
    </>
  );
}

export const AchievementProgress = ({ achievement }: { achievement: Achievement }) => {
  const progress = achievement.progress || 0;
  const maxProgress = achievement.maxProgress || 1;
  const progressPercent = (progress / maxProgress) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: progressPercent >= 75 ? '#10B981' :
                              progressPercent >= 50 ? '#F59E0B' :
                              progressPercent >= 25 ? '#3B82F6' : '#9CA3AF',
            }
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {progress}/{maxProgress}
      </Text>
    </View>
  );
};

export const AchievementCard = ({
  achievement,
  onPress
}: {
  achievement: Achievement;
  onPress?: () => void;
}) => {
  const isUnlocked = achievement.unlocked;
  const color = isUnlocked ? '#10B981' : '#9CA3AF';

  return (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        {
          borderColor: color,
          backgroundColor: isUnlocked ? '#10B98110' : '#FFFFFF',
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.achievementHeader}>
        <View style={[styles.achievementIcon, { backgroundColor: color + '20' }]}>
          <MaterialIcons
            name={achievement.icon as any}
            size={28}
            color={color}
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[
            styles.achievementTitle,
            { color: isUnlocked ? '#1F2937' : '#9CA3AF' }
          ]}>
            {achievement.title}
          </Text>
          <Text style={styles.achievementDescription}>
            {achievement.description}
          </Text>
        </View>
        {isUnlocked && (
          <MaterialIcons name="check-circle" size={24} color="#10B981" />
        )}
      </View>

      {/* Progress Bar */}
      {!isUnlocked && achievement.maxProgress && (
        <AchievementProgress achievement={achievement} />
      )}

      {/* Unlock Date */}
      {isUnlocked && achievement.unlockedAt && (
        <View style={styles.unlockDate}>
          <MaterialIcons name="event" size={12} color="#6B7280" />
          <Text style={styles.unlockDateText}>
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  notificationClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  unlockDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  unlockDateText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});