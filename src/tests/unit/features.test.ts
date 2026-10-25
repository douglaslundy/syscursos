import { describe, expect, it } from "vitest";

import { AGENT_FEATURES, parseDisabled } from "@/lib/features";

describe("parseDisabled", () => {
  it("mantem so ids conhecidos", () => {
    expect(parseDisabled('["quiz","agent:ask_lesson","nope",3]')).toEqual(["quiz", "agent:ask_lesson"]);
  });

  it("devolve vazio para nulo ou JSON invalido", () => {
    expect(parseDisabled(null)).toEqual([]);
    expect(parseDisabled("{")).toEqual([]);
    expect(parseDisabled('{"a":1}')).toEqual([]);
  });

  it("cobre as 13 tools do agente (link_whatsapp fica sempre ligado)", () => {
    expect(AGENT_FEATURES).toHaveLength(13);
  });
});
