"use client";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, PriorityBadge, StatusBadge } from "@/components/ui";
import { IconArrowDown, IconArrowUp, IconChevR } from "@/components/icons";
import { CANDIDATES } from "@/lib/mock-data";

const barData = [42, 58, 51, 64, 71, 49, 38, 55, 67, 78, 82, 69, 75, 84];
const distribution = [
  { l: "Inscrição enviada", v: 84, c: "var(--blue-500)" },
  { l: "Em análise documental", v: 65, c: "var(--blue-600)" },
  { l: "Pendência documental", v: 23, c: "var(--amber-600)" },
  { l: "Em análise socioeconômica", v: 47, c: "var(--blue-700)" },
  { l: "Classificados", v: 38, c: "var(--green-600)" },
  { l: "Indeferidos", v: 12, c: "var(--red-600)" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Painel operacional"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 18 }}>
          <h1 className="page-title">Painel operacional</h1>
          <p className="page-subtitle">Visão geral do processo PROUNI 2026/1 · 412 candidatos pré-selecionados pelo MEC.</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="stat-label">Aguardando análise</div>
            <div className="stat-value">47</div>
            <div className="stat-trend up"><IconArrowUp size={12} /> +6 nas últimas 24h</div>
          </div>
          <div className="stat">
            <div className="stat-label">Pendência documental</div>
            <div className="stat-value" style={{ color: "var(--amber-700)" }}>23</div>
            <div className="stat-trend flat">Aguardando reenvio do candidato</div>
          </div>
          <div className="stat">
            <div className="stat-label">Concluídos esta semana</div>
            <div className="stat-value">38</div>
            <div className="stat-trend up"><IconArrowUp size={12} /> +14% vs. semana anterior</div>
          </div>
          <div className="stat">
            <div className="stat-label">Tempo médio de análise</div>
            <div className="stat-value">5,2 d</div>
            <div className="stat-trend down"><IconArrowDown size={12} /> -0,4d vs. ciclo 2025</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="h-card-title">Inscrições por status</h3>
              <span className="muted small" style={{ marginLeft: "auto" }}>últimos 14 dias</span>
            </div>
            <div className="card-body">
              <div className="bar-chart">
                {barData.map((v, i) => (
                  <div key={i} className={`bar ${i >= 11 ? "active" : ""}`} style={{ height: `${v}%` }} title={`${v} inscrições`} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: "var(--ink-500)", fontSize: 11 }}>
                <span>12/mai</span><span>19/mai</span><span>26/mai</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Distribuição por etapa</h3></div>
            <div className="card-body">
              {distribution.map((r, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-700)" }}>{r.l}</span>
                    <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{r.v}</span>
                  </div>
                  <div className="progress-bar"><div style={{ width: `${(r.v / 84) * 100}%`, background: r.c }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="h-card-title">Fila de análise prioritária</h3>
            <span className="muted small" style={{ marginLeft: "auto" }}>Atualizado há 4 min</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th><th>Candidato</th><th>Curso</th><th>Status</th><th>Prioridade</th><th>Docs</th><th>Última atualização</th><th></th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.slice(0, 5).map((c) => (
                <tr key={c.id} onClick={() => router.push(`/admin/analise/${c.id}`)}>
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
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td className="mono">{c.docs}</td>
                  <td className="muted small">{c.updated}</td>
                  <td><button className="btn btn-ghost btn-sm">Analisar <IconChevR size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
