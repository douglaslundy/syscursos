import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ studentProfile: { update: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() } }));
const rate = vi.hoisted(() => ({ hitGlobal: vi.fn() }));
const student = vi.hoisted(() => ({ requireStudentProfileId: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/security/rate-limit", () => ({ hitGlobal: rate.hitGlobal }));
vi.mock("@/server/services/student-service", () => student);

import { createWhatsappLinkCode, findStudentByPhone, getWhatsappStatus, linkWhatsappByCode, unlinkWhatsapp } from "@/server/services/whatsapp-link-service";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const PHONE = "5511999998888";

beforeEach(() => {
  vi.resetAllMocks();
  rate.hitGlobal.mockResolvedValue(true);
  student.requireStudentProfileId.mockResolvedValue("stu-1");
});

describe("createWhatsappLinkCode", () => {
  it("guarda só o hash, com validade de 10 minutos, e devolve o código em maiúsculas", async () => {
    db.studentProfile.update.mockResolvedValue({});

    const { code, expiresAt } = await createWhatsappLinkCode();
    const data = db.studentProfile.update.mock.calls[0][0].data;

    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(data.whatsappCodeHash).toBe(sha(code));
    expect(JSON.stringify(data)).not.toContain(code);
    expect(new Date(expiresAt).getTime() - Date.now()).toBeGreaterThan(9 * 60_000);
    expect(new Date(expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(10 * 60_000);
  });
});

describe("linkWhatsappByCode", () => {
  const future = new Date(Date.now() + 60_000);

  it("vincula o telefone, ignora caixa/espaços do código e consome o código", async () => {
    db.studentProfile.findUnique.mockResolvedValue({ id: "stu-1", whatsappCodeExpiresAt: future });
    db.studentProfile.findFirst.mockResolvedValue(null);
    db.studentProfile.update.mockResolvedValue({});

    expect(await linkWhatsappByCode(`+${PHONE}`, " abcd 2345 ")).toEqual({ ok: true });
    expect(db.studentProfile.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { whatsappCodeHash: sha("ABCD2345") } }));
    expect(db.studentProfile.update).toHaveBeenCalledWith({ where: { id: "stu-1" }, data: { whatsappPhone: PHONE, whatsappCodeHash: null, whatsappCodeExpiresAt: null } });
  });

  it("código inexistente ou vencido dá invalid_code", async () => {
    db.studentProfile.findUnique.mockResolvedValueOnce(null);
    expect(await linkWhatsappByCode(PHONE, "ABCD2345")).toEqual({ ok: false, error: "invalid_code" });

    db.studentProfile.findUnique.mockResolvedValueOnce({ id: "stu-1", whatsappCodeExpiresAt: new Date(Date.now() - 1000) });
    expect(await linkWhatsappByCode(PHONE, "ABCD2345")).toEqual({ ok: false, error: "invalid_code" });
    expect(db.studentProfile.update).not.toHaveBeenCalled();
  });

  it("telefone inválido, telefone de outro aluno e excesso de tentativas", async () => {
    expect(await linkWhatsappByCode("abc", "ABCD2345")).toEqual({ ok: false, error: "invalid_phone" });

    db.studentProfile.findUnique.mockResolvedValue({ id: "stu-1", whatsappCodeExpiresAt: future });
    db.studentProfile.findFirst.mockResolvedValue({ id: "stu-2" });
    expect(await linkWhatsappByCode(PHONE, "ABCD2345")).toEqual({ ok: false, error: "phone_taken" });

    rate.hitGlobal.mockResolvedValue(false);
    expect(await linkWhatsappByCode(PHONE, "ABCD2345")).toEqual({ ok: false, error: "rate_limited" });
  });
});

describe("findStudentByPhone", () => {
  const row = (status: string, accessExpiresAt: Date | null) => ({ id: "stu-1", user: { status, accessExpiresAt } });

  it("devolve o aluno ativo", async () => {
    db.studentProfile.findUnique.mockResolvedValue(row("ACTIVE", null));
    expect(await findStudentByPhone("+55 11 99999-8888")).toBe("stu-1");
    expect(db.studentProfile.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { whatsappPhone: PHONE } }));
  });

  it("null para telefone sem vínculo, bloqueado, expirado ou inválido", async () => {
    db.studentProfile.findUnique.mockResolvedValueOnce(null);
    expect(await findStudentByPhone(PHONE)).toBeNull();
    db.studentProfile.findUnique.mockResolvedValueOnce(row("BLOCKED", null));
    expect(await findStudentByPhone(PHONE)).toBeNull();
    db.studentProfile.findUnique.mockResolvedValueOnce(row("ACTIVE", new Date(Date.now() - 1000)));
    expect(await findStudentByPhone(PHONE)).toBeNull();
    expect(await findStudentByPhone("abc")).toBeNull();
  });
});

describe("status e desvínculo", () => {
  it("getWhatsappStatus mascara o telefone", async () => {
    db.studentProfile.findUnique.mockResolvedValue({ whatsappPhone: PHONE });
    expect(await getWhatsappStatus()).toEqual({ linked: true, masked: "+55 ••• 8888" });
    db.studentProfile.findUnique.mockResolvedValue({ whatsappPhone: null });
    expect(await getWhatsappStatus()).toEqual({ linked: false, masked: null });
  });

  it("unlinkWhatsapp limpa telefone e código", async () => {
    db.studentProfile.update.mockResolvedValue({});
    await unlinkWhatsapp();
    expect(db.studentProfile.update).toHaveBeenCalledWith({ where: { id: "stu-1" }, data: { whatsappPhone: null, whatsappCodeHash: null, whatsappCodeExpiresAt: null } });
  });
});
