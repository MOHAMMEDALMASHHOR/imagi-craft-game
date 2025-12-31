import { Card } from "../ui/card";
import { Zap, Flame, Target, Crown } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const difficulties = [
  { value: "easy" as Difficulty, label: "Easy", pieces: "9 pcs", color: "from-success to-success/70", icon: Zap },
  { value: "medium" as Difficulty, label: "Medium", pieces: "16 pcs", color: "from-primary to-primary-glow", icon: Target },
  { value: "hard" as Difficulty, label: "Hard", pieces: "25 pcs", color: "from-accent to-accent-glow", icon: Flame },
  { value: "expert" as Difficulty, label: "Expert", pieces: "36 pcs", color: "from-purple-600 to-purple-400", icon: Crown },
];

export const DifficultySelector = ({ difficulty, onDifficultyChange }: DifficultySelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Difficulty
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {difficulties.map((diff) => {
          const Icon = diff.icon;
          const isSelected = difficulty === diff.value;
          
          return (
            <Card
              key={diff.value}
              className={`p-3 cursor-pointer transition-all active:scale-[0.95] min-h-[72px] ${
                isSelected
                  ? `bg-gradient-to-br ${diff.color} border-2 border-white/30 shadow-lg`
                  : "bg-card/50 backdrop-blur-sm hover:bg-card/80 border-border/50"
              }`}
              onClick={() => onDifficultyChange(diff.value)}
            >
              <div className="flex flex-col items-center text-center gap-1">
                <Icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-foreground"}`}>
                  {diff.label}
                </div>
                <div className={`text-[10px] ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                  {diff.pieces}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
