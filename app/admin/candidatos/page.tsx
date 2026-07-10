"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Avatar, StatusBadge } from "@/components/ui";
import { IconChevL, IconChevR, IconDownload, IconPrint, IconSearch } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import { PRESELECTION_CALLS, STATUS_MAP, type AdminApplicationRow, type PreselectionCall, type ProcessStatus } from "@prouni/shared";

type Tab = "all" | "review" | "pending" | "decided";
const DECIDED: ProcessStatus[] = ["classificado", "espera", "indeferido", "concedida"];
function callLabel(c: PreselectionCall): string {
  return PRESELECTION_CALLS.find((x) => x.value === c)?.label ?? c;
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
      callLabel(c.call),
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
  const { user, loading } = useRequireStaff();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [callFilter, setCallFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [analystFilter, setAnalystFilter] = useState("all"); // "all" | "none" | nome do analista
  const [dateFilter, setDateFilter] = useState("all"); // "all" | dias ("1" | "7" | "30")
  // Busca vinda da barra do topo (?q=) — sincroniza quando a URL muda.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const query = useQuery({
    queryKey: ["admin", "applications", callFilter],
    queryFn: () => adminApi.applications({ call: callFilter }),
    enabled: !!user,
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
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      c.name.toLowerCase().includes(s) ||
      c.cpf.replace(/\D/g, "").includes(s.replace(/\D/g, "")) ||
      c.protocol.toLowerCase().includes(s)
    );
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
  const rows = all
    .filter(byTab)
    .filter(bySearch)
    .filter(byCourse)
    .filter(byStatus)
    .filter(byAnalyst)
    .filter(byDate);

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
            <p className="page-subtitle">Gestão completa das inscrições PROUNI · ciclo ativo.</p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => exportCsv(rows)} disabled={rows.length === 0} title="Baixar a lista atual em CSV">
              <IconDownload size={14} /> Exportar CSV
            </button>
            <button className="btn btn-ghost" onClick={() => window.print()} title="Gerar relatório para impressão ou PDF">
              <IconPrint size={14} /> Relatório
            </button>
          </div>
        </div>

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
          <select className="input" style={{ width: 170 }} value={callFilter} onChange={(e) => setCallFilter(e.target.value)}>
            <option value="all">Todas as chamadas</option>
            {PRESELECTION_CALLS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
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

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th><th>Candidato</th><th>Curso</th><th>Chamada</th><th>Status</th>
                <th>Renda per capita</th><th>Docs</th><th>Analista</th><th>Atualização</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading || query.isLoading ? (
                <tr><td colSpan={10} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando candidatos…</td></tr>
              ) : query.isError ? (
                <tr><td colSpan={10} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar os candidatos.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum candidato encontrado.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/admin/analise/${c.id}`)}>
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
                    <td>{callLabel(c.call)}</td>
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
