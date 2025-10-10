import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";

const GRID_SIZE = 4;
const EMPTY_TILE = GRID_SIZE * GRID_SIZE - 1;

export const SlidingPuzzle = () => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newTiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    
    // Shuffle
    for (let i = 0; i < 100; i++) {
      const emptyIndex = newTiles.indexOf(EMPTY_TILE);
      const neighbors = getNeighbors(emptyIndex);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      [newTiles[emptyIndex], newTiles[randomNeighbor]] = [newTiles[randomNeighbor], newTiles[emptyIndex]];
    }
    
    setTiles(newTiles);
    setMoves(0);
  };

  const getNeighbors = (index: number) => {
    const neighbors = [];
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    
    if (row > 0) neighbors.push(index - GRID_SIZE);
    if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE);
    if (col > 0) neighbors.push(index - 1);
    if (col < GRID_SIZE - 1) neighbors.push(index + 1);
    
    return neighbors;
  };

  const handleTileClick = (index: number) => {
    const emptyIndex = tiles.indexOf(EMPTY_TILE);
    const neighbors = getNeighbors(emptyIndex);
    
    if (neighbors.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setMoves(moves + 1);
      
      if (newTiles.every((tile, idx) => tile === idx)) {
        toast.success(`Solved in ${moves + 1} moves!`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent">
          Sliding Puzzle
        </h1>
        <div className="flex justify-center gap-6 text-muted-foreground">
          <p>Moves: {moves}</p>
          <Button variant="secondary" size="sm" onClick={initializeGame}>
            <Shuffle className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
        {tiles.map((tile, idx) => (
          <Card
            key={idx}
            onClick={() => handleTileClick(idx)}
            className={`aspect-square cursor-pointer transition-all hover:scale-105 flex items-center justify-center text-2xl font-bold ${
              tile === EMPTY_TILE
                ? "bg-transparent border-dashed"
                : "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
            }`}
          >
            {tile !== EMPTY_TILE && tile + 1}
          </Card>
        ))}
      </div>
    </div>
  );
};
