"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  CandidateApplicationHeader,
  CandidateApplicationSelectionMessage,
} from "@/components/candidate-application-context";
import { PendingRequestPanel } from "@/components/pending-request-panel";
import { Badge, Banner } from "@/components/ui";
import { IconCheck, IconChevR, IconDownload, IconFile, IconInfo, IconUpload, IconUser, IconX } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useCandidateApplication } from "@/lib/use-candidate-application";
import {
  applicationRoute,
  documentUploadCapability,
} from "@/lib/application-context";
import { applicationsApi, documentsApi, familyApi, socioApi } from "@/lib/api";
import { needsPdfRegeneration, PDF_REGENERATION_MESSAGE } from "@/lib/pdf-upload-preflight";
import {
  applicationCompletionIssues,
  type ActionCapabilityDto,
  type BadgeTone,
  type RequiredDocumentDto,
  type UploadedDocumentDto,
} from "@prouni/shared";

const SCOPE_LABEL: Record<string, string> = {
  APPLICATION: "Documento da inscrição",
  EACH_MEMBER: "Por integrante do grupo familiar",
  EACH_ADULT: "Por integrante maior de 18 anos",
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png";
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

type Selected = RequiredDocumentDto & { group: string };

/** Chave do slot (tipo × integrante), usada para casar exigidos × enviados. */
function slotKey(typeId: string, memberId: string | null | undefined): string {
  return `${typeId}:${memberId ?? "app"}`;
}

/** Estado visual de um slot a partir do documento enviado (ou da falta dele). */
function statusInfo(
  up: UploadedDocumentDto | undefined,
  required: boolean,
): { tone: BadgeTone; label: string; rowClass: string; hasFile: boolean } {
  switch (up?.status) {
    case "APROVADO":
      return { tone: "success", label: "Aprovado", rowClass: "has-file", hasFile: true };
    case "ENVIADO":
      return { tone: "warning", label: "Enviado · em análise", rowClass: "has-pending", hasFile: true };
    case "REPROVADO":
      return { tone: "danger", label: "Reprovado", rowClass: "has-rejected", hasFile: true };
    default:
      return {
        tone: required ? "neutral" : "info",
        label: required ? "A enviar" : "Opcional",
        rowClass: "",
        hasFile: false,
      };
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Painel lateral — envio (upload real) e visualização do documento do slot. */
function DocDetail({
  item,
  uploaded,
  appId,
  capability,
  onClose,
}: {
  item: Selected;
  uploaded?: UploadedDocumentDto;
  appId: string;
  capability: ActionCapabilityDto;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const pickVersionRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [checkingFile, setCheckingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const st = statusInfo(uploaded, item.required);

  const mutation = useMutation({
    mutationFn: (f: File) => documentsApi.upload(appId, item.typeId, item.member?.id ?? null, f),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["application", appId, "documents"] });
      void qc.invalidateQueries({ queryKey: ["applications", "mine"] });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  async function pick(f: File | null | undefined) {
    const pickVersion = ++pickVersionRef.current;
    setLocalError(null);
    setFile(null);
    setCheckingFile(false);
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type)) {
      setLocalError("Formato inválido. Envie PDF, JPG ou PNG.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError("Arquivo acima de 10 MB.");
      return;
    }

    setCheckingFile(true);
    try {
      const needsRegeneration = await needsPdfRegeneration(f);
      if (pickVersion !== pickVersionRef.current) return;

      if (needsRegeneration) {
        setFile(null);
        setLocalError(PDF_REGENERATION_MESSAGE);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    } catch {
      // A pré-validação é apenas orientativa. Nunca impedir um envio válido se
      // o navegador não conseguir ler o arquivo localmente.
    } finally {
      if (pickVersion === pickVersionRef.current) setCheckingFile(false);
    }

    if (pickVersion !== pickVersionRef.current) return;
    setFile(f);
  }

  const serverError = mutation.isError ? (mutation.error as Error).message : null;

  return (
    <div className="card" style={{ position: "sticky", top: 80 }}>
      <div className="card-header">
        <h3 className="h-card-title">{item.name}</h3>
        <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}>
          <IconX size={14} />
        </button>
      </div>
      <div className="card-body">
        <div className="muted small" style={{ marginBottom: 6 }}>Categoria</div>
        <div style={{ fontSize: 13.5, color: "var(--ink-900)", marginBottom: 12 }}>{item.group}</div>

        {item.member && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Refere-se a</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-900)", marginBottom: 12 }}>
              {item.member.name} <span className="muted">· {item.member.relationship}</span>
            </div>
          </>
        )}

        {item.conditionLabel && (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>Exigido porque</div>
            <div style={{ marginBottom: 12 }}>
              <Badge tone="info" dot={false}>{item.conditionLabel}</Badge>
            </div>
          </>
        )}

        {item.templateUrl && (
          <a
            className="btn btn-ghost btn-sm"
            href={item.templateUrl}
            download
            style={{ marginBottom: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <IconDownload size={14} /> Baixar modelo para preencher
          </a>
        )}

        <div className="muted small" style={{ marginBottom: 6 }}>Status</div>
        <div style={{ marginBottom: 14 }}>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>

        {/* Arquivo já enviado */}
        {st.hasFile && uploaded?.fileName && (
          <div className={`upload-row ${st.rowClass}`} style={{ marginBottom: 14, cursor: "default" }}>
            <div className="upload-icon">
              <IconFile size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="upload-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {uploaded.fileName}
              </div>
              <div className="upload-meta">
                {uploaded.versionNo ? `Versão ${uploaded.versionNo}` : "Enviado"} · {st.label}
              </div>
            </div>
          </div>
        )}

        {uploaded?.status === "REPROVADO" && uploaded.reviewComment && (
          <Banner tone="danger" title="Documento reprovado">
            {uploaded.reviewComment}
          </Banner>
        )}

        {!capability.allowed ? (
          <Banner tone="warn" title="Envio indisponível">
            {capability.reason ??
              "Este documento está disponível somente para consulta."}
          </Banner>
        ) : (
        <>
        {/* Zona de upload */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: "none" }}
          onChange={(e) => { void pick(e.target.files?.[0]); }}
        />
        <div
          className="dropzone"
          style={dragOver ? { borderColor: "var(--blue-600)", background: "var(--blue-50)" } : undefined}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
        >
          <IconUpload size={22} style={{ marginBottom: 8, color: "var(--ink-500)" }} />
          <div style={{ color: "var(--ink-800)", fontWeight: 500, fontSize: 13 }}>
            {st.hasFile ? "Arraste um novo arquivo para reenviar" : "Arraste o arquivo aqui"}
          </div>
          <div className="muted small">
            ou <span style={{ color: "var(--blue-700)", textDecoration: "underline" }}>selecione do seu computador</span>
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>PDF, JPG, PNG · até 10 MB</div>
        </div>

        {/* Arquivo selecionado (pré-envio) */}
        {file && (
          <div className="upload-row" style={{ marginTop: 10, cursor: "default" }}>
            <div className="upload-icon">
              <IconFile size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="upload-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </div>
              <div className="upload-meta">{formatSize(file.size)}</div>
            </div>
            <button
              className="icon-btn"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <IconX size={13} />
            </button>
          </div>
        )}

        {(localError || serverError) && (
          <p className="upload-meta error" style={{ marginTop: 10 }}>{localError ?? serverError}</p>
        )}

        {mutation.isSuccess && !file && !localError && (
          <p className="upload-meta" style={{ marginTop: 10, color: "var(--green-700)", display: "flex", alignItems: "center", gap: 6 }}>
            <IconCheck size={13} /> Arquivo enviado com sucesso.
          </p>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 10 }}
          disabled={!file || mutation.isPending || checkingFile}
          onClick={() => file && mutation.mutate(file)}
        >
          {checkingFile ? "Verificando arquivo…" : mutation.isPending ? "Enviando…" : st.hasFile ? "Reenviar arquivo" : "Confirmar envio"}
        </button>
        </>
        )}
      </div>
    </div>
  );
}

function DocRow({
  item,
  uploaded,
  capability,
  onClick,
}: {
  item: RequiredDocumentDto;
  uploaded?: UploadedDocumentDto;
  capability: ActionCapabilityDto;
  onClick: () => void;
}) {
  const st = statusInfo(uploaded, item.required);
  return (
    <div className={`upload-row ${st.rowClass}`} onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="upload-icon">{st.hasFile ? <IconCheck size={17} /> : <IconUpload size={17} />}</div>
      <div style={{ minWidth: 0 }}>
        <div className="upload-title">{item.name}</div>
        <div className="upload-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.member ? (
            <>
              <IconUser size={12} /> {item.member.name} · {item.member.relationship}
            </>
          ) : (
            SCOPE_LABEL[item.scope] ?? "Documento da inscrição"
          )}
          {item.conditionLabel && <> · {item.conditionLabel}</>}
          {uploaded?.fileName && <> · {uploaded.fileName}</>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge tone={st.tone}>{st.label}</Badge>
        <button className="btn btn-ghost btn-sm">
          {capability.allowed
            ? st.hasFile
              ? "Reenviar"
              : "Enviar"
            : "Consultar"}{" "}
          <IconChevR size={13} />
        </button>
      </div>
    </div>
  );
}

function DocumentosPageContent({
  applicationId,
}: {
  applicationId?: string | null;
}) {
  const { user, loading } = useRequireAuth();
  const [selected, setSelected] = useState<Selected | null>(null);

  const applicationQuery = useCandidateApplication(
    applicationId,
    Boolean(user),
  );
  const application = applicationQuery.application;
  const socio = useQuery({
    queryKey: ["socio", application?.id],
    queryFn: () => socioApi.get(application!.id),
    enabled: !!application?.id,
  });
  const family = useQuery({
    queryKey: ["family", application?.id],
    queryFn: () => familyApi.list(application!.id),
    enabled: !!application?.id,
  });
  const docs = useQuery({
    queryKey: ["application", application?.id, "required-documents"],
    queryFn: () => applicationsApi.requiredDocuments(application!.id),
    enabled: !!application?.id,
  });
  const uploadedQuery = useQuery({
    queryKey: ["application", application?.id, "documents"],
    queryFn: () => documentsApi.list(application!.id),
    enabled: !!application?.id,
  });

  const uploadedByKey = useMemo(() => {
    const m = new Map<string, UploadedDocumentDto>();
    for (const u of uploadedQuery.data ?? []) m.set(slotKey(u.documentTypeId, u.familyMemberId), u);
    return m;
  }, [uploadedQuery.data]);

  const qc = useQueryClient();
  const data = docs.data;
  const appId = application?.id;
  const status = application?.status ?? "";
  const sentCount = (uploadedQuery.data ?? []).filter((u) => u.status !== "A_ENVIAR").length;
  const requiredItems = data?.categories.flatMap((category) => category.items.filter((item) => item.required)) ?? [];
  const sentRequiredCount = requiredItems.filter((item) => {
    const uploaded = uploadedByKey.get(slotKey(item.typeId, item.member?.id ?? null));
    return uploaded?.status === "ENVIADO" || uploaded?.status === "APROVADO";
  }).length;
  const allRequiredSent = !!data && sentRequiredCount === requiredItems.length;
  const hasCourse = !!application?.course;
  const completionIssues = applicationCompletionIssues({
    form: socio.data?.form,
    members: family.data,
    vehicles: socio.data?.vehicles,
  });
  const allFieldsComplete = !socio.isLoading && !family.isLoading && !!socio.data && !!family.data && completionIssues.length === 0;
  const selectedUploaded = selected ? uploadedByKey.get(slotKey(selected.typeId, selected.member?.id ?? null)) : undefined;
  const selectedCapability =
    selected && application
      ? documentUploadCapability(
          application,
          selected.typeId,
          selected.member?.id ?? null,
        )
      : null;
  const finalizeCapability =
    application?.capabilities.finalizeInitialSubmission;

  useEffect(() => {
    setSelected(null);
  }, [appId]);

  const finalizeMut = useMutation({
    mutationFn: () => applicationsApi.finalize(appId as string),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["applications", "mine"] });
      void qc.invalidateQueries({ queryKey: ["application", appId, "documents"] });
    },
  });

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Inscrição", "Documentos"]}>
      <main className="content fade-in">
        {loading || applicationQuery.isLoading ? (
          <div className="card card-pad muted">Carregando sua inscrição…</div>
        ) : applicationQuery.isError ? (
          <Banner tone="warn" title="Não foi possível carregar a inscrição">
            Atualize a página e tente novamente.
          </Banner>
        ) : applicationQuery.notFound ||
          applicationQuery.requiresSelection ? (
          <CandidateApplicationSelectionMessage
            notFound={applicationQuery.notFound}
          />
        ) : !application ? (
          <Banner tone="info" title="Nenhuma inscrição iniciada">
            Consulte no <Link href="/painel">painel</Link> se há uma nova
            pré-seleção disponível.
          </Banner>
        ) : docs.isLoading || socio.isLoading || family.isLoading ? (
          <div className="card card-pad muted">Montando sua lista de documentos…</div>
        ) : docs.isError || !data ? (
          <Banner tone="warn" title="Não foi possível carregar os documentos">
            Não foi possível montar a lista desta inscrição.
          </Banner>
        ) : (
          <>
            <CandidateApplicationHeader
              application={application}
              title="Documentos"
            />
            <p className="page-subtitle" style={{ margin: "12px 0 0" }}>
              A lista é montada automaticamente a partir da ficha desta
              inscrição. Formatos: <span className="mono">PDF, JPG, PNG</span>{" "}
              · até <span className="mono">10 MB</span>.
            </p>

            <PendingRequestPanel application={application} />

            {status === "enviada" ? (
              <Banner tone="success" title="Inscrição enviada">
                Sua documentação foi enviada para análise. Não é mais possível alterar os documentos.
              </Banner>
            ) : !application.capabilities.uploadInitialDocuments.allowed &&
              !application.capabilities.respondToPending.allowed ? (
              <Banner tone="info" title="Documentos disponíveis para consulta">
                {application.capabilities.respondToPending.reason ??
                  application.capabilities.uploadInitialDocuments.reason ??
                  "Nenhum envio está liberado para esta inscrição."}
              </Banner>
            ) : null}
            <div className="docs-summary">
              <div className="docs-summary-item">
                <div className="muted small">Categorias</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{data.categories.length}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Documentos exigidos</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)" }}>{data.totals.total}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Obrigatórios</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--blue-700)" }}>{data.totals.required}</div>
              </div>
              <div className="docs-summary-item">
                <div className="muted small">Enviados</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--green-700)" }}>{sentCount}</div>
              </div>
            </div>

            {status === "iniciada" && finalizeCapability && (
              <div className="card card-pad" style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: 14 }}>Finalizar inscrição</strong>
                  <div className="muted small" style={{ marginTop: 2 }}>
                    {!hasCourse
                      ? "Os dados do curso desta pré-seleção estão incompletos. Procure a Secretaria de Bolsas."
                      : !allFieldsComplete
                      ? <>Complete os campos obrigatórios da <Link href={applicationRoute(application.id, "ficha")}>ficha socioeconômica</Link> ({completionIssues.length} pendência(s)) antes de finalizar.</>
                      : allRequiredSent
                      ? finalizeCapability.allowed
                        ? "Todos os dados e documentos obrigatórios foram preenchidos. Você já pode finalizar e enviar para análise."
                        : finalizeCapability.reason ??
                          "A finalização não está disponível neste momento."
                      : `Envie todos os documentos obrigatórios (${sentRequiredCount}/${data.totals.required}) para liberar a finalização.`}
                  </div>
                  {finalizeMut.isError && (
                    <div className="upload-meta error" style={{ marginTop: 4 }}>{(finalizeMut.error as Error).message}</div>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  disabled={!hasCourse || !allFieldsComplete || !allRequiredSent || !finalizeCapability.allowed || finalizeMut.isPending}
                  onClick={() => {
                    if (confirm("Após finalizar, você não poderá mais enviar ou trocar documentos. Deseja enviar a inscrição para análise?")) {
                      finalizeMut.mutate();
                    }
                  }}
                >
                  {finalizeMut.isPending ? "Finalizando…" : "Finalizar inscrição"}
                </button>
              </div>
            )}

            {data.notes.map((note, i) => (
              <Banner key={i} tone="info" title="Complete seu cadastro para refinar a lista">
                {note}
              </Banner>
            ))}

            <div
              className="rgrid"
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: selected ? "1fr 360px" : "1fr",
                gap: 18,
                alignItems: "start",
              }}
            >
              <div>
                {data.categories.length === 0 ? (
                  <div className="card card-pad muted">
                    Nenhum documento exigido ainda. Preencha o grupo familiar e a ficha socioeconômica para
                    liberarmos a lista personalizada.
                  </div>
                ) : (
                  data.categories.map((group) => (
                    <div className="card" key={group.id} style={{ marginBottom: 14 }}>
                      <div className="card-header" style={{ borderLeft: `3px solid ${group.colorVar ?? "var(--blue-600)"}` }}>
                        <h3 className="h-card-title">{group.title}</h3>
                        <span className="muted small" style={{ marginLeft: "auto" }}>
                          {group.items.length} documento(s)
                        </span>
                      </div>
                      <div style={{ padding: 14 }}>
                        {group.items.map((it) => (
                          <DocRow
                            key={it.key}
                            item={it}
                            uploaded={uploadedByKey.get(slotKey(it.typeId, it.member?.id ?? null))}
                            capability={documentUploadCapability(
                              application,
                              it.typeId,
                              it.member?.id ?? null,
                            )}
                            onClick={() => setSelected({ ...it, group: group.title })}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selected && appId && selectedCapability && (
                <DocDetail
                  key={selected.key}
                  item={selected}
                  uploaded={selectedUploaded}
                  appId={appId}
                  capability={selectedCapability}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>

            <div className="banner banner-info" style={{ marginTop: 18 }}>
              <IconInfo className="banner-icon" />
              <div className="banner-body">
                <div className="banner-title">Como a lista é montada</div>
                Cada integrante maior de 18 anos comprova a própria renda conforme a situação declarada
                (CLT, autônomo, MEI, aposentado…). Documentos de imóvel seguem a posse informada na ficha, e
                rendas extras (pensão, aluguel, ajuda, benefícios) aparecem só quando declaradas.
              </div>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function LegacyDocumentosPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ applicationId?: string }>();
  return (
    <DocumentosPageContent
      applicationId={
        params.applicationId ?? searchParams.get("applicationId")
      }
    />
  );
}

export default function DocumentosPage() {
  return (
    <Suspense fallback={<div className="content muted">Carregando…</div>}>
      <LegacyDocumentosPage />
    </Suspense>
  );
}
