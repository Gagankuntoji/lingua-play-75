import Papa from "papaparse";
import { z } from "zod";

const courseInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Course title is required"),
  description: z.string().optional(),
  language_from: z.string().min(1, "language_from is required"),
  language_to: z.string().min(1, "language_to is required"),
  flag_emoji: z.string().optional(),
});

const lessonInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, "Lesson title is required"),
    course_ref: z.string().optional(),
    course_title: z.string().optional(),
    order_index: z.coerce.number().optional(),
  })
  .refine(
    (value) => Boolean(value.course_ref || value.course_title),
    "Each lesson needs a course_ref or course_title",
  );

const itemInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    lesson_ref: z.string().optional(),
    lesson_title: z.string().optional(),
    course_ref: z.string().optional(),
    course_title: z.string().optional(),
    question: z.string().min(1, "Question is required"),
    type: z.string().min(1, "Type is required"),
    correct_answer: z.string().min(1, "Correct answer is required"),
    options: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        if (Array.isArray(val)) return val;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.map((entry) => String(entry));
          }
        } catch (error) {
          // ignore JSON parse errors and fall back to splitting
        }
        return val
          .split("|")
          .map((option) => option.trim())
          .filter(Boolean);
      }),
    order_index: z.coerce.number().optional(),
    hint: z.string().optional(),
    explanation: z.string().optional(),
  })
  .refine(
    (value) => Boolean(value.lesson_ref || value.lesson_title),
    "Each item needs a lesson reference",
  );

export type CurriculumCourseInput = z.infer<typeof courseInputSchema>;
export type CurriculumLessonInput = z.infer<typeof lessonInputSchema>;
export type CurriculumItemInput = z.infer<typeof itemInputSchema>;

export interface CurriculumBundle {
  courses: CurriculumCourseInput[];
  lessons: CurriculumLessonInput[];
  items: CurriculumItemInput[];
}

export interface CourseRecord extends Omit<CurriculumCourseInput, "id"> {
  id: string;
  description: string | null;
  flag_emoji: string | null;
}

export interface LessonRecord {
  id: string;
  title: string;
  course_id: string;
  order_index: number;
}

export interface ItemRecord {
  id: string;
  lesson_id: string;
  type: string;
  question: string;
  correct_answer: string;
  options: string[] | null;
  order_index: number;
  hint: string | null;
  explanation: string | null;
}

export interface CurriculumSnapshot {
  courses: CourseRecord[];
  lessons: LessonRecord[];
  items: ItemRecord[];
}

type DiffEntry<T> = {
  before: T;
  after: T;
};

export interface CurriculumDiff {
  courses: {
    created: CourseRecord[];
    updated: DiffEntry<CourseRecord>[];
  };
  lessons: {
    created: LessonRecord[];
    updated: DiffEntry<LessonRecord>[];
  };
  items: {
    created: ItemRecord[];
    updated: DiffEntry<ItemRecord>[];
  };
}

export interface NormalizedCurriculumResult {
  records: CurriculumSnapshot;
  diff: CurriculumDiff;
  warnings: string[];
}

const lessonEntityAliases = new Set(["lesson", "lessons"]);
const courseEntityAliases = new Set(["course", "courses"]);
const itemEntityAliases = new Set(["item", "items", "exercise", "exercises"]);

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const slugify = (value: string) => value.trim().toLowerCase();

const parseOptionsString = (value?: string | null) => {
  if (!value || !value.trim()) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry));
    }
  } catch (error) {
    // ignore JSON parsing errors and fall back to splitting
  }
  return value
    .split("|")
    .map((option) => option.trim())
    .filter(Boolean);
};

interface CsvRow {
  entity?: string;
  type?: string;
  [key: string]: string | undefined;
}

export function parseCurriculumCsv(content: string): CurriculumBundle {
  if (!content.trim()) {
    throw new Error("No CSV content detected.");
  }

  const parsed = Papa.parse<CsvRow>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const firstError = parsed.errors[0];
    throw new Error(
      `CSV parse error on row ${firstError.row ?? "?"}: ${firstError.message}`,
    );
  }

  const bundle: CurriculumBundle = {
    courses: [],
    lessons: [],
    items: [],
  };

  for (const row of parsed.data) {
    if (!row) continue;
    const entity = slugify(String(row.entity ?? row.type ?? "") || "");
    if (!entity) continue;

    if (courseEntityAliases.has(entity)) {
      const result = courseInputSchema.safeParse({
        id: row.id || row.course_id || undefined,
        title: row.title ?? row.course_title,
        description: row.description,
        language_from: row.language_from,
        language_to: row.language_to,
        flag_emoji: row.flag_emoji,
      });
      if (!result.success) {
        throw new Error(`Course row invalid: ${result.error.message}`);
      }
      bundle.courses.push(result.data);
      continue;
    }

    if (lessonEntityAliases.has(entity)) {
      const result = lessonInputSchema.safeParse({
        id: row.id || row.lesson_id || undefined,
        title: row.title ?? row.lesson_title,
        course_ref: row.course_ref,
        course_title: row.course_title ?? row.course,
        order_index: row.order_index,
      });
      if (!result.success) {
        throw new Error(`Lesson row invalid: ${result.error.message}`);
      }
      bundle.lessons.push(result.data);
      continue;
    }

    if (itemEntityAliases.has(entity)) {
      const result = itemInputSchema.safeParse({
        id: row.id || row.item_id || undefined,
        question: row.question,
        type: row.exercise_type ?? row.type,
        correct_answer: row.correct_answer,
        lesson_ref: row.lesson_ref,
        lesson_title: row.lesson_title ?? row.lesson,
        course_ref: row.course_ref,
        course_title: row.course_title ?? row.course,
        options: parseOptionsString(row.options ?? row.choices),
        order_index: row.order_index,
        hint: row.hint,
        explanation: row.explanation,
      });
      if (!result.success) {
        throw new Error(`Item row invalid: ${result.error.message}`);
      }
      bundle.items.push(result.data);
      continue;
    }
  }

  return bundle;
}

const notionSchema = z.object({
  courses: z.array(courseInputSchema).default([]),
  lessons: z.array(lessonInputSchema).default([]),
  items: z.array(itemInputSchema).default([]),
});

export function parseNotionJson(content: string): CurriculumBundle {
  if (!content.trim()) {
    throw new Error("No Notion JSON content detected.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (error) {
    throw new Error("Notion JSON could not be parsed.");
  }

  const result = notionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

const hasCourseChanges = (next: CourseRecord, prev: CourseRecord) => {
  return (
    next.title !== prev.title ||
    (next.description ?? null) !== (prev.description ?? null) ||
    next.language_from !== prev.language_from ||
    next.language_to !== prev.language_to ||
    (next.flag_emoji ?? null) !== (prev.flag_emoji ?? null)
  );
};

const hasLessonChanges = (next: LessonRecord, prev: LessonRecord) => {
  return (
    next.title !== prev.title ||
    next.course_id !== prev.course_id ||
    next.order_index !== prev.order_index
  );
};

const hasItemChanges = (next: ItemRecord, prev: ItemRecord) => {
  const prevOptions = prev.options ?? [];
  const nextOptions = next.options ?? [];
  const optionsChanged =
    prevOptions.length !== nextOptions.length ||
    prevOptions.some((option, index) => option !== nextOptions[index]);

  return (
    next.lesson_id !== prev.lesson_id ||
    next.type !== prev.type ||
    next.question !== prev.question ||
    next.correct_answer !== prev.correct_answer ||
    optionsChanged ||
    (next.hint ?? null) !== (prev.hint ?? null) ||
    (next.explanation ?? null) !== (prev.explanation ?? null) ||
    next.order_index !== prev.order_index
  );
};

export function normalizeCurriculum(
  bundle: CurriculumBundle,
  existing: CurriculumSnapshot,
): NormalizedCurriculumResult {
  const warnings: string[] = [];

  const existingCourseByTitle = new Map(
    existing.courses.map((course) => [slugify(course.title), course]),
  );
  const existingCourseById = new Map(existing.courses.map((course) => [course.id, course]));
  const existingLessonByKey = new Map(
    existing.lessons.map((lesson) => [`${lesson.course_id}::${slugify(lesson.title)}`, lesson]),
  );
  const existingLessonById = new Map(existing.lessons.map((lesson) => [lesson.id, lesson]));
  const existingItemById = new Map(existing.items.map((item) => [item.id, item]));

  const normalizedCourses: CourseRecord[] = bundle.courses.map((course) => {
    const titleKey = slugify(course.title);
    const matching = existingCourseByTitle.get(titleKey);
    const id = course.id ?? matching?.id ?? generateId();
    return {
      id,
      title: course.title,
      description: course.description ?? matching?.description ?? null,
      language_from: course.language_from,
      language_to: course.language_to,
      flag_emoji: course.flag_emoji ?? matching?.flag_emoji ?? null,
    };
  });

  const courseIdByTitle = new Map<string, string>();
  normalizedCourses.forEach((course) => {
    courseIdByTitle.set(slugify(course.title), course.id);
  });
  existing.courses.forEach((course) => {
    if (!courseIdByTitle.has(slugify(course.title))) {
      courseIdByTitle.set(slugify(course.title), course.id);
    }
  });

  const normalizedLessons: LessonRecord[] = bundle.lessons
    .map((lesson) => {
      const courseKey = slugify(lesson.course_ref ?? lesson.course_title ?? "");
      if (!courseKey) {
        warnings.push(`Lesson "${lesson.title}" is missing a course reference and was skipped.`);
        return null;
      }
      const courseId = courseIdByTitle.get(courseKey);
      if (!courseId) {
        warnings.push(
          `Lesson "${lesson.title}" references unknown course "${lesson.course_ref ?? lesson.course_title}".`,
        );
        return null;
      }
      const existingLesson = existingLessonByKey.get(`${courseId}::${slugify(lesson.title)}`);
      const id = lesson.id ?? existingLesson?.id ?? generateId();
      return {
        id,
        title: lesson.title,
        course_id: courseId,
        order_index: lesson.order_index ?? existingLesson?.order_index ?? 1,
      };
    })
    .filter((lesson): lesson is LessonRecord => Boolean(lesson));

  const lessonKeyToId = new Map<string, string>();
  normalizedLessons.forEach((lesson) => {
    const courseId = lesson.course_id;
    lessonKeyToId.set(`${courseId}::${slugify(lesson.title)}`, lesson.id);
  });
  existing.lessons.forEach((lesson) => {
    const key = `${lesson.course_id}::${slugify(lesson.title)}`;
    if (!lessonKeyToId.has(key)) {
      lessonKeyToId.set(key, lesson.id);
    }
  });

  const normalizedItems: ItemRecord[] = bundle.items
    .map((item) => {
      const courseKey = slugify(item.course_ref ?? item.course_title ?? "");
      const lessonKey = slugify(item.lesson_ref ?? item.lesson_title ?? "");
      if (!lessonKey) {
        warnings.push(`Exercise "${item.question}" is missing a lesson reference and was skipped.`);
        return null;
      }

      let lessonId: string | undefined;
      if (courseKey) {
        const courseId = courseIdByTitle.get(courseKey);
        if (courseId) {
          lessonId = lessonKeyToId.get(`${courseId}::${lessonKey}`);
        } else {
          warnings.push(
            `Exercise "${item.question}" references unknown course "${item.course_title ?? item.course_ref}".`,
          );
          return null;
        }
      } else {
        // try any course match
        for (const [key, id] of lessonKeyToId.entries()) {
          if (key.endsWith(`::${lessonKey}`)) {
            lessonId = id;
            break;
          }
        }
      }

      if (!lessonId) {
        warnings.push(
          `Exercise "${item.question}" references unknown lesson "${item.lesson_title ?? item.lesson_ref}".`,
        );
        return null;
      }

      const existingItem =
        Array.from(existing.items).find(
          (existingRecord) =>
            existingRecord.lesson_id === lessonId && existingRecord.question === item.question,
        ) ?? existingItemById.get(item.id ?? "");

      const id = item.id ?? existingItem?.id ?? generateId();

      return {
        id,
        lesson_id: lessonId,
        type: item.type,
        question: item.question,
        correct_answer: item.correct_answer,
        options: item.options ?? existingItem?.options ?? null,
        order_index: item.order_index ?? existingItem?.order_index ?? 1,
        hint: item.hint ?? existingItem?.hint ?? null,
        explanation: item.explanation ?? existingItem?.explanation ?? null,
      };
    })
    .filter((item): item is ItemRecord => Boolean(item));

  const diff: CurriculumDiff = {
    courses: { created: [], updated: [] },
    lessons: { created: [], updated: [] },
    items: { created: [], updated: [] },
  };

  const categorize = <T extends { id: string }>(
    record: T,
    map: Map<string, T>,
    bucket: { created: T[]; updated: DiffEntry<T>[] },
    hasChangesFn: (next: T, prev: T) => boolean,
  ) => {
    const prev = map.get(record.id);
    if (!prev) {
      bucket.created.push(record);
    } else if (hasChangesFn(record, prev)) {
      bucket.updated.push({ before: prev, after: record });
    }
  };

  normalizedCourses.forEach((course) =>
    categorize(course, existingCourseById, diff.courses, hasCourseChanges),
  );
  normalizedLessons.forEach((lesson) =>
    categorize(lesson, existingLessonById, diff.lessons, hasLessonChanges),
  );
  normalizedItems.forEach((item) => categorize(item, existingItemById, diff.items, hasItemChanges));

  return {
    records: {
      courses: normalizedCourses,
      lessons: normalizedLessons,
      items: normalizedItems,
    },
    diff,
    warnings,
  };
}

export function exportCurriculumToJson(snapshot: CurriculumSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function exportCurriculumToCsv(snapshot: CurriculumSnapshot): string {
  const courseTitleById = new Map(snapshot.courses.map((course) => [course.id, course.title]));
  const rows: Record<string, string | number | null>[] = [];

  snapshot.courses.forEach((course) => {
    rows.push({
      entity: "course",
      id: course.id,
      title: course.title,
      description: course.description ?? "",
      language_from: course.language_from,
      language_to: course.language_to,
      flag_emoji: course.flag_emoji ?? "",
    });
  });

  snapshot.lessons.forEach((lesson) => {
    rows.push({
      entity: "lesson",
      id: lesson.id,
      title: lesson.title,
      course_id: lesson.course_id,
      course_title: courseTitleById.get(lesson.course_id) ?? "",
      order_index: lesson.order_index,
    });
  });

  const lessonTitleById = new Map(snapshot.lessons.map((lesson) => [lesson.id, lesson.title]));
  const lessonCourseMap = new Map(snapshot.lessons.map((lesson) => [lesson.id, lesson.course_id]));

  snapshot.items.forEach((item) => {
    const courseId = lessonCourseMap.get(item.lesson_id) ?? "";
    const courseTitle = courseTitleById.get(courseId) ?? "";
    rows.push({
      entity: "item",
      id: item.id,
      lesson_id: item.lesson_id,
      lesson_title: lessonTitleById.get(item.lesson_id) ?? "",
      course_title: courseTitle,
      type: item.type,
      question: item.question,
      correct_answer: item.correct_answer,
      options: item.options ? JSON.stringify(item.options) : "",
      order_index: item.order_index,
      hint: item.hint ?? "",
      explanation: item.explanation ?? "",
    });
  });

  return Papa.unparse(rows, { quotes: true });
}

