import { Card } from "../ui/card";

export const WordSearch = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
          Word Search
        </h1>
        <Card className="p-12 bg-card/50 backdrop-blur-sm">
          <p className="text-lg text-muted-foreground">Coming Soon!</p>
          <p className="text-sm text-muted-foreground mt-2">Find hidden words in the grid</p>
        </Card>
      </div>
    </div>
  );
};
