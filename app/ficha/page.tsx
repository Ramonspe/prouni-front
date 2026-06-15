"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  IconCar,
  IconCheck,
  IconChevL,
  IconChevR,
  IconGraduate,
  IconHouse,
  IconInfo,
  IconShield,
  IconUser,
  IconUsers,
  IconWallet,
  type IconComponent,
} from "@/components/icons";

interface FormSectionDef {
  id: string;
  label: string;
  icon: IconComponent;
}

const FORM_SECTIONS: FormSectionDef[] = [
  { id: "estudante", label: "Dados do estudante", icon: IconUser },
  { id: "familia", label: "Composição familiar", icon: IconUsers },
  { id: "moradia", label: "Moradia", icon: IconHouse },
  { id: "veiculos", label: "Veículos e bens", icon: IconCar },
  { id: "despesas", label: "Despesas mensais", icon: IconWallet },
  { id: "estudos", label: "Estudos do grupo", icon: IconGraduate },
  { id: "declaracao", label: "Declaração e termos", icon: IconShield },
];

interface FamilyRow {
  nome: string;
  idade: string;
  cpf: string;
  parent: string;
  estado: string;
  prof: string;
  renda: string;
}

function SectionEstudante() {
  return (
    <>
      <h3 className="section-title">1. Dados do estudante</h3>
      <div className="form-grid">
        <div className="field col-6">
          <label className="field-label">Nome completo<span className="req">*</span></label>
          <input className="input" defaultValue="Maria Eduarda Souza Pereira" />
        </div>
        <div className="field col-3">
          <label className="field-label">Data de nascimento<span className="req">*</span></label>
          <input className="input" defaultValue="14/03/2008" />
        </div>
        <div className="field col-3">
          <label className="field-label">CPF<span className="req">*</span></label>
          <input className="input" defaultValue="412.890.331-22" />
        </div>
        <div className="field col-4">
          <label className="field-label">Em 2026 cursará</label>
          <input className="input" defaultValue="1º ano - Engenharia da Computação" />
        </div>
        <div className="field col-4">
          <label className="field-label">Ano / semestre</label>
          <input className="input" defaultValue="2026 / 1" />
        </div>
        <div className="field col-4">
          <label className="field-label">Cadastro Único — NIS</label>
          <input className="input" placeholder="000.00000.00-0" />
          <span className="field-help">Se não possuir cadastro, deixe em branco.</span>
        </div>
      </div>
    </>
  );
}

function SectionFamilia() {
  const [rows, setRows] = useState<FamilyRow[]>([
    { nome: "Carlos Souza Pereira", idade: "47", cpf: "182.337.901-05", parent: "Pai", estado: "Casado", prof: "Motorista autônomo", renda: "2.850,00" },
    { nome: "Lúcia Vasconcelos Souza", idade: "44", cpf: "201.554.812-33", parent: "Mãe", estado: "Casada", prof: "Auxiliar administrativa", renda: "2.412,50" },
    { nome: "Maria Eduarda Souza Pereira", idade: "18", cpf: "412.890.331-22", parent: "Estudante", estado: "Solteira", prof: "Estudante", renda: "—" },
    { nome: "Pedro Souza Pereira", idade: "13", cpf: "—", parent: "Irmão", estado: "Solteiro", prof: "Estudante", renda: "—" },
  ]);
  return (
    <>
      <h3 className="section-title">2. Composição familiar e socioeconômica</h3>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field col-6">
          <label className="field-label">Nome do responsável financeiro<span className="req">*</span></label>
          <input className="input" defaultValue="Carlos Souza Pereira" />
        </div>
        <div className="field col-6">
          <label className="field-label">Parentesco com o estudante</label>
          <select className="select" defaultValue="pai">
            <option value="pai">Pai</option>
            <option>Mãe</option>
            <option>Avô / Avó</option>
            <option>Tio / Tia</option>
            <option>Outro</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Integrantes do grupo familiar</div>
          <div className="muted small">Inclua todas as pessoas que residem com o estudante, incluindo o próprio.</div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setRows([...rows, { nome: "", idade: "", cpf: "", parent: "", estado: "", prof: "", renda: "" }])}
        >
          + Adicionar integrante
        </button>
      </div>

      <div className="family-table">
        <div className="family-table-head">
          <div>Nome</div><div>Idade</div><div>CPF</div><div>Parentesco</div><div>Estado civil</div><div>Profissão</div><div>Renda bruta (R$)</div><div />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="family-table-row">
            <div><input className="input" defaultValue={r.nome} /></div>
            <div><input className="input" defaultValue={r.idade} /></div>
            <div><input className="input" defaultValue={r.cpf} /></div>
            <div><input className="input" defaultValue={r.parent} /></div>
            <div><input className="input" defaultValue={r.estado} /></div>
            <div><input className="input" defaultValue={r.prof} /></div>
            <div><input className="input" defaultValue={r.renda} /></div>
            <button className="row-remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <div className="muted small">{rows.length} integrante(s)</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-900)" }}>
          Renda bruta familiar: <strong className="mono">R$ 5.262,50</strong>
        </div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        A família possui outras rendas além do salário?
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
        <label className="radio"><input type="radio" name="r1" /><span className="dot" /> Sim</label>
        <label className="radio"><input type="radio" name="r1" defaultChecked /><span className="dot" /> Não</label>
      </div>

      <div className="form-grid">
        {["Aluguel", "Aplicação financeira", "Ajuda de custo", "Pensão recebida (+)", "Pensão paga (−)", "Outras rendas"].map((l, i) => (
          <div key={i} className="field col-4">
            <label className="field-label">{l}</label>
            <div className="input-with-icon">
              <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
              <input className="input" placeholder="0,00" style={{ paddingLeft: 36 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Os pais do estudante compõem o grupo familiar declarado?
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <label className="radio"><input type="radio" name="guarda" defaultChecked /><span className="dot" /> Sim</label>
        <label className="radio">
          <input type="radio" name="guarda" /><span className="dot" /> Não — apresentarei documento de guarda/tutela
        </label>
      </div>
    </>
  );
}

function SectionMoradia() {
  return (
    <>
      <h3 className="section-title">3. Situação habitacional do grupo familiar</h3>
      <div className="form-grid">
        <div className="field col-8"><label className="field-label">Endereço<span className="req">*</span></label><input className="input" defaultValue="Rua Pedroso Alvarenga, 1284" /></div>
        <div className="field col-2"><label className="field-label">Número</label><input className="input" defaultValue="1284" /></div>
        <div className="field col-2"><label className="field-label">Apto.</label><input className="input" defaultValue="42" /></div>
        <div className="field col-4"><label className="field-label">Bairro</label><input className="input" defaultValue="Itaim Bibi" /></div>
        <div className="field col-3"><label className="field-label">CEP</label><input className="input" defaultValue="04531-002" /></div>
        <div className="field col-5"><label className="field-label">Cidade / Estado</label><input className="input" defaultValue="São Paulo / SP" /></div>
        <div className="field col-12"><label className="field-label">Ponto de referência</label><input className="input" placeholder="ex: próximo ao mercado X" /></div>
        <div className="field col-4"><label className="field-label">Telefone fixo</label><input className="input" placeholder="(11) 0000-0000" /></div>
        <div className="field col-4"><label className="field-label">Celular<span className="req">*</span></label><input className="input" defaultValue="(11) 99821-4407" /></div>
        <div className="field col-4"><label className="field-label">E-mail<span className="req">*</span></label><input className="input" defaultValue="maria.souza@aluno.maua.br" /></div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>Tipo de imóvel</div>
      <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
        {["Casa", "Apartamento"].map((o) => (
          <label key={o} className="radio">
            <input type="radio" name="htype" defaultChecked={o === "Apartamento"} />
            <span className="dot" /> {o}
          </label>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Posse do imóvel{" "}
        <span className="muted small" style={{ fontWeight: 400 }}>(define os documentos do imóvel)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {([
          ["Próprio", "IPTU 2026"],
          ["Alugado", "Contrato + recibo"],
          ["Cedido", "Declaração do dono"],
          ["Financiado", "Última prestação"],
          ["Irregular", "Declaração do morador"],
        ] as [string, string][]).map(([o, hint]) => (
          <label
            key={o}
            className="radio"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--ink-200)", borderRadius: 8 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="radio" name="tenure" defaultChecked={o === "Financiado"} />
              <span className="dot" /> {o}
            </span>
            <span className="muted small" style={{ marginTop: 4 }}>{hint}</span>
          </label>
        ))}
      </div>

      <div className="form-grid" style={{ marginTop: 14 }}>
        <div className="field col-4"><label className="field-label">Valor do aluguel</label><input className="input" placeholder="R$ 0,00" /></div>
        <div className="field col-4"><label className="field-label">Valor da prestação (se financiado)</label><input className="input" defaultValue="R$ 1.840,00" /></div>
        <div className="field col-4"><label className="field-label">Nº matrícula (se próprio)</label><input className="input" placeholder="—" /></div>
      </div>
    </>
  );
}

function SectionVeiculos() {
  return (
    <>
      <h3 className="section-title">4. Situação socioeconômica complementar</h3>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>Possui veículo ou moto?</div>
      <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
        <label className="radio"><input type="radio" name="ve" defaultChecked /><span className="dot" /> Sim</label>
        <label className="radio"><input type="radio" name="ve" /><span className="dot" /> Não</label>
      </div>

      <div className="form-grid">
        <div className="field col-4"><label className="field-label">Marca / modelo / ano</label><input className="input" defaultValue="Fiat Mobi 2019" /></div>
        <div className="field col-3"><label className="field-label">Valor aproximado</label><input className="input" defaultValue="R$ 38.500,00" /></div>
        <div className="field col-3"><label className="field-label">Valor da parcela (se financiado)</label><input className="input" defaultValue="R$ 0,00" /></div>
        <div className="field col-2"><label className="field-label">Situação</label><select className="select"><option>Próprio</option><option>Financiado</option><option>Cedido</option></select></div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>Outras rendas não contabilizadas</div>
      <div className="form-grid">
        <div className="field col-6"><label className="field-label">Vale alimentação</label><input className="input" defaultValue="R$ 480,00" /></div>
        <div className="field col-6"><label className="field-label">Bolsa família</label><input className="input" placeholder="R$ 0,00" /></div>
        <div className="field col-12"><label className="field-label">Outro (qual?)</label><input className="input" placeholder="Descreva e informe o valor" /></div>
      </div>
    </>
  );
}

function SectionDespesas() {
  const items: [string, string][] = [
    ["Água", "98,40"], ["Despesas médicas / medicação", "210,00"],
    ["Luz", "184,70"], ["Plano de saúde", "642,00"],
    ["Condomínio", "560,00"], ["Outros financiamentos", "0,00"],
    ["Celular / Internet / TV", "298,00"], ["Cartão de crédito", "1.120,00"],
    ["Diarista / doméstica", "0,00"], ["Alimentação (média mensal)", "1.480,00"],
    ["Transporte coletivo", "210,00"], ["Transporte escolar", "0,00"],
    ["Combustível (veículo próprio)", "320,00"], ["Outra despesa", "0,00"],
  ];
  return (
    <>
      <h3 className="section-title">5. Despesas mensais (último mês)</h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 16 }}>
        Considere valores médios referentes ao último mês completo.
      </p>

      <div className="form-grid">
        {items.map(([label, val], i) => (
          <div key={i} className="field col-6">
            <label className="field-label">{label}</label>
            <div className="input-with-icon">
              <span className="icon-prefix" style={{ left: 12, color: "var(--ink-500)", fontSize: 12, pointerEvents: "none" }}>R$</span>
              <input className="input" defaultValue={val} style={{ paddingLeft: 36 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="banner banner-info" style={{ marginTop: 18 }}>
        <IconInfo className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Total mensal calculado</div>
          Total das despesas: <strong className="mono" style={{ color: "var(--ink-900)" }}>R$ 5.123,10</strong>{" "}
          · Renda líquida disponível: <strong className="mono" style={{ color: "var(--green-700)" }}>R$ 139,40</strong>
        </div>
      </div>
    </>
  );
}

function SectionEstudos() {
  return (
    <>
      <h3 className="section-title">Estudos do grupo familiar</h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 16 }}>
        Inclua membros que estudam, incluindo o próprio estudante.
      </p>

      <div className="family-table" style={{ gridTemplateColumns: "2fr 2fr 1fr 36px" }}>
        <div className="family-table-head" style={{ gridTemplateColumns: "2fr 2fr 1fr 36px" }}>
          <div>Nome</div><div>Escola / Universidade</div><div>Valor da parcela (R$)</div><div />
        </div>
        {[
          ["Maria Eduarda Souza Pereira", "Instituto Mauá de Tecnologia", "2.850,00"],
          ["Pedro Souza Pereira", "EE Prof. Antônio Alves Cruz (público)", "—"],
        ].map((r, i) => (
          <div key={i} className="family-table-row" style={{ gridTemplateColumns: "2fr 2fr 1fr 36px" }}>
            <div><input className="input" defaultValue={r[0]} /></div>
            <div><input className="input" defaultValue={r[1]} /></div>
            <div><input className="input" defaultValue={r[2]} /></div>
            <button className="row-remove">×</button>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginBottom: 10 }}>
        Realiza atividades extracurriculares ou projetos?
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
        <label className="radio"><input type="radio" name="ex" defaultChecked /><span className="dot" /> Sim</label>
        <label className="radio"><input type="radio" name="ex" /><span className="dot" /> Não</label>
      </div>
      <div className="form-grid">
        <div className="field col-5"><label className="field-label">Nome do estudante e atividade</label><input className="input" defaultValue="Maria — Curso de inglês (CCAA)" /></div>
        <div className="field col-4"><label className="field-label">Local em que realiza</label><input className="input" defaultValue="CCAA Itaim Bibi" /></div>
        <div className="field col-3"><label className="field-label">Valor da parcela</label><input className="input" defaultValue="R$ 320,00" /></div>
      </div>
    </>
  );
}

function SectionDeclaracao({ onSubmit }: { onSubmit: () => void }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const ready = c1 && c2 && c3;
  return (
    <>
      <h3 className="section-title">Declaração, consentimento e termos</h3>

      <div style={{ background: "var(--ink-50)", border: "1px solid var(--ink-200)", borderRadius: 8, padding: 18, marginBottom: 16, fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6 }}>
        Os dados informados serão tratados conforme a <strong>Lei nº 13.709/18 (LGPD)</strong>, com foco em
        necessidade, finalidade e segurança, utilizados principalmente para cumprir sua finalidade e
        obrigações legais relativas ao processo de bolsa de estudo. Dúvidas ou solicitações devem ser
        encaminhadas ao Setor de Bolsas e Programas Assistenciais do Instituto Mauá de Tecnologia.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label className="checkbox">
          <input type="checkbox" checked={c1} onChange={() => setC1(!c1)} />
          <span className="box" />
          <span>Declaro, sob as penas da lei, que as informações prestadas nesta ficha retratam a real situação socioeconômica do grupo familiar.</span>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={c2} onChange={() => setC2(!c2)} />
          <span className="box" />
          <span>Consinto com o compartilhamento dos dados pessoais informados, em especial os do estudante, para participação no Processo de Bolsa Filantrópica, conforme art. 14 e 7º da Lei 13.709/18.</span>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={c3} onChange={() => setC3(!c3)} />
          <span className="box" />
          <span>Estou ciente de que a não comprovação dos dados indicados implica na perda do benefício concedido, além das sanções previstas em lei.</span>
        </label>
      </div>

      <div className="banner banner-info" style={{ marginTop: 18 }}>
        <IconShield className="banner-icon" />
        <div className="banner-body">
          <div className="banner-title">Rastreabilidade do envio</div>
          Sua submissão será registrada com <span className="mono">CPF · IP · timestamp</span> e ficará
          disponível na sua área para auditoria.
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-primary btn-lg" disabled={!ready} onClick={onSubmit}>
          <IconCheck size={15} /> Concluir ficha e ir para documentos
        </button>
      </div>
    </>
  );
}

export default function FichaPage() {
  const router = useRouter();
  const [section, setSection] = useState("estudante");
  const currentIdx = FORM_SECTIONS.findIndex((s) => s.id === section);
  const gotoDocs = () => router.push("/documentos");

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Inscrição", "Ficha socioeconômica"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h1 className="page-title">Ficha socioeconômica · 2026</h1>
            <p className="page-subtitle">
              Preencha todos os campos com atenção. As informações são protegidas pela <strong>LGPD</strong> e
              usadas exclusivamente para análise da bolsa.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 12.5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-600)" }} />
            Salvo automaticamente há 4 min
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 22, marginTop: 18 }}>
          <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <div className="card" style={{ padding: 8 }}>
              {FORM_SECTIONS.map((s, i) => {
                const active = section === s.id;
                const done = i < currentIdx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px", width: "100%", borderRadius: 8,
                      background: active ? "var(--blue-50)" : "transparent",
                      color: active ? "var(--blue-700)" : "var(--ink-700)",
                      fontSize: 13, fontWeight: active ? 600 : 500, textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: "50%",
                        border: "1.5px solid " + (done ? "var(--green-600)" : active ? "var(--blue-600)" : "var(--ink-200)"),
                        background: done ? "var(--green-600)" : active ? "var(--blue-600)" : "#fff",
                        color: done || active ? "#fff" : "var(--ink-500)",
                        display: "grid", placeItems: "center",
                        fontSize: 11, fontWeight: 600, flexShrink: 0,
                      }}
                    >
                      {done ? <IconCheck size={12} stroke={2.8} /> : i + 1}
                    </span>
                    <span style={{ flex: 1 }}>{s.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="card card-pad-sm" style={{ marginTop: 14, fontSize: 12, color: "var(--ink-600)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-800)", fontWeight: 600, marginBottom: 4 }}>
                <IconInfo size={14} /> Precisa de ajuda?
              </div>
              Em caso de dúvidas, consulte o <a href="#" onClick={(e) => e.preventDefault()}>edital</a> ou contate o
              Setor de Bolsas pelo e-mail <span className="mono">bolsas@maua.br</span>.
            </div>
          </aside>

          <div className="card card-pad fade-in" key={section}>
            {section === "estudante" && <SectionEstudante />}
            {section === "familia" && <SectionFamilia />}
            {section === "moradia" && <SectionMoradia />}
            {section === "veiculos" && <SectionVeiculos />}
            {section === "despesas" && <SectionDespesas />}
            {section === "estudos" && <SectionEstudos />}
            {section === "declaracao" && <SectionDeclaracao onSubmit={gotoDocs} />}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--ink-200)" }}>
              <button
                className="btn btn-ghost"
                disabled={currentIdx === 0}
                onClick={() => setSection(FORM_SECTIONS[Math.max(0, currentIdx - 1)].id)}
              >
                <IconChevL size={14} /> Anterior
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost">Salvar e sair</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (currentIdx === FORM_SECTIONS.length - 1) gotoDocs();
                    else setSection(FORM_SECTIONS[currentIdx + 1].id);
                  }}
                >
                  {currentIdx === FORM_SECTIONS.length - 1 ? "Concluir e enviar" : "Avançar"} <IconChevR size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
