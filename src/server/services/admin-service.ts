import { requireRole } from "@/server/auth/guards";
import * as repository from "@/server/repositories/admin-repository";
import type { PaginationInput } from "@/server/validators/pagination";
import type {
  CourseInput,
  EnrollmentInput,
  LessonInput,
  ModuleInput,
  RenewEnrollmentInput,
  StudentInput,
} from "@/server/validators/admin";

export async function getAdminDashboard() {
  await requireAdmin();
  return repository.getAdminDashboardStats();
}

export async function getCourses(input: PaginationInput) {
  await requireAdmin();
  return repository.listCourses(input);
}

export async function getCourseOptions() {
  await requireAdmin();
  return repository.listCourseOptions();
}

export async function saveCourse(input: CourseInput) {
  await requireAdmin();
  return repository.upsertCourse(input);
}

export async function removeCourse(id: string) {
  await requireAdmin();
  return repository.deleteCourse(id);
}

export async function getModules(courseId: string, input: PaginationInput) {
  await requireAdmin();
  return repository.listModules(courseId, input);
}

export async function saveModule(input: ModuleInput) {
  await requireAdmin();
  return repository.upsertModule(input);
}

export async function removeModule(id: string) {
  await requireAdmin();
  return repository.deleteModule(id);
}

export async function getLessons(moduleId: string, input: PaginationInput) {
  await requireAdmin();
  return repository.listLessons(moduleId, input);
}

export async function saveLesson(input: LessonInput) {
  await requireAdmin();
  return repository.upsertLesson(input);
}

export async function removeLesson(id: string) {
  await requireAdmin();
  return repository.deleteLesson(id);
}

export async function getStudents(input: PaginationInput) {
  await requireAdmin();
  return repository.listStudents(input);
}

export async function getStudentOptions() {
  await requireAdmin();
  return repository.listStudentOptions();
}

export async function saveStudent(input: StudentInput) {
  await requireAdmin();
  return repository.upsertStudent(input);
}

export async function removeStudent(id: string) {
  await requireAdmin();
  return repository.deleteStudent(id);
}

export async function getEnrollments(input: PaginationInput) {
  await requireAdmin();
  return repository.listEnrollments(input);
}

export async function saveEnrollment(input: EnrollmentInput) {
  await requireAdmin();
  return repository.upsertEnrollment(input);
}

export async function renewEnrollment(input: RenewEnrollmentInput) {
  await requireAdmin();
  return repository.renewEnrollment(input);
}

export async function cancelEnrollment(id: string) {
  await requireAdmin();
  return repository.cancelEnrollment(id);
}

export async function getCoursesByStudent(studentId: string, input: PaginationInput) {
  await requireAdmin();
  return repository.listCoursesByStudent(studentId, input);
}

export async function getStudentsByCourse(courseId: string, input: PaginationInput) {
  await requireAdmin();
  return repository.listStudentsByCourse(courseId, input);
}

async function requireAdmin() {
  return requireRole("ADMIN");
}
