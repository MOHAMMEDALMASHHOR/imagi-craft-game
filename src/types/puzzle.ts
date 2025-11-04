export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Piece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  image: string;
}

export interface GameState {
  pieces: Piece[];
  selectedPiece: number | null;
  moves: number;
  solved: boolean;
  correctPiecesCount: number;
  showingHint: boolean;
  moveHistory: Array<{ piece1Index: number; piece2Index: number }>;
  elapsedTime: number;
  isPaused: boolean;
}

export interface DragState {
  draggedPieceId: number | null;
  dragPosition: { x: number; y: number };
  isDragging: boolean;
}
