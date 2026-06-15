"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, StatusBadge } from "@/components/ui";
import { IconCal, IconChevL, IconChevR, IconDownload, IconFilter, IconPrint, IconSearch } from "@/components/icons";
import { CANDIDATES } from "@/lib/mock-data";
import type { Candidate } from "@/lib/types";

type Tab = "all" | "review" | "pending" | "decided";
const DECIDED: Candidate["status"][] = ["classificado", "espera", "indeferido", "concedida"];

export default function CandidatosPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filter = (c: Candidate) => {
    if (tab === "all") return true;
    if (tab === "pending") return c.status === "pendencia";
    if (tab === "review") return c.status === "analise_socio" || c.status === "analise_doc";
    if (tab === "decided") return DECIDED.includes(c.status);
    return true;
  };
  const rows = CANDIDATES.filter(filter);
  const toggle = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const tabs: [Tab, string, number][] = [
    ["all", "Todos", CANDIDATES.length],
    ["review", "Em análise", CANDIDATES.filter((c) => c.status === "analise_socio" || c.status === "analise_doc").length],
    ["pending", "Com pendência", CANDIDATES.filter((c) => c.status === "pendencia").length],
    ["decided", "Decididos", CANDIDATES.filter((c) => DECIDED.includes(c.status)).length],
  ];

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Candidatos"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Candidatos</h1>
            <p className="page-subtitle">Gestão completa das inscrições PROUNI 2026/1.</p>
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
            <input placeholder="Buscar por nome, CPF, protocolo…" />
          </div>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Curso</button>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Status</button>
          <button className="btn btn-ghost btn-sm"><IconFilter size={13} /> Analista responsável</button>
          <button className="btn btn-ghost btn-sm"><IconCal size={13} /> Data de envio</button>
          <div style={{ flex: 1 }} />
          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--blue-50)", border: "1px solid var(--blue-100)", borderRadius: 8, fontSize: 12.5 }}>
              <strong>{selected.size}</strong> selecionado(s)
              <button className="btn btn-secondary btn-sm">Atribuir analista</button>
              <button className="btn btn-ghost btn-sm">Aprovar em lote</button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                  />
                </th>
                <th>Protocolo</th><th>Candidato</th><th>Curso</th><th>Status</th>
                <th>Renda per capita</th><th>Docs</th><th>Analista</th><th>Atualização</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={selected.has(c.id) ? "selected" : ""} onClick={() => router.push(`/admin/analise/${c.id}`)}>
                  <td onClick={(e) => { e.stopPropagation(); toggle(c.id); }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                  </td>
                  <td className="mono" style={{ color: "var(--ink-700)" }}>{c.id}</td>
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
                  <td className="mono">{c.income}</td>
                  <td className="mono">{c.docs}</td>
                  <td>{c.analyst === "—" ? <span className="muted small">Não atribuído</span> : c.analyst}</td>
                  <td className="muted small">{c.updated}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/admin/analise/${c.id}`); }}>Abrir <IconChevR size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--ink-200)", background: "var(--ink-50)", color: "var(--ink-600)", fontSize: 12.5 }}>
            <div>Mostrando 1–{rows.length} de {rows.length} resultados</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button className="btn btn-ghost btn-sm" disabled><IconChevL size={13} /></button>
              <span className="mono" style={{ padding: "0 8px" }}>página 1 / 5</span>
              <button className="btn btn-ghost btn-sm"><IconChevR size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
