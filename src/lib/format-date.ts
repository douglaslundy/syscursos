const TZ = "America/Sao_Paulo";

const dateOnly = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ, hourCycle: "h23" });
const timeOnly = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ, hourCycle: "h23" });

type DateLike = Date | string | number;
const toDate = (value: DateLike) => (value instanceof Date ? value : new Date(value));

/** Datas "de calendario" (gravadas em 00:00 UTC, ex.: matricula/validade) -> dd/mm/aaaa sem deslocar o dia. */
export const formatDateBr = (value: DateLike) => dateOnly.format(toDate(value));

/** Instantes (ex.: ultimo login, notificacao) -> dd/mm/aaaa HH:mm em America/Sao_Paulo. */
export const formatDateTimeBr = (value: DateLike) => dateTime.format(toDate(value));

/** Instantes -> HH:mm (24h) em America/Sao_Paulo. */
export const formatTimeBr = (value: DateLike) => timeOnly.format(toDate(value));
