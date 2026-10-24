import Link from "next/link";

import { requireRole } from "@/server/auth/guards";
import { getAiUsageReport, type UsageRow } from "@/server/services/ai/ai-usage-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const number = new Intl.NumberFormat("pt-BR");
const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const selectClass = "rounded-md border bg-background px-3 py-2 text-sm";

function UsageTable({ title, rows, empty }: { title: string; rows: UsageRow[]; empty: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2 text-right">Chamadas</th>
                <th className="px-3 py-2 text-right">Entrada</th>
                <th className="px-3 py-2 text-right">Saida</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t" key={row.label}>
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2 text-right">{number.format(row.totals.calls)}</td>
                  <td className="px-3 py-2 text-right">{number.format(row.totals.inputTokens)}</td>
                  <td className="px-3 py-2 text-right">{number.format(row.totals.outputTokens)}</td>
                  <td className="px-3 py-2 text-right font-medium">{number.format(row.totals.totalTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AiUsagePage(props: { searchParams: Promise<PageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");
  const filters = {
    month: param(searchParams?.month),
    provider: param(searchParams?.provider),
    courseId: param(searchParams?.courseId),
    studentId: param(searchParams?.studentId),
  };
  const report = await getAiUsageReport(filters);
  const months = report.byMonth.map((row) => row.label);
  // Mantem o mes filtrado na lista mesmo que ele nao tenha consumo com os outros filtros.
  const monthOptions = filters.month && !months.includes(filters.month) ? [filters.month, ...months] : months;

  return (
    <section className="space-y-6">
      <div>
        <Link className="text-sm text-muted-foreground hover:underline" href="/admin/settings/ai">
          Voltar para Inteligencia artificial
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">Consumo de tokens</h2>
        <p className="text-sm text-muted-foreground">
          Cada geracao de resumo, flashcards ou mapa mental registra os tokens de entrada (aula enviada) e de saida
          (texto gerado). O mes segue o horario de Brasilia.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="grid gap-1 text-sm">
          Mes
          <select className={selectClass} defaultValue={filters.month} name="month">
            <option value="">Todos</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          IA
          <select className={selectClass} defaultValue={filters.provider} name="provider">
            <option value="">Todas</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="anthropic">Claude</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Curso
          <select className={selectClass} defaultValue={filters.courseId} name="courseId">
            <option value="">Todos</option>
            {report.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Aluno
          <select className={selectClass} defaultValue={filters.studentId} name="studentId">
            <option value="">Todos</option>
            {report.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Filtrar
        </button>
        <Link className="rounded-md border px-4 py-2 text-sm font-medium" href="/admin/settings/ai-usage">
          Limpar
        </Link>
      </form>

      <dl className="grid gap-3 sm:grid-cols-4">
        {[
          ["Chamadas", report.total.calls],
          ["Tokens de entrada", report.total.inputTokens],
          ["Tokens de saida", report.total.outputTokens],
          ["Total de tokens", report.total.totalTokens],
        ].map(([label, value]) => (
          <div className="rounded-md border bg-background p-4" key={label}>
            <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{number.format(Number(value))}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <UsageTable empty="Nenhum consumo registrado." rows={report.byMonth} title="Por mes (ignora o filtro de mes)" />
        <UsageTable empty="Nenhum consumo neste filtro." rows={report.byProvider} title="Por inteligencia artificial" />
        <UsageTable empty="Nenhum consumo neste filtro." rows={report.byCourse} title="Por curso" />
        <UsageTable empty="Nenhum consumo neste filtro." rows={report.byStudent} title="Por aluno" />
      </div>
    </section>
  );
}
