"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { BadgeTone } from "@prouni/shared";
import { AppShell } from "@/components/app-shell";
import {
  CandidateApplicationHeader,
  CandidateApplicationSelectionMessage,
} from "@/components/candidate-application-context";
import { PendingRequestPanel } from "@/components/pending-request-panel";
import { Badge, Banner } from "@/components/ui";
import {
  IconBell,
  IconCheck,
  IconFile,
  IconInfo,
} from "@/components/icons";
import {
  applicationsApi,
  documentsApi,
  pendingRequestsApi,
} from "@/lib/api";
import { applicationRoute } from "@/lib/application-context";
import { formatDateTimeBR } from "@/lib/format";
import { useCandidateApplication } from "@/lib/use-candidate-application";
import { useRequireAuth } from "@/lib/use-require-auth";

type Notice = {
  id: string;
  kind: "pendencia" | "status";
  title: string;
  body?: string | null;
  when: string;
  tone: BadgeTone;
  tag: string;
  href?: string;
};

function eventTone(toStatus: string | null): {
  tone: BadgeTone;
  tag: string;
  kind: Notice["kind"];
} {
  if (toStatus === "pendencia") {
    return { tone: "warning", tag: "Pendência", kind: "pendencia" };
  }
  return { tone: "neutral", tag: "Atualização", kind: "status" };
}

function NotificacoesPageContent({
  applicationId,
}: {
  applicationId?: string | null;
}) {
  const { user, loading } = useRequireAuth();
  const applicationQuery = useCandidateApplication(
    applicationId,
    Boolean(user),
  );
  const application = applicationQuery.application;
  const appId = application?.id;

  const events = useQuery({
    queryKey: ["application", appId, "events"],
    queryFn: () => applicationsApi.events(appId!),
    enabled: Boolean(appId),
  });
  const uploaded = useQuery({
    queryKey: ["application", appId, "documents"],
    queryFn: () => documentsApi.list(appId!),
    enabled: Boolean(appId),
  });
  const required = useQuery({
    queryKey: ["application", appId, "required-documents"],
    queryFn: () => applicationsApi.requiredDocuments(appId!),
    enabled: Boolean(appId),
  });
  const pendingRequests = useQuery({
    queryKey: ["pending-requests", appId],
    queryFn: () => pendingRequestsApi.list(appId!),
    enabled: Boolean(appId),
  });

  const documentNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const category of required.data?.categories ?? []) {
      for (const item of category.items) names.set(item.typeId, item.name);
    }
    return names;
  }, [required.data]);

  const notices = useMemo<Notice[]>(() => {
    if (!application) return [];
    const list: Notice[] = [];

    for (const request of pendingRequests.data ?? []) {
      const isOpen = request.status === "OPEN";
      list.push({
        id: `pending-${request.id}`,
        kind: "pendencia",
        title: isOpen
          ? "Correção solicitada pela equipe"
          : "Correção enviada para nova análise",
        body: `${request.reason} · ${request.items.length} item(ns) nesta solicitação.`,
        when: request.submittedAt ?? request.createdAt,
        tone: isOpen ? "warning" : "info",
        tag: isOpen ? "Ação necessária" : "Pendência respondida",
        href: isOpen
          ? applicationRoute(
              application.id,
              request.items.some((item) => item.kind === "DOCUMENT")
                ? "documentos"
                : "ficha",
            )
          : applicationRoute(application.id, "acompanhamento"),
      });
    }

    for (const document of uploaded.data ?? []) {
      if (document.status !== "REPROVADO") continue;
      list.push({
        id: `doc-${document.documentTypeId}-${document.familyMemberId ?? "app"}`,
        kind: "pendencia",
        title: `Documento sinalizado: ${
          documentNames.get(document.documentTypeId) ?? "documento"
        }`,
        body:
          document.reviewComment ??
          "Consulte a solicitação da equipe antes de reenviar.",
        when:
          document.reviewedAt ??
          application.updatedAt,
        tone: "danger",
        tag: "Documento",
        href: applicationRoute(application.id, "documentos"),
      });
    }

    const resultStatuses = new Set([
      "classificado",
      "espera",
      "indeferido",
      "concedida",
    ]);
    for (const event of events.data ?? []) {
      if (event.toStatus && resultStatuses.has(event.toStatus)) continue;
      const { tone, tag, kind } = eventTone(event.toStatus);
      list.push({
        id: `event-${event.id}`,
        kind,
        title: event.title,
        body: event.body,
        when: event.createdAt,
        tone,
        tag,
        href: applicationRoute(application.id, "acompanhamento"),
      });
    }

    return list.sort(
      (left, right) =>
        new Date(right.when).getTime() - new Date(left.when).getTime(),
    );
  }, [
    application,
    documentNames,
    events.data,
    pendingRequests.data,
    uploaded.data,
  ]);

  const noticesLoading =
    events.isLoading || uploaded.isLoading || pendingRequests.isLoading;

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Notificações"]}>
      <main className="content fade-in">
        {loading || applicationQuery.isLoading ? (
          <div className="card card-pad muted">Carregando notificações…</div>
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
        ) : (
          <>
            <CandidateApplicationHeader
              application={application}
              title="Notificações"
            />
            <p className="page-subtitle" style={{ margin: "12px 0 18px" }}>
              Avisos exclusivos deste protocolo. Pendências e movimentações de
              outras chamadas ficam em suas respectivas inscrições.
            </p>

            <PendingRequestPanel application={application} showSubmit={false} />

            {noticesLoading ? (
              <div className="card card-pad muted">Carregando avisos…</div>
            ) : notices.length === 0 ? (
              <div
                className="card card-pad"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "var(--ink-600)",
                }}
              >
                <IconCheck size={18} /> Nenhuma notificação para esta inscrição.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notices.map((notice) => (
                  <article
                    key={notice.id}
                    className="card"
                    style={{
                      padding: 14,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        background: "var(--ink-100)",
                        color: "var(--ink-700)",
                      }}
                    >
                      {notice.kind === "pendencia" ? (
                        <IconFile size={16} />
                      ) : (
                        <IconBell size={16} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <Badge tone={notice.tone}>{notice.tag}</Badge>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--ink-900)",
                            fontSize: 13.5,
                          }}
                        >
                          {notice.title}
                        </span>
                      </div>
                      {notice.body && (
                        <div className="muted small" style={{ marginTop: 4 }}>
                          {notice.body}
                        </div>
                      )}
                      <div className="muted small" style={{ marginTop: 6 }}>
                        {formatDateTimeBR(notice.when)}
                      </div>
                      {notice.href && (
                        <Link
                          href={notice.href}
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 8 }}
                        >
                          Abrir esta inscrição
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="banner banner-info" style={{ marginTop: 16 }}>
              <IconInfo className="banner-icon" />
              <div className="banner-body">
                <div className="banner-title">Acompanhe também por e-mail</div>
                Avisos importantes também são enviados para o e-mail
                cadastrado. Verifique a caixa de spam.
              </div>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function LegacyNotificacoesPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ applicationId?: string }>();
  return (
    <NotificacoesPageContent
      applicationId={
        params.applicationId ?? searchParams.get("applicationId")
      }
    />
  );
}

export default function NotificacoesPage() {
  return (
    <Suspense fallback={<div className="content muted">Carregando…</div>}>
      <LegacyNotificacoesPage />
    </Suspense>
  );
}
