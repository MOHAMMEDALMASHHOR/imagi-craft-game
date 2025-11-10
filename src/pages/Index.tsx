import { useState } from "react";
import { GameGrid } from "@/components/GameGrid";
import { PhotoPuzzle } from "@/components/PhotoPuzzle";
import { MemoryMatch } from "@/components/games/MemoryMatch";
import { SlidingPuzzle } from "@/components/games/SlidingPuzzle";
import { Game2048 } from "@/components/games/Game2048";
import { Sudoku } from "@/components/games/Sudoku";
import { WordSearch } from "@/components/games/WordSearch";
import { SimonSays } from "@/components/games/SimonSays";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { UserProfile } from "@/components/UserProfile";
import { SoundToggle } from "@/components/SoundToggle";

export type GameType = 
  | "home"
  | "photo-puzzle" 
  | "memory-match" 
  | "sliding-puzzle" 
  | "2048" 
  | "sudoku" 
  | "word-search" 
  | "simon-says";

const Index = () => {
  const [currentGame, setCurrentGame] = useState<GameType>("home");

  const renderGame = () => {
    switch (currentGame) {
      case "photo-puzzle":
        return <PhotoPuzzle />;
      case "memory-match":
        return <MemoryMatch />;
      case "sliding-puzzle":
        return <SlidingPuzzle />;
      case "2048":
        return <Game2048 />;
      case "sudoku":
        return <Sudoku />;
      case "word-search":
        return <WordSearch />;
      case "simon-says":
        return <SimonSays />;
      default:
        return <GameGrid onGameSelect={setCurrentGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5 animate-float" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header - only show on home screen */}
      {currentGame === "home" && (
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-glow animate-glow">
                  <Gamepad2 className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                    Brain Games
                  </h1>
                  <p className="text-xs text-muted-foreground">Train your mind, challenge yourself</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SoundToggle />
                <UserProfile />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Back button for game screens */}
      {currentGame !== "home" && (
        <>
          <div className="absolute top-4 left-4 z-50 animate-fade-in">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setCurrentGame("home")}
              className="rounded-full shadow-lg backdrop-blur-sm bg-card/80 hover:bg-card transition-all hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 animate-fade-in">
            <SoundToggle />
            <UserProfile />
          </div>
        </>
      )}

      {/* Game content */}
      <div className="relative z-10">
        {renderGame()}
      </div>
    </div>
  );
};

export default Index;
