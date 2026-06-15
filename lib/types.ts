// Os tipos de domínio agora vivem em @prouni/shared (contrato único web ↔ api).
// Este módulo re-exporta para manter os imports existentes ("@/lib/types") válidos.
export * from "@prouni/shared";
