import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, BookOpen, Play } from "lucide-react";
import { sampleCourses, SampleCourse } from "@/data/sampleContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Course = SampleCourse;

const Courses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    language_from: "English",
    language_to: "",
    flag_emoji: "🌍",
  });
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Supabase error, using sample data:", error);
        throw error;
      }

      // Use sample data if Supabase returns empty or no data
      if (!data || data.length === 0) {
        console.log("No courses in Supabase, using sample data");
        setCourses(sampleCourses);
        setIsFallback(true);
        loadExerciseCounts(sampleCourses.map(c => c.id));
      } else {
        setCourses(data);
        setIsFallback(false);
        loadExerciseCounts(data.map(c => c.id));
      }
    } catch (error) {
      console.log("Using sample courses due to error:", error);
      setCourses(sampleCourses);
      setIsFallback(true);
      loadExerciseCounts(sampleCourses.map(c => c.id));
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseCounts = async (courseIds: string[]) => {
    try {
      const counts: Record<string, number> = {};
      for (const courseId of courseIds) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .eq("course_id", courseId);
        
        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          const { data: items } = await supabase
            .from("items")
            .select("id", { count: "exact", head: true })
            .in("lesson_id", lessonIds);
          counts[courseId] = items?.length || 0;
        } else {
          // Check sample data
          const { getSampleLessonsByCourse } = await import("@/data/sampleContent");
          const sampleLessons = getSampleLessonsByCourse(courseId);
          if (sampleLessons.length > 0) {
            const { getSampleItemsByLesson } = await import("@/data/sampleContent");
            let totalExercises = 0;
            for (const lesson of sampleLessons) {
              const items = getSampleItemsByLesson(lesson.id);
              totalExercises += items.length;
            }
            counts[courseId] = totalExercises;
          } else {
            counts[courseId] = 0;
          }
        }
      }
      setExerciseCounts(counts);
    } catch (error) {
      console.error("Error loading exercise counts:", error);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.language_to) {
      toast({
        title: "Missing information",
        description: "Please fill in title and target language.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: courseForm.title,
          description: courseForm.description,
          language_from: courseForm.language_from,
          language_to: courseForm.language_to,
          flag_emoji: courseForm.flag_emoji,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Course created!",
        description: "You can now add lessons to this course.",
      });

      setCourseForm({
        title: "",
        description: "",
        language_from: "English",
        language_to: "",
        flag_emoji: "🌍",
      });
      setShowCreateDialog(false);
      await loadCourses();
    } catch (error) {
      toast({
        title: "Error creating course",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Choose Your Course</h1>
              <p className="text-sm text-muted-foreground">Browse courses or create your own</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Your Own Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g., Business Spanish"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language_from">From Language</Label>
                    <Input
                      id="language_from"
                      value={courseForm.language_from}
                      onChange={(e) => setCourseForm({ ...courseForm, language_from: e.target.value })}
                      placeholder="English"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language_to">To Language *</Label>
                    <Input
                      id="language_to"
                      value={courseForm.language_to}
                      onChange={(e) => setCourseForm({ ...courseForm, language_to: e.target.value })}
                      placeholder="Spanish"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flag_emoji">Flag Emoji</Label>
                  <Input
                    id="flag_emoji"
                    value={courseForm.flag_emoji}
                    onChange={(e) => setCourseForm({ ...courseForm, flag_emoji: e.target.value })}
                    placeholder="🇪🇸"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Describe what learners will learn in this course..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={creating}>
                  {creating ? "Creating..." : "Create Course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isFallback && (
          <Alert className="mb-6">
            <AlertDescription>
              Showing sample courses powered by Gemini AI until your Supabase data is ready.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="border-2 hover:shadow-xl transition-all hover:scale-105 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/courses/${course.id}/lessons`)}
            >
              <CardHeader className="bg-gradient-to-br from-primary/10 to-accent/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-5xl">{course.flag_emoji}</span>
                  <div>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription className="text-base">
                      {course.language_from} → {course.language_to}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{exerciseCounts[course.id] || 0} exercises</span>
                  </div>
                  <Badge variant="secondary">{course.language_to}</Badge>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate(`/courses/${course.id}/lessons`)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          ))}

          {courses.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-2xl mb-2">🌍</p>
              <p className="text-muted-foreground">No courses available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new courses!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;