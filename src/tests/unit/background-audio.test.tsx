import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OwnVideoPlayer } from "@/components/student/own-video-player";

const play = vi.fn(() => Promise.resolve());
const audios: FakeAudio[] = [];

class FakeAudio {
  src: string;
  currentTime = 0;
  playbackRate = 1;
  preload = "";
  paused = false;
  onended: (() => void) | null = null;
  play = play;
  pause = vi.fn(() => {
    this.paused = true;
  });

  constructor(src: string) {
    this.src = src;
    audios.push(this);
  }
}

function setHidden(value: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  audios.length = 0;
  play.mockClear();
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("coarse"), addEventListener: () => undefined, removeEventListener: () => undefined }));
});

afterEach(() => {
  cleanup();
  setHidden(false);
  vi.unstubAllGlobals();
});

function setup() {
  const onEnded = vi.fn();
  const { container } = render(<OwnVideoPlayer fallbackUrl="https://drive.google.com/file/d/x/preview" onEnded={onEnded} src="/app/video/l1?courseId=c1" startSeconds={0} title="Aula" />);
  const video = container.querySelector("video") as HTMLVideoElement;

  vi.spyOn(video, "pause").mockImplementation(() => undefined);
  vi.spyOn(video, "play").mockImplementation(() => Promise.resolve());
  video.currentTime = 42;

  return { video, onEnded };
}

describe("background audio (phone)", () => {
  it("moves the sound to an audio element at the same position when the screen locks", () => {
    const { video } = setup();

    fireEvent.play(video);
    setHidden(true);

    expect(audios).toHaveLength(1);
    expect(audios[0].src).toBe("/app/video/l1?courseId=c1");
    expect(audios[0].currentTime).toBe(42);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("resumes the video where the audio stopped when the page comes back", () => {
    const { video } = setup();

    fireEvent.play(video);
    setHidden(true);
    audios[0].currentTime = 90;
    setHidden(false);

    expect(audios[0].pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(90);
    expect(video.play).toHaveBeenCalled();
  });

  it("does not start audio when the lesson was paused", () => {
    const { video } = setup();

    fireEvent.play(video);
    fireEvent.pause(video);
    setHidden(true);

    expect(audios).toHaveLength(0);
  });

  it("keeps going with audio when the system pauses the video in the background", () => {
    const { video } = setup();

    fireEvent.play(video);
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    fireEvent.pause(video);

    expect(audios).toHaveLength(1);
  });

  it("reports the end of the lesson when the audio finishes", () => {
    const { video, onEnded } = setup();

    fireEvent.play(video);
    setHidden(true);
    audios[0].onended?.();

    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
