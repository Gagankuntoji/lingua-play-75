/**
 * Automatically seed exercises to all courses that don't have exercises yet
 * This script can be run from the admin panel or called programmatically
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  seedExercisesForCourse, 
  spanishCourseExercises, 
  frenchCourseExercises, 
  hindiCourseExercises,
  genericExercises,
  addExercisesToAllLessons
} from "./seedExercises";

interface Course {
  id: string;
  title: string;
  language_to: string;
  language_from: string;
}

/**
 * Get exercises for a course based on language
 */
const getExercisesForLanguage = (languageTo: string) => {
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

/**
 * Check if a course has exercises
 */
const courseHasExercises = async (courseId: string): Promise<boolean> => {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .limit(1);

  if (!lessons || lessons.length === 0) {
    return false;
  }

  const { data: items } = await supabase
    .from("items")
    .select("id")
    .eq("lesson_id", lessons[0].id)
    .limit(1);

  return (items?.length || 0) > 0;
};

/**
 * Automatically seed exercises to all courses
 */
export const autoSeedAllCourses = async (): Promise<{
  success: boolean;
  processed: number;
  added: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let processed = 0;
  let totalAdded = 0;

  try {
    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, language_to, language_from")
      .order("created_at", { ascending: true });

    if (coursesError) throw coursesError;
    if (!courses || courses.length === 0) {
      return { success: true, processed: 0, added: 0, errors: ["No courses found"] };
    }

    // Process each course
    for (const course of courses as Course[]) {
      try {
        // Check if course already has exercises
        const hasExercises = await courseHasExercises(course.id);
        
        if (hasExercises) {
          console.log(`Course "${course.title}" already has exercises, skipping...`);
          continue;
        }

        // Get language-specific exercises
        const exercises = getExercisesForLanguage(course.language_to);

        if (exercises) {
          // Use language-specific exercises
          const result = await seedExercisesForCourse(course.id, exercises);
          if (result.success) {
            processed++;
            totalAdded += result.added || 0;
            console.log(`Added ${result.added || 0} exercises to "${course.title}"`);
          } else {
            errors.push(`${course.title}: ${result.error}`);
          }
        } else {
          // Use generic exercises for unsupported languages
          const result = await addExercisesToAllLessons(course.id, genericExercises);
          if (result.success) {
            processed++;
            totalAdded += result.added || 0;
            console.log(`Added ${result.added || 0} generic exercises to "${course.title}"`);
          } else {
            errors.push(`${course.title}: ${result.error}`);
          }
        }
      } catch (error) {
        errors.push(`${course.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      added: totalAdded,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      processed,
      added: totalAdded,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
};

/**
 * Seed exercises to a specific course
 */
export const seedCourseExercises = async (courseId: string): Promise<{
  success: boolean;
  added?: number;
  error?: string;
}> => {
  try {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, language_to")
      .eq("id", courseId)
      .single();

    if (courseError) throw courseError;
    if (!course) {
      return { success: false, error: "Course not found" };
    }

    const exercises = getExercisesForLanguage(course.language_to);

    if (exercises) {
      return await seedExercisesForCourse(courseId, exercises);
    } else {
      return await addExercisesToAllLessons(courseId, genericExercises);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

