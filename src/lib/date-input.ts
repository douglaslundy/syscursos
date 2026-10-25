/** Mascara digitos como dd/mm/aaaa. */
export function maskBrDate(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** yyyy-mm-dd -> dd/mm/aaaa ("" se invalido). */
export function isoToBrDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** dd/mm/aaaa -> yyyy-mm-dd; "" se incompleto ou data inexistente (ex.: 31/02). */
export function brDateToIso(br: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const probe = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const valid =
    probe.getUTCFullYear() === Number(yyyy) &&
    probe.getUTCMonth() === Number(mm) - 1 &&
    probe.getUTCDate() === Number(dd);
  return valid ? `${yyyy}-${mm}-${dd}` : "";
}

/** Mascara digitos como hh:mm. */
export function maskBrTime(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** hh:mm (24h) valido -> "HH:MM"; "" caso contrario. */
export function brTimeToValue(text: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(text);
  return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? text : "";
}
