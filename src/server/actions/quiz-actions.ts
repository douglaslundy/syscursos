"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { MAX_QUIZ_QUESTIONS } from "@/lib/study/quiz-pick";
import { startCourseDeck, startCourseQuiz, submitCourseQuiz, type StartCourseDeckResult, type StartCourseQuizResult } from "@/server/services/course-quiz-service";
import type { QuizSubmitResult } from "@/server/services/quiz-service";

// courseId ausente = todos os cursos do aluno, misturados.
const startSchema = z.object({ courseId: z.string().uuid().optional(), count: z.number().int().min(1).max(MAX_QUIZ_QUESTIONS) });
const submitSchema = z.object({
  refs: z.array(z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), key: z.string().min(1).max(64) })).min(1).max(MAX_QUIZ_QUESTIONS),
  answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(MAX_QUIZ_QUESTIONS),
});

export async function startCourseQuizAction(input: z.infer<typeof startSchema>): Promise<StartCourseQuizResult> {
  const parsed = startSchema.safeParse(input);

  return parsed.success ? startCourseQuiz(parsed.data.courseId ?? null, parsed.data.count) : { ok: false, error: "no_quiz" };
}

export async function startCourseDeckAction(input: z.infer<typeof startSchema>): Promise<StartCourseDeckResult> {
  const parsed = startSchema.safeParse(input);

  return parsed.success ? startCourseDeck(parsed.data.courseId ?? null, parsed.data.count) : { ok: false, error: "no_quiz" };
}

export async function submitCourseQuizAction(input: z.infer<typeof submitSchema>): Promise<QuizSubmitResult> {
  const parsed = submitSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid" };

  const result = await submitCourseQuiz(parsed.data);

  if (result.ok) {
    revalidatePath("/app/quiz");
    revalidatePath("/app/review");
  }

  return result;
}

// Os quizzes sao lidos do banco a cada acesso; isto descarta o cache das paginas para trazer o que outros alunos geraram agora.
export async function refreshCourseQuizAction(courseId?: string) {
  revalidatePath("/app/quiz");

  if (courseId && z.string().uuid().safeParse(courseId).success) revalidatePath(`/app/quiz/${courseId}`);
}
