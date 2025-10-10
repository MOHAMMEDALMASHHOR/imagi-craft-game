import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Shuffle, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

type Difficulty = "easy" | "medium" | "hard";

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
  }
};

const getGridSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy": return { rows: 2, cols: 4 };
    case "medium": return { rows: 4, cols: 4 };
    case "hard": return { rows: 4, cols: 8 };
  }
};

export const PuzzleGame = ({ image, difficulty, onBack }: PuzzleGameProps) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
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
    
    setPieces(newPieces);
    setMoves(0);
    setSolved(false);
  };

  const handlePieceClick = (index: number) => {
    if (solved) return;

    if (selectedPiece === null) {
      setSelectedPiece(index);
    } else {
      if (selectedPiece === index) {
        setSelectedPiece(null);
        return;
      }

      // Swap pieces
      const newPieces = [...pieces];
      const piece1 = newPieces.find(p => p.currentIndex === selectedPiece);
      const piece2 = newPieces.find(p => p.currentIndex === index);
      
      if (piece1 && piece2) {
        [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
        setPieces(newPieces);
        setMoves(moves + 1);
        setSelectedPiece(null);

        // Check if solved
        const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
        if (isSolved) {
          setSolved(true);
          toast.success(`Puzzle solved in ${moves + 1} moves!`);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Puzzle Game</h2>
          <p className="text-muted-foreground">Moves: {moves}</p>
        </div>
        <Button
          onClick={initializePuzzle}
          variant="secondary"
          size="sm"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Restart
        </Button>
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
    </div>
  );
};
