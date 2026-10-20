import { LESSON_PDF_KINDS, buildLessonPdf, type LessonPdfKind } from "@/server/services/lesson-pdf-service";
import { requireRole } from "@/server/auth/guards";
import { studentLessonParamsSchema } from "@/server/validators/student";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { courseId: string; lessonId: string; kind: string } };

export async function GET(request: Request, { params }: RouteContext) {
  await requireRole("STUDENT");

  const ids = studentLessonParamsSchema.safeParse(params);
  const kind = LESSON_PDF_KINDS.find((item) => item === params.kind) as LessonPdfKind | undefined;

  if (!ids.success || !kind) return new Response("Not found", { status: 404 });

  const technique = new URL(request.url).searchParams.get("technique") ?? undefined;
  const pdf = await buildLessonPdf({ ...ids.data, kind, technique });

  if (!pdf) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(pdf.bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${pdf.name}"`,
      "cache-control": "private, no-store",
    },
  });
}
