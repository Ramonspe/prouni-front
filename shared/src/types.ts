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
  perFamilyMember: boolean;
  appliesTo: string | null;
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
    submittedAt: string | null;
  };
  incomes: { id: string; label: string; amount: string; sign: number }[];
  expenses: { id: string; label: string; amount: string }[];
  vehicles: { id: string; description: string; value: string | null; installment: string | null; status: string | null }[];
  summary: SocioSummaryDto;
}
