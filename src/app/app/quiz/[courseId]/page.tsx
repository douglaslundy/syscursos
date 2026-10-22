import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CourseQuiz } from "@/components/student/course-quiz";
import { getCourseQuizSummary } from "@/server/services/course-quiz-service";

export default async function CourseQuizPage(props: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await props.params;

  if (!z.string().uuid().safeParse(courseId).success) notFound();

  const course = await getCourseQuizSummary(courseId);

  if (!course) notFound();

  return (
    <section>
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href="/app/quiz">
        Voltar para quizzes
      </Link>
      <div className="mb-6 mt-3">
        <p className="text-sm font-medium text-primary">Quiz</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">{course.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {course.questions} perguntas disponiveis em {course.lessons} {course.lessons === 1 ? "aula" : "aulas"}.{" "}
          {course.attempts > 0 ? `Voce fez ${course.attempts} ${course.attempts === 1 ? "tentativa" : "tentativas"}; melhor nota ${course.bestPercent}%.` : "Voce ainda nao respondeu."}
        </p>
      </div>
      <CourseQuiz courseId={course.courseId} courseTitle={course.title} questions={course.questions} />
    </section>
  );
}
