import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  language_from: string;
  language_to: string;
  flag_emoji: string;
}

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
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
          <h1 className="text-2xl font-bold">Choose Your Course</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                <Button className="w-full" size="lg">
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