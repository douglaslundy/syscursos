export const SAMPLE_RATE = 16_000;

export function supported() {
  // Celular nao compartilha audio da guia (mesmo com "site para computador"): a captura so funciona no Chrome/Edge desktop.
  const touchOnly = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(any-pointer: fine)").matches;
  const mobileAgent = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return (
    typeof navigator !== "undefined" &&
    !touchOnly &&
    !mobileAgent &&
    !!navigator.mediaDevices?.getDisplayMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

export async function decodeToPcm(blob: Blob) {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    return decoded.getChannelData(0);
  } finally {
    void context.close();
  }
}

export function youtubeErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";

  if (code === "invalid_key") return "A chave do Gemini foi recusada ou nao tem acesso ao modelo. Avise o administrador.";
  if (code === "not_configured") return "A transcricao pelo Gemini nao esta configurada.";
  if (code === "quota") return "O limite de uso do Gemini foi atingido. Tente mais tarde ou grave o audio da aula.";
  if (code === "empty") return "O Gemini nao encontrou fala neste video.";
  return "Nao foi possivel transcrever pelo Gemini agora. Voce pode gravar o audio da aula.";
}
