// Mes "YYYY-MM" em America/Sao_Paulo (UTC-3 fixo, sem horario de verao desde 2019).
export function monthRange(month: string | undefined) {
  const match = month ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month) : null;

  if (!match) return null;

  const year = Number(match[1]);
  const index = Number(match[2]) - 1;

  return { from: new Date(Date.UTC(year, index, 1, 3)), to: new Date(Date.UTC(year, index + 1, 1, 3)) };
}
