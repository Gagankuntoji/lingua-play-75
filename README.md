# LinguaLearn

A full-stack language learning platform that combines spaced repetition, interactive lessons, and progress tracking. The frontend is built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui. Supabase provides authentication, database, and real-time services.

---

## Table of Contents
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Application Walkthrough](#application-walkthrough)
- [Supabase Data Model](#supabase-data-model)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Styling System](#styling-system)
- [Extending the Platform](#extending-the-platform)
- [Troubleshooting](#troubleshooting)

---

## Key Features
- **Email/password authentication** via Supabase with protected routing and persistent sessions.
- **Course catalog** that loads available language courses from Supabase and navigates learners into lesson collections.
- **Lesson browser** with gating logic to lock later lessons until earlier content is completed.
- **Interactive lesson player** that supports:
  - Multiple choice questions
  - Fill-in-the-blank exercises
  - Translation tasks
  - **Speaking exercises with speech recognition** (NEW)
- **AI-powered feedback** via ChatGPT integration for speaking practice (NEW)
- **Text-to-speech** for pronunciation practice in all exercise types
- **Speech-to-text recognition** for speaking exercises (NEW)
- Validates answers, awards XP, and persists attempt history.
- **Spaced repetition review** queue (SM-2 inspired) that surfaces due items from previous lessons on the daily review screen.
- **Personal profile dashboard** showing XP, streaks, lesson completion stats, and placeholder achievements.
- **Admin panel** with course, lesson, exercise management, and **exercise seeder** for quick content creation (NEW)
- **Toast notifications** (radix + shadcn) for feedback during authentication and lesson completion.
- **Responsive UI** built with Tailwind CSS, shadcn/ui primitives, and custom gradients/icons for a playful brand.

---

## Tech Stack
- **Framework:** React 18, Vite 5 with SWC, TypeScript
- **Routing:** React Router v6
- **Data Fetching / Caching:** TanStack Query
- **Forms & Validation:** React Hook Form, Zod (available), shadcn/ui form components
- **Styling:** Tailwind CSS, tailwind-merge, class-variance-authority
- **UI Toolkit:** shadcn/ui (Radix UI bindings), lucide-react icons
- **Notifications:** Radix Toast + Sonner
- **Auth & Backend:** Supabase (Auth, Postgres, row-level security)
- **Charts & Visuals:** Recharts (included for future analytics)

---

## Application Walkthrough

### Authentication (`/auth`)
- Email/password sign-up with redirect back to the app (`Auth.tsx`).
- Sign-in form, validation, loading state, and error handling via toast notifications.

### Protected Experiences
- `ProtectedRoute.tsx` subscribes to Supabase auth state, shows a loader while determining the current session, and redirects unauthenticated users to `/auth`.
- All main routes—home, courses, lessons, review, profile, admin—sit behind this guard.

### Home Dashboard (`/`)
- Fetches the learner profile (XP, streak) from `profiles`.
- Highlights key stats and offers quick actions for Courses, Profile, and Daily Review.
- Encourages users to maintain streaks and earn XP via a daily goal card.

### Courses (`/courses`)
- Loads all `courses` from Supabase and renders them as tappable cards with flag emojis (language pairs).
- Navigates to the lesson list for the selected course.

### Lessons (`/courses/:courseId/lessons`)
- Retrieves course metadata and associated `lessons`.
- Displays progress, gating logic (first lesson unlocked by default), and a Start button that routes into the lesson player.

### Lesson Player (`/lesson/:lessonId`)
- Fetches all `items` (exercise prompts) for the lesson.
- Supports:
  - Multiple-choice questions (`MultipleChoiceExercise.tsx`) with text-to-speech
  - Translation input (`TranslateExercise.tsx`) with audio playback
  - Fill-in-the-blank word banks (`FillBlankExercise.tsx`) with audio
  - **Speaking exercises** (`SpeakingExercise.tsx`) with speech recognition and ChatGPT feedback (NEW)
- Normalizes answers to improve matching, records attempts, awards XP, updates `user_progress`, and increments the learner's XP in `profiles`.
- **Speech recognition** uses browser's Web Speech API for real-time transcription
- **ChatGPT integration** provides AI-powered feedback on pronunciation and accuracy for speaking exercises
- Displays feedback modules, explanation slots, and a progress bar. On completion, the user is redirected home with a toast summary.

### Daily Review (`/review`)
- Uses the `user_item_state` table (SM-2 algorithm fields) to surface items whose `next_due` timestamp is elapsed.
- Summarizes the queue, offers a start button placeholder, and encourages further learning when the queue is empty.

### Profile (`/profile`)
- Shows learner avatar/identity (email), lifetime XP, streak, completed lessons, and placeholders for achievements.
- Pulls aggregate statistics from `user_progress`.

### Admin (`/admin`)
- **Course Manager**: Create and edit language courses
- **Lesson Manager**: Create and edit lessons within courses
- **Exercise Manager**: Create and edit exercises (multiple choice, fill blank, translate, speaking)
- **Exercise Seeder**: Quickly add sample exercises to courses (supports Spanish, French, Hindi) (NEW)
- **Analytics Dashboard**: View user progress, XP trends, and completion statistics

---

## Supabase Data Model
The migration in `supabase/migrations/20251113121117_2c8fc2c2-5253-435f-8f9d-798e36c15ca7.sql` provisions the core schema:

- `profiles`: mirrors `auth.users`, tracks XP, streaks, timestamps.
- `courses`: language pair catalog with title, description, emoji flag.
- `lessons`: ordered lesson metadata tied to courses.
- `items`: exercise prompts with typed content (`multiple_choice`, `fill_blank`, `translate`, etc.), JSON options, audio URLs, explanations.
- `user_item_state`: spaced-repetition metadata (ease factor, interval, repetitions, due dates).
- `exercise_attempts`: per-item attempt history with correctness and score.
- `user_progress`: lesson-level completion records and XP totals.

Every table has row-level security policies restricting access to the owning user where appropriate.

---

## Project Structure

```text
src/
├─ components/
│  ├─ exercises/            # Exercise UIs (multiple choice, fill blank, translation)
│  ├─ ui/                   # shadcn/ui component library
│  └─ ProtectedRoute.tsx    # Auth guard
├─ hooks/                   # Reusable hooks (toast helpers, mobile detection)
├─ integrations/
│  └─ supabase/             # Supabase client (generated)
├─ lib/                     # Utilities (formatters, helpers)
├─ pages/                   # Route-level screens (Auth, Home, Courses, Lessons, etc.)
├─ App.tsx                  # Router setup, providers
└─ main.tsx                 # Vite entry point
```

Supporting config lives at the repository root (`vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `eslint.config.js`, etc.).

---

## Prerequisites
- Node.js ≥ 18 (LTS recommended)
- npm ≥ 9 (or pnpm/bun if preferred)
- Supabase project with:
  - Auth enabled (email/password)
  - Matching SQL schema (apply the migration)
  - Service role or SQL access to seed data (optional for local testing)

---

## Local Development

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Configure environment variables** (see [Environment Configuration](#environment-configuration)).

3. **Run the development server**
   ```sh
   npm run dev
   ```

4. Visit `http://localhost:5173` to explore the app. The Vite dev server auto-reloads on changes.

### Using pnpm or bun
```sh
pnpm install
pnpm dev
# or
bun install
bun run dev
```

---

## Environment Configuration

Create a `.env` file at the repository root (Vite automatically loads `.env`, `.env.local`, etc.). Required variables:

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key |
| `VITE_OPENAI_API_KEY` | OpenAI API key for ChatGPT integration (optional, for AI feedback) |

Optional: Configure additional Supabase or feature flags as needed (e.g., storage buckets, analytics endpoints).

> **Security note:** The publishable key is safe for client distribution, but never commit service-role keys or secrets to the repo.

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run build:dev` | Production build with development mode (useful for staging) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Styling System
- Tailwind CSS utilities with project-specific tokens defined in `tailwind.config.ts`.
- shadcn/ui components live in `src/components/ui` and can be extended with the shadcn CLI (see `components.json`).
- `App.css` and `index.css` host global resets, root variables, and layout utilities.

When creating new UI elements, prefer cloning or extending existing shadcn primitives to retain consistent styling and motion.

---

## Extending the Platform
- **Add exercise types:** Extend `items.type` enum in Supabase, create matching components in `src/components/exercises/`, and render them inside `LessonPlayer`.
- **Track more analytics:** Leverage TanStack Query for new Supabase RPCs, surface results in the Admin area, and visualize with Recharts (already installed).
- **Improve lesson gating:** Replace the placeholder logic in `Lessons.tsx` with progress-based unlocking using `user_progress`.
- **Enhance review sessions:** Build a dedicated flow for reviewing `user_item_state` entries, including rating buttons to update SM-2 fields server-side.
- **Localization:** Tailwind + React supports multi-language UI; consider storing UI strings in JSON or using a library like i18next.

---

## Troubleshooting
- **Authentication loops:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct and that your Supabase project allows email/password sign-ins.
- **CORS or network errors:** Supabase policies must grant read access for public tables (`courses`, `lessons`, `items`). Double-check row-level security policies.
- **Schema drift:** Re-run the migration SQL or use Supabase Studio to confirm table definitions. Missing columns will surface as runtime errors in React Query logs.
- **Styling issues after adding components:** Run `npm run lint` and verify new components use Tailwind classes consistent with the design tokens.

---

Happy building, and enjoy leveling up your language skills with LinguaLearn! 🎓🦉
