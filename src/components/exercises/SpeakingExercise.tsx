import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Loader2, Check, X } from "lucide-react";
import { useSpeechRecognition, getSpeechRecognitionLanguageCode } from "@/hooks/useSpeechRecognition";
import { getSpeakingFeedback } from "@/lib/chatgpt";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SpeakingExerciseProps {
  question: string;
  correctAnswer: string;
  languageTo?: string;
  showFeedback: boolean;
  onAnswer: (answer: string, isCorrect: boolean) => void;
}

const SpeakingExercise = ({
  question,
  correctAnswer,
  languageTo,
  showFeedback,
  onAnswer,
}: SpeakingExerciseProps) => {
  const [userSpeech, setUserSpeech] = useState("");
  const [chatGPTFeedback, setChatGPTFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const { isSupported, isListening, transcript, interimTranscript, error, startListening, stopListening, reset } =
    useSpeechRecognition({
      lang: languageTo ? getSpeechRecognitionLanguageCode(languageTo) : 'en-US',
      continuous: true,
      interimResults: true,
    });

  useEffect(() => {
    if (transcript) {
      setUserSpeech(transcript);
    }
  }, [transcript]);

  const normalizeText = (text: string) => {
    return text.toLowerCase().trim().replace(/[-.,/#!$%^&*;:{}=_`~()]/g, "");
  };

  const checkAnswer = async () => {
    if (!userSpeech) return;

    const normalizedUser = normalizeText(userSpeech);
    const normalizedCorrect = normalizeText(correctAnswer);
    const correct = normalizedUser === normalizedCorrect || 
                   normalizedUser.includes(normalizedCorrect) ||
                   normalizedCorrect.includes(normalizedUser);

    setIsCorrect(correct);
    onAnswer(userSpeech, correct);

    // Get ChatGPT feedback
    if (languageTo && userSpeech) {
      setIsLoadingFeedback(true);
      try {
        const feedback = await getSpeakingFeedback(userSpeech, correctAnswer, languageTo);
        if (feedback.message && !feedback.error) {
          setChatGPTFeedback(feedback.message);
        } else if (feedback.error) {
          console.error("ChatGPT error:", feedback.error);
        }
      } catch (error) {
        console.error("Error getting feedback:", error);
      } finally {
        setIsLoadingFeedback(false);
      }
    }
  };

  const handleStop = async () => {
    stopListening();
    if (userSpeech) {
      await checkAnswer();
    }
  };

  const handleReset = () => {
    reset();
    setUserSpeech("");
    setChatGPTFeedback(null);
    setIsCorrect(false);
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-lg text-muted-foreground mb-2">Say this phrase:</p>
              <p className="text-2xl font-bold">{question}</p>
              <p className="text-sm text-muted-foreground mt-2">Expected: {correctAnswer}</p>
            </div>

            <div className="flex items-center justify-center gap-4">
              {!isListening ? (
                <Button
                  onClick={startListening}
                  size="lg"
                  className="rounded-full w-20 h-20"
                  disabled={showFeedback}
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-20 h-20 animate-pulse"
                >
                  <MicOff className="w-8 h-8" />
                </Button>
              )}
            </div>

            <div className="min-h-[60px]">
              {isListening && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Listening...</p>
                  <p className="text-lg font-semibold">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-muted-foreground italic">{interimTranscript}</span>
                    )}
                  </p>
                </div>
              )}
              {!isListening && userSpeech && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">You said:</p>
                  <p className="text-lg font-semibold">{userSpeech}</p>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>Error: {error}</AlertDescription>
                </Alert>
              )}
            </div>

            {showFeedback && (
              <div className="space-y-3 mt-4">
                <div
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect
                      ? "bg-success/10 border-success"
                      : "bg-destructive/10 border-destructive"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                    <p className="font-bold">
                      {isCorrect ? "Great job! 🎉" : "Keep practicing!"}
                    </p>
                  </div>
                </div>

                {isLoadingFeedback && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Getting AI feedback...</span>
                  </div>
                )}

                {chatGPTFeedback && !isLoadingFeedback && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold mb-2">AI Feedback:</p>
                      <p className="text-sm">{chatGPTFeedback}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {showFeedback && (
              <Button onClick={handleReset} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeakingExercise;

