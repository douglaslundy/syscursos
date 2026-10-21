import { beforeEach, describe, expect, it } from "vitest";

import { hit, resetRateLimits } from "@/server/security/rate-limit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to max hits per window and then blocks", () => {
    const now = 1_000;

    expect([1, 2, 3].map(() => hit("k", 3, 60_000, now))).toEqual([true, true, true]);
    expect(hit("k", 3, 60_000, now)).toBe(false);
  });

  it("lets hits through again after the window passes", () => {
    for (let index = 0; index < 3; index += 1) hit("k", 3, 60_000, 0);

    expect(hit("k", 3, 60_000, 30_000)).toBe(false);
    expect(hit("k", 3, 60_000, 61_000)).toBe(true);
  });

  it("keeps separate counters per key", () => {
    hit("a", 1, 60_000, 0);

    expect(hit("a", 1, 60_000, 1)).toBe(false);
    expect(hit("b", 1, 60_000, 1)).toBe(true);
  });
});
