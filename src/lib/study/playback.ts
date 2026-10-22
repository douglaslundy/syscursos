// Velocidades oferecidas ao aluno (barra da aula e pagina "Meus dados").
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

// Valor fora da lista (dado antigo ou adulterado) volta para 1x.
export function normalizeRate(value: unknown) {
  const rate = Number(value);

  return PLAYBACK_RATES.includes(rate) ? rate : 1;
}
