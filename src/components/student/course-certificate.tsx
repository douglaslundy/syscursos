"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { QuizPanel } from "@/components/student/quiz-panel";
import { Modal, buttonClass, primaryClass } from "@/components/student/study-modal";
import type { Quiz } from "@/lib/ai/quiz";
import { issueCertificateAction, loadExamAction, submitExamAction } from "@/server/actions/study-actions";
import type { CertificateState } from "@/server/services/certificate-service";
import type { ExamError } from "@/server/services/exam-service";

const PASS_SCORE = 0.7;

const errorText: Record<ExamError, string> = {
  forbidden: "Voce nao tem acesso a este curso.",
  no_material: "Ainda nao ha aulas com transcricao ou resumo para montar a prova.",
  no_provider: "A inteligencia artificial ainda nao foi configurada pelo administrador.",
  rate_limited: "Muitos pedidos seguidos. Aguarde um minuto e tente de novo.",
  invalid_key: "A chave da inteligencia artificial esta invalida. Avise o administrador.",
  quota: "O limite de uso da inteligencia artificial foi atingido. Tente mais tarde.",
  failed: "Nao foi possivel montar a prova agora. Tente novamente.",
};

export function CourseCertificate({ courseId, state }: { courseId: string; state: CertificateState }) {
  const router = useRouter();
  const [exam, setExam] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openExam() {
    setError(null);
    startTransition(async () => {
      const result = await loadExamAction({ courseId });

      if (result.ok) setExam(result.quiz);
      else setError(errorText[result.error]);
    });
  }

  function issue() {
    setError(null);
    startTransition(async () => {
      const result = await issueCertificateAction({ courseId });

      if (result.ok) router.refresh();
      else setError("Ainda nao e possivel emitir o certificado.");
    });
  }

  return (
    <section className="mt-8 rounded-md border border-stroke-subtle bg-surface p-5" id="certificado">
      <h2 className="text-base font-semibold text-copy-primary md:text-lg">Prova final e certificado</h2>

      {state.status === "locked" ? (
        <p className="mt-2 text-sm text-copy-secondary">
          Conclua todas as aulas ({state.completed}/{state.total}) para liberar a prova final e o certificado.
        </p>
      ) : null}

      {state.status === "needs_exam" ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-copy-secondary">
            Voce concluiu todas as aulas. Para emitir o certificado, tire pelo menos {Math.round(PASS_SCORE * 100)}% na prova final
            {state.bestScore !== null ? ` (sua melhor nota: ${Math.round(state.bestScore * 100)}%)` : ""}.
          </p>
          <button className={primaryClass} disabled={pending} onClick={openExam} type="button">
            {pending ? "Preparando a prova..." : "Fazer a prova final"}
          </button>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-copy-secondary">Parabens! Voce cumpriu todos os requisitos.</p>
          <button className={primaryClass} disabled={pending} onClick={issue} type="button">
            Emitir certificado
          </button>
        </div>
      ) : null}

      {state.status === "issued" ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-copy-secondary">
            Certificado emitido em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(state.issuedAt))}. Codigo: <strong>{state.code}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <a className={primaryClass} href={`/app/courses/${courseId}/certificate`}>
              Baixar certificado (PDF)
            </a>
            <a className={buttonClass} href={`/verificar/${state.code}`} rel="noopener noreferrer" target="_blank">
              Pagina de verificacao
            </a>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {exam ? (
        <Modal
          onClose={() => {
            setExam(null);
            router.refresh();
          }}
          title="Prova final"
        >
          <QuizPanel attempts={[]} passScore={PASS_SCORE} quiz={exam} submit={(answers) => submitExamAction({ courseId, answers })} />
        </Modal>
      ) : null}
    </section>
  );
}
