import {
  PRESELECTION_CALLS,
  STATUS_MAP,
  type ActionCapabilityDto,
  type ApplicationDto,
  type PendingFormSection,
} from "@prouni/shared";

export type CandidateApplicationSection =
  | "ficha"
  | "documentos"
  | "acompanhamento"
  | "notificacoes";

export type CandidateFormSection =
  | "estudante"
  | "familia"
  | "moradia"
  | "renda";

const DENIED_CAPABILITY: ActionCapabilityDto = {
  allowed: false,
  reason: "Esta ação não está disponível para esta inscrição.",
  startsAt: null,
  endsAt: null,
};

const FORM_SECTION_MAP: Record<
  CandidateFormSection,
  PendingFormSection[]
> = {
  estudante: ["STUDENT"],
  familia: ["FAMILY"],
  moradia: ["HOUSING", "OTHER"],
  renda: ["OTHER"],
};

export function applicationRoute(
  applicationId: string,
  section: CandidateApplicationSection = "ficha",
): string {
  return `/inscricoes/${encodeURIComponent(applicationId)}/${section}`;
}

export function applicationCallLabel(application: ApplicationDto): string {
  return (
    application.selectionCall?.name ??
    PRESELECTION_CALLS.find((call) => call.value === application.call)?.label ??
    application.call
  );
}

export function applicationStatusLabel(application: ApplicationDto): string {
  return STATUS_MAP[application.status]?.label ?? application.status;
}

export function requestedFormSections(
  application: ApplicationDto,
): Set<PendingFormSection> {
  return new Set(
    (application.openPendingRequest?.items ?? [])
      .filter((item) => item.kind === "FORM_SECTION" && item.formSection)
      .map((item) => item.formSection as PendingFormSection),
  );
}

export function formSectionCapability(
  application: ApplicationDto,
  section: CandidateFormSection,
): ActionCapabilityDto {
  const overall = application.capabilities.editForm;
  if (!overall.allowed) return overall;

  if (!application.openPendingRequest) return overall;

  const requested = requestedFormSections(application);
  const allowed = FORM_SECTION_MAP[section].some((item) =>
    requested.has(item),
  );
  if (allowed && application.capabilities.respondToPending.allowed) {
    return application.capabilities.respondToPending;
  }

  return {
    ...DENIED_CAPABILITY,
    reason: "Esta seção não foi devolvida para correção.",
  };
}

export function editablePendingSections(
  application: ApplicationDto,
): PendingFormSection[] {
  if (!application.capabilities.editForm.allowed) return [];
  if (!application.openPendingRequest) {
    return ["STUDENT", "FAMILY", "HOUSING", "OTHER"];
  }
  return [...requestedFormSections(application)].filter(
    (section) => section !== "FAMILY",
  );
}

export function documentUploadCapability(
  application: ApplicationDto,
  documentTypeId: string,
  familyMemberId: string | null,
): ActionCapabilityDto {
  const request = application.openPendingRequest;
  if (!request) {
    return application.status === "pendencia"
      ? application.capabilities.respondToPending
      : application.capabilities.uploadInitialDocuments;
  }

  if (!application.capabilities.respondToPending.allowed) {
    return application.capabilities.respondToPending;
  }

  const requested = request.items.some(
    (item) =>
      item.kind === "DOCUMENT" &&
      item.documentTypeId === documentTypeId &&
      (item.familyMemberId ?? null) === familyMemberId,
  );
  if (requested) return application.capabilities.respondToPending;

  return {
    ...DENIED_CAPABILITY,
    reason: "Este documento não foi devolvido para correção.",
  };
}

export function applicationPrimarySection(
  application: ApplicationDto,
): CandidateApplicationSection {
  if (
    application.status === "iniciada" ||
    application.status === "pendencia"
  ) {
    const requested = requestedFormSections(application);
    return requested.size > 0 ? "ficha" : "documentos";
  }
  return "acompanhamento";
}

export function applicationCardTone(
  application: ApplicationDto,
): "neutral" | "attention" | "active" | "success" {
  if (application.status === "pendencia") return "attention";
  if (application.status === "iniciada") return "active";
  if (
    application.status === "enviada" ||
    application.status === "analise_doc" ||
    application.status === "analise_socio"
  ) {
    return "active";
  }
  if (
    application.status === "analise_concluida" ||
    application.status === "classificado" ||
    application.status === "concedida"
  ) {
    return "success";
  }
  return "neutral";
}
