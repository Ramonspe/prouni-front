"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ApplicationDto, OpportunityDto } from "@prouni/shared";
import { AppShell } from "@/components/app-shell";
import { ApplicationCard } from "@/components/application-card";
import { OpportunityCard } from "@/components/opportunity-card";
import { Banner } from "@/components/ui";
import { IconClock } from "@/components/icons";
import { applicationsApi, opportunitiesApi } from "@/lib/api";
import {
  applicationCallLabel,
  applicationCardTone,
  applicationPrimarySection,
  applicationRoute,
  applicationStatusLabel,
} from "@/lib/application-context";
import { formatBrasiliaDateTime } from "@/lib/brasilia-time";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";

function deadlineLabel(application: ApplicationDto): string | null {
  const instant =
    application.openPendingRequest?.dueAt ??
    application.capabilities.respondToPending.endsAt ??
    application.capabilities.finalizeInitialSubmission.endsAt;
  if (instant) {
    return `Prazo: ${formatBrasiliaDateTime(instant, {
      includeTimeZone: true,
    })}`;
  }
  if (application.submissionDeadline) {
    const [year, month, day] = application.submissionDeadline.split("-");
    return year && month && day
      ? `Prazo: ${day}/${month}/${year}`
      : application.submissionDeadline;
  }
  return null;
}

function applicationDescription(application: ApplicationDto): string {
  if (application.openPendingRequest) {
    return "A equipe solicitou correções específicas nesta inscrição. Abra o processo para ver exatamente o que precisa ser ajustado.";
  }
  if (application.status === "iniciada") {
    return "Complete a ficha e envie os documentos desta chamada para finalizar a inscrição.";
  }
  if (
    application.status === "enviada" ||
    application.status === "analise_doc" ||
    application.status === "analise_socio"
  ) {
    return "A documentação desta inscrição foi recebida e está em análise.";
  }
  return "Consulte o histórico, os documentos e as movimentações desta inscrição.";
}

function opportunityDescription(opportunity: OpportunityDto): string {
  if (opportunity.state === "CLAIMED") {
    return "Esta pré-seleção já foi convertida em uma inscrição independente e permanece registrada no histórico.";
  }
  if (opportunity.state === "CANCELLED") {
    return "Esta pré-seleção foi cancelada antes do início da inscrição e permanece registrada para auditoria.";
  }
  if (!opportunity.canClaim) {
    return (
      opportunity.claimBlockedReason ??
      "Esta oportunidade ainda não pode ser iniciada."
    );
  }
  return "Esta pré-seleção gera uma nova inscrição independente. Os dados da chamada e do curso ficam vinculados ao novo protocolo.";
}

export default function PainelPage() {
  const { user, loading } = useRequireAuth();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const firstName = authUser?.fullName?.split(" ")[0] ?? "candidato(a)";
  const applications = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: applicationsApi.list,
    enabled: Boolean(user),
  });
  const opportunities = useQuery({
    queryKey: ["opportunities", "mine"],
    queryFn: opportunitiesApi.listMine,
    enabled: Boolean(user),
  });
  const claim = useMutation({
    mutationFn: opportunitiesApi.claim,
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["applications", "mine"] }),
        queryClient.invalidateQueries({ queryKey: ["opportunities", "mine"] }),
      ]);
      router.push(applicationRoute(created.applicationId, "ficha"));
    },
  });

  const claimableOpportunities = (opportunities.data ?? []).filter(
    (opportunity) =>
      opportunity.state === "AVAILABLE" && opportunity.canClaim,
  );
  const historicalOpportunities = (opportunities.data ?? []).filter(
    (opportunity) =>
      opportunity.state !== "AVAILABLE" || !opportunity.canClaim,
  );
  const refreshing = applications.isFetching || opportunities.isFetching;
  const refresh = () => {
    void Promise.all([applications.refetch(), opportunities.refetch()]);
  };

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Minhas inscrições"]}>
      <main className="content fade-in">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div>
            <h1 className="page-title">Olá, {firstName}</h1>
            <p className="page-subtitle">
              Cada chamada possui uma inscrição e um protocolo próprios. Escolha
              abaixo o processo que deseja acompanhar.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            disabled={refreshing}
            onClick={refresh}
          >
            <IconClock size={14} aria-hidden="true" />
            {refreshing ? "Atualizando…" : "Atualizar"}
          </button>
        </div>

        {loading || applications.isLoading || opportunities.isLoading ? (
          <div className="card card-pad muted">Carregando seus processos…</div>
        ) : applications.isError || opportunities.isError ? (
          <Banner tone="warn" title="Não foi possível carregar o painel">
            Tente atualizar a página. Se o problema continuar, entre em contato
            com a Secretaria de Bolsas.
          </Banner>
        ) : (
          <>
            {claimableOpportunities.length > 0 && (
              <section aria-labelledby="opportunities-title" style={{ marginBottom: 26 }}>
                <div style={{ marginBottom: 10 }}>
                  <h2 className="h-card-title" id="opportunities-title">
                    Novas pré-seleções
                  </h2>
                  <p className="muted small" style={{ margin: "3px 0 0" }}>
                    Iniciar uma oportunidade não altera nem substitui inscrições
                    anteriores.
                  </p>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {claimableOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      cycleLabel={opportunity.call.cycle.label}
                      callLabel={opportunity.call.name}
                      courseName={opportunity.course?.name ?? "Curso informado pelo MEC"}
                      campusName={opportunity.course?.campus.name}
                      description={opportunityDescription(opportunity)}
                      action={
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          disabled={
                            !opportunity.canClaim ||
                            (claim.isPending &&
                              claim.variables === opportunity.id)
                          }
                          onClick={() => claim.mutate(opportunity.id)}
                        >
                          {claim.isPending && claim.variables === opportunity.id
                            ? "Iniciando…"
                            : "Iniciar nova inscrição"}
                        </button>
                      }
                    />
                  ))}
                </div>
                {claim.isError && (
                  <p className="upload-meta error" style={{ marginTop: 8 }}>
                    {(claim.error as Error).message}
                  </p>
                )}
              </section>
            )}

            <section aria-labelledby="applications-title">
              <div style={{ marginBottom: 10 }}>
                <h2 className="h-card-title" id="applications-title">
                  Suas inscrições
                </h2>
                <p className="muted small" style={{ margin: "3px 0 0" }}>
                  O curso e a chamada vêm da pré-seleção e não podem ser trocados
                  dentro da inscrição.
                </p>
              </div>
              {(applications.data ?? []).length === 0 ? (
                <Banner tone="info" title="Nenhuma inscrição iniciada">
                  Quando houver uma pré-seleção disponível, ela aparecerá acima
                  para você criar o respectivo processo.
                </Banner>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {(applications.data ?? []).map((application) => (
                    <ApplicationCard
                      key={application.id}
                      cycleLabel={application.cycle.label}
                      callLabel={applicationCallLabel(application)}
                      courseName={application.course?.name ?? "Curso informado pelo MEC"}
                      campusName={application.course?.campus.name}
                      protocol={application.protocol}
                      statusLabel={applicationStatusLabel(application)}
                      description={applicationDescription(application)}
                      deadlineLabel={deadlineLabel(application)}
                      href={applicationRoute(
                        application.id,
                        applicationPrimarySection(application),
                      )}
                      actionLabel={
                        application.status === "iniciada" ||
                        application.status === "pendencia"
                          ? "Continuar inscrição"
                          : "Ver inscrição"
                      }
                      tone={applicationCardTone(application)}
                    />
                  ))}
                </div>
              )}
            </section>

            {historicalOpportunities.length > 0 && (
              <section
                aria-labelledby="opportunity-history-title"
                style={{ marginTop: 26 }}
              >
                <details>
                  <summary
                    id="opportunity-history-title"
                    className="h-card-title"
                    style={{ cursor: "pointer" }}
                  >
                    Histórico de pré-seleções (
                    {historicalOpportunities.length})
                  </summary>
                  <p className="muted small" style={{ margin: "8px 0 10px" }}>
                    Oportunidades já iniciadas, canceladas ou cujo prazo de
                    início não está aberto.
                  </p>
                  <div style={{ display: "grid", gap: 12 }}>
                    {historicalOpportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        cycleLabel={opportunity.call.cycle.label}
                        callLabel={opportunity.call.name}
                        courseName={
                          opportunity.course?.name ??
                          "Curso informado pelo MEC"
                        }
                        campusName={opportunity.course?.campus.name}
                        description={opportunityDescription(opportunity)}
                        statusLabel={
                          opportunity.state === "CLAIMED"
                            ? "Inscrição iniciada"
                            : opportunity.state === "CANCELLED"
                              ? "Pré-seleção cancelada"
                              : "Fora da janela de início"
                        }
                      />
                    ))}
                  </div>
                </details>
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
