import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GameScoreData {
  gameType: string;
  score: number;
  difficulty?: string;
  timeSeconds?: number;
}

export const useGameScore = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveScore = async ({ gameType, score, difficulty, timeSeconds }: GameScoreData) => {
    if (!user) {
      console.log("User not logged in, score not saved");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          game_type: gameType,
          score,
          difficulty,
          time_seconds: timeSeconds,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error("Failed to save score:", error);
      toast.error("Failed to save your score");
      return null;
    }
  };

  const getHighScore = async (gameType: string, difficulty?: string) => {
    if (!user) return null;

    try {
      let query = supabase
        .from('game_scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(1);

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;

      return data?.score || 0;
    } catch (error: any) {
      console.error("Failed to get high score:", error);
      return 0;
    }
  };

  return {
    user,
    saveScore,
    getHighScore,
  };
};
