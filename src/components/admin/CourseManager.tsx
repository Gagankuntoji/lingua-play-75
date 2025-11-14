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
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  language_from: string;
  language_to: string;
  flag_emoji: string | null;
}

interface CourseFormValues {
  title: string;
  description: string;
  language_from: string;
  language_to: string;
  flag_emoji: string;
}

const defaultValues: CourseFormValues = {
  title: "",
  description: "",
  language_from: "",
  language_to: "",
  flag_emoji: "🌍",
};

const CourseManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const { register, handleSubmit, reset } = useForm<CourseFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (editingCourse) {
      reset({
        title: editingCourse.title,
        description: editingCourse.description ?? "",
        language_from: editingCourse.language_from,
        language_to: editingCourse.language_to,
        flag_emoji: editingCourse.flag_emoji ?? "🌍",
      });
    } else {
      reset(defaultValues);
    }
  }, [editingCourse, reset]);

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Course[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(values)
          .eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      setEditingCourse(null);
      reset(defaultValues);
      toast({
        title: "Saved",
        description: "Course updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast({
        title: "Deleted",
        description: "Course removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    upsertMutation.mutate(values);
  };

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="font-semibold flex items-center gap-2">
                        <span>{course.flag_emoji}</span>
                        {course.title}
                      </div>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    </TableCell>
                    <TableCell>
                      {course.language_from} → {course.language_to}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingCourse(course)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(course.id)}
                        disabled={deleteMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No courses yet.
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
          <CardTitle>{editingCourse ? "Edit course" : "Create course"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Italian for Beginners" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Short summary" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language_from">From</Label>
                <Input id="language_from" placeholder="English" {...register("language_from", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language_to">To</Label>
                <Input id="language_to" placeholder="Italian" {...register("language_to", { required: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag_emoji">Flag emoji</Label>
              <Input id="flag_emoji" placeholder="🇮🇹" {...register("flag_emoji")} />
            </div>
            <div className="flex justify-between gap-2">
              <Button type="submit" className="flex-1" disabled={upsertMutation.isLoading}>
                {editingCourse ? "Update course" : "Create course"}
              </Button>
              {editingCourse && (
                <Button variant="secondary" type="button" onClick={() => setEditingCourse(null)}>
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

export default CourseManager;

