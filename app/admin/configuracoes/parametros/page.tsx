"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Banner } from "@/components/ui";
import { useRequireStaff } from "@/lib/use-require-auth";
import { selectionCallsApi, settingsApi } from "@/lib/api";
import type { SystemSettingsInput } from "@prouni/shared";

const EMPTY: SystemSettingsInput = {
  minimumWage: "1518.00",
  integralFactor: "1.50",
  parcialEnabled: false,
  parcialFactor: "3.00",
  call1Start: null, call1End: null,
  call2Start: null, call2End: null,
  waitlistStart: null, waitlistEnd: null,
  notifyCandidate: false,
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
    queryFn: () => selectionCallsApi.list(),
    enabled: !!user && isAdmin,
  });
  const hasCanonicalSchedule = (callsQuery.data?.length ?? 0) > 0;
  const legacyScheduleLocked =
    callsQuery.isLoading || callsQuery.isError || hasCanonicalSchedule;

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
        notifyCandidate: d.notifyCandidate,
        allowPendencyResubmission: d.allowPendencyResubmission,
        pendencyResubmissionDeadline: d.pendencyResubmissionDeadline,
      });
      setSeeded(true);
    }
  }, [query.data, seeded]);

  const set = <K extends keyof SystemSettingsInput>(k: K, v: SystemSettingsInput[K]) =>
    setForm((p) => ({ ...p, [k]: v }));
  const setDate = (k: keyof SystemSettingsInput, v: string) =>
    set(k, (v || null) as SystemSettingsInput[typeof k]);

  const saveMut = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: (data) => { qc.setQueryData(["admin", "settings"], data); },
  });

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

            {/* Cronograma */}
            <div className="card" style={{ marginBottom: 16 }}>
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
