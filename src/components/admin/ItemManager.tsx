import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
}

interface Item {
  id: string;
  lesson_id: string;
  type: string;
  question: string;
  correct_answer: string;
  options: string[] | null;
  explanation?: string | null;
}

interface ItemFormValues {
  course_id: string;
  lesson_id: string;
  type: string;
  question: string;
  correct_answer: string;
  options_raw: string;
  explanation: string;
}

const defaultValues: ItemFormValues = {
  course_id: "",
  lesson_id: "",
  type: "multiple_choice",
  question: "",
  correct_answer: "",
  options_raw: "",
  explanation: "",
};

const ItemManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");

  const { register, handleSubmit, reset, watch, setValue } = useForm<ItemFormValues>({
    defaultValues,
  });

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title");
      if (error) throw error;
      return data as Course[];
    },
  });

  const allLessonsQuery = useQuery({
    queryKey: ["admin", "lessons", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("id, title, course_id").order("order_index", {
        ascending: true,
      });
      if (error) throw error;
      return data as Lesson[];
    },
  });

  const lessonsQuery = useQuery({
    queryKey: ["admin", "lessons-for-items", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, course_id")
        .eq("course_id", selectedCourse)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: Boolean(selectedCourse),
  });

  const itemsQuery = useQuery({
    queryKey: ["admin", "items", selectedLesson],
    queryFn: async () => {
      if (!selectedLesson) return [];
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("lesson_id", selectedLesson)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Item[];
    },
    enabled: Boolean(selectedLesson),
  });

  useEffect(() => {
    if (editingItem) {
      const lessonMeta = (allLessonsQuery.data ?? []).find((lesson) => lesson.id === editingItem.lesson_id);
      if (lessonMeta) {
        setSelectedCourse(lessonMeta.course_id);
        setSelectedLesson(lessonMeta.id);
        reset({
          course_id: lessonMeta.course_id,
          lesson_id: lessonMeta.id,
          type: editingItem.type,
          question: editingItem.question,
          correct_answer: editingItem.correct_answer,
          options_raw: Array.isArray(editingItem.options) ? editingItem.options.join(", ") : "",
          explanation: editingItem.explanation ?? "",
        });
      }
    } else {
      reset(defaultValues);
    }
  }, [editingItem, reset, allLessonsQuery.data]);

  useEffect(() => {
    const courses = coursesQuery.data ?? [];
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(courses[0].id);
      setValue("course_id", courses[0].id);
    }
  }, [coursesQuery.data, selectedCourse, setValue]);

  useEffect(() => {
    const lessonList = lessonsQuery.data ?? [];
    if (lessonList.length > 0) {
      const nextLessonId = selectedLesson && lessonList.some((lesson) => lesson.id === selectedLesson)
        ? selectedLesson
        : lessonList[0].id;
      setSelectedLesson(nextLessonId);
      setValue("lesson_id", nextLessonId);
    } else {
      setSelectedLesson("");
    }
  }, [lessonsQuery.data, setValue, selectedLesson]);

  const upsertMutation = useMutation({
    mutationFn: async (values: ItemFormValues) => {
      const payload = {
        lesson_id: values.lesson_id,
        type: values.type,
        question: values.question,
        correct_answer: values.correct_answer,
        options: values.options_raw
          ? JSON.stringify(values.options_raw.split(",").map((option) => option.trim()).filter(Boolean))
          : null,
        explanation: values.explanation || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      setEditingItem(null);
      reset(defaultValues);
      toast({ title: "Saved", description: "Exercise item saved." });
    },
    onError: (error) => toast({ title: "Error saving item", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      toast({ title: "Deleted", description: "Exercise item removed." });
    },
    onError: (error) => toast({ title: "Error deleting item", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (values: ItemFormValues) => {
    upsertMutation.mutate(values);
  };

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Exercises</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedCourse} onValueChange={(value) => {
              setSelectedCourse(value);
              setValue("course_id", value);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLesson} onValueChange={(value) => {
              setSelectedLesson(value);
              setValue("lesson_id", value);
            }}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedLesson ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.question}</TableCell>
                    <TableCell className="capitalize">{item.type.replace("_", " ")}</TableCell>
                    <TableCell>{item.correct_answer}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No items for this lesson yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">Select a course and lesson to view items.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Edit exercise" : "Create exercise"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watch("type")} onValueChange={(value) => setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                  <SelectItem value="fill_blank">Fill in the blank</SelectItem>
                  <SelectItem value="translate">Translate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input id="question" placeholder="Prompt" {...register("question", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correct_answer">Correct answer</Label>
              <Input id="correct_answer" placeholder="Answer" {...register("correct_answer", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="options">Options (comma separated)</Label>
              <Textarea id="options" placeholder="Option A, Option B" {...register("options_raw")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="explanation">Explanation / notes</Label>
              <Textarea id="explanation" placeholder="Shown after answering" {...register("explanation")} />
            </div>
            <div className="md:col-span-2 flex justify-between gap-2">
              <Button type="submit" className="flex-1" disabled={upsertMutation.isLoading}>
                {editingItem ? "Update exercise" : "Create exercise"}
              </Button>
              {editingItem && (
                <Button variant="secondary" type="button" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemManager;

