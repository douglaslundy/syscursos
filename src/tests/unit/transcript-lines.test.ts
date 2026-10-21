import { describe, expect, it } from "vitest";

import { parseClock } from "@/lib/study/player-bridge";
import { filterLines, parseTranscriptLines } from "@/lib/study/transcript-lines";

describe("parseClock", () => {
  it("reads mm:ss and h:mm:ss", () => {
    expect(parseClock("01:30")).toBe(90);
    expect(parseClock("1:02:03")).toBe(3723);
  });

  it("rejects text that is not a clock", () => {
    expect(parseClock("90")).toBeNull();
    expect(parseClock("a:bc")).toBeNull();
    expect(parseClock("1:2:3:4")).toBeNull();
  });
});

describe("transcript lines", () => {
  const text = "[00:00] Ola turma\n[00:30] Vamos falar de Educação\nlinha solta\n[1:02:03] Fim";

  it("splits timestamped lines and keeps untimed ones", () => {
    const lines = parseTranscriptLines(text);

    expect(lines.map((line) => line.seconds)).toEqual([0, 30, null, 3723]);
    expect(lines[2].text).toBe("linha solta");
  });

  it("filters without caring about accents or case", () => {
    const lines = parseTranscriptLines(text);

    expect(filterLines(lines, "educacao")).toHaveLength(1);
    expect(filterLines(lines, "")).toHaveLength(4);
  });
});
