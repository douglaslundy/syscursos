import { revalidateTag, unstable_cache } from "next/cache";

import * as repository from "@/server/repositories/student-repository";

// Tag compartilhado por todas as arvores de curso em cache. As edicoes no painel
// sao raras, entao invalidar tudo de uma vez e mais simples e seguro do que
// rastrear o courseId em cada acao administrativa.
export const COURSE_CONTENT_CACHE_TAG = "student-course-content";

// A arvore ativa de modulos/aulas de um curso muda apenas quando o produtor
// edita o curso no painel. Cachear evita reconsultar todos os modulos e aulas
// (cursos grandes chegam a centenas de aulas) a cada troca de aula do aluno.
export function getCachedCourseContent(courseId: string) {
  return unstable_cache(
    () => repository.getCourseWithActiveContent(courseId),
    ["student-course-content", courseId],
    {
      tags: [COURSE_CONTENT_CACHE_TAG, `${COURSE_CONTENT_CACHE_TAG}:${courseId}`],
      revalidate: 300,
    },
  )();
}

export function revalidateCourseContent() {
  revalidateTag(COURSE_CONTENT_CACHE_TAG);
}
