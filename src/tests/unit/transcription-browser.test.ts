import { describe, expect, it } from "vitest";

import { youtubeErrorMessage } from "@/lib/transcription/browser";

describe("youtubeErrorMessage", () => {
  it("traduz cada codigo conhecido", () => {
    expect(youtubeErrorMessage(new Error("invalid_key"))).toContain("recusada");
    expect(youtubeErrorMessage(new Error("quota"))).toContain("limite");
    expect(youtubeErrorMessage(new Error("empty"))).toContain("fala");
    expect(youtubeErrorMessage(new Error("not_configured"))).toContain("configurada");
  });

  it("usa mensagem generica para erro desconhecido", () => {
    expect(youtubeErrorMessage("x")).toContain("Nao foi possivel");
  });
});
