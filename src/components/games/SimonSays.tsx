import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Play, RotateCcw, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sounds";
import { useGameScore } from "@/hooks/use-game-score";
import { ShareButton } from "@/components/ShareButton";

type Color = 'red' | 'blue' | 'green' | 'yellow';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CLASSES = {
  red: 'bg-destructive hover:bg-destructive/80 active:bg-destructive/60',
  blue: 'bg-primary hover:bg-primary/80 active:bg-primary/60',
  green: 'bg-success hover:bg-success/80 active:bg-success/60',
  yellow: 'bg-accent hover:bg-accent/80 active:bg-accent/60',
};

const GLOW_CLASSES = {
  red: 'ring-4 ring-destructive/50 brightness-150 shadow-[0_0_40px_hsl(var(--destructive)/0.8)]',
  blue: 'ring-4 ring-primary/50 brightness-150 shadow-[0_0_40px_hsl(var(--primary)/0.8)]',
  green: 'ring-4 ring-success/50 brightness-150 shadow-[0_0_40px_hsl(var(--success)/0.8)]',
  yellow: 'ring-4 ring-accent/50 brightness-150 shadow-[0_0_40px_hsl(var(--accent)/0.8)]',
};

export const SimonSays = () => {
  const { user, saveScore } = useGameScore();
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('simonHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const flashColor = async (color: Color, duration = 500) => {
    setActiveColor(color);
    soundManager.place();
    await new Promise(resolve => setTimeout(resolve, duration));
    setActiveColor(null);
    await new Promise(resolve => setTimeout(resolve, 200));
  };

  const playSequence = async (seq: Color[]) => {
    setIsPlaying(true);
    setIsPlayerTurn(false);

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const color of seq) {
      await flashColor(color);
    }

    setIsPlaying(false);
    setIsPlayerTurn(true);
  };

  const startGame = () => {
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [firstColor];
    
    setSequence(newSequence);
    setPlayerSequence([]);
    setScore(0);
    setGameStarted(true);
    setGameOver(false);
    
    playSequence(newSequence);
  };

  const addToSequence = () => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...sequence, newColor];
    
    soundManager.powerUp();
    setSequence(newSequence);
    setPlayerSequence([]);
    setScore(prev => prev + 1);
    
    playSequence(newSequence);
  };

  const handleColorClick = async (color: Color) => {
    if (!isPlayerTurn || isPlaying) return;

    await flashColor(color, 300);

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    // Check if the player's input matches the sequence
    const currentIndex = newPlayerSequence.length - 1;
    
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong move - game over
      soundManager.lose();
      setIsPlayerTurn(false);
      setGameStarted(false);
      setGameOver(true);
      saveScore({ gameType: 'simon-says', score });
      
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('simonHighScore', score.toString());
        toast.success(`New High Score: ${score}! 🎉`);
      } else {
        toast.error(`Game Over! Score: ${score}`);
      }
      
      // Flash all colors to indicate game over
      for (let i = 0; i < 3; i++) {
        setActiveColor('red');
        await new Promise(resolve => setTimeout(resolve, 100));
        setActiveColor(null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return;
    }

    // Check if player completed the sequence
    if (newPlayerSequence.length === sequence.length) {
      soundManager.success();
      setIsPlayerTurn(false);
      toast.success('Correct! Next level...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToSequence();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-accent-glow to-success bg-clip-text text-transparent">
          Simon Says
        </h1>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Card className="px-6 py-3 bg-card/50 backdrop-blur-sm">
            <div className="text-sm text-muted-foreground mb-1">Score</div>
            <div className="text-2xl font-bold text-primary">{score}</div>
          </Card>
          
          <Card className="px-6 py-3 bg-card/50 backdrop-blur-sm">
            <div className="text-sm text-muted-foreground mb-1">High Score</div>
            <div className="text-2xl font-bold text-success">{highScore}</div>
          </Card>
        </div>

        {/* Game Status */}
        <div className="mb-6">
          {!gameStarted && (
            <p className="text-lg text-muted-foreground">
              Press Start to begin!
            </p>
          )}
          {isPlaying && (
            <p className="text-lg text-primary font-semibold animate-pulse">
              Watch the sequence...
            </p>
          )}
          {isPlayerTurn && (
            <p className="text-lg text-success font-semibold animate-pulse">
              Your turn! Repeat the pattern
            </p>
          )}
        </div>

        {/* Game Board */}
        <Card className="p-8 bg-card/50 backdrop-blur-sm mb-6">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto aspect-square">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                disabled={!isPlayerTurn || isPlaying}
                className={`
                  rounded-2xl transition-all duration-200 transform
                  ${COLOR_CLASSES[color]}
                  ${activeColor === color ? GLOW_CLASSES[color] : ''}
                  ${!isPlayerTurn || isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                  disabled:hover:scale-100
                  shadow-lg
                `}
              />
            ))}
          </div>
        </Card>

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center flex-wrap mb-6">
          {!gameStarted ? (
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          ) : (
            <Button 
              onClick={startGame} 
              size="lg" 
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Restart
            </Button>
          )}
        </div>

        {gameOver && (
          <div className="text-center animate-bounce-in">
            <ShareButton
              title="Simon Says"
              text={`I reached level ${score} in Simon Says! Can you beat my score?`}
            />
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-6 p-4 bg-card/30 backdrop-blur-sm text-left">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Watch the sequence of colors</li>
            <li>Repeat the sequence by clicking the colors in order</li>
            <li>Each round adds one more color to remember</li>
            <li>The game ends when you make a mistake</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
