/**
 * Google Gemini AI Integration (Free tier available)
 * Get your API key from: https://makersuite.google.com/app/apikey
 */

interface GeminiResponse {
  message: string;
  error?: string;
}

/**
 * Call Gemini API (free alternative to ChatGPT)
 */
export const callGemini = async (
  prompt: string,
  systemPrompt?: string
): Promise<GeminiResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      message: '',
      error: 'Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file. Get your free key from https://makersuite.google.com/app/apikey',
    };
  }

  try {
    // Using Gemini 1.5 Flash (free tier, fast and efficient)
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`
      : prompt;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
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
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { message: message.trim() };
  } catch (error) {
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Failed to call Gemini API',
    };
  }
};

/**
 * Get feedback on a spoken language exercise using Gemini
 */
export const getSpeakingFeedbackGemini = async (
  userSpeech: string,
  expectedPhrase: string,
  language: string
): Promise<GeminiResponse> => {
  const systemPrompt = `You are a helpful language learning assistant. Provide constructive feedback on pronunciation, grammar, and accuracy. Be encouraging and specific.`;

  const prompt = `The student is learning ${language}. They were asked to say: "${expectedPhrase}"

They said: "${userSpeech}"

Please provide:
1. Accuracy assessment (correct/needs improvement)
2. Pronunciation feedback
3. Grammar feedback (if applicable)
4. Encouragement

Keep the response concise (2-3 sentences).`;

  return callGemini(prompt, systemPrompt);
};

/**
 * Get feedback on any exercise answer using Gemini
 */
export const getExerciseFeedbackGemini = async (
  userAnswer: string,
  correctAnswer: string,
  question: string,
  exerciseType: string,
  language: string
): Promise<GeminiResponse> => {
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

  return callGemini(prompt, systemPrompt);
};

/**
 * Get translation help using Gemini
 */
export const getTranslationHelpGemini = async (
  phrase: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<GeminiResponse> => {
  const systemPrompt = `You are a helpful language learning assistant. Provide clear translations and explanations.`;

  const prompt = `Translate "${phrase}" from ${sourceLanguage} to ${targetLanguage}. Also provide a brief explanation of any grammar rules or cultural context if relevant.`;

  return callGemini(prompt, systemPrompt);
};

/**
 * Chat with Gemini AI assistant
 */
export const chatWithGemini = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  language?: string,
  topic?: string
): Promise<GeminiResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      message: '',
      error: 'Gemini API key not configured.',
    };
  }

  try {
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemContext = language
      ? `You are a helpful ${language} language tutor. ${topic ? `The user is currently studying: ${topic}. ` : ''}Provide clear, encouraging, and educational responses. Keep responses concise (2-4 sentences) unless the user asks for more detail.`
      : `You are a helpful language learning assistant. Provide clear, encouraging, and educational responses.`;

    // Build conversation context
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const fullPrompt = `${systemContext}\n\n${conversationText}\n\nAssistant:`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
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
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { message: message.trim() };
  } catch (error) {
    return {
      message: '',
      error: error instanceof Error ? error.message : 'Failed to call Gemini API',
    };
  }
};

