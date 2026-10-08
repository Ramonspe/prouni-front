"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge, Banner } from "@/components/ui";
import { IconCheck, IconPlus, IconRefresh, IconX } from "@/components/icons";
import { cyclesApi, selectionCallsApi } from "@/lib/api";
import { useRequireStaff } from "@/lib/use-require-auth";
import type { RmCatalogPreviewDto, SelectionCallInput, SelectionCallKind, SelectionCallSummaryDto } from "@prouni/shared";

type FormState = {
  id: string | null;
  cycleId: string;
  code: string;
  name: string;
  kind: SelectionCallKind;
  sequence: string;
  rmProcessoSeletivoId: string;
};

const KIND_LABEL: Record<SelectionCallKind, string> = {
  FIRST_CALL: "1ª chamada",
  SECOND_CALL: "2ª chamada",
  WAITLIST: "Lista de espera",
  OTHER: "Outra chamada",
};

function emptyForm(cycleId = "", sequence = 1): FormState {
  return {
    id: null,
    cycleId,
    code: "",
    name: "",
    kind: "WAITLIST",
    sequence: String(sequence),
    rmProcessoSeletivoId: "",
  };
}

function formFromCall(call: SelectionCallSummaryDto): FormState {
  return {
    id: call.id,
    cycleId: call.cycle.id,
    code: call.code,
    name: call.name,
    kind: call.kind,
    sequence: String(call.sequence),
    rmProcessoSeletivoId: call.rmProcessoSeletivoId == null ? "" : String(call.rmProcessoSeletivoId),
  };
}

export default function ChamadasRmPage() {
  const { user } = useRequireStaff();
  const queryClient = useQueryClient();
  const canManage = user?.role === "ADMIN" || user?.role === "ANALYST";
  const [cycleId, setCycleId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [rmPreview, setRmPreview] = useState<RmCatalogPreviewDto | null>(null);

  const cycles = useQuery({
    queryKey: ["cycles"],
    queryFn: cyclesApi.list,
    enabled: !!user,
  });
  const calls = useQuery({
    queryKey: ["admin", "selection-calls", cycleId],
    queryFn: () => selectionCallsApi.list(cycleId),
    enabled: !!user && !!cycleId,
  });

  useEffect(() => {
    if (!cycleId && cycles.data?.[0]) setCycleId(cycles.data[0].id);
  }, [cycleId, cycles.data]);

  const nextSequence = useMemo(
    () => Math.max(0, ...(calls.data ?? []).map((call) => call.sequence)) + 1,
    [calls.data],
  );

  const save = useMutation({
    mutationFn: () => {
      const body: SelectionCallInput = {
        cycleId: form.cycleId,
        code: form.code.trim(),
        name: form.name.trim(),
        kind: form.kind,
        sequence: Number(form.sequence),
        rmProcessoSeletivoId: form.rmProcessoSeletivoId ? Number(form.rmProcessoSeletivoId) : undefined,
        timeZone: "America/Sao_Paulo",
      };
      return form.id
        ? selectionCallsApi.update(form.id, body)
        : selectionCallsApi.create(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "selection-calls"] });
      setShowForm(false);
      setRmPreview(null);
      setForm(emptyForm(cycleId, nextSequence));
    },
  });

  const previewRm = useMutation({
    mutationFn: () => selectionCallsApi.previewRmCatalog(form.id!),
    onSuccess: setRmPreview,
  });
  const applyRm = useMutation({
    mutationFn: () => selectionCallsApi.applyRmCatalog(form.id!),
    onSuccess: (preview) => {
      setRmPreview(null);
      setForm((current) => ({ ...current, rmProcessoSeletivoId: String(preview.selected?.idps ?? "") }));
      queryClient.invalidateQueries({ queryKey: ["admin", "selection-calls"] });
    },
  });

  const beginNew = () => {
    setForm(emptyForm(cycleId, nextSequence));
    setShowForm(true);
  };

  const selectedCycle = cycles.data?.find((cycle) => cycle.id === cycleId);
  const validForm =
    form.cycleId &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(form.code.trim()) &&
    form.name.trim() &&
    Number.isInteger(Number(form.sequence)) && Number(form.sequence) > 0 &&
    (!form.rmProcessoSeletivoId || (Number.isInteger(Number(form.rmProcessoSeletivoId)) && Number(form.rmProcessoSeletivoId) > 0));

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações", "Chamadas e RM"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <h1 className="page-title">Chamadas e RM</h1>
            <p className="page-subtitle">
              Defina a chamada do semestre e o processo seletivo correspondente no RM. Cada chamada pode usar um IDPS diferente.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => calls.refetch()} disabled={!cycleId || calls.isFetching}>
              <IconRefresh size={14} /> {calls.isFetching ? "Atualizando…" : "Atualizar"}
            </button>
            {canManage && (
              <button className="btn btn-primary" onClick={beginNew} disabled={!cycleId}>
                <IconPlus size={14} /> Nova chamada
              </button>
            )}
          </div>
        </div>

        <Banner tone="info" title="Como usar">
          Crie a chamada e use “Ler RM” para localizar o único processo PROUNI ativo e montar o DE/PARA dos cursos. A confirmação grava um retrato auditável para a chamada; uma chamada já exportada nunca troca de processo silenciosamente.
        </Banner>

        <div className="field" style={{ maxWidth: 360, marginTop: 16 }}>
          <label className="field-label">Semestre</label>
          <select className="input" value={cycleId} onChange={(event) => { setCycleId(event.target.value); setShowForm(false); }}>
            <option value="">Selecione</option>
            {(cycles.data ?? []).map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}
          </select>
        </div>

        {!canManage ? (
          <Banner tone="info" title="Acesso somente leitura">
            Administradores e analistas com a permissão de cronograma podem cadastrar ou editar chamadas.
          </Banner>
        ) : showForm ? (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h3 className="h-card-title">{form.id ? "Editar chamada" : "Nova chamada"}</h3>
              <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => setShowForm(false)} aria-label="Fechar"><IconX size={14} /></button>
            </div>
            <div className="card-body">
              <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Código interno<span className="req">*</span></label>
                  <input className="input" value={form.code} maxLength={40} placeholder="lista-espera-2027" onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toLowerCase().replace(/\s+/g, "-") }))} />
                </div>
                <div className="field">
                  <label className="field-label">Nome da chamada<span className="req">*</span></label>
                  <input className="input" value={form.name} maxLength={80} placeholder="Lista de espera PROUNI" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Tipo</label>
                  <select className="input" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as SelectionCallKind }))}>
                    {Object.entries(KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Ordem no semestre<span className="req">*</span></label>
                  <input className="input" type="number" min="1" max="999" value={form.sequence} onChange={(event) => setForm((current) => ({ ...current, sequence: event.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Processo seletivo RM (IDPS)</label>
                  <input className="input" type="number" min="1" inputMode="numeric" value={form.rmProcessoSeletivoId} placeholder="Ex.: 103" onChange={(event) => setForm((current) => ({ ...current, rmProcessoSeletivoId: event.target.value.replace(/\D/g, "") }))} />
                  <p className="muted small" style={{ marginTop: 5 }}>Opcional ao criar: salve a chamada e use “Ler RM” para localizar o processo ativo.</p>
                </div>
              </div>
              {form.id && (
                <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="btn btn-ghost" onClick={() => { setRmPreview(null); previewRm.mutate(); }} disabled={previewRm.isPending || applyRm.isPending}>
                    <IconRefresh size={14} /> {previewRm.isPending ? "Lendo RM…" : "Ler RM"}
                  </button>
                  <span className="muted small">Consulta somente leitura: processo PROUNI ativo e áreas ofertadas.</span>
                </div>
              )}
              {previewRm.isError && <Banner tone="danger" title="Não foi possível ler o RM">{(previewRm.error as Error).message}</Banner>}
              {rmPreview && (
                <div className="card" style={{ marginTop: 14, background: "#f6f8fb" }}>
                  <div className="card-body">
                    <strong>Prévia do RM</strong>
                    {rmPreview.selected ? <p className="muted small" style={{ marginTop: 6 }}>Processo encontrado: <b>RM {rmPreview.selected.idps}</b> · {rmPreview.selected.name}</p> : <p className="muted small" style={{ marginTop: 6 }}>Nenhum processo único elegível foi encontrado.</p>}
                    <p className="muted small">{rmPreview.mappings.length} curso(s) resolvido(s) de {rmPreview.areas.length} área(s) ofertada(s) lida(s).</p>
                    {rmPreview.issues.length > 0 && <ul className="muted small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{rmPreview.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
                    {rmPreview.ready && (
                      <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={applyRm.isPending} onClick={() => {
                        if (confirm(`Confirmar o processo RM ${rmPreview.selected?.idps} e os ${rmPreview.mappings.length} DE/PARAs desta chamada?`)) applyRm.mutate();
                      }}>
                        <IconCheck size={14} /> {applyRm.isPending ? "Confirmando…" : "Confirmar processo e DE/PARA"}
                      </button>
                    )}
                    {applyRm.isError && <Banner tone="danger" title="Não foi possível confirmar">{(applyRm.error as Error).message}</Banner>}
                  </div>
                </div>
              )}
              {save.isError && <Banner tone="danger" title="Não foi possível salvar">{(save.error as Error).message}</Banner>}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  className="btn btn-primary"
                  disabled={!validForm || save.isPending}
                  onClick={() => {
                    if (confirm(`Confirmar o processo seletivo RM (IDPS) ${form.rmProcessoSeletivoId} para a chamada "${form.name.trim()}"?`)) save.mutate();
                  }}
                >
                  <IconCheck size={14} /> {save.isPending ? "Salvando…" : "Salvar chamada"}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>Chamada</th><th>Tipo</th><th>Ordem</th><th>Processo RM</th><th>Status</th><th /></tr></thead>
            <tbody>
              {calls.isLoading ? <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando chamadas…</td></tr> :
                calls.isError ? <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar as chamadas.</td></tr> :
                  (calls.data ?? []).length === 0 ? <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhuma chamada cadastrada para {selectedCycle?.label ?? "este semestre"}.</td></tr> :
                    (calls.data ?? []).map((call) => <tr key={call.id}>
                      <td><div>{call.name}</div><div className="muted small mono">{call.code}</div></td>
                      <td>{KIND_LABEL[call.kind]}</td>
                      <td className="mono">{call.sequence}</td>
                      <td className="mono">{call.rmProcessoSeletivoId ?? "Aguardando leitura"}</td>
                      <td><Badge tone={call.status === "PUBLISHED" ? "success" : "neutral"}>{call.status === "PUBLISHED" ? "Publicada" : call.status === "DRAFT" ? "Rascunho" : call.status}</Badge></td>
                      <td>{canManage && <button className="btn btn-ghost btn-sm" onClick={() => { setRmPreview(null); setForm(formFromCall(call)); setShowForm(true); }}>Editar</button>}</td>
                    </tr>)
              }
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
