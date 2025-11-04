import { X, Trophy, Clock, Target, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { usePuzzleRecords } from "@/hooks/use-puzzle-records";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const StatsModal = ({ isOpen, onClose }: StatsModalProps) => {
  const { stats, clearStats } = usePuzzleRecords();

  if (!isOpen) return null;

  const difficulties = ['easy', 'medium', 'hard'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in p-4">
      <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card/95 backdrop-blur-sm">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Statistics</h2>
          <p className="text-muted-foreground">Track your puzzle solving progress</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary-glow/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Games</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.gamesPlayed}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent-glow/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Avg Moves</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.averageMoves || 0}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-success/10 to-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Avg Time</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.averageTime ? formatTime(stats.averageTime) : '0:00'}
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-warning/10 to-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Records</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Object.keys(stats.bestRecords).length}
            </p>
          </Card>
        </div>

        {/* Best Records by Difficulty */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Best Records</h3>
          
          {difficulties.map((difficulty) => {
            const record = stats.bestRecords[difficulty];
            
            return (
              <Card
                key={difficulty}
                className={`p-4 ${
                  record
                    ? 'bg-gradient-to-r from-card to-primary/5 border-primary/20'
                    : 'bg-card/50 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground capitalize mb-1">
                      {difficulty}
                    </h4>
                    {record ? (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {record.moves} moves
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(record.time)}
                        </span>
                        <span className="text-xs">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No record yet</p>
                    )}
                  </div>
                  {record && (
                    <Trophy className="h-8 w-8 text-warning" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Clear Stats Button */}
        {stats.gamesPlayed > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to clear all statistics?')) {
                  clearStats();
                  onClose();
                }
              }}
              variant="destructive"
              className="w-full"
            >
              Clear All Statistics
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
