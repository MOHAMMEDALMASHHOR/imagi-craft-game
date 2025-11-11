import { Camera, Grid3x3, Square, Zap, Hash, Search, Lightbulb, Sparkles, Trophy, Bomb } from "lucide-react";
import { GameType } from "@/pages/Index";
import { Card } from "./ui/card";
import { useIsMobile, useIsTouchDevice } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { soundManager } from "@/lib/sounds";

interface GameGridProps {
  onGameSelect: (game: GameType) => void;
}

const games = [
  {
    id: "photo-puzzle" as GameType,
    title: "Photo Puzzle",
    description: "Create puzzles from your photos",
    icon: Camera,
    gradient: "from-primary via-primary-glow to-primary",
    iconBg: "bg-primary/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
    featured: true,
  },
  {
    id: "memory-match" as GameType,
    title: "Memory Match",
    description: "Find matching pairs",
    icon: Grid3x3,
    gradient: "from-accent via-accent-glow to-accent",
    iconBg: "bg-accent/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(251,146,60,0.5)]",
  },
  {
    id: "sliding-puzzle" as GameType,
    title: "Sliding Puzzle",
    description: "Slide tiles to solve",
    icon: Square,
    gradient: "from-success via-success/80 to-success",
    iconBg: "bg-success/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]",
  },
  {
    id: "2048" as GameType,
    title: "2048",
    description: "Merge tiles to reach 2048",
    icon: Zap,
    gradient: "from-primary via-accent to-primary-glow",
    iconBg: "bg-gradient-to-br from-primary/20 to-accent/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
  },
  {
    id: "sudoku" as GameType,
    title: "Sudoku",
    description: "Number puzzle challenge",
    icon: Hash,
    gradient: "from-accent via-primary to-accent-glow",
    iconBg: "bg-gradient-to-br from-accent/20 to-primary/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(251,146,60,0.5)]",
  },
  {
    id: "word-search" as GameType,
    title: "Word Search",
    description: "Find hidden words",
    icon: Search,
    gradient: "from-success via-primary to-primary-glow",
    iconBg: "bg-gradient-to-br from-success/20 to-primary/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]",
  },
  {
    id: "simon-says" as GameType,
    title: "Simon Says",
    description: "Remember the pattern",
    icon: Lightbulb,
    gradient: "from-primary-glow via-accent to-accent-glow",
    iconBg: "bg-gradient-to-br from-primary/20 to-accent/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
  },
  {
    id: "minesweeper" as GameType,
    title: "Minesweeper",
    description: "Clear the minefield",
    icon: Bomb,
    gradient: "from-destructive via-primary to-accent",
    iconBg: "bg-gradient-to-br from-destructive/20 to-primary/20",
    borderGlow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
  },
];

export const GameGrid = ({ onGameSelect }: GameGridProps) => {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  const handleGameSelect = (game: GameType) => {
    soundManager.click();
    if ('vibrate' in navigator && isTouchDevice) {
      navigator.vibrate(50);
    }
    onGameSelect(game);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="inline-block mb-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Play. Compete. Win.</span>
          </div>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-bounce-in leading-tight">
          Challenge Your Mind
        </h2>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Dive into a world of engaging brain games, track your progress, and compete with players worldwide
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="px-6 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="text-2xl font-bold text-primary">8</div>
            <div className="text-xs text-muted-foreground">Games</div>
          </div>
          <div className="px-6 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="text-2xl font-bold text-accent">Daily</div>
            <div className="text-xs text-muted-foreground">Challenges</div>
          </div>
          <div className="px-6 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="text-2xl font-bold text-success">Global</div>
            <div className="text-xs text-muted-foreground">Leaderboard</div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className={`grid gap-8 ${
        isMobile
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'md:grid-cols-3'
      }`}>
        {games.map((game, index) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className={cn(
                "group relative p-8 cursor-pointer transition-all duration-500 bg-card/40 backdrop-blur-xl border-2 border-border/30 overflow-hidden",
                game.borderGlow,
                "hover:border-primary/50",
                isMobile
                  ? "active:scale-95"
                  : "hover:scale-[1.05]"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
              onClick={() => handleGameSelect(game.id)}
            >
              {/* Gradient overlay on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                game.gradient
              )} />

              {/* Sparkle effect on hover */}
              {!isMobile && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:rotate-12">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-start gap-5 mb-4">
                  <div className={cn(
                    "p-4 rounded-2xl transition-all duration-500",
                    game.iconBg,
                    !isMobile && "group-hover:scale-110 group-hover:rotate-3"
                  )}>
                    <Icon className="h-8 w-8 text-primary group-hover:text-primary-glow transition-colors duration-500" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {game.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {game.description}
                </p>

                {/* Play indicator */}
                {!isMobile && (
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span>Play Now</span>
                    <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
