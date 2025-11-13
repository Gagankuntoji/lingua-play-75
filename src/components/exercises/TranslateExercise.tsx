import { Input } from "@/components/ui/input";

interface TranslateExerciseProps {
  answer: string;
  onChange: (value: string) => void;
  showFeedback: boolean;
  isCorrect: boolean;
}

const TranslateExercise = ({
  answer,
  onChange,
  showFeedback,
  isCorrect,
}: TranslateExerciseProps) => {
  return (
    <div>
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