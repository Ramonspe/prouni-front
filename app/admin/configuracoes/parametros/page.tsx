"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Banner } from "@/components/ui";
import { useRequireStaff } from "@/lib/use-require-auth";
import { settingsApi } from "@/lib/api";
import type { SystemSettingsInput } from "@prouni/shared";
import { composeBrasiliaInstant, getBrasiliaCivilParts } from "@/lib/brasilia-time";

const EMPTY: SystemSettingsInput = {
  minimumWage: "1518.00",
  integralFactor: "1.50",
  parcialEnabled: false,
  parcialFactor: "3.00",
  call1Start: null, call1End: null,
  call2Start: null, call2End: null,
  waitlistStart: null, waitlistEnd: null,
  call1RegistrationStartAt: null, call1RegistrationEndAt: null,
  call1InProgressStartAt: null, call1InProgressEndAt: null,
  call2RegistrationStartAt: null, call2RegistrationEndAt: null,
  call2InProgressStartAt: null, call2InProgressEndAt: null,
  waitlistRegistrationStartAt: null, waitlistRegistrationEndAt: null,
  waitlistInProgressStartAt: null, waitlistInProgressEndAt: null,
  notifyCandidate: false,
  autoRejectPendingAfterDeadline: false,
  autoRejectPendingComment: "Prezado(a) candidato(a),\nInformamos que seu processo foi INDEFERIDO na etapa de comprovação das informações para concessão da bolsa do Prouni.\nPara consultar o resultado do processo, acesse o Portal Único de Acesso ao Ensino Superior (MEC) utilizando seu login e senha.\nAtenciosamente, Coordenação de Bolsas e Programas Assistenciais\nInstituto Mauá de Tecnologia",
  allowPendencyResubmission: true,
  pendencyResubmissionDeadline: null,
};

/** Formata "1518.00" (ou "1,5") em R$ pt-BR; retorna "—" se inválido. */
function brl(v: string): string {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}
function cap(mw: string, factor: string): string {
  const n = Number(String(mw).replace(",", ".")) * Number(String(factor).replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

export default function ParametrosPage() {
  const { user } = useRequireStaff();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => settingsApi.get(),
    enabled: !!user && isAdmin,
  });
  const callsQuery = useQuery({
    queryKey: ["admin", "selection-calls", "legacy-lock"],
    queryFn: async () => [],
    enabled: false,
  });
  const hasCanonicalSchedule = false;
  const legacyScheduleLocked = false;
  const latestAutoRejectionQuery = useQuery({
    queryKey: ["admin", "settings", "auto-rejections", "latest"],
    queryFn: () => settingsApi.latestAutoRejectionRun(),
    enabled: !!user && isAdmin,
  });

  const [form, setForm] = useState<SystemSettingsInput>(EMPTY);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (query.data && !seeded) {
      const d = query.data;
      setForm({
        minimumWage: d.minimumWage,
        integralFactor: d.integralFactor,
        parcialEnabled: d.parcialEnabled,
        parcialFactor: d.parcialFactor,
        call1Start: d.call1Start, call1End: d.call1End,
        call2Start: d.call2Start, call2End: d.call2End,
        waitlistStart: d.waitlistStart, waitlistEnd: d.waitlistEnd,
        call1RegistrationStartAt: d.call1RegistrationStartAt,
        call1RegistrationEndAt: d.call1RegistrationEndAt,
        call1InProgressStartAt: d.call1InProgressStartAt,
        call1InProgressEndAt: d.call1InProgressEndAt,
        call2RegistrationStartAt: d.call2RegistrationStartAt,
        call2RegistrationEndAt: d.call2RegistrationEndAt,
        call2InProgressStartAt: d.call2InProgressStartAt,
        call2InProgressEndAt: d.call2InProgressEndAt,
        waitlistRegistrationStartAt: d.waitlistRegistrationStartAt,
        waitlistRegistrationEndAt: d.waitlistRegistrationEndAt,
        waitlistInProgressStartAt: d.waitlistInProgressStartAt,
        waitlistInProgressEndAt: d.waitlistInProgressEndAt,
        notifyCandidate: d.notifyCandidate,
        autoRejectPendingAfterDeadline: d.autoRejectPendingAfterDeadline,
        autoRejectPendingComment: d.autoRejectPendingComment,
        allowPendencyResubmission: d.allowPendencyResubmission,
        pendencyResubmissionDeadline: d.pendencyResubmissionDeadline,
      });
      setSeeded(true);
    }
  }, [query.data, seeded]);

  const set = <K extends keyof SystemSettingsInput>(k: K, v: SystemSettingsInput[K]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const dateTimeValue = (value: string | null | undefined) => {
    if (!value) return "";
    const parts = getBrasiliaCivilParts(value);
    return `${parts.date}T${parts.time}`;
  };
  const setDateTime = (k: keyof SystemSettingsInput, value: string) =>
    set(k, (value ? composeBrasiliaInstant(value.slice(0, 10), value.slice(11, 16)) : null) as SystemSettingsInput[typeof k]);
  const setDate = (k: keyof SystemSettingsInput, value: string) =>
    set(k, (value || null) as SystemSettingsInput[typeof k]);

  const saveMut = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: (data) => {
      qc.setQueryData(["admin", "settings"], data);
      qc.invalidateQueries({ queryKey: ["admin", "settings", "auto-rejections"] });
    },
  });
  const undoMut = useMutation({
    mutationFn: (runId: string) => settingsApi.undoAutoRejectionRun(runId),
    onSuccess: () => {
      setForm((previous) => ({ ...previous, autoRejectPendingAfterDeadline: false }));
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });

  const dateTimeField = (label: string, key: keyof SystemSettingsInput) => (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        type="datetime-local"
        className="input"
        value={dateTimeValue(form[key] as string | null)}
        onChange={(e) => setDateTime(key, e.target.value)}
      />
    </div>
  );
  const dateField = (label: string, key: keyof SystemSettingsInput) => (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        type="date"
        className="input"
        value={(form[key] as string | null) ?? ""}
        disabled={legacyScheduleLocked}
        onChange={(e) => setDate(key, e.target.value)}
      />
    </div>
  );

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações", "Parâmetros do sistema"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 14 }}>
          <h1 className="page-title">Parâmetros do sistema</h1>
          <p className="page-subtitle">
            Variáveis globais de renda e notificações. Os prazos operacionais
            são administrados por chamada no cronograma versionado.
          </p>
        </div>

        {!isAdmin ? (
          <Banner tone="info" title="Acesso restrito">
            Apenas administradores podem editar os parâmetros do sistema.
          </Banner>
        ) : query.isLoading ? (
          <div className="card card-pad muted">Carregando parâmetros…</div>
        ) : query.isError ? (
          <Banner tone="danger" title="Não foi possível carregar">
            {(query.error as Error).message}
          </Banner>
        ) : (
          <>
            {/* Renda e bolsa */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Renda e bolsa</h3></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 560 }}>
                  <div className="field">
                    <label className="field-label">Salário mínimo (R$)</label>
                    <input className="input" inputMode="decimal" value={form.minimumWage}
                      onChange={(e) => set("minimumWage", e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Fator da renda integral (× salário mínimo)</label>
                    <input className="input" inputMode="decimal" value={form.integralFactor}
                      onChange={(e) => set("integralFactor", e.target.value)} />
                  </div>
                </div>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Renda per capita integral ≤ <strong>{cap(form.minimumWage, form.integralFactor)}</strong>{" "}
                  ({form.integralFactor} × {brl(form.minimumWage)}).
                </p>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line, #e5e7eb)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.parcialEnabled}
                      onChange={(e) => set("parcialEnabled", e.target.checked)} />
                    Habilitar bolsa parcial neste ciclo
                  </label>
                  <p className="muted small" style={{ margin: "6px 0 10px" }}>
                    A Mauá mantém <strong>somente bolsa integral</strong> neste ciclo. Deixe desmarcado para
                    não considerar a faixa parcial na análise.
                  </p>
                  {form.parcialEnabled && (
                    <div className="field" style={{ maxWidth: 272 }}>
                      <label className="field-label">Fator da renda parcial (× salário mínimo)</label>
                      <input className="input" inputMode="decimal" value={form.parcialFactor}
                        onChange={(e) => set("parcialFactor", e.target.value)} />
                      <p className="muted small" style={{ marginTop: 6 }}>
                        Renda per capita parcial ≤ <strong>{cap(form.minimumWage, form.parcialFactor)}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Períodos de inscrição e envio de documentos</h3></div>
              <div className="card-body">
                <Banner tone="info" title="Os dois períodos são independentes">
                  Fechar novas inscrições não interrompe a ficha ou o envio de documentos de quem já possui uma inscrição iniciada.
                </Banner>
                {([
                  ["1ª chamada", "call1"],
                  ["2ª chamada", "call2"],
                  ["Lista de espera", "waitlist"],
                ] as const).map(([label, prefix]) => (
                  <div key={prefix} style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line, #e5e7eb)" }}>
                    <h4 style={{ margin: "0 0 10px" }}>{label}</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
                      <div>
                        <strong>Novas inscrições</strong>
                        <p className="muted small">Cria conta e inicia uma nova inscrição.</p>
                        {dateTimeField("Início", `${prefix}RegistrationStartAt` as keyof SystemSettingsInput)}
                        {dateTimeField("Fim", `${prefix}RegistrationEndAt` as keyof SystemSettingsInput)}
                      </div>
                      <div>
                        <strong>Ficha e documentos de inscrições já iniciadas</strong>
                        <p className="muted small">Completa dados e envia documentos. Em branco, permanece liberado.</p>
                        {dateTimeField("Início", `${prefix}InProgressStartAt` as keyof SystemSettingsInput)}
                        {dateTimeField("Fim", `${prefix}InProgressEndAt` as keyof SystemSettingsInput)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Correção de pendências</h3></div>
              <div className="card-body">
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.allowPendencyResubmission}
                    onChange={(e) => set("allowPendencyResubmission", e.target.checked)} />
                  Liberar reenvio de documentos em pendência mesmo fora do prazo
                </label>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Esta opção vale somente quando um analista devolve formalmente uma inscrição como pendência.
                </p>
                {form.allowPendencyResubmission && (
                  <div className="field" style={{ maxWidth: 272, marginTop: 10 }}>
                    <label className="field-label">Data limite para reenvio de pendências (opcional)</label>
                    <input type="date" className="input" value={form.pendencyResubmissionDeadline ?? ""}
                      onChange={(e) => setDate("pendencyResubmissionDeadline", e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {/* Cronograma legado, mantido apenas para compatibilidade de código. */}
            <div style={{ display: "none" }}>
              <div className="card-header"><h3 className="h-card-title">Cronograma — janelas de entrega de documentos</h3></div>
              <div className="card-body">
                {hasCanonicalSchedule ? (
                  <Banner tone="info" title="Cronograma migrado">
                    Estes campos antigos estão disponíveis apenas para consulta.
                    Datas, horários e cada tipo de janela devem ser alterados em{" "}
                    <Link href="/admin/configuracoes/cronograma">
                      Cronograma e prazos
                    </Link>
                    .
                  </Banner>
                ) : callsQuery.isError ? (
                  <Banner tone="warn" title="Cronograma protegido">
                    Não foi possível confirmar a origem oficial dos prazos.
                    Os campos permanecem bloqueados até a consulta ser
                    restabelecida.
                  </Banner>
                ) : null}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 560 }}>
                  {dateField("1ª chamada — início", "call1Start")}
                  {dateField("1ª chamada — fim", "call1End")}
                  {dateField("2ª chamada — início", "call2Start")}
                  {dateField("2ª chamada — fim", "call2End")}
                  {dateField("Lista de espera — início", "waitlistStart")}
                  {dateField("Lista de espera — fim", "waitlistEnd")}
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line, #e5e7eb)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.allowPendencyResubmission}
                      onChange={(e) => set("allowPendencyResubmission", e.target.checked)} />
                    Liberar reenvio de documentos em pendência mesmo fora do prazo
                  </label>
                  <p className="muted small" style={{ marginTop: 6, maxWidth: 620 }}>
                    Padrão <strong>ligado</strong>. Quando um analista devolve a inscrição como{" "}
                    <strong>pendência</strong> (documento reprovado que precisa ser reenviado, ou correção na
                    ficha), a análise normalmente acontece <strong>depois</strong> do fim da chamada. Com esta
                    opção ligada, esses candidatos conseguem reenviar os documentos e corrigir a ficha mesmo
                    após o prazo — <strong>somente</strong> as inscrições que a equipe colocou em pendência.
                    Cadastros e primeiros envios continuam presos ao prazo da chamada. Desligue apenas se a
                    Secretaria quiser encerrar o recebimento por completo na data-limite.
                  </p>
                  {form.allowPendencyResubmission && (
                    <div className="field" style={{ maxWidth: 272, marginTop: 10 }}>
                      <label className="field-label">Data limite para reenvio de pendências (opcional)</label>
                      <input
                        type="date"
                        className="input"
                        value={form.pendencyResubmissionDeadline ?? ""}
                        onChange={(e) => setDate("pendencyResubmissionDeadline", e.target.value)}
                      />
                      <p className="muted small" style={{ marginTop: 6 }}>
                        {form.pendencyResubmissionDeadline
                          ? "Pendências podem reenviar até esta data (inclusive). Depois dela, o reenvio é bloqueado."
                          : "Em branco: sem prazo extra — enquanto a inscrição estiver em pendência, o reenvio fica liberado."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            </>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Encerramento automático por prazo documental</h3></div>
              <div className="card-body">
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.autoRejectPendingAfterDeadline}
                    onChange={(e) => set("autoRejectPendingAfterDeadline", e.target.checked)} />
                  Indeferir inscrições pendentes após o encerramento do prazo de envio de documentos
                </label>
                <p className="muted small" style={{ marginTop: 6, maxWidth: 720 }}>
                  Aplica-se somente a inscrições ainda pendentes — iniciada, enviada, em análise ou pendência — cujo prazo documental da chamada já terminou. Inscrições classificadas, em lista de espera, concedidas ou já indeferidas não são alteradas.
                </p>
                <div className="field" style={{ maxWidth: 720, marginTop: 12 }}>
                  <label className="field-label">Mensagem padrão do indeferimento</label>
                  <textarea className="input" rows={7} value={form.autoRejectPendingComment}
                    onChange={(e) => set("autoRejectPendingComment", e.target.value)} />
                  <p className="muted small" style={{ marginTop: 6 }}>
                    A mensagem é registrada no histórico do candidato e é usada no e-mail quando as notificações estiverem habilitadas.
                  </p>
                </div>
                {latestAutoRejectionQuery.data && (
                  <Banner tone="warn" title={`Último lote: ${latestAutoRejectionQuery.data.total} candidato(s)`}>
                    Executado em {new Date(latestAutoRejectionQuery.data.createdAt).toLocaleString("pt-BR")}. Caso tenha sido um engano, desfaça o lote: a regra será desligada e apenas os candidatos que não tiveram outra alteração depois do lote serão restaurados.
                    <div style={{ marginTop: 10 }}>
                      <button className="btn btn-ghost btn-sm" disabled={undoMut.isPending}
                        onClick={() => {
                          if (confirm("Desfazer este lote automático? A função será desligada e os candidatos sem alterações posteriores voltarão ao status anterior.")) {
                            undoMut.mutate(latestAutoRejectionQuery.data!.id);
                          }
                        }}>
                        {undoMut.isPending ? "Desfazendo…" : "Desfazer último lote"}
                      </button>
                    </div>
                  </Banner>
                )}
                {undoMut.isSuccess && (
                  <Banner tone="success" title="Lote desfeito">
                    {undoMut.data.restored} candidato(s) restaurado(s){undoMut.data.skipped ? `; ${undoMut.data.skipped} não foram alterados porque tiveram movimentações posteriores.` : "."}
                  </Banner>
                )}
                {undoMut.isError && (
                  <Banner tone="danger" title="Não foi possível desfazer">
                    {(undoMut.error as Error).message}
                  </Banner>
                )}
              </div>
            </div>
            {/* Notificações */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><h3 className="h-card-title">Notificações ao candidato</h3></div>
              <div className="card-body">
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.notifyCandidate}
                    onChange={(e) => set("notifyCandidate", e.target.checked)} />
                  Enviar e-mail ao candidato nas decisões e pendências
                </label>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Padrão <strong>desligado</strong>: o resultado é enviado ao MEC, que é responsável por
                  informar o candidato. Ligue apenas se a Secretaria decidir avisar diretamente pelo portal.
                </p>
              </div>
            </div>

            {saveMut.isSuccess && (
              <Banner tone="success" title="Parâmetros salvos">Alterações aplicadas ao sistema.</Banner>
            )}
            {saveMut.isError && (
              <Banner tone="danger" title="Não foi possível salvar">
                {(saveMut.error as Error).message}
              </Banner>
            )}

            <button className="btn btn-primary" style={{ marginTop: 12 }}
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? "Salvando…" : "Salvar parâmetros"}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
