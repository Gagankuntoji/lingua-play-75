interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGPTResponse {
  message: string;
  error?: string;
}

/**
 * Call ChatGPT API to get feedback on language learning exercises
 */
export const callChatGPT = async (
  prompt: string,
  systemPrompt?: string
): Promise<ChatGPTResponse> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      message: '',
      error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.',
    };
  }

  const messages: ChatGPTMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the more affordable model
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        message: '',
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    return { message };
  } catch (error) {
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Failed to call ChatGPT API',
    };
  }
};

/**
 * Get feedback on a spoken language exercise
 */
export const getSpeakingFeedback = async (
  userSpeech: string,
  expectedPhrase: string,
  language: string
): Promise<ChatGPTResponse> => {
  const systemPrompt = `You are a helpful language learning assistant. Provide constructive feedback on pronunciation, grammar, and accuracy. Be encouraging and specific.`;

  const prompt = `The student is learning ${language}. They were asked to say: "${expectedPhrase}"

They said: "${userSpeech}"

Please provide:
1. Accuracy assessment (correct/needs improvement)
2. Pronunciation feedback
3. Grammar feedback (if applicable)
4. Encouragement

Keep the response concise (2-3 sentences).`;

  return callChatGPT(prompt, systemPrompt);
};

/**
 * Get translation help or explanation
 */
export const getTranslationHelp = async (
  phrase: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<ChatGPTResponse> => {
  const systemPrompt = `You are a helpful language learning assistant. Provide clear translations and explanations.`;

  const prompt = `Translate "${phrase}" from ${sourceLanguage} to ${targetLanguage}. Also provide a brief explanation of any grammar rules or cultural context if relevant.`;

  return callChatGPT(prompt, systemPrompt);
};

/**
 * Get feedback on any exercise answer
 */
export const getExerciseFeedback = async (
  userAnswer: string,
  correctAnswer: string,
  question: string,
  exerciseType: string,
  language: string
): Promise<ChatGPTResponse> => {
  const systemPrompt = `You are a helpful ${language} language tutor. Provide constructive feedback on student answers. Be encouraging and educational.`;

  const prompt = `The student is learning ${language}. 

Exercise type: ${exerciseType}
Question: "${question}"
Correct answer: "${correctAnswer}"
Student's answer: "${userAnswer}"

Provide:
1. Accuracy assessment
2. What they did well
3. What needs improvement
4. A brief explanation or tip

Keep it concise (2-3 sentences).`;

  return callChatGPT(prompt, systemPrompt);
};

/**
 * Generate practice exercises
 */
export const generatePracticeExercise = async (
  topic: string,
  language: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<ChatGPTResponse> => {
  const systemPrompt = `You are a helpful language learning assistant. Generate practice exercises.`;

  const prompt = `Generate a ${difficulty} level ${language} practice exercise about "${topic}". 
  
Provide:
1. A question or prompt
2. The correct answer
3. 2-3 incorrect options (for multiple choice)
4. A brief explanation

Format as JSON with keys: question, correct_answer, options (array), explanation.`;

  return callChatGPT(prompt, systemPrompt);
};

