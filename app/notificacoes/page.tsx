"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge, Banner } from "@/components/ui";
import { IconBell, IconCheck, IconFile, IconInfo } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { applicationsApi, documentsApi } from "@/lib/api";
import { formatDateTimeBR } from "@/lib/format";
import type { BadgeTone } from "@prouni/shared";

type Notice = {
  id: string;
  kind: "pendencia" | "parecer" | "status" | "info";
  title: string;
  body?: string | null;
  when: string; // ISO
  tone: BadgeTone;
  tag: string;
};

/** Tom/rótulo do evento conforme o status de destino. */
function eventTone(toStatus: string | null): { tone: BadgeTone; tag: string; kind: Notice["kind"] } {
  switch (toStatus) {
    case "pendencia":
      return { tone: "warning", tag: "Pendência", kind: "pendencia" };
    case "analise_concluida":
      return { tone: "info", tag: "Análise", kind: "status" };
    case "classificado":
    case "concedida":
      return { tone: "success", tag: "Resultado", kind: "parecer" };
    case "indeferido":
      return { tone: "danger", tag: "Resultado", kind: "parecer" };
    case "espera":
      return { tone: "info", tag: "Resultado", kind: "parecer" };
    default:
      return { tone: "neutral", tag: "Atualização", kind: "status" };
  }
}

export default function NotificacoesPage() {
  const { user, loading } = useRequireAuth();
  const app = useQuery({ queryKey: ["application", "me"], queryFn: applicationsApi.me, enabled: !!user });
  const appId = app.data?.id;

  const events = useQuery({
    queryKey: ["application", appId, "events"],
    queryFn: () => applicationsApi.events(appId!),
    enabled: !!appId,
  });
  const uploaded = useQuery({
    queryKey: ["application", appId, "documents"],
    queryFn: () => documentsApi.list(appId!),
    enabled: !!appId,
  });
  const required = useQuery({
    queryKey: ["application", appId, "required-documents"],
    queryFn: () => applicationsApi.requiredDocuments(appId!),
    enabled: !!appId,
  });

  const docName = useMemo(() => {
    const m = new Map<string, string>();
    for (const cat of required.data?.categories ?? []) for (const it of cat.items) m.set(it.typeId, it.name);
    return m;
  }, [required.data]);

  const notices = useMemo<Notice[]>(() => {
    const list: Notice[] = [];
    // Pendências de documentos reprovados (precisam de reenvio)
    for (const u of uploaded.data ?? []) {
      if (u.status === "REPROVADO") {
        list.push({
          id: `doc-${u.documentTypeId}-${u.familyMemberId ?? "app"}`,
          kind: "pendencia",
          title: `Documento reprovado: ${docName.get(u.documentTypeId) ?? "documento"}`,
          body: u.reviewComment || "Reenvie o documento corrigido na página de Documentos.",
          when: u.reviewedAt ?? app.data?.updatedAt ?? new Date(0).toISOString(),
          tone: "danger",
          tag: "Pendência",
        });
      }
    }
    // Eventos da inscrição (mudanças de status). O RESULTADO (classificado, lista
    // de espera, indeferido, concedida) NÃO é exibido ao candidato: a divulgação é
    // feita pelo MEC no portal do Prouni.
    const RESULT_STATUSES = ["classificado", "espera", "indeferido", "concedida"];
    for (const e of events.data ?? []) {
      if (e.toStatus && RESULT_STATUSES.includes(e.toStatus)) continue;
      const { tone, tag, kind } = eventTone(e.toStatus);
      list.push({ id: `ev-${e.id}`, kind, title: e.title, body: e.body, when: e.createdAt, tone, tag });
    }
    return list.sort((a, b) => +new Date(b.when) - +new Date(a.when));
  }, [uploaded.data, events.data, docName, app.data]);

  const isLoading = loading || app.isLoading || events.isLoading;

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Notificações"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 16 }}>
          <h1 className="page-title">Notificações</h1>
          <p className="page-subtitle">Avisos sobre a sua inscrição: pendências de documentos, pareceres e mudanças de status.</p>
        </div>

        {isLoading ? (
          <div className="card card-pad muted">Carregando notificações…</div>
        ) : !appId ? (
          <Banner tone="info" title="Sem inscrição ativa">
            Você ainda não possui uma inscrição neste ciclo. Comece pela{" "}
            <Link href="/inscricao">página de inscrição</Link>.
          </Banner>
        ) : notices.length === 0 ? (
          <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-600)" }}>
            <IconCheck size={18} /> Nenhuma notificação no momento. Você será avisado aqui sobre pendências e o resultado da análise.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notices.map((n) => (
              <div key={n.id} className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0,
                    background: "var(--ink-100)", color: "var(--ink-700)",
                  }}
                >
                  {n.kind === "pendencia" ? <IconFile size={16} /> : <IconBell size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={n.tone}>{n.tag}</Badge>
                    <span style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 13.5 }}>{n.title}</span>
                  </div>
                  {n.body && <div className="muted small" style={{ marginTop: 4 }}>{n.body}</div>}
                  <div className="muted small" style={{ marginTop: 6 }}>{formatDateTimeBR(n.when)}</div>
                  {n.kind === "pendencia" && (
                    <Link href="/documentos" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
                      Resolver na página de Documentos
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="banner banner-info" style={{ marginTop: 16 }}>
          <IconInfo className="banner-icon" />
          <div className="banner-body">
            <div className="banner-title">Acompanhe também por e-mail</div>
            Avisos importantes também são enviados para o e-mail cadastrado. Verifique a caixa de spam.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
