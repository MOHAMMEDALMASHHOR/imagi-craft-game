import { Card } from "../ui/card";

export const SimonSays = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-glow to-success bg-clip-text text-transparent">
          Simon Says
        </h1>
        <Card className="p-12 bg-card/50 backdrop-blur-sm">
          <p className="text-lg text-muted-foreground">Coming Soon!</p>
          <p className="text-sm text-muted-foreground mt-2">Remember and repeat the pattern</p>
        </Card>
      </div>
    </div>
  );
};
