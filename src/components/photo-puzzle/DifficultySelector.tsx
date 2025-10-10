import { Card } from "../ui/card";

type Difficulty = "easy" | "medium" | "hard";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const difficulties = [
  { value: "easy" as Difficulty, label: "Easy", pieces: "8 pieces", color: "from-success to-success/70" },
  { value: "medium" as Difficulty, label: "Medium", pieces: "16 pieces", color: "from-primary to-primary-glow" },
  { value: "hard" as Difficulty, label: "Hard", pieces: "32 pieces", color: "from-accent to-accent-glow" },
];

export const DifficultySelector = ({ difficulty, onDifficultyChange }: DifficultySelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Difficulty
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((diff) => (
          <Card
            key={diff.value}
            className={`p-4 cursor-pointer transition-all hover:scale-105 ${
              difficulty === diff.value
                ? `bg-gradient-to-br ${diff.color} border-2 border-white/50 shadow-lg`
                : "bg-card/50 backdrop-blur-sm hover:bg-card/80"
            }`}
            onClick={() => onDifficultyChange(diff.value)}
          >
            <div className="text-center">
              <div className={`text-lg font-bold mb-1 ${difficulty === diff.value ? "text-white" : "text-foreground"}`}>
                {diff.label}
              </div>
              <div className={`text-xs ${difficulty === diff.value ? "text-white/80" : "text-muted-foreground"}`}>
                {diff.pieces}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
