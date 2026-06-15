import { AppShell } from "@/components/app-shell";
import { Avatar, Badge } from "@/components/ui";
import { IconArrowDown, IconArrowUp } from "@/components/icons";

const funnel = [
  { l: "Pré-selecionados (MEC)", v: 412, p: 100, c: "var(--navy-700)" },
  { l: "Acessaram o portal", v: 401, p: 97.3, c: "var(--blue-700)" },
  { l: "Ficha completa", v: 358, p: 86.9, c: "var(--blue-600)" },
  { l: "Documentos enviados", v: 311, p: 75.5, c: "var(--blue-500)" },
  { l: "Análise concluída", v: 188, p: 45.6, c: "var(--green-600)" },
  { l: "Bolsa concedida", v: 142, p: 34.5, c: "var(--green-700)" },
];

const analysts = [
  { n: "Ana Lima", a: 64, c: 51, s: "96%", p: 4 },
  { n: "Carlos Mota", a: 58, c: 47, s: "93%", p: 7 },
  { n: "Júlia Resende", a: 51, c: 42, s: "91%", p: 3 },
  { n: "Rodrigo Tavares", a: 47, c: 33, s: "88%", p: 9 },
];

const reasons: [string, number][] = [
  ["Imagem ilegível", 38],
  ["Documento incompleto", 27],
  ["Fora do prazo (3 meses)", 18],
  ["Categoria incorreta", 11],
  ["Outros", 6],
];

const byCourse: [string, number][] = [
  ["Eng. Computação", 84],
  ["Eng. Mecânica", 67],
  ["Eng. Civil", 58],
  ["Administração", 51],
  ["Eng. Química", 44],
  ["Outros", 108],
];

const byStage: [string, string][] = [
  ["Acesso → ficha enviada", "2,1 d"],
  ["Ficha → docs enviados", "1,8 d"],
  ["Docs → triagem", "0,4 d"],
  ["Triagem → análise socio.", "1,2 d"],
  ["Análise → homologação", "0,8 d"],
  ["Total ponta a ponta", "6,3 d"],
];

export default function IndicadoresPage() {
  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Indicadores"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h1 className="page-title">Indicadores</h1>
            <p className="page-subtitle">Métricas operacionais e de performance do processo PROUNI 2026/1.</p>
          </div>
          <div className="segmented">
            {["Hoje", "7 dias", "30 dias", "Ciclo 2026"].map((l, i) => (
              <button key={l} className={i === 2 ? "active" : ""}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 18 }}>
          <div className="stat">
            <div className="stat-label">Taxa de conclusão</div>
            <div className="stat-value">73,5%</div>
            <div className="progress-bar" style={{ marginTop: 4 }}><div style={{ width: "73.5%", background: "var(--green-600)" }} /></div>
            <div className="stat-trend up"><IconArrowUp size={12} /> +4,2 p.p. vs. 2025</div>
          </div>
          <div className="stat">
            <div className="stat-label">SLA da análise (5d)</div>
            <div className="stat-value">94%</div>
            <div className="progress-bar" style={{ marginTop: 4 }}><div style={{ width: "94%", background: "var(--blue-600)" }} /></div>
            <div className="stat-trend up"><IconArrowUp size={12} /> +6 p.p.</div>
          </div>
          <div className="stat">
            <div className="stat-label">Reprovação documental</div>
            <div className="stat-value" style={{ color: "var(--amber-700)" }}>18,4%</div>
            <div className="progress-bar" style={{ marginTop: 4 }}><div style={{ width: "18.4%", background: "var(--amber-600)" }} /></div>
            <div className="stat-trend down"><IconArrowDown size={12} /> -3,1 p.p.</div>
          </div>
          <div className="stat">
            <div className="stat-label">Indeferimentos</div>
            <div className="stat-value" style={{ color: "var(--red-700)" }}>4,1%</div>
            <div className="progress-bar" style={{ marginTop: 4 }}><div style={{ width: "4.1%", background: "var(--red-600)" }} /></div>
            <div className="stat-trend flat">Estável</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Funil do processo</h3></div>
            <div className="card-body">
              {funnel.map((r, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-700)" }}>{r.l}</span>
                    <span><span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{r.v}</span> <span className="muted small">{r.p.toFixed(1)}%</span></span>
                  </div>
                  <div className="progress-bar"><div style={{ width: `${r.p}%`, background: r.c }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Carga por analista</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr><th>Analista</th><th>Atribuídos</th><th>Concluídos</th><th>SLA</th><th>Pendência</th></tr>
                </thead>
                <tbody>
                  {analysts.map((r, i) => (
                    <tr key={i}>
                      <td><div className="row-with-avatar"><Avatar name={r.n} size={26} /><div className="row-name">{r.n}</div></div></td>
                      <td className="mono">{r.a}</td>
                      <td className="mono">{r.c}</td>
                      <td><Badge tone={parseInt(r.s) >= 92 ? "success" : "warning"}>{r.s}</Badge></td>
                      <td className="mono">{r.p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-3">
          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Motivos de reprovação documental</h3></div>
            <div className="card-body">
              {reasons.map(([l, v], i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-700)" }}>{l}</span>
                    <span className="mono" style={{ color: "var(--ink-900)" }}>{v}%</span>
                  </div>
                  <div className="progress-bar"><div style={{ width: `${v * 2}%`, background: "var(--amber-600)" }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Distribuição por curso</h3></div>
            <div className="card-body">
              {byCourse.map(([l, v], i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-700)" }}>{l}</span>
                    <span className="mono" style={{ color: "var(--ink-900)" }}>{v}</span>
                  </div>
                  <div className="progress-bar"><div style={{ width: `${(v / 108) * 100}%`, background: "var(--blue-600)" }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="h-card-title">Tempo por etapa (mediana)</h3></div>
            <div className="card-body">
              {byStage.map(([l, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid var(--ink-150)" : "none", fontSize: 13, fontWeight: i === arr.length - 1 ? 600 : 400 }}>
                  <span style={{ color: i === arr.length - 1 ? "var(--ink-900)" : "var(--ink-600)" }}>{l}</span>
                  <span className="mono" style={{ color: "var(--ink-900)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
