"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Banner, StatusBadge, Stepper, Timeline } from "@/components/ui";
import { IconChevR, IconClock, IconDownload, IconFile, IconGraduate, IconHouse, IconUpload } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { applicationsApi, coursesApi } from "@/lib/api";
import { formatDateBR, formatDateTimeBR } from "@/lib/format";
import { PRESELECTION_CALLS, type ApplicationEventDto, type PreselectionCall, type ProcessStatus, type TimelineItemData } from "@prouni/shared";

function callLabel(c: PreselectionCall): string {
  return PRESELECTION_CALLS.find((x) => x.value === c)?.label ?? c;
}

/** Editor de curso/campus (A2) — disponível enquanto a inscrição não foi enviada. */
function CursoEditor({ appId, currentCourseId, campusCode }: { appId: string; currentCourseId: string | null; campusCode: string | null }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [campus, setCampus] = useState(campusCode ?? "SCS");
  const [courseId, setCourseId] = useState(currentCourseId ?? "");
  const campuses = useQuery({ queryKey: ["campuses"], queryFn: () => coursesApi.campuses(), enabled: open });
  const courses = useQuery({ queryKey: ["courses", campus], queryFn: () => coursesApi.courses(campus), enabled: open });
  const mut = useMutation({
    mutationFn: () => applicationsApi.course(appId, { courseId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["application", "me"] }); setOpen(false); },
  });

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
        Alterar curso
      </button>
    );
  }
  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <select className="input" style={{ maxWidth: 160 }} value={campus} onChange={(e) => { setCampus(e.target.value); setCourseId(""); }}>
        {(campuses.data ?? []).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      <select className="input" style={{ maxWidth: 260 }} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        <option value="">Selecione o curso…</option>
        {(courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn btn-primary btn-sm" disabled={!courseId || mut.isPending} onClick={() => mut.mutate()}>
        {mut.isPending ? "Salvando…" : "Salvar"}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
      {mut.isError && <span className="upload-meta error">{(mut.error as Error).message}</span>}
    </div>
  );
}

const STEP_LABELS = ["Acesso", "Ficha socioeconômica", "Upload de documentos", "Inscrição enviada", "Análise", "Resultado"];
const STEP_BY_STATUS: Record<ProcessStatus, number> = {
  iniciada: 1, enviada: 3, analise_doc: 4, pendencia: 2, analise_socio: 4,
  classificado: 5, espera: 5, indeferido: 5, concedida: 5,
};
const SCHOLARSHIP_LABEL: Record<string, string> = { INTEGRAL: "Integral · 100%", PARCIAL: "Parcial · 50%" };

function timelineFromEvents(events?: ApplicationEventDto[]): TimelineItemData[] {
  if (!events || events.length === 0) return [{ title: "Inscrição iniciada", meta: "—" }];
  return events.map((e, i) => ({
    state: i === events.length - 1 ? "active" : "done",
    title: e.title,
    meta: formatDateTimeBR(e.createdAt),
    body: e.body ?? undefined,
  }));
}

export default function PainelPage() {
  const { user, loading } = useRequireAuth();
  const { user: authUser } = useAuth();
  const firstName = authUser?.fullName?.split(" ")[0] ?? "candidato(a)";
  const app = useQuery({ queryKey: ["application", "me"], queryFn: applicationsApi.me, enabled: !!user });
  const events = useQuery({
    queryKey: ["application", app.data?.id, "events"],
    queryFn: () => applicationsApi.events(app.data!.id),
    enabled: !!app.data?.id,
  });

  const data = app.data;

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Dashboard"]}>
      <div className="content fade-in">
        {loading || app.isLoading ? (
          <div className="card card-pad muted">Carregando seu painel…</div>
        ) : app.isError || !data ? (
          <Banner tone="warn" title="Inscrição não encontrada">
            Não localizamos uma inscrição ativa para o seu acesso neste ciclo.
          </Banner>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, gap: 24 }}>
              <div>
                <h1 className="page-title">Olá, {firstName}</h1>
                <p className="page-subtitle">
                  Protocolo <span className="mono">{data.protocol}</span> · Ciclo {data.cycle.label} · Atualizado em{" "}
                  {formatDateBR(data.updatedAt)}.
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            {/* Vaga em destaque */}
            <div className="vaga-card" style={{ marginBottom: 18 }}>
              <div className="vaga-card-stripe" />
              <div className="vaga-card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
                  <div style={{ flex: 1 }}>
                    <div className="vaga-label">Vaga PROUNI · {data.cycle.label}</div>
                    <div className="vaga-course">{data.course ? data.course.name : "Curso a confirmar"}</div>
                    <div className="vaga-meta">
                      <span className="vaga-meta-item"><IconGraduate size={14} /> Graduação</span>
                      <span className="vaga-meta-sep">·</span>
                      <span className="vaga-meta-item vaga-campus">
                        <IconHouse size={14} /> Campus <strong>{data.course ? data.course.campus.name : "—"}</strong>
                      </span>
                    </div>
                    {["iniciada", "pendencia"].includes(data.status) && (
                      <CursoEditor appId={data.id} currentCourseId={data.course?.id ?? null} campusCode={data.course?.campus.code ?? null} />
                    )}
                  </div>
                  <div className="vaga-modalidade">
                    <div className="vaga-modalidade-label">Modalidade da bolsa</div>
                    <div className="vaga-modalidade-value">
                      {data.scholarshipKind ? SCHOLARSHIP_LABEL[data.scholarshipKind] ?? data.scholarshipKind : "A definir"}
                    </div>
                    <div className="vaga-modalidade-sub">Definida na análise</div>
                  </div>
                </div>
                <div className="vaga-foot">
                  <div className="vaga-foot-item">
                    <span className="muted small">Pré-seleção MEC/SisProuni</span>
                    <span className="mono">{formatDateBR(data.createdAt)}</span>
                  </div>
                  <div className="vaga-foot-item">
                    <span className="muted small">Status</span>
                    <span><StatusBadge status={data.status} /></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 className="h-card-title">Sua etapa atual</h3>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>Conclua os passos para envio da inscrição.</p>
                </div>
                <Link href="/ficha" className="btn btn-secondary btn-sm">
                  Continuar ficha <IconChevR size={14} />
                </Link>
              </div>
              <Stepper steps={STEP_LABELS} current={STEP_BY_STATUS[data.status] ?? 1} />
            </div>

            {["iniciada", "pendencia"].includes(data.status) && data.submissionDeadline && (
              <div style={{ marginBottom: 18 }}>
                <Banner tone="info" title={`Prazo de entrega — ${callLabel(data.call)}`}>
                  Envie e finalize seus documentos até <strong>{formatDateBR(data.submissionDeadline)}</strong>, prazo da sua chamada.
                </Banner>
              </div>
            )}

            {data.status === "pendencia" && (
              <div style={{ marginBottom: 18 }}>
                <Banner tone="warn" title="Há documentos com pendência">
                  A equipe de bolsas solicitou ajustes. <Link href="/documentos" style={{ marginLeft: 6 }}>Resolver pendências →</Link>
                </Banner>
              </div>
            )}

            {["enviada", "analise_doc", "analise_socio"].includes(data.status) && (
              <div style={{ marginBottom: 18 }}>
                <Banner tone="info" title="Inscrição recebida — em análise">
                  Sua documentação foi enviada e está em análise pela equipe de Bolsas. <strong>O resultado é divulgado pelo MEC</strong> no portal do Prouni (acessounico.mec.gov.br/prouni).
                </Banner>
              </div>
            )}

            {["classificado", "espera", "indeferido", "concedida"].includes(data.status) && (
              <div style={{ marginBottom: 18 }}>
                <Banner tone="info" title="Análise concluída">
                  A análise da sua documentação foi concluída e o resultado foi encaminhado ao MEC. <strong>A divulgação do resultado é feita pelo MEC</strong>, no portal do Prouni (acessounico.mec.gov.br/prouni).
                </Banner>
              </div>
            )}

            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h3 className="h-card-title">Linha do tempo da análise</h3></div>
                <div className="card-body">
                  <Timeline items={timelineFromEvents(events.data)} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="card">
                  <div className="card-header"><h3 className="h-card-title">Atalhos</h3></div>
                  <div className="card-body rgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Link href="/ficha" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}><IconFile size={15} /> Retomar ficha</Link>
                    <Link href="/documentos" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}><IconUpload size={15} /> Enviar documento</Link>
                    <Link href="/acompanhamento" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}><IconClock size={15} /> Ver status detalhado</Link>
                    <a href="/edital-prouni-2026-2.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}><IconDownload size={15} /> Baixar edital</a>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3 className="h-card-title">Resumo</h3></div>
                  <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "var(--ink-700)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Protocolo</span><span className="mono">{data.protocol}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Ciclo</span><span>{data.cycle.label}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Curso</span><span>{data.course ? data.course.name : "—"}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Campus</span><span>{data.course ? data.course.campus.name : "—"}</span></div>
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
