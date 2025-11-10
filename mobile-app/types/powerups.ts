export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'hint' | 'time' | 'moves' | 'reveal' | 'shuffle';
  duration?: number;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect?: string;
}

export interface UserPowerUps {
  [powerUpId: string]: number;
}

export interface GamePowerUp {
  powerUp: PowerUp;
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    description: 'Freezes the timer for 30 seconds',
    icon: 'snowflake',
    type: 'time',
    duration: 30000,
    cost: 100,
    rarity: 'common',
    effect: 'Freezes game timer for specified duration',
  },
  {
    id: 'hint_eye',
    name: 'Hint Eye',
    description: 'Reveals the position of one correct piece',
    icon: 'eye',
    type: 'hint',
    cost: 150,
    rarity: 'common',
    effect: 'Shows one correct piece position',
  },
  {
    id: 'move_saver',
    name: 'Move Saver',
    description: 'Reduces move count by 5',
    icon: 'minus-circle',
    type: 'moves',
    cost: 200,
    rarity: 'rare',
    effect: 'Decreases total move counter by 5',
  },
  {
    id: 'piece_reveal',
    name: 'Piece Revealer',
    description: 'Shows 3 random correct pieces for 10 seconds',
    icon: 'visibility',
    type: 'reveal',
    duration: 10000,
    cost: 250,
    rarity: 'rare',
    effect: 'Temporarily reveals correct piece positions',
  },
  {
    id: 'lucky_shuffle',
    name: 'Lucky Shuffle',
    description: 'Shuffles pieces to get closer to solution',
    icon: 'shuffle',
    type: 'shuffle',
    cost: 300,
    rarity: 'epic',
    effect: 'Intelligently shuffles pieces towards correct positions',
  },
  {
    id: 'auto_solve',
    name: 'Auto Solver',
    description: 'Automatically solves 10% of the puzzle',
    icon: 'auto-fix-high',
    type: 'reveal',
    cost: 500,
    rarity: 'legendary',
    effect: 'Automatically places 10% of pieces correctly',
  },
  {
    id: 'double_xp',
    name: 'Double XP',
    description: '2x experience points for next game',
    icon: 'stars',
    type: 'time',
    duration: 0, // One-time use
    cost: 400,
    rarity: 'epic',
    effect: 'Doubles experience gained from next completed game',
  },
  {
    id: 'perfect_vision',
    name: 'Perfect Vision',
    description: 'Shows the complete solution for 5 seconds',
    icon: 'remove-red-eye',
    type: 'reveal',
    duration: 5000,
    cost: 350,
    rarity: 'epic',
    effect: 'Temporarily shows complete solved puzzle',
  },
];

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export const getPowerUpRarity = (powerUp: PowerUp): string => {
  switch (powerUp.rarity) {
    case 'common': return 'Common';
    case 'rare': return 'Rare';
    case 'epic': return 'Epic';
    case 'legendary': return 'Legendary';
    default: return 'Common';
  }
};