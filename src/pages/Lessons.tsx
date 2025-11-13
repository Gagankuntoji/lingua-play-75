import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, CheckCircle2, Circle } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  order_index: number;
}

interface Course {
  title: string;
  flag_emoji: string;
}

const Lessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      // Load course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("title, flag_emoji")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/courses")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{course?.flag_emoji}</span>
            <h1 className="text-2xl font-bold">{course?.title}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Progress</h2>
          <Progress value={0} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">0 of {lessons.length} lessons completed</p>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const isUnlocked = index === 0; // For now, only first lesson is unlocked
            const isCompleted = false;

            return (
              <Card
                key={lesson.id}
                className={`border-2 transition-all ${
                  isUnlocked
                    ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => isUnlocked && navigate(`/lesson/${lesson.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                          isCompleted
                            ? "bg-success text-white"
                            : isUnlocked
                            ? "bg-gradient-to-br from-primary to-primary/60 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : isUnlocked ? (
                          <Circle className="w-8 h-8" />
                        ) : (
                          <Lock className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Lesson {lesson.order_index}</h3>
                        <p className="text-muted-foreground">{lesson.title}</p>
                      </div>
                    </div>
                    {isUnlocked && (
                      <Button className="rounded-full">
                        {isCompleted ? "Review" : "Start"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">📚</p>
            <p className="text-muted-foreground">No lessons available yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Lessons;