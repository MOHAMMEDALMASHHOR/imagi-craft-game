import { useState, useRef } from "react";
import { Camera, Upload, User } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "sonner";
import { DifficultySelector } from "./DifficultySelector";
import { SplitScreenGame } from "./SplitScreenGame";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface PlayerData {
  image: string | null;
  difficulty: Difficulty;
}

interface TwoPlayerModeProps {
  onBack: () => void;
}

export const TwoPlayerMode = ({ onBack }: TwoPlayerModeProps) => {
  const [player1, setPlayer1] = useState<PlayerData>({ image: null, difficulty: "easy" });
  const [player2, setPlayer2] = useState<PlayerData>({ image: null, difficulty: "easy" });
  const [gameStarted, setGameStarted] = useState(false);
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleImageCapture = (player: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = e.target?.result as string;
        if (player === 1) {
          setPlayer1({ ...player1, image });
        } else {
          setPlayer2({ ...player2, image });
        }
        toast.success(`Player ${player} photo loaded!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGame = () => {
    if (!player1.image || !player2.image) {
      toast.error("Both players need to capture photos");
      return;
    }
    setGameStarted(true);
  };

  if (gameStarted && player1.image && player2.image) {
    return (
      <SplitScreenGame
        player1={{ image: player1.image, difficulty: player1.difficulty }}
        player2={{ image: player2.image, difficulty: player2.difficulty }}
        onBack={() => setGameStarted(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="text-3xl font-bold mb-2 text-foreground">Two Player Mode</h2>
        <p className="text-muted-foreground">Each player captures a photo and selects difficulty</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Player 1 */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary-glow/10 backdrop-blur-sm border-primary/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Player 1</h3>
          </div>

          <input
            ref={fileInputRef1}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageCapture(1, e)}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => fileInputRef1.current?.click()}
                variant="default"
                size="sm"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take
              </Button>
              <Button
                onClick={() => fileInputRef1.current?.click()}
                variant="secondary"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            {player1.image && (
              <img
                src={player1.image}
                alt="Player 1"
                className="w-full h-40 object-cover rounded-lg shadow-lg"
              />
            )}

            <DifficultySelector
              difficulty={player1.difficulty}
              onDifficultyChange={(d) => setPlayer1({ ...player1, difficulty: d })}
            />
          </div>
        </Card>

        {/* Player 2 */}
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent-glow/10 backdrop-blur-sm border-accent/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Player 2</h3>
          </div>

          <input
            ref={fileInputRef2}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImageCapture(2, e)}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => fileInputRef2.current?.click()}
                variant="default"
                size="sm"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take
              </Button>
              <Button
                onClick={() => fileInputRef2.current?.click()}
                variant="secondary"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            {player2.image && (
              <img
                src={player2.image}
                alt="Player 2"
                className="w-full h-40 object-cover rounded-lg shadow-lg"
              />
            )}

            <DifficultySelector
              difficulty={player2.difficulty}
              onDifficultyChange={(d) => setPlayer2({ ...player2, difficulty: d })}
            />
          </div>
        </Card>
      </div>

      <Button
        onClick={startGame}
        disabled={!player1.image || !player2.image}
        size="lg"
        className="w-full h-16 text-lg mt-6 bg-gradient-to-r from-success to-success/70 hover:opacity-90 disabled:opacity-50"
      >
        Start Game
      </Button>
    </div>
  );
};
