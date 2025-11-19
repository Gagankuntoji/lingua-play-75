import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";
import { Flame, RefreshCw } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface BacklogRecord {
  next_due: string | null;
}

const colorForValue = (value: number, max: number) => {
  if (max === 0) {
    return "var(--muted)";
  }
  const ratio = value / max;
  const hue = 140 - Math.min(1, ratio) * 80;
  const lightness = 90 - Math.min(1, ratio) * 40;
  return `hsl(${hue}, 70%, ${lightness}%)`;
};

const BacklogHeatmap = () => {
  const { toast } = useToast();
  const backlogQuery = useQuery({
    queryKey: ["admin", "backlog-heatmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_item_state")
        .select("next_due")
        .not("next_due", "is", null);
      if (error) throw error;
      return data as BacklogRecord[];
    },
    onError: (error) => {
      toast({
        title: "Unable to load backlog",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const heatmapData = useMemo(() => {
    if (!backlogQuery.data) {
      return [];
    }
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(today, index);
      return {
        key: format(date, "yyyy-MM-dd"),
        label: format(date, "EEE"),
        count: 0,
        date,
      };
    });

    let overdue = 0;
    backlogQuery.data.forEach((record) => {
      if (!record.next_due) return;
      const dueDate = startOfDay(new Date(record.next_due));
      const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        overdue += 1;
        return;
      }
      if (diffDays < days.length) {
        days[diffDays].count += 1;
      }
    });

    return { days, overdue };
  }, [backlogQuery.data]);

  if (backlogQuery.isLoading) {
    return <Skeleton className="h-56 rounded-2xl" />;
  }

  if (!backlogQuery.data || heatmapData.days.length === 0) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Review backlog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No review backlog data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...heatmapData.days.map((day) => day.count), 1);

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Backlog heatmap
        </CardTitle>
        {heatmapData.overdue > 0 && (
          <span className="text-xs font-semibold text-destructive">
            {heatmapData.overdue.toLocaleString()} overdue
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {heatmapData.days.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-2">
              <div
                className="h-16 w-full rounded-xl border"
                style={{
                  background: colorForValue(day.count, maxValue),
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <div className="flex h-full flex-col items-center justify-center text-sm font-semibold text-foreground">
                  <span>{day.count}</span>
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Counts represent exercises scheduled for each day. Higher saturation indicates a heavier queue.
        </p>
      </CardContent>
    </Card>
  );
};

export default BacklogHeatmap;

