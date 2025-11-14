import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useTextToSpeech, getLanguageCode } from "@/hooks/useTextToSpeech";

interface MultipleChoiceExerciseProps {
  question: string;
  options: string[];
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  correctAnswer: string;
  languageTo?: string;
}

const MultipleChoiceExercise = ({
  question,
  options,
  selectedAnswer,
  onSelect,
  showFeedback,
  correctAnswer,
  languageTo,
}: MultipleChoiceExerciseProps) => {
  const { speak, isSpeaking } = useTextToSpeech();

  const handlePlayAudio = (text: string) => {
    if (languageTo) {
      speak(text, { lang: getLanguageCode(languageTo) });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{question}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handlePlayAudio(question)}
          disabled={isSpeaking}
          className="shrink-0"
        >
          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
        </Button>
      </div>
      <div className="grid gap-3">
      {options.map((option) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === correctAnswer;
        
        let buttonClass = "w-full justify-start text-left h-auto py-4 px-6 text-lg";
        
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
            className={`${buttonClass} group flex items-center justify-between`}
            onClick={() => !showFeedback && onSelect(option)}
            disabled={showFeedback}
          >
            <span>{option}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayAudio(option);
              }}
              disabled={isSpeaking}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </Button>
        );
      })}
      </div>
    </div>
  );
};

export default MultipleChoiceExercise;