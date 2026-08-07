"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { AdminDocumentDto, DocumentStatusDb } from "@prouni/shared";
import { adminApi } from "@/lib/api";
import { useRequireStaff } from "@/lib/use-require-auth";

const CALL_LABEL: Record<string, string> = {
  PRIMEIRA: "1ª chamada",
  SEGUNDA: "2ª chamada",
  ESPERA: "Lista de espera",
};

const STATUS_LABEL: Record<DocumentStatusDb, string> = {
  ENVIADO: "Enviado (em análise)",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  A_ENVIAR: "Não enviado",
};

const STATUS_ORDER: Record<DocumentStatusDb, number> = {
  ENVIADO: 0,
  REPROVADO: 1,
  A_ENVIAR: 2,
  APROVADO: 3,
};

const APP_DOC_KEY = "__app__";

export default function DocumentosPrintPage() {
  const { user } = useRequireStaff();
  const params = useParams<{ id: string }>();

  const appQuery = useQuery({
    queryKey: ["admin", "application", params.id],
    queryFn: () => adminApi.application(params.id),
    enabled: !!user && !!params.id,
  });

  const d = appQuery.data;

  if (!user) return null;
  if (appQuery.isLoading) {
    return (
      <div style={{ padding: 40, fontSize: 14, color: "#555" }}>
        Carregando relação de documentos…
      </div>
    );
  }
  if (!d) {
    return (
      <div style={{ padding: 40, fontSize: 14, color: "#555" }}>
        Inscrição não encontrada.
      </div>
    );
  }

  // Agrupa por integrante (inscrição primeiro, depois cada membro).
  const groups = new Map<
    string,
    { key: string; label: string; sub: string | null; docs: AdminDocumentDto[] }
  >();
  groups.set(APP_DOC_KEY, {
    key: APP_DOC_KEY,
    label: "Documentos da inscrição",
    sub: null,
    docs: [],
  });
  for (const member of d.family) {
    groups.set(member.id, {
      key: member.id,
      label: member.fullName,
      sub: member.relationship,
      docs: [],
    });
  }
  for (const doc of d.documents) {
    const key = doc.familyMemberId ?? APP_DOC_KEY;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: doc.memberName ?? "Outros",
        sub: null,
        docs: [],
      });
    }
    groups.get(key)!.docs.push(doc);
  }
  const documentGroups = Array.from(groups.values())
    .filter((group) => group.docs.length > 0)
    .map((group) => ({
      ...group,
      docs: [...group.docs].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      ),
    }));

  return (
    <div className="doc-print">
      <style>{`
        .doc-print { max-width: 900px; margin: 0 auto; padding: 24px; color: #111; }
        .doc-print table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .doc-print th { text-align: left; border-bottom: 1px solid #ccc; padding: 5px 8px; }
        .doc-print td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        @media print {
          @page { margin: 14mm; }
          .doc-print { padding: 0; max-width: none; }
          .doc-print .no-print { display: none !important; }
          .doc-print .grp { break-inside: avoid; }
        }
      `}</style>

      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button className="btn btn-secondary" onClick={() => window.print()}>
          Imprimir
        </button>
        <button className="btn btn-ghost" onClick={() => window.close()}>
          Fechar
        </button>
      </div>

      <header
        style={{
          borderBottom: "2px solid #0a2a5e",
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, color: "#666" }}>
          Instituto Mauá de Tecnologia · PROUNI
        </div>
        <h1 style={{ fontSize: 20, margin: "4px 0 0" }}>
          Relação de documentos — {d.cycle.label}
        </h1>
        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          Protocolo {d.protocol} · {CALL_LABEL[d.call] ?? d.call}
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px 24px",
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <div>
          <strong>Candidato(a):</strong> {d.name}
        </div>
        <div>
          <strong>CPF:</strong> {d.cpf}
        </div>
        <div>
          <strong>Curso:</strong> {d.course}
        </div>
        <div>
          <strong>Campus:</strong> {d.campus ?? "—"}
        </div>
      </section>

      <div style={{ fontSize: 12.5, color: "#333", marginBottom: 16 }}>
        <strong>{d.docTotals.approved}</strong> aprovados ·{" "}
        <strong>{d.docTotals.sent}</strong> enviados ·{" "}
        <strong>{d.docTotals.required}</strong> exigidos
      </div>

      {documentGroups.map((group) => (
        <section key={group.key} className="grp" style={{ marginBottom: 18 }}>
          <h2
            style={{
              fontSize: 14,
              margin: "0 0 6px",
              paddingBottom: 4,
              borderBottom: "1px solid #999",
            }}
          >
            {group.label}
            {group.sub ? (
              <span style={{ fontWeight: 400, color: "#666" }}>
                {" "}
                · {group.sub}
              </span>
            ) : null}
          </h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Documento</th>
                <th style={{ width: "22%" }}>Categoria</th>
                <th style={{ width: "16%" }}>Situação</th>
                <th style={{ width: "12%" }}>Arquivo</th>
              </tr>
            </thead>
            <tbody>
              {group.docs.map((doc, i) => (
                <tr key={doc.documentId ?? `${doc.documentTypeId}-${i}`}>
                  <td>
                    {doc.name}
                    {doc.status === "REPROVADO" && doc.reviewComment ? (
                      <div style={{ color: "#b42318", marginTop: 2 }}>
                        Motivo: {doc.reviewComment}
                      </div>
                    ) : null}
                  </td>
                  <td>{doc.category}</td>
                  <td>{STATUS_LABEL[doc.status]}</td>
                  <td style={{ wordBreak: "break-all" }}>
                    {doc.fileName ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <footer
        style={{
          marginTop: 20,
          paddingTop: 12,
          borderTop: "1px solid #ccc",
          fontSize: 11,
          color: "#666",
        }}
      >
        Relação gerada para conferência e arquivamento do processo físico. Uso
        interno da Secretaria de Bolsas — Instituto Mauá de Tecnologia.
      </footer>
    </div>
  );
}
