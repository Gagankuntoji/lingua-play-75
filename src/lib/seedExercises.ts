import { supabase } from "@/integrations/supabase/client";

interface ExerciseSeed {
  lessonTitle: string;
  exercises: {
    type: "multiple_choice" | "fill_blank" | "translate" | "speaking";
    question: string;
    correct_answer: string;
    options?: string[];
    explanation?: string;
    hint?: string;
  }[];
}

/**
 * Seed exercises for a course
 * This utility helps populate courses with sample exercises
 */
export const seedExercisesForCourse = async (
  courseId: string,
  exercisesByLesson: ExerciseSeed[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (lessonsError) throw lessonsError;
    if (!lessons || lessons.length === 0) {
      return { success: false, error: "No lessons found for this course" };
    }

    // Match exercises to lessons by title
    for (const lessonSeed of exercisesByLesson) {
      const lesson = lessons.find((l) => l.title === lessonSeed.lessonTitle);
      
      if (!lesson) {
        console.warn(`Lesson "${lessonSeed.lessonTitle}" not found, skipping...`);
        continue;
      }

      // Insert exercises for this lesson
      for (let i = 0; i < lessonSeed.exercises.length; i++) {
        const exercise = lessonSeed.exercises[i];
        
        const { error: insertError } = await supabase.from("items").insert({
          lesson_id: lesson.id,
          type: exercise.type,
          question: exercise.question,
          correct_answer: exercise.correct_answer,
          options: exercise.options ? JSON.stringify(exercise.options) : null,
          explanation: exercise.explanation || null,
          hint: exercise.hint || null,
          order_index: i + 1,
        });

        if (insertError) {
          console.error(`Error inserting exercise for lesson "${lessonSeed.lessonTitle}":`, insertError);
        }
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Sample exercise data for Spanish course
 */
export const spanishCourseExercises: ExerciseSeed[] = [
  {
    lessonTitle: "Greetings and Introductions",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in Spanish?",
        correct_answer: "Hola",
        options: ["Hola", "Adiós", "Gracias", "Por favor"],
        explanation: "'Hola' is the standard greeting in Spanish, used throughout the day.",
      },
      {
        type: "translate",
        question: "Good morning",
        correct_answer: "Buenos días",
        explanation: "'Buenos días' is used from morning until around noon.",
      },
      {
        type: "fill_blank",
        question: "Me llamo ___ (My name is)",
        correct_answer: "Juan",
        options: ["Juan", "María", "Pedro", "Ana"],
        explanation: "'Me llamo' means 'My name is' in Spanish.",
      },
      {
        type: "speaking",
        question: "Say: 'Mucho gusto' (Nice to meet you)",
        correct_answer: "Mucho gusto",
        explanation: "Use this phrase when meeting someone for the first time.",
      },
    ],
  },
  {
    lessonTitle: "Numbers 1-10",
    exercises: [
      {
        type: "multiple_choice",
        question: "What is 'cinco' in English?",
        correct_answer: "Five",
        options: ["Three", "Four", "Five", "Six"],
        explanation: "'Cinco' means five in Spanish.",
      },
      {
        type: "translate",
        question: "Seven",
        correct_answer: "Siete",
        explanation: "Remember: siete = seven",
      },
      {
        type: "speaking",
        question: "Count from one to five: uno, dos, tres, cuatro, cinco",
        correct_answer: "uno dos tres cuatro cinco",
        explanation: "Practice pronouncing these numbers clearly.",
      },
    ],
  },
];

/**
 * Sample exercise data for French course
 */
export const frenchCourseExercises: ExerciseSeed[] = [
  {
    lessonTitle: "Basic Greetings",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in French?",
        correct_answer: "Bonjour",
        options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
        explanation: "'Bonjour' is used during the day until evening.",
      },
      {
        type: "translate",
        question: "Good evening",
        correct_answer: "Bonsoir",
        explanation: "'Bonsoir' is used in the evening.",
      },
      {
        type: "speaking",
        question: "Say: 'Comment allez-vous?' (How are you?)",
        correct_answer: "Comment allez-vous",
        explanation: "This is the formal way to ask 'How are you?'",
      },
    ],
  },
];

/**
 * Sample exercise data for Hindi course
 */
export const hindiCourseExercises: ExerciseSeed[] = [
  {
    lessonTitle: "Basic Greetings",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in Hindi?",
        correct_answer: "नमस्ते",
        options: ["नमस्ते", "अलविदा", "धन्यवाद", "कृपया"],
        explanation: "'नमस्ते' (Namaste) is a common greeting in Hindi.",
      },
      {
        type: "translate",
        question: "Thank you",
        correct_answer: "धन्यवाद",
        explanation: "'धन्यवाद' (Dhanyavaad) means thank you.",
      },
      {
        type: "speaking",
        question: "Say: 'आप कैसे हैं?' (How are you?)",
        correct_answer: "आप कैसे हैं",
        explanation: "Practice the pronunciation of this common question.",
      },
    ],
  },
];

