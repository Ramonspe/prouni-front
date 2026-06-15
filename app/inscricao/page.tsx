"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Banner, Timeline } from "@/components/ui";
import {
  IconChart,
  IconCheck,
  IconChevR,
  IconDownload,
  IconGraduate,
  IconHouse,
  IconInfo,
  IconPlus,
  IconTrash,
  IconUpload,
  IconUser,
} from "@/components/icons";
import { SignupFooter, SignupShell } from "@/components/signup-shell";
import { CURSOS, SIGNUP_DOC_CATS } from "@/lib/mock-data";
import { ApiError, authApi, type AuthResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type WizardStep = "account" | "enem" | "curso" | "familia" | "docs";
const WIZARD_STEPS: WizardStep[] = ["account", "enem", "curso", "familia", "docs"];

/* ============ Step bodies ============ */

function StepAccount({
  email,
  registrationToken,
  onRegistered,
}: {
  email: string;
  registrationToken: string;
  onRegistered: (res: AuthResponse) => void;
}) {
  const [form, setForm] = useState({
    cpf: "",
    birthDate: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [optInCotas, setOptInCotas] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await authApi.register(registrationToken, {
        cpf: form.cpf,
        fullName: form.fullName,
        birthDate: form.birthDate || undefined,
        email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptTerms,
        optInCotas,
      });
      onRegistered(res);
    } catch (e) {
      if (e instanceof ApiError && e.issues?.length) {
        setErr(e.issues.map((i) => i.message).join(" · "));
      } else {
        setErr(e instanceof ApiError ? e.message : "Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-grid">
      <div>
        <h1 className="signup-title">Vamos criar seu acesso</h1>
        <p className="signup-sub">
          Você foi pré-selecionado pelo MEC para uma vaga do PROUNI no Instituto Mauá de Tecnologia.
          Crie sua conta para iniciar a inscrição e enviar a documentação exigida pelo edital.
        </p>

        {err && (
          <div className="banner banner-danger" style={{ marginTop: 14, padding: "10px 12px" }}>
            <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
          </div>
        )}

        <div className="form-grid" style={{ marginTop: 22 }}>
          <div className="field col-6">
            <label className="field-label">CPF<span className="req">*</span></label>
            <div className="input-with-icon">
              <IconUser className="icon-prefix" />
              <input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={set("cpf")} />
            </div>
            <span className="field-help">O CPF informado deve ser o mesmo do SisProuni.</span>
          </div>
          <div className="field col-6">
            <label className="field-label">Data de nascimento</label>
            <input className="input" placeholder="dd/mm/aaaa" value={form.birthDate} onChange={set("birthDate")} />
          </div>
          <div className="field col-12">
            <label className="field-label">Nome completo<span className="req">*</span></label>
            <input className="input" value={form.fullName} onChange={set("fullName")} />
          </div>
          <div className="field col-6">
            <label className="field-label">E-mail (verificado)</label>
            <input className="input" value={email} readOnly style={{ background: "var(--ink-100)", color: "var(--ink-700)" }} />
          </div>
          <div className="field col-6">
            <label className="field-label">Celular (com DDD)<span className="req">*</span></label>
            <input className="input" placeholder="(11) 99999-9999" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="field col-6">
            <label className="field-label">Senha de acesso<span className="req">*</span></label>
            <div className="input-with-icon">
              <input type="password" className="input" value={form.password} onChange={set("password")} />
            </div>
            <span className="field-help">Mínimo 8 caracteres com 1 número e 1 caractere especial.</span>
          </div>
          <div className="field col-6">
            <label className="field-label">Confirme a senha<span className="req">*</span></label>
            <div className="input-with-icon">
              <input type="password" className="input" value={form.confirmPassword} onChange={set("confirmPassword")} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="checkbox">
            <input type="checkbox" checked={acceptTerms} onChange={() => setAcceptTerms((v) => !v)} />
            <span className="box" />
            <span>
              Li e aceito o <a href="#" onClick={(e) => e.preventDefault()}>edital PROUNI 2026/1</a> e a{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>Política de Privacidade</a> conforme a Lei
              13.709/18 (LGPD).
            </span>
          </label>

          <label className="checkbox cota-checkbox">
            <input type="checkbox" checked={optInCotas} onChange={() => setOptInCotas((v) => !v)} />
            <span className="box" />
            <span>
              Desejo concorrer às <strong>vagas reservadas por cotas</strong> (Lei nº 11.096/2005 e Lei nº
              12.711/2012). Estou ciente de que deverei preencher e assinar o{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>Formulário de Autodeclaração de Cotas</a> e
              anexá-lo junto aos demais documentos comprobatórios.
            </span>
          </label>
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary btn-lg" disabled={loading} onClick={submit}>
            {loading ? "Criando conta…" : "Criar conta e continuar"} <IconChevR size={16} />
          </button>
        </div>
      </div>

      <aside className="signup-aside">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue-50)", color: "var(--blue-700)", display: "grid", placeItems: "center" }}>
            <IconInfo size={16} />
          </div>
          <div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>Sobre esta inscrição</div>
        </div>
        <p className="muted small">
          Esta é a sua primeira inscrição no PROUNI Mauá. A cada semestre você fará um recadastro mais
          simples para confirmar se as condições foram mantidas.
        </p>
        <div className="divider" />
        <div style={{ fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--ink-900)" }}>Antes de começar, separe:</strong>
          <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 0 }}>
            <li>RG e CPF de todos do grupo familiar</li>
            <li>Comprovantes de renda dos últimos 3 meses</li>
            <li>Comprovantes de residência atualizados</li>
            <li>Declaração de IR 2026 ou comprovante de isenção</li>
            <li>Extratos bancários dos últimos 3 meses</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function StepEnem() {
  const editions = [
    { y: 2025, sel: true, dis: false },
    { y: 2024, sel: false, dis: false },
    { y: 2023, sel: false, dis: true },
    { y: 2022, sel: false, dis: true },
  ];
  return (
    <>
      <h2 className="signup-title">Sua participação no ENEM</h2>
      <p className="signup-sub">Informe a edição do ENEM utilizada pelo SisProuni para sua pré-seleção.</p>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field col-6">
          <label className="field-label">Edição do ENEM utilizada<span className="req">*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {editions.map((o) => (
              <label
                key={o.y}
                className="radio enem-option"
                style={{
                  border: "1.5px solid " + (o.sel ? "var(--blue-600)" : "var(--ink-200)"),
                  background: o.sel ? "var(--blue-50)" : o.dis ? "var(--ink-100)" : "#fff",
                  padding: "14px 16px",
                  borderRadius: 10,
                  cursor: o.dis ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: o.dis ? 0.55 : 1,
                }}
              >
                <input type="radio" name="enem-edition" disabled={o.dis} defaultChecked={o.sel} />
                <span className="dot" style={{ borderColor: o.sel ? "var(--blue-600)" : undefined }} />
                <span style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>ENEM {o.y}</div>
                  <div className="muted small">
                    {o.dis ? "Edição não aceita (fora das 2 últimas)" : "Aceita para este ciclo"}
                  </div>
                </span>
                {o.dis && <Badge tone="danger" dot={false}>Inválido</Badge>}
                {o.sel && <Badge tone="success" dot={false}>Selecionada</Badge>}
              </label>
            ))}
          </div>
        </div>

        <div className="field col-6">
          <label className="field-label">Nº de inscrição do ENEM<span className="req">*</span></label>
          <input className="input mono" defaultValue="241038457821" />
          <span className="field-help">12 dígitos. Disponível no Cartão de Confirmação ou na conta gov.br.</span>

          <label className="field-label" style={{ marginTop: 14 }}>
            Nº do CPF informado no ENEM<span className="req">*</span>
          </label>
          <input className="input mono" defaultValue="412.890.331-22" />
        </div>
      </div>

      <div className="divider" />

      <div className="banner banner-info">
        <IconDownload className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Notas importadas automaticamente do MEC</div>
          As notas das provas objetivas e da redação são obtidas diretamente da base do INEP/MEC a partir
          do nº de inscrição informado — não é necessário digitá-las. A verificação de elegibilidade é
          feita de forma automática.
        </div>
      </div>

      <div className="banner banner-success" style={{ marginTop: 14 }}>
        <IconCheck className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Você atende aos critérios do SISU/PROUNI</div>
          Edição 2025 (válida) · média das provas objetivas ≥ 450 · redação ≠ 0.
        </div>
      </div>
    </>
  );
}

function StepCurso() {
  const [campus, setCampus] = useState("SCS");
  const [curso, setCurso] = useState("Engenharia da Computação");
  const filtered = CURSOS.filter((c) => c.campus.includes(campus));
  const campi = [
    { id: "SCS", n: "São Caetano do Sul", addr: "Praça Mauá, 1 · Bairro Mauá", info: "Sede histórica · Engenharia e Computação", cursos: 8 },
    { id: "SP", n: "São Paulo", addr: "Rua Pedroso Alvarenga, 1284 · Itaim Bibi", info: "Cursos de gestão e design", cursos: 2 },
  ];
  return (
    <>
      <h2 className="signup-title">Selecione o curso e o campus</h2>
      <p className="signup-sub">
        Use a mesma opção da sua pré-seleção no SisProuni. A combinação curso × campus precisa coincidir
        com a vaga ofertada.
      </p>

      <div className="banner banner-info" style={{ marginTop: 14 }}>
        <IconInfo className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Sua pré-seleção</div>
          O MEC enviou sua inscrição para: <strong>Engenharia da Computação</strong> · Campus{" "}
          <strong>São Caetano do Sul</strong>. Se essa não for a opção desejada, abra um chamado com a
          secretaria antes de continuar.
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Campus<span className="req">*</span></div>
        <div className="campus-grid">
          {campi.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCampus(c.id)}
              className={`campus-card ${campus === c.id ? "selected" : ""}`}
            >
              <div className="campus-card-head">
                <IconHouse size={18} />
                <div className="campus-card-title">Campus {c.n}</div>
                {campus === c.id && <Badge tone="success" dot={false}>Selecionado</Badge>}
              </div>
              <div className="campus-card-addr">{c.addr}</div>
              <div className="campus-card-info">
                {c.info} · <span className="mono">{c.cursos}</span> cursos disponíveis
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Curso<span className="req">*</span></div>
        <div className="curso-list">
          {filtered.map((c) => (
            <button
              key={c.nome}
              type="button"
              onClick={() => setCurso(c.nome)}
              className={`curso-row ${curso === c.nome ? "selected" : ""}`}
            >
              <div className="curso-row-bullet">
                <IconGraduate size={15} />
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="curso-row-name">{c.nome}</div>
                <div className="muted small">{c.turnos.join(" · ")} · {c.duracao}</div>
              </div>
              {curso === c.nome ? <Badge tone="info" dot={false}>Escolhido</Badge> : <IconChevR size={14} className="muted" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface Membro {
  nome: string;
  parent: string;
  idade: number | string;
  cpf: string;
  prof: string;
  renda: string;
  docs: { req: number; sent: number };
}

function StepFamilia() {
  const [membros, setMembros] = useState<Membro[]>([
    { nome: "Maria Eduarda Souza Pereira", parent: "Estudante", idade: 18, cpf: "412.890.331-22", prof: "Estudante", renda: "—", docs: { req: 4, sent: 4 } },
    { nome: "Carlos Souza Pereira", parent: "Pai", idade: 47, cpf: "182.337.901-05", prof: "Motorista autônomo", renda: "2.850,00", docs: { req: 6, sent: 4 } },
    { nome: "Lúcia Vasconcelos Souza", parent: "Mãe", idade: 44, cpf: "201.554.812-33", prof: "Auxiliar administrativa", renda: "2.412,50", docs: { req: 6, sent: 6 } },
    { nome: "Pedro Souza Pereira", parent: "Irmão", idade: 13, cpf: "—", prof: "Estudante", renda: "—", docs: { req: 2, sent: 1 } },
  ]);
  const add = () =>
    setMembros([...membros, { nome: "", parent: "", idade: "", cpf: "", prof: "", renda: "", docs: { req: 4, sent: 0 } }]);

  return (
    <>
      <h2 className="signup-title">Composição familiar</h2>
      <p className="signup-sub">
        Inclua <strong>todas as pessoas que residem com você</strong>, incluindo o próprio estudante. Para
        cada membro será necessário enviar documentos de identificação, comprovante de residência e — para
        os maiores de 18 anos — comprovantes de renda.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 18 }}>
        <div className="stat">
          <div className="stat-label">Integrantes</div>
          <div className="stat-value">{membros.length}</div>
          <div className="muted small">incluindo o estudante</div>
        </div>
        <div className="stat">
          <div className="stat-label">Maiores de 18 anos</div>
          <div className="stat-value">{membros.filter((m) => +m.idade >= 18).length}</div>
          <div className="muted small">precisam comprovar renda</div>
        </div>
        <div className="stat">
          <div className="stat-label">Renda bruta declarada</div>
          <div className="stat-value mono" style={{ fontSize: 22 }}>R$ 5.262,50</div>
          <div className="muted small">R$ 1.315,63 per capita</div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Integrantes do grupo familiar</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={add}>
            <IconPlus size={14} stroke={2.5} /> Adicionar membro
          </button>
        </div>

        <div className="membro-list">
          {membros.map((m, i) => (
            <div className="membro-card" key={i}>
              <Avatar name={m.nome || "?"} size={36} />
              <div className="membro-info">
                <div className="membro-row1">
                  <input className="membro-name" defaultValue={m.nome} placeholder="Nome completo" />
                  <Badge tone={m.parent === "Estudante" ? "info" : "neutral"} dot={false}>
                    {m.parent || "Parentesco"}
                  </Badge>
                </div>
                <div className="membro-row2">
                  <span><span className="muted">Idade:</span> <span className="mono">{m.idade || "—"}</span></span>
                  <span><span className="muted">CPF:</span> <span className="mono">{m.cpf}</span></span>
                  <span><span className="muted">Profissão:</span> {m.prof}</span>
                  <span><span className="muted">Renda:</span> <span className="mono">{m.renda === "—" ? "—" : `R$ ${m.renda}`}</span></span>
                </div>
              </div>
              <div className="membro-docs">
                <div className="muted small" style={{ marginBottom: 4 }}>Documentos</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="progress-bar" style={{ width: 90 }}>
                    <div
                      style={{
                        width: `${(m.docs.sent / m.docs.req) * 100}%`,
                        background: m.docs.sent === m.docs.req ? "var(--green-600)" : "var(--amber-600)",
                      }}
                    />
                  </div>
                  <span className="mono small" style={{ color: "var(--ink-900)" }}>{m.docs.sent}/{m.docs.req}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="icon-btn"><IconUser size={15} /></button>
                {m.parent !== "Estudante" && (
                  <button type="button" className="icon-btn" onClick={() => setMembros(membros.filter((_, j) => j !== i))}>
                    <IconTrash size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="button" className="add-membro-row" onClick={add}>
            <IconPlus size={16} stroke={2.5} /> Adicionar mais um membro do grupo familiar
          </button>
        </div>
      </div>
    </>
  );
}

function StepDocs() {
  return (
    <>
      <h2 className="signup-title">Documentos comprobatórios</h2>
      <p className="signup-sub">
        Faça upload organizado por categoria. A relação completa está no edital e segue a ordem oficial
        estabelecida pela secretaria.
      </p>

      <div className="docs-summary">
        <div className="docs-summary-item">
          <div className="muted small">Categorias</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>6</div>
        </div>
        <div className="docs-summary-item">
          <div className="muted small">Itens obrigatórios</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>
            {SIGNUP_DOC_CATS.reduce((s, c) => s + c.items.length, 0)}
          </div>
        </div>
        <div className="docs-summary-item">
          <div className="muted small">Enviados</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--blue-700)" }}>14</div>
        </div>
        <div className="docs-summary-item">
          <div className="muted small">Conclusão</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--green-700)" }}>32%</div>
        </div>
        <div className="docs-summary-item" style={{ flex: 1 }}>
          <div className="muted small" style={{ marginBottom: 4 }}>Progresso geral</div>
          <div className="progress-bar"><div style={{ width: "32%" }} /></div>
        </div>
      </div>

      <div className="docs-cat-list">
        {SIGNUP_DOC_CATS.map((cat, i) => {
          const total = cat.items.length;
          const sent = [4, 1, 5, 3, 1, 0][i] || 0;
          return (
            <div className="docs-cat" key={cat.id}>
              <div className="docs-cat-head" style={{ borderLeftColor: cat.color }}>
                <div>
                  <div className="docs-cat-title">{cat.title}</div>
                  <div className="muted small" style={{ marginTop: 2 }}>
                    {total} documentos · {sent === total ? "completo" : `${sent}/${total} enviados`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="progress-bar" style={{ width: 100 }}>
                    <div style={{ width: `${(sent / total) * 100}%`, background: sent === total ? "var(--green-600)" : cat.color }} />
                  </div>
                  <span className="mono small">{sent}/{total}</span>
                </div>
              </div>
              {i < 3 && (
                <div className="docs-cat-body">
                  {cat.items.map((item, j) => {
                    const approved = j < sent;
                    return (
                      <div key={j} className={`upload-row ${approved ? "has-file" : ""}`}>
                        <div className="upload-icon">
                          {approved ? <IconCheck size={16} stroke={2.4} /> : <IconUpload size={16} />}
                        </div>
                        <div>
                          <div className="upload-title" style={{ fontSize: 13 }}>{item}</div>
                          {approved && (
                            <div className="upload-meta">Enviado · <span className="mono">arquivo_{j}.pdf</span></div>
                          )}
                        </div>
                        <div>
                          {approved ? (
                            <Badge tone="success">Enviado</Badge>
                          ) : (
                            <button type="button" className="btn btn-secondary btn-sm"><IconUpload size={13} /> Enviar</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SignupSuccess() {
  return (
    <div className="signup-shell" style={{ minHeight: "100vh", overflow: "visible" }}>
      <header className="signup-header">
        <div className="brand-pill" style={{ padding: "8px 12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" className="brand-img" style={{ height: 28 }} />
        </div>
        <div className="signup-header-titles">
          <div className="brand-sub" style={{ color: "var(--ink-500)" }}>Instituto Mauá de Tecnologia</div>
          <div style={{ color: "var(--navy-900)", fontWeight: 700, fontSize: 14 }}>PROUNI · Inscrição 2026/1</div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "60px auto", padding: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--green-100)", color: "var(--green-700)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
          <IconCheck size={36} stroke={2.6} />
        </div>
        <h1 style={{ textAlign: "center", margin: 0, fontSize: 32, color: "var(--navy-900)", letterSpacing: "-0.01em", fontWeight: 700 }}>
          Inscrição enviada com sucesso
        </h1>
        <p style={{ textAlign: "center", color: "var(--ink-600)", fontSize: 16, marginTop: 10 }}>
          Sua inscrição foi registrada e segue para a análise da Secretaria de Bolsas.
        </p>

        <div className="card" style={{ marginTop: 28 }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="muted small">Protocolo gerado</div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: "var(--navy-900)", margin: "6px 0", letterSpacing: "0.04em" }}>
              PRN-2026-0427
            </div>
            <div className="muted small">Anote esse número. Ele será usado em todas as consultas e contatos.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--ink-200)" }}>
            {[
              ["Curso", "Eng. Computação"],
              ["Campus", "São Caetano do Sul"],
              ["Ciclo", "2026/1"],
            ].map(([l, v], i) => (
              <div key={i} style={{ padding: "14px 16px", textAlign: "center", borderLeft: i ? "1px solid var(--ink-200)" : "none" }}>
                <div className="muted small">{l}</div>
                <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 18, padding: 22 }}>
          <h3 className="h-card-title" style={{ marginBottom: 12 }}>O que acontece agora</h3>
          <Timeline
            items={[
              { state: "done", title: "Inscrição protocolada", meta: "Agora · 14:32" },
              { state: "active", title: "Triagem documental pela Secretaria de Bolsas", meta: "Próximos 3 dias úteis", body: "Você receberá um e-mail caso algum documento precise ser ajustado." },
              { title: "Análise socioeconômica", meta: "Após triagem" },
              { title: "Parecer e classificação", meta: "Estimado em 5–7 dias úteis" },
              { title: "Resultado final", meta: "Previsão: 21/jun/2026" },
            ]}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
          <button type="button" className="btn btn-ghost"><IconDownload size={14} /> Baixar comprovante</button>
          <Link href="/acompanhamento" className="btn btn-primary"><IconChart size={14} /> Acompanhar minha inscrição</Link>
        </div>
      </div>
    </div>
  );
}

/* ============ Wizard orchestrator ============ */

export default function InscricaoPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [reg, setReg] = useState<{ registrationToken: string; email: string } | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Recupera o token de verificação de e-mail; sem ele, volta para /verificar.
  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("prn_registration") : null;
    if (!raw) {
      router.replace("/verificar");
      return;
    }
    try {
      setReg(JSON.parse(raw) as { registrationToken: string; email: string });
    } catch {
      router.replace("/verificar");
    }
  }, [router]);

  if (done) return <SignupSuccess />;
  if (!reg) {
    return (
      <SignupShell stepId="account">
        <p className="muted">Carregando…</p>
      </SignupShell>
    );
  }

  const step = WIZARD_STEPS[stepIdx];
  const next = () => {
    if (stepIdx < WIZARD_STEPS.length - 1) setStepIdx(stepIdx + 1);
    else setDone(true);
  };
  // Após criar a conta não se volta ao passo de cadastro (1 = ENEM é o primeiro navegável).
  const back = () => setStepIdx((i) => Math.max(1, i - 1));

  const banner =
    step === "docs" ? (
      <Banner tone="info" title="Como organizar os arquivos">
        Os documentos devem ser enviados <strong>na ordem abaixo</strong>. Formatos aceitos: PDF, JPG ou
        PNG · até 10 MB cada. Documentos ilegíveis, cortados ou com páginas faltando serão recusados —
        gerando atraso na sua análise.
      </Banner>
    ) : step === "enem" ? (
      <Banner tone="warn" title="Verifique os requisitos antes de prosseguir">
        Para concorrer ao PROUNI é obrigatório:
        <ul style={{ margin: "6px 0 0 0", paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Ter prestado o ENEM em uma das <strong>2 últimas edições</strong> (2024 ou 2025).</li>
          <li>Ter obtido <strong>nota mínima de 450 pontos</strong> na média das provas objetivas.</li>
          <li><strong>Não ter zerado a redação</strong>.</li>
        </ul>
        Informações em desacordo levam ao indeferimento automático da inscrição.
      </Banner>
    ) : undefined;

  const nextLabel = step === "docs" ? "Avançar para revisão" : "Avançar";

  return (
    <SignupShell stepId={step} banner={banner}>
      {step === "account" && (
        <StepAccount
          email={reg.email}
          registrationToken={reg.registrationToken}
          onRegistered={(res) => {
            setSession(res.accessToken, res.user);
            sessionStorage.removeItem("prn_registration");
            setStepIdx(1);
          }}
        />
      )}
      {step === "enem" && <StepEnem />}
      {step === "curso" && <StepCurso />}
      {step === "familia" && <StepFamilia />}
      {step === "docs" && <StepDocs />}

      {step !== "account" && (
        <SignupFooter nextLabel={nextLabel} canBack={stepIdx > 1} onNext={next} onBack={back} />
      )}
    </SignupShell>
  );
}
