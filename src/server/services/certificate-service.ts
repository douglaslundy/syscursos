import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { renderCertificatePdf } from "@/server/pdf/render-pdf";
import { getAiAvailability } from "@/server/services/ai/ai-content-service";
import { PASS_SCORE, bestExamScore, getCourseExam } from "@/server/services/exam-service";
import { notifyUser } from "@/server/services/notification-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

// Sem 0/O/1/I para o codigo ser facil de ditar.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const newCertificateCode = () => `SC-${Array.from(randomBytes(10), (byte) => ALPHABET[byte % ALPHABET.length]).join("")}`;

export type CertificateState =
  | { status: "locked"; completed: number; total: number }
  | { status: "needs_exam"; examReady: boolean; bestScore: number | null }
  | { status: "ready" }
  | { status: "issued"; code: string; issuedAt: string };

// Regra: todas as aulas concluidas e, com IA ativa (ou prova ja gerada), nota >= 70% na prova final.
export async function getCertificateState(courseId: string): Promise<CertificateState> {
  const studentId = await requireStudentProfileId();
  const issued = await prisma.certificate.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { code: true, issuedAt: true } });

  if (issued) return { status: "issued", code: issued.code, issuedAt: issued.issuedAt.toISOString() };

  const lessonWhere = { status: "ACTIVE" as const, module: { courseId, status: "ACTIVE" as const } };
  const [total, completed, exam, ai, best] = await Promise.all([
    prisma.lesson.count({ where: lessonWhere }),
    prisma.lessonProgress.count({ where: { studentId, status: "COMPLETED", lesson: lessonWhere } }),
    getCourseExam(courseId),
    getAiAvailability(),
    bestExamScore(studentId, courseId),
  ]);

  if (total === 0 || completed < total) return { status: "locked", completed, total };
  if ((exam || ai.enabled) && (best === null || best < PASS_SCORE)) return { status: "needs_exam", examReady: Boolean(exam), bestScore: best };

  return { status: "ready" };
}

export async function issueCertificate(courseId: string) {
  const studentId = await requireStudentProfileId();
  const available = (await listAvailableCourses(studentId)).find((course) => course.id === courseId);

  if (!available) return { ok: false as const, error: "forbidden" as const };

  const state = await getCertificateState(courseId);

  if (state.status === "issued") return { ok: true as const, code: state.code };
  if (state.status !== "ready") return { ok: false as const, error: "not_eligible" as const };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = newCertificateCode();

    try {
      await prisma.certificate.create({ data: { studentId, courseId, code } });
      const profile = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { userId: true } });

      if (profile) await notifyUser(profile.userId, { kind: "certificate", title: `Certificado de "${available.title}" emitido`, href: `/app/courses/${courseId}` });

      return { ok: true as const, code };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;

      // Codigo repetido ou certificado emitido ao mesmo tempo: se ja existe o do aluno, devolve-o.
      const current = await prisma.certificate.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { code: true } });

      if (current) return { ok: true as const, code: current.code };
    }
  }

  return { ok: false as const, error: "failed" as const };
}

// Pagina publica de verificacao: expoe so o nome do aluno, o curso e a data.
export async function verifyCertificate(code: string) {
  if (!/^SC-[A-Z0-9]{10}$/.test(code)) return null;

  const row = await prisma.certificate.findUnique({
    where: { code },
    select: { issuedAt: true, course: { select: { title: true } }, student: { select: { user: { select: { name: true } } } } },
  });

  return row ? { studentName: row.student.user.name, courseTitle: row.course.title, issuedAt: row.issuedAt.toISOString() } : null;
}

export async function buildCertificatePdf(courseId: string, origin: string) {
  const studentId = await requireStudentProfileId();
  const row = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { code: true, issuedAt: true, course: { select: { title: true } }, student: { select: { user: { select: { name: true } } } } },
  });

  if (!row) return null;

  return {
    name: `certificado-${row.code}.pdf`,
    bytes: renderCertificatePdf({
      studentName: row.student.user.name,
      courseTitle: row.course.title,
      code: row.code,
      issuedAt: row.issuedAt,
      verifyUrl: `${origin}/verificar/${row.code}`,
    }),
  };
}
