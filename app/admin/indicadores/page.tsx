"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import { STATUS_MAP, type ProcessStatus } from "@prouni/shared";

const STATUS_COLOR: Record<string, string> = {
  neutral: "var(--ink-400)",
  info: "var(--blue-600)",
  success: "var(--green-600)",
  warning: "var(--amber-600)",
  danger: "var(--red-600)",
};

function Bars({ rows, color = "var(--blue-600)" }: { rows: { label: string; count: number; color?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <div className="muted small">Sem dados.</div>;
  return (
    <>
      {rows.map((r, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
            <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{r.count}</span>
          </div>
          <div className="progress-bar"><div style={{ width: `${(r.count / max) * 100}%`, background: r.color ?? color }} /></div>
        </div>
      ))}
    </>
  );
}

export default function IndicadoresPage() {
  const { user } = useRequireStaff();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.stats(), enabled: !!user });
  const d = stats.data;

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Indicadores"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 18 }}>
          <h1 className="page-title">Indicadores</h1>
          <p className="page-subtitle">Métricas operacionais do processo PROUNI · ciclo ativo.</p>
        </div>

        {stats.isLoading || !user ? (
          <div className="card card-pad muted">Calculando indicadores…</div>
        ) : stats.isError || !d ? (
          <div className="card card-pad muted">Não foi possível carregar os indicadores.</div>
        ) : (
          <>
            <div className="grid-4" style={{ marginBottom: 18 }}>
              <div className="stat">
                <div className="stat-label">Total de inscrições</div>
                <div className="stat-value">{d.totalApplications}</div>
                <div className="stat-trend flat">Ciclo ativo</div>
              </div>
              <div className="stat">
                <div className="stat-label">Ficha preenchida</div>
                <div className="stat-value">{d.funnel.find((f) => f.label === "Ficha preenchida")?.count ?? 0}</div>
                <div className="stat-trend flat">{d.funnel.find((f) => f.label === "Ficha preenchida")?.pct ?? 0}% dos acessos</div>
              </div>
              <div className="stat">
                <div className="stat-label">Documentos enviados</div>
                <div className="stat-value">{d.funnel.find((f) => f.label === "Documentos enviados")?.count ?? 0}</div>
                <div className="stat-trend flat">inscrições com ao menos 1 doc</div>
              </div>
              <div className="stat">
                <div className="stat-label">Tempo médio até decisão</div>
                <div className="stat-value">{d.avgDaysToDecision == null ? "—" : `${d.avgDaysToDecision} d`}</div>
                <div className="stat-trend flat">homologações finais</div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 18 }}>
              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Funil do processo</h3></div>
                <div className="card-body">
                  {d.funnel.map((r, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: "var(--ink-700)" }}>{r.label}</span>
                        <span><span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{r.count}</span> <span className="muted small">{r.pct}%</span></span>
                      </div>
                      <div className="progress-bar"><div style={{ width: `${r.pct}%`, background: "var(--blue-600)" }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Carga por analista</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                  {d.analysts.length === 0 ? (
                    <div className="card-pad muted small">Nenhuma inscrição atribuída ou decidida ainda.</div>
                  ) : (
                    <table className="table">
                      <thead><tr><th>Analista</th><th>Atribuídos</th><th>Decisões</th></tr></thead>
                      <tbody>
                        {d.analysts.map((r, i) => (
                          <tr key={i}>
                            <td><div className="row-with-avatar"><Avatar name={r.name} size={26} /><div className="row-name">{r.name}</div></div></td>
                            <td className="mono">{r.assigned}</td>
                            <td className="mono">{r.decisions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="grid-3">
              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Motivos de reprovação documental</h3></div>
                <div className="card-body"><Bars rows={d.rejectionReasons.map((r) => ({ label: r.reason, count: r.count }))} color="var(--amber-600)" /></div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Distribuição por curso</h3></div>
                <div className="card-body"><Bars rows={d.byCourse.map((r) => ({ label: r.course, count: r.count }))} color="var(--blue-600)" /></div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Distribuição por status</h3></div>
                <div className="card-body">
                  <Bars
                    rows={d.byStatus.map((r) => ({
                      label: STATUS_MAP[r.status as ProcessStatus].label,
                      count: r.count,
                      color: STATUS_COLOR[STATUS_MAP[r.status as ProcessStatus].tone] ?? "var(--ink-400)",
                    }))}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
