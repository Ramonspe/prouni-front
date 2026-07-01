// Formatadores pt-BR. Money trafega como string canônica ("1234.56") e é
// formatada aqui para exibição em R$.

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBRL(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Máscaras de digitação (formatam enquanto o usuário digita) ----

const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** CPF → 000.000.000-00 (limita a 11 dígitos). */
export function maskCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** NIS / Cadastro Único → 000.00000.00-0 (11 dígitos). */
export function maskNis(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3}\.\d{5})(\d)/, "$1.$2")
    .replace(/(\d{3}\.\d{5}\.\d{2})(\d)/, "$1-$2");
}

/**
 * RG — formato abrangente (varia por estado): mantém dígitos, letra verificadora
 * e separadores; em maiúsculas e limitado a 14 caracteres. Não força um padrão único.
 */
export function maskRg(value: string): string {
  return value.replace(/[^0-9A-Za-z.\-/]/g, "").toUpperCase().slice(0, 14);
}

/** Data → dd/mm/aaaa. */
export function maskDateBR(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2}\/\d{2})(\d)/, "$1/$2");
}

/** Valor monetário enquanto digita (a partir de centavos) → "1.234,56". */
export function maskMoney(value: string): string {
  const digits = onlyDigits(value).slice(0, 11); // até ~9 inteiros + 2 decimais
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Celular → (00) 00000-0000 (aceita fixo de 10 ou celular de 11 dígitos). */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/** CEP → 00000-000. */
export function maskCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}
