import { describe, expect, it } from "vitest";

import { clock, joinSegments } from "@/lib/transcription/format";
import { encodeWav } from "@/lib/transcription/wav";

describe("transcription helpers", () => {
  it("formats clock marks", () => {
    expect(clock(65)).toBe("01:05");
    expect(clock(3725)).toBe("1:02:05");
  });

  it("joins one line per non-empty segment with its start time", () => {
    expect(joinSegments([{ start: 0, text: "ola" }, { start: 60, text: "" }, { start: 125, text: "tchau" }])).toBe("[00:00] ola\n[02:05] tchau");
  });

  it("encodes a 16-bit mono WAV", () => {
    const wav = encodeWav(new Float32Array([0, 1, -1]), 16_000);
    const view = new DataView(wav);

    expect(wav.byteLength).toBe(44 + 6);
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
  });
});
