"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Avatar, StatusBadge } from "@/components/ui";
import { IconCal, IconChevL, IconChevR, IconDownload, IconFilter, IconPrint, IconSearch } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import type { AdminApplicationRow, ProcessStatus } from "@prouni/shared";

type Tab = "all" | "review" | "pending" | "decided";
const DECIDED: ProcessStatus[] = ["classificado", "espera", "indeferido", "concedida"];

function fmtMoney(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  return Number.isNaN(n) ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CandidatosPage() {
  const router = useRouter();
  const { user, loading } = useRequireStaff();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => adminApi.applications(),
    enabled: !!user,
  });
  const all = useMemo(() => query.data ?? [], [query.data]);

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
  const rows = all.filter(byTab).filter(bySearch);

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
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost"><IconDownload size={14} /> Exportar CSV</button>
            <button className="btn btn-ghost"><IconPrint size={14} /> Relatório</button>
          </div>
        </div>

        <div className="tabs">
          {tabs.map(([id, l, n]) => (
            <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {l} <span className="count">{n}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 12, alignItems: "center" }}>
          <div className="search-input" style={{ width: 320, background: "#fff", border: "1px solid var(--ink-200)" }}>
            <IconSearch size={14} />
            <input
              placeholder="Buscar por nome, CPF, protocolo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Curso</button>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Status</button>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Analista responsável</button>
          <button className="btn btn-ghost btn-sm"><IconCal size={13} /> Data de envio</button>
          <div style={{ flex: 1 }} />
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th><th>Candidato</th><th>Curso</th><th>Status</th>
                <th>Renda per capita</th><th>Docs</th><th>Analista</th><th>Atualização</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading || query.isLoading ? (
                <tr><td colSpan={9} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando candidatos…</td></tr>
              ) : query.isError ? (
                <tr><td colSpan={9} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar os candidatos.</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum candidato encontrado.</td></tr>
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
