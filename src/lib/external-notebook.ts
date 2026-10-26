import { z } from "zod";

// Limite por campo de texto (~150 mil caracteres, bem acima de uma aula longa) para nao estourar o contexto da IA.
export const MAX_EXTERNAL_TEXT = 150_000;

export const notebookInputSchema = z.object({ title: z.string().trim().min(2, "Informe o nome do curso.").max(150) });

const optionalText = z
  .string()
  .max(MAX_EXTERNAL_TEXT, "Texto muito longo.")
  .transform((value) => value.trim() || null)
  .nullish()
  .transform((value) => value ?? null);

// Transcricao OU resumo: ao menos um precisa ter texto.
export const lessonInputSchema = z
  .object({ title: z.string().trim().min(2, "Informe o titulo da aula.").max(200), transcript: optionalText, summary: optionalText })
  .refine((value) => value.transcript !== null || value.summary !== null, { message: "Informe a transcricao ou o resumo.", path: ["transcript"] });

export type ExternalLessonInput = z.infer<typeof lessonInputSchema>;

// Fonte da IA: transcricao; sem ela, o resumo gravado.
export const lessonSourceText = (lesson: { transcript: string | null; summary: string | null }) => lesson.transcript ?? lesson.summary ?? "";
