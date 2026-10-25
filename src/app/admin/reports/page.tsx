import Link from "next/link";

import { getInstructorReport } from "@/server/services/report-service";

export default async function ReportsPage() {
  const report = await getInstructorReport();

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Relatorios de aprendizagem</h2>
        <p className="text-sm text-muted-foreground">Onde os alunos travam, o que mais erram nos quizzes e duvidas sem resposta.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Media nos quizzes" value={report.quizAverage === null ? "-" : `${report.quizAverage}%`} hint={`${report.attemptsTotal} tentativas`} />
        <Stat label="Duvidas sem resposta" value={String(report.pendingQuestions)} hint="Dos seus cursos" />
        <Link className="rounded-md border bg-background p-4 text-sm font-medium hover:bg-muted" href="/admin/questions">
          Responder duvidas
        </Link>
      </div>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Aulas com menor conclusao</h3>
        <p className="mb-3 text-sm text-muted-foreground">Alunos que abriram a aula e nao concluiram (minimo de 3 alunos). Considere revisar essas aulas.</p>
        {report.lowCompletion.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Aula</th>
                <th className="py-2 pr-3">Curso</th>
                <th className="py-2 pr-3">Abriram</th>
                <th className="py-2 pr-3">Concluiram</th>
                <th className="py-2">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {report.lowCompletion.map((row) => (
                <tr className="border-b" key={row.lessonId}>
                  <td className="py-2 pr-3">{row.title}</td>
                  <td className="py-2 pr-3">{row.courseTitle}</td>
                  <td className="py-2 pr-3">{row.visited}</td>
                  <td className="py-2 pr-3">{row.completed}</td>
                  <td className="py-2">{row.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Questoes mais erradas</h3>
        <p className="mb-3 text-sm text-muted-foreground">Conteudos que os alunos mais erram nos quizzes (minimo de 3 respostas).</p>
        {report.missed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
        ) : (
          <ul className="space-y-3">
            {report.missed.map((item, index) => (
              <li className="text-sm" key={index}>
                <p className="font-medium">{item.question}</p>
                <p className="text-xs text-muted-foreground">
                  {item.courseTitle} / {item.lessonTitle} - errada em {item.misses} de {item.attempts} respostas ({Math.round((item.misses / item.attempts) * 100)}%)
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
