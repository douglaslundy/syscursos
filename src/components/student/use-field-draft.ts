import { useEffect, useState } from "react";

import { clearDraft, loadDraft, saveDraft } from "@/lib/transcription/draft";

// Campo de formulario com rascunho no navegador: restaura ao abrir (se diferir do salvo no banco) e guarda o que se digita.
// Devolve true quando um rascunho foi restaurado.
export function useFieldDraft(key: string, value: string, setValue: (value: string) => void) {
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const draft = loadDraft(key);

    if (draft && draft.text !== value) {
      setValue(draft.text);
      setRestored(true);
    }

    setReady(true);
    // So na abertura: depois disso o valor vem da digitacao.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;

    const timer = window.setTimeout(() => saveDraft(key, value), 500);
    return () => window.clearTimeout(timer);
  }, [ready, key, value]);

  return restored;
}

export function clearFieldDrafts(keys: string[]) {
  keys.forEach(clearDraft);
}
