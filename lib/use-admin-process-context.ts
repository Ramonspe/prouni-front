"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  CycleDto,
  SelectionCallSummaryDto,
} from "@prouni/shared";
import type { ProcessContextOption } from "@/components/process-context-selector";
import { cyclesApi, selectionCallsApi } from "@/lib/api";

const CYCLE_STATUS_LABEL: Record<
  NonNullable<CycleDto["status"]>,
  string
> = {
  DRAFT: "Em preparação",
  ACTIVE: "Em execução",
  CLOSED: "Encerrado",
  ARCHIVED: "Arquivado",
};

const CALL_STATUS_LABEL: Record<SelectionCallSummaryDto["status"], string> = {
  DRAFT: "Em configuração",
  PUBLISHED: "Em execução",
  CLOSED: "Encerrada",
  ARCHIVED: "Arquivada",
};

function sortCycles(cycles: CycleDto[]): CycleDto[] {
  const statusOrder: Record<NonNullable<CycleDto["status"]>, number> = {
    ACTIVE: 0,
    DRAFT: 1,
    CLOSED: 2,
    ARCHIVED: 3,
  };
  return [...cycles].sort(
    (left, right) =>
      (left.status ? statusOrder[left.status] : 1) -
        (right.status ? statusOrder[right.status] : 1) ||
      right.year - left.year ||
      right.term - left.term,
  );
}

/**
 * Mantém um único contexto ciclo/chamada para as telas operacionais.
 * O ciclo ativo é priorizado, mas históricos continuam acessíveis.
 */
export function useAdminProcessContext(enabled: boolean) {
  const [cycleId, setCycleId] = useState("");
  const [callId, setCallId] = useState("all");

  const cyclesQuery = useQuery({
    queryKey: ["cycles"],
    queryFn: () => cyclesApi.list(),
    enabled,
  });
  const callsQuery = useQuery({
    queryKey: ["admin", "selection-calls"],
    queryFn: () => selectionCallsApi.list(),
    enabled,
  });

  const cycles = useMemo(
    () => sortCycles(cyclesQuery.data ?? []),
    [cyclesQuery.data],
  );
  const calls = useMemo(
    () =>
      (callsQuery.data ?? [])
        .filter((call) => call.cycle.id === cycleId)
        .sort((left, right) => left.sequence - right.sequence),
    [callsQuery.data, cycleId],
  );

  useEffect(() => {
    if (cycles.length === 0) return;
    if (!cycles.some((cycle) => cycle.id === cycleId)) {
      setCycleId(cycles[0].id);
      setCallId("all");
    }
  }, [cycleId, cycles]);

  useEffect(() => {
    if (
      callId !== "all" &&
      !calls.some((selectionCall) => selectionCall.id === callId)
    ) {
      setCallId("all");
    }
  }, [callId, calls]);

  const cycleOptions = useMemo<ProcessContextOption[]>(
    () =>
      cycles.map((cycle) => ({
        id: cycle.id,
        label: `${cycle.label}${cycle.status ? ` — ${CYCLE_STATUS_LABEL[cycle.status]}` : ""}`,
      })),
    [cycles],
  );
  const callOptions = useMemo<ProcessContextOption[]>(
    () => [
      { id: "all", label: "Todas as chamadas" },
      ...calls.map((call) => ({
        id: call.id,
        label: `${call.name} — ${CALL_STATUS_LABEL[call.status]}`,
      })),
    ],
    [calls],
  );

  const changeCycle = (nextCycleId: string) => {
    setCycleId(nextCycleId);
    setCallId("all");
  };

  return {
    cycleId,
    callId,
    cycles,
    calls,
    cycleOptions,
    callOptions,
    selectedCycle: cycles.find((cycle) => cycle.id === cycleId) ?? null,
    selectedCall: calls.find((call) => call.id === callId) ?? null,
    setCycleId: changeCycle,
    setCallId,
    isLoading: cyclesQuery.isLoading || callsQuery.isLoading,
    isError: cyclesQuery.isError || callsQuery.isError,
  };
}
