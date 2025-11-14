import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LogOut, Flame, Star, Trophy, BookOpen } from "lucide-react";

interface ProfileRecord {
  id: string;
  email?: string | null;
  xp?: number | null;
  streak?: number | null;
  daily_goal_xp?: number | null;
  daily_goal_last_adjusted?: string | null;
}

interface ProgressRecord {
  xp_earned: number | null;
  completed: boolean | null;
  completed_at: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyGoalXP, setDailyGoalXP] = useState(30);
  const [todayXp, setTodayXp] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);

  const goalPercent = Math.min(100, (todayXp / Math.max(dailyGoalXP, 1)) * 100);

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - 7);
      windowStart.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split("T")[0];

      const [profileRes, progressRes, completedCountRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("user_progress")
          .select("xp_earned, completed, completed_at")
          .eq("user_id", user.id)
          .gte("completed_at", windowStart.toISOString()),
        supabase
          .from("user_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (progressRes.error) throw progressRes.error;
      if (completedCountRes.error) throw completedCountRes.error;

      const profileData = profileRes.data as ProfileRecord;
      setProfile(profileData);
      setLessonsCompleted(completedCountRes.count ?? 0);

      const progressData = (progressRes.data ?? []) as ProgressRecord[];
      const todaysXpValue = progressData.reduce((sum, record) => {
        if (!record.completed_at) return sum;
        const completedDate = new Date(record.completed_at);
        return completedDate.toDateString() === today.toDateString() ? sum + (record.xp_earned ?? 0) : sum;
      }, 0);
      setTodayXp(todaysXpValue);

      const rollingXp = progressData.reduce((sum, record) => sum + (record.xp_earned ?? 0), 0);

      let goal = profileData?.daily_goal_xp ?? 30;
      const lastAdjusted = profileData?.daily_goal_last_adjusted
        ? new Date(profileData.daily_goal_last_adjusted)
        : null;
      const needsAdjustment = !lastAdjusted || lastAdjusted.toDateString() !== today.toDateString();

      if (needsAdjustment) {
        const avgPerDay = rollingXp / 7;
        const originalGoal = goal;

        if (avgPerDay > goal * 1.2) {
          goal = Math.min(goal + 5, 120);
        } else if (avgPerDay < goal * 0.5) {
          goal = Math.max(goal - 5, 15);
        }

        if (goal !== originalGoal || !lastAdjusted || lastAdjusted.toDateString() !== today.toDateString()) {
          await supabase
            .from("profiles")
            .update({ daily_goal_xp: goal, daily_goal_last_adjusted: todayISO })
            .eq("id", user.id);
        }
      }

      setDailyGoalXP(goal);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🦉</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="text-3xl">🦉</span> LinguaLearn
          </h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 border-xp-gold/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-xp-gold" />
              <p className="text-3xl font-bold text-xp-gold">{profile?.xp || 0}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-streak-fire/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 text-streak-fire" />
              <p className="text-3xl font-bold text-streak-fire">{profile?.streak || 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-primary">{lessonsCompleted}</p>
              <p className="text-sm text-muted-foreground">Lessons completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Your Courses
          </h2>

          <Card className="border-2 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                onClick={() => navigate("/courses")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl">
                    🌍
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Start Learning</h3>
                    <p className="text-muted-foreground">Choose a language course</p>
                  </div>
                </div>
                <Button size="lg" className="rounded-full">
                  Go to Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate("/profile")}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">👤</div>
              <h3 className="font-bold">Profile</h3>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate("/review")}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🧠</div>
              <h3 className="font-bold">Daily Review</h3>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate("/playlists")}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🎧</div>
              <h3 className="font-bold">Playlists</h3>
              <p className="text-sm text-muted-foreground mt-1">Build focus tracks</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Goals Section */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Daily Goal</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {todayXp} / {dailyGoalXP} XP earned today
                </span>
                <span className="font-medium">{Math.round(goalPercent)}%</span>
              </div>
              <Progress value={goalPercent} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Goals adapt based on your past week—keep streaking to boost the challenge! 🔥
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Home;