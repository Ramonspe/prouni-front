"use client";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge, Banner } from "@/components/ui";
import { IconCheck, IconPlus, IconSearch, IconTrash, IconUpload, IconX } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { preselectionApi } from "@/lib/api";
import { maskCpf } from "@/lib/format";
import type { PreselectionEntryDto, PreselectionImportResult, PreselectionInput } from "@prouni/shared";

const EMPTY: PreselectionInput = { cpf: "", fullName: "", courseHint: "", campusHint: "", enemRegistration: "" };

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ConfiguracoesPage() {
  const { user } = useRequireStaff();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PreselectionInput>(EMPTY);
  const [importResult, setImportResult] = useState<PreselectionImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const query = useQuery({
    queryKey: ["admin", "preselection"],
    queryFn: () => preselectionApi.list(),
    enabled: !!user,
  });
  const all = useMemo(() => query.data ?? [], [query.data]);
  const rows = all.filter((e) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return e.cpf.replace(/\D/g, "").includes(s.replace(/\D/g, "")) || (e.fullName ?? "").toLowerCase().includes(s);
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "preselection"] });
  const resetForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); };

  const saveMut = useMutation({
    mutationFn: () => (editingId ? preselectionApi.update(editingId, form) : preselectionApi.create(form)),
    onSuccess: () => { invalidate(); resetForm(); },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => preselectionApi.remove(id),
    onSuccess: invalidate,
  });
  const importMut = useMutation({
    mutationFn: (file: File) => preselectionApi.import(file),
    onSuccess: (r) => { setImportResult(r); invalidate(); if (fileRef.current) fileRef.current.value = ""; },
  });

  const set = (k: keyof PreselectionInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const startEdit = (e: PreselectionEntryDto) => {
    setEditingId(e.id);
    setForm({ cpf: e.cpf, fullName: e.fullName ?? "", courseHint: e.courseHint ?? "", campusHint: e.campusHint ?? "", enemRegistration: e.enemRegistration ?? "" });
    setShowForm(true);
  };

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações", "Pré-selecionados"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Pré-selecionados</h1>
            <p className="page-subtitle">Cadastro e importação dos candidatos pré-selecionados (MEC ou adesão institucional) do ciclo ativo.</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              <IconPlus size={14} /> Novo pré-selecionado
            </button>
          )}
        </div>

        {!isAdmin && (
          <Banner tone="info" title="Acesso somente leitura">
            Apenas administradores podem cadastrar, editar, excluir ou importar pré-selecionados.
          </Banner>
        )}

        {/* Importação */}
        {isAdmin && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><h3 className="h-card-title">Importar planilha (CSV ou Excel)</h3></div>
            <div className="card-body">
              <p className="muted small" style={{ marginBottom: 10 }}>
                A planilha deve ter um cabeçalho com a coluna <strong>CPF</strong> (obrigatória) e, opcionalmente,
                <span className="mono"> Nome</span>, <span className="mono">Curso</span>, <span className="mono">Campus</span> e <span className="mono">ENEM</span>.
                CPFs já existentes são atualizados; inválidos são ignorados.
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="input" style={{ maxWidth: 360 }} />
                <button
                  className="btn btn-secondary"
                  disabled={importMut.isPending}
                  onClick={() => { const f = fileRef.current?.files?.[0]; if (f) { setImportResult(null); importMut.mutate(f); } }}
                >
                  <IconUpload size={14} /> {importMut.isPending ? "Importando…" : "Importar"}
                </button>
              </div>
              {importMut.isError && <p className="upload-meta error" style={{ marginTop: 8 }}>{(importMut.error as Error).message}</p>}
              {importResult && (
                <div style={{ marginTop: 12 }}>
                  <Banner tone={importResult.errors.length ? "warn" : "success"} title="Importação concluída">
                    {importResult.created} criado(s) · {importResult.updated} atualizado(s) · {importResult.skipped} ignorado(s).
                  </Banner>
                  {importResult.errors.length > 0 && (
                    <div className="muted small" style={{ marginTop: 8, maxHeight: 160, overflow: "auto" }}>
                      {importResult.errors.map((er, i) => (
                        <div key={i}>Linha {er.line}: {er.cpf || "(sem CPF)"} — {er.reason}</div>
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
              <h3 className="h-card-title">{editingId ? "Editar pré-selecionado" : "Novo pré-selecionado"}</h3>
              <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={resetForm}><IconX size={14} /></button>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div className="field">
                  <label className="field-label">CPF<span className="req">*</span></label>
                  <input className="input" placeholder="000.000.000-00" inputMode="numeric" maxLength={14} value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))} />
                </div>
                <div className="field">
                  <label className="field-label">Nome completo</label>
                  <input className="input" maxLength={120} value={form.fullName ?? ""} onChange={set("fullName")} />
                </div>
                <div className="field">
                  <label className="field-label">Curso</label>
                  <input className="input" maxLength={120} value={form.courseHint ?? ""} onChange={set("courseHint")} />
                </div>
                <div className="field">
                  <label className="field-label">Campus</label>
                  <input className="input" placeholder="SCS / SP" maxLength={40} value={form.campusHint ?? ""} onChange={set("campusHint")} />
                </div>
                <div className="field">
                  <label className="field-label">Inscrição ENEM</label>
                  <input className="input" inputMode="numeric" maxLength={12} value={form.enemRegistration ?? ""} onChange={(e) => setForm((f) => ({ ...f, enemRegistration: e.target.value.replace(/\D/g, "").slice(0, 12) }))} />
                </div>
              </div>
              {saveMut.isError && <p className="upload-meta error" style={{ marginTop: 10 }}>{(saveMut.error as Error).message}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" disabled={saveMut.isPending || !form.cpf.trim()} onClick={() => saveMut.mutate()}>
                  <IconCheck size={14} /> {saveMut.isPending ? "Salvando…" : "Salvar"}
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Busca + tabela */}
        <div className="search-input" style={{ width: 320, background: "#fff", border: "1px solid var(--ink-200)", marginBottom: 12 }}>
          <IconSearch size={14} />
          <input placeholder="Buscar por CPF ou nome…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>CPF</th><th>Nome</th><th>Curso</th><th>Campus</th><th>ENEM</th><th>Situação</th><th>Cadastrado</th><th></th></tr>
            </thead>
            <tbody>
              {query.isLoading || !user ? (
                <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando…</td></tr>
              ) : query.isError ? (
                <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum pré-selecionado.</td></tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.cpf}</td>
                    <td>{e.fullName ?? <span className="muted small">—</span>}</td>
                    <td>{e.courseHint ?? <span className="muted small">—</span>}</td>
                    <td>{e.campusHint ?? <span className="muted small">—</span>}</td>
                    <td className="mono">{e.enemRegistration ?? <span className="muted small">—</span>}</td>
                    <td>{e.claimed ? <Badge tone="success">Inscrito</Badge> : <Badge tone="neutral">Disponível</Badge>}</td>
                    <td className="muted small">{fmtWhen(e.createdAt)}</td>
                    <td>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(e)}>Editar</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={e.claimed || removeMut.isPending}
                            title={e.claimed ? "Já possui inscrição — não pode excluir" : "Excluir"}
                            onClick={() => { if (confirm(`Excluir o pré-selecionado ${e.cpf}?`)) removeMut.mutate(e.id); }}
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--ink-200)", background: "var(--ink-50)", color: "var(--ink-600)", fontSize: 12.5 }}>
            {rows.length} de {all.length} pré-selecionado(s) {removeMut.isError ? `· ${(removeMut.error as Error).message}` : ""}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
