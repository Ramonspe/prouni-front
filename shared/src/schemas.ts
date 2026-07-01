import { z } from "zod";
import { isValidCpf, normalizeCpf } from "./cpf";

/** Texto curto saneado: trim + teto de caracteres (fecha brecha de payload gigante). */
const txt = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

/** CPF: normaliza para apenas dígitos e valida os dígitos verificadores. */
export const cpfSchema = z
  .string()
  .max(14, "CPF inválido")
  .transform(normalizeCpf)
  .refine((v) => isValidCpf(v), "CPF inválido");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "E-mail muito longo")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-mail inválido");

/** Regra exibida na UI: mínimo 8 caracteres, 1 número e 1 caractere especial. */
export const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .max(72, "Máximo de 72 caracteres")
  .regex(/\d/, "Inclua pelo menos 1 número")
  .regex(/[^A-Za-z0-9]/, "Inclua pelo menos 1 caractere especial");

/** Telefone (aceita máscara "(11) 99999-9999"): só dígitos e separadores, 10–11 dígitos. */
export const phoneSchema = z
  .string()
  .trim()
  .min(10, "Telefone inválido")
  .max(16, "Telefone inválido")
  .regex(/^[()\d\s-]+$/, "Telefone inválido")
  .refine((v) => {
    const d = v.replace(/\D/g, "").length;
    return d >= 10 && d <= 11;
  }, "Telefone inválido");

/** RG — formato abrangente (vários estados): dígitos, letra verificadora e separadores. */
export const rgSchema = txt(14).regex(/^[0-9A-Za-z.\-/ ]*$/, "RG inválido");

/** CPF opcional (integrante do grupo familiar): vazio é permitido; se preenchido, valida. */
export const optionalCpfSchema = z
  .string()
  .trim()
  .max(14)
  .optional()
  .refine((v) => !v || isValidCpf(normalizeCpf(v)), "CPF inválido");

export const loginSchema = z.object({
  cpf: cpfSchema,
  password: z.string().min(1, "Informe a senha").max(72),
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

/** "Esqueci minha senha" — passo 1: solicita o código por CPF. */
export const forgotPasswordSchema = z.object({
  cpf: cpfSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** "Esqueci minha senha" — passo 2: redefine a senha com o código recebido. */
export const resetPasswordSchema = z.object({
  cpf: cpfSchema,
  code: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    cpf: cpfSchema,
    fullName: txt(120).min(5, "Informe o nome completo"),
    birthDate: txt(10).optional(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().max(72),
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
  courseId: txt(40).min(1, "Selecione um curso"),
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
  fullName: txt(120).min(2, "Informe o nome"),
  relationship: txt(40).min(1, "Informe o parentesco"),
  birthDate: txt(10).optional(),
  age: z.coerce.number().int().min(0).max(120).optional(),
  cpf: optionalCpfSchema,
  maritalStatus: txt(40).optional(),
  educationLevel: txt(40).optional(),
  occupation: txt(80).optional(),
  incomeSituations: z.array(incomeSituationSchema).max(12).optional(),
  receivesCommissionOvertime: z.boolean().optional(),
  companyInactive: z.boolean().optional(),
  grossIncome: moneyString.optional(),
  isStudent: z.boolean().optional(),
  isFinancialResponsible: z.boolean().optional(),
  schoolName: txt(120).optional(),
  schoolFee: moneyString.optional(),
});
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

const incomeItemSchema = z.object({
  label: txt(80).min(1),
  amount: moneyString,
  sign: z.union([z.literal(1), z.literal(-1)]).optional(),
});
const expenseItemSchema = z.object({ label: txt(80).min(1), amount: moneyString });
const vehicleItemSchema = z.object({
  description: txt(80).min(1),
  value: moneyString.optional(),
  installment: moneyString.optional(),
  status: z.enum(["PROPRIO", "FINANCIADO", "CEDIDO"]).optional(),
  cededBy: txt(80).optional(),
});

/** Ficha socioeconômica — todos os campos opcionais (autosave por seção). */
export const socioFormSchema = z.object({
  nisCadUnico: txt(18).optional(),
  yearTerm: txt(12).optional(),
  addressStreet: txt(150).optional(),
  addressNumber: txt(10).optional(),
  addressUnit: txt(12).optional(),
  neighborhood: txt(80).optional(),
  zipCode: txt(9).optional(),
  city: txt(80).optional(),
  state: txt(40).optional(),
  reference: txt(200).optional(),
  housingType: z.enum(["CASA", "APARTAMENTO"]).optional(),
  tenure: z.enum(["PROPRIO", "ALUGADO", "CEDIDO", "FINANCIADO", "IRREGULAR"]).optional(),
  rentValue: moneyString.optional(),
  installmentValue: moneyString.optional(),
  propertyRegistry: txt(40).optional(),
  landline: txt(16).optional(),
  studentMobile: txt(16).optional(),
  guardianName: txt(120).optional(),
  guardianPhone: txt(16).optional(),
  cededOwnerInfo: txt(150).optional(),
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
  incomes: z.array(incomeItemSchema).max(30).optional(),
  expenses: z.array(expenseItemSchema).max(40).optional(),
  vehicles: z.array(vehicleItemSchema).max(10).optional(),
});
export type SocioFormInput = z.infer<typeof socioFormSchema>;

/**
 * Diagnóstico de falha de requisição enviado pelo front (Admin → Auditoria → Logs).
 * Sem dados sensíveis: apenas o detalhe técnico que a infraestrutura precisa para
 * rastrear o problema (status HTTP, rota, ids do CDN/WAF, trecho da resposta).
 */
export const clientErrorReportSchema = z.object({
  status: z.coerce.number().int().min(0).max(599),
  url: txt(300),
  method: txt(10).optional(),
  message: txt(500).optional(),
  responseSnippet: txt(2000).optional(),
  page: txt(300).optional(),
  requestId: txt(200).optional(),
  cfId: txt(200).optional(),
  cfPop: txt(80).optional(),
  traceId: txt(200).optional(),
});
export type ClientErrorReport = z.infer<typeof clientErrorReportSchema>;

/** Cadastro/edição manual de pré-selecionado (Configurações, admin). */
export const preselectionInputSchema = z.object({
  cpf: cpfSchema,
  fullName: txt(120).optional(),
  courseHint: txt(120).optional(),
  campusHint: txt(40).optional(),
  enemRegistration: txt(20).optional(),
});
export type PreselectionInputSchema = z.infer<typeof preselectionInputSchema>;

/** Frase de confirmação exigida para limpar a base de candidatos (manutenção). */
export const RESET_CONFIRMATION = "LIMPAR BASE";

/** Limpeza da base de candidatos (manutenção, admin) — exige a frase exata. */
export const databaseResetSchema = z
  .object({ confirmation: z.string().max(40) })
  .refine((d) => d.confirmation.trim() === RESET_CONFIRMATION, {
    message: `Digite exatamente "${RESET_CONFIRMATION}" para confirmar.`,
    path: ["confirmation"],
  });
export type DatabaseResetSchema = z.infer<typeof databaseResetSchema>;

/** Perfis de equipe selecionáveis no cadastro de usuários (exclui CANDIDATE). */
export const staffRoleSchema = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

/** Criação de usuário interno (Configurações → Usuários, admin). */
export const userCreateSchema = z.object({
  fullName: txt(120).min(5, "Informe o nome completo"),
  cpf: cpfSchema,
  email: emailSchema,
  role: staffRoleSchema,
  password: passwordSchema,
});
export type UserCreateSchema = z.infer<typeof userCreateSchema>;

/** Edição de usuário interno: tudo opcional; senha em branco mantém a atual. */
export const userUpdateSchema = z.object({
  fullName: txt(120).min(5, "Informe o nome completo").optional(),
  email: emailSchema.optional(),
  role: staffRoleSchema.optional(),
  active: z.boolean().optional(),
  password: passwordSchema.optional(),
});
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

/* =============== Catálogo (Operação → Cursos e Documentos) =============== */

const docScopeSchema = z.enum(["APPLICATION", "EACH_MEMBER", "EACH_ADULT"]);
const docConditionSchema = z.enum([
  "ALWAYS",
  "INCOME_SITUATION",
  "HOUSING_TENURE",
  "HAS_VEHICLE",
  "OPT_IN_COTAS",
  "OTHER_INCOME",
  "GUARDIANSHIP",
  "IS_PCD",
  "IS_IMT_AFFILIATED",
  "HAS_UNDECLARED_ASSETS",
  "INCOME_COMMISSION_OVERTIME",
  "COMPANY_INACTIVE",
]);

/** Criação/edição de curso (Operação → Cursos). */
export const courseUpsertSchema = z.object({
  name: txt(120).min(1, "Informe o nome do curso"),
  campusId: z.string().min(1, "Selecione o campus"),
  shifts: z.array(txt(30)).max(6).default([]),
  durationYears: z.number().int().min(1).max(10).nullable().optional(),
});
export type CourseUpsertInput = z.infer<typeof courseUpsertSchema>;

/** Criação/edição de categoria de documento. */
export const docCategoryUpsertSchema = z.object({
  title: txt(120).min(1, "Informe o título da categoria"),
  colorVar: txt(40).nullable().optional(),
});
export type DocCategoryUpsertInput = z.infer<typeof docCategoryUpsertSchema>;

/** Criação/edição de tipo de documento — inclui a condição que o dispara. */
export const docTypeUpsertSchema = z.object({
  name: txt(400).min(1, "Informe o nome do documento"),
  categoryId: z.string().min(1, "Selecione a categoria"),
  scope: docScopeSchema.default("APPLICATION"),
  condition: docConditionSchema.default("ALWAYS"),
  conditionValues: z.array(txt(40)).max(20).default([]),
  appliesTo: txt(160).nullable().optional(),
  required: z.boolean().default(true),
  requiresSignature: z.boolean().default(false),
  active: z.boolean().default(true),
});
export type DocTypeUpsertInput = z.infer<typeof docTypeUpsertSchema>;
