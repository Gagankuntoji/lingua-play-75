import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Star, Flame, Trophy, Award, Key, Save, Eye, EyeOff } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalLessons: 0, completedLessons: 0 });
  const [loading, setLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadApiKey();
  }, []);

  const loadApiKey = () => {
    // Load from localStorage (client-side only)
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setGeminiApiKey(stored);
    } else {
      // Check if set in env (for development)
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (envKey) {
        setGeminiApiKey(envKey);
      }
    }
  };

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      // Store in localStorage
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
      
      // Update the environment variable for current session
      // Note: This won't persist across page reloads, but will work for current session
      (window as any).__GEMINI_API_KEY__ = geminiApiKey.trim();
      
      toast({
        title: "API Key saved!",
        description: "Your Gemini API key has been saved. Refresh the page to use it.",
      });
    } catch (error) {
      toast({
        title: "Error saving API key",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

        {/* API Key Configuration */}
        <Card className="border-2 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Gemini AI API Key
            </CardTitle>
            <CardDescription>
              Configure your free Gemini API key for AI feedback and grammar correction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Gemini API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button onClick={handleSaveApiKey} disabled={saving}>
                  {saving ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Get your free API key:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                  <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Create API Key"</li>
                  <li>Copy and paste the key above</li>
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

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