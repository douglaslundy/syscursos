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
      null,
    );
    expect(getYouTubeEmbedUrl("https://example.com/video", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );
  });

  it("falls back to the URL when a stored video id is invalid", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ", "invalid-id")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    );
  });

  it("extracts video id from shorts URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("rejects non YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBeNull();
  });
});
