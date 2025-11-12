import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw } from "lucide-react";
import { useGameScore } from "@/hooks/use-game-score";
import { ShareButton } from "@/components/ShareButton";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sounds";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

export const Snake = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const { saveScore } = useGameScore();

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, body: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      let newHead: Position;

      switch (nextDirection) {
        case "UP":
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case "DOWN":
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case "LEFT":
          newHead = { x: head.x - 1, y: head.y };
          break;
        case "RIGHT":
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check collision
      if (checkCollision(newHead, prevSnake)) {
        setGameOver(true);
        setIsPlaying(false);
        soundManager.error();
        saveScore({ gameType: "snake", score });
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        soundManager.success();
        const newScore = score + 10;
        setScore(newScore);
        setFood(generateFood(newSnake));
        
        // Increase speed every 50 points
        if (newScore % 50 === 0) {
          setSpeed(prev => Math.max(50, prev - SPEED_INCREMENT));
        }

        // Celebrate milestones
        if (newScore % 100 === 0) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } else {
        newSnake.pop();
      }

      setDirection(nextDirection);
      return newSnake;
    });
  }, [nextDirection, food, score, checkCollision, generateFood, saveScore]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, moveSnake, speed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (direction !== "DOWN") setNextDirection("UP");
          break;
        case "ArrowDown":
          e.preventDefault();
          if (direction !== "UP") setNextDirection("DOWN");
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (direction !== "RIGHT") setNextDirection("LEFT");
          break;
        case "ArrowRight":
          e.preventDefault();
          if (direction !== "LEFT") setNextDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, direction]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isPlaying) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && direction !== "LEFT") setNextDirection("RIGHT");
        if (deltaX < 0 && direction !== "RIGHT") setNextDirection("LEFT");
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && direction !== "UP") setNextDirection("DOWN");
        if (deltaY < 0 && direction !== "DOWN") setNextDirection("UP");
      }
    }
    touchStartRef.current = null;
  };

  const handleDirectionButton = (newDirection: Direction) => {
    if (!isPlaying) return;
    
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT"
    };

    if (direction !== opposites[newDirection]) {
      setNextDirection(newDirection);
    }
  };

  const startGame = () => {
    soundManager.click();
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection("RIGHT");
    setNextDirection("RIGHT");
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 max-w-2xl w-full bg-card/40 backdrop-blur-xl border-2 border-border/30">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-success via-primary to-accent bg-clip-text text-transparent">
                Snake
              </h2>
              <p className="text-sm text-muted-foreground">Eat food and grow longer!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Game Board */}
          <div 
            className="relative aspect-square w-full bg-muted/30 rounded-xl overflow-hidden border-2 border-border/50"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute inset-0 grid" style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}>
              {/* Snake */}
              {snake.map((segment, index) => (
                <div
                  key={`snake-${index}`}
                  className={`${
                    index === 0 
                      ? "bg-success shadow-glow" 
                      : "bg-success/80"
                  } rounded-sm transition-all duration-100`}
                  style={{
                    gridColumn: segment.x + 1,
                    gridRow: segment.y + 1,
                  }}
                />
              ))}
              
              {/* Food */}
              <div
                className="bg-destructive rounded-full animate-pulse shadow-glow"
                style={{
                  gridColumn: food.x + 1,
                  gridRow: food.y + 1,
                }}
              />
            </div>

            {/* Overlays */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <Play className="h-16 w-16 mx-auto text-primary animate-pulse" />
                  <p className="text-muted-foreground">Use arrow keys or swipe to play</p>
                  <Button onClick={startGame} size="lg" className="shadow-glow">
                    Start Game
                  </Button>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-destructive">Game Over!</h3>
                  <p className="text-4xl font-bold text-primary">{score}</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={startGame} size="lg" className="shadow-glow">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                    <ShareButton 
                      title="Snake Game"
                      text={`I scored ${score} points in Snake! 🐍`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto md:hidden">
            <div />
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => handleDirectionButton("UP")}
              disabled={!isPlaying}
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
            <div />
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => handleDirectionButton("LEFT")}
              disabled={!isPlaying}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => handleDirectionButton("DOWN")}
              disabled={!isPlaying}
            >
              <ArrowDown className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => handleDirectionButton("RIGHT")}
              disabled={!isPlaying}
            >
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-primary">{snake.length}</div>
              <div className="text-xs text-muted-foreground">Length</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-accent">{Math.round(1000 / speed)}</div>
              <div className="text-xs text-muted-foreground">Speed Level</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
