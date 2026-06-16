"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { socioApi } from "@/lib/api";
import type { SocioFormDto, SocioFormInput } from "@prouni/shared";
import { maskCep } from "@/lib/format";
import { IconCar, IconHouse, IconInfo, IconShield, IconWallet } from "@/components/icons";

type Form = SocioFormDto["form"];
type Income = SocioFormDto["incomes"][number];

/** Normaliza um valor digitado para a string monetária canônica "1234.56". */
function toMoney(raw: string): string | undefined {
  const t = raw.replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  return /^\d{1,12}(\.\d{1,2})?$/.test(t) ? t : undefined;
}

/** Carrega a ficha uma vez e mantém estado local; salva (patch) sem invalidar (evita clobber ao digitar). */
function useSocioForm(appId: string | null) {
  const q = useQuery({
    queryKey: ["socio", appId],
    queryFn: () => socioApi.get(appId as string),
    enabled: !!appId,
  });
  const [form, setForm] = useState<Partial<Form>>({});
  const [vehicles, setVehicles] = useState<SocioFormDto["vehicles"]>([]);
  const [expenses, setExpenses] = useState<SocioFormDto["expenses"]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (q.data && !seeded) {
      setForm(q.data.form);
      setVehicles(q.data.vehicles);
      setExpenses(q.data.expenses);
      setIncomes(q.data.incomes);
      setSeeded(true);
    }
  }, [q.data, seeded]);

  const save = (patch: SocioFormInput) => {
    if (appId) void socioApi.patch(appId, patch);
  };

  return { loading: q.isLoading || !seeded, form, setForm, vehicles, setVehicles, expenses, setExpenses, incomes, setIncomes, save };
}

/* ============ Passo: Dados do estudante ============ */

export function StepEstudante({ appId }: { appId: string | null }) {
  const { loading, form, setForm, save } = useSocioForm(appId);
  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (loading) return <p className="muted">Carregando…</p>;
  return (
    <>
      <h2 className="signup-title">Dados do estudante</h2>
      <p className="signup-sub">
        Nome, CPF e curso já vieram das etapas anteriores. Complete os dados acadêmicos abaixo.
      </p>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field col-6">
          <label className="field-label">Ano / semestre que cursará</label>
          <input
            className="input"
            placeholder="2026 / 1"
            defaultValue={form.yearTerm ?? ""}
            onBlur={(e) => { set("yearTerm", e.target.value); save({ yearTerm: e.target.value }); }}
          />
        </div>
        <div className="field col-6">
          <label className="field-label">Cadastro Único — NIS</label>
          <input
            className="input"
            placeholder="000.00000.00-0"
            defaultValue={form.nisCadUnico ?? ""}
            onBlur={(e) => { set("nisCadUnico", e.target.value); save({ nisCadUnico: e.target.value }); }}
          />
          <span className="field-help">Se não possuir Cadastro Único, deixe em branco.</span>
        </div>
      </div>

      <div className="banner banner-info" style={{ marginTop: 18 }}>
        <IconInfo className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Salvo automaticamente</div>
          As informações são protegidas pela <strong>LGPD</strong> e usadas exclusivamente para a análise da bolsa.
        </div>
      </div>
    </>
  );
}

/* ============ Passo: Moradia e bens ============ */

const TENURES: [string, string, string][] = [
  ["PROPRIO", "Próprio", "IPTU 2026"],
  ["ALUGADO", "Alugado", "Contrato + recibo"],
  ["CEDIDO", "Cedido", "Declaração do dono"],
  ["FINANCIADO", "Financiado", "Última prestação"],
  ["IRREGULAR", "Irregular", "Declaração do morador"],
];

export function StepMoradia({ appId, onValidChange }: { appId: string | null; onValidChange: (v: boolean) => void }) {
  const { loading, form, setForm, vehicles, setVehicles, save } = useSocioForm(appId);
  const setField = (patch: Partial<Form>) => setForm((p) => ({ ...p, ...patch }));
  const veh = vehicles[0] ?? { id: "", description: "", value: null, installment: null, status: null };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onValidChange(!!form.tenure); }, [form.tenure, loading]);

  const saveVehicle = (next: Partial<typeof veh>) => {
    const merged = { ...veh, ...next };
    setVehicles([{ ...merged, id: veh.id || "tmp" }]);
    save({
      vehicles: merged.description
        ? [{ description: merged.description, value: merged.value ?? undefined, installment: merged.installment ?? undefined, status: (merged.status as never) ?? undefined }]
        : [],
    });
  };

  if (loading) return <p className="muted">Carregando…</p>;
  return (
    <>
      <h2 className="signup-title">Moradia e bens</h2>
      <p className="signup-sub">
        A <strong>posse do imóvel</strong> e a posse de veículo definem alguns documentos que serão pedidos
        na etapa de envio.
      </p>

      <h3 className="section-title" style={{ marginTop: 18 }}><IconHouse size={15} /> Endereço</h3>
      <div className="form-grid">
        <div className="field col-8"><label className="field-label">Rua / Avenida</label><input className="input" defaultValue={form.addressStreet ?? ""} onBlur={(e) => { setField({ addressStreet: e.target.value }); save({ addressStreet: e.target.value }); }} /></div>
        <div className="field col-2"><label className="field-label">Número</label><input className="input" defaultValue={form.addressNumber ?? ""} onBlur={(e) => { setField({ addressNumber: e.target.value }); save({ addressNumber: e.target.value }); }} /></div>
        <div className="field col-2"><label className="field-label">Apto.</label><input className="input" defaultValue={form.addressUnit ?? ""} onBlur={(e) => { setField({ addressUnit: e.target.value }); save({ addressUnit: e.target.value }); }} /></div>
        <div className="field col-4"><label className="field-label">Bairro</label><input className="input" defaultValue={form.neighborhood ?? ""} onBlur={(e) => { setField({ neighborhood: e.target.value }); save({ neighborhood: e.target.value }); }} /></div>
        <div className="field col-3"><label className="field-label">CEP</label><input className="input" inputMode="numeric" defaultValue={form.zipCode ?? ""} onChange={(e) => { e.target.value = maskCep(e.target.value); }} onBlur={(e) => { setField({ zipCode: e.target.value }); save({ zipCode: e.target.value }); }} /></div>
        <div className="field col-5"><label className="field-label">Cidade / Estado</label><input className="input" defaultValue={[form.city, form.state].filter(Boolean).join(" / ")} onBlur={(e) => { const [c, s] = e.target.value.split("/").map((x) => x.trim()); setField({ city: c, state: s }); save({ city: c, state: s }); }} /></div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Tipo de imóvel
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
        {(["CASA", "APARTAMENTO"] as const).map((o) => (
          <label key={o} className="radio">
            <input type="radio" name="htype" checked={form.housingType === o} onChange={() => { setField({ housingType: o }); save({ housingType: o }); }} />
            <span className="dot" /> {o === "CASA" ? "Casa" : "Apartamento"}
          </label>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Posse do imóvel<span className="req">*</span>{" "}
        <span className="muted small" style={{ fontWeight: 400 }}>(define os documentos do imóvel)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {TENURES.map(([val, label, hint]) => (
          <label key={val} className="radio" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--ink-200)", borderRadius: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="radio" name="tenure" checked={form.tenure === val} onChange={() => { setField({ tenure: val }); save({ tenure: val as never }); }} />
              <span className="dot" /> {label}
            </span>
            <span className="muted small" style={{ marginTop: 4 }}>{hint}</span>
          </label>
        ))}
      </div>

      <div className="form-grid" style={{ marginTop: 14 }}>
        {form.tenure === "ALUGADO" && (
          <div className="field col-4"><label className="field-label">Valor do aluguel</label><input className="input" placeholder="R$ 0,00" defaultValue={form.rentValue ?? ""} onBlur={(e) => { const v = toMoney(e.target.value); setField({ rentValue: v ?? null }); save({ rentValue: v }); }} /></div>
        )}
        {form.tenure === "FINANCIADO" && (
          <div className="field col-4"><label className="field-label">Valor da prestação</label><input className="input" placeholder="R$ 0,00" defaultValue={form.installmentValue ?? ""} onBlur={(e) => { const v = toMoney(e.target.value); setField({ installmentValue: v ?? null }); save({ installmentValue: v }); }} /></div>
        )}
        {form.tenure === "PROPRIO" && (
          <div className="field col-4"><label className="field-label">Nº de matrícula do imóvel</label><input className="input" defaultValue={form.propertyRegistry ?? ""} onBlur={(e) => { setField({ propertyRegistry: e.target.value }); save({ propertyRegistry: e.target.value }); }} /></div>
        )}
      </div>

      <div className="divider" />

      <h3 className="section-title"><IconCar size={15} /> Veículos e bens</h3>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", margin: "8px 0" }}>Possui veículo ou moto?</div>
      <div style={{ display: "flex", gap: 18, marginBottom: 12 }}>
        <label className="radio"><input type="radio" name="veic" checked={form.hasVehicle === true} onChange={() => { setField({ hasVehicle: true }); save({ hasVehicle: true }); }} /><span className="dot" /> Sim</label>
        <label className="radio"><input type="radio" name="veic" checked={form.hasVehicle === false} onChange={() => { setField({ hasVehicle: false }); save({ hasVehicle: false, vehicles: [] }); setVehicles([]); }} /><span className="dot" /> Não</label>
      </div>
      {form.hasVehicle && (
        <div className="form-grid">
          <div className="field col-5"><label className="field-label">Marca / modelo / ano</label><input className="input" defaultValue={veh.description} onBlur={(e) => saveVehicle({ description: e.target.value })} /></div>
          <div className="field col-3"><label className="field-label">Valor aproximado</label><input className="input" placeholder="R$ 0,00" defaultValue={veh.value ?? ""} onBlur={(e) => saveVehicle({ value: toMoney(e.target.value) ?? null })} /></div>
          <div className="field col-4"><label className="field-label">Situação</label>
            <select className="select" defaultValue={veh.status ?? ""} onChange={(e) => saveVehicle({ status: (e.target.value || null) as never })}>
              <option value="">Selecione…</option>
              <option value="PROPRIO">Próprio</option>
              <option value="FINANCIADO">Financiado</option>
              <option value="CEDIDO">Cedido</option>
            </select>
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", margin: "14px 0 8px" }}>
        Possui bens ou imóveis <strong>não declarados</strong> no Imposto de Renda?
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <label className="radio"><input type="radio" name="bens" checked={form.hasUndeclaredAssets === true} onChange={() => { setField({ hasUndeclaredAssets: true }); save({ hasUndeclaredAssets: true }); }} /><span className="dot" /> Sim</label>
        <label className="radio"><input type="radio" name="bens" checked={form.hasUndeclaredAssets === false} onChange={() => { setField({ hasUndeclaredAssets: false }); save({ hasUndeclaredAssets: false }); }} /><span className="dot" /> Não</label>
      </div>
    </>
  );
}

/* ============ Passo: Renda e despesas ============ */

const EXPENSE_LABELS = [
  "Água", "Luz", "Condomínio", "Celular / Internet / TV", "Plano de saúde",
  "Cartão de crédito", "Alimentação", "Transporte", "Despesas médicas / medicação", "Outras despesas",
];

interface YesNoQ { key: keyof Form; label: string; income?: { label: string; sign: number } }
const INCOME_QUESTIONS: YesNoQ[] = [
  { key: "receivesAlimony", label: "Algum membro recebe pensão alimentícia?", income: { label: "Pensão alimentícia recebida", sign: 1 } },
  { key: "paysAlimony", label: "Algum membro paga pensão alimentícia?", income: { label: "Pensão alimentícia paga", sign: -1 } },
  { key: "shouldReceiveAlimony", label: "Deveria receber pensão alimentícia, mas não recebe?" },
  { key: "receivesThirdPartyHelp", label: "Recebe ajuda financeira de terceiros?", income: { label: "Ajuda de terceiros", sign: 1 } },
  { key: "receivesSocialBenefit", label: "Recebe benefício social do governo (BPC, Bolsa Família…)?", income: { label: "Benefício social", sign: 1 } },
  { key: "receivesRentalIncome", label: "Recebe renda de aluguel (locação)?", income: { label: "Aluguel recebido", sign: 1 } },
  { key: "parentsOutsideGroup", label: "Os pais do estudante NÃO compõem o grupo familiar (guarda/tutela)?" },
];

export function StepRendaDespesas({ appId }: { appId: string | null }) {
  const { loading, form, setForm, expenses, setExpenses, incomes, setIncomes, save } = useSocioForm(appId);
  const setFlag = (k: keyof Form, v: boolean) => { setForm((p) => ({ ...p, [k]: v })); save({ [k]: v } as SocioFormInput); };

  const amountOf = (label: string) => expenses.find((e) => e.label === label)?.amount ?? "";
  const saveExpense = (label: string, raw: string) => {
    const amount = toMoney(raw);
    const rest = expenses.filter((e) => e.label !== label);
    const next = amount ? [...rest, { id: "tmp", label, amount }] : rest;
    setExpenses(next);
    save({ expenses: next.map((e) => ({ label: e.label, amount: e.amount })) });
  };

  const incomeOf = (label: string) => incomes.find((i) => i.label === label)?.amount ?? "";
  const saveIncome = (label: string, sign: number, raw: string) => {
    const amount = toMoney(raw);
    const rest = incomes.filter((i) => i.label !== label);
    const next = amount ? [...rest, { id: "tmp", label, amount, sign }] : rest;
    setIncomes(next);
    save({ incomes: next.map((i) => ({ label: i.label, amount: i.amount, sign: i.sign as 1 | -1 })) });
  };

  if (loading) return <p className="muted">Carregando…</p>;
  return (
    <>
      <h2 className="signup-title">Renda e despesas</h2>
      <p className="signup-sub">
        As respostas abaixo definem quais comprovantes de renda serão solicitados, e os valores entram no
        cálculo da renda familiar.
      </p>

      <h3 className="section-title" style={{ marginTop: 18 }}><IconWallet size={15} /> Fontes de renda do grupo</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {INCOME_QUESTIONS.map((qst) => (
          <div key={qst.key} style={{ borderBottom: "1px solid var(--ink-100)", paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "var(--ink-800)" }}>{qst.label}</span>
              <div style={{ display: "flex", gap: 16 }}>
                <label className="radio"><input type="radio" name={qst.key} checked={form[qst.key] === true} onChange={() => setFlag(qst.key, true)} /><span className="dot" /> Sim</label>
                <label className="radio"><input type="radio" name={qst.key} checked={form[qst.key] === false} onChange={() => setFlag(qst.key, false)} /><span className="dot" /> Não</label>
              </div>
            </div>
            {qst.income && form[qst.key] === true && (
              <div className="input-with-icon" style={{ marginTop: 8, maxWidth: 220 }}>
                <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
                <input className="input" placeholder="0,00" style={{ paddingLeft: 36 }} defaultValue={incomeOf(qst.income.label)} onBlur={(e) => saveIncome(qst.income!.label, qst.income!.sign, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="divider" />

      <h3 className="section-title">Despesas mensais (último mês)</h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 14 }}>Informe os valores médios do último mês completo. Deixe em branco o que não se aplica.</p>
      <div className="form-grid">
        {EXPENSE_LABELS.map((label) => (
          <div key={label} className="field col-6">
            <label className="field-label">{label}</label>
            <div className="input-with-icon">
              <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
              <input className="input" placeholder="0,00" style={{ paddingLeft: 36 }} defaultValue={amountOf(label)} onBlur={(e) => saveExpense(label, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============ Passo: Revisão e envio ============ */

export function StepRevisao({ appId, onReadyChange }: { appId: string | null; onReadyChange: (ready: boolean) => void }) {
  const q = useQuery({ queryKey: ["socio", appId], queryFn: () => socioApi.get(appId as string), enabled: !!appId });
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  useEffect(() => { onReadyChange(c1 && c2 && c3); }, [c1, c2, c3, onReadyChange]);

  const s = q.data?.summary;
  return (
    <>
      <h2 className="signup-title">Revisão e envio</h2>
      <p className="signup-sub">Confira o resumo e aceite a declaração para concluir a inscrição.</p>

      {s && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 18 }}>
          <div className="stat"><div className="stat-label">Renda bruta familiar</div><div className="stat-value mono" style={{ fontSize: 20 }}>R$ {s.totalIncome}</div></div>
          <div className="stat"><div className="stat-label">Despesas mensais</div><div className="stat-value mono" style={{ fontSize: 20 }}>R$ {s.totalExpenses}</div></div>
          <div className="stat"><div className="stat-label">Renda per capita</div><div className="stat-value mono" style={{ fontSize: 20 }}>R$ {s.perCapita}</div><div className="muted small">{s.membersCount} integrante(s)</div></div>
        </div>
      )}

      <div style={{ background: "var(--ink-50)", border: "1px solid var(--ink-200)", borderRadius: 8, padding: 18, margin: "18px 0 16px", fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6 }}>
        Os dados informados serão tratados conforme a <strong>Lei nº 13.709/18 (LGPD)</strong>, com foco em
        necessidade, finalidade e segurança, e usados para o Processo de Bolsa Filantrópica do Instituto Mauá
        de Tecnologia.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label className="checkbox"><input type="checkbox" checked={c1} onChange={() => setC1((v) => !v)} /><span className="box" /><span>Declaro que as informações prestadas retratam a real situação socioeconômica do grupo familiar.</span></label>
        <label className="checkbox"><input type="checkbox" checked={c2} onChange={() => setC2((v) => !v)} /><span className="box" /><span>Consinto com o tratamento e o compartilhamento dos dados informados para o Processo de Bolsa (art. 7º e 14 da Lei 13.709/18).</span></label>
        <label className="checkbox"><input type="checkbox" checked={c3} onChange={() => setC3((v) => !v)} /><span className="box" /><span>Estou ciente de que a não comprovação dos dados implica na perda do benefício, além das sanções legais.</span></label>
      </div>

      <div className="banner banner-info" style={{ marginTop: 18 }}>
        <IconShield className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Rastreabilidade do envio</div>
          A submissão é registrada com <span className="mono">CPF · IP · data/hora</span> e fica disponível na sua área do candidato.
        </div>
      </div>
    </>
  );
}
