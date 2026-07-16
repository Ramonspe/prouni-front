import type { ReactNode } from "react";
import type { SocioFormDto } from "@prouni/shared";
import { IconCar, IconHouse, IconWallet } from "@/components/icons";

const HOUSING_TYPE: Record<string, string> = { CASA: "Casa", APARTAMENTO: "Apartamento" };
const TENURE: Record<string, string> = {
  PROPRIO: "Próprio",
  ALUGADO: "Alugado",
  CEDIDO: "Cedido",
  FINANCIADO: "Financiado",
  IRREGULAR: "Ocupação irregular",
};
const VEHICLE_STATUS: Record<string, string> = {
  PROPRIO: "Próprio",
  FINANCIADO: "Financiado",
  CEDIDO: "Cedido",
};

function money(value: string | null) {
  if (value == null) return "—";
  const amount = Number(value);
  return Number.isNaN(amount) ? "—" : amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function value(value: string | null | undefined): string {
  return value?.trim() || "—";
}

function yesNo(value: boolean): string {
  return value ? "Sim" : "Não";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="muted small" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{ color: "var(--ink-900)", fontSize: 13.5, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

function EmptyRows({ children }: { children: string }) {
  return <div className="muted small" style={{ padding: "8px 0" }}>{children}</div>;
}

export function SocioFormReview({ socioForm }: { socioForm: SocioFormDto | null }) {
  if (!socioForm) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><h3 className="h-card-title">Ficha socioeconômica declarada</h3></div>
        <div className="card-body"><EmptyRows>A ficha ainda não foi preenchida pelo candidato.</EmptyRows></div>
      </div>
    );
  }

  const { form, incomes, expenses, vehicles, summary } = socioForm;
  const address = [form.addressStreet, form.addressNumber, form.addressUnit].filter(Boolean).join(", ");
  const location = [form.neighborhood, [form.city, form.state].filter(Boolean).join("/")].filter(Boolean).join(" · ");
  const incomeAnswers: Array<[string, boolean]> = [
    ["Recebe pensão alimentícia", form.receivesAlimony],
    ["Paga pensão alimentícia", form.paysAlimony],
    ["Deveria receber pensão, mas não recebe", form.shouldReceiveAlimony],
    ["Recebe ajuda financeira de terceiros", form.receivesThirdPartyHelp],
    ["Recebe benefício social", form.receivesSocialBenefit],
    ["Recebe renda de aluguel", form.receivesRentalIncome],
    ["Pais não compõem o grupo familiar", form.parentsOutsideGroup],
    ["Declarou outras rendas", form.hasOtherIncome],
  ];

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h3 className="h-card-title">Ficha socioeconômica declarada</h3>
          <div className="muted small" style={{ marginTop: 3 }}>Moradia, bens, renda e despesas informados pelo candidato.</div>
        </div>
        <span className="muted small" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>Atualização automática</span>
      </div>

      <div style={{ padding: "0 14px 14px" }}>
        <details open style={{ borderBottom: "1px solid var(--ink-150)", padding: "14px 0" }}>
          <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-900)", fontWeight: 600, fontSize: 14 }}>
            <IconHouse size={16} /> Moradia e bens
          </summary>
          <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 20px", padding: "16px 0 4px" }}>
            <Field label="Endereço">{value(address)}</Field>
            <Field label="CEP">{value(form.zipCode)}</Field>
            <Field label="Bairro · cidade/UF">{value(location)}</Field>
            <Field label="Ponto de referência">{value(form.reference)}</Field>
            <Field label="Telefone fixo">{value(form.landline)}</Field>
            <Field label="Celular do estudante">{value(form.studentMobile)}</Field>
            <Field label="Responsável legal">{value(form.guardianName)}</Field>
            <Field label="Celular do responsável">{value(form.guardianPhone)}</Field>
            <Field label="Tipo de imóvel">{HOUSING_TYPE[form.housingType ?? ""] ?? "—"}</Field>
            <Field label="Posse do imóvel">{TENURE[form.tenure ?? ""] ?? "—"}</Field>
            {form.tenure === "ALUGADO" && <Field label="Valor do aluguel">{money(form.rentValue)}</Field>}
            {form.tenure === "FINANCIADO" && <Field label="Valor da prestação">{money(form.installmentValue)}</Field>}
            {form.tenure === "PROPRIO" && <Field label="Matrícula do imóvel">{value(form.propertyRegistry)}</Field>}
            {form.tenure === "CEDIDO" && <Field label="Cedido por">{value(form.cededOwnerInfo)}</Field>}
            <Field label="Bens ou imóveis não declarados no IR">{yesNo(form.hasUndeclaredAssets)}</Field>
          </div>

          <div style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)", display: "flex", gap: 7, alignItems: "center" }}><IconCar size={15} /> Veículos</div>
          {!form.hasVehicle ? <EmptyRows>O candidato declarou não possuir veículo ou moto.</EmptyRows> : vehicles.length === 0 ? <EmptyRows>O candidato declarou possuir veículo, mas não informou os dados.</EmptyRows> : (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} style={{ background: "var(--ink-50)", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12 }}>
                  <div><strong style={{ fontSize: 13.5 }}>{vehicle.description}</strong><div className="muted small" style={{ marginTop: 3 }}>{VEHICLE_STATUS[vehicle.status ?? ""] ?? "Situação não informada"}{vehicle.cededBy ? ` · Cedido por: ${vehicle.cededBy}` : ""}</div></div>
                  <div className="mono small" style={{ textAlign: "right", color: "var(--ink-800)" }}>{money(vehicle.value)}{vehicle.installment ? <><br />Parcela {money(vehicle.installment)}</> : null}</div>
                </div>
              ))}
            </div>
          )}
        </details>

        <details open style={{ padding: "14px 0 0" }}>
          <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-900)", fontWeight: 600, fontSize: 14 }}>
            <IconWallet size={16} /> Renda e despesas
          </summary>
          <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, padding: "16px 0" }}>
            <Field label="Renda bruta total">{money(summary.totalIncome)}</Field>
            <Field label="Despesas totais">{money(summary.totalExpenses)}</Field>
            <Field label="Renda per capita">{money(summary.perCapita)}</Field>
          </div>

          <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, borderTop: "1px solid var(--ink-100)", paddingTop: 12 }}>
            {incomeAnswers.map(([label, answer]) => <Field key={label} label={label}>{yesNo(answer)}</Field>)}
          </div>

          <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>Outras rendas e benefícios</div>
              {incomes.length === 0 ? <EmptyRows>Nenhuma renda adicional informada.</EmptyRows> : incomes.map((income) => (
                <div key={income.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: "1px solid var(--ink-100)", fontSize: 13 }}><span>{income.label}</span><span className="mono" style={{ color: income.sign < 0 ? "var(--red-700)" : "var(--ink-900)" }}>{income.sign < 0 ? "− " : "+ "}{money(income.amount)}</span></div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>Despesas mensais</div>
              {expenses.length === 0 ? <EmptyRows>Nenhuma despesa adicional informada.</EmptyRows> : expenses.map((expense) => (
                <div key={expense.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: "1px solid var(--ink-100)", fontSize: 13 }}><span>{expense.label}</span><span className="mono">{money(expense.amount)}</span></div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
