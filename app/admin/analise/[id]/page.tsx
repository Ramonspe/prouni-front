"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ApplicationContextHeader } from "@/components/application-context-header";
import {
  Avatar,
  Badge,
  Banner,
  PriorityBadge,
  StatusBadge,
  Stepper,
  Timeline,
} from "@/components/ui";
import { SocioFormReview } from "@/components/socio-form-review";
import {
  IconAlert,
  IconCheck,
  IconChevL,
  IconClock,
  IconDownload,
  IconExternal,
  IconEye,
  IconHistory,
  IconRefresh,
  IconUndo,
  IconUpload,
  IconUser,
  IconX,
} from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { adminApi } from "@/lib/api";
import { composeBrasiliaInstant, formatBrasiliaDateTime } from "@/lib/brasilia-time";
import {
  DECISION_REASONS,
  PRESELECTION_CALLS,
  STATUS_MAP,
  type AdminDecisionInput,
  type AdminDocumentDto,
  type DocumentStatusDb,
  type PendingFormSection,
  type PendingRequestInput,
  type ProcessStatus,
} from "@prouni/shared";

/**
 * Etapa atual do stepper derivada dos FATOS da inscrição (não só do status):
 * aprovar/enviar documentos não muda o status, então usamos os artefatos reais
 * para refletir o progresso (0=Acesso, 1=Ficha, 2=Documentos, 3=Inscrição enviada,
 * 4=Análise, 5=Resultado), sem avançar por aprovações parciais.
 */
function deriveStep(d: {
  status: ProcessStatus;
  docTotals: { sent: number; approved: number };
  summary: { membersCount: number };
}): number {
  if (["classificado", "espera", "indeferido", "concedida"].includes(d.status))
    return 5;
  if (d.status === "analise_socio" || d.status === "analise_doc") return 4;
  if (d.status === "enviada") return 3;
  if (d.status === "pendencia" || d.docTotals.sent > 0) return 2;
  if (d.summary.membersCount > 0) return 1;
  return 0;
}
const DECISIONS: {
  id: AdminDecisionInput["decision"];
  label: string;
  tone: "success" | "warning" | "info" | "danger";
}[] = [
  { id: "CLASSIFICAR", label: "Classificar", tone: "success" },
  { id: "PENDENCIA", label: "Solicitar pendência", tone: "warning" },
  { id: "LISTA_ESPERA", label: "Lista de espera", tone: "info" },
  { id: "INDEFERIR", label: "Indeferir", tone: "danger" },
];
const toneVar = (t: string) =>
  t === "success"
    ? "green"
    : t === "warning"
      ? "amber"
      : t === "info"
        ? "blue"
        : "red";

function fmtMoney(v: string | null): string {
  if (v == null) return "—";
  const n = Number(v);
  return Number.isNaN(n)
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
/** Converte a vírgula decimal usada no Brasil para o formato enviado à API. */
function normalizeIncome(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.replace(",", ".");
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Informe a renda no formato 500,02 ou 500.02.");
  }
  return normalized;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function docVisual(status: DocumentStatusDb): {
  cls: string;
  tone: "success" | "warning" | "danger" | "neutral";
  label: string;
} {
  switch (status) {
    case "APROVADO":
      return { cls: "has-file", tone: "success", label: "Aprovado" };
    case "ENVIADO":
      return {
        cls: "has-pending",
        tone: "warning",
        label: "Enviado · em análise",
      };
    case "REPROVADO":
      return { cls: "has-rejected", tone: "danger", label: "Reprovado" };
    default:
      return { cls: "", tone: "neutral", label: "A enviar" };
  }
}
const PROFILE: Record<string, { tone: "success" | "warning"; label: string }> =
  {
    INTEGRAL: { tone: "success", label: "Integral elegível" },
    PARCIAL: { tone: "warning", label: "Parcial elegível" },
  };
const PENDING_FORM_SECTIONS: {
  value: PendingFormSection;
  label: string;
}[] = [
  { value: "STUDENT", label: "Dados do estudante" },
  { value: "FAMILY", label: "Grupo familiar" },
  { value: "HOUSING", label: "Moradia" },
  { value: "OTHER", label: "Rendas, despesas e bens" },
];

function documentPendingKey(document: AdminDocumentDto): string {
  return `${document.documentTypeId}:${document.familyMemberId ?? "application"}`;
}

export default function AnalysisPage() {
  const { user } = useRequireStaff();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["admin", "application", params.id],
    queryFn: () => adminApi.application(params.id),
    enabled: !!user && !!params.id,
    refetchInterval: 15_000,
  });
  const socioFormQuery = useQuery({
    queryKey: ["admin", "application", params.id, "socio-form"],
    queryFn: () => adminApi.socioForm(params.id),
    enabled: !!user && !!params.id && ["ADMIN", "ANALYST"].includes(user.role),
    refetchInterval: 15_000,
  });
  const analystsQuery = useQuery({
    queryKey: ["admin", "analysts"],
    queryFn: () => adminApi.analysts(),
    enabled: !!user,
  });
  const d = query.data;

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [parecer, setParecer] = useState("");
  const [decision, setDecision] = useState<AdminDecisionInput["decision"] | "">(
    "",
  );
  const [kind, setKind] = useState<"INTEGRAL" | "PARCIAL" | "">("");
  const [reason, setReason] = useState("");
  const [pendingDocumentKeys, setPendingDocumentKeys] = useState<string[]>([]);
  const [pendingSections, setPendingSections] = useState<
    PendingFormSection[]
  >([]);
  const [pendingDueDate, setPendingDueDate] = useState("");
  const [pendingDueTime, setPendingDueTime] = useState("");
  const [extensionDueDate, setExtensionDueDate] = useState("");
  const [extensionDueTime, setExtensionDueTime] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reopenDocumentKeys, setReopenDocumentKeys] = useState<string[]>([]);
  const [reopenSections, setReopenSections] = useState<PendingFormSection[]>([]);
  const [reopenDueDate, setReopenDueDate] = useState("");
  const [reopenDueTime, setReopenDueTime] = useState("");
  const [viewer, setViewer] = useState<{
    documentId: string;
    url: string;
    mime: string;
    fileName: string;
    status: DocumentStatusDb;
  } | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [grossIncome, setGrossIncome] = useState("");
  const [incomeNote, setIncomeNote] = useState("");

  // Ao trocar/abrir um documento, rola suavemente até o visualizador.
  useEffect(() => {
    if (viewer || viewerLoading)
      viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [viewer?.documentId, viewerLoading]);

  // Sincroniza o campo de renda apurada com o valor salvo (ao carregar/após salvar).
  useEffect(() => {
    setGrossIncome(query.data?.analystGrossIncome ?? "");
    setIncomeNote(query.data?.analystIncomeNote ?? "");
  }, [query.data?.analystGrossIncome, query.data?.analystIncomeNote]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "application", params.id] });
    qc.invalidateQueries({ queryKey: ["admin", "applications"] });
  };

  const reviewMut = useMutation({
    mutationFn: (v: {
      documentId: string;
      decision: "APROVADO" | "REPROVADO";
      comment?: string;
    }) =>
      adminApi.reviewDocument(v.documentId, {
        decision: v.decision,
        comment: v.comment,
      }),
    onSuccess: () => {
      invalidate();
      setRejectId(null);
      setRejectComment("");
    },
  });
  const undoReviewMut = useMutation({
    mutationFn: (documentId: string) => adminApi.undoDocumentReview(documentId),
    onSuccess: () => {
      invalidate();
      setViewer((current) =>
        current ? { ...current, status: "ENVIADO" } : current,
      );
    },
  });
  const assignMut = useMutation({
    mutationFn: (analystId: string | null) =>
      adminApi.assignAnalyst(params.id, analystId),
    onSuccess: invalidate,
  });
  const decideMut = useMutation({
    mutationFn: (body: AdminDecisionInput) => adminApi.decide(params.id, body),
    onSuccess: () => {
      invalidate();
      setParecer("");
      setDecision("");
      setKind("");
      setReason("");
      setPendingDocumentKeys([]);
      setPendingSections([]);
      setPendingDueDate("");
      setPendingDueTime("");
    },
  });
  const startMut = useMutation({
    mutationFn: () => adminApi.startAnalysis(params.id),
    onSuccess: invalidate,
  });
  const extendPendingMut = useMutation({
    mutationFn: (input: {
      requestId: string;
      dueAt: string;
      reason: string;
    }) =>
      adminApi.extendPending(params.id, input.requestId, {
        dueAt: input.dueAt,
        reason: input.reason,
      }),
    onSuccess: () => {
      invalidate();
      setExtensionDueDate("");
      setExtensionDueTime("");
      setExtensionReason("");
    },
  });
  const reopenPendingMut = useMutation({
    mutationFn: (input: PendingRequestInput) =>
      adminApi.reopenPending(params.id, input),
    onSuccess: () => {
      invalidate();
      setReopenReason("");
      setReopenDocumentKeys([]);
      setReopenSections([]);
      setReopenDueDate("");
      setReopenDueTime("");
    },
  });
  const exportRmMut = useMutation({
    mutationFn: () => adminApi.exportToRm(params.id),
    onSuccess: invalidate,
  });
  const revertRmMut = useMutation({
    mutationFn: () => adminApi.revertRm(params.id),
    onSuccess: () => {
      exportRmMut.reset();
      invalidate();
    },
  });
  const incomeMut = useMutation({
    mutationFn: () =>
      adminApi.setIncome(params.id, {
        grossIncome: normalizeIncome(grossIncome),
        note: incomeNote.trim() || null,
      }),
    onSuccess: invalidate,
  });

  async function loadViewer(doc: AdminDocumentDto) {
    if (!doc.documentId) return;
    setViewerLoading(true);
    try {
      const { url, mime } = await adminApi.documentFile(doc.documentId);
      setViewer((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return {
          documentId: doc.documentId!,
          url,
          mime,
          fileName: doc.fileName ?? "documento",
          status: doc.status,
        };
      });
    } catch {
      alert("Não foi possível abrir o arquivo.");
    } finally {
      setViewerLoading(false);
    }
  }

  if (query.isLoading || !user) {
    return (
      <AppShell
        role="admin"
        crumbs={["PROUNI · Admin", "Candidatos", "Análise"]}
      >
        <div className="content fade-in">
          <div className="card card-pad muted">Carregando inscrição…</div>
        </div>
      </AppShell>
    );
  }
  if (query.isError || !d) {
    return (
      <AppShell
        role="admin"
        crumbs={["PROUNI · Admin", "Candidatos", "Análise"]}
      >
        <div className="content fade-in">
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 12 }}
            onClick={() => router.push("/admin/candidatos")}
          >
            <IconChevL size={13} /> Voltar à fila
          </button>
          <Banner tone="warn" title="Inscrição não encontrada">
            Não foi possível carregar esta inscrição.
          </Banner>
        </div>
      </AppShell>
    );
  }

  const profile = d.summary.profile ? PROFILE[d.summary.profile] : null;
  const busy =
    reviewMut.isPending ||
    undoReviewMut.isPending ||
    decideMut.isPending ||
    assignMut.isPending ||
    startMut.isPending ||
    extendPendingMut.isPending ||
    reopenPendingMut.isPending;
  const canRefresh = user.role === "ADMIN" || user.role === "ANALYST";
  const reviewableStatus = [
    "analise_doc",
    "analise_socio",
  ].includes(d.status);
  const pendingCorrection = d.status === "pendencia";
  const assignedAnalystId =
    analystsQuery.data?.find((analyst) => analyst.name === d.analyst)?.id ?? null;
  const canStartAnalysis =
    d.status === "enviada" && assignedAnalystId === user.id;
  const canPerformAnalystActions =
    reviewableStatus && assignedAnalystId === user.id;
  const canManagePending =
    user.role === "ADMIN" || assignedAnalystId === user.id;
  const reviewBlockedMessage = pendingCorrection
      ? "A inscrição está aguardando a correção do candidato. A revisão documental e a atribuição de analista serão liberadas após o reenvio."
      : !assignedAnalystId
      ? "Atribua um analista responsável antes de aprovar ou reprovar documentos."
      : d.status === "enviada"
        ? canStartAnalysis
          ? "Confirme a atribuição para iniciar a análise e liberar a revisão dos documentos."
          : "Aguardando o analista responsável confirmar o início da análise."
        : !reviewableStatus
          ? "A inscrição precisa estar em análise documental para permitir a revisão dos documentos."
      : assignedAnalystId !== user.id
        ? `A aprovação ou reprovação é exclusiva do analista responsável${d.analyst ? `: ${d.analyst}.` : "."}`
        : null;
  const canReviewDocuments = !reviewBlockedMessage;

  // Renda bruta total = (declarada + outras). Se a equipe ajustou (uso interno),
  // exibe o valor ajustado com o histórico completo das alterações no tooltip.
  const incomeHistory = d.incomeHistory ?? [];
  const incomeAdjusted = incomeHistory.length > 0;
  const rendaBrutaTotal = incomeAdjusted
    ? (d.analystGrossIncome ?? d.summary.totalIncome)
    : d.summary.totalIncome;
  const incomeHistoryTitle = incomeAdjusted
    ? "Ajustes da Renda bruta total (uso interno) — mais antigo → mais recente:\n" +
      incomeHistory
        .map(
          (h) =>
            `• ${new Date(h.at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} — ${h.by ?? "equipe"}: ${fmtMoney(h.previous ?? d.summary.totalIncome)} → ${fmtMoney(h.value)}${h.note ? ` (${h.note})` : ""}`,
        )
        .join("\n") +
      `\n\nValor automático (declarada + outras): ${fmtMoney(d.summary.totalIncome)}`
    : "";
  const rejectedDocuments = d.documents.filter(
    (document) => document.status === "REPROVADO",
  );

  // Agrupa os documentos por integrante do grupo familiar (item da reunião:
  // facilita conferir uma pessoa por vez). Documentos da inscrição (sem membro)
  // vêm primeiro; dentro de cada grupo, ordena por prioridade de análise:
  // ENVIADO (a revisar) → REPROVADO → A_ENVIAR (faltando) → APROVADO (no fim).
  const DOC_STATUS_ORDER: Record<DocumentStatusDb, number> = {
    ENVIADO: 0,
    REPROVADO: 1,
    A_ENVIAR: 2,
    APROVADO: 3,
  };
  const APP_DOC_KEY = "__app__";
  const documentGroups = (() => {
    const map = new Map<
      string,
      { key: string; label: string; sub: string | null; docs: AdminDocumentDto[] }
    >();
    map.set(APP_DOC_KEY, {
      key: APP_DOC_KEY,
      label: "Documentos da inscrição",
      sub: null,
      docs: [],
    });
    for (const member of d.family) {
      map.set(member.id, {
        key: member.id,
        label: member.fullName,
        sub: member.relationship,
        docs: [],
      });
    }
    for (const doc of d.documents) {
      const key = doc.familyMemberId ?? APP_DOC_KEY;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: doc.memberName ?? "Outros",
          sub: null,
          docs: [],
        });
      }
      map.get(key)!.docs.push(doc);
    }
    return Array.from(map.values())
      .filter((group) => group.docs.length > 0)
      .map((group) => ({
        ...group,
        docs: [...group.docs].sort(
          (a, b) => DOC_STATUS_ORDER[a.status] - DOC_STATUS_ORDER[b.status],
        ),
        toReview: group.docs.filter((x) => x.status === "ENVIADO").length,
      }));
  })();
  const selectedPendingDocuments = rejectedDocuments.filter((document) =>
    pendingDocumentKeys.includes(documentPendingKey(document)),
  );
  const selectedReopenDocuments = rejectedDocuments.filter((document) =>
    reopenDocumentKeys.includes(documentPendingKey(document)),
  );
  const pendingItemsCount =
    selectedPendingDocuments.length + pendingSections.length;
  const pendingDeadlineComplete =
    (!pendingDueDate && !pendingDueTime) ||
    Boolean(pendingDueDate && pendingDueTime);
  const reopenItemsCount =
    selectedReopenDocuments.length + reopenSections.length;
  const callLabel =
    d.selectionCall?.name ??
    PRESELECTION_CALLS.find((call) => call.value === d.call)?.label ??
    d.call;

  return (
    <AppShell
      role="admin"
      crumbs={["PROUNI · Admin", "Candidatos", `Análise · ${d.name}`]}
    >
      <div
        className="content fade-in"
        style={{ maxWidth: "none", padding: 22 }}
      >
        <div style={{ marginBottom: 16 }}>
          <ApplicationContextHeader
            eyebrow="Inscrição em análise"
            title={d.name}
            cycleLabel={d.cycle.label}
            callLabel={callLabel}
            courseName={d.course}
            campusName={d.campus}
            protocol={d.protocol}
            statusLabel={STATUS_MAP[d.status].label}
          />
        </div>

        {/* Cabeçalho */}
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.push("/admin/candidatos")}
            >
              <IconChevL size={13} /> Voltar à fila
            </button>
            {canRefresh && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
              >
                <IconRefresh size={13} />{" "}
                {query.isFetching ? "Atualizando…" : "Atualizar"}
              </button>
            )}
            <Avatar name={d.name} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--ink-900)",
                  }}
                >
                  {d.name}
                </h2>
                <StatusBadge status={d.status} />
                <PriorityBadge priority={d.priority} />
                {d.optsForQuota && (
                  <Badge tone="info" dot={false}>
                    Optante por cota racial
                  </Badge>
                )}
              </div>
              <div className="muted small" style={{ marginTop: 2 }}>
                <span className="mono">{d.protocol}</span> · CPF{" "}
                <span className="mono">{d.cpf}</span> · {d.course}
                {d.campus ? ` · ${d.campus}` : ""} · inscrição{" "}
                {fmtWhen(d.createdAt)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Stepper
              steps={[
                "Acesso",
                "Ficha",
                "Documentos",
                "Inscrição enviada",
                "Análise",
                "Resultado",
              ]}
              current={deriveStep(d)}
            />
          </div>
        </div>

        {d.openPendingRequest && (
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <Banner tone="warn" title="Pendência aberta para esta inscrição">
              Prazo até{" "}
              <strong>
                {formatBrasiliaDateTime(d.openPendingRequest.dueAt, {
                  includeTimeZone: true,
                })}
              </strong>
              . Itens solicitados:{" "}
              {d.openPendingRequest.items
                .map((item) => item.label)
                .join("; ")}
              .
            </Banner>
            <div style={{ marginTop: 14 }}>
              <h3 className="h-card-title">Prorrogar prazo da pendência</h3>
              <p className="muted small" style={{ margin: "5px 0 10px" }}>
                A prorrogação mantém os mesmos itens e registra a justificativa
                na trilha de auditoria. O novo prazo deve ser posterior ao atual.
              </p>
              <div
                className="rgrid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <label className="field">
                  <span className="field-label">Nova data-limite</span>
                  <input
                    className="input"
                    type="date"
                    value={extensionDueDate}
                    disabled={!canManagePending || extendPendingMut.isPending}
                    onChange={(event) =>
                      setExtensionDueDate(event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">Horário de Brasília</span>
                  <input
                    className="input"
                    type="time"
                    value={extensionDueTime}
                    disabled={!canManagePending || extendPendingMut.isPending}
                    onChange={(event) =>
                      setExtensionDueTime(event.target.value)
                    }
                  />
                </label>
              </div>
              <label className="field" style={{ marginTop: 8 }}>
                <span className="field-label">
                  Justificativa da prorrogação
                </span>
                <textarea
                  className="input"
                  rows={2}
                  maxLength={1000}
                  value={extensionReason}
                  disabled={!canManagePending || extendPendingMut.isPending}
                  onChange={(event) => setExtensionReason(event.target.value)}
                />
              </label>
              {!canManagePending && (
                <p className="muted small" style={{ marginTop: 7 }}>
                  Somente o analista responsável ou um administrador pode
                  prorrogar esta pendência.
                </p>
              )}
              {extendPendingMut.isError && (
                <p className="upload-meta error" style={{ marginTop: 7 }}>
                  {(extendPendingMut.error as Error).message}
                </p>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 9 }}
                disabled={
                  !canManagePending ||
                  extendPendingMut.isPending ||
                  !extensionDueDate ||
                  !extensionDueTime ||
                  !extensionReason.trim()
                }
                onClick={() =>
                  extendPendingMut.mutate({
                    requestId: d.openPendingRequest!.id,
                    dueAt: composeBrasiliaInstant(
                      extensionDueDate,
                      extensionDueTime,
                    ),
                    reason: extensionReason.trim(),
                  })
                }
              >
                <IconClock size={14} />{" "}
                {extendPendingMut.isPending
                  ? "Prorrogando…"
                  : "Prorrogar prazo"}
              </button>
            </div>
          </div>
        )}

        {d.status === "indeferido" && (
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3 className="h-card-title">
              Reabrir decisão final como pendência
            </h3>
            <p className="muted small" style={{ margin: "5px 0 12px" }}>
              Use somente quando houver autorização formal para corrigir um
              indeferimento. A decisão anterior permanece no histórico e uma
              nova solicitação delimitada é criada.
            </p>
            <label className="field">
              <span className="field-label">Motivo formal da reabertura</span>
              <textarea
                className="input"
                rows={3}
                maxLength={2000}
                value={reopenReason}
                disabled={!canManagePending || reopenPendingMut.isPending}
                onChange={(event) => setReopenReason(event.target.value)}
              />
            </label>
            {rejectedDocuments.length > 0 && (
              <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
                <span className="field-label">
                  Documentos liberados para correção
                </span>
                {rejectedDocuments.map((document) => {
                  const key = documentPendingKey(document);
                  return (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        fontSize: 12.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={reopenDocumentKeys.includes(key)}
                        disabled={
                          !canManagePending || reopenPendingMut.isPending
                        }
                        onChange={(event) =>
                          setReopenDocumentKeys((current) =>
                            event.target.checked
                              ? [...new Set([...current, key])]
                              : current.filter((candidate) => candidate !== key),
                          )
                        }
                      />
                      <span>
                        {document.name}
                        {document.memberName
                          ? ` — ${document.memberName}`
                          : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
              <span className="field-label">
                Seções da ficha liberadas para correção
              </span>
              {PENDING_FORM_SECTIONS.map((section) => (
                <label
                  key={section.value}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    fontSize: 12.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={reopenSections.includes(section.value)}
                    disabled={!canManagePending || reopenPendingMut.isPending}
                    onChange={(event) =>
                      setReopenSections((current) =>
                        event.target.checked
                          ? [...new Set([...current, section.value])]
                          : current.filter(
                              (candidate) => candidate !== section.value,
                            ),
                      )
                    }
                  />
                  <span>Ficha · {section.label}</span>
                </label>
              ))}
            </div>
            <div
              className="rgrid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 12,
              }}
            >
              <label className="field">
                <span className="field-label">Nova data-limite</span>
                <input
                  className="input"
                  type="date"
                  value={reopenDueDate}
                  disabled={!canManagePending || reopenPendingMut.isPending}
                  onChange={(event) => setReopenDueDate(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">Horário de Brasília</span>
                <input
                  className="input"
                  type="time"
                  value={reopenDueTime}
                  disabled={!canManagePending || reopenPendingMut.isPending}
                  onChange={(event) => setReopenDueTime(event.target.value)}
                />
              </label>
            </div>
            {!canManagePending && (
              <p className="muted small" style={{ marginTop: 7 }}>
                Somente o analista responsável ou um administrador pode
                executar a reabertura formal.
              </p>
            )}
            {reopenPendingMut.isError && (
              <p className="upload-meta error" style={{ marginTop: 7 }}>
                {(reopenPendingMut.error as Error).message}
              </p>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 10 }}
              disabled={
                !canManagePending ||
                reopenPendingMut.isPending ||
                !reopenReason.trim() ||
                !reopenDueDate ||
                !reopenDueTime ||
                reopenItemsCount === 0
              }
              onClick={() => {
                const items: PendingRequestInput["items"] = [
                  ...selectedReopenDocuments.map((document) => ({
                    kind: "DOCUMENT" as const,
                    documentTypeId: document.documentTypeId,
                    familyMemberId: document.familyMemberId,
                    label: document.memberName
                      ? `${document.name} — ${document.memberName}`
                      : document.name,
                  })),
                  ...reopenSections.map((formSection) => ({
                    kind: "FORM_SECTION" as const,
                    formSection,
                    label:
                      PENDING_FORM_SECTIONS.find(
                        (section) => section.value === formSection,
                      )?.label ?? formSection,
                  })),
                ];
                reopenPendingMut.mutate({
                  reason: reopenReason.trim(),
                  dueAt: composeBrasiliaInstant(
                    reopenDueDate,
                    reopenDueTime,
                  ),
                  items,
                });
              }}
            >
              <IconRefresh size={14} />{" "}
              {reopenPendingMut.isPending
                ? "Reabrindo…"
                : "Reabrir como pendência"}
            </button>
          </div>
        )}

        <div className="split">
          {/* Esquerda */}
          <div>
            {(viewer || viewerLoading) && (
              <div
                ref={viewerRef}
                className="card"
                style={{
                  marginBottom: 14,
                  padding: 0,
                  overflow: "hidden",
                  scrollMarginTop: 80,
                }}
              >
                <div className="viewer">
                  <div className="viewer-toolbar">
                    {viewer && (
                      <>
                        <a
                          className="btn btn-ghost btn-sm"
                          href={viewer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternal size={13} /> Abrir em nova aba
                        </a>
                        <a
                          className="btn btn-ghost btn-sm"
                          href={viewer.url}
                          download={viewer.fileName}
                        >
                          <IconDownload size={13} /> Baixar
                        </a>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            URL.revokeObjectURL(viewer.url);
                            setViewer(null);
                          }}
                        >
                          <IconX size={13} /> Fechar
                        </button>
                        {canReviewDocuments && viewer.status === "ENVIADO" && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={busy}
                              onClick={() =>
                                reviewMut.mutate(
                                  {
                                    documentId: viewer.documentId,
                                    decision: "APROVADO",
                                  },
                                  {
                                    onSuccess: () =>
                                      setViewer((prev) =>
                                        prev
                                          ? { ...prev, status: "APROVADO" }
                                          : prev,
                                      ),
                                  },
                                )
                              }
                            >
                              <IconCheck size={13} /> Aprovar
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={busy}
                              onClick={() => {
                                setRejectId(viewer.documentId);
                                setRejectComment("");
                              }}
                            >
                              <IconAlert size={13} /> Reprovar
                            </button>
                          </>
                        )}
                        {canReviewDocuments &&
                          (viewer.status === "APROVADO" ||
                            viewer.status === "REPROVADO") && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "4px 7px" }}
                              disabled={busy}
                              title="Desfazer decisão e voltar o documento para enviado"
                              aria-label="Desfazer decisão do documento"
                              onClick={() =>
                                undoReviewMut.mutate(viewer.documentId)
                              }
                            >
                              <IconUndo size={14} />
                            </button>
                          )}
                      </>
                    )}
                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "var(--ink-500)",
                        fontSize: 12,
                      }}
                    >
                      {viewer && (
                        <>
                          <span className="mono">{viewer.fileName}</span>
                          <Badge tone={docVisual(viewer.status).tone}>
                            {docVisual(viewer.status).label}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {viewer && rejectId === viewer.documentId && (
                    <div
                      style={{
                        padding: 12,
                        background: "var(--ink-50)",
                        borderBottom: "1px solid var(--ink-150)",
                      }}
                    >
                      <div className="field-label" style={{ marginBottom: 6 }}>
                        Motivo da reprovação (vai para o candidato)
                      </div>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Ex.: imagem ilegível, documento incompleto…"
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={busy || !rejectComment.trim()}
                          onClick={() =>
                            reviewMut.mutate(
                              {
                                documentId: viewer.documentId,
                                decision: "REPROVADO",
                                comment: rejectComment.trim(),
                              },
                              {
                                onSuccess: () =>
                                  setViewer((prev) =>
                                    prev
                                      ? { ...prev, status: "REPROVADO" }
                                      : prev,
                                  ),
                              },
                            )
                          }
                        >
                          Confirmar reprovação
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setRejectId(null)}
                        >
                          <IconX size={12} /> Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="viewer-body" style={{ padding: 0 }}>
                    {viewerLoading ? (
                      <div className="muted small" style={{ padding: 28 }}>
                        Carregando documento…
                      </div>
                    ) : viewer && viewer.mime.startsWith("image/") ? (
                      <img
                        src={viewer.url}
                        alt={viewer.fileName}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 600,
                          objectFit: "contain",
                        }}
                      />
                    ) : viewer ? (
                      <iframe
                        src={viewer.url}
                        title={viewer.fileName}
                        style={{
                          width: "100%",
                          height: 600,
                          border: "none",
                          background: "#fff",
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-header">
                <h3 className="h-card-title">Documentos enviados</h3>
                <span className="muted small" style={{ marginLeft: "auto" }}>
                  {d.docTotals.approved} aprovados · {d.docTotals.sent} enviados
                  · {d.docTotals.required} exigidos
                </span>
              </div>
              <div style={{ padding: 14 }}>
                <Banner
                  tone={reviewBlockedMessage ? "warn" : "info"}
                  title="Regra da revisão documental"
                >
                  {reviewBlockedMessage ??
                    "Você é o analista responsável desta inscrição e pode aprovar ou reprovar os documentos."}
                </Banner>
                {d.documents.length === 0 ? (
                  <div className="muted small" style={{ marginTop: 12 }}>
                    Nenhum documento enviado até o momento.
                  </div>
                ) : (
                  documentGroups.map((group) => (
                    <div key={group.key} style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 2px 4px",
                          borderBottom: "1px solid var(--ink-150)",
                          margin: "2px 0 6px",
                        }}
                      >
                        <IconUser size={13} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {group.label}
                        </span>
                        {group.sub && (
                          <span className="muted small">· {group.sub}</span>
                        )}
                        {group.toReview > 0 && (
                          <span style={{ marginLeft: "auto" }}>
                            <Badge tone="warning">
                              {group.toReview} a revisar
                            </Badge>
                          </span>
                        )}
                      </div>
                      {group.docs.map((doc: AdminDocumentDto, i) => {
                      const v = docVisual(doc.status);
                      const hasFile =
                        doc.status !== "A_ENVIAR" && !!doc.documentId;
                      return (
                        <div
                          key={doc.documentId ?? `${doc.documentTypeId}-${i}`}
                        >
                          <div
                            className={`upload-row ${v.cls}`}
                            style={{ cursor: "default" }}
                          >
                            <div className="upload-icon">
                              {doc.status === "APROVADO" ? (
                                <IconCheck size={17} stroke={2.4} />
                              ) : doc.status === "REPROVADO" ? (
                                <IconAlert size={16} />
                              ) : (
                                <IconUpload size={16} />
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div className="upload-title">{doc.name}</div>
                              <div
                                className="upload-meta"
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {doc.memberName ? (
                                  <>
                                    <IconUser size={11} /> {doc.memberName}{" "}
                                    ·{" "}
                                  </>
                                ) : null}
                                {doc.category}
                                {doc.fileName ? ` · ${doc.fileName}` : ""}
                              </div>
                              {doc.reviewComment && (
                                <div className="upload-meta error">
                                  {doc.reviewComment}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Badge tone={v.tone}>{v.label}</Badge>
                              {hasFile && (
                                <>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={viewerLoading}
                                    onClick={() => loadViewer(doc)}
                                  >
                                    <IconEye size={13} /> Ver
                                  </button>
                                  {canReviewDocuments && doc.status === "ENVIADO" && (
                                    <>
                                      <button
                                        className="btn btn-ghost btn-sm"
                                        disabled={busy}
                                        onClick={() =>
                                          reviewMut.mutate({
                                            documentId: doc.documentId!,
                                            decision: "APROVADO",
                                          })
                                        }
                                      >
                                        Aprovar
                                      </button>
                                      <button
                                        className="btn btn-ghost btn-sm"
                                        disabled={busy}
                                        onClick={() => {
                                          setRejectId(doc.documentId!);
                                          setRejectComment("");
                                        }}
                                      >
                                        Reprovar
                                      </button>
                                    </>
                                  )}
                                  {canReviewDocuments &&
                                    (doc.status === "APROVADO" ||
                                      doc.status === "REPROVADO") && (
                                      <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: "4px 7px" }}
                                        disabled={busy}
                                        title="Desfazer decisão e voltar o documento para enviado"
                                        aria-label={`Desfazer decisão de ${doc.name}`}
                                        onClick={() =>
                                          undoReviewMut.mutate(
                                            doc.documentId!,
                                          )
                                        }
                                      >
                                        <IconUndo size={14} />
                                      </button>
                                    )}
                                </>
                              )}
                            </div>
                          </div>
                          {rejectId === doc.documentId && (
                            <div
                              className="card-pad"
                              style={{
                                background: "var(--ink-50)",
                                borderRadius: 8,
                                margin: "4px 0 10px",
                                padding: 12,
                              }}
                            >
                              <div
                                className="field-label"
                                style={{ marginBottom: 6 }}
                              >
                                Motivo da reprovação (vai para o candidato)
                              </div>
                              <textarea
                                className="textarea"
                                rows={2}
                                value={rejectComment}
                                onChange={(e) =>
                                  setRejectComment(e.target.value)
                                }
                                placeholder="Ex.: imagem ilegível, documento incompleto…"
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 8,
                                }}
                              >
                                <button
                                  className="btn btn-secondary btn-sm"
                                  disabled={busy || !rejectComment.trim()}
                                  onClick={() =>
                                    reviewMut.mutate({
                                      documentId: doc.documentId!,
                                      decision: "REPROVADO",
                                      comment: rejectComment.trim(),
                                    })
                                  }
                                >
                                  Confirmar reprovação
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setRejectId(null)}
                                >
                                  <IconX size={12} /> Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  ))
                )}
                {reviewMut.isError && (
                  <p className="upload-meta error" style={{ marginTop: 8 }}>
                    {(reviewMut.error as Error).message}
                  </p>
                )}
              </div>
            </div>

            {["ADMIN", "ANALYST"].includes(user.role) && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`/admin/analise/${params.id}/documentos/imprimir`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconDownload size={13} /> Imprimir lista de documentos
                  </a>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={`/admin/analise/${params.id}/ficha/imprimir`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconDownload size={13} /> Imprimir ficha
                  </a>
                </div>
                <SocioFormReview socioForm={socioFormQuery.data ?? null} />
              </>
            )}

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Grupo familiar</h3>
                <span className="muted small" style={{ marginLeft: "auto" }}>
                  {d.family.length} integrante(s)
                </span>
              </div>
              <div style={{ padding: 14 }}>
                {d.family.length === 0 ? (
                  <div className="muted small">
                    Grupo familiar ainda não preenchido.
                  </div>
                ) : (
                  d.family.map((m) => (
                    <div
                      key={m.id}
                      className="upload-row"
                      style={{ cursor: "default" }}
                    >
                      <div className="upload-icon">
                        <IconUser size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="upload-title">
                          {m.fullName}{" "}
                          {m.isStudent && (
                            <span className="muted small">· estudante</span>
                          )}
                        </div>
                        <div className="upload-meta">
                          {m.relationship}
                          {m.age != null ? ` · ${m.age} anos` : ""}
                          {m.occupation ? ` · ${m.occupation}` : ""}
                          {m.incomeSituations.length > 0
                            ? ` · ${m.incomeSituations.join(", ")}`
                            : ""}
                        </div>
                      </div>
                      <span
                        className="mono small"
                        style={{ color: "var(--ink-700)" }}
                      >
                        {fmtMoney(m.grossIncome)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Direita */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              position: "sticky",
              top: 80,
            }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Analista responsável</h3>
              </div>
              <div className="card-body">
                <select
                  className="input"
                  value={assignedAnalystId ?? ""}
                  disabled={busy || user.role === "VIEWER" || pendingCorrection}
                  onChange={(e) => assignMut.mutate(e.target.value || null)}
                >
                  <option value="">Não atribuído</option>
                  {(analystsQuery.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {user.role === "VIEWER" && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Visualizadores não podem alterar o responsável.
                  </p>
                )}
                {pendingCorrection && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    A atribuição fica bloqueada até o candidato concluir a correção.
                  </p>
                )}
                {canStartAnalysis && (
                  <button
                    className="btn btn-primary btn-block"
                    style={{ marginTop: 10 }}
                    disabled={busy}
                    onClick={() => startMut.mutate()}
                  >
                    {startMut.isPending
                      ? "Confirmando…"
                      : "Confirmar e iniciar análise"}
                  </button>
                )}
                {assignMut.isError && (
                  <p className="upload-meta error" style={{ marginTop: 6 }}>
                    {(assignMut.error as Error).message}
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Resumo socioeconômico</h3>
              </div>
              <div className="card-body">
                {(
                  [
                    [
                      "Grupo familiar",
                      `${d.summary.membersCount} integrante(s)`,
                    ],
                    ["Renda bruta declarada", fmtMoney(d.summary.grossIncome)],
                    ["Outras rendas", fmtMoney(d.summary.otherIncome)],
                  ] as [string, string][]
                ).map(([l, v], i) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderTop: i ? "1px solid var(--ink-150)" : "none",
                      fontSize: 13,
                    }}
                  >
                    <span className="muted">{l}</span>
                    <span
                      className="mono"
                      style={{ color: "var(--ink-900)", fontWeight: 500 }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                {/* Renda bruta total = declarada + outras. Exibe o valor ajustado
                    pela equipe (uso interno), se houver, com o histórico no tooltip. */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderTop: "1px solid var(--ink-150)",
                    fontSize: 13,
                    alignItems: "center",
                  }}
                >
                  <span className="muted">Renda bruta total</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {incomeAdjusted && (
                      <span
                        title={incomeHistoryTitle}
                        aria-label="Histórico de ajustes da renda bruta total"
                        style={{
                          display: "inline-flex",
                          cursor: "help",
                          color: "var(--blue-700)",
                        }}
                      >
                        <IconHistory size={14} />
                      </span>
                    )}
                    <span
                      className="mono"
                      style={{
                        color: "var(--ink-900)",
                        fontWeight: incomeAdjusted ? 700 : 500,
                      }}
                    >
                      {fmtMoney(rendaBrutaTotal)}
                    </span>
                  </span>
                </div>
                {(
                  [
                    ["Despesas totais", fmtMoney(d.summary.totalExpenses)],
                    ["Renda per capita", fmtMoney(d.summary.perCapita)],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderTop: "1px solid var(--ink-150)",
                      fontSize: 13,
                    }}
                  >
                    <span className="muted">{l}</span>
                    <span
                      className="mono"
                      style={{ color: "var(--ink-900)", fontWeight: 500 }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                {d.summary.incomeBasis === "ADJUSTED" && (
                  <div
                    className="muted small"
                    style={{ padding: "2px 0 6px", textAlign: "right" }}
                  >
                    Per capita e perfil calculados sobre a renda ajustada (
                    {fmtMoney(
                      d.summary.adjustedTotalIncome ?? d.summary.totalIncome,
                    )}
                    ).
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "9px 0",
                    borderTop: "1px solid var(--ink-150)",
                    fontSize: 13,
                    alignItems: "center",
                  }}
                >
                  <span className="muted">Perfil PROUNI</span>
                  {profile ? (
                    <Badge tone={profile.tone}>{profile.label}</Badge>
                  ) : (
                    <span className="muted small">A calcular</span>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">
                  Ajustar Renda bruta total · uso interno
                </h3>
              </div>
              <div className="card-body">
                <Banner tone="info" title="Visível apenas para a equipe">
                  Ajuste a <strong>Renda bruta total</strong> após a análise
                  documental (correções, exclusão de rendimentos não
                  computáveis). Fica registrado no histórico e nunca é exibido
                  ao candidato.
                </Banner>
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">
                    Renda bruta total ajustada (R$)
                  </label>
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="ex.: 3500,00"
                  value={grossIncome}
                  disabled={!canPerformAnalystActions}
                    onChange={(e) => setGrossIncome(e.target.value)}
                  />
                </div>
                {d.summary.membersCount > 0 && (
                  <div className="muted small" style={{ marginTop: 6 }}>
                    Valor automático (declarada + outras):{" "}
                    <span
                      className="mono"
                      style={{ color: "var(--ink-900)", fontWeight: 600 }}
                    >
                      {fmtMoney(d.summary.totalIncome)}
                    </span>
                    . Ao informar um ajuste, a renda per capita e o perfil
                    PROUNI passam a ser recalculados por este valor.
                  </div>
                )}
                <div className="field" style={{ marginTop: 10 }}>
                  <label className="field-label">Justificativa do ajuste</label>
                  <textarea
                    className="textarea"
                    rows={3}
                  value={incomeNote}
                  disabled={!canPerformAnalystActions}
                    onChange={(e) => setIncomeNote(e.target.value)}
                    placeholder="Ex.: excluído rendimento eventual não computável; correção de holerite…"
                  />
                </div>
                {incomeMut.isError && (
                  <p className="upload-meta error" style={{ marginTop: 8 }}>
                    {(incomeMut.error as Error).message}
                  </p>
                )}
                {incomeMut.isSuccess && (
                  <p
                    className="upload-meta"
                    style={{ marginTop: 8, color: "var(--green-700)" }}
                  >
                    Renda bruta total atualizada.
                  </p>
                )}
                <button
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: 10 }}
                  disabled={!canPerformAnalystActions || incomeMut.isPending}
                  onClick={() => incomeMut.mutate()}
                >
                  {incomeMut.isPending ? "Salvando…" : "Salvar ajuste"}
                </button>
                {incomeAdjusted && (
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid var(--ink-150)",
                      paddingTop: 10,
                    }}
                  >
                    <div className="field-label" style={{ marginBottom: 6 }}>
                      Histórico de ajustes
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      {incomeHistory.map((h, i) => (
                        <li
                          key={i}
                          className="small"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span className="muted">
                            {new Date(h.at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {h.by ? ` · ${h.by}` : ""}
                            {h.note ? ` — ${h.note}` : ""}
                          </span>
                          <span
                            className="mono"
                            style={{
                              whiteSpace: "nowrap",
                              color: "var(--ink-900)",
                            }}
                          >
                            {fmtMoney(h.previous ?? d.summary.totalIncome)} →{" "}
                            {fmtMoney(h.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Parecer e decisão</h3>
              </div>
              <div className="card-body">
                <textarea
                  className="textarea"
                  rows={5}
                  value={parecer}
                  disabled={!canPerformAnalystActions}
                  onChange={(e) => setParecer(e.target.value)}
                  placeholder="Parecer do analista…"
                />
                <div className="muted small" style={{ marginTop: 6 }}>
                  Visível apenas para a equipe. Auditável no histórico.
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="field-label" style={{ marginBottom: 6 }}>
                    Decisão
                  </div>
                  <div
                    className="rgrid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {DECISIONS.map((dec) => {
                      const c = toneVar(dec.tone);
                      const on = decision === dec.id;
                      return (
                        <button
                          key={dec.id}
                          className="btn btn-ghost"
                          disabled={!canPerformAnalystActions}
                          onClick={() => {
                            setDecision(dec.id);
                            if (
                              dec.id === "PENDENCIA" &&
                              pendingDocumentKeys.length === 0 &&
                              pendingSections.length === 0
                            ) {
                              setPendingDocumentKeys(
                                rejectedDocuments.map(documentPendingKey),
                              );
                            }
                          }}
                          style={{
                            justifyContent: "center",
                            borderColor: on ? `var(--${c}-600)` : undefined,
                            background: on ? `var(--${c}-100)` : undefined,
                            color: on ? `var(--${c}-700)` : undefined,
                            fontWeight: on ? 600 : 500,
                          }}
                        >
                          {dec.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {decision === "CLASSIFICAR" && (
                  <div style={{ marginTop: 12 }}>
                    <div className="field-label" style={{ marginBottom: 6 }}>
                      Tipo de bolsa
                    </div>
                    {/* Processo 2026/2: somente bolsa integral (faixa parcial desabilitada). */}
                    <select
                      className="input"
                      value={kind}
                      disabled={!canPerformAnalystActions}
                      onChange={(e) =>
                        setKind(e.target.value as "INTEGRAL" | "PARCIAL" | "")
                      }
                    >
                      <option value="">Selecione…</option>
                      <option value="INTEGRAL">Integral</option>
                    </select>
                    {kind === "INTEGRAL" &&
                      d.summary.profile !== "INTEGRAL" && (
                        <div
                          className="upload-meta error"
                          style={{ marginTop: 8 }}
                        >
                          ⚠ A renda per capita apurada (
                          {fmtMoney(d.summary.perCapita)}) está acima do teto
                          para bolsa integral (1,5 salário mínimo). Confirme
                          antes de classificar.
                        </div>
                      )}
                  </div>
                )}

                {(decision === "PENDENCIA" || decision === "INDEFERIR") && (
                  <div style={{ marginTop: 12 }}>
                    <div className="field-label" style={{ marginBottom: 6 }}>
                      Motivo{" "}
                      {decision === "INDEFERIR"
                        ? "do indeferimento"
                        : "da pendência"}{" "}
                      <span style={{ color: "var(--red-600)" }}>*</span>
                    </div>
                    <select
                      className="input"
                      value={reason}
                      disabled={!canPerformAnalystActions}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">Selecione o motivo…</option>
                      {DECISION_REASONS[decision].map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {decision === "PENDENCIA" && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      border: "1px solid var(--ink-200)",
                      borderRadius: 8,
                    }}
                  >
                    <div className="field-label">
                      Itens devolvidos para correção{" "}
                      <span style={{ color: "var(--red-600)" }}>*</span>
                    </div>
                    <p className="muted small" style={{ margin: "5px 0 10px" }}>
                      O candidato poderá alterar somente os documentos e as
                      seções marcados.
                    </p>

                    {rejectedDocuments.length > 0 && (
                      <div style={{ display: "grid", gap: 7, marginBottom: 10 }}>
                        {rejectedDocuments.map((document) => {
                          const key = documentPendingKey(document);
                          return (
                            <label
                              key={key}
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "flex-start",
                                fontSize: 12.5,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={pendingDocumentKeys.includes(key)}
                                onChange={(event) =>
                                  setPendingDocumentKeys((current) =>
                                    event.target.checked
                                      ? [...new Set([...current, key])]
                                      : current.filter(
                                          (candidate) => candidate !== key,
                                        ),
                                  )
                                }
                              />
                              <span>
                                {document.name}
                                {document.memberName
                                  ? ` — ${document.memberName}`
                                  : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ display: "grid", gap: 7 }}>
                      {PENDING_FORM_SECTIONS.map((section) => (
                        <label
                          key={section.value}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-start",
                            fontSize: 12.5,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={pendingSections.includes(section.value)}
                            onChange={(event) =>
                              setPendingSections((current) =>
                                event.target.checked
                                  ? [...new Set([...current, section.value])]
                                  : current.filter(
                                      (candidate) =>
                                        candidate !== section.value,
                                    ),
                              )
                            }
                          />
                          <span>Ficha · {section.label}</span>
                        </label>
                      ))}
                    </div>

                    <div
                      className="rgrid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <label className="field">
                        <span className="field-label">
                          Data-limite (opcional)
                        </span>
                        <input
                          className="input"
                          type="date"
                          value={pendingDueDate}
                          onChange={(event) =>
                            setPendingDueDate(event.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">
                          Horário de Brasília
                        </span>
                        <input
                          className="input"
                          type="time"
                          value={pendingDueTime}
                          onChange={(event) =>
                            setPendingDueTime(event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <p className="muted small" style={{ margin: "6px 0 0" }}>
                      Se ficar em branco, será usado o fim da janela de
                      correções publicada para esta chamada.
                    </p>
                    {!pendingDeadlineComplete && (
                      <p className="upload-meta error" style={{ marginTop: 6 }}>
                        Preencha data e horário juntos.
                      </p>
                    )}
                    {pendingItemsCount === 0 && (
                      <p className="upload-meta error" style={{ marginTop: 6 }}>
                        Selecione ao menos um documento ou uma seção da ficha.
                      </p>
                    )}
                  </div>
                )}

                {decideMut.isError && (
                  <p className="upload-meta error" style={{ marginTop: 10 }}>
                    {(decideMut.error as Error).message}
                  </p>
                )}
                {decideMut.isSuccess && (
                  <p
                    className="upload-meta"
                    style={{ marginTop: 10, color: "var(--green-700)" }}
                  >
                    Decisão registrada.
                  </p>
                )}

                <button
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 12 }}
                  disabled={
                    busy ||
                    !canPerformAnalystActions ||
                    !decision ||
                    !parecer.trim() ||
                    ((decision === "PENDENCIA" || decision === "INDEFERIR") &&
                      !reason) ||
                    (decision === "PENDENCIA" &&
                      (pendingItemsCount === 0 || !pendingDeadlineComplete))
                  }
                  onClick={() => {
                    if (!decision) return;
                    const pendingItems: AdminDecisionInput["pendingItems"] =
                      decision === "PENDENCIA"
                        ? [
                            ...selectedPendingDocuments.map((document) => ({
                              kind: "DOCUMENT" as const,
                              documentTypeId: document.documentTypeId,
                              familyMemberId: document.familyMemberId,
                              label: document.memberName
                                ? `${document.name} — ${document.memberName}`
                                : document.name,
                            })),
                            ...pendingSections.map((formSection) => ({
                              kind: "FORM_SECTION" as const,
                              formSection,
                              label:
                                PENDING_FORM_SECTIONS.find(
                                  (section) =>
                                    section.value === formSection,
                                )?.label ?? formSection,
                            })),
                          ]
                        : undefined;
                    decideMut.mutate({
                      parecer: parecer.trim(),
                      decision,
                      scholarshipKind: kind || null,
                      reasonCode: reason || null,
                      isFinal: true,
                      pendingDueAt:
                        decision === "PENDENCIA" &&
                        pendingDueDate &&
                        pendingDueTime
                          ? composeBrasiliaInstant(
                              pendingDueDate,
                              pendingDueTime,
                            )
                          : null,
                      pendingItems,
                    });
                  }}
                >
                  <IconCheck size={14} />{" "}
                  {decideMut.isPending ? "Registrando…" : "Registrar decisão"}
                </button>
              </div>
            </div>

            {(d.status === "classificado" || d.rmRegistration) && (
              <div className="card">
                <div className="card-header">
                  <h3 className="h-card-title">Integração RM</h3>
                </div>
                <div className="card-body">
                  {d.rmRegistration ? (
                    <>
                      <Banner tone="success" title="Exportado para o RM">
                        Inscrição registrada no TOTVS RM.
                      </Banner>
                      <div className="muted small" style={{ marginTop: 8 }}>
                        Registro:{" "}
                        <span
                          className="mono"
                          style={{ color: "var(--ink-900)", fontWeight: 600 }}
                        >
                          {d.rmRegistration}
                        </span>
                        {d.rmSyncedAt && <> · {fmtWhen(d.rmSyncedAt)}</>}
                      </div>
                      {user?.role === "ADMIN" && (
                        <>
                          {revertRmMut.isError && (
                            <p
                              className="upload-meta error"
                              style={{ marginTop: 10 }}
                            >
                              {(revertRmMut.error as Error).message}
                            </p>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 10, color: "var(--red-700)" }}
                            disabled={busy || revertRmMut.isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  "Confirmo que consultei o RM e o candidato não possui inscrição no processo seletivo atual. Liberar uma nova exportação? O Portal voltará o status para Classificado, sem alterar nenhum cadastro no RM.",
                                )
                              )
                                revertRmMut.mutate();
                            }}
                          >
                            {revertRmMut.isPending
                               ? "Liberando…"
                               : "Liberar nova exportação"}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="muted small" style={{ marginBottom: 10 }}>
                        Envia esta inscrição ao TOTVS RM (cria o candidato no
                        processo seletivo) e altera o status para{" "}
                        <strong>Concedida</strong>.
                      </p>
                      {exportRmMut.isError && (
                        <p
                          className="upload-meta error"
                          style={{ marginBottom: 8 }}
                        >
                          {(exportRmMut.error as Error).message}
                        </p>
                      )}
                      {user?.role === "ADMIN" &&
                        (exportRmMut.error as Error | null)?.message.includes(
                          "revertida somente no Portal",
                        ) && (
                          <>
                            <p className="muted small" style={{ marginBottom: 8 }}>
                              Após confirmar a ausência de inscrição no processo
                              seletivo atual, libere o vínculo interno antigo
                              para tentar a exportação novamente.
                            </p>
                            {revertRmMut.isError && (
                              <p
                                className="upload-meta error"
                                style={{ marginBottom: 8 }}
                              >
                                {(revertRmMut.error as Error).message}
                              </p>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ marginBottom: 10, color: "var(--red-700)" }}
                              disabled={busy || revertRmMut.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    "Confirmo que consultei o RM e o candidato não possui inscrição no processo seletivo atual. Liberar o vínculo interno legado para uma nova exportação? Nenhum cadastro no RM será alterado.",
                                  )
                                )
                                  revertRmMut.mutate();
                              }}
                            >
                              {revertRmMut.isPending
                                ? "Liberando…"
                                : "Liberar nova exportação"}
                            </button>
                          </>
                        )}
                      <button
                        className="btn btn-primary btn-block"
                        disabled={busy || exportRmMut.isPending}
                        onClick={() => exportRmMut.mutate()}
                      >
                        <IconUpload size={14} />{" "}
                        {exportRmMut.isPending
                          ? "Exportando…"
                          : "Exportar para o RM"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h3 className="h-card-title">Histórico</h3>
              </div>
              <div className="card-body">
                {d.events.length === 0 ? (
                  <div className="muted small">Sem eventos registrados.</div>
                ) : (
                  <Timeline
                    items={d.events.map((e, i) => ({
                      state: i === d.events.length - 1 ? "active" : "done",
                      title: e.title,
                      meta: fmtWhen(e.createdAt),
                      body: e.body ?? undefined,
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
