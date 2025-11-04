import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { Difficulty, GameState, PuzzlePiece } from '@/types';
import { PUZZLE_SIZES } from '@/constants/games';

const { width, height } = Dimensions.get('window');

interface PhotoPuzzleGameProps {
  difficulty: Difficulty;
  onExit: () => void;
}

export default function PhotoPuzzleGame({ difficulty, onExit }: PhotoPuzzleGameProps) {
  const [image, setImage] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);

  const gridSize = PUZZLE_SIZES['photo-puzzle'][difficulty];
  const pieceSize = Math.min(width, height - 200) / Math.max(gridSize.rows, gridSize.cols);

  useEffect(() => {
    // Start by asking for photo
    requestImagePermission();
  }, []);

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to use this feature.'
      );
      return;
    }
    setShowImagePicker(true);
  };

  const pickImage = async (source: 'camera' | 'library') => {
    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      setShowImagePicker(false);
      initializePuzzle(imageUri);
    }
  };

  const initializePuzzle = (imageUri: string) => {
    const pieceCount = gridSize.rows * gridSize.cols;
    const pieces: PuzzlePiece[] = [];

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        currentIndex: i,
        correctIndex: i,
        imageData: imageUri,
      });
    }

    // Shuffle pieces
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i].currentIndex, pieces[j].currentIndex] = [pieces[j].currentIndex, pieces[i].currentIndex];
    }

    setGameState({
      pieces,
      selectedPiece: null,
      moves: 0,
      solved: false,
      startTime: Date.now(),
      elapsedTime: 0,
      isPaused: false,
      difficulty,
      image: imageUri,
    });
  };

  const handlePieceTap = (index: number) => {
    if (!gameState || gameState.solved || isPaused) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setGameState(prev => {
      if (!prev) return null;

      if (prev.selectedPiece === null) {
        return { ...prev, selectedPiece: index };
      } else if (prev.selectedPiece === index) {
        return { ...prev, selectedPiece: null };
      } else {
        // Swap pieces
        const newPieces = [...prev.pieces];
        const piece1 = newPieces.find(p => p.currentIndex === prev.selectedPiece);
        const piece2 = newPieces.find(p => p.currentIndex === index);

        if (piece1 && piece2) {
          [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];

          const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
          if (isSolved) {
            Alert.alert('Congratulations!', `Puzzle solved in ${prev.moves + 1} moves!`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return {
            ...prev,
            pieces: newPieces,
            moves: prev.moves + 1,
            selectedPiece: null,
            solved: isSolved,
          };
        }
      }
      return prev;
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetPuzzle = () => {
    if (image) {
      initializePuzzle(image);
    }
  };

  const getPuzzlePieceStyle = (piece: PuzzlePiece) => {
    if (!image) return {};

    const correctCol = piece.correctIndex % gridSize.cols;
    const correctRow = Math.floor(piece.correctIndex / gridSize.cols);

    return {
      width: pieceSize - 4,
      height: pieceSize - 4,
      margin: 2,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: gameState?.selectedPiece === piece.currentIndex ? 3 : 1,
      borderColor: gameState?.selectedPiece === piece.currentIndex ? '#6366F1' : '#E5E7EB',
      backgroundColor: '#FFFFFF',
    };
  };

  const getImageStyle = (piece: PuzzlePiece) => {
    if (!image) return {};

    const correctCol = piece.correctIndex % gridSize.cols;
    const correctRow = Math.floor(piece.correctIndex / gridSize.cols);

    return {
      width: pieceSize * gridSize.cols,
      height: pieceSize * gridSize.rows,
      position: 'absolute',
      left: -correctCol * pieceSize,
      top: -correctRow * pieceSize,
    };
  };

  if (!image || !gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Photo Source</Text>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => pickImage('camera')}
              >
                <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => pickImage('library')}
              >
                <MaterialIcons name="photo-library" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Choose from Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onExit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Game Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onExit}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.stats}>
          <Text style={styles.stat}>Moves: {gameState.moves}</Text>
          <Text style={styles.stat}>
            Time: {formatTime(Date.now() - gameState.startTime!)}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={togglePause}
          >
            <MaterialIcons
              name={isPaused ? 'play-arrow' : 'pause'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetPuzzle}
          >
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>Game Paused</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={togglePause}
          >
            <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Puzzle Grid */}
      <View style={styles.gameArea}>
        <View
          style={[
            styles.puzzleGrid,
            {
              width: pieceSize * gridSize.cols,
              height: pieceSize * gridSize.rows,
            }
          ]}
        >
          {gameState.pieces
            .sort((a, b) => a.currentIndex - b.currentIndex)
            .map((piece) => (
              <TouchableOpacity
                key={piece.id}
                style={getPuzzlePieceStyle(piece)}
                onPress={() => handlePieceTap(piece.currentIndex)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: image }}
                  style={getImageStyle(piece)}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Success Celebration */}
      {gameState.solved && (
        <View style={styles.successOverlay}>
          <Text style={styles.successTitle}>🎉 Puzzle Complete!</Text>
          <Text style={styles.successStats}>
            {gameState.moves} moves • {formatTime(Date.now() - gameState.startTime!)}
          </Text>
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={resetPuzzle}
            >
              <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onExit}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366F1',
    elevation: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  successOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  successStats: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
});