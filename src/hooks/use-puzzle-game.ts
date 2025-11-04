import { useState, useEffect, useCallback } from "react";

export interface Piece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  image: string;
}

export interface PuzzleGameState {
  pieces: Piece[];
  selectedPiece: number | null;
  moves: number;
  solved: boolean;
  startTime: number | null;
  elapsedTime: number;
  isPaused: boolean;
  correctPiecesCount: number;
  showingHint: boolean;
  moveHistory: Array<{ piece1Index: number; piece2Index: number }>;
}

export interface UsePuzzleGameOptions {
  pieceCount: number;
  image: string;
  onSolved?: (moves: number, time: number) => void;
  autoSave?: boolean;
  saveKey?: string;
}

interface SavedState {
  pieces: Piece[];
  moves: number;
  startTime: number | null;
  elapsedTime: number;
  savedAt: number;
}

export const usePuzzleGame = ({
  pieceCount,
  image,
  onSolved,
  autoSave = true,
  saveKey = `puzzle-game-${image}`,
}: UsePuzzleGameOptions) => {
  const [gameState, setGameState] = useState<PuzzleGameState>({
    pieces: [],
    selectedPiece: null,
    moves: 0,
    solved: false,
    startTime: null,
    elapsedTime: 0,
    isPaused: false,
    correctPiecesCount: 0,
    showingHint: false,
    moveHistory: [],
  });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedPieceId: number | null;
    dragPosition: { x: number; y: number } | null;
  }>({
    isDragging: false,
    draggedPieceId: null,
    dragPosition: null,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameState.startTime && !gameState.solved && !gameState.isPaused) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime!,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.startTime, gameState.solved, gameState.isPaused]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && gameState.pieces.length > 0) {
      const savedState: SavedState = {
        pieces: gameState.pieces,
        moves: gameState.moves,
        startTime: gameState.startTime,
        elapsedTime: gameState.elapsedTime,
        savedAt: Date.now(),
      };

      localStorage.setItem(saveKey, JSON.stringify(savedState));
    }
  }, [gameState, autoSave, saveKey]);

  // Load saved state on mount
  useEffect(() => {
    if (autoSave) {
      try {
        const saved = localStorage.getItem(saveKey);
        if (saved) {
          const savedState: SavedState = JSON.parse(saved);

          // Only restore if saved within last 24 hours
          if (Date.now() - savedState.savedAt < 24 * 60 * 60 * 1000) {
            setGameState(prev => ({
              ...prev,
              pieces: savedState.pieces,
              moves: savedState.moves,
              startTime: savedState.startTime,
              elapsedTime: savedState.elapsedTime,
            }));
          }
        }
      } catch (error) {
        console.warn('Failed to load saved puzzle state:', error);
      }
    }
  }, [autoSave, saveKey]);

  const initializePuzzle = useCallback(() => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        currentIndex: i,
        correctIndex: i,
        image: image,
      });
    }

    // Shuffle pieces using Fisher-Yates algorithm
    for (let i = newPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPieces[i].currentIndex, newPieces[j].currentIndex] = [newPieces[j].currentIndex, newPieces[i].currentIndex];
    }

    // Ensure puzzle is solvable (not already solved)
    const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
    if (isSolved && newPieces.length > 1) {
      // Make one swap to ensure it's not solved
      [newPieces[0].currentIndex, newPieces[1].currentIndex] = [newPieces[1].currentIndex, newPieces[0].currentIndex];
    }

    const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
    
    setGameState({
      pieces: newPieces,
      selectedPiece: null,
      moves: 0,
      solved: false,
      startTime: Date.now(),
      elapsedTime: 0,
      isPaused: false,
      correctPiecesCount: correctCount,
      showingHint: false,
      moveHistory: [],
    });

    // Clear saved state
    if (autoSave) {
      localStorage.removeItem(saveKey);
    }
  }, [pieceCount, image, autoSave, saveKey]);

  const handlePieceClick = useCallback((index: number) => {
    if (gameState.solved || gameState.isPaused) return;

    setGameState(prev => {
      if (prev.selectedPiece === null) {
        return {
          ...prev,
          selectedPiece: index,
        };
      } else if (prev.selectedPiece === index) {
        return {
          ...prev,
          selectedPiece: null,
        };
      } else {
        // Swap pieces
        const newPieces = [...prev.pieces];
        const piece1 = newPieces.find(p => p.currentIndex === prev.selectedPiece);
        const piece2 = newPieces.find(p => p.currentIndex === index);

        if (piece1 && piece2) {
          [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];

          const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
          const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;

          if (isSolved && onSolved) {
            onSolved(prev.moves + 1, Date.now() - (prev.startTime || Date.now()));
          }

          return {
            ...prev,
            pieces: newPieces,
            moves: prev.moves + 1,
            selectedPiece: null,
            solved: isSolved,
            correctPiecesCount: correctCount,
            moveHistory: [...prev.moveHistory, { piece1Index: prev.selectedPiece!, piece2Index: index }],
          };
        }
      }
      return prev;
    });
  }, [gameState.solved, gameState.isPaused, onSolved]);

  const handleDragStart = useCallback((pieceId: number, clientX: number, clientY: number) => {
    setDragState({
      isDragging: true,
      draggedPieceId: pieceId,
      dragPosition: { x: clientX, y: clientY },
    });

    if (!gameState.solved && !gameState.isPaused) {
      setGameState(prev => ({
        ...prev,
        selectedPiece: pieceId,
      }));
    }
  }, [gameState.solved, gameState.isPaused]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    setDragState(prev => ({
      ...prev,
      dragPosition: { x: clientX, y: clientY },
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedPieceId: null,
      dragPosition: null,
    });
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (dragState.draggedPieceId === null || gameState.solved || gameState.isPaused) return;

    setGameState(prev => {
      const sourcePiece = prev.pieces.find(p => p.id === dragState.draggedPieceId);
      const targetPiece = prev.pieces.find(p => p.currentIndex === targetIndex);

      if (sourcePiece && targetPiece) {
        const newPieces = [...prev.pieces];
        [sourcePiece.currentIndex, targetPiece.currentIndex] = [targetPiece.currentIndex, sourcePiece.currentIndex];

        const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
        const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;

        if (isSolved && onSolved) {
          onSolved(prev.moves + 1, Date.now() - (prev.startTime || Date.now()));
        }

        return {
          ...prev,
          pieces: newPieces,
          moves: prev.moves + 1,
          selectedPiece: null,
          solved: isSolved,
          correctPiecesCount: correctCount,
          moveHistory: [...prev.moveHistory, { piece1Index: sourcePiece.currentIndex, piece2Index: targetIndex }],
        };
      }
      return prev;
    });
  }, [dragState.draggedPieceId, gameState.solved, gameState.isPaused, onSolved]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const resetGame = useCallback(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const clearSavedState = useCallback(() => {
    if (autoSave) {
      localStorage.removeItem(saveKey);
    }
  }, [autoSave, saveKey]);

  const showHint = useCallback(() => {
    if (gameState.solved) return;
    
    setGameState(prev => ({ ...prev, showingHint: true }));
    
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showingHint: false }));
    }, 2000);
  }, [gameState.solved]);

  const undoMove = useCallback(() => {
    setGameState(prev => {
      if (prev.moveHistory.length === 0) return prev;
      
      const lastMove = prev.moveHistory[prev.moveHistory.length - 1];
      const newPieces = [...prev.pieces];
      
      const piece1 = newPieces.find(p => p.currentIndex === lastMove.piece2Index);
      const piece2 = newPieces.find(p => p.currentIndex === lastMove.piece1Index);
      
      if (piece1 && piece2) {
        [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
        const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
        
        return {
          ...prev,
          pieces: newPieces,
          moves: Math.max(0, prev.moves - 1),
          moveHistory: prev.moveHistory.slice(0, -1),
          correctPiecesCount: correctCount,
        };
      }
      
      return prev;
    });
  }, []);

  return {
    gameState,
    dragState,
    initializePuzzle,
    handlePieceClick,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDrop,
    pauseGame,
    resumeGame,
    resetGame,
    clearSavedState,
    showHint,
    undoMove,
  };
};