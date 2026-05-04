import { describe, expect, it } from "vitest";

import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/server/services/youtube-service";

describe("youtube service", () => {
  it("extracts video id from watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts video id from short URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns embed URL from stored video id first", () => {
    expect(getYouTubeEmbedUrl("https://example.com/video", "abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("rejects non YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBeNull();
  });
});
