import * as repository from "@/server/repositories/student-repository";
import { getCourseAccessStatus } from "@/server/services/student-service";

// Cursos que o aluno pode estudar agora (matricula ativa, iniciada, nao expirada). Base de busca, revisao, playlists e exportacao.
export async function listAvailableCourses(studentId: string) {
  const enrollments = await repository.listStudentCourseEnrollments(studentId);

  return enrollments
    .filter((enrollment) => getCourseAccessStatus(enrollment) === "AVAILABLE")
    .map((enrollment) => ({ id: enrollment.courseId, title: enrollment.course.title }));
}
