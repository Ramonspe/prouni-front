"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProcessContextSelector } from "@/components/process-context-selector";
import { Avatar, PriorityBadge, StatusBadge } from "@/components/ui";
import { IconChevR } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import { useAdminProcessContext } from "@/lib/use-admin-process-context";
import { STATUS_MAP, type AdminApplicationRow, type BadgeTone, type ProcessStatus } from "@prouni/shared";

const STAGES: ProcessStatus[] = [
  "enviada",
  "analise_doc",
  "pendencia",
  "analise_socio",
  "classificado",
  "espera",
  "indeferido",
  "concedida",
];

const TONE_VAR: Record<BadgeTone, string> = {
  neutral: "var(--ink-400)",
  info: "var(--blue-600)",
  success: "var(--green-600)",
  warning: "var(--amber-600)",
  danger: "var(--red-600)",
};

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useRequireStaff();
  const processContext = useAdminProcessContext(Boolean(user));

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
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const count = (...st: ProcessStatus[]) => rows.filter((r) => st.includes(r.status)).length;
  const aguardando = count("analise_doc", "analise_socio");
  const pendencia = count("pendencia");
  const classificados = count("classificado");

  const distribution = STAGES.map((s) => ({
    status: s,
    label: STATUS_MAP[s].label,
    color: TONE_VAR[STATUS_MAP[s].tone],
    v: count(s),
  })).filter((d) => d.v > 0);
  const maxV = Math.max(1, ...distribution.map((d) => d.v));

  const queue = [...rows]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Painel operacional"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 18 }}>
          <h1 className="page-title">Painel operacional</h1>
          <p className="page-subtitle">
            Visão geral do contexto selecionado · {rows.length} inscriç{rows.length === 1 ? "ão" : "ões"}.
          </p>
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
            helperText="O painel, a fila e os totais abaixo usam exatamente este contexto."
          />
        )}

        <div className="grid-4" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="stat-label">Aguardando análise</div>
            <div className="stat-value">{aguardando}</div>
            <div className="stat-trend flat">Documental + socioeconômica</div>
          </div>
          <div className="stat">
            <div className="stat-label">Pendência documental</div>
            <div className="stat-value" style={{ color: "var(--amber-700)" }}>{pendencia}</div>
            <div className="stat-trend flat">Aguardando reenvio do candidato</div>
          </div>
          <div className="stat">
            <div className="stat-label">Classificados</div>
            <div className="stat-value" style={{ color: "var(--green-700)" }}>{classificados}</div>
            <div className="stat-trend flat">Encaminhados para resultado</div>
          </div>
          <div className="stat">
            <div className="stat-label">Total de inscrições</div>
            <div className="stat-value">{rows.length}</div>
            <div className="stat-trend flat">Contexto selecionado</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-header"><h3 className="h-card-title">Distribuição por etapa</h3></div>
          <div className="card-body">
            {distribution.length === 0 ? (
              <div className="muted small">Sem inscrições para exibir.</div>
            ) : (
              distribution.map((r) => (
                <div key={r.status} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
                    <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{r.v}</span>
                  </div>
                  <div className="progress-bar"><div style={{ width: `${(r.v / maxV) * 100}%`, background: r.color }} /></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="h-card-title">Fila de análise prioritária</h3>
            <span className="muted small" style={{ marginLeft: "auto" }}>Mais recentes</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th><th>Candidato</th><th>Curso</th><th>Status</th><th>Prioridade</th><th>Docs</th><th>Última atualização</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading || processContext.isLoading || query.isLoading ? (
                <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando…</td></tr>
              ) : queue.length === 0 ? (
                <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhuma inscrição neste contexto.</td></tr>
              ) : (
                queue.map((c: AdminApplicationRow) => (
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
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td className="mono">{c.docsApproved}/{c.docsSent}</td>
                    <td className="muted small">{fmtWhen(c.updatedAt)}</td>
                    <td><button className="btn btn-ghost btn-sm">Analisar <IconChevR size={12} /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
