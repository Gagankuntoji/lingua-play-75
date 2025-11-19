-- Adaptive difficulty & streak mechanics

ALTER TABLE public.exercise_attempts
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hint_used BOOLEAN DEFAULT false;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS accuracy NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_duration_ms INTEGER;

CREATE TABLE IF NOT EXISTS public.user_daily_xp (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.user_daily_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own daily xp"
  ON public.user_daily_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily xp"
  ON public.user_daily_xp
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily xp"
  ON public.user_daily_xp
  FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.record_daily_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_xp IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_daily_xp (user_id, day, xp)
  VALUES (p_user_id, CURRENT_DATE, GREATEST(p_xp, 0))
  ON CONFLICT (user_id, day)
  DO UPDATE SET
    xp = public.user_daily_xp.xp + GREATEST(p_xp, 0),
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_daily_xp(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.adjust_daily_goal_if_needed(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_goal INTEGER;
  avg_xp NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(daily_goal_xp, 30) INTO current_goal
  FROM public.profiles WHERE id = p_user_id;

  SELECT COALESCE(AVG(xp), 0) INTO avg_xp
  FROM public.user_daily_xp
  WHERE user_id = p_user_id
    AND day >= CURRENT_DATE - INTERVAL '7 days';

  IF avg_xp > current_goal * 1.2 THEN
    current_goal := LEAST(current_goal + 5, 200);
  ELSIF avg_xp < current_goal * 0.5 THEN
    current_goal := GREATEST(current_goal - 5, 10);
  END IF;

  UPDATE public.profiles
  SET daily_goal_xp = current_goal,
      daily_goal_last_adjusted = CURRENT_DATE
  WHERE id = p_user_id;

  RETURN current_goal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_daily_goal_if_needed(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.award_lesson_completion(
  p_user_id UUID,
  p_lesson_id UUID,
  p_base_xp INTEGER DEFAULT 0,
  p_accuracy NUMERIC DEFAULT 0,
  p_avg_duration NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  xp_awarded INTEGER,
  accuracy_bonus INTEGER,
  speed_bonus INTEGER,
  streak INTEGER,
  daily_goal INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_profile RECORD;
  new_streak INTEGER;
  avg_duration_ms INTEGER := COALESCE(p_avg_duration, 0)::INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_lesson_id IS NULL THEN
    RAISE EXCEPTION 'User and lesson are required';
  END IF;

  accuracy_bonus :=
    CASE
      WHEN COALESCE(p_accuracy, 0) >= 0.95 THEN 15
      WHEN COALESCE(p_accuracy, 0) >= 0.85 THEN 10
      WHEN COALESCE(p_accuracy, 0) >= 0.70 THEN 5
      ELSE 0
    END;

  speed_bonus :=
    CASE
      WHEN avg_duration_ms > 0 AND avg_duration_ms <= 8000 THEN 5
      WHEN avg_duration_ms > 8000 AND avg_duration_ms <= 15000 THEN 3
      ELSE 0
    END;

  xp_awarded := GREATEST(p_base_xp, 0) + accuracy_bonus + speed_bonus;

  SELECT xp, streak, last_active
  INTO prev_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF prev_profile.last_active::DATE = CURRENT_DATE - 1 THEN
    new_streak := COALESCE(prev_profile.streak, 0) + 1;
  ELSIF prev_profile.last_active::DATE = CURRENT_DATE THEN
    new_streak := COALESCE(prev_profile.streak, 0);
  ELSE
    new_streak := 1;
  END IF;

  INSERT INTO public.user_progress (user_id, lesson_id, xp_earned, completed, completed_at, accuracy, avg_duration_ms)
  VALUES (p_user_id, p_lesson_id, xp_awarded, true, NOW(), p_accuracy, avg_duration_ms)
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    xp_earned = EXCLUDED.xp_earned,
    completed = true,
    completed_at = NOW(),
    accuracy = EXCLUDED.accuracy,
    avg_duration_ms = EXCLUDED.avg_duration_ms;

  UPDATE public.profiles
  SET xp = COALESCE(prev_profile.xp, 0) + xp_awarded,
      streak = new_streak,
      last_active = NOW()
  WHERE id = p_user_id;

  PERFORM public.record_daily_xp(p_user_id, xp_awarded);
  daily_goal := public.adjust_daily_goal_if_needed(p_user_id);

  streak := new_streak;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_lesson_completion(UUID, UUID, INTEGER, NUMERIC, NUMERIC) TO authenticated;

