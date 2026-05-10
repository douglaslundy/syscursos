import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    const error = new Error(`REDIRECT:${url}`) as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;${url}`;
    throw error;
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const saveStudentMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/server/services/admin-service", () => ({
  cancelEnrollment: vi.fn(),
  removeCourse: vi.fn(),
  removeLesson: vi.fn(),
  removeModule: vi.fn(),
  removeStudent: vi.fn(),
  renewEnrollment: vi.fn(),
  saveCourse: vi.fn(),
  saveEnrollment: vi.fn(),
  saveLesson: vi.fn(),
  saveManagedUser: vi.fn(),
  saveModule: vi.fn(),
  saveStudent: saveStudentMock,
  updateOwnAdminProfile: vi.fn(),
}));

describe("admin student actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    saveStudentMock.mockReset();
    saveStudentMock.mockResolvedValue({ linkedExisting: false });
  });

  it("updates a student without changing the password when password is blank", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ password: "" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=saved",
    );

    expect(saveStudentMock).toHaveBeenCalledWith({
      id: "4f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      studentProfileId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      email: "student@example.com",
      name: "Student",
      password: null,
      document: null,
      phone: null,
      status: "ACTIVE",
    });
  });

  it("returns a specific status for an invalid student email", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ email: "invalid-email" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_email",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status when a new student has no initial password", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");
    const formData = studentForm({ password: "" });
    formData.delete("studentUserId");
    formData.delete("studentProfileId");

    await expect(saveStudentAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_missing_password",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status when the optional new password is too short", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ password: "123" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_password",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student user id", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ userId: "invalid-id" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_user_id",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student profile id", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ studentProfileId: "invalid-id" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_profile_id",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student name", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ name: "A" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_name",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student document", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ document: "1".repeat(33) }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_document",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student phone", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ phone: "1".repeat(33) }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_phone",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status for an invalid student status", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");

    await expect(saveStudentAction(studentForm({ status: "BLOCKED" }))).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_invalid_status",
    );
    expect(saveStudentMock).not.toHaveBeenCalled();
  });

  it("returns a specific status when the edited student is not in producer scope", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");
    const { StudentMutationError } = await import("@/server/repositories/admin-repository");
    saveStudentMock.mockRejectedValue(
      new StudentMutationError("student_not_found", "Aluno nao encontrado para este produtor."),
    );

    await expect(saveStudentAction(studentForm())).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_not_found",
    );
  });

  it("redirects with linked_existing when the student is only linked to the producer", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");
    const formData = studentForm({ password: "password123" });
    formData.delete("studentUserId");
    formData.delete("studentProfileId");
    saveStudentMock.mockResolvedValue({ linkedExisting: true });

    await expect(saveStudentAction(formData)).rejects.toThrow(
      "REDIRECT:/admin/students?status=linked_existing",
    );
  });

  it("returns a specific status for Supabase Auth email failures", async () => {
    const { saveStudentAction } = await import("@/server/actions/admin-actions");
    saveStudentMock.mockRejectedValue(new Error("Erro ao atualizar acesso do aluno: email already exists"));

    await expect(saveStudentAction(studentForm())).rejects.toThrow(
      "REDIRECT:/admin/students?status=student_auth_email",
    );
  });
});

function studentForm(input?: {
  userId?: string;
  studentProfileId?: string;
  email?: string;
  name?: string;
  password?: string;
  document?: string;
  phone?: string;
  status?: string;
}) {
  const formData = new FormData();
  formData.set("studentUserId", input?.userId ?? "4f0896e4-3eb5-45de-8d8f-8d0601f6946b");
  formData.set("studentProfileId", input?.studentProfileId ?? "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633");
  formData.set("studentEmail", input?.email ?? "student@example.com");
  formData.set("studentName", input?.name ?? "Student");
  formData.set("studentPassword", input?.password ?? "");
  formData.set("studentDocument", input?.document ?? "");
  formData.set("studentPhone", input?.phone ?? "");
  formData.set("studentStatus", input?.status ?? "ACTIVE");
  return formData;
}
