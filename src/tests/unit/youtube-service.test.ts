import { describe, expect, it } from "vitest";

import {
  extractYouTubeVideoId,
  getLessonVideoEmbed,
  getLessonThumbnailUrl,
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

  it("does not build a YouTube embed from a stored video id when the URL is not YouTube", () => {
    expect(getYouTubeEmbedUrl("https://example.com/video", "abc123")).toBe(
      null,
    );
    expect(getYouTubeEmbedUrl("https://example.com/video", "dQw4w9WgXcQ")).toBe(
      null,
    );
  });

  it("falls back to the URL when a stored video id is invalid", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ", "invalid-id")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&enablejsapi=1",
    );
  });

  it("uses the video id from the current YouTube URL before a stale stored id", () => {
    expect(getYouTubeEmbedUrl("https://youtu.be/9bZkp7q19f0", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/9bZkp7q19f0?rel=0&modestbranding=1&enablejsapi=1",
    );
  });

  it("builds a YouTube thumbnail URL from a valid video", () => {
    expect(getYouTubeThumbnailUrl("https://youtu.be/dQw4w9WgXcQ", null)).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("builds a generic lesson thumbnail URL from YouTube", () => {
    expect(getLessonThumbnailUrl("https://youtu.be/dQw4w9WgXcQ", null)).toBe(
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

  it("builds a Google Drive thumbnail URL", () => {
    expect(
      getLessonThumbnailUrl(
        "https://drive.google.com/file/d/1CYHOYHWbRl2JRs8sVCEDDNI6zImOAZ64/view?usp=sharing",
        null,
      ),
    ).toBe("https://drive.google.com/thumbnail?id=1CYHOYHWbRl2JRs8sVCEDDNI6zImOAZ64&sz=w1000");
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

  it("keeps OneDrive embed when a stale YouTube video id is still stored", () => {
    expect(
      getLessonVideoEmbed(
        "https://1drv.ms/v/c/8d1fc101d88357bb/IQC7V4PYAcEfIICN6rEAAAAAAUhadaDsqqjIGHfMFJfnDwM?e=y5x3X0",
        "dQw4w9WgXcQ",
      ),
    ).toEqual({
      provider: "ONEDRIVE",
      url: "https://1drv.ms/v/c/8d1fc101d88357bb/IQC7V4PYAcEfIICN6rEAAAAAAUhadaDsqqjIGHfMFJfnDwM?e=y5x3X0",
      supportsCompletionTracking: false,
    });
  });

  it("builds a OneDrive thumbnail URL", () => {
    expect(
      getLessonThumbnailUrl(
        "https://1drv.ms/v/c/8d1fc101d88357bb/IQC7V4PYAcEfIICN6rEAAAAAAUhadaDsqqjIGHfMFJfnDwM?e=y5x3X0",
        "dQw4w9WgXcQ",
      ),
    ).toBe("https://api.onedrive.com/v1.0/shares/u!aHR0cHM6Ly8xZHJ2Lm1zL3YvYy84ZDFmYzEwMWQ4ODM1N2JiL0lRQzdWNFBZQWNFZklJQ042ckVBQUFBQUFVaGFkYURzcXFqSUdIZk1GSmZuRHdNP2U9eTV4M1gw/root/thumbnails/0/large/content");
  });

  it("rejects unsupported URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBeNull();
    expect(getLessonVideoEmbed("https://example.com/video", null)).toBeNull();
  });
});
