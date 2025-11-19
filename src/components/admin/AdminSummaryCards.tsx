import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Layers, Target } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SummaryData {
  courses: number;
  lessons: number;
  items: number;
  learners: number;
  overdueReviews: number;
}

const iconMap = {
  courses: BookOpen,
  lessons: Layers,
  items: Target,
  learners: Users,
};

const AdminSummaryCards = () => {
  const { toast } = useToast();

  const summaryQuery = useQuery({
    queryKey: ["admin", "summary-cards"],
    queryFn: async (): Promise<SummaryData> => {
      const [courses, lessons, items, learners, reviews] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase.from("items").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("user_item_state")
          .select("next_due")
          .lte("next_due", new Date().toISOString()),
      ]);

      const responses = [courses, lessons, items, learners] as const;
      responses.forEach((response) => {
        if (response.error) throw response.error;
      });
      if (reviews.error) throw reviews.error;

      return {
        courses: courses.count ?? 0,
        lessons: lessons.count ?? 0,
        items: items.count ?? 0,
        learners: learners.count ?? 0,
        overdueReviews: reviews.data?.length ?? 0,
      };
    },
    onError: (error) => {
      toast({
        title: "Unable to load admin summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const summaryCards = useMemo(
    () => [
      {
        key: "courses",
        label: "Courses live",
        value: summaryQuery.data?.courses ?? 0,
      },
      {
        key: "lessons",
        label: "Lessons published",
        value: summaryQuery.data?.lessons ?? 0,
      },
      {
        key: "items",
        label: "Exercises in rotation",
        value: summaryQuery.data?.items ?? 0,
      },
      {
        key: "learners",
        label: "Active learner profiles",
        value: summaryQuery.data?.learners ?? 0,
      },
    ],
    [summaryQuery.data],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryQuery.isLoading
        ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)
        : summaryCards.map((card) => {
            const Icon = iconMap[card.key as keyof typeof iconMap];
            return (
              <Card key={card.key} className="border-primary/10 bg-gradient-to-br from-primary/5 to-background h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                  {card.key === "items" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {summaryQuery.data?.overdueReviews ?? 0} exercises due for review
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
};

export default AdminSummaryCards;

