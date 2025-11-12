import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Timer, RotateCcw, Flag, Bomb, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sounds";
import { useGameScore } from "@/hooks/use-game-score";
import { ShareButton } from "@/components/ShareButton";

type Difficulty = 'easy' | 'medium' | 'hard';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const DIFFICULTY_CONFIG = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 25 },
  hard: { rows: 16, cols: 16, mines: 50 },
};

export const Minesweeper = () => {
  const { user, saveScore } = useGameScore();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [minesRemaining, setMinesRemaining] = useState(0);

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const initializeGame = () => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const newGrid: Cell[][] = Array(config.rows).fill(null).map(() =>
      Array(config.cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    setGrid(newGrid);
    setGameStarted(false);
    setGameOver(false);
    setWon(false);
    setTimer(0);
    setIsRunning(false);
    setIsPaused(false);
    setFlagMode(false);
    setMinesRemaining(config.mines);
  };

  const placeMines = (firstRow: number, firstCol: number) => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let minesPlaced = 0;

    while (minesPlaced < config.mines) {
      const row = Math.floor(Math.random() * config.rows);
      const col = Math.floor(Math.random() * config.cols);

      // Don't place mine on first clicked cell or adjacent cells
      const isFirstClick = row === firstRow && col === firstCol;
      const isAdjacent = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;

      if (!newGrid[row][col].isMine && !isFirstClick && !isAdjacent) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (!newGrid[row][col].isMine) {
          newGrid[row][col].adjacentMines = countAdjacentMines(newGrid, row, col);
        }
      }
    }

    setGrid(newGrid);
    setGameStarted(true);
    setIsRunning(true);
  };

  const countAdjacentMines = (grid: Cell[][], row: number, col: number): number => {
    let count = 0;
    const config = DIFFICULTY_CONFIG[difficulty];

    for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
        if (grid[r][c].isMine) count++;
      }
    }

    return count;
  };

  const revealCell = (row: number, col: number) => {
    if (isPaused || gameOver || won) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    
    if (newGrid[row][col].isFlagged || newGrid[row][col].isRevealed) return;

    // First click - place mines
    if (!gameStarted) {
      placeMines(row, col);
      return;
    }

    newGrid[row][col].isRevealed = true;
    soundManager.click();

    // Hit a mine - game over
    if (newGrid[row][col].isMine) {
      setGameOver(true);
      setIsRunning(false);
      soundManager.lose();
      
      // Reveal all mines
      newGrid.forEach(r => r.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      
      setGrid(newGrid);
      toast.error("Game Over! You hit a mine!");
      return;
    }

    soundManager.place();

    // If no adjacent mines, reveal adjacent cells
    if (newGrid[row][col].adjacentMines === 0) {
      revealAdjacentCells(newGrid, row, col);
    }

    setGrid(newGrid);

    // Check for win
    if (checkWin(newGrid)) {
      setWon(true);
      setIsRunning(false);
      const score = Math.max(5000 - timer * 10 - (DIFFICULTY_CONFIG[difficulty].mines - minesRemaining) * 20, 500);
      saveScore({ gameType: 'minesweeper', score, difficulty });
      soundManager.win();
      toast.success(`You won! Time: ${formatTime(timer)}`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const revealAdjacentCells = (grid: Cell[][], row: number, col: number) => {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
        if (!grid[r][c].isRevealed && !grid[r][c].isFlagged && !grid[r][c].isMine) {
          grid[r][c].isRevealed = true;
          if (grid[r][c].adjacentMines === 0) {
            revealAdjacentCells(grid, r, c);
          }
        }
      }
    }
  };

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (isPaused || !gameStarted || gameOver || won) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    
    if (newGrid[row][col].isRevealed) return;

    const wasFlagged = newGrid[row][col].isFlagged;
    newGrid[row][col].isFlagged = !wasFlagged;
    
    setMinesRemaining(prev => wasFlagged ? prev + 1 : prev - 1);
    setGrid(newGrid);
    soundManager.click();
  };

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    if (flagMode || e.button === 2) {
      toggleFlag(row, col, e);
    } else {
      revealCell(row, col);
    }
  };

  const checkWin = (grid: Cell[][]): boolean => {
    return grid.every(row => 
      row.every(cell => cell.isRevealed || cell.isMine)
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed && cell.isFlagged) {
      return <Flag className="w-4 h-4 text-destructive" />;
    }
    
    if (!cell.isRevealed) {
      return null;
    }

    if (cell.isMine) {
      return <Bomb className="w-4 h-4 text-destructive" />;
    }

    if (cell.adjacentMines === 0) {
      return null;
    }

    const colors = [
      'text-primary',
      'text-success',
      'text-destructive',
      'text-accent',
      'text-primary-glow',
      'text-accent-glow',
      'text-muted-foreground',
      'text-foreground'
    ];

    return (
      <span className={`font-bold text-sm ${colors[cell.adjacentMines - 1]}`}>
        {cell.adjacentMines}
      </span>
    );
  };

  const config = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-destructive via-primary to-success bg-clip-text text-transparent">
          Minesweeper
        </h1>

        {/* Stats Bar */}
        <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg">{formatTime(timer)}</span>
          </Card>
          
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <Bomb className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold">{minesRemaining}</span>
          </Card>

          <Button
            variant={flagMode ? "default" : "outline"}
            size="sm"
            onClick={() => setFlagMode(!flagMode)}
            className="gap-2"
            disabled={!gameStarted || gameOver || won}
          >
            <Flag className="w-4 h-4" />
            {flagMode ? 'Flag Mode' : 'Click Mode'}
          </Button>
        </div>

        {/* Difficulty Selector */}
        {!gameStarted && (
          <div className="flex gap-2 mb-4 justify-center">
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <Button
                key={diff}
                variant={difficulty === diff ? "default" : "outline"}
                onClick={() => setDifficulty(diff)}
                className="capitalize"
              >
                {diff}
              </Button>
            ))}
          </div>
        )}

        {/* Game Grid */}
        <Card className="p-6 bg-background/95 backdrop-blur-xl border-2 border-border mb-4 inline-block shadow-xl">
          <div 
            className="grid gap-1 select-none p-2 rounded-lg bg-muted/20"
            style={{ 
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              maxWidth: config.cols <= 8 ? '400px' : config.cols <= 12 ? '500px' : '600px'
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                  onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                  disabled={isPaused}
                  className={`
                    aspect-square flex items-center justify-center rounded
                    transition-all border-2 font-semibold
                    ${config.cols <= 8 ? 'w-12 h-12' : config.cols <= 12 ? 'w-10 h-10' : 'w-8 h-8'}
                    ${cell.isRevealed
                      ? cell.isMine
                        ? 'bg-destructive/40 text-destructive border-destructive/50 shadow-inner'
                        : 'bg-background border-border/50 shadow-inner'
                      : 'bg-gradient-to-br from-card to-card/80 border-border hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 active:scale-95 cursor-pointer shadow-md hover:shadow-lg'
                    }
                    ${cell.isFlagged && !cell.isRevealed ? 'bg-accent/30 border-accent' : ''}
                  `}
                >
                  {getCellContent(cell)}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground mb-4">
          {!gameStarted 
            ? 'Click any cell to start! Right-click or use flag mode to mark mines.'
            : isPaused 
            ? 'Game paused'
            : flagMode 
            ? 'Flag mode active - click to flag/unflag cells'
            : 'Left-click to reveal, right-click to flag'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center flex-wrap mb-6">
          <Button 
            onClick={() => setIsPaused(!isPaused)} 
            variant="outline"
            disabled={!gameStarted || gameOver || won}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button onClick={initializeGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>

        {(gameOver || won) && (
          <div className="text-center animate-bounce-in space-y-4">
            {won && (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-success to-success/70 rounded-full text-white font-bold text-lg shadow-lg">
                <Trophy className="h-6 w-6" />
                Victory!
              </div>
            )}
            <ShareButton
              title="Minesweeper"
              text={`I ${won ? 'completed' : 'played'} Minesweeper (${difficulty}) in ${formatTime(timer)}! ${won ? '🎉' : ''} Can you beat that?`}
            />
          </div>
        )}

        {/* How to Play */}
        <Card className="mt-6 p-4 bg-card/30 backdrop-blur-sm text-left">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Left-click to reveal cells, right-click (or flag mode) to mark mines</li>
            <li>Numbers show how many mines are adjacent to that cell</li>
            <li>Reveal all non-mine cells to win</li>
            <li>Hitting a mine ends the game</li>
            <li>Use logic to deduce where mines are located</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};