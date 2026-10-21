"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Quiz } from "@/lib/ai/quiz";
import { issueCertificate } from "@/server/services/certificate-service";
import { ensureCourseExam, submitExam, type ExamError } from "@/server/services/exam-service";
import { addBookmark, removeBookmark, savePosition } from "@/server/services/bookmark-service";
import { reviewCard } from "@/server/services/review-service";
import { submitQuiz, type QuizSubmitResult } from "@/server/services/quiz-service";
import { recordStudyTime, saveWeeklyGoal } from "@/server/services/study-stats-service";

const quizSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(40),
});

export async function submitQuizAction(input: z.infer<typeof quizSchema>): Promise<QuizSubmitResult> {
  const parsed = quizSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid" };

  const result = await submitQuiz(parsed.data);

  if (result.ok) revalidatePath("/app/review");

  return result;
}

const reviewSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  cardKey: z.string().min(1).max(64),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

export async function reviewCardAction(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) return null;

  return reviewCard(parsed.data);
}

const timeSchema = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), seconds: z.number().min(1).max(600) });

// Batimento de tempo de estudo enviado pela pagina da aula enquanto ela esta visivel.
export async function recordStudyTimeAction(input: z.infer<typeof timeSchema>) {
  const parsed = timeSchema.safeParse(input);

  return parsed.success ? recordStudyTime(parsed.data) : false;
}

export async function saveWeeklyGoalAction(formData: FormData) {
  const minutes = Number(formData.get("minutes"));

  if (Number.isFinite(minutes)) {
    await saveWeeklyGoal(minutes);
    revalidatePath("/app/progress");
  }
}

const bookmarkSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  seconds: z.number().min(0).max(24 * 3600),
  label: z.string().trim().min(1).max(200),
});

export async function addBookmarkAction(input: z.infer<typeof bookmarkSchema>) {
  const parsed = bookmarkSchema.safeParse(input);

  return parsed.success ? addBookmark(parsed.data) : ({ ok: false, error: "invalid" } as const);
}

export async function removeBookmarkAction(id: string) {
  const parsed = z.string().uuid().safeParse(id);

  return parsed.success ? removeBookmark(parsed.data) : false;
}

const positionSchema = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), seconds: z.number().min(0).max(24 * 3600) });

export async function savePositionAction(input: z.infer<typeof positionSchema>) {
  const parsed = positionSchema.safeParse(input);

  return parsed.success ? savePosition(parsed.data) : false;
}

const examIdSchema = z.object({ courseId: z.string().uuid() });

// Gera (uma unica vez) ou devolve a prova final do curso, compartilhada por todos os alunos.
export async function loadExamAction(input: z.infer<typeof examIdSchema>): Promise<{ ok: true; quiz: Quiz } | { ok: false; error: ExamError }> {
  const parsed = examIdSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "forbidden" };

  const result = await ensureCourseExam(parsed.data.courseId);

  return result.ok ? { ok: true, quiz: result.quiz } : result;
}

export async function submitExamAction(input: z.infer<typeof examIdSchema> & { answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const parsed = examIdSchema.extend({ answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(60) }).safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid" };

  const result = await submitExam(parsed.data);

  if (result.ok) revalidatePath(`/app/courses/${parsed.data.courseId}`);

  return result;
}

export async function issueCertificateAction(input: z.infer<typeof examIdSchema>) {
  const parsed = examIdSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "forbidden" } as const;

  const result = await issueCertificate(parsed.data.courseId);

  if (result.ok) revalidatePath(`/app/courses/${parsed.data.courseId}`);

  return result;
}
