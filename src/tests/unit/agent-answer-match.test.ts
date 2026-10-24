import { describe, expect, it } from "vitest";

import { matchAnswer, suggestGrade } from "@/lib/study/answer-match";

describe("matchAnswer", () => {
  it("resposta igual vale 100", () => {
    expect(matchAnswer("A fotossíntese produz glicose", "a fotossintese produz glicose")).toBe(100);
  });

  it("ignora acento, caixa e pontuação", () => {
    expect(matchAnswer("Célula, núcleo!", "celula nucleo")).toBe(100);
  });

  it("resposta sem relação vale 0", () => {
    expect(matchAnswer("banana", "A fotossíntese produz glicose")).toBe(0);
  });

  it("resposta vazia vale 0", () => {
    expect(matchAnswer("   ", "algo")).toBe(0);
  });

  it("resposta parcial fica entre 0 e 100", () => {
    const percent = matchAnswer("produz glicose", "A fotossíntese produz glicose na planta");

    expect(percent).toBeGreaterThan(30);
    expect(percent).toBeLessThan(100);
  });

  it("gabarito com explicação não penaliza quem acertou a alternativa", () => {
    expect(matchAnswer("Mitocôndria", "Mitocôndria - É a organela que produz energia")).toBeGreaterThanOrEqual(70);
  });
});

describe("suggestGrade", () => {
  it.each([
    [0, "again"],
    [39, "again"],
    [40, "hard"],
    [69, "hard"],
    [70, "good"],
    [89, "good"],
    [90, "easy"],
    [100, "easy"],
  ])("%i%% sugere %s", (percent, grade) => {
    expect(suggestGrade(percent)).toBe(grade);
  });
});
