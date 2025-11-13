import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GAMES } from '@/constants/games';
import { Game, UserStats } from '@/types';
import GameCard from '@/components/GameCard';
import StatsOverview from '@/components/StatsOverview';
import DailyChallengeCard from '@/components/DailyChallengeCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const featuredGame = GAMES.find(game => game.featured);
  const regularGames = GAMES.filter(game => !game.featured);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    // TODO: Load from AsyncStorage
    const mockStats: UserStats = {
      totalGamesPlayed: 42,
      totalTimePlayed: 12500000, // milliseconds
      favoriteGame: 'photo-puzzle',
      achievements: [],
      highScores: [],
      currentStreak: 3,
      bestStreak: 7,
    };
    setUserStats(mockStats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  const handleGamePress = (game: Game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/games/${game.id}`);
  };

  const renderFeaturedGame = () => {
    if (!featuredGame) return null;

    return (
      <TouchableOpacity
        style={styles.featuredContainer}
        onPress={() => handleGamePress(featuredGame)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[featuredGame.color, `${featuredGame.color}CC`]}
          style={styles.featuredCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.featuredContent}>
            <View style={styles.featuredIcon}>
              <MaterialIcons
                name={featuredGame.icon as any}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.featuredText}>
              <Text style={styles.featuredTitle}>{featuredGame.title}</Text>
              <Text style={styles.featuredDescription}>
                {featuredGame.description}
              </Text>
            </View>
          </View>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Puzzle Paradise</Text>
          <Text style={styles.subtitle}>Train your brain daily</Text>
        </View>

        {/* Stats Overview */}
        {userStats && (
          <StatsOverview
            stats={userStats}
            style={styles.statsOverview}
          />
        )}

        {/* Daily Challenge */}
        <DailyChallengeCard
          onPress={() => router.push('/daily')}
          style={styles.dailyChallenge}
        />

        {/* Featured Game */}
        {renderFeaturedGame()}

        {/* All Games Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Games</Text>
        </View>

        <View style={styles.gamesGrid}>
          {regularGames.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              index={index}
              onPress={() => handleGamePress(game)}
            />
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
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
  statsOverview: {
    marginBottom: 20,
  },
  dailyChallenge: {
    marginBottom: 20,
  },
  featuredContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredText: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottomPadding: {
    height: 20,
  },
});