import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Calendar } from "lucide-react";

const DailyReview = () => {
  const navigate = useNavigate();
  const [dueItems, setDueItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDueItems();
  }, []);

  const loadDueItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("user_item_state")
        .select(`
          *,
          items (
            id,
            question,
            correct_answer,
            type
          )
        `)
        .eq("user_id", user.id)
        .lte("next_due", now)
        .order("next_due", { ascending: true })
        .limit(20);

      if (error) throw error;
      setDueItems(data || []);
    } catch (error) {
      console.error("Error loading due items:", error);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Daily Review
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Spaced Repetition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Review items at optimal intervals to maximize retention using the SM-2 algorithm.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-3xl font-bold text-primary">{dueItems.length}</p>
                <p className="text-sm text-muted-foreground">Items due today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {dueItems.length > 0 ? (
          <div className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => navigate("/")}>
              Start Review Session
            </Button>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Review Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dueItems.slice(0, 5).map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-muted/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">Item {index + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          Interval: {item.interval} days
                        </p>
                      </div>
                      <span className="text-2xl">📝</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="text-center py-12">
              <p className="text-5xl mb-4">🎉</p>
              <h3 className="text-xl font-bold mb-2">All caught up!</h3>
              <p className="text-muted-foreground mb-6">
                No items due for review right now. Complete more lessons to add items to your review queue.
              </p>
              <Button onClick={() => navigate("/courses")}>
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DailyReview;