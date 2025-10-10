import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Shuffle, Trophy } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const emojis = ["🎮", "🎯", "🎨", "🎭", "🎪", "🎸", "🎺", "🎻"];

interface CardType {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export const MemoryMatch = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, matched: true } : card
          ));
          setFlippedCards([]);
          
          const allMatched = cards.every((card, idx) => 
            card.matched || idx === first || idx === second
          );
          if (allMatched) {
            setSolved(true);
            toast.success("You won!");
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        }, 1000);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) =>
            idx === first || idx === second ? { ...card, flipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  const initializeGame = () => {
    const gameEmojis = [...emojis, ...emojis];
    const shuffled = gameEmojis
      .map((emoji, idx) => ({ id: idx, emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setSolved(false);
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || cards[index].flipped || cards[index].matched) return;
    
    setCards(prev => prev.map((card, idx) =>
      idx === index ? { ...card, flipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
    setMoves(m => m + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
          Memory Match
        </h1>
        <div className="flex justify-center gap-6 text-muted-foreground">
          <p>Moves: {moves}</p>
          <Button variant="secondary" size="sm" onClick={initializeGame}>
            <Shuffle className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
        {cards.map((card, idx) => (
          <Card
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={`aspect-square cursor-pointer transition-all hover:scale-105 flex items-center justify-center text-4xl ${
              card.flipped || card.matched
                ? "bg-gradient-to-br from-primary to-primary-glow"
                : "bg-card/50 backdrop-blur-sm"
            }`}
          >
            {(card.flipped || card.matched) && card.emoji}
          </Card>
        ))}
      </div>

      {solved && (
        <div className="text-center mt-8 animate-bounce-in">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-success to-success/70 rounded-full text-white font-bold text-lg shadow-lg">
            <Trophy className="h-6 w-6" />
            Complete!
          </div>
        </div>
      )}
    </div>
  );
};
