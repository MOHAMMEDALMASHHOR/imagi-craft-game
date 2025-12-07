import { useState, useRef } from "react";
import { Camera, Upload, BarChart3, Grid3X3, Puzzle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { DifficultySelector } from "./DifficultySelector";
import { PuzzleGame } from "./PuzzleGame";
import { JigsawPuzzleGame } from "./JigsawPuzzleGame";
import { StatsModal } from "./StatsModal";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type PuzzleType = "classic" | "jigsaw";

interface SinglePlayerModeProps {
  onBack: () => void;
}

export const SinglePlayerMode = ({ onBack }: SinglePlayerModeProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzleType, setPuzzleType] = useState<PuzzleType>("jigsaw");
  const [gameStarted, setGameStarted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        toast.success("Photo loaded! Select difficulty to start.");
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
    if (puzzleType === "jigsaw") {
      return (
        <JigsawPuzzleGame
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
        <div className="flex items-center gap-2">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-foreground min-h-[44px]"
          >
            ← Back
          </Button>
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-foreground">Single Player</h2>
            <p className="text-muted-foreground text-sm">Capture or upload a photo to begin</p>
          </div>
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

        {/* Puzzle Type Selection */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Puzzle Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setPuzzleType("jigsaw")}
              variant={puzzleType === "jigsaw" ? "default" : "outline"}
              size="lg"
              className="h-20 flex flex-col gap-1"
            >
              <Puzzle className="h-6 w-6" />
              <span>Jigsaw</span>
              <span className="text-xs opacity-70">Pick & Place or Swap</span>
            </Button>
            <Button
              onClick={() => setPuzzleType("classic")}
              variant={puzzleType === "classic" ? "default" : "outline"}
              size="lg"
              className="h-20 flex flex-col gap-1"
            >
              <Grid3X3 className="h-6 w-6" />
              <span>Classic</span>
              <span className="text-xs opacity-70">Swap pieces</span>
            </Button>
          </div>
        </Card>

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
