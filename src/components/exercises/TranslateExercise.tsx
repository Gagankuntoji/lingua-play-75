import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useTextToSpeech, getLanguageCode } from "@/hooks/useTextToSpeech";
import TextToSpeechWithFeedback from "@/components/TextToSpeechWithFeedback";

interface TranslateExerciseProps {
  question: string;
  answer: string;
  onChange: (value: string) => void;
  showFeedback: boolean;
  isCorrect: boolean;
  languageTo?: string;
}

const TranslateExercise = ({
  question,
  answer,
  onChange,
  showFeedback,
  isCorrect,
  languageTo,
}: TranslateExerciseProps) => {
  const { speak, isSpeaking } = useTextToSpeech();

  const handlePlayAudio = () => {
    if (languageTo) {
      speak(question, { lang: getLanguageCode(languageTo) });
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
      <Input
        type="text"
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your translation..."
        disabled={showFeedback}
        className={`text-lg py-6 ${
          showFeedback
            ? isCorrect
              ? "border-success border-2"
              : "border-destructive border-2"
            : ""
        }`}
      />
    </div>
  );
};

export default TranslateExercise;