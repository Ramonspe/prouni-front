import { z } from "zod";
import { isValidCpf, normalizeCpf } from "./cpf";

/** CPF: normaliza para apenas dígitos e valida os dígitos verificadores. */
export const cpfSchema = z
  .string()
  .transform(normalizeCpf)
  .refine((v) => isValidCpf(v), "CPF inválido");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido");

/** Regra exibida na UI: mínimo 8 caracteres, 1 número e 1 caractere especial. */
export const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/\d/, "Inclua pelo menos 1 número")
  .regex(/[^A-Za-z0-9]/, "Inclua pelo menos 1 caractere especial");

export const loginSchema = z.object({
  cpf: cpfSchema,
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Início do cadastro: SÓ e-mail (verificação anti-bot logo na entrada).
 * O CPF é coletado depois, na criação de acesso, onde a elegibilidade é validada.
 */
export const accountStartSchema = z.object({
  email: emailSchema,
});
export type AccountStartInput = z.infer<typeof accountStartSchema>;

export const verifyTokenSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;

export const registerSchema = z
  .object({
    cpf: cpfSchema,
    fullName: z.string().trim().min(5, "Informe o nome completo"),
    birthDate: z.string().optional(),
    email: emailSchema,
    phone: z.string().trim().min(10, "Telefone inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, "É necessário aceitar os termos"),
    optInCotas: z.boolean().optional(),
    optInPcd: z.boolean().optional(),
    optInImt: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/** Valor monetário trafega como string canônica "1234.56" (Decimal não serializa nativo). */
export const moneyString = z
  .string()
  .regex(/^\d{1,12}(\.\d{1,2})?$/, "Valor monetário inválido");

export const enemSchema = z.object({
  edition: z.coerce.number().int().min(2000).max(2100),
  registration: z.string().regex(/^\d{12}$/, "Nº de inscrição do ENEM deve ter 12 dígitos"),
});
export type EnemInput = z.infer<typeof enemSchema>;

export const courseSelectSchema = z.object({
  courseId: z.string().min(1, "Selecione um curso"),
});
export type CourseSelectInput = z.infer<typeof courseSelectSchema>;

/** Situação de renda do integrante — define os documentos de renda exigidos dele. */
export const incomeSituationSchema = z.enum([
  "ASSALARIADO",
  "AUTONOMO_LIBERAL",
  "AUTONOMO",
  "LIBERAL",
  "INFORMAL",
  "SEM_RENDA",
  "DESEMPREGADO",
  "MEI",
  "EMPRESARIO",
  "PRODUTOR_RURAL",
  "APOSENTADO_PENSIONISTA",
  "ESTAGIARIO_APRENDIZ",
]);

export const familyMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome"),
  relationship: z.string().trim().min(1, "Informe o parentesco"),
  birthDate: z.string().optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  cpf: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  incomeSituations: z.array(incomeSituationSchema).optional(),
  receivesCommissionOvertime: z.boolean().optional(),
  companyInactive: z.boolean().optional(),
  grossIncome: moneyString.optional(),
  isStudent: z.boolean().optional(),
  isFinancialResponsible: z.boolean().optional(),
  schoolName: z.string().optional(),
  schoolFee: moneyString.optional(),
});
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

const incomeItemSchema = z.object({
  label: z.string().min(1),
  amount: moneyString,
  sign: z.union([z.literal(1), z.literal(-1)]).optional(),
});
const expenseItemSchema = z.object({ label: z.string().min(1), amount: moneyString });
const vehicleItemSchema = z.object({
  description: z.string().min(1),
  value: moneyString.optional(),
  installment: moneyString.optional(),
  status: z.enum(["PROPRIO", "FINANCIADO", "CEDIDO"]).optional(),
  cededBy: z.string().optional(),
});

/** Ficha socioeconômica — todos os campos opcionais (autosave por seção). */
export const socioFormSchema = z.object({
  nisCadUnico: z.string().optional(),
  yearTerm: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressUnit: z.string().optional(),
  neighborhood: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  reference: z.string().optional(),
  housingType: z.enum(["CASA", "APARTAMENTO"]).optional(),
  tenure: z.enum(["PROPRIO", "ALUGADO", "CEDIDO", "FINANCIADO", "IRREGULAR"]).optional(),
  rentValue: moneyString.optional(),
  installmentValue: moneyString.optional(),
  propertyRegistry: z.string().optional(),
  landline: z.string().optional(),
  cededOwnerInfo: z.string().optional(),
  hasOtherIncome: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
  // Flags que disparam documentos condicionais (refletem perguntas da ficha).
  receivesAlimony: z.boolean().optional(),
  paysAlimony: z.boolean().optional(),
  receivesRentalIncome: z.boolean().optional(),
  receivesThirdPartyHelp: z.boolean().optional(),
  receivesSocialBenefit: z.boolean().optional(),
  parentsOutsideGroup: z.boolean().optional(),
  shouldReceiveAlimony: z.boolean().optional(),
  hasUndeclaredAssets: z.boolean().optional(),
  incomes: z.array(incomeItemSchema).optional(),
  expenses: z.array(expenseItemSchema).optional(),
  vehicles: z.array(vehicleItemSchema).optional(),
});
export type SocioFormInput = z.infer<typeof socioFormSchema>;
