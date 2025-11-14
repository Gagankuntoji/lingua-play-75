import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  flag_emoji: string | null;
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
  courses?: {
    title: string;
  };
}

interface LessonFormValues {
  course_id: string;
  title: string;
  order_index: number;
}

const defaultValues: LessonFormValues = {
  course_id: "",
  title: "",
  order_index: 1,
};

const LessonManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  const { register, handleSubmit, reset, watch, setValue } = useForm<LessonFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (editingLesson) {
      reset({
        course_id: editingLesson.course_id,
        title: editingLesson.title,
        order_index: editingLesson.order_index,
      });
    } else {
      reset(defaultValues);
    }
  }, [editingLesson, reset]);

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, title, flag_emoji");
      if (error) throw error;
      return data as Course[];
    },
  });

  const lessonsQuery = useQuery({
    queryKey: ["admin", "lessons", selectedCourseFilter],
    queryFn: async () => {
      let query = supabase.from("lessons").select("*, courses(title)").order("order_index", { ascending: true });
      if (selectedCourseFilter !== "all") {
        query = query.eq("course_id", selectedCourseFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(values)
          .eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
      setEditingLesson(null);
      reset(defaultValues);
      toast({ title: "Saved", description: "Lesson updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error saving lesson", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
      toast({ title: "Deleted", description: "Lesson removed." });
    },
    onError: (error) => {
      toast({ title: "Error deleting lesson", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: LessonFormValues) => {
    upsertMutation.mutate(values);
  };

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);

  useEffect(() => {
    if (!watch("course_id") && courses.length > 0) {
      setValue("course_id", courses[0].id);
    }
  }, [courses, setValue, watch]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Lessons</CardTitle>
          <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.flag_emoji} {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>{lesson.title}</TableCell>
                    <TableCell>{lesson.courses?.title ?? "—"}</TableCell>
                    <TableCell>{lesson.order_index}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingLesson(lesson)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(lesson.id)}
                        disabled={deleteMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lessons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No lessons for this course yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingLesson ? "Edit lesson" : "Create lesson"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 md:col-span-1">
              <Label>Course</Label>
              <Select value={watch("course_id")} onValueChange={(value) => setValue("course_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.flag_emoji} {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Lesson title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="order_index">Order</Label>
              <Input
                id="order_index"
                type="number"
                min={1}
                {...register("order_index", { valueAsNumber: true, required: true })}
              />
            </div>
            <div className="md:col-span-3 flex justify-between gap-2">
              <Button type="submit" className="flex-1" disabled={upsertMutation.isLoading}>
                {editingLesson ? "Update lesson" : "Create lesson"}
              </Button>
              {editingLesson && (
                <Button variant="secondary" type="button" onClick={() => setEditingLesson(null)}>
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

export default LessonManager;

