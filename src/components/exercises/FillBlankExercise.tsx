import { Button } from "@/components/ui/button";

interface FillBlankExerciseProps {
  options: string[];
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  correctAnswer: string;
}

const FillBlankExercise = ({
  options,
  selectedAnswer,
  onSelect,
  showFeedback,
  correctAnswer,
}: FillBlankExerciseProps) => {
  return (
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
  );
};

export default FillBlankExercise;