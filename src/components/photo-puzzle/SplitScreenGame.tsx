import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface PlayerData {
  image: string;
  difficulty: Difficulty;
}

interface Piece {
  id: number;
  currentIndex: number;
  correctIndex: number;
}

interface SplitScreenGameProps {
  player1: PlayerData;
  player2: PlayerData;
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

export const SplitScreenGame = ({ player1, player2, onBack }: SplitScreenGameProps) => {
  const [player1Pieces, setPlayer1Pieces] = useState<Piece[]>([]);
  const [player2Pieces, setPlayer2Pieces] = useState<Piece[]>([]);
  const [player1Selected, setPlayer1Selected] = useState<number | null>(null);
  const [player2Selected, setPlayer2Selected] = useState<number | null>(null);
  const [player1Moves, setPlayer1Moves] = useState(0);
  const [player2Moves, setPlayer2Moves] = useState(0);
  const [player1Solved, setPlayer1Solved] = useState(false);
  const [player2Solved, setPlayer2Solved] = useState(false);

  useEffect(() => {
    initializePuzzles();
  }, []);

  const initializePuzzles = () => {
    const initPieces = (count: number) => {
      const pieces: Piece[] = [];
      for (let i = 0; i < count; i++) {
        pieces.push({ id: i, currentIndex: i, correctIndex: i });
      }
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i].currentIndex, pieces[j].currentIndex] = [pieces[j].currentIndex, pieces[i].currentIndex];
      }
      return pieces;
    };

    setPlayer1Pieces(initPieces(getPieceCount(player1.difficulty)));
    setPlayer2Pieces(initPieces(getPieceCount(player2.difficulty)));
  };

  const handlePieceClick = (player: 1 | 2, index: number) => {
    const pieces = player === 1 ? player1Pieces : player2Pieces;
    const setPieces = player === 1 ? setPlayer1Pieces : setPlayer2Pieces;
    const selected = player === 1 ? player1Selected : player2Selected;
    const setSelected = player === 1 ? setPlayer1Selected : setPlayer2Selected;
    const moves = player === 1 ? player1Moves : player2Moves;
    const setMoves = player === 1 ? setPlayer1Moves : setPlayer2Moves;
    const solved = player === 1 ? player1Solved : player2Solved;
    const setSolved = player === 1 ? setPlayer1Solved : setPlayer2Solved;

    if (solved) return;

    if (selected === null) {
      setSelected(index);
    } else {
      if (selected === index) {
        setSelected(null);
        return;
      }

      const newPieces = [...pieces];
      const piece1 = newPieces.find(p => p.currentIndex === selected);
      const piece2 = newPieces.find(p => p.currentIndex === index);
      
      if (piece1 && piece2) {
        [piece1.currentIndex, piece2.currentIndex] = [piece2.currentIndex, piece1.currentIndex];
        setPieces(newPieces);
        setMoves(moves + 1);
        setSelected(null);

        const isSolved = newPieces.every(p => p.currentIndex === p.correctIndex);
        if (isSolved) {
          setSolved(true);
          toast.success(`Player ${player} wins!`);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6, x: player === 1 ? 0.25 : 0.75 }
          });
        }
      }
    }
  };

  const getPieceStyle = (piece: Piece, image: string, gridSize: { rows: number; cols: number }) => {
    const col = piece.correctIndex % gridSize.cols;
    const row = Math.floor(piece.correctIndex / gridSize.cols);
    const percentX = (col * 100) / (gridSize.cols - 1);
    const percentY = (row * 100) / (gridSize.rows - 1);

    return {
      backgroundImage: `url(${image})`,
      backgroundPosition: `${percentX}% ${percentY}%`,
      backgroundSize: `${gridSize.cols * 100}% ${gridSize.rows * 100}%`,
    };
  };

  const renderPlayerPuzzle = (
    player: 1 | 2,
    pieces: Piece[],
    selected: number | null,
    moves: number,
    solved: boolean,
    image: string,
    difficulty: Difficulty
  ) => {
    const gridSize = getGridSize(difficulty);
    const gradient = player === 1 ? "from-primary/20 to-primary-glow/20" : "from-accent/20 to-accent-glow/20";

    return (
      <div className="flex-1 p-4">
        <div className={`h-full bg-gradient-to-br ${gradient} backdrop-blur-sm rounded-lg p-4 border ${player === 1 ? "border-primary/50" : "border-accent/50"}`}>
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-foreground">Player {player}</h3>
            <p className="text-sm text-muted-foreground">Moves: {moves}</p>
          </div>

          <div 
            className="grid gap-1 bg-card/50 p-2 rounded-lg mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
              maxWidth: '400px',
            }}
          >
            {pieces
              .sort((a, b) => a.currentIndex - b.currentIndex)
              .map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => handlePieceClick(player, piece.currentIndex)}
                  className={`aspect-square cursor-pointer transition-all hover:scale-105 rounded ${
                    selected === piece.currentIndex
                      ? `ring-2 ${player === 1 ? "ring-primary" : "ring-accent"}`
                      : ""
                  }`}
                  style={getPieceStyle(piece, image, gridSize)}
                />
              ))}
          </div>

          {solved && (
            <div className="text-center mt-4 animate-bounce-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-success to-success/70 rounded-full text-white font-bold shadow-lg">
                <Trophy className="h-5 w-5" />
                Winner!
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        {renderPlayerPuzzle(1, player1Pieces, player1Selected, player1Moves, player1Solved, player1.image, player1.difficulty)}
        <div className="w-px bg-border" />
        {renderPlayerPuzzle(2, player2Pieces, player2Selected, player2Moves, player2Solved, player2.image, player2.difficulty)}
      </div>
    </div>
  );
};
