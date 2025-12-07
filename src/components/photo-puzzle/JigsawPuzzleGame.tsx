import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Shuffle, Trophy, Eye, Undo, Grid3X3, Puzzle } from "lucide-react";
import confetti from "canvas-confetti";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";
import { PreviewModal } from "./PreviewModal";
import { soundManager } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type GameMode = "swap" | "pick-place";

interface JigsawPiece {
  id: number;
  correctIndex: number;
  currentIndex: number; // -1 means in the piece tray
  image: string;
  edges: {
    top: "flat" | "tab" | "blank";
    right: "flat" | "tab" | "blank";
    bottom: "flat" | "tab" | "blank";
    left: "flat" | "tab" | "blank";
  };
}

interface JigsawPuzzleGameProps {
  image: string;
  difficulty: Difficulty;
  onBack: () => void;
}

const getPieceCount = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return 9; // 3x3
    case "medium": return 16; // 4x4
    case "hard": return 25; // 5x5
    case "expert": return 36; // 6x6
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

// Generate edge patterns for jigsaw pieces
const generateEdges = (index: number, rows: number, cols: number): JigsawPiece["edges"] => {
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  // Create deterministic but varied pattern based on position
  const getEdgeType = (seed: number): "tab" | "blank" => {
    return seed % 2 === 0 ? "tab" : "blank";
  };
  
  return {
    top: row === 0 ? "flat" : (getEdgeType(index + col) === "tab" ? "blank" : "tab"),
    right: col === cols - 1 ? "flat" : getEdgeType(index * 2 + 1),
    bottom: row === rows - 1 ? "flat" : getEdgeType(index * 3),
    left: col === 0 ? "flat" : (getEdgeType((index - 1) * 2 + 1) === "tab" ? "blank" : "tab"),
  };
};

export const JigsawPuzzleGame = ({ image, difficulty, onBack }: JigsawPuzzleGameProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("swap");
  const { stats, saveRecord } = usePuzzleRecords();
  
  const [pieces, setPieces] = useState<JigsawPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [correctPiecesCount, setCorrectPiecesCount] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Array<{ piece1Id: number; piece1Index: number; piece2Id: number; piece2Index: number }>>([]);
  
  const gridSize = getGridSize(difficulty);
  const pieceCount = getPieceCount(difficulty);
  const containerRef = useRef<HTMLDivElement>(null);

  const initializePuzzle = useCallback(() => {
    const newPieces: JigsawPiece[] = [];
    
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        correctIndex: i,
        currentIndex: gameMode === "pick-place" ? -1 : i, // -1 for tray in pick-place mode
        image: image,
        edges: generateEdges(i, gridSize.rows, gridSize.cols),
      });
    }
    
    if (gameMode === "swap") {
      // Shuffle pieces for swap mode
      for (let i = newPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPieces[i].currentIndex, newPieces[j].currentIndex] = 
          [newPieces[j].currentIndex, newPieces[i].currentIndex];
      }
      
      // Ensure not already solved
      const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
      if (isSolved && newPieces.length > 1) {
        [newPieces[0].currentIndex, newPieces[1].currentIndex] = 
          [newPieces[1].currentIndex, newPieces[0].currentIndex];
      }
    } else {
      // Shuffle order of pieces in tray for pick-place mode
      for (let i = newPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPieces[i], newPieces[j]] = [newPieces[j], newPieces[i]];
      }
    }
    
    const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
    
    setPieces(newPieces);
    setMoves(0);
    setSolved(false);
    setCorrectPiecesCount(correctCount);
    setMoveHistory([]);
    setSelectedPiece(null);
  }, [pieceCount, image, gridSize.rows, gridSize.cols, gameMode]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  const checkSolved = useCallback((piecesArray: JigsawPiece[]) => {
    const allPlaced = piecesArray.every(p => p.currentIndex >= 0);
    const allCorrect = piecesArray.every(p => p.currentIndex === p.correctIndex);
    return allPlaced && allCorrect;
  }, []);

  const handlePieceClick = (pieceId: number, targetIndex: number) => {
    if (solved) return;
    
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    if (gameMode === "swap") {
      if (selectedPiece === null) {
        soundManager.click();
        setSelectedPiece(pieceId);
      } else if (selectedPiece === pieceId) {
        setSelectedPiece(null);
      } else {
        // Swap pieces
        soundManager.move();
        const newPieces = [...pieces];
        const piece1 = newPieces.find(p => p.id === selectedPiece);
        const piece2 = newPieces.find(p => p.id === pieceId);
        
        if (piece1 && piece2) {
          const oldIndex1 = piece1.currentIndex;
          const oldIndex2 = piece2.currentIndex;
          
          [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
          
          setMoveHistory([...moveHistory, { 
            piece1Id: piece1.id, 
            piece1Index: oldIndex1, 
            piece2Id: piece2.id, 
            piece2Index: oldIndex2 
          }]);
          
          setPieces(newPieces);
          setMoves(moves + 1);
          setSelectedPiece(null);

          const isSolved = checkSolved(newPieces);
          const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
          setCorrectPiecesCount(correctCount);
          
          if (isSolved) {
            handleWin(moves + 1);
          } else if (correctCount > correctPiecesCount) {
            soundManager.place();
          }
        }
      }
    }
  };

  const handleTrayPieceClick = (pieceId: number) => {
    if (solved || gameMode !== "pick-place") return;
    
    soundManager.click();
    setSelectedPiece(pieceId);
  };

  const handleBoardSlotClick = (slotIndex: number) => {
    if (solved || gameMode !== "pick-place") return;
    
    const existingPiece = pieces.find(p => p.currentIndex === slotIndex);
    
    if (selectedPiece !== null) {
      // Place selected piece
      const pieceToPlace = pieces.find(p => p.id === selectedPiece);
      
      if (pieceToPlace) {
        soundManager.move();
        const newPieces = [...pieces];
        const piece = newPieces.find(p => p.id === selectedPiece);
        
        if (piece) {
          const oldIndex = piece.currentIndex;
          
          // If there's already a piece in this slot, move it to tray
          if (existingPiece) {
            const existing = newPieces.find(p => p.id === existingPiece.id);
            if (existing) {
              existing.currentIndex = -1;
            }
          }
          
          piece.currentIndex = slotIndex;
          
          setMoveHistory([...moveHistory, { 
            piece1Id: piece.id, 
            piece1Index: oldIndex, 
            piece2Id: existingPiece?.id ?? -1, 
            piece2Index: slotIndex 
          }]);
          
          setPieces(newPieces);
          setMoves(moves + 1);
          setSelectedPiece(null);

          const isSolved = checkSolved(newPieces);
          const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
          setCorrectPiecesCount(correctCount);
          
          if (isSolved) {
            handleWin(moves + 1);
          } else if (piece.currentIndex === piece.correctIndex) {
            soundManager.place();
            toast.success("Piece placed correctly!");
          }
        }
      }
    } else if (existingPiece) {
      // Select piece from board to move back to tray
      soundManager.click();
      setSelectedPiece(existingPiece.id);
    }
  };

  const handleWin = (finalMoves: number) => {
    setSolved(true);
    saveRecord(difficulty, finalMoves, Date.now());
    const bestRecord = stats.bestRecords[difficulty as keyof typeof stats.bestRecords];
    const isNewRecord = !bestRecord || finalMoves < bestRecord.moves;
    
    soundManager.win();
    toast.success(`Puzzle solved in ${finalMoves} moves!` + (isNewRecord ? " 🎉 New Record!" : ""));
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const undoMove = () => {
    if (moveHistory.length === 0 || solved) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const newPieces = [...pieces];
    
    const piece1 = newPieces.find(p => p.id === lastMove.piece1Id);
    if (piece1) {
      piece1.currentIndex = lastMove.piece1Index;
    }
    
    if (lastMove.piece2Id >= 0) {
      const piece2 = newPieces.find(p => p.id === lastMove.piece2Id);
      if (piece2) {
        piece2.currentIndex = lastMove.piece2Index;
      }
    }
    
    setPieces(newPieces);
    setMoves(Math.max(0, moves - 1));
    setMoveHistory(moveHistory.slice(0, -1));
    setSelectedPiece(null);
    
    const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
    setCorrectPiecesCount(correctCount);
  };

  const switchGameMode = (newMode: GameMode) => {
    setGameMode(newMode);
  };

  const getPieceStyle = (piece: JigsawPiece) => {
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

  const trayPieces = pieces.filter(p => p.currentIndex === -1);
  const placedPieces = pieces.filter(p => p.currentIndex >= 0);

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-foreground min-h-[44px]"
            >
              ← Back
            </Button>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Jigsaw Puzzle</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-2">
            <p>Moves: <span className="font-semibold text-foreground">{moves}</span></p>
            <p>Correct: <span className="font-semibold text-foreground">{correctPiecesCount}/{pieceCount}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
            size="sm"
            className="min-h-[44px]"
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={undoMove}
            variant="outline"
            size="sm"
            disabled={moveHistory.length === 0 || solved}
            className="min-h-[44px]"
          >
            <Undo className="mr-1 h-4 w-4" />
            Undo
          </Button>
          <Button
            onClick={initializePuzzle}
            variant="secondary"
            size="sm"
            className="min-h-[44px]"
          >
            <Shuffle className="mr-1 h-4 w-4" />
            Restart
          </Button>
        </div>
      </div>

      {/* Game Mode Selector */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          onClick={() => switchGameMode("swap")}
          variant={gameMode === "swap" ? "default" : "outline"}
          size="sm"
          className="min-h-[44px]"
        >
          <Grid3X3 className="mr-1 h-4 w-4" />
          Swap Mode
        </Button>
        <Button
          onClick={() => switchGameMode("pick-place")}
          variant={gameMode === "pick-place" ? "default" : "outline"}
          size="sm"
          className="min-h-[44px]"
        >
          <Puzzle className="mr-1 h-4 w-4" />
          Pick & Place
        </Button>
      </div>

      {/* Puzzle Board */}
      <div className="bg-card/50 p-3 sm:p-4 rounded-xl backdrop-blur-sm mb-4">
        <div 
          className="grid gap-0.5 sm:gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
            maxWidth: '500px',
            aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
          }}
        >
          {Array.from({ length: pieceCount }).map((_, slotIndex) => {
            const pieceInSlot = placedPieces.find(p => p.currentIndex === slotIndex);
            
            return (
              <div
                key={slotIndex}
                onClick={() => {
                  if (gameMode === "swap" && pieceInSlot) {
                    handlePieceClick(pieceInSlot.id, slotIndex);
                  } else if (gameMode === "pick-place") {
                    handleBoardSlotClick(slotIndex);
                  }
                }}
                className={cn(
                  "aspect-square cursor-pointer transition-all relative overflow-hidden",
                  "border-2 border-border/40",
                  {
                    "bg-muted/30": !pieceInSlot,
                    "ring-2 ring-primary/50 bg-primary/10": gameMode === "pick-place" && selectedPiece !== null && !pieceInSlot,
                  }
                )}
                style={{
                  borderRadius: '8px',
                }}
              >
                {pieceInSlot && (
                  <div
                    className={cn(
                      "absolute inset-0 transition-all bg-cover bg-no-repeat",
                      {
                        "ring-4 ring-primary shadow-lg shadow-primary/50 z-10 scale-105": 
                          selectedPiece === pieceInSlot.id,
                        "ring-2 ring-success/60 shadow-success/30": 
                          pieceInSlot.currentIndex === pieceInSlot.correctIndex && selectedPiece !== pieceInSlot.id,
                      }
                    )}
                    style={{
                      ...getPieceStyle(pieceInSlot),
                      borderRadius: '6px',
                    }}
                  >
                    {/* Jigsaw edge indicators */}
                    <JigsawEdgeOverlay edges={pieceInSlot.edges} />
                  </div>
                )}
                {/* Slot number for empty slots in pick-place mode */}
                {!pieceInSlot && gameMode === "pick-place" && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm font-bold">
                    {slotIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Piece Tray (Pick & Place Mode) */}
      {gameMode === "pick-place" && (
        <div className="bg-card/30 p-3 sm:p-4 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            {selectedPiece !== null ? "Tap a slot to place the piece" : "Select a piece from below"}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {trayPieces.map((piece) => (
              <div
                key={piece.id}
                onClick={() => handleTrayPieceClick(piece.id)}
                className={cn(
                  "w-14 h-14 sm:w-16 sm:h-16 cursor-pointer transition-all relative overflow-hidden",
                  "rounded-lg bg-background/50 border-2 border-border/40",
                  {
                    "ring-4 ring-primary shadow-lg shadow-primary/50 scale-110 z-10": 
                      selectedPiece === piece.id,
                    "hover:scale-105 hover:ring-2 hover:ring-accent": 
                      selectedPiece !== piece.id,
                  }
                )}
              >
                <div
                  className="absolute inset-0 bg-cover bg-no-repeat rounded-md"
                  style={getPieceStyle(piece)}
                >
                  <JigsawEdgeOverlay edges={piece.edges} />
                </div>
              </div>
            ))}
            {trayPieces.length === 0 && !solved && (
              <p className="text-muted-foreground text-sm py-4">All pieces placed! Check your solution.</p>
            )}
          </div>
        </div>
      )}

      {/* Win Message */}
      {solved && (
        <div className="text-center animate-bounce-in mt-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-success to-success/70 rounded-full text-white font-bold text-lg shadow-lg">
            <Trophy className="h-6 w-6" />
            Puzzle Complete!
          </div>
        </div>
      )}

      <PreviewModal image={image} isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
};

// Component to show jigsaw edge indicators
const JigsawEdgeOverlay = ({ edges }: { edges: JigsawPiece["edges"] }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top edge indicator */}
      {edges.top === "tab" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-gradient-to-b from-white/20 to-transparent rounded-b-full" />
      )}
      {edges.top === "blank" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-gradient-to-b from-black/20 to-transparent rounded-b-full" />
      )}
      
      {/* Right edge indicator */}
      {edges.right === "tab" && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1/3 w-[15%] bg-gradient-to-l from-white/20 to-transparent rounded-l-full" />
      )}
      {edges.right === "blank" && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1/3 w-[15%] bg-gradient-to-l from-black/20 to-transparent rounded-l-full" />
      )}
      
      {/* Bottom edge indicator */}
      {edges.bottom === "tab" && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-gradient-to-t from-white/20 to-transparent rounded-t-full" />
      )}
      {edges.bottom === "blank" && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-gradient-to-t from-black/20 to-transparent rounded-t-full" />
      )}
      
      {/* Left edge indicator */}
      {edges.left === "tab" && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/3 w-[15%] bg-gradient-to-r from-white/20 to-transparent rounded-r-full" />
      )}
      {edges.left === "blank" && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/3 w-[15%] bg-gradient-to-r from-black/20 to-transparent rounded-r-full" />
      )}
      
      {/* Corner shadows for depth */}
      <div className="absolute inset-0 shadow-inner rounded pointer-events-none" style={{ boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
};

export default JigsawPuzzleGame;
