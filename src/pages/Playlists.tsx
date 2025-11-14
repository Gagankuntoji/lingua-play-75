import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, Layers, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonOption {
  id: string;
  title: string;
  course_id: string;
  course_title: string;
  flag_emoji?: string | null;
}

interface PlaylistLesson {
  id: string;
  order_index: number;
  lessons: {
    id: string;
    title: string;
    course_id: string;
    courses?: {
      title: string;
      flag_emoji?: string | null;
    };
  };
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  focus_tag: string | null;
  playlist_lessons: PlaylistLesson[];
}

const focusTags = ["Grammar", "Vocabulary", "Listening", "Speaking", "Review"];

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

const Playlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", description: "", focus_tag: "" });
  const [saving, setSaving] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const [{ data: lessonsData, error: lessonsError }, { data: playlistsData, error: playlistsError }] =
        await Promise.all([
          supabase
            .from("lessons")
            .select("id, title, course_id, courses(title, flag_emoji)")
            .order("order_index", { ascending: true }),
          supabase
            .from("playlists")
            .select(`
              id,
              title,
              description,
              focus_tag,
              playlist_lessons (
                id,
                order_index,
                lessons (
                  id,
                  title,
                  course_id,
                  courses (
                    title,
                    flag_emoji
                  )
                )
              )
            `)
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true }),
        ]);

      if (lessonsError) throw lessonsError;
      if (playlistsError) throw playlistsError;

      const lessonOptions: LessonOption[] =
        lessonsData?.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          course_id: lesson.course_id,
          course_title: lesson.courses?.title ?? "Unknown",
          flag_emoji: lesson.courses?.flag_emoji,
        })) ?? [];

      setLessons(lessonOptions);
      setPlaylists(playlistsData ?? []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to load playlists",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLessonToggle = (lessonId: string) => {
    setSelectedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId],
    );
  };

  const handleCreatePlaylist = async () => {
    if (!form.title) {
      toast({
        title: "Please add a title",
        description: "Playlists need at least a title.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: playlist, error } = await supabase
        .from("playlists")
        .insert({
          owner_id: user.id,
          title: form.title,
          description: form.description,
          focus_tag: form.focus_tag || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (playlist && selectedLessons.length > 0) {
        const rows = selectedLessons.map((lessonId, index) => ({
          playlist_id: playlist.id,
          lesson_id: lessonId,
          order_index: index + 1,
        }));
        const { error: lessonError } = await supabase.from("playlist_lessons").insert(rows);
        if (lessonError) throw lessonError;
      }

      toast({
        title: "Playlist created",
        description: "Your focus track is ready to play.",
      });
      setForm({ title: "", description: "", focus_tag: "" });
      setSelectedLessons([]);
      await loadData();
    } catch (error) {
      toast({
        title: "Could not create playlist",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredLessons = useMemo(() => {
    if (courseFilter === "all") return lessons;
    return lessons.filter((lesson) => lesson.course_id === courseFilter);
  }, [lessons, courseFilter]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, { title: string; flag?: string | null }>();
    lessons.forEach((lesson) => {
      if (!map.has(lesson.course_id)) {
        map.set(lesson.course_id, { title: lesson.course_title, flag: lesson.flag_emoji });
      }
    });
    return Array.from(map.entries()).map(([id, meta]) => ({
      id,
      ...meta,
    }));
  }, [lessons]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🌀</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              Playlists & Focus Tracks
            </h1>
            <p className="text-sm text-muted-foreground">
              Build custom lesson sequences for grammar, vocabulary, or review.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground">
              Create playlists to revisit tricky lessons, prep for travel, or run a review sprint.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create a focus track</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Weekend Review Sprint"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="focus">Focus tag</Label>
                  <Input
                    id="focus"
                    list="focus-tags"
                    value={form.focus_tag}
                    onChange={(e) => setForm((f) => ({ ...f, focus_tag: e.target.value }))}
                    placeholder="Grammar"
                  />
                  <datalist id="focus-tags">
                    {focusTags.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Target tricky verbs before the next lesson"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select lessons</Label>
                  <Tabs value={courseFilter} onValueChange={setCourseFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      {courseOptions.map((course) => (
                        <TabsTrigger key={course.id} value={course.id}>
                          {course.flag ?? "🌍"} {course.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <ScrollArea className="h-56 border rounded-lg p-3">
                  <div className="space-y-2">
                    {filteredLessons.map((lesson) => (
                      <label
                        key={lesson.id}
                        className="flex items-center gap-3 rounded border p-2 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedLessons.includes(lesson.id)}
                          onCheckedChange={() => handleLessonToggle(lesson.id)}
                        />
                        <div>
                          <p className="font-semibold">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{lesson.flag_emoji ?? "🌍"}</span>
                            {lesson.course_title}
                          </p>
                        </div>
                      </label>
                    ))}
                    {filteredLessons.length === 0 && (
                      <p className="text-sm text-muted-foreground">No lessons available for this filter.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePlaylist} disabled={saving}>
                  Save playlist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {playlists.map((playlist) => {
            const firstLesson = playlist.playlist_lessons?.[0]?.lessons;
            return (
              <Card key={playlist.id} className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-primary" />
                      {playlist.title}
                    </CardTitle>
                    {playlist.focus_tag && <Badge variant="secondary">{playlist.focus_tag}</Badge>}
                  </div>
                  {playlist.description && (
                    <CardDescription className="text-sm">{playlist.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {playlist.playlist_lessons.length} lessons
                  </p>
                  <ul className="space-y-2 text-sm">
                    {playlist.playlist_lessons.slice(0, 4).map((pl) => (
                      <li key={pl.id} className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-6">{pl.order_index}.</span>
                        <div>
                          <p className="font-medium">{pl.lessons.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {pl.lessons.courses?.flag_emoji ?? "🌍"} {pl.lessons.courses?.title}
                          </p>
                        </div>
                      </li>
                    ))}
                    {playlist.playlist_lessons.length > 4 && (
                      <li className="text-xs text-muted-foreground">+ more lessons</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button className="flex-1" disabled={!firstLesson} onClick={() => firstLesson && navigate(`/lesson/${firstLesson.id}`)}>
                    Start playlist
                  </Button>
                  <Button variant="ghost" disabled={!firstLesson} onClick={() => firstLesson && navigate(`/lesson/${firstLesson.id}`)}>
                    Resume
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {playlists.length === 0 && (
          <Card className="border-2">
            <CardContent className="py-10 text-center space-y-2">
              <p className="text-4xl">🧠</p>
              <p className="text-lg font-semibold">No playlists yet</p>
              <p className="text-sm text-muted-foreground">
                Build your first focus track to bundle lessons for review or travel prep.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Playlists;

