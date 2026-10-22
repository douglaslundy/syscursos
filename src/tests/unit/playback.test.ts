import { describe, expect, it } from "vitest";

import { PLAYBACK_RATES, normalizeRate } from "@/lib/study/playback";

describe("normalizeRate", () => {
  it("keeps offered rates", () => {
    for (const rate of PLAYBACK_RATES) expect(normalizeRate(rate)).toBe(rate);
  });

  it("falls back to 1x for unknown or invalid values", () => {
    for (const value of [0, 3, -1, NaN, "x", null, undefined]) expect(normalizeRate(value)).toBe(1);
  });
});
