import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Target, Clock } from "lucide-react";
import { toast } from "sonner";

interface DailyChallenge {
  id: string;
  challenge_date: string;
  game_type: string;
  difficulty: string;
  target_score: number;
  description: string;
  completed?: boolean;
  user_score?: number;
}

export default function DailyChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadChallenges();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadChallenges = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: challengesData, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .gte('challenge_date', today)
        .order('challenge_date', { ascending: true })
        .limit(7);

      if (error) throw error;

      if (user) {
        const { data: completionsData } = await supabase
          .from('user_challenge_completions')
          .select('challenge_id, score')
          .eq('user_id', user.id);

        const completionsMap = new Map(
          completionsData?.map(c => [c.challenge_id, c.score]) || []
        );

        setChallenges(
          challengesData.map(c => ({
            ...c,
            completed: completionsMap.has(c.id),
            user_score: completionsMap.get(c.id),
          }))
        );
      } else {
        setChallenges(challengesData || []);
      }
    } catch (error: any) {
      toast.error("Failed to load challenges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'puzzle':
        return '🧩';
      case '2048':
        return '🔢';
      case 'sudoku':
        return '📝';
      case 'word-search':
        return '🔤';
      case 'memory':
        return '🧠';
      case 'simon':
        return '🎮';
      default:
        return '🎯';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'hard':
        return 'bg-orange-500/20 text-orange-400';
      case 'expert':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-primary/20 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex justify-center mb-4">
          <Calendar className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Daily Challenges</h1>
        <p className="text-muted-foreground">
          Complete daily challenges to earn rewards and climb the leaderboard!
        </p>
      </div>

      {!user && (
        <Card className="p-4 mb-6 bg-accent/10 border-accent">
          <p className="text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth')}
              className="text-accent-glow"
            >
              Sign in
            </Button>
            {' '}to track your progress and compete with others!
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {challenges.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No challenges available yet. Check back soon!
            </p>
          </Card>
        ) : (
          challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className={`p-6 transition-all hover:shadow-lg ${
                challenge.completed ? 'bg-success/5 border-success/30' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{getGameIcon(challenge.game_type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                    {challenge.completed && (
                      <Badge className="bg-success/20 text-success">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 capitalize">
                    {challenge.game_type.replace('-', ' ')} Challenge
                  </h3>
                  
                  <p className="text-muted-foreground mb-3">
                    {challenge.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span>Target: {challenge.target_score}</span>
                    </div>
                    {challenge.user_score && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-success" />
                        <span>Your Score: {challenge.user_score}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/')}
                  disabled={challenge.completed && !user}
                >
                  {challenge.completed ? 'Play Again' : 'Start Challenge'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Games
        </Button>
      </div>
    </div>
  );
}
