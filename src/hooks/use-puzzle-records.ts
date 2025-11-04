import { useState, useEffect } from "react";

export interface PuzzleRecord {
  difficulty: string;
  moves: number;
  time: number;
  date: number;
}

export interface PuzzleStats {
  gamesPlayed: number;
  averageMoves: number;
  averageTime: number;
  bestRecords: {
    easy?: PuzzleRecord;
    medium?: PuzzleRecord;
    hard?: PuzzleRecord;
    expert?: PuzzleRecord;
  };
}

const STATS_KEY = "puzzle-stats";

export const usePuzzleRecords = () => {
  const [stats, setStats] = useState<PuzzleStats>({
    gamesPlayed: 0,
    averageMoves: 0,
    averageTime: 0,
    bestRecords: {},
  });

  useEffect(() => {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (error) {
        console.warn("Failed to load puzzle stats:", error);
      }
    }
  }, []);

  const saveRecord = (difficulty: string, moves: number, time: number) => {
    setStats((prev) => {
      const newStats = { ...prev };
      const currentBest = newStats.bestRecords[difficulty as keyof typeof newStats.bestRecords];

      // Update best record for this difficulty
      if (!currentBest || moves < currentBest.moves || (moves === currentBest.moves && time < currentBest.time)) {
        newStats.bestRecords[difficulty as keyof typeof newStats.bestRecords] = {
          difficulty,
          moves,
          time,
          date: Date.now(),
        };
      }

      // Update overall stats
      const totalGames = prev.gamesPlayed + 1;
      newStats.gamesPlayed = totalGames;
      newStats.averageMoves = Math.round((prev.averageMoves * prev.gamesPlayed + moves) / totalGames);
      newStats.averageTime = Math.round((prev.averageTime * prev.gamesPlayed + time) / totalGames);

      // Save to localStorage
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));

      return newStats;
    });
  };

  const clearStats = () => {
    const emptyStats: PuzzleStats = {
      gamesPlayed: 0,
      averageMoves: 0,
      averageTime: 0,
      bestRecords: {},
    };
    setStats(emptyStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(emptyStats));
  };

  return {
    stats,
    saveRecord,
    clearStats,
  };
};
