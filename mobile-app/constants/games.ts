import { Game, GameType } from '@/types';

export const GAMES: Game[] = [
  {
    id: 'photo-puzzle',
    title: 'Photo Puzzle',
    description: 'Create puzzles from your photos',
    icon: 'camera',
    color: '#6366F1',
    featured: true,
    requiresCamera: true,
    unlocked: true,
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Find matching pairs of cards',
    icon: 'grid',
    color: '#10B981',
    unlocked: true,
  },
  {
    id: 'sliding-puzzle',
    title: 'Sliding Puzzle',
    description: 'Slide tiles to solve the puzzle',
    icon: 'move',
    color: '#F59E0B',
    unlocked: true,
  },
  {
    id: '2048',
    title: '2048',
    description: 'Merge tiles to reach 2048',
    icon: 'plus-square',
    color: '#EF4444',
    unlocked: true,
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Classic number puzzle game',
    icon: 'hash',
    color: '#8B5CF6',
    unlocked: true,
  },
  {
    id: 'word-search',
    title: 'Word Search',
    description: 'Find hidden words in the grid',
    icon: 'search',
    color: '#06B6D4',
    unlocked: true,
  },
  {
    id: 'simon-says',
    title: 'Simon Says',
    description: 'Remember and repeat the pattern',
    icon: 'lightbulb',
    color: '#EC4899',
    unlocked: true,
  },
];

export const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    color: '#10B981',
    description: 'Perfect for beginners',
  },
  medium: {
    label: 'Medium',
    color: '#F59E0B',
    description: 'A balanced challenge',
  },
  hard: {
    label: 'Hard',
    color: '#EF4444',
    description: 'Test your skills',
  },
  expert: {
    label: 'Expert',
    color: '#7C3AED',
    description: 'For puzzle masters',
  },
};

export const ACHIEVEMENTS = [
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Complete your first puzzle',
    icon: 'trophy',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a puzzle in under 2 minutes',
    icon: 'zap',
    unlocked: false,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete a puzzle with minimum moves',
    icon: 'star',
    unlocked: false,
  },
  {
    id: 'daily_player',
    title: 'Daily Player',
    description: 'Play 7 days in a row',
    icon: 'calendar',
    unlocked: false,
    maxProgress: 7,
  },
  {
    id: 'puzzle_master',
    title: 'Puzzle Master',
    description: 'Complete 100 puzzles',
    icon: 'crown',
    unlocked: false,
    maxProgress: 100,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Try all 7 game types',
    icon: 'compass',
    unlocked: false,
    maxProgress: 7,
  },
];

export const GAME_INSTRUCTIONS = {
  'photo-puzzle': {
    title: 'Photo Puzzle',
    instructions: [
      'Take or select a photo',
      'Choose difficulty level',
      'Tap pieces to swap them',
      'Arrange pieces to complete the image',
      'Use as few moves as possible!',
    ],
  },
  'memory-match': {
    title: 'Memory Match',
    instructions: [
      'Cards start face down',
      'Tap two cards to flip them',
      'Match pairs with the same image',
      'Remember card positions',
      'Find all pairs to win!',
    ],
  },
  'sliding-puzzle': {
    title: 'Sliding Puzzle',
    instructions: [
      'One tile space is empty',
      'Tap adjacent tiles to slide them',
      'Arrange tiles in numerical order',
      'The empty space should be bottom-right',
      'Plan your moves carefully!',
    ],
  },
  '2048': {
    title: '2048',
    instructions: [
      'Swipe to move all tiles',
      'Same numbers merge when they touch',
      'Create a tile with 2048 to win',
      'Each move adds a new tile',
      'Think ahead and plan merges!',
    ],
  },
  'sudoku': {
    title: 'Sudoku',
    instructions: [
      'Fill 9×9 grid with digits 1-9',
      'Each row, column, and 3×3 box needs all digits',
      'No repeating digits in any unit',
      'Use given numbers as clues',
      'Logic and patience are key!',
    ],
  },
  'word-search': {
    title: 'Word Search',
    instructions: [
      'Find words hidden in the letter grid',
      'Words can be horizontal, vertical, or diagonal',
      'Words may be forwards or backwards',
      'Tap and drag to select words',
      'Find all words to complete the puzzle!',
    ],
  },
  'simon-says': {
    title: 'Simon Says',
    instructions: [
      'Watch the color sequence carefully',
      'Repeat the sequence by tapping colors',
      'Each round adds one more color',
      'Sequence gets longer and faster',
      'How far can you go?',
    ],
  },
};

export const PUZZLE_SIZES = {
  'photo-puzzle': {
    easy: { rows: 3, cols: 4 },
    medium: { rows: 4, cols: 6 },
    hard: { rows: 6, cols: 8 },
    expert: { rows: 8, cols: 10 },
  },
  'memory-match': {
    easy: { pairs: 6 },
    medium: { pairs: 8 },
    hard: { pairs: 12 },
    expert: { pairs: 16 },
  },
  'sliding-puzzle': {
    easy: { size: 3 },
    medium: { size: 4 },
    hard: { size: 5 },
    expert: { size: 6 },
  },
};