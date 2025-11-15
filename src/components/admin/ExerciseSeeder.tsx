import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  seedExercisesForCourse, 
  spanishCourseExercises, 
  frenchCourseExercises, 
  hindiCourseExercises 
} from "@/lib/seedExercises";

interface Course {
  id: string;
  title: string;
  language_to: string;
}

const ExerciseSeeder = () => {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isSeeding, setIsSeeding] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, language_to")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  const getExercisesForCourse = (languageTo: string) => {
    const language = languageTo.toLowerCase();
    if (language.includes("spanish") || language.includes("español")) {
      return spanishCourseExercises;
    } else if (language.includes("french") || language.includes("français")) {
      return frenchCourseExercises;
    } else if (language.includes("hindi") || language.includes("हिंदी")) {
      return hindiCourseExercises;
    }
    return null;
  };

  const handleSeedExercises = async () => {
    if (!selectedCourse) {
      toast({
        title: "Please select a course",
        variant: "destructive",
      });
      return;
    }

    const course = coursesQuery.data?.find((c) => c.id === selectedCourse);
    if (!course) return;

    const exercises = getExercisesForCourse(course.language_to);
    if (!exercises) {
      toast({
        title: "No sample exercises available",
        description: `Sample exercises are only available for Spanish, French, and Hindi courses.`,
        variant: "destructive",
      });
      return;
    }

    setIsSeeding(true);
    try {
      const result = await seedExercisesForCourse(selectedCourse, exercises);
      if (result.success) {
        toast({
          title: "Exercises seeded successfully!",
          description: `Added exercises to ${course.title}`,
        });
      } else {
        toast({
          title: "Error seeding exercises",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const courses = coursesQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Sample Exercises</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add sample exercises to existing courses. Currently supports Spanish, French, and Hindi.
        </p>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Course</label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title} ({course.language_to})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSeedExercises} 
          disabled={!selectedCourse || isSeeding || coursesQuery.isLoading}
          className="w-full"
        >
          {isSeeding ? "Seeding exercises..." : "Seed Exercises"}
        </Button>

        {selectedCourse && (
          <div className="text-xs text-muted-foreground">
            {(() => {
              const course = courses.find((c) => c.id === selectedCourse);
              if (!course) return null;
              const exercises = getExercisesForCourse(course.language_to);
              return exercises 
                ? `Will add ${exercises.reduce((sum, lesson) => sum + lesson.exercises.length, 0)} exercises across ${exercises.length} lessons`
                : "No sample exercises available for this language";
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseSeeder;

