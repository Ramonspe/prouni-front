"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Avatar, Banner, StatusBadge, Stepper, Timeline } from "@/components/ui";
import { IconMessage } from "@/components/icons";
import { useRequireAuth } from "@/lib/use-require-auth";
import { applicationsApi } from "@/lib/api";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import type { ApplicationEventDto, ProcessStatus, TimelineItemData } from "@prouni/shared";

const STEPS = ["Acesso", "Ficha socioeconômica", "Upload de documentos", "Análise", "Resultado"];
const STEP_BY_STATUS: Record<ProcessStatus, number> = {
  iniciada: 1,
  enviada: 3,
  analise_doc: 3,
  pendencia: 2,
  analise_socio: 3,
  classificado: 4,
  espera: 4,
  indeferido: 4,
  concedida: 4,
};

function timelineFromEvents(events?: ApplicationEventDto[]): TimelineItemData[] {
  if (!events || events.length === 0) {
    return [{ title: "Aguardando movimentação", meta: "—" }];
  }
  return events.map((e, i) => ({
    state: i === events.length - 1 ? "active" : "done",
    title: e.title,
    meta: formatDateTimeBR(e.createdAt),
    body: e.body ?? undefined,
  }));
}

export default function AcompanhamentoPage() {
  const { user, loading } = useRequireAuth();
  const app = useQuery({ queryKey: ["application", "me"], queryFn: applicationsApi.me, enabled: !!user });
  const events = useQuery({
    queryKey: ["application", app.data?.id, "events"],
    queryFn: () => applicationsApi.events(app.data!.id),
    enabled: !!app.data?.id,
  });

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Acompanhamento"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 18 }}>
          <h1 className="page-title">Acompanhamento</h1>
          <p className="page-subtitle">Visão completa do processamento da sua inscrição PROUNI.</p>
        </div>

        {loading || app.isLoading ? (
          <div className="card card-pad muted">Carregando sua inscrição…</div>
        ) : app.isError || !app.data ? (
          <Banner tone="warn" title="Inscrição não encontrada">
            Não localizamos uma inscrição ativa para o seu acesso neste ciclo.
          </Banner>
        ) : (
          <>
            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <Stepper steps={STEPS} current={STEP_BY_STATUS[app.data.status] ?? 1} />
            </div>

            <div className="grid-3" style={{ marginBottom: 18 }}>
              <div className="stat">
                <div className="stat-label">Protocolo</div>
                <div className="stat-value mono" style={{ fontSize: 20 }}>{app.data.protocol}</div>
                <div className="muted small">Criado em {formatDateBR(app.data.createdAt)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Status atual</div>
                <div><StatusBadge status={app.data.status} /></div>
                <div className="muted small">Atualizado em {formatDateBR(app.data.updatedAt)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Curso · Campus</div>
                <div style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 15 }}>
                  {app.data.course ? app.data.course.name : "A confirmar"}
                </div>
                <div className="muted small">{app.data.course ? app.data.course.campus.name : "—"}</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Linha do tempo do processo</h3></div>
                <div className="card-body">
                  <Timeline items={timelineFromEvents(events.data)} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="card">
                  <div className="card-header"><h3 className="h-card-title">Próximos passos</h3></div>
                  <div className="card-body">
                    <ol style={{ margin: 0, paddingLeft: 18, color: "var(--ink-700)", fontSize: 13.5, lineHeight: 1.8 }}>
                      <li>Conclua a <strong>ficha socioeconômica</strong> e o envio de documentos.</li>
                      <li>Acompanhe notificações por e-mail e nesta página.</li>
                      <li>O resultado será publicado conforme o cronograma do edital.</li>
                    </ol>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3 className="h-card-title">Canal direto</h3></div>
                  <div className="card-body">
                    <div className="muted small" style={{ marginBottom: 6 }}>Secretaria de Bolsas</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <Avatar name="Setor de Bolsas" size={36} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>Setor de Bolsas e Programas Assistenciais</div>
                        <div className="muted small">bolsas@maua.br</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-block"><IconMessage size={14} /> Enviar mensagem</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
