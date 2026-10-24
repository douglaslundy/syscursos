// Telefone do WhatsApp só com dígitos, no formato E.164 sem "+" (ex.: 5511999998888). null se não parecer um telefone.
// shortcut: assume Brasil (DDI 55) para números de 10-11 dígitos; outros países precisam vir com o DDI. Trocar se houver aluno fora do Brasil sem DDI.
export function normalizePhone(raw: string) {
  let digits = raw.split("@")[0].split(":")[0].replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  // Celular antigo sem o 9 (55 + DDD + 8 dígitos começando em 6-9): o WhatsApp pode entregar das duas formas.
  if (/^55\d{2}[6-9]\d{7}$/.test(digits)) digits = `${digits.slice(0, 4)}9${digits.slice(4)}`;

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export const maskPhone = (phone: string) => `+${phone.slice(0, 2)} ••• ${phone.slice(-4)}`;
