export type GameType =
  | 'photo-puzzle'
  | 'memory-match'
  | 'sliding-puzzle'
  | '2048'
  | 'sudoku'
  | 'word-search'
  | 'simon-says';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Game {
  id: GameType;
  title: string;
  description: string;
  icon: string;
  color: string;
  featured?: boolean;
  requiresCamera?: boolean;
  unlocked?: boolean;
}

export interface PuzzlePiece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  imageData?: string;
}

export interface GameState {
  pieces: PuzzlePiece[];
  selectedPiece: number | null;
  moves: number;
  score: number;
  solved: boolean;
  startTime: number | null;
  elapsedTime: number;
  isPaused: boolean;
  difficulty: Difficulty;
  image?: string;
}

export interface HighScore {
  gameType: GameType;
  score: number;
  moves: number;
  time: number;
  difficulty: Difficulty;
  date: string;
}

export interface UserStats {
  totalGamesPlayed: number;
  totalTimePlayed: number;
  favoriteGame: GameType | null;
  achievements: Achievement[];
  highScores: HighScore[];
  currentStreak: number;
  bestStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface DailyChallenge {
  id: string;
  gameType: GameType;
  puzzle: any;
  date: string;
  completed: boolean;
  bestScore?: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

export type ThemeType = 'light' | 'dark' | 'system';