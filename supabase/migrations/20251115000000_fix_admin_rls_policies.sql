-- Fix Row Level Security policies for admin operations
-- Allow authenticated users to manage courses, lessons, and items

-- Courses: Allow authenticated users to insert, update, and delete
CREATE POLICY "Authenticated users can insert courses" ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update courses" ON public.courses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete courses" ON public.courses
  FOR DELETE
  TO authenticated
  USING (true);

-- Lessons: Allow authenticated users to insert, update, and delete
CREATE POLICY "Authenticated users can insert lessons" ON public.lessons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lessons" ON public.lessons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete lessons" ON public.lessons
  FOR DELETE
  TO authenticated
  USING (true);

-- Items: Allow authenticated users to insert, update, and delete
CREATE POLICY "Authenticated users can insert items" ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update items" ON public.items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete items" ON public.items
  FOR DELETE
  TO authenticated
  USING (true);

