import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBusyGuard, useDraftAutosave, useVideoEnded } from "@/components/student/use-transcriber-effects";
import { VIDEO_ENDED_EVENT, isTranscribing, setTranscribing } from "@/lib/transcription/guard";

const { saveDraftMock } = vi.hoisted(() => ({ saveDraftMock: vi.fn() }));

vi.mock("@/lib/transcription/draft", () => ({ saveDraft: saveDraftMock }));

describe("hooks da transcricao", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveDraftMock.mockClear();
    setTranscribing(false);
  });
  afterEach(() => vi.useRealTimers());

  it("marca ocupado e avisa antes de sair enquanto ha trabalho", () => {
    const { unmount } = renderHook(() => useBusyGuard(true));
    const event = new Event("beforeunload", { cancelable: true });

    window.dispatchEvent(event);

    expect(isTranscribing()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    unmount();
    expect(window.dispatchEvent(new Event("beforeunload", { cancelable: true }))).toBe(true);
  });

  it("salva o rascunho so durante a conferencia, apos 500 ms", () => {
    renderHook(() => useDraftAutosave(false, "l1", "texto"));
    act(() => void vi.advanceTimersByTime(600));
    expect(saveDraftMock).not.toHaveBeenCalled();

    renderHook(() => useDraftAutosave(true, "l1", "texto"));
    act(() => void vi.advanceTimersByTime(600));
    expect(saveDraftMock).toHaveBeenCalledWith("l1", "texto");
  });

  it("encerra depois da carencia quando o video acaba durante a gravacao", () => {
    const onEnded = vi.fn();
    renderHook(() => useVideoEnded(() => true, onEnded, 2500));

    window.dispatchEvent(new Event(VIDEO_ENDED_EVENT));
    act(() => void vi.advanceTimersByTime(2499));
    expect(onEnded).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("ignora o fim do video fora da gravacao", () => {
    const onEnded = vi.fn();
    renderHook(() => useVideoEnded(() => false, onEnded, 2500));

    window.dispatchEvent(new Event(VIDEO_ENDED_EVENT));
    act(() => void vi.advanceTimersByTime(5000));
    expect(onEnded).not.toHaveBeenCalled();
  });
});
