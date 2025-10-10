import { useState } from "react";
import { Camera, Users, User } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12 animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-2xl shadow-primary/50">
          <Camera className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Photo Puzzle
        </h1>
        <p className="text-muted-foreground text-lg">
          Turn your photos into exciting puzzles
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="p-8 cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-primary/20 to-primary-glow/20 backdrop-blur-sm border-primary/50 hover:shadow-2xl hover:shadow-primary/50 animate-slide-up"
          onClick={() => setMode("single")}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
            Single Player
          </h2>
          <p className="text-center text-muted-foreground">
            Challenge yourself with custom photo puzzles in three difficulty levels
          </p>
        </Card>

        <Card
          className="p-8 cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-accent/20 to-accent-glow/20 backdrop-blur-sm border-accent/50 hover:shadow-2xl hover:shadow-accent/50 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
          onClick={() => setMode("two-player")}
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg">
            <Users className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
            Two Players
          </h2>
          <p className="text-center text-muted-foreground">
            Compete with a friend in split-screen mode with individual difficulty settings
          </p>
        </Card>
      </div>
    </div>
  );
};
