import Link from "next/link";

import { SubmitButton } from "@/components/admin/submit-button";
import { answerQuestionAction } from "@/server/actions/question-actions";
import { listQuestionsForStaff } from "@/server/services/question-service";

type QuestionsPageProps = { searchParams?: Record<string, string | string[] | undefined> };

const date = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export default async function QuestionsPage(props: { searchParams: Promise<QuestionsPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const all = searchParams?.filter === "all";
  const questions = await listQuestionsForStaff(!all);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Duvidas dos alunos</h2>
          <p className="text-sm text-muted-foreground">Responda as duvidas feitas nas aulas dos seus cursos. A resposta aparece para todos os alunos da aula.</p>
        </div>
        <Link className="rounded-md border px-3 py-2 text-sm font-medium" href={all ? "/admin/questions" : "/admin/questions?filter=all"}>
          {all ? "Ver so pendentes" : "Ver todas"}
        </Link>
      </div>
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{all ? "Nenhuma duvida ainda." : "Nenhuma duvida pendente."}</p>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <article className="rounded-md border bg-background p-4" key={question.id}>
              <p className="text-xs text-muted-foreground">
                {question.courseTitle} / {question.lessonTitle} - {question.studentName} - {date(question.createdAt)}
              </p>
              <p className="mt-2 text-sm">{question.body}</p>
              {question.answer ? <p className="mt-2 border-l-2 pl-3 text-sm text-muted-foreground">{question.answer}</p> : null}
              <form action={answerQuestionAction} className="mt-3 grid gap-2">
                <input name="id" type="hidden" value={question.id} />
                <textarea
                  aria-label="Resposta"
                  className="min-h-20 rounded-md border px-3 py-2 text-sm outline-none"
                  defaultValue={question.answer ?? ""}
                  maxLength={4000}
                  name="answer"
                  placeholder="Escreva a resposta"
                  required
                />
                <div>
                  <SubmitButton>{question.answer ? "Atualizar resposta" : "Responder"}</SubmitButton>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
