import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Shuffle, Trophy, Eye, Undo, Check, ArrowLeft, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";
import { PreviewModal } from "./PreviewModal";
import { soundManager } from "@/lib/sounds";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface Piece {
  id: number;
  correctIndex: number;
  placedIndex: number | null;
  image: string;
}

interface ClassicJigsawGameProps {
  image: string;
  difficulty: Difficulty;
  onBack: () => void;
}

const getPieceCount = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return 9;
    case "medium": return 16;
    case "hard": return 25;
    case "expert": return 36;
  }
};

const getGridSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return { rows: 3, cols: 3 };
    case "medium": return { rows: 4, cols: 4 };
    case "hard": return { rows: 5, cols: 5 };
    case "expert": return { rows: 6, cols: 6 };
  }
};

export const ClassicJigsawGame = ({ image, difficulty, onBack }: ClassicJigsawGameProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const { stats, saveRecord } = usePuzzleRecords();
  const trayRef = useRef<HTMLDivElement>(null);

  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Array<{ pieceId: number; fromIndex: number | null; toIndex: number | null }>>([]);
  
  const gridSize = getGridSize(difficulty);
  const pieceCount = getPieceCount(difficulty);

  useEffect(() => {
    initializePuzzle();
  }, []);

  const initializePuzzle = () => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        correctIndex: i,
        placedIndex: null,
        image: image,
      });
    }
    
    for (let i = newPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPieces[i], newPieces[j]] = [newPieces[j], newPieces[i]];
    }
    
    setPieces(newPieces);
    setMoves(0);
    setSolved(false);
    setSelectedPiece(null);
    setMoveHistory([]);
  };

  const handleTrayPieceClick = (pieceId: number) => {
    if (solved) return;
    soundManager.click();
    
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    } else {
      setSelectedPiece(pieceId);
    }
  };

  const handleBoardSlotClick = (slotIndex: number) => {
    if (solved) return;

    const pieceOnSlot = pieces.find(p => p.placedIndex === slotIndex);
    
    if (selectedPiece !== null) {
      const selectedPieceObj = pieces.find(p => p.id === selectedPiece);
      
      if (selectedPieceObj) {
        soundManager.move();
        const newPieces = [...pieces];
        const piece = newPieces.find(p => p.id === selectedPiece);
        
        if (piece) {
          const previousIndex = piece.placedIndex;
          
          if (pieceOnSlot) {
            pieceOnSlot.placedIndex = previousIndex;
          }
          
          piece.placedIndex = slotIndex;
          
          setPieces(newPieces);
          setMoves(moves + 1);
          setSelectedPiece(null);
          setMoveHistory([...moveHistory, { pieceId: selectedPiece, fromIndex: previousIndex, toIndex: slotIndex }]);
          
          if (piece.placedIndex === piece.correctIndex) {
            soundManager.place();
          }
          
          checkSolved(newPieces);
        }
      }
    } else if (pieceOnSlot) {
      soundManager.click();
      setSelectedPiece(pieceOnSlot.id);
    }
  };

  const handleBoardPieceClick = (pieceId: number, slotIndex: number) => {
    if (solved) return;
    
    if (selectedPiece === pieceId) {
      soundManager.click();
      setSelectedPiece(null);
    } else if (selectedPiece !== null) {
      handleBoardSlotClick(slotIndex);
    } else {
      soundManager.click();
      setSelectedPiece(pieceId);
    }
  };

  const checkSolved = (currentPieces: Piece[]) => {
    const allPlaced = currentPieces.every(p => p.placedIndex !== null);
    const allCorrect = currentPieces.every(p => p.placedIndex === p.correctIndex);
    
    if (allPlaced && allCorrect) {
      setSolved(true);
      saveRecord(difficulty, moves + 1, Date.now());
      const bestRecord = stats.bestRecords[difficulty as keyof typeof stats.bestRecords];
      const isNewRecord = !bestRecord || moves + 1 < bestRecord.moves;
      
      soundManager.win();
      toast.success(`Puzzle solved in ${moves + 1} moves!` + (isNewRecord ? " 🎉 New Record!" : ""));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const undoMove = () => {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const newPieces = [...pieces];
    const piece = newPieces.find(p => p.id === lastMove.pieceId);
    
    if (piece) {
      const displacedPiece = newPieces.find(p => p.id !== lastMove.pieceId && p.placedIndex === lastMove.fromIndex);
      if (displacedPiece) {
        displacedPiece.placedIndex = lastMove.toIndex;
      }
      
      piece.placedIndex = lastMove.fromIndex;
      setPieces(newPieces);
      setMoves(Math.max(0, moves - 1));
      setMoveHistory(moveHistory.slice(0, -1));
    }
  };

  const getPieceStyle = (piece: Piece) => {
    const col = piece.correctIndex % gridSize.cols;
    const row = Math.floor(piece.correctIndex / gridSize.cols);
    const percentX = gridSize.cols > 1 ? (col * 100) / (gridSize.cols - 1) : 50;
    const percentY = gridSize.rows > 1 ? (row * 100) / (gridSize.rows - 1) : 50;

    return {
      backgroundImage: `url(${piece.image})`,
      backgroundPosition: `${percentX}% ${percentY}%`,
      backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
    };
  };

  const trayPieces = pieces.filter(p => p.placedIndex === null);
  const placedPiecesCount = pieces.filter(p => p.placedIndex !== null).length;
  const correctPiecesCount = pieces.filter(p => p.placedIndex === p.correctIndex).length;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-inset-bottom">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">Classic Jigsaw</h1>
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
              onClick={undoMove}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              disabled={moveHistory.length === 0 || solved}
            >
              <Undo className="h-5 w-5" />
            </Button>
            <Button
              onClick={initializePuzzle}
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex justify-between items-center text-sm px-1">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Moves: <span className="font-bold text-foreground">{moves}</span>
            </span>
            <span className="text-muted-foreground">
              Placed: <span className="font-bold text-foreground">{placedPiecesCount}/{pieceCount}</span>
            </span>
          </div>
          <span className="text-success font-medium">
            ✓ {correctPiecesCount}
          </span>
        </div>
      </div>

      {/* Board Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 min-h-0">
        <div 
          className="relative bg-card/30 rounded-xl border-2 border-dashed border-border/50 overflow-hidden w-full max-w-[min(100%,70vh)]"
          style={{
            aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
          }}
        >
          {/* Ghost image background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Grid slots */}
          <div 
            className="relative grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
            }}
          >
            {Array.from({ length: pieceCount }).map((_, slotIndex) => {
              const pieceOnSlot = pieces.find(p => p.placedIndex === slotIndex);
              const isCorrect = pieceOnSlot?.correctIndex === slotIndex;
              
              return (
                <div
                  key={slotIndex}
                  onClick={() => pieceOnSlot 
                    ? handleBoardPieceClick(pieceOnSlot.id, slotIndex) 
                    : handleBoardSlotClick(slotIndex)
                  }
                  className={`
                    relative border border-border/20 cursor-pointer transition-all
                    ${!pieceOnSlot ? 'hover:bg-primary/10 active:bg-primary/20' : ''}
                    ${selectedPiece !== null && !pieceOnSlot ? 'bg-primary/10 border-primary/40' : ''}
                  `}
                >
                  {pieceOnSlot && (
                    <div
                      className={`
                        absolute inset-[2px] rounded-sm transition-all
                        ${selectedPiece === pieceOnSlot.id ? 'ring-3 ring-primary shadow-lg shadow-primary/50 scale-95' : ''}
                        ${isCorrect ? 'ring-2 ring-success/70' : ''}
                      `}
                      style={getPieceStyle(pieceOnSlot)}
                    >
                      {isCorrect && (
                        <div className="absolute top-0.5 right-0.5 bg-success rounded-full p-0.5">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tray Area */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border px-4 py-3 pb-6">
        <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
          <span className="font-medium">{trayPieces.length} pieces left</span>
          {trayPieces.length > 0 && (
            <span className="text-muted-foreground/60">Swipe →</span>
          )}
        </div>
        <div 
          ref={trayRef}
          className="flex gap-2 overflow-x-auto pb-2 min-h-[72px] items-center snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {trayPieces.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-4">
              {solved ? "🎉 Puzzle complete!" : "All pieces on board"}
            </div>
          ) : (
            trayPieces.map((piece) => (
              <div
                key={piece.id}
                onClick={() => handleTrayPieceClick(piece.id)}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-lg cursor-pointer transition-all snap-start
                  ${selectedPiece === piece.id 
                    ? 'ring-3 ring-primary shadow-lg shadow-primary/50 scale-110' 
                    : 'hover:ring-2 hover:ring-primary/50 active:scale-95 shadow-md'
                  }
                `}
                style={getPieceStyle(piece)}
              />
            ))
          )}
        </div>
      </div>

      {/* Success overlay */}
      {solved && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="text-center animate-bounce-in bg-card p-6 rounded-2xl shadow-2xl border border-border max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Complete!</h2>
            <p className="text-muted-foreground mb-6">Solved in {moves} moves</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={initializePuzzle} className="min-h-[48px] flex-1 bg-gradient-to-r from-primary to-primary-glow">
                <Shuffle className="mr-2 h-4 w-4" />
                Play Again
              </Button>
              <Button onClick={onBack} variant="outline" className="min-h-[48px]">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <PreviewModal image={image} isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
};
