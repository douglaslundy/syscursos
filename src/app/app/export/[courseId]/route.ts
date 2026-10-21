import { z } from "zod";

import { requireRole } from "@/server/auth/guards";
import { buildCourseExport } from "@/server/services/export-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({ courseId: z.string().uuid(), format: z.enum(["md", "anki"]) });

// Baixa anotacoes e resumos (Markdown) ou flashcards e quizzes (texto para importar no Anki) de um curso.
export async function GET(request: Request, context: { params: Promise<{ courseId: string }> }) {
  await requireRole("STUDENT");

  const { courseId } = await context.params;
  const parsed = querySchema.safeParse({ courseId, format: new URL(request.url).searchParams.get("format") });

  if (!parsed.success) return new Response("Not found", { status: 404 });

  const file = await buildCourseExport(parsed.data.courseId, parsed.data.format);

  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.body, {
    headers: {
      "content-type": file.contentType,
      "content-disposition": `attachment; filename="${file.name}"`,
      "cache-control": "private, no-store",
    },
  });
}
