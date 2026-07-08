import type {
  AdminAnalystDto,
  AdminApplicationDetail,
  AdminApplicationRow,
  AdminDecisionInput,
  AdminDocumentReviewInput,
  AdminIncomeInput,
  AdminStatsDto,
  AuditLogDto,
  PreselectionEntryDto,
  PreselectionImportResult,
  PreselectionInput,
  UserDto,
  UserCreateInput,
  UserUpdateInput,
  MaintenanceSummaryDto,
  MaintenanceResetResult,
  DocMatrixSyncResult,
  CourseSyncResult,
  ApplicationDto,
  ApplicationEventDto,
  CampusDto,
  CourseDto,
  CatalogCourseDto,
  CatalogCategoryDto,
  CatalogDocTypeDto,
  CourseUpsertInput,
  DocCategoryUpsertInput,
  DocTypeUpsertInput,
  CycleDto,
  DocumentCategoryDto,
  FamilyMemberDto,
  FamilyMemberInput,
  RequiredDocumentsDto,
  SocioFormDto,
  SocioFormInput,
  UploadedDocumentDto,
} from "@prouni/shared";

// Cliente HTTP do portal. Access token em MEMÓRIA (nunca localStorage);
// refresh token vive em cookie httpOnly setado pela API. Em 401, tenta um
// refresh único (single-flight) e refaz a requisição.

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api/v1";

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SessionUser {
  id: string;
  cpf: string;
  fullName: string;
  email: string;
  role: string;
}
export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
  protocol?: string;
}

let refreshPromise: Promise<boolean> | null = null;

/** Refresh único compartilhado: várias requisições em 401 disparam um só /auth/refresh. */
function refreshAccess(): Promise<boolean> {
  if (!refreshPromise) {
    const p = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
        if (!res.ok) return false;
        const data = (await res.json()) as AuthResponse;
        accessToken = data.accessToken ?? null;
        return Boolean(accessToken);
      } catch {
        return false;
      }
    })();
    refreshPromise = p;
    void p.finally(() => {
      if (refreshPromise === p) refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Diagnóstico best-effort: envia o detalhe técnico de uma falha de requisição para a
 * auditoria (Admin → Auditoria → Logs), para a infraestrutura rastrear. Usa fetch cru
 * (não passa por apiFetch — evita recursão) e nunca lança nem bloqueia o fluxo.
 */
function reportClientError(payload: {
  status: number;
  url: string;
  method?: string;
  message?: string;
  responseSnippet?: string;
  page?: string;
  requestId?: string;
  cfId?: string;
  cfPop?: string;
  traceId?: string;
}): void {
  try {
    void fetch(`${API_BASE}/diagnostics/client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca interfere no fluxo do usuário */
  }
}

interface FetchOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Anexa o Authorization Bearer (padrão true). */
  auth?: boolean;
  /** Permite uma tentativa de refresh em 401 (padrão true). */
  retry?: boolean;
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true, retry = true } = opts;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const page = typeof window !== "undefined" ? window.location.pathname : undefined;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch (networkErr) {
    // Sem resposta alguma (DNS, conexão recusada, CORS, offline). Registra e converte
    // em ApiError com status 0, para o usuário ver um motivo claro em vez de um crash.
    reportClientError({
      status: 0,
      url: path,
      method,
      message: networkErr instanceof Error ? networkErr.message : "Falha de rede",
      page,
    });
    throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }

  if (res.status === 401 && retry && auth) {
    const ok = await refreshAccess();
    if (ok) return apiFetch<T>(path, { ...opts, retry: false });
  }

  // Resposta pode não ser JSON (ex.: página de erro HTML do WAF/CloudFront, 5xx do
  // gateway). Nunca deixar o JSON.parse estourar — sempre converter em ApiError com
  // o status real, para o usuário/log verem o motivo em vez de um erro genérico.
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  const asObj = data as { message?: string; issues?: { path: string; message: string }[] } | null;

  // Cabeçalhos de rastreio do CDN/WAF/gateway — ouro para a infra localizar a requisição.
  const h = (n: string) => res.headers.get(n) ?? undefined;
  const diag = {
    requestId: h("x-request-id") ?? h("x-amzn-requestid"),
    cfId: h("x-amz-cf-id"),
    cfPop: h("x-amz-cf-pop"),
    traceId: h("x-amzn-trace-id"),
  };

  if (!res.ok) {
    const message = asObj?.message || `Falha na requisição (HTTP ${res.status}).`;
    // Reporta falhas inesperadas. Ignora o 401 (desafio de refresh, rotineiro) e a
    // validação de campo 400 com issues (erro normal, corrigido pelo usuário no form).
    const isFieldValidation =
      res.status === 400 && Array.isArray(asObj?.issues) && (asObj!.issues!.length ?? 0) > 0;
    if (res.status !== 401 && !isFieldValidation) {
      reportClientError({
        status: res.status,
        url: path,
        method,
        message,
        responseSnippet: text ? text.slice(0, 2000) : undefined,
        page,
        ...diag,
      });
    }
    throw new ApiError(res.status, message, asObj?.issues);
  }
  if (data === null && text) {
    // 2xx mas corpo não-JSON (resposta inesperada de um proxy/CDN).
    reportClientError({
      status: res.status,
      url: path,
      method,
      message: "Resposta 2xx não-JSON (proxy/CDN inesperado).",
      responseSnippet: text.slice(0, 2000),
      page,
      ...diag,
    });
    throw new ApiError(res.status, "Resposta inesperada do servidor.");
  }
  return data as T;
}

/** Endpoints de autenticação/cadastro. */
export const authApi = {
  login: (cpf: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: { cpf, password }, auth: false, retry: false }),
  refresh: () => apiFetch<AuthResponse>("/auth/refresh", { method: "POST", auth: false, retry: false }),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST", auth: false, retry: false }),
  me: () => apiFetch<SessionUser & { emailVerified: boolean }>("/auth/me"),
  start: (email: string) =>
    apiFetch<{ message: string }>("/account/start", { method: "POST", body: { email }, auth: false, retry: false }),
  resend: (email: string) =>
    apiFetch<{ message: string }>("/account/resend-token", { method: "POST", body: { email }, auth: false, retry: false }),
  forgotPassword: (cpf: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: { cpf }, auth: false, retry: false }),
  resetPassword: (cpf: string, code: string, password: string) =>
    apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: { cpf, code, password }, auth: false, retry: false }),
  verifyToken: (email: string, code: string) =>
    apiFetch<{ registrationToken: string; email: string }>("/account/verify-token", {
      method: "POST",
      body: { email, code },
      auth: false,
      retry: false,
    }),
  /** DEV ONLY — token de registro sem código (servidor só aceita com DEV_AUTH_BYPASS). */
  devToken: (email: string) =>
    apiFetch<{ registrationToken: string; email: string }>("/account/dev-token", {
      method: "POST",
      body: { email },
      auth: false,
      retry: false,
    }),
  register: (registrationToken: string, body: Record<string, unknown>) =>
    apiFetch<AuthResponse>("/account/register", {
      method: "POST",
      body,
      auth: false,
      retry: false,
      headers: { "x-registration-token": registrationToken },
    }),
};

/** Catálogo do ciclo ativo (público). */
export const cyclesApi = {
  active: () => apiFetch<CycleDto>("/cycles/active", { auth: false, retry: false }),
  /** Matriz documental completa vigente, agrupada por categoria. */
  documentTypes: () =>
    apiFetch<{ categories: DocumentCategoryDto[] }>("/cycles/active/document-types", { auth: false, retry: false }),
};

/** Cursos e campi (público). */
export const coursesApi = {
  campuses: () => apiFetch<CampusDto[]>("/campuses", { auth: false, retry: false }),
  courses: (campus?: string) =>
    apiFetch<CourseDto[]>(`/courses${campus ? `?campus=${encodeURIComponent(campus)}` : ""}`, { auth: false, retry: false }),
};

/** Inscrição do candidato autenticado. */
export const applicationsApi = {
  me: () => apiFetch<ApplicationDto>("/applications/me"),
  events: (id: string) => apiFetch<ApplicationEventDto[]>(`/applications/${id}/events`),
  /** Lista exata de documentos exigidos, resolvida a partir dos dados da inscrição. */
  requiredDocuments: (id: string) => apiFetch<RequiredDocumentsDto>(`/applications/${id}/required-documents`),
  enem: (id: string, body: { edition: number; registration: string }) =>
    apiFetch<ApplicationDto>(`/applications/${id}/enem`, { method: "PATCH", body }),
  course: (id: string, body: { courseId: string }) =>
    apiFetch<ApplicationDto>(`/applications/${id}/course`, { method: "PATCH", body }),
  /** Finaliza a inscrição (marca ENVIADA e trava novos envios). */
  finalize: (id: string) =>
    apiFetch<ApplicationDto>(`/applications/${id}/finalize`, { method: "POST" }),
};

/** Grupo familiar da inscrição. */
export const familyApi = {
  list: (appId: string) => apiFetch<FamilyMemberDto[]>(`/applications/${appId}/family`),
  create: (appId: string, body: FamilyMemberInput) =>
    apiFetch<FamilyMemberDto>(`/applications/${appId}/family`, { method: "POST", body }),
  update: (memberId: string, body: Partial<FamilyMemberInput>) =>
    apiFetch<FamilyMemberDto>(`/family/${memberId}`, { method: "PATCH", body }),
  remove: (memberId: string) => apiFetch<void>(`/family/${memberId}`, { method: "DELETE" }),
};

/** Documentos comprobatórios — status e envio de arquivo (multipart). */
export const documentsApi = {
  list: (appId: string) => apiFetch<UploadedDocumentDto[]>(`/applications/${appId}/documents`),
  upload: (appId: string, typeId: string, memberId: string | null, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("typeId", typeId);
    if (memberId) fd.append("memberId", memberId);
    return apiFetch<UploadedDocumentDto>(`/applications/${appId}/documents`, { method: "POST", body: fd });
  },
};

/** Área administrativa (equipe). Somente leitura na Fase 1. */
export const adminApi = {
  applications: (params: { q?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    const s = qs.toString();
    return apiFetch<AdminApplicationRow[]>(`/admin/applications${s ? `?${s}` : ""}`);
  },
  application: (id: string) => apiFetch<AdminApplicationDetail>(`/admin/applications/${id}`),
  analysts: () => apiFetch<AdminAnalystDto[]>("/admin/analysts"),
  stats: () => apiFetch<AdminStatsDto>("/admin/stats"),
  /** Trilha de auditoria (Auditoria → Logs). Restrito a ADMIN no servidor. */
  logs: (params: { action?: string; q?: string; from?: string; to?: string; take?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.action && params.action !== "all") qs.set("action", params.action);
    if (params.q) qs.set("q", params.q);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.take) qs.set("take", String(params.take));
    const s = qs.toString();
    return apiFetch<AuditLogDto[]>(`/admin/logs${s ? `?${s}` : ""}`);
  },
  reviewDocument: (documentId: string, body: AdminDocumentReviewInput) =>
    apiFetch<AdminApplicationDetail>(`/admin/documents/${documentId}/review`, { method: "POST", body }),
  assignAnalyst: (appId: string, analystId: string | null) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/analyst`, { method: "PATCH", body: { analystId } }),
  startAnalysis: (appId: string) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/start-analysis`, { method: "POST" }),
  decide: (appId: string, body: AdminDecisionInput) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/decision`, { method: "POST", body }),
  setIncome: (appId: string, body: AdminIncomeInput) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/income`, { method: "PATCH", body }),
  /** Exporta a inscrição (classificado) para o TOTVS RM e devolve o detalhe atualizado. */
  exportToRm: (appId: string) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/rm-export`, { method: "POST" }),
  /** Reverte a exportação (corretivo, ADMIN): limpa o vínculo com o RM e volta o status. */
  revertRm: (appId: string) =>
    apiFetch<AdminApplicationDetail>(`/admin/applications/${appId}/rm-export/revert`, { method: "POST" }),
  /** Diagnóstico read-only: o backend alcança o RM? (confirma a rota AWS→RM). */
  pingRm: () =>
    apiFetch<{ target: string; ok: boolean; httpStatus?: number; ms: number; error?: string }>("/admin/rm/ping"),
  /** Baixa o arquivo do documento (com Bearer) e devolve um object URL + mime para exibir inline. */
  documentFile: async (documentId: string): Promise<{ url: string; mime: string }> => {
    const res = await fetch(`${API_BASE}/admin/documents/${documentId}/file`, {
      credentials: "include",
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    });
    if (!res.ok) throw new ApiError(res.status, "Não foi possível abrir o arquivo.");
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), mime: blob.type };
  },
};

/** Pré-selecionados (Configurações): CRUD + importação CSV/Excel. */
export const preselectionApi = {
  list: (q?: string) =>
    apiFetch<PreselectionEntryDto[]>(`/admin/preselection${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (body: PreselectionInput) =>
    apiFetch<PreselectionEntryDto>("/admin/preselection", { method: "POST", body }),
  update: (id: string, body: PreselectionInput) =>
    apiFetch<PreselectionEntryDto>(`/admin/preselection/${id}`, { method: "PATCH", body }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/admin/preselection/${id}`, { method: "DELETE" }),
  import: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<PreselectionImportResult>("/admin/preselection/import", { method: "POST", body: fd });
  },
};

/** Usuários internos (Configurações → Usuários): CRUD restrito a ADMIN. */
export const usersApi = {
  list: (q?: string) =>
    apiFetch<UserDto[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (body: UserCreateInput) =>
    apiFetch<UserDto>("/admin/users", { method: "POST", body }),
  update: (id: string, body: UserUpdateInput) =>
    apiFetch<UserDto>(`/admin/users/${id}`, { method: "PATCH", body }),
};

/**
 * Catálogo (Operação → Cursos e Documentos): CRUD de cursos, categorias e tipos
 * de documento — incluindo as condições que disparam cada documento. Disponível
 * para ADMIN e ANALYST. O banco é a fonte da verdade da matriz documental.
 */
export const catalogApi = {
  // Cursos
  campuses: () => apiFetch<CampusDto[]>("/admin/catalog/campuses"),
  courses: () => apiFetch<CatalogCourseDto[]>("/admin/catalog/courses"),
  createCourse: (body: CourseUpsertInput) =>
    apiFetch<CatalogCourseDto>("/admin/catalog/courses", { method: "POST", body }),
  updateCourse: (id: string, body: CourseUpsertInput) =>
    apiFetch<CatalogCourseDto>(`/admin/catalog/courses/${id}`, { method: "PATCH", body }),
  deleteCourse: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/catalog/courses/${id}`, { method: "DELETE" }),

  // Documentos
  docCatalog: () => apiFetch<CatalogCategoryDto[]>("/admin/catalog/doc-catalog"),
  createCategory: (body: DocCategoryUpsertInput) =>
    apiFetch<CatalogCategoryDto>("/admin/catalog/categories", { method: "POST", body }),
  updateCategory: (id: string, body: DocCategoryUpsertInput) =>
    apiFetch<CatalogCategoryDto>(`/admin/catalog/categories/${id}`, { method: "PATCH", body }),
  deleteCategory: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/catalog/categories/${id}`, { method: "DELETE" }),
  createDocType: (body: DocTypeUpsertInput) =>
    apiFetch<CatalogDocTypeDto>("/admin/catalog/doc-types", { method: "POST", body }),
  updateDocType: (id: string, body: DocTypeUpsertInput) =>
    apiFetch<CatalogDocTypeDto>(`/admin/catalog/doc-types/${id}`, { method: "PATCH", body }),
  setDocTypeActive: (id: string, active: boolean) =>
    apiFetch<CatalogDocTypeDto>(`/admin/catalog/doc-types/${id}/active`, { method: "PATCH", body: { active } }),
  deleteDocType: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/catalog/doc-types/${id}`, { method: "DELETE" }),
  uploadTemplate: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<CatalogDocTypeDto>(`/admin/catalog/doc-types/${id}/template`, { method: "POST", body: fd });
  },
};

/** Manutenção da base (Configurações → Manutenção): preview + limpeza. Restrito a ADMIN. */
export const maintenanceApi = {
  summary: () => apiFetch<MaintenanceSummaryDto>("/admin/maintenance/summary"),
  reset: (confirmation: string) =>
    apiFetch<MaintenanceResetResult>("/admin/maintenance/reset", { method: "POST", body: { confirmation } }),
  syncDocMatrix: () =>
    apiFetch<DocMatrixSyncResult>("/admin/maintenance/sync-doc-matrix", { method: "POST" }),
  syncCourses: () =>
    apiFetch<CourseSyncResult>("/admin/maintenance/sync-courses", { method: "POST" }),
};

/** Ficha socioeconômica (autosave por seção + envio). */
export const socioApi = {
  get: (appId: string) => apiFetch<SocioFormDto>(`/applications/${appId}/socio-form`),
  patch: (appId: string, body: SocioFormInput) =>
    apiFetch<SocioFormDto>(`/applications/${appId}/socio-form`, { method: "PATCH", body }),
  submit: (appId: string) =>
    apiFetch<SocioFormDto>(`/applications/${appId}/socio-form/submit`, { method: "POST" }),
};
