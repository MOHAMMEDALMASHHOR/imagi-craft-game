import { useState, useRef } from "react";
import { Camera, Upload, BarChart3, Puzzle, Grid3X3 } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { DifficultySelector } from "./DifficultySelector";
import { PuzzleGame } from "./PuzzleGame";
import { ClassicJigsawGame } from "./ClassicJigsawGame";
import { StatsModal } from "./StatsModal";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type GameMode = "swap" | "classic";

interface SinglePlayerModeProps {
  onBack: () => void;
}

export const SinglePlayerMode = ({ onBack }: SinglePlayerModeProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameMode, setGameMode] = useState<GameMode>("swap");
  const [gameStarted, setGameStarted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        toast.success("Photo loaded! Select mode and difficulty to start.");
      };
      reader.readAsDataURL(file);
    }
  };

  const startGame = () => {
    if (!image) {
      toast.error("Please capture or upload a photo first");
      return;
    }
    setGameStarted(true);
  };

  if (gameStarted && image) {
    if (gameMode === "classic") {
      return (
        <ClassicJigsawGame
          image={image}
          difficulty={difficulty}
          onBack={() => setGameStarted(false)}
        />
      );
    }
    return (
      <PuzzleGame
        image={image}
        difficulty={difficulty}
        onBack={() => setGameStarted(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Single Player Mode</h2>
          <p className="text-muted-foreground">Capture or upload a photo to begin</p>
        </div>
        <Button
          onClick={() => setShowStats(true)}
          variant="outline"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
        >
          <BarChart3 className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
      {/* Image Capture/Upload */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              size="lg"
              className="h-24 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            >
              <Camera className="mr-2 h-6 w-6" />
              Take Photo
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              size="lg"
              className="h-24"
            >
              <Upload className="mr-2 h-6 w-6" />
              Upload Photo
            </Button>
          </div>

          {image && (
            <div className="mt-6">
              <img
                src={image}
                alt="Selected"
                className="w-full h-64 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
        </Card>

        {/* Game Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Game Mode
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                gameMode === "swap"
                  ? "bg-gradient-to-br from-primary to-primary-glow border-2 border-white/50 shadow-lg"
                  : "bg-card/50 backdrop-blur-sm hover:bg-card/80"
              }`}
              onClick={() => setGameMode("swap")}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${gameMode === "swap" ? "bg-white/20" : "bg-primary/10"}`}>
                  <Grid3X3 className={`h-5 w-5 ${gameMode === "swap" ? "text-white" : "text-primary"}`} />
                </div>
                <div>
                  <div className={`font-bold ${gameMode === "swap" ? "text-white" : "text-foreground"}`}>
                    Swap Mode
                  </div>
                  <div className={`text-xs ${gameMode === "swap" ? "text-white/80" : "text-muted-foreground"}`}>
                    Swap pieces on a grid
                  </div>
                </div>
              </div>
            </Card>
            <Card
              className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                gameMode === "classic"
                  ? "bg-gradient-to-br from-accent to-accent-glow border-2 border-white/50 shadow-lg"
                  : "bg-card/50 backdrop-blur-sm hover:bg-card/80"
              }`}
              onClick={() => setGameMode("classic")}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${gameMode === "classic" ? "bg-white/20" : "bg-accent/10"}`}>
                  <Puzzle className={`h-5 w-5 ${gameMode === "classic" ? "text-white" : "text-accent"}`} />
                </div>
                <div>
                  <div className={`font-bold ${gameMode === "classic" ? "text-white" : "text-foreground"}`}>
                    Classic Jigsaw
                  </div>
                  <div className={`text-xs ${gameMode === "classic" ? "text-white/80" : "text-muted-foreground"}`}>
                    Drag from tray to board
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Difficulty Selection */}
        <DifficultySelector
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />

        {/* Start Button */}
        <Button
          onClick={startGame}
          disabled={!image}
          size="lg"
          className="w-full h-16 text-lg bg-gradient-to-r from-success to-success/70 hover:opacity-90 disabled:opacity-50"
        >
          Start Puzzle
        </Button>
      </div>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
};
