import { describe, expect, it } from "vitest";

import { CHUNK_BYTES, parseByteRange } from "@/lib/video/range";

describe("parseByteRange", () => {
  it("starts at zero without a Range header", () => {
    expect(parseByteRange(null)).toEqual({ start: 0, end: CHUNK_BYTES - 1 });
  });

  it("caps an open-ended range to one chunk", () => {
    expect(parseByteRange("bytes=1000-")).toEqual({ start: 1000, end: 1000 + CHUNK_BYTES - 1 });
  });

  it("keeps a short explicit range and caps a long one", () => {
    expect(parseByteRange("bytes=10-99")).toEqual({ start: 10, end: 99 });
    expect(parseByteRange(`bytes=0-${CHUNK_BYTES * 4}`)).toEqual({ start: 0, end: CHUNK_BYTES - 1 });
  });

  it("rejects suffix, multiple and inverted ranges", () => {
    expect(parseByteRange("bytes=-500")).toBeNull();
    expect(parseByteRange("bytes=0-10,20-30")).toBeNull();
    expect(parseByteRange("bytes=50-10")).toBeNull();
    expect(parseByteRange("items=0-10")).toBeNull();
  });
});
