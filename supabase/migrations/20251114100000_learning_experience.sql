-- Adaptive XP goal support
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goal_xp INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS daily_goal_last_adjusted DATE;

-- Live hints support for lesson items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS hint TEXT;

-- Lesson playlists
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  focus_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playlist_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (playlist_id, lesson_id)
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own playlists" ON public.playlists
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can manage playlist lessons" ON public.playlist_lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.update_playlist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_playlist_updated_at ON public.playlists;
CREATE TRIGGER set_playlist_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_updated_at();

CREATE INDEX IF NOT EXISTS idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlist_lessons_playlist ON public.playlist_lessons(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_lessons_lesson ON public.playlist_lessons(lesson_id);

