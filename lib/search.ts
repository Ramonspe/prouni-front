export interface SearchablePersonRecord {
  name?: string | null;
  cpf?: string | null;
  protocol?: string | null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/** Busca por nome/protocolo e, quando houver dígitos, por CPF. */
export function matchesPersonSearch(
  record: SearchablePersonRecord,
  query: string,
): boolean {
  const term = normalizeText(query.trim());
  if (!term) return true;

  const matchesText = [record.name, record.protocol].some(
    (value) => value != null && normalizeText(value).includes(term),
  );
  if (matchesText) return true;

  const digits = query.replace(/\D/g, "");
  return Boolean(
    digits && record.cpf?.replace(/\D/g, "").includes(digits),
  );
}
