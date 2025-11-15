# Fix: Row Level Security Policy Error

## The Problem
You're seeing: **"new row violates row-level security policy for table 'courses'"**

This happens because Supabase Row Level Security (RLS) is enabled but there are no INSERT/UPDATE/DELETE policies for admin operations.

## Solution: Run the Migration

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
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
```

5. Click **Run**
6. Refresh your app and try creating a course again

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply the migration file: `supabase/migrations/20251115000000_fix_admin_rls_policies.sql`

---

## What This Does

- Allows **authenticated users** (logged-in users) to:
  - ✅ Create courses
  - ✅ Update courses
  - ✅ Delete courses
  - ✅ Create/update/delete lessons
  - ✅ Create/update/delete exercises (items)

- Still keeps **public read access** (anyone can view courses/lessons)

---

## After Running the Migration

1. Refresh your browser
2. Try creating a course again
3. The error should be gone!

---

## Security Note

These policies allow any authenticated user to manage content. For production, you might want to:
- Add role-based access (admin role)
- Restrict to specific user IDs
- Add more granular permissions

For now, this allows all logged-in users to manage content, which is fine for development.

