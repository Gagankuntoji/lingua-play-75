import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Bot } from "lucide-react";
import TextToSpeechWithFeedback from "@/components/TextToSpeechWithFeedback";
import { useSpeechRecognition, getSpeechRecognitionLanguageCode } from "@/hooks/useSpeechRecognition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getGrammarCorrection } from "@/lib/gemini";

interface TranslateExerciseProps {
  question: string;
  answer: string;
  onChange: (value: string) => void;
  showFeedback: boolean;
  isCorrect: boolean;
  languageTo?: string;
  correctAnswer: string;
}

const TranslateExercise = ({
  question,
  correctAnswer,
  answer,
  onChange,
  showFeedback,
  isCorrect,
  languageTo,
}: TranslateExerciseProps) => {
  const [grammarFeedback, setGrammarFeedback] = useState<string | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);

  const {
    isSupported: speechSupported,
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    reset,
  } = useSpeechRecognition({
    lang: languageTo ? getSpeechRecognitionLanguageCode(languageTo) : "en-US",
    continuous: false,
    interimResults: true,
  });

  useEffect(() => {
    if (transcript) {
      onChange(transcript);
    }
  }, [transcript, onChange]);

  useEffect(() => {
    let ignore = false;

    const runGrammarCheck = async () => {
      if (!answer || !showFeedback) return;
      setCheckingGrammar(true);
      setGrammarError(null);

      const result = await getGrammarCorrection({
        answer,
        correctAnswer,
        languageTo,
        question,
      });

      if (ignore) return;
      if (result.error) {
        setGrammarError(result.error);
        setGrammarFeedback(null);
      } else {
        setGrammarFeedback(result.message);
      }
      setCheckingGrammar(false);
    };

    runGrammarCheck();

    if (!showFeedback) {
      setGrammarFeedback(null);
      setGrammarError(null);
      setCheckingGrammar(false);
    }

    return () => {
      ignore = true;
    };
  }, [answer, correctAnswer, languageTo, question, showFeedback]);

  const handleVoiceToggle = () => {
    if (!speechSupported) return;
    if (isListening) {
      stopListening();
    } else {
      reset();
      onChange("");
      setGrammarFeedback(null);
      setGrammarError(null);
      startListening();
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-lg text-muted-foreground mb-2">Translate this:</p>
        <p className="text-xl font-semibold mb-3">{question}</p>
        {languageTo && (
          <TextToSpeechWithFeedback
            text={question}
            language={languageTo}
            showFeedback={true}
          />
        )}
      </div>

      <div className="flex gap-2 items-start">
        <Input
          type="text"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your translation..."
          disabled={showFeedback}
          className={`text-lg py-6 flex-1 ${
            showFeedback
              ? isCorrect
                ? "border-success border-2"
                : "border-destructive border-2"
              : ""
          }`}
        />
        {speechSupported && (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleVoiceToggle}
            disabled={showFeedback}
            aria-label="Use speech recognition"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {speechSupported && !showFeedback && (
        <div className="mt-2 text-sm text-muted-foreground min-h-[24px]">
          {isListening ? (
            <span>
              Listening… {interimTranscript && <em>{interimTranscript}</em>}
            </span>
          ) : transcript ? (
            <span>Captured: “{transcript}”</span>
          ) : null}
          {speechError && (
            <span className="text-destructive block">Speech error: {speechError}</span>
          )}
        </div>
      )}

      {showFeedback && checkingGrammar && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking grammar with Gemini...
        </div>
      )}

      {showFeedback && grammarFeedback && (
        <Alert className="mt-3">
          <Bot className="h-4 w-4" />
          <AlertDescription>{grammarFeedback}</AlertDescription>
        </Alert>
      )}

      {showFeedback && grammarError && (
        <Alert className="mt-3" variant="destructive">
          <AlertDescription>{grammarError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TranslateExercise;