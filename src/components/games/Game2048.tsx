import { useState, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { RotateCcw, Trophy, Share2 } from "lucide-react";
import { soundManager } from "@/lib/sounds";
import { useGameScore } from "@/hooks/use-game-score";
import { ShareButton } from "@/components/ShareButton";

type Grid = (number | null)[][];

const GRID_SIZE = 4;

export const Game2048 = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const { user, saveScore } = useGameScore();

  useEffect(() => {
    const saved = localStorage.getItem('2048BestScore');
    if (saved) setBestScore(parseInt(saved));
    initializeGame();

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameOver) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 50;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          handleMove(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          handleMove(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase();
        handleMove(direction as 'up' | 'down' | 'left' | 'right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver]);

  const initializeGame = () => {
    const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const addRandomTile = (currentGrid: Grid): Grid => {
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

    return currentGrid;
  };

  const moveLeft = (grid: Grid): { newGrid: Grid; moved: boolean; scoreGained: number } => {
    let moved = false;
    let scoreGained = 0;
    const newGrid = grid.map(row => [...row]);

    for (let i = 0; i < GRID_SIZE; i++) {
      const row = newGrid[i].filter(cell => cell !== null);
      const newRow: (number | null)[] = [];

      let j = 0;
      while (j < row.length) {
        if (j + 1 < row.length && row[j] === row[j + 1]) {
          const mergedValue = row[j]! * 2;
          newRow.push(mergedValue);
          scoreGained += mergedValue;
          j += 2;
          moved = true;
        } else {
          newRow.push(row[j]!);
          j += 1;
        }
      }

      while (newRow.length < GRID_SIZE) {
        newRow.push(null);
      }

      if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) {
        moved = true;
      }

      newGrid[i] = newRow;
    }

    return { newGrid, moved, scoreGained };
  };

  const rotateGrid = (grid: Grid): Grid => {
    const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        newGrid[j][GRID_SIZE - 1 - i] = grid[i][j];
      }
    }
    return newGrid;
  };

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    let workingGrid = grid.map(row => [...row]);
    let rotations = 0;

    if (direction === 'up') rotations = 3;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) {
      workingGrid = rotateGrid(workingGrid);
    }

    const { newGrid: movedGrid, moved, scoreGained } = moveLeft(workingGrid);

    if (!moved) return;

    for (let i = 0; i < (4 - rotations) % 4; i++) {
      workingGrid = rotateGrid(movedGrid);
    }

    const finalGrid = addRandomTile(workingGrid);
    setGrid(finalGrid);
    
    const newScore = score + scoreGained;
    setScore(newScore);

    if (moved) {
      soundManager.move();
      if (scoreGained > 0) {
        soundManager.place(); // Sound for successful merge
      }
    }

    if (newScore > bestScore) {
      setBestScore(newScore);
      localStorage.setItem('2048BestScore', newScore.toString());
    }

    // Check for 2048 tile
    if (!won && finalGrid.some(row => row.some(cell => cell === 2048))) {
      setWon(true);
      soundManager.win();
      toast.success('You won! 🎉 Keep playing to increase your score!');
      saveScore({ gameType: '2048', score: newScore });
    }

    // Check for game over
    if (isGameOver(finalGrid)) {
      setGameOver(true);
      soundManager.lose();
      toast.error(`Game Over! Final Score: ${newScore}`);
      saveScore({ gameType: '2048', score: newScore });
    }
  }, [grid, score, bestScore, won]);

  const isGameOver = (currentGrid: Grid): boolean => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === null) return false;
      }
    }

    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) return false;
        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) return false;
      }
    }

    return true;
  };

  const getTileColor = (value: number | null): string => {
    if (!value) return 'bg-muted/30';
    
    const colors: { [key: number]: string } = {
      2: 'bg-muted text-foreground',
      4: 'bg-muted/80 text-foreground',
      8: 'bg-accent/60 text-accent-foreground',
      16: 'bg-accent/70 text-accent-foreground',
      32: 'bg-accent/80 text-accent-foreground',
      64: 'bg-accent text-accent-foreground',
      128: 'bg-primary/60 text-primary-foreground',
      256: 'bg-primary/70 text-primary-foreground',
      512: 'bg-primary/80 text-primary-foreground',
      1024: 'bg-success/80 text-success-foreground',
      2048: 'bg-success text-success-foreground animate-glow-pulse',
      4096: 'bg-primary text-primary-foreground animate-glow-pulse',
    };

    return colors[value] || 'bg-primary text-primary-foreground';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          2048
        </h1>

        {/* Score Display */}
        <div className="flex justify-center gap-4 mb-6">
          <Card className="px-6 py-3 bg-card/50 backdrop-blur-sm">
            <div className="text-sm text-muted-foreground mb-1">Score</div>
            <div className="text-2xl font-bold text-primary">{score}</div>
          </Card>
          
          <Card className="px-6 py-3 bg-card/50 backdrop-blur-sm flex items-start gap-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Best</div>
              <div className="text-2xl font-bold text-success">{bestScore}</div>
            </div>
            <Trophy className="w-5 h-5 text-success mt-1" />
          </Card>
        </div>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground mb-4">
          Use arrow keys or swipe to move tiles. Tiles with the same number merge!
        </p>

        {/* Game Grid */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm mb-6">
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto aspect-square bg-muted/20 p-3 rounded-lg">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    flex items-center justify-center rounded-lg font-bold text-2xl
                    transition-all duration-150 transform
                    ${getTileColor(cell)}
                    ${cell ? 'animate-scale-in' : ''}
                  `}
                >
                  {cell}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          <Button onClick={initializeGame} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            New Game
          </Button>
          {(gameOver || won) && (
            <ShareButton
              title="2048 Game"
              text={`I scored ${score} points in 2048! ${won ? '🎉 I reached 2048!' : ''} Can you beat my score?`}
            />
          )}
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden">
          <p className="text-sm text-muted-foreground mb-3">Mobile Controls:</p>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <div />
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleMove('up')}
              disabled={gameOver}
            >
              ↑
            </Button>
            <div />
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleMove('left')}
              disabled={gameOver}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleMove('down')}
              disabled={gameOver}
            >
              ↓
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleMove('right')}
              disabled={gameOver}
            >
              →
            </Button>
          </div>
        </div>

        {/* How to Play */}
        <Card className="mt-6 p-4 bg-card/30 backdrop-blur-sm text-left">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Use arrow keys (or buttons on mobile) to move tiles</li>
            <li>When two tiles with the same number touch, they merge into one</li>
            <li>Create a 2048 tile to win!</li>
            <li>Continue playing after winning to achieve higher scores</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
