import { afterEach, describe, expect, it, vi } from "vitest";

import { SILENCE_LEVEL, rms, shouldAutoFinish } from "@/lib/transcription/auto-finish";
import { MAX_VIDEO_SECONDS, YOUTUBE_CHUNK_SECONDS, isValidChunk, nextChunk } from "@/lib/transcription/chunks";
import { clearDraft, loadDraft, saveDraft } from "@/lib/transcription/draft";
import { isTranscribing, onTranscribingChange, setTranscribing } from "@/lib/transcription/guard";
import { transcribeYoutubeRange } from "@/server/services/gemini-transcribe-service";

afterEach(() => {
  localStorage.clear();
  setTranscribing(false);
  vi.unstubAllGlobals();
});

describe("transcribing guard", () => {
  it("tells listeners only when the state really changes", () => {
    const listener = vi.fn();
    const off = onTranscribingChange(listener);

    setTranscribing(true);
    setTranscribing(true);
    expect(isTranscribing()).toBe(true);
    setTranscribing(false);
    off();
    setTranscribing(true);

    expect(listener.mock.calls).toEqual([[true], [false]]);
  });
});

describe("transcript draft", () => {
  it("keeps the text per lesson until it is cleared", () => {
    saveDraft("l1", "[00:00] ola");

    expect(loadDraft("l1")?.text).toBe("[00:00] ola");
    expect(loadDraft("l2")).toBeNull();

    clearDraft("l1");
    expect(loadDraft("l1")).toBeNull();
  });

  it("drops the draft when saved empty and ignores corrupt storage", () => {
    saveDraft("l1", "texto");
    saveDraft("l1", "   ");
    expect(loadDraft("l1")).toBeNull();

    localStorage.setItem("syscursos:transcript-draft:l1", "{nao e json");
    expect(loadDraft("l1")).toBeNull();
  });
});

describe("auto finish", () => {
  it("never finishes before the lesson length or without knowing it", () => {
    expect(shouldAutoFinish({ elapsed: 100, durationSeconds: 600, silentSeconds: 30 })).toBe(false);
    expect(shouldAutoFinish({ elapsed: 9999, durationSeconds: null, silentSeconds: 99 })).toBe(false);
  });

  it("finishes after the length with a few seconds of silence, or after a grace period", () => {
    expect(shouldAutoFinish({ elapsed: 600, durationSeconds: 600, silentSeconds: 3 })).toBe(false);
    expect(shouldAutoFinish({ elapsed: 605, durationSeconds: 600, silentSeconds: 6 })).toBe(true);
    expect(shouldAutoFinish({ elapsed: 700, durationSeconds: 600, silentSeconds: 0 })).toBe(true);
  });

  it("measures the audio level", () => {
    expect(rms(new Float32Array(100))).toBeLessThan(SILENCE_LEVEL);
    expect(rms(new Float32Array(100).fill(0.5))).toBeCloseTo(0.5);
    expect(rms(new Float32Array(0))).toBe(0);
  });
});

describe("youtube chunks", () => {
  it("walks the video in fixed chunks and stops at the known length", () => {
    expect(nextChunk(0, 700)).toEqual({ start: 0, end: YOUTUBE_CHUNK_SECONDS });
    expect(nextChunk(600, 700)).toEqual({ start: 600, end: 700 });
    expect(nextChunk(700, 700)).toBeNull();
  });

  it("is capped when the length is unknown", () => {
    expect(nextChunk(0, null)?.end).toBe(YOUTUBE_CHUNK_SECONDS);
    expect(nextChunk(MAX_VIDEO_SECONDS, null)).toBeNull();
  });

  it("validates the range sent to the server", () => {
    expect(isValidChunk(0, 300)).toBe(true);
    expect(isValidChunk(300, 300)).toBe(false);
    expect(isValidChunk(-1, 10)).toBe(false);
    expect(isValidChunk(0, 301)).toBe(false);
    expect(isValidChunk(0, 1.5)).toBe(false);
  });
});

describe("transcribeYoutubeRange", () => {
  it("sends the public video and the time range to Gemini", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: " ola  mundo " }] } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeYoutubeRange("k", "abc123", 300, 600);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);

    expect(result).toEqual({ ok: true, text: "ola mundo" });
    expect(sent.contents[0].parts[1]).toEqual({
      fileData: { fileUri: "https://www.youtube.com/watch?v=abc123" },
      videoMetadata: { startOffset: "300s", endOffset: "600s" },
    });
  });
});
