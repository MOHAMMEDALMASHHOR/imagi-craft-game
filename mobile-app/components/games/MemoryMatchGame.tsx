import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { Difficulty, GameState } from '@/types';

const { width } = Dimensions.get('window');

const CARD_EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸', '🎺', '🎮', '🎯', '🎨'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  difficulty: Difficulty;
  onExit: () => void;
  onGameComplete: (moves: number, time: number) => void;
}

export default function MemoryMatchGame({ difficulty, onExit, onGameComplete }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && startTime && !isGameComplete()) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, startTime, cards]);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const getPairsCount = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 6;
      case 'medium': return 8;
      case 'hard': return 12;
      case 'expert': return 16;
    }
  };

  const initializeGame = () => {
    const pairsCount = getPairsCount(difficulty);
    const selectedEmojis = CARD_EMOJIS.slice(0, pairsCount);
    const gameCards: Card[] = [];

    // Create pairs
    selectedEmojis.forEach((emoji, index) => {
      gameCards.push({ id: index * 2, emoji, isFlipped: false, isMatched: false });
      gameCards.push({ id: index * 2 + 1, emoji, isFlipped: false, isMatched: false });
    });

    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    setCards(gameCards);
    setSelectedCards([]);
    setMoves(0);
    setGameStarted(false);
    setStartTime(null);
    setElapsedTime(0);
    setIsProcessing(false);
  };

  const isGameComplete = () => {
    return cards.length > 0 && cards.every(card => card.isMatched);
  };

  const handleCardPress = useCallback((cardId: number) => {
    if (isProcessing) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Flip the card
    setCards(prevCards =>
      prevCards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    // Check for match if two cards are selected
    if (newSelectedCards.length === 2) {
      setIsProcessing(true);
      setMoves(moves + 1);

      const [firstId, secondId] = newSelectedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);

          // Check if game is complete
          const updatedCards = cards.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true }
              : c
          );

          if (updatedCards.every(c => c.isMatched)) {
            const finalTime = Date.now() - (startTime || Date.now());
            Alert.alert(
              'Congratulations! 🎉',
              `You found all pairs in ${moves + 1} moves!`,
              [{ text: 'OK', onPress: () => onGameComplete(moves + 1, finalTime) }]
            );
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  }, [cards, selectedCards, moves, gameStarted, startTime, onGameComplete, onExit, isProcessing]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCardSize = () => {
    const pairsCount = getPairsCount(difficulty);
    const totalCards = pairsCount * 2;
    const columns = Math.ceil(Math.sqrt(totalCards));
    return (width - 48) / columns - 8; // 48 for padding, 8 for margins
  };

  const renderCard = (card: Card) => {
    const cardSize = getCardSize();
    const flipValue = new Animated.Value(card.isFlipped ? 1 : 0);

    const frontInterpolate = flipValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '0deg'],
    });

    const animatedStyle = {
      transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
      transform: [{ rotateY: backInterpolate }],
    };

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          {
            width: cardSize,
            height: cardSize,
            opacity: card.isMatched ? 0.6 : 1,
          }
        ]}
        onPress={() => handleCardPress(card.id)}
        disabled={card.isFlipped || card.isMatched || isProcessing}
        activeOpacity={0.8}
      >
        {/* Card Back */}
        <Animated.View style={[styles.cardBack, animatedStyle]}>
          <MaterialIcons name="question-mark" size={cardSize * 0.4} color="#6366F1" />
        </Animated.View>

        {/* Card Front */}
        <Animated.View style={[styles.cardFront, backAnimatedStyle]}>
          <Text style={[styles.cardEmoji, { fontSize: cardSize * 0.5 }]}>
            {card.emoji}
          </Text>
          {card.isMatched && (
            <View style={styles.matchedOverlay}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onExit}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.stats}>
          <Text style={styles.stat}>Moves: {moves}</Text>
          <Text style={styles.stat}>Time: {formatTime(elapsedTime)}</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={initializeGame}>
          <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.cardsGrid}>
          {cards.map(renderCard)}
        </View>
      </View>
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
  gameArea: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    backfaceVisibility: 'hidden',
  },
  cardEmoji: {
    textAlign: 'center',
  },
  matchedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});