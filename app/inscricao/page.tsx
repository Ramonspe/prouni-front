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
import { StepEstudante, StepMoradia, StepRendaDespesas, StepRevisao } from "@/components/inscricao-steps";
import { ApiError, applicationsApi, authApi, coursesApi, documentsApi, familyApi, socioApi, type AuthResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { maskCpf, maskPhone } from "@/lib/format";
import {
  INCOME_SITUATIONS,
  registerSchema,
  type ApplicationDto,
  type FamilyMemberInput,
  type RequiredDocumentsDto,
  type SocioFormInput,
} from "@prouni/shared";

type WizardStep = "account" | "enem" | "curso" | "estudante" | "familia" | "moradia" | "renda" | "docs" | "revisao";
const WIZARD_STEPS: WizardStep[] = ["account", "enem", "curso", "estudante", "familia", "moradia", "renda", "docs", "revisao"];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DOB_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const DOB_YEARS = Array.from({ length: 2014 - 1940 + 1 }, (_, i) => String(2014 - i));

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
  const [optInPcd, setOptInPcd] = useState(false);
  const [optInImt, setOptInImt] = useState(false);
  const [err, setErr] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const [dob, setDob] = useState({ d: "", m: "", y: "" });
  const updateDob = (patch: Partial<typeof dob>) => {
    const nx = { ...dob, ...patch };
    setDob(nx);
    const bd = nx.d && nx.m && nx.y ? `${nx.d.padStart(2, "0")}/${nx.m.padStart(2, "0")}/${nx.y}` : "";
    setForm((f) => ({ ...f, birthDate: bd }));
  };

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
      optInPcd,
      optInImt,
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
        optInPcd,
        optInImt,
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
              <input className="input" placeholder="000.000.000-00" inputMode="numeric" value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))} />
            </div>
            <span className="field-help">O CPF informado deve ser o mesmo do SisProuni.</span>
            {fe.cpf && <span className="field-help" style={{ color: "var(--red-700)" }}>{fe.cpf}</span>}
          </div>
          <div className="field col-6">
            <label className="field-label">Data de nascimento</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="select" style={{ flex: "0 0 72px" }} aria-label="Dia" value={dob.d} onChange={(e) => updateDob({ d: e.target.value })}>
                <option value="">Dia</option>
                {DOB_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="select" style={{ flex: 1 }} aria-label="Mês" value={dob.m} onChange={(e) => updateDob({ m: e.target.value })}>
                <option value="">Mês</option>
                {MONTHS.map((mo, i) => <option key={mo} value={String(i + 1)}>{mo}</option>)}
              </select>
              <select className="select" style={{ flex: "0 0 88px" }} aria-label="Ano" value={dob.y} onChange={(e) => updateDob({ y: e.target.value })}>
                <option value="">Ano</option>
                {DOB_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
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
            <input className="input" placeholder="(11) 99999-9999" inputMode="numeric" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))} />
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

          <label className="checkbox">
            <input type="checkbox" checked={optInPcd} onChange={() => setOptInPcd((v) => !v)} />
            <span className="box" />
            <span>
              Sou <strong>pessoa com deficiência (PCD)</strong>. Estou ciente de que deverei anexar laudo
              médico com CID e a declaração específica junto aos documentos.
            </span>
          </label>

          <label className="checkbox">
            <input type="checkbox" checked={optInImt} onChange={() => setOptInImt((v) => !v)} />
            <span className="box" />
            <span>
              Sou <strong>funcionário, professor ou dependente</strong> de funcionário/professor do
              Instituto Mauá de Tecnologia (exige termo de aceite específico).
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

export function StepFamilia({ appId, onValidChange }: { appId: string | null; onValidChange: (v: boolean) => void }) {
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
  const adultsWithIncome = list.filter((m) => (m.age ?? 0) >= 18).every((m) => (m.incomeSituations ?? []).length > 0);
  useEffect(() => { onValidChange(list.length > 0 && adultsWithIncome); }, [list.length, adultsWithIncome]); // eslint-disable-line react-hooks/exhaustive-deps
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
                        inputMode="numeric"
                        defaultValue={m.cpf ?? ""}
                        onChange={(e) => { e.target.value = maskCpf(e.target.value); }}
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
                    <label className="muted small">
                      Estado civil{" "}
                      <select
                        className="input"
                        style={{ width: 150, height: 28, fontSize: 12.5 }}
                        defaultValue={m.maritalStatus ?? ""}
                        onChange={(e) => update(m.id, { maritalStatus: e.target.value })}
                      >
                        <option value="">—</option>
                        <option>Solteiro(a)</option>
                        <option>Casado(a)</option>
                        <option>Divorciado(a)</option>
                        <option>Viúvo(a)</option>
                        <option>União estável</option>
                      </select>
                    </label>
                    <label className="muted small" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <input
                        type="checkbox"
                        defaultChecked={m.isFinancialResponsible}
                        onChange={(e) => update(m.id, { isFinancialResponsible: e.target.checked })}
                      />
                      Responsável financeiro
                    </label>
                    <label className="muted small">
                      Escola / Universidade{" "}
                      <input
                        className="input"
                        style={{ width: 200, height: 28 }}
                        defaultValue={m.schoolName ?? ""}
                        onBlur={(e) => update(m.id, { schoolName: e.target.value })}
                      />
                    </label>
                    <label className="muted small">
                      Valor da parcela (R$){" "}
                      <input
                        className="input mono"
                        style={{ width: 120, height: 28 }}
                        defaultValue={m.schoolFee ?? ""}
                        onBlur={(e) => update(m.id, { schoolFee: toMoney(e.target.value) })}
                      />
                    </label>
                  </div>
                  {(m.age ?? 0) >= 18 && (
                    <div style={{ marginTop: 8 }}>
                      <div className="muted small" style={{ marginBottom: 6 }}>
                        Situação de renda <strong>(pode marcar mais de uma)</strong>:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {INCOME_SITUATIONS.map((s) => {
                          const on = (m.incomeSituations ?? []).includes(s.value);
                          return (
                            <button
                              key={s.value}
                              type="button"
                              title={s.hint}
                              onClick={() => {
                                const cur = m.incomeSituations ?? [];
                                const nextList = on ? cur.filter((x) => x !== s.value) : [...cur, s.value];
                                update(m.id, { incomeSituations: nextList });
                              }}
                              style={{
                                fontSize: 12,
                                padding: "5px 10px",
                                borderRadius: 16,
                                border: "1px solid " + (on ? "var(--blue-600)" : "var(--ink-200)"),
                                background: on ? "var(--blue-50)" : "#fff",
                                color: on ? "var(--blue-700)" : "var(--ink-700)",
                                fontWeight: on ? 600 : 500,
                              }}
                            >
                              {on ? "✓ " : ""}{s.label}
                            </button>
                          );
                        })}
                      </div>
                      {(m.incomeSituations ?? []).includes("ASSALARIADO") && (
                        <label className="checkbox" style={{ marginTop: 8 }}>
                          <input type="checkbox" defaultChecked={m.receivesCommissionOvertime} onChange={(e) => update(m.id, { receivesCommissionOvertime: e.target.checked })} />
                          <span className="box" /><span className="small">Recebe comissão ou hora extra (exige os 6 últimos holerites)</span>
                        </label>
                      )}
                      {(m.incomeSituations ?? []).includes("EMPRESARIO") && (
                        <label className="checkbox" style={{ marginTop: 6 }}>
                          <input type="checkbox" defaultChecked={m.companyInactive} onChange={(e) => update(m.id, { companyInactive: e.target.checked })} />
                          <span className="box" /><span className="small">A empresa está inativa (exige DCTF/DEFIS sem movimento)</span>
                        </label>
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

function StepDocs({ appId }: { appId: string | null }) {
  const qc = useQueryClient();
  const docs = useQuery({
    queryKey: ["required-docs", appId],
    queryFn: () => applicationsApi.requiredDocuments(appId as string),
    enabled: !!appId,
  });
  const uploaded = useQuery({
    queryKey: ["uploaded-docs", appId],
    queryFn: () => documentsApi.list(appId as string),
    enabled: !!appId,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [upErr, setUpErr] = useState("");
  const data: RequiredDocumentsDto | undefined = docs.data;
  const upMap = new Map((uploaded.data ?? []).map((u) => [`${u.documentTypeId}:${u.familyMemberId ?? "app"}`, u]));

  const onPick = async (key: string, typeId: string, memberId: string | null, file?: File) => {
    if (!file || !appId) return;
    setUpErr("");
    setBusy(key);
    try {
      await documentsApi.upload(appId, typeId, memberId, file);
      await qc.invalidateQueries({ queryKey: ["uploaded-docs", appId] });
    } catch (e) {
      setUpErr(e instanceof ApiError ? e.message : "Falha no envio do arquivo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <h2 className="signup-title">Documentos comprobatórios</h2>
      <p className="signup-sub">
        Esta é a lista <strong>exata</strong> de documentos para o seu caso, montada a partir das respostas
        da ficha. Envie cada arquivo (PDF, JPG ou PNG, até 10 MB). Itens com{" "}
        <span className="mono">gov.br</span> exigem assinatura digital ou firma em cartório.
      </p>
      {upErr && (
        <div className="banner banner-danger" style={{ marginTop: 12, padding: "10px 12px" }}>
          <div className="banner-body" style={{ color: "var(--red-700)" }}>{upErr}</div>
        </div>
      )}

      {docs.isLoading ? (
        <p className="muted" style={{ marginTop: 16 }}>Montando a sua lista de documentos…</p>
      ) : docs.isError || !data ? (
        <Banner tone="warn" title="Não foi possível montar a lista de documentos">
          Verifique sua conexão e tente novamente.
        </Banner>
      ) : (
        <>
          {data.notes.length > 0 && (
            <Banner tone="info" title="Complete a ficha para personalizar a lista">
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {data.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </Banner>
          )}

          <div className="docs-summary" style={{ marginTop: 14 }}>
            <div className="docs-summary-item">
              <div className="muted small">Documentos</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{data.totals.total}</div>
            </div>
            <div className="docs-summary-item">
              <div className="muted small">Enviados</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--green-700)" }}>{uploaded.data?.length ?? 0}</div>
            </div>
            <div className="docs-summary-item" style={{ flex: 1 }}>
              <div className="muted small" style={{ marginBottom: 4 }}>
                A lista se ajusta conforme você altera a ficha (situação de renda, moradia, rendas e perfil).
              </div>
            </div>
          </div>

          <div className="docs-cat-list">
            {data.categories.map((cat) => (
              <div className="docs-cat" key={cat.id}>
                <div className="docs-cat-head" style={{ borderLeftColor: cat.colorVar ?? "var(--blue-600)" }}>
                  <div>
                    <div className="docs-cat-title">{cat.title}</div>
                    <div className="muted small" style={{ marginTop: 2 }}>{cat.items.length} documento(s)</div>
                  </div>
                </div>
                <div className="docs-cat-body">
                  {cat.items.map((it) => {
                    const up = upMap.get(it.key);
                    const sent = !!up && up.status !== "A_ENVIAR";
                    return (
                      <div key={it.key} className="upload-row">
                        <div className="upload-icon"><IconUpload size={16} /></div>
                        <div style={{ flex: 1 }}>
                          <div className="upload-title" style={{ fontSize: 13 }}>
                            {it.name}
                            {it.requiresSignature && (
                              <span className="mono" style={{ color: "var(--amber-700)", marginLeft: 6, fontSize: 11 }}>gov.br</span>
                            )}
                          </div>
                          {(it.member || it.conditionLabel) && (
                            <div className="upload-meta">
                              {it.member ? `${it.member.relationship}${it.member.name ? " · " + it.member.name : ""}` : it.conditionLabel}
                            </div>
                          )}
                          {sent && <div className="upload-meta" style={{ color: "var(--green-700)" }}>Enviado: {up!.fileName}</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge tone={up?.status === "APROVADO" ? "success" : up?.status === "REPROVADO" ? "danger" : sent ? "info" : "neutral"}>
                            {up?.status === "APROVADO" ? "Aprovado" : up?.status === "REPROVADO" ? "Reenviar" : sent ? "Enviado" : "A enviar"}
                          </Badge>
                          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                            {busy === it.key ? "Enviando…" : sent ? "Trocar" : "Enviar"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                              style={{ display: "none" }}
                              disabled={busy === it.key}
                              onChange={(e) => onPick(it.key, it.typeId, it.member?.id ?? null, e.target.files?.[0])}
                            />
                          </label>
                        </div>
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
  const [valid, setValid] = useState<Record<string, boolean>>({});

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
      } else if (step === "revisao") {
        setSaving(true);
        const id = await ensureAppId();
        if (id) await socioApi.submit(id);
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

  const nextLabel = step === "revisao" ? "Concluir inscrição" : "Avançar";

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
      {step === "estudante" && <StepEstudante appId={appId} />}
      {step === "familia" && <StepFamilia appId={appId} onValidChange={(v) => setValid((s) => ({ ...s, familia: v }))} />}
      {step === "moradia" && <StepMoradia appId={appId} onValidChange={(v) => setValid((s) => ({ ...s, moradia: v }))} />}
      {step === "renda" && <StepRendaDespesas appId={appId} />}
      {step === "docs" && <StepDocs appId={appId} />}
      {step === "revisao" && <StepRevisao appId={appId} onReadyChange={(v) => setValid((s) => ({ ...s, revisao: v }))} />}

      {step !== "account" && err && (
        <div className="banner banner-danger" style={{ marginTop: 16, padding: "10px 12px" }}>
          <div className="banner-body" style={{ color: "var(--red-700)" }}>{err}</div>
        </div>
      )}

      {step !== "account" && (
        <SignupFooter nextLabel={nextLabel} canBack={stepIdx > 1} disabled={saving || (["familia", "moradia", "revisao"].includes(step) && !valid[step])} onNext={next} onBack={back} />
      )}
    </SignupShell>
  );
}
