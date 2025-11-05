import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

type Color = 'red' | 'blue' | 'green' | 'yellow';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

const COLOR_CLASSES = {
  red: 'bg-red-500 hover:bg-red-400 active:bg-red-300',
  blue: 'bg-blue-500 hover:bg-blue-400 active:bg-blue-300',
  green: 'bg-green-500 hover:bg-green-400 active:bg-green-300',
  yellow: 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300',
};

const GLOW_CLASSES = {
  red: 'ring-4 ring-red-300 brightness-150',
  blue: 'ring-4 ring-blue-300 brightness-150',
  green: 'ring-4 ring-green-300 brightness-150',
  yellow: 'ring-4 ring-yellow-300 brightness-150',
};

export const SimonSays = () => {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSequence, setPlayerSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load high score
    const saved = localStorage.getItem('simonHighScore');
    if (saved) setHighScore(parseInt(saved));

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = (color: Color) => {
    if (!soundEnabled || !audioContextRef.current) return;

    const frequencies = {
      red: 329.63,    // E4
      blue: 261.63,   // C4
      green: 392.00,  // G4
      yellow: 440.00  // A4
    };

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequencies[color];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const flashColor = async (color: Color, duration = 500) => {
    setActiveColor(color);
    playTone(color);
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
    
    playSequence(newSequence);
  };

  const addToSequence = () => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...sequence, newColor];
    
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
      setIsPlayerTurn(false);
      setGameStarted(false);
      
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
        <div className="flex gap-3 justify-center flex-wrap">
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
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-5 h-5" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" />
                Sound Off
              </>
            )}
          </Button>
        </div>

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
