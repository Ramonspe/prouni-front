import type {
  ApplicationDto,
  ApplicationEventDto,
  CampusDto,
  CourseDto,
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

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 401 && retry && auth) {
    const ok = await refreshAccess();
    if (ok) return apiFetch<T>(path, { ...opts, retry: false });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && (data.message as string)) || "Não foi possível completar a operação.";
    throw new ApiError(res.status, message, data?.issues);
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
  active: () => apiFetch("/cycles/active", { auth: false, retry: false }),
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

/** Ficha socioeconômica (autosave por seção + envio). */
export const socioApi = {
  get: (appId: string) => apiFetch<SocioFormDto>(`/applications/${appId}/socio-form`),
  patch: (appId: string, body: SocioFormInput) =>
    apiFetch<SocioFormDto>(`/applications/${appId}/socio-form`, { method: "PATCH", body }),
  submit: (appId: string) =>
    apiFetch<SocioFormDto>(`/applications/${appId}/socio-form/submit`, { method: "POST" }),
};
