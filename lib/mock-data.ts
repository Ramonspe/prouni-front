// Mock data ported from the prototype. Stands in for the future API/back-end.
// NOTE: the official document matrix is still pending business/legal sign-off (see ata/resumo).
import type {
  Candidate,
  Curso,
  DocCategory,
  SignupDocCategory,
} from "./types";

// STATUS_MAP agora vive em @prouni/shared (contrato único entre web e api).
export { STATUS_MAP } from "@prouni/shared";

/** Administrative candidate queue. */
export const CANDIDATES: Candidate[] = [
  { id: "PRN-2026-0418", name: "Maria Eduarda Souza Pereira", cpf: "412.890.331-22", course: "Eng. Computação", status: "analise_socio", priority: "alta", docs: "9/14", income: "R$ 1.046", updated: "há 12 min", analyst: "Ana Lima" },
  { id: "PRN-2026-0419", name: "Lucas Henrique Almeida", cpf: "501.227.110-08", course: "Eng. Mecânica", status: "pendencia", priority: "media", docs: "11/14", income: "R$ 1.230", updated: "há 32 min", analyst: "Carlos Mota" },
  { id: "PRN-2026-0420", name: "Beatriz Costa Lima", cpf: "388.610.554-71", course: "Eng. Química", status: "analise_doc", priority: "alta", docs: "14/14", income: "R$ 890", updated: "há 1 h", analyst: "—" },
  { id: "PRN-2026-0421", name: "Igor Santos da Cruz", cpf: "299.103.871-44", course: "Administração", status: "classificado", priority: "—", docs: "14/14", income: "R$ 1.380", updated: "há 2 h", analyst: "Ana Lima" },
  { id: "PRN-2026-0422", name: "Rafaela Andrade Pinto", cpf: "451.998.222-31", course: "Eng. Civil", status: "espera", priority: "—", docs: "14/14", income: "R$ 1.512", updated: "ontem", analyst: "Carlos Mota" },
  { id: "PRN-2026-0423", name: "João Pedro Oliveira", cpf: "367.221.945-09", course: "Eng. Produção", status: "enviada", priority: "baixa", docs: "10/14", income: "—", updated: "há 3 h", analyst: "—" },
  { id: "PRN-2026-0424", name: "Camila Rezende Vasconcelos", cpf: "478.330.122-66", course: "Eng. Computação", status: "indeferido", priority: "—", docs: "14/14", income: "R$ 2.640", updated: "há 1 d", analyst: "Ana Lima" },
  { id: "PRN-2026-0425", name: "Bruno Tavares Mendes", cpf: "192.554.788-12", course: "Eng. Elétrica", status: "concedida", priority: "—", docs: "14/14", income: "R$ 980", updated: "há 4 h", analyst: "Carlos Mota" },
  { id: "PRN-2026-0426", name: "Larissa Moraes Ribeiro", cpf: "284.901.337-50", course: "Eng. Civil", status: "pendencia", priority: "media", docs: "12/14", income: "R$ 1.180", updated: "há 5 h", analyst: "Ana Lima" },
  { id: "PRN-2026-0427", name: "Felipe Cardoso Nunes", cpf: "503.671.221-19", course: "Administração", status: "analise_socio", priority: "baixa", docs: "14/14", income: "R$ 1.420", updated: "há 6 h", analyst: "Carlos Mota" },
];

/** Candidate document checklist (semester re-submission view). */
export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: "g1",
    group: "Identificação",
    items: [
      { id: "rg", name: "RG ou CNH do estudante", state: "approved", date: "23/mai" },
      { id: "rgr", name: "RG do responsável financeiro", state: "approved", date: "23/mai" },
      { id: "cn", name: "Certidão de nascimento / casamento", state: "pending", date: "—" },
    ],
  },
  {
    id: "g2",
    group: "Renda",
    items: [
      { id: "hol", name: "Holerites dos últimos 3 meses", state: "approved", date: "24/mai" },
      { id: "ir", name: "Declaração de IR 2025 completa", state: "rejected", date: "26/mai", comment: "O documento enviado está incompleto — faltam as páginas 4 e 5 do recibo de entrega." },
      { id: "ext", name: "Extrato bancário (60 dias)", state: "approved", date: "24/mai" },
      { id: "rnd", name: "Comprovante de renda — autônomo", state: "rejected", date: "26/mai", comment: "Imagem ilegível. Reenvie em PDF de melhor qualidade." },
    ],
  },
  {
    id: "g3",
    group: "Moradia e despesas",
    items: [
      { id: "cep", name: "Comprovante de residência (3 meses)", state: "approved", date: "23/mai" },
      { id: "agu", name: "Conta de água", state: "approved", date: "23/mai" },
      { id: "luz", name: "Conta de luz", state: "approved", date: "23/mai" },
      { id: "iptu", name: "IPTU 2026", state: "todo" },
    ],
  },
  {
    id: "g4",
    group: "Veículos e bens",
    items: [
      { id: "crv", name: "CRLV do veículo declarado", state: "approved", date: "24/mai" },
      { id: "esc", name: "Escritura ou contrato de aluguel", state: "todo" },
    ],
  },
];

/** Courses offered (signup course/campus picker). SCS = São Caetano do Sul · SP = São Paulo. */
export const CURSOS: Curso[] = [
  { nome: "Engenharia da Computação", campus: ["SCS", "SP"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Ciência da Computação", campus: ["SCS"], turnos: ["Integral"], duracao: "4 anos" },
  { nome: "Engenharia Civil", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Engenharia Mecânica", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Engenharia Elétrica", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Engenharia Química", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Engenharia de Produção", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Engenharia de Alimentos", campus: ["SCS"], turnos: ["Integral"], duracao: "5 anos" },
  { nome: "Administração", campus: ["SP"], turnos: ["Noturno"], duracao: "4 anos" },
  { nome: "Design", campus: ["SP"], turnos: ["Noturno"], duracao: "4 anos" },
];

/**
 * Document matrix for the first-time signup, organized by category.
 * Derived from "Relação de documentos" (Instituto Mauá). PROVISIONAL — pending
 * official sign-off by the Bolsas team (Andreia/Elessandra) and Jurídico.
 */
export const SIGNUP_DOC_CATS: SignupDocCategory[] = [
  {
    id: "ident",
    title: "1. Identificação",
    color: "var(--blue-700)",
    items: [
      "RG ou CNH do estudante e de cada membro do grupo familiar",
      "CPF de todos os membros (ou impressão Receita Federal)",
      "Comprovante de estado civil (nascimento, casamento, averbação, óbito ou união estável)",
      "Documento de guarda do estudante (quando os pais não compõem o grupo familiar)",
    ],
  },
  {
    id: "consent",
    title: "2. Termos institucionais",
    color: "var(--navy-700)",
    items: [
      "Termo de Consentimento para Tratamento de Dados Pessoais — assinado por todos maiores de 18 anos",
      "Formulário de Autodeclaração de Cotas (Lei 12.711/2012), assinado pelo candidato",
    ],
  },
  {
    id: "moradia",
    title: "3. Moradia, despesas e imóvel",
    color: "var(--blue-600)",
    items: [
      "Comprovante de residência em nome de cada membro do grupo familiar (preferencialmente conta de água/luz)",
      "Comprovantes de despesas fixas do último mês (água, energia, telefone, internet, aluguel, plano de saúde, cartão, condomínio…)",
      "Se imóvel próprio: cópia do IPTU 2026 (com valor venal e metragem)",
      "Se imóvel financiado: comprovante da última prestação",
      "Se imóvel cedido: declaração assinada pelo(a) proprietário(a) via gov.br",
      "Se imóvel alugado: contrato e comprovante de pagamento do último mês",
      "Se imóvel irregular: declaração do morador com situação e valor aproximado",
    ],
  },
  {
    id: "renda",
    title: "4. Renda — todos os maiores de 18",
    color: "var(--green-700)",
    items: [
      "Carteira de Trabalho digital — cópia integral (contratos ativos ou folha em branco se nunca assinada)",
      "Declaração completa do IR 2026 + recibo de entrega, ou comprovante de isenção (Receita Federal)",
      "Extratos bancários dos 3 últimos meses de todas as contas (corrente e poupança)",
      "Certidão de propriedade de veículo (positiva ou negativa — Detran)",
      "Declaração de bens e imóveis não declarados no IR",
    ],
  },
  {
    id: "trab",
    title: "5. Comprovantes por situação de trabalho",
    color: "var(--blue-500)",
    items: [
      "CLT / servidor público: contracheques dos últimos 3 meses",
      "Trabalhador informal: declaração de trabalho informal assinada via gov.br",
      "Desempregado: rescisão contratual + último comprovante de seguro-desemprego (se houver)",
      "MEI: declaração da atividade + cartão CNPJ + DASN-SIMEI do ano anterior",
      "Sócio(a) de empresa: DECORE dos últimos 3 meses + IR PJ + extratos PJ detalhados",
      "Autônomo / profissional liberal: DECORE dos últimos 3 meses assinada por contador",
      "Produtor rural: Bloco de Produtor + ITR ou declaração do sindicato rural",
      "Aposentado / pensionista: demonstrativo do benefício do último mês",
      "Estagiário / jovem aprendiz: contrato e comprovante atualizado de bolsa-auxílio",
      "Ajuda de terceiros: declaração com valores assinada por ambas as partes",
      "Benefícios sociais (BPC, Bolsa Família, etc.): cartão e último extrato",
    ],
  },
  {
    id: "pensao",
    title: "6. Pensão alimentícia e locação recebida",
    color: "var(--amber-700)",
    items: [
      "Sentença judicial / acordo homologado / acordo extrajudicial (gov.br)",
      "Últimos 3 comprovantes de recebimento de pensão",
      "Caso não receba: declaração via gov.br",
      "Renda de aluguel recebido: contrato e recibo do último mês",
    ],
  },
];
