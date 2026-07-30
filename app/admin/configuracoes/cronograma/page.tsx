"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CallScheduleInput,
  CycleDto,
  SelectionCallInput,
  SelectionCallStatus,
} from "@prouni/shared";
import { AppShell } from "@/components/app-shell";
import { ProcessContextSelector } from "@/components/process-context-selector";
import { SelectionCallForm } from "@/components/selection-call-form";
import {
  ScheduleEditor,
  createEmptyScheduleEditorValue,
  scheduleWindowsToEditorValue,
  type ScheduleEditorValue,
} from "@/components/schedule-editor";
import { Badge, Banner } from "@/components/ui";
import { IconPlus } from "@/components/icons";
import { cyclesApi, selectionCallsApi } from "@/lib/api";
import { formatBrasiliaDateTime } from "@/lib/brasilia-time";
import { useRequireStaff } from "@/lib/use-require-auth";
import { canManageSchedule } from "@/lib/permissions";
import styles from "./schedule-page.module.css";

const STATUS_LABELS: Record<SelectionCallStatus, string> = {
  DRAFT: "Em configuração",
  PUBLISHED: "Publicada",
  CLOSED: "Encerrada",
  ARCHIVED: "Arquivada",
};

function statusTone(
  status: SelectionCallStatus,
): "neutral" | "info" | "success" | "warning" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

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

function revisionKey(
  detail: Awaited<ReturnType<typeof selectionCallsApi.get>>,
): string {
  if (detail.draftSchedule) return `${detail.id}:draft:${detail.draftSchedule.id}`;
  if (detail.activeSchedule) return `${detail.id}:active:${detail.activeSchedule.id}`;
  return `${detail.id}:empty`;
}

export default function CronogramaPage() {
  const { user } = useRequireStaff();
  const queryClient = useQueryClient();
  const canManage = canManageSchedule(user);
  const [cycleId, setCycleId] = useState("");
  const [callId, setCallId] = useState("");
  const [editorValue, setEditorValue] = useState<ScheduleEditorValue>(
    createEmptyScheduleEditorValue,
  );
  const [dirty, setDirty] = useState(false);
  const [callForm, setCallForm] = useState<"create" | "edit" | null>(null);
  const loadedRevision = useRef("");

  const callsQuery = useQuery({
    queryKey: ["admin", "selection-calls"],
    queryFn: () => selectionCallsApi.list(),
    enabled: Boolean(user),
  });

  const cyclesQuery = useQuery({
    queryKey: ["cycles"],
    queryFn: () => cyclesApi.list(),
    enabled: Boolean(user),
  });

  const calls = useMemo(() => callsQuery.data ?? [], [callsQuery.data]);
  const cycles = useMemo(
    () => sortCycles(cyclesQuery.data ?? []),
    [cyclesQuery.data],
  );
  const callsInCycle = useMemo(
    () =>
      calls
        .filter((call) => call.cycle.id === cycleId)
        .sort((left, right) => left.sequence - right.sequence),
    [calls, cycleId],
  );

  useEffect(() => {
    if (
      cycles.length > 0 &&
      !cycles.some((cycle) => cycle.id === cycleId)
    ) {
      setCycleId(cycles[0].id);
    }
  }, [cycleId, cycles]);

  useEffect(() => {
    if (
      callsInCycle.length > 0 &&
      !callsInCycle.some((call) => call.id === callId)
    ) {
      setCallId(callsInCycle[0].id);
    } else if (callsInCycle.length === 0 && callId) {
      setCallId("");
    }
  }, [callId, callsInCycle]);

  const detailQuery = useQuery({
    queryKey: ["admin", "selection-calls", callId],
    queryFn: () => selectionCallsApi.get(callId),
    enabled: Boolean(user && callId),
  });

  const detail = detailQuery.data?.id === callId ? detailQuery.data : null;

  useEffect(() => {
    if (!detail) return;
    const nextRevision = revisionKey(detail);
    if (loadedRevision.current === nextRevision) return;

    const schedule = detail.draftSchedule ?? detail.activeSchedule;
    setEditorValue(scheduleWindowsToEditorValue(schedule?.windows));
    setDirty(false);
    loadedRevision.current = nextRevision;
  }, [detail]);

  const saveDraftMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CallScheduleInput;
    }) => selectionCallsApi.saveDraft(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["admin", "selection-calls", updated.id],
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "selection-calls"],
      });
      setDirty(false);
      loadedRevision.current = "";
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => selectionCallsApi.publish(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["admin", "selection-calls", updated.id],
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "selection-calls"],
      });
      setDirty(false);
      loadedRevision.current = "";
    },
  });

  const callMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id?: string;
      input: SelectionCallInput;
    }) =>
      id
        ? selectionCallsApi.update(id, input)
        : selectionCallsApi.create(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["admin", "selection-calls", updated.id],
        updated,
      );
      queryClient.setQueryData<
        Awaited<ReturnType<typeof selectionCallsApi.list>>
      >(["admin", "selection-calls"], (current) => {
        const items = current ?? [];
        const exists = items.some((call) => call.id === updated.id);
        return exists
          ? items.map((call) => (call.id === updated.id ? updated : call))
          : [...items, updated];
      });
      setCycleId(updated.cycle.id);
      setCallId(updated.id);
      setEditorValue(
        scheduleWindowsToEditorValue(
          updated.draftSchedule?.windows ?? updated.activeSchedule?.windows,
        ),
      );
      setDirty(false);
      setCallForm(null);
      loadedRevision.current = "";
      void queryClient.invalidateQueries({
        queryKey: ["admin", "selection-calls"],
      });
    },
  });

  const confirmDiscard = () =>
    !dirty ||
    window.confirm(
      "Há alterações não salvas neste cronograma. Deseja descartá-las e trocar o contexto?",
    );

  const resetForCall = (nextCallId: string) => {
    setCallId(nextCallId);
    setEditorValue(createEmptyScheduleEditorValue());
    setDirty(false);
    loadedRevision.current = "";
    saveDraftMutation.reset();
    publishMutation.reset();
    callMutation.reset();
    setCallForm(null);
  };

  const selectCall = (nextCallId: string) => {
    if (!confirmDiscard()) return;
    resetForCall(nextCallId);
  };

  const selectCycle = (nextCycleId: string) => {
    if (!confirmDiscard()) return;
    setCycleId(nextCycleId);
    const nextCall = calls
      .filter((call) => call.cycle.id === nextCycleId)
      .sort((left, right) => left.sequence - right.sequence)[0];
    resetForCall(nextCall?.id ?? "");
  };

  const changeEditor = (nextValue: ScheduleEditorValue) => {
    if (!canManage) return;
    setEditorValue(nextValue);
    setDirty(true);
    saveDraftMutation.reset();
    publishMutation.reset();
  };

  const publish = () => {
    if (!canManage || !detail?.draftSchedule || dirty) return;
    const confirmed = window.confirm(
      "Publicar este cronograma agora? Os horários passarão a controlar imediatamente o acesso dos candidatos desta chamada.",
    );
    if (confirmed) publishMutation.mutate(detail.id);
  };

  return (
    <AppShell
      role="admin"
      crumbs={["PROUNI · Admin", "Configurações", "Cronograma e prazos"]}
    >
      <div className="content fade-in">
        <div className={styles.pageHeader}>
          <div>
            <h1 className="page-title">Cronograma e prazos</h1>
            <p className="page-subtitle">
              Configure separadamente novas inscrições, primeiro envio e
              correção de pendências para cada chamada.
            </p>
          </div>
          {canManage && (
            <button
              className="btn btn-primary"
              type="button"
              disabled={cycles.length === 0 || callMutation.isPending}
              onClick={() => {
                callMutation.reset();
                setCallForm("create");
              }}
            >
              <IconPlus size={14} /> Nova chamada
            </button>
          )}
        </div>

        {!canManage && user && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="info" title="Modo somente leitura">
              Você pode consultar chamadas e cronogramas. Para criar ou editar
              chamadas, salvar rascunhos e publicar prazos, solicite a permissão
              de gestão de cronogramas a um administrador.
            </Banner>
          </div>
        )}

        {callsQuery.isLoading || cyclesQuery.isLoading ? (
          <div className="card card-pad">
            <p className="muted">Carregando ciclos e chamadas…</p>
          </div>
        ) : callsQuery.isError || cyclesQuery.isError ? (
          <Banner tone="danger" title="Não foi possível carregar as chamadas">
            {((callsQuery.error ?? cyclesQuery.error) as Error).message}
          </Banner>
        ) : cycles.length === 0 ? (
          <Banner tone="info" title="Nenhum ciclo disponível">
            Cadastre um ciclo antes de configurar suas chamadas e janelas.
          </Banner>
        ) : (
          <>
            <ProcessContextSelector
              cycles={cycles.map((cycle) => ({
                id: cycle.id,
                label: `${cycle.label}${cycle.status === "ACTIVE" ? " (ativo)" : ""}`,
              }))}
              calls={callsInCycle.map((call) => ({
                id: call.id,
                label: `${call.sequence}. ${call.name} — ${STATUS_LABELS[call.status]}`,
              }))}
              cycleId={cycleId}
              callId={callId}
              cycleLabel="Ciclo"
              callLabel="Chamada"
              legend="Contexto do cronograma"
              helperText="As janelas abaixo afetam somente a chamada selecionada."
              disabled={
                saveDraftMutation.isPending ||
                publishMutation.isPending ||
                callMutation.isPending
              }
              onCycleChange={selectCycle}
              onCallChange={selectCall}
            />

            {callForm === "create" && canManage && (
              <div style={{ marginTop: 14 }}>
                <SelectionCallForm
                  key={`create-${cycleId}`}
                  cycleId={cycleId}
                  cycleLabel={
                    cycles.find((cycle) => cycle.id === cycleId)?.label ?? "—"
                  }
                  suggestedSequence={
                    Math.max(
                      0,
                      ...callsInCycle.map((call) => call.sequence),
                    ) + 1
                  }
                  pending={callMutation.isPending}
                  error={
                    callMutation.isError
                      ? (callMutation.error as Error).message
                      : null
                  }
                  onSubmit={(input) => callMutation.mutate({ input })}
                  onCancel={() => {
                    callMutation.reset();
                    setCallForm(null);
                  }}
                />
              </div>
            )}

            {callsInCycle.length === 0 ? (
              <div className={styles.feedback}>
                <Banner tone="info" title="Este ciclo ainda não possui chamadas">
                  {canManage
                    ? "Use “Nova chamada” para cadastrar a primeira chamada deste ciclo e então definir seu cronograma."
                    : "Ainda não há uma chamada cadastrada neste ciclo. Os parâmetros globais continuam disponíveis em “Parâmetros do sistema”."}
                </Banner>
              </div>
            ) : !callId || detailQuery.isLoading || !detail ? (
              detailQuery.isError ? (
                <div className={styles.feedback}>
                  <Banner
                    tone="danger"
                    title="Não foi possível carregar o cronograma"
                  >
                    {(detailQuery.error as Error).message}
                  </Banner>
                </div>
              ) : (
                <div className="card card-pad" style={{ marginTop: 14 }}>
                  <p className="muted">Carregando cronograma da chamada…</p>
                </div>
              )
            ) : (
              <>
                <div className={styles.callSummary}>
                  <div>
                    <div className={styles.callTitleRow}>
                      <h2>{detail.name}</h2>
                      <Badge tone={statusTone(detail.status)}>
                        {STATUS_LABELS[detail.status]}
                      </Badge>
                      {canManage && detail.status !== "ARCHIVED" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => {
                            callMutation.reset();
                            setCallForm("edit");
                          }}
                        >
                          Editar chamada
                        </button>
                      )}
                    </div>
                    <p>
                      {detail.cycle.label} · código{" "}
                      <span className="mono">{detail.code}</span> · sequência{" "}
                      {detail.sequence} · fuso{" "}
                      <span className="mono">{detail.timeZone}</span>
                    </p>
                  </div>
                  <div className={styles.revisionSummary}>
                    {detail.activeSchedule?.publishedAt ? (
                      <span>
                        Publicado em{" "}
                        <strong>
                          {formatBrasiliaDateTime(
                            detail.activeSchedule.publishedAt,
                          )}
                        </strong>
                      </span>
                    ) : (
                      <span>Ainda não há cronograma em produção.</span>
                    )}
                    {detail.draftSchedule && (
                      <span>
                        Rascunho versão{" "}
                        <strong>{detail.draftSchedule.version}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {callForm === "edit" && canManage && (
                  <div style={{ marginTop: 12 }}>
                    <SelectionCallForm
                      key={`edit-${detail.id}`}
                      cycleId={detail.cycle.id}
                      cycleLabel={detail.cycle.label}
                      call={detail}
                      pending={callMutation.isPending}
                      error={
                        callMutation.isError
                          ? (callMutation.error as Error).message
                          : null
                      }
                      onSubmit={(input) =>
                        callMutation.mutate({ id: detail.id, input })
                      }
                      onCancel={() => {
                        callMutation.reset();
                        setCallForm(null);
                      }}
                    />
                  </div>
                )}

                {detail.draftSchedule && !dirty && (
                  <div className={styles.feedback}>
                    <Banner tone="warn" title="Há um rascunho não publicado">
                      {canManage
                        ? "Revise as três janelas abaixo. O cronograma em produção só será substituído quando você clicar em publicar."
                        : "Existe uma versão de trabalho ainda não publicada. Os candidatos continuam seguindo a versão em produção."}
                    </Banner>
                  </div>
                )}
                {detail.status === "ARCHIVED" && (
                  <div className={styles.feedback}>
                    <Banner tone="info" title="Chamada arquivada">
                      Este cronograma está disponível apenas para consulta e não
                      pode mais ser alterado ou publicado.
                    </Banner>
                  </div>
                )}
                {canManage && dirty && (
                  <div className={styles.feedback}>
                    <Banner tone="info" title="Alterações ainda não salvas">
                      Salve o rascunho antes de publicar. Os candidatos continuam
                      seguindo a versão atualmente em produção.
                    </Banner>
                  </div>
                )}
                {saveDraftMutation.isSuccess && (
                  <div className={styles.feedback}>
                    <Banner tone="success" title="Rascunho salvo">
                      As alterações foram registradas, mas ainda não afetam os
                      candidatos.
                    </Banner>
                  </div>
                )}
                {saveDraftMutation.isError && (
                  <div className={styles.feedback}>
                    <Banner tone="danger" title="Não foi possível salvar">
                      {(saveDraftMutation.error as Error).message}
                    </Banner>
                  </div>
                )}
                {publishMutation.isSuccess && (
                  <div className={styles.feedback}>
                    <Banner tone="success" title="Cronograma publicado">
                      A nova versão já controla as ações desta chamada.
                    </Banner>
                  </div>
                )}
                {publishMutation.isError && (
                  <div className={styles.feedback}>
                    <Banner tone="danger" title="Não foi possível publicar">
                      {(publishMutation.error as Error).message}
                    </Banner>
                  </div>
                )}

                <ScheduleEditor
                  value={editorValue}
                  onChange={changeEditor}
                  onSaveDraft={
                    canManage
                      ? (input) =>
                          saveDraftMutation.mutate({ id: detail.id, input })
                      : undefined
                  }
                  onPublish={canManage ? publish : undefined}
                  disabled={
                    !canManage ||
                    detail.status === "ARCHIVED" ||
                    saveDraftMutation.isPending ||
                    publishMutation.isPending
                  }
                  savingDraft={saveDraftMutation.isPending}
                  publishing={publishMutation.isPending}
                  canPublish={Boolean(
                    canManage &&
                    detail.status !== "ARCHIVED" &&
                      detail.draftSchedule &&
                      !dirty,
                  )}
                  draftVersion={detail.draftSchedule?.version}
                  activeVersion={detail.activeSchedule?.version}
                />

                <div className={styles.globalNote}>
                  <strong>Parâmetros globais continuam separados.</strong>{" "}
                  Salário mínimo, limites de renda, notificações e demais regras
                  gerais permanecem em “Parâmetros do sistema”; esta tela trata
                  somente os prazos da chamada selecionada.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
