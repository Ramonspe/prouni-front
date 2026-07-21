"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, socioApi } from "@/lib/api";
import {
  housingCompletionIssues,
  studentCompletionIssues,
  type SocioFormDto,
  type SocioFormInput,
} from "@prouni/shared";
import { maskCep, maskMoney, maskNis, maskPhone } from "@/lib/format";
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
  const qc = useQueryClient();
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
    if (!appId) return;
    void socioApi.patch(appId, patch).then((updated) => {
      // Mantém o cache em sincronia com o servidor para que, ao remontar o passo
      // (a ficha remonta ao navegar), o valor exibido seja o salvo — não o antigo.
      qc.setQueryData(["socio", appId], updated);
      // As flags da ficha (ex.: bens não declarados, posse do imóvel, rendas) mudam
      // a lista de documentos exigidos → invalidar para refletir na tela Documentos.
      void qc.invalidateQueries({ queryKey: ["application", appId, "required-documents"] });
      void qc.invalidateQueries({ queryKey: ["required-docs", appId] });
    });
  };

  return { loading: q.isLoading || !seeded, form, setForm, vehicles, setVehicles, expenses, setExpenses, incomes, setIncomes, save };
}

/* ============ Passo: Dados do estudante ============ */

export function StepEstudante({
  appId,
  onValidChange,
}: {
  appId: string | null;
  onValidChange?: (valid: boolean) => void;
}) {
  const { loading, form, setForm, save } = useSocioForm(appId);
  const app = useQuery({ queryKey: ["app-me"], queryFn: () => applicationsApi.me(), enabled: !!appId });
  const set = (k: keyof Form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  // Placeholder do ano/semestre vem do ciclo ativo (ex.: "2026/2"); muda sozinho a cada ciclo.
  const yearTermPlaceholder = app.data?.cycle?.label ?? "2026/2";
  const completionIssues = studentCompletionIssues(form);
  const valid = !loading && completionIssues.length === 0;
  useEffect(() => { onValidChange?.(valid); }, [valid]); // eslint-disable-line react-hooks/exhaustive-deps
  const yearTermInvalid = !loading && completionIssues.some((issue) => issue.field === "yearTerm");

  if (loading) return <p className="muted">Carregando…</p>;
  return (
    <>
      <h2 className="signup-title">Dados do estudante</h2>
      <p className="signup-sub">
        Nome, CPF e curso já vieram das etapas anteriores. Complete os dados acadêmicos abaixo.
      </p>

      <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
        <div className="stat"><div className="stat-label">Curso</div><div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>{app.data?.course?.name ?? "—"}</div></div>
        <div className="stat"><div className="stat-label">Campus</div><div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>{app.data?.course?.campus.name ?? "—"}</div></div>
        <div className="stat"><div className="stat-label">Protocolo</div><div className="mono" style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>{app.data?.protocol ?? "—"}</div></div>
      </div>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field col-6">
          <label className="field-label">Ano / semestre que cursará<span className="req">*</span></label>
          <input
            className="input"
            placeholder={yearTermPlaceholder}
            maxLength={12}
            defaultValue={form.yearTerm ?? ""}
            aria-invalid={yearTermInvalid}
            style={yearTermInvalid ? { borderColor: "var(--red-500)" } : undefined}
            onChange={(e) => set("yearTerm", e.target.value)}
            onBlur={(e) => { set("yearTerm", e.target.value); save({ yearTerm: e.target.value }); }}
          />
          {yearTermInvalid && <span className="field-help" style={{ color: "var(--red-700)" }}>Informe no formato AAAA/1 ou AAAA/2.</span>}
        </div>
        <div className="field col-6">
          <label className="field-label">Cadastro Único — NIS</label>
          <input
            className="input"
            placeholder="000.00000.00-0"
            inputMode="numeric"
            maxLength={14}
            defaultValue={form.nisCadUnico ?? ""}
            onChange={(e) => { e.target.value = maskNis(e.target.value); }}
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

const BRAZIL_STATES: Array<[string, string]> = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MG", "Minas Gerais"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"],
  ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"],
  ["SC", "Santa Catarina"], ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
];

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
  const veh = vehicles[0] ?? { id: "", description: "", value: null, installment: null, status: null, cededBy: null };
  const completionIssues = housingCompletionIssues(form, vehicles);
  const valid = !loading && completionIssues.length === 0;
  const hasIssue = (field: string) => !loading && completionIssues.some((issue) => issue.field === field);
  const invalidStyle = (field: string) => hasIssue(field) ? { borderColor: "var(--red-500)" } : undefined;

  // Controlled state for CEP-autofillable address fields
  const [cepZip, setCepZip] = useState("");
  const [cepStreet, setCepStreet] = useState("");
  const [cepNeighborhood, setCepNeighborhood] = useState("");
  const [cepCity, setCepCity] = useState("");
  const [cepState, setCepState] = useState("");
  const [addrSeeded, setAddrSeeded] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onValidChange(valid); }, [valid]);

  useEffect(() => {
    if (!loading && !addrSeeded) {
      setCepZip(form.zipCode ?? "");
      setCepStreet(form.addressStreet ?? "");
      setCepNeighborhood(form.neighborhood ?? "");
      setCepCity(form.city ?? "");
      setCepState(form.state ?? "");
      setAddrSeeded(true);
    }
  }, [loading, addrSeeded, form]);

  const fetchCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) return;
      const data = await res.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) return;
      const street = data.logradouro ?? "";
      const neighborhood = data.bairro ?? "";
      const city = data.localidade ?? "";
      const state = data.uf ?? "";
      setCepStreet(street);
      setCepNeighborhood(neighborhood);
      setCepCity(city);
      setCepState(state);
      setField({ addressStreet: street, neighborhood, city, state });
      save({ addressStreet: street, neighborhood, city, state });
    } catch { /* ViaCEP indisponível — usuário preenche manualmente */ }
  };

  const saveVehicle = (next: Partial<typeof veh>) => {
    const merged = { ...veh, ...next };
    setVehicles([{ ...merged, id: veh.id || "tmp" }]);
    save({
      vehicles: merged.description
        ? [{ description: merged.description, value: merged.value ?? undefined, installment: merged.installment ?? undefined, status: (merged.status as never) ?? undefined, cededBy: merged.cededBy ?? undefined }]
        : [],
    });
  };
  const setVehicleDraft = (next: Partial<typeof veh>) => {
    setVehicles([{ ...veh, ...next, id: veh.id || "tmp" }]);
  };

  if (loading) return <p className="muted">Carregando…</p>;
  return (
    <>
      <h2 className="signup-title">Moradia e bens</h2>
      <p className="signup-sub">
        A <strong>posse do imóvel</strong> e a posse de veículo definem alguns documentos que serão pedidos
        na etapa de envio.
      </p>
      {completionIssues.length > 0 && (
        <div className="banner banner-danger" style={{ marginTop: 14, padding: "10px 12px" }}>
          <div className="banner-body" style={{ color: "var(--red-700)" }}>
            Preencha os campos obrigatórios destacados para continuar ({completionIssues.length} pendência(s)).
          </div>
        </div>
      )}

      <h3 className="section-title" style={{ marginTop: 18 }}><IconHouse size={15} /> Endereço</h3>
      <div className="form-grid">
        {/* Linha 1: CEP primeiro → auto-preenche rua/bairro/cidade/estado */}
        <div className="field col-3">
          <label className="field-label">CEP<span className="req">*</span></label>
          <input
            className="input"
            inputMode="numeric"
            maxLength={9}
            placeholder="00000-000"
            value={cepZip}
            aria-invalid={hasIssue("zipCode")}
            style={invalidStyle("zipCode")}
            onChange={(e) => {
              const value = maskCep(e.target.value);
              setCepZip(value);
              setField({ zipCode: value });
            }}
            onBlur={(e) => {
              setField({ zipCode: e.target.value });
              save({ zipCode: e.target.value });
              void fetchCep(e.target.value);
            }}
          />
          <span className="field-help">Digite o CEP para preencher o endereço.</span>
        </div>
        <div className="field col-7">
          <label className="field-label">Rua / Avenida<span className="req">*</span></label>
          <input
            className="input"
            maxLength={150}
            value={cepStreet}
            aria-invalid={hasIssue("addressStreet")}
            style={invalidStyle("addressStreet")}
            onChange={(e) => { setCepStreet(e.target.value); setField({ addressStreet: e.target.value }); }}
            onBlur={(e) => { setField({ addressStreet: e.target.value }); save({ addressStreet: e.target.value }); }}
          />
        </div>
        <div className="field col-2">
          <label className="field-label">Número<span className="req">*</span></label>
          <input className="input" inputMode="numeric" maxLength={10} defaultValue={form.addressNumber ?? ""} aria-invalid={hasIssue("addressNumber")} style={invalidStyle("addressNumber")} onChange={(e) => setField({ addressNumber: e.target.value })} onBlur={(e) => { setField({ addressNumber: e.target.value }); save({ addressNumber: e.target.value }); }} />
        </div>
        {/* Linha 2: Complemento, Bairro, Cidade, Estado */}
        <div className="field col-3">
          <label className="field-label">Complemento <span className="muted small">(opcional)</span></label>
          <input className="input" maxLength={60} placeholder="Apto, bloco, casa…" defaultValue={form.addressUnit ?? ""} onBlur={(e) => { setField({ addressUnit: e.target.value }); save({ addressUnit: e.target.value }); }} />
        </div>
        <div className="field col-4">
          <label className="field-label">Bairro<span className="req">*</span></label>
          <input
            className="input"
            maxLength={80}
            value={cepNeighborhood}
            aria-invalid={hasIssue("neighborhood")}
            style={invalidStyle("neighborhood")}
            onChange={(e) => { setCepNeighborhood(e.target.value); setField({ neighborhood: e.target.value }); }}
            onBlur={(e) => { setField({ neighborhood: e.target.value }); save({ neighborhood: e.target.value }); }}
          />
        </div>
        <div className="field col-3">
          <label className="field-label">Cidade<span className="req">*</span></label>
          <input
            className="input"
            maxLength={80}
            value={cepCity}
            aria-invalid={hasIssue("city")}
            style={invalidStyle("city")}
            onChange={(e) => { setCepCity(e.target.value); setField({ city: e.target.value }); }}
            onBlur={(e) => { setField({ city: e.target.value }); save({ city: e.target.value }); }}
          />
        </div>
        <div className="field col-2">
          <label className="field-label">Estado<span className="req">*</span></label>
          <select
            className="select"
            value={cepState}
            aria-invalid={hasIssue("state")}
            style={invalidStyle("state")}
            onChange={(e) => {
              setCepState(e.target.value);
              setField({ state: e.target.value });
              save({ state: e.target.value });
            }}
          >
            <option value="">—</option>
            {BRAZIL_STATES.map(([abbr, name]) => (
              <option key={abbr} value={abbr}>{abbr} — {name}</option>
            ))}
          </select>
        </div>
        {/* Linha 3 */}
        <div className="field col-12"><label className="field-label">Ponto de referência<span className="req">*</span></label><input className="input" maxLength={200} defaultValue={form.reference ?? ""} aria-invalid={hasIssue("reference")} style={invalidStyle("reference")} onChange={(e) => setField({ reference: e.target.value })} onBlur={(e) => { setField({ reference: e.target.value }); save({ reference: e.target.value }); }} /></div>
        <div className="field col-4"><label className="field-label">Telefone fixo <span className="muted small">(opcional)</span></label><input className="input" inputMode="numeric" maxLength={16} defaultValue={form.landline ?? ""} onChange={(e) => { e.target.value = maskPhone(e.target.value); }} onBlur={(e) => { setField({ landline: e.target.value }); save({ landline: e.target.value }); }} /></div>
        <div className="field col-4"><label className="field-label">Celular do estudante<span className="req">*</span></label><input className="input" inputMode="numeric" maxLength={16} defaultValue={form.studentMobile ?? ""} aria-invalid={hasIssue("studentMobile")} style={invalidStyle("studentMobile")} onChange={(e) => { e.target.value = maskPhone(e.target.value); setField({ studentMobile: e.target.value }); }} onBlur={(e) => { setField({ studentMobile: e.target.value }); save({ studentMobile: e.target.value }); }} /></div>
        <div className="field col-5"><label className="field-label">Pai / mãe / responsável legal <span className="muted small">(opcional)</span></label><input className="input" maxLength={120} defaultValue={form.guardianName ?? ""} onBlur={(e) => { setField({ guardianName: e.target.value }); save({ guardianName: e.target.value }); }} /></div>
        <div className="field col-3"><label className="field-label">Celular do responsável <span className="muted small">(opcional)</span></label><input className="input" inputMode="numeric" maxLength={16} defaultValue={form.guardianPhone ?? ""} onChange={(e) => { e.target.value = maskPhone(e.target.value); }} onBlur={(e) => { setField({ guardianPhone: e.target.value }); save({ guardianPhone: e.target.value }); }} /></div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Tipo de imóvel<span className="req">*</span>
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
      <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
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
          <div className="field col-4"><label className="field-label">Valor do aluguel<span className="req">*</span></label><input className="input" placeholder="R$ 0,00" inputMode="decimal" maxLength={14} defaultValue={form.rentValue ?? ""} aria-invalid={hasIssue("rentValue")} style={invalidStyle("rentValue")} onChange={(e) => { e.target.value = maskMoney(e.target.value); setField({ rentValue: toMoney(e.target.value) ?? null }); }} onBlur={(e) => { const v = toMoney(e.target.value); setField({ rentValue: v ?? null }); save({ rentValue: v }); }} /></div>
        )}
        {form.tenure === "FINANCIADO" && (
          <div className="field col-4"><label className="field-label">Valor da prestação<span className="req">*</span></label><input className="input" placeholder="R$ 0,00" inputMode="decimal" maxLength={14} defaultValue={form.installmentValue ?? ""} aria-invalid={hasIssue("installmentValue")} style={invalidStyle("installmentValue")} onChange={(e) => { e.target.value = maskMoney(e.target.value); setField({ installmentValue: toMoney(e.target.value) ?? null }); }} onBlur={(e) => { const v = toMoney(e.target.value); setField({ installmentValue: v ?? null }); save({ installmentValue: v }); }} /></div>
        )}
        {form.tenure === "PROPRIO" && (
          <div className="field col-4"><label className="field-label">Nº de matrícula do imóvel<span className="req">*</span></label><input className="input" maxLength={40} defaultValue={form.propertyRegistry ?? ""} aria-invalid={hasIssue("propertyRegistry")} style={invalidStyle("propertyRegistry")} onChange={(e) => setField({ propertyRegistry: e.target.value })} onBlur={(e) => { setField({ propertyRegistry: e.target.value }); save({ propertyRegistry: e.target.value }); }} /></div>
        )}
        {form.tenure === "CEDIDO" && (
          <div className="field col-8"><label className="field-label">Cedido por (nome e parentesco do coproprietário)<span className="req">*</span></label><input className="input" maxLength={150} defaultValue={form.cededOwnerInfo ?? ""} aria-invalid={hasIssue("cededOwnerInfo")} style={invalidStyle("cededOwnerInfo")} onChange={(e) => setField({ cededOwnerInfo: e.target.value })} onBlur={(e) => { setField({ cededOwnerInfo: e.target.value }); save({ cededOwnerInfo: e.target.value }); }} /></div>
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
          <div className="field col-5"><label className="field-label">Marca / modelo / ano<span className="req">*</span></label><input className="input" maxLength={80} defaultValue={veh.description} aria-invalid={hasIssue("vehicle.description")} style={invalidStyle("vehicle.description")} onChange={(e) => setVehicleDraft({ description: e.target.value })} onBlur={(e) => saveVehicle({ description: e.target.value })} /></div>
          <div className="field col-3"><label className="field-label">Valor aproximado<span className="req">*</span></label><input className="input" placeholder="R$ 0,00" inputMode="decimal" maxLength={14} defaultValue={veh.value ?? ""} aria-invalid={hasIssue("vehicle.value")} style={invalidStyle("vehicle.value")} onChange={(e) => { e.target.value = maskMoney(e.target.value); setVehicleDraft({ value: toMoney(e.target.value) ?? null }); }} onBlur={(e) => saveVehicle({ value: toMoney(e.target.value) ?? null })} /></div>
          <div className="field col-4"><label className="field-label">Situação<span className="req">*</span></label>
            <select className="select" defaultValue={veh.status ?? ""} aria-invalid={hasIssue("vehicle.status")} style={invalidStyle("vehicle.status")} onChange={(e) => saveVehicle({ status: (e.target.value || null) as never })}>
              <option value="">Selecione…</option>
              <option value="PROPRIO">Próprio</option>
              <option value="FINANCIADO">Financiado</option>
              <option value="CEDIDO">Cedido</option>
            </select>
          </div>
          {veh.status === "FINANCIADO" && (
            <div className="field col-3"><label className="field-label">Valor da parcela<span className="req">*</span></label><input className="input" placeholder="R$ 0,00" inputMode="decimal" maxLength={14} defaultValue={veh.installment ?? ""} aria-invalid={hasIssue("vehicle.installment")} style={invalidStyle("vehicle.installment")} onChange={(e) => { e.target.value = maskMoney(e.target.value); setVehicleDraft({ installment: toMoney(e.target.value) ?? null }); }} onBlur={(e) => saveVehicle({ installment: toMoney(e.target.value) ?? null })} /></div>
          )}
          {veh.status === "CEDIDO" && (
            <div className="field col-8"><label className="field-label">Cedido por quem?<span className="req">*</span></label><input className="input" maxLength={80} defaultValue={veh.cededBy ?? ""} aria-invalid={hasIssue("vehicle.cededBy")} style={invalidStyle("vehicle.cededBy")} onChange={(e) => setVehicleDraft({ cededBy: e.target.value })} onBlur={(e) => saveVehicle({ cededBy: e.target.value })} /></div>
          )}
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
  "Água", "Luz", "Gás", "Condomínio", "Telefone fixo", "Celular", "Internet / TV",
  "Plano de saúde", "Despesas médicas / medicação", "Diarista / doméstica",
  "Alimentação (mercado, padaria)", "Transporte coletivo (ônibus)", "Transporte escolar",
  "Combustível (veículo próprio)", "Cartão de crédito", "Outros financiamentos",
  "Atividades extracurriculares / cursos", "Outra despesa",
];

// "Outras rendas" e "Outras rendas não contabilizadas" da ficha (valores opcionais, sign +1).
const EXTRA_INCOME_LABELS = ["Aplicação financeira", "Vale alimentação", "Bolsa Família", "Outras rendas"];

// Notas de ajuda em despesas que costumam gerar duplicidade de valores.
const EXPENSE_HELP: Record<string, string> = {
  "Cartão de crédito":
    "Não considere valores já informados na ficha (ex.: combustível, plano de saúde, alimentação) — evita duplicidade.",
  "Atividades extracurriculares / cursos":
    "Apenas valores ainda não declarados. A mensalidade de escola/faculdade já informada no cadastro do membro não deve ser repetida aqui.",
};

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
                <input className="input" placeholder="0,00" inputMode="decimal" maxLength={14} style={{ paddingLeft: 36 }} defaultValue={incomeOf(qst.income.label)} onChange={(e) => { e.target.value = maskMoney(e.target.value); }} onBlur={(e) => saveIncome(qst.income!.label, qst.income!.sign, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="divider" />

      <h3 className="section-title">Outras rendas e benefícios</h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 14 }}>Informe os valores mensais que se aplicam (deixe em branco o que não houver).</p>
      <div className="form-grid">
        {EXTRA_INCOME_LABELS.map((label) => (
          <div key={label} className="field col-3">
            <label className="field-label">{label}</label>
            <div className="input-with-icon">
              <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
              <input className="input" placeholder="0,00" inputMode="decimal" maxLength={14} style={{ paddingLeft: 36 }} defaultValue={incomeOf(label)} onChange={(e) => { e.target.value = maskMoney(e.target.value); }} onBlur={(e) => saveIncome(label, 1, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="divider" />

      <h3 className="section-title">Despesas mensais (último mês)</h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 14 }}>Informe os valores médios do último mês completo. Aluguel, prestação do imóvel e parcela de veículo financiado, quando informados na etapa Moradia e bens, já entram automaticamente no total e não devem ser repetidos aqui.</p>
      <div className="form-grid">
        {EXPENSE_LABELS.map((label) => (
          <div key={label} className="field col-6">
            <label className="field-label">{label}</label>
            <div className="input-with-icon">
              <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
              <input className="input" placeholder="0,00" inputMode="decimal" maxLength={14} style={{ paddingLeft: 36 }} defaultValue={amountOf(label)} onChange={(e) => { e.target.value = maskMoney(e.target.value); }} onBlur={(e) => saveExpense(label, e.target.value)} />
            </div>
            {EXPENSE_HELP[label] && <span className="field-help">{EXPENSE_HELP[label]}</span>}
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
        <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 18 }}>
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
