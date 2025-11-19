import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ExercisePreview from "@/components/admin/ExercisePreview";
import {
  CurriculumBundle,
  CurriculumSnapshot,
  NormalizedCurriculumResult,
  exportCurriculumToCsv,
  exportCurriculumToJson,
  normalizeCurriculum,
  parseCurriculumCsv,
  parseNotionJson,
} from "@/lib/curriculum";

type ImportFormat = "csv" | "notion";

const emptySnapshot: CurriculumSnapshot = {
  courses: [],
  lessons: [],
  items: [],
};

const CurriculumToolbox = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<ImportFormat>("csv");
  const [rawInput, setRawInput] = useState("");
  const [parsedResult, setParsedResult] = useState<NormalizedCurriculumResult | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const curriculumQuery = useQuery({
    queryKey: ["admin", "curriculum-snapshot"],
    queryFn: async (): Promise<CurriculumSnapshot> => {
      const [courses, lessons, items] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title, description, language_from, language_to, flag_emoji")
          .order("created_at", { ascending: true }),
        supabase
          .from("lessons")
          .select("id, title, course_id, order_index")
          .order("order_index", { ascending: true }),
        supabase
          .from("items")
          .select("id, lesson_id, type, question, correct_answer, options, order_index, hint, explanation")
          .order("order_index", { ascending: true }),
      ]);

      if (courses.error) throw courses.error;
      if (lessons.error) throw lessons.error;
      if (items.error) throw items.error;

      return {
        courses: courses.data ?? [],
        lessons: lessons.data ?? [],
        items: items.data ?? [],
      };
    },
    onError: (error) => {
      toast({
        title: "Unable to load curriculum snapshot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawInput(text);
    setValidationError(null);
    setParsedResult(null);
    setSelectedItemId(null);
  };

  const parsePayload = async () => {
    setIsParsing(true);
    setValidationError(null);
    setParsedResult(null);
    setSelectedItemId(null);
    try {
      const bundle: CurriculumBundle =
        format === "csv" ? parseCurriculumCsv(rawInput) : parseNotionJson(rawInput);
      const snapshot = curriculumQuery.data ?? emptySnapshot;
      const normalized = normalizeCurriculum(bundle, snapshot);
      setParsedResult(normalized);
      if (normalized.records.items.length) {
        setSelectedItemId(normalized.records.items[0].id);
      }
      if (normalized.warnings.length) {
        toast({
          title: "Import warnings",
          description: `${normalized.warnings.length} issue(s) detected. See details below.`,
        });
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Unknown parse error");
    } finally {
      setIsParsing(false);
    }
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!parsedResult) {
        throw new Error("No parsed curriculum to import.");
      }
      const { records } = parsedResult;
      const coursePayload = records.courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        language_from: course.language_from,
        language_to: course.language_to,
        flag_emoji: course.flag_emoji,
      }));
      const lessonPayload = records.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        course_id: lesson.course_id,
        order_index: lesson.order_index,
      }));
      const itemPayload = records.items.map((item) => ({
        id: item.id,
        lesson_id: item.lesson_id,
        type: item.type,
        question: item.question,
        correct_answer: item.correct_answer,
        options: item.options,
        order_index: item.order_index,
        hint: item.hint,
        explanation: item.explanation,
      }));

      const [courseRes, lessonRes, itemRes] = await Promise.all([
        supabase.from("courses").upsert(coursePayload),
        supabase.from("lessons").upsert(lessonPayload),
        supabase.from("items").upsert(itemPayload),
      ]);

      [courseRes, lessonRes, itemRes].forEach((response) => {
        if (response.error) throw response.error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "curriculum-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      toast({
        title: "Curriculum updated",
        description: "New content is now live for editors.",
      });
      setParsedResult(null);
      setRawInput("");
      setSelectedItemId(null);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedPreviewItem = useMemo(() => {
    if (!parsedResult || !selectedItemId) return null;
    return parsedResult.records.items.find((item) => item.id === selectedItemId) ?? null;
  }, [parsedResult, selectedItemId]);

  const diffSummary = useMemo(() => {
    if (!parsedResult) return [];
    return [
      {
        label: "Courses",
        created: parsedResult.diff.courses.created.length,
        updated: parsedResult.diff.courses.updated.length,
      },
      {
        label: "Lessons",
        created: parsedResult.diff.lessons.created.length,
        updated: parsedResult.diff.lessons.updated.length,
      },
      {
        label: "Exercises",
        created: parsedResult.diff.items.created.length,
        updated: parsedResult.diff.items.updated.length,
      },
    ];
  }, [parsedResult]);

  const handleExport = (type: "csv" | "json") => {
    if (!curriculumQuery.data) {
      toast({
        title: "Nothing to export",
        description: "Load the curriculum snapshot first.",
      });
      return;
    }
    const content =
      type === "csv"
        ? exportCurriculumToCsv(curriculumQuery.data)
        : exportCurriculumToJson(curriculumQuery.data);
    const blob = new Blob([content], {
      type: type === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `curriculum-${new Date().toISOString().split("T")[0]}.${type}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Curriculum tooling
            </CardTitle>
            <CardDescription>
              Import CSV/Notion exports, validate changes, preview exercises, and publish updates.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={curriculumQuery.isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport("json")} disabled={curriculumQuery.isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Source format</Label>
                <Select value={format} onValueChange={(value: ImportFormat) => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV or spreadsheet</SelectItem>
                    <SelectItem value="notion">Notion JSON export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Load file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={format === "csv" ? ".csv,.txt" : ".json,.txt"}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setRawInput(curriculumQuery.data ? exportCurriculumToJson(curriculumQuery.data) : "")}
                    disabled={!curriculumQuery.data}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Load current
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum-payload">Paste curriculum data</Label>
              <Textarea
                id="curriculum-payload"
                placeholder={
                  format === "csv"
                    ? "entity,title,language_from,language_to,..."
                    : '{ "courses": [], "lessons": [], "items": [] }'
                }
                className="min-h-[180px] font-mono"
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Each CSV row must include an <code className="font-semibold">entity</code> column with values of
                course/lesson/item. Notion imports expect the JSON bundle from “Export → Database → JSON”.
              </p>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            {parsedResult?.warnings.length ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50/70 p-3 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Warnings</p>
                <ul className="list-disc pl-4 space-y-1">
                  {parsedResult.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button onClick={parsePayload} disabled={!rawInput || isParsing}>
                {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Validate & preview
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setParsedResult(null);
                  setRawInput("");
                  setValidationError(null);
                  setSelectedItemId(null);
                }}
                disabled={!rawInput && !parsedResult}
              >
                Reset
              </Button>
              <Button
                className="bg-success text-white hover:bg-success/90"
                disabled={!parsedResult || applyMutation.isLoading}
                onClick={() => applyMutation.mutate()}
              >
                {applyMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Publish import
                  </>
                )}
              </Button>
            </div>

            {diffSummary.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {diffSummary.map((entry) => (
                  <Card key={entry.label} className="bg-muted/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{entry.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      <Badge variant="outline" className="text-success border-success/40">
                        +{entry.created} new
                      </Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-400/70">
                        {entry.updated} updates
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Imported exercises</p>
                <Badge variant="secondary">{parsedResult?.records.items.length ?? 0}</Badge>
              </div>
              <ScrollArea className="mt-3 h-56 rounded-lg border bg-muted/20">
                <div className="divide-y divide-border/50">
                  {parsedResult?.records.items.length ? (
                    parsedResult.records.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                          selectedItemId === item.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <p className="font-medium">{item.question}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-6 text-sm text-muted-foreground">Validate an import to see exercises.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
            <ExercisePreview item={selectedPreviewItem} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurriculumToolbox;

