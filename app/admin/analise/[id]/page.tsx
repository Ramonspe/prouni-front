"use client";
import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, Badge, PriorityBadge, StatusBadge, Stepper, Timeline } from "@/components/ui";
import {
  IconAlert,
  IconCheck,
  IconChevL,
  IconDownload,
  IconExternal,
  IconHistory,
  IconMessage,
  IconPrint,
  IconUpload,
  IconZoom,
} from "@/components/icons";
import { CANDIDATES } from "@/lib/mock-data";

const docTabs: [string, string][] = [
  ["renda", "Comprovante de renda"],
  ["ir", "Declaração de IR"],
  ["res", "Comp. de residência"],
  ["ficha", "Ficha socioeconômica"],
];

const sentDocs: { name: string; state: "approved" | "rejected" | "todo"; comment?: string }[] = [
  { name: "RG do estudante", state: "approved" },
  { name: "Holerites — últimos 3 meses", state: "approved" },
  { name: "Comprovante de renda — abril", state: "rejected", comment: "Imagem ilegível" },
  { name: "Declaração de IR 2025", state: "rejected", comment: "Páginas faltando" },
  { name: "Extrato bancário (60 dias)", state: "approved" },
  { name: "Comprovante de residência", state: "approved" },
  { name: "CRLV do veículo", state: "approved" },
  { name: "IPTU 2026", state: "todo" },
];

const decisions: [string, string, "success" | "warning" | "info" | "danger"][] = [
  ["approve", "Classificar", "success"],
  ["pending", "Solicitar pendência", "warning"],
  ["waitlist", "Lista de espera", "info"],
  ["deny", "Indeferir", "danger"],
];

const toneVar = (tone: string) =>
  tone === "success" ? "green" : tone === "warning" ? "amber" : tone === "info" ? "blue" : "red";

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cand = CANDIDATES.find((c) => c.id === params.id) ?? CANDIDATES[0];

  const [docTab, setDocTab] = useState("renda");
  const [decision, setDecision] = useState("");
  const [parecer, setParecer] = useState(
    "Renda per capita declarada compatível com perfil PROUNI integral. Documentação majoritariamente legível.\n\nObservação: comprovante de renda do mês de abril ilegível — solicitado reenvio. Aguardando retorno do candidato."
  );

  const summary: [string, ReactNode][] = [
    ["Grupo familiar", "4 integrantes"],
    ["Renda bruta declarada", <span className="mono" key="r">R$ 5.262,50</span>],
    ["Outras rendas", <span className="mono" key="o">R$ 480,00</span>],
    ["Despesas totais", <span className="mono" key="d">R$ 5.123,10</span>],
    ["Renda per capita líquida", <span className="mono" key="p" style={{ color: "var(--green-700)", fontWeight: 600 }}>R$ 1.046,21</span>],
    ["Perfil PROUNI", <Badge key="b" tone="success">Integral elegível</Badge>],
  ];

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Candidatos", `Análise · ${cand.name}`]}>
      <div className="content fade-in" style={{ maxWidth: "none", padding: 22 }}>
        {/* Candidate header */}
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/candidatos")}>
              <IconChevL size={13} /> Voltar à fila
            </button>
            <Avatar name={cand.name} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink-900)" }}>{cand.name}</h2>
                <StatusBadge status={cand.status} />
                <PriorityBadge priority={cand.priority} />
              </div>
              <div className="muted small" style={{ marginTop: 2 }}>
                <span className="mono">{cand.id}</span> · CPF <span className="mono">{cand.cpf}</span> · {cand.course} · 1º ano · pré-seleção MEC 12/mai/2026
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost"><IconHistory size={14} /> Histórico</button>
              <button className="btn btn-ghost"><IconMessage size={14} /> Mensagem</button>
              <button className="btn btn-ghost"><IconPrint size={14} /> Imprimir</button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Stepper steps={["Acesso", "Ficha", "Documentos", "Análise", "Resultado"]} current={3} />
          </div>
        </div>

        {/* Split: document viewer + analysis panel */}
        <div className="split">
          <div>
            <div className="card" style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
              <div className="card-header" style={{ padding: 0 }}>
                <div className="tabs" style={{ flex: 1, borderBottom: "none" }}>
                  {docTabs.map(([id, l]) => (
                    <button key={id} className={`tab ${docTab === id ? "active" : ""}`} onClick={() => setDocTab(id)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="viewer">
                <div className="viewer-toolbar">
                  <button className="btn btn-ghost btn-sm"><IconZoom size={13} /></button>
                  <button className="btn btn-ghost btn-sm"><IconDownload size={13} /></button>
                  <button className="btn btn-ghost btn-sm"><IconExternal size={13} /> Abrir em nova aba</button>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 12 }}>
                    <span className="mono">comprovante_abril.pdf</span>
                    <Badge tone="danger">Reprovado</Badge>
                  </div>
                </div>
                <div className="viewer-body">
                  <div className="viewer-doc">
                    <div className="viewer-doc-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/maua-logo.png" alt="Mauá" style={{ height: 28, width: "auto" }} />
                      <div>
                        <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "var(--ink-500)" }}>INSTITUTO MAUÁ DE TECNOLOGIA</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy-900)" }}>FICHA SOCIOECONÔMICA · 2026</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, padding: "5px 8px", background: "var(--ink-800)", color: "#fff", fontSize: 9, letterSpacing: "0.06em" }}>1. DADOS DO ESTUDANTE</div>
                    <div className="viewer-doc-lines">
                      <div /><div /><div /><div /><div /><div /><div /><div />
                    </div>
                    <div style={{ marginTop: 14, padding: "5px 8px", background: "var(--ink-800)", color: "#fff", fontSize: 9 }}>2. COMPOSIÇÃO FAMILIAR</div>
                    <div className="viewer-doc-lines">
                      <div /><div /><div /><div /><div />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Documentos enviados</h3>
                <span className="muted small" style={{ marginLeft: "auto" }}>9 aprovados · 2 reprovados · 3 a enviar</span>
              </div>
              <div style={{ padding: 14 }}>
                {sentDocs.map((d, i) => (
                  <div key={i} className={`upload-row ${d.state === "approved" ? "has-file" : d.state === "rejected" ? "has-rejected" : ""}`}>
                    <div className="upload-icon">
                      {d.state === "approved" ? <IconCheck size={17} stroke={2.4} /> : d.state === "rejected" ? <IconAlert size={16} /> : <IconUpload size={16} />}
                    </div>
                    <div>
                      <div className="upload-title">{d.name}</div>
                      {d.comment && <div className="upload-meta error">{d.comment}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {d.state === "approved" && <Badge tone="success">Aprovado</Badge>}
                      {d.state === "rejected" && <Badge tone="danger">Reprovado</Badge>}
                      {d.state === "todo" && <Badge tone="neutral">Aguardando</Badge>}
                      {d.state === "approved" && <button className="btn btn-ghost btn-sm">Reverter</button>}
                      {d.state === "rejected" && <button className="btn btn-ghost btn-sm">Editar parecer</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: analysis panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80 }}>
            <div className="card">
              <div className="card-header"><h3 className="h-card-title">Resumo socioeconômico</h3></div>
              <div className="card-body">
                {summary.map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? "1px solid var(--ink-150)" : "none", fontSize: 13 }}>
                    <span className="muted">{l}</span>
                    <span style={{ color: "var(--ink-900)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="h-card-title">Parecer do analista</h3></div>
              <div className="card-body">
                <textarea className="textarea" rows={5} value={parecer} onChange={(e) => setParecer(e.target.value)} />
                <div className="muted small" style={{ marginTop: 6 }}>Visível apenas para equipe administrativa. Auditável no histórico.</div>

                <div style={{ marginTop: 14 }}>
                  <div className="field-label" style={{ marginBottom: 6 }}>Decisão preliminar</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {decisions.map(([id, l, tone]) => {
                      const color = toneVar(tone);
                      const on = decision === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setDecision(id)}
                          className="btn btn-ghost"
                          style={{
                            justifyContent: "center",
                            borderColor: on ? `var(--${color}-600)` : undefined,
                            background: on ? `var(--${color}-100)` : undefined,
                            color: on ? `var(--${color}-700)` : undefined,
                            fontWeight: on ? 600 : 500,
                          }}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!decision}>
                  <IconCheck size={14} /> Encaminhar para homologação
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="h-card-title">Histórico</h3></div>
              <div className="card-body">
                <Timeline
                  items={[
                    { state: "done", title: "Inscrição recebida do MEC", meta: "12/mai · 10:22" },
                    { state: "done", title: "Ficha enviada pela candidata", meta: "20/mai · 18:47" },
                    { state: "done", title: "Triagem documental concluída", meta: "Carlos M. · 21/mai · 09:11" },
                    { state: "warn", title: "2 documentos reprovados", meta: "Ana L. · 26/mai · 14:08" },
                    { state: "active", title: "Análise socioeconômica em curso", meta: "Ana L. · agora" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
