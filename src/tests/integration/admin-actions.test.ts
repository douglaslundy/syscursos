import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
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
});

function studentForm(input?: { email?: string; password?: string }) {
  const formData = new FormData();
  formData.set("studentUserId", "4f0896e4-3eb5-45de-8d8f-8d0601f6946b");
  formData.set("studentProfileId", "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633");
  formData.set("studentEmail", input?.email ?? "student@example.com");
  formData.set("studentName", "Student");
  formData.set("studentPassword", input?.password ?? "");
  formData.set("studentDocument", "");
  formData.set("studentPhone", "");
  formData.set("studentStatus", "ACTIVE");
  return formData;
}
