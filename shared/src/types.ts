// Tipos de domínio do portal PROUNI — contrato compartilhado entre web e api.

export type ProcessStatus =
  | "iniciada"
  | "enviada"
  | "analise_doc"
  | "pendencia"
  | "analise_socio"
  | "analise_concluida"
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
  | "AUTONOMO_LIBERAL" // (legado) substituído por AUTONOMO + LIBERAL
  | "AUTONOMO" // trabalhador autônomo → declaração + RPA
  | "LIBERAL" // profissional liberal regulamentado → DECORE
  | "INFORMAL" // trabalho informal sem vínculo → declaração
  | "SEM_RENDA" // do lar / sem atividade remunerada → declaração de ausência de renda
  | "DESEMPREGADO" // rescisão + seguro-desemprego
  | "MEI" // microempreendedor individual
  | "EMPRESARIO" // sócio(a)/proprietário(a) de empresa → DECORE + PJ
  | "PRODUTOR_RURAL"
  | "APOSENTADO_PENSIONISTA"
  | "ESTAGIARIO_APRENDIZ";

/** Lista para o <select> da ficha — rótulo + dica do documento esperado. */
export const INCOME_SITUATIONS: {
  value: IncomeSituation;
  label: string;
  hint: string;
}[] = [
  {
    value: "ASSALARIADO",
    label: "Empregado(a) com carteira (CLT) ou servidor(a) público(a)",
    hint: "Contracheques dos últimos 3 meses",
  },
  {
    value: "AUTONOMO",
    label: "Trabalhador(a) autônomo(a)",
    hint: "Declaração de trabalho autônomo + RPA/extratos",
  },
  {
    value: "LIBERAL",
    label: "Profissional liberal (profissão regulamentada)",
    hint: "DECORE dos últimos 3 meses (com CRC do contador)",
  },
  {
    value: "INFORMAL",
    label: "Trabalhador(a) informal (sem vínculo)",
    hint: "Declaração de trabalho informal (gov.br)",
  },
  {
    value: "SEM_RENDA",
    label: "Sem atividade remunerada / do lar",
    hint: "Declaração de ausência de renda (gov.br)",
  },
  {
    value: "DESEMPREGADO",
    label: "Desempregado(a)",
    hint: "Rescisão contratual + seguro-desemprego (se houver)",
  },
  {
    value: "MEI",
    label: "Microempreendedor(a) individual (MEI)",
    hint: "Cartão CNPJ + DASN-SIMEI do ano anterior",
  },
  {
    value: "EMPRESARIO",
    label: "Sócio(a) ou proprietário(a) de empresa",
    hint: "DECORE + IR da PJ + extratos PJ",
  },
  {
    value: "PRODUTOR_RURAL",
    label: "Produtor(a) rural",
    hint: "Bloco de Produtor + ITR ou declaração do sindicato",
  },
  {
    value: "APOSENTADO_PENSIONISTA",
    label: "Aposentado(a) ou pensionista",
    hint: "Demonstrativo do benefício do último mês",
  },
  {
    value: "ESTAGIARIO_APRENDIZ",
    label: "Estagiário(a) ou jovem aprendiz",
    hint: "Contrato + comprovante de bolsa-auxílio",
  },
];

export type HousingTenure =
  "PROPRIO" | "ALUGADO" | "CEDIDO" | "FINANCIADO" | "IRREGULAR";

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
  | "HAS_CNPJ" // membro possui CNPJ ativo ou inativo
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
  status?: CycleStatus;
}

export type CycleStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export type SelectionCallKind =
  | "FIRST_CALL"
  | "SECOND_CALL"
  | "WAITLIST"
  | "OTHER";

export type SelectionCallStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "ARCHIVED";

export type CallScheduleStatus = "DRAFT" | "PUBLISHED" | "SUPERSEDED";

export type CallScheduleWindowKind =
  | "REGISTRATION"
  | "INITIAL_SUBMISSION"
  | "PENDING_CORRECTION";

export interface SelectionCallSummaryDto {
  id: string;
  cycle: { id: string; label: string; year: number; term: number };
  code: string;
  name: string;
  kind: SelectionCallKind;
  sequence: number;
  status: SelectionCallStatus;
  timeZone: string;
}

export interface CallScheduleWindowDto {
  kind: CallScheduleWindowKind;
  startsAt: string;
  endsAt: string;
}

export interface CallScheduleRevisionDto {
  id: string;
  version: number;
  status: CallScheduleStatus;
  windows: CallScheduleWindowDto[];
  createdAt: string;
  publishedAt: string | null;
  createdBy: { id: string; name: string } | null;
  publishedBy: { id: string; name: string } | null;
}

export interface SelectionCallDto extends SelectionCallSummaryDto {
  activeSchedule: CallScheduleRevisionDto | null;
  draftSchedule: CallScheduleRevisionDto | null;
}

export interface ActionCapabilityDto {
  allowed: boolean;
  reason: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ApplicationCapabilitiesDto {
  editForm: ActionCapabilityDto;
  uploadInitialDocuments: ActionCapabilityDto;
  finalizeInitialSubmission: ActionCapabilityDto;
  respondToPending: ActionCapabilityDto;
}

export type PendingRequestStatus =
  | "OPEN"
  | "SUBMITTED"
  | "RESOLVED"
  | "EXPIRED"
  | "CANCELLED";

export type PendingRequestItemKind = "DOCUMENT" | "FORM_SECTION";

export type PendingFormSection =
  | "STUDENT"
  | "FAMILY"
  | "HOUSING"
  | "OTHER";

export interface PendingRequestItemInput {
  kind: PendingRequestItemKind;
  documentTypeId?: string | null;
  familyMemberId?: string | null;
  formSection?: PendingFormSection | null;
  label: string;
}

export interface PendingRequestItemDto {
  id: string;
  kind: PendingRequestItemKind;
  documentTypeId: string | null;
  familyMemberId: string | null;
  formSection: PendingFormSection | null;
  resolvedAt: string | null;
  label: string;
}

export interface PendingRequestDto {
  id: string;
  applicationId: string;
  status: PendingRequestStatus;
  reason: string;
  dueAt: string;
  submittedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  items: PendingRequestItemDto[];
}

export interface OpportunityDto {
  id: string;
  cpf: string;
  fullName: string | null;
  state: "AVAILABLE" | "CLAIMED" | "CANCELLED";
  call: SelectionCallSummaryDto;
  course: {
    id: string;
    name: string;
    campus: { id: string; code: string; name: string };
  } | null;
  applicationId: string | null;
  canClaim: boolean;
  claimBlockedReason: string | null;
}

export interface OpportunityClaimResult {
  applicationId: string;
  protocol: string;
}

export interface ApplicationDto {
  id: string;
  protocol: string;
  status: ProcessStatus;
  optsForQuota: boolean;
  isPcd: boolean;
  isImtAffiliated: boolean;
  cycle: { id: string; label: string };
  course: {
    id: string;
    name: string;
    campus: { code: string; name: string };
  } | null;
  enem: {
    edition: number | null;
    registration: string | null;
    score: string | null;
  };
  scholarshipKind: string | null;
  priority: string | null;
  call: PreselectionCall; // chamada (1ª/2ª/espera)
  submissionDeadline: string | null; // prazo de entrega da chamada ("YYYY-MM-DD")
  selectionCall: SelectionCallSummaryDto | null;
  capabilities: ApplicationCapabilitiesDto;
  openPendingRequest: PendingRequestDto | null;
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
  educationLevel: string | null;
  occupation: string | null;
  incomeSituations: IncomeSituation[];
  receivesCommissionOvertime: boolean; // sub-pergunta de assalariado → 6 holerites
  hasCnpj: boolean | null; // pergunta para todos os integrantes adultos
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
  templateUrl: string | null; // modelo para download (anexo), quando houver
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
  /** Renda bruta total apurada pela equipe (substitui a declarada como base do
   *  per capita/perfil quando informada). Null quando não houve ajuste. */
  adjustedTotalIncome: string | null;
  /** Base usada no per capita e no enquadramento: declarada ou ajustada. */
  incomeBasis: "DECLARED" | "ADJUSTED";
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
    cededOwnerInfo: string | null;
    landline: string | null;
    studentMobile: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
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
  vehicles: {
    id: string;
    description: string;
    value: string | null;
    installment: string | null;
    status: string | null;
    cededBy: string | null;
  }[];
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
  templateUrl: string | null; // modelo para download (anexo), quando houver
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
export type DocumentStatusDb =
  "A_ENVIAR" | "ENVIADO" | "APROVADO" | "REPROVADO";

/** Documento já enviado (slot tipo × integrante) — usado para casar com a lista resolvida. */
export interface UploadedDocumentDto {
  documentTypeId: string;
  familyMemberId: string | null;
  status: DocumentStatusDb;
  fileName: string | null;
  versionNo: number | null;
  reviewComment?: string | null;
  reviewedAt?: string | null; // ISO da última revisão (aprovação/reprovação)
}

/**
 * Linha da fila administrativa: uma inscrição com campos agregados para a
 * listagem da área admin (painel e gestão de candidatos). Somente leitura.
 */
export interface AdminApplicationRow {
  id: string; // applicationId (cuid)
  protocol: string; // "PRN-2026-0001"
  name: string;
  cpf: string; // formatado: 000.000.000-00
  course: string; // nome do curso ou "—"
  status: ProcessStatus;
  priority: Priority;
  docsSent: number; // documentos com arquivo enviado
  docsApproved: number; // documentos aprovados
  perCapita: string | null; // renda bruta per capita (string decimal) ou null
  analyst: string | null; // nome do analista responsável, ou null
  call: PreselectionCall; // chamada (1ª/2ª/espera)
  cycle: { id: string; label: string };
  selectionCall: SelectionCallSummaryDto | null;
  updatedAt: string; // ISO
}

/** Resultado de uma inscrição no envio em massa ao TOTVS RM. */
export interface RmBulkExportItemResult {
  applicationId: string;
  protocol: string | null;
  candidateName: string | null;
  outcome: "exported" | "already" | "failed";
  numeroInscricao: string | null;
  message?: string;
}

/** Resumo do envio em massa ao TOTVS RM, com retorno individual para conferência. */
export interface RmBulkExportResult {
  total: number;
  exported: number;
  already: number;
  failed: number;
  items: RmBulkExportItemResult[];
}

/** Documento enviado, visão do analista (slot + tipo + integrante + revisão). */
export interface AdminDocumentDto {
  documentId: string | null; // id do slot Document (null se ainda não há slot criado)
  documentTypeId: string;
  familyMemberId: string | null;
  name: string; // nome do tipo de documento
  category: string; // título da categoria
  memberName: string | null; // integrante a que se refere (ou null = inscrição)
  status: DocumentStatusDb;
  fileName: string | null;
  versionNo: number | null;
  reviewComment: string | null; // comentário da última revisão
}

/** Membro da equipe (para atribuição de analista). */
export interface AdminAnalystDto {
  id: string;
  name: string;
}

/** Aprovação/reprovação de um documento pelo analista. */
export interface AdminDocumentReviewInput {
  decision: "APROVADO" | "REPROVADO";
  comment?: string;
  rejectionReason?: string;
}

/** Decisão/parecer do analista sobre a inscrição. */
export interface AdminDecisionInput {
  parecer: string;
  decision: "CLASSIFICAR" | "PENDENCIA" | "LISTA_ESPERA" | "INDEFERIR";
  scholarshipKind?: "INTEGRAL" | "PARCIAL" | null;
  reasonCode?: string | null; // motivo categórico — obrigatório em PENDENCIA/INDEFERIR
  isFinal?: boolean;
  pendingDueAt?: string | null;
  pendingItems?: PendingRequestItemInput[];
}

/** Motivos categóricos por decisão (obrigatórios em pendência/indeferimento; alimentam indicadores). */
export const DECISION_REASONS: Record<
  "PENDENCIA" | "INDEFERIR",
  { value: string; label: string }[]
> = {
  PENDENCIA: [
    { value: "DOC_ILEGIVEL", label: "Documento ilegível" },
    { value: "DOC_FALTANTE", label: "Documento faltante" },
    { value: "DOC_DIVERGENTE", label: "Documento divergente ou inválido" },
    { value: "RENDA_NAO_COMPROVADA", label: "Renda não comprovada" },
    { value: "OUTRO", label: "Outro" },
  ],
  INDEFERIR: [
    { value: "RENDA_ACIMA", label: "Renda per capita acima do limite" },
    { value: "DOC_INCOMPLETA", label: "Documentação incompleta" },
    { value: "INELEGIVEL", label: "Não atende aos critérios do edital" },
    { value: "DESISTENCIA", label: "Desistência do candidato" },
    { value: "OUTRO", label: "Outro" },
  ],
};

/** Candidato pré-selecionado (linha da matriz importada do MEC/manual). */
/** Chamada do processo (define a janela de entrega de documentos). */
export type PreselectionCall = "PRIMEIRA" | "SEGUNDA" | "ESPERA";
export const PRESELECTION_CALLS: { value: PreselectionCall; label: string }[] =
  [
    { value: "PRIMEIRA", label: "1ª chamada" },
    { value: "SEGUNDA", label: "2ª chamada" },
    { value: "ESPERA", label: "Lista de espera" },
  ];

/** Situação pública do período de cadastro (tela inicial). */
export interface RegistrationCallStatus {
  value: PreselectionCall;
  label: string;
  start: string | null; // "YYYY-MM-DD"
  end: string | null;
  open: boolean;
}
export interface RegistrationStatusDto {
  open: boolean; // há alguma chamada aberta hoje
  calls: RegistrationCallStatus[];
  selectionCalls?: {
    call: SelectionCallSummaryDto;
    startsAt: string | null;
    endsAt: string | null;
    open: boolean;
  }[];
}

export interface PreselectionEntryDto {
  id: string;
  cpf: string; // formatado 000.000.000-00
  fullName: string | null;
  courseHint: string | null;
  campusHint: string | null;
  enemRegistration: string | null;
  call: PreselectionCall; // chamada (1ª/2ª/espera)
  claimed: boolean; // já virou inscrição (não pode excluir)
  candidateUserId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  cycle?: { id: string; label: string };
  selectionCall?: SelectionCallSummaryDto | null;
  course?: {
    id: string;
    name: string;
    campus: { id: string; code: string; name: string };
  } | null;
  state?: "AVAILABLE" | "CLAIMED" | "CANCELLED";
  createdAt: string;
}

/** Criação/edição manual de um pré-selecionado. */
export interface PreselectionInput {
  cpf: string;
  fullName?: string | null;
  courseHint?: string | null;
  campusHint?: string | null;
  enemRegistration?: string | null;
  call?: PreselectionCall;
  cycleId?: string;
  callId?: string;
  courseId?: string;
}

/** Resultado da importação de planilha (CSV/Excel) de pré-selecionados. */
export interface PreselectionImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; cpf: string; reason: string }[];
}

/** Contagens da base de candidatos (preview/resultado da limpeza de manutenção). */
export interface MaintenanceSummaryDto {
  candidates: number;
  applications: number;
  documents: number;
  documentVersions: number;
  familyMembers: number;
  socioForms: number;
  decisions: number;
  consents: number;
  notifications: number;
  verificationTokens: number;
  preselectionEntries: number;
  preselectionImports: number;
  pendingRequests: number;
  scholarshipGrants: number;
  auditLogs: number;
}

/** Resultado da limpeza da base (quantidades efetivamente removidas). */
export interface MaintenanceResetResult {
  deleted: MaintenanceSummaryDto;
}

/** Resultado da sincronização da matriz documental (modelos + escopos) no ciclo ativo. */
export interface DocMatrixSyncResult {
  cycleLabel: string;
  activeTypes: number;
  withTemplate: number;
}

/** Resultado da sincronização do catálogo de cursos/campi. */
export interface CourseSyncResult {
  campuses: number;
  coursesUpserted: number;
}

/** Parâmetros globais do sistema (Configurações → Parâmetros do sistema). */
export interface SystemSettingsDto {
  minimumWage: string; // salário mínimo vigente (R$), string decimal
  integralFactor: string; // fator do teto integral (× salário mínimo)
  parcialEnabled: boolean; // bolsa parcial habilitada neste ciclo
  parcialFactor: string; // fator do teto parcial (× salário mínimo)
  call1Start: string | null; // "YYYY-MM-DD" — janela de entrega da 1ª chamada
  call1End: string | null;
  call2Start: string | null; // 2ª chamada
  call2End: string | null;
  waitlistStart: string | null; // lista de espera
  waitlistEnd: string | null;
  call1RegistrationStartAt: string | null;
  call1RegistrationEndAt: string | null;
  call1InProgressStartAt: string | null;
  call1InProgressEndAt: string | null;
  call2RegistrationStartAt: string | null;
  call2RegistrationEndAt: string | null;
  call2InProgressStartAt: string | null;
  call2InProgressEndAt: string | null;
  waitlistRegistrationStartAt: string | null;
  waitlistRegistrationEndAt: string | null;
  waitlistInProgressStartAt: string | null;
  waitlistInProgressEndAt: string | null;
  notifyCandidate: boolean; // avisar o candidato por e-mail nas decisões
  autoRejectPendingAfterDeadline: boolean;
  autoRejectPendingComment: string;
  allowPendencyResubmission: boolean; // candidato em pendência reenvia/corrige mesmo fora do prazo da chamada
  pendencyResubmissionDeadline: string | null; // "YYYY-MM-DD" — data limite do reenvio de pendências (null = sem prazo extra)
  updatedAt: string; // ISO
  integralCap: string; // teto integral calculado = minimumWage × integralFactor
  parcialCap: string; // teto parcial calculado = minimumWage × parcialFactor
}

export interface AutoRejectionRunDto {
  id: string;
  createdAt: string;
  total: number;
  comment: string;
}

export interface AutoRejectionRevertResult {
  restored: number;
  skipped: number;
}

/* ============ Catálogo da matriz documental (editor visual) ============ */
// Estas listas descrevem, de forma legível, como a matriz de documentos é
// configurável na tela "Cursos e Documentos" (Operação). As CONDIÇÕES e seus
// VALORES são fixos em código (cada um lê um campo específico da ficha), mas a
// associação "condição → documento" é 100% editável e vive no banco.

/** Fontes de "outra renda" que disparam documentos (condição OTHER_INCOME). */
export type OtherIncomeSource =
  | "AJUDA_TERCEIROS"
  | "BENEFICIO_SOCIAL"
  | "PENSAO_RECEBIDA"
  | "PENSAO_PAGA"
  | "PENSAO_NAO_RECEBIDA"
  | "ALUGUEL_RECEBIDO";

/** Escopos possíveis de um documento (quantas vezes ele é exigido). */
export const DOC_SCOPES: { value: DocScope; label: string; hint: string }[] = [
  {
    value: "APPLICATION",
    label: "Uma vez por inscrição",
    hint: "Um único documento para toda a inscrição",
  },
  {
    value: "EACH_MEMBER",
    label: "Um por integrante",
    hint: "Exigido de cada pessoa do grupo familiar",
  },
  {
    value: "EACH_ADULT",
    label: "Um por maior de 18",
    hint: "Exigido de cada integrante com 18 anos ou mais",
  },
];

/** Posses de imóvel (valores da condição HOUSING_TENURE). */
export const HOUSING_TENURES: { value: HousingTenure; label: string }[] = [
  { value: "PROPRIO", label: "Imóvel próprio" },
  { value: "ALUGADO", label: "Imóvel alugado" },
  { value: "CEDIDO", label: "Imóvel cedido" },
  { value: "FINANCIADO", label: "Imóvel financiado" },
  { value: "IRREGULAR", label: "Imóvel em situação irregular" },
];

/** Fontes de outra renda (valores da condição OTHER_INCOME). */
export const OTHER_INCOME_SOURCES: {
  value: OtherIncomeSource;
  label: string;
}[] = [
  { value: "AJUDA_TERCEIROS", label: "Recebe ajuda financeira de terceiros" },
  {
    value: "BENEFICIO_SOCIAL",
    label: "Recebe benefício social (BPC, Bolsa Família…)",
  },
  { value: "PENSAO_RECEBIDA", label: "Recebe pensão alimentícia" },
  { value: "PENSAO_PAGA", label: "Paga pensão alimentícia" },
  {
    value: "PENSAO_NAO_RECEBIDA",
    label: "Deveria receber pensão e não recebe",
  },
  { value: "ALUGUEL_RECEBIDO", label: "Recebe renda de aluguel" },
];

/** Qual conjunto de valores uma condição usa (a UI monta o seletor a partir disso). */
export type ConditionValueSet =
  "NONE" | "INCOME_SITUATION" | "HOUSING_TENURE" | "OTHER_INCOME";

/** Catálogo legível das condições que disparam um documento (ordenado para a UI). */
export const DOC_CONDITIONS: {
  value: DocCondition;
  label: string;
  valueSet: ConditionValueSet;
}[] = [
  {
    value: "ALWAYS",
    label: "Sempre exigido (dentro do escopo)",
    valueSet: "NONE",
  },
  {
    value: "INCOME_SITUATION",
    label: "Conforme a situação de renda do integrante",
    valueSet: "INCOME_SITUATION",
  },
  {
    value: "HOUSING_TENURE",
    label: "Conforme a posse do imóvel",
    valueSet: "HOUSING_TENURE",
  },
  {
    value: "OTHER_INCOME",
    label: "Conforme a outra renda declarada",
    valueSet: "OTHER_INCOME",
  },
  {
    value: "HAS_VEHICLE",
    label: "Quando a família declara possuir veículo",
    valueSet: "NONE",
  },
  {
    value: "OPT_IN_COTAS",
    label: "Quando a inscrição concorre por cota racial",
    valueSet: "NONE",
  },
  {
    value: "GUARDIANSHIP",
    label: "Quando os pais não compõem o grupo familiar",
    valueSet: "NONE",
  },
  {
    value: "IS_PCD",
    label: "Quando o candidato é pessoa com deficiência",
    valueSet: "NONE",
  },
  {
    value: "IS_IMT_AFFILIATED",
    label: "Quando é funcionário/professor/dependente do IMT",
    valueSet: "NONE",
  },
  {
    value: "HAS_UNDECLARED_ASSETS",
    label: "Quando declara bens não informados no IR",
    valueSet: "NONE",
  },
  {
    value: "INCOME_COMMISSION_OVERTIME",
    label: "Quando o integrante recebe comissão ou hora extra",
    valueSet: "NONE",
  },
  {
    value: "HAS_CNPJ",
    label: "Quando o integrante possui CNPJ ativo ou inativo",
    valueSet: "NONE",
  },
  {
    value: "COMPANY_INACTIVE",
    label: "Quando é sócio de empresa inativa",
    valueSet: "NONE",
  },
];

/** Rótulo legível de um valor de condição, conforme o conjunto ao qual pertence. */
export function conditionValueLabel(
  valueSet: ConditionValueSet,
  value: string,
): string {
  const find = (arr: { value: string; label: string }[]) =>
    arr.find((o) => o.value === value)?.label ?? value;
  if (valueSet === "INCOME_SITUATION") return find(INCOME_SITUATIONS);
  if (valueSet === "HOUSING_TENURE") return find(HOUSING_TENURES);
  if (valueSet === "OTHER_INCOME") return find(OTHER_INCOME_SOURCES);
  return value;
}

/** Tipo de documento com todos os campos editáveis (tela de catálogo). */
export interface CatalogDocTypeDto {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  required: boolean;
  scope: DocScope;
  condition: DocCondition;
  conditionValues: string[];
  appliesTo: string | null;
  requiresSignature: boolean;
  templateUrl: string | null;
  active: boolean;
  sortOrder: number;
  documentsCount: number; // uploads de candidatos (bloqueia a exclusão)
}

/** Categoria com seus tipos (tela de catálogo). */
export interface CatalogCategoryDto {
  id: string;
  code: string;
  title: string;
  colorVar: string | null;
  sortOrder: number;
  types: CatalogDocTypeDto[];
}

/** Curso com contagem de inscrições vinculadas (bloqueia a exclusão). */
export interface CatalogCourseDto extends CourseDto {
  applicationsCount: number;
}

/** Perfis de equipe que podem acessar o sistema (exclui CANDIDATE). */
export type StaffRole = "ADMIN" | "ANALYST" | "VIEWER";
export type SystemPermissionName = "MANAGE_SCHEDULE";

/** Usuário interno (equipe) — linha do CRUD de Configurações → Usuários. */
export interface UserDto {
  id: string;
  fullName: string;
  cpf: string; // formatado 000.000.000-00
  email: string;
  role: StaffRole;
  active: boolean;
  permissions: SystemPermissionName[];
  createdAt: string;
}

/** Criação de usuário interno (senha obrigatória). */
export interface UserCreateInput {
  fullName: string;
  cpf: string;
  email: string;
  role: StaffRole;
  password: string;
}

/** Edição de usuário interno (campos opcionais; senha em branco mantém a atual). */
export interface UserUpdateInput {
  fullName?: string;
  email?: string;
  role?: StaffRole;
  active?: boolean;
  password?: string;
}

/** Renda bruta final apurada pela assistente social (uso interno). */
export interface AdminIncomeInput {
  grossIncome: string | null; // valor apurado (string decimal) ou null para limpar
  note?: string | null; // justificativa do ajuste
}

/** Indicadores agregados do ciclo ativo para o painel de gestão. */
export interface AdminStatsDto {
  totalApplications: number;
  byStatus: { status: ProcessStatus; count: number }[];
  funnel: { label: string; count: number; pct: number }[];
  byCourse: { course: string; count: number }[];
  rejectionReasons: { reason: string; count: number }[];
  analysts: { name: string; assigned: number; decisions: number }[];
  avgDaysToDecision: number | null;
}

/** Ações registradas na trilha de auditoria (espelha o enum AuditAction do Prisma). */
export type AuditLogAction =
  | "LOGIN"
  | "LOGOUT"
  | "ACCOUNT_CREATED"
  | "ACCOUNT_CREATE_FAILED"
  | "EMAIL_VERIFIED"
  | "FICHA_SUBMITTED"
  | "DOC_UPLOADED"
  | "DOC_APPROVED"
  | "DOC_REJECTED"
  | "DOC_REVERTED"
  | "DOC_DOWNLOADED"
  | "ANALYST_ASSIGNED"
  | "PARECER_SAVED"
  | "DECISION_MADE"
  | "STATUS_CHANGED"
  | "PRESELECTION_IMPORTED"
  | "CONFIG_CHANGED"
  | "CLIENT_ERROR"
  | "CANDIDATE_PASSWORD_RESET"
  | "IMPERSONATION_STARTED"
  | "IMPERSONATION_ENDED";

/**
 * Linha da trilha de auditoria para a tela Auditoria → Logs. Reúne ações da equipe,
 * do candidato e falhas técnicas (cadastro que não concluiu, erros de requisição do
 * front) — para diagnóstico e repasse à infraestrutura. Somente leitura, restrito a ADMIN.
 */
export interface AuditLogDto {
  id: string;
  action: AuditLogAction;
  actorName: string | null; // nome do usuário autor (null = anônimo/sistema)
  actorRole: string | null;
  entityType: string; // "User", "Application", "ClientError"...
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null; // detalhe técnico (status HTTP, URL, motivo…)
  createdAt: string; // ISO
}

/** Um ajuste da renda bruta total feito pela equipe (uso interno). */
export interface IncomeAdjustmentDto {
  value: string; // renda bruta total ajustada (decimal em string)
  previous: string | null; // valor imediatamente anterior (null no 1º ajuste)
  note: string | null; // justificativa do ajuste
  at: string; // ISO
  by: string | null; // nome de quem ajustou
}

/** Detalhe completo de uma inscrição para a tela de análise (somente leitura — Fase 2). */
export interface AdminApplicationDetail {
  id: string;
  protocol: string;
  name: string;
  cpf: string;
  email: string;
  course: string;
  campus: string | null;
  cycle: { id: string; label: string };
  call: PreselectionCall;
  selectionCall: SelectionCallSummaryDto | null;
  status: ProcessStatus;
  priority: Priority;
  optsForQuota: boolean;
  createdAt: string;
  updatedAt: string;
  analyst: string | null;
  /** Renda bruta final apurada pela assistente social (uso interno) e justificativa. */
  analystGrossIncome: string | null;
  analystIncomeNote: string | null;
  /** Histórico de ajustes da renda bruta total (mais antigo → mais recente). */
  incomeHistory: IncomeAdjustmentDto[];
  summary: SocioSummaryDto;
  family: FamilyMemberDto[];
  documents: AdminDocumentDto[];
  docTotals: { required: number; sent: number; approved: number };
  openPendingRequest: PendingRequestDto | null;
  events: ApplicationEventDto[];
  /** Integração RM: nº da inscrição no RM (null = não exportado) e quando foi exportado. */
  rmRegistration: string | null;
  rmSyncedAt: string | null;
}
