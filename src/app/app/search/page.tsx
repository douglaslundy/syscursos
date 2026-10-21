import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/student/empty-state";
import { searchStudy, type SearchHit } from "@/server/services/search-service";

const typeLabel: Record<SearchHit["type"], string> = {
  lesson: "Aula",
  transcript: "Transcricao",
  note: "Anotacao",
  summary: "Resumo",
};

type SearchPageProps = { searchParams?: Record<string, string | string[] | undefined> };

export default async function SearchPage(props: { searchParams: Promise<SearchPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const raw = typeof searchParams?.q === "string" ? searchParams.q : undefined;
  const { query, hits } = await searchStudy(raw);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Busca</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Buscar no que estudo</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Procure em aulas, transcricoes, suas anotacoes e resumos dos cursos que voce pode acessar.
        </p>
      </div>
      <form action="/app/search" className="mb-6 flex gap-3" role="search">
        <span className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Buscar"
            className="min-h-11 w-full rounded-md border pl-9 pr-3 text-sm outline-none"
            defaultValue={query}
            maxLength={80}
            name="q"
            placeholder="Digite pelo menos 2 letras"
            type="search"
          />
        </span>
        <button className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Buscar
        </button>
      </form>
      {query.length < 2 ? null : hits.length === 0 ? (
        <EmptyState description="Tente outras palavras ou menos termos." title="Nada encontrado" />
      ) : (
        <ul className="space-y-3">
          {hits.map((hit, index) => (
            <li key={`${hit.type}-${hit.lessonId}-${index}`}>
              <Link
                className="block rounded-md border border-stroke-subtle bg-surface p-4 transition hover:bg-surface-hover"
                href={`/app/courses/${hit.courseId}/lessons/${hit.lessonId}`}
              >
                <p className="text-xs uppercase tracking-[0.12em] text-copy-muted">
                  {typeLabel[hit.type]} - {hit.courseTitle}
                </p>
                <p className="mt-1 text-sm font-semibold text-copy-primary">{hit.title}</p>
                <p className="mt-1 text-sm text-copy-secondary">{hit.snippet}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
