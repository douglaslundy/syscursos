import { requireRole } from "@/server/auth/guards";
import { buildCertificatePdf } from "@/server/services/certificate-service";
import { studentCourseParamsSchema } from "@/server/validators/student";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// PDF do certificado ja emitido para o aluno logado.
export async function GET(request: Request, context: { params: Promise<{ courseId: string }> }) {
  await requireRole("STUDENT");

  const ids = studentCourseParamsSchema.safeParse(await context.params);

  if (!ids.success) return new Response("Not found", { status: 404 });

  const pdf = await buildCertificatePdf(ids.data.courseId, new URL(request.url).origin);

  if (!pdf) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(pdf.bytes), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${pdf.name}"`, "cache-control": "private, no-store" },
  });
}
