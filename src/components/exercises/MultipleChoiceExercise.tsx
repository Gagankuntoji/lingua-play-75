import { Button } from "@/components/ui/button";

interface MultipleChoiceExerciseProps {
  options: string[];
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  correctAnswer: string;
}

const MultipleChoiceExercise = ({
  options,
  selectedAnswer,
  onSelect,
  showFeedback,
  correctAnswer,
}: MultipleChoiceExerciseProps) => {
  return (
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
            className={buttonClass}
            onClick={() => !showFeedback && onSelect(option)}
            disabled={showFeedback}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
};

export default MultipleChoiceExercise;