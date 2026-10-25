import { describe, expect, it } from "vitest";

import { brDateToIso, isoToBrDate, maskBrDate } from "@/lib/date-input";

describe("date-input", () => {
  it("aplica mascara dd/mm/aaaa", () => {
    expect(maskBrDate("04052026")).toBe("04/05/2026");
    expect(maskBrDate("0405")).toBe("04/05");
    expect(maskBrDate("04/05/20269")).toBe("04/05/2026");
  });
  it("converte ISO <-> BR", () => {
    expect(isoToBrDate("2026-05-04")).toBe("04/05/2026");
    expect(isoToBrDate(null)).toBe("");
    expect(brDateToIso("04/05/2026")).toBe("2026-05-04");
  });
  it("rejeita incompleta ou inexistente", () => {
    expect(brDateToIso("04/05")).toBe("");
    expect(brDateToIso("31/02/2026")).toBe("");
  });
});

describe("time-input e format-date", () => {
  it("mascara e valida hh:mm 24h", async () => {
    const { maskBrTime, brTimeToValue } = await import("@/lib/date-input");
    expect(maskBrTime("0930")).toBe("09:30");
    expect(brTimeToValue("09:30")).toBe("09:30");
    expect(brTimeToValue("24:00")).toBe("");
  });
  it("formata pt-BR com fuso consistente", async () => {
    const { formatDateBr, formatDateTimeBr } = await import("@/lib/format-date");
    expect(formatDateBr(new Date("2026-05-04T00:00:00.000Z"))).toBe("04/05/2026");
    expect(formatDateTimeBr("2026-05-04T15:30:00.000Z")).toBe("04/05/2026, 12:30");
  });
});
