import { afterEach, describe, expect, it, vi } from "vitest";

import { callProvider } from "@/server/services/ai/providers";

const request = { system: "sys", user: "usr", json: true };

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("callProvider", () => {
  it("calls OpenAI with JSON mode and reads text and token usage", async () => {
    const fetchMock = stubFetch(200, {
      choices: [{ message: { content: '{"ok":1}' } }],
      usage: { prompt_tokens: 120, completion_tokens: 30 },
    });
    const result = await callProvider("openai", "sk-test", request);
    const [url, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse(init.body as string);

    expect(result).toMatchObject({ ok: true, text: '{"ok":1}', inputTokens: 120, outputTokens: 30 });
    expect(url).toContain("api.openai.com");
    expect(init.headers.authorization).toBe("Bearer sk-test");
    expect(sent.response_format).toEqual({ type: "json_object" });
    expect(sent.messages[0]).toEqual({ role: "system", content: "sys" });
  });

  it("calls Gemini with the key in a header and counts thinking tokens as output", async () => {
    const fetchMock = stubFetch(200, {
      candidates: [{ content: { parts: [{ text: "ola" }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 50, totalTokenCount: 170 },
    });
    const result = await callProvider("gemini", "gk-test", { ...request, json: false });
    const [url, init] = fetchMock.mock.calls[0];

    expect(result).toMatchObject({ ok: true, text: "ola", inputTokens: 100, outputTokens: 70 });
    expect(url).not.toContain("gk-test");
    expect(init.headers["x-goog-api-key"]).toBe("gk-test");
    expect(JSON.parse(init.body as string).generationConfig).toBeUndefined();
  });

  it("maps HTTP errors to reasons", async () => {
    stubFetch(401, { error: { message: "bad key" } });
    expect(await callProvider("openai", "k", request)).toEqual({ ok: false, reason: "invalid_key" });
    stubFetch(429, {});
    expect(await callProvider("openai", "k", request)).toEqual({ ok: false, reason: "quota" });
    stubFetch(403, { error: { message: "API key not valid" } });
    expect(await callProvider("gemini", "k", request)).toEqual({ ok: false, reason: "invalid_key" });
    stubFetch(500, {});
    expect(await callProvider("gemini", "k", request)).toEqual({ ok: false, reason: "failed" });
  });

  it("reports network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await callProvider("openai", "k", request)).toEqual({ ok: false, reason: "network" });
  });

  it("fails when the model returns no text", async () => {
    stubFetch(200, { choices: [{ message: { content: "" } }], usage: { prompt_tokens: 1, completion_tokens: 0 } });

    expect(await callProvider("openai", "k", request)).toEqual({ ok: false, reason: "failed" });
  });
});
