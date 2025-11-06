import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Trophy, Calendar, Edit2 } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({
    totalGames: 0,
    totalScore: 0,
    bestScores: [] as any[],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    await loadProfile(session.user.id);
    await loadStats(session.user.id);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setUsername(data.username || '');
    }
  };

  const loadStats = async (userId: string) => {
    const { data: scores } = await supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId);

    if (scores) {
      const totalGames = scores.length;
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      
      // Get best score for each game type
      const bestScoresMap = new Map();
      scores.forEach(s => {
        const current = bestScoresMap.get(s.game_type);
        if (!current || s.score > current.score) {
          bestScoresMap.set(s.game_type, s);
        }
      });

      setStats({
        totalGames,
        totalScore,
        bestScores: Array.from(bestScoresMap.values()),
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditing(false);
      loadProfile(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const initials = profile?.username
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex justify-center mb-4">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <h1 className="text-4xl font-bold mb-2">{profile?.username || 'User'}</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Stats</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Games:</span>
              <span className="font-bold">{stats.totalGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Score:</span>
              <span className="font-bold">{stats.totalScore}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Profile</h2>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} size="sm">
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-bold">{profile?.username}</span>
              </div>
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </Card>
      </div>

      {stats.bestScores.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-success" />
            <h2 className="text-xl font-bold">Best Scores</h2>
          </div>
          <div className="space-y-3">
            {stats.bestScores.map((score) => (
              <div key={score.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-bold capitalize">{score.game_type.replace('-', ' ')}</div>
                  {score.difficulty && (
                    <div className="text-sm text-muted-foreground">{score.difficulty}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{score.score}</div>
                  {score.time_seconds && (
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(score.time_seconds / 60)}:{(score.time_seconds % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Games
        </Button>
      </div>
    </div>
  );
}
