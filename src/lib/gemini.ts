/**
 * Google Gemini AI Integration (Free tier available)
 * Get your API key from: https://makersuite.google.com/app/apikey
 */

interface GeminiResponse {
  message: string;
  error?: string;
}

const getGeminiApiKey = (): string | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("gemini_api_key");
    if (stored) return stored;
  }
  return import.meta.env.VITE_GEMINI_API_KEY || null;
};

const TEXT_MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];

const buildPromptPayload = (text: string, maxOutputTokens = 500) => ({
  contents: [
    {
      parts: [
        {
          text,
        },
      ],
    },
  ],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens,
  },
});

const postToGemini = async (
  apiKey: string,
  payload: Record<string, unknown>,
  models = TEXT_MODELS,
): Promise<{ data?: any; error?: string }> => {
  let lastError = "Unable to reach Gemini API.";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { data };
      }

      const errorData = await response.json().catch(() => ({}));
      lastError = errorData.error?.message || `API error (${model}): ${response.status}`;
      if (response.status === 404) {
        // try the next fallback model
        continue;
      }
      return { error: lastError };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Failed to call Gemini API";
    }
  }

  return { error: lastError };
};

const callGeminiWithPrompt = async (prompt: string, maxTokens = 500): Promise<GeminiResponse> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      message: "",
      error:
        "Gemini API key not configured. Please set it in your Profile settings or VITE_GEMINI_API_KEY in your .env file. Get your free key from https://makersuite.google.com/app/apikey",
    };
  }

  const payload = buildPromptPayload(prompt, maxTokens);
  const { data, error } = await postToGemini(apiKey, payload);
  if (error) {
    return { message: "", error };
  }
  const message = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { message: message.trim() };
};

export const callGemini = async (
  prompt: string,
  systemPrompt?: string,
): Promise<GeminiResponse> => {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  return callGeminiWithPrompt(fullPrompt);
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
 * Get feedback on text-to-speech pronunciation using Gemini
 */
export const getTTSFeedback = async (
  text: string,
  language: string,
  userRecordingUrl?: string,
): Promise<GeminiResponse> => {
  const systemPrompt = `You are a helpful ${language} pronunciation tutor. Provide detailed feedback on pronunciation, intonation, and clarity.`;

  const prompt = userRecordingUrl
    ? `The student is learning ${language}. They need to pronounce: "${text}"

They have recorded their attempt. Please provide:
1. Pronunciation accuracy assessment
2. Specific sounds or words that need improvement
3. Tips for better pronunciation
4. Encouragement

Keep it concise (3-4 sentences).`
    : `The student is learning ${language}. They need to pronounce: "${text}"

Please provide:
1. Pronunciation guide (how to say it correctly)
2. Common mistakes to avoid
3. Tips for practice
4. Breakdown of difficult sounds

Keep it concise (3-4 sentences).`;

  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  return callGeminiWithPrompt(fullPrompt, 300);
};

interface GrammarCorrectionParams {
  answer: string;
  correctAnswer: string;
  question: string;
  languageTo?: string;
}

export const getGrammarCorrection = async ({
  answer,
  correctAnswer,
  question,
  languageTo,
}: GrammarCorrectionParams): Promise<GeminiResponse> => {
  const target = languageTo || 'the target language';
  const systemPrompt = `You are an encouraging ${target} grammar tutor. Highlight specific grammar wins and mistakes, correct the sentence, and give one actionable tip. Use simple Markdown bullets.`;

  const prompt = `Question: ${question}
Target answer: ${correctAnswer}
Student answer: ${answer}

1. Briefly state if the grammar is correct.
2. Provide the corrected sentence.
3. Explain the most important grammar adjustment in one sentence.
4. Encourage the learner.`;

  return callGemini(prompt, systemPrompt);
};

/**
 * Chat with Gemini AI assistant
 */
export const chatWithGemini = async (
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  language?: string,
  topic?: string,
): Promise<GeminiResponse> => {
  const systemContext = language
    ? `You are a helpful ${language} language tutor. ${
        topic ? `The user is currently studying: ${topic}. ` : ""
      }Provide clear, encouraging, and educational responses. Keep responses concise (2-4 sentences) unless the user asks for more detail.`
    : `You are a helpful language learning assistant. Provide clear, encouraging, and educational responses.`;

  const conversationText = messages
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  const fullPrompt = `${systemContext}\n\n${conversationText}\n\nAssistant:`;
  return callGeminiWithPrompt(fullPrompt);
};

