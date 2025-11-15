/**
 * Script to seed exercises to all courses
 * Run this with: npx tsx scripts/seed-all-courses.ts
 * Or use the Admin panel "Auto-Seed All Courses" button
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import exercise data
const spanishExercises = [
  {
    lessonTitle: "Greetings and Introductions",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in Spanish?",
        correct_answer: "Hola",
        options: ["Hola", "Adiós", "Gracias", "Por favor"],
        explanation: "'Hola' is the standard greeting in Spanish.",
      },
      {
        type: "translate",
        question: "Good morning",
        correct_answer: "Buenos días",
        hint: "Starts with 'Buenos'",
      },
      {
        type: "speaking",
        question: "Say: 'Mucho gusto' (Nice to meet you)",
        correct_answer: "Mucho gusto",
      },
      {
        type: "fill_blank",
        question: "Me llamo ___ (My name is)",
        correct_answer: "Juan",
        options: ["Juan", "María", "Pedro", "Ana"],
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
      },
      {
        type: "translate",
        question: "Seven",
        correct_answer: "Siete",
      },
      {
        type: "speaking",
        question: "Count from one to five: uno, dos, tres, cuatro, cinco",
        correct_answer: "uno dos tres cuatro cinco",
      },
    ],
  },
];

const frenchExercises = [
  {
    lessonTitle: "Basic Greetings",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in French?",
        correct_answer: "Bonjour",
        options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
      },
      {
        type: "translate",
        question: "Good evening",
        correct_answer: "Bonsoir",
      },
      {
        type: "speaking",
        question: "Say: 'Comment allez-vous?' (How are you?)",
        correct_answer: "Comment allez-vous",
      },
    ],
  },
];

const hindiExercises = [
  {
    lessonTitle: "Basic Greetings",
    exercises: [
      {
        type: "multiple_choice",
        question: "How do you say 'Hello' in Hindi?",
        correct_answer: "नमस्ते",
        options: ["नमस्ते", "अलविदा", "धन्यवाद", "कृपया"],
      },
      {
        type: "translate",
        question: "Thank you",
        correct_answer: "धन्यवाद",
      },
      {
        type: "speaking",
        question: "Say: 'आप कैसे हैं?' (How are you?)",
        correct_answer: "आप कैसे हैं",
      },
    ],
  },
];

const genericExercises = [
  {
    type: "multiple_choice",
    question: "What is the correct translation?",
    correct_answer: "Hello",
    options: ["Hello", "Goodbye", "Thank you", "Please"],
    explanation: "Basic greeting exercise.",
  },
  {
    type: "translate",
    question: "Translate: Hello",
    correct_answer: "Hello",
    explanation: "Practice your translation skills.",
  },
  {
    type: "fill_blank",
    question: "Complete: ___ is a greeting",
    correct_answer: "Hello",
    options: ["Hello", "Goodbye", "Thanks", "Yes"],
    explanation: "Fill in the blank exercise.",
  },
  {
    type: "speaking",
    question: "Say: 'Hello, how are you?'",
    correct_answer: "Hello how are you",
    explanation: "Practice speaking this phrase.",
  },
];

async function seedAllCourses() {
  console.log('🚀 Starting to seed exercises to all courses...\n');

  // Get all courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, language_to')
    .order('created_at', { ascending: true });

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return;
  }

  if (!courses || courses.length === 0) {
    console.log('No courses found. Please create courses first.');
    return;
  }

  console.log(`Found ${courses.length} course(s)\n`);

  let totalAdded = 0;
  let processed = 0;

  for (const course of courses) {
    console.log(`📚 Processing: ${course.title} (${course.language_to})`);

    // Get lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, order_index')
      .eq('course_id', course.id)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error(`  ❌ Error fetching lessons: ${lessonsError.message}`);
      continue;
    }

    if (!lessons || lessons.length === 0) {
      console.log(`  ⚠️  No lessons found. Skipping...\n`);
      continue;
    }

    // Check if course already has exercises
    const { data: existingItems } = await supabase
      .from('items')
      .select('id')
      .eq('lesson_id', lessons[0].id)
      .limit(1);

    if (existingItems && existingItems.length > 0) {
      console.log(`  ✓ Already has exercises. Skipping...\n`);
      continue;
    }

    // Determine which exercises to use
    const language = course.language_to.toLowerCase();
    let exercisesToUse: any[] = [];

    if (language.includes('spanish') || language.includes('español')) {
      exercisesToUse = spanishExercises;
    } else if (language.includes('french') || language.includes('français')) {
      exercisesToUse = frenchExercises;
    } else if (language.includes('hindi')) {
      exercisesToUse = hindiExercises;
    } else {
      // Use generic exercises for all lessons
      for (const lesson of lessons) {
        const { data: existingItems } = await supabase
          .from('items')
          .select('id')
          .eq('lesson_id', lesson.id);

        const startIndex = (existingItems?.length || 0) + 1;

        for (let i = 0; i < genericExercises.length; i++) {
          const exercise = genericExercises[i];
          const { error } = await supabase.from('items').insert({
            lesson_id: lesson.id,
            type: exercise.type,
            question: exercise.question,
            correct_answer: exercise.correct_answer,
            options: exercise.options ? JSON.stringify(exercise.options) : null,
            explanation: exercise.explanation || null,
            hint: exercise.hint || null,
            order_index: startIndex + i,
          });

          if (error) {
            console.error(`  ❌ Error adding exercise: ${error.message}`);
          } else {
            totalAdded++;
          }
        }
      }
      console.log(`  ✓ Added ${genericExercises.length * lessons.length} generic exercises\n`);
      processed++;
      continue;
    }

    // Add language-specific exercises
    let courseAdded = 0;
    for (const lessonSeed of exercisesToUse) {
      const lesson = lessons.find((l) => l.title === lessonSeed.lessonTitle) || lessons[0];

      if (!lesson) continue;

      const { data: existingItems } = await supabase
        .from('items')
        .select('id')
        .eq('lesson_id', lesson.id);

      const startIndex = (existingItems?.length || 0) + 1;

      for (let i = 0; i < lessonSeed.exercises.length; i++) {
        const exercise = lessonSeed.exercises[i];
        const { error } = await supabase.from('items').insert({
          lesson_id: lesson.id,
          type: exercise.type,
          question: exercise.question,
          correct_answer: exercise.correct_answer,
          options: exercise.options ? JSON.stringify(exercise.options) : null,
          explanation: exercise.explanation || null,
          hint: exercise.hint || null,
          order_index: startIndex + i,
        });

        if (error) {
          console.error(`  ❌ Error adding exercise: ${error.message}`);
        } else {
          totalAdded++;
          courseAdded++;
        }
      }
    }

    console.log(`  ✓ Added ${courseAdded} exercises\n`);
    processed++;
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Processed: ${processed} course(s)`);
  console.log(`   Total exercises added: ${totalAdded}`);
}

// Run the script
seedAllCourses()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

