import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  id: string;
  score: number;
  username: string;
  game_type: string;
  difficulty?: string;
  created_at: string;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('2048');

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const gameTypes = ['2048', 'photo-puzzle', 'sudoku', 'word-search', 'simon-says'];
      const allLeaderboards: Record<string, LeaderboardEntry[]> = {};

      for (const gameType of gameTypes) {
        const { data, error } = await supabase
          .from('game_scores')
          .select(`
            id,
            score,
            game_type,
            difficulty,
            created_at,
            profiles!inner(username)
          `)
          .eq('game_type', gameType)
          .order('score', { ascending: false })
          .limit(10);

        if (!error && data) {
          allLeaderboards[gameType] = data.map((entry: any) => ({
            ...entry,
            username: entry.profiles.username,
          }));
        }
      }

      setLeaderboards(allLeaderboards);
    } catch (error) {
      console.error("Failed to load leaderboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</div>;
    }
  };

  const gameNames: Record<string, string> = {
    '2048': '2048',
    'photo-puzzle': 'Photo Puzzle',
    'sudoku': 'Sudoku',
    'word-search': 'Word Search',
    'simon-says': 'Simon Says',
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading leaderboards...</div>
      </div>
    );
  }

  const currentLeaderboard = leaderboards[selectedGame] || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex justify-center mb-4">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Compete with players around the world!
        </p>
      </div>

      <Tabs value={selectedGame} onValueChange={setSelectedGame} className="mb-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-5">
          {Object.keys(gameNames).map((game) => (
            <TabsTrigger key={game} value={game}>
              {gameNames[game]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="p-6">
        {currentLeaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scores yet. Be the first to play!
          </div>
        ) : (
          <div className="space-y-3">
            {currentLeaderboard.map((entry, index) => {
              const initials = entry.username?.[0]?.toUpperCase() || '?';
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    index < 3
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-bold">{entry.username}</div>
                    {entry.difficulty && (
                      <div className="text-sm text-muted-foreground capitalize">
                        {entry.difficulty}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {entry.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Games
        </Button>
      </div>
    </div>
  );
}
