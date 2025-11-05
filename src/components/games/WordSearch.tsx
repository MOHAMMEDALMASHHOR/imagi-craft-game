import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Timer, Lightbulb, RotateCcw } from "lucide-react";

type Cell = {
  letter: string;
  isPartOfWord: boolean;
  isFound: boolean;
  wordIndex: number;
};

type Direction = 'horizontal' | 'vertical' | 'diagonal' | 'diagonal-reverse';

const WORD_LISTS = {
  easy: ['CAT', 'DOG', 'BIRD', 'FISH', 'BEAR'],
  medium: ['PYTHON', 'JAVASCRIPT', 'REACT', 'HTML', 'CSS', 'NODE'],
  hard: ['ALGORITHM', 'DATABASE', 'FRAMEWORK', 'TYPESCRIPT', 'COMPONENT', 'INTERFACE']
};

const generateWordSearch = (words: string[], size: number) => {
  const grid: Cell[][] = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({
      letter: '',
      isPartOfWord: false,
      isFound: false,
      wordIndex: -1
    }))
  );

  const directions: Direction[] = ['horizontal', 'vertical', 'diagonal', 'diagonal-reverse'];
  const placedWords: { word: string; start: [number, number]; end: [number, number] }[] = [];

  const canPlaceWord = (word: string, row: number, col: number, direction: Direction): boolean => {
    const len = word.length;
    
    for (let i = 0; i < len; i++) {
      let newRow = row;
      let newCol = col;
      
      if (direction === 'horizontal') newCol += i;
      else if (direction === 'vertical') newRow += i;
      else if (direction === 'diagonal') { newRow += i; newCol += i; }
      else if (direction === 'diagonal-reverse') { newRow += i; newCol -= i; }
      
      if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) return false;
      if (grid[newRow][newCol].letter && grid[newRow][newCol].letter !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (word: string, row: number, col: number, direction: Direction, wordIndex: number) => {
    const positions: [number, number][] = [];
    
    for (let i = 0; i < word.length; i++) {
      let newRow = row;
      let newCol = col;
      
      if (direction === 'horizontal') newCol += i;
      else if (direction === 'vertical') newRow += i;
      else if (direction === 'diagonal') { newRow += i; newCol += i; }
      else if (direction === 'diagonal-reverse') { newRow += i; newCol -= i; }
      
      grid[newRow][newCol] = {
        letter: word[i],
        isPartOfWord: true,
        isFound: false,
        wordIndex
      };
      positions.push([newRow, newCol]);
    }
    
    return { start: positions[0], end: positions[positions.length - 1] };
  };

  words.forEach((word, index) => {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      
      if (canPlaceWord(word, row, col, direction)) {
        const positions = placeWord(word, row, col, direction, index);
        placedWords.push({ word, ...positions });
        placed = true;
      }
      attempts++;
    }
  });

  // Fill empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!grid[i][j].letter) {
        grid[i][j].letter = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, placedWords };
};

export const WordSearch = () => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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
    const wordList = WORD_LISTS[difficulty];
    const size = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 12 : 15;
    const { grid: newGrid } = generateWordSearch(wordList, size);
    
    setGrid(newGrid);
    setWords(wordList);
    setFoundWords(new Set());
    setSelectedCells([]);
    setTimer(0);
    setIsRunning(true);
  };

  const handleMouseDown = (row: number, col: number) => {
    setSelecting(true);
    setSelectedCells([[row, col]]);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (selecting) {
      setSelectedCells(prev => [...prev, [row, col]]);
    }
  };

  const handleMouseUp = () => {
    setSelecting(false);
    checkWord();
  };

  const checkWord = () => {
    if (selectedCells.length < 2) {
      setSelectedCells([]);
      return;
    }

    const word = selectedCells.map(([r, c]) => grid[r][c].letter).join('');
    const reverseWord = word.split('').reverse().join('');

    if (words.includes(word) && !foundWords.has(word)) {
      setFoundWords(prev => new Set([...prev, word]));
      markWordAsFound(word);
      toast.success(`Found: ${word}`);
      
      if (foundWords.size + 1 === words.length) {
        setIsRunning(false);
        toast.success(`All words found in ${formatTime(timer)}!`);
      }
    } else if (words.includes(reverseWord) && !foundWords.has(reverseWord)) {
      setFoundWords(prev => new Set([...prev, reverseWord]));
      markWordAsFound(reverseWord);
      toast.success(`Found: ${reverseWord}`);
      
      if (foundWords.size + 1 === words.length) {
        setIsRunning(false);
        toast.success(`All words found in ${formatTime(timer)}!`);
      }
    }

    setSelectedCells([]);
  };

  const markWordAsFound = (word: string) => {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    
    for (let i = 0; i < newGrid.length; i++) {
      for (let j = 0; j < newGrid[i].length; j++) {
        if (newGrid[i][j].isPartOfWord) {
          const cellWord = getCellWord(i, j);
          if (cellWord === word) {
            newGrid[i][j].isFound = true;
          }
        }
      }
    }
    
    setGrid(newGrid);
  };

  const getCellWord = (row: number, col: number): string => {
    return '';
  };

  const handleHint = () => {
    const unFoundWords = words.filter(w => !foundWords.has(w));
    if (unFoundWords.length > 0) {
      toast.info(`Look for: ${unFoundWords[0]}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
          Word Search
        </h1>

        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg">{formatTime(timer)}</span>
          </Card>
          
          <Card className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm">
            <span className="text-sm">Found: {foundWords.size}/{words.length}</span>
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

        <div className="grid lg:grid-cols-[1fr,250px] gap-4 mb-4">
          {/* Word Search Grid */}
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <div 
              className="grid gap-1 select-none mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${grid[0]?.length || 10}, minmax(0, 1fr))`,
                maxWidth: '500px'
              }}
              onMouseLeave={() => {
                if (selecting) {
                  setSelecting(false);
                  checkWord();
                }
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    onMouseUp={handleMouseUp}
                    className={`
                      aspect-square flex items-center justify-center text-sm md:text-base font-bold
                      rounded transition-all border-2
                      ${cell.isFound ? 'bg-success/30 border-success text-success' : 'bg-background border-border'}
                      ${isCellSelected(rowIndex, colIndex) ? 'bg-primary/30 border-primary scale-110' : ''}
                      hover:bg-muted/50 cursor-pointer
                    `}
                  >
                    {cell.letter}
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Word List */}
          <Card className="p-4 bg-card/50 backdrop-blur-sm">
            <h3 className="font-bold mb-3 text-lg">Words to Find</h3>
            <div className="space-y-2">
              {words.map((word) => (
                <div
                  key={word}
                  className={`
                    px-3 py-2 rounded font-medium text-sm transition-all
                    ${foundWords.has(word) 
                      ? 'bg-success/20 text-success line-through' 
                      : 'bg-muted/50 text-foreground'
                    }
                  `}
                >
                  {word}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={handleHint} variant="outline">
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint
          </Button>
          <Button onClick={startNewGame} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </div>
    </div>
  );
};
