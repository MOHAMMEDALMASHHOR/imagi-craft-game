import { useState } from "react";
import { Camera, Users, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { SinglePlayerMode } from "./photo-puzzle/SinglePlayerMode";
import { TwoPlayerMode } from "./photo-puzzle/TwoPlayerMode";

type Mode = "select" | "single" | "two-player";

export const PhotoPuzzle = () => {
  const [mode, setMode] = useState<Mode>("select");

  if (mode === "single") {
    return <SinglePlayerMode onBack={() => setMode("select")} />;
  }

  if (mode === "two-player") {
    return <TwoPlayerMode onBack={() => setMode("select")} />;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 safe-area-inset-bottom">
      <div className="text-center mb-8 animate-fade-in">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary-glow animate-glow" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-2xl">
            <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-accent animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Photo Puzzle
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Turn your photos into puzzles
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card
          className="p-6 cursor-pointer transition-all active:scale-[0.98] hover:scale-[1.02] bg-gradient-to-br from-primary/20 to-primary-glow/10 backdrop-blur-sm border-primary/30 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20 animate-fade-in"
          onClick={() => setMode("single")}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
              <User className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Single Player
              </h2>
              <p className="text-sm text-muted-foreground">
                Challenge yourself with custom puzzles
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer transition-all active:scale-[0.98] hover:scale-[1.02] bg-gradient-to-br from-accent/20 to-accent-glow/10 backdrop-blur-sm border-accent/30 hover:border-accent/60 hover:shadow-xl hover:shadow-accent/20 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
          onClick={() => setMode("two-player")}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-accent-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Two Players
              </h2>
              <p className="text-sm text-muted-foreground">
                Split-screen competition mode
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
