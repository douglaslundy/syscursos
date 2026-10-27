import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OwnVideoPlayer } from "@/components/student/own-video-player";
import { getPlayer } from "@/lib/study/player-bridge";

afterEach(cleanup);

describe("OwnVideoPlayer", () => {
  it("registers the player controls and reports the end once", () => {
    const onEnded = vi.fn();
    const { container } = render(<OwnVideoPlayer fallbackUrl="https://drive.google.com/file/d/x/preview" onEnded={onEnded} src="/app/video/l1?courseId=c1" startSeconds={0} title="Aula" />);
    const video = container.querySelector("video") as HTMLVideoElement;

    expect(getPlayer()).not.toBeNull();

    fireEvent.ended(video);
    fireEvent.ended(video);

    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("retries before falling back to the Google window when the video fails", () => {
    vi.useFakeTimers();
    const { container } = render(<OwnVideoPlayer fallbackUrl="https://drive.google.com/file/d/x/preview" onEnded={() => undefined} src="/app/video/l1?courseId=c1" startSeconds={0} title="Aula" />);

    const video = container.querySelector("video") as HTMLVideoElement;
    const load = vi.spyOn(video, "load").mockImplementation(() => undefined);

    fireEvent.error(video);
    expect(container.querySelector("iframe")).toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(load).toHaveBeenCalledTimes(1);

    fireEvent.error(video);
    act(() => vi.advanceTimersByTime(60_000));
    fireEvent.error(video);
    act(() => vi.advanceTimersByTime(60_000));
    expect(load).toHaveBeenCalledTimes(3);

    fireEvent.error(video);
    vi.useRealTimers();

    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("https://drive.google.com/file/d/x/preview");
    expect(screen.getByText(/usando o player do Google/)).toBeTruthy();
    expect(getPlayer()).toBeNull();
  });
});
