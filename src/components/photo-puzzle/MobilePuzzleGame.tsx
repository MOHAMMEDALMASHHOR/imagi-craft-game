import { Button } from "../ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Shuffle, Trophy, Pause, Play, RotateCcw, Eye, Lightbulb, Undo } from "lucide-react";
import confetti from "canvas-confetti";
import { useIsMobile, useOrientation } from "@/hooks/use-mobile";
import { usePuzzleGame } from "@/hooks/use-puzzle-game";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";
import { PreviewModal } from "./PreviewModal";
import PuzzlePiece from "./PuzzlePiece";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface MobilePuzzleGameProps {
  image: string;
  difficulty: Difficulty;
  onBack: () => void;
}

const getMobilePieceCount = (difficulty: Difficulty, orientation: 'portrait' | 'landscape') => {
  // Mobile-optimized piece counts
  if (orientation === 'portrait') {
    switch (difficulty) {
      case "easy": return 12; // 4x3 grid
      case "medium": return 24; // 6x4 grid
      case "hard": return 48; // 8x6 grid
      case "expert": return 72; // 9x8 grid
    }
  } else {
    switch (difficulty) {
      case "easy": return 12; // 4x3 grid
      case "medium": return 20; // 5x4 grid
      case "hard": return 35; // 7x5 grid
      case "expert": return 56; // 8x7 grid
    }
  }
};

const getMobileGridSize = (difficulty: Difficulty, orientation: 'portrait' | 'landscape') => {
  if (orientation === 'portrait') {
    switch (difficulty) {
      case "easy": return { rows: 3, cols: 4 };
      case "medium": return { rows: 4, cols: 6 };
      case "hard": return { rows: 6, cols: 8 };
      case "expert": return { rows: 9, cols: 8 };
    }
  } else {
    switch (difficulty) {
      case "easy": return { rows: 3, cols: 4 };
      case "medium": return { rows: 4, cols: 5 };
      case "hard": return { rows: 5, cols: 7 };
      case "expert": return { rows: 8, cols: 7 };
    }
  }
};

const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const MobilePuzzleGame = ({ image, difficulty, onBack }: MobilePuzzleGameProps) => {
  const isMobile = useIsMobile();
  const orientation = useOrientation() || 'portrait';
  const pieceCount = getMobilePieceCount(difficulty, orientation);
  const gridSize = getMobileGridSize(difficulty, orientation);
  const [showPreview, setShowPreview] = useState(false);
  const { stats, saveRecord } = usePuzzleRecords();

  const {
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
    showHint,
    undoMove,
  } = usePuzzleGame({
    pieceCount,
    image,
    onSolved: (moves, time) => {
      saveRecord(difficulty, moves, time);
      const bestRecord = stats.bestRecords[difficulty as keyof typeof stats.bestRecords];
      const isNewRecord = !bestRecord || moves < bestRecord.moves;
      
      toast.success(
        `Puzzle solved in ${moves} moves and ${formatTime(time)}!` +
        (isNewRecord ? " 🎉 New Record!" : "")
      );
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    },
    autoSave: true,
    saveKey: `mobile-puzzle-${image}-${difficulty}`,
  });

  // Initialize puzzle if no pieces exist
  if (gameState.pieces.length === 0) {
    initializePuzzle();
  }

  const handlePieceInteraction = (pieceId: number, targetIndex: number) => {
    if (gameState.solved || gameState.isPaused) return;

    if (dragState.isDragging) {
      handleDrop(targetIndex);
    } else {
      handlePieceClick(targetIndex);
    }
  };

  const togglePause = () => {
    if (gameState.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset-bottom">
      {/* Header with controls */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-foreground min-h-[44px] min-w-[44px] -ml-2"
            >
              ← Back
            </Button>
            <h1 className="text-lg font-bold text-foreground">Swap Puzzle</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowPreview(true)}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              onClick={showHint}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              disabled={gameState.solved || gameState.showingHint}
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
            <Button
              onClick={undoMove}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              disabled={gameState.moveHistory.length === 0 || gameState.solved}
            >
              <Undo className="h-5 w-5" />
            </Button>
            <Button
              onClick={togglePause}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              disabled={gameState.solved}
            >
              {gameState.isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            <Button
              onClick={resetGame}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex justify-between text-sm px-1">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Moves: <span className="font-bold text-foreground">{gameState.moves}</span>
            </span>
            <span className="text-muted-foreground">
              Time: <span className="font-bold text-foreground">{formatTime(gameState.elapsedTime)}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-success font-medium">
              ✓ {gameState.correctPiecesCount}/{pieceCount}
            </span>
          </div>
        </div>
      </div>

      {/* Pause overlay */}
      {gameState.isPaused && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Pause className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Paused</h2>
            <p className="text-muted-foreground mb-6">Tap to continue</p>
            <Button onClick={resumeGame} size="lg" className="min-h-[52px] min-w-[140px] text-lg">
              Resume
            </Button>
          </div>
        </div>
      )}

      {/* Puzzle Grid */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <div
            className="grid gap-[2px] bg-card/50 p-2 rounded-xl backdrop-blur-sm mx-auto shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
            }}
          >
            {gameState.pieces
              .sort((a, b) => a.currentIndex - b.currentIndex)
              .map((piece) => (
                <PuzzlePiece
                  key={piece.id}
                  id={piece.id}
                  correctIndex={piece.correctIndex}
                  currentIndex={piece.currentIndex}
                  image={piece.image}
                  gridSize={gridSize}
                  isSelected={gameState.selectedPiece === piece.id}
                  isDragging={dragState.draggedPieceId === piece.id}
                  canDrop={dragState.isDragging && gameState.selectedPiece !== piece.id}
                  onClick={() => handlePieceInteraction(piece.id, piece.currentIndex)}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onDrop={(targetIndex) => handlePieceInteraction(piece.id, targetIndex)}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Success celebration */}
      {gameState.solved && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="text-center animate-bounce-in bg-card p-6 rounded-2xl shadow-2xl border border-border max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Complete!</h2>
            <p className="text-muted-foreground mb-6">
              {gameState.moves} moves • {formatTime(gameState.elapsedTime)}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetGame} className="min-h-[48px] flex-1 bg-gradient-to-r from-primary to-primary-glow">
                <Shuffle className="mr-2 h-4 w-4" />
                New Game
              </Button>
              <Button onClick={onBack} variant="outline" className="min-h-[48px]">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Touch instructions for new users */}
      {gameState.moves === 0 && !gameState.solved && !gameState.isPaused && (
        <div className="absolute top-28 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-sm text-foreground font-medium">
              Tap two pieces to swap them
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal image={image} isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
};

export default MobilePuzzleGame;