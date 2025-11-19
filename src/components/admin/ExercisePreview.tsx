import { useState } from "react";

import MultipleChoiceExercise from "@/components/exercises/MultipleChoiceExercise";
import FillBlankExercise from "@/components/exercises/FillBlankExercise";
import TranslateExercise from "@/components/exercises/TranslateExercise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemRecord } from "@/lib/curriculum";

interface ExercisePreviewProps {
  item: ItemRecord | null;
}

const ExercisePreview = ({ item }: ExercisePreviewProps) => {
  const [selection, setSelection] = useState("");
  const [textAnswer, setTextAnswer] = useState("");

  if (!item) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Exercise preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select an imported item to preview it here.</p>
        </CardContent>
      </Card>
    );
  }

  const commonProps = {
    showFeedback: false,
  };

  const renderPreview = () => {
    switch (item.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceExercise
            question={item.question}
            options={item.options ?? []}
            selectedAnswer={selection}
            onSelect={setSelection}
            correctAnswer={item.correct_answer}
            {...commonProps}
          />
        );
      case "fill_blank":
        return (
          <FillBlankExercise
            question={item.question}
            options={item.options ?? []}
            selectedAnswer={selection}
            onSelect={setSelection}
            correctAnswer={item.correct_answer}
            {...commonProps}
          />
        );
      case "translate":
        return (
          <TranslateExercise
            question={item.question}
            answer={textAnswer}
            onChange={setTextAnswer}
            showFeedback={false}
            isCorrect={false}
            correctAnswer={item.correct_answer}
          />
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Preview not yet available for <span className="font-semibold">{item.type}</span> exercises.
          </div>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Exercise preview</CardTitle>
        <p className="text-sm text-muted-foreground">Interact with the exercise exactly as a learner would.</p>
      </CardHeader>
      <CardContent>{renderPreview()}</CardContent>
    </Card>
  );
};

export default ExercisePreview;

