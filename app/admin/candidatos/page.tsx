"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProcessContextSelector } from "@/components/process-context-selector";
import { Avatar, Banner, StatusBadge } from "@/components/ui";
import { IconArrowDown, IconArrowUp, IconChevL, IconChevR, IconDownload, IconPrint, IconRefresh, IconSearch, IconUpload } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import { useAdminProcessContext } from "@/lib/use-admin-process-context";
import { matchesPersonSearch } from "@/lib/search";
import { PRESELECTION_CALLS, STATUS_MAP, type AdminApplicationRow, type PreselectionCall, type ProcessStatus, type RmBulkExportResult } from "@prouni/shared";

type Tab = "all" | "review" | "pending" | "decided";
type SortKey = "protocol" | "name" | "status" | "updatedAt";
type SortDirection = "asc" | "desc";
const DECIDED: ProcessStatus[] = ["classificado", "espera", "indeferido", "concedida"];
function callLabel(c: PreselectionCall): string {
  return PRESELECTION_CALLS.find((x) => x.value === c)?.label ?? c;
}
function rowCallLabel(row: AdminApplicationRow): string {
  return row.selectionCall?.name ?? callLabel(row.call);
}

function fmtMoney(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  return Number.isNaN(n) ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * Exporta a lista atualmente visível (após abas, busca e filtros) para um CSV
 * compatível com Excel pt-BR: separador `;` e BOM UTF-8 para acentos.
 */
function exportCsv(rows: AdminApplicationRow[]): void {
  const headers = [
    "Protocolo", "Candidato", "CPF", "Curso", "Chamada", "Status",
    "Renda per capita", "Docs aprovados", "Docs enviados", "Analista", "Atualização",
  ];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const body = rows.map((c) =>
    [
      c.protocol,
      c.name,
      c.cpf,
      c.course,
      rowCallLabel(c),
      STATUS_MAP[c.status]?.label ?? c.status,
      c.perCapita ?? "",
      String(c.docsApproved),
      String(c.docsSent),
      c.analyst ?? "Não atribuído",
      fmtWhen(c.updatedAt),
    ].map(esc).join(";"),
  );
  const csv = "﻿" + [headers.map(esc).join(";"), ...body].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidatos-prouni-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CandidatosInner() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loading } = useRequireStaff();
  const searchParams = useSearchParams();
  const processContext = useAdminProcessContext(Boolean(user));
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [analystFilter, setAnalystFilter] = useState("all"); // "all" | "none" | nome do analista
  const [dateFilter, setDateFilter] = useState("all"); // "all" | dias ("1" | "7" | "30")
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRmIds, setSelectedRmIds] = useState<string[]>([]);
  const [bulkExportResult, setBulkExportResult] = useState<RmBulkExportResult | null>(null);
  // Busca vinda da barra do topo (?q=) — sincroniza quando a URL muda.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const query = useQuery({
    queryKey: [
      "admin",
      "applications",
      processContext.cycleId,
      processContext.callId,
    ],
    queryFn: () =>
      adminApi.applications({
        cycleId: processContext.cycleId,
        callId: processContext.callId,
      }),
    enabled: Boolean(user && processContext.cycleId),
  });
  const all = useMemo(() => query.data ?? [], [query.data]);

  // Opções dos filtros derivadas dos dados carregados.
  const courseOptions = useMemo(
    () => Array.from(new Set(all.map((c) => c.course).filter((v) => v && v !== "—"))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [all],
  );
  const analystOptions = useMemo(
    () => Array.from(new Set(all.map((c) => c.analyst).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [all],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(all.map((c) => c.status))),
    [all],
  );

  const byTab = (c: AdminApplicationRow) => {
    if (tab === "pending") return c.status === "pendencia";
    if (tab === "review") return c.status === "analise_socio" || c.status === "analise_doc";
    if (tab === "decided") return DECIDED.includes(c.status);
    return true;
  };
  const bySearch = (c: AdminApplicationRow) => {
    return matchesPersonSearch(c, search);
  };
  const byCourse = (c: AdminApplicationRow) => courseFilter === "all" || c.course === courseFilter;
  const byStatus = (c: AdminApplicationRow) => statusFilter === "all" || c.status === statusFilter;
  const byAnalyst = (c: AdminApplicationRow) =>
    analystFilter === "all" ? true : analystFilter === "none" ? !c.analyst : c.analyst === analystFilter;
  const byDate = (c: AdminApplicationRow) => {
    if (dateFilter === "all") return true;
    const cutoff = Date.now() - Number(dateFilter) * 86_400_000;
    return new Date(c.updatedAt).getTime() >= cutoff;
  };
  const rows = useMemo(() => {
    const compareText = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });
    const multiplier = sortDirection === "asc" ? 1 : -1;

    return all
      .filter(byTab)
      .filter(bySearch)
      .filter(byCourse)
      .filter(byStatus)
      .filter(byAnalyst)
      .filter(byDate)
      .sort((a, b) => {
        if (sortKey === "updatedAt") return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * multiplier;
        if (sortKey === "status") return compareText(STATUS_MAP[a.status].label, STATUS_MAP[b.status].label) * multiplier;
        return compareText(a[sortKey], b[sortKey]) * multiplier;
      });
  }, [all, analystFilter, courseFilter, dateFilter, search, sortDirection, sortKey, statusFilter, tab]);
  const canRefresh = user?.role === "ADMIN" || user?.role === "ANALYST";
  const exportableRows = useMemo(
    () => tab === "decided" ? rows.filter((c) => c.status === "classificado") : [],
    [rows, tab],
  );
  const selectedRmIdSet = useMemo(() => new Set(selectedRmIds), [selectedRmIds]);
  const selectedExportableRmIds = useMemo(
    () => selectedRmIds.filter((id) => exportableRows.some((c) => c.id === id)),
    [exportableRows, selectedRmIds],
  );
  const allExportableSelected = exportableRows.length > 0 && exportableRows.every((c) => selectedRmIdSet.has(c.id));
  const canExportManyToRm = canRefresh && selectedExportableRmIds.length > 0 && tab === "decided";

  useEffect(() => {
    const exportableIds = new Set(exportableRows.map((c) => c.id));
    setSelectedRmIds((current) => {
      const next = current.filter((id) => exportableIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [exportableRows]);

  const exportManyToRmMut = useMutation({
    mutationFn: (applicationIds: string[]) => adminApi.exportManyToRm(applicationIds),
    onSuccess: (result) => {
      setBulkExportResult(result);
      setSelectedRmIds([]);
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
  });

  const toggleRmSelection = (applicationId: string) => {
    setSelectedRmIds((current) =>
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId],
    );
  };

  const toggleAllRmSelection = () => {
    setSelectedRmIds(allExportableSelected ? [] : exportableRows.map((c) => c.id));
  };

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortHeader = (key: SortKey, label: string) => {
    const isActive = key === sortKey;
    const directionLabel = isActive && sortDirection === "asc" ? "crescente" : "decrescente";
    const SortIcon = isActive && sortDirection === "asc" ? IconArrowUp : IconArrowDown;

    return (
      <button
        type="button"
        className={`table-sort-button ${isActive ? "active" : ""}`}
        onClick={() => toggleSort(key)}
        aria-label={`Ordenar por ${label}${isActive ? `, atualmente em ordem ${directionLabel}` : ""}`}
        title={`Ordenar por ${label}${isActive ? ` (${directionLabel})` : ""}`}
      >
        {label} <SortIcon size={13} stroke={2.25} aria-hidden="true" />
      </button>
    );
  };

  const tabs: [Tab, string, number][] = [
    ["all", "Todos", all.length],
    ["review", "Em análise", all.filter((c) => c.status === "analise_socio" || c.status === "analise_doc").length],
    ["pending", "Com pendência", all.filter((c) => c.status === "pendencia").length],
    ["decided", "Decididos", all.filter((c) => DECIDED.includes(c.status)).length],
  ];

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Candidatos"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Candidatos</h1>
            <p className="page-subtitle">Gestão das inscrições por processo e chamada, incluindo históricos.</p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            {canRefresh && <button className="btn btn-ghost" onClick={() => query.refetch()} disabled={query.isFetching}><IconRefresh size={14} /> {query.isFetching ? "Atualizando…" : "Atualizar"}</button>}
            <button className="btn btn-primary" disabled={!canExportManyToRm || exportManyToRmMut.isPending} title={canRefresh ? "Selecione candidatos classificados na aba Decididos para exportar ao RM" : "Apenas administradores e analistas podem exportar ao RM"} onClick={() => { if (confirm(`Exportar ${selectedExportableRmIds.length} candidato(s) selecionado(s) para o RM?`)) { setBulkExportResult(null); exportManyToRmMut.mutate(selectedExportableRmIds); } }}>
              <IconUpload size={14} /> {exportManyToRmMut.isPending ? "Exportando…" : "Exportar para RM"}
            </button>
            <button className="btn btn-ghost" onClick={() => exportCsv(rows)} disabled={rows.length === 0} title="Baixar a lista atual em CSV">
              <IconDownload size={14} /> Exportar CSV
            </button>
            <button className="btn btn-ghost" onClick={() => window.print()} title="Gerar relatório para impressão ou PDF">
              <IconPrint size={14} /> Relatório
            </button>
          </div>
        </div>

        {processContext.cycleOptions.length > 0 && (
          <ProcessContextSelector
            cycles={processContext.cycleOptions}
            calls={processContext.callOptions}
            cycleId={processContext.cycleId}
            callId={processContext.callId}
            onCycleChange={processContext.setCycleId}
            onCallChange={processContext.setCallId}
            disabled={processContext.isLoading}
            helperText="A fila, a exportação e todas as ações abaixo usam este contexto."
          />
        )}

        <div className="tabs">
          {tabs.map(([id, l, n]) => (
            <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {l} <span className="count">{n}</span>
            </button>
          ))}
        </div>

        <div className="rgrid no-print" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, marginBottom: 12, alignItems: "center" }}>
          <div className="search-input" style={{ width: 320, background: "#fff", border: "1px solid var(--ink-200)" }}>
            <IconSearch size={14} />
            <input
              placeholder="Buscar por nome, CPF, protocolo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 180 }} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Filtrar por curso">
            <option value="all">Todos os cursos</option>
            {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{STATUS_MAP[s]?.label ?? s}</option>)}
          </select>
          <select className="input" style={{ width: 190 }} value={analystFilter} onChange={(e) => setAnalystFilter(e.target.value)} aria-label="Filtrar por analista responsável">
            <option value="all">Todos os analistas</option>
            <option value="none">Não atribuído</option>
            {analystOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="input" style={{ width: 160 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} aria-label="Filtrar por período de atualização">
            <option value="all">Qualquer data</option>
            <option value="1">Últimas 24 h</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
          <div style={{ flex: 1 }} />
        </div>

        {exportManyToRmMut.isError && (
          <Banner tone="danger" title="Não foi possível iniciar a exportação">
            {(exportManyToRmMut.error as Error).message}
          </Banner>
        )}

        {bulkExportResult && (
          <div className="card no-print" style={{ marginBottom: 14 }}>
            <div className="card-body">
              <Banner tone={bulkExportResult.failed ? "warn" : "success"} title="Exportação para o RM concluída">
                {bulkExportResult.exported + bulkExportResult.already} de {bulkExportResult.total} integrado(s) com sucesso
                {` · ${bulkExportResult.exported} novo(s) exportado(s)`}
                {bulkExportResult.already ? ` · ${bulkExportResult.already} já cadastrado(s) no RM` : ""}
                {bulkExportResult.failed ? ` · ${bulkExportResult.failed} falha(s)` : ""}.
              </Banner>
              {bulkExportResult.failed > 0 && (
                <div className="muted small" style={{ marginTop: 10, maxHeight: 180, overflow: "auto" }}>
                  {bulkExportResult.items.filter((item) => item.outcome === "failed").map((item) => (
                    <div key={item.applicationId} style={{ marginBottom: 5 }}>
                      <strong>{item.protocol ?? "Inscrição não encontrada"}</strong>
                      {item.candidateName ? ` · ${item.candidateName}` : ""}
                      {` — ${item.message ?? "Falha sem detalhe disponível."}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                {tab === "decided" && (
                  <th style={{ width: 42 }}>
                    <input type="checkbox" checked={allExportableSelected} disabled={exportableRows.length === 0 || exportManyToRmMut.isPending} onChange={toggleAllRmSelection} aria-label="Selecionar todos os candidatos classificados visíveis" title="Selecionar todos os classificados visíveis" />
                  </th>
                )}
                <th aria-sort={sortKey === "protocol" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{sortHeader("protocol", "Protocolo")}</th>
                <th aria-sort={sortKey === "name" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{sortHeader("name", "Candidato")}</th>
                <th>Curso</th><th>Chamada</th>
                <th aria-sort={sortKey === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{sortHeader("status", "Status")}</th>
                <th>Renda per capita</th><th>Docs</th><th>Analista</th>
                <th aria-sort={sortKey === "updatedAt" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>{sortHeader("updatedAt", "Atualização")}</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading || processContext.isLoading || query.isLoading ? (
                <tr><td colSpan={tab === "decided" ? 11 : 10} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando candidatos…</td></tr>
              ) : query.isError ? (
                <tr><td colSpan={tab === "decided" ? 11 : 10} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar os candidatos.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={tab === "decided" ? 11 : 10} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum candidato encontrado.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className={selectedRmIdSet.has(c.id) ? "selected" : ""} onClick={() => router.push(`/admin/analise/${c.id}`)}>
                    {tab === "decided" && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {c.status === "classificado" ? (
                          <input type="checkbox" checked={selectedRmIdSet.has(c.id)} disabled={exportManyToRmMut.isPending} onChange={() => toggleRmSelection(c.id)} aria-label={`Selecionar ${c.name} para exportar ao RM`} />
                        ) : (
                          <span className="muted small" title="Somente candidatos classificados podem ser exportados ao RM">—</span>
                        )}
                      </td>
                    )}
                    <td className="mono" style={{ color: "var(--ink-700)" }}>{c.protocol}</td>
                    <td>
                      <div className="row-with-avatar">
                        <Avatar name={c.name} />
                        <div>
                          <div className="row-name">{c.name}</div>
                          <div className="row-sub mono">CPF {c.cpf}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.course}</td>
                    <td>{rowCallLabel(c)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="mono">{fmtMoney(c.perCapita)}</td>
                    <td className="mono">{c.docsApproved}/{c.docsSent}</td>
                    <td>{c.analyst ?? <span className="muted small">Não atribuído</span>}</td>
                    <td className="muted small">{fmtWhen(c.updatedAt)}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/admin/analise/${c.id}`); }}>Abrir <IconChevR size={12} /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--ink-200)", background: "var(--ink-50)", color: "var(--ink-600)", fontSize: 12.5 }}>
            <div>Mostrando {rows.length} de {all.length} resultado(s)</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button className="btn btn-ghost btn-sm" disabled><IconChevL size={13} /></button>
              <span className="mono" style={{ padding: "0 8px" }}>página 1 / 1</span>
              <button className="btn btn-ghost btn-sm" disabled><IconChevR size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function CandidatosPage() {
  return (
    <Suspense fallback={null}>
      <CandidatosInner />
    </Suspense>
  );
}
