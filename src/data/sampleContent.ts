export interface SampleCourse {
  id: string;
  title: string;
  description: string;
  language_from: string;
  language_to: string;
  flag_emoji: string;
}

export interface SampleLesson {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  summary: string;
}

export interface SampleLessonItem {
  id: string;
  lesson_id: string;
  type: "multiple_choice" | "translate" | "fill_blank";
  order_index: number;
  question: string;
  correct_answer: string;
  options: string[] | null;
  explanation?: string | null;
  hint?: string | null;
  language_to?: string;
}

export const sampleCourses: SampleCourse[] = [
  {
    id: "spanish-foundations",
    title: "Spanish Foundations",
    description: "Build confident everyday conversations in Latin American Spanish.",
    language_from: "English",
    language_to: "Spanish",
    flag_emoji: "🇪🇸",
  },
  {
    id: "french-travel",
    title: "French for Travel",
    description: "Master essential phrases for cafes, metros, and friendly chats.",
    language_from: "English",
    language_to: "French",
    flag_emoji: "🇫🇷",
  },
  {
    id: "hindi-conversations",
    title: "Hindi Conversations",
    description: "Level up your Hindi listening and speaking for real-life scenarios.",
    language_from: "English",
    language_to: "Hindi",
    flag_emoji: "🇮🇳",
  },
];

export const sampleLessons: Record<string, SampleLesson[]> = {
  "spanish-foundations": [
    {
      id: "spanish-foundations-lesson-1",
      course_id: "spanish-foundations",
      title: "Greetings & Introductions",
      order_index: 1,
      summary: "Learn to introduce yourself and greet others politely.",
    },
    {
      id: "spanish-foundations-lesson-2",
      course_id: "spanish-foundations",
      title: "Ordering Food",
      order_index: 2,
      summary: "Practice friendly requests in cafés and markets.",
    },
    {
      id: "spanish-foundations-lesson-3",
      course_id: "spanish-foundations",
      title: "Getting Around Town",
      order_index: 3,
      summary: "Ask for directions and understand simple answers.",
    },
  ],
  "french-travel": [
    {
      id: "french-travel-lesson-1",
      course_id: "french-travel",
      title: "At the Café",
      order_index: 1,
      summary: "Order confidently and chat with baristas.",
    },
    {
      id: "french-travel-lesson-2",
      course_id: "french-travel",
      title: "Metro Navigation",
      order_index: 2,
      summary: "Buy tickets and ask for stops like a local.",
    },
    {
      id: "french-travel-lesson-3",
      course_id: "french-travel",
      title: "Meeting New Friends",
      order_index: 3,
      summary: "Break the ice and keep conversations flowing.",
    },
  ],
  "hindi-conversations": [
    {
      id: "hindi-conversations-lesson-1",
      course_id: "hindi-conversations",
      title: "Introductions",
      order_index: 1,
      summary: "Introduce yourself and ask names politely.",
    },
    {
      id: "hindi-conversations-lesson-2",
      course_id: "hindi-conversations",
      title: "Shopping Basics",
      order_index: 2,
      summary: "Negotiate prices and ask for sizes.",
    },
    {
      id: "hindi-conversations-lesson-3",
      course_id: "hindi-conversations",
      title: "Travel Plans",
      order_index: 3,
      summary: "Discuss destinations and transport options.",
    },
  ],
};

export const sampleLessonItems: Record<string, SampleLessonItem[]> = {
  "spanish-foundations-lesson-1": [
    {
      id: "spanish-greetings-1",
      lesson_id: "spanish-foundations-lesson-1",
      type: "multiple_choice",
      order_index: 1,
      question: "How do you say “Good morning” in Spanish?",
      correct_answer: "Buenos días",
      options: ["Buenas noches", "Buenos días", "Buenas tardes", "Hasta luego"],
      explanation: "Buenos días literally means “good days” and is used before noon.",
      language_to: "Spanish",
    },
    {
      id: "spanish-greetings-2",
      lesson_id: "spanish-foundations-lesson-1",
      type: "translate",
      order_index: 2,
      question: "Translate: My name is Ana.",
      correct_answer: "Me llamo Ana.",
      options: null,
      hint: "Use the reflexive verb 'llamarse'.",
      language_to: "Spanish",
    },
    {
      id: "spanish-greetings-3",
      lesson_id: "spanish-foundations-lesson-1",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Mucho ___.",
      correct_answer: "gusto",
      options: ["gracias", "gusto", "favor", "calor"],
      explanation: "Mucho gusto literally means “much pleasure” and is the standard reply after introductions.",
      language_to: "Spanish",
    },
  ],
  "spanish-foundations-lesson-2": [
    {
      id: "spanish-food-1",
      lesson_id: "spanish-foundations-lesson-2",
      type: "translate",
      order_index: 1,
      question: "Translate: I would like a coffee, please.",
      correct_answer: "Me gustaría un café, por favor.",
      options: null,
      hint: "Use the conditional form of “gustar”.",
      language_to: "Spanish",
    },
    {
      id: "spanish-food-2",
      lesson_id: "spanish-foundations-lesson-2",
      type: "multiple_choice",
      order_index: 2,
      question: "Choose the polite way to call a waiter.",
      correct_answer: "Disculpe",
      options: ["Oye", "Eh tú", "Disculpe", "Ven aquí"],
      explanation: "Disculpe is polite and works in any Latin American restaurant.",
      language_to: "Spanish",
    },
    {
      id: "spanish-food-3",
      lesson_id: "spanish-foundations-lesson-2",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: La cuenta, ___.",
      correct_answer: "por favor",
      options: ["gracias", "por favor", "de nada", "mañana"],
      language_to: "Spanish",
    },
  ],
  "spanish-foundations-lesson-3": [
    {
      id: "spanish-directions-1",
      lesson_id: "spanish-foundations-lesson-3",
      type: "translate",
      order_index: 1,
      question: "Translate: Where is the bus station?",
      correct_answer: "¿Dónde está la estación de autobuses?",
      options: null,
      language_to: "Spanish",
    },
    {
      id: "spanish-directions-2",
      lesson_id: "spanish-foundations-lesson-3",
      type: "multiple_choice",
      order_index: 2,
      question: "Choose the best way to say “turn left”.",
      correct_answer: "Gira a la izquierda",
      options: ["Sigue derecho", "Gira a la izquierda", "Cruza la calle", "Sube las escaleras"],
      language_to: "Spanish",
    },
    {
      id: "spanish-directions-3",
      lesson_id: "spanish-foundations-lesson-3",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Está ___ del parque.",
      correct_answer: "cerca",
      options: ["dentro", "cerca", "atrás", "siempre"],
      language_to: "Spanish",
    },
  ],
  "french-travel-lesson-1": [
    {
      id: "french-cafe-1",
      lesson_id: "french-travel-lesson-1",
      type: "multiple_choice",
      order_index: 1,
      question: "How do you ask for the menu in French?",
      correct_answer: "La carte, s'il vous plaît.",
      options: [
        "L'addition, s'il vous plaît.",
        "La carte, s'il vous plaît.",
        "Je suis prêt.",
        "C'est combien?",
      ],
      language_to: "French",
    },
    {
      id: "french-cafe-2",
      lesson_id: "french-travel-lesson-1",
      type: "translate",
      order_index: 2,
      question: "Translate: I will take a croissant.",
      correct_answer: "Je vais prendre un croissant.",
      options: null,
      language_to: "French",
    },
    {
      id: "french-cafe-3",
      lesson_id: "french-travel-lesson-1",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: C'était ___ !",
      correct_answer: "délicieux",
      options: ["délicieux", "fatigué", "minute", "presque"],
      language_to: "French",
    },
  ],
  "french-travel-lesson-2": [
    {
      id: "french-metro-1",
      lesson_id: "french-travel-lesson-2",
      type: "translate",
      order_index: 1,
      question: "Translate: Where can I buy tickets?",
      correct_answer: "Où puis-je acheter des billets ?",
      options: null,
      language_to: "French",
    },
    {
      id: "french-metro-2",
      lesson_id: "french-travel-lesson-2",
      type: "multiple_choice",
      order_index: 2,
      question: "Choose the correct translation for “next stop”.",
      correct_answer: "prochaine station",
      options: ["prochaine station", "gare centrale", "la sortie", "un plan"],
      language_to: "French",
    },
    {
      id: "french-metro-3",
      lesson_id: "french-travel-lesson-2",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Descendez à la ___ station.",
      correct_answer: "prochaine",
      options: ["prochaine", "lentement", "bonjour", "jeune"],
      language_to: "French",
    },
  ],
  "french-travel-lesson-3": [
    {
      id: "french-friends-1",
      lesson_id: "french-travel-lesson-3",
      type: "translate",
      order_index: 1,
      question: "Translate: It’s nice to meet you.",
      correct_answer: "Enchanté de faire votre connaissance.",
      options: null,
      language_to: "French",
    },
    {
      id: "french-friends-2",
      lesson_id: "french-travel-lesson-3",
      type: "multiple_choice",
      order_index: 2,
      question: "Pick the friendly question: “Where are you from?”",
      correct_answer: "Tu viens d'où ?",
      options: ["Tu viens d'où ?", "Tu coûtes combien ?", "Tu dors ici ?", "Tu es métro ?"],
      language_to: "French",
    },
    {
      id: "french-friends-3",
      lesson_id: "french-travel-lesson-3",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: On se voit ___ ?",
      correct_answer: "demain",
      options: ["demain", "jamais", "froid", "lentement"],
      language_to: "French",
    },
  ],
  "hindi-conversations-lesson-1": [
    {
      id: "hindi-intro-1",
      lesson_id: "hindi-conversations-lesson-1",
      type: "translate",
      order_index: 1,
      question: "Translate: What is your name?",
      correct_answer: "Aapka naam kya hai?",
      options: null,
      language_to: "Hindi",
    },
    {
      id: "hindi-intro-2",
      lesson_id: "hindi-conversations-lesson-1",
      type: "multiple_choice",
      order_index: 2,
      question: "Choose the polite response to thank someone.",
      correct_answer: "Dhanyavaad",
      options: ["Namaste", "Dhanyavaad", "Theek hai", "Aapka"],
      language_to: "Hindi",
    },
    {
      id: "hindi-intro-3",
      lesson_id: "hindi-conversations-lesson-1",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Main ___ se hoon.",
      correct_answer: "India",
      options: ["India", "Aap", "Khana", "Bhai"],
      language_to: "Hindi",
    },
  ],
  "hindi-conversations-lesson-2": [
    {
      id: "hindi-shopping-1",
      lesson_id: "hindi-conversations-lesson-2",
      type: "translate",
      order_index: 1,
      question: "Translate: How much is this?",
      correct_answer: "Yeh kitne ka hai?",
      options: null,
      language_to: "Hindi",
    },
    {
      id: "hindi-shopping-2",
      lesson_id: "hindi-conversations-lesson-2",
      type: "multiple_choice",
      order_index: 2,
      question: "Pick the best phrase for “little bit cheaper”.",
      correct_answer: "Thoda sasta karo",
      options: ["Bahut tez", "Thoda sasta karo", "Mujhe der hai", "Tum theek ho"],
      language_to: "Hindi",
    },
    {
      id: "hindi-shopping-3",
      lesson_id: "hindi-conversations-lesson-2",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Mujhe ___ pasand hai.",
      correct_answer: "yeh",
      options: ["vahaan", "kabhi", "yeh", "parson"],
      language_to: "Hindi",
    },
  ],
  "hindi-conversations-lesson-3": [
    {
      id: "hindi-travel-1",
      lesson_id: "hindi-conversations-lesson-3",
      type: "translate",
      order_index: 1,
      question: "Translate: I need a taxi to the airport.",
      correct_answer: "Mujhe airport tak taxi chahiye.",
      options: null,
      language_to: "Hindi",
    },
    {
      id: "hindi-travel-2",
      lesson_id: "hindi-conversations-lesson-3",
      type: "multiple_choice",
      order_index: 2,
      question: "Select the phrase for “When does the train leave?”",
      correct_answer: "Train kab nikalti hai?",
      options: [
        "Train kab nikalti hai?",
        "Train kaha hai?",
        "Train kitni mehengi hai?",
        "Train tumhari hai?",
      ],
      language_to: "Hindi",
    },
    {
      id: "hindi-travel-3",
      lesson_id: "hindi-conversations-lesson-3",
      type: "fill_blank",
      order_index: 3,
      question: "Fill in the blank: Mujhe ___ jaana hai.",
      correct_answer: "station",
      options: ["jaldi", "station", "aaj", "paani"],
      language_to: "Hindi",
    },
  ],
};

export const getSampleCourseById = (courseId?: string | null) =>
  sampleCourses.find((course) => course.id === courseId);

export const getSampleLessonsByCourse = (courseId?: string | null) =>
  (courseId && sampleLessons[courseId]) || [];

export const getSampleItemsByLesson = (lessonId?: string | null) =>
  (lessonId && sampleLessonItems[lessonId]) || [];

