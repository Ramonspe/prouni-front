"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ApiError, applicationsApi, authApi, coursesApi, cyclesApi, familyApi, type AuthResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  INCOME_SITUATIONS,
  registerSchema,
  type ApplicationDto,
  type DocumentCategoryDto,
  type FamilyMemberInput,
} from "@prouni/shared";

type WizardStep = "account" | "enem" | "curso" | "familia" | "docs";
const WIZARD_STEPS: WizardStep[] = ["account", "enem", "curso", "familia", "docs"];

/** Normaliza um valor digitado para a string monetária canônica "1234.56". */
function toMoney(raw: string): string | undefined {
  const t = raw.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return /^\d{1,12}(\.\d{1,2})?$/.test(t) ? t : undefined;
}

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
  const [fe, setFe] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr("");
    // Validação no próprio passo (mesmas regras do back, via @prouni/shared).
    const parsed = registerSchema.safeParse({
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
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "");
        if (k && !errs[k]) errs[k] = issue.message;
      }
      setFe(errs);
      setErr("Confira os campos destacados antes de continuar.");
      return;
    }
    setFe({});
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
            {fe.cpf && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.cpf}</span>}
          </div>
          <div className="field col-6">
            <label className="field-label">Data de nascimento</label>
            <input className="input" placeholder="dd/mm/aaaa" value={form.birthDate} onChange={set("birthDate")} />
          </div>
          <div className="field col-12">
            <label className="field-label">Nome completo<span className="req">*</span></label>
            <input className="input" value={form.fullName} onChange={set("fullName")} />
            {fe.fullName && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.fullName}</span>}
          </div>
          <div className="field col-6">
            <label className="field-label">E-mail (verificado)</label>
            <input className="input" value={email} readOnly style={{ background: "var(--ink-100)", color: "var(--ink-700)" }} />
          </div>
          <div className="field col-6">
            <label className="field-label">Celular (com DDD)<span className="req">*</span></label>
            <input className="input" placeholder="(11) 99999-9999" value={form.phone} onChange={set("phone")} />
            {fe.phone && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.phone}</span>}
          </div>
          <div className="field col-6">
            <label className="field-label">Senha de acesso<span className="req">*</span></label>
            <div className="input-with-icon">
              <input type="password" className="input" value={form.password} onChange={set("password")} />
            </div>
            <span className="field-help">Mínimo 8 caracteres com 1 número e 1 caractere especial.</span>
            {fe.password && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.password}</span>}
          </div>
          <div className="field col-6">
            <label className="field-label">Confirme a senha<span className="req">*</span></label>
            <div className="input-with-icon">
              <input type="password" className="input" value={form.confirmPassword} onChange={set("confirmPassword")} />
            </div>
            {fe.confirmPassword && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.confirmPassword}</span>}
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

function StepEnem({
  value,
  onChange,
}: {
  value: { edition: string; registration: string };
  onChange: (v: { edition: string; registration: string }) => void;
}) {
  const editions = [
    { y: 2025, dis: false },
    { y: 2024, dis: false },
    { y: 2023, dis: true },
    { y: 2022, dis: true },
  ];
  return (
    <>
      <h2 className="signup-title">Sua participação no ENEM</h2>
      <p className="signup-sub">Informe a edição do ENEM utilizada pelo SisProuni para sua pré-seleção.</p>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field col-6">
          <label className="field-label">Edição do ENEM utilizada<span className="req">*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {editions.map((o) => {
              const sel = String(o.y) === value.edition;
              return (
                <label
                  key={o.y}
                  className="radio enem-option"
                  style={{
                    border: "1.5px solid " + (sel ? "var(--blue-600)" : "var(--ink-200)"),
                    background: sel ? "var(--blue-50)" : o.dis ? "var(--ink-100)" : "#fff",
                    padding: "14px 16px",
                    borderRadius: 10,
                    cursor: o.dis ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: o.dis ? 0.55 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="enem-edition"
                    disabled={o.dis}
                    checked={sel}
                    onChange={() => !o.dis && onChange({ ...value, edition: String(o.y) })}
                  />
                  <span className="dot" style={{ borderColor: sel ? "var(--blue-600)" : undefined }} />
                  <span style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>ENEM {o.y}</div>
                    <div className="muted small">
                      {o.dis ? "Edição não aceita (fora das 2 últimas)" : "Aceita para este ciclo"}
                    </div>
                  </span>
                  {o.dis && <Badge tone="danger" dot={false}>Inválido</Badge>}
                  {sel && <Badge tone="success" dot={false}>Selecionada</Badge>}
                </label>
              );
            })}
          </div>
        </div>

        <div className="field col-6">
          <label className="field-label">Nº de inscrição do ENEM<span className="req">*</span></label>
          <input
            className="input mono"
            inputMode="numeric"
            maxLength={12}
            placeholder="000000000000"
            value={value.registration}
            onChange={(e) => onChange({ ...value, registration: e.target.value.replace(/\D/g, "").slice(0, 12) })}
          />
          <span className="field-help">12 dígitos. Disponível no Cartão de Confirmação ou na conta gov.br.</span>
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
    </>
  );
}

function StepCurso({
  campus,
  courseId,
  onCampus,
  onCourse,
}: {
  campus: string;
  courseId: string | null;
  onCampus: (code: string) => void;
  onCourse: (id: string) => void;
}) {
  const campuses = useQuery({ queryKey: ["campuses"], queryFn: coursesApi.campuses });
  const courses = useQuery({
    queryKey: ["courses", campus],
    queryFn: () => coursesApi.courses(campus),
    enabled: !!campus,
  });

  return (
    <>
      <h2 className="signup-title">Selecione o curso e o campus</h2>
      <p className="signup-sub">
        Use a mesma opção da sua pré-seleção no SisProuni. A combinação curso × campus precisa coincidir
        com a vaga ofertada.
      </p>

      <div style={{ marginTop: 22 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Campus<span className="req">*</span></div>
        <div className="campus-grid">
          {(campuses.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCampus(c.code)}
              className={`campus-card ${campus === c.code ? "selected" : ""}`}
            >
              <div className="campus-card-head">
                <IconHouse size={18} />
                <div className="campus-card-title">Campus {c.name}</div>
                {campus === c.code && <Badge tone="success" dot={false}>Selecionado</Badge>}
              </div>
              {c.address && <div className="campus-card-addr">{c.address}</div>}
              <div className="campus-card-info">
                <span className="mono">{c.courseCount ?? 0}</span> cursos disponíveis
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="field-label" style={{ marginBottom: 10 }}>Curso<span className="req">*</span></div>
        <div className="curso-list">
          {courses.isLoading ? (
            <p className="muted">Carregando cursos…</p>
          ) : (
            (courses.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCourse(c.id)}
                className={`curso-row ${courseId === c.id ? "selected" : ""}`}
              >
                <div className="curso-row-bullet">
                  <IconGraduate size={15} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="curso-row-name">{c.name}</div>
                  <div className="muted small">
                    {c.shifts.join(" · ")}{c.durationYears ? ` · ${c.durationYears} anos` : ""}
                  </div>
                </div>
                {courseId === c.id ? <Badge tone="info" dot={false}>Escolhido</Badge> : <IconChevR size={14} className="muted" />}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function StepFamilia({ appId }: { appId: string | null }) {
  const qc = useQueryClient();
  const members = useQuery({
    queryKey: ["family", appId],
    queryFn: () => familyApi.list(appId as string),
    enabled: !!appId,
  });
  const list = members.data ?? [];
  const refetch = () => qc.invalidateQueries({ queryKey: ["family", appId] });

  const [draft, setDraft] = useState({ fullName: "", relationship: "" });
  const [adding, setAdding] = useState(false);

  const update = (id: string, patch: Partial<FamilyMemberInput>) =>
    familyApi.update(id, patch).then(refetch).catch(() => {});

  const addMember = async () => {
    if (!appId || draft.fullName.trim().length < 2 || !draft.relationship.trim()) return;
    setAdding(true);
    try {
      await familyApi.create(appId, { fullName: draft.fullName.trim(), relationship: draft.relationship.trim() });
      setDraft({ fullName: "", relationship: "" });
      refetch();
    } finally {
      setAdding(false);
    }
  };

  const adults = list.filter((m) => (m.age ?? 0) >= 18).length;
  const totalIncome = list.reduce((s, m) => s + (m.grossIncome ? Number(m.grossIncome) : 0), 0);
  const perCapita = list.length ? totalIncome / list.length : 0;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <h2 className="signup-title">Composição familiar</h2>
      <p className="signup-sub">
        Inclua <strong>todas as pessoas que residem com você</strong>, incluindo o próprio estudante. Para
        cada membro será necessário enviar documentos de identificação, comprovante de residência e — para
        os maiores de 18 anos — comprovantes de renda. As alterações são salvas automaticamente.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 18 }}>
        <div className="stat">
          <div className="stat-label">Integrantes</div>
          <div className="stat-value">{list.length}</div>
          <div className="muted small">incluindo o estudante</div>
        </div>
        <div className="stat">
          <div className="stat-label">Maiores de 18 anos</div>
          <div className="stat-value">{adults}</div>
          <div className="muted small">precisam comprovar renda</div>
        </div>
        <div className="stat">
          <div className="stat-label">Renda bruta declarada</div>
          <div className="stat-value mono" style={{ fontSize: 22 }}>R$ {fmt(totalIncome)}</div>
          <div className="muted small">R$ {fmt(perCapita)} per capita</div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <h3 className="section-title" style={{ margin: "0 0 10px" }}>Integrantes do grupo familiar</h3>

        {members.isLoading || !appId ? (
          <p className="muted">Carregando integrantes…</p>
        ) : (
          <div className="membro-list">
            {list.map((m) => (
              <div className="membro-card" key={m.id}>
                <Avatar name={m.fullName || "?"} size={36} />
                <div className="membro-info" style={{ flex: 1 }}>
                  <div className="membro-row1" style={{ gap: 8 }}>
                    <input
                      className="membro-name"
                      defaultValue={m.fullName}
                      placeholder="Nome completo"
                      onBlur={(e) => e.target.value !== m.fullName && update(m.id, { fullName: e.target.value })}
                    />
                    <input
                      className="input"
                      style={{ maxWidth: 150, height: 30, fontSize: 12.5 }}
                      defaultValue={m.relationship}
                      placeholder="Parentesco"
                      onBlur={(e) => e.target.value !== m.relationship && update(m.id, { relationship: e.target.value })}
                    />
                  </div>
                  <div className="membro-row2" style={{ gap: 12, flexWrap: "wrap", marginTop: 6 }}>
                    <label className="muted small">
                      Idade{" "}
                      <input
                        className="input mono"
                        style={{ width: 60, height: 28 }}
                        defaultValue={m.age ?? ""}
                        onBlur={(e) => update(m.id, { age: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </label>
                    <label className="muted small">
                      CPF{" "}
                      <input
                        className="input mono"
                        style={{ width: 150, height: 28 }}
                        defaultValue={m.cpf ?? ""}
                        onBlur={(e) => update(m.id, { cpf: e.target.value })}
                      />
                    </label>
                    <label className="muted small">
                      Profissão{" "}
                      <input
                        className="input"
                        style={{ width: 170, height: 28 }}
                        defaultValue={m.occupation ?? ""}
                        onBlur={(e) => update(m.id, { occupation: e.target.value })}
                      />
                    </label>
                    <label className="muted small">
                      Renda bruta (R$){" "}
                      <input
                        className="input mono"
                        style={{ width: 120, height: 28 }}
                        defaultValue={m.grossIncome ?? ""}
                        onBlur={(e) => update(m.id, { grossIncome: toMoney(e.target.value) })}
                      />
                    </label>
                  </div>
                  {(m.age ?? 0) >= 18 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="muted small">Situação de renda:</span>
                        <select
                          className="input"
                          style={{ height: 32, padding: "2px 8px", fontSize: 12.5, maxWidth: 380 }}
                          value={m.incomeSituation ?? ""}
                          onChange={(e) => update(m.id, { incomeSituation: (e.target.value || undefined) as FamilyMemberInput["incomeSituation"] })}
                        >
                          <option value="">Selecione…</option>
                          {INCOME_SITUATIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      {m.incomeSituation && (
                        <div className="muted small" style={{ marginTop: 4 }}>
                          Documento esperado: {INCOME_SITUATIONS.find((s) => s.value === m.incomeSituation)?.hint}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button type="button" className="icon-btn" title="Remover" onClick={() => familyApi.remove(m.id).then(refetch).catch(() => {})}>
                  <IconTrash size={15} />
                </button>
              </div>
            ))}

            <div className="membro-card" style={{ alignItems: "center", gap: 10 }}>
              <IconPlus size={18} stroke={2.5} />
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Nome completo do novo integrante"
                value={draft.fullName}
                onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              />
              <input
                className="input"
                style={{ maxWidth: 170 }}
                placeholder="Parentesco"
                value={draft.relationship}
                onChange={(e) => setDraft((d) => ({ ...d, relationship: e.target.value }))}
              />
              <button type="button" className="btn btn-secondary btn-sm" disabled={adding} onClick={addMember}>
                {adding ? "Adicionando…" : "Adicionar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/** Rótulo da condição/escopo de um tipo de documento, para exibição. */
function docScopeHint(scope: string, appliesTo: string | null): string | null {
  if (appliesTo) return appliesTo;
  if (scope === "EACH_MEMBER") return "Para cada integrante do grupo familiar";
  if (scope === "EACH_ADULT") return "Para cada integrante maior de 18 anos";
  return null;
}

function StepDocs() {
  const docs = useQuery({ queryKey: ["doc-types"], queryFn: cyclesApi.documentTypes });
  const categories: DocumentCategoryDto[] = docs.data?.categories ?? [];
  const totalTypes = categories.reduce((s, c) => s + c.types.length, 0);

  return (
    <>
      <h2 className="signup-title">Documentos comprobatórios</h2>
      <p className="signup-sub">
        Esta é a <strong>relação completa</strong> de documentos do processo, na ordem oficial. Conforme a
        situação de renda de cada integrante, a posse do imóvel e as rendas declaradas, o sistema mostra
        exatamente quais se aplicam a você na etapa de envio.
      </p>

      {docs.isLoading ? (
        <p className="muted" style={{ marginTop: 16 }}>Carregando a relação de documentos…</p>
      ) : docs.isError ? (
        <Banner tone="warn" title="Não foi possível carregar a relação de documentos">
          Verifique sua conexão e tente novamente.
        </Banner>
      ) : (
        <>
          <div className="docs-summary">
            <div className="docs-summary-item">
              <div className="muted small">Categorias</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{categories.length}</div>
            </div>
            <div className="docs-summary-item">
              <div className="muted small">Tipos de documento</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{totalTypes}</div>
            </div>
            <div className="docs-summary-item" style={{ flex: 1 }}>
              <div className="muted small" style={{ marginBottom: 4 }}>
                A lista exata, por integrante e condição, é montada após o preenchimento da ficha.
              </div>
            </div>
          </div>

          <div className="docs-cat-list">
            {categories.map((cat) => (
              <div className="docs-cat" key={cat.id}>
                <div className="docs-cat-head" style={{ borderLeftColor: cat.colorVar ?? "var(--blue-600)" }}>
                  <div>
                    <div className="docs-cat-title">{cat.title}</div>
                    <div className="muted small" style={{ marginTop: 2 }}>{cat.types.length} documento(s)</div>
                  </div>
                </div>
                <div className="docs-cat-body">
                  {cat.types.map((t) => {
                    const hint = docScopeHint(t.scope, t.appliesTo);
                    return (
                      <div key={t.id} className="upload-row">
                        <div className="upload-icon"><IconUpload size={16} /></div>
                        <div>
                          <div className="upload-title" style={{ fontSize: 13 }}>{t.name}</div>
                          {hint && <div className="upload-meta">{hint}</div>}
                        </div>
                        <div><Badge tone="neutral">A enviar</Badge></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function SignupSuccess({ app }: { app: ApplicationDto | null }) {
  return (
    <div className="signup-shell" style={{ minHeight: "100vh", overflow: "visible" }}>
      <header className="signup-header">
        <div className="brand-pill" style={{ padding: "8px 12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" className="brand-img" style={{ height: 28 }} />
        </div>
        <div className="signup-header-titles">
          <div className="brand-sub" style={{ color: "var(--ink-500)" }}>Instituto Mauá de Tecnologia</div>
          <div style={{ color: "var(--navy-900)", fontWeight: 700, fontSize: 14 }}>PROUNI · Inscrição {app?.cycle.label ?? "2026/2"}</div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "60px auto", padding: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--green-100)", color: "var(--green-700)", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
          <IconCheck size={36} stroke={2.6} />
        </div>
        <h1 style={{ textAlign: "center", margin: 0, fontSize: 32, color: "var(--navy-900)", letterSpacing: "-0.01em", fontWeight: 700 }}>
          Inscrição iniciada com sucesso
        </h1>
        <p style={{ textAlign: "center", color: "var(--ink-600)", fontSize: 16, marginTop: 10 }}>
          Seus dados foram registrados. Continue pela sua área do candidato para preencher a ficha e enviar
          os documentos.
        </p>

        <div className="card" style={{ marginTop: 28 }}>
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="muted small">Protocolo gerado</div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: "var(--navy-900)", margin: "6px 0", letterSpacing: "0.04em" }}>
              {app?.protocol ?? "—"}
            </div>
            <div className="muted small">Anote esse número. Ele será usado em todas as consultas e contatos.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--ink-200)" }}>
            {[
              ["Curso", app?.course?.name ?? "A confirmar"],
              ["Campus", app?.course?.campus.name ?? "—"],
              ["Ciclo", app?.cycle.label ?? "—"],
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
              { state: "done", title: "Acesso criado e inscrição iniciada", meta: "Agora" },
              { state: "active", title: "Preencha a ficha socioeconômica e envie os documentos", meta: "Próximo passo", body: "Disponível na sua área do candidato." },
              { title: "Triagem documental pela Secretaria de Bolsas", meta: "Após o envio" },
              { title: "Análise socioeconômica e parecer", meta: "Em seguida" },
              { title: "Resultado final", meta: "Previsão do edital" },
            ]}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
          <button type="button" className="btn btn-ghost"><IconDownload size={14} /> Baixar comprovante</button>
          <Link href="/painel" className="btn btn-primary"><IconChart size={14} /> Ir para minha área</Link>
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

  const [appId, setAppId] = useState<string | null>(null);
  const [enem, setEnem] = useState({ edition: "2025", registration: "" });
  const [campus, setCampus] = useState("SCS");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [finalApp, setFinalApp] = useState<ApplicationDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  if (done) return <SignupSuccess app={finalApp} />;
  if (!reg) {
    return (
      <SignupShell stepId="account">
        <p className="muted">Carregando…</p>
      </SignupShell>
    );
  }

  const step = WIZARD_STEPS[stepIdx];

  const ensureAppId = async (): Promise<string | null> => {
    if (appId) return appId;
    const me = await applicationsApi.me().catch(() => null);
    if (me) setAppId(me.id);
    return me?.id ?? null;
  };

  const next = async () => {
    setErr("");
    try {
      if (step === "enem") {
        if (!["2024", "2025"].includes(enem.edition)) {
          setErr("Selecione uma edição válida do ENEM (2024 ou 2025).");
          return;
        }
        if (!/^\d{12}$/.test(enem.registration)) {
          setErr("Informe o nº de inscrição do ENEM (12 dígitos).");
          return;
        }
        setSaving(true);
        const id = await ensureAppId();
        if (id) await applicationsApi.enem(id, { edition: Number(enem.edition), registration: enem.registration });
      } else if (step === "curso") {
        if (!courseId) {
          setErr("Selecione o curso desejado.");
          return;
        }
        setSaving(true);
        const id = await ensureAppId();
        if (id) await applicationsApi.course(id, { courseId });
      } else if (step === "docs") {
        setSaving(true);
        const id = await ensureAppId();
        const me = id ? await applicationsApi.me().catch(() => null) : null;
        setFinalApp(me);
        setDone(true);
        return;
      }
      if (stepIdx < WIZARD_STEPS.length - 1) setStepIdx(stepIdx + 1);
      else setDone(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Após criar a conta não se volta ao passo de cadastro (1 = ENEM é o primeiro navegável).
  const back = () => {
    setErr("");
    setStepIdx((i) => Math.max(1, i - 1));
  };

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

  const nextLabel = step === "docs" ? "Concluir inscrição" : "Avançar";

  return (
    <SignupShell stepId={step} banner={banner}>
      {step === "account" && (
        <StepAccount
          email={reg.email}
          registrationToken={reg.registrationToken}
          onRegistered={async (res) => {
            setSession(res.accessToken, res.user);
            sessionStorage.removeItem("prn_registration");
            const me = await applicationsApi.me().catch(() => null);
            if (me) {
              setAppId(me.id);
              if (me.course) {
                setCourseId(me.course.id);
                setCampus(me.course.campus.code);
              }
            }
            setStepIdx(1);
          }}
        />
      )}
      {step === "enem" && <StepEnem value={enem} onChange={setEnem} />}
      {step === "curso" && (
        <StepCurso
          campus={campus}
          courseId={courseId}
          onCampus={(c) => { setCampus(c); setCourseId(null); }}
          onCourse={setCourseId}
        />
      )}
      {step === "familia" && <StepFamilia appId={appId} />}
      {step === "docs" && <StepDocs />}

      {step !== "account" && err && (
        <div className="banner banner-danger" style={{ marginTop: 16, padding: "10px 12px" }}>
          <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
        </div>
      )}

      {step !== "account" && (
        <SignupFooter nextLabel={nextLabel} canBack={stepIdx > 1} disabled={saving} onNext={next} onBack={back} />
      )}
    </SignupShell>
  );
}
