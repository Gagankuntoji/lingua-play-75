import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Star, Flame, Trophy, Award } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalLessons: 0, completedLessons: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      const completed = progress?.filter(p => p.completed).length || 0;

      setStats({
        totalLessons: progress?.length || 0,
        completedLessons: completed,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
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
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* User Info Card */}
        <Card className="border-2 mb-6">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl">
              🦉
            </div>
            <CardTitle className="text-2xl">{profile?.email}</CardTitle>
            <p className="text-muted-foreground">Language Learner</p>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-2 border-xp-gold/20">
            <CardContent className="pt-6 text-center">
              <Star className="w-10 h-10 mx-auto mb-2 text-xp-gold" />
              <p className="text-4xl font-bold text-xp-gold">{profile?.xp || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total XP</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-streak-fire/20">
            <CardContent className="pt-6 text-center">
              <Flame className="w-10 h-10 mx-auto mb-2 text-streak-fire" />
              <p className="text-4xl font-bold text-streak-fire">{profile?.streak || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-primary" />
              <p className="text-4xl font-bold">{stats.completedLessons}</p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6 text-center">
              <Award className="w-10 h-10 mx-auto mb-2 text-secondary" />
              <p className="text-4xl font-bold">{stats.totalLessons}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Lessons</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-muted flex items-center justify-center text-3xl opacity-30"
                >
                  🏆
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Complete lessons to unlock achievements!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;