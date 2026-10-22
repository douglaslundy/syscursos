import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { listQuizCourses } from "@/server/services/course-quiz-service";

export default async function QuizPage() {
  const courses = await listQuizCourses();

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Quiz</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Quiz por curso</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Escolha um curso para responder as perguntas dos quizzes das aulas. Os quizzes gerados por qualquer aluno do
          curso ficam disponiveis para todos.
        </p>
      </div>
      {courses.length === 0 ? (
        <EmptyState
          action={
            <Link className="text-sm font-medium text-primary" href="/app">
              Ir para meus cursos
            </Link>
          }
          description="Gere o quiz de uma aula (em Estudar com inteligencia artificial) para ele aparecer aqui."
          title="Nenhum quiz disponivel ainda"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {courses.map((course) => (
            <li key={course.courseId}>
              <Link
                className="block rounded-md border border-stroke-subtle bg-surface p-4 transition hover:border-brand-primary/60 hover:bg-surface-hover"
                href={`/app/quiz/${course.courseId}`}
              >
                <p className="text-base font-semibold text-copy-primary">{course.title}</p>
                <p className="mt-1 text-xs text-copy-secondary">
                  {course.questions} perguntas em {course.lessons} {course.lessons === 1 ? "aula" : "aulas"}
                </p>
                <p className="mt-1 text-xs text-copy-muted">
                  {course.attempts > 0
                    ? `${course.attempts} ${course.attempts === 1 ? "tentativa" : "tentativas"} - melhor nota ${course.bestPercent}%`
                    : "Voce ainda nao respondeu"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
