import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface UserProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  xp_earned: number | null;
}

interface UserItemState {
  id: string;
  next_due: string | null;
}

const COLORS = ["#6366f1", "#fb7185", "#34d399"];

const AnalyticsDashboard = () => {
  const { toast } = useToast();

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "personal"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user.");

      const [profileRes, lessonsRes, progressRes, reviewRes] = await Promise.all([
        supabase.from("profiles").select("xp, streak").eq("id", user.id).single(),
        supabase.from("lessons").select("id"),
        supabase
          .from("user_progress")
          .select("lesson_id, completed, completed_at, xp_earned")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: true }),
        supabase.from("user_item_state").select("id, next_due").eq("user_id", user.id),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (progressRes.error) throw progressRes.error;
      if (reviewRes.error) throw reviewRes.error;

      return {
        xp: profileRes.data?.xp ?? 0,
        streak: profileRes.data?.streak ?? 0,
        lessons: lessonsRes.data ?? [],
        progress: (progressRes.data ?? []) as UserProgress[],
        reviews: (reviewRes.data ?? []) as UserItemState[],
      };
    },
    onError: (error) => {
      toast({
        title: "Unable to load analytics",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const data = analyticsQuery.data;

  const xpTrend = useMemo(() => {
    if (!data) return [];
    let cumulative = 0;
    return data.progress
      .filter((record) => record.completed && record.completed_at)
      .map((record) => {
        cumulative += record.xp_earned ?? 0;
        return {
          date: new Date(record.completed_at as string).toLocaleDateString(),
          xp: cumulative,
        };
      });
  }, [data]);

  const completedLessons = useMemo(() => data?.progress.filter((p) => p.completed).length ?? 0, [data]);

  const funnelData = useMemo(() => {
    if (!data) return [];
    const totalLessons = data.lessons.length;
    const attempted = data.progress.length;
    return [
      { stage: "Total lessons", value: totalLessons },
      { stage: "Attempted", value: attempted },
      { stage: "Completed", value: completedLessons },
    ];
  }, [data, completedLessons]);

  const reviewData = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const due = data.reviews.filter((item) => item.next_due && new Date(item.next_due) <= now).length;
    const upcoming = data.reviews.length - due;
    return [
      { name: "Due", value: due },
      { name: "Scheduled", value: Math.max(upcoming, 0) },
    ];
  }, [data]);

  if (analyticsQuery.isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Crunching the numbers...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{data.xp}</p>
            <p className="text-sm text-muted-foreground">Keep earning to unlock tougher lessons.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Day streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-streak-fire">{data.streak}</p>
            <p className="text-sm text-muted-foreground">Complete a lesson or review to extend it.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lessons completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-success">{completedLessons}</p>
            <p className="text-sm text-muted-foreground">
              {completedLessons} / {data.lessons.length} lessons
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XP momentum</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {xpTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={xpTrend}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Complete lessons to build your XP history.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review queue health</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] flex items-center justify-center">
          {reviewData.every((segment) => segment.value === 0) ? (
            <p className="text-sm text-muted-foreground">No review data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reviewData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} label>
                  {reviewData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;

