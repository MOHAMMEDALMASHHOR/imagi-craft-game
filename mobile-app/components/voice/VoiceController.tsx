import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Vibration,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VoiceCommand {
  id: string;
  command: string;
  keywords: string[];
  action: () => void;
  category: 'game' | 'ui' | 'help' | 'accessibility';
  enabled: boolean;
  confidence: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  partial: boolean;
}

interface VoiceControllerProps {
  onVoiceCommand: (command: string, confidence: number) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceController({
  onVoiceCommand,
  onError,
  disabled = false,
}: VoiceControllerProps) {
  const [isListening, setIsListening] = useState(false);
  [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  [isVoiceSupported, setIsVoiceSupported] = useState(false);
  [recognitionResult, setRecognitionResult] = useState<SpeechRecognitionResult | null>(null);
  [showCommands, setShowCommands] = useState(false);
  [voiceLevel, setVoiceLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const animationValue = useRef(new Animated.Value(0)).current;
  const voiceLevelAnimation = useRef(new Animated.Value(0)).current;

  const availableCommands: VoiceCommand[] = [
    // Game commands
    {
      id: 'hint',
      command: 'hint',
      keywords: ['hint', 'help me', 'stuck', 'need help'],
      action: () => onVoiceCommand('hint', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'shuffle',
      command: 'shuffle',
      keywords: ['shuffle', 'randomize', 'new game', 'reset'],
      action: () => onVoiceCommand('shuffle', 0.8),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'pause',
      command: 'pause',
      keywords: ['pause', 'stop', 'break', 'hold on'],
      action: () => onVoiceCommand('pause', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'resume',
      command: 'resume',
      keywords: ['resume', 'continue', 'play', 'start'],
      action: () => onVoiceCommand('resume', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'solve',
      command: 'solve',
      keywords: ['solve', 'complete', 'finish', 'auto solve'],
      action: () => onVoiceCommand('solve', 0.7),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'undo',
      command: 'undo',
      keywords: ['undo', 'take back', 'go back'],
      action: () => onVoiceCommand('undo', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'next',
      command: 'next',
      keywords: ['next', 'forward', 'skip'],
      action: () => onVoiceCommand('next', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'previous',
      command: 'previous',
      keywords: ['previous', 'back', 'go back'],
      action: () => onVoiceCommand('previous', 0.9),
      category: 'game',
      enabled: true,
      confidence: 0,
    },

    // UI commands
    {
      id: 'zoom_in',
      command: 'zoom in',
      keywords: ['zoom in', 'make bigger', 'enlarge'],
      action: () => onVoiceCommand('zoom_in', 0.8),
      category: 'ui',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'zoom_out',
      command: 'zoom out',
      keywords: ['zoom out', 'make smaller', 'reduce'],
      action: () => onVoiceCommand('zoom_out', 0.8),
      category: 'ui',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'menu',
      command: 'menu',
      keywords: ['menu', 'options', 'settings'],
      action: () => onVoiceCommand('menu', 0.9),
      category: 'ui',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'close',
      command: 'close',
      keywords: ['close', 'exit', 'quit', 'cancel'],
      action: () => onVoiceCommand('close', 0.9),
      category: 'ui',
      enabled: true,
      confidence: 0,
    },

    // Help commands
    {
      id: 'commands',
      command: 'commands',
      keywords: ['commands', 'what can i say', 'voice commands'],
      action: () => setShowCommands(true),
      category: 'help',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'voice_on',
      command: 'voice on',
      keywords: ['voice on', 'enable voice', 'start listening'],
      action: () => setIsVoiceEnabled(true),
      category: 'accessibility',
      enabled: true,
      confidence: 0,
    },
    {
      id: 'voice_off',
      command: 'voice off',
      keywords: ['voice off', 'disable voice', 'stop listening'],
      action: () => setIsVoiceEnabled(false),
      category: 'accessibility',
      enabled: true,
      confidence: 0,
    },
  ];

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = async () => {
    try {
      // Check if speech recognition is available
      const isAvailable = await checkSpeechRecognitionSupport();
      setIsVoiceSupported(isAvailable);

      if (isAvailable && Platform.OS === 'web') {
        // Web Speech Recognition API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition('en-US');

          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            animateListening(true);
          };

          recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.toLowerCase().trim();

            setRecognitionResult({
              transcript,
              confidence: result[0].confidence,
              isFinal: result.isFinal,
              partial: !result.isFinal,
            });

            updateVoiceLevel(result[0]);

            if (result.isFinal) {
              processVoiceCommand(transcript, result[0].confidence);
            }
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            animateListening(false);

            if (onError) {
              onError(`Voice recognition error: ${event.error}`);
            }

            // Handle specific errors
            if (event.error === 'network') {
              setTimeout(() => startListening(), 2000);
            }
          };

          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
            animateListening(false);

            // Auto-restart if still enabled
            if (isVoiceEnabled && !disabled) {
              setTimeout(() => startListening(), 1000);
            }
          };

          recognitionRef.current = recognition;

          // Start listening if enabled
          if (isVoiceEnabled) {
            setTimeout(() => startListening(), 1000);
          }
        }
      }

      // For mobile, we'd need to implement a different solution
      // This could use native speech recognition libraries or cloud services

    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setIsVoiceSupported(false);
      if (onError) {
        onError(`Failed to initialize voice control: ${error.message}`);
      }
    }
  };

  const checkSpeechRecognitionSupport = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      return false; // Would need native implementation
    }

    return !!(window as any).SpeechRecognition && !!(window as any).webkitSpeechRecognition;
  };

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled || !isVoiceEnabled || isListening) {
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (onError) {
        onError(`Failed to start listening: ${error.message}`);
      }
    }
  }, [isListening, disabled, isVoiceEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const processVoiceCommand = useCallback((transcript: string, confidence: number) => {
    const cleanedTranscript = transcript.toLowerCase().trim();
    let bestMatch: VoiceCommand | null = null;
    let bestScore = 0;

    // Find best matching command
    for (const command of availableCommands) {
      if (!command.enabled) continue;

      const score = calculateCommandScore(cleanedTranscript, command);
      if (score > bestScore && score > 0.5) {
        bestMatch = command;
        bestScore = score;
      }
    }

    if (bestMatch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      bestMatch.action();
      onVoiceCommand(bestMatch.command, confidence);
    }
  }, []);

  const calculateCommandScore = (transcript: string, command: VoiceCommand): number => {
    let score = 0;

    // Exact match
    if (transcript === command.command) {
      score += 1;
    }

    // Keyword matching
    for (const keyword of command.keywords) {
      if (transcript.includes(keyword)) {
        score += 0.8;
      }
    }

    // Fuzzy matching for partial commands
    if (calculateLevenshteinDistance(transcript, command.command) <= 2) {
      score += 0.6;
    }

    for (const keyword of command.keywords) {
      if (calculateLevenshteinDistance(transcript, keyword) <= 1) {
        score += 0.4;
      }
    }

    return Math.min(score, 1);
  };

  const calculateLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = [j];
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }

    return matrix[str1.length][str2.length];
  };

  const animateListening = useCallback((listening: boolean) => {
    Animated.timing(animationValue, {
      toValue: listening ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const updateVoiceLevel = useCallback((result: any) => {
    if (result.confidence > 0) {
      Animated.timing(voiceLevelAnimation, {
        toValue: result.confidence,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
      {
        rotate: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '10deg'],
        }),
      },
    ],
  }));

  const voiceLevelAnimatedStyle = useAnimatedStyle(() => ({
    width: voiceLevelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 60],
    }),
  }));

  return (
    <View style={styles.container}>
      {/* Voice Control Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          {
            backgroundColor: isListening ? '#10B981' : '#6366F1',
          },
          disabled,
        ]}
        onPress={toggleListening}
        disabled={disabled || !isVoiceSupported}
      >
        <Animated.View style={animatedStyle}>
          <MaterialIcons
            name={isListening ? 'mic' : 'mic-none'}
            size={24}
            color="#FFFFFF"
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Voice Level Indicator */}
      {isListening && (
        <View style={styles.voiceIndicator}>
          <Animated.View
            style={[
              styles.voiceLevelBar,
              voiceLevelAnimatedStyle,
            ]}
          />
        </View>
      )}

      {/* Transcription Display */}
      {recognitionResult && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>
            {recognitionResult.transcript}
            {recognitionResult.partial && <Text style={styles.partialText}>(partial)</Text>}
          </Text>
          <Text style={styles.confidenceText}>
            {Math.round(recognitionResult.confidence * 100)}%
          </Text>
        </View>
      )}

      {/* Voice Commands Help */}
      <Modal
        visible={showCommands}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommands(false)}
      >
        <View style={styles.commandsModal}>
          <View style={styles.commandsHeader}>
            <Text style={styles.commandsTitle}>Voice Commands</Text>
            <TouchableOpacity onPress={() => setShowCommands(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.commandsContent}>
            {availableCommands
              .filter(cmd => cmd.enabled)
              .map((command) => (
                <View key={command.id} style={styles.commandItem}>
                  <View style={styles.commandCategory}>
                    <MaterialIcons
                      name={
                        command.category === 'game' ? 'gamepad' :
                        command.category === 'ui' ? 'settings' :
                        command.category === 'help' ? 'help' :
                        'accessibility-new'
                      }
                      size={16}
                      color={command.category === 'game' ? '#10B981' :
                              command.category === 'ui' ? '#6366F1' :
                              command.category === 'help' ? '#F59E0B' :
                              '#8B5CF6'}
                    />
                  </View>
                  <View style={styles.commandDetails}>
                    <Text style={styles.commandText}>
                      {command.command.charAt(0).toUpperCase() + command.command.slice(1)}
                    </Text>
                    <Text style={styles.commandKeywords}>
                      {command.keywords.join(', ')}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          <View style={styles.commandsFooter}>
            <TouchableOpacity
              style={styles.toggleVoiceButton}
              onPress={() => setIsVoiceEnabled(!isVoiceEnabled)}
            >
              <MaterialIcons
                name={isVoiceEnabled ? 'record-voice-over' : 'voice-over-off'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.toggleVoiceText}>
                {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  voiceButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  voiceIndicator: {
    position: 'absolute',
    top: 160,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLevelBar: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginVertical: 4,
  },
  transcriptionContainer: {
    position: 'absolute',
    top: 180,
    right: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transcriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  partialText: {
    fontSize: 12,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  confidenceText: {
    fontSize: 12,
    color: '#10B981',
  },
  commandsModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  commandsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commandsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  commandsContent: {
    maxHeight: 400,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commandCategory: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commandDetails: {
    flex: 1,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  commandKeywords: {
    fontSize: 12,
    color: '#6B7280',
  },
  commandsFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  toggleVoiceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});