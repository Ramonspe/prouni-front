"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { PendingFormSection } from "@prouni/shared";
import { AppShell } from "@/components/app-shell";
import {
  CandidateApplicationHeader,
  CandidateApplicationSelectionMessage,
} from "@/components/candidate-application-context";
import { PendingRequestPanel } from "@/components/pending-request-panel";
import { ApplicationDeclarationsCard } from "@/components/application-declarations-card";
import { Banner } from "@/components/ui";
import {
  StepEstudante,
  StepMoradia,
  StepRendaDespesas,
} from "@/components/inscricao-steps";
import { StepFamilia } from "@/app/inscricao/page";
import {
  IconHouse,
  IconUpload,
  IconUser,
  IconUsers,
  IconWallet,
  type IconComponent,
} from "@/components/icons";
import {
  applicationRoute,
  editablePendingSections,
  formSectionCapability,
  requestedFormSections,
  type CandidateFormSection,
} from "@/lib/application-context";
import { useCandidateApplication } from "@/lib/use-candidate-application";
import { useRequireAuth } from "@/lib/use-require-auth";

interface FichaSection {
  id: CandidateFormSection;
  label: string;
  icon: IconComponent;
}

const SECTIONS: FichaSection[] = [
  { id: "estudante", label: "Dados do estudante", icon: IconUser },
  { id: "familia", label: "Composição familiar", icon: IconUsers },
  { id: "moradia", label: "Moradia e bens", icon: IconHouse },
  { id: "renda", label: "Renda e despesas", icon: IconWallet },
];

const noop = () => {};

function firstRequestedSection(
  sections: Set<PendingFormSection>,
): CandidateFormSection | null {
  if (sections.has("STUDENT")) return "estudante";
  if (sections.has("FAMILY")) return "familia";
  if (sections.has("HOUSING")) return "moradia";
  if (sections.has("OTHER")) return "renda";
  return null;
}

function FichaPageContent({
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
  const [section, setSection] =
    useState<CandidateFormSection>("estudante");

  useEffect(() => {
    if (!application?.openPendingRequest) return;
    const requested = firstRequestedSection(requestedFormSections(application));
    if (requested) setSection(requested);
  }, [application?.id]); // A seleção inicial muda apenas ao trocar de inscrição.

  const capability = application
    ? formSectionCapability(application, section)
    : null;
  const editableSections = application
    ? editablePendingSections(application)
    : undefined;

  return (
    <AppShell
      role="candidate"
      crumbs={["PROUNI", "Minha inscrição", "Ficha socioeconômica"]}
    >
      <main className="content fade-in">
        {loading || applicationQuery.isLoading ? (
          <div className="card card-pad muted">Carregando sua ficha…</div>
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
            pré-seleção disponível para a sua conta.
          </Banner>
        ) : (
          <>
            <CandidateApplicationHeader
              application={application}
              title="Ficha socioeconômica"
            />
            <p className="page-subtitle" style={{ margin: "12px 0 0" }}>
              As alterações permitidas são salvas automaticamente. Curso e
              chamada são definidos pela pré-seleção e aparecem apenas para
              consulta.
            </p>

            <PendingRequestPanel application={application} />

            <div
              className="rgrid"
              style={{
                display: "grid",
                gridTemplateColumns: "240px 1fr",
                gap: 22,
                marginTop: 18,
              }}
            >
              <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
                <div className="card" style={{ padding: 8 }}>
                  {SECTIONS.map((item) => {
                    const active = section === item.id;
                    const sectionCapability = formSectionCapability(
                      application,
                      item.id,
                    );
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSection(item.id)}
                        aria-current={active ? "page" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 10px",
                          width: "100%",
                          borderRadius: 8,
                          background: active
                            ? "var(--blue-50)"
                            : "transparent",
                          color: active
                            ? "var(--blue-700)"
                            : "var(--ink-700)",
                          fontSize: 13,
                          fontWeight: active ? 600 : 500,
                          textAlign: "left",
                        }}
                      >
                        <item.icon size={16} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {!sectionCapability.allowed && (
                          <span
                            className="muted"
                            style={{ fontSize: 10 }}
                            aria-label="Somente leitura"
                          >
                            leitura
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <Link
                    href={applicationRoute(application.id, "documentos")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      borderRadius: 8,
                      color: "var(--ink-700)",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <IconUpload size={16} /> Documentos
                  </Link>
                </div>
              </aside>

              <div>
                {capability && !capability.allowed && (
                  <div style={{ marginBottom: 10 }}>
                    <Banner tone="info" title="Seção disponível para consulta">
                      {capability.reason ??
                        "Esta seção não está liberada para alteração neste momento."}
                    </Banner>
                  </div>
                )}
                <fieldset
                  disabled={!capability?.allowed}
                  className="card card-pad fade-in"
                  key={section}
                  style={{ margin: 0, minWidth: 0 }}
                >
                  {section === "estudante" && (
                    <StepEstudante appId={application.id} />
                  )}
                  {section === "familia" && (
                    <StepFamilia
                      appId={application.id}
                      onValidChange={noop}
                    />
                  )}
                  {section === "moradia" && (
                    <StepMoradia
                      appId={application.id}
                      onValidChange={noop}
                      editableSections={editableSections}
                    />
                  )}
                  {section === "renda" && (
                    <StepRendaDespesas appId={application.id} />
                  )}
                </fieldset>
              </div>
            </div>
            <ApplicationDeclarationsCard application={application} />
          </>
        )}
      </main>
    </AppShell>
  );
}

function LegacyFichaPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ applicationId?: string }>();
  return (
    <FichaPageContent
      applicationId={
        params.applicationId ?? searchParams.get("applicationId")
      }
    />
  );
}

export default function FichaPage() {
  return (
    <Suspense fallback={<div className="content muted">Carregando…</div>}>
      <LegacyFichaPage />
    </Suspense>
  );
}
