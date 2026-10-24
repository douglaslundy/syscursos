import { describe, expect, it } from "vitest";

import { maskPhone, normalizePhone } from "@/lib/study/phone";

describe("normalizePhone", () => {
  it.each([
    ["+55 (11) 99999-8888", "5511999998888"],
    ["5511999998888@s.whatsapp.net", "5511999998888"],
    ["5511999998888:12@s.whatsapp.net", "5511999998888"],
    ["11999998888", "5511999998888"],
    ["(11) 3333-4444", "551133334444"],
  ])("%s -> %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it("acrescenta o 9 dos celulares antigos (12 dígitos) para o mesmo número casar", () => {
    expect(normalizePhone("551199998888")).toBe("5511999998888");
  });

  it.each(["", "abc", "123", "1".repeat(16)])("recusa %j", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("maskPhone", () => {
  it("mostra só os 4 últimos dígitos", () => {
    expect(maskPhone("5511999998888")).toBe("+55 ••• 8888");
  });
});
