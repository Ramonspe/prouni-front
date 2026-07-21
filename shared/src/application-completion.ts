import { isValidCpf, normalizeCpf } from "./cpf";

export type ApplicationCompletionStep = "estudante" | "familia" | "moradia";

export interface ApplicationCompletionIssue {
  step: ApplicationCompletionStep;
  field: string;
  message: string;
  memberId?: string;
}

type MoneyValue =
  | string
  | number
  | { toString(): string }
  | null
  | undefined;

export interface CompletionFamilyMember {
  id: string;
  fullName?: string | null;
  relationship?: string | null;
  age?: number | null;
  cpf?: string | null;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  occupation?: string | null;
  incomeSituations?: readonly string[] | null;
  grossIncome?: MoneyValue;
  isStudent?: boolean | null;
  schoolName?: string | null;
  schoolFee?: MoneyValue;
}

export interface CompletionSocioForm {
  yearTerm?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  reference?: string | null;
  housingType?: string | null;
  tenure?: string | null;
  rentValue?: MoneyValue;
  installmentValue?: MoneyValue;
  propertyRegistry?: string | null;
  cededOwnerInfo?: string | null;
  studentMobile?: string | null;
  hasVehicle?: boolean | null;
}

export interface CompletionVehicle {
  description?: string | null;
  value?: MoneyValue;
  installment?: MoneyValue;
  status?: string | null;
  cededBy?: string | null;
}

const hasText = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().length > 0;

const hasMoney = (value: MoneyValue) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim();
  return /^\d{1,12}(\.\d{1,2})?$/.test(normalized);
};

const hasPhone = (value: string | null | undefined) => {
  if (!hasText(value)) return false;
  const digits = value!.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
};

function addIssue(
  issues: ApplicationCompletionIssue[],
  step: ApplicationCompletionStep,
  field: string,
  message: string,
  memberId?: string,
) {
  issues.push({ step, field, message, ...(memberId ? { memberId } : {}) });
}

export function studentCompletionIssues(
  form: CompletionSocioForm | null | undefined,
): ApplicationCompletionIssue[] {
  const issues: ApplicationCompletionIssue[] = [];
  if (!/^\d{4}\/[12]$/.test(form?.yearTerm?.trim() ?? "")) {
    addIssue(
      issues,
      "estudante",
      "yearTerm",
      "Informe o ano/semestre no formato AAAA/1 ou AAAA/2.",
    );
  }
  return issues;
}

export function familyCompletionIssues(
  members: readonly CompletionFamilyMember[] | null | undefined,
): ApplicationCompletionIssue[] {
  const issues: ApplicationCompletionIssue[] = [];
  if (!members?.length) {
    addIssue(
      issues,
      "familia",
      "members",
      "Inclua ao menos um integrante do grupo familiar.",
    );
    return issues;
  }

  for (const member of members) {
    const name = hasText(member.fullName) ? member.fullName!.trim() : "Integrante";
    const requiredTextFields: Array<
      [keyof CompletionFamilyMember, string | null | undefined, string]
    > = [
      ["fullName", member.fullName, "nome"],
      ["relationship", member.relationship, "parentesco"],
      ["occupation", member.occupation, "profissão"],
      ["maritalStatus", member.maritalStatus, "estado civil"],
      ["educationLevel", member.educationLevel, "grau de escolaridade"],
    ];
    for (const [field, value, label] of requiredTextFields) {
      if (!hasText(value)) {
        addIssue(
          issues,
          "familia",
          String(field),
          `${name}: informe ${label}.`,
          member.id,
        );
      }
    }

    if (
      typeof member.age !== "number" ||
      !Number.isInteger(member.age) ||
      member.age < 0 ||
      member.age > 120
    ) {
      addIssue(
        issues,
        "familia",
        "age",
        `${name}: informe a idade.`,
        member.id,
      );
    }
    const cpf = member.cpf ?? "";
    if (!hasText(cpf) || !isValidCpf(normalizeCpf(cpf))) {
      addIssue(
        issues,
        "familia",
        "cpf",
        `${name}: informe um CPF válido.`,
        member.id,
      );
    }
    if (!hasMoney(member.grossIncome)) {
      addIssue(
        issues,
        "familia",
        "grossIncome",
        `${name}: informe a renda bruta, mesmo que seja zero.`,
        member.id,
      );
    }
    if (
      typeof member.age === "number" &&
      member.age >= 18 &&
      !member.incomeSituations?.length
    ) {
      addIssue(
        issues,
        "familia",
        "incomeSituations",
        `${name}: selecione ao menos uma situação de renda.`,
        member.id,
      );
    }
    if (member.isStudent) {
      if (!hasText(member.schoolName)) {
        addIssue(
          issues,
          "familia",
          "schoolName",
          `${name}: informe a escola ou universidade.`,
          member.id,
        );
      }
      if (!hasMoney(member.schoolFee)) {
        addIssue(
          issues,
          "familia",
          "schoolFee",
          `${name}: informe a mensalidade, mesmo que seja zero.`,
          member.id,
        );
      }
    }
  }
  return issues;
}

export function housingCompletionIssues(
  form: CompletionSocioForm | null | undefined,
  vehicles: readonly CompletionVehicle[] | null | undefined,
): ApplicationCompletionIssue[] {
  const issues: ApplicationCompletionIssue[] = [];
  const requiredTextFields: Array<
    [keyof CompletionSocioForm, string | null | undefined, string]
  > = [
    ["addressStreet", form?.addressStreet, "Informe a rua ou avenida."],
    ["addressNumber", form?.addressNumber, "Informe o número do endereço."],
    ["neighborhood", form?.neighborhood, "Informe o bairro."],
    ["city", form?.city, "Informe a cidade."],
    ["state", form?.state, "Informe o estado."],
    ["reference", form?.reference, "Informe o ponto de referência."],
    ["housingType", form?.housingType, "Informe o tipo do imóvel."],
    ["tenure", form?.tenure, "Informe a posse do imóvel."],
  ];
  for (const [field, value, message] of requiredTextFields) {
    if (!hasText(value)) addIssue(issues, "moradia", String(field), message);
  }

  if (!/^\d{5}-?\d{3}$/.test(form?.zipCode?.trim() ?? "")) {
    addIssue(issues, "moradia", "zipCode", "Informe um CEP válido.");
  }
  if (!hasPhone(form?.studentMobile)) {
    addIssue(
      issues,
      "moradia",
      "studentMobile",
      "Informe um celular válido para o estudante.",
    );
  }

  if (form?.tenure === "ALUGADO" && !hasMoney(form.rentValue)) {
    addIssue(issues, "moradia", "rentValue", "Informe o valor do aluguel.");
  }
  if (form?.tenure === "FINANCIADO" && !hasMoney(form.installmentValue)) {
    addIssue(
      issues,
      "moradia",
      "installmentValue",
      "Informe o valor da prestação do imóvel.",
    );
  }
  if (form?.tenure === "PROPRIO" && !hasText(form.propertyRegistry)) {
    addIssue(
      issues,
      "moradia",
      "propertyRegistry",
      "Informe a matrícula do imóvel.",
    );
  }
  if (form?.tenure === "CEDIDO" && !hasText(form.cededOwnerInfo)) {
    addIssue(
      issues,
      "moradia",
      "cededOwnerInfo",
      "Informe quem cedeu o imóvel e o parentesco.",
    );
  }

  if (form?.hasVehicle) {
    const vehicle = vehicles?.[0];
    if (!hasText(vehicle?.description)) {
      addIssue(
        issues,
        "moradia",
        "vehicle.description",
        "Informe marca, modelo e ano do veículo.",
      );
    }
    if (!hasMoney(vehicle?.value)) {
      addIssue(
        issues,
        "moradia",
        "vehicle.value",
        "Informe o valor aproximado do veículo.",
      );
    }
    if (!hasText(vehicle?.status)) {
      addIssue(
        issues,
        "moradia",
        "vehicle.status",
        "Informe a situação do veículo.",
      );
    }
    if (vehicle?.status === "FINANCIADO" && !hasMoney(vehicle.installment)) {
      addIssue(
        issues,
        "moradia",
        "vehicle.installment",
        "Informe o valor da parcela do veículo.",
      );
    }
    if (vehicle?.status === "CEDIDO" && !hasText(vehicle.cededBy)) {
      addIssue(
        issues,
        "moradia",
        "vehicle.cededBy",
        "Informe quem cedeu o veículo.",
      );
    }
  }
  return issues;
}

export function applicationCompletionIssues(input: {
  form?: CompletionSocioForm | null;
  members?: readonly CompletionFamilyMember[] | null;
  vehicles?: readonly CompletionVehicle[] | null;
}): ApplicationCompletionIssue[] {
  return [
    ...studentCompletionIssues(input.form),
    ...familyCompletionIssues(input.members),
    ...housingCompletionIssues(input.form, input.vehicles),
  ];
}
