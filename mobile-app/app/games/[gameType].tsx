import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { GameType, Difficulty, GameState } from '@/types';
import { GAME_INSTRUCTIONS, PUZZLE_SIZES } from '@/constants/games';
import PhotoPuzzleGame from '@/components/games/PhotoPuzzleGame';
import DifficultySelector from '@/components/DifficultySelector';
import GameInstructions from '@/components/GameInstructions';

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const { gameType } = useLocalSearchParams<{ gameType: GameType }>();
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameStarted) {
        Alert.alert(
          'Exit Game',
          'Are you sure you want to exit? Your progress will be saved.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Exit',
              onPress: () => router.back(),
              style: 'destructive'
            },
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [gameStarted, router]);

  const renderGameSetup = () => {
    const instructions = GAME_INSTRUCTIONS[gameType];

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.setupContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.gameTitle}>
              {instructions.title}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowInstructions(true)}
            >
              <MaterialIcons name="info-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Game Preview/Setup */}
          <View style={styles.setupContent}>
            <View style={styles.gamePreview}>
              {/* TODO: Add game-specific preview */}
              <MaterialIcons
                name="extension"
                size={80}
                color="#6366F1"
              />
            </View>

            <Text style={styles.gameDescription}>
              {instructions.instructions[0]}
            </Text>

            {/* Difficulty Selection */}
            <DifficultySelector
              selected={difficulty}
              onSelect={setDifficulty}
              style={styles.difficultySelector}
            />

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setGameStarted(true);
              }}
            >
              <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions Modal */}
        <Modal
          visible={showInstructions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInstructions(false)}
        >
          <GameInstructions
            gameType={gameType}
            onClose={() => setShowInstructions(false)}
          />
        </Modal>
      </SafeAreaView>
    );
  };

  const renderGame = () => {
    switch (gameType) {
      case 'photo-puzzle':
        return (
          <PhotoPuzzleGame
            difficulty={difficulty}
            onExit={() => router.back()}
          />
        );
      // Add other game types here
      default:
        return renderGameSetup();
    }
  };

  if (!gameStarted) {
    return renderGameSetup();
  }

  return renderGame();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  setupContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  gamePreview: {
    width: 160,
    height: 160,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gameDescription: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  difficultySelector: {
    marginBottom: 40,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});