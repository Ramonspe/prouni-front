"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApplicationDto,
  PendingRequestItemDto,
  UploadedDocumentDto,
} from "@prouni/shared";
import { Banner } from "./ui";
import { IconCheck, IconFile, IconInfo } from "./icons";
import { documentsApi, pendingRequestsApi } from "@/lib/api";
import { applicationRoute } from "@/lib/application-context";
import { formatBrasiliaDateTime } from "@/lib/brasilia-time";
import styles from "./pending-request-panel.module.css";

function documentKey(
  documentTypeId: string,
  familyMemberId: string | null,
): string {
  return `${documentTypeId}:${familyMemberId ?? "app"}`;
}

export function pendingDocumentProgress(
  items: PendingRequestItemDto[],
  uploaded: UploadedDocumentDto[],
): { total: number; complete: number; missing: number } {
  const valid = new Set(
    uploaded
      .filter(
        (document) =>
          document.status === "ENVIADO" || document.status === "APROVADO",
      )
      .map((document) =>
        documentKey(document.documentTypeId, document.familyMemberId),
      ),
  );
  const documents = items.filter(
    (
      item,
    ): item is PendingRequestItemDto & {
      documentTypeId: string;
    } => item.kind === "DOCUMENT" && Boolean(item.documentTypeId),
  );
  const complete = documents.filter((item) =>
    valid.has(
      documentKey(item.documentTypeId, item.familyMemberId ?? null),
    ),
  ).length;
  return {
    total: documents.length,
    complete,
    missing: documents.length - complete,
  };
}

function itemTarget(applicationId: string, item: PendingRequestItemDto): string {
  return item.kind === "DOCUMENT"
    ? applicationRoute(applicationId, "documentos")
    : applicationRoute(applicationId, "ficha");
}

export function PendingRequestPanel({
  application,
  showSubmit = true,
}: {
  application: ApplicationDto;
  showSubmit?: boolean;
}) {
  const request = application.openPendingRequest;
  const queryClient = useQueryClient();
  const documentItems =
    request?.items.filter((item) => item.kind === "DOCUMENT") ?? [];
  const uploaded = useQuery({
    queryKey: ["application", application.id, "documents"],
    queryFn: () => documentsApi.list(application.id),
    enabled: Boolean(request && documentItems.length > 0),
  });
  const progress = useMemo(
    () => pendingDocumentProgress(request?.items ?? [], uploaded.data ?? []),
    [request?.items, uploaded.data],
  );

  const submitMutation = useMutation({
    mutationFn: () =>
      pendingRequestsApi.submit(application.id, request!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["applications", "mine"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["application", application.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["application", application.id, "events"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pending-requests", application.id],
      });
    },
  });

  if (!request) return null;

  const capability = application.capabilities.respondToPending;
  const canSubmit =
    request.status === "OPEN" &&
    capability.allowed &&
    progress.missing === 0 &&
    !uploaded.isLoading;

  return (
    <section className={styles.panel} aria-labelledby="pending-request-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Correção solicitada pela equipe</p>
          <h2 className={styles.title} id="pending-request-title">
            Itens desta pendência
          </h2>
          <p className={styles.reason}>{request.reason}</p>
        </div>
        <div className={styles.deadline}>
          <span>Prazo para responder</span>
          <strong>
            {formatBrasiliaDateTime(request.dueAt, {
              includeTimeZone: true,
            })}
          </strong>
        </div>
      </div>

      <ul className={styles.items}>
        {request.items.map((item) => {
          const isDocument = item.kind === "DOCUMENT";
          const isComplete =
            isDocument &&
            Boolean(item.documentTypeId) &&
            pendingDocumentProgress([item], uploaded.data ?? []).missing === 0;
          return (
            <li key={item.id} className={styles.item}>
              <span
                className={`${styles.itemIcon} ${
                  isComplete ? styles.itemComplete : ""
                }`}
              >
                {isComplete ? (
                  <IconCheck size={14} aria-hidden="true" />
                ) : isDocument ? (
                  <IconFile size={14} aria-hidden="true" />
                ) : (
                  <IconInfo size={14} aria-hidden="true" />
                )}
              </span>
              <span className={styles.itemText}>
                <strong>{item.label}</strong>
                <span>
                  {isDocument
                    ? isComplete
                      ? "Documento reenviado"
                      : "Documento aguardando reenvio"
                    : "Seção da ficha liberada para correção"}
                </span>
              </span>
              <Link
                className="btn btn-ghost btn-sm"
                href={itemTarget(application.id, item)}
              >
                {isDocument ? "Ver documento" : "Abrir ficha"}
              </Link>
            </li>
          );
        })}
      </ul>

      {!capability.allowed && (
        <Banner tone="warn" title="Resposta indisponível">
          {capability.reason ??
            "O período para responder a esta pendência está encerrado."}
        </Banner>
      )}

      {showSubmit && (
        <div className={styles.submitArea}>
          <div>
            <strong>Concluir correção</strong>
            <p>
              {progress.total > 0 && progress.missing > 0
                ? `Reenvie os ${progress.missing} documento(s) indicado(s) antes de concluir.`
                : "Ao concluir, os itens serão enviados novamente para análise."}
            </p>
            {submitMutation.isError && (
              <span className={styles.error}>
                {(submitMutation.error as Error).message}
              </span>
            )}
            {submitMutation.isSuccess && (
              <span className={styles.success}>
                Correções enviadas para nova análise.
              </span>
            )}
          </div>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!canSubmit || submitMutation.isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Confirmar o envio das correções para nova análise? Depois disso, os itens ficarão bloqueados até uma nova solicitação da equipe.",
                )
              ) {
                submitMutation.mutate();
              }
            }}
          >
            {submitMutation.isPending
              ? "Enviando correções…"
              : "Enviar correções para análise"}
          </button>
        </div>
      )}
    </section>
  );
}
