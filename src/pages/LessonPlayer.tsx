import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Volume2, Mic, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MultipleChoiceExercise from "@/components/exercises/MultipleChoiceExercise";
import TranslateExercise from "@/components/exercises/TranslateExercise";
import FillBlankExercise from "@/components/exercises/FillBlankExercise";

interface Item {
  id: string;
  type: string;
  question: string;
  correct_answer: string;
  options: any;
  audio_url: string | null;
  explanation: string | null;
  order_index: number;
}

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    loadItems();
  }, [lessonId]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      const parsedItems = (data || []).map(item => ({
        ...item,
        options: item.options ? (typeof item.options === 'string' ? JSON.parse(item.options) : item.options) : null
      }));
      
      setItems(parsedItems);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAnswer = (text: string) => {
    return text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  };

  const checkAnswer = async () => {
    const currentItem = items[currentIndex];
    const normalizedAnswer = normalizeAnswer(answer);
    const normalizedCorrect = normalizeAnswer(currentItem.correct_answer);
    const correct = normalizedAnswer === normalizedCorrect;

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const points = 10;
      setXpEarned(prev => prev + points);

      // Save attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_attempts").insert({
          user_id: user.id,
          item_id: currentItem.id,
          user_answer: answer,
          correct: true,
          score: points,
        });
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswer("");
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update user progress
    await supabase.from("user_progress").upsert({
      user_id: user.id,
      lesson_id: lessonId,
      xp_earned: xpEarned,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    // Update user XP in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .single();
    
    if (profile) {
      await supabase
        .from("profiles")
        .update({ xp: (profile.xp || 0) + xpEarned })
        .eq("id", user.id);
    }

    toast({
      title: "Lesson Complete! 🎉",
      description: `You earned ${xpEarned} XP!`,
    });

    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🦉</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">No exercises available</p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <X className="w-5 h-5" />
            </Button>
            <Progress value={progress} className="flex-1 h-3" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{currentItem.question}</h2>
              
              {currentItem.type === "multiple_choice" && (
                <MultipleChoiceExercise
                  options={currentItem.options || []}
                  selectedAnswer={answer}
                  onSelect={setAnswer}
                  showFeedback={showFeedback}
                  correctAnswer={currentItem.correct_answer}
                />
              )}

              {currentItem.type === "translate" && (
                <TranslateExercise
                  answer={answer}
                  onChange={setAnswer}
                  showFeedback={showFeedback}
                  isCorrect={isCorrect}
                />
              )}

              {currentItem.type === "fill_blank" && (
                <FillBlankExercise
                  options={currentItem.options || []}
                  selectedAnswer={answer}
                  onSelect={setAnswer}
                  showFeedback={showFeedback}
                  correctAnswer={currentItem.correct_answer}
                />
              )}
            </div>

            {showFeedback && (
              <div
                className={`p-6 rounded-lg mb-6 ${
                  isCorrect ? "bg-success/10 border-2 border-success" : "bg-destructive/10 border-2 border-destructive"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {isCorrect ? (
                    <Check className="w-6 h-6 text-success" />
                  ) : (
                    <X className="w-6 h-6 text-destructive" />
                  )}
                  <p className="text-lg font-bold">
                    {isCorrect ? "Correct! 🎉" : "Not quite right"}
                  </p>
                </div>
                {!isCorrect && (
                  <p className="text-muted-foreground">
                    Correct answer: <span className="font-bold">{currentItem.correct_answer}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              {!showFeedback ? (
                <Button onClick={checkAnswer} disabled={!answer} className="w-full" size="lg">
                  Check
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full" size="lg">
                  {currentIndex < items.length - 1 ? "Continue" : "Finish"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LessonPlayer;