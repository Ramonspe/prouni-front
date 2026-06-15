import type { ProcessStatus, StatusMeta } from "./types";

/**
 * Mapa status → tom/rótulo — contrato estável entre os enums do banco
 * (ApplicationStatus, em UPPER_CASE) e o front (lower_snake_case).
 */
export const STATUS_MAP: Record<ProcessStatus, StatusMeta> = {
  iniciada: { tone: "neutral", label: "Inscrição iniciada" },
  enviada: { tone: "info", label: "Inscrição enviada" },
  analise_doc: { tone: "info", label: "Em análise documental" },
  pendencia: { tone: "warning", label: "Pendência documental" },
  analise_socio: { tone: "info", label: "Em análise socioeconômica" },
  classificado: { tone: "success", label: "Classificado" },
  espera: { tone: "warning", label: "Lista de espera" },
  indeferido: { tone: "danger", label: "Indeferido" },
  concedida: { tone: "success", label: "Bolsa concedida" },
};

/** Converte o enum do banco (ex.: "ANALISE_SOCIO") para o status do front ("analise_socio"). */
export function statusFromDb(dbStatus: string): ProcessStatus {
  return dbStatus.toLowerCase() as ProcessStatus;
}

/** Converte o status do front para o enum do banco. */
export function statusToDb(status: ProcessStatus): string {
  return status.toUpperCase();
}
