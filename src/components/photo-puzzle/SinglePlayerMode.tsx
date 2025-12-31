import { useState, useRef } from "react";
import { Camera, Upload, BarChart3, Puzzle, Grid3X3, ArrowLeft, Play, ImagePlus } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-24 safe-area-inset-bottom">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-foreground">Single Player</h2>
          <Button
            onClick={() => setShowStats(true)}
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] -mr-2"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Image Upload Section */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
          
          {image ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img
                  src={image}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3 min-h-[40px]"
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-border/50 bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <p className="text-foreground font-medium">Take or Upload Photo</p>
                <p className="text-sm text-muted-foreground">Tap to select an image</p>
              </div>
            </div>
          )}
        </Card>

        {/* Game Mode Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Game Mode
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`p-4 cursor-pointer transition-all active:scale-[0.98] min-h-[80px] ${
                gameMode === "swap"
                  ? "bg-gradient-to-br from-primary to-primary-glow border-2 border-white/30 shadow-lg shadow-primary/30"
                  : "bg-card/50 backdrop-blur-sm hover:bg-card/80 border-border/50"
              }`}
              onClick={() => setGameMode("swap")}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`p-2.5 rounded-xl ${gameMode === "swap" ? "bg-white/20" : "bg-primary/10"}`}>
                  <Grid3X3 className={`h-6 w-6 ${gameMode === "swap" ? "text-white" : "text-primary"}`} />
                </div>
                <div>
                  <div className={`font-bold text-sm ${gameMode === "swap" ? "text-white" : "text-foreground"}`}>
                    Swap
                  </div>
                  <div className={`text-xs ${gameMode === "swap" ? "text-white/70" : "text-muted-foreground"}`}>
                    Grid swap
                  </div>
                </div>
              </div>
            </Card>
            <Card
              className={`p-4 cursor-pointer transition-all active:scale-[0.98] min-h-[80px] ${
                gameMode === "classic"
                  ? "bg-gradient-to-br from-accent to-accent-glow border-2 border-white/30 shadow-lg shadow-accent/30"
                  : "bg-card/50 backdrop-blur-sm hover:bg-card/80 border-border/50"
              }`}
              onClick={() => setGameMode("classic")}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`p-2.5 rounded-xl ${gameMode === "classic" ? "bg-white/20" : "bg-accent/10"}`}>
                  <Puzzle className={`h-6 w-6 ${gameMode === "classic" ? "text-white" : "text-accent"}`} />
                </div>
                <div>
                  <div className={`font-bold text-sm ${gameMode === "classic" ? "text-white" : "text-foreground"}`}>
                    Jigsaw
                  </div>
                  <div className={`text-xs ${gameMode === "classic" ? "text-white/70" : "text-muted-foreground"}`}>
                    Tray to board
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

        {/* Start Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom">
          <Button
            onClick={startGame}
            disabled={!image}
            size="lg"
            className="w-full max-w-lg mx-auto flex h-14 text-lg font-bold bg-gradient-to-r from-success to-success/80 hover:opacity-90 disabled:opacity-40 shadow-lg shadow-success/30"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Puzzle
          </Button>
        </div>
      </div>

      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
};
