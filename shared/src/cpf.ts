/** Remove tudo que não é dígito. */
export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata como 000.000.000-00 (parcial enquanto digita). */
export function formatCpf(value: string): string {
  const d = normalizeCpf(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Validação completa de CPF (dígitos verificadores). */
export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // sequências repetidas (111.111.111-11 etc.)

  const digit = (count: number): number => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += parseInt(cpf[i], 10) * (count + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return digit(9) === parseInt(cpf[9], 10) && digit(10) === parseInt(cpf[10], 10);
}
