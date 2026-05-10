import { requireAnyRole, requireRole } from "@/server/auth/guards";
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
  StudentEmailLookupInput,
  StudentInput,
  StudentLinkInput,
} from "@/server/validators/admin";

export async function getAdminDashboard() {
  const admin = await requireAdminOrProducer();
  const filters = {
    producerId: null,
    studentId: null,
  };
  const [stats, studentConsumption] = await Promise.all([
    repository.getAdminDashboardStats(admin.organizationId, admin.id, admin.role, filters),
    repository.getAdminConsumptionMetrics(admin.organizationId, admin.id, admin.role, filters),
  ]);
  return {
    ...stats,
    studentConsumption,
  };
}

export async function getAdminDashboardByFilters(filters: { producerId?: string | null; studentId?: string | null }) {
  const admin = await requireAdminOrProducer();
  const [stats, studentConsumption] = await Promise.all([
    repository.getAdminDashboardStats(admin.organizationId, admin.id, admin.role, filters),
    repository.getAdminConsumptionMetrics(admin.organizationId, admin.id, admin.role, filters),
  ]);
  return {
    ...stats,
    studentConsumption,
  };
}

export async function getProducerFilterOptions() {
  const admin = await requireAdmin();
  return repository.listProducerOptions(admin.organizationId);
}

export async function getCourses(input: PaginationInput) {
  const producer = await requireProducer();
  return repository.listCourses(producer.organizationId, producer.id, producer.role, input);
}

export async function getCourseOptions() {
  const producer = await requireProducer();
  return repository.listCourseOptions(producer.organizationId, producer.id, producer.role);
}

export async function saveCourse(input: CourseInput) {
  const producer = await requireProducer();
  return repository.upsertCourse(producer.organizationId, producer.id, producer.role, input);
}

export async function removeCourse(id: string) {
  const producer = await requireProducer();
  return repository.deleteCourse(producer.organizationId, producer.id, producer.role, id);
}

export async function getModules(courseId: string, input: PaginationInput) {
  const producer = await requireProducer();
  return repository.listModules(producer.organizationId, producer.id, producer.role, courseId, input);
}

export async function getModuleForEdit(courseId: string, moduleId: string) {
  const producer = await requireProducer();
  return repository.findModuleById(
    producer.organizationId,
    producer.id,
    producer.role,
    courseId,
    moduleId,
  );
}

export async function saveModule(input: ModuleInput) {
  const producer = await requireProducer();
  return repository.upsertModule(producer.organizationId, producer.id, producer.role, input);
}

export async function removeModule(id: string) {
  const producer = await requireProducer();
  return repository.deleteModule(producer.organizationId, producer.id, producer.role, id);
}

export async function getLessons(moduleId: string, input: PaginationInput) {
  const producer = await requireProducer();
  return repository.listLessons(producer.organizationId, producer.id, producer.role, moduleId, input);
}

export async function saveLesson(input: LessonInput) {
  const producer = await requireProducer();
  return repository.upsertLesson(producer.organizationId, producer.id, producer.role, input);
}

export async function removeLesson(id: string) {
  const producer = await requireProducer();
  return repository.deleteLesson(producer.organizationId, producer.id, producer.role, id);
}

export async function getStudents(input: PaginationInput) {
  const admin = await requireAdminOrProducer();
  return repository.listStudents(admin.organizationId, admin.id, admin.role, input);
}

export async function getStudentForEdit(userId: string) {
  const admin = await requireAdminOrProducer();
  return repository.findStudentByUserId(admin.organizationId, admin.id, admin.role, userId);
}

export async function getStudentOptions() {
  const admin = await requireAdminOrProducer();
  return repository.listStudentOptions(admin.organizationId, admin.id, admin.role);
}

export async function saveStudent(input: StudentInput) {
  const admin = await requireAdminOrProducer();
  return repository.upsertStudent(admin.organizationId, admin.id, admin.role, input);
}

export async function lookupStudentByEmail(input: StudentEmailLookupInput) {
  const producer = await requireProducer();
  return repository.findStudentByEmailForProducer(producer.organizationId, producer.id, producer.role, input.email);
}

export async function linkStudentToProducer(input: StudentLinkInput) {
  const producer = await requireProducer();
  return repository.linkStudentToProducer(producer.organizationId, producer.id, producer.role, input.studentProfileId);
}

export async function removeStudent(id: string) {
  const admin = await requireAdminOrProducer();
  return repository.deleteStudent(admin.organizationId, admin.id, admin.role, id);
}

export async function getEnrollments(input: PaginationInput) {
  const admin = await requireAdminOrProducer();
  return repository.listEnrollments(admin.organizationId, admin.id, admin.role, input);
}

export async function saveEnrollment(input: EnrollmentInput) {
  const admin = await requireAdminOrProducer();
  return repository.upsertEnrollment(admin.organizationId, admin.id, admin.role, input);
}

export async function renewEnrollment(input: RenewEnrollmentInput) {
  const admin = await requireAdminOrProducer();
  return repository.renewEnrollment(admin.organizationId, admin.id, admin.role, input);
}

export async function cancelEnrollment(id: string) {
  const admin = await requireAdminOrProducer();
  return repository.cancelEnrollment(admin.organizationId, admin.id, admin.role, id);
}

export async function getCoursesByStudent(studentId: string, input: PaginationInput) {
  const admin = await requireAdminOrProducer();
  return repository.listCoursesByStudent(admin.organizationId, admin.id, admin.role, studentId, input);
}

export async function getStudentsByCourse(courseId: string, input: PaginationInput) {
  const admin = await requireAdminOrProducer();
  return repository.listStudentsByCourse(admin.organizationId, admin.id, admin.role, courseId, input);
}

export async function saveManagedUser(input: ManagedUserInput) {
  const admin = await requireAdmin();
  if (input.role !== "PRODUCER") {
    throw new Error("Somente produtores podem ser cadastrados neste modulo.");
  }
  return repository.upsertManagedUser(admin.organizationId, admin.id, admin.role, input);
}

export async function updateOwnAdminProfile(input: AdminProfileInput) {
  const admin = await requireAdminOrProducer();
  return repository.updateAdminProfile(
    admin.organizationId,
    admin.id,
    input.name,
    admin.role,
    input.password,
  );
}

async function requireAdmin() {
  return requireRole("ADMIN") as Promise<Awaited<ReturnType<typeof requireRole>> & { role: "ADMIN" }>;
}

async function requireAdminOrProducer() {
  return requireAnyRole(["ADMIN", "PRODUCER"]) as Promise<
    Awaited<ReturnType<typeof requireRole>> & { role: "ADMIN" | "PRODUCER" }
  >;
}

async function requireProducer() {
  return requireRole("PRODUCER") as Promise<Awaited<ReturnType<typeof requireRole>> & { role: "PRODUCER" }>;
}
