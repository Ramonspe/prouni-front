"use client";
import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { IconDownload, IconHelp, IconSearch } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import type { AuditLogAction, AuditLogDto } from "@prouni/shared";

/** Rótulos pt-BR de cada ação registrada na trilha de auditoria. */
const ACTION_LABELS: Record<AuditLogAction, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  ACCOUNT_CREATED: "Conta criada",
  ACCOUNT_CREATE_FAILED: "Falha ao criar conta",
  EMAIL_VERIFIED: "E-mail verificado",
  FICHA_SUBMITTED: "Ficha enviada",
  DOC_UPLOADED: "Documento enviado",
  DOC_APPROVED: "Documento aprovado",
  DOC_REJECTED: "Documento reprovado",
  DOC_REVERTED: "Documento revertido",
  DOC_DOWNLOADED: "Documento baixado",
  ANALYST_ASSIGNED: "Analista atribuído",
  PARECER_SAVED: "Parecer salvo",
  DECISION_MADE: "Decisão registrada",
  STATUS_CHANGED: "Status alterado",
  PRESELECTION_IMPORTED: "Pré-seleção importada",
  CONFIG_CHANGED: "Configuração alterada",
  CLIENT_ERROR: "Erro no navegador",
};

/** Cor do selo por ação: falhas/erros em vermelho, alterações em âmbar, resto neutro/azul. */
function actionTone(a: AuditLogAction): { bg: string; fg: string } {
  if (a === "ACCOUNT_CREATE_FAILED" || a === "CLIENT_ERROR" || a === "DOC_REJECTED")
    return { bg: "var(--red-50, #fef2f2)", fg: "var(--red-700, #b91c1c)" };
  if (a === "STATUS_CHANGED" || a === "DECISION_MADE" || a === "CONFIG_CHANGED" || a === "DOC_REVERTED")
    return { bg: "var(--amber-50, #fffbeb)", fg: "var(--amber-700, #b45309)" };
  if (a === "LOGIN" || a === "ACCOUNT_CREATED" || a === "DOC_APPROVED")
    return { bg: "var(--blue-50, #eff6ff)", fg: "var(--blue-700, #1d4ed8)" };
  return { bg: "var(--ink-100, #f1f3f7)", fg: "var(--ink-700, #374151)" };
}

/** Filtros rápidos focados nos problemas que motivam a consulta. */
const QUICK: { id: string; label: string; action: string }[] = [
  { id: "all", label: "Tudo", action: "all" },
  { id: "fail", label: "Falhas de cadastro", action: "ACCOUNT_CREATE_FAILED" },
  { id: "cli", label: "Erros do navegador", action: "CLIENT_ERROR" },
  { id: "login", label: "Logins", action: "LOGIN" },
  { id: "decision", label: "Decisões", action: "DECISION_MADE" },
];

function meta(log: AuditLogDto): Record<string, unknown> {
  return (log.metadata as Record<string, unknown> | null) ?? {};
}

/** Linha-resumo legível do detalhe técnico, conforme o tipo de evento. */
function summarize(log: AuditLogDto): string {
  const m = meta(log);
  if (log.action === "CLIENT_ERROR") {
    const status = m.status != null ? `HTTP ${String(m.status)}` : "sem resposta";
    const url = m.url ? ` · ${String(m.url)}` : "";
    const msg = m.message ? ` · ${String(m.message)}` : "";
    return `${status}${url}${msg}`;
  }
  if (log.action === "ACCOUNT_CREATE_FAILED") {
    const reason = m.reason ? String(m.reason) : "motivo não informado";
    const who = m.email ? ` · ${String(m.email)}` : "";
    return `${reason}${who}`;
  }
  if (log.entityType && log.entityId) return `${log.entityType} ${log.entityId}`;
  return log.entityType || "—";
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Bloco de texto formatado de um log — pronto para colar num chamado/e-mail à infra. */
function logToText(log: AuditLogDto): string {
  const m = meta(log);
  const lines = [
    `Evento: ${ACTION_LABELS[log.action] ?? log.action} (${log.action})`,
    `Quando: ${fmtWhen(log.createdAt)}`,
    `Autor: ${log.actorName ?? "anônimo/sistema"}${log.actorRole ? ` (${log.actorRole})` : ""}`,
    `IP: ${log.ip ?? "—"}`,
    `Entidade: ${log.entityType}${log.entityId ? ` / ${log.entityId}` : ""}`,
    `User-Agent: ${log.userAgent ?? "—"}`,
    "Detalhe técnico:",
    JSON.stringify(m, null, 2),
  ];
  return lines.join("\n");
}

function downloadCsv(rows: AuditLogDto[]) {
  const cols = [
    "createdAt",
    "action",
    "actorName",
    "actorRole",
    "ip",
    "entityType",
    "entityId",
    "status",
    "url",
    "message",
    "requestId",
    "cfId",
    "page",
    "userAgent",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => {
      const m = meta(r);
      return [
        r.createdAt,
        r.action,
        r.actorName ?? "",
        r.actorRole ?? "",
        r.ip ?? "",
        r.entityType,
        r.entityId ?? "",
        m.status ?? "",
        m.url ?? "",
        m.message ?? "",
        m.requestId ?? "",
        m.cfId ?? "",
        m.page ?? "",
        r.userAgent ?? "",
      ]
        .map(esc)
        .join(";");
    })
    .join("\n");
  const csv = "﻿" + cols.join(";") + "\n" + body; // BOM p/ Excel pt-BR
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditoria-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditoriaLogsPage() {
  const { user, loading } = useRequireStaff();
  const [quick, setQuick] = useState("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const action = QUICK.find((x) => x.id === quick)?.action ?? "all";

  const query = useQuery({
    queryKey: ["admin", "logs", action, q, from, to],
    queryFn: () => adminApi.logs({ action, q: q || undefined, from: from || undefined, to: to || undefined, take: 300 }),
    enabled: !!user,
  });
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    } catch {
      /* clipboard indisponível (http) — ignora */
    }
  };

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Auditoria", "Logs"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Logs de auditoria</h1>
            <p className="page-subtitle">
              Trilha de eventos e falhas técnicas do portal. Use para diagnosticar problemas e repassar à
              infraestrutura. Restrito a administradores.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => query.refetch()} disabled={query.isFetching}>
              {query.isFetching ? "Atualizando…" : "Atualizar"}
            </button>
            <button className="btn btn-ghost" onClick={() => downloadCsv(rows)} disabled={rows.length === 0}>
              <IconDownload size={14} /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="banner banner-info" style={{ marginBottom: 14, padding: "10px 12px" }}>
          <div className="banner-body" style={{ fontSize: 12.5 }}>
            <IconHelp size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            Para o erro de cadastro em produção, filtre por <strong>Erros do navegador</strong> (registra o
            status HTTP real, a rota e os ids de rastreio do CDN/WAF) e por <strong>Falhas de cadastro</strong>
            (motivo no servidor). Clique numa linha e use <strong>Copiar para a infra</strong>.
          </div>
        </div>

        <div className="tabs">
          {QUICK.map((t) => (
            <button key={t.id} className={`tab ${quick === t.id ? "active" : ""}`} onClick={() => setQuick(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <form
            className="search-input"
            style={{ width: 320, background: "#fff", border: "1px solid var(--ink-200)" }}
            onSubmit={(e) => {
              e.preventDefault();
              setQ(search.trim());
            }}
          >
            <IconSearch size={14} />
            <input
              placeholder="Buscar por autor, CPF, IP, entidade…"
              value={search}
              maxLength={120}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <label className="muted small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            De
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 150 }} />
          </label>
          <label className="muted small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Até
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 150 }} />
          </label>
          {(q || from || to) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setQ("");
                setFrom("");
                setTo("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Quando</th>
                <th style={{ width: 170 }}>Ação</th>
                <th style={{ width: 160 }}>Autor</th>
                <th>Detalhe</th>
                <th style={{ width: 130 }}>IP</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading || query.isLoading ? (
                <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando logs…</td></tr>
              ) : query.isError ? (
                <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar os logs (é necessário perfil de administrador).</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum log encontrado para os filtros.</td></tr>
              ) : (
                rows.map((log) => {
                  const tone = actionTone(log.action);
                  const isOpen = open === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr style={{ cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : log.id)}>
                        <td className="muted small mono">{fmtWhen(log.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 9px",
                              borderRadius: 999,
                              fontSize: 11.5,
                              fontWeight: 600,
                              background: tone.bg,
                              color: tone.fg,
                            }}
                          >
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td>{log.actorName ?? <span className="muted small">anônimo/sistema</span>}</td>
                        <td className="small" style={{ color: "var(--ink-700)", wordBreak: "break-word" }}>{summarize(log)}</td>
                        <td className="mono small muted">{log.ip ?? "—"}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : log.id); }}>
                            {isOpen ? "Fechar" : "Detalhes"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ background: "var(--ink-50)", padding: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <strong style={{ fontSize: 13 }}>Detalhe técnico</strong>
                              <button className="btn btn-secondary btn-sm" onClick={() => copy(logToText(log), log.id)}>
                                {copied === log.id ? "Copiado ✓" : "Copiar para a infra"}
                              </button>
                            </div>
                            {log.userAgent && (
                              <div className="small muted" style={{ marginBottom: 8, wordBreak: "break-word" }}>
                                <strong>User-Agent:</strong> {log.userAgent}
                              </div>
                            )}
                            <pre
                              style={{
                                margin: 0,
                                padding: 12,
                                background: "#0e1422",
                                color: "#cbd5e1",
                                borderRadius: 8,
                                fontSize: 12,
                                lineHeight: 1.5,
                                overflowX: "auto",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {JSON.stringify(meta(log), null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--ink-200)", background: "var(--ink-50)", color: "var(--ink-600)", fontSize: 12.5 }}>
            Mostrando {rows.length} evento(s) — mais recentes primeiro (limite de 300).
          </div>
        </div>
      </div>
    </AppShell>
  );
}
