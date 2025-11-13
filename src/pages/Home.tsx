import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LogOut, Flame, Star, Trophy, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
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
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="grid grid-cols-3 gap-4 mb-8">
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
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
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
        <div className="grid grid-cols-2 gap-4 mb-8">
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
        </div>

        {/* Daily Goals Section */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Daily Goal</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">0 / 20 XP earned today</span>
                <span className="font-medium">0%</span>
              </div>
              <Progress value={0} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Complete lessons to earn XP and maintain your streak! 🔥
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Home;