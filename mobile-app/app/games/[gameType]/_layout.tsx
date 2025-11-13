import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsMobileDevice } from '@/hooks/use-mobile';
import { usePerformance } from '@/components/performance/PerformanceMonitor';
import { useAccessibility } from '@/components/accessibility/AccessibilityHelper';
import { PowerUpBar } from '@/components/PowerUpBar';
import { AchievementSystem } from '@/components/AchievementSystem';
import { TutorialSystem } from '@/components/tutorial/TutorialSystem';
import { MultiplayerManager } from '@/components/multiplayer/MultiplayerManager';
import { PremiumStore } from '@/components/premium/PremiumStore';
import { CloudSaveService } from '@/services/CloudSaveService';
import { AnalyticsService } from '@/services/AnalyticsService';
import PhotoPuzzleGame from '@/components/games/PhotoPuzzleGame';
import MemoryMatchGame from '@/components/games/MemoryMatchGame';

interface GameLayoutProps {
  children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const { gameType } = useLocalSearchParams<{ gameType: string }>();
  const { shouldReduceQuality, currentQualityLevel } = usePerformance();
  const { getAdaptiveFontSize, shouldReduceMotion } = useAccessibility();
  const isMobile = useIsMobileDevice();

  const [gameState, setGameState] = useState({
    started: false,
    paused: false,
    score: 0,
    moves: 0,
    level: 1,
    coins: 1000,
    isPremium: false,
    achievements: [],
  });

  const [availablePowerUps, setAvailablePowerUps] = useState({
    time_freeze: 2,
    hint_eye: 3,
    move_saver: 1,
  });

  const [activePowerUps, setActivePowerUps] = useState([]);

  // Initialize services
  useEffect(() => {
    initializeGame();
  }, [gameType]);

  const initializeGame = async () => {
    const analytics = AnalyticsService.getInstance();
    const cloudSave = CloudSaveService.getInstance();

    // Track game start
    analytics.trackEvent('game_launch', {
      game_type: gameType,
      platform: 'mobile',
      quality_level: currentQualityLevel,
    });

    // Load saved data
    try {
      const savedData = await cloudSave.getLocalData();
      if (savedData.gameProgress[gameType]) {
        setGameState(prev => ({
          ...prev,
          level: savedData.gameProgress[gameType].level || 1,
          score: savedData.gameProgress[gameType].bestScore?.[0] || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading saved game data:', error);
    }
  };

  const handlePowerUpUse = (powerUp: any) => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackPowerUpUsed(powerUp.id, powerUp.type);

    // Deduct from available power-ups
    setAvailablePowerUps(prev => ({
      ...prev,
      [powerUp.id]: Math.max(0, (prev[powerUp.id] || 0) - 1),
    }));

    // Add to active power-ups
    setActivePowerUps(prev => [
      ...prev,
      {
        powerUp,
        isActive: true,
        startTime: Date.now(),
        endTime: powerUp.duration ? Date.now() + powerUp.duration : undefined,
      },
    ]);
  };

  const handleGameComplete = (moves: number, score: number) => {
    const analytics = AnalyticsService.getInstance();
    const cloudSave = CloudSaveService.getInstance();

    // Track completion
    analytics.trackEvent('game_completed', {
      game_type: gameType,
      moves,
      score,
      duration: Date.now() - (gameState.startTime || Date.now()),
    });

    // Update cloud save
    cloudSave.saveLocalData({
      gameProgress: {
        [gameType]: {
          ...cloudSave.getLocalData().gameProgress[gameType],
          bestScores: [score, ...(cloudSave.getLocalData().gameProgress[gameType]?.bestScores || [])].sort((a, b) => b - a).slice(0, 10),
          totalGamesPlayed: (cloudSave.getLocalData().gameProgress[gameType]?.totalGamesPlayed || 0) + 1,
          lastPlayDate: new Date().toISOString(),
        },
      },
    });

    setGameState(prev => ({
      ...prev,
      score: Math.max(prev.score, score),
    }));
  };

  const handleMultiplayerJoin = (room: any) => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackSocialAction('multiplayer_join', 'in-app');
    // Handle multiplayer game start
  };

  const handlePurchase = (productId: string) => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackInAppPurchase(productId, 4.99, 'USD');

    if (productId.includes('premium')) {
      setGameState(prev => ({ ...prev, isPremium: true }));
    }

    // Add coins if coin purchase
    if (productId.includes('coins')) {
      const coinAmount = productId.includes('small') ? 100 :
                        productId.includes('medium') ? 500 :
                        productId.includes('large') ? 1200 : 3000;
      setGameState(prev => ({ ...prev, coins: prev.coins + coinAmount }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Performance Monitor - Development only */}
      {__DEV__ && (
        <PerformanceMonitor visible={true} />
      )}

      {/* Game Content */}
      <View style={styles.gameContainer}>
        {gameType === 'photo-puzzle' && (
          <PhotoPuzzleGame
            difficulty="medium"
            onExit={() => {}}
            powerUps={availablePowerUps}
            onPowerUpUse={handlePowerUpUse}
            onGameComplete={handleGameComplete}
          />
        )}

        {gameType === 'memory-match' && (
          <MemoryMatchGame
            difficulty="medium"
            onExit={() => {}}
            onGameComplete={handleGameComplete}
          />
        )}

        {/* Add other game types here */}
      </View>

      {/* Enhanced Game UI Components */}
      {gameState.started && (
        <>
          {/* Power-Up Bar */}
          <PowerUpBar
            availablePowerUps={availablePowerUps}
            coins={gameState.coins}
            onPowerUpUse={handlePowerUpUse}
            activePowerUps={activePowerUps}
            style={styles.powerUpBar}
          />

          {/* Multiplayer Manager */}
          <MultiplayerManager
            currentPlayer={{
              id: 'current_user',
              name: 'Player',
              avatar: '🎮',
              level: gameState.level,
              score: gameState.score,
              status: 'online',
            }}
            onRoomJoin={handleMultiplayerJoin}
            onGameStart={handleMultiplayerJoin}
          />

          {/* Premium Store */}
          <PremiumStore
            isPremium={gameState.isPremium}
            userCoins={gameState.coins}
            onPurchase={handlePurchase}
            onRestore={() => {}}
          />

          {/* Achievement System */}
          <AchievementSystem
            achievements={gameState.achievements}
            onAchievementUnlock={(achievementId) => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackAchievementUnlocked(achievementId, achievementId);
            }}
          />

          {/* Tutorial System */}
          <TutorialSystem
            gameType={gameType as any}
            isFirstTime={false} // Check from analytics/local storage
            onComplete={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackTutorialCompleted();
            }}
            onSkip={() => {
              const analytics = AnalyticsService.getInstance();
              analytics.trackEvent('tutorial_skipped');
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gameContainer: {
    flex: 1,
  },
  powerUpBar: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    left: 16,
    right: 16,
    zIndex: 100,
  },
});