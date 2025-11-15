import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X, Check, Lightbulb, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MultipleChoiceExercise from "@/components/exercises/MultipleChoiceExercise";
import TranslateExercise from "@/components/exercises/TranslateExercise";
import FillBlankExercise from "@/components/exercises/FillBlankExercise";
import SpeakingExercise from "@/components/exercises/SpeakingExercise";
import ChatGPTAssistant from "@/components/ChatGPTAssistant";
import { getExerciseFeedback } from "@/lib/chatgpt";

interface Item {
  id: string;
  type: string;
  question: string;
  correct_answer: string;
  options: string[] | null;
  audio_url: string | null;
  explanation: string | null;
  hint?: string | null;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  course: {
    language_to: string;
  };
}

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [chatGPTFeedback, setChatGPTFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const loadLessonAndItems = useCallback(async () => {
    try {
      // Load lesson with course info
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          course:courses(language_to)
        `)
        .eq("id", lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData as any);

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (itemsError) throw itemsError;
      
      const parsedItems = (itemsData || []).map(item => ({
        ...item,
        options: item.options
          ? typeof item.options === "string"
            ? (JSON.parse(item.options) as string[])
            : (item.options as string[])
          : null,
      }));
      
      setItems(parsedItems);
    } catch (error) {
      console.error("Error loading lesson and items:", error);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLessonAndItems();
  }, [loadLessonAndItems]);

  const normalizeAnswerText = (text: string) => {
    return text.toLowerCase().trim().replace(/[-.,/#!$%^&*;:{}=_`~()]/g, "");
  };

  const checkAnswer = async () => {
    const currentItem = items[currentIndex];
    
    // For speaking exercises, the answer is handled by the component
    if (currentItem.type === "speaking") {
      setShowFeedback(true);
      return;
    }

    const normalizedAnswer = normalizeAnswerText(answer);
    const normalizedCorrect = normalizeAnswerText(currentItem.correct_answer);
    const correct = normalizedAnswer === normalizedCorrect;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Get ChatGPT feedback
    if (lesson?.course?.language_to && answer) {
      setIsLoadingFeedback(true);
      try {
        const feedback = await getExerciseFeedback(
          answer,
          currentItem.correct_answer,
          currentItem.question,
          currentItem.type,
          lesson.course.language_to
        );
        if (feedback.message && !feedback.error) {
          setChatGPTFeedback(feedback.message);
        }
      } catch (error) {
        console.error("Error getting feedback:", error);
      } finally {
        setIsLoadingFeedback(false);
      }
    }

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
    } else {
      // Save incorrect attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_attempts").insert({
          user_id: user.id,
          item_id: currentItem.id,
          user_answer: answer,
          correct: false,
          score: 0,
        });
      }
    }
  };

  const handleSpeakingAnswer = async (userAnswer: string, isCorrect: boolean) => {
    const currentItem = items[currentIndex];
    setIsCorrect(isCorrect);
    
    if (isCorrect) {
      const points = 10;
      setXpEarned(prev => prev + points);

      // Save attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_attempts").insert({
          user_id: user.id,
          item_id: currentItem.id,
          user_answer: userAnswer,
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
      setShowHint(false);
      setChatGPTFeedback(null);
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="AI Assistant">
                  <Bot className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <ChatGPTAssistant 
                  language={lesson?.course?.language_to} 
                  topic={lesson?.title}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{currentItem.question}</h2>
                {currentItem.hint && !showHint && !showFeedback && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setShowHint(true)}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hint
                  </Button>
                )}
              </div>

              {showHint && currentItem.hint && (
                <div className="p-4 border rounded-lg bg-muted/30 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">{currentItem.hint}</p>
                </div>
              )}

              {currentItem.type === "multiple_choice" && (
                <MultipleChoiceExercise
                  question={currentItem.question}
                  options={currentItem.options || []}
                  selectedAnswer={answer}
                  onSelect={setAnswer}
                  showFeedback={showFeedback}
                  correctAnswer={currentItem.correct_answer}
                  languageTo={lesson?.course?.language_to}
                />
              )}

              {currentItem.type === "translate" && (
                <TranslateExercise
                  question={currentItem.question}
                  answer={answer}
                  onChange={setAnswer}
                  showFeedback={showFeedback}
                  isCorrect={isCorrect}
                  languageTo={lesson?.course?.language_to}
                />
              )}

              {currentItem.type === "fill_blank" && (
                <FillBlankExercise
                  question={currentItem.question}
                  options={currentItem.options || []}
                  selectedAnswer={answer}
                  onSelect={setAnswer}
                  showFeedback={showFeedback}
                  correctAnswer={currentItem.correct_answer}
                  languageTo={lesson?.course?.language_to}
                />
              )}

              {currentItem.type === "speaking" && (
                <SpeakingExercise
                  question={currentItem.question}
                  correctAnswer={currentItem.correct_answer}
                  languageTo={lesson?.course?.language_to}
                  showFeedback={showFeedback}
                  onAnswer={handleSpeakingAnswer}
                />
              )}
            </div>

            {showFeedback && (
              <div className="space-y-4 mb-6">
                <div
                  className={`p-6 rounded-lg ${
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
                
                {chatGPTFeedback && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">AI Feedback:</p>
                        <p className="text-sm text-muted-foreground">{chatGPTFeedback}</p>
                      </div>
                    </div>
                  </div>
                )}
                {isLoadingFeedback && (
                  <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Getting AI feedback...</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              {!showFeedback && currentItem.type !== "speaking" ? (
                <Button onClick={checkAnswer} disabled={!answer} className="w-full" size="lg">
                  Check
                </Button>
              ) : showFeedback ? (
                <Button onClick={handleNext} className="w-full" size="lg">
                  {currentIndex < items.length - 1 ? "Continue" : "Finish"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LessonPlayer;