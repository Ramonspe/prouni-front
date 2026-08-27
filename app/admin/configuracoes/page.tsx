"use client";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProcessContextSelector } from "@/components/process-context-selector";
import { SelectionCallForm } from "@/components/selection-call-form";
import { Badge, Banner } from "@/components/ui";
import {
  IconCheck,
  IconLock,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUpload,
  IconUser,
  IconX,
} from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import {
  authApi,
  coursesApi,
  preselectionApi,
  selectionCallsApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { maskCpf } from "@/lib/format";
import { useAdminProcessContext } from "@/lib/use-admin-process-context";
import {
  PRESELECTION_CALLS,
  type PreselectionCall,
  type PreselectionEntryDto,
  type PreselectionImportResult,
  type PreselectionInput,
  type SelectionCallInput,
  type SelectionCallSummaryDto,
} from "@prouni/shared";

const EMPTY: PreselectionInput = {
  cpf: "",
  fullName: "",
  courseHint: "",
  campusHint: "",
  enemRegistration: "",
  call: "PRIMEIRA",
};

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function callLabel(c: PreselectionCall): string {
  return PRESELECTION_CALLS.find((x) => x.value === c)?.label ?? c;
}
function legacyCallForKind(
  kind: SelectionCallSummaryDto["kind"],
): PreselectionCall {
  if (kind === "SECOND_CALL") return "SEGUNDA";
  if (kind === "WAITLIST") return "ESPERA";
  if (kind === "FIRST_CALL") return "PRIMEIRA";
  return "ESPERA";
}
function entryState(
  entry: PreselectionEntryDto,
): NonNullable<PreselectionEntryDto["state"]> {
  return entry.state ?? (entry.claimed ? "CLAIMED" : "AVAILABLE");
}
function EntryStateBadge({ entry }: { entry: PreselectionEntryDto }) {
  const state = entryState(entry);
  if (state === "CANCELLED") return <Badge tone="danger">Cancelado</Badge>;
  if (state === "CLAIMED") return <Badge tone="success">Reivindicado</Badge>;
  return <Badge tone="neutral">Disponível</Badge>;
}

export default function ConfiguracoesPage() {
  const { user } = useRequireStaff();
  const { setSession } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const canImportPreselection =
    user?.role === "ADMIN" || user?.role === "ANALYST";
  const canRefresh = user?.role === "ADMIN" || user?.role === "ANALYST";
  const processContext = useAdminProcessContext(!!user);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PreselectionInput>(EMPTY);
  const [importResult, setImportResult] =
    useState<PreselectionImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const query = useQuery({
    queryKey: [
      "admin",
      "preselection",
      processContext.cycleId,
      processContext.callId,
    ],
    queryFn: () =>
      preselectionApi.list(
        undefined,
        undefined,
        processContext.cycleId,
        processContext.callId,
      ),
    enabled: !!user && !!processContext.cycleId,
  });
  const all = useMemo(() => query.data ?? [], [query.data]);
  const rows = all.filter((e) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    const digits = s.replace(/\D/g, "");
    return (
      (!!digits && e.cpf.replace(/\D/g, "").includes(digits)) ||
      (e.fullName ?? "").toLowerCase().includes(s)
    );
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "preselection"] });
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  // Campi e cursos reais para as listas suspensas do cadastro (evita digitar
  // nome de curso que não casa — ex.: "Engenharia da/de Computação").
  const campusesQuery = useQuery({
    queryKey: ["campuses"],
    queryFn: () => coursesApi.campuses(),
    enabled: !!user,
  });
  const coursesQuery = useQuery({
    queryKey: ["courses", form.campusHint],
    queryFn: () => coursesApi.courses(form.campusHint || undefined),
    enabled: !!user && !!form.campusHint,
  });
  const selectedFormCall =
    processContext.calls.find((call) => call.id === form.callId) ?? null;
  const selectedFormCourse =
    (coursesQuery.data ?? []).find((course) => course.id === form.courseId) ??
    null;
  const canSave =
    !!form.cpf.trim() && !!selectedFormCall && !!selectedFormCourse;

  const saveMut = useMutation({
    mutationFn: () => {
      if (!selectedFormCall || !selectedFormCourse) {
        throw new Error("Selecione uma chamada e um curso canônicos.");
      }
      const body: PreselectionInput = {
        ...form,
        cycleId: selectedFormCall.cycle.id,
        callId: selectedFormCall.id,
        courseId: selectedFormCourse.id,
        call: legacyCallForKind(selectedFormCall.kind),
        courseHint: selectedFormCourse.name,
        campusHint: selectedFormCourse.campus.code,
      };
      return editingId
        ? preselectionApi.update(editingId, body)
        : preselectionApi.create(body);
    },
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });
  const createCallMut = useMutation({
    mutationFn: (input: SelectionCallInput) => selectionCallsApi.create(input),
    onSuccess: (created) => {
      qc.setQueryData<SelectionCallSummaryDto[]>(
        ["admin", "selection-calls"],
        (current) => {
          const calls = current ?? [];
          return calls.some((call) => call.id === created.id)
            ? calls.map((call) => (call.id === created.id ? created : call))
            : [...calls, created];
        },
      );
      processContext.setCycleId(created.cycle.id);
      processContext.setCallId(created.id);
      setShowCallForm(false);
      void qc.invalidateQueries({ queryKey: ["admin", "selection-calls"] });
    },
  });
  const removeMut = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      preselectionApi.remove(vars.id, vars.reason),
    onSuccess: invalidate,
  });
  const importMut = useMutation({
    mutationFn: (vars: {
      file: File;
      call: PreselectionCall;
      callId: string;
    }) => preselectionApi.import(vars.file, vars.call, vars.callId),
    onSuccess: (r) => {
      setImportResult(r);
      invalidate();
      if (fileRef.current) fileRef.current.value = "";
    },
  });
  const resetPasswordMut = useMutation({
    mutationFn: (vars: { candidateId: string; password: string }) =>
      authApi.resetCandidatePassword(vars.candidateId, vars.password),
  });
  const impersonateMut = useMutation({
    mutationFn: (candidateId: string) => authApi.impersonate(candidateId),
    onSuccess: (session) => {
      setSession(session.accessToken, session.user);
      router.replace("/painel");
    },
  });

  const set =
    (k: keyof PreselectionInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const startCreate = () => {
    const call = processContext.selectedCall;
    if (!call) return;
    setEditingId(null);
    setForm({
      ...EMPTY,
      cycleId: call.cycle.id,
      callId: call.id,
      call: legacyCallForKind(call.kind),
    });
    setShowForm(true);
  };
  const startEdit = (e: PreselectionEntryDto) => {
    if (entryState(e) !== "AVAILABLE") return;
    setEditingId(e.id);
    setForm({
      cpf: e.cpf,
      fullName: e.fullName ?? "",
      courseHint: e.course?.name ?? e.courseHint ?? "",
      campusHint: e.course?.campus.code ?? e.campusHint ?? "",
      enemRegistration: e.enemRegistration ?? "",
      call: e.call,
      cycleId: e.cycle?.id ?? processContext.cycleId,
      callId: e.selectionCall?.id,
      courseId: e.course?.id,
    });
    setShowForm(true);
  };
  const cancelEntry = (entry: PreselectionEntryDto) => {
    if (entryState(entry) !== "AVAILABLE") return;
    const reason = window.prompt(
      `Informe o motivo do cancelamento de ${entry.fullName ?? entry.cpf}.`,
    );
    if (!reason?.trim()) return;
    if (
      window.confirm(
        `Cancelar esta oportunidade ainda não iniciada?\n\nMotivo: ${reason.trim()}`,
      )
    ) {
      removeMut.mutate({ id: entry.id, reason: reason.trim() });
    }
  };
  const changeCycle = (cycleId: string) => {
    resetForm();
    setShowCallForm(false);
    setImportResult(null);
    processContext.setCycleId(cycleId);
  };
  const changeCall = (callId: string) => {
    resetForm();
    setShowCallForm(false);
    setImportResult(null);
    processContext.setCallId(callId);
  };
  const resetCandidatePassword = (e: PreselectionEntryDto) => {
    if (!e.candidateUserId) return;
    const password = window.prompt(
      `Defina a nova senha de ${e.fullName ?? e.cpf}.`,
    );
    if (!password) return;
    if (
      !window.confirm(
        "A senha atual do candidato será substituída e todas as sessões dele serão encerradas. Continuar?",
      )
    )
      return;
    resetPasswordMut.mutate({ candidateId: e.candidateUserId, password });
  };
  const impersonateCandidate = (e: PreselectionEntryDto) => {
    if (!e.candidateUserId) return;
    if (
      window.confirm(
        `Agir como ${e.fullName ?? e.cpf}? Você poderá voltar ao modo administrador a qualquer momento.`,
      )
    ) {
      impersonateMut.mutate(e.candidateUserId);
    }
  };

  return (
    <AppShell
      role="admin"
      crumbs={["PROUNI · Admin", "Configurações", "Pré-selecionados"]}
    >
      <div className="content fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <h1 className="page-title">Pré-selecionados</h1>
            <p className="page-subtitle">
              Cadastro e importação de candidatos no ciclo e na chamada
              selecionados.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canRefresh && (
              <button
                className="btn btn-ghost"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
              >
                <IconRefresh size={14} />{" "}
                {query.isFetching ? "Atualizando…" : "Atualizar"}
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  className="btn btn-ghost"
                  disabled={
                    !processContext.selectedCycle || createCallMut.isPending
                  }
                  onClick={() => {
                    createCallMut.reset();
                    setShowCallForm((current) => !current);
                  }}
                >
                  <IconPlus size={14} /> Criar chamada
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!processContext.selectedCall}
                  title={
                    processContext.selectedCall
                      ? "Cadastrar candidato nesta chamada"
                      : "Selecione ou crie uma chamada específica"
                  }
                  onClick={startCreate}
                >
                  <IconPlus size={14} /> Novo pré-selecionado
                </button>
              </>
            )}
          </div>
        </div>

        <ProcessContextSelector
          cycles={processContext.cycleOptions}
          calls={processContext.callOptions}
          cycleId={processContext.cycleId}
          callId={processContext.callId}
          onCycleChange={changeCycle}
          onCallChange={changeCall}
          legend="Ciclo e chamada dos pré-selecionados"
          helperText="A lista, o cadastro e a importação respeitam este contexto."
          disabled={processContext.isLoading}
        />
        {processContext.isError && (
          <Banner tone="danger" title="Não foi possível carregar o contexto">
            Atualize a página ou tente novamente em instantes.
          </Banner>
        )}

        {isAdmin && showCallForm && processContext.selectedCycle && (
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <SelectionCallForm
              key={`create-call-${processContext.selectedCycle.id}`}
              cycleId={processContext.selectedCycle.id}
              cycleLabel={processContext.selectedCycle.label}
              suggestedSequence={
                Math.max(
                  0,
                  ...processContext.calls.map((call) => call.sequence),
                ) + 1
              }
              pending={createCallMut.isPending}
              error={
                createCallMut.isError
                  ? (createCallMut.error as Error).message
                  : null
              }
              onSubmit={(input) => createCallMut.mutate(input)}
              onCancel={() => {
                createCallMut.reset();
                setShowCallForm(false);
              }}
            />
          </div>
        )}

        {canImportPreselection && !processContext.selectedCall && !showCallForm && (
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <Banner tone="info" title="Escolha a chamada que receberá os candidatos">
              Para importar pré-selecionados, selecione uma chamada específica.
              {isAdmin
                ? " Se ela ainda não existir neste ciclo, use “Criar chamada” acima."
                : " Solicite a criação da chamada à administração, se necessário."}{" "}
              O modo “Todas as chamadas” é apenas para consulta do histórico.
            </Banner>
          </div>
        )}

        {!canImportPreselection && (
          <Banner tone="info" title="Acesso somente leitura">
            Seu perfil pode consultar a lista. Cadastro, edição, cancelamento e
            importação são feitos por administradores.
          </Banner>
        )}

        {/* Importação */}
        {canImportPreselection && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <h3 className="h-card-title">Importar planilha (CSV ou Excel)</h3>
            </div>
            <div className="card-body">
              <p className="muted small" style={{ marginBottom: 10 }}>
                A planilha deve conter <strong>CPF</strong> e{" "}
                <strong>Curso</strong>. Informe <strong>Campus</strong> quando o
                mesmo curso existir em mais de uma unidade. Nome e ENEM são
                opcionais; conflitos são apresentados por linha sem sobrescrever
                oportunidades reivindicadas.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="input"
                  style={{ maxWidth: 320, alignSelf: "flex-end" }}
                />
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: "flex-end" }}
                  disabled={importMut.isPending || !processContext.selectedCall}
                  title={
                    processContext.selectedCall
                      ? "Importar para a chamada selecionada"
                      : "Selecione uma chamada específica"
                  }
                  onClick={() => {
                    const file = fileRef.current?.files?.[0];
                    const call = processContext.selectedCall;
                    if (file && call) {
                      setImportResult(null);
                      importMut.mutate({
                        file,
                        call: legacyCallForKind(call.kind),
                        callId: call.id,
                      });
                    }
                  }}
                >
                  <IconUpload size={14} />{" "}
                  {importMut.isPending ? "Importando…" : "Importar"}
                </button>
              </div>
              <p className="muted small" style={{ marginTop: 8 }}>
                {processContext.selectedCall ? (
                  <>
                    Destino:{" "}
                    <strong>{processContext.selectedCycle?.label}</strong> /{" "}
                    <strong>{processContext.selectedCall.name}</strong>.
                  </>
                ) : (
                  <strong>
                    Selecione uma chamada específica no contexto acima.
                  </strong>
                )}
              </p>
              {importMut.isError && (
                <p className="upload-meta error" style={{ marginTop: 8 }}>
                  {(importMut.error as Error).message}
                </p>
              )}
              {importResult && (
                <div style={{ marginTop: 12 }}>
                  <Banner
                    tone={importResult.errors.length ? "warn" : "success"}
                    title="Importação concluída"
                  >
                    {importResult.created} criado(s) · {importResult.updated}{" "}
                    atualizado(s) · {importResult.skipped} ignorado(s).
                  </Banner>
                  {importResult.errors.length > 0 && (
                    <div
                      className="muted small"
                      style={{ marginTop: 8, maxHeight: 160, overflow: "auto" }}
                    >
                      {importResult.errors.map((er, i) => (
                        <div key={i}>
                          Linha {er.line}: {er.cpf || "(sem CPF)"} — {er.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulário criar/editar */}
        {isAdmin && showForm && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <h3 className="h-card-title">
                {editingId ? "Editar pré-selecionado" : "Novo pré-selecionado"}
              </h3>
              <button
                className="icon-btn"
                style={{ marginLeft: "auto" }}
                onClick={resetForm}
              >
                <IconX size={14} />
              </button>
            </div>
            <div className="card-body">
              <div
                className="rgrid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                }}
              >
                <div className="field">
                  <label className="field-label">
                    CPF<span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={14}
                    value={form.cpf}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label">Nome completo</label>
                  <input
                    className="input"
                    maxLength={120}
                    value={form.fullName ?? ""}
                    onChange={set("fullName")}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Campus</label>
                  <select
                    className="input"
                    value={form.campusHint ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        campusHint: e.target.value,
                        courseHint: "",
                        courseId: undefined,
                      }))
                    }
                  >
                    <option value="">Selecione o campus…</option>
                    {(campusesQuery.data ?? []).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Curso</label>
                  <select
                    className="input"
                    value={form.courseId ?? ""}
                    onChange={(e) => {
                      const course = (coursesQuery.data ?? []).find(
                        (item) => item.id === e.target.value,
                      );
                      setForm((f) => ({
                        ...f,
                        courseId: course?.id,
                        courseHint: course?.name ?? "",
                        campusHint: course?.campus.code ?? f.campusHint,
                      }));
                    }}
                    disabled={!form.campusHint}
                  >
                    <option value="">
                      {form.campusHint
                        ? "Selecione o curso…"
                        : "Selecione o campus primeiro"}
                    </option>
                    {(coursesQuery.data ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Inscrição ENEM</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={12}
                    value={form.enemRegistration ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        enemRegistration: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 12),
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label">Chamada</label>
                  <select
                    className="input"
                    value={form.callId ?? ""}
                    onChange={(e) => {
                      const call = processContext.calls.find(
                        (item) => item.id === e.target.value,
                      );
                      setForm((f) => ({
                        ...f,
                        cycleId: call?.cycle.id ?? f.cycleId,
                        callId: call?.id,
                        call: call
                          ? legacyCallForKind(call.kind)
                          : (f.call ?? "PRIMEIRA"),
                      }));
                    }}
                  >
                    <option value="">Selecione a chamada…</option>
                    {processContext.calls.map((call) => (
                      <option key={call.id} value={call.id}>
                        {call.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {saveMut.isError && (
                <p className="upload-meta error" style={{ marginTop: 10 }}>
                  {(saveMut.error as Error).message}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  disabled={saveMut.isPending || !canSave}
                  onClick={() => saveMut.mutate()}
                >
                  <IconCheck size={14} />{" "}
                  {saveMut.isPending ? "Salvando…" : "Salvar"}
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Busca + filtro + tabela */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            className="search-input"
            style={{
              width: 320,
              background: "#fff",
              border: "1px solid var(--ink-200)",
            }}
          >
            <IconSearch size={14} />
            <input
              placeholder="Buscar por CPF ou nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>CPF</th>
                <th>Candidato e contato</th>
                <th>Ciclo</th>
                <th>Chamada</th>
                <th>Curso / campus</th>
                <th>ENEM</th>
                <th>Estado</th>
                <th>Cadastrado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading || !user ? (
                <tr>
                  <td
                    colSpan={9}
                    className="muted"
                    style={{ padding: 20, textAlign: "center" }}
                  >
                    Carregando…
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td
                    colSpan={9}
                    className="muted"
                    style={{ padding: 20, textAlign: "center" }}
                  >
                    Não foi possível carregar.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="muted"
                    style={{ padding: 20, textAlign: "center" }}
                  >
                    Nenhum pré-selecionado.
                  </td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.cpf}</td>
                    <td>
                      <div>
                        {e.fullName ?? <span className="muted small">—</span>}
                      </div>
                      {e.claimed && (e.contactEmail || e.contactPhone) && (
                        <div
                          className="muted small"
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 3,
                            flexWrap: "wrap",
                          }}
                        >
                          {e.contactEmail && (
                            <a href={`mailto:${e.contactEmail}`}>
                              {e.contactEmail}
                            </a>
                          )}
                          {e.contactPhone && (
                            <a
                              href={`tel:${e.contactPhone.replace(/\D/g, "")}`}
                            >
                              {e.contactPhone}
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {e.cycle?.label ?? <span className="muted small">—</span>}
                    </td>
                    <td>
                      <div>{e.selectionCall?.name ?? callLabel(e.call)}</div>
                      {e.selectionCall?.code && (
                        <div className="muted small mono">
                          {e.selectionCall.code}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        {e.course?.name ?? e.courseHint ?? (
                          <span className="muted small">—</span>
                        )}
                      </div>
                      <div className="muted small">
                        {e.course?.campus.name ??
                          e.course?.campus.code ??
                          e.campusHint ??
                          "—"}
                      </div>
                    </td>
                    <td className="mono">
                      {e.enemRegistration ?? (
                        <span className="muted small">—</span>
                      )}
                    </td>
                    <td>
                      <EntryStateBadge entry={e} />
                    </td>
                    <td className="muted small">{fmtWhen(e.createdAt)}</td>
                    <td>
                      {isAdmin && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={entryState(e) !== "AVAILABLE"}
                            title={
                              entryState(e) === "CLAIMED"
                                ? "Oportunidades reivindicadas não podem ser editadas"
                                : entryState(e) === "CANCELLED"
                                  ? "Oportunidade cancelada"
                                  : "Editar"
                            }
                            onClick={() => startEdit(e)}
                          >
                            Editar
                          </button>
                          {e.candidateUserId && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={resetPasswordMut.isPending}
                                onClick={() => resetCandidatePassword(e)}
                                title="Redefinir senha do candidato"
                              >
                                <IconLock size={13} /> Senha
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                disabled={impersonateMut.isPending}
                                onClick={() => impersonateCandidate(e)}
                                title="Entrar temporariamente na conta do candidato"
                              >
                                <IconUser size={13} /> Agir como usuário
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={
                              entryState(e) !== "AVAILABLE" ||
                              removeMut.isPending
                            }
                            title={
                              entryState(e) === "CANCELLED"
                                ? "Oportunidade já cancelada"
                                : entryState(e) === "CLAIMED"
                                  ? "A inscrição já foi iniciada; use o fluxo formal de encerramento"
                                  : "Cancelar oportunidade ainda não iniciada"
                            }
                            onClick={() => cancelEntry(e)}
                          >
                            <IconTrash size={13} /> Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--ink-200)",
              background: "var(--ink-50)",
              color: "var(--ink-600)",
              fontSize: 12.5,
            }}
          >
            {rows.length} de {all.length} pré-selecionado(s){" "}
            {removeMut.isError ? `· ${(removeMut.error as Error).message}` : ""}
            {resetPasswordMut.isError
              ? ` · ${(resetPasswordMut.error as Error).message}`
              : ""}
            {impersonateMut.isError
              ? ` · ${(impersonateMut.error as Error).message}`
              : ""}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
