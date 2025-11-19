import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  getSampleItemsByLesson,
  sampleLessons,
  getSampleLessonById,
  getSampleLessonByOrderIndex,
} from "@/data/sampleContent";

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

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  sourceItemId: string;
}

const QUIZ_SIZE = 3;
const QUIZ_REWARD_XP = 5;
const FALLBACK_DISTRACTORS = ["I'm not sure", "Maybe later", "Let me review"];

const shuffle = <T,>(list: T[]): T[] => {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const buildQuiz = (pool: Item[], size = QUIZ_SIZE): QuizQuestion[] => {
  if (!pool.length) return [];
  const selectedItems = shuffle(pool).slice(0, Math.min(size, pool.length));
  const allAnswers = pool.map((item) => item.correct_answer);

  return selectedItems.map((item, index) => {
    const distractors = shuffle(
      allAnswers.filter((answer) => answer !== item.correct_answer),
    ).slice(0, 3);

    while (distractors.length < 3) {
      const filler = FALLBACK_DISTRACTORS[distractors.length] || `Option ${index + 1}`;
      if (!distractors.includes(filler)) {
        distractors.push(filler);
      } else {
        distractors.push(`${filler} (${distractors.length})`);
      }
    }

    const options = shuffle([item.correct_answer, ...distractors]);
    return {
      id: `quiz-${item.id}`,
      prompt: `Lightning quiz: ${item.question}`,
      options,
      correctAnswer: item.correct_answer,
      sourceItemId: item.id,
    };
  });
};

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
  const [lessonVideoUrl, setLessonVideoUrl] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelection, setQuizSelection] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizXp, setQuizXp] = useState(0);
  const [quizSummary, setQuizSummary] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [correctCount, setCorrectCount] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [lessonAccuracy, setLessonAccuracy] = useState(0);
  const [avgDurationMs, setAvgDurationMs] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const attemptStartRef = useRef(Date.now());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    attemptStartRef.current = Date.now();
  }, [currentIndex, quizMode]);

  const loadItems = useCallback(async () => {
    if (!lessonId) {
      setItems([]);
      setLessonVideoUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setXpEarned(0);
    setQuizXp(0);
    setCorrectCount(0);
    setTotalDuration(0);
    setLessonAccuracy(0);
    setAvgDurationMs(0);
    setQuizMode(false);
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizSelection(null);
    setQuizFeedback(null);
    setQuizCorrect(0);
    setQuizXp(0);
    setQuizSummary(null);

    try {
      let lessonMeta: { order_index?: number | null; video_url?: string | null } | null = null;
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("order_index, video_url")
        .eq("id", lessonId)
        .single();

      if (lessonData) {
        lessonMeta = lessonData;
        setLessonVideoUrl(lessonData.video_url || null);
      } else {
        setLessonVideoUrl(null);
      }

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (!error && data && data.length > 0) {
        const parsedItems = data.map((item) => ({
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
        return;
      }

      let sampleLesson =
        getSampleLessonById(lessonId) ||
        getSampleLessonByOrderIndex(lessonMeta?.order_index || undefined);

      if (!sampleLesson) {
        for (const courseLessons of Object.values(sampleLessons)) {
          const candidate = courseLessons.find((lesson) => {
            const exercises = getSampleItemsByLesson(lesson.id);
            return exercises.length > 0;
          });
          if (candidate) {
            sampleLesson = candidate;
            break;
          }
        }
      }

      if (sampleLesson) {
        const sampleItems = getSampleItemsByLesson(sampleLesson.id);
        setItems(sampleItems);
        setLessonVideoUrl(sampleLesson.video_url || lessonMeta?.video_url || null);
        setIsFallback(true);
        console.log(`Loaded ${sampleItems.length} sample exercises for lesson ${sampleLesson.id}`);
      } else {
        console.warn(`No exercises found for lesson ${lessonId}`);
        setItems([]);
        setLessonVideoUrl(null);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      const sampleItems = getSampleItemsByLesson(lessonId);
      if (sampleItems.length > 0) {
        setItems(sampleItems);
        setLessonVideoUrl(getSampleLessonById(lessonId)?.video_url || null);
        setIsFallback(true);
      } else {
        setItems([]);
        setLessonVideoUrl(null);
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

    const durationMs = Date.now() - attemptStartRef.current;
    setTotalDuration((prev) => prev + durationMs);

    if (userId) {
      try {
        await supabase.from("exercise_attempts").insert({
          user_id: userId,
          item_id: currentItem.id,
          user_answer: answer,
          correct,
          score: correct ? 10 : 0,
          duration_ms: durationMs,
          hint_used: showHint,
          attempt_number: 1,
        });
      } catch (error) {
        console.error("Failed to log attempt", error);
      }
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      const points = 10;
      setXpEarned((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const startQuiz = () => {
    const accuracy = items.length ? correctCount / items.length : 0;
    const averageDuration = items.length ? totalDuration / items.length : 0;
    setLessonAccuracy(accuracy);
    setAvgDurationMs(Math.round(averageDuration));
    const questions = buildQuiz(items);
    if (!questions.length) {
      completeLesson();
      return;
    }
    setQuizQuestions(questions);
    setQuizMode(true);
    setQuizIndex(0);
    setQuizSelection(null);
    setQuizFeedback(null);
    setQuizCorrect(0);
    setQuizSummary(null);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setAnswer("");
      setShowFeedback(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      startQuiz();
    }
  };

  const handleQuizChoice = (option: string) => {
    if (quizFeedback || !quizMode) return;
    setQuizSelection(option);
    const currentQuiz = quizQuestions[quizIndex];
    if (option === currentQuiz.correctAnswer) {
      setQuizFeedback("correct");
      setQuizCorrect((prev) => prev + 1);
      setQuizXp((prev) => prev + QUIZ_REWARD_XP);
    } else {
      setQuizFeedback("incorrect");
    }
  };

  const handleQuizAdvance = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelection(null);
      setQuizFeedback(null);
    } else {
      setQuizSummary({
        correct: quizCorrect,
        total: quizQuestions.length,
      });
    }
  };

  const completeLesson = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const totalXp = xpEarned + quizXp;
    let toastDescription = `You earned ${totalXp} XP!`;

    try {
      const { data, error } = await supabase.rpc("award_lesson_completion", {
        p_user_id: user.id,
        p_lesson_id: lessonId,
        p_base_xp: totalXp,
        p_accuracy: lessonAccuracy,
        p_avg_duration: avgDurationMs,
      });

      if (error) {
        throw error;
      }

      const result = Array.isArray(data) ? data[0] : null;
      if (result) {
        toastDescription = `You earned ${result.xp_awarded} XP (+${result.accuracy_bonus} accuracy, +${result.speed_bonus} speed). Streak: ${result.streak} 🔥`;
      }
    } catch (error) {
      console.error("Adaptive reward RPC failed, falling back:", error);
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        lesson_id: lessonId,
        xp_earned: totalXp,
        completed: true,
        completed_at: new Date().toISOString(),
        accuracy: lessonAccuracy,
        avg_duration_ms: Math.round(avgDurationMs),
      });
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", user.id)
        .single();
      if (profile) {
        const updatedXp = (profile.xp ?? 0) + totalXp;
        await supabase
          .from("profiles")
          .update({ xp: updatedXp, last_active: new Date().toISOString() })
          .eq("id", user.id);
      }
    }

    toast({
      title: "Lesson Complete! 🎉",
      description: toastDescription,
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

  const currentItem = quizMode ? null : items[currentIndex];
  const practiceProgress = ((currentIndex + 1) / items.length) * 100;
  const quizProgress = quizMode
    ? quizSummary
      ? 100
      : ((quizIndex + (quizFeedback ? 1 : 0)) / quizQuestions.length) * 100
    : 0;
  const activeProgress = quizMode ? quizProgress : practiceProgress;
  const videoSource = currentItem?.video_url || lessonVideoUrl;

  if (!quizMode && !currentItem) {
    return null;
  }

  const renderQuizCard = () => {
    if (!quizMode) return null;

    if (quizSummary) {
      return (
        <Card className="border-2 shadow-lg">
          <CardContent className="p-8 space-y-6 text-center">
            <h2 className="text-3xl font-bold">Lightning Quiz Complete ⚡</h2>
            <p className="text-muted-foreground">
              You answered {quizSummary.correct} of {quizSummary.total} correctly and earned{" "}
              <strong>{quizXp} XP</strong> bonus.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={completeLesson}>
                Claim XP & finish lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuizMode(false);
                  setQuizSummary(null);
                  startQuiz();
                }}
              >
                Retry quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const quizQuestion = quizQuestions[quizIndex];

    return (
      <Card className="border-2 shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
              Quick review ({quizIndex + 1} / {quizQuestions.length})
            </p>
            <h2 className="text-2xl font-bold">{quizQuestion.prompt}</h2>
          </div>

          <div className="space-y-3">
            {quizQuestion.options.map((option) => {
              const isSelected = option === quizSelection;
              const isCorrectChoice = quizFeedback && option === quizQuestion.correctAnswer;
              const buttonVariant = (() => {
                if (!quizFeedback) return isSelected ? "default" : "outline";
                if (isCorrectChoice) return "default";
                if (isSelected && !isCorrectChoice) return "destructive";
                return "outline";
              })();

              return (
                <Button
                  key={option}
                  variant={buttonVariant}
                  className="w-full justify-start text-left h-auto py-4 px-6 text-lg"
                  onClick={() => handleQuizChoice(option)}
                  disabled={Boolean(quizFeedback)}
                >
                  {option}
                </Button>
              );
            })}
          </div>

          {quizFeedback && (
            <div
              className={`p-4 rounded-lg border ${
                quizFeedback === "correct" ? "border-success bg-success/10" : "border-destructive bg-destructive/10"
              }`}
            >
              {quizFeedback === "correct" ? "Nice! 👏 Keep going." : "Not quite—review the prompt and try the next one."}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleQuizAdvance}
              disabled={!quizFeedback}
              size="lg"
            >
              {quizIndex < quizQuestions.length - 1 ? "Next question" : "See results"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <X className="w-5 h-5" />
            </Button>
            <Progress value={activeProgress} className="flex-1 h-3" />
          </div>
          <p className="text-sm text-muted-foreground">
            {quizMode
              ? quizSummary
                ? "Quiz summary"
                : `Lightning quiz ${quizIndex + 1} / ${quizQuestions.length}`
              : `Exercise ${currentIndex + 1} of ${items.length}`}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {!quizMode && isFallback && (
          <Alert>
            <AlertDescription>
              Using Gemini sample exercises until your Supabase lesson items are available.
            </AlertDescription>
          </Alert>
        )}

        {quizMode ? (
          renderQuizCard()
        ) : (
          <Card className="border-2 shadow-lg">
            <CardContent className="p-8">
            <div className="mb-8 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{currentItem.question}</h2>
                <div className="flex gap-2">
                  {videoSource && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        window.open(videoSource || "", "_blank");
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

              {videoSource && (
                <div className="rounded-lg overflow-hidden border-2 bg-muted/30">
                  <div className="aspect-video">
                    {videoSource.includes("youtube.com") || videoSource.includes("youtu.be") ? (
                      <iframe
                        src={videoSource
                          .replace("watch?v=", "embed/")
                          .replace("youtu.be/", "youtube.com/embed/")}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Lesson Video"
                      />
                    ) : (
                      <video
                        src={videoSource}
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
        )}
      </main>
    </div>
  );
};

export default LessonPlayer;