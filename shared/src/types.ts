// Tipos de domínio do portal PROUNI — contrato compartilhado entre web e api.

export type ProcessStatus =
  | "iniciada"
  | "enviada"
  | "analise_doc"
  | "pendencia"
  | "analise_socio"
  | "classificado"
  | "espera"
  | "indeferido"
  | "concedida";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type BannerTone = "info" | "warn" | "success" | "danger";

/** Estado de revisão de cada documento. */
export type DocState = "approved" | "pending" | "rejected" | "todo";

export type Role = "candidate" | "admin";

export type Priority = "alta" | "media" | "baixa" | "—";

export interface StatusMeta {
  tone: BadgeTone;
  label: string;
}

export interface Candidate {
  id: string;
  name: string;
  cpf: string;
  course: string;
  status: ProcessStatus;
  priority: Priority;
  docs: string;
  income: string;
  updated: string;
  analyst: string;
}

export interface DocItem {
  id: string;
  name: string;
  state: DocState;
  date?: string;
  comment?: string;
}

export interface DocCategory {
  id: string;
  group: string;
  items: DocItem[];
}

export interface SignupDocCategory {
  id: string;
  title: string;
  color: string;
  items: string[];
}

export interface Curso {
  nome: string;
  campus: string[];
  turnos: string[];
  duracao: string;
}

export interface TimelineItemData {
  state?: "done" | "active" | "warn";
  title: string;
  meta: string;
  body?: string;
}

/* ============ Situação de renda do integrante (driver dos documentos) ============ */
// A situação declarada por cada membro maior de 18 define QUAIS documentos de renda
// ele precisa enviar (espelha os blocos da "Relação de documentos" oficial).
export type IncomeSituation =
  | "ASSALARIADO" // CLT registrado ou servidor público → contracheques
  | "AUTONOMO_LIBERAL" // autônomo ou profissional liberal → DECORE
  | "INFORMAL" // trabalho informal sem vínculo → declaração
  | "SEM_RENDA" // do lar / sem atividade remunerada → declaração de ausência de renda
  | "DESEMPREGADO" // rescisão + seguro-desemprego
  | "MEI" // microempreendedor individual
  | "EMPRESARIO" // sócio(a)/proprietário(a) de empresa → DECORE + PJ
  | "PRODUTOR_RURAL"
  | "APOSENTADO_PENSIONISTA"
  | "ESTAGIARIO_APRENDIZ";

/** Lista para o <select> da ficha — rótulo + dica do documento esperado. */
export const INCOME_SITUATIONS: { value: IncomeSituation; label: string; hint: string }[] = [
  { value: "ASSALARIADO", label: "Empregado(a) com carteira (CLT) ou servidor(a) público(a)", hint: "Contracheques dos últimos 3 meses" },
  { value: "AUTONOMO_LIBERAL", label: "Autônomo(a) ou profissional liberal", hint: "DECORE dos últimos 3 meses (com CRC do contador)" },
  { value: "INFORMAL", label: "Trabalhador(a) informal (sem vínculo)", hint: "Declaração de trabalho informal (gov.br)" },
  { value: "SEM_RENDA", label: "Sem atividade remunerada / do lar", hint: "Declaração de ausência de renda (gov.br)" },
  { value: "DESEMPREGADO", label: "Desempregado(a)", hint: "Rescisão contratual + seguro-desemprego (se houver)" },
  { value: "MEI", label: "Microempreendedor(a) individual (MEI)", hint: "Cartão CNPJ + DASN-SIMEI do ano anterior" },
  { value: "EMPRESARIO", label: "Sócio(a) ou proprietário(a) de empresa", hint: "DECORE + IR da PJ + extratos PJ" },
  { value: "PRODUTOR_RURAL", label: "Produtor(a) rural", hint: "Bloco de Produtor + ITR ou declaração do sindicato" },
  { value: "APOSENTADO_PENSIONISTA", label: "Aposentado(a) ou pensionista", hint: "Demonstrativo do benefício do último mês" },
  { value: "ESTAGIARIO_APRENDIZ", label: "Estagiário(a) ou jovem aprendiz", hint: "Contrato + comprovante de bolsa-auxílio" },
];

export type HousingTenure = "PROPRIO" | "ALUGADO" | "CEDIDO" | "FINANCIADO" | "IRREGULAR";

/** Como um tipo de documento se multiplica e quando é exigido (matriz dinâmica). */
export type DocScope = "APPLICATION" | "EACH_MEMBER" | "EACH_ADULT";
export type DocCondition =
  | "ALWAYS" // sempre, dentro do escopo
  | "INCOME_SITUATION" // quando a situação de renda do membro ∈ conditionValues
  | "HOUSING_TENURE" // quando a posse do imóvel ∈ conditionValues
  | "HAS_VEHICLE" // quando a família declarou veículo
  | "OPT_IN_COTAS" // quando a inscrição opta por cotas
  | "OTHER_INCOME" // quando a família declara a renda extra correspondente
  | "GUARDIANSHIP" // quando os pais não compõem o grupo familiar
  | "IS_PCD" // candidato é pessoa com deficiência
  | "IS_IMT_AFFILIATED" // candidato é funcionário/professor/dependente do IMT
  | "HAS_UNDECLARED_ASSETS" // declarou bens/imóveis não declarados no IR
  | "INCOME_COMMISSION_OVERTIME" // membro recebe comissão ou hora extra (→ 6 holerites)
  | "COMPANY_INACTIVE"; // membro é sócio de empresa inativa (→ DCTF/DEFIS sem movimento)

/* ===================== DTOs de resposta da API (M2) ===================== */

export interface CampusDto {
  id: string;
  code: string;
  name: string;
  address: string | null;
  courseCount?: number;
}

export interface CourseDto {
  id: string;
  name: string;
  shifts: string[];
  durationYears: number | null;
  campus: { id: string; code: string; name: string };
}

export interface CycleDto {
  id: string;
  label: string;
  year: number;
  term: number;
  submissionDeadline: string | null;
  resultDate: string | null;
}

export interface ApplicationDto {
  id: string;
  protocol: string;
  status: ProcessStatus;
  optsForQuota: boolean;
  isPcd: boolean;
  isImtAffiliated: boolean;
  cycle: { id: string; label: string };
  course: { id: string; name: string; campus: { code: string; name: string } } | null;
  enem: { edition: number | null; registration: string | null; score: string | null };
  scholarshipKind: string | null;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEventDto {
  id: string;
  fromStatus: ProcessStatus | null;
  toStatus: ProcessStatus | null;
  title: string;
  body: string | null;
  createdAt: string;
}

export interface FamilyMemberDto {
  id: string;
  fullName: string;
  birthDate: string | null;
  age: number | null;
  cpf: string | null;
  relationship: string;
  maritalStatus: string | null;
  occupation: string | null;
  incomeSituations: IncomeSituation[];
  receivesCommissionOvertime: boolean; // sub-pergunta de assalariado → 6 holerites
  companyInactive: boolean; // sub-pergunta de empresário → DCTF/DEFIS sem movimento
  grossIncome: string | null;
  isStudent: boolean;
  isFinancialResponsible: boolean;
  schoolName: string | null;
  schoolFee: string | null;
}

export interface DocumentTypeDto {
  id: string;
  code: string;
  name: string;
  required: boolean;
  scope: DocScope;
  condition: DocCondition;
  conditionValues: string[];
  appliesTo: string | null;
  requiresSignature: boolean; // exige assinatura gov.br / firma em cartório
}

export interface DocumentCategoryDto {
  id: string;
  code: string;
  title: string;
  colorVar: string | null;
  types: DocumentTypeDto[];
}

export interface SocioSummaryDto {
  grossIncome: string;
  otherIncome: string;
  totalIncome: string;
  totalExpenses: string;
  netIncome: string;
  perCapita: string;
  membersCount: number;
  profile: "INTEGRAL" | "PARCIAL" | null;
}

export interface SocioFormDto {
  form: {
    id: string | null;
    nisCadUnico: string | null;
    yearTerm: string | null;
    addressStreet: string | null;
    addressNumber: string | null;
    addressUnit: string | null;
    neighborhood: string | null;
    zipCode: string | null;
    city: string | null;
    state: string | null;
    reference: string | null;
    housingType: string | null;
    tenure: string | null;
    rentValue: string | null;
    installmentValue: string | null;
    propertyRegistry: string | null;
    hasOtherIncome: boolean;
    hasVehicle: boolean;
    // Flags de "outras rendas"/situação que disparam documentos condicionais.
    receivesAlimony: boolean; // recebe pensão alimentícia
    paysAlimony: boolean; // paga pensão alimentícia (dedução de renda)
    receivesRentalIncome: boolean; // recebe renda de aluguel/locação
    receivesThirdPartyHelp: boolean; // recebe ajuda financeira de terceiros
    receivesSocialBenefit: boolean; // recebe benefício social (BPC, Bolsa Família…)
    parentsOutsideGroup: boolean; // pais do estudante não compõem o grupo (guarda/tutela)
    shouldReceiveAlimony: boolean; // deveria receber pensão mas não recebe → declaração
    hasUndeclaredAssets: boolean; // possui bens/imóveis não declarados no IR
    submittedAt: string | null;
  };
  incomes: { id: string; label: string; amount: string; sign: number }[];
  expenses: { id: string; label: string; amount: string }[];
  vehicles: { id: string; description: string; value: string | null; installment: string | null; status: string | null }[];
  summary: SocioSummaryDto;
}

/* ============ Documentos exigidos (matriz resolvida para a inscrição) ============ */
// Resultado de aplicar a matriz documental aos dados da inscrição: a lista concreta
// de documentos a enviar, já multiplicada por integrante/adulto e filtrada por condição.
export interface RequiredDocumentDto {
  key: string; // estável: `${code}:${memberId ?? 'app'}` — usado como slot
  typeId: string;
  code: string;
  name: string;
  required: boolean;
  scope: DocScope;
  conditionLabel: string | null; // texto amigável da condição (ex.: "Imóvel alugado")
  requiresSignature: boolean; // exige assinatura gov.br / firma em cartório
  member: { id: string; name: string; relationship: string } | null; // a quem se refere
}

export interface RequiredDocumentsCategoryDto {
  id: string;
  code: string;
  title: string;
  colorVar: string | null;
  items: RequiredDocumentDto[];
}

export interface RequiredDocumentsDto {
  applicationId: string;
  totals: { total: number; required: number; optional: number };
  /** Avisos quando faltam dados para resolver (ex.: ficha não preenchida). */
  notes: string[];
  categories: RequiredDocumentsCategoryDto[];
}

/** Estado de um documento no banco (espelha o enum DocumentStatus do Prisma). */
export type DocumentStatusDb = "A_ENVIAR" | "ENVIADO" | "APROVADO" | "REPROVADO";

/** Documento já enviado (slot tipo × integrante) — usado para casar com a lista resolvida. */
export interface UploadedDocumentDto {
  documentTypeId: string;
  familyMemberId: string | null;
  status: DocumentStatusDb;
  fileName: string | null;
  versionNo: number | null;
  reviewComment?: string | null;
}
