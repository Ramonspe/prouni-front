"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { maintenanceApi } from "@/lib/api";

type SyncState = "idle" | "loading" | "ok" | "error";

interface SyncCard {
  title: string;
  description: string;
  action: () => Promise<unknown>;
  resultLabel: (r: unknown) => string;
}

const CARDS: SyncCard[] = [
  {
    title: "Sincronizar cursos e campi",
    description:
      "Atualiza o catálogo de campi (SCS e SP) e os 16 cursos do edital no banco de dados. Execute sempre que o edital for revisado.",
    action: () => maintenanceApi.syncCourses(),
    resultLabel: (r) => {
      const res = r as { campuses: number; coursesUpserted: number };
      return `${res.coursesUpserted} curso(s) sincronizado(s) em ${res.campuses} campus(i).`;
    },
  },
  {
    title: "Sincronizar matriz documental",
    description:
      "Aplica a lista de documentos exigidos (obrigatórios e condicionais) definida no código ao ciclo ativo. Execute após atualizar a matriz no código.",
    action: () => maintenanceApi.syncDocMatrix(),
    resultLabel: (r) => {
      const res = r as { cycleLabel: string; activeTypes: number; withTemplate: number };
      return `Ciclo ${res.cycleLabel}: ${res.activeTypes} tipo(s) ativo(s), ${res.withTemplate} com modelo.`;
    },
  },
];

function SyncButton({ card }: { card: SyncCard }) {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");

  const run = async () => {
    setState("loading");
    setMessage("");
    try {
      const result = await card.action();
      setMessage(card.resultLabel(result));
      setState("ok");
    } catch (e: unknown) {
      const err = e as { message?: string };
      setMessage(err?.message ?? "Erro desconhecido.");
      setState("error");
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-body">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-900)", marginBottom: 4 }}>
              {card.title}
            </div>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>{card.description}</p>
            {message && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: state === "ok" ? "var(--green-700)" : "var(--red-700)",
                }}
              >
                {state === "ok" ? "✓ " : "✕ "}{message}
              </p>
            )}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            disabled={state === "loading"}
            onClick={run}
          >
            {state === "loading" ? "Executando…" : "Executar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 24 }}>
          <h1 className="page-title">Configurações · Manutenção</h1>
          <p className="page-subtitle">
            Operações de sincronização do catálogo. Idempotentes — podem ser executadas mais de uma vez sem risco.
          </p>
        </div>

        {CARDS.map((card) => (
          <SyncButton key={card.title} card={card} />
        ))}
      </div>
    </AppShell>
  );
}
