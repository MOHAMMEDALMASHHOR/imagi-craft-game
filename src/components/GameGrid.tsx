import { Camera, Grid3x3, Square, Zap, Hash, Search, Lightbulb } from "lucide-react";
import { GameType } from "@/pages/Index";
import { Card } from "./ui/card";
import { useIsMobile, useIsTouchDevice } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface GameGridProps {
  onGameSelect: (game: GameType) => void;
}

const games = [
  {
    id: "photo-puzzle" as GameType,
    title: "Photo Puzzle",
    description: "Create puzzles from your photos",
    icon: Camera,
    gradient: "from-primary to-primary-glow",
    featured: true,
  },
  {
    id: "memory-match" as GameType,
    title: "Memory Match",
    description: "Find matching pairs",
    icon: Grid3x3,
    gradient: "from-accent to-accent-glow",
  },
  {
    id: "sliding-puzzle" as GameType,
    title: "Sliding Puzzle",
    description: "Slide tiles to solve",
    icon: Square,
    gradient: "from-success to-success/70",
  },
  {
    id: "2048" as GameType,
    title: "2048",
    description: "Merge tiles to reach 2048",
    icon: Zap,
    gradient: "from-primary to-accent",
  },
  {
    id: "sudoku" as GameType,
    title: "Sudoku",
    description: "Number puzzle challenge",
    icon: Hash,
    gradient: "from-accent to-primary",
  },
  {
    id: "word-search" as GameType,
    title: "Word Search",
    description: "Find hidden words",
    icon: Search,
    gradient: "from-success to-primary",
  },
  {
    id: "simon-says" as GameType,
    title: "Simon Says",
    description: "Remember the pattern",
    icon: Lightbulb,
    gradient: "from-accent-glow to-success",
  },
];

export const GameGrid = ({ onGameSelect }: GameGridProps) => {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  const handleGameSelect = (game: GameType) => {
    if ('vibrate' in navigator && isTouchDevice) {
      navigator.vibrate(50);
    }
    onGameSelect(game);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl pb-20 md:pb-8">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Puzzle Paradise
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Choose your puzzle adventure
        </p>
      </div>

      {/* Featured Game */}
      <Card
        className={cn(
          "p-4 md:p-6 mb-6 md:mb-8 cursor-pointer transition-all animate-bounce-in bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm border-primary/50",
          isMobile
            ? "active:scale-95 hover:bg-card/90"
            : "hover:scale-105 hover:shadow-2xl hover:shadow-primary/50"
        )}
        style={{
          animationDelay: "0s",
        }}
        onClick={() => handleGameSelect("photo-puzzle")}
      >
        <div className={`flex items-center gap-4 md:gap-6 ${isMobile ? 'flex-col text-center' : ''}`}>
          <div className={`${
            isMobile ? 'w-16 h-16' : 'w-20 h-20'
          } rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg`}>
            <Camera className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-primary-foreground`} />
          </div>
          <div className="flex-1">
            <div className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-3 mb-2`}>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
                Photo Puzzle
              </h2>
              <span className="px-3 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                FEATURED
              </span>
            </div>
            <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-muted-foreground`}>
              Create custom puzzles from your photos with multiple difficulty levels and 2-player mode
            </p>
          </div>
        </div>
      </Card>

      {/* Game Grid */}
      <div className={`grid gap-4 md:gap-6 ${
        isMobile
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'md:grid-cols-3'
      }`}>
        {games.slice(1).map((game, index) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className={cn(
                "p-4 md:p-6 cursor-pointer transition-all bg-card/50 backdrop-blur-sm min-h-[120px]",
                isMobile
                  ? "active:scale-95 active:bg-card/80"
                  : "hover:scale-105 hover:bg-card/80 hover:shadow-xl"
              )}
              style={{
                animationDelay: `${(index + 1) * 0.1}s`,
              }}
              onClick={() => handleGameSelect(game.id)}
            >
              <div className={`${
                isMobile ? 'w-14 h-14' : 'w-16 h-16'
              } rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-3 md:mb-4 shadow-lg`}>
                <Icon className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} text-white`} />
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-2 text-foreground`}>
                {game.title}
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {game.description}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
