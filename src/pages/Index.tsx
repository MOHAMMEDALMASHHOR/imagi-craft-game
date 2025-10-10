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
import { ArrowLeft } from "lucide-react";

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
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 animate-gradient" />
      
      {/* Back button */}
      {currentGame !== "home" && (
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
      )}

      {/* Game content */}
      <div className="relative z-10">
        {renderGame()}
      </div>
    </div>
  );
};

export default Index;
