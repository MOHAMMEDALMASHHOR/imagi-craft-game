import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: {
    component: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  action?: string;
  requiredAction?: () => boolean;
  nextStepDelay?: number;
}

interface TutorialSystemProps {
  gameType: string;
  isFirstTime: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function TutorialSystem({
  gameType,
  isFirstTime,
  onComplete,
  onSkip,
}: TutorialSystemProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: width / 2, y: height / 2 });
  const [spotlightSize, setSpotlightSize] = useState({ width: 100, height: 100 });

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const spotlightScale = useRef(new Animated.Value(1)).current;
  const arrowPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (isFirstTime) {
      setShowTutorial(true);
      setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 100);
    }
  }, [isFirstTime]);

  const getTutorialSteps = (): TutorialStep[] => {
    switch (gameType) {
      case 'photo-puzzle':
        return [
          {
            id: 'welcome',
            title: 'Welcome to Photo Puzzle!',
            description: 'Create custom puzzles from your photos. Let\'s learn how to play!',
            action: 'Tap to continue',
          },
          {
            id: 'select_photo',
            title: 'Choose Your Photo',
            description: 'Select a photo from your gallery or take a new one with your camera.',
            targetElement: {
              component: 'camera_button',
              position: { x: width / 2, y: height - 200 },
              size: { width: 60, height: 60 },
            },
            action: 'Tap the camera button',
          },
          {
            id: 'difficulty',
            title: 'Select Difficulty',
            description: 'Choose your challenge level. Start with Easy if you\'re new!',
            targetElement: {
              component: 'difficulty_selector',
              position: { x: width / 2, y: height / 2 },
              size: { width: 200, height: 120 },
            },
            action: 'Choose a difficulty level',
          },
          {
            id: 'game_board',
            title: 'Game Board',
            description: 'This is where the magic happens! Tap pieces to swap them and complete the puzzle.',
            targetElement: {
              component: 'game_board',
              position: { x: width / 2, y: height / 2 - 50 },
              size: { width: width - 40, height: 300 },
            },
            action: 'Try tapping a puzzle piece',
          },
          {
            id: 'timer',
            title: 'Track Your Progress',
            description: 'Keep an eye on your moves and time. Can you beat your best score?',
            targetElement: {
              component: 'stats',
              position: { x: width / 2, y: 60 },
              size: { width: 200, height: 40 },
            },
            action: 'Check your stats',
          },
        ];

      case 'memory-match':
        return [
          {
            id: 'welcome',
            title: 'Welcome to Memory Match!',
            description: 'Test your memory by finding matching pairs of cards.',
            action: 'Let\'s get started!',
          },
          {
            id: 'cards',
            title: 'Match the Cards',
            description: 'Tap two cards to flip them. Find all matching pairs to win!',
            targetElement: {
              component: 'cards_grid',
              position: { x: width / 2, y: height / 2 },
              size: { width: width - 40, height: 400 },
            },
            action: 'Try flipping a card',
          },
          {
            id: 'matches',
            title: 'Found a Match!',
            description: 'When you find a matching pair, the cards stay flipped. Find all pairs to win!',
            action: 'Keep matching!',
          },
        ];

      default:
        return [
          {
            id: 'welcome',
            title: 'Welcome!',
            description: 'Let\'s learn how to play this puzzle game.',
            action: 'Tap to continue',
          },
        ];
    }
  };

  const tutorialSteps = getTutorialSteps();
  const currentTutorialStep = tutorialSteps[currentStep];

  useEffect(() => {
    if (currentTutorialStep?.targetElement) {
      const { position, size } = currentTutorialStep.targetElement;

      setSpotlightPosition(position);
      setSpotlightSize(size);

      // Animate spotlight
      Animated.sequence([
        Animated.timing(spotlightScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(spotlightScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(spotlightScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep, spotlightScale]);

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark current step as completed
    if (currentTutorialStep) {
      setCompletedSteps(prev => [...prev, currentTutorialStep.id]);
    }

    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleComplete = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowTutorial(false);
      onComplete();
    });
  };

  const handleSkip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onSkip();
    setShowTutorial(false);
  };

  const renderSpotlight = () => {
    if (!currentTutorialStep?.targetElement) return null;

    const { x, y } = spotlightPosition;
    const { width: spotlightW, height: spotlightH } = spotlightSize;

    return (
      <>
        {/* Top overlay */}
        <Animated.View
          style={[
            styles.overlaySection,
            {
              height: y - spotlightH / 2,
            },
            {
              opacity: overlayOpacity,
            },
          ]}
        />

        {/* Left overlay */}
        <Animated.View
          style={[
            styles.overlaySection,
            styles.overlayLeft,
            {
              left: 0,
              top: y - spotlightH / 2,
              width: x - spotlightW / 2,
              height: spotlightH,
            },
            {
              opacity: overlayOpacity,
            },
          ]}
        />

        {/* Right overlay */}
        <Animated.View
          style={[
            styles.overlaySection,
            styles.overlayRight,
            {
              left: x + spotlightW / 2,
              top: y - spotlightH / 2,
              width: width - (x + spotlightW / 2),
              height: spotlightH,
            },
            {
              opacity: overlayOpacity,
            },
          ]}
        />

        {/* Bottom overlay */}
        <Animated.View
          style={[
            styles.overlaySection,
            {
              top: y + spotlightH / 2,
              height: height - (y + spotlightH / 2),
            },
            {
              opacity: overlayOpacity,
            },
          ]}
        />

        {/* Spotlight ring */}
        <Animated.View
          style={[
            styles.spotlight,
            {
              left: x - spotlightW / 2 - 4,
              top: y - spotlightH / 2 - 4,
              width: spotlightW + 8,
              height: spotlightH + 8,
              borderRadius: 12,
              transform: [{ scale: spotlightScale }],
            },
            {
              opacity: overlayOpacity,
            },
          ]}
        />
      </>
    );
  };

  const renderTutorialContent = () => {
    if (!currentTutorialStep) return null;

    const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

    return (
      <Animated.View
        style={[
          styles.tutorialContent,
          {
            opacity: overlayOpacity,
            transform: [
              {
                translateY: overlayOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {tutorialSteps.length}
          </Text>
        </View>

        {/* Tutorial Card */}
        <View style={styles.tutorialCard}>
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip Tutorial</Text>
          </TouchableOpacity>

          {/* Title and Description */}
          <View style={styles.tutorialHeader}>
            <Text style={styles.tutorialTitle}>{currentTutorialStep.title}</Text>
            <Text style={styles.tutorialDescription}>
              {currentTutorialStep.description}
            </Text>
          </View>

          {/* Action Hint */}
          {currentTutorialStep.action && (
            <View style={styles.actionHint}>
              <MaterialIcons name="touch-app" size={20} color="#6366F1" />
              <Text style={styles.actionText}>{currentTutorialStep.action}</Text>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.tutorialButtons}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handlePreviousStep}
              >
                <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Previous</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: currentStep === tutorialSteps.length - 1 ? '#10B981' : '#6366F1',
                },
              ]}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === tutorialSteps.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <MaterialIcons
                name={currentStep === tutorialSteps.length - 1 ? 'check' : 'arrow-forward'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (!showTutorial) return null;

  return (
    <Modal
      visible={showTutorial}
      transparent={true}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {renderSpotlight()}
        {renderTutorialContent()}
      </View>
    </Modal>
  );
}

export const TutorialHint: React.FC<{
  visible: boolean;
  text: string;
  position?: { x: number; y: number };
}> = ({ visible, text, position }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.hintContainer,
        {
          opacity,
          transform: [{ scale }],
          ...(position && {
            position: 'absolute',
            left: position.x - 75,
            top: position.y - 40,
          }),
        },
      ]}
    >
      <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
      <Text style={styles.hintText}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  overlayLeft: {
    position: 'absolute',
  },
  overlayRight: {
    position: 'absolute',
  },
  spotlight: {
    borderWidth: 3,
    borderColor: '#6366F1',
    backgroundColor: 'transparent',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  tutorialContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  tutorialHeader: {
    marginBottom: 24,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  tutorialDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'center',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  tutorialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    flex: 1,
    gap: 8,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 2,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: 150,
    zIndex: 1000,
  },
  hintText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});