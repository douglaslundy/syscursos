import { requireRole } from "@/server/auth/guards";
import * as repository from "@/server/repositories/admin-repository";
import type { PaginationInput } from "@/server/validators/pagination";
import type {
  AdminProfileInput,
  CourseInput,
  EnrollmentInput,
  LessonInput,
  ManagedUserInput,
  ModuleInput,
  RenewEnrollmentInput,
  StudentInput,
} from "@/server/validators/admin";

export async function getAdminDashboard() {
  const admin = await requireAdmin();
  const [stats, studentConsumption] = await Promise.all([
    repository.getAdminDashboardStats(admin.organizationId),
    repository.getAdminConsumptionMetrics(admin.organizationId),
  ]);
  return {
    ...stats,
    studentConsumption,
  };
}

export async function getCourses(input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listCourses(admin.organizationId, input);
}

export async function getCourseOptions() {
  const admin = await requireAdmin();
  return repository.listCourseOptions(admin.organizationId);
}

export async function saveCourse(input: CourseInput) {
  const admin = await requireAdmin();
  return repository.upsertCourse(admin.organizationId, input);
}

export async function removeCourse(id: string) {
  const admin = await requireAdmin();
  return repository.deleteCourse(admin.organizationId, id);
}

export async function getModules(courseId: string, input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listModules(admin.organizationId, courseId, input);
}

export async function saveModule(input: ModuleInput) {
  const admin = await requireAdmin();
  return repository.upsertModule(admin.organizationId, input);
}

export async function removeModule(id: string) {
  const admin = await requireAdmin();
  return repository.deleteModule(admin.organizationId, id);
}

export async function getLessons(moduleId: string, input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listLessons(admin.organizationId, moduleId, input);
}

export async function saveLesson(input: LessonInput) {
  const admin = await requireAdmin();
  return repository.upsertLesson(admin.organizationId, input);
}

export async function removeLesson(id: string) {
  const admin = await requireAdmin();
  return repository.deleteLesson(admin.organizationId, id);
}

export async function getStudents(input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listStudents(admin.organizationId, input);
}

export async function getStudentOptions() {
  const admin = await requireAdmin();
  return repository.listStudentOptions(admin.organizationId);
}

export async function saveStudent(input: StudentInput) {
  const admin = await requireAdmin();
  return repository.upsertStudent(admin.organizationId, input);
}

export async function removeStudent(id: string) {
  const admin = await requireAdmin();
  return repository.deleteStudent(admin.organizationId, id);
}

export async function getEnrollments(input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listEnrollments(admin.organizationId, input);
}

export async function saveEnrollment(input: EnrollmentInput) {
  const admin = await requireAdmin();
  return repository.upsertEnrollment(admin.organizationId, input);
}

export async function renewEnrollment(input: RenewEnrollmentInput) {
  const admin = await requireAdmin();
  return repository.renewEnrollment(admin.organizationId, input);
}

export async function cancelEnrollment(id: string) {
  const admin = await requireAdmin();
  return repository.cancelEnrollment(admin.organizationId, id);
}

export async function getCoursesByStudent(studentId: string, input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listCoursesByStudent(admin.organizationId, studentId, input);
}

export async function getStudentsByCourse(courseId: string, input: PaginationInput) {
  const admin = await requireAdmin();
  return repository.listStudentsByCourse(admin.organizationId, courseId, input);
}

export async function saveManagedUser(input: ManagedUserInput) {
  const admin = await requireAdmin();
  return repository.upsertManagedUser(admin.organizationId, input);
}

export async function updateOwnAdminProfile(input: AdminProfileInput) {
  const admin = await requireAdmin();
  return repository.updateAdminProfile(admin.organizationId, admin.id, input.name);
}

async function requireAdmin() {
  return requireRole("ADMIN");
}
