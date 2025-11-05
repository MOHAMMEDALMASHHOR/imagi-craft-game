import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Timer, Lightbulb, RotateCcw, CheckCircle2 } from "lucide-react";

type Grid = (number | null)[][];

const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard'): { puzzle: Grid; solution: Grid } => {
  // Create a solved sudoku grid
  const solution: Grid = Array(9).fill(null).map(() => Array(9).fill(null));
  
  const isValid = (grid: Grid, row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  };
  
  const solveSudoku = (grid: Grid): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solveSudoku(grid)) return true;
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  solveSudoku(solution);
  
  // Create puzzle by removing numbers
  const puzzle: Grid = solution.map(row => [...row]);
  const cellsToRemove = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 50 : 60;
  
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      removed++;
    }
  }
  
  return { puzzle, solution };
};

export const Sudoku = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [grid, setGrid] = useState<Grid>([]);
  const [solution, setSolution] = useState<Grid>([]);
  const [initialGrid, setInitialGrid] = useState<Grid>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startNewGame = () => {
    const { puzzle, solution: sol } = generateSudoku(difficulty);
    setGrid(puzzle);
    setSolution(sol);
    setInitialGrid(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setTimer(0);
    setIsRunning(true);
    setMistakes(0);
  };

  const handleCellClick = (row: number, col: number) => {
    if (initialGrid[row][col] === null) {
      setSelectedCell([row, col]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);

    if (num !== solution[row][col]) {
      setMistakes(prev => prev + 1);
      toast.error("Incorrect number!");
    } else if (checkWin(newGrid)) {
      setIsRunning(false);
      toast.success(`Puzzle solved in ${formatTime(timer)}!`);
    }
  };

  const handleHint = () => {
    if (!selectedCell) {
      toast.error("Select a cell first!");
      return;
    }
    const [row, col] = selectedCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = solution[row][col];
    setGrid(newGrid);
    toast.info("Hint added!");
  };

  const checkWin = (currentGrid: Grid): boolean => {
    return currentGrid.every((row, i) => 
      row.every((cell, j) => cell === solution[i][j])
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
          Sudoku
        </h1>

        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg">{formatTime(timer)}</span>
          </Card>
          
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <span className="text-sm">Mistakes: {mistakes}</span>
          </Card>
        </div>

        {/* Difficulty Selector */}
        {!isRunning && (
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

        {/* Sudoku Grid */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm mb-4">
          <div className="grid grid-cols-9 gap-0 aspect-square max-w-md mx-auto">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isInitial = initialGrid[rowIndex][colIndex] !== null;
                const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;
                const isInSameRow = selectedCell?.[0] === rowIndex;
                const isInSameCol = selectedCell?.[1] === colIndex;
                const isInSameBox = selectedCell && 
                  Math.floor(selectedCell[0] / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(colIndex / 3);
                
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`
                      aspect-square flex items-center justify-center text-lg font-semibold
                      border border-border/30 transition-all
                      ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-r-border' : ''}
                      ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-b-border' : ''}
                      ${isInitial ? 'bg-muted/50 text-foreground font-bold' : 'bg-background text-primary hover:bg-muted/30'}
                      ${isSelected ? 'bg-primary/20 ring-2 ring-primary' : ''}
                      ${(isInSameRow || isInSameCol || isInSameBox) && !isSelected ? 'bg-muted/20' : ''}
                      ${!isInitial ? 'cursor-pointer' : 'cursor-default'}
                    `}
                    disabled={isInitial}
                  >
                    {cell || ''}
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Number Pad */}
        <div className="grid grid-cols-5 gap-2 mb-4 max-w-md mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleNumberInput(num)}
              disabled={!selectedCell}
              variant="outline"
              className="aspect-square text-xl font-bold"
            >
              {num}
            </Button>
          ))}
          <Button
            onClick={() => selectedCell && handleNumberInput(null!)}
            disabled={!selectedCell}
            variant="outline"
            className="aspect-square"
          >
            Clear
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={handleHint} variant="outline" disabled={!selectedCell}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint
          </Button>
          <Button onClick={startNewGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
          <Button 
            onClick={() => {
              const isWin = checkWin(grid);
              if (isWin) {
                setIsRunning(false);
                toast.success("Puzzle completed!");
              } else {
                toast.error("Puzzle not complete yet!");
              }
            }}
            variant="default"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>
      </div>
    </div>
  );
};
