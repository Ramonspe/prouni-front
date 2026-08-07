"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useRequireStaff } from "@/lib/use-require-auth";
import { SocioFormReview } from "@/components/socio-form-review";

function money(value: string | null | undefined) {
  if (value == null) return "—";
  const amount = Number(value);
  return Number.isNaN(amount)
    ? "—"
    : amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CALL_LABEL: Record<string, string> = {
  PRIMEIRA: "1ª chamada",
  SEGUNDA: "2ª chamada",
  ESPERA: "Lista de espera",
};

export default function FichaPrintPage() {
  const { user } = useRequireStaff();
  const params = useParams<{ id: string }>();

  const appQuery = useQuery({
    queryKey: ["admin", "application", params.id],
    queryFn: () => adminApi.application(params.id),
    enabled: !!user && !!params.id,
  });
  const socioQuery = useQuery({
    queryKey: ["admin", "application", params.id, "socio-form"],
    queryFn: () => adminApi.socioForm(params.id),
    enabled: !!user && !!params.id,
  });

  const d = appQuery.data;

  if (!user) return null;
  if (appQuery.isLoading || socioQuery.isLoading) {
    return (
      <div style={{ padding: 40, fontSize: 14, color: "#555" }}>
        Carregando ficha…
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

  return (
    <div className="ficha-print">
      <style>{`
        .ficha-print { max-width: 900px; margin: 0 auto; padding: 24px; color: #111; }
        .ficha-print .no-print button { cursor: pointer; }
        @media print {
          @page { margin: 14mm; }
          .ficha-print { padding: 0; max-width: none; }
          .ficha-print .no-print { display: none !important; }
          .ficha-print details { break-inside: avoid; }
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
          Ficha socioeconômica — {d.cycle.label}
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
          marginBottom: 18,
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

      <section style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Grupo familiar</h2>
        {d.family.length === 0 ? (
          <div style={{ fontSize: 13, color: "#666" }}>
            Nenhum integrante informado.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12.5,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                <th style={{ padding: "6px 8px 6px 0" }}>Nome</th>
                <th style={{ padding: "6px 8px" }}>Parentesco</th>
                <th style={{ padding: "6px 8px" }}>Idade</th>
                <th style={{ padding: "6px 8px" }}>CPF</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Renda bruta
                </th>
              </tr>
            </thead>
            <tbody>
              {d.family.map((member) => (
                <tr key={member.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px 8px 6px 0" }}>
                    {member.fullName}
                    {member.isStudent ? " (estudante)" : ""}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{member.relationship}</td>
                  <td style={{ padding: "6px 8px" }}>{member.age ?? "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{member.cpf ?? "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    {money(member.grossIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <SocioFormReview socioForm={socioQuery.data ?? null} />

      <footer
        style={{
          marginTop: 24,
          paddingTop: 12,
          borderTop: "1px solid #ccc",
          fontSize: 11,
          color: "#666",
        }}
      >
        Documento gerado a partir dos dados declarados pelo candidato. Uso
        interno da Secretaria de Bolsas — Instituto Mauá de Tecnologia.
      </footer>
    </div>
  );
}
