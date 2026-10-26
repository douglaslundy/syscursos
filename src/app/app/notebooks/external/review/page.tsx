import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { ReviewSession } from "@/components/student/review-session";
import { shuffle } from "@/lib/study/quiz-pick";
import { getExternalReviewQueue } from "@/server/services/external-notebook-service";

export default async function ExternalReviewPage() {
  const queue = await getExternalReviewQueue();
  const cards = [...queue.due, ...queue.fresh];

  return (
    <section>
      <div className="mb-8">
        <Link className="text-sm text-muted-foreground transition hover:text-foreground" href="/app/notebooks/external">
          Voltar aos cursos externos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Revisao dos cadernos externos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {queue.dueTotal} cartoes para revisar hoje e ate 10 novos, vindos de flashcards e quizzes das suas aulas externas.
        </p>
      </div>
      {cards.length === 0 ? (
        <EmptyState description="Gere flashcards ou um quiz em uma aula externa para montar a fila de revisao." title="Nada para revisar agora" />
      ) : (
        <ReviewSession cards={shuffle(cards)} external />
      )}
    </section>
  );
}
