"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type {
  ApplicationEventDto,
  ProcessStatus,
  TimelineItemData,
} from "@prouni/shared";
import { AppShell } from "@/components/app-shell";
import {
  CandidateApplicationHeader,
  CandidateApplicationSelectionMessage,
} from "@/components/candidate-application-context";
import { PendingRequestPanel } from "@/components/pending-request-panel";
import { Avatar, Banner, StatusBadge, Stepper, Timeline } from "@/components/ui";
import { IconMessage } from "@/components/icons";
import { applicationsApi } from "@/lib/api";
import { applicationRoute } from "@/lib/application-context";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import { useCandidateApplication } from "@/lib/use-candidate-application";
import { useRequireAuth } from "@/lib/use-require-auth";

const STEPS = [
  "Acesso",
  "Ficha socioeconômica",
  "Upload de documentos",
  "Inscrição enviada",
  "Análise",
  "Resultado",
];

const STEP_BY_STATUS: Record<ProcessStatus, number> = {
  iniciada: 1,
  enviada: 3,
  analise_doc: 4,
  pendencia: 2,
  analise_socio: 4,
  analise_concluida: 5,
  classificado: 5,
  espera: 5,
  indeferido: 5,
  concedida: 5,
};

function timelineFromEvents(
  events?: ApplicationEventDto[],
): TimelineItemData[] {
  if (!events || events.length === 0) {
    return [{ title: "Aguardando movimentação", meta: "—" }];
  }
  return events.map((event, index) => ({
    state: index === events.length - 1 ? "active" : "done",
    title: event.title,
    meta: formatDateTimeBR(event.createdAt),
    body: event.body ?? undefined,
  }));
}

function AcompanhamentoPageContent({
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
  const events = useQuery({
    queryKey: ["application", application?.id, "events"],
    queryFn: () => applicationsApi.events(application!.id),
    enabled: Boolean(application?.id),
  });

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Acompanhamento"]}>
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
        ) : (
          <>
            <CandidateApplicationHeader
              application={application}
              title="Acompanhamento"
            />
            <p className="page-subtitle" style={{ margin: "12px 0 18px" }}>
              Histórico e situação desta chamada, sem misturar movimentações de
              outras inscrições.
            </p>

            <PendingRequestPanel application={application} />

            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <Stepper
                steps={STEPS}
                current={STEP_BY_STATUS[application.status] ?? 1}
              />
            </div>

            <div className="grid-3" style={{ marginBottom: 18 }}>
              <div className="stat">
                <div className="stat-label">Protocolo</div>
                <div className="stat-value mono" style={{ fontSize: 20 }}>
                  {application.protocol}
                </div>
                <div className="muted small">
                  Criado em {formatDateBR(application.createdAt)}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Status atual</div>
                <div>
                  <StatusBadge status={application.status} />
                </div>
                <div className="muted small">
                  Atualizado em {formatDateBR(application.updatedAt)}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Curso · Campus</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    fontSize: 15,
                  }}
                >
                  {application.course?.name ?? "Curso informado pelo MEC"}
                </div>
                <div className="muted small">
                  {application.course?.campus.name ?? "—"}
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <h2 className="h-card-title">Linha do tempo do processo</h2>
                </div>
                <div className="card-body">
                  {events.isLoading ? (
                    <p className="muted small">Carregando movimentações…</p>
                  ) : events.isError ? (
                    <Banner tone="warn" title="Histórico indisponível">
                      Não foi possível carregar as movimentações.
                    </Banner>
                  ) : (
                    <Timeline items={timelineFromEvents(events.data)} />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="card">
                  <div className="card-header">
                    <h2 className="h-card-title">Ações desta inscrição</h2>
                  </div>
                  <div
                    className="card-body"
                    style={{ display: "grid", gap: 8 }}
                  >
                    <Link
                      className="btn btn-ghost"
                      href={applicationRoute(application.id, "ficha")}
                    >
                      Consultar ficha socioeconômica
                    </Link>
                    <Link
                      className="btn btn-ghost"
                      href={applicationRoute(application.id, "documentos")}
                    >
                      Consultar documentos
                    </Link>
                    <Link
                      className="btn btn-ghost"
                      href={applicationRoute(application.id, "notificacoes")}
                    >
                      Ver notificações
                    </Link>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="h-card-title">Canal direto</h2>
                  </div>
                  <div className="card-body">
                    <div className="muted small" style={{ marginBottom: 6 }}>
                      Secretaria de Bolsas
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <Avatar name="Setor de Bolsas" size={36} />
                      <div>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "var(--ink-900)",
                          }}
                        >
                          Setor de Bolsas e Programas Assistenciais
                        </div>
                        <div className="muted small">bolsas@maua.br</div>
                      </div>
                    </div>
                    <a
                      href={`mailto:bolsas@maua.br?subject=${encodeURIComponent(
                        `PROUNI - Protocolo ${application.protocol}`,
                      )}`}
                      className="btn btn-secondary btn-block"
                    >
                      <IconMessage size={14} /> Enviar mensagem
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function LegacyAcompanhamentoPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ applicationId?: string }>();
  return (
    <AcompanhamentoPageContent
      applicationId={
        params.applicationId ?? searchParams.get("applicationId")
      }
    />
  );
}

export default function AcompanhamentoPage() {
  return (
    <Suspense fallback={<div className="content muted">Carregando…</div>}>
      <LegacyAcompanhamentoPage />
    </Suspense>
  );
}
