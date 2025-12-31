import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Shuffle, Trophy, Eye, Undo, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";
import { PreviewModal } from "./PreviewModal";
import { soundManager } from "@/lib/sounds";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface Piece {
  id: number;
  correctIndex: number;
  placedIndex: number | null; // null = in tray, number = placed on board
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
        placedIndex: null, // All pieces start in the tray
        image: image,
      });
    }
    
    // Shuffle the pieces array for tray display order
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
          
          // If there's a piece on the slot, swap them
          if (pieceOnSlot) {
            pieceOnSlot.placedIndex = previousIndex;
          }
          
          piece.placedIndex = slotIndex;
          
          setPieces(newPieces);
          setMoves(moves + 1);
          setSelectedPiece(null);
          setMoveHistory([...moveHistory, { pieceId: selectedPiece, fromIndex: previousIndex, toIndex: slotIndex }]);
          
          // Check if piece is correctly placed
          if (piece.placedIndex === piece.correctIndex) {
            soundManager.place();
          }
          
          // Check if puzzle is solved
          checkSolved(newPieces);
        }
      }
    } else if (pieceOnSlot) {
      // Select the piece on the board
      soundManager.click();
      setSelectedPiece(pieceOnSlot.id);
    }
  };

  const handleBoardPieceClick = (pieceId: number, slotIndex: number) => {
    if (solved) return;
    
    if (selectedPiece === pieceId) {
      // Deselect or return to tray
      soundManager.click();
      setSelectedPiece(null);
    } else if (selectedPiece !== null) {
      // Swap with selected piece
      handleBoardSlotClick(slotIndex);
    } else {
      // Select this piece
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
      // Check if another piece was displaced
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
    <div className="container mx-auto px-4 py-4 max-w-4xl flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            ← Back
          </Button>
          <h2 className="text-xl font-bold text-foreground">Classic Jigsaw</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>Moves: {moves}</p>
            <p>Placed: {placedPiecesCount}/{pieceCount}</p>
            <p className="text-success">Correct: {correctPiecesCount}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
            size="sm"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={undoMove}
            variant="outline"
            size="sm"
            disabled={moveHistory.length === 0 || solved}
          >
            <Undo className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button
            onClick={initializePuzzle}
            variant="secondary"
            size="sm"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Restart
          </Button>
        </div>
      </div>

      {/* Board Area - Top Half */}
      <div className="flex-1 flex items-center justify-center mb-4 min-h-0">
        <div 
          className="relative bg-card/30 rounded-xl border-2 border-dashed border-border overflow-hidden"
          style={{
            aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
            maxHeight: '100%',
            maxWidth: '100%',
            width: 'auto',
            height: '100%',
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
                    relative border border-border/30 cursor-pointer transition-all
                    ${!pieceOnSlot ? 'hover:bg-primary/10' : ''}
                    ${selectedPiece !== null && !pieceOnSlot ? 'bg-primary/5 border-primary/50' : ''}
                  `}
                >
                  {pieceOnSlot && (
                    <div
                      className={`
                        absolute inset-1 rounded transition-all
                        ${selectedPiece === pieceOnSlot.id ? 'ring-4 ring-primary shadow-lg shadow-primary/50 scale-95' : ''}
                        ${isCorrect ? 'ring-2 ring-success/70' : ''}
                      `}
                      style={getPieceStyle(pieceOnSlot)}
                    >
                      {isCorrect && (
                        <div className="absolute top-1 right-1 bg-success rounded-full p-0.5">
                          <Check className="h-3 w-3 text-white" />
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

      {/* Tray Area - Bottom */}
      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-3 h-[150px] flex-shrink-0">
        <div className="text-xs text-muted-foreground mb-2 flex justify-between">
          <span>Piece Tray ({trayPieces.length} remaining)</span>
          <span className="text-muted-foreground/60">← Scroll to see more →</span>
        </div>
        <div 
          ref={trayRef}
          className="flex gap-3 overflow-x-auto pb-2 h-[110px] items-center scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{ scrollBehavior: 'smooth' }}
        >
          {trayPieces.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {solved ? "🎉 All pieces placed correctly!" : "All pieces placed on the board"}
            </div>
          ) : (
            trayPieces.map((piece) => (
              <div
                key={piece.id}
                onClick={() => handleTrayPieceClick(piece.id)}
                className={`
                  flex-shrink-0 w-20 h-20 rounded-lg cursor-pointer transition-all hover:scale-110
                  ${selectedPiece === piece.id 
                    ? 'ring-4 ring-primary shadow-lg shadow-primary/50 scale-110' 
                    : 'hover:ring-2 hover:ring-accent shadow-md'
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center animate-bounce-in bg-card p-8 rounded-2xl shadow-2xl">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-success to-success/70 rounded-full text-white font-bold text-lg shadow-lg mb-4">
              <Trophy className="h-6 w-6" />
              Puzzle Complete!
            </div>
            <p className="text-muted-foreground mb-4">Solved in {moves} moves</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={initializePuzzle} variant="default">
                <Shuffle className="mr-2 h-4 w-4" />
                Play Again
              </Button>
              <Button onClick={onBack} variant="outline">
                Back to Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      <PreviewModal image={image} isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
};
