import { describe, expect, it } from "vitest";
import type {
  PendingRequestItemDto,
  UploadedDocumentDto,
} from "@prouni/shared";
import { pendingDocumentProgress } from "./pending-request-panel";

const items: PendingRequestItemDto[] = [
  {
    id: "one",
    kind: "DOCUMENT",
    documentTypeId: "income",
    familyMemberId: "member-1",
    formSection: null,
    resolvedAt: null,
    label: "Renda do integrante",
  },
  {
    id: "two",
    kind: "DOCUMENT",
    documentTypeId: "identity",
    familyMemberId: null,
    formSection: null,
    resolvedAt: null,
    label: "Documento pessoal",
  },
  {
    id: "three",
    kind: "FORM_SECTION",
    documentTypeId: null,
    familyMemberId: null,
    formSection: "OTHER",
    resolvedAt: null,
    label: "Renda e despesas",
  },
];

const uploaded: UploadedDocumentDto[] = [
  {
    documentTypeId: "income",
    familyMemberId: "member-1",
    status: "ENVIADO",
    fileName: "renda.pdf",
    versionNo: 2,
  },
  {
    documentTypeId: "identity",
    familyMemberId: null,
    status: "REPROVADO",
    fileName: "rg.pdf",
    versionNo: 1,
  },
];

describe("pendingDocumentProgress", () => {
  it("conta apenas documentos enviados ou aprovados no slot exato", () => {
    expect(pendingDocumentProgress(items, uploaded)).toEqual({
      total: 2,
      complete: 1,
      missing: 1,
    });
  });

  it("não confunde o mesmo tipo de documento entre integrante e inscrição", () => {
    expect(
      pendingDocumentProgress([items[0]], [
        { ...uploaded[0], familyMemberId: null },
      ]),
    ).toEqual({ total: 1, complete: 0, missing: 1 });
  });

  it("ignores a document that is no longer required", () => {
    expect(
      pendingDocumentProgress(
        [{ ...items[1], resolvedAt: "2026-08-11T12:00:00.000Z" }],
        [],
      ),
    ).toEqual({ total: 0, complete: 0, missing: 0 });
  });
});
