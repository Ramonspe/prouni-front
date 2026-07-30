import { describe, expect, it } from "vitest";
import type { ApplicationDto } from "@prouni/shared";
import {
  applicationCallLabel,
  applicationPrimarySection,
  applicationRoute,
  documentUploadCapability,
  formSectionCapability,
} from "./application-context";

function application(
  overrides: Partial<ApplicationDto> = {},
): ApplicationDto {
  return {
    id: "app-1",
    protocol: "PRN-2026-0001",
    status: "pendencia",
    optsForQuota: false,
    isPcd: false,
    isImtAffiliated: false,
    cycle: { id: "cycle-1", label: "2026/2" },
    course: {
      id: "course-1",
      name: "Design",
      campus: { code: "SCS", name: "São Caetano do Sul" },
    },
    enem: { edition: null, registration: null, score: null },
    scholarshipKind: null,
    priority: null,
    call: "SEGUNDA",
    submissionDeadline: null,
    selectionCall: {
      id: "call-2",
      cycle: { id: "cycle-1", label: "2026/2", year: 2026, term: 2 },
      code: "segunda",
      name: "2ª chamada",
      kind: "SECOND_CALL",
      sequence: 2,
      status: "PUBLISHED",
      timeZone: "America/Sao_Paulo",
    },
    capabilities: {
      editForm: {
        allowed: true,
        reason: null,
        startsAt: null,
        endsAt: "2026-08-20T02:59:00.000Z",
      },
      uploadInitialDocuments: {
        allowed: false,
        reason: "Primeiro envio encerrado.",
        startsAt: null,
        endsAt: null,
      },
      finalizeInitialSubmission: {
        allowed: false,
        reason: "Primeiro envio encerrado.",
        startsAt: null,
        endsAt: null,
      },
      respondToPending: {
        allowed: true,
        reason: null,
        startsAt: null,
        endsAt: "2026-08-20T02:59:00.000Z",
      },
    },
    openPendingRequest: {
      id: "pending-1",
      applicationId: "app-1",
      status: "OPEN",
      reason: "Corrija os itens indicados.",
      dueAt: "2026-08-20T02:59:00.000Z",
      submittedAt: null,
      resolvedAt: null,
      createdAt: "2026-08-10T12:00:00.000Z",
      items: [
        {
          id: "item-form",
          kind: "FORM_SECTION",
          documentTypeId: null,
          familyMemberId: null,
          formSection: "OTHER",
          label: "Renda e despesas",
        },
        {
          id: "item-doc",
          kind: "DOCUMENT",
          documentTypeId: "doc-income",
          familyMemberId: "member-1",
          formSection: null,
          label: "Comprovante de renda",
        },
      ],
    },
    createdAt: "2026-08-01T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("application-context", () => {
  it("gera rotas canônicas com o identificador codificado", () => {
    expect(applicationRoute("app/1", "documentos")).toBe(
      "/inscricoes/app%2F1/documentos",
    );
  });

  it("prioriza o nome canônico da chamada", () => {
    expect(applicationCallLabel(application())).toBe("2ª chamada");
    expect(
      applicationCallLabel(
        application({ selectionCall: null, call: "SEGUNDA" }),
      ),
    ).toBe("2ª chamada");
  });

  it("libera somente seções formalmente devolvidas", () => {
    expect(formSectionCapability(application(), "renda").allowed).toBe(true);
    expect(formSectionCapability(application(), "moradia").allowed).toBe(true);
    expect(formSectionCapability(application(), "familia")).toMatchObject({
      allowed: false,
      reason: "Esta seção não foi devolvida para correção.",
    });
  });

  it("libera somente o slot documental formalmente devolvido", () => {
    expect(
      documentUploadCapability(application(), "doc-income", "member-1").allowed,
    ).toBe(true);
    expect(
      documentUploadCapability(application(), "doc-income", null),
    ).toMatchObject({
      allowed: false,
      reason: "Este documento não foi devolvido para correção.",
    });
  });

  it("direciona pendência de ficha à ficha e demais processos ao acompanhamento", () => {
    expect(applicationPrimarySection(application())).toBe("ficha");
    expect(
      applicationPrimarySection(
        application({
          status: "analise_doc",
          openPendingRequest: null,
        }),
      ),
    ).toBe("acompanhamento");
  });
});
