import { describe, expect, it } from "vitest";

import {
  extractYouTubeVideoId,
  getLessonVideoEmbed,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/server/services/youtube-service";

describe("video platform service", () => {
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
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&enablejsapi=1",
    );
  });

  it("falls back to the URL when a stored video id is invalid", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ", "invalid-id")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&enablejsapi=1",
    );
  });

  it("builds a YouTube thumbnail URL from a valid video", () => {
    expect(getYouTubeThumbnailUrl("https://youtu.be/dQw4w9WgXcQ", null)).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("extracts video id from shorts URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("builds a Google Drive preview embed", () => {
    expect(
      getLessonVideoEmbed(
        "https://drive.google.com/file/d/1CYHOYHWbRl2JRs8sVCEDDNI6zImOAZ64/view?usp=sharing",
        null,
      ),
    ).toEqual({
      provider: "GOOGLE_DRIVE",
      url: "https://drive.google.com/file/d/1CYHOYHWbRl2JRs8sVCEDDNI6zImOAZ64/preview",
      supportsCompletionTracking: false,
    });
  });

  it("accepts OneDrive video share URLs", () => {
    expect(
      getLessonVideoEmbed(
        "https://1drv.ms/v/c/8d1fc101d88357bb/IQC7V4PYAcEfIICN6rEAAAAAAUhadaDsqqjIGHfMFJfnDwM?e=y5x3X0",
        null,
      ),
    ).toEqual({
      provider: "ONEDRIVE",
      url: "https://1drv.ms/v/c/8d1fc101d88357bb/IQC7V4PYAcEfIICN6rEAAAAAAUhadaDsqqjIGHfMFJfnDwM?e=y5x3X0",
      supportsCompletionTracking: false,
    });
  });

  it("rejects unsupported URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBeNull();
    expect(getLessonVideoEmbed("https://example.com/video", null)).toBeNull();
  });
});
