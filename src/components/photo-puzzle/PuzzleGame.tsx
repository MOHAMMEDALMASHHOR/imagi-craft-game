import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Shuffle, Trophy, Eye, Undo } from "lucide-react";
import confetti from "canvas-confetti";
import { useIsMobileDevice } from "@/hooks/use-mobile";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";
import { PreviewModal } from "./PreviewModal";
import MobilePuzzleGame from "./MobilePuzzleGame";
import { soundManager } from "@/lib/sounds";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface Piece {
  id: number;
  currentIndex: number;
  correctIndex: number;
  image: string;
}

interface PuzzleGameProps {
  image: string;
  difficulty: Difficulty;
  onBack: () => void;
}

const getPieceCount = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return 8;
    case "medium": return 16;
    case "hard": return 32;
    case "expert": return 48;
  }
};

const getGridSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return { rows: 2, cols: 4 };
    case "medium": return { rows: 4, cols: 4 };
    case "hard": return { rows: 4, cols: 8 };
    case "expert": return { rows: 6, cols: 8 };
  }
};

// Desktop version of the puzzle game
const DesktopPuzzleGame = ({ image, difficulty, onBack }: PuzzleGameProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const { stats, saveRecord } = usePuzzleRecords();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [correctPiecesCount, setCorrectPiecesCount] = useState(0);
  const [moveHistory, setMoveHistory] = useState<Array<{ piece1Index: number; piece2Index: number }>>([]);
  const gridSize = getGridSize(difficulty);
  const pieceCount = getPieceCount(difficulty);

  useEffect(() => {
    initializePuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePuzzle = () => {
    const newPieces: Piece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        currentIndex: i,
        correctIndex: i,
        image: image,
      });
    }
    
    // Shuffle pieces
    for (let i = newPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPieces[i].currentIndex, newPieces[j].currentIndex] = [newPieces[j].currentIndex, newPieces[i].currentIndex];
    }
    
    const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
    
    setPieces(newPieces);
    setMoves(0);
    setSolved(false);
    setCorrectPiecesCount(correctCount);
    setMoveHistory([]);
  };

  const handlePieceClick = (index: number) => {
    if (solved) return;

    if (selectedPiece === null) {
      soundManager.click();
      setSelectedPiece(index);
    } else {
      if (selectedPiece === index) {
        setSelectedPiece(null);
        return;
      }

      // Swap pieces
      soundManager.move();
      const newPieces = [...pieces];
      const piece1 = newPieces.find(p => p.currentIndex === selectedPiece);
      const piece2 = newPieces.find(p => p.currentIndex === index);
      
      if (piece1 && piece2) {
        [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
        setPieces(newPieces);
        setMoves(moves + 1);
        setSelectedPiece(null);
        setMoveHistory([...moveHistory, { piece1Index: selectedPiece, piece2Index: index }]);

        // Check if solved
        const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
        const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
        setCorrectPiecesCount(correctCount);
        
        if (isSolved) {
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
        } else if (correctCount > correctPiecesCount) {
          soundManager.place();
        }
      }
    }
  };

  const getPieceStyle = (piece: Piece) => {
    const col = piece.correctIndex % gridSize.cols;
    const row = Math.floor(piece.correctIndex / gridSize.cols);
    const percentX = (col * 100) / (gridSize.cols - 1);
    const percentY = (row * 100) / (gridSize.rows - 1);

    return {
      backgroundImage: `url(${piece.image})`,
      backgroundPosition: `${percentX}% ${percentY}%`,
      backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
    };
  };

  const undoMove = () => {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const newPieces = [...pieces];
    
    const piece1 = newPieces.find(p => p.currentIndex === lastMove.piece2Index);
    const piece2 = newPieces.find(p => p.currentIndex === lastMove.piece1Index);
    
    if (piece1 && piece2) {
      [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
      setPieces(newPieces);
      setMoves(Math.max(0, moves - 1));
      setMoveHistory(moveHistory.slice(0, -1));
      const correctCount = newPieces.filter(p => p.currentIndex === p.correctIndex).length;
      setCorrectPiecesCount(correctCount);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Puzzle Game</h2>
          <div className="flex items-center gap-4 text-muted-foreground">
            <p>Moves: {moves}</p>
            <p>Correct: {correctPiecesCount}/{pieceCount}</p>
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

      {/* Puzzle Grid */}
      <div 
        className="grid gap-1 mb-6 bg-card/50 p-2 rounded-lg backdrop-blur-sm mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
          maxWidth: '600px',
        }}
      >
        {pieces
          .sort((a, b) => a.currentIndex - b.currentIndex)
          .map((piece) => (
            <div
              key={piece.id}
              onClick={() => handlePieceClick(piece.currentIndex)}
              className={`aspect-square cursor-pointer transition-all hover:scale-105 rounded ${
                selectedPiece === piece.currentIndex
                  ? "ring-4 ring-primary shadow-lg shadow-primary/50"
                  : piece.currentIndex === piece.correctIndex
                  ? "ring-2 ring-success/50"
                  : "hover:ring-2 hover:ring-accent"
              }`}
              style={getPieceStyle(piece)}
            />
          ))}
      </div>

      {solved && (
        <div className="text-center animate-bounce-in">
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

// Main PuzzleGame component that routes to mobile or desktop version
export const PuzzleGame = ({ image, difficulty, onBack }: PuzzleGameProps) => {
  const isMobileDevice = useIsMobileDevice();

  // Route to appropriate component based on device
  if (isMobileDevice) {
    return <MobilePuzzleGame image={image} difficulty={difficulty} onBack={onBack} />;
  }

  return <DesktopPuzzleGame image={image} difficulty={difficulty} onBack={onBack} />;
};
