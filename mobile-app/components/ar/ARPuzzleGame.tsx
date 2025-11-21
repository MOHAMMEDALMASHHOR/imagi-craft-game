import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Vibration } from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ARPuzzleGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onExit: () => void;
  onPuzzleComplete: (moves: number, time: number, score: number) => void;
}

interface ARMarker {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'corner' | 'edge' | 'center';
  detected: boolean;
  confidence: number;
}

interface ARPuzzlePiece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  position3D: { x: number; y: number; z: number };
  rotation: number;
  scale: number;
  placed: boolean;
  isDragging: boolean;
}

export default function ARPuzzleGame({
  difficulty,
  onExit,
  onPuzzleComplete,
}: ARPuzzleGameProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [arMode, setARMode] = useState<'detection' | 'placement'>('detection');
  const [detectedSurface, setDetectedSurface] = useState(false);
  const [puzzlePieces, setPuzzlePieces] = useState<ARPuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);

  const panRef = useRef(null);
  const animationValues = useRef({
    pieces: puzzlePieces.map(() => useSharedValue(0)),
    overlay: useSharedValue(0),
    score: useSharedValue(0),
  });

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      initializeARMode();
    } else {
      Alert.alert(
        'Camera Required',
        'AR features require camera access to scan your environment for puzzle placement.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: requestCameraPermission },
        ]
      );
    }
  };

  const initializeARMode = () => {
    initializePuzzlePieces();
    setCameraActive(true);
    startARDetection();
  };

  const initializePuzzlePieces = () => {
    const pieceCount = getPieceCount(difficulty);
    const pieces: ARPuzzlePiece[] = [];

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: i,
        currentIndex: i,
        correctIndex: i,
        position3D: getRandomPosition3D(i, pieceCount),
        rotation: Math.random() * 360,
        scale: 1,
        placed: false,
        isDragging: false,
      });
    }

    // Scramble pieces
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i].currentIndex, pieces[j].currentIndex] = [pieces[j].currentIndex, pieces[i].currentIndex];
    }

    setPuzzlePieces(pieces);
  };

  const getRandomPosition3D = (index: number, totalPieces: number) => {
    const angle = (index / totalPieces) * Math.PI * 2;
    const radius = 150 + Math.random() * 100;
    const height = Math.random() * 50 - 25;

    return {
      x: Math.cos(angle) * radius,
      y: height,
      z: Math.sin(angle) * radius,
    };
  };

  const startARDetection = () => {
    // Simulate AR surface detection
    setTimeout(() => {
      setDetectedSurface(true);
      setARMode('placement');
      setStartTime(Date.now());

      // Animate pieces appearing
      puzzlePieces.forEach((_, index) => {
        animationValues.current.pieces[index].value = withSpring(
          1,
          {
            tension: 100,
            friction: 8,
            delay: index * 100,
          }
        );
      });
    }, 2000);
  };

  const getPieceCount = (diff: string): number => {
    switch (diff) {
      case 'easy': return 9; // 3x3
      case 'medium': return 16; // 4x4
      case 'hard': return 25; // 5x5
      default: return 9;
    }
  };

  const handleARMarkerDetection = (marker: ARMarker) => {
    runOnJS(() => {
      setDetectedSurface(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    })();
  };

  const handlePieceGrab = (pieceId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPiece(pieceId);
    setPuzzlePieces(prev =>
      prev.map(p =>
        p.id === pieceId ? { ...p, isDragging: true } : p
      )
    );

    // Scale up the selected piece
    const pieceIndex = puzzlePieces.findIndex(p => p.id === pieceId);
    if (pieceIndex !== -1) {
      animationValues.current.pieces[pieceIndex].value = withTiming(
        1.2,
        { duration: 150 }
      );
    }
  };

  const handlePieceRelease = (pieceId: number, finalPosition: { x: number; y: number }) => {
    const piece = puzzlePieces.find(p => p.id === pieceId);
    if (!piece) return;

    // Check if piece is placed correctly
    const isCorrect = isCorrectPlacement(piece, finalPosition);
    const newPieces = puzzlePieces.map(p => {
      if (p.id === pieceId) {
        return {
          ...p,
          isDragging: false,
          placed: isCorrect,
          position3D: {
            ...p.position3D,
            x: finalPosition.x,
            y: finalPosition.y,
          },
        };
      }
      return p;
    });

    setPuzzlePieces(newPieces);
    setSelectedPiece(null);

    // Scale back to normal
    const pieceIndex = puzzlePieces.findIndex(p => p.id === pieceId);
    if (pieceIndex !== -1) {
      animationValues.current.pieces[pieceIndex].value = withTiming(
        isCorrect ? 1 : 1.1,
        { duration: 200 }
      );
    }

    if (isCorrect) {
      handleCorrectPlacement();
    } else {
      handleIncorrectPlacement();
    }

    setMoves(moves + 1);
  };

  const isCorrectPlacement = (
    piece: ARPiecePiece,
    position: { x: number; y: number }
  ): boolean => {
    const tolerance = 50; // pixels tolerance
    const gridPositions = getGridPositions(difficulty);
    const correctGridPos = gridPositions[piece.correctIndex];

    return Math.abs(position.x - correctGridPos.x) < tolerance &&
           Math.abs(position.y - correctGridPos.y) < tolerance;
  };

  const getGridPositions = (diff: string): { x: number; y: number }[] => {
    const cols = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
    const spacing = 80;
    const startX = (width - (cols - 1) * spacing) / 2;
    const startY = height / 2 - 100;

    const positions: { x: number; y: number }[] = [];
    const totalPieces = getPieceCount(diff);
    const rows = Math.ceil(totalPieces / cols);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < totalPieces) {
          positions.push({
            x: startX + col * spacing,
            y: startY + row * spacing,
          });
        }
      }
    }

    return positions;
  };

  const handleCorrectPlacement = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScore(prev => prev + 100 * combo);
    setCombo(prev => Math.min(prev + 1, 5));

    // Animate score increase
    animationValues.current.score.value = withSpring(
      animationValues.current.score.value + 1,
      { tension: 100 }
    );

    checkPuzzleComplete();
  };

  const handleIncorrectPlacement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCombo(1);

    // Animate error feedback
    animationValues.current.overlay.value = withTiming(
      1,
      { duration: 200 }
    );

    setTimeout(() => {
      animationValues.current.overlay.value = withTiming(
        0,
        { duration: 200 }
      );
    }, 200);
  };

  const checkPuzzleComplete = () => {
    const allPlaced = puzzlePieces.every(p => p.placed);
    if (allPlaced) {
      const completionTime = Date.now() - (startTime || Date.now());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show completion celebration
      showCompletionCelebration();

      setTimeout(() => {
        onPuzzleComplete(moves, completionTime, score);
      }, 1000);
    }
  };

  const showCompletionCelebration = () => {
    // Trigger confetti animation
    animationValues.current.pieces.forEach((animValue, index) => {
      animValue.value = withSpring(
        animValue.value + 1,
        {
          tension: 50,
          friction: 4,
          delay: index * 50,
        }
      );
    });
  };

  const renderAROverlay = () => {
    const overlayStyle = useAnimatedStyle(() => ({
      opacity: animationValues.current.overlay.value,
      backgroundColor: 'rgba(255, 0, 0, 0.3)',
    }));

    return (
      <Animated.View style={[styles.arOverlay, overlayStyle]}>
        <Text style={styles.overlayText}>
          Incorrect placement! Try again.
        </Text>
      </Animated.View>
    );
  };

  const renderARPieces = () => {
    return puzzlePieces.map((piece, index) => {
      const pieceStyle = useAnimatedStyle(() => ({
        transform: [
          { scale: animationValues.current.pieces[index].value },
          { translateX: piece.position3D.x },
          { translateY: piece.position3D.y },
          { rotate: `${piece.rotation + animationValues.current.pieces[index].value * 5}deg` },
        ],
        opacity: piece.isDragging ? 0.8 : 1,
        zIndex: selectedPiece === piece.id ? 1000 : piece.placed ? 500 : 100,
      }));

      return (
        <Animated.View
          key={piece.id}
          style={[styles.arPiece, pieceStyle]}
        >
          <LinearGradient
            colors={
              piece.placed
                ? ['#10B981', '#059669']
                : selectedPiece === piece.id
                ? ['#6366F1', '#4F46E5']
                : ['#8B5CF6', '#7C3AED']
            }
            style={styles.pieceGradient}
          />
          <Text style={styles.pieceNumber}>
            {piece.correctIndex + 1}
          </Text>
          {piece.placed && (
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#FFFFFF"
              style={styles.placedIcon}
            />
          )}
        </Animated.View>
      );
    });
  };

  const renderARUI = () => {
    return (
      <>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowHelp(true)}
          >
            <MaterialIcons name="help-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={styles.movesText}>Moves: {moves}</Text>
            <Text style={styles.scoreText}>Score: {score}</Text>
            {combo > 1 && (
              <Text style={styles.comboText}>x{combo}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => resetPuzzle()}
          >
            <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* AR Instructions */}
        {!detectedSurface && (
          <View style={styles.arInstructions}>
            <Text style={styles.instructionText}>
              Move around to detect a flat surface
            </Text>
            <Text style={styles.instructionSubtext}>
              Point your camera at a table or wall
            </Text>
          </View>
        )}

        {/* Placement Guidance */}
        {detectedSurface && arMode === 'placement' && (
          <View style={styles.placementGuidance}>
            <Text style={styles.guidanceText}>
              Drag pieces to complete the puzzle
            </Text>
            <View style={styles.gridPreview}>
              {renderGridPreview()}
            </View>
          </View>
        )}

        {/* Score Animation */}
        <Animated.View
          style={[
            styles.scoreAnimation,
            {
              opacity: animationValues.current.score.value > 0 ? 1 : 0,
              transform: [
                {
                  translateY: animationValues.current.score.value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.scoreAnimationText}>+100 x{combo}!</Text>
        </Animated.View>
      </>
    );
  };

  const renderGridPreview = () => {
    const cols = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const grid = [];

    for (let i = 0; i < getPieceCount(difficulty); i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const isPlaced = puzzlePieces.some(p => p.correctIndex === i && p.placed);

      grid.push(
        <View
          key={i}
          style={[
            styles.gridCell,
            {
              backgroundColor: isPlaced ? '#10B98120' : 'rgba(255, 255, 255, 0.2)',
              borderColor: isPlaced ? '#10B981' : '#FFFFFF',
            },
          ]}
        >
          <Text style={[
            styles.gridCellText,
            { color: isPlaced ? '#FFFFFF' : '#6B7280' }
          ]}>
            {i + 1}
          </Text>
        </View>
      );
    }

    return grid;
  };

  const resetPuzzle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    initializePuzzlePieces();
    setMoves(0);
    setScore(0);
    setCombo(1);
    setStartTime(Date.now());
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="camera-alt" size={64} color="#6366F1" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          AR puzzles require camera access to scan your environment
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {cameraActive && (
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          onFacesDetected={(faces) => {
            // Optional: Face detection for AR features
          }}
          onBarCodeScanned={(data) => {
            // Optional: Barcode scanning for AR triggers
          }}
        />
      )}

      {renderARPieces()}
      {renderARUI()}
      {renderAROverlay()}

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.helpModal}>
          <Text style={styles.helpTitle}>AR Puzzle Guide</Text>
          <ScrollView style={styles.helpContent}>
            <Text style={styles.helpSectionTitle}>🎯 How to Play:</Text>
            <Text style={styles.helpText}>
              1. Scan your environment to detect a flat surface{'\n'}
              2. Drag and drop 3D puzzle pieces to complete the image{'\n'}
              3. Use visual cues to guide piece placement{'\n'}
              4. Build combos for bonus points!
            </Text>

            <Text style={styles.helpSectionTitle}>🎮 Controls:</Text>
            <Text style={styles.helpText}>
              • Drag pieces to move them{'\n'}
              • Tap to select and drag{'\n'}
              • Double-tap to rotate{'\n'}
              • Pinch to zoom in/out
            </Text>

            <Text style={styles.helpSectionTitle}>✨ AR Tips:</Text>
            <Text style={styles.helpText}>
              • Find a well-lit area for best results{'\n'}
              • Keep your device steady{'\n'}
              • Multiple pieces can be moved at once{'\n'}
              • Green highlights show correct placement
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.helpCloseButton}
            onPress={() => setShowHelp(false)}
          >
            <Text style={styles.helpCloseText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  arPiece: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  pieceGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  pieceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 2,
  },
  placedIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  movesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBBF24',
  },
  comboText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  arInstructions: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -100 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  placementGuidance: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
  guidanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  gridPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    maxWidth: 200,
  },
  gridCell: {
    width: 30,
    height: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  gridCellText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -25 }],
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 1500,
  },
  scoreAnimationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpContent: {
    maxHeight: 400,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  helpCloseButton: {
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  helpCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});