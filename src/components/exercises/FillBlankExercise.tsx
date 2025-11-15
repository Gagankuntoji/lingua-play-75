import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useTextToSpeech, getLanguageCode } from "@/hooks/useTextToSpeech";
import TextToSpeechWithFeedback from "@/components/TextToSpeechWithFeedback";

interface FillBlankExerciseProps {
  question: string;
  options: string[];
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  correctAnswer: string;
  languageTo?: string;
}

const FillBlankExercise = ({
  question,
  options,
  selectedAnswer,
  onSelect,
  showFeedback,
  correctAnswer,
  languageTo,
}: FillBlankExerciseProps) => {
  const { speak, isSpeaking } = useTextToSpeech();

  const handlePlayAudio = () => {
    if (languageTo) {
      const textToSpeak = question.replace('___', correctAnswer);
      speak(textToSpeak, { lang: getLanguageCode(languageTo) });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-lg font-semibold mb-3">{question}</p>
        {languageTo && (
          <TextToSpeechWithFeedback
            text={question.replace('___', correctAnswer)}
            language={languageTo}
            showFeedback={true}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
      {options.map((option) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === correctAnswer;
        
        let buttonClass = "text-lg px-6 py-3 rounded-xl";
        
        if (showFeedback) {
          if (isCorrect) {
            buttonClass += " bg-success hover:bg-success text-white";
          } else if (isSelected && !isCorrect) {
            buttonClass += " bg-destructive hover:bg-destructive text-white";
          }
        } else if (isSelected) {
          buttonClass += " bg-primary hover:bg-primary text-white";
        }

        return (
          <Button
            key={option}
            variant={isSelected && !showFeedback ? "default" : "outline"}
            className={buttonClass}
            onClick={() => !showFeedback && onSelect(option)}
            disabled={showFeedback}
          >
            {option}
          </Button>
        );
      })}
      </div>
    </div>
  );
};

export default FillBlankExercise;