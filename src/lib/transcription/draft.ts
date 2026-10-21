// Rascunho da transcricao guardado no navegador ate ser salvo no banco; sobrevive a troca de pagina.
export type TranscriptDraft = { text: string; savedAt: number };

const PREFIX = "syscursos:transcript-draft:";

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function saveDraft(lessonId: string, text: string) {
  const store = storage();

  if (!store) return;

  try {
    if (text.trim()) store.setItem(PREFIX + lessonId, JSON.stringify({ text, savedAt: Date.now() }));
    else store.removeItem(PREFIX + lessonId);
  } catch {
    // Armazenamento cheio ou bloqueado: o rascunho e so uma protecao extra.
  }
}

export function loadDraft(lessonId: string): TranscriptDraft | null {
  try {
    const raw = storage()?.getItem(PREFIX + lessonId);
    const parsed = raw ? (JSON.parse(raw) as Partial<TranscriptDraft>) : null;

    return parsed && typeof parsed.text === "string" && parsed.text.trim() && typeof parsed.savedAt === "number"
      ? { text: parsed.text, savedAt: parsed.savedAt }
      : null;
  } catch {
    return null;
  }
}

export function clearDraft(lessonId: string) {
  try {
    storage()?.removeItem(PREFIX + lessonId);
  } catch {
    // sem armazenamento: nada a limpar
  }
}
