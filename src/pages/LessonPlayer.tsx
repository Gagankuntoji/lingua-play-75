import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Check, Lightbulb, Video, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MultipleChoiceExercise from "@/components/exercises/MultipleChoiceExercise";
import TranslateExercise from "@/components/exercises/TranslateExercise";
import FillBlankExercise from "@/components/exercises/FillBlankExercise";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSampleItemsByLesson, sampleLessons } from "@/data/sampleContent";

interface Item {
  id: string;
  type: string;
  question: string;
  correct_answer: string;
  options: string[] | null;
  audio_url: string | null;
  video_url: string | null;
  explanation: string | null;
  hint?: string | null;
  order_index: number;
  language_to?: string | null;
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
  const [showHint, setShowHint] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const loadItems = useCallback(async () => {
    if (!lessonId) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      // Try Supabase items first
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      // If we have data from Supabase and no error, use it
      if (!error && data && data.length > 0) {
        const parsedItems = data.map(item => ({
          ...item,
          options: item.options
            ? typeof item.options === "string"
              ? (JSON.parse(item.options) as string[])
              : (item.options as string[])
            : null,
        }));
        
        setItems(parsedItems);
        setIsFallback(false);
        console.log(`Loaded ${parsedItems.length} exercises from Supabase for lesson ${lessonId}`);
        setLoading(false);
        return;
      }

      // No Supabase items, use sample data
      // First try direct match with lessonId
      let sampleItems = getSampleItemsByLesson(lessonId);
      
      // If no direct match and lessonId looks like a UUID, try to find sample lesson by order
      if (sampleItems.length === 0 && lessonId.includes('-') && lessonId.length > 30) {
        // Try to get lesson info from Supabase to find order_index
        const { data: lessonData } = await supabase
          .from("lessons")
          .select("order_index, course_id")
          .eq("id", lessonId)
          .single();
        
        if (lessonData) {
          // Try to find sample lesson with matching order_index in any course
          for (const courseLessons of Object.values(sampleLessons)) {
            const matchingLesson = courseLessons.find(l => l.order_index === lessonData.order_index);
            if (matchingLesson) {
              sampleItems = getSampleItemsByLesson(matchingLesson.id);
              if (sampleItems.length > 0) {
                console.log(`Matched UUID lesson to sample lesson by order: ${matchingLesson.id}`);
                break;
              }
            }
          }
        }
      }
      
      // If still no items, use first available sample lesson with exercises
      if (sampleItems.length === 0) {
        console.log(`No direct match for lesson ${lessonId}, using first available sample exercises`);
        for (const courseLessons of Object.values(sampleLessons)) {
          for (const lesson of courseLessons) {
            const items = getSampleItemsByLesson(lesson.id);
            if (items.length > 0) {
              sampleItems = items;
              console.log(`Using exercises from sample lesson: ${lesson.id}`);
              break;
            }
          }
          if (sampleItems.length > 0) break;
        }
      }
      
      if (sampleItems.length > 0) {
        setItems(sampleItems);
        setIsFallback(true);
        console.log(`Loaded ${sampleItems.length} sample exercises`);
      } else {
        console.warn(`No exercises found for lesson ${lessonId}`);
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      // Final fallback: try sample data directly
      const sampleItems = getSampleItemsByLesson(lessonId);
      if (sampleItems.length > 0) {
        setItems(sampleItems);
        setIsFallback(true);
      } else {
        // Try all sample lessons
        for (const courseLessons of Object.values(sampleLessons)) {
          for (const lesson of courseLessons) {
            const items = getSampleItemsByLesson(lesson.id);
            if (items.length > 0) {
              setItems(items);
              setIsFallback(true);
              console.log(`Using fallback exercises from: ${lesson.id}`);
              setLoading(false);
              return;
            }
          }
        }
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const normalizeAnswer = (text: string) => {
    return text.toLowerCase().trim().replace(/[-.,/#!$%^&*;:{}=_`~()]/g, "");
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
      setShowHint(false);
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
        {isFallback && (
          <Alert className="mb-6">
            <AlertDescription>
              Using Gemini sample exercises until your Supabase lesson items are available.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{currentItem.question}</h2>
                <div className="flex gap-2">
                  {currentItem.video_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        window.open(currentItem.video_url || '', '_blank');
                      }}
                    >
                      <Video className="w-4 h-4" />
                      Watch Video
                    </Button>
                  )}
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
              </div>

              {currentItem.video_url && (
                <div className="rounded-lg overflow-hidden border-2 bg-muted/30">
                  <div className="aspect-video">
                    {currentItem.video_url.includes('youtube.com') || currentItem.video_url.includes('youtu.be') ? (
                      <iframe
                        src={currentItem.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Lesson Video"
                      />
                    ) : (
                      <video
                        src={currentItem.video_url}
                        controls
                        className="w-full h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>
              )}

              {showHint && currentItem.hint && (
                <div className="p-4 border rounded-lg bg-muted/30 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">{currentItem.hint}</p>
                </div>
              )}

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
                  question={currentItem.question}
                  correctAnswer={currentItem.correct_answer}
                  answer={answer}
                  onChange={setAnswer}
                  showFeedback={showFeedback}
                  isCorrect={isCorrect}
                  languageTo={currentItem.language_to || undefined}
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