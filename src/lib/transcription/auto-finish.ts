// Decide se a gravacao pode ser encerrada sozinha por ter chegado ao fim da aula.
// Sem a duracao da aula nao ha sinal confiavel (o Drive nao avisa quando o video acaba), entao nao encerra.
export const END_SILENCE_SECONDS = 6;
export const END_GRACE_SECONDS = 90;

export function shouldAutoFinish(input: { elapsed: number; durationSeconds: number | null; silentSeconds: number }) {
  const { elapsed, durationSeconds, silentSeconds } = input;

  if (!durationSeconds || durationSeconds <= 0 || elapsed < durationSeconds) return false;

  return silentSeconds >= END_SILENCE_SECONDS || elapsed >= durationSeconds + END_GRACE_SECONDS;
}

// Nivel do audio (RMS de 0 a 1) abaixo disto conta como silencio.
export const SILENCE_LEVEL = 0.005;

export function rms(samples: Float32Array) {
  if (samples.length === 0) return 0;

  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}
