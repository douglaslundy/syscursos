import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { ReviewByCourse } from "@/components/student/review-by-course";
import { ReviewSession } from "@/components/student/review-session";
import { ViewFilter } from "@/components/student/view-filter";
import { groupByCourse, parseReviewView } from "@/lib/study/review-view";
import { shuffle } from "@/lib/study/quiz-pick";
import { getReviewQueue } from "@/server/services/review-service";

export default async function ReviewPage(props: { searchParams: Promise<Record<string, string | string[] | undefined> | undefined> }) {
  const searchParams = await props.searchParams;
  const view = parseReviewView(searchParams?.view);
  const queue = await getReviewQueue();
  const cards = [...queue.due, ...queue.fresh];

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Repeticao espacada</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Revisao do dia</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {queue.dueTotal} cartoes para revisar hoje e ate 10 cartoes novos das aulas que voce concluiu. Quanto melhor
          a nota, mais tempo ate o cartao voltar.
        </p>
      </div>
      {cards.length === 0 ? (
        <EmptyState
          action={
            <Link className="text-sm font-medium text-primary" href="/app">
              Ir para meus cursos
            </Link>
          }
          description="Conclua aulas e gere flashcards ou quizzes para montar a sua fila de revisao."
          title="Nada para revisar agora"
        />
      ) : (
        <>
          <ViewFilter basePath="/app/review" view={view} />
          {view === "random" ? <ReviewSession cards={shuffle(cards)} /> : <ReviewByCourse groups={groupByCourse(cards)} />}
        </>
      )}
    </section>
  );
}
