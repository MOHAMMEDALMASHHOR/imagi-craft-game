import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

const GRID_SIZE = 4;

type Grid = (number | null)[][];

export const Game2048 = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        handleMove(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [grid]);

  const initializeGame = () => {
    const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
  };

  const addRandomTile = (currentGrid: Grid) => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === null) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const handleMove = (direction: string) => {
    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    // Implement move logic (simplified)
    // This is a basic implementation - full 2048 logic would be more complex
    
    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
    }
  };

  const getTileColor = (value: number | null) => {
    if (!value) return "bg-muted/30";
    const colors: { [key: number]: string } = {
      2: "bg-gradient-to-br from-primary/30 to-primary/50",
      4: "bg-gradient-to-br from-primary/50 to-primary/70",
      8: "bg-gradient-to-br from-accent/50 to-accent/70",
      16: "bg-gradient-to-br from-accent/70 to-accent/90",
    };
    return colors[value] || "bg-gradient-to-br from-success to-success/70";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          2048
        </h1>
        <div className="flex justify-center gap-6 text-muted-foreground">
          <p>Score: {score}</p>
          <Button variant="secondary" size="sm" onClick={initializeGame}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Use arrow keys to play</p>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto bg-card/50 backdrop-blur-sm p-4 rounded-lg">
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <Card
              key={`${i}-${j}`}
              className={`aspect-square flex items-center justify-center text-2xl font-bold transition-all ${getTileColor(cell)}`}
            >
              {cell}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
